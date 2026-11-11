# FAITHAI Guided ASCII Adventure — Completion Addendum

Date: 2026-08-07  
Status: terminal-first local production build complete; Classic rollback preserved

The default experience is now a blank purple React/DOM terminal using the loop `BOOT -> LISTEN -> CONFIRM -> CHOOSE -> ACT -> RECEIPT`. Natural typing, numbers, or single-letter commands create one useful artifact within five exchanges. Browser speech is opt-in and editable; sound is generated locally and begins muted. `[C]` lazy-loads the preserved Classic interface and `[T]` returns to the terminal.

Verification completed with 41 passing tests, a production build, desktop and 375 px mobile playthroughs, Arabic RTL, reduced motion, offline restart, speech disclosure, neutral quick exit, saved Journey resumption, and zero final browser console warnings or errors. The initial compressed terminal shell is 112.27 KB; Classic remains a separate 25.68 KB compressed chunk.

See `GUIDED_ASCII_ADVENTURE.md` and `outputs/ASCII_ADVENTURE_RECEIPT.md` for the runtime contract and evidence ledger.

---

# FAITHAI Global Help — Implementation Receipt

## Public deployment integration layer — 2026-08-07

The public deployment shape is now implemented as a reversible Cloudflare Worker/D1/R2/Queue scaffold in `cloudflare/worker.js`, `cloudflare/migrations/0001_public.sql`, and `wrangler.jsonc`. The local API exposes matching status, consent-gated AI, referral-only emergency resources, content-source, hosted-payment, and webhook contracts.

External providers remain disabled by default. The edge worker requires D1 for durable state, keeps server-only secrets out of the client, rejects unapproved safety or raw utterance input, applies the configured AI caps, and returns explicit disabled/fallback responses when a provider is absent. SMS/USSD remains simulator-only.

The shared adapters cover provider-neutral AI, emergency freshness/two-person review, allowlisted content publication, contextual AdSense/ExoClick/sponsor placements, hosted Stripe/Paystack/Flutterwave payments, and separate revenue ledgers. ExoClick is intentionally only an adapter; it is not activated by this build. See `CLOUDFLARE_DEPLOYMENT.md` for the non-automatic staging runbook and pilot gates.

### Final verification receipt

- `npm test`: 47 passing, 0 failing.
- `npm run test:integrations`: 6 passing, 0 failing.
- `node --check cloudflare/worker.js`: passed.
- `npm run build`: passed; Sites packaging emitted `dist/server/index.js` and `dist/.openai/hosting.json`.
- `npm run validate:public-config`: intentionally blocked by `REPLACE_WITH_D1_DATABASE_ID`; all external provider flags remain false.
- SHA-256 receipts: `src/integration-config.js` `85ACCE10C20850447D5C4A7E02AD542DD69B14840B2D63AB4FB53D9C87AF418A`; `cloudflare/worker.js` `49F1B27D34C0F18C883BC344844306C65F818A4FC21CB51FE81AA1B1A5F4BE61`; `wrangler.jsonc` `D0545DB428DB06D1C7A2D81CFD5BCD8D747CE1F70C9ED2EE6BE6140849355E8B`; `cloudflare/migrations/0001_public.sql` `D2FA3549201A50C34E67F10576A0465CC8AC8E7BB7357F8E1D03763E2D010AD0`.

Date: 2026-08-06  
Status: local production build complete; external provider pilots gated

## What now works

```text
PURPLE WEB / OFFLINE PWA
  |
  +-- 0-5 JOSHUA OPENING ---- one saved next step
  +-- H JOURNEY BOARD ------- NOW / NEXT / LATER / DONE
  +-- M MORE HELP
       |
       +-- 1 PRIVATE CHALLENGES -- DONE / NEED HELP / LATER
       +-- 2 HELP BOOKS --------- read / print / text packet
       +-- 3 FARM + FOOD -------- sourced prototype pack
       +-- 4 AID + SERVICES ----- no eligibility decision
       +-- 5 SAFETY GUIDE ------- private / Q quick exit
       +-- 6 POWER CREDITS ------ noncash primer + API receipt
       +-- 7 PARTNERS ----------- stewardship / revenue / recovery
       +-- U SMS-USSD SIMULATOR - numbered / explicitly not sent
```

- Core access requires no account, email, phone number, payment, ad view, or formal ID.
- Every primary flow accepts numbers or single-letter commands. Free text is optional.
- `H` is a resumable local journey board. It preserves receipts and clear controls.
- `M` opens a seven-lane Help Hub. On narrow screens it scrolls directly into view.
- Community challenges are invitation-scoped and cooperative. There are no profiles, rankings, points, streaks, direct messages, paid boosts, or public feed.
- Help cards include source, territory, version, license, review state, publication date, and expiration.
- Built-in high-impact records say `PROTOTYPE` and require human regional review. They are not presented as current live services.
- Safety state is component-only: it is not saved, synchronized, or sent to analytics. `Q` replaces FAITHAI with a neutral weather-notes screen and title.
- Account-free recovery uses AES-GCM with a PBKDF2-derived key and an unambiguous alphanumeric code.
- The PWA caches the text shell. The galaxy image and third-party advertising are not pre-cached.
- Resumable pack download code uses byte ranges and verifies SHA-256 before install. Remote manifests remain rejected until signed for a governed pilot.
- English, Spanish, French, Kiswahili, and Arabic are active; Arabic remains Unicode and RTL. Six additional languages are visibly queued for community review.

## Portable API

Run the local simulator:

```powershell
npm run api:dev
```

Implemented contracts:

```text
GET  /v1/packs
GET  /v1/resources
POST /v1/circles/join
GET  /v1/challenges
POST /v1/progress
GET  /v1/signals
POST /v1/ads/contextual
POST /v1/sync/events
POST /v1/power-credits
```

The portable PostgreSQL schema includes content packs, expiring resource records, hashed circle codes, bounded progress, signals, noncash Power Credits, separate earned/restricted ledgers, OIDC steward roles, idempotency keys, and an outbox/dead-letter path.

## Revenue boundary

```text
EARNED BUSINESS REVENUE   RESTRICTED FUNDS       IN-KIND POWER CREDITS
ads / partner setup       grants / donations     tokens / tools / access
          |                       |                       |
          +------ separate ledgers; never hardship targeting ------+
```

- The AdSense adapter is dormant unless `VITE_GOOGLE_ADSENSE_CLIENT` is configured.
- Unknown-age and youth/family contexts never load third-party ad code.
- Eligible surfaces are adult-confirmed books, agriculture, challenge discovery, and general tools only.
- Safety, aid, housing, health, signals, journey history, circles, and Power Credits are excluded.
- `AdContext` contains only surface, locale, territory, and age class.
- Payment cards are outside the system; production partner and donor collection must use hosted payment pages.

## External gates — not claimed live

These require separate partners, credentials, governance, and pilot approval:

- carrier SMS or USSD transport;
- live official signals or emergency response;
- a configured AdSense account and regional eligibility review;
- hosted sponsor/donor payments;
- production PostgreSQL/object storage/OIDC/MFA;
- signed and human-approved regional content packs;
- live steward organizations and safeguarding owners.

The interface uses no placeholder provider credentials and does not simulate a successful external delivery.

## Verification

- Direct logic/API tests: 25 checks across journey, content, privacy, challenges, recovery, downloads, ads, ledgers, rate/idempotency, and outbox behavior.
- Sites worker/package tests: 4 checks.
- Production build: successful, including Sites server output.
- Compressed text shell: 110.51 KB JS + 5.21 KB CSS + 0.44 KB HTML = 116.16 KB, below the 250 KB acceptance limit.
- Browser checks: desktop purple fidelity, 360 px Help Hub landing, keyboard-only books and USSD packet, safety quick exit, challenge response, journey board, RTL Arabic, and zero errors in a clean production tab.

## Run locally

```powershell
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Source backup before implementation:

```text
backups/2026-08-06-before-global-access/
```
# Guided ASCII Adventure redesign — 2026-08-07

- Terminal-first `BOOT -> LISTEN -> CONFIRM -> CHOOSE -> ACT -> RECEIPT` walkthrough.
- Deterministic local interpretation across care, learning, tools, projects, support, books, agriculture, aid, safety, challenges, and Power Credits.
- Five authored terminal language packs: English, Spanish, French, Kiswahili, and Arabic with RTL rendering.
- Explicit, push-to-talk browser speech adapter with editable transcript and no app audio storage.
- Locally generated optional sound; muted by default with no downloaded audio or game engine.
- Privacy-safe `faithai.walkthrough-state.v1`; raw and unconfirmed input never serializes, and safety is session-only.
- Classic purple interface code-split behind `[C]`, with `[T]` returning to the terminal.
- Reversible default flag: `VITE_FAITHAI_WALKTHROUGH_DEFAULT`.
- PWA cache bumped to `v4`.

# VPS-first production profile — 2026-08-09

- Added a PostgreSQL-backed store for idempotency, sync events, reviewed packs/resources, emergency referrals, provider status, noncash Power Credits, and separate revenue ledgers.
- Added a checksum-locked migration command, database-aware `/healthz`, structured request logs, graceful shutdown, and service-unavailable handling for runtime failures.
- Added Nginx, systemd, environment, daily backup, and backup-verification templates under `deploy/vps/`.
- Added the ExoClick async publisher-zone adapter with an HTTPS host allowlist, numeric zone validation, SFW attributes, one-script reuse, timeout collapse, and a server kill switch.
- Created and enabled ExoClick Recommendation Widget zone `5998322` (`FAITHAI GENERAL NATIVE TEXT`) on verified publisher site `1107982` (`https://aixyz.tech/`). The production client now carries the public zone tag and the VPS template enables the provider.
- Split adult mode from `[A] ALLOW CONTEXTUAL ADS`; both must be on before an eligible general page can contact a provider. These preferences never enter recovery exports.
- Ads remain excluded from safety, aid, housing, health, signals, journey, circles, Power Credits, and youth/family contexts.
- Final verification: 55 tests passed; production and Sites builds passed; main shell is 105.13 KB compressed and Classic is 27.80 KB compressed.
- Browser QA confirmed no provider request before consent, an explicit adult-first refusal, a separate consent receipt, and a real ExoClick native unit rendered on the approved Help Books surface. The provider-specific frame now expands to show the complete widget.
- Still not claimed deployed: no VPS host/FAITHAI hostname or PostgreSQL URL was connected in this workspace. The live zone is attached to the existing verified `aixyz.tech` property; the built site still needs to be copied to Faith's VPS and served from an approved hostname.
