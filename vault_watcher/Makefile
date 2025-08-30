# Vault Watcher Makefile
# Команды для разработки, тестирования и сборки

PY ?= python3
PIP ?= pip
APP ?= vault-watcher
PYTHONPATH ?= src

.PHONY: help install install-dev clean test test-unit test-integration lint format type-check security build run run-gui run-api init-vault status validate

help: ## Показать справку по командам
	@echo "Vault Watcher - команды для разработки"
	@echo "======================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Установить зависимости
	$(PIP) install -e .

install-dev: ## Установить зависимости для разработки
	$(PIP) install -e .[dev,gui,api]

clean: ## Очистить временные файлы
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type f -name ".coverage" -delete
	find . -type f -name "*.log" -delete

test: ## Запустить все тесты
	PYTHONPATH=$(PYTHONPATH) pytest tests/ -v

test-unit: ## Запустить unit тесты
	PYTHONPATH=$(PYTHONPATH) pytest tests/unit/ -v

test-integration: ## Запустить интеграционные тесты
	PYTHONPATH=$(PYTHONPATH) pytest tests/integration/ -v

test-coverage: ## Запустить тесты с покрытием
	PYTHONPATH=$(PYTHONPATH) pytest tests/ --cov=vault_watcher --cov-report=html --cov-report=term-missing

lint: ## Проверить код линтером
	ruff check src/ tests/
	ruff check --select I --fix src/ tests/

format: ## Отформатировать код
	ruff format src/ tests/
	isort src/ tests/

type-check: ## Проверить типы
	mypy src/

security: ## Проверить безопасность
	bandit -r src/
	pip-audit

quality: lint type-check security ## Проверить качество кода

build: ## Собрать пакет
	$(PY) -m build

run: ## Запустить CLI
	$(PY) -m vault_watcher.cli watch

run-gui: ## Запустить GUI
	$(PY) -m vault_watcher.gui

run-api: ## Запустить API сервер
	$(PY) -m vault_watcher.api

init-vault: ## Инициализировать хранилище (требует путь)
	@echo "Использование: make init-vault VAULT_PATH=/path/to/vault"
	@if [ -z "$(VAULT_PATH)" ]; then echo "Ошибка: укажите VAULT_PATH"; exit 1; fi
	$(PY) -m vault_watcher.cli init $(VAULT_PATH)

status: ## Показать статус хранилища
	$(PY) -m vault_watcher.cli status

validate: ## Валидировать хранилище
	$(PY) -m vault_watcher.cli validate

dev-setup: install-dev ## Настройка окружения для разработки
	pre-commit install

pre-commit: ## Запустить pre-commit хуки
	pre-commit run --all-files

docs: ## Создать документацию
	mkdocs build

docs-serve: ## Запустить локальный сервер документации
	mkdocs serve

docker-build: ## Собрать Docker образ
	docker build -t vault-watcher .

docker-run: ## Запустить в Docker
	docker run -it --rm -v $(PWD):/app vault-watcher

docker-run-gui: ## Запустить GUI в Docker (требует X11)
	docker run -it --rm -e DISPLAY=$(DISPLAY) -v /tmp/.X11-unix:/tmp/.X11-unix -v $(PWD):/app vault-watcher

check-all: quality test ## Запустить все проверки

ci: ## Команды для CI/CD
	$(MAKE) install-dev
	$(MAKE) quality
	$(MAKE) test-coverage
	$(MAKE) build

release: ## Подготовить релиз
	$(MAKE) clean
	$(MAKE) check-all
	$(MAKE) build
	@echo "Готово к релизу!"

# Специфичные команды для разработки
watch: ## Запустить наблюдатель в режиме разработки
	$(PY) -m vault_watcher.cli watch --log-level DEBUG

watch-dry-run: ## Запустить наблюдатель в тестовом режиме
	$(PY) -m vault_watcher.cli watch --dry-run

# Команды для отладки
debug-config: ## Показать текущую конфигурацию
	$(PY) -c "from vault_watcher.config import Config; print(Config.from_default().dict())"

debug-vault: ## Показать информацию о хранилище
	$(PY) -m vault_watcher.cli status

# Команды для мониторинга
logs: ## Показать логи
	@if [ -f "logs/vault_watcher.log" ]; then tail -f logs/vault_watcher.log; else echo "Логи не найдены"; fi

monitor: ## Мониторинг системы
	@echo "=== Статус хранилища ==="
	$(MAKE) status
	@echo ""
	@echo "=== Последние логи ==="
	@if [ -f "logs/vault_watcher.log" ]; then tail -20 logs/vault_watcher.log; else echo "Логи не найдены"; fi

# Команды для резервного копирования
backup: ## Создать резервную копию
	@echo "Создание резервной копии..."
	@if [ -d "vault" ]; then tar -czf "backup/vault_$(shell date +%Y%m%d_%H%M%S).tar.gz" vault/; else echo "Папка vault не найдена"; fi

restore: ## Восстановить из резервной копии (требует BACKUP_FILE)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Ошибка: укажите BACKUP_FILE"; exit 1; fi
	@echo "Восстановление из $(BACKUP_FILE)..."
	tar -xzf $(BACKUP_FILE)

# Команды для производительности
profile: ## Профилирование производительности
	$(PY) -m cProfile -o profile.stats -m vault_watcher.cli watch
	$(PY) -c "import pstats; p = pstats.Stats('profile.stats'); p.sort_stats('cumulative').print_stats(20)"

benchmark: ## Бенчмарк производительности
	$(PY) -m vault_watcher.benchmark

# Команды для развертывания
deploy-local: ## Развертывание локально
	$(MAKE) install
	$(MAKE) init-vault VAULT_PATH=./vault
	$(MAKE) run

deploy-docker: ## Развертывание в Docker
	$(MAKE) docker-build
	$(MAKE) docker-run

# Команды для обновления
update-deps: ## Обновить зависимости
	$(PIP) install --upgrade pip
	$(PIP) install --upgrade -e .[dev,gui,api]

update-self: ## Обновить сам проект
	git pull origin main
	$(MAKE) update-deps
	$(MAKE) install-dev

# Информационные команды
info: ## Показать информацию о системе
	@echo "=== Системная информация ==="
	@echo "Python: $(shell $(PY) --version)"
	@echo "Pip: $(shell $(PIP) --version)"
	@echo "OS: $(shell uname -s)"
	@echo "Architecture: $(shell uname -m)"
	@echo ""
	@echo "=== Установленные пакеты ==="
	$(PIP) list | grep vault-watcher

version: ## Показать версию
	$(PY) -c "import vault_watcher; print(vault_watcher.__version__)"

# Команды для помощи
examples: ## Показать примеры использования
	@echo "=== Примеры использования ==="
	@echo "1. Инициализация хранилища:"
	@echo "   make init-vault VAULT_PATH=/path/to/vault"
	@echo ""
	@echo "2. Запуск GUI:"
	@echo "   make run-gui"
	@echo ""
	@echo "3. Запуск API:"
	@echo "   make run-api"
	@echo ""
	@echo "4. Запуск CLI:"
	@echo "   make run"
	@echo ""
	@echo "5. Проверка качества кода:"
	@echo "   make quality"
	@echo ""
	@echo "6. Запуск тестов:"
	@echo "   make test"

troubleshoot: ## Диагностика проблем
	@echo "=== Диагностика ==="
	@echo "1. Проверка Python:"
	$(PY) --version
	@echo ""
	@echo "2. Проверка зависимостей:"
	$(PIP) list | grep -E "(vault-watcher|fastapi|pyqt6|watchdog)"
	@echo ""
	@echo "3. Проверка конфигурации:"
	@if [ -f "configs/vault_watcher.toml" ]; then echo "Конфигурация найдена"; else echo "Конфигурация не найдена"; fi
	@echo ""
	@echo "4. Проверка хранилища:"
	@if [ -d "vault" ]; then echo "Хранилище найдено"; else echo "Хранилище не найдено"; fi