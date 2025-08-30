---
id: {{date:YYYYMMDD}}-{{time:HHmmss}}-person-1.0
title: <Person Name>
status: active
aliases: [person1, contact]
tags: [domain/organization, type/person, status/active]
created: {{date}}
updated: {{date}}
owner: <hr-manager>
version: 1.0.0
schema: person-v1
person_type: employee|contractor|client|partner
role: <role>
department: <department>
---

# <Person Name>

## Общая информация
Краткое описание человека, его роли и основных характеристик.

## Личная информация

### Основные данные
- **ФИО**: <full-name>
- **Должность**: <position>
- **Отдел**: <department>
- **Роль**: <role>
- **Тип**: <person-type>

### Контактная информация
- **Email**: <email>
- **Телефон**: <phone>
- **Мессенджеры**: <messengers>
- **Адрес**: <address>

### Профессиональная информация
- **Организация**: <organization>
- **Дата начала работы**: <start-date>
- **Статус**: <status>
- **Руководитель**: <manager>

## Компетенции и навыки

### Технические навыки
- **Навык 1**: <level> - <description>
- **Навык 2**: <level> - <description>
- **Навык 3**: <level> - <description>

### Профессиональные компетенции
- **Компетенция 1**: <level> - <description>
- **Компетенция 2**: <level> - <description>
- **Компетенция 3**: <level> - <description>

### Сертификации
- **Сертификация 1**: <issuer> - <date> - <expiry>
- **Сертификация 2**: <issuer> - <date> - <expiry>

## Образование и опыт

### Образование
- **Уровень**: <degree>
- **Специальность**: <specialty>
- **Учебное заведение**: <institution>
- **Год окончания**: <graduation-year>

### Опыт работы
- **Общий стаж**: <total-experience>
- **Стаж в организации**: <company-experience>
- **Предыдущие места работы**: <previous-employers>

### Проекты
- **Текущие проекты**: <current-projects>
- **Завершенные проекты**: <completed-projects>
- **Ключевые достижения**: <achievements>

## Ответственности и полномочия

### Обязанности
- **Обязанность 1**: <description>
- **Обязанность 2**: <description>
- **Обязанность 3**: <description>

### Полномочия
- **Полномочие 1**: <description>
- **Полномочие 2**: <description>
- **Полномочие 3**: <description>

### Подчиненность
- **Подчиняется**: <reports-to>
- **Подчиненные**: <subordinates>
- **Матричная подчиненность**: <matrix-reporting>

## Проекты и задачи

### Текущие задачи
- [ ] **Задача 1**: <description> - <deadline>
- [ ] **Задача 2**: <description> - <deadline>
- [ ] **Задача 3**: <description> - <deadline>

### Участие в проектах
- **Проект 1**: <role> - <period>
- **Проект 2**: <role> - <period>
- **Проект 3**: <role> - <period>

### Ключевые результаты
- **Результат 1**: <description> - <date>
- **Результат 2**: <description> - <date>
- **Результат 3**: <description> - <date>

## Развитие и обучение

### План развития
- **Цель 1**: <description> - <target-date>
- **Цель 2**: <description> - <target-date>
- **Цель 3**: <description> - <target-date>

### Обучение
- **Курс 1**: <name> - <provider> - <date>
- **Курс 2**: <name> - <provider> - <date>
- **Курс 3**: <name> - <provider> - <date>

### Наставничество
- **Наставник**: <mentor>
- **Подопечные**: <mentees>
- **Программа**: <mentoring-program>

## Коммуникация и предпочтения

### Стиль работы
- **Предпочитаемый способ связи**: <communication-style>
- **Время работы**: <work-hours>
- **Часовой пояс**: <timezone>
- **Языки**: <languages>

### Предпочтения
- **Тип задач**: <task-preferences>
- **Среда работы**: <work-environment>
- **Мотивация**: <motivation-factors>

## Документация

### Личные документы
- [[Employment Contract]] - трудовой договор
- [[Job Description]] - должностная инструкция
- [[Performance Review]] - оценка эффективности
- [[Development Plan]] - план развития

### Проектная документация
- [[Project Assignments]] - назначения на проекты
- [[Task List]] - список задач
- [[Achievement Log]] - журнал достижений

## Связанные записи
- [[Organization]] - организация
- [[Department]] - отдел
- [[Project 1]] - проект 1
- [[Project 2]] - проект 2

## Dataview индекс людей
```dataview
TABLE person_type, role, department, status, file.mtime AS Updated
FROM #type/person
SORT file.mtime desc
```

## Примечания
- Примечание 1
- Примечание 2

## История изменений
- {{date}} - Создание записи