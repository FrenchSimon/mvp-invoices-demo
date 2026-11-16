import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Log in"
      intro="Get back to your clients and invoices."
      footer={
        <p>
          No account yet? <Link href="/signup">Create an account</Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
