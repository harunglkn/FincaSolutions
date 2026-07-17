"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const ERROR_TEXT: Record<string, string> = {
  name_required: "Bitte geben Sie Ihren Namen ein.",
  phone_required: "Bitte geben Sie Ihre Telefonnummer ein.",
  past: "Dieser Zeitpunkt liegt in der Vergangenheit. Bitte wählen Sie einen anderen.",
  slot_unavailable:
    "Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.",
  slot_taken:
    "Dieser Termin wurde gerade vergeben. Bitte wählen Sie eine andere Uhrzeit.",
  lead_not_found: "Dieser Terminlink ist ungültig.",
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildDays(count: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      iso: toISODate(d),
      weekday: WEEKDAY_SHORT[d.getDay()],
      day: d.getDate(),
      month: MONTH_SHORT[d.getMonth()],
      isToday: i === 0,
    };
  });
}

export function BookingForm({ leadId }: { leadId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const days = useMemo(() => buildDays(21), []);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plate, setPlate] = useState("");
  const [note, setNote] = useState("");

  const [selectedDay, setSelectedDay] = useState(days[0].iso);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadSlots = useCallback(
    async (dayIso: string) => {
      setLoadingSlots(true);
      setSelectedTime(null);
      const { data, error: rpcError } = await supabase.rpc(
        "get_available_slots",
        { p_lead_id: leadId, p_date: dayIso },
      );
      if (rpcError) {
        setSlots([]);
      } else {
        setSlots(((data as string[] | null) ?? []).map((t) => String(t)));
      }
      setLoadingSlots(false);
    },
    [supabase, leadId],
  );

  useEffect(() => {
    loadSlots(selectedDay);
  }, [selectedDay, loadSlots]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError(ERROR_TEXT.name_required);
    if (!phone.trim()) return setError(ERROR_TEXT.phone_required);
    if (!selectedTime)
      return setError("Bitte wählen Sie eine verfügbare Uhrzeit.");

    setSubmitting(true);
    const { data, error: rpcError } = await supabase.rpc(
      "book_appointment_public",
      {
        p_lead_id: leadId,
        p_seller_name: name.trim(),
        p_seller_phone: phone.trim(),
        p_seller_email: email.trim() || null,
        p_date: selectedDay,
        p_time: selectedTime,
        p_note: note.trim() || null,
        p_vehicle_plate: plate.trim() || null,
      },
    );
    setSubmitting(false);

    if (rpcError) {
      setError("Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.");
      return;
    }

    const result = (data ?? {}) as { ok?: boolean; error?: string };
    if (result.ok) {
      setSuccess(true);
      return;
    }

    const code = result.error ?? "";
    setError(
      ERROR_TEXT[code] ??
        "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    );
    // Bei vergebenem Slot die Liste aktualisieren
    if (code === "slot_taken" || code === "slot_unavailable") {
      loadSlots(selectedDay);
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-green-100 text-green-700 mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
            <path
              d="m5 13 4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink-900">
          Vielen Dank — Ihr Termin wurde gebucht.
        </h2>
        <p className="mt-2 text-sm text-ink-600">
          Der Händler sieht den Termin nun im System und meldet sich bei Bedarf
          bei Ihnen. Sie können diese Seite jetzt schließen.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-ink-200 rounded-2xl shadow-sm p-5 space-y-5"
    >
      {/* Kontaktdaten */}
      <div className="space-y-3">
        <Input
          label="Ihr Name"
          value={name}
          onChange={setName}
          placeholder="Vor- und Nachname"
          required
        />
        <Input
          label="Telefonnummer"
          value={phone}
          onChange={setPhone}
          type="tel"
          placeholder="z. B. 0170 1234567"
          required
        />
        <Input
          label="E-Mail (optional)"
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="name@beispiel.de"
        />
        <Input
          label="Kennzeichen (optional)"
          value={plate}
          onChange={setPlate}
          placeholder="z. B. DA-AB 123"
        />
      </div>

      {/* Tag wählen */}
      <div>
        <p className="text-sm font-medium text-ink-800 mb-2">Tag wählen</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {days.map((d) => {
            const active = d.iso === selectedDay;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => setSelectedDay(d.iso)}
                className={[
                  "shrink-0 w-16 rounded-xl border px-2 py-2 text-center transition-colors",
                  active
                    ? "border-brand-600 bg-brand-50 text-brand-800"
                    : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                ].join(" ")}
              >
                <span className="block text-[11px] font-medium">
                  {d.isToday ? "Heute" : d.weekday}
                </span>
                <span className="block text-lg font-semibold leading-tight">
                  {d.day}
                </span>
                <span className="block text-[11px] text-ink-400">
                  {d.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Uhrzeit wählen */}
      <div>
        <p className="text-sm font-medium text-ink-800 mb-2">Uhrzeit wählen</p>
        {loadingSlots ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-ink-100 animate-pulse"
              />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-lg bg-ink-50 border border-ink-200 px-4 py-6 text-center text-sm text-ink-600">
            Für diesen Tag sind keine freien Termine verfügbar. Bitte wählen Sie
            einen anderen Tag.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((t) => {
              const active = t === selectedTime;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={[
                    "h-10 rounded-lg border text-sm font-medium transition-colors",
                    active
                      ? "border-brand-600 bg-brand-700 text-white"
                      : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
                  ].join(" ")}
                >
                  {t.slice(0, 5)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Notiz */}
      <div>
        <label className="block text-sm font-medium text-ink-800 mb-1">
          Nachricht (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="z. B. bin nur nachmittags erreichbar"
          className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline focus:outline-2 focus:outline-brand-600"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={submitting || !selectedTime}
      >
        {submitting ? "Wird gebucht …" : "Termin bestätigen"}
      </Button>
      <p className="text-center text-xs text-ink-400">
        Kostenlos & unverbindlich. Ihre Daten werden nur für die Terminabstimmung
        verwendet.
      </p>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-800 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full h-11 rounded-lg border border-ink-200 px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline focus:outline-2 focus:outline-brand-600"
      />
    </div>
  );
}
