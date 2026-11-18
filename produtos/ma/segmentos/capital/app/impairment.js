/* ================= KINSEY CAPITAL · IMPAIRMENT (CPC 01 R1 / IAS 36) =================
   Teste de redução ao valor recuperável por unidade geradora de caixa (UGC), na aba "Impairment" do Pós-aquisição.
   - Base de dados, por prioridade: workbook da Due Diligence (balanço revisado) → fluxo do PPA (o esperado na aquisição)
     → valuation pelos balancetes. A data-base do teste pode ser diferente da aquisição; o desconto é pelo WACC da data do teste.
   - UGC: a própria empresa (100% do fluxo) ou várias unidades (ex.: São Paulo 60% e Rio de Janeiro 40% da receita): cada UGC
     recebe a sua parte do fluxo de caixa e do valor contábil (carrying amount).
   - Carrying amount: marca, relacionamento com clientes, outros intangíveis do PPA (líquidos da amortização acumulada),
     mais-valia de ativos, imobilizado contábil, capital de giro e ágio (ajustado a 100% quando há não controladores, item C4).
   - Valor recuperável = o maior entre o valor em uso (FCD: 5 anos + perpetuidade, com o CAPEX do valuation) e o valor justo
     líquido de despesas de venda. Contábil > recuperável = perda; alocação: ágio primeiro, depois pro rata (item 104).
   - Indícios (item 12), teste anual do ágio (itens 10 e 90), taxa antes dos impostos (item 55), sensibilidade (item 134),
     contabilização e efeito fiscal (Lei 12.973). Laudo em PDF e PowerPoint e memória de cálculo em Excel. */
if (window.KT_DD && window.KT_VAL && window.KT_POS) (() => {
  const D = KT_DD, V = KT_VAL, {mi, pc} = D, nn = v => { const x = num(v); return x == null || isNaN(x) ? null : x; };
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const pcx = (v, d = 1) => v == null || !isFinite(v) ? "—" : `${fmt(v * 100, d)}%`;
  const INDICIOS = [
    ["mercado", "Queda significativa do valor de mercado do ativo ou da empresa, maior que a esperada pelo uso normal", "externo"],
    ["adverso", "Mudanças adversas no ambiente tecnológico, de mercado, econômico ou legal (perda de cliente relevante, nova concorrência, regulação)", "externo"],
    ["juros", "Aumento das taxas de juros ou do WACC que reduz o valor em uso", "externo"],
    ["pl", "Patrimônio líquido contábil maior que o valor de mercado da empresa", "externo"],
    ["obsoleto", "Obsolescência ou dano físico de ativos", "interno"],
    ["descont", "Planos de descontinuar, reestruturar ou vender a operação ou parte dela", "interno"],
    ["desemp", "Desempenho econômico pior que o esperado (EBITDA ou fluxo de caixa abaixo do projetado na aquisição)", "interno"]];
  const COMP = [["marca", "Marca"], ["carteira", "Relacionamento com clientes (carteira)"], ["outrosInt", "Outros intangíveis (tecnologia, não concorrência, contratos)"], ["maisValia", "Mais-valia de ativos (imobilizado e imóveis)"], ["imob", "Imobilizado contábil"], ["giro", "Capital de giro operacional"], ["agio", "Ágio (goodwill)"]];
  const INTANG = ["marca", "carteira", "outrosInt", "agio"]; /* acompanham o % do ágio da UGC; os demais, o % da receita */
  const cfg = s => s?.pos?.imp || {};
  /* fluxos do cenário moderado (com o CAPEX do valuation); dm = choque no EBITDA para o ponto de equilíbrio */
  function fluxos(X, c, dm = 0, O = null){
    const t = X.W.t, cx = X.capex;
    if (O) return O.anos.map((a, i) => { const eb = a.eb * (1 + dm), ir = Math.max(0, a.ir + a.eb * dm * t); return {t:i + 1, y:a.y, rl:a.rl, eb, ir, da:null, capex:a.capex, oinv:a.oinv || 0, dncg:a.dncg || 0, cxInf:true, fcl:eb - ir - a.capex - (a.oinv || 0) - (a.dncg || 0), pre:eb - a.capex - (a.oinv || 0) - (a.dncg || 0)}; });
    return c.anos.map(a => { const da = a.da ?? a.rl * cx, capex = a.capex ?? a.rl * cx, oinv = a.oinv || 0, dncg = a.dncg ?? (a.eb - Math.max(0, a.eb - da) * t - capex - a.fcl);
      const eb = a.eb * (1 + dm), ir = Math.max(0, eb - da) * t; return {...a, eb, ir, da, capex, oinv, dncg, fcl:eb - ir - capex - oinv - dncg, pre:eb - capex - oinv - dncg}; }); }
  function vu(X, F, w, g, O = null){
    const t = X.W.t, cx = X.capex, u = F[4]; let vp = 0;
    F.forEach(a => { vp += a.fcl / Math.pow(1 + w, a.t - .5); });
    const irP = O ? u.ir * (1 + g) : Math.max(0, u.eb - u.rl * cx) * (1 + g) * t;
    const fclP = O && O.fclP != null ? O.fclP + (u.eb - O.anos[4].eb) * (1 + g) * (1 - t) : u.eb * (1 + g) - irP - u.rl * cx * (1 + g) - u.rl * X.ncgp * g;
    const tv = w > g ? fclP / (w - g) : 0, vtv = tv / Math.pow(1 + w, 4.5);
    return {vp, vtv, v:vp + vtv, fclP, preP:fclP + irP}; }
  /* taxa antes dos impostos: a que, aplicada aos fluxos antes do IR, dá o mesmo valor em uso (item 55) */
  function taxaPre(F, alvo, g, preP){
    const f = r => F.reduce((a, x) => a + x.pre / Math.pow(1 + r, x.t - .5), 0) + (r > g ? preP / (r - g) / Math.pow(1 + r, 4.5) : 1e30);
    let lo = g + 1e-4, hi = 1.5; if (!(f(hi) < alvo)) return null;
    for (let i = 0; i < 80; i++){ const m = (lo + hi) / 2; if (f(m) > alvo) lo = m; else hi = m; } return (lo + hi) / 2; }
  function fonteDe(s, X){
    const b = s.dd?.bal?.[X.perBase] || {}, wb = b.origem === "workbook" || !!s.dd?.wb, ppa = !!(s.pos?.ppa && Object.keys(s.pos.ppa).length);
    if (wb) return {k:"wb", t:`Workbook da Due Diligence (balanço revisado de ${X.perBase})${ppa ? " + premissas do PPA" : ""}`};
    if (ppa) return {k:"ppa", t:`Fluxo do PPA (esperado na aquisição) · balancete de ${X.perBase}`};
    return {k:"val", t:`Valuation · balancete de ${X.perBase} (sem workbook nem PPA)`}; }
  function ugcs(s, q){
    const L = Object.entries(q.ugcs || {}).filter(([, u]) => u).map(([id, u]) => ({id, nome:u.nome || "UGC", pct:(u.pct ?? 0) / 100, pctAg:u.pctAgio != null && u.pctAgio !== "" ? u.pctAgio / 100 : null, ind:u.ind, obs:u.obs || ""}));
    return L.length ? L : [{id:"_todo", nome:q.ugc || "Empresa toda", pct:1, pctAg:null, ind:null, obs:"", unica:true}]; }
  function calc(s){
    const Z = KT_POS.ppa(s); if (!Z) return null; const R = Z.R, X = R.X, q = cfg(s), c = (R.mod || V.resumo(s).mod).c, fonte = fonteDe(s, X);
    const O = q.fluxo?.anos?.length === 5 ? q.fluxo : null, Fs = fluxos(X, c), VUs = vu(X, Fs, X.W.wacc, c.g);
    const w = q.taxa != null ? q.taxa / 100 : X.W.wacc, g = q.g != null ? q.g / 100 : c.g, F = fluxos(X, c, 0, O), VU = vu(X, F, w, g, O), pre = taxaPre(F, VU.v, g, VU.preP);
    if (O) fonte.t = `Fluxo revisado pelo consultor (planilha ${O.arquivo || "importada"}) · ${fonte.t}`;
    /* valor justo líquido de despesas de venda pelos múltiplos de mercado */
    const C = R.C || V.comparaveis(s), dsc = 1 - (X.Bs.P.desc?.v || 0) / 100, cv = (q.custoVenda ?? 2) / 100;
    const multEb = q.mult != null ? q.mult : C?.eb ? (C.eb.p25 + C.eb.p75) / 2 * dsc : null, vjBruto = multEb ? X.bp.eb * multEb : null, vj = vjBruto != null ? vjBruto * (1 - cv) : null;
    /* datas e amortização acumulada dos intangíveis do PPA */
    const dAq = q.dataAq || Z.q.data || "", dT = q.data || new Date().toISOString().slice(0, 10);
    const anos = dAq ? Math.max(0, (new Date(dT) - new Date(dAq)) / (365.25 * 864e5)) : 1, n = Math.floor(anos);
    const ac = k => { let t = 0; for (let y = 1; y <= n; y++) t += (Z.amort[Math.min(y, 5) - 1]?.[k] || 0) * (y > 5 && k === "nc" ? 0 : 1); return t; };
    const amM = ac("marca"), amC = ac("cli"), amO = ac("tec") + ac("nc") + ac("kt");
    const v = (k, d) => q.comp?.[k] != null ? q.comp[k] * 1e6 : d;
    const agio0 = v("agio", Z.goodwill), agioUgc = Z.pct > 0 && Z.pct < 1 && !q.agioTotal ? agio0 / Z.pct : agio0;
    const comp = {marca:v("marca", Math.max(0, Z.vM - amM)), carteira:v("carteira", Math.max(0, Z.vC - amC)), outrosInt:v("outrosInt", Math.max(0, Z.vT + Z.vNc + (Z.vK || 0) - amO)),
      maisValia:v("maisValia", (Z.imob || 0) + (Z.imovMV || 0)), imob:v("imob", Z.imobBook), giro:v("giro", Z.ncgV), agio:agioUgc};
    const am = {marca:amM, carteira:amC, outrosInt:amO};
    /* indícios da empresa: desempenho realizado × projetado apurado sozinho */
    const per = (D.periodos(s) || []).sort().pop(), yP = per ? +per.slice(0, 4) : 0; let ebReal = q.ebReal != null ? q.ebReal * 1e6 : null, ebFonte = q.ebReal != null ? "informado" : "";
    if (ebReal == null && per && yP > X.y0){ const K = D.calc(s.dd.bal[per]), m = s.dd.bal[per]?.meses || +per.slice(5, 7) || 12; ebReal = K.ebitda * 12 / m; ebFonte = `balancete de ${per}${m < 12 ? " anualizado" : ""}`; }
    const ebProj = (F.find(a => a.y === (yP > X.y0 ? yP : X.y0 + 1)) || F[0]).eb, desv = ebReal != null && ebProj ? ebReal / ebProj - 1 : null;
    const wAq = q.waccAq != null ? q.waccAq / 100 : null, auto = {desemp:desv != null && desv < -.1, juros:wAq != null && w > wAq + .005};
    const ind = INDICIOS.map(([k, t, tp]) => ({k, t, tp, sim:q.ind?.[k]?.sim ?? !!auto[k], auto:!!auto[k], obs:q.ind?.[k]?.obs || ""})), indEmp = ind.some(x => x.sim);
    /* teste por UGC */
    const vuF = (p, ww, gg) => vu(X, F, ww, gg, O).v * p;
    const U = ugcs(s, q).map(u => { const pa = u.pctAg ?? u.pct, cp = {}; COMP.forEach(([k]) => { cp[k] = comp[k] * (INTANG.includes(k) ? pa : u.pct); });
      const cont = Object.values(cp).reduce((a, x) => a + x, 0), vuU = VU.v * u.pct, vjU = vj != null ? vj * u.pct : null, rec = Math.max(vuU, vjU ?? -Infinity);
      const perda = Math.max(0, cont - rec), folga = rec - cont, pAg = Math.min(perda, cp.agio), resto = perda - pAg, base = cp.marca + cp.carteira + cp.outrosInt + cp.maisValia + cp.imob;
      const aloc = {agio:pAg}; ["marca", "carteira", "outrosInt", "maisValia", "imob"].forEach(k => { aloc[k] = base ? resto * cp[k] / base : 0; });
      const beW = (() => { if (vuU <= cont || u.pct <= 0) return null; let lo = w, hi = .6; if (vuF(u.pct, hi, g) > cont) return null; for (let i = 0; i < 70; i++){ const m = (lo + hi) / 2; if (vuF(u.pct, m, g) > cont) lo = m; else hi = m; } return lo; })();
      const beM = (() => { if (vuU <= cont || u.pct <= 0) return null; let lo = -.95, hi = 0; for (let i = 0; i < 70; i++){ const m = (lo + hi) / 2; if (vu(X, fluxos(X, c, m, O), w, g, O).v * u.pct > cont) hi = m; else lo = m; } return hi; })();
      const indU = u.ind ?? indEmp, obrig = cp.agio > 0 || indU;
      return {...u, pa, cp, cont, vu:vuU, vj:vjU, rec, base:rec === vuU ? "valor em uso" : "valor justo líquido de despesas de venda", perda, folga, aloc, beW, beM, indU, obrig}; });
    const T = {cont:U.reduce((a, u) => a + u.cont, 0), vu:U.reduce((a, u) => a + u.vu, 0), rec:U.reduce((a, u) => a + u.rec, 0), perda:U.reduce((a, u) => a + u.perda, 0)};
    T.folga = U.reduce((a, u) => a + Math.max(0, u.folga), 0); T.agioCtrl = U.reduce((a, u) => a + u.aloc.agio, 0) * (Z.pct < 1 && !q.agioTotal ? Z.pct : 1);
    const somaPct = U.reduce((a, u) => a + u.pct, 0), somaAg = U.reduce((a, u) => a + u.pa, 0);
    /* sensibilidade do conjunto (taxa × crescimento) */
    const dw = [-.01, 0, .01, .02], dg = [-.01, -.005, 0, .005], grid = dg.map(d => ({g:g + d, cel:dw.map(e => ({w:w + e, folga:U.reduce((a, u) => a + Math.max(vuF(u.pct, w + e, g + d), u.vj ?? -Infinity) - u.cont, 0)}))}));
    /* calendário: primeiro teste do ágio até o fim do exercício da aquisição (item 84), depois todo ano */
    const prox = dAq ? (n < 1 ? `${dAq.slice(0, 4)}-12-31` : `${+dT.slice(0, 4) + 1}${dT.slice(4)}`) : "";
    return {Z, R, X, q, O, Fs, VUs, c, w, g, F, VU, pre, C, multEb, vjBruto, vj, cv, comp, am, agio0, cont:T.cont, T, U, somaPct, somaAg, ebReal, ebFonte, ebProj, desv, ind, indEmp, anos, dT, dAq, prox, fonte, grid, wAq, ugcNome:q.ugc || s.mandato?.codinome || s.nome};
  }
  const statusU = u => u.perda > 0 ? ["r-alto", "Impairment: sim"] : u.folga < u.cont * .1 ? ["r-medio", "Impairment: não · folga pequena"] : ["r-baixo", "Impairment: não"];
  function html(s){
    if (!s) return D.semBal(s); const I = calc(s); if (!I) return D.semBal(s);
    const ed = D.ed() ? "" : "disabled", q = I.q, T = I.T, k = (l, v, sub, cor) => `<div class="dd-k"><span>${l}</span><b${cor ? ` style="color:${cor}"` : ""}>${v}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
    const inp = (id, l, val, ph) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" inputmode="decimal" value="${val != null ? esc(String(val).replace(".", ",")) : ""}" placeholder="${esc(ph || "")}" ${ed}></div>`;
    const st = T.perda > 0 ? ["r-alto", "Impairment: sim"] : ["r-baixo", "Impairment: não"], indT = I.indEmp || I.U.some(u => u.indU);
    const varias = !I.U[0].unica;
    return `<div class="card imp" style="display:flex;flex-direction:column;gap:10px;font-size:13px"><style>.imp table{font-size:12.5px}.imp td,.imp th{padding:6px 8px}.imp summary{cursor:pointer;font-size:13px;font-weight:600}.imp .dd-num{white-space:nowrap}</style>
      <div class="head" style="margin:0"><div><div class="eyebrow">Impairment · CPC 01 (R1)</div><h3 style="font-size:15px;margin:0">${esc(s.mandato?.codinome || s.nome)} · teste de recuperabilidade</h3>
        <p class="sub" style="margin:2px 0 0;font-size:12px">Data-base do teste ${dBR(I.dT)}${I.dAq ? ` · aquisição ${dBR(I.dAq)}` : ""} · WACC da data do teste ${pcx(I.w)}${I.prox ? ` · próximo teste do ágio até ${dBR(I.prox)}` : ""}</p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="imp-pdf">Laudo de impairment (PDF)</button><button type="button" class="btn sm" id="imp-ppt">PowerPoint</button><button type="button" class="btn sm ghost" id="imp-xl">Exportar planilha modelo (Excel)</button>${D.ed() ? `<label class="btn sm ghost">Importar planilha revisada<input type="file" id="imp-imp" accept=".xlsx,.xlsm" hidden></label>` : ""}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="pill ${st[0]}" style="font-size:11px">${st[1]}</span><span class="pill ${indT ? "r-medio" : "r-baixo"}" style="font-size:11px">Indício: ${indT ? "sim" : "não"}</span><span class="sub" style="font-size:11.5px">fonte: ${esc(I.fonte.t)}</span></div>
      <div class="tbl"><table><tbody>
        <tr><td><b>Fluxo de caixa descontado (valor em uso)</b></td><td class="dd-num"><b>${mi(T.vu)}</b></td></tr>
        ${I.vj != null ? `<tr><td class="sub" style="font-size:11.5px">Valor justo líquido de despesas de venda (${fmt(I.multEb, 1)}× EBITDA − ${fmt(I.cv * 100, 1)}%)</td><td class="dd-num sub" style="font-size:11.5px">${mi(I.vj * I.somaPct)}</td></tr>` : ""}
        <tr><td><b>Valor recuperável (o maior)</b></td><td class="dd-num"><b>${mi(T.rec)}</b></td></tr>
        <tr><td colspan="2" style="padding-top:10px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--fog-2,#9fb3c8);font-weight:600">Carrying amount (valor contábil)</td></tr>
        ${COMP.map(([kk, l]) => { const v = I.U.reduce((a, u) => a + u.cp[kk], 0); return v ? `<tr><td>${l}${I.am[kk] ? ` <span class="sub" style="font-size:11px">· líquido de ${mi(I.am[kk])} amortizados</span>` : ""}</td><td class="dd-num">${mi(v)}</td></tr>` : ""; }).join("")}
        <tr style="border-top:1px solid var(--line-2)"><td><b>Total do carrying amount</b></td><td class="dd-num"><b>${mi(T.cont)}</b></td></tr>
        <tr style="border-top:1px solid var(--line-2)"><td><b>${T.perda > 0 ? "Impairment a reduzir (perda)" : "Valor excedente (sem impairment)"}</b></td><td class="dd-num"><b style="color:${T.perda > 0 ? "var(--bad)" : "var(--ouro,#F4C440)"}">${mi(T.perda > 0 ? T.perda : T.folga)}</b></td></tr></tbody></table></div>
      ${varias || T.perda > 0 ? `<div><b style="font-size:13px">Por unidade geradora de caixa</b><div class="tbl" style="margin-top:6px"><table><thead><tr><th>UGC</th><th class="dd-num">% receita</th><th class="dd-num">Valor em uso</th><th class="dd-num">Carrying amount</th><th class="dd-num">Excedente ou perda</th><th>Indício</th><th>Resultado</th></tr></thead><tbody>
        ${I.U.map(u => `<tr><td><b>${esc(u.nome)}</b></td><td class="dd-num">${pcx(u.pct, 0)}</td><td class="dd-num">${mi(u.vu)}</td><td class="dd-num">${mi(u.cont)}</td><td class="dd-num" style="color:${u.perda > 0 ? "var(--bad)" : "inherit"}">${mi(u.perda > 0 ? -u.perda : u.folga)}</td><td>${u.indU ? "sim" : "não"}</td><td><span class="pill ${statusU(u)[0]}" style="font-size:10.5px">${statusU(u)[1]}</span></td></tr>`).join("")}</tbody></table></div>
        ${varias && Math.abs(I.somaPct - 1) > .001 ? `<p class="sub" style="margin:4px 0 0;font-size:11.5px;color:var(--warn)">As UGCs somam ${pcx(I.somaPct, 0)} da receita: o restante do fluxo e do valor contábil fica fora do teste.</p>` : ""}</div>` : ""}
      ${T.perda > 0 ? `<div><b style="font-size:13px">Alocação da perda (item 104) e contabilização</b><div class="tbl" style="margin-top:6px"><table><tbody>
        ${["agio", "marca", "carteira", "outrosInt", "maisValia", "imob"].map(kk => { const v = I.U.reduce((a, u) => a + u.aloc[kk], 0); return v ? `<tr><td>${COMP.find(c => c[0] === kk)[1]}${kk === "agio" ? " · não reversível (item 124)" : ""}</td><td class="dd-num">${mi(v)}</td></tr>` : ""; }).join("")}</tbody></table></div>
        <p class="sub" style="margin:6px 0 0;font-size:12px"><b style="color:var(--fog)">D</b> Despesa com perda por impairment (resultado) ${mi(T.perda)} · <b style="color:var(--fog)">C</b> Perda estimada por redução ao valor recuperável (conta redutora do ativo) ${mi(T.perda)}${T.agioCtrl !== I.U.reduce((a, u) => a + u.aloc.agio, 0) ? ` · ágio da controladora ${mi(T.agioCtrl)}` : ""}. Fiscal: a perda não é dedutível no período (Lei 12.973, art. 32): adição no LALUR e na base da CSLL, dedutível na alienação ou baixa; IR e CS diferidos ativos de ${mi(T.perda * I.Z.t)} se houver expectativa de realização.</p></div>` : ""}
      ${conferencia(s, I)}
      <details id="imp-ind"${S.impInd ? " open" : ""}><summary>Indícios de desvalorização (item 12) · ${I.ind.filter(x => x.sim).length} marcado(s)</summary><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        ${I.desv != null ? `<p class="sub" style="margin:0;font-size:12px">EBITDA realizado ${mi(I.ebReal)} (${esc(I.ebFonte)}) × projetado ${mi(I.ebProj)}: <b style="color:${I.desv < -.1 ? "var(--bad)" : "var(--fog)"}">${I.desv >= 0 ? "+" : ""}${pcx(I.desv)}</b></p>` : `<p class="sub" style="margin:0;font-size:12px">Informe o EBITDA realizado (ou importe o balancete posterior à aquisição) para comparar com o projetado.</p>`}
        <div class="tbl"><table><tbody>${I.ind.map(x => `<tr><td style="width:28px"><input type="checkbox" data-iind="${x.k}" ${x.sim ? "checked" : ""} aria-label="${esc(x.t)}" ${ed}></td><td>${esc(x.t)} <span class="sub" style="font-size:11px">· ${x.tp}${x.auto ? " · apurado pelo sistema" : ""}</span><input data-iobs="${x.k}" value="${esc(x.obs)}" placeholder="observação" style="margin-top:4px;width:100%;height:30px;font-size:12px" ${ed}></td></tr>`).join("")}</tbody></table></div>
        <p class="sub" style="margin:0;font-size:11.5px">Teste anual, com ou sem indício: ágio de combinação de negócios, intangíveis de vida útil indefinida e intangíveis ainda não em uso (item 10). Demais ativos (imobilizado, intangíveis com vida definida): quando houver indício.</p></div></details>
      <details id="imp-ugc"${S.impUgc ? " open" : ""}><summary>Unidades geradoras de caixa</summary><div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
        <p class="sub" style="margin:0;font-size:12px">Sem UGC cadastrada, a UGC é a própria empresa (100% do fluxo de caixa). Com mais de uma unidade (ex.: São Paulo e Rio de Janeiro, ou uma linha de negócio), informe o % da receita de cada uma: o sistema leva esse % do fluxo de caixa e do valor contábil. O % do ágio e dos intangíveis pode ser diferente (vazio = % da receita).</p>
        ${varias ? `<div class="tbl"><table><thead><tr><th>UGC</th><th>% receita</th><th>% ágio e intangíveis</th><th>Indício</th><th></th></tr></thead><tbody>${I.U.map(u => `<tr><td><input data-un="${u.id}" value="${esc(u.nome)}" style="height:30px;font-size:12.5px;width:100%" ${ed}></td><td><input data-up="${u.id}" inputmode="decimal" value="${fmt(u.pct * 100, 1)}" style="height:30px;width:70px;text-align:right" ${ed}></td><td><input data-ua="${u.id}" inputmode="decimal" value="${u.pctAg != null ? fmt(u.pctAg * 100, 1) : ""}" placeholder="${fmt(u.pct * 100, 1)}" style="height:30px;width:70px;text-align:right" ${ed}></td><td><input type="checkbox" data-ui="${u.id}" ${u.indU ? "checked" : ""} aria-label="Indício na UGC ${esc(u.nome)}" ${ed}></td><td style="text-align:right">${ed ? "" : `<button type="button" class="btn sm ghost" data-urm="${u.id}">Remover</button>`}</td></tr>`).join("")}</tbody></table></div>` : ""}
        ${ed ? "" : `<div style="display:flex;gap:6px;flex-wrap:wrap"><span class="sub" style="font-size:12px;align-self:center">Opções prontas:</span><button type="button" class="btn sm ghost" data-uop="todo">Empresa toda (1 UGC)</button>${Object.keys(I.X.bp.lin || {}).length > 1 ? `<button type="button" class="btn sm ghost" data-uop="linhas">Uma UGC por linha de negócio (${Object.keys(I.X.bp.lin).length})</button>` : ""}<button type="button" class="btn sm ghost" data-uop="marca">Marca e demais operações</button></div>
        <div class="form"><div class="fld"><label for="iu-n">Nova UGC</label><input id="iu-n" placeholder="ex.: Unidade Rio de Janeiro"></div><div class="fld"><label for="iu-p">% da receita</label><input id="iu-p" inputmode="decimal" placeholder="40"></div></div><button type="button" class="btn sm" id="iu-add" style="align-self:flex-start">Incluir UGC</button>`}</div></details>
      <details id="imp-vu"><summary>Fluxo de caixa descontado · valor em uso</summary><div class="tbl" style="margin-top:8px"><table><thead><tr><th>Ano</th><th class="dd-num">Receita</th><th class="dd-num">EBITDA</th><th class="dd-num">CAPEX e invest.</th><th class="dd-num">FCL pós-IR</th><th class="dd-num">Valor presente</th></tr></thead><tbody>
        ${I.F.map(a => `<tr><td>${a.y}</td><td class="dd-num">${mi(a.rl)}</td><td class="dd-num">${mi(a.eb)}</td><td class="dd-num">${mi(a.capex + a.oinv)}${a.cxInf ? "" : ` <span class="sub" style="font-size:10px">reinv.</span>`}</td><td class="dd-num">${mi(a.fcl)}</td><td class="dd-num">${mi(a.fcl / Math.pow(1 + I.w, a.t - .5))}</td></tr>`).join("")}
        <tr><td>Perpetuidade</td><td colspan="3" class="sub" style="font-size:11.5px">g ${pcx(I.g)} · FCL ${mi(I.VU.fclP)}</td><td></td><td class="dd-num">${mi(I.VU.vtv)}</td></tr>
        <tr><td colspan="5"><b>Valor em uso (100% da empresa)</b></td><td class="dd-num"><b>${mi(I.VU.v)}</b></td></tr></tbody></table></div>
        <p class="sub" style="margin:6px 0 0;font-size:11.5px">Cenário moderado, sem expansões (item 44), 5 anos + perpetuidade (item 33), CAPEX do valuation (sem CAPEX informado, reinveste a depreciação). WACC pós-IR ${pcx(I.w)}; taxa antes dos impostos equivalente ${pcx(I.pre)} (item 55).</p></details>
      <details id="imp-sens"><summary>Sensibilidade e ponto de equilíbrio (item 134)</summary><div class="tbl" style="margin-top:8px"><table><thead><tr><th>Excedente · g × taxa</th>${I.grid[0].cel.map(c => `<th class="dd-num">${pcx(c.w)}</th>`).join("")}</tr></thead><tbody>${I.grid.map(l => `<tr><td>g ${pcx(l.g)}</td>${l.cel.map(c => `<td class="dd-num" style="color:${c.folga < 0 ? "var(--bad)" : "inherit"}">${mi(c.folga)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        ${I.U.map(u => `<p class="sub" style="margin:6px 0 0;font-size:12px">${esc(u.nome)}: ${u.beW != null ? `o excedente zera com WACC de ${pcx(u.beW)} (+${fmt((u.beW - I.w) * 100, 1)} p.p.)` : u.perda > 0 ? "já há perda no WACC atual" : "o excedente não zera com taxas até 60%"}${u.beM != null ? ` ou com EBITDA ${pcx(u.beM)} abaixo do projetado em todos os anos` : ""}.</p>`).join("")}</details>
      <details id="imp-prem"${S.impPrem ? " open" : ""}><summary>Premissas do teste</summary><form id="fimp" style="display:flex;flex-direction:column;gap:8px;margin-top:8px" novalidate><div class="form">
        <div class="fld"><label for="im-dt">Data-base do teste</label><input id="im-dt" type="date" value="${esc(q.data || "")}" ${ed}></div><div class="fld"><label for="im-da">Data da aquisição</label><input id="im-da" type="date" value="${esc(q.dataAq || I.Z.q.data || "")}" ${ed}></div>
        ${inp("im-w", "WACC pós-IR na data do teste (%)", q.taxa, fmt(I.X.W.wacc * 100, 2))}${inp("im-wa", "WACC da aquisição (%)", q.waccAq, "para o indício de juros")}${inp("im-g", "Crescimento na perpetuidade (%)", q.g, fmt((I.R.mod || V.resumo(s).mod).c.g * 100, 2))}
        ${inp("im-m", "Múltiplo EV/EBITDA do valor justo (×)", q.mult, I.C?.eb ? fmt(I.multEb, 1) : "sem comparáveis")}${inp("im-cv", "Despesas de venda (% do valor justo)", q.custoVenda, "2")}
        ${inp("im-eb", "EBITDA realizado no último exercício (R$ mi)", q.ebReal, I.ebReal != null && q.ebReal == null ? fmt(I.ebReal / 1e6, 1) : "")}
        ${COMP.map(([kk, l]) => inp("ic-" + kk, `${l} (R$ mi)`, q.comp?.[kk], fmt((kk === "agio" ? I.agio0 : I.comp[kk]) / 1e6, 1) + (kk === "agio" ? " da controladora" : ""))).join("")}</div>
        <label style="display:flex;gap:8px;align-items:center;font-size:12.5px"><input type="checkbox" id="im-at" ${q.agioTotal ? "checked" : ""} ${ed}> Ágio já reconhecido a 100% (não controladores pelo valor justo)</label>
        ${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar premissas</button>` : ""}<p class="sub" style="margin:0;font-size:11.5px">Campos vazios usam o workbook, o PPA e o valuation, nessa ordem. Valores em R$ milhões. O CAPEX vem do valuation (aba FCD, quadro Investimentos).</p></form></details></div>`;
  }
  function bind(host, s){
    const up = p => D.up(s, {pos:{imp:p}});
    $$("[data-iind]", host).forEach(c => c.onchange = () => up({ind:{[c.dataset.iind]:{sim:c.checked}}}));
    $$("[data-iobs]", host).forEach(c => c.onchange = () => up({ind:{[c.dataset.iobs]:{obs:c.value.trim()}}}));
    [["imp-prem", "impPrem"], ["imp-ind", "impInd"], ["imp-ugc", "impUgc"]].forEach(([id, k]) => { const d = $("#" + id, host); if (d) d.ontoggle = () => { S[k] = d.open; }; });
    $$("[data-un]", host).forEach(i => i.onchange = () => up({ugcs:{[i.dataset.un]:{nome:i.value.trim() || "UGC"}}}));
    $$("[data-up]", host).forEach(i => i.onchange = () => up({ugcs:{[i.dataset.up]:{pct:nn(i.value) ?? 0}}}));
    $$("[data-ua]", host).forEach(i => i.onchange = () => up({ugcs:{[i.dataset.ua]:{pctAgio:i.value.trim() === "" ? null : nn(i.value)}}}));
    $$("[data-ui]", host).forEach(i => i.onchange = () => up({ugcs:{[i.dataset.ui]:{ind:i.checked}}}));
    $$("[data-urm]", host).forEach(b => b.onclick = () => up({ugcs:{[b.dataset.urm]:null}}));
    $$("[data-uop]", host).forEach(b => b.onclick = () => { const I = calc(s); if (!I) return; S.impUgc = true; const nulo = {}; Object.keys(I.q.ugcs || {}).forEach(k => { nulo[k] = null; });
      const t = Date.now().toString(36), op = b.dataset.uop, lin = I.X.bp.lin || {}, tot = Object.values(lin).reduce((a, x) => a + (x || 0), 0);
      const novo = op === "todo" ? {} : op === "linhas" ? Object.fromEntries(Object.entries(lin).map(([l, v], i) => [`l${i}${t}`, {nome:l, pct:tot ? Math.round(v / tot * 1000) / 10 : 0}])) : {["m" + t]:{nome:"Marca e operações que a usam", pct:100, pctAgio:100}};
      up({ugcs:{...nulo, ...novo}}).then(() => toast(op === "todo" ? "UGC: empresa toda" : "UGCs criadas: revise os %")); });
    const ad = $("#iu-add", host); if (ad) ad.onclick = () => { const nm = $("#iu-n").value.trim(), p = nn($("#iu-p").value); if (!nm || p == null){ toast("Informe o nome da UGC e o % da receita"); return; }
      S.impUgc = true; const atual = calc(s), novo = {["u" + Date.now().toString(36)]:{nome:nm, pct:p}};
      /* a primeira UGC nova divide a empresa: o restante fica numa UGC "Demais operações" */
      if (atual?.U[0]?.unica && p < 100) novo["u0" + Date.now().toString(36)] = {nome:"Demais operações", pct:100 - p};
      up({ugcs:novo}).then(() => toast("UGC incluída")); };
    const f = $("#fimp", host); if (f) f.onsubmit = e => { e.preventDefault(); const g = id => nn($(id).value), comp = {}; COMP.forEach(([kk]) => { comp[kk] = g("#ic-" + kk); });
      up({data:$("#im-dt").value || null, dataAq:$("#im-da").value || null, taxa:g("#im-w"), waccAq:g("#im-wa"), g:g("#im-g"), mult:g("#im-m"), custoVenda:g("#im-cv"), ebReal:g("#im-eb"), comp, agioTotal:$("#im-at").checked}).then(() => toast("Premissas do impairment salvas")); };
    const run = (id, fn) => { const b = $("#" + id, host); if (b) b.onclick = async () => { const t0 = b.textContent; b.disabled = true; b.textContent = "Gerando…"; try{ await fn(s); }catch(e){ console.error(e); toast("Não foi possível gerar o arquivo."); } b.disabled = false; b.textContent = t0; }; };
    run("imp-pdf", pdf); run("imp-ppt", ppt); run("imp-xl", xlsx);
    const fi = $("#imp-imp", host); if (fi) fi.onchange = async () => { const fl = fi.files[0]; if (!fl) return; try{ const r = await importar(s, fl); toast(`Planilha revisada importada: ${r.lidos.join(", ")}`); }catch(e){ console.error(e); toast(e.message || "Não foi possível ler a planilha."); } fi.value = ""; };
    const vf = $("#imp-volta", host); if (vf) vf.onclick = () => up({fluxo:null}).then(() => toast("Fluxo do sistema restaurado"));
  }
  const conclusao = I => I.T.perda > 0 ? `O carrying amount (${mi(I.T.cont)}) supera o valor recuperável (${mi(I.T.rec)}). Há perda por impairment de ${mi(I.T.perda)}, alocada primeiro ao ágio e depois, pro rata, aos demais ativos da UGC; a perda do ágio não é revertida.` : `O valor recuperável (${mi(I.T.rec)}) supera o carrying amount (${mi(I.T.cont)}) em ${mi(I.T.folga)}: não há perda por impairment a reconhecer.`;
  async function pdf(s){
    const I = calc(s), R = KT_REL, P = KTPdf(); let n = 0; const sec = t => R.sec(P, ++n, t), T = I.T;
    R.capa(P, "Laudo de impairment · CPC 01 (R1)", s.nome, [["Unidade(s) geradora(s) de caixa", I.U.map(u => u.nome).join(", ")], ["Data-base do teste", dBR(I.dT)], ["Aquisição", I.dAq ? dBR(I.dAq) : "—"], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    sec("Conclusão");
    R.kpisPdf(P, [["Valor em uso (FCD)", mi(T.vu), `WACC ${pcx(I.w)}`], ["Carrying amount", mi(T.cont), "valor contábil"], [T.perda > 0 ? "Impairment a reduzir" : "Valor excedente", mi(T.perda > 0 ? T.perda : T.folga), T.perda > 0 ? "perda no resultado" : "sem impairment"], ["Indício de impairment", I.indEmp || I.U.some(u => u.indU) ? "Sim" : "Não", "item 12"]]);
    R.par(P, conclusao(I)); R.par(P, `Fonte das informações: ${I.fonte.t}.`, {size:8.5});
    if (window.KT_CNPJ?.ficha){ sec("Identificação da empresa"); R.tab(P, ["Campo", "Informação"], KT_CNPJ.ficha(s).filter(([k]) => !["Fonte do cadastro"].includes(k)), [.3, .7]); }
    sec("Objetivo e critérios");
    R.par(P, "O CPC 01 (R1), equivalente à IAS 36, assegura que os ativos não fiquem registrados por valor superior ao recuperável. O valor recuperável é o maior entre o valor justo líquido de despesas de venda e o valor em uso. Se o valor contábil for menor ou igual ao recuperável, nenhuma ação é necessária; se for maior, reconhece-se a perda e reduz-se o valor contábil até o recuperável.");
    R.par(P, "O teste é anual, com ou sem indício, para o ágio de combinação de negócios, os intangíveis de vida útil indefinida e os intangíveis ainda não em uso; para os demais ativos (imobilizado, CPC 27, e intangíveis com vida definida), sempre que houver indício interno ou externo de desvalorização.");
    sec("Carrying amount");
    R.tab(P, ["Componente", "R$"], [...COMP.map(([kk, l]) => [l + (I.am[kk] ? ` (líquido de ${mi(I.am[kk])} amortizados)` : ""), mi(I.U.reduce((a, u) => a + u.cp[kk], 0))]), ["Total do carrying amount", mi(T.cont)]], [.72, .28]);
    sec("Valor em uso · fluxo de caixa descontado");
    R.tab(P, ["Ano", "Receita", "EBITDA", "CAPEX e invest.", "FCL pós-IR", "Valor presente"], [...I.F.map(a => [String(a.y), mi(a.rl), mi(a.eb), mi(a.capex + a.oinv), mi(a.fcl), mi(a.fcl / Math.pow(1 + I.w, a.t - .5))]), ["Perpetuidade", "", "", "", mi(I.VU.fclP), mi(I.VU.vtv)], ["Valor em uso (100%)", "", "", "", "", mi(I.VU.v)]], [.16, .16, .16, .17, .17, .18]);
    R.par(P, `Cenário moderado, sem expansões, 5 anos + perpetuidade a ${pcx(I.g)}. WACC pós-IR na data do teste ${pcx(I.w)}; taxa antes dos impostos equivalente ${pcx(I.pre)} (item 55). CAPEX conforme o valuation; sem CAPEX informado, reinveste a depreciação.`, {size:8.5});
    R.par(P, I.vj != null ? `Valor justo líquido de despesas de venda: EBITDA ${mi(I.X.bp.eb)} × ${fmt(I.multEb, 1)}× = ${mi(I.vjBruto)}, menos despesas de venda de ${fmt(I.cv * 100, 1)}% = ${mi(I.vj)} (100%).` : "Sem comparáveis de mercado: o valor recuperável é o valor em uso.", {size:8.5});
    sec("Teste por unidade geradora de caixa");
    R.tab(P, ["UGC", "% receita", "Valor recuperável", "Carrying amount", "Excedente / perda", "Indício"], I.U.map(u => [u.nome, pcx(u.pct, 0), mi(u.rec), mi(u.cont), mi(u.perda > 0 ? -u.perda : u.folga), u.indU ? "Sim" : "Não"]), [.26, .1, .17, .17, .18, .12]);
    if (T.perda > 0){ sec("Alocação da perda e contabilização");
      R.tab(P, ["Ativo", "Perda"], ["agio", "marca", "carteira", "outrosInt", "maisValia", "imob"].map(kk => [COMP.find(c => c[0] === kk)[1], mi(I.U.reduce((a, u) => a + u.aloc[kk], 0))]).filter(r => r[1] !== mi(0)), [.7, .3]);
      R.par(P, `Débito: despesa com perda por impairment (resultado) ${mi(T.perda)}. Crédito: perda estimada por redução ao valor recuperável, conta redutora do ativo, ${mi(T.perda)}. A perda do ágio não é revertida (item 124). Fiscal (Lei 12.973, art. 32): perda não dedutível no período, adicionada no LALUR e na base da CSLL e dedutível na alienação ou baixa do ativo; IR e CS diferidos ativos de ${mi(T.perda * I.Z.t)} se houver expectativa de realização.`); }
    sec("Indícios de desvalorização (item 12)");
    R.tab(P, ["Indício", "Origem", "Situação", "Observação"], I.ind.map(x => [x.t, x.tp, x.sim ? "Sim" : "Não", x.obs || (x.k === "desemp" && I.desv != null ? `EBITDA realizado ${mi(I.ebReal)} × projetado ${mi(I.ebProj)} (${pcx(I.desv)})` : "")]), [.44, .1, .1, .36]);
    sec("Sensibilidade (item 134)");
    R.tab(P, ["g × WACC", ...I.grid[0].cel.map(c => pcx(c.w))], I.grid.map(l => [`g ${pcx(l.g)}`, ...l.cel.map(c => mi(c.folga))]), [.2, .2, .2, .2, .2]);
    I.U.forEach(u => R.par(P, `${u.nome}: ${u.beW != null ? `o excedente zera com WACC de ${pcx(u.beW)}` : u.perda > 0 ? "já há perda no WACC atual" : "o excedente não zera com taxas até 60%"}${u.beM != null ? ` ou com EBITDA ${pcx(u.beM)} abaixo do projetado` : ""}.`, {size:8.5}));
    R.par(P, "Laudo preparado pelo KinseyTec com base no workbook da Due Diligence, no PPA e no valuation; sujeito à revisão do consultor e do auditor independente.", {size:8.5, color:[90,101,120]});
    await rptSave(P.out(`Impairment · ${s.nome}`, R.T(`Kinsey Capital · Laudo de impairment CPC 01 · ${s.nome} · confidencial`)), R.arq(s, "laudo_impairment_CPC01", "pdf"), "application/pdf");
  }
  async function ppt(s){
    const I = calc(s), T = I.T, R = KT_REL, Tt = R.T, slides = [], nome = s.nome;
    const frame = t => [{x:0, y:0, w:13.333, h:.12, f:"0473C3"}, {x:.6, y:.35, w:12, h:.7, p:[{t:Tt(t), s:26, b:true, c:"011F4B"}]}, {x:.6, y:7.0, w:10, h:.35, p:[{t:Tt(`Kinsey Capital · Impairment CPC 01 · ${nome} · Confidencial`), s:9, c:"5A6578"}]}];
    const linhas = (sh, L, y = 1.4, sz = 15) => sh.push({x:.6, y, w:12.1, h:5.4, p:L.slice(0, 11).map(t => ({t:Tt(t), s:sz, c:"1B2433", sb:240}))});
    const kp = (sh, L) => L.forEach(([l, v], i) => sh.push({x:.6 + i * 3.08, y:1.4, w:2.9, h:1.3, f:"EEF3F9", p:[{t:Tt(l), s:11, c:"5A6578"}, {t:Tt(v), s:20, b:true, c:i === 2 && T.perda > 0 ? "C62828" : "011F4B", sb:200}]}));
    slides.push({bg:"011F4B", sh:[{x:.8, y:1.2, w:11, h:.5, p:[{t:"LAUDO DE IMPAIRMENT · CPC 01 (R1)", s:16, b:true, c:"7FB8E6"}]}, {x:.8, y:1.9, w:11.5, h:1.4, p:[{t:Tt(nome), s:40, b:true, c:"FFFFFF"}]}, {x:.8, y:3.6, w:11, h:.5, p:[{t:Tt(`Data-base ${dBR(I.dT)} · ${I.U.map(u => u.nome).join(", ")}`), s:16, c:"C9D6E8"}]}]});
    let sh = frame("Conclusão"); kp(sh, [["Valor em uso (FCD)", mi(T.vu)], ["Carrying amount", mi(T.cont)], [T.perda > 0 ? "Impairment a reduzir" : "Valor excedente", mi(T.perda > 0 ? T.perda : T.folga)], ["Indício de impairment", I.indEmp || I.U.some(u => u.indU) ? "Sim" : "Não"]]);
    linhas(sh, [conclusao(I), `Fonte: ${I.fonte.t}.`, `WACC pós-IR ${pcx(I.w)} · antes dos impostos ${pcx(I.pre)} · perpetuidade ${pcx(I.g)}.`], 3.0, 14); slides.push({sh});
    sh = frame("Carrying amount"); linhas(sh, [...COMP.map(([kk, l]) => `${l}: ${mi(I.U.reduce((a, u) => a + u.cp[kk], 0))}`), `Total: ${mi(T.cont)}`]); slides.push({sh});
    sh = frame("Fluxo de caixa descontado · valor em uso"); linhas(sh, [...I.F.map(a => `${a.y}: receita ${mi(a.rl)} · EBITDA ${mi(a.eb)} · CAPEX ${mi(a.capex + a.oinv)} · FCL ${mi(a.fcl)}`), `Perpetuidade: ${mi(I.VU.vtv)} (valor presente)`, `Valor em uso (100%): ${mi(I.VU.v)}`], 1.4, 14); slides.push({sh});
    sh = frame("Teste por unidade geradora de caixa"); linhas(sh, I.U.map(u => `${u.nome} (${pcx(u.pct, 0)} da receita): recuperável ${mi(u.rec)} × carrying ${mi(u.cont)} → ${u.perda > 0 ? `impairment de ${mi(u.perda)}` : `excedente de ${mi(u.folga)}`} · indício: ${u.indU ? "sim" : "não"}`)); slides.push({sh});
    if (T.perda > 0){ sh = frame("Alocação da perda e contabilização"); linhas(sh, [...["agio", "marca", "carteira", "outrosInt", "maisValia", "imob"].map(kk => [COMP.find(c => c[0] === kk)[1], I.U.reduce((a, u) => a + u.aloc[kk], 0)]).filter(x => x[1]).map(([l, v]) => `${l}: ${mi(v)}`), `D Despesa com perda por impairment (DRE) ${mi(T.perda)} · C Conta redutora do ativo (BP) ${mi(T.perda)}`, "Perda do ágio não reversível; fiscalmente não dedutível no período (Lei 12.973, art. 32)."]); slides.push({sh}); }
    sh = frame("Indícios e sensibilidade"); linhas(sh, [...I.ind.filter(x => x.sim).map(x => "Indício: " + x.t), ...(I.ind.some(x => x.sim) ? [] : ["Nenhum indício marcado; o ágio é testado anualmente (item 90)."]), ...I.U.map(u => `${u.nome}: ${u.beW != null ? `excedente zera com WACC de ${pcx(u.beW)}` : u.perda > 0 ? "já há perda no WACC atual" : "excedente não zera com taxas até 60%"}${u.beM != null ? ` ou EBITDA ${pcx(u.beM)} abaixo do projetado` : ""}`)], 1.4, 14); slides.push({sh});
    await rptSave(ktPptx(slides, `Impairment · ${nome}`), R.arq(s, "laudo_impairment_CPC01", "pptx"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  }
  /* ---------------- planilha modelo (padrão Kinsey BR, como a do PPA · CPC 15) ---------------- */
  const colL = i => { let t = ""; i++; while (i){ const m = (i - 1) % 26; t = String.fromCharCode(65 + m) + t; i = Math.floor((i - 1) / 26); } return t; };
  function Folha(nome, larguras){ const f = {nome, linhas:[], idx:{}, larguras, congela:[4, 1]};
    f.add = (cells, key) => { f.linhas.push(cells); const r = f.linhas.length; if (key) f.idx[key] = r; return r; };
    f.r = k => f.idx[k]; f.x = (k, c, abs) => `'${nome}'!${abs ? "$" : ""}${c}${abs ? "$" : ""}${f.idx[k]}`; return f; }
  const Ti = v => ({v, s:"t"}), He = v => ({v, s:"h"}), In = v => ({v:v == null || !isFinite(v) ? 0 : Math.round(v * 100) / 100, s:"i"}), IP = v => ({v:v == null || !isFinite(v) ? 0 : +(+v).toFixed(6), s:"ip"}), IT = v => ({v:String(v ?? ""), s:"it"});
  const Fo = (f, v, st) => ({f, v:v != null && isFinite(v) ? v : undefined, s:st || "n"}), FoP = (f, v) => Fo(f, v, "fp"), Gt = (f, v) => Fo(f, v, "g");
  const ROT = {dataT:"Data-base do teste (aaaa-mm-dd)", dataAq:"Data da aquisição (aaaa-mm-dd)", wacc:"WACC pós-IR na data do teste", waccAq:"WACC na data da aquisição", g:"Crescimento na perpetuidade (nominal)", ir:"Alíquota de IR e CS",
    mult:"Múltiplo EV/EBITDA para o valor justo (×)", cv:"Despesas de venda (% do valor justo)", eb:"EBITDA base (valor justo)", pct:"Participação adquirida", agioT:"Ágio já reconhecido a 100%? (Sim/Não)"};
  const FL = {rl:"Receita líquida", eb:"EBITDA", ir:"(−) IR e CS sobre o lucro operacional", capex:"(−) CAPEX", oinv:"(−) Outros investimentos", dncg:"(−) Variação do capital de giro"};
  function modelo(s){
    const I = calc(s); if (!I) throw new Error("Sem balancetes para montar a planilha."); const q = I.q, nome = s.mandato?.codinome || s.nome, rf = s.receita && !s.receita.erro ? s.receita : {};
    const cab = (f, t) => { f.add([Ti(`${t} · ${nome}`)]); f.add([`Planilha padronizada Kinsey BR · CPC 01 (R1) · células em azul são entradas do consultor; as demais são fórmulas · valores em R$ · fonte: ${I.fonte.t}`]); f.add([]); };
    /* Premissas */
    const Pm = Folha("Premissas", [52, 20, 50]); cab(Pm, "Premissas do teste de impairment"); Pm.add([He("Premissa"), He("Valor"), He("Fonte")]);
    Pm.add(["Empresa", IT(s.nome), "cadastro inicial"]); (window.KT_CNPJ?.ficha ? KT_CNPJ.ficha(s).filter(([k]) => ["Razão social", "CNPJ", "Endereço", "Atividade principal (CNAE)", "Sócios", "Capital social"].includes(k)) : [["CNPJ", s.doc || ""], ["Razão social", rf.razao || s.nome]]).forEach(([k, v]) => Pm.add([k, IT(v), "cadastro inicial"])); Pm.add(["Segmento", IT(s.perfil?.segmento || s.segmento || ""), "cadastro"]);
    Pm.add([ROT.dataT, IT(I.dT), "consultor"], "dataT"); Pm.add([ROT.dataAq, IT(I.dAq || ""), "PPA / SPA"], "dataAq");
    Pm.add([ROT.wacc, IP(I.w), q.taxa != null ? "informado" : "WACC do sistema (CAPM) na data do teste"], "wacc"); Pm.add([ROT.waccAq, IP(I.wAq ?? 0), "para o indício de alta de juros"], "waccAq");
    Pm.add([ROT.g, IP(I.g), "PIB do setor + inflação (base de valuation)"], "g"); Pm.add([ROT.ir, IP(I.X.W.t), "regime tributário"], "ir");
    Pm.add([ROT.mult, In(I.multEb || 0), I.C?.eb ? `comparáveis de mercado (${I.C.eb.n} cias.) com desconto de liquidez` : "sem comparáveis: informe"], "mult"); Pm.add([ROT.cv, IP(I.cv), "padrão 2%"], "cv");
    Pm.add([ROT.eb, In(I.X.bp.eb), `balancete de ${I.X.perBase}${I.fonte.k === "wb" ? " (workbook da DD)" : ""}`], "eb"); Pm.add([ROT.pct, IP(I.Z.pct), "mandato / SPA"], "pct"); Pm.add([ROT.agioT, IT(q.agioTotal ? "Sim" : "Não"), "item C4 do CPC 01"], "agioT");
    /* Fluxo de caixa */
    const Fc = Folha("Fluxo de caixa", [46, 16, 16, 16, 16, 16, 16]); cab(Fc, "Valor em uso · fluxo de caixa descontado"); const C5 = [1, 2, 3, 4, 5].map(i => colL(i));
    Fc.add([He("Item"), ...I.F.map(a => He(String(a.y)))], "ano");
    Object.entries(FL).forEach(([k, l]) => Fc.add([l, ...I.F.map(a => In(k === "oinv" ? a.oinv || 0 : a[k]))], k));
    Fc.add([{v:"Fluxo de caixa livre (pós-IR)", s:"b"}, ...I.F.map((a, i) => Gt(`${C5[i]}${Fc.r("eb")}-${C5[i]}${Fc.r("ir")}-${C5[i]}${Fc.r("capex")}-${C5[i]}${Fc.r("oinv")}-${C5[i]}${Fc.r("dncg")}`, a.fcl))], "fcl");
    Fc.add(["Período (meio do ano)", ...I.F.map((a, i) => Fo(`${i}+0.5`, i + .5, "d"))], "t");
    Fc.add(["Fator de desconto", ...I.F.map((a, i) => Fo(`1/(1+${Pm.x("wacc", "B", 1)})^${C5[i]}${Fc.r("t")}`, 1 / Math.pow(1 + I.w, i + .5), "d"))], "fd");
    Fc.add(["Valor presente", ...I.F.map((a, i) => Fo(`${C5[i]}${Fc.r("fcl")}*${C5[i]}${Fc.r("fd")}`, a.fcl / Math.pow(1 + I.w, i + .5)))], "vp"); Fc.add([]);
    Fc.add(["FCL da perpetuidade (ano 6)", In(I.VU.fclP)], "fclP");
    Fc.add(["Valor terminal (Gordon)", Fo(`IFERROR(B${Fc.r("fclP")}/(${Pm.x("wacc", "B", 1)}-${Pm.x("g", "B", 1)}),0)`, I.VU.vtv * Math.pow(1 + I.w, 4.5))], "tv");
    Fc.add(["Valor presente da perpetuidade", Fo(`B${Fc.r("tv")}/(1+${Pm.x("wacc", "B", 1)})^4.5`, I.VU.vtv)], "vtv");
    Fc.add(["Soma do valor presente dos 5 anos", Fo(`SUM(B${Fc.r("vp")}:F${Fc.r("vp")})`, I.VU.vp)], "svp");
    Fc.add([{v:"Valor em uso (100% da empresa)", s:"b"}, Gt(`B${Fc.r("svp")}+B${Fc.r("vtv")}`, I.VU.v)], "vu");
    Fc.add(["Perpetuidade / valor em uso", FoP(`IFERROR(B${Fc.r("vtv")}/B${Fc.r("vu")},0)`, I.VU.vtv / I.VU.v)], "pp");
    Fc.add([{v:"Valor justo líquido de despesas de venda (100%)", s:"b"}, Gt(`${Pm.x("eb", "B", 1)}*${Pm.x("mult", "B", 1)}*(1-${Pm.x("cv", "B", 1)})`, I.vj ?? 0)], "vj");
    Fc.add(["Valor em uso calculado pelo sistema (conferência)", In(I.VUs.v)], "vus");
    /* Carrying amount */
    const Ca = Folha("Carrying amount", [60, 20, 44]); cab(Ca, "Carrying amount · valor contábil (100%)"); Ca.add([He("Componente"), He("R$"), He("Origem")]);
    const ORIG = {marca:`PPA, líquido de ${mi(I.am.marca)} amortizados`, carteira:`PPA, líquido de ${mi(I.am.carteira)} amortizados`, outrosInt:`PPA, líquido de ${mi(I.am.outrosInt)} amortizados`, maisValia:"PPA (imobilizado e imóveis)", imob:`balancete de ${I.X.perBase}`, giro:"PPA / balancete", agio:"PPA · ágio da controladora"};
    COMP.forEach(([k, l]) => Ca.add([l, In(k === "agio" ? I.agio0 : I.comp[k]), ORIG[k]], k));
    Ca.add(["Ágio ajustado a 100% da UGC (item C4)", Fo(`IF(${Pm.x("agioT", "B", 1)}="Sim",B${Ca.r("agio")},IFERROR(B${Ca.r("agio")}/${Pm.x("pct", "B", 1)},B${Ca.r("agio")}))`, I.comp.agio), "fórmula"], "agio100");
    Ca.add([{v:"Intangíveis e ágio (seguem o % do ágio da UGC)", s:"b"}, Gt(`B${Ca.r("marca")}+B${Ca.r("carteira")}+B${Ca.r("outrosInt")}+B${Ca.r("agio100")}`, I.comp.marca + I.comp.carteira + I.comp.outrosInt + I.comp.agio)], "intg");
    Ca.add([{v:"Ativos operacionais (seguem o % da receita)", s:"b"}, Gt(`B${Ca.r("maisValia")}+B${Ca.r("imob")}+B${Ca.r("giro")}`, I.comp.maisValia + I.comp.imob + I.comp.giro)], "oper");
    Ca.add([{v:"Total do carrying amount (100%)", s:"b"}, Gt(`B${Ca.r("intg")}+B${Ca.r("oper")}`, I.cont / (I.somaPct || 1))], "tot");
    /* UGCs: opções prontas; o consultor marca Sim nas que são UGC */
    const Ug = Folha("UGCs", [44, 18, 16, 22, 16, 50]); cab(Ug, "Unidades geradoras de caixa · marque Sim nas que são UGC"); Ug.add([He("Unidade"), He("É UGC? (Sim/Não)"), He("% da receita"), He("% do ágio e intangíveis (vazio = % receita)"), He("Indício? (Sim/Não)"), He("Observação")], "h");
    const lin = I.X.bp.lin || {}, totL = Object.values(lin).reduce((a, x) => a + (x || 0), 0), op = [];
    I.U.forEach(u => op.push([u.nome, "Sim", u.pct, u.pctAg, u.indU ? "Sim" : "Não", u.obs || (u.unica ? "UGC atual: a empresa toda" : "UGC atual")]));
    if (!I.U[0].unica) op.push(["Empresa toda", "Não", 1, null, "Não", "opção: uma UGC só"]);
    if (Object.keys(lin).length > 1) Object.entries(lin).forEach(([l, v]) => { if (!I.U.some(u => u.nome === l)) op.push([l, "Não", totL ? v / totL : 0, null, "Não", "opção: linha de negócio (participação na receita do balancete)"]); });
    op.push(["Marca e operações que a usam", "Não", 1, 1, "Não", "opção: teste da marca com o fluxo que ela gera"]); op.push(["Filial ou unidade (renomeie)", "Não", 0, null, "Não", "opção: informe o % da receita"]);
    const u0 = Ug.linhas.length + 1; op.forEach(o => Ug.add([IT(o[0]), IT(o[1]), IP(o[2]), o[3] == null ? IT("") : IP(o[3]), IT(o[4]), IT(o[5])])); for (let k = 0; k < 3; k++) Ug.add([IT(""), IT("Não"), IP(0), IT(""), IT("Não"), IT("")]); const u1 = Ug.linhas.length;
    Ug.add([]); Ug.add([{v:"Soma do % da receita das UGCs marcadas", s:"b"}, "", FoP(`SUMIF(B${u0}:B${u1},"Sim",C${u0}:C${u1})`, I.somaPct)], "soma");
    /* Teste por UGC */
    const Te = Folha("Teste por UGC", [36, 10, 12, 12, 17, 17, 17, 17, 17, 12, 16, 16, 16]); cab(Te, "Teste por unidade geradora de caixa");
    Te.add([He("UGC"), He("É UGC?"), He("% receita"), He("% ágio"), He("Valor em uso"), He("Valor justo líquido"), He("Valor recuperável"), He("Carrying amount"), He("Excedente (−) perda"), He("Impairment?"), He("Perda"), He("Perda no ágio"), He("Perda nos demais")], "h");
    const t0 = Te.linhas.length + 1;
    for (let r = u0; r <= u1; r++){ const n = Te.linhas.length + 1, U = `'UGCs'!`, o = op[r - u0], sim = o?.[1] === "Sim", pr = sim ? o[2] : 0, pa = sim ? (o[3] ?? o[2]) : 0, uu = sim ? I.U.find(x => x.nome === o[0]) : null;
      Te.add([Fo(`${U}A${r}`, undefined, "t"), Fo(`${U}B${r}`, undefined, "t"), FoP(`IF(B${n}="Sim",${U}C${r},0)`, pr), FoP(`IF(B${n}="Sim",IF(${U}D${r}="",${U}C${r},${U}D${r}),0)`, pa),
        Fo(`${Fc.x("vu", "B", 1)}*C${n}`, uu?.vu ?? 0), Fo(`${Fc.x("vj", "B", 1)}*C${n}`, uu?.vj ?? 0), Fo(`MAX(E${n},F${n})`, uu?.rec ?? 0), Fo(`${Ca.x("intg", "B", 1)}*D${n}+${Ca.x("oper", "B", 1)}*C${n}`, uu?.cont ?? 0),
        Fo(`G${n}-H${n}`, uu ? uu.rec - uu.cont : 0), Fo(`IF(B${n}<>"Sim","",IF(I${n}<0,"Sim","Não"))`, undefined, "t"), Fo(`IF(B${n}="Sim",MAX(0,-I${n}),0)`, uu?.perda ?? 0),
        Fo(`MIN(K${n},${Ca.x("agio100", "B", 1)}*D${n})`, uu?.aloc.agio ?? 0), Fo(`K${n}-L${n}`, uu ? uu.perda - uu.aloc.agio : 0)]); }
    const t1 = Te.linhas.length, sm = c => `SUM(${c}${t0}:${c}${t1})`;
    Te.add([{v:"Total", s:"b"}, "", FoP(sm("C"), I.somaPct), "", Gt(sm("E"), I.T.vu), Gt(sm("F"), (I.vj ?? 0) * I.somaPct), Gt(sm("G"), I.T.rec), Gt(sm("H"), I.T.cont), Gt(sm("I"), I.T.rec - I.T.cont), "", Gt(sm("K"), I.T.perda), Gt(sm("L"), I.U.reduce((a, u) => a + u.aloc.agio, 0)), Gt(sm("M"), I.U.reduce((a, u) => a + u.perda - u.aloc.agio, 0))], "tot");
    Te.congela = [5, 1];
    /* Indícios */
    const In_ = Folha("Indícios", [80, 12, 18, 50]); cab(In_, "Indícios de desvalorização (item 12)"); In_.add([He("Indício"), He("Origem"), He("Situação (Sim/Não)"), He("Observação")]);
    const i0 = In_.linhas.length + 1; I.ind.forEach(x => In_.add([x.t, x.tp, IT(x.sim ? "Sim" : "Não"), IT(x.obs || (x.k === "desemp" && I.desv != null ? `EBITDA realizado ${mi(I.ebReal)} × projetado ${mi(I.ebProj)} (${pcx(I.desv)})` : ""))])); const i1 = In_.linhas.length;
    /* Resumo */
    const Rs = Folha("Resumo", [60, 20, 40]); cab(Rs, "Resumo do teste de impairment"); Rs.add([He("Item"), He("R$"), He("Observação")]);
    Rs.add(["Fluxo de caixa descontado · valor em uso (UGCs)", Fo(Te.x("tot", "E"), I.T.vu), "Fluxo de caixa"], "vu");
    Rs.add(["Valor justo líquido de despesas de venda (UGCs)", Fo(Te.x("tot", "F"), (I.vj ?? 0) * I.somaPct), "múltiplos de mercado"], "vj");
    Rs.add(["Valor recuperável (o maior, por UGC)", Fo(Te.x("tot", "G"), I.T.rec), ""], "rec");
    Rs.add(["Carrying amount (UGCs)", Fo(Te.x("tot", "H"), I.T.cont), "Carrying amount"], "cont");
    Rs.add([{v:"Valor excedente", s:"b"}, Gt(`SUMIF('Teste por UGC'!I${t0}:I${t1},">0")`, I.T.folga), "sem impairment"], "exc");
    Rs.add([{v:"Impairment a reduzir", s:"b"}, Gt(Te.x("tot", "K"), I.T.perda), "débito na DRE, crédito na conta redutora do ativo"], "perda");
    Rs.add(["Impairment? (Sim/Não)", Fo(`IF(B${Rs.r("perda")}>0,"Sim","Não")`, undefined, "t")], "imp");
    Rs.add(["Indício de impairment? (Sim/Não)", Fo(`IF(COUNTIF('Indícios'!C${i0}:C${i1},"Sim")+COUNTIFS('UGCs'!B${u0}:B${u1},"Sim",'UGCs'!E${u0}:E${u1},"Sim")>0,"Sim","Não")`, undefined, "t")], "ind");
    Rs.add([]); Rs.add([He("Alocação da perda (item 104)"), He("R$"), He("")]);
    Rs.add(["Ágio (não reversível)", Fo(Te.x("tot", "L"))], "aAg");
    [["marca", "Marca"], ["carteira", "Relacionamento com clientes"], ["outrosInt", "Outros intangíveis"], ["maisValia", "Mais-valia de ativos"], ["imob", "Imobilizado"]].forEach(([k, l]) => Rs.add([l + " (pro rata)", Fo(`IFERROR(${Te.x("tot", "M")}*${Ca.x(k, "B", 1)}/(${Ca.x("marca", "B", 1)}+${Ca.x("carteira", "B", 1)}+${Ca.x("outrosInt", "B", 1)}+${Ca.x("maisValia", "B", 1)}+${Ca.x("imob", "B", 1)}),0)`)]));
    Rs.add(["IR e CS diferidos ativos sobre a perda (se houver expectativa de realização)", Fo(`B${Rs.r("perda")}*${Pm.x("ir", "B", 1)}`, I.T.perda * I.X.W.t), "Lei 12.973, art. 32: perda indedutível até a baixa"]);
    /* Sensibilidade (sistema) e conferências */
    const Se = Folha("Sensibilidade", [22, 16, 16, 16, 16]); cab(Se, "Excedente (−) perda por WACC e crescimento · calculado pelo sistema"); Se.add([He("g \\ WACC"), ...I.grid[0].cel.map(c => He(pcx(c.w)))]);
    I.grid.forEach(l => Se.add([pcx(l.g), ...l.cel.map(c => c.folga < 0 ? {v:Math.round(c.folga), s:"r"} : Math.round(c.folga))]));
    const Ck = Folha("Conferências", [70, 16, 18]); cab(Ck, "Conferências"); Ck.add([He("Conferência"), He("Resultado"), He("Valor")]);
    [["Soma do % da receita das UGCs marcadas = 100%", `ABS(${Ug.x("soma", "C")}-1)<0.001`, Ug.x("soma", "C"), "fp"], ["Crescimento na perpetuidade menor que o WACC", `${Pm.x("g", "B")}<${Pm.x("wacc", "B")}`, Pm.x("g", "B"), "fp"],
      ["Perpetuidade até 85% do valor em uso", `${Fc.x("pp", "B")}<=0.85`, Fc.x("pp", "B"), "fp"], ["Valor em uso próximo do sistema (até 10%)", `ABS(${Fc.x("vu", "B")}-${Fc.x("vus", "B")})<=ABS(${Fc.x("vus", "B")})*0.1`, `${Fc.x("vu", "B")}-${Fc.x("vus", "B")}`, "n"],
      ["Pelo menos uma UGC marcada", `COUNTIF('UGCs'!B${u0}:B${u1},"Sim")>0`, `COUNTIF('UGCs'!B${u0}:B${u1},"Sim")`, "n"], ["WACC até 3 p.p. do WACC do sistema", `ABS(${Pm.x("wacc", "B")}-${+I.X.W.wacc.toFixed(6)})<=0.03`, Pm.x("wacc", "B"), "fp"]]
      .forEach(([t, cond, val, st]) => Ck.add([t, Fo(`IF(${cond},"OK","Verificar")`, undefined, "t"), Fo(val, undefined, st)]));
    const No = Folha("CPC 01", [110]); cab(No, "Referências do CPC 01 (R1) / IAS 36"); [
      "Valor recuperável = o maior entre o valor justo líquido de despesas de venda e o valor em uso (item 18).",
      "Valor contábil ≤ recuperável: nenhuma ação. Valor contábil > recuperável: perda por impairment, reduzindo o valor contábil até o recuperável (item 59).",
      "Teste anual, com ou sem indício: ágio de combinação de negócios, intangíveis de vida útil indefinida e intangíveis ainda não em uso (itens 10 e 90).",
      "Demais ativos (imobilizado · CPC 27, intangíveis com vida útil definida): teste quando houver indício interno ou externo (item 12).",
      "Valor em uso: fluxos do ativo no estado atual, sem reestruturações não comprometidas nem melhorias (item 44); no máximo 5 anos de projeção, salvo justificativa (item 33).",
      "Taxa de desconto antes dos impostos (item 55): o sistema calcula a equivalente à taxa pós-IR.",
      "UGC: o menor grupo identificável de ativos que gera entradas de caixa independentes (item 6). O ágio é alocado às UGCs que se beneficiam da combinação (item 80).",
      "Alocação da perda: primeiro ao ágio da UGC, depois pro rata aos demais ativos, sem ficar abaixo do maior entre o valor justo líquido, o valor em uso e zero (itens 104 e 105).",
      "Perda do ágio não é revertida (item 124). Não controladores: o ágio é ajustado a 100% antes do teste (item C4).",
      "Contabilização: débito em despesa com perda por impairment (DRE) e crédito em conta redutora do ativo (balanço patrimonial).",
      "Fiscal (Lei 12.973, art. 32): perda indedutível no período; dedutível na alienação ou baixa. Controle no LALUR e IR/CS diferidos quando houver expectativa de realização."].forEach(t => No.add([t]));
    No.congela = [3, 0];
    return {abas:[Rs, Pm, Ug, Fc, Ca, Te, In_, Se, Ck, No], I};
  }
  async function xlsx(s){ const {abas} = modelo(s);
    await rptSave(KT_XLSX.gerar(abas), KT_REL.arq(s, "impairment_planilha_padronizada", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); }
  /* ---------------- importação da planilha revisada pelo consultor ---------------- */
  const nb = v => { if (v == null || v === "") return null; const x = +String(v).replace(/\s/g, ""); return isFinite(x) ? x : null; };
  const dataDe = v => { const x = nb(v); if (x != null && x > 20000 && x < 80000){ const d = new Date(Math.round((x - 25569) * 864e5)); return d.toISOString().slice(0, 10); } const m = String(v || "").match(/(\d{4})-(\d{2})-(\d{2})/) || String(v || "").match(/(\d{2})\/(\d{2})\/(\d{4})/); return !m ? null : m[1].length === 4 ? `${m[1]}-${m[2]}-${m[3]}` : `${m[3]}-${m[2]}-${m[1]}`; };
  async function importar(s, file){
    const P = await KT_DDWB.planilhas(await file.arrayBuffer()), aba = n => P[Object.keys(P).find(k => k.trim().toLowerCase() === n.toLowerCase())] || null;
    const Pm = aba("Premissas"), Fc = aba("Fluxo de caixa"), Ca = aba("Carrying amount"), Ug = aba("UGCs"), In_ = aba("Indícios"), Rs = aba("Resumo");
    if (!Pm || !Fc || !Ug) throw new Error("Esta não é a planilha modelo de impairment do KinseyTec (faltam as abas Premissas, Fluxo de caixa ou UGCs).");
    const row = (L, rot) => (L || []).find(r => String(r?.[0] || "").trim().toLowerCase() === rot.toLowerCase()), val = (L, rot, c = 1) => row(L, rot)?.[c];
    const I = calc(s), up = {}, lidos = [];
    /* premissas */
    const pp = k => nb(val(Pm, ROT[k])); const dT = dataDe(val(Pm, ROT.dataT)), dA = dataDe(val(Pm, ROT.dataAq));
    if (dT) up.data = dT; if (dA) up.dataAq = dA;
    const w = pp("wacc"), wa = pp("waccAq"), g = pp("g"), mu = pp("mult"), cv = pp("cv");
    if (w != null && Math.abs(w - I.X.W.wacc) > 1e-5) up.taxa = +(w * 100).toFixed(4); if (wa) up.waccAq = +(wa * 100).toFixed(4);
    if (g != null && Math.abs(g - I.c.g) > 1e-5) up.g = +(g * 100).toFixed(4); if (mu != null && (!I.multEb || Math.abs(mu - I.multEb) > .005)) up.mult = mu; if (cv != null) up.custoVenda = +(cv * 100).toFixed(4);
    up.agioTotal = /^s/i.test(String(val(Pm, ROT.agioT) || "")); lidos.push("premissas");
    /* fluxo de caixa: se o consultor alterou, passa a valer o fluxo dele */
    const anosRow = Fc.find(r => String(r?.[0] || "").trim() === "Item") || []; const anos = [1, 2, 3, 4, 5].map(c => +anosRow[c] || I.F[c - 1].y);
    const fl = Object.fromEntries(Object.entries(FL).map(([k, l]) => [k, [1, 2, 3, 4, 5].map(c => nb(row(Fc, l)?.[c]))]));
    const fclP = nb(val(Fc, "FCL da perpetuidade (ano 6)"));
    if (fl.eb.every(v => v != null)){
      const A = anos.map((y, i) => ({y, rl:fl.rl[i] || 0, eb:fl.eb[i], ir:fl.ir[i] || 0, capex:fl.capex[i] || 0, oinv:fl.oinv[i] || 0, dncg:fl.dncg[i] || 0}));
      const dif = A.some((a, i) => ["rl", "eb", "ir", "capex", "oinv", "dncg"].some(k => Math.abs(a[k] - (k === "oinv" ? I.Fs[i].oinv || 0 : I.Fs[i][k])) > Math.max(1000, Math.abs(I.Fs[i][k] || 0) * .005))) || (fclP != null && Math.abs(fclP - I.VUs.fclP) > Math.max(1000, Math.abs(I.VUs.fclP) * .005));
      up.fluxo = dif ? {anos:A, fclP, arquivo:file.name, em:nowISO()} : null; lidos.push(dif ? "fluxo revisado" : "fluxo sem alteração");
    }
    /* carrying amount: só o que o consultor mudou */
    if (Ca){ const comp = {}; COMP.forEach(([k, l]) => { const v = nb(val(Ca, l)), exp = k === "agio" ? I.agio0 : I.comp[k];
        comp[k] = v != null && Math.abs(v - exp) > Math.max(1000, Math.abs(exp) * .001) ? +(v / 1e6).toFixed(6) : (I.q.comp?.[k] ?? null); });
      up.comp = comp; lidos.push("carrying amount"); }
    /* UGCs marcadas com Sim */
    const hU = Ug.findIndex(r => /é ugc/i.test(String(r?.[1] || ""))); const novas = {};
    Ug.slice(hU + 1).forEach((r, i) => { const nm = String(r?.[0] || "").trim(); if (!nm || !/^s/i.test(String(r?.[1] || ""))) return; const pr = nb(r[2]) ?? 0, pa = nb(r[3]);
      novas[`x${i}${Date.now().toString(36)}`] = {nome:nm, pct:+(pr * 100).toFixed(4), pctAgio:pa == null ? null : +(pa * 100).toFixed(4), ind:/^s/i.test(String(r?.[4] || "")), obs:String(r?.[5] || "").replace(/^UGC atual.*$/, "").trim()}; });
    if (!Object.keys(novas).length) throw new Error("Nenhuma unidade marcada como UGC (Sim) na aba UGCs.");
    const nulo = {}; Object.keys(I.q.ugcs || {}).forEach(k => { nulo[k] = null; }); const L = Object.values(novas);
    up.ugcs = L.length === 1 && L[0].pct >= 99.9 && (L[0].pctAgio == null || L[0].pctAgio >= 99.9) ? nulo : {...nulo, ...novas}; if (L.length === 1) up.ugc = L[0].nome; lidos.push(`${L.length} UGC(s)`);
    /* indícios */
    if (In_){ const ind = {}; INDICIOS.forEach(([k, t]) => { const r = row(In_, t); if (r) ind[k] = {sim:/^s/i.test(String(r[2] || "")), obs:String(r[3] || "").trim()}; }); up.ind = ind; lidos.push("indícios"); }
    /* resultados do consultor, para a conferência */
    const res = Rs ? {vu:nb(val(Rs, "Fluxo de caixa descontado · valor em uso (UGCs)")), cont:nb(val(Rs, "Carrying amount (UGCs)")), perda:nb(val(Rs, "Impairment a reduzir")), exc:nb(val(Rs, "Valor excedente"))} : {};
    await D.up(s, {pos:{imp:up, impConsultor:{arquivo:file.name, em:nowISO(), por:Store.me?.email || "", resultados:res}}});
    return {lidos};
  }
  function conferencia(s, I){
    const reg = s.pos?.impConsultor; if (!reg) return ""; const r = reg.resultados || {};
    const L = [["Valor em uso (UGCs)", I.T.vu, r.vu], ["Carrying amount (UGCs)", I.T.cont, r.cont], ["Impairment a reduzir", I.T.perda, r.perda], ["Valor excedente", I.T.folga, r.exc]];
    const tr = ([n, a, b]) => { const df = b != null && a ? (b - a) / Math.abs(a) : null; return `<tr><td>${esc(n)}</td><td class="dd-num">${mi(a)}</td><td class="dd-num">${b != null ? mi(b) : "—"}</td><td class="dd-num" style="color:${df != null && Math.abs(df) > .02 ? "var(--warn)" : "inherit"}">${df != null ? pcx(df) : "—"}</td></tr>`; };
    return `<div style="display:flex;flex-direction:column;gap:6px"><b style="font-size:13px">Planilha revisada pelo consultor</b><p class="sub" style="margin:0;font-size:12px">${esc(reg.arquivo)} · importada em ${new Date(reg.em).toLocaleDateString("pt-BR")}${reg.por ? " · " + esc(reg.por) : ""}. As premissas, as UGCs, os indícios e o fluxo alterados na planilha já valem no sistema e nos relatórios.${I.O ? ` <button type="button" class="btn sm ghost" id="imp-volta">Voltar ao fluxo do sistema</button>` : ""}</p>
      <div class="tbl"><table><thead><tr><th>Item</th><th class="dd-num">Sistema</th><th class="dd-num">Planilha</th><th class="dd-num">Diferença</th></tr></thead><tbody>${L.map(tr).join("")}</tbody></table></div>
      <p class="sub" style="margin:0;font-size:11.5px">Os valores da planilha são os gravados pelo Excel ao salvar; diferença pequena vem de arredondamento.</p></div>`;
  }
  window.KT_IMP = {calc, html, bind, pdf, ppt, xlsx, modelo, importar, INDICIOS, COMP};
})();
