/**
 * Quality Checker для Obsidian Knowledge Architect v2.0
 * Автоматическая проверка качества заметок через Dataview
 */

class QualityChecker {
    constructor() {
        this.requiredFields = ['id', 'title', 'status', 'tags', 'owner', 'version'];
        this.requiredTags = ['domain', 'type', 'status'];
        this.validDomains = [
            'business', 'technology', 'knowledge', 'obsidian', 
            'organization', 'team', 'management', 'development'
        ];
        this.validTypes = [
            'entity', 'concept', 'process', 'decision',
            'tutorial', 'how-to', 'reference', 'explanation',
            'project', 'sprint', 'meeting', 'review',
            'ontology', 'cq', 'metric', 'pattern'
        ];
        this.validStatuses = ['draft', 'active', 'deprecated', 'archived'];
        this.validPriorities = ['critical', 'high', 'medium', 'low'];
    }

    /**
     * Генерирует Dataview запросы для проверки качества
     */
    generateQualityQueries() {
        return {
            // Проверка обязательных полей
            missingFields: this.generateMissingFieldsQuery(),
            
            // Проверка тегов
            invalidTags: this.generateInvalidTagsQuery(),
            missingTags: this.generateMissingTagsQuery(),
            
            // Проверка связности
            orphanNotes: this.generateOrphanNotesQuery(),
            lowConnectivity: this.generateLowConnectivityQuery(),
            
            // Проверка актуальности
            outdatedNotes: this.generateOutdatedNotesQuery(),
            staleNotes: this.generateStaleNotesQuery(),
            
            // Проверка структуры
            invalidStructure: this.generateInvalidStructureQuery(),
            missingSections: this.generateMissingSectionsQuery(),
            
            // Общая статистика
            statistics: this.generateStatisticsQuery()
        };
    }

    /**
     * Запрос для заметок с отсутствующими обязательными полями
     */
    generateMissingFieldsQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.mtime AS "Modified"
FROM ""
WHERE (
    !file.frontmatter.id OR 
    !file.frontmatter.title OR 
    !file.frontmatter.status OR 
    !file.frontmatter.tags OR 
    !file.frontmatter.owner OR 
    !file.frontmatter.version
) AND !contains(file.path, "/docspro/") AND !contains(file.path, "/templates/")
SORT file.mtime desc
\`\`\``;
    }

    /**
     * Запрос для заметок с невалидными тегами
     */
    generateInvalidTagsQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.frontmatter.tags AS "Tags"
FROM ""
WHERE (
    contains(file.frontmatter.tags, "domain/") AND 
    !contains(file.frontmatter.tags, "domain/business") AND
    !contains(file.frontmatter.tags, "domain/technology") AND
    !contains(file.frontmatter.tags, "domain/knowledge") AND
    !contains(file.frontmatter.tags, "domain/obsidian") AND
    !contains(file.frontmatter.tags, "domain/organization") AND
    !contains(file.frontmatter.tags, "domain/team") AND
    !contains(file.frontmatter.tags, "domain/management") AND
    !contains(file.frontmatter.tags, "domain/development")
) AND !contains(file.path, "/docspro/") AND !contains(file.path, "/templates/")
SORT file.name
\`\`\``;
    }

    /**
     * Запрос для заметок с отсутствующими обязательными тегами
     */
    generateMissingTagsQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.frontmatter.tags AS "Tags"
FROM ""
WHERE (
    !contains(file.frontmatter.tags, "domain/") OR
    !contains(file.frontmatter.tags, "type/") OR
    !contains(file.frontmatter.tags, "status/")
) AND !contains(file.path, "/docspro/") AND !contains(file.path, "/templates/")
SORT file.name
\`\`\``;
    }

    /**
     * Запрос для "сиротских" заметок (без входящих ссылок)
     */
    generateOrphanNotesQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.mtime AS "Modified"
FROM ""
WHERE length(file.inlinks) = 0 AND 
    !contains(file.path, "/docspro/") AND 
    !contains(file.path, "/templates/") AND
    !contains(file.path, "/scripts/")
SORT file.mtime desc
\`\`\``;
    }

    /**
     * Запрос для заметок с низкой связностью
     */
    generateLowConnectivityQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", length(file.inlinks) AS "Inlinks", length(file.outlinks) AS "Outlinks"
FROM ""
WHERE (length(file.inlinks) + length(file.outlinks)) < 3 AND
    !contains(file.path, "/docspro/") AND 
    !contains(file.path, "/templates/")
SORT (length(file.inlinks) + length(file.outlinks)) asc
\`\`\``;
    }

    /**
     * Запрос для устаревших заметок (не обновлялись более 90 дней)
     */
    generateOutdatedNotesQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.mtime AS "Modified", date(today) - file.mtime AS "Days Old"
FROM ""
WHERE date(today) - file.mtime > 90 AND
    !contains(file.path, "/docspro/") AND 
    !contains(file.path, "/templates/")
SORT file.mtime asc
\`\`\``;
    }

    /**
     * Запрос для "залежавшихся" заметок (статус draft более 30 дней)
     */
    generateStaleNotesQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.mtime AS "Modified", date(today) - file.mtime AS "Days Old"
FROM ""
WHERE contains(file.frontmatter.tags, "status/draft") AND
    date(today) - file.mtime > 30 AND
    !contains(file.path, "/docspro/") AND 
    !contains(file.path, "/templates/")
SORT file.mtime asc
\`\`\``;
    }

    /**
     * Запрос для заметок с невалидной структурой
     */
    generateInvalidStructureQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File", file.frontmatter.schema AS "Schema"
FROM ""
WHERE !file.frontmatter.schema AND
    !contains(file.path, "/docspro/") AND 
    !contains(file.path, "/templates/")
SORT file.name
\`\`\``;
    }

    /**
     * Запрос для заметок с отсутствующими секциями
     */
    generateMissingSectionsQuery() {
        return `\`\`\`dataview
TABLE file.name AS "File"
FROM ""
WHERE (
    !contains(file.content, "## Примечания") OR
    !contains(file.content, "## История изменений")
) AND !contains(file.path, "/docspro/") AND !contains(file.path, "/templates/")
SORT file.name
\`\`\``;
    }

    /**
     * Запрос для общей статистики
     */
    generateStatisticsQuery() {
        return `\`\`\`dataview
TABLE 
    length(rows) AS "Total Notes",
    length(filter(rows.file.frontmatter.tags, (t) => contains(t, "status/active"))) AS "Active",
    length(filter(rows.file.frontmatter.tags, (t) => contains(t, "status/draft"))) AS "Draft",
    length(filter(rows.file.frontmatter.tags, (t) => contains(t, "status/deprecated"))) AS "Deprecated"
FROM ""
WHERE !contains(file.path, "/docspro/") AND !contains(file.path, "/templates/")
\`\`\``;
    }

    /**
     * Генерирует полный отчет о качестве
     */
    generateQualityReport() {
        const queries = this.generateQualityQueries();
        
        return `# Отчет о качестве базы знаний

## Общая статистика
${queries.statistics}

## Проблемы качества

### 1. Отсутствующие обязательные поля
${queries.missingFields}

### 2. Невалидные теги
${queries.invalidTags}

### 3. Отсутствующие обязательные теги
${queries.missingTags}

### 4. "Сиротские" заметки (без входящих ссылок)
${queries.orphanNotes}

### 5. Низкая связность
${queries.lowConnectivity}

### 6. Устаревшие заметки (>90 дней)
${queries.outdatedNotes}

### 7. "Залежавшиеся" черновики (>30 дней)
${queries.staleNotes}

### 8. Невалидная структура
${queries.invalidStructure}

### 9. Отсутствующие секции
${queries.missingSections}

## Рекомендации

### Приоритет 1 (Критично)
- Исправить отсутствующие обязательные поля
- Добавить обязательные теги
- Исправить невалидные теги

### Приоритет 2 (Высоко)
- Устранить "сиротские" заметки
- Улучшить связность
- Обновить устаревшие заметки

### Приоритет 3 (Средне)
- Завершить черновики
- Добавить отсутствующие секции
- Исправить структуру

## Метрики качества

- **Полнота**: Доля заметок с полным frontmatter
- **Валидность**: Доля заметок с корректными тегами
- **Связность**: Среднее количество связей на заметку
- **Актуальность**: Доля свежих заметок (<90 дней)
- **Завершенность**: Доля активных заметок

---
*Отчет сгенерирован автоматически ${new Date().toLocaleDateString()}*
`;
    }

    /**
     * Проверяет качество конкретной заметки
     */
    checkNoteQuality(note) {
        const issues = [];
        
        // Проверка frontmatter
        if (!note.frontmatter) {
            issues.push('Missing frontmatter');
            return issues;
        }
        
        // Проверка обязательных полей
        this.requiredFields.forEach(field => {
            if (!note.frontmatter[field]) {
                issues.push(`Missing required field: ${field}`);
            }
        });
        
        // Проверка тегов
        if (note.frontmatter.tags) {
            const tags = note.frontmatter.tags;
            
            // Проверка обязательных тегов
            this.requiredTags.forEach(requiredTag => {
                const hasTag = tags.some(tag => tag.startsWith(`${requiredTag}/`));
                if (!hasTag) {
                    issues.push(`Missing required tag: ${requiredTag}`);
                }
            });
            
            // Проверка валидности тегов
            tags.forEach(tag => {
                if (tag.startsWith('domain/')) {
                    const domain = tag.replace('domain/', '');
                    if (!this.validDomains.includes(domain)) {
                        issues.push(`Invalid domain: ${domain}`);
                    }
                }
                
                if (tag.startsWith('type/')) {
                    const type = tag.replace('type/', '');
                    if (!this.validTypes.includes(type)) {
                        issues.push(`Invalid type: ${type}`);
                    }
                }
                
                if (tag.startsWith('status/')) {
                    const status = tag.replace('status/', '');
                    if (!this.validStatuses.includes(status)) {
                        issues.push(`Invalid status: ${status}`);
                    }
                }
            });
        }
        
        // Проверка структуры контента
        if (note.content) {
            if (!note.content.includes('## Примечания')) {
                issues.push('Missing "Примечания" section');
            }
            
            if (!note.content.includes('## История изменений')) {
                issues.push('Missing "История изменений" section');
            }
        }
        
        return issues;
    }

    /**
     * Генерирует рекомендации по улучшению
     */
    generateRecommendations(issues) {
        const recommendations = [];
        
        if (issues.includes('Missing required field: id')) {
            recommendations.push('Добавить уникальный идентификатор в формате YYYYMMDD-HHMMSS-<TYPE>-<VERSION>');
        }
        
        if (issues.includes('Missing required field: title')) {
            recommendations.push('Добавить описательный заголовок заметки');
        }
        
        if (issues.includes('Missing required tag: domain')) {
            recommendations.push('Добавить тег домена (domain/<domain>)');
        }
        
        if (issues.includes('Missing required tag: type')) {
            recommendations.push('Добавить тег типа (type/<type>)');
        }
        
        if (issues.includes('Missing required tag: status')) {
            recommendations.push('Добавить тег статуса (status/<status>)');
        }
        
        if (issues.includes('Missing "Примечания" section')) {
            recommendations.push('Добавить секцию "## Примечания"');
        }
        
        if (issues.includes('Missing "История изменений" section')) {
            recommendations.push('Добавить секцию "## История изменений"');
        }
        
        return recommendations;
    }
}

// Экспорт для использования
module.exports = QualityChecker;