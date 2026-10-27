  // ---------- FRENTES (en vivo: cierre + gestión + radar) ----------
  function renderFrentes(){ var box=document.getElementById('fr-live'); if(!box)return; box.innerHTML='';
    var days=(typeof CDIAS!=='undefined'&&CDIAS)||[], d=days.length?days[days.length-1]:null, fr=(d&&d.frentes)||{};
    var gAllx=(typeof G2==='object'&&G2)?Object.keys(G2).map(function(k){ return G2[k]; }):[];
    var rAll=(typeof RD==='object'&&RD)?Object.keys(RD).map(function(k){ return RD[k]; }):[];
    var rep=cDecs().map(function(r){ return {veces:r.veces,frente:r.frente}; });
    var L=[['golden','GOLDEN','golden','foco inviolable'],['europa','EUROPA','europa','ventana semanal'],['bs','BS GROUP','bsgroup','proyectos elegidos'],['dogos','DOGOS','dogos','transición']];
    var alerts=0;
    L.forEach(function(f){ var x=fr[f[2]]||{}, ab=Number(x.abiertas)||0, ve=Number(x.vencidas)||0, ce=Number(x.cerradas)||0;
      var gOpen=gAllx.filter(function(g){ return g&&g.frente===f[0]&&!(g.est==='hecho'||g.est==='descartado'); }).length;
      var rNew=rAll.filter(function(r){ return r&&(RDFR[r.frente]||'otro')===f[0]&&(r.est||'nuevo')==='nuevo'; });
      var decs=rep.filter(function(r){ return r&&!r.cerrada&&(Number(r.veces)||0)>=2&&(RDFR[r.frente]||r.frente)===f[0]; }).length;
      var cls='ok', lab='al día';
      if(f[0]==='europa'&&ab<=5&&ce===0){ cls='crit'; lab='sin movimiento'; }
      else if(decs){ cls='crit'; lab=decs+' decisión'+(decs>1?'es':'')+' pendiente'+(decs>1?'s':''); }
      else if(ve&&!ce){ cls='crit'; lab=ve+' vencida'+(ve>1?'s':'')+', 0 cerradas'; }
      else if(ve){ cls='warn'; lab=ve+' vencida'+(ve>1?'s':''); }
      if(!d){ cls='warn'; lab='sin cierre cargado'; }
      if(cls==='crit')alerts++;
      var div=el('div','frente '+f[0]); var fh=el('div','fh'); fh.appendChild(el('b',null,f[1])); fh.appendChild(el('span','gm',f[3])); fh.appendChild(el('span','pill '+cls,lab)); div.appendChild(fh);
      var ul=el('ul'); ul.appendChild(el('li',null,(cFromGest()?'Cierre: ':'ClickUp: ')+ab+' abiertas · '+ve+' vencidas · '+ce+' cerradas hoy'));
      ul.appendChild(el('li',null,'Gestión: '+gOpen+' temas abiertos'+(rNew.length?(' · Radar: '+rNew.length+' sin tratar'):'')));
      ((d&&d.vencidasTop)||[]).filter(function(v){ return v.frente===f[2]; }).slice(0,2).forEach(function(v){ var li=el('li'); var u=safeUrl(v.url);
        if(u){ var a=el('a',null,v.nombre); a.href=u; a.target='_blank'; a.rel='noopener'; li.appendChild(a); } else li.textContent=v.nombre; li.appendChild(document.createTextNode(' — vencida')); ul.appendChild(li); });
      div.appendChild(ul);
      if(rNew.length){ var n=el('div','note'); n.appendChild(document.createTextNode('En el radar: '+rNew[0].t+' ')); var a2=el('a',null,'Ver →'); a2.href='#radar'; n.appendChild(a2); div.appendChild(n); }
      box.appendChild(div); });
    setT('fr-act',d?('cierre del '+dm(d.fecha)):'sin cierre cargado');
    var t=document.getElementById('tp-frentes'); if(t){ t.textContent=d?(alerts?(alerts+' frente'+(alerts>1?'s':'')+' en rojo'):'los 4 al día'):'sin cierre cargado'; t.className='tp'+(alerts?' crit':(d?' ok':'')); } }

