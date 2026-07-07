import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";
import { formatEuro, formatKm } from "@/lib/format";
import type { BookingLead } from "@/lib/database.types";
import { BookingForm } from "./booking-form";

export const metadata: Metadata = {
  title: "Termin buchen · Finca Solutions",
  robots: { index: false, follow: false },
};

export default async function BookingPage(
  props: PageProps<"/booking/lead/[leadId]">,
) {
  const { leadId } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_lead_for_booking", {
    p_lead_id: leadId,
  });
  const lead = (data ?? null) as BookingLead | null;

  return (
    <div className="flex-1 flex flex-col bg-ink-50">
      <header className="h-16 px-5 flex items-center justify-center border-b border-ink-200 bg-white">
        <Logo href="/" />
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg mx-auto">
          {!lead ? (
            <div className="bg-white border border-ink-200 rounded-2xl shadow-sm p-8 text-center">
              <div className="mx-auto grid place-items-center h-14 w-14 rounded-full bg-ink-100 text-ink-500 mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
                  <path
                    d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-ink-900">
                Termin nicht verfügbar
              </h1>
              <p className="mt-2 text-sm text-ink-600">
                Dieser Terminlink ist ungültig oder abgelaufen. Bitte fragen Sie
                den Händler nach einem neuen Link.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                  Termin zur Fahrzeugbewertung buchen
                </h1>
                <p className="mt-2 text-sm text-ink-600">
                  {lead.dealer_firma ? `${lead.dealer_firma} ` : ""}möchte Ihr
                  Fahrzeug ankaufen. Wählen Sie einfach einen passenden Termin —
                  danach meldet sich der Händler zur verbindlichen Abstimmung.
                </p>
              </div>

              <div className="bg-white border border-ink-200 rounded-2xl shadow-sm p-5 mb-5">
                <p className="text-[11px] uppercase tracking-widest font-semibold text-ink-400 mb-3">
                  Ihr Fahrzeug
                </p>
                <p className="text-lg font-semibold text-ink-900">
                  {lead.fahrzeug}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {lead.baujahr != null && (
                    <VehicleItem label="Baujahr" value={String(lead.baujahr)} />
                  )}
                  {lead.kilometerstand != null && (
                    <VehicleItem
                      label="Kilometerstand"
                      value={formatKm(lead.kilometerstand)}
                    />
                  )}
                  {lead.getriebe && (
                    <VehicleItem label="Getriebe" value={lead.getriebe} />
                  )}
                  {lead.kraftstoff && (
                    <VehicleItem label="Kraftstoff" value={lead.kraftstoff} />
                  )}
                  {lead.erstzulassung && (
                    <VehicleItem
                      label="Erstzulassung"
                      value={lead.erstzulassung}
                    />
                  )}
                  {lead.angebot_preis != null && (
                    <VehicleItem
                      label="Richtpreis"
                      value={formatEuro(lead.angebot_preis)}
                      highlight
                    />
                  )}
                </dl>
              </div>

              <BookingForm leadId={lead.id} />
            </>
          )}
        </div>
      </main>

      <footer className="px-4 py-6 border-t border-ink-200 text-xs text-ink-500 text-center bg-white">
        © {new Date().getFullYear()} Finca Solutions ·{" "}
        <Link href="/impressum" className="hover:underline">
          Impressum
        </Link>{" "}
        ·{" "}
        <Link href="/datenschutz" className="hover:underline">
          Datenschutz
        </Link>
      </footer>
    </div>
  );
}

function VehicleItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className={`font-medium ${
          highlight ? "text-brand-800" : "text-ink-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
