import { ArrowUpRight } from "lucide-react";
import { Suspense } from "react";
import { getI18n } from "@/i18n/server";
import { demoFocusRing } from "./focus-ring";
import { LanguageSwitch, LanguageSwitchFallback } from "./language-switch";

// Code source de la démo. Vide (null) : le lien « Read the code » et sa ligne disparaissent.
export const SOURCE_CODE: string | null = "https://github.com/FrenchSimon/mvp-invoices-demo";

/**
 * Barre sombre au-dessus de chaque page, pour les personnes qui évaluent la démo
 * (même dessin que Kinora). Elle présente le produit sans en faire partie :
 * Billnote et ses données sont fictifs.
 * Ligne 1 : ce que c'est, et le choix FR / EN à droite. Ligne 2 : le lien vers le code.
 */
export async function PortfolioBar() {
  const { locale, t } = await getI18n();
  const bar = t.common.bar;
  return (
    <aside aria-label={bar.label} className="bg-demo text-demo-foreground text-sm">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col px-4 pt-1 pb-1.5 sm:px-8">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4">
          <p className="text-demo-muted">{bar.tagline}</p>
          {/* Lit l'adresse dans le navigateur pour garder ses paramètres : le reste reste statique. */}
          <Suspense fallback={<LanguageSwitchFallback locale={locale} label={bar.language} names={bar.switchTo} />}>
            <LanguageSwitch locale={locale} label={bar.language} names={bar.switchTo} />
          </Suspense>
        </div>
        {SOURCE_CODE ? (
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3">
            <a
              href={SOURCE_CODE}
              target="_blank"
              rel="noopener noreferrer"
              className={`mr-auto inline-flex min-h-11 items-center gap-1 font-semibold text-demo-foreground underline underline-offset-4 ${demoFocusRing}`}
            >
              {bar.readCode}
              {/* La flèche dit que le lien quitte le site ; les lecteurs d'écran ont le texte. */}
              <ArrowUpRight aria-hidden="true" className="size-4" />
              <span className="sr-only"> {bar.newTab}</span>
            </a>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
