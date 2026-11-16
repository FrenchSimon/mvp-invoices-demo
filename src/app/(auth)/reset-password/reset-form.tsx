"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="password"
        name="password"
        type="password"
        label="New password"
        hint="At least 8 characters."
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        id="confirm"
        name="confirm"
        type="password"
        label="Confirm password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending} className="w-full">Save</SubmitButton>
    </form>
  );
}
