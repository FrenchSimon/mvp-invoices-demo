// Formats français de DESIGN.md : 1 234,56 € et JJ/MM/AAAA.
// Les montants sont toujours stockés en centimes (entiers) pour éviter les erreurs d'arrondi.

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const number = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export function formatMoney(cents: number): string {
  return money.format(cents / 100);
}

export function formatNumber(value: number): string {
  return number.format(value);
}

// "2026-11-13" -> "13/11/2026". Lu tel quel, sans fuseau horaire.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

// Taux de TVA : 20 -> "20 %", 5.5 -> "5,5 %".
export function formatRate(rate: number): string {
  return `${number.format(rate)} %`;
}

// Saisie d'un nombre à la française : "1 234,5" ou "1234.5". null si invalide.
export function parseDecimal(input: string): number | null {
  const cleaned = input.replace(/[\s  €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

// "150,00" -> 15000 centimes. null si invalide.
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

// Horodatage (sent_at, paid_at) -> JJ/MM/AAAA, jour de Paris.
export function formatDay(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(new Date(timestamp));
}
