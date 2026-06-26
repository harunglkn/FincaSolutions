-- =====================================================
-- LeadHub: Lead-Schema-Erweiterung (v2)
-- =====================================================
-- Ausfuehren in: Supabase Dashboard -> SQL Editor
--                -> New query -> Inhalt einfuegen -> Run
--
-- Fuegt zwei Felder zu leads hinzu, die der Bot spaeter
-- befuellt: external_id (Inserat-Nummer von mobile.de o.ae.)
-- und inserat_url (Link zum Original-Inserat).
--
-- Die Kombination (user_id, external_id) ist eindeutig —
-- so kann der Bot kein Inserat doppelt anlegen.
-- =====================================================

alter table public.leads
  add column if not exists external_id text,
  add column if not exists inserat_url text;

-- Eindeutig pro User: derselbe Haendler darf eine Inserat-ID
-- nur einmal haben. Verschiedene Haendler duerfen dasselbe
-- Inserat unabhaengig speichern.
create unique index if not exists leads_external_id_per_user
  on public.leads (user_id, external_id)
  where external_id is not null;
