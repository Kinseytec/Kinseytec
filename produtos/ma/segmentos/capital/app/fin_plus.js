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
  async function reprocessar(s, avisar){
    s = supById(s.id) || s; const L = candidatos(s); if (!L.length) return {lidos:0, aplicados:0};
    const R = [];
    for (const e of L){ try{ const r0 = await fetch(e.url); if (!r0.ok) continue; const blob = await r0.blob(), nome = e.nome || `documento.${/pdf/.test(blob.type) ? "pdf" : "xlsx"}`;
        const r = await KT_DOCS.ler(new File([blob], nome, {type:e.mime || blob.type})); if (FIN.includes(r.tipo) && (r.contas || r.contasDRE)) R.push(r); }catch(err){ console.warn("reprocessar", e.nome, err); } }
    const ordem = {balancete:0, balanco:1, dre:2}; R.sort((a, b) => ordem[a.tipo] - ordem[b.tipo] || String(a.periodo?.fim || "").localeCompare(String(b.periodo?.fim || "")));
    let n = 0; for (const r of R){ try{ await KT_DOCS.aplicar(supById(s.id) || s, r, {semArquivo:true}); n++; }catch(err){ console.warn(err); } }
    await Store.update("suppliers", s.id, {dd:{reproc:{em:nowISO(), lidos:L.length, aplicados:n}}}).catch(() => {});
    if (n && S.ddSel === s.id) S.ddPer = ""; /* abre no período mais recente */
    if (avisar) toast(n ? `${n} documento(s) financeiro(s) do dossiê levados à Due Diligence` : "Nenhum balanço, DRE ou balancete legível entre os documentos do dossiê");
    return {lidos:L.length, aplicados:n};
  }
  function auto(view){
    const host = $("#" + view), s = D.alvoSel(); if (!host || !s || D.temBal(s) || S_R[s.id] || s.dd?.reproc?.aplicados === 0 && s.dd.reproc.lidos >= candidatos(s).length) return;
    const L = candidatos(s); if (!L.length) return; S_R[s.id] = true;
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
  /* seções para os PDFs (relatório de análises e apresentação depois do NDA) */
  function secoesPdf(P, s, sec, o = {}){
    const R = window.KT_REL, L = pontos(s).filter(x => !o.semAjustes || x.area !== "Ajuste de EBITDA"), Q = ppa(s);
    if (Q){ sec("Valor e PPA estimado"); R.tab(P, ["Item", "Valor estimado", "Critério"], [["Preço de referência", mi(Q.preco), Q.fonte || "faixa moderada do valuation"], ["Marca", mi(Q.marca), "royalty evitado (relief-from-royalty)"], ["Carteira de clientes", mi(Q.carteira), "excesso de lucro (MPEEM)"], ...(Q.contratos ? [["Contratos e exclusividade", mi(Q.contratos), "excesso de lucro no prazo contratual"]] : []), ["Goodwill estimado", mi(Q.goodwill), "residual (CPC 15)"]], [.34, .22, .44]);
      R.par(P, "Estimativas indicativas para uma aquisição, com os critérios do PPA Kinsey; o laudo de PPA é emitido em Pós-aquisição.", {size:8, color:[90,101,120]}); }
    if (L.length){ sec("Principais pontos da diligência"); R.tab(P, ["Área", "Ponto", "Detalhe"], L.slice(0, 14).map(x => [x.area, x.t, x.txt]), [.18, .32, .5]); }
  }
  window.KT_FINX = {reprocessar, candidatos, pontos, ppa, secoesPdf};
})();
