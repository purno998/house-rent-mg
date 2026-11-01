# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm run dev       # dev server
npm run build     # production build into dist/
npm run preview   # serve the production build (needed to exercise the service worker)
npm run lint      # ESLint — CI runs this before the build, so a lint error fails the deploy
```

There is no test framework in this project. Verify changes by running the app.

`.env` must hold `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (see `.env.example`). The same names exist as GitHub Actions secrets for the Pages deploy.

## Architecture

A single-screen React app: `App.jsx` holds the Supabase session and the selected month, and renders either `LoginForm` or `Dashboard`. Everything else is a dialog or a print view mounted from `Dashboard.jsx`. There is no router and no state library.

### The unit object

`Dashboard` is the only place that queries for the month, and it does so in **two** requests:
one for `units` with `monthly_rents`, `rent_payments`, `monthly_spendings` and
`unit_month_totals` embedded, and one for the general spendings (`unit_id is null`), which
have no unit to embed under. It then **mutates each unit row in place** to attach
`monthlyRent`, `payments`, `spendings`, `total`, `extras`, `payment` and `due`. Every
downstream component (cards, bills, sheets) consumes that shape. Note `unit.rent` is the
unit's base rent *column*, while `unit.monthlyRent` is the month's row — easy to confuse.

### Money math lives in the database

A unit's `total`, `extras`, `paid` and `remaining` come from the `unit_month_totals` view
(`supabase/schemas/05_unit_month_totals.sql`). That view is the **only** definition of what a
bill adds up to — do not recompute it in JS. The dashboard card, the printed bill, the
collection sheet and the carried-over `due` all read the same numbers from it.

Creating next month's rents is `public.create_monthly_rents(p_month)`
(`supabase/schemas/06_create_monthly_rents.sql`), which reads `remaining` from that same view.
It is atomic and idempotent — re-running it inserts nothing. `utils/createRents.js` is now just
the `rpc()` call.

`utils/bills.js` keeps only presentation: Bangla formatting and `chargeableSpendings`, which
lists the line items. It no longer totals anything.
### Printing

`Printable` portals its children to `document.body`; `Printable.css` hides the app and shows that subtree only in `@media print`. The flow is: set `printJob` state → effect waits for the Bangla font with `document.fonts.load` (the font isn't used on screen, so it isn't fetched yet) → `window.print()` → `afterprint` clears the job. Print views render only while printing.

Two print outputs: bills (four slips per A4 page) and the A&B / C&D collection sheets. Sheet membership comes from the last letter of the unit id (`1A`, `2C`, …). General spendings are split by the `forAB` boolean — true goes on the A&B sheet, false *and null* on C&D.

### Bangla output

All printed text is Bangla and lives in `utils/bills.js`: `taka`, `bnUnitId`, `bnMonth` and the `CHARGES` label table. Numbers use `Intl` with the `bn-BD` locale; unit letters map through `BN_LETTERS`. The on-screen UI stays in English (`fmt` in `utils/rents.js` uses `en-BD`).

### Database

The schema lives in `supabase/schemas/` as declarative SQL, with generated migrations in
`supabase/migrations/`. Change the schema files, then run
`supabase db schema declarative sync --name <name>` to generate a migration — never hand-write
one first.

Two traps:

- **`declarative sync` re-grants `anon`.** Supabase grants `anon` full DML on every new table,
  and pg-delta regenerates those grants from its own defaults. `supabase/schemas/99_revoke_anon.sql`
  declares the revocation; always check a generated migration for `TO "anon"` before applying it.
- **The direct database host is IPv6-only.** `supabase db pull`/`push` hang silently on an
  IPv4-only network. Use the MCP server, or pass a pooler connection string to `--db-url`.

`month` is always the first day of the month (`monthKey(date)` produces it), enforced by a
CHECK constraint on all three month-bearing tables.

### Service worker and PWA

`public/sw.js` is hand-written and only registered in production builds (`main.jsx`). It network-firsts navigations and Supabase `/rest/` calls (so the app opens offline with the last-seen data), and cache-firsts static assets and Google Fonts. It derives its base path from its own URL, so it works under `/house-rent-mg/`.

After changing the icons or `manifest.webmanifest`, bump `STATIC = 'static-v1'` in `public/sw.js`. Logout deletes the `supabase-data` cache so the next user doesn't see stale data offline.

**Reads must stay GET.** `sw.js` ignores every non-GET request, so offline support exists only
for cacheable GETs. Tables and views qualify; `supabase.rpc()` POSTs do not. Moving a read into
an RPC silently breaks offline mode — the month renders blank instead of showing last-seen data.
Writes are free to be RPCs, since writes already fail offline.

### Deployment

Push to `main` → GitHub Actions lints, builds and deploys to Pages. `base: '/house-rent-mg/'` in `vite.config.js` is what makes the asset URLs work there.

## Conventions

- Plain `.jsx` with a default export per component; a component that needs styles imports its own co-located `.css` file.
- CSS is hand-written with custom properties in `index.css`; Tailwind is installed and used only for the occasional layout utility.
- Native platform features over libraries: `<dialog>` for modals, the popover API for menus, `useSyncExternalStore` over `online`/`offline` events.
