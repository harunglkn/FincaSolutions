import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Termin buchen · Finca Solutions",
  robots: { index: false, follow: false },
};

// Kurzlink-Route: /termin/<token> -> loest den Token auf und leitet auf die
// bestehende Buchungsseite weiter. So gibt es genau EINE Buchungsseite
// (keine doppelte Logik), aber einen kurzen, mobile.de-tauglichen Link.
export default async function TokenBookingPage(
  props: PageProps<"/termin/[token]">,
) {
  const { token } = await props.params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("resolve_booking_token", {
    p_token: token,
  });
  const leadId = (data ?? null) as string | null;

  if (leadId) {
    redirect(`/booking/lead/${leadId}`);
  }

  return (
    <div className="flex-1 flex flex-col bg-ink-50">
      <header className="h-16 px-5 flex items-center justify-center border-b border-ink-200 bg-white">
        <Logo href="/" />
      </header>
      <main className="flex-1 px-4 py-12 grid place-items-start">
        <div className="w-full max-w-lg mx-auto bg-white border border-ink-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-900">
            Termin-Link ungültig
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Dieser Buchungslink ist ungültig oder abgelaufen. Bitte prüfen Sie
            die Schreibweise oder fragen Sie den Händler nach einem neuen Link.
          </p>
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
