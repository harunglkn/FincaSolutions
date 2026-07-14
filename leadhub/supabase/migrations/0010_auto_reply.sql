-- =====================================================
-- LeadHub: Auto-Antwort mit Termin-Buchungslink (v10)
-- =====================================================
-- Wenn die ERSTE Verkaeufer-Antwort zu einem Lead eintrifft, stellt die
-- Datenbank automatisch die Haupt-Antwort (Richtpreis + individueller
-- Termin-Buchungslink) als 'pending' in die Sende-Warteschlange.
-- Der Bot verschickt sie dann wie jede Dashboard-Antwort ueber mobile.de.
--
-- Regeln:
--   * nur bei der ALLERERSTEN Verkaeufer-Antwort des Leads (kein Spam
--     mitten in laufenden Verhandlungen)
--   * nicht, wenn bereits ein aktiver Termin existiert
--   * nur einmal pro Lead (leads.auto_reply_sent_at)
--   * abschaltbar pro Haendler: profiles.auto_reply_enabled
--
-- Hinweis: mobile.de erlaubt Links NICHT in der ersten Kontaktnachricht,
-- wohl aber in laufenden Unterhaltungen (getestet 2026-07-08).
-- Idempotent — darf mehrfach ausgefuehrt werden.
-- =====================================================


-- ============== Spalten ==============

alter table public.leads
  add column if not exists auto_reply_sent_at timestamptz;

alter table public.profiles
  add column if not exists auto_reply_enabled boolean not null default true;


-- ============== Trigger-Funktion ==============

create or replace function public.maybe_queue_auto_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead        public.leads%rowtype;
  v_enabled     boolean;
  v_other_count int;
  v_has_appt    boolean;
  v_url         text;
  v_preis       text;
  v_text        text;
begin
  -- Nur auf Verkaeufer-Nachrichten reagieren
  if new.von <> 'verkaeufer' then
    return new;
  end if;

  select * into v_lead from public.leads where id = new.lead_id;
  if not found then
    return new;
  end if;

  -- Nur einmal pro Lead
  if v_lead.auto_reply_sent_at is not null then
    return new;
  end if;

  -- Haendler kann die Automatik abschalten
  select coalesce(auto_reply_enabled, true) into v_enabled
    from public.profiles where id = v_lead.user_id;
  if not coalesce(v_enabled, true) then
    return new;
  end if;

  -- Nur bei der ALLERERSTEN Verkaeufer-Antwort dieses Leads
  select count(*) into v_other_count
    from public.lead_messages
   where lead_id = new.lead_id
     and von = 'verkaeufer'
     and id <> new.id;
  if v_other_count > 0 then
    return new;
  end if;

  -- Kein Auto-Reply, wenn schon ein aktiver Termin existiert
  select exists(
    select 1 from public.appointments a
     where a.lead_id = v_lead.id
       and a.status in ('booked','confirmed','completed','bought')
  ) into v_has_appt;
  if v_has_appt then
    return new;
  end if;

  -- Buchungslink (Basis-URL: bei Domain-Wechsel hier anpassen)
  v_url := 'https://fincasolutions.vercel.app/booking/lead/' || v_lead.id;

  if v_lead.ankaufspreis is not null then
    v_preis := replace(to_char(round(v_lead.ankaufspreis), 'FM999,999,999'), ',', '.');
    v_text :=
'Hallo und vielen Dank für Ihre Rückmeldung.

Ihr Fahrzeug ist für uns grundsätzlich interessant. Auf Basis der Inseratsangaben können wir Ihnen vorab folgenden unverbindlichen Richtpreis nennen:

Richtpreis: ' || v_preis || ' €
(gültig für 5 Tage)

Der Preis basiert auf den aktuell bekannten Fahrzeugdaten, der Marktlage und der Nachfrage. Die endgültige Bewertung erfolgt bei uns vor Ort nach kurzer Sichtprüfung des Fahrzeugs.

Wir sind eine feste Ankaufstation und prüfen Fahrzeuge direkt bei uns am Standort. So können wir den Zustand gemeinsam transparent anschauen, offene Fragen direkt klären und bei Einigung die Abwicklung sofort durchführen.

Ihren Wunschtermin zur Fahrzeugprüfung können Sie ganz bequem direkt online buchen — einfach den folgenden Link kopieren und im Browser öffnen:

' || v_url || '

Bitte bringen Sie zur Besichtigung nach Möglichkeit Fahrzeugschein, Fahrzeugbrief, Serviceunterlagen, beide Schlüssel und vorhandene Rechnungen mit.

Alternativ erreichen Sie uns auch telefonisch oder per WhatsApp:
Tel.: 0176 11199111
Mo–Fr: 08:00–18:00 Uhr
Sa: 08:00–13:00 Uhr

A.G. Automobile eGbR
Robert-Bosch-Straße 4
64319 Pfungstadt

Mit freundlichen Grüßen
A.G. Automobile eGbR';
  else
    v_text :=
'Hallo und vielen Dank für Ihre Rückmeldung.

Ihr Fahrzeug ist für uns grundsätzlich interessant. Gerne prüfen wir es direkt bei uns am Standort.

Ihren Wunschtermin zur Fahrzeugprüfung können Sie ganz bequem direkt online buchen — einfach den folgenden Link kopieren und im Browser öffnen:

' || v_url || '

Alternativ erreichen Sie uns auch telefonisch oder per WhatsApp:
Tel.: 0176 11199111
Mo–Fr: 08:00–18:00 Uhr
Sa: 08:00–13:00 Uhr

A.G. Automobile eGbR
Robert-Bosch-Straße 4
64319 Pfungstadt

Mit freundlichen Grüßen
A.G. Automobile eGbR';
  end if;

  -- In die Sende-Warteschlange stellen (Bot verschickt via mobile.de)
  insert into public.lead_messages (lead_id, von, text, delivery_status)
  values (v_lead.id, 'haendler', v_text, 'pending');

  update public.leads
     set auto_reply_sent_at = now(),
         last_activity_at   = now(),
         updated_at         = now()
   where id = v_lead.id;

  return new;
end; $$;


-- ============== Trigger ==============

drop trigger if exists lead_messages_auto_reply on public.lead_messages;
create trigger lead_messages_auto_reply
  after insert on public.lead_messages
  for each row
  execute function public.maybe_queue_auto_reply();
