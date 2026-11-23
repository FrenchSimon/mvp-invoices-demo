import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingLine, PageHeader, Sheet } from "@/components/page-header";
import { getI18n } from "@/i18n/server";
import { requireUser } from "@/lib/supabase/user";
import type { Client } from "@/lib/invoices/types";
import { ClientForm, DeleteClientForm } from "../client-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.clients.client };
}

export default function ClientPage({ params }: PageProps<"/[lang]/clients/[id]">) {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingLine />}>
        <EditClient params={params} />
      </Suspense>
    </div>
  );
}

async function EditClient({ params }: Pick<PageProps<"/[lang]/clients/[id]">, "params">) {
  const { id } = await params;
  const [{ supabase }, { t }] = await Promise.all([requireUser(), getI18n()]);
  // RLS : le client d'un autre freelance n'est jamais renvoyé, donc 404.
  const { data } = await supabase
    .from("clients")
    .select("id, name, email, address, vat_number")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const client = data as Client;

  return (
    <>
      <PageHeader title={client.name} back={{ href: "/clients", label: t.clients.title }} />
      <Sheet>
        <ClientForm client={client} />
      </Sheet>
      <div className="mt-6">
        <DeleteClientForm id={client.id} />
      </div>
    </>
  );
}
