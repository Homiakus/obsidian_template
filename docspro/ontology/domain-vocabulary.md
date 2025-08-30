# Словарь доменов Obsidian Knowledge Architect v2.0

## Обзор

Словарь доменов определяет основные области знаний и их классификацию для структурирования контента в системе Obsidian Knowledge Architect v2.0.

## Структура доменов

### 1. Бизнес-домены (Business Domains)

#### `domain/business`
**Описание**: Бизнес-процессы, стратегия, управление
**Поддомены**:
- `domain/business/strategy` - стратегическое планирование
- `domain/business/operations` - операционная деятельность
- `domain/business/finance` - финансы и бухгалтерия
- `domain/business/marketing` - маркетинг и продажи
- `domain/business/hr` - управление персоналом

#### `domain/management`
**Описание**: Управление проектами, процессами, изменениями
**Поддомены**:
- `domain/management/project` - управление проектами
- `domain/management/process` - управление процессами
- `domain/management/change` - управление изменениями
- `domain/management/quality` - управление качеством

### 2. Технологические домены (Technology Domains)

#### `domain/technology`
**Описание**: Технологии, разработка, инфраструктура
**Поддомены**:
- `domain/technology/software` - разработка программного обеспечения
- `domain/technology/infrastructure` - инфраструктура и DevOps
- `domain/technology/data` - данные и аналитика
- `domain/technology/security` - информационная безопасность
- `domain/technology/ai` - искусственный интеллект и машинное обучение

#### `domain/development`
**Описание**: Разработка и программирование
**Поддомены**:
- `domain/development/frontend` - фронтенд разработка
- `domain/development/backend` - бэкенд разработка
- `domain/development/mobile` - мобильная разработка
- `domain/development/database` - работа с базами данных

### 3. Домены знаний (Knowledge Domains)

#### `domain/knowledge`
**Описание**: Управление знаниями и обучение
**Поддомены**:
- `domain/knowledge/ontology` - онтологии и семантика
- `domain/knowledge/learning` - обучение и развитие
- `domain/knowledge/research` - исследования и анализ
- `domain/knowledge/documentation` - документация и техническое письмо

#### `domain/obsidian`
**Описание**: Специфичные для Obsidian темы
**Поддомены**:
- `domain/obsidian/templates` - шаблоны и структуры
- `domain/obsidian/plugins` - плагины и расширения
- `domain/obsidian/workflows` - рабочие процессы
- `domain/obsidian/automation` - автоматизация

### 4. Организационные домены (Organizational Domains)

#### `domain/organization`
**Описание**: Организационная структура и культура
**Поддомены**:
- `domain/organization/structure` - организационная структура
- `domain/organization/culture` - корпоративная культура
- `domain/organization/policy` - политики и процедуры
- `domain/organization/compliance` - соответствие требованиям

#### `domain/team`
**Описание**: Команды и сотрудничество
**Поддомены**:
- `domain/team/collaboration` - совместная работа
- `domain/team/communication` - коммуникация
- `domain/team/leadership` - лидерство
- `domain/team/development` - развитие команды

## Типы контента

### Базовые типы
- `type/entity` - сущности и объекты
- `type/concept` - концепции и термины
- `type/process` - процессы и процедуры
- `type/decision` - решения и ADR

### Документационные типы
- `type/tutorial` - обучающие материалы
- `type/how-to` - практические руководства
- `type/reference` - справочная информация
- `type/explanation` - объяснения и концепции

### Управленческие типы
- `type/project` - проекты
- `type/sprint` - спринты и итерации
- `type/meeting` - встречи
- `type/review` - ревью и проверки

### Специализированные типы
- `type/ontology` - онтологические элементы
- `type/cq` - вопросы компетентности
- `type/metric` - метрики и измерения
- `type/pattern` - паттерны и решения

## Статусы

### Жизненный цикл
- `status/draft` - черновик
- `status/active` - активный
- `status/deprecated` - устаревший
- `status/archived` - архивный

### Приоритеты
- `priority/critical` - критический
- `priority/high` - высокий
- `priority/medium` - средний
- `priority/low` - низкий

## Роли и владельцы

### Роли
- `owner/architect` - архитектор знаний
- `owner/ontologist` - онтолог
- `owner/analyst` - системный аналитик
- `owner/developer` - разработчик
- `owner/manager` - менеджер
- `owner/curator` - куратор паттернов
- `owner/docs-lead` - руководитель документации

## SKOS разметка

```turtle
# Домены
<#BusinessDomain> a skos:ConceptScheme ;
    skos:prefLabel "Business Domains"@en ;
    skos:definition "Business-related knowledge domains"@en .

<#TechnologyDomain> a skos:ConceptScheme ;
    skos:prefLabel "Technology Domains"@en ;
    skos:definition "Technology-related knowledge domains"@en .

<#KnowledgeDomain> a skos:ConceptScheme ;
    skos:prefLabel "Knowledge Domains"@en ;
    skos:definition "Knowledge management domains"@en .

# Концепции доменов
<#Business> a skos:Concept ;
    skos:prefLabel "Business"@en ;
    skos:definition "Business processes and management"@en ;
    skos:inScheme <#BusinessDomain> ;
    skos:narrower <#Strategy>, <#Operations>, <#Finance> .

<#Technology> a skos:Concept ;
    skos:prefLabel "Technology"@en ;
    skos:definition "Technology and development"@en ;
    skos:inScheme <#TechnologyDomain> ;
    skos:narrower <#Software>, <#Infrastructure>, <#Data> .
```

## Dataview индексы

### Индекс по доменам
```dataview
TABLE file.mtime AS Updated, tags
FROM ""
WHERE contains(tags, "domain/")
SORT file.mtime desc
```

### Индекс по типам
```dataview
TABLE domain, status, owner, file.mtime AS Updated
FROM ""
WHERE contains(tags, "type/")
SORT file.mtime desc
```

### Индекс активных заметок
```dataview
TABLE domain, type, owner
FROM ""
WHERE contains(tags, "status/active")
SORT file.mtime desc
```

## Правила использования

### 1. Выбор домена
- Используйте наиболее специфичный домен
- При необходимости используйте несколько доменов
- Создавайте новые домены только при необходимости

### 2. Комбинирование тегов
```yaml
tags: [domain/business/strategy, type/decision, status/active, priority/high]
```

### 3. Иерархия тегов
- Домены: `domain/<main>/<sub>`
- Типы: `type/<type>`
- Статусы: `status/<status>`
- Приоритеты: `priority/<level>`
- Владельцы: `owner/<role>`

## Расширение словаря

### Добавление нового домена
1. Определите область знаний
2. Создайте концепцию в SKOS
3. Добавьте в этот документ
4. Создайте Dataview индекс
5. Обновите правила именования

### Добавление нового типа
1. Определите назначение типа
2. Создайте соответствующий шаблон
3. Добавьте в классификацию
4. Обновите чек-листы

## Автоматизация

### Скрипт валидации тегов
```javascript
function validateTags(tags) {
    const validDomains = [
        'domain/business', 'domain/technology', 'domain/knowledge',
        'domain/obsidian', 'domain/organization', 'domain/team'
    ];
    
    const validTypes = [
        'type/entity', 'type/concept', 'type/process', 'type/decision',
        'type/tutorial', 'type/how-to', 'type/reference', 'type/explanation',
        'type/project', 'type/sprint', 'type/meeting', 'type/review',
        'type/ontology', 'type/cq', 'type/metric', 'type/pattern'
    ];
    
    const validStatuses = ['status/draft', 'status/active', 'status/deprecated', 'status/archived'];
    const validPriorities = ['priority/critical', 'priority/high', 'priority/medium', 'priority/low'];
    
    const issues = [];
    
    tags.forEach(tag => {
        if (tag.startsWith('domain/') && !validDomains.includes(tag)) {
            issues.push(`Invalid domain: ${tag}`);
        }
        if (tag.startsWith('type/') && !validTypes.includes(tag)) {
            issues.push(`Invalid type: ${tag}`);
        }
        if (tag.startsWith('status/') && !validStatuses.includes(tag)) {
            issues.push(`Invalid status: ${tag}`);
        }
        if (tag.startsWith('priority/') && !validPriorities.includes(tag)) {
            issues.push(`Invalid priority: ${tag}`);
        }
    });
    
    return issues;
}
```

## Связанные документы

- [[Архитектура шаблонов]] - структура шаблонов
- [[Правила именования]] - конвенции именования
- [[Чек-лист качества]] - проверка качества
- [[Мастер-промпт v2.0]] - основной промпт

## История изменений

- {{date}} - Создание словаря доменов
- Добавлены основные домены и типы
- Создана SKOS разметка
- Добавлены Dataview индексы