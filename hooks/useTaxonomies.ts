import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export type TaxonomyOption = {
  id: string;
  name: string;
};

export function useTaxonomies() {
  const [industries, setIndustries] = useState<TaxonomyOption[]>([]);
  const [professions, setProfessions] = useState<TaxonomyOption[]>([]);
  const [skills, setSkills] = useState<TaxonomyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTaxonomies() {
      setIsLoading(true);
      try {
        const [indRes, profRes, skillRes] = await Promise.all([
          supabase.from("industries").select("id, name").order("name"),
          supabase.from("professions").select("id, name").order("name"),
          supabase.from("skills").select("id, name").order("name"),
        ]);

        if (!indRes.error && indRes.data) {
          setIndustries(indRes.data as TaxonomyOption[]);
        }
        if (!profRes.error && profRes.data) {
          setProfessions(profRes.data as TaxonomyOption[]);
        }
        if (!skillRes.error && skillRes.data) {
          setSkills(skillRes.data as TaxonomyOption[]);
        }
      } catch (error) {
        console.error("Failed to load taxonomies:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTaxonomies();
  }, []);

  return {
    industries,
    professions,
    skills,
    isLoading
  };
}
