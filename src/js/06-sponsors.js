  // ---------- SPONSORS (privado; lo alimenta Cloty con cantina + control de ingreso) ----------
  var SP={}, AUD=null, spCol=null, audRef=null, spMode='conectando', spSel=null;
  var SPEST=[['firmar','Acuerdo a firmar'],['activo','Contrato firmado'],['prospecto','Prospecto'],['sin','Sin definir']];
  var spShow=lget('oreja_spshow',false)===true;
  function spMoney(n){ return (typeof n==='number')?'$'+nf(Math.round(n)):(n==null||n===''?'—':String(n)); }
  function spProm(x){ return x.contrato&&x.contrato.prom_anual||0; }
  function nf(n,d){ try{ return Number(n).toLocaleString('es-AR',{maximumFractionDigits:d==null?0:d,minimumFractionDigits:d||0}); }catch(e){ return String(n); } }
  function spAll(){ return Object.keys(SP).map(function(k){ return SP[k]; }).filter(function(x){ return x&&x.nombre; }).sort(function(a,b){ return (spProm(b)-spProm(a))||((b.apertura_total||0)-(a.apertura_total||0)); }); }
  function spAdLock(on){ ['sp','ad'].forEach(function(k){ document.getElementById(k+'-locked').hidden=!on; document.getElementById(k+'-body').hidden=!!on; }); }
  function spPriv(){ var t={conectando:'Conectando tu espacio privado…',
      sync:'<b>Privado, solo tuyo.</b> Cloty lo actualiza cuando llega el análisis de cantina de cada mes. Compartir un informe con una marca es decisión tuya.',
      local:'<b>Sin conexión a tu espacio privado.</b> Los informes solo se ven desde tu cuenta.',
      error:'<b>No se pudo guardar.</b> Recargá para reintentar.', ajeno:'<b>Sección privada del titular.</b>'}[spMode];
    document.getElementById('sp-priv').innerHTML=t||''; }
  function spChart(x){ var fs=(x.fechas||[]).slice(); if(!fs.length) return null;
    var W=700,H=200,L=44,R=12,T=14,B=34, ap=fs.filter(function(f){ return f.fecha<'2026-07'; }), cl=fs.filter(function(f){ return f.fecha>='2026-07'; });
    var n=fs.length, gap=cl.length&&ap.length?18:0, bw=(W-L-R-gap)/n;
    var mx=Math.max.apply(null,fs.map(function(f){ return f.unidades||0; }))||1, step=Math.pow(10,Math.floor(Math.log10(mx))), nice=Math.ceil(mx/step)*step;
    if(nice/step<4){ step=step/2; } var sy=function(v){ return T+(H-T-B)*(1-v/nice); };
    var o='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Unidades por fecha de '+esc(x.nombre)+'">';
    for(var v=0; v<=nice+0.001; v+=step){ o+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+sy(v).toFixed(1)+'" y2="'+sy(v).toFixed(1)+'"/><text x="'+(L-6)+'" y="'+(sy(v)+3).toFixed(1)+'" text-anchor="end">'+nf(v)+'</text>'; }
    function xAt(i){ return L+i*bw+(i>=ap.length?gap:0); }
    fs.forEach(function(f,i){ var x0=xAt(i)+bw*0.16, w=bw*0.68, y=sy(f.unidades||0);
      o+='<rect class="bar'+(i>=ap.length?' cl':'')+'" x="'+x0.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="'+Math.max(0,(H-B-y)).toFixed(1)+'" rx="2"><title>'+dm(f.fecha)+': '+nf(f.unidades)+' unidades</title></rect>';
      o+='<text x="'+(xAt(i)+bw/2).toFixed(1)+'" y="'+(H-B+14)+'" text-anchor="middle">'+dm(f.fecha)+'</text>'; });
    function avg(seg,i0,i1,val,lab){ if(!seg.length)return; var y=sy(val).toFixed(1); o+='<line class="avg" x1="'+xAt(i0).toFixed(1)+'" x2="'+(xAt(i1)+bw).toFixed(1)+'" y1="'+y+'" y2="'+y+'"/>'; }
    avg(ap,0,ap.length-1,x.apertura_prom); avg(cl,ap.length,n-1,x.clausura_prom);
    if(ap.length) o+='<text x="'+(xAt(0)).toFixed(1)+'" y="'+(H-4)+'">APERTURA 2026 · '+ap.length+' FECHAS</text>';
    if(cl.length) o+='<text x="'+(xAt(ap.length)).toFixed(1)+'" y="'+(H-4)+'">CLAUSURA · '+cl.length+'</text>';
    return o+'</svg>'; }
  function spArg(x){ var a=AUD||{}, v=x.clausura_prom&&x.apertura_prom?Math.round(100*(x.clausura_prom/x.apertura_prom-1)):null;
    var pre=x.estado==='prospecto'?'Hoy, sin acuerdo con la marca, el predio de Torneo Golden ya vendió ':'En el Apertura 2026, el predio de Torneo Golden vendió ';
    var t=pre+nf(x.apertura_total)+' unidades de '+x.nombre+' en '+x.apertura_fechas+' fechas: '+nf(x.apertura_prom)+' por fecha'+(x.share_label?', '+x.share_label:'')+'.';
    if(v!=null) t+=' En las primeras '+x.clausura_fechas+' fechas del Clausura el promedio '+(v>=0?'subió':'bajó')+' a '+nf(x.clausura_prom)+' por fecha ('+(v>=0?'+':'')+v+'%).';
    if(x.cada100) t+=' Por cada 100 personas que entran al predio se venden '+nf(x.cada100,0)+' unidades.';
    if(a.personas_distintas) t+=' Detrás hay una audiencia medida: '+nf(a.personas_distintas)+' personas distintas en '+a.fechas_medidas+' fechas, entre '+nf(a.por_fecha_min)+' y '+nf(a.por_fecha_max)+' por sábado, y a la sexta fecha el '+Math.round((a.recurrencia||0)*100)+'% de los que entraban ya había venido antes.';
    return t; }
  function spMaskBtn(){ var b=el('button','minibtn',spShow?'Ocultar montos':'Mostrar montos'); b.type='button'; b.addEventListener('click',function(){ spShow=!spShow; lset('oreja_spshow',spShow); renderSp(); }); return b; }
  function spContrato(x){ var c=x.contrato, w=el('div','spcont'+(spShow?'':' spmask'));
    var h=el('h3',null,'Contrato'); h.appendChild(el('span','k','interno · no va en el argumento')); h.appendChild(spMaskBtn()); w.appendChild(h);
    var n=c.duracion||1, sc=el('div','tscroll'), t='<table class="sptab"><thead><tr><th>Forma</th><th>Concepto</th>';
    for(var i=1;i<=3;i++) t+='<th class="r">Año '+i+'</th>'; t+='</tr></thead><tbody>';
    (c.lineas||[]).forEach(function(l){ t+='<tr><td>'+esc(l.forma)+'</td><td>'+esc(l.concepto)+'</td>'; for(var i=0;i<3;i++){ var v=l.anios[i]; t+='<td class="r pnum">'+(v==null?'':esc(spMoney(v)))+'</td>'; } t+='</tr>'; });
    t+='</tbody><tfoot><tr><td colspan="2">Total</td>'; for(var j=0;j<3;j++){ var y=c.anios[j]; t+='<td class="r pnum">'+(j<n?esc(spMoney(y)):'n/a')+'</td>'; } t+='</tr></tfoot></table>';
    sc.innerHTML=t; w.appendChild(sc);
    var m=el('div','spmeta'), pf=c.prom_anual/34;
    m.innerHTML='<span>Duración <b>'+n+' año'+(n>1?'s':'')+'</b></span><span>Total <b class="pnum">'+spMoney(c.total)+'</b></span><span>Promedio anual <b class="pnum">'+spMoney(c.prom_anual)+'</b></span><span>Peso en el portfolio <b>'+Math.round(c.share*100)+'%</b></span>'+
      '<span>Aporte por fecha ≈ <b class="pnum">'+spMoney(pf)+'</b></span>'+(x.apertura_prom?'<span>Por unidad vendida ≈ <b class="pnum">'+spMoney(pf/x.apertura_prom)+'</b></span>':'');
    w.appendChild(m);
    w.appendChild(el('p','spfoot','Aporte por fecha = promedio anual ÷ 34 fechas (2 temporadas de 17). Por unidad = aporte por fecha ÷ unidades vendidas por fecha en el Apertura. Son órdenes de magnitud para negociar, no contabilidad. Fuente: Acuerdos comerciales a firmar — Golden (planilla), montos en pesos sin ajuste por inflación.'+(c.nota?' '+c.nota:'')));
    return w; }
  function renderPort(all){ var box=document.getElementById('sp-port'), con=all.filter(function(x){ return x.contrato; });
    box.hidden=!con.length; if(!con.length) return; box.className='card'+(spShow?'':' spmask'); box.innerHTML='';
    var h=el('h3',null,'Portfolio de sponsors'); h.appendChild(el('span','k','contratos · montos internos')); var mb=spMaskBtn(); mb.style.marginLeft='12px'; h.appendChild(mb); box.appendChild(h);
    var tot=0; con.forEach(function(x){ tot+=x.contrato.prom_anual||0; });
    var t='<table class="sptab"><thead><tr><th>Marca</th><th class="r">Años</th><th class="r">Promedio anual</th><th class="r">Peso</th><th class="r">Cantina</th><th>Estado</th></tr></thead><tbody>';
    con.forEach(function(x){ var v=x.clausura_prom&&x.apertura_prom?Math.round(100*(x.clausura_prom/x.apertura_prom-1)):null; var e=SPEST.filter(function(o){ return o[0]===(x.estado||'sin'); })[0];
      t+='<tr class="'+(x.id===spSel?'sel':'')+'" data-id="'+esc(x.id)+'" style="cursor:pointer"><td class="nm">'+esc(x.nombre)+'</td><td class="r">'+(x.contrato.duracion||1)+'</td><td class="r pnum">'+spMoney(x.contrato.prom_anual)+'</td><td class="r">'+Math.round(100*(x.contrato.prom_anual||0)/tot)+'%</td><td class="r">'+(v==null?'<span style="color:var(--muted)">no vende</span>':'<span style="color:var(--'+(v>=0?'ok':'crit')+')">'+(v>=0?'+':'')+v+'%</span>')+'</td><td>'+esc(e?e[1]:'')+'</td></tr>'; });
    t+='</tbody><tfoot><tr><td>Total</td><td></td><td class="r pnum">'+spMoney(tot)+'</td><td class="r">100%</td><td></td><td></td></tr></tfoot></table>';
    var sc=el('div','tscroll'); sc.innerHTML=t; box.appendChild(sc);
    sc.querySelectorAll('tr[data-id]').forEach(function(r){ r.addEventListener('click',function(){ spSel=r.getAttribute('data-id'); renderSp(); }); });
    var big=con[0], sh=big?Math.round(100*big.contrato.prom_anual/tot):0;
    box.appendChild(el('p','spfoot','Promedio anual = total del contrato ÷ años de duración; es la única columna comparable entre marcas. '+(big?big.nombre+' concentra el '+sh+'% del promedio anual del portfolio.':'')+' "Cantina" compara unidades por fecha del Clausura contra el Apertura.')); }
  function renderSp(){ spPriv(); var all=spAll(), tabs=document.getElementById('sp-tabs'), card=document.getElementById('sp-card'), aud=document.getElementById('sp-aud');
    var tp=document.getElementById('tp-spon'), k=document.getElementById('sp-k');
    if(spMode==='ajeno'){ if(tp){tp.textContent='privado';tp.className='tp';} return; }
    if(!all.length){ tabs.innerHTML=''; card.innerHTML='<p class="hint">Todavía no hay informes cargados. Los carga Cloty con el análisis de cantina.</p>'; aud.hidden=true; if(tp){tp.textContent='sin informes';tp.className='tp';} if(k)k.textContent=''; return; }
    if(!spSel||!SP[spSel]) spSel=all[0].id;
    if(tp){ var up=all.filter(function(x){ return x.clausura_prom>x.apertura_prom; }).length; tp.textContent=all.length+' marcas · '+up+' en suba'; tp.className='tp ok'; }
    if(k) k.textContent=all.length+' marcas medidas';
    tabs.innerHTML=''; all.forEach(function(x){ var b=el('button','ptab'+(x.id===spSel?' on':''),x.nombre); b.type='button'; b.addEventListener('click',function(){ spSel=x.id; renderSp(); }); tabs.appendChild(b); });
    renderPort(all);
    var x=SP[spSel]; card.innerHTML='';
    var h=el('div','sphead'); h.appendChild(el('h3',null,x.nombre));
    var sel=el('select','spest'); sel.id='sp-est'; sel.setAttribute('aria-label','Estado de la relación');
    SPEST.forEach(function(o){ var op=el('option',null,o[1]); op.value=o[0]; if((x.estado||'sin')===o[0])op.selected=true; sel.appendChild(op); });
    sel.addEventListener('change',function(){ x.estado=sel.value; x.act=nowIso(); if(spCol){ spCol.doc(x.id).set(JSON.parse(JSON.stringify(x)))['catch'](function(){ spMode='error'; spPriv(); }); } renderSp(); });
    h.appendChild(sel); h.appendChild(el('div','grp',x.grupo||'')); card.appendChild(h);
    var v=x.clausura_prom&&x.apertura_prom?Math.round(100*(x.clausura_prom/x.apertura_prom-1)):null;
    var nums=el('div','spnums');
    function tile(l,val,sub,html){ var d=el('div','spn'); d.appendChild(el('div','l',l)); var vv=el('div','v tnum'); if(html)vv.innerHTML=val; else vv.textContent=val; d.appendChild(vv); if(sub)d.appendChild(el('div','s',sub)); nums.appendChild(d); }
    var hasF=!!(x.fechas&&x.fechas.length);
    if(hasF){
    tile('Apertura 2026',nf(x.apertura_total),'unidades en '+x.apertura_fechas+' fechas');
    tile('Por fecha',nf(x.apertura_prom),'promedio del Apertura');
    tile('Clausura vs Apertura',v==null?'—':'<span class="'+(v>=0?'up':'dn')+'">'+(v>=0?'+':'')+v+'%</span>',v==null?'sin datos':nf(x.clausura_prom)+' por fecha en '+x.clausura_fechas+' fechas',true);
    tile('Cada 100 personas',nf(x.cada100,1),'unidades por 100 que entran');
    } else (x.kpis||[]).forEach(function(q){ tile(q.l,q.v,q.s); });
    card.appendChild(nums);
    if(hasF){ var ch=el('div','spchart'); ch.innerHTML=spChart(x)||''; card.appendChild(ch);
    var lg=el('div','splegend'); lg.innerHTML='<span><i style="background:var(--golden)"></i>Apertura</span><span><i style="background:var(--europa)"></i>Clausura</span><span>- - - promedio del tramo</span>'+(x.pico?'<span>Pico '+dm(x.pico.fecha)+' · piso '+dm(x.piso.fecha)+'</span>':''); card.appendChild(lg); }
    card.appendChild(el('h3',null,'El argumento, listo para usar')).style.marginTop='16px';
    var arg=el('div','sparg'); arg.id='sp-arg'; arg.textContent=x.arg||spArg(x); card.appendChild(arg);
    var act=el('div','spact'), cp=el('button','minibtn','Copiar argumento'); cp.type='button';
    var msg=el('span','fmsg','');
    cp.addEventListener('click',function(){ var t=x.arg||spArg(x); copyText(t).then(function(){ msg.textContent='Copiado'; },function(){ var r=document.createRange(); r.selectNodeContents(arg); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); msg.textContent='Seleccionado: copialo con Ctrl+C'; }); });
    var gb=el('button','minibtn',{prospecto:'Llevar a Gestión: abrir conversación',activo:'Llevar a Gestión: preparar renovación',firmar:'Llevar a Gestión: preparar renovación'}[x.estado]||'Llevar a Gestión: definir la relación'); gb.type='button';
    gb.addEventListener('click',function(){ var id='spon-'+x.id+'-'+Date.now().toString(36), pros=x.estado==='prospecto';
      var it={id:id,t:(pros?'Abrir conversación con '+x.nombre:((x.estado==='activo'||x.estado==='firmar')?'Preparar renovación de '+x.nombre:'Definir la relación con '+x.nombre+': ¿sponsor o prospecto?'))+' · con datos de Golden',d:x.arg||spArg(x),frente:'golden',sev:'warn',est:'nuevo',fecha:'',quien:'Lucho',
        prox:pros?'Definir interlocutor y mandar el argumento CEO a CEO':'Agendar la reunión de renovación y llevar el informe',origen:{tipo:'manual',de:'Informe de sponsors'},creado:nowIso(),reprog:0,hist:[]};
      gHist(it,'Creado desde el informe de sponsors','lucho'); gSave(it); renderGest(); msg.textContent='En Gestión'; });
    act.appendChild(cp); act.appendChild(gb); act.appendChild(msg); card.appendChild(act);
    var ft=el('p','spfoot'); ft.innerHTML='<b>Cómo se cuenta.</b> '+esc(x.metodo||'')+' <b>Fuente:</b> '+esc(x.fuente||'')+(x.act?' · actualizado '+dm(x.act):''); card.appendChild(ft);
    if(x.contrato) card.appendChild(spContrato(x));
    var a=AUD; aud.hidden=!a; if(a){ aud.innerHTML=''; aud.appendChild(el('h3',null,'La audiencia que compran'));
      var g=el('div','audgrid');
      [[nf(a.personas_distintas),'personas distintas en '+a.fechas_medidas+' fechas'],[nf(a.por_fecha_min)+'–'+nf(a.por_fecha_max),'personas por sábado'],[Math.round((a.recurrencia||0)*100)+'%','ya había venido, a la 6ª fecha'],[nf(a.nucleo),'fueron a las 6 fechas'],[Math.round((a.mujeres||0)*100)+'%','mujeres · edad mediana '+a.edad_mediana],[a.alcance_por_jugador||'—','personas distintas por jugador en la temporada']].forEach(function(r){ var d=el('div','spn'); var vv=el('div','v tnum',r[0]); d.appendChild(vv); d.appendChild(el('div','s',r[1])); g.appendChild(d); });
      aud.appendChild(g); aud.appendChild(el('p','spfoot',a.fuente||'')); } }
  function spAttach(DBx,uid){ try{ spCol=DBx.doc('data/users/'+uid+'/sponsors').collection('items'); audRef=DBx.doc('data/users/'+uid+'/audiencia'); }catch(e){ spMode='local'; renderSp(); return; }
    spCol.onSnapshot(function(qs){ spMode='sync'; var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x&&typeof x==='object'){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); SP=m;
      var c=document.getElementById('sp-card'); if(c.contains(document.activeElement)&&document.activeElement.tagName==='SELECT')return; renderSp(); },function(){ spMode='error'; renderSp(); });
    audRef.onSnapshot(function(sn){ AUD=(sn&&sn.exists)?JSON.parse(JSON.stringify(sn.data()||{})):null; renderSp(); },function(){}); }
  renderSp();

