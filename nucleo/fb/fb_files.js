/* ================= KinseyTec · arquivos no plano gratuito (sem Storage) ================= */
// KT_USE_STORAGE = false: fotos e documentos ficam comprimidos dentro do banco (Firestore), até ~700 KB cada.
const KT_MAX_INLINE = 950000; // caracteres do data URL (limite de 1 MB por documento do Firestore)
function ktBlobToDataURL(blob){ return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); }); }
async function ktShrinkBlob(blob, max, q){
  try{ const bmp = await createImageBitmap(blob); const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || blob), "image/jpeg", q)); }catch(e){ return blob; }
}
async function ktInline(blob){
  let b = blob;
  if (/^image\//.test(b.type || "") && b.size > 380000) b = await ktShrinkBlob(b, 1280, .72);
  if (/^image\//.test(b.type || "") && b.size > 600000) b = await ktShrinkBlob(b, 1000, .62);
  const url = await ktBlobToDataURL(b);
  if (url.length > KT_MAX_INLINE){ if (typeof toast === "function") toast("Arquivo grande demais para o plano gratuito (máx. ~700 KB). Use uma foto ou um PDF menor."); const e = new Error("grande"); e.code = "too_big"; throw e; }
  return url;
}
window.KT_GET_FILE = async id => { const d = await KT_AUTH.db.collection("fichaFiles").doc(id).get(); return d.exists ? d.data().data : null; };
