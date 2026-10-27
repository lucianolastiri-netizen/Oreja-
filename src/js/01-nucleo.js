  "use strict";
  var VIEWS=['home','proyectos','agora','golden','negocios','habitos','poder','cierre','hoy','frentes','temas','radar','finanzas','inversiones','captura','doctrina','sponsors','admision'];
  try{localStorage.removeItem('oreja_fin_v1');localStorage.removeItem('oreja_finhide');}catch(e){}
  function show(v){ if(VIEWS.indexOf(v)<0)v='home'; VIEWS.forEach(function(id){ var el=document.getElementById('v-'+id); if(el)el.classList.toggle('active',id===v); }); try{window.scrollTo(0,0);}catch(e){} }
  window.addEventListener('hashchange',function(){ show((location.hash||'').replace('#','')); });
  show((location.hash||'').replace('#','')||'home');

  function lget(k,d){ try{var r=localStorage.getItem(k); return r?JSON.parse(r):d;}catch(e){return d;} }
  function lset(k,v){ try{localStorage.setItem(k,JSON.stringify(v));}catch(e){} }
  // ----- capa de base de datos (sync entre dispositivos + Cloty) -----
  var DB=null, dbCur={}, dbSeeded={};
  function dbSet(path,obj){ try{dbCur[path]=JSON.stringify(obj);}catch(e){} if(DB){ try{ DB.doc(path).set(obj)['catch'](function(){}); }catch(e){} } }
  function dbWatch(path, getLocal, apply){ if(!DB)return;
    try{ DB.doc(path).onSnapshot(function(snap){
      if(!snap||!snap.exists){ if(!dbSeeded[path]){ dbSeeded[path]=true; dbSet(path, getLocal()); } return; }
      var d=snap.data()||{}, j=null; try{j=JSON.stringify(d);}catch(e){}
      if(j!==null && j===dbCur[path]) return; dbCur[path]=j; apply(d);
    }, function(){}); }catch(e){} }
  function saveP(){ lset(PK,P); dbSet('state/principios',{items:P}); }
  function copyText(t){ if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(t);} try{var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}catch(e){} return Promise.resolve(); }

  // theme
  var root=document.documentElement;
  function cur(){ if(root.getAttribute('data-theme'))return root.getAttribute('data-theme'); return (window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light'; }
  try{var sv=localStorage.getItem('oreja_theme'); if(sv)root.setAttribute('data-theme',sv);}catch(e){}
  document.getElementById('theme').addEventListener('click',function(){ var n=cur()==='dark'?'light':'dark'; root.setAttribute('data-theme',n); try{localStorage.setItem('oreja_theme',n);}catch(e){} });

  // clock + working window
  var clk=document.getElementById('clock'), cwin=document.getElementById('chip-window');
  function inWindow(d){ var day=d.getDay(), h=d.getHours(); return (day>=1&&day<=6)&&(h>=8&&h<18); }
  function tick(){ try{ var d=new Date(); clk.textContent='Oreja · '+d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    var iw=inWindow(d); cwin.innerHTML='Lun–Sáb · 8–18 · '+(iw?'<b>en ventana</b>':'fuera'); cwin.className='schip '+(iw?'ok':''); }catch(e){} }
  tick(); setInterval(tick,30000);
  try{ var hd=new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); document.getElementById('home-date').textContent=hd.charAt(0).toUpperCase()+hd.slice(1)+' · Córdoba'; }catch(e){}

