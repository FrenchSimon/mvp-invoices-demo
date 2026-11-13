"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/page-header";
import { InvoiceEditor, type EditorInitial } from "../invoice-editor";
import { StatusActions } from "../status-actions";

// Brouillon : l'éditeur et, à droite, les changements de statut. Tant qu'il reste
// des changements non enregistrés, les statuts sont bloqués (sinon ils seraient perdus).
export function DraftWorkspace({
  initial,
  clients,
  title,
  badge,
}: {
  initial: EditorInitial & { id: string };
  clients: { id: string; name: string }[];
  title: string;
  badge: ReactNode;
}) {
  const [dirty, setDirty] = useState(false);

  return (
    <div className="flex flex-wrap items-start gap-10">
      <Sheet className="min-w-0 flex-[999_1_600px]">
        <InvoiceEditor initial={initial} clients={clients} title={title} badge={badge} onDirtyChange={setDirty} />
      </Sheet>
      <aside className="min-w-0 flex-[1_1_220px]">
        <StatusActions id={initial.id} status="draft" disabled={dirty} />
        {dirty ? (
          <p className="mt-2 text-sm text-muted-foreground">Enregistrez d&apos;abord le brouillon.</p>
        ) : null}
      </aside>
    </div>
  );
}
