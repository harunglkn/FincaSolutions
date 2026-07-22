-- =====================================================
-- LeadHub: Suchläufe aus dem Dashboard steuern (v13)
-- =====================================================
-- Der Händler legt im Dashboard einen "Suchlauf" an (Name + mobile.de-
-- Such-Adresse) und schaltet ihn an/aus. Der Suchlauf-Motor (Bot) auf dem PC
-- liest den AKTIVEN Suchlauf und arbeitet ihn automatisch ab — kein manuelles
-- Laden der Suche, kein ENTER mehr.
--
-- Idempotent. Rueckwaertskompatibel (nichts wird geloescht/umbenannt).
-- =====================================================

create table if not exists public.search_profiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  search_url  text not null,
  is_active   boolean not null default false,
  last_run_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists search_profiles_user_idx
  on public.search_profiles (user_id);
create index if not exists search_profiles_active_idx
  on public.search_profiles (user_id, is_active)
  where is_active = true;

drop trigger if exists search_profiles_set_updated_at on public.search_profiles;
create trigger search_profiles_set_updated_at
  before update on public.search_profiles
  for each row execute function public.set_updated_at();

alter table public.search_profiles enable row level security;

drop policy if exists search_profiles_own_all on public.search_profiles;
create policy search_profiles_own_all
  on public.search_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
