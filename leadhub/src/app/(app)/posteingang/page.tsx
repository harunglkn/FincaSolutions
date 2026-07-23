import Link from "next/link";
import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheapestBadge } from "@/components/ui/cheapest-badge";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  isCheapestInMarket,
  type Lead,
} from "@/lib/database.types";
import { formatEuro, formatRelative } from "@/lib/format";

export const metadata: Metadata = {
  title: "Posteingang",
};

type ConversationRow = Lead & {
  latest_seller_text: string | null;
  latest_seller_at: string | null;
  message_count: number;
};

function getStr(
  sp: Awaited<PageProps<"/posteingang">["searchParams"]>,
  key: string,
): string | undefined {
  const v = sp?.[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

export default async function PosteingangPage(
  props: PageProps<"/posteingang">,
) {
  const sp = await props.searchParams;
  const filter = getStr(sp, "filter") ?? "unread";
  const supabase = await createClient();

  // Alle Leads mit mindestens einer Verkaeufer-Nachricht laden,
  // sortiert nach last_seller_message_at desc
  let leadsQuery = supabase
    .from("leads")
    .select("*")
    .not("last_seller_message_at", "is", null)
    .order("last_seller_message_at", { ascending: false })
    .limit(200);

  if (filter === "unread") {
    leadsQuery = leadsQuery.eq("has_unread_seller_message", true);
  }

  const { data: leads } = await leadsQuery;
  const leadList = (leads ?? []) as Lead[];

  // Pro Lead: letzte Verkäufer-Nachricht + Gesamt-Nachrichten-Count
  const conversations: ConversationRow[] = await Promise.all(
    leadList.map(async (lead) => {
      const [latestRes, countRes] = await Promise.all([
        supabase
          .from("lead_messages")
          .select("text, created_at")
          .eq("lead_id", lead.id)
          .eq("von", "verkaeufer")
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("lead_messages")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", lead.id),
      ]);
      const latest = latestRes.data?.[0] ?? null;
      return {
        ...lead,
        latest_seller_text: latest?.text ?? null,
        latest_seller_at: latest?.created_at ?? lead.last_seller_message_at,
        message_count: countRes.count ?? 0,
      };
    }),
  );

  // Counts fuer Filter-Tabs
  const [{ count: countUnread }, { count: countAll }] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("has_unread_seller_message", true),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .not("last_seller_message_at", "is", null),
  ]);

  return (
    <>
      <Topbar
        title="Posteingang"
        subtitle="Alle Verkäufer-Antworten an einem Ort"
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Filter-Tabs */}
        <div className="flex items-center gap-2 border-b border-ink-200 pb-3">
          <FilterTab href="/posteingang?filter=unread" active={filter === "unread"}>
            Ungelesen{" "}
            {countUnread !== null && (
              <span
                className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  filter === "unread" ? "bg-white text-amber-700" : "bg-amber-500 text-white"
                }`}
              >
                {countUnread ?? 0}
              </span>
            )}
          </FilterTab>
          <FilterTab href="/posteingang?filter=all" active={filter === "all"}>
            Alle{" "}
            <span className="ml-1.5 text-xs opacity-75">({countAll ?? 0})</span>
          </FilterTab>
        </div>

        {conversations.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-brand-50 text-brand-700 grid place-items-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden>
                  <path
                    d="M3 8l9 6 9-6M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-ink-900">
                {filter === "unread"
                  ? "Keine ungelesenen Antworten"
                  : "Noch keine Antworten"}
              </h2>
              <p className="mt-1 text-sm text-ink-500 max-w-md mx-auto">
                {filter === "unread"
                  ? "Alle Verkäufer-Antworten sind bearbeitet. Gute Arbeit!"
                  : "Sobald ein Verkäufer auf eine Bot-Nachricht antwortet, erscheint sie hier."}
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="!p-0">
              <ul className="divide-y divide-ink-100">
                {conversations.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/leads/${conv.id}`}
                      className={`block px-6 py-4 transition-colors ${
                        conv.has_unread_seller_message
                          ? "bg-amber-50/40 hover:bg-amber-50/80"
                          : "hover:bg-ink-50/60"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                          className={`grid place-items-center h-11 w-11 rounded-full shrink-0 font-semibold ${
                            conv.has_unread_seller_message
                              ? "bg-amber-500 text-white"
                              : "bg-ink-100 text-ink-600"
                          }`}
                        >
                          {(conv.verkaeufer_name?.[0] ?? "V").toUpperCase()}
                        </div>

                        {/* Inhalt */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {conv.has_unread_seller_message && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping" />
                                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                                </span>
                                NEU
                              </span>
                            )}
                            <h3 className="text-sm font-semibold text-ink-900 truncate">
                              {conv.fahrzeug}
                            </h3>
                            {isCheapestInMarket(conv) && (
                              <CheapestBadge size="sm" />
                            )}
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>{conv.verkaeufer_name ?? "Verkäufer"}</span>
                            {conv.ort && <span>· {conv.ort}</span>}
                            {conv.angebot_preis && (
                              <span>· Angebot {formatEuro(conv.angebot_preis)}</span>
                            )}
                            {conv.ankaufspreis && (
                              <span className="text-brand-700 font-medium">
                                · Ankauf {formatEuro(conv.ankaufspreis)}
                              </span>
                            )}
                          </div>
                          {conv.latest_seller_text && (
                            <p className="mt-2 text-sm text-ink-700 line-clamp-2">
                              {conv.latest_seller_text}
                            </p>
                          )}
                        </div>

                        {/* Rechte Spalte */}
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-xs text-ink-500">
                            {conv.latest_seller_at
                              ? formatRelative(conv.latest_seller_at)
                              : "—"}
                          </span>
                          <Badge tone={LEAD_STATUS_TONE[conv.status]}>
                            {LEAD_STATUS_LABEL[conv.status]}
                          </Badge>
                          <span className="text-[10px] text-ink-400">
                            {conv.message_count} Nachricht
                            {conv.message_count === 1 ? "" : "en"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}

function FilterTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex items-center px-3 py-2 -mb-px text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-amber-500 text-amber-700"
          : "border-transparent text-ink-600 hover:text-ink-900",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
