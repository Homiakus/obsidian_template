"""Core functionality for Vault Watcher."""

import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import yaml
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from .config import Config
from .logging import LoggerMixin, get_logger, log_event, log_error, log_file_operation


class HashDatabase:
    """Hash database for file deduplication."""
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = get_logger("HashDatabase")
        self.db_path = config.get_hash_db_path()
        self._load_database()
    
    def _load_database(self) -> None:
        """Load hash database from file."""
        if self.db_path.exists():
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    self.db = json.load(f)
                self.logger.info("hash_database_loaded", entries=len(self.db))
            except Exception as e:
                log_error(self.logger, "hash_database_load_failed", e)
                self.db = {}
        else:
            self.db = {}
    
    def _save_database(self) -> None:
        """Save hash database to file."""
        try:
            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(self.db, f, indent=2, ensure_ascii=False)
        except Exception as e:
            log_error(self.logger, "hash_database_save_failed", e)
    
    def calculate_hash(self, file_path: Path) -> str:
        """Calculate hash of a file."""
        hash_obj = hashlib.new(self.config.hash_database.algorithm)
        chunk_size = self.config.hash_database.chunk_size
        
        try:
            with open(file_path, "rb") as f:
                while chunk := f.read(chunk_size):
                    hash_obj.update(chunk)
            return hash_obj.hexdigest()
        except Exception as e:
            log_error(self.logger, "hash_calculation_failed", e, file_path=str(file_path))
            return ""
    
    def is_duplicate(self, file_path: Path) -> Optional[Path]:
        """Check if file is a duplicate."""
        file_hash = self.calculate_hash(file_path)
        if not file_hash:
            return None
        
        if file_hash in self.db:
            existing_path = Path(self.db[file_hash])
            if existing_path.exists():
                return existing_path
        
        return None
    
    def add_file(self, file_path: Path) -> None:
        """Add file to hash database."""
        file_hash = self.calculate_hash(file_path)
        if file_hash:
            self.db[file_hash] = str(file_path)
            self._save_database()
            log_event(self.logger, "file_added_to_hash_db", file_path=str(file_path), hash=file_hash)


class FileProcessor:
    """File processing and categorization."""
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = get_logger("FileProcessor")
        self.hash_db = HashDatabase(config)
        
        # Regular expressions for file categorization
        self.assignment_re = re.compile(r"([PRC]):([A-Za-z0-9\\-_]+)")
        self.name_mark_re = re.compile(r"\\[(P|R|C):([A-Za-z0-9\\-_]+)\\]")
        self.frontmatter_re = re.compile(r"^---\\n(.*?)\\n---", re.S)
    
    def detect_assignment(self, file_path: Path) -> Tuple[Optional[str], Optional[str]]:
        """Detect file assignment from path or filename."""
        # Check path structure
        parts = [p.name for p in file_path.resolve().parts]
        
        if self.config.folders.projects in parts:
            i = parts.index(self.config.folders.projects)
            if i + 1 < len(parts):
                return ("P", parts[i + 1])
        
        if self.config.folders.resources in parts and "parts" in parts:
            i = parts.index("parts")
            if i + 1 < len(parts):
                return ("R", parts[i + 1])
        
        if self.config.folders.categories in parts:
            i = parts.index(self.config.folders.categories)
            if i + 1 < len(parts):
                return ("C", parts[i + 1])
        
        # Check assignment file
        assign_file = file_path.with_suffix(file_path.suffix + ".assign")
        if assign_file.exists():
            try:
                content = assign_file.read_text(encoding="utf-8", errors="ignore")
                match = self.assignment_re.search(content)
                if match:
                    return (match.group(1), match.group(2))
            except Exception as e:
                log_error(self.logger, "assignment_file_read_failed", e, file_path=str(assign_file))
        
        # Check filename for marks
        match = self.name_mark_re.search(file_path.name)
        if match:
            return (match.group(1), match.group(2))
        
        return (None, None)
    
    def process_note_file(self, file_path: Path) -> Optional[Path]:
        """Process note file with frontmatter."""
        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            match = self.frontmatter_re.search(content)
            
            if match:
                frontmatter = yaml.safe_load(match.group(1)) or {}
                
                # Handle project notes
                if frontmatter.get("type") == "note" and frontmatter.get("project"):
                    project_code = frontmatter["project"]
                    dest_path = self.config.get_vault_path() / self.config.folders.projects / project_code / "notes" / file_path.name
                    return self._move_file(file_path, dest_path)
                
                # Handle category notes
                if frontmatter.get("type") == "note" and frontmatter.get("category"):
                    category_code = frontmatter["category"]
                    dest_path = self.config.get_vault_path() / self.config.folders.categories / category_code / "notes" / file_path.name
                    return self._move_file(file_path, dest_path)
        
        except Exception as e:
            log_error(self.logger, "note_processing_failed", e, file_path=str(file_path))
        
        return None
    
    def process_file(self, file_path: Path) -> Optional[Path]:
        """Process any file."""
        if not file_path.exists() or file_path.is_dir():
            return None
        
        # Skip hidden files
        if file_path.name.startswith("."):
            return None
        
        # Process note files
        if self.config.is_note_file(file_path):
            return self.process_note_file(file_path)
        
        # Detect assignment
        kind, code = self.detect_assignment(file_path)
        if not kind or not code:
            return None
        
        # Check for duplicates
        if self.config.processing.enable_hash_deduplication:
            duplicate = self.hash_db.is_duplicate(file_path)
            if duplicate:
                self.logger.info("duplicate_file_found", original=str(duplicate), duplicate=str(file_path))
                file_path.unlink(missing_ok=True)
                return None
        
        # Determine destination
        dest_path = self._get_destination_path(file_path, kind, code)
        if not dest_path:
            return None
        
        # Move file
        moved_path = self._move_file(file_path, dest_path)
        if moved_path:
            # Add to hash database
            if self.config.processing.enable_hash_deduplication:
                self.hash_db.add_file(moved_path)
            
            # Process 3D models
            if self.config.processing.enable_3d_conversion and self.config.is_model_file(moved_path):
                self._process_3d_model(moved_path, kind, code)
        
        return moved_path
    
    def _get_destination_path(self, file_path: Path, kind: str, code: str) -> Optional[Path]:
        """Get destination path for file."""
        vault_path = self.config.get_vault_path()
        
        if kind == "P":  # Project
            if self.config.is_model_file(file_path):
                return vault_path / self.config.folders.projects / code / "models" / "src" / file_path.name
            else:
                return vault_path / self.config.folders.projects / code / "assets" / file_path.name
        
        elif kind == "R":  # Resource/Part
            if self.config.is_model_file(file_path):
                return vault_path / self.config.folders.resources / "parts" / code / "models" / "src" / file_path.name
            else:
                return vault_path / self.config.folders.resources / "parts" / code / file_path.name
        
        elif kind == "C":  # Category
            return vault_path / self.config.folders.categories / code / "incoming" / file_path.name
        
        return None
    
    def _move_file(self, src_path: Path, dest_path: Path) -> Optional[Path]:
        """Move file atomically."""
        if self.config.general.dry_run:
            self.logger.info("dry_run_move", src=str(src_path), dest=str(dest_path))
            return dest_path
        
        try:
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Use atomic move
            with tempfile.NamedTemporaryFile(dir=str(dest_path.parent), delete=False) as tf:
                temp_path = Path(tf.name)
            
            shutil.copy2(src_path, temp_path)
            temp_path.replace(dest_path)
            
            # Remove original
            try:
                src_path.unlink()
            except Exception:
                pass
            
            log_file_operation(self.logger, "file_moved", dest_path, src=str(src_path))
            return dest_path
        
        except Exception as e:
            log_error(self.logger, "file_move_failed", e, src=str(src_path), dest=str(dest_path))
            return None
    
    def _process_3d_model(self, model_path: Path, kind: str, code: str) -> None:
        """Process 3D model conversion."""
        try:
            # Determine GLB output path
            if kind == "P":
                glb_path = model_path.parent.parent / "glb" / f"{model_path.stem}.glb"
            else:  # kind == "R"
                glb_path = model_path.parent.parent / "glb" / f"{model_path.stem}.glb"
            
            # Convert to GLB
            success, tool, output = self._convert_to_glb(model_path, glb_path)
            
            if success and glb_path.exists():
                # Sanitize GLB
                self._sanitize_gltf(glb_path)
                
                # Update meta files
                self._update_meta_files(kind, code, glb_path, model_path.stem)
            
            log_event(self.logger, "3d_model_processed", 
                     model_path=str(model_path), 
                     glb_path=str(glb_path), 
                     success=success, 
                     tool=tool)
        
        except Exception as e:
            log_error(self.logger, "3d_model_processing_failed", e, model_path=str(model_path))
    
    def _convert_to_glb(self, src_path: Path, dest_path: Path) -> Tuple[bool, str, str]:
        """Convert 3D model to GLB format."""
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Try conversion tools in order of preference
        tools = self.config.three_d_conversion.conversion_tools
        
        for tool in tools:
            if self._is_tool_available(tool):
                success, output = self._run_conversion_tool(tool, src_path, dest_path)
                if success:
                    return True, tool, output
        
        return False, "none", "no converter available"
    
    def _is_tool_available(self, tool: str) -> bool:
        """Check if conversion tool is available."""
        return shutil.which(tool) is not None
    
    def _run_conversion_tool(self, tool: str, src_path: Path, dest_path: Path) -> Tuple[bool, str]:
        """Run conversion tool."""
        try:
            if tool == "FBX2glTF":
                cmd = ["FBX2glTF", "-i", str(src_path), "-o", str(dest_path.with_suffix("")), "--binary", "--draco"]
            elif tool == "assimp":
                cmd = ["assimp", "export", str(src_path), str(dest_path)]
            elif tool == "blender":
                # Create Blender script
                script_path = dest_path.parent / "_blender_convert.py"
                script_path.write_text(self._get_blender_script(), encoding="utf-8")
                cmd = ["blender", "-b", "-P", str(script_path), "--", str(src_path), str(dest_path)]
            else:
                return False, f"unknown tool: {tool}"
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True, result.stdout
        
        except subprocess.CalledProcessError as e:
            return False, e.stdout
        except Exception as e:
            return False, str(e)
    
    def _get_blender_script(self) -> str:
        """Get Blender conversion script."""
        return '''
import bpy
import sys
import os

argv = sys.argv[sys.argv.index("--") + 1:]
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
    
    def _sanitize_gltf(self, glb_path: Path) -> None:
        """Sanitize GLB file."""
        if self.config.three_d_conversion.enable_validator and self._is_tool_available("gltf-validator"):
            try:
                subprocess.run(["gltf-validator", "--format", "STD", str(glb_path)], check=False)
            except Exception:
                pass
        
        if self.config.three_d_conversion.enable_gltfpack and self._is_tool_available("gltfpack"):
            try:
                packed_path = glb_path.with_name(f"{glb_path.stem}.packed.glb")
                result = subprocess.run([
                    "gltfpack", "-i", str(glb_path), "-o", str(packed_path),
                    "-cc", "-tc", "-kn", "-km"
                ], capture_output=True, text=True, check=True)
                
                if packed_path.exists():
                    packed_path.replace(glb_path)
            except Exception:
                pass
    
    def _update_meta_files(self, kind: str, code: str, glb_path: Path, model_name: str) -> None:
        """Update meta files with model viewer."""
        try:
            if kind == "P":
                meta_path = self.config.get_vault_path() / self.config.folders.projects / code / "_meta" / "project.md"
            else:  # kind == "R"
                meta_path = self.config.get_vault_path() / self.config.folders.resources / "parts" / code / "part.md"
            
            if meta_path.exists():
                content = meta_path.read_text(encoding="utf-8")
                rel_path = glb_path.relative_to(meta_path.parent)
                
                # Add model viewer if not already present
                viewer_block = f"""
### {model_name}
<model-viewer src="{rel_path}" camera-controls auto-rotate shadow-intensity="1" style="width:100%;max-width:900px;height:500px"></model-viewer>
"""
                
                if "## Модели" not in content:
                    content += "\n\n## Модели\n\n"
                
                if str(rel_path) not in content:
                    content += viewer_block
                    meta_path.write_text(content, encoding="utf-8")
        
        except Exception as e:
            log_error(self.logger, "meta_file_update_failed", e, meta_path=str(meta_path))


class VaultWatcher(LoggerMixin):
    """Main vault watcher class."""
    
    def __init__(self, config: Config):
        self.config = config
        self.processor = FileProcessor(config)
        self.observer = Observer()
        self.handler = VaultEventHandler(self.processor, self.logger)
        self._setup_watched_directories()
    
    def _setup_watched_directories(self) -> None:
        """Setup directories to watch."""
        vault_path = self.config.get_vault_path()
        watch_dirs = [
            vault_path / self.config.folders.inbox,
            vault_path / self.config.folders.ongoing,
            vault_path / self.config.folders.projects,
            vault_path / self.config.folders.categories,
            vault_path / self.config.folders.resources,
        ]
        
        for directory in watch_dirs:
            if directory.exists():
                self.observer.schedule(self.handler, str(directory), recursive=True)
                self.logger.info("directory_watch_added", directory=str(directory))
    
    def start(self) -> None:
        """Start watching for file changes."""
        self.observer.start()
        self.logger.info("vault_watcher_started")
    
    def stop(self) -> None:
        """Stop watching for file changes."""
        self.observer.stop()
        self.observer.join()
        self.logger.info("vault_watcher_stopped")
    
    def run(self) -> None:
        """Run the watcher in a loop."""
        self.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()


class VaultEventHandler(FileSystemEventHandler):
    """File system event handler."""
    
    def __init__(self, processor: FileProcessor, logger):
        self.processor = processor
        self.logger = logger
    
    def on_created(self, event) -> None:
        """Handle file creation events."""
        if not event.is_directory:
            file_path = Path(event.src_path)
            self.logger.info("file_created", file_path=str(file_path))
            self.processor.process_file(file_path)
    
    def on_modified(self, event) -> None:
        """Handle file modification events."""
        if not event.is_directory:
            file_path = Path(event.src_path)
            self.logger.info("file_modified", file_path=str(file_path))
            self.processor.process_file(file_path)