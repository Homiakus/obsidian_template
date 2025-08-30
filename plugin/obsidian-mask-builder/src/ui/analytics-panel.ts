import { App, Modal, Setting, Notice } from "obsidian";
import { getAnalytics } from "../utils/analytics";

export class AnalyticsPanel extends Modal {
  private app: App;

  constructor(app: App) {
    super(app);
    this.app = app;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // Заголовок
    contentEl.createEl("h2", { text: "Analytics Dashboard - Mask Builder" });

    const analytics = getAnalytics();
    if (!analytics) {
      contentEl.createEl("p", { text: "Analytics not initialized" });
      return;
    }

    // Секции аналитики
    this.createUsageStatsSection(contentEl, analytics);
    this.createMaskAnalyticsSection(contentEl, analytics);
    this.createPerformanceAnalyticsSection(contentEl, analytics);
    this.createErrorAnalyticsSection(contentEl, analytics);
    this.createActionsSection(contentEl, analytics);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  private createUsageStatsSection(containerEl: HTMLElement, analytics: any): void {
    containerEl.createEl("h3", { text: "Usage Statistics" });

    const stats = analytics.getUsageStats();
    
    new Setting(containerEl)
      .setName("Session ID")
      .setDesc(stats.sessionId);

    new Setting(containerEl)
      .setName("Session Start")
      .setDesc(stats.sessionStart.toLocaleString());

    new Setting(containerEl)
      .setName("Session Duration")
      .setDesc(this.formatDuration(stats.sessionDuration));

    new Setting(containerEl)
      .setName("Total Events")
      .setDesc(`${stats.totalEvents} events`);

    new Setting(containerEl)
      .setName("Plugin Version")
      .setDesc(stats.version);

    // События по типам
    containerEl.createEl("h4", { text: "Events by Type" });
    Object.entries(stats.eventsByType).forEach(([eventType, count]) => {
      new Setting(containerEl)
        .setName(eventType)
        .setDesc(`${count} events`);
    });
  }

  private createMaskAnalyticsSection(containerEl: HTMLElement, analytics: any): void {
    containerEl.createEl("h3", { text: "Mask Analytics" });

    const maskStats = analytics.getMaskAnalytics();
    
    new Setting(containerEl)
      .setName("Total Masks Created")
      .setDesc(`${maskStats.totalMasksCreated} masks`);

    new Setting(containerEl)
      .setName("Successful Masks")
      .setDesc(`${maskStats.successfulMasks} masks`);

    new Setting(containerEl)
      .setName("Failed Masks")
      .setDesc(`${maskStats.failedMasks} masks`);

    new Setting(containerEl)
      .setName("Success Rate")
      .setDesc(maskStats.totalMasksCreated > 0 
        ? `${((maskStats.successfulMasks / maskStats.totalMasksCreated) * 100).toFixed(1)}%`
        : "N/A");

    new Setting(containerEl)
      .setName("Total Validations")
      .setDesc(`${maskStats.totalValidations} validations`);

    new Setting(containerEl)
      .setName("Valid Masks")
      .setDesc(`${maskStats.validMasks} masks`);

    new Setting(containerEl)
      .setName("Invalid Masks")
      .setDesc(`${maskStats.invalidMasks} masks`);

    new Setting(containerEl)
      .setName("Validation Rate")
      .setDesc(maskStats.totalValidations > 0 
        ? `${((maskStats.validMasks / maskStats.totalValidations) * 100).toFixed(1)}%`
        : "N/A");

    // Популярные маски
    if (Object.keys(maskStats.popularMasks).length > 0) {
      containerEl.createEl("h4", { text: "Popular Masks" });
      const sortedMasks = Object.entries(maskStats.popularMasks)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);

      sortedMasks.forEach(([mask, count]) => {
        new Setting(containerEl)
          .setName(mask)
          .setDesc(`Used ${count} times`);
      });
    }

    // Частые ошибки
    if (Object.keys(maskStats.commonErrors).length > 0) {
      containerEl.createEl("h4", { text: "Common Validation Errors" });
      const sortedErrors = Object.entries(maskStats.commonErrors)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);

      sortedErrors.forEach(([error, count]) => {
        new Setting(containerEl)
          .setName(error)
          .setDesc(`Occurred ${count} times`);
      });
    }
  }

  private createPerformanceAnalyticsSection(containerEl: HTMLElement, analytics: any): void {
    containerEl.createEl("h3", { text: "Performance Analytics" });

    const perfStats = analytics.getPerformanceAnalytics();
    
    new Setting(containerEl)
      .setName("Total Operations")
      .setDesc(`${perfStats.totalOperations} operations`);

    new Setting(containerEl)
      .setName("Average Duration")
      .setDesc(perfStats.averageDuration > 0 
        ? `${perfStats.averageDuration.toFixed(2)}ms`
        : "N/A");

    // Операции по типам
    if (Object.keys(perfStats.operationsByType).length > 0) {
      containerEl.createEl("h4", { text: "Operations by Type" });
      Object.entries(perfStats.operationsByType).forEach(([operation, stats]: [string, any]) => {
        new Setting(containerEl)
          .setName(operation)
          .setDesc(`${stats.count} operations, avg: ${stats.averageDuration.toFixed(2)}ms`);
      });
    }

    // Самые медленные операции
    if (perfStats.slowestOperations.length > 0) {
      containerEl.createEl("h4", { text: "Slowest Operations" });
      perfStats.slowestOperations.forEach((op: any) => {
        new Setting(containerEl)
          .setName(op.operation)
          .setDesc(`${op.duration.toFixed(2)}ms`);
      });
    }

    // Самые быстрые операции
    if (perfStats.fastestOperations.length > 0) {
      containerEl.createEl("h4", { text: "Fastest Operations" });
      perfStats.fastestOperations.forEach((op: any) => {
        new Setting(containerEl)
          .setName(op.operation)
          .setDesc(`${op.duration.toFixed(2)}ms`);
      });
    }
  }

  private createErrorAnalyticsSection(containerEl: HTMLElement, analytics: any): void {
    containerEl.createEl("h3", { text: "Error Analytics" });

    const errorStats = analytics.getErrorAnalytics();
    
    new Setting(containerEl)
      .setName("Total Errors")
      .setDesc(`${errorStats.totalErrors} errors`);

    // Ошибки по категориям
    if (Object.keys(errorStats.errorsByCategory).length > 0) {
      containerEl.createEl("h4", { text: "Errors by Category" });
      Object.entries(errorStats.errorsByCategory).forEach(([category, count]) => {
        new Setting(containerEl)
          .setName(category)
          .setDesc(`${count} errors`);
      });
    }

    // Ошибки по серьезности
    if (Object.keys(errorStats.errorsBySeverity).length > 0) {
      containerEl.createEl("h4", { text: "Errors by Severity" });
      Object.entries(errorStats.errorsBySeverity).forEach(([severity, count]) => {
        new Setting(containerEl)
          .setName(severity)
          .setDesc(`${count} errors`);
      });
    }

    // Самые частые ошибки
    if (Object.keys(errorStats.mostCommonErrors).length > 0) {
      containerEl.createEl("h4", { text: "Most Common Errors" });
      const sortedErrors = Object.entries(errorStats.mostCommonErrors)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5);

      sortedErrors.forEach(([error, count]) => {
        new Setting(containerEl)
          .setName(error)
          .setDesc(`Occurred ${count} times`);
      });
    }

    // Тренд ошибок
    if (errorStats.errorTrend.length > 0) {
      containerEl.createEl("h4", { text: "Error Trend (Last 7 Days)" });
      const recentTrend = errorStats.errorTrend.slice(-7);
      
      recentTrend.forEach((day: any) => {
        new Setting(containerEl)
          .setName(day.date)
          .setDesc(`${day.count} errors`);
      });
    }
  }

  private createActionsSection(containerEl: HTMLElement, analytics: any): void {
    containerEl.createEl("h3", { text: "Analytics Actions" });

    new Setting(containerEl)
      .setName("Export Analytics Data")
      .setDesc("Export all analytics data as JSON")
      .addButton((button) =>
        button.setButtonText("Export").onClick(() => {
          const data = analytics.exportAnalytics();
          this.copyToClipboard(data);
          new Notice("Analytics data exported to clipboard");
        })
      );

    new Setting(containerEl)
      .setName("Clear Analytics Data")
      .setDesc("Clear all analytics data")
      .addButton((button) =>
        button.setButtonText("Clear").onClick(() => {
          analytics.clearAnalytics();
          this.refresh();
          new Notice("Analytics data cleared");
        })
      );

    new Setting(containerEl)
      .setName("Toggle Analytics")
      .setDesc(analytics.isAnalyticsEnabled() ? "Analytics is enabled" : "Analytics is disabled")
      .addToggle((toggle) =>
        toggle
          .setValue(analytics.isAnalyticsEnabled())
          .onChange((value) => {
            analytics.setEnabled(value);
            this.refresh();
            new Notice(`Analytics ${value ? 'enabled' : 'disabled'}`);
          })
      );
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    });
  }

  private refresh(): void {
    this.onClose();
    this.onOpen();
  }
}