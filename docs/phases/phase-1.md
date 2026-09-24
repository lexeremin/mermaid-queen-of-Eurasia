# Phase 1 — Project scaffold

**Status:** ⬜ Next

## Goal
A runnable, empty-but-correct project: Vite + React + TypeScript (strict) + React Three Fiber, with lint, format, tests and the target folder layout. `npm install && npm run dev` shows a canvas with a placeholder scene on desktop and a mobile viewport.

## Scope
- Scaffold with Vite (React + TS template), then set `strict` and path alias `@/` → `src/`.
- Dependencies: `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`. Dev: `vitest`, `eslint` (+ TS, react-hooks, import plugins), `prettier`, `@types/three`.
- Do **not** add `@supabase/supabase-js` yet (Phase 6).
- Folder layout per `docs/tech-stack.md` (empty folders get a minimal file or `.gitkeep`).
- Placeholder scene: ground plane, one low-poly box/cone, fixed top-down camera, fog, hemisphere + directional light, FPS/stats overlay in dev only.
- Full-viewport canvas with `100dvh`, safe-area padding, `touch-action: none`, no page scroll/zoom bounce on iPhone (viewport meta: `viewport-fit=cover`, disable user scaling for the game canvas).
- Scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`, `test`.
- `.gitignore` (node_modules, dist, `.env*` except `.env.example`), `.env.example` with placeholder Supabase vars (commented, unused yet).
- One example Vitest test to prove the runner works.
- README: how to install, run, and where docs live.

## Steps
1. Scaffold + install dependencies.
2. Configure TS strict, alias, ESLint, Prettier.
3. Create folder layout and placeholder scene.
4. Add scripts, test, `.gitignore`, `.env.example`, README update.
5. Verify (see DoD) in browser at desktop and 375×812.
6. Commit `feat: phase 1 — project scaffold`, push, then update Task.md.

## DoD
- `npm install`, `npm run dev`, `npm run build`, `npm run typecheck`, `npm run lint`, `npm test` all succeed.
- Placeholder scene renders on desktop and mobile viewport with no console errors.
- No secrets; `.env` ignored.
- Task.md updated (Phase 1 ✅ with hash, Phase 2 Next).
