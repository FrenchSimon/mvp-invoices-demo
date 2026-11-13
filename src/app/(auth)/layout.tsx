import { Brand } from "@/components/brand";

// Pages de connexion : le logo en haut à gauche, une feuille étroite alignée à gauche
// du contenu (pas de grand titre centré, voir DESIGN.md).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-6 sm:px-8">
      <header className="pb-10 sm:pb-16">
        <Brand />
      </header>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
