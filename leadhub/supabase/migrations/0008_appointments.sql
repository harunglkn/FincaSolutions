-- =====================================================
-- LeadHub: Termin-Kalender (v8)
-- =====================================================
-- Eigener Termin-Kalender, direkt mit Leads + Haendler-Dashboard verbunden.
--
-- Enthaelt:
--   * Tabelle dealer_availability  (Wann ist der Haendler buchbar?)
--   * Tabelle appointments         (die Termine selbst)
--   * Tabelle lead_activities      (Aktivitaets-Log pro Lead)
--   * leads-Erweiterung            (appointment_id, next_appointment_at, ...)
--   * Doppelbuchungs-Schutz        (partieller UNIQUE-Index auf aktive Slots)
--   * Oeffentliche RPCs (SECURITY DEFINER) fuer die Buchungsseite ohne Login:
--       - get_lead_for_booking   (nur sichere Felder)
--       - get_available_slots    (nur freie 1-Std-Slots, Europe/Berlin)
--       - book_appointment_public(race-sichere Buchung + Lead-Update + Log)
--
-- Idempotent — darf mehrfach ausgefuehrt werden.
-- Zeitzone durchgaengig: Europe/Berlin.
-- =====================================================


-- ============== 1) leads: Termin-Felder ergaenzen ==============

alter table public.leads
  add column if not exists appointment_id      uuid,
  add column if not exists next_appointment_at timestamptz,
  add column if not exists appointment_status  text,
  add column if not exists last_activity_at    timestamptz;


-- ============== 2) dealer_availability ==============
-- weekday: 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa, 7=So
-- Eine Zeile pro Wochentag und Haendler.

create table if not exists public.dealer_availability (
  id                        uuid primary key default gen_random_uuid(),
  dealer_id                 uuid not null references auth.users(id) on delete cascade,
  weekday                   int  not null check (weekday between 1 and 7),
  start_time                time not null,
  end_time                  time not null,
  slot_minutes              int  not null default 60,
  buffer_minutes            int  not null default 0,
  max_appointments_per_day  int,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (dealer_id, weekday)
);

create index if not exists dealer_availability_dealer_weekday_idx
  on public.dealer_availability (dealer_id, weekday);


-- ============== 3) appointments ==============

create table if not exists public.appointments (
  id                    uuid primary key default gen_random_uuid(),
  dealer_id             uuid not null references auth.users(id) on delete cascade,
  lead_id               uuid not null references public.leads(id) on delete cascade,

  -- Verkaeufer (auf der Buchungsseite eingegeben)
  seller_name           text,
  seller_phone          text,
  seller_email          text,

  -- Fahrzeug-Schnappschuss (aus dem Lead kopiert)
  vehicle_title         text,
  vehicle_make          text,
  vehicle_model         text,
  vehicle_year          int,
  vehicle_mileage       int,
  listing_price         numeric(10,2),
  offer_price           numeric(10,2),

  -- Termin
  appointment_date      date not null,
  appointment_time      time not null,
  appointment_datetime  timestamptz not null,
  duration_minutes      int  not null default 60,

  status                text not null default 'booked'
                          check (status in (
                            'booked','confirmed','completed','missed',
                            'cancelled','rescheduled','bought','lost'
                          )),
  note                  text,
  source                text not null default 'booking_link',
  created_by            uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists appointments_dealer_idx    on public.appointments (dealer_id);
create index if not exists appointments_lead_idx      on public.appointments (lead_id);
create index if not exists appointments_datetime_idx  on public.appointments (dealer_id, appointment_datetime);
create index if not exists appointments_status_idx    on public.appointments (dealer_id, status);
create index if not exists appointments_date_idx      on public.appointments (dealer_id, appointment_date);

-- >>> Doppelbuchungs-Schutz (technisch, nicht nur optisch) <<<
-- Pro Haendler darf es zu einem Zeitpunkt nur EINEN AKTIVEN Termin geben.
-- Aktiv-blockierend: booked / confirmed / completed.
-- Abgesagt/verschoben/verpasst/verloren blockieren NICHT.
create unique index if not exists appointments_active_slot_unique
  on public.appointments (dealer_id, appointment_datetime)
  where status in ('booked','confirmed','completed');

-- Rueckverweis vom Lead auf den (aktuellen) Termin
do $$ begin
  alter table public.leads
    add constraint leads_appointment_id_fkey
    foreign key (appointment_id) references public.appointments(id) on delete set null;
exception when duplicate_object then null;
end $$;


-- ============== 4) lead_activities (Aktivitaets-Log) ==============

create table if not exists public.lead_activities (
  id             uuid primary key default gen_random_uuid(),
  dealer_id      uuid not null references auth.users(id) on delete cascade,
  lead_id        uuid not null references public.leads(id) on delete cascade,
  appointment_id uuid,
  type           text not null,
  message        text not null,
  created_by     uuid,
  created_at     timestamptz not null default now()
);

create index if not exists lead_activities_lead_idx
  on public.lead_activities (lead_id, created_at desc);
create index if not exists lead_activities_dealer_idx
  on public.lead_activities (dealer_id, created_at desc);


-- ============== 5) updated_at-Trigger (Funktion aus 0001 wiederverwenden) ==============

drop trigger if exists appointments_set_updated_at on public.appointments;
create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

drop trigger if exists dealer_availability_set_updated_at on public.dealer_availability;
create trigger dealer_availability_set_updated_at
  before update on public.dealer_availability
  for each row execute function public.set_updated_at();


-- ============== 6) Row-Level Security ==============
-- Direktzugriff nur fuer den eingeloggten Haendler auf EIGENE Daten.
-- Oeffentliche Buchung laeuft ausschliesslich ueber die SECURITY-DEFINER-RPCs
-- weiter unten (anon hat KEINEN direkten Tabellenzugriff).

alter table public.dealer_availability enable row level security;
alter table public.appointments        enable row level security;
alter table public.lead_activities     enable row level security;

drop policy if exists dealer_availability_own_all on public.dealer_availability;
create policy dealer_availability_own_all
  on public.dealer_availability for all
  using (auth.uid() = dealer_id)
  with check (auth.uid() = dealer_id);

drop policy if exists appointments_own_all on public.appointments;
create policy appointments_own_all
  on public.appointments for all
  using (auth.uid() = dealer_id)
  with check (auth.uid() = dealer_id);

drop policy if exists lead_activities_own_all on public.lead_activities;
create policy lead_activities_own_all
  on public.lead_activities for all
  using (auth.uid() = dealer_id)
  with check (auth.uid() = dealer_id);


-- ============== 7) RPC: get_lead_for_booking ==============
-- Oeffentlich (anon). Gibt NUR die fuer den Verkaeufer noetigen Felder zurueck.
-- KEINE internen Zahlen (Ankaufspreis, Marktwert, bot_meta, andere Leads).

create or replace function public.get_lead_for_booking(p_lead_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id',             l.id,
    'fahrzeug',       l.fahrzeug,
    'baujahr',        l.baujahr,
    'kilometerstand', l.kilometerstand,
    'getriebe',       l.getriebe,
    'kraftstoff',     l.kraftstoff,
    'erstzulassung',  l.erstzulassung,
    'angebot_preis',  l.angebot_preis,
    'dealer_firma',   p.firma
  )
  from public.leads l
  left join public.profiles p on p.id = l.user_id
  where l.id = p_lead_id;
$$;

grant execute on function public.get_lead_for_booking(uuid) to anon, authenticated;


-- ============== 8) RPC: get_available_slots ==============
-- Oeffentlich (anon). Liefert nur FREIE 1-Std-Slots eines Tages, ohne
-- Vergangenheit, unter Beachtung der Haendler-Verfuegbarkeit (Europe/Berlin).
-- Standard-Verfuegbarkeit greift, wenn der Haendler noch nichts eingestellt hat:
--   Mo-Fr 09:00-18:00, Sa 09:00-13:00, So geschlossen, 60-Min-Slots.

create or replace function public.get_available_slots(p_lead_id uuid, p_date date)
returns setof time
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_dealer_id   uuid;
  v_weekday     int;
  v_start       time;
  v_end         time;
  v_slot        int;
  v_buffer      int;
  v_max         int;
  v_has_rows    boolean;
  v_active_cnt  int;
  v_now_berlin  timestamp;
begin
  select user_id into v_dealer_id from public.leads where id = p_lead_id;
  if v_dealer_id is null then
    return;
  end if;

  v_weekday := extract(isodow from p_date)::int;  -- 1=Mo .. 7=So

  select exists(select 1 from public.dealer_availability where dealer_id = v_dealer_id)
    into v_has_rows;

  if v_has_rows then
    select start_time, end_time, slot_minutes, coalesce(buffer_minutes, 0), max_appointments_per_day
      into v_start, v_end, v_slot, v_buffer, v_max
      from public.dealer_availability
     where dealer_id = v_dealer_id and weekday = v_weekday and is_active = true
     limit 1;
    if v_start is null then
      return;  -- an diesem Wochentag geschlossen
    end if;
  else
    -- Standard-Verfuegbarkeit
    if v_weekday between 1 and 5 then
      v_start := time '09:00'; v_end := time '18:00';
    elsif v_weekday = 6 then
      v_start := time '09:00'; v_end := time '13:00';
    else
      return;  -- Sonntag geschlossen
    end if;
    v_slot := 60; v_buffer := 0; v_max := null;
  end if;

  if v_slot is null or v_slot <= 0 then v_slot := 60; end if;

  -- Tageslimit erreicht?
  if v_max is not null then
    select count(*) into v_active_cnt
      from public.appointments
     where dealer_id = v_dealer_id
       and appointment_date = p_date
       and status in ('booked','confirmed','completed','bought');
    if v_active_cnt >= v_max then
      return;
    end if;
  end if;

  v_now_berlin := (now() at time zone 'Europe/Berlin');

  return query
    select g::time as slot
    from generate_series(
      (p_date + v_start),
      (p_date + v_end) - make_interval(mins => v_slot),
      make_interval(mins => v_slot + v_buffer)
    ) as g
    where
      g > v_now_berlin
      and not exists (
        select 1 from public.appointments a
         where a.dealer_id = v_dealer_id
           and a.appointment_date = p_date
           and a.appointment_time = g::time
           and a.status in ('booked','confirmed','completed')
      )
    order by slot;
end; $$;

grant execute on function public.get_available_slots(uuid, date) to anon, authenticated;


-- ============== 9) RPC: book_appointment_public ==============
-- Oeffentlich (anon). Race-sichere Buchung:
--   * dealer_id wird IMMER aus dem Lead gezogen (nie vom Nutzer)
--   * prueft Pflichtfelder, Vergangenheit und freie Verfuegbarkeit
--   * der partielle UNIQUE-Index verhindert Doppelbuchung transaktional
--   * setzt Lead auf 'termin_vereinbart' + schreibt Aktivitaets-Log
-- Rueckgabe: jsonb { ok: bool, error?: text, appointment_id?: uuid }

create or replace function public.book_appointment_public(
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

  -- Slot muss laut Verfuegbarkeit frei + gueltig sein
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
      appointment_date, appointment_time, appointment_datetime,
      duration_minutes, status, note, source
    ) values (
      v_lead.user_id, p_lead_id,
      trim(p_seller_name), trim(p_seller_phone),
      nullif(trim(coalesce(p_seller_email, '')), ''),
      v_lead.fahrzeug, v_lead.baujahr, v_lead.kilometerstand, v_lead.angebot_preis,
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

grant execute on function public.book_appointment_public(uuid, text, text, text, date, time, text)
  to anon, authenticated;
