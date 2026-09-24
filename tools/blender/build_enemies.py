"""Bureaucratic monsters (Phase 12): fictional, absurd, single static mesh each.

Exec after lib.py in the same namespace:  ns["build_all_enemies"]()
Front faces Blender -Y. None resembles a real person.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def build_wisp():
    """Paper Wisp: a swirl of forms with a stamped face, hovering."""
    clear_scene()
    p = Part("enemy_wisp")
    for i in range(7):
        a = i * 0.9
        z = 0.75 + i * 0.12
        r = 0.32 - i * 0.02
        p.box((0.5, 0.03, 0.62), (r * math.cos(a), r * math.sin(a), z), "paper" if i % 2 == 0 else "ivory", rot=(0.3 * (i % 3 - 1), 0.4, a))
    p.box((0.44, 0.34, 0.52), (0, 0, 1.0), "paper")
    for x in (-0.1, 0.1):
        p.box((0.09, 0.03, 0.12), (x, -0.185, 1.08), "ink")
    p.box((0.2, 0.03, 0.05), (0, -0.185, 0.92), "ink")
    p.box((0.18, 0.04, 0.1), (0.1, -0.19, 0.8), "ruby")
    p.box((0.34, 0.05, 0.03), (0, -0.19, 1.22), "sick_green")
    p.cone(0.2, 0.02, 0.35, (0, 0, 0.42), "paper", segments=5, rot=(math.pi, 0, 0))
    return _done("enemy_wisp", p)


def build_stamper():
    """Stamp Golem: a stack of filing cabinets with a giant rubber stamp for a fist."""
    clear_scene()
    p = Part("enemy_stamper")
    p.box((1.3, 0.9, 0.5), (0, 0, 0.25), "slate_dark")
    p.box((1.2, 0.85, 1.2), (0, 0, 1.1), "slate")
    for z in (0.8, 1.2, 1.6):
        p.box((1.0, 0.05, 0.3), (0, -0.44, z), "slate_light")
        p.box((0.2, 0.06, 0.06), (0, -0.48, z), "gold")
    p.box((1.05, 0.8, 0.5), (0, 0, 1.95), "slate")
    p.box((0.85, 0.05, 0.28), (0, -0.4, 1.95), "sick_green")
    for x in (-0.22, 0.22):
        p.box((0.15, 0.04, 0.18), (x, -0.42, 1.98), "candle")
        p.box((0.06, 0.05, 0.06), (x, -0.44, 1.98), "ink")
    p.box((0.4, 0.35, 0.16), (0.72, -0.1, 1.3), "slate_dark")
    p.box((0.18, 0.18, 0.7), (0.72, -0.1, 0.8), "wood_dark")
    p.box((0.62, 0.62, 0.16), (0.72, -0.1, 0.35), "ruby")
    p.box((0.7, 0.7, 0.08), (0.72, -0.1, 0.22), "brick_dark")
    p.box((0.4, 0.35, 0.16), (-0.72, -0.1, 1.3), "slate_dark")
    p.box((0.16, 0.16, 0.7), (-0.72, -0.1, 0.9), "slate")
    p.box((0.5, 0.06, 0.4), (0, 0.46, 1.3), "paper", rot=(0.3, 0, 0))
    return _done("enemy_stamper", p)


def build_memo():
    """Memo Thrower: a tall clerk with a paper-airplane hat and a bag of memos."""
    clear_scene()
    p = Part("enemy_memo")
    for x in (-0.14, 0.14):
        p.box((0.16, 0.18, 0.6), (x, 0, 0.35), "ink")
        p.box((0.2, 0.3, 0.12), (x, -0.05, 0.08), "wood_dark")
    p.box((0.62, 0.36, 0.85), (0, 0, 1.05), "sick_green")
    p.box((0.66, 0.4, 0.14), (0, 0, 0.7), "wet_dark")
    p.box((0.16, 0.04, 0.55), (0, -0.19, 1.05), "paper")
    for x in (-1, 1):
        p.box((0.15, 0.17, 0.6), (x * 0.4, -0.05, 1.05), "sick_green")
        p.box((0.13, 0.13, 0.13), (x * 0.4, -0.12, 0.7), "skin_shadow")
    p.box((0.4, 0.06, 0.5), (0.5, -0.28, 0.9), "paper", rot=(0.2, 0, 0.4))
    p.box((0.3, 0.32, 0.34), (0, 0, 1.68), "skin_shadow")
    for x in (-0.08, 0.08):
        p.box((0.07, 0.03, 0.08), (x, -0.165, 1.72), "ink")
    p.box((0.16, 0.03, 0.04), (0, -0.165, 1.58), "ink")
    p.prism_yz([(-0.3, 1.85), (0.3, 1.85), (0, 2.5)], -0.03, 0.03, "paper")
    p.prism_yz([(-0.3, 1.85), (0.3, 1.85), (0.25, 2.1)], -0.28, -0.22, "ivory")
    p.prism_yz([(-0.3, 1.85), (0.3, 1.85), (0.25, 2.1)], 0.22, 0.28, "ivory")
    p.box((0.34, 0.3, 0.45), (-0.05, 0.3, 0.9), "wood_light")
    p.box((0.36, 0.05, 0.1), (-0.05, 0.3, 1.16), "paper")
    return _done("enemy_memo", p)


def build_all_enemies():
    return [build_wisp(), build_stamper(), build_memo()]
