"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { register, type RegisterState } from "./actions";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full h-11 px-3 rounded-lg border border-ink-200 bg-white text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none";

export function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(
    register,
    {},
  );

  if (state.needsConfirmation) {
    return (
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-base font-semibold text-emerald-900">
          Fast geschafft — bitte E-Mail bestätigen
        </h2>
        <p className="mt-2 text-sm text-emerald-800">
          Wir haben eine Bestätigungs-Mail an{" "}
          <span className="font-medium">{state.email}</span> geschickt. Öffnen
          Sie die Mail und klicken Sie auf den Link — danach können Sie sich
          anmelden.
        </p>
        <p className="mt-3 text-xs text-emerald-700">
          Keine Mail erhalten? Bitte auch den Spam-Ordner prüfen.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Zur Anmeldung →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="firma"
          className="block text-sm font-medium text-ink-700 mb-1.5"
        >
          Name Ihres Autohauses
        </label>
        <input
          id="firma"
          name="firma"
          type="text"
          autoComplete="organization"
          required
          placeholder="z. B. Autohaus Muster GmbH"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-ink-700 mb-1.5"
        >
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@autohaus.de"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-ink-700 mb-1.5"
        >
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mindestens 8 Zeichen"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="passwordConfirm"
          className="block text-sm font-medium text-ink-700 mb-1.5"
        >
          Passwort wiederholen
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-600">
        <input
          type="checkbox"
          name="consent"
          value="1"
          required
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
        />
        <span>
          Ich akzeptiere die{" "}
          <Link href="/impressum" className="text-brand-700 hover:underline">
            AGB
          </Link>{" "}
          und die{" "}
          <Link href="/datenschutz" className="text-brand-700 hover:underline">
            Datenschutzerklärung
          </Link>
          .
        </span>
      </label>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {pending ? "Konto wird erstellt …" : "Konto kostenlos erstellen"}
    </Button>
  );
}
