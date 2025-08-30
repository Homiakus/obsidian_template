---
schema: v1
id: <% tp.date.now("YYYY-MM-DD-HHmmss") %>
type: note
title: <%* t = await tp.system.prompt("Заголовок заметки"); t %>
category: <%* p = await tp.system.prompt("Код категории (CAT-XXX)"); p %>
created: <% tp.date.now("YYYY-MM-DD") %>
---
# <% t %>

…
