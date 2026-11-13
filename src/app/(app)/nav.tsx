"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/invoices", label: "Factures" },
  { href: "/clients", label: "Clients" },
  { href: "/settings", label: "Réglages" },
] as const;

// Visible seulement pour le rôle admin (DESIGN.md).
const ADMIN_TAB = { href: "/admin", label: "Admin" } as const;

// Onglets texte. Actif : gras + soulignement terracotta de 2 px (DESIGN.md).
// L'adresse et le rôle ne sont connus qu'à la requête : en attendant, les onglets
// communs sans onglet actif.
export function AppNav({ isAdmin }: { isAdmin: Promise<boolean> }) {
  return (
    <Suspense fallback={<Tabs pathname={null} admin={false} />}>
      <ActiveTabs isAdmin={isAdmin} />
    </Suspense>
  );
}

function ActiveTabs({ isAdmin }: { isAdmin: Promise<boolean> }) {
  return <Tabs pathname={usePathname()} admin={use(isAdmin)} />;
}

function Tabs({ pathname, admin }: { pathname: string | null; admin: boolean }) {
  const tabs = admin ? [...TABS, ADMIN_TAB] : TABS;
  return (
    <nav aria-label="Navigation principale" className="flex flex-wrap gap-x-7 gap-y-1">
      {tabs.map((tab) => {
        const active = pathname !== null && (pathname === tab.href || pathname.startsWith(`${tab.href}/`));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "border-b-2 pt-2 pb-3 no-underline",
              active
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-ink-soft hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
