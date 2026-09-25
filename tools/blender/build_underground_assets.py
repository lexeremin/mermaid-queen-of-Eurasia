"""Moscow underground (Phase 16): metro pavilion, stairs, dark-brick wall kit, column, boss gate, paper stack, boss.

Exec after lib.py and build_redsquare_assets.py in the same namespace (uses _done, _seams).
    ns["build_all_underground"]()
Fronts face Blender -Y. The wall pieces are symmetric (detailed on both faces) and share one cross-section.
"""

import math


def _ug_wall_piece(name, length, variant):
    """Underground wall kit piece: 1.8 m thick base, 1.6 m body, 3.6 m tall, dark brick with a tiled band. Pieces butt."""
    clear_scene()
    p = Part(name)
    p.box((length, 1.8, 0.3), (0, 0, 0.15), "wet_dark")
    p.box((length, 1.6, 3.0), (0, 0, 1.8), "brick_dark")
    p.box((length, 1.9, 0.2), (0, 0, 3.5), "stone")
    p.box((length, 1.7, 0.1), (0, 0, 3.32), "wet_stone")
    for y in (-0.81, 0.81):
        p.box((length + 0.02, 0.05, 0.28), (0, y, 1.1), "teal")
        p.box((length + 0.02, 0.05, 0.08), (0, y * 1.005, 1.32), "gold")
    if variant == "a":
        for y in (-0.82, 0.82):
            for x in ((-1.5, 0.0, 1.5) if length > 4 else (0.0,)):
                p.box((0.5, 0.05, 1.3), (x, y, 2.35), "brick")
                p.box((0.34, 0.06, 1.1), (x, y * 1.01, 2.35), "night")
    elif variant == "b":
        for y in (-0.82, 0.82):
            for x in ((-1.6, 1.6) if length > 4 else (0.0,)):
                p.box((0.9, 0.06, 1.7), (x, y, 2.3), "ink")
                p.box((0.2, 0.1, 0.36), (x, y * 1.07, 2.0), "candle")
                p.box((0.28, 0.12, 0.08), (x, y * 1.07, 2.24), "gold")
    elif variant == "c":
        for y in (-1, 1):
            for x in ((-1.9, 1.9) if length > 4 else (0.0,)):
                p.box((0.42, 0.2, 3.0), (x, y * 0.9, 1.8), "stone")
                p.box((0.52, 0.24, 0.14), (x, y * 0.9, 3.25), "gold")
        for y in (-0.82, 0.82):
            p.box((length * 0.55, 0.05, 0.5), (0, y, 2.5), "rose")
    return _done(name, p)


def build_ug_wall():
    return _ug_wall_piece("bld_ug_wall", 6.0, "a")


def build_ug_wall_b():
    return _ug_wall_piece("bld_ug_wall_b", 6.0, "b")


def build_ug_wall_c():
    return _ug_wall_piece("bld_ug_wall_c", 6.0, "c")


def build_ug_wall_short():
    return _ug_wall_piece("bld_ug_wall_short", 3.0, "a")


def build_ug_column():
    clear_scene()
    p = Part("prop_ug_column")
    p.box((1.5, 1.5, 0.35), (0, 0, 0.175), "stone")
    p.cone(0.62, 0.55, 3.0, (0, 0, 1.85), "ivory", segments=10)
    for z in (0.9, 2.8):
        p.cone(0.66, 0.66, 0.12, (0, 0, z), "gold", segments=10, caps=False)
    p.box((1.3, 1.3, 0.3), (0, 0, 3.45), "stone")
    for a in range(4):
        r = a * math.pi / 2
        p.box((0.2, 0.2, 0.22), (0.62 * math.cos(r), 0.62 * math.sin(r), 3.7), "gold")
    return _done("prop_ug_column", p)


def build_ug_gate():
    """Boss gate for a 4 m wide corridor: two heavy doors with a glowing seal."""
    clear_scene()
    p = Part("bld_ug_gate")
    p.box((0.7, 1.8, 3.8), (-2.15, 0, 1.9), "stone")
    p.box((0.7, 1.8, 3.8), (2.15, 0, 1.9), "stone")
    p.box((4.9, 1.8, 0.5), (0, 0, 3.75), "stone")
    for sx in (-1, 1):
        p.box((1.9, 0.5, 3.3), (sx * 1.0, 0, 1.75), "wood_dark")
        for z in (0.7, 1.75, 2.8):
            p.box((1.94, 0.54, 0.14), (sx * 1.0, 0, z), "gold")
        for y in (-0.27, 0.27):
            for z in (1.2, 2.3):
                p.box((0.16, 0.06, 0.16), (sx * 1.6, y * 1.02, z), "gold")
    p.box((0.08, 0.6, 3.3), (0, 0, 1.75), "ink")
    for y in (-0.3, 0.3):
        for k in range(12):
            a = k * math.pi / 6
            p.box((0.16, 0.06, 0.16), (0.55 * math.cos(a), y * 1.03, 1.9 + 0.55 * math.sin(a)), "ruby")
        p.box((0.5, 0.07, 0.5), (0, y * 1.04, 1.9), "candle", rot=(0, math.pi / 4, 0))
    return _done("bld_ug_gate", p)


def build_paper_stack():
    clear_scene()
    p = Part("prop_paper_stack")
    layers = [(1.0, 0.9, 0.3, "paper"), (0.9, 0.85, 0.28, "ivory"), (1.05, 0.8, 0.3, "blush"), (0.85, 0.9, 0.26, "paper"),
              (0.95, 0.8, 0.3, "ivory"), (0.7, 0.7, 0.28, "paper"), (0.6, 0.6, 0.26, "blush")]
    z = 0.0
    for i, (sx, sy, h, c) in enumerate(layers):
        p.box((sx, sy, h), (0.04 * math.sin(i * 2.1), 0.05 * math.cos(i * 1.7), z + h / 2), c, rot=(0, 0, 0.09 * i - 0.2))
        z += h
    p.box((0.5, 0.08, 0.5), (0.0, -0.47, 0.6), "brick_dark")
    return _done("prop_paper_stack", p)


def build_ug_stairs():
    """The way up: five steps rising into the south wall under a glowing arch, with rails."""
    clear_scene()
    p = Part("bld_ug_stairs")
    for i in range(5):
        p.box((3.6, 0.7, 0.24), (0, -0.7 * (4 - i) * 0.5 + 0.5, 0.12 + i * 0.24), "cobble_light" if i % 2 else "stone")
    p.box((0.3, 2.6, 2.6), (-2.05, 0, 1.3), "brick_dark")
    p.box((0.3, 2.6, 2.6), (2.05, 0, 1.3), "brick_dark")
    p.box((4.4, 2.6, 0.4), (0, 0, 2.8), "brick_dark")
    p.box((3.2, 0.1, 1.0), (0, 1.2, 1.9), "candle")
    for x in (-1.85, 1.85):
        p.box((0.08, 2.2, 0.08), (x, 0.0, 1.2), "gold")
        p.box((0.2, 0.2, 0.3), (x, -0.9, 1.5), "candle")
    p.box((1.2, 0.08, 0.5), (0, -1.28, 3.1), "gold")
    return _done("bld_ug_stairs", p)


def build_metro_entrance():
    """Surface pavilion over the stairs down: teal roof, a dark arch with steps, lanterns and a gold sign ring."""
    clear_scene()
    p = Part("bld_metro_entrance")
    p.box((6.4, 4.4, 0.4), (0, 0, 0.2), "stone")
    p.box((5.8, 3.8, 3.4), (0, 0, 2.1), "ivory")
    for z in (1.2, 2.2, 3.2):
        p.box((5.84, 3.84, 0.06), (0, 0, z), "wet_stone")
    p.box((6.2, 4.2, 0.3), (0, 0, 3.95), "stone")
    p.cone(4.6, 0.3, 2.2, (0, 0, 5.2), "teal", segments=4, rot=(0, 0, math.pi / 4))
    p.cone(0.09, 0, 0.7, (0, 0, 6.65), "gold", segments=4)
    p.box((2.4, 0.3, 2.6), (0, -1.95, 1.7), "ink")
    p.box((2.0, 0.2, 2.3), (0, -1.9, 1.55), "night")
    for i in range(4):
        p.box((2.0, 0.6, 0.18), (0, -1.55 + i * 0.35, 0.5 + i * 0.05), "cobble_dark" if i % 2 else "wet_stone")
    p.box((2.9, 0.3, 0.3), (0, -2.0, 3.0), "stone")
    p.box((0.3, 0.3, 2.9), (-1.4, -2.0, 1.55), "stone")
    p.box((0.3, 0.3, 2.9), (1.4, -2.0, 1.55), "stone")
    for sx in (-1, 1):
        p.box((0.12, 0.12, 0.6), (sx * 2.0, -2.0, 2.6), "ink")
        p.box((0.3, 0.3, 0.5), (sx * 2.0, -2.0, 2.2), "candle")
        p.box((0.36, 0.36, 0.08), (sx * 2.0, -2.0, 2.5), "gold")
    for k in range(12):
        a = k * math.pi / 6
        p.box((0.2, 0.08, 0.2), (0.62 * math.cos(a), -2.12, 4.85 + 0.62 * math.sin(a)), "gold")
    p.box((0.34, 0.1, 0.34), (0, -2.12, 4.85), "violet", rot=(0, math.pi / 4, 0))
    return _done("bld_metro_entrance", p)


def build_boss_registrar():
    """Father of Corruption (Phase 16): a golem of ledgers in a pinstripe waistcoat, monocle, crown of
    stamps and a giant rubber stamp for a fist. Rigid parts: torso, head, arm_stamp (procedural slam), arm_quill."""
    clear_scene()
    root = Empty("boss_registrar")
    for name, x in (("leg_l", 0.85), ("leg_r", -0.85)):
        leg = Part(name, (x, 0, 1.7), root)
        for i in range(4):
            leg.box((1.2 - 0.06 * (i % 2), 1.3, 0.4), (x, 0, 0.2 + i * 0.4), "paper" if i % 2 == 0 else "ivory")
        leg.box((1.26, 1.36, 0.14), (x, 0, 1.7), "brick_dark")
        leg.box((1.3, 1.6, 0.3), (x, -0.12, 0.15), "wood_dark")
        leg.finish()
    torso = Part("torso", (0, 0, 1.7), root)
    for i in range(6):
        torso.box((3.0 - 0.06 * (i % 3), 2.0, 0.44), (0, 0, 1.92 + i * 0.44), "paper" if i % 2 == 0 else "ivory")
    torso.box((3.1, 0.14, 2.7), (0, 1.02, 3.2), "brick_dark")
    torso.box((1.6, 0.1, 2.5), (0, -1.03, 3.25), "night")
    for x in (-0.55, -0.2, 0.2, 0.55):
        torso.box((0.05, 0.12, 2.5), (x, -1.06, 3.25), "slate")
    for z in (2.4, 3.0, 3.6):
        torso.box((0.16, 0.14, 0.16), (0.0, -1.1, z), "gold")
    torso.box((1.3, 0.08, 0.08), (0.2, -1.12, 3.9), "gold", rot=(0, 0.4, 0))
    torso.box((0.9, 0.08, 0.9), (-1.2, -1.02, 4.6), "candle", rot=(0, 0.2, 0))
    torso.box((3.4, 2.2, 0.4), (0, 0, 4.7), "brick_dark")
    torso.finish()

    head = Part("head", (0, 0, 4.9), torso)
    head.box((1.7, 1.5, 1.5), (0, 0, 5.7), "ivory")
    head.box((1.72, 0.06, 0.4), (0, -0.78, 5.95), "ink")
    for x in (-0.4, 0.4):
        head.box((0.36, 0.06, 0.32), (x, -0.78, 5.72), "paper")
        head.box((0.14, 0.07, 0.14), (x, -0.8, 5.72), "ink")
        head.box((0.5, 0.06, 0.1), (x, -0.8, 6.0), "ink", rot=(0, 0.35 if x > 0 else -0.35, 0))
    for k in range(10):
        a = k * math.pi / 5
        head.box((0.09, 0.05, 0.09), (0.4 + 0.24 * math.cos(a), -0.83, 5.72 + 0.24 * math.sin(a)), "gold")
    head.box((0.42, 0.04, 0.42), (0.4, -0.82, 5.72), "frost")
    head.box((0.9, 0.08, 0.3), (0, -0.8, 5.28), "ink")
    head.box((0.5, 0.06, 0.12), (0, -0.8, 5.05), "brick_dark")
    head.box((1.9, 1.7, 0.2), (0, 0, 6.55), "wood_dark")
    for k in range(5):
        x = -0.7 + k * 0.35
        head.box((0.12, 0.12, 0.5 + 0.15 * (k % 2)), (x, 0, 6.8), "wood")
        head.box((0.3, 0.3, 0.14), (x, 0, 7.1 + 0.075 * (k % 2)), "ruby")
    head.finish()

    arm = Part("arm_stamp", (1.9, 0, 4.4), torso)
    arm.box((0.8, 0.8, 1.6), (2.05, 0, 3.7), "paper")
    arm.box((0.86, 0.86, 0.14), (2.05, 0, 3.15), "brick_dark")
    arm.box((0.7, 0.7, 0.5), (2.05, -0.1, 2.6), "ivory")
    arm.box((0.45, 0.45, 1.5), (2.05, -0.15, 1.9), "wood")
    arm.box((1.7, 1.7, 0.5), (2.05, -0.15, 1.0), "ruby")
    arm.box((1.4, 0.06, 0.06), (2.05, -1.02, 1.0), "ink")
    arm.box((0.06, 0.06, 1.2), (2.05, -1.02, 1.0), "ink")
    arm.finish()

    quill = Part("arm_quill", (-1.9, 0, 4.4), torso)
    quill.box((0.8, 0.8, 1.6), (-2.05, 0, 3.7), "paper")
    quill.box((0.86, 0.86, 0.14), (-2.05, 0, 3.15), "brick_dark")
    quill.box((0.7, 0.7, 0.5), (-2.05, -0.1, 2.6), "ivory")
    quill.box((0.08, 0.08, 2.2), (-2.05, -0.3, 3.0), "night", rot=(0.35, 0, 0))
    quill.box((0.5, 0.06, 0.9), (-2.05, -0.65, 4.4), "blush", rot=(0.35, 0, 0))
    quill.finish()

    author_clips(
        {
            "idle": {
                "frames": 60,
                "tracks": [
                    {"obj": "torso", "kind": "bob", "amp": 0.05},
                    {"obj": "head", "kind": "rot", "axis": 0, "amp": 0.04, "phase": 0.8},
                    {"obj": "arm_stamp", "kind": "rot", "axis": 0, "amp": 0.05},
                    {"obj": "arm_quill", "kind": "rot", "axis": 0, "amp": 0.06, "phase": math.pi},
                ],
            }
        }
    )
    objs = list(bpy.data.objects)
    return {
        "name": "boss_registrar",
        "tris": triangle_count(objs),
        "path": export_glb("boss_registrar.glb", ["boss_registrar"], animations=True),
    }


def build_all_underground():
    fns = [
        build_ug_wall, build_ug_wall_b, build_ug_wall_c, build_ug_wall_short, build_ug_column, build_ug_gate,
        build_paper_stack, build_ug_stairs, build_metro_entrance,
    ]
    return [fn() for fn in fns] + [build_boss_registrar()]
