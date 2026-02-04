import { fetchLeetCodeStats } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';

const LEETCODE_TTL = 60 * 60 * 2; // 2 hours

export async function getLeetCodeStatsCached(username: string) {
  const key = redisKeys.leetcode(username);

  // 1️⃣ Check cache
  const cached = await getCache<any>(key);
  if (cached) {
    console.log('LeetCode cache HIT');
    return cached;
  }

  console.log('LeetCode cache MISS');

  // 2️⃣ Fetch fresh
  const fresh = await fetchLeetCodeStats(username);
  if (!fresh) return null;

  // 3️⃣ Store
  await setCache(key, fresh, LEETCODE_TTL);

  return fresh;
}
