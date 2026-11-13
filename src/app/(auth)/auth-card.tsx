import type { ReactNode } from "react";

// La « feuille » qui porte un formulaire : fond --card, filet fin, sans ombre.
export function AuthCard({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <section className="rounded-md border border-border bg-card px-5 py-6 sm:px-8 sm:py-8">
        <h1 className="text-3xl">{title}</h1>
        {intro ? <p className="mt-2 text-ink-soft">{intro}</p> : null}
        <div className="mt-6">{children}</div>
      </section>
      {footer ? <div className="mt-5 flex flex-col gap-2 text-ink-soft">{footer}</div> : null}
    </>
  );
}
