"""Logging configuration for Vault Watcher."""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Any, Dict, Optional

import structlog
from structlog.types import Processor


def setup_logging(
    log_level: str = "INFO",
    log_format: str = "json",
    log_file: Optional[Path] = None,
    max_size_mb: int = 100,
    backup_count: int = 5,
) -> None:
    """Setup structured logging for the application."""
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )
    
    # Configure structlog
    processors: list[Processor] = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]
    
    if log_format == "json":
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(
            structlog.dev.ConsoleRenderer(colors=True)
        )
    
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Setup file handler if log_file is specified
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Create rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=max_size_mb * 1024 * 1024,  # Convert MB to bytes
            backupCount=backup_count,
            encoding="utf-8",
        )
        
        # Add file handler to root logger
        logging.getLogger().addHandler(file_handler)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class LoggerMixin:
    """Mixin class to add logging capabilities to any class."""
    
    @property
    def logger(self) -> structlog.stdlib.BoundLogger:
        """Get logger for this class."""
        return get_logger(self.__class__.__name__)


def log_event(
    logger: structlog.stdlib.BoundLogger,
    event: str,
    **kwargs: Any,
) -> None:
    """Log an event with structured data."""
    logger.info(event, **kwargs)


def log_error(
    logger: structlog.stdlib.BoundLogger,
    event: str,
    error: Exception,
    **kwargs: Any,
) -> None:
    """Log an error with structured data."""
    logger.error(
        event,
        error_type=type(error).__name__,
        error_message=str(error),
        exc_info=True,
        **kwargs,
    )


def log_performance(
    logger: structlog.stdlib.BoundLogger,
    operation: str,
    duration_ms: float,
    **kwargs: Any,
) -> None:
    """Log performance metrics."""
    logger.info(
        "performance",
        operation=operation,
        duration_ms=duration_ms,
        **kwargs,
    )


def log_file_operation(
    logger: structlog.stdlib.BoundLogger,
    operation: str,
    file_path: Path,
    **kwargs: Any,
) -> None:
    """Log file operations."""
    logger.info(
        "file_operation",
        operation=operation,
        file_path=str(file_path),
        file_size=file_path.stat().st_size if file_path.exists() else 0,
        **kwargs,
    )


def log_vault_operation(
    logger: structlog.stdlib.BoundLogger,
    operation: str,
    vault_path: Path,
    **kwargs: Any,
) -> None:
    """Log vault operations."""
    logger.info(
        "vault_operation",
        operation=operation,
        vault_path=str(vault_path),
        **kwargs,
    )


def log_configuration(
    logger: structlog.stdlib.BoundLogger,
    config: Dict[str, Any],
) -> None:
    """Log configuration (without sensitive data)."""
    # Filter out sensitive configuration
    safe_config = {}
    sensitive_keys = {"password", "secret", "key", "token"}
    
    for key, value in config.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            safe_config[key] = "***REDACTED***"
        else:
            safe_config[key] = value
    
    logger.info("configuration_loaded", config=safe_config)


def log_startup(
    logger: structlog.stdlib.BoundLogger,
    version: str,
    config_path: Optional[Path] = None,
) -> None:
    """Log application startup."""
    logger.info(
        "application_startup",
        version=version,
        config_path=str(config_path) if config_path else None,
    )


def log_shutdown(
    logger: structlog.stdlib.BoundLogger,
    reason: str = "normal",
) -> None:
    """Log application shutdown."""
    logger.info("application_shutdown", reason=reason)