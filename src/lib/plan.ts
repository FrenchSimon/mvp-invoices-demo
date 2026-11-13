import type { SupabaseClient } from "@supabase/supabase-js";

// Plan gratuit : 3 factures créées par mois calendaire (checklist, point 8).
// La vraie limite est dans la base (before_invoice_insert) ; ce chiffre sert à
// prévenir avant que la création soit refusée.
export const FREE_MONTHLY_INVOICES = 3;

export type PlanUsage = { plan: "free" | "pro"; usedThisMonth: number; limitReached: boolean };

export async function getPlanUsage(supabase: SupabaseClient, userId: string): Promise<PlanUsage> {
  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).single();
  const plan = profile?.plan === "pro" ? "pro" : "free";

  // Même mois que la base : date_trunc('month', now()) sur un serveur en UTC.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .gte("created_at", monthStart);
  const usedThisMonth = count ?? 0;

  return { plan, usedThisMonth, limitReached: plan === "free" && usedThisMonth >= FREE_MONTHLY_INVOICES };
}
