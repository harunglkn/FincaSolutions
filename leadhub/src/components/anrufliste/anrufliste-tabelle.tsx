import Link from "next/link";
import { formatEuro, formatKm } from "@/lib/format";
import { POTENZIAL_STUFE_LABEL, type Potenzialstufe } from "@/lib/kaufpotenzial";
import type { AnruflisteEintrag } from "@/lib/anrufliste";

const STUFE_FARBE: Record<Potenzialstufe, string> = {
  top: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  solide: "bg-brand-50 text-brand-800 ring-brand-200",
  pruefen: "bg-amber-50 text-amber-800 ring-amber-200",
};

// Tabelle der Anrufliste: Klick auf das Fahrzeug oeffnet das Inserat bei
// mobile.de, "Lead" den Vorgang im CRM.
export function AnruflisteTabelle({ eintraege }: { eintraege: AnruflisteEintrag[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
          <tr>
            <Th>Fahrzeug</Th>
            <Th>EZ / km</Th>
            <Th right>Inserat</Th>
            <Th right>Dein Angebot</Th>
            <Th right>Marktwert</Th>
            <Th right>Luft</Th>
            <Th />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {eintraege.map((e) => {
            const p = e.potenzial;
            const ez = e.erstzulassung || (e.baujahr ? String(e.baujahr) : "—");
            return (
              <tr key={e.id} className="hover:bg-ink-50/60 align-top">
                <td className="px-4 py-3 min-w-[220px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STUFE_FARBE[p.stufe]}`}
                    >
                      {POTENZIAL_STUFE_LABEL[p.stufe]}
                    </span>
                    {e.last_seller_message_at && (
                      <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Hat geantwortet
                      </span>
                    )}
                  </div>
                  {e.inserat_url ? (
                    <a
                      href={e.inserat_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-semibold text-brand-700 hover:underline"
                    >
                      {e.fahrzeug} ↗
                    </a>
                  ) : (
                    <div className="mt-1 font-semibold text-ink-900">{e.fahrzeug}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                  {ez} · {formatKm(e.kilometerstand)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-ink-900">
                  {formatEuro(p.inserat)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap font-semibold text-brand-800">
                  {formatEuro(p.richtpreis)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-ink-900">
                  {formatEuro(p.marktwert)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap font-semibold text-emerald-700">
                  {formatEuro(p.luftEur)}{" "}
                  <span className="font-normal text-emerald-600">({p.luftProzent} %)</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link
                    href={`/leads/${e.id}`}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    Lead →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-3 font-semibold whitespace-nowrap ${right ? "text-right" : ""}`}>
      {children}
    </th>
  );
}
