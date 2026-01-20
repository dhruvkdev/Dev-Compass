import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { redis } from '$lib/server/redis';
import { ai_insights } from '$lib/server/db/schema';
import { getRichPayload } from '$lib/server/ai/payload-builder';
import { fetchLeetCodeStats, fetchCodeforcesStats, fetchGithubStats, fetchAtCoderStats } from '$lib/server/platforms';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const actions = {
    refreshAnalysis: async ({ locals }) => {
        // 1. Auth Check
        // 1. Auth Check
        if (!locals.user) return fail(401);
        const userId = locals.user.id;

        // 2. Redis Cooldown Check (The "Bouncer")
        const cooldownKey = `cooldown:${userId}`;
        if (await redis.get(cooldownKey)) {
            return fail(429, { message: "Analysis cool-down active. Please wait." });
        }

        try {
            // 3. Fetch Raw Data (Your "Rich Payload" logic here)
            const stats = await getRichPayload(userId);

            // 4. Call n8n
            const response = await fetch(env.N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-secret-key': env.N8N_SECRET_KEY
                },
                body: JSON.stringify({ userId, stats }) // Pass your real stats here
            });

            const n8nData = await response.json();

            // --- CRITICAL STEP: Handle the Array ---
            // n8n returns [ { summary: "..." } ], so we take index 0
            const aiAnalysis = Array.isArray(n8nData) ? n8nData[0] : n8nData;

            // 5. Save to Postgres
            await db.insert(ai_insights).values({
                id: crypto.randomUUID(),
                userId: userId,
                contextType: 'global_summary',
                insights: aiAnalysis, // Drizzle handles JSON stringifying automatically
                platform: null,
                createdAt: new Date(),
                updatedAt: new Date()
            }).onConflictDoUpdate({
                target: [ai_insights.userId, ai_insights.contextType],
                set: {
                    insights: aiAnalysis,
                    updatedAt: new Date()
                }
            });

            // 6. Set Redis Cooldown (1 hour)
            await redis.set(cooldownKey, "true", { ex: 3600 });

            return { success: true };

        } catch (error) {
            console.error("Pipeline Failed:", error);
            return fail(500, { message: "AI pipeline error." });
        }
    },

    compare: async ({ request, locals }) => {
        if (!locals.user) return fail(401);

        const data = await request.formData();
        const platform = data.get('platform')?.toString();
        const targetHandle = data.get('targetHandle')?.toString();

        if (!platform || !targetHandle) {
            return fail(400, { message: "Platform and handle required." });
        }

        try {
            let stats = null;
            if (platform === 'leetcode') stats = await fetchLeetCodeStats(targetHandle);
            else if (platform === 'codeforces') stats = await fetchCodeforcesStats(targetHandle);
            else if (platform === 'github') stats = await fetchGithubStats(targetHandle, ''); // Public fetch
            else if (platform === 'atcoder') stats = await fetchAtCoderStats(targetHandle);

            if (!stats) return fail(404, { message: "User not found or API error." });

            return { success: true, comparisonData: stats, platform, targetHandle };
        } catch (error) {
            console.error("Comparison Error:", error);
            return fail(500, { message: "Comparison failed." });
        }
    }
};

export const load = async ({ locals }) => {
    if (!locals.user) return fail(401);
    const userId = locals.user.id;

    // Fetch latest global summary
    const [insight] = await db.select().from(ai_insights)
        .where(and(eq(ai_insights.userId, userId), eq(ai_insights.contextType, 'global_summary')))
        .limit(1);

    return {
        user: locals.user,
        insight: insight?.insights ?? null
    };
};