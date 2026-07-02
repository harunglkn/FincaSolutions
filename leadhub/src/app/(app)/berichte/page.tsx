import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Berichte",
};

type DayBucket = {
  datum: string;
  label: string;
  anfragen: number;
  termine: number;
  abgeschlossen: number;
  antworten: number;
};

function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export default async function BerichtePage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: leads } = await supabase
    .from("leads")
    .select("created_at, status, last_seller_message_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  const buckets: DayBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    buckets.push({
      datum: isoDay(d),
      label: dayLabel(d),
      anfragen: 0,
      termine: 0,
      abgeschlossen: 0,
      antworten: 0,
    });
  }

  for (const lead of leads ?? []) {
    const dayKey = isoDay(new Date(lead.created_at));
    const bucket = buckets.find((b) => b.datum === dayKey);
    if (bucket) {
      bucket.anfragen += 1;
      if (lead.status === "termin_vereinbart") bucket.termine += 1;
      if (lead.status === "abgeschlossen") bucket.abgeschlossen += 1;
    }
    // Verkäufer-Antworten am Tag der letzten Antwort zählen
    if (lead.last_seller_message_at) {
      const replyKey = isoDay(new Date(lead.last_seller_message_at));
      const replyBucket = buckets.find((b) => b.datum === replyKey);
      if (replyBucket) replyBucket.antworten += 1;
    }
  }

  const wocheAnfragen = buckets.reduce((s, b) => s + b.anfragen, 0);
  const wocheTermine = buckets.reduce((s, b) => s + b.termine, 0);
  const wocheAbgeschlossen = buckets.reduce((s, b) => s + b.abgeschlossen, 0);
  const wocheAntworten = buckets.reduce((s, b) => s + b.antworten, 0);

  const maxAnfragen = Math.max(1, ...buckets.map((b) => b.anfragen));

  return (
    <>
      <Topbar
        title="Berichte"
        subtitle="Tagesberichte und Auswertungen — letzte 7 Tage"
      />

      <div className="p-6 lg:p-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Diese Woche · Anfragen" value={wocheAnfragen} />
          <StatCard label="Diese Woche · Termine" value={wocheTermine} />
          <StatCard
            label="Diese Woche · Abgeschlossen"
            value={wocheAbgeschlossen}
          />
          <StatCard
            label="Diese Woche · Antworten"
            value={wocheAntworten}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Anfragen pro Tag</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-end gap-3 h-48 mb-2">
              {buckets.map((b) => {
                const heightPct = (b.anfragen / maxAnfragen) * 100;
                return (
                  <div
                    key={b.datum}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="text-xs font-semibold text-ink-700">
                      {b.anfragen || ""}
                    </div>
                    <div className="w-full bg-ink-100 rounded-md relative overflow-hidden flex-1 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-brand-700 to-brand-500 rounded-md transition-all"
                        style={{ height: `${heightPct}%`, minHeight: b.anfragen > 0 ? "8px" : "0" }}
                      />
                    </div>
                    <div className="text-[10px] text-ink-500 text-center leading-tight">
                      {b.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tagesberichte (Detail)</CardTitle>
          </CardHeader>
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Anfragen</th>
                  <th className="px-4 py-3">Termine</th>
                  <th className="px-4 py-3">Ankäufe</th>
                  <th className="px-4 py-3">Antworten</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {[...buckets].reverse().map((row) => (
                  <tr key={row.datum} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-ink-900">{row.anfragen}</td>
                    <td className="px-4 py-3 text-ink-900">{row.termine}</td>
                    <td className="px-4 py-3 font-semibold text-brand-800">
                      {row.abgeschlossen}
                    </td>
                    <td className="px-4 py-3 text-ink-900">{row.antworten}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
