# AI Rules

## How to work
1. Start with `git log --oneline -20` and read `docs/Task.md`.
2. Read only the docs relevant to the current phase.
3. Stay inside the phase scope. Do not start the next phase's work, and do not refactor unrelated code.
4. Prefer the simplest thing that satisfies the phase DoD. No speculative abstractions.
5. For UI/gameplay changes, run the dev server and try the feature in a browser (desktop and a mobile viewport) before calling it done. If it cannot be tested, say so.
6. Follow `docs/architecture-rules.md` and `docs/code-style.md`. If a rule blocks the work, propose a change to the rule instead of silently breaking it.
7. Assets: use the pipeline in `docs/asset-pipeline.md`; update the manifest and licence ledger with every asset.

## Phase completion
- Run typecheck, lint, tests (`docs/dod-global.md`).
- Commit `feat: phase N — <title>`, push to `origin main`.
- Update `docs/Task.md` (status + hash), commit `chore: advance to phase N+1`, push.

## What to report at the end of a phase
Short: what changed, how it was verified, anything skipped or risky, and what the next phase is. No long summaries.

## Safety
- Never commit secrets. Never push force. Never skip hooks.
- Content guardrails: no real people, no copied third-party game assets or music.
