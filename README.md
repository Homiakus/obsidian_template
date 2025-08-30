# Obsidian KB Starter (проект-центричная система)

Готовый каркас: схемы JSON, валидатор фронтматтера (pre-commit), усиленный демон-маршрутизатор с 3D-конвейером (.glb), Dockerfile, экспорт JSON-LD, шаблоны Templater.

## Шаги установки

1) **Склонируй репозиторий** и включи Git LFS:
```bash
git lfs install
```

2) **Положи папку/файлы** в корень рядом с твоим Obsidian Vault или внутри репо конфигураций.

3) **Настрой демона**:
- Открой `vault_watcher.py`, поставь `CONFIG["vault"]` на путь к твоему вольту.
- Запусти: `python3 vault_watcher.py` (или через systemd/pm2).

4) **Pre-commit** (опционально):
```bash
pip install pre-commit jsonschema pyyaml
pre-commit install
```
При коммите будет валидироваться фронтматтер `.md` по `schemas/*`.

5) **Docker для 3D** (опционально):
Собери образ: `docker build -t gltf-pipeline .`

6) **Obsidian**:
- Скопируй файлы из `templates/` в папку `3_RESOURCES/templates/` твоего вольта.
- Установи плагины: Templater, Linter, QuickAdd, Tasks, Model Viewer.
- Добавь команды на «узкую ленту» (Commander или мини-плагин).

## Маркеры назначения
- В имени файла: `[P:PROJ-XXXX]`, `[R:PART-0001]`, `[C:CAT-XXX]`.
- Или рядом файл `.assign` с `P:...`/`R:...`/`C:...`.

## Где что лежит
- `schemas/` — JSON Schema для `project/category/part/source/note`.
- `scripts/validate_frontmatter.py` — валидатор для pre-commit.
- `vault_watcher.py` — демон: маршрутизация, glb-конверт, вставка `<model-viewer>`, логи, дедуп.
- `export/context.jsonld` — контекст для портируемого экспорта.
- `templates/` — Templater-шаблоны.

## Отчёт за неделю
```bash
python3 scripts/report_week.py /path/to/Vault/9_ADMIN/logs 7
```

Удачной работы!
