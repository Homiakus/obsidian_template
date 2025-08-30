---
id: standard-items
title: Standard Item Template
status: draft
tags: [docspro/templates]
created: 2024-04-17
updated: 2024-04-17
---

# Standard Item Template

`templates/standard_item_template.md` задаёт структуру для стандартных изделий,
включая поле `email` для интеграции с почтой и кнопку экспорта архива.

## Архивирование
- Дополнительные файлы помещаются в подпапку `archive/` рядом с заметкой.
- Кнопка `Export archive` запускает `scripts/export_archive.py`, который
  упаковывает содержимое `archive/` в `export/<название>-archive.zip`.

## Почтовая интеграция
- Укажите рабочий адрес в поле `email`.
- Ссылки `mailto:` можно вставлять в разделе описания или автоматизировать
  через плагины Templater/Buttons.
