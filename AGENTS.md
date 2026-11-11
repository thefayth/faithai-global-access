# Prototype Instructions

- Homepage links follow their own brands: FAITHAI (private beta) on thefayth.net; BiNet Help (private beta) on binetusa.org. Do not place the BiNet tool link on THEFAYTH's homepage.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Durable FAITHAI Option 3 decisions

- The visual source of truth is the selected purple “What do you have or need today?” screen.
- The first interaction is a numbered 0–5 menu that works by click, keyboard, and alphanumeric phone reply.
- The optional galaxy is a capable-web visualization only. Text mode remains complete, readable, and usable without the image.
- The invitation defines scope: there is no member directory, hidden-node discovery, automatic introduction, or automatic sending.
- FAITHAI suggests one useful next step. Humans authorize sensitive disclosure, introductions, publication, and money movement.
- Explicit `S` saves a local-only draft; `I` explains the path; `0` returns. Reconnection or exploration never counts as consent.
- The network is global and remains rooted in The Cheltenham Institute’s Black-led equity model without limiting access by identity.
- Power Credits are non-speculative access support for donated AI tokens, tools, software, devices, or related resources after human review.
- Alphanumeric users can press `A` for opt-in AI access signals. Signals are ranked from explicitly saved prior input, state why they are important, and support `1` for details, `S` to save, `X` to mute, and `0` to return.
- Signal analysis may recommend priority; users control delivery and action. No signal may silently activate an introduction, transaction, disclosure, or public post.
- Each 0–5 path now asks one numbered follow-up and produces a specific next step. The interaction must remain complete without free-text entry.
- `H` opens a bounded local activity ledger; resuming a receipt does not transmit it. Clearing removes only this prototype's named storage keys and requires confirmation.
- `E` creates a plain-text step or signal packet. Copy and download happen only after an explicit command; the prototype never claims to have sent the packet.
- The signal inbox is a deterministic synthetic preview ranked from saved local receipts. It must stay visibly distinct from a live carrier, SMS, USSD, resource, or emergency service.
- The core loop is a forgiving four-stage journey: choose a path, choose a focus, save one action, and self-report it done. Completion belongs to the user; never add points, streak pressure, leaderboards, status ranks, or identity scoring.
- `L` opens five bundled offline language packs: English, Spanish, French, Kiswahili, and Arabic. The 0–5 path commands and numbered focus commands stay identical in every language.
- Arabic uses a right-to-left interface while numeric commands and receipts remain isolated left-to-right. Latin-script languages offer an optional `T` ASCII phone mode that removes diacritics and typographic punctuation; Arabic is preserved rather than corrupted.
- `D` marks a saved step done on this device. It records only a local completion timestamp and must never imply verification, surveillance, transmission, or institutional approval.
- Progress is a small user-owned summary of saved and completed steps. It is guidance and memory support, not a reputation system.
- Third-party advertising stays off for unknown-age and family users. An adult must separately select `[Y] ADULT MODE` and `[A] ALLOW CONTEXTUAL ADS` before any provider script can load.
- ExoClick is an optional, server-kill-switch-controlled SFW publisher-zone adapter on approved general pages only. It never belongs on safety, aid, health, signals, journey, invitation-circle, Power Credit, or youth surfaces, and a failed ad must collapse without blocking help.
- The terminal has two session-only doors: purple general FAITHAI ("Would you like to save the world?") and teal BiNet USA ("Bisexual, are you ready to save your world?"). The BiNet USA lane contains authored English bispecific prompts pending governed pilot review; selecting it must never persist or expose orientation data. Only a card the person explicitly saves may be stored locally.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
