import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  type Lead,
} from "@/lib/database.types";
import { formatEuro, formatRelative } from "@/lib/format";
import { SeedButton } from "../seed-button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
};

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const todayIso = startOfToday();

  const [
    leadsTodayResult,
    openResult,
    campaignsActiveResult,
    recentLeadsResult,
    allLeadsResult,
    botLeadsTodayResult,
    unreadResult,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("ankaufspreis", { count: "exact" })
      .gte("created_at", todayIso),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "antwort_offen"),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("aktiv", true),
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("leads").select("status, ankaufspreis"),
    supabase
      .from("leads")
      .select("id, fahrzeug, ankaufspreis, angebot_preis, created_at, external_id, quelle")
      .eq("quelle", "mobile.de Bot")
      .gte("created_at", todayIso)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("leads")
      .select("id, fahrzeug, verkaeufer_name, ankaufspreis, last_seller_message_at", {
        count: "exact",
      })
      .eq("has_unread_seller_message", true)
      .order("last_seller_message_at", { ascending: false })
      .limit(10),
  ]);

  const anfragenHeute = leadsTodayResult.count ?? 0;
  const offeneAntworten = openResult.count ?? 0;
  const kampagnenAktiv = campaignsActiveResult.count ?? 0;
  const recentLeads = (recentLeadsResult.data ?? []) as Lead[];
  const allLeads = allLeadsResult.data ?? [];
  const botLeadsToday = botLeadsTodayResult.data ?? [];
  const unreadLeads = unreadResult.data ?? [];
  const unreadCount = unreadResult.count ?? unreadLeads.length;

  // Tagesbericht-Zahlen
  const tagesbericht = {
    anfragen: anfragenHeute,
    offen: offeneAntworten,
    termine: allLeads.filter((l) => l.status === "termin_vereinbart").length,
    potenzial: allLeads.filter((l) => l.status === "hohes_potenzial").length,
    abgeschlossen: allLeads.filter((l) => l.status === "abgeschlossen").length,
  };

  const isEmpty = allLeads.length === 0 && kampagnenAktiv === 0;

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Übersicht über Ihren Tag"
        action={<LinkButton href="/leads">Alle Leads</LinkButton>}
      />

      <div className="p-6 lg:p-8 space-y-6">
        {unreadLeads.length > 0 && (
          <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="flex items-center justify-between border-b-amber-200">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-full bg-amber-500 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                    <path
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <CardTitle>
                    {unreadLeads.length}{" "}
                    {unreadLeads.length === 1
                      ? "neue Verkäufer-Antwort"
                      : "neue Verkäufer-Antworten"}
                  </CardTitle>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Warten auf deine Bearbeitung. Klick öffnet den Lead und
                    markiert ihn automatisch als gelesen.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="!p-0">
              <ul className="divide-y divide-amber-100">
                {unreadLeads.map((l) => (
                  <li key={l.id} className="px-6 py-3 hover:bg-amber-50/60">
                    <Link
                      href={`/leads/${l.id}`}
                      className="flex items-center gap-4"
                    >
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink-900 truncate">
                          {l.fahrzeug}
                        </p>
                        <p className="text-xs text-ink-500 truncate">
                          {l.verkaeufer_name ?? "Verkäufer"}
                          {l.last_seller_message_at &&
                            ` · ${formatRelative(l.last_seller_message_at)}`}
                        </p>
                      </div>
                      {l.ankaufspreis && (
                        <span className="text-sm font-semibold text-brand-800 shrink-0">
                          {formatEuro(Number(l.ankaufspreis))}
                        </span>
                      )}
                      <span className="text-brand-700 text-sm font-medium shrink-0">
                        Öffnen →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        {isEmpty && (
          <Card>
            <CardBody className="py-10 text-center space-y-3">
              <h2 className="text-lg font-semibold text-ink-900">
                Willkommen im LeadHub 👋
              </h2>
              <p className="text-sm text-ink-500 max-w-md mx-auto">
                Damit du gleich etwas zu sehen hast, kannst du Beispieldaten
                laden — oder direkt deinen ersten Lead anlegen.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <SeedButton />
                <LinkButton href="/leads">Zur Lead-Liste</LinkButton>
              </div>
            </CardBody>
          </Card>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Neue Anfragen heute" value={anfragenHeute} />
          <StatCard
            label="Verkäufer-Antworten"
            value={unreadCount}
            hint={unreadCount === 1 ? "unbeantwortet" : "unbeantwortet"}
          />
          <StatCard label="Offene Anfragen" value={offeneAntworten} />
          <StatCard
            label="Aktive Kampagnen"
            value={kampagnenAktiv}
            hint="Suchläufe"
          />
        </section>

        {botLeadsToday.length > 0 && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>
                  🤖 Bot-Aktivität heute · {botLeadsToday.length} Kontakte
                </CardTitle>
                <p className="mt-0.5 text-xs text-ink-500">
                  Automatisch angeschriebene Fahrzeuge über Ihre Suchläufe
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            </CardHeader>
            <CardBody className="!p-0">
              <ul className="divide-y divide-ink-100">
                {botLeadsToday.map((l) => (
                  <li
                    key={l.id}
                    className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-ink-50/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-ink-500">
                        <span className="font-mono">
                          {l.external_id ?? "—"}
                        </span>
                        <span>·</span>
                        <span>{formatRelative(l.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {l.fahrzeug}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-ink-500">Angebot</div>
                      <div className="text-sm font-semibold text-brand-800">
                        {formatEuro(Number(l.ankaufspreis))}
                      </div>
                    </div>
                    <Link
                      href={`/leads/${l.id}`}
                      className="text-sm font-medium text-brand-700 hover:underline shrink-0"
                    >
                      Öffnen →
                    </Link>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Aktuelle Leads</CardTitle>
              <LinkButton href="/leads" variant="ghost" size="sm">
                Alle anzeigen →
              </LinkButton>
            </CardHeader>
            <CardBody className="!p-0">
              {recentLeads.length === 0 ? (
                <p className="px-6 py-8 text-sm text-ink-500 text-center">
                  Noch keine Leads.
                </p>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {recentLeads.map((lead) => (
                    <li
                      key={lead.id}
                      className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-ink-50/60"
                    >
                      <div className="min-w-0">
                        <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                          {LEAD_STATUS_LABEL[lead.status]}
                        </Badge>
                        <p className="mt-1 text-sm font-medium text-ink-900 truncate">
                          {lead.fahrzeug}
                        </p>
                        <p className="text-xs text-ink-500">
                          {lead.verkaeufer_name ?? "—"} ·{" "}
                          {lead.ort ?? ""}
                        </p>
                      </div>
                      <LinkButton
                        href={`/leads/${lead.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Öffnen
                      </LinkButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tagesbericht</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Row label="Aktive Kampagnen" value={kampagnenAktiv} />
              <Row label="Anfragen heute" value={tagesbericht.anfragen} />
              <Row label="Offene Antworten" value={tagesbericht.offen} />
              <Row label="Mit Potenzial" value={tagesbericht.potenzial} />
              <Row label="Termine vereinbart" value={tagesbericht.termine} />
              <Row label="Abgeschlossen" value={tagesbericht.abgeschlossen} emphasis />
            </CardBody>
          </Card>
        </section>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-600">{label}</span>
      <span
        className={`font-semibold ${
          emphasis ? "text-brand-700" : "text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
