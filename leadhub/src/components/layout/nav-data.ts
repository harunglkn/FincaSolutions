// Laedt die Navigationsdaten (Firma, E-Mail, Badge-Zahlen) EINMAL pro
// Seitenaufruf — genutzt vom (app)-Layout fuer Sidebar UND Handy-Menue.

import { createClient } from "@/lib/supabase/server";

export type NavData = {
  firma: string | null;
  email: string | null;
  unread: number;
  todayAppointments: number;
};

export async function getNavData(): Promise<NavData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { firma: null, email: null, unread: 0, todayAppointments: 0 };
  }

  const berlinToday = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });

  const [{ data: profile }, { count: unreadCount }, { count: todayCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("firma")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("has_unread_seller_message", true),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", berlinToday)
        .in("status", ["booked", "confirmed"]),
    ]);

  return {
    firma: profile?.firma ?? null,
    email: user.email ?? null,
    unread: unreadCount ?? 0,
    todayAppointments: todayCount ?? 0,
  };
}
