"use client";

import { useI18n } from "@/i18n/client";
import type { DisplayStatus } from "@/lib/invoices/types";
import { cn } from "@/lib/utils";

// Statut d'une facture : toujours un libellé, jamais la couleur seule (DESIGN.md).
const STATUS_CLASSES: Record<DisplayStatus, string> = {
  draft: "bg-status-draft text-status-draft-foreground",
  sent: "bg-status-sent text-status-sent-foreground",
  paid: "bg-status-paid text-status-paid-foreground",
  overdue: "bg-status-overdue text-status-overdue-foreground",
};

export function StatusBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const { t } = useI18n();
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {t.common.status[status]}
    </span>
  );
}
