// Verkäufer-Antworten automatisch einordnen.
//
// Ziel: Der Posteingang soll nicht jede Antwort gleich laut melden. Klare
// Absagen ("kein Interesse", "schon verkauft") brauchen keine Bearbeitung —
// sie werden getrennt gesammelt und zählen nicht in die Zahl im Menü.
// Preis-Diskussionen sind dagegen die wertvollsten Antworten.

export type ReplyKind = "absage" | "verhandlung" | "interesse" | "offen";

export const REPLY_KIND_LABEL: Record<ReplyKind, string> = {
  absage: "Absage",
  verhandlung: "Preis-Gespräch",
  interesse: "Interesse",
  offen: "Antwort",
};

export const REPLY_KIND_TONE: Record<
  ReplyKind,
  "neutral" | "success" | "warning" | "brand"
> = {
  absage: "neutral",
  verhandlung: "warning",
  interesse: "success",
  offen: "brand",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

// Reihenfolge zählt: Interesse und Preis-Gespräch schlagen eine Absage,
// damit "zu wenig, aber ab 12.000 reden wir" nicht als Absage endet.
const INTERESSE = [
  "wann konnen sie",
  "wann konntest",
  "wann kommen",
  "besichtigung",
  "besichtigen",
  "probefahrt",
  "termin",
  "abholen",
  "vorbeikommen",
  "vorbei kommen",
  "einverstanden",
  "passt so",
  "deal",
  "wir werden uns einig",
  "konnen sie kommen",
];

const VERHANDLUNG = [
  "zu wenig",
  "zu niedrig",
  "zu gering",
  "mehr drin",
  "geht noch was",
  "letzter preis",
  "preisvorstellung",
  "vorstellung liegt",
  "hatte gerne",
  "hatte mir",
  "festpreis",
  "verhandelbar",
  "vhb",
  "bieten sie",
  "angebot erhohen",
  "wurde abgeben fur",
  "abgeben fur",
  "ab wieviel",
  "ab wie viel",
];

const ABSAGE = [
  "kein interesse",
  "keinerlei interesse",
  "nicht interessiert",
  "kein bedarf",
  "schon verkauft",
  "bereits verkauft",
  "ist verkauft",
  "wurde verkauft",
  "nicht mehr verfugbar",
  "nein danke",
  "nein, danke",
  "danke, nein",
  "keine handleranfragen",
  "keine handler",
  "kein handler",
  "nur privat",
  "privatverkauf",
  "bitte keine anfragen",
  "keine anfragen",
  "nicht verkaufen",
  "behalte das auto",
  "behalte ihn",
  "unserios",
  "lacherlich",
  "frechheit",
  "spam",
  "verarschen",
];

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

/** Ordnet eine Verkäufer-Antwort grob ein. Leerer Text => "offen". */
export function classifyReply(text: string | null | undefined): ReplyKind {
  if (!text || !text.trim()) return "offen";
  const t = normalize(text);

  if (hasAny(t, INTERESSE)) return "interesse";
  if (hasAny(t, VERHANDLUNG)) return "verhandlung";
  if (hasAny(t, ABSAGE)) return "absage";

  // Sehr kurze Antworten ohne Signal sind meist knappe Absagen ("nein", "nö").
  const compact = t.replace(/[^a-z]/g, "");
  if (["nein", "no", "ne", "nope", "nee", "danke"].includes(compact)) {
    return "absage";
  }

  return "offen";
}

/** Braucht diese Antwort eine Reaktion? (Absagen nicht.) */
export function needsAction(kind: ReplyKind): boolean {
  return kind !== "absage";
}
