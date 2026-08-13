import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Kunden" };

type CustomerRow = {
  id: string;
  email: string | null;
  firma: string | null;
  vorname: string | null;
  nachname: string | null;
  telefon: string | null;
  adresse: string | null;
  role: "operator" | "customer";
  created_at: string;
  leads_total: number;
  leads_30d: number;
  unread_replies: number;
  appointments_upcoming: number;
  last_lead_at: string | null;
};

export default async function KundenPage() {
  const supabase = await createClient();

  // Betreiber-Seite: Kunden haben hier nichts verloren.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();
  if (me?.role !== "operator") redirect("/dashboard");

  const { data, error } = await supabase.rpc("operator_customers");
  const rows = (data ?? []) as CustomerRow[];
  const customers = rows.filter((r) => r.role === "customer");

  return (
    <>
      <Topbar title="Kunden" subtitle="Ihre Händler-Konten im Überblick" />

      <div className="p-6 lg:p-8 space-y-6">
        {error && (
          <Card className="border-amber-300 bg-amber-50">
            <CardBody className="text-sm text-amber-900">
              Die Kundenliste konnte nicht geladen werden. Bitte prüfen, ob die
              Datenbank-Ergänzung <code>0020_operator_customers.sql</code>{" "}
              ausgeführt wurde.
            </CardBody>
          </Card>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniStat label="Kunden" value={customers.length} />
          <MiniStat
            label="Offene Antworten (alle)"
            value={customers.reduce((s, c) => s + Number(c.unread_replies), 0)}
          />
          <MiniStat
            label="Kommende Termine (alle)"
            value={customers.reduce(
              (s, c) => s + Number(c.appointments_upcoming),
              0,
            )}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Händler-Konten</CardTitle>
            <p className="mt-0.5 text-xs text-ink-500">
              Jeder Kunde sieht ausschließlich seine eigenen Leads und Termine.
            </p>
          </CardHeader>
          <CardBody className="!p-0 overflow-x-auto">
            {customers.length === 0 ? (
              <p className="px-6 py-10 text-sm text-ink-500 text-center">
                Noch keine Kunden angelegt.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Autohaus</th>
                    <th className="px-4 py-3 font-semibold">Zugang</th>
                    <th className="px-4 py-3 font-semibold">Leads gesamt</th>
                    <th className="px-4 py-3 font-semibold">30 Tage</th>
                    <th className="px-4 py-3 font-semibold">Offen</th>
                    <th className="px-4 py-3 font-semibold">Termine</th>
                    <th className="px-4 py-3 font-semibold">Letzte Anfrage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">
                          {c.firma ?? "— ohne Firmenname —"}
                        </div>
                        {(c.vorname || c.nachname || c.telefon) && (
                          <div className="text-xs text-ink-500">
                            {[
                              [c.vorname, c.nachname].filter(Boolean).join(" "),
                              c.telefon,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-700">{c.email}</td>
                      <td className="px-4 py-3 text-ink-900">{c.leads_total}</td>
                      <td className="px-4 py-3 text-ink-900">{c.leads_30d}</td>
                      <td className="px-4 py-3">
                        {Number(c.unread_replies) > 0 ? (
                          <Badge tone="warning">{c.unread_replies}</Badge>
                        ) : (
                          <span className="text-ink-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {Number(c.appointments_upcoming) > 0 ? (
                          <Badge tone="success">
                            {c.appointments_upcoming}
                          </Badge>
                        ) : (
                          <span className="text-ink-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-500">
                        {c.last_lead_at ? formatRelative(c.last_lead_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Neuen Kunden aufnehmen</CardTitle>
          </CardHeader>
          <CardBody className="text-sm text-ink-700 space-y-3">
            <ol className="list-decimal list-inside space-y-1.5">
              <li>
                Der Händler legt sein Konto selbst an unter{" "}
                <span className="font-mono text-xs bg-ink-100 px-1.5 py-0.5 rounded">
                  /register
                </span>{" "}
                — oder Sie legen es für ihn an und geben die Zugangsdaten weiter.
              </li>
              <li>
                Neue Konten sind automatisch <strong>Kunden</strong> und sehen
                nur ihre eigenen Ergebnisse.
              </li>
              <li>
                Der Händler vervollständigt unter <em>Einstellungen</em> seine
                Autohaus-Daten und Termin-Zeiten — die erscheinen auf seiner
                Buchungsseite.
              </li>
              <li>
                Sie richten für ihn ein eigenes mobile.de-Konto und einen
                eigenen Suchlauf ein.
              </li>
            </ol>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)]">
      <p className="text-[13px] font-medium text-ink-500">{label}</p>
      <p className="mt-2 text-[34px] leading-none font-semibold text-ink-900 tabular-nums">
        {value}
      </p>
    </div>
  );
}
