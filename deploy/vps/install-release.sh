#!/usr/bin/env bash
set -euo pipefail

release_archive=${1:-/tmp/faithai-release.tar.gz}
release_id=${2:-$(date -u +%Y%m%dT%H%M%SZ)}
release_root=/srv/faithai/releases
release_dir=${release_root}/${release_id}

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

test -f "${release_archive}"
test -f /tmp/faithai-api.service

getent group faithai >/dev/null || groupadd --system faithai
id faithai >/dev/null 2>&1 || useradd --system --gid faithai --home-dir /srv/faithai --shell /usr/sbin/nologin faithai
if id www-data >/dev/null 2>&1; then
  usermod -a --groups faithai www-data
fi
install -d -o faithai -g faithai -m 0750 /srv/faithai "${release_root}" /srv/faithai/postgres /var/backups/faithai
install -d -o root -g faithai -m 0750 /etc/faithai

if [[ ! -f /etc/faithai/postgres.env ]]; then
  db_password=$(openssl rand -hex 32)
  install -m 0640 -o root -g faithai /dev/null /etc/faithai/postgres.env
  printf 'POSTGRES_DB=faithai\nPOSTGRES_USER=faithai\nPOSTGRES_PASSWORD=%s\n' "${db_password}" >/etc/faithai/postgres.env
fi

if [[ ! -f /etc/faithai/faithai.env ]]; then
  db_password=$(sed -n 's/^POSTGRES_PASSWORD=//p' /etc/faithai/postgres.env)
  install -m 0640 -o root -g faithai /dev/null /etc/faithai/faithai.env
  {
    printf 'FAITHAI_ENVIRONMENT=production\n'
    printf 'FAITHAI_API_PORT=8791\n'
    printf 'FAITHAI_REQUIRE_DATABASE=true\n'
    printf 'FAITHAI_DB_SSL=false\n'
    printf 'FAITHAI_DB_POOL_MAX=5\n'
    printf 'FAITHAI_LIVE_TERRITORIES=global\n'
    printf 'FAITHAI_AI_ENABLED=false\n'
    printf 'FAITHAI_ADSENSE_ENABLED=false\n'
    printf 'FAITHAI_EXOCLICK_ENABLED=true\n'
    printf 'FAITHAI_STRIPE_ENABLED=false\n'
    printf 'FAITHAI_PAYSTACK_ENABLED=false\n'
    printf 'FAITHAI_FLUTTERWAVE_ENABLED=false\n'
    printf 'FAITHAI_CONTENT_SYNC_ENABLED=false\n'
    printf 'FAITHAI_EMERGENCY_ENABLED=false\n'
    printf 'DATABASE_URL=postgresql://faithai:%s@127.0.0.1:55432/faithai\n' "${db_password}"
    printf 'FAITHAI_BACKUP_DIR=/var/backups/faithai\n'
  } >/etc/faithai/faithai.env
fi

if ! docker container inspect faithai-postgres >/dev/null 2>&1; then
  docker run -d \
    --name faithai-postgres \
    --restart unless-stopped \
    --env-file /etc/faithai/postgres.env \
    -p 127.0.0.1:55432:5432 \
    -v /srv/faithai/postgres:/var/lib/postgresql/data \
    postgres:16-alpine >/dev/null
fi

for _ in $(seq 1 30); do
  if docker exec faithai-postgres pg_isready -U faithai -d faithai >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec faithai-postgres pg_isready -U faithai -d faithai >/dev/null

test ! -e "${release_dir}"
install -d -o faithai -g faithai -m 0750 "${release_dir}"
tar -xzf "${release_archive}" -C "${release_dir}"
chown -R faithai:faithai "${release_dir}"

runuser -u faithai -- env HOME=/srv/faithai npm --prefix "${release_dir}" ci --omit=dev --no-audit --no-fund
set -a
source /etc/faithai/faithai.env
set +a
runuser -u faithai -- env HOME=/srv/faithai DATABASE_URL="${DATABASE_URL}" FAITHAI_DB_SSL=false npm --prefix "${release_dir}" run db:migrate
find "${release_dir}" -type d -exec chmod 0750 {} +
find "${release_dir}" -type f -exec chmod 0640 {} +

previous_target=""
if [[ -L /srv/faithai/current ]]; then
  previous_target=$(readlink -f /srv/faithai/current)
fi
ln -sfn "${release_dir}" /srv/faithai/current.next
mv -Tf /srv/faithai/current.next /srv/faithai/current
if [[ -n "${previous_target}" && -d "${previous_target}" ]]; then
  ln -sfn "${previous_target}" /srv/faithai/previous
fi

install -m 0644 -o root -g root /tmp/faithai-api.service /etc/systemd/system/faithai-api.service
systemctl daemon-reload
systemctl enable --now faithai-api.service >/dev/null
systemctl restart faithai-api.service

for _ in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:8791/healthz >/dev/null; then
    break
  fi
  sleep 1
done
curl --fail --silent http://127.0.0.1:8791/healthz
curl --fail --silent http://127.0.0.1:8791/v1/integrations/status

backup_path=/var/backups/faithai/faithai-${release_id}.dump
docker exec faithai-postgres pg_dump -U faithai -d faithai -Fc >"${backup_path}"
sha256sum "${backup_path}" >"${backup_path}.sha256"
chmod 0640 "${backup_path}" "${backup_path}.sha256"
chown faithai:faithai "${backup_path}" "${backup_path}.sha256"

printf '\nRELEASE=%s\nPREVIOUS=%s\nBACKUP=%s\n' "${release_dir}" "${previous_target:-none}" "${backup_path}"
