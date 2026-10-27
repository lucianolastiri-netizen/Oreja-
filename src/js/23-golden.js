  // ---------- GOLDEN · NÚMEROS (privado; resultado real por fecha) ----------
  var GD={}, GM={}, gdCol=null, gdRef=null, gdMode='conectando', gdTemp=null, gdShow=lget('oreja_gdshow',true)!==false;
  var gdBody=document.getElementById('gd-body');
  var GDF=[['sep','Ingresos (hoja GENERAL)'],['masc','Partidos masculino'],['fem','Partidos femenino'],['est','Estacionamiento'],['cant','Cantina (caja del día)'],
    ['sep','Salidas del día (hoja GENERAL)'],['arb','Árbitros'],['p_torneo','Personal torneo'],['p_cant','Personal cantina'],['p_est','Personal estacionamiento'],['g_cant','Gastos cantina'],['policia','Policía'],['ambul','Ambulancia'],['limp','Limpieza'],
    ['sep','Formulario de gastos'],['form','Gastos del formulario (total)'],['retiro','Retiro de socios (incluido en el total)'],
    ['sep','Planilla de cantina'],['cant_total','Total gastos cantina'],['cant_res','Resultado sin contar stock'],['stock','Stock sobrante valorizado'],['bonif','Bonificaciones']];
  function gdNum(v){ if(v==null||v==='')return null; if(typeof v==='number')return v; var s=String(v).trim(); if(!s)return null; s=s.replace(/[^\d,.\-]/g,'');
    var mm=s.match(/^(.*)[.,](\d{1,2})$/); if(mm) s=mm[1].replace(/[.,]/g,'')+'.'+mm[2]; else s=s.replace(/[.,]/g,'');
    var n=parseFloat(s); return isFinite(n)?n:null; }
  function gdM(n){ if(n==null||!isFinite(n))return '—'; return (n/1e6).toLocaleString('es-AR',{minimumFractionDigits:1,maximumFractionDigits:1}); }
  function gdV(x,k){ var v=x[k]; return typeof v==='number'?v:0; }
  function gdCalc(x){ var ing=gdV(x,'masc')+gdV(x,'fem')+gdV(x,'est')+gdV(x,'cant');
    var sal=['arb','p_torneo','p_cant','p_est','g_cant','policia','ambul','limp'].reduce(function(a,k){ return a+gdV(x,k); },0);
    var plan=ing-sal, tieneC=typeof x.cant_total==='number', fuera=tieneC?(x.cant_total-gdV(x,'g_cant')-gdV(x,'p_cant')):0, fop=gdV(x,'form')-gdV(x,'retiro');
    return {ing:ing,sal:sal,plan:plan,fuera:fuera,tieneC:tieneC,fop:fop,real:plan-fuera-fop}; }
  function gdTemps(){ var t={}; Object.keys(GD).forEach(function(k){ var x=GD[k]; if(x&&x.temp)t[x.temp]=(x.temp_nombre||x.temp); }); return t; }
  function gdAll(){ return Object.keys(GD).map(function(k){ return GD[k]; }).filter(function(x){ return x&&x.temp===gdTemp&&typeof x.n==='number'; }).sort(function(a,b){ return a.n-b.n; }); }
  function gdLock(on){ document.getElementById('gd-locked').hidden=!on; gdBody.hidden=!!on; }
  function gdToGest(t,d){ var id='gold-'+Date.now().toString(36);
    var it={id:id,t:t,d:d,frente:'golden',sev:'warn',est:'nuevo',fecha:'',quien:'Lucho',prox:'',origen:{tipo:'manual',de:'Golden · números'},creado:nowIso(),reprog:0,hist:[]};
    gHist(it,'Creado desde Golden · números','lucho'); gSave(it); renderGest(); }
  function gdChart(all){ if(!all.length)return '';
    var rows=all.map(function(x){ return {n:x.n,c:gdCalc(x)}; }), W=640,H=210,L=40,R=10,T=12,B=28;
    var mx=Math.max.apply(null,rows.map(function(r){ return Math.max(r.c.plan,r.c.real); }))||1, step=Math.pow(10,Math.floor(Math.log10(mx))), nice=Math.ceil(mx/step)*step; if(nice/step<4)step=step/2;
    var sy=function(v){ return T+(H-T-B)*(1-Math.max(0,v)/nice); }, bw=(W-L-R)/rows.length;
    var o='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Resultado por fecha: planilla contra resultado real">';
    for(var v=0; v<=nice+0.001; v+=step){ var y=sy(v).toFixed(1); o+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-6)+'" y="'+(+y+3)+'" text-anchor="end" class="pnum">'+gdM(v)+'</text>'; }
    rows.forEach(function(r,i){ var x0=L+i*bw, w=bw*0.3;
      [['bp',r.c.plan,x0+bw*0.17],['br',r.c.real,x0+bw*0.17+w+2]].forEach(function(b){ var y=sy(b[1]); o+='<rect class="'+b[0]+'" x="'+b[2].toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(0,H-B-y).toFixed(1)+'" rx="2"><title>Fecha '+r.n+': '+(b[0]==='bp'?'planilla ':'real ')+gdM(b[1])+' M</title></rect>'; });
      o+='<text x="'+(x0+bw/2).toFixed(1)+'" y="'+(H-B+15)+'" text-anchor="middle">F'+r.n+'</text>'; });
    return o+'</svg>'; }
  function renderGd(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Números internos de Golden: no se comparten fuera de esta vista.',local:'<b>Sin conexión a tu espacio privado.</b> Los números solo se ven desde tu cuenta.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[gdMode];
    document.getElementById('gd-priv').innerHTML=pv||''; var tp=document.getElementById('tp-gold');
    if(gdMode==='ajeno'){ if(tp){ tp.textContent='privado'; tp.className='tp'; } return; }
    var temps=gdTemps(), tk=Object.keys(temps).sort(); if(!gdTemp||!temps[gdTemp]) gdTemp=GM.temp_actual&&temps[GM.temp_actual]?GM.temp_actual:(tk[tk.length-1]||null);
    gdBody.classList.toggle('gdmask',!gdShow); document.getElementById('gd-mask').textContent=gdShow?'Ocultar montos':'Mostrar montos';
    var all=gdAll(); setT('gd-temp',gdTemp?(temps[gdTemp]+' · '+all.length+' fecha'+(all.length===1?'':'s')):'sin fechas');
    var kp=document.getElementById('gd-kpis'), hall=document.getElementById('gd-hall'), tab=document.getElementById('gd-tab'); kp.innerHTML=''; hall.innerHTML=''; tab.innerHTML='';
    renderGdFalt(); renderGdForm();
    if(!all.length){ kp.appendChild(el('p','hint','Todavía no hay fechas cargadas. Cargá la primera abajo.')); document.getElementById('gd-chart').innerHTML=''; setT('gd-k',''); if(tp){ tp.textContent='sin fechas'; tp.className='tp'; } return; }
    var S={plan:0,real:0,fuera:0,fop:0,ing:0,ret:0,cres:0,bon:0,masc:[],est:[]}, sinC=0;
    all.forEach(function(x){ var c=gdCalc(x); S.plan+=c.plan; S.real+=c.real; S.fuera+=c.fuera; S.fop+=c.fop; S.ing+=c.ing; S.ret+=gdV(x,'retiro'); S.cres+=gdV(x,'cant_res'); S.bon+=gdV(x,'bonif'); S.masc.push(gdV(x,'masc')); S.est.push(gdV(x,'est')); if(!c.tieneC)sinC++; });
    var last=all[all.length-1], brecha=S.plan?Math.round(100*(1-S.real/S.plan)):0;
    function k(l,v,s,acc){ var d=el('div','pstat'+(acc?' acc':'')); d.appendChild(el('div','l',l)); var vv=el('div','v pnum',v); d.appendChild(vv); if(s)d.appendChild(el('div','s',s)); kp.appendChild(d); }
    k('Resultado real','$'+gdM(S.real)+' M','La planilla dice $'+gdM(S.plan)+' M: '+brecha+'% menos',true);
    k('Real por fecha','$'+gdM(S.real/all.length)+' M','Última (F'+last.n+'): $'+gdM(gdCalc(last).real)+' M');
    var si=gdNum(GM.stock_inicial), conS=all.filter(function(x){ return typeof x.stock==='number'; }), sf=conS.length?conS[conS.length-1].stock:0;
    k('Cantina',si!=null?'$'+gdM(S.cres+sf-si)+' M':'$'+gdM(S.cres)+' M',si!=null?'Con stock: final '+gdM(sf)+' − inicial '+gdM(si):'Sin stock: falta el stock inicial');
    var fm=gdNum(GM.fijo_mensual), fpf=fm!=null?fm*12/(GM.fechas_anio||34):null;
    k('Después de estructura',fpf!=null?'$'+gdM(S.real/all.length-fpf)+' M':'—',fpf!=null?'Por fecha, con fijo de $'+gdM(fpf)+' M por fecha':'Falta el costo fijo mensual');
    document.getElementById('gd-chart').innerHTML=gdChart(all);
    document.getElementById('gd-nota').textContent='Resultado real = Resultado fecha − compras de cantina pagadas aparte (total gastos de la planilla de cantina − gastos y personal de cantina que ya salieron de la caja) − gastos del formulario sin retiros de socios. No incluye sponsors, costos de estructura ni la variación de stock.'+(sinC?' '+sinC+' fecha'+(sinC>1?'s':'')+' sin planilla de cantina: el real está sobreestimado ahí.':'');
    // hallazgos
    function H(chip,t,gt){ var li=el('li'); li.appendChild(el('span','chip '+chip,{watch:'riesgo',flag:'revisar',note:'dato'}[chip])); var tx=el('span','ht'); tx.textContent=t; li.appendChild(tx);
      if(gt){ var b=el('button','minibtn','→ Gestión'); b.type='button'; b.addEventListener('click',function(){ gdToGest(gt,t); b.textContent='En Gestión'; b.disabled=true; }); li.appendChild(b); } hall.appendChild(li); }
    H('watch','La planilla muestra $'+gdM(S.plan)+' M de resultado en '+all.length+' fechas; el real aproximado es $'+gdM(S.real)+' M ('+brecha+'% menos). La diferencia son compras de cantina ($'+gdM(S.fuera)+' M) y gastos del formulario ($'+gdM(S.fop)+' M) que la hoja GENERAL no resta.','Golden: que la planilla GENERAL muestre el resultado real de la fecha');
    var tot=S.cres+all.reduce(function(a,x){ return a+gdV(x,'stock'); },0);
    if(S.cres) H('flag','Si se suma el "Resultado total" de la planilla de cantina da $'+gdM(tot)+' M: cuenta el stock sobrante '+all.length+' veces. Sin stock, la cantina dejó $'+gdM(S.cres)+' M.',null);
    var m0=Math.min.apply(null,S.masc), m1=Math.max.apply(null,S.masc); if(S.masc.length>2&&m1&&(m1-m0)/m1<0.05) H('note','Masculino plano: entre $'+gdM(m0)+' y $'+gdM(m1)+' M por fecha. El torneo está en su techo de partidos; el crecimiento viene de cantina, estacionamiento o sponsors.',null);
    var e0=S.est[0], e1=S.est[S.est.length-1]; if(S.est.length>2&&e0&&e1<e0) H('watch','Estacionamiento cae de $'+gdM(e0)+' M (F'+all[0].n+') a $'+gdM(e1)+' M (F'+last.n+'): '+Math.round(100*(e1/e0-1))+'% nominal, con inflación en contra.','Golden: por qué cae el estacionamiento');
    if(S.bon&&!(GM.bonif_nota||'').trim()) H('flag','Hay $'+gdM(S.bon)+' M de bonificaciones en cantina que no cuentan como ingreso ni bajan el costo. Falta saber qué son.','Golden: qué son las bonificaciones de cantina');
    if(S.ret) H('flag','Retiros de socios: $'+gdM(S.ret)+' M en '+all.length+' fechas, con montos y cantidad de socios distintos por fecha. No hay cuenta corriente por socio.','Golden: cuenta corriente por socio');
    (GM.notas||[]).forEach(function(n){ H('flag',n,null); });
    // tabla
    var t='<table class="gdtab"><thead><tr><th>Fecha</th><th class="r">Ingresos</th><th class="r">Planilla</th><th class="r">Cantina aparte</th><th class="r">Formulario</th><th class="r">Real</th><th class="r">Retiros</th></tr></thead><tbody>';
    all.forEach(function(x){ var c=gdCalc(x); t+='<tr><td>F'+x.n+'</td><td class="r pnum">'+gdM(c.ing)+'</td><td class="r pnum">'+gdM(c.plan)+'</td><td class="r pnum">'+(c.tieneC?'−'+gdM(c.fuera):'falta')+'</td><td class="r pnum">−'+gdM(c.fop)+'</td><td class="r pnum"><b>'+gdM(c.real)+'</b></td><td class="r pnum">'+gdM(gdV(x,'retiro'))+'</td></tr>'; });
    t+='</tbody><tfoot><tr><td>Total</td><td class="r pnum">'+gdM(S.ing)+'</td><td class="r pnum">'+gdM(S.plan)+'</td><td class="r pnum">−'+gdM(S.fuera)+'</td><td class="r pnum">−'+gdM(S.fop)+'</td><td class="r pnum">'+gdM(S.real)+'</td><td class="r pnum">'+gdM(S.ret)+'</td></tr></tfoot></table>';
    tab.innerHTML=t;
    setT('gd-k',all.length+' fechas · real '+brecha+'% bajo la planilla');
    if(tp){ tp.textContent=all.length+' fechas · real −'+brecha+'% vs planilla'; tp.className='tp'+(brecha>15?' warn':''); } }
  function renderGdFalt(){ var b=document.getElementById('gd-falt'); if(b.contains(document.activeElement))return; b.innerHTML='';
    [['stock_inicial','Stock de cantina al arrancar la temporada ($)','Con esto la cantina se mide bien'],['fijo_mensual','Costo fijo mensual de Golden ($)','Sueldos fijos, servicios, mantenimiento del predio'],['fechas_anio','Fechas por año','Para repartir el fijo: 34 = dos temporadas de 17']].forEach(function(f){
      var l=el('label',null,f[1]); var i=el('input','p2in num'+((GM[f[0]]==null||GM[f[0]]==='')&&f[0]!=='fechas_anio'?' vacio':'')); i.id='gdf-'+f[0]; i.inputMode='decimal'; i.value=GM[f[0]]!=null?String(GM[f[0]]):(f[0]==='fechas_anio'?'34':''); i.placeholder=f[2]; l.appendChild(i); b.appendChild(l); });
    var l2=el('label','full','Qué son las bonificaciones de cantina'); var t=el('input','p2in'); t.id='gdf-bonif_nota'; t.value=GM.bonif_nota||''; t.placeholder='ej.: producto bonificado por Heineken, no se paga'; l2.appendChild(t); b.appendChild(l2); }
  function renderGdForm(){ var b=document.getElementById('gd-form'); if(b.contains(document.activeElement))return; b.innerHTML='';
    var l=el('label',null,'Fecha'); var s=el('select','p2in'); s.id='gdx-n'; var all=gdAll(), nx=all.length?all[all.length-1].n+1:1;
    all.forEach(function(x){ var o=el('option',null,'F'+x.n+' (corregir)'); o.value=String(x.n); s.appendChild(o); }); var on=el('option',null,'F'+nx+' (nueva)'); on.value=String(nx); on.selected=true; s.appendChild(on);
    s.addEventListener('change',function(){ var x=all.filter(function(y){ return String(y.n)===s.value; })[0]||{}; GDF.forEach(function(f){ if(f[0]!=='sep'){ var i=document.getElementById('gdx-'+f[0]); if(i)i.value=x[f[0]]!=null?String(x[f[0]]):''; } }); });
    l.appendChild(s); b.appendChild(l);
    GDF.forEach(function(f){ if(f[0]==='sep'){ b.appendChild(el('div','sep',f[1])); return; } var lb=el('label',null,f[1]); var i=el('input','p2in num'); i.id='gdx-'+f[0]; i.inputMode='decimal'; lb.appendChild(i); b.appendChild(lb); }); }
  document.getElementById('gd-mask').addEventListener('click',function(){ gdShow=!gdShow; lset('oreja_gdshow',gdShow); renderGd(); });
  document.getElementById('gd-falt-save').addEventListener('click',function(){ var m=document.getElementById('gd-falt-msg');
    ['stock_inicial','fijo_mensual','fechas_anio'].forEach(function(k){ var v=gdNum(document.getElementById('gdf-'+k).value); if(v==null)delete GM[k]; else GM[k]=v; });
    GM.bonif_nota=document.getElementById('gdf-bonif_nota').value.trim(); GM.act=nowIso();
    if(gdRef){ gdRef.set(JSON.parse(JSON.stringify(GM))).then(function(){ m.textContent='Guardado'; },function(){ gdMode='error'; renderGd(); }); } else m.textContent='Sin conexión: no se guardó';
    document.activeElement&&document.activeElement.blur&&document.activeElement.blur(); renderGd(); });
  document.getElementById('gd-save').addEventListener('click',function(){ var m=document.getElementById('gd-msg'), n=parseInt(document.getElementById('gdx-n').value,10); if(!gdTemp){ gdTemp=GM.temp_actual||'temp'; }
    var x={id:gdTemp+'-f'+n,temp:gdTemp,temp_nombre:(gdTemps()[gdTemp]||gdTemp),n:n,fuente:'Cargado en Oreja',act:nowIso()}, faltan=[];
    GDF.forEach(function(f){ if(f[0]==='sep')return; var v=gdNum(document.getElementById('gdx-'+f[0]).value); if(v!=null)x[f[0]]=v; else if(['masc','fem','est','cant','arb'].indexOf(f[0])>=0)faltan.push(f[1]); });
    if(faltan.length){ m.textContent='Faltan: '+faltan.join(', '); m.style.color='var(--crit)'; return; } m.style.color='';
    GD[x.id]=x; if(gdCol){ gdCol.doc(x.id).set(JSON.parse(JSON.stringify(x))).then(function(){ m.textContent='F'+n+' guardada'; },function(){ gdMode='error'; renderGd(); }); } else m.textContent='Sin conexión: no se guardó';
    document.activeElement&&document.activeElement.blur&&document.activeElement.blur(); renderGd(); });
  function gdAttach(DBx,uid){ try{ gdRef=DBx.doc('data/users/'+uid+'/golden'); gdCol=gdRef.collection('fechas'); }catch(e){ gdMode='local'; renderGd(); return; }
    gdRef.onSnapshot(function(sn){ GM=(sn&&sn.exists)?JSON.parse(JSON.stringify(sn.data()||{})):{}; renderGd(); },function(){});
    gdCol.onSnapshot(function(qs){ gdMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); GD=m; renderGd(); },function(){ gdMode='error'; renderGd(); }); }
  renderGd();

