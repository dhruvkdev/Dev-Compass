import { getRedis } from './client';

export async function getCache<T>(key: string): Promise<T | null> {
	const data = await getRedis().get<T>(key);


	if (data == null) return null;
	return data;
}

export async function setCache<T>(
	key: string,
	value: T,
	ttlSeconds: number
) {
	await getRedis().set(key, value, { ex: ttlSeconds });
}
