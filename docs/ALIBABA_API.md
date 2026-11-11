# Alibaba API integration — disabled until regular API access is verified

FAITHAI supports regular Alibaba Cloud Model Studio through its OpenAI-compatible
Chat Completions protocol. This is a server-side adapter, not an enabled service.
No provider key belongs in browser code, public source, or chat.

## Important plan boundary

Alibaba's [Generic Integration Guide](https://www.alibabacloud.com/help/en/model-studio/more-tools)
excludes custom application backends from Token Plan Personal, Token Plan Team,
and Coding Plan usage. Their dedicated keys must not be substituted for regular
Model Studio API credentials. FAITHAI rejects `sk-sp-` keys and token-plan/coding
endpoints for this public API.

Use a separately authorized regular Model Studio API workspace, with its actual
region, supported model, and reviewed cost ceiling. A subscription receipt does
not prove a usable public-application API quota or permission.

## Configuration and activation gates

Start with `deploy/vps/alibaba.env.example`. It deliberately leaves endpoint,
model, key, and per-call cost blank and AI disabled. The region and endpoint must
match the credential; see [regional access information](https://www.alibabacloud.com/help/en/model-studio/regions).
The adapter accepts only documented HTTPS Alibaba domains and the exact chat
completion path. It does not infer a region or fall back to an OpenAI key.

Before enabling: verify regular-API eligibility/free quota or an approved budget,
provider data handling, model price, structured responses, dialect quality,
latency, consent, and the outage fallback. Do not enable pay-as-you-go overage,
buy a plan, increase a cap, or change billing without Faith's separate approval.

Requests are one approved nonsensitive English utterance in the US pilot, at most
2,000 characters and 512 output tokens, with thinking disabled. An explicit
recipient label appears in consent. The local guide remains complete when AI is
off or fails. BiNet help never sends identity-related requests to this pilot.

The existing conservative $1/day and $25/month reservations and three calls per
anonymous session/day remain limits, not permission to start spending. Model-
specific maximum request cost must be reviewed before activation. Mock adapter
tests are not proof of a live connection.
