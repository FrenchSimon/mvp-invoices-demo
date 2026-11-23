import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { DemoButton } from "@/components/demo-button";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { fmt } from "@/i18n/message";
import { getI18n } from "@/i18n/server";
import { formatDate, formatMoney, formatRate } from "@/lib/format";
import { FREE_MONTHLY_INVOICES } from "@/lib/plan";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { description: t.landing.metaDescription };
}

// Accueil (maquette A « Le carnet », validée par Léa) : accroche à gauche,
// facture d'exemple en feuille inclinée de 1° à droite, puis les deux formules.
// « Try the demo » ouvre un espace de démo sans inscription (startDemo).
// Page statique : une personne connectée qui clique « Se connecter » est
// renvoyée vers son tableau de bord par le proxy.
// cn() résout le conflit avec la taille de texte du bouton de base (comme PrimaryLink).
// Texte des boutons en 16 px : à 17 px, Source Sans 3 se place 2 px trop haut dans le bouton.
const primary = cn(buttonVariants(), "h-11 px-5 text-base font-semibold no-underline text-primary-foreground");
// Secondaire : même contour terracotta que « Start for free » dans l'en-tête.
const secondary =
  "inline-flex h-11 cursor-pointer items-center rounded-md border border-primary px-5 text-base font-semibold text-destructive hover:bg-card";

export default async function Home() {
  const { locale, t } = await getI18n();
  const l = t.landing;
  return (
    <div className="flex-1 overflow-x-hidden text-[17px] leading-relaxed">
      <header className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-5 sm:px-8">
        <Brand />
        <nav aria-label={l.navLabel} className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href="#pricing" className="text-foreground no-underline hover:underline">
            {l.pricing}
          </a>
          <Link href="/login" className="text-foreground no-underline hover:underline">
            {l.login}
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center rounded-md border border-primary px-4 text-base font-semibold text-destructive no-underline hover:bg-card sm:inline-flex"
          >
            {l.startFree}
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-14 px-4 pt-14 pb-16 sm:px-8 sm:pt-18">
          <div className="min-w-0 flex-[1_1_420px]">
            <p className="mb-4 text-[15px] tracking-wide text-muted-foreground">{l.eyebrow}</p>
            <h1 className="mb-6 text-4xl leading-[1.08] tracking-tight sm:text-[56px]">{l.heading}</h1>
            <p className="mb-8 max-w-[34em] text-ink-soft">{l.intro}</p>
            <div className="flex flex-wrap items-center gap-5">
              <Link href="/signup" className={primary}>
                {l.createFirst}
              </Link>
              <DemoButton className={secondary} />
              <span className="text-[15px] text-muted-foreground">{l.noCard}</span>
            </div>
          </div>
          <SampleInvoice locale={locale} t={t} />
        </section>

        <section id="pricing" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-4 pb-20 sm:px-8">
          <div className="border-t border-border pt-12">
            <h2 className="mb-8 text-3xl sm:text-4xl">{l.plansHeading}</h2>
            <div className="flex flex-wrap">
              <Plan
                name={l.free.name}
                price={l.free.price}
                features={l.free.features.map((f) => fmt(f, { count: FREE_MONTHLY_INVOICES }))}
                className="pb-8 sm:border-r sm:border-border sm:pt-2 sm:pr-10 sm:pb-2"
              >
                <Link href="/signup" className="font-semibold">
                  {l.startFree}
                </Link>
              </Plan>
              <Plan
                name={l.pro.name}
                price={l.pro.price}
                per={l.pro.per}
                features={l.pro.features}
                className="border-t border-border pt-8 sm:border-t-0 sm:pt-2 sm:pl-10"
                highlight
              >
                <Link href="/signup" className={primary}>
                  {l.pro.cta}
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
// Prix unitaires en centimes, mis en forme dans la langue de la page.
const SAMPLE_LINES = [
  { qty: 1, cents: 120000 },
  { qty: 3, cents: 15000 },
];
const SAMPLE_VAT_RATE = 20;
const SAMPLE_SUBTOTAL = 165000;
const SAMPLE_VAT = 33000;

function SampleInvoice({ locale, t }: { locale: Locale; t: Dictionary }) {
  const sample = t.landing.sample;
  const cols = t.invoices.editor;
  return (
    <div
      aria-hidden
      className="min-w-0 flex-[1_1_380px] rotate-1 border border-border bg-card px-6 py-8 text-sm tabular-nums sm:px-10 sm:py-9"
    >
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-[28px] leading-tight">{sample.title}</p>
          <p className="text-muted-foreground">{fmt(sample.meta, { date: formatDate("2026-11-04", locale) })}</p>
        </div>
        {/* pt-2 : même correction optique que le logo (Newsreader), à 26 px. */}
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary pt-2 font-heading text-[26px] text-primary-foreground">
          B
        </span>
      </div>
      <p className="mb-6 text-ink-soft">{sample.to}</p>
      <div className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] border-y border-t-rule-strong border-b-border py-2 font-semibold">
        <span>{cols.description}</span>
        <span className="text-right">{cols.qty}</span>
        <span className="text-right">{cols.amount}</span>
      </div>
      {SAMPLE_LINES.map((line, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] border-b border-border py-2">
          <span>{sample.lines[i]}</span>
          <span className="text-right">{line.qty}</span>
          <span className="text-right">{formatMoney(line.qty * line.cents, locale)}</span>
        </div>
      ))}
      <div className="flex justify-end gap-8 pt-4 text-ink-soft">
        <span>{fmt(t.invoices.totals.vatRate, { rate: formatRate(SAMPLE_VAT_RATE, locale) })}</span>
        <span>{formatMoney(SAMPLE_VAT, locale)}</span>
      </div>
      <div className="flex justify-end gap-8 pt-1.5 font-heading text-[22px]">
        <span>{sample.total}</span>
        <span>{formatMoney(SAMPLE_SUBTOTAL + SAMPLE_VAT, locale)}</span>
      </div>
    </div>
  );
}
