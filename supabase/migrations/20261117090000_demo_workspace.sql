-- Bouton « Try the demo » de l'accueil (demande de Simon, 2026-11-16).
-- Chaque clic ouvre une session anonyme Supabase (sans email) : un compte à part,
-- isolé par les mêmes règles RLS que les autres. seed_demo_workspace() le remplit
-- d'une entreprise, de clients et de factures fictifs ; purge_demo_workspaces()
-- efface les comptes anonymes de plus de 24 h.

-- Vrai si la session vient du bouton de démo (connexion anonyme).
create or replace function public.is_demo()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

revoke execute on function public.is_demo() from public, anon;
grant execute on function public.is_demo() to authenticated;

-- Création d'une facture. Même règle qu'avant (la base fixe numéro, propriétaire,
-- date de création et statut), sauf pendant le remplissage de la démo : seule
-- seed_demo_workspace() active le réglage billnote.seeding, le navigateur ne
-- peut pas le modifier (aucune commande SET n'est exposée par l'API).
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
  v_seeding boolean := coalesce(current_setting('billnote.seeding', true), '') = 'on';
begin
  new.user_id := (select auth.uid());

  if not v_seeding then
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

-- Remplit l'espace de démo du compte connecté. Refusé pour un vrai compte et
-- pour un espace déjà rempli. Dates relatives à aujourd'hui : la démo paraît
-- toujours récente, avec des factures payées, en attente, en retard et un brouillon.
create or replace function public.seed_demo_workspace()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_month_start timestamptz := date_trunc('month', now());
  v_clients uuid[];
  v_inv uuid;
  r record;
  v_issue date;
  v_sent timestamptz;
begin
  if v_uid is null or not public.is_demo() then
    raise exception 'DEMO_ONLY' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.clients where user_id = v_uid) then
    return;
  end if;

  perform set_config('billnote.seeding', 'on', true);

  update public.profiles
  set company_name = 'Northlight Studio',
      address = E'Neubaugasse 12\n1070 Vienna, Austria',
      vat_number = 'ATU12345678',
      email = 'hello@northlight.example',
      -- Logo fictif partagé : visible sur le PDF si le visiteur passe en Pro.
      logo_path = 'demo/northlight-logo.png'
  where id = v_uid;

  with c(pos, name, email, address, vat) as (values
    (1, 'Halden Architects', 'office@halden.example.com', E'Sankt Gallen Strasse 4\n9000 St. Gallen, Switzerland', ''),
    (2, 'Roche Studio', 'hello@roche.example.com', E'12 Merchant''s Quay\nDublin 8, Ireland', 'IE1234567T'),
    (3, 'Kestrel Coffee Roasters', 'accounts@kestrel.example.com', E'Mariahilfer Strasse 88\n1060 Vienna, Austria', 'ATU87654321'),
    (4, 'Tidewell Studio', 'billing@tidewell.example.com', E'410 Harbor Street\nPortland, ME 04101, USA', ''),
    (5, 'Marlow & Finch', 'studio@marlowfinch.example.com', E'22 Canal Road\nLeeds LS1 4AB, United Kingdom', 'GB123456789'),
    (6, 'Oakline Books', 'orders@oakline.example.com', E'Brunnenstrasse 7\n10119 Berlin, Germany', 'DE123456789')
  ), ins as (
    insert into public.clients (user_id, name, email, address, vat_number)
    select v_uid, name, email, address, vat from c order by pos
    returning id, name
  )
  select array_agg(ins.id order by c.pos) into v_clients
  from ins join c on c.name = ins.name;

  -- jours : date d'émission il y a N jours ; paye : jours entre émission et paiement.
  for r in
    select * from (values
      (1, 95, 'paid', 14, 20, 'Website redesign: discovery and wireframes', 1, 180000, 'Design system: components', 1, 95000),
      (2, 88, 'paid', 9, 20, 'Brand identity', 1, 120000, 'Brand variations', 3, 15000),
      (3, 80, 'paid', 21, 20, 'Packaging design: 3 coffee labels', 3, 42000, null, null, null),
      (4, 70, 'paid', 12, 0, 'Landing page design', 1, 160000, 'Illustrations', 4, 18000),
      (5, 62, 'paid', 17, 20, 'Editorial layout: spring catalogue', 1, 98000, null, null, null),
      (6, 55, 'sent', null, 20, 'Book cover design', 2, 65000, 'Print-ready files', 1, 12000),
      (1, 45, 'sent', null, 20, 'Website redesign: final pages', 1, 210000, null, null, null),
      (2, 38, 'paid', 11, 20, 'Social media templates', 12, 4500, null, null, null),
      (3, 25, 'sent', null, 20, 'Café menu boards', 4, 22000, 'Photo retouching', 6, 3500),
      (4, 18, 'paid', 13, 0, 'UX audit and recommendations', 1, 140000, null, null, null),
      (5, 10, 'sent', null, 20, 'Annual report layout', 1, 175000, 'Charts and infographics', 8, 9000),
      (6, 2, 'draft', null, 20, 'Author website: design', 1, 135000, null, null, null)
    ) as t(client, days, status, paid_after, vat, d1, q1, p1, d2, q2, p2)
  loop
    v_issue := current_date - r.days;
    v_sent := v_issue + time '10:00' + interval '1 day';
    insert into public.invoices
      (client_id, issue_date, due_date, status, vat_rate, notes, sent_at, paid_at, created_at)
    values (
      v_clients[r.client], v_issue, v_issue + 30, r.status, r.vat,
      case when r.vat = 0 then 'VAT reverse charge / export of services.' else 'Payment by bank transfer within 30 days.' end,
      case when r.status = 'draft' then null else v_sent end,
      case when r.status = 'paid' then least(v_issue + time '15:00' + make_interval(days => r.paid_after), now()) end,
      -- Seul le brouillon compte dans les 3 factures du mois : le visiteur peut
      -- encore en créer 2 avant de voir la limite du plan gratuit.
      case when r.status = 'draft' then now()
           else least(v_issue + time '09:00', v_month_start - interval '1 hour') end
    )
    returning id into v_inv;

    insert into public.invoice_items (invoice_id, position, description, quantity, unit_price_cents)
    values (v_inv, 0, r.d1, r.q1, r.p1);
    if r.d2 is not null then
      insert into public.invoice_items (invoice_id, position, description, quantity, unit_price_cents)
      values (v_inv, 1, r.d2, r.q2, r.p2);
    end if;
  end loop;

  perform set_config('billnote.seeding', 'off', true);
end;
$$;

revoke execute on function public.seed_demo_workspace() from public, anon;
grant execute on function public.seed_demo_workspace() to authenticated;

-- Efface les espaces de démo de plus de 24 h. Les factures d'abord : un client
-- qui a des factures ne peut pas être supprimé (on delete restrict).
create or replace function public.purge_demo_workspaces()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  select coalesce(array_agg(id), '{}') into v_ids
  from auth.users
  where is_anonymous and created_at < now() - interval '24 hours';

  delete from public.invoices where user_id = any (v_ids);
  delete from auth.users where id = any (v_ids);
  return cardinality(v_ids);
end;
$$;

revoke execute on function public.purge_demo_workspaces() from public, anon, authenticated;

-- Nettoyage toutes les heures avec pg_cron (absent des tests locaux : ignoré).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('purge-demo-workspaces', '17 * * * *', 'select public.purge_demo_workspaces()');
  end if;
end;
$$;

-- Logo : pas d'envoi de fichier depuis la démo (rien ne s'accumule dans l'espace
-- « logos » quand le compte est effacé). L'espace de démo passé en Pro voit le
-- logo fictif partagé, rangé dans le dossier « demo ».
drop policy "logos: envoyer en Pro" on storage.objects;
create policy "logos: envoyer en Pro" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.plan = 'pro')
    and not (select public.is_demo())
  );

create policy "logos: lire le logo de démo" on storage.objects
  for select to authenticated
  using (bucket_id = 'logos' and name = 'demo/northlight-logo.png' and (select public.is_demo()));
