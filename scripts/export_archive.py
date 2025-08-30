#!/usr/bin/env python3
"""Export note archives to zip files in the export directory.

Usage:
    python scripts/export_archive.py path/to/note.md [--export-dir export]

The script looks for an `archive/` folder next to the note file and
compresses its contents into `export/<note-folder>-archive.zip`.
"""

from __future__ import annotations

import argparse
import pathlib
import zipfile


def export_archive(note_path: str, export_dir: str = "export") -> None:
    note_file = pathlib.Path(note_path).resolve()
    note_dir = note_file.parent
    archive_dir = note_dir / "archive"
    if not archive_dir.exists():
        print(f"No archive directory found for {note_file}")
        return

    export_root = pathlib.Path(export_dir)
    export_root.mkdir(parents=True, exist_ok=True)
    zip_path = export_root / f"{note_dir.name}-archive.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file in archive_dir.rglob("*"):
            if file.is_file():
                zf.write(file, file.relative_to(archive_dir))

    print(f"Archive exported to {zip_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Export note archives")
    parser.add_argument("note", help="Path to the note file")
    parser.add_argument("--export-dir", default="export", help="Destination directory")
    args = parser.parse_args()
    export_archive(args.note, args.export_dir)


if __name__ == "__main__":
    main()
