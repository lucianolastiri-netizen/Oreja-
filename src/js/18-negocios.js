  // ---------- NEGOCIOS (privado: generación → filtro → plan) ----------
  var NG={}, ngCol=null, ngMode='conectando', ngFilt='idea', ngOpen={}, ngBusy={}, NGSAMPLE=null;
  var ngBody=document.getElementById('ng-body');
  var NGLADO={golden:'Golden',bs:'BS Group',propio:'Propio'};
  var NGCRIT=[['a','Aprendizaje','¿Te enseña algo que todavía no sabés hacer?'],['r','Relación','¿Construye o repara una relación que va a importar en 2028?'],['roi','ROI','¿Tiene ingreso atribuible y proporcional al esfuerzo?'],['m','Marca','¿Es un caso mostrable con tu nombre asociado?'],['u','Urgencia','¿La urgencia es real o es la de otro? Sí = real.']];
  function ngLock(on){ document.getElementById('ng-locked').hidden=!on; ngBody.hidden=!!on; }
  function ngSave(it){ it.act=nowIso(); NG[it.id]=it; if(ngCol){ ngCol.doc(it.id).set(JSON.parse(JSON.stringify(it)))['catch'](function(){ ngMode='error'; renderNg(); }); } }
  function ngAll(){ return Object.keys(NG).map(function(k){ return NG[k]; }).filter(function(x){ return x&&x.id&&x.t; }).sort(function(a,b){ return String(b.act||b.creado||'')<String(a.act||a.creado||'')?-1:1; }); }
  function ngVer(it){ var c=it.c||{}, si=0, n=0; NGCRIT.forEach(function(k){ if(c[k[0]])n++; if(c[k[0]]==='si')si++; }); return {si:si,n:n,v:n<5?'falta':(si>=3?'pasa':(si===1&&c.u==='si'?'solourg':'nopasa'))}; }
  // El contexto personal vive en data/users/<id>/contexto (se edita en Doctrina), no en el código: el repo es público.
  var CTX={texto:''};
  function ngCtx(){ var ap=(typeof PO==='object'&&PO.ap)||{};
    return (CTX.texto||'CONTEXTO DE OREJA: todavía sin cargar (se completa en Oreja › Doctrina › Contexto para Cloty).')+'\n'+
      '- Apuesta declarada en Golden: '+(ap.golden||'sin definir')+'. Apuesta declarada en BS Group: '+(ap.bs||'sin definir')+'.\n'+
      '- NUNCA inventes números, precios, montos, nombres de contactos ni fechas. Donde haga falta un dato, escribí [completar: qué dato y dónde conseguirlo].\n'; }
  function ngCard(it){ var et=it.etapa||'idea', card=el('div','gitem'+((et==='descartada'||et==='archivada'||et==='cerrada')?' done':''));
    var head=el('button','ghead'); head.type='button'; head.setAttribute('aria-expanded',ngOpen[it.id]?'true':'false');
    var gh=el('span','gh'); gh.appendChild(el('b',null,it.t));
    var meta=[NGLADO[it.lado]||'Sin lado', it.origen==='motor'?'propuesta del motor':'tuya']; var vr=ngVer(it); if(vr.n===5)meta.push('test '+vr.si+'/5'); if(it.plan&&it.plan.secciones)meta.push('plan armado'); if(it.plan2){ var _dd=p2days(it.plan2.decision.fecha); meta.push(_dd==null?'decisión sin fecha':(_dd<0?'decisión vencida hace '+(-_dd)+' d':'decide en '+_dd+' d')); }
    gh.appendChild(el('span','gm',meta.join(' · ')));
    var nfl=[]; if(et==='idea'&&it.creado){ var _ag=dayDiff(localDay(it.creado),todayKey()); if(_ag>14)nfl.push(['crit',_ag+' d sin filtrar: decidí']); } if(it.volvio&&et==='idea')nfl.push(['','volvió del archivo']); if(et==='archivada'&&!ngIsDate(it.revisar))nfl.push(['crit','archivada sin fecha real']); if(et==='archivada'&&ngIsDate(it.revisar))nfl.push(['','vuelve el '+dm(it.revisar)]);
    if(nfl.length){ var _fl=el('span','gflags'); nfl.forEach(function(f){ _fl.appendChild(el('span','gflag'+(f[0]?' '+f[0]:''),f[1])); }); gh.appendChild(_fl); }
    head.appendChild(gh);
    head.appendChild(el('span','gstp '+({avanza:'st-curso',descartada:'',archivada:'st-esperando',cerrada:'st-hecho'}[et]||''),({idea:'Sin filtrar',avanza:'Avanza',archivada:'Archivada',descartada:'Descartada',cerrada:'Decidida'})[et]||et));
    head.addEventListener('click',function(){ ngOpen[it.id]=!ngOpen[it.id]; renderNg(); }); card.appendChild(head);
    if(ngOpen[it.id]) card.appendChild(ngBodyOf(it)); return card; }
  function ngBodyOf(it){ var b=el('div','gbody'), et=it.etapa||'idea';
    if(it.d) b.appendChild(el('p','gdet',it.d));
    if(it.caso&&it.caso.nombre){ var cs=el('div','ngcaso'); cs.appendChild(el('div','vf','Caso externo · verificalo antes de usarlo')); cs.appendChild(el('div',null,it.caso.nombre+(it.caso.donde?' ('+it.caso.donde+')':'')+': '+(it.caso.que||''))); if(it.porque)cs.appendChild(el('div','gm','Por qué acá: '+it.porque)); b.appendChild(cs); }
    var ls=selOf([['golden','Golden'],['bs','BS Group'],['propio','Propio']],it.lado||'golden'); ls.addEventListener('change',function(){ it.lado=ls.value; if(it.plan)it.plan.desactualizado=true; ngSave(it); renderNg(); });
    var lw=el('div','pofld'); lw.appendChild(poLabel('De qué lado cae',ls)); b.appendChild(lw);
    // filtro
    b.appendChild(el('h4',null,'Filtro')).style.cssText='font-family:var(--display);font-size:14px;margin:14px 0 4px';
    var c=it.c||(it.c={});
    NGCRIT.forEach(function(k){ var row=el('div','acrit'), q=el('div','cq'); q.appendChild(el('b',null,k[1])); q.appendChild(el('span',null,(it.cp&&it.cp[k[0]])?('Cloty: '+it.cp[k[0]]):k[2])); row.appendChild(q);
      var sg=el('div','seg'); sg.setAttribute('role','group'); sg.setAttribute('aria-label',k[1]);
      [['si','Sí'],['du','Dudoso'],['no','No']].forEach(function(o){ var bt=el('button',o[0]+(c[k[0]]===o[0]?' on':''),o[1]); bt.type='button'; bt.setAttribute('aria-pressed',c[k[0]]===o[0]?'true':'false');
        bt.addEventListener('click',function(){ c[k[0]]=o[0]; if((it.etapa||'idea')!=='descartada'&&ngAllNo(it)){ it.etapa='descartada'; it.motivo='5 de 5 en no (regla automática)'; ngHist(it,'Descartada por la regla de cinco no'); ngFilt='descartada'; } ngSave(it); renderNg(); }); sg.appendChild(bt); });
      row.appendChild(sg); b.appendChild(row); });
    var vr=ngVer(it), vd=el('div','ngver'+(vr.v==='pasa'?' pasa':(vr.v==='falta'?'':' nopasa')));
    var lab={falta:'Faltan '+(5-vr.n)+' criterios',pasa:'Pasa: avanzá al plan',nopasa:'No pasa: descartá, o archivá con fecha',solourg:'Solo urgencia: no alcanza'}[vr.v];
    vd.appendChild(el('b',null,lab)); vd.appendChild(el('span','sc',vr.si+'/5')); b.appendChild(vd);
    var fa=el('div','gfoot');
    if(NGSAMPLE&&et==='idea'){ var sb=el('button','gtask',ngBusy[it.id]==='test'?'Pensando…':'✦ Sugerencia de Cloty'); sb.type='button'; sb.disabled=!!ngBusy[it.id]; sb.addEventListener('click',function(){ ngSuggest(it); }); fa.appendChild(sb); }
    var _llenos=ngAvanzan(it.id);
    if(et!=='avanza'&&et!=='cerrada'){ var av=el('button','gtask',vr.v==='pasa'?'→ Avanzá al plan':'Avanzar contra el test'); av.type='button'; av.disabled=vr.v==='falta'||_llenos.length>=NG_TOPE;
      av.addEventListener('click',function(){ if(ngAvanzan(it.id).length>=NG_TOPE)return; it.etapa='avanza'; it.excepcion=vr.v!=='pasa'; it.veredicto=vr.v; ngHist(it,'Avanza al plan ('+vr.si+'/5)'); ngSave(it); ngFilt='avanza'; renderNg(); }); fa.appendChild(av); }
    if(et==='avanza'){ var dz=el('button','gtask','✓ Decisión tomada'); dz.type='button'; dz.addEventListener('click',function(){ ngAsk(fa,'¿Qué se decidió? (ej.: firmado con Rodrigo el 20/11)',function(v){ it.etapa='cerrada'; it.cierre=v; it.cerradaEn=todayKey(); ngHist(it,'Decidida: '+v); ngSave(it); ngFilt='cerrada'; renderNg(); }); }); fa.appendChild(dz); }
    if(et!=='archivada'&&et!=='cerrada'){ var ar=el('button','gtask','Archivar con fecha'); ar.type='button'; ar.addEventListener('click',function(){ ngAskDate(fa,'¿Qué día vuelve a decidirse?',function(v){ it.etapa='archivada'; it.revisar=v; ngHist(it,'Archivada hasta el '+dm(v)); ngSave(it); renderNg(); }); }); fa.appendChild(ar); }
    if(et==='archivada'&&!ngIsDate(it.revisar)){ var fx=el('button','gtask','Poner fecha real'); fx.type='button'; fx.addEventListener('click',function(){ ngAskDate(fa,'¿Qué día vuelve?',function(v){ it.revisarTxt=it.revisar; it.revisar=v; ngSave(it); renderNg(); }); }); fa.appendChild(fx); }
    if(et!=='descartada'){ var ds=el('button','gtask','Descartar'); ds.type='button'; ds.addEventListener('click',function(){ ngAsk(fa,'¿Por qué no va? Una línea',function(v){ it.etapa='descartada'; it.motivo=v; ngSave(it); renderNg(); }); }); fa.appendChild(ds); }
    if(et==='archivada'||et==='descartada'||et==='cerrada'){ var vb=el('button','gtask','Volver a sin filtrar'); vb.type='button'; vb.addEventListener('click',function(){ it.etapa='idea'; ngSave(it); ngFilt='idea'; renderNg(); }); fa.appendChild(vb); }
    b.appendChild(fa);
    if(et==='archivada'&&it.revisar) b.appendChild(el('p','gdet','Vuelve: '+(ngIsDate(it.revisar)?dm(it.revisar)+'/'+it.revisar.slice(0,4):it.revisar)));
    if(et==='cerrada'&&it.cierre) b.appendChild(el('p','gdet','Decidido: '+it.cierre+(it.cerradaEn?' ('+dm(it.cerradaEn)+')':'')));
    if(et!=='avanza'&&et!=='cerrada'&&_llenos.length>=NG_TOPE) b.appendChild(el('div','ngrule','Tope de '+NG_TOPE+' ideas avanzando: '+_llenos.map(function(x){ return x.t; }).join(' · ')+'. Para que entre esta, cerrá o archivá una de esas.'));
    if(et==='descartada'&&it.motivo) b.appendChild(el('p','gdet','Descartada: '+it.motivo));
    if(it.excepcion&&et==='avanza') b.appendChild(el('p','gdet','Avanza contra el test: queda registrado como excepción.')).style.color='var(--crit)';
    // plan
    if(et==='avanza'){ var ph=el('h4',null,'Plan de negocio · '+(it.lado==='bs'?'para vender a Nacho y Rodrigo':(it.lado==='golden'?'para decidir con tus socios':'propio'))); ph.style.cssText='font-family:var(--display);font-size:14px;margin:18px 0 4px'; b.appendChild(ph);
      if(it.plan2){ b.appendChild(ngP2(it)); } else {
      var p2w=el('div','gfoot'), p2bt=el('button','gtask','▦ Plan con números'); p2bt.type='button'; p2bt.addEventListener('click',function(){ it.plan2=p2Skel(it); ngSave(it); renderNg(); }); p2w.appendChild(p2bt); p2w.appendChild(el('span','hint','Fecha de decisión, supuestos con origen, modelo editable'+(it.lado==='bs'?' y tu pedido':'')+'.')); b.appendChild(p2w);
      if(it.plan&&it.plan.desactualizado) b.appendChild(el('p','hint','Cambiaste el lado después de armar el plan: conviene regenerarlo.'));
      var pf=el('div','gfoot');
      if(NGSAMPLE){ var pb=el('button','gtask',ngBusy[it.id]==='plan'?'Armando el plan…':(it.plan?'✦ Regenerar plan':'✦ Armar plan completo')); pb.type='button'; pb.disabled=!!ngBusy[it.id];
        pb.addEventListener('click',function(){ if(it.plan&&!pb.dataset.ok){ pb.dataset.ok='1'; pb.textContent='¿Reemplazar el plan actual? Tocá de nuevo'; setTimeout(function(){ delete pb.dataset.ok; pb.textContent='✦ Regenerar plan'; },3000); return; } ngPlan(it); }); pf.appendChild(pb); }
      else pf.appendChild(el('span','hint','El motor necesita permiso para consultar a Claude. Mientras tanto, escribí el plan con la plantilla.'));
      if(!it.plan){ var tb=el('button','gtask','Usar plantilla vacía'); tb.type='button'; tb.addEventListener('click',function(){ it.plan={secciones:ngTpl(it.lado).map(function(s){ return {k:s[0],titulo:s[1],texto:''}; })}; ngSave(it); renderNg(); }); pf.appendChild(tb); }
      b.appendChild(pf);
      if(ngBusy[it.id]==='plan') b.appendChild(el('p','ngbusy','Puede tardar hasta un minuto.'));
      if(it.plan&&it.plan.secciones){ it.plan.secciones.forEach(function(s){ var w=el('div','ngsec'); w.appendChild(el('h4',null,s.titulo)); var ta=el('textarea'); ta.value=s.texto||''; ta.setAttribute('aria-label',s.titulo);
          ta.addEventListener('change',function(){ s.texto=ta.value; ngSave(it); }); w.appendChild(ta); b.appendChild(w); });
        var cf=el('div','gfoot'), msg=el('span','fmsg','');
        var cp=el('button','gtask','Copiar plan'); cp.type='button'; cp.addEventListener('click',function(){ var t=it.t.toUpperCase()+'\n\n'+it.plan.secciones.map(function(s){ return s.titulo.toUpperCase()+'\n'+(s.texto||'—'); }).join('\n\n'); copyText(t).then(function(){ msg.textContent='Copiado'; }); }); cf.appendChild(cp);
        var gg=el('button','gtask',it.gestionId?'En Gestión ✓':'→ Próximo paso a Gestión'); gg.type='button'; gg.addEventListener('click',function(){ if(it.gestionId)return; var ps=(it.plan.secciones.filter(function(s){ return s.k==='pasos'; })[0]||{}).texto||'';
          var id='ng'+Date.now().toString(36); var g={id:id,t:'Negocio: '+it.t,d:'Plan en Oreja › Negocios.\n'+ps,frente:it.lado==='bs'?'bs':(it.lado==='golden'?'golden':'otro'),sev:'nuevo',origen:{tipo:'manual',de:'Negocios'},quien:'Lucho',fecha:'',prox:(ps.split('\n')[0]||'').replace(/^[-•\d.\s]+/,'').slice(0,140),est:'nuevo',hist:[],creado:nowIso(),reprog:0};
          gHist(g,'Creado desde Negocios'); gSave(g); renderGest(); it.gestionId=id; ngSave(it); renderNg(); }); cf.appendChild(gg); cf.appendChild(msg); b.appendChild(cf); } }
    }
    var ft=el('div','gfoot'); ft.appendChild(poDelBtn(function(){ delete NG[it.id]; if(ngCol)ngCol.doc(it.id).delete()['catch'](function(){}); renderNg(); })); b.appendChild(ft);
    return b; }
  function ngAsk(box,ph,fn){ if(box.querySelector('.gaddh'))return; var w=el('div','gaddh'); var i=el('input'); i.type='text'; i.placeholder=ph; var ok=el('button','minibtn','Confirmar'); ok.type='button';
    function go(){ var v=i.value.trim(); if(!v){ i.focus(); return; } fn(v); } ok.addEventListener('click',go); i.addEventListener('keydown',function(e){ if(e.key==='Enter')go(); }); w.appendChild(i); w.appendChild(ok); box.appendChild(w); setTimeout(function(){ try{ i.focus(); }catch(e){} },0); }
  function ngTpl(lado){ var base=[['resumen','Resumen en tres líneas'],['oportunidad','La oportunidad: qué problema resuelve y para quién'],['propuesta','La propuesta: qué se ofrece y cómo funciona'],['cliente','Cliente y canal: quién paga y cómo se llega'],['ingresos','Modelo de ingresos (números a completar, con ajuste por inflación)'],['recursos','Qué se necesita: gente, plata, tiempo, alianzas'],['riesgos','Riesgos y cómo se mitigan'],['plazos','Plazos: corto (90 días), mediano (12 meses), largo (2028)']];
    if(lado==='bs') base=base.concat([['venta','Cómo se la vendés a Nacho y Rodrigo: qué ganan ellos'],['espacio','Qué te construye a vos: espacio propio, decisión e ingreso'],['pedido','Qué pedís a cambio, por escrito']]);
    else if(lado==='golden') base=base.concat([['decision','La decisión a tomar con tus socios y qué hace falta para tomarla'],['ejecucion','Quién ejecuta (por dominio) y qué no hacés vos']]);
    else base=base.concat([['conflicto','Conflictos con Golden o BS Group, y cómo se evitan']]);
    return base.concat([['pasos','Próximos 3 pasos, con dueño']]); }
  async function ngSuggest(it){ if(!NGSAMPLE||ngBusy[it.id])return; ngBusy[it.id]='test'; renderNg();
    try{ var r=await NGSAMPLE.json(ngCtx()+'\nEvaluá esta idea con el test de admisión de Lucho. Para cada criterio respondé "si", "du" (dudoso) o "no" y una razón de una línea, sin adular y sin suponer datos que no están. Devolvé SOLO JSON: {"a":{"v":"si|du|no","r":"..."},"r":{...},"roi":{...},"m":{...},"u":{...}}\n\nIDEA ('+(NGLADO[it.lado]||'')+'): '+it.t+'\n'+(it.d||''),{modelTier:'default',cache:false});
      var cp={}; it.c=it.c||{}; NGCRIT.forEach(function(k){ var x=r&&r[k[0]]; if(x&&x.v&&/^(si|du|no)$/.test(x.v)){ if(!it.c[k[0]])it.c[k[0]]=x.v; cp[k[0]]=({si:'sí',du:'dudoso',no:'no'})[x.v]+'. '+(x.r||''); } }); it.cp=cp; ngSave(it); }
    catch(e){ if(e&&e.code==='not_granted'){ NGSAMPLE=null; } }
    finally{ delete ngBusy[it.id]; renderNg(); } }
  async function ngPlan(it){ if(!NGSAMPLE||ngBusy[it.id])return; ngBusy[it.id]='plan'; renderNg(); var tpl=ngTpl(it.lado);
    var guia={golden:'Lucho es socio y decisor: el plan apunta a una decisión que toma con sus 4 socios y a una ejecución delegada por dominio.',bs:'Lucho no es dueño de BS Group: el plan está armado para que él se lo venda a Nacho y Rodrigo, con framing de par a par, y tiene que responder con claridad qué espacio propio, poder de decisión e ingreso le construye a él, no solo el valor para la empresa.',propio:'Es un proyecto propio de Lucho: cuidá que no compita con Golden ni con BS Group.'}[it.lado]||'';
    try{ var r=await NGSAMPLE.json(ngCtx()+'\nArmá un plan de negocio concreto y accionable para esta idea, en español rioplatense, directo, sin adulación. '+guia+'\nSi en la idea hay un caso externo, usalo como referencia y aclaralo como "a verificar". Cada sección: entre 3 y 8 líneas, con viñetas cuando ayude. Números: solo los que estén en la idea; el resto, [completar: …].\nDevolvé SOLO JSON: {"secciones":[{"k":"clave","texto":"..."}]} con exactamente estas claves en este orden: '+tpl.map(function(s){ return s[0]+' ('+s[1]+')'; }).join('; ')+'.\n\nIDEA: '+it.t+'\n'+(it.d||'')+(it.caso&&it.caso.nombre?('\nCaso externo: '+it.caso.nombre+' — '+(it.caso.que||'')):'')+'\nResultado del test: '+ngVer(it).si+'/5.',{modelTier:'complex',cache:false});
      var got={}; ((r&&r.secciones)||[]).forEach(function(s){ if(s&&s.k)got[s.k]=String(s.texto||''); });
      it.plan={secciones:tpl.map(function(s){ return {k:s[0],titulo:s[1],texto:got[s[0]]||''}; }),creado:nowIso()}; ngSave(it); }
    catch(e){ if(e&&e.code==='not_granted'){ NGSAMPLE=null; } else { it.planError=(e&&e.code==='rate_limited')?'Muchos pedidos seguidos: probá en un rato.':'No pude armar el plan. Probá de nuevo o usá la plantilla.'; } }
    finally{ delete ngBusy[it.id]; renderNg(); } }
  async function ngGenerate(){ var st=document.getElementById('ng-gen-st'), bt=document.getElementById('ng-gen'); if(!NGSAMPLE||bt.disabled)return; bt.disabled=true; st.textContent='Pensando… puede tardar hasta un minuto';
    var lado=document.getElementById('ng-m-lado').value, tema=document.getElementById('ng-m-tema').value.trim();
    var prev=ngAll().map(function(x){ return '- '+x.t; }).slice(0,30).join('\n');
    try{ var r=await NGSAMPLE.json(ngCtx()+'\nProponé 1 idea de unidad de negocio '+({ambos:'que crucen Golden y BS Group',golden:'para Golden',bs:'para BS Group (y el Distrito)'})[lado]+(tema?(', alrededor de: '+tema):'')+'. Cada una inspirada en un caso de éxito real de afuera (otro país o industria) bajado a una jugada concreta y disruptiva para Córdoba. No repitas estas ideas que ya tiene:\n'+(prev||'(ninguna)')+'\nDevolvé SOLO JSON: {"ideas":[{"t":"título corto","d":"qué es, a quién se vende y cómo se cobra, 2-3 líneas","lado":"golden|bs|propio","caso":{"nombre":"...","donde":"...","que":"qué hicieron, una línea"},"porque":"por qué encaja con Lucho ahora, una línea"}]}',{modelTier:'complex',cache:false});
      var n=0; ((r&&r.ideas)||[]).slice(0,1).forEach(function(x){ if(!x||!x.t)return; var id='ng'+Date.now().toString(36)+(n++); ngSave({id:id,t:String(x.t).slice(0,140),d:String(x.d||''),lado:/^(golden|bs|propio)$/.test(x.lado)?x.lado:(lado==='bs'?'bs':'golden'),caso:x.caso||null,porque:String(x.porque||''),origen:'motor',etapa:'idea',c:{},creado:nowIso()}); });
      st.textContent=n?'Una idea nueva en "Sin filtrar": pasala por el filtro':'No salió nada útil, probá con otra pista'; ngFilt='idea'; }
    catch(e){ st.textContent=e&&e.code==='not_granted'?'Sin permiso para consultar a Claude':(e&&e.code==='rate_limited'?'Muchos pedidos seguidos: probá en un rato':'No pude generar: probá de nuevo'); if(e&&e.code==='not_granted')NGSAMPLE=null; }
    finally{ bt.disabled=false; renderNg(); } }
  function renderNg(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Las ideas, los tests y los planes quedan guardados acá.',local:'<b>Sin conexión a tu espacio privado.</b> Lo que cargues no se guarda.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[ngMode];
    document.getElementById('ng-priv').innerHTML=pv||''; var tp=document.getElementById('tp-neg');
    if(ngMode==='ajeno'){ if(tp){ tp.textContent='privado'; tp.className='tp'; } renderHomeDec(); return; }
    document.getElementById('ng-motor').hidden=!NGSAMPLE;
    ngSweep(); var all=ngAll(), cnt={idea:0,avanza:0,archivada:0,descartada:0,cerrada:0}; all.forEach(function(x){ var e=x.etapa||'idea'; if(cnt[e]!=null)cnt[e]++; });
    var f=document.getElementById('ng-filt'); f.innerHTML='';
    renderNgMet(all); renderHomeDec();
    [['idea','Sin filtrar'],['avanza','Avanzan'],['cerrada','Decididas'],['archivada','Archivadas'],['descartada','Descartadas']].forEach(function(o){ var b=el('button','ptab'+(ngFilt===o[0]?' on':''),o[1]); b.type='button'; b.appendChild(el('span','n',String(cnt[o[0]]))); b.addEventListener('click',function(){ ngFilt=o[0]; renderNg(); }); f.appendChild(b); });
    var list=document.getElementById('ng-list'); list.innerHTML=''; var arr=all.filter(function(x){ return (x.etapa||'idea')===ngFilt; }); if(ngFilt==='avanza') arr.sort(function(a,b){ var fa=(a.plan2&&a.plan2.decision.fecha)||'9999', fb=(b.plan2&&b.plan2.decision.fecha)||'9999'; return fa<fb?-1:(fa>fb?1:0); });
    if(!arr.length) list.appendChild(el('p','hint',all.length?'Nada en esta vista.':'Todavía no hay ideas. Sumá la primera arriba'+(NGSAMPLE?' o pedile una al motor rápido.':'.')));
    arr.forEach(function(it){ if(it.planError&&!ngBusy[it.id]){ var e=el('p','hint',it.planError); e.style.color='var(--crit)'; list.appendChild(e); delete it.planError; } list.appendChild(ngCard(it)); });
    setT('ng-k',cnt.idea+' sin filtrar · '+cnt.avanza+' avanzan');
    if(tp){ tp.textContent=all.length?(cnt.idea?cnt.idea+' sin filtrar':'')+(cnt.idea&&cnt.avanza?' · ':'')+(cnt.avanza?cnt.avanza+' avanzan':(cnt.idea?'':'al día')):'sin ideas'; tp.className='tp'+(cnt.idea>3?' warn':''); var _ven=all.filter(function(x){ return (x.etapa||'idea')==='avanza'&&x.plan2&&x.plan2.decision.fecha&&x.plan2.decision.fecha<todayKey(); }).length, _sin=all.filter(function(x){ return (x.etapa||'idea')==='avanza'&&!(x.plan2&&x.plan2.decision.fecha); }).length; if(_ven){ tp.textContent+=' · '+_ven+' decisión'+(_ven>1?'es':'')+' vencida'+(_ven>1?'s':''); tp.className='tp crit'; } else if(_sin){ tp.textContent+=' · '+_sin+' sin fecha'; } } }
  document.getElementById('ng-add').addEventListener('click',function(){ var t=document.getElementById('ng-t'), d=document.getElementById('ng-d'), m=document.getElementById('ng-add-msg'); if(!t.value.trim()){ t.focus(); m.textContent=''; return; }
    var id='ng'+Date.now().toString(36); ngSave({id:id,t:t.value.trim(),d:d.value.trim(),lado:document.getElementById('ng-lado').value,madurez:document.getElementById('ng-mad').value,origen:'lucho',etapa:'idea',c:{},creado:nowIso()});
    t.value=''; d.value=''; ngOpen[id]=true; ngFilt='idea'; m.textContent='Sumada: pasala por el filtro'; renderNg(); });
  document.getElementById('ng-gen').addEventListener('click',ngGenerate);
  function ngAttach(DBx,uid){ try{ ngCol=DBx.doc('data/users/'+uid+'/negocios').collection('items'); }catch(e){ ngMode='local'; renderNg(); return; }
    ngCol.onSnapshot(function(qs){ ngMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); NG=m;
      var a=document.activeElement; if(a&&(a.tagName==='TEXTAREA'||a.tagName==='INPUT')&&document.getElementById('ng-list').contains(a))return; renderNg(); },function(){ ngMode='error'; renderNg(); }); }
  (async function(){ try{ if(window.claude&&window.claude.use){ NGSAMPLE=await window.claude.use('sample'); } }catch(e){ NGSAMPLE=null; } renderNg(); })();
  renderNg();

