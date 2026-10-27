  // ----- conexión a la base de datos (Paso 1) -----
  (async function(){
    try{ if(window.claude&&window.claude.use){ DB=await window.claude.use('db'); } }catch(e){ DB=null; }
    finConnect(DB);
  })();
