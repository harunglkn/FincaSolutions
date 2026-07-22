"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SearchProfile } from "@/lib/database.types";
import {
  createSearchProfile,
  setSearchProfileActive,
  deleteSearchProfile,
} from "./actions";

function fmt(iso: string | null): string {
  if (!iso) return "noch nie";
  const d = new Date(iso);
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `vor ${h} Std.`;
  return d.toLocaleDateString("de-DE");
}

export function SuchlaufManager({ profiles }: { profiles: SearchProfile[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await createSearchProfile({ name, url });
      if (res.ok) {
        setName("");
        setUrl("");
        router.refresh();
      } else setError(res.error ?? "Fehler.");
    });
  }

  function toggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await setSearchProfileActive({ id, active });
      if (res.ok) router.refresh();
      else setError(res.error ?? "Fehler.");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteSearchProfile(id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Fehler.");
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Liste vorhandener Suchläufe */}
      {profiles.length > 0 && (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                p.is_active
                  ? "border-green-300 bg-green-50/50"
                  : "border-ink-200 bg-white"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900 truncate">
                    {p.name}
                  </span>
                  {p.is_active ? (
                    <Badge tone="success">läuft</Badge>
                  ) : (
                    <Badge tone="neutral">pausiert</Badge>
                  )}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">
                  Zuletzt gelaufen: {fmt(p.last_run_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.is_active ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => toggle(p.id, false)}
                  >
                    Pausieren
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => toggle(p.id, true)}
                  >
                    Starten
                  </Button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(p.id)}
                  title="Löschen"
                  className="h-8 w-8 grid place-items-center rounded-lg border border-ink-200 text-ink-400 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                    <path
                      d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Neuen Suchlauf anlegen */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-ink-900">Neuen Suchlauf anlegen</h3>
          <p className="text-sm text-ink-500 mt-0.5">
            Stellen Sie auf mobile.de Ihre Wunsch-Suche ein (Marke, Preis,
            Umkreis …), kopieren Sie die Adresse aus der Adresszeile des
            Browsers und fügen Sie sie hier ein.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Kombis Diesel bis 120.000 km"
            className="w-full h-10 px-3 rounded-lg border border-ink-200 text-sm focus:outline focus:outline-2 focus:outline-brand-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            mobile.de-Suchadresse
          </label>
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            rows={2}
            placeholder="https://suchen.mobile.de/fahrzeuge/search.html?…"
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm resize-y focus:outline focus:outline-2 focus:outline-brand-600"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button onClick={add} disabled={pending || !name.trim() || !url.trim()}>
          {pending ? "Speichere …" : "Suchlauf speichern"}
        </Button>
      </div>
    </div>
  );
}
