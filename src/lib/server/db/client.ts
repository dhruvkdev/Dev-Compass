import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

type DB = ReturnType<typeof drizzle<typeof schema>>;

let instance: DB | undefined;

function createDb(): DB {
	const url = process.env.DATABASE_URL;
	if (!url) {
		throw new Error('DATABASE_URL is not set');
	}
	return drizzle({ client: neon(url), schema });
}

/** Lazy so `vite build` can bundle SSR without DB credentials at build time. */
export function getDb(): DB {
	if (!instance) instance = createDb();
	return instance;
}

export const db = new Proxy({} as DB, {
	get(_target, prop, receiver) {
		const d = getDb();
		const value = Reflect.get(d as object, prop, receiver);
		if (typeof value === 'function') {
			return (value as (...args: unknown[]) => unknown).bind(d);
		}
		return value;
	},
}) as DB;
