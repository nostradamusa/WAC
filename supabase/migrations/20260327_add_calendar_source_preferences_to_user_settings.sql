alter table public.user_settings
add column if not exists calendar_source_preferences jsonb not null
default '{"wac": true, "org": true, "group": true, "business": true}'::jsonb;
