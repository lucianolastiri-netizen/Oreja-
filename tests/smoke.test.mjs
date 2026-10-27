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
  'temas', 'radar', 'finanzas', 'inversiones', 'captura', 'doctrina', 'sponsors', 'admision'];
const PRIVATE = ['proyectos', 'agora', 'golden', 'negocios', 'habitos', 'poder', 'cierre', 'temas', 'radar',
  'finanzas', 'inversiones', 'sponsors', 'admision'];
const LOCK = { proyectos: 'pj-locked', agora: 'ag-locked', golden: 'gd-locked', negocios: 'ng-locked', habitos: 'hb-locked',
  poder: 'po-locked', cierre: 'c-locked', temas: 'g-locked', radar: 'rd-locked', finanzas: 'fin-locked',
  inversiones: 'inv-locked', sponsors: 'sp-locked', admision: 'ad-locked' };

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
