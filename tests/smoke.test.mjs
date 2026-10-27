// Tests de humo: abre el build con un window.claude simulado y recorre todas las vistas.
//   npm test   (corre el build antes)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = pathToFileURL(path.join(ROOT, 'dist', 'oreja-ceo.html')).href;
const MOCK = fs.readFileSync(path.join(ROOT, 'tests', 'mock-claude.js'), 'utf8');

const VIEWS = ['home', 'proyectos', 'agora', 'golden', 'negocios', 'habitos', 'poder', 'cierre', 'hoy', 'frentes',
  'temas', 'radar', 'finanzas', 'inversiones', 'captura', 'doctrina', 'sponsors', 'admision', 'cloty'];
const PRIVATE = ['proyectos', 'agora', 'golden', 'negocios', 'habitos', 'poder', 'cierre', 'temas', 'radar',
  'finanzas', 'inversiones', 'sponsors', 'admision', 'cloty'];
const LOCK = { proyectos: 'pj-locked', agora: 'ag-locked', golden: 'gd-locked', negocios: 'ng-locked', habitos: 'hb-locked',
  poder: 'po-locked', cierre: 'c-locked', temas: 'g-locked', radar: 'rd-locked', finanzas: 'fin-locked',
  inversiones: 'inv-locked', sponsors: 'sp-locked', admision: 'ad-locked', cloty: 'cv-locked' };

let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser?.close(); });

async function open(cfg, viewport, extra, now) {
  const ctx = await browser.newContext({ viewport, ...extra });
  const page = await ctx.newPage();
  if (now) await page.clock.install({ time: now });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text()) && !/ERR_/.test(m.text())) errors.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.addInitScript(`window.__OREJA_MOCK__=${JSON.stringify(cfg)};\n${MOCK}`);
  await page.goto(PAGE);
  await page.waitForTimeout(200); // deja resolver claude.use() y los primeros onSnapshot
  return { ctx, page, errors };
}
async function go(page, v) {
  await page.evaluate((h) => { location.hash = h; }, v);
  await page.waitForFunction((id) => document.getElementById('v-' + id)?.classList.contains('active'), v);
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const [name, vp] of [['celular', { width: 390, height: 844 }], ['escritorio', { width: 1280, height: 900 }]]) {
  test(`titular · ${name}: todas las vistas abren sin errores ni scroll horizontal`, async () => {
    const { ctx, page, errors } = await open({ owner: true }, vp);
    for (const v of VIEWS) {
      await go(page, v);
      assert.ok((await overflow(page)) <= 1, `${v}: scroll horizontal en ${name}`);
      if (LOCK[v]) assert.equal(await page.isVisible('#' + LOCK[v]), false, `${v}: el titular ve el candado`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test('visitante: las secciones privadas quedan bloqueadas y no se escribe nada', async () => {
  const { ctx, page, errors } = await open({ owner: false }, { width: 390, height: 844 });
  for (const v of PRIVATE) {
    await go(page, v);
    assert.equal(await page.isVisible('#' + LOCK[v]), true, `${v}: el visitante no ve el candado`);
  }
  const writes = await page.evaluate(() => window.__OREJA_DB__.writes);
  assert.deepEqual(writes, [], 'un visitante no debería escribir en la base');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Gestión: un tema nuevo se guarda en el espacio privado y aparece en la lista', async () => {
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1' }, { width: 1280, height: 900 });
  await go(page, 'temas');
  await page.fill('#gest-add-input', 'Llamar a Rodrigo por el Distrito');
  await page.click('#gest-add-btn');
  await page.waitForSelector('#gest-list .gitem');
  assert.match(await page.textContent('#gest-list'), /Llamar a Rodrigo/);
  const paths = await page.evaluate(() => Object.keys(window.__OREJA_DB__.store));
  assert.ok(paths.some((p) => p.startsWith('data/users/u1/gestion/items/')), 'no se escribió en data/users/u1/gestion/items');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Finanzas: un movimiento manual suma en el mes', async () => {
  const { ctx, page, errors } = await open({ owner: true }, { width: 1280, height: 900 });
  await go(page, 'finanzas');
  await page.fill('#mv-f', '2026-10-15');
  await page.fill('#mv-d', 'Nafta');
  await page.fill('#mv-m', '85.000');
  await page.click('#mv-add');
  await page.click('#mv-meses .ptab:has-text("Octubre")');
  assert.match(await page.textContent('#mv-list'), /Nafta/);
  assert.match(await page.textContent('#mv-sum'), /85\.000/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Doctrina: los principios pasan del documento compartido al espacio privado', async () => {
  const items = [{ id: 'p1', texto: 'Principio propio de prueba', autor: 'Yo', area: 'foco' }];
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1', seed: { 'state/principios': { items } } }, { width: 1280, height: 900 });
  await page.waitForFunction(() => !('state/principios' in window.__OREJA_DB__.store));
  const priv = await page.evaluate(() => window.__OREJA_DB__.store['data/users/u1/principios']);
  assert.deepEqual(priv, { items });
  await go(page, 'doctrina');
  assert.match(await page.textContent('#princ-list'), /Principio propio de prueba/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Uso: cada apertura de sección queda contada y se muestra en el inicio', async () => {
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1' }, { width: 1280, height: 900 });
  for (const v of ['temas', 'home', 'temas', 'hoy', 'home']) await go(page, v);
  await page.waitForFunction(() => {
    const d = window.__OREJA_DB__.store['data/users/u1/vistas'];
    return d && Object.values(d.dias).some((x) => x.temas === 2 && x.hoy === 1);
  });
  await page.waitForSelector('#uso-vistas:not([hidden])');
  assert.match(await page.textContent('#uso-vistas'), /Gestión 2 · Hoy 1/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Finanzas: en enero de 2027 aparece la pestaña del mes y el movimiento se ve', async () => {
  const { ctx, page, errors } = await open({ owner: true }, { width: 390, height: 844 }, {}, new Date('2027-01-12T10:00:00'));
  await go(page, 'finanzas');
  assert.match(await page.textContent('#mv-meses'), /Enero/);
  await page.fill('#mv-d', 'Supermercado');
  await page.fill('#mv-m', '40000');
  await page.click('#mv-add');
  assert.match(await page.textContent('#mv-meses .ptab.on'), /Enero/);
  assert.match(await page.textContent('#mv-list'), /Supermercado/);
  assert.equal(await page.isVisible('#mv-pasar'), false, 'enero no está en el seguimiento del trimestre');
  assert.deepEqual(errors, []);
  await ctx.close();
});

// ---------- Cloty en vivo ----------
const HOY = new Date().toISOString();
async function enviar(page, txt) {
  await go(page, 'cloty');
  await page.fill('#cv-in', txt);
  await page.click('#cv-send');
}
const store = (page) => page.evaluate(() => window.__OREJA_DB__.store);
const resultados = (page) => page.evaluate(() => window.__OREJA_SAMPLE__.results);

test('Cloty en vivo: crea un tema solo después de que Oreja confirma, y deja rastro en la bitácora', async () => {
  const script = [[{ tool: 'crear_tema', input: { titulo: 'Mandar propuesta a Heineken', frente: 'golden', fecha: '2026-11-03', prox: 'Armar el one-pager' } }, { text: 'Listo, quedó en Gestión.' }]];
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1', sampleScript: script, seed: { 'data/users/u1/contexto': { texto: 'CONTEXTO DE PRUEBA XYZ' } } }, { width: 390, height: 844 });
  await enviar(page, 'Anotá mandar la propuesta a Heineken para el 3/11');
  await page.waitForSelector('.cvconf');
  assert.match(await page.textContent('.cvconf'), /Mandar propuesta a Heineken/);
  assert.ok((await overflow(page)) <= 1, 'la tarjeta de confirmación desborda en celular');
  await page.click('.cvconf button:has-text("Confirmar")');
  await page.waitForSelector('.cvmsg.a:has-text("Listo, quedó en Gestión.")');
  const st = await store(page);
  const tema = Object.entries(st).find(([k, v]) => k.startsWith('data/users/u1/gestion/items/') && v.t === 'Mandar propuesta a Heineken');
  assert.ok(tema, 'el tema no se guardó');
  assert.equal(tema[1].fecha, '2026-11-03');
  await page.waitForFunction(() => Object.keys(window.__OREJA_DB__.store).some((k) => k.startsWith('data/users/u1/agentes/bitacora/cloty-vivo-')));
  const bit = Object.entries(await store(page)).find(([k]) => k.includes('/agentes/bitacora/cloty-vivo-'))[1];
  assert.match(bit.hizo, /creó un tema/);
  assert.doesNotMatch(bit.hizo, /Heineken/, 'la bitácora no debería llevar el detalle');
  const chat = (await store(page))['data/users/u1/agente'];
  assert.equal(chat.turnos.length, 2);
  const prompt = (await page.evaluate(() => window.__OREJA_SAMPLE__.calls[0].input[0].content));
  assert.match(prompt, /CONTEXTO DE PRUEBA XYZ/, 'el contexto privado no llega al prompt');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Cloty en vivo: si Oreja no confirma, no cambia nada', async () => {
  const script = [[{ tool: 'crear_tema', input: { titulo: 'Algo que no quiero', frente: 'otro' } }, { text: 'Ok, no lo cargo.' }]];
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1', sampleScript: script }, { width: 1280, height: 900 });
  await enviar(page, 'Cargá algo');
  await page.waitForSelector('.cvconf');
  await page.click('.cvconf button:has-text("No")');
  await page.waitForSelector('.cvmsg.a:has-text("Ok, no lo cargo.")');
  const r = await resultados(page);
  assert.equal(r[0].ok, false);
  assert.match(r[0].err, /no lo confirmó/);
  assert.ok(!Object.values(await store(page)).some((v) => v && v.t === 'Algo que no quiero'));
  assert.ok(!Object.keys(await store(page)).some((k) => k.includes('/agentes/bitacora/')), 'sin acciones no hay entrada en la bitácora');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Cloty en vivo: no cierra un tema sin línea de cierre y cuenta la reprogramación', async () => {
  const seed = { 'data/users/u1/gestion/items/t1': { id: 't1', t: 'Llamar a Rodrigo', frente: 'bs', est: 'curso', fecha: '2026-10-20', prox: 'Llamar', hist: [], creado: HOY, reprog: 1 } };
  const script = [[
    { tool: 'actualizar_tema', input: { id: 't1', estado: 'hecho' } },
    { tool: 'actualizar_tema', input: { id: 't1', fecha: '2026-11-05' } },
    { text: 'Movido al 5/11.' },
  ]];
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1', sampleScript: script, seed }, { width: 1280, height: 900 });
  await enviar(page, 'Cerrá lo de Rodrigo, o si no pasalo al 5/11');
  await page.waitForSelector('.cvconf');
  await page.click('.cvconf button:has-text("Confirmar")');
  await page.waitForSelector('.cvmsg.a:has-text("Movido al 5/11.")');
  const r = await resultados(page);
  assert.equal(r[0].ok, false);
  assert.match(r[0].err, /línea de cierre/);
  const t1 = (await store(page))['data/users/u1/gestion/items/t1'];
  assert.equal(t1.est, 'curso');
  assert.equal(t1.fecha, '2026-11-05');
  assert.equal(t1.reprog, 2);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Agentes: el parte y los pedidos abiertos se ven, y la respuesta vuelve al agente por la bitácora', async () => {
  const hoy = new Date(); const f = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  const seed = {
    [`data/users/u1/agentes/parte/${f}`]: { fecha: f, decision: 'Definir si se firma con la marca X', lectura: 'Formación no se usa.', rutinas: { fallas: [{ nombre: 'Barrido', hora: '07:50', motivo: 'límite de uso', reintento: 'sí' }], noCorrieron: [] } },
    'data/users/u1/agentes/bitacora/legal-1': { id: 'legal-1', agente: 'legal', ts: HOY, estado: 'ok', hizo: 'Boletín revisado', hallazgos: [], para: 'oreja-ceo', pedido: '¿Llevamos el contrato al abogado?' },
    'data/users/u1/agentes/bitacora/radar-1': { id: 'radar-1', agente: 'radar', ts: HOY, estado: 'fallo', hizo: 'No pudo leer', hallazgos: [], para: 'todos', pedido: '' },
  };
  const { ctx, page, errors } = await open({ owner: true, uid: 'u1', seed }, { width: 390, height: 844 });
  assert.match(await page.textContent('#tp-cv'), /1 rutina con falla/);
  await go(page, 'cloty');
  const txt = await page.textContent('#cv-parte');
  assert.match(txt, /Definir si se firma con la marca X/);
  assert.match(txt, /Barrido/);
  assert.match(txt, /¿Llevamos el contrato al abogado\?/);
  assert.match(txt, /Radar · fallo/);
  await page.click('#cv-parte button:has-text("Responder")');
  await page.fill('#cv-parte .gaddh input', 'Sí, llevalo el jueves');
  await page.click('#cv-parte .gaddh button');
  await page.waitForFunction(() => !document.getElementById('cv-parte').textContent.includes('¿Llevamos el contrato'));
  const resp = Object.values(await store(page)).find((v) => v && v.agente === 'oreja-ceo');
  assert.equal(resp.para, 'legal');
  assert.equal(resp.ref, 'legal-1');
  assert.equal(resp.pedido, 'Sí, llevalo el jueves');
  assert.ok((await overflow(page)) <= 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});
