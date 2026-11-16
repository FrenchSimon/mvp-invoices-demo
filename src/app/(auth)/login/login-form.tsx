"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { login } from "../actions";
import { Field, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LinkErrorNotice, NextInput } from "../search-param";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});

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
        label="Email"
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <div className="flex flex-col gap-1.5">
        <Field
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          required
        />
        <Link href="/forgot-password" className="self-start text-sm">
          Forgot password?
        </Link>
      </div>
      <FormMessage error={state.error} message={state.message} />
      <SubmitButton pending={pending} className="w-full">Log in</SubmitButton>
    </form>
  );
}
