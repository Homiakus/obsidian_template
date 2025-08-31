# План работ по исправлению ошибок

## 🚨 Критические ошибки (34 ошибки в 9 файлах)

### 1. src/main.ts (5 ошибок)
- [ ] **TS2564**: Свойства без инициализации в конструкторе
  - `fileManager: FileManager`
  - `entityFinder: EntityFinder` 
  - `debouncedProcessFile: (file: TFile) => void`
- [ ] **TS18048**: `frontmatter` возможно undefined
- [ ] **TS2532**: `maskMatch[1]` возможно undefined

### 2. src/ui/mask-builder-modal.ts (10 ошибок)
- [ ] **TS2564**: Свойства без инициализации в конструкторе (7 свойств)
- [ ] **TS2375**: Несовместимость типов с `exactOptionalPropertyTypes: true`
- [ ] **TS2532**: `suggestions[currentIndex]` возможно undefined

### 3. src/ui/ribbon-menu.ts (2 ошибки)
- [ ] **TS2564**: `container` без инициализации
- [ ] **TS18046**: `error` типа `unknown`

### 4. src/ui/ribbon-settings-modal.ts (1 ошибка)
- [ ] **TS2322**: `string | undefined` не присваивается `string`

### 5. src/utils/analytics.ts (8 ошибок)
- [ ] **TS2375**: Несовместимость типов с `exactOptionalPropertyTypes: true`
- [ ] **TS2532**: Объекты возможно undefined
- [ ] **TS18048**: `stats` возможно undefined
- [ ] **TS2345**: `string | undefined` не присваивается `string`

### 6. src/utils/entity-finder.ts (1 ошибка)
- [ ] **TS18048**: `frontmatterText` возможно undefined

### 7. src/utils/error-handler.ts (1 ошибка)
- [ ] **TS2375**: Несовместимость типов с `exactOptionalPropertyTypes: true`

### 8. src/utils/mask-parser.ts (3 ошибки)
- [ ] **TS2532**: `parts[parts.length - 2]` возможно undefined
- [ ] **TS2322**: `string | undefined` не присваивается `string` (2 случая)

### 9. src/utils/toml-config.ts (3 ошибки)
- [ ] **TS2345**: `string | undefined` не присваивается `string`
- [ ] **TS18048**: `value` возможно undefined
- [ ] **TS2532**: `iconsMatch[1]` возможно undefined

## 🎯 Приоритеты исправления

### Высокий приоритет (блокируют сборку)
1. **TS2564** - Свойства без инициализации (22 ошибки)
2. **TS2375** - Несовместимость типов (3 ошибки)

### Средний приоритет (логические ошибки)
3. **TS2532** - Объекты возможно undefined (8 ошибок)
4. **TS18048** - Значения возможно undefined (5 ошибок)

### Низкий приоритет (предупреждения)
5. **TS2322** - Несовместимость типов (3 ошибки)
6. **TS2345** - Несовместимость аргументов (2 ошибки)
7. **TS18046** - Тип unknown (1 ошибка)

## 🔧 Стратегия исправления

### Фаза 1: Инициализация свойств
- Добавить `!` оператор или инициализацию для всех свойств класса
- Использовать definite assignment assertion

### Фаза 2: Обработка undefined
- Добавить проверки на undefined
- Использовать nullish coalescing (`??`)
- Добавить fallback значения

### Фаза 3: Типизация
- Исправить несовместимости типов
- Добавить правильные type guards
- Обновить интерфейсы

## 📊 Метрики прогресса
- **Всего ошибок**: 34
- **Исправлено**: 0
- **Осталось**: 34
- **Прогресс**: 0%

## 🎭 Следующие шаги
1. Исправить TS2564 ошибки (инициализация свойств)
2. Исправить TS2375 ошибки (типы)
3. Исправить TS2532/TS18048 ошибки (undefined)
4. Проверить сборку
5. Запустить тесты
