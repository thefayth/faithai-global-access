#!/bin/bash
set -euo pipefail
release=/srv/faithai/releases/20261110Tlaunch
backup=/var/backups/faithai/20261110Tlaunch
test -s "$backup/database.dump"
test -s /srv/faithai/help/releases/20261110Tlaunch/dist/client/index.html
curl --fail --silent http://127.0.0.1:8792/health >/dev/null
rollback() {
  ln -sfn "$(cat "$backup/api.previous")" /srv/faithai/current
  ln -sfn "$(cat "$backup/host.previous")" /srv/faithai/host-root/current
  cp -a "$backup/ai.thefayth.net.conf" /etc/nginx/sites-available/ai.thefayth.net.conf
  cp -a "$backup/app.binetusa.org.conf" /etc/nginx/sites-available/app.binetusa.org.conf
  if test -f /etc/systemd/system/faithai-api.service.d/20261110-openai.conf; then
    mv /etc/systemd/system/faithai-api.service.d/20261110-openai.conf "$backup/unused-openai-dropin.conf"
  fi
  systemctl daemon-reload
  systemctl restart faithai-api.service
  nginx -t && systemctl reload nginx
  echo 'Previous public release restored; additive migration retained.'
}
trap rollback ERR
install -m 0644 "$release/deploy/vps/binet-help-public-gate.conf" /etc/nginx/snippets/binet-help-public-gate.conf
install -m 0644 "$release/deploy/vps/app.binetusa.help.conf" /etc/nginx/sites-available/app.binetusa.org.conf
install -m 0644 "$release/deploy/vps/ai.thefayth.net.conf" /etc/nginx/sites-available/ai.thefayth.net.conf
nginx -t
ln -sfn "$release" /srv/faithai/current
ln -sfn /srv/faithai/host-root/releases/20261110Tlaunch /srv/faithai/host-root/current
ln -sfn /srv/faithai/help/releases/20261110Tlaunch /srv/faithai/help/current
install -d -m 0755 /etc/systemd/system/faithai-api.service.d
printf '[Service]\nEnvironmentFile=/etc/faithai/openai.env\n' > /etc/systemd/system/faithai-api.service.d/20261110-openai.conf
systemctl daemon-reload
systemctl restart faithai-api.service
for attempt in 1 2 3 4 5; do
  if curl --fail --silent http://127.0.0.1:8791/health >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent http://127.0.0.1:8791/health
systemctl reload nginx
curl --fail --silent --resolve ai.thefayth.net:443:127.0.0.1 https://ai.thefayth.net/health
curl --fail --silent -H 'Host: app.binetusa.org' http://127.0.0.1/help/ --output /tmp/faithai-help-launch-response.html
head -c 90 /tmp/faithai-help-launch-response.html
echo
systemctl stop faithai-candidate.service
trap - ERR
echo 'Release activated. Previous release and database backup preserved.'
