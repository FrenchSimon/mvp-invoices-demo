import Link from "next/link";

// Logo « L » terracotta + nom de l'app (le nom définitif reste à fournir par Léa).
export const APP_NAME = "[Nom de l'app]";

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-md bg-primary font-heading text-lg font-semibold text-primary-foreground"
      >
        L
      </span>
      <span className="font-heading text-lg font-medium">{APP_NAME}</span>
    </Link>
  );
}
