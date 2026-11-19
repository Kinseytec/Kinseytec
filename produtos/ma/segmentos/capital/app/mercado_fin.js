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
    add("pib", `PIB ${M.pibRef || ""}`.trim(), M.pib, v => `${f2(v, 1)}%`, null, "IBGE (variação real)");
    { const Fo = focus(), y = new Date().getFullYear(), pf = Fo.pib?.total?.[y] ?? Fo.pib?.total?.[String(y)]; add("pibF", `PIB ${y} (Focus)`, pf, v => `${f2(v, 2)}%`, null, "Focus/BCB"); }
    add("ust", "Treasury 10 anos", M.ust10, v => `${f2(v)}%`, null, "EUA");
    add("brent", "Petróleo Brent", B.brent?.v, v => `US$ ${f2(v)}`, B.brent?.var, "ICE");
    add("ouro", "Ouro", B.ouro?.v, v => `US$ ${fmt(v, 0)}`, B.ouro?.var, "COMEX");
    add("btc", "Bitcoin", B.btc?.v, v => `US$ ${fmt(v, 0)}`, B.btc?.var, "mercado");
    return L;
  }
  function focusLinhas(){ const F = focus(), y = new Date().getFullYear(), L = [];
    const v = (m, ano) => m && m[ano] != null ? `${f2(m[ano])}%` : null;
    [y, y + 1].forEach(a => { const sel = v(F.selic, a), ipca = v(F.ipca, a), pib = v(F.pib?.total, a); if (sel || ipca || pib) L.push([String(a), sel || "—", ipca || "—", pib || "—"]); }); return {L, data:F.data || ""}; }
  /* subsetor pela atividade da empresa (frigorífico, hospital, farmácia…): as 5 principais ações daquele mercado */
  const SUBS = [[/frigor|abate|carne|proteina animal|aves|suin|bovin/, "Alimentos · frigoríficos e proteína animal"], [/latic|leite|bebida|cervej/, "Alimentos · laticínios e bebidas"],
    [/hospital|plano de saude|planos de saude|operadora de saude|odontolog/, "Saúde · hospitais e planos"], [/farmac|drogaria|medicament|farmaceut/, "Saúde · farmácias e medicamentos"], [/diagnost|laborat|exames|imagem/, "Saúde · diagnósticos"],
    [/terceiriz|mao de obra|facilit|limpeza|vigilan|temporari/, "Serviços · terceirização e facilities"]];
  const nrmT = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  function setorDe(s){ const seg = s?.perfil?.segmento || s?.segmento || "", t = nrmT([s?.receita?.cnaeDesc, s?.receita?.fantasia, s?.nome, s?.atividade, s?.segmento, s?.perfil?.segmento, s?.perfil?.atividade, s?.mapa?.segmentoTxt].join(" "));
    const sub = SUBS.find(([re, k]) => re.test(t) && (!seg || k.startsWith(seg.split(" ")[0]) || !S.bolsa?.setores?.[seg])); return sub && (S.bolsa?.setores?.[sub[1]] || TICK[sub[1]]) ? sub[1] : seg; }
  const TICK = {"Saúde":["HAPV3", "RDOR3", "ODPV3", "FLRY3", "QUAL3", "MATD3", "RADL3", "HYPE3"], "Saúde · hospitais e planos":["HAPV3", "RDOR3", "ODPV3", "MATD3", "QUAL3"], "Saúde · farmácias e medicamentos":["RADL3", "PGMN3", "HYPE3", "BLAU3", "PNVL3"], "Saúde · diagnósticos":["FLRY3", "DASA3", "RDOR3", "HAPV3", "ODPV3"],
    "Alimentos":["JBSS3", "MBRF3", "BEEF3", "CAML3", "MDIA3", "ABEV3", "SMTO3"], "Alimentos · frigoríficos e proteína animal":["JBSS3", "MBRF3", "BEEF3"], "Alimentos · laticínios e bebidas":["ABEV3", "MDIA3", "CAML3", "JBSS3", "MBRF3"],
    "Agro":["SLCE3", "SMTO3", "AGRO3", "SOJA3", "TTEN3", "JALL3"], "Industrial":["WEGE3", "EMBR3", "RAPT4", "TUPY3", "KEPL3", "POMO4", "ROMI3"], "Tecnologia":["TOTS3", "LWSA3", "POSI3", "INTB3", "CASH3", "BMOB3"],
    "Serviços":["GGPS3", "VLID3", "RENT3", "MOVI3", "VAMO3", "ATMP3", "AMBP3"], "Serviços · terceirização e facilities":["GGPS3", "ATMP3", "VLID3", "AMBP3", "ORVR3"], "Logística":["RAIL3", "JSLG3", "SIMH3", "VAMO3", "TGMA3", "HBSA3"],
    "Educação":["COGN3", "YDUQ3", "CSED3", "ANIM3", "SEER3", "VTRU3"], "Construção":["CYRE3", "EZTC3", "MRVE3", "DIRR3", "CURY3", "TEND3"], "Varejo":["MGLU3", "LREN3", "ASAI3", "CRFB3", "RADL3", "VIVA3", "SBFG3"],
    "Energia":["ELET3", "EQTL3", "CPFE3", "EGIE3", "CMIG4"], "Financeiro":["ITUB4", "BBDC4", "BBAS3", "BPAC11", "SANB11"], "Óleo e gás":["PETR4", "PRIO3", "VBBR3", "UGPA3", "RECV3"], "Mineração e siderurgia":["VALE3", "GGBR4", "CSNA3", "USIM5", "GOAU4"]};
  const NOMES_T = {HAPV3:"Hapvida", RDOR3:"Rede D'Or", ODPV3:"Odontoprev", FLRY3:"Fleury", QUAL3:"Qualicorp", MATD3:"Mater Dei", RADL3:"Raia Drogasil", PGMN3:"Pague Menos", HYPE3:"Hypera", BLAU3:"Blau Farmacêutica", PNVL3:"Panvel", DASA3:"Dasa",
    JBSS3:"JBS", MBRF3:"MBRF (Marfrig e BRF)", BEEF3:"Minerva", CAML3:"Camil", MDIA3:"M. Dias Branco", ABEV3:"Ambev", SLCE3:"SLC Agrícola", SMTO3:"São Martinho", AGRO3:"BrasilAgro", SOJA3:"Boa Safra", TTEN3:"3tentos", WEGE3:"WEG", EMBR3:"Embraer", RAPT4:"Randon", TUPY3:"Tupy", KEPL3:"Kepler Weber",
    TOTS3:"Totvs", LWSA3:"Locaweb", POSI3:"Positivo", INTB3:"Intelbras", CASH3:"Méliuz", GGPS3:"GPS Participações", VLID3:"Valid", RENT3:"Localiza", MOVI3:"Movida", VAMO3:"Vamos", ATMP3:"Atma", RAIL3:"Rumo", JSLG3:"JSL", SIMH3:"Simpar", TGMA3:"Tegma",
    COGN3:"Cogna", ABEV3:"Ambev", JALL3:"Jalles Machado", POMO4:"Marcopolo", ROMI3:"Romi", BMOB3:"Bemobi", AMBP3:"Ambipar", ORVR3:"Orizon", HBSA3:"Hidrovias do Brasil", VTRU3:"Vitru", TEND3:"Tenda", VIVA3:"Vivara", SBFG3:"Grupo SBF", YDUQ3:"Yduqs", CSED3:"Cruzeiro do Sul", ANIM3:"Ânima", SEER3:"Ser Educacional", CYRE3:"Cyrela", EZTC3:"EZTEC", MRVE3:"MRV", DIRR3:"Direcional", CURY3:"Cury", MGLU3:"Magazine Luiza", LREN3:"Lojas Renner", ASAI3:"Assaí", CRFB3:"Carrefour Brasil"};

  const CONSOLID = {"Saúde":["RDOR3", "HAPV3", "MATD3"], "Saúde · hospitais e planos":["RDOR3", "HAPV3", "MATD3"], "Saúde · farmácias e medicamentos":["RADL3", "PGMN3", "HYPE3"], "Saúde · diagnósticos":["FLRY3", "DASA3", "RDOR3"],
    "Alimentos":["JBSS3", "MBRF3", "CAML3"], "Alimentos · frigoríficos e proteína animal":["JBSS3", "MBRF3", "BEEF3"], "Alimentos · laticínios e bebidas":["ABEV3", "MDIA3", "CAML3"], "Agro":["SLCE3", "TTEN3", "SMTO3"],
    "Industrial":["WEGE3", "RAPT4", "TUPY3"], "Tecnologia":["TOTS3", "LWSA3", "INTB3"], "Serviços":["GGPS3", "RENT3", "SIMH3"], "Serviços · terceirização e facilities":["GGPS3", "AMBP3", "ORVR3"],
    "Logística":["SIMH3", "JSLG3", "RAIL3"], "Educação":["COGN3", "YDUQ3", "CSED3"], "Construção":["CYRE3", "MRVE3", "CURY3"], "Varejo":["ASAI3", "MGLU3", "LREN3"]};
  const GESTORAS = [{ticker:"VINP", nome:"Vinci Partners", tipo:"gestora de private equity (Nasdaq)"}, {ticker:"PAX", nome:"Patria Investments", tipo:"gestora de private equity (Nasdaq)"}];
  function investidoresProvaveis(s, n = 5){
    const out = [], ja = new Set(), seg = setorDe(s) || s?.perfil?.segmento || s?.segmento || "", pai = String(seg).split(" · ")[0];
    try{ (window.KT_IND?.investidoresPara ? KT_IND.investidoresPara(s) : []).slice(0, 3).forEach(x => { out.push({nome:x.inv.nome, tipo:x.inv.tipo || "investidor da Órbita", motivo:(x.motivos || []).slice(0, 2).join("; ") || "tese aderente", origem:"Órbita", id:x.inv.id}); ja.add(nrmT(x.inv.nome)); }); }catch(e){}
    (s?.investidores || []).map(id => supById(id)).filter(Boolean).forEach(v => { if (out.length < n && !ja.has(nrmT(v.nome))){ out.unshift({nome:v.nome, tipo:v.tipo || "investidor indicado", motivo:"já indicado para este target", origem:"Órbita", id:v.id}); ja.add(nrmT(v.nome)); } });
    [...(CONSOLID[seg] || []), ...(CONSOLID[pai] || [])].forEach(t => { if (out.length >= n || ja.has(t)) return; ja.add(t); out.push({ticker:t, nome:NOMES_T[t] || t, tipo:"estratégico · consolidador listado do setor", motivo:`aquisições no setor ${seg ? "de " + seg.toLowerCase() : ""}`.trim(), origem:"B3"}); });
    GESTORAS.forEach(g => { if (out.length < n){ out.push({...g, motivo:"fundos de private equity com foco em empresas médias brasileiras", origem:"mercado"}); } });
    return out.slice(0, n);
  }
  function empresasSetor(seg, s){
    if (s){ const k = setorDe(s); if (k) seg = k; }
    const pai = String(seg || "").split(" · ")[0], junta = (a, b) => { const v = new Set(), out = []; [...(a || []), ...(b || [])].forEach(x => { const k = x.ticker || x; if (!v.has(k)){ v.add(k); out.push(x); } }); return out.slice(0, 10); };
    const B = junta(S.bolsa?.setores?.[seg], pai !== seg ? S.bolsa?.setores?.[pai] : null); if (B.length >= 5 || (B.length && !TICK[seg])) return {L:B, fonte:"cotação do dia", seg};
    if (TICK[seg] || TICK[pai]){ const T = junta(TICK[seg], pai !== seg ? TICK[pai] : null), cot = Object.fromEntries((B || []).map(x => [x.ticker, x]));
      return {L:T.map(t => cot[t] || {ticker:t, nome:NOMES_T[t] || t, preco:null, var:null, mcap:null}), fonte:B.length ? "cotação do dia (parte das ações)" : "principais ações do setor (cotação na versão publicada)", seg}; }
    const C = (S.mercadoComp?.lista || []).filter(c => c.seg === seg).sort((a, b) => (b.mcap || 0) - (a.mcap || 0)).slice(0, 5).map(c => ({ticker:c.ticker, nome:c.nome, preco:c.preco, var:null, mcap:c.mcap}));
    return {L:C, fonte:C.length ? "última atualização dos comparáveis" : "", seg};
  }
  function card(s){
    ouvir(); const I = indicadores(), seg0 = s?.perfil?.segmento || s?.segmento || "", E = s ? empresasSetor(seg0, s) : {L:[]}, seg = E.seg || seg0, F = focusLinhas(), B = S.bolsa;
    const k = x => `<div class="dd-k"><span>${esc(x.rot)}</span><b>${esc(x.txt)}</b><small style="color:${corV(x.var)}">${x.var != null ? pv(x.var) + " no dia" : esc(x.fonte)}</small></div>`;
    const tabAc = L => `<div class="tbl"><table><thead><tr><th>Ação</th><th>Empresa</th><th class="dd-num">Preço</th><th class="dd-num">Dia</th><th class="dd-num">Valor de mercado</th></tr></thead><tbody>${L.map(a => `<tr><td class="mono">${esc(a.ticker || "")}</td><td>${esc(a.nome || "")}</td><td class="dd-num">${a.preco ? "R$ " + f2(a.preco) : "—"}</td><td class="dd-num" style="color:${corV(a.var)}">${pv(a.var) || "—"}</td><td class="dd-num">${miB(a.mcap)}</td></tr>`).join("")}</tbody></table></div>`;
    return `<div class="card" id="mf-card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Mercado e indicadores macroeconômicos</div><h3 style="margin:0">Base de mercado${seg ? ` · ${esc(seg)}` : ""}</h3>
        <p class="sub" style="margin:2px 0 0;font-size:12px">${B?.em ? `Cotações de ${new Date(B.em).toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"})} · ${esc(B.fonte || "")}` : "Cotações do dia na versão publicada (atualizadas a cada 30 minutos no pregão)"}; juros e inflação: Banco Central.</p></div></div>
      <div class="dd-kpis">${I.map(k).join("")}</div>
      ${F.L.length ? `<div class="tbl"><table><thead><tr><th>Focus ${esc(F.data)}</th><th class="dd-num">Selic</th><th class="dd-num">IPCA</th><th class="dd-num">PIB</th></tr></thead><tbody>${F.L.map(r => `<tr>${r.map((c, i) => `<td class="${i ? "dd-num" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      ${seg ? `<h4 class="mf-tit">Empresas de capital aberto do setor · ${esc(seg)} (${E.L.length})</h4>${E.L.length ? tabAc(E.L) : `<p class="sub" style="margin:0;font-size:12.5px">As empresas do setor aparecem com os comparáveis da CVM e da B3 (versão publicada).</p>`}` : ""}
      ${(() => { const P = s ? investidoresProvaveis(s) : []; return P.length ? `<h4 class="mf-tit">Possíveis investidores de ${esc(s.mandato?.codinome || s.nome)} (${P.length})</h4><div class="tbl"><table><thead><tr><th>Investidor</th><th>Perfil</th><th>Por quê</th></tr></thead><tbody>${P.map(x => `<tr><td><b>${esc(x.nome)}</b>${x.ticker ? ` <span class="mono sub" style="font-size:11px">${esc(x.ticker)}</span>` : ""}</td><td style="font-size:12.5px">${esc(x.tipo)}</td><td style="font-size:12.5px">${esc(x.motivo)}</td></tr>`).join("")}</tbody></table></div><p class="sub" style="margin:0;font-size:11.5px">Sugestão para a prospecção: investidores da Órbita com tese aderente, consolidadores listados do setor e gestoras de private equity. Confirme a tese antes da abordagem.</p>` : ""; })()}
      ${B?.altas?.length ? `<div class="eyebrow" style="margin-top:2px">Maiores altas e baixas do dia (entre as maiores da B3)</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">${tabAc(B.altas)}${tabAc(B.baixas || [])}</div>` : ""}</div>`;
  }
  if (EXT_VIEWS.financas){ const _f = EXT_VIEWS.financas; EXT_VIEWS.financas = function(){ const r = _f.apply(this, arguments); const host = $("#financas"), s = D.alvoSel(); if (!host || $("#mf-card", host)) return r;
      try{ const col = host.querySelector(".dd-split > div:last-child"); if (!col) return r; const w = document.createElement("div"); w.innerHTML = card(s); const el = w.firstElementChild, ref = $("#fx-card", col) || col.querySelector(".card"); if (ref) ref.after(el); else col.appendChild(el); }catch(e){ console.error(e); } return r; }; }
  /* seção para os PDFs */
  function secaoPdf(P, s, sec){
    const R = window.KT_REL, I = indicadores(), seg0 = s?.perfil?.segmento || s?.segmento || "", E = s ? empresasSetor(seg0, s) : {L:[]}, seg = E.seg || seg0, F = focusLinhas(), B = S.bolsa;
    if (!I.length) return; sec("Indicadores macroeconômicos e mercado");
    R.tab(P, ["Indicador", "Valor", "Variação no dia", "Fonte"], I.map(x => [x.rot, x.txt, x.var != null ? pv(x.var) : "—", x.fonte]), [.3, .25, .2, .25]);
    if (F.L.length){ P.h2(R.T(`Expectativas do mercado (Focus ${F.data})`)); R.tab(P, ["Ano", "Selic", "IPCA", "PIB"], F.L, [.25, .25, .25, .25]); }
    { const PV = investidoresProvaveis(s); if (PV.length){ P.h2(R.T(`Possíveis investidores`)); R.tab(P, ["Investidor", "Perfil", "Por quê"], PV.map(x => [x.nome + (x.ticker ? ` (${x.ticker})` : ""), x.tipo, x.motivo]), [.32, .3, .38]); } }
    if (E.L.length){ P.h2(R.T(`Empresas de capital aberto do setor · ${seg}`)); R.tab(P, ["Ação", "Empresa", "Preço", "Dia", "Valor de mercado"], E.L.map(a => [a.ticker || "", a.nome || "", a.preco ? "R$ " + f2(a.preco) : "—", pv(a.var) || "—", miB(a.mcap)]), [.13, .37, .15, .13, .22]); }
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
      let it = I.map(x => `<span class="pb-it"><span>${esc(x.rot)}</span><b>${esc(x.txt)}</b>${x.var != null ? `<em style="color:${corV(x.var)}">${pv(x.var)}</em>` : ""}</span>`).join("");
      try{ const s = D.alvoSel?.(); if (s){ const E = empresasSetor(s.perfil?.segmento || s.segmento || "", s); if (E.L.length){
        it += `<span class="pb-it pb-seg"><span>Setor · ${esc(E.seg || "")}</span></span>` + E.L.slice(0, 5).map(a => `<span class="pb-it"><span>${esc(a.ticker)}</span><b>${a.preco ? "R$ " + f2(a.preco) : esc(String(a.nome || "").split(" ")[0])}</b>${a.var != null ? `<em style="color:${corV(a.var)}">${pv(a.var)}</em>` : ""}</span>`).join(""); } } }catch(e){}
      const lab = el.querySelector(".lab")?.outerHTML || `<span class="lab"><i></i>Mercado</span>`, more = el.querySelector(".more")?.outerHTML || "";
      el.innerHTML = `${lab}<div class="pb-vp"><div class="pb-track" style="--pbdur:${Math.max(30, I.length * 5)}s">${it}${it}</div></div>${more}`; return r; };
    setTimeout(() => { try{ renderPriceBar(); }catch(e){} }, 0); }
  window.KT_MERC = {indicadores, card, secaoPdf, empresasSetor, setorDe, investidoresProvaveis};
  { const c2 = document.createElement("style"); c2.textContent = `.mf-tit,#ap-merc .mf-tit{margin:6px 0 0;font-family:var(--f-display,inherit);font-size:15px;font-weight:800;color:var(--fog);letter-spacing:.01em}`; document.head.appendChild(c2); }
  /* trocar a empresa em consulta atualiza as ações do setor na faixa */
  { const _rv = renderView; renderView = function(){ const r = _rv.apply(this, arguments); const s = D.alvoSel?.(); if (s?.id !== S._pbSel){ S._pbSel = s?.id; try{ renderPriceBar(); }catch(e){} } return r; }; }
})();
