"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AppointmentActionResult = { ok: boolean; error?: string };

const ERROR_TEXT: Record<string, string> = {
  slot_taken:
    "Dieser Zeitpunkt ist bereits belegt. Bitte eine andere Uhrzeit wählen.",
  slot_unavailable:
    "Dieser Zeitpunkt ist nicht verfügbar. Bitte eine andere Uhrzeit wählen.",
  lead_not_found: "Lead nicht gefunden.",
  not_found: "Termin nicht gefunden.",
  bad_outcome: "Ungültige Aktion.",
  name_required: "Bitte einen Namen angeben.",
  phone_required: "Bitte eine Telefonnummer angeben.",
  past: "Dieser Zeitpunkt liegt in der Vergangenheit.",
};

function mapResult(data: unknown, rpcError: { message: string } | null): AppointmentActionResult {
  if (rpcError) return { ok: false, error: "Aktion fehlgeschlagen." };
  const r = (data ?? {}) as { ok?: boolean; error?: string };
  if (r.ok) return { ok: true };
  return {
    ok: false,
    error: ERROR_TEXT[r.error ?? ""] ?? "Aktion fehlgeschlagen.",
  };
}

function revalidate(leadId?: string) {
  revalidatePath("/termine");
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createManualAppointment(input: {
  leadId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string | null;
}): Promise<AppointmentActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_appointment_manual", {
    p_lead_id: input.leadId,
    p_seller_name: input.sellerName,
    p_seller_phone: input.sellerPhone,
    p_seller_email: input.sellerEmail ?? null,
    p_date: input.date,
    p_time: input.time,
    p_note: input.note ?? null,
  });
  const res = mapResult(data, error);
  if (res.ok) revalidate(input.leadId);
  return res;
}

export async function rescheduleAppointmentAction(input: {
  appointmentId: string;
  date: string;
  time: string;
  leadId?: string;
}): Promise<AppointmentActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: input.appointmentId,
    p_date: input.date,
    p_time: input.time,
  });
  const res = mapResult(data, error);
  if (res.ok) revalidate(input.leadId);
  return res;
}

export async function cancelAppointmentAction(input: {
  appointmentId: string;
  leadId?: string;
}): Promise<AppointmentActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: input.appointmentId,
  });
  const res = mapResult(data, error);
  if (res.ok) revalidate(input.leadId);
  return res;
}

export async function completeAppointmentAction(input: {
  appointmentId: string;
  outcome: "completed" | "bought" | "lost" | "missed";
  leadId?: string;
}): Promise<AppointmentActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_appointment", {
    p_appointment_id: input.appointmentId,
    p_outcome: input.outcome,
  });
  const res = mapResult(data, error);
  if (res.ok) revalidate(input.leadId);
  return res;
}
