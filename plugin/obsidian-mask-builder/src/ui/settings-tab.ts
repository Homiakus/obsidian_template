import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import { MaskBuilderPlugin } from "../main";
import { PluginSettings } from "../settings";

export class MaskBuilderSettingTab extends PluginSettingTab {
  plugin: MaskBuilderPlugin;

  constructor(app: App, plugin: MaskBuilderPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Заголовок
    containerEl.createEl("h2", { text: "Mask Builder Settings" });

    // Основные настройки
    this.createBasicSettings(containerEl);
    
    // Настройки масок
    this.createMaskSettings(containerEl);
    
    // Настройки категоризации
    this.createCategorizationSettings(containerEl);
    
    // Настройки UI
    this.createUISettings(containerEl);
    
    // Настройки производительности
    this.createPerformanceSettings(containerEl);
    
    // Настройки безопасности
    this.createSecuritySettings(containerEl);
  }

  private createBasicSettings(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Основные настройки" });

    new Setting(containerEl)
      .setName("Включить плагин")
      .setDesc("Включить или отключить функциональность Mask Builder")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabled)
          .onChange(async (value) => {
            this.plugin.settings.enabled = value;
            await this.plugin.saveSettings();
            new Notice("Настройки сохранены");
          })
      );

    new Setting(containerEl)
      .setName("Автоматическое создание папок")
      .setDesc("Автоматически создавать папки проектов и категорий при необходимости")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoCreateFolders)
          .onChange(async (value) => {
            this.plugin.settings.autoCreateFolders = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Шаблон по умолчанию")
      .setDesc("Путь к файлу шаблона для новых заметок (например: templates/default.md)")
      .addText((text) =>
        text
          .setPlaceholder("templates/default.md")
          .setValue(this.plugin.settings.defaultTemplate)
          .onChange(async (value) => {
            this.plugin.settings.defaultTemplate = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createMaskSettings(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Настройки масок" });

    new Setting(containerEl)
      .setName("Валидация масок")
      .setDesc("Проверять корректность масок при создании файлов")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.maskValidation)
          .onChange(async (value) => {
            this.plugin.settings.maskValidation = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Максимум областей")
      .setDesc("Максимальное количество областей в маске (1-10)")
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.maxAreas)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxAreas = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Максимальная длина имени файла")
      .setDesc("Максимальная длина имени файла в символах (50-200)")
      .addSlider((slider) =>
        slider
          .setLimits(50, 200, 10)
          .setValue(this.plugin.settings.maxFileNameLength)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxFileNameLength = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createCategorizationSettings(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Настройки категоризации" });

    new Setting(containerEl)
      .setName("Автоматическая категоризация")
      .setDesc("Автоматически перемещать файлы в соответствующие папки на основе масок")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoCategorize)
          .onChange(async (value) => {
            this.plugin.settings.autoCategorize = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Автоматическое перемещение KB заметок")
      .setDesc("Автоматически перемещать заметки с областью KB в папку базы знаний")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.kbAutoMove)
          .onChange(async (value) => {
            this.plugin.settings.kbAutoMove = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createUISettings(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Настройки интерфейса" });

    new Setting(containerEl)
      .setName("Показывать Mask Builder")
      .setDesc("Показывать кнопку Mask Builder в панели команд")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showMaskBuilder)
          .onChange(async (value) => {
            this.plugin.settings.showMaskBuilder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Показывать быстрые действия")
      .setDesc("Показывать контекстное меню с быстрыми действиями для файлов")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showQuickActions)
          .onChange(async (value) => {
            this.plugin.settings.showQuickActions = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createPerformanceSettings(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Настройки производительности" });

    new Setting(containerEl)
      .setName("Задержка debounce (мс)")
      .setDesc("Задержка для группировки операций (100-2000 мс)")
      .addSlider((slider) =>
        slider
          .setLimits(100, 2000, 100)
          .setValue(this.plugin.settings.debounceDelay)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.debounceDelay = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Размер кэша")
      .setDesc("Максимальное количество элементов в кэше (10-1000)")
      .addSlider((slider) =>
        slider
          .setLimits(10, 1000, 10)
          .setValue(this.plugin.settings.cacheSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.cacheSize = value;
            await this.plugin.saveSettings();
          })
      );
  }

  private createSecuritySettings(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Настройки безопасности" });

    new Setting(containerEl)
      .setName("Подтверждение операций с файлами")
      .setDesc("Запрашивать подтверждение перед перемещением или переименованием файлов")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.confirmFileOperations)
          .onChange(async (value) => {
            this.plugin.settings.confirmFileOperations = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Резервное копирование перед перемещением")
      .setDesc("Создавать резервную копию файла перед его перемещением")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.backupBeforeMove)
          .onChange(async (value) => {
            this.plugin.settings.backupBeforeMove = value;
            await this.plugin.saveSettings();
          })
      );
  }
}