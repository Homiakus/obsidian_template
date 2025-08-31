import { App, Modal, Setting, Notice } from "obsidian";
import { performanceMonitor } from "../utils/performance-monitor";
import { errorHandler, ErrorCategory, ErrorSeverity } from "../utils/error-handler";
import { MaskParser } from "../utils/mask-parser";

export class DebugPanel extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    // Заголовок
    contentEl.createEl("h2", { text: "Debug Panel - Mask Builder" });

    // Секции
    this.createPerformanceSection(contentEl);
    this.createErrorSection(contentEl);
    this.createMaskTestingSection(contentEl);
    this.createActionsSection(contentEl);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  private createPerformanceSection(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Performance Metrics" });

    const metrics = performanceMonitor.getMetrics();
    
    new Setting(containerEl)
      .setName("Plugin Load Time")
      .setDesc(`${metrics.pluginLoadTime.toFixed(2)}ms`)
      .addButton((button) =>
        button.setButtonText("Reset").onClick(() => {
          performanceMonitor.reset();
          this.refresh();
        })
      );

    new Setting(containerEl)
      .setName("File Processing Time")
      .setDesc(`${metrics.fileProcessingTime.toFixed(2)}ms`);

    new Setting(containerEl)
      .setName("Mask Validation Time")
      .setDesc(`${metrics.maskValidationTime.toFixed(2)}ms`);

    new Setting(containerEl)
      .setName("File Operations Time")
      .setDesc(`${metrics.fileOperationsTime.toFixed(2)}ms`);

    new Setting(containerEl)
      .setName("Memory Usage")
      .setDesc(`${metrics.memoryUsage.toFixed(2)}MB`);

    new Setting(containerEl)
      .setName("Cache Hit Rate")
      .setDesc(`${metrics.cacheHitRate.toFixed(1)}%`);

    new Setting(containerEl)
      .setName("Generate Performance Report")
      .setDesc("Вывести подробный отчет в консоль")
      .addButton((button) =>
        button.setButtonText("Generate").onClick(() => {
          performanceMonitor.logPerformanceReport();
          new Notice("Отчет выведен в консоль");
        })
      );
  }

  private createErrorSection(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Error Statistics" });

    const stats = errorHandler.getErrorStats();
    const recommendations = errorHandler.getErrorRecommendations();

    new Setting(containerEl)
      .setName("Total Errors")
      .setDesc(`${stats.total} errors`);

    // Ошибки по категориям
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      if ((count as number) > 0) {
        new Setting(containerEl)
          .setName(`${category} Errors`)
          .setDesc(`${count} errors`)
          .addButton((button) =>
            button.setButtonText("View").onClick(() => {
              this.showErrorsByCategory(category as ErrorCategory);
            })
          );
      }
    });

    // Ошибки по серьезности
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      if ((count as number) > 0) {
        new Setting(containerEl)
          .setName(`${severity} Severity Errors`)
          .setDesc(`${count} errors`);
      }
    });

    // Рекомендации
    if (recommendations.length > 0) {
      containerEl.createEl("h4", { text: "Recommendations" });
      recommendations.forEach(rec => {
        containerEl.createEl("p", { text: `• ${rec}` });
      });
    }

    new Setting(containerEl)
      .setName("Clear All Errors")
      .setDesc("Очистить все ошибки")
      .addButton((button) =>
        button.setButtonText("Clear").onClick(() => {
          errorHandler.clearErrors();
          this.refresh();
          new Notice("Все ошибки очищены");
        })
      );

    new Setting(containerEl)
      .setName("Export Error Log")
      .setDesc("Экспортировать лог ошибок")
      .addButton((button) =>
        button.setButtonText("Export").onClick(() => {
          const errorLog = errorHandler.exportErrors();
          this.copyToClipboard(errorLog);
          new Notice("Лог ошибок скопирован в буфер обмена");
        })
      );
  }

  private createMaskTestingSection(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Mask Testing" });

    let testMask = "";

    new Setting(containerEl)
      .setName("Test Mask")
      .setDesc("Введите маску для тестирования")
      .addText((text) => {
        text.setPlaceholder("NOTE.ENG.DEV.AC.INT@PROJ-HYDROPILOT");
        text.onChange((value) => {
          testMask = value;
        });
      })
      .addButton((button) =>
        button.setButtonText("Test").onClick(() => {
          this.testMask(testMask);
        })
      );
  }

  private createActionsSection(containerEl: HTMLElement): void {
    containerEl.createEl("h3", { text: "Debug Actions" });

    new Setting(containerEl)
      .setName("Export Performance Metrics")
      .setDesc("Экспортировать метрики производительности")
      .addButton((button) =>
        button.setButtonText("Export").onClick(() => {
          const metrics = performanceMonitor.exportMetrics();
          this.copyToClipboard(metrics);
          new Notice("Метрики скопированы в буфер обмена");
        })
      );

    new Setting(containerEl)
      .setName("Test Error Handling")
      .setDesc("Создать тестовую ошибку")
      .addButton((button) =>
        button.setButtonText("Test").onClick(() => {
          errorHandler.handleError(
            "Test error for debugging",
            ErrorCategory.VALIDATION,
            ErrorSeverity.MEDIUM,
            { test: true }
          );
          this.refresh();
          new Notice("Тестовая ошибка создана");
        })
      );

    new Setting(containerEl)
      .setName("Force Garbage Collection")
      .setDesc("Принудительная очистка памяти (если доступно)")
      .addButton((button) =>
        button.setButtonText("GC").onClick(() => {
          if ('gc' in window) {
            (window as any).gc();
            new Notice("Garbage collection выполнен");
          } else {
            new Notice("Garbage collection недоступен");
          }
        })
      );
  }

  private showErrorsByCategory(category: ErrorCategory): void {
    const errors = errorHandler.getErrorsByCategory(category);
    
    const errorModal = new Modal(this.app);
    errorModal.titleEl.setText(`Errors - ${category}`);
    
    const content = errorModal.contentEl;
    content.empty();

    if (errors.length === 0) {
      content.createEl("p", { text: "No errors in this category" });
      return;
    }

    errors.forEach((error, index) => {
      const errorDiv = content.createEl("div", { cls: "error-item" });
      errorDiv.createEl("h4", { text: `Error ${index + 1}` });
      errorDiv.createEl("p", { text: error.message });
      errorDiv.createEl("p", { text: `Severity: ${error.severity}` });
      errorDiv.createEl("p", { text: `Time: ${error.timestamp.toISOString()}` });
      if (error.context) {
        errorDiv.createEl("p", { text: `Context: ${JSON.stringify(error.context)}` });
      }
      content.createEl("hr");
    });

    errorModal.open();
  }

  private testMask(maskString: string): void {
    if (!maskString.trim()) {
      new Notice("Введите маску для тестирования");
      return;
    }

    try {
      const parsed = MaskParser.parse(maskString);
      
      if (!parsed) {
        new Notice("❌ Маска не распознана");
        return;
      }

      const validation = MaskParser.validate(parsed);
      const fileName = MaskParser.generateFileName(parsed);
      const filePath = MaskParser.generateFilePath(parsed, "/vault");

      const resultModal = new Modal(this.app);
      resultModal.titleEl.setText("Mask Test Results");
      
      const content = resultModal.contentEl;
      content.empty();

      content.createEl("h3", { text: "Parsing Result" });
      content.createEl("p", { text: `✅ Маска распознана успешно` });
      content.createEl("p", { text: `Entity: ${parsed.entity}` });
      content.createEl("p", { text: `Areas: ${parsed.areas.join(', ')}` });
      content.createEl("p", { text: `Status: ${parsed.status || 'N/A'}` });
      content.createEl("p", { text: `Access: ${parsed.access || 'N/A'}` });
      content.createEl("p", { text: `Anchor: ${parsed.anchor}` });

      content.createEl("h3", { text: "Validation Result" });
      if (validation.valid) {
        content.createEl("p", { text: "✅ Маска валидна" });
      } else {
        content.createEl("p", { text: "❌ Маска невалидна" });
        validation.errors.forEach(error => {
          content.createEl("p", { text: `• ${error}` });
        });
      }

      content.createEl("h3", { text: "Generated Output" });
      content.createEl("p", { text: `File Name: ${fileName}` });
      content.createEl("p", { text: `File Path: ${filePath}` });

      resultModal.open();

    } catch (error) {
      errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorCategory.PARSING,
        ErrorSeverity.MEDIUM,
        { testMask: maskString }
      );
      new Notice("❌ Ошибка при тестировании маски");
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