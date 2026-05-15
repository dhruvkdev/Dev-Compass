import { fetchCodeforcesStats, type CodeforcesResult } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';

const CODEFORCES_TTL = 60 * 60 * 2; // 2 hours

export async function getCodeforcesStatsCached(username: string): Promise<CodeforcesResult> {
  const key = redisKeys.codeforces(username);

  // 1️⃣ Check cache
  const cached = await getCache<any>(key);
  if (cached) {
    return { success: true, data: cached };
  }

  // 2️⃣ Fetch fresh
  const result = await fetchCodeforcesStats(username);
  
  if (!result.success) {
      return result;
  }

  // 3️⃣ Store (only data)
  await setCache(key, result.data, CODEFORCES_TTL);

  return result;
}
