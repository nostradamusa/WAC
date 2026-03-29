-- ==============================================================================
-- WAC PROPERTIES AUTO-PAUSE (GHOST TOWN PREVENTION)
-- ==============================================================================
-- Adds `last_renewed_at` tracking to properties to prevent stale listings.
-- If a property is older than 30 days and has not been renewed, it automatically
-- transitions its status to 'hidden'.
-- ==============================================================================

-- 1. Add tracking column
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ DEFAULT now();

-- 2. Backfill existing rows if any
UPDATE properties 
SET last_renewed_at = created_at 
WHERE last_renewed_at IS NULL;

-- 3. Create the sweeper function
CREATE OR REPLACE FUNCTION auto_pause_stale_properties()
RETURNS void AS $$
BEGIN
  -- We set status to 'hidden' for properties that haven't been renewed in 30 days
  UPDATE properties
  SET 
    status = 'hidden',
    updated_at = now()
  WHERE 
    status = 'active' 
    AND last_renewed_at < (now() - interval '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable pg_cron (if available) and schedule daily job
-- We wrap this in an anonymous block to silently ignore if pg_cron module is missing on local dev
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Try to unschedule if it exists to avoid duplicates
    PERFORM cron.unschedule('auto_pause_stale_properties_job');
    -- Run daily at 2:00 AM UTC
    PERFORM cron.schedule('auto_pause_stale_properties_job', '0 2 * * *', 'SELECT auto_pause_stale_properties();');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling failed: %', SQLERRM;
END;
$$;
