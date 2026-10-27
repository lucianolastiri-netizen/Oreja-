  // ---------- RADAR (privado; lo alimenta Cloty) ----------
  var RD={}, rdCol=null, rdMode='conectando', rdFilt='nuevo', rdTipo='todos';
  var RTIPOS=[['idea','Idea'],['avance','Avance'],['activo','Activo'],['riesgo','Riesgo']];
  var RDFR={golden:'golden',europa:'europa',bs:'bs',bsgroup:'bs',dogos:'dogos',finanzas:'finanzas',personal:'personal',otro:'otro'};
  function rdAll(){ return Object.keys(RD).map(function(k){ return RD[k]; }).filter(function(x){ return x&&typeof x==='object'&&x.t; }); }
  function rdSave(it){ it.act=nowIso(); RD[it.id]=it; if(rdCol){ rdCol.doc(it.id).set(JSON.parse(JSON.stringify(it)))['catch'](function(){ rdMode='error'; renderRadar(); }); } }
  function rdTipoName(t){ for(var i=0;i<RTIPOS.length;i++)if(RTIPOS[i][0]===t)return RTIPOS[i][1]; return t; }
  function rdPriv(){ var t={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Cloty lo actualiza los viernes con lo que aparece en tus documentos, la memoria de nuestras charlas y Gestión.',local:'<b>Sin conexión a tu espacio privado.</b> El radar solo se ve desde tu cuenta.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[rdMode];
    document.getElementById('rd-priv').innerHTML=t||''; }
  function renderRadar(){ setTimeout(function(){ try{ renderClo(); }catch(e){} },0); rdPriv(); var all=rdAll(), W={riesgo:0,idea:1,avance:2,activo:3};
    var c={nuevo:0,guardada:0,tomada:0,descartada:0,todas:all.length}; all.forEach(function(x){ var e=x.est||'nuevo'; if(c[e]!=null)c[e]++; });
    var f=document.getElementById('rd-filt'); f.innerHTML='';
    [['nuevo','Nuevas'],['guardada','Guardadas'],['tomada','En Gestión'],['descartada','Descartadas'],['todas','Todas']].forEach(function(o){
      var b=el('button','ptab'+(rdFilt===o[0]?' on':''),o[1]); b.type='button'; b.appendChild(el('span','n',String(c[o[0]]||0)));
      b.addEventListener('click',function(){ rdFilt=o[0]; renderRadar(); }); f.appendChild(b); });
    var tp=document.getElementById('rd-tipos'); tp.innerHTML='';
    [['todos','Todos']].concat(RTIPOS).forEach(function(o){ var b=el('button','ptab'+(rdTipo===o[0]?' on':''),o[1]); b.type='button';
      b.addEventListener('click',function(){ rdTipo=o[0]; renderRadar(); }); tp.appendChild(b); });
    var arr=all.filter(function(x){ var e=x.est||'nuevo'; if(rdFilt!=='todas'&&e!==rdFilt)return false; if(rdTipo!=='todos'&&x.tipo!==rdTipo)return false; return true; })
      .sort(function(a,b){ var o=['golden','europa','bs','bsgroup','finanzas','dogos','personal','otro']; var x=o.indexOf(a.frente)-o.indexOf(b.frente); if(x)return x; return (W[a.tipo]||0)-(W[b.tipo]||0); });
    var list=document.getElementById('rd-list'); list.innerHTML='';
    if(!arr.length) list.appendChild(el('p','hint',all.length?'Nada en esta vista.':'Todavía no hay nada en el radar.'));
    arr.forEach(function(it){ var e=it.est||'nuevo'; var card=el('div','ritem'+(e==='descartada'||e==='tomada'?' off':''));
      var top=el('div','rtop'); top.appendChild(el('span','rtipo '+(it.tipo||'idea'),rdTipoName(it.tipo))); top.appendChild(el('b',null,it.t));
      top.appendChild(el('span','tag '+(RDFR[it.frente]||'personal'),frenteName(RDFR[it.frente]||'otro'))); card.appendChild(top);
      if(it.d) card.appendChild(el('p',null,it.d));
      if(it.valor){ var p=el('p'); p.appendChild(el('span','rl','Por qué ahora')); p.appendChild(document.createTextNode(it.valor)); card.appendChild(p); }
      if(it.prox){ var q=el('p'); q.appendChild(el('span','rl','Próximo paso')); q.appendChild(document.createTextNode(it.prox)); card.appendChild(q); }
      var meta=[]; if(it.fuente)meta.push('Fuente: '+it.fuente); if(it.creado)meta.push('anotado '+dm(localDay(it.creado)));
      if(meta.length) card.appendChild(el('span','rsrc',meta.join(' · ')));
      if(e==='tomada') card.appendChild(el('span','rest','En Gestión'+(it.gestionId?' ✓':'')));
      if(e==='descartada'&&it.motivo) card.appendChild(el('span','rest','Descartada: '+it.motivo));
      var ft=el('div','gfoot');
      if(e!=='tomada'){ var tb=el('button','gtask','→ Llevar a Gestión'); tb.type='button';
        tb.addEventListener('click',function(){ var id='r'+Date.now().toString(36);
          var g={id:id,t:it.t,d:(it.d||'')+(it.valor?('\nPor qué ahora: '+it.valor):''),frente:RDFR[it.frente]||'otro',sev:it.tipo==='riesgo'?'warn':'nuevo',origen:{tipo:'radar',de:'Radar de Cloty',ref:it.id},quien:'',fecha:'',prox:it.prox||'',est:'nuevo',hist:[],creado:nowIso(),reprog:0};
          gHist(g,'Llevado desde el Radar'); gSave(g); renderGest(); it.est='tomada'; it.gestionId=id; rdSave(it); renderRadar(); }); ft.appendChild(tb); }
      if(e==='nuevo'){ var sb=el('button','gtask','Guardar para después'); sb.type='button'; sb.addEventListener('click',function(){ it.est='guardada'; rdSave(it); renderRadar(); }); ft.appendChild(sb); }
      if(e==='guardada'||e==='descartada'){ var rb=el('button','gtask','Volver a nuevas'); rb.type='button'; rb.addEventListener('click',function(){ it.est='nuevo'; delete it.motivo; rdSave(it); renderRadar(); }); ft.appendChild(rb); }
      if(e!=='descartada'&&e!=='tomada'){ var db=el('button','gtask','Descartar'); db.type='button';
        db.addEventListener('click',function(){ if(ft.querySelector('.gaddh'))return; var w=el('div','gaddh'); var i=el('input'); i.type='text'; i.placeholder='¿Por qué no va? Una línea';
          var ok=el('button','minibtn','Descartar'); ok.type='button'; function go(){ var v=i.value.trim(); if(!v){ i.focus(); return; } it.est='descartada'; it.motivo=v; rdSave(it); renderRadar(); }
          ok.addEventListener('click',go); i.addEventListener('keydown',function(ev){ if(ev.key==='Enter')go(); }); w.appendChild(i); w.appendChild(ok); card.appendChild(w); setTimeout(function(){ try{i.focus();}catch(x){} },0); }); ft.appendChild(db); }
      card.appendChild(ft); list.appendChild(card); });
    setT('rd-count',c.nuevo+' nuevas · '+c.tomada+' en Gestión');
    var t=document.getElementById('tp-radar'); if(t){ t.textContent=rdMode==='ajeno'?'privado':(c.nuevo?c.nuevo+' sin tratar':'al día'); t.className='tp'+(c.nuevo?' warn':''); }
    renderFrentes(); }
  function radarAttach(DBx,uid){ try{ rdCol=DBx.doc('data/users/'+uid+'/radar').collection('items'); }catch(e){ rdMode='local'; renderRadar(); return; }
    rdCol.onSnapshot(function(qs){ rdMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } });
      RD=m; var rl=document.getElementById('rd-list'); if(rl.contains(document.activeElement))return; renderRadar(); },function(){ rdMode='error'; renderRadar(); }); }

