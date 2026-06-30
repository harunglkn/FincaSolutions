"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/database.types";

export type LeadFormState = { error?: string };

function parseNum(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).replace(/\./g, "").replace(",", ".").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseInt0(v: FormDataEntryValue | null): number | null {
  if (v === null) return null;
  const s = String(v).replace(/\./g, "").trim();
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parseStatus(v: FormDataEntryValue | null): LeadStatus {
  const s = String(v ?? "");
  return (LEAD_STATUSES as string[]).includes(s)
    ? (s as LeadStatus)
    : "antwort_offen";
}

export async function createLead(
  _prev: LeadFormState | undefined,
  formData: FormData,
): Promise<LeadFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const fahrzeug = String(formData.get("fahrzeug") ?? "").trim();
  if (!fahrzeug) return { error: "Bitte das Fahrzeug angeben." };

  const campaign_id_raw = String(formData.get("campaign_id") ?? "");
  const campaign_id =
    campaign_id_raw && campaign_id_raw !== "none" ? campaign_id_raw : null;

  const str = (k: string) =>
    String(formData.get(k) ?? "").trim() || null;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      user_id: user.id,
      fahrzeug,
      baujahr: parseInt0(formData.get("baujahr")),
      kilometerstand: parseInt0(formData.get("kilometerstand")),
      getriebe: str("getriebe"),
      kraftstoff: str("kraftstoff"),
      erstzulassung: str("erstzulassung"),
      hu_bis: str("hu_bis"),
      farbe: str("farbe"),
      verkaeufer_name: str("verkaeufer_name"),
      ort: str("ort"),
      angebot_preis: parseNum(formData.get("angebot_preis")),
      ankaufspreis: parseNum(formData.get("ankaufspreis")),
      status: parseStatus(formData.get("status")),
      quelle: String(formData.get("quelle") ?? "Direkte Anfrage").trim(),
      campaign_id,
      external_id: str("external_id"),
      inserat_url: str("inserat_url"),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Dieses Inserat (Inserat-ID) ist bereits in Ihren Leads gespeichert.",
      };
    }
    return { error: "Speichern fehlgeschlagen: " + error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads/${data.id}`);
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) throw new Error(error.message);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect("/leads");
}

export async function sendMessage(formData: FormData) {
  const leadId = String(formData.get("lead_id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  if (!leadId || !text) return;

  const supabase = await createClient();
  // Nachricht geht in die Sende-Queue. Der Bot pickt sie auf und sendet
  // sie via mobile.de — danach wird sie auf 'sent' markiert.
  const { error } = await supabase.from("lead_messages").insert({
    lead_id: leadId,
    von: "haendler",
    text,
    delivery_status: "pending",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
}

export async function seedDemoData() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_demo_data");
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function markLeadRead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_lead_read", { p_lead_id: leadId });
  if (error) throw new Error(error.message);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
