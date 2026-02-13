import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { platform_handles, user } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  autoVerifyGitHub,
  checkGitHubOAuthVerification,
  generateCodeforcesToken,
  verifyCodeforcesToken,
  generateLeetCodeToken,
  verifyLeetCodeBio
} from '$lib/server/verification';

export const load = async ({ locals }) => {
  if (!locals.user) throw redirect(302, '/signin');

  const userId = locals.user.id;

  // Fetch user details
  const [userData] = await db.select().from(user).where(eq(user.id, userId));

  // Fetch existing handles
  const handlesData = await db
    .select()
    .from(platform_handles)
    .where(eq(platform_handles.userId, userId));

  // Transform handles into a map
  const handles: Record<
    string,
    {
      handle: string;
      verificationToken?: string | null;
      verifiedAt?: Date | null;
    }
  > = {};

  handlesData.forEach((h) => {
    handles[h.platform] = {
      handle: h.handle,
      verificationToken: h.verificationToken,
      verifiedAt: h.verifiedAt
    };
  });

  // Check if user signed up with GitHub OAuth
  const githubOAuth = await checkGitHubOAuthVerification(userId);

  return {
    user: userData,
    handles,
    githubOAuth: {
      hasOAuth: githubOAuth.verified,
      username: githubOAuth.username
    }
  };
};

export const actions = {
  /**
   * Auto-verify GitHub if user signed up with GitHub OAuth
   */
  verifyGitHub: async ({ locals }) => {
    if (!locals.user) return fail(401);
    const userId = locals.user.id;

    const success = await autoVerifyGitHub(userId);

    if (success) {
      return { success: true, message: 'GitHub verified successfully!' };
    } else {
      return fail(400, {
        message: 'GitHub verification failed. Make sure you signed up with GitHub.'
      });
    }
  },

  /**
   * Generate a verification token for Codeforces
   */
  generateCodeforcesToken: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const userId = locals.user.id;
    const data = await request.formData();

    const handle = data.get('handle')?.toString().trim();

    if (!handle) {
      return fail(400, { message: 'Codeforces handle is required' });
    }

    const token = generateCodeforcesToken();

    // Store the handle with pending verification token
    await db
      .insert(platform_handles)
      .values({
        id: crypto.randomUUID(),
        userId,
        platform: 'codeforces',
        handle,
        url: `https://codeforces.com/profile/${handle}`,
        verificationToken: token,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [platform_handles.userId, platform_handles.platform],
        set: {
          handle,
          url: `https://codeforces.com/profile/${handle}`,
          verificationToken: token,
          verifiedAt: null, // Reset verification if handle changes
          updatedAt: new Date()
        }
      });

    return { success: true, message: 'Token generated!', token };
  },

  /**
   * Verify Codeforces by checking profile for token
   */
  verifyCodeforces: async ({ locals }) => {
    if (!locals.user) return fail(401);
    const userId = locals.user.id;

    // Get saved handle and token
    const [record] = await db
      .select()
      .from(platform_handles)
      .where(
        and(
          eq(platform_handles.userId, userId),
          eq(platform_handles.platform, 'codeforces')
        )
      );

    if (!record || !record.verificationToken) {
      return fail(400, { message: 'No verification pending. Generate a token first.' });
    }

    const result = await verifyCodeforcesToken(record.handle, record.verificationToken);

    if (result.verified) {
      await db
        .update(platform_handles)
        .set({
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(platform_handles.id, record.id));

      return { success: true, message: 'Codeforces verified successfully!' };
    } else {
      return fail(400, { message: result.error || 'Verification failed' });
    }
  },

  /**
   * Generate a verification token for LeetCode
   */
  generateLeetCodeToken: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const userId = locals.user.id;
    const data = await request.formData();

    const handle = data.get('handle')?.toString().trim();

    if (!handle) {
      return fail(400, { message: 'LeetCode username is required' });
    }

    const token = generateLeetCodeToken();

    // Store the handle with pending verification token
    await db
      .insert(platform_handles)
      .values({
        id: crypto.randomUUID(),
        userId,
        platform: 'leetcode',
        handle,
        url: `https://leetcode.com/u/${handle}`,
        verificationToken: token,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [platform_handles.userId, platform_handles.platform],
        set: {
          handle,
          url: `https://leetcode.com/u/${handle}`,
          verificationToken: token,
          verifiedAt: null, // Reset verification if handle changes
          updatedAt: new Date()
        }
      });

    return { success: true, message: 'Token generated!', token };
  },

  /**
   * Verify LeetCode by checking bio for token
   */
  verifyLeetCode: async ({ locals }) => {
    if (!locals.user) return fail(401);
    const userId = locals.user.id;

    // Get saved handle and token
    const [record] = await db
      .select()
      .from(platform_handles)
      .where(
        and(
          eq(platform_handles.userId, userId),
          eq(platform_handles.platform, 'leetcode')
        )
      );

    if (!record || !record.verificationToken) {
      return fail(400, { message: 'No verification pending. Generate a token first.' });
    }

    const result = await verifyLeetCodeBio(record.handle, record.verificationToken);

    if (result.verified) {
      await db
        .update(platform_handles)
        .set({
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(platform_handles.id, record.id));

      return { success: true, message: 'LeetCode verified successfully!' };
    } else {
      return fail(400, { message: result.error || 'Verification failed' });
    }
  }
};
