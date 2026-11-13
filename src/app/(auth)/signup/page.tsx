import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Créer un compte"
      intro="Gratuit pour 3 factures par mois. Sans carte bancaire."
      footer={
        <p>
          Déjà un compte ? <Link href="/login">Se connecter</Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
