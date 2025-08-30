---
id: repository-architecture-overview
title: Repository Architecture Overview
status: draft
tags: [docspro/architecture]
created: 2024-04-17
updated: 2024-04-17
---

# Repository Architecture

Этот документ описывает назначение корневых каталогов и ключевых элементов хранилища.

- `1_PROJECTS/` — заметки по проектам, организованные по маскам и шаблонам.
- `2_CATEGORIES/` — категория знаний с подкаталогами и заметками.
- `3_RESOURCES/` — ресурсы: части, системы, источники, законы.
- `kb/` — выделенная база знаний (KB). Включает подпапку `contacts/` с заметками по шаблону `templates/contact_template.md`.
- `docspro/` — документация, процессы и артефакты развития хранилища.
- `export/` — подготовленные для экспорта данные и отчёты.
- `schemas/` — JSON Schema для различных типов сущностей.
- `scripts/` — скрипты автоматизации и валидации (`validate_frontmatter.py`, `report_week.py`, `export_archive.py`).
- `templates/` — общие шаблоны для создания заметок, включая `contact_template.md` и `standard_item_template.md`.
- `vault_watcher.py` — наблюдатель, обрабатывающий маски и перемещающий файлы.

Дополнительные каталоги и файлы могут появляться в зависимости от развития проекта и плагинов.
