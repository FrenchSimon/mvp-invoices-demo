import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALES,
  type Locale,
} from "@/i18n/config";

// Pages réservées aux utilisateurs connectés.
const PROTECTED_PREFIXES = ["/dashboard", "/clients", "/invoices", "/settings", "/admin", "/pro"];
// Pages inutiles une fois connecté : on renvoie vers le tableau de bord.
const GUEST_ONLY = ["/login", "/signup"];
// Routes hors du segment [lang] (lien de confirmation des emails) : jamais réécrites.
const NOT_LOCALIZED = ["/auth/", "/api/"];

const startsWithSegment = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}

// Choix de langue venu de l'adresse : ?lang=fr (lien FR / EN de la barre, ou lien
// direct depuis le portfolio) ou préfixe /fr/… On pose le cookie et on renvoie
// vers l'adresse propre, sans paramètre ni préfixe. null : rien à faire.
function localeRedirect(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const query = url.searchParams.get("lang");
  const prefix = LOCALES.find((l) => startsWithSegment(url.pathname, `/${l}`));
  if (!isLocale(query) && !prefix) return null;

  const locale = isLocale(query) ? query : prefix!;
  url.searchParams.delete("lang");
  if (prefix) url.pathname = url.pathname.slice(prefix.length + 1) || "/";
  const response = NextResponse.redirect(url);
  setLocaleCookie(response, locale);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localized = !NOT_LOCALIZED.some((prefix) => pathname.startsWith(prefix));

  if (localized) {
    const redirect = localeRedirect(request);
    if (redirect) return redirect;
  }

  // Chaque page existe en /en/… et /fr/… (segment [lang]) : l'adresse visible reste
  // /dashboard, rangée dans la langue du cookie (anglais par défaut).
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;
  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const pass = () =>
    localized ? NextResponse.rewrite(destination, { request }) : NextResponse.next({ request });

  let response = pass();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = pass();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Rafraîchit la session si besoin. getUser() vérifie le jeton auprès de Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) => startsWithSegment(pathname, prefix));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && GUEST_ONLY.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    // Garder les cookies de session éventuellement rafraîchis par getUser().
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques, les images et le webhook Stripe.
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
