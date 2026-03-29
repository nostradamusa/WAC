/**
 * Backfill wac_cities.state_name from the lutangar/cities.json dataset.
 *
 * The original seed script mapped city_name, country_name, lat, lng but skipped
 * the `admin1` field which contains state/province codes (e.g. "NJ", "CA").
 *
 * This script:
 * 1. Downloads the source dataset
 * 2. Builds a lookup by (city_name_lower, country_name, lat) → admin1
 * 3. Batch-updates wac_cities.state_name for all matching rows
 *
 * Run: npx tsx scripts/backfill_state_names.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

type RawCity = {
  name?: string;
  lat?: string;
  lng?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
};

async function main() {
  console.log("Downloading cities.json dataset...");
  const res = await fetch(
    "https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json",
  );
  const cities = (await res.json()) as RawCity[];
  console.log(`Fetched ${cities.length} cities from source.`);

  // Build lookup: key = "lat_rounded|lng_rounded|country" → admin1
  // Using lat/lng to match since city names can have duplicates
  const lookup = new Map<string, string>();
  let withAdmin1 = 0;
  for (const c of cities) {
    if (!c.name || !c.lat || !c.lng || !c.country || !c.admin1) continue;
    withAdmin1++;
    // Round to 3 decimal places for matching (handles minor float differences)
    const latR = parseFloat(c.lat).toFixed(3);
    const lngR = parseFloat(c.lng).toFixed(3);
    const key = `${latR}|${lngR}|${c.country}`;
    lookup.set(key, c.admin1);
  }
  console.log(`Built lookup with ${withAdmin1} entries that have admin1 data.`);

  // Fetch all wac_cities rows that need state_name
  const BATCH = 1000;
  let offset = 0;
  let updated = 0;
  let processed = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from("wac_cities")
      .select("id, lat, lng, country_name")
      .is("state_name", null)
      .range(offset, offset + BATCH - 1);

    if (error) {
      console.error("Fetch error:", error.message);
      break;
    }
    if (!rows || rows.length === 0) break;

    processed += rows.length;

    // Match each row to the lookup
    const updates: Array<{ id: string; state_name: string }> = [];
    for (const row of rows) {
      const lat = typeof row.lat === "string" ? parseFloat(row.lat) : row.lat;
      const lng = typeof row.lng === "string" ? parseFloat(row.lng) : row.lng;
      const latR = lat.toFixed(3);
      const lngR = lng.toFixed(3);
      const key = `${latR}|${lngR}|${row.country_name}`;
      const admin1 = lookup.get(key);
      if (admin1) {
        updates.push({ id: row.id, state_name: admin1 });
      }
    }

    // Batch upsert
    if (updates.length > 0) {
      const { error: updateErr } = await supabase
        .from("wac_cities")
        .upsert(updates, { onConflict: "id" });
      if (updateErr) {
        console.error("Update error:", updateErr.message);
      } else {
        updated += updates.length;
      }
    }

    console.log(`Processed ${processed} rows, updated ${updated} state_names so far...`);
    offset += BATCH;
  }

  console.log(`\n✅ Backfill complete: ${updated}/${processed} rows updated with state_name.`);

  // Verify
  const { data: sample } = await supabase
    .from("wac_cities")
    .select("city_name, state_name, country_name")
    .ilike("city_name", "riverdale")
    .eq("country_name", "US");
  console.log("\nVerification — Riverdale entries:");
  console.log(sample);
}

main().catch(console.error);
