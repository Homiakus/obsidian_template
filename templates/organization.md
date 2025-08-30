---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-organization-1.0
title: <Organization Name>
status: active
aliases: [org1, company]
tags: [domain/organization, type/organization, status/active]
created: {{date}}
updated: {{date}}
owner: <organization-manager>
version: 1.0.0
schema: organization-v1
organization_type: company|department|team|partner|client
industry: <industry>
size: small|medium|large
---

# <Organization Name>

## Общая информация
Краткое описание организации, её назначения и основных характеристик.

## Основные данные

### Организационная информация
- **Название**: <full-name>
- **Тип**: <organization-type>
- **Отрасль**: <industry>
- **Размер**: <size>
- **Дата основания**: <founded-date>

### Контактная информация
- **Адрес**: <address>
- **Телефон**: <phone>
- **Email**: <email>
- **Веб-сайт**: <website>
- **Социальные сети**: <social-media>

### Юридическая информация
- **ИНН**: <tax-id>
- **ОГРН**: <registration-number>
- **Юридический адрес**: <legal-address>
- **Банковские реквизиты**: <bank-details>

## Структура организации

### Организационная структура
```
Organization/
├── Department 1/
│   ├── Team 1.1
│   └── Team 1.2
├── Department 2/
│   ├── Team 2.1
│   └── Team 2.2
└── Department 3/
    └── Team 3.1
```

### Руководство
- **Генеральный директор**: <ceo>
- **Технический директор**: <cto>
- **Финансовый директор**: <cfo>
- **Директор по персоналу**: <hr-director>

### Ключевые сотрудники
- **Руководитель 1**: <name> - <position>
- **Руководитель 2**: <name> - <position>
- **Руководитель 3**: <name> - <position>

## Деятельность

### Основные направления
- **Направление 1**: <description>
- **Направление 2**: <description>
- **Направление 3**: <description>

### Продукты и услуги
- **Продукт 1**: <description>
- **Продукт 2**: <description>
- **Услуга 1**: <description>
- **Услуга 2**: <description>

### Рынки и клиенты
- **Целевые рынки**: <target-markets>
- **Ключевые клиенты**: <key-clients>
- **География**: <geography>

## Проекты и сотрудничество

### Текущие проекты
- **Проект 1**: <description> - <status>
- **Проект 2**: <description> - <status>
- **Проект 3**: <description> - <status>

### Завершенные проекты
- **Проект 1**: <description> - <completion-date>
- **Проект 2**: <description> - <completion-date>
- **Проект 3**: <description> - <completion-date>

### Партнерства
- **Партнер 1**: <type> - <description>
- **Партнер 2**: <type> - <description>
- **Партнер 3**: <type> - <description>

## Ресурсы и возможности

### Человеческие ресурсы
- **Общая численность**: <total-employees>
- **Ключевые специалисты**: <key-specialists>
- **Экспертиза**: <expertise-areas>

### Технические ресурсы
- **Оборудование**: <equipment>
- **Технологии**: <technologies>
- **Инфраструктура**: <infrastructure>

### Финансовые показатели
- **Годовой оборот**: <annual-revenue>
- **Прибыль**: <profit>
- **Инвестиции**: <investments>

## Процессы и процедуры

### Основные процессы
- **Процесс 1**: <description>
- **Процесс 2**: <description>
- **Процесс 3**: <description>

### Стандарты и сертификации
- **Стандарт 1**: <name> - <status>
- **Стандарт 2**: <name> - <status>
- **Сертификация 1**: <name> - <expiry-date>

### Политики и процедуры
- **Политика 1**: <name> - <description>
- **Политика 2**: <name> - <description>
- **Процедура 1**: <name> - <description>

## Культура и ценности

### Миссия и видение
- **Миссия**: <mission>
- **Видение**: <vision>
- **Ценности**: <values>

### Корпоративная культура
- **Стиль управления**: <management-style>
- **Коммуникация**: <communication-style>
- **Принятие решений**: <decision-making>

### Социальная ответственность
- **Экология**: <environmental-initiatives>
- **Социальные проекты**: <social-projects>
- **Благотворительность**: <charity>

## Документация

### Организационные документы
- [[Organization Chart]] - организационная структура
- [[Business Plan]] - бизнес-план
- [[Annual Report]] - годовой отчет
- [[Policies and Procedures]] - политики и процедуры

### Проектная документация
- [[Project Portfolio]] - портфель проектов
- [[Partnership Agreements]] - соглашения о партнерстве
- [[Contract Templates]] - шаблоны договоров

### Операционная документация
- [[Process Documentation]] - документация процессов
- [[Quality Manual]] - руководство по качеству
- [[Safety Procedures]] - процедуры безопасности

## Связанные записи
- [[Person 1]] - сотрудник 1
- [[Person 2]] - сотрудник 2
- [[Project 1]] - проект 1
- [[Project 2]] - проект 2

## Dataview индекс организаций
```dataview
TABLE organization_type, industry, size, status, file.mtime AS Updated
FROM #type/organization
SORT file.mtime desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание записи