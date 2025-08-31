# План миграции к иерархической MOC системе

## Обзор миграции

### Текущее состояние
- Централизованная MOC в `/docspro/_index.md`
- Все ссылки и навигация в одном файле
- Время загрузки увеличивается с ростом контента
- Сложность поддержки и обновления

### Целевое состояние
- Иерархическая MOC система с 4 уровнями
- Делегированная ответственность за каждый раздел
- Оптимизированная производительность
- Упрощённая поддержка и обновление

### Цель миграции
Переход от централизованной к иерархической MOC системе без потери функциональности и с улучшением производительности.

## Стратегия миграции

### Принципы миграции
1. **Поэтапность**: Постепенное внедрение изменений
2. **Обратная совместимость**: Сохранение существующих ссылок
3. **Тестирование**: Проверка каждого этапа
4. **Откат**: Возможность возврата к предыдущему состоянию
5. **Мониторинг**: Отслеживание производительности

### Подход к миграции
- **Big Bang**: Не подходит из-за рисков
- **Parallel**: Создание новой системы параллельно со старой
- **Phased**: Поэтапная миграция по разделам
- **Strangler Fig**: Постепенная замена частей системы

**Выбранный подход**: Phased (поэтапная миграция)

## Этапы миграции

### Этап 1: Подготовка инфраструктуры (Дни 1-3)

#### 1.1 Создание структуры папок
```bash
# Создание MOC папок для каждого раздела
mkdir -p docspro/00_Charter
mkdir -p docspro/01_Research
mkdir -p docspro/02_Planning
mkdir -p docspro/03_Design
mkdir -p docspro/04_Execution
mkdir -p docspro/05_Quality
mkdir -p docspro/06_Risks
mkdir -p docspro/07_Decisions
mkdir -p docspro/08_KB_glossary
mkdir -p docspro/09_Reports
mkdir -p docspro/10_Artifacts
```

#### 1.2 Создание базовых MOC файлов
```bash
# Создание _index.md для каждого раздела
touch docspro/00_Charter/_index.md
touch docspro/01_Research/_index.md
touch docspro/02_Planning/_index.md
touch docspro/03_Design/_index.md
touch docspro/04_Execution/_index.md
touch docspro/05_Quality/_index.md
touch docspro/06_Risks/_index.md
touch docspro/07_Decisions/_index.md
touch docspro/08_KB_glossary/_index.md
touch docspro/09_Reports/_index.md
touch docspro/10_Artifacts/_index.md
```

#### 1.3 Настройка системы контроля версий
```bash
# Создание ветки для миграции
git checkout -b feature/moc-migration

# Создание .gitignore для временных файлов
echo "migration-temp/" >> .gitignore
echo "*.backup" >> .gitignore
echo "migration-logs/" >> .gitignore
```

### Этап 2: Создание MOC шаблонов (Дни 4-7)

#### 2.1 Шаблон для главного индекса
```markdown
# Главный индекс проекта

## Обзор
Краткое описание проекта и его целей.

## Быстрые ссылки
- [Цель проекта](00_Charter/goal.md)
- [Исследования](01_Research/notes.md)
- [Планирование](02_Planning/backlog.md)
- [Архитектура](03_Design/architecture.md)

## Навигация по разделам
- [00_Charter](00_Charter/_index.md) - Цели и миссия
- [01_Research](01_Research/_index.md) - Исследования и анализ
- [02_Planning](02_Planning/_index.md) - Планирование и бэклог
- [03_Design](03_Design/_index.md) - Архитектура и дизайн
- [04_Execution](04_Execution/_index.md) - Выполнение и процессы
- [05_Quality](05_Quality/_index.md) - Качество и тестирование
- [06_Risks](06_Risks/_index.md) - Риски и митигация
- [07_Decisions](07_Decisions/_index.md) - Решения и обоснования
- [08_KB_glossary](08_KB_glossary/_index.md) - Глоссарий и термины
- [09_Reports](09_Reports/_index.md) - Отчёты и сводки
- [10_Artifacts](10_Artifacts/_index.md) - Артефакты и результаты

## Метрики проекта
- **Всего задач**: {{dv.pages().length}}
- **Завершено**: {{dv.pages().where(p => p.status = "done").length}}
- **В работе**: {{dv.pages().where(p => p.status = "in-progress").length}}

## Последние обновления
{{dv.pages().sort(p => p.file.mtime).limit(5)}}
```

#### 2.2 Шаблон для разделов
```markdown
# {{section_name}}

## Обзор раздела
Описание назначения и содержания раздела.

## Основные документы
- [Документ 1](document1.md)
- [Документ 2](document2.md)
- [Документ 3](document3.md)

## Быстрые ссылки
- [Быстрая ссылка 1](#)
- [Быстрая ссылка 2](#)

## Метрики раздела
- **Всего документов**: {{dv.pages("{{section_path}}").length}}
- **Последнее обновление**: {{dv.pages("{{section_path}}").sort(p => p.file.mtime).first().file.mtime}}

## Связанные разделы
- [Связанный раздел 1](../related_section/_index.md)
- [Связанный раздел 2](../related_section/_index.md)
```

#### 2.3 Шаблон для подразделов
```markdown
# {{subsection_name}}

## Обзор подраздела
Детальное описание назначения подраздела.

## Документы
### Основные
- [Основной документ](main_document.md)

### Вспомогательные
- [Вспомогательный документ](supporting_document.md)

## Процессы
- [Процесс 1](process1.md)
- [Процесс 2](process2.md)

## Метрики
- **Документов**: {{dv.pages("{{subsection_path}}").length}}
- **Последнее обновление**: {{dv.pages("{{subsection_path}}").sort(p => p.file.mtime).first().file.mtime}}

## Навигация
- [← Назад к разделу](../_index.md)
- [↑ К главному индексу](../../_index.md)
```

### Этап 3: Миграция контента (Дни 8-14)

#### 3.1 Анализ существующего контента
```bash
# Анализ структуры существующих файлов
find docspro/ -name "*.md" -type f | sort

# Анализ связей между файлами
grep -r "\[.*\]" docspro/ | grep -v "_index.md"

# Анализ размера файлов
find docspro/ -name "*.md" -exec wc -l {} + | sort -n
```

#### 3.2 Создание карты миграции
```yaml
migration_map:
  source_file: "docspro/_index.md"
  target_files:
    - "docspro/00_Charter/_index.md"
    - "docspro/01_Research/_index.md"
    - "docspro/02_Planning/_index.md"
    - "docspro/03_Design/_index.md"
    - "docspro/04_Execution/_index.md"
    - "docspro/05_Quality/_index.md"
    - "docspro/06_Risks/_index.md"
    - "docspro/07_Decisions/_index.md"
    - "docspro/08_KB_glossary/_index.md"
    - "docspro/09_Reports/_index.md"
    - "docspro/10_Artifacts/_index.md"
  
  content_mapping:
    "Цель проекта": "docspro/00_Charter/_index.md"
    "Исследования": "docspro/01_Research/_index.md"
    "Планирование": "docspro/02_Planning/_index.md"
    "Архитектура": "docspro/03_Design/_index.md"
    "Выполнение": "docspro/04_Execution/_index.md"
    "Качество": "docspro/05_Quality/_index.md"
    "Риски": "docspro/06_Risks/_index.md"
    "Решения": "docspro/07_Decisions/_index.md"
    "Глоссарий": "docspro/08_KB_glossary/_index.md"
    "Отчёты": "docspro/09_Reports/_index.md"
    "Артефакты": "docspro/10_Artifacts/_index.md"
```

#### 3.3 Поэтапная миграция контента

**День 8-9: Миграция разделов 00-02**
```bash
# Миграция Charter
cp docspro/_index.md docspro/00_Charter/_index.md
# Редактирование для раздела Charter

# Миграция Research
cp docspro/_index.md docspro/01_Research/_index.md
# Редактирование для раздела Research

# Миграция Planning
cp docspro/_index.md docspro/02_Planning/_index.md
# Редактирование для раздела Planning
```

**День 10-11: Миграция разделов 03-05**
```bash
# Миграция Design
cp docspro/_index.md docspro/03_Design/_index.md
# Редактирование для раздела Design

# Миграция Execution
cp docspro/_index.md docspro/04_Execution/_index.md
# Редактирование для раздела Execution

# Миграция Quality
cp docspro/_index.md docspro/05_Quality/_index.md
# Редактирование для раздела Quality
```

**День 12-13: Миграция разделов 06-08**
```bash
# Миграция Risks
cp docspro/_index.md docspro/06_Risks/_index.md
# Редактирование для раздела Risks

# Миграция Decisions
cp docspro/_index.md docspro/07_Decisions/_index.md
# Редактирование для раздела Decisions

# Миграция Glossary
cp docspro/_index.md docspro/08_KB_glossary/_index.md
# Редактирование для раздела Glossary
```

**День 14: Миграция разделов 09-10**
```bash
# Миграция Reports
cp docspro/_index.md docspro/09_Reports/_index.md
# Редактирование для раздела Reports

# Миграция Artifacts
cp docspro/_index.md docspro/10_Artifacts/_index.md
# Редактирование для раздела Artifacts
```

### Этап 4: Обновление главного индекса (День 15)

#### 4.1 Создание нового главного индекса
```markdown
# Obsidian Knowledge Architect × Iteration Orchestrator (v3.0)

## Обзор проекта
Создание, развитие и поддержка масштабируемой, связной и проверяемой базы знаний в Obsidian.

## Быстрые ссылки
- [Цель проекта](00_Charter/goal.md)
- [Исследования](01_Research/notes.md)
- [Планирование](02_Planning/backlog.md)
- [Архитектура](03_Design/architecture.md)
- [Выполнение](04_Execution/steps/step_001.md)
- [Качество](05_Quality/tests.md)
- [Отчёты](09_Reports/summaries.md)

## Навигация по разделам
- [00_Charter](00_Charter/_index.md) - Цели, миссия и видение проекта
- [01_Research](01_Research/_index.md) - Исследования, требования и анализ
- [02_Planning](02_Planning/_index.md) - Планирование, бэклог и спринты
- [03_Design](03_Design/_index.md) - Архитектура, дизайн и интерфейсы
- [04_Execution](04_Execution/_index.md) - Выполнение, шаги и процессы
- [05_Quality](05_Quality/_index.md) - Качество, тесты и валидация
- [06_Risks](06_Risks/_index.md) - Риски, митигация и мониторинг
- [07_Decisions](07_Decisions/_index.md) - Решения, обоснования и логи
- [08_KB_glossary](08_KB_glossary/_index.md) - Глоссарий, термины и онтология
- [09_Reports](09_Reports/_index.md) - Отчёты, сводки и метрики
- [10_Artifacts](10_Artifacts/_index.md) - Артефакты, результаты и выходы

## Метрики проекта
- **Всего задач**: {{dv.pages().where(p => p.task).length}}
- **Завершено**: {{dv.pages().where(p => p.status = "done").length}}
- **В работе**: {{dv.pages().where(p => p.status = "in-progress").length}}
- **Прогресс**: {{(dv.pages().where(p => p.status = "done").length / dv.pages().where(p => p.task).length * 100).round(1)}}%

## Последние обновления
{{dv.pages().sort(p => p.file.mtime).limit(5).file.link}}

## Статус миграции
- [x] Подготовка инфраструктуры
- [x] Создание MOC шаблонов
- [x] Миграция контента
- [x] Обновление главного индекса
- [ ] Тестирование и валидация
- [ ] Финальная проверка
- [ ] Завершение миграции
```

#### 4.2 Обновление существующих ссылок
```bash
# Поиск всех ссылок на старый _index.md
grep -r "docspro/_index" docspro/

# Замена ссылок на новые MOC
sed -i 's|docspro/_index|docspro/00_Charter/_index|g' docspro/00_Charter/*.md
sed -i 's|docspro/_index|docspro/01_Research/_index|g' docspro/01_Research/*.md
# ... и так далее для каждого раздела
```

### Этап 5: Тестирование и валидация (Дни 16-18)

#### 5.1 Функциональное тестирование
```bash
# Тест загрузки главного индекса
time obsidian-open docspro/_index.md

# Тест загрузки разделов
time obsidian-open docspro/00_Charter/_index.md
time obsidian-open docspro/03_Design/_index.md
time obsidian-open docspro/09_Reports/_index.md

# Тест навигации между разделами
obsidian-open docspro/00_Charter/_index.md
# Проверка ссылок на другие разделы
```

#### 5.2 Тестирование производительности
```bash
# Измерение времени загрузки
for file in docspro/*/_index.md; do
  echo "Testing $file..."
  start_time=$(date +%s%N)
  obsidian-open "$file"
  end_time=$(date +%s%N)
  load_time=$(( (end_time - start_time) / 1000000 ))
  echo "Load time: ${load_time}ms"
done
```

#### 5.3 Валидация связей
```bash
# Проверка корректности ссылок
for file in docspro/*/_index.md; do
  echo "Validating $file..."
  # Проверка внутренних ссылок
  grep -o "\[.*\](.*)" "$file" | while read link; do
    target=$(echo "$link" | sed 's/.*(\(.*\))/\1/')
    if [ ! -f "$target" ] && [ ! -f "docspro/$target" ]; then
      echo "Broken link in $file: $link"
    fi
  done
done
```

### Этап 6: Финальная проверка и завершение (Дни 19-21)

#### 6.1 Проверка целостности
```bash
# Проверка всех файлов
find docspro/ -name "*.md" -exec echo "Checking {}" \; -exec head -5 {} \;

# Проверка структуры папок
tree docspro/ -I "*.git*"

# Проверка размера файлов
find docspro/ -name "*.md" -exec wc -l {} + | sort -n
```

#### 6.2 Создание резервной копии
```bash
# Создание резервной копии старой системы
cp -r docspro docspro-backup-$(date +%Y%m%d)

# Архивирование
tar -czf docspro-backup-$(date +%Y%m%d).tar.gz docspro-backup-$(date +%Y%m%d)
```

#### 6.3 Финальное тестирование
```bash
# Полное тестирование системы
./test-moc-system.sh

# Проверка производительности
./benchmark-moc-performance.sh

# Валидация всех связей
./validate-all-links.sh
```

## План отката

### Условия отката
- Время загрузки > 1с для любого MOC
- Потеря > 5% ссылок
- Ошибки в навигации
- Снижение производительности > 20%

### Процедура отката
```bash
# 1. Остановка новой системы
echo "Stopping new MOC system..."

# 2. Восстановление старой системы
echo "Restoring old MOC system..."
cp docspro-backup-$(date +%Y%m%d)/_index.md docspro/

# 3. Проверка восстановления
echo "Testing restored system..."
obsidian-open docspro/_index.md

# 4. Уведомление команды
echo "Rollback completed. Old system restored."
```

### Время восстановления
- **Критический откат**: < 5 минут
- **Полный откат**: < 30 минут
- **Восстановление данных**: < 2 часов

## Метрики успеха

### Критерии успеха
- **Время загрузки главного индекса**: < 200мс
- **Время загрузки разделов**: < 300мс
- **Время загрузки подразделов**: < 500мс
- **100% корректность ссылок**
- **Улучшение производительности**: > 50%

### KPI миграции
- **Время миграции**: < 21 день
- **Простои**: < 2 часа
- **Ошибки**: < 1 критическая
- **Удовлетворённость**: > 90%

## Риски и митигация

### Технические риски
- **Риск**: Потеря данных при миграции
- **Митигация**: Множественные резервные копии, пошаговое тестирование

- **Риск**: Сложность синхронизации между MOC
- **Митигация**: Автоматизированные скрипты, валидация связей

### Операционные риски
- **Риск**: Сопротивление пользователей
- **Митигация**: Обучение, демонстрация преимуществ

- **Риск**: Задержки в миграции
- **Митигация**: Буфер времени, приоритизация критических разделов

## Заключение

План миграции обеспечивает:
- **Безопасность**: Множественные резервные копии и план отката
- **Эффективность**: Поэтапная миграция с минимальными простоями
- **Качество**: Тщательное тестирование и валидация
- **Контроль**: Мониторинг прогресса и метрики успеха

Миграция готова к выполнению и обеспечит долгосрочную стабильность системы.

---
*Создано: {{date}}*
*Владелец: Solution Architect*
*Статус: Активен*
*Версия: 1.0*

