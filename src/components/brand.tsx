import Link from "next/link";

// Logo « B » terracotta + nom de l'app (version anglaise : Billnote, choix de Simon).
export const APP_NAME = "Billnote";

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline">
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-md bg-primary font-heading text-lg font-semibold text-primary-foreground"
      >
        B
      </span>
      <span className="font-heading text-lg font-medium">{APP_NAME}</span>
    </Link>
  );
}
