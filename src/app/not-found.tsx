import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = { title: "Page introuvable" };

// Adresse qui ne correspond à aucune page : pas de barre d'onglets, juste le logo.
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-6 sm:px-8">
      <header className="pb-10 sm:pb-16">
        <Brand />
      </header>
      <main>
        <NotFoundView />
      </main>
    </div>
  );
}
