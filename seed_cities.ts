import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
};

type CompleteRawCity = {
  name: string;
  lat: string;
  lng: string;
  country: string;
};

async function main() {
  console.log("Downloading World Cities dataset...");
  try {
    const res = await fetch("https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json");
    const citiesData = (await res.json()) as RawCity[];

    console.log(`Fetched ${citiesData.length} total raw cities. Processing...`);

    // Clean up and filter
    const formattedCities = citiesData
      .filter((c): c is CompleteRawCity => Boolean(c.name && c.lat && c.lng && c.country))
      .map((c) => ({
        city_name: c.name,
        country_name: c.country, // it's usually a 2-letter code in this dataset, but sufficient for our ILIKE match
        lat: parseFloat(c.lat),
        lng: parseFloat(c.lng),
      }));

    console.log(`Preparing to insert ${formattedCities.length} complete city records...`);

    const CHUNK_SIZE = 2000;
    let insertedCount = 0;

    for (let i = 0; i < formattedCities.length; i += CHUNK_SIZE) {
      const chunk = formattedCities.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('wac_cities').insert(chunk);
      
      if (error) {
        console.error(`Error inserting chunk ${i} to ${i + CHUNK_SIZE}:`, error.message);
      } else {
        insertedCount += chunk.length;
        console.log(`Inserted ${insertedCount} / ${formattedCities.length} cities.`);
      }
    }

    console.log("✅ City Seeding Complete!");

  } catch (err) {
    console.error("Seeding failed:", err);
  }
}

main();
