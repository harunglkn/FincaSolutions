import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { SearchProfile, Agent } from "@/lib/database.types";
import { SuchlaufManager } from "./suchlauf-manager";
import { MotorConnect } from "./motor-connect";

export const metadata: Metadata = { title: "Suchlauf" };

const MOTOR_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export default async function SuchlaufPage() {
  const supabase = await createClient();

  // Nur der Betreiber sieht die Suchlauf-Steuerung. Kunden bekommen
  // ausschliesslich die Ergebnisse — auch beim direkten Aufruf der Adresse.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();
  if (me?.role !== "operator") {
    redirect("/dashboard");
  }

  const [{ data: profilesData }, { data: hbData }, { data: agentsData }] =
    await Promise.all([
      supabase
        .from("search_profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("worker_heartbeats")
        .select("last_seen_at")
        .eq("worker", "bot")
        .maybeSingle(),
      supabase
        .from("agents")
        .select("*")
        .eq("revoked", false)
        .order("created_at", { ascending: false }),
    ]);

  const profiles = (profilesData ?? []) as SearchProfile[];
  const agents = (agentsData ?? []) as Agent[];
  const motorActive =
    !!hbData?.last_seen_at &&
    Date.now() - new Date(hbData.last_seen_at).getTime() <
      MOTOR_ACTIVE_WINDOW_MS;
  const hasActive = profiles.some((p) => p.is_active);

  return (
    <>
      <Topbar
        title="Suchlauf"
        subtitle="Automatische Fahrzeug-Suche steuern"
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Motor-Status */}
        <Card>
          <CardBody className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="relative flex h-3 w-3">
                {motorActive && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                )}
                <span
                  className={`relative inline-flex h-3 w-3 rounded-full ${
                    motorActive ? "bg-green-500" : "bg-ink-300"
                  }`}
                />
              </span>
              <div>
                <p className="font-semibold text-ink-900">
                  {motorActive
                    ? hasActive
                      ? "Suchlauf läuft"
                      : "Bereit"
                    : "Arbeitsplatz nicht verbunden"}
                </p>
                <p className="text-sm text-ink-500">
                  {motorActive
                    ? hasActive
                      ? "Passende Fahrzeuge werden laufend erfasst und angefragt."
                      : "Ihr Arbeitsplatz ist verbunden. Starten Sie unten einen Suchlauf."
                    : "Ihr Arbeitsplatz meldet sich gerade nicht. Bitte prüfen Sie, ob der Rechner eingeschaltet ist."}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <MotorConnect agents={agents} />

        <SuchlaufManager profiles={profiles} />
      </div>
    </>
  );
}
