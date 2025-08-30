import { App, Modal, Setting, Notice, TFile } from "obsidian";
import { MaskParser, ParsedMask } from "../utils/mask-parser";
import { FileManager } from "../utils/file-manager";

export class MaskBuilderModal extends Modal {
  private app: App;
  private fileManager: FileManager;
  private onSubmit: (mask: ParsedMask, content: string) => void;

  // Поля формы
  private entityInput: HTMLInputElement;
  private areasInput: HTMLInputElement;
  private statusInput: HTMLSelectElement;
  private accessInput: HTMLSelectElement;
  private formatInput: HTMLSelectElement;
  private referencesInput: HTMLInputElement;
  private anchorInput: HTMLInputElement;
  private contentInput: HTMLTextAreaElement;

  constructor(app: App, fileManager: FileManager, onSubmit: (mask: ParsedMask, content: string) => void) {
    super(app);
    this.app = app;
    this.fileManager = fileManager;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // Заголовок
    contentEl.createEl("h2", { text: "Mask Builder" });

    // Форма создания маски
    this.createMaskForm(contentEl);

    // Кнопки
    this.createButtons(contentEl);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  private createMaskForm(containerEl: HTMLElement): void {
    // Entity (сущность)
    new Setting(containerEl)
      .setName("Сущность")
      .setDesc("Название сущности (например: NOTE, DEC, ADR)")
      .addText((text) => {
        this.entityInput = text.inputEl;
        text.setPlaceholder("NOTE");
        text.onChange(() => this.updatePreview());
      });

    // Areas (области)
    new Setting(containerEl)
      .setName("Области")
      .setDesc("Области знаний через точку (например: ENG.DEV.MED)")
      .addText((text) => {
        this.areasInput = text.inputEl;
        text.setPlaceholder("ENG.DEV.MED");
        text.onChange(() => this.updatePreview());
      });

    // Status (статус)
    new Setting(containerEl)
      .setName("Статус")
      .setDesc("Статус заметки")
      .addDropdown((dropdown) => {
        this.statusInput = dropdown.selectEl;
        dropdown
          .addOption("", "Не указан")
          .addOption("DRA", "Draft - Черновик")
          .addOption("AC", "Active - Активный")
          .addOption("PAU", "Paused - Приостановлен")
          .addOption("DON", "Done - Завершен")
          .addOption("DEP", "Deprecated - Устарел");
        dropdown.onChange(() => this.updatePreview());
      });

    // Access (доступ)
    new Setting(containerEl)
      .setName("Доступ")
      .setDesc("Уровень доступа")
      .addDropdown((dropdown) => {
        this.accessInput = dropdown.selectEl;
        dropdown
          .addOption("", "Не указан")
          .addOption("PUB", "Public - Публичный")
          .addOption("INT", "Internal - Внутренний")
          .addOption("PRV", "Private - Приватный");
        dropdown.onChange(() => this.updatePreview());
      });

    // Format (формат)
    new Setting(containerEl)
      .setName("Формат")
      .setDesc("Формат файла")
      .addDropdown((dropdown) => {
        this.formatInput = dropdown.selectEl;
        dropdown
          .addOption("MD", "Markdown")
          .addOption("GLB", "3D Model")
          .addOption("CAD", "CAD Files")
          .addOption("PDF", "PDF")
          .addOption("PNG", "PNG")
          .addOption("SRC", "Source Code");
        dropdown.onChange(() => this.updatePreview());
      });

    // References (ссылки)
    new Setting(containerEl)
      .setName("Ссылки")
      .setDesc("Ссылки на другие документы через запятую")
      .addText((text) => {
        this.referencesInput = text.inputEl;
        text.setPlaceholder("LAW-ISO17025,STD-EN123");
        text.onChange(() => this.updatePreview());
      });

    // Anchor (якорь)
    new Setting(containerEl)
      .setName("Якорь")
      .setDesc("Проект или категория (например: PROJ-HYDROPILOT, CAT-KB)")
      .addText((text) => {
        this.anchorInput = text.inputEl;
        text.setPlaceholder("PROJ-HYDROPILOT");
        text.onChange(() => this.updatePreview());
      });

    // Content (содержимое)
    new Setting(containerEl)
      .setName("Содержимое")
      .setDesc("Содержимое заметки")
      .addTextArea((textarea) => {
        this.contentInput = textarea.inputEl;
        textarea.setPlaceholder("Введите содержимое заметки...");
        textarea.inputEl.rows = 5;
      });

    // Preview (предварительный просмотр)
    const previewContainer = containerEl.createEl("div", { cls: "mask-preview" });
    previewContainer.createEl("h3", { text: "Предварительный просмотр" });
    const previewText = previewContainer.createEl("div", { cls: "preview-text" });
    previewText.setText("Введите данные для предварительного просмотра");
  }

  private createButtons(containerEl: HTMLElement): void {
    const buttonContainer = containerEl.createEl("div", { cls: "button-container" });

    // Кнопка создания
    const createButton = buttonContainer.createEl("button", {
      text: "Создать заметку",
      cls: "mod-cta"
    });
    createButton.addEventListener("click", () => this.createNote());

    // Кнопка отмены
    const cancelButton = buttonContainer.createEl("button", {
      text: "Отмена"
    });
    cancelButton.addEventListener("click", () => this.close());
  }

  private updatePreview(): void {
    const previewText = this.modalEl.querySelector(".preview-text");
    if (!previewText) return;

    try {
      const mask = this.buildMaskFromForm();
      if (mask) {
        const fileName = MaskParser.generateFileName(mask);
        const filePath = MaskParser.generateFilePath(mask, "");
        previewText.setText(`Имя файла: ${fileName}\nПуть: ${filePath}`);
      } else {
        previewText.setText("Введите корректные данные для предварительного просмотра");
      }
    } catch (error) {
      previewText.setText("Ошибка в данных маски");
    }
  }

  private buildMaskFromForm(): ParsedMask | null {
    const entity = this.entityInput.value.trim();
    const areas = this.areasInput.value.trim().split('.').filter(a => a);
    const status = this.statusInput.value || undefined;
    const access = this.accessInput.value || undefined;
    const format = this.formatInput.value || undefined;
    const references = this.referencesInput.value.trim().split(',').filter(r => r);
    const anchor = this.anchorInput.value.trim();

    if (!entity || !anchor) {
      return null;
    }

    return {
      entity,
      areas,
      status,
      access,
      format,
      references: references.length > 0 ? references : undefined,
      anchor
    };
  }

  private async createNote(): Promise<void> {
    try {
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
    } catch (error) {
      console.error("Ошибка создания заметки:", error);
      new Notice("Ошибка создания заметки. Проверьте консоль.");
    }
  }
}