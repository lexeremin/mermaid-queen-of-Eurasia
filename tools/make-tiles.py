"""Generates tiling ground textures in palette colors: public/assets/atlas/{cobble,grass}_tile.png (32x32).

Usage: python3 tools/make-tiles.py   (standard library only)
Cobble: 8 px stones, alternate rows offset by 4 px, 1 px grout. Grass: seeded speckle of leaf tones.
"""

import json
import random
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIZE = 32
STONE_W, STONE_H = 8, 8
STONE_COLORS = ["wet_stone", "cobble_dark", "wet_stone", "slate", "wet_stone", "cobble_dark", "slate", "wet_stone"]
GROUT = "wet_dark"


def rgb(hex_value):
    h = hex_value.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def cobble(colors):
    pixels = []
    for y in range(SIZE):
        row = y // STONE_H
        offset = 4 if row % 2 else 0
        line = []
        for x in range(SIZE):
            sx = (x + offset) % SIZE
            col = sx // STONE_W
            in_grout = (y % STONE_H == 0) or (sx % STONE_W == 0)
            name = GROUT if in_grout else STONE_COLORS[(row * 5 + col * 3) % len(STONE_COLORS)]
            line.append(rgb(colors[name]) + (255,))
        pixels.append(line)
    return pixels


def grass(colors):
    rng = random.Random(7)
    pixels = []
    for _ in range(SIZE):
        line = []
        for _ in range(SIZE):
            roll = rng.random()
            name = "grass"
            if roll < 0.22:
                name = "grass_dark"
            elif roll < 0.34:
                name = "leaf"
            elif roll < 0.345:
                name = "flower_yellow"
            line.append(rgb(colors[name]) + (255,))
        pixels.append(line)
    return pixels


def write_png(path, pixels):
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in pixels)

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


if __name__ == "__main__":
    colors = json.loads((ROOT / "tools" / "palette.json").read_text())["colors"]
    out_dir = ROOT / "public" / "assets" / "atlas"
    for name, build in (("cobble_tile", cobble), ("grass_tile", grass)):
        out = out_dir / f"{name}.png"
        write_png(out, build(colors))
        print(f"wrote {out} ({out.stat().st_size} bytes)")
