// Standalone DB client for use in scripts (no SvelteKit dependencies)
// This file can be imported using relative paths from scripts/
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  keepAlive: true,
  allowExitOnIdle: false,
});

pool.on('error', (err) => {
  console.error('Postgres Pool Error:', err);
});

export const db = drizzle(pool, { schema });
