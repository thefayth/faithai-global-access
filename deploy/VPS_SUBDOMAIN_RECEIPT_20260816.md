# FAITHAI subdomain deployment receipt

## Intent

- `app.binetusa.org` is the teal, BiNet USA-first entry.
- `ai.thefayth.net` is the purple, general FAITHAI-first entry.
- The root domains remain separate products and were not changed.

## Released

- VPS bundle: `/srv/faithai/host-root/releases/20260816T220000Z`
- Active link: `/srv/faithai/host-root/current`
- Nginx routes: `app.binetusa.org.conf` and the staged `ai.thefayth.net.conf`
- API proxy: each host uses same-origin `/v1/` and the existing local FAITHAI service.
- Health check: `app.binetusa.org` shell and `/healthz` returned successfully through the VPS.

## DNS and TLS state

- Completed: Cloudflare CNAME `app.binetusa.org` to the existing healthy tunnel.
- Completed: `ai.thefayth.net` already resolves through the existing `*` wildcard A record to `172.245.243.81`; no duplicate DNS record was created.
- Completed: a Let's Encrypt certificate for `ai.thefayth.net` was issued and the prepared HTTPS server block was enabled. Certificate expiry: 2026-12-27; scheduled renewal is configured by Certbot.

## Validation

- `npm test`: 57 passing tests.
- `npm run build:host-root`: passed.
- Live browser check: `https://app.binetusa.org/` opens directly in the teal BiNet USA lane, showing typed/numeric controls, general-lane switch, and the privacy notice.
- Live browser check: `https://ai.thefayth.net/` opens directly in the purple General FAITHAI lane; its root shell and `/healthz` endpoint returned HTTP 200.

## Rollback

- Remove only the `app.binetusa.org` tunnel ingress rule and its CNAME record.
- Disable only `/etc/nginx/sites-enabled/app.binetusa.org.conf` and reload Nginx.
- Leave the existing `faithai.aixyz.tech`, `binetusa.org`, and `thefayth.net` routes intact.
