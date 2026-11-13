import { Button } from "@/components/ui/button";

// Bouton principal des formulaires (terracotta plein, un seul par écran).
export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" disabled={pending} className="h-10 w-full px-4 text-base">
      {pending ? "Un instant…" : children}
    </Button>
  );
}
