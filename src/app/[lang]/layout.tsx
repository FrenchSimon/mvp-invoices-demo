import type { Metadata } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { notFound } from "next/navigation";
import { APP_NAME } from "@/components/brand";
import { PortfolioBar } from "@/components/portfolio-bar";
import { I18nProvider } from "@/i18n/client";
import { isLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import "../globals.css";

// Polices de DESIGN.md : titres à empattements, texte sans empattements.
const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Une version de chaque page par langue. Les adresses restent sans préfixe
// (/dashboard) : le proxy les range dans /en ou /fr selon le cookie « lang ».
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: getDictionary(lang).common.meta.description,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={lang} className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={lang} t={getDictionary(lang)}>
          <PortfolioBar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
