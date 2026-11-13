"use client";

import { useActionState } from "react";
import { signup } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "../submit-button";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {});

  // Compte créé, en attente de la confirmation par email : on n'affiche plus le formulaire.
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
      <Field
        id="password"
        name="password"
        type="password"
        label="Mot de passe"
        hint="8 caractères au moins."
        autoComplete="new-password"
        minLength={8}
        required
      />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
    </form>
  );
}
