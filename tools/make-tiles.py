"""Generates tiling ground textures in palette colors: public/assets/atlas/{cobble,grass}_tile.png (128x128 tiles).

Usage: python3 tools/make-tiles.py   (standard library only)
Outputs cobble_atlas.png (four 128x128 paving variants in a 2x2 grid) and grass_tile.png (128x128).
Cobble: rounded stones in 16 px rows (20-30 px wide), each with its own tone and a soft dome shade (from the signed distance
to the stone's edge, so the rounding is smooth and anti-aliased), grout
in the darkest wet tone with a little moss. Grass: smooth two-octave noise blended between three greens, short
anti-aliased blades and a few soft flowers. Every tile wraps seamlessly. Colours only ever blend between palette
entries, and the atlas cells are far enough apart for mipmapping not to leak one variant into the next (the game
insets the sampled area by half a texel). The game samples both with mipmaps and anisotropic filtering.
"""

import json
import math
import random
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIZE = 128
ROW_H = 16
GRAIN = 1.5  # half grout width
CORNER = 5.0
GROUT = "wet_dark"
STONE_TONES = ["wet_stone", "cobble_dark", "wet_stone", "slate", "wet_stone", "cobble_dark", "slate", "wet_stone", "cobble_dark", "slate"]


def rgb(hex_value):
    h = hex_value.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def shade(color, k):
    return tuple(max(0.0, min(255.0, c * k)) for c in color)


def smoothstep(lo, hi, x):
    t = max(0.0, min(1.0, (x - lo) / (hi - lo)))
    return t * t * (3 - 2 * t)


class Noise:
    """Tileable value noise: `cells` lattice points across the tile, smooth interpolation."""

    def __init__(self, rng, cells):
        self.cells = cells
        self.grid = [[rng.random() for _ in range(cells)] for _ in range(cells)]

    def at(self, x, y):
        gx, gy = x / SIZE * self.cells, y / SIZE * self.cells
        x0, y0 = int(math.floor(gx)), int(math.floor(gy))
        fx, fy = gx - x0, gy - y0
        fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
        n = self.cells
        a, b = self.grid[y0 % n][x0 % n], self.grid[y0 % n][(x0 + 1) % n]
        c, d = self.grid[(y0 + 1) % n][x0 % n], self.grid[(y0 + 1) % n][(x0 + 1) % n]
        return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def stone_widths(rng):
    widths, total = [], 0
    while total < SIZE:
        w = rng.randint(20, 30)
        if SIZE - (total + w) < 20:
            w = SIZE - total
        widths.append(w)
        total += w
    return widths


def rounded_box(px, py, x0, y0, w, h):
    """Signed distance from (px, py) to a rounded box (negative inside)."""
    cx, cy = x0 + w / 2, y0 + h / 2
    qx, qy = abs(px - cx) - (w / 2 - CORNER), abs(py - cy) - (h / 2 - CORNER)
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - CORNER


def cobble(colors, seed=21):
    rng = random.Random(seed)
    rows = []
    for row in range(SIZE // ROW_H):
        y0 = row * ROW_H
        x = 0  # every row has a joint on the tile edge, so tiles flipped at random still meet at a joint
        for w in stone_widths(rng):
            tone = rng.choice(STONE_TONES)
            rows.append((x, y0, w, tone, rng.uniform(0.94, 1.06)))
            x += w
    grout = rgb(colors[GROUT])
    moss = rgb(colors["moss"])
    speck = Noise(random.Random(seed + 100), 32)
    patch = Noise(random.Random(seed + 200), 8)
    out = [[(0, 0, 0, 255)] * SIZE for _ in range(SIZE)]
    # For every pixel, find the stone whose (wrapped) rounded box is nearest.
    stones = [(x, y0, w, ROW_H, tone, k) for x, y0, w, tone, k in rows]
    for y in range(SIZE):
        for x in range(SIZE):
            best, best_d = None, 1e9
            for sx, sy, sw, sh, tone, k in stones:
                for ox in (-SIZE, 0, SIZE):
                    px = x + 0.5 + ox
                    if px < sx - 3 or px > sx + sw + 3:
                        continue
                    for oy in (-SIZE, 0, SIZE):
                        py = y + 0.5 + oy
                        if py < sy - 3 or py > sy + sh + 3:
                            continue
                        d = rounded_box(px, py, sx + GRAIN, sy + GRAIN, sw - 2 * GRAIN, sh - 2 * GRAIN)
                        if d < best_d:
                            best, best_d = (sx, sy, sw, sh, tone, k, px, py), d
            base = mix(grout, moss, smoothstep(0.62, 0.8, patch.at(x, y)) * 0.55)
            base = shade(base, 0.9 + 0.2 * speck.at(x, y))
            if best is None:
                out[y][x] = tuple(int(c) for c in base) + (255,)
                continue
            sx, sy, sw, sh, tone, k, px, py = best
            cover = max(0.0, min(1.0, 0.5 - best_d))
            stone = rgb(colors[tone])
            # Soft dome: lighter in the middle, darker toward the grout. Symmetric on purpose: the ground autotiler
            # flips tiles at random, and a lit top-left rim would flip with them and show as seams.
            dome = smoothstep(0.0, 5.5, -best_d)
            lit = k * (0.84 + 0.2 * dome) * (0.94 + 0.12 * speck.at(x + 17, y + 5))
            color = shade(stone, lit)
            color = mix(base, color, cover)
            out[y][x] = tuple(int(round(c)) for c in color) + (255,)
    return out


def grass(colors):
    rng = random.Random(7)
    coarse, fine = Noise(rng, 8), Noise(rng, 16)
    dark, mid, light = rgb(colors["grass_dark"]), rgb(colors["grass"]), rgb(colors["leaf"])
    pix = [[None] * SIZE for _ in range(SIZE)]
    for y in range(SIZE):
        for x in range(SIZE):
            n = 0.65 * coarse.at(x, y) + 0.35 * fine.at(x + 31, y + 11)
            c = mix(dark, mid, smoothstep(0.30, 0.50, n))
            c = mix(c, light, smoothstep(0.58, 0.78, n))
            pix[y][x] = list(c)

    def stamp(cx, cy, color, alpha):
        ix, iy = int(math.floor(cx)), int(math.floor(cy))
        for dy in (0, 1):
            for dx in (0, 1):
                wx = 1 - abs(cx - (ix + dx + 0.5)) if abs(cx - (ix + dx + 0.5)) < 1 else 0
                wy = 1 - abs(cy - (iy + dy + 0.5)) if abs(cy - (iy + dy + 0.5)) < 1 else 0
                a = alpha * wx * wy
                p = pix[(iy + dy) % SIZE][(ix + dx) % SIZE]
                for i in range(3):
                    p[i] += (color[i] - p[i]) * a

    blade_light, blade_dark = rgb(colors["leaf"]), rgb(colors["leaf_dark"])
    for _ in range(110):
        x, y = rng.uniform(0, SIZE), rng.uniform(0, SIZE)
        ang = math.radians(-90 + rng.uniform(-28, 28))
        color = blade_light if rng.random() < 0.55 else blade_dark
        length = rng.uniform(3.0, 5.5)
        for i in range(int(length * 2)):
            t = i / (length * 2)
            stamp(x + math.cos(ang) * t * length, y + math.sin(ang) * t * length, color, 0.55 * (1 - t * 0.7))
    for _ in range(11):
        x, y = rng.uniform(0, SIZE), rng.uniform(0, SIZE)
        color = rgb(colors[rng.choice(["flower_yellow", "flower_yellow", "flower_red", "snow"])])
        for dx, dy, a in ((0, 0, 0.95), (1, 0, 0.5), (-1, 0, 0.5), (0, 1, 0.5), (0, -1, 0.5)):
            stamp(x + dx, y + dy, color, a)
    return [[tuple(int(round(c)) for c in px) + (255,) for px in row] for row in pix]


def write_png(path, pixels):
    height, width = len(pixels), len(pixels[0])
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in pixels)

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def atlas(tiles):
    """2x2 atlas of tiles (row-major): variants of the same paving, so the ground autotiler can vary it per block."""
    size = len(tiles[0])
    out = []
    for row in range(2):
        for y in range(size):
            out.append(tiles[row * 2][y] + tiles[row * 2 + 1][y])
    return out


if __name__ == "__main__":
    colors = json.loads((ROOT / "tools" / "palette.json").read_text())["colors"]
    out_dir = ROOT / "public" / "assets" / "atlas"
    outputs = {
        "cobble_atlas": atlas([cobble(colors, seed) for seed in (21, 22, 23, 24)]),
        "grass_tile": grass(colors),
    }
    for name, pixels in outputs.items():
        out = out_dir / f"{name}.png"
        write_png(out, pixels)
        print(f"wrote {out} ({out.stat().st_size} bytes)")
