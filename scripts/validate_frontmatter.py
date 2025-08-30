#!/usr/bin/env python3
import sys, re, json, yaml, pathlib
from jsonschema import validate, ValidationError

HERE = pathlib.Path(__file__).resolve().parents[1]
SCHEMAS = {
    "project": HERE / "schemas" / "project.json",
    "category": HERE / "schemas" / "category.json",
    "part": HERE / "schemas" / "part.json",
    "source": HERE / "schemas" / "source.json",
    "note": HERE / "schemas" / "note.json",
}
FM_RE = re.compile(r"^---\n(.*?)\n---", re.S)

def load_json(p): 
    return json.loads(p.read_text(encoding="utf-8"))

def main(files):
    ok = True
    cache = {k: load_json(v) for k, v in SCHEMAS.items()}
    for f in files:
        text = pathlib.Path(f).read_text(encoding="utf-8", errors="ignore")
        m = FM_RE.search(text)
        if not m: 
            continue
        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except Exception as e:
            print(f"[YAML ERROR] {f}: {e}")
            ok = False
            continue
        t = fm.get("type")
        if t in cache:
            try:
                validate(instance=fm, schema=cache[t])
            except ValidationError as e:
                print(f"[SCHEMA FAIL] {f}: {e.message}")
                ok = False
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main(sys.argv[1:])
