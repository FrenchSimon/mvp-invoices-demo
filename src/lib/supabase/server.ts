import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Client Supabase pour le serveur (Server Components, Server Actions, routes).
// Un nouveau client par requête : ne jamais le partager entre requêtes.
export async function createClient() {
  // Supabase compare l'heure (Date.now) à l'expiration du jeton. Avec le
  // préchargement partiel, Next.js refuse l'heure dans un rendu préparé à
  // l'avance : on attend donc la vraie requête avant de lire la session.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : les cookies ne peuvent pas
            // y être écrits. Le proxy rafraîchit la session à chaque requête.
          }
        },
      },
    },
  );
}
