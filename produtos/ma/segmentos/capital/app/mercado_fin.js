/* ================= KINSEY CAPITAL · INDICADORES DE MERCADO =================
   - Análises financeiras: quadro "Mercado e indicadores macroeconômicos" com Ibovespa, small caps, IFIX, dólar, euro,
     S&P 500, Nasdaq, petróleo, ouro e bitcoin (variação do dia), Selic, CDI, IPCA, Treasury de 10 anos, projeções do
     Focus (Selic, IPCA e PIB), as 5 maiores empresas listadas do setor da empresa consultada e as maiores altas e baixas
     entre as maiores da B3. Cotações do Yahoo Finance gravadas pelo servidor a cada 30 minutos no pregão (com atraso de
     até 15 minutos); juros e inflação do Banco Central; empresas da CVM.
   - O mesmo quadro vai para o relatório de análises financeiras e para o teaser e a apresentação (prospecção).
   - A barra de mercado do topo corre em movimento contínuo com os indicadores. */
if (window.KT_DD) (() => {
  const D = KT_DD;
  const f2 = (v, d = 2) => v == null || !isFinite(v) ? "—" : fmt(v, d), pv = v => v == null || !isFinite(v) ? "" : `${v >= 0 ? "+" : ""}${fmt(v * 100, 2)}%`;
  const corV = v => v == null ? "var(--muted)" : v >= 0 ? "var(--ok)" : "var(--bad)";
  const miB = v => v == null || !isFinite(v) ? "—" : v >= 1e9 ? `R$ ${fmt(v / 1e9, 1)} bi` : `R$ ${fmt(v / 1e6, 0)} mi`;
  let ouvindo = false;
  const ouvir = () => { if (ouvindo || !Store.db) return; ouvindo = true;
    Store.db.collection("cotacoes").doc("bolsa").onSnapshot(d => { S.bolsa = d.exists ? d.data() : null; try{ renderPriceBar(); }catch(e){} if (["financas", "apresentacao"].includes(S.view)) renderView(); }, () => {}); };
  const merc = () => ({...(typeof VAL_BASE !== "undefined" ? VAL_BASE.mercado : {}), ...(S.mercado?.atual || {})});
  const focus = () => S.mercado?.focus || (typeof VAL_BASE !== "undefined" ? VAL_BASE.focus : {}) || {};
  /* lista única de indicadores para o quadro, a barra e o PDF */
  function indicadores(){
    const M = merc(), B = S.bolsa?.indices || {}, L = [];
    const add = (k, rot, v, fmtv, vr, fonte) => { if (v == null || !isFinite(v)) return; L.push({k, rot, v, txt:fmtv(v), var:vr, fonte}); };
    add("ibov", "Ibovespa", B.ibov?.v ?? M.ibov, v => `${fmt(v, 0)} pts`, B.ibov?.var, "B3");
    add("usd", "Dólar", B.usd?.v ?? M.ptax, v => `R$ ${f2(v, 4)}`, B.usd?.var, B.usd ? "mercado" : "PTAX");
    add("eur", "Euro", B.eur?.v, v => `R$ ${f2(v, 4)}`, B.eur?.var, "mercado");
    add("selic", "Selic", M.selic, v => `${f2(v)}%`, null, "Banco Central");
    add("cdi", "CDI", M.cdi, v => `${f2(v)}%`, null, "Banco Central");
    add("ipca", "IPCA 12 meses", M.ipca12, v => `${f2(v)}%`, null, "IBGE/BCB");
    add("smll", "Small caps", B.smll?.v, v => `${fmt(v, 0)} pts`, B.smll?.var, "B3");
    add("ifix", "IFIX", B.ifix?.v, v => `${fmt(v, 0)} pts`, B.ifix?.var, "B3");
    add("spx", "S&P 500", B.spx?.v, v => `${fmt(v, 0)} pts`, B.spx?.var, "EUA");
    add("ndx", "Nasdaq", B.ndx?.v, v => `${fmt(v, 0)} pts`, B.ndx?.var, "EUA");
    add("ust", "Treasury 10 anos", M.ust10, v => `${f2(v)}%`, null, "EUA");
    add("brent", "Petróleo Brent", B.brent?.v, v => `US$ ${f2(v)}`, B.brent?.var, "ICE");
    add("ouro", "Ouro", B.ouro?.v, v => `US$ ${fmt(v, 0)}`, B.ouro?.var, "COMEX");
    add("btc", "Bitcoin", B.btc?.v, v => `US$ ${fmt(v, 0)}`, B.btc?.var, "mercado");
    return L;
  }
  function focusLinhas(){ const F = focus(), y = new Date().getFullYear(), L = [];
    const v = (m, ano) => m && m[ano] != null ? `${f2(m[ano])}%` : null;
    [y, y + 1].forEach(a => { const sel = v(F.selic, a), ipca = v(F.ipca, a), pib = v(F.pib?.total, a); if (sel || ipca || pib) L.push([String(a), sel || "—", ipca || "—", pib || "—"]); }); return {L, data:F.data || ""}; }
  function empresasSetor(seg){
    const B = S.bolsa?.setores?.[seg]; if (B?.length) return {L:B, fonte:"cotação do dia"};
    const C = (S.mercadoComp?.lista || []).filter(c => c.seg === seg).sort((a, b) => (b.mcap || 0) - (a.mcap || 0)).slice(0, 5).map(c => ({ticker:c.ticker, nome:c.nome, preco:c.preco, var:null, mcap:c.mcap}));
    return {L:C, fonte:C.length ? "última atualização dos comparáveis" : ""};
  }
  function card(s){
    ouvir(); const I = indicadores(), seg = s?.perfil?.segmento || s?.segmento || "", E = seg ? empresasSetor(seg) : {L:[]}, F = focusLinhas(), B = S.bolsa;
    const k = x => `<div class="dd-k"><span>${esc(x.rot)}</span><b>${esc(x.txt)}</b><small style="color:${corV(x.var)}">${x.var != null ? pv(x.var) + " no dia" : esc(x.fonte)}</small></div>`;
    const tabAc = L => `<div class="tbl"><table><thead><tr><th>Ação</th><th>Empresa</th><th class="dd-num">Preço</th><th class="dd-num">Dia</th><th class="dd-num">Valor de mercado</th></tr></thead><tbody>${L.map(a => `<tr><td class="mono">${esc(a.ticker || "")}</td><td>${esc(a.nome || "")}</td><td class="dd-num">${a.preco ? "R$ " + f2(a.preco) : "—"}</td><td class="dd-num" style="color:${corV(a.var)}">${pv(a.var) || "—"}</td><td class="dd-num">${miB(a.mcap)}</td></tr>`).join("")}</tbody></table></div>`;
    return `<div class="card" id="mf-card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Mercado e indicadores macroeconômicos</div><h3 style="margin:0">Base de mercado${seg ? ` · ${esc(seg)}` : ""}</h3>
        <p class="sub" style="margin:2px 0 0;font-size:12px">${B?.em ? `Cotações de ${new Date(B.em).toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"})} · ${esc(B.fonte || "")}` : "Cotações do dia na versão publicada (atualizadas a cada 30 minutos no pregão)"}; juros e inflação: Banco Central.</p></div></div>
      <div class="dd-kpis">${I.map(k).join("")}</div>
      ${F.L.length ? `<div class="tbl"><table><thead><tr><th>Focus ${esc(F.data)}</th><th class="dd-num">Selic</th><th class="dd-num">IPCA</th><th class="dd-num">PIB</th></tr></thead><tbody>${F.L.map(r => `<tr>${r.map((c, i) => `<td class="${i ? "dd-num" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      ${seg ? `<div class="eyebrow" style="margin-top:2px">Maiores empresas listadas · ${esc(seg)}</div>${E.L.length ? tabAc(E.L) : `<p class="sub" style="margin:0;font-size:12.5px">As empresas do setor aparecem com os comparáveis da CVM e da B3 (versão publicada).</p>`}` : ""}
      ${B?.altas?.length ? `<div class="eyebrow" style="margin-top:2px">Maiores altas e baixas do dia (entre as maiores da B3)</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">${tabAc(B.altas)}${tabAc(B.baixas || [])}</div>` : ""}</div>`;
  }
  if (EXT_VIEWS.financas){ const _f = EXT_VIEWS.financas; EXT_VIEWS.financas = function(){ const r = _f.apply(this, arguments); const host = $("#financas"), s = D.alvoSel(); if (!host || $("#mf-card", host)) return r;
      try{ const col = host.querySelector(".dd-split > div:last-child"); if (!col) return r; const w = document.createElement("div"); w.innerHTML = card(s); const el = w.firstElementChild, ref = $("#fx-card", col) || col.querySelector(".card"); if (ref) ref.after(el); else col.appendChild(el); }catch(e){ console.error(e); } return r; }; }
  /* seção para os PDFs */
  function secaoPdf(P, s, sec){
    const R = window.KT_REL, I = indicadores(), seg = s?.perfil?.segmento || s?.segmento || "", E = seg ? empresasSetor(seg) : {L:[]}, F = focusLinhas(), B = S.bolsa;
    if (!I.length) return; sec("Indicadores macroeconômicos e mercado");
    R.tab(P, ["Indicador", "Valor", "Variação no dia", "Fonte"], I.map(x => [x.rot, x.txt, x.var != null ? pv(x.var) : "—", x.fonte]), [.3, .25, .2, .25]);
    if (F.L.length){ P.h2(R.T(`Expectativas do mercado (Focus ${F.data})`)); R.tab(P, ["Ano", "Selic", "IPCA", "PIB"], F.L, [.25, .25, .25, .25]); }
    if (E.L.length){ P.h2(R.T(`Maiores empresas listadas · ${seg}`)); R.tab(P, ["Ação", "Empresa", "Preço", "Dia", "Valor de mercado"], E.L.map(a => [a.ticker || "", a.nome || "", a.preco ? "R$ " + f2(a.preco) : "—", pv(a.var) || "—", miB(a.mcap)]), [.13, .37, .15, .13, .22]); }
    R.par(P, `Fontes: ${B?.fonte || "Yahoo Finance (cotações com atraso)"}; Banco Central do Brasil (SGS e Focus).${B?.em ? ` Cotações de ${new Date(B.em).toLocaleString("pt-BR")}.` : ""}`, {size:8, color:[90,101,120]});
  }
  /* barra do topo em movimento contínuo */
  const css = document.createElement("style");
  css.textContent = `#pricebar .pb-vp{flex:1;min-width:0;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent);mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}
#pricebar .pb-track{display:inline-flex;gap:22px;white-space:nowrap;animation:pbcorre var(--pbdur,45s) linear infinite;will-change:transform}
#pricebar:hover .pb-track{animation-play-state:paused}
#pricebar .pb-it{display:inline-flex;gap:6px;align-items:baseline;font-family:var(--f-mono);font-variant-numeric:tabular-nums}#pricebar .pb-it span{color:var(--muted)}#pricebar .pb-it em{font-style:normal;font-size:.9em}
@keyframes pbcorre{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){#pricebar .pb-track{animation:none}}
/* amarelo Kinsey (o mesmo das Reuniões na Prospecção): só nos números que resumem cada tela */
:root{--ouro:#F4C440}
#pricebar .pb-it span{color:var(--ouro);opacity:.9}
#vx-topo .dd-kpis .dd-k:last-child b,#dv-inv .dd-kpis:first-of-type .dd-k:nth-child(3) b,#fx-card .dd-kpis:first-of-type .dd-k:first-child b,#ra-pan .dd-kpis .dd-k:last-child b,#mf-card .dd-kpis:first-of-type .dd-k:first-child b,#fx-cresc .dd-kpis .dd-k:nth-child(3) b,#ap-merc .dd-kpis:first-of-type .dd-k:first-child b{color:var(--ouro)}
#vx-topo .dd-kpis .dd-k:last-child,#dv-inv .dd-kpis:first-of-type .dd-k:nth-child(3){box-shadow:inset 0 0 0 1px rgba(244,196,64,.35)}`;
  document.head.appendChild(css);
  if (typeof renderPriceBar === "function"){ const _pb = renderPriceBar;
    renderPriceBar = function(){ const r = _pb.apply(this, arguments); const el = $("#pricebar"); if (!el) return r; ouvir(); const I = indicadores(); if (!I.length) return r;
      const it = I.map(x => `<span class="pb-it"><span>${esc(x.rot)}</span><b>${esc(x.txt)}</b>${x.var != null ? `<em style="color:${corV(x.var)}">${pv(x.var)}</em>` : ""}</span>`).join("");
      const lab = el.querySelector(".lab")?.outerHTML || `<span class="lab"><i></i>Mercado</span>`, more = el.querySelector(".more")?.outerHTML || "";
      el.innerHTML = `${lab}<div class="pb-vp"><div class="pb-track" style="--pbdur:${Math.max(30, I.length * 5)}s">${it}${it}</div></div>${more}`; return r; };
    setTimeout(() => { try{ renderPriceBar(); }catch(e){} }, 0); }
  window.KT_MERC = {indicadores, card, secaoPdf, empresasSetor};
})();
