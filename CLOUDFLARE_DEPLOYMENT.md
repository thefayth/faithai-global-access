# FAITHAI public deployment runbook

This repository contains a Cloudflare Worker and D1 migration, but it is not a claim that a public service or external provider is live. The local guide and Sites build remain the source of truth until a governed pilot is approved.

## Prepare locally

```powershell
npm run validate:public-config
npm run test
npm run build
```

The validator intentionally fails while `wrangler.jsonc` still contains the placeholder D1 id. Create the resources in a Cloudflare account, replace only that placeholder, and keep provider flags disabled for the first deployment.

## Staging sequence

```powershell
npx wrangler d1 create faithai-global
npx wrangler d1 migrations apply faithai-global --remote --env staging
npx wrangler r2 bucket create faithai-packs
npx wrangler queues create faithai-outbox
npx wrangler deploy --env staging
```

The commands above are an operator runbook, not an automatic deployment. They require an authenticated Cloudflare account and should be run only after reviewing the account, region, backup, and rollback choices.

## Server-only secrets

Use Wrangler secrets, never `VITE_*` variables or source files:

```powershell
npx wrangler secret put FAITHAI_AI_API_KEY --env staging
npx wrangler secret put FAITHAI_PAYMENT_WEBHOOK_SECRET --env staging
```

The AI endpoint/model, hosted payment links, and provider enable flags are separate. A missing secret, D1 binding, or provider flag returns a local fallback or an explicit disabled response; it does not stop core navigation.

## Pilot gates

Before changing a flag to `true`, record the territory, source/license receipts, safeguarding owner, reviewer approvals, budget owner, provider health check, and rollback switch. Emergency records are referral-only. SMS/USSD remains simulator-only. Ads are limited to adult-confirmed general surfaces and use contextual fields only.

## Rollback

1. Set the provider flag to `false` and redeploy.
2. Disable the provider's kill switch or secret if compromise is suspected.
3. Withdraw the affected signed pack or emergency record and restore the previous manifest.
4. Keep the static shell and local deterministic guide available.
5. Record the incident and cost/revenue ledger reconciliation before re-enabling.
