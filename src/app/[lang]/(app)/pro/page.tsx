import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingLine, PageHeader } from "@/components/page-header";
import { fmt, plural } from "@/i18n/message";
import { getI18n } from "@/i18n/server";
import { FREE_MONTHLY_INVOICES, getPlanUsage } from "@/lib/plan";
import { syncPlanFromStripe } from "@/lib/stripe/server";
import { isDemoUser, requireUser } from "@/lib/supabase/user";
import { CheckoutButton, PortalButton } from "./pro-buttons";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.pro.title };
}

export default function ProPage({ searchParams }: PageProps<"/[lang]/pro">) {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingLine />}>
        <Pro searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Pro({ searchParams }: { searchParams: PageProps<"/[lang]/pro">["searchParams"] }) {
  const { payment } = await searchParams;
  const [{ supabase, user }, { locale, t }] = await Promise.all([requireUser(), getI18n()]);
  const p = t.pro;
  // Ce que chaque formule permet (checklist, points 8 à 10).
  const rows = [
    { label: p.rows.invoices, free: `${FREE_MONTHLY_INVOICES}`, pro: p.values.unlimited },
    { label: p.rows.sending, free: p.values.yes, pro: p.values.yes },
    { label: p.rows.logo, free: p.values.no, pro: p.values.yes },
    { label: p.rows.price, free: p.values.free, pro: p.values.proPrice },
  ];

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
        title={isPro ? p.yourPro : p.upgrade}
        intro={
          isPro
            ? p.proIntro
            : fmt(plural(locale, Math.min(usage.usedThisMonth, FREE_MONTHLY_INVOICES), p.freeIntro), {
                limit: FREE_MONTHLY_INVOICES,
              })
        }
      />

      {justPaid ? (
        <p role="status" className="mb-6 rounded-md bg-status-paid px-3 py-2 text-status-paid-foreground">
          {p.justPaid}
        </p>
      ) : null}
      {payment === "success" && !isPro ? (
        <p role="status" className="mb-6 text-ink-soft">
          {p.confirming}
        </p>
      ) : null}

      <table className="mb-8 w-full border-t border-rule-strong text-left">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="py-3 pr-4 font-semibold">
              <span className="sr-only">{p.feature}</span>
            </th>
            <th className="py-3 pr-4 font-semibold">
              {p.free}
              {isPro ? "" : p.yours}
            </th>
            <th className="py-3 font-semibold">
              {p.proName}
              {isPro ? p.yours : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
            {p.manageNote}
          </p>
        </>
      ) : (
        <>
          <CheckoutButton />
          <p className="mt-4 text-sm text-muted-foreground">
            {p.checkoutNote}
          </p>
          {isDemoUser(user) ? (
            <p className="mt-4 rounded-md bg-card px-3 py-2 text-sm text-ink-soft">
              {p.demoBefore} <span className="font-semibold tabular-nums">4242 4242 4242 4242</span>
              {p.demoAfter}
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
