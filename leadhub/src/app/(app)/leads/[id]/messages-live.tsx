"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LeadMessage } from "@/lib/database.types";

type Props = {
  leadId: string;
  verkaeuferName: string | null;
  initialMessages: LeadMessage[];
  sendMessageAction: (formData: FormData) => Promise<void>;
  bookingUrl?: string | null;
  ankaufspreis?: number | null;
};

function buildBookingMessage(bookingUrl: string): string {
  return (
    "Gerne, dann lassen Sie uns den Ankauf kurz abstimmen.\n\n" +
    "Sie können hier direkt einen passenden Termin auswählen:\n\n" +
    `${bookingUrl}\n\n` +
    "Nach der Buchung sehen wir den Termin direkt im System und können " +
    "den Ankauf verbindlich mit Ihnen besprechen.\n\n" +
    "Viele Grüße"
  );
}

// Haupt-Antwort: Richtpreis + Ablauf + Online-Terminbuchung + Kontakt.
// Preis und Buchungslink werden automatisch pro Fahrzeug eingesetzt.
function buildMainReplyTemplate(
  bookingUrl: string,
  ankaufspreis: number | null | undefined,
): string {
  const preis =
    ankaufspreis != null && Number.isFinite(Number(ankaufspreis))
      ? new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 }).format(
          Number(ankaufspreis),
        )
      : "[PREIS EINTRAGEN]";

  return `Hallo und vielen Dank für Ihre Rückmeldung.

Ihr Fahrzeug ist für uns grundsätzlich interessant. Auf Basis der Inseratsangaben können wir Ihnen vorab folgenden unverbindlichen Richtpreis nennen:

Richtpreis: ${preis} €
(gültig für 5 Tage)

Der Preis basiert auf den aktuell bekannten Fahrzeugdaten, der Marktlage und der Nachfrage. Die endgültige Bewertung erfolgt bei uns vor Ort nach kurzer Sichtprüfung des Fahrzeugs.

Wir sind eine feste Ankaufstation und prüfen Fahrzeuge direkt bei uns am Standort. Das hat für Sie den Vorteil, dass wir den Zustand gemeinsam transparent anschauen, offene Fragen direkt klären und bei Einigung die Abwicklung sofort durchführen können.

So läuft der Ankauf bei uns ab:
Sie kommen mit dem Fahrzeug zu uns, wir prüfen kurz Zustand, Ausstattung, Historie und Unterlagen. Wenn alles zu den Angaben passt, können wir den Ankauf direkt abschließen. Die Bezahlung erfolgt sicher und nachvollziehbar vor Ort — je nach Vereinbarung per Echtzeitüberweisung oder Banküberweisung. Selbstverständlich erhalten Sie einen ordentlichen Kaufvertrag und eine saubere Abwicklung.

Für Sie bedeutet das:
- keine langen Preisverhandlungen mit Privatkäufern
- kein Risiko mit unseriösen Interessenten
- schnelle Entscheidung vor Ort
- sichere Bezahlung
- professionelle Abwicklung durch einen Händler
- auf Wunsch Unterstützung bei Abmeldung und Unterlagen

Bitte bringen Sie zur Besichtigung nach Möglichkeit Fahrzeugschein, Fahrzeugbrief, Serviceunterlagen, beide Schlüssel und vorhandene Rechnungen mit.

Ihren Wunschtermin zur Fahrzeugprüfung können Sie ganz bequem direkt online buchen:
${bookingUrl}

Alternativ erreichen Sie uns auch telefonisch oder per WhatsApp:
Tel.: 0176 11199111
Mo–Fr: 08:00–18:00 Uhr
Sa: 08:00–13:00 Uhr

A.G. Automobile eGbR
Robert-Bosch-Straße 4
64319 Pfungstadt

Mit freundlichen Grüßen
A.G. Automobile eGbR`;
}

const QUICK_REPLIES: string[] = [
  "Hallo, ist das Fahrzeug noch verfügbar?",
  "Können Sie mir noch weitere Bilder zukommen lassen?",
  "Mein Angebot bleibt bestehen. Bei Interesse melden Sie sich gerne.",
  "Können wir kurz telefonieren? Tel: 01702333592",
  "Vielen Dank für Ihre Rückmeldung — ich melde mich wieder.",
];

export function MessagesLive({
  leadId,
  verkaeuferName,
  initialMessages,
  sendMessageAction,
  bookingUrl,
  ankaufspreis,
}: Props) {
  const [messages, setMessages] = useState<LeadMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lead-messages-${leadId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lead_messages",
          filter: `lead_id=eq.${leadId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, router]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(200, ta.scrollHeight) + "px";
  }, [text]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function applyTemplate(t: string) {
    setText(t);
    setShowTemplates(false);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-9 w-9 rounded-full bg-ink-100 text-ink-700 font-semibold text-sm">
            {(verkaeuferName?.[0] ?? "V").toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-ink-900 text-sm">
              {verkaeuferName ?? "Verkäufer"}
            </h3>
            <p className="text-xs text-ink-500">
              {messages.length} Nachricht{messages.length === 1 ? "" : "en"}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live
        </span>
      </div>

      <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-10">
            Noch keine Nachrichten zu diesem Lead.
          </p>
        ) : (
          messages.map((m) => (
            <Message
              key={m.id}
              from={
                m.von === "haendler"
                  ? "Sie"
                  : `${verkaeuferName ?? "Verkäufer"}`
              }
              time={formatRelative(m.created_at)}
              text={m.text}
              mine={m.von === "haendler"}
              status={m.delivery_status}
              failureReason={m.failure_reason}
            />
          ))
        )}
      </div>

      <div className="border-t border-ink-100 pt-3">
        {bookingUrl && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setText(buildMainReplyTemplate(bookingUrl, ankaufspreis));
                setShowTemplates(false);
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-brand-700 text-sm font-medium text-white hover:bg-brand-800 transition-colors shadow-sm"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="m12 2 2.9 6.26L21 9.27l-4.5 4.38L17.8 20 12 16.77 6.2 20l1.3-6.35L3 9.27l6.1-1.01L12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
              Haupt-Antwort (Richtpreis + Termin)
            </button>
            <button
              type="button"
              onClick={() => {
                setText(buildBookingMessage(bookingUrl));
                setShowTemplates(false);
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-brand-200 bg-brand-50 text-sm font-medium text-brand-800 hover:bg-brand-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Nur Terminlink
            </button>
            <span className="text-[11px] text-ink-400">
              Preis + Buchungslink werden automatisch eingesetzt — prüfen, dann „Senden“
            </span>
          </div>
        )}
        {showTemplates && (
          <div className="mb-2 grid gap-1.5">
            <p className="text-xs font-medium text-ink-500 mb-1">
              Schnellantworten
            </p>
            {QUICK_REPLIES.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(q)}
                className="text-left text-sm px-3 py-2 rounded-lg border border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 text-ink-700"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          ref={formRef}
          action={async (fd) => {
            const value = text.trim();
            if (!value) return;
            fd.set("text", value);
            await sendMessageAction(fd);
            setText("");
            formRef.current?.reset();
          }}
          className="flex flex-col gap-2"
        >
          <input type="hidden" name="lead_id" value={leadId} />
          <input type="hidden" name="text" value={text} />

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setShowTemplates((v) => !v)}
              className={`shrink-0 h-10 w-10 rounded-lg border transition-colors grid place-items-center ${
                showTemplates
                  ? "bg-brand-50 border-brand-300 text-brand-700"
                  : "bg-white border-ink-200 text-ink-500 hover:bg-ink-50"
              }`}
              title="Schnellantworten"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
                <path
                  d="M7 7h10M7 12h7M7 17h10M3 7h0M3 12h0M3 17h0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Antwort an ${verkaeuferName ?? "Verkäufer"} schreiben …`}
              rows={1}
              className="flex-1 px-3 py-2.5 rounded-lg border border-ink-200 bg-white text-sm resize-none focus:border-brand-500 focus:outline-none min-h-[44px]"
            />

            <button
              type="submit"
              disabled={!text.trim()}
              className="shrink-0 h-10 px-4 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>Senden</span>
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
                <path
                  d="M3 12 21 3l-7 18-3-7-8-2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-ink-400 px-1">
            Bot sendet automatisch via mobile.de · Strg+Enter zum schnellen Senden
          </p>
        </form>
      </div>
    </div>
  );
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `vor ${diffD} Tag${diffD === 1 ? "" : "en"}`;
  return date.toLocaleDateString("de-DE");
}

function Message({
  from,
  time,
  text,
  mine,
  status,
  failureReason,
}: {
  from: string;
  time: string;
  text: string;
  mine?: boolean;
  status?: string | null;
  failureReason?: string | null;
}) {
  const isPending = status === "pending";
  const isFailed = status === "failed";

  const bubbleBg = mine
    ? isFailed
      ? "bg-red-100 text-red-900 border border-red-200"
      : isPending
        ? "bg-brand-100 text-brand-900 border border-brand-200"
        : "bg-brand-700 text-white"
    : "bg-ink-100 text-ink-900";

  return (
    <div className={mine ? "flex justify-end gap-2" : "flex gap-2"}>
      {!mine && (
        <div className="grid place-items-center h-8 w-8 rounded-full bg-ink-200 text-ink-700 text-xs font-semibold shrink-0">
          {from[0]?.toUpperCase() ?? "V"}
        </div>
      )}
      <div className="max-w-md">
        <div
          className={`text-[11px] mb-1 flex items-center gap-1.5 ${
            mine ? "justify-end" : ""
          } text-ink-500`}
        >
          <span className="font-medium text-ink-700">{from}</span>
          <span>·</span>
          <span>{time}</span>
        </div>
        <div
          className={[
            "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm",
            bubbleBg,
          ].join(" ")}
        >
          {text}
          {isFailed && failureReason && (
            <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-700">
              Grund: {failureReason}
            </div>
          )}
        </div>
        {mine && (
          <div className="flex justify-end mt-1 text-[11px] gap-1">
            {isPending && (
              <span className="inline-flex items-center gap-1 text-brand-700">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 animate-pulse" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                wartet auf Bot
              </span>
            )}
            {status === "sent" && (
              <span className="inline-flex items-center gap-1 text-green-700" title="Erfolgreich gesendet">
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden>
                  <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                gesendet
              </span>
            )}
            {isFailed && (
              <span className="inline-flex items-center gap-1 text-red-700" title={failureReason ?? ""}>
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden>
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                fehlgeschlagen
              </span>
            )}
          </div>
        )}
      </div>
      {mine && (
        <div className="grid place-items-center h-8 w-8 rounded-full bg-brand-700 text-white text-xs font-semibold shrink-0">
          {from[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}
