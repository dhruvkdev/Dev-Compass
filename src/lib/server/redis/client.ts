import 'dotenv/config';
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
	throw new Error(
		'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (Upstash REST API credentials from the Upstash console).'
	);
}

const redis = new Redis({ url, token });

export default redis;