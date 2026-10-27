  // ---------- NEGOCIOS · PLAN CON NÚMEROS (plan2) ----------
  var P2ORIG={fuente:['Fuente','ok'],vos:['Dicho por vos','bs'],cloty:['Supuesto de Cloty','warn'],falta:['Falta','crit']};
  function p2num(v){ if(v==null||v==='')return null; var s=String(v).trim().replace(/\s/g,''); if(/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s=s.replace(/\./g,''); s=s.replace(',','.'); var n=Number(s); return (n==null||!isFinite(n))?null:n; }
  function p2fmt(n,mon){ if(n==null)return '—'; return (mon==='USD'?'US$':'$')+fmt.format(Math.round(n)); }
  function p2days(f){ return f?dayDiff(todayKey(),f):null; }
  function p2Skel(it){ return {decision:{fecha:'',que:''},tesis:'',antecedente:'',supuestos:[],moneda:'ARS',modelo:[],pedido:it.lado==='bs'?{moneda:'USD',fijo:'',pct:'',umbral:'',tope:'',base:'',nota:''}:null,riesgos:[],faltan:[],fuentes:[],creado:nowIso()}; }
  function p2Ing(p){ var tot=0, n=0, comp=0; (p.modelo||[]).forEach(function(l){ var q=p2num(l.cant), pr=p2num(l.precio), oc=l.ocup===''||l.ocup==null?100:p2num(l.ocup); n++; if(q!=null&&pr!=null&&oc!=null){ tot+=q*pr*oc/100; comp++; } }); return {tot:tot,n:n,comp:comp}; }
  function p2Mine(p,ing){ var d=p.pedido; if(!d)return null; var f=p2num(d.fijo), pc=p2num(d.pct), um=p2num(d.umbral)||0, tp=p2num(d.tope); if(f==null&&pc==null)return null;
    var v=(pc!=null&&ing!=null)?Math.max(0,ing-um)*pc/100:0; if(tp!=null)v=Math.min(v,tp); return {fijo:(f||0)*12,var:v,tot:(f||0)*12+v}; }
  function p2Input(val,ph,onset,cls){ var i=el('input',cls||'p2in'); i.type='text'; i.value=val==null?'':val; i.placeholder=ph||'';
    i.addEventListener('change',function(){ onset(i.value.trim()); }); return i; }
  function ngP2(it){ var p=it.plan2, w=el('div','p2'), save=function(){ ngSave(it); renderNg(); };
    // decisión
    var dd=p2days(p.decision.fecha), dc=el('div','p2dec'+(dd!=null&&dd<0?' venc':(dd!=null&&dd<=7?' prox':'')));
    var dl=el('div','p2dl'); dl.appendChild(el('span','eyebrow','Decisión'));
    dl.appendChild(el('b',null,p.decision.que||'Definí qué se decide'));
    dl.appendChild(el('span','gm',p.decision.fecha?(dd<0?'Venció hace '+(-dd)+' d':(dd===0?'Vence hoy':'Faltan '+dd+' d'))+' · '+dm(p.decision.fecha):'Sin fecha: una idea sin fecha de decisión no se cierra'));
    dc.appendChild(dl);
    var df=el('div','pofld'); var fi=el('input'); fi.type='date'; fi.value=p.decision.fecha||''; fi.addEventListener('change',function(){ p.decision.fecha=fi.value; save(); });
    var qi=el('input'); qi.type='text'; qi.value=p.decision.que||''; qi.placeholder='qué se decide, en una línea'; qi.addEventListener('change',function(){ p.decision.que=qi.value.trim(); save(); });
    df.appendChild(poLabel('Fecha de decisión',fi)); df.appendChild(poLabel('Qué se decide',qi)); dc.appendChild(df);
    if(p.decision.nota) dc.appendChild(el('p','hint',p.decision.nota));
    w.appendChild(dc);
    function sec(t,k){ var s=el('div','ngsec'); var h=el('h4',null,t); if(k)h.appendChild(el('span','k',' '+k)); s.appendChild(h); w.appendChild(s); return s; }
    // tesis
    var st=sec('Tesis'); var ta=el('textarea'); ta.value=p.tesis||''; ta.placeholder='Por qué esto existe y por qué vos'; ta.rows=Math.max(4,Math.ceil((p.tesis||'').length/85)+(p.tesis||'').split('\n').length); ta.addEventListener('change',function(){ p.tesis=ta.value; ngSave(it); }); st.appendChild(ta);
    if(p.antecedente){ var an=el('div','ngcaso'); an.appendChild(el('div','vf','Antecedente')); an.appendChild(el('div',null,p.antecedente)); st.appendChild(an); }
    // supuestos
    var ss=sec('Lo que sabemos','dato · origen'); var nf_=(p.supuestos||[]).filter(function(s){ return s.o==='falta'&&!s.v; }).length;
    if(nf_) ss.appendChild(el('p','hint',nf_+' dato'+(nf_>1?'s':'')+' sin completar. Cuando lo tengas, cargalo en la fila y pasa a "Dicho por vos".'));
    var tl=el('div','p2rows');
    (p.supuestos||[]).forEach(function(s,i){ var r=el('div','p2row'); var o=P2ORIG[s.o]||P2ORIG.cloty;
      var a=el('div','p2a'); a.appendChild(el('b',null,s.k)); if(s.nota)a.appendChild(el('span','gm',s.nota)); r.appendChild(a);
      var bv=el('div','p2b');
      if(s.o==='falta'&&!s.v){ bv.appendChild(p2Input('', 'completar', function(v){ if(!v)return; s.v=v; s.o='vos'; save(); },'p2in vacio')); }
      else bv.appendChild(el('span','p2v',s.v||'—'));
      var ch=el('span','p2o '+o[1],o[0]); bv.appendChild(ch);
      if(s.u&&safeUrl(s.u)){ var lk=el('a','p2lk','fuente ↗'); lk.href=s.u; lk.target='_blank'; lk.rel='noopener'; bv.appendChild(lk); } else if(s.f) bv.appendChild(el('span','gm',s.f));
      r.appendChild(bv); tl.appendChild(r); });
    ss.appendChild(tl);
    var sa=el('div','gfoot'), sab=el('button','gtask','+ Dato'); sab.type='button'; sab.addEventListener('click',function(){ ngAsk(sa,'El dato y su valor (ej.: Tarifa hockey Jockey = $X por hora)',function(v){ var x=v.split('='); (p.supuestos||(p.supuestos=[])).push({k:x[0].trim(),v:(x[1]||'').trim(),o:(x[1]||'').trim()?'vos':'falta'}); save(); }); }); sa.appendChild(sab); ss.appendChild(sa);
    // modelo
    var sm=sec('Números','unidades × precio × ocupación');
    var mon=selOf([['ARS','Pesos'],['USD','Dólares']],p.moneda||'ARS'); mon.addEventListener('change',function(){ p.moneda=mon.value; save(); });
    var mw=el('div','pofld'); mw.appendChild(poLabel('Moneda del modelo',mon)); sm.appendChild(mw);
    if(p.modeloNota) sm.appendChild(el('p','hint',p.modeloNota));
    var sc=el('div','tscroll'), tb=el('table','sptab p2tab'); var th=el('tr'); ['Línea','Unidad','Cantidad / año','Precio por unidad','Ocupación %','Ingreso anual'].forEach(function(h,j){ th.appendChild(el('th',j>=2?'r':null,h)); }); var thd=el('thead'); thd.appendChild(th); tb.appendChild(thd);
    var tbd=el('tbody'); var ing=p2Ing(p);
    (p.modelo||[]).forEach(function(l){ var tr=el('tr'); var c1=el('td'); c1.appendChild(el('b',null,l.linea)); if(l.nota)c1.appendChild(el('span','gm',l.nota)); tr.appendChild(c1); tr.appendChild(el('td',null,l.unidad||''));
      [['cant','cantidad'],['precio','precio'],['ocup','100']].forEach(function(f){ var td=el('td','r'); td.appendChild(p2Input(l[f[0]],f[1],function(v){ l[f[0]]=v; save(); },'p2in num'+((l[f[0]]==null||l[f[0]]==='')&&f[0]!=='ocup'?' vacio':''))); tr.appendChild(td); });
      var q=p2num(l.cant), pr=p2num(l.precio), oc=(l.ocup===''||l.ocup==null)?100:p2num(l.ocup); tr.appendChild(el('td','r tnum',(q!=null&&pr!=null&&oc!=null)?p2fmt(q*pr*oc/100,p.moneda):'—')); tbd.appendChild(tr); });
    tb.appendChild(tbd); var tf=el('tfoot'), tr2=el('tr'); var t1=el('td','','Total'); t1.colSpan=5; tr2.appendChild(t1); tr2.appendChild(el('td','r tnum',ing.comp?p2fmt(ing.tot,p.moneda):'—')); tf.appendChild(tr2); tb.appendChild(tf); sc.appendChild(tb); sm.appendChild(sc);
    sm.appendChild(el('p','hint',ing.n?(ing.comp+' de '+ing.n+' líneas con números. '+(ing.comp<ing.n?'El total solo suma las líneas completas: no lo presentes hasta tenerlas todas.':'')+' Ocupación vacía = 100%.'):'Sin líneas todavía.'));
    var ma=el('div','gfoot'), mab=el('button','gtask','+ Línea'); mab.type='button'; mab.addEventListener('click',function(){ ngAsk(ma,'Línea de ingreso y unidad (ej.: Alquiler cancha sintética / hora)',function(v){ var x=v.split('/'); (p.modelo||(p.modelo=[])).push({linea:x[0].trim(),unidad:(x[1]||'').trim(),cant:'',precio:'',ocup:''}); save(); }); }); ma.appendChild(mab); sm.appendChild(ma);
    // pedido
    if(p.pedido){ var d=p.pedido, sp=sec('Tu pedido','fijo + variable · por escrito');
      var pg=el('div','pofld'), mo2=selOf([['USD','Dólares'],['ARS','Pesos con ajuste']],d.moneda||'USD'); mo2.addEventListener('change',function(){ d.moneda=mo2.value; save(); });
      pg.appendChild(poLabel('Moneda del honorario',mo2));
      pg.appendChild(poLabel('Fijo por mes',p2Input(d.fijo,'monto',function(v){ d.fijo=v; save(); },'p2in'+(d.fijo?'':' vacio'))));
      pg.appendChild(poLabel('Variable %',p2Input(d.pct,'%',function(v){ d.pct=v; save(); },'p2in'+(d.pct?'':' vacio'))));
      pg.appendChild(poLabel('Desde (umbral anual, en moneda del modelo)',p2Input(d.umbral,'0 = desde el primer peso',function(v){ d.umbral=v; save(); })));
      pg.appendChild(poLabel('Tope anual del variable (opcional)',p2Input(d.tope,'sin tope',function(v){ d.tope=v; save(); })));
      var bi=el('input'); bi.type='text'; bi.value=d.base||''; bi.placeholder='sobre qué se calcula el variable'; bi.addEventListener('change',function(){ d.base=bi.value.trim(); save(); });
      var bl=poLabel('Base del variable',bi); bl.classList.add('full'); pg.appendChild(bl); sp.appendChild(pg);
      var mine=p2Mine(p,ing.comp?ing.tot:null), box=el('div','spnums');
      function tl2(l,v,s){ var x=el('div','spn'); x.appendChild(el('div','l',l)); x.appendChild(el('div','v tnum',v)); if(s)x.appendChild(el('div','s',s)); box.appendChild(x); }
      var same=(d.moneda||'USD')===(p.moneda||'ARS');
      tl2('Fijo anual',mine?p2fmt(mine.fijo,d.moneda):'—','12 meses');
      tl2('Variable',mine&&ing.comp&&same?p2fmt(mine.var,d.moneda):'—',!same?'el modelo está en otra moneda':(ing.comp?'sobre el total del modelo':'faltan los números'));
      tl2('Tu ingreso anual',mine&&same?p2fmt(mine.tot,d.moneda):(mine?p2fmt(mine.fijo,d.moneda)+' + variable':'—'),'estimado, antes de impuestos');
      sp.appendChild(box);
      if(d.nota) sp.appendChild(el('p','hint',d.nota));
      if(d.bench&&d.bench.length){ var bw=el('div','ngcaso'); bw.appendChild(el('div','vf','Cómo se paga a un operador de predios · referencias verificadas'));
        d.bench.forEach(function(x){ var r=el('div','p2bn'); r.appendChild(el('b',null,x.n)); r.appendChild(document.createTextNode(' '+x.t+' ')); if(safeUrl(x.u)){ var a=el('a','p2lk','fuente ↗'); a.href=x.u; a.target='_blank'; a.rel='noopener'; r.appendChild(a); } bw.appendChild(r); });
        if(d.lectura) bw.appendChild(el('p','gm',d.lectura)); sp.appendChild(bw); } }
    // riesgos
    if((p.riesgos||[]).length){ var sr=sec('Riesgos','y respuesta'); var rl=el('div','p2rows');
      p.riesgos.forEach(function(x){ var r=el('div','p2row'); var a=el('div','p2a'); a.appendChild(el('b',null,x.r)); r.appendChild(a); r.appendChild(el('div','p2b p2txt',x.m||'')); rl.appendChild(r); }); sr.appendChild(rl); }
    // faltan
    var sf=sec('Qué falta para presentarlo','dato · quién · qué desbloquea'); var fl=el('div','p2rows'), pend=0;
    (p.faltan||[]).forEach(function(x){ if(x.gid&&G2[x.gid]&&(G2[x.gid].est==='hecho')&&!x.ok){ x.ok=true; } if(!x.ok)pend++; var r=el('div','p2row'+(x.ok?' ok':'')); var cb=el('input'); cb.type='checkbox'; cb.checked=!!x.ok; cb.setAttribute('aria-label','Hecho: '+x.d); cb.addEventListener('change',function(){ x.ok=cb.checked; save(); });
      var a=el('label','p2a p2chk'); a.appendChild(cb); var tx=el('span'); tx.appendChild(el('b',null,x.d)); tx.appendChild(el('span','gm',(x.q?'Quién: '+x.q:'')+(x.u?' · Desbloquea: '+x.u:''))); a.appendChild(tx); r.appendChild(a); fl.appendChild(r); });
    sf.appendChild(fl); var fa=el('div','gfoot');
    var sinG=(p.faltan||[]).filter(function(x){ return !x.ok&&!x.gid; });
    if(sinG.length){ var fg=el('button','gtask','→ Pasar '+sinG.length+' pendiente'+(sinG.length>1?'s':'')+' a Gestión'); fg.type='button'; fg.addEventListener('click',function(){ var fr=it.lado==='bs'?'bs':(it.lado==='golden'?'golden':'otro');
      sinG.forEach(function(x,j){ var gid='ngf-'+it.id+'-'+Date.now().toString(36)+j; var g={id:gid,t:x.d+' · '+it.t,d:'Dato pendiente del plan "'+it.t+'" en Negocios.'+(x.u?'\nDesbloquea: '+x.u:''),frente:fr,sev:'warn',origen:{tipo:'manual',de:'Negocios'},quien:x.q||'',fecha:p.decision.fecha||'',prox:'Conseguir el dato: '+x.d,est:'nuevo',hist:[],creado:nowIso(),reprog:0};
        gHist(g,'Creado desde el plan de Negocios'); gSave(g); x.gid=gid; }); renderGest(); save(); }); fa.appendChild(fg); }
    else if((p.faltan||[]).some(function(x){ return x.gid&&!x.ok; })) fa.appendChild(el('span','hint','Los pendientes están en Gestión: al cerrarlos ahí, se tachan acá.'));
    var fab=el('button','gtask','+ Falta'); fab.type='button'; fab.addEventListener('click',function(){ ngAsk(fa,'Qué falta / quién (ej.: Costo operativo / Producción BS)',function(v){ var x=v.split('/'); (p.faltan||(p.faltan=[])).push({d:x[0].trim(),q:(x[1]||'').trim(),u:''}); save(); }); }); fa.appendChild(fab); sf.appendChild(fa);
    if(p.handoff) sf.appendChild(el('p','hint',p.handoff));
    // fuentes
    if((p.fuentes||[]).length){ var so=sec('Fuentes'); var ul=el('ul','p2src'); p.fuentes.forEach(function(x){ var li=el('li'); var u=safeUrl(x.u); if(u){ var a=el('a',null,x.t); a.href=u; a.target='_blank'; a.rel='noopener'; li.appendChild(a); } else li.textContent=x.t; ul.appendChild(li); }); so.appendChild(ul); }
    // acciones
    var cf=el('div','gfoot'), msg=el('span','fmsg','');
    var cp=el('button','gtask','Copiar plan'); cp.type='button'; cp.addEventListener('click',function(){ copyText(p2Text(it)).then(function(){ msg.textContent='Copiado'; },function(){ msg.textContent='No se pudo copiar'; }); }); cf.appendChild(cp);
    var gg=el('button','gtask',it.gestionId?'En Gestión ✓':'→ Decisión a Gestión'); gg.type='button'; gg.addEventListener('click',function(){ if(it.gestionId)return; var id='ng'+Date.now().toString(36);
      var g={id:id,t:'Decidir: '+(p.decision.que||it.t),d:'Plan en Oreja › Negocios: '+it.t+'\nFaltan '+pend+' datos.',frente:it.lado==='bs'?'bs':(it.lado==='golden'?'golden':'otro'),sev:'warn',origen:{tipo:'manual',de:'Negocios'},quien:'Lucho',fecha:p.decision.fecha||'',prox:((p.faltan||[]).filter(function(x){ return !x.ok; })[0]||{}).d||'',est:'nuevo',hist:[],creado:nowIso(),reprog:0};
      gHist(g,'Creado desde Negocios'); gSave(g); renderGest(); it.gestionId=id; ngSave(it); renderNg(); }); cf.appendChild(gg); cf.appendChild(msg); w.appendChild(cf);
    return w; }
  function p2Text(it){ var p=it.plan2, L=[it.t.toUpperCase(),''];
    L.push('DECISIÓN: '+(p.decision.que||'—')+(p.decision.fecha?' · antes del '+dm(p.decision.fecha):''),'');
    if(p.tesis)L.push('TESIS',p.tesis,'');
    L.push('LO QUE SABEMOS'); (p.supuestos||[]).forEach(function(s){ L.push('• '+s.k+': '+(s.v||'[falta]')+' ('+((P2ORIG[s.o]||P2ORIG.cloty)[0])+(s.f?' · '+s.f:'')+')'); }); L.push('');
    var ing=p2Ing(p); L.push('NÚMEROS ('+(p.moneda==='USD'?'dólares':'pesos')+')'); (p.modelo||[]).forEach(function(l){ var q=p2num(l.cant), pr=p2num(l.precio), oc=(l.ocup===''||l.ocup==null)?100:p2num(l.ocup); L.push('• '+l.linea+' ['+(l.unidad||'')+']: '+(l.cant||'[falta]')+' × '+(l.precio||'[falta]')+' × '+(l.ocup||'100')+'% = '+((q!=null&&pr!=null&&oc!=null)?p2fmt(q*pr*oc/100,p.moneda):'[falta]')); });
    L.push('Total: '+(ing.comp?p2fmt(ing.tot,p.moneda):'[falta]')+(ing.comp<ing.n?' (incompleto)':''),'');
    if(p.pedido){ var d=p.pedido; L.push('PEDIDO','Fijo: '+(d.fijo||'[a definir]')+' '+d.moneda+'/mes · Variable: '+(d.pct||'[a definir]')+'% de '+(d.base||'[base a definir]')+(d.umbral?' por encima de '+d.umbral:'')+(d.tope?' · tope '+d.tope:''),''); }
    if((p.riesgos||[]).length){ L.push('RIESGOS'); p.riesgos.forEach(function(x){ L.push('• '+x.r+' → '+(x.m||'')); }); L.push(''); }
    L.push('FALTA'); (p.faltan||[]).forEach(function(x){ L.push((x.ok?'[x] ':'[ ] ')+x.d+(x.q?' — '+x.q:'')); });
    return L.join('\n'); }

