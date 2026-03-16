// Types for the Interactive Network Feed


export interface NetworkPost {
  id: string
  submitted_by: string
  
  author_profile_id: string | null
  author_business_id: string | null
  author_organization_id: string | null
  
  content: string
  post_type: 'general' | 'opportunity' | 'ask'
  image_url: string | null
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
  
  // Reposting 
  repost_count?: number
  original_post_id?: string | null
  
  // Joined relations
  author_profile?: { full_name: string | null; username: string | null; headline: string | null; avatar_url: string | null; is_verified: boolean }
  author_business?: { name: string; slug: string; business_type: string | null; logo_url: string | null; is_verified: boolean }
  author_organization?: { name: string; slug: string; organization_type: string | null; logo_url: string | null; is_verified: boolean }
  
  // Hydrated Repost Relation
  original_post?: any

  // Client state
  user_reaction_type?: 'like' | 'heart' | 'laugh' | 'applause' | null
}

export interface NetworkComment {
  id: string
  post_id: string
  submitted_by: string
  
  author_profile_id: string | null
  author_business_id: string | null
  author_organization_id: string | null
  
  content: string
  created_at: string
  updated_at: string
  
  // Joined relations
  author_profile?: { full_name: string | null; username: string | null; headline: string | null; avatar_url: string | null; is_verified: boolean }
  author_business?: { name: string; slug: string; business_type: string | null; logo_url: string | null; is_verified: boolean }
  author_organization?: { name: string; slug: string; organization_type: string | null; logo_url: string | null; is_verified: boolean }
}

export interface NetworkLike {
  id: string
  post_id: string
  profile_id: string
  created_at: string
}
