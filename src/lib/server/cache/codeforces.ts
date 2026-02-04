import { fetchCodeforcesStats } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';

const CODEFORCES_TTL = 60 * 60 * 2; // 2 hours

export async function getCodeforcesStatsCached(username: string) {
  const key = redisKeys.codeforces(username);

  // 1️⃣ Check cache
  const cached = await getCache<any>(key);
  if (cached) {
    console.log('Codeforces cache HIT');
    return cached;
  }

  console.log('Codeforces cache MISS');

  // 2️⃣ Fetch fresh
  const fresh = await fetchCodeforcesStats(username);
  if (!fresh) return null;

  // 3️⃣ Store
  await setCache(key, fresh, CODEFORCES_TTL);

  return fresh;
}
