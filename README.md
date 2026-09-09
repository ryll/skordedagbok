# Skördedagbok

[![CI](https://github.com/ryll/skordedagbok/actions/workflows/ci.yml/badge.svg)](https://github.com/ryll/skordedagbok/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A Swedish, mobile-friendly harvest journal built with Next.js, TypeScript, and Supabase. Read access is public. A manually created administrator can record and manage harvests and catalog entries.

Live at **[skordedagbok.vercel.app](https://skordedagbok.vercel.app)**.

The MVP focuses on balcony gardening. It does not include offline data entry, public registration, image management, price or expense tracking, or per-user data separation.

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
5. Manually create the administrator under Authentication → Users. Confirm the user if email confirmation is enabled for the project, then add it to the allowlist that gates writes:

   ```sql
   insert into public.admins (user_id) select id from auth.users where email = '...';
   ```
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

## Development workflow

`main` is always deployable and always what production runs. Work happens on short-lived
`feat/…` or `fix/…` branches and lands through a pull request, which Vercel builds as a preview
against the development Supabase project — so every branch is testable against real data without
touching production.

Pull requests are squash-merged, so the pull request title becomes the commit subject on `main`
and must be a [Conventional Commit](https://www.conventionalcommits.org/); CI checks this.
`release-please` reads those subjects to maintain `CHANGELOG.md`, bump the version, and tag
releases: `fix` gives a patch, `feat` a minor, and `!` or a `BREAKING CHANGE:` footer a major.

Releases document what shipped rather than gating it — every push to `main` deploys regardless.
Because nothing consumes this project as a dependency, "breaking" means a release that needs a
manual step, such as a migration to apply or an environment variable to add.

## Production

Deployed on Vercel from `main`, against a dedicated Supabase project in `eu-north-1`, separate
from development. Preview deployments point at the development project, so a pull request can
never write to production data; logging in on a preview URL is not expected to work.

### Environment

Vercel holds only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, set per
environment. `SUPABASE_SERVICE_ROLE_KEY` is absent everywhere — it is only ever used locally by
the importer. Both public values are inlined at build time, so changing either one requires a
redeploy, not just a save.

### Administrators

Public sign-up and anonymous sign-ins are disabled, and writes require a row in `public.admins`,
checked by `is_admin()` from every insert, update and delete policy. Creating an account grants
read access only; an administrator is added deliberately:

```sql
insert into public.admins (user_id) select id from auth.users where email = '...';
```

`public.admins` has RLS enabled and no policies, so it is unreachable through the API; only
`is_admin()`, which is `security definer`, can read it. Anonymous roles hold `SELECT` and nothing
else at the table level, so RLS is not the only thing standing between an anonymous request and a
write.

Note that all administrators share one journal. There is no per-user data separation, so a second
account is a co-editor of the same harvests, not a separate garden.

### Migrations

Applied with `npx supabase@latest db push`, which the CLI is linked to the production project for.
The twelve-digit filename prefixes are accepted despite differing from the CLI's own fourteen-digit
timestamps. If that ever breaks, apply the file directly instead — `supabase/migrations/` is the
record of what has been applied either way:

```bash
psql -v ON_ERROR_STOP=1 "$PROD_DB_URL" -f supabase/migrations/<file>.sql
```

Apply every migration to development first and run the suites against it, including the admin
end-to-end spec, which needs `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` and is skipped without them.

### Backups

Supabase Free has no automatic backups and pauses a project after prolonged inactivity, so
`ops/backup.sh` is the safety net. It dumps the production `public` schema, verifies the dump
contains every table and as many harvest rows as the live database, and keeps the newest eight in
`backups/` (Git-ignored). It reads `PROD_DB_URL` from `ops/backup.env`, which is Git-ignored and
must be created by hand.

A systemd user timer runs it weekly:

```bash
systemctl --user list-timers skordedagbok-backup.timer   # last and next run
systemctl --user start skordedagbok-backup.service       # run one now
journalctl --user -u skordedagbok-backup.service         # what happened
```

`Persistent=true`, so a run missed while the machine was off happens shortly after the next boot.
Failures raise a desktop notification rather than passing silently. Take a manual dump before any
migration or bulk edit as well; the timer is not a substitute for that. The original workbook
remains the deeper fallback.

Restoring into an empty project is the same pass used to create production in the first place:

```bash
psql "$PROD_DB_URL" -c 'drop schema public cascade; create schema public;'
psql -v ON_ERROR_STOP=1 "$PROD_DB_URL" -f backups/<dump>.sql
```

A fresh Supabase project provisions `public` itself and owns some default privileges as
`supabase_admin`, so a dump taken elsewhere may need `CREATE SCHEMA public` made conditional and
the `supabase_admin` default-privilege statements dropped before it will load.

### Backup timer units

`ops/skordedagbok-backup.service` and `ops/skordedagbok-backup.timer` are reference copies of the
units. systemd only reads `~/.config/systemd/user/`, so install them there:

```bash
cp ops/skordedagbok-backup.{service,timer} ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now skordedagbok-backup.timer
```

Both reference an absolute path to `ops/backup.sh`; adjust it if the repository lives elsewhere.

### Rollback

Frontend regressions roll back through Vercel's Instant Rollback to the last good deployment.
That does not undo a migration: database problems are fixed forward with a new migration, or by
restoring the most recent dump.

## PWA

The application includes a manifest, an iPhone icon, and standalone-display metadata. The service worker is registered only in production builds and caches local icon files exclusively. It does not intercept navigation, Supabase requests, or writes, so the application never promises offline data entry.

The setup follows the official [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).
