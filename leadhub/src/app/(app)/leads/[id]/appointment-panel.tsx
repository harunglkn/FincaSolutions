"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  type Appointment,
} from "@/lib/database.types";
import {
  createManualAppointment,
  rescheduleAppointmentAction,
  cancelAppointmentAction,
  completeAppointmentAction,
} from "../../termine/actions";

const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function fmtDateTime(iso: string): string {
  return (
    new Date(iso).toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " Uhr"
  );
}

export function AppointmentPanel({
  leadId,
  bookingUrl,
  sellerName,
  appointment,
}: {
  leadId: string;
  bookingUrl: string;
  sellerName: string | null;
  appointment: Appointment | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const [mode, setMode] = useState<"none" | "create" | "reschedule">("none");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareText = useMemo(
    () =>
      `Gerne, dann lassen Sie uns den Ankauf kurz abstimmen.\n\n` +
      `Sie können hier direkt einen passenden Termin auswählen:\n\n` +
      `${bookingUrl}\n\n` +
      `Nach der Buchung sehen wir den Termin direkt im System und können den Ankauf verbindlich mit Ihnen besprechen.\n\n` +
      `Viele Grüße`,
    [bookingUrl],
  );

  async function copy(kind: "link" | "text") {
    try {
      await navigator.clipboard.writeText(kind === "link" ? bookingUrl : shareText);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Kopieren nicht möglich — bitte manuell markieren.");
    }
  }

  async function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      setMode("none");
      router.refresh();
    } else {
      setError(res.error ?? "Aktion fehlgeschlagen.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Terminlink teilen */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => copy("link")}>
          {copied === "link" ? "✓ Kopiert" : "Terminlink kopieren"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => copy("text")}>
          {copied === "text" ? "✓ Kopiert" : "Termintext kopieren"}
        </Button>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs font-medium text-brand-700 hover:underline px-2"
        >
          Vorschau ↗
        </a>
      </div>

      {/* Aktueller Termin */}
      {appointment ? (
        <div className="rounded-lg border border-ink-200 bg-ink-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="font-semibold text-ink-900">
              {fmtDateTime(appointment.appointment_datetime)}
            </div>
            <Badge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
              {APPOINTMENT_STATUS_LABEL[appointment.status]}
            </Badge>
          </div>
          <div className="text-sm text-ink-600 space-y-0.5">
            {appointment.seller_name && <div>{appointment.seller_name}</div>}
            {appointment.seller_phone && (
              <a
                href={`tel:${appointment.seller_phone}`}
                className="text-brand-700 hover:underline"
              >
                {appointment.seller_phone}
              </a>
            )}
            {appointment.note && (
              <div className="text-ink-500 italic">„{appointment.note}"</div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <ActionBtn
              onClick={() => setMode(mode === "reschedule" ? "none" : "reschedule")}
              disabled={busy}
            >
              Verschieben
            </ActionBtn>
            <ActionBtn
              onClick={() =>
                runAction(() =>
                  completeAppointmentAction({
                    appointmentId: appointment.id,
                    outcome: "bought",
                    leadId,
                  }),
                )
              }
              disabled={busy}
              tone="success"
            >
              Gekauft
            </ActionBtn>
            <ActionBtn
              onClick={() =>
                runAction(() =>
                  completeAppointmentAction({
                    appointmentId: appointment.id,
                    outcome: "lost",
                    leadId,
                  }),
                )
              }
              disabled={busy}
              tone="danger"
            >
              Verloren
            </ActionBtn>
            <ActionBtn
              onClick={() =>
                runAction(() =>
                  completeAppointmentAction({
                    appointmentId: appointment.id,
                    outcome: "completed",
                    leadId,
                  }),
                )
              }
              disabled={busy}
            >
              Abgeschlossen
            </ActionBtn>
            <ActionBtn
              onClick={() =>
                runAction(() =>
                  completeAppointmentAction({
                    appointmentId: appointment.id,
                    outcome: "missed",
                    leadId,
                  }),
                )
              }
              disabled={busy}
            >
              Verpasst
            </ActionBtn>
            <ActionBtn
              onClick={() =>
                runAction(() =>
                  cancelAppointmentAction({ appointmentId: appointment.id, leadId }),
                )
              }
              disabled={busy}
              tone="danger"
            >
              Absagen
            </ActionBtn>
          </div>

          {mode === "reschedule" && (
            <SlotPicker
              leadId={leadId}
              busy={busy}
              submitLabel="Auf neuen Termin verschieben"
              onSubmit={(date, time) =>
                runAction(() =>
                  rescheduleAppointmentAction({
                    appointmentId: appointment.id,
                    date,
                    time,
                    leadId,
                  }),
                )
              }
            />
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50/50 p-4 text-center">
          <p className="text-sm text-ink-600">
            Für diesen Lead wurde noch kein Termin gebucht.
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setMode(mode === "create" ? "none" : "create")}
              disabled={busy}
            >
              {mode === "create" ? "Abbrechen" : "Termin manuell erstellen"}
            </Button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <ManualCreateForm
          leadId={leadId}
          defaultName={sellerName}
          busy={busy}
          onSubmit={(input) =>
            runAction(() => createManualAppointment({ leadId, ...input }))
          }
        />
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-ink-200 text-ink-700 hover:bg-ink-100",
    success: "border-green-200 text-green-700 hover:bg-green-50",
    danger: "border-red-200 text-red-700 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-3 rounded-lg border text-xs font-medium transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function ManualCreateForm({
  leadId,
  defaultName,
  busy,
  onSubmit,
}: {
  leadId: string;
  defaultName: string | null;
  busy: boolean;
  onSubmit: (input: {
    sellerName: string;
    sellerPhone: string;
    sellerEmail?: string | null;
    date: string;
    time: string;
    note?: string | null;
  }) => void;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4 space-y-3">
      <p className="text-sm font-semibold text-ink-900">Termin manuell erstellen</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Verkäufername"
        className="w-full h-10 rounded-lg border border-ink-200 px-3 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Telefonnummer"
        className="w-full h-10 rounded-lg border border-ink-200 px-3 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Notiz (optional)"
        className="w-full h-10 rounded-lg border border-ink-200 px-3 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
      />
      <SlotPicker
        leadId={leadId}
        busy={busy}
        submitLabel="Termin erstellen"
        onSubmit={(date, time) =>
          onSubmit({
            sellerName: name,
            sellerPhone: phone,
            note: note || null,
            date,
            time,
          })
        }
      />
    </div>
  );
}

function SlotPicker({
  leadId,
  busy,
  submitLabel,
  onSubmit,
}: {
  leadId: string;
  busy: boolean;
  submitLabel: string;
  onSubmit: (date: string, time: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 21 }, (_, i) => {
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
  }, []);

  const [day, setDay] = useState(days[0].iso);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      setTime(null);
      const { data } = await supabase.rpc("get_available_slots", {
        p_lead_id: leadId,
        p_date: d,
      });
      setSlots(((data as string[] | null) ?? []).map(String));
      setLoading(false);
    },
    [supabase, leadId],
  );

  useEffect(() => {
    load(day);
  }, [day, load]);

  return (
    <div className="space-y-3 pt-1">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {days.map((d) => {
          const active = d.iso === day;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => setDay(d.iso)}
              className={`shrink-0 w-14 rounded-lg border px-1 py-1.5 text-center text-xs transition-colors ${
                active
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
              }`}
            >
              <span className="block font-medium">
                {d.isToday ? "Heute" : d.weekday}
              </span>
              <span className="block text-base font-semibold leading-tight">
                {d.day}
              </span>
              <span className="block text-[10px] text-ink-400">{d.month}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-xs text-ink-500">Lade freie Zeiten …</div>
      ) : slots.length === 0 ? (
        <div className="text-xs text-ink-500">
          Für diesen Tag sind keine freien Termine verfügbar.
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
          {slots.map((t) => {
            const active = t === time;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`h-9 rounded-lg border text-sm font-medium transition-colors ${
                  active
                    ? "border-brand-600 bg-brand-700 text-white"
                    : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50"
                }`}
              >
                {t.slice(0, 5)}
              </button>
            );
          })}
        </div>
      )}

      <Button
        size="sm"
        onClick={() => time && onSubmit(day, time)}
        disabled={busy || !time}
      >
        {busy ? "Speichern …" : submitLabel}
      </Button>
    </div>
  );
}
