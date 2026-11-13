import Link from "next/link";

// Logo « F » terracotta + nom de l'app, choisi par Léa.
export const APP_NAME = "Facturelle";

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-md bg-primary font-heading text-lg font-semibold text-primary-foreground"
      >
        F
      </span>
      <span className="font-heading text-lg font-medium">{APP_NAME}</span>
    </Link>
  );
}
