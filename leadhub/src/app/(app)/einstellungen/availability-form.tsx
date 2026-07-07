"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { WEEKDAY_LABEL, type DealerAvailability } from "@/lib/database.types";
import { saveAvailability } from "./availability-actions";

type DayState = { is_active: boolean; start: string; end: string };

function defaultDay(weekday: number): DayState {
  if (weekday >= 1 && weekday <= 5)
    return { is_active: true, start: "09:00", end: "18:00" };
  if (weekday === 6) return { is_active: true, start: "09:00", end: "13:00" };
  return { is_active: false, start: "09:00", end: "13:00" };
}

export function AvailabilityForm({ rows }: { rows: DealerAvailability[] }) {
  const byWeekday = new Map(rows.map((r) => [r.weekday, r]));

  const [days, setDays] = useState<DayState[]>(() =>
    Array.from({ length: 7 }, (_, i) => {
      const wd = i + 1;
      const r = byWeekday.get(wd);
      if (!r) return defaultDay(wd);
      return {
        is_active: r.is_active,
        start: r.start_time.slice(0, 5),
        end: r.end_time.slice(0, 5),
      };
    }),
  );

  const firstRow = rows[0];
  const [buffer, setBuffer] = useState(String(firstRow?.buffer_minutes ?? 0));
  const [maxPerDay, setMaxPerDay] = useState(
    firstRow?.max_appointments_per_day != null
      ? String(firstRow.max_appointments_per_day)
      : "",
  );

  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function update(i: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await saveAvailability({
        days: days.map((d, i) => ({
          weekday: i + 1,
          is_active: d.is_active,
          start_time: d.start,
          end_time: d.end,
        })),
        buffer_minutes: parseInt(buffer || "0", 10) || 0,
        max_appointments_per_day: maxPerDay.trim()
          ? parseInt(maxPerDay, 10) || null
          : null,
      });
      setMsg(
        res.ok
          ? { ok: true, text: "Verfügbarkeit gespeichert." }
          : { ok: false, text: res.error ?? "Speichern fehlgeschlagen." },
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-ink-100">
        {days.map((d, i) => {
          const wd = i + 1;
          return (
            <div
              key={wd}
              className="flex items-center gap-3 py-2.5 flex-wrap"
            >
              <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.is_active}
                  onChange={(e) => update(i, { is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600"
                />
                <span
                  className={`text-sm font-medium ${
                    d.is_active ? "text-ink-900" : "text-ink-400"
                  }`}
                >
                  {WEEKDAY_LABEL[wd]}
                </span>
              </label>

              {d.is_active ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={d.start}
                    step={3600}
                    onChange={(e) => update(i, { start: e.target.value })}
                    className="h-9 px-2 rounded-lg border border-ink-200 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
                  />
                  <span className="text-ink-400">bis</span>
                  <input
                    type="time"
                    value={d.end}
                    step={3600}
                    onChange={(e) => update(i, { end: e.target.value })}
                    className="h-9 px-2 rounded-lg border border-ink-200 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
                  />
                </div>
              ) : (
                <span className="text-sm text-ink-400">geschlossen</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-ink-100">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Pufferzeit zwischen Terminen (Min.)
          </label>
          <input
            type="number"
            min={0}
            step={5}
            value={buffer}
            onChange={(e) => setBuffer(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-ink-200 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Max. Termine pro Tag (leer = unbegrenzt)
          </label>
          <input
            type="number"
            min={1}
            value={maxPerDay}
            onChange={(e) => setMaxPerDay(e.target.value)}
            placeholder="unbegrenzt"
            className="w-full h-10 px-3 rounded-lg border border-ink-200 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
          />
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Termine sind immer 60 Minuten lang. Die Zeitzone ist Europe/Berlin.
      </p>

      {msg && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            msg.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      <Button onClick={submit} disabled={pending}>
        {pending ? "Speichere …" : "Verfügbarkeit speichern"}
      </Button>
    </div>
  );
}
