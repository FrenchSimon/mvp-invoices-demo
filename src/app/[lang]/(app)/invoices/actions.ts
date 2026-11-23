"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/message";
import { getRequestI18n } from "@/i18n/server";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";
import { parseDecimal, parseEurosToCents } from "@/lib/format";
import { loadFullInvoice } from "@/lib/invoices/load";
import { VAT_RATES } from "@/lib/invoices/totals";
import { isDemoUser, requireUser } from "@/lib/supabase/user";

// upgrade : la création est refusée par la limite du plan gratuit, l'éditeur propose Pro.
export type InvoiceFormState = { error?: string; message?: string; upgrade?: boolean };

// Ligne telle que saisie dans l'éditeur (texte brut, converti ici).
type RawLine = { description?: unknown; quantity?: unknown; price?: unknown };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function dbErrorMessage(message: string, t: Dictionary): string {
  const e = t.invoices.errors;
  if (message.includes("FREE_PLAN_LIMIT")) return e.freeLimit;
  if (message.includes("INVOICE_LOCKED")) return e.locked;
  if (message.includes("INVOICE_NOT_FOUND")) return e.gone;
  if (message.includes("INVOICE_NO_ITEMS")) return e.noItems;
  return e.save;
}

// Crée un brouillon (pas d'id) ou modifie un brouillon existant.
// Le numéro, le propriétaire et le verrouillage sont gérés par la base.
export async function saveInvoice(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const id = String(formData.get("id") ?? "") || null;
  const clientId = String(formData.get("client_id") ?? "");
  const issueDate = String(formData.get("issue_date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const vatRate = Number(formData.get("vat_rate"));
  const notes = String(formData.get("notes") ?? "").trim();
  const { locale, t } = await getRequestI18n();
  const e = t.invoices.errors;

  if (!clientId) return { error: e.chooseClient };
  if (!ISO_DATE.test(issueDate) || !ISO_DATE.test(dueDate)) return { error: e.dates };
  if (dueDate < issueDate) return { error: e.dueBeforeIssue };
  if (!(VAT_RATES as readonly number[]).includes(vatRate)) return { error: e.vatRate };

  let raw: RawLine[];
  try {
    raw = JSON.parse(String(formData.get("items") ?? "[]"));
    if (!Array.isArray(raw)) throw new Error();
  } catch {
    return { error: e.lines };
  }

  const items = [];
  for (const [index, line] of raw.entries()) {
    const description = String(line.description ?? "").trim();
    const quantityText = String(line.quantity ?? "").trim();
    const priceText = String(line.price ?? "").trim();
    // Une ligne laissée entièrement vide est ignorée.
    if (!description && !priceText && (!quantityText || quantityText === "1")) continue;

    const n = index + 1;
    if (!description) return { error: fmt(e.lineDescription, { n }) };
    const quantity = parseDecimal(quantityText, locale);
    if (quantity === null || quantity <= 0 || quantity >= 100_000_000) {
      return { error: fmt(e.lineQuantity, { n }) };
    }
    const unitPriceCents = parseEurosToCents(priceText, locale);
    if (unitPriceCents === null) return { error: fmt(e.linePrice, { n }) };
    items.push({
      description,
      quantity: Math.round(quantity * 100) / 100,
      unit_price_cents: unitPriceCents,
    });
  }
  if (items.length === 0) return { error: e.noItems };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("save_invoice", {
    p_id: id,
    p_client_id: clientId,
    p_issue_date: issueDate,
    p_due_date: dueDate,
    p_vat_rate: vatRate,
    p_notes: notes,
    p_items: items,
  });
  if (error) return { error: dbErrorMessage(error.message, t), upgrade: error.message.includes("FREE_PLAN_LIMIT") };

  if (!id) redirect(`/invoices/${data as string}`);
  refresh();
  return { message: t.invoices.saved };
}

export type StatusState = { error?: string };

// Changement de statut : envoyée, payée, ou retour à « envoyée » (annuler le paiement).
// La base refuse le retour au brouillon et fixe elle-même les dates d'envoi et de paiement.
export async function setInvoiceStatus(_prev: StatusState, formData: FormData): Promise<StatusState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { t } = await getRequestI18n();
  if (status !== "sent" && status !== "paid") return { error: t.invoices.errors.status };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("invoices").update({ status }).eq("id", id).select("id");
  if (error) return { error: dbErrorMessage(error.message, t) };
  if (!data?.length) return { error: t.invoices.errors.gone };

  refresh();
  return {};
}

export type EmailState = { error?: string; message?: string };

// Envoie la facture au client par email (PDF joint). Un brouillon passe ensuite
// à « envoyée » (et se fige) ; une facture déjà envoyée peut être renvoyée, pour une relance.
// La facture est relue avec les droits de la personne connectée : RLS empêche
// d'envoyer celle d'un autre freelance.
export async function emailInvoice(_prev: EmailState, formData: FormData): Promise<EmailState> {
  const id = String(formData.get("id") ?? "");
  const { supabase, user } = await requireUser();
  const { locale, t } = await getRequestI18n();
  const e = t.invoices.errors;
  const text = t.invoices.email;
  // Espace de démo : aucun email ne part (adresses fictives, pas d'envoi au nom du site).
  const demo = isDemoUser(user);

  const data = await loadFullInvoice(supabase, id, { withLogo: !demo });
  if (!data) return { error: e.gone };
  if (data.invoice.status === "paid") return { error: e.alreadyPaid };
  if (data.items.length === 0) return { error: e.noItems };
  const to = data.client.email.trim();
  if (!to) return { error: e.noClientEmail };

  // Email et PDF dans la langue choisie par le freelance au moment de l'envoi.
  if (!demo) {
    const sent = await sendInvoiceEmail(data, to, locale);
    if (!sent.ok) return { error: sent.error };
  }

  if (data.invoice.status === "draft") {
    const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", id);
    if (error) {
      refresh();
      return { error: fmt(text.statusFailed, { email: to }) };
    }
    // Le brouillon devient une facture figée : la page change de vue, le message passe par l'adresse.
    redirect(`/invoices/${id}?email=${demo ? "demo" : "sent"}`);
  }
  refresh();
  return { message: fmt(demo ? text.demo : text.sent, { email: to }) };
}
