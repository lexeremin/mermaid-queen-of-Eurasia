"""Phase 3 PoC assets: spruce tree, izba (wooden house), placeholder Rosa.

Inside Blender (after exec-ing lib.py in the same namespace):
    exec(open(REPO + "/tools/blender/build_poc_assets.py").read())
    build_tree(); build_izba(); build_rosa()
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


def _sway(obj, frames, axis, amplitude, phase, cycles=1):
    """Sinusoidal rotation keys on one axis over `frames` (loop-closed)."""
    steps = 8
    for i in range(steps + 1):
        t = i / steps
        angle = amplitude * math.sin(2 * math.pi * cycles * t + phase)
        rot = list(obj.rotation_euler)
        rot[axis] = angle
        obj.rotation_euler = rot
        obj.keyframe_insert("rotation_euler", index=axis, frame=1 + t * frames)


def _bob(obj, frames, amplitude, base):
    steps = 8
    for i in range(steps + 1):
        t = i / steps
        obj.location.z = base + amplitude * math.sin(4 * math.pi * t)
        obj.keyframe_insert("location", index=2, frame=1 + t * frames)


def _new_clip(obj, clip, start):
    anim = obj.animation_data_create()
    action = bpy.data.actions.new(f"{clip}_{obj.name}")
    anim.action = action
    return anim, action


def _push_to_nla(obj, anim, action, clip):
    track = anim.nla_tracks.new()
    track.name = clip
    track.strips.new(clip, 1, action)
    anim.action = None


def build_rosa():
    clear_scene()
    root = Empty("char_rosa")

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
        torso.box((0.22, 0.1, 0.16), (x, -0.17, 1.48), "rose")
    torso.finish()

    head = Part("head", (0, 0, 1.62), torso)
    head.box((0.16, 0.16, 0.1), (0, 0, 1.65), "skin_shadow")
    head.box((0.42, 0.4, 0.4), (0, 0, 1.87), "skin")
    for x in (-0.1, 0.1):
        head.box((0.07, 0.03, 0.09), (x, -0.205, 1.9), "ink")
    head.box((0.08, 0.03, 0.03), (0, -0.205, 1.78), "rose")
    head.box((0.48, 0.46, 0.16), (0, 0.01, 2.1), "gold")
    head.box((0.44, 0.06, 0.12), (0, -0.22, 2.02), "gold")
    head.box((0.48, 0.2, 0.62), (0, 0.18, 1.85), "gold")
    for x in (-0.24, 0.24):
        head.box((0.08, 0.34, 0.5), (x, 0.02, 1.85), "gold")
    head.box((0.42, 0.14, 0.75), (0, 0.24, 1.35), "gold")
    head.box((0.46, 0.44, 0.07), (0, 0, 2.215), "gold")
    for x, h in ((-0.15, 0.2), (0, 0.28), (0.15, 0.2)):
        head.cone(0.06, 0, h, (x, 0, 2.25 + h / 2), "gold", segments=4)
        head.box((0.06, 0.06, 0.06), (x, 0, 2.28 + h), "pearl")
    head.finish()

    arm_l = Part("arm_l", (-0.31, 0, 1.55), torso)
    arm_l.box((0.14, 0.14, 0.42), (-0.31, 0, 1.34), "skin")
    arm_l.box((0.15, 0.15, 0.12), (-0.31, 0, 1.1), "skin_shadow")
    arm_l.finish()
    arm_r = Part("arm_r", (0.31, 0, 1.55), torso)
    arm_r.box((0.14, 0.14, 0.42), (0.31, 0, 1.34), "skin")
    arm_r.box((0.15, 0.15, 0.12), (0.31, -0.06, 1.1), "skin_shadow")
    arm_r.finish()

    trident = Part("trident", (0.31, -0.06, 1.1), arm_r)
    trident.cone(0.03, 0.03, 1.9, (0.31, -0.06, 1.15), "gold", segments=4)
    trident.box((0.34, 0.05, 0.05), (0.31, -0.06, 2.12), "gold")
    for dx, h in ((-0.15, 0.3), (0, 0.42), (0.15, 0.3)):
        trident.cone(0.05, 0, h, (0.31 + dx, -0.06, 2.15 + h / 2), "aqua", segments=4)
    for dx in (-0.15, 0.15):
        trident.box((0.04, 0.04, 0.2), (0.31 + dx, -0.06, 2.24), "aqua")
    trident.finish()

    objs = list(bpy.data.objects)
    _animate_rosa()
    report = _report("char_rosa", None, objs)
    report["path"] = export_glb("char_rosa.glb", ["char_rosa"], animations=True)
    report["clips"] = [t.name for o in objs if o.animation_data for t in o.animation_data.nla_tracks]
    return report


def _animate_rosa():
    o = bpy.data.objects
    chain = [("tail1", 0.0), ("tail2", 0.9), ("tail3", 1.8), ("fin", 2.7)]
    clips = {
        # name: (frames, tail amplitude, bob amplitude, arm swing)
        "idle": (60, 0.05, 0.012, 0.03),
        "walk": (30, 0.22, 0.05, 0.45),
    }
    for clip, (frames, tail_amp, bob_amp, arm_amp) in clips.items():
        touched = []
        for name, phase in chain:
            anim, action = _new_clip(o[name], clip, 1)
            _sway(o[name], frames, 2, tail_amp * (1.3 if name == "fin" else 1), phase)
            touched.append((o[name], anim, action))
        anim, action = _new_clip(o["torso"], clip, 1)
        _bob(o["torso"], frames, bob_amp, o["torso"].location.z)
        touched.append((o["torso"], anim, action))
        for name, sign in (("arm_l", 1), ("arm_r", -1)):
            amp = arm_amp * (0.3 if name == "arm_r" else 1)
            anim, action = _new_clip(o[name], clip, 1)
            _sway(o[name], frames, 0, amp, 0.0 if sign > 0 else math.pi)
            touched.append((o[name], anim, action))
        anim, action = _new_clip(o["head"], clip, 1)
        _sway(o["head"], frames, 0, arm_amp * 0.15, 0.6)
        touched.append((o["head"], anim, action))
        for obj, anim, action in touched:
            _push_to_nla(obj, anim, action, clip)
    for obj in o:
        obj.rotation_euler = (0, 0, 0)
