import { Brand } from "@/components/brand";
import { isAdmin } from "@/lib/supabase/user";
import { logout } from "../(auth)/actions";
import { AppNav } from "./nav";

// Espace connecté : logo à gauche, onglets à droite. Le proxy renvoie vers /login sans session.
export default function AppLayout({ children }: LayoutProps<"/">) {
  // Pas attendu ici : la barre s'affiche tout de suite, l'onglet Admin arrive avec la requête.
  const admin = isAdmin();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 pt-4 sm:px-8">
          <div className="pb-3">
            <Brand />
          </div>
          {/* Sur téléphone : « Se déconnecter » à droite du logo, les onglets sur leur propre ligne. */}
          <div className="order-3 flex w-full flex-wrap items-end gap-x-7 sm:order-2 sm:ml-auto sm:w-auto">
            <AppNav isAdmin={admin} />
          </div>
          <form action={logout} className="order-2 pb-3 sm:order-3">
            <button type="submit" className="text-base text-destructive hover:underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
