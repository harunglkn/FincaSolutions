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

export type MessageDeliveryStatus =
  | "received"
  | "sent"
  | "pending"
  | "failed";

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

  // Unread-Markierung (gesetzt durch DB-Trigger bei neuer Verkaeufer-Antwort)
  has_unread_seller_message: boolean;
  last_seller_message_at: string | null;

  // mobile.de Konversations-ID (gelernt beim ersten Antwort-Sync)
  conversation_id: string | null;

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
  delivery_status: MessageDeliveryStatus | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  dedup_key: string | null;
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

// Lead ist "guenstigster Markt", wenn sein Inseratspreis <= dem
// guenstigsten Vergleichspreis ist, den der Bot in der Marktanalyse
// gefunden hat. Wenn ja, ist es ein besonders attraktives Inserat
// (= Schnapper-Potenzial).
export function isCheapestInMarket(lead: Lead): boolean {
  const inserat = Number(lead.angebot_preis);
  const lowest = Number(
    lead.bot_meta?.comparison_meta?.lowest_market_price,
  );
  if (!Number.isFinite(inserat) || inserat <= 0) return false;
  if (!Number.isFinite(lowest) || lowest <= 0) return false;
  return inserat <= lowest;
}

// ============== Termine (v8) ==============

export type AppointmentStatus =
  | "booked"
  | "confirmed"
  | "completed"
  | "missed"
  | "cancelled"
  | "rescheduled"
  | "bought"
  | "lost";

export type Appointment = {
  id: string;
  dealer_id: string;
  lead_id: string;
  seller_name: string | null;
  seller_phone: string | null;
  seller_email: string | null;
  vehicle_title: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  vehicle_mileage: number | null;
  listing_price: number | null;
  offer_price: number | null;
  appointment_date: string; // "YYYY-MM-DD"
  appointment_time: string; // "HH:MM:SS"
  appointment_datetime: string; // ISO timestamptz
  duration_minutes: number;
  status: AppointmentStatus;
  note: string | null;
  source: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DealerAvailability = {
  id: string;
  dealer_id: string;
  weekday: number; // 1=Mo .. 7=So
  start_time: string; // "HH:MM:SS"
  end_time: string;
  slot_minutes: number;
  buffer_minutes: number;
  max_appointments_per_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadActivity = {
  id: string;
  dealer_id: string;
  lead_id: string;
  appointment_id: string | null;
  type: string;
  message: string;
  created_by: string | null;
  created_at: string;
};

// Sichere, oeffentliche Lead-Ansicht (Rueckgabe von get_lead_for_booking)
export type BookingLead = {
  id: string;
  fahrzeug: string;
  baujahr: number | null;
  kilometerstand: number | null;
  getriebe: string | null;
  kraftstoff: string | null;
  erstzulassung: string | null;
  angebot_preis: number | null;
  dealer_firma: string | null;
};

export const APPOINTMENT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  booked: "Gebucht",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  missed: "Verpasst",
  cancelled: "Abgesagt",
  rescheduled: "Verschoben",
  bought: "Gekauft",
  lost: "Verloren",
};

export const APPOINTMENT_STATUS_TONE: Record<
  AppointmentStatus,
  "neutral" | "brand" | "success" | "warning" | "danger"
> = {
  booked: "brand",
  confirmed: "brand",
  completed: "success",
  missed: "warning",
  cancelled: "neutral",
  rescheduled: "warning",
  bought: "success",
  lost: "danger",
};

// Termine, die einen Slot aktiv blockieren (Doppelbuchungs-Logik).
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "booked",
  "confirmed",
  "completed",
];

export const WEEKDAY_LABEL: Record<number, string> = {
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
  7: "Sonntag",
};

export const WEEKDAY_SHORT: Record<number, string> = {
  1: "Mo",
  2: "Di",
  3: "Mi",
  4: "Do",
  5: "Fr",
  6: "Sa",
  7: "So",
};
