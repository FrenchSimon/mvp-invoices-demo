import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password"
      intro="Enter your email and we'll send you a link to choose a new password."
      footer={<Link href="/login">Back to log in</Link>}
    >
      <ForgotForm />
    </AuthCard>
  );
}
