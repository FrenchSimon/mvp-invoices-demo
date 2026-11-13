import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Tableau de bord" };

// Page provisoire : le tableau de bord complet (point 7) viendra après les factures.
export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl">Tableau de bord</h1>
      <Suspense fallback={<p className="mt-2 text-muted-foreground">Chargement…</p>}>
        <Welcome />
      </Suspense>
    </>
  );
}

async function Welcome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <p className="mt-2 text-ink-soft">Connecté avec {user.email}.</p>;
}
