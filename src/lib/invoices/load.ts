import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SUMMARY_COLUMNS,
  toSummary,
  type Client,
  type Invoice,
  type InvoiceItem,
  type InvoiceSummary,
  type Profile,
} from "./types";

export type FullInvoice = {
  invoice: Invoice;
  summary: InvoiceSummary;
  items: InvoiceItem[];
  client: Client;
  company: Profile;
  // Logo de l'entreprise (PNG ou JPEG), seulement en Pro et si demandé.
  logo: Buffer | null;
};

// Le logo n'est lu que pour le PDF : la page de la facture n'en a pas besoin.
type LoadOptions = { withLogo?: boolean };

// Tout ce qu'il faut pour le PDF (et l'email) d'une facture.
// Passe par le client Supabase de la personne connectée : RLS s'applique,
// une facture d'un autre freelance renvoie null.
export async function loadFullInvoice(
  supabase: SupabaseClient,
  id: string,
  { withLogo = false }: LoadOptions = {},
): Promise<FullInvoice | null> {
  const [{ data: inv }, { data: summaryRow }, { data: itemRows }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, user_id, client_id, number, issue_date, due_date, status, vat_rate, notes")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("invoice_summaries").select(SUMMARY_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("invoice_items")
      .select("id, position, description, quantity, unit_price_cents")
      .eq("invoice_id", id)
      .order("position"),
  ]);
  if (!inv || !summaryRow) return null;

  const [{ data: client }, { data: company }] = await Promise.all([
    supabase.from("clients").select("id, name, email, address, vat_number").eq("id", inv.client_id).single(),
    supabase
      .from("profiles")
      .select("company_name, address, vat_number, email, plan, logo_path")
      .eq("id", inv.user_id)
      .single(),
  ]);
  if (!client || !company) return null;
  const profile = company as Profile;

  return {
    invoice: { ...(inv as Invoice), vat_rate: Number(inv.vat_rate) },
    summary: toSummary(summaryRow),
    items: ((itemRows ?? []) as InvoiceItem[]).map((it) => ({
      ...it,
      quantity: Number(it.quantity),
      unit_price_cents: Number(it.unit_price_cents),
    })),
    client: client as Client,
    company: profile,
    logo: withLogo ? await loadLogo(supabase, profile) : null,
  };
}

// Logo du compte Pro, lu dans l'espace privé « logos » avec les droits de la
// personne connectée. Formule gratuite, pas de logo ou erreur : PDF sans logo.
async function loadLogo(supabase: SupabaseClient, company: Profile): Promise<Buffer | null> {
  if (company.plan !== "pro" || !company.logo_path) return null;
  const { data, error } = await supabase.storage.from("logos").download(company.logo_path);
  if (error || !data) {
    console.error("[pdf] logo", company.logo_path, error);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}
