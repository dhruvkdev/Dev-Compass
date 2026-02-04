import { fetchAtCoderStats } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';

const ATCODER_TTL = 60 * 60 * 2; // 2 hours

export async function getAtCoderStatsCached(username: string) {
  const key = redisKeys.atcoder(username);

  // 1️⃣ Check cache
  const cached = await getCache<any>(key);
  if (cached) {
    console.log('AtCoder cache HIT');
    return cached;
  }

  console.log('AtCoder cache MISS');

  // 2️⃣ Fetch fresh
  const fresh = await fetchAtCoderStats(username);
  if (!fresh) return null;

  // 3️⃣ Store
  await setCache(key, fresh, ATCODER_TTL);

  return fresh;
}
