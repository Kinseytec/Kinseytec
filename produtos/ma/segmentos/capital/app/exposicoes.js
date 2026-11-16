/* ================= KINSEY CAPITAL · EXPOSIÇÕES E RELATÓRIO DE DUE DILIGENCE =================
   Registro das potenciais exposições fiscais, trabalhistas e previdenciárias no padrão dos relatórios Kinsey:
   principal por ano do fato gerador, juros pela Selic acumulada até a data-base, cenários mínimo (multa de mora
   20%), máximo (multa de ofício 75%) e qualificado (150%), avaliação de risco (provável, possível, remota ou não
   quantificada) e decadência de 5 anos. Monta o relatório de due diligence na estrutura Kinsey: carta, objetivo e
   limitações, sumário das exposições, decadência, grupo econômico, balanço reclassificado, performance (EBITDA
   ajustado), capital de giro, dívida líquida, aspectos tributários e trabalhistas, pontos e recomendações e equipe. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi, pc} = D;
  /* Selic média anual (% a.a.) para atualização dos juros; o ano corrente usa a do mercado quando houver */
  const SELIC = {2016:14.0, 2017:9.9, 2018:6.4, 2019:5.9, 2020:2.8, 2021:4.4, 2022:12.4, 2023:13.0, 2024:10.9, 2025:14.4, 2026:14.6};
  const MULTAS = {tributaria:[.20, .75, 1.50], previdenciaria:[.20, .75, 1.50], trabalhista:[0, .40, null], legal:[0, 0, null]};
  const AVAL = {provavel:"Provável", possivel:"Possível", remota:"Remota", nq:"NQ"};
  const AREA = {tributaria:"Tributária", previdenciaria:"Previdenciária", trabalhista:"Trabalhista", legal:"Legal / cível"};
  const anoDB = (s, per) => +(String(s.dd?.bal?.[per]?.dataBase || s.perfil?.dataBase || new Date().toISOString()).slice(0, 4));
  function selicAte(ano, ate){ let f = 0; for (let y = ano; y <= ate; y++) f += (SELIC[y] ?? SELIC[2026]) / 100 * (y === ano ? .5 : 1); return f; } /* simples, fato gerador no meio do ano */
  function calc(e, ateAno){
    const ini = +e.anoIni || ateAno, fim = Math.max(ini, +e.anoFim || ini), anos = [], n = fim - ini + 1, P = +e.principal || 0, lim = ateAno - 5, M = MULTAS[e.area] || MULTAS.tributaria;
    for (let y = ini; y <= fim; y++){ const pr = P / n, dec = y < lim, j = pr * selicAte(y, ateAno); anos.push({y, pr, j, dec, decaiEm:`31/12/${y + 5}`}); }
    const vivos = anos.filter(a => !a.dec), pr = vivos.reduce((a, x) => a + x.pr, 0), j = vivos.reduce((a, x) => a + x.j, 0);
    const v = (m, man) => man != null && man !== "" ? +man * 1e3 : m == null ? null : P ? pr * (1 + m) + j : null;
    return {anos, pr, j, min:v(M[0], e.min), max:v(M[1], e.max), qual:v(M[2], e.qual), decaido:anos.length && !vivos.length};
  }
  const lista = s => Object.entries(s.dd?.expo || {}).filter(([, e]) => e && !e.excluido).map(([id, e]) => ({id, ...e}));
  const fmtMil = v => v == null ? "NQ" : fmt(v / 1e3, 0);
  /* sugestões a partir dos achados dos procedimentos (trabalhista e tributária) */
  function sugestoes(s, per){ const b = s.dd?.bal?.[per]; if (!b) return []; const K = D.calc(b), ja = new Set(lista(s).map(e => e.proc));
    return D.PROCS.filter(p => /trabalhista|tributaria/.test(p.area)).map(p => ({p, r:p.f(K, b, s)})).filter(x => x.r.st === "achado" && !ja.has(x.p.id)).map(x => ({proc:x.p.id, area:x.p.area, titulo:x.p.t, base:x.r.txt})); }
  function view(s, per){
    const L = lista(s), ate = anoDB(s, per), C = L.map(e => ({e, c:calc(e, ate)})), tot = k => C.reduce((a, x) => a + (x.c[k] || 0), 0), sg = sugestoes(s, per), ed = D.ed();
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Due Diligence · ${esc(s.nome)}</div><h3>Sumário das potenciais exposições</h3><p class="sub" style="margin:2px 0 0">Valores em milhares de reais (MR$). Mínimo: principal + multa de mora de 20% + juros Selic; máximo: multa de ofício de 75%; qualificado: multa de 150% (evasão). Fatos geradores com mais de 5 anos até ${ate} ficam decaídos.</p></div>${ed ? `<button type="button" class="btn sm primary" id="ex-add">+ Exposição</button>` : ""}</div>
      <div class="tbl"><table><thead><tr><th>Item</th><th>Área</th><th>Período</th><th class="dd-num">Principal</th><th class="dd-num">Mínimo</th><th class="dd-num">Máximo</th><th class="dd-num">Qualificado</th><th>Avaliação</th><th></th></tr></thead><tbody>
      ${C.map(({e, c}, i) => `<tr><td><b>${i + 1}. ${esc(e.titulo)}</b>${e.obs ? `<div class="sub" style="margin:2px 0 0">${esc(e.obs)}</div>` : ""}${c.decaido ? `<div class="sub" style="margin:2px 0 0;color:var(--ok)">decaído</div>` : ""}</td><td>${AREA[e.area] || e.area}</td><td>${e.anoIni || "—"}${e.anoFim && e.anoFim !== e.anoIni ? "–" + e.anoFim : ""}</td><td class="dd-num">${e.principal ? fmtMil(+e.principal) : "NQ"}</td><td class="dd-num">${fmtMil(c.min)}</td><td class="dd-num">${fmtMil(c.max)}</td><td class="dd-num">${fmtMil(c.qual)}</td><td><span class="pill ${e.aval === "provavel" ? "r-alto" : e.aval === "possivel" ? "r-medio" : "r-baixo"}">${AVAL[e.aval] || "NQ"}</span></td><td style="text-align:right">${ed ? `<button type="button" class="btn sm" data-exed="${e.id}">Editar</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="9" class="sub">Nenhuma exposição registrada.</td></tr>`}
      ${C.length ? `<tr><td colspan="4"><b>Total geral</b></td><td class="dd-num"><b>${fmtMil(tot("min"))}</b></td><td class="dd-num"><b>${fmtMil(tot("max"))}</b></td><td class="dd-num"><b>${fmtMil(tot("qual"))}</b></td><td colspan="2"></td></tr>` : ""}</tbody></table></div>
      ${sg.length && ed ? `<div class="banner" style="display:flex;flex-direction:column;gap:6px"><b>Achados que podem gerar exposição</b>${sg.map((x, i) => `<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>${esc(D.areaNome(x.area))} · ${esc(x.titulo)}</span><button type="button" class="btn sm" data-exsg="${i}">Registrar</button></div>`).join("")}</div>` : ""}</div>`;
  }
  function form(s, per, id, pre){
    const e = id ? s.dd.expo[id] : (pre || {}), ate = anoDB(s, per), o = (v, l, a) => `<option value="${v}" ${a === v ? "selected" : ""}>${l}</option>`;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Due Diligence · ${esc(s.nome)}</div><h2>${id ? "Editar exposição" : "Nova exposição"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fex" style="display:flex;flex-direction:column;gap:10px" novalidate><div class="form">
        <div class="fld full"><label for="ex-t">Item</label><input id="ex-t" value="${esc(e.titulo || "")}" placeholder="ex.: PJ · serviços prestados por pessoas jurídicas com risco de vínculo"></div>
        <div class="fld"><label for="ex-a">Área</label><select id="ex-a">${Object.entries(AREA).map(([k, l]) => o(k, l, e.area || "tributaria")).join("")}</select></div>
        <div class="fld"><label for="ex-v">Avaliação de risco</label><select id="ex-v">${Object.entries(AVAL).map(([k, l]) => o(k, l, e.aval || "possivel")).join("")}</select></div>
        <div class="fld"><label for="ex-p">Principal (R$)</label><input id="ex-p" inputmode="decimal" value="${e.principal ? fmt(e.principal, 0) : ""}" placeholder="vazio = não quantificado"></div>
        <div class="fld"><label for="ex-i">Fato gerador · de (ano)</label><input id="ex-i" inputmode="numeric" value="${esc(e.anoIni || ate - 4)}"></div><div class="fld"><label for="ex-f">até (ano)</label><input id="ex-f" inputmode="numeric" value="${esc(e.anoFim || ate)}"></div>
        <div class="fld"><label for="ex-mn">Mínimo informado (MR$)</label><input id="ex-mn" inputmode="decimal" value="${esc(e.min ?? "")}" placeholder="vazio = cálculo"></div><div class="fld"><label for="ex-mx">Máximo informado (MR$)</label><input id="ex-mx" inputmode="decimal" value="${esc(e.max ?? "")}" placeholder="vazio = cálculo"></div><div class="fld"><label for="ex-q">Qualificado informado (MR$)</label><input id="ex-q" inputmode="decimal" value="${esc(e.qual ?? "")}" placeholder="vazio = cálculo"></div>
        <div class="fld full"><label for="ex-o">Base legal, fundamento e recomendação</label><textarea id="ex-o" rows="3">${esc(e.obs || e.base || "")}</textarea></div></div>
        <div style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap">${id ? `<button type="button" class="btn ghost" id="ex-del">Excluir</button>` : "<span></span>"}<div style="display:flex;gap:8px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></div></form>`);
    const g = k => document.getElementById(k).value.trim(), nn = k => g(k) === "" ? null : num(g(k));
    $("#fex").onsubmit = ev => { ev.preventDefault(); const nid = id || "ex" + Date.now().toString(36);
      D.up(s, {dd:{expo:{[nid]:{titulo:g("ex-t") || "Exposição", area:g("ex-a"), aval:g("ex-v"), principal:nn("ex-p"), anoIni:+g("ex-i") || null, anoFim:+g("ex-f") || null, min:nn("ex-mn"), max:nn("ex-mx"), qual:nn("ex-q"), obs:g("ex-o"), proc:e.proc || null, em:nowISO(), por:Store.me?.email || ""}}}}).then(() => { close(); toast("Exposição salva"); }); };
    const del = $("#ex-del"); if (del) del.onclick = () => D.up(s, {dd:{expo:{[id]:{excluido:true}}}}).then(() => { close(); toast("Exposição excluída"); });
  }
  function bind(host, s, per){
    const a = $("#ex-add", host); if (a) a.onclick = () => form(s, per);
    $$("[data-exed]", host).forEach(b => b.onclick = () => form(s, per, b.dataset.exed));
    const sg = sugestoes(s, per); $$("[data-exsg]", host).forEach(b => b.onclick = () => form(s, per, null, sg[+b.dataset.exsg]));
  }

  /* ---------------- RELATÓRIO DE DUE DILIGENCE (estrutura Kinsey) ---------------- */
  async function ddPdf(s, per, modo = "completo"){
    const R = KT_REL, {T, capa, par, tab, kpisPdf} = R, P = KTPdf(), b = s.dd.bal[per], K = D.calc(b), AJ = D.ajustes(s, per), A = D.soma(AJ.filter(D.okFin)), I = D.indic(K, A), L = R.papeis(s, per);
    const prelim = L.some(p => p.tipo === "Mínimo do consultor" && p.st === "pendente") || AJ.some(D.pendFin), pj = s.projeto || {}, pd = pj.periodo || {}, ate = anoDB(s, per);
    const cliente = (s.investidores || []).map(i => supById(i)?.nome).filter(Boolean)[0] || "Cliente", cod = s.mandato?.codinome || s.nome, nRel = `${String(Date.now()).slice(-4)}-${new Date().getFullYear()}`;
    const br = d => d ? String(d).slice(0, 10).split("-").reverse().join("/") : "—", n2 = (v, x = 1e3) => v == null ? "—" : fmt(Math.round(v / x) || 0, 0);
    let ns = 0; const sec = t => { ns++; P.page(); P.h1(ns, T(t)); }, sub = t => { P.ensure(90); P.h2(T(t)); };
    capa(P, "Serviços de Due Diligence" + (s.dd?.wb ? " · completa" : " · prévia (balancetes e sistema)") + (prelim ? " · versão preliminar" : ""), s.nome, [["Cliente", cliente], ["Projeto", cod], ["Data-base", br(b.dataBase)], ["Relatório", `nº ${nRel}`], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    const G = window.KT_GRAF, EXg = lista(s).map(e => ({e, c:calc(e, ate)})), porArea = {}; EXg.forEach(({e, c}) => { porArea[AREA[e.area] || e.area] = (porArea[AREA[e.area] || e.area] || 0) + (c.max || 0); });
    const pontePer = q => [{l:"EBITDA reportado", v:q.k.ebitda, tipo:"base"}, ...q.ok.filter(a => Math.abs(D.soma([a]).ebitda) > 1).map(a => ({l:a.titulo, v:D.soma([a]).ebitda, tipo:"delta"})), {l:"EBITDA ajustado", v:q.k.ebitda + q.a.ebitda, tipo:"total"}];
    const graf = Q => { if (!G) return;
      if (EXg.length){ G.rosca(P, "Exposição máxima por área (MR$)", Object.entries(porArea).map(([l, v]) => ({l, v})), v => n2(v), [n2(EXg.reduce((a, x) => a + (x.c.max || 0), 0)), "MR$ máximo"]);
        G.barrasH(P, "Exposições por item · mínimo e máximo (MR$)", EXg.filter(x => x.c.max).map(({e, c}) => ({l:e.titulo, v:c.max, txt:`${fmtMil(c.min)} a ${fmtMil(c.max)}`, c:e.aval === "provavel" ? G.VERM : e.aval === "possivel" ? G.GOLD : G.VERDE})), v => n2(v)); }
      const ul = Q[Q.length - 1]; if (ul) G.cascata(P, `Ponte do EBITDA · ${ul.rot}`, pontePer(ul), v => mi(v, 1)); };
    if (modo === "resumo"){
      const pers0 = [...D.periodos(s).filter(p => /-12$/.test(p)).slice(-(pd.contabil || 3)), per].filter((x, i, a) => a.indexOf(x) === i).sort(), Q0 = pers0.map(p => { const bb = s.dd.bal[p], k = D.calc(bb), aj = D.ajustes(s, p), ok = aj.filter(D.okFin); return {p, k, ok, a:D.soma(ok), rot:p.slice(5) === "12" ? `Dez/${p.slice(2, 4)}` : `${p.slice(5)}/${p.slice(2, 4)}`}; });
      sec("Sumário executivo");
      par(P, `Due diligence ${prelim ? "preliminar " : ""}de ${s.nome} para ${cliente}: período fiscal e trabalhista de ${pd.fiscalDe ? br(pd.fiscalDe) + " a " + br(pd.fiscalAte) : "5 anos"} e saldos contábeis até ${br(b.dataBase)}.`, {size:10});
      const tt0 = k => EXg.reduce((a, x) => a + (x.c[k] || 0), 0);
      kpisPdf(P, [["Exposição mínima", `MR$ ${n2(tt0("min"))}`, `${EXg.length} itens`], ["Exposição máxima", `MR$ ${n2(tt0("max"))}`, "multa de ofício 75%"], ["EBITDA ajustado", mi(I.ebitda), `reportado ${mi(K.ebitda)}`], ["Dívida líquida ajustada", mi(I.dl), `reportada ${mi(K.dl)}`]]);
      graf(Q0);
      if (G) G.colunas(P, "EBITDA reportado × ajustado e margem ajustada", Q0.map(q => q.rot), [{n:"Reportado", v:Q0.map(q => q.k.ebitda), c:G.CINZA}, {n:"Ajustado", v:Q0.map(q => q.k.ebitda + q.a.ebitda), c:G.ACC}], v => mi(v, 1), {n:"Margem ajustada", v:Q0.map(q => (q.k.ebitda + q.a.ebitda) / (q.k.recLiq || 1))});
      if (window.KT_DEM) KT_DEM.resumo(P, s);
      if (window.KT_DDWB) KT_DDWB.impacto(P, s, per, {sec});
      sec("Principais pontos e recomendações");
      tab(P, ["Riscos e contingências (MR$)", "Mínimo", "Máximo", "Avaliação"], EXg.map(({e, c}, i) => [`${i + 1}. ${e.titulo}`, fmtMil(c.min), fmtMil(c.max), AVAL[e.aval] || "NQ"]), [.58, .14, .14, .14]);
      const ach0 = L.filter(p => p.st === "achado").slice(0, 10); if (ach0.length){ P.h2("Achados dos procedimentos"); ach0.forEach(p => par(P, `• ${D.areaNome(p.area)} · ${p.titulo}: ${p.resultado}`, {size:9})); }
      par(P, "Resumo para apresentação. O relatório completo traz carta, limitações, decadência, grupo econômico, balanço reclassificado, capital de giro, dívida líquida, procedimentos por área e equipe.", {size:8.5, color:[90,101,120]});
      await rptSave(P.out(`Due Diligence (resumo) · ${s.nome}`, T(`Kinsey · Due Diligence (resumo) · ${cod} · data-base ${br(b.dataBase)} · confidencial`)), R.arq(s, "due_diligence_resumo", "pdf"), "application/pdf"); return; }
    sec("Mensagem importante a pessoas não autorizadas");
    par(P, `Este memorando${prelim ? " preliminar" : ""} de due diligence é somente para informação e uso interno de ${cliente} ("Cliente"), em conexão com a due diligence financeira e contábil, tributária, trabalhista e previdenciária de ${s.nome}. ${prelim ? "Itens pendentes aparecem entre colchetes e dependem de documentação ainda não disponibilizada pela administração do target; reservamo-nos o direito de alterar o conteúdo. " : ""}Além do Cliente, nenhuma outra parte deve ter acesso a este documento, total ou parcial, sem autorização escrita da Kinsey. ${pj.ddJur === "cliente" ? "Este memorando não contempla os resultados da due diligence legal, em execução pelos assessores jurídicos do Cliente, que podem impactar os comentários apresentados. " : ""}Apenas a cópia final assinada deve ser considerada definitiva.`);
    sub("Carta de apresentação");
    const fisc = pd.fiscalDe ? `${br(pd.fiscalDe)} a ${br(pd.fiscalAte)}` : `01/01/${ate - 5} a ${br(b.dataBase)}`, anuais = D.periodos(s).filter(p => /-12$/.test(p)).slice(-(pd.contabil || 3)).map(p => p.slice(0, 4));
    par(P, `A Kinsey foi contratada por ${cliente} para preparar um relatório de due diligence de ${s.nome} ("Target"), com o levantamento de riscos e contingências tributários, trabalhistas e previdenciários${pj.ddJur === "kinsey" ? " e legais" : ""} para o período de ${fisc}, e a revisão dos saldos contábeis e financeiros dos exercícios ${anuais.join(", ") || "disponíveis"} e da data-base de ${br(b.dataBase)}. O escopo, o objetivo, a metodologia, os resultados e as limitações dos trabalhos estão descritos a seguir.`);
    const eq = [pj.socio, ...Object.values(s.dd.cons || {})].filter(Boolean); par(P, `Responsáveis: ${[...new Set(eq)].join(" · ") || "equipe de M&A da Kinsey"}.`, {size:9});
    sub("Objetivo e limitações");
    par(P, "Os procedimentos não constituem: (a) auditoria, revisão ou compilação das demonstrações financeiras; (b) exame de informação financeira prospectiva; (c) avaliação da empresa ou de seus ativos e passivos; (d) exame dos controles internos; e (e) trabalho destinado a detectar erros, fraudes ou atos ilícitos. Não expressamos opinião ou outra forma de garantia. A decisão de consumar a transação cabe somente ao Cliente.", {size:9.5});
    par(P, "Não foram realizados procedimentos significativos sobre seguros, avaliação de mercado e capacidade operacional, informações prospectivas, interpretação jurídica, testes informatizados e meio ambiente, salvo quando indicado. Os trabalhos limitaram-se aos dados e às informações da administração; quanto a litígios, a entendimentos gerais e às respostas dos consultores jurídicos.", {size:9.5});
    sec("Índice"); [...(window.KT_DDWB ? ["Painel executivo e red flags"] : []), "Sumário executivo das potenciais exposições", "Decadência dos riscos", "Informações sobre o grupo econômico", "Aspectos contábeis e financeiros", "Performance do negócio (EBITDA, capital de giro e dívida líquida)", "Demonstrações financeiras históricas", "Análise do EBITDA, do capital de giro e do endividamento líquido", "Ajustes da diligência e demonstrações pro forma", "Aspectos tributários", "Aspectos trabalhistas e previdenciários", ...(window.KT_DDWB ? ["Impacto na negociação"] : []), "Pontos e recomendações", "Limitações de escopo e equipe"].forEach((t, i) => par(P, `${i + 4}. ${t}`));
    if (window.KT_DDWB) KT_DDWB.painel(P, s, per, {sec});
    /* sumário das exposições */
    const EX = lista(s).map(e => ({e, c:calc(e, ate)})), tt = k => EX.reduce((a, x) => a + (x.c[k] || 0), 0);
    sec("Sumário executivo das potenciais exposições");
    kpisPdf(P, [["Exposição mínima", `MR$ ${n2(tt("min"))}`, "multa de mora 20% + Selic"], ["Exposição máxima", `MR$ ${n2(tt("max"))}`, "multa de ofício 75%"], ["EBITDA ajustado", mi(I.ebitda), `reportado ${mi(K.ebitda)}`], ["Dívida líquida ajustada", mi(I.dl), `reportada ${mi(K.dl)}`]]);
    tab(P, ["Riscos e contingências (MR$)", "Área", "Mínimo", "Máximo", "Qualif.", "Avaliação"], [...EX.map(({e, c}, i) => [`${i + 1}. ${e.titulo}${c.decaido ? " (decaído)" : ""}`, AREA[e.area] || e.area, fmtMil(c.min), fmtMil(c.max), fmtMil(c.qual), AVAL[e.aval] || "NQ"]), ["Total geral", "", n2(tt("min")), n2(tt("max")), n2(tt("qual")), ""]], [.42, .13, .11, .11, .11, .12]);
    if (G && EXg.length){ G.rosca(P, "Exposição máxima por área (MR$)", Object.entries(porArea).map(([l, v]) => ({l, v})), v => n2(v), [n2(tt("max")), "MR$ máximo"]); G.barrasH(P, "Exposições por item · mínimo e máximo (MR$)", EXg.filter(x => x.c.max).map(({e, c}) => ({l:e.titulo, v:c.max, txt:`${fmtMil(c.min)} a ${fmtMil(c.max)}`, c:e.aval === "provavel" ? G.VERM : e.aval === "possivel" ? G.GOLD : G.VERDE})), v => n2(v)); }
    par(P, "Metodologia (regra geral): pagamento espontâneo com multa de 20% (Lei 9.430/96, art. 61); auto de infração com multa de 75% (art. 44, I); multa qualificada de 150% quando a operação é considerada evasão (art. 44, §1º); atualização pela Selic. MR$ = milhares de reais; NQ = não quantificado; NA = não aplicável.", {size:8.5, color:[90,101,120]});
    sec("Decadência dos riscos");
    par(P, `Em regra (Código Civil e CTN, art. 150, §4º e art. 173), o fisco tem 5 anos para constituir o crédito tributário a partir do fato gerador; nas verbas trabalhistas a prescrição é de 5 anos no curso do contrato (CF, art. 7º, XXIX). Valores em MR$ por ano do fato gerador, com a data em que deixam de ser exigíveis.`, {size:9.5});
    const anosT = [...new Set(EX.flatMap(x => x.c.anos.map(a => a.y)))].sort();
    if (anosT.length) tab(P, ["Item", ...anosT.map(String)], EX.map(({e, c}, i) => [`${i + 1}. ${e.titulo}`.slice(0, 48), ...anosT.map(y => { const a = c.anos.find(z => z.y === y); return !a ? "" : a.dec ? "decaído" : !e.principal ? "NQ" : `${n2(a.pr + a.j)} (${a.decaiEm.slice(6)})`; })]), [.34, ...anosT.map(() => .66 / anosT.length)]);
    /* grupo econômico */
    sec("Informações sobre o grupo econômico"); const rf = s.receita || {};
    tab(P, ["Item", "Informação"], [["Razão social", rf.razao || s.nome], ["CNPJ", s.doc || "—"], ["Situação na Receita", rf.situacao || "—"], ["Abertura", rf.abertura || "—"], ["Atividade principal", `${rf.cnae || ""} ${rf.cnaeDesc || s.segmento || ""}`.trim() || "—"], ["Localização", [s.municipio, s.uf].filter(Boolean).join(" / ") || "—"], ["Capital social", rf.capital ? mi(+rf.capital) : "—"], ["Regime tributário", s.perfil?.regime || "—"], ["Perímetro da transação", s.mandato?.participacao ? `${s.mandato.participacao} do capital` : "a definir"]], [.3, .7]);
    if ((rf.socios || []).length){ sub("Quadro societário"); tab(P, ["Sócio", "Qualificação", "Desde"], rf.socios.map(q => [q.nome, q.qual, br(q.desde)]), [.5, .3, .2]); }
    /* balanço reclassificado e performance por período */
    const pers = [...D.periodos(s).filter(p => /-12$/.test(p)).slice(-(pd.contabil || 3)), per].filter((x, i, a) => a.indexOf(x) === i).sort(), Q = pers.map(p => { const bb = s.dd.bal[p], k = D.calc(bb), aj = D.ajustes(s, p), ok = aj.filter(D.okFin), a = D.soma(ok);
      const capex = (k.G.imobilizado || 0) + (k.G.deprec || 0) + (k.G.intangivel || 0); return {p, k, aj, ok, a, capex, outros:k.PL + k.dl - k.ncg - capex, rot:p.slice(5) === "12" ? `Dez/${p.slice(2, 4)}` : `${p.slice(5)}/${p.slice(2, 4)}`}; });
    const cols = ["R$ mil", ...Q.map(q => q.rot)], w = [.4, ...Q.map(() => .6 / Q.length)];
    sec("Aspectos contábeis e financeiros");
    par(P, "Balanço patrimonial reclassificado nas visões usadas na negociação: capital de giro, endividamento líquido, ativos de longo prazo (capex) e outros ativos e passivos.", {size:9.5});
    tab(P, cols, [["Capital de giro líquido", ...Q.map(q => n2(q.k.ncg))], ["Imobilizado e intangível (capex)", ...Q.map(q => n2(q.capex))], ["Outros ativos e passivos, líquidos", ...Q.map(q => n2(q.outros))], ["(−) Dívida líquida", ...Q.map(q => n2(-q.k.dl))], ["Patrimônio líquido", ...Q.map(q => n2(q.k.PL))], ["Ativo total", ...Q.map(q => n2(q.k.AT))]], w);
    sec("Performance do negócio");
    sub("EBITDA reportado e ajustado");
    if (G){ G.colunas(P, "EBITDA reportado × ajustado e margem ajustada", Q.map(q => q.rot), [{n:"Reportado", v:Q.map(q => q.k.ebitda), c:G.CINZA}, {n:"Ajustado", v:Q.map(q => q.k.ebitda + q.a.ebitda), c:G.ACC}], v => mi(v, 1), {n:"Margem ajustada", v:Q.map(q => (q.k.ebitda + q.a.ebitda) / (q.k.recLiq || 1))}); G.cascata(P, `Ponte do EBITDA · ${Q[Q.length - 1].rot}`, pontePer(Q[Q.length - 1]), v => mi(v, 1)); }
    const adds = [...new Set(Q.flatMap(q => q.ok.filter(a => D.soma([a]).ebitda).map(a => a.titulo)))];
    tab(P, cols, [["Receita líquida", ...Q.map(q => n2(q.k.recLiq))], ["EBITDA reportado", ...Q.map(q => n2(q.k.ebitda))], ...adds.map(t => [`(+/−) ${t}`.slice(0, 60), ...Q.map(q => { const a = q.ok.find(x => x.titulo === t); return a ? n2(D.soma([a]).ebitda) : "—"; })]), ["EBITDA ajustado", ...Q.map(q => n2(q.k.ebitda + q.a.ebitda))], ["Margem EBITDA ajustada", ...Q.map(q => pc((q.k.ebitda + q.a.ebitda) / (q.k.recLiq || 1)))]], w);
    sub("Capital de giro líquido");
    tab(P, cols, [["Capital de giro reportado", ...Q.map(q => n2(q.k.ncg))], ["(+/−) Ajustes de due diligence", ...Q.map(q => n2(q.a.ncg))], ["Capital de giro ajustado", ...Q.map(q => n2(q.k.ncg + q.a.ncg))], ["Prazo médio de recebimento (dias)", ...Q.map(q => fmt(q.k.pmr, 0))], ["Prazo médio de estocagem (dias)", ...Q.map(q => fmt(q.k.pme, 0))], ["Prazo médio de pagamento (dias)", ...Q.map(q => fmt(q.k.pmp, 0))]], w);
    sub("Dívida líquida");
    if (G){ const u = Q[Q.length - 1]; G.cascata(P, `Dívida líquida · ${u.rot}`, [{l:"Empréstimos e financiamentos", v:u.k.divBruta, tipo:"base"}, {l:"Caixa", v:-u.k.caixa, tipo:"delta"}, {l:"Itens equivalentes a dívida", v:u.a.divida, tipo:"delta"}, {l:"Dívida líquida ajustada", v:u.k.dl + u.a.divida, tipo:"total"}].filter(p => p.tipo !== "delta" || Math.abs(p.v) > 1), v => mi(v, 1)); }
    tab(P, cols, [["Empréstimos e financiamentos", ...Q.map(q => n2(q.k.divBruta))], ["(−) Caixa e equivalentes", ...Q.map(q => n2(-q.k.caixa))], ["Dívida líquida reportada", ...Q.map(q => n2(q.k.dl))], ["(+) Itens equivalentes a dívida (due diligence)", ...Q.map(q => n2(q.a.divida))], ["Dívida líquida ajustada", ...Q.map(q => n2(q.k.dl + q.a.divida))], ["Dívida líquida / EBITDA ajustado", ...Q.map(q => fmt((q.k.dl + q.a.divida) / ((q.k.ebitda + q.a.ebitda) || 1), 1) + "x")]], w);
    if (window.KT_DEM) KT_DEM.historico(P, s, {sec});
    /* tributário e trabalhista */
    [["tributaria", "Aspectos tributários", ["tributaria"]], ["trabalhista", "Aspectos trabalhistas e previdenciários", ["trabalhista", "previdenciaria"]]].forEach(([area, tit, ars]) => { sec(tit);
      if (area === "tributaria") par(P, `Sucessão de direitos e deveres: o adquirente de fundo de comércio ou de participação responde pelos tributos devidos até a data do ato (CTN, arts. 132 e 133). Regime do target: ${s.perfil?.regime || "não informado"}.`, {size:9.5});
      const ex = EX.filter(x => ars.includes(x.e.area)); if (ex.length){ sub("Exposições"); ex.forEach(({e, c}) => { P.ensure(70); P.h2(T(`${e.titulo} · ${AVAL[e.aval] || "NQ"}`)); par(P, e.obs || "", {size:9.5}); par(P, `Principal MR$ ${e.principal ? n2(+e.principal) : "NQ"} · mínimo ${fmtMil(c.min)} · máximo ${fmtMil(c.max)} · qualificado ${fmtMil(c.qual)} (MR$)`, {size:9, color:[90,101,120]}); }); }
      sub("Procedimentos executados"); tab(P, ["Código", "Procedimento", "Resultado"], L.filter(p => p.area === area && p.tipo !== "Ajuste").map(p => [p.cod, p.titulo, `${p.st === "achado" ? "Achado" : p.st === "ok" ? "Sem achado" : p.st}: ${p.resultado}`]), [.12, .33, .55]); });
    if (window.KT_DDWB) KT_DDWB.impacto(P, s, per, {sec});
    sec("Pontos e recomendações");
    const ach = L.filter(p => p.st === "achado"); tab(P, ["Item", "Área", "Descrição e recomendação"], ach.map((p, i) => [String(i + 1), D.areaNome(p.area), `${p.titulo}: ${p.resultado}`]), [.08, .14, .78]);
    if (!ach.length) par(P, "Sem pontos de recomendação registrados.");
    if (window.KT_DDWB) KT_DDWB.anexos(P, s, {sec});
    sec("Limitações de escopo e equipe");
    par(P, `${prelim ? "Versão preliminar: há procedimentos mínimos pendentes ou ajustes sem o OK do consultor. " : ""}Os ajustes com OK do consultor foram incorporados às Análises financeiras${AJ.some(D.okVal) ? " e ao valuation" : ""}. Os papéis de trabalho que suportam cada ponto estão em documento separado.`);
    sub("Executivos envolvidos no projeto"); tab(P, ["Nome", "Função"], [...(typeof EQUIPE_KINSEY !== "undefined" ? EQUIPE_KINSEY : []).map(([n, f]) => [n, f]), ...Object.entries(s.dd.cons || {}).filter(([, v]) => v).map(([a, v]) => [v, "Consultor · " + D.areaNome(a)])], [.45, .55]);
    await rptSave(P.out(`Due Diligence · ${s.nome}`, T(`Kinsey · Relatório de Due Diligence · ${cod} · data-base ${br(b.dataBase)} · confidencial`)), R.arq(s, "due_diligence", "pdf"), "application/pdf");
  }
  window.KT_EXP = {calc, lista, view, bind, ddPdf, sugestoes, SELIC};
})();
