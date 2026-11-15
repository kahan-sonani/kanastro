-- Kanastro. Apply once through the Supabase SQL editor or Supabase CLI.
begin;
create table public.kundli_profiles (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  record jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint record_is_object check (jsonb_typeof(record) = 'object'),
  constraint matching_profile_id check (coalesce(record->>'id' = id::text, false)),
  constraint bounded_record check (octet_length(record::text) <= 40000),
  constraint profile_has_name check (coalesce(jsonb_typeof(record->'name') = 'string' and length(trim(record->>'name')) between 1 and 120, false)),
  constraint profile_has_birth_data check (record ?& array['date','time','place','latitude','longitude','timeZone','certainty','disambiguation','notes','createdAt','updatedAt']),
  constraint bounded_notes check (coalesce(jsonb_typeof(record->'notes') = 'string' and length(record->>'notes') <= 20000, false)),
  constraint bounded_coordinates check (coalesce(jsonb_typeof(record->'latitude') = 'number' and jsonb_typeof(record->'longitude') = 'number' and (record->>'latitude')::numeric > -90 and (record->>'latitude')::numeric < 90 and (record->>'longitude')::numeric between -180 and 180, false))
);
create index kundli_profiles_owner_idx on public.kundli_profiles(owner_id, updated_at desc);
alter table public.kundli_profiles enable row level security;
alter table public.kundli_profiles force row level security;
create policy profiles_select on public.kundli_profiles for select to authenticated using ((select auth.uid()) = owner_id);
create policy profiles_insert on public.kundli_profiles for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy profiles_update on public.kundli_profiles for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy profiles_delete on public.kundli_profiles for delete to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.kundli_profiles from public, anon, authenticated;
grant select, insert, update, delete on public.kundli_profiles to authenticated;

create table public.account_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null,
  constraint bounded_settings check (jsonb_typeof(settings) = 'object' and octet_length(settings::text) <= 4000)
);
alter table public.account_preferences enable row level security;
alter table public.account_preferences force row level security;
create policy preferences_select on public.account_preferences for select to authenticated using ((select auth.uid()) = owner_id);
create policy preferences_insert on public.account_preferences for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy preferences_update on public.account_preferences for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy preferences_delete on public.account_preferences for delete to authenticated using ((select auth.uid()) = owner_id);
revoke all on public.account_preferences from public, anon, authenticated;
grant select, insert, update, delete on public.account_preferences to authenticated;
commit;
