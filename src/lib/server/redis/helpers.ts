import { redis } from './client';

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get<T>(key);
  if (!data) return null;
  return data;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
) {
  await redis.set(key, value, {
    ex: ttlSeconds
  });
}
