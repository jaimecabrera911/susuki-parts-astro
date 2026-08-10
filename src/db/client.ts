import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const getConnectionString = () => {
  const url = import.meta.env?.DATABASE_URL || process.env?.DATABASE_URL;
  if (typeof url === 'string' && url.startsWith('postgres')) return url;
  return 'postgresql://neondb_owner:npg_vXi1yZC0FkSW@ep-young-sun-ay6bvrv0-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';
};

const pool = new Pool({ connectionString: getConnectionString() });
export const db = drizzle(pool, { schema });

export function getDb() {
  return db;
}

export type AppDb = typeof db;
