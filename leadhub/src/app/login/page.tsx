import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Anmelden",
};

export default function LoginPage() {
  return (
    <div className="flex-1 grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-800 to-brand-950 text-white p-10">
        <Logo variant="light" />
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Ihre Fahrzeug-Leads. Zentral. Professionell.
          </h2>
          <p className="mt-4 text-brand-100 max-w-md">
            Behalten Sie Anfragen, Antworten, Einkaufspotenzial und
            Tagesberichte in einem einzigen Dashboard im Blick.
          </p>
        </div>
        <p className="text-xs text-brand-200">
          © {new Date().getFullYear()} Finca-Solutions
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Willkommen zurück
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Melden Sie sich mit Ihrem Händler-Konto an.
          </p>

          <form className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-ink-700 mb-1.5"
              >
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@autohaus.de"
                className="w-full h-11 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-ink-700"
                >
                  Passwort
                </label>
                <Link
                  href="#"
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  Vergessen?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full h-11 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Anmelden
            </Button>
          </form>

          <p className="mt-6 text-xs text-ink-500 text-center">
            Login ist Platzhalter — Anbindung an Supabase folgt.
          </p>

          <p className="mt-8 text-sm text-ink-600 text-center">
            Noch kein Konto?{" "}
            <Link
              href="#"
              className="font-medium text-brand-700 hover:underline"
            >
              Demo anfragen
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
