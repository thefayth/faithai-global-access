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

## 2026-11-10 — Public beta and Alibaba selection

- General and legacy entries are live. After a minified startup regression, rollback was exercised, the session-ID helper repaired, and a bundled-module regression test added. Final VPS suite: 81 passed; three production builds passed.
- Faith freshly confirmed public BiNet `/help/` only. Its teal English screen was verified at 390px; `/connect/` and `/course/` retain the Coming Soon shield. Remote AI is explicitly denied on the BiNet help API.
- Correct homepage links verified in browser: FAITHAI (private beta) on thefayth.net; BiNet Help (private beta) on binetusa.org. Concurrent KÉVIN changes were preserved.
- Both sanitized public repositories are published. Field Kit source recovery and targeted dependency fixes passed 48 tests, build, source scan, and Worker HTTP smoke. Production dependency audit: zero; full toolchain audit still has 20 findings, none critical.
- Faith requested Alibaba tokens and an email check. Account-specific findings remain in a private, git-ignored receipt. Official Alibaba documentation excludes Token/Coding Plans from custom backends; regular Model Studio support was added with those restricted keys/endpoints rejected.
- Alibaba is selected server-side, but unconfigured and disabled. No Alibaba inference, purchase, billing change, or unauthorized Token Plan use was performed. Core guidance remains free/local.

## 2026-11-11 — Final publication receipts

- Field Kit version9 published successfully to its existing public URL, with native source665480713a7509a8cb8efa2e9885cdf7c201e66b and retained DB/VAULT bindings. The supported source helper required repair of its historically nested hosting manifest; only the 85 reviewed public files were pushed after byte-for-byte comparison, with original recovery/history preserved.
- Public Field Kit source21f916835d320efe4979e8a21fcca3a458fd69da remains a fresh sanitized snapshot, not a disclosure of historical operational source.
- FAITHAI public runtime source3de6c4fa41b5f9b8bdec181b7bb0731f415b9ebb and all three release manifests read back with matching variant/checksum. Both branded live menus render after the final adapter update.
- Private Drive completion folder and uploaded document parents/owner-only permissions were verified. Alibaba setup text was read back. Final index and visual receipts are being added without overwriting earlier log snapshots.
- The temporary loopback web preview service was stopped. Production remains active. Remaining global-service requirements are explicitly open in the final index and completion ledger.
