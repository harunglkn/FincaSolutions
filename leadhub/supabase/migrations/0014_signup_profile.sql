-- =====================================================
-- LeadHub: Selbst-Registrierung — Profil-Daten aus der Anmeldung uebernehmen
-- =====================================================
-- Bei der Selbst-Registrierung schickt die App den Firmennamen (und optional
-- Name/Telefon) als Metadaten mit. Dieser Trigger uebernimmt sie ins Profil —
-- auch dann, wenn die E-Mail-Bestaetigung erst spaeter erfolgt (dann existiert
-- beim Anlegen noch keine App-Session, die das Profil fuellen koennte).
--
-- Idempotent: beliebig oft ausfuehrbar.
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, firma, vorname, nachname, telefon)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data->>'firma'), ''),
    nullif(trim(new.raw_user_meta_data->>'vorname'), ''),
    nullif(trim(new.raw_user_meta_data->>'nachname'), ''),
    nullif(trim(new.raw_user_meta_data->>'telefon'), '')
  )
  on conflict (id) do update set
    firma    = coalesce(excluded.firma,    profiles.firma),
    vorname  = coalesce(excluded.vorname,  profiles.vorname),
    nachname = coalesce(excluded.nachname, profiles.nachname),
    telefon  = coalesce(excluded.telefon,  profiles.telefon);
  return new;
end; $$;

-- Trigger existiert bereits aus 0001 (on_auth_user_created) und zeigt auf
-- diese Funktion — durch "create or replace" oben ist er sofort aktiv.
