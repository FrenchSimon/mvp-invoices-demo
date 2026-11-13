import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PrimaryLink } from "@/components/page-header";
import { formatMoney, todayIso } from "@/lib/format";
import { requireUser } from "@/lib/supabase/user";
import { SUMMARY_COLUMNS, toSummary, type InvoiceSummary } from "@/lib/invoices/types";
import { InvoiceTable } from "../invoices/invoice-table";

export const metadata: Metadata = { title: "Tableau de bord" };

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
  const { supabase, user } = await requireUser();
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

  if (error) return <p role="alert" className="text-destructive">Le tableau de bord n&apos;a pas pu être chargé.</p>;
  const invoices = (rows ?? []).map(toSummary);
  const totals = dashboardTotals(invoices, todayIso().slice(0, 7));
  const monthTitle = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(now);

  return (
    <>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl first-letter:uppercase sm:text-4xl">{monthTitle}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.plan === "pro"
              ? "Formule Pro · factures illimitées"
              : `Formule gratuite · ${Math.min(createdThisMonth ?? 0, 3)} facture${(createdThisMonth ?? 0) > 1 ? "s" : ""} sur 3 ce mois-ci`}
          </p>
          {profile && !profile.company_name ? (
            <p className="mt-1 text-ink-soft">
              Avant votre première facture, <Link href="/settings">indiquez vos coordonnées</Link>.
            </p>
          ) : null}
        </div>
        <PrimaryLink href="/invoices/new">Nouvelle facture</PrimaryLink>
      </div>

      {/* Trois montants côte à côte, séparés par des filets verticaux (DESIGN.md). */}
      <div className="mb-12 flex flex-wrap border-t border-b border-t-rule-strong border-b-border">
        <Amount label="Encaissé ce mois-ci" cents={totals.paidThisMonth} first />
        <Amount label="En attente" cents={totals.pending} />
        <Amount
          label={`En retard${totals.overdueCount ? ` · ${totals.overdueCount} facture${totals.overdueCount > 1 ? "s" : ""}` : ""}`}
          cents={totals.overdue}
          alert={totals.overdueCount > 0}
        />
      </div>

      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl">Dernières factures</h2>
        {invoices.length > 0 ? <Link href="/invoices">Toutes les factures</Link> : null}
      </div>
      {invoices.length > 0 ? (
        <InvoiceTable invoices={invoices.slice(0, 5)} />
      ) : (
        <p className="border-t border-rule-strong pt-4 text-ink-soft">
          Aucune facture pour l&apos;instant. Commencez par <Link href="/clients/new">ajouter un client</Link>.
        </p>
      )}
    </>
  );
}

function Amount({ label, cents, first, alert }: { label: string; cents: number; first?: boolean; alert?: boolean }) {
  return (
    <div
      className={`flex-[1_1_240px] py-5 ${first ? "pr-6" : "border-border px-0 max-sm:border-t sm:border-l sm:px-6"}`}
    >
      <div className={alert ? "font-semibold text-destructive" : "text-muted-foreground"}>{label}</div>
      <div className={`font-heading text-4xl tabular-nums ${alert ? "text-destructive" : ""}`}>{formatMoney(cents)}</div>
    </div>
  );
}
