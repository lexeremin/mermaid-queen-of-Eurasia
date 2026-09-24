#!/usr/bin/env python3
"""Cuts the one voice sample the game uses (the sung "ah" of the Aura) from a local songs folder (not committed).

Usage: python3 tools/audio/extract-voice.py "/path/to/songs"
Needs ffmpeg. Output: public/assets/audio/rosa_aura.mp3 (mono, 32 kHz, 64 kbps, peak -2 dB).

The clip is 4 s of sustained voiced singing from "Vocalise" (voicing found by autocorrelation pitch tracking),
starting on a note onset. Attack, dash and surge sounds are synthesized in src/audio, not sampled.
"""

import os
import re
import subprocess
import sys

# (output name, source file stem, start seconds, duration seconds, fade-in, fade-out)
SAMPLES = [
    ("rosa_aura", "Vocalise", 22.45, 4.0, 0.03, 1.0),
]

PAD = 0.02
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "assets", "audio")


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def main(songs):
    os.makedirs(OUT, exist_ok=True)
    for name, stem, start, dur, fade_in, fade_out in SAMPLES:
        src = os.path.join(songs, stem + ".m4a")
        s = max(0.0, start - PAD)
        d = dur + 2 * PAD
        base = ["ffmpeg", "-v", "info", "-y", "-ss", f"{s:.3f}", "-t", f"{d:.3f}", "-i", src, "-ac", "1", "-ar", "32000"]
        probe = run(base + ["-af", "volumedetect", "-f", "null", "-"])
        peak = re.search(r"max_volume: (-?[\d.]+) dB", probe.stderr)
        gain = -2.0 - float(peak.group(1)) if peak else 0.0
        fade = f"afade=t=in:d={fade_in},afade=t=out:st={max(0.0, d - fade_out):.3f}:d={fade_out}"
        out = os.path.join(OUT, name + ".mp3")
        result = run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-t", f"{d:.3f}", "-i", src, "-ac", "1", "-ar", "32000",
                      "-af", f"volume={gain:.2f}dB,{fade}", "-c:a", "libmp3lame", "-b:a", "64k", out])
        if result.returncode != 0:
            sys.exit(result.stderr)
        print(f"{name}: {os.path.getsize(out) / 1024:.1f} KB (gain {gain:+.1f} dB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
