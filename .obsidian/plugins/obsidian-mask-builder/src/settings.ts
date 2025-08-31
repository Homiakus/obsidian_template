import { z } from "zod";

export interface RibbonAction {
  id: string;
  name: string;
  icon: string;
  action: 'format' | 'api' | 'create' | 'custom';
  enabled: boolean;
  order: number;
  customAction?: string;
}

// Тип для действий с обязательным customAction
export interface CustomRibbonAction extends Omit<RibbonAction, 'action' | 'customAction'> {
  action: 'custom';
  customAction: string;
}

// Объединенный тип для всех действий
export type AnyRibbonAction = RibbonAction | CustomRibbonAction;

// Схема настроек плагина
const SettingsSchema = z.object({
  enabled: z.boolean().default(true),
  autoCreateFolders: z.boolean().default(true),
  defaultTemplate: z.string().default(""),
  maskValidation: z.boolean().default(true),
  maxAreas: z.number().default(5),
  maxFileNameLength: z.number().default(140),
  autoCategorize: z.boolean().default(true),
  kbAutoMove: z.boolean().default(true),
  showMaskBuilder: z.boolean().default(true),
  showQuickActions: z.boolean().default(true),
  debounceDelay: z.number().default(300),
  cacheSize: z.number().default(100),
  confirmFileOperations: z.boolean().default(true),
  backupBeforeMove: z.boolean().default(false),
  
  // Настройки ленточного меню
  ribbonMenu: z.object({
    enabled: z.boolean().default(true),
    position: z.enum(['top', 'bottom']).default('bottom'),
    actions: z.array(z.object({
      id: z.string(),
      name: z.string(),
      icon: z.string(),
      action: z.enum(['format', 'api', 'create', 'custom']),
      enabled: z.boolean().default(true),
      order: z.number().default(1),
      customAction: z.string().optional(),
    })).default([
      {
        id: 'format-note',
        name: 'Форматировать заметку',
        icon: 'edit',
        action: 'format',
        enabled: true,
        order: 1
      },
      {
        id: 'send-api',
        name: 'Отправить в API',
        icon: 'upload',
        action: 'api',
        enabled: true,
        order: 2
      },
      {
        id: 'create-note',
        name: 'Создать заметку',
        icon: 'plus',
        action: 'create',
        enabled: true,
        order: 3
      },
      {
        id: 'save-template',
        name: 'Сохранить как шаблон',
        icon: 'save',
        action: 'custom',
        enabled: true,
        order: 4,
        customAction: 'saveTemplate'
      },
      {
        id: 'export-markdown',
        name: 'Экспорт Markdown',
        icon: 'download',
        action: 'custom',
        enabled: true,
        order: 5,
        customAction: 'exportMarkdown'
      },
      {
        id: 'edit-frontmatter',
        name: 'Редактировать фронтматтер',
        icon: 'edit-3',
        action: 'custom',
        enabled: true,
        order: 6,
        customAction: 'editFrontmatter'
      },
      {
        id: 'create-frontmatter',
        name: 'Создать фронтматтер',
        icon: 'file-plus',
        action: 'custom',
        enabled: true,
        order: 7,
        customAction: 'createFrontmatter'
      },
      {
        id: 'open-notes',
        name: 'Открыть заметки',
        icon: 'book-open',
        action: 'custom',
        enabled: true,
        order: 8,
        customAction: 'openNotes'
      },
      {
        id: 'open-projects',
        name: 'Открыть проекты',
        icon: 'folder',
        action: 'custom',
        enabled: true,
        order: 9,
        customAction: 'openProjects'
      },
      {
        id: 'open-decisions',
        name: 'Открыть решения',
        icon: 'check-square',
        action: 'custom',
        enabled: true,
        order: 10,
        customAction: 'openDecisions'
      }
    ]),
  }),
});

export type PluginSettings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: PluginSettings = {
  enabled: true,
  autoCreateFolders: true,
  defaultTemplate: "",
  maskValidation: true,
  maxAreas: 5,
  maxFileNameLength: 140,
  autoCategorize: true,
  kbAutoMove: true,
  showMaskBuilder: true,
  showQuickActions: true,
  debounceDelay: 300,
  cacheSize: 100,
  confirmFileOperations: true,
  backupBeforeMove: false,
  
  ribbonMenu: {
    enabled: true,
    position: 'bottom',
    actions: [
      {
        id: 'format-note',
        name: 'Форматировать заметку',
        icon: 'edit',
        action: 'format',
        enabled: true,
        order: 1
      },
      {
        id: 'send-api',
        name: 'Отправить в API',
        icon: 'upload',
        action: 'api',
        enabled: true,
        order: 2
      },
      {
        id: 'create-note',
        name: 'Создать заметку',
        icon: 'plus',
        action: 'create',
        enabled: true,
        order: 3
      },
      {
        id: 'save-template',
        name: 'Сохранить как шаблон',
        icon: 'save',
        action: 'custom',
        enabled: true,
        order: 4,
        customAction: 'saveTemplate'
      },
      {
        id: 'export-markdown',
        name: 'Экспорт Markdown',
        icon: 'download',
        action: 'custom',
        enabled: true,
        order: 5,
        customAction: 'exportMarkdown'
      },
      {
        id: 'edit-frontmatter',
        name: 'Редактировать фронтматтер',
        icon: 'edit-3',
        action: 'custom',
        enabled: true,
        order: 6,
        customAction: 'editFrontmatter'
      },
      {
        id: 'create-frontmatter',
        name: 'Создать фронтматтер',
        icon: 'file-plus',
        action: 'custom',
        enabled: true,
        order: 7,
        customAction: 'createFrontmatter'
      },
      {
        id: 'open-notes',
        name: 'Открыть заметки',
        icon: 'book-open',
        action: 'custom',
        enabled: true,
        order: 8,
        customAction: 'openNotes'
      },
      {
        id: 'open-projects',
        name: 'Открыть проекты',
        icon: 'folder',
        action: 'custom',
        enabled: true,
        order: 9,
        customAction: 'openProjects'
      },
      {
        id: 'open-decisions',
        name: 'Открыть решения',
        icon: 'check-square',
        action: 'custom',
        enabled: true,
        order: 10,
        customAction: 'openDecisions'
      }
    ]
  }
};

export function migrateSettings(settings: any): PluginSettings {
  // Миграция для новых настроек ленточного меню
  if (!settings.ribbonMenu) {
    settings.ribbonMenu = DEFAULT_SETTINGS.ribbonMenu;
  }
  
  // Миграция существующих действий
  if (settings.ribbonMenu.actions) {
    settings.ribbonMenu.actions.forEach((action: any) => {
      if (!action.id) action.id = `action-${Date.now()}`;
      if (!action.order) action.order = 1;
      if (!action.enabled) action.enabled = true;
    });
  }
  
  return SettingsSchema.parse(settings);
}