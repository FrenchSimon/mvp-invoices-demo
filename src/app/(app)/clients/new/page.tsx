import type { Metadata } from "next";
import { PageHeader, Sheet } from "@/components/page-header";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Nouveau client" };

export default function NewClientPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouveau client" back={{ href: "/clients", label: "Clients" }} />
      <Sheet>
        <ClientForm />
      </Sheet>
    </div>
  );
}
