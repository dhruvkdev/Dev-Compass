import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { platform_handles, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

import { generateVerificationToken, verifyProfile } from '$lib/server/verification';

export const load = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/login');

    const userId = locals.user.id;

    // Fetch user details (for goal)
    const [userData] = await db.select().from(user).where(eq(user.id, userId));

    // Fetch existing handles
    const handlesData = await db.select().from(platform_handles).where(eq(platform_handles.userId, userId));

    // Transform handles into a richer object
    const handles: Record<string, { handle: string, verificationToken?: string | null, verifiedAt?: Date | null }> = {};
    handlesData.forEach(h => {
        handles[h.platform] = {
            handle: h.handle,
            verificationToken: h.verificationToken,
            verifiedAt: h.verifiedAt
        };
    });

    return {
        user: userData,
        handles
    };
};

export const actions = {
    updateGoal: async ({ request, locals }) => {
        if (!locals.user) return fail(401);
        const userId = locals.user.id;
        const data = await request.formData();
        const goal = data.get('goal')?.toString() ?? '';
        try {
            await db.update(user).set({ goal, updatedAt: new Date() }).where(eq(user.id, userId));
            return { success: true, message: "Career goal updated." };
        } catch (error) {
            return fail(500, { message: "Failed to update goal." });
        }
    },

    updateHandles: async ({ request, locals }) => {
        if (!locals.user) return fail(401);
        const userId = locals.user.id;
        const data = await request.formData();
        const platforms = ['leetcode', 'codeforces', 'github', 'geeksforgeeks', 'atcoder', 'hackerrank', 'codechef'];

        try {
            for (const platform of platforms) {
                const handle = data.get(platform)?.toString().trim();
                if (handle) {
                    await db.insert(platform_handles).values({
                        id: crypto.randomUUID(),
                        userId: userId,
                        platform: platform as any,
                        handle: handle,
                        url: '',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }).onConflictDoUpdate({
                        target: [platform_handles.userId, platform_handles.platform],
                        set: {
                            handle: handle,
                            // Reset verification if handle changes
                            verifiedAt: null,
                            verificationToken: null,
                            updatedAt: new Date()
                        }
                    });
                }
            }
            return { success: true, message: "Platform handles updated." };
        } catch (error) {
            console.error(error);
            return fail(500, { message: "Failed to update handles." });
        }
    },

    generateToken: async ({ request, locals }) => {
        if (!locals.user) return fail(401);
        const userId = locals.user.id;
        const data = await request.formData();
        const platform = data.get('platform')?.toString();

        if (!platform) return fail(400, { message: "Platform required" });

        const token = generateVerificationToken(userId);

        await db.update(platform_handles)
            .set({ verificationToken: token, updatedAt: new Date() })
            .where(and(eq(platform_handles.userId, userId), eq(platform_handles.platform, platform as any)));

        return { success: true, message: "Token generated." };
    },

    verifyProfile: async ({ request, locals }) => {
        if (!locals.user) return fail(401);
        const userId = locals.user.id;
        const data = await request.formData();
        const platform = data.get('platform')?.toString();

        if (!platform) return fail(400, { message: "Platform required" });

        // Get saved handle and token
        const [record] = await db.select().from(platform_handles)
            .where(and(eq(platform_handles.userId, userId), eq(platform_handles.platform, platform as any)));

        if (!record || !record.verificationToken) {
            return fail(400, { message: "No verification pending." });
        }

        const isVerified = await verifyProfile(platform, record.handle, record.verificationToken);

        if (isVerified) {
            await db.update(platform_handles)
                .set({ verifiedAt: new Date(), updatedAt: new Date() })
                .where(eq(platform_handles.id, record.id));
            return { success: true, message: "Profile verified successfully!" };
        } else {
            return fail(400, { message: "Verification failed. Token not found in profile." });
        }
    }
};
