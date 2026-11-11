# FAITHAI Global Access

By Faith Cheltenham. A free, accessible, low-bandwidth ASCII guide for learning,
building, practical next steps, and community access.

## Product entries

- General FAITHAI: https://ai.thefayth.net/
- BiNet USA guided help: https://app.binetusa.org/help/ (public launch authorized 2026-11-10).
- Legacy FAITHAI: https://faithai.aixyz.tech/faithai/
- Related Field Kit: https://thefaythai.indigo-iris-5804.chatgpt.site/

The entries share product code, with purple general and teal BiNet experiences.
Public help does not grant access to BiNet's separate private preview systems.

## Run and verify

Node.js 22 or later, npm, and an optional PostgreSQL service are required.

```
npm ci
npm run build:host-root
npm test
npm run build:binet-help
npm run dev
```

Build output is `dist/client`. Build each hostname/mount separately and retain its
artifact before building the next. The original `/faithai/` mount uses
`VITE_BASE_PATH=/faithai/` and `VITE_API_BASE=/faithai-api`.

Core guidance works locally without accounts, microphones, third-party AI,
advertising, or payments. Use numbers, short commands, touch, or typing. Speech
requires separate consent and browser support.

## Service truth

The source includes local guidance and provider interfaces. A provider is live
only after its account, credentials, territory, configuration, and end-to-end
operation have been verified. Current launch blockers and receipts belong in
`LAUNCH_LOG.md` and `docs/REQUIREMENTS.md`; build success alone is not live proof.

SMS/USSD is a simulator. Emergency support is referral guidance. Financial,
medical, legal, abuse, and safety decisions are not delegated to remote AI.
Power Credits are noncash donated resources reviewed by people.

Alibaba Cloud Model Studio is the selected optional provider, disabled until
regular API access is verified. Token/Coding Plan credits cannot back this public
API. The earlier OpenAI pilot also remains off. Stripe access is
sandbox-only and ExoClick hostname approval is not verified. Neither payments nor
third-party ads are active. Bundled help packs remain prototypes pending human
review and signing; they are not a verified local-service directory.

## Ownership and privacy

Faith's software contributions are MIT licensed. See `ASSET_RIGHTS.md` for the
separate treatment of photographs, marks, editorial works, research, and licensed
content. Never publish credentials, private user histories, databases, or private
BiNet source merely because this repository is public.

Deployment instructions and historical receipts are under `deploy/`. Active
releases must include a source commit, checksum, deployment date, and rollback
reference. Historical notes can describe an earlier state; use the newest receipt
and the actual running service when operating the product.
