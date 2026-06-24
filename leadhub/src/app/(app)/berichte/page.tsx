import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = {
  title: "Berichte",
};

const tagesberichte = [
  { datum: "24.06.2026", anfragen: 28, antworten: 17, termine: 6, ankauf: 2 },
  { datum: "23.06.2026", anfragen: 24, antworten: 15, termine: 4, ankauf: 1 },
  { datum: "22.06.2026", anfragen: 31, antworten: 21, termine: 8, ankauf: 3 },
  { datum: "21.06.2026", anfragen: 19, antworten: 11, termine: 3, ankauf: 1 },
  { datum: "20.06.2026", anfragen: 26, antworten: 18, termine: 5, ankauf: 2 },
];

export default function BerichtePage() {
  return (
    <>
      <Topbar
        title="Berichte"
        subtitle="Tagesberichte und Auswertungen"
        action={<Button variant="secondary">Als PDF exportieren</Button>}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Diese Woche · Anfragen" value={128} />
          <StatCard label="Diese Woche · Antworten" value={82} />
          <StatCard label="Diese Woche · Termine" value={26} />
          <StatCard label="Diese Woche · Ankäufe" value={9} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Tagesberichte</CardTitle>
          </CardHeader>
          <CardBody className="!p-0">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Datum</th>
                  <th className="px-4 py-3">Anfragen</th>
                  <th className="px-4 py-3">Antworten</th>
                  <th className="px-4 py-3">Termine</th>
                  <th className="px-4 py-3">Ankäufe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {tagesberichte.map((row) => (
                  <tr key={row.datum} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {row.datum}
                    </td>
                    <td className="px-4 py-3 text-ink-900">{row.anfragen}</td>
                    <td className="px-4 py-3 text-ink-900">{row.antworten}</td>
                    <td className="px-4 py-3 text-ink-900">{row.termine}</td>
                    <td className="px-4 py-3 font-semibold text-brand-800">
                      {row.ankauf}
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
