import { App, TFile, TFolder } from "obsidian";

export interface EntitySuggestion {
  value: string;
  label: string;
  count: number;
  type: 'entity' | 'area' | 'status' | 'access' | 'format' | 'anchor';
}

export class EntityFinder {
  private app: App;
  private cache = new Map<string, EntitySuggestion[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут
  private lastCacheUpdate = 0;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Получает все доступные сущности
   */
  async getEntitySuggestions(): Promise<EntitySuggestion[]> {
    await this.updateCacheIfNeeded();
    return this.cache.get('entities') || [];
  }

  /**
   * Получает все доступные области
   */
  async getAreaSuggestions(): Promise<EntitySuggestion[]> {
    await this.updateCacheIfNeeded();
    return this.cache.get('areas') || [];
  }

  /**
   * Получает все доступные статусы
   */
  async getStatusSuggestions(): Promise<EntitySuggestion[]> {
    await this.updateCacheIfNeeded();
    return this.cache.get('statuses') || [];
  }

  /**
   * Получает все доступные уровни доступа
   */
  async getAccessSuggestions(): Promise<EntitySuggestion[]> {
    await this.updateCacheIfNeeded();
    return this.cache.get('accesses') || [];
  }

  /**
   * Получает все доступные форматы
   */
  async getFormatSuggestions(): Promise<EntitySuggestion[]> {
    await this.updateCacheIfNeeded();
    return this.cache.get('formats') || [];
  }

  /**
   * Получает все доступные якоря
   */
  async getAnchorSuggestions(): Promise<EntitySuggestion[]> {
    await this.updateCacheIfNeeded();
    return this.cache.get('anchors') || [];
  }

  /**
   * Ищет сущности по запросу
   */
  async searchEntities(query: string): Promise<EntitySuggestion[]> {
    const entities = await this.getEntitySuggestions();
    if (!query) return entities;
    
    const lowerQuery = query.toLowerCase();
    return entities.filter(entity => 
      entity.value.toLowerCase().includes(lowerQuery) ||
      entity.label.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Ищет области по запросу
   */
  async searchAreas(query: string): Promise<EntitySuggestion[]> {
    const areas = await this.getAreaSuggestions();
    if (!query) return areas;
    
    const lowerQuery = query.toLowerCase();
    return areas.filter(area => 
      area.value.toLowerCase().includes(lowerQuery) ||
      area.label.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Ищет якоря по запросу
   */
  async searchAnchors(query: string): Promise<EntitySuggestion[]> {
    const anchors = await this.getAnchorSuggestions();
    if (!query) return anchors;
    
    const lowerQuery = query.toLowerCase();
    return anchors.filter(anchor => 
      anchor.value.toLowerCase().includes(lowerQuery) ||
      anchor.label.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Обновляет кэш если нужно
   */
  private async updateCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate < this.cacheTimeout) {
      return;
    }

    await this.updateCache();
    this.lastCacheUpdate = now;
  }

  /**
   * Обновляет кэш с данными из хранилища
   */
  private async updateCache(): Promise<void> {
    const entities = new Map<string, number>();
    const areas = new Map<string, number>();
    const statuses = new Map<string, number>();
    const accesses = new Map<string, number>();
    const formats = new Map<string, number>();
    const anchors = new Map<string, number>();

    // Сканируем все файлы
    const files = this.app.vault.getMarkdownFiles();
    
    for (const file of files) {
      try {
        const content = await this.app.vault.read(file);
        const frontmatter = this.extractFrontmatter(content);
        
        if (frontmatter) {
          // Подсчитываем сущности
          if (frontmatter.entity) {
            const count = entities.get(frontmatter.entity) || 0;
            entities.set(frontmatter.entity, count + 1);
          }

          // Подсчитываем области
          if (frontmatter.areas && Array.isArray(frontmatter.areas)) {
            for (const area of frontmatter.areas) {
              const count = areas.get(area) || 0;
              areas.set(area, count + 1);
            }
          }

          // Подсчитываем статусы
          if (frontmatter.status) {
            const count = statuses.get(frontmatter.status) || 0;
            statuses.set(frontmatter.status, count + 1);
          }

          // Подсчитываем уровни доступа
          if (frontmatter.access) {
            const count = accesses.get(frontmatter.access) || 0;
            accesses.set(frontmatter.access, count + 1);
          }

          // Подсчитываем форматы
          if (frontmatter.format) {
            const count = formats.get(frontmatter.format) || 0;
            formats.set(frontmatter.format, count + 1);
          }

          // Подсчитываем якоря
          if (frontmatter.anchor) {
            const count = anchors.get(frontmatter.anchor) || 0;
            anchors.set(frontmatter.anchor, count + 1);
          }
        }
      } catch (error) {
        console.warn(`Ошибка чтения файла ${file.path}:`, error);
      }
    }

    // Добавляем стандартные значения
    this.addStandardValues(entities, areas, statuses, accesses, formats, anchors);

    // Обновляем кэш
    this.cache.set('entities', this.mapToSuggestions(entities, 'entity'));
    this.cache.set('areas', this.mapToSuggestions(areas, 'area'));
    this.cache.set('statuses', this.mapToSuggestions(statuses, 'status'));
    this.cache.set('accesses', this.mapToSuggestions(accesses, 'access'));
    this.cache.set('formats', this.mapToSuggestions(formats, 'format'));
    this.cache.set('anchors', this.mapToSuggestions(anchors, 'anchor'));
  }

  /**
   * Добавляет стандартные значения
   */
  private addStandardValues(
    entities: Map<string, number>,
    areas: Map<string, number>,
    statuses: Map<string, number>,
    accesses: Map<string, number>,
    formats: Map<string, number>,
    anchors: Map<string, number>
  ): void {
    // Стандартные сущности
    const standardEntities = ['NOTE', 'DEC', 'ADR', 'PROJ', 'TASK', 'MEETING', 'IDEA'];
    standardEntities.forEach(entity => {
      if (!entities.has(entity)) {
        entities.set(entity, 0);
      }
    });

    // Стандартные области
    const standardAreas = ['ENG', 'DEV', 'MED', 'KB', 'PROJ', 'TASK', 'MEETING'];
    standardAreas.forEach(area => {
      if (!areas.has(area)) {
        areas.set(area, 0);
      }
    });

    // Стандартные статусы
    const standardStatuses = ['DRA', 'AC', 'PAU', 'DON', 'DEP'];
    standardStatuses.forEach(status => {
      if (!statuses.has(status)) {
        statuses.set(status, 0);
      }
    });

    // Стандартные уровни доступа
    const standardAccesses = ['PUB', 'INT', 'PRV'];
    standardAccesses.forEach(access => {
      if (!accesses.has(access)) {
        accesses.set(access, 0);
      }
    });

    // Стандартные форматы
    const standardFormats = ['MD', 'TXT', 'DOC'];
    standardFormats.forEach(format => {
      if (!formats.has(format)) {
        formats.set(format, 0);
      }
    });

    // Стандартные якоря
    const standardAnchors = ['CAT-KB', 'CAT-DEV', 'CAT-MED', 'PROJ-MAIN', 'PROJ-SIDE'];
    standardAnchors.forEach(anchor => {
      if (!anchors.has(anchor)) {
        anchors.set(anchor, 0);
      }
    });
  }

  /**
   * Извлекает фронтматтер из содержимого файла
   */
  private extractFrontmatter(content: string): any {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return null;

    try {
      const frontmatterText = frontmatterMatch[1];
      if (!frontmatterText) return null;
      
      const lines = frontmatterText.split('\n');
      const result: any = {};

      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          // Убираем кавычки
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }

          // Парсим массивы
          if (value.startsWith('[') && value.endsWith(']')) {
            try {
              value = JSON.parse(value);
            } catch {
              // Оставляем как строку если не удалось распарсить
            }
          }

          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      console.warn('Ошибка парсинга фронтматтера:', error);
      return null;
    }
  }

  /**
   * Преобразует Map в массив предложений
   */
  private mapToSuggestions(map: Map<string, number>, type: EntitySuggestion['type']): EntitySuggestion[] {
    return Array.from(map.entries())
      .map(([value, count]) => ({
        value,
        label: this.getLabel(value, type),
        count,
        type
      }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }

  /**
   * Получает читаемую метку для значения
   */
  private getLabel(value: string, type: EntitySuggestion['type']): string {
    const labels: Record<string, Record<string, string>> = {
      entity: {
        'NOTE': 'Заметка',
        'DEC': 'Решение',
        'ADR': 'Архитектурное решение',
        'PROJ': 'Проект',
        'TASK': 'Задача',
        'MEETING': 'Встреча',
        'IDEA': 'Идея'
      },
      area: {
        'ENG': 'Инженерия',
        'DEV': 'Разработка',
        'MED': 'Медицина',
        'KB': 'База знаний',
        'PROJ': 'Проекты',
        'TASK': 'Задачи',
        'MEETING': 'Встречи'
      },
      status: {
        'DRA': 'Черновик',
        'AC': 'Активный',
        'PAU': 'Приостановлен',
        'DON': 'Завершен',
        'DEP': 'Устарел'
      },
      access: {
        'PUB': 'Публичный',
        'INT': 'Внутренний',
        'PRV': 'Приватный'
      },
      format: {
        'MD': 'Markdown',
        'TXT': 'Текст',
        'DOC': 'Документ'
      },
      anchor: {
        'CAT-KB': 'Категория: База знаний',
        'CAT-DEV': 'Категория: Разработка',
        'CAT-MED': 'Категория: Медицина',
        'PROJ-MAIN': 'Проект: Основной',
        'PROJ-SIDE': 'Проект: Побочный'
      }
    };

    return labels[type]?.[value] || value;
  }

  /**
   * Очищает кэш
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }
}

