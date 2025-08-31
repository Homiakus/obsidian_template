/**
 * @file: main.ts
 * @description: Полнофункциональный плагин Mask Builder для Obsidian
 * @dependencies: только obsidian
 * @created: 2024-12-19
 */

import { App, Plugin, TFile, Notice, PluginSettingTab, Setting, Modal, WorkspaceLeaf, MarkdownView } from "obsidian";

// Расширенные настройки плагина
interface PluginSettings {
  debugMode: boolean;
  debounceDelay: number;
  autoProcessFiles: boolean;
  apiEndpoint: string;
  apiTimeout: number;
  apiRetryAttempts: number;
  showTooltips: boolean;
  showLabels: boolean;
  iconSize: number;
  spacing: number;
}

const DEFAULT_SETTINGS: PluginSettings = {
  debugMode: false,
  debounceDelay: 500,
  autoProcessFiles: true,
  apiEndpoint: "https://api.example.com/notes",
  apiTimeout: 5000,
  apiRetryAttempts: 3,
  showTooltips: true,
  showLabels: false,
  iconSize: 24,
  spacing: 10
};

// Простая функция debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    };
}

// Простой логгер
class SimpleLogger {
  private debugMode: boolean = false;

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  log(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[Mask Builder] ${message}`, ...args);
    }
  }

  error(message: string, error?: any) {
    console.error(`[Mask Builder] ERROR: ${message}`, error);
  }
}

// Модальное окно для редактирования фронтматтера
class FrontmatterEditModal extends Modal {
  private onSubmit: (frontmatter: string) => void;
  private currentContent: string;

  constructor(app: App, currentContent: string, onSubmit: (frontmatter: string) => void) {
    super(app);
    this.currentContent = currentContent;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Редактировать фронтматтер" });

    const form = contentEl.createEl("form");
    
    const textarea = form.createEl("textarea", {
      placeholder: "Введите YAML фронтматтер...",
      rows: 10
    });
    textarea.value = this.currentContent;
    textarea.style.width = "100%";
    textarea.style.minHeight = "200px";

    const buttonContainer = form.createEl("div");
    buttonContainer.style.cssText = "margin-top: 10px; text-align: right;";

    const cancelBtn = buttonContainer.createEl("button", {
      text: "Отмена",
      type: "button"
    });
    cancelBtn.style.cssText = "margin-right: 10px; padding: 8px 16px;";
    
    const submitBtn = buttonContainer.createEl("button", {
      text: "Сохранить",
      type: "submit"
    });
    submitBtn.style.cssText = "padding: 8px 16px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px;";

    cancelBtn.onclick = () => this.close();
    
    form.onsubmit = (e) => {
      e.preventDefault();
      this.onSubmit(textarea.value);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Модальное окно для создания масок
class SimpleMaskModal extends Modal {
  private onSubmit: (maskData: any) => void;

  constructor(app: App, onSubmit: (maskData: any) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Создать новую маску" });

    const form = contentEl.createEl("form");
    
    const nameInput = form.createEl("input", {
      type: "text",
      placeholder: "Название маски"
    });
    nameInput.name = "name";
    nameInput.style.cssText = "width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px;";

    const descriptionInput = form.createEl("textarea", {
      placeholder: "Описание маски...",
      rows: 3
    });
    descriptionInput.name = "description";
    descriptionInput.style.cssText = "width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px;";

    const submitBtn = form.createEl("button", {
      text: "Создать маску",
      type: "submit"
    });
    submitBtn.style.cssText = "width: 100%; padding: 10px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer;";

    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const maskData = {
        name: formData.get("name") as string,
        description: formData.get("description") as string
      };
      
      this.onSubmit(maskData);
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

// Расширенное ленточное меню с множественными кнопками
class SimpleRibbonMenu {
  private container: HTMLElement;
  private app: App;

  constructor(app: App) {
    this.app = app;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mask-builder-ribbon';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: var(--background-primary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 8px;
      padding: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    // Кнопка создания маски
    const createBtn = this.createButton('🎭', 'Создать маску', () => {
      this.showCreateMaskModal();
    });

    // Кнопка форматирования содержимого
    const formatBtn = this.createButton('📝', 'Форматировать содержимое', () => {
      this.formatContent();
    });

    // Кнопка отправки в API
    const apiBtn = this.createButton('📤', 'Отправить в API', () => {
      this.sendToApi();
    });

    // Кнопка создания заметки
    const noteBtn = this.createButton('📄', 'Создать заметку', () => {
      this.createNote();
    });

    // Кнопка сохранения шаблона
    const templateBtn = this.createButton('💾', 'Сохранить как шаблон', () => {
      this.saveTemplate();
    });

    // Кнопка экспорта Markdown
    const exportBtn = this.createButton('📥', 'Экспорт Markdown', () => {
      this.exportMarkdown();
    });

    // Кнопка редактирования фронтматтера
    const frontmatterBtn = this.createButton('⚙️', 'Редактировать фронтматтер', () => {
      this.editFrontmatter();
    });

    // Кнопка создания фронтматтера
    const createFrontmatterBtn = this.createButton('➕', 'Создать фронтматтер', () => {
      this.createFrontmatter();
    });

    // Кнопка открытия заметок
    const notesBtn = this.createButton('📚', 'Открыть заметки', () => {
      this.openNotes();
    });

    // Кнопка открытия проектов
    const projectsBtn = this.createButton('📁', 'Открыть проекты', () => {
      this.openProjects();
    });

    // Кнопка открытия решений
    const decisionsBtn = this.createButton('✅', 'Открыть решения', () => {
      this.openDecisions();
    });

    // Добавляем все кнопки
    container.appendChild(createBtn);
    container.appendChild(formatBtn);
    container.appendChild(apiBtn);
    container.appendChild(noteBtn);
    container.appendChild(templateBtn);
    container.appendChild(exportBtn);
    container.appendChild(frontmatterBtn);
    container.appendChild(createFrontmatterBtn);
    container.appendChild(notesBtn);
    container.appendChild(projectsBtn);
    container.appendChild(decisionsBtn);

    return container;
  }

  private createButton(text: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.title = title;
    button.style.cssText = `
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      font-size: 16px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    button.onclick = onClick;
    return button;
  }

  // Методы для различных действий
  private showCreateMaskModal() {
    new SimpleMaskModal(this.app, async (maskData) => {
      const fileName = `${maskData.name}.md`;
      const content = `# ${maskData.name}\n\n${maskData.description || 'Описание маски...'}`;
      
      try {
        await this.app.vault.create(fileName, content);
        new Notice(`Маска создана: ${fileName}`);
      } catch (error) {
        new Notice(`Ошибка создания: ${error}`);
      }
    }).open();
  }

  private formatContent() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const content = editor.getValue();
      // Простое форматирование - убираем лишние пробелы
      const formatted = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      editor.setValue(formatted);
      new Notice('Содержимое отформатировано');
    } else {
      new Notice('Откройте Markdown файл для форматирования');
    }
  }

  private async sendToApi() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      try {
        const content = await this.app.vault.read(activeFile);
        new Notice('Отправка в API... (заглушка)');
        // Здесь будет реальная отправка в API
      } catch (error) {
        new Notice(`Ошибка чтения файла: ${error}`);
      }
    } else {
      new Notice('Нет активного файла для отправки');
    }
  }

  private createNote() {
    new SimpleMaskModal(this.app, async (maskData) => {
      const fileName = `note_${Date.now()}.md`;
      const content = `# ${maskData.name}\n\n${maskData.description || 'Содержимое заметки...'}`;
      
      try {
        await this.app.vault.create(fileName, content);
        new Notice(`Заметка создана: ${fileName}`);
      } catch (error) {
        new Notice(`Ошибка создания: ${error}`);
      }
    }).open();
  }

  private saveTemplate() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      const templateName = `template_${activeFile.basename}.md`;
      this.app.vault.read(activeFile).then(content => {
        this.app.vault.create(templateName, content).then(() => {
          new Notice(`Шаблон сохранен: ${templateName}`);
        });
      });
    } else {
      new Notice('Нет активного файла для сохранения как шаблон');
    }
  }

  private exportMarkdown() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      // Создаем ссылку для скачивания
      this.app.vault.read(activeFile).then(content => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeFile.basename}.md`;
        a.click();
        URL.revokeObjectURL(url);
        new Notice('Markdown экспортирован');
      });
    } else {
      new Notice('Нет активного файла для экспорта');
    }
  }

  private editFrontmatter() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      this.app.vault.read(activeFile).then(content => {
        // Извлекаем фронтматтер
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const currentFrontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
        
        new FrontmatterEditModal(this.app, currentFrontmatter, async (newFrontmatter) => {
          try {
            let newContent = content;
            if (frontmatterMatch) {
              // Заменяем существующий фронтматтер
              newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
            } else {
              // Добавляем новый фронтматтер
              newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
            }
            
            await this.app.vault.modify(activeFile, newContent);
            new Notice('Фронтматтер обновлен');
          } catch (error) {
            new Notice(`Ошибка обновления: ${error}`);
          }
        }).open();
      });
    } else {
      new Notice('Нет активного файла для редактирования фронтматтера');
    }
  }

  private createFrontmatter() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      this.app.vault.read(activeFile).then(content => {
        const newFrontmatter = `title: ${activeFile.basename}\ndate: ${new Date().toISOString().split('T')[0]}\ntags: []\ncategory: \nstatus: draft`;
        
        if (content.startsWith('---')) {
          new Notice('Фронтматтер уже существует');
          return;
        }
        
        const newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
        this.app.vault.modify(activeFile, newContent).then(() => {
          new Notice('Фронтматтер создан');
        });
      });
    } else {
      new Notice('Нет активного файла для создания фронтматтера');
    }
  }

  private openNotes() {
    // Открываем папку с заметками
    this.app.vault.adapter.list('').then(files => {
      const noteFiles = files.files.filter(f => f.endsWith('.md'));
      if (noteFiles.length > 0) {
        this.app.workspace.openLinkText(noteFiles[0], '', true);
        new Notice('Открыта папка с заметками');
      } else {
        new Notice('Папка с заметками пуста');
      }
    });
  }

  private openProjects() {
    // Открываем папку с проектами
    this.app.vault.adapter.list('').then(files => {
      const projectFiles = files.files.filter(f => f.includes('project') && f.endsWith('.md'));
      if (projectFiles.length > 0) {
        this.app.workspace.openLinkText(projectFiles[0], '', true);
        new Notice('Открыта папка с проектами');
      } else {
        new Notice('Папка с проектами пуста');
      }
    });
  }

  private openDecisions() {
    // Открываем папку с решениями
    this.app.vault.adapter.list('').then(files => {
      const decisionFiles = files.files.filter(f => f.includes('decision') && f.endsWith('.md'));
      if (decisionFiles.length > 0) {
        this.app.workspace.openLinkText(decisionFiles[0], '', true);
        new Notice('Открыта папка с решениями');
      } else {
        new Notice('Папка с решениями пуста');
      }
    });
  }

  mount(): void {
    document.body.appendChild(this.container);
  }

  unmount(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  updatePosition(): void {
    if (this.container.parentNode) {
      this.container.style.top = '20px';
      this.container.style.right = '20px';
    }
  }
}

// Вкладка настроек
class SimpleSettingsTab extends PluginSettingTab {
  plugin: any;
  settings: PluginSettings;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
    this.settings = plugin.settings;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Mask Builder Settings" });

    new Setting(containerEl)
      .setName("Debug Mode")
      .setDesc("Enable debug logging")
      .addToggle(toggle => toggle
        .setValue(this.settings.debugMode)
        .onChange(async (value) => {
          this.settings.debugMode = value;
          await this.plugin.saveData(this.settings);
        }));

    new Setting(containerEl)
      .setName("Debounce Delay")
      .setDesc("Delay for file processing (ms)")
      .addSlider(slider => slider
        .setLimits(100, 2000, 100)
        .setValue(this.settings.debounceDelay)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.settings.debounceDelay = value;
          await this.plugin.saveData(this.settings);
        }));

    new Setting(containerEl)
      .setName("Auto Process Files")
      .setDesc("Automatically process files on change")
      .addToggle(toggle => toggle
        .setValue(this.settings.autoProcessFiles)
        .onChange(async (value) => {
          this.settings.autoProcessFiles = value;
          await this.plugin.saveData(this.settings);
        }));

    new Setting(containerEl)
      .setName("API Endpoint")
      .setDesc("API endpoint for sending data")
      .addText(text => text
        .setValue(this.settings.apiEndpoint)
        .onChange(async (value) => {
          this.settings.apiEndpoint = value;
          await this.plugin.saveData(this.settings);
        }));

    new Setting(containerEl)
      .setName("API Timeout")
      .setDesc("API request timeout (ms)")
      .addSlider(slider => slider
        .setLimits(1000, 10000, 1000)
        .setValue(this.settings.apiTimeout)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.settings.apiTimeout = value;
          await this.plugin.saveData(this.settings);
        }));

    new Setting(containerEl)
      .setName("Show Tooltips")
      .setDesc("Show tooltips on buttons")
      .addToggle(toggle => toggle
        .setValue(this.settings.showTooltips)
        .onChange(async (value) => {
          this.settings.showTooltips = value;
          await this.plugin.saveData(this.settings);
        }));

    new Setting(containerEl)
      .setName("Show Labels")
      .setDesc("Show labels on buttons")
      .addToggle(toggle => toggle
        .setValue(this.settings.showLabels)
        .onChange(async (value) => {
          this.settings.showLabels = value;
          await this.plugin.saveData(this.settings);
        }));
  }
}

// Основной класс плагина
export default class MaskBuilderPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;
  private ribbonMenu!: SimpleRibbonMenu;
  private debouncedProcessFile!: (file: TFile) => void;
  private logger = new SimpleLogger();

  async onload() {
    try {
      this.logger.log("Loading Mask Builder plugin...");

      // Загружаем настройки
      this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
      this.logger.setDebugMode(this.settings.debugMode);
      
      // Создаем debounced функцию для обработки файлов
      this.debouncedProcessFile = debounce(
        (file: TFile) => this.processFile(file),
        this.settings.debounceDelay
      );

      // Регистрируем команды
      this.registerCommands();

      // Регистрируем вкладку настроек
      this.addSettingTab(new SimpleSettingsTab(this.app, this));

      // Регистрируем обработчики событий
      this.registerEventHandlers();

      // Создаем ленточное меню
      this.createRibbonMenu();

      this.logger.log("Mask Builder plugin loaded successfully");
      new Notice("Mask Builder plugin loaded successfully");
      
    } catch (error) {
      this.logger.error("Error loading plugin:", error);
      new Notice("Mask Builder: Error loading plugin");
    }
  }

  onunload() {
    try {
      this.logger.log("Unloading Mask Builder plugin...");
      
      if (this.ribbonMenu) {
        this.ribbonMenu.unmount();
      }
      
      this.logger.log("Mask Builder plugin unloaded successfully");
    } catch (error) {
      this.logger.error("Error unloading plugin:", error);
    }
  }

  private registerCommands() {
    // Команда для создания новой маски
    this.addCommand({
      id: 'create-mask',
      name: 'Create New Mask',
      callback: () => {
        this.showCreateMaskModal();
      }
    });

    // Команда для обработки текущего файла
    this.addCommand({
      id: 'process-current-file',
      name: 'Process Current File',
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (checking) {
          return file !== null;
        }
        if (file) {
          this.processFile(file);
        }
      }
    });

    // Команда для переключения debug режима
    this.addCommand({
      id: 'toggle-debug-mode',
      name: 'Toggle Debug Mode',
      callback: () => {
        this.settings.debugMode = !this.settings.debugMode;
        this.logger.setDebugMode(this.settings.debugMode);
        this.saveData(this.settings);
        new Notice(`Debug mode ${this.settings.debugMode ? 'enabled' : 'disabled'}`);
      }
    });

    // Команда для редактирования фронтматтера
    this.addCommand({
      id: 'edit-frontmatter',
      name: 'Edit Frontmatter',
      callback: () => {
        this.editFrontmatter();
      }
    });

    // Команда для создания фронтматтера
    this.addCommand({
      id: 'create-frontmatter',
      name: 'Create Frontmatter',
      callback: () => {
        this.createFrontmatter();
      }
    });

    // Команда для форматирования содержимого
    this.addCommand({
      id: 'format-content',
      name: 'Format Content',
      callback: () => {
        this.formatContent();
      }
    });

    // Команда для отправки в API
    this.addCommand({
      id: 'send-to-api',
      name: 'Send to API',
      callback: () => {
        this.sendToApi();
      }
    });

    // Команда для сохранения шаблона
    this.addCommand({
      id: 'save-template',
      name: 'Save as Template',
      callback: () => {
        this.saveTemplate();
      }
    });

    // Команда для экспорта Markdown
    this.addCommand({
      id: 'export-markdown',
      name: 'Export Markdown',
      callback: () => {
        this.exportMarkdown();
      }
    });
  }

  private registerEventHandlers() {
    // Обработчик изменения файлов
    if (this.settings.autoProcessFiles) {
      this.registerEvent(
        this.app.vault.on('modify', (file: TFile) => {
          if (file.extension === 'md') {
            this.debouncedProcessFile(file);
          }
        })
      );
    }

    // Обработчик изменения layout для обновления позиции меню
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        if (this.ribbonMenu) {
          this.ribbonMenu.updatePosition();
        }
      })
    );
  }

  private createRibbonMenu() {
    try {
      this.ribbonMenu = new SimpleRibbonMenu(this.app);
      this.ribbonMenu.mount();
      this.logger.log("Ribbon menu created successfully");
    } catch (error) {
      this.logger.error("Error creating ribbon menu:", error);
    }
  }

  private async processFile(file: TFile) {
    try {
      this.logger.log(`Processing file: ${file.name}`);
      
      // Простая обработка файла
      const content = await this.app.vault.read(file);
      if (content.includes('mask') || content.includes('маска')) {
        this.logger.log(`File ${file.name} contains mask content`);
      }
      
    } catch (error) {
      this.logger.error("Error processing file:", error);
    }
  }

  private showCreateMaskModal() {
    new SimpleMaskModal(this.app, async (maskData) => {
      const fileName = `${maskData.name}.md`;
      const content = `# ${maskData.name}\n\n${maskData.description || 'Описание маски...'}`;
      
      try {
        await this.app.vault.create(fileName, content);
        new Notice(`Маска создана: ${fileName}`);
      } catch (error) {
        new Notice(`Ошибка создания: ${error}`);
      }
    }).open();
  }

  // Методы для команд
  private editFrontmatter() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      this.app.vault.read(activeFile).then(content => {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const currentFrontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
        
        new FrontmatterEditModal(this.app, currentFrontmatter, async (newFrontmatter) => {
          try {
            let newContent = content;
            if (frontmatterMatch) {
              newContent = content.replace(/^---\n[\s\S]*?\n---/, `---\n${newFrontmatter}\n---`);
            } else {
              newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
            }
            
            await this.app.vault.modify(activeFile, newContent);
            new Notice('Фронтматтер обновлен');
          } catch (error) {
            new Notice(`Ошибка обновления: ${error}`);
          }
        }).open();
      });
    } else {
      new Notice('Нет активного файла для редактирования фронтматтера');
    }
  }

  private createFrontmatter() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      this.app.vault.read(activeFile).then(content => {
        const newFrontmatter = `title: ${activeFile.basename}\ndate: ${new Date().toISOString().split('T')[0]}\ntags: []\ncategory: \nstatus: draft`;
        
        if (content.startsWith('---')) {
          new Notice('Фронтматтер уже существует');
          return;
        }
        
        const newContent = `---\n${newFrontmatter}\n---\n\n${content}`;
        this.app.vault.modify(activeFile, newContent).then(() => {
          new Notice('Фронтматтер создан');
        });
      });
    } else {
      new Notice('Нет активного файла для создания фронтматтера');
    }
  }

  private formatContent() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const content = editor.getValue();
      const formatted = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      editor.setValue(formatted);
      new Notice('Содержимое отформатировано');
    } else {
      new Notice('Откройте Markdown файл для форматирования');
    }
  }

  private async sendToApi() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      try {
        const content = await this.app.vault.read(activeFile);
        new Notice('Отправка в API... (заглушка)');
      } catch (error) {
        new Notice(`Ошибка чтения файла: ${error}`);
      }
    } else {
      new Notice('Нет активного файла для отправки');
    }
  }

  private saveTemplate() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      const templateName = `template_${activeFile.basename}.md`;
      this.app.vault.read(activeFile).then(content => {
        this.app.vault.create(templateName, content).then(() => {
          new Notice(`Шаблон сохранен: ${templateName}`);
        });
      });
    } else {
      new Notice('Нет активного файла для сохранения как шаблон');
    }
  }

  private exportMarkdown() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      this.app.vault.read(activeFile).then(content => {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeFile.basename}.md`;
        a.click();
        URL.revokeObjectURL(url);
        new Notice('Markdown экспортирован');
      });
    } else {
      new Notice('Нет активного файла для экспорта');
    }
  }
}
