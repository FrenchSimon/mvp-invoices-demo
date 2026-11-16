"use client";

import { useSearchParams } from "next/navigation";

// Lisent l'URL dans le navigateur. Placés dans un <Suspense> pour que le reste
// de la page reste statique (Cache Components).

export function NextInput() {
  const next = useSearchParams().get("next");
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

export function LinkErrorNotice() {
  if (useSearchParams().get("error") !== "link") return null;
  return (
    <p role="alert" className="mb-5 text-sm text-destructive">
      This link is no longer valid (already used, expired or opened in another browser). Log in, or
      request a new link.
    </p>
  );
}
