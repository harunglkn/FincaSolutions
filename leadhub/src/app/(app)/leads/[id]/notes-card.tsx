"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveLeadNotes } from "../actions";

export function NotesCard({
  leadId,
  initialNotes,
}: {
  leadId: string;
  initialNotes: string | null;
}) {
  const [value, setValue] = useState(initialNotes ?? "");
  const [savedValue, setSavedValue] = useState(initialNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const dirty = value.trim() !== savedValue.trim();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await saveLeadNotes(leadId, value);
      if (res.ok) {
        setSavedValue(value);
      } else {
        setError(res.error ?? "Speichern fehlgeschlagen.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        placeholder="z. B. Verkäufer ruft Montag zurück, zweiter Schlüssel fehlt …"
        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 resize-y focus:border-brand-500 focus:outline-none"
      />
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending || !dirty}>
          {pending ? "Speichere …" : "Notiz speichern"}
        </Button>
        {!dirty && savedValue.trim() && (
          <span className="text-xs text-green-700">✓ Gespeichert</span>
        )}
      </div>
    </div>
  );
}
