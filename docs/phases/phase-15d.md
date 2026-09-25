# Phase 15d — Gate fixes, one glow, hitbox rings, ground flicker, longer Trident

**Status:** ✅ Complete

## Requests and what was done

### The "hanging texture" in both gates
- **Cause:** the `_seams()` helper (thin horizontal brick-course plates) always drew at the model's origin. Anything built off-center got its plates floating in the middle of the model: in the Resurrection Gate the tower seams hung across the doorway as stacked dark slabs, and in the garden gate the post seams did the same (my Phase 15c additions were not the cause, but I had left the garden gate's hanging iron arch and lantern in as well).
- **Fix:** `_seams(..., at=(x, y))` and every off-center caller now passes its position: the Resurrection Gate towers, the garden gate posts, the museum's side towers and the Kazan cathedral (which had the same bug). The garden gate no longer has anything hanging; it has lanterns on its posts instead.
- The Resurrection Gate arch also had a degenerate top (the arc touched the lintel line, which breaks the polygon triangulation); its spring moved down by 10 cm and `arch_opening()` now asserts the arc stays below the lintel.
- All 35 environment models were rebuilt and optimized.

### One glow, no arrows
- The two side pools per entrance are now one soft pool spanning both sides of the doorway (longer on the plaza side of GUM, whose other side is the smaller gallery). The moving chevrons and the light column were removed. The glow is a single instanced mesh (one draw call for all entrances).

### Hitbox rings
- **Green** rings under friendly people (every NPC who is not following, and Rosa's companion), **red** rings under living enemies (radius = enemy radius + 0.5 m). One instanced mesh per color (`ActorRings`), a crisp ring with a faint fill, drawn within 40 m of Rosa. Dead enemies lose theirs; a following NPC's ring moves with him.

### Ground flicker when moving forward and back
- **Cause:** the plaza and lawn tiles were magnified with nearest sampling. At a non-integer scale the 1-texel grout lines alternate between 1 and 2 screen pixels thick as the view scrolls; the horizontal courses swim when moving forward and back, while the shorter staggered vertical joints are much less obvious sideways.
- **Fix:** trilinear magnification (`LinearFilter`) plus the existing mipmaps and 8× anisotropy. Grout keeps a steady thickness; the trade-off is a slightly softer look up close.

### Longer Trident
- Reach 2.3 m → **3.4 m** and half-angle 55° → **60°**; aim assist 3.6 m → 4.8 m in front and 2.6 m → 3.6 m all-round. The swing arc effect scales with the range.

## Verification
- 302 tests (was 301): the Trident reaches an enemy about 3 m in front and not one 1.2 m past its range; the aim-assist test moved its "distant enemy behind her" to 4.4 m. Typecheck, lint, prettier, build, asset check pass.
- Close and wide screenshots of both gates before and after (the slabs are gone and the arches are clean), the united glow, and the rings next to Prince Sasha and an enemy. Draw calls peak at 61 at spawn (budget 70), 44–51 elsewhere, desktop and 375×812.
- The flicker fix was verified by reasoning about the sampling and by screenshots, not by watching motion in a real GPU browser; please tell me if any shimmer remains.

## Notes
- If you'd like the crisp pixel look back close-up, the alternative is a small shader that snaps to texel centers; it needs custom material work, so it was not done here.
