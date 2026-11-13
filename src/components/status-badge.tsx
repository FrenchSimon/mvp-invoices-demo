import type { DisplayStatus } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";

// Statut d'une facture : toujours un libellé, jamais la couleur seule (DESIGN.md).
export const STATUS_LABELS: Record<DisplayStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  overdue: "En retard",
};

const STATUS_CLASSES: Record<DisplayStatus, string> = {
  draft: "bg-status-draft text-status-draft-foreground",
  sent: "bg-status-sent text-status-sent-foreground",
  paid: "bg-status-paid text-status-paid-foreground",
  overdue: "bg-status-overdue text-status-overdue-foreground",
};

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
