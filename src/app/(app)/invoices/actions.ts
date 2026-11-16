"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";
import { parseDecimal, parseEurosToCents } from "@/lib/format";
import { loadFullInvoice } from "@/lib/invoices/load";
import { VAT_RATES } from "@/lib/invoices/totals";
import { requireUser } from "@/lib/supabase/user";

// upgrade : la création est refusée par la limite du plan gratuit, l'éditeur propose Pro.
export type InvoiceFormState = { error?: string; message?: string; upgrade?: boolean };

// Ligne telle que saisie dans l'éditeur (texte brut, converti ici).
type RawLine = { description?: unknown; quantity?: unknown; price?: unknown };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function dbErrorMessage(message: string): string {
  if (message.includes("FREE_PLAN_LIMIT")) {
    return "You've used your 3 free invoices this month.";
  }
  if (message.includes("INVOICE_LOCKED")) return "This invoice has been sent and can no longer be edited.";
  if (message.includes("INVOICE_NOT_FOUND")) return "This invoice no longer exists.";
  if (message.includes("INVOICE_NO_ITEMS")) return "Add at least one line.";
  return "The invoice couldn't be saved. Try again.";
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

  if (!clientId) return { error: "Choose a client." };
  if (!ISO_DATE.test(issueDate) || !ISO_DATE.test(dueDate)) return { error: "Enter valid dates." };
  if (dueDate < issueDate) return { error: "The due date can't be before the issue date." };
  if (!(VAT_RATES as readonly number[]).includes(vatRate)) return { error: "Invalid VAT rate." };

  let raw: RawLine[];
  try {
    raw = JSON.parse(String(formData.get("items") ?? "[]"));
    if (!Array.isArray(raw)) throw new Error();
  } catch {
    return { error: "The invoice lines couldn't be read. Reload the page." };
  }

  const items = [];
  for (const [index, line] of raw.entries()) {
    const description = String(line.description ?? "").trim();
    const quantityText = String(line.quantity ?? "").trim();
    const priceText = String(line.price ?? "").trim();
    // Une ligne laissée entièrement vide est ignorée.
    if (!description && !priceText && (!quantityText || quantityText === "1")) continue;

    const n = index + 1;
    if (!description) return { error: `Line ${n}: add a description.` };
    const quantity = parseDecimal(quantityText);
    if (quantity === null || quantity <= 0 || quantity >= 100_000_000) {
      return { error: `Line ${n}: the quantity must be a positive number.` };
    }
    const unitPriceCents = parseEurosToCents(priceText);
    if (unitPriceCents === null) return { error: `Line ${n}: enter a price, for example 150.00.` };
    items.push({
      description,
      quantity: Math.round(quantity * 100) / 100,
      unit_price_cents: unitPriceCents,
    });
  }
  if (items.length === 0) return { error: "Add at least one line." };

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
  if (error) return { error: dbErrorMessage(error.message), upgrade: error.message.includes("FREE_PLAN_LIMIT") };

  if (!id) redirect(`/invoices/${data as string}`);
  refresh();
  return { message: "Draft saved." };
}

export type StatusState = { error?: string };

// Changement de statut : envoyée, payée, ou retour à « envoyée » (annuler le paiement).
// La base refuse le retour au brouillon et fixe elle-même les dates d'envoi et de paiement.
export async function setInvoiceStatus(_prev: StatusState, formData: FormData): Promise<StatusState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "sent" && status !== "paid") return { error: "Invalid status." };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("invoices").update({ status }).eq("id", id).select("id");
  if (error) return { error: dbErrorMessage(error.message) };
  if (!data?.length) return { error: "This invoice no longer exists." };

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
  const { supabase } = await requireUser();

  const data = await loadFullInvoice(supabase, id, { withLogo: true });
  if (!data) return { error: "This invoice no longer exists." };
  if (data.invoice.status === "paid") return { error: "This invoice is already paid." };
  if (data.items.length === 0) return { error: "Add at least one line." };
  const to = data.client.email.trim();
  if (!to) return { error: "This client has no email. Add one on their page." };

  const sent = await sendInvoiceEmail(data, to);
  if (!sent.ok) return { error: sent.error };

  if (data.invoice.status === "draft") {
    const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", id);
    if (error) {
      refresh();
      return { error: `Email sent to ${to}, but the status couldn't be changed to “Sent”. Do it on the right.` };
    }
    // Le brouillon devient une facture figée : la page change de vue, le message passe par l'adresse.
    redirect(`/invoices/${id}?email=sent`);
  }
  refresh();
  return { message: `Invoice sent to ${to}.` };
}
