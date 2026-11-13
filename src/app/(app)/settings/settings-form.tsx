"use client";

import { useActionState } from "react";
import { Field, FormMessage, TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Profile } from "@/lib/invoices/types";
import { saveSettings } from "./actions";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveSettings, {});
  const values = state.values ?? profile;

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="company_name"
        name="company_name"
        label="Nom de l'entreprise"
        hint="Votre nom ou celui de votre entreprise, tel qu'il doit apparaître sur les factures."
        required
        defaultValue={values.company_name}
      />
      <TextAreaField
        id="address"
        name="address"
        label="Adresse et mentions"
        rows={4}
        placeholder={"12 rue des Lilas\n69003 Lyon\nSIRET 123 456 789 00012"}
        defaultValue={values.address}
      />
      <p className="-mt-3 text-sm text-muted-foreground">
        Une information par ligne. Pensez à votre SIRET : il doit figurer sur chaque facture.
      </p>
      <Field
        id="vat_number"
        name="vat_number"
        label="N° de TVA intracommunautaire (facultatif)"
        defaultValue={values.vat_number}
      />
      <FormMessage error={state.error} message={state.message} />
      <div>
        <SubmitButton pending={pending}>Enregistrer</SubmitButton>
      </div>
    </form>
  );
}
