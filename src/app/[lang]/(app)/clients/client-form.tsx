"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FormMessage, TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useI18n } from "@/i18n/client";
import type { Client } from "@/lib/invoices/types";
import { deleteClient, saveClient } from "./actions";

export function ClientForm({ client }: { client?: Client }) {
  const [state, action, pending] = useActionState(saveClient, {});
  const { t } = useI18n();
  const f = t.clients.form;
  const values = state.values ?? client;

  return (
    <form action={action} className="flex flex-col gap-5">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <Field id="name" name="name" label={f.name} required defaultValue={values?.name} />
      <Field
        id="email"
        name="email"
        type="email"
        label={f.email}
        hint={f.emailHint}
        defaultValue={values?.email}
      />
      <TextAreaField id="address" name="address" label={f.address} defaultValue={values?.address} />
      <Field
        id="vat_number"
        name="vat_number"
        label={f.vat}
        defaultValue={values?.vat_number}
      />
      <FormMessage error={state.error} />
      <div className="flex flex-wrap items-center gap-5">
        <SubmitButton pending={pending}>{client ? t.common.save : f.add}</SubmitButton>
        <Link href="/clients">{t.common.cancel}</Link>
      </div>
    </form>
  );
}

export function DeleteClientForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteClient, {});
  const { t } = useI18n();
  const del = t.clients.delete;

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(del.confirm)) {
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
        {pending ? del.deleting : del.button}
      </button>
      <FormMessage error={state.error} />
    </form>
  );
}
