"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/user";

export type SettingsState = {
  error?: string;
  message?: string;
  values?: { company_name: string; address: string; vat_number: string };
};

// Coordonnées de l'entreprise, reprises sur chaque facture PDF.
// La base n'autorise que ces trois colonnes (et le logo) depuis le navigateur.
export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const values = {
    company_name: String(formData.get("company_name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    vat_number: String(formData.get("vat_number") ?? "").trim(),
  };
  if (!values.company_name) return { error: "Indiquez le nom de votre entreprise.", values };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update(values).eq("id", user.id);
  if (error) return { error: "Les réglages n'ont pas pu être enregistrés. Réessayez.", values };

  refresh();
  return { message: "Réglages enregistrés.", values };
}
