"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FormMessage, TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Client } from "@/lib/invoices/types";
import { deleteClient, saveClient } from "./actions";

export function ClientForm({ client }: { client?: Client }) {
  const [state, action, pending] = useActionState(saveClient, {});
  const values = state.values ?? client;

  return (
    <form action={action} className="flex flex-col gap-5">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <Field id="name" name="name" label="Name or company name" required defaultValue={values?.name} />
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        hint="The address invoices are sent to."
        defaultValue={values?.email}
      />
      <TextAreaField id="address" name="address" label="Address" defaultValue={values?.address} />
      <Field
        id="vat_number"
        name="vat_number"
        label="VAT number (optional)"
        defaultValue={values?.vat_number}
      />
      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-5">
        <SubmitButton pending={pending}>{client ? "Save" : "Add client"}</SubmitButton>
        <Link href="/clients">Cancel</Link>
      </div>
    </form>
  );
}

export function DeleteClientForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteClient, {});

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Delete this client? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="self-start text-base text-destructive hover:underline disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete this client"}
      </button>
      <FormMessage error={state.error} />
    </form>
  );
}
