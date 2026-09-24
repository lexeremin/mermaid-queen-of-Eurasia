"""Manezhnaya Square and Alexander Garden (Phases 9 and 15): Kutafya-style tower, Manege-style hall, grotto, obelisk, hedge, pearl shrine.

Exec after lib.py and build_redsquare_assets.py in the same namespace (uses _done, _seams).
    ns["build_all_garden"]()
"""

import math


def build_kutafya():
    clear_scene()
    p = Part("bld_kutafya")
    p.cone(2.8, 2.7, 0.5, (0, 0, 0.25), "stone", segments=10)
    p.cone(2.6, 2.4, 5.5, (0, 0, 3.25), "ivory", segments=10)
    for z in (1.6, 3.2, 4.8):
        p.cone(2.62, 2.62, 0.08, (0, 0, z), "stone", segments=10, caps=False)
    p.box((1.6, 0.14, 2.8), (0, -2.55, 1.9), "ink")
    p.box((2.2, 0.16, 0.4), (0, -2.6, 3.4), "stone")
    for a in (-0.9, 0.9):
        p.box((0.16, 0.14, 1.0), (2.5 * math.sin(a), -2.4 * math.cos(a), 4.0), "ink", rot=(0, 0, a))
    p.cone(2.75, 2.75, 0.3, (0, 0, 6.15), "stone", segments=10)
    for k in range(10):
        a = k * 2 * math.pi / 10
        p.box((0.7, 0.55, 0.9), (2.4 * math.cos(a), 2.4 * math.sin(a), 6.75), "ivory", rot=(0, 0, a + math.pi / 2))
    p.cone(1.6, 1.4, 1.2, (0, 0, 6.6), "ivory", segments=8)
    p.cone(1.5, 0.1, 2.0, (0, 0, 8.2), "brick_dark", segments=8)
    p.cone(0.07, 0, 0.6, (0, 0, 9.5), "gold", segments=4)
    return _done("bld_kutafya", p)


def build_manege():
    clear_scene()
    p = Part("bld_manege")
    length, depth = 22.0, 8.0
    p.box((length + 0.4, depth + 0.4, 0.6), (0, 0, 0.3), "stone")
    p.box((length, depth, 6.6), (0, 0, 3.9), "straw")
    p.box((length + 0.4, depth + 0.4, 0.5), (0, 0, 7.45), "ivory")
    p.prism_yz([(-4.4, 7.7), (4.4, 7.7), (0, 9.4)], -length / 2 - 0.1, length / 2 + 0.1, "dome_green")
    for i in range(9):
        x = -9.0 + i * 2.25
        if abs(x) < 3.2:
            continue
        p.box((1.3, 0.12, 3.6), (x, -4.05, 3.4), "ivory")
        p.box((1.0, 0.14, 3.3), (x, -4.08, 3.4), "candle" if i % 2 == 0 else "frost")
        p.box((1.5, 0.16, 0.3), (x, -4.06, 5.3), "ivory")
    for x in range(-9, 10, 3):
        p.box((0.4, 0.3, 6.6), (x + 0.75, -4.1, 3.9), "ivory")
    for i in range(6):
        x = -2.75 + i * 1.1
        p.box((0.5, 0.5, 5.6), (x, -4.9, 3.4), "ivory")
    p.box((6.8, 1.6, 0.4), (0, -4.5, 6.4), "ivory")
    p.prism_xz([(-3.6, 6.6), (3.6, 6.6), (0, 8.2)], -5.5, -3.9, "ivory")
    p.box((1.2, 0.1, 1.0), (0, -5.55, 7.1), "candle")
    p.box((2.4, 0.14, 3.6), (0, -4.05, 2.6), "ink")
    return _done("bld_manege", p)


def build_grotto():
    clear_scene()
    p = Part("bld_grotto")
    p.box((12.4, 3.4, 0.6), (0, 0, 0.3), "wet_dark")
    p.box((12, 1.2, 5.2), (0, 1.0, 3.2), "wet_stone")
    for i in range(3):
        x = -4.0 + i * 4.0
        p.box((2.6, 0.2, 3.4), (x, 0.35, 2.3), "ink")
        p.cone(1.3, 1.3, 0.3, (x, 0.35, 4.2), "wet_stone", segments=6, rot=(math.pi / 2, 0, 0))
    for x in (-6.0, -2.0, 2.0, 6.0):
        p.box((1.2, 1.2, 4.6), (x, -0.9, 2.9), "cobble_dark")
        p.box((1.5, 1.5, 0.3), (x, -0.9, 5.3), "wet_stone")
    for i in range(3):
        x = -4.0 + i * 4.0
        p.box((2.8, 1.1, 0.5), (x, -0.9, 5.2), "cobble_dark")
    p.box((12.4, 1.8, 0.4), (0, -0.4, 5.75), "wet_stone")
    for i in range(12):
        p.box((0.5, 0.5, 0.6), (-5.5 + i, -1.15, 6.2), "cobble_dark")
    for x, y, z, s in ((-5.6, 1.2, 5.6, 0.7), (1.0, 1.4, 5.7, 0.6), (5.2, 1.2, 5.6, 0.8), (-2.4, -1.2, 0.7, 0.5)):
        p.box((s, s, s * 0.6), (x, y, z), "moss", rot=(0, 0, 0.5))
    return _done("bld_grotto", p)


def build_obelisk():
    clear_scene()
    p = Part("prop_obelisk")
    p.box((2.6, 2.6, 0.3), (0, 0, 0.15), "stone")
    p.box((2.0, 2.0, 0.4), (0, 0, 0.5), "cobble_light")
    p.box((1.3, 1.3, 1.3), (0, 0, 1.35), "brick_light")
    p.box((0.7, 0.08, 0.6), (0, -0.68, 1.4), "gold")
    p.box((1.5, 1.5, 0.2), (0, 0, 2.1), "stone")
    p.cone(0.55, 0.3, 5.6, (0, 0, 5.0), "stone", segments=4, rot=(0, 0, math.pi / 4))
    p.cone(0.3, 0, 0.7, (0, 0, 8.15), "gold", segments=4, rot=(0, 0, math.pi / 4))
    return _done("prop_obelisk", p)


def build_hedge():
    clear_scene()
    p = Part("prop_hedge")
    p.box((2.0, 0.7, 0.8), (0, 0, 0.4), "leaf_dark")
    p.box((1.9, 0.6, 0.18), (0, 0, 0.88), "leaf")
    return _done("prop_hedge", p)


def build_shrine():
    """The hidden Pearl Shrine (Phase 15): stone circle, two pillars with a rose arch, a scallop-shell altar holding a
    glowing pearl. Front faces -Y (game +Z). Fits a circle of radius about 2 m."""
    clear_scene()
    p = Part("bld_shrine")
    p.cone(2.0, 1.9, 0.25, (0, 0, 0.125), "stone", segments=12)
    p.cone(1.6, 1.5, 0.22, (0, 0, 0.36), "cobble_light", segments=12)
    p.box((1.4, 0.5, 0.14), (0, -1.75, 0.07), "stone")
    p.box((1.0, 0.4, 0.14), (0, -1.55, 0.2), "cobble_light")
    for x in (-1.15, 1.15):
        p.box((0.6, 0.6, 0.2), (x, 0.3, 0.55), "stone")
        p.cone(0.24, 0.2, 2.5, (x, 0.3, 1.9), "ivory", segments=8)
        p.box((0.5, 0.5, 0.16), (x, 0.3, 3.2), "stone")
        for z, c in ((0.9, "rose"), (1.5, "leaf"), (2.1, "rose"), (2.7, "leaf")):
            p.box((0.14, 0.14, 0.14), (x + (0.2 if x < 0 else -0.2), 0.05, z), c)
    p.box((3.0, 0.5, 0.3), (0, 0.3, 3.45), "ivory")
    p.box((0.5, 0.55, 0.42), (0, 0.3, 3.8), "stone")
    p.cone(0.3, 0.02, 0.5, (0, 0.3, 4.25), "gold", segments=4)
    for x, c in ((-0.9, "rose"), (-0.55, "blush"), (0.55, "blush"), (0.9, "rose"), (-0.2, "leaf"), (0.25, "leaf")):
        p.box((0.2, 0.18, 0.22), (x, 0.05, 3.15 + 0.05 * math.sin(x * 9)), c)
    p.cone(0.6, 0.42, 0.9, (0, 0.3, 0.85), "stone", segments=8)
    p.cone(0.7, 0.5, 0.12, (0, 0.3, 1.36), "cobble_light", segments=8)
    p.cone(0.62, 0.14, 0.5, (0, 0.3, 1.66), "blush", segments=7)
    for k in range(7):
        a = (k - 3) * 0.42
        p.box((0.07, 0.5, 0.05), (0.5 * math.sin(a), 0.3 - 0.42 * math.cos(a) * 0.55, 1.62), "pearl", rot=(-0.5, 0, a))
    p.cone(0.3, 0.02, 0.3, (0, 0.3, 2.1), "pearl", segments=8)
    p.cone(0.02, 0.3, 0.3, (0, 0.3, 1.8), "pearl", segments=8)
    for dx, dz in ((0.42, 2.2), (-0.4, 1.95), (0.1, 2.5)):
        p.box((0.06, 0.06, 0.06), (dx, 0.3, dz), "gold", rot=(0.4, 0.4, 0.4))
    return _done("bld_shrine", p)


def build_all_garden():
    return [build_kutafya(), build_manege(), build_grotto(), build_obelisk(), build_hedge(), build_shrine()]
