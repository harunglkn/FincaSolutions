-- =====================================================
-- LeadHub: Unread-Markierung fuer Verkaeufer-Antworten (v6)
-- =====================================================
-- Wenn ein Verkaeufer antwortet, wird der Lead automatisch
-- als "ungelesen" markiert. Der Haendler sieht das im
-- Dashboard und in der Leads-Liste als roten NEU-Badge.
-- Sobald er den Lead oeffnet, wird er automatisch als
-- gelesen markiert.
-- =====================================================


-- ============== Spalte fuer Unread-Status ==============

alter table public.leads
  add column if not exists has_unread_seller_message boolean not null default false,
  add column if not exists last_seller_message_at    timestamptz;

create index if not exists leads_unread_idx
  on public.leads (user_id, has_unread_seller_message)
  where has_unread_seller_message = true;


-- ============== Trigger: bei neuer Verkaeufer-Antwort markieren ==============

create or replace function public.mark_lead_unread_on_seller_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.von = 'verkaeufer' then
    update public.leads
       set has_unread_seller_message = true,
           last_seller_message_at = greatest(coalesce(last_seller_message_at, new.created_at), new.created_at),
           updated_at = now()
     where id = new.lead_id;
  end if;
  return new;
end; $$;

drop trigger if exists lead_messages_mark_unread on public.lead_messages;
create trigger lead_messages_mark_unread
  after insert on public.lead_messages
  for each row
  execute function public.mark_lead_unread_on_seller_message();

-- Bestehende Leads, die schon Verkaeufer-Antworten haben, korrekt markieren:
update public.leads l
   set has_unread_seller_message = true,
       last_seller_message_at = (
         select max(m.created_at)
           from public.lead_messages m
          where m.lead_id = l.id
            and m.von = 'verkaeufer'
       )
 where exists (
   select 1
     from public.lead_messages m
    where m.lead_id = l.id
      and m.von = 'verkaeufer'
 );


-- ============== RPC: als gelesen markieren ==============

create or replace function public.mark_lead_read(p_lead_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.leads
     set has_unread_seller_message = false
   where id = p_lead_id
     and user_id = auth.uid();
$$;

grant execute on function public.mark_lead_read(uuid) to authenticated;
