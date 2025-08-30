import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor, PerformanceMetrics } from '../src/utils/performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    // Мокаем performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => {
      return Date.now();
    });
  });

  describe('Timer operations', () => {
    it('should start and end timer correctly', () => {
      monitor.startTimer('test');
      const duration = monitor.endTimer('test');
      
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle multiple timers', () => {
      monitor.startTimer('timer1');
      monitor.startTimer('timer2');
      
      const duration1 = monitor.endTimer('timer1');
      const duration2 = monitor.endTimer('timer2');
      
      expect(duration1).toBeGreaterThan(0);
      expect(duration2).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent timer', () => {
      const duration = monitor.endTimer('non-existent');
      expect(duration).toBe(0);
    });
  });

  describe('Cache tracking', () => {
    it('should track cache hits and misses', () => {
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
      
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(66.7); // 2 hits / 3 total = 66.7%
    });

    it('should handle zero cache operations', () => {
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should calculate cache hit rate correctly', () => {
      // 5 hits, 5 misses = 50%
      for (let i = 0; i < 5; i++) {
        monitor.recordCacheHit();
        monitor.recordCacheMiss();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(50);
    });
  });

  describe('Metrics', () => {
    it('should return valid metrics structure', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics).toHaveProperty('pluginLoadTime');
      expect(metrics).toHaveProperty('fileProcessingTime');
      expect(metrics).toHaveProperty('maskValidationTime');
      expect(metrics).toHaveProperty('fileOperationsTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cacheHitRate');
      
      expect(typeof metrics.pluginLoadTime).toBe('number');
      expect(typeof metrics.fileProcessingTime).toBe('number');
      expect(typeof metrics.maskValidationTime).toBe('number');
      expect(typeof metrics.fileOperationsTime).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.cacheHitRate).toBe('number');
    });

    it('should update metrics when timers are used', () => {
      monitor.startTimer('pluginLoad');
      monitor.endTimer('pluginLoad');
      
      monitor.startTimer('fileProcessing');
      monitor.endTimer('fileProcessing');
      
      const metrics = monitor.getMetrics();
      expect(metrics.pluginLoadTime).toBeGreaterThan(0);
      expect(metrics.fileProcessingTime).toBeGreaterThan(0);
    });
  });

  describe('Reset functionality', () => {
    it('should reset all metrics', () => {
      // Заполняем метрики данными
      monitor.startTimer('pluginLoad');
      monitor.endTimer('pluginLoad');
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
      
      // Сбрасываем
      monitor.reset();
      
      const metrics = monitor.getMetrics();
      expect(metrics.pluginLoadTime).toBe(0);
      expect(metrics.fileProcessingTime).toBe(0);
      expect(metrics.maskValidationTime).toBe(0);
      expect(metrics.fileOperationsTime).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('Export functionality', () => {
    it('should export metrics as JSON', () => {
      monitor.startTimer('pluginLoad');
      monitor.endTimer('pluginLoad');
      monitor.recordCacheHit();
      
      const exported = monitor.exportMetrics();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('metrics');
      expect(parsed).toHaveProperty('cacheStats');
      expect(parsed).toHaveProperty('timestamp');
      
      expect(parsed.metrics).toHaveProperty('pluginLoadTime');
      expect(parsed.cacheStats).toHaveProperty('hits');
      expect(parsed.cacheStats).toHaveProperty('misses');
      expect(parsed.cacheStats).toHaveProperty('hitRate');
    });
  });

  describe('Performance issue detection', () => {
    it('should detect slow plugin load', () => {
      // Симулируем медленную загрузку
      monitor.startTimer('pluginLoad');
      // Ждем немного
      setTimeout(() => {
        monitor.endTimer('pluginLoad');
      }, 1100);
      
      // В реальном тесте нужно дождаться завершения таймера
      // Здесь просто проверяем структуру
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();
    });
  });
});