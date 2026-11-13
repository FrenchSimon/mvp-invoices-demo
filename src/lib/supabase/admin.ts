import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client Supabase avec la clé secrète : contourne RLS et les droits par colonne.
// Serveur uniquement (webhook Stripe, synchronisation du plan). Ne jamais
// l'importer dans un composant client, ni s'en servir pour lire les données
// d'un freelance à sa place.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY manquante.");
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
