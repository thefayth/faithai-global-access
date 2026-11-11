#!/usr/bin/env bash
set -euo pipefail

candidate=${1:-/tmp/public-custom-domains.after.conf}
active_link=/etc/nginx/sites-enabled/public-custom-domains.conf
active_file=$(readlink -f "${active_link}")
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_dir=/etc/nginx/faithai-backups
backup_file=${backup_dir}/public-custom-domains.${stamp}.conf

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

test -f "${candidate}"
test -f "${active_file}"
install -d -o root -g root -m 0750 "${backup_dir}"
cp -a "${active_file}" "${backup_file}"

restore() {
  cp -a "${backup_file}" "${active_file}"
  nginx -t
  systemctl reload nginx
  sleep 1
}

install -m 0644 -o root -g root "${candidate}" "${active_file}"
if ! nginx -t; then
  restore
  exit 1
fi
systemctl reload nginx
sleep 1

header_file=$(mktemp)
trap 'rm -f "${header_file}"' EXIT
if ! html=$(curl --fail --silent --show-error --dump-header "${header_file}" -H 'Host: aixyz.tech' http://127.0.0.1/faithai/); then
  echo "FAITHAI_HTML_CHECK=failed" >&2
  restore
  exit 1
fi
if [[ "${html}" != *"FAITHAI"* || "${html}" != *"/faithai/assets/"* ]]; then
  echo "FAITHAI_HTML_CONTENT=unexpected" >&2
  sed -n '1,12p' "${header_file}" >&2
  printf '%s' "${html}" | grep -o -m1 '<title>[^<]*</title>' >&2 || true
  printf 'FAITHAI_HTML_BYTES=%s\n' "${#html}" >&2
  nginx -T 2>/dev/null | grep -n -B 5 -A 8 'location = /faithai/' >&2 || true
  restore
  exit 1
fi
curl --fail --silent --show-error -H 'Host: aixyz.tech' http://127.0.0.1/faithai-healthz >/dev/null || { echo "FAITHAI_HEALTH_CHECK=failed" >&2; restore; exit 1; }
curl --fail --silent --show-error -H 'Host: aixyz.tech' http://127.0.0.1/faithai-api/v1/integrations/status >/dev/null || { echo "FAITHAI_API_CHECK=failed" >&2; restore; exit 1; }

printf 'ACTIVE=%s\nBACKUP=%s\n' "${active_file}" "${backup_file}"
