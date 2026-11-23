import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.reset.title };
}

// On arrive ici par le lien du mail « Mot de passe oublié » : /auth/confirm a déjà
// ouvert la session. L'action vérifie la session avant de changer le mot de passe.
export default async function ResetPasswordPage() {
  const { t } = await getI18n();
  return (
    <AuthCard title={t.auth.reset.title} intro={t.auth.reset.intro}>
      <ResetForm />
    </AuthCard>
  );
}
