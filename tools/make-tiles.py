"""Generates tiling ground textures in palette colors: public/assets/atlas/{cobble,grass}_tile.png (64x64).

Usage: python3 tools/make-tiles.py   (standard library only)
Outputs cobble_atlas.png (four 64x64 paving variants in a 2x2 grid) and grass_tile.png (64x64).
Cobble: irregular stones in 8 px rows (10-14 px wide), each with its own tone, a lit top-left edge, a dark
bottom-right edge, 1 px grout with the odd fleck of moss. Grass: soft clumps of three greens with short blades
and a few flowers. Both wrap seamlessly. The game samples them with mipmaps and anisotropic filtering so they
do not shimmer at a distance (see MapScene.tsx).
"""

import json
import random
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIZE = 64
ROW_H = 8
GROUT = "wet_dark"
STONE_TONES = ["wet_stone", "cobble_dark", "wet_stone", "slate", "wet_stone", "cobble_dark", "slate", "wet_stone", "cobble_dark", "slate"]
LIGHT_EDGE = {"wet_stone": "cobble_dark", "cobble_dark": "wet_stone", "slate": "wet_stone"}
DARK_EDGE = {"wet_stone": "slate", "cobble_dark": "wet_dark", "slate": "wet_dark"}


def rgb(hex_value):
    h = hex_value.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def stone_widths(rng):
    widths, total = [], 0
    while total < SIZE:
        w = rng.randint(10, 14)
        if SIZE - (total + w) < 10:
            w = SIZE - total
        widths.append(w)
        total += w
    return widths


def cobble(colors, seed=21):
    rng = random.Random(seed)
    names = [[GROUT] * SIZE for _ in range(SIZE)]
    for row in range(SIZE // ROW_H):
        y0 = row * ROW_H
        x = rng.randint(0, 9)
        for w in stone_widths(rng):
            tone = rng.choice(STONE_TONES)
            for dy in range(1, ROW_H):
                for dx in range(1, w):
                    name = tone
                    if dy == 1:
                        name = LIGHT_EDGE[tone]
                    elif dy == ROW_H - 1 or dx == w - 1:
                        name = DARK_EDGE[tone]
                    names[(y0 + dy) % SIZE][(x + dx) % SIZE] = name
            for _ in range(rng.randint(0, 3)):
                names[(y0 + rng.randint(2, ROW_H - 2)) % SIZE][(x + rng.randint(2, max(2, w - 2))) % SIZE] = rng.choice(["wet_dark", "slate", "cobble_dark"])
            x += w
    for _ in range(26):
        gx, gy = rng.randrange(SIZE), rng.randrange(SIZE)
        if names[gy][gx] == GROUT:
            names[gy][gx] = "moss"
    return [[rgb(colors[names[y][x]]) + (255,) for x in range(SIZE)] for y in range(SIZE)]


def grass(colors):
    rng = random.Random(7)
    cell = 8
    grid = [[rng.random() for _ in range(SIZE // cell)] for _ in range(SIZE // cell)]

    def clump(x, y):
        gx, gy = x / cell, y / cell
        x0, y0 = int(gx) % (SIZE // cell), int(gy) % (SIZE // cell)
        x1, y1 = (x0 + 1) % (SIZE // cell), (y0 + 1) % (SIZE // cell)
        fx, fy = gx - int(gx), gy - int(gy)
        top = grid[y0][x0] * (1 - fx) + grid[y0][x1] * fx
        bottom = grid[y1][x0] * (1 - fx) + grid[y1][x1] * fx
        return top * (1 - fy) + bottom * fy

    names = [["grass"] * SIZE for _ in range(SIZE)]
    for y in range(SIZE):
        for x in range(SIZE):
            v = clump(x, y) + rng.uniform(-0.18, 0.18)
            names[y][x] = "grass_dark" if v < 0.32 else "leaf" if v > 0.68 else "grass"
    for _ in range(70):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        names[y][x] = "leaf"
        names[(y - 1) % SIZE][x] = "leaf"
    for _ in range(40):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        names[y][x] = "leaf_dark"
    for _ in range(9):
        x, y = rng.randrange(SIZE), rng.randrange(SIZE)
        names[y][x] = rng.choice(["flower_yellow", "flower_yellow", "flower_red", "snow"])
    return [[rgb(colors[names[y][x]]) + (255,) for x in range(SIZE)] for y in range(SIZE)]


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
