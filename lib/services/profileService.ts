import { supabase } from "@/lib/supabase";
import type { EnrichedDirectoryPerson } from "./searchService";

export async function getPublicProfileByUsername(username: string): Promise<EnrichedDirectoryPerson | null> {
  try {
    const { data, error } = await supabase
      .from("v_people_directory_enriched")
      .select("*")
      .ilike("username", username)
      .limit(1)
      .single();

    if (error || !data) {
      if (error && error.code !== "PGRST116") {
        console.error("Error fetching public profile:", error);
      }
      return null;
    }

    // Map coalesced fields just like searchService does
    const p = data as EnrichedDirectoryPerson;
    return {
      ...p,
      company: p.current_company_coalesced,
      current_title: p.current_title_coalesced,
    };
  } catch (err) {
    console.error("Error fetching public profile:", err);
    return null;
  }
}
