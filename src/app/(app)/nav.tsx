"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/invoices", label: "Factures" },
  { href: "/clients", label: "Clients" },
  { href: "/settings", label: "Réglages" },
] as const;

// Onglets texte. Actif : gras + soulignement terracotta de 2 px (DESIGN.md).
// L'adresse n'est connue qu'à la requête : en attendant, les mêmes onglets sans onglet actif.
export function AppNav() {
  return (
    <Suspense fallback={<Tabs pathname={null} />}>
      <ActiveTabs />
    </Suspense>
  );
}

function ActiveTabs() {
  return <Tabs pathname={usePathname()} />;
}

function Tabs({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Navigation principale" className="flex flex-wrap gap-x-7 gap-y-1">
      {TABS.map((tab) => {
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
