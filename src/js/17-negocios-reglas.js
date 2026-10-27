  // ---------- NEGOCIOS · reglas de cierre ----------
  var NG_TOPE=2;
  function ngIsDate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(String(s||'')); }
  function ngAllNo(it){ var c=it.c||{}; return NGCRIT.every(function(k){ return c[k[0]]==='no'; }); }
  function ngAvanzan(exceptId){ return ngAll().filter(function(x){ return (x.etapa||'idea')==='avanza'&&x.id!==exceptId; }); }
  function ngHist(it,txt){ (it.hist||(it.hist=[])).push({ts:nowIso(),txt:txt}); }
  function ngAskDate(box,label,fn){ if(box.querySelector('.gaddh'))return; var w=el('div','gaddh'); var l=el('span','gm',label); var i=el('input'); i.type='date'; i.min=todayKey(); var ok=el('button','minibtn','Confirmar'); ok.type='button';
    function go(){ if(!ngIsDate(i.value)||i.value<=todayKey()){ i.focus(); l.textContent='Elegí una fecha futura'; l.style.color='var(--crit)'; return; } fn(i.value); } ok.addEventListener('click',go); w.appendChild(l); w.appendChild(i); w.appendChild(ok); box.appendChild(w); setTimeout(function(){ try{ i.focus(); }catch(e){} },0); }
  var ngSweepDone={};
  function ngSweep(){ if(ngMode!=='sync')return; var t=todayKey();
    ngAll().forEach(function(it){ if(ngSweepDone[it.id])return; var et=it.etapa||'idea';
      if(et==='archivada'&&ngIsDate(it.revisar)&&it.revisar<=t){ ngSweepDone[it.id]=1; it.etapa='idea'; it.volvio=t; ngHist(it,'Volvió del archivo el '+dm(t)+' (fecha de revisión cumplida)');
        var gid='ngrev-'+it.id+'-'+t; var g={id:gid,t:'Revisar idea archivada: '+it.t,d:'Volvió del archivo de Negocios. Decidí: avanza, se descarta o se archiva con otra fecha.',frente:it.lado==='bs'?'bs':(it.lado==='golden'?'golden':'otro'),sev:'warn',origen:{tipo:'manual',de:'Negocios'},quien:'Lucho',fecha:t,prox:'Pasarla por el filtro',est:'nuevo',hist:[],creado:nowIso(),reprog:0};
        gHist(g,'Creado por la regla de archivo de Negocios','cloty'); gSave(g); ngSave(it); } }); }
  function ngMonthKey(){ return todayKey().slice(0,7); }
  function renderNgMet(all){ var box=document.getElementById('ng-met'); if(!box)return; box.innerHTML=''; var mk=ngMonthKey();
    var cerr=all.filter(function(x){ return (x.etapa||'idea')==='cerrada'&&String(x.cerradaEn||'').slice(0,7)===mk; }).length;
    var av=all.filter(function(x){ return (x.etapa||'idea')==='avanza'; }).length;
    var viejas=all.filter(function(x){ return (x.etapa||'idea')==='idea'&&x.creado&&dayDiff(localDay(x.creado),todayKey())>14; }).length;
    function t(l,v,s,c){ var d=el('div','spn'); d.appendChild(el('div','l',l)); var vv=el('div','v tnum',v); if(c)vv.style.color='var(--'+c+')'; d.appendChild(vv); if(s)d.appendChild(el('div','s',s)); box.appendChild(d); }
    t('Decisiones cerradas',String(cerr),'este mes · la métrica que importa',cerr?'ok':null);
    t('Avanzando',av+' de '+NG_TOPE,av>=NG_TOPE?'tope lleno: cerrá una para abrir otra':'lugar para una más',av>=NG_TOPE?'warn':null);
    t('Sin filtrar +14 d',String(viejas),viejas?'decidilas o descartalas':'al día',viejas?'crit':null); }
  function renderHomeDec(){ var w=document.getElementById('home-dec-w'), box=document.getElementById('home-dec'); if(!box)return; box.innerHTML='';
    if(ngMode==='ajeno'){ w.hidden=true; return; }
    var arr=ngAll().filter(function(x){ return (x.etapa||'idea')==='avanza'; }).sort(function(a,b){ var fa=(a.plan2&&a.plan2.decision.fecha)||'9999', fb=(b.plan2&&b.plan2.decision.fecha)||'9999'; return fa<fb?-1:(fa>fb?1:0); });
    w.hidden=!arr.length; arr.forEach(function(it){ var f=it.plan2&&it.plan2.decision.fecha, d=f?dayDiff(todayKey(),f):null, r=el('div','row');
      r.appendChild(el('span','dd'+(d==null?' warn':(d<0?' crit':(d<=14?' warn':''))),d==null?'sin fecha':(d<0?'vencida':(d===0?'hoy':d+' d'))));
      r.appendChild(el('span',null,(it.plan2&&it.plan2.decision.que)||it.t)); box.appendChild(r); }); }

