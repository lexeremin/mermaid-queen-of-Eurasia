# Code Style

## TypeScript
- `strict: true`. No `any` (use `unknown` + narrowing). No non-null `!` unless commented why it is safe.
- Prefer `type` for data shapes, `interface` only when extending. Use discriminated unions for events, entities and dialogue nodes.
- No enums; use string-literal unions or `as const` objects.
- Named exports only (no default exports except where a tool requires it).

## Naming
- Files: `kebab-case.ts`; React components: `PascalCase.tsx`.
- Types/components `PascalCase`, functions/variables `camelCase`, constants `SCREAMING_SNAKE_CASE`, content ids `kebab-case` strings (e.g. `npc-baba-yaga-clerk`).
- Stores: `useXxxStore`. Systems: `xxxSystem.ts` exporting pure functions.

## Formatting
Prettier defaults + ESLint (TypeScript, React hooks, import order). CI-free: run `npm run lint`, `npm run typecheck`, `npm test` before each phase commit.

## React / R3F
- Function components and hooks only.
- Never put per-frame values in React state; use refs or the mutable sim state.
- Memoize geometries/materials; dispose what you create. Reuse vectors in `useFrame`.

## Forbidden
- Direct Supabase calls outside `src/net`.
- `Math.random()` / `Date.now()` inside systems without injection.
- Raw DOM event handling in game code (use the input layer).
- Hover-only behaviour; tiny touch targets.
- Committing `.env`, keys, or unlicensed assets.
- Large unexplained comments; comment only non-obvious WHY.
