import { Notice } from "obsidian";

export interface AnalyticsEvent {
  event: string;
  timestamp: Date;
  data?: Record<string, any>;
  sessionId: string;
}

export interface AnalyticsData {
  events: AnalyticsEvent[];
  sessionStart: Date;
  sessionId: string;
  version: string;
  settings: Record<string, any>;
}

export class Analytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private sessionStart: Date;
  private maxEvents = 1000;
  private isEnabled: boolean = true;

  constructor(private version: string, private settings: Record<string, any>) {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
  }

  /**
   * Генерирует уникальный ID сессии
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Записывает событие аналитики
   */
  track(event: string, data?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: new Date(),
      data: data ?? {},
      sessionId: this.sessionId
    };

    this.events.push(analyticsEvent);

    // Ограничиваем количество событий
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Отслеживает создание маски
   */
  trackMaskCreated(mask: string, success: boolean): void {
    this.track('mask_created', {
      mask,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Отслеживает валидацию маски
   */
  trackMaskValidation(mask: string, isValid: boolean, errors?: string[]): void {
    this.track('mask_validation', {
      mask,
      isValid,
      errors: errors || [],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Отслеживает файловые операции
   */
  trackFileOperation(operation: string, fileName: string, success: boolean): void {
    this.track('file_operation', {
      operation,
      fileName,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Отслеживает использование команд
   */
  trackCommand(command: string): void {
    this.track('command_used', {
      command,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Отслеживает ошибки
   */
  trackError(error: string, category: string, severity: string): void {
    this.track('error_occurred', {
      error,
      category,
      severity,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Отслеживает изменения настроек
   */
  trackSettingChange(setting: string, oldValue: any, newValue: any): void {
    this.track('setting_changed', {
      setting,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Отслеживает производительность
   */
  trackPerformance(operation: string, duration: number): void {
    this.track('performance_metric', {
      operation,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Получает статистику использования
   */
  getUsageStats(): Record<string, any> {
    const stats = {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      sessionDuration: Date.now() - this.sessionStart.getTime(),
      totalEvents: this.events.length,
      eventsByType: {} as Record<string, number>,
      recentEvents: this.events.slice(-10),
      version: this.version
    };

    // Подсчитываем события по типам
    this.events.forEach(event => {
      stats.eventsByType[event.event] = (stats.eventsByType[event.event] || 0) + 1;
    });

    return stats;
  }

  /**
   * Получает аналитику по маскам
   */
  getMaskAnalytics(): Record<string, any> {
    const maskEvents = this.events.filter(e => e.event === 'mask_created' || e.event === 'mask_validation');
    const maskStats = {
      totalMasksCreated: 0,
      successfulMasks: 0,
      failedMasks: 0,
      totalValidations: 0,
      validMasks: 0,
      invalidMasks: 0,
      commonErrors: {} as Record<string, number>,
      popularMasks: {} as Record<string, number>
    };

    maskEvents.forEach(event => {
      if (event.event === 'mask_created') {
        maskStats.totalMasksCreated++;
        if (event.data?.success) {
          maskStats.successfulMasks++;
        } else {
          maskStats.failedMasks++;
        }

        // Подсчитываем популярные маски
        const mask = event.data?.mask;
        if (mask) {
          maskStats.popularMasks[mask] = (maskStats.popularMasks[mask] || 0) + 1;
        }
      } else if (event.event === 'mask_validation') {
        maskStats.totalValidations++;
        if (event.data?.isValid) {
          maskStats.validMasks++;
        } else {
          maskStats.invalidMasks++;
          // Подсчитываем частые ошибки
          const errors = event.data?.errors || [];
          errors.forEach((error: string) => {
            maskStats.commonErrors[error] = (maskStats.commonErrors[error] || 0) + 1;
          });
        }
      }
    });

    return maskStats;
  }

  /**
   * Получает аналитику по производительности
   */
  getPerformanceAnalytics(): Record<string, any> {
    const perfEvents = this.events.filter(e => e.event === 'performance_metric');
    const perfStats = {
      totalOperations: perfEvents.length,
      totalDuration: 0,
      averageDuration: 0,
      operationsByType: {} as Record<string, { count: number; totalDuration: number; averageDuration: number }>,
      slowestOperations: [] as Array<{ operation: string; duration: number }>,
      fastestOperations: [] as Array<{ operation: string; duration: number }>
    };

    perfEvents.forEach(event => {
      const operation = event.data?.operation;
      const duration = event.data?.duration || 0;
      
      perfStats.totalDuration += duration;
      
      if (operation) {
        if (!perfStats.operationsByType[operation]) {
          perfStats.operationsByType[operation] = { count: 0, totalDuration: 0, averageDuration: 0 };
        }
        
        const stats = perfStats.operationsByType[operation];
        if (stats) {
          stats.count++;
          stats.totalDuration += duration;
        }
      }
    });

    // Вычисляем средние значения для каждого типа операции
    Object.keys(perfStats.operationsByType).forEach(operation => {
      const stats = perfStats.operationsByType[operation];
      if (stats && stats.count > 0) {
        stats.averageDuration = stats.totalDuration / stats.count;
      }
    });

    // Находим самые медленные и быстрые операции
    const sortedByDuration = perfEvents
      .map(e => ({ operation: e.data?.operation ?? 'unknown', duration: e.data?.duration || 0 }))
      .sort((a, b) => b.duration - a.duration);

    perfStats.slowestOperations = sortedByDuration.slice(0, 5);
    perfStats.fastestOperations = sortedByDuration.slice(-5).reverse();
    
    // Вычисляем общее среднее
    if (perfStats.totalOperations > 0) {
      perfStats.averageDuration = perfStats.totalDuration / perfStats.totalOperations;
    }

    return perfStats;
  }

  /**
   * Получает аналитику по ошибкам
   */
  getErrorAnalytics(): Record<string, any> {
    const errorEvents = this.events.filter(e => e.event === 'error_occurred');
    const errorStats = {
      totalErrors: errorEvents.length,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      mostCommonErrors: {} as Record<string, number>,
      errorTrend: [] as Array<{ date: string; count: number }>
    };

    errorEvents.forEach(event => {
      const category = event.data?.category;
      const severity = event.data?.severity;
      const error = event.data?.error;

      if (category) {
        errorStats.errorsByCategory[category] = (errorStats.errorsByCategory[category] || 0) + 1;
      }

      if (severity) {
        errorStats.errorsBySeverity[severity] = (errorStats.errorsBySeverity[severity] || 0) + 1;
      }

      if (error) {
        errorStats.mostCommonErrors[error] = (errorStats.mostCommonErrors[error] || 0) + 1;
      }
    });

    // Анализируем тренд ошибок по дням
    const errorsByDay = new Map<string, number>();
    errorEvents.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];
      if (date) {
        errorsByDay.set(date, (errorsByDay.get(date) || 0) + 1);
      }
    });

    errorStats.errorTrend = Array.from(errorsByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return errorStats;
  }

  /**
   * Экспортирует все данные аналитики
   */
  exportAnalytics(): string {
    const analyticsData: AnalyticsData = {
      events: this.events,
      sessionStart: this.sessionStart,
      sessionId: this.sessionId,
      version: this.version,
      settings: this.settings
    };

    return JSON.stringify(analyticsData, null, 2);
  }

  /**
   * Очищает данные аналитики
   */
  clearAnalytics(): void {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
  }

  /**
   * Включает/выключает аналитику
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.track('analytics_toggled', { enabled });
  }

  /**
   * Проверяет, включена ли аналитика
   */
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Глобальный экземпляр аналитики
export let analytics: Analytics | null = null;

export function initializeAnalytics(version: string, settings: Record<string, any>): void {
  analytics = new Analytics(version, settings);
}

export function getAnalytics(): Analytics | null {
  return analytics;
}