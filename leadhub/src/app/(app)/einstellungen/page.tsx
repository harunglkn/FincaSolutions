import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { logout } from "../auth-actions";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { AvailabilityForm } from "./availability-form";
import type { Profile, DealerAvailability } from "@/lib/database.types";

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

  const { data: availability } = await supabase
    .from("dealer_availability")
    .select("*")
    .eq("dealer_id", user!.id)
    .order("weekday");

  return (
    <>
      <Topbar title="Einstellungen" subtitle="Konto und Autohaus" />

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
            <CardTitle>Termin-Verfügbarkeit</CardTitle>
          </CardHeader>
          <CardBody>
            <AvailabilityForm
              rows={(availability ?? []) as DealerAvailability[]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Konto</CardTitle>
          </CardHeader>
          <CardBody className="text-sm space-y-4">
            <div className="text-ink-600">
              Angemeldet als{" "}
              <span className="font-medium text-ink-900">{user?.email}</span>
            </div>
            <form action={logout}>
              <Button variant="secondary" type="submit">
                Abmelden
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
