"""Phase 3 PoC assets: spruce tree and izba (wooden house). Rosa lives in build_hero.py.

Inside Blender (after exec-ing lib.py in the same namespace):
    exec(open(REPO + "/tools/blender/build_poc_assets.py").read())
    build_tree(); build_izba()
Each builder clears the scene, builds the asset, exports assets-src/<name>.glb and returns a report.
"""

import math


def _report(name, path, objects):
    return {"name": name, "path": path, "tris": triangle_count(objects), "objects": len(objects)}


def build_tree():
    clear_scene()
    p = Part("tree_spruce")
    p.cone(0.2, 0.14, 0.9, (0, 0, 0.45), "wood_dark", segments=6)
    tiers = [(1.15, 1.5, 0.6), (0.9, 1.4, 1.5), (0.6, 1.3, 2.4)]
    for i, (radius, height, z0) in enumerate(tiers):
        p.cone(radius, 0, height, (0, 0, z0 + height / 2), "spruce", segments=8)
        band = height * 0.16
        p.cone(radius * 1.06, radius * 0.89, band, (0, 0, z0 + band / 2), "snow", segments=8)
        if i == len(tiers) - 1:
            cap = height * 0.4
            p.cone(radius * 0.6, 0, cap, (0, 0, z0 + height - cap / 2 + 0.02), "snow", segments=8)
    obj = p.finish()
    return _report("tree_spruce", export_glb("tree_spruce.glb", [obj.name]), [obj])


def build_izba():
    clear_scene()
    p = Part("bld_izba")

    p.box((4.2, 3.4, 2.0), (0, 0, 1.0), "wood_dark")
    for row in range(5):
        z = 0.2 + 0.4 * row
        color = "wood" if row % 2 == 0 else "wood_light"
        if row % 2 == 0:
            for y in (-1.72, 1.72):
                p.box((4.8, 0.34, 0.38), (0, y, z), color)
        else:
            for x in (-2.12, 2.12):
                p.box((0.34, 4.0, 0.38), (x, 0, z), color)

    p.prism_yz([(-1.7, 2.0), (1.7, 2.0), (0, 3.7)], -2.0, 2.0, "wood_light")

    run, rise = 2.35, 2.0
    theta = math.atan2(rise, run)
    length = math.hypot(run, rise)
    strips = 4
    width = length / strips
    for side in (-1, 1):
        phi = theta if side < 0 else -theta
        direction = (0, -side * run / length, rise / length)
        normal = (0, -math.sin(phi), math.cos(phi))
        eave = (0, side * run, 1.93)
        center = tuple(e + d * length / 2 for e, d in zip(eave, direction))
        p.box((5.0, length, 0.16), center, "wood_dark", rot=(phi, 0, 0))
        for k in range(strips):
            s = (k + 0.5) * width
            offset = 0.1 if k < strips - 1 else 0.16
            pos = tuple(e + d * s + n * offset for e, d, n in zip(eave, direction, normal))
            color = ("wood_light", "wood", "wood_light", "snow")[k]
            p.box((4.9, width - 0.04, 0.06 if k < strips - 1 else 0.14), pos, color, rot=(phi, 0, 0))
    p.box((5.1, 0.3, 0.3), (0, 0, 3.98), "wood_dark", rot=(math.pi / 4, 0, 0))

    p.box((0.55, 0.55, 1.3), (1.3, 1.0, 3.1), "brick")
    p.box((0.72, 0.72, 0.14), (1.3, 1.0, 3.8), "snow")

    p.box((1.2, 0.06, 1.8), (-0.9, -1.93, 0.9), "teal_dark")
    p.box((0.95, 0.1, 1.6), (-0.9, -1.98, 0.8), "wood_dark")
    p.box((0.08, 0.06, 0.08), (-0.6, -2.06, 0.85), "gold")
    p.box((1.3, 0.5, 0.15), (-0.9, -2.2, 0.075), "wood_light")

    p.box((1.1, 0.08, 1.0), (1.0, -1.95, 1.2), "teal_dark")
    p.box((0.8, 0.1, 0.7), (1.0, -1.99, 1.2), "candle")
    p.box((0.8, 0.12, 0.06), (1.0, -2.01, 1.2), "wood_dark")
    p.box((0.06, 0.12, 0.7), (1.0, -2.01, 1.2), "wood_dark")
    p.box((1.5, 0.1, 0.14), (1.0, -1.97, 1.85), "aqua")
    p.box((1.4, 0.12, 0.1), (1.0, -2.0, 0.65), "aqua")
    for x in (0.3, 1.7):
        p.box((0.28, 0.09, 0.95), (x, -1.96, 1.2), "rose")

    p.box((2.0, 0.6, 0.2), (1.2, -2.05, 0.1), "snow")
    p.box((0.7, 1.6, 0.2), (-2.35, -0.5, 0.1), "snow")

    obj = p.finish()
    return _report("bld_izba", export_glb("bld_izba.glb", [obj.name]), [obj])
