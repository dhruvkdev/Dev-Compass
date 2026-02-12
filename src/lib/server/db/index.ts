import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dns from 'dns/promises';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const url = new URL(env.DATABASE_URL);
const originalHost = url.hostname;
const endpointId = originalHost.split('.')[0];

const addresses = await dns.resolve4(originalHost);
const ipv4Host = addresses[0];

const pool = new pg.Pool({
  host: ipv4Host,
  port: Number(url.port) || 5432,
  database: url.pathname.slice(1),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false, servername: originalHost },
  options: `endpoint=${endpointId}`,
});

export const db = drizzle(pool, { schema });
