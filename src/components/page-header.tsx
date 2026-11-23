import type { ReactNode } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Titre de page à gauche, action principale éventuelle à droite.
export function PageHeader({
  title,
  back,
  intro,
  action,
}: {
  title: ReactNode;
  back?: { href: string; label: string };
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back ? (
          <Link href={back.href} className="text-sm">
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-1 text-muted-foreground">{intro}</p> : null}
      </div>
      {action}
    </div>
  );
}

// Retour vers la liste, au-dessus de la feuille (hors de la facture elle-même).
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-2 inline-flex min-h-11 items-center text-sm">
      ← {label}
    </Link>
  );
}

// Lien qui a l'apparence du bouton principal (terracotta plein).
export function PrimaryLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants(), "h-10 px-4 text-base text-primary-foreground no-underline")}
    >
      {children}
    </Link>
  );
}

// Lien en bouton secondaire (contour terracotta).
export function SecondaryLink({ href, children, download }: { href: string; children: string; download?: boolean }) {
  const className = cn(
    buttonVariants({ variant: "ghost" }),
    "h-10 border-primary px-4 text-base text-destructive no-underline hover:text-destructive",
  );
  // Un fichier à télécharger : lien simple, sans navigation côté client.
  if (download) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

// Feuille (--card) qui porte un formulaire ou une facture.
export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border bg-card px-5 py-6 sm:px-10 sm:py-10", className)}>
      {children}
    </section>
  );
}

// Ligne « Chargement… » traduite (composant client).
export { LoadingLine } from "./loading-line";
