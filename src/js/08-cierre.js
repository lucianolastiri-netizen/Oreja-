  // ---------- CIERRE DEL DÍA (privado; lo escribe Cloty en el cierre de la tarde) ----------
  var CFR=[['golden','Golden','var(--golden)'],['europa','Europa','var(--europa)'],['bsgroup','BS Group','var(--bs)'],['dogos','Dogos · transición','var(--dogos)'],['personal','Personal / sin frente','var(--muted)']];
  var CDIAS=[], CREP={}, cMode='conectando';
  function cFrName(k){ for(var i=0;i<CFR.length;i++)if(CFR[i][0]===k)return CFR[i][1]; return k||''; }
  function cPriv(){ var t={conectando:'Conectando tu espacio privado…',
      sync:'<b>Privado, solo tuyo.</b> Lo escribe Cloty cada tarde con los números de Gestión.',
      local:'<b>Sin conexión a tu espacio privado.</b> El cierre solo se ve desde tu cuenta.',
      error:'<b>No se pudo leer el cierre.</b> Recargá para reintentar.',
      ajeno:'<b>Sección privada del titular.</b>'}[cMode];
    document.getElementById('c-priv').innerHTML=t||''; }
  function cTrend(days){ var pts=days.slice(-14), W=640,H=140,pl=28,pr=8,pt=12,pb=26;
    var max=3; pts.forEach(function(d){ max=Math.max(max,Number(d.cerradas)||0,Number(d.vencidas)||0); });
    var n=pts.length, bw=(W-pl-pr)/Math.max(n,1), y=function(v){ return pt+(H-pt-pb)*(1-v/max); }, g='';
    [0,Math.round(max/2),max].forEach(function(v){ g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--line)" stroke-width="1"/>'+
      '<text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono,monospace">'+v+'</text>'; });
    pts.forEach(function(d,i){ var x=pl+i*bw, w=Math.max(4,Math.min(22,bw*0.34)), c=Number(d.cerradas)||0, v=Number(d.vencidas)||0, x0=x+bw/2-w-1;
      g+='<rect x="'+x0+'" y="'+y(c)+'" width="'+w+'" height="'+Math.max(0,y(0)-y(c))+'" fill="var(--ok)" rx="1"><title>'+esc(d.fecha)+': '+c+' cerradas</title></rect>';
      g+='<rect x="'+(x0+w+2)+'" y="'+y(v)+'" width="'+w+'" height="'+Math.max(0,y(0)-y(v))+'" fill="var(--crit)" opacity=".8" rx="1"><title>'+esc(d.fecha)+': '+v+' vencidas</title></rect>';
      g+='<text x="'+(x+bw/2)+'" y="'+(H-8)+'" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="IBM Plex Mono,monospace">'+esc(String(d.fecha).slice(8)+'/'+String(d.fecha).slice(5,7))+'</text>'; });
    return '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Cerradas y vencidas por día">'+g+'</svg>'; }
  function cItem(ul,txt,url,x,xcls){ var li=el('li'), t=el('span','t'); var u=safeUrl(url);
    if(u){ var a=el('a',null,txt); a.href=u; a.target='_blank'; a.rel='noopener'; t.appendChild(a); } else t.textContent=txt;
    li.appendChild(t); if(x)li.appendChild(el('span','x'+(xcls?' '+xcls:''),x)); ul.appendChild(li); }
  function cKpi(id,v,cls){ var k=document.getElementById(id); k.className='ckpi'+(cls?' '+cls:''); k.querySelector('.v').textContent=(v==null?'—':String(v)); }
  function cFromGest(){ var cd=(typeof CDIAS!=='undefined'&&CDIAS)||[]; var l=cd.length?cd[cd.length-1]:null; return !!(l&&l.fuente==='gestion'); }
  function cDecs(){ if(cFromGest()){ var FM={golden:'golden',europa:'europa',bs:'bsgroup',dogos:'dogos'};
      return ((typeof G2==='object'&&G2)?Object.keys(G2).map(function(k){ return G2[k]; }):[]).filter(function(g){ return g&&g.t&&!(g.est==='hecho'||g.est==='descartado')&&(Number(g.reprog)||0)>=2; })
        .map(function(g){ return {id:g.id,nombre:g.t,frente:FM[g.frente]||'personal',veces:Number(g.reprog)||0}; }).sort(function(a,b){ return b.veces-a.veces; }); }
    var cr=(typeof CREP!=='undefined'&&CREP)||{}; return Object.keys(cr).map(function(k){ return cr[k]; }).filter(function(r){ return r&&!r.cerrada&&(Number(r.veces)||0)>=2; })
      .sort(function(a,b){ return (Number(b.veces)||0)-(Number(a.veces)||0); }); }
  function renderCierre(){ cPriv(); var tp=document.getElementById('tp-cierre');
    var decs=cDecs();
    var d=CDIAS.length?CDIAS[CDIAS.length-1]:null;
    if(!d){ setT('c-fecha','—'); ['ck-cer','ck-ven','ck-abi'].forEach(function(i){ cKpi(i,null); }); cKpi('ck-dec',decs.length,decs.length?'bad':'');
      document.getElementById('c-frentes').innerHTML='<p class="hint">Todavía no hay cierres cargados. El primero llega con la rutina de la tarde.</p>';
      tp.textContent=cMode==='ajeno'?'privado':'sin cierre todavía'; tp.className='tp';
    } else {
      var f=new Date(d.fecha+'T12:00:00'), fl=''; try{ fl=f.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ fl=d.fecha; }
      setT('c-fecha',fl); setT('c-act',d.actualizado?('actualizado '+dmhm(d.actualizado)):'');
      cKpi('ck-cer',d.cerradas||0,(d.cerradas||0)?'good':'bad'); cKpi('ck-ven',d.vencidas||0,(d.vencidas||0)?'bad':'');
      cKpi('ck-dec',decs.length,decs.length?'bad':''); cKpi('ck-abi',d.abiertas||0,'');
      var al=document.getElementById('c-alerta'); al.hidden=!d.alerta; al.textContent=d.alerta||'';
      var fr=d.frentes||{}, max=1; CFR.forEach(function(c){ max=Math.max(max,Number(fr[c[0]]&&fr[c[0]].abiertas)||0); });
      var box=document.getElementById('c-frentes'); box.innerHTML='';
      ['Frente','Abiertas','Peso','Venc.','Cerr.'].forEach(function(h,i){ box.appendChild(el('span','h'+(i===1||i>2?' r':''),h)); });
      CFR.forEach(function(c){ var x=fr[c[0]]; if(!x)return; var ab=Number(x.abiertas)||0, ve=Number(x.vencidas)||0, ce=Number(x.cerradas)||0;
        var nm=el('span','nm'); var dot=el('span','dot'); dot.style.background=c[2]; nm.appendChild(dot); nm.appendChild(document.createTextNode(c[1])); box.appendChild(nm);
        box.appendChild(el('span','r',String(ab)));
        var tk=el('span','trk'), fi=el('i'); fi.style.width=Math.round(100*ab/max)+'%'; fi.style.background=c[2]; tk.appendChild(fi); box.appendChild(tk);
        box.appendChild(el('span','r '+(ve?'nb':'n0'),String(ve))); box.appendChild(el('span','r '+(ce?'ng':'n0'),String(ce))); });
      tp.textContent=(d.cerradas||0)+' cerradas · '+(d.vencidas||0)+' vencidas'+(decs.length?' · '+decs.length+' decisiones':'');
      tp.className='tp '+((d.cerradas||0)?'ok':((d.vencidas||0)?'crit':''));
    }
    var dl=document.getElementById('c-dec'); dl.innerHTML='';
    if(!decs.length) dl.appendChild(el('li','hint','Ninguna tarea se movió dos veces todavía.'));
    decs.forEach(function(r){ cItem(dl,r.nombre||r.id,r.url,cFrName(r.frente)+' · movida '+r.veces+'×','nb'); });
    var hl=document.getElementById('c-hechas'); hl.innerHTML='';
    var hs=(d&&d.hechas)||[]; if(!hs.length) hl.appendChild(el('li','hint',d?'Nada cerrado en ClickUp en este cierre.':'—'));
    hs.forEach(function(h){ cItem(hl,h.nombre,h.url,cFrName(h.frente)); });
    var vl=document.getElementById('c-venc'); vl.innerHTML='';
    var vs=(d&&d.vencidasTop)||[]; if(!vs.length) vl.appendChild(el('li','hint',d?'Sin vencidas.':'—'));
    vs.forEach(function(v){ var rv=v.id&&CREP[v.id]; var ve=Number(v.veces!=null?v.veces:(rv&&rv.veces))||0;
      cItem(vl,v.nombre,v.url||(rv&&rv.url),cFrName(v.frente)+(ve?' · movida '+ve+'×':''),ve>=2?'nb':''); });
    document.getElementById('c-trend').innerHTML=CDIAS.length?cTrend(CDIAS):'<p class="hint">Sin historia todavía.</p>'; if(typeof renderFrentes==='function')renderFrentes(); }
  function cierreAttach(DBx,uid){ var base;
    try{ base=DBx.doc('data/users/'+uid+'/cierre'); }catch(e){ cMode='local'; renderCierre(); return; }
    base.collection('dias').orderBy('fecha','asc').limit(60).onSnapshot(function(qs){ cMode='sync';
      CDIAS=qs.docs.map(function(x){ return x.data(); }).filter(function(x){ return x&&x.fecha; }); renderCierre(); },function(){ cMode='error'; renderCierre(); });
    base.collection('reprog').onSnapshot(function(qs){ var m={}; qs.docs.forEach(function(x){ var v=x.data(); if(v){ m[x.id]=v; } }); CREP=m; renderCierre(); },function(){}); }
  function cierreLock(on){ document.getElementById('c-locked').hidden=!on; document.getElementById('c-body').hidden=!!on; }
  renderCierre();

