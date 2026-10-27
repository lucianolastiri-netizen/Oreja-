  // ---------- PROYECTOS (privado; cartera completa, foco en 3) ----------
  var PJ={}, pjCol=null, pjMode='conectando', pjFilt='activo', pjOpen={}, pjBody=document.getElementById('pj-body'), PJTOPE=3;
  var PJEST=[['foco','En foco'],['activo','Activo'],['espera','En espera'],['congelado','Congelado'],['cerrado','Cerrado']];
  var PJORD={golden:0,europa:1,bs:2,dogos:3,personal:4};
  var PJFR={golden:'Golden',europa:'Europa',bs:'BS Group',dogos:'Dogos',personal:'Personal'};
  function pjLock(on){ document.getElementById('pj-locked').hidden=!on; pjBody.hidden=!!on; }
  function pjSave(p){ p.act=nowIso(); PJ[p.id]=p; if(pjCol){ pjCol.doc(p.id).set(JSON.parse(JSON.stringify(p)))['catch'](function(){ pjMode='error'; renderPj(); }); } }
  function pjAll(){ return Object.keys(PJ).map(function(k){ return PJ[k]; }).filter(function(p){ return p&&p.t; }).sort(function(a,b){ return ((PJORD[a.frente]||9)-(PJORD[b.frente]||9))||String(a.t).localeCompare(String(b.t)); }); }
  function pjTemas(p){ var g=(typeof G2!=='undefined'&&G2)||{}; return (p.gestion||[]).map(function(id){ return g[id]; }).filter(function(x){ return x&&x.est!=='hecho'&&x.est!=='descartado'; }); }
  function pjFlags(p){ var t=todayKey(), f=[], ts=pjTemas(p), v=ts.filter(function(x){ return x.fecha&&x.fecha<t; }).length;
    if(p.est==='foco'||p.est==='activo'){ if(!p.prox)f.push(['','sin próximo paso']); if(!p.decision)f.push(['','sin fecha de decisión']); else if(p.decision<t)f.push(['crit','decisión vencida hace '+dayDiff(p.decision,t)+' d']); }
    if(p.est==='espera'&&p.vuelve&&p.vuelve<=t)f.push(['crit','tenía que volver el '+dm(p.vuelve)]);
    if(v)f.push(['crit',v+' tema'+(v>1?'s':'')+' vencido'+(v>1?'s':'')]); return f; }
  function pjCard(p){ var est=p.est||'espera', card=el('div','gitem'+(est==='cerrado'||est==='congelado'?' done':'')), head=el('button','ghead'); head.type='button'; head.setAttribute('aria-expanded',pjOpen[p.id]?'true':'false');
    var gh=el('span','gh'); gh.appendChild(el('b',null,p.t)); var meta=[PJFR[p.frente]||p.frente]; if(p.decision)meta.push('decide el '+dm(p.decision)); if(p.prox)meta.push('próximo: '+p.prox); gh.appendChild(el('span','gm',meta.join(' · ')));
    var fl=pjFlags(p); if(fl.length){ var fs=el('span','gflags'); fl.forEach(function(f){ fs.appendChild(el('span','gflag'+(f[0]?' '+f[0]:''),f[1])); }); gh.appendChild(fs); }
    head.appendChild(gh); var e=PJEST.filter(function(o){ return o[0]===est; })[0]; head.appendChild(el('span','gstp'+(est==='foco'?' st-hecho':(est==='activo'?' st-curso':'')),e?e[1]:est));
    head.addEventListener('click',function(){ pjOpen[p.id]=!pjOpen[p.id]; renderPj(); }); card.appendChild(head);
    if(!pjOpen[p.id]) return card;
    var b=el('div','gbody'); if(p.obj)b.appendChild(el('p','gdet',p.obj));
    var g=el('div','pofld');
    function inp(lbl,k,ph,full){ var l=el('label',full?'full':null,lbl), i=el('input'); i.value=p[k]||''; i.placeholder=ph||''; i.addEventListener('change',function(){ p[k]=i.value.trim(); pjSave(p); renderPj(); }); l.appendChild(i); g.appendChild(l); }
    inp('Próximo paso','prox','la acción concreta',true); inp('Quién','quien','');
    var ld=el('label',null,'Fecha de decisión'), di=el('input'); di.type='date'; di.value=p.decision||''; stableInput(di,function(){ return p.decision; },function(v){ if(p.decision&&v&&v>p.decision)p.reprog=(p.reprog||0)+1; p.decision=v; pjSave(p); renderPj(); },okDate); ld.appendChild(di); g.appendChild(ld);
    var ls=el('label',null,'Estado'+(p.reprog?' · decisión movida '+p.reprog+'×':'')), ss=selOf(PJEST,est,'estsel'); ls.appendChild(ss); g.appendChild(ls);
    var msg=el('span','fmsg','');
    ss.addEventListener('change',function(){ var nf=pjAll().filter(function(x){ return x.est==='foco'&&x.id!==p.id; }); if(ss.value==='foco'&&nf.length>=PJTOPE){ ss.value=est; msg.style.color='var(--crit)'; msg.textContent='Ya hay '+PJTOPE+' en foco ('+nf.map(function(x){ return x.t; }).join(', ')+'): sacá uno primero.'; return; } p.est=ss.value; if(p.est==='cerrado')p.cerradoEn=nowIso(); pjSave(p); renderPj(); });
    if(est==='espera'){ var lv=el('label',null,'Vuelve a revisarse el'), vi=el('input'); vi.type='date'; vi.value=p.vuelve||''; stableInput(vi,function(){ return p.vuelve; },function(v){ p.vuelve=v; pjSave(p); renderPj(); },okDate); lv.appendChild(vi); g.appendChild(lv); }
    inp('Nota','nota','una línea',true);
    b.appendChild(g); b.appendChild(msg);
    // entregables
    var en=el('div','agfase'), eh=el('h4',null,'Entregables'), its=p.items||[], ok=its.filter(function(i){ return i.ok; }).length; eh.appendChild(el('span','k',ok+'/'+its.length)); en.appendChild(eh);
    its.forEach(function(i){ var lb=el('label','agchk'+(i.ok?' ok':'')), c=el('input'); c.type='checkbox'; c.checked=!!i.ok; c.addEventListener('change',function(){ i.ok=c.checked; pjSave(p); renderPj(); }); lb.appendChild(c); lb.appendChild(el('span',null,i.t)); en.appendChild(lb); });
    var ab=el('div','addbar'), ai=el('input'); ai.placeholder='Sumar un entregable verificable'; var bb=el('button','minibtn','Sumar'); bb.type='button';
    bb.addEventListener('click',function(){ if(!ai.value.trim())return; (p.items||(p.items=[])).push({t:ai.value.trim(),ok:false}); pjSave(p); renderPj(); }); ab.appendChild(ai); ab.appendChild(bb); en.appendChild(ab); b.appendChild(en);
    // temas de gestión
    var ts=pjTemas(p); if(ts.length){ var tw=el('div','agfase'), th=el('h4',null,'Temas abiertos en Gestión'); th.appendChild(el('span','k',String(ts.length))); tw.appendChild(th); var tl=el('div','pjtemas'), t=todayKey();
      ts.forEach(function(x){ var a=el('a'); a.href='#temas'; a.appendChild(el('span',null,x.t)); a.appendChild(el('span','x'+(x.fecha&&x.fecha<t?' crit':''),x.fecha?(x.fecha<t?'venció '+dm(x.fecha):dm(x.fecha)):'sin fecha')); tl.appendChild(a); }); tw.appendChild(tl); b.appendChild(tw); }
    var lk=el('div','aglinks'); (p.links||[]).forEach(function(l){ var a=el('a',null,l.t); a.href=l.u; if(l.u.charAt(0)!=='#'){ a.target='_blank'; a.rel='noopener'; } lk.appendChild(a); }); if((p.links||[]).length)b.appendChild(lk);
    card.appendChild(b); return card; }
  function renderPj(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Toda tu cartera en un lugar; los temas del día siguen en Gestión.',local:'<b>Sin conexión a tu espacio privado.</b> Lo que cargues no se guarda.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[pjMode];
    var pe=document.getElementById('pj-priv'); if(!pe)return; pe.innerHTML=pv||''; var tp=document.getElementById('tp-proy');
    if(pjMode==='ajeno'){ if(tp){ tp.textContent='privado'; tp.className='tp'; } return; }
    var all=pjAll(), cnt={foco:0,activo:0,espera:0,congelado:0,cerrado:0}, venc=0; all.forEach(function(p){ var e=p.est||'espera'; if(cnt[e]!=null)cnt[e]++; if(pjFlags(p).some(function(f){ return f[0]==='crit'; }))venc++; });
    var fo=document.getElementById('pj-foco'); fo.innerHTML=''; var focos=all.filter(function(p){ return p.est==='foco'; });
    focos.forEach(function(p){ var d=el('button','pstat acc'); d.type='button'; d.appendChild(el('div','l',PJFR[p.frente]||'')); d.appendChild(el('div','v',p.t)); d.appendChild(el('div','s',p.prox?'Próximo: '+p.prox:'sin próximo paso')); d.addEventListener('click',function(){ pjFilt='foco'; pjOpen[p.id]=true; renderPj(); var l=document.getElementById('pj-list'); if(l&&l.scrollIntoView)l.scrollIntoView({behavior:'smooth'}); }); fo.appendChild(d); });
    for(var i=focos.length;i<PJTOPE;i++){ var v=el('div','pstat vacio'); v.appendChild(el('div','l','Lugar libre')); v.appendChild(el('div','s','Pasá un proyecto activo a foco')); fo.appendChild(v); }
    var w=document.getElementById('pj-warn'); w.innerHTML=''; var act=cnt.foco+cnt.activo;
    if(act>5) w.appendChild(el('div','pjwarn','Tenés '+act+' proyectos andando a la vez. Con más de 5 alguno no avanza, aunque figure activo: elegí cuál pasa a espera y con qué fecha vuelve.'));
    var f=document.getElementById('pj-filt'); f.innerHTML='';
    [['foco','En foco'],['activo','Activos'],['espera','En espera'],['congelado','Congelados'],['cerrado','Cerrados']].forEach(function(o){ var b=el('button','ptab'+(pjFilt===o[0]?' on':''),o[1]); b.type='button'; b.appendChild(el('span','n',String(cnt[o[0]]))); b.addEventListener('click',function(){ pjFilt=o[0]; renderPj(); }); f.appendChild(b); });
    var list=document.getElementById('pj-list'); list.innerHTML=''; var arr=all.filter(function(p){ return (p.est||'espera')===pjFilt; });
    if(!arr.length) list.appendChild(el('p','hint','Nada en esta vista.')); arr.forEach(function(p){ list.appendChild(pjCard(p)); });
    setT('pj-k',cnt.foco+' en foco · '+act+' andando · '+cnt.espera+' en espera');
    setTimeout(function(){ try{ renderRit(); }catch(e){} },0);
    if(tp){ tp.textContent=all.length?(cnt.foco+' en foco · '+act+' andando'+(venc?' · '+venc+' con alerta':'')):'sin proyectos'; tp.className='tp'+(venc?' crit':(act>5?' warn':'')); } }
  document.getElementById('pj-add').addEventListener('click',function(){ var t=document.getElementById('pj-t'); if(!t.value.trim()){ t.focus(); return; } var id='pj'+Date.now().toString(36); pjSave({id:id,t:t.value.trim(),frente:document.getElementById('pj-fr').value,est:'espera',items:[],gestion:[],creado:nowIso()}); t.value=''; pjFilt='espera'; pjOpen[id]=true; renderPj(); });
  function pjAttach(DBx,uid){ try{ pjCol=DBx.doc('data/users/'+uid+'/proyectos').collection('items'); }catch(e){ pjMode='local'; renderPj(); return; }
    pjCol.onSnapshot(function(qs){ pjMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); PJ=m;
      var a=document.activeElement; if(a&&(a.tagName==='INPUT'||a.tagName==='SELECT')&&pjBody.contains(a))return; renderPj(); },function(){ pjMode='error'; renderPj(); }); }
  renderPj();

