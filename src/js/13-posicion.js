  // ---------- POSICIÓN (privado: apuesta, paquete, conversaciones, oportunidades, solté) ----------
  var PO={ap:{},paq:{},solte:[]}, poRef=null, poCurJ=null, poTimer=null, poMode='conectando', CV={}, cvCol=null, OPO={}, opCol=null, poOpen={};
  var poBody=document.getElementById('po-body');
  function poNorm(o){ var v={ap:{},paq:{},solte:[]}; if(o&&typeof o==='object'){ if(o.ap&&typeof o.ap==='object')v.ap=o.ap; if(o.paq&&typeof o.paq==='object')v.paq=o.paq; if(Array.isArray(o.solte))v.solte=o.solte; } return v; }
  function savePo(){ if(poRef){ clearTimeout(poTimer); poTimer=setTimeout(function(){ try{ var j=JSON.stringify(PO); poCurJ=j; poRef.set(JSON.parse(j))['catch'](function(){ poMode='error'; renderPo(); }); }catch(e){} },400); } }
  function poLock(on){ document.getElementById('po-locked').hidden=!on; poBody.hidden=!!on; }
  function poBind(id,grp,key){ var e=document.getElementById(id); e.addEventListener('change',function(){ PO[grp][key]=e.value.trim(); savePo(); renderPoHome(); }); }
  poBind('po-ap-golden','ap','golden'); poBind('po-ap-bs','ap','bs'); poBind('po-dejo','paq','dejo'); poBind('po-tomo','paq','tomo'); poBind('po-pido','paq','pido'); poBind('po-entrego','paq','entrego');
  function poFill(id,v){ var e=document.getElementById(id); if(document.activeElement!==e)e.value=v||''; }
  function colSave(col,map,it){ it.act=nowIso(); map[it.id]=it; if(col){ col.doc(it.id).set(JSON.parse(JSON.stringify(it)))['catch'](function(){ poMode='error'; renderPo(); }); } }
  function colDel(col,map,id){ delete map[id]; if(col){ col.doc(id).delete()['catch'](function(){}); } }
  function poInput(tag,it,key,ph,save){ var e=el(tag); if(tag==='input')e.type='text'; e.value=it[key]||''; if(ph)e.placeholder=ph; e.addEventListener('change',function(){ it[key]=e.value.trim(); save(it); }); return e; }
  function poLabel(txt,node,full){ var l=el('label',full?'full':null); l.appendChild(document.createTextNode(txt)); l.appendChild(node); return l; }
  function poDelBtn(fn){ var del=el('button','gtask','Borrar'); del.type='button'; var armed=false;
    del.addEventListener('click',function(){ if(!armed){ armed=true; del.textContent='¿Borrar? Tocá de nuevo'; setTimeout(function(){ armed=false; del.textContent='Borrar'; },3000); return; } fn(); }); return del; }
  function cvAll(){ return Object.keys(CV).map(function(k){ return CV[k]; }).filter(function(x){ return x&&x.id; }).sort(function(a,b){ var x=(a.est==='dada'?1:0)-(b.est==='dada'?1:0); if(x)return x; return String(a.creado||'')<String(b.creado||'')?-1:1; }); }
  function opAll(){ return Object.keys(OPO).map(function(k){ return OPO[k]; }).filter(function(x){ return x&&x.id; }).sort(function(a,b){ var x=((a.est||'viva')==='viva'?0:1)-((b.est||'viva')==='viva'?0:1); if(x)return x; var fa=a.muere||'9999', fb=b.muere||'9999'; return fa<fb?-1:(fa>fb?1:0); }); }
  function opVenc(o){ return (o.est||'viva')==='viva'&&!!o.muere&&o.muere<todayKey(); }
  function renderPoHome(){ var ap=document.getElementById('apline'); if(ap){ ap.innerHTML=(PO.ap.golden||PO.ap.bs)?('Apuesta · Golden: <b>'+esc(PO.ap.golden||'sin definir')+'</b> · BS Group: <b>'+esc(PO.ap.bs||'sin definir')+'</b>'):''; }
    var tp=document.getElementById('tp-poder'); if(!tp)return; if(poMode==='ajeno'){ tp.textContent='privado'; tp.className='tp'; return; }
    var pend=cvAll().filter(function(c){ return c.est!=='dada'; }).length, ov=opAll().filter(opVenc).length;
    tp.textContent=(pend||ov)?(pend+' conversación'+(pend===1?'':'es')+' pendiente'+(pend===1?'':'s')+(ov?' · '+ov+' oportunidad'+(ov>1?'es':'')+' para decidir':'')):'sin pendientes';
    tp.className='tp'+(ov?' crit':(pend?' warn':' ok')); }
  function renderPo(){ setTimeout(function(){ try{ renderAg(); }catch(e){} },0); var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Acá va lo que no se le muestra a nadie: qué querés, qué pedís y con quién tenés que hablar.',local:'<b>Sin conexión a tu espacio privado.</b> Esta sección solo se guarda desde tu cuenta.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[poMode];
    document.getElementById('po-priv').innerHTML=pv||''; renderPoHome(); if(poMode==='ajeno')return;
    poFill('po-ap-golden',PO.ap.golden); poFill('po-ap-bs',PO.ap.bs); poFill('po-dejo',PO.paq.dejo); poFill('po-tomo',PO.paq.tomo); poFill('po-pido',PO.paq.pido); poFill('po-entrego',PO.paq.entrego);
    var t=todayKey();
    // conversaciones
    var cb=document.getElementById('po-conv'); cb.innerHTML=''; var cs=cvAll(), pend=0;
    if(!cs.length) cb.appendChild(el('p','hint','Ninguna cargada. Sumá la primera que estás evitando.'));
    cs.forEach(function(c){ var dada=c.est==='dada'; if(!dada)pend++; var save=function(x){ colSave(cvCol,CV,x); };
      var card=el('div','gitem'+(dada?' done':'')); var head=el('button','ghead'); head.type='button'; head.setAttribute('aria-expanded',poOpen[c.id]?'true':'false');
      var gh=el('span','gh'); gh.appendChild(el('b',null,(c.con?c.con+': ':'')+(c.tema||'(sin tema)')));
      var meta=[]; if(c.fecha)meta.push((dada?'fue el ':'para el ')+dm(c.fecha)); if(!dada&&c.creado){ var da=dayDiff(localDay(c.creado),t); if(da>0)meta.push(da+' d pendiente'); }
      if(meta.length)gh.appendChild(el('span','gm',meta.join(' · ')));
      var fl=el('span','gflags'), flags=[]; if(!dada){ if(!c.quiero)flags.push('sin pedido concreto'); if(!c.salida)flags.push('sin salida si dicen que no'); if(!c.fecha)flags.push('sin fecha'); else if(c.fecha<t)flags.push('fecha pasada: ¿se dio?'); }
      flags.forEach(function(f){ fl.appendChild(el('span','gflag',f)); }); if(flags.length)gh.appendChild(fl);
      head.appendChild(gh); head.appendChild(el('span','gstp '+(dada?'st-hecho':'st-curso'),dada?'Dada':'Pendiente'));
      head.addEventListener('click',function(){ poOpen[c.id]=!poOpen[c.id]; renderPo(); }); card.appendChild(head);
      if(poOpen[c.id]){ var b=el('div','gbody'), g=el('div','pofld');
        g.appendChild(poLabel('Con quién',poInput('input',c,'con','',save))); var fe=el('input'); fe.type='date'; fe.value=c.fecha||''; stableInput(fe,function(){ return c.fecha; },function(v){ c.fecha=v; save(c); },okDate); g.appendChild(poLabel('Fecha',fe));
        g.appendChild(poLabel('Tema',poInput('input',c,'tema','',save),true));
        g.appendChild(poLabel('Qué pido yo, en una frase',poInput('textarea',c,'quiero','el pedido concreto, con fecha',save)));
        g.appendChild(poLabel('Qué quiere el otro',poInput('textarea',c,'quiere','qué gana si dice que sí',save)));
        g.appendChild(poLabel('Qué no cedo',poInput('textarea',c,'nocedo','el límite que no se negocia',save)));
        g.appendChild(poLabel('Mi salida si dicen que no',poInput('textarea',c,'salida','qué hacés al día siguiente',save)));
        if(dada){ g.appendChild(poLabel('Qué pasó',poInput('textarea',c,'paso','',save))); g.appendChild(poLabel('Qué cedí de más',poInput('textarea',c,'cedi','',save)));
          g.appendChild(poLabel('El principio que queda',poInput('input',c,'principio','una regla accionable para la próxima',save),true)); }
        b.appendChild(g); var ft=el('div','gfoot');
        var tg=el('button','gtask',dada?'Volver a pendiente':'Ya la di: revisar'); tg.type='button'; tg.addEventListener('click',function(){ c.est=dada?'pendiente':'dada'; save(c); renderPo(); }); ft.appendChild(tg);
        if(dada){ var pd=el('button','gtask',c.enDoctrina?'En Doctrina ✓':'→ Llevar el principio a Doctrina'); pd.type='button';
          pd.addEventListener('click',function(){ if(c.enDoctrina||!c.principio)return; P.push({id:'p'+Date.now(),texto:c.principio,autor:'Práctica propia',area:'negociación'}); saveP(); renderTabs(); renderPrinc(); renderPweek(); c.enDoctrina=true; save(c); renderPo(); }); ft.appendChild(pd); }
        ft.appendChild(poDelBtn(function(){ colDel(cvCol,CV,c.id); renderPo(); })); b.appendChild(ft); card.appendChild(b); }
      cb.appendChild(card); });
    setT('po-cv-k',cs.length?(pend+' pendiente'+(pend===1?'':'s')+' · '+(cs.length-pend)+' dada'+((cs.length-pend)===1?'':'s')):'');
    // oportunidades
    var ob=document.getElementById('po-opo'); ob.innerHTML=''; var os=opAll(), viv=0, ov=0;
    if(!os.length) ob.appendChild(el('p','hint','Ninguna cargada.'));
    os.forEach(function(o){ var est=o.est||'viva', venc=opVenc(o); if(est==='viva')viv++; if(venc)ov++; var save=function(x){ colSave(opCol,OPO,x); };
      var card=el('div','gitem'+(est!=='viva'?' done':'')+(venc?' venc':'')); var head=el('button','ghead'); head.type='button'; head.setAttribute('aria-expanded',poOpen[o.id]?'true':'false');
      var gh=el('span','gh'); gh.appendChild(el('b',null,o.t||'(sin título)')); var meta=[]; if(o.cobra)meta.push('cobra: '+o.cobra); if(o.muere)meta.push('muere el '+dm(o.muere)); if(meta.length)gh.appendChild(el('span','gm',meta.join(' · ')));
      var fl=el('span','gflags'), flags=[]; if(est==='viva'){ if(venc)flags.push(['crit','venció hace '+dayDiff(o.muere,t)+' d: matar, delegar o comprometerte']); if(!o.cobra)flags.push(['','sin quién cobra']); if(!o.prox)flags.push(['','sin próximo paso']); if(!o.muere)flags.push(['','sin fecha de muerte']); if(!o.apuesta)flags.push(['','no dice qué apuesta alimenta']); }
      flags.forEach(function(f){ fl.appendChild(el('span','gflag'+(f[0]?' '+f[0]:''),f[1])); }); if(flags.length)gh.appendChild(fl);
      head.appendChild(gh); head.appendChild(el('span','gstp '+(est==='viva'?'st-curso':(est==='comprometida'?'st-hecho':'')),({viva:'Viva',muerta:'Muerta',delegada:'Delegada',comprometida:'Comprometida'})[est]));
      head.addEventListener('click',function(){ poOpen[o.id]=!poOpen[o.id]; renderPo(); }); card.appendChild(head);
      if(poOpen[o.id]){ var b=el('div','gbody'), g=el('div','pofld');
        g.appendChild(poLabel('La posibilidad',poInput('input',o,'t','',save),true));
        g.appendChild(poLabel('Quién cobra',poInput('input',o,'cobra','qué parte es de quién',save)));
        var ap=selOf([['','Sin definir'],['golden','Golden'],['bs','BS Group'],['ninguna','Ninguna']],o.apuesta||''); ap.addEventListener('change',function(){ o.apuesta=ap.value; save(o); renderPo(); }); g.appendChild(poLabel('Qué apuesta alimenta',ap));
        g.appendChild(poLabel('Próximo paso',poInput('input',o,'prox','la acción concreta',save)));
        var mu=el('input'); mu.type='date'; mu.value=o.muere||''; stableInput(mu,function(){ return o.muere; },function(v){ if(o.muere&&v>o.muere){ o.reprog=(o.reprog||0)+1; } o.muere=v; save(o); if(!poBody.contains(document.activeElement))renderPo(); },okDate); g.appendChild(poLabel('Fecha de muerte'+(o.reprog?' · movida '+o.reprog+'×':''),mu));
        var es=selOf([['viva','Viva'],['comprometida','Me comprometo'],['delegada','Delegada'],['muerta','Muerta']],est); es.addEventListener('change',function(){ o.est=es.value; save(o); renderPo(); }); g.appendChild(poLabel('Decisión',es));
        g.appendChild(poLabel('Por qué',poInput('input',o,'nota','una línea',save)));
        b.appendChild(g); var ft=el('div','gfoot'); ft.appendChild(poDelBtn(function(){ colDel(opCol,OPO,o.id); renderPo(); })); b.appendChild(ft); card.appendChild(b); }
      ob.appendChild(card); });
    setT('po-op-k',os.length?(viv+' viva'+(viv===1?'':'s')+(ov?' · '+ov+' para decidir':'')):'');
    // solté
    var sl=document.getElementById('po-solte'); sl.innerHTML=''; var lim=new Date(Date.now()-7*86400000).toISOString(), sem=PO.solte.filter(function(s){ return String(s.ts)>=lim; }).length;
    if(!PO.solte.length) sl.appendChild(el('li','hint','Todavía nada registrado.'));
    PO.solte.slice().reverse().slice(0,15).forEach(function(s){ var li=el('li'); li.appendChild(el('span','t',(s.que||'')+(s.aquien?' → '+s.aquien:''))); li.appendChild(el('span','x',dm(localDay(s.ts))));
      var d=delBtn(function(){ PO.solte=PO.solte.filter(function(x){ return x.id!==s.id; }); savePo(); renderPo(); }); li.appendChild(d); sl.appendChild(li); });
    setT('po-so-k',sem+' esta semana'); setT('po-k',pend+' conversaciones · '+viv+' oportunidades'); renderPoHome(); }
  function poAdd(inId,fn){ var i=document.getElementById(inId); var v=i.value.trim(); if(!v)return; fn(v); i.value=''; renderPo(); }
  function cvAdd(v){ var id='cv'+Date.now().toString(36); colSave(cvCol,CV,{id:id,con:'',tema:v,est:'pendiente',creado:nowIso()}); poOpen[id]=true; }
  function opAdd(v){ var id='op'+Date.now().toString(36); colSave(opCol,OPO,{id:id,t:v,est:'viva',creado:nowIso()}); poOpen[id]=true; }
  document.getElementById('po-cv-add').addEventListener('click',function(){ poAdd('po-cv-in',cvAdd); });
  document.getElementById('po-cv-in').addEventListener('keydown',function(e){ if(e.key==='Enter')poAdd('po-cv-in',cvAdd); });
  document.getElementById('po-op-add').addEventListener('click',function(){ poAdd('po-op-in',opAdd); });
  document.getElementById('po-op-in').addEventListener('keydown',function(e){ if(e.key==='Enter')poAdd('po-op-in',opAdd); });
  document.getElementById('po-so-add').addEventListener('click',function(){ var q=document.getElementById('po-so-q'), a=document.getElementById('po-so-a'); if(!q.value.trim()){ q.focus(); return; }
    PO.solte.push({id:'s'+Date.now().toString(36),ts:nowIso(),que:q.value.trim(),aquien:a.value.trim()}); q.value=''; a.value=''; savePo(); renderPo(); });
  document.getElementById('po-copy').addEventListener('click',function(){ var p=PO.paq, m=document.getElementById('po-msg');
    var t='LO QUE DEJO\n'+(p.dejo||'—')+'\n\nLO QUE TOMO\n'+(p.tomo||'—')+'\n\nLO QUE PIDO\n'+(p.pido||'—')+'\n\nLO QUE ENTREGO EN 90 DÍAS\n'+(p.entrego||'—');
    copyText(t).then(function(){ m.textContent='Copiado'; },function(){ m.textContent='No se pudo copiar'; }); });
  function colAttach(col,setMap){ col.onSnapshot(function(qs){ var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); setMap(m); if(poBody.contains(document.activeElement))return; renderPo(); },function(){}); }
  function poAttach(DBx,uid){ try{ poRef=DBx.doc('data/users/'+uid+'/posicion'); cvCol=poRef.collection('conv'); opCol=poRef.collection('opor'); }catch(e){ poMode='local'; renderPo(); return; }
    poRef.onSnapshot(function(s){ poMode='sync'; if(!s||!s.exists){ renderPo(); return; } var d=s.data()||{}, j=null; try{ j=JSON.stringify(d); }catch(e){}
      if(j!==null&&j===poCurJ){ renderPo(); return; } poCurJ=j; PO=poNorm(d); if(poBody.contains(document.activeElement)){ renderPoHome(); return; } renderPo(); },function(){ poMode='error'; renderPo(); });
    colAttach(cvCol,function(m){ CV=m; }); colAttach(opCol,function(m){ OPO=m; }); }
  renderPo();

