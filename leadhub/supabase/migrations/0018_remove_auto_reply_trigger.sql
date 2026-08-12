-- =====================================================
-- LeadHub: Automatische Zweit-Nachricht KOMPLETT entfernen
-- =====================================================
-- Die Erstnachricht enthaelt bereits den Buchungslink
-- (fincasolutions.vercel.app/termin/<token>). Eine zweite, automatische
-- Nachricht nach der Verkaeufer-Antwort ist damit ueberfluessig — sie wirkt
-- auf Verkaeufer wie eine Maschine und erzeugte die meisten fehlgeschlagenen
-- Sendungen (abgelaufene Inserate -> Kontaktformular nicht mehr oeffenbar).
--
-- 0017 hat den Schalter nur ausgeschaltet. Diese Migration entfernt den
-- Ausloeser selbst — damit kann die Auto-Antwort nicht versehentlich wieder
-- anspringen (z. B. wenn ein Profil den Schalter zurueckstellt).
--
-- Rueckgaengig: Migration 0012 erneut ausfuehren (legt Trigger neu an).
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================

-- 1) Ausloeser entfernen (die Funktion bleibt erhalten, nur nicht mehr aktiv).
drop trigger if exists lead_messages_auto_reply on public.lead_messages;

-- 2) Schalter zusaetzlich aus (Guertel und Hosentraeger).
alter table public.profiles
  alter column auto_reply_enabled set default false;

update public.profiles
   set auto_reply_enabled = false
 where coalesce(auto_reply_enabled, true) is distinct from false;

-- 3) Warteschlange leeren: noch nicht versendete Auto-Antworten entfernen.
delete from public.lead_messages
 where von = 'haendler'
   and delivery_status = 'pending'
   and text like '%vielen Dank für Ihre Rückmeldung%';

-- 4) Bereits fehlgeschlagene Auto-Antworten aufraeumen — sie haben nie jemanden
--    erreicht und blaehen nur die Fehlerzahl im Dashboard auf.
delete from public.lead_messages
 where von = 'haendler'
   and delivery_status = 'failed'
   and text like '%vielen Dank für Ihre Rückmeldung%';
