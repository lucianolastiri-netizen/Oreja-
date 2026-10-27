  // ---------- ADMISIÓN BS GROUP (privado) ----------
  var AD={}, adCol=null, adMode='conectando';
  var CRIT=[['a','Aprendizaje','¿Te enseña algo que todavía no sabés hacer?'],['r','Relación','¿Construye o repara una relación que va a importar en 2028?'],['roi','ROI','¿Tiene ingreso atribuible y proporcional al esfuerzo?'],['m','Marca','¿Es un caso mostrable con tu nombre asociado?'],['u','Urgencia','¿La urgencia es real, o es la de otro? Sí = real.']];
  var OUTS=[['aceptar','Aceptar'],['declinar','Declinar'],['delegar','Delegar'],['postergar','Postergar']];
  var adC={}, adOut=null, adTouched=false;
  function adVerdict(){ var si=0, n=0; CRIT.forEach(function(c){ if(adC[c[0]])n++; if(adC[c[0]]==='si')si++; });
    var v=n<5?'falta':(si>=3?'pasa':(si===1&&adC.u==='si'?'solourg':'nopasa')); return {si:si,n:n,v:v}; }
  function adText(out){ var ped=document.getElementById('ad-ped').value.trim()||'esto'; if(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(ped))ped=ped.charAt(0).toLowerCase()+ped.slice(1); var q=document.getElementById('ad-quien').value.trim(), hola='Hola'+(q?' '+q.split(' ')[0]:'')+', ';
    var dl=document.getElementById('ad-deleg').value.trim()||'[quién]', vt=document.getElementById('ad-vent').value.trim()||'[cuándo]';
    return {aceptar:hola+'lo de '+ped+' lo tomo. Antes de arrancar, cerremos por escrito el alcance, la fecha de entrega y qué pone cada uno. Te propongo que lo hablemos esta semana.',
      declinar:hola+'gracias por pensar en mí para '+ped+'. Esta vez no lo voy a tomar: tengo la agenda comprometida con proyectos que ya elegí y no quiero hacerlo a medias. Si te sirve, te paso contactos o criterio para encararlo.',
      delegar:hola+'lo de '+ped+' lo va a llevar '+dl+': es su área y lo va a resolver mejor que yo. Hoy le paso el contexto y quedo para cualquier decisión que necesite de mí.',
      postergar:hola+'lo de '+ped+' me interesa, pero hoy no le puedo dar la atención que necesita. Lo puedo tomar '+vt+'. Si no puede esperar hasta entonces, conviene que lo encare otro.'}[out]; }
  function renderAdForm(){ var box=document.getElementById('ad-crits'); box.innerHTML='';
    CRIT.forEach(function(c){ var row=el('div','acrit'), q=el('div','cq'); q.appendChild(el('b',null,c[1])); q.appendChild(el('span',null,c[2])); row.appendChild(q);
      var sg=el('div','seg'); sg.setAttribute('role','group'); sg.setAttribute('aria-label',c[1]);
      [['si','Sí'],['du','Dudoso'],['no','No']].forEach(function(o){ var b=el('button',o[0]+(adC[c[0]]===o[0]?' on':''),o[1]); b.type='button'; b.id='ad-'+c[0]+'-'+o[0]; b.setAttribute('aria-pressed',adC[c[0]]===o[0]?'true':'false');
        b.addEventListener('click',function(){ adC[c[0]]=o[0]; renderAdForm(); }); sg.appendChild(b); });
      row.appendChild(sg); box.appendChild(row); });
    var r=adVerdict(), vd=document.getElementById('ad-verd');
    var lab={falta:['Faltan '+(5-r.n)+' criterios','Respondé los cinco para ver el veredicto.'],pasa:['Pasa','Cumple '+r.si+' de 5. Si lo tomás, cerrá alcance y fecha por escrito antes de empezar.'],
      nopasa:['No pasa','Cumple '+r.si+' de 5. El default es no: declinar, delegar o postergar.'],solourg:['No pasa: solo urgencia','La urgencia sola nunca alcanza. Es urgencia de otro hasta que se demuestre lo contrario.']}[r.v];
    vd.className='verd '+(r.v==='pasa'?'pasa':(r.v==='falta'?'':'nopasa')); vd.innerHTML='<div><div class="vb">'+esc(lab[0])+'</div><div class="vs">'+esc(lab[1])+(document.getElementById('ad-urg').checked&&r.v!=='pasa'?' Entró como urgente: no dejes que el canal decida.':'')+'</div></div><div class="score">'+r.si+'/5</div>';
    if(!adOut||!adTouched) adOut=r.v==='pasa'?'aceptar':'declinar';
    var ob=document.getElementById('ad-outs'); ob.innerHTML='';
    OUTS.forEach(function(o){ var b=el('button','ptab'+(adOut===o[0]?' on':''),o[1]); b.type='button'; b.addEventListener('click',function(){ adOut=o[0]; adTouched=true; renderAdForm(); }); ob.appendChild(b); });
    if(adOut==='aceptar'&&r.v!=='pasa'&&r.v!=='falta') ob.appendChild(el('span','fmsg','Aceptás contra el test: queda registrado como excepción.')).style.color='var(--crit)';
    document.getElementById('ad-deleg').hidden=adOut!=='delegar'; document.getElementById('ad-vent').hidden=adOut!=='postergar';
    var ta=document.getElementById('ad-txt'); if(document.activeElement!==ta) ta.value=adText(adOut); }
  ['ad-ped','ad-quien','ad-deleg','ad-vent'].forEach(function(id){ document.getElementById(id).addEventListener('input',function(){ document.getElementById('ad-txt').value=adText(adOut||'declinar'); }); });
  document.getElementById('ad-urg').addEventListener('change',renderAdForm);
  document.getElementById('ad-copy').addEventListener('click',function(){ var ta=document.getElementById('ad-txt'), m=document.getElementById('ad-msg');
    copyText(ta.value).then(function(){ m.textContent='Copiado'; },function(){ ta.select(); m.textContent='Seleccionado: copialo con Ctrl+C'; }); });
  document.getElementById('ad-new').addEventListener('click',function(){ adC={}; adOut=null; adTouched=false; ['ad-ped','ad-quien','ad-fecha','ad-deleg','ad-vent'].forEach(function(id){ document.getElementById(id).value=''; }); document.getElementById('ad-urg').checked=false; document.getElementById('ad-msg').textContent=''; renderAdForm(); });
  document.getElementById('ad-save').addEventListener('click',function(){ var m=document.getElementById('ad-msg'), ped=document.getElementById('ad-ped').value.trim(), r=adVerdict();
    if(!ped){ m.style.color='var(--crit)'; m.textContent='Poné qué te piden'; document.getElementById('ad-ped').focus(); return; }
    if(r.v==='falta'){ m.style.color='var(--crit)'; m.textContent='Respondé los cinco criterios'; return; }
    m.style.color=''; var q=document.getElementById('ad-quien').value.trim(), dl=document.getElementById('ad-deleg').value.trim(), vt=document.getElementById('ad-vent').value.trim();
    var exc=adOut==='aceptar'&&r.v!=='pasa', id='adm-'+Date.now().toString(36);
    var rec={id:id,ped:ped,quien:q,para:document.getElementById('ad-fecha').value.trim(),urg:document.getElementById('ad-urg').checked,c:JSON.parse(JSON.stringify(adC)),si:r.si,veredicto:r.v,salida:adOut,deleg:dl,vent:vt,excepcion:exc,txt:document.getElementById('ad-txt').value,creado:nowIso()};
    AD[id]=rec; if(adCol){ adCol.doc(id).set(rec)['catch'](function(){ adMode='error'; renderAd(); }); }
    var det=CRIT.map(function(c){ return c[1]+': '+({si:'sí',du:'dudoso',no:'no'})[adC[c[0]]]; }).join(' · ');
    var tt={aceptar:'Proyecto elegido: '+ped+' — cerrar alcance y fecha por escrito',declinar:'Declinar: '+ped,delegar:'Delegar a '+(dl||'[quién]')+': '+ped,postergar:'Postergado'+(vt?' a '+vt:'')+': '+ped}[adOut];
    var it={id:'g-'+id,t:tt+(q?' ('+q+')':''),d:'Test de admisión '+r.si+'/5 · '+({pasa:'pasa',nopasa:'no pasa',solourg:'solo urgencia'})[r.v]+(exc?' · EXCEPCIÓN: aceptado contra el test':'')+'. '+det+'.\n\nBorrador:\n'+rec.txt,
      frente:'bs',sev:exc?'crit':(adOut==='aceptar'?'warn':'ok'),est:'nuevo',fecha:'',quien:adOut==='delegar'&&dl?dl:'Lucho',prox:{aceptar:'Mandar el texto y fijar alcance, fecha y recursos',declinar:'Mandar el texto',delegar:'Pasar el contexto a '+(dl||'quien corresponda'),postergar:'Mandar el texto y agendar la revisión'}[adOut],
      origen:{tipo:'manual',de:'Test de admisión'},creado:nowIso(),reprog:0,hist:[]};
    gHist(it,'Creado desde el test de admisión','lucho'); gSave(it); renderGest(); m.textContent='Guardado y en Gestión'; renderAd(); });
  function adPriv(){ var t={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Cada evaluación queda registrada: en el cierre del viernes Cloty cuenta cuántos pedidos frenaste.',local:'<b>Sin conexión a tu espacio privado.</b> Podés usar el test, pero no queda registrado.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[adMode];
    document.getElementById('ad-priv').innerHTML=t||''; }
  function renderAd(){ adPriv(); var tp=document.getElementById('tp-adm'); if(adMode==='ajeno'){ if(tp){tp.textContent='privado';tp.className='tp';} return; }
    var all=Object.keys(AD).map(function(k){ return AD[k]; }).filter(function(x){ return x&&x.ped; }).sort(function(a,b){ return String(b.creado)<String(a.creado)?-1:1; });
    var lim=new Date(Date.now()-14*86400000).toISOString(), rec=all.filter(function(x){ return String(x.creado)>=lim; }), fr=rec.filter(function(x){ return x.salida!=='aceptar'; }).length;
    if(tp){ tp.textContent=rec.length?(fr+' frenados en 14 días'):'sin pedidos evaluados'; tp.className='tp'+(rec.length&&!fr?' warn':(fr?' ok':'')); }
    var k=document.getElementById('ad-k'); if(k) k.textContent=rec.length?rec.length+' evaluados · '+fr+' frenados (14 d)':'';
    document.getElementById('ad-cnt').textContent=all.length?all.length+' en total':'';
    var box=document.getElementById('ad-list'); box.innerHTML='';
    if(!all.length){ box.appendChild(el('p','hint','Todavía no evaluaste ningún pedido. Cuando entre uno de BS Group, pasalo por acá antes de que toque tu agenda.')); return; }
    all.slice(0,12).forEach(function(x){ var r=el('div','ai'); r.appendChild(el('span','d',dm(x.creado))); var t=el('span',null,x.ped+(x.quien?' · '+x.quien:'')); r.appendChild(t);
      var lab=({aceptar:'Aceptado',declinar:'Declinado',delegar:'Delegado',postergar:'Postergado'})[x.salida]||x.salida;
      r.appendChild(el('span','r sev '+(x.excepcion?'crit':(x.salida==='aceptar'?'warn':'ok')),lab+' · '+x.si+'/5'+(x.excepcion?' · excepción':''))); box.appendChild(r); }); }
  function adAttach(DBx,uid){ try{ adCol=DBx.doc('data/users/'+uid+'/admision').collection('items'); }catch(e){ adMode='local'; renderAd(); return; }
    adCol.onSnapshot(function(qs){ adMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); AD=m; renderAd(); },function(){ adMode='error'; renderAd(); }); }
  renderAdForm(); renderAd();

