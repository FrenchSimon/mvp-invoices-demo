import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import type { InvoiceSummary } from "@/lib/invoices/types";

// Liste de factures en tableau à filets (page Factures et tableau de bord).
// Sur téléphone, le tableau devient une liste à filets sur deux lignes :
// numéro et montant en haut, client, échéance et statut en dessous.
export function InvoiceTable({ invoices }: { invoices: InvoiceSummary[] }) {
  return (
    <>
      <ul className="border-t border-rule-strong tabular-nums sm:hidden">
        {invoices.map((inv) => (
          <li key={inv.id} className="border-b border-border py-3">
            <div className="flex items-baseline justify-between gap-4">
              <Link href={`/invoices/${inv.id}`} className="font-semibold">
                {inv.number}
              </Link>
              <span className={`whitespace-nowrap ${inv.display_status === "overdue" ? "text-destructive" : ""}`}>
                {formatMoney(inv.total_cents)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-4 text-sm text-ink-soft">
              <span className="min-w-0 truncate">
                {inv.client_name} · due {formatDate(inv.due_date)}
              </span>
              <StatusBadge status={inv.display_status} />
            </div>
          </li>
        ))}
      </ul>
      <table className="hidden w-full border-t border-rule-strong text-left sm:table">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="py-3 pr-4 font-semibold">No.</th>
            <th className="py-3 pr-4 font-semibold">Client</th>
            <th className="py-3 pr-4 font-semibold">Issued</th>
            <th className="py-3 pr-4 font-semibold">Due</th>
            <th className="py-3 pr-4 text-right font-semibold">Total</th>
            <th className="py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border">
              <td className="py-3.5 pr-4">
                <Link href={`/invoices/${inv.id}`} className="font-semibold">
                  {inv.number}
                </Link>
              </td>
              <td className="py-3.5 pr-4">{inv.client_name}</td>
              <td className="py-3.5 pr-4">{formatDate(inv.issue_date)}</td>
              <td className="py-3.5 pr-4">{formatDate(inv.due_date)}</td>
              <td
                className={`py-3.5 pr-4 text-right whitespace-nowrap ${inv.display_status === "overdue" ? "text-destructive" : ""}`}
              >
                {formatMoney(inv.total_cents)}
              </td>
              <td className="py-3.5">
                <StatusBadge status={inv.display_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
