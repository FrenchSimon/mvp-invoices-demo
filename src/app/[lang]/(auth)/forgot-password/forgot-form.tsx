"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { useI18n } from "@/i18n/client";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});
  const { t } = useI18n();

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="email"
        name="email"
        type="email"
        label={t.auth.email}
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending} className="w-full">{t.auth.forgot.submit}</SubmitButton>
    </form>
  );
}
