# Architecture and rights — beta release

```text
thefayth.net homepage                 binetusa.org homepage
  FAITHAI (private beta)               BiNet Help (private beta)
             |                                  |
             v                                  v
  purple general / legacy                teal /help/ build
             \                                  /
              React DOM + local command reducer
                  |                |
           local saves/export     optional API mount
                                  |          |
                            loopback Node  PostgreSQL
                                  |
                       independent provider switches
                       ALL EXTERNAL PROVIDERS OFF
```

The personal guide runs locally. Journey changes are explicit and local; safety exploration remains session-only. Cache scope is public shell/JS/CSS/fonts, not APIs, safety selections, payments, or AI. No remote model or carrier is needed to navigate.

The VPS API uses PostgreSQL for transactional idempotency and conservative AI budget reservations. Four unfinished anonymous mutation workflows are disabled in production. The optional AI pilot requires a current-text preview, consent, English/US scope, configured funds, and approved nonsensitive input. Filters are imperfect and do not guarantee anonymization. BiNet's API route separately denies remote interpretation.

The older FAITHAI entry uses the same source with its original API/base mount. The Field Kit retains its separate existing Sites identity; source recovery and security remediation are recorded independently. No private BiNet ecosystem engine was copied into this public application.

## Ownership

Faith Cheltenham owns the original software contributions released under MIT. Third-party software retains its package licenses. Brand names, portraits, editorial writing, research, and contributed books retain separate rights; MIT is not blanket permission to reuse those materials. See ASSET_RIGHTS.md.

Bundled help summaries identify their source and draft license, but no regional review or two-person approval is fabricated. Signed reviewed packs require actual reviewer receipts before publication. Founder portraits were not added to the image-light help experience.

Design choices follow the requested Faith Presence, Faith Visual Design, and Faith-Aware Development guidance: preserve purple/teal ASCII identity, use mixed-case task labels, large controls, reversible actions, low-bandwidth DOM rendering, and visible privacy/ownership boundaries. No game engine, paid media, scores, or public social graph was introduced.
