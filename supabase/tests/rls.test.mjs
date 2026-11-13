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
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema public, auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated;
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
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
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

console.log(failures === 0 ? "\nTous les tests passent." : `\n${failures} test(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
