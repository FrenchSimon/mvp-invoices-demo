import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";

// Accueil provisoire : la vraie page d'accueil (facture d'exemple inclinée) viendra
// avec les finitions. Pour l'instant, l'accès à l'inscription et à la connexion.
export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-4 py-6 sm:px-8">
      <header className="pb-16">
        <Brand />
      </header>
      <main className="max-w-xl">
        <h1 className="text-4xl leading-tight">Vos factures, sans Word.</h1>
        <p className="mt-4 text-[17px] text-ink-soft">
          Enregistrez vos clients, créez une facture en une minute et voyez d&apos;un coup
          d&apos;œil ce qui est payé, en attente ou en retard.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            href="/signup"
            className={buttonVariants({ className: "h-10 px-4 text-base no-underline text-primary-foreground" })}
          >
            Créer un compte
          </Link>
          <Link href="/login">Se connecter</Link>
        </div>
      </main>
    </div>
  );
}
