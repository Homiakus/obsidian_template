---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-standard-part-1.0
title: <Standard Part Name>
status: active
aliases: [part1, standard-component]
tags: [domain/technology/mechanical, type/standard-part, status/active]
created: {{date}}
updated: {{date}}
owner: <mechanical-engineer>
version: 1.0.0
schema: standard-part-v1
part_type: fastener|bearing|seal|spring|other
standard: <standard-number>
manufacturer: <manufacturer>
---

# <Standard Part Name>

## Обзор детали
Краткое описание стандартной детали, её назначения и применения.

## Основные характеристики

### Технические параметры
- **Тип**: <part-type>
- **Стандарт**: <standard>
- **Производитель**: <manufacturer>
- **Материал**: <material>
- **Размеры**: <dimensions>

### Физические свойства
- **Вес**: <weight>
- **Плотность**: <density>
- **Твердость**: <hardness>
- **Прочность**: <strength>

## Спецификация

### Размеры и допуски
| Параметр | Значение | Допуск | Единица |
|----------|----------|--------|---------|
| <Parameter 1> | <Value 1> | <Tolerance 1> | <Unit 1> |
| <Parameter 2> | <Value 2> | <Tolerance 2> | <Unit 2> |

### Механические свойства
- **Предел прочности**: <tensile-strength>
- **Предел текучести**: <yield-strength>
- **Модуль упругости**: <elastic-modulus>
- **Коэффициент Пуассона**: <poisson-ratio>

## Применение

### Типовые применения
- **Применение 1**: <description>
- **Применение 2**: <description>
- **Применение 3**: <description>

### Ограничения
- **Температурный диапазон**: <temperature-range>
- **Максимальная нагрузка**: <max-load>
- **Скорость**: <speed-limits>
- **Среда**: <environment-limits>

## Закупка и поставка

### Поставщики
| Поставщик | Каталожный номер | Цена | Срок поставки |
|-----------|------------------|------|---------------|
| <Supplier 1> | <Part Number 1> | <Price 1> | <Lead Time 1> |
| <Supplier 2> | <Part Number 2> | <Price 2> | <Lead Time 2> |

### Упаковка
- **Единица упаковки**: <packaging-unit>
- **Количество в упаковке**: <quantity-per-package>
- **Вес упаковки**: <package-weight>

### Хранение
- **Условия хранения**: <storage-conditions>
- **Срок годности**: <shelf-life>
- **Требования к влажности**: <humidity-requirements>

## Качество и контроль

### Стандарты качества
- **Стандарт**: <quality-standard>
- **Сертификация**: <certification>
- **Контроль качества**: <quality-control>

### Испытания
- **Тип испытаний**: <test-type>
- **Частота испытаний**: <test-frequency>
- **Критерии приемки**: <acceptance-criteria>

## Замена и совместимость

### Аналоги
- **Аналог 1**: <alternative-1>
- **Аналог 2**: <alternative-2>
- **Аналог 3**: <alternative-3>

### Совместимость
- **Совместимые детали**: <compatible-parts>
- **Несовместимые детали**: <incompatible-parts>
- **Особенности монтажа**: <mounting-notes>

## Документация

### Техническая документация
- [[Technical Drawing]] - технический чертеж
- [[Material Certificate]] - сертификат материала
- [[Test Report]] - отчет об испытаниях
- [[Installation Guide]] - руководство по установке

### Каталожная информация
- [[Catalog Page]] - страница каталога
- [[Data Sheet]] - технический паспорт
- [[Safety Data Sheet]] - паспорт безопасности

## Автоматизация

### Генерация спецификации
```javascript
// Автоматическая генерация спецификации
function generateSpecification(partData) {
    return {
        partNumber: partData.number,
        description: partData.description,
        dimensions: partData.dimensions,
        material: partData.material,
        standard: partData.standard,
        manufacturer: partData.manufacturer
    };
}
```

### Экспорт в различные форматы
- **Excel**: Автоматическая генерация спецификации
- **PDF**: Технический паспорт
- **CAD**: 3D модель для вставки в сборку

## Связанные детали
- [[Similar Part 1]] - аналогичная деталь
- [[Compatible Part 1]] - совместимая деталь
- [[Assembly 1]] - сборка, где используется

## Dataview индекс стандартных деталей
```dataview
TABLE part_type, standard, manufacturer, status, file.mtime AS Updated
FROM #type/standard-part
SORT file.mtime desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание детали