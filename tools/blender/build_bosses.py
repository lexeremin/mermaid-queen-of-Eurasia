"""Phase 24: four more underground bosses, original satirical archetypes (no real people, no nationalities).

Exec after lib.py in the same namespace:
    ns["build_all_bosses"]()
Each is a rigid-part model like the Father of Corruption: legs, torso, head and two arms, where `arm_stamp` is the
arm the game raises and slams during a move, and an `idle` clip. Front faces Blender -Y. About 6 m tall.
  - The Lobbyist: pinstripe suit, monocle, an open briefcase of banknotes for a fist.
  - Senator Endless: a round man in a sash with a scroll to the floor and a megaphone.
  - The Yacht Baron: fur coat, chains, sunglasses, captain's hat and a golden anchor.
  - The Spin Doctor: a sleek teal suit, spiral tie, pinwheel cap and a giant microphone.
"""

import math


def _boss_done(name):
    objs = list(bpy.data.objects)
    return {
        "name": name,
        "tris": triangle_count(objs),
        "path": export_glb(name + ".glb", [name], animations=True),
    }


def _idle_clip(arm="arm_stamp", other="arm_off"):
    author_clips(
        {
            "idle": {
                "frames": 60,
                "tracks": [
                    {"obj": "torso", "kind": "bob", "amp": 0.05},
                    {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.04, "phase": 0.8},
                    {"obj": arm, "kind": "rot", "axis": 0, "amp": 0.05},
                    {"obj": other, "kind": "rot", "axis": 0, "amp": 0.06, "phase": math.pi},
                ],
            }
        }
    )


def _legs(root, color, shoe, hip=1.9, spread=0.75, width=1.05, depth=1.1):
    for name, x in (("leg_l", spread), ("leg_r", -spread)):
        leg = Part(name, (x, 0, hip), root)
        leg.box((width, depth, hip - 0.35), (x, 0, 0.35 + (hip - 0.35) / 2), color, bevel=0)
        leg.box((width + 0.1, depth + 0.5, 0.35), (x, -0.2, 0.175), shoe, bevel=0)
        leg.finish()


def _begin(name):
    global EMBED_DETAILS
    EMBED_DETAILS = False  # arms and props float on purpose
    clear_scene()
    return Empty(name)


def build_lobbyist():
    root = _begin("boss_lobbyist")
    _legs(root, "night", "ink", hip=2.2, spread=0.6, width=0.9)
    for x in (-0.6, 0.6):
        for z in (0.5, 1.1, 1.7):
            pass
    torso = Part("torso", (0, 0, 2.2), root)
    torso.box((2.5, 1.5, 3.2), (0, 0, 3.8), "night", bevel=0)
    for k in range(6):  # pinstripes
        torso.box((0.05, 0.05, 3.0), (-1.0 + k * 0.4, -0.78, 3.8), "slate", bevel=0)
    torso.box((0.9, 0.06, 2.6), (0, -0.79, 3.9), "snow", bevel=0)  # shirt
    torso.box((0.34, 0.08, 2.0), (0, -0.82, 3.6), "gold", bevel=0)  # tie
    torso.box((0.5, 0.1, 0.5), (0, -0.83, 4.65), "gold", bevel=0)
    torso.box((0.5, 0.06, 0.3), (0.85, -0.79, 4.6), "snow", rot=(0, 0.2, 0), bevel=0)  # pocket square
    for z in (2.9, 3.4):
        torso.box((0.16, 0.08, 0.16), (-0.5, -0.8, z), "gold", bevel=0)  # buttons
    torso.box((2.7, 1.6, 0.3), (0, 0, 2.55), "ink", bevel=0)  # belt
    torso.finish()
    head = Part("head", (0, 0, 5.4), torso)
    head.box((1.3, 1.2, 1.3), (0, 0, 6.05), "skin", bevel=0)
    head.box((1.4, 1.3, 0.4), (0, 0.05, 6.75), "hair_dark", bevel=0)  # slicked hair
    head.box((1.5, 0.5, 0.9), (0, 0.5, 6.2), "hair_dark", bevel=0)
    for x in (-0.3, 0.3):
        head.box((0.3, 0.06, 0.22), (x, -0.62, 6.15), "snow", bevel=0)
        head.box((0.12, 0.07, 0.12), (x, -0.64, 6.15), "ink", bevel=0)
        head.box((0.4, 0.06, 0.09), (x, -0.63, 6.4), "hair_dark", rot=(0, 0.3 if x > 0 else -0.3, 0), bevel=0)
    for k in range(8):  # the monocle
        a = k * math.pi / 4
        head.box((0.09, 0.05, 0.09), (0.3 + 0.24 * math.cos(a), -0.67, 6.15 + 0.24 * math.sin(a)), "gold", bevel=0)
    head.box((0.5, 0.05, 0.1), (0, -0.63, 5.7), "hair_dark", bevel=0)  # smug moustache
    head.box((0.9, 0.06, 0.09), (0, -0.63, 5.6), "skin_shadow", rot=(0, 0.1, 0), bevel=0)
    head.box((1.9, 1.7, 0.16), (0, 0, 7.15), "ink", bevel=0)  # top hat brim
    head.box((1.1, 1.0, 0.9), (0, 0, 7.6), "ink", bevel=0)
    head.box((1.12, 1.02, 0.22), (0, 0, 7.4), "gold", bevel=0)
    head.finish()
    # The fist: an open briefcase spilling banknotes.
    arm = Part("arm_stamp", (1.55, 0, 5.4), torso)
    arm.box((0.7, 0.7, 1.7), (1.9, 0, 4.6), "night", bevel=0)
    arm.box((0.6, 0.6, 0.4), (1.9, -0.1, 3.6), "skin", bevel=0)
    arm.box((1.9, 1.3, 0.3), (1.9, -0.3, 3.1), "wood_dark", bevel=0)
    arm.box((1.9, 0.18, 1.3), (1.9, 0.35, 3.75), "wood_dark", rot=(-0.2, 0, 0), bevel=0)
    for i in range(4):
        arm.box((0.5, 1.0, 0.28), (1.35 + i * 0.36, -0.3, 3.42 + 0.05 * (i % 2)), "leaf", bevel=0)
        arm.box((0.44, 0.12, 0.08), (1.35 + i * 0.36, -0.3, 3.58), "leaf_dark", bevel=0)
    arm.box((0.4, 0.1, 0.16), (1.9, -0.95, 3.2), "gold", bevel=0)
    arm.finish()
    off = Part("arm_off", (-1.55, 0, 5.4), torso)
    off.box((0.7, 0.7, 1.7), (-1.9, 0, 4.6), "night", bevel=0)
    off.box((0.6, 0.6, 0.4), (-1.9, -0.1, 3.6), "skin", bevel=0)
    off.box((1.1, 0.1, 1.5), (-1.9, -0.45, 3.4), "paper", rot=(0.1, 0, 0), bevel=0)  # a giant cheque
    off.box((0.7, 0.06, 0.12), (-1.9, -0.52, 3.9), "ink", bevel=0)
    off.box((0.4, 0.06, 0.3), (-1.9, -0.52, 3.3), "ruby", bevel=0)
    off.finish()
    _idle_clip()
    return _boss_done("boss_lobbyist")


def build_senator():
    root = _begin("boss_senator")
    _legs(root, "slate_dark", "ink", hip=1.8, spread=0.85, width=1.1)
    torso = Part("torso", (0, 0, 1.8), root)
    torso.box((3.6, 2.6, 1.6), (0, 0, 2.6), "paper", bevel=0)  # the belly
    torso.box((3.2, 2.2, 2.0), (0, 0, 4.2), "ivory", bevel=0)
    torso.box((3.7, 2.7, 0.26), (0, 0, 3.4), "wood_dark", bevel=0)  # waistband
    torso.box((0.5, 0.06, 3.6), (-0.8, -1.12, 3.7), "ruby", rot=(0, -0.55, 0), bevel=0)  # the sash
    for k in range(4):
        torso.box((0.16, 0.08, 0.16), (0.2 + k * 0.35, -1.36, 2.4 + 0.5 * (k % 2)), "gold", bevel=0)
    torso.box((1.0, 0.1, 0.5), (0.9, -1.33, 4.4), "gold", bevel=0)  # a medal
    torso.box((0.3, 0.1, 0.5), (0.9, -1.36, 3.95), "ruby", bevel=0)
    torso.finish()
    head = Part("head", (0, 0, 5.3), torso)
    head.box((1.9, 1.6, 1.6), (0, 0, 6.1), "skin", bevel=0)
    head.box((2.0, 1.7, 0.3), (0, 0, 6.85), "snow", bevel=0)  # white hair
    for x in (-1, 1):
        head.box((0.4, 1.4, 0.8), (x * 1.05, 0, 6.3), "snow", bevel=0)
    for x in (-0.45, 0.45):
        head.box((0.4, 0.06, 0.4), (x, -0.83, 6.2), "snow", bevel=0)
        head.box((0.14, 0.07, 0.14), (x, -0.85, 6.2), "ink", bevel=0)
        head.box((0.6, 0.08, 0.14), (x, -0.84, 6.55), "snow", rot=(0, 0.25 if x > 0 else -0.25, 0), bevel=0)
    for k in range(8):
        a = k * math.pi / 4
        head.box((0.08, 0.05, 0.08), (0.45 + 0.28 * math.cos(a), -0.88, 6.2 + 0.28 * math.sin(a)), "ink", bevel=0)
        head.box((0.08, 0.05, 0.08), (-0.45 + 0.28 * math.cos(a), -0.88, 6.2 + 0.28 * math.sin(a)), "ink", bevel=0)
    head.box((0.5, 0.05, 0.12), (0, -0.85, 6.2), "ink", bevel=0)
    head.box((1.1, 0.08, 0.5), (0, -0.84, 5.55), "ruby", bevel=0)  # a wide, tireless mouth
    head.box((0.8, 0.05, 0.16), (0, -0.86, 5.6), "snow", bevel=0)
    head.finish()
    # The fist: a megaphone.
    arm = Part("arm_stamp", (1.9, 0, 4.9), torso)
    arm.box((0.9, 0.9, 1.6), (2.2, 0, 4.1), "ivory", bevel=0)
    arm.box((0.7, 0.7, 0.4), (2.2, -0.1, 3.2), "skin", bevel=0)
    arm.cone(0.3, 0.3, 0.8, (2.2, -0.5, 3.0), "ink", segments=8, rot=(math.pi / 2, 0, 0))
    arm.cone(0.35, 1.3, 1.6, (2.2, -1.5, 3.0), "gold", segments=10, rot=(math.pi / 2, 0, 0))
    arm.cone(1.3, 1.3, 0.12, (2.2, -2.35, 3.0), "ruby", segments=10, rot=(math.pi / 2, 0, 0), caps=False)
    arm.finish()
    off = Part("arm_off", (-1.9, 0, 4.9), torso)
    off.box((0.9, 0.9, 1.6), (-2.2, 0, 4.1), "ivory", bevel=0)
    off.box((0.7, 0.7, 0.4), (-2.2, -0.1, 3.2), "skin", bevel=0)
    off.box((0.9, 0.9, 2.2), (-2.3, -0.5, 2.3), "paper", bevel=0)  # the scroll, down to the floor
    off.cone(0.5, 0.5, 1.0, (-2.3, -0.5, 3.55), "wood_light", segments=8)
    off.box((0.9, 0.06, 1.8), (-2.3, -0.97, 2.2), "ivory", bevel=0)
    for z in (1.8, 2.3, 2.8):
        off.box((0.7, 0.05, 0.08), (-2.3, -1.0, z), "ink", bevel=0)
    off.finish()
    _idle_clip()
    return _boss_done("boss_senator")


def build_baron():
    root = _begin("boss_baron")
    _legs(root, "wet_dark", "wood_dark", hip=2.0, spread=0.8, width=1.1)
    torso = Part("torso", (0, 0, 2.0), root)
    torso.box((3.2, 2.0, 3.0), (0, 0, 3.6), "wood_light", bevel=0)  # fur coat
    for k in range(6):  # fur tufts
        torso.box((0.7, 0.16, 0.5), (-1.3 + k * 0.52, -1.04, 2.3 + 0.03 * (k % 3)), "birch", bevel=0)
    torso.box((3.4, 2.2, 0.5), (0, 0, 5.15), "birch", bevel=0)  # collar
    torso.box((2.4, 0.1, 1.8), (0, -1.05, 4.0), "night", bevel=0)  # shirt
    for k in range(5):  # gold chains
        torso.box((1.6 - 0.15 * k, 0.1, 0.1), (0, -1.14, 4.75 - 0.3 * k), "gold", bevel=0)
    torso.box((0.6, 0.1, 0.6), (0, -1.16, 3.2), "gold", bevel=0)  # a big medallion
    torso.box((0.3, 0.12, 0.3), (0, -1.18, 3.2), "ruby", bevel=0)
    torso.finish()
    head = Part("head", (0, 0, 5.4), torso)
    head.box((1.6, 1.4, 1.4), (0, 0, 6.1), "skin", bevel=0)
    head.box((1.7, 0.16, 0.5), (0, 0, 5.75), "skin_shadow", bevel=0)  # jowls
    head.box((1.7, 0.06, 0.4), (0, -0.73, 6.25), "ink", bevel=0)  # sunglasses
    for x in (-0.4, 0.4):
        head.box((0.55, 0.07, 0.4), (x, -0.75, 6.25), "ink", bevel=0)
        head.box((0.4, 0.08, 0.05), (x, -0.77, 6.38), "aqua", bevel=0)
    head.box((0.9, 0.06, 0.1), (0, -0.74, 5.75), "hair_dark", bevel=0)  # moustache
    for x in (-1, 1):
        head.box((0.14, 0.4, 0.7), (x * 0.86, 0, 6.2), "hair_dark", bevel=0)
    head.box((2.0, 1.8, 0.2), (0, -0.1, 6.95), "snow", bevel=0)  # captain's cap
    head.box((1.5, 1.4, 0.6), (0, 0, 7.3), "snow", bevel=0)
    head.box((1.9, 0.9, 0.12), (0, -0.85, 7.0), "ink", bevel=0)
    head.box((0.3, 0.06, 0.4), (0, -0.78, 7.35), "gold", bevel=0)  # the badge
    head.box((0.5, 0.06, 0.1), (0, -0.78, 7.5), "gold", rot=(0, 0.6, 0), bevel=0)
    head.finish()
    # The fist: a golden anchor on a rope.
    arm = Part("arm_stamp", (1.75, 0, 5.0), torso)
    arm.box((0.9, 0.9, 1.6), (2.05, 0, 4.2), "wood_light", bevel=0)
    arm.box((0.7, 0.7, 0.4), (2.05, -0.1, 3.3), "skin", bevel=0)
    arm.box((0.32, 0.32, 2.6), (2.05, -0.2, 2.2), "gold", bevel=0)
    arm.box((1.8, 0.32, 0.32), (2.05, -0.2, 3.3), "gold", bevel=0)
    arm.box((0.3, 0.3, 0.9), (1.3, -0.2, 0.9), "gold", rot=(0, 0.5, 0), bevel=0)
    arm.box((0.3, 0.3, 0.9), (2.8, -0.2, 0.9), "gold", rot=(0, -0.5, 0), bevel=0)
    arm.box((1.9, 0.3, 0.3), (2.05, -0.2, 0.6), "gold", bevel=0)
    arm.cone(0.5, 0.5, 0.2, (2.05, -0.2, 3.6), "wood", segments=8, caps=True)
    arm.finish()
    off = Part("arm_off", (-1.75, 0, 5.0), torso)
    off.box((0.9, 0.9, 1.6), (-2.05, 0, 4.2), "wood_light", bevel=0)
    off.box((0.7, 0.7, 0.4), (-2.05, -0.1, 3.3), "skin", bevel=0)
    off.cone(0.42, 0.28, 0.9, (-2.05, -0.5, 3.6), "aqua", segments=8)  # a cocktail
    off.box((0.05, 0.05, 0.5), (-1.9, -0.5, 4.3), "ruby", rot=(0, 0.3, 0), bevel=0)
    off.finish()
    _idle_clip()
    return _boss_done("boss_baron")


def build_spin():
    root = _begin("boss_spin")
    _legs(root, "teal_dark", "ink", hip=2.3, spread=0.6, width=0.85)
    torso = Part("torso", (0, 0, 2.3), root)
    torso.box((2.3, 1.4, 3.0), (0, 0, 3.8), "teal", bevel=0)  # a sleek suit
    torso.box((0.9, 0.06, 2.5), (0, -0.73, 3.9), "snow", bevel=0)
    for k in range(6):  # the spiral tie
        torso.box((0.7 - 0.08 * k, 0.1, 0.22), (0, -0.78, 4.6 - 0.36 * k), "ruby" if k % 2 == 0 else "gold", bevel=0)
    torso.box((2.5, 1.5, 0.26), (0, 0, 2.55), "ink", bevel=0)
    for x in (-1, 1):
        torso.box((0.5, 0.06, 0.9), (x * 0.9, -0.73, 4.2), "teal_dark", bevel=0)  # lapels
    torso.finish()
    head = Part("head", (0, 0, 5.3), torso)
    head.box((1.3, 1.2, 1.3), (0, 0, 5.95), "skin", bevel=0)
    head.box((1.4, 1.3, 0.35), (0, 0.05, 6.65), "hair_brown", bevel=0)
    for k in range(3):  # a swirl of gelled hair
        head.cone(0.5 - 0.12 * k, 0.4 - 0.12 * k, 0.4, (0.0, 0.1, 6.95 + 0.35 * k), "hair_brown", segments=8)
    for x in (-0.3, 0.3):
        head.box((0.3, 0.06, 0.24), (x, -0.62, 6.05), "snow", bevel=0)
        head.box((0.14, 0.07, 0.14), (x, -0.64, 6.05), "ink", bevel=0)
    head.box((0.8, 0.06, 0.28), (0, -0.63, 5.55), "snow", bevel=0)  # a toothy grin
    head.box((0.8, 0.07, 0.06), (0, -0.65, 5.55), "ruby", bevel=0)
    for k in range(4):  # the pinwheel cap
        a = k * math.pi / 2
        head.box((0.55, 0.06, 0.55), (0.35 * math.cos(a), -0.05 + 0.35 * math.sin(a), 7.9), ("ruby", "aqua", "gold", "violet")[k], rot=(0, 0, a), bevel=0)
    head.box((0.12, 0.12, 0.7), (0, 0, 7.55), "ink", bevel=0)
    head.finish()
    # The fist: a giant microphone.
    arm = Part("arm_stamp", (1.5, 0, 5.0), torso)
    arm.box((0.7, 0.7, 1.7), (1.85, 0, 4.2), "teal", bevel=0)
    arm.box((0.6, 0.6, 0.4), (1.85, -0.1, 3.3), "skin", bevel=0)
    arm.box((0.32, 0.32, 1.8), (1.85, -0.2, 2.3), "ink", bevel=0)
    arm.cone(0.3, 0.9, 0.7, (1.85, -0.2, 1.2), "slate_light", segments=10)
    arm.cone(0.9, 0.9, 0.5, (1.85, -0.2, 0.7), "ruby", segments=10)
    arm.finish()
    off = Part("arm_off", (-1.5, 0, 5.0), torso)
    off.box((0.7, 0.7, 1.7), (-1.85, 0, 4.2), "teal", bevel=0)
    off.box((0.6, 0.6, 0.4), (-1.85, -0.1, 3.3), "skin", bevel=0)
    off.box((0.25, 0.25, 0.6), (-1.85, -0.5, 3.75), "skin", rot=(-0.5, 0, 0), bevel=0)  # a thumbs up
    off.finish()
    _idle_clip()
    return _boss_done("boss_spin")


def build_all_bosses():
    return [build_lobbyist(), build_senator(), build_baron(), build_spin()]
