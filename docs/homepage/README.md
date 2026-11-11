# Own-brand homepage links - deployment receipt

Verified public HTML on 2026-11-11 UTC:

| Homepage | Exact label | Destination |
| --- | --- | --- |
| https://thefayth.net/ | FAITHAI (private beta) | https://ai.thefayth.net/ |
| https://binetusa.org/ | BiNet Help (private beta) | https://app.binetusa.org/help/ |

The user corrected the first proposal: the BiNet link belongs on BiNet USA,
not on THEFAYTH. Only the matching brand link was added to each homepage.
These are status labels, not a claim that a link itself provides authentication.
The app rollout and private-route controls are separate work owned by the release
coordinator. No plugin, DNS, theme selection or app-route setting changed here.

## THEFAYTH

WordPress uses parent `thefayth-supersite`, child `thefayth-signal`.
`get_front_page_template()` and the rendered body classes verified the child.
The final change is one hero link using the existing wrapping button styles.

- Live file: `/srv/thefayth-site/data/wordpress/wp-content/themes/thefayth-signal/front-page.php`
- Editable final copy: `thefayth-signal-front-page.php` in this folder.
- Before SHA-256: `41aa835cc945d9e76b7308162c7c473dab9145e042a7032efe4bfabaaed159a7`
- After SHA-256: `5e330a00dfebcf30f68a4110ef04666f2e9b56e42ea54325083924ef8f229eb2`
- Exact pre-change backup: `/srv/thefayth-site/backups/faithai-homepage-20261111T044350Z/child-front-page.concurrent-20261111T051605Z.php`
- PHP syntax checked before activation; the final diff adds exactly one anchor.
- A concurrent Tools / KEVIN section was detected, re-copied and preserved before activation.

An initial change to the inactive parent template never appeared on the homepage.
It was restored byte-for-byte to its backup; final parent SHA-256 remains
`08882e8b07fad181feac0af8aef10ba03ea8debfc0fe1a9972db273a1eee207a`.
The local `thefayth-front-page.php` is that unchanged parent reference, not the
active template. `deploy-homepage-links.sh` is intentionally disabled because it
described that superseded attempt. `activate-thefayth-child.sh` records the final
one-time, expected-hash guarded activation; do not rerun against changed content.

## BiNet USA

The existing public Coming Soon page was copied to an isolated release; its
image and all other copy stayed unchanged. The patch adds only one help link.

- Original release retained: `/srv/binetusa-access-gate/releases/20261110T045700Z-copy`
- Original index SHA-256: `32f91ddbbb4c46fbdfb9960ad30e8f143c76770b876c08fb4c34454372523a33`
- Active release: `/srv/binetusa-access-gate/releases/20261111T044350Z-help-link`
- Active index SHA-256: `9f95848e5afa8a66c8c588154b4ed771138e354cc9d5af20fc0058ffae555e5a`
- `current` symlink switched atomically after patch dry-run and one-line diff.
- Editable change: `binet-help-link.patch` in this folder.

No source image was selected, generated, re-licensed or exported locally.
Only the existing public gate file was copied on the VPS. Original source rights
remain unchanged. Public rendered-HTML readback confirmed both exact anchors;
the coordinator owns the separate browser screenshot pass and app readiness.

## Rollback boundary

For THEFAYTH, restore the exact child backup only if no later author changes
exist; otherwise remove this single link from the new source rather than
overwriting newer work. For BiNet, point `current` back to the retained original
release only after confirming no later gate deployment superseded this release.
