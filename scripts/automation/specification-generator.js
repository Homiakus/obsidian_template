/**
 * Specification Generator для Obsidian Knowledge Architect v2.0
 * Автоматическая генерация спецификаций и сборочных схем
 */

class SpecificationGenerator {
    constructor() {
        this.templates = {
            bom: 'templates/bom-template.md',
            assembly: 'templates/assembly-template.md',
            process: 'templates/process-spec-template.md',
            quality: 'templates/quality-spec-template.md'
        };
        
        this.exportFormats = ['pdf', 'excel', 'cad', 'html'];
        this.cadFormats = ['step', 'iges', 'dwg', 'dxf'];
    }

    /**
     * Генерирует спецификацию материалов (BOM)
     */
    async generateBOM(projectData) {
        try {
            const bomData = this.prepareBOMData(projectData);
            const bomContent = this.generateBOMContent(bomData);
            
            // Создаем файл спецификации
            const filename = `BOM-${projectData.code}-${new Date().toISOString().split('T')[0]}.md`;
            const file = await app.vault.create(filename, bomContent);
            
            // Генерируем экспорт в различные форматы
            await this.exportBOM(bomData, filename);
            
            return {
                success: true,
                file: file,
                bomData: bomData
            };
            
        } catch (error) {
            console.error('Error generating BOM:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Подготавливает данные для BOM
     */
    prepareBOMData(projectData) {
        const bomData = {
            project: projectData,
            parts: [],
            materials: [],
            components: [],
            totalCost: 0,
            totalWeight: 0
        };
        
        // Извлекаем детали из проекта
        if (projectData.parts) {
            bomData.parts = projectData.parts.map(part => ({
                ...part,
                cost: this.calculatePartCost(part),
                weight: this.calculatePartWeight(part)
            }));
        }
        
        // Извлекаем материалы
        if (projectData.materials) {
            bomData.materials = projectData.materials.map(material => ({
                ...material,
                cost: this.calculateMaterialCost(material),
                weight: this.calculateMaterialWeight(material)
            }));
        }
        
        // Извлекаем компоненты
        if (projectData.components) {
            bomData.components = projectData.components.map(component => ({
                ...component,
                cost: this.calculateComponentCost(component),
                weight: this.calculateComponentWeight(component)
            }));
        }
        
        // Рассчитываем общие показатели
        bomData.totalCost = this.calculateTotalCost(bomData);
        bomData.totalWeight = this.calculateTotalWeight(bomData);
        
        return bomData;
    }

    /**
     * Генерирует контент BOM
     */
    generateBOMContent(bomData) {
        const project = bomData.project;
        
        let content = `---
id: ${new Date().toISOString().replace(/[:.]/g, '-')}-bom-1.0
title: Спецификация материалов - ${project.title}
status: active
tags: [domain/technology, type/specification, status/active]
created: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
owner: <engineer>
version: 1.0.0
schema: bom-v1
project: ${project.code}
---

# Спецификация материалов - ${project.title}

## Общая информация

**Проект**: ${project.title}
**Код проекта**: ${project.code}
**Дата генерации**: ${new Date().toLocaleDateString()}
**Версия**: 1.0

## Сводка

- **Общее количество позиций**: ${bomData.parts.length + bomData.materials.length + bomData.components.length}
- **Общая стоимость**: ${bomData.totalCost.toFixed(2)} руб.
- **Общий вес**: ${bomData.totalWeight.toFixed(2)} кг.

## Детали

${this.generatePartsTable(bomData.parts)}

## Материалы

${this.generateMaterialsTable(bomData.materials)}

## Компоненты

${this.generateComponentsTable(bomData.components)}

## Сводная таблица

${this.generateSummaryTable(bomData)}

## Примечания

- Спецификация сгенерирована автоматически
- Цены указаны на дату генерации
- Веса рассчитаны приблизительно

## История изменений

- ${new Date().toLocaleDateString()} - Создание спецификации
`;

        return content;
    }

    /**
     * Генерирует таблицу деталей
     */
    generatePartsTable(parts) {
        if (parts.length === 0) return '### Детали\nНет данных\n\n';
        
        let table = '### Детали\n\n';
        table += '| Позиция | Наименование | Материал | Размеры | Количество | Вес (кг) | Стоимость (руб.) |\n';
        table += '|---------|--------------|----------|---------|------------|----------|------------------|\n';
        
        parts.forEach(part => {
            table += `| ${part.position} | ${part.name} | ${part.material} | ${part.dimensions} | ${part.quantity} | ${part.weight.toFixed(2)} | ${part.cost.toFixed(2)} |\n`;
        });
        
        return table + '\n';
    }

    /**
     * Генерирует таблицу материалов
     */
    generateMaterialsTable(materials) {
        if (materials.length === 0) return '### Материалы\nНет данных\n\n';
        
        let table = '### Материалы\n\n';
        table += '| Позиция | Наименование | Спецификация | Количество | Единица | Вес (кг) | Стоимость (руб.) |\n';
        table += '|---------|--------------|--------------|------------|---------|----------|------------------|\n';
        
        materials.forEach(material => {
            table += `| ${material.position} | ${material.name} | ${material.specification} | ${material.quantity} | ${material.unit} | ${material.weight.toFixed(2)} | ${material.cost.toFixed(2)} |\n`;
        });
        
        return table + '\n';
    }

    /**
     * Генерирует таблицу компонентов
     */
    generateComponentsTable(components) {
        if (components.length === 0) return '### Компоненты\nНет данных\n\n';
        
        let table = '### Компоненты\n\n';
        table += '| Позиция | Наименование | Производитель | Каталожный номер | Количество | Стоимость (руб.) |\n';
        table += '|---------|--------------|---------------|------------------|------------|------------------|\n';
        
        components.forEach(component => {
            table += `| ${component.position} | ${component.name} | ${component.manufacturer} | ${component.partNumber} | ${component.quantity} | ${component.cost.toFixed(2)} |\n`;
        });
        
        return table + '\n';
    }

    /**
     * Генерирует сводную таблицу
     */
    generateSummaryTable(bomData) {
        let table = '### Сводная таблица\n\n';
        table += '| Категория | Количество позиций | Общий вес (кг) | Общая стоимость (руб.) |\n';
        table += '|-----------|-------------------|----------------|------------------------|\n';
        
        const partsWeight = bomData.parts.reduce((sum, part) => sum + part.weight, 0);
        const partsCost = bomData.parts.reduce((sum, part) => sum + part.cost, 0);
        const materialsWeight = bomData.materials.reduce((sum, material) => sum + material.weight, 0);
        const materialsCost = bomData.materials.reduce((sum, material) => sum + material.cost, 0);
        const componentsWeight = bomData.components.reduce((sum, component) => sum + component.weight, 0);
        const componentsCost = bomData.components.reduce((sum, component) => sum + component.cost, 0);
        
        table += `| Детали | ${bomData.parts.length} | ${partsWeight.toFixed(2)} | ${partsCost.toFixed(2)} |\n`;
        table += `| Материалы | ${bomData.materials.length} | ${materialsWeight.toFixed(2)} | ${materialsCost.toFixed(2)} |\n`;
        table += `| Компоненты | ${bomData.components.length} | ${componentsWeight.toFixed(2)} | ${componentsCost.toFixed(2)} |\n`;
        table += `| **ИТОГО** | **${bomData.parts.length + bomData.materials.length + bomData.components.length}** | **${bomData.totalWeight.toFixed(2)}** | **${bomData.totalCost.toFixed(2)}** |\n`;
        
        return table + '\n';
    }

    /**
     * Генерирует сборочную схему
     */
    async generateAssemblyScheme(projectData) {
        try {
            const assemblyData = this.prepareAssemblyData(projectData);
            const assemblyContent = this.generateAssemblyContent(assemblyData);
            
            // Создаем файл сборочной схемы
            const filename = `Assembly-${projectData.code}-${new Date().toISOString().split('T')[0]}.md`;
            const file = await app.vault.create(filename, assemblyContent);
            
            // Генерируем 3D визуализацию
            await this.generate3DVisualization(assemblyData);
            
            return {
                success: true,
                file: file,
                assemblyData: assemblyData
            };
            
        } catch (error) {
            console.error('Error generating assembly scheme:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Подготавливает данные для сборочной схемы
     */
    prepareAssemblyData(projectData) {
        const assemblyData = {
            project: projectData,
            stages: [],
            tools: [],
            instructions: []
        };
        
        // Определяем этапы сборки
        if (projectData.assemblyStages) {
            assemblyData.stages = projectData.assemblyStages.map((stage, index) => ({
                ...stage,
                stageNumber: index + 1,
                estimatedTime: this.calculateStageTime(stage),
                requiredTools: this.identifyRequiredTools(stage)
            }));
        }
        
        // Определяем необходимые инструменты
        assemblyData.tools = this.collectAllTools(assemblyData.stages);
        
        // Генерируем инструкции
        assemblyData.instructions = this.generateInstructions(assemblyData.stages);
        
        return assemblyData;
    }

    /**
     * Генерирует контент сборочной схемы
     */
    generateAssemblyContent(assemblyData) {
        const project = assemblyData.project;
        
        let content = `---
id: ${new Date().toISOString().replace(/[:.]/g, '-')}-assembly-1.0
title: Сборочная схема - ${project.title}
status: active
tags: [domain/technology, type/assembly, status/active]
created: ${new Date().toISOString().split('T')[0]}
updated: ${new Date().toISOString().split('T')[0]}
owner: <engineer>
version: 1.0.0
schema: assembly-v1
project: ${project.code}
---

# Сборочная схема - ${project.title}

## Общая информация

**Проект**: ${project.title}
**Код проекта**: ${project.code}
**Дата генерации**: ${new Date().toLocaleDateString()}
**Версия**: 1.0

## Сводка

- **Количество этапов сборки**: ${assemblyData.stages.length}
- **Общее время сборки**: ${this.calculateTotalAssemblyTime(assemblyData.stages)} мин.
- **Необходимые инструменты**: ${assemblyData.tools.length}

## Этапы сборки

${this.generateAssemblyStages(assemblyData.stages)}

## Необходимые инструменты

${this.generateToolsList(assemblyData.tools)}

## Инструкции по сборке

${this.generateAssemblyInstructions(assemblyData.instructions)}

## 3D визуализация

[[3D Assembly Model]] - 3D модель сборки
[[Assembly Animation]] - анимация процесса сборки

## Примечания

- Схема сгенерирована автоматически
- Время указано приблизительно
- Соблюдайте технику безопасности

## История изменений

- ${new Date().toLocaleDateString()} - Создание сборочной схемы
`;

        return content;
    }

    /**
     * Генерирует этапы сборки
     */
    generateAssemblyStages(stages) {
        if (stages.length === 0) return 'Нет данных\n\n';
        
        let content = '';
        
        stages.forEach(stage => {
            content += `### Этап ${stage.stageNumber}: ${stage.name}\n\n`;
            content += `**Описание**: ${stage.description}\n\n`;
            content += `**Время**: ${stage.estimatedTime} мин.\n\n`;
            content += `**Необходимые детали**:\n`;
            
            if (stage.parts) {
                stage.parts.forEach(part => {
                    content += `- ${part.name} (${part.quantity} шт.)\n`;
                });
            }
            
            content += `\n**Инструменты**:\n`;
            if (stage.requiredTools) {
                stage.requiredTools.forEach(tool => {
                    content += `- ${tool.name}\n`;
                });
            }
            
            content += `\n**Инструкции**:\n`;
            if (stage.instructions) {
                stage.instructions.forEach((instruction, index) => {
                    content += `${index + 1}. ${instruction}\n`;
                });
            }
            
            content += `\n**Контрольные точки**:\n`;
            if (stage.checkpoints) {
                stage.checkpoints.forEach(checkpoint => {
                    content += `- [ ] ${checkpoint}\n`;
                });
            }
            
            content += '\n---\n\n';
        });
        
        return content;
    }

    /**
     * Генерирует список инструментов
     */
    generateToolsList(tools) {
        if (tools.length === 0) return 'Нет данных\n\n';
        
        let table = '| Инструмент | Назначение | Количество |\n';
        table += '|------------|------------|------------|\n';
        
        tools.forEach(tool => {
            table += `| ${tool.name} | ${tool.purpose} | ${tool.quantity} |\n`;
        });
        
        return table + '\n';
    }

    /**
     * Генерирует инструкции по сборке
     */
    generateAssemblyInstructions(instructions) {
        if (instructions.length === 0) return 'Нет данных\n\n';
        
        let content = '';
        
        instructions.forEach((instruction, index) => {
            content += `${index + 1}. **${instruction.title}**\n`;
            content += `   ${instruction.description}\n\n`;
            
            if (instruction.steps) {
                instruction.steps.forEach((step, stepIndex) => {
                    content += `   ${index + 1}.${stepIndex + 1}. ${step}\n`;
                });
            }
            
            content += '\n';
        });
        
        return content;
    }

    /**
     * Экспортирует BOM в различные форматы
     */
    async exportBOM(bomData, filename) {
        try {
            // Экспорт в Excel
            await this.exportToExcel(bomData, filename);
            
            // Экспорт в PDF
            await this.exportToPDF(bomData, filename);
            
            // Экспорт в CAD
            await this.exportToCAD(bomData, filename);
            
            return { success: true };
            
        } catch (error) {
            console.error('Error exporting BOM:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Экспорт в Excel
     */
    async exportToExcel(bomData, filename) {
        // Здесь будет логика экспорта в Excel
        console.log('Exporting to Excel:', filename);
    }

    /**
     * Экспорт в PDF
     */
    async exportToPDF(bomData, filename) {
        // Здесь будет логика экспорта в PDF
        console.log('Exporting to PDF:', filename);
    }

    /**
     * Экспорт в CAD
     */
    async exportToCAD(bomData, filename) {
        // Здесь будет логика экспорта в CAD
        console.log('Exporting to CAD:', filename);
    }

    /**
     * Генерирует 3D визуализацию
     */
    async generate3DVisualization(assemblyData) {
        // Здесь будет логика генерации 3D визуализации
        console.log('Generating 3D visualization');
    }

    // Вспомогательные методы для расчетов
    calculatePartCost(part) {
        // Логика расчета стоимости детали
        return part.cost || 0;
    }

    calculatePartWeight(part) {
        // Логика расчета веса детали
        return part.weight || 0;
    }

    calculateMaterialCost(material) {
        // Логика расчета стоимости материала
        return material.cost || 0;
    }

    calculateMaterialWeight(material) {
        // Логика расчета веса материала
        return material.weight || 0;
    }

    calculateComponentCost(component) {
        // Логика расчета стоимости компонента
        return component.cost || 0;
    }

    calculateComponentWeight(component) {
        // Логика расчета веса компонента
        return component.weight || 0;
    }

    calculateTotalCost(bomData) {
        const partsCost = bomData.parts.reduce((sum, part) => sum + part.cost, 0);
        const materialsCost = bomData.materials.reduce((sum, material) => sum + material.cost, 0);
        const componentsCost = bomData.components.reduce((sum, component) => sum + component.cost, 0);
        
        return partsCost + materialsCost + componentsCost;
    }

    calculateTotalWeight(bomData) {
        const partsWeight = bomData.parts.reduce((sum, part) => sum + part.weight, 0);
        const materialsWeight = bomData.materials.reduce((sum, material) => sum + material.weight, 0);
        const componentsWeight = bomData.components.reduce((sum, component) => sum + component.weight, 0);
        
        return partsWeight + materialsWeight + componentsWeight;
    }

    calculateStageTime(stage) {
        // Логика расчета времени этапа
        return stage.estimatedTime || 30;
    }

    identifyRequiredTools(stage) {
        // Логика определения необходимых инструментов
        return stage.tools || [];
    }

    collectAllTools(stages) {
        const allTools = new Map();
        
        stages.forEach(stage => {
            if (stage.requiredTools) {
                stage.requiredTools.forEach(tool => {
                    if (allTools.has(tool.name)) {
                        allTools.get(tool.name).quantity += tool.quantity || 1;
                    } else {
                        allTools.set(tool.name, { ...tool, quantity: tool.quantity || 1 });
                    }
                });
            }
        });
        
        return Array.from(allTools.values());
    }

    generateInstructions(stages) {
        // Логика генерации инструкций
        return stages.map(stage => ({
            title: stage.name,
            description: stage.description,
            steps: stage.instructions || []
        }));
    }

    calculateTotalAssemblyTime(stages) {
        return stages.reduce((sum, stage) => sum + stage.estimatedTime, 0);
    }
}

// Экспорт для использования
module.exports = SpecificationGenerator;