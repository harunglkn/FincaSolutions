-- =====================================================
-- LeadHub: Rollen — Betreiber vs. Kunde
-- =====================================================
-- Geschaeftsmodell: Der Betreiber (Finca Solutions) betreibt fuer jeden Kunden
-- ein eigenes mobile.de-Konto und einen eigenen Suchlauf. Der Kunde bekommt
-- ausschliesslich die ERGEBNISSE in seinem CRM — er soll von der Technik
-- dahinter nichts sehen (kein Suchlauf, keine Arbeitsplatz-Kopplung).
--
--   operator = Betreiber (sieht und steuert alles)
--   customer = Haendler-Kunde (sieht nur Leads, Posteingang, Termine, Berichte)
--
-- Neue Konten sind standardmaessig "customer" — ein neu registrierter Haendler
-- bekommt also nie versehentlich die Betreiber-Ansicht.
--
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================

do $$ begin
  create type public.user_role as enum ('operator', 'customer');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'customer';

-- Betreiber-Konto festlegen (Inhaber). Ueber die E-Mail, damit keine UUID
-- haendisch eingetragen werden muss.
update public.profiles p
   set role = 'operator'
  from auth.users u
 where u.id = p.id
   and lower(u.email) = 'harunglkn@gmail.com';

-- Hilfsfunktion: Ist der angemeldete Nutzer Betreiber?
create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'operator' from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_operator() to authenticated;
