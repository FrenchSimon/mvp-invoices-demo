"use client";

import { useSearchParams } from "next/navigation";
import { useI18n } from "@/i18n/client";

// Lisent l'URL dans le navigateur. Placés dans un <Suspense> pour que le reste
// de la page reste statique (Cache Components).

export function NextInput() {
  const next = useSearchParams().get("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

export function LinkErrorNotice() {
  const { t } = useI18n();
  if (useSearchParams().get("error") !== "link") return null;
  return (
    <p role="alert" className="mb-5 text-sm text-destructive">
      {t.auth.login.linkError}
    </p>
  );
}
