#!/usr/bin/env bash
# Dump the production public schema and rotate old copies.
#
# Run by the skordedagbok-backup systemd user timer, or by hand at any time.
# Supabase Free has no automatic backups, so these dumps are the only safety net
# besides the original workbook.
#
# Reads PROD_DB_URL from ops/backup.env (gitignored). Writes to backups/.

set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$repo_dir/ops/backup.env"
backup_dir="$repo_dir/backups"
keep=8

notify() {
  # Best effort: there is no desktop session when run from a tty or over ssh.
  notify-send --urgency=critical "Skördedagbok backup" "$1" 2>/dev/null || true
  echo "$1" >&2
}

fail() {
  notify "$1"
  exit 1
}

[[ -r "$env_file" ]] || fail "Missing $env_file"
# shellcheck source=/dev/null
source "$env_file"
[[ -n "${PROD_DB_URL:-}" ]] || fail "PROD_DB_URL is not set in $env_file"

umask 077
mkdir -p "$backup_dir"

target="$backup_dir/skordedagbok-$(date +%F-%H%M).sql"

if ! pg_dump --schema=public --no-owner "$PROD_DB_URL" > "$target" 2>"$target.err"; then
  notify "pg_dump failed: $(tail -n 1 "$target.err")"
  rm -f "$target" "$target.err"
  exit 1
fi
rm -f "$target.err"

# A dump that succeeded but lost the data is worse than a failure, because it
# rotates a good copy out. Check every table is present by name, then count the
# harvest rows in the dump against the live table rather than a hardcoded number.
for table in crop_types varieties growing_locations harvests crop_goals; do
  if ! grep -q "^CREATE TABLE public\.$table " "$target"; then
    fail "Dump is missing table $table; kept as $target for inspection"
  fi
done

live_rows=$(psql -tAX "$PROD_DB_URL" -c 'select count(*) from public.harvests')
dumped_rows=$(sed -n '/^COPY public\.harvests /,/^\\\.$/p' "$target" | sed '1d;$d' | wc -l)
if [[ "$dumped_rows" -ne "$live_rows" ]]; then
  fail "Dump has $dumped_rows harvest rows, database has $live_rows; kept as $target for inspection"
fi

# Rotate: keep the newest $keep verified dumps.
mapfile -t old < <(ls -1t "$backup_dir"/skordedagbok-*.sql 2>/dev/null | tail -n +$((keep + 1)))
if [[ ${#old[@]} -gt 0 ]]; then
  rm -f "${old[@]}"
fi

echo "Wrote $target ($(du -h "$target" | cut -f1)), $(ls -1 "$backup_dir"/skordedagbok-*.sql | wc -l) kept"
