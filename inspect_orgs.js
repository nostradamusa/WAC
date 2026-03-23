async function inspect() {
  const { createClient } = await import("@supabase/supabase-js");
  const dotenv = await import("dotenv");
  dotenv.config({ path: ".env.local" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('organizations_directory_v1')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Cols:", Object.keys(data[0] || {}));
  }
}

void inspect();
