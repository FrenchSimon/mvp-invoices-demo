import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadFullInvoice } from "@/lib/invoices/load";
import { invoiceFileName, renderInvoicePdf } from "@/lib/pdf/invoice-pdf";

// Téléchargement du PDF d'une facture. Le PDF est fabriqué à la demande, avec
// les droits de la personne connectée : une facture d'un autre freelance donne 404.
export async function GET(_request: NextRequest, ctx: RouteContext<"/invoices/[id]/pdf">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Login required.", { status: 401 });

  const data = await loadFullInvoice(supabase, id, { withLogo: true });
  if (!data) return new Response("Invoice not found.", { status: 404 });

  const pdf = await renderInvoicePdf(data);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFileName(data.invoice.number)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
