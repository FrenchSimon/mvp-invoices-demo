import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, PrimaryLink } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/user";
import type { Client } from "@/lib/invoices/types";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <>
      <PageHeader title="Clients" action={<PrimaryLink href="/clients/new">New client</PrimaryLink>} />
      <Suspense fallback={<LoadingLine />}>
        <ClientList />
      </Suspense>
    </>
  );
}

async function ClientList() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, address, vat_number")
    .order("name");

  if (error) return <p role="alert" className="text-destructive">Clients couldn&apos;t be loaded.</p>;
  const clients = (data ?? []) as Client[];

  if (clients.length === 0) {
    return (
      <p className="text-ink-soft">
        No clients yet. Add your first client to start invoicing.
      </p>
    );
  }

  // Tableau à filets : filet fort en haut, filet fin entre les rangées (DESIGN.md).
  return (
    <table className="w-full border-t border-rule-strong text-left">
      <thead className="sr-only sm:not-sr-only">
        <tr className="border-b border-border text-sm text-muted-foreground">
          <th className="py-3 pr-4 font-semibold">Name</th>
          <th className="py-3 pr-4 font-semibold">Email</th>
          <th className="hidden py-3 font-semibold md:table-cell">Address</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id} className="border-b border-border align-top">
            <td className="py-3.5 pr-4">
              <Link href={`/clients/${client.id}`} className="font-semibold">
                {client.name}
              </Link>
              <div className="text-sm text-muted-foreground sm:hidden">{client.email}</div>
            </td>
            <td className="hidden py-3.5 pr-4 text-ink-soft sm:table-cell">{client.email}</td>
            <td className="hidden py-3.5 whitespace-pre-line text-ink-soft md:table-cell">{client.address}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
