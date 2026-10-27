// Simula window.claude para los tests: db en memoria, user, sample y mcp.
// Se inyecta antes de cargar la página; la configuración llega en window.__OREJA_MOCK__.
(function () {
  var cfg = window.__OREJA_MOCK__ || {};
  var store = {}; // path de documento → datos
  var docSubs = {}; // path de documento → [fn]
  var colSubs = {}; // path de colección → [fn]
  var writes = []; // registro de escrituras, para los asserts
  window.__OREJA_DB__ = { store: store, writes: writes };
  Object.keys(cfg.seed || {}).forEach(function (p) { store[p] = JSON.parse(JSON.stringify(cfg.seed[p])); });

  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function parent(p) { return p.slice(0, p.lastIndexOf('/')); }
  function later(fn) { setTimeout(fn, 0); }
  function docSnap(p) { return { id: p.split('/').pop(), exists: p in store, data: function () { return clone(store[p]); }, metadata: { fromCache: false } }; }
  function colSnap(c, opts) {
    var docs = Object.keys(store).filter(function (p) { return parent(p) === c; }).map(function (p) {
      return { id: p.split('/').pop(), data: function () { return clone(store[p]); } };
    });
    if (opts && opts.orderBy) docs.sort(function (a, b) { var x = a.data()[opts.orderBy], y = b.data()[opts.orderBy], s = opts.dir === 'desc' ? -1 : 1; return (x < y ? -1 : x > y ? 1 : 0) * s; });
    if (opts && opts.limit) docs = docs.slice(0, opts.limit);
    return { empty: !docs.length, docs: docs, metadata: { fromCache: false } };
  }
  function notify(p) {
    (docSubs[p] || []).forEach(function (fn) { later(function () { fn(docSnap(p)); }); });
    (colSubs[parent(p)] || []).forEach(function (s) { later(function () { s.fn(colSnap(parent(p), s.opts)); }); });
  }
  function query(c, opts) {
    return {
      orderBy: function (k, dir) { return query(c, Object.assign({}, opts, { orderBy: k, dir: dir })); },
      limit: function (n) { return query(c, Object.assign({}, opts, { limit: n })); },
      doc: function (id) { return docRef(c + '/' + id); },
      onSnapshot: function (fn) { var s = { fn: fn, opts: opts }; (colSubs[c] = colSubs[c] || []).push(s); later(function () { fn(colSnap(c, opts)); }); return function () {}; },
    };
  }
  function docRef(p) {
    return {
      set: function (o) { store[p] = clone(o); writes.push({ op: 'set', path: p, data: clone(o) }); notify(p); return Promise.resolve(); },
      get: function () { return Promise.resolve(docSnap(p)); },
      delete: function () { delete store[p]; writes.push({ op: 'delete', path: p }); notify(p); return Promise.resolve(); },
      collection: function (n) { return query(p + '/' + n, {}); },
      onSnapshot: function (fn) { (docSubs[p] = docSubs[p] || []).push(fn); later(function () { fn(docSnap(p)); }); return function () {}; },
    };
  }
  var db = { doc: docRef, collection: function (c) { return query(c, {}); } };
  var user = { isOwner: function () { return Promise.resolve(cfg.owner !== false); }, id: function () { return Promise.resolve(cfg.uid || 'u1'); } };
  // sample: sin guion rechaza not_granted; con cfg.sampleScript, cada llamada consume un turno
  // [{tool, input} | {text}] y ejecuta las herramientas de la página en orden.
  var script = cfg.sampleScript ? cfg.sampleScript.slice() : null;
  var S = window.__OREJA_SAMPLE__ = { calls: [], results: [] };
  var sample = function (input, opts) {
    if (!script) return Promise.reject({ code: 'not_granted' });
    opts = opts || {};
    var turn = script.shift() || [{ text: 'ok' }];
    S.calls.push({ input: input, tools: (opts.tools || []).map(function (t) { return t.name; }) });
    return (async function () {
      var text = '';
      for (var i = 0; i < turn.length; i++) {
        var st = turn[i];
        if (st.tool) {
          var t = (opts.tools || []).filter(function (x) { return x.name === st.tool; })[0];
          try { S.results.push({ tool: st.tool, ok: true, r: await t.execute(st.input, { signal: opts.signal || new AbortController().signal }) }); }
          catch (e) { S.results.push({ tool: st.tool, ok: false, err: e.message }); }
        } else { text += st.text; if (opts.onText) opts.onText({ text: text, delta: st.text }); }
      }
      return { text: text, truncated: false, modelTierApplied: 'default' };
    })();
  };
  sample.json = function () { return Promise.reject({ code: 'not_granted' }); };
  sample.limits = function () { return Promise.resolve({ maxPromptBytes: 262144, tools: { maxCount: 20 } }); };
  var mcp = {
    watchTool: function (s, t, i, h) { later(function () { h({ type: 'data', result: { payload: { events: [] }, cache: { storedAt: Date.now() } } }); }); return function () {}; },
    callTool: function () { return Promise.resolve({ payload: { id: 'evt1' } }); },
    invalidate: function () { return Promise.resolve(); },
  };
  var caps = { db: db, user: user, sample: cfg.sample === false ? null : sample, mcp: mcp };
  window.claude = { use: function (n) { return new Promise(function (r) { setTimeout(function () { r(caps[n] || null); }, 5); }); } };
})();
