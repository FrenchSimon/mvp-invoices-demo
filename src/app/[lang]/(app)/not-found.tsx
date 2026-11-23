import type { Metadata } from "next";
import { NotFoundView } from "@/components/not-found-view";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.common.notFound.title };
}

// notFound() appelé dans l'espace connecté (ex. /admin pour un non-admin,
// facture d'un autre compte) : la 404 s'affiche sous la barre d'onglets.
export default function AppNotFound() {
  return <NotFoundView />;
}
