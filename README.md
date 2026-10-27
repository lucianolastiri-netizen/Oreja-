# OREJA CEO

Tablero personal de Luciano Lastiri (Golden, Europa, BS Group, Dogos), publicado como artefacto de claude.ai:
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
original/           copia de la versión publicada antes del traslado (referencia)
```

Los archivos de `js/` no son módulos ES: el build los concatena dentro de un único `(function(){ … })()`, así que una
función de un archivo puede usar variables de otro. Si agregás un archivo, el prefijo numérico decide dónde cae.

## Comandos

```
npm run build   # escribe dist/oreja-ceo.html
npm test        # build + tests: cada vista en celular y escritorio, titular y visitante, y los flujos principales
```

`node scripts/build.mjs --check original/oreja-ceo.html` compara el build contra la copia original. Pasó en el commit
del traslado; los commits posteriores cambian el código a propósito.

## Publicar

Se publica `dist/oreja-ceo.html` en la misma URL del artefacto, sin tocar `capabilities` (se conservan las declaradas:
`db`, `user`, `sample` y `mcp` con Google Calendar). Antes de publicar, `npm test` tiene que pasar.

## Dónde vive cada dato

Todo lo privado está en `data/users/<id del titular>/…` dentro de la base del artefacto (solo lo ve el titular):
`gestion/items`, `finanzas` (+ `movs`), `inversiones` (+ `ops`), `sponsors/items`, `audiencia`, `admision/items`,
`cierre/dias`, `cierre/reprog`, `radar/items`, `hoy`, `posicion` (+ `conv`, `opor`), `habitos`, `negocios/items`,
`golden` (+ `fechas`), `agora`, `proyectos/items`, `formacion/items`, `resumenes/items`, `notas`, `uso`,
`principios` y `vistas`.

El navegador guarda una copia local como respaldo y preferencias de pantalla (tema, montos ocultos, pestaña de Cloty).

## Cambios desde el traslado

- **Doctrina pasó al espacio privado.** Los principios estaban en `state/principios`, un documento compartido que
  cualquier persona con el link podía leer y pisar, y que un visitante sobrescribía al abrir la página. Ahora viven en
  `data/users/<id>/principios`; la primera vez que abre el titular se copian ahí y se borran del documento viejo.
- **Medición de uso.** Cada apertura de sección se cuenta por día en `data/users/<id>/vistas` (se guardan 120 días). El
  pie del inicio muestra las más abiertas y las que nunca se abrieron, para decidir qué fusionar o sacar.
- **Movimientos después de diciembre.** Las pestañas de mes estaban fijas en septiembre a diciembre de 2026: desde enero
  un movimiento nuevo quedaba sin pestaña. Ahora se suman los meses hasta el actual (máximo 6 a la vista).

## Pendiente

- El trimestre de Finanzas (`MESES`, `HITOS` en `js/04-finanzas.js`) termina el 31/12/2026: el siguiente hay que
  definirlo vos.
- Sponsors separa Apertura de Clausura con una fecha fija (`'2026-07'` en `js/06-sponsors.js`): cambia la temporada
  que viene.
