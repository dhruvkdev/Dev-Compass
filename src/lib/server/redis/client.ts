import 'dotenv/config';
import { Redis } from '@upstash/redis';

let client: Redis | undefined;

/** Lazy client so `vite build` can bundle SSR without Upstash env at build time. */
export function getRedis(): Redis {
	if (client) return client;

	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;

	if (!url || !token) {
		throw new Error(
			'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (Upstash REST API credentials from the Upstash console).'
		);
	}

	client = new Redis({ url, token });
	return client;
}
