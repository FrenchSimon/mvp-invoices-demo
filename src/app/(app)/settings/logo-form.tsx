"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LOGO_MAX_BYTES } from "@/lib/logo";
import { removeLogo, uploadLogo } from "./actions";

// Logo sur le PDF (Pro). L'aperçu vient d'une adresse signée valable une heure :
// l'espace « logos » est privé.
export function LogoForm({ previewUrl }: { previewUrl: string | null }) {
  const [state, action, pending] = useActionState(uploadLogo, {});
  const [removeState, removeAction, removing] = useActionState(removeLogo, {});
  const [tooBig, setTooBig] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {previewUrl ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-muted-foreground">Current logo</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- adresse signée temporaire, pas d'optimisation utile */}
          <img src={previewUrl} alt="Business logo" className="max-h-14 max-w-40 object-contain object-left" />
        </div>
      ) : null}

      <form action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="logo" className="text-sm text-muted-foreground">
            {previewUrl ? "Replace logo" : "Your logo"}
          </label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg"
            required
            aria-describedby="logo-hint"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              const big = !!file && file.size > LOGO_MAX_BYTES;
              setTooBig(big);
              if (big) e.currentTarget.value = "";
            }}
            className="text-base text-foreground file:mr-3 file:h-10 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:text-foreground"
          />
          <p id="logo-hint" className="text-sm text-muted-foreground">
            PNG or JPEG, 500 KB max. It appears at the top left of your PDF invoices.
          </p>
        </div>
        <FormMessage
          error={tooBig ? "The logo is over 500 KB. Choose a smaller image." : state.error}
          message={tooBig ? undefined : state.message}
        />
        <div>
          <SubmitButton pending={pending}>Save logo</SubmitButton>
        </div>
      </form>

      {previewUrl ? (
        <form action={removeAction} className="flex flex-col items-start gap-3">
          <SubmitButton pending={removing} variant="outline">
            Remove logo
          </SubmitButton>
          <FormMessage error={removeState.error} />
        </form>
      ) : removeState.message ? (
        <FormMessage message={removeState.message} />
      ) : null}
    </div>
  );
}
