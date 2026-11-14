/* ================= OPERAÇÕES COMERCIAIS · notas fiscais, pedidos e pagamentos =================
   Importa notas fiscais (XML da NF-e, ZIP de XMLs, DANFE em PDF, planilha ou SPED Fiscal), pedidos de compra
   (planilha, CSV, PDF) e pagamentos (retorno bancário CNAB 240, extrato OFX, planilha, comprovantes em PDF ou foto)
   das transações entre o cliente e os fornecedores N1, N2 e N3. Confere pedido × nota × pagamento e analisa cada nota
   (chave de acesso, situação, produto, CFOP, sequência, datas, valores, capacidade, destinatário, favorecido).
   Os alertas entram na matriz de risco do fornecedor, na aba Operações e no relatório de pontos. */
const OPS = (() => {
  const DIA = 864e5, PESO = {alto: 6, medio: 3, baixo: 1, info: 0}, SEV_TX = {alto: "Alto", medio: "Médio", baixo: "Baixo", info: "Observação"};
  const dl = v => String(v || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const docFmt = v => { const d = dl(v); return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : (v || ""); };
  const nz = v => String(v || "").replace(/\D/g, "").replace(/^0+/, "");
  const brl = v => v == null ? "—" : "R$ " + fmt(v, 2);
  const dBR = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—";
  const ts = d => d ? new Date(d + "T12:00").getTime() : NaN;
  function num(v){
    if (v == null || v === "") return null; if (typeof v === "number") return isFinite(v) ? v : null;
    let t = String(v).replace(/[R$\s ]/g, "").replace(/^\((.*)\)$/, "-$1");
    if (/,\d{1,4}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    else t = t.replace(/,/g, "");
    const x = parseFloat(t); return isFinite(x) ? x : null;
  }
  function data(v){
    const t = String(v || "").trim(); let m;
    if ((m = t.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
    if ((m = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/))){ const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; }
    if ((m = t.match(/^(\d{8})/))){ const x = m[1], ano = y => /^(19|20)\d\d$/.test(y), mes = v => +v >= 1 && +v <= 12, dia = v => +v >= 1 && +v <= 31;
      if (ano(x.slice(0, 4)) && mes(x.slice(4, 6)) && dia(x.slice(6, 8)) && !(ano(x.slice(4)) && mes(x.slice(2, 4)) && dia(x.slice(0, 2)) && t.length === 8)) return `${x.slice(0, 4)}-${x.slice(4, 6)}-${x.slice(6, 8)}`;
      if (ano(x.slice(4)) && mes(x.slice(2, 4)) && dia(x.slice(0, 2))) return `${x.slice(4)}-${x.slice(2, 4)}-${x.slice(0, 2)}`; }
    if (/^\d{5}(\.\d+)?$/.test(t)){ const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * DIA); return d.toISOString().slice(0, 10); }
    return "";
  }
  const KG = {KG: 1, KGS: 1, QUILO: 1, QUILOS: 1, QUILOGRAMA: 1, T: 1000, TON: 1000, TN: 1000, TONELADA: 1000, TONELADAS: 1000, TO: 1000, SC: 60, SACA: 60, SACAS: 60, SC60: 60, "@": 15, ARROBA: 15, ARROBAS: 15, G: .001, GR: .001};
  const emKg = (q, un) => { const f = KG[String(un || "").toUpperCase().replace(/[^A-Z@0-9]/g, "")]; return f && q != null ? q * f : null; };
  const UF_COD = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF"};

  /* ---------- produto do segmento (OPS_PROD, definido no data.js de cada segmento) ---------- */
  const SEG = typeof OPS_PROD !== "undefined" ? OPS_PROD : {prod: "produto negociado", ncm: [], kw: null, demo: ["Mercadoria", "", "KG", 10]};
  const itemDoProduto = it => (it.ncm && SEG.ncm.some(p => dl(it.ncm).startsWith(p))) || (!dl(it.ncm) && SEG.kw && SEG.kw.test(it.desc || ""));
  const CFOP_OK = /^([123]10[1-9]|[123]11[0-9]|[123]12[0-4]|[123]40[1-9]|[567]10[1-9]|[567]11[0-9]|[567]12[0-4]|[567]40[1-9]|[56]50[1-5])$/;

  /* ---------- chave de acesso (44 posições; aceita CNPJ alfanumérico) ---------- */
  const dvChave = c => { let s = 0, p = 2; for (let i = 42; i >= 0; i--){ s += (c.charCodeAt(i) - 48) * p; p = p === 9 ? 2 : p + 1; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
  const chaveOk = c => /^\d{6}[0-9A-Z]{12}\d{26}$/.test(c) && dvChave(c) === +c[43];
  const daChave = c => ({uf: UF_COD[c.slice(0, 2)] || "", aamm: c.slice(2, 6), doc: c.slice(6, 20), mod: c.slice(20, 22), serie: nz(c.slice(22, 25)) || "0", numero: nz(c.slice(25, 34))});
  function montaChave(uf, aamm, doc, mod, serie, numero, cod){ const cu = Object.keys(UF_COD).find(k => UF_COD[k] === uf) || "35";
    const c = cu + aamm + dl(doc).padStart(14, "0") + mod + String(serie).padStart(3, "0") + String(numero).padStart(9, "0") + "1" + String(cod).padStart(8, "0"); return c + dvChave(c + "0"); }

  /* =================================================================== LEITURA DE ARQUIVOS */
  const SIT_CSTAT = c => [100, 150].includes(+c) ? "autorizada" : [101, 151, 135, 155].includes(+c) ? "cancelada" : [110, 301, 302, 303, 205].includes(+c) ? "denegada" : "";
  /* NF-e em XML (nota, nota com protocolo, lote) e eventos de cancelamento */
  function lerXML(t){
    const d = new DOMParser().parseFromString(t.replace(/^﻿/, ""), "application/xml");
    const g = (n, tag) => n ? n.getElementsByTagName(tag)[0] : null, v = (n, tag) => { const e = g(n, tag); return e ? e.textContent.trim() : ""; };
    const prots = {}; [...d.getElementsByTagName("infProt")].forEach(p => prots[v(p, "chNFe")] = {cStat: v(p, "cStat"), xMotivo: v(p, "xMotivo"), nProt: v(p, "nProt"), dh: v(p, "dhRecbto")});
    const eventos = [...d.getElementsByTagName("infEvento")].filter(e => v(e, "tpEvento") === "110111").map(e => ({chave: v(e, "chNFe"), tipo: "cancelamento", dh: v(e, "dhEvento") || v(e, "dhRegEvento")}));
    const notas = [...d.getElementsByTagName("infNFe")].map(inf => {
      const ide = g(inf, "ide"), emit = g(inf, "emit"), dest = g(inf, "dest"), tot = g(inf, "ICMSTot"), ee = g(emit, "enderEmit"), ed = g(dest, "enderDest");
      const chave = (inf.getAttribute("Id") || "").replace(/^NFe/, "");
      const itens = [...inf.getElementsByTagName("det")].map(det => { const p = g(det, "prod"); return {desc: v(p, "xProd"), ncm: v(p, "NCM"), cfop: v(p, "CFOP"), un: v(p, "uCom"), qtd: num(v(p, "qCom")), vUn: num(v(p, "vUnCom")), vTot: num(v(p, "vProd")), xPed: v(p, "xPed")}; });
      const cpl = v(g(inf, "infAdic"), "infCpl"), pm = cpl.match(/pedido\s*(?:de compra)?\s*(?:n[ºo°.]*)?\s*:?\s*([A-Z0-9][A-Z0-9\-\/.]{1,20})/i);
      const pr = prots[chave] || null, emitDoc = v(emit, "CNPJ") || v(emit, "CPF");
      return {tipo: "nf", origem: "xml", nf: {chave, numero: nz(v(ide, "nNF")), serie: nz(v(ide, "serie")) || "0", modelo: v(ide, "mod"), tp: v(ide, "tpNF") || "1", emissao: data(v(ide, "dhEmi") || v(ide, "dEmi")), natOp: v(ide, "natOp"),
        emitDoc, emitNome: v(emit, "xNome"), emitUF: v(ee, "UF"), emitMun: v(ee, "xMun"), destDoc: v(dest, "CNPJ") || v(dest, "CPF"), destNome: v(dest, "xNome"), destUF: v(ed, "UF"),
        itens, vNF: num(v(tot, "vNF")), pedidoRef: v(g(inf, "compra"), "xPed") || itens.find(i => i.xPed)?.xPed || (pm ? pm[1] : ""), infCpl: cpl.slice(0, 500),
        protocolo: pr, situacao: pr ? (SIT_CSTAT(pr.cStat) || "nao_verificada") : "nao_verificada", sitFonte: pr ? "protocolo no XML" : ""}};
    });
    return {notas, eventos};
  }
  /* DANFE (cópia ou espelho em PDF): dados principais vêm da chave de acesso; o restante fica para conferência */
  async function lerDANFE(buf){
    const L = await IMP.lerPDF(buf), linhas = L.map(r => r.join(" ")), t = linhas.join("\n");
    const cm = t.replace(/[\s.]/g, "").match(/\d{6}[0-9A-Z]{12}\d{26}/g) || [], chave = cm.find(chaveOk) || cm[0] || "";
    const k = chave ? daChave(chave) : {};
    const datas = [...t.matchAll(/\b(\d{2}\/\d{2}\/\d{4})\b/g)].map(m => data(m[1])), em = t.match(/EMISS[ÃA]O[^\d]{0,40}(\d{2}\/\d{2}\/\d{4})/i);
    const vt = t.match(/VALOR\s+TOTAL\s+DA\s+NOTA[^\d]{0,40}([\d.]+,\d{2})/i), vals = [...t.matchAll(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g)].map(m => num(m[0])).filter(x => x != null);
    const docs = [...t.matchAll(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\b/g)].map(m => dl(m[1]));
    const emitDoc = k.doc ? (k.doc.startsWith("000") && IMP.docValido(k.doc.slice(3)) ? k.doc.slice(3) : k.doc) : (docs[0] || "");
    const destDoc = docs.find(d => d !== emitDoc && d !== k.doc) || "";
    /* linha do produto: descrição, NCM (8 dígitos), CFOP, unidade, quantidade, valor unitário e total */
    const pl = linhas.map(l => l.replace(/\s+/g, " ").match(/^(.*?)\s(\d{8})\s+(?:\d{2,3}\s+)?([1-7]\d{3})\s+([A-Z@]{1,6})\s+([\d.]+,\d+)\s+([\d.]+,\d+)\s+([\d.]+,\d{2})/)).find(Boolean);
    const ncm = pl ? pl[2] : (t.match(/\b\d{8}\b/g) || []).find(n => SEG.ncm.some(p => n.startsWith(p))) || "";
    const desc = pl ? pl[1].replace(/^\S*\d\S*\s+(?=[A-Za-zÀ-ú])/, "") : linhas.find(l => SEG.kw && SEG.kw.test(l) && l.length < 160) || "";
    const nfNum = t.match(/N[ºo°.]\s*:?\s*(\d{1,3}(?:\.\d{3})+|\d{1,9})/i);
    return {tipo: "nf", origem: "pdf", rev: true, nf: {chave, numero: k.numero || nz(nfNum ? nfNum[1] : ""), serie: k.serie || "", modelo: k.mod || "55", tp: /\b0\s*-\s*ENTRADA|ENTRADA\s*\[?\s*X/i.test(t) ? "0" : "1", emissao: data(em ? em[1] : "") || datas[0] || "",
      emitDoc, emitNome: "", emitUF: k.uf || "", destDoc, itens: [{desc: desc.replace(/\s+/g, " ").trim().slice(0, 120), ncm, cfop: pl ? pl[3] : "", un: pl ? pl[4] : "", qtd: pl ? num(pl[5]) : null, vUn: pl ? num(pl[6]) : null, vTot: pl ? num(pl[7]) : null}],
      vNF: vt ? num(vt[1]) : (vals.length ? Math.max(...vals) : null), situacao: "nao_verificada", pedidoRef: ""}};
  }
  /* SPED Fiscal (EFD ICMS/IPI): blocos 0000, 0150, 0200, C100 e C170 */
  function lerSPED(t){
    const part = {}, item = {}, out = []; let cli = "", cur = null;
    const SIT = {"00": "autorizada", "01": "autorizada", "06": "autorizada", "07": "autorizada", "08": "autorizada", "02": "cancelada", "03": "cancelada", "04": "denegada", "05": "inutilizada"};
    t.split(/\r?\n/).forEach(l => { const f = l.split("|"); const r = f[1];
      if (r === "0000") cli = dl(f[7] || f[8]);
      else if (r === "0150") part[f[2]] = {nome: f[3], doc: dl(f[5] || f[6]), mun: f[8]};
      else if (r === "0200") item[f[2]] = {desc: f[3], un: f[6], ncm: f[8]};
      else if (r === "C100"){ cur = null; if (!["55", "65", "01", "04", "1B"].includes(f[5])) return;
        const p = part[f[4]] || {}, entrada = f[2] === "0", propria = f[3] === "0";
        const emit = propria ? {doc: cli, nome: "Cliente (emissão própria)"} : p, dest = propria ? p : {doc: cli, nome: ""};
        cur = {tipo: "nf", origem: "sped", nf: {chave: f[9] || "", numero: nz(f[8]), serie: nz(f[7]) || "0", modelo: f[5], tp: propria && entrada ? "0" : "1", emissao: data(f[10]), natOp: entrada ? "Entrada (SPED)" : "Saída (SPED)",
          emitDoc: emit.doc || "", emitNome: emit.nome || "", destDoc: dest.doc || "", destNome: dest.nome || "", itens: [], vNF: num(f[12]), situacao: SIT[f[6]] || "nao_verificada", sitFonte: SIT[f[6]] ? "SPED (COD_SIT " + f[6] + ")" : "", pedidoRef: ""}};
        if (entrada) out.push(cur); else cur = null; }
      else if (r === "C170" && cur){ const it = item[f[3]] || {}; cur.nf.itens.push({desc: f[4] || it.desc || "", ncm: it.ncm || "", cfop: f[11] || "", un: f[6] || it.un || "", qtd: num(f[5]), vUn: null, vTot: num(f[7])}); }
    });
    out.forEach(o => o.nf.itens.forEach(i => { if (i.qtd && i.vTot) i.vUn = i.vTot / i.qtd; }));
    return out;
  }
  /* retorno bancário CNAB 240 (pagamento a fornecedores: segmentos A, B e J) */
  function lerCNAB240(t){
    const out = []; let cur = null; const P = (l, a, b) => l.slice(a - 1, b).trim();
    t.split(/\r?\n/).filter(l => l.length >= 200 && l[7] === "3").forEach(l => { const seg = l[13];
      if (seg === "A"){ const oc = P(l, 231, 240), ok = !oc || /^(00|BD)/.test(oc);
        cur = {tipo: "pag", origem: "cnab240", pag: {data: data(P(l, 155, 162)) || data(P(l, 94, 101)), valor: (+P(l, 163, 177) || +P(l, 120, 134)) / 100, favNome: P(l, 44, 73), favDoc: "", ref: P(l, 74, 93), forma: "Crédito em conta (CNAB)", banco: `${P(l, 21, 23)} ag ${P(l, 24, 28)} cc ${P(l, 30, 41)}`, situacao: ok ? "efetuado" : "rejeitado (" + oc + ")"}};
        out.push(cur); }
      else if (seg === "B" && cur && !cur.pag.favDoc){ cur.pag.favDoc = dl(P(l, 19, 32)).replace(/^000(?=\d{11}$)/, ""); }
      else if (seg === "J"){ const oc = P(l, 231, 240); cur = {tipo: "pag", origem: "cnab240", pag: {data: data(P(l, 145, 152)), valor: +P(l, 153, 167) / 100, favNome: P(l, 62, 91), favDoc: "", ref: P(l, 183, 202), forma: "Boleto (CNAB)", banco: "", situacao: !oc || /^(00|BD)/.test(oc) ? "efetuado" : "rejeitado (" + oc + ")"}}; out.push(cur); }
    });
    out.forEach(o => { if (o.pag.favDoc && /^0+$/.test(o.pag.favDoc)) o.pag.favDoc = ""; if (o.pag.favDoc.length === 14 && o.pag.favDoc.startsWith("000") && IMP.docValido(o.pag.favDoc.slice(3))) o.pag.favDoc = o.pag.favDoc.slice(3); });
    return out.filter(o => o.pag.valor > 0);
  }
  /* extrato OFX: só os débitos (pagamentos) */
  function lerOFX(t){
    const out = [], tg = (b, n) => { const m = b.match(new RegExp("<" + n + ">([^<\\r\\n]*)", "i")); return m ? m[1].trim() : ""; };
    t.split(/<STMTTRN>/i).slice(1).forEach(b => { const v = num(tg(b, "TRNAMT").replace(",", ".")); if (v == null || v >= 0) return;
      const tx = tg(b, "NAME") + " " + tg(b, "MEMO"), dm = tx.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/);
      out.push({tipo: "pag", origem: "ofx", pag: {data: data(tg(b, "DTPOSTED")), valor: -v, favNome: tg(b, "NAME") || tg(b, "MEMO"), favDoc: dm ? dl(dm[0]) : "", ref: (tg(b, "MEMO") + " " + tg(b, "CHECKNUM")).trim(), forma: /SAQUE|ESP[EÉ]CIE|DINHEIRO/i.test(tx) ? "Espécie / saque" : tg(b, "TRNTYPE"), banco: "", situacao: "efetuado"}}); });
    return out;
  }
  /* comprovante de pagamento em PDF: valor, data e favorecido para conferência */
  async function lerComprovante(buf){
    const L = await IMP.lerPDF(buf), t = L.map(r => r.join(" ")).join("\n");
    const docs = [...t.matchAll(/\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2})\b/g)].map(m => dl(m[1])), cli = dl(CLI().doc);
    const fav = docs.find(d => supPorDoc(d)) || docs.find(d => d !== cli) || "";
    const vm = t.match(/valor[^\d]{0,30}([\d.]+,\d{2})/i), vals = [...t.matchAll(/\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g)].map(m => num(m[0]));
    const nm = t.match(/(?:favorecido|benefici[aá]rio|destinat[aá]rio|recebedor|para)\s*:?\s*([A-ZÀ-Ú][A-ZÀ-Úa-zà-ú0-9 .&\-]{3,60})/i);
    return {tipo: "pag", origem: "pdf", rev: true, pag: {data: data((t.match(/\b\d{2}\/\d{2}\/\d{4}\b/) || [""])[0]), valor: vm ? num(vm[1]) : (vals.length ? Math.max(...vals) : null), favNome: nm ? nm[1].trim() : (supPorDoc(fav)?.nome || ""), favDoc: fav,
      ref: ((t.match(/(?:NF|nota fiscal|NF-e)\s*(?:n[ºo°.]*)?\s*:?\s*(\d{1,9})/i) || [])[1] || ""), forma: /PIX/i.test(t) ? "PIX" : /TED/i.test(t) ? "TED" : /boleto/i.test(t) ? "Boleto" : /dep[oó]sito/i.test(t) ? "Depósito" : "", banco: "", situacao: "efetuado"}};
  }
  /* planilhas: mapeamento do cabeçalho por sinônimos (a ordem decide os conflitos) */
  const SYN = {
    nf: [["chave", /chave/], ["destDoc", /(dest|cliente|comprador).*(cnpj|cpf|doc)|(cnpj|cpf).*(dest|cliente|comprador)/], ["emitDoc", /(cnpj|cpf|doc)|emitente.*(cnpj|cpf)/], ["numero", /^n[uú]mero|^n[ºo°.]?\s*(da\s*)?(nf|nota)|^nf(-?e)?$|^nota( fiscal)?$|^num|^doc(umento)? fiscal/],
      ["serie", /s[eé]rie/], ["emissao", /emiss|^data|^dt/], ["emitNome", /emitente|fornecedor|raz[aã]o|remetente|^nome/], ["ncm", /ncm/], ["cfop", /cfop/], ["vUn", /unit[aá]r|pre[cç]o/],
      ["vTot", /valor.*(item|produto|mercad)|total.*(item|produto)/], ["vNF", /valor|total/], ["desc", /descri|produto|mercadoria|^item/], ["qtd", /quant|qtd|qtde|peso/], ["un", /^un|unid/], ["situacao", /situa|status/], ["pedidoRef", /pedido/], ["uf", /^uf/]],
    pag: [["favDoc", /cnpj|cpf|documento do|doc.*(fav|benef)/], ["data", /data|^dt|pagamento em|^dia/], ["valor", /valor|montante|quantia|^total/], ["favNome", /favorecido|benefici|fornecedor|nome|raz[aã]o|destinat/],
      ["ref", /nota|^nf|refer|fatura|t[ií]tulo|hist[oó]rico|descri/], ["pedido", /pedido/], ["forma", /forma|meio|modalidade|^tipo/], ["banco", /banco|conta|ag[eê]ncia/]],
    ped: [["fornDoc", /cnpj|cpf/], ["numero", /pedido|^n[uú]mero|^n[ºo°.]|^oc$|ordem/], ["data", /data|emiss|^dt/], ["fornNome", /fornecedor|raz[aã]o|nome/], ["ncm", /ncm/], ["vUn", /unit|pre[cç]o/], ["vTot", /total|valor/],
      ["desc", /produto|descri|item|mercadoria/], ["qtd", /quant|qtd|qtde|peso/], ["un", /^un|unid/], ["entrega", /entrega|prazo/]]};
  function mapa(rows, tipo){
    const S2 = SYN[tipo]; let hi = -1, idx = {};
    for (let r = 0; r < Math.min(rows.length, 12); r++){ const h = rows[r].map(c => String(c || "").toLowerCase().trim()), ix = {};
      S2.forEach(([k, re]) => { const i = h.findIndex((c, j) => c && c.length < 60 && re.test(c) && !Object.values(ix).includes(j)); if (i >= 0) ix[k] = i; });
      if (Object.keys(ix).length >= 3){ hi = r; idx = ix; break; } }
    if (hi < 0) return [];
    return rows.slice(hi + 1).filter(r => r.some(c => String(c || "").trim())).map(r => { const o = {}; Object.entries(idx).forEach(([k, i]) => o[k] = String(r[i] ?? "").trim()); return o; });
  }
  function deLinhasNF(L){
    const grupos = new Map();
    L.forEach(o => { const ch = dl(o.chave), k = ch.length === 44 ? ch : dl(o.emitDoc) + "|" + nz(o.serie) + "|" + nz(o.numero); if (!nz(o.numero) && ch.length !== 44) return;
      let g = grupos.get(k); const kk = ch.length === 44 ? daChave(ch) : {};
      if (!g){ g = {tipo: "nf", origem: "planilha", nf: {chave: ch.length === 44 ? ch : "", numero: nz(o.numero) || kk.numero, serie: nz(o.serie) || kk.serie || "0", modelo: "55", tp: "1", emissao: data(o.emissao), natOp: "",
        emitDoc: dl(o.emitDoc) || kk.doc || "", emitNome: o.emitNome || "", emitUF: (o.uf || kk.uf || "").toUpperCase().slice(0, 2), destDoc: dl(o.destDoc), itens: [], vNF: num(o.vNF), pedidoRef: o.pedidoRef || "",
        situacao: /cancel/i.test(o.situacao) ? "cancelada" : /deneg/i.test(o.situacao) ? "denegada" : /inutil/i.test(o.situacao) ? "inutilizada" : /autoriz|regular|normal/i.test(o.situacao) ? "autorizada" : "nao_verificada", sitFonte: o.situacao ? "planilha do cliente" : ""}}; grupos.set(k, g); }
      if (o.desc || o.ncm || o.qtd) g.nf.itens.push({desc: o.desc || "", ncm: dl(o.ncm), cfop: dl(o.cfop), un: o.un || "", qtd: num(o.qtd), vUn: num(o.vUn), vTot: num(o.vTot) ?? (num(o.qtd) != null && num(o.vUn) != null ? num(o.qtd) * num(o.vUn) : null)});
    });
    const out = [...grupos.values()]; out.forEach(g => { if (g.nf.vNF == null) g.nf.vNF = g.nf.itens.reduce((t, i) => t + (i.vTot || 0), 0) || null; }); return out;
  }
  const dePag = L => L.map(o => ({tipo: "pag", origem: "planilha", pag: {data: data(o.data), valor: Math.abs(num(o.valor) || 0), favNome: o.favNome || "", favDoc: dl(o.favDoc), ref: [o.ref, o.pedido ? "pedido " + o.pedido : ""].filter(Boolean).join(" "), forma: o.forma || "", banco: o.banco || "", situacao: "efetuado"}})).filter(o => o.pag.valor > 0 && o.pag.data);
  const dePed = L => { const g = new Map(); L.forEach(o => { const k = String(o.numero || "").trim(); if (!k) return; let p = g.get(k + "|" + dl(o.fornDoc));
    if (!p){ p = {tipo: "ped", origem: "planilha", ped: {numero: k, data: data(o.data), fornDoc: dl(o.fornDoc), fornNome: o.fornNome || "", itens: [], vTot: 0, entrega: data(o.entrega)}}; g.set(k + "|" + dl(o.fornDoc), p); }
    p.ped.itens.push({desc: o.desc || "", ncm: dl(o.ncm), un: o.un || "", qtd: num(o.qtd), vUn: num(o.vUn), vTot: num(o.vTot) ?? ((num(o.qtd) || 0) * (num(o.vUn) || 0))}); });
    const out = [...g.values()]; out.forEach(p => p.ped.vTot = p.ped.itens.reduce((t, i) => t + (i.vTot || 0), 0)); return out; };
  async function linhasDe(f, buf){
    const n = f.name.toLowerCase();
    if (/\.xlsx$|\.xlsm$/.test(n)) return await IMP.lerXLSX(buf);
    if (/\.ods$/.test(n)) return await IMP.lerODS(buf);
    if (/\.docx$/.test(n)){ const d = await IMP.lerDOCX(buf); return d.tabela || d.linhas.map(l => [l]); }
    if (/\.pdf$/.test(n)) return await IMP.lerPDF(buf);
    const t = texto(buf), ls = t.split(/\r?\n/).filter(l => l.trim()); if (!ls.length) return [];
    const sep = ["\t", ";", "|", ","].map(c => [c, ls[0].split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    return ls.map(l => { const out = []; let cur = "", q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === sep && !q){ out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(x => x.trim()); });
  }
  const texto = buf => { let t = new TextDecoder("utf-8").decode(buf); if (t.includes("\uFFFD")) t = new TextDecoder("latin1").decode(buf); return t; };

  /* lê um arquivo de acordo com o tipo escolhido; devolve {itens, eventos, aviso} */
  async function ler(f, tipo){
    const n = f.name.toLowerCase(), buf = await f.arrayBuffer(), img = /\.(jpe?g|png|heic|webp)$/.test(n);
    if (tipo === "nf"){
      if (/\.xml$/.test(n)){ const r = lerXML(texto(buf)); return {itens: r.notas, eventos: r.eventos}; }
      if (/\.zip$/.test(n)){ const z = await IMP.unzip(buf), itens = [], eventos = []; for (const k of Object.keys(z).filter(k => /\.xml$/i.test(k))){ const r = lerXML(await z[k].get()); itens.push(...r.notas); eventos.push(...r.eventos); } return {itens, eventos}; }
      if (/\.pdf$/.test(n)){ const L = await IMP.lerPDF(buf); const tabela = deLinhasNF(mapa(L, "nf")); if (tabela.length > 1) return {itens: tabela};
        return {itens: [await lerDANFE(buf)], anexar: true}; }
      if (img) return {itens: [{tipo: "nf", origem: "imagem", rev: true, nf: {chave: "", numero: "", serie: "", modelo: "55", tp: "1", emissao: "", emitDoc: "", destDoc: "", itens: [{desc: "", ncm: "", cfop: "", un: "KG", qtd: null}], vNF: null, situacao: "nao_verificada"}}], anexar: true};
      if (/\.txt$/.test(n)){ const t = texto(buf); if (/^\|0000\|/m.test(t)) return {itens: lerSPED(t), aviso: "SPED Fiscal: notas de entrada (compras) do cliente."}; }
      return {itens: deLinhasNF(mapa(await linhasDe(f, buf), "nf"))};
    }
    if (tipo === "pag"){
      if (/\.ofx$/.test(n)) return {itens: lerOFX(texto(buf))};
      const t0 = /\.(ret|rem|txt|cnab|240)$/.test(n) ? texto(buf) : "";
      if (t0 && t0.split(/\r?\n/).some(l => l.length >= 240 && l[7] === "3")) return {itens: lerCNAB240(t0)};
      if (t0 && /<STMTTRN>/i.test(t0)) return {itens: lerOFX(t0)};
      if (/\.pdf$/.test(n)){ const L = await IMP.lerPDF(buf), tab = dePag(mapa(L, "pag")); if (tab.length > 1) return {itens: tab}; return {itens: [await lerComprovante(buf)], anexar: true}; }
      if (img) return {itens: [{tipo: "pag", origem: "imagem", rev: true, pag: {data: "", valor: null, favNome: "", favDoc: "", ref: "", forma: "", banco: "", situacao: "efetuado"}}], anexar: true};
      return {itens: dePag(mapa(await linhasDe(f, buf), "pag"))};
    }
    if (tipo === "ped"){
      if (img) return {itens: [{tipo: "ped", origem: "imagem", rev: true, ped: {numero: "", data: "", fornDoc: "", fornNome: "", itens: [{desc: "", ncm: "", un: "KG", qtd: null, vUn: null}], vTot: null}}], anexar: true};
      const it = dePed(mapa(await linhasDe(f, buf), "ped"));
      if (!it.length && /\.pdf$/.test(n)){ const L = await IMP.lerPDF(buf), t = L.map(r => r.join(" ")).join("\n"), doc = (t.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g) || []).map(dl).find(d => supPorDoc(d)) || "";
        return {itens: [{tipo: "ped", origem: "pdf", rev: true, ped: {numero: (t.match(/pedido\s*(?:de compra)?\s*(?:n[ºo°.]*)?\s*:?\s*([A-Z0-9\-\/]{2,20})/i) || [])[1] || "", data: data((t.match(/\b\d{2}\/\d{2}\/\d{4}\b/) || [""])[0]), fornDoc: doc, fornNome: supPorDoc(doc)?.nome || "",
          itens: [{desc: (t.split("\n").find(l => SEG.kw && SEG.kw.test(l)) || "").slice(0, 120), ncm: "", un: "KG", qtd: null, vUn: null}], vTot: null}}], anexar: true}; }
      return {itens: it};
    }
    return {itens: []};
  }

  /* =================================================================== ANÁLISE */
  const supPorDoc = d => { d = dl(d); return d ? S.suppliers.find(s => dl(s.doc) === d) : null; };
  const demo = s => /(^|_)ex-/.test(s?.id || "");
  const compradorEsperado = s => s.nivel === "N1" ? {doc: dl(CLI().doc), nome: CLI().nome} : (() => { const p = supById(s.parentId); return p ? {doc: dl(p.doc), nome: p.nome} : null; })();
  const fornDaNF = nf => nf.tp === "0" ? {doc: dl(nf.destDoc), nome: nf.destNome} : {doc: dl(nf.emitDoc), nome: nf.emitNome};
  const compDaNF = nf => nf.tp === "0" ? {doc: dl(nf.emitDoc), nome: nf.emitNome} : {doc: dl(nf.destDoc), nome: nf.destNome};
  const ops = () => S.operacoes || [];
  let cache = null;
  function analise(){
    const O = ops();
    if (cache && cache.o === O && cache.s === S.suppliers && cache.c === S.config && cache.q === S.cotAuto && cache.h === S.cotHist) return cache.r;
    const nfs = O.filter(o => o.tipo === "nf" && o.nf), pags = O.filter(o => o.tipo === "pag" && o.pag && !/rejeit/.test(o.pag.situacao || "")), peds = O.filter(o => o.tipo === "ped" && o.ped);
    const R = nfs.map(o => { const f = fornDaNF(o.nf); return {o, nf: o.nf, forn: f, sup: supPorDoc(f.doc) || (o.supplierId ? supById(o.supplierId) : null), alertas: [], pags: [], ped: null, kg: o.nf.itens.reduce((t, i) => t + (emKg(i.qtd, i.un) || 0), 0)}; });
    const al = (x, cod, sev, txt) => x.alertas.push({cod, sev, txt});
    const hoje = new Date().toISOString().slice(0, 10);
    /* notas: verificações individuais */
    R.forEach(x => { const nf = x.nf, s = x.sup;
      if (nf.chave){ const ch = dl(nf.chave);
        if (!chaveOk(ch)) al(x, "chave_inv", "alto", "Chave de acesso inválida: o dígito verificador não confere (indício de nota falsa ou digitada errada)");
        else { const k = daChave(ch), div = [];
          if (dl(nf.emitDoc) && k.doc.replace(/^000(?=\d{11}$)/, "") !== dl(nf.emitDoc) && k.doc !== dl(nf.emitDoc)) div.push("CNPJ/CPF do emitente");
          if (nf.numero && k.numero !== nz(nf.numero)) div.push("número"); if (nf.serie && k.serie !== (nz(nf.serie) || "0")) div.push("série");
          if (nf.emissao && k.aamm !== nf.emissao.slice(2, 4) + nf.emissao.slice(5, 7)) div.push("mês de emissão"); if (nf.emitUF && k.uf && k.uf !== nf.emitUF) div.push("UF");
          if (div.length) al(x, "chave_div", "alto", "Chave de acesso não corresponde aos dados da nota (" + div.join(", ") + ")"); } }
      else if (nf.modelo === "55") al(x, "chave_falta", "baixo", "Nota sem chave de acesso informada");
      if (dl(nf.emitDoc) && !IMP.docValido(nf.emitDoc) && !demo(s)) al(x, "doc_inv", "alto", "CNPJ/CPF do emitente inválido (dígito verificador)");
      if (!s) al(x, "nao_cad", "medio", `Fornecedor ${docFmt(x.forn.doc) || "sem documento"} não cadastrado na cadeia`);
      if (!s){ const c = (S.config.consultas || {})[x.forn.doc]; if (c && !c.erro){
        if (c.situacao && c.situacao !== "ATIVA") al(x, "cnpj_inapto", "alto", `Emitente com situação "${c.situacao}" na Receita Federal (nota inidônea)`);
        if (c.abertura && nf.emissao && nf.emissao < c.abertura) al(x, "abertura", "alto", "Nota emitida antes da abertura do CNPJ do emitente");
        if (SEG.kw && (c.cnaeDesc || "") && !SEG.kw.test([c.cnaeDesc, ...((c.receita?.cnaesSec) || [])].join(" "))) al(x, "cnae_ext", "medio", `Atividade do emitente na Receita (${c.cnaeDesc}) não inclui ${SEG.prod}`); }
        (c?.listas || []).forEach(l => al(x, "lista", "alto", `Emitente ou sócio consta em: ${l.rotulo}`)); }
      if (s){ const esp = compradorEsperado(s), c = compDaNF(nf);
        if (esp && esp.doc && c.doc && esp.doc !== c.doc) al(x, "dest_div", "medio", `Comprador na nota (${docFmt(c.doc)}) diferente do comprador na cadeia (${esp.nome})`);
        if (nf.tp !== "0" && nf.emitUF && s.uf && nf.emitUF !== s.uf) al(x, "uf_div", "baixo", `UF do emitente na nota (${nf.emitUF}) diferente da cadastrada (${s.uf})`);
        const sit = s.invest?.situacao; if (sit && sit !== "Ativa") al(x, "cnpj_inapto", "alto", `Nota emitida por CNPJ com situação "${sit}" na Receita Federal (nota inidônea)`);
        if (s.abertura && nf.emissao && nf.emissao < s.abertura) al(x, "abertura", "alto", "Nota emitida antes da data de abertura do CNPJ"); }
      if (nf.situacao === "cancelada") al(x, "sit_canc", "alto", "Nota cancelada" + (nf.sitFonte ? " (" + nf.sitFonte + ")" : ""));
      else if (nf.situacao === "denegada") al(x, "sit_den", "alto", "Uso denegado: emitente com irregularidade fiscal na SEFAZ");
      else if (nf.situacao === "inutilizada") al(x, "sit_inut", "alto", "Numeração inutilizada informada como nota");
      else if (nf.situacao !== "autorizada") al(x, "sit_nv", "info", "Situação na SEFAZ ainda não confirmada");
      if (nf.emissao && nf.emissao > hoje) al(x, "futura", "alto", "Data de emissão no futuro");
      if (nf.emissao && [0, 6].includes(new Date(nf.emissao + "T12:00").getDay())) al(x, "fds", "info", "Emitida em fim de semana");
      const its = nf.itens || [];
      if (its.length && SEG.ncm.length){ const ok = its.filter(itemDoProduto);
        if (!ok.length && its.some(i => dl(i.ncm) || i.desc)) al(x, "produto", "alto", `Objeto da nota não é ${SEG.prod} (NCM ${[...new Set(its.map(i => i.ncm).filter(Boolean))].join(", ") || "—"}: ${its[0].desc || "sem descrição"})`);
        else if (ok.length < its.length) al(x, "produto_parc", "medio", `${its.length - ok.length} item(ns) da nota fora de ${SEG.prod}`); }
      const cf = [...new Set(its.map(i => dl(i.cfop)).filter(Boolean))].filter(c => !CFOP_OK.test(c));
      if (cf.length) al(x, "cfop", "medio", `CFOP ${cf.join(", ")} não é de compra e venda de mercadoria${cf.some(c => /949$/.test(c)) ? " (outras saídas não especificadas)" : ""}`);
      const soma = its.reduce((t, i) => t + (i.vTot || 0), 0);
      if (nf.vNF && soma && Math.abs(soma - nf.vNF) / nf.vNF > .1) al(x, "soma", "medio", `Soma dos itens (${brl(soma)}) diferente do total da nota (${brl(nf.vNF)})`);
      const rq = typeof COTA !== "undefined" && COTA.refKgEm ? COTA.refKgEm(nf.emissao, s?.uf) : null, rk = rq?.kg;
      if (rk && x.kg && nf.vNF && nf.situacao !== "cancelada"){ const p = nf.vNF / x.kg, r = p / rk, base = `Preço da nota R$ ${fmt(p, 2)}/kg × cotação R$ ${fmt(rk, 2)}/kg${rq.data ? " em " + dBR(String(rq.data).slice(0, 10)) : ""} (${rq.fonte})`;
        if (r < .8) al(x, "abaixo_ref", r < .6 ? "alto" : "medio", `${base}: ${fmt((1 - r) * 100)}% abaixo da cotação do dia. Investigar compra sem nota ou complemento em dinheiro, subfaturamento (sonegação) e origem ilícita do material`);
        else if (r > 1.3) al(x, "acima_ref", r > 1.6 ? "alto" : "medio", `${base}: ${fmt((r - 1) * 100)}% acima da cotação do dia. Investigar superfaturamento, lavagem de dinheiro e pagamento de vantagem a terceiros`); }
      if (nf.vNF >= 10000 && nf.situacao !== "cancelada" && Math.abs(nf.vNF % 1000) < .005) al(x, "redondo", "baixo", `Valor redondo (${brl(nf.vNF)}): conferir se a nota reflete pesagem e preço reais`);
      if (nf.numero && +nf.numero <= 20 && nf.vNF >= 100000) al(x, "poucas", "baixo", `Numeração muito baixa (nota nº ${nf.numero}) para valor de ${brl(nf.vNF)}: emitente com pouca atividade`);
    });
    /* duplicidade, ordem e sequência por emitente e série */
    const porEm = new Map(); R.forEach(x => { if (!dl(x.nf.emitDoc) || !x.nf.numero) return; const k = dl(x.nf.emitDoc) + "|" + (x.nf.serie || "0"); (porEm.get(k) || porEm.set(k, []).get(k)).push(x); });
    const seqSup = new Map();
    porEm.forEach(L => { L.sort((a, b) => +a.nf.numero - +b.nf.numero);
      for (let i = 1; i < L.length; i++){ const a = L[i - 1], b = L[i];
        if (a.nf.numero === b.nf.numero && dl(a.nf.chave) !== dl(b.nf.chave)){ al(b, "dup", "alto", `Número ${b.nf.numero} repetido para o mesmo emitente e série`); al(a, "dup", "alto", `Número ${a.nf.numero} repetido para o mesmo emitente e série`); }
        else if (a.nf.emissao && b.nf.emissao && b.nf.emissao < a.nf.emissao) al(b, "ordem", "medio", `Numeração fora da ordem das datas: nº ${b.nf.numero} emitida antes da nº ${a.nf.numero}`); }
      const u = [...new Set(L.map(x => +x.nf.numero))].sort((a, b) => a - b); let cons = 0; for (let i = 1; i < u.length; i++) if (u[i] - u[i - 1] === 1) cons++;
      if (u.length >= 3 && cons / (u.length - 1) >= .6 && L[0].nf.tp !== "0"){
        const sev = u.length >= 5 ? "alto" : "medio", txt = `${u.length} notas com numeração sequencial (nº ${u[0]} a ${u[u.length - 1]}): o emitente parece emitir notas só para esta cadeia (indício de empresa de fachada ou "noteira")`;
        L.forEach(x => al(x, "seq", sev, txt)); if (L[0].sup) seqSup.set(L[0].sup.id, {sev, txt}); } });
    /* preço unitário muito abaixo da média do mesmo produto */
    const ref = new Map(); R.forEach(x => x.nf.itens.forEach(i => { const kg = emKg(i.qtd, i.un); if (kg && i.vTot) { const k = dl(i.ncm).slice(0, 4) || "x"; (ref.get(k) || ref.set(k, []).get(k)).push(i.vTot / kg); } }));
    const med = a => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
    R.forEach(x => x.nf.itens.forEach(i => { const kg = emKg(i.qtd, i.un), k = dl(i.ncm).slice(0, 4) || "x", L = ref.get(k); if (kg && i.vTot && L && L.length >= 4){ const m = med(L), p = i.vTot / kg; if (p < m * .6) al(x, "preco", "medio", `Preço por kg ${fmt((1 - p / m) * 100)}% abaixo da média das notas do mesmo produto (R$ ${fmt(p, 2)} × R$ ${fmt(m, 2)})`); } }));
    /* pedidos × notas */
    const P = peds.map(o => ({o, ped: o.ped, sup: supPorDoc(o.ped.fornDoc), nfs: []}));
    const nPed = v => dl(v).replace(/^0+/, "");
    /* preço por kg muito diferente das demais notas do mesmo fornecedor */
    const porF = new Map(); R.forEach(x => { if (!x.kg || !x.nf.vNF || x.nf.situacao === "cancelada") return; const k = x.sup?.id || dl(x.forn.doc); if (!k) return; (porF.get(k) || porF.set(k, []).get(k)).push(x); });
    porF.forEach(L => { if (L.length < 3) return; const ps = L.map(x => x.nf.vNF / x.kg).sort((a, b) => a - b), m = ps[Math.floor(ps.length / 2)];
      L.forEach(x => { const p = x.nf.vNF / x.kg; if (p < m * .6 || p > m * 1.6) al(x, "var_preco", "medio", `Preço por kg (R$ ${fmt(p, 2)}) muito diferente da média das notas do mesmo fornecedor (R$ ${fmt(m, 2)}/kg): conferir pesagem, produto e pagamento`); }); });
    R.forEach(x => { const r = nPed(x.nf.pedidoRef); let p = r ? P.find(p => nPed(p.ped.numero) === r) : null;
      if (!p && x.sup) p = P.filter(p => p.sup && p.sup.id === x.sup.id && p.ped.data && x.nf.emissao && ts(x.nf.emissao) >= ts(p.ped.data) - 5 * DIA && ts(x.nf.emissao) - ts(p.ped.data) <= 120 * DIA)
        .sort((a, b) => ts(b.ped.data) - ts(a.ped.data)).find(p => { const q = p.ped.itens.reduce((t, i) => t + (emKg(i.qtd, i.un) || 0), 0); return (q && x.kg && Math.abs(x.kg - q) / q <= .2) || (p.ped.vTot && x.nf.vNF && Math.abs(x.nf.vNF - p.ped.vTot) / p.ped.vTot <= .2); });
      if (p){ x.ped = p; p.nfs.push(x); if (p.sup && x.sup && p.sup.id !== x.sup.id) al(x, "ped_forn", "alto", `Pedido ${p.ped.numero} é de outro fornecedor (${p.sup.nome})`);
        if (p.ped.data && x.nf.emissao && x.nf.emissao < p.ped.data) al(x, "ped_data", "baixo", `Nota emitida antes do pedido ${p.ped.numero} (${dBR(p.ped.data)})`);
        const pi = p.ped.itens[0], ni = x.nf.itens[0];
        if (pi && ni && dl(pi.ncm) && dl(ni.ncm) && dl(pi.ncm).slice(0, 4) !== dl(ni.ncm).slice(0, 4)) al(x, "ped_prod", "medio", `Produto da nota (NCM ${ni.ncm}) diferente do pedido ${p.ped.numero} (NCM ${pi.ncm})`);
        const pu = pi && pi.vUn, nu = ni && (ni.vUn || (ni.vTot && ni.qtd ? ni.vTot / ni.qtd : null));
        if (pu && nu && String(pi.un).toUpperCase() === String(ni.un).toUpperCase() && Math.abs(nu - pu) / pu > .05) al(x, "ped_preco", "medio", `Preço unitário da nota (R$ ${fmt(nu, 2)}) difere ${fmt((nu / pu - 1) * 100, 1)}% do pedido ${p.ped.numero} (R$ ${fmt(pu, 2)})`); }
      else if (P.length && x.sup) al(x, "sem_ped", "baixo", "Nota sem pedido de compra correspondente"); });
    P.forEach(p => { if (!p.nfs.length) return; const q = p.ped.itens.reduce((t, i) => t + (emKg(i.qtd, i.un) || 0), 0), k = p.nfs.reduce((t, x) => t + x.kg, 0);
      if (q && k && k > q * 1.05) p.nfs.forEach(x => al(x, "ped_qtd", "medio", `Notas do pedido ${p.ped.numero} somam ${fmt(k / 1000, 1)} t, acima das ${fmt(q / 1000, 1)} t pedidas`)); });
    /* pagamentos × notas */
    const G = pags.map(o => ({o, pag: o.pag, sup: supPorDoc(o.pag.favDoc), nfs: [], alertas: []}));
    G.forEach(g => { const refs = (String(g.pag.ref || "").match(/\d{1,9}/g) || []).map(nz).filter(Boolean);
      /* pela referência (número da nota no histórico): vale se o favorecido é o fornecedor da nota ou se o valor é compatível */
      const cand = refs.length ? R.filter(x => refs.includes(x.nf.numero) && ((g.sup && x.sup && g.sup.id === x.sup.id) || (x.nf.vNF && Math.abs(x.nf.vNF - g.pag.valor) / x.nf.vNF <= .2))) : [];
      let alvo = g.sup ? cand.filter(x => x.sup?.id === g.sup.id) : []; if (!alvo.length) alvo = cand;
      if (!alvo.length && g.sup) { const c = R.filter(x => x.sup?.id === g.sup.id && x.nf.vNF && Math.abs(x.nf.vNF - g.pag.valor) / x.nf.vNF <= .01 && !x.pags.length && x.nf.emissao && g.pag.data && ts(g.pag.data) - ts(x.nf.emissao) >= -60 * DIA && ts(g.pag.data) - ts(x.nf.emissao) <= 180 * DIA)
        .sort((a, b) => Math.abs(ts(g.pag.data) - ts(a.nf.emissao)) - Math.abs(ts(g.pag.data) - ts(b.nf.emissao)))[0]; if (c) alvo = [c]; }
      alvo.slice(0, 1).forEach(x => { g.nfs.push(x); x.pags.push(g); }); });
    R.forEach(x => { if (!x.pags.length){ if (G.length && x.sup && x.nf.emissao && (Date.now() - ts(x.nf.emissao)) / DIA > 60 && x.nf.situacao !== "cancelada") al(x, "sem_pag", "baixo", "Nota com mais de 60 dias sem pagamento identificado"); return; }
      const fd = dl(x.forn.doc), pago = x.pags.reduce((t, g) => t + g.pag.valor, 0);
      x.pags.forEach(g => { const fav = dl(g.pag.favDoc);
        if (fav && fd && fav !== fd) al(x, "pag_terc", "alto", `Pagamento de ${brl(g.pag.valor)} em ${dBR(g.pag.data)} a terceiro: favorecido ${g.pag.favNome || ""} (${docFmt(fav)})${fav.length === 11 && fd.length === 14 ? ", pessoa física" : ""}, e não ao emitente da nota`);
        if (/esp[eé]cie|dinheiro|saque/i.test(g.pag.forma || "")) al(x, "pag_esp", "alto", `Pagamento em espécie (${brl(g.pag.valor)} em ${dBR(g.pag.data)})`);
        if (x.nf.situacao === "cancelada") al(x, "pag_canc", "alto", `Pagamento de ${brl(g.pag.valor)} para nota cancelada`);
        if (g.pag.data && x.nf.emissao && ts(x.nf.emissao) - ts(g.pag.data) > 30 * DIA && !x.ped) al(x, "pag_antes", "baixo", `Pago ${Math.round((ts(x.nf.emissao) - ts(g.pag.data)) / DIA)} dias antes da emissão da nota, sem pedido`); });
      if (x.nf.vNF && pago > x.nf.vNF * 1.01) al(x, "pag_maior", "medio", `Pago ${brl(pago)}, acima do valor da nota (${brl(x.nf.vNF)})`); });
    G.forEach(g => { if (!g.nfs.length) g.alertas.push({cod: "pag_sem_nf", sev: g.sup ? "medio" : "medio", txt: `Pagamento de ${brl(g.pag.valor)} em ${dBR(g.pag.data)} sem nota fiscal correspondente${g.sup ? "" : " (favorecido não cadastrado)"}`});
      if (/esp[eé]cie|dinheiro|saque/i.test(g.pag.forma || "") && !g.nfs.length) g.alertas.push({cod: "pag_esp", sev: "alto", txt: `Pagamento em espécie (${brl(g.pag.valor)} em ${dBR(g.pag.data)})`}); });
    /* fracionamento: 3 ou mais pagamentos ao mesmo favorecido em até 3 dias, cada um abaixo de R$ 50 mil e somando R$ 50 mil ou mais */
    const porFav = new Map(); G.forEach(g => { const k = dl(g.pag.favDoc) || (g.pag.favNome || "").toUpperCase(); if (k) (porFav.get(k) || porFav.set(k, []).get(k)).push(g); });
    const fracSup = new Map();
    porFav.forEach(L => { L.sort((a, b) => ts(a.pag.data) - ts(b.pag.data)); for (let i = 0; i < L.length; i++){ const jan = L.filter(g => ts(g.pag.data) >= ts(L[i].pag.data) && ts(g.pag.data) - ts(L[i].pag.data) <= 3 * DIA && g.pag.valor < 50000);
      if (jan.length >= 3 && jan.reduce((t, g) => t + g.pag.valor, 0) >= 50000){ const txt = `${jan.length} pagamentos fracionados ao mesmo favorecido em até 3 dias, somando ${brl(jan.reduce((t, g) => t + g.pag.valor, 0))}`;
        jan.forEach(g => { if (!g.alertas.some(a => a.cod === "frac")) g.alertas.push({cod: "frac", sev: "medio", txt}); }); const sp = jan[0].sup || jan[0].nfs[0]?.sup; if (sp) fracSup.set(sp.id, txt); break; } } });
    /* capacidade: volume faturado em 12 meses acima do volume anual declarado */
    const capSup = new Map(), ano = Date.now() - 365 * DIA;
    S.suppliers.forEach(s => { const vol = parseFloat(String(s.volume || "").replace(",", ".")); if (!vol) return; const kg = R.filter(x => x.sup?.id === s.id && ts(x.nf.emissao) >= ano && x.nf.situacao !== "cancelada").reduce((t, x) => t + x.kg, 0);
      if (kg > vol * 1000 * 1.2) capSup.set(s.id, `Volume faturado em 12 meses (${fmt(kg / 1000, 1)} t) acima da capacidade anual declarada (${fmt(vol, 1)} t)`); });
    /* consolidação por fornecedor */
    const porSup = new Map(), addS = (id, a) => { if (!id) return; (porSup.get(id) || porSup.set(id, []).get(id)).push(a); };
    R.forEach(x => x.alertas.forEach(a => addS(x.sup?.id, {...a, ref: x})));
    G.forEach(g => g.alertas.forEach(a => addS(g.sup?.id, {...a, refPag: g})));
    capSup.forEach((txt, id) => addS(id, {cod: "capac", sev: "alto", txt}));
    /* mapeamento automático: quem vende para o cliente (N1), para um N1 (N2) ou para um N2 (N3) e ainda não está na cadeia */
    const cliDoc = dl(CLI().doc), sug = new Map(), ano2 = Date.now() - 365 * DIA;
    R.forEach(x => { if (x.sup || !x.forn.doc || x.forn.doc === cliDoc || x.nf.situacao === "cancelada" || !IMP.docValido(x.forn.doc)) return; const c = compDaNF(x.nf); let pai = null, nivel = "";
      if (c.doc && cliDoc && c.doc === cliDoc) nivel = "N1"; else { const b = supPorDoc(c.doc); if (b && b.nivel !== "N3"){ pai = b; nivel = b.nivel === "N1" ? "N2" : "N3"; } }
      if (!nivel) return; const k = x.forn.doc + "|" + (pai ? pai.id : "");
      const v = sug.get(k) || {doc: x.forn.doc, nome: "", nivel, pai, uf: "", mun: "", notas: 0, kg: 0, kg12: 0, valor: 0, ultima: "", fontes: new Set()};
      v.nome = v.nome || x.forn.nome || ""; v.uf = v.uf || (x.nf.tp === "0" ? x.nf.destUF : x.nf.emitUF) || ""; v.mun = v.mun || (x.nf.tp === "0" ? "" : x.nf.emitMun) || "";
      v.notas++; v.kg += x.kg; if (ts(x.nf.emissao) >= ano2) v.kg12 += x.kg; v.valor += x.nf.vNF || 0; if (x.nf.emissao > v.ultima) v.ultima = x.nf.emissao; v.fontes.add(x.o.origem); sug.set(k, v); });
    const r = {R, G, P, porSup, seqSup, fracSup, capSup, temPed: P.length > 0, temPag: G.length > 0, sug: [...sug.values()].sort((a, b) => a.nivel.localeCompare(b.nivel) || b.valor - a.valor)};
    cache = {o: O, s: S.suppliers, c: S.config, q: S.cotAuto, h: S.cotHist, r}; return r;
  }
  const nivelMax = L => L.some(a => a.sev === "alto") ? "alto" : L.some(a => a.sev === "medio") ? "medio" : L.some(a => a.sev === "baixo") ? "baixo" : "";
  const ROT = {chave_inv: "Chave de acesso inválida", chave_div: "Chave de acesso não confere com a nota", chave_falta: "Nota sem chave de acesso", doc_inv: "CNPJ/CPF do emitente inválido", dest_div: "Comprador na nota diferente da cadeia",
    uf_div: "UF do emitente diferente da cadastrada", cnpj_inapto: "Nota emitida por CNPJ irregular na Receita", abertura: "Nota anterior à abertura do CNPJ", sit_canc: "Nota cancelada", sit_den: "Nota com uso denegado", sit_inut: "Numeração inutilizada",
    futura: "Nota com data futura", produto: "Objeto da nota diferente do produto negociado", produto_parc: "Itens da nota fora do produto negociado", cfop: "CFOP sem natureza de compra e venda", soma: "Soma dos itens diferente do total da nota",
    poucas: "Emitente com numeração muito baixa", dup: "Número de nota repetido", ordem: "Numeração fora da ordem das datas", seq: "Notas com numeração sequencial (possível noteira)", preco: "Preço muito abaixo da média",
    ped_forn: "Pedido de outro fornecedor", ped_data: "Nota anterior ao pedido", ped_prod: "Produto diferente do pedido", ped_preco: "Preço diferente do pedido", ped_qtd: "Quantidade faturada acima do pedido", sem_ped: "Nota sem pedido de compra",
    sem_pag: "Nota sem pagamento identificado", pag_terc: "Pagamento a terceiro (favorecido diferente do emitente)", pag_esp: "Pagamento em espécie", pag_canc: "Pagamento de nota cancelada", pag_antes: "Pagamento antecipado sem pedido",
    pag_maior: "Pago acima do valor da nota", lista: "Emitente em lista restritiva", abaixo_ref: "Preço abaixo da cotação do dia", acima_ref: "Preço acima da cotação do dia", var_preco: "Preço fora da média do fornecedor", redondo: "Valor redondo", cnae_ext: "Atividade do emitente sem o produto", pag_sem_nf: "Pagamento sem nota fiscal", frac: "Pagamentos fracionados", capac: "Volume faturado acima da capacidade declarada"};

  /* matriz de risco: um ponto por tipo de alerta, com o peso do alerta mais grave */
  EXT_RISKS.push((s, add) => {
    const L = (analise().porSup.get(s.id) || []).filter(a => a.sev !== "info"); if (!L.length) return;
    const g = new Map(); L.forEach(a => { const k = a.cod; const v = g.get(k) || {n: 0, sev: "baixo", txt: a.txt, notas: new Set()}; v.n++; if (PESO[a.sev] > PESO[v.sev]) { v.sev = a.sev; v.txt = a.txt; } if (a.ref) v.notas.add(a.ref.nf.numero); g.set(k, v); });
    g.forEach((v, k) => add("Operações comerciais", `${ROT[k] || k} — ${v.notas.size > 1 ? v.notas.size + " notas; " : ""}${v.txt}`, PESO[v.sev]));
  });
  EXT_TOUCH.push(s => analise().R.some(x => x.sup?.id === s.id) || analise().G.some(g => g.sup?.id === s.id));

  /* =================================================================== TELAS */
  const TIPO_TX = {nf: "notas fiscais", pag: "pagamentos", ped: "pedidos de compra"};
  const FORMATOS = {nf: "XML da NF-e (um ou vários, ou ZIP com os XMLs), DANFE em PDF (cópia ou espelho), foto da nota, planilha Excel/ODS/CSV da base de notas, SPED Fiscal (EFD ICMS/IPI, .txt)",
    pag: "Retorno bancário CNAB 240 (.ret/.txt), extrato OFX, planilha Excel/ODS/CSV, comprovante em PDF ou foto (PIX, TED, depósito, boleto)",
    ped: "Planilha Excel/ODS/CSV, Word, pedido em PDF ou foto"};
  const ACEITA = {nf: ".xml,.zip,.pdf,.xlsx,.xlsm,.ods,.csv,.txt,.docx,image/*", pag: ".ret,.txt,.cnab,.240,.ofx,.pdf,.xlsx,.xlsm,.ods,.csv,image/*", ped: ".xlsx,.xlsm,.ods,.csv,.txt,.docx,.pdf,image/*"};
  const sevPill = sev => sev ? `<span class="pill ${sev === "alto" ? "r-alto" : sev === "medio" ? "r-medio" : sev === "baixo" ? "r-baixo" : "r-pend"}" style="font-size:10.5px;padding:1px 8px">${SEV_TX[sev]}</span>` : `<span class="pill r-baixo" style="font-size:10.5px;padding:1px 8px">OK</span>`;
  const SIT_TX = {autorizada: "Autorizada", cancelada: "Cancelada", denegada: "Denegada", inutilizada: "Inutilizada", nao_verificada: "A verificar"};
  const sitPill = s => `<span class="pill ${s === "autorizada" ? "r-baixo" : s === "nao_verificada" || !s ? "r-pend" : "r-alto"}" style="font-size:10.5px;padding:1px 8px">${SIT_TX[s] || "A verificar"}</span>`;
  const URL_SEFAZ = "https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=";
  const prodTx = nf => { const i = (nf.itens || [])[0]; return i ? (i.desc || (i.ncm ? "NCM " + i.ncm : "—")) + ((nf.itens || []).length > 1 ? ` (+${nf.itens.length - 1})` : "") : "—"; };
  const qtdTx = nf => { const it = nf.itens || []; if (!it.length) return "—"; const kg = it.reduce((t, i) => t + (emKg(i.qtd, i.un) || 0), 0); return kg ? (kg >= 1000 ? fmt(kg / 1000, 1) + " t" : fmt(kg) + " kg") : it[0].qtd != null ? fmt(it[0].qtd) + " " + (it[0].un || "") : "—"; };
  S.opsF = S.opsF || {nivel: "todos", sev: "todos", q: "", sup: "", de: "", ate: ""};

  function render(){
    const host = $("#operacoes"); if (!host) return;
    const A = analise(), F = S.opsF, ed = Store.me.canEdit;
    const q = F.q.trim().toLowerCase();
    let L = A.R.filter(x => (F.nivel === "todos" || x.sup?.nivel === F.nivel || (F.nivel === "sem" && !x.sup)) && (F.sev === "todos" || (F.sev === "ok" ? !nivelMax(x.alertas) : F.sev === "alerta" ? ["alto", "medio"].includes(nivelMax(x.alertas)) : nivelMax(x.alertas) === F.sev))
      && (!F.sup || x.sup?.id === F.sup) && (!F.de || String(x.nf.emissao || "") >= F.de) && (!F.ate || String(x.nf.emissao || "").slice(0, 10) <= F.ate)
      && (!q || [x.nf.numero, x.nf.emitNome, x.sup?.nome, x.forn.doc, docFmt(x.forn.doc), prodTx(x.nf), x.nf.chave].join(" ").toLowerCase().includes(q)));
    const ord = {alto: 0, medio: 1, baixo: 2, "": 3};
    L.sort((a, b) => ord[nivelMax(a.alertas)] - ord[nivelMax(b.alertas)] || String(b.nf.emissao).localeCompare(String(a.nf.emissao)));
    const tot = A.R.reduce((t, x) => t + (x.nf.situacao !== "cancelada" ? x.nf.vNF || 0 : 0), 0), pagos = A.G.reduce((t, g) => t + g.pag.valor, 0);
    const concil = A.R.filter(x => x.pags.length && (x.ped || !A.temPed)).length, altas = A.R.filter(x => nivelMax(x.alertas) === "alto").length;
    const supAlto = [...A.porSup.entries()].filter(([, l]) => l.some(a => a.sev === "alto")).length;
    const pagSem = A.G.filter(g => g.alertas.length), pedSem = A.P.filter(p => !p.nfs.length);
    const lotes = new Map(); ops().forEach(o => { const k = o.lote || "manual"; const v = lotes.get(k) || {n: 0, arq: new Set(), em: o.criadoEm, tipos: new Set()}; v.n++; if (o.arquivo) v.arq.add(o.arquivo); v.tipos.add(o.tipo); if (o.criadoEm > v.em) v.em = o.criadoEm; lotes.set(k, v); });
    host.innerHTML = `
      <div class="head"><div><div class="eyebrow">Notas fiscais · pedidos · pagamentos</div><h2>Operações comerciais</h2><p class="sub">Transações entre ${esc(CLI().nome)} e os fornecedores N1, N2 e N3. O sistema confere cada nota (chave, situação, produto, CFOP, sequência, datas e valores) e cruza pedido × nota × pagamento. Alertas entram na matriz de risco do fornecedor.</p></div>
        ${Store.me.canWrite ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-imp="nf">Importar notas fiscais</button><button type="button" class="btn sm" data-imp="ped">Importar pedidos</button><button type="button" class="btn sm" data-imp="pag">Importar pagamentos</button></div>` : ""}</div>
      <div class="stats">
        <div class="stat"><div class="n">${A.R.length}</div><div class="l">Notas · ${brl(tot)}</div></div>
        <div class="stat"><div class="n">${A.G.length}</div><div class="l">Pagamentos · ${brl(pagos)}</div></div>
        <div class="stat"><div class="n">${A.R.length ? fmt(concil / A.R.length * 100) + "%" : "—"}</div><div class="l">Notas conciliadas${A.temPed ? " (pedido + pagamento)" : " (com pagamento)"}</div></div>
        <div class="stat"><div class="n" style="color:${altas ? "var(--bad)" : "inherit"}">${altas}</div><div class="l">Notas com alerta alto · ${supAlto} fornecedor(es)</div></div>
      </div>
      ${A.sug.length ? `<div class="card" style="display:flex;flex-direction:column;gap:10px;border-color:var(--warn)"><div class="head"><div><div class="eyebrow">Mapeamento automático da cadeia</div><h3>${A.sug.length} fornecedor(es) identificado(s) nas notas e ainda fora da cadeia</h3>
          <p class="sub" style="margin:4px 0 0">Quem vende ao cliente vira N1; quem vende a um N1 vira N2; quem vende a um N2 vira N3. Ao incluir, o fornecedor é ligado ao comprador, recebe o volume das notas, é consultado na Receita e nas listas restritivas e entra na matriz de risco.</p></div>
          ${ed ? `<button type="button" class="btn sm primary" id="mp-all">Incluir todos (${A.sug.length})</button>` : ""}</div>
        <div class="tbl"><table><thead><tr><th>Nível</th><th>Fornecedor</th><th>CNPJ/CPF</th><th>Local</th><th>Vende para</th><th>Notas</th><th>Volume</th><th>Valor</th><th>Receita · listas</th><th></th></tr></thead><tbody>
          ${A.sug.slice(0, 100).map((v, i) => `<tr><td><span class="lvtag">${v.nivel}</span></td><td style="min-width:150px">${esc(v.nome || "—")}</td><td class="mono" style="white-space:nowrap">${esc(docFmt(v.doc))}</td><td>${esc([v.mun, v.uf].filter(Boolean).join("/") || "—")}</td>
            <td style="min-width:130px">${v.pai ? `<span class="lvtag">${v.pai.nivel}</span> ${esc(v.pai.nome)}` : esc(CLI().nome)}</td><td>${v.notas}</td><td style="white-space:nowrap">${v.kg ? fmt(v.kg / 1000, 1) + " t" : "—"}</td><td class="mono" style="white-space:nowrap">${brl(v.valor)}</td><td style="font-size:12px;min-width:110px">${consTx(v.doc)}</td>
            <td>${ed ? `<button type="button" class="btn sm" data-mp="${i}">Incluir</button>` : ""}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${!ops().length ? `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Comece importando as notas fiscais</h3><p class="sub" style="margin:0">Aceita ${FORMATOS.nf}. Depois importe os pedidos de compra e os pagamentos (${FORMATOS.pag}) para o sistema conferir pedido × nota × pagamento.</p></div>` : `
      <div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input class="search" type="search" id="op-q" placeholder="Buscar nota, fornecedor, CNPJ, produto" value="${esc(F.q)}">
          <select class="search" style="flex:0 1 190px" id="op-nv" aria-label="Nível"><option value="todos">Todos os níveis</option>${["N1", "N2", "N3"].map(n => `<option value="${n}" ${F.nivel === n ? "selected" : ""}>${n} · ${LV_NOME[n]}</option>`).join("")}<option value="sem" ${F.nivel === "sem" ? "selected" : ""}>Não cadastrados</option></select>
          <select class="search" style="flex:0 1 240px" id="op-fs" aria-label="Fornecedor"><option value="">Todos os fornecedores</option>${[...new Map(A.R.filter(x => x.sup).map(x => [x.sup.id, x.sup])).values()].sort((a, b) => a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")).map(x => `<option value="${x.id}" ${F.sup === x.id ? "selected" : ""}>${x.nivel} · ${esc(x.nome)}</option>`).join("")}</select>
          <label class="sub" style="margin:0;display:flex;gap:6px;align-items:center">de <input class="search" style="flex:0 1 150px" type="date" id="op-fde" value="${esc(F.de)}"> até <input class="search" style="flex:0 1 150px" type="date" id="op-fate" value="${esc(F.ate)}"></label>
          <select class="search" style="flex:0 1 210px" id="op-sv" aria-label="Alertas"><option value="todos">Todas as notas</option><option value="alerta" ${F.sev === "alerta" ? "selected" : ""}>Com alerta alto ou médio</option><option value="alto" ${F.sev === "alto" ? "selected" : ""}>Alerta alto</option><option value="medio" ${F.sev === "medio" ? "selected" : ""}>Alerta médio</option><option value="ok" ${F.sev === "ok" ? "selected" : ""}>Sem alertas</option></select>
        </div>
        <div class="tbl"><table><thead><tr><th>Nota</th><th>Emissão</th><th>Fornecedor</th><th>Produto</th><th>Qtd.</th><th>Valor</th><th>SEFAZ</th><th>Pedido</th><th>Pagto.</th><th>Alertas</th></tr></thead><tbody>
          ${L.slice(0, 300).map(x => { const nm = nivelMax(x.alertas), top = x.alertas.filter(a => a.sev !== "info").sort((a, b) => PESO[b.sev] - PESO[a.sev]);
            return `<tr data-nf="${x.o.id}" style="cursor:pointer"><td class="mono" style="white-space:nowrap">${esc(x.nf.numero || "—")}${x.nf.serie && x.nf.serie !== "0" ? "/" + esc(x.nf.serie) : ""}</td><td style="white-space:nowrap">${dBR(x.nf.emissao)}</td><td style="min-width:160px">${x.sup ? `<span class="lvtag">${x.sup.nivel}</span> ${esc(x.sup.nome)}` : `<span style="color:var(--warn)">${esc(x.forn.nome || docFmt(x.forn.doc) || "—")}</span>`}</td>
              <td style="min-width:140px">${esc(prodTx(x.nf))}</td><td style="white-space:nowrap">${qtdTx(x.nf)}</td><td class="mono" style="white-space:nowrap">${brl(x.nf.vNF)}</td><td>${sitPill(x.nf.situacao)}</td><td>${x.ped ? "✔ " + esc(x.ped.ped.numero) : A.temPed ? "—" : ""}</td><td style="white-space:nowrap">${x.pags.length ? "✔ " + brl(x.pags.reduce((t, g) => t + g.pag.valor, 0)) : "—"}</td>
              <td style="min-width:150px">${sevPill(nm)}${top.length ? `<div style="font-size:11.5px;color:var(--muted);margin-top:3px">${esc(ROT[top[0].cod] || top[0].txt)}${top.length > 1 ? ` +${top.length - 1}` : ""}</div>` : ""}</td></tr>`; }).join("") || `<tr><td colspan="10" class="sub">Nenhuma nota com estes filtros.</td></tr>`}
        </tbody></table></div>${L.length > 300 ? `<p class="sub" style="margin:0">Mostrando 300 de ${L.length}. Use a busca ou os filtros.</p>` : ""}
      </div>
      ${pagSem.length ? `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Pagamentos com alerta (${pagSem.length})</h3><div class="tbl"><table><thead><tr><th>Data</th><th>Favorecido</th><th>Valor</th><th>Forma</th><th>Alerta</th></tr></thead><tbody>
        ${pagSem.slice(0, 100).map(g => `<tr data-op="${g.o.id}" style="cursor:pointer"><td>${dBR(g.pag.data)}</td><td>${esc(g.pag.favNome || "—")}<div class="mono" style="font-size:11.5px;color:var(--muted)">${esc(docFmt(g.pag.favDoc))}</div></td><td class="mono">${brl(g.pag.valor)}</td><td>${esc(g.pag.forma || "—")}</td><td>${g.alertas.map(a => sevPill(a.sev) + " " + esc(ROT[a.cod] || a.txt)).join("<br>")}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${pedSem.length ? `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Pedidos sem nota fiscal (${pedSem.length})</h3><div class="tbl"><table><thead><tr><th>Pedido</th><th>Data</th><th>Fornecedor</th><th>Produto</th><th>Valor</th></tr></thead><tbody>
        ${pedSem.slice(0, 100).map(p => `<tr data-op="${p.o.id}" style="cursor:pointer"><td class="mono">${esc(p.ped.numero)}</td><td>${dBR(p.ped.data)}</td><td>${esc(p.sup?.nome || p.ped.fornNome || docFmt(p.ped.fornDoc))}</td><td>${esc(p.ped.itens[0]?.desc || "—")}</td><td class="mono">${brl(p.ped.vTot)}</td></tr>`).join("")}</tbody></table></div></div>` : ""}
      ${ed ? `<details class="card"><summary><h3>Importações realizadas (${lotes.size})</h3></summary><div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">${[...lotes.entries()].sort((a, b) => String(b[1].em).localeCompare(String(a[1].em))).map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:8px"><div style="min-width:0"><b style="font-size:13px">${[...v.tipos].map(t => TIPO_TX[t]).join(", ")} · ${v.n} registro(s)</b><div class="sub" style="margin:0;font-size:12px">${dt(v.em)}${v.arq.size ? " · " + esc([...v.arq].slice(0, 3).join(", ")) + (v.arq.size > 3 ? "…" : "") : ""}</div></div><button type="button" class="btn sm bad" data-lote="${esc(k)}">Desfazer</button></div>`).join("")}
        <button type="button" class="btn sm bad" id="op-tudo" style="align-self:flex-start;margin-top:8px">Excluir todas as operações deste cliente</button></div></details>` : ""}`}
      <details class="card"><summary><h3>O que o sistema confere</h3></summary><ul style="margin:10px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:13px">
        <li><b>Chave de acesso</b>: dígito verificador e coerência com CNPJ, número, série, UF e mês da nota.</li>
        <li><b>Situação na SEFAZ</b>: pelo protocolo do XML, pelo evento de cancelamento ou pela situação do SPED; quando não houver, a nota fica “A verificar” com o atalho para a consulta pública da NF-e e o registro do resultado.</li>
        <li><b>Emitente</b>: CNPJ/CPF válido, cadastrado na cadeia, situação na Receita, abertura do CNPJ antes da nota e UF.</li>
        <li><b>Comprador</b>: a nota do N1 deve ser para o cliente; a do N2 para o seu N1; a do N3 para o seu N2.</li>
        <li><b>Objeto da nota</b>: NCM e descrição compatíveis com ${esc(SEG.prod)}; CFOP de compra e venda (alerta para remessas e “outras saídas”).</li>
        <li><b>Sequência</b>: números repetidos, fora da ordem das datas e notas sequenciais (emitente que só fatura para a cadeia, indício de “noteira”).</li>
        <li><b>Valores e volumes</b>: soma dos itens × total, preço por kg muito abaixo da média, volume faturado em 12 meses acima da capacidade declarada.</li>
        <li><b>Pedido × nota</b>: fornecedor, produto, preço unitário, quantidade e datas.</li>
        <li><b>Pagamento × nota</b>: favorecido igual ao emitente (alerta para terceiros e pessoas físicas), valor, pagamento em espécie, nota cancelada paga, antecipações e pagamentos fracionados.</li></ul></details>`;
    $$("[data-imp]", host).forEach(b => b.onclick = () => importar(b.dataset.imp));
    $$("[data-mp]", host).forEach(b => b.onclick = () => { const v = A.sug[+b.dataset.mp]; IMP.confirma(`<b>Incluir ${esc(v.nome || docFmt(v.doc))} como ${v.nivel}?</b><p class="sub" style="margin:6px 0 0">Vende para ${esc(v.pai ? v.pai.nome : CLI().nome)} · ${v.notas} nota(s).</p>`, "Incluir", "", () => incluirSug([v])); });
    const mpa = $("#mp-all", host); if (mpa) mpa.onclick = () => IMP.confirma(`<b>Incluir ${A.sug.length} fornecedor(es) na cadeia?</b><p class="sub" style="margin:6px 0 0">${["N1", "N2", "N3"].map(n => `${A.sug.filter(v => v.nivel === n).length} ${n}`).join(" · ")}. Ficam marcados para conferência.</p>`, "Incluir todos", "", () => incluirSug(A.sug));
    const qi = $("#op-q", host); if (qi) qi.oninput = () => { F.q = qi.value; clearTimeout(render.t); render.t = setTimeout(() => { render(); const n = $("#op-q"); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); };
    const nv = $("#op-nv", host); if (nv) nv.onchange = () => { F.nivel = nv.value; render(); };
    const sv = $("#op-sv", host); if (sv) sv.onchange = () => { F.sev = sv.value; render(); };
    [["#op-fs", "sup"], ["#op-fde", "de"], ["#op-fate", "ate"]].forEach(([id, k]) => { const e = $(id, host); if (e) e.onchange = () => { F[k] = e.value; render(); }; });
    $$("[data-nf]", host).forEach(r => r.onclick = () => abrirNF(r.dataset.nf));
    $$("[data-op]", host).forEach(r => r.onclick = () => abrirOp(r.dataset.op));
    $$("[data-lote]", host).forEach(b => b.onclick = () => { const k = b.dataset.lote, ids = ops().filter(o => (o.lote || "manual") === k).map(o => o.id);
      IMP.confirma(`<b>Desfazer esta importação?</b><p class="sub" style="margin:6px 0 0">${ids.length} registro(s) serão excluídos. Os fornecedores não são afetados.</p>`, `Excluir ${ids.length}`, ids.length > 10 ? "EXCLUIR" : "", () => apagar(ids), true); });
    const tu = $("#op-tudo", host); if (tu) tu.onclick = () => { const ids = ops().map(o => o.id);
      IMP.confirma(`<b>Excluir todas as ${ids.length} operações de ${esc(CLI().nome)}?</b><p class="sub" style="margin:6px 0 0">Notas, pedidos e pagamentos importados serão apagados. Os fornecedores não são afetados.</p>`, "Excluir tudo", "EXCLUIR", () => apagar(ids), true); };
  }
  async function incluirSug(lista){
    let n = 0; const novos = [];
    for (const v of lista){ if (supPorDoc(v.doc)) continue; const m = typeof muniOf === "function" ? (muniOf(v.mun, v.uf) || null) : null, c = m ? [m[2], m[3]] : (typeof UF_CENTER !== "undefined" ? UF_CENTER[v.uf] : null) || null;
      const id = uid(), tipos = SUP_TYPES[v.nivel] || [];
      const body = {nivel: v.nivel, tipo: tipos[0] || "", parentId: v.pai ? v.pai.id : "", nome: v.nome || ("Fornecedor " + docFmt(v.doc)), doc: docFmt(v.doc), uf: v.uf || "", municipio: v.mun || "", lat: c ? c[0] : null, lng: c ? c[1] : null, geoAprox: !m,
        volume: v.kg12 ? String(Math.round(v.kg12 / 100) / 10) : "", origem: "Mapeado automaticamente pelas notas fiscais", conferir: true, mapeadoEm: nowISO(), notasMapeadas: v.notas,
        answers: {}, docs: {}, insp: {}, balanco: {}, invest: {}, criadoEm: nowISO(), criadoPor: Store.me.id || ""};
      const cs = (S.config.consultas || {})[v.doc]; if (cs && cs.receita && !cs.erro){ body.receita = cs.receita; body.abertura = cs.abertura || ""; const sit = {ATIVA: "Ativa", INAPTA: "Inapta", SUSPENSA: "Suspensa", BAIXADA: "Baixada", NULA: "Nula"}[cs.situacao]; if (sit) body.invest = {situacao: sit, dataConsulta: String(cs.em).slice(0, 10)}; if (cs.razao && !v.nome) body.nome = cs.razao; }
      try{ await Store.set("suppliers", id, body); n++; novos.push(id); }catch(e){} }
    toast(`${n} fornecedor(es) incluído(s) na cadeia`);
  }
  const irOps = () => { S.audSub = "ops"; go("auditoria"); };
  const consTx = doc => { const c = (S.config.consultas || {})[doc]; if (!c) return dl(doc).length === 14 ? `<span class="sub">consultando…</span>` : `<span class="sub">CPF: só listas</span>`;
    if (c.erro) return `<span class="sub">Receita indisponível</span>`; const ok = c.situacao === "ATIVA";
    return `<b style="color:${ok ? "var(--ok)" : "var(--bad)"}">${esc(c.situacao || "—")}</b>${(c.listas || []).length ? ` · <b style="color:var(--bad)">${esc(c.listas.map(l => l.rotulo.split(" –")[0]).join(", "))}</b>` : ""}`; };
  async function apagar(ids){ let n = 0; for (const id of ids){ try{ await Store.del("operacoes", id); n++; }catch(e){} } toast(`${n} registro(s) excluído(s)`); }

  /* ---------- importação com pré-visualização ---------- */
  const chaveDe = it => it.tipo === "nf" ? (dl(it.nf.chave).length === 44 ? dl(it.nf.chave) : dl(it.nf.emitDoc) + "|" + (it.nf.serie || "0") + "|" + it.nf.numero) : it.tipo === "ped" ? nz(it.ped.numero) + "|" + dl(it.ped.fornDoc) : it.pag.data + "|" + fmt(it.pag.valor, 2) + "|" + (dl(it.pag.favDoc) || it.pag.favNome) + "|" + it.pag.ref;
  const CAMPOS = {nf: [["numero", "Número"], ["serie", "Série"], ["emissao", "Emissão", "date"], ["chave", "Chave de acesso (44 dígitos)"], ["emitDoc", "CNPJ/CPF do emitente"], ["emitNome", "Emitente"], ["destDoc", "CNPJ/CPF do destinatário"], ["vNF", "Valor total (R$)"], ["i.desc", "Produto"], ["i.ncm", "NCM"], ["i.cfop", "CFOP"], ["i.qtd", "Quantidade"], ["i.un", "Unidade (KG, T, SC, @, CAB)"]],
    pag: [["data", "Data do pagamento", "date"], ["valor", "Valor (R$)"], ["favNome", "Favorecido"], ["favDoc", "CNPJ/CPF do favorecido"], ["ref", "Nota fiscal ou pedido de referência"], ["forma", "Forma (PIX, TED, boleto, depósito, espécie)"]],
    ped: [["numero", "Número do pedido"], ["data", "Data", "date"], ["fornDoc", "CNPJ/CPF do fornecedor"], ["fornNome", "Fornecedor"], ["i.desc", "Produto"], ["i.ncm", "NCM"], ["i.qtd", "Quantidade"], ["i.un", "Unidade"], ["i.vUn", "Preço unitário (R$)"]]};
  const NUMS = ["vNF", "valor", "i.qtd", "i.vUn"];
  const getC = (it, k) => { const o = it[it.tipo]; if (k.startsWith("i.")){ const i = (o.itens || [])[0] || {}; return i[k.slice(2)]; } return o[k]; };
  const setC = (it, k, v) => { const o = it[it.tipo]; if (NUMS.includes(k)) v = num(v); if (k.startsWith("i.")){ o.itens = o.itens && o.itens.length ? o.itens : [{}]; o.itens[0][k.slice(2)] = v; } else o[k] = /Doc$/.test(k) || k === "chave" ? dl(v) : v; };
  function importar(tipo){
    let itens = [], eventos = [], erros = [];
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Operações comerciais · ${esc(CLI().nome)}</div><h2>Importar ${TIPO_TX[tipo]}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div style="display:flex;gap:6px;flex-wrap:wrap">${Object.entries(TIPO_TX).map(([k, v]) => `<button type="button" class="btn sm ${k === tipo ? "primary" : ""}" data-tp="${k}">${v[0].toUpperCase() + v.slice(1)}</button>`).join("")}</div>
        <div class="banner"><b>Formatos aceitos:</b> ${FORMATOS[tipo]}. Pode selecionar vários arquivos de uma vez. ${tipo === "nf" ? "Notas de N1, N2 e N3: o sistema identifica o fornecedor pelo CNPJ/CPF." : ""}</div>
        <div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;padding:12px">
          <div class="fld" style="grid-column:1/-1"><label for="op-vs">Fornecedor destas operações</label><select id="op-vs"><option value="">Automático: ligar cada ${tipo === "pag" ? "pagamento ao favorecido" : tipo === "ped" ? "pedido ao fornecedor" : "nota ao emitente"} pelo CNPJ/CPF (N1, N2 ou N3)</option>${S.suppliers.slice().sort((a, b) => a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")).map(x => `<option value="${x.id}" ${x.id === S.opsVinc ? "selected" : ""}>${x.nivel} · ${esc(x.nome)}${x.doc ? " · " + esc(docFmt(x.doc)) : ""}</option>`).join("")}</select>
            <span class="hint">No automático, quem já está na cadeia é ligado sozinho; quem não está aparece como sugestão de inclusão. Escolhendo um fornecedor, as operações sem cadastro correspondente ficam ligadas a ele (ex.: compras de um N2 de vários produtores).</span></div>
          <div class="fld"><label for="op-de">Período: de</label><input type="date" id="op-de" value="${esc(S.opsPer?.de || "")}"></div>
          <div class="fld"><label for="op-ate">até</label><input type="date" id="op-ate" value="${esc(S.opsPer?.ate || "")}"></div>
          <span class="hint" style="grid-column:1/-1">Opcional: importa só as ${TIPO_TX[tipo]} com data dentro do período (ex.: todas as compras do trimestre). Em branco, importa tudo.</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><label class="btn primary" style="cursor:pointer">Escolher arquivos<input type="file" id="op-f" multiple accept="${ACEITA[tipo]}" hidden></label><button type="button" class="btn" id="op-man">+ Lançar manualmente</button><span class="sub" id="op-st"></span></div>
        <div id="op-prev"></div>
        <label class="check" id="op-sub-l" hidden><input type="checkbox" id="op-sub"> Substituir registros já importados (mesma nota, pedido ou pagamento)</label>
        <p class="err" id="op-err" hidden></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="op-go" disabled>Importar</button></div>
      </div>`);
    $$("[data-tp]").forEach(b => b.onclick = () => { if (b.dataset.tp !== tipo){ close(); importar(b.dataset.tp); } });
    const exist = new Map(ops().filter(o => o.tipo === tipo).map(o => [chaveDe(o), o.id]));
    /* vínculo e período */
    const dataDe = it => tipo === "nf" ? it.nf.emissao : tipo === "pag" ? it.pag.data : it.ped.data;
    const docDe = it => tipo === "nf" ? fornDaNF(it.nf).doc : tipo === "pag" ? it.pag.favDoc : it.ped.fornDoc;
    const per = () => ({de: $("#op-de")?.value || "", ate: $("#op-ate")?.value || ""});
    const noPer = it => { const p = per(), d = String(dataDe(it) || "").slice(0, 10); return (!p.de || !d || d >= p.de) && (!p.ate || !d || d <= p.ate); };
    const vinc = it => { const sp = supPorDoc(docDe(it)); if (sp) return {s: sp, como: "cnpj"}; const ch = $("#op-vs")?.value; return ch ? {s: supById(ch), como: "escolhido"} : {s: null, como: ""}; };
    const vincTx = it => { const v = vinc(it); return v.s ? `<span class="lvtag">${v.s.nivel}</span> ${esc(v.s.nome)}<div class="sub" style="margin:0;font-size:11px">${v.como === "cnpj" ? "pelo CNPJ/CPF" : "escolhido na importação"}</div>` : `<span style="color:var(--warn)">não cadastrado</span><div class="sub" style="margin:0;font-size:11px">vira sugestão de inclusão</div>`; };
    function desenha(){
      const p = $("#op-prev"); const todosItens = itens; itens = itens.filter(noPer); const fora = todosItens.length - itens.length;
      try{
      const novos = itens.filter(it => !exist.has(chaveDe(it))).length, rep = itens.length - novos;
      const ligados = itens.filter(it => vinc(it).s), porNv = ["N1", "N2", "N3"].map(n => `${itens.filter(it => vinc(it).s?.nivel === n).length} ${n}`).join(" · ");
      $("#op-sub-l").hidden = !rep; $("#op-go").disabled = !itens.length && !eventos.length;
      $("#op-go").textContent = itens.length || eventos.length ? `Importar ${itens.length} ${TIPO_TX[tipo]}${eventos.length ? ` e ${eventos.length} cancelamento(s)` : ""}` : "Importar";
      const rev = itens.filter(it => it.rev), tab = itens.filter(it => !it.rev);
      p.innerHTML = (erros.length ? `<div class="banner" style="border-color:var(--bad)">${erros.map(esc).join("<br>")}</div>` : "")
        + (fora ? `<div class="banner">${fora} registro(s) fora do período escolhido não serão importados.</div>` : "")
        + (itens.length ? `<div class="result" style="font-size:13px;margin-bottom:8px">Vínculo com fornecedores: <b>${ligados.length}</b> de ${itens.length} ligados (${porNv})${itens.length - ligados.length ? ` · <b style="color:var(--warn)">${itens.length - ligados.length} sem cadastro</b> (escolha um fornecedor acima ou inclua pelo mapeamento automático)` : ""}</div>` : "")
        + (itens.length || eventos.length ? `<div class="result" style="font-size:13px;margin-bottom:8px"><b>${itens.length}</b> ${TIPO_TX[tipo]} lida(s)${rep ? ` · ${rep} já importada(s) antes` : ""}${eventos.length ? ` · ${eventos.length} evento(s) de cancelamento` : ""}${rev.length ? ` · <b>${rev.length} para conferir</b> (lidos de PDF, foto ou lançamento manual)` : ""}</div>` : "")
        + rev.map(it => { const i = todosItens.indexOf(it); return `<div class="card" data-rv="${i}" style="display:flex;flex-direction:column;gap:8px;padding:12px;margin-bottom:8px"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:13px">${esc(it._arq || "Lançamento manual")}</b><button type="button" class="btn sm ghost" data-rm="${i}">Remover</button></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px">${CAMPOS[tipo].map(([k, l, ty]) => { const v = getC(it, k); return `<div class="fld"><label>${l}</label><input data-k="${k}" ${ty ? `type="${ty}"` : ""} value="${esc(v == null ? "" : NUMS.includes(k) ? String(v).replace(".", ",") : v)}"></div>`; }).join("")}</div></div>`; }).join("")
        + (tab.length ? `<div class="tbl" style="max-height:340px;overflow:auto"><table><thead><tr>${tipo === "nf" ? "<th>Nota</th><th>Emissão</th><th>Emitente</th><th>Produto</th><th>Valor</th><th>Situação</th>" : tipo === "pag" ? "<th>Data</th><th>Favorecido</th><th>Valor</th><th>Referência</th><th>Forma</th>" : "<th>Pedido</th><th>Data</th><th>Fornecedor</th><th>Produto</th><th>Valor</th>"}<th>Vinculado a</th><th></th></tr></thead><tbody>
            ${tab.slice(0, 200).map(it => { const o = it[tipo], j = exist.has(chaveDe(it)) ? `<span class="sub">já importado</span>` : `<span style="color:var(--ok)">novo</span>`;
              return tipo === "nf" ? `<tr><td class="mono">${esc(o.numero)}${o.serie && o.serie !== "0" ? "/" + esc(o.serie) : ""}</td><td>${dBR(o.emissao)}</td><td>${esc(supPorDoc(fornDaNF(o).doc)?.nome || o.emitNome || docFmt(o.emitDoc))}</td><td>${esc(prodTx(o))}</td><td class="mono">${brl(o.vNF)}</td><td>${sitPill(o.situacao)}</td><td style="min-width:150px">${vincTx(it)}</td><td>${j}</td></tr>`
                : tipo === "pag" ? `<tr><td>${dBR(o.data)}</td><td>${esc(o.favNome || "—")} <span class="mono" style="font-size:11px">${esc(docFmt(o.favDoc))}</span></td><td class="mono">${brl(o.valor)}</td><td>${esc(o.ref || "—")}</td><td>${esc(o.forma || "—")}${/rejeit/.test(o.situacao) ? " · <b>" + esc(o.situacao) + "</b>" : ""}</td><td style="min-width:150px">${vincTx(it)}</td><td>${j}</td></tr>`
                : `<tr><td class="mono">${esc(o.numero)}</td><td>${dBR(o.data)}</td><td>${esc(supPorDoc(o.fornDoc)?.nome || o.fornNome || docFmt(o.fornDoc))}</td><td>${esc(o.itens[0]?.desc || "—")}</td><td class="mono">${brl(o.vTot)}</td><td style="min-width:150px">${vincTx(it)}</td><td>${j}</td></tr>`; }).join("")}</tbody></table></div>${tab.length > 200 ? `<p class="sub">Mostrando 200 de ${tab.length}.</p>` : ""}` : "");
      } finally { itens = todosItens; }
      $$("[data-rv]", p).forEach(c => { const it = itens[+c.dataset.rv]; $$("[data-k]", c).forEach(inp => inp.oninput = () => setC(it, inp.dataset.k, inp.value)); });
      $$("[data-rm]", p).forEach(b => b.onclick = () => { itens.splice(+b.dataset.rm, 1); desenha(); });
    }
    ["#op-vs", "#op-de", "#op-ate"].forEach(id => { const e = $(id); if (e) e.onchange = () => { S.opsVinc = $("#op-vs").value; S.opsPer = per(); desenha(); }; });
    $("#op-man").onclick = () => { const vazio = {nf: {tipo: "nf", origem: "manual", rev: true, nf: {chave: "", numero: "", serie: "1", modelo: "55", tp: "1", emissao: "", emitDoc: "", destDoc: "", itens: [{desc: SEG.demo[0], ncm: SEG.demo[1], cfop: "", un: SEG.demo[2], qtd: null}], vNF: null, situacao: "nao_verificada"}},
      pag: {tipo: "pag", origem: "manual", rev: true, pag: {data: "", valor: null, favNome: "", favDoc: "", ref: "", forma: "", banco: "", situacao: "efetuado"}}, ped: {tipo: "ped", origem: "manual", rev: true, ped: {numero: "", data: "", fornDoc: "", fornNome: "", itens: [{desc: SEG.demo[0], ncm: SEG.demo[1], un: SEG.demo[2], qtd: null, vUn: null}], vTot: null}}}[tipo];
      itens.push(JSON.parse(JSON.stringify(vazio))); desenha(); };
    $("#op-f").onchange = async e => { const fs = [...e.target.files]; e.target.value = ""; if (!fs.length) return; $("#op-st").textContent = "Lendo…";
      for (const f of fs){ try{ const r = await ler(f, tipo); if (!r.itens.length && !(r.eventos || []).length) erros.push(`${f.name}: nenhum registro reconhecido. Confira o tipo escolhido e o formato.`);
          r.itens.forEach(it => { it._arq = f.name; if (r.anexar) it._file = f; }); itens.push(...r.itens); eventos.push(...(r.eventos || [])); if (r.aviso) erros.push(f.name + ": " + r.aviso); }
        catch(x){ erros.push(`${f.name}: não foi possível ler (${/antigo/.test(x?.message) ? "salve como .xlsx" : "arquivo protegido, corrompido ou em formato não suportado"}).`); } }
      $("#op-st").textContent = ""; desenha(); };
    $("#op-go").onclick = () => {
      const foraPer = itens.filter(it => !noPer(it)); if (foraPer.length) itens = itens.filter(noPer);
      const falta = itens.filter(it => it.rev && (tipo === "nf" ? !(it.nf.numero && it.nf.emitDoc && it.nf.vNF) : tipo === "pag" ? !(it.pag.data && it.pag.valor) : !it.ped.numero));
      if (falta.length){ $("#op-err").textContent = `Complete os campos principais de ${falta.length} registro(s) para conferir (${tipo === "nf" ? "número, CNPJ/CPF do emitente e valor" : tipo === "pag" ? "data e valor" : "número do pedido"}).`; $("#op-err").hidden = false; return; }
      $("#op-err").hidden = true;
      const sub = $("#op-sub").checked, novos = itens.filter(it => !exist.has(chaveDe(it))).length, rep = itens.length - novos;
      IMP.confirma(`<b>Importar ${novos} ${TIPO_TX[tipo]} novo(s)?</b><p class="sub" style="margin:6px 0 0">${rep ? (sub ? `${rep} já importado(s) serão substituído(s).` : `${rep} já importado(s) serão ignorado(s).`) : ""}${eventos.length ? ` ${eventos.length} cancelamento(s) serão aplicados às notas.` : ""} Os alertas atualizam a matriz de risco dos fornecedores.</p>`, "Importar", "", async () => {
        const lote = uid(), b = $("#op-go"); if (b){ b.disabled = true; b.textContent = "Importando…"; } let n = 0; const up = new Map();
        for (const it of itens){ const k = chaveDe(it), id0 = exist.get(k); if (id0 && !sub) continue;
          const doc = {tipo, origem: it.origem, [tipo]: it[tipo], lote, arquivo: it._arq || "", criadoEm: nowISO(), criadoPor: Store.me.id || ""};
          const vv = vinc(it), sp = vv.s; if (vv.como === "escolhido") doc.vinculoManual = true; if (sp){ doc.supplierId = sp.id; if (tipo === "nf" && !doc.nf.emitNome && doc.nf.tp !== "0") doc.nf.emitNome = sp.nome; }
          if (tipo === "ped") doc.ped.vTot = doc.ped.vTot || doc.ped.itens.reduce((t, i) => t + (i.vTot || (i.qtd || 0) * (i.vUn || 0)), 0);
          if (it._file){ try{ if (!up.has(it._file)){ const r = await Store.upload(it._file); up.set(it._file, {...r, nome: it._file.name, mime: it._file.type}); } doc.file = up.get(it._file); }catch(e){} }
          try{ await Store.set("operacoes", id0 || uid(), JSON.parse(JSON.stringify(doc))); n++; }catch(e){} }
        let c = 0; for (const ev of eventos){ const o = ops().find(o => o.tipo === "nf" && dl(o.nf.chave) === dl(ev.chave)); if (o){ try{ await Store.update("operacoes", o.id, {nf: {situacao: "cancelada", sitFonte: "evento de cancelamento " + (ev.dh || "").slice(0, 10)}}); c++; }catch(e){} } }
        close(); toast(`${n} registro(s) importado(s)${c ? ` · ${c} nota(s) cancelada(s)` : ""}`); if (!(S.view === "auditoria" && S.audSub === "ops")) irOps(); });
    };
    desenha();
  }

  /* ---------- detalhe da nota ---------- */
  function abrirNF(id){
    const A = analise(), x = A.R.find(x => x.o.id === id); if (!x) return; const nf = x.nf, ed = Store.me.canEdit;
    const tem = c => x.alertas.some(a => c.split(" ").includes(a.cod));
    const chk = [["Chave de acesso", nf.chave ? !tem("chave_inv chave_div") : null], ["Emitente e cadastro", !tem("doc_inv nao_cad cnpj_inapto abertura uf_div")], ["Comprador da cadeia", !tem("dest_div")],
      ["Situação na SEFAZ", nf.situacao === "autorizada" ? true : nf.situacao === "nao_verificada" ? null : false], ["Produto (NCM) e CFOP", !tem("produto produto_parc cfop")], ["Sequência e datas", !tem("dup ordem seq futura poucas")],
      ["Valores e volume", !tem("soma preco var_preco redondo")], ["Preço × cotação do dia", typeof COTA !== "undefined" && COTA.refKgEm && COTA.refKgEm(nf.emissao) ? !tem("abaixo_ref acima_ref") : null], ["Pedido de compra", x.ped ? !tem("ped_forn ped_data ped_prod ped_preco ped_qtd") : A.temPed ? false : null], ["Pagamento", x.pags.length ? !tem("pag_terc pag_esp pag_canc pag_maior pag_antes") : null]];
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Nota fiscal${nf.modelo ? " · modelo " + esc(nf.modelo) : ""} · ${esc({xml: "XML", pdf: "PDF (conferido)", sped: "SPED Fiscal", planilha: "planilha", imagem: "foto", manual: "lançamento manual"}[x.o.origem] || x.o.origem || "")}</div><h2>NF nº ${esc(nf.numero || "—")}${nf.serie ? " · série " + esc(nf.serie) : ""} ${sevPill(nivelMax(x.alertas))}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <dl class="kv"><dt>Emitente</dt><dd>${esc(nf.emitNome || "—")} <span class="mono">${esc(docFmt(nf.emitDoc))}</span>${nf.emitUF ? " · " + esc(nf.emitMun ? nf.emitMun + "/" : "") + esc(nf.emitUF) : ""}</dd>
          <dt>Destinatário</dt><dd>${esc(nf.destNome || "—")} <span class="mono">${esc(docFmt(nf.destDoc))}</span></dd>
          <dt>Fornecedor</dt><dd>${x.sup ? `<a href="#" data-sup="${x.sup.id}" style="color:var(--glow)"><span class="lvtag">${x.sup.nivel}</span> ${esc(x.sup.nome)}</a> ${riskPill(riskOf(x.sup))}` : `<span style="color:var(--warn)">Não cadastrado na cadeia</span>`}</dd>
          <dt>Emissão</dt><dd>${dBR(nf.emissao)}${nf.tp === "0" ? " · nota de entrada emitida pelo comprador" : ""}</dd><dt>Natureza</dt><dd>${esc(nf.natOp || "—")}</dd><dt>Valor total</dt><dd class="mono">${brl(nf.vNF)}</dd>
          <dt>Chave de acesso</dt><dd class="mono" style="word-break:break-all;font-size:12.5px">${esc(nf.chave || "—")}</dd>
          <dt>Situação na SEFAZ</dt><dd>${sitPill(nf.situacao)} <span class="sub" style="font-size:12px">${esc(nf.sitFonte || "")}${nf.protocolo?.nProt ? " · protocolo " + esc(nf.protocolo.nProt) : ""}</span></dd></dl>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${nf.chave ? `<button type="button" class="btn sm" id="nf-cp">Copiar chave</button><a class="btn sm" href="${URL_SEFAZ}" target="_blank" rel="noopener">Consultar na SEFAZ ↗</a>` : ""}${ed ? `<span class="sub" style="align-self:center">Resultado da consulta:</span>${["autorizada", "cancelada", "denegada"].map(s => `<button type="button" class="btn sm ${s === "autorizada" ? "ok" : "bad"}" data-sit="${s}">${SIT_TX[s]}</button>`).join("")}` : ""}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Alertas (${x.alertas.filter(a => a.sev !== "info").length})</h3>
          ${x.alertas.length ? x.alertas.slice().sort((a, b) => PESO[b.sev] - PESO[a.sev]).map(a => `<div style="display:flex;gap:8px;align-items:flex-start;font-size:13px">${sevPill(a.sev)}<span>${esc(a.txt)}</span></div>`).join("") : `<p class="sub" style="margin:0">Nenhuma divergência encontrada nas conferências.</p>`}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Conferências</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px">${chk.map(([t, ok]) => `<div style="font-size:13px">${ok === true ? `<b style="color:var(--ok)">✔</b>` : ok === false ? `<b style="color:var(--bad)">✖</b>` : `<b style="color:var(--muted)">○</b>`} ${t}${ok === null ? ` <span class="sub" style="font-size:11.5px">(sem dados)</span>` : ""}</div>`).join("")}</div></div>
        <div class="tbl"><table><thead><tr><th>Produto</th><th>NCM</th><th>CFOP</th><th>Qtd.</th><th>Unit.</th><th>Total</th></tr></thead><tbody>${(nf.itens || []).map(i => `<tr><td>${esc(i.desc || "—")}</td><td class="mono">${esc(i.ncm || "—")}</td><td class="mono">${esc(i.cfop || "—")}</td><td>${i.qtd != null ? fmt(i.qtd, 3) + " " + esc(i.un || "") : "—"}</td><td class="mono">${i.vUn != null ? brl(i.vUn) : "—"}</td><td class="mono">${brl(i.vTot)}</td></tr>`).join("") || `<tr><td colspan="6" class="sub">Itens não informados.</td></tr>`}</tbody></table></div>
        <dl class="kv"><dt>Pedido</dt><dd>${x.ped ? `nº ${esc(x.ped.ped.numero)} de ${dBR(x.ped.ped.data)} · ${brl(x.ped.ped.vTot)}${x.ped.ped.itens[0]?.vUn ? " · unitário " + brl(x.ped.ped.itens[0].vUn) : ""}` : "—"}</dd>
          <dt>Pagamentos</dt><dd>${x.pags.length ? x.pags.map(g => `${dBR(g.pag.data)} · ${brl(g.pag.valor)} · ${esc(g.pag.favNome || "")} <span class="mono">${esc(docFmt(g.pag.favDoc))}</span> ${esc(g.pag.forma || "")}`).join("<br>") : "—"}</dd>
          ${nf.infCpl ? `<dt>Informações adicionais</dt><dd style="font-size:12.5px">${esc(nf.infCpl)}</dd>` : ""}</dl>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${x.o.file?.url ? `<a class="btn sm" href="${esc(x.o.file.url)}" target="_blank" rel="noopener">Abrir arquivo · ${esc(x.o.file.nome || "nota")} ↗</a>` : ""}<span style="flex:1"></span>${ed ? `<button type="button" class="btn sm bad" id="nf-del">Excluir nota</button>` : ""}</div>
        <p class="sub" style="margin:0;font-size:12px">Importada em ${dt(x.o.criadoEm)}${x.o.arquivo ? " · " + esc(x.o.arquivo) : ""}. As conferências usam os dados da nota e do cadastro; a situação oficial deve ser confirmada no portal da NF-e.</p>
      </div>`);
    const cp = $("#nf-cp"); if (cp) cp.onclick = () => { navigator.clipboard?.writeText(nf.chave).then(() => toast("Chave copiada"), () => toast(nf.chave)); };
    $$("[data-sit]").forEach(b => b.onclick = () => save(Store.update("operacoes", id, {nf: {situacao: b.dataset.sit, sitFonte: `consulta registrada por ${Store.me.id || "usuário"} em ${new Date().toLocaleDateString("pt-BR")}`}})).then(() => { close(); abrirNF(id); toast("Situação registrada"); }));
    const sp = $("[data-sup]"); if (sp) sp.onclick = e => { e.preventDefault(); close(); openSupplier(sp.dataset.sup, "ops"); };
    const dd = $("#nf-del"); if (dd) dd.onclick = () => IMP.confirma(`<b>Excluir a nota nº ${esc(nf.numero)}?</b>`, "Excluir", "", async () => { await Store.del("operacoes", id).catch(() => {}); close(); toast("Nota excluída"); }, true);
  }
  function abrirOp(id){
    const o = ops().find(o => o.id === id); if (!o) return; const A = analise(), ed = Store.me.canEdit;
    const g = A.G.find(g => g.o.id === id), p = A.P.find(p => p.o.id === id);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${o.tipo === "pag" ? "Pagamento" : "Pedido de compra"}</div><h2>${o.tipo === "pag" ? brl(o.pag.valor) + " · " + dBR(o.pag.data) : "Pedido nº " + esc(o.ped.numero)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">${o.tipo === "pag" ? `<dl class="kv"><dt>Favorecido</dt><dd>${esc(o.pag.favNome || "—")} <span class="mono">${esc(docFmt(o.pag.favDoc))}</span></dd><dt>Forma</dt><dd>${esc(o.pag.forma || "—")}</dd><dt>Banco</dt><dd>${esc(o.pag.banco || "—")}</dd><dt>Referência</dt><dd>${esc(o.pag.ref || "—")}</dd><dt>Situação</dt><dd>${esc(o.pag.situacao || "—")}</dd><dt>Nota vinculada</dt><dd>${g && g.nfs.length ? g.nfs.map(x => "nº " + esc(x.nf.numero) + " · " + brl(x.nf.vNF)).join("<br>") : "—"}</dd></dl>
        ${g && g.alertas.length ? `<div class="card">${g.alertas.map(a => `<div style="display:flex;gap:8px;font-size:13px">${sevPill(a.sev)}<span>${esc(a.txt)}</span></div>`).join("")}</div>` : ""}`
        : `<dl class="kv"><dt>Fornecedor</dt><dd>${esc(p?.sup?.nome || o.ped.fornNome || "—")} <span class="mono">${esc(docFmt(o.ped.fornDoc))}</span></dd><dt>Data</dt><dd>${dBR(o.ped.data)}</dd><dt>Valor</dt><dd class="mono">${brl(o.ped.vTot)}</dd><dt>Notas vinculadas</dt><dd>${p && p.nfs.length ? p.nfs.map(x => "nº " + esc(x.nf.numero) + " · " + brl(x.nf.vNF)).join("<br>") : "Nenhuma"}</dd></dl>
        <div class="tbl"><table><thead><tr><th>Produto</th><th>NCM</th><th>Qtd.</th><th>Unit.</th><th>Total</th></tr></thead><tbody>${o.ped.itens.map(i => `<tr><td>${esc(i.desc || "—")}</td><td class="mono">${esc(i.ncm || "—")}</td><td>${i.qtd != null ? fmt(i.qtd, 3) + " " + esc(i.un || "") : "—"}</td><td class="mono">${brl(i.vUn)}</td><td class="mono">${brl(i.vTot)}</td></tr>`).join("")}</tbody></table></div>`}
        <div style="display:flex;gap:8px;flex-wrap:wrap">${o.file?.url ? `<a class="btn sm" href="${esc(o.file.url)}" target="_blank" rel="noopener">Abrir arquivo ↗</a>` : ""}<span style="flex:1"></span>${ed ? `<button type="button" class="btn sm bad" id="op-del">Excluir</button>` : ""}</div></div>`);
    const dd = $("#op-del"); if (dd) dd.onclick = () => IMP.confirma("<b>Excluir este registro?</b>", "Excluir", "", async () => { await Store.del("operacoes", id).catch(() => {}); close(); toast("Registro excluído"); }, true);
  }

  /* ---------- dossiê do fornecedor: aba Operações ---------- */
  TABS.splice(TABS.findIndex(t => t[0] === "risco"), 0, ["ops", "Operações"]);
  EXT_TABS.ops = (s, b) => {
    const A = analise(), L = A.R.filter(x => x.sup?.id === s.id).sort((a, b) => String(b.nf.emissao).localeCompare(String(a.nf.emissao))), G2 = A.G.filter(g => g.sup?.id === s.id), al = A.porSup.get(s.id) || [];
    const kg = L.filter(x => x.nf.situacao !== "cancelada").reduce((t, x) => t + x.kg, 0);
    b.innerHTML = `<div class="head"><div><h3>Operações comerciais</h3><p class="sub">${L.length} nota(s) · ${brl(L.reduce((t, x) => t + (x.nf.vNF || 0), 0))}${kg ? " · " + fmt(kg / 1000, 1) + " t" : ""} · ${G2.length} pagamento(s)${s.volume ? ` · capacidade declarada ${fmt(parseFloat(s.volume), 1)} t/ano` : ""}</p></div>${Store.me.canWrite ? `<button type="button" class="btn sm primary" id="ops-imp">Importar notas</button>` : ""}</div>
      ${al.filter(a => a.sev !== "info").length ? `<div class="card" style="display:flex;flex-direction:column;gap:6px">${[...new Map(al.filter(a => a.sev !== "info").map(a => [a.cod + a.txt, a])).values()].sort((a, b) => PESO[b.sev] - PESO[a.sev]).slice(0, 15).map(a => `<div style="display:flex;gap:8px;font-size:13px">${sevPill(a.sev)}<span>${a.ref ? `<b>NF ${esc(a.ref.nf.numero)}</b> · ` : ""}${esc(a.txt)}</span></div>`).join("")}</div>` : L.length ? `<div class="banner">Nenhum alerta nas notas e pagamentos deste fornecedor.</div>` : `<div class="empty">Nenhuma nota importada para este fornecedor.</div>`}
      ${L.length ? `<div class="tbl"><table><thead><tr><th>Nota</th><th>Emissão</th><th>Produto</th><th>Qtd.</th><th>Valor</th><th>SEFAZ</th><th>Alertas</th></tr></thead><tbody>${L.slice(0, 100).map(x => `<tr data-nf="${x.o.id}" style="cursor:pointer"><td class="mono">${esc(x.nf.numero)}</td><td>${dBR(x.nf.emissao)}</td><td>${esc(prodTx(x.nf))}</td><td>${qtdTx(x.nf)}</td><td class="mono">${brl(x.nf.vNF)}</td><td>${sitPill(x.nf.situacao)}</td><td>${sevPill(nivelMax(x.alertas))}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
    const ib = $("#ops-imp", b); if (ib) ib.onclick = () => importar("nf");
    $$("[data-nf]", b).forEach(r => r.onclick = () => abrirNF(r.dataset.nf));
  };
  EXT_VIEWS.operacoes = render;
  EXT_EVID.push(async (evId, blob, body) => { if (!blob || !/nota fiscal|nf-?e|danfe/i.test(String(body?.tipo || "") + " " + String(body?.obs || ""))) return;
    try{ const f = new File([blob], body.nome || (/xml/.test(blob.type) ? "nota.xml" : "nota.pdf"), {type: blob.type}); if (!/\.(xml|pdf|zip)$/i.test(f.name) && !/xml|pdf/.test(blob.type)) return;
      const r = await ler(f, "nf"), sp = supById(body.supplierId);
      for (const it of r.itens.filter(it => it.nf && it.nf.numero && (it.nf.emitDoc || sp) && it.nf.vNF)){ if (!it.nf.emitDoc && sp) it.nf.emitDoc = dl(sp.doc);
        if (ops().some(o => o.tipo === "nf" && chaveDe(o) === chaveDe(it))) continue;
        await Store.set("operacoes", uid(), JSON.parse(JSON.stringify({tipo: "nf", origem: it.origem, nf: it.nf, lote: "evid-" + evId, arquivo: body.nome || "", evidenciaId: evId, file: body.url ? {url: body.url, nome: body.nome || "", mime: blob.type} : null, supplierId: body.supplierId || "", criadoEm: nowISO(), criadoPor: Store.me.id || ""}))); }
    }catch(e){} });
  /* Cadeia: aviso de fornecedores identificados nas notas */
  EXT_CAD.push(() => { const A = analise(); if (!A.sug.length) return; const host = $("#cadeia"); if (!host) return;
    const el = document.createElement("div"); el.className = "banner"; el.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border-color:var(--warn)";
    el.innerHTML = `<span><b>${A.sug.length} fornecedor(es) identificado(s) nas notas fiscais</b> ainda fora da cadeia (${["N1", "N2", "N3"].map(n => `${A.sug.filter(v => v.nivel === n).length} ${n}`).join(" · ")}).</span><button type="button" class="btn sm primary">Revisar e incluir</button>`;
    const ref = host.querySelector(".head"); if (ref) ref.after(el); else host.prepend(el); el.querySelector("button").onclick = irOps; });

  /* ---------- relatório de pontos ---------- */
  RPT_REC.unshift(
    [/Chave de acesso|Nota cancelada|uso denegado|inutilizada|CNPJ irregular|abertura do CNPJ|data futura|CNPJ\/CPF do emitente inválido/i, "Suspender os pagamentos das notas irregulares, confirmar cada chave no portal da NF-e e exigir regularização ou nota substituta; avaliar a comunicação ao Fisco e a exclusão do fornecedor.", "Lei 8.137/1990, art. 1º; Ajuste SINIEF 07/2005 (NF-e); CTN (Lei 5.172/1966), arts. 136 e 137; LC 87/1996"],
    [/sequencial|noteira|numeração muito baixa|Número de nota repetido|fora da ordem/i, "Verificar a existência física e a capacidade do emitente (visita, empregados, outros clientes, estrutura) e suspender compras até a conclusão da diligência.", "Lei 8.137/1990; Lei 9.613/1998; Lei 12.846/2013"],
    [/Objeto da nota|fora do produto|CFOP/i, "Exigir nota substituta ou carta de correção com NCM e CFOP compatíveis e conferir se a mercadoria recebida corresponde à nota.", "Ajuste SINIEF 07/2005; Convênio s/nº de 1970 (CFOP); TIPI (NCM); Lei 8.137/1990"],
    [/Pagamento a terceiro|espécie|fracionados|nota cancelada|Pagamento sem nota|Pago acima|antecipado/i, "Pagar somente em conta de titularidade do emitente da nota, mediante nota autorizada; exigir justificativa documentada das exceções e comunicar operações atípicas.", "Lei 9.613/1998, arts. 10 e 11; Lei 12.846/2013; Lei 8.137/1990"],
    [/acima da cotação|superfaturamento|fora da média|Valor redondo/i, "Confrontar a nota com pesagem, pedido, pagamento e cotação do dia; exigir justificativa do preço; avaliar comunicação ao COAF se houver indício de lavagem de dinheiro.", "Lei 9.613/1998 (lavagem de dinheiro); Lei 8.137/1990 (crimes contra a ordem tributária); Lei 12.846/2013"],
    [/pedido|Comprador na nota|capacidade declarada|Preço muito abaixo|abaixo da cotação|Soma dos itens|UF do emitente/i, "Conciliar pedido, nota, recebimento e pagamento; apurar as diferenças com o fornecedor antes de novos pagamentos e documentar a conclusão.", "NBC TA 500 e NBC TA 520; Lei 8.137/1990; Lei 9.613/1998"]);
  RPT_EXT.push(P => {
    const A = analise(); if (!A.R.length && !A.G.length) return;
    const tot = A.R.reduce((t, x) => t + (x.nf.vNF || 0), 0), cont = new Map();
    A.R.forEach(x => x.alertas.filter(a => a.sev !== "info").forEach(a => { const v = cont.get(a.cod) || {sev: a.sev, n: 0, sups: new Set()}; v.n++; if (PESO[a.sev] > PESO[v.sev]) v.sev = a.sev; if (x.sup) v.sups.add(x.sup.id); cont.set(a.cod, v); }));
    A.G.forEach(g => g.alertas.forEach(a => { const v = cont.get(a.cod) || {sev: a.sev, n: 0, sups: new Set()}; v.n++; if (g.sup) v.sups.add(g.sup.id); cont.set(a.cod, v); }));
    P.h2("Operações comerciais: notas fiscais, pedidos e pagamentos");
    P.para(`${A.R.length} nota(s) fiscal(is) analisada(s) (${brl(tot)}), ${A.P.length} pedido(s) e ${A.G.length} pagamento(s). ${A.R.filter(x => nivelMax(x.alertas) === "alto").length} nota(s) com alerta alto; ${A.R.filter(x => x.pags.length).length} nota(s) com pagamento identificado.`, {size: 9.5});
    if (cont.size) P.table([{t: "Conferência", w: .5}, {t: "Gravidade", w: .16}, {t: "Ocorrências", w: .17}, {t: "Fornecedores", w: .17}],
      [...cont.entries()].sort((a, b) => PESO[b[1].sev] - PESO[a[1].sev] || b[1].n - a[1].n).map(([k, v]) => [ROT[k] || k, {t: SEV_TX[v.sev], b: true, c: v.sev === "alto" ? [198, 40, 40] : v.sev === "medio" ? [178, 106, 0] : [46, 125, 50]}, String(v.n), String(v.sups.size)]), {size: 7.8});
    const graves = A.R.filter(x => nivelMax(x.alertas) === "alto").slice(0, 20);
    if (graves.length) P.table([{t: "Nota", w: .1}, {t: "Emissão", w: .1}, {t: "Fornecedor", w: .25}, {t: "Valor", w: .13}, {t: "Principal alerta", w: .42}],
      graves.map(x => [x.nf.numero, dBR(x.nf.emissao), x.sup ? `${x.sup.nome} (${x.sup.nivel})` : docFmt(x.forn.doc), brl(x.nf.vNF), x.alertas.filter(a => a.sev === "alto")[0].txt]), {size: 7.6});
  });

  /* ---------- exemplos de demonstração (marcados EXEMPLO) ---------- */
  if (Array.isArray(window.SEED) && !window.OPS_SEM_DEMO){  /* o segmento pode dispensar os exemplos de notas (ex.: M&A) */
    const sups = window.SEED.filter(([c]) => c === "suppliers").map(([, id, b]) => ({id, ...b}));
    const A1 = sups.filter(s => s.nivel === "N1")[0], B1 = sups.filter(s => s.nivel === "N1")[1], C2 = sups.find(s => s.nivel === "N2");
    if (A1 && B1){
      const [desc, ncm, un, vUn] = SEG.demo, q0 = un === "SC" ? 500 : un === "CAB" ? 40 : un === "KG" ? 20000 : 100;
      const d = n => new Date(Date.now() - n * DIA).toISOString().slice(0, 10), out = [], cod = n => 10000000 + n * 7919 % 89999999;
      const nf = (id, s, numero, dia, o = {}) => { const em = d(dia), q = o.q || q0, it = {desc: o.desc || desc, ncm: o.ncm || ncm, cfop: o.cfop || (s.uf === "SP" ? "5102" : "6102"), un, qtd: q, vUn: o.vUn || vUn, vTot: q * (o.vUn || vUn)};
        let ch = montaChave(s.uf || "SP", em.slice(2, 4) + em.slice(5, 7), s.doc, "55", 1, numero, cod(numero)); if (o.chaveRuim) ch = ch.slice(0, 43) + ((+ch[43] + 3) % 10);
        out.push(["operacoes", id, {tipo: "nf", origem: "xml", lote: "ex-lote", arquivo: "EXEMPLO_notas.zip", criadoEm: nowISO(), supplierId: s.id, nf: {chave: ch, numero: String(numero), serie: "1", modelo: "55", tp: "1", emissao: em, natOp: o.natOp || "Venda de mercadoria",
          emitDoc: dl(s.doc), emitNome: s.nome, emitUF: s.uf || "", emitMun: s.municipio || "", destDoc: "", destNome: "Cliente contratante", itens: [it], vNF: it.vTot, pedidoRef: o.ped || "", situacao: o.sit || "autorizada", sitFonte: o.sit === "nao_verificada" ? "" : "protocolo no XML", protocolo: o.sit === "nao_verificada" ? null : {cStat: o.sit === "cancelada" ? "101" : "100", nProt: "1352600000" + numero}}}]); return it.vTot; };
      const pag = (id, s, dia, valor, ref, o = {}) => out.push(["operacoes", id, {tipo: "pag", origem: "cnab240", lote: "ex-lote-pag", arquivo: "EXEMPLO_retorno.ret", criadoEm: nowISO(), pag: {data: d(dia), valor, favNome: o.favNome || s.nome, favDoc: o.favDoc != null ? o.favDoc : dl(s.doc), ref, forma: o.forma || "Crédito em conta (CNAB)", banco: "", situacao: "efetuado"}}]);
      const ped = (id, s, numero, dia, q, o = {}) => out.push(["operacoes", id, {tipo: "ped", origem: "planilha", lote: "ex-lote-ped", arquivo: "EXEMPLO_pedidos.xlsx", criadoEm: nowISO(), ped: {numero, data: d(dia), fornDoc: dl(s.doc), fornNome: s.nome, itens: [{desc, ncm, un, qtd: q, vUn: o.vUn || vUn, vTot: q * (o.vUn || vUn)}], vTot: q * (o.vUn || vUn)}}]);
      /* fornecedor A: operação regular, conciliada */
      ped("ex-op-p1", A1, "PC-2026-101", 95, q0); ped("ex-op-p2", A1, "PC-2026-102", 65, q0); ped("ex-op-p3", A1, "PC-2026-103", 35, q0, {vUn: vUn * .97});
      pag("ex-op-g1", A1, 75, nf("ex-op-n1", A1, 4521, 90, {ped: "PC-2026-101"}), "NF 4521"); pag("ex-op-g2", A1, 45, nf("ex-op-n2", A1, 4588, 60, {ped: "PC-2026-102"}), "NF 4588"); nf("ex-op-n3", A1, 4630, 30, {ped: "PC-2026-103"});
      /* fornecedor B: notas sequenciais, objeto e CFOP fora do produto, pagamento a terceiro e em espécie */
      [101, 102, 103, 104, 105].forEach((n, i) => { const v = nf("ex-op-b" + n, B1, n, 80 - i * 12, n === 103 ? {desc: "Material de construção diverso", ncm: "68101900", cfop: "5949", natOp: "Outras saídas"} : {});
        if (n === 104) pag("ex-op-gb4", B1, 30, v, "NF 104", {favNome: "EXEMPLO Pessoa Física Recebedora", favDoc: "52998224725", forma: "PIX"});
        if (n === 105) pag("ex-op-gb5", B1, 15, v, "NF 105", {forma: "Espécie / saque"}); });
      /* N2: chave adulterada e nota cancelada paga */
      if (C2){ const v = nf("ex-op-c1", C2, 3310, 50, {chaveRuim: true}); pag("ex-op-gc1", C2, 40, v, "NF 3310"); const v2 = nf("ex-op-c2", C2, 3311, 25, {sit: "cancelada"}); pag("ex-op-gc2", C2, 20, v2, "NF 3311"); }
      pag("ex-op-gx", A1, 10, 48000, "adiantamento", {favNome: "EXEMPLO Intermediário Sem Cadastro", favDoc: "11444777000161", forma: "TED"});
      /* notas de fornecedores ainda fora da cadeia: o sistema sugere incluí-los (N2 do primeiro N1 e N3 do N2) */
      const novo = (id, emit, dest, numero, dia) => { const em = d(dia), it = {desc, ncm, cfop: "5102", un, qtd: q0 / 2, vUn: vUn * .9, vTot: q0 / 2 * vUn * .9}, ch = montaChave(emit.uf, em.slice(2, 4) + em.slice(5, 7), emit.doc, "55", 1, numero, cod(numero));
        out.push(["operacoes", id, {tipo: "nf", origem: "xml", lote: "ex-lote", arquivo: "EXEMPLO_notas.zip", criadoEm: nowISO(), nf: {chave: ch, numero: String(numero), serie: "1", modelo: "55", tp: "1", emissao: em, natOp: "Venda de produção do estabelecimento",
          emitDoc: emit.doc, emitNome: emit.nome, emitUF: emit.uf, emitMun: emit.mun, destDoc: dl(dest.doc), destNome: dest.nome, destUF: dest.uf || "", itens: [it], vNF: it.vTot, pedidoRef: "", situacao: "autorizada", sitFonte: "protocolo no XML", protocolo: {cStat: "100", nProt: "1352600009" + numero}}}]); };
      novo("ex-op-m1", {doc: "11222333000181", nome: "EXEMPLO Fornecedora Identificada nas Notas Ltda.", uf: A1.uf || "SP", mun: A1.municipio || ""}, A1, 870, 55);
      novo("ex-op-m2", {doc: "11222333000181", nome: "EXEMPLO Fornecedora Identificada nas Notas Ltda.", uf: A1.uf || "SP", mun: A1.municipio || ""}, A1, 871, 28);
      if (C2) novo("ex-op-m3", {doc: "11144477735", nome: "EXEMPLO Produtor Identificado nas Notas", uf: C2.uf || "SP", mun: C2.municipio || ""}, C2, 45, 33);
      window.SEED.push(...out);
    }
  }
  return {analise, render, importar, abrirNF, ler, lerXML, lerSPED, lerCNAB240, lerOFX, chaveOk, montaChave, SEG};
})();
