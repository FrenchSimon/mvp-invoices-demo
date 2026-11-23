-- Espace de démo dans la langue choisie sur le site (FR / EN de la barre de démo).
-- seed_demo_workspace() prend la langue en paramètre : 'fr' remplit l'espace de
-- clients, de lignes et de mentions en français ; toute autre valeur garde l'anglais.
-- Même nombre de clients et de factures, mêmes montants, mêmes dates et statuts.
-- L'ancienne version sans paramètre est remplacée (sinon l'appel sans argument
-- serait ambigu) ; l'appel sans argument reste possible grâce à la valeur par défaut.

drop function public.seed_demo_workspace();

create function public.seed_demo_workspace(p_lang text default 'en')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_fr boolean := coalesce(p_lang, '') = 'fr';
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
      address = case when v_fr
        then E'8 rue des Capucins\n69001 Lyon\nSASU · SIRET 912 345 678 00017'
        else E'Neubaugasse 12\n1070 Vienna, Austria' end,
      vat_number = case when v_fr then 'FR32912345678' else 'ATU12345678' end,
      email = case when v_fr then 'bonjour@northlight.example' else 'hello@northlight.example' end,
      -- Logo fictif partagé : visible sur le PDF si le visiteur passe en Pro.
      logo_path = 'demo/northlight-logo.png'
  where id = v_uid;

  with c(pos, name, email, address, vat) as (
    select * from (values
      (1, 'Halden Architects', 'office@halden.example.com', E'Sankt Gallen Strasse 4\n9000 St. Gallen, Switzerland', ''),
      (2, 'Roche Studio', 'hello@roche.example.com', E'12 Merchant''s Quay\nDublin 8, Ireland', 'IE1234567T'),
      (3, 'Kestrel Coffee Roasters', 'accounts@kestrel.example.com', E'Mariahilfer Strasse 88\n1060 Vienna, Austria', 'ATU87654321'),
      (4, 'Tidewell Studio', 'billing@tidewell.example.com', E'410 Harbor Street\nPortland, ME 04101, USA', ''),
      (5, 'Marlow & Finch', 'studio@marlowfinch.example.com', E'22 Canal Road\nLeeds LS1 4AB, United Kingdom', 'GB123456789'),
      (6, 'Oakline Books', 'orders@oakline.example.com', E'Brunnenstrasse 7\n10119 Berlin, Germany', 'DE123456789')
    ) as en(pos, name, email, address, vat)
    where not v_fr
    union all
    select * from (values
      (1, 'Halden Architectes', 'contact@halden.example.com', E'4 place Bellecour\n69002 Lyon', 'FR18452367891'),
      (2, 'Atelier Roche', 'bonjour@roche.example.com', E'12 quai Saint-Antoine\n69002 Lyon', 'FR40123456789'),
      (3, 'Torréfaction Crécerelle', 'compta@crecerelle.example.com', E'88 rue Oberkampf\n75011 Paris', 'FR83876543210'),
      (4, 'Tidewell Studio', 'billing@tidewell.example.com', E'410 Harbor Street\nPortland, ME 04101, USA', ''),
      (5, 'Éditions Marlowe', 'studio@marlowe.example.com', E'22 cours Victor-Hugo\n33000 Bordeaux', 'FR12345678901'),
      (6, 'Librairie du Chêne', 'commandes@chene.example.com', E'7 rue de la Paix\n44000 Nantes', 'FR98765432109')
    ) as fr(pos, name, email, address, vat)
    where v_fr
  ), ins as (
    insert into public.clients (user_id, name, email, address, vat_number)
    select v_uid, name, email, address, vat from c order by pos
    returning id, name
  )
  select array_agg(ins.id order by c.pos) into v_clients
  from ins join c on c.name = ins.name;

  -- jours : date d'émission il y a N jours ; paye : jours entre émission et paiement.
  -- Lignes en anglais (d1, d2) et en français (f1, f2).
  for r in
    select * from (values
      (1, 95, 'paid', 14, 20, 'Website redesign: discovery and wireframes', 'Refonte du site : cadrage et maquettes', 1, 180000, 'Design system: components', 'Design system : composants', 1, 95000),
      (2, 88, 'paid', 9, 20, 'Brand identity', 'Identité visuelle', 1, 120000, 'Brand variations', 'Déclinaisons du logo', 3, 15000),
      (3, 80, 'paid', 21, 20, 'Packaging design: 3 coffee labels', 'Packaging : 3 étiquettes de café', 3, 42000, null, null, null, null),
      (4, 70, 'paid', 12, 0, 'Landing page design', 'Design de la page d''accueil', 1, 160000, 'Illustrations', 'Illustrations', 4, 18000),
      (5, 62, 'paid', 17, 20, 'Editorial layout: spring catalogue', 'Mise en page : catalogue de printemps', 1, 98000, null, null, null, null),
      (6, 55, 'sent', null, 20, 'Book cover design', 'Couverture de livre', 2, 65000, 'Print-ready files', 'Fichiers prêts pour l''impression', 1, 12000),
      (1, 45, 'sent', null, 20, 'Website redesign: final pages', 'Refonte du site : pages finales', 1, 210000, null, null, null, null),
      (2, 38, 'paid', 11, 20, 'Social media templates', 'Modèles pour les réseaux sociaux', 12, 4500, null, null, null, null),
      (3, 25, 'sent', null, 20, 'Café menu boards', 'Ardoises de menu du café', 4, 22000, 'Photo retouching', 'Retouche photo', 6, 3500),
      (4, 18, 'paid', 13, 0, 'UX audit and recommendations', 'Audit UX et recommandations', 1, 140000, null, null, null, null),
      (5, 10, 'sent', null, 20, 'Annual report layout', 'Mise en page du rapport annuel', 1, 175000, 'Charts and infographics', 'Graphiques et infographies', 8, 9000),
      (6, 2, 'draft', null, 20, 'Author website: design', 'Site d''auteur : design', 1, 135000, null, null, null, null)
    ) as t(client, days, status, paid_after, vat, d1, f1, q1, p1, d2, f2, q2, p2)
  loop
    v_issue := current_date - r.days;
    v_sent := v_issue + time '10:00' + interval '1 day';
    insert into public.invoices
      (client_id, issue_date, due_date, status, vat_rate, notes, sent_at, paid_at, created_at)
    values (
      v_clients[r.client], v_issue, v_issue + 30, r.status, r.vat,
      case
        when r.vat = 0 and v_fr then 'Exonération de TVA : prestation de services hors UE (art. 259-1 du CGI).'
        when r.vat = 0 then 'VAT reverse charge / export of services.'
        when v_fr then 'Paiement par virement sous 30 jours.'
        else 'Payment by bank transfer within 30 days.'
      end,
      case when r.status = 'draft' then null else v_sent end,
      case when r.status = 'paid' then least(v_issue + time '15:00' + make_interval(days => r.paid_after), now()) end,
      -- Seul le brouillon compte dans les 3 factures du mois : le visiteur peut
      -- encore en créer 2 avant de voir la limite du plan gratuit.
      case when r.status = 'draft' then now()
           else least(v_issue + time '09:00', v_month_start - interval '1 hour') end
    )
    returning id into v_inv;

    insert into public.invoice_items (invoice_id, position, description, quantity, unit_price_cents)
    values (v_inv, 0, case when v_fr then r.f1 else r.d1 end, r.q1, r.p1);
    if r.d2 is not null then
      insert into public.invoice_items (invoice_id, position, description, quantity, unit_price_cents)
      values (v_inv, 1, case when v_fr then r.f2 else r.d2 end, r.q2, r.p2);
    end if;
  end loop;

  perform set_config('billnote.seeding', 'off', true);
end;
$$;

revoke execute on function public.seed_demo_workspace(text) from public, anon;
grant execute on function public.seed_demo_workspace(text) to authenticated;
