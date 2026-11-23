"use client";

import { useActionState } from "react";
import { startDemo, type DemoState } from "@/app/[lang]/(auth)/actions";
import { useI18n } from "@/i18n/client";
import { FormMessage } from "@/components/ui/field";
import { cn } from "@/lib/utils";

// « Try the demo » sur l'accueil : ouvre un espace de démo rempli de données
// fictives, sans inscription. En cas d'échec, le message s'affiche sous le bouton.
export function DemoButton({ className }: { className?: string }) {
  const [state, action, pending] = useActionState<DemoState>(startDemo, {});
  const { t } = useI18n();
  return (
    <form action={action}>
      <button type="submit" disabled={pending} className={cn(className, pending && "opacity-70")}>
        {pending ? t.auth.demo.opening : t.auth.demo.open}
      </button>
      {state.error ? (
        <div className="mt-2">
          <FormMessage error={state.error} />
        </div>
      ) : null}
    </form>
  );
}
