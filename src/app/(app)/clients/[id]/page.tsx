import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingLine, PageHeader, Sheet } from "@/components/page-header";
import { requireUser } from "@/lib/supabase/user";
import type { Client } from "@/lib/invoices/types";
import { ClientForm, DeleteClientForm } from "../client-form";

export const metadata: Metadata = { title: "Client" };

export default function ClientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<LoadingLine />}>
        <EditClient params={params} />
      </Suspense>
    </div>
  );
}

async function EditClient({ params }: Pick<PageProps<"/clients/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireUser();
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
      <PageHeader title={client.name} back={{ href: "/clients", label: "Clients" }} />
      <Sheet>
        <ClientForm client={client} />
      </Sheet>
      <div className="mt-6">
        <DeleteClientForm id={client.id} />
      </div>
    </>
  );
}
