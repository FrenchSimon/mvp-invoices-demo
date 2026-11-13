import type { Metadata } from "next";
import { AuthCard } from "../auth-card";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

// On arrive ici par le lien du mail « Mot de passe oublié » : /auth/confirm a déjà
// ouvert la session. L'action vérifie la session avant de changer le mot de passe.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe" intro="Choisissez le mot de passe de votre compte.">
      <ResetForm />
    </AuthCard>
  );
}
