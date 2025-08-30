# CTM Vault Starter — Система знаний с масками

CTM Vault Starter предоставляет структурированную систему для работы с базой знаний, включая проекты, категории, и различные источники данных. Это каркас для вашего Obsidian Vault, включающий CTM-маски для организации заметок, скрипты для обработки и автоматической категоризации, а также дополнительные плагины для удобства работы с проектами и категориями.

## Что внутри:
- **1_PROJECTS/** — папка для проектов (созданы): PROJ-HYDROPILOT, PROJ-ONE24, PROJ-ONEPAP1, PROJ-TABLE-PEN, PROJ-LINIYA-ROZLIVA
- **2_CATEGORIES/** — папка для категорий (LLM, MED, ENG, HYP, HLTH, ACC, KB, LNX, WIN, TRIZ, SYSAN, DEV, ELEC, CNMKT)
- **3_RESOURCES/** — ресурсы: части, системы, источники, законы
- **kb/** — отдельная папка для структурированной базы знаний
- **kb/contacts/** — контакты команды; заметки по шаблону `contact_template.md`
- **schemas/** — JSON Schema v1 для разных типов (проекты, категории, части, источники, заметки)
- **scripts/** — служебные скрипты: валидация фронтматтера (`validate_frontmatter.py`), недельный отчёт (`report_week.py`), экспорт архивов (`export_archive.py`)
- **vault_watcher.py** — наблюдатель, автоматически переносит файлы и обрабатывает 3D-модели
- **templates/** — универсальные шаблоны для создания заметок на основе масок; включает `contact_template.md` и `standard_item_template.md` с почтовой интеграцией и кнопкой экспорта архива
- **plugin/obsidian-mask-builder/** — плагин для Obsidian, который позволяет создавать заметки на основе масок
- **.gitattributes** — для использования Git LFS с большими бинарными файлами

Подробнее об архитектуре см. [docspro/architecture/structure.md](docspro/architecture/structure.md).

Заметки проектов и базы знаний могут содержать подпапку `archive/` для хранения материалов; кнопка `Export archive` в шаблоне `standard_item_template.md` выгружает содержимое в каталог `export/`.


## Установка и настройка
1. Скопируйте все файлы в корень вашего Obsidian Vault или внутрь репозитория.
2. Обновите путь в `vault_watcher.py` в параметре `CONFIG["vault"]`.
3. Установите зависимости для pre-commit:
   ```bash
   pip install pre-commit jsonschema pyyaml
   pre-commit install
   ```
4. Установите Git LFS:
   ```bash
   git lfs install
   git add .gitattributes && git commit -m "Enable LFS"
   ```

## Использование

* Для создания новой заметки по маске без плагина:
  1. Создайте файл в папке `0_INBOX` с именем, например: `[M:NOTE-PRJ.ENG.DRA.INT@PROJ-HYDROPILOT] План.md`.
  2. Запустите наблюдатель:
     ```bash
     python3 vault_watcher.py
     ```
  3. Заметка будет автоматически перемещена в `1_PROJECTS/PROJ-HYDROPILOT/notes/` с правильным фронтматтером.

* Для создания заметки в базе знаний (KB):
  * Во фронтматтере добавьте `kb: true` или используйте `.KB` в маске, например: `NOTE-CAT.KB.AC.PUB@CAT-KB`. Это переместит заметку в папку `2_CATEGORIES/CAT-KB/notes/`.

## Плагин Mask Builder (опционально)

1. Папка `plugin/obsidian-mask-builder` содержит исходники плагина для Obsidian.
2. Чтобы установить плагин:
   * Включите «Developer Mode» в Obsidian и выберите «Load unpacked plugin», указав эту папку.
   * Для сборки плагина потребуется esbuild/rollup.

## Маски

Маски в формате `E[-S][.A1][.A2]...[.L][.C][.F][+R...][@ANCHOR]` используются для автоматической категоризации заметок.
Пример: `DEC-ADR.MED.ACC.AC.INT@PROJ-HYDROPILOT+LAW-ISO17025`.

### Коды областей:

* LLM, MED, ENG, HYP, HLTH, ACC, KB, LNX, WIN, TRIZ, SYSAN, DEV, ELEC, CNMKT

### Статусы:

* DRA (draft), AC (active), PAU (paused), DON (done), DEP (deprecated)

### Доступ:

* PUB (public), INT (internal), PRV (private)

### Форматы:

* MD (Markdown), GLB (3D Model), CAD (CAD Files), PDF, PNG, SRC (source code)

## Ограничения

* Маска должна иметь ровно одну привязку (проект или категория).
* Маска может содержать не более 5 областей.
* Одно имя файла не должно превышать 140 символов.

## Проекты:

* PROJ-HYDROPILOT — Hydropilot
* PROJ-ONE24 — One24
* PROJ-ONEPAP1 — Onepap1
* PROJ-TABLE-PEN — Table, pen
* PROJ-LINIYA-ROZLIVA — Линия розлива
