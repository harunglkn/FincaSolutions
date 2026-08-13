-- =====================================================
-- LeadHub: Kundenverwaltung fuer den Betreiber
-- =====================================================
-- Der Betreiber braucht eine Uebersicht ueber seine Haendler-Kunden:
-- wer ist angelegt, wie viele Leads/Termine laufen, wann war zuletzt
-- Bewegung.
--
-- Bewusst NICHT ueber breite RLS-Freigaben geloest (das wuerde dem Betreiber
-- pauschal Lesezugriff auf alle Tabellen geben). Stattdessen eine einzelne
-- SECURITY-DEFINER-Funktion, die zu Beginn prueft, ob der Aufrufer wirklich
-- Betreiber ist, und nur aggregierte Kennzahlen zurueckgibt.
--
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================

create or replace function public.operator_customers()
returns table (
  id                    uuid,
  email                 text,
  firma                 text,
  vorname               text,
  nachname              text,
  telefon               text,
  adresse               text,
  role                  public.user_role,
  created_at            timestamptz,
  leads_total           bigint,
  leads_30d             bigint,
  unread_replies        bigint,
  appointments_upcoming bigint,
  last_lead_at          timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_operator() then
    raise exception 'Nur fuer den Betreiber.';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.firma,
    p.vorname,
    p.nachname,
    p.telefon,
    p.adresse,
    p.role,
    p.created_at,
    coalesce(l.total, 0)      as leads_total,
    coalesce(l.last30, 0)     as leads_30d,
    coalesce(l.unread, 0)     as unread_replies,
    coalesce(a.upcoming, 0)   as appointments_upcoming,
    l.last_at                 as last_lead_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join lateral (
    select
      count(*)                                              as total,
      count(*) filter (where created_at > now() - interval '30 days') as last30,
      count(*) filter (where has_unread_seller_message)      as unread,
      max(created_at)                                        as last_at
    from public.leads
    where user_id = p.id
  ) l on true
  left join lateral (
    select count(*) as upcoming
    from public.appointments
    where dealer_id = p.id
      and status in ('booked', 'confirmed')
      and appointment_date >= (now() at time zone 'Europe/Berlin')::date
  ) a on true
  order by (p.role = 'operator') desc, p.firma nulls last, u.email;
end; $$;

grant execute on function public.operator_customers() to authenticated;
