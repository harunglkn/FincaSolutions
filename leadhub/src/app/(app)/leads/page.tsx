import Link from "next/link";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  type Lead,
} from "@/lib/database.types";
import { formatEuro, formatKm } from "@/lib/format";
import { NewLeadButton } from "./new-lead-button";
import { SeedButton } from "../seed-button";

export const metadata: Metadata = {
  title: "Leads",
};

export default async function LeadsPage() {
  const supabase = await createClient();

  const [leadsResult, campaignsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("campaigns").select("id, name").order("name"),
  ]);

  const leads = (leadsResult.data ?? []) as Lead[];
  const campaigns = campaignsResult.data ?? [];

  return (
    <>
      <Topbar
        title="Leads"
        subtitle={`${leads.length} ${leads.length === 1 ? "Lead" : "Leads"} insgesamt`}
        action={<NewLeadButton campaigns={campaigns} />}
      />

      <div className="p-6 lg:p-8 space-y-6">
        {leads.length === 0 ? (
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
                    d="M4 6h16M4 12h16M4 18h10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink-900">
                  Noch keine Leads
                </h2>
                <p className="mt-1 text-sm text-ink-500 max-w-md mx-auto">
                  Legen Sie Ihren ersten Lead an oder laden Sie Beispieldaten,
                  um die App auszuprobieren.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <NewLeadButton campaigns={campaigns} />
                <SeedButton />
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="!p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-500">
                  <tr>
                    <Th>Fahrzeug</Th>
                    <Th>Verkäufer</Th>
                    <Th>Angebot</Th>
                    <Th>Ankaufspreis</Th>
                    <Th>Status</Th>
                    <Th></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-ink-50/60">
                      <Td>
                        <div className="font-medium text-ink-900">
                          {lead.fahrzeug}
                        </div>
                        <div className="text-xs text-ink-500">
                          {lead.baujahr ?? "—"} · {formatKm(lead.kilometerstand)}
                        </div>
                      </Td>
                      <Td>
                        <div className="text-ink-900">
                          {lead.verkaeufer_name ?? "—"}
                        </div>
                        <div className="text-xs text-ink-500">
                          {lead.ort ?? ""}
                        </div>
                      </Td>
                      <Td className="text-ink-900">
                        {formatEuro(lead.angebot_preis)}
                      </Td>
                      <Td className="font-semibold text-brand-800">
                        {formatEuro(lead.ankaufspreis)}
                      </Td>
                      <Td>
                        <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                          {LEAD_STATUS_LABEL[lead.status]}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-sm font-medium text-brand-700 hover:underline"
                        >
                          Öffnen →
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
