import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingLine, PageHeader, PrimaryLink } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/user";
import { SUMMARY_COLUMNS, toSummary } from "@/lib/invoices/types";
import { InvoiceTable } from "./invoice-table";

export const metadata: Metadata = { title: "Invoices" };

export default function InvoicesPage() {
  return (
    <>
      <PageHeader title="Invoices" action={<PrimaryLink href="/invoices/new">New invoice</PrimaryLink>} />
      <Suspense fallback={<LoadingLine />}>
        <InvoiceList />
      </Suspense>
    </>
  );
}

async function InvoiceList() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("invoice_summaries")
    .select(SUMMARY_COLUMNS)
    .order("issue_date", { ascending: false })
    .order("number", { ascending: false });

  if (error) return <p role="alert" className="text-destructive">Invoices couldn&apos;t be loaded.</p>;
  const invoices = (data ?? []).map(toSummary);
  if (invoices.length === 0) {
    return <p className="text-ink-soft">No invoices yet.</p>;
  }
  return <InvoiceTable invoices={invoices} />;
}
