import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Kampagnen",
};

const campaigns = [
  {
    name: "Premium-Kombis",
    beschreibung: "BMW Touring, Audi Avant, Mercedes T-Modell · bis 100.000 km",
    leads: 14,
    antworten: 8,
    aktiv: true,
  },
  {
    name: "Audi-Diesel",
    beschreibung: "Audi A4 / A6 · TDI · Baujahr ≥ 2018",
    leads: 9,
    antworten: 5,
    aktiv: true,
  },
  {
    name: "Mercedes-Sterne",
    beschreibung: "C / E-Klasse · Diesel & Benzin · ≤ 150.000 km",
    leads: 6,
    antworten: 3,
    aktiv: true,
  },
  {
    name: "Stadtflitzer",
    beschreibung: "Polo, Fiesta, i20 · ≤ 80.000 km",
    leads: 0,
    antworten: 0,
    aktiv: false,
  },
];

export default function KampagnenPage() {
  return (
    <>
      <Topbar
        title="Kampagnen"
        subtitle="Suchprofile, die automatisch passende Fahrzeuge finden"
        action={<Button>Neue Kampagne</Button>}
      />

      <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {campaigns.map((c) => (
          <Card key={c.name}>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{c.name}</CardTitle>
              <Badge tone={c.aktiv ? "success" : "neutral"}>
                {c.aktiv ? "Aktiv" : "Pausiert"}
              </Badge>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-ink-600">{c.beschreibung}</p>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ink-100">
                <Metric label="Leads gesamt" value={c.leads} />
                <Metric label="Antworten erhalten" value={c.antworten} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" size="sm">
                  Bearbeiten
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={c.aktiv ? "text-red-700" : "text-green-700"}
                >
                  {c.aktiv ? "Pausieren" : "Starten"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
