import { fetchGithubStats } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';

const GITHUB_TTL = 60 * 60 * 2; // 2 hours

export async function getGithubStatsCached(username: string) {
  const key = redisKeys.github(username);

  // 1️⃣ Check cache
  const cached = await getCache<any>(key);
  if (cached) {
    console.log('GitHub cache HIT');
    return cached;
  }

  console.log('GitHub cache MISS');

  // 2️⃣ Fetch fresh
  const fresh = await fetchGithubStats(username);
  if (!fresh) return null;

  // 3️⃣ Store
  await setCache(key, fresh, GITHUB_TTL);

  return fresh;
}
