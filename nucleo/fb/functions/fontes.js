/* KinseyTec · fontes públicas lidas pela função agendada (cotações e listas restritivas oficiais).
   Sem bibliotecas externas: leitura de ZIP e PDF reaproveita o importador do sistema (importar.js). */
"use strict";
const vm = require("vm"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const UA = {"Accept": "text/html,application/json,text/csv,*/*", "Accept-Language": "pt-BR,pt;q=0.9"};

/* ---------- importador do sistema (ZIP, PDF) ---------- */
let IMP = null;
function imp(){
  if (IMP) return IMP;
  const src = fs.readFileSync(path.join(__dirname, "importar.js"), "utf8");
  const Z = {finishFlush: zlib.constants.Z_SYNC_FLUSH};   /* tolera bytes sobrando no fim (comum em PDF) */
  const __ktInflate = async (data, fmt) => new Uint8Array(fmt === "deflate-raw" ? zlib.inflateRawSync(Buffer.from(data), Z) : zlib.inflateSync(Buffer.from(data), Z));
  const ctx = {TextDecoder, TextEncoder, DecompressionStream, Uint8Array, console, S: {}, Store: {}, DOMParser: undefined, __ktInflate};
  vm.createContext(ctx); vm.runInContext(src + "\n;globalThis.__IMP = IMP;", ctx); IMP = ctx.__IMP; return IMP;
}
async function pega(url, opc = {}, tent = 3){
  let ult;
  for (let i = 0; i < tent; i++){
    try{ const r = await fetch(url, {redirect: "follow", ...opc, headers: {...UA, ...(opc.headers || {})}}); if (!r.ok) throw new Error("HTTP " + r.status + " " + url); return r; }
    catch(e){ ult = e; await new Promise(res => setTimeout(res, 1500 * (i + 1))); }
  }
  throw ult;
}
const txt = h => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const brNum = v => { const s = String(v || "").replace(/[^\d,.-]/g, ""); if (!s) return null; const n = /,\d{1,4}$/.test(s) ? +s.replace(/\./g, "").replace(",", ".") : +s.replace(/,/g, ""); return isFinite(n) ? n : null; };
const enNum = v => { const n = +String(v || "").replace(/,/g, ""); return isFinite(n) ? n : null; };
const isoBR = d => { const m = String(d || "").match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };

/* =========================================================== COTAÇÕES */
async function dolar(){
  const j = await (await pega("https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json")).json();
  return {valor: +j[0].valor, data: isoBR(j[0].data), unidade: "R$/US$", fonte: "Banco Central (PTAX venda)"};
}
/* tabelas de indicadores do CEPEA/ESALQ: rótulo (texto antes da tabela) + primeira linha (data, R$, US$) */
async function cepea(slug){
  const h = await (await pega(`https://www.cepea.org.br/br/indicador/${slug}.aspx`, {headers: {"User-Agent": "KinseyTec/1.0"}})).text();
  const out = []; const re = /<table[\s\S]*?<\/table>/g; let m;
  while ((m = re.exec(h))){
    const ant = txt(h.slice(Math.max(0, m.index - 900), m.index)), rot = (ant.match(/(INDICADOR[^.]*?|Boi Gordo - [^.]*?|Media Móvel[^.]*?)$/i) || [])[1] || ant.slice(-80);
    const linhas = [...m[0].matchAll(/<tr[\s\S]*?<\/tr>/g)].map(r => [...r[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => txt(c[1])));
    const head = linhas[0] || [], d = linhas.find(l => /^\d{2}\/\d{2}\/\d{4}$/.test(l[0]));
    if (d) out.push({rotulo: rot.trim(), data: isoBR(d[0]), valor: brNum(d[1]), usd: brNum(d[4]), cabecalho: head});
  }
  return out;
}
async function lme(){
  const h = await (await pega("https://www.westmetall.com/en/markdaten.php")).text();
  const tab = h.slice(h.indexOf("Official LME-Prices"), h.indexOf("LME Stocks"));
  const data = (txt(tab).match(/(\d{1,2})\. (\w+) (\d{4})/) || []);
  const MES = {January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12};
  const iso = data.length ? `${data[3]}-${String(MES[data[2]] || 1).padStart(2, "0")}-${String(data[1]).padStart(2, "0")}` : "";
  const r = {}; for (const row of tab.matchAll(/<tr[\s\S]*?<\/tr>/g)){ const c = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(x => txt(x[1])); if (c.length >= 2 && /^(Copper|Aluminium|Zinc|Lead|Nickel|Tin)$/.test(c[0])) r[c[0]] = enNum(c[1]); }
  return {data: iso, ...r};
}
async function icco(){
  const h = await (await pega("https://www.icco.org/statistics/")).text();
  const nonce = (h.match(/wdtNonceFrontendServerSide_26"[^>]*value="([^"]+)"/) || h.match(/id="wdtNonceFrontendServerSide_26"[^>]*value="([^"]+)"/) || [])[1];
  if (!nonce) throw new Error("ICCO: tabela de preços não encontrada");
  const body = "draw=1&columns%5B0%5D%5Bdata%5D=0&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=desc&start=0&length=3&wdtNonce=" + nonce;
  const j = await (await pega("https://www.icco.org/wp-admin/admin-ajax.php?action=get_wdtable&table_id=26", {method: "POST", body, headers: {"Content-Type": "application/x-www-form-urlencoded"}})).json();
  const d = (j.data || [])[0]; if (!d) throw new Error("ICCO: sem dados");
  return {data: isoBR(d[1]), londres: enNum(d[2]), novaYork: enNum(d[3]), icco: enNum(d[4]), iccoEuro: enNum(d[5])};
}
/* reúne todas as cotações (para qualquer segmento) */
async function cotacoes(){
  const itens = {}, erros = [], put = (id, o) => { if (o && o.valor != null && isFinite(o.valor)) itens[id] = o; };
  let usd = null;
  try{ const d = await dolar(); usd = d.valor; put("dolar", {...d, rotulo: "Dólar comercial (PTAX)"}); }catch(e){ erros.push("dólar: " + e.message); }
  const C = [["soja", [[/PARANAGU/i, "cepea_soja_paranagua", "Soja · Paranaguá (CEPEA)", "R$/sc"], [/PARAN[ÁA]$/i, "cepea_soja_parana", "Soja · Paraná (CEPEA)", "R$/sc"]]],
    ["cafe", [[/AR[ÁA]BICA/i, "cepea_cafe_arabica", "Café arábica (CEPEA)", "R$/sc"], [/ROBUSTA/i, "cepea_cafe_robusta", "Café robusta (CEPEA)", "R$/sc"]]],
    ["boi-gordo", [[/^INDICADOR DO BOI GORDO/i, "cepea_boi", "Boi gordo · SP (CEPEA/ESALQ)", "R$/@"]]],
    ["milho", [[/INDICADOR/i, "cepea_milho", "Milho (CEPEA)", "R$/sc"]]]];
  for (const [slug, mapa] of C){
    try{ const T = await cepea(slug); mapa.forEach(([re, id, rot, un]) => { const t = T.find(x => re.test(x.rotulo)); if (t) put(id, {valor: t.valor, usd: t.usd, data: t.data, unidade: un, rotulo: rot, fonte: "CEPEA/ESALQ"}); }); }
    catch(e){ erros.push("CEPEA " + slug + ": " + e.message); }
  }
  try{ const L = await lme(), map = {Copper: ["lme_cobre", "Cobre LME"], Aluminium: ["lme_aluminio", "Alumínio LME"], Zinc: ["lme_zinco", "Zinco LME"], Lead: ["lme_chumbo", "Chumbo LME"], Nickel: ["lme_niquel", "Níquel LME"], Tin: ["lme_estanho", "Estanho LME"]};
    Object.entries(map).forEach(([k, [id, rot]]) => { if (L[k] != null) put(id, {valor: L[k], data: L.data, unidade: "US$/t", rotulo: rot, fonte: "LME (preço oficial à vista)"}); });
    if (usd && L.Copper) put("lme_cobre_brl_kg", {valor: Math.round(L.Copper * usd / 1000 * 100) / 100, data: L.data, unidade: "R$/kg", rotulo: "Cobre LME em R$", fonte: "LME × dólar PTAX"});
    if (usd && L.Aluminium) put("lme_aluminio_brl_kg", {valor: Math.round(L.Aluminium * usd / 1000 * 100) / 100, data: L.data, unidade: "R$/kg", rotulo: "Alumínio LME em R$", fonte: "LME × dólar PTAX"}); }
  catch(e){ erros.push("LME: " + e.message); }
  try{ const I = await icco();
    put("icco_diario", {valor: I.icco, data: I.data, unidade: "US$/t", rotulo: "ICCO · preço diário", fonte: "ICCO"});
    put("icco_ny", {valor: I.novaYork, data: I.data, unidade: "US$/t", rotulo: "ICCO · Nova York (ICE)", fonte: "ICCO"});
    put("icco_londres", {valor: I.londres, data: I.data, unidade: "£/t", rotulo: "ICCO · Londres (ICE)", fonte: "ICCO"});
    if (usd && I.icco) put("icco_brl_arroba", {valor: Math.round(I.icco * usd / 1000 * 15 * 100) / 100, data: I.data, unidade: "R$/@", rotulo: "ICCO em R$/@ (convertido)", fonte: "ICCO × dólar PTAX (referência internacional)"}); }
  catch(e){ erros.push("ICCO: " + e.message); }
  return {em: new Date().toISOString(), itens, erros};
}

/* =========================================================== LISTAS RESTRITIVAS OFICIAIS */
const dl = v => String(v || "").toUpperCase().replace(/[^0-9A-Z*]/g, "");
/* mesma regra de chaves do sistema: documento completo (11 ou 14 dígitos) e, para CPF, os 6 dígitos centrais (m######) */
function chaves(doc){
  const d = dl(doc).replace(/X/g, "*"), out = [];
  if (/^\d{14}$/.test(d) || /^\d{11}$/.test(d)) out.push(d);
  if (/^\d{11}$/.test(d)) out.push("m" + d.slice(3, 9));
  const m = d.match(/^\*{3}(\d{6})\*{2}$/) || d.match(/^\*{0,3}(\d{6})\*{0,2}$/); if (m && d.length <= 11 && !/^\d{11}$/.test(d)) out.push("m" + m[1]);
  return out;
}
function csvLinhas(texto, sep = ";"){
  const out = []; let row = [], cur = "", q = false;
  for (let i = 0; i < texto.length; i++){ const ch = texto[i];
    if (q){ if (ch === '"'){ if (texto[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true; else if (ch === sep){ row.push(cur); cur = ""; } else if (ch === "\n"){ row.push(cur.replace(/\r$/, "")); out.push(row); row = []; cur = ""; } else cur += ch; }
  if (cur || row.length){ row.push(cur); out.push(row); }
  return out;
}
const dataArq = (dias) => { const d = new Date(Date.now() - dias * 864e5); return d.toISOString().slice(0, 10).replace(/-/g, ""); };
async function cgu(tipo){
  let buf = null, arq = "";
  for (let k = 0; k < 6 && !buf; k++){ const dt = dataArq(k); try{ const r = await pega(`https://portaldatransparencia.gov.br/download-de-dados/${tipo}/${dt}`, {}, 1); const b = await r.arrayBuffer(); if (b.byteLength > 1000){ buf = b; arq = `${dt}_${tipo.toUpperCase()}.zip`; } }catch(e){} }
  if (!buf) throw new Error(tipo.toUpperCase() + ": arquivo não encontrado nos últimos 6 dias");
  const z = await imp().unzip(buf), nome = Object.keys(z).find(n => /\.csv$/i.test(n));
  const raw = Buffer.from(await zipBytes(buf, nome)), t = new TextDecoder("latin1").decode(raw);
  const L = csvLinhas(t), h = L[0].map(c => c.trim().toUpperCase()), ix = re => h.findIndex(c => re.test(c));
  const cDoc = ix(/CPF OU CNPJ/), cNome = ix(/^NOME DO SANCIONADO|^NOME INFORMADO/), cRz = ix(/RAZ[ÃA]O SOCIAL/), cCat = ix(/CATEGORIA DA SAN/), cIni = ix(/DATA IN[ÍI]CIO/), cFim = ix(/DATA FINAL/), cOrg = h.findIndex(c => /^[ÓO]RG[ÃA]O SANCIONADOR$/.test(c) || /^NOME DO [ÓO]RG[ÃA]O SANCIONADOR/.test(c));
  const rows = new Map(), hoje = new Date().toISOString().slice(0, 10);
  L.slice(1).forEach(r => { if (!r[cDoc]) return; const fim = isoBR(r[cFim]); if (fim && fim < hoje) return;
    const info = [r[cCat], r[cIni] ? "desde " + r[cIni] : "", r[cFim] ? "até " + r[cFim] : "", cOrg >= 0 ? r[cOrg] : ""].filter(Boolean).join(" · ").slice(0, 170);
    chaves(r[cDoc]).forEach(k => rows.set(k, [(r[cNome] || r[cRz] || "").slice(0, 90), info])); });
  return {rows, arquivo: arq, fonte: "Portal da Transparência (CGU)"};
}
/* conteúdo bruto de um arquivo dentro do ZIP (o importador devolve texto UTF-8; aqui precisamos dos bytes para latin1) */
async function zipBytes(buf, nome){
  const b = new Uint8Array(buf), u16 = (o) => b[o] | (b[o + 1] << 8), u32 = (o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) if (u32(i) === 0x06054b50){ e = i; break; }
  const n = u16(e + 10); let p = u32(e + 16);
  for (let k = 0; k < n; k++){ const met = u16(p + 10), cs = u32(p + 20), nl = u16(p + 28), xl = u16(p + 30), cl = u16(p + 32), lo = u32(p + 42), nm = Buffer.from(b.subarray(p + 46, p + 46 + nl)).toString();
    if (nm === nome){ const ds = lo + 30 + u16(lo + 26) + u16(lo + 28), raw = Buffer.from(b.subarray(ds, ds + cs)); return met === 0 ? raw : zlib.inflateRawSync(raw); }
    p += 46 + nl + xl + cl; }
  throw new Error("arquivo não encontrado no ZIP: " + nome);
}
async function listaSuja(){
  const url = "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/cadastro_de_empregadores.pdf";
  const buf = await (await pega(url)).arrayBuffer(), L = await imp().lerPDF(buf, true), rows = new Map();
  const reDoc = /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}|\*{3}\.\d{3}\.\d{3}-\*{2})/;
  /* a tabela é densa: o leitor pode juntar empregadores vizinhos numa linha. Cada CPF/CNPJ do texto entra na lista;
     o nome e o local só são guardados quando a linha tem um único empregador. */
  const reG = new RegExp(reDoc.source, "g");
  L.forEach(r => { const t = r.join(" ").replace(/\s+/g, " "), docs = [...new Set((t.match(reG) || []))]; if (!docs.length) return;
    const um = docs.length === 1, uf = um ? (t.match(/^\s*\d+\s+\d{4}\s+([A-Z]{2})/) || [])[1] || "" : "", ano = um ? (t.match(/^\s*\d+\s+(\d{4})\b/) || [])[1] || "" : "";
    const nome = um ? t.slice(0, t.indexOf(docs[0])).replace(/^\s*\d+\s+\d{4}\s+[A-Z]{2}/, "").replace(/^[\d.\/-]+\s+/, "").trim() : "";
    const local = um ? (t.slice(t.indexOf(docs[0]) + docs[0].length).match(/([A-ZÀ-Ú][A-ZÀ-Ú .'-]+\/[A-Z]{2})/) || [])[1] || "" : "";
    docs.forEach(d => chaves(d).forEach(k => rows.set(k, [nome.slice(0, 90), ["Cadastro de Empregadores (MTE)", uf, ano ? "ação fiscal " + ano : "", local].filter(Boolean).join(" · ")]))); });
  return {rows, arquivo: "cadastro_de_empregadores.pdf", fonte: "Ministério do Trabalho e Emprego"};
}
/* embargos do IBAMA: arquivo grande (centenas de MB); leitura em fluxo, mantendo só documento, nome, local e data */
async function ibama(){
  const url = "https://stibamadadosabertosprd.blob.core.windows.net/dados-abertos/dados/TERMOS_DE_EMBARGO/TERMO_EMBARGO/termo_de_embargo.csv";
  const r = await pega(url), rows = new Map(), dec = new TextDecoder("utf-8");
  let h = null, row = [], cur = "", q = false, n = 0;
  const fim = () => { row.push(cur); cur = "";
    if (!h){ h = row.map(c => c.replace(/^﻿/, "").trim().toUpperCase()); }
    else { const g = c => row[h.indexOf(c)] || ""; const doc = g("CPF_CNPJ_EMBARGADO");
      if (doc && g("SIT_CANCELADO") !== "S" && !/^S/i.test(g("SIT_DESEMBARGO"))){ n++;
        chaves(doc).forEach(k => rows.set(k, [g("NOME_EMBARGADO").slice(0, 90), [g("MUNICIPIO") && g("UF") ? g("MUNICIPIO") + "/" + g("UF") : g("UF"), g("DAT_EMBARGO") ? "embargo " + g("DAT_EMBARGO").slice(0, 10) : "", g("NUM_TAD") ? "TAD " + g("NUM_TAD") : ""].filter(Boolean).join(" · ")])); } }
    row = []; };
  for await (const chunk of r.body){ const s = dec.decode(chunk, {stream: true});
    for (let i = 0; i < s.length; i++){ const ch = s[i];
      if (q){ if (ch === '"'){ if (s[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else if (cur.length < 400) cur += ch; }
      else if (ch === '"') q = true; else if (ch === ";"){ row.push(cur); cur = ""; } else if (ch === "\n") fim(); else if (ch !== "\r" && cur.length < 400) cur += ch; } }
  if (cur || row.length) fim();
  return {rows, arquivo: "termo_de_embargo.csv", fonte: "IBAMA · dados abertos", ativos: n};
}
const LISTAS = {lista_suja: listaSuja, ceis: () => cgu("ceis"), cnep: () => cgu("cnep"), ibama};

/* agrupa as linhas em blocos pelo prefixo da chave (3 caracteres): poucas gravações e leitura rápida */
function blocos(rows){ const B = {}; for (const [k, v] of rows){ const p = k.slice(0, 3); (B[p] = B[p] || {})[k] = v; } return B; }
function hash(rows){ const c = require("crypto").createHash("sha1"); [...rows.keys()].sort().forEach(k => c.update(k + "|" + rows.get(k).join("|") + "\n")); return c.digest("hex"); }

module.exports = {cotacoes, dolar, cepea, lme, icco, LISTAS, blocos, hash, chaves, csvLinhas, pega, zipBytes, txt};
