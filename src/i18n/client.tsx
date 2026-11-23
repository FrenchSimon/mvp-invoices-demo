"use client";

import { createContext, use, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";

type I18n = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18n | null>(null);

// Donne la langue et ses textes aux composants client (posé dans le layout racine).
export function I18nProvider({ locale, t, children }: I18n & { children: ReactNode }) {
  return <I18nContext value={{ locale, t }}>{children}</I18nContext>;
}

export function useI18n(): I18n {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n() needs <I18nProvider>.");
  return value;
}
