# Changelog

## [1.0.2](https://github.com/ryll/skordedagbok/compare/v1.0.1...v1.0.2) (2026-09-17)


### Bug fixes

* **public:** handle data fetch errors and add loading states ([#13](https://github.com/ryll/skordedagbok/issues/13)) ([9fc10e9](https://github.com/ryll/skordedagbok/commit/9fc10e91e8d525e219a83c46206f8b1580ac24e3))

## [1.0.1](https://github.com/ryll/skordedagbok/compare/v1.0.0...v1.0.1) (2026-09-09)


### Bug fixes

* **ci:** anchor release-please to the v1.0.0 tag ([66809ee](https://github.com/ryll/skordedagbok/commit/66809eed877c751ffb435cc197f2542abf9af79c))

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
