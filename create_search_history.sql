-- ─────────────────────────────────────────────
-- Search History & Recently Viewed
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- 1. Text search terms
create table if not exists search_history (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  term         text        not null,
  searched_at  timestamptz default now() not null
);

-- Upsert by user + normalised term so duplicates just bump the timestamp
create unique index if not exists search_history_user_term_idx
  on search_history (user_id, lower(trim(term)));

alter table search_history enable row level security;

create policy "Users manage own search history"
  on search_history for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. Recently viewed profiles / businesses / organizations
create table if not exists recently_viewed (
  id               uuid        default gen_random_uuid() primary key,
  user_id          uuid        references auth.users(id) on delete cascade not null,
  entity_id        uuid        not null,
  entity_type      text        not null check (entity_type in ('profile', 'business', 'organization')),
  name             text        not null,
  avatar_url       text,
  username_or_slug text,
  verified         boolean     default false,
  viewed_at        timestamptz default now() not null
);

create unique index if not exists recently_viewed_user_entity_idx
  on recently_viewed (user_id, entity_id, entity_type);

alter table recently_viewed enable row level security;

create policy "Users manage own recently viewed"
  on recently_viewed for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
