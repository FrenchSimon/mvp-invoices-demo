import { INTL_LOCALE, type Locale } from "./config";

// Remplace {nom} par sa valeur : fmt("Invoice {number}", { number: "2026-001" }).
// Les dictionnaires ne contiennent que du texte, pour pouvoir passer aux composants client.
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export type Plural = { one: string; other: string };

// Singulier ou pluriel selon la langue (en français, 0 et 1 sont au singulier).
export function plural(locale: Locale, count: number, forms: Plural): string {
  const rule = new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
  return fmt(rule === "one" ? forms.one : forms.other, { count });
}
