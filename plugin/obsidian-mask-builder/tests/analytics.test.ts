import { describe, it, expect, beforeEach } from 'vitest';
import { Analytics, initializeAnalytics, getAnalytics } from '../src/utils/analytics';

describe('Analytics', () => {
  let analytics: Analytics;

  beforeEach(() => {
    const mockSettings = {
      enabled: true,
      autoCreateFolders: true,
      defaultTemplate: "",
      maskValidation: true,
      maxAreas: 5,
      maxFileNameLength: 140,
      autoCategorize: true,
      kbAutoMove: true,
      showMaskBuilder: true,
      showQuickActions: true,
      debounceDelay: 300,
      cacheSize: 100,
      confirmFileOperations: true,
      backupBeforeMove: false,
    };

    initializeAnalytics("1.0.0", mockSettings);
    analytics = getAnalytics()!;
  });

  describe('Initialization', () => {
    it('should initialize analytics correctly', () => {
      expect(analytics).toBeDefined();
      expect(analytics.isAnalyticsEnabled()).toBe(true);
    });

    it('should generate unique session ID', () => {
      const stats = analytics.getUsageStats();
      expect(stats.sessionId).toBeDefined();
      expect(typeof stats.sessionId).toBe('string');
      expect(stats.sessionId.length).toBeGreaterThan(0);
    });

    it('should track session start time', () => {
      const stats = analytics.getUsageStats();
      expect(stats.sessionStart).toBeInstanceOf(Date);
      expect(stats.sessionDuration).toBeGreaterThan(0);
    });
  });

  describe('Event tracking', () => {
    it('should track basic events', () => {
      analytics.track('test_event', { test: true });
      
      const stats = analytics.getUsageStats();
      expect(stats.totalEvents).toBe(1);
      expect(stats.eventsByType['test_event']).toBe(1);
    });

    it('should track mask creation events', () => {
      analytics.trackMaskCreated('NOTE.ENG.DEV', true);
      analytics.trackMaskCreated('NOTE.ENG.PROD', false);
      
      const maskStats = analytics.getMaskAnalytics();
      expect(maskStats.totalMasksCreated).toBe(2);
      expect(maskStats.successfulMasks).toBe(1);
      expect(maskStats.failedMasks).toBe(1);
    });

    it('should track mask validation events', () => {
      analytics.trackMaskValidation('NOTE.ENG.DEV', true);
      analytics.trackMaskValidation('INVALID.MASK', false, ['Invalid format']);
      
      const maskStats = analytics.getMaskAnalytics();
      expect(maskStats.totalValidations).toBe(2);
      expect(maskStats.validMasks).toBe(1);
      expect(maskStats.invalidMasks).toBe(1);
      expect(maskStats.commonErrors['Invalid format']).toBe(1);
    });

    it('should track file operation events', () => {
      analytics.trackFileOperation('create', 'test.md', true);
      analytics.trackFileOperation('move', 'test2.md', false);
      
      const stats = analytics.getUsageStats();
      expect(stats.eventsByType['file_operation']).toBe(2);
    });

    it('should track command usage', () => {
      analytics.trackCommand('open-mask-builder');
      analytics.trackCommand('validate-mask');
      
      const stats = analytics.getUsageStats();
      expect(stats.eventsByType['command_used']).toBe(2);
    });

    it('should track errors', () => {
      analytics.trackError('File not found', 'file_operation', 'high');
      
      const stats = analytics.getUsageStats();
      expect(stats.eventsByType['error_occurred']).toBe(1);
    });

    it('should track setting changes', () => {
      analytics.trackSettingChange('enabled', false, true);
      
      const stats = analytics.getUsageStats();
      expect(stats.eventsByType['setting_changed']).toBe(1);
    });

    it('should track performance metrics', () => {
      analytics.trackPerformance('file_processing', 150);
      analytics.trackPerformance('mask_validation', 50);
      
      const perfStats = analytics.getPerformanceAnalytics();
      expect(perfStats.totalOperations).toBe(2);
      expect(perfStats.averageDuration).toBe(100);
    });
  });

  describe('Analytics limits', () => {
    it('should limit the number of stored events', () => {
      // Добавляем больше событий чем лимит (1000)
      for (let i = 0; i < 1005; i++) {
        analytics.track(`event_${i}`);
      }
      
      const stats = analytics.getUsageStats();
      expect(stats.totalEvents).toBe(1000); // Максимум 1000 событий
    });
  });

  describe('Mask analytics', () => {
    beforeEach(() => {
      // Добавляем тестовые данные
      analytics.trackMaskCreated('NOTE.ENG.DEV', true);
      analytics.trackMaskCreated('NOTE.ENG.DEV', true);
      analytics.trackMaskCreated('NOTE.ENG.PROD', true);
      analytics.trackMaskCreated('INVALID.MASK', false);
      
      analytics.trackMaskValidation('NOTE.ENG.DEV', true);
      analytics.trackMaskValidation('NOTE.ENG.PROD', true);
      analytics.trackMaskValidation('INVALID.MASK', false, ['Invalid format', 'Missing anchor']);
      analytics.trackMaskValidation('ANOTHER.INVALID', false, ['Invalid format']);
    });

    it('should calculate mask creation statistics', () => {
      const maskStats = analytics.getMaskAnalytics();
      
      expect(maskStats.totalMasksCreated).toBe(4);
      expect(maskStats.successfulMasks).toBe(3);
      expect(maskStats.failedMasks).toBe(1);
      expect(maskStats.successfulMasks / maskStats.totalMasksCreated).toBe(0.75);
    });

    it('should calculate validation statistics', () => {
      const maskStats = analytics.getMaskAnalytics();
      
      expect(maskStats.totalValidations).toBe(4);
      expect(maskStats.validMasks).toBe(2);
      expect(maskStats.invalidMasks).toBe(2);
      expect(maskStats.validMasks / maskStats.totalValidations).toBe(0.5);
    });

    it('should track popular masks', () => {
      const maskStats = analytics.getMaskAnalytics();
      
      expect(maskStats.popularMasks['NOTE.ENG.DEV']).toBe(2);
      expect(maskStats.popularMasks['NOTE.ENG.PROD']).toBe(1);
      expect(maskStats.popularMasks['INVALID.MASK']).toBe(1);
    });

    it('should track common errors', () => {
      const maskStats = analytics.getMaskAnalytics();
      
      expect(maskStats.commonErrors['Invalid format']).toBe(2);
      expect(maskStats.commonErrors['Missing anchor']).toBe(1);
    });
  });

  describe('Performance analytics', () => {
    beforeEach(() => {
      // Добавляем тестовые данные производительности
      analytics.trackPerformance('file_processing', 200);
      analytics.trackPerformance('file_processing', 150);
      analytics.trackPerformance('mask_validation', 50);
      analytics.trackPerformance('mask_validation', 75);
      analytics.trackPerformance('file_operations', 300);
    });

    it('should calculate performance statistics', () => {
      const perfStats = analytics.getPerformanceAnalytics();
      
      expect(perfStats.totalOperations).toBe(5);
      expect(perfStats.averageDuration).toBe(155); // (200+150+50+75+300)/5
    });

    it('should group operations by type', () => {
      const perfStats = analytics.getPerformanceAnalytics();
      
      expect(perfStats.operationsByType['file_processing']).toBeDefined();
      expect(perfStats.operationsByType['file_processing'].count).toBe(2);
      expect(perfStats.operationsByType['file_processing'].averageDuration).toBe(175);
      
      expect(perfStats.operationsByType['mask_validation']).toBeDefined();
      expect(perfStats.operationsByType['mask_validation'].count).toBe(2);
      expect(perfStats.operationsByType['mask_validation'].averageDuration).toBe(62.5);
    });

    it('should identify slowest and fastest operations', () => {
      const perfStats = analytics.getPerformanceAnalytics();
      
      expect(perfStats.slowestOperations[0].operation).toBe('file_operations');
      expect(perfStats.slowestOperations[0].duration).toBe(300);
      
      expect(perfStats.fastestOperations[0].operation).toBe('mask_validation');
      expect(perfStats.fastestOperations[0].duration).toBe(50);
    });
  });

  describe('Error analytics', () => {
    beforeEach(() => {
      // Добавляем тестовые ошибки
      analytics.trackError('File not found', 'file_operation', 'high');
      analytics.trackError('Invalid mask format', 'validation', 'medium');
      analytics.trackError('File not found', 'file_operation', 'high');
      analytics.trackError('Permission denied', 'file_operation', 'critical');
    });

    it('should calculate error statistics', () => {
      const errorStats = analytics.getErrorAnalytics();
      
      expect(errorStats.totalErrors).toBe(4);
      expect(errorStats.errorsByCategory['file_operation']).toBe(3);
      expect(errorStats.errorsByCategory['validation']).toBe(1);
      expect(errorStats.errorsBySeverity['high']).toBe(2);
      expect(errorStats.errorsBySeverity['medium']).toBe(1);
      expect(errorStats.errorsBySeverity['critical']).toBe(1);
    });

    it('should track most common errors', () => {
      const errorStats = analytics.getErrorAnalytics();
      
      expect(errorStats.mostCommonErrors['File not found']).toBe(2);
      expect(errorStats.mostCommonErrors['Invalid mask format']).toBe(1);
      expect(errorStats.mostCommonErrors['Permission denied']).toBe(1);
    });
  });

  describe('Analytics management', () => {
    it('should export analytics data', () => {
      analytics.track('test_event', { test: true });
      
      const exported = analytics.exportAnalytics();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('events');
      expect(parsed).toHaveProperty('sessionStart');
      expect(parsed).toHaveProperty('sessionId');
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('settings');
      
      expect(parsed.events).toHaveLength(1);
      expect(parsed.events[0].event).toBe('test_event');
    });

    it('should clear analytics data', () => {
      analytics.track('test_event');
      
      expect(analytics.getUsageStats().totalEvents).toBe(1);
      
      analytics.clearAnalytics();
      
      expect(analytics.getUsageStats().totalEvents).toBe(0);
    });

    it('should toggle analytics enabled state', () => {
      expect(analytics.isAnalyticsEnabled()).toBe(true);
      
      analytics.setEnabled(false);
      expect(analytics.isAnalyticsEnabled()).toBe(false);
      
      analytics.setEnabled(true);
      expect(analytics.isAnalyticsEnabled()).toBe(true);
    });

    it('should not track events when disabled', () => {
      analytics.setEnabled(false);
      analytics.track('test_event');
      
      expect(analytics.getUsageStats().totalEvents).toBe(0);
      
      analytics.setEnabled(true);
      analytics.track('test_event');
      
      expect(analytics.getUsageStats().totalEvents).toBe(1);
    });
  });

  describe('Global analytics functions', () => {
    it('should initialize global analytics instance', () => {
      const mockSettings = { test: true };
      initializeAnalytics("2.0.0", mockSettings);
      
      const globalAnalytics = getAnalytics();
      expect(globalAnalytics).toBeDefined();
      expect(globalAnalytics!.isAnalyticsEnabled()).toBe(true);
    });

    it('should return null when analytics not initialized', () => {
      // Сбрасываем глобальный экземпляр
      (global as any).analytics = null;
      
      const analytics = getAnalytics();
      expect(analytics).toBeNull();
    });
  });
});