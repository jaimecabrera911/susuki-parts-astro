import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vXi1yZC0FkSW@ep-young-sun-ay6bvrv0-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
  },
});
