// Laedt die Anrufliste: offene Bot-Leads der letzten Laeufe mit Kaufpotenzial.
// Genutzt von der Seite /anrufliste und vom Dashboard.

import type { createClient } from "@/lib/supabase/server";
import { bewertePotenzial, type Potenzial } from "@/lib/kaufpotenzial";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Ein "Lauf" ist ein Arbeitstag des Bots (alle Leads eines Kalendertags,
// auch wenn der Bot zwischendurch neu gestartet wurde). Gesucht wird in den
// letzten 14 Tagen; aeltere Inserate sind meist schon weg.
const SUCHTAGE = 14;

export const ANRUFLISTE_AUSWAHL = {
  "1": { label: "Letzter Lauf", laeufe: 1 },
  "2": { label: "Letzte 2 Läufe", laeufe: 2 },
  "7": { label: "Letzte 7 Tage", laeufe: 7 },
} as const;
export type AnruflisteAuswahl = keyof typeof ANRUFLISTE_AUSWAHL;

// Nur Leads, die noch niemand bearbeitet hat. Wer "Termin vereinbart",
// "Abgelehnt" oder "Abgeschlossen" setzt, nimmt den Lead damit von der Liste.
const OFFENE_STATUS = ["antwort_offen", "hohes_potenzial"];

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

export type AnruflisteEintrag = Zeile & { potenzial: Potenzial };

export type Anrufliste = {
  eintraege: AnruflisteEintrag[];
  /** Alle Lauf-Tage der letzten 14 Tage, neuester zuerst ("2026-10-12"). */
  laufTage: string[];
  /** Die gewaehlten Tage als "10.10., 12.10." */
  zeitraum: string;
  fehler: boolean;
};

/** Kalendertag in deutscher Zeit, z. B. "2026-10-12". */
export function berlinTag(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

/** "2026-10-12" -> "12.10." */
export function kurzDatum(tag: string): string {
  return `${tag.slice(8, 10)}.${tag.slice(5, 7)}.`;
}

export async function ladeAnrufliste(
  supabase: Supabase,
  auswahl: AnruflisteAuswahl,
  jetzt: number,
): Promise<Anrufliste> {
  const seit = new Date(jetzt - SUCHTAGE * 86_400_000).toISOString();

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
  const fehler = seiten.some((s) => s.error);

  // Laeufe = die Tage, an denen der Bot Leads mit Marktvergleich angelegt hat.
  const laufTage = [
    ...new Set(zeilen.filter((z) => z.anker != null).map((z) => berlinTag(z.created_at))),
  ].sort((a, b) => b.localeCompare(a));
  const gewaehlt =
    auswahl === "7"
      ? laufTage.filter((t) => t >= berlinTag(new Date(jetzt - 6 * 86_400_000).toISOString()))
      : laufTage.slice(0, ANRUFLISTE_AUSWAHL[auswahl].laeufe);
  const gewaehlteTage = new Set(gewaehlt);

  const eintraege: AnruflisteEintrag[] = [];
  for (const z of zeilen) {
    if (!gewaehlteTage.has(berlinTag(z.created_at))) continue;
    // Wer schon einen Termin hat, muss nicht mehr angerufen werden.
    if (z.next_appointment_at && new Date(z.next_appointment_at).getTime() >= jetzt) continue;
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

  // Reihenfolge: Top, Solide, Auffaellig guenstig; darin Verkaeufer mit
  // Antwort zuerst, dann nach Luft in Euro.
  const RANG = { top: 0, solide: 1, pruefen: 2 } as const;
  eintraege.sort(
    (a, b) =>
      RANG[a.potenzial.stufe] - RANG[b.potenzial.stufe] ||
      Number(!!b.last_seller_message_at) - Number(!!a.last_seller_message_at) ||
      b.potenzial.luftEur - a.potenzial.luftEur,
  );

  return {
    eintraege,
    laufTage,
    zeitraum: gewaehlt.length ? [...gewaehlt].sort().map(kurzDatum).join(", ") : "keine Läufe",
    fehler,
  };
}
