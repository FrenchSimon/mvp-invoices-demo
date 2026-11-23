import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, Sheet } from "@/components/page-header";
import { fmt } from "@/i18n/message";
import { getI18n } from "@/i18n/server";
import { isDemoUser, requireUser } from "@/lib/supabase/user";
import type { Profile } from "@/lib/invoices/types";
import { LogoForm } from "./logo-form";
import { SettingsForm } from "./settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.settings.title };
}

export default async function SettingsPage() {
  const { t } = await getI18n();
  return (
    <div className="max-w-2xl">
      <PageHeader title={t.settings.title} intro={t.settings.intro} />
      <Suspense fallback={<LoadingLine />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const [{ supabase, user }, { t }] = await Promise.all([requireUser(), getI18n()]);
  const s = t.settings;
  const { data } = await supabase
    .from("profiles")
    .select("company_name, address, vat_number, email, plan, logo_path")
    .eq("id", user.id)
    .single();
  const profile = data as Profile;
  const isPro = profile.plan === "pro";
  const demo = isDemoUser(user);

  // Aperçu du logo : l'espace « logos » est privé, d'où une adresse signée (1 h).
  let logoUrl: string | null = null;
  if (profile.logo_path) {
    const { data: signed } = await supabase.storage.from("logos").createSignedUrl(profile.logo_path, 3600);
    logoUrl = signed?.signedUrl ?? null;
  }

  return (
    <>
      <Sheet>
        <SettingsForm profile={profile} />
      </Sheet>
      <Sheet className="mt-6">
        <h2 className="mb-5 font-heading text-xl">{s.logo.title}</h2>
        {isPro && demo ? (
          <>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- adresse signée temporaire
              <img src={logoUrl} alt={s.logo.current} className="mb-4 max-h-16 w-auto" />
            ) : null}
            <p className="text-ink-soft">{s.logo.demo}</p>
          </>
        ) : isPro ? (
          <LogoForm previewUrl={logoUrl} />
        ) : (
          <p className="text-ink-soft">
            {s.logo.proOnly} <Link href="/pro">{s.logo.upgrade}</Link>
          </p>
        )}
      </Sheet>
      <p className="mt-6 text-sm text-muted-foreground">
        {fmt(s.account, { account: demo ? s.demoAccount : (user.email ?? ""), plan: isPro ? t.pro.proName : t.pro.free })}{" "}
        <Link href="/pro">{isPro ? s.manage : s.upgrade}</Link>
      </p>
    </>
  );
}
