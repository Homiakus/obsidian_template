import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler, ErrorCategory, ErrorSeverity, ErrorInfo } from '../src/utils/error-handler';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler();
  });

  describe('Error handling', () => {
    it('should handle string errors', () => {
      handler.handleError('Test error message');
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Test error message');
      expect(errors[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(errors[0].category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      handler.handleError(error);
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].stack).toBe(error.stack);
    });

    it('should handle errors with custom category and severity', () => {
      handler.handleError(
        'Custom error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.HIGH,
        { context: 'test' },
        false
      );
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].category).toBe(ErrorCategory.VALIDATION);
      expect(errors[0].severity).toBe(ErrorSeverity.HIGH);
      expect(errors[0].context).toEqual({ context: 'test' });
      expect(errors[0].recoverable).toBe(false);
    });
  });

  describe('Specialized error handlers', () => {
    it('should handle validation errors', () => {
      handler.handleValidationError('Validation failed', { field: 'mask' });
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].category).toBe(ErrorCategory.VALIDATION);
      expect(errors[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(errors[0].context).toEqual({ field: 'mask' });
    });

    it('should handle file operation errors', () => {
      const error = new Error('File not found');
      handler.handleFileOperationError(error, { fileName: 'test.md' });
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].category).toBe(ErrorCategory.FILE_OPERATION);
      expect(errors[0].severity).toBe(ErrorSeverity.HIGH);
      expect(errors[0].context).toEqual({ fileName: 'test.md' });
    });

    it('should handle parsing errors', () => {
      handler.handleParsingError('Invalid mask format', { mask: 'INVALID' });
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].category).toBe(ErrorCategory.PARSING);
      expect(errors[0].severity).toBe(ErrorSeverity.MEDIUM);
      expect(errors[0].context).toEqual({ mask: 'INVALID' });
    });

    it('should handle critical errors', () => {
      const error = new Error('Critical system error');
      handler.handleCriticalError(error, { operation: 'pluginLoad' });
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].category).toBe(ErrorCategory.UNKNOWN);
      expect(errors[0].severity).toBe(ErrorSeverity.CRITICAL);
      expect(errors[0].recoverable).toBe(false);
    });
  });

  describe('Error counting', () => {
    it('should track error counts', () => {
      handler.handleError('Error 1');
      handler.handleError('Error 1'); // Дубликат
      handler.handleError('Error 2');
      
      expect(handler.getErrorCount('Error 1')).toBe(2);
      expect(handler.getErrorCount('Error 2')).toBe(1);
      expect(handler.getErrorCount('Non-existent')).toBe(0);
    });
  });

  describe('Error filtering', () => {
    beforeEach(() => {
      handler.handleValidationError('Validation error 1');
      handler.handleValidationError('Validation error 2');
      handler.handleFileOperationError(new Error('File error'));
      handler.handleCriticalError(new Error('Critical error'));
    });

    it('should filter errors by category', () => {
      const validationErrors = handler.getErrorsByCategory(ErrorCategory.VALIDATION);
      const fileErrors = handler.getErrorsByCategory(ErrorCategory.FILE_OPERATION);
      const parsingErrors = handler.getErrorsByCategory(ErrorCategory.PARSING);
      
      expect(validationErrors).toHaveLength(2);
      expect(fileErrors).toHaveLength(1);
      expect(parsingErrors).toHaveLength(0);
    });

    it('should filter errors by severity', () => {
      const mediumErrors = handler.getErrorsBySeverity(ErrorSeverity.MEDIUM);
      const highErrors = handler.getErrorsBySeverity(ErrorSeverity.HIGH);
      const criticalErrors = handler.getErrorsBySeverity(ErrorSeverity.CRITICAL);
      
      expect(mediumErrors).toHaveLength(2); // Validation errors
      expect(highErrors).toHaveLength(1); // File operation error
      expect(criticalErrors).toHaveLength(1); // Critical error
    });
  });

  describe('Error statistics', () => {
    beforeEach(() => {
      handler.handleValidationError('Validation error');
      handler.handleFileOperationError(new Error('File error'));
      handler.handleCriticalError(new Error('Critical error'));
    });

    it('should generate error statistics', () => {
      const stats = handler.getErrorStats();
      
      expect(stats.total).toBe(3);
      expect(stats.byCategory[ErrorCategory.VALIDATION]).toBe(1);
      expect(stats.byCategory[ErrorCategory.FILE_OPERATION]).toBe(1);
      expect(stats.byCategory[ErrorCategory.UNKNOWN]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
      expect(stats.mostFrequent).toHaveLength(3);
    });

    it('should limit recent errors', () => {
      // Добавляем много ошибок
      for (let i = 0; i < 15; i++) {
        handler.handleError(`Error ${i}`);
      }
      
      const stats = handler.getErrorStats();
      expect(stats.recentErrors).toHaveLength(10); // Максимум 10 последних
    });
  });

  describe('Error recommendations', () => {
    it('should provide recommendations for validation errors', () => {
      for (let i = 0; i < 11; i++) {
        handler.handleValidationError(`Validation error ${i}`);
      }
      
      const recommendations = handler.getErrorRecommendations();
      expect(recommendations).toContain('Проверьте корректность масок в файлах');
    });

    it('should provide recommendations for file operation errors', () => {
      for (let i = 0; i < 6; i++) {
        handler.handleFileOperationError(new Error(`File error ${i}`));
      }
      
      const recommendations = handler.getErrorRecommendations();
      expect(recommendations).toContain('Проверьте права доступа к файлам и папкам');
    });

    it('should provide recommendations for parsing errors', () => {
      for (let i = 0; i < 6; i++) {
        handler.handleParsingError(`Parsing error ${i}`);
      }
      
      const recommendations = handler.getErrorRecommendations();
      expect(recommendations).toContain('Проверьте формат масок в именах файлов');
    });

    it('should provide recommendations for critical errors', () => {
      handler.handleCriticalError(new Error('Critical error'));
      
      const recommendations = handler.getErrorRecommendations();
      expect(recommendations).toContain('Перезапустите плагин для восстановления работы');
    });
  });

  describe('Error management', () => {
    it('should clear all errors', () => {
      handler.handleError('Error 1');
      handler.handleError('Error 2');
      
      expect(handler.getErrors()).toHaveLength(2);
      
      handler.clearErrors();
      expect(handler.getErrors()).toHaveLength(0);
    });

    it('should check for critical errors', () => {
      expect(handler.hasCriticalErrors()).toBe(false);
      
      handler.handleCriticalError(new Error('Critical error'));
      expect(handler.hasCriticalErrors()).toBe(true);
    });

    it('should export errors as JSON', () => {
      handler.handleError('Test error', ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM);
      
      const exported = handler.exportErrors();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('errors');
      expect(parsed).toHaveProperty('stats');
      expect(parsed).toHaveProperty('exportTimestamp');
      
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errors[0].message).toBe('Test error');
      expect(parsed.stats.total).toBe(1);
    });
  });

  describe('Error limits', () => {
    it('should limit the number of stored errors', () => {
      // Добавляем больше ошибок чем лимит (100)
      for (let i = 0; i < 105; i++) {
        handler.handleError(`Error ${i}`);
      }
      
      const errors = handler.getErrors();
      expect(errors).toHaveLength(100); // Максимум 100 ошибок
      expect(errors[0].message).toBe('Error 5'); // Первые 5 удалены
    });
  });
});