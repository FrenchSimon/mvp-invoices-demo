"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { emailInvoice, type EmailState } from "./actions";

// « Envoyer par email » : bouton principal en haut de la facture (DESIGN.md).
// Premier clic : on affiche le destinataire et on demande confirmation (pas de boîte
// de dialogue du navigateur). Le second envoie la facture avec le PDF joint.
//
// Dans l'éditeur de brouillon, le bouton est déjà dans un formulaire (on ne peut pas
// en imbriquer un autre) : il passe alors par formAction et réutilise le champ « id »
// de l'éditeur. Le bouton du premier clic est de type « button » pour que la touche
// Entrée dans un champ n'envoie jamais d'email.
export function EmailButton({
  id,
  to,
  clientId,
  label,
  inForm = false,
  initialMessage,
}: {
  id: string;
  to: string;
  clientId: string;
  label: string;
  inForm?: boolean;
  // Message déjà acquis en arrivant sur la page (brouillon tout juste envoyé).
  initialMessage?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  // Après une tentative (réussie ou non), on revient au bouton de départ :
  // un nouvel envoi redemande toujours confirmation.
  const [state, action, pending] = useActionState(async (prev: EmailState, formData: FormData) => {
    const result = await emailInvoice(prev, formData);
    setConfirming(false);
    return result;
  }, initialMessage ? { message: initialMessage } : {});

  if (!to) {
    return (
      <Link href={`/clients/${clientId}`} className="text-sm">
        Add the client&apos;s email to send it
      </Link>
    );
  }

  const body = confirming ? (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-ink-soft">Send to {to}?</span>
      {inForm ? (
        <Button type="submit" formAction={action} disabled={pending} className="h-10 px-4 text-base">
          {pending ? "One moment…" : "Confirm and send"}
        </Button>
      ) : (
        <SubmitButton pending={pending}>Confirm and send</SubmitButton>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="text-sm text-destructive hover:underline disabled:text-muted-foreground"
      >
        Cancel
      </button>
    </div>
  ) : (
    <Button type="button" onClick={() => setConfirming(true)} className="h-10 px-4 text-base">
      {label}
    </Button>
  );

  const message = (
    <div className="basis-full empty:hidden">
      <FormMessage error={state.error} message={state.message} />
    </div>
  );

  if (inForm) {
    return (
      <>
        {body}
        {message}
      </>
    );
  }
  return (
    <form action={action} className="contents">
      <input type="hidden" name="id" value={id} />
      {body}
      {message}
    </form>
  );
}
