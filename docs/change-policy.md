# Change Policy

## Freely modifiable (within the current phase scope)
- Source under `src/`, `tools/`, `public/assets/` (via the pipeline), tests.
- The current phase doc and future phase docs.

## Modify only with an explicit reason in the commit message
- `docs/architecture-rules.md`, `docs/code-style.md`, `docs/dod-global.md`: update the rule first, then the code.
- `docs/database-schema.md` and `supabase/migrations/*`: never edit an applied migration; add a new one. Update the doc in the same commit.
- Save schema (`src/save`): only with a version bump + migration + test.
- `package.json` dependencies: add only what the phase needs; note new dependencies in the phase doc.

## Never modify
- Completed phase docs (`docs/phases/phase-N.md` for finished N), except to fix factual errors.
- `LICENSE`.
- Applied Supabase migrations.
- `Description.md` product decisions (scope, tone, guardrails) without the user's approval.

## Reference material
`test-task.md` is a reference template from another project. It is not part of this game's docs.
