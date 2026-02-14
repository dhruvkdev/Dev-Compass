import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  // Recommended for Railway/Cloud DBs:
  keepAlive: true,
  allowExitOnIdle: false, // Prevents the process from exiting if the pool is idle
});

// CRITICAL: Catch errors on the pool itself
pool.on('error', (err) => {
  console.error('Postgres Pool Error:', err);
});

export const db = drizzle(pool, { schema });