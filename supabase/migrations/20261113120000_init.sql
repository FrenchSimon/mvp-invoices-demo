-- Fondations : comptes, clients, factures, lignes de facture.
-- Règle générale : chaque freelance ne voit et ne modifie que ses propres lignes (RLS).

-- ---------------------------------------------------------------------------
-- Profils (un par compte)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_name text not null default '',
  address text not null default '',
  vat_number text not null default '',
  email text not null default '',
  logo_path text,
  role text not null default 'user' check (role in ('user', 'admin')),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  stripe_customer_id text unique,
  subscription_status text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: lire le sien"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: modifier le sien"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Le rôle, le plan et l'abonnement ne sont jamais modifiables depuis le navigateur :
-- seules les colonnes de l'entreprise le sont. Le plan est changé par le serveur
-- (webhook Stripe, avec la clé service_role qui contourne ces droits).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (company_name, address, vat_number, logo_path) on public.profiles to authenticated;

-- Création automatique du profil à l'inscription.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email) values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vrai si l'utilisateur connecté est admin. Security definer pour lire le rôle
-- sans dépendre des règles RLS de profiles.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Clients du freelance
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  email text not null default '',
  address text not null default '',
  vat_number text not null default '',
  created_at timestamptz not null default now()
);

create index clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

create policy "clients: tout sur les siens"
  on public.clients for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Factures
-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Un client qui a des factures ne peut pas être supprimé (les factures restent valables).
  client_id uuid not null references public.clients (id) on delete restrict,
  number text not null,
  issue_date date not null default current_date,
  due_date date not null default (current_date + 30),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  vat_rate numeric(5, 2) not null default 20 check (vat_rate >= 0 and vat_rate <= 100),
  notes text not null default '',
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, number),
  check (due_date >= issue_date)
);

create index invoices_user_id_idx on public.invoices (user_id);
create index invoices_client_id_idx on public.invoices (client_id);

alter table public.invoices enable row level security;

create policy "invoices: lire les siennes"
  on public.invoices for select to authenticated
  using (user_id = (select auth.uid()));

-- Le client choisi doit appartenir au même freelance.
create policy "invoices: créer pour ses clients"
  on public.invoices for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = client_id and c.user_id = (select auth.uid())
    )
  );

create policy "invoices: modifier les siennes"
  on public.invoices for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.clients c
      where c.id = client_id and c.user_id = (select auth.uid())
    )
  );

create policy "invoices: supprimer les siennes"
  on public.invoices for delete to authenticated
  using (user_id = (select auth.uid()));

-- Numérotation : ANNÉE-001, par freelance et par année, sans doublon possible.
create table public.invoice_counters (
  user_id uuid not null references public.profiles (id) on delete cascade,
  year int not null,
  last_value int not null default 0,
  primary key (user_id, year)
);

-- Aucun accès direct depuis le navigateur : seule la fonction ci-dessous y écrit.
alter table public.invoice_counters enable row level security;
revoke all on public.invoice_counters from anon, authenticated;

create function public.before_invoice_insert()
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

create trigger invoices_before_insert
  before insert on public.invoices
  for each row execute function public.before_invoice_insert();

-- Le numéro et le propriétaire ne changent jamais après la création.
create function public.before_invoice_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.number := old.number;
  new.user_id := old.user_id;
  if new.status = 'sent' and old.status <> 'sent' and new.sent_at is null then
    new.sent_at := now();
  end if;
  if new.status = 'paid' and old.status <> 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end;
$$;

create trigger invoices_before_update
  before update on public.invoices
  for each row execute function public.before_invoice_update();

-- ---------------------------------------------------------------------------
-- Lignes de facture (montants en centimes pour éviter les erreurs d'arrondi)
-- ---------------------------------------------------------------------------
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  position int not null default 0,
  description text not null default '',
  quantity numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0)
);

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

alter table public.invoice_items enable row level security;

create policy "invoice_items: tout sur celles de ses factures"
  on public.invoice_items for all to authenticated
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Vue avec totaux et statut affiché (« En retard » calculé, jamais stocké)
-- security_invoker : la vue applique les règles RLS de la personne qui la lit.
-- ---------------------------------------------------------------------------
create view public.invoice_summaries
with (security_invoker = true)
as
select
  i.id,
  i.user_id,
  i.client_id,
  c.name as client_name,
  i.number,
  i.issue_date,
  i.due_date,
  i.status,
  case
    when i.status = 'sent' and i.due_date < current_date then 'overdue'
    else i.status
  end as display_status,
  i.vat_rate,
  i.sent_at,
  i.paid_at,
  coalesce(t.subtotal_cents, 0) as subtotal_cents,
  round(coalesce(t.subtotal_cents, 0) * i.vat_rate / 100)::bigint as vat_cents,
  (coalesce(t.subtotal_cents, 0) + round(coalesce(t.subtotal_cents, 0) * i.vat_rate / 100))::bigint as total_cents
from public.invoices i
join public.clients c on c.id = i.client_id
left join lateral (
  select round(sum(it.quantity * it.unit_price_cents))::bigint as subtotal_cents
  from public.invoice_items it
  where it.invoice_id = i.id
) t on true;
