/* ================= KINSEY CAPITAL · ANÁLISES FINANCEIRAS LIGADAS =================
   - Documentos financeiros já guardados no dossiê (balanço, DRE, balancete) e que ainda não viraram balancete na Due
     Diligence são lidos de novo, sozinhos, ao abrir Análises financeiras, Due Diligence ou Valuation;
   - Análises financeiras ganham os principais pontos da diligência (achados automáticos, ajustes, exposições e
     contingências jurídicas) e as estimativas do PPA (marca, carteira de clientes, contratos e goodwill);
   - o relatório de análises financeiras e a apresentação depois do NDA trazem as mesmas seções. */
if (window.KT_DD && window.KT_DOCS) (() => {
  const D = KT_DD, FIN = ["balanco", "dre", "balancete"];
  const mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e6, Math.abs(v) >= 1e8 ? 0 : 1)} mi`;
  const S_R = {};
  /* ---------- reprocessar os documentos do dossiê ---------- */
  const candidatos = s => S.evidences.filter(e => e.supplierId === s.id && e.url && /pdf|sheet|excel|csv|xml|text/i.test(`${e.mime || ""} ${e.nome || ""}`) && !/\.(jpe?g|png|heic)$/i.test(e.nome || "")
    && !/nda|mandato|contrato social|certid|cnd|alvar|licen|spa|mou|procura/i.test(`${e.tipo || ""} ${e.nome || ""}`)).slice(0, 25);
  const novos = s => { const lid = s.dd?.lidos || {}; return candidatos(s).filter(e => !lid[e.id]); };
  async function reprocessar(s, avisar, todos){
    s = supById(s.id) || s; const L = todos ? candidatos(s) : novos(s); if (!L.length) return {lidos:0, aplicados:0};
    const R = [];
    for (const e of L){ try{ const r0 = await fetch(e.url); if (!r0.ok) continue; const blob = await r0.blob(), nome = e.nome || `documento.${/pdf/.test(blob.type) ? "pdf" : "xlsx"}`;
        const r = await KT_DOCS.ler(new File([blob], nome, {type:e.mime || blob.type})); if (FIN.includes(r.tipo) && (r.contas || r.contasDRE)) R.push(r); }catch(err){ console.warn("reprocessar", e.nome, err); } }
    const ordem = {balancete:0, balanco:1, dre:2}; R.sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || String(a.periodo?.fim || "").localeCompare(String(b.periodo?.fim || "")));
    let n = 0; for (const r of R){ try{ await KT_DOCS.aplicar(supById(s.id) || s, r, {semArquivo:true}); n++; }catch(err){ console.warn(err); } }
    await Store.update("suppliers", s.id, {dd:{reproc:{em:nowISO(), lidos:L.length, aplicados:n}, lidos:Object.fromEntries(L.map(e => [e.id, nowISO()]))}}).catch(() => {});
    if (n && S.ddSel === s.id) S.ddPer = ""; /* abre no período mais recente */
    if (avisar) toast(n ? `${n} documento(s) financeiro(s) do dossiê levados à Due Diligence` : "Nenhum balanço, DRE ou balancete legível entre os documentos do dossiê");
    return {lidos:L.length, aplicados:n};
  }
  function auto(view){
    const host = $("#" + view), s = D.alvoSel(); if (!host || !s || S_R[s.id]) return;
    const L = novos(s); if (!L.length) return; S_R[s.id] = true;
    const ban = document.createElement("div"); ban.className = "banner"; ban.id = "fx-reproc"; ban.innerHTML = `<b>Lendo ${L.length} documento(s) já guardados no dossiê de ${esc(s.nome)}</b> (balanço, DRE e balancetes) para montar as análises…`;
    (host.querySelector(".dd-split > div:last-child") || host).prepend(ban);
    reprocessar(s, true).then(() => renderView()).catch(() => { ban.textContent = "Não foi possível ler os documentos do dossiê."; });
  }
  ["financas", "auditoria", "valuation"].forEach(v => { if (v === "auditoria" && typeof renderAuditoria === "function"){ const _a = renderAuditoria; renderAuditoria = function(){ const r = _a.apply(this, arguments); try{ auto("auditoria"); }catch(e){} return r; }; }
    else if (EXT_VIEWS[v]){ const _v = EXT_VIEWS[v]; EXT_VIEWS[v] = function(){ const r = _v.apply(this, arguments); try{ auto(v); }catch(e){} return r; }; } });

  /* ---------- pontos da diligência e PPA estimado ---------- */
  function pontos(s){
    const per = D.periodos(s)[0]; if (!per) return [];
    const b = s.dd.bal[per], K = D.calc(b), L = [];
    D.PROCS.forEach(p => { try{ const r = p.f(K, b, s); if (r?.st === "achado") L.push({area:D.areaNome(p.area), t:p.t, txt:r.txt}); }catch(e){} });
    D.ajustes(s, per).filter(a => Math.abs(a.v?.ebitda || 0) > 1).slice(0, 6).forEach(a => L.push({area:"Ajuste de EBITDA", t:a.titulo, txt:`${D.efeitoTxt(a)}${D.okFin(a) ? "" : " (aguardando OK do consultor)"}`}));
    try{ if (window.KT_EXP){ const ate = +String(s.perfil?.dataBase || per).slice(0, 4); KT_EXP.lista(s).forEach(e => { const c = KT_EXP.calc(e, ate); if (c.max) L.push({area:"Exposição", t:e.titulo, txt:`de ${mi(c.min)} a ${mi(c.max)} · ${{provavel:"provável", possivel:"possível", remota:"remota"}[e.aval] || "a avaliar"}`}); }); } }catch(e){}
    try{ if (window.KT_JDD){ const cg = KT_JDD.contingencias(s); if (cg.n) L.push({area:"Jurídico", t:`${cg.n} processo(s)`, txt:`provável ${mi(cg.provavel)} · possível ${mi(cg.possivel)} · remota ${mi(cg.remota)}`}); } }catch(e){}
    return L;
  }
  function ppa(s){ try{ if (!window.KT_POS || !D.temBal(s)) return null; const P = KT_POS.ppa(s); if (!P) return null;
      return {preco:P.preco, marca:P.vM || 0, carteira:P.vC || 0, contratos:P.vK || 0, tecnologia:P.vT || 0, naoConc:P.vNc || 0, imob:P.imobMV || 0, goodwill:P.goodwill, fonte:P.fonte}; }catch(e){ return null; } }
  function cardHtml(s){
    const L = pontos(s), P = ppa(s); let R = null; try{ R = KT_VAL.resumo(s); }catch(e){}
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    return `<div class="card" id="fx-card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Valor, PPA estimado e pontos da diligência</h3>
      ${R?.rec ? `<div class="dd-kpis">${k("Valuation (faixa)", `${mi(R.rec[0])} a ${mi(R.rec[1])}`, "enterprise value")}${k("FCD moderado", `${mi(R.mod.min)} a ${mi(R.mod.max)}`, `WACC ${fmt(R.X.W.wacc * 100, 2)}%`)}${R.X.W ? k("Beta do setor", fmt(R.X.W.bu, 2), `${esc(R.X.W.seg)} · realavancado ${fmt(R.X.W.bl, 2)}`) : ""}</div>` : ""}
      ${P ? `<div class="eyebrow" style="margin-top:2px">PPA estimado numa aquisição (CPC 15)</div><div class="dd-kpis">${k("Marca", mi(P.marca), "royalty evitado")}${k("Carteira de clientes", mi(P.carteira), "excesso de lucro")}${P.contratos ? k("Contratos e exclusividade", mi(P.contratos), "") : ""}${k("Goodwill estimado", mi(P.goodwill), `preço ${mi(P.preco)}`)}</div>
        <p class="sub" style="margin:0;font-size:12px">Estimativas indicativas com os critérios do PPA Kinsey sobre o valuation (${esc(P.fonte || "faixa moderada")}); o PPA definitivo fica em Pós-aquisição.</p>` : ""}
      <div class="eyebrow" style="margin-top:2px">Principais pontos da diligência</div>
      ${L.length ? `<ul style="margin:0;padding-left:18px;font-size:13px;display:flex;flex-direction:column;gap:4px">${L.slice(0, 12).map(x => `<li><b>${esc(x.area)}:</b> ${esc(x.t)} · <span class="sub">${esc(x.txt)}</span></li>`).join("")}</ul>` : `<p class="sub" style="margin:0">Nenhum achado automático no balancete.</p>`}</div>`;
  }
  if (EXT_VIEWS.financas){ const _f = EXT_VIEWS.financas; EXT_VIEWS.financas = function(){ const r = _f.apply(this, arguments); const host = $("#financas"), s = D.alvoSel(); if (!host || !s || !D.temBal(s) || $("#fx-card", host)) return r;
      try{ const w = document.createElement("div"); w.innerHTML = cardHtml(s); const first = host.querySelector(".dd-split > div:last-child > .card"); if (first) first.after(w.firstElementChild); }catch(e){ console.error(e); } return r; }; }
  /* ---------- Valuation: EV → dívida líquida → equity no topo, com a composição da dívida e os relatórios ---------- */
  function topoVal(s){
    const V = KT_VAL, R = V.resumo(s), X = R.X; if (!X || X.vazio || !R.rec) return "";
    const pt = X.pt, ok = V.podeEmitir ? V.podeEmitir(R.A) : true, nb = (R.A || []).filter(a => a.nivel === "bloqueio" || a.nivel === "justificar" && !a.ok).length;
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const grupos = {}; pt.L.forEach(x => (grupos[x.grupo] ||= []).push(x));
    return `<div class="card" id="vx-topo" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Valor da empresa · base ${esc(X.perBase || "")}</div><h3 style="margin:0">Enterprise value, dívida líquida e equity value</h3></div></div>
      <div class="dd-kpis">${k("Enterprise value", `${mi(R.rec[0])} a ${mi(R.rec[1])}`, "FCD e múltiplos de mercado (faixa moderada)")}${k("(−) Dívida líquida", mi(pt.total), `balancete ${mi(pt.reportada)}${Math.abs(pt.total - pt.reportada) > 1 ? " + equivalentes e ajustes" : ""}`)}${k("= Equity value", `${mi(R.rec[0] - pt.total)} a ${mi(R.rec[1] - pt.total)}`, "valor para os sócios")}</div>
      <details><summary style="cursor:pointer;font-size:13px"><b>+</b> Composição da dívida líquida (${pt.L.filter(x => x.inc).length} item(ns))</summary>
        <div class="tbl" style="margin-top:6px"><table><tbody>${Object.entries(grupos).map(([g, L]) => `<tr><td colspan="2" class="eyebrow" style="padding-top:8px">${esc(g)}</td></tr>${L.map(x => `<tr style="${x.inc ? "" : "opacity:.5"}"><td style="font-size:12.5px">${esc(x.rot)}<div class="sub" style="margin:0;font-size:11px">${esc(x.origem || "")}${x.inc ? "" : " · fora do cálculo"}</div></td><td class="dd-num">${mi(x.v)}</td></tr>`).join("")}`).join("")}
          <tr><td><b>Dívida líquida ajustada</b></td><td class="dd-num"><b>${mi(pt.total)}</b></td></tr></tbody></table></div>
        <p class="sub" style="margin:4px 0 0;font-size:12px">Caixa e aplicações entram com sinal negativo. Para incluir, excluir ou ajustar itens (parcelamentos, mútuos, provisões, caixa mínimo), use a aba "Dívida líquida".</p></details>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn primary" data-vxr="pdf" ${ok ? "" : "disabled"}>Relatório de valuation (PDF)</button><button type="button" class="btn" data-vxr="pptx" ${ok ? "" : "disabled"}>Relatório de valuation (PowerPoint)</button>${ok ? "" : `<button type="button" class="btn sm ghost" data-vxr="pend">${nb} ponto(s) a resolver antes de emitir</button>`}</div></div>`;
  }
  function semBalVal(s){
    return `<div class="card" id="vx-topo" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:0">Relatório de valuation</h3><p class="sub" style="margin:0">O valuation completo (fluxo de caixa descontado, múltiplos de mercado, dívida líquida pelo balancete e equity value) e o relatório em PDF e PowerPoint saem sozinhos assim que os balanços de ${esc(s.nome)} estiverem no sistema.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${Store.me?.canWrite !== false ? `<button type="button" class="btn primary" data-vxr="imp">Importar balanços</button>` : ""}<button type="button" class="btn" disabled>Relatório (PDF)</button><button type="button" class="btn" disabled>Relatório (PowerPoint)</button></div></div>`;
  }
  if (EXT_VIEWS.valuation){ const _vv = EXT_VIEWS.valuation; EXT_VIEWS.valuation = function(){ const r = _vv.apply(this, arguments); const host = $("#valuation"), s = D.alvoSel();
      if (!host || !s || S.valTab === "base" || $("#vx-topo", host)) return r;
      try{ const col = host.querySelector(".dd-split > div:last-child"); if (!col) return r; const temB = D.temBal(s), html = temB ? (S.valTab === "divida" || S.valTab === "rel" ? "" : topoVal(s)) : semBalVal(s); if (!html) return r;
        const w = document.createElement("div"); w.innerHTML = html; const el = w.firstElementChild, first = col.firstElementChild; if (temB && first) first.after(el); else col.prepend(el);
        $$("[data-vxr]", el).forEach(b => b.onclick = async () => { const k = b.dataset.vxr;
          if (k === "imp") return window.KT_DOCS?.importar(s.id); if (k === "pend"){ S.valTab = "sintese"; renderView(); return; }
          const R = KT_VAL.resumo(s), emite = async md => { await KT_REL.valuation(s, k, md); await D.up(s, {dd:{vl:{emissoes:{["e" + Date.now().toString(36)]:{em:nowISO(), fmt:k, por:Store.me?.email || "", faixa:`${mi(R.rec[0])} a ${mi(R.rec[1])}`}}}}}); };
          try{ if (k === "pdf" && window.KT_GRAF) KT_GRAF.modo("Valuation · " + s.nome, emite); else await emite("completo"); }catch(e){ console.error(e); toast("Não foi possível gerar o relatório."); } }); }catch(e){ console.error(e); }
      return r; }; }
  /* seções para os PDFs (relatório de análises e apresentação depois do NDA) */
  function secoesPdf(P, s, sec, o = {}){
    const R = window.KT_REL, L = pontos(s).filter(x => !o.semAjustes || x.area !== "Ajuste de EBITDA"), Q = ppa(s);
    if (Q){ sec("Valor e PPA estimado"); R.tab(P, ["Item", "Valor estimado", "Critério"], [["Preço de referência", mi(Q.preco), Q.fonte || "faixa moderada do valuation"], ["Marca", mi(Q.marca), "royalty evitado (relief-from-royalty)"], ["Carteira de clientes", mi(Q.carteira), "excesso de lucro (MPEEM)"], ...(Q.contratos ? [["Contratos e exclusividade", mi(Q.contratos), "excesso de lucro no prazo contratual"]] : []), ["Goodwill estimado", mi(Q.goodwill), "residual (CPC 15)"]], [.34, .22, .44]);
      R.par(P, "Estimativas indicativas para uma aquisição, com os critérios do PPA Kinsey; o laudo de PPA é emitido em Pós-aquisição.", {size:8, color:[90,101,120]}); }
    if (L.length){ sec("Principais pontos da diligência"); R.tab(P, ["Área", "Ponto", "Detalhe"], L.slice(0, 14).map(x => [x.area, x.t, x.txt]), [.18, .32, .5]); }
  }
  /* dossiê: ao abrir, lê os documentos que ainda não viraram números (balanços, DRE, balancetes) */
  if (typeof renderSupBody === "function"){ const _r = renderSupBody;
    renderSupBody = function(){ const r = _r.apply(this, arguments); try{ const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || s.nivel !== "N3" || S_R[s.id] || Store.me?.canWrite === false) return r;
      const L = novos(s); if (!L.length) return r; S_R[s.id] = true; const ban = document.createElement("div"); ban.className = "banner"; ban.id = "fx-reproc-dos"; ban.innerHTML = `<b>Lendo ${L.length} documento(s) do dossiê</b> (balanços, DRE e balancetes) para o resumo, as análises, a Due Diligence e o valuation…`; b.prepend(ban);
      reprocessar(s, true).then(() => { if (S.openSup === s.id){ try{ renderSupBody(); }catch(e){} } }).catch(() => { ban.textContent = "Não foi possível ler os documentos do dossiê."; }); }catch(e){} return r; }; }
  window.KT_FINX = {reprocessar, novos, candidatos, pontos, ppa, secoesPdf};
})();
