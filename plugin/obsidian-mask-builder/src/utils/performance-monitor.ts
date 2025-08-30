import { Notice } from "obsidian";

export interface PerformanceMetrics {
  pluginLoadTime: number;
  fileProcessingTime: number;
  maskValidationTime: number;
  fileOperationsTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    pluginLoadTime: 0,
    fileProcessingTime: 0,
    maskValidationTime: 0,
    fileOperationsTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
  };

  private cacheHits = 0;
  private cacheMisses = 0;
  private timers = new Map<string, number>();

  /**
   * Начинает измерение времени для операции
   */
  startTimer(operation: string): void {
    this.timers.set(operation, performance.now());
  }

  /**
   * Завершает измерение времени для операции
   */
  endTimer(operation: string): number {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      console.warn(`Timer for operation '${operation}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operation);

    // Обновляем метрики
    switch (operation) {
      case 'pluginLoad':
        this.metrics.pluginLoadTime = duration;
        break;
      case 'fileProcessing':
        this.metrics.fileProcessingTime = duration;
        break;
      case 'maskValidation':
        this.metrics.maskValidationTime = duration;
        break;
      case 'fileOperations':
        this.metrics.fileOperationsTime = duration;
        break;
    }

    return duration;
  }

  /**
   * Регистрирует попадание в кэш
   */
  recordCacheHit(): void {
    this.cacheHits++;
    this.updateCacheHitRate();
  }

  /**
   * Регистрирует промах кэша
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
    this.updateCacheHitRate();
  }

  /**
   * Обновляет показатель попадания в кэш
   */
  private updateCacheHitRate(): void {
    const total = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Обновляет информацию о памяти
   */
  updateMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  /**
   * Получает текущие метрики
   */
  getMetrics(): PerformanceMetrics {
    this.updateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Выводит отчет о производительности
   */
  logPerformanceReport(): void {
    const metrics = this.getMetrics();
    
    console.group('🎯 Mask Builder Performance Report');
    console.log(`Plugin Load Time: ${metrics.pluginLoadTime.toFixed(2)}ms`);
    console.log(`File Processing Time: ${metrics.fileProcessingTime.toFixed(2)}ms`);
    console.log(`Mask Validation Time: ${metrics.maskValidationTime.toFixed(2)}ms`);
    console.log(`File Operations Time: ${metrics.fileOperationsTime.toFixed(2)}ms`);
    console.log(`Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`Cache Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`Cache Hits: ${this.cacheHits}, Misses: ${this.cacheMisses}`);
    console.groupEnd();

    // Показываем уведомление если есть проблемы
    this.checkPerformanceIssues(metrics);
  }

  /**
   * Проверяет наличие проблем с производительностью
   */
  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues: string[] = [];

    if (metrics.pluginLoadTime > 1000) {
      issues.push('Медленная загрузка плагина');
    }

    if (metrics.fileProcessingTime > 500) {
      issues.push('Медленная обработка файлов');
    }

    if (metrics.memoryUsage > 100) {
      issues.push('Высокое потребление памяти');
    }

    if (metrics.cacheHitRate < 50) {
      issues.push('Низкая эффективность кэша');
    }

    if (issues.length > 0) {
      new Notice(`⚠️ Проблемы производительности: ${issues.join(', ')}`);
    }
  }

  /**
   * Сбрасывает все метрики
   */
  reset(): void {
    this.metrics = {
      pluginLoadTime: 0,
      fileProcessingTime: 0,
      maskValidationTime: 0,
      fileOperationsTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
    };
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.timers.clear();
  }

  /**
   * Экспортирует метрики в JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      cacheStats: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: this.metrics.cacheHitRate,
      },
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}

// Глобальный экземпляр монитора производительности
export const performanceMonitor = new PerformanceMonitor();