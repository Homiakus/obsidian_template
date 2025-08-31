import { App, Plugin, TFile, Notice } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS, migrateSettings } from "./settings";
import { MaskBuilderSettingTab } from "./ui/settings-tab";
import { MaskBuilderModal } from "./ui/mask-builder-modal";
import { DebugPanel } from "./ui/debug-panel";
import { AnalyticsPanel } from "./ui/analytics-panel";
import { MaskParser, ParsedMask } from "./utils/mask-parser";
import { FileManager } from "./utils/file-manager";
import { EntityFinder } from "./utils/entity-finder";
import { performanceMonitor } from "./utils/performance-monitor";
import { errorHandler, ErrorCategory, ErrorSeverity } from "./utils/error-handler";
import { initializeAnalytics, getAnalytics } from "./utils/analytics";
import { RibbonMenu, RibbonMenuOptions } from "./ui/ribbon-menu";
import { RibbonAction, AnyRibbonAction } from "./settings";

// Собственная реализация debounce, так как obsidian не экспортирует эту функцию
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

export default class MaskBuilderPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  private fileManager!: FileManager;
  private entityFinder!: EntityFinder;
  private debouncedProcessFile!: (file: TFile) => void;
  private ribbonMenu!: RibbonMenu;
  private ribbonContainer!: HTMLElement;

  async onload() {
    try {
      performanceMonitor.startTimer('pluginLoad');
      console.log("Loading Mask Builder plugin...");

      // Загружаем настройки
      this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
      
      // Мигрируем настройки если нужно
      this.settings = migrateSettings(this.settings);
      
      // Инициализируем аналитику
      initializeAnalytics("1.0.0", this.settings);

      // Инициализируем менеджер файлов и поисковик сущностей
      this.fileManager = new FileManager(this.app);
      this.entityFinder = new EntityFinder(this.app);

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

      // Создаем ленточное меню в основном интерфейсе
      this.createRibbonMenu();

      // Добавляем слушатель для изменения состояния боковых панелей
      this.registerEvent(
        this.app.workspace.on('layout-change', () => {
          this.updateRibbonMenuPosition();
        })
      );

      // Дополнительно создаем ленточное меню с задержкой для надежности
      setTimeout(() => {
        if (!this.ribbonContainer || !this.ribbonContainer.parentNode) {
          console.log('🔍 Ленточное меню не найдено, создаем с задержкой...');
          this.createRibbonMenu();
        }
      }, 1000);

      performanceMonitor.endTimer('pluginLoad');
      console.log("Mask Builder plugin loaded successfully");
    } catch (error) {
      errorHandler.handleCriticalError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: 'pluginLoad' }
      );
      throw error;
    }
  }

  onunload() {
    console.log("Unloading Mask Builder plugin");
    
    try {
      // Уничтожаем ленточное меню
      if (this.ribbonMenu) {
        this.ribbonMenu.destroy();
      }
      
      // Удаляем контейнер ленточного меню
      if (this.ribbonContainer && this.ribbonContainer.parentNode) {
        this.ribbonContainer.parentNode.removeChild(this.ribbonContainer);
      }

      // Очищаем кэш
      this.fileManager.clearCache();
      
      // Логируем финальный отчет о производительности
      performanceMonitor.logPerformanceReport();
      
      console.log("Mask Builder plugin unloaded");
    } catch (error) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        { operation: 'pluginUnload' }
      );
    }
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

    // Команда для отладки (только в режиме разработки)
    if (this.settings.enabled) {
      this.addCommand({
        id: "open-debug-panel",
        name: "Открыть панель отладки",
        callback: () => this.openDebugPanel(),
        hotkeys: [{ modifiers: ["Mod", "Shift", "Alt"], key: "D" }],
      });

      // Команда для аналитики
      this.addCommand({
        id: "open-analytics-panel",
        name: "Открыть панель аналитики",
        callback: () => this.openAnalyticsPanel(),
        hotkeys: [{ modifiers: ["Mod", "Shift", "Alt"], key: "A" }],
      });

      // Команда для принудительного создания ленточного меню
      this.addCommand({
        id: "force-create-ribbon-menu",
        name: "Принудительно создать ленточное меню",
        callback: () => this.forceCreateRibbonMenu(),
        hotkeys: [{ modifiers: ["Mod", "Shift", "Alt"], key: "R" }],
      });

      // Команда для проверки состояния ленточного меню
      this.addCommand({
        id: "check-ribbon-menu-status",
        name: "Проверить состояние ленточного меню",
        callback: () => this.checkRibbonMenuStatus(),
        hotkeys: [{ modifiers: ["Mod", "Shift", "Alt"], key: "S" }],
      });
    }
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
      const content = await this.app.vault.read(file);
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      
      if (frontmatter) {
        const maskMatch = frontmatter.match(/^mask:\s*(.+)$/m);
        
        if (maskMatch && maskMatch[1]) {
          const maskString = maskMatch[1].replace(/['"]/g, "");
          const mask = MaskParser.parse(maskString);
          if (!mask) return;

          // Валидируем маску если включено
          if (this.settings.maskValidation) {
            performanceMonitor.startTimer('maskValidation');
            const validation = MaskParser.validate(mask);
            performanceMonitor.endTimer('maskValidation');
            
            // Отслеживаем валидацию в аналитике
            const analytics = getAnalytics();
            if (analytics) {
              analytics.trackMaskValidation(file.name, validation.valid, validation.errors);
            }
            
            if (!validation.valid) {
              errorHandler.handleValidationError(
                `Invalid mask in file ${file.name}: ${validation.errors.join(', ')}`,
                { fileName: file.name, mask, errors: validation.errors }
              );
              performanceMonitor.endTimer('fileProcessing');
              return;
            }
          }

          // Обновляем фронтматтер
          performanceMonitor.startTimer('fileOperations');
          await this.fileManager.updateFrontmatter(file, mask);
          performanceMonitor.endTimer('fileOperations');

          // Отслеживаем файловые операции в аналитике
          const analytics = getAnalytics();
          if (analytics) {
            analytics.trackFileOperation('updateFrontmatter', file.name, true);
          }

          // Автоматически перемещаем файл если включено
          if (this.settings.autoCategorize) {
            await this.autoMoveFile(file, mask);
          }
          
          performanceMonitor.endTimer('fileProcessing');
        }
      }
    } catch (error) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.FILE_OPERATION,
        ErrorSeverity.MEDIUM,
        { file: file.path }
      );
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
      
      // Отслеживаем перемещение в аналитике
      const analytics = getAnalytics();
      if (analytics) {
        analytics.trackFileOperation('moveFile', file.name, true);
      }
    } catch (error) {
      errorHandler.handleFileOperationError(
        error instanceof Error ? error : new Error(String(error)),
        { fileName: file.name, operation: 'autoMoveFile', mask }
      );
      
      // Отслеживаем ошибку в аналитике
      const analytics = getAnalytics();
      if (analytics) {
        analytics.trackFileOperation('moveFile', file.name, false);
      }
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
      if (!frontmatter) return;
      
      const maskMatch = frontmatter.match(/^mask:\s*(.+)$/m);
      if (!maskMatch || !maskMatch[1]) return;

      const maskString = maskMatch[1].replace(/['"]/g, "");
      const mask = MaskParser.parse(maskString);
      if (!mask) return;

      // Проверяем, нужно ли перемещать файл
      await this.autoMoveFile(file, mask);
    } catch (error) {
      errorHandler.handleFileOperationError(
        error instanceof Error ? error : new Error(String(error)),
        { fileName: file.name, operation: 'checkFrontmatterChanges' }
      );
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
        
        // Отслеживаем создание файла в аналитике
        const analytics = getAnalytics();
        if (analytics) {
          analytics.trackMaskCreated(mask.entity, true);
          analytics.trackFileOperation('createFile', file.name, true);
        }
      }
    } catch (error) {
      errorHandler.handleFileOperationError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: 'createFileFromMask', mask }
      );
      
      // Отслеживаем ошибку в аналитике
      const analytics = getAnalytics();
      if (analytics) {
        analytics.trackMaskCreated(mask.entity, false);
        analytics.trackFileOperation('createFile', 'unknown', false);
      }
      
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
    try {
      const raw = await this.loadData();
      const merged = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
      this.settings = migrateSettings(merged);
    } catch (error) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        { operation: 'loadSettings' }
      );
      // Используем настройки по умолчанию в случае ошибки
      this.settings = DEFAULT_SETTINGS;
    }
  }

  async saveSettings() {
    try {
      await this.saveData(this.settings);
    } catch (error) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.HIGH,
        { operation: 'saveSettings' }
      );
    }
  }

  private openDebugPanel(): void {
    const debugPanel = new DebugPanel(this.app);
    debugPanel.open();
  }

  private openAnalyticsPanel(): void {
    const analyticsPanel = new AnalyticsPanel(this.app);
    analyticsPanel.open();
  }

  private createRibbonMenu(): void {
    if (!this.settings.enabled || !this.settings.ribbonMenu?.enabled) {
      return;
    }

    // Создаем контейнер для ленточного меню в основном интерфейсе
    this.ribbonContainer = document.createElement('div');
    this.ribbonContainer.addClass('mask-builder-ribbon-container');
    
    // Размещаем внизу основного окна
    const mainContainer = this.app.workspace.containerEl;
    
    // Пробуем добавить в основной контейнер Obsidian
    mainContainer.appendChild(this.ribbonContainer);
    
    // Альтернативно добавляем в body, если основной контейнер не работает
    if (!this.ribbonContainer.parentNode) {
      document.body.appendChild(this.ribbonContainer);
    }

    const options: RibbonMenuOptions = {
      position: this.settings.ribbonMenu.position || 'bottom',
      actions: (this.settings.ribbonMenu.actions || []) as AnyRibbonAction[],
      onAction: (action: AnyRibbonAction, context: any) => {
        this.handleRibbonAction(action, context);
      }
    };

    this.ribbonMenu = new RibbonMenu(this.app, options);
    this.ribbonMenu.create(this.ribbonContainer);
    
    // Обновляем позицию после создания
    this.updateRibbonMenuPosition();
  }

  private handleRibbonAction(action: AnyRibbonAction, context: any): void {
    
    switch (action.action) {
      case 'create':
        this.openMaskBuilder();
        break;
        
      case 'format':
        this.formatCurrentNote();
        break;
        
      case 'api':
        this.sendToAPI();
        break;
        
      case 'custom':
        this.handleCustomAction(action);
        break;
        
      default:
        new Notice(`Действие "${(action as any).action}" не реализовано`);
    }
  }

  private handleCustomAction(action: any): void {
    const customAction = action.customAction;
    if (!customAction) {
      return;
    }
    
    switch (customAction) {
      case 'saveTemplate':
        this.saveAsTemplate();
        break;
        
      case 'exportMarkdown':
        this.exportMarkdown();
        break;
        
      case 'editFrontmatter':
        this.editFrontmatter();
        break;
        
      case 'createFrontmatter':
        this.createFrontmatter();
        break;
        
      case 'openNotes':
        this.openNotes();
        break;
        
      case 'openProjects':
        this.openProjects();
        break;
        
      case 'openDecisions':
        this.openDecisions();
        break;
        
      default:
        new Notice(`Действие "${customAction}" не реализовано`);
    }
  }

  private forceCreateRibbonMenu(): void {
    
    // Удаляем существующее ленточное меню если есть
    if (this.ribbonContainer && this.ribbonContainer.parentNode) {
      this.ribbonContainer.parentNode.removeChild(this.ribbonContainer);
    }
    
    if (this.ribbonMenu) {
      this.ribbonMenu.destroy();
    }
    
    // Создаем заново
    this.createRibbonMenu();
    
    // Показываем уведомление
    new Notice('Ленточное меню пересоздано!');
  }

  private checkRibbonMenuStatus(): void {
    
  }

  private updateRibbonMenuPosition(): void {
    if (!this.ribbonContainer) return;
    
    // Теперь CSS автоматически адаптируется под состояние панелей
    // Просто логируем текущее состояние
    const leftPanel = this.app.workspace.leftSplit;
    const rightPanel = this.app.workspace.rightSplit;
    
  }

  // Методы для обработки действий ленточного меню
  private formatCurrentNote(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      new Notice(`Форматирование заметки: ${activeFile.name}`);
      // TODO: Реализовать форматирование
    } else {
      new Notice('Нет активной заметки для форматирования');
    }
  }

  private sendToAPI(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      new Notice(`Отправка в API: ${activeFile.name}`);
      // TODO: Реализовать отправку в API
    } else {
      new Notice('Нет активной заметки для отправки');
    }
  }

  private saveAsTemplate(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      new Notice(`Сохранение как шаблон: ${activeFile.name}`);
      // TODO: Реализовать сохранение как шаблон
    } else {
      new Notice('Нет активной заметки для сохранения');
    }
  }

  private exportMarkdown(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      new Notice(`Экспорт Markdown: ${activeFile.name}`);
      // TODO: Реализовать экспорт Markdown
    } else {
      new Notice('Нет активной заметки для экспорта');
    }
  }

  private editFrontmatter(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      new Notice(`Редактирование фронтматтера: ${activeFile.name}`);
      // TODO: Реализовать редактирование фронтматтера
    } else {
      new Notice('Нет активной заметки для редактирования');
    }
  }

  private createFrontmatter(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      new Notice(`Создание фронтматтера: ${activeFile.name}`);
      // TODO: Реализовать создание фронтматтера
    } else {
      new Notice('Нет активной заметки для создания фронтматтера');
    }
  }

  private openNotes(): void {
    new Notice('Открытие заметок');
    // TODO: Реализовать открытие заметок
  }

  private openProjects(): void {
    new Notice('Открытие проектов');
    // TODO: Реализовать открытие проектов
  }

  private openDecisions(): void {
    new Notice('Открытие решений');
    // TODO: Реализовать открытие решений
  }
}

// Экспортируем основной класс для использования в других модулях
export { MaskBuilderPlugin };