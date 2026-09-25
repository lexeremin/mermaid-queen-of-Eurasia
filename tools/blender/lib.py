"""Shared helpers for building chunky low-poly assets in Blender.

Run inside Blender (e.g. through the MCP `execute_blender_code` tool):
    REPO = "/abs/path/to/repo"
    exec(open(REPO + "/tools/blender/lib.py").read())
Blender axes: +Z up, front of a character faces -Y (exports to glTF +Z forward).
"""

import json
import math
import os

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

REPO = globals().get("REPO") or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_DIR = os.path.join(REPO, "assets-src")

with open(os.path.join(REPO, "tools", "palette.json")) as _f:
    PALETTE = json.load(_f)
ATLAS = PALETTE["atlas"]
COLORS = PALETTE["colors"]
COLOR_NAMES = list(COLORS.keys())


def _hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) / 255.0 for i in (0, 2, 4))


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for datablocks, name in ((bpy.data.materials, "palette"), (bpy.data.images, "palette_atlas")):
        stale = datablocks.get(name)
        if stale:
            datablocks.remove(stale)


def get_atlas():
    """Palette atlas image: one flat 16px cell per palette color, row 0 at the top."""
    existing = bpy.data.images.get("palette_atlas")
    if existing:
        return existing
    width, height, cell, cols = ATLAS["width"], ATLAS["height"], ATLAS["cell"], ATLAS["cols"]
    image = bpy.data.images.new("palette_atlas", width, height, alpha=False)
    image.colorspace_settings.name = "sRGB"
    pixels = [0.0] * (width * height * 4)
    for index, name in enumerate(COLOR_NAMES):
        r, g, b = _hex_to_rgb(COLORS[name])
        col, row = index % cols, index // cols
        for py in range(cell):
            y = height - 1 - (row * cell + py)
            for px in range(cell):
                i = (y * width + col * cell + px) * 4
                pixels[i : i + 4] = (r, g, b, 1.0)
    image.pixels = pixels
    os.makedirs(SRC_DIR, exist_ok=True)
    image.filepath_raw = os.path.join(SRC_DIR, "palette_atlas.png")
    image.file_format = "PNG"
    image.save()
    return image


def get_material():
    mat = bpy.data.materials.get("palette")
    if mat:
        return mat
    mat = bpy.data.materials.new("palette")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == "BSDF_PRINCIPLED")
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = get_atlas()
    tex.interpolation = "Closest"
    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 1.0
    return mat


def atlas_uv(color):
    """UV at the center of the palette cell for `color` (v=0 at the bottom in Blender)."""
    index = COLOR_NAMES.index(color)
    col, row = index % ATLAS["cols"], index // ATLAS["cols"]
    rows = ATLAS["height"] // ATLAS["cell"]
    u = (col + 0.5) * ATLAS["cell"] / ATLAS["width"]
    v = 1.0 - (row + 0.5) / rows
    return (u, v)



def _polys_overlap(a, b, min_area=1e-5):
    """True when two coplanar convex faces overlap by more than `min_area` (square metres)."""
    n = a.normal
    u = Vector((1, 0, 0)) if abs(n.x) < 0.9 else Vector((0, 1, 0))
    u = (u - n * u.dot(n)).normalized()
    v = n.cross(u)
    pa = [(p.co.dot(u), p.co.dot(v)) for p in a.verts]
    pb = [(p.co.dot(u), p.co.dot(v)) for p in b.verts]
    if max(x for x, _ in pa) <= min(x for x, _ in pb) or max(x for x, _ in pb) <= min(x for x, _ in pa):
        return False
    if max(y for _, y in pa) <= min(y for _, y in pb) or max(y for _, y in pb) <= min(y for _, y in pa):
        return False

    def ccw(poly):
        area = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly)))
        return poly if area >= 0 else poly[::-1]

    subject, clip = ccw(pa), ccw(pb)
    for i in range(len(clip)):
        A, B = clip[i], clip[(i + 1) % len(clip)]
        side = lambda p: (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0])
        out = []
        for j in range(len(subject)):
            P, Q = subject[j], subject[(j + 1) % len(subject)]
            sp, sq = side(P), side(Q)
            if sp >= 0:
                out.append(P)
            if (sp >= 0) != (sq >= 0):
                t = sp / (sp - sq)
                out.append((P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])))
        subject = out
        if not subject:
            return False
    area = abs(sum(subject[i][0] * subject[(i + 1) % len(subject)][1] - subject[(i + 1) % len(subject)][0] * subject[i][1] for i in range(len(subject)))) / 2
    return area > min_area


class Part:
    """One mesh object built from primitives given in WORLD coordinates.

    `pivot` is the object origin (joint position); geometry is stored relative to it.
    `parent` is another Part (or Empty from `empty()`); the parent must be un-rotated at rest.
    """

    def __init__(self, name, pivot=(0, 0, 0), parent=None):
        self.name = name
        self.pivot = Vector(pivot)
        self.parent = parent
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.verify()
        self.obj = None

    def _paint(self, faces, color):
        uv = atlas_uv(color)
        for face in faces:
            for loop in face.loops:
                loop[self.uv].uv = uv

    def _faces_of(self, verts):
        return {f for v in verts for f in v.link_faces}

    def _place(self, verts, loc, rot, scale):
        matrix = (
            Matrix.Translation(Vector(loc) - self.pivot)
            @ Euler(rot, "XYZ").to_matrix().to_4x4()
            @ Matrix.Diagonal((*scale, 1.0))
        )
        bmesh.ops.transform(self.bm, matrix=matrix, verts=verts)

    def box(self, size, loc, color, rot=(0, 0, 0)):
        verts = bmesh.ops.create_cube(self.bm, size=1.0)["verts"]
        self._place(verts, loc, rot, size)
        self._paint(self._faces_of(verts), color)
        return self

    def cone(self, r_bottom, r_top, height, loc, color, segments=6, rot=(0, 0, 0), caps=True):
        """Frustum centered on `loc`, axis along local Z. r_top=0 gives a cone."""
        verts = bmesh.ops.create_cone(
            self.bm,
            cap_ends=caps,
            cap_tris=False,
            segments=segments,
            radius1=r_bottom,
            radius2=r_top,
            depth=height,
        )["verts"]
        self._place(verts, loc, rot, (1, 1, 1))
        self._paint(self._faces_of(verts), color)
        return self

    def prism_yz(self, points, x0, x1, color):
        """Extrude a polygon given as (y, z) points along X from x0 to x1."""
        front = [self.bm.verts.new(Vector((x0, y, z)) - self.pivot) for y, z in points]
        back = [self.bm.verts.new(Vector((x1, y, z)) - self.pivot) for y, z in points]
        faces = [self.bm.faces.new(front[::-1]), self.bm.faces.new(back)]
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            faces.append(self.bm.faces.new((front[i], front[j], back[j], back[i])))
        bmesh.ops.recalc_face_normals(self.bm, faces=faces)
        self._paint(faces, color)
        return self

    def prism_xz(self, points, y0, y1, color):
        """Extrude a polygon given as (x, z) points along Y from y0 to y1."""
        front = [self.bm.verts.new(Vector((x, y0, z)) - self.pivot) for x, z in points]
        back = [self.bm.verts.new(Vector((x, y1, z)) - self.pivot) for x, z in points]
        faces = [self.bm.faces.new(front), self.bm.faces.new(back[::-1])]
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            faces.append(self.bm.faces.new((front[j], front[i], back[i], back[j])))
        bmesh.ops.recalc_face_normals(self.bm, faces=faces)
        self._paint(faces, color)
        return self

    def separate_coplanar(self, lift=0.006):
        """Removes z-fighting: a face lying exactly on an earlier face of a different colour (a window drawn flush with
        its wall, trim on trim) is pushed out along its normal by `lift` metres per layer, in creation order. Boxes and
        prisms share vertices, so the lifted face stretches its solid instead of opening a crack. Returns lifted count."""
        bm = self.bm
        bm.normal_update()
        bm.faces.ensure_lookup_table()
        color_of = lambda f: (round(f.loops[0][self.uv].uv.x, 4), round(f.loops[0][self.uv].uv.y, 4))
        faces = [(f, f.normal.dot(f.verts[0].co)) for f in bm.faces if f.calc_area() >= 1e-8]
        by_plane = {}
        for f, d in faces:
            by_plane.setdefault(int(round(d / 0.002)), []).append((f, d))
        levels = {}
        for f, d in sorted(faces, key=lambda it: it[0].index):
            level = 0
            k = int(round(d / 0.002))
            for kk in (k - 1, k, k + 1):
                for g, dg in by_plane.get(kk, []):
                    if g.index >= f.index or abs(d - dg) > 0.0015 or f.normal.dot(g.normal) < 0.9995:
                        continue
                    if color_of(g) == color_of(f) or not _polys_overlap(f, g):
                        continue
                    level = max(level, levels.get(g.index, 0) + 1)
            if level:
                levels[f.index] = level
        moves = {}
        for index, level in levels.items():
            f = bm.faces[index]
            for v in f.verts:
                moves[v.index] = moves.get(v.index, Vector((0, 0, 0))) + f.normal * (lift * level)
        bm.verts.ensure_lookup_table()
        for vi, offset in moves.items():
            bm.verts[vi].co += offset
        return len(levels)

    def finish(self):
        self.separate_coplanar()
        mesh = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(mesh)
        self.bm.free()
        for poly in mesh.polygons:
            poly.use_smooth = False
        mesh.materials.append(get_material())
        obj = bpy.data.objects.new(self.name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        _attach(obj, self.parent, self.pivot)
        self.obj = obj
        return obj


class Empty:
    def __init__(self, name, pivot=(0, 0, 0), parent=None):
        self.name = name
        self.pivot = Vector(pivot)
        self.obj = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(self.obj)
        _attach(self.obj, parent, self.pivot)


def _attach(obj, parent, pivot):
    if parent is not None:
        obj.parent = parent.obj
        obj.location = pivot - parent.pivot
    else:
        obj.location = pivot


def triangle_count(objects):
    total = 0
    for obj in objects:
        if obj.type == "MESH":
            obj.data.calc_loop_triangles()
            total += len(obj.data.loop_triangles)
    return total


def export_glb(filename, root_names, animations=False):
    """Export the named objects (children included) to assets-src/<filename>. Returns path.

    With animations=True, each NLA track name becomes one glTF animation clip.
    """
    path = os.path.join(SRC_DIR, filename)
    os.makedirs(SRC_DIR, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for name in root_names:
        bpy.data.objects[name].select_set(True)
        for child in bpy.data.objects[name].children_recursive:
            child.select_set(True)
    props = bpy.ops.export_scene.gltf.get_rna_type().properties
    kwargs = {
        "filepath": path,
        "use_selection": True,
        "export_format": "GLB",
        "export_apply": True,
        "export_yup": True,
    }
    if animations:
        modes = [i.identifier for i in props["export_animation_mode"].enum_items]
        kwargs["export_animations"] = True
        kwargs["export_animation_mode"] = "NLA_TRACKS" if "NLA_TRACKS" in modes else modes[0]
    else:
        kwargs["export_animations"] = False
    kwargs = {k: v for k, v in kwargs.items() if k in props}
    bpy.ops.export_scene.gltf(**kwargs)
    return path


def _key_rot(obj, frames, axis, amplitude, phase, cycles):
    steps = 8
    for i in range(steps + 1):
        t = i / steps
        rot = list(obj.rotation_euler)
        rot[axis] = amplitude * math.sin(2 * math.pi * cycles * t + phase)
        obj.rotation_euler = rot
        obj.keyframe_insert("rotation_euler", index=axis, frame=1 + t * frames)


def _key_bob(obj, frames, amplitude, base, cycles):
    steps = 8
    for i in range(steps + 1):
        t = i / steps
        obj.location.z = base + amplitude * math.sin(2 * math.pi * cycles * t)
        obj.keyframe_insert("location", index=2, frame=1 + t * frames)


def author_clips(clips):
    """Sinusoidal looping clips exported as one glTF animation each (NLA track name = clip name).

    clips = {"idle": {"frames": 60, "tracks": [
        {"obj": "tail1", "kind": "rot", "axis": 2, "amp": 0.05, "phase": 0.0},
        {"obj": "torso", "kind": "bob", "amp": 0.01}]}}
    """
    for clip, spec in clips.items():
        per_object = {}
        for track in spec["tracks"]:
            per_object.setdefault(track["obj"], []).append(track)
        touched = []
        for name, tracks in per_object.items():
            obj = bpy.data.objects[name]
            anim = obj.animation_data_create()
            action = bpy.data.actions.new(f"{clip}_{name}")
            anim.action = action
            base_z = obj.location.z
            for t in tracks:
                if t["kind"] == "rot":
                    _key_rot(obj, spec["frames"], t["axis"], t["amp"], t.get("phase", 0.0), t.get("cycles", 1))
                else:
                    _key_bob(obj, spec["frames"], t["amp"], base_z, t.get("cycles", 2))
            touched.append((anim, action))
        for anim, action in touched:
            track = anim.nla_tracks.new()
            track.name = clip
            track.strips.new(clip, 1, action)
            anim.action = None
    for obj in bpy.data.objects:
        obj.rotation_euler = (0, 0, 0)


def arch_opening(part, half_width, spring_z, top_z, y0, y1, fill_color, trim_color, trim_y, key_color="gold", segments=12, trim_w=0.32):
    """A round arch over an opening. Fills the corners between the arc and the lintel line (`top_z`) with a solid
    tympanum spanning y0..y1, and adds a trim ring of small blocks plus a keystone on the face at `trim_y`
    (pass the y of the outer face, nudged outward). The opening is a semicircle of radius `half_width`."""
    r = half_width
    pts = [(-r, spring_z)]
    for i in range(1, segments):
        a = math.pi - math.pi * i / segments
        pts.append((r * math.cos(a), spring_z + r * math.sin(a)))
    pts += [(r, spring_z), (r, top_z), (-r, top_z)]
    part.prism_xz(pts, y0, y1, fill_color)
    sign = -1 if trim_y < 0 else 1
    for i in range(segments):
        a = math.pi * (i + 0.5) / segments
        cx, cz = (r + trim_w / 2) * math.cos(a), spring_z + (r + trim_w / 2) * math.sin(a)
        chord = 2 * (r + trim_w / 2) * math.sin(math.pi / (2 * segments)) * 1.05
        part.box((chord, 0.16, trim_w), (cx, trim_y, cz), trim_color if i % 2 else fill_color, rot=(0, -(a + math.pi / 2), 0))
    part.box((0.5, 0.2, 0.55), (0, trim_y + sign * 0.02, spring_z + r + trim_w / 2), key_color)
