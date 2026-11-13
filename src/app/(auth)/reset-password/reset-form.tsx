"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "../submit-button";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="password"
        name="password"
        type="password"
        label="Nouveau mot de passe"
        hint="8 caractères au moins."
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        id="confirm"
        name="confirm"
        type="password"
        label="Confirmer le mot de passe"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending}>Enregistrer</SubmitButton>
    </form>
  );
}
