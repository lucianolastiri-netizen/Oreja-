# OREJA CEO

Tablero personal OREJA CEO, publicado como artefacto de claude.ai:
https://claude.ai/artifact/A7fVebDPNCEHggbfn7K6Df

El artefacto es un solo HTML. Acá vive separado en partes para poder cambiarlo sin romper lo que no se toca.

## Estructura

```
src/
  shell/head.html   doctype, <title>, fuentes
  styles/NN-*.css   estilos; el número fija el orden (importa por la cascada)
  views/NN-*.html   una <section> por vista (#home, #temas, #finanzas…)
  js/NN-*.js        un módulo por sección; todos comparten un mismo closure
scripts/build.mjs   une todo en dist/oreja-ceo.html
tests/              tests de humo con Playwright y un window.claude simulado
```

Los archivos de `js/` no son módulos ES: el build los concatena dentro de un único `(function(){ … })()`, así que una
función de un archivo puede usar variables de otro. Si agregás un archivo, el prefijo numérico decide dónde cae.

## Comandos

```
npm run build   # escribe dist/oreja-ceo.html
npm test        # build + tests: cada vista en celular y escritorio, titular y visitante, y los flujos principales
```

`node scripts/build.mjs --check <archivo>` compara el build contra un HTML publicado (sirve para confirmar que una
reorganización no cambió nada). El traslado inicial se verificó así contra la versión 27 del artefacto.

**El repo no lleva datos personales.** Lo privado vive en la base del artefacto (ver abajo), incluido el contexto que
usa Cloty (`data/users/<id>/contexto`, editable en Doctrina). No pegues contexto personal en el código.

## Publicar

Se publica `dist/oreja-ceo.html` en la misma URL del artefacto, sin tocar `capabilities` (se conservan las declaradas:
`db`, `user`, `sample` y `mcp` con Google Calendar). Antes de publicar, `npm test` tiene que pasar.

## Dónde vive cada dato

Todo lo privado está en `data/users/<id del titular>/…` dentro de la base del artefacto (solo lo ve el titular):
`gestion/items`, `finanzas` (+ `movs`), `inversiones` (+ `ops`), `sponsors/items`, `audiencia`, `admision/items`,
`cierre/dias`, `cierre/reprog`, `radar/items`, `hoy`, `posicion` (+ `conv`, `opor`), `habitos`, `negocios/items`,
`golden` (+ `fechas`), `agora`, `proyectos/items`, `formacion/items`, `resumenes/items`, `notas`, `uso`,
`principios`, `vistas`, `contexto`, `agente` (charla de Cloty en vivo) y `agentes` (protocolo, `bitacora`, `parte`).

El navegador guarda una copia local como respaldo y preferencias de pantalla (tema, montos ocultos, pestaña de Cloty).

## Cambios desde el traslado

- **Doctrina pasó al espacio privado.** Los principios estaban en `state/principios`, un documento compartido que
  cualquier persona con el link podía leer y pisar, y que un visitante sobrescribía al abrir la página. Ahora viven en
  `data/users/<id>/principios`; la primera vez que abre el titular se copian ahí y se borran del documento viejo.
- **Medición de uso.** Cada apertura de sección se cuenta por día en `data/users/<id>/vistas` (se guardan 120 días). El
  pie del inicio muestra las más abiertas y las que nunca se abrieron, para decidir qué fusionar o sacar.
- **Movimientos después de diciembre.** Las pestañas de mes estaban fijas en septiembre a diciembre de 2026: desde enero
  un movimiento nuevo quedaba sin pestaña. Ahora se suman los meses hasta el actual (máximo 6 a la vista).

## Cloty en vivo (`#cloty`)

Agente dentro de la página. Usa la capacidad `sample` con herramientas de la propia página:

- **Lee** Gestión, Proyectos, Negocios, Radar, Posición, Hábitos, Agenda (Calendar + barrido), Finanzas, Notas y la
  bitácora de los agentes. Un resumen del estado entra en cada consulta; el detalle lo pide con la herramienta `leer`.
- **Actúa con tu OK**: crear y actualizar temas, agendar en Calendar, registrar movimientos, marcar hábitos, sumar
  principios e ideas, responder a los agentes. Cada escritura muestra una tarjeta y espera Confirmar; si decís que no,
  no se hace. Cerrar un tema exige línea de cierre, igual que en Gestión.
- **Cierra el circuito con los agentes programados**: muestra el último parte (decisión, fallas, Legal), los pedidos
  `para: oreja-ceo` abiertos y quién corrió hoy. Responder un pedido escribe en la bitácora
  `{agente: 'oreja-ceo', para: <agente>, pedido: <respuesta>, ref: <id del pedido>}`; el agente lo lee en su próxima
  corrida. Lo que Cloty hace con tu OK queda como una entrada `cloty-vivo` sin montos ni detalles.
- La charla se guarda en `data/users/<id>/agente` (últimos 30 turnos) y se puede dictar por voz.

## Pendiente

- El trimestre de Finanzas (`MESES`, `HITOS` en `js/04-finanzas.js`) termina el 31/12/2026: el siguiente hay que
  definirlo vos.
- Sponsors separa Apertura de Clausura con una fecha fija (`'2026-07'` en `js/06-sponsors.js`): cambia la temporada
  que viene.
