"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createLead, type LeadFormState } from "./actions";
import { LEAD_STATUSES, LEAD_STATUS_LABEL } from "@/lib/database.types";

type Campaign = { id: string; name: string };

export function NewLeadButton({ campaigns }: { campaigns: Campaign[] }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<LeadFormState, FormData>(
    createLead,
    {},
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Neuer Lead</Button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="rounded-xl p-0 backdrop:bg-ink-900/50 backdrop:backdrop-blur-sm w-full max-w-2xl"
      >
        <form action={formAction} className="bg-white">
          <div className="px-6 py-4 border-b border-ink-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Neuer Lead</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-ink-400 hover:text-ink-700 text-xl leading-none"
              aria-label="Schliessen"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <Section title="Fahrzeug">
              <Field
                label="Fahrzeug *"
                name="fahrzeug"
                placeholder="z. B. BMW 320d Touring"
                required
                colspan={2}
              />
              <Field
                label="Baujahr"
                name="baujahr"
                type="number"
                placeholder="2020"
              />
              <Field
                label="Kilometer"
                name="kilometerstand"
                type="number"
                placeholder="89000"
              />
              <Field
                label="Getriebe"
                name="getriebe"
                placeholder="Automatik / Schaltgetriebe"
              />
              <Field
                label="Kraftstoff"
                name="kraftstoff"
                placeholder="Diesel / Benzin / Hybrid"
              />
              <Field
                label="Erstzulassung"
                name="erstzulassung"
                placeholder="04/2019"
              />
              <Field label="HU bis" name="hu_bis" placeholder="03/2026" />
              <Field label="Farbe" name="farbe" placeholder="Mineralweiss" />
            </Section>

            <Section title="Verkäufer">
              <Field
                label="Name"
                name="verkaeufer_name"
                placeholder="Vorname N."
              />
              <Field label="Ort" name="ort" placeholder="Köln" />
            </Section>

            <Section title="Preise">
              <Field
                label="Verkäuferpreis (€)"
                name="angebot_preis"
                type="number"
                placeholder="14900"
              />
              <Field
                label="Ankaufspreis (€)"
                name="ankaufspreis"
                type="number"
                placeholder="13200"
              />
            </Section>

            <Section title="Inserat & Quelle">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue="antwort_offen"
                  className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-1.5">
                  Kampagne
                </label>
                <select
                  name="campaign_id"
                  defaultValue="none"
                  className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm"
                >
                  <option value="none">— keine —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="Quelle"
                name="quelle"
                defaultValue="Direkte Anfrage"
              />
              <Field
                label="Inserat-ID"
                name="external_id"
                placeholder="mobile.de Inserat-Nr."
              />
              <Field
                label="Inserat-Link (URL)"
                name="inserat_url"
                type="url"
                placeholder="https://www.mobile.de/..."
                colspan={2}
              />
            </Section>

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
            <Submit />
          </div>
        </form>
      </dialog>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-widest font-semibold text-ink-500 mb-3">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  defaultValue,
  colspan,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  colspan?: 2;
}) {
  return (
    <div className={colspan === 2 ? "col-span-2" : undefined}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-ink-700 mb-1.5"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        defaultValue={defaultValue}
        className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Speichere …" : "Lead anlegen"}
    </Button>
  );
}
