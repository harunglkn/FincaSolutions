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

type ConvLead = {
  id: string;
  bot_meta: { template_variant?: string | null } | null;
  last_seller_message_at: string | null;
  appointment_id: string | null;
  status: string;
};

function variantLabel(v: string): string {
  const m = v.match(/^anrede(\d+)_text(\d+)$/);
  if (m) return `Anrede ${m[1]} · Text ${m[2]}`;
  return v;
}

export default async function BerichtePage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [{ data: leads }, { data: convData }] = await Promise.all([
    supabase
      .from("leads")
      .select("created_at, status, last_seller_message_at")
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("leads")
      .select("id, bot_meta, last_seller_message_at, appointment_id, status")
      .limit(5000),
  ]);

  // ---- Erfolgs-Trichter + Textvarianten (Gesamtbestand) ----
  const conv = (convData ?? []) as ConvLead[];
  const totalAll = conv.length;
  const replied = conv.filter((l) => l.last_seller_message_at).length;
  const withTermin = conv.filter((l) => l.appointment_id).length;
  const gekauft = conv.filter((l) => l.status === "abgeschlossen").length;
  const pct = (n: number, d: number) =>
    d > 0 ? `${Math.round((n / d) * 100)} %` : "—";

  const variantStats = new Map<
    string,
    { sent: number; replies: number; termine: number }
  >();
  for (const l of conv) {
    const v = l.bot_meta?.template_variant;
    if (!v) continue;
    const s = variantStats.get(v) ?? { sent: 0, replies: 0, termine: 0 };
    s.sent += 1;
    if (l.last_seller_message_at) s.replies += 1;
    if (l.appointment_id) s.termine += 1;
    variantStats.set(v, s);
  }
  const variants = [...variantStats.entries()]
    .map(([name, s]) => ({
      name,
      ...s,
      rate: s.sent > 0 ? s.replies / s.sent : 0,
    }))
    .sort((a, b) => b.rate - a.rate || b.sent - a.sent);

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
          <StatCard
            label="Diese Woche · Anfragen"
            value={wocheAnfragen}
            accent="brand"
            icon={
              <StatIcon d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" />
            }
          />
          <StatCard
            label="Diese Woche · Termine"
            value={wocheTermine}
            accent="success"
            icon={
              <StatIcon d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
            }
          />
          <StatCard
            label="Diese Woche · Abgeschlossen"
            value={wocheAbgeschlossen}
            accent="amber"
            icon={
              <StatIcon d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            }
          />
          <StatCard
            label="Diese Woche · Antworten"
            value={wocheAntworten}
            accent="accent"
            icon={
              <StatIcon d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
            }
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Erfolgs-Trichter · gesamt</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <FunnelRow
                label="Anfragen gesendet"
                value={totalAll}
                share={100}
                hint="100 %"
              />
              <FunnelRow
                label="Antworten erhalten"
                value={replied}
                share={totalAll > 0 ? (replied / totalAll) * 100 : 0}
                hint={`${pct(replied, totalAll)} Antwortquote`}
              />
              <FunnelRow
                label="Termine gebucht"
                value={withTermin}
                share={totalAll > 0 ? (withTermin / totalAll) * 100 : 0}
                hint={`${pct(withTermin, totalAll)} aller Anfragen · ${pct(withTermin, replied)} der Antworten`}
              />
              <FunnelRow
                label="Abgeschlossen / gekauft"
                value={gekauft}
                share={totalAll > 0 ? (gekauft / totalAll) * 100 : 0}
                hint={`${pct(gekauft, totalAll)} aller Anfragen`}
                emphasis
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Beste Textvarianten</CardTitle>
            </CardHeader>
            <CardBody className="!p-0">
              {variants.length === 0 ? (
                <p className="px-6 py-8 text-sm text-ink-500">
                  Noch keine Daten — die verwendete Textvariante wird seit dem
                  18.07.2026 pro Anfrage erfasst. Nach den nächsten Suchläufen
                  siehst du hier, welche Formulierung die meisten Antworten
                  bringt.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Variante</th>
                      <th className="px-4 py-3 font-semibold">Gesendet</th>
                      <th className="px-4 py-3 font-semibold">Antworten</th>
                      <th className="px-4 py-3 font-semibold">Quote</th>
                      <th className="px-4 py-3 font-semibold">Termine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {variants.map((v, i) => (
                      <tr key={v.name} className="hover:bg-ink-50/60">
                        <td className="px-4 py-3 font-medium text-ink-900">
                          {i === 0 && v.replies > 0 && "🏆 "}
                          {variantLabel(v.name)}
                        </td>
                        <td className="px-4 py-3 text-ink-900">{v.sent}</td>
                        <td className="px-4 py-3 text-ink-900">{v.replies}</td>
                        <td className="px-4 py-3 font-semibold text-brand-800">
                          {pct(v.replies, v.sent)}
                        </td>
                        <td className="px-4 py-3 text-ink-900">{v.termine}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
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

function StatIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FunnelRow({
  label,
  value,
  share,
  hint,
  emphasis,
}: {
  label: string;
  value: number;
  share: number;
  hint: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        <span
          className={`text-sm font-semibold tabular-nums ${
            emphasis ? "text-brand-700" : "text-ink-900"
          }`}
        >
          {value}
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            emphasis
              ? "bg-gradient-to-r from-accent-500 to-brand-600"
              : "bg-gradient-to-r from-brand-600 to-brand-500"
          }`}
          style={{ width: `${Math.max(share, value > 0 ? 3 : 0)}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </div>
  );
}
