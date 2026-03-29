export type ListingType = "sale" | "short_term" | "long_term" | "commercial";

export type PropertyType = 
  | "house" 
  | "apartment" 
  | "villa" 
  | "land" 
  | "commercial_unit" 
  | "hotel" 
  | "guesthouse" 
  | "multi_family" 
  | "other";

export type PropertyStatus = "draft" | "active" | "pending" | "sold" | "hidden";

export type PricingPeriod = "total" | "nightly" | "monthly" | "yearly";

export type FurnishedStatus = "unfurnished" | "semi_furnished" | "fully_furnished";

export type ConditionStatus = "new" | "excellent" | "good" | "needs_renovation";

export type GeoPrecision = "exact" | "street" | "city" | "state" | "country";

export type ContactMode = "profile_message" | "business_contact" | "external_link" | "phone" | "email";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type PropertyMedia = {
  id: string;
  property_id: string;
  media_type: "image" | "video" | "floorplan";
  url: string;
  display_order: number;
  is_cover: boolean;
  created_at: string;
};

export type PropertyFeature = {
  property_id: string;
  feature_tag: string;
};

// Represents the raw row from the `properties` table
export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  
  listing_type: ListingType;
  property_type: PropertyType;
  status: PropertyStatus;
  
  owner_user_id: string;
  representing_business_id: string | null;
  
  price_amount: number;
  price_currency: string;
  pricing_period: PricingPeriod | null;
  is_price_public: boolean;
  
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  square_meters: number | null;
  lot_size_sqm: number | null;
  year_built: number | null;
  furnished_status: FurnishedStatus | null;
  condition_status: ConditionStatus | null;
  
  country: string;
  state_region: string | null;
  city: string;
  postal_code: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_precision: GeoPrecision | null;
  
  contact_mode: ContactMode;
  external_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  show_owner_profile: boolean;
  show_business_profile: boolean;
  
  is_verified: boolean;
  is_featured: boolean;
  moderation_status: ModerationStatus;
  
  created_at: string;
  updated_at: string;
};

// Represents the enriched Property returned by the API joined with relations
export type EnrichedProperty = PropertyRow & {
  // Attached relations via JOINs
  media: PropertyMedia[];
  features: string[]; // mapped from property_features
  
  owner: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    username: string;
    is_verified: boolean;
    headline?: string | null;
    city?: string | null;
    country?: string | null;
  };
  
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
    is_verified: boolean;
    industry_name?: string | null;
  } | null;
};
