-- =====================================================
-- LeadHub: conv-id-Matching fuer Posteingang (v7)
-- =====================================================
-- Statt Verkaeufer-Antworten nur ueber den Fahrzeug-Titel
-- zuzuordnen (uneindeutig bei mehreren gleichen Modellen),
-- nutzen wir mobile.de's stabile Konversations-ID.
--
-- Prinzip "einmal lernen, dann exakt":
--   1) Antwort kommt mit conversation_id + (Titel-geratener) external_id
--   2) Ist die conversation_id schon an einen Lead gebunden -> exakt dorthin
--   3) Sonst: ueber external_id finden UND conversation_id am Lead speichern
--   4) Ab dann trifft jede weitere Antwort dieser Konversation zu 100%
-- =====================================================


-- ============== Spalte + eindeutiger Index ==============

alter table public.leads
  add column if not exists conversation_id text;

-- Eine Konversations-ID gehoert pro Haendler zu genau einem Lead
create unique index if not exists leads_conversation_id_per_user
  on public.leads (user_id, conversation_id)
  where conversation_id is not null;


-- ============== sync_incoming_message: conv-id-first + learn ==============

-- Alte 5-Parameter-Version entfernen (wird durch 6-Parameter ersetzt)
drop function if exists public.sync_incoming_message(uuid, text, text, text, timestamptz);

create or replace function public.sync_incoming_message(
  p_user_id         uuid,
  p_text            text,
  p_external_id     text        default null,
  p_conversation_id text        default null,
  p_dedup_key       text        default null,
  p_received_at     timestamptz default now()
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_msg_id  uuid;
begin
  if p_text is null or length(trim(p_text)) = 0 then
    return null;
  end if;

  -- 1) Zuerst ueber die Konversations-ID (exakt, sobald einmal gelernt)
  if p_conversation_id is not null and length(trim(p_conversation_id)) > 0 then
    select id into v_lead_id
      from public.leads
     where user_id = p_user_id
       and conversation_id = p_conversation_id
     limit 1;
  end if;

  -- 2) Fallback: ueber die Inserat-ID (Titel-Match des Watchers)
  if v_lead_id is null and p_external_id is not null then
    select id into v_lead_id
      from public.leads
     where user_id = p_user_id
       and external_id = p_external_id
     limit 1;

    -- Wenn gefunden und noch keine conv-id gebunden: jetzt lernen
    if v_lead_id is not null and p_conversation_id is not null then
      update public.leads
         set conversation_id = p_conversation_id,
             updated_at = now()
       where id = v_lead_id
         and conversation_id is null;
    end if;
  end if;

  -- Kein Lead gefunden -> nichts tun (z.B. Inserat nicht in unserer DB)
  if v_lead_id is null then
    return null;
  end if;

  -- Nachricht einfuegen (idempotent ueber dedup_key)
  insert into public.lead_messages (
    lead_id, von, text, delivery_status, dedup_key, created_at
  ) values (
    v_lead_id, 'verkaeufer', p_text, 'received', p_dedup_key, p_received_at
  )
  on conflict (lead_id, dedup_key) where dedup_key is not null
  do nothing
  returning id into v_msg_id;

  return v_msg_id;
end; $$;

grant execute on function public.sync_incoming_message(
  uuid, text, text, text, text, timestamptz
) to authenticated, service_role;
