  // ---------- FINANZAS (espacio privado del titular) ----------
  var fmt=new Intl.NumberFormat('es-AR',{maximumFractionDigits:0});
  function money(n){ return '$'+fmt.format(Math.round(n||0)); }
  function parseNum(s){ s=String(s==null?'':s).replace(/[^\d.,-]/g,''); if(s.indexOf(',')>=0){ s=s.replace(/\./g,'').replace(',','.'); } else if(/^\d{1,3}(\.\d{3})+$/.test(s)){ s=s.replace(/\./g,''); } return Math.max(0,Math.round(Number(s))||0); }
  function parseDec(s){ s=String(s==null?'':s).trim().replace(',','.'); if(s==='')return null; var n=Number(s.replace(/[^\d.-]/g,'')); return isFinite(n)?n:null; }
  function has(x){ return x!=null && x!==''; }
  function pct(x){ return (x==null||!isFinite(x))?'—':(Math.round(x*1000)/10).toString().replace('.',',')+'%'; }
  function dec(x){ return String(x).replace('.',','); }
  function setT(id,t){ var e=document.getElementById(id); if(e)e.textContent=t; }
  var MESES=[['2026-09','Septiembre','base'],['2026-10','Octubre'],['2026-11','Noviembre'],['2026-12','Diciembre']];
  var HITOS=[['2026-10-01','01/10','Arranque: línea base y metas'],['2026-10-31','31/10','Cierre de octubre'],['2026-11-30','30/11','Cierre de noviembre'],['2026-12-31','31/12','Cierre del trimestre']];
  var FL='oreja_finpriv_v1';
  function finEmpty(){ return {egr:[],ing:[],cta:[],meses:{},metas:{},palancas:[]}; }
  function finNorm(o){ var f=finEmpty(); if(o&&typeof o==='object'){ ['egr','ing','cta','palancas'].forEach(function(k){ if(Array.isArray(o[k]))f[k]=o[k]; }); if(o.meses&&typeof o.meses==='object')f.meses=o.meses; if(o.metas&&typeof o.metas==='object')f.metas=o.metas; } return f; }
  var F=finNorm(lget(FL,null));
  var finRef=null, finCurJ=null, finTimer=null, finMode='conectando';
  var finBody=document.getElementById('fin-body');
  function saveF(){ lset(FL,F); if(finRef){ clearTimeout(finTimer); finTimer=setTimeout(function(){ try{ var j=JSON.stringify(F); finCurJ=j; finRef.set(JSON.parse(j))['catch'](function(){ finMode='error'; renderPriv(); }); }catch(e){} },400); } }
  function gTot(g){var t=0;(g[1]||[]).forEach(function(l){t+=Number(l[1])||0;});return t;}
  function egrTot(){var t=0;F.egr.forEach(function(g){t+=gTot(g);});return t;}
  function ingTot(){var t=0;F.ing.forEach(function(l){t+=Number(l[1])||0;});return t;}
  function ctaTot(){var t=0;F.cta.forEach(function(l){t+=Number(l[1])||0;});return t;}
  function amtInput(val,onset,ph){ var inp=document.createElement('input');inp.className='amt tnum';inp.type='text';inp.inputMode='numeric';
    var hv=has(val); inp.value=hv?fmt.format(Number(val)||0):''; if(ph)inp.placeholder=ph;
    inp.addEventListener('focus',function(){inp.value=hv?String(Number(val)||0):'';inp.select();});
    inp.addEventListener('blur',function(){var s=inp.value.trim(); onset(s===''?null:parseNum(s));});
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')inp.blur();}); return inp; }
  function delBtn(fn){ var b=document.createElement('button');b.className='del';b.type='button';b.textContent='✕';b.title='Quitar';b.addEventListener('click',fn);return b; }

  var egrBody=document.getElementById('egr-body');
  function renderEgr(){ var total=egrTot(); egrBody.innerHTML='';
    F.egr.forEach(function(g,gi){ var gt=gTot(g); var gr=document.createElement('tr'); gr.className='grouprow';
      gr.innerHTML='<td class="gname">'+esc(g[0])+'</td><td class="r gsub tnum pnum">'+money(gt)+'</td><td class="r gsub">'+(total?Math.round(gt/total*100):0)+'%</td>'; egrBody.appendChild(gr);
      (g[1]||[]).forEach(function(l,li){ var tr=document.createElement('tr'); tr.className='linerow';
        var td1=document.createElement('td'); td1.textContent=l[0];
        var td2=document.createElement('td'); td2.className='r'; td2.appendChild(amtInput(l[1],function(v){ F.egr[gi][1][li][1]=v||0; saveF(); renderFin(); }));
        var td3=document.createElement('td'); td3.className='r pct'; td3.textContent=(total?Math.round((Number(l[1])||0)/total*100):0)+'%';
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); egrBody.appendChild(tr); }); });
    setT('egr-total',money(total)); var lines=0; F.egr.forEach(function(g){lines+=(g[1]||[]).length;}); setT('egr-count',lines?lines+' líneas':'sin datos'); }
  function renderList(arr,bodyId,totId,totFn){ var body=document.getElementById(bodyId); body.innerHTML='';
    arr.forEach(function(l,i){ var tr=document.createElement('tr'); tr.className='linerow';
      var td1=document.createElement('td'); var nm=document.createElement('input'); nm.className='txtin'; nm.value=l[0]; nm.addEventListener('blur',function(){ arr[i][0]=nm.value; saveF(); renderFin(); }); td1.appendChild(nm);
      var td2=document.createElement('td'); td2.className='r'; td2.appendChild(amtInput(l[1],function(v){ arr[i][1]=v||0; saveF(); renderFin(); }));
      var td3=document.createElement('td'); td3.className='r'; td3.appendChild(delBtn(function(){ arr.splice(i,1); saveF(); renderFin(); }));
      tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3); body.appendChild(tr); });
    setT(totId,money(totFn())); }
  function renderBars(){ var box=document.getElementById('bars'); box.innerHTML=''; var arr=F.egr.map(function(g){return[g[0],gTot(g)];}).sort(function(a,b){return b[1]-a[1];}); var max=Math.max.apply(null,arr.map(function(x){return x[1];}).concat([1]));
    arr.forEach(function(x){ var row=document.createElement('div'); row.innerHTML='<div class="barlab"><span>'+esc(x[0])+'</span><span class="v">'+money(x[1])+'</span></div><div class="bartrack"><div class="barfill" style="width:'+(x[1]/max*100)+'%"></div></div>'; box.appendChild(row); }); }

  function setMes(k,f,v){ var m=F.meses[k]||(F.meses[k]={}); if(v==null)delete m[f]; else m[f]=v; saveF(); renderFin(); }
  function renderMeses(){ var b=document.getElementById('m-body'); b.innerHTML='';
    MESES.forEach(function(M){ var isBase=M[2]==='base'; var d=isBase?{ing:ingTot(),egr:egrTot(),disp:ctaTot()}:(F.meses[M[0]]||{});
      var tr=document.createElement('tr'); if(isBase)tr.className='base';
      var td=document.createElement('td'); td.innerHTML='<span class="mname">'+M[1]+'</span>'+(isBase?'<br><small>presupuesto</small>':''); tr.appendChild(td);
      ['ing','egr'].forEach(function(f){ var c=document.createElement('td'); c.className='r';
        if(isBase){ c.className='r tnum pnum'; c.textContent=money(d[f]); } else c.appendChild(amtInput(d[f],function(v){ setMes(M[0],f,v); },'—'));
        tr.appendChild(c); });
      var both=has(d.ing)&&has(d.egr);
      var cs=document.createElement('td'); cs.className='r tnum pnum'; cs.textContent=both?money(d.ing-d.egr):'—'; tr.appendChild(cs);
      var ca=document.createElement('td'); ca.className='r tnum'; ca.textContent=(both&&d.ing)?pct((d.ing-d.egr)/d.ing):'—'; tr.appendChild(ca);
      var cd=document.createElement('td'); cd.className='r';
      if(isBase){ cd.className='r tnum pnum'; cd.textContent=d.disp?money(d.disp):'—'; } else cd.appendChild(amtInput(d.disp,function(v){ setMes(M[0],'disp',v); },'—'));
      tr.appendChild(cd); b.appendChild(tr); }); }
  function bindMeta(id,key){ var el=document.getElementById(id); el.addEventListener('blur',function(){ var v=parseDec(el.value); if(v==null)delete F.metas[key]; else F.metas[key]=v; saveF(); renderFin(); }); el.addEventListener('keydown',function(e){ if(e.key==='Enter')el.blur(); }); }
  function fillMeta(id,key){ var el=document.getElementById(id); if(document.activeElement!==el){ var v=F.metas[key]; el.value=(v==null?'':dec(v)); } }
  bindMeta('meta-ahorro','ahorro'); bindMeta('meta-colchon','colchon'); bindMeta('meta-infl','infl');

  function ultimoReal(){ for(var i=MESES.length-1;i>0;i--){ var m=F.meses[MESES[i][0]]; if(m&&has(m.ing)&&has(m.egr))return {i:i,n:MESES[i][1],m:m}; } return null; }
  function renderKpis(){ var bi=ingTot(), be=egrTot(), baseA=bi?(bi-be)/bi:null, u=ultimoReal();
    var a=u?(u.m.ing?(u.m.ing-u.m.egr)/u.m.ing:null):baseA;
    setT('k-ahorro',pct(a)); setT('k-ahorro-s',(u?u.n+', real':'Septiembre, presupuesto')+' · '+(F.metas.ahorro!=null?'meta '+dec(F.metas.ahorro)+'%':'sin meta')+(u?' · base '+pct(baseA):''));
    var disp=(u&&has(u.m.disp))?u.m.disp:ctaTot(), gasto=u?u.m.egr:be;
    if(!disp||!gasto){ setT('k-colchon','—'); setT('k-colchon-s','cargá los saldos de cuentas'); }
    else { setT('k-colchon',dec(Math.round(disp/gasto*10)/10)+' meses'); setT('k-colchon-s',money(disp)+' disponible · '+(F.metas.colchon!=null?'meta '+dec(F.metas.colchon)+' meses':'sin meta')); }
    var ciego=0; F.egr.forEach(function(g){ (g[1]||[]).forEach(function(l){ if(/american express|amex|varios/i.test(l[0]))ciego+=Number(l[1])||0; }); });
    setT('k-ciego',be?pct(ciego/be):'—'); setT('k-ciego-s',money(ciego)+' en tarjeta y varios sin abrir');
    if(u&&be){ var infl=F.metas.infl, pres=be*(infl!=null?Math.pow(1+infl/100,u.i):1), dv=(u.m.egr-pres)/pres;
      setT('k-desvio',(dv>0?'+':'')+pct(dv)); setT('k-desvio-s',u.n+' vs presupuesto '+(infl!=null?'ajustado '+dec(infl)+'%/mes':'sin ajustar por inflación')); }
    else { setT('k-desvio','—'); setT('k-desvio-s','sin mes real cargado'); } }
  function todayKey(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function faseLabel(){ var t=todayKey(); if(t<'2026-10-01')return 'Arranca 01/10'; if(t<='2026-10-31')return 'Mes 1 de 3'; if(t<='2026-11-30')return 'Mes 2 de 3'; if(t<='2026-12-31')return 'Mes 3 de 3'; return 'Trimestre cerrado'; }
  function renderStrip(){ var t=todayKey(), box=document.getElementById('q-strip'), now=false; box.innerHTML='';
    HITOS.forEach(function(h){ var el=document.createElement('div'), c='qstep'; if(t>h[0])c+=' done'; else if(!now){ c+=' now'; now=true; }
      el.className=c; el.innerHTML='<div class="d">'+h[1]+'</div><div class="n">'+h[2]+'</div>'; box.appendChild(el); }); }

  var PEST=[['nuevo','Nuevo'],['curso','En curso'],['hecho','Hecho'],['descartado','Descartado']];
  function cerrada(p){ return p.est==='hecho'||p.est==='descartado'; }
  function renderPal(){ var box=document.getElementById('pal-list'); box.innerHTML=''; var sumH=0, ab=0;
    F.palancas.forEach(function(p,i){ if(p.est==='hecho')sumH+=Number(p.imp)||0; if(!cerrada(p))ab++;
      var card=document.createElement('div'); card.className='gitem'+(cerrada(p)?' done':'');
      var top=document.createElement('div'); top.className='gtop';
      var gt=document.createElement('div'); gt.className='gt'; gt.innerHTML='<b>'+esc(p.t||'')+'</b>'+(p.s?'<span class="s">'+esc(p.s)+'</span>':'');
      var del=document.createElement('button'); del.className='gdel'; del.type='button'; del.textContent='✕'; del.title='Quitar';
      del.addEventListener('click',function(){ F.palancas.splice(i,1); saveF(); renderFin(); });
      top.appendChild(gt); top.appendChild(del);
      var ctl=document.createElement('div'); ctl.className='gctl';
      var sel=document.createElement('select'); sel.className='estsel st-'+(p.est||'nuevo');
      PEST.forEach(function(e){ var o=document.createElement('option'); o.value=e[0]; o.textContent=e[1]; if(e[0]===(p.est||'nuevo'))o.selected=true; sel.appendChild(o); });
      sel.addEventListener('change',function(){ F.palancas[i].est=sel.value; saveF(); renderFin(); });
      var nota=document.createElement('input'); nota.className='gnote'; nota.type='text'; nota.placeholder='próximo paso / nota…'; nota.value=p.nota||'';
      nota.addEventListener('blur',function(){ F.palancas[i].nota=nota.value; saveF(); });
      var imp=document.createElement('label'); imp.className='imp'; imp.appendChild(document.createTextNode('$/mes'));
      imp.appendChild(amtInput(p.imp,function(v){ if(v==null)delete F.palancas[i].imp; else F.palancas[i].imp=v; saveF(); renderFin(); },'impacto'));
      ctl.appendChild(sel); ctl.appendChild(nota); ctl.appendChild(imp);
      card.appendChild(top); card.appendChild(ctl); box.appendChild(card); });
    setT('pal-count',F.palancas.length?(ab+' abiertas · '+F.palancas.length+' total'):'');
    document.getElementById('pal-sum').innerHTML=sumH?'Impacto confirmado: <b class="pnum">'+money(sumH)+'/mes</b>':'Impacto confirmado: todavía ninguno.'; }
  function addPal(t){ if(!t)return; F.palancas.push({id:'l'+Date.now(),t:t,s:'',est:'nuevo',nota:''}); saveF(); renderFin(); }
  document.getElementById('pal-add-btn').addEventListener('click',function(){ var inp=document.getElementById('pal-add-input'); addPal(inp.value.trim()); inp.value=''; });
  document.getElementById('pal-add-input').addEventListener('keydown',function(e){ if(e.key==='Enter'){ addPal(e.target.value.trim()); e.target.value=''; } });

  function renderObs(){ var ul=document.getElementById('obs'); ul.innerHTML=''; var bi=ingTot(), be=egrTot();
    function li(chip,cls,html){ var l=document.createElement('li'); l.innerHTML='<span class="chip '+cls+'">'+chip+'</span><div>'+html+'</div>'; ul.appendChild(l); }
    if(!bi&&!be){ li('Vacío','flag','Todavía no hay datos en tu espacio privado.'); return; }
    var sup=bi-be; li('Colchón','note','Superávit presupuestado de <b class="pnum">'+money(sup)+'</b> ('+pct(bi?sup/bi:null)+' del ingreso). Sano pero fino para un ingreso que se mueve mes a mes.');
    var g=0; F.ing.forEach(function(l){ if(/golden/i.test(l[0]))g+=Number(l[1])||0; });
    if(bi&&g) li('Concentración','flag','<b>'+pct(g/bi)+'</b> del ingreso viene de Golden. Es estructural, no se arregla en 90 días; el colchón es el seguro mientras tanto.');
    var ax=null; F.egr.forEach(function(gr){ (gr[1]||[]).forEach(function(l){ if(/american express|amex/i.test(l[0])&&Number(l[1])>0)ax=l; }); });
    if(ax) li('Punto ciego','watch',esc(ax[0])+' (<span class="pnum">'+money(ax[1])+'</span>) sin desagregar: una tarjeta no es una categoría.');
    if(!ctaTot()) li('Sin medir','watch','Saldos de cuentas en cero: sin eso el colchón no se puede medir.'); }
  function renderPriv(){ var t={
      conectando:'<b>Conectando tu espacio privado…</b>',
      sync:'<b>Espacio privado, solo tuyo.</b> Vive en tu carpeta personal dentro de Oreja: nadie más lo ve aunque compartas la app. Sincroniza entre tus dispositivos. Cloty lo lee solo cuando le pedís un cierre. Sin conexión bancaria: los saldos los cargás vos.',
      local:'<b>Solo en este dispositivo.</b> Esta vista no pudo abrir tu espacio privado sincronizado; lo que cargues queda en este navegador.',
      error:'<b>No se pudo guardar en tu espacio privado.</b> Lo último quedó en este dispositivo; recargá para reintentar.',
      ajeno:'<b>Sección privada del titular.</b>' }[finMode];
    document.getElementById('fin-privacy').innerHTML=t||''; }
  function renderFinFrente(){ var fl=faseLabel(); setT('tp-fin',fl); setT('fr-fin-pill',fl);
    if(finMode==='ajeno'){ setT('fr-fin-a','Privado del titular.'); setT('fr-fin-b',''); return; }
    var u=ultimoReal(), bi=ingTot(), be=egrTot();
    setT('fr-fin-a',u?('Último cierre: '+u.n+' · ahorro '+pct(u.m.ing?(u.m.ing-u.m.egr)/u.m.ing:null)):('Base septiembre: ahorro '+(bi?pct((bi-be)/bi):'—')+' (presupuesto)'));
    var ab=F.palancas.filter(function(p){return !cerrada(p);}).length; setT('fr-fin-b',ab+' palancas abiertas · metas '+((F.metas.ahorro!=null&&F.metas.colchon!=null)?'definidas':'sin definir')); }
