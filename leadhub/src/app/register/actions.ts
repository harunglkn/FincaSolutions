"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = {
  error?: string;
  needsConfirmation?: boolean;
  email?: string;
};

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://fincasolutions.vercel.app"
).replace(/\/+$/, "");

export async function register(
  _prev: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const firma = String(formData.get("firma") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const consent = formData.get("consent");

  if (!firma) {
    return { error: "Bitte den Namen Ihres Autohauses angeben." };
  }
  if (!email) {
    return { error: "Bitte eine E-Mail-Adresse angeben." };
  }
  if (password.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." };
  }
  if (password !== passwordConfirm) {
    return { error: "Die beiden Passwörter stimmen nicht überein." };
  }
  if (!consent) {
    return {
      error: "Bitte bestätigen Sie AGB und Datenschutzerklärung.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firma },
      emailRedirectTo: `${APP_URL}/login`,
    },
  });

  if (error) {
    return { error: translateSignupError(error.message) };
  }

  // Supabase liefert zur Missbrauchs-Vermeidung auch bei bereits vergebener
  // E-Mail ein "leeres" Ergebnis (identities-Liste leer, kein Fehler).
  const alreadyRegistered =
    data.user && Array.isArray(data.user.identities) &&
    data.user.identities.length === 0;
  if (alreadyRegistered) {
    return {
      error:
        "Für diese E-Mail besteht bereits ein Konto. Bitte melden Sie sich an.",
    };
  }

  // Keine Session => E-Mail-Bestätigung ist im Projekt aktiviert.
  if (!data.session) {
    return { needsConfirmation: true, email };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

function translateSignupError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Für diese E-Mail besteht bereits ein Konto. Bitte melden Sie sich an.";
  if (m.includes("password"))
    return "Das Passwort ist zu schwach. Bitte mindestens 8 Zeichen verwenden.";
  if (m.includes("valid email") || m.includes("invalid"))
    return "Bitte eine gültige E-Mail-Adresse eingeben.";
  if (m.includes("rate limit"))
    return "Zu viele Versuche. Bitte kurz warten und erneut probieren.";
  return "Registrierung fehlgeschlagen. Bitte später erneut versuchen.";
}
