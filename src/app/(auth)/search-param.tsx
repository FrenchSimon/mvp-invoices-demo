"use client";

import { useSearchParams } from "next/navigation";

// Lisent l'URL dans le navigateur. Placés dans un <Suspense> pour que le reste
// de la page reste statique (Cache Components).

export function NextInput() {
  const next = useSearchParams().get("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

export function LinkErrorNotice() {
  if (useSearchParams().get("error") !== "lien") return null;
  return (
    <p role="alert" className="mb-5 text-sm text-destructive">
      Ce lien n&apos;est plus valable (déjà utilisé, expiré ou ouvert dans un autre navigateur).
      Connectez-vous, ou demandez un nouveau lien.
    </p>
  );
}
