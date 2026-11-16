// Formats anglais (version anglaise de la démo) : €1,234.56 et 4 Nov 2026 (jour, mois en lettres,
// sans ambiguïté jour/mois). Les montants sont toujours stockés en centimes (entiers).

const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const number = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 2 });
// Mois abrégés écrits à la main : Intl en-GB donne « Sept » pour septembre.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const shortDate = (y: string, m: string, d: string) => `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;

export function formatMoney(cents: number): string {
  return money.format(cents / 100);
}

export function formatNumber(value: number): string {
  return number.format(value);
}

// "2026-11-13" -> "13 Nov 2026". Lu tel quel, sans fuseau horaire.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return shortDate(y, m, d);
}

// Taux de TVA : 20 -> "20%", 5.5 -> "5.5%".
export function formatRate(rate: number): string {
  return `${number.format(rate)}%`;
}

// Saisie d'un nombre : "1,234.5", "1234.5" ou "150,50" (virgule décimale tolérée
// quand elle est suivie d'un ou deux chiffres, sans point). null si invalide.
export function parseDecimal(input: string): number | null {
  let cleaned = input.replace(/[\s\u00a0\u202f€]/g, "");
  if (!cleaned.includes(".") && /^\d+,\d{1,2}$/.test(cleaned)) cleaned = cleaned.replace(",", ".");
  else cleaned = cleaned.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

// "150.00" -> 15000 centimes. null si invalide.
export function parseEurosToCents(input: string): number | null {
  const value = parseDecimal(input);
  if (value === null) return null;
  return Math.round(value * 100);
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
export function formatDay(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" })
    .format(new Date(timestamp))
    .split("-");
  return shortDate(y, m, d);
}
