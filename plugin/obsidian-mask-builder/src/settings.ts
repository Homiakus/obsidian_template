import { z } from "zod";

// Схема настроек плагина
export const SettingsSchema = z.object({
  // Основные настройки
  enabled: z.boolean().default(true),
  autoCreateFolders: z.boolean().default(true),
  defaultTemplate: z.string().default(""),
  
  // Настройки масок
  maskValidation: z.boolean().default(true),
  maxAreas: z.number().min(1).max(10).default(5),
  maxFileNameLength: z.number().min(50).max(200).default(140),
  
  // Настройки категоризации
  autoCategorize: z.boolean().default(true),
  kbAutoMove: z.boolean().default(true),
  
  // Настройки UI
  showMaskBuilder: z.boolean().default(true),
  showQuickActions: z.boolean().default(true),
  
  // Настройки производительности
  debounceDelay: z.number().min(100).max(2000).default(300),
  cacheSize: z.number().min(10).max(1000).default(100),
  
  // Настройки безопасности
  confirmFileOperations: z.boolean().default(true),
  backupBeforeMove: z.boolean().default(false),
});

export type PluginSettings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: PluginSettings = SettingsSchema.parse({});

// Миграции настроек
export type Version = "1.0.0";

export function migrateSettings(raw: any): PluginSettings {
  let settings = { ...raw };
  
  // Если нет версии, устанавливаем базовую
  if (!settings.version) {
    settings.version = "1.0.0" as Version;
  }
  
  // Миграции по версиям
  if (settings.version === "1.0.0") {
    // Добавляем новые поля с дефолтами
    if (settings.debounceDelay === undefined) {
      settings.debounceDelay = 300;
    }
    if (settings.cacheSize === undefined) {
      settings.cacheSize = 100;
    }
    if (settings.confirmFileOperations === undefined) {
      settings.confirmFileOperations = true;
    }
    if (settings.backupBeforeMove === undefined) {
      settings.backupBeforeMove = false;
    }
  }
  
  return SettingsSchema.parse(settings);
}