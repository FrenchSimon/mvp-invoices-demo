"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/field";
import { useI18n } from "@/i18n/client";
import type { InvoiceStatus } from "@/lib/invoices/types";
import { setInvoiceStatus } from "./actions";

type Label = "markSent" | "markPaid" | "undoPayment";
const ACTIONS: Record<InvoiceStatus, { status: "sent" | "paid"; label: Label }[]> = {
  draft: [
    { status: "sent", label: "markSent" },
    { status: "paid", label: "markPaid" },
  ],
  sent: [{ status: "paid", label: "markPaid" }],
  paid: [{ status: "sent", label: "undoPayment" }],
};

// Changements de statut : des liens dans la colonne de droite (DESIGN.md).
export function StatusActions({ id, status, disabled }: { id: string; status: InvoiceStatus; disabled?: boolean }) {
  const [state, action, pending] = useActionState(setInvoiceStatus, {});
  const text = useI18n().t.invoices.status;

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <div className="mb-2 text-sm text-muted-foreground">{text.change}</div>
      {ACTIONS[status].map((a) => (
        <button
          key={a.status}
          type="submit"
          name="status"
          value={a.status}
          disabled={pending || disabled}
          className="block py-2 text-left text-destructive hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {text[a.label]}
        </button>
      ))}
      {status === "draft" ? (
        <p className="mt-2 text-sm text-muted-foreground">{text.lockNote}</p>
      ) : null}
      <FormMessage error={state.error} />
    </form>
  );
}
