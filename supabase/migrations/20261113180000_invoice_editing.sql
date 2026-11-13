-- Parcours 1 : édition des factures.
-- 1. Une facture n'est modifiable qu'en brouillon. Une fois envoyée ou payée,
--    son contenu est figé (seul le statut change).
-- 2. Pas de suppression de facture : la numérotation reste continue, sans trou.
-- 3. save_invoice() enregistre la facture et ses lignes en une seule transaction.

-- ---------------------------------------------------------------------------
-- Statuts et verrouillage
-- ---------------------------------------------------------------------------
create or replace function public.before_invoice_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Le numéro et le propriétaire ne changent jamais après la création.
  new.number := old.number;
  new.user_id := old.user_id;

  if old.status <> 'draft' then
    if new.status = 'draft' then
      raise exception 'INVOICE_LOCKED' using errcode = 'P0001',
        hint = 'Une facture envoyée ne peut pas redevenir un brouillon.';
    end if;
    if (new.client_id, new.issue_date, new.due_date, new.vat_rate, new.notes)
       is distinct from (old.client_id, old.issue_date, old.due_date, old.vat_rate, old.notes) then
      raise exception 'INVOICE_LOCKED' using errcode = 'P0001',
        hint = 'Une facture envoyée ne peut plus être modifiée.';
    end if;
  end if;

  if new.status = 'sent' and new.sent_at is null then
    new.sent_at := now();
  end if;
  -- La date de paiement est celle du clic sur « Marquer comme payée ».
  if new.status = 'paid' and old.status <> 'paid' then
    new.paid_at := now();
  elsif new.status <> 'paid' then
    new.paid_at := null;
  end if;
  return new;
end;
$$;

-- Plus de suppression de facture.
drop policy "invoices: supprimer les siennes" on public.invoices;

-- Lignes : lisibles sur ses factures, modifiables seulement sur ses brouillons.
drop policy "invoice_items: tout sur celles de ses factures" on public.invoice_items;

create policy "invoice_items: lire celles de ses factures"
  on public.invoice_items for select to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid())
    )
  );

create policy "invoice_items: créer sur ses brouillons"
  on public.invoice_items for insert to authenticated
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid()) and i.status = 'draft'
    )
  );

create policy "invoice_items: modifier sur ses brouillons"
  on public.invoice_items for update to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid()) and i.status = 'draft'
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid()) and i.status = 'draft'
    )
  );

create policy "invoice_items: supprimer sur ses brouillons"
  on public.invoice_items for delete to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid()) and i.status = 'draft'
    )
  );

-- ---------------------------------------------------------------------------
-- Enregistrement d'une facture et de ses lignes
-- security invoker : la fonction s'exécute avec les droits de la personne
-- connectée, donc toutes les règles RLS ci-dessus s'appliquent.
-- p_id null : nouvelle facture (le numéro est attribué par le trigger).
-- p_items : [{"description": "...", "quantity": 2, "unit_price_cents": 15000}, ...]
-- ---------------------------------------------------------------------------
create function public.save_invoice(
  p_id uuid,
  p_client_id uuid,
  p_issue_date date,
  p_due_date date,
  p_vat_rate numeric,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_status text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'INVOICE_NO_ITEMS' using errcode = 'P0001',
      hint = 'Une facture doit avoir au moins une ligne.';
  end if;

  if p_id is null then
    insert into public.invoices (client_id, issue_date, due_date, vat_rate, notes)
    values (p_client_id, p_issue_date, p_due_date, p_vat_rate, coalesce(p_notes, ''))
    returning id into v_id;
  else
    select status into v_status from public.invoices where id = p_id for update;
    if not found then
      raise exception 'INVOICE_NOT_FOUND' using errcode = 'P0001';
    end if;
    if v_status <> 'draft' then
      raise exception 'INVOICE_LOCKED' using errcode = 'P0001',
        hint = 'Une facture envoyée ne peut plus être modifiée.';
    end if;

    update public.invoices
    set client_id = p_client_id,
        issue_date = p_issue_date,
        due_date = p_due_date,
        vat_rate = p_vat_rate,
        notes = coalesce(p_notes, '')
    where id = p_id;

    v_id := p_id;
    delete from public.invoice_items where invoice_id = v_id;
  end if;

  insert into public.invoice_items (invoice_id, position, description, quantity, unit_price_cents)
  select
    v_id,
    (t.ord - 1)::int,
    coalesce(t.item ->> 'description', ''),
    (t.item ->> 'quantity')::numeric,
    (t.item ->> 'unit_price_cents')::bigint
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);

  return v_id;
end;
$$;

revoke execute on function public.save_invoice(uuid, uuid, date, date, numeric, text, jsonb)
  from public, anon;
grant execute on function public.save_invoice(uuid, uuid, date, date, numeric, text, jsonb)
  to authenticated;
