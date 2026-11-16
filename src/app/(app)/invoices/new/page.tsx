import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, PrimaryLink, Sheet } from "@/components/page-header";
import { addDaysIso, todayIso } from "@/lib/format";
import { FREE_MONTHLY_INVOICES, getPlanUsage } from "@/lib/plan";
import { requireUser } from "@/lib/supabase/user";
import { InvoiceEditor } from "../invoice-editor";

export const metadata: Metadata = { title: "New invoice" };

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<LoadingLine />}>
      <NewInvoice />
    </Suspense>
  );
}

async function NewInvoice() {
  const { supabase, user } = await requireUser();
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
        <PageHeader title="New invoice" back={{ href: "/invoices", label: "Invoices" }} />
        <p className="mb-2 text-ink-soft">
          You&apos;ve used your {FREE_MONTHLY_INVOICES} free invoices this month. The count resets on the 1st of
          next month.
        </p>
        <p className="mb-6 text-ink-soft">With Pro (€9 per month), invoices are unlimited and your logo appears on the PDF.</p>
        <PrimaryLink href="/pro">Upgrade to Pro</PrimaryLink>
      </>
    );
  }

  if (clients.length === 0) {
    return (
      <>
        <PageHeader title="New invoice" back={{ href: "/invoices", label: "Invoices" }} />
        <p className="mb-6 text-ink-soft">First, add the client you&apos;re invoicing.</p>
        <PrimaryLink href="/clients/new">New client</PrimaryLink>
      </>
    );
  }

  const today = todayIso();
  return (
    <>
      <Sheet className="max-w-[880px]">
        <InvoiceEditor
          title="New invoice"
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
        The number is assigned when the invoice is created. Client not in the list?{" "}
        <Link href="/clients/new">Add a client</Link>
      </p>
    </>
  );
}
