"""Phase 24: seven ordinary people of the square, one static mesh each (single draw call).

Exec after lib.py in the same namespace:
    ns["build_all_locals"]()
Front faces Blender -Y. Friendly, generic archetypes: nobody here is a real person.
"""

import math


def _done(name, p):
    obj = p.finish()
    return {"name": name, "tris": triangle_count([obj]), "path": export_glb(name + ".glb", [obj.name])}


def _head(p, z, skin="skin", hair="hair_dark", size=0.3, smile=True, hair_top=True):
    p.box((size, size, size + 0.02), (0, 0, z), skin, bevel=0)
    for x in (-0.08, 0.08):
        p.box((0.05, 0.03, 0.05), (x, -size / 2 - 0.005, z + 0.03), "ink", bevel=0)
    p.box((0.04, 0.04, 0.05), (0, -size / 2 - 0.01, z - 0.02), "skin_shadow", bevel=0)
    if smile:
        p.box((0.1, 0.03, 0.02), (0, -size / 2 - 0.005, z - 0.09), "skin_shadow", bevel=0)
    if hair_top:
        p.box((size + 0.02, size + 0.02, 0.09), (0, 0.01, z + size / 2 + 0.02), hair, bevel=0)
        p.box((size + 0.02, 0.09, size * 0.6), (0, size / 2, z), hair, bevel=0)


def _person(p, coat, trousers, shoes="wood_dark", height=1.0, wide=0.6, skin="skin", sleeve=None):
    """Standing body: legs up to `height`, torso 0.75 tall, arms. Returns the top of the torso."""
    for x in (-0.13, 0.13):
        p.box((0.2, 0.22, height - 0.2), (x, 0, (height - 0.2) / 2 + 0.2), trousers, bevel=0)
        p.box((0.22, 0.32, 0.2), (x, -0.05, 0.1), shoes, bevel=0)
    p.box((wide, 0.36, 0.75), (0, 0, height + 0.375), coat, bevel=0)
    for x in (-1, 1):
        ax = x * (wide / 2 + 0.09)
        p.box((0.17, 0.19, 0.62), (ax, -0.02, height + 0.4), sleeve or coat, bevel=0)
        p.box((0.13, 0.13, 0.13), (ax, -0.04, height + 0.06), skin, bevel=0)
    p.box((0.13, 0.13, 0.1), (0, 0, height + 0.8), "skin_shadow", bevel=0)
    return height + 0.85


def build_vanya():
    """The tracksuit guy: squats on his heels with a bag of sunflower seeds, flat cap, three white stripes."""
    clear_scene()
    p = Part("npc_vanya")
    for x in (-0.16, 0.16):
        p.box((0.2, 0.55, 0.2), (x, -0.25, 0.42), "dome_blue", bevel=0)  # thighs, knees forward
        p.box((0.2, 0.2, 0.42), (x, -0.5, 0.26), "dome_blue", bevel=0)
        p.box((0.24, 0.36, 0.14), (x, -0.55, 0.07), "snow", bevel=0)
        p.box((0.24, 0.05, 0.05), (x, -0.73, 0.1), "ember", bevel=0)
        p.box((0.05, 0.6, 0.05), (x * 1.4, -0.25, 0.45), "snow", bevel=0)  # stripe
    p.box((0.62, 0.4, 0.62), (0, 0.08, 0.72), "dome_blue", bevel=0)
    p.box((0.05, 0.42, 0.62), (-0.31, 0.08, 0.72), "snow", bevel=0)
    p.box((0.05, 0.42, 0.62), (0.31, 0.08, 0.72), "snow", bevel=0)
    p.box((0.1, 0.06, 0.4), (0, -0.13, 0.75), "snow", bevel=0)  # zip
    for x in (-1, 1):
        p.box((0.17, 0.2, 0.5), (x * 0.4, -0.16, 0.66), "dome_blue", rot=(-0.5, 0, 0), bevel=0)
        p.box((0.13, 0.13, 0.13), (x * 0.4, -0.4, 0.5), "skin", bevel=0)
    _head(p, 1.2, hair="hair_brown", smile=False, hair_top=False)
    p.box((0.34, 0.34, 0.06), (0, 0.0, 1.38), "ink", bevel=0)  # flat cap
    p.box((0.34, 0.16, 0.04), (0, -0.22, 1.36), "ink", bevel=0)
    p.box((0.3, 0.03, 0.02), (0, -0.16, 1.1), "skin_shadow", bevel=0)  # a serious brow
    p.box((0.16, 0.08, 0.2), (0.42, -0.42, 0.55), "candle", rot=(0, 0.3, 0), bevel=0)  # the seeds
    for x, y in ((0.3, -0.5), (0.5, -0.6), (0.2, -0.65), (0.6, -0.4), (0.1, -0.55)):
        p.box((0.05, 0.03, 0.02), (x, y, 0.015), "birch", bevel=0)  # husks
    return _done("npc_vanya", p)


def build_babushka():
    """A grandmother in a flowery headscarf and a long violet coat, a shopping bag in each hand."""
    clear_scene()
    p = Part("npc_babushka")
    for x in (-0.12, 0.12):
        p.box((0.2, 0.22, 0.3), (x, 0, 0.25), "wood_dark", bevel=0)
    p.cone(0.4, 0.28, 0.85, (0, 0, 0.7), "violet", segments=8)
    p.box((0.6, 0.4, 0.5), (0, 0, 1.3), "violet", bevel=0)
    p.box((0.62, 0.42, 0.06), (0, 0, 1.08), "ivory", bevel=0)
    for x in (-1, 1):
        p.box((0.16, 0.18, 0.5), (x * 0.4, -0.04, 1.28), "violet", bevel=0)
        p.box((0.12, 0.12, 0.12), (x * 0.4, -0.05, 0.98), "skin", bevel=0)
    p.box((0.3, 0.26, 0.2), (-0.4, -0.1, 0.8), "straw", bevel=0)  # bags
    p.box((0.28, 0.06, 0.3), (-0.4, -0.06, 0.94), "straw", bevel=0)
    p.box((0.3, 0.26, 0.24), (0.4, -0.1, 0.78), "leaf", bevel=0)
    p.box((0.4, 0.05, 0.1), (0.4, -0.08, 0.96), "leaf_dark", bevel=0)
    _head(p, 1.72, skin="skin", hair="snow", hair_top=False)
    p.box((0.4, 0.36, 0.14), (0, 0.02, 1.9), "rose", bevel=0)  # the headscarf
    p.box((0.42, 0.1, 0.32), (0, -0.16, 1.78), "rose", bevel=0)
    p.box((0.42, 0.1, 0.32), (0, 0.16, 1.7), "rose", bevel=0)
    for x, z in ((-0.14, 1.86), (0.1, 1.92), (0.16, 1.8), (-0.08, 1.78)):
        p.box((0.06, 0.04, 0.06), (x, -0.2, z), "snow", bevel=0)  # flowers
    for x in (-0.09, 0.09):
        p.box((0.1, 0.03, 0.09), (x, -0.16, 1.76), "frost", bevel=0)  # round glasses
    return _done("npc_babushka", p)


def build_tourist():
    """A cheerful visitor: red cap, flowery shirt, shorts, socks with sandals, a camera, a selfie stick."""
    clear_scene()
    p = Part("npc_tourist")
    for x in (-0.13, 0.13):
        p.box((0.2, 0.22, 0.42), (x, 0, 0.7), "aqua", bevel=0)
        p.box((0.16, 0.16, 0.34), (x, 0, 0.33), "skin", bevel=0)
        p.box((0.19, 0.19, 0.14), (x, 0, 0.2), "snow", bevel=0)
        p.box((0.22, 0.32, 0.06), (x, -0.05, 0.03), "wood_light", bevel=0)
    p.box((0.62, 0.38, 0.75), (0, 0, 1.27), "flower_yellow", bevel=0)
    for x, z in ((-0.2, 1.4), (0.1, 1.15), (0.22, 1.5), (-0.1, 1.2)):
        p.box((0.1, 0.03, 0.1), (x, -0.2, z), "flower_red", bevel=0)
    for x in (-1, 1):
        p.box((0.17, 0.19, 0.4), (x * 0.4, -0.02, 1.4), "flower_yellow", bevel=0)
        p.box((0.16, 0.16, 0.3), (x * 0.4, -0.02, 1.1), "skin", bevel=0)
    p.box((0.13, 0.13, 0.1), (0, 0, 1.68), "skin_shadow", bevel=0)
    p.box((0.26, 0.1, 0.16), (0, -0.28, 1.22), "ink", bevel=0)  # camera
    p.box((0.1, 0.05, 0.1), (0, -0.34, 1.22), "frost", bevel=0)
    _head(p, 1.86, hair="hair_brown", hair_top=False)
    p.box((0.34, 0.34, 0.1), (0, 0.0, 2.06), "ruby", bevel=0)  # cap
    p.box((0.34, 0.2, 0.04), (0, -0.25, 2.03), "ruby", bevel=0)
    for x in (-0.09, 0.09):
        p.box((0.11, 0.03, 0.07), (x, -0.16, 1.9), "ink", bevel=0)  # sunglasses
    p.box((0.05, 0.05, 1.0), (0.55, -0.08, 1.75), "slate", rot=(0, -0.2, 0), bevel=0)  # selfie stick
    p.box((0.14, 0.05, 0.24), (0.66, -0.08, 2.28), "ink", bevel=0)
    return _done("npc_tourist", p)


def build_painter():
    """A street painter: beret, paint-splattered smock, a palette, and an easel with a canvas."""
    clear_scene()
    p = Part("npc_painter")
    top = _person(p, "snow", "slate_dark", height=0.95, sleeve="snow")
    for x, z, c in ((-0.15, 1.5, "ruby"), (0.1, 1.3, "dome_blue"), (0.2, 1.6, "gold"), (-0.2, 1.25, "leaf")):
        p.box((0.1, 0.03, 0.1), (x, -0.19, z), c, bevel=0)
    _head(p, 1.98, hair="hair_dark", hair_top=False)
    p.box((0.4, 0.4, 0.07), (0.02, 0.0, 2.17), "ruby", bevel=0)  # beret
    p.box((0.05, 0.05, 0.1), (0.02, 0.0, 2.24), "ruby", bevel=0)
    p.box((0.1, 0.03, 0.02), (0, -0.16, 1.9), "hair_dark", bevel=0)  # a little moustache
    p.box((0.34, 0.24, 0.05), (0.5, -0.32, 1.0), "wood_light", rot=(0, 0, 0.3), bevel=0)  # palette
    for x, y, c in ((0.42, -0.34, "ruby"), (0.5, -0.34, "gold"), (0.58, -0.34, "aqua")):
        p.box((0.05, 0.03, 0.05), (x, y - 0.0, 1.03), c, bevel=0)
    p.box((0.06, 0.06, 1.5), (-0.55, -0.6, 0.75), "wood_light", rot=(0.15, 0, 0), bevel=0)  # easel
    p.box((0.06, 0.06, 1.5), (-0.95, -0.6, 0.75), "wood_light", rot=(0.15, 0, 0), bevel=0)
    p.box((0.06, 0.06, 1.4), (-0.75, -0.2, 0.7), "wood_light", rot=(-0.2, 0, 0), bevel=0)
    p.box((0.75, 0.05, 0.6), (-0.75, -0.62, 1.15), "paper", rot=(0.15, 0, 0), bevel=0)  # canvas
    p.box((0.75, 0.06, 0.3), (-0.75, -0.66, 1.0), "aqua", rot=(0.15, 0, 0), bevel=0)  # sea
    p.box((0.75, 0.06, 0.22), (-0.75, -0.66, 1.3), "frost", rot=(0.15, 0, 0), bevel=0)  # sky
    p.box((0.2, 0.06, 0.26), (-0.6, -0.68, 1.15), "brick_light", rot=(0.15, 0, 0), bevel=0)  # a tiny Basil
    p.cone(0.12, 0.02, 0.16, (-0.6, -0.7, 1.34), "dome_green", segments=6, rot=(0.15, 0, 0))
    del top
    return _done("npc_painter", p)


def build_kvass():
    """A kvass seller with her yellow barrel on wheels, in a white apron."""
    clear_scene()
    p = Part("npc_kvass")
    _person(p, "brick", "wood_dark", height=0.9, sleeve="snow")
    p.box((0.4, 0.06, 0.6), (0, -0.19, 1.25), "snow", bevel=0)  # apron
    p.box((0.4, 0.06, 0.2), (0, -0.2, 0.95), "snow", bevel=0)
    _head(p, 1.92, hair="hair_brown", hair_top=False)
    p.box((0.36, 0.36, 0.1), (0, 0.0, 2.1), "snow", bevel=0)  # a little white cap
    p.box((0.36, 0.16, 0.06), (0, -0.2, 2.06), "snow", bevel=0)
    p.cone(0.6, 0.6, 1.0, (0.95, -0.3, 0.75), "amber", segments=12, rot=(0, math.pi / 2, 0))
    for z in (0.5, 1.0):
        p.cone(0.62, 0.62, 0.07, (0.95, -0.3, z + 0.02), "wood_dark", segments=12, rot=(0, math.pi / 2, 0), caps=False)
    p.box((0.05, 0.8, 0.55), (0.95, -0.9, 0.78), "ivory", bevel=0)  # the sign
    p.box((0.04, 0.6, 0.12), (0.95, -0.93, 0.88), "ruby", bevel=0)
    p.box((0.08, 0.18, 0.08), (0.95, -0.3, 0.38), "ink", bevel=0)  # the tap
    for y in (0.2, -0.8):
        p.cone(0.24, 0.24, 0.08, (0.95, y, 0.24), "ink", segments=8, rot=(0, math.pi / 2, 0))
    p.box((0.16, 0.16, 0.22), (0.95, -0.9, 0.32), "frost", bevel=0)  # a cup
    return _done("npc_kvass", p)


def build_sentry():
    """A ceremonial sentry: tall fur hat, green uniform, gold buttons, rifle at his side. He is not allowed to talk."""
    clear_scene()
    p = Part("npc_sentry")
    _person(p, "spruce_dark", "spruce_dark", shoes="ink", height=1.0, sleeve="spruce_dark")
    for z in (1.15, 1.4, 1.65):
        p.box((0.07, 0.03, 0.07), (0, -0.19, z), "gold", bevel=0)
    p.box((0.62, 0.38, 0.06), (0, 0, 1.03), "ink", bevel=0)  # belt
    p.box((0.7, 0.4, 0.1), (0, 0, 1.78), "ruby", bevel=0)  # collar
    _head(p, 1.98, hair="hair_dark", smile=False, hair_top=False)
    p.box((0.34, 0.34, 0.5), (0, 0.0, 2.32), "ink", bevel=0)  # the tall hat
    p.box((0.36, 0.36, 0.1), (0, 0.0, 2.07), "ink", bevel=0)
    p.box((0.16, 0.06, 0.1), (0, -0.19, 2.42), "gold", bevel=0)  # badge
    p.box((0.05, 0.05, 0.4), (0.0, 0.0, 2.7), "ruby", bevel=0)  # plume
    p.box((0.05, 0.05, 1.9), (0.5, -0.1, 1.15), "ink", bevel=0)  # rifle
    p.box((0.09, 0.14, 0.4), (0.5, -0.1, 0.9), "wood_dark", bevel=0)
    p.box((0.02, 0.03, 0.6), (0.5, -0.1, 2.05), "frost", bevel=0)  # bayonet
    return _done("npc_sentry", p)


def build_kid():
    """A small child with a red balloon and a pigeon on one shoulder."""
    clear_scene()
    p = Part("npc_kid")
    for x in (-0.1, 0.1):
        p.box((0.16, 0.18, 0.4), (x, 0, 0.42), "dome_blue", bevel=0)
        p.box((0.18, 0.26, 0.14), (x, -0.04, 0.07), "ruby", bevel=0)
    p.box((0.44, 0.3, 0.5), (0, 0, 0.87), "amber", bevel=0)
    for x in (-1, 1):
        p.box((0.13, 0.15, 0.42), (x * 0.3, -0.02, 0.85), "amber", bevel=0)
        p.box((0.11, 0.11, 0.11), (x * 0.3, -0.03, 0.62), "skin", bevel=0)
    _head(p, 1.32, hair="hair_brown", size=0.38, hair_top=True)
    p.box((0.05, 0.05, 1.2), (0.3, -0.05, 1.28), "snow", bevel=0)  # the string
    p.cone(0.24, 0.24, 0.5, (0.32, -0.05, 2.18), "ruby", segments=8)
    p.cone(0.24, 0.02, 0.2, (0.32, -0.05, 2.53), "ruby", segments=8)
    p.box((0.18, 0.14, 0.12), (-0.3, 0.02, 1.2), "frost", bevel=0)  # the pigeon
    p.box((0.1, 0.1, 0.1), (-0.3, -0.06, 1.3), "frost", bevel=0)
    p.box((0.04, 0.05, 0.04), (-0.3, -0.13, 1.3), "amber", bevel=0)
    p.box((0.16, 0.16, 0.03), (-0.3, 0.14, 1.18), "slate", rot=(0.3, 0, 0), bevel=0)
    return _done("npc_kid", p)


def build_all_locals():
    return [build_vanya(), build_babushka(), build_tourist(), build_painter(), build_kvass(), build_sentry(), build_kid()]
