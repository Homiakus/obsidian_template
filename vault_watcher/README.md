# Vault Watcher

Vault Watcher - это современная система управления файлами с функционалом, аналогичным Obsidian, включающая автоматическую категоризацию, конвертацию 3D моделей и удобный графический интерфейс.

## 🚀 Возможности

### Основной функционал
- **Автоматическое наблюдение за файлами** - система отслеживает изменения в папках и автоматически обрабатывает новые файлы
- **Умная категоризация** - файлы автоматически распределяются по проектам, категориям и ресурсам на основе масок и фронтматтера
- **Дедупликация по хешу** - предотвращает дублирование файлов с одинаковым содержимым
- **Конвертация 3D моделей** - автоматическая конвертация в GLB формат с поддержкой различных инструментов (Blender, FBX2glTF, assimp)

### Интерфейсы
- **Графический интерфейс (PyQt6)** - современный GUI с темной темой и удобной навигацией
- **Командная строка (CLI)** - мощный CLI с богатым функционалом
- **REST API (FastAPI)** - полноценное API для интеграции с другими системами

### Конфигурация
- **TOML конфигурация** - гибкая настройка через TOML файлы
- **Переменные окружения** - поддержка конфигурации через переменные окружения
- **Валидация конфигурации** - встроенная проверка корректности настроек

## 📦 Установка

### Требования
- Python 3.12+
- Git

### Установка из исходников

```bash
# Клонирование репозитория
git clone https://github.com/vault-watcher/vault-watcher.git
cd vault-watcher

# Создание виртуального окружения
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# или
.venv\Scripts\activate  # Windows

# Установка зависимостей
pip install -e .[dev,gui,api]
```

### Установка через pip

```bash
pip install vault-watcher[gui,api]
```

## 🛠️ Быстрый старт

### 1. Инициализация хранилища

```bash
# Создание нового хранилища
vault-watcher init /path/to/your/vault

# Или с пользовательским конфигом
vault-watcher init /path/to/your/vault --config config.toml
```

### 2. Настройка конфигурации

Отредактируйте файл `configs/vault_watcher.toml`:

```toml
[general]
vault_path = "/path/to/your/vault"
log_level = "INFO"
dry_run = false

[processing]
enable_3d_conversion = true
enable_hash_deduplication = true
enable_auto_categorization = true
```

### 3. Запуск системы

#### Графический интерфейс
```bash
vault-watcher-gui
```

#### Командная строка
```bash
# Запуск наблюдателя
vault-watcher watch

# Просмотр статуса
vault-watcher status

# Валидация хранилища
vault-watcher validate
```

#### API сервер
```bash
# Запуск API сервера
python -m vault_watcher.api
```

## 📁 Структура хранилища

Vault Watcher использует структурированную организацию файлов:

```
vault/
├── 0_INBOX/           # Входящие файлы
├── _ONGOING/          # Файлы в работе
├── 1_PROJECTS/        # Проекты
│   └── PROJECT-NAME/
│       ├── notes/     # Заметки проекта
│       ├── models/    # 3D модели
│       │   ├── src/   # Исходные файлы
│       │   └── glb/   # Конвертированные GLB
│       ├── assets/    # Ресурсы проекта
│       └── _meta/     # Метаданные
├── 2_CATEGORIES/      # Категории знаний
│   └── CATEGORY-NAME/
│       ├── notes/     # Заметки категории
│       ├── incoming/  # Входящие файлы
│       └── _meta/     # Метаданные
├── 3_RESOURCES/       # Ресурсы
│   └── parts/         # Детали
│       └── PART-NAME/
│           ├── models/
│           └── docs/
└── 9_ADMIN/           # Администрирование
    ├── logs/          # Логи
    ├── backups/       # Резервные копии
    └── hash_index.json # База хешей
```

## 🎯 Использование

### Автоматическая категоризация

#### По маскам в имени файла
```
[P:PROJECT-NAME] file.stl          # → 1_PROJECTS/PROJECT-NAME/models/src/
[R:PART-NAME] component.obj        # → 3_RESOURCES/parts/PART-NAME/models/src/
[C:CATEGORY-NAME] document.pdf     # → 2_CATEGORIES/CATEGORY-NAME/incoming/
```

#### По фронтматтеру в заметках
```markdown
---
type: note
project: PROJECT-NAME
---

# Заметка проекта
```

### Конвертация 3D моделей

Система автоматически конвертирует 3D модели в GLB формат:

1. **Поддерживаемые форматы**: STL, OBJ, FBX, DAE, PLY, 3DS, BLEND, STEP, IGES
2. **Инструменты конвертации**: FBX2glTF, assimp, Blender
3. **Автоматическая оптимизация**: сжатие текстур, оптимизация геометрии

### Дедупликация файлов

Система использует SHA256 хеши для обнаружения дубликатов:
- Автоматическое удаление дубликатов
- Сохранение ссылок в базе хешей
- Настраиваемый размер чанков для больших файлов

## ⚙️ Конфигурация

### Основные настройки

```toml
[general]
vault_path = "/path/to/vault"
log_level = "INFO"
log_format = "json"
dry_run = false
backup_enabled = true

[gui]
theme = "dark"
language = "ru"
window_size = [1200, 800]
auto_refresh_interval = 5
```

### Настройки обработки

```toml
[processing]
enable_3d_conversion = true
enable_hash_deduplication = true
enable_auto_categorization = true
enable_backup = true

[3d_conversion]
enable_validator = true
enable_gltfpack = true
axis = "+Yup"
units = "mm"
default_scale = 0.001
conversion_tools = ["FBX2glTF", "assimp", "blender"]
```

### Настройки API

```toml
[api]
enabled = true
host = "127.0.0.1"
port = 8080
cors_origins = ["http://localhost:3000"]
rate_limit = 100
```

## 🔧 API

### Основные эндпоинты

- `GET /` - Информация о API
- `GET /health` - Проверка состояния
- `GET /vault/status` - Статистика хранилища
- `GET /vault/files` - Список файлов
- `POST /watcher/start` - Запуск наблюдателя
- `POST /watcher/stop` - Остановка наблюдателя
- `GET /config` - Получение конфигурации
- `GET /logs` - Получение логов

### Примеры использования

```bash
# Получение статуса хранилища
curl http://localhost:8080/vault/status

# Запуск наблюдателя
curl -X POST http://localhost:8080/watcher/start

# Получение списка файлов
curl http://localhost:8080/vault/files?path=1_PROJECTS
```

## 🎨 Графический интерфейс

### Основные возможности GUI

- **Дерево файлов** - навигация по структуре хранилища
- **Статус системы** - мониторинг состояния наблюдателя
- **Настройки** - конфигурация системы
- **Логи** - просмотр логов в реальном времени
- **Темная тема** - современный дизайн

### Горячие клавиши

- `Ctrl+O` - Открыть хранилище
- `Ctrl+S` - Запустить наблюдатель
- `Ctrl+X` - Остановить наблюдатель
- `F5` - Обновить дерево файлов
- `Ctrl+Q` - Выход

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты
pytest

# Только unit тесты
pytest tests/unit

# Только интеграционные тесты
pytest tests/integration

# С покрытием
pytest --cov=vault_watcher --cov-report=html
```

### Проверка качества кода

```bash
# Линтинг
ruff check .

# Типизация
mypy src/

# Безопасность
bandit -r src/
pip-audit
```

## 📚 Документация

### Дополнительная документация

- [Руководство пользователя](docs/user-guide.md)
- [Руководство разработчика](docs/developer-guide.md)
- [API документация](docs/api.md)
- [Конфигурация](docs/configuration.md)

### Примеры

- [Примеры конфигурации](configs/examples/)
- [Примеры использования](docs/examples/)
- [Интеграции](docs/integrations/)

## 🤝 Вклад в проект

### Установка для разработки

```bash
git clone https://github.com/vault-watcher/vault-watcher.git
cd vault-watcher
pip install -e .[dev]
pre-commit install
```

### Процесс разработки

1. Создайте ветку для новой функции
2. Внесите изменения
3. Добавьте тесты
4. Запустите проверки качества
5. Создайте Pull Request

### Стандарты кода

- **Форматирование**: Black, isort
- **Линтинг**: Ruff
- **Типизация**: MyPy
- **Тестирование**: pytest
- **Документация**: docstrings, README

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для подробностей.

## 🆘 Поддержка

### Сообщения об ошибках

Если вы нашли ошибку, создайте issue в GitHub с подробным описанием:
- Версия Python
- Версия Vault Watcher
- Операционная система
- Шаги для воспроизведения
- Логи ошибки

### Вопросы и обсуждения

- [GitHub Discussions](https://github.com/vault-watcher/vault-watcher/discussions)
- [GitHub Issues](https://github.com/vault-watcher/vault-watcher/issues)

## 🙏 Благодарности

- [Obsidian](https://obsidian.md/) - вдохновение для системы управления знаниями
- [PyQt6](https://www.riverbankcomputing.com/software/pyqt/) - графический интерфейс
- [FastAPI](https://fastapi.tiangolo.com/) - веб API
- [Watchdog](https://python-watchdog.readthedocs.io/) - мониторинг файловой системы
- [Pydantic](https://pydantic-docs.helpmanual.io/) - валидация данных

---

**Vault Watcher** - современная система управления файлами для профессионалов.