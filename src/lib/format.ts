import { INTL_LOCALE, type Locale } from "@/i18n/config";

// Montants et dates dans la langue choisie :
// - anglais : €1,234.56 et 4 Nov 2026 (jour, mois en lettres, sans ambiguïté jour/mois) ;
// - français : 1 234,56 € et 4 nov. 2026.
// Les montants sont toujours stockés en centimes (entiers).

const money = {
  en: new Intl.NumberFormat(INTL_LOCALE.en, { style: "currency", currency: "EUR" }),
  fr: new Intl.NumberFormat(INTL_LOCALE.fr, { style: "currency", currency: "EUR" }),
} satisfies Record<Locale, Intl.NumberFormat>;
const number = {
  en: new Intl.NumberFormat(INTL_LOCALE.en, { maximumFractionDigits: 2 }),
  fr: new Intl.NumberFormat(INTL_LOCALE.fr, { maximumFractionDigits: 2 }),
} satisfies Record<Locale, Intl.NumberFormat>;
// Mois abrégés écrits à la main : Intl en-GB donne « Sept » pour septembre.
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const frDate = new Intl.DateTimeFormat(INTL_LOCALE.fr, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function shortDate(y: string, m: string, d: string, locale: Locale): string {
  if (locale === "fr") return frDate.format(new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))));
  return `${Number(d)} ${EN_MONTHS[Number(m) - 1]} ${y}`;
}

export function formatMoney(cents: number, locale: Locale): string {
  return money[locale].format(cents / 100);
}

export function formatNumber(value: number, locale: Locale): string {
  return number[locale].format(value);
}

// "2026-11-13" -> "13 Nov 2026" / "13 nov. 2026". Lu tel quel, sans fuseau horaire.
export function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return shortDate(y, m, d, locale);
}

// Taux de TVA : 20 -> "20%" / "20 %", 5.5 -> "5.5%" / "5,5 %" (espace insécable en français).
export function formatRate(rate: number, locale: Locale): string {
  return locale === "fr" ? `${number.fr.format(rate)} %` : `${number.en.format(rate)}%`;
}

// Saisie d'un nombre. null si invalide.
// - anglais : "1,234.5", "1234.5" ou "150,50" (virgule décimale tolérée quand elle est
//   suivie d'un ou deux chiffres, sans point) ;
// - français : "1 234,5", "150,50" ou "150.50" (la virgule est décimale, le point aussi
//   s'il n'y a pas de virgule).
export function parseDecimal(input: string, locale: Locale): number | null {
  let cleaned = input.replace(/[\s  €]/g, "");
  if (locale === "fr") {
    if (cleaned.includes(",")) cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (!cleaned.includes(".") && /^\d+,\d{1,2}$/.test(cleaned)) cleaned = cleaned.replace(",", ".");
  else cleaned = cleaned.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

// "150.00" (ou "150,00" en français) -> 15000 centimes. null si invalide.
export function parseEurosToCents(input: string, locale: Locale): number | null {
  const value = parseDecimal(input, locale);
  if (value === null) return null;
  return Math.round(value * 100);
}

// Prix unitaire remis dans un champ de saisie : 15000 -> "150.00" / "150,00".
export function centsToInput(cents: number, locale: Locale): string {
  const text = (cents / 100).toFixed(2);
  return locale === "fr" ? text.replace(".", ",") : text;
}

// Date du jour au format AAAA-MM-JJ, à l'heure de Paris.
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Horodatage (sent_at, paid_at) -> "13 Nov 2026", jour de Paris.
export function formatDay(timestamp: string | null | undefined, locale: Locale): string {
  if (!timestamp) return "";
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" })
    .format(new Date(timestamp))
    .split("-");
  return shortDate(y, m, d, locale);
}
