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
      <Field id="name" name="name" label="Nom ou raison sociale" required defaultValue={values?.name} />
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        hint="L'adresse où envoyer les factures."
        defaultValue={values?.email}
      />
      <TextAreaField id="address" name="address" label="Adresse" defaultValue={values?.address} />
      <Field
        id="vat_number"
        name="vat_number"
        label="N° de TVA intracommunautaire (facultatif)"
        defaultValue={values?.vat_number}
      />
      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-5">
        <SubmitButton pending={pending}>{client ? "Enregistrer" : "Ajouter le client"}</SubmitButton>
        <Link href="/clients">Annuler</Link>
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
        if (!window.confirm("Supprimer ce client ? Cette action est définitive.")) {
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
        {pending ? "Suppression…" : "Supprimer ce client"}
      </button>
      <FormMessage error={state.error} />
    </form>
  );
}
