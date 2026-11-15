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
    const R = V.resumo(s), X = R.X; if (!X || X.vazio) return null; const q = s.pos?.ppa || {}, W = X.W, P = X.Bs.P;
    const v0 = (k, d) => q[k] != null && q[k] !== "" && !isNaN(q[k]) ? +q[k] : d;
    const t = v0("ir", 34) / 100, regime = s.perfil?.regime || "", wacc = W.wacc, inf = P.infBR.v / 100;
    const spa = precoSPA(s), pct = v0("pct", parseFloat(String(s.mandato?.participacao || "").replace(",", ".")) || 100) / 100;
    /* consideração transferida: à vista + parcelas diferidas a valor presente (Kd) + earn-out a valor justo (WACC) */
    const avista = q.preco != null ? q.preco * 1e6 : spa ? spa.v : ((R.rec[0] + R.rec[1]) / 2 - X.dl) * pct, fonte = q.preco != null ? "informado" : spa ? spa.ref : "faixa moderada do valuation";
    const dif = v0("diferido", 0) * 1e6, nDif = v0("prazoDif", 0), vpDif = nDif > 0 ? dif / Math.pow(1 + W.kd, nDif) : dif;
    const eo = v0("earnout", 0) * 1e6 * v0("probEo", 100) / 100, nEo = v0("prazoEo", 0), vpEo = nEo > 0 ? eo / Math.pow(1 + wacc, nEo) : eo;
    const preco = avista + vpDif + vpEo;
    const K = X.bp.K, G = K.G || {}, f = K.f || 1, rl0 = X.bp.rl, mg = R.mod.c.mg, capexP = X.capex, ncgP = X.ncgp;
    const plContabil = K.PL, ajDD = X.bp.A.pl;
    /* taxas: WACC; intangíveis = WACC + prêmio; capital de giro = (Selic LP + spread) líquido; imobilizado = Kd */
    const premI = v0("taxaAdic", 1) / 100, rI = wacc + premI, rNcg = W.kdLiq, rImob = W.kd;
    const imobBook = Math.max(0, (G.imobilizado || 0) + (G.deprec || 0)), imobMV = v0("imob", 0) * 1e6, imobVJ = imobBook + imobMV;
    const ncgV = Math.max(0, K.ncg || ncgP * rl0), imobR = div(imobVJ, rl0) || 0, depR = capexP;
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
    const est = v0("estoques", 0) * 1e6, cont = v0("contingencias", 0) * 1e6, intang = vC + vM + vT + vNc;
    const maisValias = imobMV + est + intang, irDif = (maisValias - cont) * t * (q.irDif === false ? 0 : 1);
    const liqVJ = plContabil + ajDD + maisValias - cont - irDif, nci = liqVJ * (1 - pct), goodwill = preco + nci - liqVJ;
    /* WARA: valor da empresa = consideração (100%) + dívida líquida; retorno implícito do ágio */
    const bev = preco / pct + X.dl, gw100 = goodwill / pct;
    const outros = Math.max(0, plContabil + ajDD + X.dl - ncgV - imobBook);
    const wara = [["Capital de giro", ncgV, rNcg], ["Outros ativos líquidos", outros, rNcg], ["Imobilizado a valor justo", imobVJ, rImob * (1 - t)], ["Carteira de clientes", vC, rC], ["Marca", vM, rI], ["Tecnologia", vT, rI], ["Não concorrência", vNc, rI], ["Força de trabalho (no ágio)", wf, wacc]].filter(x => x[1] > 0);
    const somaA = wara.reduce((a, x) => a + x[1], 0), gwResto = bev - somaA, rGw = gwResto > 0 ? (wacc * bev - wara.reduce((a, x) => a + x[1] * x[2], 0)) / gwResto : null;
    const waraT = rGw != null ? wacc : null, vidas = {cli:vidaC, marca:vidaM > 0 ? vidaM : null, tec:vidaT, nc:nNc};
    const amort = [1, 2, 3, 4, 5].map(y => ({y, cli:y <= vidaC ? vC / vidaC : 0, marca:vidaM > 0 && y <= vidaM ? vM / vidaM : 0, tec:vT && y <= vidaT ? vT / vidaT : 0, nc:y <= nNc ? vNc / nNc : 0}));
    amort.forEach(a => { a.tot = a.cli + a.marca + a.tec + a.nc; a.ir = a.tot * t; });
    return {R, X, q, spa, pct, avista, vpDif, vpEo, dif, eo, preco, fonte, plContabil, ajDD, vC, vM, vT, vNc, wf, imob:imobMV, imobBook, imobVJ, ncgV, est, cont, irDif, liqVJ, nci, goodwill, intang,
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
    const rec = Z.X.H?.anuais || []; ok(rec.length >= 2, "Histórico de pelo menos dois exercícios", "Projeções do MPEEM e do royalty usam a base do valuation.");
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
  async function ppaPdf(s){
    const Z = ppa(s), Rl = KT_REL, P = KTPdf(), C = checks(s, Z), x = v => mi(v);
    Rl.capa(P, "Laudo de alocação do preço de compra (CPC 15 / IFRS 3)", s.nome, [["Data de aquisição", Z.q.data || "a definir"], ["Participação adquirida", pc(Z.pct, 0)], ["Consideração transferida", x(Z.preco)], ["Ágio (goodwill)", x(Z.goodwill)], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    Rl.sec(P, 1, "Sumário executivo");
    Rl.tab(P, ["Componente", "Valor"], linhasPpa(Z), [.7, .3]);
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
    Rl.tab(P, ["Ano", "Receita", "NOPAT", "Encargos", "Excedente", "VP"], Z.anosC.slice(0, 12).map(a => [String(a.y), x(a.r), x(a.nopat), x(a.cNcg + a.cImob + a.cWf + a.cM + a.cT + a.cNc), x(a.exc), x(a.pv)]), [.1, .18, .18, .18, .18, .18]);
    Rl.sec(P, 7, "Taxa de desconto e reconciliação (WARA)");
    Rl.tab(P, ["Ativo", "Valor justo", "Retorno", "Peso"], [...Z.wara.map(w => [w[0], x(w[1]), pc(w[2]), pc(div(w[1], Z.bev), 0)]), ["Ágio residual", x(Z.gwResto), Z.rGw != null ? pc(Z.rGw) : "—", pc(div(Z.gwResto, Z.bev), 0)], ["Valor da empresa (100%) = WACC", x(Z.bev), pc(Z.wacc), "100%"]], [.4, .2, .2, .2]);
    Rl.sec(P, 8, "Amortização dos intangíveis");
    Rl.tab(P, ["Ano", "Clientes", "Marca", "Tecnologia", "Não concorrência", "Total", "IR diferido realizado"], Z.amort.map(a => [String(a.y), x(a.cli), x(a.marca), x(a.tec), x(a.nc), x(a.tot), x(a.ir)]), [.08, .15, .13, .15, .17, .14, .18]);
    Rl.sec(P, 9, "Checagens automáticas (checklists Kinsey)");
    Rl.tab(P, ["Situação", "Item", "Observação"], C.map(c => [c.c === "ok" ? "OK" : "Revisar", c.t, c.d]), [.12, .3, .58]);
    await rptSave(P.out(`PPA · ${s.nome}`, Rl.T(`Kinsey Capital · PPA · ${s.nome} · confidencial`)), Rl.arq(s, "PPA", "pdf"), "application/pdf");
  }
  const linhasPpa = Z => [["Consideração transferida · " + Z.fonte, mi(Z.preco)], ["(+) Participação de não controladores (proporcional)", mi(Z.nci)], ["Patrimônio líquido contábil", mi(Z.plContabil)], ["(+) Ajustes de Due Diligence com OK no valuation", mi(Z.ajDD)],
    ["(+) Mais-valia do imobilizado", mi(Z.imob)], ["(+) Mais-valia dos estoques", mi(Z.est)], ["(+) Carteira de clientes", mi(Z.vC)], ["(+) Marca", mi(Z.vM)], ["(+) Tecnologia", mi(Z.vT)], ["(+) Não concorrência", mi(Z.vNc)], ["(−) Passivos contingentes reconhecidos", mi(-Z.cont)], ["(−) IR e CS diferidos sobre as mais-valias", mi(-Z.irDif)],
    ["Ativos líquidos a valor justo", mi(Z.liqVJ)], [Z.goodwill < 0 ? "Ganho por compra vantajosa" : "Ágio (goodwill)", mi(Z.goodwill)]];

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
      <form class="sheet-b" id="fnm" style="display:flex;flex-direction:column;gap:10px" novalidate><div class="form"><div class="fld"><label for="nm-t">Título</label><input id="nm-t" placeholder="ex.: SPA padrão Kinsey 2026"></div><div class="fld"><label for="nm-k">Tipo</label><select id="nm-k">${["SPA","PPA","Laudo de avaliação","Acordo de acionistas","Contrato de earn-out","Outro"].map(x => `<option>${x}</option>`).join("")}</select></div>
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
    const tabs = `<div class="dd-tabs">${[["ppa","PPA · alocação do preço"],["mod","Base de modelos"]].map(([k, l]) => `<button type="button" class="fbtn" data-pt="${k}" aria-pressed="${S.posTab === k}">${l}</button>`).join("")}</div>`;
    let corpo = "";
    if (S.posTab === "mod") corpo = `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Base de modelos</h3><p class="sub" style="margin:2px 0 0">Modelos de SPA, PPA e documentos de pós-aquisição da Kinsey. Servem de referência para montar novas minutas com os dados do target; quanto mais modelos, melhor a base.</p></div>${D.ed() ? `<button type="button" class="btn sm primary" id="pm-add">+ Incluir modelo</button>` : ""}</div>
      <div class="tbl"><table><thead><tr><th>Modelo</th><th>Tipo</th><th>Origem</th><th></th></tr></thead><tbody>${modelos().map(m => `<tr><td><b>${esc(m.titulo)}</b></td><td>${esc(m.tipo)}</td><td>${m.provisorio ? `<span class="pill r-medio">Provisório</span>` : `${esc(m.por || "Kinsey")} · ${dt(m.em)}`}</td><td style="text-align:right"><button type="button" class="btn sm" data-mm="${m.id}" ${s ? "" : "disabled"}>Montar para ${esc((s?.mandato?.codinome || s?.nome || "").replace(/^EXEMPLO /, "").slice(0, 22))}</button></td></tr>`).join("")}</tbody></table></div></div>`;
    else { const Z = s && D.temBal(s) ? ppa(s) : null, q = s?.pos?.ppa || {};
      corpo = !Z ? D.semBal(s) : `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">${esc(s.mandato?.codinome || "")}</div><h3>${esc(s.nome)} · PPA</h3><p class="sub" style="margin:2px 0 0">Preço: ${esc(Z.fonte)} · participação ${pc(Z.pct, 0)}</p></div><button type="button" class="btn sm primary" id="ppa-pdf">Baixar PPA (PDF)</button></div>
        <div class="dd-kpis"><div class="dd-k"><span>Consideração transferida</span><b>${mi(Z.preco)}</b></div><div class="dd-k"><span>Ativos líquidos a valor justo</span><b>${mi(Z.liqVJ)}</b></div><div class="dd-k"><span>Intangíveis identificados</span><b>${mi(Z.intang)}</b><small>clientes ${mi(Z.vC)} (${Z.vidaC} anos) · marca ${mi(Z.vM)} · NC ${mi(Z.vNc)}</small></div><div class="dd-k"><span>Ágio (goodwill)</span><b>${mi(Z.goodwill)}</b><small>${pc(div(Z.goodwill, Z.preco), 0)} do preço</small></div><div class="dd-k"><span>Retorno implícito do ágio</span><b>${Z.rGw != null ? pc(Z.rGw) : "—"}</b><small>WACC ${pc(Z.wacc)} · intangíveis ${pc(Z.rI)}</small></div></div>
        <div class="tbl"><table><tbody>${linhasPpa(Z).map(([a, b], i, L) => `<tr><td>${i >= L.length - 2 ? `<b>${esc(a)}</b>` : esc(a)}</td><td class="dd-num">${i >= L.length - 2 ? `<b>${b}</b>` : b}</td></tr>`).join("")}</tbody></table></div></div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Reconciliação WARA × WACC</h3><div class="tbl"><table><thead><tr><th>Ativo</th><th class="dd-num">Valor justo</th><th class="dd-num">Retorno</th><th class="dd-num">Peso</th></tr></thead><tbody>${Z.wara.map(w => `<tr><td>${esc(w[0])}</td><td class="dd-num">${mi(w[1])}</td><td class="dd-num">${pc(w[2])}</td><td class="dd-num">${pc(div(w[1], Z.bev), 0)}</td></tr>`).join("")}<tr><td><b>Ágio residual (retorno implícito)</b></td><td class="dd-num">${mi(Z.gwResto)}</td><td class="dd-num"><b>${Z.rGw != null ? pc(Z.rGw) : "—"}</b></td><td class="dd-num">${pc(div(Z.gwResto, Z.bev), 0)}</td></tr><tr><td><b>Valor da empresa (100%)</b></td><td class="dd-num"><b>${mi(Z.bev)}</b></td><td class="dd-num">WACC ${pc(Z.wacc)}</td><td class="dd-num">100%</td></tr></tbody></table></div>
          <p class="sub" style="margin:0">A média ponderada dos retornos dos ativos é igual ao WACC; o ágio fica com o retorno residual, que deve ser o maior. Encargos no MPEEM: giro ${pc(Z.rNcg)} (Selic LP + spread, líquido), imobilizado ${pc(Z.rImob)} (Kd), força de trabalho ${pc(Z.wacc)}, não concorrência ${pc(Z.rI)}, marca e tecnologia pelo royalty.</p></div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Checagens automáticas</h3><p class="sub" style="margin:0">Baseadas nos checklists Kinsey de valuation e PPA.</p><div class="tbl"><table><tbody>${checks(s, Z).map(c => `<tr><td style="width:90px"><span class="pill ${c.c === "ok" ? "r-baixo" : "r-medio"}">${c.c === "ok" ? "OK" : "Revisar"}</span></td><td><b>${esc(c.t)}</b><div class="sub" style="margin:2px 0 0">${esc(c.d)}</div></td></tr>`).join("")}</tbody></table></div></div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><h3>Revisar laudo ou modelo recebido</h3><p class="sub" style="margin:2px 0 0">Envie o PDF, DOCX ou PPTX: o sistema procura datas divergentes, codinomes e nomes de outros projetos, anos projetados com rótulo errado, regime tributário inconsistente e ágio com retorno menor que os intangíveis.</p></div><label class="btn sm">Escolher arquivo<input type="file" id="ppa-rev" accept=".pdf,.docx,.pptx,.txt" hidden></label></div><div id="ppa-rev-r"></div></div>
        <form class="card" id="fppa" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Premissas do PPA</h3><div class="form">
          ${[["pp-pr","Pagamento à vista (R$ mi; vazio = SPA ou valuation)","preco"],["pp-pc","Participação adquirida (%)","pct"],["pp-dt","Data de aquisição","data"],["pp-df","Parcelas diferidas (R$ mi)","diferido"],["pp-dfp","Prazo das parcelas diferidas (anos)","prazoDif"],["pp-eo","Earn-out máximo (R$ mi)","earnout"],["pp-eop","Probabilidade do earn-out (%)","probEo"],["pp-eon","Prazo do earn-out (anos)","prazoEo"],["pp-ir","Alíquota IR/CS (%)","ir"],["pp-im","Mais-valia do imobilizado (R$ mi)","imob"],["pp-es","Mais-valia dos estoques (R$ mi)","estoques"],["pp-ct","Passivos contingentes reconhecidos (R$ mi)","contingencias"],["pp-ch","Perda anual de clientes (%)","churn"],["pp-ro","Royalty da marca (% da receita)","royalty"],["pp-vm","Vida da marca (anos; 0 = indefinida)","vidaM"],["pp-rt","Royalty da tecnologia (% da receita)","royaltyT"],["pp-vt","Vida da tecnologia (anos)","vidaT"],["pp-te","Outra tecnologia (R$ mi, laudo)","tecnologia"],["pp-np","Não concorrência: probabilidade de competir (%)","probNc"],["pp-ne","Não concorrência: receita exposta (%)","expNc"],["pp-nn","Não concorrência: prazo (anos)","prazoNc"],["pp-fo","Folha anual (R$ mi; vazio = balancete)","folha"],["pp-rc","Recrutamento (% da folha)","recrut"],["pp-tr","Treinamento (% da folha)","trein"],["pp-pd","Produtividade do novo funcionário (%)","prod"],["pp-mp","Meses até a produtividade plena","mesesProd"],["pp-tx","Prêmio dos intangíveis sobre o WACC (p.p.)","taxaAdic"]].map(([id, l, k]) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" data-k="${k}" ${k === "data" ? 'type="date"' : 'inputmode="decimal"'} value="${q[k] != null ? esc(k === "data" ? q[k] : fmt(q[k], 2)) : ""}" placeholder="${k === "data" ? "" : esc(fmt({preco:Z.avista / 1e6, pct:Z.pct * 100, ir:Z.t * 100, churn:Z.churn * 100, royalty:Z.roy * 100, vidaM:Z.vidaM, royaltyT:Z.royT * 100, vidaT:Z.vidaT, probNc:Z.pNc * 100, expNc:Z.expNc * 100, prazoNc:Z.nNc, folha:Z.folha / 1e6, recrut:3, trein:1.5, prod:80, mesesProd:5, probEo:100, taxaAdic:(Z.rI - Z.wacc) * 100}[k] ?? 0, 1))}" ${ed}></div>`).join("")}</div>
          <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="pp-tab" ${q.tab === false ? "" : "checked"} ${ed}> Aplicar benefício fiscal da amortização (TAB · Lei 12.973, após incorporação)</label>${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar premissas</button>` : ""}<p class="sub" style="margin:0">Valores de referência para o PPA contábil; a versão final depende de laudo de avaliação independente. Preço do SPA: contrato do tipo "Compra e venda de participação (SPA)" no Jurídico, com o valor da operação.</p></form>`; }
    host.innerHTML = h + tabs + `<div class="dd-split" style="margin-top:14px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">${corpo}</div></div>`;
    sd.bind(host); D.bindComum(host, s);
    $$("[data-pt]", host).forEach(b => b.onclick = () => { S.posTab = b.dataset.pt; renderView(); });
    $$("[data-mm]", host).forEach(b => b.onclick = () => montar(s, b.dataset.mm));
    const a = $("#pm-add", host); if (a) a.onclick = novoModelo;
    const pp = $("#ppa-pdf", host); if (pp) pp.onclick = () => ppaPdf(s).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
    const rv = $("#ppa-rev", host); if (rv) rv.onchange = async () => { const fl = rv.files[0]; if (!fl) return; const o = $("#ppa-rev-r", host); o.innerHTML = `<p class="sub">Lendo ${esc(fl.name)}…</p>`;
      try{ const tx = await KT_AUTO.texto(fl), A = revisarTexto(tx, s); o.innerHTML = A.length ? `<ul style="margin:0;padding-left:18px">${A.map(a => `<li style="margin:4px 0">${esc(a)}</li>`).join("")}</ul><p class="sub" style="margin:6px 0 0">Pontos para o revisor confirmar; não substitui a leitura técnica.</p>` : `<p class="sub">Nenhuma inconsistência automática encontrada em ${esc(fl.name)}.</p>`; }
      catch(e){ console.error(e); o.innerHTML = `<p class="err">Não foi possível ler o arquivo.</p>`; } };
    const f = $("#fppa", host); if (f) f.onsubmit = e => { e.preventDefault(); const o = {}; [...$$("#fppa input[data-k]")].filter(i => i.id !== "pp-dt").map(i => [i.id, i.dataset.k]).forEach(([id, k]) => { o[k] = n($("#" + id).value); });
      Object.keys(o).forEach(k => { if (o[k] == null || isNaN(o[k]) || $("#fppa [data-k=" + k + "]").value.trim() === "") delete o[k]; }); o.data = $("#pp-dt").value; o.tab = $("#pp-tab").checked; D.up(s, {pos:{ppa:o}}).then(() => toast("Premissas do PPA salvas")); };
  };
  window.KT_POS = {ppa, modelos, checks, revisarTexto, tabF};
})();
