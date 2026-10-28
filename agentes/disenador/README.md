# OREJA DISEÑADOR

Agente de diseño de OREJA CEO para Torneo Golden y BS Group. Id de agente: `disenador`.

- **Cuándo corre:** lunes, miércoles y viernes 15:19 (Córdoba), o a mano.
- **Regla de entrada:** cada pieza tiene dueño, marca y la decisión que debe provocar. Máximo una pieza por corrida.
- **Criterio:** consejo de 20 diseñadores usados como criterios de revisión (no como estilos a copiar). Ver `PROMPT.md`.
- **Diálogo:** lee y escribe en `data/users/me/agentes/bitacora`, como el resto de los agentes. Le piden `motor`, `radar`, `barrido`, `gestion`, `cloty-vivo` y `oreja-ceo`; él le pide a `legal` (marcas de terceros, imagen, naming) y a `oreja-ceo` (datos y decisiones).
- **Datos:** `data/users/me/diseno` (bases de marca) y `data/users/me/diseno/piezas` (registro y resultado de cada pieza).
- **Piloto:** carpeta comercial para sponsors de Golden 2027.

`PROMPT.md` es la fuente de verdad del prompt de la tarea programada; si se cambia uno, se cambia el otro.
