"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatEuro } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABEL,
  APPOINTMENT_STATUS_TONE,
  type Appointment,
} from "@/lib/database.types";
import {
  cancelAppointmentAction,
  completeAppointmentAction,
} from "./actions";

function fmtDateTime(iso: string): string {
  return (
    new Date(iso).toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) + " Uhr"
  );
}

function waPhone(phone: string | null): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^\d+]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  else if (p.startsWith("00")) p = p.slice(2);
  else if (p.startsWith("0")) p = "49" + p.slice(1);
  return p || null;
}

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = appointment;
  const wa = waPhone(a.seller_phone);
  const isActive = a.status === "booked" || a.status === "confirmed";

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(res.error ?? "Aktion fehlgeschlagen.");
  }

  return (
    <div className="bg-white border border-ink-200 rounded-xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ink-900">
            {fmtDateTime(a.appointment_datetime)}
          </div>
          <div className="text-sm text-ink-700 mt-0.5">
            {a.vehicle_title ?? "—"}
          </div>
        </div>
        <Badge tone={APPOINTMENT_STATUS_TONE[a.status]}>
          {APPOINTMENT_STATUS_LABEL[a.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <Item label="Verkäufer" value={a.seller_name ?? "—"} />
        <Item label="Telefon" value={a.seller_phone ?? "—"} />
        {a.seller_email && <Item label="E-Mail" value={a.seller_email} />}
        {a.offer_price != null && (
          <Item label="Richtpreis" value={formatEuro(a.offer_price)} />
        )}
      </div>

      {a.note && (
        <p className="text-sm text-ink-500 italic">„{a.note}“</p>
      )}

      {/* Kontakt-/Navigations-Buttons */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/leads/${a.lead_id}`}
          className="h-8 px-3 inline-flex items-center rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-ink-100"
        >
          Lead öffnen
        </Link>
        {a.seller_phone && (
          <a
            href={`tel:${a.seller_phone}`}
            className="h-8 px-3 inline-flex items-center rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-ink-100"
          >
            Anrufen
          </a>
        )}
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 inline-flex items-center rounded-lg border border-green-200 text-xs font-medium text-green-700 hover:bg-green-50"
          >
            WhatsApp
          </a>
        )}
      </div>

      {/* Status-Aktionen nur bei aktiven Terminen */}
      {isActive && (
        <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-3">
          <ActionBtn onClick={() => run(() => completeAppointmentAction({ appointmentId: a.id, outcome: "bought", leadId: a.lead_id }))} disabled={busy} tone="success">
            Gekauft
          </ActionBtn>
          <ActionBtn onClick={() => run(() => completeAppointmentAction({ appointmentId: a.id, outcome: "completed", leadId: a.lead_id }))} disabled={busy}>
            Erledigt
          </ActionBtn>
          <ActionBtn onClick={() => run(() => completeAppointmentAction({ appointmentId: a.id, outcome: "lost", leadId: a.lead_id }))} disabled={busy} tone="danger">
            Abgelehnt
          </ActionBtn>
          <ActionBtn onClick={() => run(() => completeAppointmentAction({ appointmentId: a.id, outcome: "missed", leadId: a.lead_id }))} disabled={busy}>
            Verpasst
          </ActionBtn>
          <Link
            href={`/leads/${a.lead_id}`}
            className="h-8 px-3 inline-flex items-center rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-ink-100"
          >
            Verschieben
          </Link>
          <ActionBtn onClick={() => run(() => cancelAppointmentAction({ appointmentId: a.id, leadId: a.lead_id }))} disabled={busy} tone="danger">
            Absagen
          </ActionBtn>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-ink-500 text-xs">{label}</span>
      <span className="text-ink-900 font-medium">{value}</span>
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
