import { TFile } from "obsidian";

export interface RibbonActionConfig {
  id: string;
  name: string;
  icon: string;
  action: 'format' | 'api' | 'create' | 'custom';
  enabled: boolean;
  order: number;
  custom_action?: string;
  description?: string;
}

export interface RibbonDisplayConfig {
  show_tooltips: boolean;
  show_labels: boolean;
  icon_size: number;
  spacing: number;
  background_color: string;
  border_color: string;
  hover_effect: boolean;
  animation_speed: number;
}

export interface RibbonIconsConfig {
  default_icon: string;
  fallback_icon: string;
  custom_icons: string[];
}

export interface RibbonThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

export interface RibbonApiConfig {
  endpoint: string;
  timeout: number;
  retry_attempts: number;
  headers: Record<string, string>;
}

export interface RibbonLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  file: string;
  max_size: string;
  backup_count: number;
}

export interface RibbonMenuConfig {
  enabled: boolean;
  position: 'top' | 'bottom';
  theme: string;
  actions: RibbonActionConfig[];
  display: RibbonDisplayConfig;
  icons: RibbonIconsConfig;
  themes: Record<string, RibbonThemeConfig>;
  api: RibbonApiConfig;
  logging: RibbonLoggingConfig;
}

export class TomlConfigLoader {
  private app: any;
  private configPath: string;
  private defaultConfig: RibbonMenuConfig;

  constructor(app: any, configPath: string = 'ribbon-menu-config.toml') {
    this.app = app;
    this.configPath = configPath;
    this.defaultConfig = this.getDefaultConfig();
  }

  /**
   * Загружает конфигурацию из TOML файла
   */
  async loadConfig(): Promise<RibbonMenuConfig> {
    try {
      const configFile = this.app.vault.getAbstractFileByPath(this.configPath);
      
      if (configFile && configFile instanceof TFile) {
        const content = await this.app.vault.read(configFile);
        const config = this.parseToml(content);
        return this.mergeWithDefaults(config);
      } else {
        console.warn(`TOML конфигурация не найдена: ${this.configPath}, используем настройки по умолчанию`);
        return this.defaultConfig;
      }
    } catch (error) {
      console.error('Ошибка загрузки TOML конфигурации:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Парсит TOML контент
   */
  private parseToml(content: string): Partial<RibbonMenuConfig> {
    try {
      // Простой TOML парсер для основных секций
      const config: Partial<RibbonMenuConfig> = {
        actions: [],
        display: {} as RibbonDisplayConfig,
        icons: {} as RibbonIconsConfig,
        themes: {},
        api: {} as RibbonApiConfig,
        logging: {} as RibbonLoggingConfig
      };

      const lines = content.split('\n');
      let currentSection = '';
      let currentAction: Partial<RibbonActionConfig> = {};

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
          currentSection = trimmedLine.slice(1, -1);
          if (currentSection === 'ribbon_menu') {
            currentSection = 'main';
          }
        } else if (trimmedLine.startsWith('[[') && trimmedLine.endsWith(']]')) {
          if (currentAction.id) {
            config.actions!.push(currentAction as RibbonActionConfig);
          }
          currentAction = {};
          currentSection = 'action';
        } else if (trimmedLine.includes('=') && !trimmedLine.startsWith('#')) {
          const [key, value] = trimmedLine.split('=', 2).map(s => s.trim());
          if (value) {
            const cleanValue = this.cleanTomlValue(value);

            switch (currentSection) {
              case 'main':
                if (key === 'enabled') config.enabled = cleanValue === 'true';
                if (key === 'position') config.position = cleanValue as 'top' | 'bottom';
                if (key === 'theme') config.theme = cleanValue;
                break;
              case 'action':
                if (key === 'id') currentAction.id = cleanValue;
                if (key === 'name') currentAction.name = cleanValue;
                if (key === 'icon') currentAction.icon = cleanValue;
                if (key === 'action') currentAction.action = cleanValue as any;
                if (key === 'enabled') currentAction.enabled = cleanValue === 'true';
                if (key === 'order') currentAction.order = parseInt(cleanValue);
                if (key === 'custom_action') currentAction.custom_action = cleanValue;
                if (key === 'description') currentAction.description = cleanValue;
                break;
              case 'ribbon_menu.display':
                if (!config.display) config.display = {} as RibbonDisplayConfig;
                if (key === 'show_tooltips') config.display.show_tooltips = cleanValue === 'true';
                if (key === 'show_labels') config.display.show_labels = cleanValue === 'true';
                if (key === 'icon_size') config.display.icon_size = parseInt(cleanValue);
                if (key === 'spacing') config.display.spacing = parseInt(cleanValue);
                if (key === 'background_color') config.display.background_color = cleanValue;
                if (key === 'border_color') config.display.border_color = cleanValue;
                if (key === 'hover_effect') config.display.hover_effect = cleanValue === 'true';
                if (key === 'animation_speed') config.display.animation_speed = parseFloat(cleanValue);
                break;
              case 'ribbon_menu.icons':
                if (!config.icons) config.icons = {} as RibbonIconsConfig;
                if (key === 'default_icon') config.icons.default_icon = cleanValue;
                if (key === 'fallback_icon') config.icons.fallback_icon = cleanValue;
                if (key === 'custom_icons') {
                  // Парсим массив иконок
                  const iconsMatch = value.match(/\[(.*)\]/);
                  if (iconsMatch && iconsMatch[1]) {
                    config.icons.custom_icons = iconsMatch[1]
                      .split(',')
                      .map(icon => icon.trim().replace(/"/g, ''));
                  }
                }
                break;
            }
          }
        }
      }

      // Добавляем последнее действие
      if (currentAction.id) {
        config.actions!.push(currentAction as RibbonActionConfig);
      }

      return config;
    } catch (error) {
      console.error('Ошибка парсинга TOML:', error);
      return {};
    }
  }

  /**
   * Очищает значение TOML от кавычек и лишних символов
   */
  private cleanTomlValue(value: string): string {
    return value.replace(/^["']|["']$/g, '').trim();
  }

  /**
   * Объединяет загруженную конфигурацию с настройками по умолчанию
   */
  private mergeWithDefaults(config: Partial<RibbonMenuConfig>): RibbonMenuConfig {
    return {
      ...this.defaultConfig,
      ...config,
      actions: config.actions || this.defaultConfig.actions,
      display: { ...this.defaultConfig.display, ...config.display },
      icons: { ...this.defaultConfig.icons, ...config.icons }
    };
  }

  /**
   * Возвращает конфигурацию по умолчанию
   */
  private getDefaultConfig(): RibbonMenuConfig {
    return {
      enabled: true,
      position: 'bottom',
      theme: 'default',
      actions: [
        {
          id: 'format-content',
          name: 'Форматировать содержимое',
          icon: 'edit',
          action: 'format',
          enabled: true,
          order: 1,
          description: 'Форматирует содержимое заметки в Markdown'
        },
        {
          id: 'send-to-api',
          name: 'Отправить в API',
          icon: 'upload',
          action: 'api',
          enabled: true,
          order: 2,
          description: 'Отправляет данные заметки в API'
        },
        {
          id: 'create-note',
          name: 'Создать заметку',
          icon: 'plus',
          action: 'create',
          enabled: true,
          order: 3,
          description: 'Создает новую заметку на основе формы'
        },
        {
          id: 'save-template',
          name: 'Сохранить как шаблон',
          icon: 'save',
          action: 'custom',
          enabled: true,
          order: 4,
          custom_action: 'saveTemplate',
          description: 'Сохраняет текущую форму как шаблон'
        },
        {
          id: 'export-markdown',
          name: 'Экспорт Markdown',
          icon: 'download',
          action: 'custom',
          enabled: true,
          order: 5,
          custom_action: 'exportMarkdown',
          description: 'Экспортирует заметку в Markdown формат'
        },
        {
          id: 'edit-frontmatter',
          name: 'Редактировать фронтматтер',
          icon: 'edit-3',
          action: 'custom',
          enabled: true,
          order: 6,
          custom_action: 'editFrontmatter',
          description: 'Редактирует существующий фронтматтер'
        },
        {
          id: 'create-frontmatter',
          name: 'Создать фронтматтер',
          icon: 'file-plus',
          action: 'custom',
          enabled: true,
          order: 7,
          custom_action: 'createFrontmatter',
          description: 'Создает новый фронтматтер с очисткой формы'
        },
        {
          id: 'open-notes',
          name: 'Открыть заметки',
          icon: 'book-open',
          action: 'custom',
          enabled: true,
          order: 8,
          custom_action: 'openNotes',
          description: 'Быстрый доступ к папке с заметками'
        },
        {
          id: 'open-projects',
          name: 'Открыть проекты',
          icon: 'folder',
          action: 'custom',
          enabled: true,
          order: 9,
          custom_action: 'openProjects',
          description: 'Быстрый доступ к папке с проектами'
        },
        {
          id: 'open-decisions',
          name: 'Открыть решения',
          icon: 'check-square',
          action: 'custom',
          enabled: true,
          order: 10,
          custom_action: 'openDecisions',
          description: 'Быстрый доступ к папке с решениями'
        }
      ],
      display: {
        show_tooltips: true,
        show_labels: false,
        icon_size: 24,
        spacing: 10,
        background_color: 'var(--background-secondary)',
        border_color: 'var(--background-modifier-border)',
        hover_effect: true,
        animation_speed: 0.2
      },
      icons: {
        default_icon: 'edit',
        fallback_icon: 'circle',
        custom_icons: [
          'edit', 'edit-3', 'upload', 'plus', 'file-plus', 'save', 'download',
          'settings', 'search', 'link', 'tag', 'calendar', 'book-open', 'folder', 'check-square'
        ]
      },
      themes: {
        default: { primary: 'var(--text-normal)', secondary: 'var(--text-muted)', accent: 'var(--text-accent)' },
        dark: { primary: '#ffffff', secondary: '#cccccc', accent: '#7aa2f7' },
        light: { primary: '#000000', secondary: '#666666', accent: '#7aa2f7' }
      },
      api: {
        endpoint: 'https://api.example.com/notes',
        timeout: 5000,
        retry_attempts: 3,
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' }
      },
      logging: {
        enabled: true,
        level: 'info',
        file: 'ribbon-menu.log',
        max_size: '10MB',
        backup_count: 5
      }
    };
  }

  /**
   * Сохраняет конфигурацию в TOML файл
   */
  async saveConfig(config: RibbonMenuConfig): Promise<void> {
    try {
      const tomlContent = this.generateToml(config);
      const configFile = this.app.vault.getAbstractFileByPath(this.configPath);
      
      if (configFile && configFile instanceof TFile) {
        await this.app.vault.modify(configFile, tomlContent);
      } else {
        // Создаем новый файл
        await this.app.vault.create(this.configPath, tomlContent);
      }
      
      console.log('Конфигурация сохранена в TOML файл');
    } catch (error) {
      console.error('Ошибка сохранения TOML конфигурации:', error);
    }
  }

  /**
   * Генерирует TOML контент из конфигурации
   */
  private generateToml(config: RibbonMenuConfig): string {
    let toml = '# Конфигурация ленточного меню для Mask Builder\n\n';
    
    // Основные настройки
    toml += '[ribbon_menu]\n';
    toml += `enabled = ${config.enabled}\n`;
    toml += `position = "${config.position}"\n`;
    toml += `theme = "${config.theme}"\n\n`;
    
    // Действия
    config.actions.forEach(action => {
      toml += '[[ribbon_menu.actions]]\n';
      toml += `id = "${action.id}"\n`;
      toml += `name = "${action.name}"\n`;
      toml += `icon = "${action.icon}"\n`;
      toml += `action = "${action.action}"\n`;
      toml += `enabled = ${action.enabled}\n`;
      toml += `order = ${action.order}\n`;
      if (action.custom_action) {
        toml += `custom_action = "${action.custom_action}"\n`;
      }
      if (action.description) {
        toml += `description = "${action.description}"\n`;
      }
      toml += '\n';
    });
    
    // Настройки отображения
    toml += '[ribbon_menu.display]\n';
    toml += `show_tooltips = ${config.display.show_tooltips}\n`;
    toml += `show_labels = ${config.display.show_labels}\n`;
    toml += `icon_size = ${config.display.icon_size}\n`;
    toml += `spacing = ${config.display.spacing}\n`;
    toml += `background_color = "${config.display.background_color}"\n`;
    toml += `border_color = "${config.display.border_color}"\n`;
    toml += `hover_effect = ${config.display.hover_effect}\n`;
    toml += `animation_speed = ${config.display.animation_speed}\n\n`;
    
    // Настройки иконок
    toml += '[ribbon_menu.icons]\n';
    toml += `default_icon = "${config.icons.default_icon}"\n`;
    toml += `fallback_icon = "${config.icons.fallback_icon}"\n`;
    toml += `custom_icons = [${config.icons.custom_icons.map(icon => `"${icon}"`).join(', ')}]\n\n`;
    
    return toml;
  }
}
