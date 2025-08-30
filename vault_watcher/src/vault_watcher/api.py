"""API for Vault Watcher using FastAPI."""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from .config import Config
from .core import VaultWatcher
from .logging import get_logger, setup_logging


class FileInfo(BaseModel):
    """File information model."""
    
    name: str
    path: str
    size: int
    file_type: str
    modified: datetime
    is_directory: bool


class VaultStatus(BaseModel):
    """Vault status model."""
    
    vault_path: str
    total_files: int
    total_size: int
    projects: int
    categories: int
    resources: int
    models: int
    notes: int
    documents: int
    images: int
    watcher_running: bool


class ProcessingResult(BaseModel):
    """Processing result model."""
    
    success: bool
    message: str
    file_path: Optional[str] = None
    destination_path: Optional[str] = None


class ConfigurationUpdate(BaseModel):
    """Configuration update model."""
    
    section: str
    key: str
    value: Any


class VaultWatcherAPI:
    """FastAPI application for Vault Watcher."""
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = get_logger("API")
        self.watcher: Optional[VaultWatcher] = None
        self.watcher_task: Optional[asyncio.Task] = None
        
        # Create FastAPI app
        self.app = FastAPI(
            title="Vault Watcher API",
            description="API for Vault Watcher - Obsidian-like file management system",
            version="0.1.0",
            docs_url="/docs",
            redoc_url="/redoc",
        )
        
        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=self.config.api.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self.setup_routes()
    
    def setup_routes(self):
        """Setup API routes."""
        
        @self.app.get("/")
        async def root():
            """Root endpoint."""
            return {
                "name": "Vault Watcher API",
                "version": "0.1.0",
                "status": "running"
            }
        
        @self.app.get("/health")
        async def health():
            """Health check endpoint."""
            return {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "watcher_running": self.watcher is not None and self.watcher_task is not None
            }
        
        @self.app.get("/vault/status", response_model=VaultStatus)
        async def get_vault_status():
            """Get vault status and statistics."""
            try:
                stats = self._collect_vault_statistics()
                return VaultStatus(
                    vault_path=self.config.general.vault_path,
                    watcher_running=self.watcher is not None and self.watcher_task is not None,
                    **stats
                )
            except Exception as e:
                self.logger.error("vault_status_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/vault/files", response_model=List[FileInfo])
        async def get_vault_files(path: str = ""):
            """Get files in vault directory."""
            try:
                vault_path = Path(self.config.general.vault_path)
                target_path = vault_path / path if path else vault_path
                
                if not target_path.exists():
                    raise HTTPException(status_code=404, detail="Path not found")
                
                files = []
                for item in target_path.iterdir():
                    try:
                        stat = item.stat()
                        files.append(FileInfo(
                            name=item.name,
                            path=str(item.relative_to(vault_path)),
                            size=stat.st_size if item.is_file() else 0,
                            file_type=self._get_file_type(item),
                            modified=datetime.fromtimestamp(stat.st_mtime),
                            is_directory=item.is_dir()
                        ))
                    except PermissionError:
                        continue
                
                return sorted(files, key=lambda x: (not x.is_directory, x.name.lower()))
            
            except Exception as e:
                self.logger.error("vault_files_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/watcher/start")
        async def start_watcher(background_tasks: BackgroundTasks):
            """Start the vault watcher."""
            try:
                if self.watcher is not None and self.watcher_task is not None:
                    return {"message": "Watcher is already running"}
                
                self.watcher = VaultWatcher(self.config)
                self.watcher.start()
                
                # Run watcher in background
                self.watcher_task = asyncio.create_task(self._run_watcher())
                
                self.logger.info("watcher_started")
                return {"message": "Watcher started successfully"}
            
            except Exception as e:
                self.logger.error("watcher_start_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/watcher/stop")
        async def stop_watcher():
            """Stop the vault watcher."""
            try:
                if self.watcher is None:
                    return {"message": "Watcher is not running"}
                
                self.watcher.stop()
                
                if self.watcher_task:
                    self.watcher_task.cancel()
                    try:
                        await self.watcher_task
                    except asyncio.CancelledError:
                        pass
                
                self.watcher = None
                self.watcher_task = None
                
                self.logger.info("watcher_stopped")
                return {"message": "Watcher stopped successfully"}
            
            except Exception as e:
                self.logger.error("watcher_stop_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/watcher/status")
        async def get_watcher_status():
            """Get watcher status."""
            return {
                "running": self.watcher is not None and self.watcher_task is not None,
                "started_at": getattr(self.watcher, 'started_at', None) if self.watcher else None
            }
        
        @self.app.post("/files/process", response_model=ProcessingResult)
        async def process_file(file_path: str):
            """Process a specific file."""
            try:
                if self.watcher is None:
                    raise HTTPException(status_code=400, detail="Watcher is not running")
                
                vault_path = Path(self.config.general.vault_path)
                target_file = vault_path / file_path
                
                if not target_file.exists():
                    raise HTTPException(status_code=404, detail="File not found")
                
                # Process file
                result = self.watcher.processor.process_file(target_file)
                
                if result:
                    return ProcessingResult(
                        success=True,
                        message="File processed successfully",
                        file_path=str(target_file),
                        destination_path=str(result)
                    )
                else:
                    return ProcessingResult(
                        success=False,
                        message="File could not be processed",
                        file_path=str(target_file)
                    )
            
            except Exception as e:
                self.logger.error("file_process_error", error=str(e), file_path=file_path)
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/config")
        async def get_configuration():
            """Get current configuration."""
            try:
                # Return safe configuration (without sensitive data)
                safe_config = {
                    "general": {
                        "vault_path": self.config.general.vault_path,
                        "log_level": self.config.general.log_level,
                        "dry_run": self.config.general.dry_run,
                        "backup_enabled": self.config.general.backup_enabled,
                    },
                    "processing": {
                        "enable_3d_conversion": self.config.processing.enable_3d_conversion,
                        "enable_hash_deduplication": self.config.processing.enable_hash_deduplication,
                        "enable_auto_categorization": self.config.processing.enable_auto_categorization,
                    },
                    "api": {
                        "enabled": self.config.api.enabled,
                        "host": self.config.api.host,
                        "port": self.config.api.port,
                    }
                }
                return safe_config
            
            except Exception as e:
                self.logger.error("config_get_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/config/update")
        async def update_configuration(update: ConfigurationUpdate):
            """Update configuration."""
            try:
                # This is a simplified implementation
                # In a real application, you would want to validate and save to file
                self.logger.info("config_update_requested", section=update.section, key=update.key)
                return {"message": "Configuration update requested"}
            
            except Exception as e:
                self.logger.error("config_update_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/logs")
        async def get_logs(limit: int = 100):
            """Get recent logs."""
            try:
                log_dir = self.config.get_log_dir()
                log_files = sorted(log_dir.glob("*.log"), key=lambda x: x.stat().st_mtime, reverse=True)
                
                if not log_files:
                    return {"logs": []}
                
                # Read from most recent log file
                latest_log = log_files[0]
                with open(latest_log, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                
                # Return last N lines
                recent_logs = lines[-limit:] if len(lines) > limit else lines
                return {"logs": [line.strip() for line in recent_logs]}
            
            except Exception as e:
                self.logger.error("logs_get_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/vault/validate")
        async def validate_vault():
            """Validate vault structure."""
            try:
                vault_path = Path(self.config.general.vault_path)
                
                if not vault_path.exists():
                    return {
                        "valid": False,
                        "errors": ["Vault path does not exist"]
                    }
                
                errors = []
                warnings = []
                
                # Check required folders
                required_folders = [
                    self.config.folders.inbox,
                    self.config.folders.projects,
                    self.config.folders.categories,
                    self.config.folders.resources,
                    self.config.folders.admin,
                ]
                
                for folder in required_folders:
                    folder_path = vault_path / folder
                    if not folder_path.exists():
                        errors.append(f"Required folder missing: {folder}")
                    elif not folder_path.is_dir():
                        errors.append(f"Path is not a directory: {folder}")
                
                # Check admin subdirectories
                admin_path = vault_path / self.config.folders.admin
                if admin_path.exists():
                    log_dir = admin_path / "logs"
                    if not log_dir.exists():
                        warnings.append("Log directory missing in admin folder")
                
                return {
                    "valid": len(errors) == 0,
                    "errors": errors,
                    "warnings": warnings
                }
            
            except Exception as e:
                self.logger.error("vault_validate_error", error=str(e))
                raise HTTPException(status_code=500, detail=str(e))
    
    async def _run_watcher(self):
        """Run watcher in background task."""
        try:
            while True:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass
    
    def _collect_vault_statistics(self) -> Dict[str, Any]:
        """Collect vault statistics."""
        stats = {
            "total_files": 0,
            "total_size": 0,
            "projects": 0,
            "categories": 0,
            "resources": 0,
            "models": 0,
            "notes": 0,
            "documents": 0,
            "images": 0,
        }
        
        vault_path = Path(self.config.general.vault_path)
        
        for file_path in vault_path.rglob("*"):
            if file_path.is_file():
                stats["total_files"] += 1
                stats["total_size"] += file_path.stat().st_size
                
                if self.config.is_model_file(file_path):
                    stats["models"] += 1
                elif self.config.is_note_file(file_path):
                    stats["notes"] += 1
                elif self.config.is_document_file(file_path):
                    stats["documents"] += 1
                elif self.config.is_image_file(file_path):
                    stats["images"] += 1
        
        # Count directories
        projects_dir = vault_path / self.config.folders.projects
        categories_dir = vault_path / self.config.folders.categories
        resources_dir = vault_path / self.config.folders.resources
        
        if projects_dir.exists():
            stats["projects"] = len([d for d in projects_dir.iterdir() if d.is_dir()])
        
        if categories_dir.exists():
            stats["categories"] = len([d for d in categories_dir.iterdir() if d.is_dir()])
        
        if resources_dir.exists():
            stats["resources"] = len([d for d in resources_dir.iterdir() if d.is_dir()])
        
        return stats
    
    def _get_file_type(self, file_path: Path) -> str:
        """Get file type description."""
        if self.config.is_model_file(file_path):
            return "3D Model"
        elif self.config.is_note_file(file_path):
            return "Note"
        elif self.config.is_document_file(file_path):
            return "Document"
        elif self.config.is_image_file(file_path):
            return "Image"
        elif file_path.is_dir():
            return "Directory"
        else:
            return "File"


def create_api_app(config: Config) -> FastAPI:
    """Create FastAPI application."""
    api = VaultWatcherAPI(config)
    return api.app


def run_api_server(config: Config, host: str = None, port: int = None):
    """Run API server."""
    import uvicorn
    
    # Setup logging
    setup_logging(
        log_level=config.general.log_level,
        log_format=config.general.log_format,
    )
    
    # Create app
    app = create_api_app(config)
    
    # Run server
    uvicorn.run(
        app,
        host=host or config.api.host,
        port=port or config.api.port,
        log_level=config.general.log_level.lower(),
    )