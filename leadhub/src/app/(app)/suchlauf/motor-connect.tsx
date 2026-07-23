"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/database.types";
import { createPairingCode, revokeAgent } from "./actions";

const AGENT_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

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

export function MotorConnect({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = agents.filter((a) => !a.revoked);

  function generate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const res = await createPairingCode();
      if (res.ok && res.code) {
        setCode(res.code);
        router.refresh();
      } else setError(res.error ?? "Fehler.");
    });
  }

  function disconnect(id: string) {
    startTransition(async () => {
      const res = await revokeAgent(id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Fehler.");
    });
  }

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* Zwischenablage nicht verfügbar — Code steht ja sichtbar da */
    }
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 space-y-4 max-w-3xl">
      <div>
        <h3 className="font-semibold text-ink-900">Motor verbinden</h3>
        <p className="text-sm text-ink-500 mt-0.5">
          Verbinden Sie das Finca-Programm auf Ihrem PC mit diesem Konto. Der
          Motor bearbeitet dann ausschließlich Ihre Suchläufe.
        </p>
      </div>

      {/* Verbundene Motoren */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((a) => {
            const online =
              !!a.last_seen_at &&
              Date.now() - new Date(a.last_seen_at).getTime() <
                AGENT_ACTIVE_WINDOW_MS;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-ink-200 px-4 py-3"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                    online ? "bg-green-500" : "bg-ink-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900 truncate">
                      {a.label || "Suchlauf-Motor"}
                    </span>
                    <Badge tone={online ? "success" : "neutral"}>
                      {online ? "verbunden" : "offline"}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Zuletzt gesehen: {fmt(a.last_seen_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => disconnect(a.id)}
                >
                  Trennen
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Kopplungs-Code */}
      {code ? (
        <div className="rounded-xl border-2 border-brand-300 bg-brand-50 p-5 space-y-3">
          <p className="text-sm font-medium text-brand-900">
            Ihr Kopplungs-Code (15 Minuten gültig):
          </p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold tracking-widest text-brand-900 select-all">
              {code}
            </span>
            <Button size="sm" variant="secondary" onClick={copyCode}>
              {copied ? "Kopiert ✓" : "Kopieren"}
            </Button>
          </div>
          <ol className="text-sm text-brand-900/90 list-decimal list-inside space-y-1">
            <li>Finca-Programm auf dem PC starten.</li>
            <li>
              Bei der Frage nach dem Kopplungs-Code diesen Code eingeben.
            </li>
            <li>Fertig — der Motor ist dann dauerhaft mit Ihrem Konto verbunden.</li>
          </ol>
          <p className="text-xs text-brand-800/70">
            Der Code kann nur einmal verwendet werden. Danach brauchen Sie ihn
            nicht mehr.
          </p>
        </div>
      ) : (
        <Button onClick={generate} disabled={pending}>
          {pending ? "Erzeuge Code …" : "Kopplungs-Code erzeugen"}
        </Button>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
