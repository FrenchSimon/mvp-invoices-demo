"use client";

import { useSearchParams } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { demoFocusRing } from "./focus-ring";

// Ordre affiché : FR puis EN (même choix que Kinora).
const ORDER: Locale[] = ["fr", "en"];

type Props = { locale: Locale; label: string; names: Record<Locale, string> };

// Choix FR / EN dans la barre de démo. Chaque lien recharge la même page avec
// ?lang=fr : le proxy pose le cookie (1 an) et renvoie vers l'adresse sans le paramètre.
// Lien classique (pas <Link>) : la page entière est refaite dans la nouvelle langue.
export function LanguageSwitch(props: Props) {
  const params = useSearchParams();
  return <Switch {...props} hrefFor={(lang) => withLang(params.toString(), lang)} />;
}

// Avant de lire l'adresse : « ?lang=fr » garde déjà le chemin de la page.
export function LanguageSwitchFallback(props: Props) {
  return <Switch {...props} hrefFor={(lang) => `?lang=${lang}`} />;
}

function withLang(search: string, lang: Locale): string {
  const params = new URLSearchParams(search);
  params.set("lang", lang);
  return `?${params.toString()}`;
}

function Switch({ locale, label, names, hrefFor }: Props & { hrefFor: (lang: Locale) => string }) {
  return (
    <nav aria-label={label} className="flex items-center">
      {ORDER.map((lang, index) => {
        const current = lang === locale;
        return (
          <span key={lang} className="flex items-center">
            {index > 0 ? <span aria-hidden="true" className="mx-1 h-4 w-px bg-demo-muted" /> : null}
            <a
              href={hrefFor(lang)}
              hrefLang={lang}
              lang={lang}
              aria-current={current ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center px-1 text-demo-foreground",
                current ? "font-semibold underline underline-offset-4" : "no-underline hover:underline",
                demoFocusRing,
              )}
            >
              {lang.toUpperCase()}
              <span className="sr-only"> – {names[lang]}</span>
            </a>
          </span>
        );
      })}
    </nav>
  );
}
