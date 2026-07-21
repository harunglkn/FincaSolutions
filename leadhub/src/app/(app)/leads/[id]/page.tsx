import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  isCheapestInMarket,
  type Lead,
  type LeadMessage,
  type Appointment,
  type LeadActivity,
} from "@/lib/database.types";
import { formatEuro, formatKm, formatRelative } from "@/lib/format";
import { sendMessage, markLeadRead } from "../actions";
import { StatusSelector } from "./status-selector";
import { MessagesLive } from "./messages-live";
import { AppointmentPanel } from "./appointment-panel";
import { NotesCard } from "./notes-card";
import { CheapestBadge } from "@/components/ui/cheapest-badge";

export default async function LeadDetailPage(
  props: PageProps<"/leads/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [leadResult, messagesResult, campaignResult] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("lead_messages")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: true }),
    Promise.resolve(null),
  ]);

  const lead = leadResult.data as Lead | null;
  if (!lead) notFound();
  const messages = (messagesResult.data ?? []) as LeadMessage[];

  let campaignName: string | null = null;
  if (lead.campaign_id) {
    const { data } = await supabase
      .from("campaigns")
      .select("name")
      .eq("id", lead.campaign_id)
      .maybeSingle();
    campaignName = data?.name ?? null;
  }

  // Wenn unread: vormerken, dass wir nach Anzeige als "gelesen" markieren.
  const wasUnread = !!lead.has_unread_seller_message;
  if (wasUnread) {
    // Fire-and-forget: Read-Status aktualisieren, ohne diese Seite zu
    // revalidieren (waere Endlos-Schleife).
    await supabase.rpc("mark_lead_read", { p_lead_id: lead.id });
  }

  // Termine + Aktivitaeten dieses Leads laden.
  const [{ data: apptData }, { data: activityData }] = await Promise.all([
    supabase
      .from("appointments")
      .select("*")
      .eq("lead_id", id)
      .order("appointment_datetime", { ascending: false }),
    supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const activities = (activityData ?? []) as LeadActivity[];
  const appointments = (apptData ?? []) as Appointment[];
  const nowMs = Date.now();
  const primaryAppointment =
    appointments
      .filter(
        (a) =>
          (a.status === "booked" || a.status === "confirmed") &&
          new Date(a.appointment_datetime).getTime() >= nowMs,
      )
      .sort(
        (a, b) =>
          new Date(a.appointment_datetime).getTime() -
          new Date(b.appointment_datetime).getTime(),
      )[0] ??
    appointments[0] ??
    null;
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://fincasolutions.vercel.app";
  // Kurzlink bevorzugen (mobile.de-tauglich, kurz); Fallback auf Lang-URL.
  const bookingUrl = lead.booking_token
    ? `${appBaseUrl}/termin/${lead.booking_token}`
    : `${appBaseUrl}/booking/lead/${lead.id}`;

  const marge =
    lead.marktwert !== null && lead.ankaufspreis !== null
      ? lead.marktwert - lead.ankaufspreis
      : null;

  return (
    <>
      <Topbar
        title={lead.fahrzeug}
        subtitle="Details, Antworten, Ankaufspreis und Termin"
        action={
          <>
            {isCheapestInMarket(lead) && <CheapestBadge size="md" />}
            <LinkButton href="/leads" variant="ghost" size="sm">
              ← Zur Liste
            </LinkButton>
            <StatusSelector leadId={lead.id} status={lead.status} />
          </>
        }
      />

      {wasUnread && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-full bg-amber-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path
                  d="M12 9v3.5M12 16h.01M5.07 19h13.86a2 2 0 0 0 1.79-2.91l-6.93-13.5a2 2 0 0 0-3.58 0L3.28 16.09A2 2 0 0 0 5.07 19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="text-sm">
              <div className="font-semibold text-amber-900">
                Neue Antwort vom Verkäufer
              </div>
              <div className="text-amber-700">
                {lead.last_seller_message_at
                  ? `Eingegangen ${formatRelative(lead.last_seller_message_at)}`
                  : "Frisch im Posteingang"}
                {" · "}wurde jetzt als gelesen markiert
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Fahrzeug</CardTitle>
              <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                {LEAD_STATUS_LABEL[lead.status]}
              </Badge>
            </CardHeader>
            <CardBody className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Field label="Modell" value={lead.fahrzeug} />
              <Field label="Baujahr" value={lead.baujahr?.toString() ?? "—"} />
              <Field
                label="Kilometerstand"
                value={formatKm(lead.kilometerstand)}
              />
              <Field label="Getriebe" value={lead.getriebe ?? "—"} />
              <Field label="Kraftstoff" value={lead.kraftstoff ?? "—"} />
              <Field label="Erstzulassung" value={lead.erstzulassung ?? "—"} />
              <Field label="HU bis" value={lead.hu_bis ?? "—"} />
              <Field label="Farbe" value={lead.farbe ?? "—"} />
              <Field label="Standort" value={lead.ort ?? "—"} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Konversation</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <MessagesLive
                leadId={lead.id}
                verkaeuferName={lead.verkaeufer_name}
                initialMessages={messages}
                sendMessageAction={sendMessage}
                bookingUrl={bookingUrl}
                ankaufspreis={lead.ankaufspreis}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Termin</CardTitle>
            </CardHeader>
            <CardBody>
              <AppointmentPanel
                leadId={lead.id}
                bookingUrl={bookingUrl}
                sellerName={lead.verkaeufer_name}
                appointment={primaryAppointment}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notizen</CardTitle>
            </CardHeader>
            <CardBody>
              <NotesCard leadId={lead.id} initialNotes={lead.notes} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verlauf</CardTitle>
            </CardHeader>
            <CardBody>
              {activities.length === 0 ? (
                <p className="text-sm text-ink-500">
                  Noch keine Einträge — Aktionen wie Terminbuchungen erscheinen
                  hier automatisch.
                </p>
              ) : (
                <ol className="space-y-3">
                  {activities.map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-ink-900">{a.message}</p>
                        <p className="text-xs text-ink-400">
                          {formatRelative(a.created_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Einkaufspotenzial</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 text-sm">
              <Field label="Verkäuferpreis" value={formatEuro(lead.angebot_preis)} />
              <Field label="Marktwert" value={formatEuro(lead.marktwert)} />
              <Field
                label="Ihr Ankaufspreis"
                value={formatEuro(lead.ankaufspreis)}
                highlight
              />
              {marge !== null && (
                <Field label="Erwartete Marge" value={formatEuro(marge)} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quelle</CardTitle>
            </CardHeader>
            <CardBody className="text-sm space-y-2">
              <Field label="Kampagne" value={campaignName ?? "—"} />
              <Field label="Eingegangen" value={formatRelative(lead.created_at)} />
              <Field label="Quelle" value={lead.quelle ?? "—"} />
              <Field label="Inserat-ID" value={lead.external_id ?? "—"} />
              {lead.inserat_url && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-ink-500">Inserat</span>
                  <a
                    href={lead.inserat_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-700 hover:underline truncate max-w-[60%]"
                  >
                    Original öffnen ↗
                  </a>
                </div>
              )}
            </CardBody>
          </Card>

          {lead.bot_meta && (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Bot-Auswertung</CardTitle>
                {lead.bot_meta.comparison_url && (
                  <a
                    href={lead.bot_meta.comparison_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-900 hover:underline"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-3.5 w-3.5"
                      aria-hidden
                    >
                      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="m20 20-3-3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Vergleichs-Suche ↗
                  </a>
                )}
              </CardHeader>
              <CardBody className="text-sm space-y-2">
                {lead.bot_meta.pricing_mode && (
                  <Field
                    label="Preisfindung"
                    value={lead.bot_meta.pricing_mode}
                  />
                )}
                {lead.bot_meta.comparison_meta?.confidence && (
                  <Field
                    label="Confidence"
                    value={String(lead.bot_meta.comparison_meta.confidence)}
                  />
                )}
                {lead.bot_meta.comparison_meta?.market_anchor_price != null && (
                  <Field
                    label="Marktanker"
                    value={formatEuro(
                      Number(lead.bot_meta.comparison_meta.market_anchor_price),
                    )}
                  />
                )}
                {lead.bot_meta.comparison_meta?.lowest_market_price != null && (
                  <Field
                    label="Günstigster Markt"
                    value={formatEuro(
                      Number(lead.bot_meta.comparison_meta.lowest_market_price),
                    )}
                  />
                )}
                {lead.bot_meta.comparison_meta?.private_price_count != null && (
                  <Field
                    label="Privatanzeigen"
                    value={String(
                      lead.bot_meta.comparison_meta.private_price_count,
                    )}
                  />
                )}
                {lead.bot_meta.comparison_meta?.dealer_price_count != null && (
                  <Field
                    label="Händleranzeigen"
                    value={String(
                      lead.bot_meta.comparison_meta.dealer_price_count,
                    )}
                  />
                )}
                {Array.isArray(lead.bot_meta.comparison_prices_used) &&
                  lead.bot_meta.comparison_prices_used.length > 0 && (
                    <div className="pt-2">
                      <p className="text-ink-500 mb-1">Vergleichspreise</p>
                      <div className="flex flex-wrap gap-1">
                        {lead.bot_meta.comparison_prices_used.map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-ink-100 text-xs font-mono"
                          >
                            {formatEuro(Number(p))}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
      <span className="text-ink-500">{label}</span>
      <span
        className={`font-medium ${
          highlight ? "text-brand-800 text-base" : "text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

