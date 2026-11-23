"use client";

import { useActionState } from "react";
import { signup } from "../actions";
import { useI18n } from "@/i18n/client";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, {});
  const { t } = useI18n();
  const text = t.auth.signup;

  // Compte créé, en attente de la confirmation par email : on n'affiche plus le formulaire.
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
      <Field
        id="password"
        name="password"
        type="password"
        label={t.auth.password}
        hint={t.auth.passwordHint}
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
          {text.acceptBefore}{" "}
          {/* Démo : pas de vraies conditions publiées, lien factice comme dans le pied de page. */}
          <a href="#">{text.terms}</a> {text.acceptAnd}{" "}
          <a href="#">{text.privacy}</a>
          {text.acceptAfter}
        </label>
      </div>
      <FormMessage error={state.error} />
      <SubmitButton pending={pending} className="w-full">{text.submit}</SubmitButton>
    </form>
  );
}
