// Langues du site. L'anglais est la langue par défaut (sans cookie) et la source
// des textes : en/ fixe les clés, fr/ doit toutes les reprendre (sinon typecheck échoue).
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

// Choix de langue gardé un an dans ce cookie, posé par le proxy (lien FR / EN ou ?lang=fr).
export const LOCALE_COOKIE = "lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Locale Intl pour les montants et les dates : €1,234.56 en anglais, 1 234,56 € en français.
export const INTL_LOCALE: Record<Locale, string> = { en: "en-IE", fr: "fr-FR" };
