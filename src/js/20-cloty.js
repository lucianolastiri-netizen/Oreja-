  // ---------- ÁREA CLOTY (formación diaria, resumen de comunicaciones, ideas) ----------
  var FM={}, fmCol=null, RS={}, rsCol=null, cloTab=lget('oreja_clotab','form');
  function cloSet(p){ cloTab=p; lset('oreja_clotab',p); ['form','res','ideas'].forEach(function(k){ var b=document.getElementById('clo-t-'+k), pn=document.getElementById('clo-p-'+k); b.classList.toggle('on',k===p); b.setAttribute('aria-selected',k===p?'true':'false'); pn.hidden=k!==p; }); }
  document.getElementById('clo-tabs').addEventListener('click',function(e){ var b=e.target.closest('.clotab'); if(b)cloSet(b.getAttribute('data-p')); });
  function cloSorted(m){ return Object.keys(m).map(function(k){ return m[k]; }).filter(Boolean).sort(function(a,b){ return String(b.id||'').localeCompare(String(a.id||'')); }); }
  function renderClo(){ var box=document.getElementById('clo'); if(!box)return; if(typeof gMode!=='undefined'&&gMode==='ajeno'){ box.hidden=true; return; } box.hidden=false; cloSet(cloTab);
    var t=todayKey(), fs=cloSorted(FM), hechas=fs.filter(function(x){ return x.hecha; }).length;
    // formación
    var pf=document.getElementById('clo-p-form'); pf.innerHTML=''; var f=FM[t]||fs[0];
    if(!f){ pf.appendChild(el('span','lbl','Lunes a sábado, 7:40')); pf.appendChild(el('h3',null,'Tu primera lección llega el próximo día hábil')); pf.appendChild(el('p',null,'Cada mañana Cloty deja acá una práctica corta para usar mejor la IA en tu trabajo real: Golden, el Distrito, tus mails. Cinco minutos, con un prompt para copiar y un ejercicio.')); }
    else { var hoy=f.fecha===t; pf.appendChild(el('span','lbl',(hoy?'Hoy':'Última, del '+dm(f.fecha))+' · lección '+(f.n||'')+(f.tema?' · '+f.tema:'')));
      pf.appendChild(el('h3',null,f.titulo||'')); if(f.leccion)pf.appendChild(el('p',null,f.leccion));
      if(f.prompt){ pf.appendChild(el('span','lbl','Prompt para copiar')); var pr=el('div','cloprompt',f.prompt); pf.appendChild(pr); }
      if(f.ejercicio){ pf.appendChild(el('span','lbl','Ejercicio de hoy')); pf.appendChild(el('p',null,f.ejercicio)); }
      var row=el('div','clorow'); if(f.prompt){ var cp=el('button','clobtn','Copiar prompt'); cp.type='button'; var ms=el('span','fmsg','');
        cp.addEventListener('click',function(){ copyText(f.prompt).then(function(){ ms.textContent='Copiado'; },function(){ var r=document.createRange(); r.selectNodeContents(pr); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); ms.textContent='Seleccionado: copialo con Ctrl+C'; }); }); row.appendChild(cp); row.appendChild(ms); }
      var hb=el('button','clobtn'+(f.hecha?' on':''),f.hecha?'Hecha ✓':'Marcar como hecha'); hb.type='button'; hb.addEventListener('click',function(){ f.hecha=!f.hecha; f.act=nowIso(); if(fmCol)fmCol.doc(f.id).set(JSON.parse(JSON.stringify(f)))['catch'](function(){}); renderClo(); }); row.appendChild(hb);
      row.appendChild(el('span','gm',hechas+' de '+fs.length+' hechas')); pf.appendChild(row); }
    // resumen
    var pr2=document.getElementById('clo-p-res'); pr2.innerHTML=''; var rs=cloSorted(RS)[0];
    if(!rs){ pr2.appendChild(el('h3',null,'El primer resumen llega con la próxima sincronización')); pr2.appendChild(el('p',null,'Lunes a sábado, 7:30 y 16:30: quién te escribió, qué espera de vos y qué conviene hacer.')); }
    else { pr2.appendChild(el('span','lbl',(rs.fecha===t?'Hoy':dm(rs.fecha))+' · '+(rs.turno==='pm'?'tarde':'mañana')));
      if(rs.nota)pr2.appendChild(el('h3',null,rs.nota));
      function grp(tit,arr,vacio){ pr2.appendChild(el('span','lbl',tit)); if(!arr||!arr.length){ pr2.appendChild(el('p',null,vacio)); return; } var w=el('div');
        arr.forEach(function(x){ var it=el('div','cloitem'), b=el('b'); var u=x.url&&/^https:\/\//.test(x.url)?x.url:null; if(u){ var a=el('a',null,x.de||''); a.href=u; a.target='_blank'; a.rel='noopener'; b.appendChild(a); } else b.textContent=x.de||''; it.appendChild(b); it.appendChild(el('span',null,(x.que||'')+(x.accion?' → '+x.accion:''))); w.appendChild(it); }); pr2.appendChild(w); }
      grp('Correos',rs.mail,'Nada que te espere en el mail.');
      grp('WhatsApp',rs.whatsapp,rs.whatsapp_nota||'Todavía sin fuente: Cloty no puede leer tu WhatsApp. Pegá en Captura lo que importa y entra en el próximo resumen.');
      var go=el('a','clobtn','Abrir Gestión'); go.href='#temas'; pr2.appendChild(go); }
    // ideas
    var pi=document.getElementById('clo-p-ideas'); pi.innerHTML=''; var rd=(typeof RD!=='undefined'&&RD)||{};
    var ideas=Object.keys(rd).map(function(k){ return rd[k]; }).filter(function(x){ return x&&(x.est||'nuevo')==='nuevo'&&(x.tipo==='idea'||x.tipo==='activo'||x.tipo==='avance'); }).sort(function(a,b){ return String(b.creado||'').localeCompare(String(a.creado||'')); });
    pi.appendChild(el('span','lbl','Sacadas de tus charlas, tu mail y tus proyectos · '+ideas.length+' sin tratar'));
    if(!ideas.length) pi.appendChild(el('p',null,'No hay ideas nuevas. El Radar suma las de la semana cada viernes a las 16:00.'));
    else { var w2=el('div'); ideas.slice(0,3).forEach(function(x){ var it=el('div','cloitem'); it.appendChild(el('b',null,x.t||'')); it.appendChild(el('span',null,x.valor||x.d||'')); if(x.prox)it.appendChild(el('span',null,'Próximo paso: '+x.prox)); w2.appendChild(it); }); pi.appendChild(w2); }
    var gr=el('a','clobtn','Decidir en el Radar'); gr.href='#radar'; pi.appendChild(gr);
    setT('clo-t-ideas',''); var ti=document.getElementById('clo-t-ideas'); ti.textContent='Ideas'; if(ideas.length)ti.appendChild(el('span','n',String(ideas.length)));
    var tf=document.getElementById('clo-t-form'); tf.textContent='Formación de hoy'; if(f&&f.fecha===t&&!f.hecha)tf.appendChild(el('span','n','•'));
    setT('clo-k',(f&&f.fecha===t?(f.hecha?'lección de hoy hecha':'lección de hoy pendiente'):'tu jefe de gabinete')); }
  function cloAttach(DBx,uid){ try{ fmCol=DBx.doc('data/users/'+uid+'/formacion').collection('items'); rsCol=DBx.doc('data/users/'+uid+'/resumenes').collection('items'); }catch(e){ return; }
    function grab(col,set){ col.onSnapshot(function(qs){ var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); set(m); renderClo(); },function(){}); }
    grab(fmCol,function(m){ FM=m; }); grab(rsCol,function(m){ RS=m; }); }
  setTimeout(function(){ try{ renderClo(); }catch(e){} },0);

