import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <div className="flex-1 flex flex-col bg-ink-50">
      <header className="h-16 px-6 lg:px-10 flex items-center justify-between border-b border-ink-200 bg-white">
        <Logo />
        <Link
          href="/"
          className="text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          ← Zur Startseite
        </Link>
      </header>

      <main className="flex-1 px-6 lg:px-10 py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl font-semibold text-ink-900">Impressum</h1>

          <section className="space-y-1 text-ink-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-2">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="font-medium text-ink-900">{COMPANY.legalName}</p>
            {COMPANY.owner && <p>Inhaber: {COMPANY.owner}</p>}
            <p>{COMPANY.street}</p>
            <p>{COMPANY.zipCity}</p>
            <p>{COMPANY.country}</p>
          </section>

          <section className="space-y-1 text-ink-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-2">
              Kontakt
            </h2>
            <p>
              E-Mail:{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-brand-700 hover:underline"
              >
                {COMPANY.email}
              </a>
            </p>
            {COMPANY.phone && <p>Telefon: {COMPANY.phone}</p>}
            {COMPANY.website && (
              <p>
                Web:{" "}
                <a
                  href={COMPANY.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline"
                >
                  {COMPANY.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
          </section>

          {(COMPANY.vatId || COMPANY.taxNumber || COMPANY.register) && (
            <section className="space-y-1 text-ink-700">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-2">
                Steuer
              </h2>
              {COMPANY.register && <p>{COMPANY.register}</p>}
              {COMPANY.vatId && <p>USt-IdNr.: {COMPANY.vatId}</p>}
              {COMPANY.taxNumber && <p>Steuernummer: {COMPANY.taxNumber}</p>}
            </section>
          )}

          <section className="space-y-1 text-ink-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-2">
              Verantwortlich für den Inhalt
            </h2>
            {COMPANY.owner && <p>{COMPANY.owner}</p>}
            <p>{COMPANY.street}</p>
            <p>{COMPANY.zipCity}</p>
          </section>

          <section className="space-y-3 text-ink-700">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 mb-2">
              Haftungsausschluss
            </h2>
            <p>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt.
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte
              können wir jedoch keine Gewähr übernehmen.
            </p>
            <p>
              Unsere Website enthält Links zu externen Websites Dritter, auf
              deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte
              übernehmen wir keine Gewähr.
            </p>
          </section>

          <section className="text-xs text-ink-400 pt-4 border-t border-ink-200">
            <p>
              Plattform der EU-Kommission zur Online-Streitbeilegung:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="px-6 lg:px-10 py-6 border-t border-ink-200 text-xs text-ink-500 text-center bg-white">
        © {new Date().getFullYear()} {COMPANY.brand} ·{" "}
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
