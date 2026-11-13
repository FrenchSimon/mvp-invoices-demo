"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { sendInvoiceEmail } from "@/lib/email/send-invoice";
import { parseDecimal, parseEurosToCents } from "@/lib/format";
import { loadFullInvoice } from "@/lib/invoices/load";
import { VAT_RATES } from "@/lib/invoices/totals";
import { requireUser } from "@/lib/supabase/user";

export type InvoiceFormState = { error?: string; message?: string };

// Ligne telle que saisie dans l'éditeur (texte brut, converti ici).
type RawLine = { description?: unknown; quantity?: unknown; price?: unknown };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function dbErrorMessage(message: string): string {
  if (message.includes("FREE_PLAN_LIMIT")) {
    return "Le plan gratuit permet 3 factures par mois. Passez à Pro pour en créer davantage.";
  }
  if (message.includes("INVOICE_LOCKED")) return "Cette facture a été envoyée : elle ne peut plus être modifiée.";
  if (message.includes("INVOICE_NOT_FOUND")) return "Cette facture n'existe plus.";
  if (message.includes("INVOICE_NO_ITEMS")) return "Ajoutez au moins une ligne.";
  return "La facture n'a pas pu être enregistrée. Réessayez.";
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

  if (!clientId) return { error: "Choisissez un client." };
  if (!ISO_DATE.test(issueDate) || !ISO_DATE.test(dueDate)) return { error: "Indiquez des dates valides." };
  if (dueDate < issueDate) return { error: "L'échéance ne peut pas être avant la date d'émission." };
  if (!(VAT_RATES as readonly number[]).includes(vatRate)) return { error: "Taux de TVA invalide." };

  let raw: RawLine[];
  try {
    raw = JSON.parse(String(formData.get("items") ?? "[]"));
    if (!Array.isArray(raw)) throw new Error();
  } catch {
    return { error: "Les lignes de la facture sont illisibles. Rechargez la page." };
  }

  const items = [];
  for (const [index, line] of raw.entries()) {
    const description = String(line.description ?? "").trim();
    const quantityText = String(line.quantity ?? "").trim();
    const priceText = String(line.price ?? "").trim();
    // Une ligne laissée entièrement vide est ignorée.
    if (!description && !priceText && (!quantityText || quantityText === "1")) continue;

    const n = index + 1;
    if (!description) return { error: `Ligne ${n} : ajoutez une description.` };
    const quantity = parseDecimal(quantityText);
    if (quantity === null || quantity <= 0 || quantity >= 100_000_000) {
      return { error: `Ligne ${n} : la quantité doit être un nombre positif.` };
    }
    const unitPriceCents = parseEurosToCents(priceText);
    if (unitPriceCents === null) return { error: `Ligne ${n} : indiquez un prix, par exemple 150,00.` };
    items.push({
      description,
      quantity: Math.round(quantity * 100) / 100,
      unit_price_cents: unitPriceCents,
    });
  }
  if (items.length === 0) return { error: "Ajoutez au moins une ligne." };

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
  if (error) return { error: dbErrorMessage(error.message) };

  if (!id) redirect(`/invoices/${data as string}`);
  refresh();
  return { message: "Brouillon enregistré." };
}

export type StatusState = { error?: string };

// Changement de statut : envoyée, payée, ou retour à « envoyée » (annuler le paiement).
// La base refuse le retour au brouillon et fixe elle-même les dates d'envoi et de paiement.
export async function setInvoiceStatus(_prev: StatusState, formData: FormData): Promise<StatusState> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (status !== "sent" && status !== "paid") return { error: "Statut invalide." };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("invoices").update({ status }).eq("id", id).select("id");
  if (error) return { error: dbErrorMessage(error.message) };
  if (!data?.length) return { error: "Cette facture n'existe plus." };

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

  const data = await loadFullInvoice(supabase, id);
  if (!data) return { error: "Cette facture n'existe plus." };
  if (data.invoice.status === "paid") return { error: "Cette facture est déjà payée." };
  if (data.items.length === 0) return { error: "Ajoutez au moins une ligne." };
  const to = data.client.email.trim();
  if (!to) return { error: "Ce client n'a pas d'email. Ajoutez-le sur sa fiche." };

  const sent = await sendInvoiceEmail(data, to);
  if (!sent.ok) return { error: sent.error };

  if (data.invoice.status === "draft") {
    const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", id);
    if (error) {
      refresh();
      return { error: `Email envoyé à ${to}, mais le statut n'a pas pu passer à « envoyée ». Faites-le à droite.` };
    }
    // Le brouillon devient une facture figée : la page change de vue, le message passe par l'adresse.
    redirect(`/invoices/${id}?email=envoye`);
  }
  refresh();
  return { message: `Facture envoyée à ${to}.` };
}
