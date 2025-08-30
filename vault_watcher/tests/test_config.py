"""Tests for configuration module."""

import pytest
from pathlib import Path
from unittest.mock import patch, mock_open

from vault_watcher.config import Config, GeneralSettings, FileTypesSettings


class TestGeneralSettings:
    """Test GeneralSettings class."""
    
    def test_default_values(self):
        """Test default values."""
        settings = GeneralSettings(vault_path="/test/path")
        
        assert settings.vault_path == "/test/path"
        assert settings.log_level == "INFO"
        assert settings.log_format == "json"
        assert settings.dry_run is False
        assert settings.backup_enabled is True
        assert settings.backup_retention_days == 30
        assert settings.gui_theme == "dark"
        assert settings.gui_language == "ru"
        assert settings.gui_window_size == [1200, 800]
        assert settings.gui_auto_refresh_interval == 5
    
    def test_custom_values(self):
        """Test custom values."""
        settings = GeneralSettings(
            vault_path="/custom/path",
            log_level="DEBUG",
            dry_run=True,
            gui_theme="light"
        )
        
        assert settings.vault_path == "/custom/path"
        assert settings.log_level == "DEBUG"
        assert settings.dry_run is True
        assert settings.gui_theme == "light"


class TestFileTypesSettings:
    """Test FileTypesSettings class."""
    
    def test_default_extensions(self):
        """Test default file extensions."""
        settings = FileTypesSettings()
        
        assert ".stl" in settings.model_extensions
        assert ".obj" in settings.model_extensions
        assert ".md" in settings.note_extensions
        assert ".pdf" in settings.document_extensions
        assert ".png" in settings.image_extensions
    
    def test_custom_extensions(self):
        """Test custom file extensions."""
        settings = FileTypesSettings(
            model_extensions=[".custom"],
            note_extensions=[".txt"]
        )
        
        assert settings.model_extensions == [".custom"]
        assert settings.note_extensions == [".txt"]


class TestConfig:
    """Test Config class."""
    
    @patch("builtins.open", new_callable=mock_open, read_data="""
[general]
vault_path = "/test/vault"
log_level = "DEBUG"

[file_types]
model_extensions = [".stl", ".obj"]

[folders]
inbox = "0_INBOX"
projects = "1_PROJECTS"
categories = "2_CATEGORIES"
resources = "3_RESOURCES"
admin = "9_ADMIN"

[projects]
structure = ["notes", "models"]
meta_template = "test template"

[categories]
structure = ["notes", "incoming"]
meta_template = "test template"

[resources]
parts_structure = ["models", "docs"]
part_meta_template = "test template"

[processing]
enable_3d_conversion = true
enable_hash_deduplication = true
enable_auto_categorization = true
enable_backup = true

[three_d_conversion]
enable_validator = true
enable_gltfpack = true
axis = "+Yup"
units = "mm"
default_scale = 0.001
conversion_tools = ["FBX2glTF", "assimp", "blender"]

[hash_database]
file = "9_ADMIN/hash_index.json"
algorithm = "sha256"
chunk_size = 1048576

[logging]
directory = "9_ADMIN/logs"
max_size_mb = 100
backup_count = 5
format = "json"

[api]
enabled = true
host = "127.0.0.1"
port = 8080
cors_origins = ["http://localhost:3000"]
rate_limit = 100

[database]
enabled = false
url = "postgresql://user:pass@localhost/vault_watcher"
pool_size = 10
max_overflow = 20

[redis]
enabled = false
url = "redis://localhost:6379"
db = 0

[notifications]
enabled = true
desktop_notifications = true
email_notifications = false
smtp_server = ""
smtp_port = 587
smtp_username = ""
smtp_password = ""

[security]
encrypt_sensitive_data = false
backup_encryption = false
file_permissions = "644"
directory_permissions = "755"

[performance]
max_workers = 4
file_scan_interval = 30
batch_size = 100
memory_limit_mb = 512

[plugins]
enabled = true
plugin_directory = "plugins"
auto_load = true
sandboxed = true
""")
    @patch("toml.load")
    def test_from_toml(self, mock_toml_load, mock_file):
        """Test loading configuration from TOML file."""
        mock_toml_load.return_value = {
            "general": {"vault_path": "/test/vault", "log_level": "DEBUG"},
            "file_types": {"model_extensions": [".stl", ".obj"]},
            "folders": {
                "inbox": "0_INBOX",
                "projects": "1_PROJECTS",
                "categories": "2_CATEGORIES",
                "resources": "3_RESOURCES",
                "admin": "9_ADMIN"
            },
            "projects": {"structure": ["notes", "models"], "meta_template": "test template"},
            "categories": {"structure": ["notes", "incoming"], "meta_template": "test template"},
            "resources": {"parts_structure": ["models", "docs"], "part_meta_template": "test template"},
            "processing": {
                "enable_3d_conversion": True,
                "enable_hash_deduplication": True,
                "enable_auto_categorization": True,
                "enable_backup": True
            },
            "three_d_conversion": {
                "enable_validator": True,
                "enable_gltfpack": True,
                "axis": "+Yup",
                "units": "mm",
                "default_scale": 0.001,
                "conversion_tools": ["FBX2glTF", "assimp", "blender"]
            },
            "hash_database": {
                "file": "9_ADMIN/hash_index.json",
                "algorithm": "sha256",
                "chunk_size": 1048576
            },
            "logging": {
                "directory": "9_ADMIN/logs",
                "max_size_mb": 100,
                "backup_count": 5,
                "format": "json"
            },
            "api": {
                "enabled": True,
                "host": "127.0.0.1",
                "port": 8080,
                "cors_origins": ["http://localhost:3000"],
                "rate_limit": 100
            },
            "database": {
                "enabled": False,
                "url": "postgresql://user:pass@localhost/vault_watcher",
                "pool_size": 10,
                "max_overflow": 20
            },
            "redis": {
                "enabled": False,
                "url": "redis://localhost:6379",
                "db": 0
            },
            "notifications": {
                "enabled": True,
                "desktop_notifications": True,
                "email_notifications": False,
                "smtp_server": "",
                "smtp_port": 587,
                "smtp_username": "",
                "smtp_password": ""
            },
            "security": {
                "encrypt_sensitive_data": False,
                "backup_encryption": False,
                "file_permissions": "644",
                "directory_permissions": "755"
            },
            "performance": {
                "max_workers": 4,
                "file_scan_interval": 30,
                "batch_size": 100,
                "memory_limit_mb": 512
            },
            "plugins": {
                "enabled": True,
                "plugin_directory": "plugins",
                "auto_load": True,
                "sandboxed": True
            }
        }
        
        config = Config.from_toml("test_config.toml")
        
        assert config.general.vault_path == "/test/vault"
        assert config.general.log_level == "DEBUG"
        assert config.file_types.model_extensions == [".stl", ".obj"]
    
    def test_get_vault_path(self):
        """Test getting vault path."""
        config = Config(
            general=GeneralSettings(vault_path="/test/vault"),
            file_types=FileTypesSettings(),
            folders={"inbox": "0_INBOX", "projects": "1_PROJECTS", "categories": "2_CATEGORIES", "resources": "3_RESOURCES", "admin": "9_ADMIN"},
            projects={"structure": ["notes"], "meta_template": "test"},
            categories={"structure": ["notes"], "meta_template": "test"},
            resources={"parts_structure": ["models"], "part_meta_template": "test"},
            processing={"enable_3d_conversion": True, "enable_hash_deduplication": True, "enable_auto_categorization": True, "enable_backup": True},
            three_d_conversion={"enable_validator": True, "enable_gltfpack": True, "axis": "+Yup", "units": "mm", "default_scale": 0.001, "conversion_tools": ["FBX2glTF"]},
            hash_database={"file": "9_ADMIN/hash_index.json", "algorithm": "sha256", "chunk_size": 1048576},
            logging={"directory": "9_ADMIN/logs", "max_size_mb": 100, "backup_count": 5, "format": "json"},
            api={"enabled": True, "host": "127.0.0.1", "port": 8080, "cors_origins": ["http://localhost:3000"], "rate_limit": 100},
            database={"enabled": False, "url": "postgresql://user:pass@localhost/vault_watcher", "pool_size": 10, "max_overflow": 20},
            redis={"enabled": False, "url": "redis://localhost:6379", "db": 0},
            notifications={"enabled": True, "desktop_notifications": True, "email_notifications": False, "smtp_server": "", "smtp_port": 587, "smtp_username": "", "smtp_password": ""},
            security={"encrypt_sensitive_data": False, "backup_encryption": False, "file_permissions": "644", "directory_permissions": "755"},
            performance={"max_workers": 4, "file_scan_interval": 30, "batch_size": 100, "memory_limit_mb": 512},
            plugins={"enabled": True, "plugin_directory": "plugins", "auto_load": True, "sandboxed": True}
        )
        
        vault_path = config.get_vault_path()
        assert isinstance(vault_path, Path)
        assert str(vault_path) == "/test/vault"
    
    def test_validate_vault_path(self, tmp_path):
        """Test vault path validation."""
        config = Config(
            general=GeneralSettings(vault_path=str(tmp_path)),
            file_types=FileTypesSettings(),
            folders={"inbox": "0_INBOX", "projects": "1_PROJECTS", "categories": "2_CATEGORIES", "resources": "3_RESOURCES", "admin": "9_ADMIN"},
            projects={"structure": ["notes"], "meta_template": "test"},
            categories={"structure": ["notes"], "meta_template": "test"},
            resources={"parts_structure": ["models"], "part_meta_template": "test"},
            processing={"enable_3d_conversion": True, "enable_hash_deduplication": True, "enable_auto_categorization": True, "enable_backup": True},
            three_d_conversion={"enable_validator": True, "enable_gltfpack": True, "axis": "+Yup", "units": "mm", "default_scale": 0.001, "conversion_tools": ["FBX2glTF"]},
            hash_database={"file": "9_ADMIN/hash_index.json", "algorithm": "sha256", "chunk_size": 1048576},
            logging={"directory": "9_ADMIN/logs", "max_size_mb": 100, "backup_count": 5, "format": "json"},
            api={"enabled": True, "host": "127.0.0.1", "port": 8080, "cors_origins": ["http://localhost:3000"], "rate_limit": 100},
            database={"enabled": False, "url": "postgresql://user:pass@localhost/vault_watcher", "pool_size": 10, "max_overflow": 20},
            redis={"enabled": False, "url": "redis://localhost:6379", "db": 0},
            notifications={"enabled": True, "desktop_notifications": True, "email_notifications": False, "smtp_server": "", "smtp_port": 587, "smtp_username": "", "smtp_password": ""},
            security={"encrypt_sensitive_data": False, "backup_encryption": False, "file_permissions": "644", "directory_permissions": "755"},
            performance={"max_workers": 4, "file_scan_interval": 30, "batch_size": 100, "memory_limit_mb": 512},
            plugins={"enabled": True, "plugin_directory": "plugins", "auto_load": True, "sandboxed": True}
        )
        
        assert config.validate_vault_path() is True
    
    def test_file_type_detection(self):
        """Test file type detection methods."""
        config = Config(
            general=GeneralSettings(vault_path="/test/vault"),
            file_types=FileTypesSettings(),
            folders={"inbox": "0_INBOX", "projects": "1_PROJECTS", "categories": "2_CATEGORIES", "resources": "3_RESOURCES", "admin": "9_ADMIN"},
            projects={"structure": ["notes"], "meta_template": "test"},
            categories={"structure": ["notes"], "meta_template": "test"},
            resources={"parts_structure": ["models"], "part_meta_template": "test"},
            processing={"enable_3d_conversion": True, "enable_hash_deduplication": True, "enable_auto_categorization": True, "enable_backup": True},
            three_d_conversion={"enable_validator": True, "enable_gltfpack": True, "axis": "+Yup", "units": "mm", "default_scale": 0.001, "conversion_tools": ["FBX2glTF"]},
            hash_database={"file": "9_ADMIN/hash_index.json", "algorithm": "sha256", "chunk_size": 1048576},
            logging={"directory": "9_ADMIN/logs", "max_size_mb": 100, "backup_count": 5, "format": "json"},
            api={"enabled": True, "host": "127.0.0.1", "port": 8080, "cors_origins": ["http://localhost:3000"], "rate_limit": 100},
            database={"enabled": False, "url": "postgresql://user:pass@localhost/vault_watcher", "pool_size": 10, "max_overflow": 20},
            redis={"enabled": False, "url": "redis://localhost:6379", "db": 0},
            notifications={"enabled": True, "desktop_notifications": True, "email_notifications": False, "smtp_server": "", "smtp_port": 587, "smtp_username": "", "smtp_password": ""},
            security={"encrypt_sensitive_data": False, "backup_encryption": False, "file_permissions": "644", "directory_permissions": "755"},
            performance={"max_workers": 4, "file_scan_interval": 30, "batch_size": 100, "memory_limit_mb": 512},
            plugins={"enabled": True, "plugin_directory": "plugins", "auto_load": True, "sandboxed": True}
        )
        
        # Test model file detection
        assert config.is_model_file(Path("test.stl")) is True
        assert config.is_model_file(Path("test.obj")) is True
        assert config.is_model_file(Path("test.txt")) is False
        
        # Test note file detection
        assert config.is_note_file(Path("test.md")) is True
        assert config.is_note_file(Path("test.txt")) is True
        assert config.is_note_file(Path("test.stl")) is False
        
        # Test document file detection
        assert config.is_document_file(Path("test.pdf")) is True
        assert config.is_document_file(Path("test.doc")) is True
        assert config.is_document_file(Path("test.txt")) is False
        
        # Test image file detection
        assert config.is_image_file(Path("test.png")) is True
        assert config.is_image_file(Path("test.jpg")) is True
        assert config.is_image_file(Path("test.txt")) is False