import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Page introuvable : message aligné à gauche (pas de grand titre centré,
// DESIGN.md) et un seul bouton principal pour revenir au tableau de bord.
export function NotFoundView() {
  return (
    <div className="max-w-xl py-4 sm:py-10">
      <p className="text-sm font-semibold tracking-wide text-destructive uppercase">Error 404</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">This page isn&apos;t in the notebook.</h1>
      <p className="mt-4 text-lg text-ink-soft">
        The address may be mistyped, or the page no longer exists. Your invoices and clients are right
        where you left them.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "mt-8 h-11 px-5 text-base text-primary-foreground no-underline")}
      >
        Back to dashboard
      </Link>
    </div>
  );
}
