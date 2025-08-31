import { App, TFile, TFolder, normalizePath, Notice } from "obsidian";
import { ParsedMask } from "./mask-parser";

export class FileManager {
  private app: App;
  private cache = new Map<string, any>();

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Безопасно создает файл с маской
   */
  async createFileFromMask(
    mask: ParsedMask, 
    content: string = "", 
    template?: string
  ): Promise<TFile | null> {
    try {
      // Генерируем имя файла и путь
      const fileName = this.generateFileName(mask);
      const filePath = this.generateFilePath(mask);
      const fullPath = `${filePath}${fileName}.md`;
      
      // Проверяем существование файла
      const existingFile = this.app.vault.getAbstractFileByPath(fullPath);
      if (existingFile) {
        new Notice(`Файл ${fileName} уже существует`);
        return null;
      }

      // Создаем папки если нужно
      await this.ensureFolderExists(filePath);

      // Подготавливаем контент
      const finalContent = await this.prepareContent(content, template, mask);

      // Создаем файл
      const file = await this.app.vault.create(fullPath, finalContent);
      
      new Notice(`Создан файл: ${fileName}`);
      return file;
    } catch (error) {
      console.error("Ошибка создания файла:", error);
      new Notice("Ошибка создания файла. Проверьте консоль.");
      return null;
    }
  }

  /**
   * Безопасно перемещает файл на основе маски
   */
  async moveFileByMask(file: TFile, mask: ParsedMask): Promise<boolean> {
    try {
      const newPath = this.generateFilePath(mask);
      const newFileName = this.generateFileName(mask);
      const fullNewPath = `${newPath}${newFileName}.md`;

      // Проверяем, не существует ли уже файл по новому пути
      const existingFile = this.app.vault.getAbstractFileByPath(fullNewPath);
      if (existingFile) {
        new Notice(`Файл ${newFileName} уже существует в целевой папке`);
        return false;
      }

      // Создаем папки если нужно
      await this.ensureFolderExists(newPath);

      // Перемещаем файл
      await this.app.fileManager.renameFile(file, fullNewPath);
      
      new Notice(`Файл перемещен: ${newFileName}`);
      return true;
    } catch (error) {
      console.error("Ошибка перемещения файла:", error);
      new Notice("Ошибка перемещения файла. Проверьте консоль.");
      return false;
    }
  }

  /**
   * Обновляет фронтматтер файла на основе маски
   */
  async updateFrontmatter(file: TFile, mask: ParsedMask): Promise<boolean> {
    try {
      const content = await this.app.vault.read(file);
      const frontmatter = this.generateFrontmatter(mask);
      
      // Обновляем или добавляем фронтматтер
      const updatedContent = this.updateContentFrontmatter(content, frontmatter);
      
      await this.app.vault.modify(file, updatedContent);
      return true;
    } catch (error) {
      console.error("Ошибка обновления фронтматтера:", error);
      return false;
    }
  }

  /**
   * Генерирует имя файла на основе маски
   */
  private generateFileName(mask: ParsedMask): string {
    const parts = [mask.entity];
    
    if (mask.areas && mask.areas.length > 0) {
      parts.push(...mask.areas);
    }
    
    if (mask.status) {
      parts.push(mask.status);
    }
    
    if (mask.access) {
      parts.push(mask.access);
    }
    
    if (mask.format) {
      parts.push(mask.format);
    }
    
    if (mask.references && mask.references.length > 0) {
      parts.push(`+${mask.references.join(',')}`);
    }
    
    if (mask.anchor) {
      parts.push(`@${mask.anchor}`);
    }
    
    return parts.join('.');
  }

  /**
   * Генерирует путь для файла
   */
  private generateFilePath(mask: ParsedMask): string {
    if (!mask.anchor) {
      return `0_INBOX/`;
    }
    
    const anchorType = this.getAnchorType(mask.anchor);
    
    if (anchorType === "project") {
      return `1_PROJECTS/${mask.anchor}/notes/`;
    } else if (anchorType === "category") {
      const isKB = mask.areas && mask.areas.includes("KB") || mask.anchor === "CAT-KB";
      if (isKB) {
        return `2_CATEGORIES/${mask.anchor}/notes/`;
      }
      return `2_CATEGORIES/${mask.anchor}/notes/`;
    }
    
    return `0_INBOX/`;
  }

  /**
   * Определяет тип якоря
   */
  private getAnchorType(anchor: string): "project" | "category" | "unknown" {
    if (anchor.startsWith("PROJ-")) {
      return "project";
    } else if (anchor.startsWith("CAT-")) {
      return "category";
    }
    return "unknown";
  }

  /**
   * Создает папки если они не существуют
   */
  private async ensureFolderExists(filePath: string): Promise<void> {
    const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
    const normalizedPath = normalizePath(folderPath);
    
    const folder = this.app.vault.getAbstractFileByPath(normalizedPath);
    if (!folder || !(folder instanceof TFolder)) {
      await this.app.vault.createFolder(normalizedPath);
    }
  }

  /**
   * Подготавливает контент файла
   */
  private async prepareContent(content: string, template?: string, mask?: ParsedMask): Promise<string> {
    let finalContent = content;
    
    // Если есть шаблон, загружаем его
    if (template) {
      const templateFile = this.app.vault.getAbstractFileByPath(template);
      if (templateFile instanceof TFile) {
        const templateContent = await this.app.vault.read(templateFile);
        finalContent = templateContent + "\n\n" + content;
      }
    }
    
    // Добавляем фронтматтер если есть маска
    if (mask) {
      const frontmatter = this.generateFrontmatter(mask);
      finalContent = frontmatter + "\n\n" + finalContent;
    }
    
    return finalContent;
  }

  /**
   * Генерирует фронтматтер на основе маски
   */
  private generateFrontmatter(mask: ParsedMask): string {
    const frontmatter: any = {
      created: new Date().toISOString(),
      mask: this.generateFileName(mask),
      entity: mask.entity,
      areas: mask.areas,
      anchor: mask.anchor,
    };

    if (mask.status) frontmatter.status = mask.status;
    if (mask.access) frontmatter.access = mask.access;
    if (mask.format) frontmatter.format = mask.format;
    if (mask.references) frontmatter.references = mask.references;
    
    // Специальная обработка для KB заметок
    if (mask.areas.includes("KB") || mask.anchor === "CAT-KB") {
      frontmatter.kb = true;
    }

    return `---\n${Object.entries(frontmatter)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n')}\n---`;
  }

  /**
   * Обновляет фронтматтер в существующем контенте
   */
  private updateContentFrontmatter(content: string, newFrontmatter: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      // Заменяем существующий фронтматтер
      return content.replace(frontmatterRegex, newFrontmatter + '\n');
    } else {
      // Добавляем новый фронтматтер в начало
      return newFrontmatter + '\n\n' + content;
    }
  }

  /**
   * Очищает кэш
   */
  clearCache(): void {
    this.cache.clear();
  }
}