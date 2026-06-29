-- =====================================================
-- LeadHub: Realtime fuer Lead-Chat (v5)
-- =====================================================
-- Aktiviert Postgres-Logical-Replication fuer die Tabellen,
-- die im Dashboard live aktualisiert werden sollen.
--
-- Effekt: Wenn der Bot eine neue Verkaeufer-Antwort einfuegt,
-- oder den Status einer Dashboard-Antwort updated, sieht
-- der Browser das ohne F5 sofort.
-- =====================================================

-- Tabelle in die Supabase-Realtime-Publication aufnehmen
alter publication supabase_realtime add table public.lead_messages;

-- Auch fuer Lead-Stammdaten (Status-Aenderungen, neue Leads)
alter publication supabase_realtime add table public.leads;
