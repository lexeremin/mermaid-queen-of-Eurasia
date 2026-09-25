"""GUM (Phase 8): detailed facade, turrets, gallery wall, roof ribs, bridge, fountain, kiosk, bench.

Exec after lib.py and build_redsquare_assets.py in the same namespace (uses _done, _seams, _onion).
    ns["build_all_gum"]()
Facade modules run along X, 5 m deep (Y), front at -Y. The bridge runs along Y.
"""

import math


def build_gum_facade():
    clear_scene()
    p = Part("bld_gum_facade", auto_bevel=False)  # 2 088 of 2 200 triangles already: chamfers would break the budget
    length, depth, gap = 18.0, 5.0, 4.6
    wing = (length - gap) / 2
    for sx in (-1, 1):
        cx = sx * (gap / 2 + wing / 2)
        p.box((wing + 0.2, depth + 0.3, 0.7), (cx, 0, 0.35), "slate")
        p.box((wing, depth, 8.6), (cx, 0, 5.0), "stone")
        p.box((wing + 0.2, depth + 0.4, 0.5), (cx, 0, 9.55), "brick_light")
        p.box((wing, depth, 0.3), (cx, 0, 9.95), "brick_dark")
        for k in (-1, 0, 1):
            x = cx + k * 2.1
            p.box((1.5, 0.12, 3.2), (x, -2.55, 2.6), "brick_dark")
            p.box((1.2, 0.14, 2.9), (x, -2.58, 2.6), "candle")
            p.box((1.6, 0.16, 0.3), (x, -2.56, 4.35), "brick_light")
            p.box((1.0, 0.12, 1.8), (x, -2.55, 6.1), "brick_dark")
            p.box((0.78, 0.14, 1.55), (x, -2.58, 6.1), "candle" if k != 0 else "frost")
            p.box((1.2, 0.14, 0.2), (x, -2.56, 7.15), "stone")
            p.box((0.8, 0.12, 1.2), (x, -2.55, 8.3), "brick_dark")
            p.box((0.6, 0.14, 1.0), (x, -2.58, 8.3), "frost")
        for k in (-1.5, -0.5, 0.5, 1.5):
            p.box((0.36, 0.28, 8.6), (cx + k * 2.1, -2.55, 5.0), "blush")
        for i in range(10):
            p.box((0.14, 0.14, 0.14), (cx - 2.7 + i * 0.6, -2.7, 4.85), "candle")
        for z in (2.5, 5.0, 7.6):
            p.box((wing + 0.04, depth + 0.04, 0.06), (cx, 0, z), "brick_dark")
        for k in (-1, 0, 1):
            p.box((1.4, 0.12, 3.0), (cx + k * 2.1, 2.55, 2.6), "brick_dark")
            p.box((1.1, 0.14, 2.7), (cx + k * 2.1, 2.58, 2.6), "candle")
        p.box((1.2, depth + 0.3, 9.6), (sx * (gap / 2 + 0.6), 0, 5.4), "brick_light")
        p.box((1.4, depth + 0.4, 0.4), (sx * (gap / 2 + 0.6), 0, 10.3), "stone")
    # Round arched portal: solid tympanum with a stone trim ring and keystone on both faces, and warm lanterns.
    arch_opening(p, gap / 2, 5.4, 8.0, -depth / 2, depth / 2, "brick_light", "stone", -depth / 2 - 0.05, segments=14)
    arch_opening(p, gap / 2, 5.4, 8.0, -depth / 2, depth / 2, "brick_light", "stone", depth / 2 + 0.05, segments=14)
    for sx in (-1, 1):
        for yy in (-1.9, 1.9):
            p.box((0.16, 0.3, 0.16), (sx * (gap / 2 - 0.1), yy, 3.85), "ink")
            p.box((0.26, 0.34, 0.5), (sx * (gap / 2 - 0.22), yy, 3.45), "candle")
            p.box((0.32, 0.4, 0.1), (sx * (gap / 2 - 0.22), yy, 3.75), "gold")
    p.box((gap + 2.4, depth + 0.3, 1.4), (0, 0, 8.7), "stone")
    p.box((gap + 2.6, depth + 0.4, 0.4), (0, 0, 9.6), "brick_light")
    p.prism_xz([(-3.6, 10.0), (3.6, 10.0), (0, 12.4)], -2.7, -2.3, "stone")
    p.box((1.2, 0.1, 1.2), (0, -2.75, 10.8), "candle")
    p.box((0.08, 0.14, 0.45), (0, -2.78, 10.95), "ink")
    p.box((0.4, 0.14, 0.08), (0, -2.78, 10.8), "ink")
    p.box((1.6, 0.14, 0.9), (0, -2.6, 8.7), "brick_dark")
    p.box((1.2, 0.16, 0.6), (0, -2.63, 8.7), "candle")
    for sx in (-1, 1):
        x = sx * 4.2
        p.box((1.5, 1.5, 2.2), (x, 0, 11.0), "stone")
        p.cone(1.4, 0.1, 2.6, (x, 0, 13.4), "dome_green", segments=8)
        p.cone(0.08, 0, 0.6, (x, 0, 15.0), "gold", segments=4)
    return _done("bld_gum_facade", p)


def build_gum_turret():
    clear_scene()
    p = Part("bld_gum_turret")
    p.box((3.4, 3.4, 0.6), (0, 0, 0.3), "slate")
    p.box((3.0, 3.0, 10.0), (0, 0, 5.6), "stone")
    _seams(p, (3.04, 3.04), (2.5, 5.0, 7.5), "brick_dark")
    for k in (-0.7, 0.7):
        p.box((0.9, 0.12, 2.4), (k, -1.55, 3.2), "brick_dark")
        p.box((0.7, 0.14, 2.2), (k, -1.58, 3.2), "candle")
        p.box((0.7, 0.12, 1.4), (k, -1.55, 7.0), "brick_dark")
        p.box((0.5, 0.14, 1.2), (k, -1.58, 7.0), "frost")
    p.box((3.4, 3.4, 0.5), (0, 0, 10.85), "brick_light")
    p.box((2.4, 2.4, 1.6), (0, 0, 11.9), "stone")
    p.cone(2.1, 0.12, 4.0, (0, 0, 14.7), "dome_green", segments=8)
    p.cone(0, 0.24, 0.4, (0, 0, 16.9), "ruby", segments=4)
    p.cone(0.24, 0, 0.45, (0, 0, 17.3), "ruby", segments=4)
    return _done("bld_gum_turret", p)


def build_gum_wall():
    clear_scene()
    p = Part("bld_gum_wall")
    p.box((18, 1.6, 9.4), (0, 0, 4.7), "stone")
    p.box((18.2, 1.7, 0.5), (0, 0, 9.65), "brick_light")
    awnings = ("rose", "teal", "amber")
    for k in range(3):
        x = -6 + k * 6
        p.box((4.6, 0.12, 3.3), (x, -0.85, 1.9), "brick_dark")
        p.box((4.3, 0.14, 3.0), (x, -0.88, 1.9), "candle")
        p.box((4.8, 1.0, 0.16), (x, -1.25, 3.7), awnings[k], rot=(0.35, 0, 0))
        p.box((2.4, 0.1, 0.5), (x, -0.9, 4.3), "gold")
        for j in (-1, 0, 1):
            p.box((1.0, 0.12, 1.6), (x + j * 1.5, -0.85, 6.4), "brick_dark")
            p.box((0.8, 0.14, 1.4), (x + j * 1.5, -0.88, 6.4), "candle" if (k + j) % 2 == 0 else "frost")
        p.box((0.4, 0.3, 9.0), (x - 3.0, -0.85, 4.7), "blush")
    p.box((0.4, 0.3, 9.0), (9.0, -0.85, 4.7), "blush")
    for z in (4.9, 8.2):
        p.box((18.04, 1.64, 0.06), (0, 0, z), "brick_dark")
    return _done("bld_gum_wall", p)


def build_gum_ribs():
    clear_scene()
    p = Part("bld_gum_ribs")
    steps = 9
    half = 4.5
    points = []
    for i in range(steps + 1):
        y = -half + 2 * half * i / steps
        points.append((y, 9.2 + 2.3 * (1 - (y / half) ** 2)))
    for x in (-3.0, 0.0, 3.0):
        for (y0, z0), (y1, z1) in zip(points, points[1:]):
            mid = ((y0 + y1) / 2, (z0 + z1) / 2)
            ang = math.atan2(z1 - z0, y1 - y0)
            p.box((0.16, math.hypot(y1 - y0, z1 - z0) + 0.05, 0.16), (x, mid[0], mid[1]), "ink", rot=(ang, 0, 0))
    for y, z in points[1:-1:2]:
        p.box((6.2, 0.1, 0.1), (0, y, z), "ink")
    return _done("bld_gum_ribs", p)


def build_gum_bridge():
    clear_scene()
    p = Part("bld_gum_bridge")
    p.box((2.2, 9.0, 0.2), (0, 0, 6.0), "ink")
    for x in (-1.0, 1.0):
        p.box((0.1, 9.0, 0.12), (x, 0, 7.0), "ink")
        for y in (-4.0, -2.0, 0, 2.0, 4.0):
            p.box((0.08, 0.08, 1.0), (x, y, 6.55), "ink")
        for y in (-4.4, 4.4):
            p.box((0.16, 0.16, 0.16), (x, y, 7.15), "gold")
    for y in (-4.5, 4.5):
        p.box((2.4, 0.5, 0.5), (0, y, 5.8), "brick_dark")
    p.box((1.0, 5.0, 0.12), (0, 0, 5.7), "gold")
    return _done("bld_gum_bridge", p)


def build_fountain():
    clear_scene()
    p = Part("prop_fountain")
    p.cone(2.7, 2.5, 0.7, (0, 0, 0.35), "stone", segments=10)
    p.cone(2.3, 2.3, 0.05, (0, 0, 0.72), "aqua", segments=10)
    p.cone(0.55, 0.35, 1.6, (0, 0, 1.5), "stone", segments=8)
    p.cone(1.1, 0.6, 0.4, (0, 0, 2.4), "stone", segments=8)
    p.cone(0.95, 0.95, 0.05, (0, 0, 2.62), "aqua", segments=8)
    p.cone(0.16, 0, 0.7, (0, 0, 3.0), "aqua", segments=4)
    for k in range(8):
        a = k * math.pi / 4
        p.cone(0.09, 0, 0.5, (1.8 * math.cos(a), 1.8 * math.sin(a), 1.0), "pearl", segments=4)
    return _done("prop_fountain", p)


def build_kiosk():
    clear_scene()
    p = Part("prop_kiosk")
    p.box((1.9, 1.9, 0.9), (0, 0, 0.45), "wood_light")
    p.box((1.7, 1.7, 1.2), (0, 0, 1.5), "candle")
    for x, y in ((-0.85, -0.85), (0.85, -0.85), (-0.85, 0.85), (0.85, 0.85)):
        p.box((0.12, 0.12, 1.3), (x, y, 1.55), "wood_dark")
    p.cone(1.5, 0.1, 0.9, (0, 0, 2.6), "rose", segments=4, rot=(0, 0, math.pi / 4))
    p.box((1.0, 0.1, 0.3), (0, -0.95, 0.95), "gold")
    return _done("prop_kiosk", p)


def build_bench():
    clear_scene()
    p = Part("prop_bench")
    p.box((1.9, 0.5, 0.1), (0, 0, 0.5), "wood_light")
    p.box((1.9, 0.08, 0.5), (0, 0.24, 0.85), "wood")
    for x in (-0.8, 0.8):
        p.box((0.1, 0.5, 0.5), (x, 0, 0.25), "ink")
    return _done("prop_bench", p)


def build_all_gum():
    fns = [
        build_gum_facade, build_gum_turret, build_gum_wall, build_gum_ribs, build_gum_bridge,
        build_fountain, build_kiosk, build_bench,
    ]
    return [fn() for fn in fns]
