# Changelog

## 1.0.0 (2026-09-09)

First production release: deployed on Vercel against a dedicated Supabase project, holding the
harvest history imported from the original workbook.

### Features

* Public dashboard with yearly comparisons and period, crop, variety and location filters
* Annual harvest goals per crop, with progress shown in full-year views
* Public harvest history, detail pages and pagination
* Authenticated administration of harvests, goals, crops, varieties and growing locations
* Moving a variety to another crop, with its harvests following along
* One-time import from the historical workbook, reconciled against recorded totals
* Installable PWA, verified on Android and iOS

### Security

* Writes restricted to an explicit administrator allowlist, checked by `is_admin()` from every
  write policy
* Table privileges reduced to read-only for anonymous requests, so row level security is not the
  only control on the write path

### Operations

* Weekly verified database backups with rotation, run from a systemd user timer
