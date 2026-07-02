import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Campaign } from "@/lib/database.types";
import { NewCampaignButton } from "./new-campaign-button";
import { ToggleButton } from "./toggle-button";

export const metadata: Metadata = {
  title: "Kampagnen",
};

type CampaignWithStats = Campaign & {
  leads_count: number;
  antworten_count: number;
};

export default async function KampagnenPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (campaigns ?? []) as Campaign[];

  // Lead-Anzahlen pro Kampagne nachladen
  const stats = await Promise.all(
    list.map(async (c) => {
      const leads = await supabase
        .from("leads")
        .select("id, status", { count: "exact" })
        .eq("campaign_id", c.id);
      const leads_count = leads.count ?? 0;
      const antworten_count =
        leads.data?.filter((l) => l.status !== "antwort_offen").length ?? 0;
      return {
        ...c,
        leads_count,
        antworten_count,
      } satisfies CampaignWithStats;
    }),
  );

  return (
    <>
      <Topbar
        title="Kampagnen"
        subtitle="Suchprofile, die automatisch passende Fahrzeuge finden"
        action={<NewCampaignButton />}
      />

      <div className="p-6 lg:p-8">
        {stats.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-brand-50 text-brand-700 grid place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden
                >
                  <path
                    d="M3 11l18-7-7 18-3-8-8-3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink-900">
                  Noch keine Kampagnen
                </h2>
                <p className="mt-1 text-sm text-ink-500 max-w-md mx-auto">
                  Legen Sie Ihre erste Kampagne an, um automatisch passende
                  Fahrzeuge zu finden.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <NewCampaignButton />
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {stats.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle>{c.name}</CardTitle>
                  <Badge tone={c.aktiv ? "success" : "neutral"}>
                    {c.aktiv ? "Aktiv" : "Pausiert"}
                  </Badge>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-sm text-ink-600 min-h-[1.5rem]">
                    {c.beschreibung ?? "Keine Beschreibung."}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ink-100">
                    <Metric label="Leads gesamt" value={c.leads_count} />
                    <Metric
                      label="Antworten erhalten"
                      value={c.antworten_count}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" size="sm" disabled>
                      Bearbeiten
                    </Button>
                    <ToggleButton campaignId={c.id} aktiv={c.aktiv} />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="text-xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}
