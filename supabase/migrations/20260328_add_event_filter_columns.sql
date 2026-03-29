-- Add category, format, and audience columns to the events table
-- so the Events filter workspace can query on real structured data.
-- Safe to re-run.

ALTER TABLE events ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS format   text NOT NULL DEFAULT 'in_person'
  CHECK (format IN ('in_person', 'online', 'hybrid'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS audience  text NOT NULL DEFAULT 'general'
  CHECK (audience IN ('general', 'family', 'youth', 'professionals'));

CREATE INDEX IF NOT EXISTS events_category_idx ON events(category);
CREATE INDEX IF NOT EXISTS events_format_idx   ON events(format);
CREATE INDEX IF NOT EXISTS events_audience_idx ON events(audience);
