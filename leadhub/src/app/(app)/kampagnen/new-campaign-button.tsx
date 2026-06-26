"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createCampaign, type CampaignFormState } from "./actions";

export function NewCampaignButton() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<CampaignFormState, FormData>(
    createCampaign,
    {},
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Close on success
  useEffect(() => {
    if (state && !state.error && open && state !== undefined) {
      // Note: nur schliessen, wenn Form wirklich abgesendet wurde — wir setzen
      // das ueber pending im Submit-Button. Einfach genug: nach success-Toast
      // koennte man hier schliessen — fuers Erste lassen wir es offen.
    }
  }, [state, open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Neue Kampagne</Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="rounded-xl p-0 backdrop:bg-ink-900/50 backdrop:backdrop-blur-sm w-full max-w-md"
      >
        <form action={formAction} className="bg-white">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Neue Kampagne</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink-400 hover:text-ink-700 text-xl leading-none"
              aria-label="Schliessen"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-ink-700 mb-1.5"
              >
                Name *
              </label>
              <input
                id="name"
                name="name"
                required
                placeholder="z. B. Premium-Kombis"
                className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="beschreibung"
                className="block text-sm font-medium text-ink-700 mb-1.5"
              >
                Beschreibung
              </label>
              <textarea
                id="beschreibung"
                name="beschreibung"
                rows={3}
                placeholder="Welche Fahrzeuge soll diese Kampagne finden?"
                className="w-full px-3 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            {state.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {state.error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Abbrechen
            </Button>
            <Submit onSuccess={() => setOpen(false)} />
          </div>
        </form>
      </dialog>
    </>
  );
}

function Submit({ onSuccess }: { onSuccess: () => void }) {
  const { pending } = useFormStatus();
  // when pending transitions from true -> false without error, the parent
  // re-renders with new state; closing the dialog is handled by user click.
  return (
    <Button type="submit" disabled={pending} onClick={() => onSuccess}>
      {pending ? "Speichere …" : "Anlegen"}
    </Button>
  );
}
