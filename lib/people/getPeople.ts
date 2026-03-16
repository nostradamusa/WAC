import { supabase } from "@/lib/supabase"
import type { PeopleDirectoryFilters } from "@/lib/types/filters"
import type { Person } from "@/lib/types/person"

export async function getPeople(
  filters: PeopleDirectoryFilters = {}
): Promise<Person[]> {
  let query = supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      industry,
      profession,
      specialty,
      company,
      city,
      state,
      country,
      ancestry_city
    `)
    .eq("is_public", true)

  if (filters.country) {
    query = query.eq("country", filters.country)
  }

  if (filters.state) {
    query = query.eq("state", filters.state)
  }

  if (filters.city) {
    query = query.eq("city", filters.city)
  }

  if (filters.ancestry_city) {
    query = query.eq("ancestry_city", filters.ancestry_city)
  }

  if (filters.industry) {
    query = query.eq("industry", filters.industry)
  }

  if (filters.profession) {
    query = query.eq("profession", filters.profession)
  }

  if (filters.specialty) {
    query = query.eq("specialty", filters.specialty)
  }

  if (filters.q) {
    query = query.or(
      [
        `full_name.ilike.%${filters.q}%`,
        `username.ilike.%${filters.q}%`,
        `company.ilike.%${filters.q}%`,
        `profession.ilike.%${filters.q}%`,
        `specialty.ilike.%${filters.q}%`,
        `city.ilike.%${filters.q}%`,
        `ancestry_city.ilike.%${filters.q}%`
      ].join(",")
    )
  }

  const { data, error } = await query.order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching people:", error)
    return []
  }

  return (data ?? []) as Person[]
}