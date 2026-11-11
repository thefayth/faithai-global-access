#!/usr/bin/env sh
set -eu

umask 077
: "${DATABASE_URL:?DATABASE_URL is required}"
FAITHAI_BACKUP_PATH="${FAITHAI_BACKUP_DIR:-/var/backups/faithai}"
FAITHAI_BACKUP_STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FAITHAI_BACKUP_FILE="${FAITHAI_BACKUP_PATH}/faithai-${FAITHAI_BACKUP_STAMP}.dump"

mkdir -p "${FAITHAI_BACKUP_PATH}"
pg_dump --dbname="${DATABASE_URL}" --format=custom --no-owner --no-privileges --file="${FAITHAI_BACKUP_FILE}"
sha256sum "${FAITHAI_BACKUP_FILE}" > "${FAITHAI_BACKUP_FILE}.sha256"
printf '%s\n' "Backup written: ${FAITHAI_BACKUP_FILE}"
