import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Datenschutz",
};

export default function DatenschutzPage() {
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
        <div className="max-w-2xl mx-auto space-y-8 text-ink-700 leading-relaxed">
          <div>
            <h1 className="text-3xl font-semibold text-ink-900">
              Datenschutzerklärung
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Diese Erklärung informiert über die Verarbeitung
              personenbezogener Daten bei der Nutzung von {COMPANY.brand}.
            </p>
          </div>

          <Section title="1. Verantwortlicher">
            <p>{COMPANY.legalName}</p>
            <p>
              {COMPANY.street}, {COMPANY.zipCity}
            </p>
            <p>
              E-Mail:{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-brand-700 hover:underline"
              >
                {COMPANY.email}
              </a>
            </p>
          </Section>

          <Section title="2. Welche Daten wir verarbeiten">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Kontodaten:</strong> E-Mail-Adresse und
                Zugangsdaten für die Anmeldung.
              </li>
              <li>
                <strong>Autohaus-Profil:</strong> Firmenname, Anschrift und
                Telefonnummer, soweit von Ihnen angegeben.
              </li>
              <li>
                <strong>Lead- und Nachrichtendaten:</strong> Fahrzeugdaten,
                Preisangaben sowie die Kommunikation mit Verkäufern, die im
                Rahmen der Nutzung erfasst werden.
              </li>
              <li>
                <strong>Nutzungsdaten:</strong> technische Protokolle, die
                beim Betrieb der Anwendung anfallen.
              </li>
            </ul>
          </Section>

          <Section title="3. Zwecke und Rechtsgrundlage">
            <p>
              Die Verarbeitung erfolgt zur Bereitstellung und zum Betrieb der
              CRM-Funktionen (Vertragserfüllung, Art. 6 Abs. 1 lit. b DSGVO)
              sowie zur Gewährleistung eines sicheren und funktionsfähigen
              Betriebs (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).
            </p>
          </Section>

          <Section title="4. Auftragsverarbeiter / Hosting">
            <p>
              Zum Betrieb setzen wir sorgfältig ausgewählte Dienstleister ein,
              mit denen Verträge zur Auftragsverarbeitung bestehen:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Supabase</strong> — Datenbank und Authentifizierung.
              </li>
              <li>
                <strong>Vercel</strong> — Hosting der Web-Anwendung.
              </li>
            </ul>
          </Section>

          <Section title="5. Speicherdauer">
            <p>
              Personenbezogene Daten werden gelöscht, sobald sie für die
              genannten Zwecke nicht mehr erforderlich sind und keine
              gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </Section>

          <Section title="6. Ihre Rechte">
            <p>
              Sie haben das Recht auf Auskunft, Berichtigung, Löschung,
              Einschränkung der Verarbeitung, Datenübertragbarkeit sowie
              Widerspruch. Zudem besteht ein Beschwerderecht bei einer
              Aufsichtsbehörde. Wenden Sie sich hierzu an{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-brand-700 hover:underline"
              >
                {COMPANY.email}
              </a>
              .
            </p>
          </Section>

          <p className="text-xs text-ink-400 pt-4 border-t border-ink-200">
            Diese Datenschutzerklärung ist eine allgemeine Vorlage und ersetzt
            keine individuelle Rechtsberatung. Bitte vor der geschäftlichen
            Nutzung anwaltlich prüfen lassen.
          </p>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      {children}
    </section>
  );
}
