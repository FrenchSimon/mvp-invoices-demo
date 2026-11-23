import { ArrowUpRight } from "lucide-react";

// Code source de la démo. Vide (null) : le lien « Read the code » et sa ligne disparaissent.
export const SOURCE_CODE: string | null = "https://github.com/FrenchSimon/mvp-invoices-demo";

// Contour de focus clair, visible sur le fond sombre de la barre.
const focusRing =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-demo-foreground";

/**
 * Barre sombre au-dessus de chaque page, pour les personnes qui évaluent la démo
 * (même dessin que Kinora). Elle présente le produit sans en faire partie :
 * Billnote et ses données sont fictifs. Ligne 1 : ce que c'est ; ligne 2 : le code.
 */
export function PortfolioBar() {
  return (
    <aside aria-label="About this demo" className="bg-demo text-demo-foreground text-sm">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col px-4 pt-1 pb-1.5 sm:px-8">
        <p className="flex min-h-9 items-center text-demo-muted">Portfolio demo · sample data</p>
        {SOURCE_CODE ? (
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3">
            <a
              href={SOURCE_CODE}
              target="_blank"
              rel="noopener noreferrer"
              className={`mr-auto inline-flex min-h-11 items-center gap-1 font-semibold text-demo-foreground underline underline-offset-4 ${focusRing}`}
            >
              Read the code
              {/* La flèche dit que le lien quitte le site ; les lecteurs d'écran ont le texte. */}
              <ArrowUpRight aria-hidden="true" className="size-4" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
