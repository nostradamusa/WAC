-- ==============================================================================
-- WAC PROPERTIES EXTENSION
-- ==============================================================================
-- First-class real estate and property marketplace layer.
-- We use businesses_directory_v1 view logically, but for strict FK we'd check raw tables or skip FK if cross-view. 
-- Assuming business profiles live somewhere; WAC typically uses UUIDs. Let's make it UUID.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Core Types
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'short_term', 'long_term', 'commercial')),
  property_type TEXT NOT NULL CHECK (property_type IN ('house', 'apartment', 'villa', 'land', 'commercial_unit', 'hotel', 'guesthouse', 'multi_family', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'pending', 'sold', 'hidden')),
  
  -- Ownership / Trust
  owner_user_id UUID NOT NULL REFERENCES auth.users(id),
  -- We use businesses_directory_v1 view logically, but for strict FK we'd check raw tables or skip FK if cross-view. 
  -- Assuming business profiles live somewhere; WAC typically uses UUIDs. Let's make it UUID.
  representing_business_id UUID, 
  
  -- Financial
  price_amount NUMERIC NOT NULL,
  price_currency VARCHAR(3) DEFAULT 'EUR',
  pricing_period TEXT CHECK (pricing_period IN ('total', 'nightly', 'monthly', 'yearly')),
  is_price_public BOOLEAN DEFAULT true,
  
  -- Specs
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  parking_spaces INTEGER,
  square_meters NUMERIC,
  lot_size_sqm NUMERIC,
  year_built INTEGER,
  furnished_status TEXT CHECK (furnished_status IN ('unfurnished', 'semi_furnished', 'fully_furnished')),
  condition_status TEXT CHECK (condition_status IN ('new', 'excellent', 'good', 'needs_renovation')),
  
  -- Geolocation
  country TEXT NOT NULL,
  state_region TEXT,
  city TEXT NOT NULL,
  postal_code TEXT,
  address_line_1 TEXT, -- Typically hidden or approximated unless requested
  address_line_2 TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  geo_precision TEXT CHECK (geo_precision IN ('exact', 'street', 'city', 'state', 'country')),
  
  -- Contact Logic
  contact_mode TEXT DEFAULT 'profile_message' CHECK (contact_mode IN ('profile_message', 'business_contact', 'external_link', 'phone', 'email')),
  external_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  show_owner_profile BOOLEAN DEFAULT true,
  show_business_profile BOOLEAN DEFAULT true,
  
  -- Moderation & Priority
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- MEDIA TABLE
-- ==============================================================================
CREATE TABLE property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'floorplan')),
  url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- FEATURES TABLE (Taxonomy)
-- ==============================================================================
CREATE TABLE property_features (
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  feature_tag TEXT NOT NULL,
  PRIMARY KEY (property_id, feature_tag)
);

-- ==============================================================================
-- SECURITY (RLS)
-- ==============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view active/approved properties
CREATE POLICY "Public profiles are viewable by everyone" ON properties
  FOR SELECT USING (
    status = 'active' 
    AND moderation_status = 'approved'
  );

-- 2. Owners can view all their own properties regardless of status
CREATE POLICY "Users can view their own properties" ON properties
  FOR SELECT USING (auth.uid() = owner_user_id);

-- 3. Owners can insert/update/delete their own properties
CREATE POLICY "Users can insert their own properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete their own properties" ON properties
  FOR DELETE USING (auth.uid() = owner_user_id);

-- Media & Features inherit access cleanly
CREATE POLICY "Public can view active property media" ON property_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties WHERE properties.id = property_media.property_id
      AND properties.status = 'active'
      AND properties.moderation_status = 'approved'
    )
  );

CREATE POLICY "Owners manage their media" ON property_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties WHERE properties.id = property_media.property_id
      AND properties.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active property features" ON property_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties WHERE properties.id = property_features.property_id
      AND properties.status = 'active'
      AND properties.moderation_status = 'approved'
    )
  );

CREATE POLICY "Owners manage their features" ON property_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties WHERE properties.id = property_features.property_id
      AND properties.owner_user_id = auth.uid()
    )
  );

-- ==============================================================================
-- TRIGGER FOR UPDATED_AT
-- ==============================================================================
CREATE TRIGGER handle_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime(updated_at);
