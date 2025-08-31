# Руководство по TOML конфигурации ленточного меню

## Обзор

Ленточное меню Mask Builder теперь поддерживает настройку через TOML файл `ribbon-menu-config.toml`. Это позволяет легко настраивать внешний вид и функциональность без изменения кода плагина.

## Структура TOML файла

### Основные настройки
```toml
[ribbon_menu]
enabled = true          # Включить/выключить ленточное меню
position = "bottom"     # Позиция: "top" или "bottom"
theme = "default"       # Тема оформления
```

### Действия (кнопки)
```toml
[[ribbon_menu.actions]]
id = "format-content"           # Уникальный идентификатор
name = "Форматировать содержимое"  # Отображаемое название
icon = "edit"                   # Иконка (из доступных)
action = "format"               # Тип действия
enabled = true                  # Включено/выключено
order = 1                      # Порядок отображения
custom_action = "saveTemplate"  # Пользовательское действие (для action = "custom")
description = "Описание действия"  # Подсказка
```

### Настройки отображения
```toml
[ribbon_menu.display]
show_tooltips = true           # Показывать подсказки
show_labels = false            # Показывать названия под иконками
icon_size = 24                # Размер иконок в пикселях
spacing = 10                  # Расстояние между кнопками
background_color = "var(--background-secondary)"  # Цвет фона
border_color = "var(--background-modifier-border)"  # Цвет границы
hover_effect = true           # Эффекты при наведении
animation_speed = 0.2         # Скорость анимации
```

### Настройки иконок
```toml
[ribbon_menu.icons]
default_icon = "edit"         # Иконка по умолчанию
fallback_icon = "circle"      # Запасная иконка
custom_icons = [              # Список доступных иконок
  "edit", "edit-3", "upload", "plus", "file-plus", "save", "download",
  "settings", "search", "link", "tag", "calendar", "book-open", "folder", "check-square"
]
```

## Доступные действия

### Основные действия
1. **format-content** - Форматирование содержимого
2. **send-to-api** - Отправка в API
3. **create-note** - Создание заметки
4. **save-template** - Сохранение как шаблон
5. **export-markdown** - Экспорт в Markdown

### Действия для фронтматтера
6. **edit-frontmatter** - Редактирование фронтматтера
7. **create-frontmatter** - Создание нового фронтматтера

### Действия для навигации
8. **open-notes** - Открыть папку с заметками
9. **open-projects** - Открыть папку с проектами
10. **open-decisions** - Открыть папку с решениями

## Доступные иконки

- **edit** - Карандаш (редактирование)
- **edit-3** - Карандаш с линиями (расширенное редактирование)
- **upload** - Стрелка вверх (загрузка)
- **plus** - Плюс (создание)
- **file-plus** - Файл с плюсом (новый файл)
- **save** - Дискета (сохранение)
- **download** - Стрелка вниз (скачивание)
- **settings** - Шестеренка (настройки)
- **search** - Лупа (поиск)
- **link** - Ссылка
- **tag** - Тег
- **calendar** - Календарь
- **book-open** - Открытая книга
- **folder** - Папка
- **check-square** - Галочка в квадрате

## Пример полной конфигурации

```toml
# Конфигурация ленточного меню для Mask Builder

[ribbon_menu]
enabled = true
position = "bottom"
theme = "default"

# Основные действия
[[ribbon_menu.actions]]
id = "format-content"
name = "Форматировать содержимое"
icon = "edit"
action = "format"
enabled = true
order = 1
description = "Форматирует содержимое заметки в Markdown"

[[ribbon_menu.actions]]
id = "create-note"
name = "Создать заметку"
icon = "plus"
action = "create"
enabled = true
order = 2
description = "Создает новую заметку на основе формы"

[[ribbon_menu.actions]]
id = "save-template"
name = "Сохранить как шаблон"
icon = "save"
action = "custom"
enabled = true
order = 3
custom_action = "saveTemplate"
description = "Сохраняет текущую форму как шаблон"

# Действия для фронтматтера
[[ribbon_menu.actions]]
id = "edit-frontmatter"
name = "Редактировать фронтматтер"
icon = "edit-3"
action = "custom"
enabled = true
order = 4
custom_action = "editFrontmatter"
description = "Редактирует существующий фронтматтер"

[[ribbon_menu.actions]]
id = "create-frontmatter"
name = "Создать фронтматтер"
icon = "file-plus"
action = "custom"
enabled = true
order = 5
custom_action = "createFrontmatter"
description = "Создает новый фронтматтер с очисткой формы"

# Навигация по категориям
[[ribbon_menu.actions]]
id = "open-notes"
name = "Открыть заметки"
icon = "book-open"
action = "custom"
enabled = true
order = 6
custom_action = "openNotes"
description = "Быстрый доступ к папке с заметками"

[[ribbon_menu.actions]]
id = "open-projects"
name = "Открыть проекты"
icon = "folder"
action = "custom"
enabled = true
order = 7
custom_action = "openProjects"
description = "Быстрый доступ к папке с проектами"

[[ribbon_menu.actions]]
id = "open-decisions"
name = "Открыть решения"
icon = "check-square"
action = "custom"
enabled = true
order = 8
custom_action = "openDecisions"
description = "Быстрый доступ к папке с решениями"

# Настройки отображения
[ribbon_menu.display]
show_tooltips = true
show_labels = false
icon_size = 24
spacing = 10
background_color = "var(--background-secondary)"
border_color = "var(--background-modifier-border)"
hover_effect = true
animation_speed = 0.2

# Настройки иконок
[ribbon_menu.icons]
default_icon = "edit"
fallback_icon = "circle"
custom_icons = [
  "edit", "edit-3", "upload", "plus", "file-plus", "save", "download",
  "settings", "search", "link", "tag", "calendar", "book-open", "folder", "check-square"
]
```

## Настройка через Obsidian

### Шаг 1: Создание TOML файла
1. В корне вашего vault создайте файл `ribbon-menu-config.toml`
2. Скопируйте содержимое примера выше
3. Настройте под свои нужды

### Шаг 2: Перезапуск плагина
1. Откройте настройки Obsidian
2. Перейдите в раздел "Плагины сообщества"
3. Найдите "Mask Builder"
4. Отключите и включите плагин заново

### Шаг 3: Проверка работы
1. Откройте Mask Builder (Ctrl+Shift+M)
2. Проверьте, что ленточное меню отображается
3. Проверьте работу всех настроенных кнопок

## Кастомизация

### Добавление новых действий
```toml
[[ribbon_menu.actions]]
id = "my-custom-action"
name = "Мое действие"
icon = "settings"
action = "custom"
enabled = true
order = 11
custom_action = "myCustomAction"
description = "Описание моего действия"
```

### Изменение порядка кнопок
Измените значение `order` для каждой кнопки. Кнопки будут отображаться в порядке возрастания этого значения.

### Отключение кнопок
Установите `enabled = false` для кнопок, которые хотите скрыть.

### Изменение иконок
Замените значение `icon` на любое из доступных названий иконок.

## Решение проблем

### Ленточное меню не отображается
1. Проверьте, что `enabled = true`
2. Убедитесь, что TOML файл синтаксически корректен
3. Перезапустите плагин

### Кнопки не работают
1. Проверьте, что `action` указан правильно
2. Для пользовательских действий убедитесь, что `custom_action` указан
3. Проверьте консоль на наличие ошибок

### Иконки не отображаются
1. Убедитесь, что название иконки указано правильно
2. Проверьте, что иконка есть в списке `custom_icons`
3. Используйте `fallback_icon` как запасной вариант

## Поддержка

Если у вас возникли проблемы с настройкой TOML конфигурации:

1. Проверьте синтаксис TOML файла
2. Убедитесь, что все обязательные поля заполнены
3. Проверьте консоль разработчика на наличие ошибок
4. Создайте минимальную конфигурацию и постепенно добавляйте настройки

## Примеры конфигураций

### Минимальная конфигурация
```toml
[ribbon_menu]
enabled = true
position = "bottom"

[[ribbon_menu.actions]]
id = "create-note"
name = "Создать заметку"
icon = "plus"
action = "create"
enabled = true
order = 1
```

### Конфигурация только для фронтматтера
```toml
[ribbon_menu]
enabled = true
position = "bottom"

[[ribbon_menu.actions]]
id = "edit-frontmatter"
name = "Редактировать"
icon = "edit-3"
action = "custom"
enabled = true
order = 1
custom_action = "editFrontmatter"

[[ribbon_menu.actions]]
id = "create-frontmatter"
name = "Создать"
icon = "file-plus"
action = "custom"
enabled = true
order = 2
custom_action = "createFrontmatter"
```

### Конфигурация для навигации
```toml
[ribbon_menu]
enabled = true
position = "bottom"

[[ribbon_menu.actions]]
id = "open-notes"
name = "Заметки"
icon = "book-open"
action = "custom"
enabled = true
order = 1
custom_action = "openNotes"

[[ribbon_menu.actions]]
id = "open-projects"
name = "Проекты"
icon = "folder"
action = "custom"
enabled = true
order = 2
custom_action = "openProjects"
```
