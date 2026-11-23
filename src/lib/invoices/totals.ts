// Même calcul que la vue invoice_summaries de la base, pour afficher les totaux
// pendant la saisie : HT arrondi au centime, puis TVA arrondie au centime.
export type LineAmounts = { quantity: number; unitPriceCents: number };

export function lineTotalCents(line: LineAmounts): number {
  return Math.round(line.quantity * line.unitPriceCents);
}

export function computeTotals(lines: LineAmounts[], vatRate: number) {
  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.quantity * l.unitPriceCents, 0));
  const vat = Math.round((subtotal * vatRate) / 100);
  return { subtotal, vat, total: subtotal + vat };
}

// Taux proposés dans l'éditeur. 0 % : micro-entrepreneur en franchise de TVA.
export const VAT_RATES = [20, 10, 5.5, 2.1, 0] as const;
