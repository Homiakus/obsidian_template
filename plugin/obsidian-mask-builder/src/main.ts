import { App, Plugin, TFile, Notice, debounce } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS, migrateSettings } from "./settings";
import { MaskBuilderSettingTab } from "./ui/settings-tab";
import { MaskBuilderModal } from "./ui/mask-builder-modal";
import { MaskParser, ParsedMask } from "./utils/mask-parser";
import { FileManager } from "./utils/file-manager";

export default class MaskBuilderPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  private fileManager: FileManager;
  private debouncedProcessFile: (file: TFile) => void;

  async onload() {
    console.log("Loading Mask Builder plugin");

    // Загружаем настройки с миграцией
    await this.loadSettings();

    // Инициализируем менеджер файлов
    this.fileManager = new FileManager(this.app);

    // Создаем debounced функцию для обработки файлов
    this.debouncedProcessFile = debounce(
      (file: TFile) => this.processFile(file),
      this.settings.debounceDelay,
      true
    );

    // Регистрируем команды
    this.registerCommands();

    // Регистрируем вкладку настроек
    this.addSettingTab(new MaskBuilderSettingTab(this.app, this));

    // Регистрируем обработчики событий
    this.registerEventHandlers();

    console.log("Mask Builder plugin loaded successfully");
  }

  onunload() {
    console.log("Unloading Mask Builder plugin");
    
    // Очищаем кэш
    this.fileManager.clearCache();
    
    console.log("Mask Builder plugin unloaded");
  }

  private registerCommands(): void {
    // Команда для открытия Mask Builder
    this.addCommand({
      id: "open-mask-builder",
      name: "Открыть Mask Builder",
      callback: () => this.openMaskBuilder(),
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "M" }],
    });

    // Команда для создания заметки по маске
    this.addCommand({
      id: "create-note-from-mask",
      name: "Создать заметку по маске",
      callback: () => this.createNoteFromMask(),
    });

    // Команда для валидации текущего файла
    this.addCommand({
      id: "validate-current-file-mask",
      name: "Валидировать маску текущего файла",
      callback: () => this.validateCurrentFileMask(),
    });

    // Команда для перемещения файла по маске
    this.addCommand({
      id: "move-file-by-mask",
      name: "Переместить файл по маске",
      callback: () => this.moveCurrentFileByMask(),
    });
  }

  private registerEventHandlers(): void {
    // Обработчик создания файлов
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (file instanceof TFile && this.settings.autoCategorize) {
          this.debouncedProcessFile(file);
        }
      })
    );

    // Обработчик переименования файлов
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (file instanceof TFile && this.settings.autoCategorize) {
          this.debouncedProcessFile(file);
        }
      })
    );

    // Обработчик изменения файлов
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && this.settings.autoCategorize) {
          // Проверяем, изменился ли фронтматтер
          this.checkFrontmatterChanges(file);
        }
      })
    );
  }

  private async processFile(file: TFile): Promise<void> {
    try {
      // Извлекаем маску из имени файла
      const mask = this.extractMaskFromFileName(file.name);
      if (!mask) return;

      // Валидируем маску если включено
      if (this.settings.maskValidation) {
        const validation = MaskParser.validate(mask);
        if (!validation.valid) {
          console.warn(`Invalid mask in file ${file.name}:`, validation.errors);
          return;
        }
      }

      // Обновляем фронтматтер
      await this.fileManager.updateFrontmatter(file, mask);

      // Автоматически перемещаем файл если включено
      if (this.settings.autoCategorize) {
        await this.autoMoveFile(file, mask);
      }
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
    }
  }

  private extractMaskFromFileName(fileName: string): ParsedMask | null {
    // Убираем расширение файла
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    
    // Пытаемся распарсить как маску
    return MaskParser.parse(nameWithoutExt);
  }

  private async autoMoveFile(file: TFile, mask: ParsedMask): Promise<void> {
    try {
      // Проверяем, нужно ли перемещать файл
      const currentPath = file.path;
      const targetPath = MaskParser.generateFilePath(mask, "");
      const fileName = MaskParser.generateFileName(mask);
      const fullTargetPath = `${targetPath}${fileName}.md`;

      // Если файл уже в правильном месте, не перемещаем
      if (currentPath === fullTargetPath) return;

      // Перемещаем файл
      await this.fileManager.moveFileByMask(file, mask);
    } catch (error) {
      console.error(`Error auto-moving file ${file.name}:`, error);
    }
  }

  private async checkFrontmatterChanges(file: TFile): Promise<void> {
    try {
      // Читаем содержимое файла
      const content = await this.app.vault.read(file);
      
      // Извлекаем маску из фронтматтера
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) return;

      const frontmatter = frontmatterMatch[1];
      const maskMatch = frontmatter.match(/^mask:\s*(.+)$/m);
      if (!maskMatch) return;

      const maskString = maskMatch[1].replace(/['"]/g, "");
      const mask = MaskParser.parse(maskString);
      if (!mask) return;

      // Проверяем, нужно ли перемещать файл
      await this.autoMoveFile(file, mask);
    } catch (error) {
      console.error(`Error checking frontmatter changes for ${file.name}:`, error);
    }
  }

  private openMaskBuilder(): void {
    if (!this.settings.enabled) {
      new Notice("Mask Builder отключен в настройках");
      return;
    }

    const modal = new MaskBuilderModal(
      this.app,
      this.fileManager,
      async (mask: ParsedMask, content: string) => {
        await this.createFileFromMask(mask, content);
      }
    );
    modal.open();
  }

  private async createFileFromMask(mask: ParsedMask, content: string): Promise<void> {
    try {
      const template = this.settings.defaultTemplate || undefined;
      const file = await this.fileManager.createFileFromMask(mask, content, template);
      
      if (file) {
        // Открываем созданный файл
        this.app.workspace.openLinkText(file.path, "", true);
      }
    } catch (error) {
      console.error("Error creating file from mask:", error);
      new Notice("Ошибка создания файла. Проверьте консоль.");
    }
  }

  private async createNoteFromMask(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("Нет активного файла");
      return;
    }

    const mask = this.extractMaskFromFileName(activeFile.name);
    if (!mask) {
      new Notice("Не удалось извлечь маску из имени файла");
      return;
    }

    // Создаем новую заметку на основе маски активного файла
    const content = await this.app.vault.read(activeFile);
    await this.createFileFromMask(mask, content);
  }

  private async validateCurrentFileMask(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("Нет активного файла");
      return;
    }

    const mask = this.extractMaskFromFileName(activeFile.name);
    if (!mask) {
      new Notice("Не удалось извлечь маску из имени файла");
      return;
    }

    const validation = MaskParser.validate(mask);
    if (validation.valid) {
      new Notice("Маска корректна");
    } else {
      new Notice(`Ошибки в маске: ${validation.errors.join(', ')}`);
    }
  }

  private async moveCurrentFileByMask(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("Нет активного файла");
      return;
    }

    const mask = this.extractMaskFromFileName(activeFile.name);
    if (!mask) {
      new Notice("Не удалось извлечь маску из имени файла");
      return;
    }

    const success = await this.fileManager.moveFileByMask(activeFile, mask);
    if (success) {
      // Обновляем активный файл
      this.app.workspace.openLinkText(activeFile.path, "", true);
    }
  }

  async loadSettings() {
    const raw = await this.loadData();
    const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
    this.settings = migrateSettings(merged);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// Экспортируем основной класс для использования в других модулях
export { MaskBuilderPlugin };