import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingLine, PageHeader, PrimaryLink } from "@/components/page-header";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/supabase/user";
import { SUMMARY_COLUMNS, toSummary } from "@/lib/invoices/types";
import { InvoiceTable } from "./invoice-table";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.invoices.title };
}

export default async function InvoicesPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.invoices.title}
        action={<PrimaryLink href="/invoices/new">{t.invoices.newInvoice}</PrimaryLink>}
      />
      <Suspense fallback={<LoadingLine />}>
        <InvoiceList />
      </Suspense>
    </>
  );
}

async function InvoiceList() {
  const [{ supabase }, { t }] = await Promise.all([requireUser(), getI18n()]);
  const { data, error } = await supabase
    .from("invoice_summaries")
    .select(SUMMARY_COLUMNS)
    .order("issue_date", { ascending: false })
    .order("number", { ascending: false });

  if (error) return <p role="alert" className="text-destructive">{t.invoices.loadError}</p>;
  const invoices = (data ?? []).map(toSummary);
  if (invoices.length === 0) {
    return <p className="text-ink-soft">{t.invoices.empty}</p>;
  }
  return <InvoiceTable invoices={invoices} />;
}
