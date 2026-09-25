# Phase 15c — Entrances: GUM portals, gates and glow

**Status:** ✅ Complete

## Goal
Requested after Phase 15b: the GUM doors and the gates to other areas looked odd and had things in the way; make the doorways read as proper entrances and make it obvious where Rosa can go.

## Findings
- **Obstacles on the doorway axes.** A lamppost stood directly in front of the middle GUM portal (x = −10, z = 0), and another stood on the axis of the Resurrection Gate on Manezhnaya Square (x = 9, z = 42). Both were found by a new test (below), not by eye.
- **Plain openings.** The three GUM portals were bare rectangular gaps between the wings; the Resurrection Gate was a dark box under a block; the garden gate had short iron bars hanging from its lintel. The camera looks along the plaza, so the GUM doors are seen edge-on and were nearly invisible.
- **Garden path.** The path to the garden gate started painted on top of the plaza cobbles as a straight gray band with hard ends.

## Changes

### Layout
- Lampposts removed from the GUM portal axes (the west row is now at z = −24, −12, −6, 6, 12, 24) and from the Resurrection Gate axis (the Manezhnaya west row starts at z = 50).
- The garden approach path now leaves the plaza at its east edge and curves to the gate.

### Entrance architecture (`tools/blender/`)
- New helper `arch_opening()` in `lib.py`: a round arch with a solid tympanum up to the lintel, a ring of alternating stone blocks and a gold keystone on the outer face.
- **GUM portal:** round arch on both faces, keystone, and four warm lanterns per portal. The clear opening is unchanged.
- **Resurrection Gate:** round arch under the gate block on both faces, keystone, lanterns.
- **Garden gate:** an iron scroll arch under the lintel and a hanging gold lantern in place of the bars.
- `bld` triangle budget raised from 1 500 to 2 200 (the facade is 2 088 triangles, drawn as one instanced mesh for all copies).

### Glow (`EntranceGlow`)
- New `entrances` list in the map data (`id`, `label`, position, axis, width, glow color): the three GUM portals (warm gold), the Resurrection Gate (peach) and the garden gate (mint).
- Each entrance gets: a soft floor pool on each side (larger on the plaza side), three chevrons that flow inward along the way in, and a light column beside the doorway (outside GUM's edge-on facade so the camera can see it). Everything pulses gently and only draws within 70 m of Rosa. It costs three draw calls (instanced, additive).

### Guard against regressions
- `entrances.test.ts`: every entrance has a clear straight corridor (Rosa's width plus 0.7 m either side) 8 m out on the plaza side and 3.5 m into GUM, is at least 3 m wide, and can be walked to and through from the spawn. This is what found the two lampposts.

## Verification
- 301 tests (was 297), typecheck, lint, prettier, build and the asset check pass.
- Before and after screenshots of the three GUM portals, the Resurrection Gate and the garden gate; the arched portal checked head-on in Blender. Draw calls peak at 65 at spawn (budget 70), 47–54 elsewhere, on desktop and at 375×812. The only console message is three.js's own Clock notice.

## Notes
- Glow colors and the chevron speed are constants in `EntranceGlow.tsx`; add a new entrance by adding a row to `entrances` in the map.
- The shrine nook and the Trinity bridge were deliberately left without glow (the shrine is meant to be hidden).
