import type { Metadata } from "next";
import Link from "next/link";
import { DemoButton } from "@/components/demo-button";
import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      intro="Get back to your clients and invoices."
      footer={
        <>
          <p>
            No account yet? <Link href="/signup">Create an account</Link>
          </p>
          {/* Même action que sur l'accueil : espace de démo sans inscription. */}
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span>Just looking around?</span>
            <DemoButton className="cursor-pointer text-destructive hover:underline" />
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
