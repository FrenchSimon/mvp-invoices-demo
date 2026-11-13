import { Brand } from "@/components/brand";
import { logout } from "../(auth)/actions";
import { AppNav } from "./nav";

// Espace connecté : logo à gauche, onglets à droite. Le proxy renvoie vers /login sans session.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-end justify-between gap-x-6 gap-y-2 px-4 pt-4 sm:px-8">
          <div className="pb-3">
            <Brand />
          </div>
          <div className="flex flex-wrap items-end gap-x-7">
            <AppNav />
            <form action={logout} className="pb-3">
              <button type="submit" className="text-base text-destructive hover:underline">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
