  // ---------- INVERSIONES (privado) ----------
  var ITIPOS=[['dolares','Dólares'],['pesos','Pesos que rinden'],['mercado','Mercado'],['cripto','Cripto'],['otro','Otro']];
  var ILIQ=[['inmediata','Inmediata'],['7d','Hasta 7 días'],['30d','Hasta 30 días'],['mas','Más de 30 días'],['iliquida','Ilíquida']];
  var INV={pos:[],tc:null,tcFecha:''}, invRef=null, invCurJ=null, invTimer=null, invMode='conectando', IOPS={}, iopsCol=null;
  function invNorm(o){ var v={pos:[],tc:null,tcFecha:''}; if(o&&typeof o==='object'){ if(Array.isArray(o.pos))v.pos=o.pos; if(o.tc!=null)v.tc=Number(o.tc)||null; if(o.tcFecha)v.tcFecha=String(o.tcFecha); } return v; }
  function saveInv(){ if(invRef){ clearTimeout(invTimer); invTimer=setTimeout(function(){ try{ var j=JSON.stringify(INV); invCurJ=j; invRef.set(JSON.parse(j))['catch'](function(){ invMode='error'; renderInv(); }); }catch(e){} },400); } }
  function selOf(opts,val,cls){ var s=el('select',cls||null); opts.forEach(function(o){ var op=el('option',null,o[1]); op.value=o[0]; if(o[0]===val)op.selected=true; s.appendChild(op); }); return s; }
  function usdOf(p){ var v=Number(p.valor)||0; if(p.moneda==='USD')return v; return INV.tc?v/INV.tc:null; }
  function arsOf(p){ var v=Number(p.valor)||0; if(p.moneda==='ARS')return v; return INV.tc?v*INV.tc:null; }
  function usdFmt(n){ return 'US$'+fmt.format(Math.round(n||0)); }
  function renderInv(){ var pv={conectando:'Conectando tu espacio privado…',sync:'<b>Privado, solo tuyo.</b> Vive en tu carpeta personal de Oreja. Sin conexión a brokers: los valores los cargás vos; las operaciones que lleguen por mail las propone Cloty.',local:'<b>Solo en este dispositivo.</b> No se pudo abrir tu espacio privado.',error:'<b>No se pudo guardar.</b> Recargá para reintentar.',ajeno:'<b>Sección privada del titular.</b>'}[invMode];
    document.getElementById('inv-priv').innerHTML=pv||'';
    var body=document.getElementById('inv-body-rows'); body.innerHTML='';
    INV.pos.forEach(function(p,i){ var tr=el('tr','linerow');
      var c1=el('td'); var nm=el('input','txtin'); nm.value=p.inst||''; nm.placeholder='ej.: MEP en IOL'; nm.addEventListener('blur',function(){ INV.pos[i].inst=nm.value.trim(); saveInv(); renderInv(); }); c1.appendChild(nm);
      var c2=el('td'); var ti=selOf(ITIPOS,p.tipo||'otro'); ti.addEventListener('change',function(){ INV.pos[i].tipo=ti.value; if(ti.value==='dolares')INV.pos[i].moneda='USD'; if(ti.value==='pesos')INV.pos[i].moneda='ARS'; saveInv(); renderInv(); }); c2.appendChild(ti);
      var c3=el('td'); var mo=selOf([['ARS','Pesos'],['USD','Dólares']],p.moneda||'ARS'); mo.addEventListener('change',function(){ INV.pos[i].moneda=mo.value; saveInv(); renderInv(); }); c3.appendChild(mo);
      var c4=el('td','r'); c4.appendChild(amtInput(p.valor,function(v){ INV.pos[i].valor=v||0; INV.pos[i].act=todayKey(); saveInv(); renderInv(); }));
      var c5=el('td','r'); var tn=el('input','amt tnum tna'); tn.inputMode='decimal'; tn.value=p.tna!=null?dec(p.tna):''; tn.placeholder=p.tipo==='pesos'?'TNA':'—';
      tn.addEventListener('blur',function(){ var v=parseDec(tn.value); if(v==null)delete INV.pos[i].tna; else INV.pos[i].tna=v; saveInv(); renderInv(); }); c5.appendChild(tn);
      var c6=el('td'); var lq=selOf(ILIQ,p.liq||'inmediata'); lq.addEventListener('change',function(){ INV.pos[i].liq=lq.value; saveInv(); renderInv(); }); c6.appendChild(lq);
      var c7=el('td'); var dn=el('input','txtin'); dn.value=p.donde||''; dn.placeholder='broker / banco'; dn.style.maxWidth='130px'; dn.addEventListener('blur',function(){ INV.pos[i].donde=dn.value.trim(); saveInv(); }); c7.appendChild(dn);
      var c8=el('td','r'); c8.appendChild(delBtn(function(){ INV.pos.splice(i,1); saveInv(); renderInv(); }));
      [c1,c2,c3,c4,c5,c6,c7,c8].forEach(function(c){ tr.appendChild(c); }); body.appendChild(tr); });
    if(!INV.pos.length){ var tr0=el('tr'); var td0=el('td'); td0.colSpan=8; td0.appendChild(el('p','hint','Todavía no hay posiciones. Sumá una por instrumento: dólares, plazo fijo o money market, lo del broker, cripto.')); tr0.appendChild(td0); body.appendChild(tr0); }
    setT('inv-count',INV.pos.length?INV.pos.length+' posiciones':'');
    var tcI=document.getElementById('inv-tc'), tfI=document.getElementById('inv-tcf');
    if(document.activeElement!==tcI)tcI.value=INV.tc?fmt.format(INV.tc):''; if(document.activeElement!==tfI)tfI.value=INV.tcFecha||'';
    setT('inv-tcinfo',INV.tc?('MEP $'+fmt.format(INV.tc)+(INV.tcFecha?' al '+dm(INV.tcFecha):'')):'sin tipo de cambio');
    var totU=0, totA=0, usdPart=0, liq7=0, okTc=!!INV.tc, max=null;
    INV.pos.forEach(function(p){ var a=arsOf(p), u=usdOf(p); if(a!=null)totA+=a; if(u!=null)totU+=u; if(p.moneda==='USD'&&a!=null)usdPart+=a; if((p.liq==='inmediata'||p.liq==='7d'||!p.liq)&&a!=null)liq7+=a; if(a!=null&&(!max||a>max.a))max={p:p,a:a}; });
    var hasUsd=INV.pos.some(function(p){ return p.moneda==='USD'; }), hasArs=INV.pos.some(function(p){ return p.moneda==='ARS'; });
    var need=hasUsd&&hasArs&&!okTc;
    setT('iv-usd',need||!INV.pos.length?'—':usdFmt(totU)); setT('iv-usd-s',need?'cargá el dólar MEP para consolidar':'');
    setT('iv-ars',need||!INV.pos.length?'—':money(totA)); setT('iv-ars-s',INV.pos.length?INV.pos.length+' posiciones':'');
    setT('iv-dol',need||!totA?'—':pct(usdPart/totA)); setT('iv-dol-s',need||!totA?'':'en dólares o activos en USD');
    setT('iv-liq',need||!totA?'—':pct(liq7/totA)); setT('iv-liq-s',need||!totA?'':money(liq7)+' en 7 días o menos');
    // operaciones
    var ops=Object.keys(IOPS).map(function(k){ return IOPS[k]; }).filter(function(o){ return o&&o.fecha&&o.estado!=='descartado'; }).sort(function(a,b){ return a.fecha<b.fecha?1:-1; });
    var ob=document.getElementById('inv-ops'); ob.innerHTML=''; var pend=0;
    if(!ops.length) ob.appendChild(el('p','hint','Sin operaciones detectadas todavía.'));
    ops.slice(0,30).forEach(function(o){ var prop=o.estado!=='confirmado'; if(prop)pend++; var r=el('div','mvrow'+(prop?' prop':''));
      r.appendChild(el('span','mf',dm(o.fecha))); var d=el('span','md',(o.op?o.op+' · ':'')+(o.inst||o.desc||'')); d.appendChild(el('small',null,'✉ '+((o.origen&&o.origen.de)||'mail'))); r.appendChild(d);
      r.appendChild(el('span','mm',(o.moneda==='USD'?usdFmt(o.monto):money(o.monto))));
      var c=el('span','mc'); c.appendChild(el('span','mvchip'+(prop?'':' ok'),prop?'por confirmar':'confirmada'));
      var u=safeUrl(o.origen&&o.origen.url); if(u){ var a=el('a',null,'mail ↗'); a.href=u; a.target='_blank'; a.rel='noopener'; a.style.fontSize='12px'; c.appendChild(a); }
      if(prop){ var ok=el('button','mvbtn ok','✓ Confirmar'); ok.type='button'; ok.addEventListener('click',function(){ o.estado='confirmado'; ioSave(o); renderInv(); }); c.appendChild(ok); }
      var no=el('button','mvbtn','Descartar'); no.type='button'; no.addEventListener('click',function(){ o.estado='descartado'; ioSave(o); renderInv(); }); c.appendChild(no);
      r.appendChild(c); ob.appendChild(r); });
    setT('inv-ops-k',pend?pend+' por confirmar':'');
    // lecturas
    var ul=document.getElementById('inv-obs'); ul.innerHTML='';
    function li(chip,cls,txt){ var l=el('li'); l.appendChild(el('span','chip '+cls,chip)); l.appendChild(el('div',null,txt)); ul.appendChild(l); }
    if(!INV.pos.length){ li('Vacío','flag','Sin posiciones cargadas no hay lectura posible. Con los valores de hoy, en la próxima vista te digo qué rinde contra la inflación, cuánto estás dolarizado y qué tan líquido estás.'); }
    else {
      if(need) li('Falta dato','watch','Tenés posiciones en pesos y en dólares: sin el dólar MEP de referencia no se puede sumar la cartera ni medir la dolarización.');
      var infl=F.metas&&F.metas.infl;
      INV.pos.filter(function(p){ return p.moneda==='ARS'&&p.tna!=null; }).forEach(function(p){ var tem=p.tna/12/100;
        if(infl==null){ li('Sin inflación','flag',(p.inst||'Posición en pesos')+': TNA '+dec(p.tna)+'% = '+dec(Math.round(tem*1000)/10)+'% mensual. Para saber si le gana a la inflación, cargá la inflación mensual supuesta en Finanzas.'); return; }
        var real=(1+tem)/(1+infl/100)-1; var pp=Math.round(real*1000)/10;
        li(real>=0?'Rinde':'Pierde',real>=0?'note':'watch',(p.inst||'Posición en pesos')+': '+dec(Math.round(tem*1000)/10)+'% mensual contra '+dec(infl)+'% de inflación supuesta: '+(real>=0?'le gana por ':'pierde ')+dec(Math.abs(pp))+' puntos por mes en términos reales.'); });
      INV.pos.filter(function(p){ return p.moneda==='ARS'&&p.tna==null&&p.tipo==='pesos'; }).forEach(function(p){ li('Sin tasa','flag',(p.inst||'Posición en pesos')+': sin TNA cargada no puedo medir si le gana a la inflación.'); });
      if(!need&&max&&totA&&max.a/totA>0.5) li('Concentración','flag',(max.p.inst||'Una posición')+' es el '+pct(max.a/totA)+' de la cartera. Si ese instrumento o esa plataforma tiene un problema, se lleva más de la mitad.');
      if(!need&&totA){ var eg=egrTot(); if(eg){ var m=liq7/eg; li('Liquidez','note','Lo que podés sacar en 7 días o menos cubre '+dec(Math.round(m*10)/10)+' meses de tus egresos presupuestados. Es la parte de la cartera que funciona como colchón.'); } }
      var stale=INV.pos.filter(function(p){ return !p.act||dayDiff(p.act,todayKey())>35; }).length; if(stale) li('Valores viejos','watch',stale+' posición'+(stale>1?'es':'')+' sin actualizar hace más de un mes: la foto de arriba no es la de hoy.');
      if(!need&&totA){ var dl=usdPart/totA; li('Moneda','note','Tenés el '+pct(dl)+' en dólares y el '+pct(1-dl)+' en pesos. Tus gastos son en pesos y buena parte del ingreso de Golden también: la proporción es una decisión tuya, esta es solo la foto.'); }
    }
    var t=document.getElementById('tp-inv'); if(t){ t.textContent=invMode==='ajeno'?'privado':(INV.pos.length?(need?'falta el dólar MEP':((hasUsd&&!hasArs)?usdFmt(totU):money(totA))):'sin cargar'); t.className='tp'+(pend?' warn':''); if(pend)t.textContent+=' · '+pend+' op. por confirmar'; } }
  function ioSave(o){ o.act=nowIso(); IOPS[o.id]=o; if(iopsCol){ iopsCol.doc(o.id).set(JSON.parse(JSON.stringify(o)))['catch'](function(){}); } }
  document.getElementById('inv-add').addEventListener('click',function(){ INV.pos.push({id:'i'+Date.now().toString(36),inst:'',tipo:'dolares',moneda:'USD',valor:0,liq:'inmediata',donde:'',act:todayKey()}); saveInv(); renderInv(); });
  document.getElementById('inv-tc').addEventListener('blur',function(e){ var v=parseDec(String(e.target.value).replace(/\./g,'')); INV.tc=v&&v>0?v:null; if(INV.tc&&!INV.tcFecha)INV.tcFecha=todayKey(); saveInv(); renderInv(); });
  stableInput(document.getElementById('inv-tcf'),function(){ return INV.tcFecha; },function(v){ INV.tcFecha=v; saveInv(); renderInv(); },okDate);
  function invAttach(DBx,uid){ try{ invRef=DBx.doc('data/users/'+uid+'/inversiones'); iopsCol=invRef.collection('ops'); }catch(e){ invMode='local'; renderInv(); return; }
    invRef.onSnapshot(function(s){ invMode='sync'; if(!s||!s.exists){ renderInv(); return; } var d=s.data()||{}, j=null; try{ j=JSON.stringify(d); }catch(e){}
      if(j!==null&&j===invCurJ){ renderInv(); return; } invCurJ=j; INV=invNorm(d); if(document.getElementById('inv-body').contains(document.activeElement))return; renderInv(); },function(){ invMode='error'; renderInv(); });
    iopsCol.onSnapshot(function(qs){ var m={}; qs.docs.forEach(function(d){ var x=d.data(); if(x){ x=JSON.parse(JSON.stringify(x)); x.id=x.id||d.id; m[d.id]=x; } }); IOPS=m; renderInv(); },function(){}); }
  function lockMore(on){ document.getElementById('rd-locked').hidden=!on; document.getElementById('rd-body').hidden=!!on; document.getElementById('inv-locked').hidden=!on; document.getElementById('inv-body').hidden=!!on; }
  renderRadar(); renderHoy(); renderInv(); renderFrentes();

