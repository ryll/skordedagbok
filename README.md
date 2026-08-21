# Skördedagbok

A Swedish, mobile-friendly harvest journal built with Next.js, TypeScript, and Supabase. Read access is public. A manually created administrator can record and manage harvests and catalog entries.

The MVP focuses on balcony gardening. It does not include offline data entry, public registration, image management, price or expense tracking, or production configuration.

## Features

- Public harvest dashboard with yearly comparisons and period, crop, variety, and location filters
- Annual harvest goals per crop, with progress shown in full-year dashboard views
- Public harvest history and detail pages
- Authenticated administration for harvests, goals, crops, varieties, and growing locations
- Moving a variety to another crop from the catalog administration, with its harvests following along
- Mobile-friendly PWA metadata and locally cached application icons

## Local development

Requirements: Node.js 22+, npm, and a separate hosted Supabase project for development.

1. Install dependencies with `npm install`.
2. Create the Supabase project and run the SQL files in `supabase/migrations` in filename order, for example through the Supabase CLI or SQL editor.
3. Copy `.env.example` to `.env.local` and add the project URL and publishable/anon key. `SUPABASE_SERVICE_ROLE_KEY` is only needed by the local one-time importer.
4. Disable **Allow new users to sign up** under Authentication → Sign In / Providers in Supabase.
5. Manually create the sole administrator under Authentication → Users. Confirm the user if email confirmation is enabled for the project.
6. Start the application with `npm run dev` and open `http://localhost:3000`.

The service-role key is never used by the application's browser code. Authentication uses Supabase cookie-based sessions, while `proxy.ts` refreshes the session and protects `/admin`.

The implementation follows Supabase's official guides for [server-side authentication](https://supabase.com/docs/guides/auth/server-side/nextjs) and [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Historical import

The workbook contains personal data and is ignored by Git. The importer only reads `Odling` and `Skörd 2026`. It aborts before accessing the database if the headers, cell ranges, candidate rows, or reconciliation totals differ from the reviewed workbook.

```bash
# The default is a dry run. It creates import-review.csv without writing to the database.
npm run import:harvests -- "Skörd 2026.xlsx" --dry-run

# Run after manual review; requires the service-role key in the environment.
npm run import:harvests -- "Skörd 2026.xlsx" --apply
```

The apply operation uses a single PostgreSQL function and is therefore transactional. `(legacy_source_sheet, legacy_source_row)` is unique, so repeated runs skip rows that have already been imported. `import-review.csv` contains every excluded source row and must not be committed. The workbook is never modified.

Expected reconciliation totals:

| Year | Rows | Quantity | Weight |
|---|---:|---:|---:|
| 2025 | 532 | 2,231 | 38,952 g |
| 2026 | 624 | 1,361 | 33,649.37 g |
| Total | 1,156 | 3,592 | 72,601.37 g |

All eight confirmed duplicate pairs are imported as separate harvests. Four zero-weight Chili – Aurora rows are corrected to 0.5 g, and the sowing date for Salvia on source row 27 is corrected to 2025-12-21. The rules verify the original source values before applying these corrections. No rows remain for manual review.

## Tests and verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Vitest covers domain, form, and import behavior. Reconciliation against the real workbook runs when the Git-ignored workbook is available locally. `supabase/tests/database.sql` verifies database constraints and RLS with pgTAP in a configured Supabase test environment. The Playwright configuration covers Chromium, Firefox, WebKit, and iPhone 13; full admin CRUD requires the development project and test credentials.

## PWA

The application includes a manifest, an iPhone icon, and standalone-display metadata. The service worker is registered only in production builds and caches local icon files exclusively. It does not intercept navigation, Supabase requests, or writes, so the application never promises offline data entry.

The setup follows the official [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).
