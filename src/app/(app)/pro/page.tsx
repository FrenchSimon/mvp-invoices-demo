import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingLine, PageHeader } from "@/components/page-header";
import { FREE_MONTHLY_INVOICES, getPlanUsage } from "@/lib/plan";
import { syncPlanFromStripe } from "@/lib/stripe/server";
import { requireUser } from "@/lib/supabase/user";
import { CheckoutButton, PortalButton } from "./pro-buttons";

export const metadata: Metadata = { title: "Pro plan" };

// Ce que chaque formule permet (checklist, points 8 à 10).
const ROWS = [
  { label: "Invoices per month", free: `${FREE_MONTHLY_INVOICES}`, pro: "Unlimited" },
  { label: "PDF and email sending", free: "Yes", pro: "Yes" },
  { label: "Your logo on the PDF", free: "No", pro: "Yes" },
  { label: "Price", free: "Free", pro: "€9 per month" },
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
  const { payment } = await searchParams;
  const { supabase, user } = await requireUser();

  // Retour de la page de paiement : on n'attend pas le webhook, on demande
  // directement à Stripe où en est l'abonnement.
  let justPaid = false;
  if (payment === "success") {
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
        title={isPro ? "Your Pro plan" : "Upgrade to Pro"}
        intro={
          isPro
            ? "Unlimited invoices and your logo on your PDFs."
            : `This month: ${Math.min(usage.usedThisMonth, FREE_MONTHLY_INVOICES)} of ${FREE_MONTHLY_INVOICES} invoices used on the Free plan.`
        }
      />

      {justPaid ? (
        <p role="status" className="mb-6 rounded-md bg-status-paid px-3 py-2 text-status-paid-foreground">
          Payment received: you&apos;re on Pro. Thank you!
        </p>
      ) : null}
      {payment === "success" && !isPro ? (
        <p role="status" className="mb-6 text-ink-soft">
          Your payment is being confirmed. Reload the page in a moment.
        </p>
      ) : null}

      <table className="mb-8 w-full border-t border-rule-strong text-left">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="py-3 pr-4 font-semibold">
              <span className="sr-only">Feature</span>
            </th>
            <th className="py-3 pr-4 font-semibold">Free{isPro ? "" : " (yours)"}</th>
            <th className="py-3 font-semibold">Pro{isPro ? " (yours)" : ""}</th>
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
            Change your card, see your receipts or cancel: it all happens on Stripe&apos;s secure page.
          </p>
        </>
      ) : (
        <>
          <CheckoutButton />
          <p className="mt-4 text-sm text-muted-foreground">
            Card payment on Stripe&apos;s secure page. No commitment: cancel anytime.
          </p>
        </>
      )}
    </>
  );
}
