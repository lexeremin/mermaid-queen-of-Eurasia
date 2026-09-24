"""Eight fictional gloomy Russian men (Phase 10). One static mesh each (single draw call).

Exec after lib.py in the same namespace:
    ns["build_all_npcs"]()
Front faces Blender -Y. All characters are original archetypes; none depicts a real person.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def _man(p, coat, trousers, skin="skin", hair="hair_dark", boots="wood_dark", sleeve=None, belly=0.0, frown=True):
    for x in (-0.13, 0.13):
        p.box((0.2, 0.22, 0.75), (x, 0, 0.5), trousers)
        p.box((0.22, 0.32, 0.22), (x, -0.05, 0.12), boots)
    p.box((0.62 + belly, 0.36 + belly, 0.75), (0, 0, 1.15), coat)
    p.box((0.66 + belly, 0.4 + belly, 0.3), (0, 0, 0.85), coat)
    for x in (-1, 1):
        ax = x * (0.4 + belly / 2)
        p.box((0.17, 0.19, 0.62), (ax, -0.02, 1.1), sleeve or coat)
        p.box((0.13, 0.13, 0.13), (ax, -0.04, 0.76), skin)
    p.box((0.14, 0.14, 0.1), (0, 0, 1.58), "skin_shadow")
    p.box((0.3, 0.3, 0.32), (0, 0, 1.75), skin)
    for x in (-0.08, 0.08):
        p.box((0.05, 0.03, 0.04), (x, -0.155, 1.78), "ink")
        p.box((0.08, 0.03, 0.02), (x, -0.156, 1.84), hair, rot=(0, 0, 0.25 if x > 0 else -0.25))
    p.box((0.04, 0.04, 0.05), (0, -0.16, 1.72), "skin_shadow")
    if frown:
        p.box((0.09, 0.03, 0.02), (0, -0.157, 1.65), "skin_shadow")
        p.box((0.03, 0.03, 0.02), (-0.06, -0.157, 1.64), "skin_shadow")
        p.box((0.03, 0.03, 0.02), (0.06, -0.157, 1.64), "skin_shadow")
    p.box((0.32, 0.3, 0.1), (0, 0.02, 1.95), hair)


def build_grisha():
    clear_scene()
    p = Part("npc_grisha")
    _man(p, "spruce_dark", "moss", hair="hair_brown")
    p.box((0.7, 0.4, 0.08), (0, 0, 0.98), "wood_dark")
    p.box((0.1, 0.05, 0.1), (0, -0.2, 0.98), "gold")
    p.box((0.42, 0.4, 0.2), (0, 0.0, 2.0), "bark")
    p.box((0.46, 0.44, 0.08), (0, 0, 1.92), "ivory")
    for x in (-1, 1):
        p.box((0.1, 0.22, 0.3), (x * 0.23, 0.0, 1.85), "bark")
    p.box((0.06, 0.06, 0.55), (0.42, -0.12, 0.85), "ink")
    return _done("npc_grisha", p)


def build_tolik():
    clear_scene()
    p = Part("npc_tolik")
    _man(p, "night", "wet_dark", hair="hair_dark")
    p.box((0.7, 0.16, 0.1), (0, -0.18, 1.45), "brick")
    p.box((0.4, 0.36, 0.1), (0, 0, 2.0), "wet_dark")
    p.box((0.34, 0.06, 0.06), (0, -0.2, 1.93), "wet_dark")
    for i in range(6):
        p.box((0.62 - 0.02 * (i % 2), 0.05, 0.08), (0, -0.46 - i * 0.055, 1.02), "ivory" if i % 2 else "brick")
    p.box((0.7, 0.14, 0.34), (0, -0.78, 1.02), "ink")
    p.box((0.7, 0.14, 0.34), (0, -0.2, 1.02), "ink")
    for x in (-0.22, -0.11, 0, 0.11, 0.22):
        p.box((0.06, 0.05, 0.1), (x, -0.8, 1.05), "ivory")
    return _done("npc_tolik", p)


def build_lyoha():
    clear_scene()
    p = Part("npc_lyoha")
    _man(p, "dome_blue", "night", hair="hair_brown")
    p.box((0.4, 0.34, 0.1), (0, 0.0, 2.0), "stone")
    p.box((0.34, 0.14, 0.05), (0, -0.2, 1.95), "stone")
    p.box((0.55, 0.55, 0.06), (0, -0.5, 1.0), "wood_light", rot=(-0.35, 0, 0))
    for i in range(4):
        for j in range(4):
            if (i + j) % 2 == 0:
                p.box((0.11, 0.11, 0.02), (-0.2 + i * 0.13, -0.5 + j * 0.12 * 0.94, 1.03 + j * 0.02), "ink", rot=(-0.35, 0, 0))
    for x, y in ((-0.1, -0.5), (0.1, -0.56), (0.02, -0.44)):
        p.box((0.08, 0.08, 0.16), (x, y, 1.13), "ivory")
    return _done("npc_lyoha", p)


def build_mikhalych():
    """Prince Sasha (id `mikhalych`): a handsome young prince who sells kefir. Slim, blue tailcoat, red sash, crown, cape."""
    clear_scene()
    p = Part("npc_mikhalych")
    for x in (-0.12, 0.12):
        p.box((0.2, 0.22, 0.5), (x, 0, 0.62), "ivory")
        p.box((0.23, 0.26, 0.42), (x, -0.01, 0.21), "ink")
        p.box((0.25, 0.28, 0.06), (x, -0.01, 0.44), "gold")
        p.box((0.23, 0.12, 0.1), (x, -0.1, 0.05), "ink")
    p.box((0.5, 0.3, 0.3), (0, 0, 0.98), "dome_blue")
    p.box((0.66, 0.34, 0.5), (0, 0, 1.32), "dome_blue")
    p.box((0.52, 0.32, 0.06), (0, 0, 0.86), "wood_dark")
    p.box((0.1, 0.03, 0.07), (0, -0.17, 0.86), "gold")
    p.box((0.42, 0.1, 0.55), (0, 0.19, 0.62), "dome_blue")
    p.box((0.2, 0.04, 0.42), (0, -0.175, 1.3), "ivory")
    p.box((0.16, 0.06, 0.12), (0, -0.19, 1.52), "ivory")
    p.box((0.1, 0.03, 0.8), (-0.02, -0.185, 1.26), "ruby", rot=(0, -0.5, 0))
    for z in (1.12, 1.26, 1.4):
        p.box((0.05, 0.03, 0.05), (0.13, -0.18, z), "gold")
    for x in (-1, 1):
        ax = x * 0.42
        p.box((0.16, 0.18, 0.55), (ax, -0.02, 1.25), "dome_blue")
        p.box((0.18, 0.2, 0.07), (ax, -0.02, 0.98), "ivory")
        p.box((0.13, 0.13, 0.13), (ax, -0.03, 0.88), "skin")
        p.box((0.22, 0.22, 0.06), (ax, -0.02, 1.56), "gold")
    p.box((0.62, 0.08, 0.95), (0, 0.24, 1.15), "ruby")
    p.box((0.72, 0.1, 0.12), (0, 0.22, 1.62), "ivory")
    p.box((0.12, 0.12, 0.1), (0, 0, 1.6), "skin")
    p.box((0.3, 0.29, 0.34), (0, 0, 1.78), "skin")
    p.box((0.26, 0.05, 0.08), (0, -0.14, 1.65), "skin_shadow")
    for x in (-0.075, 0.075):
        p.box((0.075, 0.03, 0.06), (x, -0.148, 1.8), "ivory")
        p.box((0.04, 0.03, 0.05), (x, -0.153, 1.8), "aqua")
        p.box((0.02, 0.03, 0.03), (x, -0.157, 1.8), "ink")
        p.box((0.09, 0.03, 0.025), (x, -0.15, 1.88), "hair_brown", rot=(0, 0.18 if x > 0 else -0.18, 0))
        p.box((0.06, 0.03, 0.05), (x * 1.55, -0.15, 1.71), "blush")
    p.box((0.04, 0.05, 0.08), (0, -0.16, 1.75), "skin_shadow")
    p.box((0.1, 0.03, 0.025), (0, -0.152, 1.66), "brick_light")
    for x in (-0.06, 0.06):
        p.box((0.03, 0.03, 0.025), (x, -0.152, 1.675), "brick_light")
    p.box((0.34, 0.33, 0.12), (0, 0.02, 1.98), "straw")
    p.box((0.3, 0.14, 0.12), (0.03, -0.13, 1.99), "straw", rot=(0, 0.2, 0))
    p.box((0.1, 0.12, 0.1), (0.12, -0.17, 2.03), "straw", rot=(0, 0.35, 0))
    for x in (-1, 1):
        p.box((0.05, 0.1, 0.24), (x * 0.17, 0.0, 1.8), "straw")
    p.box((0.34, 0.14, 0.3), (0, 0.13, 1.85), "straw")
    p.box((0.37, 0.36, 0.05), (0, 0.0, 2.07), "gold")
    for x in (-0.14, -0.07, 0, 0.07, 0.14):
        p.box((0.04, 0.04, 0.07 if x == 0 else 0.05), (x, -0.17, 2.12), "gold")
    p.box((0.05, 0.03, 0.06), (0, -0.19, 2.08), "ruby")
    p.box((0.15, 0.15, 0.32), (0.5, -0.06, 0.92), "ivory")
    p.box((0.1, 0.1, 0.08), (0.5, -0.06, 1.12), "aqua")
    p.box((0.16, 0.16, 0.1), (0.5, -0.06, 0.88), "dome_blue")
    p.box((0.55, 0.36, 0.26), (-0.65, -0.32, 0.13), "wood")
    for x in (-0.82, -0.65, -0.48):
        p.box((0.11, 0.11, 0.24), (x, -0.32, 0.38), "ivory")
        p.box((0.08, 0.08, 0.06), (x, -0.32, 0.53), "aqua")
    return _done("npc_mikhalych", p)


def build_boris():
    clear_scene()
    p = Part("npc_boris")
    _man(p, "slate", "slate_dark", hair="hair_dark", boots="ink")
    p.box((0.16, 0.04, 0.5), (0, -0.19, 1.15), "ivory")
    p.box((0.07, 0.05, 0.4), (0, -0.2, 1.1), "flower_red")
    for x in (-0.09, 0.09):
        p.box((0.11, 0.03, 0.09), (x, -0.16, 1.78), "ink")
    p.box((0.2, 0.03, 0.02), (0, -0.16, 1.78), "ink")
    p.box((0.3, 0.02, 0.04), (0, -0.14, 1.94), "hair_dark")
    for i, off in enumerate((0, 0.09, 0.18, 0.26)):
        p.box((0.42, 0.32, 0.07), (0, -0.42 - 0.01 * i, 0.92 + off), "paper", rot=(0, 0.06 * (i % 2), 0))
    p.box((0.09, 0.09, 0.08), (0.13, -0.42, 1.2), "ruby")
    return _done("npc_boris", p)


def build_sergei():
    clear_scene()
    p = Part("npc_sergei")
    _man(p, "teal", "wet_dark", hair="hair_brown")
    p.box((0.38, 0.34, 0.1), (0, 0.0, 2.0), "flower_yellow")
    p.box((0.34, 0.14, 0.05), (0, -0.2, 1.95), "flower_yellow")
    p.box((0.06, 0.06, 1.5), (0.45, -0.06, 1.5), "ink")
    p.cone(0.95, 0.05, 0.55, (0.45, -0.06, 2.5), "flower_red", segments=8)
    p.cone(0.98, 0.98, 0.05, (0.45, -0.06, 2.24), "flower_yellow", segments=8, caps=False)
    p.box((0.3, 0.1, 0.4), (-0.4, -0.24, 0.95), "paper")
    return _done("npc_sergei", p)


def build_arkady():
    clear_scene()
    p = Part("npc_arkady")
    _man(p, "violet", "ink", hair="hair_dark", sleeve="ivory")
    p.box((0.28, 0.04, 0.6), (0, -0.19, 1.12), "ivory")
    for x in (-0.24, 0.24):
        p.box((0.06, 0.06, 0.5), (x * 0.62, -0.2, 1.05), "gold")
    p.box((0.34, 0.03, 0.06), (0, -0.16, 1.68), "hair_dark")
    p.box((0.6, 0.4, 0.05), (0, -0.42, 1.0), "wood_light")
    for x, y in ((-0.18, -0.36), (0, -0.46), (0.18, -0.36), (-0.09, -0.52), (0.09, -0.52)):
        p.cone(0.06, 0.06, 0.04, (x, y, 1.05), "gold", segments=6)
    return _done("npc_arkady", p)


def build_kolya():
    clear_scene()
    p = Part("npc_kolya")
    _man(p, "bark", "wet_dark", hair="ivory")
    p.box((0.7, 0.42, 0.1), (0, 0, 1.5), "brick")
    p.box((0.24, 0.12, 0.3), (0, -0.19, 1.56), "brick")
    p.box((0.34, 0.14, 0.26), (0, -0.14, 1.6), "ivory")
    p.box((0.2, 0.06, 0.16), (0, -0.2, 1.5), "ivory")
    p.box((0.34, 0.32, 0.16), (0, 0.0, 1.98), "wood_dark")
    p.box((0.38, 0.36, 0.06), (0, 0, 1.9), "wood")
    for x, y in ((-0.35, -0.5), (0.4, -0.45), (0.05, -0.65)):
        p.box((0.18, 0.26, 0.12), (x, y, 0.08), "frost")
        p.box((0.12, 0.12, 0.08), (x, y - 0.14, 0.16), "slate")
        p.box((0.04, 0.05, 0.03), (x, y - 0.21, 0.16), "amber")
    for x, y in ((-0.2, -0.4), (0.25, -0.62), (-0.1, -0.7)):
        p.box((0.04, 0.04, 0.02), (x, y, 0.03), "straw")
    return _done("npc_kolya", p)


def build_all_npcs():
    fns = [build_grisha, build_tolik, build_lyoha, build_mikhalych, build_boris, build_sergei, build_arkady, build_kolya]
    return [fn() for fn in fns]
