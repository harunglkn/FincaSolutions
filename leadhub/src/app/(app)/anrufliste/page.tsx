import Link from "next/link";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { CheapestBadge } from "@/components/ui/cheapest-badge";
import { createClient } from "@/lib/supabase/server";
import { isCheapestPrice } from "@/lib/database.types";
import { formatEuro, formatKm, formatRelative } from "@/lib/format";
import {
  POTENZIAL_STUFE_LABEL,
  bewertePotenzial,
  type Potenzial,
  type Potenzialstufe,
} from "@/lib/kaufpotenzial";

export const metadata: Metadata = {
  title: "Anrufliste",
};

// Ein "Lauf" ist ein Arbeitstag des Bots (alle Leads eines Kalendertags,
// auch wenn der Bot zwischendurch neu gestartet wurde). Gesucht wird in den
// letzten 14 Tagen; aeltere Inserate sind meist schon weg.
const SUCHTAGE = 14;
const AUSWAHL = {
  "1": { label: "Letzter Lauf", laeufe: 1 },
  "2": { label: "Letzte 2 Läufe", laeufe: 2 },
  "7": { label: "Letzte 7 Tage", laeufe: 7 },
} as const;
type Auswahl = keyof typeof AUSWAHL;
// Nur Leads, die noch niemand bearbeitet hat. Wer "Termin vereinbart",
// "Abgelehnt" oder "Abgeschlossen" setzt, nimmt den Lead damit von der Liste.
const OFFENE_STATUS = ["antwort_offen", "hohes_potenzial"];

type Zeile = {
  id: string;
  fahrzeug: string;
  baujahr: number | null;
  erstzulassung: string | null;
  kilometerstand: number | null;
  getriebe: string | null;
  kraftstoff: string | null;
  angebot_preis: number | null;
  ankaufspreis: number | null;
  inserat_url: string | null;
  has_unread_seller_message: boolean;
  last_seller_message_at: string | null;
  next_appointment_at: string | null;
  created_at: string;
  anker: unknown;
  conf: unknown;
  vergleiche: unknown;
  low: unknown;
  ps: unknown;
};

type Eintrag = Zeile & { potenzial: Potenzial };

const SPALTEN = [
  "id, fahrzeug, baujahr, erstzulassung, kilometerstand, getriebe, kraftstoff",
  "angebot_preis, ankaufspreis, inserat_url",
  "has_unread_seller_message, last_seller_message_at, next_appointment_at, created_at",
  "anker:bot_meta->comparison_meta->market_anchor_price",
  "conf:bot_meta->comparison_meta->confidence",
  "vergleiche:bot_meta->comparison_meta->filtered_prices",
  "low:bot_meta->comparison_meta->lowest_market_price",
  "ps:bot_meta->vehicle_data_raw->ps",
].join(", ");

const ABSCHNITTE: { stufe: Potenzialstufe; titel: string; text: string }[] = [
  {
    stufe: "top",
    titel: "Zuerst anrufen",
    text: "Inseriert 10–35 % unter Marktwert, Richtpreis nah am Preis des Verkäufers.",
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
function zeitfenster() {
  const jetzt = Date.now();
  return { jetzt, seit: new Date(jetzt - SUCHTAGE * 24 * 60 * 60 * 1000).toISOString() };
}

// Kalendertag in deutscher Zeit, z. B. "2026-10-12".
function berlinTag(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

function kurzDatum(tag: string): string {
  return `${tag.slice(8, 10)}.${tag.slice(5, 7)}.`;
}

export default async function AnruflistePage(props: PageProps<"/anrufliste">) {
  const sp = await props.searchParams;
  const roh = typeof sp?.lauf === "string" ? sp.lauf : "1";
  const auswahl: Auswahl = roh in AUSWAHL ? (roh as Auswahl) : "1";
  const supabase = await createClient();
  const { jetzt, seit } = zeitfenster();

  function abfrage(withCount = false) {
    return supabase
      .from("leads")
      .select(SPALTEN, withCount ? { count: "exact" } : undefined)
      .gte("created_at", seit)
      .in("status", OFFENE_STATUS)
      .order("created_at", { ascending: false });
  }

  // Die Datenbank liefert hoechstens 1000 Zeilen pro Abfrage: erste Seite mit
  // Gesamtzahl, die restlichen Seiten gleichzeitig.
  const STEP = 1000;
  const first = await abfrage(true).range(0, STEP - 1);
  const total = first.count ?? first.data?.length ?? 0;
  const rest = [];
  for (let from = STEP; from < total; from += STEP) {
    rest.push(abfrage().range(from, from + STEP - 1));
  }
  const seiten = [first, ...(await Promise.all(rest))];
  const zeilen = seiten.flatMap((s) => (s.data ?? []) as unknown as Zeile[]);
  const fehler = seiten.find((s) => s.error)?.error;

  // Laeufe = die Tage, an denen der Bot Leads mit Marktvergleich angelegt hat.
  const laufTage = [
    ...new Set(zeilen.filter((z) => z.anker != null).map((z) => berlinTag(z.created_at))),
  ].sort((a, b) => b.localeCompare(a));
  const gewaehlteTage =
    auswahl === "7"
      ? new Set(laufTage.filter((t) => t >= berlinTag(new Date(jetzt - 6 * 86_400_000).toISOString())))
      : new Set(laufTage.slice(0, AUSWAHL[auswahl].laeufe));
  const zeitraum =
    gewaehlteTage.size === 0
      ? "keine Läufe"
      : [...gewaehlteTage].sort().map(kurzDatum).join(", ");

  const eintraege: Eintrag[] = [];
  for (const z of zeilen) {
    if (!gewaehlteTage.has(berlinTag(z.created_at))) continue;
    // Wer schon einen Termin hat, muss nicht mehr angerufen werden.
    if (z.next_appointment_at && new Date(z.next_appointment_at).getTime() >= jetzt) {
      continue;
    }
    const potenzial = bewertePotenzial({
      fahrzeug: z.fahrzeug,
      inserat: z.angebot_preis,
      richtpreis: z.ankaufspreis,
      marktwert: z.anker,
      confidence: z.conf,
      vergleiche: z.vergleiche,
    });
    if (potenzial) eintraege.push({ ...z, potenzial });
  }

  // Verkaeufer, die schon geantwortet haben, zuerst; dann nach Luft in Euro.
  eintraege.sort(
    (a, b) =>
      Number(!!b.last_seller_message_at) - Number(!!a.last_seller_message_at) ||
      b.potenzial.luftEur - a.potenzial.luftEur,
  );

  const stand = new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <Topbar
        title="Anrufliste"
        subtitle={`${eintraege.length} Fahrzeuge zum Anrufen · ${AUSWAHL[auswahl].label} (${zeitraum}) · Stand ${stand}`}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <nav className="flex flex-wrap gap-2" aria-label="Zeitraum">
          {(Object.keys(AUSWAHL) as Auswahl[]).map((key) => {
            const aktiv = key === auswahl;
            const tage =
              key === "7" ? "" : ` (${laufTage.slice(0, AUSWAHL[key].laeufe).sort().map(kurzDatum).join(", ")})`;
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
                {AUSWAHL[key].label}
                {laufTage.length > 0 && <span className="ml-1 opacity-75">{tage}</span>}
              </Link>
            );
          })}
        </nav>

        <Card>
          <CardBody className="space-y-2 text-sm text-ink-600">
            <p>
              Die guten Fahrzeuge aus den letzten Läufen des Bots: angeschrieben
              und <strong className="text-ink-900">unter dem Marktwert</strong>{" "}
              inseriert. Selbst zum Inseratspreis bliebe noch Luft – ein Anruf
              lohnt sich.
            </p>
            <p>
              <strong className="text-ink-900">Erledigt?</strong> Im Lead den
              Status auf „Termin vereinbart“ oder „Abgelehnt“ setzen. Dann
              verschwindet das Fahrzeug von dieser Liste. Ob ein Inserat noch
              online ist, zeigt mobile.de beim Öffnen.
            </p>
          </CardBody>
        </Card>

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
            <section key={stufe} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-base font-semibold text-ink-900">
                  {titel}{" "}
                  <span className="text-ink-400 font-normal">({liste.length})</span>
                </h2>
                <p className="text-xs text-ink-500">{text}</p>
              </div>
              <div className="space-y-3">
                {liste.map((e) => (
                  <Fahrzeug key={e.id} e={e} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

const STUFE_FARBE: Record<Potenzialstufe, string> = {
  top: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  solide: "bg-brand-50 text-brand-800 ring-brand-200",
  pruefen: "bg-amber-50 text-amber-800 ring-amber-200",
};

function Fahrzeug({ e }: { e: Eintrag }) {
  const p = e.potenzial;
  const ps = Number(e.ps);
  const fakten = [
    e.erstzulassung ? `EZ ${e.erstzulassung}` : e.baujahr ? `Bj. ${e.baujahr}` : null,
    e.kilometerstand !== null ? formatKm(e.kilometerstand) : null,
    Number.isFinite(ps) && ps > 0 ? `${ps} PS` : null,
    e.getriebe,
    e.kraftstoff,
  ].filter(Boolean);

  return (
    <Card>
      <CardBody className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STUFE_FARBE[p.stufe]}`}
            >
              {POTENZIAL_STUFE_LABEL[p.stufe]}
            </span>
            {e.last_seller_message_at && (
              <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Hat geantwortet
              </span>
            )}
            {isCheapestPrice(e.angebot_preis, e.low) && <CheapestBadge size="sm" />}
            <span className="text-xs text-ink-500">
              angeschrieben {formatRelative(e.created_at)}
            </span>
          </div>
          <div className="font-semibold text-ink-900 break-words">{e.fahrzeug}</div>
          <div className="text-xs text-ink-500 break-words">{fakten.join(" · ")}</div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-500">Inserat</dt>
              <dd className="font-medium text-ink-900">{formatEuro(p.inserat)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-500">Richtpreis</dt>
              <dd className="font-semibold text-brand-800">{formatEuro(p.richtpreis)}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-ink-500">Marktwert</dt>
              <dd className="font-medium text-emerald-700">{formatEuro(p.marktwert)}</dd>
            </div>
          </dl>
          <p className="text-xs text-ink-600">
            Zum Inseratspreis noch{" "}
            <strong className="text-emerald-700 tabular-nums">
              {formatEuro(p.luftEur)} ({p.luftProzent} %)
            </strong>{" "}
            unter Marktwert
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {e.inserat_url && (
            <a
              href={e.inserat_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-b from-brand-600 to-brand-700 px-3 text-sm font-medium text-white shadow-sm hover:from-brand-700 hover:to-brand-800"
            >
              Inserat öffnen ↗
            </a>
          )}
          <LinkButton href={`/leads/${e.id}`} variant="secondary" size="sm" className="h-9">
            Lead öffnen
          </LinkButton>
        </div>
      </CardBody>
    </Card>
  );
}
