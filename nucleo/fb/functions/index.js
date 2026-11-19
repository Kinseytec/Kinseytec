/* KinseyTec · funções agendadas do Firebase
   cotacoes : de hora em hora, das 8h15 às 19h15 de Brasília, busca dólar, CEPEA, LME e ICCO e grava em cotacoes/atual
   listas   : todo dia às 6h30 baixa as listas oficiais (MTE, CEIS, CNEP, IBAMA) e grava em blocos na coleção listas
   atualizarAgora : o administrador dispara as duas na hora, pelo sistema
   Todas as fontes são públicas; nenhum dado de cliente ou fornecedor sai do Firebase. */
"use strict";
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {setGlobalOptions, logger} = require("firebase-functions/v2");
const admin = require("firebase-admin");
const F = require("./fontes.js");
admin.initializeApp();
const db = admin.firestore();
setGlobalOptions({region: "southamerica-east1", maxInstances: 1});
const ADMINS = ["ia@kinsey.com.br", "newton.kao@kinsey.com.br"];

async function gravarCotacoes(){
  const c = await F.cotacoes(), ref = db.doc("cotacoes/atual"), ant = (await ref.get()).data() || {};
  /* se uma fonte falhar, mantém o último valor conhecido dela (marcado como anterior) */
  const itens = {}; Object.entries(ant.itens || {}).forEach(([k, v]) => { itens[k] = {...v, anterior: true}; });
  Object.entries(c.itens).forEach(([k, v]) => { itens[k] = v; });
  await ref.set({em: c.em, itens, erros: c.erros});
  await db.collection("cotacoes_hist").doc(c.em.slice(0, 10)).set({em: c.em, itens: c.itens}, {merge: true});
  logger.info("cotações", {itens: Object.keys(c.itens).length, erros: c.erros});
  return {itens: Object.keys(c.itens).length, erros: c.erros};
}
async function gravarListas(quais){
  const res = {};
  for (const base of quais){
    try{
      const r = await F.LISTAS[base](), hash = F.hash(r.rows), mref = db.doc("listas/_meta_" + base), meta = (await mref.get()).data();
      const agora = new Date().toISOString();
      if (meta && meta.hash === hash){ await mref.set({verificadoEm: agora}, {merge: true}); res[base] = "sem mudanças (" + r.rows.size + ")"; continue; }
      const versao = Date.now().toString(36), B = F.blocos(r.rows), ids = Object.keys(B);
      for (let i = 0; i < ids.length; i += 400){ const b = db.batch(); ids.slice(i, i + 400).forEach(p => b.set(db.doc(`listas/${base}__${p}`), {base, p, v: versao, r: B[p]})); await b.commit(); }
      await mref.set({meta: true, base, linhas: r.rows.size, arquivo: r.arquivo, fonte: r.fonte, em: agora, verificadoEm: agora, por: "automático", versao, hash, formato: "blocos"});
      res[base] = r.rows.size + " registros";
    }catch(e){ res[base] = "erro: " + e.message; logger.error("lista " + base, e); }
  }
  logger.info("listas", res); return res;
}
exports.cotacoes = onSchedule({schedule: "15 8-19 * * *", timeZone: "America/Sao_Paulo", memory: "256MiB", timeoutSeconds: 120}, () => gravarCotacoes());
exports.listas = onSchedule({schedule: "30 6 * * *", timeZone: "America/Sao_Paulo", memory: "2GiB", timeoutSeconds: 540}, () => gravarListas(Object.keys(F.LISTAS)));
/* funções próprias de um produto (ex.: M&A), quando o segmento traz functions/extra.js */
let EXTRA_TIPOS = {};
const EXTRA = (() => { try{ return require("./extra.js"); }catch(e){ if (e.code !== "MODULE_NOT_FOUND") throw e; return null; } })();
if (EXTRA){ const x = EXTRA({db, logger, onSchedule, F}); Object.assign(exports, x.exports || {}); EXTRA_TIPOS = x.tipos || {}; }
exports.atualizarAgora = onCall({memory: "2GiB", timeoutSeconds: 540}, async req => {
  const email = String(req.auth?.token?.email || "").toLowerCase();
  if (!req.auth || !req.auth.token.email_verified) throw new HttpsError("unauthenticated", "Entre no sistema.");
  let ok = ADMINS.includes(email);
  if (!ok){ const u = await db.doc("users/" + req.auth.uid).get(); ok = u.exists && u.data().role === "admin"; }
  if (!ok) throw new HttpsError("permission-denied", "Só o administrador atualiza as fontes públicas.");
  const tipo = req.data?.tipo || "tudo", out = {};
  if (tipo === "tudo" || tipo === "cotacoes") out.cotacoes = await gravarCotacoes();
  if (tipo === "tudo" || tipo === "listas") out.listas = await gravarListas(Object.keys(F.LISTAS));
  for (const [k, fn] of Object.entries(EXTRA_TIPOS)) if (tipo === "tudo" || tipo === k) out[k] = await fn();
  return out;
});
/* lerArquivo: devolve um arquivo do Storage ao sistema (o navegador não baixa direto do bucket sem CORS liberado).
   Mesmas regras do storage.rules: administrador vê tudo; editor e colaborador só os arquivos do próprio cliente. */
exports.lerArquivo = onCall({memory: "1GiB", timeoutSeconds: 120}, async req => {
  if (!req.auth || !req.auth.token.email_verified) throw new HttpsError("unauthenticated", "Entre no sistema.");
  const path = String(req.data?.path || "");
  if (!/^(evidences|fichas)\/[^\0]+$/.test(path) || path.includes("..")) throw new HttpsError("invalid-argument", "Arquivo inválido.");
  const email = String(req.auth.token.email || "").toLowerCase();
  if (!ADMINS.includes(email)){
    const u = await db.doc("users/" + req.auth.uid).get(), d = u.exists ? u.data() : null, p = path.split("/");
    if (!d || !["admin", "editor", "colaborador"].includes(d.role)) throw new HttpsError("permission-denied", "Sem acesso a este arquivo.");
    if (d.role !== "admin" && p[0] === "evidences" && p.length > 2 && String(d.clienteId || "") !== p[1]) throw new HttpsError("permission-denied", "Arquivo de outro cliente.");
  }
  const f = admin.storage().bucket().file(path), [ex] = await f.exists();
  if (!ex) throw new HttpsError("not-found", "Arquivo não encontrado no Storage.");
  const [meta] = await f.getMetadata(); if (Number(meta.size || 0) > 20 * 1024 * 1024) throw new HttpsError("out-of-range", "Arquivo maior que 20 MB para leitura automática.");
  const [buf] = await f.download();
  return {b64: buf.toString("base64"), mime: meta.contentType || "application/octet-stream", size: buf.length};
});
module.exports._interno = {gravarCotacoes, gravarListas};
