// Laedt die Navigationsdaten (Firma, E-Mail, Badge-Zahlen) EINMAL pro
// Seitenaufruf — genutzt vom (app)-Layout fuer Sidebar UND Handy-Menue.

import { createClient } from "@/lib/supabase/server";
import { classifyReply, needsAction } from "@/lib/reply-classify";

export type UserRole = "operator" | "customer";

export type NavData = {
  firma: string | null;
  email: string | null;
  unread: number;
  todayAppointments: number;
  /** operator = Betreiber (sieht die Suchlauf-Steuerung), customer = Händler-Kunde */
  role: UserRole;
};

export async function getNavData(): Promise<NavData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      firma: null,
      email: null,
      unread: 0,
      todayAppointments: 0,
      role: "customer",
    };
  }

  const berlinToday = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });

  const [{ data: profile }, { data: unreadLeads }, { count: todayCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("firma, role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("leads")
        .select("id")
        .eq("has_unread_seller_message", true)
        .limit(200),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", berlinToday)
        .in("status", ["booked", "confirmed"]),
    ]);

  // Die Zahl im Menue soll nur ECHTE Aufgaben zeigen. Klare Absagen
  // ("kein Interesse", "schon verkauft") werden nicht mitgezaehlt — sonst
  // steht dort dauerhaft eine hohe Zahl, die niemand abarbeiten muss.
  let unread = 0;
  const ids = (unreadLeads ?? []).map((l) => l.id as string);
  if (ids.length > 0) {
    const { data: msgs } = await supabase
      .from("lead_messages")
      .select("lead_id, text, created_at")
      .in("lead_id", ids)
      .eq("von", "verkaeufer")
      .order("created_at", { ascending: false });

    const latestByLead = new Map<string, string>();
    for (const m of msgs ?? []) {
      const lid = m.lead_id as string;
      if (!latestByLead.has(lid)) latestByLead.set(lid, (m.text as string) ?? "");
    }
    unread = ids.filter((id) =>
      needsAction(classifyReply(latestByLead.get(id) ?? null)),
    ).length;
  }

  return {
    firma: profile?.firma ?? null,
    email: user.email ?? null,
    unread,
    todayAppointments: todayCount ?? 0,
    role: (profile?.role as UserRole) ?? "customer",
  };
}
