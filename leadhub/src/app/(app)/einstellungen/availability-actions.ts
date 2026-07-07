"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AvailabilityDayInput = {
  weekday: number; // 1=Mo .. 7=So
  is_active: boolean;
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
};

export type AvailabilityInput = {
  days: AvailabilityDayInput[];
  buffer_minutes: number;
  max_appointments_per_day: number | null;
};

export async function saveAvailability(
  input: AvailabilityInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  // Aktive Tage muessen ein gueltiges Zeitfenster haben (Ende > Start).
  for (const d of input.days) {
    if (d.is_active && d.end_time <= d.start_time) {
      return {
        ok: false,
        error: "Bei aktiven Tagen muss die Endzeit nach der Startzeit liegen.",
      };
    }
  }

  const rows = input.days.map((d) => ({
    dealer_id: user.id,
    weekday: d.weekday,
    is_active: d.is_active,
    start_time: d.start_time,
    end_time: d.end_time,
    slot_minutes: 60,
    buffer_minutes: Math.max(0, input.buffer_minutes || 0),
    max_appointments_per_day: input.max_appointments_per_day,
  }));

  const { error } = await supabase
    .from("dealer_availability")
    .upsert(rows, { onConflict: "dealer_id,weekday" });

  if (error) return { ok: false, error: "Speichern fehlgeschlagen." };

  revalidatePath("/einstellungen");
  return { ok: true };
}
