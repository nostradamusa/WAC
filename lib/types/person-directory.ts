export type PersonDirectoryRow = {
  id: string;

  username: string | null;
  full_name: string | null;
  headline: string | null;

  profession: string | null;
  profession_name: string | null;
  profession_slug: string | null;

  specialty_name: string | null;
  specialty_slug: string | null;

  industry_name: string | null;
  industry_slug: string | null;

  company: string | null;
  bio: string | null;

  country: string | null;
  state: string | null;
  city: string | null;
  
  ancestry_country: string | null;
  ancestry_city: string | null;
  ancestry_village: string | null;

  avatar_url: string | null;
  website: string | null;
  linkedin: string | null;

  is_verified: boolean;

  open_to_work: boolean;
  open_to_hire: boolean;
  open_to_mentor: boolean;
  open_to_invest: boolean;
  open_to_collaborate: boolean;

  skills: string[] | null;
};