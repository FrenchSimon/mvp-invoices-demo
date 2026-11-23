"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { login } from "../actions";
import { useI18n } from "@/i18n/client";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LinkErrorNotice, NextInput } from "../search-param";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  const { t } = useI18n();

  return (
    <form action={action} className="flex flex-col gap-5">
      <Suspense fallback={null}>
        <LinkErrorNotice />
        <NextInput />
      </Suspense>
      <Field
        id="email"
        name="email"
        type="email"
        label={t.auth.email}
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <div className="flex flex-col gap-1.5">
        <Field
          id="password"
          name="password"
          type="password"
          label={t.auth.password}
          autoComplete="current-password"
          required
        />
        <Link href="/forgot-password" className="self-start text-sm">
          {t.auth.login.forgot}
        </Link>
      </div>
      <FormMessage error={state.error} message={state.message} />
      <SubmitButton pending={pending} className="w-full">{t.auth.login.submit}</SubmitButton>
    </form>
  );
}
