"""Phase 6 Red Square assets (stylized, surreal; no state emblems).

    exec(open(REPO + "/tools/blender/lib.py").read(), ns)
    exec(open(REPO + "/tools/blender/build_redsquare_assets.py").read(), ns)
    ns["build_all_redsquare"]()
Front of buildings faces Blender -Y (glTF +Z). Wall and arcade segments run along X; bridge along Y.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def _seams(p, size_xy, z_values, color="brick_dark"):
    for z in z_values:
        p.box((size_xy[0], size_xy[1], 0.06), (0, 0, z), color)


def _onion(p, x, y, z, r, main, band):
    """Onion dome sitting on z: neck, two-tone bulb, spire tip."""
    p.cone(r * 0.55, r * 0.55, r * 0.35, (x, y, z + r * 0.175), "stone", segments=8)
    p.cone(r * 0.6, r, r * 0.55, (x, y, z + r * 0.35 + r * 0.275), band, segments=8)
    p.cone(r, r * 0.12, r * 1.15, (x, y, z + r * 0.9 + r * 0.575), main, segments=8)
    p.cone(r * 0.09, 0, r * 0.45, (x, y, z + r * 2.05 + r * 0.22), "gold", segments=4)


def build_basil():
    clear_scene()
    p = Part("lmk_basil")
    p.box((13.4, 10.4, 0.4), (0, 0, 0.2), "stone")
    p.box((13, 10, 2.4), (0, 0, 1.6), "brick_light")
    _seams(p, (13.05, 10.05), (1.1, 1.7, 2.3))

    p.cone(2.1, 2.0, 5.0, (0, 0, 5.3), "brick_light", segments=8)
    for z in (4.2, 6.2):
        p.cone(2.14, 2.14, 0.08, (0, 0, z), "stone", segments=8, caps=False)
    for ang in range(0, 360, 90):
        a = math.radians(ang)
        p.box((0.3, 0.14, 0.7), (2.05 * math.cos(a), 2.05 * math.sin(a), 5.6), "ink", rot=(0, 0, a + math.pi / 2))
    p.cone(2.05, 0.4, 4.6, (0, 0, 9.9), "dome_green", segments=8)
    p.cone(2.0, 1.6, 0.4, (0, 0, 8.0), "gold", segments=8, caps=False)
    _onion(p, 0, 0, 12.2, 0.55, "gold", "dome_red")

    domes = ["dome_green", "dome_blue", "dome_red", "gold", "teal", "dome_green", "dome_red", "dome_blue"]
    bands = ["gold", "stone", "gold", "dome_red", "gold", "dome_blue", "gold", "stone"]
    drums = ["brick_light", "stone", "brick_light", "stone", "brick_dark", "stone", "brick_light", "stone"]
    heights = [3.4, 3.0, 3.8, 3.2, 3.6, 3.0, 3.4, 3.8]
    for k in range(8):
        ang = math.radians(k * 45 + 22.5)
        x, y = 4.7 * math.cos(ang) * 1.05, 4.0 * math.sin(ang)
        h = heights[k]
        p.cone(1.3, 1.25, h, (x, y, 2.6 + h / 2), drums[k], segments=8)
        p.cone(1.34, 1.34, 0.1, (x, y, 2.6 + h * 0.55), "brick_dark", segments=8, caps=False)
        for wa in range(0, 360, 90):
            a = math.radians(wa) + ang
            p.box((0.26, 0.12, 0.6), (x + 1.28 * math.cos(a), y + 1.28 * math.sin(a), 2.6 + h * 0.5), "ink", rot=(0, 0, a + math.pi / 2))
        _onion(p, x, y, 2.6 + h, 0.95, domes[k], bands[k])
    return _done("lmk_basil", p)


def build_kremlin_wall():
    clear_scene()
    p = Part("bld_kremlin_wall")
    p.box((6, 2.4, 0.5), (0, 0, 0.25), "stone")
    p.box((6, 2.2, 4.1), (0, 0, 2.55), "brick_light")
    _seams(p, (6.02, 2.22), (1.3, 2.1, 2.9, 3.7))
    p.box((6, 2.3, 0.14), (0, 0, 4.62), "stone")
    for i in range(5):
        x = -2.4 + i * 1.2
        p.box((0.75, 2.2, 1.0), (x, 0, 5.2), "brick_light")
        p.box((0.85, 2.3, 0.12), (x, 0, 5.76), "stone")
    for x in (-1.5, 1.5):
        p.box((0.14, 0.06, 0.6), (x, -1.12, 2.5), "ink")
    return _done("bld_kremlin_wall", p)


def build_kremlin_tower():
    clear_scene()
    p = Part("bld_kremlin_tower")
    p.box((4.4, 4.4, 0.6), (0, 0, 0.3), "stone")
    p.box((4.0, 4.0, 7.0), (0, 0, 4.1), "brick_light")
    _seams(p, (4.04, 4.04), (1.6, 2.6, 3.6, 4.6, 5.6, 6.6))
    p.box((1.4, 0.1, 2.2), (0, -2.02, 2.0), "ink")
    for x in (-1.2, 1.2):
        p.box((0.16, 0.06, 0.8), (x, -2.02, 5.2), "ink")
    p.box((4.4, 4.4, 0.5), (0, 0, 7.85), "stone")
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.7, 0.7, 0.6), (sx * 1.85, sy * 1.85, 8.4), "brick_light")
    p.box((3.0, 3.0, 2.6), (0, 0, 9.7), "stone")
    for ang, (dx, dy) in ((0, (0, -1.56)), (math.pi / 2, (-1.56, 0)), (-math.pi / 2, (1.56, 0))):
        p.box((1.7, 0.12, 1.7), (dx, dy, 9.8), "candle", rot=(0, 0, ang))
        p.box((0.08, 0.14, 0.6), (dx, dy, 9.95), "ink", rot=(0, 0, ang))
        p.box((0.5, 0.14, 0.08), (dx, dy, 9.8), "ink", rot=(0, 0, ang))
    p.cone(1.7, 1.5, 2.4, (0, 0, 12.2), "brick_light", segments=8)
    for a in range(0, 360, 90):
        r = math.radians(a)
        p.box((0.3, 0.12, 0.9), (1.55 * math.cos(r), 1.55 * math.sin(r), 12.2), "ink", rot=(0, 0, r + math.pi / 2))
    p.cone(1.75, 1.75, 0.15, (0, 0, 13.45), "gold", segments=8, caps=False)
    p.cone(1.7, 0.12, 5.0, (0, 0, 15.9), "dome_green", segments=8)
    p.cone(0, 0.3, 0.5, (0, 0, 18.65), "ruby", segments=4)
    p.cone(0.3, 0, 0.55, (0, 0, 19.15), "ruby", segments=4)
    return _done("bld_kremlin_tower", p)


def build_museum():
    clear_scene()
    p = Part("bld_museum")
    p.box((14.4, 5.4, 0.6), (0, 0, 0.3), "stone")
    p.box((14, 5, 6), (0, 0, 3.6), "brick_light")
    _seams(p, (14.05, 5.05), (1.5, 2.5, 3.5, 4.5, 5.5))
    p.box((14.2, 5.2, 0.4), (0, 0, 6.8), "stone")
    for x in (-5.0, -3.4, 3.4, 5.0):
        p.box((0.8, 0.1, 1.6), (x, -2.53, 3.0), "brick_dark")
        p.box((0.62, 0.12, 1.4), (x, -2.56, 3.0), "candle")
        p.box((1.0, 0.14, 0.2), (x, -2.55, 3.95), "stone")
    p.box((3.4, 3.4, 9.0), (0, -0.3, 5.1), "brick_light")
    _seams(p, (3.44, 3.44), (2.2, 3.4, 4.6, 5.8, 7.0, 8.2))
    p.box((1.6, 0.12, 2.6), (0, -2.04, 1.9), "ink")
    p.box((1.2, 0.12, 1.2), (0, -2.04, 6.4), "candle")
    p.box((0.08, 0.14, 0.45), (0, -2.06, 6.5), "ink")
    p.cone(2.6, 0.15, 4.4, (0, -0.3, 11.8), "brick_dark", segments=4, rot=(0, 0, math.pi / 4))
    p.cone(0.09, 0, 0.9, (0, -0.3, 14.45), "gold", segments=4)
    for sx in (-1, 1):
        x = sx * 5.9
        p.box((2.4, 2.4, 8.0), (x, 0, 4.6), "brick_light")
        _seams(p, (2.44, 2.44), (2.0, 3.2, 4.4, 5.6, 6.8))
        p.box((0.5, 0.1, 1.0), (x, -1.23, 5.0), "ink")
        p.cone(1.9, 0.12, 4.6, (x, 0, 10.9), "dome_green", segments=8)
        p.cone(0.09, 0, 0.8, (x, 0, 13.6), "gold", segments=4)
    return _done("bld_museum", p)


def build_arch_bridge():
    clear_scene()
    p = Part("bld_arch_bridge")
    p.box((3.8, 6.4, 0.2), (0, 0, 0.1), "stone")
    for i in range(6):
        y = -2.67 + i * 1.07
        p.box((3.5, 1.03, 0.1), (0, y, 0.22), "cobble_light" if i % 2 == 0 else "cobble_dark")
    for x in (-1.9, 1.9):
        p.box((0.3, 6.4, 0.7), (x, 0, 0.55), "stone")
        for y in (-3.2, 3.2):
            p.box((0.6, 0.6, 1.3), (x, y, 0.65), "brick_light")
            p.box((0.7, 0.7, 0.12), (x, y, 1.35), "stone")
            p.box((0.3, 0.3, 0.4), (x, y, 1.6), "candle")
            p.box((0.4, 0.4, 0.08), (x, y, 1.84), "gold")
    return _done("bld_arch_bridge", p)


def build_garden_gate():
    clear_scene()
    p = Part("bld_garden_gate")
    for x in (-2.1, 2.1):
        p.box((1.1, 1.1, 0.5), (x, 0, 0.25), "stone")
        p.box((0.9, 0.9, 3.6), (x, 0, 2.3), "brick_light")
        _seams(p, (0.94, 0.94), (1.2, 2.0, 2.8, 3.6))
        p.box((1.2, 1.2, 0.3), (x, 0, 4.25), "stone")
        for dx in (-0.4, 0.4):
            for dy in (-0.4, 0.4):
                p.box((0.35, 0.35, 0.5), (x + dx, dy, 4.65), "brick_light")
        p.cone(0.5, 0.06, 1.2, (x, 0, 5.0), "dome_green", segments=8)
        p.cone(0, 0.16, 0.25, (x, 0, 5.72), "ruby", segments=4)
        p.cone(0.16, 0, 0.3, (x, 0, 5.95), "ruby", segments=4)
    p.box((3.4, 0.8, 0.7), (0, 0, 3.4), "brick_light")
    p.box((1.2, 0.06, 0.4), (0, -0.43, 3.4), "gold")
    for i in range(7):
        p.box((0.06, 0.06, 0.6), (-1.5 + i * 0.5, 0, 2.85), "ink")
    return _done("bld_garden_gate", p)


def build_lamppost():
    clear_scene()
    p = Part("prop_lamppost")
    p.box((0.5, 0.5, 0.5), (0, 0, 0.25), "stone")
    p.cone(0.14, 0.08, 3.2, (0, 0, 2.1), "ink", segments=6)
    p.box((0.3, 0.3, 0.1), (0, 0, 1.0), "gold")
    p.box((1.4, 0.08, 0.08), (0, 0, 3.55), "ink")
    for x in (-0.65, 0.65):
        p.box((0.3, 0.3, 0.45), (x, 0, 3.35), "candle")
        p.box((0.4, 0.4, 0.08), (x, 0, 3.62), "gold")
    p.cone(0.08, 0, 0.35, (0, 0, 3.85), "gold", segments=4)
    return _done("prop_lamppost", p)


def build_fir_tub():
    clear_scene()
    p = Part("prop_fir_tub")
    p.cone(0.55, 0.5, 0.6, (0, 0, 0.3), "wood", segments=8)
    for z in (0.15, 0.48):
        p.cone(0.58, 0.55, 0.07, (0, 0, z), "wood_dark", segments=8, caps=False)
    for r, h, z0 in ((0.95, 1.1, 0.6), (0.75, 1.0, 1.3), (0.5, 0.9, 1.95)):
        p.cone(r, 0, h, (0, 0, z0 + h / 2), "spruce_dark", segments=8)
        p.cone(r * 1.04, r * 0.86, h * 0.16, (0, 0, z0 + h * 0.08), "spruce", segments=8)
    for a, r, z in ((0, 0.8, 0.9), (2.1, 0.75, 1.1), (4.2, 0.7, 1.2), (1.0, 0.55, 1.7), (3.1, 0.5, 1.8), (5.2, 0.4, 2.2)):
        p.box((0.09, 0.09, 0.09), (r * math.cos(a) * 0.9, r * math.sin(a) * 0.9, z), "candle")
    p.box((0.18, 0.18, 0.18), (0, 0, 2.9), "gold")
    return _done("prop_fir_tub", p)


def build_all_redsquare():
    fns = [
        build_basil, build_kremlin_wall, build_kremlin_tower, build_museum,
        build_arch_bridge, build_garden_gate, build_lamppost, build_fir_tub,
    ]
    return [fn() for fn in fns]
