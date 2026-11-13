import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, PrimaryLink, Sheet } from "@/components/page-header";
import { addDaysIso, todayIso } from "@/lib/format";
import { requireUser } from "@/lib/supabase/user";
import { InvoiceEditor } from "../invoice-editor";

export const metadata: Metadata = { title: "Nouvelle facture" };

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<LoadingLine />}>
      <NewInvoice />
    </Suspense>
  );
}

async function NewInvoice() {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("clients").select("id, name").order("name");
  const clients = data ?? [];

  if (clients.length === 0) {
    return (
      <>
        <PageHeader title="Nouvelle facture" back={{ href: "/invoices", label: "Factures" }} />
        <p className="mb-6 text-ink-soft">Ajoutez d&apos;abord le client à qui vous adressez la facture.</p>
        <PrimaryLink href="/clients/new">Nouveau client</PrimaryLink>
      </>
    );
  }

  const today = todayIso();
  return (
    <>
      <Sheet className="max-w-[880px]">
        <InvoiceEditor
          title="Nouvelle facture"
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
        Le numéro est attribué à la création. Le client n&apos;est pas dans la liste ?{" "}
        <Link href="/clients/new">Ajouter un client</Link>
      </p>
    </>
  );
}
