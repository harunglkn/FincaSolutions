-- =====================================================
-- LeadHub: Agent-Kopplung — jeder Kunde verbindet seinen eigenen Motor
-- =====================================================
-- Ziel: Der Suchlauf-Motor (Programm auf dem Kunden-PC) darf NICHT den
-- Supabase-"Generalschluessel" (service key) bekommen — der oeffnet ALLE Konten.
-- Stattdessen bekommt jeder Motor einen EIGENEN Token, der nur das Konto seines
-- Kunden oeffnet.
--
-- Ablauf:
--   1. Kunde erzeugt im Dashboard einen Kopplungs-Code (create_pairing_code).
--   2. Kunde gibt den Code einmal ins Finca-Programm ein.
--   3. Das Programm loest den Code ein (redeem_pairing_code) und erhaelt EINMALIG
--      einen Token. Gespeichert wird in der DB nur dessen sha256-Pruefsumme.
--
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================


-- ============== Tabelle: agents ==============
-- Ein "Motor"/Suchlauf-Programm pro Kunde (theoretisch auch mehrere moeglich).

create table if not exists public.agents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  label        text,
  token_hash   text not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked      boolean not null default false
);

create index if not exists agents_user_id_idx on public.agents(user_id);
create unique index if not exists agents_token_hash_uidx on public.agents(token_hash);


-- ============== Tabelle: agent_pairing_codes ==============
-- Kurzlebige, einmalig verwendbare Kopplungs-Codes.

create table if not exists public.agent_pairing_codes (
  code       text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at    timestamptz
);

create index if not exists agent_pairing_codes_user_idx
  on public.agent_pairing_codes(user_id);


-- ============== Row-Level Security ==============
-- Nutzer sieht/verwaltet ausschliesslich eigene Agents & Codes.

alter table public.agents             enable row level security;
alter table public.agent_pairing_codes enable row level security;

drop policy if exists agents_own_all on public.agents;
create policy agents_own_all on public.agents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists agent_pairing_codes_own_all on public.agent_pairing_codes;
create policy agent_pairing_codes_own_all on public.agent_pairing_codes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============== Hilfsfunktion: gut lesbarer Zufallscode ==============
-- Ohne verwechselbare Zeichen (kein I, O, 0, 1). Format: XXXX-XXXX.

create or replace function public.gen_pairing_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result   text := '';
  i        int;
begin
  for i in 1..8 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return substr(result, 1, 4) || '-' || substr(result, 5, 4);
end; $$;


-- ============== RPC: Kopplungs-Code erzeugen (Dashboard) ==============
-- Vom eingeloggten Nutzer aufgerufen. 15 Minuten gueltig.

create or replace function public.create_pairing_code(p_label text default null)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
begin
  if v_user is null then
    raise exception 'Nicht angemeldet.';
  end if;

  -- Abgelaufene, ungenutzte Codes dieses Nutzers aufraeumen.
  delete from public.agent_pairing_codes
    where user_id = v_user and used_at is null and expires_at < now();

  loop
    v_code := public.gen_pairing_code();
    begin
      insert into public.agent_pairing_codes (code, user_id, label, expires_at)
        values (v_code, v_user, p_label, now() + interval '15 minutes');
      exit;
    exception when unique_violation then
      -- extrem selten: gleicher Code -> neuer Versuch
    end;
  end loop;

  return v_code;
end; $$;

grant execute on function public.create_pairing_code(text) to authenticated;


-- ============== RPC: Kopplungs-Code einloesen (Agent) ==============
-- Vom Finca-Programm mit dem oeffentlichen anon-Key aufgerufen.
-- Legt einen Agent an und gibt EINMALIG den Token zurueck (Klartext nur hier).

create or replace function public.redeem_pairing_code(p_code text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row   public.agent_pairing_codes;
  v_token text;
  v_hash  text;
begin
  select * into v_row
    from public.agent_pairing_codes
    where code = upper(trim(p_code))
    for update;

  if not found then
    raise exception 'Kopplungs-Code ungueltig.';
  end if;
  if v_row.used_at is not null then
    raise exception 'Kopplungs-Code wurde bereits verwendet.';
  end if;
  if v_row.expires_at < now() then
    raise exception 'Kopplungs-Code ist abgelaufen. Bitte im Dashboard neu erzeugen.';
  end if;

  -- 64-stelliger Zufalls-Token (2x uuid). Nur die Pruefsumme wandert in die DB.
  v_token := replace(gen_random_uuid()::text, '-', '')
           || replace(gen_random_uuid()::text, '-', '');
  v_hash  := encode(sha256(convert_to(v_token, 'utf8')), 'hex');

  insert into public.agents (user_id, label, token_hash, last_seen_at)
    values (v_row.user_id, v_row.label, v_hash, now());

  update public.agent_pairing_codes
    set used_at = now()
    where code = v_row.code;

  return v_token;
end; $$;

grant execute on function public.redeem_pairing_code(text) to anon, authenticated;
