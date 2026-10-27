  // ---------- USO DE LAS SECCIONES (privado; qué se abre de verdad) ----------
  // Cuenta aperturas por vista y por día en data/users/<id>/vistas. Sirve para decidir qué se fusiona o se saca.
  var VNOM={home:'Inicio',proyectos:'Proyectos',agora:'Ágora Field',golden:'Golden',negocios:'Negocios',habitos:'Hábitos',poder:'Posición',cierre:'Cierre',hoy:'Hoy',frentes:'Frentes',temas:'Gestión',radar:'Radar',finanzas:'Finanzas',inversiones:'Inversiones',captura:'Captura',doctrina:'Doctrina',sponsors:'Sponsors',admision:'Admisión BS'};
  var VU={dias:{}}, vuRef=null, vuListo=false, vuPend={}, vuTimer=null;
  function vuCuenta(v){ if(VIEWS.indexOf(v)<0)v='home'; var k=todayKey(), d=vuPend[k]||(vuPend[k]={}); d[v]=(d[v]||0)+1; vuFlush(); }
  function vuFlush(){ if(!vuRef||!vuListo)return; clearTimeout(vuTimer);
    vuTimer=setTimeout(function(){ var ks=Object.keys(vuPend); if(!ks.length)return;
      var nx={dias:JSON.parse(JSON.stringify(VU.dias||{}))};
      ks.forEach(function(k){ var d=nx.dias[k]||(nx.dias[k]={}); Object.keys(vuPend[k]).forEach(function(v){ d[v]=(Number(d[v])||0)+vuPend[k][v]; }); });
      var lim=dayKey(120); Object.keys(nx.dias).forEach(function(k){ if(k<lim)delete nx.dias[k]; });
      nx.act=nowIso(); vuPend={}; VU=nx; vuRef.set(JSON.parse(JSON.stringify(nx)))['catch'](function(){}); renderUso(); },1500); }
  function renderUso(){ var box=document.getElementById('uso-vistas'); if(!box)return;
    var lim=dayKey(29), tot={}, desde=null; Object.keys(VU.dias||{}).forEach(function(k){ if(k<lim)return; if(!desde||k<desde)desde=k; var d=VU.dias[k]||{}; Object.keys(d).forEach(function(v){ if(v!=='home'&&VNOM[v])tot[v]=(tot[v]||0)+(Number(d[v])||0); }); });
    if(!vuRef||!desde){ box.hidden=true; return; }
    var top=Object.keys(tot).sort(function(a,b){ return tot[b]-tot[a]; }), nunca=VIEWS.filter(function(v){ return v!=='home'&&!tot[v]; });
    box.textContent='Uso desde el '+dm(desde)+' (30 días máx.) · '+(top.length?top.slice(0,5).map(function(v){ return VNOM[v]+' '+tot[v]; }).join(' · '):'solo el inicio')+(nunca.length?' · Sin abrir: '+nunca.map(function(v){ return VNOM[v]; }).join(', '):'');
    box.hidden=false; }
  function usoAttach(DBx,uid){ try{ vuRef=DBx.doc('data/users/'+uid+'/vistas'); }catch(e){ vuRef=null; return; }
    vuRef.onSnapshot(function(s){ var d=(s&&s.exists)?(s.data()||{}):{}; VU={dias:(d.dias&&typeof d.dias==='object')?JSON.parse(JSON.stringify(d.dias)):{}}; vuListo=true; renderUso(); vuFlush(); },function(){}); }
  window.addEventListener('hashchange',function(){ vuCuenta((location.hash||'').replace('#','')); });
  vuCuenta((location.hash||'').replace('#',''));

