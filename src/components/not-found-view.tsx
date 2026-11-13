import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Page introuvable : message aligné à gauche (pas de grand titre centré,
// DESIGN.md) et un seul bouton principal pour revenir au tableau de bord.
export function NotFoundView() {
  return (
    <div className="max-w-xl py-4 sm:py-10">
      <p className="text-sm font-semibold tracking-wide text-destructive uppercase">Erreur 404</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Cette page n&apos;est pas dans le carnet.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        L&apos;adresse est peut-être mal saisie, ou la page n&apos;existe plus. Vos factures et vos clients,
        eux, n&apos;ont pas bougé.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "mt-8 h-11 px-5 text-base text-primary-foreground no-underline")}
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
