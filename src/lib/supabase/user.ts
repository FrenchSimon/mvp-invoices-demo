import { redirect } from "next/navigation";
import { createClient } from "./server";

// Client Supabase + utilisateur vérifié. Sans session : retour à la connexion.
// La sécurité réelle reste dans la base (RLS) : ce contrôle évite seulement
// d'afficher une page vide à quelqu'un dont la session a expiré.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Le compte connecté est-il admin ? Sert seulement à l'affichage (onglet, page) :
// la base refuse de toute façon admin_list_users() à un compte non admin.
// Toute erreur compte comme « pas admin ».
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("is_admin");
    return !error && data === true;
  } catch {
    return false;
  }
}
