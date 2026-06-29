"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  type LeadStatus,
} from "@/lib/database.types";

type Props = {
  resultCount: number;
};

const SHORT_BY_STATUS: Record<LeadStatus, string> = {
  antwort_offen: "Offen",
  termin_vereinbart: "Termin",
  hohes_potenzial: "Potenzial",
  abgelehnt: "Abgelehnt",
  abgeschlossen: "Abgeschlossen",
};

export function LeadsFilterBar({ resultCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Lokaler Zustand fuer die Eingabefelder (debounced gegen Server-Updates)
  const [q, setQ] = useState(params.get("q") ?? "");
  const [jahrVon, setJahrVon] = useState(params.get("jahr_von") ?? "");
  const [jahrBis, setJahrBis] = useState(params.get("jahr_bis") ?? "");
  const [kmMax, setKmMax] = useState(params.get("km_max") ?? "");
  const [preisMax, setPreisMax] = useState(params.get("preis_max") ?? "");
  const [showAdvanced, setShowAdvanced] = useState(
    !!(params.get("jahr_von") || params.get("jahr_bis") || params.get("km_max") || params.get("preis_max")),
  );

  const currentStatus = params.get("status") ?? "all";

  // Sync bei Browser-Navigation (zurueck/vor)
  useEffect(() => {
    setQ(params.get("q") ?? "");
    setJahrVon(params.get("jahr_von") ?? "");
    setJahrBis(params.get("jahr_bis") ?? "");
    setKmMax(params.get("km_max") ?? "");
    setPreisMax(params.get("preis_max") ?? "");
  }, [params]);

  function pushParams(next: URLSearchParams) {
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    pushParams(next);
  }

  function clearAll() {
    setQ("");
    setJahrVon("");
    setJahrBis("");
    setKmMax("");
    setPreisMax("");
    pushParams(new URLSearchParams());
  }

  // Debounce fuer Suchfeld (300ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      if (q !== (params.get("q") ?? "")) {
        setParam("q", q);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Debounce fuer Range-Felder (500ms)
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params);
      const apply = (key: string, val: string) => {
        if (val) next.set(key, val);
        else next.delete(key);
      };
      apply("jahr_von", jahrVon);
      apply("jahr_bis", jahrBis);
      apply("km_max", kmMax);
      apply("preis_max", preisMax);
      if (next.toString() !== params.toString()) {
        pushParams(next);
      }
    }, 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jahrVon, jahrBis, kmMax, preisMax]);

  const hasAnyFilter =
    !!q || !!jahrVon || !!jahrBis || !!kmMax || !!preisMax || currentStatus !== "all";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[260px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="m20 20-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Suchen nach Marke, Modell, Verkäufer, Ort …"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-ink-200 bg-white text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={[
            "h-10 px-3 rounded-lg text-sm font-medium border transition-colors inline-flex items-center gap-1.5",
            showAdvanced
              ? "bg-brand-50 border-brand-200 text-brand-800"
              : "bg-white border-ink-200 text-ink-700 hover:bg-ink-50",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M3 6h18M6 12h12M10 18h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Filter
          {hasAnyFilter && (
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-600" />
          )}
        </button>

        {hasAnyFilter && (
          <button
            type="button"
            onClick={clearAll}
            className="h-10 px-3 rounded-lg text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-100"
          >
            Filter zurücksetzen
          </button>
        )}

        <div className={`text-xs text-ink-500 ml-auto ${pending ? "animate-pulse" : ""}`}>
          {resultCount} {resultCount === 1 ? "Treffer" : "Treffer"}
        </div>
      </div>

      {/* Status-Chips */}
      <div className="flex flex-wrap gap-2">
        <Chip
          active={currentStatus === "all"}
          onClick={() => setParam("status", "all")}
        >
          Alle
        </Chip>
        {LEAD_STATUSES.map((s) => (
          <Chip
            key={s}
            active={currentStatus === s}
            onClick={() => setParam("status", s)}
          >
            {SHORT_BY_STATUS[s] ?? LEAD_STATUS_LABEL[s]}
          </Chip>
        ))}
      </div>

      {showAdvanced && (
        <div className="bg-ink-50 border border-ink-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <NumberField label="Baujahr ab" value={jahrVon} onChange={setJahrVon} placeholder="2018" />
          <NumberField label="Baujahr bis" value={jahrBis} onChange={setJahrBis} placeholder="2024" />
          <NumberField label="Max. KM" value={kmMax} onChange={setKmMax} placeholder="100000" />
          <NumberField label="Max. Preis (€)" value={preisMax} onChange={setPreisMax} placeholder="20000" />
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
        active
          ? "bg-brand-700 border-brand-700 text-white"
          : "bg-white border-ink-200 text-ink-700 hover:bg-ink-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-600">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 px-2.5 rounded-lg border border-ink-200 bg-white text-sm focus:border-brand-500 focus:outline-none"
      />
    </label>
  );
}
