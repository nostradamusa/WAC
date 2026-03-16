import { readFileSync } from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Construct connection string from Supabase credentials if DATABASE_URL is not set
// Or use postgres equivalent
async function run() {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString && process.env.NEXT_PUBLIC_SUPABASE_URL) {
     // A fallback attempt we can't fully guarantee without connection string, but we can try if they have it
     console.log("No DATABASE_URL found to run raw SQL. The user needs to run it in the SQL Editor.");
     process.exit(1);
  }

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log("Connected to DB...");
    const sql = readFileSync(path.resolve(process.cwd(), 'wac_events_geocoding.sql'), 'utf-8');
    await client.query(sql);
    console.log("Successfully ran wac_events_geocoding.sql!");
  } catch (err) {
    console.error("Failed to run SQL:", err);
  } finally {
    await client.end();
  }
}

run();
