import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, Sheet } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/user";
import type { Profile } from "@/lib/invoices/types";
import { LogoForm } from "./logo-form";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" intro="These details appear at the top of every invoice." />
      <Suspense fallback={<LoadingLine />}>
        <Settings />
      </Suspense>
    </div>
  );
}

async function Settings() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("company_name, address, vat_number, email, plan, logo_path")
    .eq("id", user.id)
    .single();
  const profile = data as Profile;
  const isPro = profile.plan === "pro";

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
        <h2 className="mb-5 font-heading text-xl">Logo</h2>
        {isPro ? (
          <LogoForm previewUrl={logoUrl} />
        ) : (
          <p className="text-ink-soft">
            Your logo on PDF invoices is part of the Pro plan. <Link href="/pro">Upgrade to Pro</Link>
          </p>
        )}
      </Sheet>
      <p className="mt-6 text-sm text-muted-foreground">
        Account: {user.email} · {isPro ? "Pro" : "Free"} plan ·{" "}
        <Link href="/pro">{isPro ? "Manage my subscription" : "Upgrade to Pro"}</Link>
      </p>
    </>
  );
}
