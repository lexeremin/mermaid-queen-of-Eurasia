# Phase 9b — Desktop controls rework

**Status:** ✅ Complete

## Goal
Replace mouse tracking with **click-to-move**, and make WASD movement turn the character naturally toward the direction it moves.

## Decisions (2026-09-24)
| Topic | Decision |
|---|---|
| Mouse | Left click on the ground walks Rosa to that point; no mouse aiming or hover tracking |
| Facing | Follows the movement direction (WASD, click-walk, joystick), turning smoothly (14 rad/s) instead of snapping |
| Attack | Space or right click, in the facing direction (was: left click) |
| Dash | Shift (was: Space or Shift) |
| Touch | Unchanged (joystick and buttons) |

## Delivered
- `src/systems/pathfinding.ts`: lazy, cached walkability grid (0.5 m cells, player radius) over the collision world; A* (8-neighbor, no corner cutting, octile heuristic, binary heap); a blocked start or target snaps to the nearest free cell (clicking a wall walks to its edge); conservative line-of-sight smoothing; `steerAlongPath`. `src/game/world/nav.ts` prewarms the grid in chunks after load.
- `src/systems/movement.ts`: `aim` removed; `turnToward` with `TURN_SPEED`.
- Input: left click on the canvas stores a normalized click point; `GameLoop` raycasts it to the ground and calls `walkTo`; manual movement (keys, joystick) cancels the walk; stuck detection cancels a walk that makes no progress for 0.5 s.
- `ClickMarker`: pulsing ring at the destination while walking.
- HUD pause text and `Description.md` updated. Dev hook `window.__mq.moveTo(x, z)`.
- Tests: pathfinding (open ground, routing around a wall, collision-free segments, snapping, unreachable target, steering) and movement turning; 69 tests in total.

## Verification (headless Chromium, real mouse events)
- Left click 170 px right of Rosa: she walks there, marker shown, walk ends on arrival.
- W / D / S: facing turns to (0, −1) / (1, 0) / (0, 1).
- A key press cancels a walk (path 2 waypoints to 0).
- Click into the GUM facade wing: she walks to its free edge (x −13.4) and stops.
- Long route spawn to the far end of the garden (around obstacles): 23 s, arrives within 0.2 m.

## Notes
- Hold-to-walk (continuous following of the cursor) is not implemented; click again to change the destination.
- Touch tap-to-move and tap-to-interact are planned with NPC interaction (Phase 10).
