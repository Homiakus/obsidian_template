---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-entity-1.0
title: <Entity Title>
status: draft
aliases: [alias1, alias2]
tags: [domain/<domain>, type/entity, status/draft]
created: {{date}}
updated: {{date}}
owner: <role>
version: 1.0.0
schema: entity-v1
---

# <Entity Title>

## Описание
Краткое описание сущности и её назначения.

## Определение
Формальное определение сущности в контексте домена.

## Атрибуты
- **Атрибут 1**: описание
- **Атрибут 2**: описание

## Отношения
- **Отношение к X**: описание связи
- **Отношение от Y**: описание связи

## Примеры
- Пример 1
- Пример 2

## Связанные концепции
- [[Concept 1]]
- [[Concept 2]]

## Dataview индекс
```dataview
TABLE file.mtime AS Updated
FROM [[Entity Title]]
SORT file.mtime desc
```

## Canvas карта
- Ссылка на Canvas карту: [[Canvas Entity Map]]

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание заметки