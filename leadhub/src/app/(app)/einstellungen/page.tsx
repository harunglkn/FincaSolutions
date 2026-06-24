import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "../auth-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Einstellungen",
};

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  return (
    <>
      <Topbar
        title="Einstellungen"
        subtitle="Konto, Autohaus, Benachrichtigungen"
      />

      <div className="p-6 lg:p-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Autohaus</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input label="Firmenname" value="Autohaus Musterstadt GmbH" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Telefon" value="+49 221 0000000" />
              <Input label="E-Mail" value="kontakt@autohaus-musterstadt.de" />
            </div>
            <Input label="Adresse" value="Musterstraße 1, 50667 Köln" />
            <div className="pt-2">
              <Button>Speichern</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Benachrichtigungen</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Toggle label="E-Mail bei neuer Verkäufer-Antwort" enabled />
            <Toggle label="Push-Benachrichtigung bei hohem Potenzial" enabled />
            <Toggle label="Tagesbericht per E-Mail (18:00 Uhr)" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konto</CardTitle>
          </CardHeader>
          <CardBody className="text-sm space-y-3">
            <div className="text-ink-600">
              Angemeldet als{" "}
              <span className="font-medium text-ink-900">{email}</span>
            </div>
            <p className="text-ink-500">
              Passwort ändern und Zwei-Faktor-Authentifizierung folgen.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled>
                Passwort ändern
              </Button>
              <form action={logout}>
                <Button variant="ghost" className="text-red-700" type="submit">
                  Abmelden
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function Input({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1.5">
        {label}
      </label>
      <input
        defaultValue={value}
        className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-ink-800">{label}</span>
      <span
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled ? "bg-brand-600" : "bg-ink-200",
        ].join(" ")}
        aria-hidden
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow",
            enabled ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </div>
  );
}
