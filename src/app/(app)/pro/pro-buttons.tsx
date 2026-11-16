"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { openBillingPortal, startCheckout } from "./actions";

export function CheckoutButton() {
  const [state, action, pending] = useActionState(startCheckout, {});
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <SubmitButton pending={pending}>Upgrade to Pro</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}

export function PortalButton() {
  const [state, action, pending] = useActionState(openBillingPortal, {});
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <SubmitButton pending={pending} variant="outline">
        Manage my subscription
      </SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}
