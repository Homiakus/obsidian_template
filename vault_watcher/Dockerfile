# Vault Watcher Dockerfile
# Многоэтапная сборка для оптимизации размера образа

# Этап 1: Базовый образ Python
FROM python:3.12-slim AS base

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Настройка Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src

# Создание пользователя для безопасности
RUN useradd -m -u 1000 vaultwatcher

# Рабочая директория
WORKDIR /app

# Этап 2: Сборка зависимостей
FROM base AS builder

# Копирование файлов зависимостей
COPY pyproject.toml ./
COPY README.md ./

# Установка зависимостей для сборки
RUN pip install --upgrade pip && \
    pip install build wheel setuptools

# Сборка пакета
RUN python -m build --wheel --outdir /wheels

# Этап 3: Финальный образ
FROM base AS runtime

# Установка зависимостей для GUI (если нужно)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libxcb-xinerama0 \
    libxcb-icccm4 \
    libxcb-image0 \
    libxcb-keysyms1 \
    libxcb-randr0 \
    libxcb-render-util0 \
    libxcb-xfixes0 \
    libxcb-shape0 \
    && rm -rf /var/lib/apt/lists/*

# Копирование собранных пакетов
COPY --from=builder /wheels /wheels

# Установка пакета
RUN pip install --no-cache-dir /wheels/*.whl && \
    rm -rf /wheels

# Копирование исходного кода
COPY src/ ./src/
COPY configs/ ./configs/
COPY docs/ ./docs/

# Создание необходимых директорий
RUN mkdir -p /app/vault /app/logs /app/backup && \
    chown -R vaultwatcher:vaultwatcher /app

# Переключение на пользователя
USER vaultwatcher

# Переменные окружения
ENV VAULT_PATH=/app/vault \
    LOG_LEVEL=INFO \
    LOG_FORMAT=json

# Точки монтирования
VOLUME ["/app/vault", "/app/logs", "/app/backup"]

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Порт для API
EXPOSE 8080

# Метаданные
LABEL maintainer="Vault Watcher Team <team@vaultwatcher.com>" \
      version="0.1.0" \
      description="Vault Watcher - Obsidian-like file management system" \
      org.opencontainers.image.source="https://github.com/vault-watcher/vault-watcher"

# Точка входа
ENTRYPOINT ["python", "-m", "vault_watcher.cli"]

# По умолчанию запускаем CLI
CMD ["watch"]

# Альтернативные команды для запуска разных интерфейсов
# Для запуска GUI: docker run -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix vault-watcher gui
# Для запуска API: docker run -p 8080:8080 vault-watcher api