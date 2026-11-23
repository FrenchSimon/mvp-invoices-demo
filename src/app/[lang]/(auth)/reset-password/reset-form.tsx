"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";
import { useI18n } from "@/i18n/client";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, {});
  const { t } = useI18n();

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="password"
        name="password"
        type="password"
        label={t.auth.reset.password}
        hint={t.auth.passwordHint}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        id="confirm"
        name="confirm"
        type="password"
        label={t.auth.reset.confirm}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending} className="w-full">{t.common.save}</SubmitButton>
    </form>
  );
}
