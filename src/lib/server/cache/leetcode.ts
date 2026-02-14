import { fetchLeetCodeStats } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';
import { db } from '$lib/server/db';
import { user_leetcode_solved_problems, platform_handles } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

const LEETCODE_TTL = 60 * 60 * 2; // 2 hours

type SyncResult = {
  stats: any;
  gapDetected: boolean;
  lastSyncedAt: Date | null;
  solvedCount: number;
};

/**
 * Sync recent accepted submissions into user_leetcode_solved_problems.
 * Returns whether a "gap" was detected (all 20 submissions are new).
 */
async function syncRecentSubmissions(
  userId: string,
  recentSubmissions: { titleSlug: string }[]
): Promise<{ gapDetected: boolean }> {
  if (!recentSubmissions || recentSubmissions.length === 0) {
    return { gapDetected: false };
  }

  const slugs = recentSubmissions.map(s => s.titleSlug);

  // Check which of these slugs already exist in the DB
  const existing = await db
    .select({ problemSlug: user_leetcode_solved_problems.problemSlug })
    .from(user_leetcode_solved_problems)
    .where(
      and(
        eq(user_leetcode_solved_problems.userId, userId),
        inArray(user_leetcode_solved_problems.problemSlug, slugs)
      )
    );

  const existingSet = new Set(existing.map(e => e.problemSlug));
  const newSlugs = slugs.filter(s => !existingSet.has(s));

  // Insert new solved problems
  if (newSlugs.length > 0) {
    const now = new Date();
    await db
      .insert(user_leetcode_solved_problems)
      .values(
        newSlugs.map(slug => ({
          id: crypto.randomUUID(),
          userId,
          problemSlug: slug,
          createdAt: now,
          updatedAt: now
        }))
      )
      .onConflictDoNothing();

    console.log(`[LeetCode Sync] Inserted ${newSlugs.length} new solved problems for user ${userId}`);
  }

  // Update lastSyncedAt on platform_handles
  await db
    .update(platform_handles)
    .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(platform_handles.userId, userId),
        eq(platform_handles.platform, 'leetcode')
      )
    );

  // Gap detection: if ALL returned submissions are new, there might be a gap
  const gapDetected = recentSubmissions.length >= 20 && newSlugs.length === recentSubmissions.length;

  return { gapDetected };
}

export async function getLeetCodeStatsCached(username: string, userId?: string): Promise<SyncResult | null> {
  const key = redisKeys.leetcode(username);

  // 1️⃣ Check cache
  let stats = await getCache<any>(key);
  let fromCache = false;

  if (stats) {
    console.log('LeetCode cache HIT');
    fromCache = true;
  } else {
    console.log('LeetCode cache MISS');

    // 2️⃣ Fetch fresh
    stats = await fetchLeetCodeStats(username);
    if (!stats) return null;

    // 3️⃣ Store in cache
    await setCache(key, stats, LEETCODE_TTL);
  }

  // 4️⃣ Sync solved problems to DB (if userId is provided)
  let gapDetected = false;
  let lastSyncedAt: Date | null = null;
  let solvedCount = 0;

  if (userId) {
    try {
      // Sync recent submissions
      const syncResult = await syncRecentSubmissions(userId, stats.recentSubmissions || []);
      gapDetected = syncResult.gapDetected;

      // Get the lastSyncedAt and total solved count
      const [handleRow] = await db
        .select({ lastSyncedAt: platform_handles.lastSyncedAt })
        .from(platform_handles)
        .where(
          and(
            eq(platform_handles.userId, userId),
            eq(platform_handles.platform, 'leetcode')
          )
        );

      lastSyncedAt = handleRow?.lastSyncedAt ?? null;

      // Count total solved problems in DB
      const [countResult] = await db
        .select({ count: user_leetcode_solved_problems.id })
        .from(user_leetcode_solved_problems)
        .where(eq(user_leetcode_solved_problems.userId, userId));

      // Just count rows - we'll use a raw count approach
      const allSolved = await db
        .select({ problemSlug: user_leetcode_solved_problems.problemSlug })
        .from(user_leetcode_solved_problems)
        .where(eq(user_leetcode_solved_problems.userId, userId));

      solvedCount = allSolved.length;
    } catch (err) {
      console.error('[LeetCode Sync] Error syncing solved problems:', err);
      // Don't fail the whole request if sync fails
    }
  }

  return { stats, gapDetected, lastSyncedAt, solvedCount };
}
