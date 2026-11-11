#!/bin/bash
set -euo pipefail
release=/srv/faithai/releases/20261110Tlaunch
backup=/var/backups/faithai/20261110Tlaunch
test -f "$release/server/api.mjs"
test ! -e "$backup"
install -d -m 0700 "$backup"
cp -a /etc/faithai/faithai.env "$backup/faithai.env"
cp -a /etc/nginx/sites-available/ai.thefayth.net.conf "$backup/ai.thefayth.net.conf"
cp -a /etc/nginx/sites-available/app.binetusa.org.conf "$backup/app.binetusa.org.conf"
readlink -f /srv/faithai/current > "$backup/api.previous"
readlink -f /srv/faithai/host-root/current > "$backup/host.previous"
docker exec faithai-postgres sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$backup/database.dump"
test -s "$backup/database.dump"
sha256sum "$backup/database.dump" > "$backup/database.dump.sha256"
set -a
. /etc/faithai/faithai.env
set +a
cd "$release"
runuser -u faithai --preserve-environment -- /usr/local/bin/node scripts/migrate-postgres.mjs
runuser -u faithai --preserve-environment -- /usr/local/bin/node server/migrate-provider-reservations.mjs
systemd-run --unit=faithai-candidate --service-type=simple \
  -p User=faithai -p Group=faithai -p WorkingDirectory="$release" \
  /usr/bin/env FAITHAI_API_PORT=8792 /usr/local/bin/node \
  --env-file=/etc/faithai/faithai.env --env-file=/etc/faithai/openai.env server/api.mjs
echo 'Database backup, additive migration, and loopback candidate prepared. No public traffic changed.'
