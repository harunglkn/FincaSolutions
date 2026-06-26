"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CampaignFormState = { error?: string };

export async function createCampaign(
  _prev: CampaignFormState | undefined,
  formData: FormData,
): Promise<CampaignFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Bitte einen Namen angeben." };

  const beschreibung =
    String(formData.get("beschreibung") ?? "").trim() || null;

  const { error } = await supabase.from("campaigns").insert({
    user_id: user.id,
    name,
    beschreibung,
    aktiv: true,
  });
  if (error) return { error: "Speichern fehlgeschlagen: " + error.message };

  revalidatePath("/kampagnen");
  revalidatePath("/dashboard");
  return {};
}

export async function toggleCampaign(campaignId: string, aktiv: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ aktiv })
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
  revalidatePath("/kampagnen");
}
