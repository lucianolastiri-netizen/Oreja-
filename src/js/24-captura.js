  // ---------- CAPTURA ----------
  var pad=document.getElementById('pad'),st=document.getElementById('cstatus'),nlist=document.getElementById('notelist'),savedInfo=document.getElementById('savedinfo');
  var NK='oreja_notes';
  function loadN(){return lget(NK,[]);} var nRef=null;
  function persistN(a){ lset(NK,a); if(nRef){ nRef.set({items:a})['catch'](function(){}); } }
  function notasAttach(DBx,uid){ try{ nRef=DBx.doc('data/users/'+uid+'/notas'); }catch(e){ nRef=null; return; }
    nRef.onSnapshot(function(sn){ if(!sn||!sn.exists){ var a=loadN(); if(a.length&&!(sn&&sn.metadata&&sn.metadata.fromCache))nRef.set({items:a})['catch'](function(){}); return; }
      var d=sn.data()||{}; if(Array.isArray(d.items)){ lset(NK,d.items); renderN(); } },function(){}); }
  function stamp(){try{return new Date().toLocaleString('es-AR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return'';}}
  function renderN(){var a=loadN();nlist.innerHTML='';savedInfo.innerHTML=a.length?('<b>'+a.length+'</b> nota'+(a.length>1?'s':'')+' en este dispositivo.'):'';
    a.slice().reverse().forEach(function(n){var el=document.createElement('div');el.className='noteitem';
      var t=document.createElement('div');t.className='txt';t.textContent=n.text;
      var ts=document.createElement('div');ts.className='ts';ts.textContent=n.ts;
      var send=document.createElement('button');send.className='nsend';send.type='button';send.textContent='→';send.title='Mandar a Gestión';
      send.addEventListener('click',function(){ addGest(n.text.slice(0,90),'nuevo',{tipo:'captura'}); send.textContent='✓'; });
      var del=document.createElement('button');del.className='nsend';del.type='button';del.textContent='✕';del.title='Borrar';
      del.addEventListener('click',function(){persistN(loadN().filter(function(x){return x.id!==n.id;}));renderN();});
      el.appendChild(t);el.appendChild(ts);el.appendChild(send);el.appendChild(del);nlist.appendChild(el);});}
  document.getElementById('save').addEventListener('click',function(){var v=pad.value.trim();if(!v){st.textContent='nada que guardar';return;}var a=loadN();a.push({id:Date.now(),text:v,ts:stamp()});persistN(a);pad.value='';renderN();st.textContent='guardada ✓';});
  document.getElementById('clear').addEventListener('click',function(){pad.value='';pad.focus();st.textContent='listo';});
  document.getElementById('copy').addEventListener('click',function(){var v=pad.value;if(!v){st.textContent='vacío';return;}copyText(v).then(function(){st.textContent='copiado ✓';});});
  renderN();
  var recBtn=document.getElementById('rec');var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){recBtn.disabled=true;recBtn.textContent='Voz no disponible';recBtn.style.opacity=.5;}
  else{var rec=new SR();rec.lang='es-AR';rec.continuous=true;rec.interimResults=true;var on=false,base='';
    recBtn.addEventListener('click',function(){if(on){rec.stop();return;}base=pad.value?(pad.value.replace(/\s+$/,'')+' '):'';try{rec.start();}catch(e){}});
    rec.onstart=function(){on=true;recBtn.classList.add('on');recBtn.textContent='■ Detener';st.textContent='escuchando…';};
    rec.onend=function(){on=false;recBtn.classList.remove('on');recBtn.textContent='● Dictar nota';if(st.textContent==='escuchando…')st.textContent='listo';};
    rec.onerror=function(ev){on=false;recBtn.classList.remove('on');recBtn.textContent='● Dictar nota';st.textContent=(ev&&ev.error==='not-allowed')?'micrófono bloqueado':'error de voz';};
    rec.onresult=function(ev){var fin='',intm='';for(var i=ev.resultIndex;i<ev.results.length;i++){var r=ev.results[i];if(r.isFinal)fin+=r[0].transcript;else intm+=r[0].transcript;}pad.value=base+fin+intm;if(fin)base=base+fin;};}

