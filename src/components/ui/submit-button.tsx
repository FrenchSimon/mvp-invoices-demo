"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

// Bouton d'envoi d'un formulaire. Par défaut : principal (terracotta plein, un seul par écran).
export function SubmitButton({
  pending,
  children,
  variant = "default",
  className,
}: {
  pending: boolean;
  children: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Button
      type="submit"
      disabled={pending}
      // Secondaire : variante « ghost » (sans fond) + contour terracotta. cn() ne fusionne
      // pas les classes Tailwind en conflit, d'où ce choix plutôt que « outline ».
      variant={variant === "outline" ? "ghost" : "default"}
      className={cn(
        "h-10 px-4 text-base",
        variant === "outline" && "border-primary text-destructive hover:text-destructive",
        className,
      )}
    >
      {pending ? t.common.pending : children}
    </Button>
  );
}
