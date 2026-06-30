import Link from "next/link";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  type Lead,
  type LeadStatus,
} from "@/lib/database.types";
import { formatEuro, formatKm } from "@/lib/format";
import { NewLeadButton } from "./new-lead-button";
import { SeedButton } from "../seed-button";
import { LeadsFilterBar } from "./leads-filter-bar";

export const metadata: Metadata = {
  title: "Leads",
};

const PAGE_SIZE = 100;

function getStr(
  sp: Awaited<PageProps<"/leads">["searchParams"]>,
  key: string,
): string | undefined {
  const v = sp?.[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function getInt(
  sp: Awaited<PageProps<"/leads">["searchParams"]>,
  key: string,
): number | undefined {
  const s = getStr(sp, key);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function LeadsPage(props: PageProps<"/leads">) {
  const sp = await props.searchParams;
  const supabase = await createClient();

  const q = getStr(sp, "q");
  const statusFilter = getStr(sp, "status");
  const jahrVon = getInt(sp, "jahr_von");
  const jahrBis = getInt(sp, "jahr_bis");
  const kmMax = getInt(sp, "km_max");
  const preisMax = getInt(sp, "preis_max");

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (q) {
    // ilike auf mehreren Spalten: Fahrzeug, Verkäufer, Ort
    const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `fahrzeug.ilike.%${escaped}%,verkaeufer_name.ilike.%${escaped}%,ort.ilike.%${escaped}%`,
    );
  }

  if (
    statusFilter &&
    statusFilter !== "all" &&
    (LEAD_STATUSES as string[]).includes(statusFilter)
  ) {
    query = query.eq("status", statusFilter as LeadStatus);
  }

  if (jahrVon !== undefined) query = query.gte("baujahr", jahrVon);
  if (jahrBis !== undefined) query = query.lte("baujahr", jahrBis);
  if (kmMax !== undefined) query = query.lte("kilometerstand", kmMax);
  if (preisMax !== undefined) query = query.lte("ankaufspreis", preisMax);

  const [leadsResult, campaignsResult, totalResult] = await Promise.all([
    query,
    supabase.from("campaigns").select("id, name").order("name"),
    supabase.from("leads").select("id", { count: "exact", head: true }),
  ]);

  const leads = (leadsResult.data ?? []) as Lead[];
  const filteredCount = leadsResult.count ?? leads.length;
  const totalCount = totalResult.count ?? 0;
  const campaigns = campaignsResult.data ?? [];

  const hasFilters =
    !!q || !!statusFilter || jahrVon || jahrBis || kmMax || preisMax;

  return (
    <>
      <Topbar
        title="Leads"
        subtitle={
          hasFilters
            ? `${filteredCount} von ${totalCount} Leads`
            : `${totalCount} ${totalCount === 1 ? "Lead" : "Leads"} insgesamt`
        }
        action={<NewLeadButton campaigns={campaigns} />}
      />

      <div className="p-6 lg:p-8 space-y-6">
        {totalCount === 0 ? (
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
                  Legen Sie Ihren ersten Lead an oder laden Sie Beispieldaten.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <NewLeadButton campaigns={campaigns} />
                <SeedButton />
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <LeadsFilterBar resultCount={filteredCount} />

            {leads.length === 0 ? (
              <Card>
                <CardBody className="py-12 text-center">
                  <p className="text-sm text-ink-500">
                    Keine Leads gefunden, die zu den Filtern passen.
                  </p>
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
                        <tr
                          key={lead.id}
                          className={[
                            "hover:bg-ink-50/60",
                            lead.has_unread_seller_message
                              ? "bg-amber-50/40 hover:bg-amber-50/70"
                              : "",
                          ].join(" ")}
                        >
                          <Td>
                            <div className="flex items-center gap-2">
                              {lead.has_unread_seller_message && (
                                <span
                                  title="Neue Verkäufer-Antwort"
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
                                >
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                                  </span>
                                  Neu
                                </span>
                              )}
                              <div className="font-medium text-ink-900">
                                {lead.fahrzeug}
                              </div>
                            </div>
                            <div className="text-xs text-ink-500">
                              {lead.baujahr ?? "—"} ·{" "}
                              {formatKm(lead.kilometerstand)}
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
                  {filteredCount > PAGE_SIZE && (
                    <div className="px-6 py-3 border-t border-ink-100 text-center text-xs text-ink-500">
                      Erste {PAGE_SIZE} von {filteredCount} Treffern angezeigt
                      — bitte Filter verfeinern.
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </>
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
