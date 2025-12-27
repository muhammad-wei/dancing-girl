#!/usr/bin/env python3
"""Build a single JSON bundle of ASCII frames for faster loading."""

from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    frames_dir = repo_root / "assets" / "img" / "dancing" / "dancing_ascii"
    if not frames_dir.exists():
        raise SystemExit(f"Frames directory not found: {frames_dir}")

    frame_files = sorted(frames_dir.glob("dancing_*.txt"))
    if not frame_files:
        raise SystemExit("No ASCII frames found.")

    frames = [path.read_text(encoding="ascii") for path in frame_files]
    output_path = frames_dir / "frames.json"
    output_path.write_text(
        json.dumps(frames, ensure_ascii=True, separators=(",", ":")),
        encoding="ascii",
    )

    print(f"Wrote {len(frames)} frames to {output_path}")


if __name__ == "__main__":
    main()
