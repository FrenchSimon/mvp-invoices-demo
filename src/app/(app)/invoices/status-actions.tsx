"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/field";
import type { InvoiceStatus } from "@/lib/invoices/types";
import { setInvoiceStatus } from "./actions";

const ACTIONS: Record<InvoiceStatus, { status: "sent" | "paid"; label: string }[]> = {
  draft: [
    { status: "sent", label: "Mark as sent" },
    { status: "paid", label: "Mark as paid" },
  ],
  sent: [{ status: "paid", label: "Mark as paid" }],
  paid: [{ status: "sent", label: "Undo payment" }],
};

// Changements de statut : des liens dans la colonne de droite (DESIGN.md).
export function StatusActions({ id, status, disabled }: { id: string; status: InvoiceStatus; disabled?: boolean }) {
  const [state, action, pending] = useActionState(setInvoiceStatus, {});

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="mb-2 text-sm text-muted-foreground">Change status</div>
      {ACTIONS[status].map((a) => (
        <button
          key={a.status}
          type="submit"
          name="status"
          value={a.status}
          disabled={pending || disabled}
          className="block py-2 text-left text-destructive hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {a.label}
        </button>
      ))}
      {status === "draft" ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Once sent, the invoice can no longer be edited.
        </p>
      ) : null}
      <FormMessage error={state.error} />
    </form>
  );
}
