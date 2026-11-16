"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending} className="w-full">Send me the link</SubmitButton>
    </form>
  );
}
