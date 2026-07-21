-- =====================================================
-- LeadHub: Auto-Antwort auf Kurzlink OHNE https umstellen (v12)
-- =====================================================
-- Grund: mobile.de blockt Nachrichten mit http(s):// ("Bitte verwenden Sie
-- keine URL"). Die Auto-Antwort (0010) enthielt noch die Lang-URL MIT https
-- (https://.../booking/lead/<uuid>) -> Versand schlug fehl.
--
-- Fix: kurzer, schemafreier Link  fincasolutions.vercel.app/termin/<token>
-- (Token aus 0011). Beim Klick leitet die Seite automatisch auf https um.
-- Nur die URL-Zeile aendert sich; restliche Logik bleibt identisch. Idempotent.
-- =====================================================

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
  if new.von <> 'verkaeufer' then
    return new;
  end if;

  select * into v_lead from public.leads where id = new.lead_id;
  if not found then
    return new;
  end if;

  if v_lead.auto_reply_sent_at is not null then
    return new;
  end if;

  select coalesce(auto_reply_enabled, true) into v_enabled
    from public.profiles where id = v_lead.user_id;
  if not coalesce(v_enabled, true) then
    return new;
  end if;

  select count(*) into v_other_count
    from public.lead_messages
   where lead_id = new.lead_id
     and von = 'verkaeufer'
     and id <> new.id;
  if v_other_count > 0 then
    return new;
  end if;

  select exists(
    select 1 from public.appointments a
     where a.lead_id = v_lead.id
       and a.status in ('booked','confirmed','completed','bought')
  ) into v_has_appt;
  if v_has_appt then
    return new;
  end if;

  -- Kurzer, schemafreier Buchungslink (mobile.de-konform)
  if v_lead.booking_token is not null then
    v_url := 'fincasolutions.vercel.app/termin/' || v_lead.booking_token;
  else
    v_url := 'fincasolutions.vercel.app/booking/lead/' || v_lead.id;
  end if;

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

  insert into public.lead_messages (lead_id, von, text, delivery_status)
  values (v_lead.id, 'haendler', v_text, 'pending');

  update public.leads
     set auto_reply_sent_at = now(),
         last_activity_at   = now(),
         updated_at         = now()
   where id = v_lead.id;

  return new;
end; $$;
