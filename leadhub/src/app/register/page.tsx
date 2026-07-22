import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Konto erstellen",
};

export default function RegisterPage() {
  return (
    <div className="flex-1 grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-800 to-brand-950 text-white p-10">
        <Logo variant="light" />
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            In wenigen Minuten startklar.
          </h2>
          <p className="mt-4 text-brand-100 max-w-md">
            Legen Sie Ihr Händler-Konto an und verwalten Sie Anfragen,
            Antworten und Termine ab der ersten Minute an einem Ort.
          </p>
        </div>
        <p className="text-xs text-brand-200">
          © {new Date().getFullYear()} Finca Solutions ·{" "}
          <Link href="/impressum" className="hover:underline">
            Impressum
          </Link>{" "}
          ·{" "}
          <Link href="/datenschutz" className="hover:underline">
            Datenschutz
          </Link>
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-ink-900">
            Konto erstellen
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Kostenlos starten — keine Zahlungsdaten nötig.
          </p>

          <RegisterForm />

          <p className="mt-8 text-sm text-ink-600 text-center">
            Schon ein Konto?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-700 hover:underline"
            >
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
