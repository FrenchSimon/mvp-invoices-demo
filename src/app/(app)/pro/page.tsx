import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingLine, PageHeader } from "@/components/page-header";
import { FREE_MONTHLY_INVOICES, getPlanUsage } from "@/lib/plan";
import { syncPlanFromStripe } from "@/lib/stripe/server";
import { requireUser } from "@/lib/supabase/user";
import { CheckoutButton, PortalButton } from "./pro-buttons";

export const metadata: Metadata = { title: "Formule Pro" };

// Ce que chaque formule permet (checklist, points 8 à 10).
const ROWS = [
  { label: "Factures par mois", free: `${FREE_MONTHLY_INVOICES}`, pro: "Illimitées" },
  { label: "PDF et envoi par email", free: "Oui", pro: "Oui" },
  { label: "Votre logo sur le PDF", free: "Non", pro: "Oui" },
  { label: "Prix", free: "Gratuit", pro: "9 € par mois" },
] as const;

export default function ProPage({ searchParams }: PageProps<"/pro">) {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingLine />}>
        <Pro searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Pro({ searchParams }: { searchParams: PageProps<"/pro">["searchParams"] }) {
  const { paiement } = await searchParams;
  const { supabase, user } = await requireUser();

  // Retour de la page de paiement : on n'attend pas le webhook, on demande
  // directement à Stripe où en est l'abonnement.
  let justPaid = false;
  if (paiement === "ok") {
    const { data } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
    if (data?.stripe_customer_id) {
      try {
        justPaid = (await syncPlanFromStripe(data.stripe_customer_id)) === "pro";
      } catch (error) {
        console.error("[pro] sync", error);
      }
    }
  }

  const usage = await getPlanUsage(supabase, user.id);
  const isPro = usage.plan === "pro";

  return (
    <>
      <PageHeader
        title={isPro ? "Votre formule Pro" : "Passer à Pro"}
        intro={
          isPro
            ? "Factures illimitées et logo sur vos PDF."
            : `Ce mois-ci : ${Math.min(usage.usedThisMonth, FREE_MONTHLY_INVOICES)} facture${usage.usedThisMonth > 1 ? "s" : ""} sur ${FREE_MONTHLY_INVOICES} avec la formule gratuite.`
        }
      />

      {justPaid ? (
        <p role="status" className="mb-6 rounded-md bg-status-paid px-3 py-2 text-status-paid-foreground">
          Paiement reçu : vous êtes en Pro. Merci !
        </p>
      ) : null}
      {paiement === "ok" && !isPro ? (
        <p role="status" className="mb-6 text-ink-soft">
          Le paiement est en cours de confirmation. Rechargez la page dans un instant.
        </p>
      ) : null}

      <table className="mb-8 w-full border-t border-rule-strong text-left">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="py-3 pr-4 font-semibold">
              <span className="sr-only">Fonction</span>
            </th>
            <th className="py-3 pr-4 font-semibold">Gratuite{isPro ? "" : " (la vôtre)"}</th>
            <th className="py-3 font-semibold">Pro{isPro ? " (la vôtre)" : ""}</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border">
              <th scope="row" className="py-3 pr-4 font-normal text-ink-soft">
                {row.label}
              </th>
              <td className="py-3 pr-4">{row.free}</td>
              <td className="py-3 font-semibold">{row.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {isPro ? (
        <>
          <PortalButton />
          <p className="mt-4 text-sm text-muted-foreground">
            Changer de carte, voir vos reçus ou résilier : tout se fait sur la page sécurisée de Stripe.
          </p>
        </>
      ) : (
        <>
          <CheckoutButton />
          <p className="mt-4 text-sm text-muted-foreground">
            Paiement par carte sur la page sécurisée de Stripe. Sans engagement : résiliable à tout moment.
          </p>
        </>
      )}
    </>
  );
}
