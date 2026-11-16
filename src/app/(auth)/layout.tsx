import { Brand } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";

// Pages de connexion : le logo en haut à gauche, une feuille étroite alignée à gauche
// du contenu (pas de grand titre centré, voir DESIGN.md).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-6 pb-16 sm:px-8">
        <header className="pb-10 sm:pb-16">
          <Brand />
        </header>
        <main className="w-full max-w-md">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
