import type { Metadata } from "next";
import Link from "next/link";
import { DemoButton } from "@/components/demo-button";
import { getI18n } from "@/i18n/server";
import { AuthCard } from "../auth-card";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.login.title };
}

export default async function LoginPage() {
  const { t } = await getI18n();
  const text = t.auth.login;
  return (
    <AuthCard
      title={text.title}
      intro={text.intro}
      footer={
        <>
          <p>
            {text.noAccount} <Link href="/signup">{text.createAccount}</Link>
          </p>
          {/* Même action que sur l'accueil : espace de démo sans inscription. */}
          <div className="flex flex-wrap items-baseline gap-x-1">
            <span>{text.lookingAround}</span>
            <DemoButton className="cursor-pointer text-destructive hover:underline" />
          </div>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
