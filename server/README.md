# FAITHAI Portable API

This directory now contains both the in-memory contract harness and the VPS PostgreSQL runtime. `api.mjs` uses `DATABASE_URL` when configured, can require PostgreSQL with `FAITHAI_REQUIRE_DATABASE=true`, binds to `127.0.0.1`, emits structured request logs, and shuts the pool down cleanly. The in-memory path remains available for tests and offline development.

```text
STATIC CLIENT -> /v1 contract -> PostgreSQL + object storage
                                  |
                                  +-> transactional outbox -> retry -> dead-letter review
```

Production requirements:

- TLS and a managed ingress;
- PostgreSQL migrations and backups;
- S3-compatible object storage for signed packs;
- OIDC plus MFA for stewards;
- endpoint, circle, and anonymous-session rate limits;
- an idempotency-retention policy;
- two-person approval for high-impact content;
- monitoring, rollback, and incident ownership.

Apply the checksum-locked baseline with `npm run db:migrate`. See `VPS_DEPLOYMENT.md` for the primary low-cost runbook and `CLOUDFLARE_DEPLOYMENT.md` only for the optional Cloudflare path. External providers remain disabled by default.
