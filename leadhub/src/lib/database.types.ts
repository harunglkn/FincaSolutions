// Hand-gepflegte Datenbank-Typen. Spiegeln das Schema aus
// supabase/migrations/0001_init.sql wider.
// Wenn das Schema sich aendert, hier nachziehen.

export type LeadStatus =
  | "antwort_offen"
  | "termin_vereinbart"
  | "hohes_potenzial"
  | "abgelehnt"
  | "abgeschlossen";

export type MessageSender = "verkaeufer" | "haendler";

export type Profile = {
  id: string;
  firma: string | null;
  vorname: string | null;
  nachname: string | null;
  telefon: string | null;
  adresse: string | null;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  beschreibung: string | null;
  aktiv: boolean;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  user_id: string;
  campaign_id: string | null;

  fahrzeug: string;
  baujahr: number | null;
  kilometerstand: number | null;
  getriebe: string | null;
  kraftstoff: string | null;
  erstzulassung: string | null;
  hu_bis: string | null;
  farbe: string | null;

  verkaeufer_name: string | null;
  ort: string | null;

  angebot_preis: number | null;
  marktwert: number | null;
  ankaufspreis: number | null;

  status: LeadStatus;
  quelle: string | null;

  // Bot-Felder (befuellt der Bot spaeter, manuelle Eingabe optional)
  external_id: string | null;
  inserat_url: string | null;
  bot_meta: BotMeta | null;

  created_at: string;
  updated_at: string;
};

export type BotMeta = {
  pricing_mode?: string | null;
  comparison_url?: string | null;
  comparison_prices_used?: number[] | null;
  comparison_meta?: {
    confidence?: string;
    anchor_strategy?: string;
    private_price_count?: number;
    dealer_price_count?: number;
    dealer_margin_deduction_pct?: number;
    market_anchor_price?: number;
    lowest_market_price?: number;
    removed_prices?: number[];
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type LeadMessage = {
  id: string;
  lead_id: string;
  von: MessageSender;
  text: string;
  created_at: string;
};

// ============== UI-Helfer ==============

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  antwort_offen: "Antwort offen",
  termin_vereinbart: "Termin vereinbart",
  hohes_potenzial: "Einkaufspotenzial hoch",
  abgelehnt: "Abgelehnt",
  abgeschlossen: "Abgeschlossen",
};

export const LEAD_STATUS_TONE: Record<
  LeadStatus,
  "neutral" | "brand" | "success" | "warning" | "danger"
> = {
  antwort_offen: "warning",
  termin_vereinbart: "success",
  hohes_potenzial: "brand",
  abgelehnt: "danger",
  abgeschlossen: "success",
};

export const LEAD_STATUSES: LeadStatus[] = [
  "antwort_offen",
  "termin_vereinbart",
  "hohes_potenzial",
  "abgelehnt",
  "abgeschlossen",
];
