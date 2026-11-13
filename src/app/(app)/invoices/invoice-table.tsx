import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatMoney } from "@/lib/format";
import type { InvoiceSummary } from "@/lib/invoices/types";

// Liste de factures en tableau à filets (page Factures et tableau de bord).
export function InvoiceTable({ invoices }: { invoices: InvoiceSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-t border-rule-strong text-left">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="py-3 pr-4 font-semibold">N°</th>
            <th className="py-3 pr-4 font-semibold">Client</th>
            <th className="py-3 pr-4 font-semibold">Émise le</th>
            <th className="py-3 pr-4 font-semibold">Échéance</th>
            <th className="py-3 pr-4 text-right font-semibold">Montant TTC</th>
            <th className="py-3 font-semibold">Statut</th>
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
    </div>
  );
}
