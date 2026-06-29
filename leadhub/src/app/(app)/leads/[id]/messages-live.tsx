"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { LeadMessage } from "@/lib/database.types";

type Props = {
  leadId: string;
  verkaeuferName: string | null;
  initialMessages: LeadMessage[];
  sendMessageAction: (formData: FormData) => Promise<void>;
};

export function MessagesLive({
  leadId,
  verkaeuferName,
  initialMessages,
  sendMessageAction,
}: Props) {
  const [messages, setMessages] = useState<LeadMessage[]>(initialMessages);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

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
          // Server-Component soll Daten neu laden — das ist der einzige
          // Weg an die Daten zu kommen, die durch RLS gefiltert sind.
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId, router]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-ink-700 text-sm">
          {messages.length === 0
            ? "Noch keine Nachrichten"
            : `${messages.length} Nachricht${messages.length === 1 ? "" : "en"}`}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          Live
        </span>
      </div>

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
                : `Verkäufer · ${verkaeuferName ?? ""}`.trim()
            }
            time={formatRelative(m.created_at)}
            text={m.text}
            mine={m.von === "haendler"}
            status={m.delivery_status}
            failureReason={m.failure_reason}
          />
        ))
      )}

      <form
        ref={formRef}
        action={async (fd) => {
          await sendMessageAction(fd);
          formRef.current?.reset();
        }}
        className="pt-2 flex gap-2"
      >
        <input type="hidden" name="lead_id" value={leadId} />
        <input
          type="text"
          name="text"
          required
          placeholder="Nachricht schreiben …"
          className="flex-1 h-11 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 px-5 rounded-lg bg-brand-700 text-white text-sm font-medium hover:bg-brand-800"
        >
          Senden
        </button>
      </form>
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
    <div className={mine ? "flex justify-end" : "flex"}>
      <div
        className={[
          "max-w-md rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
          bubbleBg,
        ].join(" ")}
      >
        <div
          className={`text-xs mb-1 flex items-center gap-1.5 ${
            mine && !isPending && !isFailed
              ? "text-brand-100"
              : mine && isPending
                ? "text-brand-700"
                : mine && isFailed
                  ? "text-red-700"
                  : "text-ink-500"
          }`}
        >
          <span>
            {from} · {time}
          </span>
          {mine && isPending && (
            <span className="inline-flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3 w-3 animate-pulse"
                aria-hidden
              >
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M12 7v5l3 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              wartet auf Bot
            </span>
          )}
          {mine && status === "sent" && (
            <span className="inline-flex items-center" title="Erfolgreich gesendet">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden>
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
          {mine && isFailed && (
            <span
              className="inline-flex items-center gap-1"
              title={failureReason ?? ""}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden>
                <path
                  d="m6 6 12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              fehlgeschlagen
            </span>
          )}
        </div>
        {text}
        {isFailed && failureReason && (
          <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-700">
            Grund: {failureReason}
          </div>
        )}
      </div>
    </div>
  );
}
