  // ---------- ÁGORA FIELD (privado; aporte al Distrito + seguimiento del rol) ----------
  var AG={}, agRef=null, agMode='conectando', agBody=document.getElementById('ag-body');
  var AGOBS=[['sin','Sin presentar'],['pres','Presentada'],['acep','Aceptada'],['desc','Descartada']];
  var AGACT=[['sin','Sin contacto'],['cont','Contactado'],['reu','Reunión hecha'],['carta','Carta de intención'],['desc','Descartado']];
  function agLock(on){ document.getElementById('ag-locked').hidden=!on; agBody.hidden=!!on; }
  function agSave(){ AG.act=nowIso(); if(agRef){ agRef.set(JSON.parse(JSON.stringify(AG)))['catch'](function(){ agMode='error'; renderAg(); }); } }
  function agSel(opts,val,fn){ var s=el('select','estsel'); opts.forEach(function(o){ var op=el('option',null,o[1]); op.value=o[0]; if((val||'sin')===o[0])op.selected=true; s.appendChild(op); }); s.addEventListener('change',function(){ fn(s.value); }); return s; }
  function agDays(iso){ try{ return dayDiff(todayKey(),iso); }catch(e){ return null; } }
  function renderAg(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Lo que presentás, a quién y qué falta para el rol.',local:'<b>Sin conexión a tu espacio privado.</b> Esta sección solo se ve desde tu cuenta.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[agMode];
    document.getElementById('ag-priv').innerHTML=pv||''; var tp=document.getElementById('tp-agora');
    if(agMode==='ajeno'){ if(tp){ tp.textContent='privado'; tp.className='tp'; } return; }
    var obs=AG.obs||[], fases=AG.fases||[], act=AG.actores||[];
    if(!obs.length&&!fases.length){ document.getElementById('ag-obs').innerHTML='<p class="hint">Todavía no hay datos cargados.</p>'; if(tp){ tp.textContent='sin datos'; tp.className='tp'; } return; }
    var op=(typeof OPO!=='undefined'&&OPO&&OPO['op-agora-rol'])||null, cv=(typeof CV!=='undefined'&&CV&&CV['cv-rodrigo-aporte-agora'])||null, gi=(typeof G2!=='undefined'&&G2&&G2['charla-20261019-aporte-agora'])||null;
    var muere=(op&&op.muere)||AG.decision||'', dd=muere?agDays(muere):null;
    setT('ag-dias',muere?(dd>=0?'el rol se decide en '+dd+' d ('+dm(muere)+')':'la fecha del rol pasó hace '+(-dd)+' d'):'');
    var st=document.getElementById('ag-st'); st.innerHTML='';
    function S(l,v,s,href,cls){ var a=el(href?'a':'div','pstat'+(cls?' '+cls:'')); if(href)a.href=href; a.appendChild(el('div','l',l)); a.appendChild(el('div','v',v)); if(s)a.appendChild(el('div','s',s)); st.appendChild(a); }
    var cvd=cv&&cv.est==='dada', cvf=cv&&cv.fecha;
    S('Conversación con Rodrigo',cv?(cvd?'Dada':'Pendiente'):'—',cv?(cvd?'revisá qué pasó en Posición':(cvf?'para el '+dm(cvf)+(cvf<todayKey()?' · fecha pasada':''):'sin fecha')):'cargala en Posición','#poder',cv&&!cvd&&cvf&&cvf<todayKey()?'':'');
    var gest={nuevo:'Sin tratar',curso:'En curso',esperando:'Esperando',escalado:'Escalado',hecho:'Hecho',descartado:'Descartado'};
    S('Tema en Gestión',gi?(gest[gi.est]||gi.est||'—'):'—',gi?(gi.fecha?'vence el '+dm(gi.fecha):'sin fecha'):'',"#temas");
    var mand={zap:'ZAP',omg:'OMG',ambos:'Conviven'}[AG.manda]||'Sin respuesta';
    S('Documento que manda',mand,AG.manda?'':'preguntale a Rodrigo antes de presentar',null);
    var ms=document.getElementById('ag-manda'); if(document.activeElement!==ms) ms.value=AG.manda||'';
    var lk=document.getElementById('ag-links'); lk.innerHTML=''; (AG.links||[]).forEach(function(l){ var a=el('a',null,l.t); a.href=l.u; a.target='_blank'; a.rel='noopener'; lk.appendChild(a); });
    // observaciones
    var ob=document.getElementById('ag-obs'); ob.innerHTML=''; var np=0, na=0;
    obs.forEach(function(o){ var e=o.est||'sin'; if(e!=='sin'&&e!=='desc')np++; if(e==='acep')na++;
      var r=el('div','agrow'+(e==='desc'?' off':'')), a=el('div'); a.appendChild(el('b',null,o.pieza)); a.appendChild(el('p',null,o.aporte)); a.appendChild(el('span','gm',o.porque)); r.appendChild(a);
      r.appendChild(agSel(AGOBS,e,function(v){ o.est=v; agSave(); renderAg(); })); ob.appendChild(r); });
    setT('ag-obs-k',np+' de '+obs.length+' presentadas · '+na+' aceptadas');
    // plan
    var pl=document.getElementById('ag-plan'); pl.innerHTML=''; var tot=0, ok=0;
    fases.forEach(function(f){ var w=el('div','agfase'), h=el('h4',null,f.t), fo=0; (f.items||[]).forEach(function(i){ if(i.ok)fo++; }); tot+=(f.items||[]).length; ok+=fo;
      h.appendChild(el('span','k',f.sem+' · '+fo+'/'+(f.items||[]).length)); w.appendChild(h);
      (f.items||[]).forEach(function(i){ var lb=el('label','agchk'+(i.ok?' ok':'')), c=el('input'); c.type='checkbox'; c.checked=!!i.ok; c.addEventListener('change',function(){ i.ok=c.checked; agSave(); renderAg(); }); lb.appendChild(c); lb.appendChild(el('span',null,i.t)); w.appendChild(lb); });
      pl.appendChild(w); });
    setT('ag-plan-k',ok+' de '+tot+' entregables');
    // actores
    var ac=document.getElementById('ag-act'); ac.innerHTML=''; var nc=0, ncar=0;
    act.forEach(function(x){ var e=x.est||'sin'; if(e!=='sin'&&e!=='desc')nc++; if(e==='carta')ncar++;
      var r=el('div','agrow'+(e==='desc'?' off':'')), a=el('div'), t=el('b',null,x.actor); a.appendChild(t); a.appendChild(el('span','gm',(x.ola?'Ola '+x.ola+' · ':'')+'contacta: '+x.quien+(x.nota?' · '+x.nota:''))); r.appendChild(a);
      r.appendChild(agSel(AGACT,e,function(v){ x.est=v; agSave(); renderAg(); })); ac.appendChild(r); });
    setT('ag-act-k',nc+' en contacto · '+ncar+' cartas de intención');
    setT('ag-k',np+'/'+obs.length+' presentadas · '+ncar+' cartas');
    if(tp){ tp.textContent=np+'/'+obs.length+' presentadas'+(muere&&dd!=null?' · rol: '+(dd>=0?dd+' d':'vencido'):''); tp.className='tp'+(dd!=null&&dd<0?' crit':(dd!=null&&dd<=14&&!np?' warn':'')); } }
  document.getElementById('ag-manda').addEventListener('change',function(e){ AG.manda=e.target.value; agSave(); renderAg(); });
  window.addEventListener('hashchange',function(){ if((location.hash||'')==='#agora')renderAg(); });
  function agAttach(DBx,uid){ try{ agRef=DBx.doc('data/users/'+uid+'/agora'); }catch(e){ agMode='local'; renderAg(); return; }
    agRef.onSnapshot(function(sn){ agMode='sync'; AG=(sn&&sn.exists)?JSON.parse(JSON.stringify(sn.data()||{})):{}; var a=document.activeElement; if(a&&a.tagName==='SELECT'&&agBody.contains(a))return; renderAg(); },function(){ agMode='error'; renderAg(); }); }
  renderAg();

