import { notFound } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  type Lead,
  type LeadMessage,
} from "@/lib/database.types";
import { formatEuro, formatKm, formatRelative } from "@/lib/format";
import { sendMessage } from "../actions";
import { StatusSelector } from "./status-selector";

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
            <LinkButton href="/leads" variant="ghost" size="sm">
              ← Zur Liste
            </LinkButton>
            <StatusSelector leadId={lead.id} status={lead.status} />
          </>
        }
      />

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
              <CardTitle>
                Antworten des Verkäufers ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-sm text-ink-500 text-center py-6">
                  Noch keine Nachrichten zu diesem Lead.
                </p>
              ) : (
                messages.map((m) => (
                  <Message
                    key={m.id}
                    from={
                      m.von === "haendler"
                        ? "Sie"
                        : `Verkäufer · ${lead.verkaeufer_name ?? ""}`.trim()
                    }
                    time={formatRelative(m.created_at)}
                    text={m.text}
                    mine={m.von === "haendler"}
                  />
                ))
              )}
              <form action={sendMessage} className="pt-2 flex gap-2">
                <input type="hidden" name="lead_id" value={lead.id} />
                <input
                  type="text"
                  name="text"
                  required
                  placeholder="Nachricht schreiben …"
                  className="flex-1 h-11 px-3 rounded-lg border border-ink-200 bg-white text-sm"
                />
                <Button type="submit">Senden</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
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
              <CardHeader>
                <CardTitle>Bot-Auswertung</CardTitle>
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
                {lead.bot_meta.comparison_url && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 pt-1">
                    <span className="text-ink-500">Vergleichs-Suche</span>
                    <a
                      href={lead.bot_meta.comparison_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-700 hover:underline truncate max-w-[60%]"
                    >
                      Öffnen ↗
                    </a>
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

function Message({
  from,
  time,
  text,
  mine,
}: {
  from: string;
  time: string;
  text: string;
  mine?: boolean;
}) {
  return (
    <div className={mine ? "flex justify-end" : "flex"}>
      <div
        className={[
          "max-w-md rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
          mine ? "bg-brand-700 text-white" : "bg-ink-100 text-ink-900",
        ].join(" ")}
      >
        <div
          className={`text-xs mb-1 ${mine ? "text-brand-100" : "text-ink-500"}`}
        >
          {from} · {time}
        </div>
        {text}
      </div>
    </div>
  );
}
