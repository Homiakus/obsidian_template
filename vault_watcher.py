#!/usr/bin/env python3
# vault_watcher.py — idempotent file/router + 3D pipeline
import os, re, sys, time, json, yaml, shutil, tempfile, hashlib, uuid, datetime, subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

CONFIG = {
  "vault": "/path/to/Vault",
  "confidential_root": None,
  "hash_db": "9_ADMIN/hash_index.json",
  "log_dir": "9_ADMIN/logs",
  "dry_run": False,
  "gltf": {
    "enable_validator": True,
    "enable_gltfpack": True,
    "axis": "+Yup",
    "units": "mm",
    "default_scale": 0.001
  },
  "routes": {
    "project_notes": "1_PROJECTS/{code}/notes",
    "project_models_src": "1_PROJECTS/{code}/models/src",
    "project_models_glb": "1_PROJECTS/{code}/models/glb",
    "project_meta": "1_PROJECTS/{code}/_meta/project.md",
    "category_notes": "2_CATEGORIES/{code}/notes",
    "category_incoming": "2_CATEGORIES/{code}/incoming",
    "category_meta": "2_CATEGORIES/{code}/_meta/meta.md",
    "part_models_src": "3_RESOURCES/parts/{code}/models/src",
    "part_models_glb": "3_RESOURCES/parts/{code}/models/glb",
    "part_meta": "3_RESOURCES/parts/{code}/part.md"
  }
}

MODEL_EXTS = {".stl",".obj",".fbx",".dae",".ply",".gltf",".glb",".3ds",".blend",".step",".stp",".iges",".igs"}
NOTE_EXTS = {".md"}
ASSIGN_RE = re.compile(r"([PRC]):([A-Za-z0-9\\-_]+)")
NAME_MARK_RE = re.compile(r"\\[(P|R|C):([A-Za-z0-9\\-_]+)\\]")
FM_RE = re.compile(r"^---\\n(.*?)\\n---", re.S)

def vpath(*parts):
    return Path(CONFIG["vault"]).joinpath(*parts)

def log_event(op, **kw):
    ts = datetime.datetime.utcnow().isoformat() + "Z"
    op_id = uuid.uuid4().hex[:26]
    log_dir = vpath(CONFIG["log_dir"])
    log_dir.mkdir(parents=True, exist_ok=True)
    entry = {"ts":ts,"op_id":op_id,"op":op, **kw}
    (log_dir / (datetime.date.today().isoformat()+".log.jsonl")).write_text(
        ((log_dir / (datetime.date.today().isoformat()+".log.jsonl")).read_text(encoding="utf-8", errors="ignore") if (log_dir / (datetime.date.today().isoformat()+".log.jsonl")).exists() else "") + json.dumps(entry, ensure_ascii=False)+"\n",
        encoding="utf-8"
    )

def sha256(p: Path, chunk=1024*1024):
    h = hashlib.sha256()
    with p.open('rb') as f:
        while True:
            b = f.read(chunk)
            if not b: break
            h.update(b)
    return h.hexdigest()

def load_hash_db():
    p = vpath(CONFIG["hash_db"])
    if p.exists():
        try: return json.loads(p.read_text(encoding="utf-8"))
        except Exception: return {}
    return {}

def save_hash_db(db):
    p = vpath(CONFIG["hash_db"])
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(db, indent=2, ensure_ascii=False), encoding="utf-8")

def which(cmd):
    from shutil import which as _w
    return _w(cmd)

def run_cmd(cmd):
    try:
        out = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=True, text=True)
        return True, out.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stdout

def atomic_move(src: Path, dest: Path):
    if CONFIG["dry_run"]:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=str(dest.parent), delete=False) as tf:
        tmp = Path(tf.name)
    shutil.copy2(src, tmp)
    tmp.replace(dest)
    try:
        src.unlink()
    except Exception:
        pass

def ensure_meta(kind, code):
    if kind == 'P':
        md = vpath(CONFIG["routes"]["project_meta"].format(code=code))
        if not md.exists():
            md.parent.mkdir(parents=True, exist_ok=True)
            md.write_text(f"---\nschema: v1\ntype: project\ncode: {code}\ntitle: {code}\nstatus: active\ncreated: {datetime.date.today()}\n---\n# {code}\n\n## Модели\n", encoding="utf-8")
    elif kind == 'R':
        md = vpath(CONFIG["routes"]["part_meta"].format(code=code))
        if not md.exists():
            md.parent.mkdir(parents=True, exist_ok=True)
            md.write_text(f"---\nschema: v1\ntype: part\ncode: {code}\ntitle: {code}\ncreated: {datetime.date.today()}\n---\n# {code}\n\n## Модели\n", encoding="utf-8")
    elif kind == 'C':
        md = vpath(CONFIG["routes"]["category_meta"].format(code=code))
        if not md.exists():
            md.parent.mkdir(parents=True, exist_ok=True)
            md.write_text(f"---\nschema: v1\ntype: category\ncode: {code}\ntitle: {code}\nstatus: active\ncreated: {datetime.date.today()}\n---\n# {code}\n\n## Назначение\n\n## Подкатегории\n\n## Проекты (активные)\n", encoding="utf-8")

def detect_assignment(path: Path):
    parts = [p.name for p in path.resolve().parts]
    if "1_PROJECTS" in parts:
        i = parts.index("1_PROJECTS")
        if i+1 < len(parts):
            return ('P', parts[i+1])
    if "3_RESOURCES" in parts and "parts" in parts:
        i = parts.index("parts")
        if i+1 < len(parts):
            return ('R', parts[i+1])
    if "2_CATEGORIES" in parts:
        i = parts.index("2_CATEGORIES")
        if i+1 < len(parts):
            return ('C', parts[i+1])
    assign = path.with_suffix(path.suffix + ".assign")
    if assign.exists():
        m = ASSIGN_RE.search(assign.read_text(encoding="utf-8", errors="ignore"))
        if m: return (m.group(1), m.group(2))
    m2 = NAME_MARK_RE.search(path.name)
    if m2: return (m2.group(1), m2.group(2))
    return (None, None)

def insert_model_block(md_path: Path, rel_glb: str, title: str):
    lock = md_path.with_suffix(md_path.suffix + ".lock")
    if lock.exists() and time.time() - lock.stat().st_mtime < 120:
        return  # отложим, чтобы не конфликтовать
    try:
        lock.write_text("lock", encoding="utf-8")
        txt = md_path.read_text(encoding="utf-8") if md_path.exists() else ""
        if "## Модели" not in txt:
            txt += "\n\n## Модели\n\n"
        if rel_glb in txt:
            return
        block = f"\n### {title}\n<model-viewer src=\"{rel_glb}\" camera-controls auto-rotate shadow-intensity=\"1\" style=\"width:100%;max-width:900px;height:500px\"></model-viewer>\n"
        txt += block
        md_path.write_text(txt, encoding="utf-8")
    finally:
        try: lock.unlink()
        except Exception: pass

def convert_to_glb(src: Path, out_glb: Path):
    out_glb.parent.mkdir(parents=True, exist_ok=True)
    # priority: FBX2glTF -> assimp -> blender
    if which("FBX2glTF"):
        ok, log = run_cmd(["FBX2glTF","-i",str(src),"-o",str(out_glb.with_suffix("")),"--binary","--draco"])
        return ok, "FBX2glTF", log
    if which("assimp"):
        ok, log = run_cmd(["assimp","export",str(src),str(out_glb)])
        return ok, "assimp", log
    if which("blender"):
        helper = out_glb.parent / "_blender_convert.py"
        helper.write_text(BLENDER_CONVERT_SCRIPT, encoding="utf-8")
        ok, log = run_cmd(["blender","-b","-P",str(helper),"--",str(src),str(out_glb)])
        try: helper.unlink()
        except: pass
        return ok, "blender", log
    return False, "none", "no converter in PATH"

def sanitize_gltf(glb_path: Path):
    if CONFIG["gltf"]["enable_validator"] and which("gltf-validator"):
        run_cmd(["gltf-validator","--format","STD",str(glb_path)])
    if CONFIG["gltf"]["enable_gltfpack"] and which("gltfpack"):
        out = glb_path.with_name(glb_path.stem + ".packed.glb")
        ok, log = run_cmd(["gltfpack","-i",str(glb_path),"-o",str(out),"-cc","-tc","-kn","-km"])
        if ok and out.exists():
            out.replace(glb_path)

BLENDER_CONVERT_SCRIPT = r'''
import bpy, sys, os
argv = sys.argv[sys.argv.index("--")+1:]
src, out_glb = argv
bpy.ops.wm.read_factory_settings(use_empty=True)
ext = os.path.splitext(src)[1].lower()
try:
    if ext == ".obj":
        bpy.ops.wm.obj_import(filepath=src)
    elif ext == ".stl":
        bpy.ops.wm.stl_import(filepath=src)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=src)
    elif ext == ".dae":
        bpy.ops.wm.collada_import(filepath=src)
    else:
        bpy.ops.wm.append(filepath=src)
except Exception as e:
    print("IMPORT ERROR:", e)
bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB')
'''

class Handler(FileSystemEventHandler):
    def __init__(self):
        self.hash_index = load_hash_db()
    def process(self, p: Path):
        if p.is_dir(): return
        if p.name.startswith("."): return
        # markdown routing
        if p.suffix.lower() in NOTE_EXTS:
            try:
                txt = p.read_text(encoding="utf-8", errors="ignore")
                m = FM_RE.search(txt)
                if m:
                    fm = yaml.safe_load(m.group(1)) or {}
                else:
                    fm = {}
            except Exception:
                fm = {}
            if fm.get("type") == "note" and fm.get("project"):
                dest = vpath(CONFIG["routes"]["project_notes"].format(code=fm["project"])) / p.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                if str(dest) != str(p):
                    atomic_move(p, dest)
                    log_event("move", src=str(p), dst=str(dest), project=fm["project"])
                return
            if fm.get("type") == "note" and fm.get("category"):
                dest = vpath(CONFIG["routes"]["category_notes"].format(code=fm["category"])) / p.name
                dest.parent.mkdir(parents=True, exist_ok=True)
                if str(dest) != str(p):
                    atomic_move(p, dest)
                    log_event("move", src=str(p), dst=str(dest), category=fm["category"])
                return
        # other files
        kind, code = detect_assignment(p)
        if not kind or not code:
            return
        ensure_meta(kind, code)
        # dedup by hash
        try:
            digest = sha256(p)
        except Exception:
            digest = None
        target = None
        if kind == 'P':
            if p.suffix.lower() in MODEL_EXTS:
                target = vpath(CONFIG["routes"]["project_models_src"].format(code=code)) / p.name
            else:
                target = vpath("1_PROJECTS", code, "assets", p.name)
        elif kind == 'R':
            if p.suffix.lower() in MODEL_EXTS:
                target = vpath(CONFIG["routes"]["part_models_src"].format(code=code)) / p.name
            else:
                target = vpath("3_RESOURCES","parts",code,p.name)
        elif kind == 'C':
            target = vpath(CONFIG["routes"]["category_incoming"].format(code=code)) / p.name
        if target:
            if digest and digest in self.hash_index and Path(self.hash_index[digest]).exists():
                # duplicate content -> drop
                p.unlink(missing_ok=True)
                log_event("dedup", src=str(p), dst=self.hash_index[digest])
                return
            atomic_move(p, target)
            if digest:
                self.hash_index[digest] = str(target)
                save_hash_db(self.hash_index)
            log_event("move", src=str(p), dst=str(target), kind=kind, code=code)
        # if model -> convert and embed
        if target and target.suffix.lower() in MODEL_EXTS and kind in ('P','R'):
            glb = target.parent.parent / "glb" / (target.stem + ".glb")
            ok, tool, out = convert_to_glb(target, glb)
            log_event("convert", src=str(target), dst=str(glb), tool=tool, ok=ok)
            if ok and glb.exists():
                sanitize_gltf(glb)
                # insert viewer
                if kind == 'P':
                    md = vpath(CONFIG["routes"]["project_meta"].format(code=code))
                else:
                    md = vpath(CONFIG["routes"]["part_meta"].format(code=code))
                rel = os.path.relpath(glb, md.parent)
                insert_model_block(md, rel, target.stem)

    def on_created(self, e): 
        self.process(Path(e.src_path))
    def on_modified(self, e):
        self.process(Path(e.src_path))

def main():
    vault = Path(CONFIG["vault"])
    if not vault.exists():
        print("Set CONFIG['vault'] to your Obsidian vault path.")
        sys.exit(1)
    obs = Observer()
    handler = Handler()
    for d in [vault / "0_INBOX", vault / "_ONGOING", vault / "1_PROJECTS", vault / "2_CATEGORIES", vault / "3_RESOURCES"]:
        if d.exists():
            obs.schedule(handler, str(d), recursive=True)
    obs.start()
    print("Watcher started.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        obs.stop()
    obs.join()

if __name__ == "__main__":
    main()
