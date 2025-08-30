"""Configuration management for Vault Watcher."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import toml
from pydantic import BaseModel, Field, validator
from pydantic_settings import BaseSettings


class GeneralSettings(BaseModel):
    """General application settings."""
    
    vault_path: str = Field(..., description="Path to the vault directory")
    log_level: str = Field(default="INFO", description="Logging level")
    log_format: str = Field(default="json", description="Log format")
    dry_run: bool = Field(default=False, description="Dry run mode")
    backup_enabled: bool = Field(default=True, description="Enable backups")
    backup_retention_days: int = Field(default=30, description="Backup retention days")
    gui_theme: str = Field(default="dark", description="GUI theme")
    gui_language: str = Field(default="ru", description="GUI language")
    gui_window_size: List[int] = Field(default=[1200, 800], description="GUI window size")
    gui_auto_refresh_interval: int = Field(default=5, description="GUI auto refresh interval")


class FileTypesSettings(BaseModel):
    """File type settings."""
    
    model_extensions: List[str] = Field(
        default=[
            ".stl", ".obj", ".fbx", ".dae", ".ply",
            ".gltf", ".glb", ".3ds", ".blend",
            ".step", ".stp", ".iges", ".igs"
        ],
        description="3D model file extensions"
    )
    note_extensions: List[str] = Field(
        default=[".md", ".txt", ".rst"],
        description="Note file extensions"
    )
    document_extensions: List[str] = Field(
        default=[".pdf", ".doc", ".docx", ".odt"],
        description="Document file extensions"
    )
    image_extensions: List[str] = Field(
        default=[".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"],
        description="Image file extensions"
    )


class FolderSettings(BaseModel):
    """Folder structure settings."""
    
    inbox: str = Field(default="0_INBOX", description="Inbox folder")
    ongoing: str = Field(default="_ONGOING", description="Ongoing folder")
    projects: str = Field(default="1_PROJECTS", description="Projects folder")
    categories: str = Field(default="2_CATEGORIES", description="Categories folder")
    resources: str = Field(default="3_RESOURCES", description="Resources folder")
    admin: str = Field(default="9_ADMIN", description="Admin folder")


class ProjectSettings(BaseModel):
    """Project settings."""
    
    structure: List[str] = Field(
        default=["notes", "models/src", "models/glb", "assets", "docs", "_meta"],
        description="Project folder structure"
    )
    meta_template: str = Field(..., description="Project meta template")


class CategorySettings(BaseModel):
    """Category settings."""
    
    structure: List[str] = Field(
        default=["notes", "incoming", "assets", "_meta"],
        description="Category folder structure"
    )
    meta_template: str = Field(..., description="Category meta template")


class ResourceSettings(BaseModel):
    """Resource settings."""
    
    parts_structure: List[str] = Field(
        default=["models/src", "models/glb", "docs", "assets"],
        description="Parts folder structure"
    )
    part_meta_template: str = Field(..., description="Part meta template")


class ProcessingSettings(BaseModel):
    """File processing settings."""
    
    enable_3d_conversion: bool = Field(default=True, description="Enable 3D conversion")
    enable_hash_deduplication: bool = Field(default=True, description="Enable hash deduplication")
    enable_auto_categorization: bool = Field(default=True, description="Enable auto categorization")
    enable_backup: bool = Field(default=True, description="Enable backup")


class ThreeDConversionSettings(BaseModel):
    """3D conversion settings."""
    
    enable_validator: bool = Field(default=True, description="Enable GLTF validator")
    enable_gltfpack: bool = Field(default=True, description="Enable GLTF packer")
    axis: str = Field(default="+Yup", description="Up axis")
    units: str = Field(default="mm", description="Units")
    default_scale: float = Field(default=0.001, description="Default scale")
    conversion_tools: List[str] = Field(
        default=["FBX2glTF", "assimp", "blender"],
        description="Available conversion tools"
    )


class HashDatabaseSettings(BaseModel):
    """Hash database settings."""
    
    file: str = Field(default="9_ADMIN/hash_index.json", description="Hash database file")
    algorithm: str = Field(default="sha256", description="Hash algorithm")
    chunk_size: int = Field(default=1048576, description="Chunk size for hashing")


class LoggingSettings(BaseModel):
    """Logging settings."""
    
    directory: str = Field(default="9_ADMIN/logs", description="Log directory")
    max_size_mb: int = Field(default=100, description="Max log file size in MB")
    backup_count: int = Field(default=5, description="Number of backup log files")
    format: str = Field(default="json", description="Log format")


class APISettings(BaseModel):
    """API settings."""
    
    enabled: bool = Field(default=True, description="Enable API")
    host: str = Field(default="127.0.0.1", description="API host")
    port: int = Field(default=8080, description="API port")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000"],
        description="CORS origins"
    )
    rate_limit: int = Field(default=100, description="Rate limit")


class DatabaseSettings(BaseModel):
    """Database settings."""
    
    enabled: bool = Field(default=False, description="Enable database")
    url: str = Field(default="postgresql://user:pass@localhost/vault_watcher", description="Database URL")
    pool_size: int = Field(default=10, description="Connection pool size")
    max_overflow: int = Field(default=20, description="Max overflow connections")


class RedisSettings(BaseModel):
    """Redis settings."""
    
    enabled: bool = Field(default=False, description="Enable Redis")
    url: str = Field(default="redis://localhost:6379", description="Redis URL")
    db: int = Field(default=0, description="Redis database number")


class NotificationSettings(BaseModel):
    """Notification settings."""
    
    enabled: bool = Field(default=True, description="Enable notifications")
    desktop_notifications: bool = Field(default=True, description="Desktop notifications")
    email_notifications: bool = Field(default=False, description="Email notifications")
    smtp_server: str = Field(default="", description="SMTP server")
    smtp_port: int = Field(default=587, description="SMTP port")
    smtp_username: str = Field(default="", description="SMTP username")
    smtp_password: str = Field(default="", description="SMTP password")


class SecuritySettings(BaseModel):
    """Security settings."""
    
    encrypt_sensitive_data: bool = Field(default=False, description="Encrypt sensitive data")
    backup_encryption: bool = Field(default=False, description="Encrypt backups")
    file_permissions: str = Field(default="644", description="File permissions")
    directory_permissions: str = Field(default="755", description="Directory permissions")


class PerformanceSettings(BaseModel):
    """Performance settings."""
    
    max_workers: int = Field(default=4, description="Max worker threads")
    file_scan_interval: int = Field(default=30, description="File scan interval in seconds")
    batch_size: int = Field(default=100, description="Batch size for operations")
    memory_limit_mb: int = Field(default=512, description="Memory limit in MB")


class PluginSettings(BaseModel):
    """Plugin settings."""
    
    enabled: bool = Field(default=True, description="Enable plugins")
    plugin_directory: str = Field(default="plugins", description="Plugin directory")
    auto_load: bool = Field(default=True, description="Auto load plugins")
    sandboxed: bool = Field(default=True, description="Sandbox plugins")


class Config(BaseSettings):
    """Main configuration class."""
    
    general: GeneralSettings
    file_types: FileTypesSettings
    folders: FolderSettings
    projects: ProjectSettings
    categories: CategorySettings
    resources: ResourceSettings
    processing: ProcessingSettings
    three_d_conversion: ThreeDConversionSettings
    hash_database: HashDatabaseSettings
    logging: LoggingSettings
    api: APISettings
    database: DatabaseSettings
    redis: RedisSettings
    notifications: NotificationSettings
    security: SecuritySettings
    performance: PerformanceSettings
    plugins: PluginSettings
    
    class Config:
        env_prefix = "VAULT_WATCHER_"
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    @classmethod
    def from_toml(cls, config_path: str) -> "Config":
        """Load configuration from TOML file."""
        config_path = Path(config_path)
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        config_data = toml.load(config_path)
        return cls(**config_data)
    
    @classmethod
    def from_default(cls) -> "Config":
        """Load configuration from default location."""
        default_paths = [
            Path("configs/vault_watcher.toml"),
            Path("vault_watcher.toml"),
            Path.home() / ".config" / "vault_watcher" / "config.toml",
            Path("/etc/vault_watcher/config.toml"),
        ]
        
        for path in default_paths:
            if path.exists():
                return cls.from_toml(str(path))
        
        raise FileNotFoundError("No configuration file found in default locations")
    
    def get_vault_path(self) -> Path:
        """Get vault path as Path object."""
        return Path(self.general.vault_path)
    
    def get_hash_db_path(self) -> Path:
        """Get hash database path."""
        return self.get_vault_path() / self.hash_database.file
    
    def get_log_dir(self) -> Path:
        """Get log directory path."""
        return self.get_vault_path() / self.logging.directory
    
    def validate_vault_path(self) -> bool:
        """Validate that vault path exists and is accessible."""
        vault_path = self.get_vault_path()
        return vault_path.exists() and vault_path.is_dir()
    
    def get_all_extensions(self) -> List[str]:
        """Get all supported file extensions."""
        return (
            self.file_types.model_extensions +
            self.file_types.note_extensions +
            self.file_types.document_extensions +
            self.file_types.image_extensions
        )
    
    def is_model_file(self, file_path: Path) -> bool:
        """Check if file is a 3D model."""
        return file_path.suffix.lower() in self.file_types.model_extensions
    
    def is_note_file(self, file_path: Path) -> bool:
        """Check if file is a note."""
        return file_path.suffix.lower() in self.file_types.note_extensions
    
    def is_document_file(self, file_path: Path) -> bool:
        """Check if file is a document."""
        return file_path.suffix.lower() in self.file_types.document_extensions
    
    def is_image_file(self, file_path: Path) -> bool:
        """Check if file is an image."""
        return file_path.suffix.lower() in self.file_types.image_extensions