"""Village-era assets kept for the Red Square map: market stalls, Rosa's lodge, quest board, barrel, crate, birch.

    Same usage as build_redsquare_assets.py:

    exec(open(REPO + "/tools/blender/lib.py").read(), ns)
    exec(open(REPO + "/tools/blender/build_village_assets.py").read(), ns)
    ns["build_all_village"]()
Front of buildings faces Blender -Y (glTF +Z, south in game). Bridge length runs along Y.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def _gable_roof(p, x_half, run, rise, eave_z, colors, ridge_color="wood_dark"):
    """Two-slope roof with shingle strips; colors = per-strip colors from eave to ridge."""
    theta = math.atan2(rise, run)
    length = math.hypot(run, rise)
    n = len(colors)
    width = length / n
    for side in (-1, 1):
        phi = theta if side < 0 else -theta
        direction = (0, -side * run / length, rise / length)
        normal = (0, -math.sin(phi), math.cos(phi))
        eave = (0, side * run, eave_z)
        center = tuple(e + d * length / 2 for e, d in zip(eave, direction))
        p.box((2 * x_half, length, 0.16), center, "wood_dark", rot=(phi, 0, 0))
        for k, color in enumerate(colors):
            s = (k + 0.5) * width
            thick = 0.06
            off = 0.1
            pos = tuple(e + d * s + nn * off for e, d, nn in zip(eave, direction, normal))
            p.box((2 * x_half - 0.1, width - 0.04, thick), pos, color, rot=(phi, 0, 0))
    p.box((2 * x_half + 0.1, 0.3, 0.3), (0, 0, eave_z + rise + 0.05), ridge_color, rot=(math.pi / 4, 0, 0))


def _shop(name, awning, goods):
    clear_scene()
    p = Part(name)
    for x in (-1.75, 1.75):
        p.box((0.22, 0.22, 2.5), (x, -1.3, 1.25), "wood_dark")
        p.box((0.22, 0.22, 2.9), (x, 1.3, 1.45), "wood_dark")
        p.box((0.14, 2.6, 2.0), (x, 0, 1.0), "wood_light")
    p.box((3.7, 0.16, 2.6), (0, 1.35, 1.3), "wood")
    p.box((3.6, 0.9, 0.9), (0, -1.0, 0.45), "wood_light")
    p.box((3.8, 1.1, 0.1), (0, -1.0, 0.95), "wood")

    stripes = 6
    span = 3.72 / stripes
    tilt = math.atan2(0.5, 3.3)
    length = math.hypot(3.3, 0.5)
    for i in range(stripes):
        x = -1.86 + span * (i + 0.5)
        color = awning[i % 2]
        p.box((span - 0.02, length, 0.1), (x, -0.25, 2.65), color, rot=(tilt, 0, 0))
        p.box((span - 0.02, 0.08, 0.3), (x, -1.95, 2.28), color)

    p.box((2.2, 0.08, 0.5), (0, -1.5, 1.95), "wood_light")
    p.box((1.6, 0.1, 0.08), (0, -1.55, 1.95), "gold")
    for dx, color, w, h in goods:
        p.box((w, w, h), (dx, -1.0, 1.0 + h / 2), color)
    return _done(name, p)


def build_shop():
    return _shop("bld_shop", ("rose", "paper"), [(-1.2, "amber", 0.4, 0.4), (-0.4, "ember", 0.35, 0.3), (0.5, "brick", 0.45, 0.35), (1.3, "amber", 0.35, 0.5)])


def build_shop_herbs():
    return _shop("bld_shop_herbs", ("teal", "paper"), [(-1.2, "moss", 0.4, 0.45), (-0.4, "spruce_light", 0.35, 0.3), (0.5, "aqua", 0.4, 0.3), (1.3, "violet", 0.35, 0.4)])


def build_hut():
    clear_scene()
    p = Part("bld_hut")
    p.box((3.0, 2.5, 1.8), (0, 0, 0.9), "wood_dark")
    for row in range(4):
        z = 0.2 + 0.4 * row
        color = "wood" if row % 2 == 0 else "wood_light"
        if row % 2 == 0:
            for y in (-1.3, 1.3):
                p.box((3.6, 0.3, 0.36), (0, y, z), color)
        else:
            for x in (-1.6, 1.6):
                p.box((0.3, 3.1, 0.36), (x, 0, z), color)
    p.prism_yz([(-1.3, 1.8), (1.3, 1.8), (0, 3.0)], -1.5, 1.5, "wood_light")
    _gable_roof(p, 1.9, 1.75, 1.5, 1.75, ("teal", "aqua", "teal", "aqua"), "pearl")
    p.box((0.5, 0.06, 0.4), (0, -1.5, 2.3), "pearl")
    p.box((0.3, 0.08, 0.24), (0, -1.53, 2.3), "rose")
    p.box((0.6, 0.6, 1.2), (0.9, 0.7, 2.7), "brick")
    p.box((0.95, 0.06, 1.55), (-0.5, -1.36, 0.78), "aqua")
    p.box((0.75, 0.1, 1.4), (-0.5, -1.4, 0.7), "teal_dark")
    p.box((0.08, 0.06, 0.08), (-0.25, -1.47, 0.75), "gold")
    p.box((0.9, 0.08, 0.8), (0.75, -1.34, 1.05), "aqua")
    p.box((0.65, 0.1, 0.55), (0.75, -1.38, 1.05), "candle")
    p.box((0.65, 0.12, 0.06), (0.75, -1.4, 1.05), "wood_dark")
    p.box((1.2, 0.45, 0.14), (-0.5, -1.65, 0.07), "wood_light")
    return _done("bld_hut", p)


def build_questboard():
    clear_scene()
    p = Part("prop_questboard")
    for x in (-1.0, 1.0):
        p.box((0.18, 0.18, 2.2), (x, 0, 1.1), "wood_dark")
    p.box((2.2, 0.12, 1.3), (0, 0, 1.4), "wood_light")
    p.box((2.4, 0.16, 0.12), (0, 0, 0.72), "wood")
    for dx, dz, color in ((-0.6, 1.6, "paper"), (0.1, 1.35, "amber"), (0.65, 1.55, "paper"), (-0.15, 1.0, "rose")):
        p.box((0.45, 0.04, 0.4), (dx, -0.08, dz), color)
    p.box((2.6, 0.9, 0.1), (0, -0.1, 2.35), "wood", rot=(0.35, 0, 0))
    return _done("prop_questboard", p)


def build_barrel():
    clear_scene()
    p = Part("prop_barrel")
    p.cone(0.4, 0.34, 0.9, (0, 0, 0.45), "wood", segments=8)
    for z in (0.2, 0.7):
        p.cone(0.43 if z < 0.5 else 0.37, 0.42 if z < 0.5 else 0.36, 0.07, (0, 0, z), "wood_dark", segments=8, caps=False)
    p.cone(0.3, 0.3, 0.05, (0, 0, 0.92), "wood_dark", segments=8)
    return _done("prop_barrel", p)


def build_crate():
    clear_scene()
    p = Part("prop_crate")
    p.box((0.9, 0.9, 0.8), (0, 0, 0.4), "wood_light")
    for z in (0.08, 0.72):
        p.box((0.94, 0.94, 0.08), (0, 0, z), "wood")
    p.box((0.94, 0.06, 0.5), (0, -0.46, 0.4), "wood_dark", rot=(0, 0.0, 0))
    return _done("prop_crate", p)


def build_birch():
    clear_scene()
    p = Part("tree_birch")
    p.cone(0.16, 0.1, 2.6, (0, 0, 1.3), "birch", segments=5)
    for x, y, z in ((0.0, -0.1, 0.7), (-0.05, -0.08, 1.3), (0.05, -0.08, 1.9)):
        p.box((0.09, 0.05, 0.12), (x, y, z), "ink")
    p.cone(1.0, 0.2, 1.7, (0, 0, 2.6), "leaf", segments=8)
    p.cone(0.7, 0, 1.0, (0, 0, 3.7), "leaf_dark", segments=8)
    p.cone(0.45, 0, 0.5, (0, 0, 4.05), "leaf", segments=8)
    return _done("tree_birch", p)


def build_linden():
    clear_scene()
    p = Part("tree_linden")
    p.cone(0.22, 0.14, 1.7, (0, 0, 0.85), "bark", segments=6)
    p.cone(0.9, 1.6, 1.0, (0, 0, 2.3), "leaf_dark", segments=8)
    p.cone(1.6, 1.2, 0.9, (0, 0, 3.25), "leaf", segments=8)
    p.cone(1.2, 0.3, 0.9, (0, 0, 4.1), "leaf", segments=8)
    for x, y, z, s in ((0.95, 0.1, 3.0, 0.9), (-0.9, -0.2, 3.1, 0.85), (0.1, 0.9, 3.3, 0.8)):
        p.box((s, s, s), (x, y, z), "leaf_dark", rot=(0.4, 0.3, math.pi / 4))
    return _done("tree_linden", p)


def build_flowerbed():
    clear_scene()
    p = Part("prop_flowerbed")
    p.box((2.4, 1.2, 0.3), (0, 0, 0.15), "stone")
    p.box((2.2, 1.0, 0.3), (0, 0, 0.2), "bark")
    colors = ("flower_red", "flower_yellow", "lilac", "ivory", "flower_red", "flower_yellow")
    for i in range(8):
        x = -0.75 + (i % 4) * 0.5
        y = -0.28 + (i // 4) * 0.56
        p.box((0.05, 0.05, 0.3), (x, y, 0.5), "leaf_dark")
        p.box((0.2, 0.2, 0.14), (x, y, 0.72), colors[(i * 5 + i // 6) % len(colors)])
    return _done("prop_flowerbed", p)


def build_all_village():
    fns = [
        build_shop, build_shop_herbs, build_hut, build_questboard, build_barrel, build_crate,
        build_birch, build_linden, build_flowerbed,
    ]
    return [fn() for fn in fns]
