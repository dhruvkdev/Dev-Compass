import { getRedis } from './client';

const VISITOR_KEY = 'devcompass:visitors:total';

export async function incrementVisitors(): Promise<number> {
	const count = await getRedis().incr(VISITOR_KEY);
	return count;
}

export async function getVisitorCount(): Promise<number> {
	const count = await getRedis().get(VISITOR_KEY);
	return count ? Number(count) : 0;
}
