---
schema: v1
type: standard_item
created: {{date}}
updated: {{date}}
project: <PROJECT-ID>
email: <email@example.com>
tags:
  - standard
status: draft
---

# <Item Name>

## Summary
- <short description>

## Archive
Заметки, связанные с элементом, сохраняйте в подпапке `archive/` рядом с этим файлом.

```button
name Export archive
type command
action shell python scripts/export_archive.py "{{tp_file_path}}"
```
