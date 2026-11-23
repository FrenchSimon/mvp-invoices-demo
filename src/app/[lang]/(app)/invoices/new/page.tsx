import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { BackLink, LoadingLine, PageHeader, PrimaryLink, Sheet } from "@/components/page-header";
import { fmt } from "@/i18n/message";
import { getI18n } from "@/i18n/server";
import { addDaysIso, todayIso } from "@/lib/format";
import { FREE_MONTHLY_INVOICES, getPlanUsage } from "@/lib/plan";
import { requireUser } from "@/lib/supabase/user";
import { InvoiceEditor } from "../invoice-editor";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.invoices.newInvoice };
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<LoadingLine />}>
      <NewInvoice />
    </Suspense>
  );
}

async function NewInvoice() {
  const [{ supabase, user }, { t }] = await Promise.all([requireUser(), getI18n()]);
  const text = t.invoices.new;
  const header = (
    <PageHeader title={t.invoices.newInvoice} back={{ href: "/invoices", label: t.invoices.back }} />
  );
  const [{ data }, usage] = await Promise.all([
    supabase.from("clients").select("id, name").order("name"),
    getPlanUsage(supabase, user.id),
  ]);
  const clients = data ?? [];

  // Point 8 : la 4e facture du mois est bloquée par la base ; on le dit avant
  // de faire remplir l'éditeur, et on propose Pro.
  if (usage.limitReached) {
    return (
      <>
        {header}
        <p className="mb-2 text-ink-soft">{fmt(text.limitReached, { limit: FREE_MONTHLY_INVOICES })}</p>
        <p className="mb-6 text-ink-soft">{text.proPitch}</p>
        <PrimaryLink href="/pro">{text.upgrade}</PrimaryLink>
      </>
    );
  }

  if (clients.length === 0) {
    return (
      <>
        {header}
        <p className="mb-6 text-ink-soft">{text.noClients}</p>
        <PrimaryLink href="/clients/new">{t.clients.newClient}</PrimaryLink>
      </>
    );
  }

  const today = todayIso();
  return (
    <>
      <BackLink href="/invoices" label={t.invoices.back} />
      <Sheet className="max-w-[880px]">
        <InvoiceEditor
          title={t.invoices.newInvoice}
          clients={clients}
          initial={{
            clientId: clients.length === 1 ? clients[0].id : "",
            issueDate: today,
            dueDate: addDaysIso(today, 30),
            vatRate: 20,
            notes: "",
            lines: [],
          }}
        />
      </Sheet>
      <p className="mt-4 text-sm text-muted-foreground">
        {text.numberNote} <Link href="/clients/new">{text.addClient}</Link>
      </p>
    </>
  );
}
