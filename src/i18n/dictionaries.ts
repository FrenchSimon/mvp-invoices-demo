import type { Locale } from "./config";
import { en } from "./en";
import { fr } from "./fr";

export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
