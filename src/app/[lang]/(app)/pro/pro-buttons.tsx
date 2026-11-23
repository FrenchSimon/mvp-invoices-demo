"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useI18n } from "@/i18n/client";
import { openBillingPortal, startCheckout } from "./actions";

export function CheckoutButton() {
  const [state, action, pending] = useActionState(startCheckout, {});
  const { t } = useI18n();
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <SubmitButton pending={pending}>{t.pro.upgrade}</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}

export function PortalButton() {
  const [state, action, pending] = useActionState(openBillingPortal, {});
  const { t } = useI18n();
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <SubmitButton pending={pending} variant="outline">
        {t.pro.manage}
      </SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}
