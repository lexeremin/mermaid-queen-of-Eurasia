# Asset Ledger

One row per shipped asset. No asset ships without a row (`npm run assets:check` enforces it).

Columns: file, source, licence, commercial use OK, notes.

| File | Source | Licence | Commercial OK | Notes |
|---|---|---|---|---|
| `char_rosa.glb` | Procedural, `tools/blender/build_hero.py` (`build_rosa_human`), 2026-09-24 | Original work, project licence | yes | Hero, human form: stylized low-poly character inspired by the look of a consenting real person (styling only, no face scan or photo texture). See `docs/likeness-and-consent.md`. `idle`/`walk` clips. |
| `char_rosa_mermaid.glb` | Procedural, `tools/blender/build_hero.py` (`build_rosa_mermaid`), 2026-09-24 | Original work, project licence | yes | Hero, mermaid transformation: same head, hair and roses with a tail chain. `idle`/`walk` clips. |
| `tree_spruce.glb` | Procedural, `tools/blender/build_poc_assets.py` (`build_tree`), 2026-09-24 | Original work, project licence | yes | Snow-dusted spruce. |
| `bld_shop.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_shop`), 2026-09-24 | Original work, project licence | yes | Market stall, rose/paper striped awning. |
| `bld_shop_herbs.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_shop_herbs`), 2026-09-24 | Original work, project licence | yes | Herbalist stall, teal/paper awning. |
| `bld_hut.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_hut`), 2026-09-24 | Original work, project licence | yes | Rosa's small house, teal roof, pearl ridge. |
| `prop_questboard.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_questboard`), 2026-09-24 | Original work, project licence | yes | Notice board (prop only until Phase 9). |
| `prop_barrel.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_barrel`), 2026-09-24 | Original work, project licence | yes | Barrel. |
| `prop_crate.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_crate`), 2026-09-24 | Original work, project licence | yes | Crate. |
| `tree_birch.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_birch`), 2026-09-24 | Original work, project licence | yes | Frosty birch. |
| `lmk_basil.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_basil`), 2026-09-24 | Original work, project licence | yes | St. Basil's-style cathedral: stylized, surreal, no real-building plans used. |
| `bld_kremlin_wall.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_kremlin_wall`), 2026-09-24 | Original work, project licence | yes | Crenellated wall segment (6 m). |
| `bld_kremlin_wall_b.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`_wall_piece`), 2026-09-25 | Original work, project licence | yes | Kremlin wall kit piece (variant with a tall arrow slit and a stone plaque); same cross-section as the others so pieces butt together without a seam. |
| `bld_kremlin_wall_c.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`_wall_piece`), 2026-09-25 | Original work, project licence | yes | Kremlin wall kit piece (variant with two buttresses); same cross-section as the others so pieces butt together without a seam. |
| `bld_kremlin_wall_short.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`_wall_piece`), 2026-09-25 | Original work, project licence | yes | Kremlin wall kit piece (3 m plain piece); same cross-section as the others so pieces butt together without a seam. |
| `bld_kremlin_tower.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_kremlin_tower`), 2026-09-24 | Original work, project licence | yes | Clock tower with a fantasy ruby-crystal spire (no state star). |
| `bld_museum.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_museum`), 2026-09-24 | Original work, project licence | yes | Red-brick museum with two tent-roofed towers. |
| `bld_arch_bridge.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_arch_bridge`), 2026-09-24 | Original work, project licence | yes | Stone bridge, deck flush with the ground. |
| `bld_garden_gate.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_garden_gate`), 2026-09-24 | Original work, project licence | yes | Alexander Garden gate: brick posts with spires. |
| `prop_lamppost.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_lamppost`), 2026-09-24 | Original work, project licence | yes | Ornate double lamp (flat candle color, no real light). |
| `prop_fir_tub.glb` | Procedural, `tools/blender/build_redsquare_assets.py` (`build_fir_tub`), 2026-09-24 | Original work, project licence | yes | Fir tree in a tub with string lights. |
| `tree_linden.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_linden`), 2026-09-24 | Original work, project licence | yes | Summer linden, round crown. |
| `prop_flowerbed.glb` | Procedural, `tools/blender/build_village_assets.py` (`build_flowerbed`), 2026-09-24 | Original work, project licence | yes | Flower bed with stone border. |
| `bld_gum_facade.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_gum_facade`), 2026-09-24 | Original work, project licence | yes | GUM facade module (18 m): 3 floors, arched portal, pediment clock, turrets. |
| `bld_gum_turret.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_gum_turret`), 2026-09-24 | Original work, project licence | yes | GUM end turret with tented roof. |
| `bld_gum_wall.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_gum_wall`), 2026-09-24 | Original work, project licence | yes | Gallery storefront wall (18 m). |
| `bld_gum_ribs.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_gum_ribs`), 2026-09-24 | Original work, project licence | yes | Iron roof ribs for the gallery (6 m module). |
| `bld_gum_bridge.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_gum_bridge`), 2026-09-24 | Original work, project licence | yes | Decorative iron bridge above the gallery. |
| `prop_fountain.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_fountain`), 2026-09-24 | Original work, project licence | yes | GUM fountain. |
| `prop_kiosk.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_kiosk`), 2026-09-24 | Original work, project licence | yes | Gallery kiosk. |
| `prop_bench.glb` | Procedural, `tools/blender/build_gum_assets.py` (`build_bench`), 2026-09-24 | Original work, project licence | yes | Bench. |
| `bld_kazan.glb` | Procedural, `tools/blender/build_moscow_assets.py` (`build_kazan`), 2026-09-24 | Original work, project licence | yes | Kazan-style cathedral: stylized, no real plans used. |
| `bld_resurrection_gate.glb` | Procedural, `tools/blender/build_moscow_assets.py` (`build_resurrection_gate`), 2026-09-24 | Original work, project licence | yes | Resurrection Gate: two tented brick towers and a passage. |
| `lmk_kremlin_inside.glb` | Procedural, `tools/blender/build_moscow_assets.py` (`build_kremlin_inside`), 2026-09-24 | Original work, project licence | yes | Kremlin interior skyline: gold-domed cathedrals, bell tower, palace. Backdrop only. |
| `bld_kutafya.glb` | Procedural, `tools/blender/build_garden_assets.py` (`build_kutafya`), 2026-09-24 | Original work, project licence | yes | Kutafya-style round gate tower: stylized, no real plans used. |
| `bld_manege.glb` | Procedural, `tools/blender/build_garden_assets.py` (`build_manege`), 2026-09-24 | Original work, project licence | yes | Manege-style exhibition hall with portico. |
| `bld_grotto.glb` | Procedural, `tools/blender/build_garden_assets.py` (`build_grotto`), 2026-09-24 | Original work, project licence | yes | Garden "Ruins" grotto arcade. |
| `prop_obelisk.glb` | Procedural, `tools/blender/build_garden_assets.py` (`build_obelisk`), 2026-09-24 | Original work, project licence | yes | Garden obelisk. |
| `bld_shrine.glb` | Procedural, `tools/blender/build_garden_assets.py` (`build_shrine`), 2026-09-25 | Original work, project licence | yes | The hidden Pearl Shrine in Alexander Garden: stone circle, rose arch, scallop-shell altar with a pearl. |
| `prop_hedge.glb` | Procedural, `tools/blender/build_garden_assets.py` (`build_hedge`), 2026-09-24 | Original work, project licence | yes | 2 m hedge segment. |
| `npc_grisha.glb` | Procedural, `tools/blender/build_npcs.py` (`build_grisha`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Gate guard with ushanka and rifle-less staff. |
| `npc_tolik.glb` | Procedural, `tools/blender/build_npcs.py` (`build_tolik`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Accordionist. |
| `npc_lyoha.glb` | Procedural, `tools/blender/build_npcs.py` (`build_lyoha`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Chess hustler with board. |
| `npc_mikhalych.glb` | Procedural, `tools/blender/build_npcs.py` (`build_mikhalych`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Prince Sasha (id `mikhalych`): a prince selling kefir (blue tailcoat, red sash, cape, kefir crate). Face and hair restyled 2026-09-25 as a stylized low-poly likeness of the project owner (swept brown hair, light eyes, light stubble), at their request and with their consent. |
| `npc_prince_knight.glb` | Procedural, `tools/blender/build_npcs.py` (`build_prince_knight`), 2026-09-25 | Original work, project licence | yes | Prince Sasha as Rosa's companion: rigid parts with `idle`/`walk` clips and a sword arm, no vendor props. Face and hair are a stylized low-poly likeness of the project owner, made at their request and with their consent (no scan, no photo texture). |
| `npc_boris.glb` | Procedural, `tools/blender/build_npcs.py` (`build_boris`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Clerk with stack of forms. |
| `npc_sergei.glb` | Procedural, `tools/blender/build_npcs.py` (`build_sergei`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Tour guide with umbrella. |
| `npc_arkady.glb` | Procedural, `tools/blender/build_npcs.py` (`build_arkady`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Watch seller with tray. |
| `npc_kolya.glb` | Procedural, `tools/blender/build_npcs.py` (`build_kolya`), 2026-09-24 | Original work, project licence | yes | Fictional archetype, no real person depicted. Pigeon feeder with pigeons. |
| `enemy_speaker.glb` | Procedural, `tools/blender/build_enemies.py` (`build_speaker`), 2026-09-24 | Original work, project licence | yes | Original satirical archetype defined by costume and weapon; deliberately resembles no real person. Gavel Speaker: robed caricature with a powdered wig and an enormous gavel. |
| `enemy_tycoon.glb` | Procedural, `tools/blender/build_enemies.py` (`build_tycoon`), 2026-09-24 | Original work, project licence | yes | Original satirical archetype defined by costume and weapon; deliberately resembles no real person. Golden-Pen Tycoon: top-hatted caricature with a giant golden fountain pen. |
| `enemy_demagogue.glb` | Procedural, `tools/blender/build_enemies.py` (`build_demagogue`), 2026-09-24 | Original work, project licence | yes | Original satirical archetype defined by costume and weapon; deliberately resembles no real person. Megaphone Demagogue: caricature on a soapbox with a huge megaphone. |
| `avatar_prince.png` | Rendered from `npc_prince_knight.glb` in Blender (Workbench, flat, head and shoulders), 2026-09-25 | Original work, project licence | yes | HUD portrait of Prince Sasha for the follower button and the dialogue box. |
| `palette_atlas.png` | Generated by `tools/blender/lib.py` (`get_atlas`) from `tools/palette.json`, 2026-09-24 | Original work, project licence | yes | 128×128 flat palette atlas, shared by all assets. |
| `grass_tile.png` | Generated by `tools/make-tiles.py` from `tools/palette.json`, 2026-09-24 | Original work, project licence | yes | 128×128 tiling grass (smooth noise in three greens, anti-aliased blades, a few flowers), palette colors, used on lawns and the outer ground. |
| `cobble_atlas.png` | Generated by `tools/make-tiles.py` from `tools/palette.json`, 2026-09-25 | Original work, project licence | yes | 256×256 atlas of four 128×128 paving variants (rounded stones with a soft dome shade, moss in the grout, a joint on every tile edge). The ground autotiler picks one per 4 m block. Replaces `cobble_tile.png`. |
| `bld_ug_wall.glb` | Procedural, `tools/blender/build_underground_assets.py` (`_ug_wall_piece`), 2026-09-25 | Original work, project licence | yes | Underground wall kit piece A (6 m, arched niches); same cross-section as B, C and the short piece so they butt. |
| `bld_ug_wall_b.glb` | Procedural, `tools/blender/build_underground_assets.py` (`_ug_wall_piece`), 2026-09-25 | Original work, project licence | yes | Underground wall kit piece B (6 m, dark panels with lamps). |
| `bld_ug_wall_c.glb` | Procedural, `tools/blender/build_underground_assets.py` (`_ug_wall_piece`), 2026-09-25 | Original work, project licence | yes | Underground wall kit piece C (6 m, buttresses and a rose band). |
| `bld_ug_wall_short.glb` | Procedural, `tools/blender/build_underground_assets.py` (`_ug_wall_piece`), 2026-09-25 | Original work, project licence | yes | Underground wall kit piece (3 m plain piece). |
| `prop_ug_column.glb` | Procedural, `tools/blender/build_underground_assets.py` (`build_ug_column`), 2026-09-25 | Original work, project licence | yes | Palace-hall column with gold rings. |
| `bld_ug_gate.glb` | Procedural, `tools/blender/build_underground_assets.py` (`build_ug_gate`), 2026-09-25 | Original work, project licence | yes | Boss gate for a 4 m corridor: heavy doors with a ruby seal. |
| `bld_ug_stairs.glb` | Procedural, `tools/blender/build_underground_assets.py` (`build_ug_stairs`), 2026-09-25 | Original work, project licence | yes | The way up, in the first underground hall. |
| `prop_paper_stack.glb` | Procedural, `tools/blender/build_underground_assets.py` (`build_paper_stack`), 2026-09-25 | Original work, project licence | yes | Leaning stack of forms and ledgers. |
| `bld_metro_entrance.glb` | Procedural, `tools/blender/build_underground_assets.py` (`build_metro_entrance`), 2026-09-25 | Original work, project licence | yes | Surface pavilion over the stairs down: teal roof, dark arch, lanterns. |
| `boss_registrar.glb` | Procedural, `tools/blender/build_underground_assets.py` (`build_boss_registrar`), 2026-09-25 | Original work, project licence | yes | Father of Corruption: original satirical golem of ledgers with a monocle, a crown of rubber stamps and a giant stamp for a fist; deliberately resembles no real person. Rigid-part rig, clip `idle`. |


## Third-party / generated sources
None yet. AI generators (Hunyuan3D, Hyper3D Rodin) are not enabled in the Blender addon. When one is used, record the service, prompt, date and the terms that allow commercial use.

## Retired (removed in Phase 6 with the winter village)
`bld_gum` (Phase 6 arcade segment, replaced by the detailed facade in Phase 8), `bld_izba`, `bld_bridge` (plank bridge), `bld_gate` (village gate), `prop_well`, `prop_fence`, `prop_logs`, `prop_lantern`. Their builders were deleted; the shipped GLBs are gone. Kept from the village era: shops, hut (Rosa's lodge), quest board, barrel, crate, spruce, birch.

Retired in Phase 12b: `enemy_wisp`, `enemy_stamper`, `enemy_memo` (replaced by the satirical politician archetypes above).

## Audio
- `public/assets/audio/rosa_aura.mp3` (32 KB): the only recorded sample. 4 s of sustained "ah" singing from "Vocalise" (Rachmaninoff, a public-domain composition) at 22.45 s, cut by `tools/audio/extract-voice.py` from a recording supplied by the project owner (their own performance, supplied for this use). Played quietly (gain 0.32). Note: it is a recording of a real voice, so it is audible to anyone who can see this repository.
- Every other sound is synthesized at runtime with WebAudio (`src/audio/sfx.ts`): trident swing whoosh, hit thud, cute bubble pops (dash), soft rolling wave (Tide Surge). No sample files.
