import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingLine, PageHeader, Sheet } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/user";
import type { Profile } from "@/lib/invoices/types";
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
    .select("company_name, address, vat_number, email, plan")
    .eq("id", user.id)
    .single();
  const profile = data as Profile;

  return (
    <>
      <Sheet>
        <SettingsForm profile={profile} />
      </Sheet>
      <p className="mt-6 text-sm text-muted-foreground">
        Compte : {user.email} · Formule {profile.plan === "pro" ? "Pro" : "gratuite"}
      </p>
    </>
  );
}
