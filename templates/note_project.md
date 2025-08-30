---
schema: v1
id: <% tp.date.now("YYYY-MM-DD-HHmmss") %>
type: note
title: <%* t = await tp.system.prompt("Заголовок заметки"); t %>
project: <%* p = await tp.system.prompt("Код проекта (PROJ-XXXX)"); p %>
created: <% tp.date.now("YYYY-MM-DD") %>
---
# <% t %>

…
