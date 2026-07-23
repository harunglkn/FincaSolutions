-- =====================================================
-- LeadHub: Agent-Kopplung Teil 2 — Token-RPCs (Steuerungs-Ebene)
-- =====================================================
-- Der gekoppelte Motor ruft diese Funktionen mit dem OEFFENTLICHEN anon-Key
-- + seinem eigenen Token auf. So braucht der Kunden-PC KEINEN Generalschluessel.
-- Jede Funktion loest den Token -> user_id auf und arbeitet streng nur auf
-- den Daten dieses einen Kunden.
--
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================


-- ============== Helfer: Token -> user_id (nur intern) ==============

create or replace function public.agent_user_id(p_token text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id
    from public.agents
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'utf8')), 'hex')
     and revoked = false
   limit 1;
$$;

-- Nicht oeffentlich aufrufbar machen (die aufrufenden Funktionen unten laufen
-- als Eigentuemer und duerfen ihn trotzdem nutzen).
revoke execute on function public.agent_user_id(text) from public;


-- ============== RPC: Herzschlag ("Motor lebt") ==============

create or replace function public.agent_heartbeat(
  p_token  text,
  p_worker text default 'bot',
  p_detail text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid;
  v_worker text := case when p_worker in ('bot', 'watcher') then p_worker else 'bot' end;
begin
  v_user := public.agent_user_id(p_token);
  if v_user is null then
    return false;
  end if;

  update public.agents
     set last_seen_at = now()
   where token_hash = encode(sha256(convert_to(p_token, 'utf8')), 'hex');

  insert into public.worker_heartbeats (user_id, worker, last_seen_at, detail)
    values (v_user, v_worker, now(), p_detail)
    on conflict (user_id, worker) do update
      set last_seen_at = now(), detail = excluded.detail;

  return true;
end; $$;

grant execute on function public.agent_heartbeat(text, text, text) to anon, authenticated;


-- ============== RPC: aktiven Suchlauf lesen ==============

create or replace function public.agent_active_search(p_token text)
returns table (id uuid, name text, search_url text)
language sql
stable
security definer
set search_path = public
as $$
  select sp.id, sp.name, sp.search_url
    from public.search_profiles sp
   where sp.user_id = public.agent_user_id(p_token)
     and sp.is_active = true
   order by sp.updated_at desc
   limit 1;
$$;

grant execute on function public.agent_active_search(text) to anon, authenticated;


-- ============== RPC: Durchlauf markieren (last_run_at) ==============

create or replace function public.agent_mark_search_run(p_token text, p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  v_user := public.agent_user_id(p_token);
  if v_user is null then
    return;
  end if;
  update public.search_profiles
     set last_run_at = now()
   where id = p_profile_id and user_id = v_user;
end; $$;

grant execute on function public.agent_mark_search_run(text, uuid) to anon, authenticated;
