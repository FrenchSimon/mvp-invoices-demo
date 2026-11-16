"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { SecondaryLink } from "@/components/page-header";
import { Field, FormMessage, SelectField, TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatMoney, formatRate, parseDecimal, parseEurosToCents } from "@/lib/format";
import { computeTotals, lineTotalCents, VAT_EXEMPTION_NOTE, VAT_RATES } from "@/lib/invoices/totals";
import { saveInvoice, type InvoiceFormState } from "./actions";

type Line = { key: string; description: string; quantity: string; price: string };

export type EditorInitial = {
  id?: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  vatRate: number;
  notes: string;
  lines: Omit<Line, "key">[];
};

const EMPTY = { description: "", quantity: "1", price: "" };
// Clé d'une nouvelle ligne, créée dans un clic (jamais pendant le rendu).
const newLine = (): Line => ({ ...EMPTY, key: `n${Date.now()}${Math.random()}` });
const initialLines = (lines: Omit<Line, "key">[]): Line[] =>
  (lines.length ? lines : [EMPTY]).map((l, i) => ({ ...l, key: `i${i}` }));

// Ce qui est comparé pour savoir s'il reste des changements non enregistrés.
function snapshot(v: { clientId: string; issueDate: string; dueDate: string; vatRate: string; notes: string; items: string }) {
  return JSON.stringify([v.clientId, v.issueDate, v.dueDate, v.vatRate, v.notes.trim(), v.items]);
}
const itemsJson = (lines: Line[]) =>
  JSON.stringify(lines.map(({ description, quantity, price }) => ({ description, quantity, price })));

export function InvoiceEditor({
  initial,
  clients,
  title,
  badge,
  sendButton,
  onDirtyChange,
}: {
  initial: EditorInitial;
  clients: { id: string; name: string }[];
  title: string;
  badge?: ReactNode;
  // Bouton « Envoyer par email », affiché seulement quand tout est enregistré.
  sendButton?: ReactNode;
  // Prévient la page qu'il reste des changements non enregistrés (statuts bloqués).
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [clientId, setClientId] = useState(initial.clientId);
  const [issueDate, setIssueDate] = useState(initial.issueDate);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [vatRate, setVatRate] = useState(String(initial.vatRate));
  const [notes, setNotes] = useState(initial.notes);
  const [lines, setLines] = useState<Line[]>(() => initialLines(initial.lines));

  const current = snapshot({ clientId, issueDate, dueDate, vatRate, notes, items: itemsJson(lines) });
  const [baseline, setBaseline] = useState(() =>
    initial.id
      ? snapshot({
          clientId: initial.clientId,
          issueDate: initial.issueDate,
          dueDate: initial.dueDate,
          vatRate: String(initial.vatRate),
          notes: initial.notes,
          items: itemsJson(initialLines(initial.lines)),
        })
      : "",
  );
  const dirty = current !== baseline;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  const [state, action, pending] = useActionState(
    async (prev: InvoiceFormState, formData: FormData) => {
      const submitted = snapshot({
        clientId: String(formData.get("client_id")),
        issueDate: String(formData.get("issue_date")),
        dueDate: String(formData.get("due_date")),
        vatRate: String(formData.get("vat_rate")),
        notes: String(formData.get("notes")),
        items: String(formData.get("items")),
      });
      const result = await saveInvoice(prev, formData);
      if (!result.error) setBaseline(submitted);
      return result;
    },
    {},
  );

  const amounts = lines.map((l) => ({
    quantity: parseDecimal(l.quantity) ?? 0,
    unitPriceCents: parseEurosToCents(l.price) ?? 0,
  }));
  const rate = Number(vatRate);
  const totals = computeTotals(amounts, rate);

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((all) => all.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const removeLine = (key: string) =>
    setLines((all) => (all.length > 1 ? all.filter((l) => l.key !== key) : [newLine()]));

  return (
    <form action={action}>
      <div className="mb-8 flex flex-wrap justify-between gap-4">
        <div>
          <Link href="/invoices" className="text-sm">
            ← Invoices
          </Link>
          <h1 className="mt-1 text-3xl sm:text-4xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end">
          {badge}
          {initial.id ? (
            dirty ? (
              <span className="text-sm text-muted-foreground">Save to download the PDF</span>
            ) : (
              <>
                <SecondaryLink href={`/invoices/${initial.id}/pdf`} download>
                  Download PDF
                </SecondaryLink>
                {sendButton}
              </>
            )
          ) : null}
        </div>
      </div>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="items" value={itemsJson(lines)} />

      <div className="mb-8 grid gap-5 sm:grid-cols-3">
        <SelectField
          id="client_id"
          name="client_id"
          label="Client"
          required
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="" disabled>
            Choose…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <Field
          id="issue_date"
          name="issue_date"
          type="date"
          label="Issue date"
          required
          value={issueDate}
          onChange={(e) => setIssueDate(e.target.value)}
        />
        <Field
          id="due_date"
          name="due_date"
          type="date"
          label="Due date"
          required
          min={issueDate}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* Lignes : tableau à filets sur ordinateur, blocs empilés sur mobile. */}
      <div>
        <div
          aria-hidden
          className="hidden grid-cols-[minmax(0,1fr)_80px_130px_120px_44px] gap-3 border-b border-rule-strong pb-2 text-sm font-semibold text-muted-foreground sm:grid"
        >
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        <div className="border-t border-rule-strong sm:border-t-0">
        {lines.map((line, index) => (
          <div
            key={line.key}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-x-3 sm:items-center gap-y-2 border-b border-border py-3 sm:grid-cols-[minmax(0,1fr)_80px_130px_120px_44px] sm:py-2"
          >
            <input
              aria-label={`Description, line ${index + 1}`}
              placeholder="Description"
              value={line.description}
              onChange={(e) => updateLine(line.key, { description: e.target.value })}
              className="col-span-2 h-10 w-full min-w-0 rounded-md border border-input bg-card px-3 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 sm:col-span-1"
            />
            {/* Sur téléphone, l'en-tête des colonnes est masqué : libellé au-dessus du champ. */}
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-muted-foreground sm:hidden">Qty</span>
              <input
                aria-label={`Quantity, line ${index + 1}`}
                inputMode="decimal"
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
                className="w-full min-w-0 h-10 rounded-md border border-input bg-card px-3 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-muted-foreground sm:hidden">Unit price</span>
              <input
                aria-label={`Unit price, line ${index + 1}`}
                inputMode="decimal"
                placeholder="0.00"
                value={line.price}
                onChange={(e) => updateLine(line.key, { price: e.target.value })}
                className="w-full min-w-0 h-10 rounded-md border border-input bg-card px-3 text-right tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
            </label>
            <span className="self-center text-right tabular-nums sm:pr-0">
              <span className="text-sm text-muted-foreground sm:hidden">Amount </span>
              {formatMoney(lineTotalCents(amounts[index]))}
            </span>
            <button
              type="button"
              aria-label={`Remove line ${index + 1}`}
              onClick={() => removeLine(line.key)}
              className="size-11 self-center justify-self-end text-xl text-muted-foreground hover:text-destructive"
            >
              ×
            </button>
          </div>
        ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setLines((all) => [...all, newLine()])}
        className="mt-3 py-2.5 font-semibold text-destructive hover:underline"
      >
        + Add a line
      </button>

      <div className="mt-6 flex flex-wrap justify-between gap-6 border-t border-border pt-5">
        <div className="flex w-full max-w-xs flex-col gap-5">
          <SelectField
            id="vat_rate"
            name="vat_rate"
            label="VAT rate"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          >
            {VAT_RATES.map((r) => (
              <option key={r} value={String(r)}>
                {r === 0 ? "0% (no VAT)" : formatRate(r)}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            id="notes"
            name="notes"
            label="Note on the invoice (optional)"
            placeholder="Payment terms, IBAN, a thank-you…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Totals subtotal={totals.subtotal} vat={totals.vat} total={totals.total} rate={rate} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-end gap-4">
        <FormMessage error={state.error} message={dirty ? undefined : state.message} />
        {state.upgrade ? <Link href="/pro">Upgrade to Pro for unlimited invoices</Link> : null}
        <SubmitButton pending={pending} variant={initial.id ? "outline" : "default"}>
          {initial.id ? "Save draft" : "Create invoice"}
        </SubmitButton>
      </div>
    </form>
  );
}

export function Totals({ subtotal, vat, total, rate }: { subtotal: number; vat: number; total: number; rate: number }) {
  return (
    <dl className="w-full max-w-xs self-end tabular-nums sm:min-w-64">
      <div className="flex justify-between py-1">
        <dt>Subtotal</dt>
        <dd>{formatMoney(subtotal)}</dd>
      </div>
      <div className="flex justify-between py-1 text-ink-soft">
        <dt>{rate === 0 ? "VAT" : `VAT ${formatRate(rate)}`}</dt>
        <dd>{formatMoney(vat)}</dd>
      </div>
      <div className="mt-1 flex justify-between border-t border-rule-strong pt-2 font-heading text-2xl">
        <dt>Total</dt>
        <dd>{formatMoney(total)}</dd>
      </div>
      {rate === 0 ? <p className="mt-2 text-sm text-muted-foreground">{VAT_EXEMPTION_NOTE}</p> : null}
    </dl>
  );
}
