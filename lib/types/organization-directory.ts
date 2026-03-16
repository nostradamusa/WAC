export interface OrganizationDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organization_type: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  website: string | null;
  contact_email: string | null;
  leader_name: string | null;
  is_verified: boolean;
  created_at: string;
  logo_url?: string | null;
  google_maps_url?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  wac_rating?: number | null;
  wac_reviews_count?: number | null;
}
