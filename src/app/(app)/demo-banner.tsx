import { createClient } from "@/lib/supabase/server";
import { isDemoUser } from "@/lib/supabase/user";

// Bandeau de l'espace de démo (bouton « Try the demo » de l'accueil).
// Affiché après la barre, avec la requête : la barre n'attend pas la session.
export async function DemoBanner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isDemoUser(user)) return null;
  return (
    <div role="note" className="border-b border-border bg-card">
      <p className="mx-auto w-full max-w-[1120px] px-4 py-2.5 text-[15px] text-ink-soft sm:px-8">
        <span className="font-semibold text-foreground">Demo workspace.</span> Sample data only: no email
        is sent, payments use Stripe test mode, and everything is deleted after 24 hours.
      </p>
    </div>
  );
}
