  // ----- conexión a la base de datos (Paso 1) -----
  (async function(){
    try{ if(window.claude&&window.claude.use){ DB=await window.claude.use('db'); } }catch(e){ DB=null; }
    finConnect(DB);
    if(!DB) return;
    dbWatch('state/principios', function(){return {items:P};}, function(d){ if(d&&d.items){ P=d.items; lset(PK,P); renderTabs(); renderPrinc(); renderPweek(); } });
  })();
