-- =====================================================
-- LeadHub: Automatische Antwort abschalten
-- =====================================================
-- Hintergrund: Die Auto-Antwort war ein Notbehelf aus der Zeit, als in der
-- ERSTNACHRICHT kein Link erlaubt war — der Buchungslink musste deshalb in
-- einer zweiten Nachricht nachgereicht werden.
--
-- Inzwischen enthaelt bereits die Erstnachricht den kurzen Buchungslink
-- (fincasolutions.vercel.app/termin/<token>). Die Auto-Antwort ist damit
-- ueberfluessig — und sie war die Quelle vieler fehlgeschlagener Nachrichten:
-- bei abgelaufenen/geloeschten Inseraten laesst sich das Kontaktformular nicht
-- mehr oeffnen (open_form_failed), die Nachricht scheitert dauerhaft.
--
-- Diese Migration ist REVERSIBEL: der Trigger bleibt bestehen, nur der
-- Schalter wird ausgeschaltet. Wieder einschalten:
--   update public.profiles set auto_reply_enabled = true where id = auth.uid();
--
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================


-- 1) Neue Konten bekommen die Auto-Antwort nicht mehr automatisch.
alter table public.profiles
  alter column auto_reply_enabled set default false;

-- 2) Bestehende Konten abschalten.
update public.profiles
   set auto_reply_enabled = false
 where coalesce(auto_reply_enabled, true) is distinct from false;

-- 3) Aufraeumen: noch nicht versendete Auto-Antworten aus der Warteschlange
--    entfernen. Sie wuerden sonst weiterhin abgearbeitet, obwohl der Verkaeufer
--    den Buchungslink laengst in der Erstnachricht hat.
delete from public.lead_messages
 where von = 'haendler'
   and delivery_status = 'pending'
   and text like '%vielen Dank für Ihre Rückmeldung%';
