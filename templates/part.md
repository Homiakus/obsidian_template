---
schema: v1
id: <% tp.date.now("YYYY-MM-DD-HHmmss") %>
type: part
code: <%* c = await tp.system.prompt("Код изделия (PART-XXXX)"); c %>
title: <%* t = await tp.system.prompt("Название изделия"); t %>
spec: 
material:
categories: []
model_units: mm
model_axis: +Yup
model_scale: 0.001
created: <% tp.date.now("YYYY-MM-DD") %>
---
# <% c %> — <% t %>

## Модели
