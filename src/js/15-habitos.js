  // ---------- HÁBITOS (privado) ----------
  var HBDEF=[{id:'leer',n:'Leer',tipo:'check',core:true},{id:'ejercicio',n:'Ejercicio',tipo:'check',core:true},{id:'comer',n:'Comer sano',tipo:'check'},{id:'sueno',n:'Sueño',tipo:'num',unidad:'h'}];
  var HB={defs:null,dias:{},premio:'',metaSem:5,metaSueno:null}, hbRef=null, hbCurJ=null, hbTimer=null, hbMode='conectando';
  var hbBody=document.getElementById('hb-body');
  function hbNorm(o){ var v={defs:null,dias:{},premio:'',metaSem:5,metaSueno:null}; if(o&&typeof o==='object'){ if(Array.isArray(o.defs)&&o.defs.length)v.defs=o.defs; if(o.dias&&typeof o.dias==='object')v.dias=o.dias; if(o.premio)v.premio=String(o.premio); if(o.metaSem)v.metaSem=Number(o.metaSem)||5; if(o.metaSueno!=null)v.metaSueno=Number(o.metaSueno)||null; } return v; }
  function saveHb(){ if(hbRef){ clearTimeout(hbTimer); hbTimer=setTimeout(function(){ try{ var j=JSON.stringify(HB); hbCurJ=j; hbRef.set(JSON.parse(j))['catch'](function(){ hbMode='error'; renderHb(); }); }catch(e){} },300); } }
  function hbLock(on){ document.getElementById('hb-locked').hidden=!on; hbBody.hidden=!!on; }
  function hbDefs(){ return (HB.defs&&HB.defs.length)?HB.defs:HBDEF; }
  function dayKey(n){ var d=new Date(); d.setDate(d.getDate()-n); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function hbVal(def,k){ return (HB.dias[k]||{})[def.id]; }
  function hbDone(def,k){ var v=hbVal(def,k); if(def.tipo==='num'){ if(v==null||v==='')return false; return HB.metaSueno?Number(v)>=HB.metaSueno:true; } return v===true; }
  function hbSet(def,k,v){ var d=HB.dias[k]||(HB.dias[k]={}); if(v==null||v===false)delete d[def.id]; else d[def.id]=v; saveHb(); renderHb(); }
  function hbStreak(def){ var n=0, i=hbDone(def,dayKey(0))?0:1; while(n<400&&hbDone(def,dayKey(i))){ n++; i++; } return n; }
  function hbWeek(def){ var n=0; for(var i=0;i<7;i++) if(hbDone(def,dayKey(i)))n++; return n; }
  function hbFirst(){ var ks=Object.keys(HB.dias).sort(); return ks.length?ks[0]:null; }
  function hbTwoMiss(def){ var f=hbFirst(); if(!f||f>dayKey(2))return false; return !hbDone(def,dayKey(1))&&!hbDone(def,dayKey(2))&&!hbDone(def,dayKey(0)); }
  function hbStrip(box,full){ box.innerHTML=''; var t=todayKey(), warn=[];
    hbDefs().forEach(function(def){ if(!full&&!def.core&&def.tipo==='num')return;
      if(def.tipo==='num'){ var w=el('label','hnum'); w.appendChild(document.createTextNode(def.n)); var i=el('input'); i.type='text'; i.inputMode='decimal'; i.value=hbVal(def,t)!=null?dec(hbVal(def,t)):''; i.placeholder=def.unidad||'';
        i.setAttribute('aria-label',def.n+' de anoche, en horas'); i.addEventListener('change',function(){ hbSet(def,t,parseDec(i.value)); }); w.appendChild(i); box.appendChild(w); return; }
      var on=hbDone(def,t), b=el('button','hbtn'+(on?' on':'')); b.type='button'; b.setAttribute('aria-pressed',on?'true':'false'); b.appendChild(document.createTextNode(def.n));
      var s=hbStreak(def); if(s)b.appendChild(el('span','st',s+' d')); b.addEventListener('click',function(){ hbSet(def,t,on?false:true); }); box.appendChild(b);
      if(def.core&&hbTwoMiss(def))warn.push(def.n); });
    if(warn.length) box.appendChild(el('div','hwarn','Dos días sin '+warn.join(' ni ').toLowerCase()+': hoy no se negocia.')); }
  function renderHb(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Se guarda al tocar. Cloty lo mira en el cierre del viernes.',local:'<b>Sin conexión a tu espacio privado.</b> Lo que marques no se guarda fuera de esta sesión.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[hbMode];
    document.getElementById('hb-priv').innerHTML=pv||''; var tp=document.getElementById('tp-hab'), hs=document.getElementById('home-hab');
    if(hbMode==='ajeno'){ if(tp){ tp.textContent='privado'; tp.className='tp'; } if(hs)hs.innerHTML=''; return; }
    var defs=hbDefs(), core=defs.filter(function(d){ return d.core; }), t=todayKey();
    if(hs)hbStrip(hs,false); hbStrip(document.getElementById('hb-hoy'),true);
    var doneT=defs.filter(function(d){ return hbDone(d,t); }).length; setT('hb-hoy-k',doneT+' de '+defs.length);
    var g=document.getElementById('hb-grid'); g.innerHTML=''; g.appendChild(el('span','h',''));
    for(var i=6;i>=0;i--){ var dd=new Date(); dd.setDate(dd.getDate()-i); g.appendChild(el('span','h',['D','L','M','M','J','V','S'][dd.getDay()])); }
    g.appendChild(el('span','h','7 d'));
    defs.forEach(function(def){ g.appendChild(el('span',null,def.n+(def.core?'':'')));
      for(var i=6;i>=0;i--){ (function(k,isT){ var on=hbDone(def,k), c=el('button','hcell'+(on?' on':'')+(isT?' hoy':'')); c.type='button'; c.setAttribute('aria-label',def.n+' '+dm(k)+(on?': hecho':': sin hacer'));
        if(def.tipo==='num'){ var v=hbVal(def,k); c.textContent=v!=null?dec(v):''; c.addEventListener('click',function(){ var i=el('input','hcell'); i.type='text'; i.inputMode='decimal'; i.value=v!=null?dec(v):''; i.setAttribute('aria-label',def.n+' del '+dm(k)+', en horas'); i.style.textAlign='center'; c.replaceWith(i); i.focus(); var done=false; function fin(){ if(done)return; done=true; hbSet(def,k,parseDec(i.value)); } i.addEventListener('change',fin); i.addEventListener('blur',fin); i.addEventListener('keydown',function(e){ if(e.key==='Enter')i.blur(); }); }); }
        else c.addEventListener('click',function(){ hbSet(def,k,on?false:true); });
        g.appendChild(c); })(dayKey(i),i===0); }
      g.appendChild(el('span','tot',hbWeek(def)+'/7')); });
    var okAll=core.length&&core.every(function(d){ return hbWeek(d)>=HB.metaSem; }), pr=document.getElementById('hb-prem');
    var falt=core.map(function(d){ var f=HB.metaSem-hbWeek(d); return f>0?(d.n+': faltan '+f):null; }).filter(Boolean);
    pr.innerHTML=!core.length?'Marcá al menos un hábito como central para jugar por el premio.':(okAll?('<b class="ok">Semana cumplida.</b> '+(HB.premio?'Te ganaste: '+esc(HB.premio)+'.':'Definí el premio abajo.')):('Para el premio'+(HB.premio?' ('+esc(HB.premio)+')':'')+' necesitás '+HB.metaSem+' de 7 en cada central. '+esc(falt.join(' · '))+'.'));
    var pi=document.getElementById('hb-premio'); if(document.activeElement!==pi)pi.value=HB.premio||''; document.getElementById('hb-meta').value=String(HB.metaSem);
    var si=document.getElementById('hb-sueno'); if(document.activeElement!==si)si.value=HB.metaSueno?dec(HB.metaSueno):'';
    var dl=document.getElementById('hb-defs'); dl.innerHTML='';
    defs.forEach(function(def){ var li=el('li'); li.appendChild(el('span','t',def.n+(def.tipo==='num'?' (horas)':''))); li.appendChild(el('span','x','racha '+hbStreak(def)+' d'));
      var cb=el('button','gtask',def.core?'Central ✓':'Hacer central'); cb.type='button'; cb.addEventListener('click',function(){ var a=hbDefs().map(function(x){ var y=JSON.parse(JSON.stringify(x)); if(y.id===def.id)y.core=!y.core; return y; }); HB.defs=a; saveHb(); renderHb(); }); li.appendChild(cb);
      li.appendChild(delBtn(function(){ HB.defs=hbDefs().filter(function(x){ return x.id!==def.id; }); if(!HB.defs.length)HB.defs=null; saveHb(); renderHb(); })); dl.appendChild(li); });
    setT('hb-def-k',defs.length+' hábitos · '+core.length+' centrales');
    var best=core.map(hbStreak).sort(function(a,b){ return a-b; })[0]||0; setT('hb-k',doneT+' de '+defs.length+' hoy');
    setTimeout(function(){ try{ renderRit(); }catch(e){} },0);
    if(tp){ var miss=core.filter(hbTwoMiss).length; tp.textContent=miss?'cortaste 2 días':(doneT+' de '+defs.length+' hoy'+(best?' · racha '+best+' d':'')); tp.className='tp'+(miss?' crit':(doneT===defs.length?' ok':'')); } }
  document.getElementById('hb-premio').addEventListener('change',function(e){ HB.premio=e.target.value.trim(); saveHb(); renderHb(); });
  document.getElementById('hb-meta').addEventListener('change',function(e){ HB.metaSem=Number(e.target.value)||5; saveHb(); renderHb(); });
  document.getElementById('hb-sueno').addEventListener('change',function(e){ HB.metaSueno=parseDec(e.target.value); saveHb(); renderHb(); });
  function hbAddDef(){ var i=document.getElementById('hb-add-in'), v=i.value.trim(); if(!v)return; var a=hbDefs().map(function(x){ return JSON.parse(JSON.stringify(x)); }); a.push({id:'h'+Date.now().toString(36),n:v,tipo:'check'}); HB.defs=a; i.value=''; saveHb(); renderHb(); }
  document.getElementById('hb-add').addEventListener('click',hbAddDef);
  document.getElementById('hb-add-in').addEventListener('keydown',function(e){ if(e.key==='Enter')hbAddDef(); });
  function hbAttach(DBx,uid){ try{ hbRef=DBx.doc('data/users/'+uid+'/habitos'); }catch(e){ hbMode='local'; renderHb(); return; }
    hbRef.onSnapshot(function(s){ hbMode='sync'; if(!s||!s.exists){ renderHb(); return; } var d=s.data()||{}, j=null; try{ j=JSON.stringify(d); }catch(e){}
      if(j!==null&&j===hbCurJ){ renderHb(); return; } hbCurJ=j; HB=hbNorm(d); var a=document.activeElement; if(a&&a.tagName==='INPUT'&&(hbBody.contains(a)||document.getElementById('home-hab').contains(a)))return; renderHb(); },function(){ hbMode='error'; renderHb(); }); }
  renderHb(); renderHomeAgenda();

