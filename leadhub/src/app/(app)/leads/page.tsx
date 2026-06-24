import Link from "next/link";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Leads",
};

const leads = [
  {
    id: "L-2401",
    fahrzeug: "BMW 320d Touring",
    baujahr: 2019,
    km: "89.000",
    verkaeufer: "Marco S.",
    ort: "Köln",
    angebot: "14.900 €",
    potenzial: "13.200 €",
    status: "Antwort offen",
    tone: "warning" as const,
  },
  {
    id: "L-2398",
    fahrzeug: "VW Golf 7 GTI",
    baujahr: 2017,
    km: "112.000",
    verkaeufer: "Tanja K.",
    ort: "Düsseldorf",
    angebot: "16.500 €",
    potenzial: "14.800 €",
    status: "Termin vereinbart",
    tone: "success" as const,
  },
  {
    id: "L-2395",
    fahrzeug: "Audi A4 Avant",
    baujahr: 2020,
    km: "64.000",
    verkaeufer: "B. Yilmaz",
    ort: "Essen",
    angebot: "22.900 €",
    potenzial: "21.000 €",
    status: "Einkaufspotenzial hoch",
    tone: "brand" as const,
  },
  {
    id: "L-2390",
    fahrzeug: "Mercedes C 220d",
    baujahr: 2018,
    km: "145.000",
    verkaeufer: "F. Becker",
    ort: "Dortmund",
    angebot: "18.700 €",
    potenzial: "—",
    status: "Abgelehnt",
    tone: "danger" as const,
  },
  {
    id: "L-2388",
    fahrzeug: "Skoda Octavia Combi",
    baujahr: 2019,
    km: "98.500",
    verkaeufer: "L. Hofmann",
    ort: "Bonn",
    angebot: "12.200 €",
    potenzial: "11.300 €",
    status: "Antwort offen",
    tone: "warning" as const,
  },
];

export default function LeadsPage() {
  return (
    <>
      <Topbar
        title="Leads"
        subtitle="Alle Fahrzeug-Anfragen Ihres Autohauses"
        action={<LinkButton href="/kampagnen">Neue Kampagne</LinkButton>}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Suchen nach Fahrzeug, Verkäufer, Ort …"
            className="h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm w-full sm:w-80"
          />
          <FilterChip label="Alle" active />
          <FilterChip label="Antwort offen" />
          <FilterChip label="Hohes Potenzial" />
          <FilterChip label="Termin" />
          <FilterChip label="Abgelehnt" />
        </div>

        <Card>
          <CardBody className="!p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <Th>Lead</Th>
                  <Th>Fahrzeug</Th>
                  <Th>Verkäufer</Th>
                  <Th>Angebot</Th>
                  <Th>Einkaufspotenzial</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-ink-50/60">
                    <Td>
                      <span className="font-mono text-xs text-ink-500">
                        {lead.id}
                      </span>
                    </Td>
                    <Td>
                      <div className="font-medium text-ink-900">
                        {lead.fahrzeug}
                      </div>
                      <div className="text-xs text-ink-500">
                        {lead.baujahr} · {lead.km} km
                      </div>
                    </Td>
                    <Td>
                      <div className="text-ink-900">{lead.verkaeufer}</div>
                      <div className="text-xs text-ink-500">{lead.ort}</div>
                    </Td>
                    <Td className="text-ink-900">{lead.angebot}</Td>
                    <Td className="font-semibold text-brand-800">
                      {lead.potenzial}
                    </Td>
                    <Td>
                      <Badge tone={lead.tone}>{lead.status}</Badge>
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        Öffnen →
                      </Link>
                    </Td>
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

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={[
        "h-10 px-3 rounded-lg text-sm font-medium border transition-colors",
        active
          ? "bg-brand-50 border-brand-200 text-brand-800"
          : "bg-white border-ink-200 text-ink-700 hover:bg-ink-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
