  // ---------- DOCTRINA ----------
  var PK='oreja_princ_v1';
  var PSEED=[
    {id:'p1',texto:'Aprendizaje > Relación > ROI > Marca > Urgencia. La urgencia sola nunca alcanza.',autor:'Regla propia',area:'asignación'},
    {id:'p2',texto:'No negociables: Salud, Familia, Calidad, Ingresos. Nada se agenda encima de Golden ni de Europa.',autor:'Regla propia',area:'foco'},
    {id:'p3',texto:'Un pedido sin dueño y sin fecha no es prioridad, es la urgencia de otro.',autor:'Regla propia',area:'asignación'},
    {id:'p4',texto:'La operación conocida te protege de la incomodidad de construir lo nuevo. No soltar Dogos = evitación.',autor:'Cloty',area:'delegación'},
    {id:'p5',texto:'Crear la tarea no es avanzar. Si se reprogramó dos veces, el problema no es la fecha: falta una decisión.',autor:'Cloty',area:'foco'},
    {id:'p6',texto:'Un proyectado en pesos sin supuesto de inflación no dice nada. La cláusula de ajuste es lo más consecuente.',autor:'Regla de contexto AR',area:'plata'}
  ];
  var P=lget(PK,null); if(!P){ P=PSEED.slice(); saveP(); }
  var pFilter='todas';
  var tabsEl=document.getElementById('parea-tabs'), plistEl=document.getElementById('princ-list');
  function areas(){ var s={}; P.forEach(function(p){ if(p.area)s[p.area]=1; }); return Object.keys(s); }
  function renderTabs(){ tabsEl.innerHTML=''; ['todas'].concat(areas()).forEach(function(a){ var b=document.createElement('button'); b.className='ptab'+(a===pFilter?' on':''); b.type='button'; b.textContent=a; b.addEventListener('click',function(){ pFilter=a; renderTabs(); renderPrinc(); }); tabsEl.appendChild(b); }); }
  function renderPrinc(){ plistEl.innerHTML='';
    var arr=P.filter(function(p){ return pFilter==='todas'||p.area===pFilter; });
    arr.forEach(function(p){ var idx=P.indexOf(p); var el=document.createElement('div'); el.className='princ';
      var m='<div class="pt">'+esc(p.texto)+'</div><div class="pm">'+(p.autor?'<span class="pa">— '+esc(p.autor)+'</span>':'')+(p.area?'<span class="parea">'+esc(p.area)+'</span>':'')+'</div>';
      el.innerHTML=m;
      var del=document.createElement('button'); del.className='del'; del.type='button'; del.textContent='✕'; del.style.cssText='align-self:flex-start';
      del.addEventListener('click',function(){ P.splice(idx,1); saveP(); renderTabs(); renderPrinc(); renderPweek(); });
      el.querySelector('.pm').appendChild(del); plistEl.appendChild(el); });
    document.getElementById('princ-count').textContent=P.length+' principios';
  }
  document.getElementById('pf-add').addEventListener('click',function(){ var t=document.getElementById('pf-text').value.trim(); if(!t)return;
    P.push({id:'p'+Date.now(),texto:t,autor:document.getElementById('pf-autor').value.trim(),area:document.getElementById('pf-area').value}); saveP();
    document.getElementById('pf-text').value=''; document.getElementById('pf-autor').value=''; renderTabs(); renderPrinc(); renderPweek(); });
  document.getElementById('pf-import-btn').addEventListener('click',function(){ var raw=document.getElementById('pf-import').value.split('\n'); var n=0;
    raw.forEach(function(l){ l=l.trim(); if(l){ P.push({id:'p'+Date.now()+(n++),texto:l,autor:'importado',area:''}); } });
    if(n){ saveP(); document.getElementById('pf-import').value=''; renderTabs(); renderPrinc(); renderPweek(); } });
  function renderPweek(){ if(!P.length){document.getElementById('pweek-q').textContent='Sumá tu primer principio en Doctrina.';document.getElementById('pweek-a').textContent='';return;}
    var d=new Date(); var wk=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)/7); var p=P[wk%P.length];
    document.getElementById('pweek-q').textContent='“'+p.texto+'”'; document.getElementById('pweek-a').textContent=p.autor?('— '+p.autor+(p.area?(' · '+p.area):'')):''; }
  renderTabs(); renderPrinc(); renderPweek();
  function doctrinaAttach(DBx,uid){ var legacy, migrado=false;
    try{ pRef=DBx.doc('data/users/'+uid+'/principios'); legacy=DBx.doc('state/principios'); }catch(e){ pRef=null; return; }
    pRef.onSnapshot(function(s){
      if(s&&s.exists){ var d=s.data()||{}; if(Array.isArray(d.items)){ P=d.items; lset(PK,P); renderTabs(); renderPrinc(); renderPweek(); } return; }
      if(migrado||(s&&s.metadata&&s.metadata.fromCache))return; migrado=true;
      // Primera vez en el espacio privado: trae lo del documento compartido viejo y recién después lo borra de ahí.
      legacy.get().then(function(ls){ var it=ls&&ls.exists&&(ls.data()||{}).items; if(Array.isArray(it)&&it.length)P=it; return pRef.set({items:P}); })
        .then(function(){ return legacy.delete(); })['catch'](function(){});
    },function(){}); }

