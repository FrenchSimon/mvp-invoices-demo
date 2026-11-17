<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Billnote

Invoicing app for freelancers. See `README.md` for features and architecture, `DESIGN.md` for the visual system.

## Stack

Next.js 16 (App Router, Server Actions, `src/proxy.ts` instead of middleware), React 19, TypeScript, Tailwind CSS 4 with shadcn/ui, Supabase (Postgres, Auth, Storage), Stripe in test mode, Resend, `@react-pdf/renderer`, deployed on Vercel.

## Commands

- `npm run dev`: local server on http://localhost:3000
- `npm run test:db`: database tests (migrations run in PGlite, no Docker)
- `npm run typecheck` and `npm run lint`: run both before every commit

## Rules

- **Security is enforced by the database.** Every table has row level security. Never rely on the interface alone to hide or block data; add or update a policy and a test in `supabase/tests/rls.test.mjs`.
- **Every database change is a new migration** in `supabase/migrations/` (timestamped file name). Never edit an applied migration, never change the schema from the Supabase dashboard, and never apply a migration to the live project without the owner's approval.
- **Business rules live in Postgres** (plan limit, invoice numbering, dates, lock on sent invoices). Code in `src/` may warn early, but the database has the final say.
- **Secrets stay server side.** Only `NEXT_PUBLIC_*` variables reach the browser. The Supabase secret key is read only in `src/lib/supabase/admin.ts`, and used only for Stripe (checkout and webhook) to link a customer and update the plan. The demo purge runs inside Postgres with `pg_cron`.
- **Stripe is the source of truth for the plan.** The webhook verifies the signature, then reads the subscription from Stripe. Keep it idempotent: receiving the same event twice must give the same result.
- **The demo workspace follows the normal rules.** Anonymous demo users go through the same policies and limits as real accounts.
- **Styling uses the theme variables** from `src/app/globals.css` (`bg-primary`, `text-muted-foreground`…), never hard-coded colors.
- Commits: small, one feature or fix each, prefixed `feat:`, `fix:`, `test:`, `docs:` or `chore:`.
