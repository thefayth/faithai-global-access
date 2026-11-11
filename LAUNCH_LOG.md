# FAITHAI launch log

## 2026-11-10 — Work started

- Faith authorized the completion plan and deployment. BiNet `/help/` is now explicitly approved for public launch; the remaining BiNet ecosystem stays gated.
- Verified external drive: D: `G30RG3`. Source copied additively from the original FAITHAI workspace; environment secrets, backups, node_modules, and generated releases were excluded.
- Current VPS releases: `/srv/faithai/releases/20260810T090000Z` and `/srv/faithai/host-root/releases/20260816T220000Z`.
- Current BiNet gate blocks all public runtime paths. The launch must permit only `/help/` and its narrowly scoped API/assets while preserving the other gate behavior.
- Required verification: source tests, build, desktop/mobile render, offline/cache boundaries, live endpoint checks, release hashes, rollback pointers, public repositories, and Drive readback.
- Status: implementation in progress. Live AI, payments, reviewed content, Field Kit reconciliation, and provider activation have not been represented as complete.

## 2026-11-10 — Candidate verification

- Built general root, BiNet `/help/`, and legacy `/faithai/` artifacts on the existing VPS with isolated Linux dependencies. Initial shell is about 120 KB gzip; Classic is a separate chunk.
- Full candidate suite: 77 passed before the final production-write gate audit.
- Preserved database/config backups under `/var/backups/faithai/20261110Tlaunch`; baseline migration checksum matched, additive migration 002 applied.
- Existing OpenAI account authenticated and listed GPT-5.6 Luna. A consented synthetic routing test returned HTTP 429, `insufficient_quota` / `credit_balance_exhausted`. No billing change made; pilot disabled pending funded API access. Local guidance remains available.
- Added one-request US/English consent UI, durable conservative budget reservations, per-call input/output limits, and server-side sensitive-context exclusions. Automated filters are limited safeguards, not a guarantee of perfect redaction.
- Connected Stripe account remains sandbox-only. No payment accepted; payment providers remain off.
- ExoClick actual-hostname approval is unverified; third-party ads remain off. No new paid service was activated.
- Faith selected: "Launch with free local guidance; AI stays off." Live AI is intentionally deferred for this release; do not retry billable calls or enable the provider without a new funded-pilot decision.
