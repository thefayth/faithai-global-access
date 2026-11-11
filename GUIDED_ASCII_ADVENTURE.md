# FAITHAI Guided ASCII Adventure

## Shipped experience

The default surface is a React/DOM text adventure, not a canvas game:

```text
_
FAITHAI ONLINE.

WOULD YOU LIKE TO SAVE THE WORLD?

[S] SAVE THE WORLD
[I] INSTRUCTIONS
[V] SPEAK
[C] CLASSIC VIEW

> _
```

The simulation follows stable scenes:

```text
BOOT -> LISTEN -> CONFIRM -> CHOOSE -> ACT -> RECEIPT
```

Natural text is interpreted locally. Every scene also has number or single-letter parity. A completed route creates a care card, 20-minute learning task, tool-gap card, seven-day project proof, help-book step, agricultural observation, aid route, session-only safety plan, cooperative challenge action, or Power Credit request within five exchanges.

## Runtime boundaries

- `src/walkthrough-engine.js` is the pure simulation and artifact builder.
- `src/guide-provider.js` is the deterministic local router. Remote interpretation is optional, unconfigured, consent-gated, and never receives safety input.
- `src/speech-port.js` constructs browser speech recognition only after explicit consent and a start action. Audio is not stored; the transcript is editable before submission.
- `src/local-sound.js` generates short Web Audio bleeps locally. Sound starts off and never autoplays.
- `src/walkthrough-channel.js` projects the same stable scene IDs and numbered choices into a simulation-only SMS/USSD transcript. It sends nothing to a carrier.
- `src/TerminalWalkthrough.jsx` renders accessible DOM, separate visual typing and screen-reader announcements, fixed mobile input, language selection, speech disclosure, local save/export, and quick exit.
- `src/ClassicApp.jsx` preserves the previous purple interface. `[C]` opens it and `[T]` returns to the terminal.

## Privacy and storage

The versioned key is `faithai.walkthrough-state.v1`. Only confirmed intent categories, checkpoints, and explicitly saved artifacts are eligible for local storage. Raw typing, raw speech, unconfirmed interpretations, and safety exploration are never serialized. Saving a non-safety artifact also creates a compatible local Journey receipt. Nothing is synced by this prototype.

## Tool destinations

```text
[M] HELP HUB       [H] JOURNEY BOARD
[A] SIGNALS        [L] LANGUAGE
[Q] QUICK EXIT     [C] CLASSIC
[B] LOCAL SOUND    [V] PUSH TO TALK
```

Help, Journey, and Signals open the corresponding focused destination inside the preserved classic application. Language stays in the terminal. The quick exit opens neutral weather notes and requests no location.

## Rollout and rollback

`VITE_FAITHAI_WALKTHROUGH_DEFAULT=true` makes the terminal the default. Setting it to `false` restores Classic as the first surface without deleting either experience or their saved history. The PWA cache version is `v4`.

## Verification commands

```powershell
npm test
npm run build
```

The build must keep the initial terminal shell under 250 KB compressed and preserve the lazy Classic chunk and Sites packaging.
