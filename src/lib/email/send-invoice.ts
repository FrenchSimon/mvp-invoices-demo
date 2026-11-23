import { Resend } from "resend";
import { APP_NAME } from "@/components/brand";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/message";
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
  return name.replace(/[<>",;\r\n]/g, " ").replace(/\s+/g, " ").trim() || "Invoicing";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Email dans la langue choisie par le freelance au moment de l'envoi.
export function invoiceEmailContent(data: FullInvoice, locale: Locale) {
  const { invoice, summary, company } = data;
  const t = getDictionary(locale).documents.email;
  const from = company.company_name.trim() || t.yourSupplier;
  const subject = fmt(t.subject, { number: invoice.number, from });
  const paragraphs = [
    t.hello,
    fmt(t.body, {
      number: invoice.number,
      amount: formatMoney(summary.total_cents, locale),
      date: formatDate(invoice.due_date, locale),
    }),
    t.thanks,
    from,
  ];
  // Mention discrète de l'app en bas, après la signature du freelance.
  const footer = fmt(t.footer, { app: APP_NAME });
  const text = [...paragraphs, "--", footer].join("\n\n");
  const html = `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2b2622">${paragraphs
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p)}</p>`)
    .join("")}<p style="margin:24px 0 0;font-size:13px;color:#6b5f55">${escapeHtml(footer)}</p></div>`;
  return { subject, text, html };
}

// Traduit les refus de Resend en message lisible par le freelance.
function resendErrorMessage(message: string, locale: Locale): string {
  const t = getDictionary(locale).documents.email;
  if (/own email address|verify a domain|domain is not verified/i.test(message)) return t.notEnabled;
  if (/rate limit|too many/i.test(message)) return t.rateLimit;
  return t.failed;
}

export async function sendInvoiceEmail(data: FullInvoice, to: string, locale: Locale): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: getDictionary(locale).documents.email.notConfigured };

  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const { subject, text, html } = invoiceEmailContent(data, locale);
  const pdf = await renderInvoicePdf(data, locale);

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: `${displayName(data.company.company_name)} <${fromEmail}>`,
    to,
    replyTo: data.company.email || undefined,
    subject,
    text,
    html,
    attachments: [{ filename: invoiceFileName(data.invoice.number, locale), content: pdf, contentType: "application/pdf" }],
  });
  if (error) {
    console.error("[email facture] refus de Resend :", error.name, error.message);
    return { ok: false, error: resendErrorMessage(error.message, locale) };
  }
  return { ok: true };
}
