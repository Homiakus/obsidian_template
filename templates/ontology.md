---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-ontology-1.0
title: <Ontology Element Title>
status: draft
aliases: [ontology1, ontological-element]
tags: [domain/<domain>, type/ontology, status/draft]
created: {{date}}
updated: {{date}}
owner: <ontologist>
version: 1.0.0
schema: ontology-v1
element_type: class|property|individual
---

# <Ontology Element Title>

## Определение
Формальное определение онтологического элемента.

## Тип элемента
- **Класс**: описание класса
- **Свойство**: описание свойства
- **Индивид**: описание индивида

## Иерархия

### Родительские элементы
- [[Parent Element 1]]
- [[Parent Element 2]]

### Дочерние элементы
- [[Child Element 1]]
- [[Child Element 2]]

## Свойства

### Объектные свойства
- **hasProperty**: [[Related Element]] - описание
- **isPartOf**: [[Whole Element]] - описание

### Свойства данных
- **hasName**: string - имя элемента
- **hasDescription**: string - описание элемента

## Ограничения
- **Ограничение 1**: описание
- **Ограничение 2**: описание

## Примеры
- Пример 1: описание
- Пример 2: описание

## Competency Questions (CQ)
- **CQ1**: Вопрос для проверки понимания
- **CQ2**: Вопрос для проверки понимания

## OWL разметка
```xml
<owl:Class rdf:about="#ElementName">
    <rdfs:label>Element Name</rdfs:label>
    <rdfs:comment>Description of the element</rdfs:comment>
    <rdfs:subClassOf rdf:resource="#ParentElement"/>
    <owl:disjointWith rdf:resource="#DisjointElement"/>
</owl:Class>
```

## SKOS разметка
```turtle
<#ElementName> a skos:Concept ;
    skos:prefLabel "Element Name"@en ;
    skos:definition "Definition of the element"@en ;
    skos:broader <#ParentElement> ;
    skos:narrower <#ChildElement1>, <#ChildElement2> ;
    skos:related <#RelatedElement1>, <#RelatedElement2> .
```

## SHACL проверки
```turtle
<#ElementShape> a sh:NodeShape ;
    sh:targetClass <#ElementName> ;
    sh:property [
        sh:path <#hasProperty> ;
        sh:class <#RelatedElement> ;
        sh:minCount 1 ;
        sh:maxCount 1
    ] ;
    sh:property [
        sh:path <#hasName> ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1
    ] .
```

## Связанные элементы
- [[Related Element 1]] - описание связи
- [[Related Element 2]] - описание связи

## Dataview индекс онтологии
```dataview
TABLE element_type, status, file.mtime AS Updated
FROM #type/ontology
WHERE contains(tags, "domain/<domain>")
SORT file.mtime desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание онтологического элемента