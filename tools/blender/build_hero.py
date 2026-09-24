"""Rosa, the hero: stylized low-poly character inspired by the look of a consenting real person.

No face scan and no photo-derived texture; see docs/likeness-and-consent.md.
Usage (after exec-ing lib.py into the same namespace):
    exec(open(REPO + "/tools/blender/build_hero.py").read(), ns)
    ns["build_rosa_human"](); ns["build_rosa_mermaid"]()
Character faces Blender -Y. Character's left is +X (roses side), right is -X (trident hand).
"""

import math

HEAD_PIVOT = (0, 0, 1.7)


def _rose(part, x, y, z, size, petals, heart):
    part.box((size, size, size * 0.6), (x, y, z), petals)
    part.box((size * 0.75, size * 0.75, size * 0.5), (x, y - 0.01, z + size * 0.22), petals, rot=(0, 0, math.pi / 4))
    part.box((size * 0.4, size * 0.4, size * 0.3), (x, y - 0.02, z + size * 0.4), heart)


def _build_head(head):
    head.box((0.14, 0.14, 0.12), (0, 0, 1.68), "skin_shadow")
    head.box((0.36, 0.34, 0.38), (0, 0, 1.92), "skin")
    for x in (-0.09, 0.09):
        head.box((0.07, 0.03, 0.045), (x, -0.175, 1.94), "hair_dark")
        head.box((0.09, 0.03, 0.02), (x, -0.176, 2.0), "hair_dark")
        head.box((0.07, 0.02, 0.05), (x * 1.25, -0.176, 1.86), "blush")
    head.box((0.05, 0.04, 0.06), (0, -0.19, 1.89), "skin_shadow")
    head.box((0.09, 0.03, 0.03), (0, -0.177, 1.81), "blush")

    head.box((0.42, 0.4, 0.12), (0, 0.01, 2.13), "hair_dark")
    head.box((0.36, 0.06, 0.1), (0, -0.19, 2.09), "hair_dark")
    for x, rz in ((-0.14, 0.4), (0.14, -0.4)):
        head.box((0.14, 0.05, 0.08), (x, -0.19, 2.05), "hair_dark", rot=(0, 0, rz))
    for x in (-0.2, 0.2):
        head.box((0.06, 0.3, 0.3), (x, 0.0, 1.98), "hair_dark")
    head.box((0.4, 0.12, 0.36), (0, 0.18, 1.95), "hair_dark")
    for x, z, rz in ((-0.21, 1.72, 0.15), (0.21, 1.72, -0.15), (-0.24, 1.55, -0.2), (0.24, 1.55, 0.2)):
        head.box((0.05, 0.05, 0.26), (x, -0.1, z), "hair_dark", rot=(0, 0, rz))
    head.box((0.24, 0.24, 0.2), (0.02, 0.06, 2.28), "hair_brown")
    head.box((0.16, 0.16, 0.1), (0.02, 0.06, 2.42), "hair_dark")

    _rose(head, 0.2, 0.0, 2.34, 0.28, "ivory", "blush")
    _rose(head, 0.32, -0.02, 2.14, 0.23, "blush", "ivory")
    _rose(head, 0.37, -0.02, 1.95, 0.2, "lilac", "blush")
    _rose(head, 0.36, 0.03, 1.78, 0.19, "blush", "lilac")
    _rose(head, 0.3, 0.09, 1.63, 0.16, "ivory", "blush")
    _rose(head, -0.24, 0.05, 2.32, 0.22, "ivory", "blush")
    _rose(head, -0.32, 0.02, 2.12, 0.16, "blush", "ivory")


def _build_petals(petals):
    spots = (
        (0.42, 0.05, 1.76, 0.4), (0.3, 0.18, 1.56, -0.6), (-0.4, 0.08, 1.7, 0.9),
        (0.1, 0.24, 1.66, -0.3), (-0.22, 0.22, 1.5, 0.7), (0.48, -0.06, 1.46, -0.9),
    )
    colors = ("ivory", "frost", "ivory", "pearl", "frost", "ivory")
    for (x, y, z, rz), color in zip(spots, colors):
        petals.box((0.16, 0.12, 0.025), (x, y, z), color, rot=(0.3, 0, rz))


def _build_trident(trident, hand):
    x, y, z0 = hand
    trident.cone(0.03, 0.03, 1.9, (x, y, z0 + 0.05), "gold", segments=4)
    trident.box((0.34, 0.05, 0.05), (x, y, z0 + 1.02), "gold")
    for dx, h in ((-0.15, 0.3), (0, 0.42), (0.15, 0.3)):
        trident.cone(0.05, 0, h, (x + dx, y, z0 + 1.05 + h / 2), "aqua", segments=4)
    for dx in (-0.15, 0.15):
        trident.box((0.04, 0.04, 0.2), (x + dx, y, z0 + 1.14), "aqua")


def _arms_and_props(torso, sleeve, hand_color):
    arm_l = Part("arm_l", (0.36, 0, 1.58), torso)
    arm_l.box((0.16, 0.18, 0.5), (0.36, 0, 1.33), sleeve)
    if sleeve == "ivory":
        arm_l.box((0.18, 0.2, 0.06), (0.36, 0, 1.08), "stone")
    arm_l.box((0.12, 0.12, 0.12), (0.36, 0, 1.0), hand_color)
    arm_l.finish()
    arm_r = Part("arm_r", (-0.36, 0, 1.58), torso)
    arm_r.box((0.16, 0.18, 0.5), (-0.36, 0, 1.33), sleeve)
    if sleeve == "ivory":
        arm_r.box((0.18, 0.2, 0.06), (-0.36, 0, 1.08), "stone")
    arm_r.box((0.12, 0.12, 0.12), (-0.36, -0.06, 1.0), hand_color)
    arm_r.finish()
    trident = Part("trident", (-0.36, -0.08, 1.0), arm_r)
    _build_trident(trident, (-0.36, -0.08, 1.0))
    trident.finish()


def _head_and_petals(torso):
    head = Part("head", HEAD_PIVOT, torso)
    _build_head(head)
    head.finish()
    petals = Part("petals", HEAD_PIVOT, torso)
    _build_petals(petals)
    petals.finish()


def build_rosa_human():
    clear_scene()
    root = Empty("char_rosa")

    for name, x in (("leg_l", 0.14), ("leg_r", -0.14)):
        leg = Part(name, (x, 0, 1.0), root)
        leg.box((0.2, 0.2, 0.72), (x, 0, 0.64), "night")
        leg.box((0.23, 0.32, 0.28), (x, -0.04, 0.14), "wood_dark")
        leg.box((0.23, 0.34, 0.05), (x, -0.04, 0.025), "ink")
        leg.finish()

    torso = Part("torso", (0, 0, 1.0), root)
    torso.box((0.62, 0.4, 0.3), (0, 0, 0.95), "ivory")
    torso.box((0.64, 0.42, 0.06), (0, 0, 0.8), "stone")
    torso.box((0.56, 0.34, 0.5), (0, 0, 1.32), "ivory")
    torso.box((0.76, 0.32, 0.1), (0, 0, 1.6), "ivory")
    torso.box((0.34, 0.06, 0.16), (0, -0.16, 1.56), "skin")
    torso.box((0.5, 0.05, 0.05), (0, -0.19, 1.62), "stone")
    for z in (1.42, 1.26, 1.1):
        torso.box((0.05, 0.03, 0.05), (0.0, -0.2, z), "gold")
    for x in (-0.2, 0.2):
        torso.box((0.14, 0.03, 0.1), (x, -0.2, 0.96), "stone")
    torso.finish()

    _head_and_petals(torso)
    _arms_and_props(torso, "ivory", "skin")

    walk = 0.5
    author_clips(
        {
            "idle": {
                "frames": 60,
                "tracks": [
                    {"obj": "torso", "kind": "bob", "amp": 0.012},
                    {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.03, "phase": 0.6},
                    {"obj": "arm_l", "kind": "rot", "axis": 0, "amp": 0.03},
                    {"obj": "arm_r", "kind": "rot", "axis": 0, "amp": 0.01, "phase": math.pi},
                    {"obj": "petals", "kind": "rot", "axis": 2, "amp": 0.12},
                ],
            },
            "walk": {
                "frames": 30,
                "tracks": [
                    {"obj": "torso", "kind": "bob", "amp": 0.04},
                    {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.05, "phase": 0.6},
                    {"obj": "leg_l", "kind": "rot", "axis": 0, "amp": walk},
                    {"obj": "leg_r", "kind": "rot", "axis": 0, "amp": walk, "phase": math.pi},
                    {"obj": "arm_l", "kind": "rot", "axis": 0, "amp": 0.45, "phase": math.pi},
                    {"obj": "arm_r", "kind": "rot", "axis": 0, "amp": 0.15},
                    {"obj": "petals", "kind": "rot", "axis": 2, "amp": 0.3},
                ],
            },
        }
    )
    objs = list(bpy.data.objects)
    report = {"name": "char_rosa", "tris": triangle_count(objs), "objects": len(objs)}
    report["path"] = export_glb("char_rosa.glb", ["char_rosa"], animations=True)
    return report


def build_rosa_mermaid():
    clear_scene()
    root = Empty("char_rosa_mermaid")

    tail1 = Part("tail1", (0, 0, 1.05), root)
    tail1.cone(0.30, 0.38, 0.37, (0, 0, 0.865), "teal")
    tail1.finish()
    tail2 = Part("tail2", (0, 0.02, 0.68), tail1)
    tail2.cone(0.22, 0.30, 0.34, (0, 0.05, 0.51), "aqua")
    tail2.finish()
    tail3 = Part("tail3", (0, 0.1, 0.34), tail2)
    tail3.cone(0.14, 0.22, 0.22, (0, 0.13, 0.23), "teal")
    tail3.finish()
    fin = Part("fin", (0, 0.16, 0.14), tail3)
    fin.box((0.5, 0.42, 0.06), (-0.24, 0.42, 0.12), "pearl", rot=(0, 0, 0.45))
    fin.box((0.5, 0.42, 0.06), (0.24, 0.42, 0.12), "pearl", rot=(0, 0, -0.45))
    fin.box((0.16, 0.5, 0.06), (0, 0.4, 0.14), "aqua")
    fin.finish()

    torso = Part("torso", (0, 0, 1.05), root)
    torso.box((0.5, 0.3, 0.55), (0, 0, 1.33), "skin")
    torso.box((0.54, 0.34, 0.1), (0, 0, 1.08), "gold")
    for x in (-0.12, 0.12):
        torso.box((0.22, 0.1, 0.16), (x, -0.17, 1.48), "blush")
        torso.box((0.08, 0.04, 0.08), (x, -0.23, 1.48), "pearl")
    torso.box((0.7, 0.28, 0.08), (0, 0, 1.6), "skin")
    torso.finish()

    _head_and_petals(torso)
    _arms_and_props(torso, "skin", "skin_shadow")

    author_clips(
        {
            "idle": {
                "frames": 60,
                "tracks": [
                    {"obj": "tail1", "kind": "rot", "axis": 2, "amp": 0.05},
                    {"obj": "tail2", "kind": "rot", "axis": 2, "amp": 0.05, "phase": 0.9},
                    {"obj": "tail3", "kind": "rot", "axis": 2, "amp": 0.05, "phase": 1.8},
                    {"obj": "fin", "kind": "rot", "axis": 2, "amp": 0.065, "phase": 2.7},
                    {"obj": "torso", "kind": "bob", "amp": 0.012},
                    {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.03, "phase": 0.6},
                    {"obj": "arm_l", "kind": "rot", "axis": 0, "amp": 0.03},
                    {"obj": "arm_r", "kind": "rot", "axis": 0, "amp": 0.01, "phase": math.pi},
                    {"obj": "petals", "kind": "rot", "axis": 2, "amp": 0.12},
                ],
            },
            "walk": {
                "frames": 30,
                "tracks": [
                    {"obj": "tail1", "kind": "rot", "axis": 2, "amp": 0.22},
                    {"obj": "tail2", "kind": "rot", "axis": 2, "amp": 0.22, "phase": 0.9},
                    {"obj": "tail3", "kind": "rot", "axis": 2, "amp": 0.22, "phase": 1.8},
                    {"obj": "fin", "kind": "rot", "axis": 2, "amp": 0.29, "phase": 2.7},
                    {"obj": "torso", "kind": "bob", "amp": 0.05},
                    {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.05, "phase": 0.6},
                    {"obj": "arm_l", "kind": "rot", "axis": 0, "amp": 0.45, "phase": math.pi},
                    {"obj": "arm_r", "kind": "rot", "axis": 0, "amp": 0.15},
                    {"obj": "petals", "kind": "rot", "axis": 2, "amp": 0.3},
                ],
            },
        }
    )
    objs = list(bpy.data.objects)
    report = {"name": "char_rosa_mermaid", "tris": triangle_count(objs), "objects": len(objs)}
    report["path"] = export_glb("char_rosa_mermaid.glb", ["char_rosa_mermaid"], animations=True)
    return report
