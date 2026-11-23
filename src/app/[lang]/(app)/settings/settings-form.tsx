"use client";

import { useActionState } from "react";
import { Field, FormMessage, TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useI18n } from "@/i18n/client";
import type { Profile } from "@/lib/invoices/types";
import { saveSettings } from "./actions";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveSettings, {});
  const { t } = useI18n();
  const s = t.settings;
  const values = state.values ?? profile;

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="company_name"
        name="company_name"
        label={s.companyName}
        hint={s.companyHint}
        required
        defaultValue={values.company_name}
      />
      <TextAreaField
        id="address"
        name="address"
        label={s.address}
        rows={4}
        placeholder={s.addressPlaceholder}
        defaultValue={values.address}
      />
      <p className="-mt-3 text-sm text-muted-foreground">
        {s.addressHint}
      </p>
      <Field
        id="vat_number"
        name="vat_number"
        label={s.vat}
        defaultValue={values.vat_number}
      />
      <FormMessage error={state.error} message={state.message} />
      <div>
        <SubmitButton pending={pending}>{t.common.save}</SubmitButton>
      </div>
    </form>
  );
}
