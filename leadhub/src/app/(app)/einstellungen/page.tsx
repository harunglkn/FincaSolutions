import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "../auth-actions";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import type { Profile } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Einstellungen",
};

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

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
          <CardBody>
            <ProfileForm profile={profile as Profile} />
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
            <p className="text-xs text-ink-500 pt-2">
              (Benachrichtigungs-Einstellungen werden noch nicht gespeichert.)
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konto</CardTitle>
          </CardHeader>
          <CardBody className="text-sm space-y-3">
            <div className="text-ink-600">
              Angemeldet als{" "}
              <span className="font-medium text-ink-900">{user?.email}</span>
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
