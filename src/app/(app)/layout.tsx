import { Brand } from "@/components/brand";
import { logout } from "../(auth)/actions";

// Espace connecté. Les onglets (Tableau de bord, Factures, Clients, Réglages)
// arrivent avec le parcours 1. Le proxy renvoie vers /login sans session.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-4 py-4 sm:px-8">
          <Brand />
          <form action={logout}>
            <button type="submit" className="text-base text-destructive hover:underline">
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
