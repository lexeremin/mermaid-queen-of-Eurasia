"""Satirical politician enemies (Phase 12b): original invented caricatures, one static mesh each.

Exec after lib.py in the same namespace:  ns["build_all_enemies"]()
Front faces Blender -Y. They are archetypes defined by props and costume; none resembles a real person.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def _face(p, z, y=-0.19, brow="hair_dark", angry=True, skin="skin"):
    for x in (-0.09, 0.09):
        p.box((0.08, 0.03, 0.06), (x, y, z), "ivory")
        p.box((0.04, 0.03, 0.04), (x, y - 0.005, z), "ink")
        p.box((0.12, 0.03, 0.03), (x, y, z + 0.09), brow, rot=(0, 0, (0.4 if x > 0 else -0.4) if angry else 0))
    p.box((0.05, 0.05, 0.07), (0, y - 0.01, z - 0.06), "skin_shadow")
    p.box((0.14, 0.03, 0.03), (0, y, z - 0.15), "wet_dark")


def build_speaker():
    """The Gavel Speaker: robed, powdered wig, slams an enormous gavel."""
    clear_scene()
    p = Part("enemy_speaker")
    for x in (-0.22, 0.22):
        p.box((0.3, 0.32, 0.4), (x, 0, 0.2), "ink")
    p.box((1.25, 0.9, 1.3), (0, 0, 1.0), "night")
    p.box((1.32, 0.96, 0.16), (0, 0, 0.42), "ruby")
    p.box((0.22, 0.05, 1.0), (0, -0.46, 1.1), "ruby")
    p.box((0.9, 0.06, 0.1), (0, -0.47, 1.55), "gold")
    for x in (-0.36, -0.18, 0, 0.18, 0.36):
        p.cone(0.06, 0.06, 0.05, (x, -0.49, 1.42 - abs(x) * 0.4), "gold", segments=5, rot=(math.pi / 2, 0, 0))
    p.box((1.0, 0.7, 0.4), (0, 0, 1.8), "night")
    p.box((0.5, 0.5, 0.5), (0, 0, 2.2), "skin")
    _face(p, 2.24, -0.255, brow="ivory")
    p.box((0.68, 0.62, 0.34), (0, 0.04, 2.55), "ivory")
    for x in (-0.36, 0.36):
        for z in (2.3, 2.12):
            p.box((0.16, 0.24, 0.16), (x, 0, z), "ivory")
    p.box((0.7, 0.14, 0.1), (0, 0.34, 2.3), "ivory")
    for sx in (-1, 1):
        p.box((0.28, 0.3, 0.75), (sx * 0.75, -0.05, 1.25), "night")
        p.box((0.24, 0.24, 0.14), (sx * 0.75, -0.05, 0.85), "skin")
    p.box((0.16, 0.16, 1.2), (0.85, -0.5, 1.7), "wood", rot=(-0.5, 0, 0))
    p.box((0.9, 0.5, 0.5), (0.85, -0.85, 2.35), "wood_dark", rot=(-0.5, 0, 0))
    p.box((0.96, 0.08, 0.56), (0.85, -0.85, 2.35), "gold", rot=(-0.5, 0, 0))
    return _done("enemy_speaker", p)


def build_tycoon():
    """The Golden-Pen Tycoon: top hat, monocle, gold waistcoat; lunges with a giant fountain pen."""
    clear_scene()
    p = Part("enemy_tycoon")
    for x in (-0.14, 0.14):
        p.box((0.18, 0.2, 0.8), (x, 0, 0.45), "ink")
        p.box((0.22, 0.34, 0.14), (x, -0.05, 0.07), "wood_dark")
    p.box((0.62, 0.36, 0.95), (0, 0, 1.3), "violet")
    p.box((0.4, 0.05, 0.8), (0, -0.19, 1.3), "gold")
    for z in (1.6, 1.35, 1.1):
        p.box((0.06, 0.03, 0.06), (0, -0.22, z), "ink")
    p.box((0.7, 0.4, 0.5), (0, 0.08, 0.8), "violet", rot=(0.15, 0, 0))
    p.box((0.34, 0.34, 0.16), (0.4, 0.05, 0.98), "leaf")
    p.box((0.4, 0.4, 0.06), (0.4, 0.05, 1.08), "gold")
    p.box((0.16, 0.16, 0.12), (0, 0, 1.86), "skin_shadow")
    p.box((0.36, 0.34, 0.36), (0, 0, 2.08), "skin")
    _face(p, 2.1, -0.175, brow="hair_dark")
    p.cone(0.09, 0.09, 0.03, (0.09, -0.19, 2.1), "gold", segments=8, rot=(math.pi / 2, 0, 0))
    p.box((0.5, 0.5, 0.05), (0, 0, 2.27), "night")
    p.box((0.36, 0.36, 0.42), (0, 0, 2.5), "night")
    p.box((0.38, 0.38, 0.08), (0, 0, 2.36), "gold")
    for sx in (-1, 1):
        p.box((0.15, 0.17, 0.65), (sx * 0.4, -0.05, 1.35), "violet")
        p.box((0.13, 0.13, 0.13), (sx * 0.4, -0.08, 0.98), "skin")
    p.box((0.11, 1.5, 0.11), (0.4, -0.85, 1.05), "gold")
    p.box((0.2, 0.32, 0.2), (0.4, -0.2, 1.05), "gold_dark" if False else "wood_dark")
    p.cone(0.09, 0.0, 0.5, (0.4, -1.8, 1.05), "candle", segments=4, rot=(-math.pi / 2, 0, 0))
    p.box((0.05, 0.4, 0.05), (0.4, -1.55, 1.13), "ink")
    return _done("enemy_tycoon", p)


def build_demagogue():
    """The Megaphone Demagogue: on a soapbox, pointing, blasting a huge megaphone."""
    clear_scene()
    p = Part("enemy_demagogue")
    p.box((0.9, 0.7, 0.4), (0, 0, 0.2), "wood_light")
    for z in (0.1, 0.3):
        p.box((0.94, 0.74, 0.04), (0, 0, z), "wood_dark")
    p.box((0.44, 0.06, 0.36), (0, -0.36, 0.2), "paper")
    for x in (-0.14, 0.14):
        p.box((0.18, 0.2, 0.7), (x, 0, 0.75), "wet_dark")
        p.box((0.22, 0.32, 0.12), (x, -0.05, 0.46), "wood_dark")
    p.box((0.68, 0.38, 0.9), (0, 0, 1.4), "teal")
    p.box((0.72, 0.4, 0.1), (0, 0, 1.0), "amber")
    p.box((0.16, 0.05, 0.9), (0, -0.2, 1.4), "amber")
    p.box((0.1, 0.4, 0.9), (0.28, 0, 1.4), "gold", rot=(0, 0.5, 0.3))
    p.box((0.16, 0.16, 0.12), (0, 0, 1.94), "skin_shadow")
    p.box((0.38, 0.36, 0.38), (0, 0, 2.15), "skin")
    _face(p, 2.17, -0.185, brow="hair_brown")
    p.box((0.1, 0.04, 0.05), (0, -0.19, 2.03), "hair_brown")
    p.box((0.44, 0.4, 0.14), (0.02, 0.02, 2.42), "hair_brown")
    for x, z in ((-0.14, 2.52), (0.08, 2.56), (0.22, 2.5)):
        p.box((0.16, 0.16, 0.16), (x, 0, z), "hair_brown", rot=(0.4, 0.4, 0.5))
    p.box((0.16, 0.17, 0.6), (-0.42, -0.05, 1.5), "teal")
    p.box((0.13, 0.13, 0.13), (-0.42, -0.08, 1.16), "skin")
    p.box((0.16, 0.17, 0.5), (0.42, -0.25, 1.75), "teal", rot=(-0.9, 0, 0))
    p.box((0.13, 0.13, 0.13), (0.42, -0.5, 1.98), "skin")
    p.cone(0.09, 0.09, 0.22, (0.42, -0.62, 2.05), "ink", segments=6, rot=(math.pi / 2, 0, 0))
    p.cone(0.09, 0.42, 0.9, (0.42, -1.15, 2.05), "ivory", segments=8, rot=(math.pi / 2, 0, 0))
    p.cone(0.44, 0.44, 0.05, (0.42, -1.62, 2.05), "gold", segments=8, rot=(math.pi / 2, 0, 0), caps=False)
    return _done("enemy_demagogue", p)


def build_all_enemies():
    return [build_speaker(), build_tycoon(), build_demagogue()]
