// Adresse où renvoyer après la connexion. On n'accepte qu'un chemin interne
// (« /dashboard », « /invoices/123 ») pour éviter les redirections vers un autre site.
// On passe par URL, qui retire tabulations et retours à la ligne (« /\t/evil.com »
// deviendrait « //evil.com »), puis on vérifie que l'adresse reste sur le site.
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  const base = "http://site.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
