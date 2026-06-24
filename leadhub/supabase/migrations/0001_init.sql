-- =====================================================
-- LeadHub: Initial Schema (v1)
-- =====================================================
-- Ausfuehren in: Supabase Dashboard -> SQL Editor
--                -> New query -> Inhalt einfuegen -> Run
--
-- Diese Datei legt Tabellen, Sicherheitsregeln und
-- Hilfsfunktionen an. Sie ist auf wiederholtes Ausfuehren
-- ausgelegt (idempotent) — falls etwas schief geht,
-- darfst du sie einfach nochmal laufen lassen.
-- =====================================================


-- ============== Enum-Typen ==============

do $$ begin
  create type public.lead_status as enum (
    'antwort_offen',
    'termin_vereinbart',
    'hohes_potenzial',
    'abgelehnt',
    'abgeschlossen'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.message_sender as enum ('verkaeufer', 'haendler');
exception when duplicate_object then null;
end $$;


-- ============== Tabelle: profiles ==============
-- Erweitert auth.users um Autohaus-Daten

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  firma      text,
  vorname    text,
  nachname   text,
  telefon    text,
  adresse    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ============== Tabelle: campaigns ==============

create table if not exists public.campaigns (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  beschreibung  text,
  aktiv         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on public.campaigns(user_id);


-- ============== Tabelle: leads ==============

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  campaign_id     uuid references public.campaigns(id) on delete set null,

  -- Fahrzeug
  fahrzeug        text not null,
  baujahr         integer,
  kilometerstand  integer,
  getriebe        text,
  kraftstoff      text,
  erstzulassung   text,
  hu_bis          text,
  farbe           text,

  -- Verkaeufer
  verkaeufer_name text,
  ort             text,

  -- Preise (in Euro)
  angebot_preis   numeric(10,2),
  marktwert       numeric(10,2),
  ankaufspreis    numeric(10,2),

  -- Status und Quelle
  status          public.lead_status not null default 'antwort_offen',
  quelle          text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists leads_user_id_idx       on public.leads(user_id);
create index if not exists leads_campaign_id_idx   on public.leads(campaign_id);
create index if not exists leads_user_status_idx   on public.leads(user_id, status);
create index if not exists leads_created_at_idx    on public.leads(user_id, created_at desc);


-- ============== Tabelle: lead_messages ==============

create table if not exists public.lead_messages (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  von        public.message_sender not null,
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_messages_lead_id_idx
  on public.lead_messages(lead_id, created_at);


-- ============== Trigger: updated_at automatisch pflegen ==============

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();


-- ============== Auto-Profil bei neuem User ==============

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profile fuer bereits bestehende User nachziehen
insert into public.profiles (id)
select id from auth.users
on conflict do nothing;


-- ============== Row-Level Security ==============
-- Jeder User sieht und bearbeitet AUSSCHLIESSLICH eigene Daten.

alter table public.profiles      enable row level security;
alter table public.campaigns     enable row level security;
alter table public.leads         enable row level security;
alter table public.lead_messages enable row level security;

-- profiles
drop policy if exists "profiles_own_select" on public.profiles;
create policy "profiles_own_select"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_own_update" on public.profiles;
create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- campaigns
drop policy if exists "campaigns_own_all" on public.campaigns;
create policy "campaigns_own_all"
  on public.campaigns for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- leads
drop policy if exists "leads_own_all" on public.leads;
create policy "leads_own_all"
  on public.leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- lead_messages (nur ueber eigene Leads erreichbar)
drop policy if exists "lead_messages_own_all" on public.lead_messages;
create policy "lead_messages_own_all"
  on public.lead_messages for all
  using (
    exists (
      select 1 from public.leads l
      where l.id = lead_messages.lead_id
        and l.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_messages.lead_id
        and l.user_id = auth.uid()
    )
  );


-- ============== Funktion: Beispieldaten laden ==============
-- Aus der App per supabase.rpc('seed_demo_data') aufrufbar.
-- Setzt 2 Kampagnen + 4 Leads + ein paar Nachrichten an.

create or replace function public.seed_demo_data()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id              uuid := auth.uid();
  v_campaign_premium     uuid;
  v_campaign_audi        uuid;
  v_lead_bmw             uuid;
begin
  if v_user_id is null then
    raise exception 'Nicht angemeldet — bitte einloggen.';
  end if;

  -- Nur einmal seeden
  if exists (select 1 from public.leads where user_id = v_user_id) then
    raise notice 'Beispieldaten wurden bereits angelegt — nichts zu tun.';
    return;
  end if;

  insert into public.campaigns (user_id, name, beschreibung, aktiv)
    values (v_user_id, 'Premium-Kombis',
            'BMW Touring, Audi Avant, Mercedes T-Modell · bis 100.000 km', true)
    returning id into v_campaign_premium;

  insert into public.campaigns (user_id, name, beschreibung, aktiv)
    values (v_user_id, 'Audi-Diesel',
            'Audi A4 / A6 · TDI · Baujahr >= 2018', true)
    returning id into v_campaign_audi;

  insert into public.leads
    (user_id, campaign_id, fahrzeug, baujahr, kilometerstand,
     getriebe, kraftstoff, erstzulassung, hu_bis, farbe,
     verkaeufer_name, ort,
     angebot_preis, marktwert, ankaufspreis,
     status, quelle)
  values
    (v_user_id, v_campaign_premium, 'BMW 320d Touring', 2019, 89000,
     'Automatik', 'Diesel', '04/2019', '03/2026', 'Mineralweiss',
     'Marco S.', 'Koeln',
     14900, 15400, 13200,
     'antwort_offen', 'Suchlauf')
  returning id into v_lead_bmw;

  insert into public.lead_messages (lead_id, von, text) values
    (v_lead_bmw, 'verkaeufer',
     'Hallo, das Fahrzeug ist scheckheftgepflegt, Vorbesitzer 2. Anfrage gerne per Telefon.'),
    (v_lead_bmw, 'haendler',
     'Vielen Dank. Wir wuerden 13.200 EUR anbieten — passt das?'),
    (v_lead_bmw, 'verkaeufer',
     '13.200 EUR ist zu wenig. Vorstellung: 14.500 EUR.');

  insert into public.leads
    (user_id, campaign_id, fahrzeug, baujahr, kilometerstand,
     verkaeufer_name, ort,
     angebot_preis, ankaufspreis,
     status, quelle)
  values
    (v_user_id, null, 'VW Golf 7 GTI', 2017, 112000,
     'Tanja K.', 'Duesseldorf',
     16500, 14800,
     'termin_vereinbart', 'Direkte Anfrage');

  insert into public.leads
    (user_id, campaign_id, fahrzeug, baujahr, kilometerstand,
     verkaeufer_name, ort,
     angebot_preis, ankaufspreis,
     status, quelle)
  values
    (v_user_id, v_campaign_audi, 'Audi A4 Avant', 2020, 64000,
     'B. Yilmaz', 'Essen',
     22900, 21000,
     'hohes_potenzial', 'Suchlauf');

  insert into public.leads
    (user_id, campaign_id, fahrzeug, baujahr, kilometerstand,
     verkaeufer_name, ort,
     angebot_preis,
     status, quelle)
  values
    (v_user_id, null, 'Mercedes C 220d', 2018, 145000,
     'F. Becker', 'Dortmund',
     18700,
     'abgelehnt', 'Suchlauf');

  raise notice 'Beispieldaten angelegt: 2 Kampagnen, 4 Leads, 3 Nachrichten.';
end; $$;

grant execute on function public.seed_demo_data() to authenticated;
