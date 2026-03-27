create table if not exists public.user_calendar_entity_subscriptions (
  user_id uuid not null,
  entity_type text not null check (entity_type in ('organization', 'group', 'business')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

alter table public.user_calendar_entity_subscriptions enable row level security;

create policy "Users can read their own calendar entity subscriptions"
on public.user_calendar_entity_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own calendar entity subscriptions"
on public.user_calendar_entity_subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own calendar entity subscriptions"
on public.user_calendar_entity_subscriptions
for delete
to authenticated
using (auth.uid() = user_id);
