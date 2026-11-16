import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LoadingLine, PageHeader } from "@/components/page-header";
import { formatDay } from "@/lib/format";
import { requireUser } from "@/lib/supabase/user";

export const metadata: Metadata = { title: "Admin" };

type AdminUser = {
  id: string;
  email: string;
  company_name: string;
  plan: "free" | "pro";
  role: "user" | "admin";
  created_at: string;
  invoice_count: number;
  invoices_this_month: number;
};

// Tout le contenu attend la vérification : un compte non admin ne voit
// même pas le titre de la page, seulement la page « introuvable ».
export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingLine />}>
      <AdminUsers />
    </Suspense>
  );
}

async function AdminUsers() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("admin_list_users");

  // 42501 : la fonction refuse les comptes non admin (voir la migration).
  if (error?.code === "42501") notFound();
  if (error) return <p role="alert" className="text-destructive">The user list couldn&apos;t be loaded.</p>;

  const users = (data ?? []) as AdminUser[];
  const pro = users.filter((u) => u.plan === "pro").length;

  return (
    <>
      <PageHeader
        title="Users"
        intro={`${users.length} account${users.length > 1 ? "s" : ""}, ${pro} on Pro.`}
      />
      <table className="w-full border-t border-rule-strong text-left">
        <thead className="sr-only sm:not-sr-only">
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="py-3 pr-4 font-semibold">Account</th>
            <th className="py-3 pr-4 font-semibold">Plan</th>
            <th className="py-3 pr-4 text-right font-semibold">Invoices</th>
            <th className="py-3 pr-4 text-right font-semibold">This month</th>
            <th className="hidden py-3 text-right font-semibold md:table-cell">Signed up</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border align-top">
              <td className="py-3.5 pr-4">
                <div className="font-semibold break-all">{u.email || "(no email)"}</div>
                <div className="text-sm text-muted-foreground">
                  {u.company_name || "No business name"}
                  {u.role === "admin" ? " · admin" : ""}
                </div>
                <div className="text-sm text-muted-foreground sm:hidden">
                  {u.plan === "pro" ? "Pro" : "Free"} · {u.invoice_count} invoice{u.invoice_count === 1 ? "" : "s"},{" "}
                  {u.invoices_this_month} this month
                </div>
              </td>
              <td className="hidden py-3.5 pr-4 text-ink-soft sm:table-cell">{u.plan === "pro" ? "Pro" : "Free"}</td>
              <td className="hidden py-3.5 pr-4 text-right tabular-nums sm:table-cell">{u.invoice_count}</td>
              <td className="hidden py-3.5 pr-4 text-right tabular-nums sm:table-cell">{u.invoices_this_month}</td>
              <td className="hidden py-3.5 text-right text-ink-soft tabular-nums md:table-cell">
                {formatDay(u.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
