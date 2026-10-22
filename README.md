# House Rent MG

A small mobile-friendly web app for managing a building's monthly house rent: what each flat owes, what has been paid, and what was spent. It prints the monthly bills and collection sheets in Bangla.

Built with React 19, Vite and Tailwind CSS, with Supabase for the database and login. It can be installed on a phone as a PWA and works offline with the last loaded data.

## Features

- **Dashboard:** one card per unit for the selected month (month and year dropdowns, current year and the two before it), with the total and the remaining due.
- **Payments:** add a payment for a unit (prefilled with the due amount), list the month's payments and delete them.
- **Spendings:** add spendings for a unit or for the building in general, list and delete them. A unit spending can be marked as *chargeable*, which adds it to that tenant's bill.
- **Create monthly rents:** creates the selected month's rent rows for units that don't have one yet. Charges are copied from the unit, and the remaining due from the previous month is carried over. You're warned if a carried-over due is negative.
- **Printing (Bangla):**
  - *Bills:* one slip per unit, four per A4 page.
  - *A & B sheet / C & D sheet:* a collection sheet for the A/B or C/D flats of every floor, with blank columns and an expense table for filling in by hand.

  Printing opens the browser's print dialog; choose "Save as PDF" to get a PDF.
- **PWA:** installable on Android and iOS, and opens offline showing the data from when each month was last opened.

## Getting started

Requirements: Node.js 20 or newer and a Supabase project.

```sh
npm install
cp .env.example .env   # then fill in your Supabase URL and publishable key
npm run dev
```

| Script            | What it does                         |
|-------------------|--------------------------------------|
| `npm run dev`     | Start the dev server                 |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Serve the production build locally   |
| `npm run lint`    | Run ESLint                           |

## Database

The app expects these tables in the Supabase `public` schema, each with row-level security allowing the `authenticated` role full access. Users are created in Supabase Auth (email and password).

| Table               | Purpose                                     | Key columns                                                                                                       |
|---------------------|---------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| `units`             | Flats and their regular charges             | `id` (e.g. `1A`), `rent`, `electricity`, `water`, `gas`, `garbage`, `service_charge`                             |
| `monthly_rents`     | A unit's bill for a month                   | primary key (`unit_id`, `month`), the charge columns above, `due` (carried over), `note`                          |
| `rent_payments`     | Payments received                           | `unit_id`, `month`, `amount`, `created_at`; (`unit_id`, `month`) references `monthly_rents`                       |
| `monthly_spendings` | Money spent, per unit or for the building   | `unit_id` (null for general), `month`, `amount`, `reason`, `chargeable`, `created_at`                             |

`month` is always the first day of the month (e.g. `2026-10-01`). Payments and unit spendings can only be added once the unit has a `monthly_rents` row for that month.

## Deploying

Every push to `main` builds the app and deploys it to GitHub Pages (`.github/workflows/deploy.yml`), at https://purno998.github.io/house-rent-mg/. One-time setup on GitHub:

1. **Settings → Secrets and variables → Actions:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as repository secrets.
2. **Settings → Pages:** set *Source* to *GitHub Actions*.

The app is built for the `/house-rent-mg/` path (`base` in `vite.config.js`). To host it at the root of a domain instead, change `base` to `/`. Wherever it's hosted, it must be served over HTTPS for the app to be installable and for offline support to work.

The service worker (`public/sw.js`) only runs in production builds. It always fetches the latest app version when online, so new deploys show up without extra steps. If you change the icons or `manifest.webmanifest`, bump `STATIC = 'static-v1'` in `public/sw.js` so phones fetch the new files.
