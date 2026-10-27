  // ---------- INICIO: agenda ----------
  function renderHomeAgenda(){ var box=document.getElementById('home-agenda'); if(!box)return; box.innerHTML='';
    function row(h,t,c){ var r=el('div','row'+(c?' '+c:'')); if(h)r.appendChild(el('span','hr',h)); r.appendChild(el('span',null,t)); box.appendChild(r); }
    if(hoyMode==='ajeno'){ row('','Privado del titular'); return; }
    if(!HOY||!(HOY.bloques||[]).length||(HOY.fecha&&HOY.fecha<todayKey())){ row('',HOY&&HOY.fecha&&HOY.fecha<todayKey()?'La agenda cargada es de otro día. La actualiza el barrido de la mañana.':'Sin agenda cargada para hoy.'); return; }
    var hm=('0'+new Date().getHours()).slice(-2)+':'+('0'+new Date().getMinutes()).slice(-2);
    var up=HOY.bloques.filter(function(e){ return (e.fin||e.ini||'')>=hm; }).slice(0,3);
    if(!up.length){ row('','Sin más bloques hoy.'); return; }
    up.forEach(function(e,i){ row(e.ini||'',e.t||'',i===0?'now':''); }); }

