---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-sprint-1.0
title: <Sprint Title>
status: active
aliases: [sprint1, iteration1]
tags: [domain/<domain>, type/sprint, status/active]
created: {{date}}
updated: {{date}}
owner: <scrum-master>
version: 1.0.0
schema: sprint-v1
sprint_number: <N>
project: <PROJECT_CODE>
---

# <Sprint Title>

## Обзор спринта
Краткое описание целей и задач спринта.

## Временные рамки
- **Начало**: {{date}}
- **Окончание**: {{date}}
- **Длительность**: X дней

## Цели спринта
- [ ] Цель 1
- [ ] Цель 2
- [ ] Цель 3

## Бэклог спринта

### Выполнено ✅
- [x] Задача 1 - <assignee> - <story-points>sp
- [x] Задача 2 - <assignee> - <story-points>sp

### В работе 🔄
- [ ] Задача 3 - <assignee> - <story-points>sp
- [ ] Задача 4 - <assignee> - <story-points>sp

### К выполнению 📋
- [ ] Задача 5 - <assignee> - <story-points>sp
- [ ] Задача 6 - <assignee> - <story-points>sp

## Метрики спринта
- **Планируемые story points**: X
- **Выполненные story points**: X
- **Скорость команды**: X sp/день
- **Burndown**: [ссылка на график]

## Ежедневные стендапы

### День 1 ({{date}})
- **Участник 1**: что сделал / что планирует / блокеры
- **Участник 2**: что сделал / что планирует / блокеры

### День 2 ({{date}})
- **Участник 1**: что сделал / что планирует / блокеры
- **Участник 2**: что сделал / что планирует / блокеры

## Блокеры и проблемы
| Проблема | Влияние | Статус | Ответственный |
|----------|---------|--------|---------------|
| Проблема 1 | Высокое | Решается | <Name> |
| Проблема 2 | Среднее | Открыта | <Name> |

## Ретроспектива

### Что прошло хорошо
- Пункт 1
- Пункт 2

### Что можно улучшить
- Пункт 1
- Пункт 2

### Действия
- [ ] Действие 1 - <assignee> - <deadline>
- [ ] Действие 2 - <assignee> - <deadline>

## Демо
- **Дата**: {{date}}
- **Участники**: <list>
- **Демонстрируемые функции**:
  - Функция 1
  - Функция 2

## Связанные артефакты
- [[Sprint Planning]] - планирование спринта
- [[Sprint Review]] - обзор спринта
- [[Sprint Retrospective]] - ретроспектива

## Dataview индекс спринтов
```dataview
TABLE sprint_number, status, project, file.mtime AS Updated
FROM #type/sprint
WHERE contains(tags, "domain/<domain>")
SORT sprint_number desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание спринта