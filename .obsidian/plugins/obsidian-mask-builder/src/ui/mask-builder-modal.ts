import { App, Modal, Notice, TFile } from "obsidian";
import { ParsedMask } from "../utils/mask-parser";
import { FileManager } from "../utils/file-manager";
import { EntityFinder, EntitySuggestion } from "../utils/entity-finder";
import { getAnalytics } from "../utils/analytics";
import { errorHandler, ErrorCategory, ErrorSeverity } from "../utils/error-handler";
import { MaskParser } from "../utils/mask-parser";

export class MaskBuilderModal extends Modal {
  private fileManager: FileManager;
  private entityFinder: EntityFinder;
  private onSubmit: (mask: ParsedMask, content: string) => void;

  // Поля формы
  private entityInput!: HTMLInputElement;
  private areasInput!: HTMLInputElement;
  private statusInput!: HTMLSelectElement;
  private accessInput!: HTMLSelectElement;
  private formatInput!: HTMLSelectElement;
  private referencesInput!: HTMLInputElement;
  private anchorInput!: HTMLInputElement;
  private contentInput!: HTMLTextAreaElement;

  constructor(app: App, fileManager: FileManager, onSubmit: (mask: ParsedMask, content: string) => void) {
    super(app);
    this.fileManager = fileManager;
    this.entityFinder = new EntityFinder(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("mask-builder-modal");

    this.createForm();
    this.setupAutocomplete(this.areasInput, 'area');
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.removeClass("mask-builder-modal");
  }

  private createForm(): void {
    const { contentEl } = this;

    // Заголовок
    contentEl.createEl("h2", { text: "Создать заметку по маске" });

    // Форма
    const form = contentEl.createEl("form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Области знаний
    const areasGroup = form.createEl("div", { cls: "form-group" });
    areasGroup.createEl("label", { 
      text: "Области знаний через точку (например: ENG.DEV.MED)",
      attr: { for: "areas" }
    });
    this.areasInput = areasGroup.createEl("input", {
      type: "text",
      value: "ENG.DEV.MED"
    });

    // Статус
    const statusGroup = form.createEl("div", { cls: "form-group" });
    statusGroup.createEl("label", { 
      text: "Статус",
      attr: { for: "status" }
    });
    statusGroup.createEl("small", { text: "Статус заметки" });
    this.statusInput = statusGroup.createEl("select");
    this.statusInput.createEl("option", { text: "Не указан", value: "" });
    this.statusInput.createEl("option", { text: "Черновик", value: "DRA" });
    this.statusInput.createEl("option", { text: "В работе", value: "AC" });
    this.statusInput.createEl("option", { text: "Приостановлено", value: "PAU" });
    this.statusInput.createEl("option", { text: "Завершено", value: "DON" });
    this.statusInput.createEl("option", { text: "Отложено", value: "DEP" });

    // Доступ
    const accessGroup = form.createEl("div", { cls: "form-group" });
    accessGroup.createEl("label", { 
      text: "Доступ",
      attr: { for: "access" }
    });
    accessGroup.createEl("small", { text: "Уровень доступа" });
    this.accessInput = accessGroup.createEl("select");
    this.accessInput.createEl("option", { text: "Не указан", value: "" });
    this.accessInput.createEl("option", { text: "Публичный", value: "PUB" });
    this.accessInput.createEl("option", { text: "Внутренний", value: "INT" });
    this.accessInput.createEl("option", { text: "Приватный", value: "PRV" });

    // Формат
    const formatGroup = form.createEl("div", { cls: "form-group" });
    formatGroup.createEl("label", { 
      text: "Формат",
      attr: { for: "format" }
    });
    formatGroup.createEl("small", { text: "Формат файла" });
    this.formatInput = formatGroup.createEl("select");
    this.formatInput.createEl("option", { text: "Не указан", value: "" });
    this.formatInput.createEl("option", { text: "Markdown", value: "MD" });
    this.formatInput.createEl("option", { text: "Глобус", value: "GLB" });
    this.formatInput.createEl("option", { text: "Markdown", value: "MD" });
    this.formatInput.createEl("option", { text: "Глобус", value: "GLB" });
    this.formatInput.createEl("option", { text: "CAD", value: "CAD" });
    this.formatInput.createEl("option", { text: "PDF", value: "PDF" });
    this.formatInput.createEl("option", { text: "PNG", value: "PNG" });
    this.formatInput.createEl("option", { text: "Исходный код", value: "SRC" });

    // Ссылки
    const referencesGroup = form.createEl("div", { cls: "form-group" });
    referencesGroup.createEl("label", { 
      text: "Ссылки",
      attr: { for: "references" }
    });
    referencesGroup.createEl("small", { text: "Связанные ссылки через запятую" });
    this.referencesInput = referencesGroup.createEl("input", {
      type: "text",
      value: "ref1, ref2, ref3"
    });

    // Якорь
    const anchorGroup = form.createEl("div", { cls: "form-group" });
    anchorGroup.createEl("label", { 
      text: "Якорь",
      attr: { for: "anchor" }
    });
    anchorGroup.createEl("small", { text: "Якорь для категоризации (например: CAT-KB, PROJ-MAIN)" });
    this.anchorInput = anchorGroup.createEl("input", {
      type: "text",
      value: "CAT-KB"
    });

    // Содержание
    const contentGroup = form.createEl("div", { cls: "form-group" });
    contentGroup.createEl("label", { 
      text: "Содержание",
      attr: { for: "content" }
    });
    contentGroup.createEl("small", { text: "Содержание заметки" });
    this.contentInput = contentGroup.createEl("textarea", {
      placeholder: "Введите содержание заметки..."
    });

    // Предварительный просмотр
    const previewGroup = form.createEl("div", { cls: "form-group" });
    previewGroup.createEl("h3", { text: "Предварительный просмотр" });
    previewGroup.createEl("p", { text: "Введите данные для предварительного просмотра" });

    // Кнопки
    const buttonGroup = form.createEl("div", { cls: "form-actions" });
    buttonGroup.createEl("button", {
      type: "submit",
      text: "Создать заметку",
      cls: "btn btn-primary"
    });
    buttonGroup.createEl("button", {
      type: "button",
      text: "Отмена",
      cls: "btn btn-secondary",
      attr: { onclick: "this.closest('.modal').close()" }
    });
  }

  private handleSubmit(): void {
    const mask = this.buildMaskFromForm();
    if (!mask) {
      new Notice("Заполните обязательные поля: Сущность и Якорь");
      return;
    }

    // Валидация маски
    const validation = MaskParser.validate(mask);
    if (!validation.valid) {
      new Notice(`Ошибки в маске: ${validation.errors.join(', ')}`);
      return;
    }

    const content = this.contentInput.value;

    // Вызываем callback
    this.onSubmit(mask, content);
    
    // Закрываем модальное окно
    this.close();
    
    new Notice("Заметка создана успешно!");
  }

  private buildMaskFromForm(): ParsedMask | null {
    const entity = this.entityInput.value.trim();
    const areas = this.areasInput.value.trim().split('.').filter(area => area.trim());
    const status = this.statusInput.value || undefined;
    const access = this.accessInput.value || undefined;
    const format = this.formatInput.value || undefined;
    const references = this.referencesInput.value.trim().split(',').filter(ref => ref.trim());
    const anchor = this.anchorInput.value.trim();

    if (!entity || !anchor) {
      return null;
    }

    return {
      entity,
      areas,
      status: status ?? '',
      access: access ?? '',
      format: format ?? '',
      references: references.length > 0 ? references : [],
      anchor
    };
  }

  /**
   * Настраивает автодополнение для текстового поля
   */
  private setupAutocomplete(input: HTMLInputElement, type: 'entity' | 'area' | 'anchor'): void {
    let suggestions: EntitySuggestion[] = [];
    let currentIndex = -1;
    let dropdown: HTMLDivElement | null = null;

    const showSuggestions = async () => {
      const query = input.value;
      if (query.length < 1) {
        hideSuggestions();
        return;
      }

      try {
        switch (type) {
          case 'entity':
            suggestions = await this.entityFinder.searchEntities(query);
            break;
          case 'area':
            suggestions = await this.entityFinder.searchAreas(query);
            break;
          case 'anchor':
            suggestions = await this.entityFinder.searchAnchors(query);
            break;
        }

        if (suggestions.length === 0) {
          hideSuggestions();
          return;
        }

        showDropdown();
      } catch (error) {
        console.error('Ошибка поиска предложений:', error);
      }
    };

    const showDropdown = () => {
      hideSuggestions();

      dropdown = document.createElement('div');
      dropdown.className = 'mask-builder-suggestions';
      dropdown.style.cssText = `
        position: absolute;
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        width: ${input.offsetWidth}px;
      `;

      suggestions.forEach((suggestion, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.style.cssText = `
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid var(--background-modifier-border);
        `;
        item.innerHTML = `
          <div style="font-weight: bold;">${suggestion.value}</div>
          <div style="font-size: 0.8em; color: var(--text-muted);">
            ${suggestion.label} (${suggestion.count})
          </div>
        `;

        item.addEventListener('click', () => {
          input.value = suggestion.value;
          input.dispatchEvent(new Event('input'));
          hideSuggestions();
        });

        item.addEventListener('mouseenter', () => {
          currentIndex = index;
          updateSelection();
        });

        if (dropdown) {
          dropdown.appendChild(item);
        }
      });

      // Позиционируем dropdown
      if (dropdown) {
        const rect = input.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;

        document.body.appendChild(dropdown);
      }
    };

    const hideSuggestions = () => {
      if (dropdown) {
        dropdown.remove();
        dropdown = null;
      }
      currentIndex = -1;
    };

    const updateSelection = () => {
      const items = dropdown?.querySelectorAll('.suggestion-item');
      if (items && dropdown) {
        items.forEach((item, index) => {
          const itemElement = item as HTMLElement;
          if (index === currentIndex) {
            itemElement.style.backgroundColor = 'var(--background-modifier-hover)';
          } else {
            itemElement.style.backgroundColor = '';
          }
        });
      }
    };

    // Обработчики событий
    input.addEventListener('input', showSuggestions);
    input.addEventListener('focus', showSuggestions);
    input.addEventListener('blur', () => {
      // Задержка для обработки клика по предложению
      setTimeout(hideSuggestions, 200);
    });

    input.addEventListener('keydown', (e) => {
      if (!dropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          currentIndex = Math.min(currentIndex + 1, suggestions.length - 1);
          updateSelection();
          break;
        case 'ArrowUp':
          e.preventDefault();
          currentIndex = Math.max(currentIndex - 1, -1);
          updateSelection();
          break;
        case 'Enter':
          e.preventDefault();
          if (currentIndex >= 0 && suggestions[currentIndex]) {
            const suggestion = suggestions[currentIndex];
            if (suggestion && suggestion.value) {
              input.value = suggestion.value;
              input.dispatchEvent(new Event('input'));
              hideSuggestions();
            }
          }
          break;
        case 'Escape':
          hideSuggestions();
          break;
      }
    });
  }

  /**
   * Заполняет dropdown значениями из EntityFinder
   */
  private async populateDropdown(dropdown: any, type: 'status' | 'access' | 'format'): Promise<void> {
    try {
      let suggestions: EntitySuggestion[] = [];
      
      switch (type) {
        case 'status':
          suggestions = await this.entityFinder.getStatusSuggestions();
          break;
        case 'access':
          suggestions = await this.entityFinder.getAccessSuggestions();
          break;
        case 'format':
          suggestions = await this.entityFinder.getFormatSuggestions();
          break;
      }

      // Добавляем пустое значение
      dropdown.addOption("", "Не указан");

      // Добавляем предложения
      suggestions.forEach(suggestion => {
        dropdown.addOption(suggestion.value, `${suggestion.value} - ${suggestion.label}`);
      });
    } catch (error) {
      console.error(`Ошибка загрузки предложений для ${type}:`, error);
      
      // Fallback к стандартным значениям
      const fallbackValues = {
        status: ['DRA', 'AC', 'PAU', 'DON', 'DEP'],
        access: ['PUB', 'INT', 'PRV'],
        format: ['MD', 'TXT', 'DOC']
      };

      fallbackValues[type].forEach(value => {
        dropdown.addOption(value, value);
      });
    }
  }
}