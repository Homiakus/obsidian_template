import { App, Modal, Setting, Notice, ButtonComponent } from "obsidian";
import { RibbonAction } from "../settings";

export interface RibbonSettingsModalOptions {
  actions: RibbonAction[];
  onSave: (actions: RibbonAction[]) => void;
}

export class RibbonSettingsModal extends Modal {
  private options: RibbonSettingsModalOptions;
  private actions: RibbonAction[];
  private availableIcons = [
    'edit', 'edit-3', 'upload', 'plus', 'file-plus', 'save', 'download', 'settings', 
    'search', 'link', 'tag', 'calendar', 'star', 'heart',
    'bookmark', 'share', 'refresh', 'trash', 'check', 'x',
    'book-open', 'folder', 'check-square'
  ];

  constructor(app: App, options: RibbonSettingsModalOptions) {
    super(app);
    this.options = options;
    this.actions = JSON.parse(JSON.stringify(options.actions)); // Глубокое копирование
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // Заголовок
    contentEl.createEl("h2", { text: "Настройки ленточного меню" });

    // Описание
    contentEl.createEl("p", { 
      text: "Настройте значки и действия для ленточного меню. Перетаскивайте значки для изменения порядка.",
      cls: "setting-item-description"
    });

    // Список действий
    this.createActionsList(contentEl);

    // Кнопки
    this.createButtons(contentEl);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Создает список действий
   */
  private createActionsList(containerEl: HTMLElement): void {
    const actionsContainer = containerEl.createEl("div", { cls: "ribbon-actions-container" });

    this.actions.forEach((action, index) => {
      this.createActionSetting(actionsContainer, action, index);
    });

    // Кнопка добавления нового действия
    const addButton = new ButtonComponent(actionsContainer)
      .setButtonText("+ Добавить действие")
      .setClass("mod-cta")
      .onClick(() => this.addNewAction());
  }

  /**
   * Создает настройку для действия
   */
  private createActionSetting(containerEl: HTMLElement, action: RibbonAction, index: number): void {
    const actionContainer = containerEl.createEl("div", { cls: "ribbon-action-setting" });

    // Заголовок действия
    const header = actionContainer.createEl("div", { cls: "action-header" });
    header.createEl("h4", { text: `Действие ${index + 1}` });

    // Кнопка удаления
    const deleteButton = new ButtonComponent(header)
      .setButtonText("×")
      .setClass("mod-warning")
      .onClick(() => this.removeAction(index));

    // Основные настройки
    const settingsContainer = actionContainer.createEl("div", { cls: "action-settings" });

    // Название
    new Setting(settingsContainer)
      .setName("Название")
      .setDesc("Отображаемое название действия")
      .addText((text) => {
        text.setValue(action.name);
        text.onChange((value) => {
          action.name = value;
        });
      });

    // Иконка
    new Setting(settingsContainer)
      .setName("Иконка")
      .setDesc("Выберите иконку для действия")
      .addDropdown((dropdown) => {
        this.availableIcons.forEach(icon => {
          dropdown.addOption(icon, icon);
        });
        dropdown.setValue(action.icon);
        dropdown.onChange((value) => {
          action.icon = value;
          this.updateIconPreview(actionContainer, value);
        });
      });

    // Предварительный просмотр иконки
    this.createIconPreview(settingsContainer, action.icon);

    // Тип действия
    new Setting(settingsContainer)
      .setName("Тип действия")
      .setDesc("Выберите тип действия")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("format", "Форматирование")
          .addOption("api", "API")
          .addOption("create", "Создание")
          .addOption("custom", "Пользовательское");
        dropdown.setValue(action.action);
        dropdown.onChange((value) => {
          action.action = value as any;
          this.updateCustomActionField(settingsContainer, action);
        });
      });

    // Пользовательское действие
    if (action.action === 'custom') {
      this.createCustomActionField(settingsContainer, action);
    }

    // Порядок
    new Setting(settingsContainer)
      .setName("Порядок")
      .setDesc("Порядок отображения (меньше = выше)")
      .addSlider((slider) => {
        slider
          .setLimits(1, 10, 1)
          .setValue(action.order)
          .setDynamicTooltip()
          .onChange((value) => {
            action.order = value;
          });
      });

    // Включено/выключено
    new Setting(settingsContainer)
      .setName("Включено")
      .setDesc("Показывать ли это действие")
      .addToggle((toggle) => {
        toggle.setValue(action.enabled);
        toggle.onChange((value) => {
          action.enabled = value;
        });
      });

    // Разделитель
    if (index < this.actions.length - 1) {
      actionContainer.createEl("hr");
    }
  }

  /**
   * Создает предварительный просмотр иконки
   */
  private createIconPreview(containerEl: HTMLElement, iconName: string): void {
    const previewContainer = containerEl.createEl("div", { cls: "icon-preview-container" });
    
    const preview = previewContainer.createEl("div", { cls: "icon-preview" });
    preview.innerHTML = this.getIconSvg(iconName);
    
    previewContainer.createEl("span", { 
      text: `Предварительный просмотр: ${iconName}`,
      cls: "icon-preview-text"
    });
  }

  /**
   * Обновляет предварительный просмотр иконки
   */
  private updateIconPreview(containerEl: HTMLElement, iconName: string): void {
    const preview = containerEl.querySelector(".icon-preview");
    if (preview) {
      preview.innerHTML = this.getIconSvg(iconName);
    }
    
    const text = containerEl.querySelector(".icon-preview-text");
    if (text) {
      text.textContent = `Предварительный просмотр: ${iconName}`;
    }
  }

  /**
   * Создает поле для пользовательского действия
   */
  private createCustomActionField(containerEl: HTMLElement, action: RibbonAction): void {
    const existingField = containerEl.querySelector(".custom-action-field");
    if (existingField) return;

    const customField = containerEl.createEl("div", { cls: "custom-action-field" });
    
    new Setting(customField)
      .setName("Пользовательское действие")
      .setDesc("Идентификатор пользовательского действия")
      .addText((text) => {
        text.setValue(action.customAction || "");
        text.onChange((value) => {
          action.customAction = value;
        });
      });
  }

  /**
   * Обновляет поле пользовательского действия
   */
  private updateCustomActionField(containerEl: HTMLElement, action: RibbonAction): void {
    const existingField = containerEl.querySelector(".custom-action-field");
    if (existingField) {
      existingField.remove();
    }

    if (action.action === 'custom') {
      this.createCustomActionField(containerEl, action);
    }
  }

  /**
   * Добавляет новое действие
   */
  private addNewAction(): void {
    const newAction: RibbonAction = {
      id: `action-${Date.now()}`,
      name: "Новое действие",
      icon: "edit",
      action: "custom",
      enabled: true,
      order: this.actions.length + 1,
      customAction: "newAction"
    };

    this.actions.push(newAction);
    this.refreshActionsList();
  }

  /**
   * Удаляет действие
   */
  private removeAction(index: number): void {
    this.actions.splice(index, 1);
    
    // Обновляем порядок
    this.actions.forEach((action, i) => {
      action.order = i + 1;
    });
    
    this.refreshActionsList();
  }

  /**
   * Обновляет список действий
   */
  private refreshActionsList(): void {
    const actionsContainer = this.contentEl.querySelector(".ribbon-actions-container") as HTMLElement;
    if (actionsContainer) {
      actionsContainer.empty();
      this.createActionsList(actionsContainer);
    }
  }

  /**
   * Создает кнопки
   */
  private createButtons(containerEl: HTMLElement): void {
    const buttonContainer = containerEl.createEl("div", { cls: "button-container" });

    // Кнопка сохранения
    const saveButton = new ButtonComponent(buttonContainer)
      .setButtonText("Сохранить")
      .setClass("mod-cta")
      .onClick(() => this.saveSettings());

    // Кнопка отмены
    const cancelButton = new ButtonComponent(buttonContainer)
      .setButtonText("Отмена")
      .onClick(() => this.close());

    // Кнопка сброса
    const resetButton = new ButtonComponent(buttonContainer)
      .setButtonText("Сброс")
      .setClass("mod-warning")
      .onClick(() => this.resetToDefaults());
  }

  /**
   * Сохраняет настройки
   */
  private saveSettings(): void {
    try {
      // Валидация
      const validActions = this.actions.filter(action => {
        if (!action.name.trim()) {
          new Notice(`Действие ${action.id}: название не может быть пустым`);
          return false;
        }
        if (action.action === 'custom' && !action.customAction?.trim()) {
          new Notice(`Действие ${action.name}: укажите пользовательское действие`);
          return false;
        }
        return true;
      });

      if (validActions.length === 0) {
        new Notice("Должно быть хотя бы одно действие");
        return;
      }

      // Вызываем callback
      this.options.onSave(validActions);
      
      new Notice("Настройки сохранены");
      this.close();
      
    } catch (error) {
      console.error("Ошибка сохранения настроек:", error);
      new Notice("Ошибка сохранения настроек");
    }
  }

  /**
   * Сбрасывает настройки к значениям по умолчанию
   */
  private resetToDefaults(): void {
    this.actions = [
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
      }
    ];
    
    this.refreshActionsList();
    new Notice("Настройки сброшены к значениям по умолчанию");
  }

  /**
   * Получает SVG иконку по имени
   */
  private getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      'edit': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      'upload': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      'plus': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      'save': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17,21 17,13 7,13 7,21"></polyline><polyline points="7,3 7,8 15,8"></polyline></svg>',
      'download': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      'settings': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      'search': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
      'link': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
      'tag': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
      'calendar': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      'star': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon></svg>',
      'heart': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
      'bookmark': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>',
      'share': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>',
      'refresh': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"></polyline><polyline points="1,20 1,14 7,14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>',
      'trash': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path></svg>',
      'check': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>',
      'x': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
      'edit-3': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path><path d="M8 12h8"></path><path d="M8 16h6"></path></svg>',
      'file-plus': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
      'book-open': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
      'folder': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 13.07 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
      'check-square': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
    };

    // Проверяем, что iconName не undefined и возвращаем соответствующую иконку
    if (iconName && icons[iconName]) {
      return icons[iconName]!;
    }
    return icons['edit']!;
  }
}
