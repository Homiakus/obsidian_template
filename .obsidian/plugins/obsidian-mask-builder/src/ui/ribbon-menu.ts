import { App, Notice } from "obsidian";
import { RibbonAction, AnyRibbonAction } from "../settings";
import { RibbonSettingsModal } from "./ribbon-settings-modal";

export interface RibbonMenuOptions {
  position: 'top' | 'bottom';
  actions: AnyRibbonAction[];
  onAction: (action: AnyRibbonAction, context: any) => void;
  onSettingsChange?: (actions: AnyRibbonAction[]) => void;
}

export class RibbonMenu {
  private app: App;
  private container!: HTMLElement;
  private options: RibbonMenuOptions;
  private actionHandlers: Map<string, (context: any) => void>;

  constructor(app: App, options: RibbonMenuOptions) {
    this.app = app;
    this.options = options;
    this.actionHandlers = new Map();
    this.setupDefaultHandlers();
  }

  /**
   * Создает ленточное меню
   */
  create(container: HTMLElement): void {
    this.container = container;
    
    const ribbonContainer = container.createEl("div", {
      cls: "mask-builder-ribbon-menu"
    });

    // Заголовок
    const header = ribbonContainer.createEl("div", {
      cls: "ribbon-header"
    });
    header.createEl("h4", { text: "Быстрые действия" });

    // Контейнер для значков
    const iconsContainer = ribbonContainer.createEl("div", {
      cls: "ribbon-icons"
    });

    // Сортируем действия по порядку
    const sortedActions = [...this.options.actions]
      .filter(action => action.enabled)
      .sort((a, b) => a.order - b.order);

    // Создаем значки для каждого действия
    sortedActions.forEach(action => {
      this.createActionIcon(iconsContainer, action);
    });

    // Добавляем кнопку настроек
    this.createSettingsButton(ribbonContainer);
  }

  /**
   * Создает значок действия
   */
  private createActionIcon(container: HTMLElement, action: AnyRibbonAction): void {
    console.log('Создаем значок для действия:', action.id, action.name, action.icon);
    
    const iconContainer = container.createEl("div", {
      cls: "ribbon-action-icon"
    });
    console.log('Создан iconContainer:', iconContainer);

    // Значок
    const icon = iconContainer.createEl("div", {
      cls: "ribbon-icon"
    });
    const iconSvg = this.getIconSvg(action.icon);
    console.log('SVG для иконки', action.icon, ':', iconSvg);
    icon.innerHTML = iconSvg;

    // Подсказка
    iconContainer.setAttribute("title", action.name);

    // Обработчик клика
    iconContainer.addEventListener("click", () => {
      console.log('Клик по значку действия:', action.id);
      this.handleAction(action);
    });

    // Добавляем hover эффект
    iconContainer.addEventListener("mouseenter", () => {
      iconContainer.addClass("hover");
    });

    iconContainer.addEventListener("mouseleave", () => {
      iconContainer.removeClass("hover");
    });
    
    console.log('Значок действия создан успешно:', action.id);
  }

  /**
   * Создает кнопку настроек
   */
  private createSettingsButton(container: HTMLElement): void {
    const settingsButton = container.createEl("div", {
      cls: "ribbon-settings-button"
    });

    settingsButton.innerHTML = this.getIconSvg("settings");
    settingsButton.setAttribute("title", "Настройки ленточного меню");

    settingsButton.addEventListener("click", () => {
      this.showSettingsModal();
    });
  }

  /**
   * Обрабатывает действие
   */
  private handleAction(action: AnyRibbonAction): void {
    try {
      const context = this.getActionContext();
      
      // Вызываем пользовательский обработчик
      this.options.onAction(action, context);
      
      // Вызываем встроенный обработчик если есть
      const handler = this.actionHandlers.get(action.action);
      if (handler) {
        handler(context);
      }
      
      // Показываем уведомление
      new Notice(`Выполнено: ${action.name}`);
      
    } catch (error) {
      this.handleError(error, 'handleAction');
    }
  }

  /**
   * Получает контекст для действия
   */
  private getActionContext(): any {
    // Здесь можно получить текущий контекст формы
    return {
      timestamp: new Date().toISOString(),
      plugin: 'mask-builder',
      version: '1.0.0'
    };
  }

  /**
   * Настраивает встроенные обработчики действий
   */
  private setupDefaultHandlers(): void {
    // Обработчик форматирования
    this.actionHandlers.set('format', (context) => {
      this.handleFormatAction(context);
    });

    // Обработчик API
    this.actionHandlers.set('api', (context) => {
      this.handleApiAction(context);
    });

    // Обработчик создания
    this.actionHandlers.set('create', (context) => {
      this.handleCreateAction(context);
    });
  }

  /**
   * Обработчик действия форматирования
   */
  private handleFormatAction(context: any): void {
    console.log('Форматирование заметки:', context);
    // Здесь можно добавить логику форматирования
  }

  /**
   * Обработчик действия API
   */
  private handleApiAction(context: any): void {
    console.log('Отправка в API:', context);
    // Здесь можно добавить логику отправки в API
  }

  /**
   * Обработчик действия создания
   */
  private handleCreateAction(context: any): void {
    console.log('Создание заметки:', context);
    // Здесь можно добавить логику создания
  }

  /**
   * Показывает модальное окно настроек
   */
  private showSettingsModal(): void {
    const settingsModal = new RibbonSettingsModal(this.app, {
      actions: this.options.actions,
      onSave: (actions: AnyRibbonAction[]) => {
        this.options.actions = actions;
        
        // Обновляем меню
        this.updateActions(actions);
        
        // Уведомляем об изменении настроек
        if (this.options.onSettingsChange) {
          this.options.onSettingsChange(actions);
        }
        
        new Notice("Настройки ленточного меню обновлены");
      }
    });
    
    settingsModal.open();
  }

  /**
   * Получает SVG иконку по имени
   */
  private getIconSvg(iconName: string): string {
    const icons: Record<string, string> = {
      'edit': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
      'edit-3': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path><path d="M8 12h8"></path><path d="M8 16h6"></path></svg>',
      'upload': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      'plus': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
      'file-plus': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
      'save': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17,21 17,13 7,13 7,21"></polyline><polyline points="7,3 7,8 15,8"></polyline></svg>',
      'download': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
      'settings': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      'search': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
      'link': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
      'tag': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
      'calendar': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
      'book-open': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
      'folder': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 13.07 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path></svg>',
      'check-square': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
    };

    const iconSvg = icons[iconName];
    if (iconSvg) {
      console.log('Найдена SVG иконка для', iconName);
      return iconSvg;
    } else {
      console.warn('SVG иконка не найдена для', iconName, 'доступные иконки:', Object.keys(icons));
      return icons['edit'] || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }
  }

  /**
   * Обновляет действия в меню
   */
  updateActions(actions: AnyRibbonAction[]): void {
    this.options.actions = actions;
    if (this.container) {
      this.container.empty();
      this.create(this.container);
    }
  }

  /**
   * Показывает/скрывает меню
   */
  setVisible(visible: boolean): void {
    if (this.container) {
      this.container.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Уничтожает меню
   */
  destroy(): void {
    if (this.container) {
      this.container.empty();
    }
    this.actionHandlers.clear();
  }

  private handleError(error: unknown, context: string): void {
    console.error(`Ошибка в RibbonMenu (${context}):`, error);
    
    if (error instanceof Error) {
      new Notice(`Ошибка: ${error.message}`);
    } else {
      new Notice(`Ошибка: ${String(error)}`);
    }
  }
}
