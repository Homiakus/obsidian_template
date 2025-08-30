# Архитектура шаблонов Obsidian Knowledge Architect v2.0

## Обзор структуры

Шаблоны организованы по принципам Diátaxis и FAIR, обеспечивая покрытие всех типов контента:

### 1. Базовые шаблоны (Core Templates)
- `entity.md` - универсальный шаблон сущности
- `concept.md` - концепции и термины
- `process.md` - процессы и процедуры
- `decision.md` - решения и ADR

### 2. Документационные шаблоны (Documentation Templates)
- `tutorial.md` - пошаговые инструкции
- `how-to.md` - практические руководства
- `reference.md` - справочная информация
- `explanation.md` - объяснения и концепции

### 3. Управленческие шаблоны (Management Templates)
- `project.md` - проекты
- `sprint.md` - спринты и итерации
- `meeting.md` - встречи и обсуждения
- `review.md` - ревью и проверки

### 4. Специализированные шаблоны (Specialized Templates)
- `ontology.md` - онтологические элементы
- `cq.md` - вопросы компетентности
- `metric.md` - метрики и измерения
- `pattern.md` - паттерны и решения

## Принципы именования

- Все шаблоны используют UID в формате: `YYYYMMDD-HHMMSS-<TYPE>-<VERSION>`
- Теги структурированы: `domain/<domain>`, `type/<type>`, `status/<status>`
- Алиасы для поиска: `[alias1, alias2, ...]`

## Frontmatter стандарт

```yaml
---
id: <UID>
title: <Title>
status: draft|active|deprecated
aliases: [alias1, alias2]
tags: [domain/<domain>, type/<type>, status/<status>]
created: {{date}}
updated: {{date}}
owner: <role>
version: <semver>
---
```

## Связность и граф

- Каждый шаблон включает секции для связей
- Обязательные Dataview индексы
- Canvas-карты для визуализации