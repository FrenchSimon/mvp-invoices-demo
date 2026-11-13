"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { safeNext } from "@/lib/auth/redirect";
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

  if (!email) return { error: "Indiquez votre adresse email.", email };
  if (password.length < MIN_PASSWORD) {
    return { error: `Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères.`, email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/dashboard` },
  });
  if (error) return { error: authErrorMessage(error), email };

  // Confirmation par email désactivée : la session est ouverte tout de suite.
  if (data.session) redirect("/dashboard");

  // Même message si l'adresse a déjà un compte : on ne révèle pas qui est inscrit.
  return {
    message: `Presque fini : ouvrez le lien envoyé à ${email} pour activer votre compte.`,
  };
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Indiquez votre email et votre mot de passe.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error), email };

  redirect(safeNext(formData.get("next")));
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = readEmail(formData);
  if (!email) return { error: "Indiquez votre adresse email.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  });
  // Seule la limite d'envoi est signalée ; sinon, même réponse que le compte existe ou non.
  if (error?.code === "over_email_send_rate_limit") return { error: authErrorMessage(error), email };

  return {
    message: `Si un compte existe pour ${email}, un lien pour choisir un nouveau mot de passe vient d'être envoyé.`,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD) {
    return { error: `Le mot de passe doit faire au moins ${MIN_PASSWORD} caractères.` };
  }
  if (password !== confirm) return { error: "Les deux mots de passe ne sont pas identiques." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Ce lien a expiré. Demandez un nouveau lien depuis « Mot de passe oublié »." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error) };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
