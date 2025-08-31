import { z } from "zod";

// Схемы для валидации компонентов маски
const AreaSchema = z.enum([
  "LLM", "MED", "ENG", "HYP", "HLTH", "ACC", "KB", 
  "LNX", "WIN", "TRIZ", "SYSAN", "DEV", "ELEC", "CNMKT"
]);

const StatusSchema = z.enum(["DRA", "AC", "PAU", "DON", "DEP"]);

const AccessSchema = z.enum(["PUB", "INT", "PRV"]);

const FormatSchema = z.enum(["MD", "GLB", "CAD", "PDF", "PNG", "SRC"]);

// Схема полной маски
export const MaskSchema = z.object({
  entity: z.string().min(1).max(50),
  areas: z.array(AreaSchema).min(1).max(5),
  status: StatusSchema.optional(),
  access: AccessSchema.optional(),
  format: FormatSchema.optional(),
  references: z.array(z.string()).optional(),
  anchor: z.string().min(1).max(100),
});

export type Mask = z.infer<typeof MaskSchema>;

// Регулярное выражение для парсинга масок
const MASK_REGEX = /^([A-Z]+(?:-[A-Z]+)*)(?:\.([A-Z]{2,4}))?(?:\.([A-Z]{2,4}))?(?:\.([A-Z]{2,4}))?(?:\.([A-Z]{2,4}))?(?:\.([A-Z]{2,4}))?(?:\.([A-Z]{2,4}))?(?:\+([A-Z-]+(?:,[A-Z-]+)*))?@([A-Z-]+)$/;

export interface ParsedMask {
  entity: string;
  areas: string[];
  status?: string;
  access?: string;
  format?: string;
  references?: string[];
  anchor: string;
}

export class MaskParser {
  /**
   * Парсит строку маски в структурированный объект
   */
  static parse(maskString: string): ParsedMask | null {
    const match = maskString.match(MASK_REGEX);
    if (!match) return null;

    const [, entity, ...parts] = match;
    const areas: string[] = [];
    let status: string | undefined;
    let access: string | undefined;
    let format: string | undefined;
    let references: string[] | undefined;
    let anchor: string | undefined;

    // Обрабатываем части маски
    for (let i = 0; i < parts.length - 2; i++) {
      const part = parts[i];
      if (!part) continue;

      if (AreaSchema.safeParse(part).success) {
        areas.push(part);
      } else if (StatusSchema.safeParse(part).success) {
        status = part;
      } else if (AccessSchema.safeParse(part).success) {
        access = part;
      } else if (FormatSchema.safeParse(part).success) {
        format = part;
      }
    }

    // Обрабатываем ссылки и якорь
    if (parts.length >= 2) {
      const refPart = parts[parts.length - 2];
      if (refPart) {
        references = refPart.split(',');
      }
    }
    anchor = parts[parts.length - 1] ?? '';

    return {
      entity: entity ?? '',
      areas,
      status: status ?? '',
      access: access ?? '',
      format: format ?? '',
      references: references ?? [],
      anchor: anchor ?? '',
    };
  }

  /**
   * Валидирует маску согласно правилам CTM
   */
  static validate(mask: ParsedMask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Проверяем количество областей
    if (mask.areas.length > 5) {
      errors.push("Маска может содержать не более 5 областей");
    }

    // Проверяем уникальность областей
    const uniqueAreas = new Set(mask.areas);
    if (uniqueAreas.size !== mask.areas.length) {
      errors.push("Области в маске должны быть уникальными");
    }

    // Проверяем наличие якоря
    if (!mask.anchor) {
      errors.push("Маска должна содержать якорь (проект или категорию)");
    }

    // Проверяем длину имени файла
    const fileName = this.generateFileName(mask);
    if (fileName.length > 140) {
      errors.push("Длина имени файла не должна превышать 140 символов");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Генерирует имя файла на основе маски
   */
  static generateFileName(mask: ParsedMask): string {
    const parts = [mask.entity];
    
    // Добавляем области
    if (mask.areas.length > 0) {
      parts.push(...mask.areas);
    }
    
    // Добавляем статус
    if (mask.status) {
      parts.push(mask.status);
    }
    
    // Добавляем доступ
    if (mask.access) {
      parts.push(mask.access);
    }
    
    // Добавляем формат
    if (mask.format) {
      parts.push(mask.format);
    }
    
    // Добавляем ссылки
    if (mask.references && mask.references.length > 0) {
      parts.push(`+${mask.references.join(',')}`);
    }
    
    // Добавляем якорь
    parts.push(`@${mask.anchor}`);
    
    return parts.join('.');
  }

  /**
   * Определяет тип якоря (проект или категория)
   */
  static getAnchorType(anchor: string): "project" | "category" | "unknown" {
    if (anchor.startsWith("PROJ-")) {
      return "project";
    } else if (anchor.startsWith("CAT-")) {
      return "category";
    }
    return "unknown";
  }

  /**
   * Генерирует путь для файла на основе маски
   */
  static generateFilePath(mask: ParsedMask, vaultPath: string): string {
    const anchorType = this.getAnchorType(mask.anchor);
    
    if (anchorType === "project") {
      return `${vaultPath}/1_PROJECTS/${mask.anchor}/notes/`;
    } else if (anchorType === "category") {
      // Проверяем, является ли это KB заметкой
      const isKB = mask.areas.includes("KB") || mask.anchor === "CAT-KB";
      if (isKB) {
        return `${vaultPath}/2_CATEGORIES/${mask.anchor}/notes/`;
      }
      return `${vaultPath}/2_CATEGORIES/${mask.anchor}/notes/`;
    }
    
    // По умолчанию в INBOX
    return `${vaultPath}/0_INBOX/`;
  }
}