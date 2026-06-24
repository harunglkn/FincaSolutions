import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = {
  title: "Adminbereich",
};

const kunden = [
  { name: "Autohaus Musterstadt GmbH", plan: "Premium", aktiv: true },
  { name: "Cars & More UG", plan: "Standard", aktiv: true },
  { name: "Mobile-Trade Köln", plan: "Standard", aktiv: false },
];

export default function AdminPage() {
  return (
    <>
      <Topbar
        title="Adminbereich"
        subtitle="Interne Verwaltung · nur für Finca-Solutions"
      />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
          <strong>Hinweis:</strong> Dieser Bereich ist ein Platzhalter.
          Hier verwaltest du später Kunden, Pläne, Suchläufe und System-Logs.
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Aktive Kunden" value={2} />
          <StatCard label="Suchläufe gesamt" value={14} />
          <StatCard label="Anfragen heute (alle Kunden)" value={72} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Kunden</CardTitle>
          </CardHeader>
          <CardBody className="!p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Autohaus</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {kunden.map((k) => (
                  <tr key={k.name}>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {k.name}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{k.plan}</td>
                    <td className="px-4 py-3">
                      <Badge tone={k.aktiv ? "success" : "neutral"}>
                        {k.aktiv ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </td>
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
