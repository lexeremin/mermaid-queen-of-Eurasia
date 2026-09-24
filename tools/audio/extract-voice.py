#!/usr/bin/env python3
"""Cuts Rosa's voice samples out of recordings in a local songs folder (not committed).

Usage: python3 tools/audio/extract-voice.py "/path/to/songs"
Needs ffmpeg. Output: public/assets/audio/*.mp3 (mono, 32 kHz, 64 kbps, peak -2 dB).

How the offsets were chosen (see docs/phases/phase-14c.md): every recording was analysed for voicing (pitch
by autocorrelation) and loudness. Attack cries are isolated 0.25-0.4 s sung notes with a clean onset and a
quick decay; special-attack cries are isolated 0.8-1.2 s strong high notes; the Aura song is 4 s of sustained
voiced singing from "Vocalise" starting on a note onset. Replace an entry to swap a sample.
"""

import os
import re
import subprocess
import sys

# (output name, source file stem, start seconds, duration seconds, fade-in, fade-out)
SAMPLES = [
    ("rosa_attack_1", "e4b90261-0b60-44ed-b04a-d7c36614ebd2", 15.6, 0.34, 0.005, 0.07),
    ("rosa_attack_2", "bf93da03-e449-467b-8f2b-4dc708c7ae60", 5.34, 0.38, 0.005, 0.07),
    ("rosa_attack_3", "till our wedding day", 13.44, 0.27, 0.005, 0.07),
    ("rosa_attack_4", "4d5983a7-2bdf-4342-99db-e29b525b7290", 19.95, 0.41, 0.005, 0.08),
    ("rosa_spell_1", "6efcd05e-efda-4f1a-b1c7-eba870c13957", 38.44, 0.81, 0.005, 0.15),
    ("rosa_spell_2", "65933793-8960-4489-8903-ce334c59299d", 47.39, 1.17, 0.005, 0.2),
    ("rosa_aura_1", "Vocalise", 22.45, 4.0, 0.03, 1.0),
    ("rosa_aura_2", "Vocalise", 4.91, 4.0, 0.03, 1.0),
    ("rosa_aura_3", "Vocalise", 11.31, 4.0, 0.03, 1.0),
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
