import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";

export const metadata: Metadata = { title: "Page introuvable" };

// notFound() appelé dans l'espace connecté (ex. /admin pour un non-admin,
// facture d'un autre compte) : la 404 s'affiche sous la barre d'onglets.
export default function AppNotFound() {
  return <NotFoundView />;
}
