"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/i18n/message";
import { getRequestI18n } from "@/i18n/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/redirect";
import { isDemoUser } from "@/lib/supabase/user";
import type { FormState } from "@/lib/auth/types";

const MIN_PASSWORD = 8;

function readEmail(formData: FormData) {
  return String(formData.get("email") ?? "").trim().toLowerCase();
}

// Adresse du site, pour les liens envoyés par email (local, puis Vercel).
async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  const { t } = await getRequestI18n();
  const m = t.auth.messages;

  if (!email) return { error: m.enterEmail, email };
  if (password.length < MIN_PASSWORD) {
    return { error: fmt(m.passwordTooShort, { min: MIN_PASSWORD }), email };
  }
  // Vérifié aussi côté serveur : la case « J'accepte » ne suffit pas à elle seule.
  if (formData.get("terms") !== "on") {
    return { error: m.acceptTerms, email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/dashboard`,
      // Date d'acceptation gardée dans le compte (auth.users.raw_user_meta_data).
      data: { terms_accepted_at: new Date().toISOString() },
    },
  });
  if (error) return { error: authErrorMessage(error, t), email };

  // Confirmation par email désactivée : la session est ouverte tout de suite.
  if (data.session) redirect("/dashboard");

  // Même message si l'adresse a déjà un compte : on ne révèle pas qui est inscrit.
  return { message: fmt(m.checkEmail, { email }) };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");
  const { t } = await getRequestI18n();

  if (!email || !password) return { error: t.auth.messages.enterEmailPassword, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error, t), email };

  redirect(safeNext(formData.get("next")));
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readEmail(formData);
  const { t } = await getRequestI18n();
  if (!email) return { error: t.auth.messages.enterEmail, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  // Seule la limite d'envoi est signalée ; sinon, même réponse que le compte existe ou non.
  if (error?.code === "over_email_send_rate_limit") return { error: authErrorMessage(error, t), email };

  return { message: fmt(t.auth.messages.resetSent, { email }) };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const { t } = await getRequestI18n();
  const m = t.auth.messages;

  if (password.length < MIN_PASSWORD) {
    return { error: fmt(m.passwordTooShort, { min: MIN_PASSWORD }) };
  }
  if (password !== confirm) return { error: m.passwordsDiffer };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: m.resetExpired };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error, t) };

  redirect("/dashboard");
}

export type DemoState = { error?: string };

// Bouton « Try the demo » : session anonyme (sans email), puis espace rempli de
// données fictives par la base (seed_demo_workspace). Effacé après 24 h.
// Déjà connecté (démo ou vrai compte) : on garde la session et on ouvre l'app.
export async function startDemo(): Promise<DemoState> {
  const { locale, t } = await getRequestI18n();
  const m = t.auth.messages;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("[demo] sign-in", error);
      return { error: error.code === "over_request_rate_limit" ? m.demoRateLimit : m.demoUnavailable };
    }
  }
  if (!user || isDemoUser(user)) {
    // Sans effet si l'espace est déjà rempli. Données fictives dans la langue choisie ;
    // si la base n'a pas encore la version avec p_lang (migration demo_workspace_lang
    // pas appliquée, PGRST202), on retombe sur l'ancienne, en anglais.
    let { error } = await supabase.rpc("seed_demo_workspace", { p_lang: locale });
    if (error?.code === "PGRST202") ({ error } = await supabase.rpc("seed_demo_workspace"));
    if (error) {
      console.error("[demo] seed", error);
      return { error: m.demoUnavailable };
    }
  }
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  // Quitter la démo ramène à l'accueil (l'espace sera effacé au bout de 24 h).
  redirect(isDemoUser(user) ? "/" : "/login");
}
