import { describe, it, expect } from 'vitest';
import { MaskParser, ParsedMask } from '../src/utils/mask-parser';

describe('MaskParser', () => {
  describe('parse', () => {
    it('should parse valid mask with all components', () => {
      const maskString = 'NOTE-PRJ.ENG.DEV.AC.INT+LAW-ISO17025@PROJ-HYDROPILOT';
      const result = MaskParser.parse(maskString);
      
      expect(result).toEqual({
        entity: 'NOTE-PRJ',
        areas: ['ENG', 'DEV'],
        status: 'AC',
        access: 'INT',
        format: undefined,
        references: ['LAW-ISO17025'],
        anchor: 'PROJ-HYDROPILOT'
      });
    });

    it('should parse mask with minimal components', () => {
      const maskString = 'NOTE@PROJ-HYDROPILOT';
      const result = MaskParser.parse(maskString);
      
      expect(result).toEqual({
        entity: 'NOTE',
        areas: [],
        status: undefined,
        access: undefined,
        format: undefined,
        references: undefined,
        anchor: 'PROJ-HYDROPILOT'
      });
    });

    it('should parse mask with areas only', () => {
      const maskString = 'NOTE.ENG.DEV@PROJ-HYDROPILOT';
      const result = MaskParser.parse(maskString);
      
      expect(result).toEqual({
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        status: undefined,
        access: undefined,
        format: undefined,
        references: undefined,
        anchor: 'PROJ-HYDROPILOT'
      });
    });

    it('should parse mask with status and access', () => {
      const maskString = 'NOTE.ENG.DEV.AC.INT@PROJ-HYDROPILOT';
      const result = MaskParser.parse(maskString);
      
      expect(result).toEqual({
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        status: 'AC',
        access: 'INT',
        format: undefined,
        references: undefined,
        anchor: 'PROJ-HYDROPILOT'
      });
    });

    it('should parse mask with format', () => {
      const maskString = 'NOTE.ENG.DEV.MD@PROJ-HYDROPILOT';
      const result = MaskParser.parse(maskString);
      
      expect(result).toEqual({
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        status: undefined,
        access: undefined,
        format: 'MD',
        references: undefined,
        anchor: 'PROJ-HYDROPILOT'
      });
    });

    it('should parse mask with multiple references', () => {
      const maskString = 'NOTE.ENG.DEV+LAW-ISO17025,STD-EN123@PROJ-HYDROPILOT';
      const result = MaskParser.parse(maskString);
      
      expect(result).toEqual({
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        status: undefined,
        access: undefined,
        format: undefined,
        references: ['LAW-ISO17025', 'STD-EN123'],
        anchor: 'PROJ-HYDROPILOT'
      });
    });

    it('should return null for invalid mask', () => {
      const maskString = 'INVALID-MASK';
      const result = MaskParser.parse(maskString);
      
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = MaskParser.parse('');
      expect(result).toBeNull();
    });
  });

  describe('validate', () => {
    it('should validate correct mask', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        status: 'AC',
        access: 'INT',
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.validate(mask);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject mask with too many areas', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG', 'DEV', 'MED', 'ACC', 'KB', 'LLM'], // 6 areas
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.validate(mask);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Маска может содержать не более 5 областей');
    });

    it('should reject mask with duplicate areas', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG', 'DEV', 'ENG'], // Duplicate ENG
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.validate(mask);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Области в маске должны быть уникальными');
    });

    it('should reject mask without anchor', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        anchor: ''
      };
      
      const result = MaskParser.validate(mask);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Маска должна содержать якорь (проект или категорию)');
    });

    it('should reject mask with too long filename', () => {
      const mask: ParsedMask = {
        entity: 'VERY-LONG-ENTITY-NAME-THAT-EXCEEDS-THE-LIMIT',
        areas: ['ENG', 'DEV', 'MED', 'ACC', 'KB'],
        status: 'AC',
        access: 'INT',
        format: 'MD',
        references: ['VERY-LONG-REFERENCE-NAME'],
        anchor: 'VERY-LONG-PROJECT-NAME'
      };
      
      const result = MaskParser.validate(mask);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Длина имени файла не должна превышать 140 символов');
    });
  });

  describe('generateFileName', () => {
    it('should generate filename from complete mask', () => {
      const mask: ParsedMask = {
        entity: 'NOTE-PRJ',
        areas: ['ENG', 'DEV'],
        status: 'AC',
        access: 'INT',
        format: 'MD',
        references: ['LAW-ISO17025'],
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.generateFileName(mask);
      
      expect(result).toBe('NOTE-PRJ.ENG.DEV.AC.INT.MD+LAW-ISO17025@PROJ-HYDROPILOT');
    });

    it('should generate filename from minimal mask', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: [],
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.generateFileName(mask);
      
      expect(result).toBe('NOTE@PROJ-HYDROPILOT');
    });

    it('should generate filename with areas only', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG', 'DEV'],
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.generateFileName(mask);
      
      expect(result).toBe('NOTE.ENG.DEV@PROJ-HYDROPILOT');
    });
  });

  describe('getAnchorType', () => {
    it('should identify project anchor', () => {
      const result = MaskParser.getAnchorType('PROJ-HYDROPILOT');
      expect(result).toBe('project');
    });

    it('should identify category anchor', () => {
      const result = MaskParser.getAnchorType('CAT-KB');
      expect(result).toBe('category');
    });

    it('should identify unknown anchor', () => {
      const result = MaskParser.getAnchorType('UNKNOWN-ANCHOR');
      expect(result).toBe('unknown');
    });
  });

  describe('generateFilePath', () => {
    it('should generate project path', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG'],
        anchor: 'PROJ-HYDROPILOT'
      };
      
      const result = MaskParser.generateFilePath(mask, '/vault');
      
      expect(result).toBe('/vault/1_PROJECTS/PROJ-HYDROPILOT/notes/');
    });

    it('should generate category path', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['KB'],
        anchor: 'CAT-KB'
      };
      
      const result = MaskParser.generateFilePath(mask, '/vault');
      
      expect(result).toBe('/vault/2_CATEGORIES/CAT-KB/notes/');
    });

    it('should generate KB category path for KB area', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['KB'],
        anchor: 'CAT-LLM'
      };
      
      const result = MaskParser.generateFilePath(mask, '/vault');
      
      expect(result).toBe('/vault/2_CATEGORIES/CAT-LLM/notes/');
    });

    it('should generate inbox path for unknown anchor', () => {
      const mask: ParsedMask = {
        entity: 'NOTE',
        areas: ['ENG'],
        anchor: 'UNKNOWN-ANCHOR'
      };
      
      const result = MaskParser.generateFilePath(mask, '/vault');
      
      expect(result).toBe('/vault/0_INBOX/');
    });
  });
});