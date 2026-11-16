"use client";

import { useActionState } from "react";
import { signup } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

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
        label="Password"
        hint="At least 8 characters."
        autoComplete="new-password"
        minLength={8}
        required
      />
      <div className="flex items-start gap-2.5">
        <input
          id="terms"
          name="terms"
          type="checkbox"
          required
          className="mt-1 size-4 shrink-0 accent-primary"
        />
        <label htmlFor="terms" className="text-[15px] text-ink-soft">
          I accept the{" "}
          {/* Démo : pas de vraies conditions publiées, lien factice comme dans le pied de page. */}
          <a href="#">Terms of Service</a>{" "}
          and the{" "}
          <a href="#">Privacy Policy</a>
          .
        </label>
      </div>
      <FormMessage error={state.error} />
      <SubmitButton pending={pending} className="w-full">Create my account</SubmitButton>
    </form>
  );
}
