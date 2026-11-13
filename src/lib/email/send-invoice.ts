import { Resend } from "resend";
import { formatDate, formatMoney } from "@/lib/format";
import type { FullInvoice } from "@/lib/invoices/load";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";

// Envoi d'une facture au client par Resend, avec le PDF en pièce jointe.
// Ne s'appelle que côté serveur : la clé RESEND_API_KEY ne doit jamais partir au navigateur.
//
// Expéditeur : RESEND_FROM_EMAIL (adresse d'un domaine vérifié chez Resend). Sans domaine
// vérifié, Resend n'accepte que onboarding@resend.dev et seulement vers l'adresse du compte
// Resend : suffisant pour la démo, à remplacer par le domaine de Léa en production.
// Le nom affiché est celui de l'entreprise, et les réponses vont à son email (réglages).

export type SendResult = { ok: true } | { ok: false; error: string };

const DEFAULT_FROM_EMAIL = "onboarding@resend.dev";

// Nom affiché dans « De : » : sans caractères qui casseraient l'en-tête.
function displayName(name: string): string {
  return name.replace(/[<>",;\r\n]/g, " ").replace(/\s+/g, " ").trim() || "Facturation";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function invoiceEmailContent(data: FullInvoice) {
  const { invoice, summary, company } = data;
  const from = company.company_name.trim() || "Votre prestataire";
  const subject = `Facture ${invoice.number} – ${from}`;
  const paragraphs = [
    "Bonjour,",
    `Vous trouverez ci-joint la facture ${invoice.number} d'un montant de ${formatMoney(summary.total_cents)} TTC, à régler avant le ${formatDate(invoice.due_date)}.`,
    "Merci et bonne journée,",
    from,
  ];
  const text = paragraphs.join("\n\n");
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2622">${paragraphs
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p)}</p>`)
    .join("")}</div>`;
  return { subject, text, html };
}

// Traduit les refus de Resend en message lisible par le freelance.
function resendErrorMessage(message: string): string {
  if (/own email address|verify a domain|domain is not verified/i.test(message)) {
    return "L'envoi n'est pas encore ouvert vers cette adresse : il faut d'abord vérifier un domaine d'envoi.";
  }
  if (/rate limit|too many/i.test(message)) return "Trop d'envois d'un coup. Réessayez dans une minute.";
  return "L'email n'a pas pu être envoyé. Réessayez dans un instant.";
}

export async function sendInvoiceEmail(data: FullInvoice, to: string): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "L'envoi par email n'est pas configuré sur ce serveur." };

  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const { subject, text, html } = invoiceEmailContent(data);
  const pdf = await renderInvoicePdf(data);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${displayName(data.company.company_name)} <${fromEmail}>`,
    to,
    replyTo: data.company.email || undefined,
    subject,
    text,
    html,
    attachments: [{ filename: invoiceFileName(data.invoice.number), content: pdf, contentType: "application/pdf" }],
  });
  if (error) {
    console.error("[email facture] refus de Resend :", error.name, error.message);
    return { ok: false, error: resendErrorMessage(error.message) };
  }
  return { ok: true };
}
