"""Command line interface for Vault Watcher."""

import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.text import Text

from .config import Config
from .core import VaultWatcher
from .logging import setup_logging, get_logger, log_startup, log_shutdown

app = typer.Typer(
    name="vault-watcher",
    help="Vault Watcher - Obsidian-like file management system",
    add_completion=False,
)

console = Console()


@app.command()
def watch(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Path to configuration file"
    ),
    vault_path: Optional[Path] = typer.Option(
        None, "--vault", "-v", help="Path to vault directory"
    ),
    dry_run: bool = typer.Option(
        False, "--dry-run", help="Run in dry-run mode (no file operations)"
    ),
    log_level: str = typer.Option(
        "INFO", "--log-level", help="Logging level (DEBUG, INFO, WARNING, ERROR)"
    ),
    log_format: str = typer.Option(
        "json", "--log-format", help="Log format (json, console)"
    ),
):
    """Start watching for file changes in the vault."""
    
    try:
        # Load configuration
        if config_file:
            config = Config.from_toml(str(config_file))
        else:
            config = Config.from_default()
        
        # Override configuration with command line arguments
        if vault_path:
            config.general.vault_path = str(vault_path)
        
        if dry_run:
            config.general.dry_run = True
        
        config.general.log_level = log_level.upper()
        config.general.log_format = log_format
        
        # Setup logging
        log_file = config.get_log_dir() / "vault_watcher.log"
        setup_logging(
            log_level=config.general.log_level,
            log_format=config.general.log_format,
            log_file=log_file,
            max_size_mb=config.logging.max_size_mb,
            backup_count=config.logging.backup_count,
        )
        
        logger = get_logger("CLI")
        log_startup(logger, "0.1.0", config_file)
        
        # Validate vault path
        if not config.validate_vault_path():
            console.print(f"[red]Error: Vault path does not exist: {config.general.vault_path}[/red]")
            sys.exit(1)
        
        # Display startup information
        console.print(Panel.fit(
            f"[bold blue]Vault Watcher v0.1.0[/bold blue]\n"
            f"Vault: [green]{config.general.vault_path}[/green]\n"
            f"Log Level: [yellow]{config.general.log_level}[/yellow]\n"
            f"Dry Run: [yellow]{'Yes' if config.general.dry_run else 'No'}[/yellow]",
            title="Starting Vault Watcher"
        ))
        
        # Create and start watcher
        watcher = VaultWatcher(config)
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("Starting watcher...", total=None)
            
            try:
                watcher.run()
            except KeyboardInterrupt:
                progress.update(task, description="Stopping watcher...")
                watcher.stop()
                console.print("\n[yellow]Watcher stopped by user[/yellow]")
            except Exception as e:
                progress.update(task, description="Error occurred")
                console.print(f"\n[red]Error: {e}[/red]")
                logger.error("watcher_error", error=str(e))
                sys.exit(1)
        
        log_shutdown(logger, "user_interrupt")
        console.print("[green]Vault Watcher stopped[/green]")
    
    except FileNotFoundError as e:
        console.print(f"[red]Configuration error: {e}[/red]")
        sys.exit(1)
    except Exception as e:
        console.print(f"[red]Unexpected error: {e}[/red]")
        sys.exit(1)


@app.command()
def status(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Path to configuration file"
    ),
):
    """Show vault status and statistics."""
    
    try:
        # Load configuration
        if config_file:
            config = Config.from_toml(str(config_file))
        else:
            config = Config.from_default()
        
        vault_path = Path(config.general.vault_path)
        
        if not vault_path.exists():
            console.print(f"[red]Error: Vault path does not exist: {vault_path}[/red]")
            sys.exit(1)
        
        # Collect statistics
        stats = collect_vault_statistics(vault_path, config)
        
        # Display status
        display_vault_status(vault_path, stats, config)
    
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@app.command()
def validate(
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Path to configuration file"
    ),
    vault_path: Optional[Path] = typer.Option(
        None, "--vault", "-v", help="Path to vault directory"
    ),
):
    """Validate vault structure and configuration."""
    
    try:
        # Load configuration
        if config_file:
            config = Config.from_toml(str(config_file))
        else:
            config = Config.from_default()
        
        if vault_path:
            config.general.vault_path = str(vault_path)
        
        vault_path = Path(config.general.vault_path)
        
        # Validate configuration
        validation_results = validate_configuration(config)
        
        # Validate vault structure
        structure_results = validate_vault_structure(vault_path, config)
        
        # Display results
        display_validation_results(validation_results, structure_results)
        
        # Exit with error if validation failed
        if not all(validation_results.values()) or not all(structure_results.values()):
            sys.exit(1)
    
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


@app.command()
def init(
    vault_path: Path = typer.Argument(..., help="Path to initialize as vault"),
    config_file: Optional[Path] = typer.Option(
        None, "--config", "-c", help="Path to save configuration file"
    ),
):
    """Initialize a new vault directory."""
    
    try:
        vault_path = vault_path.resolve()
        
        if vault_path.exists() and any(vault_path.iterdir()):
            if not typer.confirm(f"Directory {vault_path} is not empty. Continue?"):
                return
        
        # Create vault structure
        create_vault_structure(vault_path)
        
        # Create configuration file
        if config_file:
            create_configuration_file(vault_path, config_file)
        
        console.print(f"[green]Vault initialized at: {vault_path}[/green]")
    
    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")
        sys.exit(1)


def collect_vault_statistics(vault_path: Path, config: Config) -> dict:
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
    
    for file_path in vault_path.rglob("*"):
        if file_path.is_file():
            stats["total_files"] += 1
            stats["total_size"] += file_path.stat().st_size
            
            if config.is_model_file(file_path):
                stats["models"] += 1
            elif config.is_note_file(file_path):
                stats["notes"] += 1
            elif config.is_document_file(file_path):
                stats["documents"] += 1
            elif config.is_image_file(file_path):
                stats["images"] += 1
    
    # Count directories
    projects_dir = vault_path / config.folders.projects
    categories_dir = vault_path / config.folders.categories
    resources_dir = vault_path / config.folders.resources
    
    if projects_dir.exists():
        stats["projects"] = len([d for d in projects_dir.iterdir() if d.is_dir()])
    
    if categories_dir.exists():
        stats["categories"] = len([d for d in categories_dir.iterdir() if d.is_dir()])
    
    if resources_dir.exists():
        stats["resources"] = len([d for d in resources_dir.iterdir() if d.is_dir()])
    
    return stats


def display_vault_status(vault_path: Path, stats: dict, config: Config):
    """Display vault status."""
    console.print(Panel.fit(
        f"[bold blue]Vault Status[/bold blue]\n"
        f"Path: [green]{vault_path}[/green]\n"
        f"Total Files: [yellow]{stats['total_files']:,}[/yellow]\n"
        f"Total Size: [yellow]{format_size(stats['total_size'])}[/yellow]",
        title="Vault Information"
    ))
    
    # File types table
    file_table = Table(title="File Types")
    file_table.add_column("Type", style="cyan")
    file_table.add_column("Count", style="yellow", justify="right")
    
    file_table.add_row("3D Models", str(stats["models"]))
    file_table.add_row("Notes", str(stats["notes"]))
    file_table.add_row("Documents", str(stats["documents"]))
    file_table.add_row("Images", str(stats["images"]))
    
    console.print(file_table)
    
    # Structure table
    structure_table = Table(title="Vault Structure")
    structure_table.add_column("Type", style="cyan")
    structure_table.add_column("Count", style="yellow", justify="right")
    
    structure_table.add_row("Projects", str(stats["projects"]))
    structure_table.add_row("Categories", str(stats["categories"]))
    structure_table.add_row("Resources", str(stats["resources"]))
    
    console.print(structure_table)


def validate_configuration(config: Config) -> dict:
    """Validate configuration."""
    results = {}
    
    # Check vault path
    results["vault_path"] = config.validate_vault_path()
    
    # Check log directory
    log_dir = config.get_log_dir()
    results["log_directory"] = log_dir.parent.exists() or log_dir.parent.mkdir(parents=True, exist_ok=True)
    
    # Check hash database directory
    hash_db_path = config.get_hash_db_path()
    results["hash_db_directory"] = hash_db_path.parent.exists() or hash_db_path.parent.mkdir(parents=True, exist_ok=True)
    
    return results


def validate_vault_structure(vault_path: Path, config: Config) -> dict:
    """Validate vault structure."""
    results = {}
    
    # Check main folders
    folders = [
        config.folders.inbox,
        config.folders.ongoing,
        config.folders.projects,
        config.folders.categories,
        config.folders.resources,
        config.folders.admin,
    ]
    
    for folder in folders:
        folder_path = vault_path / folder
        results[f"folder_{folder}"] = folder_path.exists()
    
    return results


def display_validation_results(config_results: dict, structure_results: dict):
    """Display validation results."""
    console.print(Panel.fit(
        "[bold blue]Configuration Validation[/bold blue]",
        title="Validation Results"
    ))
    
    # Configuration validation
    config_table = Table(title="Configuration")
    config_table.add_column("Check", style="cyan")
    config_table.add_column("Status", style="green")
    
    for check, result in config_results.items():
        status = "✓" if result else "✗"
        style = "green" if result else "red"
        config_table.add_row(check, f"[{style}]{status}[/{style}]")
    
    console.print(config_table)
    
    # Structure validation
    structure_table = Table(title="Vault Structure")
    structure_table.add_column("Folder", style="cyan")
    structure_table.add_column("Status", style="green")
    
    for folder, result in structure_results.items():
        status = "✓" if result else "✗"
        style = "green" if result else "red"
        folder_name = folder.replace("folder_", "")
        structure_table.add_row(folder_name, f"[{style}]{status}[/{style}]")
    
    console.print(structure_table)


def create_vault_structure(vault_path: Path):
    """Create vault directory structure."""
    folders = [
        "0_INBOX",
        "_ONGOING",
        "1_PROJECTS",
        "2_CATEGORIES",
        "3_RESOURCES",
        "9_ADMIN",
    ]
    
    for folder in folders:
        (vault_path / folder).mkdir(parents=True, exist_ok=True)
    
    # Create admin subdirectories
    admin_path = vault_path / "9_ADMIN"
    (admin_path / "logs").mkdir(exist_ok=True)
    (admin_path / "backups").mkdir(exist_ok=True)


def create_configuration_file(vault_path: Path, config_file: Path):
    """Create configuration file."""
    config_content = f"""# Vault Watcher Configuration
[general]
vault_path = "{vault_path}"
log_level = "INFO"
log_format = "json"
dry_run = false
backup_enabled = true
backup_retention_days = 30
gui_theme = "dark"
gui_language = "ru"
gui_window_size = [1200, 800]
gui_auto_refresh_interval = 5

[file_types]
model_extensions = [".stl", ".obj", ".fbx", ".dae", ".ply", ".gltf", ".glb", ".3ds", ".blend", ".step", ".stp", ".iges", ".igs"]
note_extensions = [".md", ".txt", ".rst"]
document_extensions = [".pdf", ".doc", ".docx", ".odt"]
image_extensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]

[folders]
inbox = "0_INBOX"
ongoing = "_ONGOING"
projects = "1_PROJECTS"
categories = "2_CATEGORIES"
resources = "3_RESOURCES"
admin = "9_ADMIN"

[processing]
enable_3d_conversion = true
enable_hash_deduplication = true
enable_auto_categorization = true
enable_backup = true

[logging]
directory = "9_ADMIN/logs"
max_size_mb = 100
backup_count = 5
format = "json"
"""
    
    config_file.write_text(config_content, encoding="utf-8")


def format_size(size_bytes: int) -> str:
    """Format file size."""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def main():
    """Main CLI entry point."""
    app()


if __name__ == "__main__":
    main()