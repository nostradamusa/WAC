/**
 * Backfill state_name for US cities in wac_cities.
 * Reads pre-generated SQL batch files and executes them via Supabase.
 *
 * Run: npx tsx scripts/run_state_backfill.ts
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
const TEMP_DIR = "C:/Users/Admin/AppData/Local/Temp";

async function executeSql(sql: string): Promise<boolean> {
  // Use Supabase's PostgREST-compatible SQL endpoint via the pg_net extension
  // Actually, use the Supabase management API's SQL endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  // This won't work for raw SQL. Use a different approach.
  return false;
}

async function main() {
  // Count batch files
  let totalFiles = 0;
  while (fs.existsSync(path.join(TEMP_DIR, `us_sm_${totalFiles}.sql`))) totalFiles++;
  console.log(`Found ${totalFiles} batch files to execute.`);

  // We'll use the Supabase client to call a custom RPC function
  // But since that doesn't exist, let's create one temporarily

  // Actually, let's use fetch to call the Supabase SQL API directly
  // The pg-meta API allows arbitrary SQL execution
  const pgMetaUrl = SUPABASE_URL.replace('.supabase.co', '.supabase.co');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < totalFiles; i++) {
    const sqlFile = path.join(TEMP_DIR, `us_sm_${i}.sql`);
    const sql = fs.readFileSync(sqlFile, "utf8");

    try {
      // Use the Supabase SQL endpoint (available through the dashboard API)
      const res = await fetch(`${SUPABASE_URL}/pg/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        success++;
      } else {
        failed++;
        if (i === 0) {
          const err = await res.text();
          console.log(`Batch 0 error (${res.status}):`, err.slice(0, 300));
        }
      }
    } catch (e) {
      failed++;
      if (i === 0) console.log("Fetch error:", e);
    }

    if ((i + 1) % 10 === 0 || i === totalFiles - 1) {
      console.log(`Progress: ${i + 1}/${totalFiles} (${success} ok, ${failed} failed)`);
    }
  }
}

main().catch(console.error);
