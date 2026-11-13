// Adresse où renvoyer après la connexion. On n'accepte qu'un chemin interne
// (« /dashboard », « /invoices/123 ») pour éviter les redirections vers un autre site.
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
