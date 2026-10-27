  // ---------- GOOGLE CALENDAR (capacidad mcp: lee tu agenda y agenda temas) ----------
  var CAL='Google Calendar', MCP=null, calBusy={};
  function calInput(){ var s=new Date(); s.setHours(0,0,0,0); var e=new Date(s); e.setDate(e.getDate()+7);
    function k(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
    return {startTime:k(s)+'T00:00:00',endTime:k(e)+'T23:59:00',orderBy:'startTime',pageSize:100}; }
  function calMsg(c){ return c==='needs_reauth'?'Tu Google Calendar necesita reconectarse: claude.ai → Configuración → Conectores.':
    c==='server_not_connected'?'Agregá Google Calendar en claude.ai → Configuración → Conectores.':
    (c==='approval_required'||c==='not_in_manifest')?'Oreja necesita tu permiso para usar tu Google Calendar.':
    c==='server_unavailable'?'Google Calendar no respondió. Se reintenta solo.':'No se pudo usar Google Calendar.'; }
  var CALLAST=null; // último payload de list_events, lo lee Cloty en vivo
  function renderCal(payload,stamp){ CALLAST=payload||null; var box=document.getElementById('cal-list'); if(!box)return; box.innerHTML='';
    var evs=((payload&&payload.events)||[]).filter(function(e){ return e&&e.transparency!=='transparent'&&e.status!=='cancelled'; });
    if(!evs.length){ box.appendChild(el('p','hint','Sin eventos en los próximos 7 días.')); return; }
    var last='';
    evs.forEach(function(e){ var s=(e.start&&(e.start.dateTime||e.start.date))||''; if(!s)return; var day=s.slice(0,10);
      if(day!==last){ last=day; var f=new Date(day+'T12:00:00'), lab=''; try{ lab=f.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'short'}); }catch(x){ lab=dm(day); } box.appendChild(el('div','daydiv',(day===todayKey()?'Hoy · ':'')+lab)); }
      var ev=el('div','ev'); ev.appendChild(el('div','t',e.start.dateTime?s.slice(11,16):'todo el día'));
      var d=el('div'), ttl=el('div','ttl'); var u=safeUrl(e.htmlLink);
      if(u){ var a=el('a',null,e.summary||'(sin título)'); a.href=u; a.target='_blank'; a.rel='noopener'; ttl.appendChild(a); } else ttl.textContent=e.summary||'(sin título)';
      d.appendChild(ttl); if(e.location)d.appendChild(el('small',null,e.location)); ev.appendChild(d); box.appendChild(ev); });
    if(stamp) setT('cal-k','próximos 7 días · '+stamp); }
  function calError(err){ var box=document.getElementById('cal-list'); if(!box)return; box.innerHTML=''; var c=err&&err.code;
    box.appendChild(el('p','hint',calMsg(c)));
    if(c==='approval_required'||c==='not_in_manifest'){ var b=el('button','minibtn','Permitir y cargar'); b.type='button';
      b.addEventListener('click',function(){ MCP.callTool(CAL,'list_events',calInput()).then(function(r){ renderCal(r.payload); },calError); }); box.appendChild(b); } }
  function calStart(){ if(!MCP||hoyMode==='ajeno'){ var b=document.getElementById('cal-card'); if(b)b.hidden=true; return; }
    MCP.watchTool(CAL,'list_events',calInput(),function(ev){
      if(ev.type==='data'){ var t=ev.result.cache&&ev.result.cache.storedAt; var hm=''; try{ hm='actualizado '+new Date(t||Date.now()).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }catch(x){} renderCal(ev.result.payload,hm); }
      else calError(ev.error); },{refetchInterval:300000}); }
  // Crea el evento del tema en Calendar. La usan el botón de Gestión y Cloty en vivo.
  // Resuelve true si quedó agendado; el resultado también queda en la bitácora del tema.
  function calAgendar(it){ if(!MCP||!it.fecha||it.calId||calBusy[it.id])return Promise.resolve(!!it.calId); calBusy[it.id]=true; renderGest(); var ok=false;
    var det=[]; if(it.prox)det.push('Próximo paso: '+it.prox); if(it.quien)det.push('Quién: '+it.quien); if(it.d)det.push(it.d); det.push('Frente: '+frenteName(it.frente)); det.push('Cargado desde OREJA CEO › Gestión.');
    var hh=it.hora||'09:00'; return MCP.callTool(CAL,'create_event',{summary:it.t,startTime:it.fecha+'T'+hh+':00',endTime:it.fecha+'T'+addMin(hh,30)+':00',description:det.join('\n\n'),overrideReminders:[{method:'popup',minutes:1440},{method:'popup',minutes:60}]})
      .then(function(r){ var p=r&&r.payload; ok=true; it.calId=(p&&p.id)||'ok'; if(p&&p.htmlLink){ (it.links||(it.links=[])).push({txt:'Evento en Calendar',url:p.htmlLink}); }
        gHist(it,'Agendado en Google Calendar el '+dm(it.fecha)+' '+hh+', con avisos 24 h y 1 h antes'); gSave(it); MCP.invalidate(CAL,'list_events')['catch'](function(){}); })
      ['catch'](function(e){ var c=e&&e.code; gHist(it,(c==='server_unavailable'||c==='upstream_error')?'Calendar no confirmó: revisá tu agenda antes de reintentar, puede haberse creado.':calMsg(c)); gSave(it); })
      .then(function(){ delete calBusy[it.id]; renderGest(); return ok; }); }
  function calBtn(it){ var b=el('button','gtask'); b.type='button';
    if(it.calId){ b.textContent='📅 En Calendar ✓ (sigue a la fecha)'; b.disabled=true; return b; }
    if(!MCP){ b.textContent='📅 Calendar no disponible'; b.disabled=true; return b; }
    if(!it.fecha){ b.textContent='📅 Poné fecha para agendar'; b.disabled=true; return b; }
    b.textContent=calBusy[it.id]?'Agendando…':'📅 Agendar '+dm(it.fecha)+' '+(it.hora||'09:00'); b.disabled=!!calBusy[it.id];
    b.addEventListener('click',function(){ calAgendar(it); });
    return b; }
  (async function(){ try{ if(window.claude&&window.claude.use){ MCP=await window.claude.use('mcp'); } }catch(e){ MCP=null; } renderGest(); calStart(); })();

