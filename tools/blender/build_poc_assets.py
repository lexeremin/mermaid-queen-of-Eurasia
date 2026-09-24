"""Phase 3 PoC asset that survived the Red Square change: the spruce. Rosa lives in build_hero.py.

Inside Blender (after exec-ing lib.py in the same namespace):
    exec(open(REPO + "/tools/blender/build_poc_assets.py").read())
    build_tree()
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
        p.cone(radius * 1.06, radius * 0.89, band, (0, 0, z0 + band / 2), "spruce_light", segments=8)
        if i == len(tiers) - 1:
            cap = height * 0.4
            p.cone(radius * 0.6, 0, cap, (0, 0, z0 + height - cap / 2 + 0.02), "spruce_light", segments=8)
    obj = p.finish()
    return _report("tree_spruce", export_glb("tree_spruce.glb", [obj.name]), [obj])
