import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadingLine, SecondaryLink, Sheet } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatDay, formatMoney, formatNumber } from "@/lib/format";
import { lineTotalCents } from "@/lib/invoices/totals";
import { requireUser } from "@/lib/supabase/user";
import { loadFullInvoice } from "@/lib/invoices/load";
import type { Client, Invoice, InvoiceItem, InvoiceSummary } from "@/lib/invoices/types";
import { Totals } from "../invoice-editor";
import { EmailButton } from "../email-button";
import { StatusActions } from "../status-actions";
import { DraftWorkspace } from "./draft-workspace";

export const metadata: Metadata = { title: "Invoice" };

export default function InvoicePage({ params, searchParams }: PageProps<"/invoices/[id]">) {
  return (
    <Suspense fallback={<LoadingLine />}>
      <InvoiceDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function InvoiceDetail({ params, searchParams }: Pick<PageProps<"/invoices/[id]">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // Arrivée juste après l'envoi d'un brouillon par email (voir emailInvoice).
  // « demo » : espace de démo, rien n'est vraiment envoyé.
  const justEmailed = query.email === "sent" || query.email === "demo" ? query.email : null;
  const { supabase } = await requireUser();

  // RLS : la facture d'un autre freelance n'est jamais renvoyée, donc 404.
  const data = await loadFullInvoice(supabase, id);
  if (!data) notFound();
  const { invoice, summary, items, client } = data;
  const title = `Invoice ${invoice.number}`;
  const badge = <StatusBadge status={summary.display_status} />;

  if (invoice.status === "draft") {
    const { data: clients } = await supabase.from("clients").select("id, name").order("name");
    return (
      <DraftWorkspace
        title={title}
        badge={badge}
        recipient={client.email.trim()}
        clients={clients ?? []}
        initial={{
          id: invoice.id,
          clientId: invoice.client_id,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          vatRate: invoice.vat_rate,
          notes: invoice.notes,
          lines: items.map((it) => ({
            description: it.description,
            quantity: formatNumber(it.quantity),
            price: (it.unit_price_cents / 100).toFixed(2),
          })),
        }}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-10">
      <Sheet className="min-w-0 flex-[999_1_600px]">
        <SentInvoice
          title={title}
          badge={badge}
          invoice={invoice}
          summary={summary}
          items={items}
          client={client}
          justEmailed={justEmailed}
        />
      </Sheet>
      <aside className="flex min-w-0 flex-[1_1_220px] flex-col gap-5">
        <StatusActions id={invoice.id} status={invoice.status} />
        <StatusHistory summary={summary} />
      </aside>
    </div>
  );
}

// Facture envoyée ou payée : contenu figé, affiché en lecture seule.
function SentInvoice({
  title,
  badge,
  invoice,
  summary,
  items,
  client,
  justEmailed,
}: {
  title: string;
  badge: ReactNode;
  invoice: Invoice;
  summary: InvoiceSummary;
  items: InvoiceItem[];
  client: Client;
  justEmailed: "sent" | "demo" | null;
}) {
  return (
    <>
      <div className="mb-8 flex flex-wrap justify-between gap-4">
        <div>
          <Link href="/invoices" className="text-sm">
            ← Invoices
          </Link>
          <h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end">
          {badge}
          <SecondaryLink href={`/invoices/${invoice.id}/pdf`} download>
            Download PDF
          </SecondaryLink>
          {invoice.status === "sent" ? (
            <EmailButton
              id={invoice.id}
              to={client.email.trim()}
              clientId={client.id}
              label="Resend by email"
              initialMessage={
                justEmailed === "demo"
                  ? `Demo: no email was sent to ${client.email.trim()}. The invoice is now marked as sent.`
                  : justEmailed
                    ? `Invoice sent to ${client.email.trim()}.`
                    : undefined
              }
            />
          ) : null}
        </div>
      </div>

      <dl className="mb-8 grid gap-5 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted-foreground">Client</dt>
          <dd>
            <Link href={`/clients/${client.id}`}>{client.name}</Link>
            {client.email ? <div className="text-sm text-ink-soft">{client.email}</div> : null}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Issue date</dt>
          <dd className="tabular-nums">{formatDate(invoice.issue_date)}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Due date</dt>
          <dd className={`tabular-nums ${summary.display_status === "overdue" ? "font-semibold text-destructive" : ""}`}>
            {formatDate(invoice.due_date)}
          </dd>
        </div>
      </dl>

      {/* Sur téléphone : quantité et prix unitaire passent sous la description. */}
      <div>
        <table className="w-full border-t border-rule-strong text-left tabular-nums">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="py-2 pr-3 font-semibold">Description</th>
              <th className="hidden py-2 pr-3 text-right font-semibold sm:table-cell">Qty</th>
              <th className="hidden py-2 pr-3 text-right font-semibold sm:table-cell">Unit price</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-border align-top">
                <td className="py-2.5 pr-3">
                  {it.description}
                  <span className="block text-sm text-muted-foreground sm:hidden">
                    {formatNumber(it.quantity)} × {formatMoney(it.unit_price_cents)}
                  </span>
                </td>
                <td className="hidden py-2.5 pr-3 text-right sm:table-cell">{formatNumber(it.quantity)}</td>
                <td className="hidden py-2.5 pr-3 text-right whitespace-nowrap sm:table-cell">
                  {formatMoney(it.unit_price_cents)}
                </td>
                <td className="py-2.5 text-right whitespace-nowrap">
                  {formatMoney(lineTotalCents({ quantity: it.quantity, unitPriceCents: it.unit_price_cents }))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-6 border-t border-border pt-5">
        <p className="max-w-sm whitespace-pre-line text-ink-soft">{invoice.notes}</p>
        <Totals
          subtotal={summary.subtotal_cents}
          vat={summary.vat_cents}
          total={summary.total_cents}
          rate={summary.vat_rate}
        />
      </div>
    </>
  );
}

function StatusHistory({ summary }: { summary: InvoiceSummary }) {
  return (
    <div className="text-sm text-muted-foreground">
      {summary.sent_at ? <p>Sent on {formatDay(summary.sent_at)}.</p> : null}
      {summary.paid_at ? <p>Paid on {formatDay(summary.paid_at)}.</p> : null}
      {summary.display_status === "overdue" ? (
        <p className="font-semibold text-destructive">
          Past due: {formatMoney(summary.total_cents)} to chase up.
        </p>
      ) : null}
    </div>
  );
}
