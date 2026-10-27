  // ---------- GESTIÓN (privada, con tratamiento) ----------
  var FRENTES=[['golden','Golden'],['europa','Europa'],['bs','BS Group'],['dogos','Dogos'],['finanzas','Finanzas'],['personal','Personal'],['otro','Otro']];
  var GEST=[['nuevo','Nuevo'],['curso','En curso'],['esperando','Esperando a otro'],['escalado','Escalado'],['hecho','Hecho'],['descartado','Descartado']];
  var GNOTE={hecho:1,descartado:1,escalado:1};
  var SEVW={crit:0,warn:1,ok:2,nuevo:3};
  var GL='oreja_gest_v2';
  try{ localStorage.removeItem('oreja_gest_v1'); }catch(e){}
  var G2=lget(GL,{}); if(!G2||typeof G2!=='object'||Array.isArray(G2))G2={};
  var gColRef=null, gMode='conectando', gMeta={}, gOpen={}, gFilt='abiertas', gFrente='todos', gClosing={}, gQ={}, gDeferred=false;
  var listEl=document.getElementById('gest-list');
  function nowIso(){ return new Date().toISOString(); }
  function dm(iso){ var s=String(iso||''); return s.length>=10?(s.slice(8,10)+'/'+s.slice(5,7)):''; }
  function dmhm(iso){ try{ return new Date(iso).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }catch(e){ return dm(iso); } }
  function dayDiff(a,b){ return Math.round((Date.parse(b+'T12:00:00')-Date.parse(a+'T12:00:00'))/86400000); }
  function localDay(iso){ try{ var d=new Date(iso); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }catch(e){ return ''; } }
  function safeUrl(u){ return /^https:\/\//i.test(String(u||''))?String(u):null; }
  function gClosed(it){ return it.est==='hecho'||it.est==='descartado'; }
  function gVenc(it){ return !gClosed(it)&&!!it.fecha&&it.fecha<todayKey(); }
  function gAll(){ return Object.keys(G2).map(function(k){ return G2[k]; }).filter(function(x){ return x&&typeof x==='object'; }); }
  function sevW(s){ return SEVW[s]!=null?SEVW[s]:3; }
  function gSort(a,b){ var x=(gVenc(a)?0:1)-(gVenc(b)?0:1); if(x)return x; x=(gClosed(a)?1:0)-(gClosed(b)?1:0); if(x)return x;
    x=sevW(a.sev)-sevW(b.sev); if(x)return x; var fa=a.fecha||'9999', fb=b.fecha||'9999'; if(fa!==fb)return fa<fb?-1:1; return String(b.act||'')<String(a.act||'')?-1:1; }
  function frenteName(f){ for(var i=0;i<FRENTES.length;i++)if(FRENTES[i][0]===f)return FRENTES[i][1]; return 'Otro'; }
  function estName(e){ for(var i=0;i<GEST.length;i++)if(GEST[i][0]===e)return GEST[i][1]; return 'Nuevo'; }
  function origenTxt(o){ o=o||{tipo:'manual'}; var ic={mail:'✉',charla:'💬',calendario:'📅',clickup:'☑',captura:'🎙',manual:'✍',radar:'◎'}[o.tipo]||'•';
    var def={mail:'mail',charla:'charla con Cloty',calendario:'calendario',clickup:'ClickUp',captura:'captura',manual:'cargado por vos',radar:'Radar de Cloty'}[o.tipo]||'';
    return ic+' '+(o.de||def); }
  function gHist(it,txt,por){ (it.hist||(it.hist=[])).push({ts:nowIso(),por:por||'lucho',txt:txt}); }
  function gSave(it){ it.act=nowIso(); G2[it.id]=it; lset(GL,G2);
    if(gColRef){ var id=it.id, body=JSON.parse(JSON.stringify(it));
      gQ[id]=(gQ[id]||Promise.resolve()).then(function(){ return gColRef.doc(id).set(body); })['catch'](function(){ gMode='error'; renderGestPriv(); }); } }
  function gRemove(id){ delete G2[id]; lset(GL,G2); if(gColRef){ gColRef.doc(id).delete()['catch'](function(){}); } }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
  function el(tag,cls,txt){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e; }

  function renderGFilters(c){ var f=document.getElementById('gfilt'); f.innerHTML='';
    [['abiertas','Abiertas'],['vencidas','Vencidas'],['esperando','Esperando'],['cerradas','Cerradas'],['todas','Todas']].forEach(function(o){
      var b=el('button','ptab'+(gFilt===o[0]?' on':'')); b.type='button'; b.textContent=o[1]; var n=el('span','n',String(c[o[0]]||0)); b.appendChild(n);
      b.addEventListener('click',function(){ gFilt=o[0]; renderGest(); }); f.appendChild(b); });
    var r=document.getElementById('gfrente'); r.innerHTML='';
    [['todos','Todos los frentes']].concat(FRENTES).forEach(function(o){ var b=el('button','ptab'+(gFrente===o[0]?' on':''),o[1]); b.type='button';
      b.addEventListener('click',function(){ gFrente=o[0]; renderGest(); }); r.appendChild(b); }); }

  function gCard(it){ var closed=gClosed(it), venc=gVenc(it), t=todayKey();
    var card=el('div','gitem'+(closed?' done':'')+(venc?' venc':''));
    var head=el('button','ghead'); head.type='button'; head.setAttribute('aria-expanded',gOpen[it.id]?'true':'false');
    var sev=el('span','sev '+(it.sev||'nuevo'),({crit:'Crítico',warn:'Atención',ok:'Seguim.',nuevo:'Nuevo'})[it.sev]||'Nuevo');
    var gh=el('span','gh'); gh.appendChild(el('b',null,it.t||'(sin título)'));
    var meta=[frenteName(it.frente), origenTxt(it.origen)];
    if(it.fecha) meta.push((closed?'fecha ':'vence ')+dm(it.fecha));
    if(!closed&&it.creado){ var da=dayDiff(localDay(it.creado),t); if(da>0)meta.push(da+' d abierta'); }
    gh.appendChild(el('span','gm',meta.join(' · ')));
    var fl=el('span','gflags'), flags=[];
    if(venc) flags.push(['crit','vencida hace '+dayDiff(it.fecha,t)+' d']);
    if(!closed&&!it.fecha) flags.push(['','sin fecha']);
    if(!closed&&!it.prox) flags.push(['','sin próximo paso']);
    if((it.reprog||0)>=2) flags.push(['crit','reprogramada '+it.reprog+'×: ¿qué decisión falta?']);
    flags.forEach(function(f){ fl.appendChild(el('span','gflag'+(f[0]?' '+f[0]:''),f[1])); }); if(flags.length)gh.appendChild(fl);
    head.appendChild(sev); head.appendChild(gh); head.appendChild(el('span','gstp st-'+(it.est||'nuevo'),estName(it.est)));
    head.addEventListener('click',function(){ gOpen[it.id]=!gOpen[it.id]; renderGest(); });
    card.appendChild(head);
    if(gOpen[it.id]) card.appendChild(gBody(it));
    return card; }

  // Fecha/hora estables: guarda al soltar el campo (o al elegir en el selector del celular), nunca a mitad de tipeo.
  function okDate(v){ return !v||/^20\d\d-\d\d-\d\d$/.test(v); }
  function okTime(v){ return !v||/^\d\d:\d\d$/.test(v); }
  function stableInput(inp,getOld,commit,valid){ var pend=null, tm=null;
    function flush(){ clearTimeout(tm); if(pend===null)return; var v=pend; pend=null; if(!valid(v)){ inp.value=getOld()||''; return; } if(v===(getOld()||''))return; commit(v); }
    inp.addEventListener('change',function(){ pend=inp.value; clearTimeout(tm); if(document.activeElement!==inp){ flush(); return; } if(valid(pend)) tm=setTimeout(flush,2500); });
    inp.addEventListener('blur',flush);
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); inp.blur(); } }); }
  function gRefresh(){ if(listEl.contains(document.activeElement)){ gDeferred=true; return; } renderGest(); }
  function addMin(hm,m){ var p=hm.split(':'), t=(+p[0])*60+(+p[1])+m; t=Math.min(t,23*60+59); return ('0'+Math.floor(t/60)).slice(-2)+':'+('0'+(t%60)).slice(-2); }
  function calSync(it){ if(!MCP||!it.calId||it.calId==='ok'||!it.fecha)return; var h=it.hora||'09:00';
    MCP.callTool(CAL,'update_event',{eventId:it.calId,startTime:it.fecha+'T'+h+':00',endTime:it.fecha+'T'+addMin(h,30)+':00'})
      .then(function(){ gHist(it,'Calendar actualizado: '+dm(it.fecha)+' '+h); gSave(it); MCP.invalidate(CAL,'list_events')['catch'](function(){}); gRefresh(); })
      ['catch'](function(e){ gHist(it,'No pude mover el evento en Calendar ('+calMsg(e&&e.code)+'). Movelo a mano.'); gSave(it); gRefresh(); }); }
  function field(label,input,full){ var l=el('label',full?'full':null); l.appendChild(document.createTextNode(label)); l.appendChild(input); return l; }
  function gBody(it){ var b=el('div','gbody');
    if(it.d) b.appendChild(el('p','gdet',it.d));
    var g=el('div','gfields');
    var quien=el('input'); quien.type='text'; quien.value=it.quien||''; quien.placeholder='quién espera / quién es dueño';
    quien.addEventListener('change',function(){ var v=quien.value.trim(); if(v===(it.quien||''))return; it.quien=v; gHist(it,'Dueño / quién espera: '+(v||'—')); gSave(it); renderGest(); });
    var fecha=el('input'); fecha.type='date'; fecha.value=it.fecha||'';
    stableInput(fecha,function(){ return it.fecha; },function(v){ var old=it.fecha||'';
      if(old&&v&&v>old){ it.reprog=(it.reprog||0)+1; gHist(it,'Reprogramada '+dm(old)+' → '+dm(v)); } else gHist(it,'Fecha: '+(v?dm(v):'sin fecha'));
      it.fecha=v; gSave(it); calSync(it); gRefresh(); },okDate);
    var hora=el('input'); hora.type='time'; hora.value=it.hora||''; hora.placeholder='09:00';
    stableInput(hora,function(){ return it.hora; },function(v){ it.hora=v; gHist(it,'Hora: '+(v||'sin hora')); gSave(it); calSync(it); gRefresh(); },okTime);
    var prox=el('input'); prox.type='text'; prox.value=it.prox||''; prox.placeholder='la próxima acción concreta';
    prox.addEventListener('change',function(){ var v=prox.value.trim(); if(v===(it.prox||''))return; it.prox=v; gHist(it,'Próximo paso: '+(v||'—')); gSave(it); renderGest(); });
    var est=el('select'); GEST.forEach(function(e){ var o=el('option',null,e[1]); o.value=e[0]; if(e[0]===(gClosing[it.id]||it.est||'nuevo'))o.selected=true; est.appendChild(o); });
    est.addEventListener('change',function(){ var v=est.value; if(v===it.est){ delete gClosing[it.id]; renderGest(); return; }
      if(GNOTE[v]){ gClosing[it.id]=v; renderGest(); return; }
      delete gClosing[it.id]; it.est=v; gHist(it,'Estado → '+estName(v)); gSave(it); renderGest(); });
    var fr=el('select'); FRENTES.forEach(function(f){ var o=el('option',null,f[1]); o.value=f[0]; if(f[0]===(it.frente||'otro'))o.selected=true; fr.appendChild(o); });
    fr.addEventListener('change',function(){ it.frente=fr.value; gHist(it,'Frente: '+frenteName(fr.value)); gSave(it); renderGest(); });
    g.appendChild(field('Próximo paso',prox,true)); g.appendChild(field('Dueño / quién espera',quien)); g.appendChild(field('Fecha de compromiso',fecha)); g.appendChild(field('Hora (para Calendar)',hora));
    g.appendChild(field('Estado',est)); g.appendChild(field('Frente',fr));
    b.appendChild(g);
    if(gClosing[it.id]){ var cv=gClosing[it.id]; var c=el('div','gcierre');
      c.appendChild(el('span',null,(cv==='escalado'?'¿A quién y por qué se escala?':'¿Cómo se cierra?')+' Una línea:'));
      var ci=el('input'); ci.type='text'; ci.placeholder=cv==='escalado'?'ej.: lo decide Rodrigo el viernes':'ej.: firmado, se paga el 05/10';
      var ok=el('button','minibtn','Confirmar'); ok.type='button'; var no=el('button','minibtn','Cancelar'); no.type='button';
      function conf(){ var n=ci.value.trim(); if(!n){ ci.focus(); ci.placeholder='hace falta una línea para cerrar'; return; }
        it.est=cv; if(cv!=='escalado')it.cierre=n; gHist(it,'Estado → '+estName(cv)+': '+n); delete gClosing[it.id]; gSave(it); renderGest(); }
      ok.addEventListener('click',conf); ci.addEventListener('keydown',function(e){ if(e.key==='Enter')conf(); });
      no.addEventListener('click',function(){ delete gClosing[it.id]; renderGest(); });
      c.appendChild(ci); c.appendChild(ok); c.appendChild(no); b.appendChild(c); setTimeout(function(){ try{ ci.focus(); }catch(e){} },0); }
    if(gClosed(it)&&it.cierre) b.appendChild(el('p','gdet','Cierre: '+it.cierre));
    var links=[]; var ou=safeUrl(it.origen&&it.origen.url); if(ou)links.push([it.origen.tipo==='mail'?'Abrir el mail ↗':'Ver origen ↗',ou]);
    (it.links||[]).forEach(function(l){ var u=safeUrl(l&&l.url); if(u)links.push([(l.txt||'Link')+' ↗',u]); });
    if(links.length){ var lw=el('div','glinks'); links.forEach(function(l){ var a=el('a',null,l[0]); a.href=l[1]; a.target='_blank'; a.rel='noopener'; lw.appendChild(a); }); b.appendChild(lw); }
    var h=el('div','ghist'); h.appendChild(el('h4',null,'Bitácora'));
    (it.hist||[]).slice().reverse().forEach(function(r){ var row=el('div','hrow'); row.appendChild(el('span','ht',dm(localDay(r.ts))));
      row.appendChild(el('span','hp'+(r.por==='cloty'?' c':''),r.por==='cloty'?'Cloty':'Vos')); row.appendChild(el('span',null,r.txt||'')); h.appendChild(row); });
    var ah=el('div','gaddh'); var ai=el('input'); ai.type='text'; ai.placeholder='Sumá un avance a la bitácora…'; var ab=el('button','minibtn','Sumar'); ab.type='button';
    function addH(){ var v=ai.value.trim(); if(!v)return; gHist(it,v); gSave(it); renderGest(); }
    ab.addEventListener('click',addH); ai.addEventListener('keydown',function(e){ if(e.key==='Enter')addH(); });
    ah.appendChild(ai); ah.appendChild(ab); h.appendChild(ah); b.appendChild(h);
    var ft=el('div','gfoot');
    var cp=el('button','gtask','⧉ Copiar como tarea'); cp.type='button';
    cp.addEventListener('click',function(){ copyText('[Oreja] '+(it.t||'')+(it.prox?(' — '+it.prox):'')+(it.fecha?(' · '+dm(it.fecha)):'')).then(function(){ cp.textContent='copiado ✓'; setTimeout(function(){ cp.textContent='⧉ Copiar como tarea'; },1500); }); });
    var del=el('button','gtask','Borrar'); del.type='button'; var armed=false;
    del.addEventListener('click',function(){ if(!armed){ armed=true; del.textContent='¿Borrar para siempre? Tocá de nuevo'; setTimeout(function(){ armed=false; del.textContent='Borrar'; },3000); return; } gRemove(it.id); renderGest(); });
    ft.appendChild(cp); ft.appendChild(calBtn(it)); ft.appendChild(del); b.appendChild(ft);
    return b; }

  function renderGest(){ setTimeout(function(){ try{ renderPj(); }catch(e){} try{ renderRit(); }catch(e){} },0); var all=gAll();
    var c={abiertas:0,vencidas:0,esperando:0,cerradas:0,todas:all.length};
    all.forEach(function(x){ if(gClosed(x))c.cerradas++; else c.abiertas++; if(gVenc(x))c.vencidas++; if(x.est==='esperando')c.esperando++; });
    renderGFilters(c);
    var arr=all.filter(function(x){ if(gFrente!=='todos'&&(x.frente||'otro')!==gFrente)return false;
      if(gFilt==='abiertas')return !gClosed(x); if(gFilt==='vencidas')return gVenc(x); if(gFilt==='esperando')return x.est==='esperando'; if(gFilt==='cerradas')return gClosed(x); return true; }).sort(gSort);
    listEl.innerHTML=''; if(!arr.length) listEl.appendChild(el('p','hint',all.length?'Nada en esta vista.':'Todavía no hay temas. Cloty los suma desde tu mail y nuestras charlas.'));
    arr.forEach(function(it){ listEl.appendChild(gCard(it)); });
    setT('g-count',c.abiertas+' abiertas · '+c.vencidas+' vencidas');
    var chip=document.getElementById('chip-open'); chip.innerHTML='<b>'+c.abiertas+'</b> sin cerrar'+(c.vencidas?' · <b>'+c.vencidas+'</b> vencidas':''); chip.className='schip '+(c.vencidas?'crit':(c.abiertas?'':'ok'));
    renderHero(all);
    setT('tp-open',c.abiertas+' abiertos'+(c.vencidas?' · '+c.vencidas+' vencidos':'')); if(document.getElementById('fr-live'))renderFrentes(); }
  function renderHero(all){ var h=document.getElementById('hero'); if(!h)return; var op=all.filter(function(x){ return !gClosed(x); }).sort(gSort), it=op[0], t=todayKey();
    if(!it){ setT('hero-t',gMode==='ajeno'?'Privado del titular':'Nada abierto en Gestión'); setT('hero-s',''); return; }
    setT('hero-t',it.t||'(sin título)');
    var s=[]; if(gVenc(it))s.push('Vencido hace '+dayDiff(it.fecha,t)+' d'); else if(it.fecha)s.push('Vence el '+dm(it.fecha)); else s.push('Sin fecha');
    if(it.prox)s.push('Próximo paso: '+it.prox); else s.push('Sin próximo paso');
    setT('hero-s',s.join(' · ')); }
  function renderGestPriv(){ var t={
      conectando:'Conectando tu espacio privado…',
      sync:'<b>Privado, solo tuyo.</b> '+(gMeta.lastSync?'Cloty leyó tu mail por última vez el '+esc(dmhm(gMeta.lastSync))+'.':'Cloty todavía no hizo la primera lectura automática de tu mail.'),
      local:'<b>Solo en este dispositivo.</b> Esta vista no pudo abrir tu espacio privado; lo que cargues queda en este navegador.',
      error:'<b>No se pudo guardar.</b> Lo último quedó en este dispositivo; recargá para reintentar.',
      ajeno:'<b>Sección privada del titular.</b>' }[gMode];
    document.getElementById('gsync').innerHTML=t||''; }
  listEl.addEventListener('focusout',function(){ if(!gDeferred)return; setTimeout(function(){ if(!listEl.contains(document.activeElement)){ gDeferred=false; renderGest(); } },0); });
  function addGest(title,sev,origen){ if(!title)return; var id='m'+Date.now().toString(36);
    var it={id:id,t:title,d:'',frente:gFrente!=='todos'?gFrente:'otro',sev:sev||'nuevo',origen:origen||{tipo:'manual'},quien:'',fecha:'',prox:'',est:'nuevo',hist:[],creado:nowIso(),reprog:0};
    gHist(it,'Creado'); gSave(it); gOpen[id]=true; if(gFilt!=='abiertas'&&gFilt!=='todas')gFilt='abiertas'; renderGest(); }
  document.getElementById('gest-add-btn').addEventListener('click',function(){ var inp=document.getElementById('gest-add-input'); addGest(inp.value.trim()); inp.value=''; });
  document.getElementById('gest-add-input').addEventListener('keydown',function(e){ if(e.key==='Enter'){ addGest(e.target.value.trim()); e.target.value=''; } });
  function gestAttach(DBx,uid){ var metaRef;
    try{ metaRef=DBx.doc('data/users/'+uid+'/gestion'); gColRef=metaRef.collection('items'); }catch(e){ gColRef=null; gMode='local'; renderGestPriv(); return; }
    metaRef.onSnapshot(function(s){ gMeta=(s&&s.exists)?(s.data()||{}):{}; renderGestPriv(); },function(){});
    gColRef.onSnapshot(function(qs){ gMode='sync'; var fromCache=qs.metadata&&qs.metadata.fromCache;
      if(qs.empty){ if(!fromCache&&Object.keys(G2).length){ Object.keys(G2).forEach(function(k){ gSave(G2[k]); }); } renderGestPriv(); return; }
      var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } });
      G2=m; lset(GL,G2); renderGestPriv();
      if(listEl.contains(document.activeElement)){ gDeferred=true; return; } renderGest(); },function(){ gMode='error'; renderGestPriv(); });
  }
  function gestLock(on){ document.getElementById('g-locked').hidden=!on; document.getElementById('g-body').hidden=!!on; }
  renderGest(); renderGestPriv();

