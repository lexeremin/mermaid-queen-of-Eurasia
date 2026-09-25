# Phase 23 — Downtown Moscow: the north of Red Square

**Status:** ✅ Complete

## Goal
More detailed areas around Red Square, taken from the real map, and more quests. The whole area north of Red Square (the real south-east end, behind Saint Basil's) was solid rock; it now opens into the real neighbourhood of Vasilievsky Spusk and Zaryadye, and the notice board gets six new quests that send Rosa there.

## The real map, and how it is squeezed in
In the game +z is south and Saint Basil's stands at the north end of Red Square. Behind it, in reality, the square drops down Vasilievsky Spusk to the Moskva embankment, with Zaryadye Park beside it. The map keeps that order, in two spurs on either side of the cathedral (the cathedral now really blocks: its footprint is solid):
- **East, Vasilievsky Spusk and the Embankment.** A paved slope runs from the Red Square end between the cathedral and the Kremlin corner down to a promenade along the river (railings on the water side, lanterns, benches, lindens), which runs east all the way to the garden path, so the garden and Red Square are now joined by a loop.
- **West, Zaryadye Park.** From the north-west corner of Red Square, past the GUM end, a park opens: a stepped **amphitheatre**, a small whitewashed **chapel** with a green dome, lawns, benches and lamps.
- **On Red Square itself:** the round stone platform **Lobnoye Mesto** in front of the cathedral, and a **monument to the heroes of 1612** (two bronze-green figures on a plinth; stylized, no likeness).

## Content
- **New models** (`tools/blender/build_zaryadye_assets.py`): `prop_monument` (260 tris), `prop_lobnoe` (208), `prop_rail` (132), `bld_amphitheatre` (840), `bld_chapel` (406). The big blocker behind the cathedral is replaced by a thin one along the back of it and by the Kremlin box now reaching the end of its wall; the far bank stays closed. (A viewing pier was built and dropped: the embankment strip is only 8 m deep, too shallow for it.)
- **Zones** (each announces itself): Vasilievsky Spusk, Moskvoretskaya Embankment, four Lanterns, Zaryadye Park, the Amphitheatre, the Chapel on Varvarka, the Monument, Lobnoye Mesto. They also label the full map.
- **Monsters:** ten more gloomy men patrol the embankment and the park; all are reachable on foot (tested).
- **Five hidden pearls** along the embankment and in the park (they go into the same saved list as the garden pearls).
- **Six quests:**
  - Down the Slope: walk the Spusk and the embankment.
  - Heroes of 1612: visit the monument and Lobnoye Mesto.
  - Zaryadye Stroll: the park, the amphitheatre and the chapel.
  - Light the Embankment: walk up to all four lanterns.
  - Clear the Embankment: send eight men home from the embankment and the park.
  - Pearls of the Embankment: bring the five hidden pearls.

## Result
- Rosa can now walk the Spusk, the embankment (railings on the water side, so nobody swims in from here; Serafima's far bank still needs the garden path) and Zaryadye Park; the promenade joins the garden path, making a loop.
- Seen from the park, the GUM gallery roof would hang in front of the picture, so its ribs and bridges (hidden inside the gallery already) and its glass are hidden while Rosa is in the park zones.
- Draw calls: 64 at the Red Square end, 61 in the park, 44–45 on the embankment.
- 529 tests (new: `north.test.ts` with reachability, solids, the closed river and every zone), lint, prettier, build, `assets:check`.

## Steps
1. Models, manifest and ledger.
2. Map: blockers, lanes, placements, zones, monsters, pearls; connectivity tests.
3. Quests and map labels.
4. Browser check of both spurs; docs.

## Definition of done
- Both spurs and the loop to the garden can be walked; every monster spawn, pearl and lantern zone is free ground Rosa can reach; the cathedral, monument, platform, amphitheatre and chapel stop her; the river bank stays closed except at the garden path.
- All six quests can be finished.
- Draw calls ≤ 70, typecheck, lint, prettier, tests, build, `assets:check`.
