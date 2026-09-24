# Architecture Rules

These cannot be violated without updating this file first.

1. **Offline-first.** The game must run with no network and no Supabase keys. Network code failing must never throw into gameplay.
2. **Network only through `src/net`.** No component, system or store calls Supabase directly.
3. **Systems are pure.** Logic in `src/systems` takes state + input + dt and returns new state / events. No React, no Three, no DOM, no `Date.now()` or `Math.random()` without an injected source (so they are testable).
4. **Data-driven content.** NPCs, quests, items, enemies, forms and maps are typed data in `src/data`. Adding content must not require touching systems.
5. **Game loop runs in R3F `useFrame`.** No second `requestAnimationFrame` loop. Fixed-timestep for simulation, variable for rendering.
6. **React DOM never touches Three objects.** UI reads from Zustand stores. Scene components read the store and write intents/events back. Per-frame data (positions, velocities) lives in refs / a mutable sim state, not in React state, to avoid re-renders at 60 fps.
7. **Single input layer.** Keyboard, mouse and touch all produce one `InputState` (move vector, aim vector, action flags). Game code never reads raw DOM events.
8. **Save schema is versioned.** Every save has `version`; migrations live in `src/save` with tests. Never change the shape without a migration.
9. **Stats are fire-and-forget.** Events go into a persisted queue, are batched, and sent when online. Opt-out disables collection entirely.
10. **No hover-only UI. Touch targets ≥ 44 pt.** Every feature must be reachable by touch.
11. **Asset budgets are enforced.** Only assets that passed the pipeline (`docs/asset-pipeline.md`) and are listed in the manifest and licence ledger may be loaded.
12. **No secrets in the client bundle** other than the Supabase URL and anon key. RLS protects the data, not obscurity.
