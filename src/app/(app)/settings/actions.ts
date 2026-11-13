"use server";

import { refresh } from "next/cache";
import { LOGO_MAX_BYTES } from "@/lib/logo";
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

export type LogoState = { error?: string; message?: string };

// Signature des formats acceptés, vérifiée sur le contenu et pas seulement sur
// le type annoncé par le navigateur : le PDF ne sait afficher que PNG et JPEG.
function logoExtension(bytes: Uint8Array): "png" | "jpg" | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

// Point 10 : logo sur le PDF, formule Pro. La base refuse de toute façon
// l'envoi d'un logo par un compte gratuit (règles de l'espace « logos »).
export async function uploadLogo(_prev: LogoState, formData: FormData): Promise<LogoState> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez une image." };
  if (file.size > LOGO_MAX_BYTES) return { error: "Le logo dépasse 500 Ko. Choisissez une image plus légère." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = logoExtension(bytes);
  if (!ext) return { error: "Le logo doit être une image PNG ou JPEG." };

  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("plan, logo_path").eq("id", user.id).single();
  if (profile?.plan !== "pro") return { error: "Le logo sur le PDF est réservé à la formule Pro." };

  // Nouveau nom à chaque envoi : l'ancien fichier n'est supprimé qu'une fois le nouveau enregistré.
  const path = `${user.id}/logo-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, bytes, { contentType: ext === "png" ? "image/png" : "image/jpeg" });
  if (uploadError) {
    console.error("[settings] logo upload", uploadError);
    return { error: "Le logo n'a pas pu être envoyé. Réessayez." };
  }

  const { error } = await supabase.from("profiles").update({ logo_path: path }).eq("id", user.id);
  if (error) {
    await supabase.storage.from("logos").remove([path]);
    return { error: "Le logo n'a pas pu être enregistré. Réessayez." };
  }
  if (profile.logo_path) await supabase.storage.from("logos").remove([profile.logo_path]);

  refresh();
  return { message: "Logo enregistré. Il apparaît sur vos prochains PDF." };
}

export async function removeLogo(): Promise<LogoState> {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("logo_path").eq("id", user.id).single();
  if (!profile?.logo_path) return {};

  const { error } = await supabase.from("profiles").update({ logo_path: null }).eq("id", user.id);
  if (error) return { error: "Le logo n'a pas pu être retiré. Réessayez." };
  await supabase.storage.from("logos").remove([profile.logo_path]);

  refresh();
  return { message: "Logo retiré." };
}
