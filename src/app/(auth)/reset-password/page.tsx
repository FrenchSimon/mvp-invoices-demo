import type { Metadata } from "next";
import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "New password" };

// On arrive ici par le lien du mail « Mot de passe oublié » : /auth/confirm a déjà
// ouvert la session. L'action vérifie la session avant de changer le mot de passe.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="New password" intro="Choose a new password for your account.">
      <ResetForm />
    </AuthCard>
  );
}
