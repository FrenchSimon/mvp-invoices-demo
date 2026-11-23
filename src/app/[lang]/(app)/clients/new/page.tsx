import type { Metadata } from "next";
import { PageHeader, Sheet } from "@/components/page-header";
import { getI18n } from "@/i18n/server";
import { ClientForm } from "../client-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.clients.newClient };
}

export default async function NewClientPage() {
  const { t } = await getI18n();
  return (
    <div className="max-w-2xl">
      <PageHeader title={t.clients.newClient} back={{ href: "/clients", label: t.clients.title }} />
      <Sheet>
        <ClientForm />
      </Sheet>
    </div>
  );
}
