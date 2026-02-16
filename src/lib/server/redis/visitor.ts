import { redis } from './client';

const VISITOR_KEY = 'devcompass:visitors:total';

export async function incrementVisitors(): Promise<number> {
  const count = await redis.incr(VISITOR_KEY);
  return count;
}

export async function getVisitorCount(): Promise<number> {
  const count = await redis.get<number>(VISITOR_KEY);
  return count ?? 0;
}
