import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// Champ de formulaire de DESIGN.md : libellé discret au-dessus, fond feuille, bord --input.
export function Field({
  label,
  hint,
  id,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cn(
          "h-10 rounded-md border border-input bg-card px-3 text-base text-foreground outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
          className,
        )}
        {...props}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// Message sous un formulaire : erreur (terracotta foncé) ou confirmation.
export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (message) {
    return (
      <p role="status" className="rounded-md bg-status-paid px-3 py-2 text-sm text-status-paid-foreground">
        {message}
      </p>
    );
  }
  return null;
}

const controlClass = cn(
  "rounded-md border border-input bg-card px-3 text-base text-foreground outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
  "disabled:opacity-60",
);

export function TextAreaField({
  label,
  id,
  className,
  ...props
}: ComponentProps<"textarea"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <textarea id={id} rows={3} className={cn(controlClass, "py-2", className)} {...props} />
    </div>
  );
}

export function SelectField({
  label,
  id,
  className,
  children,
  ...props
}: ComponentProps<"select"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </label>
      <select id={id} className={cn(controlClass, "h-10", className)} {...props}>
        {children}
      </select>
    </div>
  );
}
