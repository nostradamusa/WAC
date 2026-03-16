import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env explicitly from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);

  const end = new Date(tomorrow);
  end.setHours(23, 0, 0, 0);

  const { data, error } = await supabase.from('events').insert([
    {
      title: 'Albanian Professionals Summer Gala',
      description: 'Join us for an elegant evening at the annual Summer Gala. Network with top professionals across the diaspora. Open bar, live music, and special guest speakers.',
      start_time: tomorrow.toISOString(),
      end_time: end.toISOString(),
      location_name: 'The Plaza Hotel',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      event_type: 'Social',
      visibility: 'Public'
    }
  ]);

  if (error) {
    console.error("Error creating event:", error);
  } else {
    console.log("Mock Gala created successfully!");
  }
}

main();
