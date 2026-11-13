import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      intro="Indiquez votre email : vous recevrez un lien pour choisir un nouveau mot de passe."
      footer={<Link href="/login">Retour à la connexion</Link>}
    >
      <ForgotForm />
    </AuthCard>
  );
}
