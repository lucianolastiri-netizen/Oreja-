  // ---------- CLOTY EN VIVO (agente: lee todo Oreja, propone y cambia solo con tu OK) ----------
  // Usa `sample` con herramientas de la página. Cada escritura pasa por una tarjeta de confirmación.
  // Además muestra el parte de los agentes programados y deja responder sus pedidos por la bitácora:
  // la respuesta es una entrada {agente:'oreja-ceo', para:<agente>, pedido:<respuesta>, ref:<id del pedido>}.
  var cvMode='conectando', cvRef=null, cvTurnos=[], cvBusy=false, cvCtl=null, cvActs=[], SAMPLECV=null, cvConTools=false;
  var BIT={}, bitCol=null, PARTES={}, parteCol=null, cvPedOpen={};
  var cvBody=document.getElementById('cv-body'), cvLog=document.getElementById('cv-log');
  var CVQ=[['ahora','¿Qué hago ahora?','Mirá mi agenda de hoy, lo vencido y mis proyectos en foco. Decime UNA sola cosa para hacer ahora y por qué, según mi jerarquía. Si estoy evitando algo, decímelo.'],
    ['desafio','Desafiame','Revisá cómo vengo: temas reprogramados, oportunidades vencidas, conversaciones que evito, Europa y el peso de Dogos. Decime sin vueltas el patrón que más me está costando y qué decisión tomo hoy.'],
    ['dia','Armame el día','Con la agenda de hoy y lo abierto, armame el día en bloques con lo que va en cada uno. Si algo choca con la jerarquía, marcalo y proponé qué mover.'],
    ['vencidos','Limpiemos lo vencido','Leé mis temas vencidos, los reprogramados 2+ veces y los que tengan la fecha mal cargada. Proponeme en UN lote qué hacer con cada uno (cerrar, descartar, reprogramar, delegar o esperando) con el motivo en una línea y, si se cierra, la línea de cierre. Primero Golden y Europa. Sé exigente: lo que lleva semanas vencido sin moverse probablemente hay que descartarlo o delegarlo, no reprogramarlo otra vez.'],
    ['cierre','Cerremos el día','Repasemos el día: qué se cerró, qué venció y qué quedó sin próximo paso. Proponeme los cambios concretos y hacelos cuando te dé el OK.'],
    ['pedidos','Pedidos de los agentes','Leé los pedidos abiertos que me dejaron mis agentes y ayudame a resolverlos de a uno: qué conviene y qué le respondo a cada agente.']];
  var CVAG={gestion:'Gestión',resumen:'Resumen',formacion:'Formación',barrido:'Barrido',bitacora:'Bitácora','cierre-tarde':'Cierre de la tarde',parte:'Parte diario',legal:'Legal',radar:'Radar','cierre-viernes':'Cierre de viernes',guardia:'Guardia',motor:'Motor de negocios',finanzas:'Finanzas',revision:'Revisión mensual',whatsapp:'WhatsApp','cloty-vivo':'Cloty en vivo','oreja-ceo':'Oreja'};
  function cvAgName(a){ return CVAG[a]||a||'agente'; }
  function cvLock(on){ document.getElementById('cv-locked').hidden=!on; cvBody.hidden=!!on; }

  // ----- bitácora y parte -----
  function bitAll(){ return Object.keys(BIT).map(function(k){ return BIT[k]; }).filter(function(x){ return x&&x.agente; }).sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }); }
  function cvPedidos(){ var lim=new Date(Date.now()-7*86400000).toISOString(), all=bitAll(), resp={};
    all.forEach(function(x){ if(x.agente==='oreja-ceo'&&x.ref)resp[x.ref]=1; });
    return all.filter(function(x){ return x.agente!=='oreja-ceo'&&x.agente!=='cloty-vivo'&&x.para==='oreja-ceo'&&x.pedido&&String(x.ts||'')>=lim&&!resp[x.id]; }).reverse(); }
  function parteUlt(){ var ks=Object.keys(PARTES).sort(); return ks.length?PARTES[ks[ks.length-1]]:null; }
  function hhmm(d){ return ('0'+d.getHours()).slice(-2)+('0'+d.getMinutes()).slice(-2); }
  function bitWrite(o){ if(!bitCol)return Promise.reject(new Error('Sin conexión con la bitácora.'));
    var now=new Date(), id=o.agente+'-'+todayKey().replace(/-/g,'')+'-'+hhmm(now)+'-'+Math.random().toString(36).slice(2,5);
    var e={id:id,agente:o.agente,ts:now.toISOString(),estado:o.estado||'ok',hizo:String(o.hizo||'').slice(0,600),hallazgos:o.hallazgos||[],para:o.para||'todos',pedido:String(o.pedido||'').slice(0,600)};
    if(o.ref)e.ref=o.ref; BIT[id]=e; return bitCol.doc(id).set(e).then(function(){ return e; }); }
  function cvResponder(x,texto,via){ return bitWrite({agente:'oreja-ceo',hizo:'Respuesta de Oreja a '+cvAgName(x.agente)+(via?' ('+via+')':''),para:x.agente,pedido:texto,ref:x.id}); }

  function renderParte(){ var box=document.getElementById('cv-parte'); if(!box)return; box.innerHTML='';
    var p=parteUlt(), peds=cvPedidos(), t=todayKey();
    var h=el('h3',null,'Lo que reportan tus agentes'); h.appendChild(el('span','k',p?('parte del '+dm(p.fecha||'')):'el primer parte llega a las 18:07')); box.appendChild(h);
    if(p){ if(p.decision){ box.appendChild(el('div','eyebrow','La decisión de mañana')); box.appendChild(el('div','cvdec',p.decision)); }
      if(p.lectura) box.appendChild(el('p','hint',p.lectura));
      var r=p.rutinas||{}, fx=(r.fallas||[]), nc=(r.noCorrieron||[]);
      if(fx.length||nc.length){ var ul=el('ul','clist'); fx.forEach(function(f){ var li=el('li'); li.appendChild(el('span','t',(f.nombre||'')+(f.motivo?' · '+f.motivo:''))); li.appendChild(el('span','x nb',(f.hora||'')+(f.reintento==='sí'?' · reintentada':''))); ul.appendChild(li); });
        nc.forEach(function(n){ var li=el('li'); li.appendChild(el('span','t',n)); li.appendChild(el('span','x nb','no corrió')); ul.appendChild(li); }); box.appendChild(ul); }
      if(p.legal) box.appendChild(el('p','gdet','Legal: '+p.legal)); }
    // pedidos abiertos
    var ph=el('div','eyebrow',peds.length?(peds.length+' pedido'+(peds.length>1?'s':'')+' para vos'):'Sin pedidos abiertos de tus agentes'); ph.style.marginTop='12px'; box.appendChild(ph);
    peds.forEach(function(x){ var w=el('div','cvped'); w.appendChild(el('span','who',cvAgName(x.agente)+' · '+dmhm(x.ts)));
      w.appendChild(el('b',null,x.pedido)); if(x.hizo) w.appendChild(el('span','gm',x.hizo));
      var ft=el('div','gfoot'); ft.style.marginTop='4px';
      var rc=el('button','gtask','✦ Resolver con Cloty'); rc.type='button'; rc.disabled=!SAMPLECV; rc.addEventListener('click',function(){ cvEnviar('Resolvamos este pedido del agente '+cvAgName(x.agente)+' (entrada '+x.id+'): "'+x.pedido+'". Contexto que dejó: '+(x.hizo||'—')+'. Decime qué conviene y, si te doy el OK, respondele al agente y llevá lo que haga falta a Gestión.'); });
      var gb=el('button','gtask','→ A Gestión'); gb.type='button'; gb.addEventListener('click',function(){ var id='ag'+Date.now().toString(36);
        var it={id:id,t:x.pedido.slice(0,120),d:'Pedido del agente '+cvAgName(x.agente)+'.\n'+(x.hizo||''),frente:'otro',sev:'warn',origen:{tipo:'charla',de:'Agente '+cvAgName(x.agente)},quien:'',fecha:'',prox:'',est:'nuevo',hist:[],creado:nowIso(),reprog:0};
        gHist(it,'Creado desde el pedido del agente '+cvAgName(x.agente)); gSave(it); renderGest();
        cvResponder(x,'Lo tomé: queda en Gestión como "'+it.t+'".','a Gestión').then(renderParte,renderParte); });
      var rb=el('button','gtask','Responder'); rb.type='button'; rb.addEventListener('click',function(){ cvPedOpen[x.id]=!cvPedOpen[x.id]; renderParte(); });
      ft.appendChild(rc); ft.appendChild(gb); ft.appendChild(rb); w.appendChild(ft);
      if(cvPedOpen[x.id]){ var a=el('div','gaddh'), i=el('input'); i.type='text'; i.placeholder='Tu respuesta al agente, en una línea'; var ok=el('button','minibtn','Mandar'); ok.type='button';
        function go(){ var v=i.value.trim(); if(!v){ i.focus(); return; } delete cvPedOpen[x.id]; cvResponder(x,v).then(renderParte,renderParte); }
        ok.addEventListener('click',go); i.addEventListener('keydown',function(e){ if(e.key==='Enter')go(); }); a.appendChild(i); a.appendChild(ok); w.appendChild(a); setTimeout(function(){ try{ i.focus(); }catch(e){} },0); }
      box.appendChild(w); });
    // quién corrió hoy
    var hoy=bitAll().filter(function(x){ return localDay(x.ts)===t&&x.agente!=='oreja-ceo'; }), visto={}, ch=el('div','cvchips');
    hoy.forEach(function(x){ if(visto[x.agente])return; visto[x.agente]=1; ch.appendChild(el('span','cvchip '+(x.estado||'ok'),cvAgName(x.agente)+(x.estado&&x.estado!=='ok'?' · '+x.estado:''))); });
    if(hoy.length){ box.appendChild(el('div','eyebrow','Corrieron hoy')).style.marginTop='12px'; box.appendChild(ch); }
    var tp=document.getElementById('tp-cv'); if(tp){ var fallas=p&&p.fecha===t?((p.rutinas&&p.rutinas.fallas)||[]).length:0;
      var pz=[]; if(fallas)pz.push(fallas+' rutina'+(fallas>1?'s':'')+' con falla'); if(peds.length)pz.push(peds.length+' pedido'+(peds.length>1?'s':'')+' de tus agentes');
      tp.textContent=cvMode==='ajeno'?'privado':(pz.length?pz.join(' · '):'hablale');
      tp.className='tp'+(fallas?' crit':(peds.length?' warn':''));
      var lk=document.getElementById('clo-vivo'); if(lk)lk.textContent='✦ '+(pz.length&&cvMode!=='ajeno'?pz.join(' · '):'Hablale'); } }

  // ----- lo que Cloty ve sin pedir nada (entra en el prompt) -----
  function cvCut(s,n){ s=String(s==null?'':s); return s.length>n?s.slice(0,n-1)+'…':s; }
  function cvTema(x){ return {id:x.id,t:cvCut(x.t,120),frente:x.frente||'otro',estado:x.est||'nuevo',vence:x.fecha?(okDate(x.fecha)?x.fecha:'FECHA MAL CARGADA ('+x.fecha+')'):'',hora:x.hora||'',prox:cvCut(x.prox,120),quien:x.quien||'',reprog:x.reprog||0,vencida:gVenc(x),enCalendar:!!x.calId}; }
  function cvEventos(dias){ var lim=dayKey(-dias); return (((CALLAST&&CALLAST.events)||[]).filter(function(e){ return e&&e.status!=='cancelled'; }).map(function(e){ var s=(e.start&&(e.start.dateTime||e.start.date))||'', f=(e.end&&(e.end.dateTime||e.end.date))||'';
      return {dia:s.slice(0,10),ini:s.length>10?s.slice(11,16):'todo el día',fin:f.length>10?f.slice(11,16):'',t:cvCut(e.summary,100)}; }).filter(function(e){ return e.dia&&e.dia<=lim; })); }
  function cvSnapshot(){ var t=todayKey(), now=new Date(), all=gAll(), ab=all.filter(function(x){ return !gClosed(x); }).sort(gSort);
    var L=['HOY: '+now.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+', '+now.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})+' (Córdoba).'];
    L.push('GESTIÓN: '+ab.length+' abiertos, '+ab.filter(gVenc).length+' vencidos, '+ab.filter(function(x){ return (x.reprog||0)>=2; }).length+' reprogramados 2+ veces. Los primeros por prioridad:');
    ab.slice(0,12).forEach(function(x){ var c=cvTema(x); L.push('- ['+c.id+'] '+c.t+' · '+frenteName(c.frente)+' · '+estName(c.estado)+(c.vence?' · vence '+c.vence+(c.vencida&&okDate(x.fecha)?' (VENCIDO)':''):' · sin fecha')+(c.prox?' · próximo: '+c.prox:' · sin próximo paso')+(c.reprog>=2?' · movido '+c.reprog+'×':'')); });
    var ev=cvEventos(0); L.push('AGENDA DE HOY: '+(ev.length?ev.map(function(e){ return e.ini+(e.fin?'-'+e.fin:'')+' '+e.t; }).join(' | '):(CALLAST?'sin eventos':'Calendar no cargado')));
    var foco=pjAll().filter(function(p){ return p.est==='foco'; }); L.push('PROYECTOS EN FOCO: '+(foco.length?foco.map(function(p){ return p.t+(p.prox?' (próximo: '+cvCut(p.prox,80)+')':' (sin próximo paso)')+(p.decision?' decide '+p.decision:''); }).join(' | '):'ninguno'));
    var av=ngAll().filter(function(x){ return (x.etapa||'idea')==='avanza'; }); if(av.length) L.push('NEGOCIOS AVANZANDO: '+av.map(function(x){ var f=x.plan2&&x.plan2.decision.fecha; return x.t+(f?' (decide '+f+')':' (sin fecha de decisión)'); }).join(' | '));
    var ov=opAll().filter(opVenc), cp=cvAll().filter(function(c){ return c.est!=='dada'; });
    if(ov.length) L.push('OPORTUNIDADES VENCIDAS (matar, delegar o comprometerse): '+ov.map(function(o){ return o.t; }).join(' | '));
    if(cp.length) L.push('CONVERSACIONES PENDIENTES QUE VIENE POSTERGANDO: '+cp.map(function(c){ return (c.con?c.con+': ':'')+(c.tema||''); }).join(' | '));
    try{ L.push('HÁBITOS HOY: '+hbDefs().map(function(d){ return d.n+(hbDone(d,t)?' ✓':' ✗')+' ('+hbWeek(d)+'/7)'; }).join(', ')); }catch(e){}
    var p=parteUlt(); if(p&&p.decision) L.push('PARTE DE LOS AGENTES ('+p.fecha+'): decisión pendiente: '+p.decision);
    var peds=cvPedidos(); if(peds.length) L.push('PEDIDOS ABIERTOS DE LOS AGENTES: '+peds.map(function(x){ return '['+x.id+'] '+cvAgName(x.agente)+': '+cvCut(x.pedido,140); }).join(' | '));
    return L.join('\n'); }
  function cvReglas(){ var pr=(P||[]).slice(0,15).map(function(p){ return '- '+cvCut(p.texto,160); }).join('\n');
    return 'Sos Cloty, jefe de gabinete de Oreja (así lo llamás siempre), dentro de su app OREJA CEO. Hablás con él en vivo.\n'+
      'ESTILO: español rioplatense con voseo, directo y breve (hasta 8 líneas salvo que pida más). Sin adulación, sin relleno, sin frases motivacionales. Sos crítico y constructivo: si ves que evita algo, se lo decís con el dato. Una recomendación por vez. **Negrita** solo para lo que tiene que decidir.\n'+
      'JERARQUÍA: GOLDEN (foco inviolable) > EUROPA (ventana semanal) > BS GROUP (proyectos elegidos) > DOGOS (transición). Trade-off: Aprendizaje > Relación > ROI > Marca > Urgencia; la urgencia sola nunca alcanza. No negociables: Salud, Familia, Calidad, Ingresos.\n'+
      'PRINCIPIOS DE SU DOCTRINA:\n'+(pr||'- (sin cargar)')+'\n'+ngCtx()+
      'DATOS: usá solo lo que está acá abajo o lo que leas con la herramienta leer. Nunca inventes fechas, montos, nombres ni ids. Si falta un dato, decilo.\n'+
      'ACCIONES: para cambiar varios temas a la vez usá cambiar_en_lote (una sola tarjeta). Para cambiar algo usá las herramientas; cada cambio le pide confirmación a Oreja en pantalla. No digas que algo está hecho hasta que la herramienta devuelva ok. Si no confirma, no insistas: preguntá qué ajustar. Para cerrar o escalar un tema hace falta una línea de cierre (regla de Oreja). Lo que le respondas a un agente queda en la bitácora: nunca pongas ahí plata personal, familia ni temas delicados.\n\n'+
      'ESTADO DE OREJA AHORA:\n'+cvSnapshot(); }

  // ----- confirmación en pantalla -----
  function cvScroll(){ try{ cvLog.scrollTop=cvLog.scrollHeight; }catch(e){} }
  function cvConfirm(titulo,filas,signal){ return new Promise(function(res){ var c=el('div','cvconf'); c.appendChild(el('h4',null,titulo));
      filas.filter(function(f){ return f[1]!=null&&f[1]!==''; }).forEach(function(f){ var r=el('div','row'); r.appendChild(el('span',null,f[0])); r.appendChild(el('span',null,String(f[1]))); c.appendChild(r); });
      var ft=el('div','gfoot'), ok=el('button','btn rec','Confirmar'), no=el('button','btn','No'); ok.type='button'; no.type='button'; ft.appendChild(ok); ft.appendChild(no); c.appendChild(ft);
      var done=false; function fin(v){ if(done)return; done=true; ft.remove(); c.classList.add(v?'ok':'no'); c.appendChild(el('span','gm',v?'Confirmado':'No confirmado')); res(v); }
      ok.addEventListener('click',function(){ fin(true); }); no.addEventListener('click',function(){ fin(false); });
      if(signal) signal.addEventListener('abort',function(){ fin(false); });
      cvLog.appendChild(c); cvScroll(); try{ ok.focus({preventScroll:true}); }catch(e){} }); }
  function cvPaso(txt){ var s=el('div','cvtool','· '+txt); cvLog.appendChild(s); cvScroll(); }
  function noConf(){ throw new Error('Oreja no lo confirmó. No lo hagas; preguntale qué cambiar.'); }
  function cvFecha(v,campo){ v=String(v||'').trim(); if(v&&!/^20\d\d-\d\d-\d\d$/.test(v))throw new Error(campo+' tiene que ser AAAA-MM-DD.'); return v; }
  function cvHora(v){ v=String(v||'').trim(); if(v&&!/^\d\d:\d\d$/.test(v))throw new Error('La hora tiene que ser HH:MM.'); return v; }
  function cvFrente(v){ v=String(v||'otro'); return FRENTES.some(function(f){ return f[0]===v; })?v:'otro'; }
  var CVEST=GEST.map(function(e){ return e[0]; });

  // ----- herramientas -----
  function cvLeer(i){ var s=String(i.seccion||''), q=String(i.texto||'').toLowerCase().trim(), t=todayKey();
    function has(o){ if(!q)return true; return JSON.stringify(o).toLowerCase().indexOf(q)>=0; }
    cvPaso('Leyendo '+s+(q?' ("'+q+'")':'')+'…');
    if(s==='gestion') return gAll().filter(function(x){ return (q||!gClosed(x))&&has(x)&&(!i.solo_vencidos||gVenc(x)||(x.reprog||0)>=2||(x.fecha&&!okDate(x.fecha))); }).sort(gSort).slice(0,i.solo_vencidos?40:25).map(function(x){ var c=cvTema(x); c.detalle=cvCut(x.d,200); c.cierre=x.cierre||''; c.ultimo=((x.hist||[]).slice(-1)[0]||{}).txt||''; return c; });
    if(s==='proyectos') return pjAll().filter(has).map(function(p){ var its=p.items||[]; return {id:p.id,t:p.t,frente:p.frente,estado:p.est,prox:p.prox||'',quien:p.quien||'',decision:p.decision||'',entregables:its.filter(function(x){ return x.ok; }).length+'/'+its.length,nota:cvCut(p.nota,160)}; });
    if(s==='negocios') return ngAll().filter(has).slice(0,20).map(function(x){ var v=ngVer(x); return {id:x.id,t:x.t,lado:x.lado,etapa:x.etapa||'idea',test:v.n===5?v.si+'/5':'sin filtrar',decision:x.plan2?x.plan2.decision:null,detalle:cvCut(x.d,200)}; });
    if(s==='radar') return rdAll().filter(function(x){ return (x.est||'nuevo')!=='descartada'&&has(x); }).slice(0,15).map(function(x){ return {id:x.id,tipo:x.tipo,t:x.t,frente:x.frente,estado:x.est||'nuevo',porQueAhora:cvCut(x.valor,160),prox:cvCut(x.prox,120)}; });
    if(s==='posicion') return {apuestas:PO.ap,conversaciones:cvAll().filter(has).map(function(c){ return {id:c.id,con:c.con,tema:c.tema,estado:c.est,fecha:c.fecha||'',pido:cvCut(c.quiero,160),salida:cvCut(c.salida,160)}; }),
      oportunidades:opAll().filter(has).map(function(o){ return {id:o.id,t:o.t,estado:o.est||'viva',cobra:o.cobra||'',prox:o.prox||'',muere:o.muere||'',vencida:opVenc(o)}; }),solte:PO.solte.slice(-8)};
    if(s==='habitos') return {premio:HB.premio,metaDias:HB.metaSem,habitos:hbDefs().map(function(d){ return {nombre:d.n,central:!!d.core,tipo:d.tipo,hoy:hbVal(d,t)==null?null:hbVal(d,t),semana:hbWeek(d)+'/7',racha:hbStreak(d)}; })};
    if(s==='agenda') return {calendar:CALLAST?cvEventos(i.dias==null?1:Math.max(0,Math.min(7,Number(i.dias)||0))):'Calendar no cargado en esta vista',bloques:(HOY&&HOY.bloques)||[],manana:(HOY&&HOY.manana)||[],teEsperan:(HOY&&HOY.esperan)||[]};
    if(s==='finanzas'){ var k=t.slice(0,7), tt=mvTot(k); return {mes:k,ingresosConfirmados:tt.ing,egresosConfirmados:tt.egr,porConfirmar:tt.pn,tasaDeAhorro:document.getElementById('k-ahorro').textContent,colchon:document.getElementById('k-colchon').textContent,
      categoriasEgreso:mvCats('egreso'),palancasAbiertas:F.palancas.filter(function(p){ return !cerrada(p); }).map(function(p){ return p.t; })}; }
    if(s==='bitacora') return bitAll().filter(function(x){ return String(x.ts||'')>=new Date(Date.now()-3*86400000).toISOString()&&has(x); }).slice(0,30).map(function(x){ return {id:x.id,agente:x.agente,cuando:x.ts,estado:x.estado,hizo:cvCut(x.hizo,240),hallazgos:x.hallazgos,para:x.para,pedido:cvCut(x.pedido,240),responde:x.ref||''}; });
    if(s==='notas') return loadN().slice(-10).map(function(n){ return {cuando:n.ts,texto:cvCut(n.text,240)}; });
    throw new Error('Sección desconocida: '+s); }
  async function cvCrearTema(i,ctx){ var t=String(i.titulo||'').trim(); if(!t)throw new Error('Falta el título.'); var f=cvFecha(i.fecha,'La fecha'), h=cvHora(i.hora), fr=cvFrente(i.frente);
    if(!await cvConfirm('Crear tema en Gestión',[['Título',t],['Frente',frenteName(fr)],['Fecha',f?dm(f):'sin fecha'],['Hora',h],['Próximo paso',i.prox],['Quién',i.quien]],ctx.signal))noConf();
    var id='cv'+Date.now().toString(36), it={id:id,t:t,d:String(i.detalle||''),frente:fr,sev:/^(crit|warn|ok)$/.test(i.prioridad)?i.prioridad:'nuevo',origen:{tipo:'charla',de:'Cloty en vivo'},quien:String(i.quien||''),fecha:f,hora:h,prox:String(i.prox||''),est:'nuevo',hist:[],creado:nowIso(),reprog:0};
    gHist(it,'Creado con Cloty en vivo'); gSave(it); renderGest(); cvActs.push('creó un tema en Gestión ('+frenteName(fr)+')'); return {ok:true,id:id}; }
  async function cvActualizarTema(i,ctx){ var it=G2[String(i.id||'')]; if(!it)throw new Error('No existe el tema '+i.id+'. Buscalo con leer gestion.');
    var ch=[], f=i.fecha!=null?cvFecha(i.fecha,'La fecha'):null, h=i.hora!=null?cvHora(i.hora):null, est=i.estado!=null?String(i.estado):null;
    if(est&&CVEST.indexOf(est)<0)throw new Error('Estado inválido. Usá: '+CVEST.join(', '));
    if(est&&GNOTE[est]&&!String(i.cierre||'').trim())throw new Error('Para pasar a '+estName(est)+' hace falta la línea de cierre: pedísela a Oreja.');
    if(f!=null&&f!==(it.fecha||''))ch.push(['Fecha',(it.fecha?dm(it.fecha):'sin fecha')+' → '+(f?dm(f):'sin fecha')]);
    if(h!=null&&h!==(it.hora||''))ch.push(['Hora',(it.hora||'—')+' → '+(h||'—')]);
    if(i.prox!=null&&String(i.prox)!==(it.prox||''))ch.push(['Próximo paso',String(i.prox)]);
    if(i.quien!=null&&String(i.quien)!==(it.quien||''))ch.push(['Quién',String(i.quien)]);
    if(i.frente!=null&&cvFrente(i.frente)!==(it.frente||'otro'))ch.push(['Frente',frenteName(cvFrente(i.frente))]);
    if(est&&est!==it.est)ch.push(['Estado',estName(it.est)+' → '+estName(est)]);
    if(i.cierre)ch.push(['Cierre',String(i.cierre)]); if(i.nota)ch.push(['A la bitácora',String(i.nota)]);
    if(!ch.length)return {ok:true,sinCambios:true};
    if(!await cvConfirm('Cambiar "'+cvCut(it.t,70)+'"',ch,ctx.signal))noConf();
    cvAplicar(it,{fecha:f,hora:h,prox:i.prox,quien:i.quien,frente:i.frente,est:est,cierre:i.cierre,nota:i.nota}); renderGest(); cvActs.push('actualizó un tema de Gestión'); return {ok:true}; }
  // Aplica cambios ya validados y confirmados a un tema, con la misma bitácora que Gestión. Campos null/undefined no se tocan.
  function cvAplicar(it,c){ var mueve=false, f=c.fecha, h=c.hora, est=c.est;
    if(f!=null&&f!==(it.fecha||'')){ if(okDate(it.fecha)&&it.fecha&&f&&f>it.fecha){ it.reprog=(it.reprog||0)+1; gHist(it,'Reprogramada '+dm(it.fecha)+' → '+dm(f)); } else gHist(it,'Fecha: '+(f?dm(f):'sin fecha')); it.fecha=f; mueve=true; }
    if(h!=null&&h!==(it.hora||'')){ it.hora=h; gHist(it,'Hora: '+(h||'sin hora')); mueve=true; }
    if(c.prox!=null&&String(c.prox)!==(it.prox||'')){ it.prox=String(c.prox); gHist(it,'Próximo paso: '+it.prox); }
    if(c.quien!=null&&String(c.quien)!==(it.quien||'')){ it.quien=String(c.quien); gHist(it,'Dueño / quién espera: '+it.quien); }
    if(c.frente!=null&&cvFrente(c.frente)!==(it.frente||'otro')){ it.frente=cvFrente(c.frente); gHist(it,'Frente: '+frenteName(it.frente)); }
    if(est&&est!==it.est){ it.est=est; if(est!=='escalado'&&GNOTE[est])it.cierre=String(c.cierre); gHist(it,'Estado → '+estName(est)+(c.cierre?': '+c.cierre:'')); }
    if(c.nota)gHist(it,String(c.nota));
    gSave(it); if(mueve)calSync(it); }
  // ----- cambios en lote: una sola tarjeta, tema por tema -----
  var CVLOTE={cerrar:['hecho','Cerrar'],descartar:['descartado','Descartar'],reprogramar:[null,'Reprogramar'],delegar:['esperando','Delegar'],esperando:['esperando','Esperando a otro']};
  function cvConfirmLote(filas,signal){ return new Promise(function(res){ var c=el('div','cvconf'); c.appendChild(el('h4',null,'Ordenar '+filas.length+' tema'+(filas.length>1?'s':'')+' de Gestión'));
      c.appendChild(el('span','gm','Destildá lo que no quieras. Si se cierra, revisá la línea de cierre.'));
      var rows=filas.map(function(fl){ var r=el('div','cvlrow'), cb=el('input'); cb.type='checkbox'; cb.checked=true; cb.setAttribute('aria-label','Aplicar: '+fl.it.t); r.appendChild(cb);
        var tx=el('div','cvltx'); tx.appendChild(el('b',null,cvCut(fl.it.t,100)));
        tx.appendChild(el('span',null,fl.a[1]+(fl.f?' al '+dm(fl.f):'')+(fl.c.quien?' → '+fl.c.quien:'')+(fl.c.prox?' · próximo: '+cvCut(fl.c.prox,90):'')));
        if(fl.c.motivo)tx.appendChild(el('span','gm',cvCut(fl.c.motivo,160)));
        var ci=null; if(fl.a[0]==='hecho'||fl.a[0]==='descartado'){ ci=el('input','p2in'); ci.type='text'; ci.value=String(fl.c.cierre||''); ci.placeholder='línea de cierre'; ci.style.maxWidth='none'; ci.setAttribute('aria-label','Línea de cierre: '+fl.it.t); tx.appendChild(ci); }
        r.appendChild(tx); c.appendChild(r); return {fila:fl,cb:cb,ci:ci}; });
      var msg=el('span','fmsg',''), ft=el('div','gfoot'), ok=el('button','btn rec','Aplicar'), no=el('button','btn','No'); ok.type='button'; no.type='button'; msg.style.color='var(--crit)';
      function cnt(){ var n=rows.filter(function(r){ return r.cb.checked; }).length; ok.textContent='Aplicar '+n; ok.disabled=!n; }
      rows.forEach(function(r){ r.cb.addEventListener('change',cnt); }); cnt();
      var done=false; function fin(v){ if(done)return; done=true; ft.remove(); rows.forEach(function(r){ r.cb.disabled=true; if(r.ci)r.ci.disabled=true; }); c.classList.add(v?'ok':'no'); c.appendChild(el('span','gm',v?('Aplicado: '+v.length):'No confirmado')); res(v); }
      ok.addEventListener('click',function(){ var sel=rows.filter(function(r){ return r.cb.checked; }), falta=sel.filter(function(r){ return r.ci&&!r.ci.value.trim(); });
        if(falta.length){ msg.textContent='Falta la línea de cierre en '+falta.length+' tema'+(falta.length>1?'s':''); falta[0].ci.focus(); return; }
        fin(sel.map(function(r){ return {fila:r.fila,cierre:r.ci?r.ci.value.trim():''}; })); });
      no.addEventListener('click',function(){ fin(null); }); if(signal)signal.addEventListener('abort',function(){ fin(null); });
      ft.appendChild(ok); ft.appendChild(no); ft.appendChild(msg); c.appendChild(ft); cvLog.appendChild(c); cvScroll(); }); }
  async function cvLote(i,ctx){ var L=Array.isArray(i.cambios)?i.cambios.slice(0,15):[]; if(!L.length)throw new Error('No hay cambios para proponer.');
    var filas=[], errores=[], vistos={};
    L.forEach(function(c){ c=c||{}; var it=G2[String(c.id||'')], a=CVLOTE[c.accion], f=null;
      if(!it){ errores.push((c.id||'?')+': no existe'); return; } if(!a){ errores.push(it.t+': acción inválida'); return; } if(vistos[it.id]){ errores.push(it.t+': repetido'); return; }
      try{ f=c.fecha?cvFecha(c.fecha,'La fecha'):null; }catch(e){ errores.push(it.t+': '+e.message); return; }
      if(c.accion==='reprogramar'&&!f){ errores.push(it.t+': reprogramar necesita fecha'); return; }
      if(c.accion==='delegar'&&!String(c.quien||'').trim()){ errores.push(it.t+': delegar necesita a quién'); return; }
      vistos[it.id]=1; filas.push({it:it,c:c,a:a,f:f}); });
    if(!filas.length)throw new Error('Ningún cambio válido: '+errores.join('; '));
    var sel=await cvConfirmLote(filas,ctx.signal); if(!sel||!sel.length)noConf();
    sel.forEach(function(s){ var c=s.fila.c, a=s.fila.a; cvAplicar(s.fila.it,{fecha:s.fila.f,prox:c.prox!=null?c.prox:null,quien:c.quien!=null?c.quien:null,est:a[0],cierre:s.cierre,nota:c.motivo?'Con Cloty: '+c.motivo:''}); });
    renderGest(); cvActs.push('ordenó '+sel.length+' tema'+(sel.length>1?'s':'')+' de Gestión en lote');
    var hechos={}; sel.forEach(function(s){ hechos[s.fila.it.id]=1; });
    return {aplicados:Object.keys(hechos),omitidosPorOreja:filas.filter(function(f){ return !hechos[f.it.id]; }).map(function(f){ return f.it.id; }),rechazadosPorValidacion:errores}; }
  async function cvAgendar(i,ctx){ var it=G2[String(i.id||'')]; if(!it)throw new Error('No existe el tema '+i.id+'.');
    if(!MCP)throw new Error('Google Calendar no está disponible en esta vista.'); if(!it.fecha)throw new Error('El tema no tiene fecha: primero ponele fecha con actualizar_tema.');
    if(it.calId)return {ok:true,yaEstaba:true};
    if(!await cvConfirm('Agendar en Google Calendar',[['Evento',it.t],['Cuándo',dm(it.fecha)+' '+(it.hora||'09:00')+' · 30 min'],['Avisos','24 h y 1 h antes']],ctx.signal))noConf();
    cvPaso('Agendando en Calendar…'); var ok=await calAgendar(it); if(!ok)throw new Error('Calendar no confirmó el evento: '+(((it.hist||[]).slice(-1)[0]||{}).txt||''));
    cvActs.push('agendó un tema en Calendar'); return {ok:true}; }
  async function cvMovimiento(i,ctx){ var tipo=i.tipo==='ingreso'?'ingreso':'egreso', m=Math.round(Number(i.monto)||0); if(m<=0)throw new Error('Falta el monto (número en pesos).');
    var f=cvFecha(i.fecha,'La fecha')||todayKey(), cat=String(i.categoria||''); if(cat&&mvCats(tipo).indexOf(cat)<0)cat='';
    if(!await cvConfirm('Registrar '+tipo+' en Finanzas',[['Monto',money(m)],['Fecha',dm(f)],['Concepto',i.concepto],['Categoría',cat||'sin categoría']],ctx.signal))noConf();
    mvNew({fecha:f,tipo:tipo,monto:m,desc:String(i.concepto||''),cat:cat,estado:'confirmado',origen:{tipo:'cloty'}}); cvActs.push('registró un movimiento en Finanzas'); return {ok:true}; }
  async function cvHabito(i,ctx){ var q=String(i.habito||'').toLowerCase(), def=hbDefs().filter(function(d){ return d.n.toLowerCase()===q; })[0]||hbDefs().filter(function(d){ return d.n.toLowerCase().indexOf(q)>=0; })[0];
    if(!def)throw new Error('No encuentro ese hábito. Tiene: '+hbDefs().map(function(d){ return d.n; }).join(', '));
    var f=cvFecha(i.fecha,'La fecha')||todayKey(), v=def.tipo==='num'?(Number(i.valor)||null):!(i.valor===false||i.valor==='no'||i.valor==='false');
    if(!await cvConfirm('Marcar hábito',[['Hábito',def.n],['Día',dm(f)],['Valor',def.tipo==='num'?(v==null?'borrar':dec(v)+' h'):(v?'hecho':'sin hacer')]],ctx.signal))noConf();
    hbSet(def,f,v); cvActs.push('marcó un hábito'); return {ok:true}; }
  async function cvRespAgente(i,ctx){ var tx=String(i.texto||'').trim(); if(!tx)throw new Error('Falta el texto de la respuesta.');
    var x=i.id_entrada&&BIT[String(i.id_entrada)], ag=x?x.agente:String(i.agente||''); if(!ag)throw new Error('Decime a qué agente (o el id de la entrada).');
    if(!await cvConfirm('Responder al agente '+cvAgName(ag),[['Pedido',x?x.pedido:''],['Respuesta',tx]],ctx.signal))noConf();
    if(x) await cvResponder(x,tx,'con Cloty'); else await bitWrite({agente:'oreja-ceo',hizo:'Mensaje de Oreja a '+cvAgName(ag),para:ag,pedido:tx});
    renderParte(); cvActs.push('respondió al agente '+cvAgName(ag)); return {ok:true}; }
  async function cvPrincipio(i,ctx){ var tx=String(i.texto||'').trim(); if(!tx)throw new Error('Falta el principio.'); var ar=String(i.area||'');
    if(!await cvConfirm('Sumar a tu Doctrina',[['Principio',tx],['Área',ar]],ctx.signal))noConf();
    P.push({id:'p'+Date.now(),texto:tx,autor:'Práctica propia',area:ar}); saveP(); renderTabs(); renderPrinc(); renderPweek(); cvActs.push('sumó un principio a la Doctrina'); return {ok:true}; }
  async function cvIdea(i,ctx){ var t=String(i.titulo||'').trim(); if(!t)throw new Error('Falta el título.'); var lado=/^(golden|bs|propio)$/.test(i.lado)?i.lado:'golden';
    if(!await cvConfirm('Sumar idea a Negocios',[['Idea',t],['Lado',NGLADO[lado]],['Detalle',i.detalle]],ctx.signal))noConf();
    var id='ng'+Date.now().toString(36); ngSave({id:id,t:t.slice(0,140),d:String(i.detalle||''),lado:lado,origen:'cloty',etapa:'idea',c:{},creado:nowIso()}); renderNg(); cvActs.push('sumó una idea a Negocios'); return {ok:true,id:id}; }
  var S={type:'string'};
  var CVTOOLS=[
    {name:'leer',description:'Lee una sección de Oreja y devuelve sus datos actuales en JSON. Usala antes de opinar o de cambiar algo que no está en el resumen.',
      inputSchema:{type:'object',properties:{seccion:{type:'string',enum:['gestion','proyectos','negocios','radar','posicion','habitos','agenda','finanzas','bitacora','notas']},texto:{type:'string',description:'filtro opcional por texto'},dias:{type:'number',description:'solo agenda: días hacia adelante (0 = hoy, máx 7)'},solo_vencidos:{type:'boolean',description:'solo gestion: vencidos, reprogramados 2+ veces y fechas mal cargadas (hasta 40)'}},required:['seccion']},execute:function(i){ return cvLeer(i||{}); }},
    {name:'crear_tema',description:'Crea un tema en Gestión (pide confirmación a Oreja). Devuelve {ok,id}.',
      inputSchema:{type:'object',properties:{titulo:S,frente:{type:'string',enum:FRENTES.map(function(f){ return f[0]; })},fecha:{type:'string',description:'AAAA-MM-DD, solo si Oreja la dijo'},hora:{type:'string',description:'HH:MM'},prox:{type:'string',description:'próxima acción concreta'},quien:S,prioridad:{type:'string',enum:['crit','warn','ok']},detalle:S},required:['titulo','frente']},execute:cvCrearTema},
    {name:'actualizar_tema',description:'Cambia fecha, hora, próximo paso, dueño, frente o estado de un tema de Gestión por id, o suma una nota a su bitácora (pide confirmación). Cerrar o escalar exige "cierre".',
      inputSchema:{type:'object',properties:{id:S,fecha:S,hora:S,prox:S,quien:S,frente:S,estado:{type:'string',enum:CVEST},cierre:{type:'string',description:'línea de cierre, obligatoria para hecho, descartado o escalado'},nota:S},required:['id']},execute:cvActualizarTema},
    {name:'cambiar_en_lote',description:'Propone hasta 15 cambios de Gestión en UNA tarjeta: Oreja tilda cuáles aplicar y revisa las líneas de cierre. Usala para limpiar vencidos. Devuelve aplicados, omitidosPorOreja y rechazadosPorValidacion.',
      inputSchema:{type:'object',properties:{cambios:{type:'array',items:{type:'object',properties:{id:S,accion:{type:'string',enum:Object.keys(CVLOTE)},fecha:{type:'string',description:'AAAA-MM-DD; obligatoria para reprogramar'},quien:{type:'string',description:'obligatorio para delegar'},prox:S,cierre:{type:'string',description:'línea de cierre propuesta para cerrar o descartar'},motivo:{type:'string',description:'por qué, en una línea'}},required:['id','accion','motivo']}}},required:['cambios']},execute:cvLote},
    {name:'agendar_tema',description:'Crea en Google Calendar el evento de un tema que ya tiene fecha, con avisos 24 h y 1 h antes (pide confirmación).',
      inputSchema:{type:'object',properties:{id:S},required:['id']},execute:cvAgendar},
    {name:'registrar_movimiento',description:'Registra un ingreso o egreso confirmado en Finanzas (pide confirmación). Montos en pesos: "85 lucas" = 85000.',
      inputSchema:{type:'object',properties:{tipo:{type:'string',enum:['egreso','ingreso']},monto:{type:'number'},fecha:S,concepto:S,categoria:{type:'string',description:'nombre exacto de una categoría de leer finanzas, o vacío'}},required:['tipo','monto','concepto']},execute:cvMovimiento},
    {name:'marcar_habito',description:'Marca un hábito de hoy (o de otra fecha) como hecho o no; para Sueño, valor en horas (pide confirmación).',
      inputSchema:{type:'object',properties:{habito:S,valor:{description:'true/false, o horas para Sueño'},fecha:S},required:['habito','valor']},execute:cvHabito},
    {name:'responder_agente',description:'Le responde a uno de los agentes programados por la bitácora (pide confirmación). Usá id_entrada si responde a un pedido.',
      inputSchema:{type:'object',properties:{id_entrada:S,agente:S,texto:S},required:['texto']},execute:cvRespAgente},
    {name:'guardar_principio',description:'Suma un principio accionable a la Doctrina de Oreja (pide confirmación).',
      inputSchema:{type:'object',properties:{texto:S,area:{type:'string',enum:['asignación','negociación','foco','plata','delegación','personal']}},required:['texto']},execute:cvPrincipio},
    {name:'sumar_idea',description:'Suma una idea sin filtrar al tablero de Negocios (pide confirmación).',
      inputSchema:{type:'object',properties:{titulo:S,detalle:S,lado:{type:'string',enum:['golden','bs','propio']}},required:['titulo']},execute:cvIdea}];

  // ----- conversación -----
  function cvFmt(node,txt){ node.innerHTML=esc(txt).replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>'); }
  function cvBurbuja(rol,txt,err){ var b=el('div','cvmsg '+(rol==='user'?'u':'a')+(err?' err':'')); cvFmt(b,txt||''); cvLog.appendChild(b); cvScroll(); return b; }
  function cvStatus(t){ setT('cv-st',t||''); }
  function cvGuardar(){ if(!cvRef)return; cvTurnos=cvTurnos.slice(-30); cvRef.set({turnos:JSON.parse(JSON.stringify(cvTurnos)),act:nowIso()})['catch'](function(){}); }
  function cvMsgErr(e){ var c=e&&e.code; return c==='not_granted'?'Oreja no tiene permiso para consultar a Claude en esta vista.':c==='rate_limited'?'Muchos pedidos seguidos o llegaste al límite de uso: probá en un rato.':
    c==='refused'?'Claude no quiso responder eso. Probá decirlo de otra forma.':c==='session_expired'?'Tu sesión venció: volvé a entrar a claude.ai.':c==='prompt_too_large'?'Es demasiado para una sola consulta: pedí algo más acotado.':'Se cortó la respuesta. Probá de nuevo.'; }
  async function cvEnviar(texto){ texto=String(texto||'').trim(); if(!texto||cvBusy||!SAMPLECV)return; if(location.hash!=='#cloty')location.hash='#cloty';
    cvBusy=true; cvActs=[]; var inp=document.getElementById('cv-in'); inp.value='';
    cvBurbuja('user',texto); var b=cvBurbuja('assistant','Pensando…'); cvStatus(''); var stop=document.getElementById('cv-stop'), send=document.getElementById('cv-send'); stop.hidden=false; send.disabled=true;
    var hist=cvTurnos.slice(-16).map(function(x){ return {role:x.role,content:x.content}; }); while(hist.length&&hist[0].role!=='user')hist.shift();
    var input=[{role:'user',content:cvReglas()}].concat(hist).concat([{role:'user',content:texto}]);
    cvCtl=new AbortController(); var opts={signal:cvCtl.signal,cache:false,onText:function(u){ cvFmt(b,u.text); cvScroll(); }};
    if(cvConTools){ opts.tools=CVTOOLS; delete opts.cache; }
    try{ var r=await SAMPLECV(input,opts); cvFmt(b,r.text); cvTurnos.push({role:'user',content:texto,ts:nowIso()}); cvTurnos.push({role:'assistant',content:r.text,ts:nowIso()});
      if(r.truncated)cvStatus('La respuesta quedó cortada: pedí menos de una vez.'); }
    catch(e){ var keep=e&&e.text; if(e&&e.code==='cancelled'){ cvFmt(b,keep||'(detenido)'); } else { if(keep)cvFmt(b,keep); else b.remove(); cvBurbuja('assistant',cvMsgErr(e),true); }
      if(keep){ cvTurnos.push({role:'user',content:texto,ts:nowIso()}); cvTurnos.push({role:'assistant',content:keep,ts:nowIso()}); }
      if(e&&(e.code==='not_granted'||e.code==='sampling_disabled')){ SAMPLECV=null; renderCv(); } }
    finally{ cvBusy=false; stop.hidden=true; send.disabled=false; cvGuardar();
      if(cvActs.length){ var hizo='Con Oreja en vivo: '+cvActs.join('; ')+'.'; cvActs=[]; bitWrite({agente:'cloty-vivo',hizo:hizo,para:'todos'})['catch'](function(){}); } } }
  function renderCvLog(){ cvLog.innerHTML=''; cvTurnos.slice(-20).forEach(function(x){ cvBurbuja(x.role,x.content); }); }
  function renderCv(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Cloty lee Oreja para responderte; cada cambio te pide confirmación. La charla se guarda en tu espacio y lo que se hace queda en la bitácora de los agentes (sin montos).',
      local:'<b>Sin conexión a tu espacio privado.</b> Cloty en vivo solo funciona desde tu cuenta.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[cvMode];
    document.getElementById('cv-priv').innerHTML=pv||''; if(cvMode==='ajeno'){ renderParte(); return; }
    var q=document.getElementById('cv-quick'); q.innerHTML='';
    CVQ.forEach(function(x){ if(x[0]==='pedidos'&&!cvPedidos().length)return; var bt=el('button','ptab',x[1]); bt.type='button'; bt.disabled=!SAMPLECV; bt.addEventListener('click',function(){ cvEnviar(x[2]); }); q.appendChild(bt); });
    var off=document.getElementById('cv-off'); off.hidden=!!SAMPLECV; off.textContent=SAMPLECV?'':'Cloty en vivo necesita permiso para consultar a Claude. Si lo negaste, se habilita desde el menú Permisos del artefacto.';
    document.getElementById('cv-send').disabled=!SAMPLECV||cvBusy; setT('cv-k',cvConTools?'lee y actúa con tu OK':(SAMPLECV?'solo conversa':'sin conexión con Claude'));
    renderParte(); }
  function cvAttach(DBx,uid){ var base;
    try{ base=DBx.doc('data/users/'+uid+'/agentes'); bitCol=base.collection('bitacora'); parteCol=base.collection('parte'); cvRef=DBx.doc('data/users/'+uid+'/agente'); }catch(e){ cvMode='local'; renderCv(); return; }
    bitCol.orderBy('ts','desc').limit(120).onSnapshot(function(qs){ cvMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[x.id]=x; } }); BIT=m; renderCv(); },function(){ cvMode='error'; renderCv(); });
    parteCol.orderBy('fecha','desc').limit(3).onSnapshot(function(qs){ var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&x.fecha)m[x.fecha]=JSON.parse(JSON.stringify(x)); }); PARTES=m; renderParte(); },function(){});
    cvRef.onSnapshot(function(s){ if(cvBusy)return; var d=(s&&s.exists)?(s.data()||{}):{}; cvTurnos=Array.isArray(d.turnos)?d.turnos.filter(function(x){ return x&&x.content&&(x.role==='user'||x.role==='assistant'); }):[]; renderCvLog(); },function(){}); }
  document.getElementById('cv-send').addEventListener('click',function(){ cvEnviar(document.getElementById('cv-in').value); });
  document.getElementById('cv-in').addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); cvEnviar(e.target.value); } });
  document.getElementById('cv-stop').addEventListener('click',function(){ if(cvCtl)cvCtl.abort(); });
  document.getElementById('cv-new').addEventListener('click',function(){ if(cvBusy)return; cvTurnos=[]; renderCvLog(); cvGuardar(); cvStatus('charla nueva'); });
  (function(){ var mic=document.getElementById('cv-mic'), SRc=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SRc){ mic.hidden=true; return; }
    var r=new SRc(); r.lang='es-AR'; r.continuous=true; r.interimResults=true; var on=false, base='', inp=document.getElementById('cv-in');
    mic.addEventListener('click',function(){ if(on){ r.stop(); return; } base=inp.value?inp.value.replace(/\s+$/,'')+' ':''; try{ r.start(); }catch(e){} });
    r.onstart=function(){ on=true; mic.classList.add('on'); mic.textContent='■ Listo'; cvStatus('escuchando…'); };
    r.onend=function(){ on=false; mic.classList.remove('on'); mic.textContent='● Dictar'; cvStatus(''); if(inp.value.trim())cvEnviar(inp.value); };
    r.onerror=function(ev){ on=false; mic.classList.remove('on'); mic.textContent='● Dictar'; cvStatus(ev&&ev.error==='not-allowed'?'micrófono bloqueado':'error de voz'); };
    r.onresult=function(ev){ var fin='', im=''; for(var i=ev.resultIndex;i<ev.results.length;i++){ var x=ev.results[i]; if(x.isFinal)fin+=x[0].transcript; else im+=x[0].transcript; } inp.value=base+fin+im; if(fin)base=base+fin; }; })();
  (async function(){ try{ if(window.claude&&window.claude.use){ SAMPLECV=await window.claude.use('sample'); } }catch(e){ SAMPLECV=null; }
    if(SAMPLECV){ try{ var lim=await SAMPLECV.limits(); cvConTools=!!(lim&&lim.tools&&lim.tools.maxCount>=CVTOOLS.length); }catch(e){ cvConTools=false; } }
    renderCv(); })();
  renderCv();

