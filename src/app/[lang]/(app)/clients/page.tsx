import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoadingLine, PageHeader, PrimaryLink } from "@/components/page-header";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/supabase/user";
import type { Client } from "@/lib/invoices/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.clients.title };
}

export default async function ClientsPage() {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        title={t.clients.title}
        action={<PrimaryLink href="/clients/new">{t.clients.newClient}</PrimaryLink>}
      />
      <Suspense fallback={<LoadingLine />}>
        <ClientList />
      </Suspense>
    </>
  );
}

async function ClientList() {
  const [{ supabase }, { t }] = await Promise.all([requireUser(), getI18n()]);
  const c = t.clients;
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, email, address, vat_number")
    .order("name");

  if (error) return <p role="alert" className="text-destructive">{c.loadError}</p>;
  const clients = (data ?? []) as Client[];

  if (clients.length === 0) {
    return (
      <p className="text-ink-soft">{c.empty}</p>
    );
  }

  // Tableau à filets : filet fort en haut, filet fin entre les rangées (DESIGN.md).
  return (
    <table className="w-full border-t border-rule-strong text-left">
      <thead className="sr-only sm:not-sr-only">
        <tr className="border-b border-border text-sm text-muted-foreground">
          <th className="py-3 pr-4 font-semibold">{c.colName}</th>
          <th className="py-3 pr-4 font-semibold">{c.colEmail}</th>
          <th className="hidden py-3 font-semibold md:table-cell">{c.colAddress}</th>
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
