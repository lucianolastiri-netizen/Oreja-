  // ---------- MOVIMIENTOS (privado, por mes) ----------
  var MVL='oreja_movs_v1';
  var MV=lget(MVL,{}); if(!MV||typeof MV!=='object'||Array.isArray(MV))MV={};
  var mvCol=null, mvQ={}, mvArmed=false;
  var MESN={'01':'Enero','02':'Febrero','03':'Marzo','04':'Abril','05':'Mayo','06':'Junio','07':'Julio','08':'Agosto','09':'Septiembre','10':'Octubre','11':'Noviembre','12':'Diciembre'};
  var mvMes=(function(){ var k=todayKey().slice(0,7); return k<'2026-09'?'2026-09':k; })();
  function mvSave(m){ m.act=new Date().toISOString(); MV[m.id]=m; lset(MVL,MV);
    if(mvCol){ var id=m.id, body=JSON.parse(JSON.stringify(m)); mvQ[id]=(mvQ[id]||Promise.resolve()).then(function(){ return mvCol.doc(id).set(body); })['catch'](function(){}); } }
  function mvAll(){ return Object.keys(MV).map(function(k){ return MV[k]; }).filter(function(m){ return m&&m.fecha; }); }
  function mvDelMes(k){ return mvAll().filter(function(m){ return m.fecha.slice(0,7)===k&&m.estado!=='descartado'; }).sort(function(a,b){ return a.fecha<b.fecha?1:(a.fecha>b.fecha?-1:0); }); }
  function mvCats(tipo){ var c=tipo==='ingreso'?F.ing.map(function(l){ return l[0]; }):F.egr.map(function(g){ return g[0]; }); c=c.filter(Boolean); if(c.indexOf('Otros')<0)c.push('Otros'); return c; }
  function mvTot(k){ var t={ing:0,egr:0,pn:0,pm:0}; mvDelMes(k).forEach(function(m){ var v=Number(m.monto)||0; if(m.estado==='confirmado'){ if(m.tipo==='ingreso')t.ing+=v; else t.egr+=v; } else { t.pn++; t.pm+=v; } }); return t; }
  // Pestañas: los meses del trimestre más los que vengan después (hasta el mes actual o el último movimiento), máximo 6.
  function mvMeses(){ var fin=todayKey().slice(0,7), set={}; MESES.forEach(function(M){ set[M[0]]=1; }); set[mvMes]=1;
    mvAll().forEach(function(m){ var k=m.fecha.slice(0,7); if(k>fin)fin=k; });
    for(var y=2026,mo=9;;){ var k=y+'-'+('0'+mo).slice(-2); if(k>fin)break; set[k]=1; mo++; if(mo>12){ mo=1; y++; } }
    var ks=Object.keys(set).filter(function(k){ return k>='2026-09'; }).sort(); ks=ks.slice(-6); if(ks.indexOf(mvMes)<0){ ks.push(mvMes); ks.sort(); } return ks; }
  function mvLab(k){ return MESN[k.slice(5)]+(k.slice(0,4)!==todayKey().slice(0,4)?' '+k.slice(2,4):''); }
  function renderMovs(){ var meses=mvMeses(), bar=document.getElementById('mv-meses'); bar.innerHTML='';
    meses.forEach(function(k){ var b=el('button','ptab'+(mvMes===k?' on':''),mvLab(k)); b.type='button'; var n=mvDelMes(k).length; if(n)b.appendChild(el('span','n',String(n)));
      b.addEventListener('click',function(){ mvMes=k; mvArmed=false; renderMovs(); }); bar.appendChild(b); });
    var t=mvTot(mvMes), s=document.getElementById('mv-sum');
    s.innerHTML='<span>Ingresos confirmados <b class="pnum">'+money(t.ing)+'</b></span><span>Egresos confirmados <b class="pnum">'+money(t.egr)+'</b></span>'+(t.pn?'<span>Por confirmar <b>'+t.pn+'</b> (<span class="pnum">'+money(t.pm)+'</span>)</span>':'');
    setT('mv-k',MESN[mvMes.slice(5)]+' '+mvMes.slice(0,4));
    var list=document.getElementById('mv-list'); list.innerHTML=''; var arr=mvDelMes(mvMes);
    if(!arr.length) list.appendChild(el('p','hint','Sin movimientos cargados en este mes.'));
    arr.forEach(function(m){ var prop=m.estado!=='confirmado'; var r=el('div','mvrow'+(prop?' prop':''));
      r.appendChild(el('span','mf',dm(m.fecha)));
      var d=el('span','md',m.desc||'(sin concepto)'); var o=m.origen||{}; d.appendChild(el('small',null,({mail:'✉ '+(o.de||'mail'),voz:'🎙 dictado',cloty:'✦ con Cloty',manual:'✍ cargado por vos'})[o.tipo]||'')); r.appendChild(d);
      r.appendChild(el('span','mm'+(m.tipo==='ingreso'?' in':''),(m.tipo==='ingreso'?'+':'−')+money(m.monto)));
      var c=el('span','mc'); var sel=el('select'); var cats=mvCats(m.tipo); if(m.cat&&cats.indexOf(m.cat)<0)cats.unshift(m.cat);
      var o0=el('option',null,'Sin categoría'); o0.value=''; sel.appendChild(o0);
      cats.forEach(function(x){ var op=el('option',null,x); op.value=x; if(x===m.cat)op.selected=true; sel.appendChild(op); });
      sel.addEventListener('change',function(){ m.cat=sel.value; mvSave(m); });
      c.appendChild(el('span','mvchip'+(prop?'':' ok'),prop?'por confirmar':'confirmado')); c.appendChild(sel);
      if(prop){ var ok=el('button','mvbtn ok','✓ Confirmar'); ok.type='button'; ok.addEventListener('click',function(){ m.estado='confirmado'; mvSave(m); renderMovs(); }); c.appendChild(ok); }
      var no=el('button','mvbtn','Descartar'); no.type='button'; no.addEventListener('click',function(){ m.estado='descartado'; mvSave(m); renderMovs(); }); c.appendChild(no);
      r.appendChild(c); list.appendChild(r); });
    var pb=document.getElementById('mv-pasar'); pb.hidden=!MESES.some(function(M){ return M[0]===mvMes&&M[2]!=='base'; });
    pb.textContent=mvArmed?('¿Reemplazar el real de '+MESN[mvMes.slice(5)]+' con '+money(t.ing)+' / '+money(t.egr)+'? Tocá de nuevo'):('Pasar lo confirmado al seguimiento de '+MESN[mvMes.slice(5)]); }
  document.getElementById('mv-pasar').addEventListener('click',function(){ if(!mvArmed){ mvArmed=true; renderMovs(); setTimeout(function(){ mvArmed=false; renderMovs(); },4000); return; }
    mvArmed=false; var t=mvTot(mvMes); var mm=F.meses[mvMes]||(F.meses[mvMes]={}); mm.ing=t.ing; mm.egr=t.egr; saveF(); renderFin(); });
  function mvNew(o){ var m={id:(o.origen&&o.origen.tipo==='mail'&&o.origen.ref)?('mail-'+o.origen.ref):('mv'+Date.now().toString(36)+Math.floor(Math.random()*1e3)), fecha:o.fecha||todayKey(), tipo:o.tipo==='ingreso'?'ingreso':'egreso', monto:Number(o.monto)||0, desc:o.desc||'', cat:o.cat||'', estado:o.estado||'confirmado', origen:o.origen||{tipo:'manual'}, creado:new Date().toISOString()};
    mvSave(m); mvMes=m.fecha.slice(0,7); if(mvMes<'2026-09')mvMes='2026-09'; renderMovs(); return m; }
  (function(){ var f=document.getElementById('mv-f'); f.value=todayKey();
    document.getElementById('mv-add').addEventListener('click',function(){ var d=document.getElementById('mv-d'), mo=document.getElementById('mv-m'); var v=parseNum(mo.value);
      if(!v){ mo.focus(); mo.placeholder='poné el monto'; return; }
      mvNew({fecha:f.value||todayKey(),tipo:document.getElementById('mv-t').value,monto:v,desc:d.value.trim(),origen:{tipo:'manual'}}); d.value=''; mo.value=''; }); })();
  function mvAttach(DBx,uid){ try{ mvCol=DBx.doc('data/users/'+uid+'/finanzas').collection('movs'); }catch(e){ mvCol=null; return; }
    mvCol.onSnapshot(function(qs){ var fromCache=qs.metadata&&qs.metadata.fromCache;
      if(qs.empty){ if(!fromCache&&Object.keys(MV).length){ Object.keys(MV).forEach(function(k){ mvSave(MV[k]); }); } return; }
      var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } });
      MV=m; lset(MVL,MV); if(finBody.contains(document.activeElement))return; renderMovs(); },function(){}); }

  function renderFin(){ renderEgr(); renderList(F.ing,'ing-body','ing-total',ingTot); renderList(F.cta,'cta-body','cta-total',ctaTot); renderBars(); renderMeses();
    fillMeta('meta-ahorro','ahorro'); fillMeta('meta-colchon','colchon'); fillMeta('meta-infl','infl');
    renderKpis(); renderStrip(); renderMovs(); renderPal(); renderObs(); renderFinFrente(); renderPriv(); }
  document.getElementById('add-ing').addEventListener('click',function(){ F.ing.push(['Nueva fuente',0]); saveF(); renderFin(); });
  document.getElementById('add-cta').addEventListener('click',function(){ F.cta.push(['Nueva cuenta',0]); saveF(); renderFin(); });
  var finView=document.getElementById('v-finanzas'), fh=document.getElementById('fin-hide');
  var invView=document.getElementById('v-inversiones'), ih=document.getElementById('inv-hide');
  function applyHide(h){ finView.classList.toggle('hidefin',h); invView.classList.toggle('hidefin',h); fh.textContent=h?'Mostrar montos':'Ocultar montos'; ih.textContent=fh.textContent; }
  ih.addEventListener('click',function(){ fh.click(); });
  var hid=lget('oreja_finhide2',false)===true; applyHide(hid);
  fh.addEventListener('click',function(){ hid=!hid; applyHide(hid); lset('oreja_finhide2',hid); });
  function setLocked(on){ document.getElementById('fin-locked').hidden=!on; finBody.hidden=!!on; fh.hidden=!!on; ih.hidden=!!on; }
  renderFin();
  function privMode(m){ finMode=m; gMode=m; renderPriv(); renderGestPriv(); cMode=m; rdMode=m; invMode=m; hoyMode=m; renderCierre(); renderRadar(); renderInv(); renderHoy(); spMode=m; adMode=m; renderSp(); renderAd(); poMode=m; renderPo(); hbMode=m; renderHb(); ngMode=m; renderNg(); gdMode=m; renderGd(); agMode=m; renderAg(); pjMode=m; renderPj(); cvMode=m; renderCv(); }
  async function finConnect(DBx){
    if(!DBx||!window.claude||!window.claude.use){ privMode('local'); return; }
    var U=null; try{ U=await window.claude.use('user'); }catch(e){ U=null; }
    if(!U){ privMode('local'); return; }
    var own=false; try{ own=await U.isOwner(); }catch(e){}
    if(!own){ finMode='ajeno'; F=finEmpty(); setLocked(true); renderFin(); gMode='ajeno'; G2={}; gestLock(true); renderGest(); renderGestPriv(); cMode='ajeno'; cierreLock(true); renderCierre(); rdMode='ajeno'; invMode='ajeno'; hoyMode='ajeno'; RD={}; lockMore(true); renderRadar(); renderInv(); renderHoy(); spMode='ajeno'; adMode='ajeno'; SP={}; AD={}; spAdLock(true); renderSp(); renderAd(); poMode='ajeno'; poLock(true); renderPo(); hbMode='ajeno'; hbLock(true); renderHb(); ngMode='ajeno'; ngLock(true); renderNg(); gdMode='ajeno'; gdLock(true); renderGd(); agMode='ajeno'; agLock(true); renderAg(); pjMode='ajeno'; pjLock(true); renderPj(); cvMode='ajeno'; cvLock(true); renderCv(); return; }
    var uid=null; try{ uid=await U.id(); }catch(e){}
    if(!uid){ privMode('local'); return; }
    gestAttach(DBx,uid); spAttach(DBx,uid); adAttach(DBx,uid); cierreAttach(DBx,uid); radarAttach(DBx,uid); hoyAttach(DBx,uid); invAttach(DBx,uid); notasAttach(DBx,uid); mvAttach(DBx,uid); poAttach(DBx,uid); hbAttach(DBx,uid); ngAttach(DBx,uid); gdAttach(DBx,uid); agAttach(DBx,uid); pjAttach(DBx,uid); ritAttach(DBx,uid); cloAttach(DBx,uid); doctrinaAttach(DBx,uid); usoAttach(DBx,uid); ctxAttach(DBx,uid); cvAttach(DBx,uid);
    try{ finRef=DBx.doc('data/users/'+uid+'/finanzas'); }catch(e){ finRef=null; privMode('local'); return; }
    finRef.onSnapshot(function(snap){ finMode='sync';
      if(!snap||!snap.exists){ if(F.egr.length||F.ing.length)saveF(); renderFin(); return; }
      var d=snap.data()||{}, j=null; try{ j=JSON.stringify(d); }catch(e){}
      if(j!==null&&j===finCurJ){ renderPriv(); return; }
      finCurJ=j; F=finNorm(d); lset(FL,F);
      if(finBody.contains(document.activeElement)) return;
      renderFin(); }, function(){ finMode='error'; renderPriv(); });
  }

