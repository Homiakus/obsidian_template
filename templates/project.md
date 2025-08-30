---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-project-1.0
title: <Project Title>
status: active
aliases: [project1, project-code]
tags: [domain/<domain>, type/project, status/active]
created: {{date}}
updated: {{date}}
owner: <project-manager>
version: 1.0.0
schema: project-v1
code: <PROJECT_CODE>
priority: high|medium|low
---

# <Project Title>

## Обзор проекта
Краткое описание проекта, его цели и ожидаемые результаты.

## Цели и задачи

### Основные цели
- Цель 1
- Цель 2
- Цель 3

### Критерии успеха
- [ ] Критерий 1
- [ ] Критерий 2
- [ ] Критерий 3

## Команда проекта
- **Руководитель**: <Name> - <Role>
- **Участник 1**: <Name> - <Role>
- **Участник 2**: <Name> - <Role>

## Временные рамки
- **Начало**: {{date}}
- **Планируемое завершение**: {{date}}
- **Фактическое завершение**: <date>

## Этапы проекта

### Этап 1: <Название этапа>
- **Статус**: <not-started|in-progress|completed>
- **Сроки**: <start> - <end>
- **Ответственный**: <Name>
- **Задачи**:
  - [ ] Задача 1
  - [ ] Задача 2
  - [ ] Задача 3

### Этап 2: <Название этапа>
- **Статус**: <not-started|in-progress|completed>
- **Сроки**: <start> - <end>
- **Ответственный**: <Name>
- **Задачи**:
  - [ ] Задача 1
  - [ ] Задача 2
  - [ ] Задача 3

## Ресурсы
- **Бюджет**: <amount>
- **Инструменты**: <list>
- **Материалы**: <list>

## Риски и проблемы
| Риск | Вероятность | Влияние | Меры по снижению |
|------|-------------|---------|------------------|
| Риск 1 | Высокая | Критическое | Мера 1 |
| Риск 2 | Средняя | Высокое | Мера 2 |

## Зависимости
- **Внутренние**: [[Project 1]], [[Project 2]]
- **Внешние**: [External Dependency 1](link)

## Документация
- [[Requirements]] - требования
- [[Design]] - дизайн
- [[Test Plan]] - план тестирования
- [[User Manual]] - руководство пользователя

## Связанные проекты
- [[Project 1]] - предшествующий проект
- [[Project 2]] - связанный проект

## Метрики и KPI
- **Метрика 1**: текущее значение / целевое значение
- **Метрика 2**: текущее значение / целевое значение

## Dataview индекс проектов
```dataview
TABLE status, owner, priority, file.mtime AS Updated
FROM #type/project
WHERE contains(tags, "domain/<domain>")
SORT file.mtime desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание проекта
