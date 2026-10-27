  // ---------- RITUAL DEL DÍA (inicio: 3 pasos, racha, últimos 14 días) ----------
  var USO={dias:{}}, usoRef=null, usoLast=null;
  function ritCount(){ var t=todayKey(), g=(typeof G2!=='undefined'&&G2)||{}, s1=false, s2=false, s3=false, foco=null, prim=null;
    Object.keys(g).forEach(function(k){ var x=g[k]; if(!x)return; (x.hist||[]).forEach(function(h){ if(h&&h.por==='lucho'&&h.ts&&localDay(h.ts)===t)s1=true; }); });
    try{ s2=hbDefs().some(function(d){ return hbDone(d,t); }); }catch(e){}
    var pj=(typeof PJ!=='undefined'&&PJ)||{}; Object.keys(pj).forEach(function(k){ var p=pj[k]; if(!p||p.est!=='foco')return; if(!foco)foco=p; if(p.act&&localDay(p.act)===t)s3=true; });
    return {s1:s1,s2:s2,s3:s3,n:(s1?1:0)+(s2?1:0)+(s3?1:0),foco:foco}; }
  function ritDayN(k){ var v=(USO.dias||{})[k]; return typeof v==='number'?v:0; }
  function ritIsSun(k){ return new Date(k+'T12:00:00').getDay()===0; }
  function renderRit(){ var box=document.getElementById('rit'); if(!box)return;
    if(typeof gMode!=='undefined'&&gMode==='ajeno'){ box.hidden=true; return; }
    var r=ritCount(), t=todayKey();
    if(usoRef&&r.n>ritDayN(t)&&usoLast!==t+':'+r.n){ usoLast=t+':'+r.n; USO.dias=USO.dias||{}; USO.dias[t]=r.n; USO.act=nowIso(); usoRef.set(JSON.parse(JSON.stringify(USO)))['catch'](function(){}); }
    var nT=Math.max(r.n,ritDayN(t)), arc=document.getElementById('rit-arc'), C=289.03; arc.setAttribute('stroke-dashoffset',String(C*(1-nT/3)));
    document.getElementById('rit-ring').classList.toggle('full',nT>=3); setT('rit-n',nT+'/3');
    var h=new Date().getHours(); setT('rit-h',(h<13?'Buen día':(h<20?'Buenas tardes':'Buenas noches'))+', Oreja');
    // racha: días hábiles seguidos con 2 de 3 o más (el domingo no corta)
    var streak=0; for(var i=(nT>=2?0:1);i<120;i++){ var k=dayKey(i); if(ritIsSun(k))continue; if(ritDayN(k)>=2||(i===0&&nT>=2))streak++; else break; }
    var wk=0, d0=new Date(); var dow=(d0.getDay()+6)%7; for(var j=0;j<=dow;j++){ var kk=dayKey(j); if(ritIsSun(kk))continue; if((j===0?nT:ritDayN(kk))>=2)wk++; }
    var meta=document.getElementById('rit-meta'); meta.innerHTML='';
    var m1=el('span'); m1.innerHTML='Racha <b>'+streak+' día'+(streak===1?'':'s')+'</b>'; meta.appendChild(m1);
    var m2=el('span'); m2.innerHTML='Esta semana <b>'+wk+' de '+Math.min(6,dow+1)+'</b>'; meta.appendChild(m2);
    var dots=document.getElementById('rit-dots'); dots.innerHTML='';
    for(var q=13;q>=0;q--){ var kq=dayKey(q), nq=q===0?nT:ritDayN(kq), dt=el('i',(nq>=3?'f':(nq>=1?'h':''))+(ritIsSun(kq)?' dom':'')+(q===0?' hoy':'')); dt.title=dm(kq)+': '+nq+' de 3'; dots.appendChild(dt); }
    function st(id,ok,txt){ var s=document.getElementById(id); s.classList.toggle('ok',!!ok); if(txt!=null)setT(id+'t',txt); }
    var ht=document.getElementById('hero-t'); st('rit-s1',r.s1,r.s1?'Hecho: moviste un tema hoy':(ht&&ht.textContent&&ht.textContent!=='—'?'Lo primero: '+ht.textContent:'Abrí Gestión y dale tratamiento a uno'));
    st('rit-s2',r.s2,r.s2?'Hecho: marcaste hoy':null);
    st('rit-s3',r.s3,r.s3?'Hecho: '+(r.foco?r.foco.t:'proyecto movido'):(r.foco?(r.foco.t+(r.foco.prox?': '+r.foco.prox:'')):'Elegí 3 proyectos en foco'));
    var msg=document.getElementById('rit-msg');
    msg.innerHTML=nT>=3?'<b>Día cerrado.</b> Lo que sigue lo decidís vos, no la lista.':(nT===2?'<b>Te falta uno</b> para cerrar el día. Con 2 de 3 la racha sigue.':(nT===1?'Buen arranque. Con 2 de 3 el día cuenta para la racha.':'Diez minutos: un tema, tus hábitos y un paso de un proyecto.'));
    box.hidden=false; }
  function ritAttach(DBx,uid){ try{ usoRef=DBx.doc('data/users/'+uid+'/uso'); }catch(e){ return; }
    usoRef.onSnapshot(function(sn){ var d=(sn&&sn.exists)?(sn.data()||{}):{}; USO={dias:(d.dias&&typeof d.dias==='object')?JSON.parse(JSON.stringify(d.dias)):{},act:d.act}; renderRit(); },function(){}); }
  setTimeout(function(){ try{ renderRit(); }catch(e){} },0);

