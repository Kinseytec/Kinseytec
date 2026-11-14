/* ================= KinseyTec · Portal do Fornecedor no Firebase ================= */
if (KT_AUTH){
  let ME = null;
  window.KT_PORTAL_START = async () => {
    ME = await KT_AUTH.gate(["fornecedor","admin","editor","colaborador"]);
    const chip = document.querySelector("#saved"); if (chip) chip.textContent = ME.email; window.KT_ME_EMAIL = ME.email;
    try{ const c = await KT_AUTH.db.collection("config").doc("portal__" + (ME.clienteId || "")).get(); if (c.exists) window.KT_PCFG = c.data(); }catch(e){}
    /* cadastro pré-preenchido com os dados do convite (sem nenhuma informação de avaliação) */
    try{ const iv = await KT_AUTH.db.collection("invites").doc(ME.email).get(); const fz = iv.exists ? iv.data().fornecedor : null;
      if (fz && (!F.sup || !F.sup.nome)){ F.sup = {...(F.sup || {}), nivel: fz.nivel || "N1", nome: fz.nome || "", doc: fz.doc || "", uf: fz.uf || "", municipio: fz.municipio || "", comprador: fz.comprador || ""}; persist(); } }catch(e){}
    try{
      const d = await KT_AUTH.db.collection("fichas").doc(ME.user.uid).get();
      if (d.exists){ const x0 = d.data(); window.KT_STATUS = {status: x0.status, enviadoEm: x0.enviadoEm, importadoEm: x0.importadoEm}; }
      if (d.exists && (!F.sup || !F.sup.nome)){ const x = d.data(); F = {step:0, sup:x.fornecedor||{nivel:"N1"}, nda:x.nda||{}, answers:x.answers||{}, docs:x.docs||{}, anexos:x.anexos||[], fotos:x.fotos||[]}; persist(); }
    }catch(e){}
  };
  window.KT_SAVE_MEDIA = async (dataURL, name) => {
    if (!window.KT_USE_STORAGE){
      if (dataURL.length > KT_MAX_INLINE){ const e = new Error("grande"); throw e; }
      const mime = dataURL.slice(5, dataURL.indexOf(";"));
      const ref = await KT_AUTH.db.collection("fichaFiles").add({uid: ME.user.uid, clienteId: ME.clienteId || "", data: dataURL, mime, name: name || "", em: new Date().toISOString()});
      let thumb = null;
      if (/^image\//.test(mime)){ try{ const blob = await (await fetch(dataURL)).blob(); thumb = await ktBlobToDataURL(await ktShrinkBlob(blob, 220, .6)); }catch(e){} }
      return {fileId: ref.id, mime, url: thumb || ""};
    }
    const [h, b] = dataURL.split(","); const mime = h.slice(5, h.indexOf(";")); const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    const ext = (mime.split("/")[1] || "bin").replace("jpeg","jpg").replace(/[^a-z0-9]/g,"");
    const path = `fichas/${ME.user.uid}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}.${ext}`;
    const ref = firebase.storage().ref(path); await ref.put(new Blob([a], {type:mime}), {contentType:mime});
    return {url: await ref.getDownloadURL(), path, mime};
  };
  window.KT_SEND_FICHA = async ficha => {
    await KT_AUTH.db.collection("fichas").doc(ME.user.uid).set({...ficha, status:"enviada", email:ME.email, clienteId:ME.clienteId || "", enviadoEm:new Date().toISOString()});
  };
}
