"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SuchlaufResult = { ok: boolean; error?: string };

function isValidMobileSearch(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith("mobile.de") &&
      u.pathname.includes("/fahrzeuge/search")
    );
  } catch {
    return false;
  }
}

export async function createSearchProfile(input: {
  name: string;
  url: string;
}): Promise<SuchlaufResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const name = input.name.trim();
  const url = input.url.trim();
  if (!name) return { ok: false, error: "Bitte einen Namen vergeben." };
  if (!isValidMobileSearch(url)) {
    return {
      ok: false,
      error:
        "Das sieht nicht nach einer mobile.de-Suchadresse aus. Bitte die komplette Adresse aus der Adresszeile kopieren.",
    };
  }

  const { error } = await supabase.from("search_profiles").insert({
    user_id: user.id,
    name,
    search_url: url,
    is_active: false,
  });
  if (error) return { ok: false, error: "Speichern fehlgeschlagen." };

  revalidatePath("/suchlauf");
  return { ok: true };
}

export async function setSearchProfileActive(input: {
  id: string;
  active: boolean;
}): Promise<SuchlaufResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  // Es läuft immer nur EIN Suchlauf: beim Aktivieren die anderen ausschalten.
  if (input.active) {
    await supabase
      .from("search_profiles")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .neq("id", input.id);
  }

  const { error } = await supabase
    .from("search_profiles")
    .update({ is_active: input.active })
    .eq("id", input.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Aktion fehlgeschlagen." };

  revalidatePath("/suchlauf");
  revalidatePath("/dashboard");
  return { ok: true };
}

export type PairingResult = { ok: boolean; code?: string; error?: string };

export async function createPairingCode(): Promise<PairingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { data, error } = await supabase.rpc("create_pairing_code", {
    p_label: null,
  });
  if (error || !data) {
    return { ok: false, error: "Code konnte nicht erzeugt werden." };
  }

  revalidatePath("/suchlauf");
  return { ok: true, code: String(data) };
}

export async function revokeAgent(id: string): Promise<SuchlaufResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  // Trennen = als widerrufen markieren; der Token wird dadurch unbrauchbar.
  const { error } = await supabase
    .from("agents")
    .update({ revoked: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Trennen fehlgeschlagen." };

  revalidatePath("/suchlauf");
  return { ok: true };
}

export async function deleteSearchProfile(id: string): Promise<SuchlaufResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const { error } = await supabase
    .from("search_profiles")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: "Löschen fehlgeschlagen." };

  revalidatePath("/suchlauf");
  return { ok: true };
}
