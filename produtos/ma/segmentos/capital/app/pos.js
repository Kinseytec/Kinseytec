/* ================= KINSEY CAPITAL · PÓS-AQUISIÇÃO =================
   PPA (purchase price allocation, CPC 15 / IFRS 3) a partir do valuation e do SPA: preço pago, ativos líquidos do
   balancete ajustado pela Due Diligence, mais-valias, intangíveis identificados (carteira de clientes, marca,
   tecnologia), IR diferido, ágio (goodwill) e participação de não controladores.
   Base de modelos: PPA, SPA e outros documentos da Kinsey usados como referência para montar novas minutas. */
if (window.KT_DD && window.KT_VAL) (() => {
  const D = KT_DD, V = KT_VAL, {mi, pc, div} = D;
  const n = v => num(v);
  (() => { const nav = $("nav.tabs"), a = nav && $("[data-go=apresentacao]", nav); if (!a) return;
    a.insertAdjacentHTML("afterend", `<button type="button" data-go="pos"><svg viewBox="0 0 24 24"><path d="M4 20V9l8-5 8 5v11z"/><path d="M9 20v-6h6v6"/></svg>Pós-aquisição</button>`);
    $("#v-apresentacao").insertAdjacentHTML("afterend", `<section class="view" id="v-pos" data-view="pos" hidden><div class="pad" id="pos"></div></section>`); })();

  /* ---------------- PPA ---------------- */
  function precoSPA(s){ const k = S.contracts.filter(c => c.supplierId === s.id && /SPA|compra e venda de participa/i.test(c.tipo || "") && num(c.volume)).sort((a, b) => String(b.criadoEm).localeCompare(a.criadoEm))[0]; return k ? {v:num(k.volume) * 1e6, ref:`${k.tipo} ${k.numero || ""}`.trim()} : null; }
  /* fator de benefício fiscal da amortização (TAB): n anos, taxa r, alíquota t, meio de ano */
  const tabF = (n, r, t) => { if (!(n > 0) || !(t > 0)) return 1; const pva = (1 - Math.pow(1 + r, -n)) / r * Math.pow(1 + r, .5); return n / (n - t * pva); };
  const dfm = (r, y) => 1 / Math.pow(1 + r, y - .5);
  function ppa(s){
    const R = (window.KT_EO && KT_EO.ctx(s)) || V.resumo(s), X = R.X; if (!X || X.vazio) return null; const q = {...(window.KT_EO ? KT_EO.padroes(s) : {}), ...(s.pos?.ppa || {})}, W = X.W, P = X.Bs.P;
    const v0 = (k, d) => q[k] != null && q[k] !== "" && !isNaN(q[k]) ? +q[k] : d;
    const t = v0("ir", 34) / 100, regime = s.perfil?.regime || "", wacc = W.wacc, inf = P.infBR.v / 100;
    const spa = precoSPA(s), pct = v0("pct", parseFloat(String(s.mandato?.participacao || "").replace(",", ".")) || 100) / 100;
    /* consideração transferida: à vista + parcelas diferidas a valor presente (Kd) + earn-out a valor justo (WACC) */
    const avista = q.preco != null ? q.preco * 1e6 : spa ? spa.v : ((R.rec[0] + R.rec[1]) / 2 - X.dl) * pct, fonte = q.preco != null ? (s.pos?.ppa?.preco != null ? q.fontePreco || "informado" : q._fp || "informado") : spa ? spa.ref : "faixa moderada do valuation";
    const dif = v0("diferido", 0) * 1e6, nDif = v0("prazoDif", 0), vpDif = nDif > 0 ? dif / Math.pow(1 + W.kd, nDif) : dif;
    const MC = window.KT_EO ? KT_EO.justo(s, {wacc}) : null;
    const eo = MC ? MC.max : v0("earnout", 0) * 1e6 * v0("probEo", 100) / 100, nEo = v0("prazoEo", 0), vpEo = MC ? MC.vj : nEo > 0 ? eo / Math.pow(1 + wacc, nEo) : eo;
    const preco = avista + vpDif + vpEo;
    const K = X.bp.K, G = K.G || {}, f = K.f || 1, rl0 = X.bp.rl, mg = R.mod.c.mg, capexP = X.capex, ncgP = X.ncgp;
    const plContabil = K.PL, ajDD = X.bp.A.pl;
    /* taxas: WACC; intangíveis = WACC + prêmio; capital de giro = (Selic LP + spread) líquido; imobilizado = Kd */
    const premI = v0("taxaAdic", 1) / 100, rI = wacc + premI, rNcg = W.kdLiq, rImob = W.kd;
    const imobBook = Math.max(0, (G.imobilizado || 0) + (G.deprec || 0)), imobMV = v0("imob", 0) * 1e6, imobVJ = imobBook + imobMV;
    const ncgV = Math.max(0, ncgP * rl0 || K.ncg || 0), imobR = div(imobVJ, rl0) || 0, depR = capexP;
    /* força de trabalho (abordagem de custo) */
    const folha = q.folha != null ? q.folha * 1e6 : Math.max(0, ((G.pessoal || 0) + (G.prolabore || 0)) * f);
    const rec = v0("recrut", 3) / 100, trein = v0("trein", 1.5) / 100, prod = v0("prod", 80) / 100, mesesP = v0("mesesProd", 5);
    const wfBruto = folha * (rec + trein + (1 - prod) * mesesP / 12), wf = wfBruto / (1 - t);
    /* marca e tecnologia (relief-from-royalty) */
    const roy = v0("royalty", .5) / 100, vidaM = v0("vidaM", 0), royT = v0("royaltyT", 0) / 100, vidaT = v0("vidaT", 5), gL = R.mod.c.g || inf;
    let vM = 0, vT = 0; const anosM = [], anosT = [];
    const recAno = y => rl0 * Math.pow(1 + gL, y);
    if (roy > 0){ const H = vidaM > 0 ? vidaM : 10; for (let y = 1; y <= H; y++){ const r = recAno(y), fl = r * roy * (1 - t), pv = fl * dfm(rI, y); vM += pv; anosM.push({y, r, fl, pv}); }
      if (!(vidaM > 0) && rI > gL) vM += anosM[anosM.length - 1].fl * (1 + gL) / (rI - gL) * dfm(rI, 10); }
    if (royT > 0 && vidaT > 0) for (let y = 1; y <= vidaT; y++){ const dec = 1 - (y - 1) / vidaT, r = recAno(y) * dec, fl = r * royT * (1 - t), pv = fl * dfm(rI, y); vT += pv; anosT.push({y, r, fl, pv}); }
    const tab = q.tab !== false, tabM = tab && vidaM > 0 ? tabF(vidaM, rI, t) : 1, tabT = tab ? tabF(vidaT, rI, t) : 1;
    vM *= tabM; vT *= tabT; vT += v0("tecnologia", 0) * 1e6;
    /* não concorrência (com e sem): probabilidade de competição × receita exposta × margem */
    const pNc = v0("probNc", 10) / 100, expNc = v0("expNc", 30) / 100, nNc = v0("prazoNc", 5); let vNc = 0; const anosNc = [];
    for (let y = 1; y <= nNc; y++){ const r = recAno(y), perda = r * expNc * mg * (1 - t) * pNc, pv = perda * dfm(rI, y); vNc += pv; anosNc.push({y, r, perda, pv}); }
    const tabNc = tab ? tabF(nNc, rI, t) : 1; vNc *= tabNc;
    /* contratos e exclusividade: resultado da receita contratada pelo prazo restante (não incluir na carteira a mesma receita) */
    const recK = v0("recK", 0) * 1e6, nK = Math.round(v0("prazoK", 0)), mgK = q.mgK != null && q.mgK !== "" ? q.mgK / 100 : mg; let vK = 0; const anosK = [];
    for (let y = 1; y <= nK; y++){ const r = recK * Math.pow(1 + inf, y), fl = r * mgK * (1 - t), pv = fl * dfm(rI, y); vK += pv; anosK.push({y, r, fl, pv}); }
    const tabK = tab && nK > 0 ? tabF(nK, rI, t) : 1; vK *= tabK;
    /* carteira de clientes (MPEEM): receita da base atual com perda anual, encargos dos ativos contributivos */
    const churn = v0("churn", 10) / 100, rC = rI, anosC = []; let vC0 = 0;
    for (let y = 1; y <= 40; y++){ const r = rl0 * Math.pow(1 + inf, y) * Math.pow(1 - churn, y - .5); if (r < rl0 * .01) break;
      const eb = r * mg, ebit = eb - r * depR, nopat = ebit * (1 - t);
      const cNcg = r * div(ncgV, rl0) * rNcg, cImob = r * imobR * rImob * (1 - t) /* retorno sobre; o retorno do ativo já está na D&A */;
      const cWf = r * div(wf, rl0) * wacc, cM = r * roy * (1 - t), cT = r * royT * (1 - t), cNc = r * div(vNc, rl0) * rI;
      const exc = nopat - cNcg - cImob - cWf - cM - cT - cNc;
      const pv = exc * dfm(rC, y); vC0 += Math.max(0, pv); anosC.push({y, r, eb, nopat, cNcg, cImob, cWf, cM, cT, cNc, exc, pv}); }
    let acc = 0, vidaC = anosC.length; for (const a of anosC){ acc += Math.max(0, a.pv); if (acc >= .9 * vC0){ vidaC = a.y; break; } }
    const tabC = tab ? tabF(vidaC, rC, t) : 1, vC = vC0 * tabC;
    const est = v0("estoques", 0) * 1e6, cont = v0("contingencias", 0) * 1e6, intang = vC + vM + vT + vNc + vK;
    const imovMV = v0("imoveis", 0) * 1e6, maisValias = imobMV + imovMV + est + intang, irDif = (maisValias - cont) * t * (q.irDif === false ? 0 : 1);
    const liqVJ = plContabil + ajDD + maisValias - cont - irDif, nci = liqVJ * (1 - pct), goodwill = preco + nci - liqVJ;
    /* WARA: valor da empresa = consideração (100%) + dívida líquida; retorno implícito do ágio */
    const bev = preco / pct + X.dl, gw100 = goodwill / pct;
    const outros = Math.max(0, plContabil + ajDD + X.dl - ncgV - imobBook);
    const wara = [["Capital de giro", ncgV, rNcg], ["Outros ativos líquidos", outros, rNcg], ["Imobilizado a valor justo", imobVJ, rImob * (1 - t)], ["Carteira de clientes", vC, rC], ...(vK ? [["Contratos e exclusividade", vK, rI]] : []), ["Marca", vM, rI], ["Tecnologia", vT, rI], ["Não concorrência", vNc, rI], ["Força de trabalho (no ágio)", wf, wacc]].filter(x => x[1] > 0);
    const somaA = wara.reduce((a, x) => a + x[1], 0), gwResto = bev - somaA, rGw = gwResto > 0 ? (wacc * bev - wara.reduce((a, x) => a + x[1] * x[2], 0)) / gwResto : null;
    const waraT = rGw != null ? wacc : null, vidas = {cli:vidaC, marca:vidaM > 0 ? vidaM : null, tec:vidaT, nc:nNc};
    const amort = [1, 2, 3, 4, 5].map(y => ({y, cli:y <= vidaC ? vC / vidaC : 0, marca:vidaM > 0 && y <= vidaM ? vM / vidaM : 0, tec:vT && y <= vidaT ? vT / vidaT : 0, nc:y <= nNc ? vNc / nNc : 0, kt:nK && y <= nK ? vK / nK : 0}));
    amort.forEach(a => { a.tot = a.cli + a.marca + a.tec + a.nc + a.kt; a.ir = a.tot * t; });
    return {R, X, q, spa, pct, avista, vpDif, vpEo, dif, eo, preco, fonte, MC, imovMV, vK, nK, recK, mgK, tabK, anosK, plContabil, ajDD, vC, vM, vT, vNc, wf, imob:imobMV, imobBook, imobVJ, ncgV, est, cont, irDif, liqVJ, nci, goodwill, intang,
      k:rI, rI, rNcg, rImob, wacc, t, regime, churn, vidaC, roy, royT, vidaM, vidaT, pNc, expNc, nNc, tab, tabC, tabM, tabT, tabNc, folha, anosC, anosM, anosT, anosNc, wara, bev, gwResto, rGw, waraT, amort, vidas, mg, gL};
  }
  /* checagens automáticas (checklists Kinsey de valuation e PPA) */
  function checks(s, Z){
    const L = [], ok = (c, t, d) => L.push({c:c ? "ok" : "alerta", t, d});
    ok(!!Z.q.data, "Data de aquisição informada", "CPC 15 §8: data em que o controle é obtido; o laudo deve usar a mesma data em todas as seções.");
    ok(Z.pct > .5 || Z.q.controle === true, "Obtenção de controle", "Combinação de negócios exige controle (CPC 15 / CPC 36); abaixo de 50% justificar o controle.");
    ok(/real/i.test(Z.regime) || Math.abs(Z.t - .34) > .001, "Alíquota coerente com o regime", `Regime do target: ${Z.regime || "não informado"}; alíquota usada: ${pc(Z.t, 0)}. Usar a mesma alíquota no MPEEM, na não concorrência, no TAB e no IR diferido.`);
    ok(Z.rGw == null || Z.rGw >= Math.max(Z.rI, Z.wacc), "Retorno implícito do ágio é o maior", Z.rGw == null ? "Sem ágio residual." : `Ágio ${pc(Z.rGw)} × intangíveis ${pc(Z.rI)} × WACC ${pc(Z.wacc)}. O ágio é o ativo de maior risco; retorno abaixo indica intangíveis superavaliados ou taxa baixa.`);
    ok(Z.goodwill >= 0, "Sem compra vantajosa", Z.goodwill < 0 ? "Ágio negativo: revisar a identificação e a mensuração antes de reconhecer ganho (CPC 15 §36)." : "Ágio positivo.");
    ok(div(Z.goodwill, Z.preco) < .9, "Intangíveis identificados", "Ágio acima de 90% do preço sugere intangíveis não identificados (carteira, marca, contratos, tecnologia).");
    ok(Z.vidaC >= 2 && Z.vidaC <= 20, "Vida útil da carteira plausível", `Vida até 90% do valor: ${Z.vidaC} anos com perda de ${pc(Z.churn, 1)} a.a.`);
    ok(Z.anosC.every(a => a.exc >= 0) || Z.vC > 0, "Lucro excedente positivo", "Encargos de ativos contributivos maiores que o resultado zeram a carteira; revisar margem e encargos.");
    ok(Z.roy <= Math.max(.05, Z.mg * .33), "Royalty da marca × margem", `Royalty ${pc(Z.roy, 1)} sobre margem EBITDA de ${pc(Z.mg, 1)} (regra de 25% a 33% do lucro operacional).`);
    ok(Z.folha > 0, "Força de trabalho estimada", "Força de trabalho não é intangível separável (CPC 15 B37): entra só como ativo contributivo e fica no ágio.");
    ok(Z.q.imob != null, "Valor justo do imobilizado", "CPC 46 / CPC 27: informar a mais-valia (ou zero) a partir de inspeção ou laudo de bens.");
    ok(Z.q.contingencias != null, "Passivos contingentes avaliados", "CPC 15 §23: contingências da Due Diligence com valor justo mensurável entram no PPA.");
    ok(!(Z.dif > 0) || Z.q.prazoDif > 0, "Parcelas diferidas a valor presente", "Preço diferido descontado pelo Kd; earn-out a valor justo na data de aquisição (CPC 15 §39).");
    const rec = Z.X.H?.anuais || []; ok(rec.length >= 2 || Z.X.avulso, "Histórico de pelo menos dois exercícios", Z.X.avulso ? "PPA avulso: projeções do fluxo de caixa importado." : "Projeções do MPEEM e do royalty usam a base do valuation.");
    if (window.KT_EO) L.push(...KT_EO.checks(s, Z));
    return L;
  }
  /* revisão automática de laudos/modelos recebidos (texto extraído do PDF/DOCX/PPTX) */
  function revisarTexto(txt, s){
    const T = String(txt || ""), A = [], nome = (s?.nome || "").split(/\s+/)[0];
    const MES = {janeiro:1, fevereiro:2, "março":3, marco:3, abril:4, maio:5, junho:6, julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12}, cont = {};
    [...T.matchAll(/\b(\d{2})\/(\d{2})\/(20\d\d)\b/g)].forEach(m => { const k = `${m[1]}/${m[2]}/${m[3]}`; cont[k] = (cont[k] || 0) + 1; });
    [...T.matchAll(/\b(\d{1,2}) de (janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (20\d\d)/gi)].forEach(m => { const k = `${String(m[1]).padStart(2, "0")}/${String(MES[m[2].toLowerCase()]).padStart(2, "0")}/${m[3]}`; cont[k] = (cont[k] || 0) + 1; });
    const porMes = {}; Object.keys(cont).filter(d => cont[d] >= 2).forEach(d => (porMes[d.slice(3)] = porMes[d.slice(3)] || []).push(d));
    Object.values(porMes).filter(l => l.length > 1).forEach(l => A.push(`Datas próximas citadas como referência: ${l.map(d => `${d} (${cont[d]}×)`).join(", ")}. Conferir se a data-base e a data de aquisição são as mesmas em todo o documento.`));
    const anosD = {}; Object.keys(cont).forEach(d => anosD[d.slice(6)] = (anosD[d.slice(6)] || 0) + cont[d]); const ab = +(Object.entries(anosD).sort((x, y) => y[1] - x[1])[0]?.[0] || 0);
    const projs = [...new Set([...T.matchAll(/Projeto\s+([A-Z][a-zà-ú]+)/g)].map(m => m[1]))]; if (projs.length > 1) A.push(`Mais de um codinome no documento: ${projs.map(p => "Projeto " + p).join(", ")}.`);
    const anos = [...T.matchAll(/\b(20\d\d)E\b/g)].map(m => +m[1]); if (anos.length && ab && Math.min(...anos) < ab) A.push(`Anos projetados (${Math.min(...anos)}E) anteriores à data do laudo (${ab}): rótulos de tabela desatualizados.`);
    if (/presumido/i.test(T) && /34\s?%/.test(T)) A.push("O texto cita lucro presumido e alíquota de 34%: verificar a consistência do regime nos cálculos.");
    const linhas = T.split(/\n/), pcts = l => [...l.matchAll(/(\d{1,2},\d)\s?%/g)].map(m => parseFloat(m[1].replace(",", ".")));
    const gwL = linhas.filter(l => /n[aã]o alocada|^\s*(?:ágio|goodwill)\b/i.test(l) && pcts(l).length).map(l => pcts(l)[0]);
    const inL = linhas.filter(l => /carteira de clientes|n[aã]o[- ]concorr|^\s*marca\b|^\s*tecnologia\b/i.test(l) && pcts(l).length).map(l => { const v = pcts(l); return v.length >= 3 ? v[2] : Math.max(...v); });
    if (gwL.length && inL.length && Math.min(...gwL) < Math.max(...inL)) A.push(`Retorno implícito do ágio/parcela não alocada (${fmt(Math.min(...gwL), 1)}%) menor que o dos intangíveis (${fmt(Math.max(...inL), 1)}%): o ágio deve ter o maior retorno; revisar a WARA.`);
    const empresas = [...new Set([...T.matchAll(/\b([A-Z][A-Za-zÀ-ú]+(?:\s[A-Z][A-Za-zÀ-ú]+)?)\s(?:Ltda|S\.?A\.?|Móveis|Medicals)\b/g)].map(m => m[1]))].filter(e => (!nome || !e.includes(nome)) && !/^Participa/.test(e));
    if (empresas.length > 1) A.push(`Nomes de outras empresas no texto: ${empresas.slice(0, 6).join(", ")}. Verificar sobras de modelo anterior.`);
    if (/lorem ipsum|\[inserir|\[preencher|\bXXX\b|\bTBD\b|a definir pelo/i.test(T)) A.push("Há marcações de modelo não preenchidas (ex.: [inserir], XXX, TBD).");
    return A;
  }
  async function ppaPdf(s, modo = "completo"){
    const Z = ppa(s), Rl = KT_REL, P = KTPdf(), C = checks(s, Z), x = v => mi(v), G = window.KT_GRAF;
    Rl.capa(P, "Laudo de alocação do preço de compra (CPC 15 / IFRS 3)", s.nome, [["Data de aquisição", Z.q.data || "a definir"], ["Participação adquirida", pc(Z.pct, 0)], ["Consideração transferida", x(Z.preco)], ["Ágio (goodwill)", x(Z.goodwill)], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    Rl.sec(P, 1, "Sumário executivo");
    if (G){ Rl.kpisPdf(P, [["Consideração", x(Z.preco), Z.fonte], ["Intangíveis", x(Z.intang), `${Math.round(Z.intang / Z.preco * 100)}% do preço`], ["Ágio", x(Z.goodwill), `${Math.round(Z.goodwill / Z.preco * 100)}% do preço`], ["Retorno do ágio", Z.rGw != null ? pc(Z.rGw) : "—", `WACC ${pc(Z.wacc)}`]]);
      G.rosca(P, "Alocação do preço de compra (100% = consideração + não controladores)", [{l:"Ativos líquidos a valor justo (exceto intangíveis)", v:Z.liqVJ - Z.intang}, {l:"Carteira de clientes", v:Z.vC}, {l:"Marca", v:Z.vM}, {l:"Tecnologia", v:Z.vT}, {l:"Não concorrência", v:Z.vNc}, {l:"Ágio (goodwill)", v:Z.goodwill, c:G.NAVY}], v => mi(v, 1), [mi(Z.preco + Z.nci, 1), "alocado"]);
      G.cascata(P, "Do patrimônio líquido à consideração", [{l:"PL contábil", v:Z.plContabil, tipo:"base"}, {l:"Ajustes DD", v:Z.ajDD, tipo:"delta"}, {l:"Mais-valias tangíveis", v:Z.imob + Z.est, tipo:"delta"}, {l:"Intangíveis", v:Z.intang, tipo:"delta"}, {l:"Contingências", v:-Z.cont, tipo:"delta"}, {l:"IR diferido", v:-Z.irDif, tipo:"delta"}, {l:"Ativos líquidos VJ", v:Z.liqVJ, tipo:"total"}, {l:"Ágio", v:Z.goodwill, tipo:"delta"}, {l:"Consideração + NCI", v:Z.preco + Z.nci, tipo:"total"}].filter(p => p.tipo !== "delta" || Math.abs(p.v) > 1), v => mi(v, 1)); }
    Rl.tab(P, ["Componente", "Valor"], linhasPpa(Z), [.7, .3]);
    if (modo === "resumo" && G){
      Rl.sec(P, 2, "Intangíveis, taxas e checagens");
      Rl.tab(P, ["Intangível", "Método", "Vida", "Valor justo"], [["Carteira de clientes", "MPEEM", `${Z.vidaC} anos`, x(Z.vC)], ["Marca", "Relief-from-royalty", Z.vidaM > 0 ? `${Z.vidaM} anos` : "indefinida", x(Z.vM)], ["Tecnologia", "Relief-from-royalty", `${Z.vidaT} anos`, x(Z.vT)], ["Não concorrência", "Com e sem", `${Z.nNc} anos`, x(Z.vNc)]], [.3, .3, .2, .2]);
      G.barrasH(P, "Retorno exigido por ativo (WARA)", [...Z.wara.map(w => ({l:w[0], v:w[2], txt:pc(w[2])})), ...(Z.rGw != null ? [{l:"Ágio (retorno implícito)", v:Z.rGw, txt:pc(Z.rGw), c:G.NAVY}] : [])], v => pc(v), {v:Z.wacc, l:`WACC ${pc(Z.wacc)}`});
      const ok = C.filter(c => c.c === "ok").length; Rl.par(P, `Checagens automáticas: ${ok} de ${C.length} itens OK. A revisar: ${C.filter(c => c.c !== "ok").map(c => c.t).join("; ") || "nenhum"}.`, {size:9.5});
      Rl.par(P, "Trabalho preliminar, sujeito à revisão do auditor e a laudo independente. Memória de cálculo completa no relatório completo e na planilha da base dos cálculos.", {size:8.5, color:[90,101,120]});
      await rptSave(P.out(`PPA · ${s.nome}`, Rl.T(`Kinsey Capital · PPA (resumo) · ${s.nome} · confidencial`)), Rl.arq(s, "PPA_resumo", "pdf"), "application/pdf"); return; }
    Rl.sec(P, 2, "Escopo, normas e limitações");
    Rl.par(P, `Alocação do preço de compra conforme CPC 15 (R1) – Combinação de Negócios, CPC 46 – Mensuração do Valor Justo, CPC 04 (R1) – Ativo Intangível, CPC 27 – Ativo Imobilizado e CPC 32 – Tributos sobre o Lucro. Base: balancetes de ${s.nome} ajustados pela Due Diligence e projeções do cenário moderado do valuation. Trabalho preliminar, sujeito à revisão do auditor e a laudo independente; não constitui opinião de auditoria.`, {size:9.5});
    Rl.sec(P, 3, "Transação e consideração transferida");
    Rl.tab(P, ["Parcela", "Valor"], [["Pagamento à vista · " + Z.fonte, x(Z.avista)], ["Parcelas diferidas a valor presente (Kd " + pc(Z.X.W.kd) + ")", x(Z.vpDif)], ["Earn-out a valor justo (probabilidade × VP)", x(Z.vpEo)], ["Consideração transferida", x(Z.preco)]], [.7, .3]);
    Rl.sec(P, 4, "Valor justo dos ativos tangíveis");
    Rl.tab(P, ["Item", "Contábil", "Ajuste", "Valor justo"], [["Imobilizado", x(Z.imobBook), x(Z.imob), x(Z.imobVJ)], ["Estoques", "—", x(Z.est), "—"], ["Capital de giro", x(Z.ncgV), "—", x(Z.ncgV)], ["Passivos contingentes", "—", x(-Z.cont), x(-Z.cont)]], [.4, .2, .2, .2]);
    Rl.sec(P, 5, "Intangíveis identificados");
    Rl.tab(P, ["Intangível", "Método", "Premissas", "Vida", "Valor justo"], [
      ["Carteira de clientes", "MPEEM (lucro excedente multiperíodo)", `perda ${pc(Z.churn, 1)} a.a.; encargos: giro ${pc(Z.rNcg)}, imobilizado ${pc(Z.rImob)}, força de trabalho ${pc(Z.wacc)}, marca e tecnologia por royalty; taxa ${pc(Z.rI)}; TAB ${fmt(Z.tabC, 2)}`, `${Z.vidaC} anos (90%)`, x(Z.vC)],
      ["Marca", "Relief-from-royalty", `royalty ${pc(Z.roy, 2)} da receita líquida; taxa ${pc(Z.rI)}${Z.vidaM > 0 ? "; TAB " + fmt(Z.tabM, 2) : ""}`, Z.vidaM > 0 ? `${Z.vidaM} anos` : "indefinida", x(Z.vM)],
      ["Tecnologia", "Relief-from-royalty com obsolescência", `royalty ${pc(Z.royT, 2)}; queda linear; TAB ${fmt(Z.tabT, 2)}`, `${Z.vidaT} anos`, x(Z.vT)],
      ["Não concorrência", "Com e sem (with-and-without)", `probabilidade ${pc(Z.pNc, 0)}; receita exposta ${pc(Z.expNc, 0)}; TAB ${fmt(Z.tabNc, 2)}`, `${Z.nNc} anos`, x(Z.vNc)],
      ["Força de trabalho", "Custo de reposição", `recrutamento, treinamento e perda de produtividade sobre a folha de ${x(Z.folha)}; com gross-up do IR`, "no ágio", x(Z.wf)]], [.16, .2, .4, .1, .14]);
    Rl.par(P, "TAB (benefício fiscal da amortização) calculado por fórmula: n ÷ (n − t × fator de anuidade a meio de ano). Força de trabalho não é reconhecida separadamente (CPC 15 B37); entra como ativo contributivo.", {size:8.5, color:[90,101,120]});
    Rl.sec(P, 6, "Carteira de clientes · fluxo do lucro excedente");
    if (G) G.colunas(P, "Receita da base atual e lucro excedente", Z.anosC.slice(0, 10).map(a => String(a.y)), [{n:"Receita base", v:Z.anosC.slice(0, 10).map(a => a.r), c:G.ACC}, {n:"Lucro excedente", v:Z.anosC.slice(0, 10).map(a => a.exc), c:G.VERDE}], v => mi(v, 1));
    Rl.tab(P, ["Ano", "Receita", "NOPAT", "Encargos", "Excedente", "VP"], Z.anosC.slice(0, 12).map(a => [String(a.y), x(a.r), x(a.nopat), x(a.cNcg + a.cImob + a.cWf + a.cM + a.cT + a.cNc), x(a.exc), x(a.pv)]), [.1, .18, .18, .18, .18, .18]);
    Rl.sec(P, 7, "Taxa de desconto e reconciliação (WARA)");
    if (G) G.barrasH(P, "Retorno exigido por ativo", [...Z.wara.map(w => ({l:w[0], v:w[2], txt:pc(w[2])})), ...(Z.rGw != null ? [{l:"Ágio (retorno implícito)", v:Z.rGw, txt:pc(Z.rGw), c:G.NAVY}] : [])], v => pc(v), {v:Z.wacc, l:`WACC ${pc(Z.wacc)}`});
    Rl.tab(P, ["Ativo", "Valor justo", "Retorno", "Peso"], [...Z.wara.map(w => [w[0], x(w[1]), pc(w[2]), pc(div(w[1], Z.bev), 0)]), ["Ágio residual", x(Z.gwResto), Z.rGw != null ? pc(Z.rGw) : "—", pc(div(Z.gwResto, Z.bev), 0)], ["Valor da empresa (100%) = WACC", x(Z.bev), pc(Z.wacc), "100%"]], [.4, .2, .2, .2]);
    Rl.sec(P, 8, "Amortização dos intangíveis");
    Rl.tab(P, ["Ano", "Clientes", "Marca", "Tecnologia", "Não concorrência", "Total", "IR diferido realizado"], Z.amort.map(a => [String(a.y), x(a.cli), x(a.marca), x(a.tec), x(a.nc), x(a.tot), x(a.ir)]), [.08, .15, .13, .15, .17, .14, .18]);
    const Sx = sensib(s), I = impair(Z);
    Rl.sec(P, 9, "Sensibilidade e teste de recuperabilidade");
    Rl.tab(P, ["Ágio · perda × prêmio", ...Sx.pr.map(p => `+${fmt(p, 1)} p.p.`)], Sx.lin.map(l => [`perda ${fmt(l.churn, 1)}%`, ...l.cel.map(c => x(c.gw))]), [.31, .23, .23, .23]);
    Rl.tab(P, ["Teste de recuperabilidade (CPC 01)", "R$"], [["Valor recuperável (valuation moderado)", x(I.evMod)], ["Valor contábil da unidade com o ágio", x(I.cont)], ["Folga", x(I.folga)], ["Indício de perda", I.ind ? "Sim" : "Não"]], [.7, .3]);
    if (Z.q.churnCalc) Rl.par(P, `Perda de clientes calculada pela base de clientes (${Z.q.churnCalc.anos}): média ponderada pela receita de ${pc(Z.q.churnCalc.media, 1)} a.a.`, {size:9});
    Rl.sec(P, 10, "Checagens automáticas (checklists Kinsey)");
    Rl.tab(P, ["Situação", "Item", "Observação"], C.map(c => [c.c === "ok" ? "OK" : "Revisar", c.t, c.d]), [.12, .3, .58]);
    await rptSave(P.out(`PPA · ${s.nome}`, Rl.T(`Kinsey Capital · PPA · ${s.nome} · confidencial`)), Rl.arq(s, "PPA", "pdf"), "application/pdf");
  }
  const linhasPpa = Z => [["Consideração transferida · " + Z.fonte, mi(Z.preco)], ["(+) Participação de não controladores (proporcional)", mi(Z.nci)], ["Patrimônio líquido contábil", mi(Z.plContabil)], ["(+) Ajustes de Due Diligence com OK no valuation", mi(Z.ajDD)],
    [Z.imob < 0 ? "(−) Menos-valia do imobilizado" : "(+) Mais-valia do imobilizado", mi(Z.imob)], [Z.imovMV < 0 ? "(−) Menos-valia de imóveis" : "(+) Mais-valia de imóveis", mi(Z.imovMV || 0)], ["(+) Mais-valia dos estoques", mi(Z.est)], ["(+) Carteira de clientes", mi(Z.vC)], ["(+) Marca", mi(Z.vM)], ["(+) Tecnologia", mi(Z.vT)], ["(+) Não concorrência", mi(Z.vNc)], ["(+) Contratos e exclusividade", mi(Z.vK || 0)], ["(−) Passivos contingentes reconhecidos", mi(-Z.cont)], ["(−) IR e CS diferidos sobre as mais-valias", mi(-Z.irDif)],
    ["Ativos líquidos a valor justo", mi(Z.liqVJ)], [Z.goodwill < 0 ? "Ganho por compra vantajosa" : "Ágio (goodwill)", mi(Z.goodwill)]];

  /* perda de clientes calculada pela base de clientes (receita por cliente e ano), por faixa: 10% maiores, 40% seguintes e 50% menores */
  function churnBase(linhas){
    const L = (linhas || []).filter(r => r && r.some(x => String(x).trim())); if (L.length < 2) throw new Error("planilha vazia");
    const h = L[0].map(x => String(x).trim()), anosCol = h.map((x, i) => /^(19|20)\d\d$/.test(x) ? i : -1).filter(i => i >= 0), R = {};
    const nv = x => { const t = String(x ?? "").replace(/R\$|\s/g, ""); return /,\d{1,2}$/.test(t) ? +t.replace(/\./g, "").replace(",", ".") || 0 : +t.replace(/,/g, "") || 0; };
    if (anosCol.length >= 2){ L.slice(1).forEach(r => { const c = String(r[0] || "").trim(); if (!c) return; anosCol.forEach(i => { const y = +h[i]; (R[c] = R[c] || {})[y] = (R[c][y] || 0) + nv(r[i]); }); }); }
    else { const ic = h.findIndex(x => /cliente|nome|cnpj|raz/i.test(x)), ia = h.findIndex(x => /^ano|exerc|per[ií]odo|data/i.test(x)), ir = h.findIndex(x => /receita|fatur|valor|venda/i.test(x));
      if (ic < 0 || ia < 0 || ir < 0) throw new Error("use colunas Cliente, Ano e Receita (ou uma coluna por ano)");
      L.slice(1).forEach(r => { const c = String(r[ic] || "").trim(), y = +(String(r[ia]).match(/(19|20)\d\d/) || [])[0]; if (!c || !y) return; (R[c] = R[c] || {})[y] = (R[c][y] || 0) + nv(r[ir]); }); }
    const anos = [...new Set(Object.values(R).flatMap(o => Object.keys(o).map(Number)))].sort(); if (anos.length < 2) throw new Error("são necessários pelo menos 2 anos");
    const por = [];
    for (let k = 1; k < anos.length; k++){ const a = anos[k - 1], b = anos[k], base = Object.entries(R).filter(([, o]) => (o[a] || 0) > 0).sort((x, y) => y[1][a] - x[1][a]), n = base.length;
      const fx = [["10% maiores", 0, Math.max(1, Math.round(n * .1))], ["40% seguintes", Math.max(1, Math.round(n * .1)), Math.round(n * .5)], ["50% menores", Math.round(n * .5), n]].map(([nome, i0, i1]) => { const g = base.slice(i0, i1), rec = g.reduce((s, [, o]) => s + o[a], 0), perd = g.filter(([, o]) => !(o[b] > 0)), lost = perd.reduce((s, [, o]) => s + o[a], 0);
        return {nome, clientes:g.length, perdidos:perd.length, rec, lost, churnRec:rec ? lost / rec : 0, churnCli:g.length ? perd.length / g.length : 0}; });
      const rec = fx.reduce((s, f) => s + f.rec, 0), lost = fx.reduce((s, f) => s + f.lost, 0), novos = Object.values(R).filter(o => !(o[a] > 0) && o[b] > 0).length;
      por.push({de:a, ate:b, fx, rec, lost, churnRec:rec ? lost / rec : 0, clientes:n, perdidos:fx.reduce((s, f) => s + f.perdidos, 0), novos}); }
    const totRec = por.reduce((s, p) => s + p.rec, 0), media = totRec ? por.reduce((s, p) => s + p.lost, 0) / totRec : 0;
    return {anos, por, media, clientes:Object.keys(R).length};
  }
  /* sensibilidade: prêmio dos intangíveis (±1 p.p.) × perda de clientes (±2,5 p.p.) */
  function sensib(s){ const q = s.pos?.ppa || {}, Z = ppa(s); if (!Z) return null; const pr = [-1, 0, 1].map(d => Math.max(0, (Z.rI - Z.wacc) * 100 + d)), ch = [-2.5, 0, 2.5].map(d => Math.max(1, Z.churn * 100 + d));
    const lin = ch.map(c => ({churn:c, cel:pr.map(p => { const z = ppa({...s, pos:{...(s.pos || {}), ppa:{...q, taxaAdic:p, churn:c}}}); return {p, vC:z.vC, gw:z.goodwill, vida:z.vidaC}; })}));
    return {pr, ch, lin}; }
  /* teste de recuperabilidade (CPC 01): valor recuperável (valuation moderado) × valor contábil da UGC com o ágio */
  function impair(Z){ const evMod = (Z.R.rec[0] + Z.R.rec[1]) / 2, am1 = Z.amort[0]?.tot || 0, intLiq = Z.intang - am1, cont = Z.ncgV + Z.imobVJ + intLiq + Z.goodwill / Z.pct;
    return {evMod, cont, folga:evMod - cont, ind:evMod < cont, intLiq}; }
  /* base dos cálculos em Excel, no formato de memória de cálculo do laudo */
  async function ppaXlsx(s){
    const Z = ppa(s), q = s.pos?.ppa || {}, C = checks(s, Z), Sx = sensib(s), I = impair(Z), H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), P = v => ({v, s:"p"}), B = v => ({v, s:"b"});
    const nome = s.mandato?.codinome || s.nome, cab = (t, sub) => [[T(`${t} · ${nome}`)], [sub || `Valores em R$ · data de aquisição ${q.data || "a definir"} · emitido em ${new Date().toLocaleDateString("pt-BR")}`], []];
    const abas = [
      {nome:"Resumo PPA", larguras:[58, 18], linhas:[...cab("Alocação do preço de compra (CPC 15 / IFRS 3)"), [H("Componente"), H("R$")], ...linhasPpa(Z).map(([a], i) => [a, [Z.preco, Z.nci, Z.plContabil, Z.ajDD, Z.imob, Z.imovMV || 0, Z.est, Z.vC, Z.vM, Z.vT, Z.vNc, Z.vK || 0, -Z.cont, -Z.irDif, Z.liqVJ, Z.goodwill][i]]), [], ["Ágio / consideração", P(div(Z.goodwill, Z.preco))], ["Retorno implícito do ágio", Z.rGw != null ? P(Z.rGw) : "—"], ["WACC", P(Z.wacc)]]},
      {nome:"Premissas", larguras:[52, 18, 50], linhas:[...cab("Premissas do PPA"), [H("Premissa"), H("Valor"), H("Fonte")],
        ["Participação adquirida", P(Z.pct), q.pct != null ? "informado" : "mandato / 100%"], ["Alíquota IR/CS", P(Z.t), "informada (única em todo o laudo)"], ["Regime do target", Z.regime || "não informado", "cadastro"],
        ["WACC", P(Z.wacc), "valuation (CAPM)"], ["Prêmio dos intangíveis", P(Z.rI - Z.wacc), "risco específico"], ["Taxa dos intangíveis", P(Z.rI), "WACC + prêmio"], ["Capital de giro (Selic LP + spread, líquido)", P(Z.rNcg), "encargo contributivo"], ["Imobilizado (Kd)", P(Z.rImob), "encargo contributivo"],
        ["Perda anual de clientes", P(Z.churn), q.churnCalc ? `base de clientes (${q.churnCalc.anos})` : q.churn != null ? "informada" : "padrão"], ["Margem EBITDA", P(Z.mg), "valuation moderado"], ["Crescimento de longo prazo", P(Z.gL), "valuation"],
        ["Royalty da marca", P(Z.roy), "referência de mercado"], ["Vida da marca (anos)", Z.vidaM || "indefinida", ""], ["Royalty da tecnologia", P(Z.royT), ""], ["Vida da tecnologia (anos)", Z.vidaT, ""],
        ["Não concorrência · probabilidade", P(Z.pNc), ""], ["Não concorrência · receita exposta", P(Z.expNc), ""], ["Não concorrência · prazo (anos)", Z.nNc, ""], ["Folha anual", Z.folha, q.folha != null ? "informada" : "balancete"], ["TAB aplicado", Z.tab ? "sim" : "não", "Lei 12.973/14"]]},
      {nome:"Consideração", larguras:[52, 18], linhas:[...cab("Consideração transferida"), [H("Parcela"), H("R$")], ["Pagamento à vista · " + Z.fonte, Z.avista], ["Parcelas diferidas (nominal)", Z.dif], [`Parcelas diferidas a VP (Kd ${fmt(Z.X.W.kd * 100, 1)}%, ${q.prazoDif || 0} anos)`, Z.vpDif], ["Earn-out esperado (nominal × probabilidade)", Z.eo], ["Earn-out a valor justo", Z.vpEo], [B("Consideração transferida"), B(Z.preco)]]},
      {nome:"Carteira de clientes", larguras:[8, 15, 15, 15, 15, 14, 14, 14, 14, 14, 14, 15, 15], linhas:[...cab("Carteira de clientes · MPEEM", `Perda anual ${fmt(Z.churn * 100, 1)}% · taxa ${fmt(Z.rI * 100, 1)}% · vida até 90% do valor: ${Z.vidaC} anos · TAB ${fmt(Z.tabC, 3)}`),
        [H("Ano"), H("Receita base"), H("EBITDA"), H("NOPAT"), H("(−) Giro"), H("(−) Imobilizado"), H("(−) Força trab."), H("(−) Marca"), H("(−) Tecnologia"), H("(−) Não conc."), H("Excedente"), H("Fator VP"), H("VP")],
        ...Z.anosC.map(a => [a.y, a.r, a.eb, a.nopat, -a.cNcg, -a.cImob, -a.cWf, -a.cM, -a.cT, -a.cNc, a.exc, {v:+(1 / Math.pow(1 + Z.rI, a.y - .5)).toFixed(6)}, a.pv]),
        [], ["", "", "", "", "", "", "", "", "", "", B("Soma VP"), "", B(Z.vC / Z.tabC)], ["", "", "", "", "", "", "", "", "", "", "TAB", "", {v:+Z.tabC.toFixed(4)}], ["", "", "", "", "", "", "", "", "", "", B("Valor justo"), "", B(Z.vC)]]},
      {nome:"CAC", larguras:[40, 16, 16, 40], linhas:[...cab("Encargos de ativos contributivos (CAC)"), [H("Ativo"), H("Valor (R$)"), H("Retorno"), H("Base do retorno")], ["Capital de giro", Z.ncgV, P(Z.rNcg), "Selic LP + spread, após IR"], ["Imobilizado a valor justo", Z.imobVJ, P(Z.rImob), "Kd (retorno sobre); retorno do ativo na D&A"], ["Força de trabalho", Z.wf, P(Z.wacc), "WACC"], ["Marca", Z.vM, P(Z.roy), "royalty sobre a receita, após IR"], ["Tecnologia", Z.vT, P(Z.royT), "royalty sobre a receita, após IR"], ["Não concorrência", Z.vNc, P(Z.rI), "taxa dos intangíveis"]]},
      {nome:"Marca", larguras:[8, 16, 16, 16], linhas:[...cab("Marca · relief-from-royalty", `Royalty ${fmt(Z.roy * 100, 2)}% · ${Z.vidaM ? Z.vidaM + " anos · TAB " + fmt(Z.tabM, 3) : "vida indefinida (perpetuidade após o ano 10)"}`), [H("Ano"), H("Receita"), H("Royalty após IR"), H("VP")], ...Z.anosM.map(a => [a.y, a.r, a.fl, a.pv]), [], [B("Valor justo"), "", "", B(Z.vM)]]},
      {nome:"Tecnologia", larguras:[8, 16, 16, 16], linhas:[...cab("Tecnologia · relief-from-royalty com obsolescência", `Royalty ${fmt(Z.royT * 100, 2)}% · ${Z.vidaT} anos · TAB ${fmt(Z.tabT, 3)}`), [H("Ano"), H("Receita ajustada"), H("Royalty após IR"), H("VP")], ...Z.anosT.map(a => [a.y, a.r, a.fl, a.pv]), [], [B("Valor justo"), "", "", B(Z.vT)]]},
      {nome:"Não concorrência", larguras:[8, 16, 18, 16], linhas:[...cab("Cláusula de não concorrência · com e sem", `Probabilidade ${fmt(Z.pNc * 100, 0)}% · receita exposta ${fmt(Z.expNc * 100, 0)}% · ${Z.nNc} anos · TAB ${fmt(Z.tabNc, 3)}`), [H("Ano"), H("Receita"), H("Perda esperada após IR"), H("VP")], ...Z.anosNc.map(a => [a.y, a.r, a.perda, a.pv]), [], [B("Valor justo"), "", "", B(Z.vNc)]]},
      {nome:"Força de trabalho", larguras:[46, 16], linhas:[...cab("Força de trabalho · custo de reposição"), [H("Item"), H("Valor")], ["Folha anual", Z.folha], ["Recrutamento", P(v0p(q.recrut, 3))], ["Treinamento", P(v0p(q.trein, 1.5))], ["Produtividade do novo funcionário", P(v0p(q.prod, 80))], ["Meses até a produtividade plena", q.mesesProd ?? 5], [B("Valor (com gross-up do IR)"), B(Z.wf)], ["Reconhecimento", "não separável (CPC 15 B37): fica no ágio"]]},
      {nome:"WARA", larguras:[40, 16, 12, 12, 14], linhas:[...cab("Reconciliação WARA × WACC"), [H("Ativo"), H("Valor justo"), H("Retorno"), H("Peso"), H("Retorno ponderado")], ...Z.wara.map(w => [w[0], w[1], P(w[2]), P(div(w[1], Z.bev)), P(div(w[1] * w[2], Z.bev))]), ["Ágio residual", Z.gwResto, Z.rGw != null ? P(Z.rGw) : "—", P(div(Z.gwResto, Z.bev)), Z.rGw != null ? P(div(Z.gwResto * Z.rGw, Z.bev)) : "—"], [B("Valor da empresa (100%)"), B(Z.bev), P(Z.wacc), P(1), P(Z.wacc)]]},
      {nome:"Amortização", larguras:[8, 15, 15, 15, 15, 15, 15], linhas:[...cab("Amortização dos intangíveis e realização do IR diferido"), [H("Ano"), H("Clientes"), H("Marca"), H("Tecnologia"), H("Não conc."), H("Total"), H("IR diferido")], ...Z.amort.map(a => [a.y, a.cli, a.marca, a.tec, a.nc, a.tot, a.ir])]},
      {nome:"Sensibilidade", larguras:[26, 18, 18, 18], linhas:[...cab("Sensibilidade · carteira de clientes e ágio"), [H("Perda de clientes × prêmio"), ...Sx.pr.map(p => H(`+${fmt(p, 1)} p.p.`))], ...Sx.lin.map(l => [`Clientes · perda ${fmt(l.churn, 1)}%`, ...l.cel.map(c => c.vC)]), [], ...Sx.lin.map(l => [`Ágio · perda ${fmt(l.churn, 1)}%`, ...l.cel.map(c => c.gw)])]},
      {nome:"Impairment", larguras:[52, 18], linhas:[...cab("Teste de recuperabilidade do ágio (CPC 01)"), [H("Item"), H("R$")], ["Valor recuperável (valuation moderado, EV)", I.evMod], ["Capital de giro", Z.ncgV], ["Imobilizado a valor justo", Z.imobVJ], ["Intangíveis líquidos (após o 1º ano)", I.intLiq], ["Ágio (100%)", Z.goodwill / Z.pct], [B("Valor contábil da UGC"), B(I.cont)], [B("Folga (recuperável − contábil)"), B(I.folga)], ["Indício de perda", I.ind ? "Sim" : "Não"]]},
      ...(window.KT_EO ? KT_EO.abas(s, Z) : []),
      {nome:"Checagens", larguras:[10, 40, 90], linhas:[...cab("Checagens automáticas (checklists Kinsey de valuation e PPA)"), [H("Situação"), H("Item"), H("Observação")], ...C.map(c => [c.c === "ok" ? "OK" : "Revisar", c.t, c.d])]}];
    if (q.churnCalc?.por) abas.splice(4, 0, {nome:"Churn", larguras:[14, 16, 12, 12, 16, 16, 12], linhas:[...cab("Perda de clientes · base de clientes", `Média ponderada pela receita: ${fmt(q.churnCalc.media * 100, 1)}%`), [H("Período"), H("Faixa"), H("Clientes"), H("Perdidos"), H("Receita"), H("Receita perdida"), H("Churn receita")],
      ...q.churnCalc.por.flatMap(p => [...p.fx.map(f => [`${p.de}→${p.ate}`, f.nome, f.clientes, f.perdidos, f.rec, f.lost, P(f.churnRec)]), [`${p.de}→${p.ate}`, B("Total"), p.clientes, p.perdidos, p.rec, p.lost, P(p.churnRec)]])]});
    await rptSave(KT_XLSX.gerar(abas), Rl0().arq(s, "PPA_base_calculos", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  const v0p = (x, d) => (x != null && x !== "" && !isNaN(x) ? +x : d) / 100, Rl0 = () => KT_REL;

  /* ---------------- MODELOS ---------------- */
  const SPA_BASE = () => { const R = window.KT_CONTRATO?.REGRAS || [];
    return {id:"spa_base", titulo:"SPA · base pró-vendedor (Kinsey)", tipo:"SPA", provisorio:true, texto:[["1. Partes e objeto","{VENDEDORES} vendem a {COMPRADOR} {PARTICIPACAO} da {EMPRESA}, CNPJ {DOC}, pelo Preço e nas condições deste contrato."],
      ["2. Preço","Preço de {PRECO}, pago em moeda corrente na Data de Fechamento, sujeito apenas aos ajustes previstos neste contrato."], ...R.filter(r => r.sug).map((r, i) => [`${i + 3}. ${r.t}`, r.sug]), [`${R.length + 3}. Data`, "{DATA}"]]}; };
  const modelos = () => [SPA_BASE(), ...(S.config.modelos_pos?.lista || [])];
  function preencher(s, txt){ const Z = ppa(s), c = {EMPRESA:s.nome, DOC:s.doc || "[CNPJ]", PARTICIPACAO:s.mandato?.participacao || "[participação]", PRECO:Z ? mi(Z.preco) : "[preço]", VENDEDORES:"[vendedores]", COMPRADOR:"[comprador]", CODINOME:s.mandato?.codinome || "", DATA:new Date().toLocaleDateString("pt-BR")};
    return String(txt).replace(/\{([A-Z]+)\}/g, (m, k) => c[k] ?? m); }
  function montar(s, id){
    const m = modelos().find(x => x.id === id); if (!m) return; const texto = `${m.titulo.toUpperCase()}\n${m.provisorio ? "MINUTA PROVISÓRIA — validar com o Jurídico" : "Modelo Kinsey"}\n\n` + m.texto.map(([h, t]) => `${preencher(s, h)}\n${preencher(s, t)}`).join("\n\n");
    sheet(`<div class="sheet-h"><div><div class="eyebrow">Minuta montada a partir do modelo</div><h2>${esc(m.titulo)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><textarea id="mm-t" rows="22" style="width:100%;font-size:12.5px;line-height:1.5;background:transparent;color:inherit;border:1px solid var(--line);border-radius:8px;padding:10px" aria-label="Minuta">${esc(texto)}</textarea>
      <div style="display:flex;gap:8px"><button type="button" class="btn primary" id="mm-cp">Copiar texto</button></div><p class="sub" style="margin:0">Campos entre colchetes a completar. A validação final é do advogado responsável.</p></div>`);
    $("#mm-cp").onclick = e => { try{ navigator.clipboard.writeText($("#mm-t").value).then(() => toast("Copiado"), () => { $("#mm-t").select(); toast("Selecione e copie"); }); }catch(x){ $("#mm-t").select(); } };
  }
  function novoModelo(){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base de modelos</div><h2>Incluir modelo Kinsey</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fnm" style="display:flex;flex-direction:column;gap:10px" novalidate><div class="form"><div class="fld"><label for="nm-t">Título</label><input id="nm-t" placeholder="ex.: SPA padrão Kinsey 2026"></div><div class="fld"><label for="nm-k">Tipo</label><select id="nm-k">${["SPA","PPA","Laudo de avaliação","Relatório de due diligence","Workbook de diligência","Proposta de serviços","Acordo de acionistas","Contrato de earn-out","Outro"].map(x => `<option>${x}</option>`).join("")}</select></div>
      <div class="fld full"><label for="nm-x">Texto (cláusulas separadas por linha em branco; título na primeira linha)</label><textarea id="nm-x" rows="14" placeholder="1. Partes&#10;{VENDEDORES} vendem a {COMPRADOR}…"></textarea></div></div>
      <p class="sub" style="margin:0">Campos preenchidos ao montar: {EMPRESA}, {DOC}, {PARTICIPACAO}, {PRECO}, {CODINOME}, {DATA}.</p><p class="err" id="nm-err" hidden></p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Incluir na base</button></div></form>`);
    $("#fnm").onsubmit = e => { e.preventDefault(); const t = $("#nm-t").value.trim(), blocos = $("#nm-x").value.replace(/\r/g, "").split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => { const [h, ...r] = b.split("\n"); return [h.trim(), r.join(" ").trim()]; });
      if (!t || !blocos.length){ $("#nm-err").textContent = "Informe o título e o texto."; $("#nm-err").hidden = false; return; }
      save(Store.set("config", "modelos_pos", {lista:[...(S.config.modelos_pos?.lista || []), {id:"mp" + Date.now().toString(36), titulo:t, tipo:$("#nm-k").value, texto:blocos, em:nowISO(), por:Store.me?.email || ""}]})).then(() => { close(); toast("Modelo incluído na base"); }); };
  }

  /* ---------------- VIEW ---------------- */
  S.posTab = S.posTab || "ppa";
  EXT_VIEWS.pos = function(){
    const host = $("#pos"); if (!host) return;
    const s = D.alvoSel(), sd = D.lado(s, D.pick, ["com balancete", "ajustes aguardando OK"]), ed = D.ed() ? "" : "disabled";
    const h = D.cab("Pós-aquisição", "Pós-aquisição", "Alocação do preço de compra (PPA) a partir do valuation e do SPA, e base de modelos Kinsey para montar minutas.");
    const tabs = `<div class="dd-tabs">${[["ppa","PPA · alocação do preço"],["imp","Impairment · CPC 01"],["mod","Base de modelos"]].map(([k, l]) => `<button type="button" class="fbtn" data-pt="${k}" aria-pressed="${S.posTab === k}">${l}</button>`).join("")}</div>`;
    let corpo = "";
    if (S.posTab === "imp") corpo = window.KT_IMP ? KT_IMP.html(s) : "";
    else if (S.posTab === "mod") corpo = `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Base de modelos</h3><p class="sub" style="margin:2px 0 0">Modelos de SPA, PPA e documentos de pós-aquisição da Kinsey. Servem de referência para montar novas minutas com os dados do target; quanto mais modelos, melhor a base.</p></div>${D.ed() ? `<button type="button" class="btn sm primary" id="pm-add">+ Incluir modelo</button>` : ""}</div>
      <div class="tbl"><table><thead><tr><th>Modelo</th><th>Tipo</th><th>Origem</th><th></th></tr></thead><tbody>${modelos().map(m => `<tr><td><b>${esc(m.titulo)}</b></td><td>${esc(m.tipo)}</td><td>${m.provisorio ? `<span class="pill r-medio">Provisório</span>` : `${esc(m.por || "Kinsey")} · ${dt(m.em)}`}</td><td style="text-align:right"><button type="button" class="btn sm" data-mm="${m.id}" ${s ? "" : "disabled"}>Montar para ${esc((s?.mandato?.codinome || s?.nome || "").replace(/^EXEMPLO /, "").slice(0, 22))}</button></td></tr>`).join("")}</tbody></table></div></div>`;
    else { const Z = s && (D.temBal(s) || window.KT_EO?.ctx(s)) ? ppa(s) : null, q = s?.pos?.ppa || {};
      corpo = !Z ? D.semBal(s) + (s && window.KT_EO ? KT_EO.cardAvulso(s) : "") : `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">${esc(s.mandato?.codinome || "")}</div><h3>${esc(s.nome)} · PPA</h3><p class="sub" style="margin:2px 0 0">Preço: ${esc(Z.fonte)} · participação ${pc(Z.pct, 0)}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="ppa-pdf">Laudo PPA (PDF)</button><button type="button" class="btn sm" id="ppa-xl">Base dos cálculos (Excel)</button></div></div>
        <div class="dd-kpis"><div class="dd-k"><span>Consideração transferida</span><b>${mi(Z.preco)}</b></div><div class="dd-k"><span>Ativos líquidos a valor justo</span><b>${mi(Z.liqVJ)}</b></div><div class="dd-k"><span>Intangíveis identificados</span><b>${mi(Z.intang)}</b><small>clientes ${mi(Z.vC)} (${Z.vidaC} anos) · marca ${mi(Z.vM)} · NC ${mi(Z.vNc)}</small></div><div class="dd-k"><span>Ágio (goodwill)</span><b>${mi(Z.goodwill)}</b><small>${pc(div(Z.goodwill, Z.preco), 0)} do preço</small></div><div class="dd-k"><span>Retorno implícito do ágio</span><b>${Z.rGw != null ? pc(Z.rGw) : "—"}</b><small>WACC ${pc(Z.wacc)} · intangíveis ${pc(Z.rI)}</small></div></div>
        <div class="tbl"><table><tbody>${linhasPpa(Z).map(([a, b], i, L) => `<tr><td>${i >= L.length - 2 ? `<b>${esc(a)}</b>` : esc(a)}</td><td class="dd-num">${i >= L.length - 2 ? `<b>${b}</b>` : b}</td></tr>`).join("")}</tbody></table></div></div>
        ${window.KT_EO ? (Z.X.avulso ? KT_EO.cardAvulso(s) : "") + KT_EO.cardEO(s, Z) + KT_EO.cardFiscal(s, Z) : ""}
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Reconciliação WARA × WACC</h3><div class="tbl"><table><thead><tr><th>Ativo</th><th class="dd-num">Valor justo</th><th class="dd-num">Retorno</th><th class="dd-num">Peso</th></tr></thead><tbody>${Z.wara.map(w => `<tr><td>${esc(w[0])}</td><td class="dd-num">${mi(w[1])}</td><td class="dd-num">${pc(w[2])}</td><td class="dd-num">${pc(div(w[1], Z.bev), 0)}</td></tr>`).join("")}<tr><td><b>Ágio residual (retorno implícito)</b></td><td class="dd-num">${mi(Z.gwResto)}</td><td class="dd-num"><b>${Z.rGw != null ? pc(Z.rGw) : "—"}</b></td><td class="dd-num">${pc(div(Z.gwResto, Z.bev), 0)}</td></tr><tr><td><b>Valor da empresa (100%)</b></td><td class="dd-num"><b>${mi(Z.bev)}</b></td><td class="dd-num">WACC ${pc(Z.wacc)}</td><td class="dd-num">100%</td></tr></tbody></table></div>
          <p class="sub" style="margin:0">A média ponderada dos retornos dos ativos é igual ao WACC; o ágio fica com o retorno residual, que deve ser o maior. Encargos no MPEEM: giro ${pc(Z.rNcg)} (Selic LP + spread, líquido), imobilizado ${pc(Z.rImob)} (Kd), força de trabalho ${pc(Z.wacc)}, não concorrência ${pc(Z.rI)}, marca e tecnologia pelo royalty.</p></div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Checagens automáticas</h3><p class="sub" style="margin:0">Baseadas nos checklists Kinsey de valuation e PPA.</p><div class="tbl"><table><tbody>${checks(s, Z).map(c => `<tr><td style="width:90px"><span class="pill ${c.c === "ok" ? "r-baixo" : "r-medio"}">${c.c === "ok" ? "OK" : "Revisar"}</span></td><td><b>${esc(c.t)}</b><div class="sub" style="margin:2px 0 0">${esc(c.d)}</div></td></tr>`).join("")}</tbody></table></div></div>
        ${(() => { const Sx = sensib(s), I = impair(Z), cc = q.churnCalc; return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Sensibilidade e recuperabilidade</h3>
          <div class="tbl"><table><thead><tr><th>Ágio · perda de clientes × prêmio</th>${Sx.pr.map(p => `<th class="dd-num">+${fmt(p, 1)} p.p.</th>`).join("")}</tr></thead><tbody>${Sx.lin.map(l => `<tr><td>perda ${fmt(l.churn, 1)}%</td>${l.cel.map(c => `<td class="dd-num">${mi(c.gw)}<div class="sub" style="margin:0">clientes ${mi(c.vC)}</div></td>`).join("")}</tr>`).join("")}</tbody></table></div>
          <p class="sub" style="margin:0">Teste de recuperabilidade (CPC 01): valor recuperável ${mi(I.evMod)} (valuation moderado) × valor contábil da unidade com o ágio ${mi(I.cont)} → <b style="color:${I.ind ? "var(--bad)" : "var(--ok)"}">${I.ind ? "indício de perda" : "sem indício de perda"}</b> (folga ${mi(I.folga)}).</p></div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><h3>Perda de clientes pela base de clientes</h3><p class="sub" style="margin:2px 0 0">Planilha com a receita por cliente e ano (colunas Cliente, Ano, Receita ou uma coluna por ano). O sistema calcula a perda por faixa (10% maiores, 40% seguintes, 50% menores) e usa a média ponderada pela receita no MPEEM.</p></div>${D.ed() ? `<label class="btn sm">Importar base<input type="file" id="ppa-ch" accept=".xlsx,.csv,.txt" hidden></label>` : ""}</div>
          ${cc ? `<div class="tbl"><table><thead><tr><th>Período</th><th class="dd-num">Clientes</th><th class="dd-num">Perdidos</th><th class="dd-num">Novos</th><th class="dd-num">Perda (receita)</th><th>Por faixa</th></tr></thead><tbody>${cc.por.map(p => `<tr><td>${p.de}→${p.ate}</td><td class="dd-num">${p.clientes}</td><td class="dd-num">${p.perdidos}</td><td class="dd-num">${p.novos}</td><td class="dd-num"><b>${pc(p.churnRec, 1)}</b></td><td class="sub">${p.fx.map(f => `${f.nome} ${pc(f.churnRec, 1)}`).join(" · ")}</td></tr>`).join("")}</tbody></table></div><p class="sub" style="margin:0">Média ponderada: <b>${pc(cc.media, 1)}</b> · ${cc.clientes} clientes · ${esc(cc.arquivo || "")}</p>` : ""}</div>`; })()}
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><h3>Revisar laudo ou modelo recebido</h3><p class="sub" style="margin:2px 0 0">Envie o PDF, DOCX ou PPTX: o sistema procura datas divergentes, codinomes e nomes de outros projetos, anos projetados com rótulo errado, regime tributário inconsistente e ágio com retorno menor que os intangíveis.</p></div><label class="btn sm">Escolher arquivo<input type="file" id="ppa-rev" accept=".pdf,.docx,.pptx,.txt" hidden></label></div><div id="ppa-rev-r"></div></div>
        <form class="card" id="fppa" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Premissas do PPA</h3><div class="form">
          ${[["pp-pr","Pagamento à vista (R$ mi; vazio = SPA ou valuation)","preco"],["pp-pc","Participação adquirida (%)","pct"],["pp-dt","Data de aquisição","data"],["pp-df","Parcelas diferidas (R$ mi)","diferido"],["pp-dfp","Prazo das parcelas diferidas (anos)","prazoDif"],["pp-eo","Earn-out máximo (R$ mi)","earnout"],["pp-eop","Probabilidade do earn-out (%)","probEo"],["pp-eon","Prazo do earn-out (anos)","prazoEo"],["pp-ir","Alíquota IR/CS (%)","ir"],["pp-im","Mais ou menos-valia do imobilizado (R$ mi; negativo = menos-valia)","imob"],["pp-imv","Mais ou menos-valia de imóveis (R$ mi; laudo)","imoveis"],["pp-es","Mais-valia dos estoques (R$ mi)","estoques"],["pp-ct","Passivos contingentes reconhecidos (R$ mi)","contingencias"],["pp-ch","Perda anual de clientes (%)","churn"],["pp-ro","Royalty da marca (% da receita)","royalty"],["pp-vm","Vida da marca (anos; 0 = indefinida)","vidaM"],["pp-rt","Royalty da tecnologia (% da receita)","royaltyT"],["pp-vt","Vida da tecnologia (anos)","vidaT"],["pp-te","Outra tecnologia (R$ mi, laudo)","tecnologia"],["pp-np","Não concorrência: probabilidade de competir (%)","probNc"],["pp-ne","Não concorrência: receita exposta (%)","expNc"],["pp-nn","Não concorrência: prazo (anos)","prazoNc"],["pp-rk","Contratos e exclusividade: receita anual (R$ mi)","recK"],["pp-pk","Contratos e exclusividade: prazo restante (anos)","prazoK"],["pp-mk","Contratos e exclusividade: margem (%)","mgK"],["pp-vi","Vida útil do imobilizado (anos, fiscal)","vidaImob"],["pp-fo","Folha anual (R$ mi; vazio = balancete)","folha"],["pp-rc","Recrutamento (% da folha)","recrut"],["pp-tr","Treinamento (% da folha)","trein"],["pp-pd","Produtividade do novo funcionário (%)","prod"],["pp-mp","Meses até a produtividade plena","mesesProd"],["pp-tx","Prêmio dos intangíveis sobre o WACC (p.p.)","taxaAdic"]].map(([id, l, k]) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" data-k="${k}" ${k === "data" ? 'type="date"' : 'inputmode="decimal"'} value="${q[k] != null ? esc(k === "data" ? q[k] : fmt(q[k], 2)) : ""}" placeholder="${k === "data" ? "" : esc(fmt({preco:Z.avista / 1e6, pct:Z.pct * 100, ir:Z.t * 100, churn:Z.churn * 100, royalty:Z.roy * 100, vidaM:Z.vidaM, royaltyT:Z.royT * 100, vidaT:Z.vidaT, probNc:Z.pNc * 100, expNc:Z.expNc * 100, prazoNc:Z.nNc, folha:Z.folha / 1e6, recrut:3, trein:1.5, prod:80, mesesProd:5, probEo:100, taxaAdic:(Z.rI - Z.wacc) * 100, mgK:Z.mg * 100, vidaImob:10}[k] ?? 0, 1))}" ${ed}></div>`).join("")}</div>
          <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="pp-tab" ${q.tab === false ? "" : "checked"} ${ed}> Aplicar benefício fiscal da amortização (TAB · Lei 12.973, após incorporação)</label>${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar premissas</button>` : ""}<p class="sub" style="margin:0">Valores de referência para o PPA contábil; a versão final depende de laudo de avaliação independente. Preço do SPA: contrato do tipo "Compra e venda de participação (SPA)" no Jurídico, com o valor da operação.</p></form>`; }
    host.innerHTML = h + tabs + `<div class="dd-split" style="margin-top:14px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">${corpo}</div></div>`;
    sd.bind(host); D.bindComum(host, s); if (window.KT_EO && s && S.posTab === "ppa") KT_EO.bind(host, s); if (window.KT_IMP && s && S.posTab === "imp") KT_IMP.bind(host, s);
    $$("[data-pt]", host).forEach(b => b.onclick = () => { S.posTab = b.dataset.pt; renderView(); });
    $$("[data-mm]", host).forEach(b => b.onclick = () => montar(s, b.dataset.mm));
    const a = $("#pm-add", host); if (a) a.onclick = novoModelo;
    const pp = $("#ppa-pdf", host); if (pp) pp.onclick = () => window.KT_GRAF ? KT_GRAF.modo("PPA · " + s.nome, md => ppaPdf(s, md)) : ppaPdf(s).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
    const xl = $("#ppa-xl", host); if (xl) xl.onclick = () => ppaXlsx(s).catch(e => { console.error(e); toast("Não foi possível gerar a planilha."); });
    const chi = $("#ppa-ch", host); if (chi) chi.onchange = async () => { const fl = chi.files[0]; if (!fl) return; try{ const buf = await fl.arrayBuffer(), L = /\.xlsx$/i.test(fl.name) ? await IMP.lerXLSX(buf) : new TextDecoder().decode(buf).split(/\r?\n/).map(l => l.split(/[;\t]/));
        const r = churnBase(L); await D.up(s, {pos:{ppa:{churn:+(r.media * 100).toFixed(2), churnCalc:{...r, anos:`${r.anos[0]}–${r.anos[r.anos.length - 1]}`, arquivo:fl.name, em:nowISO()}}}}); toast(`Perda de clientes calculada: ${pc(r.media, 1)} a.a.`); }
      catch(e){ console.error(e); toast("Não foi possível ler a base: " + (e.message || "erro")); } };
    const rv = $("#ppa-rev", host); if (rv) rv.onchange = async () => { const fl = rv.files[0]; if (!fl) return; const o = $("#ppa-rev-r", host); o.innerHTML = `<p class="sub">Lendo ${esc(fl.name)}…</p>`;
      try{ const tx = await KT_AUTO.texto(fl), A = revisarTexto(tx, s); o.innerHTML = A.length ? `<ul style="margin:0;padding-left:18px">${A.map(a => `<li style="margin:4px 0">${esc(a)}</li>`).join("")}</ul><p class="sub" style="margin:6px 0 0">Pontos para o revisor confirmar; não substitui a leitura técnica.</p>` : `<p class="sub">Nenhuma inconsistência automática encontrada em ${esc(fl.name)}.</p>`; }
      catch(e){ console.error(e); o.innerHTML = `<p class="err">Não foi possível ler o arquivo.</p>`; } };
    const f = $("#fppa", host); if (f) f.onsubmit = e => { e.preventDefault(); const o = {}; [...$$("#fppa input[data-k]")].filter(i => i.id !== "pp-dt").map(i => [i.id, i.dataset.k]).forEach(([id, k]) => { o[k] = n($("#" + id).value); });
      Object.keys(o).forEach(k => { if (o[k] == null || isNaN(o[k]) || $("#fppa [data-k=" + k + "]").value.trim() === "") delete o[k]; }); o.data = $("#pp-dt").value; o.tab = $("#pp-tab").checked; if (o.preco != null && o.preco !== (s.pos?.ppa?.preco ?? null)) o.fontePreco = "informado"; D.up(s, {pos:{ppa:o}}).then(() => toast("Premissas do PPA salvas")); };
  };
  window.KT_POS = {ppa, modelos, checks, revisarTexto, tabF, churnBase, sensib, impair, ppaXlsx, ppaPdf};
})();
