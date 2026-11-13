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
