---
schema: v1
id: <% tp.date.now("YYYY-MM-DD-HHmmss") %>
type: category
code: <%* c = await tp.system.prompt("Код категории (CAT-XXX)"); c %>
title: <%* t = await tp.system.prompt("Название категории"); t %>
status: active
parent: <%* p = await tp.system.prompt("Родитель (CAT-ROOT/CAT-XXX)", "CAT-ROOT"); p %>
owners: [ [[Я]] ]
created: <% tp.date.now("YYYY-MM-DD") %>
updated: <% tp.date.now("YYYY-MM-DD") %>
---
# <% c %> — <% t %>

## Назначение
…

## Подкатегории
- 

## Проекты (активные)
