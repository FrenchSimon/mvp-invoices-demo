"use client";

import { useI18n } from "@/i18n/client";

// Ligne « Chargement… » des <Suspense>. Composant client : il sert aussi de repli
// pendant le chargement, sans attendre le serveur.
export function LoadingLine() {
  const { t } = useI18n();
  return <p className="text-muted-foreground">{t.common.loading}</p>;
}
