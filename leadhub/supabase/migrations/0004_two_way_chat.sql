-- =====================================================
-- LeadHub: Two-Way-Chat (v4)
-- =====================================================
-- - delivery_status fuer Nachrichten (sent / pending / failed / received)
-- - dedup_key zur Vermeidung von doppelten Imports aus dem Posteingang
-- - RPC sync_incoming_message: Bot pusht eingehende Antworten
-- - RPC claim_pending_outgoing: Bot holt eine zu sendende Nachricht aus der DB
-- - RPC mark_outgoing_sent: Bot meldet zurueck, dass eine Nachricht raus ist
-- =====================================================


-- ============== Enum delivery_status ==============

do $$ begin
  create type public.message_delivery_status as enum (
    'received',   -- vom Verkaeufer eingegangen
    'sent',       -- vom Haendler erfolgreich versendet (manuell oder Bot)
    'pending',    -- vom Haendler im Dashboard verfasst, Bot soll senden
    'failed'      -- Versand fehlgeschlagen
  );
exception when duplicate_object then null;
end $$;


-- ============== Spalten in lead_messages ==============

alter table public.lead_messages
  add column if not exists delivery_status public.message_delivery_status,
  add column if not exists sent_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists failure_reason text,
  add column if not exists dedup_key text;

-- Bestehende Eintraege migrieren: alles Vorhandene gilt als gesendet/empfangen
update public.lead_messages
   set delivery_status = case
      when delivery_status is not null then delivery_status
      when von = 'haendler'   then 'sent'::public.message_delivery_status
      when von = 'verkaeufer' then 'received'::public.message_delivery_status
   end
 where delivery_status is null;

-- Duplikat-Schutz fuer eingehende Bot-Importe
create unique index if not exists lead_messages_dedup_per_lead
  on public.lead_messages (lead_id, dedup_key)
  where dedup_key is not null;


-- ============== RPC: sync_incoming_message ==============
-- Bot ruft das pro eingegangener Verkaeufer-Antwort auf.
-- Idempotent: wenn (lead_id, dedup_key) schon da ist, wird nichts angelegt.

create or replace function public.sync_incoming_message(
  p_user_id        uuid,
  p_external_id    text,
  p_text           text,
  p_dedup_key      text default null,
  p_received_at    timestamptz default now()
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_msg_id uuid;
begin
  if p_text is null or length(trim(p_text)) = 0 then
    return null;
  end if;

  select id into v_lead_id
    from public.leads
   where user_id = p_user_id
     and external_id = p_external_id
   limit 1;

  if v_lead_id is null then
    return null; -- Lead unbekannt, kein Match (kann passieren bei Antworten zu unbekannten Inseraten)
  end if;

  insert into public.lead_messages (
    lead_id, von, text, delivery_status, dedup_key, created_at
  ) values (
    v_lead_id, 'verkaeufer', p_text, 'received', p_dedup_key, p_received_at
  )
  on conflict (lead_id, dedup_key) where dedup_key is not null
  do nothing
  returning id into v_msg_id;

  return v_msg_id; -- NULL, wenn Duplikat (auch dann ist alles ok)
end; $$;

grant execute on function public.sync_incoming_message(uuid, text, text, text, timestamptz)
  to authenticated, service_role;


-- ============== RPC: claim_pending_outgoing ==============
-- Bot holt sich genau EINE pending-Outgoing-Nachricht und markiert sie
-- atomar als "in Bearbeitung" (delivery_status bleibt 'pending', sent_at = NULL,
-- aber wir geben Lead-Kontext zurueck).
-- Hinweis: bei diesem MVP greift kein zweiter Worker — wir verzichten auf
-- ein "in_progress"-Locking und holen einfach die aelteste pending.

create or replace function public.claim_pending_outgoing(
  p_user_id uuid
)
returns table (
  message_id      uuid,
  lead_id         uuid,
  external_id     text,
  inserat_url     text,
  fahrzeug        text,
  text            text
)
language sql
security invoker
set search_path = public
as $$
  select m.id        as message_id,
         l.id        as lead_id,
         l.external_id,
         l.inserat_url,
         l.fahrzeug,
         m.text
    from public.lead_messages m
    join public.leads l on l.id = m.lead_id
   where l.user_id = p_user_id
     and m.von = 'haendler'
     and m.delivery_status = 'pending'
   order by m.created_at asc
   limit 1;
$$;

grant execute on function public.claim_pending_outgoing(uuid)
  to authenticated, service_role;


-- ============== RPC: mark_outgoing_sent / mark_outgoing_failed ==============

create or replace function public.mark_outgoing_sent(
  p_message_id uuid
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.lead_messages
     set delivery_status = 'sent',
         sent_at = now()
   where id = p_message_id
     and delivery_status = 'pending';
$$;

create or replace function public.mark_outgoing_failed(
  p_message_id uuid,
  p_reason     text
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.lead_messages
     set delivery_status = 'failed',
         failed_at = now(),
         failure_reason = p_reason
   where id = p_message_id
     and delivery_status = 'pending';
$$;

grant execute on function public.mark_outgoing_sent(uuid)         to authenticated, service_role;
grant execute on function public.mark_outgoing_failed(uuid, text) to authenticated, service_role;


-- ============== Update sync_bot_lead: Bot-Send sofort als "sent" markieren ==============

create or replace function public.sync_bot_lead(
  p_user_id        uuid,
  p_external_id    text,
  p_fahrzeug       text,
  p_baujahr        integer  default null,
  p_kilometerstand integer  default null,
  p_getriebe       text     default null,
  p_kraftstoff     text     default null,
  p_erstzulassung  text     default null,
  p_angebot_preis  numeric  default null,
  p_ankaufspreis   numeric  default null,
  p_inserat_url    text     default null,
  p_bot_meta       jsonb    default null,
  p_message_text   text     default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead_id uuid;
begin
  insert into public.leads (
    user_id, external_id, fahrzeug,
    baujahr, kilometerstand, getriebe, kraftstoff, erstzulassung,
    angebot_preis, ankaufspreis,
    inserat_url, bot_meta,
    status, quelle
  ) values (
    p_user_id, p_external_id, p_fahrzeug,
    p_baujahr, p_kilometerstand, p_getriebe, p_kraftstoff, p_erstzulassung,
    p_angebot_preis, p_ankaufspreis,
    p_inserat_url, p_bot_meta,
    'antwort_offen', 'mobile.de Bot'
  )
  on conflict (user_id, external_id) do update set
    angebot_preis  = coalesce(excluded.angebot_preis,  public.leads.angebot_preis),
    ankaufspreis   = coalesce(excluded.ankaufspreis,   public.leads.ankaufspreis),
    kilometerstand = coalesce(excluded.kilometerstand, public.leads.kilometerstand),
    bot_meta       = coalesce(excluded.bot_meta,       public.leads.bot_meta),
    updated_at     = now()
  returning id into v_lead_id;

  if p_message_text is not null and length(trim(p_message_text)) > 0 then
    insert into public.lead_messages (lead_id, von, text, delivery_status, sent_at)
    values (v_lead_id, 'haendler', p_message_text, 'sent', now());
  end if;

  return v_lead_id;
end;
$$;
