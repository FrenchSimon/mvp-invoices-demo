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
        label="Business name"
        hint="Your name or your company's, as it should appear on invoices."
        required
        defaultValue={values.company_name}
      />
      <TextAreaField
        id="address"
        name="address"
        label="Address and legal details"
        rows={4}
        placeholder={"4 Harbour Road\nDublin D02 X285\nCompany No. 654321"}
        defaultValue={values.address}
      />
      <p className="-mt-3 text-sm text-muted-foreground">
        One item per line. Include your company registration number if your country requires it on invoices.
      </p>
      <Field
        id="vat_number"
        name="vat_number"
        label="VAT number (optional)"
        defaultValue={values.vat_number}
      />
      <FormMessage error={state.error} message={state.message} />
      <div>
        <SubmitButton pending={pending}>Save</SubmitButton>
      </div>
    </form>
  );
}
