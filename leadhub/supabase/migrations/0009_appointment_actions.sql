-- =====================================================
-- LeadHub: Termin-Aktionen fuer den Haendler (v9)
-- =====================================================
-- Authentifizierte, RLS-sichere RPCs fuer das Dashboard:
--   * create_appointment_manual  (Haendler legt Termin selbst an)
--   * reschedule_appointment      (Termin verschieben)
--   * cancel_appointment          (Termin absagen)
--   * complete_appointment        (abschliessen / gekauft / verloren / verpasst)
--
-- Alle rechnen die Uhrzeit in Europe/Berlin, verhindern Doppelbuchung ueber
-- den UNIQUE-Index aus 0008 und pflegen Lead-Status + Aktivitaets-Log.
-- security invoker => RLS greift: ein Haendler kann nur EIGENE Leads/Termine.
-- Idempotent.
-- =====================================================


-- ============== create_appointment_manual ==============

create or replace function public.create_appointment_manual(
  p_lead_id      uuid,
  p_seller_name  text,
  p_seller_phone text,
  p_seller_email text,
  p_date         date,
  p_time         time,
  p_note         text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;
  v_dt   timestamptz;
  v_id   uuid;
begin
  select * into v_lead from public.leads where id = p_lead_id and user_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'lead_not_found');
  end if;

  v_dt := (p_date + p_time) at time zone 'Europe/Berlin';

  begin
    insert into public.appointments (
      dealer_id, lead_id, seller_name, seller_phone, seller_email,
      vehicle_title, vehicle_year, vehicle_mileage, offer_price,
      appointment_date, appointment_time, appointment_datetime,
      duration_minutes, status, note, source, created_by
    ) values (
      auth.uid(), p_lead_id,
      nullif(trim(coalesce(p_seller_name, '')), ''),
      nullif(trim(coalesce(p_seller_phone, '')), ''),
      nullif(trim(coalesce(p_seller_email, '')), ''),
      v_lead.fahrzeug, v_lead.baujahr, v_lead.kilometerstand, v_lead.angebot_preis,
      p_date, p_time, v_dt,
      60, 'booked', nullif(trim(coalesce(p_note, '')), ''), 'manual', auth.uid()
    )
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end;

  update public.leads set
    status              = 'termin_vereinbart',
    appointment_id      = v_id,
    next_appointment_at = v_dt,
    appointment_status  = 'booked',
    last_activity_at    = now(),
    updated_at          = now()
  where id = p_lead_id;

  insert into public.lead_activities (dealer_id, lead_id, appointment_id, type, message, created_by)
  values (auth.uid(), p_lead_id, v_id, 'appointment_booked',
          'Termin manuell erstellt: ' || to_char(v_dt at time zone 'Europe/Berlin', 'DD.MM.YYYY, HH24:MI') || ' Uhr',
          auth.uid());

  return jsonb_build_object('ok', true, 'appointment_id', v_id);
end; $$;

grant execute on function public.create_appointment_manual(uuid, text, text, text, date, time, text)
  to authenticated;


-- ============== reschedule_appointment ==============

create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_date           date,
  p_time           time
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
  v_dt   timestamptz;
begin
  select * into v_appt from public.appointments
   where id = p_appointment_id and dealer_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  v_dt := (p_date + p_time) at time zone 'Europe/Berlin';

  begin
    update public.appointments set
      appointment_date     = p_date,
      appointment_time     = p_time,
      appointment_datetime = v_dt,
      status               = 'booked',
      updated_at           = now()
    where id = p_appointment_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'slot_taken');
  end;

  update public.leads set
    status              = 'termin_vereinbart',
    next_appointment_at = v_dt,
    appointment_status  = 'booked',
    last_activity_at    = now(),
    updated_at          = now()
  where id = v_appt.lead_id and user_id = auth.uid();

  insert into public.lead_activities (dealer_id, lead_id, appointment_id, type, message, created_by)
  values (auth.uid(), v_appt.lead_id, p_appointment_id, 'appointment_rescheduled',
          'Termin wurde verschoben auf ' || to_char(v_dt at time zone 'Europe/Berlin', 'DD.MM.YYYY, HH24:MI') || ' Uhr',
          auth.uid());

  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.reschedule_appointment(uuid, date, time) to authenticated;


-- ============== cancel_appointment ==============

create or replace function public.cancel_appointment(p_appointment_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_appt public.appointments%rowtype;
begin
  select * into v_appt from public.appointments
   where id = p_appointment_id and dealer_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  update public.appointments set status = 'cancelled', updated_at = now()
   where id = p_appointment_id;

  -- naechsten noch aktiven Zukunfts-Termin des Leads finden (sonst leeren)
  update public.leads set
    appointment_status  = 'cancelled',
    next_appointment_at = (
      select min(a.appointment_datetime) from public.appointments a
       where a.lead_id = v_appt.lead_id
         and a.status in ('booked','confirmed')
         and a.appointment_datetime >= now()
    ),
    last_activity_at = now(),
    updated_at       = now()
  where id = v_appt.lead_id and user_id = auth.uid();

  insert into public.lead_activities (dealer_id, lead_id, appointment_id, type, message, created_by)
  values (auth.uid(), v_appt.lead_id, p_appointment_id, 'appointment_cancelled',
          'Termin wurde abgesagt', auth.uid());

  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.cancel_appointment(uuid) to authenticated;


-- ============== complete_appointment ==============
-- p_outcome: 'completed' | 'bought' | 'lost' | 'missed'
-- Mapping auf bestehendes lead_status-Enum (keine kaputten Werte):
--   bought/completed -> 'abgeschlossen', lost -> 'abgelehnt', missed -> unveraendert

create or replace function public.complete_appointment(
  p_appointment_id uuid,
  p_outcome        text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_appt   public.appointments%rowtype;
  v_msg    text;
  v_lead_status public.lead_status;
begin
  if p_outcome not in ('completed','bought','lost','missed') then
    return jsonb_build_object('ok', false, 'error', 'bad_outcome');
  end if;

  select * into v_appt from public.appointments
   where id = p_appointment_id and dealer_id = auth.uid();
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  update public.appointments set status = p_outcome, updated_at = now()
   where id = p_appointment_id;

  v_msg := case p_outcome
             when 'bought'    then 'Fahrzeug wurde gekauft'
             when 'lost'      then 'Lead wurde verloren'
             when 'missed'    then 'Termin wurde verpasst'
             else                  'Termin wurde abgeschlossen'
           end;

  v_lead_status := case p_outcome
                     when 'bought' then 'abgeschlossen'::public.lead_status
                     when 'lost'   then 'abgelehnt'::public.lead_status
                     when 'completed' then 'abgeschlossen'::public.lead_status
                     else null
                   end;

  update public.leads set
    status             = coalesce(v_lead_status, status),
    appointment_status = p_outcome,
    last_activity_at   = now(),
    updated_at         = now()
  where id = v_appt.lead_id and user_id = auth.uid();

  insert into public.lead_activities (dealer_id, lead_id, appointment_id, type, message, created_by)
  values (auth.uid(), v_appt.lead_id, p_appointment_id, 'appointment_' || p_outcome, v_msg, auth.uid());

  return jsonb_build_object('ok', true);
end; $$;

grant execute on function public.complete_appointment(uuid, text) to authenticated;
