-- =====================================================
-- LeadHub: Bot-Anbindung Vertiefung (v3)
-- =====================================================
-- Ausfuehren in: Supabase Dashboard -> SQL Editor
--                -> New query -> Inhalt einfuegen -> Run
--
-- 1) bot_meta-Spalte (JSONB) fuer Preisfindungs-Daten
-- 2) Unique-Index neu, damit ON CONFLICT (Upsert) funktioniert
-- 3) RPC public.sync_bot_lead() — atomare Funktion fuer den Bot,
--    schreibt Lead + Nachricht in EINEM Aufruf
-- =====================================================


-- ============== Bot-Metadaten als JSONB ==============

alter table public.leads
  add column if not exists bot_meta jsonb;


-- ============== Unique-Index ohne WHERE-Klausel ==============
-- (Damit Postgres ON CONFLICT korrekt findet. Mehrere NULL-Werte sind
--  in Postgres-Unique-Constraints sowieso erlaubt — also kein Problem
--  fuer manuell angelegte Leads ohne external_id.)

drop index if exists public.leads_external_id_per_user;
create unique index if not exists leads_external_id_per_user
  on public.leads (user_id, external_id);


-- ============== RPC: sync_bot_lead ==============
-- Wird vom Python-Bot per supabase.rpc('sync_bot_lead', {...}) aufgerufen.
-- - Legt den Lead an ODER aktualisiert ihn (Upsert per external_id)
-- - Wenn message_text dabei ist: schreibt zusaetzlich eine Nachricht
-- - Atomar: entweder beides klappt, oder nichts
-- - Gibt die lead_id zurueck

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
    -- bei Wiederholung: Preis/Bot-Daten frisch halten, Status nicht ueberschreiben
    angebot_preis  = coalesce(excluded.angebot_preis,  public.leads.angebot_preis),
    ankaufspreis   = coalesce(excluded.ankaufspreis,   public.leads.ankaufspreis),
    kilometerstand = coalesce(excluded.kilometerstand, public.leads.kilometerstand),
    bot_meta       = coalesce(excluded.bot_meta,       public.leads.bot_meta),
    updated_at     = now()
  returning id into v_lead_id;

  if p_message_text is not null and length(trim(p_message_text)) > 0 then
    insert into public.lead_messages (lead_id, von, text)
    values (v_lead_id, 'haendler', p_message_text);
  end if;

  return v_lead_id;
end;
$$;

grant execute on function public.sync_bot_lead(
  uuid, text, text, integer, integer, text, text, text,
  numeric, numeric, text, jsonb, text
) to authenticated, service_role;
