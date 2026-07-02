import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-white via-ink-50 to-brand-50">
      <header className="h-16 px-6 lg:px-10 flex items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
          >
            Anmelden
          </Link>
          <LinkButton href="/login" size="sm">
            Loslegen
          </LinkButton>
        </nav>
      </header>

      <main className="flex-1 px-6 lg:px-10 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-800">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            Für freie Autohändler
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-ink-900 max-w-3xl">
            Fahrzeug-Leads zentral verwalten.
            <span className="text-brand-700"> Mehr Ankäufe pro Tag.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-600 max-w-2xl">
            LeadHub bündelt Anfragen, Antworten von Verkäufern,
            Einkaufspotenzial, Termine und Tagesberichte in einem
            professionellen Dashboard — damit Sie nichts mehr aus den Augen
            verlieren.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/login" size="lg">
              Jetzt anmelden
            </LinkButton>
            <LinkButton href="/dashboard" size="lg" variant="secondary">
              Demo-Dashboard ansehen
            </LinkButton>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Suchläufe & Kampagnen",
                body: "Erstellen Sie Suchprofile für Wunschfahrzeuge und beobachten Sie passende Angebote automatisch.",
              },
              {
                title: "Anfragen & Antworten",
                body: "Verkäuferantworten werden gesammelt und übersichtlich pro Lead dargestellt.",
              },
              {
                title: "Tagesbericht",
                body: "Auf einen Blick: Wieviele Anfragen, Antworten, Termine und Ankäufe an einem Tag.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-ink-200 rounded-xl p-5 shadow-sm"
              >
                <h3 className="font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm text-ink-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="px-6 lg:px-10 py-6 border-t border-ink-200 text-xs text-ink-500 text-center">
        © {new Date().getFullYear()} Finca Solutions · {" "}
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
