/* ================= KINSEY CAPITAL · HONORÁRIOS DOS MANDATOS =================
   Modelo Kinsey de remuneração (Jurídico): retainer mensal, success fee escalonado por faixa do valor da operação
   (enterprise value), fee mínimo, abatimento do retainer, período de cauda (tail) e participação do parceiro
   originador. Um modelo para venda (sell-side) e outro para compra (buy-side). Valores provisórios até a Kinsey
   gravar os oficiais. Estimativa por mandato com a faixa do valuation e o acordo do intermediador. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const PADRAO = {
    venda:{retainer:25000, meses:9, abate:true, minimo:1.5e6, tail:12, parceiro:20, faixas:[[50e6, 5], [100e6, 4], [200e6, 3], [null, 2]], despesas:"Reembolso de despesas aprovadas previamente"},
    compra:{retainer:20000, meses:6, abate:true, minimo:1e6, tail:12, parceiro:20, faixas:[[50e6, 4], [100e6, 3], [200e6, 2.5], [null, 2]], despesas:"Reembolso de despesas aprovadas previamente"}
  };
  const modelo = lado => ({...PADRAO[lado], ...(S.config.fees_kinsey?.[lado] || {})});
  const oficial = () => !!S.config.fees_kinsey?.em;
  const mil = v => "R$ " + fmt(v / 1e3, 0) + " mil";
  function calcula(ev, lado, o = {}){
    const M = modelo(lado); let rest = ev, base = 0, ant = 0; const parc = [];
    M.faixas.forEach(([lim, p]) => { if (rest <= 0) return; const cap = lim == null ? rest : Math.min(rest, lim - ant); if (cap > 0){ parc.push([ant, lim, p, cap * p / 100]); base += cap * p / 100; rest -= cap; } ant = lim ?? ant; });
    const success = Math.max(base, M.minimo), ret = M.retainer * (o.meses ?? M.meses), liquidoSuccess = M.abate ? Math.max(0, success - ret) : success;
    const pPar = o.parceiro ?? M.parceiro, parceiro = o.temParceiro ? success * pPar / 100 : 0;
    return {M, ev, parc, base, success, minimoAplicado:success > base, ret, liquidoSuccess, total:ret + liquidoSuccess, parceiro, pPar, kinsey:ret + liquidoSuccess - parceiro, efetivo:ev ? success / ev : 0};
  }
  const tabelaTxt = lado => { const M = modelo(lado); let ant = 0; return M.faixas.map(([lim, p]) => { const t = lim == null ? `${fmt(p, 1)}% acima de R$ ${fmt(ant / 1e6, 0)} mi` : `${fmt(p, 1)}% de R$ ${fmt(ant / 1e6, 0)} a ${fmt(lim / 1e6, 0)} mi`; ant = lim ?? ant; return t; }).join("; ") + `, com mínimo de ${mi(M.minimo)}`; };

  /* placeholders dos modelos de mandato: quando o mandato não tem valores próprios, usa o modelo Kinsey */
  window.KT_HON = {calcula, modelo, tabelaTxt, campos:(s, lado) => { const M = modelo(lado); return {RETAINER:mil(M.retainer), SUCCESS:`success fee escalonado: ${tabelaTxt(lado)}${M.abate ? "; retainer abatido do success fee" : ""}`, TAIL:String(M.tail)}; }};

  /* ---------------- JURÍDICO · modelo de honorários ---------------- */
  const _jr = renderJuridico;
  renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return; const ed = D.ed() ? "" : "disabled";
    const el = document.createElement("form"); el.className = "card"; el.id = "fhon"; el.noValidate = true; el.style.cssText = "display:flex;flex-direction:column;gap:12px";
    const col = lado => { const M = modelo(lado); return `<div style="display:flex;flex-direction:column;gap:8px;min-width:0"><h3 style="font-size:14px">${lado === "venda" ? "Mandato de venda (sell-side)" : "Mandato de compra (buy-side)"}</h3><div class="form">
      <div class="fld"><label for="h-${lado}-ret">Retainer mensal (R$)</label><input id="h-${lado}-ret" inputmode="decimal" value="${fmt(M.retainer, 0)}" ${ed}></div><div class="fld"><label for="h-${lado}-mes">Meses de retainer previstos</label><input id="h-${lado}-mes" inputmode="numeric" value="${M.meses}" ${ed}></div>
      <div class="fld"><label for="h-${lado}-min">Success fee mínimo (R$ mi)</label><input id="h-${lado}-min" inputmode="decimal" value="${fmt(M.minimo / 1e6, 2)}" ${ed}></div><div class="fld"><label for="h-${lado}-tail">Cauda / tail (meses)</label><input id="h-${lado}-tail" inputmode="numeric" value="${M.tail}" ${ed}></div>
      <div class="fld"><label for="h-${lado}-par">Parceiro originador (% do success fee)</label><input id="h-${lado}-par" inputmode="decimal" value="${fmt(M.parceiro, 1)}" ${ed}></div><div class="fld"><label class="check" style="margin-top:22px"><input type="checkbox" id="h-${lado}-ab" ${M.abate ? "checked" : ""} ${ed}> Retainer abatido do success fee</label></div>
      <div class="fld full"><label for="h-${lado}-fx">Faixas do success fee (uma por linha: até R$ mi ; %) — última linha sem limite</label><textarea id="h-${lado}-fx" rows="4" ${ed}>${M.faixas.map(([l, p]) => `${l == null ? "acima" : fmt(l / 1e6, 0)} ; ${fmt(p, 2)}`).join("\n")}</textarea></div>
      <div class="fld full"><label for="h-${lado}-desp">Despesas</label><input id="h-${lado}-desp" value="${esc(M.despesas || "")}" ${ed}></div></div><p class="sub" style="margin:0;font-size:12px">${esc(tabelaTxt(lado))}</p></div>`; };
    const sim = +(S.honSim || 120), r = calcula(sim * 1e6, S.honLado || "venda", {temParceiro:true});
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Jurídico · Kinsey Capital</div><h3>Modelo de honorários dos mandatos</h3><p class="sub" style="margin:2px 0 0">Retainer, success fee escalonado pelo valor da operação, mínimo, cauda e parceiro. Preenche os modelos de mandato quando o mandato não tem condições próprias.</p></div>
        ${oficial() ? `<span class="pill r-baixo">Modelo Kinsey · ${dt(S.config.fees_kinsey.em)}</span>` : `<span class="pill r-medio">Provisório</span>`}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px">${col("venda")}${col("compra")}</div>
      ${D.ed() ? `<button type="submit" class="btn primary" style="align-self:flex-start">Salvar como modelo Kinsey</button>` : ""}
      <div class="card" style="display:flex;flex-direction:column;gap:8px;background:rgba(79,176,245,.06)"><h3 style="font-size:14px">Simulador</h3><div class="form">
        <div class="fld"><label for="h-sim">Valor da operação (EV, R$ mi)</label><input id="h-sim" inputmode="decimal" value="${fmt(sim, 0)}"></div><div class="fld"><label for="h-lado">Mandato</label><select id="h-lado"><option value="venda" ${S.honLado !== "compra" ? "selected" : ""}>Venda</option><option value="compra" ${S.honLado === "compra" ? "selected" : ""}>Compra</option></select></div></div>
        <div class="tbl"><table><tbody>${r.parc.map(([a, l, p, v]) => `<tr><td>${fmt(p, 1)}% sobre R$ ${fmt(a / 1e6, 0)} a ${l == null ? "…" : fmt(l / 1e6, 0)} mi</td><td class="dd-num">${mi(v, 2)}</td></tr>`).join("")}
          <tr><td><b>Success fee</b>${r.minimoAplicado ? " (mínimo aplicado)" : ""} · ${fmt(r.efetivo * 100, 2)}% efetivo</td><td class="dd-num"><b>${mi(r.success, 2)}</b></td></tr><tr><td>Retainer (${r.M.meses} meses)</td><td class="dd-num">${mi(r.ret, 2)}</td></tr>
          <tr><td>Success fee a receber no fechamento${r.M.abate ? " (retainer abatido)" : ""}</td><td class="dd-num">${mi(r.liquidoSuccess, 2)}</td></tr><tr><td>(−) Parceiro originador (${fmt(r.pPar, 0)}% do success fee)</td><td class="dd-num">${mi(-r.parceiro, 2)}</td></tr>
          <tr><td><b>Receita total da Kinsey</b></td><td class="dd-num"><b>${mi(r.kinsey, 2)}</b></td></tr></tbody></table></div></div>`;
    const ref = $("#ma-jur", host); if (ref) ref.after(el); else host.prepend(el);
    $("#h-sim", el).onchange = e => { S.honSim = num(e.target.value) || 0; renderJuridico(); }; $("#h-lado", el).onchange = e => { S.honLado = e.target.value; renderJuridico(); };
    el.onsubmit = e => { e.preventDefault(); const o = {em:nowISO(), por:Store.me?.email || ""};
      ["venda","compra"].forEach(l => { const v = id => $(`#h-${l}-${id}`, el).value;
        const faixas = v("fx").split("\n").map(x => x.split(";").map(y => y.trim())).filter(x => x.length === 2 && num(x[1]) != null).map(([lim, p]) => [/acima|^$/i.test(lim) ? null : num(lim) * 1e6, num(p)]);
        if (!faixas.length || faixas[faixas.length - 1][0] != null) faixas.push([null, faixas[faixas.length - 1]?.[1] || 2]);
        o[l] = {retainer:num(v("ret")) || 0, meses:num(v("mes")) || 0, minimo:(num(v("min")) || 0) * 1e6, tail:num(v("tail")) || 0, parceiro:num(v("par")) || 0, abate:$(`#h-${l}-ab`, el).checked, faixas, despesas:v("desp").trim()}; });
      save(Store.set("config", "fees_kinsey", o)).then(() => toast("Modelo de honorários salvo")); }; };

  /* ---------------- DOSSIÊ · honorários estimados do mandato ---------------- */
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); if (s.nivel !== "N3" || !s.mandato?.status) return;
    let ev = null, ref = ""; try{ if (D.temBal(s) && window.KT_VAL){ const R = KT_VAL.resumo(s); if (R.rec){ ev = (R.rec[0] + R.rec[1]) / 2; ref = "meio da faixa moderada do valuation"; } } }catch(e){}
    const loi = S.contracts.filter(c => c.supplierId === s.id && /LOI|SPA/i.test(c.tipo || "") && num(c.volume)).sort((a, b) => String(b.criadoEm).localeCompare(a.criadoEm))[0]; if (loi){ ev = num(loi.volume) * 1e6; ref = `${loi.tipo} ${loi.numero || ""}`.trim(); }
    if (!ev && window.KT_BASE){ const V = KT_BASE.valorAlvo(s); if (V){ ev = V.ev; ref = "valor estimado: " + V.fonte; } }
    if (!ev) return; const par = supById(s.parentId), pPar = par && par.tipo !== "Kinsey Capital" ? num(String(par.acordo?.fee || "").match(/[\d.,]+/)?.[0]) : null;
    let c = calcula(ev, s.lado === "compra" ? "compra" : "venda", {temParceiro:pPar != null, parceiro:pPar ?? undefined});
    /* condição própria do mandato: percentual único sobre o valor da transação (ex.: "6% ... (3% parceiro + 3% Kinsey)"), sem retainer e sem mínimo quando o mandato diz */
    const pm = num(String(s.mandato.success || "").match(/^\s*([\d.,]+)\s*%/)?.[1]), propria = pm != null;
    if (propria){ const md = s.mandato, semRet = !num(String(md.retainer || "").replace(/[^\d.,]/g, "")), success = ev * pm / 100, ret = semRet ? 0 : c.ret, parc = pPar != null ? success * pPar / 100 : 0;
      c = {...c, success, ret, liquidoSuccess:success, total:ret + success, parceiro:parc, kinsey:ret + success - parc, efetivo:pm / 100, M:{...c.M, meses:semRet ? 0 : c.M.meses}}; }
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<h3>Honorários estimados do mandato</h3><p class="sub" style="margin:0">Base: ${mi(ev)} (${esc(ref)}) · ${propria ? `condição do mandato: ${esc(s.mandato.success)}${s.mandato.retainer ? " · " + esc(s.mandato.retainer) : ""}` : `modelo Kinsey de ${s.lado === "compra" ? "compra" : "venda"}${oficial() ? "" : " (provisório)"}${s.mandato.success ? ` · condição própria do mandato: ${esc(s.mandato.success)}` : ""}`}${s.mandato.status !== "assinado" ? " · <b>mandato não assinado</b>" : ""}</p>
      <div class="dd-kpis"><div class="dd-k"><span>Success fee</span><b>${mi(c.success, 2)}</b><small>${fmt(c.efetivo * 100, 2)}% efetivo</small></div><div class="dd-k"><span>Retainer</span><b>${mi(c.ret, 2)}</b><small>${c.M.meses} meses</small></div>
      <div class="dd-k"><span>Parceiro ${par ? esc(par.nome.replace(/^EXEMPLO /, "").slice(0, 22)) : ""}</span><b>${mi(c.parceiro, 2)}</b><small>${pPar != null ? fmt(pPar, 0) + "% do success fee" : "originação Kinsey"}</small></div><div class="dd-k"><span>Receita Kinsey</span><b>${mi(c.kinsey, 2)}</b></div></div>`;
    b.firstElementChild.appendChild(el); };
})();
