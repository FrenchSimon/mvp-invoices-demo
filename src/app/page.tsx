import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { FREE_MONTHLY_INVOICES } from "@/lib/plan";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description:
    "Invoicing for freelancers: clients, PDF invoices sent by email, and a clear view of what is paid, pending or overdue.",
};

// Accueil (maquette A « Le carnet », validée par Léa) : accroche à gauche,
// facture d'exemple en feuille inclinée de 1° à droite, puis les deux formules.
// Page statique : une personne connectée qui clique « Se connecter » est
// renvoyée vers son tableau de bord par le proxy.
// cn() résout le conflit avec la taille de texte du bouton de base (comme PrimaryLink).
const primary = cn(buttonVariants(), "h-11 px-5 text-[17px] font-semibold no-underline text-primary-foreground");

export default function Home() {
  return (
    <div className="flex-1 overflow-x-hidden text-[17px] leading-relaxed">
      <header className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-5 sm:px-8">
        <Brand />
        <nav aria-label="Home" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#pricing" className="text-foreground no-underline hover:underline">
            Pricing
          </a>
          <Link href="/login" className="text-foreground no-underline hover:underline">
            Log in
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center rounded-md border border-primary px-4 font-semibold text-destructive no-underline hover:bg-card sm:inline-flex"
          >
            Start for free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-14 px-4 pt-14 pb-16 sm:px-8 sm:pt-18">
          <div className="min-w-0 flex-[1_1_420px]">
            <p className="mb-4 text-[15px] tracking-wide text-muted-foreground">
              For freelancers who work on their own
            </p>
            <h1 className="mb-6 text-4xl leading-[1.08] tracking-tight sm:text-[56px]">
              Your invoices, neatly kept. Your payments, finally tracked.
            </h1>
            <p className="mb-8 max-w-[34em] text-ink-soft">
              Save your clients, create a clean invoice in a minute, send it as a PDF, and see at a glance
              who has paid you.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/signup" className={primary}>
                Create my first invoice
              </Link>
              <span className="text-[15px] text-muted-foreground">Free, no credit card</span>
            </div>
          </div>
          <SampleInvoice />
        </section>

        <section id="pricing" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pb-20 sm:px-8">
          <div className="border-t border-border pt-12">
            <h2 className="mb-8 text-3xl sm:text-4xl">Two plans, no surprises</h2>
            <div className="flex flex-wrap">
              <Plan
                name="Free"
                price="€0"
                features={[
                  `${FREE_MONTHLY_INVOICES} invoices per month`,
                  "Unlimited clients",
                  "PDF and email sending",
                  "Paid, pending and overdue tracking",
                ]}
                className="pb-8 sm:border-r sm:border-border sm:pt-2 sm:pr-10 sm:pb-2"
              >
                <Link href="/signup" className="font-semibold">
                  Start for free
                </Link>
              </Plan>
              <Plan
                name="Pro"
                price="€9"
                per="per month"
                features={["Unlimited invoices", "Your logo on invoices", "Everything in the Free plan"]}
                className="border-t border-border pt-8 sm:border-t-0 sm:pt-2 sm:pl-10"
                highlight
              >
                <Link href="/signup" className={primary}>
                  Upgrade to Pro
                </Link>
              </Plan>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Plan({
  name,
  price,
  per,
  features,
  className,
  highlight = false,
  children,
}: {
  name: string;
  price: string;
  per?: string;
  features: string[];
  className?: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0 flex-[1_1_320px]", className)}>
      <h3 className={cn("font-sans text-lg font-semibold", highlight && "text-destructive")}>{name}</h3>
      <p className="mt-2 mb-4 font-heading text-[44px] leading-tight">
        {price}
        {per ? <span className="ml-2 font-sans text-[17px] text-muted-foreground">{per}</span> : null}
      </p>
      <ul className="mb-6 list-disc pl-5 text-ink-soft">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      {children}
    </div>
  );
}

// Facture d'exemple : une feuille du carnet, légèrement inclinée (DESIGN.md).
// Image décorative pour les lecteurs d'écran : le texte à côté dit déjà tout.
const SAMPLE_LINES = [
  { label: "Brand identity", qty: "1", amount: "€1,200.00" },
  { label: "Brand variations", qty: "3", amount: "€450.00" },
];

function SampleInvoice() {
  return (
    <div
      aria-hidden
      className="min-w-0 flex-[1_1_380px] rotate-1 border border-border bg-card px-6 py-8 text-sm tabular-nums sm:px-10 sm:py-9"
    >
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-[28px] leading-tight">Invoice</p>
          <p className="text-muted-foreground">No. 2026-014 · issued 4 Nov 2026</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary font-heading text-[26px] text-primary-foreground">
          B
        </span>
      </div>
      <p className="mb-6 text-ink-soft">To: Roche Studio · 12 Merchant’s Quay, Dublin 8</p>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] border-y border-t-rule-strong border-b-border py-2 font-semibold">
        <span>Description</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Amount</span>
      </div>
      {SAMPLE_LINES.map((l) => (
        <div key={l.label} className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] border-b border-border py-2">
          <span>{l.label}</span>
          <span className="text-right">{l.qty}</span>
          <span className="text-right">{l.amount}</span>
        </div>
      ))}
      <div className="flex justify-end gap-8 pt-4 text-ink-soft">
        <span>VAT 20%</span>
        <span>€330.00</span>
      </div>
      <div className="flex justify-end gap-8 pt-1.5 font-heading text-[22px]">
        <span>Total</span>
        <span>€1,980.00</span>
      </div>
    </div>
  );
}
