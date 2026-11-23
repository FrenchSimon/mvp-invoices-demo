import { cookies } from "next/headers";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

// Langue de la page, lue dans le segment [lang] (le proxy y range chaque adresse
// selon le cookie). Pour les composants serveur, les layouts et generateMetadata.
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}

// Les actions serveur et les routes ne voient pas le segment [lang] : elles lisent
// le cookie, qui donne la même langue que la page (le proxy s'en sert pour router).
export async function getRequestI18n() {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, t: getDictionary(locale) };
}
