import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { AuthCard } from "../auth-card";
import { ForgotForm } from "./forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.forgot.title };
}

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  const text = t.auth.forgot;
  return (
    <AuthCard title={text.title} intro={text.intro} footer={<Link href="/login">{text.back}</Link>}>
      <ForgotForm />
    </AuthCard>
  );
}
