"""The three archangels (Phase 21): Michael, Gabriel and Serafima, the small winged children of Rosa and Prince Sasha.

Exec after lib.py in the same namespace:
    ns["build_all_archangels"]()
Rigid parts (body, head, halo, arms, wings) with `idle` and `happy` clips. Front faces Blender -Y. Original characters;
the children are fictional, drawn as cute chibi figures with a halo, feathered wings and a small prop each.
"""

import math


def _done(name, root_name):
    objs = list(bpy.data.objects)
    return {"name": name, "tris": triangle_count(objs), "path": export_glb(name + ".glb", [root_name], animations=True)}


def _wing(body, name, side, root_z, color, tip, spread=1.0, drop=0.0, y=0.13):
    """One wing: a fan of four feathers around the shoulder joint. `side` is +1 (Rosa's left, +X) or -1."""
    pivot = (side * 0.13, y, root_z)
    wing = Part(name, pivot, body)
    for i, (angle, length, width) in enumerate(((58, 0.34, 0.12), (34, 0.44, 0.12), (10, 0.5, 0.12), (-14, 0.42, 0.11))):
        a = math.radians(angle - drop)
        cx = pivot[0] + side * math.cos(a) * length * 0.5 * spread
        cz = pivot[2] + math.sin(a) * length * 0.5 * spread
        rot = (0, -side * a, 0)
        wing.box((length * spread, 0.04, width), (cx, y + 0.005 * i, cz), color, rot=rot, bevel=0)
        tip_x = pivot[0] + side * math.cos(a) * (length * spread - 0.03)
        tip_z = pivot[2] + math.sin(a) * (length * spread - 0.03)
        wing.box((0.08 * spread, 0.045, width * 0.92), (tip_x, y + 0.005 * i, tip_z), tip, rot=rot, bevel=0)
    wing.finish()
    return wing


def _child(name, robe, trim, hair, wing, tip, pairs=2, prop=None, girl=False):
    # Feathers and limbs are meant to overlap and float: the wall-plate audit (Phase 20) would pull them into the body.
    global EMBED_DETAILS
    EMBED_DETAILS = False
    clear_scene()
    root = Empty(name)

    body = Part("body", (0, 0, 0.55), root)
    body.cone(0.27, 0.18, 0.5, (0, 0, 0.62), robe, segments=8)
    body.box((0.4, 0.3, 0.05), (0, 0, 0.4), trim, bevel=0)
    body.box((0.36, 0.28, 0.05), (0, 0, 0.72), trim, bevel=0)
    body.box((0.2, 0.2, 0.06), (0, 0, 0.87), "skin")
    for x in (-0.07, 0.07):
        body.box((0.09, 0.09, 0.18), (x, 0, 0.3), "skin", bevel=0)
        body.box((0.11, 0.15, 0.06), (x, -0.02, 0.19), "wood_dark", bevel=0)
    body.finish()

    head = Part("head", (0, 0, 0.92), body)
    head.box((0.4, 0.38, 0.36), (0, 0, 1.12), "skin", bevel=0)
    for x in (-0.09, 0.09):
        head.box((0.075, 0.03, 0.1), (x, -0.195, 1.14), "ink", bevel=0)
        head.box((0.03, 0.03, 0.035), (x + 0.012, -0.21, 1.17), "snow", bevel=0)
        head.box((0.09, 0.025, 0.05), (x * 1.55, -0.195, 1.06), "blush", bevel=0)
    head.box((0.1, 0.025, 0.025), (0, -0.196, 1.02), "skin_shadow", bevel=0)
    head.box((0.04, 0.03, 0.05), (0, -0.2, 1.1), "skin_shadow", bevel=0)
    head.box((0.44, 0.42, 0.11), (0, 0.01, 1.34), hair, bevel=0)
    head.box((0.4, 0.07, 0.09), (0, -0.2, 1.3), hair, bevel=0)
    for x in (-1, 1):
        head.box((0.06, 0.34, 0.26), (x * 0.215, 0.02, 1.16), hair, bevel=0)
    head.box((0.42, 0.1, 0.32), (0, 0.19, 1.15), hair, bevel=0)
    if girl:
        for x in (-1, 1):
            head.box((0.09, 0.09, 0.3), (x * 0.24, 0.0, 0.94), hair, bevel=0)
            head.box((0.12, 0.05, 0.1), (x * 0.22, -0.08, 1.28), "ruby", bevel=0, rot=(0, x * 0.5, 0))
    else:
        head.box((0.14, 0.12, 0.08), (0.08, -0.14, 1.4), hair, bevel=0, rot=(0, 0.3, 0.2))
    head.finish()

    halo = Part("halo", (0, 0, 1.62), head)
    for k in range(8):
        a = math.tau * k / 8
        halo.box((0.115, 0.04, 0.04), (0.2 * math.cos(a), 0.2 * math.sin(a) * 0.9, 1.62), "gold", rot=(0, 0, a + math.pi / 2), bevel=0)
    halo.finish()

    for name_arm, side in (("arm_l", 1), ("arm_r", -1)):
        arm = Part(name_arm, (side * 0.24, 0, 0.88), body)
        arm.box((0.09, 0.1, 0.3), (side * 0.25, 0, 0.72), robe, bevel=0)
        arm.box((0.09, 0.09, 0.09), (side * 0.25, -0.01, 0.53), "skin", bevel=0)
        if prop:
            prop(arm, side)
        arm.finish()

    z = 0.95
    _wing(body, "wing_l", 1, z, wing, tip)
    _wing(body, "wing_r", -1, z, wing, tip)
    if pairs > 1:
        _wing(body, "wing2_l", 1, z - 0.12, wing, tip, spread=0.8, drop=25, y=0.15)
        _wing(body, "wing2_r", -1, z - 0.12, wing, tip, spread=0.8, drop=25, y=0.15)
    if pairs > 2:
        _wing(body, "wing3_l", 1, z + 0.08, wing, tip, spread=0.62, drop=-30, y=0.17)
        _wing(body, "wing3_r", -1, z + 0.08, wing, tip, spread=0.62, drop=-30, y=0.17)

    flappers = ["wing_l", "wing_r"] + (["wing2_l", "wing2_r"] if pairs > 1 else []) + (["wing3_l", "wing3_r"] if pairs > 2 else [])
    idle = [{"obj": "body", "kind": "bob", "amp": 0.03}, {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.04, "phase": 0.6},
            {"obj": "arm_l", "kind": "rot", "axis": 0, "amp": 0.05}, {"obj": "arm_r", "kind": "rot", "axis": 0, "amp": 0.05, "phase": math.pi}]
    happy = [{"obj": "body", "kind": "bob", "amp": 0.09, "cycles": 3}, {"obj": "head", "kind": "rot", "axis": 2, "amp": 0.16, "cycles": 2},
             {"obj": "arm_l", "kind": "rot", "axis": 1, "amp": 0.5, "cycles": 2}, {"obj": "arm_r", "kind": "rot", "axis": 1, "amp": 0.5, "cycles": 2, "phase": math.pi}]
    for i, w in enumerate(flappers):
        sign = 1 if w.endswith("_l") else -1
        idle.append({"obj": w, "kind": "rot", "axis": 1, "amp": 0.22 * sign, "phase": i * 0.3})
        happy.append({"obj": w, "kind": "rot", "axis": 1, "amp": 0.6 * sign, "cycles": 3, "phase": i * 0.2})
    author_clips({"idle": {"frames": 60, "tracks": idle}, "happy": {"frames": 30, "tracks": happy}})
    return _done(name, name)


def _michael_props(arm, side):
    if side == 1:  # shield on Rosa's-left arm
        arm.box((0.06, 0.28, 0.3), (0.33, -0.1, 0.62), "dome_blue", bevel=0)
        arm.box((0.07, 0.07, 0.07), (0.33, -0.24, 0.62), "gold", bevel=0)
    else:  # wooden sword held out
        arm.box((0.05, 0.05, 0.16), (-0.25, -0.03, 0.52), "wood_dark", bevel=0)
        arm.box((0.16, 0.05, 0.04), (-0.25, -0.03, 0.6), "gold", bevel=0)
        arm.box((0.05, 0.03, 0.46), (-0.25, -0.03, 0.85), "wood_light", bevel=0)


def _gabriel_props(arm, side):
    if side == -1:  # a little trumpet
        arm.box((0.06, 0.06, 0.28), (-0.25, -0.05, 0.6), "gold", bevel=0)
        arm.cone(0.03, 0.11, 0.2, (-0.25, -0.05, 0.84), "gold", segments=6, smooth=False)
    else:  # a lily
        arm.box((0.03, 0.03, 0.34), (0.25, -0.04, 0.62), "leaf", bevel=0)
        arm.cone(0.09, 0.02, 0.14, (0.25, -0.04, 0.84), "snow", segments=6, smooth=False)


def _serafima_props(arm, side):
    arm.box((0.13, 0.13, 0.15), (side * 0.2, -0.12, 0.53), "ember", bevel=0)
    arm.box((0.08, 0.08, 0.09), (side * 0.2, -0.12, 0.64), "candle", bevel=0)


def build_michael():
    return _child("npc_michael", "dome_blue", "gold", "hair_brown", "ivory", "dome_blue", prop=_michael_props)


def build_gabriel():
    return _child("npc_gabriel", "ivory", "gold", "candle", "ivory", "gold", prop=_gabriel_props)


def build_serafima():
    return _child("npc_serafima", "rose", "ruby", "hair_dark", "ivory", "rose", pairs=3, prop=_serafima_props, girl=True)


def build_all_archangels():
    return [build_michael(), build_gabriel(), build_serafima()]
