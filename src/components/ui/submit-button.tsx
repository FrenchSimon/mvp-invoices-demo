import { Button } from "@/components/ui/button";
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
  return (
    <Button
      type="submit"
      disabled={pending}
      variant={variant}
      className={cn(
        "h-10 px-4 text-base",
        variant === "outline" && "border-primary bg-transparent text-destructive hover:bg-muted",
        className,
      )}
    >
      {pending ? "Un instant…" : children}
    </Button>
  );
}
