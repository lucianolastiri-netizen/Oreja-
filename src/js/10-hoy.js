  // ---------- HOY (lo escribe el barrido de la mañana) ----------
  var HOY=null, hoyMode='conectando';
  function hoyEv(box,e){ var ev=el('div','ev'); var t=el('div','t'); t.innerHTML=esc(e.ini||'')+(e.fin?'<br>'+esc(e.fin):''); ev.appendChild(t);
    var d=el('div'); var ttl=el('div','ttl',e.t||''); if(e.frente){ ttl.appendChild(document.createTextNode(' ')); ttl.appendChild(el('span','tag '+(RDFR[e.frente]||'personal'),frenteName(RDFR[e.frente]||'personal'))); }
    d.appendChild(ttl); if(e.nota)d.appendChild(el('small',null,e.nota)); ev.appendChild(d); box.appendChild(ev); }
  function renderHoy(){ renderHomeAgenda(); var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado.</b> Lo actualiza el barrido de las 08:00 con tu calendario y lo que quedó abierto.',local:'<b>Sin conexión a tu espacio privado.</b>',error:'<b>No se pudo leer.</b> Recargá.',ajeno:'<b>Sección privada del titular.</b>'}[hoyMode];
    document.getElementById('hoy-priv').innerHTML=pv||''; var tl=document.getElementById('hoy-tl'), w=document.getElementById('hoy-wait'); tl.innerHTML=''; w.innerHTML='';
    var tp=document.getElementById('tp-hoy');
    if(!HOY){ tl.appendChild(el('p','hint','Todavía no hay agenda cargada. La trae el barrido de mañana a las 08:00.')); if(tp)tp.textContent=hoyMode==='ajeno'?'privado':'sin agenda cargada'; document.getElementById('hoy-conf-card').hidden=true; return; }
    var old=HOY.fecha&&HOY.fecha<todayKey(); setT('hoy-dia',(HOY.fecha?dm(HOY.fecha):'')+(old?' · desactualizado':'')); setT('hoy-act',HOY.act?('actualizado '+dmhm(HOY.act)):'');
    (HOY.bloques||[]).forEach(function(e){ hoyEv(tl,e); });
    if(!(HOY.bloques||[]).length) tl.appendChild(el('p','hint','Sin bloques agendados.'));
    if((HOY.manana||[]).length){ tl.appendChild(el('div','daydiv','Mañana')); HOY.manana.forEach(function(e){ hoyEv(tl,e); }); }
    var es=HOY.esperan||[]; if(!es.length) w.appendChild(el('p','hint','Nadie esperando algo tuyo con fecha.'));
    es.forEach(function(x){ var r=el('div','wait'); var ini=String(x.quien||'?').split(/\s+/).map(function(p){ return p.charAt(0); }).join('').slice(0,2).toUpperCase();
      r.appendChild(el('div','who',ini)); var d=el('div'); d.appendChild(el('b',null,x.quien||'')); d.appendChild(document.createTextNode(' — '+(x.que||'')));
      if(x.desde)d.appendChild(el('div','since','Espera desde '+dm(x.desde)+' · '+dayDiff(x.desde,todayKey())+' d'));
      var u=safeUrl(x.url); if(u){ var a=el('a',null,' Abrir ↗'); a.href=u; a.target='_blank'; a.rel='noopener'; d.appendChild(a); } r.appendChild(d); w.appendChild(r); });
    var cf=HOY.conflictos||[]; var cc=document.getElementById('hoy-conf'); cc.innerHTML=''; document.getElementById('hoy-conf-card').hidden=!cf.length;
    cf.forEach(function(x){ cItem(cc,x,null,'',''); });
    if(tp){ var nx=null, hm=('0'+new Date().getHours()).slice(-2)+':'+('0'+new Date().getMinutes()).slice(-2);
      if(!old)(HOY.bloques||[]).forEach(function(e){ if(!nx&&(e.fin||e.ini||'')>=hm)nx=e; });
      tp.textContent=cf.length?(cf.length+' choque'+(cf.length>1?'s':'')+' con la jerarquía'):(nx?((nx.ini||'')+' '+nx.t):(old?'agenda de otro día':'sin más bloques hoy'));
      tp.className='tp'+(cf.length?' crit':''); } }
  function hoyAttach(DBx,uid){ try{ DBx.doc('data/users/'+uid+'/hoy').onSnapshot(function(s){ hoyMode='sync'; HOY=(s&&s.exists)?(s.data()||null):null; renderHoy(); },function(){ hoyMode='error'; renderHoy(); }); }catch(e){ hoyMode='local'; renderHoy(); } }

