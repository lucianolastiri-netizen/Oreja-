  // ---------- CAPTURA INTELIGENTE (Claude interpreta el dictado) ----------
  var SAMPLE=null, aiBtn=document.getElementById('ai'), capCard=document.getElementById('cap-card');
  aiBtn.hidden=true;
  (async function(){ try{ if(window.claude&&window.claude.use){ SAMPLE=await window.claude.use('sample'); } }catch(e){ SAMPLE=null; } if(SAMPLE&&finMode!=='ajeno')aiBtn.hidden=false; })();
  function catalogo(){ var e=F.egr.map(function(g){ return g[0]+': '+(g[1]||[]).map(function(l){ return l[0]; }).join(', '); }).join('\n'); var i=F.ing.map(function(l){ return l[0]; }).join(', '); return {e:e||'(sin presupuesto cargado)',i:i||'(sin fuentes cargadas)'}; }
  function aiPrompt(txt){ var c=catalogo(), hoy=todayKey();
    return 'Sos el asistente de carga de Oreja, la app de gestión de Luciano (Córdoba, Argentina). Interpretá lo que dictó y devolvé SOLO un objeto JSON, sin texto alrededor.\n\n'+
      'Hoy es '+hoy+'.\n\nFORMATO:\n{"tipo":"movimiento"|"tema"|"nota",\n "movimiento":{"mov":"egreso"|"ingreso","monto":número o null,"fecha":"AAAA-MM-DD","desc":"concepto corto","cat":"categoría de la lista o vacío"},\n "tema":{"t":"título corto","frente":"golden"|"europa"|"bs"|"dogos"|"finanzas"|"personal"|"otro","quien":"quién espera o es dueño, o vacío","fecha":"AAAA-MM-DD o vacío","prox":"próxima acción concreta","sev":"crit"|"warn"|"ok"},\n "dudas":["lo que no quedó claro"]}\n\n'+
      'REGLAS:\n- "movimiento" = plata que entró o salió (pagué, gasté, cobré, me transfirieron). "tema" = algo a hacer, un pedido, un compromiso, una decisión. "nota" = una idea o reflexión sin acción.\n'+
      '- Montos en pesos argentinos: "85 lucas" o "85 mil" = 85000; "un palo" = 1000000; "palo y medio" o "1,5 palos" = 1500000. Si no hay monto claro, monto null y anotalo en dudas.\n'+
      '- Fechas relativas desde hoy ("ayer", "el lunes"). En movimientos, si no se dice, usá hoy. En temas, NUNCA inventes una fecha de compromiso: si no se dijo, vacío.\n'+
      '- Frentes: Golden = Torneo Golden; Europa = carrera internacional; BS Group = holding, Rodrigo, Joaquín, eventos corporativos; Dogos = Dogos XV; Finanzas = plata de la casa; Personal = familia, colegio, salud.\n'+
      '- cat de egreso: elegí el GRUPO que corresponda de esta lista (nombre exacto) o vacío:\n'+c.e+'\n- cat de ingreso: una de estas fuentes (nombre exacto) o vacío: '+c.i+'\n'+
      '- Completá solo el bloque que corresponde al tipo.\n\nDICTADO:\n"""'+txt+'"""'; }
  function frSel(v){ var s=el('select'); FRENTES.forEach(function(f){ var o=el('option',null,f[1]); o.value=f[0]; if(f[0]===v)o.selected=true; s.appendChild(o); }); return s; }
  function inp(type,val,ph){ var i=el('input'); i.type=type; i.value=val==null?'':val; if(ph)i.placeholder=ph; return i; }
  function cfield(lbl,node,full){ var l=el('label',full?'full':null); l.appendChild(document.createTextNode(lbl)); l.appendChild(node); return l; }
  function capClose(){ capCard.innerHTML=''; capCard.hidden=true; }
  function renderCap(r,txt){ capCard.innerHTML=''; capCard.hidden=false; var tipo=r&&r.tipo; var dudas=(r&&Array.isArray(r.dudas))?r.dudas.filter(Boolean):[];
    var foot=el('div','cfoot'), ok=el('button','btn rec','Confirmar'), no=el('button','btn','Descartar'); ok.type='button'; no.type='button'; no.addEventListener('click',capClose);
    if(tipo==='movimiento'){ var m=r.movimiento||{}; capCard.appendChild(el('h4',null,'💰 Movimiento'));
      var g=el('div','cgrid'); var tp=el('select'); [['egreso','Egreso'],['ingreso','Ingreso']].forEach(function(x){ var o=el('option',null,x[1]); o.value=x[0]; if(x[0]===m.mov)o.selected=true; tp.appendChild(o); });
      var mo=inp('text',m.monto!=null?fmt.format(m.monto):'','monto'); mo.inputMode='numeric'; var fe=inp('date',m.fecha||todayKey()); var de=inp('text',m.desc||'','concepto');
      var ca=el('select'); function fillCa(){ ca.innerHTML=''; var o0=el('option',null,'Sin categoría'); o0.value=''; ca.appendChild(o0); mvCats(tp.value).forEach(function(x){ var o=el('option',null,x); o.value=x; if(x===m.cat)o.selected=true; ca.appendChild(o); }); } fillCa(); tp.addEventListener('change',fillCa);
      g.appendChild(cfield('Tipo',tp)); g.appendChild(cfield('Monto',mo)); g.appendChild(cfield('Fecha',fe)); g.appendChild(cfield('Categoría',ca)); g.appendChild(cfield('Concepto',de,true)); capCard.appendChild(g);
      ok.addEventListener('click',function(){ var v=parseNum(mo.value); if(!v){ mo.focus(); mo.placeholder='falta el monto'; return; }
        mvNew({fecha:fe.value||todayKey(),tipo:tp.value,monto:v,desc:de.value.trim(),cat:ca.value,estado:'confirmado',origen:{tipo:'voz',txt:txt}});
        pad.value=''; capClose(); st.textContent='movimiento cargado ✓ (Finanzas)'; });
    } else if(tipo==='tema'){ var t=r.tema||{}; capCard.appendChild(el('h4',null,'✔ Tema para Gestión'));
      var g2=el('div','cgrid'); var ti=inp('text',t.t||txt.slice(0,90),'título'); var fr=frSel(t.frente||'otro'); var qu=inp('text',t.quien||'','quién espera / dueño'); var fe2=inp('date',t.fecha||''); var pr=inp('text',t.prox||'','próximo paso');
      g2.appendChild(cfield('Título',ti,true)); g2.appendChild(cfield('Frente',fr)); g2.appendChild(cfield('Quién',qu)); g2.appendChild(cfield('Fecha de compromiso',fe2)); g2.appendChild(cfield('Próximo paso',pr,true)); capCard.appendChild(g2);
      ok.addEventListener('click',function(){ if(!ti.value.trim()){ ti.focus(); return; } var id='v'+Date.now().toString(36);
        var it={id:id,t:ti.value.trim(),d:txt,frente:fr.value,sev:(t.sev==='crit'||t.sev==='warn'||t.sev==='ok')?t.sev:'nuevo',origen:{tipo:'captura',de:'dictado'},quien:qu.value.trim(),fecha:fe2.value,prox:pr.value.trim(),est:'nuevo',hist:[],creado:nowIso(),reprog:0};
        gHist(it,'Creado por dictado'); gSave(it); renderGest(); pad.value=''; capClose(); st.textContent='tema cargado ✓ (Gestión)'; });
    } else { capCard.appendChild(el('h4',null,'📝 Nota')); capCard.appendChild(el('p','hint','No es un movimiento ni un tema: la guardo como nota.'));
      ok.addEventListener('click',function(){ var a=loadN(); a.push({id:Date.now(),text:txt,ts:stamp()}); persistN(a); renderN(); pad.value=''; capClose(); st.textContent='nota guardada ✓'; }); }
    if(dudas.length) capCard.appendChild(el('div','dudas','Revisá: '+dudas.join(' · ')));
    foot.appendChild(ok); foot.appendChild(no); capCard.appendChild(foot); }
  aiBtn.addEventListener('click',async function(){ var txt=pad.value.trim(); if(!txt){ st.textContent='dictá o escribí algo primero'; return; } if(!SAMPLE){ aiBtn.hidden=true; return; }
    aiBtn.disabled=true; st.textContent='interpretando…';
    try{ var r=await SAMPLE.json(aiPrompt(txt),{modelTier:'quick',cache:false}); st.textContent='revisá y confirmá'; renderCap(r,txt); }
    catch(e){ var c=e&&e.code; st.textContent=c==='not_granted'?'sin permiso para consultar a Claude':(c==='rate_limited'?'muchos pedidos seguidos, probá en un rato':'no pude interpretarlo; guardalo como nota'); if(c==='not_granted')aiBtn.hidden=true; }
    finally{ aiBtn.disabled=false; } });

