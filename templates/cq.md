---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-cq-1.0
title: <Competency Question Title>
status: draft
aliases: [cq1, competency-question]
tags: [domain/<domain>, type/cq, status/draft]
created: {{date}}
updated: {{date}}
owner: <ontologist>
version: 1.0.0
schema: cq-v1
---

# <Competency Question Title>

## Вопрос
Формулировка вопроса компетентности, который должна покрывать онтология.

## Контекст
Описание ситуации, в которой возникает этот вопрос.

## Пользователь
- **Роль**: <роль пользователя>
- **Цель**: <что хочет достичь пользователь>
- **Предварительные знания**: <что должен знать пользователь>

## Ожидаемый ответ
Структура и формат ожидаемого ответа.

### Поля ответа
- **Поле 1**: описание
- **Поле 2**: описание

### Пример ответа
```
{
  "field1": "значение1",
  "field2": "значение2"
}
```

## Проверка
Как проверить, что онтология покрывает этот вопрос.

### Dataview запрос
```dataview
TABLE field1, field2
FROM #type/entity
WHERE contains(tags, "domain/<domain>")
SORT field1 asc
```

### SHACL проверка
```turtle
<#CQShape> a sh:NodeShape ;
    sh:targetClass <#EntityClass> ;
    sh:property [
        sh:path <#field1> ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1
    ] ;
    sh:property [
        sh:path <#field2> ;
        sh:datatype xsd:string ;
        sh:minCount 1
    ] .
```

## Связанные концепции
- [[Concept 1]] - объясняет поле 1
- [[Concept 2]] - объясняет поле 2

## Связанные CQ
- [[CQ 1]] - более общий вопрос
- [[CQ 2]] - более специфичный вопрос

## Статус покрытия
- [ ] Онтология покрывает вопрос
- [ ] Есть тестовые данные
- [ ] Запрос возвращает корректные результаты
- [ ] Документированы ограничения

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание CQ