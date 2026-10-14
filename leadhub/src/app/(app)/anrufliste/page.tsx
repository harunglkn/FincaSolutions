import Link from "next/link";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { AnruflisteTabelle } from "@/components/anrufliste/anrufliste-tabelle";
import { createClient } from "@/lib/supabase/server";
import { type Potenzialstufe } from "@/lib/kaufpotenzial";
import {
  ANRUFLISTE_AUSWAHL,
  kurzDatum,
  ladeAnrufliste,
  type AnruflisteAuswahl,
} from "@/lib/anrufliste";

export const metadata: Metadata = {
  title: "Anrufliste",
};

const ABSCHNITTE: { stufe: Potenzialstufe; titel: string; text: string }[] = [
  {
    stufe: "top",
    titel: "Zuerst anrufen",
    text: "Inseriert 10–35 % unter Marktwert, dein Angebot nah am Preis des Verkäufers.",
  },
  {
    stufe: "solide",
    titel: "Danach",
    text: "Inseriert 5–10 % unter Marktwert.",
  },
  {
    stufe: "pruefen",
    titel: "Auffällig günstig – vor dem Termin klären",
    text: "Mehr als 35 % unter Marktwert ist ungewöhnlich: Unfall oder Motorschaden? Export? Echtes Inserat?",
  },
];

// Zeitpunkt der Anfrage - einmal pro Aufruf, ausserhalb des Renderns.
function jetztMs() {
  return Date.now();
}

export default async function AnruflistePage(props: PageProps<"/anrufliste">) {
  const sp = await props.searchParams;
  const roh = typeof sp?.lauf === "string" ? sp.lauf : "1";
  const auswahl: AnruflisteAuswahl = roh in ANRUFLISTE_AUSWAHL ? (roh as AnruflisteAuswahl) : "1";

  const supabase = await createClient();
  const { eintraege, laufTage, zeitraum, fehler } = await ladeAnrufliste(
    supabase,
    auswahl,
    jetztMs(),
  );

  return (
    <>
      <Topbar
        title="Anrufliste"
        subtitle={`${eintraege.length} Fahrzeuge zum Anrufen · ${ANRUFLISTE_AUSWAHL[auswahl].label} (${zeitraum})`}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <nav className="flex flex-wrap gap-2" aria-label="Zeitraum">
          {(Object.keys(ANRUFLISTE_AUSWAHL) as AnruflisteAuswahl[]).map((key) => {
            const aktiv = key === auswahl;
            const tage =
              key === "7"
                ? ""
                : ` (${laufTage.slice(0, ANRUFLISTE_AUSWAHL[key].laeufe).sort().map(kurzDatum).join(", ")})`;
            return (
              <Link
                key={key}
                href={key === "1" ? "/anrufliste" : `/anrufliste?lauf=${key}`}
                aria-current={aktiv ? "page" : undefined}
                className={[
                  "h-9 px-3.5 rounded-full text-sm font-medium border inline-flex items-center transition-colors",
                  aktiv
                    ? "bg-brand-700 border-brand-700 text-white"
                    : "bg-white border-ink-200 text-ink-700 hover:bg-ink-50",
                ].join(" ")}
              >
                {ANRUFLISTE_AUSWAHL[key].label}
                {laufTage.length > 0 && <span className="ml-1 opacity-75">{tage}</span>}
              </Link>
            );
          })}
        </nav>

        <p className="text-sm text-ink-600 max-w-3xl">
          Die guten Fahrzeuge aus den Läufen des Bots: angeschrieben und{" "}
          <strong className="text-ink-900">unter dem Marktwert</strong> inseriert.
          Klick auf das Fahrzeug öffnet das Inserat. Erledigt? Im Lead den Status
          auf „Termin vereinbart“ oder „Abgelehnt“ setzen – dann verschwindet es
          von der Liste.
        </p>

        {fehler && (
          <Card>
            <CardBody className="text-sm text-red-700">
              Die Leads konnten nicht geladen werden. Bitte die Seite neu laden.
            </CardBody>
          </Card>
        )}

        {!fehler && eintraege.length === 0 && (
          <Card>
            <CardBody className="py-12 text-center text-sm text-ink-500">
              Gerade nichts anzurufen. Sobald der Bot Fahrzeuge unter Marktwert
              anschreibt, erscheinen sie hier.
            </CardBody>
          </Card>
        )}

        {ABSCHNITTE.map(({ stufe, titel, text }) => {
          const liste = eintraege.filter((e) => e.potenzial.stufe === stufe);
          if (liste.length === 0) return null;
          return (
            <Card key={stufe}>
              <CardHeader>
                <CardTitle>
                  {titel}{" "}
                  <span className="text-ink-400 font-normal">({liste.length})</span>
                </CardTitle>
                <p className="mt-0.5 text-xs text-ink-500">{text}</p>
              </CardHeader>
              <CardBody className="!p-0">
                <AnruflisteTabelle eintraege={liste} />
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
