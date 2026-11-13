// Lignes lues dans Supabase (colonnes de la migration init et de la vue invoice_summaries).
// Les montants en centimes arrivent comme des nombres (bigint de taille raisonnable).

export type InvoiceStatus = "draft" | "sent" | "paid";
export type DisplayStatus = InvoiceStatus | "overdue";

export type Client = {
  id: string;
  name: string;
  email: string;
  address: string;
  vat_number: string;
};

export type InvoiceSummary = {
  id: string;
  client_id: string;
  client_name: string;
  number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  display_status: DisplayStatus;
  vat_rate: number;
  sent_at: string | null;
  paid_at: string | null;
  subtotal_cents: number;
  vat_cents: number;
  total_cents: number;
};

export type Invoice = {
  id: string;
  client_id: string;
  number: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  vat_rate: number;
  notes: string;
};

export type InvoiceItem = {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

export type Profile = {
  company_name: string;
  address: string;
  vat_number: string;
  email: string;
  plan: "free" | "pro";
};

// Une liste de colonnes pour la vue, partagée par les pages.
export const SUMMARY_COLUMNS =
  "id, client_id, client_name, number, issue_date, due_date, status, display_status, vat_rate, sent_at, paid_at, subtotal_cents, vat_cents, total_cents";

// numeric et bigint peuvent arriver en texte : on normalise.
export function toSummary(row: Record<string, unknown>): InvoiceSummary {
  return {
    ...(row as InvoiceSummary),
    vat_rate: Number(row.vat_rate),
    subtotal_cents: Number(row.subtotal_cents),
    vat_cents: Number(row.vat_cents),
    total_cents: Number(row.total_cents),
  };
}
