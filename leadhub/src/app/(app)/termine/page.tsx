import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/database.types";
import { AppointmentCard } from "./appointment-card";

const TABS: [string, string][] = [
  ["kommende", "Kommende"],
  ["heute", "Heute"],
  ["morgen", "Morgen"],
  ["woche", "Diese Woche"],
  ["alle", "Alle"],
  ["verpasst", "Verpasst"],
  ["abgeschlossen", "Abgeschlossen"],
  ["abgesagt", "Abgesagt"],
  ["gekauft", "Gekauft"],
  ["verloren", "Verloren"],
];

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const UPCOMING = new Set(["kommende", "heute", "morgen", "woche"]);

export default async function TerminePage(props: PageProps<"/termine">) {
  const sp = await props.searchParams;
  const rawFilter = Array.isArray(sp.filter) ? sp.filter[0] : sp.filter;
  const filter = rawFilter ?? "kommende";

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*")
    .order("appointment_datetime", { ascending: true })
    .limit(500);
  const all = (data ?? []) as Appointment[];

  const berlinToday = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
  const berlinTomorrow = addDaysISO(berlinToday, 1);
  const weekEnd = addDaysISO(berlinToday, 6);
  const nowMs = Date.now();

  function matches(a: Appointment): boolean {
    switch (filter) {
      case "heute":
        return a.appointment_date === berlinToday;
      case "morgen":
        return a.appointment_date === berlinTomorrow;
      case "woche":
        return a.appointment_date >= berlinToday && a.appointment_date <= weekEnd;
      case "verpasst":
        return a.status === "missed";
      case "abgeschlossen":
        return a.status === "completed";
      case "abgesagt":
        return a.status === "cancelled";
      case "gekauft":
        return a.status === "bought";
      case "verloren":
        return a.status === "lost";
      case "alle":
        return true;
      case "kommende":
      default:
        return (
          (a.status === "booked" || a.status === "confirmed") &&
          new Date(a.appointment_datetime).getTime() >= nowMs
        );
    }
  }

  const list = all.filter(matches);
  list.sort((a, b) => {
    const da = new Date(a.appointment_datetime).getTime();
    const db = new Date(b.appointment_datetime).getTime();
    return UPCOMING.has(filter) ? da - db : db - da;
  });

  const upcomingCount = all.filter(
    (a) =>
      (a.status === "booked" || a.status === "confirmed") &&
      new Date(a.appointment_datetime).getTime() >= nowMs,
  ).length;

  return (
    <>
      <Topbar
        title="Termine"
        subtitle={`${upcomingCount} kommende${upcomingCount === 1 ? "r" : ""} Termin${upcomingCount === 1 ? "" : "e"}`}
      />

      <div className="p-6 lg:p-8 space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(([key, label]) => {
            const active = key === filter;
            return (
              <Link
                key={key}
                href={`/termine?filter=${key}`}
                className={`shrink-0 h-9 px-3.5 inline-flex items-center rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-700 text-white"
                    : "bg-white border border-ink-200 text-ink-700 hover:bg-ink-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="bg-white border border-dashed border-ink-300 rounded-xl p-12 text-center">
            <p className="text-ink-600">Noch keine Termine vorhanden.</p>
            <p className="text-sm text-ink-500 mt-1">
              Öffnen Sie einen Lead und kopieren Sie den Terminlink, um dem
              Verkäufer die Buchung zu ermöglichen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
