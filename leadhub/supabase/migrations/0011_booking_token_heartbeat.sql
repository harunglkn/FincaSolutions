-- =====================================================
-- LeadHub: Kurz-Buchungstoken, Notizen, Kennzeichen, Heartbeats (v11)
-- =====================================================
-- Rueckwaertskompatibel:
--   * bestehende UUID-Buchungslinks funktionieren weiter
--   * keine Felder werden geloescht oder umbenannt
--   * Watcher/Bot-Felder bleiben unangetastet
--
-- Inhalt:
--   1) leads.booking_token  — kurzer, zufaelliger Code fuer kurze
--      Buchungslinks (fincasolutions.vercel.app/termin/<token>).
--      Nicht erratbar, unique, fuer Bestandsleads nachgefuellt.
--   2) leads.notes          — Notizfeld fuer den Haendler
--   3) appointments.vehicle_plate — optionales Kennzeichen bei Buchung
--   4) book_appointment_public um Kennzeichen erweitert (Signaturwechsel:
--      alte 7-Param-Version wird ersetzt; neuer Param hat DEFAULT NULL,
--      bestehende Aufrufe ohne Kennzeichen funktionieren unveraendert)
--   5) resolve_booking_token — oeffentliche RPC: Token -> Lead-ID
--   6) worker_heartbeats     — Bot/Watcher melden "lebt noch"
--
-- Idempotent — darf mehrfach ausgefuehrt werden.
-- =====================================================


-- ============== 1) leads.booking_token ==============

alter table public.leads
  add column if not exists booking_token text
    default substr(md5(gen_random_uuid()::text), 1, 10);

update public.leads
   set booking_token = substr(md5(gen_random_uuid()::text), 1, 10)
 where booking_token is null;

create unique index if not exists leads_booking_token_unique
  on public.leads (booking_token)
  where booking_token is not null;


-- ============== 2) leads.notes ==============

alter table public.leads
  add column if not exists notes text;


-- ============== 3) appointments.vehicle_plate ==============

alter table public.appointments
  add column if not exists vehicle_plate text;


-- ============== 4) book_appointment_public + Kennzeichen ==============
-- Alte Signatur entfernen (sonst doppelte Funktion -> Mehrdeutigkeit).

drop function if exists public.book_appointment_public(uuid, text, text, text, date, time, text);

create or replace function public.book_appointment_public(
  p_lead_id       uuid,
  p_seller_name   text,
  p_seller_phone  text,
  p_seller_email  text,
  p_date          date,
  p_time          time,
  p_note          text default null,
  p_vehicle_plate text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead    public.leads%rowtype;
  v_dt      timestamptz;
  v_appt_id uuid;
  v_ok      boolean;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'lead_not_found');
  end if;

  if p_seller_name is null or length(trim(p_seller_name)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'name_required');
  end if;
  if p_seller_phone is null or length(trim(p_seller_phone)) = 0 then
    return jsonb_build_object('ok', false, 'error', 'phone_required');
  end if;

  v_dt := (p_date + p_time) at time zone 'Europe/Berlin';
  if v_dt <= now() then
    return jsonb_build_object('ok', false, 'error', 'past');
  end if;

  select exists(
    select 1 from public.get_available_slots(p_lead_id, p_date) s where s = p_time
  ) into v_ok;
  if not v_ok then
    return jsonb_build_object('ok', false, 'error', 'slot_unavailable');
  end if;

  begin
    insert into public.appointments (
      dealer_id, lead_id, seller_name, seller_phone, seller_email,
      vehicle_title, vehicle_year, vehicle_mileage, offer_price,
      vehicle_plate,
      appointment_date, appointment_time, appointment_datetime,
      duration_minutes, status, note, source
    ) values (
      v_lead.user_id, p_lead_id,
      trim(p_seller_name), trim(p_seller_phone),
      nullif(trim(coalesce(p_seller_email, '')), ''),
      v_lead.fahrzeug, v_lead.baujahr, v_lead.kilometerstand, v_lead.angebot_preis,
      nullif(trim(coalesce(p_vehicle_plate, '')), ''),
      p_date, p_time, v_dt,
      60, 'booked', nullif(trim(coalesce(p_note, '')), ''), 'booking_link'
    )
    returning id into v_appt_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end;

  update public.leads set
    status              = 'termin_vereinbart',
    appointment_id      = v_appt_id,
    next_appointment_at = v_dt,
    appointment_status  = 'booked',
    last_activity_at    = now(),
    updated_at          = now()
  where id = p_lead_id;

  insert into public.lead_activities (dealer_id, lead_id, appointment_id, type, message)
  values (
    v_lead.user_id, p_lead_id, v_appt_id, 'appointment_booked',
    'Termin wurde gebucht: ' || to_char(v_dt at time zone 'Europe/Berlin', 'DD.MM.YYYY, HH24:MI') || ' Uhr'
  );

  return jsonb_build_object('ok', true, 'appointment_id', v_appt_id);
end; $$;

grant execute on function public.book_appointment_public(uuid, text, text, text, date, time, text, text)
  to anon, authenticated;


-- ============== 5) RPC: resolve_booking_token ==============
-- Oeffentlich: kurzer Token -> Lead-ID (fuer /termin/<token>).
-- Gibt NULL zurueck, wenn unbekannt. Keine weiteren Daten.

create or replace function public.resolve_booking_token(p_token text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.leads
   where booking_token = lower(trim(p_token))
   limit 1;
$$;

grant execute on function public.resolve_booking_token(text) to anon, authenticated;


-- ============== 6) worker_heartbeats ==============
-- Bot und Watcher melden regelmaessig "lebt noch" — das Dashboard zeigt
-- dann, ob die Suchlaeufe/Antwort-Erkennung aktiv sind.

create table if not exists public.worker_heartbeats (
  user_id      uuid not null references auth.users(id) on delete cascade,
  worker       text not null check (worker in ('bot', 'watcher')),
  last_seen_at timestamptz not null default now(),
  detail       text,
  primary key (user_id, worker)
);

alter table public.worker_heartbeats enable row level security;

drop policy if exists worker_heartbeats_own_select on public.worker_heartbeats;
create policy worker_heartbeats_own_select
  on public.worker_heartbeats for select
  using (auth.uid() = user_id);

-- Schreiben ausschliesslich ueber die RPC (Bot/Watcher nutzen den Service-Key,
-- der RLS ohnehin umgeht — die RPC haelt es einheitlich und einfach).
create or replace function public.worker_heartbeat(
  p_user_id uuid,
  p_worker  text,
  p_detail  text default null
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.worker_heartbeats (user_id, worker, last_seen_at, detail)
  values (p_user_id, p_worker, now(), p_detail)
  on conflict (user_id, worker)
  do update set last_seen_at = now(), detail = excluded.detail;
$$;

grant execute on function public.worker_heartbeat(uuid, text, text) to service_role;
