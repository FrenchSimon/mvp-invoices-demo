import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadFullInvoice } from "@/lib/invoices/load";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";

// Téléchargement du PDF d'une facture. Le PDF est fabriqué à la demande, avec
// les droits de la personne connectée : une facture d'un autre freelance donne 404.
// Langue du PDF : celle choisie dans la barre (segment [lang], rempli par le proxy).
export async function GET(_request: NextRequest, ctx: RouteContext<"/[lang]/invoices/[id]/pdf">) {
  const { lang, id } = await ctx.params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const t = getDictionary(locale).documents.pdf;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response(t.loginRequired, { status: 401 });

  const data = await loadFullInvoice(supabase, id, { withLogo: true });
  if (!data) return new Response(t.notFound, { status: 404 });

  const pdf = await renderInvoicePdf(data, locale);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFileName(data.invoice.number, locale)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
