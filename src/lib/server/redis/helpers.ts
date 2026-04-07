import redis from './client';

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
) {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}
