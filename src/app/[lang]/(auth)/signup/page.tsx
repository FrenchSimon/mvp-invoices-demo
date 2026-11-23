import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { AuthCard } from "../auth-card";
import { SignupForm } from "./signup-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signup.title };
}

export default async function SignupPage() {
  const { t } = await getI18n();
  const text = t.auth.signup;
  return (
    <AuthCard
      title={text.title}
      intro={text.intro}
      footer={
        <p>
          {text.haveAccount} <Link href="/login">{text.login}</Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
