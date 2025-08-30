---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-concept-1.0
title: <Concept Name>
status: draft
aliases: [synonym1, synonym2]
tags: [domain/<domain>, type/concept, status/draft]
created: {{date}}
updated: {{date}}
owner: <ontologist>
version: 1.0.0
schema: concept-v1
---

# <Concept Name>

## Определение
Формальное определение концепции согласно онтологическим принципам.

## Синонимы
- Синоним 1
- Синоним 2

## Антонимы
- Антоним 1
- Антоним 2

## Иерархия
- **Родительская концепция**: [[Parent Concept]]
- **Дочерние концепции**: 
  - [[Child Concept 1]]
  - [[Child Concept 2]]

## Связанные концепции
- **Часть-целое**: [[Whole Concept]]
- **Причина-следствие**: [[Effect Concept]]
- **Ассоциации**: [[Related Concept 1]], [[Related Concept 2]]

## Примеры использования
- Пример 1: контекст использования
- Пример 2: контекст использования

## Ограничения и исключения
- Ограничение 1
- Исключение 1

## Competency Questions (CQ)
- **CQ1**: Какой вопрос можно задать для проверки понимания?
- **CQ2**: Какой сценарий использования покрывает эта концепция?

## Dataview индекс концепций
```dataview
TABLE file.mtime AS Updated, tags
FROM #type/concept
WHERE contains(tags, "domain/<domain>")
SORT file.mtime desc
```

## SKOS разметка
```turtle
<#ConceptName> a skos:Concept ;
    skos:prefLabel "<Concept Name>"@ru ;
    skos:altLabel "synonym1"@ru, "synonym2"@ru ;
    skos:definition "Определение концепции"@ru ;
    skos:broader <#ParentConcept> ;
    skos:narrower <#ChildConcept1>, <#ChildConcept2> ;
    skos:related <#RelatedConcept1>, <#RelatedConcept2> .
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание концепции