/* KinseyTec – M&A · funções próprias do produto (carregadas pelo index.js do núcleo)
   mercado      : todo dia às 7h40, Banco Central (Selic, CDI, IPCA, PTAX), Focus (Selic e IPCA esperados),
                  US Treasury 10 anos e notícias de juros, inflação, câmbio e dos segmentos dos targets → cotacoes/mercado
   comparaveis  : todo dia 5, companhias abertas da CVM (cadastro, FCA e DFP: receita, EBITDA, dívida, lucro, ações)
                  com preço de fechamento público → múltiplos por segmento em cotacoes/comparaveis
   consultarEmpresa: ao cadastrar ou mudar o CNPJ de um investidor (N1) ou target (N3), e sob pedido do usuário:
                  CVM (companhia aberta e setor), B3 e DFP (pela base de comparáveis), cotação pública e notícias
                  (do N1, também as de aquisições) → suppliers/{id}.ext
   Fontes públicas; o único dado enviado para fora é o nome da empresa na busca de notícias. */
"use strict";
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
module.exports = ({db, logger, onSchedule, F}) => {
  const SGS = (s, q = "ultimos/1") => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s}/dados/${q}?formato=json`;
  const num = v => { const n = parseFloat(String(v).replace(",", ".")); return isFinite(n) ? n : null; };
  const json = async u => (await F.pega(u)).json();
  async function serie(s){ const j = await json(SGS(s)); return {v:num(j[0].valor), data:j[0].data}; }
  async function ipcaAnual(){ const y = new Date().getFullYear(), j = await json(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.13522/dados?formato=json&dataInicial=01/12/${y - 7}&dataFinal=31/12/${y}`); const o = {}; j.filter(x => x.data.startsWith("01/12/")).forEach(x => o[x.data.slice(6)] = num(x.valor)); return o; }
  async function focus(){
    const u = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais?$top=60&$filter=(Indicador%20eq%20'IPCA'%20or%20Indicador%20eq%20'Selic')%20and%20baseCalculo%20eq%200&$orderby=Data%20desc&$format=json";
    const L = (await json(u)).value, data = L[0]?.Data, o = {data, ipca:{}, selic:{}};
    L.filter(x => x.Data === data).forEach(x => { const k = x.Indicador === "IPCA" ? "ipca" : "selic"; o[k][x.DataReferencia] = Math.round(x.Mediana * 100) / 100; });
    Object.keys(o.ipca).sort().slice(5).forEach(k => delete o.ipca[k]); Object.keys(o.selic).sort().slice(5).forEach(k => delete o.selic[k]); return o;
  }
  async function treasury10(){
    const d = new Date(), ym = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0");
    const x = await (await F.pega(`https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month=${ym}`)).text();
    const v = [...x.matchAll(/<d:BC_10YEAR[^>]*>([\d.]+)</g)].map(m => +m[1]); return v.length ? v[v.length - 1] : null;
  }
  async function rss(q, n = 8){
    const x = await (await F.pega(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`)).text();
    return [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, n).map(m => { const g = t => (m[1].match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || "";
      const titulo = F.txt(g("title").replace(/<!\[CDATA\[|\]\]>/g, "")), fonte = F.txt(g("source")); return {titulo:titulo.replace(new RegExp(" - " + fonte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$"), ""), url:F.txt(g("link")), fonte, data:new Date(g("pubDate")).toISOString().slice(0, 10)}; });
  }
  async function gravarMercado(){
    const erros = [], tenta = async (k, f) => { try{ return await f(); }catch(e){ erros.push(k + ": " + e.message); return null; } };
    const [selic, cdi, ipca12, ptax] = await Promise.all([432, 4389, 13522, 1].map(s => tenta("sgs" + s, () => serie(s))));
    const atual = {em:new Date().toISOString(), fonte:"Banco Central do Brasil (SGS e Focus)", selic:selic?.v, cdi:cdi?.v, ipca12:ipca12?.v, ipca12ref:ipca12?.data?.slice(3), ptax:ptax?.v, ust10:await tenta("treasury", treasury10)};
    atual.ibov = await tenta("ibovespa", async () => Math.round((await json("https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?range=5d&interval=1d")).chart.result[0].meta.regularMarketPrice));
    const segs = new Set(); (await db.collection("suppliers").where("nivel", "==", "N3").get()).forEach(d => { const s = d.data().perfil?.segmento || d.data().segmento; if (s) segs.add(s); });
    const noticias = (await tenta("noticias", async () => [...await rss("Copom Selic juros"), ...await rss("IPCA inflação expectativas"), ...await rss("dólar câmbio Banco Central", 4)])) || [];
    const noticias_seg = {}; for (const s of segs) noticias_seg[s] = (await tenta("noticias " + s, () => rss(`setor ${s} Brasil crescimento OR investimento OR expansão`, 10))) || [];
    const doc = {atual, ipca:await tenta("ipca", ipcaAnual) || {}, focus:await tenta("focus", focus), noticias:noticias.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 15), noticias_seg, em:atual.em, erros};
    if (!doc.focus) delete doc.focus;
    await db.doc("cotacoes/mercado").set(doc); logger.info("mercado", {erros}); return {erros, segmentos:[...segs]};
  }

  /* ---------------- comparáveis CVM ---------------- */
  const SEG = [["Alimentos",/aliment|bebida|frigor|latic|acucar|açúcar/i],["Agro",/agric|agro|pecu/i],["Tecnologia",/tecnolog|software|inform[aá]t|telecom/i],["Saúde",/sa[uú]de|hospital|farm|medic|diagn/i],["Educação",/educa/i],
    ["Energia",/energia|el[eé]tric|petr[oó]le|g[aá]s|saneamento/i],["Logística",/transport|log[ií]st|portu|ferrov|a[eé]re/i],["Varejo",/com[eé]rcio|varej/i],["Construção",/constru|imobili/i],["Industrial",/m[aá]quin|metal|sider|ind[uú]str|equipament|qu[ií]mic|papel|t[eê]xtil|minera/i],["Serviços",/servi[cç]/i]];
  const csvLat = async (buf, nome) => F.csvLinhas(new TextDecoder("latin1").decode(await F.zipBytes(buf, nome)));
  const tab = L => { const h = L[0].map(x => x.trim()), ix = k => h.indexOf(k); return L.slice(1).filter(r => r.length > 2).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]]))); };
  async function gravarComparaveis(){
    const B = "https://dados.cvm.gov.br/dados/CIA_ABERTA", ano0 = new Date().getFullYear() - 1;
    const cad = tab(F.csvLinhas(new TextDecoder("latin1").decode(await (await F.pega(`${B}/CAD/DADOS/cad_cia_aberta.csv`)).arrayBuffer()), ";")).filter(c => c.SIT === "ATIVO");
    let ano = ano0, dfp = null; for (; ano >= ano0 - 1 && !dfp; ano--){ try{ dfp = await (await F.pega(`${B}/DOC/DFP/DADOS/dfp_cia_aberta_${ano}.zip`, {}, 2)).arrayBuffer(); }catch(e){} } ano++;
    if (!dfp) throw new Error("DFP não encontrada");
    let fca = null; try{ fca = await (await F.pega(`${B}/DOC/FCA/DADOS/fca_cia_aberta_${new Date().getFullYear()}.zip`, {}, 2)).arrayBuffer(); }catch(e){}
    const tick = {}; if (fca) tab(await csvLat(fca, `fca_cia_aberta_valor_mobiliario_${new Date().getFullYear()}.csv`)).forEach(r => { const t = (r.Codigo_Negociacao || "").trim(); if (/^[A-Z]{4}(3|4|11)$/.test(t) && !tick[r.CNPJ_Companhia]) tick[r.CNPJ_Companhia] = t; });
    const val = {}, put = (cnpj, k, v) => ((val[cnpj] ||= {})[k] = (val[cnpj][k] || 0) + v);
    const escala = r => (r.ESCALA_MOEDA || "").toUpperCase() === "MIL" ? 1000 : 1;
    const ult = rows => rows.filter(r => /LTIMO/i.test(r.ORDEM_EXERC || ""));
    ult(tab(await csvLat(dfp, `dfp_cia_aberta_DRE_con_${ano}.csv`))).forEach(r => { const v = num(r.VL_CONTA) * escala(r); if (r.CD_CONTA === "3.01") put(r.CNPJ_CIA, "rec", v); if (r.CD_CONTA === "3.05") put(r.CNPJ_CIA, "ebit", v); if (r.CD_CONTA === "3.11") put(r.CNPJ_CIA, "ll", v); });
    ult(tab(await csvLat(dfp, `dfp_cia_aberta_DFC_MI_con_${ano}.csv`))).forEach(r => { if (/^6\.01\.01\./.test(r.CD_CONTA) && /deprecia|amortiza|exaust/i.test(r.DS_CONTA)) put(r.CNPJ_CIA, "da", Math.abs(num(r.VL_CONTA) * escala(r))); });
    ult(tab(await csvLat(dfp, `dfp_cia_aberta_BPP_con_${ano}.csv`))).forEach(r => { const v = num(r.VL_CONTA) * escala(r); if (["2.01.04","2.02.01"].includes(r.CD_CONTA)) put(r.CNPJ_CIA, "div", v); if (r.CD_CONTA === "2.03") put(r.CNPJ_CIA, "pl", v); });
    ult(tab(await csvLat(dfp, `dfp_cia_aberta_BPA_con_${ano}.csv`))).forEach(r => { if (["1.01.01","1.01.02"].includes(r.CD_CONTA)) put(r.CNPJ_CIA, "caixa", num(r.VL_CONTA) * escala(r)); });
    tab(await csvLat(dfp, `dfp_cia_aberta_composicao_capital_${ano}.csv`)).forEach(r => { const q = num(r.QT_ACAO_TOTAL_CAP_INTEGR) - (num(r.QT_ACAO_TOTAL_TESOURO) || 0); if (q > 0) val[r.CNPJ_CIA] && (val[r.CNPJ_CIA].acoes = q); });
    const lista = [], erros = [];
    for (const c of cad){ const v = val[c.CNPJ_CIA], t = tick[c.CNPJ_CIA], seg = SEG.find(([, re]) => re.test(c.SETOR_ATIV || ""))?.[0];
      if (!v || !t || !seg || !(v.rec > 0) || !v.acoes) continue;
      try{ const j = await (await F.pega(`https://query1.finance.yahoo.com/v8/finance/chart/${t}.SA?range=5d&interval=1d`, {}, 1)).json(), p = j.chart?.result?.[0]?.meta?.regularMarketPrice; if (!(p > 0)) continue;
        const mcap = p * v.acoes, ev = mcap + (v.div || 0) - (v.caixa || 0), ebitda = (v.ebit || 0) + (v.da || 0);
        lista.push({id:t, cnpj:String(c.CNPJ_CIA || "").replace(/\D/g, ""), nome:c.DENOM_COMERC || c.DENOM_SOCIAL, ticker:t, seg, setorCVM:c.SETOR_ATIV, ev, mcap, preco:p, ano, rec:v.rec, ebitda, ll:v.ll || 0, pl:v.pl || 0, caixa:v.caixa || 0, div:v.div || 0, data:`DFP ${ano} · preço ${new Date().toISOString().slice(0, 10)}`, fonte:"CVM (DFP) e cotação pública"}); }
      catch(e){ erros.push(t + ": " + e.message); }
      await new Promise(r => setTimeout(r, 250)); if (lista.length >= 300) break; }
    await db.doc("cotacoes/comparaveis").set({em:new Date().toISOString(), ano, fonte:"CVM · dados abertos (cadastro, FCA e DFP) e cotação pública", lista, erros:erros.slice(0, 30)});
    logger.info("comparáveis", {n:lista.length, erros:erros.length}); return {companhias:lista.length, ano, erros:erros.length};
  }
  /* ---------------- consulta de empresa (N1 e N3) ---------------- */
  let CAD = null, cadEm = 0;
  async function cadastroCVM(){
    if (CAD && Date.now() - cadEm < 864e5) return CAD;
    const L = tab(F.csvLinhas(new TextDecoder("latin1").decode(await (await F.pega("https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv")).arrayBuffer()), ";")), m = new Map();
    L.forEach(c => { const k = String(c.CNPJ_CIA || "").replace(/\D/g, ""); if (k && (!m.has(k) || c.SIT === "ATIVO")) m.set(k, c); });
    CAD = m; cadEm = Date.now(); return m;
  }
  const limpaNome = n => String(n || "").replace(/^EXEMPLO\s+/i, "").replace(/["]/g, "").replace(/\b(ltda|s\.?\s?a\.?|eireli|epp)\b\.?/gi, "").replace(/\s+/g, " ").trim();
  async function consultarEmpresa(id){
    const ref = db.doc("suppliers/" + id), snap = await ref.get(); if (!snap.exists) return {ok:false, motivo:"não encontrado"};
    const s = snap.data(), cnpj = String(s.doc || "").replace(/\D/g, ""); if (!["N1","N3"].includes(s.nivel)) return {ok:false, motivo:"só N1 e N3"};
    const ext = {em:new Date().toISOString(), doc:cnpj, nome:s.nome || "", erros:[]}, tenta = async (k, f) => { try{ return await f(); }catch(e){ ext.erros.push(k + ": " + e.message); return null; } };
    if (cnpj.length === 14){
      const cad = await tenta("cvm", cadastroCVM), c = cad && cad.get(cnpj);
      if (cad) ext.cvm = c ? {aberta:c.SIT === "ATIVO", situacao:c.SIT || "", nome:c.DENOM_COMERC || c.DENOM_SOCIAL || "", setor:c.SETOR_ATIV || "", categoria:c.CATEG_REG || "", codigo:c.CD_CVM || ""} : {aberta:false};
      const comp = (await tenta("comparaveis", async () => (await db.doc("cotacoes/comparaveis").get()).data()))?.lista || [], k = comp.find(x => x.cnpj === cnpj);
      if (k){ ext.fin = {ano:k.ano || null, rec:k.rec, ebitda:k.ebitda, ll:k.ll, pl:k.pl, caixa:k.caixa ?? null, div:k.div ?? null, fonte:k.data || "CVM (DFP)"}; ext.b3 = {ticker:k.ticker, mcap:k.mcap, ev:k.ev, preco:k.preco || null}; }
      const tk = ext.b3?.ticker || (s.capac?.ticker || "").toUpperCase();
      if (/^[A-Z]{4}\d{1,2}$/.test(tk)){ const q = await tenta("cotacao", async () => (await json(`https://query1.finance.yahoo.com/v8/finance/chart/${tk}.SA?range=5d&interval=1d`)).chart.result[0].meta.regularMarketPrice);
        if (q > 0) ext.b3 = {...(ext.b3 || {ticker:tk}), preco:q, em:ext.em}; }
    }
    const nome = limpaNome(s.nome);
    if (nome.length >= 3 && !/^EXEMPLO/i.test(s.nome || "")){
      ext.noticias = (await tenta("noticias", () => rss(`"${nome}"`, 8))) || [];
      if (s.nivel === "N1") ext.aquisicoes = (await tenta("aquisicoes", () => rss(`"${nome}" (aquisição OR adquire OR adquiriu OR compra OR incorporação)`, 10))) || [];
    }
    if (!ext.erros.length) delete ext.erros;
    await ref.set({ext}, {merge:true}); logger.info("consultarEmpresa", {id, erros:ext.erros || []}); return {ok:true, erros:ext.erros || []};
  }
  const precisa = s => s && ["N1","N3"].includes(s.nivel) && (!s.ext || s.ext.doc !== String(s.doc || "").replace(/\D/g, "") || s.ext.nome !== (s.nome || "") || Date.now() - new Date(s.ext.em).getTime() > 30 * 864e5);
  return {
    exports:{
      consultaEmpresaAuto:onDocumentWritten({document:"suppliers/{id}", memory:"1GiB", timeoutSeconds:120}, async ev => { const s = ev.data?.after?.exists ? ev.data.after.data() : null; if (precisa(s)) await consultarEmpresa(ev.params.id); }),
      consultarEmpresa:onCall({memory:"1GiB", timeoutSeconds:120}, async req => {
        if (!req.auth || !req.auth.token.email_verified) throw new HttpsError("unauthenticated", "Entre no sistema.");
        const u = await db.doc("users/" + req.auth.uid).get(); if (!u.exists || u.data().role === "fornecedor") throw new HttpsError("permission-denied", "Sem acesso a esta consulta.");
        return consultarEmpresa(String(req.data?.id || "")); }),
      mercado:onSchedule({schedule:"40 7 * * *", timeZone:"America/Sao_Paulo", memory:"512MiB", timeoutSeconds:300}, () => gravarMercado()),
      comparaveis:onSchedule({schedule:"20 6 5 * *", timeZone:"America/Sao_Paulo", memory:"2GiB", timeoutSeconds:540}, () => gravarComparaveis())
    },
    tipos:{mercado:gravarMercado, comparaveis:gravarComparaveis},
    _interno:{gravarMercado, gravarComparaveis, focus, ipcaAnual, serie, rss}
  };
};
