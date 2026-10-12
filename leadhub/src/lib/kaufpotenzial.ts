// Kaufpotenzial eines Bot-Leads fuer die Anrufliste.
//
// Grundlage sind die Werte, die der Bot beim Anschreiben mitschickt:
// Inseratspreis (angebot_preis), Richtpreis (ankaufspreis) und der vorsichtige
// Marktwert aus der Vergleichssuche (bot_meta.comparison_meta.market_anchor_price,
// rund das 40. Perzentil der Vergleichsautos).
//
// Ein Anruf lohnt sich, wenn der Verkaeufer UNTER dem Marktwert inseriert hat
// (man koennte sogar zum Inseratspreis noch mit Luft kaufen) und der Richtpreis
// nah genug an seinem Preis liegt, um sich zu einigen.

export type Potenzialstufe = "top" | "solide" | "pruefen";

export type Potenzial = {
  stufe: Potenzialstufe;
  inserat: number;
  richtpreis: number;
  marktwert: number;
  /** Marktwert minus Inseratspreis in Euro. */
  luftEur: number;
  /** Luft in Prozent vom Marktwert (0-100). */
  luftProzent: number;
};

export const POTENZIAL_STUFE_LABEL: Record<Potenzialstufe, string> = {
  top: "Top",
  solide: "Solide",
  pruefen: "Auffällig günstig",
};

// Weniger Vergleichsautos -> Marktwert zu unsicher fuer eine Kaufempfehlung.
const MIN_VERGLEICHE = 5;
// Richtpreis hoechstens so weit unter dem Inseratspreis -> Einigung realistisch.
const MAX_ABSTAND_RICHTPREIS = 0.15;
// Mehr als so weit unter Marktwert ist ungewoehnlich (Schaden, Export, Fake?).
const AUFFAELLIG_AB = 0.35;
const TOP_AB = 0.1;
const SOLIDE_AB = 0.05;
const PREIS_MIN = 1500;
const PREIS_MAX = 60000;

function zahl(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function bewertePotenzial(eingabe: {
  fahrzeug: string;
  inserat: unknown;
  richtpreis: unknown;
  marktwert: unknown;
  confidence: unknown;
  vergleiche: unknown;
}): Potenzial | null {
  const inserat = zahl(eingabe.inserat);
  const richtpreis = zahl(eingabe.richtpreis);
  const marktwert = zahl(eingabe.marktwert);
  if (!inserat || !richtpreis || !marktwert) return null;
  if (inserat < PREIS_MIN || inserat > PREIS_MAX) return null;

  // Modell unklar -> der Vergleich hat womoeglich andere Autos verglichen.
  if (/\b(Andere|UNBEKANNT)\b/i.test(eingabe.fahrzeug)) return null;
  if (eingabe.confidence !== "MEDIUM" && eingabe.confidence !== "HIGH") return null;
  const vergleiche = Array.isArray(eingabe.vergleiche) ? eingabe.vergleiche.length : 0;
  if (vergleiche < MIN_VERGLEICHE) return null;

  if ((inserat - richtpreis) / inserat > MAX_ABSTAND_RICHTPREIS) return null;

  const luft = (marktwert - inserat) / marktwert;
  let stufe: Potenzialstufe;
  if (luft > AUFFAELLIG_AB) stufe = "pruefen";
  else if (luft >= TOP_AB) stufe = "top";
  else if (luft >= SOLIDE_AB) stufe = "solide";
  else return null;

  return {
    stufe,
    inserat,
    richtpreis,
    marktwert: Math.round(marktwert / 100) * 100,
    luftEur: Math.round((marktwert - inserat) / 100) * 100,
    luftProzent: Math.round(luft * 100),
  };
}
