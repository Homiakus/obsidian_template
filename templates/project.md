---
schema: v1
id: <% tp.date.now("YYYY-MM-DD-HHmmss") %>
type: project
code: <%* t = await tp.system.prompt("Код проекта (PROJ-XXXX)"); t %>
title: <%* n = await tp.system.prompt("Название проекта"); n %>
status: active
primary_category: <%* c = await tp.system.prompt("Primary категория (CAT-XXX)"); c %>
categories: [ <% c %> ]
owners: [ [[Я]] ]
created: <% tp.date.now("YYYY-MM-DD") %>
updated: <% tp.date.now("YYYY-MM-DD") %>
---
# <% t %> — <% n %>

## Цель
…

## Этапы
- [ ] …

## Модели
