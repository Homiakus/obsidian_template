---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-metric-1.0
title: <Metric Title>
status: draft
aliases: [metric1, kpi1]
tags: [domain/<domain>, type/metric, status/draft]
created: {{date}}
updated: {{date}}
owner: <data-scientist>
version: 1.0.0
schema: metric-v1
metric_type: performance|quality|business
unit: <unit>
---

# <Metric Title>

## Определение
Формальное определение метрики и что она измеряет.

## Тип метрики
- **Производительность**: измеряет эффективность процессов
- **Качество**: измеряет качество результатов
- **Бизнес**: измеряет бизнес-показатели

## Формула расчета
```
Метрика = (Параметр1 + Параметр2) / Параметр3
```

## Единицы измерения
- **Единица**: <unit>
- **Масштаб**: <scale>
- **Точность**: <precision>

## Целевые значения
- **Минимум**: <min_value>
- **Цель**: <target_value>
- **Максимум**: <max_value>

## Источники данных
- **Источник 1**: описание и доступ
- **Источник 2**: описание и доступ

## Частота измерения
- **Периодичность**: ежедневно/еженедельно/ежемесячно
- **Время измерения**: <time>

## Тренды и анализ

### Текущие значения
| Дата | Значение | Изменение | Комментарий |
|------|----------|-----------|-------------|
| {{date}} | <value> | <change> | <comment> |
| {{date}} | <value> | <change> | <comment> |

### График тренда
- Ссылка на график: [Graph Link](link)

## Корреляции
- **Положительная корреляция**: [[Metric 1]] - описание
- **Отрицательная корреляция**: [[Metric 2]] - описание

## Влияющие факторы
- **Фактор 1**: описание влияния
- **Фактор 2**: описание влияния

## Автоматизация

### Dataview запрос
```dataview
TABLE metric_value, date
FROM #type/metric
WHERE title = "<Metric Title>"
SORT date desc
LIMIT 10
```

### Скрипт расчета
```javascript
function calculateMetric(data) {
    // Логика расчета метрики
    return result;
}
```

## Алерты и уведомления
- **Критический уровень**: <critical_value> - действие
- **Предупреждение**: <warning_value> - действие

## Связанные метрики
- [[Metric 1]] - связанная метрика
- [[Metric 2]] - связанная метрика

## Документация
- [[Dashboard]] - дашборд с метрикой
- [[Report]] - отчет по метрике

## Dataview индекс метрик
```dataview
TABLE metric_type, unit, status, file.mtime AS Updated
FROM #type/metric
WHERE contains(tags, "domain/<domain>")
SORT file.mtime desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание метрики