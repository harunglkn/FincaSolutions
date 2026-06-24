import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
};

const recentLeads = [
  {
    id: "L-2401",
    fahrzeug: "BMW 320d Touring · 2019 · 89.000 km",
    quelle: "Suchlauf · Premium-Kombis",
    status: "Antwort offen",
    tone: "warning" as const,
  },
  {
    id: "L-2398",
    fahrzeug: "VW Golf 7 GTI · 2017 · 112.000 km",
    quelle: "Direkte Anfrage",
    status: "Termin vereinbart",
    tone: "success" as const,
  },
  {
    id: "L-2395",
    fahrzeug: "Audi A4 Avant · 2020 · 64.000 km",
    quelle: "Suchlauf · Audi-Diesel",
    status: "Einkaufspotenzial hoch",
    tone: "brand" as const,
  },
  {
    id: "L-2390",
    fahrzeug: "Mercedes C 220d · 2018 · 145.000 km",
    quelle: "Suchlauf · Mercedes-Sterne",
    status: "Abgelehnt",
    tone: "danger" as const,
  },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Übersicht über Ihren Tag"
        action={<LinkButton href="/leads">Alle Leads</LinkButton>}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Neue Anfragen heute"
            value={28}
            trend={{ value: "+18 %", direction: "up" }}
            hint="vs. Vortag"
          />
          <StatCard
            label="Offene Antworten"
            value={11}
            trend={{ value: "−3", direction: "down" }}
            hint="vs. Vortag"
          />
          <StatCard
            label="Einkaufspotenzial"
            value="62.400 €"
            trend={{ value: "+9 %", direction: "up" }}
            hint="diese Woche"
          />
          <StatCard
            label="Termine geplant"
            value={6}
            hint="für heute"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Aktuelle Leads</CardTitle>
              <LinkButton href="/leads" variant="ghost" size="sm">
                Alle anzeigen →
              </LinkButton>
            </CardHeader>
            <CardBody className="!p-0">
              <ul className="divide-y divide-ink-100">
                {recentLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-ink-50/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-ink-500">
                          {lead.id}
                        </span>
                        <Badge tone={lead.tone}>{lead.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink-900 truncate">
                        {lead.fahrzeug}
                      </p>
                      <p className="text-xs text-ink-500">{lead.quelle}</p>
                    </div>
                    <LinkButton
                      href={`/leads/${lead.id}`}
                      variant="secondary"
                      size="sm"
                    >
                      Öffnen
                    </LinkButton>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tagesbericht</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Row label="Suchläufe aktiv" value="4" />
              <Row label="Anfragen versendet" value="28" />
              <Row label="Antworten erhalten" value="17" />
              <Row label="Davon mit Potenzial" value="9" />
              <Row label="Termine vereinbart" value="6" />
              <Row label="Ankäufe abgeschlossen" value="2" emphasis />
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600">{label}</span>
      <span
        className={`font-semibold ${
          emphasis ? "text-brand-700" : "text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
