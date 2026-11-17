/* ================= KINSEY CAPITAL · MANDATO DE VENDA AUTOMÁTICO (JURÍDICO) =================
   Modelo Kinsey BR de mandato (sell-side) preenchido com o cadastro do target e com as condições calculadas:
   - success fee: 6% do valor total da transação;
   - valor mínimo da operação: valuation do target ou, enquanto não houver, múltiplo de mercado sobre o faturamento
     (ou EBITDA) do balancete/cadastro, arredondado ao milhão mais próximo (6,6 mi → 7 mi; 6,4 mi → 6 mi);
   - remuneração de sucesso mínima: valor mínimo × 6%;
   - retainer: 10% do sucesso mínimo, em parcelas mensais; a 1ª vence 15 dias após a apresentação do primeiro NDA
     assinado com investidor (as demais a cada 30 dias) e o retainer é abatido do success fee.
   Jurídico · Mandatos: confere os dados, ajusta as condições, emite a minuta em Word para revisão jurídica e registra
   a aprovação. Percentuais e prazos padrão em MA_MANDATO_PADRAO (data.js). */
if (window.KT_DD) (() => {
  const D = KT_DD, P0 = typeof MA_MANDATO_PADRAO !== "undefined" ? MA_MANDATO_PADRAO : {pct:6, retPct:10, parcelas:10, dias:15, prazo:24, resil:13, tail:12, trib:16};
  /* ---------- números por extenso ---------- */
  const U = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"],
    DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"],
    CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  const ate999 = n => { if (n === 100) return "cem"; const c = Math.floor(n / 100), r = n % 100, p = []; if (c) p.push(CT[c]);
    if (r) p.push(r < 20 ? U[r] : DZ[Math.floor(r / 10)] + (r % 10 ? " e " + U[r % 10] : "")); return p.join(" e "); };
  function extenso(n){
    n = Math.round(Math.abs(n)); if (!n) return "zero"; const G = [], NOM = [["", ""], ["mil", "mil"], ["milhão", "milhões"], ["bilhão", "bilhões"]];
    while (n > 0){ G.push(n % 1000); n = Math.floor(n / 1000); }
    const P = []; for (let k = G.length - 1; k >= 0; k--){ const v = G[k]; if (!v) continue; P.push({v, t:k === 1 && v === 1 ? "mil" : ate999(v) + (k ? " " + NOM[k][v === 1 ? 0 : 1] : "")}); }
    return P.map((p, i) => i === 0 ? p.t : (i === P.length - 1 && (p.v < 100 || p.v % 100 === 0) ? " e " : ", ") + p.t).join("");
  }
  const fem = t => t.replace(/\bum\b/g, "uma").replace(/\bdois\b/g, "duas").replace(/entos\b/g, "entas");
  const brl = v => "R$ " + (+v).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
  const reais = v => { v = Math.round(v * 100) / 100; const i = Math.floor(v + 1e-9), c = Math.round((v - i) * 100); let e = extenso(i);
    if (/(milhão|milhões|bilhão|bilhões)$/.test(e)) e += " de"; let t = i ? `${e} ${i === 1 ? "real" : "reais"}` : "";
    if (c) t += (t ? " e " : "") + extenso(c) + (c === 1 ? " centavo" : " centavos"); return `${brl(v)} (${t || "zero real"})`; };
  const pctTxt = p => { p = +p; const int = Math.floor(p), dec = Math.round((p - int) * 10);
    return `${String(p).replace(".", ",")}% (${extenso(int)}${dec ? " vírgula " + extenso(dec) : ""} por cento)`; };
  const qtd = (n, f) => `${n} (${f ? fem(extenso(n)) : extenso(n)})`;
  const ORDU = ["", "primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "sétimo", "oitavo", "nono"], ORDD = ["", "décimo", "vigésimo", "trigésimo", "quadragésimo"];
  const ordinal = n => `${n}º (${[ORDD[Math.floor(n / 10)], ORDU[n % 10]].filter(Boolean).join(" ")})`;
  const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const dataExt = d => `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const somaDias = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const arred = v => v >= 1e6 ? Math.round(v / 1e6) * 1e6 : Math.round(v / 1e5) * 1e5;
  const miTxt = v => v >= 1e6 ? `R$ ${(v / 1e6).toLocaleString("pt-BR", {maximumFractionDigits:2})} mi` : `R$ ${(v / 1e3).toLocaleString("pt-BR", {maximumFractionDigits:0})} mil`;
  const eu = () => Store.me?.email || Store.me?.nome || "";

  /* ---------- condições e cálculo ---------- */
  const cond = s => ({...P0, ...(S.config.mandato_padrao || {}), ...(s.mandato?.cond || {})});
  function valorBase(s){
    const c = cond(s), vm = typeof c.valorManual === "number" ? c.valorManual : num(c.valorManual); if (vm > 0) return {ev:vm * 1e6, fonte:"valor informado pelo Jurídico", tipo:"manual"};
    let V = null; try{ V = window.KT_BASE ? KT_BASE.valorAlvo(s) : null; }catch(e){}
    if (!V || !(V.ev > 0)){ /* sem múltiplo do segmento: múltiplo do faturamento ou FCD prévio pelo faturamento do cadastro */
      const M = metodos(s).L, m = M.find(x => /Receita/.test(x.n)) || M.find(x => /FCD/.test(x.n)) || M[0]; if (!m) return null;
      return {ev:(m.min + m.max) / 2, fonte:m.n.replace(/ · /, ": ") + (m.nota ? " (" + m.nota.split(" · ")[0] + ")" : ""), tipo:/Receita/.test(m.n) ? "faturamento" : /EBITDA/.test(m.n) ? "ebitda" : "fcd"}; }
    const tipo = /valuation/.test(V.fonte) ? "valuation" : /EBITDA/.test(V.fonte) ? "ebitda" : "faturamento";
    return {ev:V.ev, fonte:tipo === "valuation" ? "valuation (meio da faixa moderada)" : V.fonte, tipo};
  }
  const BASETXT = {valuation:"o laudo de avaliação econômico-financeira (valuation) da Empresa", faturamento:"o faturamento anual da Empresa multiplicado pelo múltiplo de mercado do seu segmento (EV/Receita)",
    ebitda:"o EBITDA anual da Empresa multiplicado pelo múltiplo de mercado do seu segmento (EV/EBITDA)", fcd:"o fluxo de caixa descontado projetado a partir do faturamento anual da Empresa", manual:"a estimativa de valor acordada entre as Partes"};
  function calc(s){
    const c = cond(s), B = valorBase(s); if (!B) return {c, B:null};
    const vmin = arred(B.ev), sucMin = vmin * c.pct / 100, parc = Math.round(sucMin * c.retPct / 100 / c.parcelas * 100) / 100, ret = parc * c.parcelas;
    return {c, B, vmin, sucMin, ret, parc};
  }
  /* todas as formas de valor disponíveis para o target (valuation completo, ou prévio pelo faturamento do cadastro) */
  function metodos(s){
    const L = []; let fonte = "";
    try{ if (D.temBal(s) && window.KT_VAL){ const R = KT_VAL.resumo(s); if (R.X && !R.X.vazio){ R.met.forEach(m => L.push({n:m[0], min:m[1], max:m[2], nota:m[3]})); fonte = "valuation com balancetes"; } } }catch(e){}
    if (!L.length && window.KT_VAL){ try{ const Pv = KT_VAL.prev(s); if (!Pv.vazio){ const d = 1 - (KT_VAL.base().P.desc?.v || 0) / 100, C = Pv.C || {};
      L.push({n:"FCD prévio · moderado", min:Pv.ev, max:Pv.ev, nota:`faturamento ${miTxt(Pv.rl)} (${Pv.fonteF}) · margem ${(Pv.mg * 100).toLocaleString("pt-BR", {maximumFractionDigits:1})}% · ${Pv.fonteMg}`});
      if (C.rec) L.push({n:"Múltiplo do faturamento · EV/Receita", min:Pv.rl * C.rec.p25 * d, max:Pv.rl * C.rec.p75 * d, nota:`${C.rec.p25.toFixed(2).replace(".", ",")}x a ${C.rec.p75.toFixed(2).replace(".", ",")}x do segmento, com desconto de liquidez`});
      if (C.eb && Pv.eb) L.push({n:"Múltiplo do EBITDA · EV/EBITDA", min:Pv.eb * C.eb.p25 * d, max:Pv.eb * C.eb.p75 * d, nota:`${C.eb.p25.toFixed(1).replace(".", ",")}x a ${C.eb.p75.toFixed(1).replace(".", ",")}x sobre o EBITDA estimado`});
      fonte = "prévio, pelo faturamento do cadastro"; } }catch(e){} }
    return {L, fonte};
  }
  /* resumo da operação: valor estimado, valor mínimo, 6% e retainer sugerido */
  function resumoHtml(s, o = {}){
    const R = calc(s), M = metodos(s), c = R.c, nda = ndaInv(s), k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b style="font-size:14px">${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const fx = (a, b) => Math.abs(a - b) < 1e3 ? miTxt(a) : `${miTxt(a)} a ${miTxt(b)}`;
    return `<div style="display:flex;flex-direction:column;gap:8px">${o.titulo !== false ? `<div class="eyebrow">Operação estimada · condições Kinsey</div>` : ""}
      <div class="dd-kpis">${k("Valor da operação", R.B ? miTxt(R.B.ev) : "—", R.B ? esc(R.B.fonte) : "sem valuation nem faturamento")}${k("Valor mínimo (arredondado)", R.B ? miTxt(R.vmin) : "—", "ao milhão mais próximo")}
        ${k(`Success fee ${String(c.pct).replace(".", ",")}%`, R.B ? brl(R.sucMin) : "—", "sobre o valor mínimo (sucesso mínimo)")}${k("Retainer sugerido", R.B ? brl(R.ret) : "—", R.B ? `${c.retPct}% do sucesso · ${c.parcelas} × ${brl(R.parc)}` : "")}
        ${k("1ª parcela do retainer", nda ? dBR(somaDias(nda.em, c.dias)) : "após o NDA", nda ? `NDA com investidor em ${dBR(nda.em)}` : `${c.dias} dias após o 1º NDA com investidor`)}</div>
      ${M.L.length ? `<div class="tbl"><table><thead><tr><th>Como o valor foi apurado (${esc(M.fonte)})</th><th>Valor</th><th>Base</th></tr></thead><tbody>${M.L.map(m => `<tr><td>${esc(m.n)}</td><td class="dd-num" style="white-space:nowrap">${fx(m.min, m.max)}</td><td class="sub" style="font-size:12px">${esc(m.nota || "")}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`;
  }
  /* primeiro NDA assinado por investidor no mandato (acesso em NDA, data room, IOI ou LOI) */
  function ndaInv(s){
    const m = s.mandato || {}; if (m.ndaInv?.em) return m.ndaInv;
    const L = Object.entries(m.acessos || {}).filter(([, a]) => /^(nda|dataroom|ioi|loi)$/.test(a?.status || "") && a.em).sort((a, b) => String(a[1].em).localeCompare(b[1].em));
    return L.length ? {id:L[0][0], em:L[0][1].em} : null;
  }
  const parcelas = (s, R) => { const n = ndaInv(s); if (!n || !R.parc) return []; const d1 = somaDias(n.em, R.c.dias); return [...Array(R.c.parcelas)].map((_, i) => ({n:i + 1, venc:somaDias(d1, 30 * i), valor:R.parc})); };

  /* ---------- dados do cadastro ---------- */
  function socios(s){
    const r = s.receita && !s.receita.erro ? s.receita : {}, J = s.jdd?.soc?.ext?.socios || [], R = (r.socios || []).filter(p => p.nome);
    const nomes = (J.length ? J : R).map(p => ({nome:String(p.nome).trim(), qual:p.qual || "", pct:p.pct}));
    return nomes;
  }
  function partes(s){
    const r = s.receita && !s.receita.erro ? s.receita : {}, mun = r.municipio || s.municipio || "", uf = r.uf || s.uf || "";
    const end = [r.endereco || s.endereco || "", mun && `${mun}${uf ? "/" + uf : ""}`, r.cep ? "CEP " + String(r.cep).replace(/^(\d{5})(\d{3})$/, "$1-$2") : ""].filter(Boolean).join(", ");
    const SO = socios(s), quali = "[nacionalidade, estado civil e profissão], inscrito(a) no CPF/MF sob o nº [CPF], residente e domiciliado(a) em [endereço]";
    const soc = SO.length ? SO.map(p => `${p.nome.toUpperCase()}, ${quali}`) : [`[NOME DO SÓCIO], ${quali}`];
    const adm = SO.find(p => /administr/i.test(p.qual)) || SO[0];
    return {EMPRESA:(r.razao || s.razao || s.nome || "[razão social]").trim(), DOC:s.doc || r.cnpj || "[CNPJ]", ENDERECO:end || "[endereço completo da sede]",
      ATIVIDADE:r.cnaeDesc ? "tem como atividade principal " + r.cnaeDesc.toLowerCase() : (s.perfil?.segmento || s.segmento) ? "atua no segmento de " + String(s.perfil?.segmento || s.segmento).toLowerCase() : "[descrever a atividade da Empresa]",
      SOCIOS:soc.length > 1 ? soc.slice(0, -1).join("; ") + "; e " + soc[soc.length - 1] : soc[0], REPRESENTANTE:s.nda?.nome || adm?.nome || "[representante legal]", _socios:SO, _end:!!end};
  }
  function campos(s){
    const R = calc(s), c = R.c, Pt = partes(s), hoje0 = new Date(), db = new Date(hoje0.getFullYear(), hoje0.getMonth(), 0);
    const o = {...Pt, KINSEY:window.KT_MARCA && !KT_MARCA.kinsey() ? "[razão social, CNPJ, endereço e representante legal da assessoria contratada]" : typeof MA_KINSEY !== "undefined" ? MA_KINSEY : "KINSEY BR", SUCPCT:pctTxt(c.pct), RETPCT:pctTxt(c.retPct), PARCELAS:qtd(c.parcelas, true), RETDIAS:qtd(c.dias),
      TRIBUTOS:pctTxt(c.trib), PRAZO:qtd(c.prazo), RESILICAO:ordinal(c.resil), TAIL:qtd(c.tail), DATABASE:c.database || dataExt(db), DATA:`São Paulo, ${dataExt(hoje0)}`,
      VALORMIN:R.B ? reais(R.vmin) : "[valor mínimo da operação]", BASEMIN:R.B ? BASETXT[R.B.tipo] : "[base do valor: valuation ou múltiplo do faturamento]",
      SUCMIN:R.B ? reais(R.sucMin) : "[remuneração de sucesso mínima]", RETTOTAL:R.B ? reais(R.ret) : "[valor total do retainer]", PARCELA:R.B ? reais(R.parc) : "[valor da parcela]"};
    o.SUCCESS = `${c.pct}% do valor total da transação${R.B ? `, com mínimo de ${brl(R.sucMin)}` : ""}`;
    o.RETAINER = R.B ? `${c.parcelas} parcelas mensais de ${brl(R.parc)} (1ª ${c.dias} dias após o primeiro NDA assinado com investidor)` : "[retainer]";
    delete o._socios; delete o._end; return o;
  }
  const modeloTexto = () => { const o = S.config.modelos_ma?.mandato_venda; const m = MA_MODELOS.find(x => x.id === "mandato_venda");
    return o?.texto?.length ? {...m, texto:o.texto, versao:o.versao || "oficial"} : m; };
  const preenche = (txt, c) => String(txt).replace(/\{([A-Z]+)\}/g, (m, k) => c[k] != null ? c[k] : m);
  const pendencias = c => { const t = modeloTexto().texto.map(([h, x]) => preenche(h, c) + "\n" + preenche(x, c)).join("\n"); return [...new Set(t.match(/\[[^\]]{2,80}\]/g) || [])]; };

  /* ---------- Word (.docx) da minuta ---------- */
  const xe = t => String(window.KT_MARCA ? KT_MARCA.txt(String(t)) : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.pend ? '<w:highlight w:val="yellow"/>' : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ""}</w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
  const par = (t, o = {}) => `<w:p><w:pPr>${o.brk ? '<w:pageBreakBefore/>' : ""}${o.keep ? "<w:keepNext/>" : ""}<w:spacing w:before="${o.before || 0}" w:after="${o.after ?? 120}" w:line="276" w:lineRule="auto"/>${o.ind ? `<w:ind w:left="${o.ind}"/>` : ""}<w:jc w:val="${o.jc || "both"}"/></w:pPr>${String(t).split(/(\[[^\]]+\])/).filter(Boolean).map(x => run(x, {...o, pend:/^\[.*\]$/.test(x)})).join("")}</w:p>`;
  function docx(s, R, c, versao){
    const m = modeloTexto(), B = [], cod = s.mandato?.codinome;
    m.texto.forEach(([h, t], i) => {
      if (i === 0){ B.push(par(preenche(h, c), {b:true, jc:"center", sz:26, after:240})); }
      else B.push(par(preenche(h, c), {b:true, keep:true, before:180, sz:22}));
      preenche(t, c).split("\n").forEach(l => { const fase = /^Fase [IV]+:$/.test(l), item = /^\([a-z]\)/.test(l); B.push(par(l, {b:fase, ind:item ? 360 : 0, keep:fase})); });
    });
    /* assinaturas */
    const ass = (nome, papel) => par("______________________________________________", {jc:"left", before:420, after:0}) + par(nome, {b:true, jc:"left", after:0}) + par(papel, {jc:"left", after:120});
    B.push(ass(c.EMPRESA, "Contratante"));
    (partes(s)._socios.length ? partes(s)._socios : [{nome:"[NOME DO SÓCIO]"}]).forEach(p => B.push(ass(p.nome.toUpperCase(), "Sócio(a) e interveniente anuente")));
    if (!window.KT_MARCA || KT_MARCA.kinsey()){ B.push(ass("KINSEY ALLEN BRASIL CONSULTORIA ESPECIALIZADA E M&A LTDA.", "Contratada · Newton K. dos Anjos Oliveira"));
      B.push(ass("KINSEY CAPITAL BRASIL CONSULTORIA E M&A LTDA.", "Contratada · Newton K. dos Anjos Oliveira")); }
    else B.push(ass("[ASSESSORIA CONTRATADA]", "Contratada · [representante legal]"));
    B.push(par("Testemunhas:", {b:true, jc:"left", before:300}));
    B.push(ass("Nome: [testemunha 1]", "CPF: [CPF]")); B.push(ass("Nome: [testemunha 2]", "CPF: [CPF]"));
    /* quadro de conferência para o Jurídico (não integra o contrato) */
    const L = [["Target", s.nome + (cod ? ` · nome-código ${cod}` : "")], ["Valor estimado", R.B ? `${miTxt(R.B.ev)} · ${R.B.fonte}` : "sem base: informar valuation, faturamento ou valor manual"],
      ["Valor mínimo da operação (arredondado)", R.B ? brl(R.vmin) : "—"], ["Success fee", `${c.SUCPCT} do valor total da transação`], ["Remuneração de sucesso mínima", R.B ? brl(R.sucMin) : "—"],
      ["Retainer", R.B ? `${R.c.retPct}% do sucesso mínimo = ${brl(R.ret)} em ${R.c.parcelas} × ${brl(R.parc)}, abatido do success fee` : "—"],
      ["Início do retainer", `${R.c.dias} dias após a apresentação do primeiro NDA assinado com investidor${ndaInv(s) ? ` · NDA em ${dBR(ndaInv(s).em)} → 1ª parcela em ${dBR(somaDias(ndaInv(s).em, R.c.dias))}` : " · ainda sem NDA de investidor"}`],
      ["Tributos sobre o retainer", c.TRIBUTOS + " (Simples Nacional)"], ["Prazo e cauda", `${R.c.prazo} meses (resilição a partir do ${R.c.resil}º mês) · cauda de ${R.c.tail} meses`],
      ["Campos a completar (em amarelo)", pendencias(c).join("; ") || "nenhum"]];
    B.push(par("QUADRO DE CONFERÊNCIA DA MINUTA (não integra o contrato)", {brk:true, b:true, jc:"left", sz:22, after:200}));
    L.forEach(([k, v]) => B.push(par(`${k}: ${v}`, {jc:"left", after:80})));
    B.push(par(`Minuta ${versao} emitida pelo KinseyTec M&A em ${dBR(nowISO())} por ${eu() || "usuário"} para revisão jurídica. Modelo: ${m.versao}.`, {i:true, jc:"left", before:200, color:"5A6578", sz:18}));
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${B.join("")}<w:sectPr><w:headerReference w:type="default" r:id="rId1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const hdr = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${par(`MINUTA PARA REVISÃO JURÍDICA · versão ${versao} · ${cod || c.EMPRESA} · ${dBR(nowISO())} · não assinar antes da aprovação do Jurídico`, {jc:"right", sz:16, color:"B0302B", after:0})}</w:hdr>`;
    const sty = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
    const drels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe("Minuta de mandato · " + (cod || c.EMPRESA))}</dc:title><dc:creator>Kinsey BR</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`;
    const en = new TextEncoder();
    return KT_XLSX.zip([["[Content_Types].xml", en.encode(ct)], ["_rels/.rels", en.encode(rels)], ["word/document.xml", en.encode(doc)], ["word/_rels/document.xml.rels", en.encode(drels)], ["word/styles.xml", en.encode(sty)], ["word/header1.xml", en.encode(hdr)], ["docProps/core.xml", en.encode(core)]]);
  }

  /* ---------- emissão e revisão jurídica ---------- */
  async function emitir(s){
    const R = calc(s), c = campos(s), M = s.mandato || {}, n = (M.minutas || []).length + 1;
    const bytes = docx(s, R, c, n), nome = `Minuta_mandato_${(M.codinome || s.nome || "target").replace(/[^\wÀ-ú]+/g, "_").slice(0, 40)}_v${n}.docx`;
    await rptSave(bytes, nome, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const reg = {n, em:nowISO(), por:eu(), arquivo:nome, vmin:R.vmin || null, sucMin:R.sucMin || null, ret:R.ret || null, parcelas:R.c.parcelas, parc:R.parc || null, pct:R.c.pct, fonte:R.B?.fonte || "", pend:pendencias(c).length};
    const auto = !M.success || M.autoCond;
    await D.up(s, {mandato:{...(M.status ? {} : {status:"minuta"}), minutas:[...(M.minutas || []), reg], revisao:{status:"pendente", versao:n, em:reg.em},
      ...(auto ? {success:c.SUCCESS, retainer:c.RETAINER, autoCond:true} : {}), ...(R.B ? {valorMinimo:R.vmin, sucessoMinimo:R.sucMin} : {})}});
    toast(`Minuta v${n} emitida para revisão jurídica`);
  }
  async function revisar(s, st){
    const nota = st === "ajustes" ? prompt("O que precisa ser ajustado na minuta?", "") : ""; if (nota == null) return;
    const M = s.mandato || {}, v = M.revisao?.versao || (M.minutas || []).length, L = (M.minutas || []).map(x => x.n === v ? {...x, revisao:st, revPor:eu(), revEm:nowISO(), nota} : x);
    await D.up(s, {mandato:{minutas:L, revisao:{status:st, versao:v, em:nowISO(), por:eu(), nota}, ...(st === "aprovada" && (!M.status || M.status === "minuta") ? {status:"minuta"} : {})}});
    toast(st === "aprovada" ? `Minuta v${v} aprovada pelo Jurídico: pode ser enviada ao target` : "Ajustes pedidos na minuta"); renderJuridico();
  }

  /* ---------- tela: Jurídico · Mandatos ---------- */
  const REV = {pendente:["Aguardando revisão jurídica", "r-medio"], aprovada:["Aprovada pelo Jurídico", "r-baixo"], ajustes:["Ajustes pedidos", "r-alto"]};
  const kpi = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
  function painel(host){
    const T = S.suppliers.filter(x => x.nivel === "N3" && x.etapa !== "descartada").sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt"));
    let s = supById(S.mandAlvo); if (!s || s.nivel !== "N3") s = T.find(x => x.mandato?.minutas?.length) || T.find(x => x.mandato?.status) || T[0];
    const el = document.createElement("div"); el.style.cssText = "display:flex;flex-direction:column;gap:14px"; el.id = "jur-mand";
    if (!s){ el.innerHTML = `<div class="empty">Nenhum target cadastrado. Cadastre o target na Base inicial para emitir o mandato.</div>`; host.appendChild(el); return; }
    S.mandAlvo = s.id; const ed = D.ed(), R = calc(s), c = R.c, Pt = partes(s), CP = campos(s), pend = pendencias(CP), M = s.mandato || {}, nda = ndaInv(s), PL = R.B ? parcelas(s, R) : [];
    if (nda && !M.ndaInv && ed) save(Store.update("suppliers", s.id, {mandato:{ndaInv:nda}}));
    const linha = (k, v, ok, dica) => `<tr><td style="white-space:nowrap">${k}</td><td>${ok ? esc(v) : `<span class="pill r-alto">a completar</span> <span class="sub" style="font-size:12px">${esc(dica || "")}</span>`}</td></tr>`;
    const inv = nda ? supById(nda.id) : null, rv = M.revisao;
    el.innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:12px">
        <div class="head" style="margin:0"><div><div class="eyebrow">Jurídico · Mandatos</div><h3 style="margin:0">Mandato de venda · minuta automática</h3>
          <p class="sub" style="margin:2px 0 0">Modelo Kinsey BR preenchido com o cadastro do target e com as condições calculadas. Emita a minuta em Word, revise e aprove antes de enviar ao target.</p></div></div>
        <div class="form"><div class="fld full"><label for="jm-alvo">Target</label><select id="jm-alvo">${T.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${esc(x.nome)}${x.mandato?.codinome ? " · " + esc(x.mandato.codinome) : ""}${x.mandato?.revisao ? " · " + esc(REV[x.mandato.revisao.status]?.[0] || "") : ""}</option>`).join("")}</select></div></div>
        <div class="dd-kpis">${kpi("Valor mínimo da operação", R.B ? miTxt(R.vmin) : "—", R.B ? `estimado ${miTxt(R.B.ev)} · ${esc(R.B.fonte)}` : "sem valuation nem faturamento")}
          ${kpi("Success fee", `${String(c.pct).replace(".", ",")}%`, R.B ? `mínimo ${brl(R.sucMin)}` : "do valor total da transação")}
          ${kpi("Retainer", R.B ? brl(R.ret) : "—", R.B ? `${c.retPct}% do sucesso mínimo · ${c.parcelas} × ${brl(R.parc)}` : "")}
          ${kpi("Início do retainer", nda ? dBR(somaDias(nda.em, c.dias)) : "após o NDA", nda ? `NDA de ${esc(inv?.nome || "investidor")} em ${dBR(nda.em)} + ${c.dias} dias` : `${c.dias} dias após o 1º NDA assinado com investidor`)}</div>
        ${(() => { const pm = num(String(M.success || "").match(/^\s*([\d.,]+)\s*%/)?.[1]); return pm != null && !M.autoCond && pm !== c.pct ? `<div class="banner" style="font-size:13px">O mandato registrado no dossiê tem success fee de ${String(pm).replace(".", ",")}%; a minuta usa ${String(c.pct).replace(".", ",")}%. Ajuste em "Condições do mandato" se a condição negociada for outra.</div>` : ""; })()}
        ${metodos(s).L.length ? `<details ${S.jmMet ? "open" : ""} id="jm-met"><summary class="sub">Como o valor foi apurado (${esc(metodos(s).fonte)})</summary>${resumoHtml(s, {titulo:false}).replace(/^[\s\S]*?<\/div>\s*(<div class="tbl">)/, "$1")}</details>` : ""}
        ${R.B ? "" : `<div class="banner" style="font-size:13px">Sem base para o valor mínimo: importe o balancete na Due Diligence (o sistema usa o múltiplo do faturamento do segmento), faça o valuation ou informe o valor abaixo.</div>`}
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Dados do cadastro que vão para o mandato</h3>
        <div class="tbl"><table><tbody>${linha("Razão social", Pt.EMPRESA, !/^\[/.test(Pt.EMPRESA))}${linha("CNPJ", Pt.DOC, !/^\[/.test(Pt.DOC), "informe o CNPJ no cadastro")}${linha("Endereço da sede", Pt.ENDERECO, !/^\[/.test(Pt.ENDERECO), "consulta à Receita pelo CNPJ ou cadastro")}
          ${linha("Atividade", Pt.ATIVIDADE, !/^\[/.test(Pt.ATIVIDADE))}${linha("Sócios (intervenientes)", partes(s)._socios.map(p => p.nome + (p.pct ? ` (${(p.pct * 100).toLocaleString("pt-BR", {maximumFractionDigits:1})}%)` : "")).join("; "), partes(s)._socios.length, "anexe o contrato social na Diligência jurídica ou consulte a Receita")}
          ${linha("Representante legal", Pt.REPRESENTANTE, !/^\[/.test(Pt.REPRESENTANTE))}</tbody></table></div>
        <p class="sub" style="margin:0;font-size:12.5px">Qualificação completa dos sócios (nacionalidade, estado civil, profissão, CPF e endereço) e o CNPJ da Kinsey Capital Brasil saem em amarelo na minuta para o Jurídico completar.${pend.length ? ` Campos em amarelo nesta minuta: ${pend.length}.` : ""}</p>
        <div><button type="button" class="btn sm" id="jm-dos">Abrir dossiê do target</button></div></div>
      <form class="card" id="jm-f" style="display:flex;flex-direction:column;gap:10px" novalidate><h3 style="margin:0">Condições do mandato</h3>
        <p class="sub" style="margin:0;font-size:12.5px">Padrão Kinsey: success fee de ${P0.pct}%, valor mínimo arredondado ao milhão, retainer de ${P0.retPct}% do sucesso mínimo em ${P0.parcelas} parcelas, 1ª ${P0.dias} dias após o NDA com investidor. Deixe o valor mínimo em branco para o cálculo automático.</p>
        <div class="form">${[["vm", "Valor mínimo da operação (R$ mi, opcional)", c.valorManual || "", "automático"], ["pc", "Success fee (%)", c.pct], ["rp", "Retainer (% do sucesso mínimo)", c.retPct], ["np", "Parcelas do retainer", c.parcelas], ["di", "1ª parcela: dias após o NDA", c.dias],
          ["pz", "Prazo (meses)", c.prazo], ["rs", "Resilição a partir do mês", c.resil], ["tl", "Cauda (meses)", c.tail], ["tb", "Tributos sobre o retainer (%)", c.trib]].map(([k, l, v, ph]) => `<div class="fld"><label for="jm-${k}">${l}</label><input id="jm-${k}" inputmode="decimal" value="${esc(String(v).replace(".", ","))}" ${ph ? `placeholder="${ph}"` : ""} ${ed ? "" : "disabled"}></div>`).join("")}
          <div class="fld"><label for="jm-db">Data-base do valuation</label><input id="jm-db" value="${esc(c.database || "")}" placeholder="${esc(CP.DATABASE)}" ${ed ? "" : "disabled"}></div></div>
        ${ed ? `<div style="display:flex;justify-content:flex-end"><button type="submit" class="btn">Salvar condições</button></div>` : ""}</form>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3 style="margin:0">Minuta para revisão jurídica</h3>
          <p class="sub" style="margin:2px 0 0">${rv ? `Versão ${rv.versao}: <span class="pill ${REV[rv.status]?.[1] || ""}">${esc(REV[rv.status]?.[0] || rv.status)}</span>${rv.por ? ` · ${esc(rv.por)}` : ""}${rv.nota ? ` · ${esc(rv.nota)}` : ""}` : "Nenhuma minuta emitida para este target."}</p></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${ed ? `<button type="button" class="btn primary" id="jm-emit">${M.minutas?.length ? "Emitir nova versão (Word)" : "Emitir minuta para revisão (Word)"}</button>` : ""}<button type="button" class="btn" id="jm-ver">Ver texto</button>
          ${ed && rv?.status === "pendente" ? `<button type="button" class="btn" id="jm-ok">Aprovar minuta</button><button type="button" class="btn ghost" id="jm-aj">Pedir ajustes</button>` : ""}</div>
        ${M.minutas?.length ? `<div class="tbl"><table><thead><tr><th>Versão</th><th>Emitida</th><th>Valor mínimo</th><th>Retainer</th><th>Revisão</th></tr></thead><tbody>${M.minutas.slice().reverse().map(x => `<tr><td>v${x.n}</td><td>${dBR(x.em)}<div class="sub" style="font-size:11.5px;margin:0">${esc(x.por || "")}</div></td><td class="dd-num">${x.vmin ? miTxt(x.vmin) : "—"}</td><td class="dd-num">${x.ret ? brl(x.ret) : "—"}</td><td>${x.revisao ? `<span class="pill ${REV[x.revisao]?.[1]}">${esc(REV[x.revisao]?.[0])}</span>${x.nota ? `<div class="sub" style="font-size:11.5px;margin:0">${esc(x.nota)}</div>` : ""}` : `<span class="pill r-medio">${x.n === rv?.versao ? "Aguardando" : "Substituída"}</span>`}</td></tr>`).join("")}</tbody></table></div>` : ""}
        ${PL.length ? `<details><summary class="sub">Cronograma do retainer (${PL.length} parcelas, a partir de ${dBR(PL[0].venc)})</summary><div class="tbl"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead><tbody>${PL.map(p => `<tr><td>${p.n}ª</td><td>${dBR(p.venc)}</td><td class="dd-num">${brl(p.valor)}</td></tr>`).join("")}</tbody></table></div><p class="sub" style="margin:4px 0 0;font-size:12px">Mais tributos de ${String(c.trib).replace(".", ",")}% por parcela. O retainer pago é abatido do success fee no fechamento.</p></details>` : ""}
      </div>`;
    host.appendChild(el);
    $("#jm-alvo", el).onchange = e => { S.mandAlvo = e.target.value; renderJuridico(); };
    $("#jm-dos", el).onclick = () => openSupplier(s.id, "ma");
    const f = $("#jm-f", el); f.onsubmit = async e => { e.preventDefault(); if (!ed) return; const v = k => $("#jm-" + k, el).value.trim(), n = (k, d) => { const x = num(v(k)); return x > 0 ? x : d; };
      await D.up(s, {mandato:{cond:{valorManual:num(v("vm")) > 0 ? num(v("vm")) : 0, pct:n("pc", P0.pct), retPct:n("rp", P0.retPct), parcelas:Math.round(n("np", P0.parcelas)), dias:Math.round(n("di", P0.dias)),
        prazo:Math.round(n("pz", P0.prazo)), resil:Math.round(n("rs", P0.resil)), tail:Math.round(n("tl", P0.tail)), trib:n("tb", P0.trib), database:v("db")}}}); toast("Condições do mandato salvas"); renderJuridico(); };
    const em = $("#jm-emit", el); if (em) em.onclick = async () => { em.disabled = true; try{ await emitir(supById(s.id) || s); }catch(x){ console.error(x); toast("Não foi possível gerar a minuta."); } renderJuridico(); };
    $("#jm-ver", el).onclick = () => { const m = modeloTexto(), txt = m.texto.map(([h, t]) => `${preenche(h, CP)}\n${preenche(t, CP)}`).join("\n\n");
      sheet(`<div class="sheet-h"><div><div class="eyebrow">Minuta · ${esc(m.versao)}</div><h2>${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
        <div class="sheet-b"><textarea rows="24" readonly style="width:100%;font-size:12.5px;line-height:1.5;background:transparent;color:inherit;border:1px solid var(--line);border-radius:8px;padding:10px" aria-label="Texto da minuta">${esc(txt)}</textarea></div>`); };
    const ok = $("#jm-ok", el); if (ok) ok.onclick = () => revisar(s, "aprovada");
    const aj = $("#jm-aj", el); if (aj) aj.onclick = () => revisar(s, "ajustes");
  }

  /* aba "Mandatos" no Jurídico */
  if (typeof renderJuridico === "function"){ const _jr = renderJuridico;
    renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return; const tabs = host.querySelector(".dd-tabs"); if (!tabs) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "fbtn"; b.dataset.jur = "mand"; b.textContent = "Mandatos"; b.setAttribute("aria-pressed", String(S.jurTab === "mand"));
      const docs = tabs.querySelector('[data-jur="docs"]'); if (docs) docs.before(b); else tabs.appendChild(b);
      b.onclick = () => { S.jurTab = "mand"; renderJuridico(); };
      if (S.jurTab !== "mand") return;
      tabs.querySelectorAll("[data-jur]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.jur === "mand")));
      const top = tabs.closest("#juridico > *") || tabs.parentElement; while (top.nextSibling) top.nextSibling.remove();
      try{ painel(host); }catch(e){ console.error(e); host.insertAdjacentHTML("beforeend", `<div class="empty">Não foi possível montar o mandato.</div>`); } };
  }
  /* dossiê do target: resumo das condições e atalho para o Jurídico */
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); if (s.nivel !== "N3") return; const R = calc(s), M = s.mandato || {}, nda = ndaInv(s), rv = M.revisao;
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<div class="head" style="margin:0"><div><h3 style="margin:0">Mandato · condições Kinsey</h3><p class="sub" style="margin:2px 0 0">${rv ? `Minuta v${rv.versao}: ${esc(REV[rv.status]?.[0] || rv.status)}` : "Minuta ainda não emitida"} · calculado com ${R.B ? esc(R.B.fonte) : "sem base de valor"}</p></div></div>
      <div class="dd-kpis">${kpi("Valor mínimo", R.B ? miTxt(R.vmin) : "—")}${kpi("Sucesso mínimo", R.B ? brl(R.sucMin) : "—", `${String(R.c.pct).replace(".", ",")}% do valor`)}${kpi("Retainer", R.B ? brl(R.ret) : "—", R.B ? `${R.c.parcelas} × ${brl(R.parc)}` : "")}${kpi("1ª parcela", nda ? dBR(somaDias(nda.em, R.c.dias)) : "após o NDA", nda ? `NDA em ${dBR(nda.em)}` : `${R.c.dias} dias após o NDA com investidor`)}</div>
      <div><button type="button" class="btn sm primary" data-jm-ir>Mandato no Jurídico</button></div>`;
    (b.firstElementChild || b).appendChild(el);
    el.querySelector("[data-jm-ir]").onclick = () => { S.jurTab = "mand"; S.mandAlvo = s.id; $("#layer").innerHTML = ""; S.openSup = null; go("juridico"); }; };

  window.KT_MAND = {brl, pctTxt, qtd, dataExt, metodos, resumoHtml, campos, calc, cond, valorBase, arred, extenso, reais, ndaInv, parcelas, docx, emitir, partes, pendencias};
})();
