# Tech Stack

Versions are set in Phase 1 (use current stable at that time, then pin in `package.json`).

## Core
| Concern | Choice |
|---|---|
| Build / dev server | Vite |
| Language | TypeScript, `strict: true` |
| UI | React 19 (DOM HUD, menus, dialogue, inventory) |
| 3D | three + `@react-three/fiber` + `@react-three/drei` |
| State | Zustand (game store, UI store, settings store) |
| Online DB | Supabase (`@supabase/supabase-js`), anonymous auth |
| Local persistence | `localStorage` (versioned save schema) |
| Tests | Vitest (systems, save migrations, sync queue); Playwright smoke test added later |
| Lint / format | ESLint + Prettier |
| Assets | GLB (meshopt/Draco), loaded via drei `useGLTF`; manifest in `src/data/assets.ts` |
| Hosting | Cloudflare Pages or Vercel (decided in Phase 15) |

Deliberately not used (keep it simple): physics engine (custom circle/AABB collision), ECS library, game framework on top of R3F. Revisit only with a concrete need.

## Folder layout (target)
```
src/
  main.tsx, App.tsx
  game/           # R3F scene: <World>, camera, entities as components
    world/        # village, forest, dungeon scene components
    entities/     # Rosa, NPCs, enemies, boss, pickups
  systems/        # pure logic: combat, movement, ai, quests, progression, dialogue
  data/           # content as typed data: npcs, quests, items, enemies, forms, maps, assets
  store/          # Zustand stores + selectors
  ui/             # React DOM: HUD, menus, dialogue box, inventory, touch controls
  input/          # keyboard/mouse/touch -> unified input state
  net/            # Supabase client, auth, stats queue, cloud save (only place that talks to network)
  save/           # localStorage save/load + schema migrations
  utils/
public/assets/    # GLB, textures, audio (built by asset pipeline)
tools/            # asset scripts (Blender python, texture quantizer, GLB optimizer)
supabase/         # migrations, config
docs/
```
