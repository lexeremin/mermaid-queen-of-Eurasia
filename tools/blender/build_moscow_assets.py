"""Moscow landmarks beyond GUM (Phase 8): Kazan-style cathedral, Resurrection Gate, Kremlin interior skyline.

Exec after lib.py and build_redsquare_assets.py in the same namespace (uses _done, _seams, _onion).
    ns["build_all_moscow"]()
"""

import math


def build_kazan():
    clear_scene()
    p = Part("bld_kazan")
    p.box((7.4, 7.4, 0.5), (0, 0, 0.25), "stone")
    p.box((7.0, 7.0, 5.0), (0, 0, 3.0), "brick_light")
    _seams(p, (7.04, 7.04), (1.3, 2.3, 3.3, 4.3))
    p.box((7.3, 7.3, 0.4), (0, 0, 5.7), "stone")
    for x in (-2.0, 2.0):
        p.box((1.0, 0.1, 1.9), (x, -3.55, 2.6), "brick_dark")
        p.box((0.8, 0.12, 1.7), (x, -3.58, 2.6), "candle")
    p.box((1.6, 0.12, 2.4), (0, -3.55, 1.8), "ink")
    p.box((2.2, 0.16, 0.3), (0, -3.6, 3.2), "stone")
    p.cone(1.8, 1.7, 1.8, (0, 0, 6.8), "stone", segments=8)
    _onion(p, 0, 0, 7.7, 1.5, "dome_blue", "gold")
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((1.1, 1.1, 0.9), (sx * 3.0, sy * 3.0, 6.2), "stone")
            p.cone(0.7, 0.1, 1.1, (sx * 3.0, sy * 3.0, 7.2), "dome_green", segments=8)
    p.box((1.9, 1.9, 8.0), (-2.6, -2.6, 4.9), "brick_light")
    _seams(p, (1.94, 1.94), (2.2, 4.2, 6.2))
    p.box((2.1, 2.1, 0.3), (-2.6, -2.6, 9.0), "stone")
    p.cone(1.6, 0.1, 3.4, (-2.6, -2.6, 10.8), "dome_green", segments=8)
    p.cone(0.07, 0, 0.7, (-2.6, -2.6, 12.9), "gold", segments=4)
    return _done("bld_kazan", p)


def build_resurrection_gate():
    clear_scene()
    p = Part("bld_resurrection_gate")
    for sx in (-1, 1):
        x = sx * 3.5
        p.box((2.9, 2.9, 0.5), (x, 0, 0.25), "stone")
        p.box((2.6, 2.6, 8.0), (x, 0, 4.5), "brick_light")
        _seams(p, (2.64, 2.64), (1.6, 2.8, 4.0, 5.2, 6.4, 7.6))
        p.box((0.7, 0.1, 1.5), (x, -1.33, 3.6), "ink")
        p.box((0.5, 0.1, 1.0), (x, -1.33, 6.2), "candle")
        p.box((2.9, 2.9, 0.4), (x, 0, 8.7), "stone")
        p.cone(2.1, 0.12, 4.6, (x, 0, 11.2), "dome_green", segments=8)
        p.cone(0.08, 0, 0.7, (x, 0, 13.85), "gold", segments=4)
        p.cone(0, 0.2, 0.3, (x, 0, 13.3), "ruby", segments=4)
    # Round arch under the gate block: stone trim ring, keystone and lanterns on both faces.
    arch_opening(p, 2.2, 2.4, 4.6, -1.3, 1.3, "brick_light", "stone", -1.38, segments=12)
    arch_opening(p, 2.2, 2.4, 4.6, -1.3, 1.3, "brick_light", "stone", 1.38, segments=12)
    for sx in (-1, 1):
        for yy in (-1.2, 1.2):
            p.box((0.16, 0.3, 0.16), (sx * 2.05, yy, 3.3), "ink")
            p.box((0.26, 0.34, 0.5), (sx * 1.92, yy, 2.9), "candle")
            p.box((0.32, 0.4, 0.1), (sx * 1.92, yy, 3.2), "gold")
    p.box((4.4, 2.6, 3.4), (0, 0, 6.3), "brick_light")
    p.box((4.4, 2.7, 0.4), (0, 0, 8.2), "stone")
    p.box((2.4, 0.12, 1.4), (0, -1.33, 6.6), "candle")
    p.box((1.0, 0.14, 0.7), (0, -1.36, 6.6), "ink")
    for x in (-1.4, 0, 1.4):
        p.cone(0.5, 0.05, 1.0, (x, 0, 9.0), "dome_red", segments=6)
    return _done("bld_resurrection_gate", p)


def _cathedral(p, x, y, r):
    p.box((5.0 * r, 4.4 * r, 4.4 * r), (x, y, 2.2 * r), "stone")
    _seams(p, (5.04 * r, 4.44 * r), (1.2 * r, 2.4 * r, 3.6 * r), "wet_stone")
    p.cone(1.25 * r, 1.15 * r, 1.7 * r, (x, y, 5.25 * r), "stone", segments=8)
    _onion(p, x, y, 6.1 * r, 1.05 * r, "gold", "gold")
    for dx, dy in ((-1.8, -1.5), (1.8, -1.5), (-1.8, 1.5), (1.8, 1.5)):
        p.cone(0.5 * r, 0.45 * r, 0.9 * r, (x + dx * r, y + dy * r, 4.9 * r), "stone", segments=6)
        _onion(p, x + dx * r, y + dy * r, 5.35 * r, 0.5 * r, "gold", "gold")


def build_kremlin_inside():
    clear_scene()
    p = Part("lmk_kremlin_inside")
    _cathedral(p, -5.5, 0, 1.0)
    _cathedral(p, 3.5, -2.0, 0.85)
    _cathedral(p, 3.0, 5.5, 0.7)
    p.cone(1.7, 1.3, 7.0, (-1.0, 8.0, 3.5), "stone", segments=8)
    p.cone(1.3, 1.0, 5.5, (-1.0, 8.0, 9.75), "stone", segments=8)
    p.cone(1.0, 0.8, 4.0, (-1.0, 8.0, 14.5), "stone", segments=8)
    for z in (7.0, 12.5):
        p.cone(1.5, 1.5, 0.15, (-1.0, 8.0, z), "brick_light", segments=8, caps=False)
    _onion(p, -1.0, 8.0, 16.5, 1.1, "gold", "gold")
    p.box((12.0, 3.6, 3.6), (-4.0, -8.5, 1.8), "straw")
    _seams(p, (12.04, 3.64), (1.0, 2.0, 3.0), "stone")
    p.box((12.4, 4.0, 0.2), (-4.0, -8.5, 3.7), "stone")
    p.prism_yz([(-10.4, 3.7), (-6.6, 3.7), (-8.5, 5.4)], -10.0, 2.0, "dome_green")
    for x in range(-9, 2, 2):
        p.box((0.8, 0.1, 1.5), (x, -10.32, 2.0), "candle")
    return _done("lmk_kremlin_inside", p)


def build_all_moscow():
    return [build_kazan(), build_resurrection_gate(), build_kremlin_inside()]
