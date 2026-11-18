/* ================= KINSEY CAPITAL · IMPAIRMENT (CPC 01 R1 / IAS 36) =================
   Teste de redução ao valor recuperável da unidade geradora de caixa (UGC) adquirida, na aba "Impairment" do Pós-aquisição.
   - Indícios de desvalorização (item 12), com o desempenho pior que o projetado apurado automaticamente; o ágio é testado
     todo ano, havendo ou não indício (item 90).
   - Valor contábil da UGC: capital de giro, imobilizado a valor justo, intangíveis do PPA líquidos de amortização e ágio
     (ajustado pela participação de não controladores, item C4). Tudo pode ser alterado pelo consultor.
   - Valor recuperável = o maior entre o valor em uso (FCD do cenário moderado do valuation: 5 anos + perpetuidade, sem
     expansões) e o valor justo líquido de despesas de venda (múltiplos de mercado − despesas de venda).
   - Taxa de desconto antes dos impostos equivalente (item 55), perda alocada primeiro ao ágio e depois, pro rata, aos demais
     ativos (item 104), sensibilidade (taxa × crescimento) e ponto de equilíbrio (item 134 f), relatório em PDF e planilha. */
if (window.KT_DD && window.KT_VAL && window.KT_POS) (() => {
  const D = KT_DD, V = KT_VAL, {mi, pc} = D, dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; }, nn = v => { const x = num(v); return x == null || isNaN(x) ? null : x; };
  const INDICIOS = [
    ["mercado", "Queda significativa do valor de mercado do ativo ou da empresa, maior que a esperada pelo uso normal", "externo"],
    ["adverso", "Mudanças adversas no ambiente tecnológico, de mercado, econômico ou legal (perda de cliente relevante, nova concorrência, regulação)", "externo"],
    ["juros", "Aumento das taxas de juros de mercado que eleva a taxa de desconto (Selic, prêmio de risco)", "externo"],
    ["pl", "Patrimônio líquido contábil maior que o valor de mercado da empresa", "externo"],
    ["obsoleto", "Obsolescência ou dano físico de ativos", "interno"],
    ["descont", "Planos de descontinuar, reestruturar ou vender a operação ou parte dela", "interno"],
    ["desemp", "Desempenho econômico pior que o esperado (EBITDA ou fluxo de caixa abaixo do projetado na aquisição)", "interno"]];
  const cfg = s => s?.pos?.imp || {};
  /* fluxos do cenário moderado; choque no EBITDA (dm) para o ponto de equilíbrio */
  function fluxos(X, c, dm = 0){
    const t = X.W.t, cx = X.capex;
    return c.anos.map(a => { const ir0 = Math.max(0, a.eb - a.rl * cx) * t, dncg = a.eb - ir0 - a.rl * cx - a.fcl, eb = a.eb * (1 + dm), ir = Math.max(0, eb - a.rl * cx) * t;
      return {...a, eb, ir, fcl:eb - ir - a.rl * cx - dncg, pre:eb - a.rl * cx - dncg}; }); }
  function vu(X, F, w, g){
    const t = X.W.t, cx = X.capex, u = F[4]; let vp = 0, vpPre = 0;
    F.forEach(a => { vp += a.fcl / Math.pow(1 + w, a.t - .5); });
    const irP = Math.max(0, u.eb - u.rl * cx) * (1 + g) * t, fclP = u.eb * (1 + g) - irP - u.rl * cx * (1 + g) - u.rl * X.ncgp * g;
    const tv = w > g ? fclP / (w - g) : 0, vtv = tv / Math.pow(1 + w, 4.5);
    return {vp, vtv, v:vp + vtv, fclP, preP:fclP + irP}; }
  /* taxa antes dos impostos: a que, aplicada aos fluxos antes do IR, dá o mesmo valor em uso */
  function taxaPre(X, F, alvo, g, preP){
    const f = r => F.reduce((a, x) => a + x.pre / Math.pow(1 + r, x.t - .5), 0) + (r > g ? preP / (r - g) / Math.pow(1 + r, 4.5) : 1e30);
    let lo = g + 1e-4, hi = 1.5; if (!(f(hi) < alvo)) return null;
    for (let i = 0; i < 80; i++){ const m = (lo + hi) / 2; if (f(m) > alvo) lo = m; else hi = m; } return (lo + hi) / 2; }
  function calc(s){
    const Z = KT_POS.ppa(s); if (!Z) return null; const R = Z.R, X = R.X, q = cfg(s), mod = R.mod || V.resumo(s).mod, c = mod.c;
    const w = q.taxa != null ? q.taxa / 100 : X.W.wacc, g = q.g != null ? q.g / 100 : c.g, F = fluxos(X, c), VU = vu(X, F, w, g);
    const pre = taxaPre(X, F, VU.v, g, VU.preP);
    /* valor justo líquido de despesas de venda pelos múltiplos de mercado */
    const C = R.C || V.comparaveis(s), dsc = 1 - (X.Bs.P.desc?.v || 0) / 100, cv = (q.custoVenda ?? 2) / 100;
    const multEb = q.mult != null ? q.mult : C?.eb ? (C.eb.p25 + C.eb.p75) / 2 * dsc : null;
    const vjBruto = multEb ? X.bp.eb * multEb : null, vj = vjBruto != null ? vjBruto * (1 - cv) : null;
    /* valor contábil da UGC */
    const dAq = q.dataAq || Z.q.data || "", dT = q.data || new Date().toISOString().slice(0, 10);
    const anos = dAq ? Math.max(0, Math.floor((new Date(dT) - new Date(dAq)) / (365.25 * 864e5))) : 1;
    const amAc = Z.amort.slice(0, Math.min(anos, 5)).reduce((a, y) => a + y.cli + y.marca + y.tec + y.nc + y.kt, 0) + (anos > 5 ? (anos - 5) * (Z.amort[4].cli + Z.amort[4].marca + Z.amort[4].tec + Z.amort[4].kt) : 0);
    const v = (k, d) => q[k] != null ? q[k] * 1e6 : d;
    const comp = {giro:v("giro", Z.ncgV), imob:v("imob", Z.imobVJ), intang:v("intang", Math.max(0, Z.intang - amAc)), agio:v("agio", Z.goodwill), outros:v("outros", 0)};
    const agioUgc = Z.pct > 0 && Z.pct < 1 && !q.agioTotal ? comp.agio / Z.pct : comp.agio;
    const cont = comp.giro + comp.imob + comp.intang + agioUgc + comp.outros;
    const rec = Math.max(VU.v, vj ?? -Infinity), base = rec === VU.v ? "valor em uso" : "valor justo líquido de despesas de venda";
    const perda = Math.max(0, cont - rec), folga = rec - cont;
    /* alocação da perda (item 104): ágio primeiro, depois pro rata imobilizado, intangíveis e outros (capital de giro fora do CPC 01) */
    const pAgio = Math.min(perda, agioUgc), resto = perda - pAgio, baseR = comp.imob + comp.intang + comp.outros;
    const aloc = {agio:pAgio, agioCtrl:pAgio * (Z.pct < 1 && !q.agioTotal ? Z.pct : 1), imob:baseR ? resto * comp.imob / baseR : 0, intang:baseR ? resto * comp.intang / baseR : 0, outros:baseR ? resto * comp.outros / baseR : 0};
    /* sensibilidade e ponto de equilíbrio */
    const dw = [-.01, 0, .01, .02], dg = [-.01, -.005, 0, .005], grid = dg.map(d => ({g:g + d, cel:dw.map(e => ({w:w + e, folga:vu(X, F, w + e, g + d).v - cont}))}));
    const beW = (() => { if (VU.v <= cont) return null; let lo = w, hi = .6; if (vu(X, F, hi, g).v > cont) return null; for (let i = 0; i < 70; i++){ const m = (lo + hi) / 2; if (vu(X, F, m, g).v > cont) lo = m; else hi = m; } return lo; })();
    const beM = (() => { if (VU.v <= cont) return null; let lo = -.95, hi = 0; for (let i = 0; i < 70; i++){ const m = (lo + hi) / 2; if (vu(X, fluxos(X, c, m), w, g).v > cont) hi = m; else lo = m; } return hi; })();
    /* indícios: desempenho realizado × projetado */
    const per = (D.periodos(s) || []).sort().pop(), yP = per ? +per.slice(0, 4) : 0; let ebReal = q.ebReal != null ? q.ebReal * 1e6 : null, ebFonte = q.ebReal != null ? "informado" : "";
    if (ebReal == null && per && yP > X.y0){ const K = D.calc(s.dd.bal[per]), m = s.dd.bal[per]?.meses || +per.slice(5, 7) || 12; ebReal = K.ebitda * 12 / m; ebFonte = `balancete de ${per}${m < 12 ? " anualizado" : ""}`; }
    const ebProj = (F.find(a => a.y === (yP > X.y0 ? yP : X.y0 + 1)) || F[0]).eb, desv = ebReal != null && ebProj ? ebReal / ebProj - 1 : null;
    const auto = {desemp:desv != null && desv < -.1};
    const ind = INDICIOS.map(([k, t, tp]) => ({k, t, tp, sim:q.ind?.[k]?.sim ?? !!auto[k], auto:!!auto[k], obs:q.ind?.[k]?.obs || ""}));
    return {Z, R, X, q, w, g, F, VU, pre, C, multEb, vjBruto, vj, cv, comp, agioUgc, cont, rec, base, perda, folga, aloc, grid, beW, beM, ebReal, ebFonte, ebProj, desv, ind, anos, amAc, dT, dAq, ugc:q.ugc || s.mandato?.codinome || s.nome};
  }
  const pcx = (v, d = 1) => v == null ? "—" : `${fmt(v * 100, d)}%`;
  function html(s){
    if (!s) return D.semBal(s); const I = calc(s); if (!I) return D.semBal(s);
    const ed = D.ed() ? "" : "disabled", q = I.q, st = I.perda > 0 ? ["r-alto", "Perda por impairment"] : I.folga < I.cont * .1 ? ["r-medio", "Sem perda · folga pequena"] : ["r-baixo", "Sem perda"];
    const k = (l, v, sub, cor) => `<div class="dd-k"><span>${l}</span><b${cor ? ` style="color:${cor}"` : ""}>${v}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
    const inp = (id, l, val, ph) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" inputmode="decimal" value="${val != null ? esc(String(val).replace(".", ",")) : ""}" placeholder="${esc(ph || "")}" ${ed}></div>`;
    const nInd = I.ind.filter(x => x.sim).length;
    return `<div class="card imp" style="display:flex;flex-direction:column;gap:10px;font-size:13px"><style>.imp table{font-size:12.5px}.imp td,.imp th{padding:6px 8px}.imp summary{cursor:pointer;font-size:13px;font-weight:600}</style>
      <div class="head" style="margin:0"><div><div class="eyebrow">Impairment · CPC 01 (R1)</div><h3 style="font-size:15px">${esc(I.ugc)} · teste de recuperabilidade</h3><p class="sub" style="margin:2px 0 0;font-size:12px">UGC: empresa adquirida · data do teste ${dBR(I.dT)}${I.dAq ? ` · aquisição ${dBR(I.dAq)}` : ""} · ágio testado anualmente (item 90)</p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="imp-pdf">Relatório (PDF)</button><button type="button" class="btn sm" id="imp-xl">Memória de cálculo (Excel)</button></div></div>
      <div><span class="pill ${st[0]}" style="font-size:11px">${st[1]}</span></div>
      <div class="dd-kpis">${k("Valor contábil da UGC", mi(I.cont), "com o ágio")}${k("Valor recuperável", mi(I.rec), I.base)}${I.perda > 0 ? k("Perda por impairment", mi(I.perda), `ágio ${mi(I.aloc.agio)}${I.aloc.agioCtrl !== I.aloc.agio ? ` (controladora ${mi(I.aloc.agioCtrl)})` : ""}`, "var(--bad)") : k("Folga", mi(I.folga), `${pcx(I.folga / I.cont)} do valor contábil`, "var(--ouro,#F4C440)")}${k("Taxa de desconto", `${pcx(I.w)} pós-IR`, `antes dos impostos ${pcx(I.pre)} · g ${pcx(I.g)}`)}</div>
      <div class="tbl"><table><tbody>
        <tr><td>Valor em uso (FCD moderado, 5 anos + perpetuidade)</td><td class="dd-num">${mi(I.VU.v)}</td></tr>
        <tr><td>Valor justo líquido de despesas de venda ${I.multEb ? `<span class="sub" style="font-size:11px">· ${fmt(I.multEb, 1)}× EBITDA − ${fmt(I.cv * 100, 1)}%</span>` : ""}</td><td class="dd-num">${I.vj != null ? mi(I.vj) : "sem comparáveis"}</td></tr>
        <tr style="border-top:1px solid var(--line-2)"><td><b>Valor recuperável (o maior)</b></td><td class="dd-num"><b>${mi(I.rec)}</b></td></tr>
        <tr><td>(−) Valor contábil da UGC</td><td class="dd-num">${mi(I.cont)}</td></tr>
        <tr><td><b>${I.perda > 0 ? "Perda a reconhecer no resultado" : "Folga (sem perda)"}</b></td><td class="dd-num"><b style="color:${I.perda > 0 ? "var(--bad)" : "var(--ouro,#F4C440)"}">${mi(I.perda > 0 ? -I.perda : I.folga)}</b></td></tr></tbody></table></div>
      <details id="imp-ind"><summary>Indícios de desvalorização (item 12) · ${nInd} marcado(s)</summary><div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
        ${I.desv != null ? `<p class="sub" style="margin:0;font-size:12px">EBITDA realizado ${mi(I.ebReal)} (${esc(I.ebFonte)}) × projetado ${mi(I.ebProj)}: <b style="color:${I.desv < -.1 ? "var(--bad)" : "var(--fog)"}">${I.desv >= 0 ? "+" : ""}${pcx(I.desv)}</b></p>` : `<p class="sub" style="margin:0;font-size:12px">Informe o EBITDA realizado (ou importe o balancete posterior à aquisição) para comparar com o projetado.</p>`}
        <div class="tbl"><table><tbody>${I.ind.map(x => `<tr><td style="width:28px"><input type="checkbox" data-iind="${x.k}" ${x.sim ? "checked" : ""} aria-label="${esc(x.t)}" ${ed}></td><td>${esc(x.t)} <span class="sub" style="font-size:11px">· ${x.tp}${x.auto ? " · apurado pelo sistema" : ""}</span><input data-iobs="${x.k}" value="${esc(x.obs)}" placeholder="observação" style="margin-top:4px;width:100%;height:30px;font-size:12px" ${ed}></td></tr>`).join("")}</tbody></table></div>
        <p class="sub" style="margin:0;font-size:11.5px">Com indício, o teste é obrigatório para o ativo ou a UGC; o ágio e os intangíveis de vida útil indefinida são testados todo ano mesmo sem indício.</p></div></details>
      <details id="imp-vu"><summary>Valor em uso · fluxos projetados</summary><div class="tbl" style="margin-top:8px"><table><thead><tr><th>Ano</th><th class="dd-num">Receita</th><th class="dd-num">EBITDA</th><th class="dd-num">FCL pós-IR</th><th class="dd-num">FCL antes do IR</th><th class="dd-num">Valor presente</th></tr></thead><tbody>
        ${I.F.map(a => `<tr><td>${a.y}</td><td class="dd-num">${mi(a.rl)}</td><td class="dd-num">${mi(a.eb)}</td><td class="dd-num">${mi(a.fcl)}</td><td class="dd-num">${mi(a.pre)}</td><td class="dd-num">${mi(a.fcl / Math.pow(1 + I.w, a.t - .5))}</td></tr>`).join("")}
        <tr><td>Perpetuidade</td><td colspan="2" class="sub" style="font-size:11.5px">g ${pcx(I.g)} · FCL ${mi(I.VU.fclP)}</td><td></td><td class="dd-num">${mi(I.VU.preP)}</td><td class="dd-num">${mi(I.VU.vtv)}</td></tr>
        <tr><td colspan="5"><b>Valor em uso</b></td><td class="dd-num"><b>${mi(I.VU.v)}</b></td></tr></tbody></table></div>
        <p class="sub" style="margin:6px 0 0;font-size:11.5px">Cenário moderado do valuation (histórico, sem novos negócios nem expansões, item 44), no máximo 5 anos de projeção (item 33). A taxa antes dos impostos (${pcx(I.pre)}) é a que, aplicada aos fluxos antes do IR, dá o mesmo valor em uso (item 55 e BCZ85).</p></details>
      <details id="imp-ct"><summary>Valor contábil da UGC</summary><div class="tbl" style="margin-top:8px"><table><tbody>
        <tr><td>Capital de giro operacional</td><td class="dd-num">${mi(I.comp.giro)}</td></tr><tr><td>Imobilizado (valor justo do PPA)</td><td class="dd-num">${mi(I.comp.imob)}</td></tr>
        <tr><td>Intangíveis do PPA líquidos <span class="sub" style="font-size:11px">· amortização acumulada ${mi(I.amAc)} (${I.anos} ano(s))</span></td><td class="dd-num">${mi(I.comp.intang)}</td></tr>
        <tr><td>Ágio (goodwill)${I.agioUgc !== I.comp.agio ? ` <span class="sub" style="font-size:11px">· ${mi(I.comp.agio)} da controladora ajustado a 100% (item C4)</span>` : ""}</td><td class="dd-num">${mi(I.agioUgc)}</td></tr>
        ${I.comp.outros ? `<tr><td>Outros ativos operacionais</td><td class="dd-num">${mi(I.comp.outros)}</td></tr>` : ""}
        <tr style="border-top:1px solid var(--line-2)"><td><b>Valor contábil da UGC</b></td><td class="dd-num"><b>${mi(I.cont)}</b></td></tr></tbody></table></div></details>
      ${I.perda > 0 ? `<div><b style="font-size:13px">Alocação da perda (item 104)</b><div class="tbl" style="margin-top:6px"><table><tbody><tr><td>Ágio (não reversível, item 124)</td><td class="dd-num">${mi(I.aloc.agio)}</td></tr><tr><td>Imobilizado (pro rata)</td><td class="dd-num">${mi(I.aloc.imob)}</td></tr><tr><td>Intangíveis (pro rata)</td><td class="dd-num">${mi(I.aloc.intang)}</td></tr>${I.aloc.outros ? `<tr><td>Outros ativos</td><td class="dd-num">${mi(I.aloc.outros)}</td></tr>` : ""}</tbody></table></div><p class="sub" style="margin:4px 0 0;font-size:11.5px">Nenhum ativo fica abaixo do maior entre o seu valor justo líquido, o seu valor em uso e zero (item 105): revise a alocação se houver laudo individual.</p></div>` : ""}
      <details id="imp-sens"><summary>Sensibilidade e ponto de equilíbrio (item 134)</summary><div class="tbl" style="margin-top:8px"><table><thead><tr><th>Folga · g × taxa</th>${I.grid[0].cel.map(c => `<th class="dd-num">${pcx(c.w)}</th>`).join("")}</tr></thead><tbody>${I.grid.map(l => `<tr><td>g ${pcx(l.g)}</td>${l.cel.map(c => `<td class="dd-num" style="color:${c.folga < 0 ? "var(--bad)" : "inherit"}">${mi(c.folga)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <p class="sub" style="margin:6px 0 0;font-size:12px">${I.beW != null ? `A folga zera com taxa de ${pcx(I.beW)} pós-IR (+${fmt((I.beW - I.w) * 100, 1)} p.p.)` : I.perda > 0 ? "Já há perda na taxa atual" : "A folga não zera com taxas até 60%"}${I.beM != null ? ` ou com EBITDA ${pcx(I.beM)} abaixo do projetado em todos os anos` : ""}.</p></details>
      <details id="imp-prem"${S.impPrem ? " open" : ""}><summary>Premissas do teste</summary><form id="fimp" style="display:flex;flex-direction:column;gap:8px;margin-top:8px" novalidate><div class="form">
        <div class="fld"><label for="im-dt">Data do teste</label><input id="im-dt" type="date" value="${esc(q.data || "")}" ${ed}></div><div class="fld"><label for="im-da">Data da aquisição</label><input id="im-da" type="date" value="${esc(q.dataAq || I.Z.q.data || "")}" ${ed}></div>
        <div class="fld"><label for="im-u">Unidade geradora de caixa</label><input id="im-u" value="${esc(q.ugc || "")}" placeholder="${esc(I.ugc)}" ${ed}></div>
        ${inp("im-w", "Taxa de desconto pós-IR (%)", q.taxa, fmt(I.X.W.wacc * 100, 2) + " (WACC)")}${inp("im-g", "Crescimento na perpetuidade (%)", q.g, fmt(I.R.mod.c.g * 100, 2))}
        ${inp("im-m", "Múltiplo EV/EBITDA do valor justo (×)", q.mult, I.C?.eb ? fmt(I.multEb, 1) : "sem comparáveis")}${inp("im-cv", "Despesas de venda (% do valor justo)", q.custoVenda, "2")}
        ${inp("im-eb", "EBITDA realizado no último exercício (R$ mi)", q.ebReal, I.ebReal != null && q.ebReal == null ? fmt(I.ebReal / 1e6, 1) : "")}
        ${inp("im-gi", "Capital de giro (R$ mi)", q.giro, fmt(I.Z.ncgV / 1e6, 1))}${inp("im-im", "Imobilizado (R$ mi)", q.imob, fmt(I.Z.imobVJ / 1e6, 1))}${inp("im-in", "Intangíveis líquidos (R$ mi)", q.intang, "")}${inp("im-ag", "Ágio da controladora (R$ mi)", q.agio, fmt(I.Z.goodwill / 1e6, 1))}${inp("im-ou", "Outros ativos operacionais (R$ mi)", q.outros, "0")}</div>
        <label style="display:flex;gap:8px;align-items:center;font-size:12.5px"><input type="checkbox" id="im-at" ${q.agioTotal ? "checked" : ""} ${ed}> Ágio já reconhecido a 100% (não controladores pelo valor justo)</label>
        ${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar premissas</button>` : ""}<p class="sub" style="margin:0;font-size:11.5px">Campos vazios usam o PPA e o valuation. Valores em R$ milhões.</p></form></details></div>`;
  }
  function bind(host, s){
    const up = p => D.up(s, {pos:{imp:p}});
    $$("[data-iind]", host).forEach(c => c.onchange = () => up({ind:{[c.dataset.iind]:{sim:c.checked}}}));
    $$("[data-iobs]", host).forEach(c => c.onchange = () => up({ind:{[c.dataset.iobs]:{obs:c.value.trim()}}}));
    const pr = $("#imp-prem", host); if (pr) pr.ontoggle = () => { S.impPrem = pr.open; };
    const f = $("#fimp", host); if (f) f.onsubmit = e => { e.preventDefault(); const g = id => nn($(id).value);
      up({data:$("#im-dt").value || null, dataAq:$("#im-da").value || null, ugc:$("#im-u").value.trim() || null, taxa:g("#im-w"), g:g("#im-g"), mult:g("#im-m"), custoVenda:g("#im-cv"), ebReal:g("#im-eb"),
        giro:g("#im-gi"), imob:g("#im-im"), intang:g("#im-in"), agio:g("#im-ag"), outros:g("#im-ou"), agioTotal:$("#im-at").checked}); toast("Premissas do impairment salvas"); };
    const p = $("#imp-pdf", host); if (p) p.onclick = () => pdf(s).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
    const x = $("#imp-xl", host); if (x) x.onclick = () => xlsx(s).catch(e => { console.error(e); toast("Não foi possível gerar a planilha."); });
  }
  async function pdf(s){
    const I = calc(s), R = KT_REL, P = KTPdf(); let n = 0; const sec = t => R.sec(P, ++n, t);
    R.capa(P, "Teste de impairment · CPC 01 (R1)", s.nome, [["Unidade geradora de caixa", I.ugc], ["Data do teste", dBR(I.dT)], ["Aquisição", I.dAq ? dBR(I.dAq) : "—"], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    sec("Conclusão");
    R.kpisPdf(P, [["Valor contábil da UGC", mi(I.cont), "com o ágio"], ["Valor recuperável", mi(I.rec), I.base], [I.perda > 0 ? "Perda por impairment" : "Folga", mi(I.perda > 0 ? I.perda : I.folga), I.perda > 0 ? "reconhecer no resultado" : pcx(I.folga / I.cont) + " do valor contábil"], ["Taxa pós-IR / antes do IR", `${pcx(I.w)} / ${pcx(I.pre)}`, `g ${pcx(I.g)}`]]);
    R.par(P, I.perda > 0 ? `O valor contábil da UGC (${mi(I.cont)}) supera o valor recuperável (${mi(I.rec)}, ${I.base}). A perda de ${mi(I.perda)} é alocada primeiro ao ágio (${mi(I.aloc.agio)}) e o restante aos demais ativos, pro rata. A perda do ágio não é revertida em períodos seguintes.` : `O valor recuperável da UGC (${mi(I.rec)}, ${I.base}) supera o valor contábil (${mi(I.cont)}) em ${mi(I.folga)}: não há perda por redução ao valor recuperável a reconhecer.`);
    sec("Indícios de desvalorização (item 12)");
    R.tab(P, ["Indício", "Origem", "Situação", "Observação"], I.ind.map(x => [x.t, x.tp, x.sim ? "Sim" : "Não", x.obs || (x.k === "desemp" && I.desv != null ? `EBITDA realizado ${mi(I.ebReal)} × projetado ${mi(I.ebProj)} (${pcx(I.desv)})` : "")]), [.44, .1, .1, .36]);
    sec("Valor em uso");
    R.tab(P, ["Ano", "Receita", "EBITDA", "FCL pós-IR", "FCL antes do IR", "Valor presente"], [...I.F.map(a => [String(a.y), mi(a.rl), mi(a.eb), mi(a.fcl), mi(a.pre), mi(a.fcl / Math.pow(1 + I.w, a.t - .5))]), ["Perpetuidade", "", "", mi(I.VU.fclP), mi(I.VU.preP), mi(I.VU.vtv)], ["Valor em uso", "", "", "", "", mi(I.VU.v)]], [.16, .16, .16, .17, .17, .18]);
    R.par(P, `Fluxos do cenário moderado do valuation, sem expansões, com 5 anos de projeção e perpetuidade a ${pcx(I.g)}. Taxa pós-IR ${pcx(I.w)}; taxa antes dos impostos equivalente ${pcx(I.pre)} (item 55).`, {size:8.5});
    sec("Valor justo líquido de despesas de venda");
    R.par(P, I.vj != null ? `EBITDA base ${mi(I.X.bp.eb)} × ${fmt(I.multEb, 1)}× (múltiplos de mercado com desconto de liquidez) = ${mi(I.vjBruto)}, menos despesas de venda de ${fmt(I.cv * 100, 1)}% = ${mi(I.vj)}.` : "Sem comparáveis de mercado: o valor recuperável é o valor em uso.");
    sec("Valor contábil da UGC");
    R.tab(P, ["Componente", "R$"], [["Capital de giro operacional", mi(I.comp.giro)], ["Imobilizado (valor justo do PPA)", mi(I.comp.imob)], [`Intangíveis do PPA líquidos (amortização acumulada ${mi(I.amAc)})`, mi(I.comp.intang)], [`Ágio${I.agioUgc !== I.comp.agio ? " ajustado a 100% (item C4)" : ""}`, mi(I.agioUgc)], ...(I.comp.outros ? [["Outros ativos operacionais", mi(I.comp.outros)]] : []), ["Valor contábil da UGC", mi(I.cont)]], [.7, .3]);
    if (I.perda > 0){ sec("Alocação da perda (item 104)"); R.tab(P, ["Ativo", "Perda"], [["Ágio", mi(I.aloc.agio)], ["Imobilizado", mi(I.aloc.imob)], ["Intangíveis", mi(I.aloc.intang)], ...(I.aloc.outros ? [["Outros", mi(I.aloc.outros)]] : [])], [.7, .3]); }
    sec("Sensibilidade (item 134)");
    R.tab(P, ["g × taxa", ...I.grid[0].cel.map(c => pcx(c.w))], I.grid.map(l => [`g ${pcx(l.g)}`, ...l.cel.map(c => mi(c.folga))]), [.2, .2, .2, .2, .2]);
    R.par(P, `${I.beW != null ? `A folga zera com taxa pós-IR de ${pcx(I.beW)}` : I.perda > 0 ? "Já há perda na taxa atual" : "A folga não zera com taxas até 60%"}${I.beM != null ? ` ou com EBITDA ${pcx(I.beM)} abaixo do projetado em todos os anos` : ""}.`);
    R.par(P, "Trabalho preparado pelo KinseyTec com base no PPA e no valuation; sujeito à revisão do consultor e do auditor.", {size:8.5, color:[90,101,120]});
    await rptSave(P.out(`Impairment · ${s.nome}`, R.T(`Kinsey Capital · Impairment CPC 01 · ${s.nome} · confidencial`)), R.arq(s, "impairment_CPC01", "pdf"), "application/pdf");
  }
  async function xlsx(s){
    const I = calc(s), H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), Pp = v => ({v, s:"p"}), B = v => ({v, s:"b"}), cab = t => [[T(`${t} · ${I.ugc}`)], [`Valores em R$ · data do teste ${dBR(I.dT)} · CPC 01 (R1)`], []];
    const abas = [
      {nome:"Resumo", larguras:[56, 20], linhas:[...cab("Teste de impairment"), [H("Item"), H("R$")], ["Valor em uso", I.VU.v], ["Valor justo líquido de despesas de venda", I.vj ?? "—"], [B("Valor recuperável"), B(I.rec)], ["Valor contábil da UGC", I.cont], [B(I.perda > 0 ? "Perda por impairment" : "Folga"), B(I.perda > 0 ? -I.perda : I.folga)], [], ["Taxa pós-IR", Pp(I.w)], ["Taxa antes dos impostos", Pp(I.pre ?? 0)], ["Crescimento na perpetuidade", Pp(I.g)]]},
      {nome:"Valor em uso", larguras:[14, 18, 18, 18, 18, 18], linhas:[...cab("Valor em uso"), [H("Ano"), H("Receita"), H("EBITDA"), H("FCL pós-IR"), H("FCL antes do IR"), H("Valor presente")], ...I.F.map(a => [a.y, a.rl, a.eb, a.fcl, a.pre, a.fcl / Math.pow(1 + I.w, a.t - .5)]), ["Perpetuidade", "", "", I.VU.fclP, I.VU.preP, I.VU.vtv], [B("Total"), "", "", "", "", B(I.VU.v)]]},
      {nome:"Valor contábil", larguras:[52, 18], linhas:[...cab("Valor contábil da UGC"), [H("Componente"), H("R$")], ["Capital de giro", I.comp.giro], ["Imobilizado", I.comp.imob], ["Intangíveis líquidos", I.comp.intang], ["Ágio (UGC)", I.agioUgc], ["Outros", I.comp.outros], [B("Total"), B(I.cont)], [], [H("Alocação da perda"), H("R$")], ["Ágio", I.aloc.agio], ["Imobilizado", I.aloc.imob], ["Intangíveis", I.aloc.intang], ["Outros", I.aloc.outros]]},
      {nome:"Sensibilidade", larguras:[16, 16, 16, 16, 16], linhas:[...cab("Folga por taxa e crescimento"), [H("g \\ taxa"), ...I.grid[0].cel.map(c => H(pcx(c.w)))], ...I.grid.map(l => [pcx(l.g), ...l.cel.map(c => c.folga < 0 ? {v:c.folga, s:"r"} : c.folga)]), [], ["Taxa de equilíbrio", I.beW != null ? Pp(I.beW) : "—"], ["Queda de EBITDA de equilíbrio", I.beM != null ? Pp(I.beM) : "—"]]},
      {nome:"Indícios", larguras:[70, 10, 10, 40], linhas:[...cab("Indícios de desvalorização (item 12)"), [H("Indício"), H("Origem"), H("Situação"), H("Observação")], ...I.ind.map(x => [x.t, x.tp, x.sim ? {v:"Sim", s:"y"} : "Não", x.obs])]}];
    await rptSave(KT_XLSX.gerar(abas), KT_REL.arq(s, "impairment_CPC01", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  window.KT_IMP = {calc, html, bind, pdf, xlsx, INDICIOS};
})();
