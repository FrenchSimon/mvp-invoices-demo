-- Audit sécurité du 2026-11-16 : les colonnes created_at, status, sent_at et paid_at
-- étaient modifiables par l'API (droits par défaut de Supabase). Un compte gratuit pouvait
-- donc mettre une date de création passée et dépasser la limite de 3 factures par mois,
-- ou créer une facture déjà « payée » avec les dates de son choix.
-- Désormais la base fixe elle-même ces valeurs, quoi qu'envoie le navigateur.

-- Création : toujours un brouillon, daté de maintenant, sans date d'envoi ni de paiement.
create or replace function public.before_invoice_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_count int;
  v_year int := extract(year from new.issue_date)::int;
  v_next int;
begin
  -- Le numéro est toujours calculé ici, jamais fourni par le navigateur.
  new.user_id := (select auth.uid());
  new.created_at := now();
  new.status := 'draft';
  new.sent_at := null;
  new.paid_at := null;

  -- Plan gratuit : 3 factures créées par mois calendaire.
  select plan into v_plan from public.profiles where id = new.user_id;
  if v_plan = 'free' then
    select count(*) into v_count
    from public.invoices
    where user_id = new.user_id
      and created_at >= date_trunc('month', now())
      and created_at < date_trunc('month', now()) + interval '1 month';
    if v_count >= 3 then
      raise exception 'FREE_PLAN_LIMIT' using errcode = 'P0001',
        hint = 'Le plan gratuit permet 3 factures par mois.';
    end if;
  end if;

  -- Compteur atomique : deux créations simultanées ne peuvent pas obtenir le même numéro.
  insert into public.invoice_counters as ic (user_id, year, last_value)
  values (new.user_id, v_year, 1)
  on conflict (user_id, year) do update set last_value = ic.last_value + 1
  returning last_value into v_next;

  new.number := v_year::text || '-' || lpad(v_next::text, 3, '0');
  return new;
end;
$$;

revoke execute on function public.before_invoice_insert() from public, anon, authenticated;

-- Modification : la date de création ne change jamais, les dates d'envoi et de
-- paiement ne sont fixées que par les changements de statut.
create or replace function public.before_invoice_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Le numéro, le propriétaire et la date de création ne changent jamais.
  new.number := old.number;
  new.user_id := old.user_id;
  new.created_at := old.created_at;

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

  -- Date d'envoi : celle du premier passage à « envoyée ».
  new.sent_at := old.sent_at;
  if new.status = 'sent' and new.sent_at is null then
    new.sent_at := now();
  end if;
  -- Date de paiement : celle du clic sur « Marquer comme payée ».
  if new.status = 'paid' and old.status <> 'paid' then
    new.paid_at := now();
  elsif new.status = 'paid' then
    new.paid_at := old.paid_at;
  else
    new.paid_at := null;
  end if;
  return new;
end;
$$;
