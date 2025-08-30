import { vi } from 'vitest';

// Мокаем Obsidian API
global.obsidian = {
  App: vi.fn(),
  Plugin: vi.fn(),
  PluginSettingTab: vi.fn(),
  Setting: vi.fn(),
  Modal: vi.fn(),
  Notice: vi.fn(),
  TFile: vi.fn(),
  TFolder: vi.fn(),
  normalizePath: vi.fn((path: string) => path),
  debounce: vi.fn((fn: Function, delay: number) => fn)
} as any;

// Мокаем DOM API
global.document = {
  createElement: vi.fn(),
  querySelector: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as any;

global.window = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
} as any;

// Мокаем console для тестов
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};