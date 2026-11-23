import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PrimaryLink } from "@/components/page-header";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { fmt, plural } from "@/i18n/message";
import { getI18n } from "@/i18n/server";
import { formatMoney, todayIso } from "@/lib/format";
import { FREE_MONTHLY_INVOICES } from "@/lib/plan";
import { requireUser } from "@/lib/supabase/user";
import { SUMMARY_COLUMNS, toSummary, type InvoiceSummary } from "@/lib/invoices/types";
import { InvoiceTable } from "../invoices/invoice-table";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.title };
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingLine />}>
      <Dashboard />
    </Suspense>
  );
}

// Mois (AAAA-MM) d'un horodatage, à l'heure de Paris.
const parisMonth = (ts: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(ts)).slice(0, 7);

function dashboardTotals(invoices: InvoiceSummary[], month: string) {
  let paidThisMonth = 0;
  let pending = 0;
  let overdue = 0;
  let overdueCount = 0;
  for (const inv of invoices) {
    if (inv.status === "paid" && inv.paid_at && parisMonth(inv.paid_at) === month) paidThisMonth += inv.total_cents;
    if (inv.display_status === "sent") pending += inv.total_cents;
    if (inv.display_status === "overdue") {
      overdue += inv.total_cents;
      overdueCount++;
    }
  }
  return { paidThisMonth, pending, overdue, overdueCount };
}

async function Dashboard() {
  const [{ supabase, user }, { locale, t }] = await Promise.all([requireUser(), getI18n()]);
  const d = t.dashboard;
  const now = new Date();
  // Même mois que la limite du plan gratuit dans la base (mois calendaire UTC).
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const [{ data: rows, error }, { count: createdThisMonth }, { data: profile }] = await Promise.all([
    supabase
      .from("invoice_summaries")
      .select(SUMMARY_COLUMNS)
      .order("issue_date", { ascending: false })
      .order("number", { ascending: false }),
    supabase.from("invoices").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    supabase.from("profiles").select("plan, company_name").eq("id", user.id).single(),
  ]);

  if (error) return <p role="alert" className="text-destructive">{d.loadError}</p>;
  const invoices = (rows ?? []).map(toSummary);
  const totals = dashboardTotals(invoices, todayIso().slice(0, 7));
  const monthTitle = new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(now);

  return (
    <>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl first-letter:uppercase sm:text-4xl">{monthTitle}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.plan === "pro"
              ? d.proPlan
              : fmt(d.freePlan, {
                  used: Math.min(createdThisMonth ?? 0, FREE_MONTHLY_INVOICES),
                  limit: FREE_MONTHLY_INVOICES,
                })}
          </p>
          {profile && !profile.company_name ? (
            <p className="mt-1 text-ink-soft">
              {d.addDetailsBefore} <Link href="/settings">{d.addDetailsLink}</Link>
              {d.addDetailsAfter}
            </p>
          ) : null}
        </div>
        <PrimaryLink href="/invoices/new">{d.newInvoice}</PrimaryLink>
      </div>

      {/* Trois montants côte à côte, séparés par des filets verticaux (DESIGN.md). */}
      <div className="mb-12 flex flex-wrap border-t border-b border-t-rule-strong border-b-border">
        <Amount label={d.received} cents={totals.paidThisMonth} locale={locale} first />
        <Amount label={d.pending} cents={totals.pending} locale={locale} />
        <Amount
          label={
            totals.overdueCount
              ? `${d.overdue} · ${plural(locale, totals.overdueCount, d.overdueCount)}`
              : d.overdue
          }
          locale={locale}
          cents={totals.overdue}
          alert={totals.overdueCount > 0}
        />
      </div>

      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl">{d.latest}</h2>
        {invoices.length > 0 ? <Link href="/invoices">{d.all}</Link> : null}
      </div>
      {invoices.length > 0 ? (
        <InvoiceTable invoices={invoices.slice(0, 5)} />
      ) : (
        <p className="border-t border-rule-strong pt-4 text-ink-soft">
          {d.emptyBefore} <Link href="/clients/new">{d.emptyLink}</Link>
          {d.emptyAfter}
        </p>
      )}
    </>
  );
}

function Amount({
  label,
  cents,
  locale,
  first,
  alert,
}: {
  label: string;
  cents: number;
  locale: Locale;
  first?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`flex-[1_1_240px] py-5 ${first ? "pr-6" : "border-border px-0 max-sm:border-t sm:border-l sm:px-6"}`}
    >
      <div className={alert ? "font-semibold text-destructive" : "text-muted-foreground"}>{label}</div>
      <div className={`font-heading text-4xl tabular-nums ${alert ? "text-destructive" : ""}`}>{formatMoney(cents, locale)}</div>
    </div>
  );
}
