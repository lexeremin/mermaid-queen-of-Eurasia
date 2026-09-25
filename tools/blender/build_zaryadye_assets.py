"""Phase 23: the district north of Red Square (Lobnoye Mesto, the monument, Zaryadye Park, the embankment) as small stylized landmarks.

Exec after lib.py in the same namespace:
    ns["build_all_zaryadye"]()
Front of buildings faces Blender -Y (glTF +Z, south in game). Everything is an original, simplified impression.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def _onion(p, x, y, z, r, main, band):
    """Onion dome sitting on z: neck, two-tone bulb, spire tip."""
    p.cone(r * 0.55, r * 0.55, r * 0.35, (x, y, z + r * 0.175), "ivory", segments=8)
    p.cone(r * 0.6, r, r * 0.55, (x, y, z + r * 0.35 + r * 0.275), band, segments=8)
    p.cone(r, r * 0.12, r * 1.15, (x, y, z + r * 0.9 + r * 0.575), main, segments=8)
    p.cone(r * 0.09, 0, r * 0.45, (x, y, z + r * 2.05 + r * 0.22), "gold", segments=4)


def build_monument():
    """Two heroes on a plinth: one standing with a raised sword, one kneeling with a bowl. Bronze-green figures."""
    clear_scene()
    p = Part("prop_monument")
    p.box((3.2, 3.2, 0.3), (0, 0, 0.15), "stone")
    p.box((2.4, 2.4, 0.3), (0, 0, 0.45), "cobble_light")
    p.box((1.8, 1.8, 1.4), (0, 0, 1.3), "stone")
    p.box((1.95, 1.95, 0.14), (0, 0, 2.07), "gold")
    p.box((1.0, 0.06, 0.6), (0, -0.92, 1.3), "gold")
    # The standing hero.
    p.cone(0.3, 0.17, 1.15, (0.35, 0, 2.7), "teal_dark", segments=8)
    p.box((0.26, 0.24, 0.26), (0.35, 0, 3.4), "teal")
    p.cone(0.19, 0.12, 0.16, (0.35, 0, 3.6), "teal_dark", segments=6)
    p.box((0.12, 0.12, 0.6), (0.6, -0.05, 3.2), "teal_dark", rot=(0, -0.55, 0))
    p.box((0.05, 0.05, 0.9), (0.85, -0.05, 3.8), "gold", rot=(0, -0.15, 0))
    # The kneeling hero, holding out a bowl.
    p.cone(0.3, 0.2, 0.7, (-0.4, 0.05, 2.45), "teal_dark", segments=8)
    p.box((0.3, 0.3, 0.14), (-0.4, 0.05, 2.75), "teal_dark")
    p.box((0.24, 0.22, 0.24), (-0.4, 0, 2.98), "teal")
    p.box((0.1, 0.4, 0.1), (-0.4, -0.35, 2.7), "teal_dark", rot=(0.5, 0, 0))
    p.cone(0.2, 0.12, 0.1, (-0.4, -0.55, 2.85), "gold", segments=6)
    return _done("prop_monument", p)


def build_lobnoe():
    """The round stone platform in front of Saint Basil's: two tiers and a low parapet with a gap toward the front."""
    clear_scene()
    p = Part("prop_lobnoe")
    p.cone(2.3, 2.1, 0.5, (0, 0, 0.25), "stone", segments=12)
    p.cone(2.0, 2.0, 0.06, (0, 0, 0.53), "cobble_light", segments=12)
    for k in range(9):
        a = math.tau * (k + 0.5) / 12 + math.pi / 2 + 0.26
        p.box((0.62, 0.22, 0.32), (1.75 * math.cos(a), 1.75 * math.sin(a), 0.72), "stone", rot=(0, 0, a + math.pi / 2), bevel=0)
    p.box((0.9, 0.05, 0.4), (0, 0.4, 0.75), "gold")
    return _done("prop_lobnoe", p)


def build_rail():
    """A 3 m section of the embankment railing along X: iron posts with gold caps and two rails."""
    clear_scene()
    p = Part("prop_rail")
    for x in (-1.4, -0.47, 0.47, 1.4):
        p.box((0.12, 0.12, 1.0), (x, 0, 0.5), "ink", bevel=0)
        p.box((0.17, 0.17, 0.07), (x, 0, 1.04), "gold", bevel=0)
    p.box((3.0, 0.09, 0.09), (0, 0, 0.92), "ink", bevel=0)
    p.box((3.0, 0.07, 0.07), (0, 0, 0.5), "slate_dark", bevel=0)
    p.box((3.0, 0.32, 0.12), (0, 0, 0.06), "stone", bevel=0)
    return _done("prop_rail", p)


def build_amphitheatre():
    """A stepped half-round amphitheatre (seating toward +Y) with a wooden stage and a stone backdrop in front (-Y)."""
    clear_scene()
    p = Part("bld_amphitheatre")
    p.box((7.0, 2.6, 0.3), (0, -2.4, 0.15), "wood_light")
    p.box((6.6, 0.16, 0.16), (0, -3.72, 0.38), "wood_dark", bevel=0)
    center_y = 0.2
    for row in range(6):
        radius = 2.6 + row * 0.95
        height = 0.32 + row * 0.24
        count = 5 + row * 2
        for k in range(count):
            a = math.radians(-78 + 156 * (k + 0.5) / count)
            x = radius * math.sin(a)
            y = center_y + radius * math.cos(a)
            width = 2 * radius * math.tan(math.radians(156 / count / 2)) * 1.06
            p.box((width, 0.95, height), (x, y, height / 2), "cobble_light" if row % 2 else "stone", rot=(0, 0, -a), bevel=0)
    p.box((10.5, 0.4, 1.4), (0, 8.4, 0.7), "stone")
    for x in (-4.4, 0, 4.4):
        p.cone(0.25, 0.25, 2.4, (x, 8.4, 1.4), "ivory", segments=8)
    return _done("bld_amphitheatre", p)


def build_chapel():
    """A small whitewashed chapel with a green onion dome, an apse, a bell gable and a red door (Varvarka style)."""
    clear_scene()
    p = Part("bld_chapel")
    p.box((3.4, 4.0, 0.3), (0, 0, 0.15), "stone")
    p.box((3.0, 3.6, 3.0), (0, 0, 1.8), "ivory")
    p.cone(1.5, 1.5, 3.0, (0, 2.3, 1.8), "ivory", segments=8)  # the apse
    p.box((3.2, 3.8, 0.22), (0, 0, 3.4), "brick_light")
    p.cone(1.5, 1.5, 1.0, (0, 0, 3.9), "ivory", segments=8)  # the drum
    _onion(p, 0, 0, 4.4, 0.95, "dome_green", "gold")
    # The bell gable over the porch, with an arched opening.
    p.box((2.4, 0.4, 1.3), (0, -2.15, 3.55), "ivory")
    p.box((0.7, 0.08, 0.7), (0, -2.38, 3.6), "ink")
    p.cone(0.5, 0.05, 0.8, (0, -2.15, 4.55), "dome_green", segments=4, rot=(0, 0, math.pi / 4))
    # Door, steps, windows.
    p.box((1.0, 0.1, 1.7), (0, -1.82, 1.15), "ruby")
    p.box((1.6, 0.8, 0.16), (0, -2.25, 0.38), "stone")
    p.box((2.0, 0.4, 0.1), (0, -1.9, 2.15), "gold")
    for x in (-1.1, 1.1):
        p.box((0.4, 0.1, 0.9), (x, -1.82, 1.9), "ink")
        p.box((0.1, 0.4, 0.9), (x * 1.365, 0.4, 1.9), "ink")
    return _done("bld_chapel", p)


def build_all_zaryadye():
    return [build_monument(), build_lobnoe(), build_rail(), build_amphitheatre(), build_chapel()]
