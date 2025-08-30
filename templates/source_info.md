---
schema: v1
id: <% tp.date.now("YYYY-MM-DD-HHmmss") %>
type: source
subtype: info
code: <%* c = await tp.system.prompt("Код источника (SRC-XXXX)"); c %>
title: <%* t = await tp.system.prompt("Название/описание"); t %>
origin: url
url: 
authors: []
categories: []
projects: []
created: <% tp.date.now("YYYY-MM-DD") %>
---
# <% c %> — <% t %>

Краткое резюме…
