import { fetchGithubStats } from '$lib/server/platforms';
import { getCache, setCache } from '$lib/server/redis/helpers';
import { redisKeys } from '$lib/server/redis/keys';
import type { GithubStats } from '$lib/server/github/types';

const GITHUB_TTL = 60 * 60 * 24; // 1 Day

export async function getGithubStatsCached(username: string): Promise<GithubStats | null> {
  const key = redisKeys.github(username);

  // 1️⃣ Check cache
  const cached = await getCache<GithubStats>(key);
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
