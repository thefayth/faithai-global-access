#!/usr/bin/env sh
set -eu

: "${1:?Pass the exact .dump backup path}"
FAITHAI_BACKUP_FILE="$1"
test -f "${FAITHAI_BACKUP_FILE}"
test -f "${FAITHAI_BACKUP_FILE}.sha256"
sha256sum --check "${FAITHAI_BACKUP_FILE}.sha256"
pg_restore --list "${FAITHAI_BACKUP_FILE}" >/dev/null
printf '%s\n' "Backup checksum and PostgreSQL archive structure verified: ${FAITHAI_BACKUP_FILE}"
