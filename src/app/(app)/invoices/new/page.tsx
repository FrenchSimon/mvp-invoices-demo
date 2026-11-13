import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, PrimaryLink, Sheet } from "@/components/page-header";
import { addDaysIso, todayIso } from "@/lib/format";
import { FREE_MONTHLY_INVOICES, getPlanUsage } from "@/lib/plan";
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
        <PageHeader title="Nouvelle facture" back={{ href: "/invoices", label: "Factures" }} />
        <p className="mb-2 text-ink-soft">
          Vous avez créé vos {FREE_MONTHLY_INVOICES} factures gratuites ce mois-ci. Le compteur repart à zéro le 1er
          du mois prochain.
        </p>
        <p className="mb-6 text-ink-soft">Avec Pro (9 € par mois), les factures sont illimitées et votre logo apparaît sur le PDF.</p>
        <PrimaryLink href="/pro">Passer à Pro</PrimaryLink>
      </>
    );
  }

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
