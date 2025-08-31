import { Notice } from "obsidian";

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  FILE_OPERATION = 'file_operation',
  PARSING = 'parsing',
  NETWORK = 'network',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

export interface ErrorInfo {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  recoverable: boolean;
}

export class ErrorHandler {
  private errors: ErrorInfo[] = [];
  private maxErrors = 100;
  private errorCounts = new Map<string, number>();

  /**
   * Обрабатывает ошибку с указанной категорией и серьезностью
   */
  handleError(
    error: Error | string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    recoverable: boolean = true
  ): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      severity,
      category,
      timestamp: new Date(),
      context: context ?? {},
      stack: error instanceof Error ? error.stack ?? '' : '',
      recoverable
    };

    this.errors.push(errorInfo);
    this.trackErrorCount(errorInfo.message);

    // Ограничиваем количество сохраняемых ошибок
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Логируем ошибку
    this.logError(errorInfo);

    // Показываем уведомление для критических ошибок
    if (severity === ErrorSeverity.CRITICAL) {
      this.showErrorNotification(errorInfo);
    }

    // Для некритических ошибок показываем уведомление только если это первая ошибка такого типа
    if (severity === ErrorSeverity.HIGH && this.getErrorCount(errorInfo.message) === 1) {
      this.showErrorNotification(errorInfo);
    }
  }

  /**
   * Обрабатывает ошибки валидации
   */
  handleValidationError(message: string, context?: Record<string, any>): void {
    this.handleError(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      context,
      true
    );
  }

  /**
   * Обрабатывает ошибки файловых операций
   */
  handleFileOperationError(error: Error, context?: Record<string, any>): void {
    this.handleError(
      error,
      ErrorCategory.FILE_OPERATION,
      ErrorSeverity.HIGH,
      context,
      true
    );
  }

  /**
   * Обрабатывает ошибки парсинга
   */
  handleParsingError(message: string, context?: Record<string, any>): void {
    this.handleError(
      message,
      ErrorCategory.PARSING,
      ErrorSeverity.MEDIUM,
      context,
      true
    );
  }

  /**
   * Обрабатывает критические ошибки
   */
  handleCriticalError(error: Error, context?: Record<string, any>): void {
    this.handleError(
      error,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.CRITICAL,
      context,
      false
    );
  }

  /**
   * Отслеживает количество ошибок по сообщению
   */
  private trackErrorCount(message: string): void {
    const count = this.errorCounts.get(message) || 0;
    this.errorCounts.set(message, count + 1);
  }

  /**
   * Получает количество ошибок по сообщению
   */
  getErrorCount(message: string): number {
    return this.errorCounts.get(message) || 0;
  }

  /**
   * Логирует ошибку в консоль
   */
  private logError(errorInfo: ErrorInfo): void {
    const prefix = `[Mask Builder] [${errorInfo.category.toUpperCase()}] [${errorInfo.severity.toUpperCase()}]`;
    
    console.group(`${prefix} ${errorInfo.message}`);
    console.log('Timestamp:', errorInfo.timestamp.toISOString());
    if (errorInfo.context) {
      console.log('Context:', errorInfo.context);
    }
    if (errorInfo.stack) {
      console.log('Stack:', errorInfo.stack);
    }
    console.log('Recoverable:', errorInfo.recoverable);
    console.groupEnd();
  }

  /**
   * Показывает уведомление об ошибке
   */
  private showErrorNotification(errorInfo: ErrorInfo): void {
    const prefix = `[${errorInfo.category.toUpperCase()}]`;
    const message = `${prefix} ${errorInfo.message}`;
    
    new Notice(message, 5000); // Показываем 5 секунд
  }

  /**
   * Получает все ошибки
   */
  getErrors(): ErrorInfo[] {
    return [...this.errors];
  }

  /**
   * Получает ошибки по категории
   */
  getErrorsByCategory(category: ErrorCategory): ErrorInfo[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Получает ошибки по серьезности
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorInfo[] {
    return this.errors.filter(error => error.severity === severity);
  }

  /**
   * Получает статистику ошибок
   */
  getErrorStats(): Record<string, any> {
    const stats = {
      total: this.errors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recentErrors: this.errors.slice(-10), // Последние 10 ошибок
      mostFrequent: [] as Array<{ message: string; count: number }>
    };

    // Подсчитываем по категориям
    Object.values(ErrorCategory).forEach(category => {
      stats.byCategory[category] = this.getErrorsByCategory(category).length;
    });

    // Подсчитываем по серьезности
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = this.getErrorsBySeverity(severity).length;
    });

    // Находим самые частые ошибки
    const sortedErrors = Array.from(this.errorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    stats.mostFrequent = sortedErrors;

    return stats;
  }

  /**
   * Очищает все ошибки
   */
  clearErrors(): void {
    this.errors = [];
    this.errorCounts.clear();
  }

  /**
   * Экспортирует ошибки в JSON
   */
  exportErrors(): string {
    return JSON.stringify({
      errors: this.errors,
      stats: this.getErrorStats(),
      exportTimestamp: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Проверяет, есть ли критические ошибки
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  }

  /**
   * Получает рекомендации по исправлению ошибок
   */
  getErrorRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getErrorStats();

    if (stats.byCategory[ErrorCategory.VALIDATION] > 10) {
      recommendations.push('Проверьте корректность масок в файлах');
    }

    if (stats.byCategory[ErrorCategory.FILE_OPERATION] > 5) {
      recommendations.push('Проверьте права доступа к файлам и папкам');
    }

    if (stats.byCategory[ErrorCategory.PARSING] > 5) {
      recommendations.push('Проверьте формат масок в именах файлов');
    }

    if (stats.bySeverity[ErrorSeverity.CRITICAL] > 0) {
      recommendations.push('Перезапустите плагин для восстановления работы');
    }

    return recommendations;
  }
}

// Глобальный экземпляр обработчика ошибок
export const errorHandler = new ErrorHandler();