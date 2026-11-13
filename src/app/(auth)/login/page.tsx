import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Connexion"
      intro="Retrouvez vos clients et vos factures."
      footer={
        <p>
          Pas encore de compte ? <Link href="/signup">Créer un compte</Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
