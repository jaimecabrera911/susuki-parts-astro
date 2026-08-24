import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Adding attributes jsonb column to part_variants table...');
  try {
    await sql`
      ALTER TABLE part_variants 
      ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '[]'::jsonb;
    `;
    console.log('Successfully added attributes column to part_variants.');
  } catch (err) {
    console.error('Error modifying part_variants table:', err);
  }
}

run();
