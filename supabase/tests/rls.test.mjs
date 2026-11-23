// Teste les migrations avec PGlite (Postgres en WebAssembly, sans Docker) :
// schéma auth de Supabase simulé, deux freelances, un admin.
// Lancer : npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const migration = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(join(dir, f), "utf8"))
  .join("\n");
const db = new PGlite();

const stub = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key, email text,
  is_anonymous boolean not null default false, created_at timestamptz not null default now());
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as
  $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
-- Stockage de Supabase, réduit à ce que les migrations utilisent.
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets, name text, owner uuid default auth.uid());
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as
  $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.buckets to authenticated;
`;
await db.exec(stub);
await db.exec(migration);
// Droits par défaut que Supabase donne sur le schéma public.
await db.exec(`
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
revoke insert, update, delete on public.profiles from authenticated;
grant update (company_name, address, vat_number, logo_path) on public.profiles to authenticated;
revoke all on public.invoice_counters from authenticated;
`);

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
await db.exec(`insert into auth.users values ('${A}', 'a@test.fr'), ('${B}', 'b@test.fr');`);

let failures = 0;
const ok = (cond, label) => {
  console.log(`${cond ? "OK  " : "FAIL"} ${label}`);
  if (!cond) failures++;
};
async function as(uid, fn) {
  const anon = uid.startsWith("d") ? "true" : "false";
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);
    select set_config('request.jwt.claims', '{"sub":"${uid}","is_anonymous":${anon}}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role;`); }
}
async function fails(sql) {
  try { await db.query(sql); return null; } catch (e) { return e.message; }
}

// Profils créés à l'inscription
const p = await db.query(`select count(*)::int n from public.profiles`);
ok(p.rows[0].n === 2, "un profil est créé pour chaque inscription");

// Le freelance A crée un client et des factures
const clientA = await as(A, async () =>
  (await db.query(`insert into public.clients (name) values ('Atelier Roche') returning id`)).rows[0].id);
const inv1 = await as(A, async () =>
  (await db.query(`insert into public.invoices (client_id, issue_date, due_date) values ('${clientA}', '2026-11-10', '2026-12-10') returning id, number`)).rows[0]);
ok(inv1.number === "2026-001", `numéro de la 1re facture : ${inv1.number}`);
const inv2 = await as(A, async () =>
  (await db.query(`insert into public.invoices (client_id, issue_date, due_date, number) values ('${clientA}', '2026-11-11', '2026-12-11', 'PIRATE') returning number`)).rows[0]);
ok(inv2.number === "2026-002", `le numéro envoyé par le navigateur est ignoré : ${inv2.number}`);

// Lignes et totaux
await as(A, () => db.query(`insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents) values
  ('${inv1.id}', 'Affiche A2', 2, 15000), ('${inv1.id}', 'Retouches', 1, 5000)`));
const sum = await as(A, async () => (await db.query(`select subtotal_cents, vat_cents, total_cents from public.invoice_summaries where id = '${inv1.id}'`)).rows[0]);
ok(Number(sum.subtotal_cents) === 35000 && Number(sum.vat_cents) === 7000 && Number(sum.total_cents) === 42000,
  `totaux : HT ${sum.subtotal_cents}, TVA ${sum.vat_cents}, TTC ${sum.total_cents} (centimes)`);

// En retard : envoyée et échéance passée
await as(A, () => db.query(`update public.invoices set status = 'sent', issue_date = '2026-01-01', due_date = '2026-01-31' where id = '${inv1.id}'`));
const st = await as(A, async () => (await db.query(`select display_status, number, sent_at from public.invoice_summaries where id = '${inv1.id}'`)).rows[0]);
ok(st.display_status === "overdue", `facture envoyée et échue affichée « ${st.display_status} »`);
ok(st.number === "2026-001" && st.sent_at !== null, "numéro inchangé après modification, date d'envoi remplie");

// Plan gratuit : 3 factures par mois
await as(A, () => db.query(`insert into public.invoices (client_id) values ('${clientA}')`));
const limit = await as(A, () => fails(`insert into public.invoices (client_id) values ('${clientA}')`));
ok(limit && limit.includes("FREE_PLAN_LIMIT"), "la 4e facture du mois est refusée en plan gratuit");

// Le freelance ne peut pas se passer lui-même en Pro ou admin
const selfPro = await as(A, () => fails(`update public.profiles set plan = 'pro' where id = '${A}'`));
ok(selfPro !== null, "un freelance ne peut pas changer son plan lui-même");
const selfAdmin = await as(A, () => fails(`update public.profiles set role = 'admin' where id = '${A}'`));
ok(selfAdmin !== null, "un freelance ne peut pas se donner le rôle admin");
await as(A, () => db.query(`update public.profiles set company_name = 'Léa M. Design' where id = '${A}'`));
const cn = (await db.query(`select company_name from public.profiles where id = '${A}'`)).rows[0].company_name;
ok(cn === "Léa M. Design", "un freelance peut modifier le nom de son entreprise");

// Plan Pro (changé par le serveur) : plus de limite
await db.exec(`update public.profiles set plan = 'pro' where id = '${A}'`);
const pro = await as(A, () => fails(`insert into public.invoices (client_id) values ('${clientA}')`));
ok(pro === null, "en plan Pro, la 4e facture est acceptée");

// Isolation entre freelances
const seenByB = await as(B, async () => ({
  clients: (await db.query(`select count(*)::int n from public.clients`)).rows[0].n,
  invoices: (await db.query(`select count(*)::int n from public.invoices`)).rows[0].n,
  items: (await db.query(`select count(*)::int n from public.invoice_items`)).rows[0].n,
  summaries: (await db.query(`select count(*)::int n from public.invoice_summaries`)).rows[0].n,
  profiles: (await db.query(`select count(*)::int n from public.profiles`)).rows[0].n,
}));
ok(seenByB.clients === 0 && seenByB.invoices === 0 && seenByB.items === 0 && seenByB.summaries === 0,
  `B ne voit rien de A : ${JSON.stringify(seenByB)}`);
ok(seenByB.profiles === 1, "B ne voit que son propre profil");
const bOnA = await as(B, () => fails(`insert into public.invoices (client_id) values ('${clientA}')`));
ok(bOnA !== null, "B ne peut pas créer une facture pour un client de A");
const bUpd = await as(B, async () => (await db.query(`update public.invoices set status = 'paid' where id = '${inv1.id}'`)).affectedRows);
ok(bUpd === 0, "B ne peut pas modifier une facture de A");
const bItem = await as(B, () => fails(`insert into public.invoice_items (invoice_id, description) values ('${inv1.id}', 'x')`));
ok(bItem !== null, "B ne peut pas ajouter de ligne à une facture de A");
const counters = await as(B, () => fails(`select * from public.invoice_counters`));
ok(counters !== null, "les compteurs de numéros ne sont pas lisibles depuis le navigateur");

// Numérotation propre à chaque freelance
const clientB = await as(B, async () =>
  (await db.query(`insert into public.clients (name) values ('Studio Nord') returning id`)).rows[0].id);
const invB = await as(B, async () =>
  (await db.query(`insert into public.invoices (client_id, issue_date, due_date) values ('${clientB}', '2026-11-12', '2026-12-12') returning number`)).rows[0]);
ok(invB.number === "2026-001", `B commence sa propre numérotation : ${invB.number}`);

// Dates et statut fixés par la base (audit sécurité) : la limite gratuite ne se contourne pas.
const forged = await as(B, async () => (await db.query(
  `insert into public.invoices (client_id, created_at, status, sent_at, paid_at)
   values ('${clientB}', '2020-01-01', 'paid', '2020-01-01', '2020-01-01')
   returning id, created_at > now() - interval '1 minute' recent, status, sent_at, paid_at`)).rows[0]);
ok(forged.recent && forged.status === "draft" && forged.sent_at === null && forged.paid_at === null,
  "à la création, date, statut et dates d'envoi et de paiement sont fixés par la base");
await as(B, () => db.query(`update public.invoices set created_at = '2020-01-01' where id = '${forged.id}'`));
const moved = (await db.query(`select created_at > now() - interval '1 minute' recent from public.invoices where id = '${forged.id}'`)).rows[0];
ok(moved.recent, "la date de création ne peut pas être modifiée");
await as(B, () => db.query(`update public.invoices set status = 'paid' where id = '${forged.id}'`));
await as(B, () => db.query(`update public.invoices set paid_at = '2020-01-01', sent_at = '2020-01-01' where id = '${forged.id}'`));
const dates = (await db.query(`select paid_at > now() - interval '1 minute' paid_recent, sent_at from public.invoices where id = '${forged.id}'`)).rows[0];
ok(dates.paid_recent && dates.sent_at === null, "les dates d'envoi et de paiement ne se modifient pas à la main");
await as(B, () => db.query(`insert into public.invoices (client_id) values ('${clientB}')`));
const bypass = await as(B, () => fails(`insert into public.invoices (client_id, created_at) values ('${clientB}', '2020-01-01')`));
ok(bypass && bypass.includes("FREE_PLAN_LIMIT"), "une date de création passée ne contourne pas la limite gratuite");

// Un client avec factures ne peut pas être supprimé
const del = await as(A, () => fails(`delete from public.clients where id = '${clientA}'`));
ok(del !== null, "un client qui a des factures ne peut pas être supprimé");

// save_invoice : facture et lignes enregistrées ensemble
const items = (list) => `'${JSON.stringify(list)}'::jsonb`;
const draftId = await as(A, async () => (await db.query(
  `select public.save_invoice(null, '${clientA}', '2026-11-13', '2026-12-13', 20, 'Merci', ${items([
    { description: "Logo", quantity: 1, unit_price_cents: 40000 },
    { description: "Cartes", quantity: 3, unit_price_cents: 2500 },
  ])}) id`)).rows[0].id);
const draft = await as(A, async () => (await db.query(
  `select number, status, subtotal_cents from public.invoice_summaries where id = '${draftId}'`)).rows[0]);
ok(draft.status === "draft" && Number(draft.subtotal_cents) === 47500,
  `save_invoice crée un brouillon numéroté ${draft.number} avec ses lignes (HT ${draft.subtotal_cents})`);
await as(A, () => db.query(
  `select public.save_invoice('${draftId}', '${clientA}', '2026-11-13', '2026-12-13', 0, '', ${items([
    { description: "Logo", quantity: 1, unit_price_cents: 45000 },
  ])})`));
const edited = await as(A, async () => (await db.query(
  `select (select count(*)::int from public.invoice_items where invoice_id = '${draftId}') n, vat_cents, number
   from public.invoice_summaries where id = '${draftId}'`)).rows[0]);
ok(edited.n === 1 && Number(edited.vat_cents) === 0 && edited.number === draft.number,
  "modifier un brouillon remplace ses lignes, numéro inchangé");
const noItems = await as(A, () => fails(
  `select public.save_invoice('${draftId}', '${clientA}', '2026-11-13', '2026-12-13', 20, '', '[]'::jsonb)`));
ok(noItems && noItems.includes("INVOICE_NO_ITEMS"), "une facture sans ligne est refusée");
const bSave = await as(B, () => fails(
  `select public.save_invoice('${draftId}', '${clientA}', '2026-11-13', '2026-12-13', 20, '', ${items([
    { description: "x", quantity: 1, unit_price_cents: 1 },
  ])})`));
ok(bSave && bSave.includes("INVOICE_NOT_FOUND"), "B ne peut pas enregistrer une facture de A");

// Facture envoyée : contenu figé, seul le statut change
const lockedSave = await as(A, () => fails(
  `select public.save_invoice('${inv1.id}', '${clientA}', '2026-01-01', '2026-01-31', 20, '', ${items([
    { description: "x", quantity: 1, unit_price_cents: 1 },
  ])})`));
ok(lockedSave && lockedSave.includes("INVOICE_LOCKED"), "une facture envoyée ne peut plus être enregistrée");
const lockedNotes = await as(A, () => fails(`update public.invoices set notes = 'modifié' where id = '${inv1.id}'`));
ok(lockedNotes && lockedNotes.includes("INVOICE_LOCKED"), "le contenu d'une facture envoyée est figé");
const lockedItem = await as(A, () => fails(
  `insert into public.invoice_items (invoice_id, description) values ('${inv1.id}', 'ajout')`));
ok(lockedItem !== null, "on ne peut pas ajouter de ligne à une facture envoyée");
const lockedItemUpd = await as(A, async () => (await db.query(
  `update public.invoice_items set unit_price_cents = 1 where invoice_id = '${inv1.id}'`)).affectedRows);
ok(lockedItemUpd === 0, "on ne peut pas modifier les lignes d'une facture envoyée");
const backToDraft = await as(A, () => fails(`update public.invoices set status = 'draft' where id = '${inv1.id}'`));
ok(backToDraft && backToDraft.includes("INVOICE_LOCKED"), "une facture envoyée ne redevient pas brouillon");

await as(A, () => db.query(`update public.invoices set status = 'paid' where id = '${inv1.id}'`));
const paid = await as(A, async () => (await db.query(
  `select display_status, paid_at from public.invoice_summaries where id = '${inv1.id}'`)).rows[0]);
ok(paid.display_status === "paid" && paid.paid_at !== null, "payée : statut « paid » et date de paiement remplie");
await as(A, () => db.query(`update public.invoices set status = 'sent' where id = '${inv1.id}'`));
const unpaid = await as(A, async () => (await db.query(
  `select display_status, paid_at from public.invoice_summaries where id = '${inv1.id}'`)).rows[0]);
ok(unpaid.display_status === "overdue" && unpaid.paid_at === null,
  "annuler le paiement efface la date et la facture redevient en retard");

const delInv = await as(A, async () => (await db.query(`delete from public.invoices where id = '${draftId}'`)).affectedRows);
ok(delInv === 0, "une facture ne peut pas être supprimée (numérotation continue)");

// is_admin
const adm1 = await as(A, async () => (await db.query(`select public.is_admin() a`)).rows[0].a);
await db.exec(`update public.profiles set role = 'admin' where id = '${B}'`);
const adm2 = await as(B, async () => (await db.query(`select public.is_admin() a`)).rows[0].a);
ok(adm1 === false && adm2 === true, "is_admin() : faux pour un freelance, vrai pour l'admin");

// Liste des inscrits (admin)
const listA = await as(A, () => fails(`select * from public.admin_list_users()`));
ok(listA !== null && listA.includes("NOT_ADMIN"), "admin_list_users() refusée à un freelance");
await db.exec(`set role anon;`);
const listAnon = await fails(`select * from public.admin_list_users()`);
await db.exec(`reset role;`);
ok(listAnon !== null, "admin_list_users() refusée sans connexion");
const listB = await as(B, async () => (await db.query(`select * from public.admin_list_users()`)).rows);
const rowA = listB.find((r) => r.id === A);
const totalA = await db.query(`select count(*)::int n from public.invoices where user_id = '${A}'`);
ok(listB.length === 2 && rowA?.email === "a@test.fr" && rowA?.plan === "pro"
  && Number(rowA?.invoice_count) === totalA.rows[0].n,
  `admin_list_users() pour l'admin : ${listB.length} inscrits, ${rowA?.invoice_count} factures pour A`);

// Logo (point 10) : espace privé, un dossier par freelance, envoi réservé à Pro.
const bucket = (await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'logos'`)).rows[0];
ok(bucket?.public === false && Number(bucket?.file_size_limit) === 512000,
  "espace « logos » privé, 500 Ko au plus");
await db.exec(`update public.profiles set plan = 'free' where id = '${B}'`);
const freeLogo = await as(B, () => fails(`insert into storage.objects (bucket_id, name) values ('logos', '${B}/logo.png')`));
ok(freeLogo !== null, "formule gratuite : envoi d'un logo refusé");
const proLogo = await as(A, () => fails(`insert into storage.objects (bucket_id, name) values ('logos', '${A}/logo.png')`));
ok(proLogo === null, "formule Pro : envoi d'un logo dans son dossier accepté");
const otherFolder = await as(A, () => fails(`insert into storage.objects (bucket_id, name) values ('logos', '${B}/pirate.png')`));
ok(otherFolder !== null, "envoi dans le dossier d'un autre freelance refusé");
const logosSeenByB = await as(B, async () => (await db.query(`select count(*)::int n from storage.objects where bucket_id = 'logos'`)).rows[0].n);
const logosSeenByA = await as(A, async () => (await db.query(`select count(*)::int n from storage.objects where bucket_id = 'logos'`)).rows[0].n);
ok(logosSeenByB === 0 && logosSeenByA === 1, "chacun ne voit que son propre logo");
const delByB = await as(B, async () => (await db.query(`delete from storage.objects where name = '${A}/logo.png'`)).affectedRows);
ok(delByB === 0, "impossible de supprimer le logo d'un autre freelance");

// Espace de démo (bouton « Try the demo ») : compte anonyme rempli par seed_demo_workspace().
const D = "d0000000-0000-0000-0000-00000000000d";
await db.exec(`insert into auth.users (id, email, is_anonymous) values ('${D}', null, true);`);
const seedReal = await as(A, () => fails(`select public.seed_demo_workspace()`));
ok(seedReal && seedReal.includes("DEMO_ONLY"), "seed_demo_workspace() refusée à un vrai compte");
await as(D, () => db.query(`select public.seed_demo_workspace()`));
await as(D, () => db.query(`select public.seed_demo_workspace()`));
const demo = await as(D, async () => (await db.query(`select
  (select count(*)::int from public.clients) clients,
  (select count(*)::int from public.invoices) invoices,
  (select count(*)::int from public.invoice_summaries where display_status = 'paid') paid,
  (select count(*)::int from public.invoice_summaries where display_status = 'overdue') overdue,
  (select count(*)::int from public.invoice_summaries where display_status = 'sent') pending,
  (select count(*)::int from public.invoice_summaries where display_status = 'draft') drafts,
  (select count(*)::int from public.invoices where created_at >= date_trunc('month', now())) this_month,
  (select count(*)::int from public.invoice_summaries where total_cents = 0) empty,
  (select company_name from public.profiles) company`)).rows[0]);
ok(demo.clients === 6 && demo.invoices === 12 && demo.paid === 7 && demo.overdue === 2
  && demo.pending === 2 && demo.drafts === 1 && demo.empty === 0 && demo.company === "Northlight Studio",
  `démo remplie une seule fois : ${JSON.stringify(demo)}`);
ok(demo.this_month === 1, "démo : seul le brouillon compte dans les factures du mois");
const seenByDemo = await as(D, async () => (await db.query(`select count(*)::int n from public.invoices where user_id <> '${D}'`)).rows[0].n);
const demoSeenByA = await as(A, async () => (await db.query(`select count(*)::int n from public.invoices where user_id = '${D}'`)).rows[0].n);
ok(seenByDemo === 0 && demoSeenByA === 0, "la démo et les vrais comptes ne se voient pas");
const clientD = await as(D, async () => (await db.query(`select id from public.clients limit 1`)).rows[0].id);
const forgedD = await as(D, async () => (await db.query(
  `insert into public.invoices (client_id, created_at, status) values ('${clientD}', '2020-01-01', 'paid') returning status`)).rows[0]);
ok(forgedD.status === "draft", "après le remplissage, la démo suit les règles normales (statut forcé)");
await as(D, () => db.query(`insert into public.invoices (client_id) values ('${clientD}')`));
const demoLimit = await as(D, () => fails(`insert into public.invoices (client_id) values ('${clientD}')`));
ok(demoLimit && demoLimit.includes("FREE_PLAN_LIMIT"), "démo : la limite gratuite s'applique à la 4e facture du mois");
const seedFlag = await as(D, async () => (await db.query(`select coalesce(current_setting('billnote.seeding', true), '') v`)).rows[0].v);
ok(seedFlag !== "on", "le réglage de remplissage ne reste pas actif après seed_demo_workspace()");
await db.exec(`update public.profiles set plan = 'pro' where id = '${D}'`);
const demoUpload = await as(D, () => fails(`insert into storage.objects (bucket_id, name) values ('logos', '${D}/logo.png')`));
ok(demoUpload !== null, "démo en Pro : envoi de logo refusé");
await db.exec(`insert into storage.objects (bucket_id, name) values ('logos', 'demo/northlight-logo.png')`);
const demoLogo = await as(D, async () => (await db.query(`select count(*)::int n from storage.objects where name = 'demo/northlight-logo.png'`)).rows[0].n);
const demoLogoByA = await as(A, async () => (await db.query(`select count(*)::int n from storage.objects where name = 'demo/northlight-logo.png'`)).rows[0].n);
ok(demoLogo === 1 && demoLogoByA === 0, "le logo de démo partagé n'est lisible que par les espaces de démo");
const purgeByUser = await as(D, () => fails(`select public.purge_demo_workspaces()`));
ok(purgeByUser !== null, "purge_demo_workspaces() refusée depuis le navigateur");
await db.exec(`delete from storage.objects where name = 'demo/northlight-logo.png'`);
const fresh = (await db.query(`select public.purge_demo_workspaces() n`)).rows[0].n;
await db.exec(`update auth.users set created_at = now() - interval '25 hours' where id = '${D}'`);
const purged = (await db.query(`select public.purge_demo_workspaces() n`)).rows[0].n;
const left = (await db.query(`select (select count(*)::int from public.profiles where id = '${D}') p,
  (select count(*)::int from public.invoices where user_id = '${D}') i, (select count(*)::int from public.profiles) all_p`)).rows[0];
ok(fresh === 0 && purged === 1 && left.p === 0 && left.i === 0 && left.all_p === 2,
  "purge : une démo de moins de 24 h est gardée, après 24 h elle est effacée, les vrais comptes restent");

// Démo en français (barre FR / EN) : mêmes montants HT, textes en français.
// TVA réelle : SASU française à 20 % partout ; en anglais, freelance à Vienne,
// 0 % pour l'Allemagne (autoliquidation) et hors UE.
const F = "d0000000-0000-0000-0000-0000000000f2";
await db.exec(`insert into auth.users (id, email, is_anonymous) values ('${F}', null, true);`);
await as(F, () => db.query(`select public.seed_demo_workspace('fr')`));
const demoFr = await as(F, async () => (await db.query(`select
  (select count(*)::int from public.clients) clients,
  (select count(*)::int from public.invoices) invoices,
  (select count(*)::int from public.invoice_summaries where display_status = 'paid') paid,
  (select count(*)::int from public.invoice_summaries where display_status = 'overdue') overdue,
  (select count(*)::int from public.invoices where created_at >= date_trunc('month', now())) this_month,
  (select sum(subtotal_cents)::int from public.invoice_summaries) subtotal,
  (select count(*)::int from public.invoices where vat_rate <> 20) not20,
  (select address from public.profiles) address,
  (select count(*)::int from public.clients where name = 'Atelier Roche') roche,
  (select count(*)::int from public.invoice_items where description = 'Identité visuelle') line,
  (select count(*)::int from public.invoices where notes like 'Paiement par virement%') notes`)).rows[0]);
ok(demoFr.clients === 6 && demoFr.invoices === 12 && demoFr.paid === 7 && demoFr.overdue === 2
  && demoFr.this_month === 1 && demoFr.address.includes("Lyon") && demoFr.roche === 1
  && demoFr.line === 1 && demoFr.notes === 12 && demoFr.not20 === 0,
  `démo en français : clients, lignes et mentions en français ${JSON.stringify(demoFr)}`);
const E = "d0000000-0000-0000-0000-0000000000e2";
await db.exec(`insert into auth.users (id, email, is_anonymous) values ('${E}', null, true);`);
await as(E, () => db.query(`select public.seed_demo_workspace('en')`));
const demoEn = await as(E, async () => (await db.query(`select
  (select sum(subtotal_cents)::int from public.invoice_summaries) subtotal,
  (select count(*)::int from public.invoices where vat_rate = 0) zero,
  (select count(*)::int from public.invoices where notes like 'Reverse charge%') reverse,
  (select count(*)::int from public.clients where name = 'Roche Studio') roche`)).rows[0]);
ok(demoFr.subtotal === demoEn.subtotal && demoEn.roche === 1 && demoEn.zero === 6 && demoEn.reverse === 2,
  `démo : mêmes montants HT en français et en anglais, TVA du pays de chaque client ${JSON.stringify({ fr: demoFr.subtotal, en: demoEn })}`);
const fallbackLang = await as(F, () => fails(`select public.seed_demo_workspace('de')`));
ok(fallbackLang === null, "seed_demo_workspace() accepte une langue inconnue (anglais) et reste sans effet sur un espace rempli");

console.log(failures === 0 ? "\nTous les tests passent." : `\n${failures} test(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
