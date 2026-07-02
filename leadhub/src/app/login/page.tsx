import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Anmelden",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const raw = sp?.redirect;
  const redirectTo =
    typeof raw === "string" && raw.startsWith("/") ? raw : "/dashboard";

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
            Willkommen zurück
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Melden Sie sich mit Ihrem Händler-Konto an.
          </p>

          <LoginForm redirectTo={redirectTo} />

          <p className="mt-8 text-sm text-ink-600 text-center">
            Noch kein Konto?{" "}
            <Link
              href="mailto:harunglkn@gmail.com?subject=Demo-Anfrage%20LeadHub"
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
