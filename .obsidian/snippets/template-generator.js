/**
 * Template Generator для Obsidian Knowledge Architect v2.0
 * Автоматическая генерация заметок из шаблонов
 */

class TemplateGenerator {
    constructor() {
        this.templates = {
            entity: 'templates/entity.md',
            concept: 'templates/concept.md',
            cq: 'templates/cq.md',
            tutorial: 'templates/tutorial.md',
            howTo: 'templates/how-to.md',
            reference: 'templates/reference.md',
            explanation: 'templates/explanation.md',
            project: 'templates/project.md',
            sprint: 'templates/sprint.md',
            process: 'templates/process.md',
            decision: 'templates/decision.md',
            meeting: 'templates/meeting.md',
            review: 'templates/review.md',
            ontology: 'templates/ontology.md',
            metric: 'templates/metric.md',
            pattern: 'templates/pattern.md'
        };
        
        this.domains = [
            'business', 'technology', 'knowledge', 'obsidian', 
            'organization', 'team', 'management', 'development'
        ];
        
        this.types = [
            'entity', 'concept', 'process', 'decision',
            'tutorial', 'how-to', 'reference', 'explanation',
            'project', 'sprint', 'meeting', 'review',
            'ontology', 'cq', 'metric', 'pattern'
        ];
        
        this.statuses = ['draft', 'active', 'deprecated', 'archived'];
        this.priorities = ['critical', 'high', 'medium', 'low'];
        this.owners = [
            'architect', 'ontologist', 'analyst', 'developer',
            'manager', 'curator', 'docs-lead'
        ];
    }

    /**
     * Генерирует UID для заметки
     */
    generateUID(type, version = '1.0') {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') + '-' +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
        
        return `${timestamp}-${type}-${version}`;
    }

    /**
     * Валидирует frontmatter
     */
    validateFrontmatter(frontmatter) {
        const issues = [];
        
        if (!frontmatter.id) issues.push('Missing ID');
        if (!frontmatter.title) issues.push('Missing title');
        if (!frontmatter.status) issues.push('Missing status');
        if (!frontmatter.tags || frontmatter.tags.length === 0) issues.push('Missing tags');
        if (!frontmatter.owner) issues.push('Missing owner');
        if (!frontmatter.version) issues.push('Missing version');
        
        // Проверка тегов
        if (frontmatter.tags) {
            const hasDomain = frontmatter.tags.some(tag => tag.startsWith('domain/'));
            const hasType = frontmatter.tags.some(tag => tag.startsWith('type/'));
            const hasStatus = frontmatter.tags.some(tag => tag.startsWith('status/'));
            
            if (!hasDomain) issues.push('Missing domain tag');
            if (!hasType) issues.push('Missing type tag');
            if (!hasStatus) issues.push('Missing status tag');
        }
        
        return issues;
    }

    /**
     * Создает новую заметку из шаблона
     */
    async createNote(templateType, options = {}) {
        try {
            // Получаем шаблон
            const templatePath = this.templates[templateType];
            if (!templatePath) {
                throw new Error(`Unknown template type: ${templateType}`);
            }
            
            const template = await this.getTemplate(templatePath);
            if (!template) {
                throw new Error(`Template not found: ${templatePath}`);
            }
            
            // Подготавливаем данные
            const data = this.prepareData(templateType, options);
            
            // Генерируем контент
            const content = this.generateContent(template, data);
            
            // Валидируем
            const issues = this.validateFrontmatter(data.frontmatter);
            if (issues.length > 0) {
                console.warn('Frontmatter validation issues:', issues);
            }
            
            return {
                content: content,
                frontmatter: data.frontmatter,
                filename: data.filename,
                issues: issues
            };
            
        } catch (error) {
            console.error('Error creating note:', error);
            throw error;
        }
    }

    /**
     * Получает шаблон из файла
     */
    async getTemplate(templatePath) {
        try {
            const templateFile = app.vault.getAbstractFileByPath(templatePath);
            if (templateFile && templateFile instanceof TFile) {
                return await app.vault.read(templateFile);
            }
            return null;
        } catch (error) {
            console.error('Error reading template:', error);
            return null;
        }
    }

    /**
     * Подготавливает данные для генерации
     */
    prepareData(templateType, options) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        
        // Генерируем UID
        const uid = this.generateUID(templateType, options.version || '1.0');
        
        // Подготавливаем frontmatter
        const frontmatter = {
            id: uid,
            title: options.title || `<${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Title>`,
            status: options.status || 'draft',
            aliases: options.aliases || [],
            tags: this.generateTags(templateType, options),
            created: dateStr,
            updated: dateStr,
            owner: options.owner || 'architect',
            version: options.version || '1.0.0',
            schema: `${templateType}-v1`
        };
        
        // Добавляем специфичные поля
        if (options.code) frontmatter.code = options.code;
        if (options.priority) frontmatter.priority = options.priority;
        if (options.sprint_number) frontmatter.sprint_number = options.sprint_number;
        if (options.project) frontmatter.project = options.project;
        if (options.meeting_type) frontmatter.meeting_type = options.meeting_type;
        if (options.review_type) frontmatter.review_type = options.review_type;
        if (options.element_type) frontmatter.element_type = options.element_type;
        if (options.metric_type) frontmatter.metric_type = options.metric_type;
        if (options.pattern_type) frontmatter.pattern_type = options.pattern_type;
        if (options.process_type) frontmatter.process_type = options.process_type;
        if (options.decision_type) frontmatter.decision_type = options.decision_type;
        
        // Генерируем имя файла
        const filename = this.generateFilename(templateType, options);
        
        return {
            frontmatter: frontmatter,
            filename: filename,
            dateStr: dateStr,
            timeStr: timeStr
        };
    }

    /**
     * Генерирует теги для заметки
     */
    generateTags(templateType, options) {
        const tags = [];
        
        // Добавляем домен
        if (options.domain) {
            tags.push(`domain/${options.domain}`);
        } else {
            tags.push('domain/knowledge'); // По умолчанию
        }
        
        // Добавляем тип
        tags.push(`type/${templateType}`);
        
        // Добавляем статус
        tags.push(`status/${options.status || 'draft'}`);
        
        // Добавляем приоритет если есть
        if (options.priority) {
            tags.push(`priority/${options.priority}`);
        }
        
        // Добавляем владельца
        if (options.owner) {
            tags.push(`owner/${options.owner}`);
        }
        
        return tags;
    }

    /**
     * Генерирует имя файла
     */
    generateFilename(templateType, options) {
        const type = templateType.charAt(0).toUpperCase() + templateType.slice(1);
        const domain = options.domain || 'knowledge';
        const name = options.title || 'Untitled';
        const version = options.version || '1.0';
        
        // Очищаем имя от специальных символов
        const cleanName = name.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        
        return `${type}-${domain.charAt(0).toUpperCase() + domain.slice(1)}-${cleanName}-v${version}.md`;
    }

    /**
     * Генерирует контент заметки
     */
    generateContent(template, data) {
        let content = template;
        
        // Заменяем плейсхолдеры в frontmatter
        const frontmatterStr = this.generateFrontmatterString(data.frontmatter);
        content = content.replace(/^---\n[\s\S]*?\n---\n/, `---\n${frontmatterStr}---\n`);
        
        // Заменяем остальные плейсхолдеры
        content = content.replace(/{{date}}/g, data.dateStr);
        content = content.replace(/{{time:HHmmss}}/g, data.timeStr.replace(/:/g, ''));
        content = content.replace(/{{date:YYYYMMDD}}/g, data.dateStr.replace(/-/g, ''));
        content = content.replace(/{{time:HHmmss}}/g, data.timeStr.replace(/:/g, ''));
        
        // Заменяем плейсхолдеры в заголовке
        content = content.replace(/<Entity Title>/g, data.frontmatter.title);
        content = content.replace(/<Concept Name>/g, data.frontmatter.title);
        content = content.replace(/<Tutorial Title>/g, data.frontmatter.title);
        content = content.replace(/<How-to Title>/g, data.frontmatter.title);
        content = content.replace(/<Reference Title>/g, data.frontmatter.title);
        content = content.replace(/<Explanation Title>/g, data.frontmatter.title);
        content = content.replace(/<Project Title>/g, data.frontmatter.title);
        content = content.replace(/<Sprint Title>/g, data.frontmatter.title);
        content = content.replace(/<Process Title>/g, data.frontmatter.title);
        content = content.replace(/<Decision Title>/g, data.frontmatter.title);
        content = content.replace(/<Meeting Title>/g, data.frontmatter.title);
        content = content.replace(/<Review Title>/g, data.frontmatter.title);
        content = content.replace(/<Ontology Element Title>/g, data.frontmatter.title);
        content = content.replace(/<Metric Title>/g, data.frontmatter.title);
        content = content.replace(/<Pattern Title>/g, data.frontmatter.title);
        content = content.replace(/<Competency Question Title>/g, data.frontmatter.title);
        
        return content;
    }

    /**
     * Генерирует строку frontmatter
     */
    generateFrontmatterString(frontmatter) {
        let result = '';
        
        for (const [key, value] of Object.entries(frontmatter)) {
            if (Array.isArray(value)) {
                result += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
            } else if (typeof value === 'string') {
                result += `${key}: "${value}"\n`;
            } else {
                result += `${key}: ${value}\n`;
            }
        }
        
        return result;
    }

    /**
     * Создает заметку в vault
     */
    async createNoteInVault(templateType, options = {}) {
        try {
            const noteData = await this.createNote(templateType, options);
            
            // Создаем файл в vault
            const file = await app.vault.create(noteData.filename, noteData.content);
            
            // Открываем файл
            app.workspace.openLinkText(file.path, '', true);
            
            return {
                success: true,
                file: file,
                issues: noteData.issues
            };
            
        } catch (error) {
            console.error('Error creating note in vault:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Показывает диалог для создания заметки
     */
    async showCreateNoteDialog() {
        const templateType = await this.showTemplateTypeDialog();
        if (!templateType) return;
        
        const options = await this.showOptionsDialog(templateType);
        if (!options) return;
        
        const result = await this.createNoteInVault(templateType, options);
        
        if (result.success) {
            new Notice(`Note created: ${result.file.name}`);
        } else {
            new Notice(`Error creating note: ${result.error}`);
        }
    }

    /**
     * Диалог выбора типа шаблона
     */
    async showTemplateTypeDialog() {
        const templateTypes = Object.keys(this.templates).map(key => ({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            value: key
        }));
        
        return await this.showSelectionDialog('Select template type:', templateTypes);
    }

    /**
     * Диалог настроек
     */
    async showOptionsDialog(templateType) {
        const options = {};
        
        // Название
        options.title = await this.showInputDialog('Note title:');
        if (!options.title) return null;
        
        // Домен
        const domainOptions = this.domains.map(d => ({ title: d, value: d }));
        options.domain = await this.showSelectionDialog('Select domain:', domainOptions);
        
        // Статус
        const statusOptions = this.statuses.map(s => ({ title: s, value: s }));
        options.status = await this.showSelectionDialog('Select status:', statusOptions);
        
        // Владелец
        const ownerOptions = this.owners.map(o => ({ title: o, value: o }));
        options.owner = await this.showSelectionDialog('Select owner:', ownerOptions);
        
        // Приоритет
        const priorityOptions = this.priorities.map(p => ({ title: p, value: p }));
        options.priority = await this.showSelectionDialog('Select priority:', priorityOptions);
        
        // Специфичные поля
        if (templateType === 'project') {
            options.code = await this.showInputDialog('Project code:');
        }
        
        if (templateType === 'sprint') {
            options.sprint_number = await this.showInputDialog('Sprint number:');
            options.project = await this.showInputDialog('Project code:');
        }
        
        return options;
    }

    /**
     * Показывает диалог выбора
     */
    async showSelectionDialog(message, options) {
        return new Promise((resolve) => {
            const modal = new SuggestModal(app);
            modal.setPlaceholder(message);
            modal.setSuggestions(options);
            modal.onChooseSuggestion = (item) => resolve(item.value);
            modal.open();
        });
    }

    /**
     * Показывает диалог ввода
     */
    async showInputDialog(message) {
        return new Promise((resolve) => {
            const modal = new TextAreaComponent(app);
            modal.setPlaceholder(message);
            modal.onChange((value) => resolve(value));
            modal.open();
        });
    }
}

// Экспорт для использования в Templater
module.exports = TemplateGenerator;