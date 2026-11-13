import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, Sheet } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/user";
import type { Profile } from "@/lib/invoices/types";
import { LogoForm } from "./logo-form";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Réglages" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Réglages" intro="Ces coordonnées apparaissent en haut de chaque facture." />
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
            Votre logo sur les factures PDF fait partie de la formule Pro. <Link href="/pro">Passer à Pro</Link>
          </p>
        )}
      </Sheet>
      <p className="mt-6 text-sm text-muted-foreground">
        Compte : {user.email} · Formule {isPro ? "Pro" : "gratuite"} ·{" "}
        <Link href="/pro">{isPro ? "Gérer mon abonnement" : "Passer à Pro"}</Link>
      </p>
    </>
  );
}
