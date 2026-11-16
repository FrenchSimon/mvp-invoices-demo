import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create an account"
      intro="Free for 3 invoices a month. No credit card."
      footer={
        <p>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
