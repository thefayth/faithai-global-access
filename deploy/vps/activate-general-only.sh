#!/bin/bash
set -euo pipefail
release=/srv/faithai/releases/20261110Tlaunch
backup=/var/backups/faithai/20261110Tlaunch
test -s "$backup/database.dump"
curl --fail --silent http://127.0.0.1:8792/health >/dev/null
# Deliberately does not touch app.binetusa.org or its gate/pointer.
install -m 0644 "$release/deploy/vps/ai.thefayth.net.conf" /etc/nginx/sites-available/ai.thefayth.net.conf
nginx -t
ln -sfn "$release" /srv/faithai/current
ln -sfn /srv/faithai/host-root/releases/20261110Tlaunch /srv/faithai/host-root/current
install -d -m 0755 /etc/systemd/system/faithai-api.service.d
printf '[Service]\nEnvironmentFile=/etc/faithai/openai.env\n' > /etc/systemd/system/faithai-api.service.d/20261110-openai.conf
systemctl daemon-reload
systemctl restart faithai-api.service
systemctl reload nginx
echo 'General and legacy release activated; BiNet route configuration unchanged.'
