"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; ok?: boolean };

export async function updateProfile(
  _prev: ProfileState | undefined,
  formData: FormData,
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const firma = String(formData.get("firma") ?? "").trim() || null;
  const telefon = String(formData.get("telefon") ?? "").trim() || null;
  const adresse = String(formData.get("adresse") ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ firma, telefon, adresse })
    .eq("id", user.id);

  if (error) return { error: "Speichern fehlgeschlagen: " + error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
