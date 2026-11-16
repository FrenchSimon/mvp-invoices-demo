import Link from "next/link";

// Logo « B » terracotta + nom de l'app (version anglaise : Billnote, choix de Simon).
export const APP_NAME = "Billnote";

export function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-foreground no-underline">
      {/* pt-1 : Newsreader place ses majuscules haut dans la ligne ; la marge haute
          redescend le « B » de 2 px pour le centrer dans le carré. */}
      <span
        aria-hidden
        className="flex size-8 items-center justify-center rounded-md bg-primary pt-1 font-heading text-lg font-semibold text-primary-foreground"
      >
        B
      </span>
      {/* pt-1 : même correction que le « B », pour aligner le nom sur le centre du carré. */}
      <span className="pt-1 font-heading text-lg font-medium">{APP_NAME}</span>
    </Link>
  );
}
