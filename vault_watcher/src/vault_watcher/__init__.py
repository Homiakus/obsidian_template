"""Vault Watcher - Obsidian-like file management system with GUI."""

__version__ = "0.1.0"
__author__ = "Vault Watcher Team"
__email__ = "team@vaultwatcher.com"

from .config import Config
from .core import VaultWatcher
from .gui import VaultWatcherGUI

__all__ = [
    "Config",
    "VaultWatcher", 
    "VaultWatcherGUI",
    "__version__",
]