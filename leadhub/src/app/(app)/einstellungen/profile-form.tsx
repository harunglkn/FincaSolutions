"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateProfile, type ProfileState } from "./actions";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/database.types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        name="firma"
        label="Firmenname"
        defaultValue={profile.firma ?? ""}
        placeholder="z. B. Autohaus Musterstadt GmbH"
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          name="telefon"
          label="Telefon"
          defaultValue={profile.telefon ?? ""}
          placeholder="+49 …"
        />
      </div>
      <Field
        name="adresse"
        label="Adresse"
        defaultValue={profile.adresse ?? ""}
        placeholder="Strasse, PLZ Ort"
      />

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Gespeichert.
        </div>
      )}

      <Submit />
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-ink-700 mb-1.5"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Speichere …" : "Speichern"}
    </Button>
  );
}
