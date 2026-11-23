import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

// Page introuvable : message aligné à gauche (pas de grand titre centré,
// DESIGN.md) et un seul bouton principal pour revenir au tableau de bord.
export async function NotFoundView() {
  const { t } = await getI18n();
  const text = t.common.notFound;
  return (
    <div className="max-w-xl py-4 sm:py-10">
      <p className="text-sm font-semibold tracking-wide text-destructive uppercase">{text.eyebrow}</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">{text.heading}</h1>
      <p className="mt-4 text-lg text-ink-soft">{text.body}</p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants(), "mt-8 h-11 px-5 text-base text-primary-foreground no-underline")}
      >
        {text.back}
      </Link>
    </div>
  );
}
