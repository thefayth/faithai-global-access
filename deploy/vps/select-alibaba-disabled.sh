#!/bin/bash
set -euo pipefail
release=/srv/faithai/releases/20261110Tlaunch
backup=/var/backups/faithai/20261110Tlaunch
test -f "$release/deploy/vps/alibaba.env.example"
if test -f /etc/faithai/alibaba.env; then cp -a /etc/faithai/alibaba.env "$backup/alibaba.env.before-selection"; fi
install -m 0640 -o root -g faithai "$release/deploy/vps/alibaba.env.example" /etc/faithai/alibaba.env
printf '[Service]\nEnvironmentFile=/etc/faithai/alibaba.env\n' > /etc/systemd/system/faithai-api.service.d/20261110-z-alibaba.conf
systemctl daemon-reload
systemctl restart faithai-api.service
echo 'Alibaba regular-API adapter selected; unconfigured and disabled. No inference or billing action performed.'
