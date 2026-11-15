/* ================= KINSEY CAPITAL · ORGANIZAÇÃO DO JURÍDICO =================
   O Jurídico reúne, em abas: a diligência jurídica dos targets (questionário, contratos dos últimos 3 a 5 anos,
   processos e contingências, evidências, procedimentos automáticos e relatório), os NDAs, mandatos e modelos Kinsey,
   o modelo de honorários e os contratos e pareceres das operações. Carregado por último. */
if (window.KT_DD && window.KT_JDD) (() => {
  const D = KT_DD, J = KT_JDD;
  const ABAS = [["dd","Diligência jurídica"],["docs","NDAs, mandatos e modelos"],["hon","Honorários"],["contratos","Contratos e pareceres"]];
  S.jurTab = S.jurTab || "dd";
  const corAlvo = t => { const q = t.jdd?.q || {}; if (!Object.keys(q).length && !Object.keys(t.jdd?.ct || {}).length) return D.COR.sem; return J.QS.some(x => x.risco && q[x.id]?.v === x.risco) || J.contingencias(t).provavel > 0 ? D.COR.pend : D.COR.ok; };
  function procsJuridicos(s){
    const P = D.periodos(s), db = s.perfil?.dataBase?.slice(0, 7), per = db && P.includes(db) ? db : P[0]; if (!per) return `<div class="card"><h3>Procedimentos automáticos jurídicos</h3><p class="sub" style="margin:0">Importe o balancete na Due Diligence para comparar processos prováveis com as provisões contábeis.</p></div>`;
    const b = s.dd.bal[per], K = D.calc(b), L = D.PROCS.filter(p => p.area === "juridica").map(p => ({p, r:p.f(K, b, s)})), AJ = D.ajustes(s, per).filter(a => a.area === "juridica");
    const pill = st => ({ok:`<span class="pill r-baixo">Sem achado</span>`, achado:`<span class="pill r-alto">Achado</span>`, na:`<span class="pill r-pend">Não se aplica</span>`, sd:`<span class="pill r-pend">Sem dados</span>`})[st] || "";
    return `<div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Procedimentos automáticos jurídicos · balancete ${esc(per)}</h3>
      ${L.map(({p, r}, i) => `<div class="dd-proc"><div style="min-width:0"><b>J-${String(i + 1).padStart(2, "0")} · ${esc(p.t)}</b> <span class="sub" style="font-size:11.5px">· ${esc(p.n)}</span><div style="font-size:13px;margin-top:3px">${esc(r.txt || "")}</div></div><div>${pill(r.st)}</div></div>`).join("")}
      ${AJ.length ? `<h3 style="font-size:14px;margin-top:6px">Ajustes jurídicos na dívida e no patrimônio</h3><p class="sub" style="margin:0">Seguem para o OK do consultor nas Análises financeiras e depois no Valuation (dívida líquida).</p>${D.tabAjustes(AJ, "dd")}` : ""}</div>`;
  }
  const _jr = renderJuridico;
  renderJuridico = function(){
    _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return;
    const pega = id => { const e = $("#" + id, host); if (e) e.remove(); return e; };
    const docs = pega("ma-jur"), hon = pega("fhon"); pega("jdd-painel");
    const resto = document.createDocumentFragment(); while (host.firstChild) resto.appendChild(host.firstChild);
    const top = document.createElement("div"); top.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-bottom:16px";
    top.innerHTML = `<div class="head" style="margin:0"><div style="display:flex;gap:12px;align-items:center">${D.emblema("#FF8A65")}<div><div class="eyebrow" style="color:#FF8A65">Pasta de análise</div><h2>Jurídico</h2><p class="sub" style="margin:2px 0 0">Diligência jurídica, NDAs, mandatos, honorários, contratos e pareceres das operações.</p></div></div></div>
      <div class="dd-tabs">${ABAS.map(([k, l]) => `<button type="button" class="fbtn" data-jur="${k}" aria-pressed="${S.jurTab === k}">${l}</button>`).join("")}</div>`;
    host.appendChild(top); $$("[data-jur]", top).forEach(b => b.onclick = () => { S.jurTab = b.dataset.jur; renderJuridico(); });
    if (S.jurTab === "docs"){ if (docs) host.appendChild(docs); return; }
    if (S.jurTab === "hon"){ if (hon) host.appendChild(hon); return; }
    if (S.jurTab === "contratos"){ host.appendChild(resto); return; }
    /* diligência jurídica */
    const T = D.targets(); let s = supById(S.jurAlvo); if (!s || s.nivel !== "N3") s = T.find(t => t.jdd) || T[0]; if (s) S.jurAlvo = s.id;
    const sd = D.lado(s, id => { S.jurAlvo = id; renderJuridico(); }, ["sem pontos de risco", "com pontos de risco ou contingências", "não iniciada", corAlvo]);
    const box = document.createElement("div"); box.className = "dd-split";
    box.innerHTML = `${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">${s ? J.html(s) + procsJuridicos(s) : `<div class="empty">Nenhum target cadastrado.</div>`}</div>`;
    host.appendChild(box); sd.bind(box); if (s) J.bind(box, s);
  };
})();

/* ================= KINSEY CAPITAL · BASE SIMPLIFICADA =================
   - Análise de risco e dossiê completo só para o N3 (target vendedor); N1 e N2 têm cadastro simples (Dados e M&A).
   - Menu enxuto: Órbita, Base inicial, Due Diligence, Análises financeiras, Valuation, Apresentação, Jurídico, Pós-aquisição.
   - Base inicial: targets vendedores, investidores e compradores, parceiros e pipeline, com temperatura do mapa da Kinsey. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  /* ---------- risco só do N3 ---------- */
  RCOL.na = "#7A8699"; RISK_LABEL.na = "Sem análise de risco";
  const st = document.createElement("style"); st.textContent = ".r-na{color:var(--muted);background:rgba(122,134,153,.12)}.tp{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;letter-spacing:.03em}.tp-quente{background:rgba(255,107,107,.15);color:#FF6B6B}.tp-morno{background:rgba(242,193,78,.15);color:#F2C14E}.tp-frio{background:rgba(79,176,245,.15);color:#4FB0F5}.tp-declinada{background:rgba(122,134,153,.15);color:#93A3BC}.mb-row{cursor:pointer}.mb-row:hover td{background:rgba(79,176,245,.06)}"; document.head.appendChild(st);
  /* N3 só sai de "Em avaliação" quando há dado real (respostas, documentos, NDA, Receita, investigação respondida, balancete ou diligência jurídica) */
  const temDado = s => answersCount(s).done > 0 || S.evidences.some(e => e.supplierId === s.id) || s.nda?.aceito || (s.receita && !s.receita.erro) || Object.values(s.invest || {}).some(v => v && ["sim","nao"].includes(v.v)) || D.temBal(s) || Object.keys(s.jdd?.q || {}).length > 0;
  const _risk = riskOf; riskOf = function(s){ if (s && s.nivel !== "N3") return {score:0, level:"na", auto:"na", manual:null, reasons:[]}; const r = _risk.apply(this, arguments); return !r.manual && !temDado(s) ? {...r, level:"pend", auto:"pend"} : r; };
  EXT_TARGET.push((s, el) => { if (s.nivel === "N3") return; el.querySelectorAll(".why, .side .pill").forEach(x => x.remove()); });
  /* ---------- dossiê: N3 completo, N1 e N2 simples ---------- */
  const COMPLETO = TABS.filter(t => !["insp","testes","ops"].includes(t[0])), SIMPLES = TABS.filter(t => ["dados","ma"].includes(t[0]));
  const _open = openSupplier; openSupplier = function(id, tab){ const s = supById(id); const L = s?.nivel === "N3" ? COMPLETO : SIMPLES; TABS.splice(0, TABS.length, ...L);
    if (!L.some(t => t[0] === (tab || S.supTab))) tab = "ma"; return _open.call(this, id, tab); };
  /* ---------- menu enxuto ---------- */
  const enxuga = () => { ["evidencias","relatorio"].forEach(v => { const b = $(`nav.tabs [data-go="${v}"]`); if (b) b.hidden = true; }); ["#kim-tour","#rpt-top"].forEach(q => { const b = $(q); if (b){ b.hidden = true; b.style.display = "none"; } });
    const nav = $("nav.tabs"), pos = $('[data-go="pos"]', nav), jur = $('[data-go="juridico"]', nav); if (nav && pos && jur) jur.after(pos); };
  enxuga(); setTimeout(enxuga, 0);
  /* ---------- Base inicial ---------- */
  const TEMPS = ["Quente","Morno","Frio","Declinada"], tp = t => t ? `<span class="tp tp-${nrm(t).split(" ")[0]}">${esc(t)}</span>` : "";
  const etapaNome = k => (MA_FUNIL.find(f => f[0] === k) || [k, k || "—"])[1];
  const ult = s => { const I = Object.values(s.interacoes || {}).filter(Boolean); const u = I.filter(i => i.data).sort((a, b) => String(b.data).localeCompare(a.data))[0], p = I.find(i => i.proximo && !i.feito); return {u, p}; };
  S.mbTab = S.mbTab || "N3"; S.mbF = S.mbF || {q:"", t:"", seg:""};
  renderCadeia = function(){
    const host = $("#cadeia"); if (!host) return; const all = S.suppliers, F = S.mbF, N3 = all.filter(s => s.nivel === "N3"), N1 = all.filter(s => s.nivel === "N1"), N2 = all.filter(s => s.nivel === "N2");
    const temp = s => s.mapa?.temperatura || (s.etapa === "descartada" ? "Declinada" : "");
    const filtra = L => L.filter(s => (!F.q || nrm([s.nome, s.segmento, s.mapa?.segmentoTxt, s.tese?.texto, s.municipio, s.uf, s.doc].join(" ")).includes(nrm(F.q))) && (!F.t || temp(s) === F.t) && (!F.seg || s.segmento === F.seg || s.perfil?.segmento === F.seg));
    const ativos = N3.filter(s => s.etapa !== "descartada"), segs = [...new Set(all.map(s => s.perfil?.segmento || s.segmento).filter(Boolean))].sort();
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    let corpo = "";
    if (S.mbTab === "N3"){ const L = filtra(N3).sort((a, b) => TEMPS.indexOf(temp(a) || "Frio") - TEMPS.indexOf(temp(b) || "Frio") || (b.fin?.receita || 0) - (a.fin?.receita || 0));
      corpo = `<div class="tbl"><table><thead><tr><th>Target vendedor</th><th>Local</th><th class="dd-num">Faturamento</th><th>Temperatura</th><th>Etapa · mandato</th><th>Compradores ligados</th><th>Último contato · próximo passo</th><th>Risco</th></tr></thead><tbody>${L.map(s => { const {u, p} = ult(s), inv = (s.investidores || []).map(supById).filter(Boolean), r = riskOf(s);
        return `<tr class="mb-row" data-mb="${s.id}"><td style="min-width:200px"><b>${esc(s.mandato?.codinome ? s.mandato.codinome + " · " : "")}${esc(s.nome)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(s.mapa?.segmentoTxt || s.segmento || "")}${s.doc ? " · " + esc(s.doc) : ""}</div></td><td>${esc([s.municipio, s.uf].filter(Boolean).join("/"))}</td>
          <td class="dd-num">${s.fin?.receita ? mi(s.fin.receita * 1e6, 1) : esc(s.mapa?.fat || "—")}</td><td>${tp(temp(s))}</td><td style="font-size:12px">${esc(etapaNome(s.etapa))}${s.mandato?.status ? `<div class="sub" style="margin:0;font-size:11px">mandato ${esc({assinado:"assinado", negociacao:"em negociação", encerrado:"encerrado", minuta:"em minuta", enviado:"enviado"}[s.mandato.status] || s.mandato.status)}</div>` : ""}${s.etapa === "descartada" && s.motivoDescarte ? `<div class="sub" style="margin:0;font-size:11px">${esc(s.motivoDescarte.slice(0, 60))}</div>` : ""}</td>
          <td style="font-size:12px;max-width:220px">${inv.length ? esc(inv.map(v => v.nome).slice(0, 3).join(", ")) + (inv.length > 3 ? ` +${inv.length - 3}` : "") : `<span class="sub">—</span>`}</td>
          <td style="font-size:12px">${u ? esc(u.data) : ""}${p ? `<div class="sub" style="margin:0;font-size:11px">${esc(p.proximo.slice(0, 60))}</div>` : ""}</td><td><span class="pill r-${r.level}" style="font-size:10px">${RISK_LABEL[r.level]}</span></td></tr>`; }).join("")}</tbody></table></div>`; }
    else if (S.mbTab === "N1"){ const L = filtra(N1).sort((a, b) => TEMPS.indexOf(temp(a) || "Frio") - TEMPS.indexOf(temp(b) || "Frio") || a.nome.localeCompare(b.nome, "pt"));
      corpo = `<div class="tbl"><table><thead><tr><th>Investidor ou comprador</th><th>Tipo</th><th>Tese</th><th>Local</th><th>Temperatura</th><th>Targets ligados</th><th>Contato</th></tr></thead><tbody>${L.map(s => { const T = N3.filter(t => (t.investidores || []).includes(s.id));
        return `<tr class="mb-row" data-mb="${s.id}"><td style="min-width:180px"><b>${esc(s.nome)}</b>${s.doc ? `<div class="sub mono" style="margin:0;font-size:11px">${esc(s.doc)}</div>` : ""}</td><td style="font-size:12px">${esc(s.tipo || "")}</td><td style="font-size:12px;max-width:260px">${esc((s.tese?.texto || (s.tese?.segmentos || []).join(", ")).slice(0, 110))}</td>
          <td>${esc([s.municipio, s.uf || s.pais].filter(Boolean).join("/"))}</td><td>${tp(temp(s))}</td><td style="font-size:12px;max-width:220px">${T.length ? esc(T.map(t => t.mandato?.codinome || t.nome).slice(0, 3).join(", ")) + (T.length > 3 ? ` +${T.length - 3}` : "") : `<span class="sub">—</span>`}</td><td style="font-size:11.5px;max-width:200px;overflow-wrap:anywhere">${esc((s.mapa?.contato || s.contato || "").slice(0, 70))}</td></tr>`; }).join("")}</tbody></table></div>`; }
    else if (S.mbTab === "N2") corpo = `<div class="tbl"><table><thead><tr><th>Intermediador ou parceiro</th><th>Tipo</th><th>Acordo</th><th>Targets trazidos</th></tr></thead><tbody>${filtra(N2).map(s => { const T = N3.filter(t => t.parentId === s.id);
        return `<tr class="mb-row" data-mb="${s.id}"><td><b>${esc(s.nome)}</b></td><td>${esc(s.tipo || "")}</td><td style="font-size:12px">${esc(s.acordo?.status || "—")}${s.acordo?.fee ? " · " + esc(s.acordo.fee) : ""}</td><td style="font-size:12px">${T.length} · ${esc(T.filter(t => t.etapa !== "descartada").map(t => t.nome).slice(0, 4).join(", "))}</td></tr>`; }).join("")}</tbody></table></div>`;
    host.innerHTML = `<div class="head"><div><div class="eyebrow">KinseyTec – M&A · empresas cadastradas</div><h2>Empresas da base</h2><p class="sub">Targets vendedores (N3), investidores e compradores (N1) e a Kinsey com os parceiros (N2). A análise de risco, a due diligence e o valuation são sempre do target vendedor.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="mb-imp">Importar mapa M&A</button><button type="button" class="btn" id="mb-nova">Nova empresa</button></div></div>
      <div class="dd-kpis" style="margin-bottom:14px">${k("Targets ativos", ativos.length, `${N3.length - ativos.length} declinados`)}${TEMPS.slice(0, 3).map(t => k(t, ativos.filter(s => temp(s) === t).length, "targets")).join("")}${k("Mandatos assinados", N3.filter(s => s.mandato?.status === "assinado").length)}${k("Investidores e compradores", N1.length)}${k("Kinsey e parceiros", N2.length)}</div>
      <div class="dd-tabs" style="margin-bottom:10px">${[["N3",`Targets vendedores · ${N3.length}`],["N1",`Investidores e compradores · ${N1.length}`],["N2",`Kinsey e parceiros · ${N2.length}`],["pipe","Pipeline"]].map(([v, l]) => `<button type="button" class="fbtn" data-mbt="${v}" aria-pressed="${S.mbTab === v}">${l}</button>`).join("")}</div>
      ${S.mbTab === "pipe" ? `<div id="mb-pipe"></div>` : `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><input id="mb-q" placeholder="Buscar por nome, segmento, cidade ou CNPJ" value="${esc(F.q)}" style="flex:1 1 240px;min-width:0" aria-label="Buscar">
        ${["", ...TEMPS].map(t => `<button type="button" class="fbtn" data-mbtp="${t}" aria-pressed="${F.t === t}">${t || "Todas"}</button>`).join("")}<select id="mb-seg" aria-label="Segmento"><option value="">Todos os segmentos</option>${segs.map(x => `<option ${x === F.seg ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></div>${corpo}`}`;
    $$("[data-mbt]", host).forEach(b => b.onclick = () => { S.mbTab = b.dataset.mbt; renderCadeia(); });
    $$("[data-mbtp]", host).forEach(b => b.onclick = () => { F.t = b.dataset.mbtp; renderCadeia(); });
    const q = $("#mb-q", host); if (q) q.oninput = () => { F.q = q.value; clearTimeout(S.mbT); S.mbT = setTimeout(() => { renderCadeia(); const n = $("#mb-q"); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); };
    const sg = $("#mb-seg", host); if (sg) sg.onchange = () => { F.seg = sg.value; renderCadeia(); };
    $$("[data-mb]", host).forEach(r => r.onclick = () => openSupplier(r.dataset.mb, "ma"));
    $("#mb-imp", host).onclick = () => window.KT_MAPA ? KT_MAPA.importar() : toast("Importador indisponível.");
    $("#mb-nova", host).onclick = () => openSupplierForm();
    if (S.mbTab === "pipe" && window.KT_MATCH?.pipeline) KT_MATCH.pipeline($("#mb-pipe", host));
  };
  /* ---------- dossiê · aba M&A: dados do mapa da Kinsey ---------- */
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); const m = s.mapa; if (!m) return; const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:6px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Mapa M&A Kinsey · aba ${esc(m.aba || "")}</div><h3>Situação no mapa</h3></div>${tp(m.temperatura)}</div>
      <dl class="kv">${[["Segmento", m.segmentoTxt], ["Faturamento", m.fat], ["Mandato", m.mandato], ["Contato", m.contato], ["Celular", m.telefone], ["Site", m.site], ["Razão social no mapa", m.razao], ["Observações", m.obs], ["CNPJ do link", m.cnpjLink], ["Conferência do CNPJ", m.avisoCnpj]].filter(x => x[1]).map(([a, v]) => `<dt>${a}</dt><dd style="overflow-wrap:anywhere">${esc(v)}</dd>`).join("")}</dl>
      ${m.ficha ? `<details><summary class="sub">Ficha (anotações)</summary><p style="white-space:pre-wrap;font-size:13px;margin:6px 0 0">${esc(m.ficha)}</p></details>` : ""}`;
    b.firstElementChild.insertBefore(el, b.firstElementChild.children[1] || null); };
})();

/* ================= CELULAR E DOSSIÊ COMPACTO =================
   Órbita abre com o globo livre (sem empresa selecionada), targets (N3) primeiro na faixa de empresas,
   menu em uma linha com rolagem e dossiê com cabeçalho curto, resumo do target e abas em uma linha. */
(() => {
  window.ORB_AUTOSEL = false;
  const ordem = {N3:0, N2:1, N1:2};
  const _strip = renderStrip; renderStrip = function(){ _strip.apply(this, arguments);
    const st = document.getElementById("strip"); if (!st) return;
    [...st.querySelectorAll("[data-sel]")].map(b => [b, supById(b.dataset.sel)]).sort((x, y) => (ordem[x[1]?.nivel] ?? 3) - (ordem[y[1]?.nivel] ?? 3)).forEach(([b]) => st.appendChild(b)); };

  const css = document.createElement("style");
  css.textContent = `
/* tipografia padronizada no celular: mais informação visível por tela, sem zoom dos campos no iOS */
@media (max-width:760px){
  body{font-size:13.5px}
  .pad{padding-left:12px!important;padding-right:12px!important}
  .card{padding:12px!important}
  .card h3,.head h3{font-size:15px!important;line-height:1.3}
  h2{font-size:18px} .sheet-h h2{font-size:17px!important;line-height:1.25}
  .sub{font-size:12px} .eyebrow{font-size:9.5px!important;letter-spacing:.1em}
  .dd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  .dd-k{padding:9px 10px!important;min-width:0} .dd-k b{font-size:16px!important;line-height:1.2} .dd-k span{font-size:9.5px!important} .dd-k small{font-size:11px!important}
  table,.tbl td,td{font-size:12.5px!important} th,td{padding:6px 7px!important} th{font-size:10.5px!important}
  .btn{font-size:13px} .btn.sm{font-size:12px} .fbtn{font-size:12px!important;padding:6px 10px!important}
  .banner{font-size:12.5px} label{font-size:12px} .fld .hint{font-size:11px}
  input,select,textarea{font-size:16px}
}
.dos-res{display:flex;flex-wrap:wrap;gap:6px;padding:8px 18px;border-bottom:1px solid var(--line);flex-shrink:0}
.dos-res span{font-size:11.5px;border:1px solid var(--line-2);border-radius:999px;padding:3px 9px;color:var(--fog);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.dos-res span b{color:var(--muted);font-weight:600;margin-right:4px}
@media (max-width:760px){
  nav.tabs{display:flex!important;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  nav.tabs::-webkit-scrollbar{display:none}
  nav.tabs button{flex:0 0 auto;min-width:74px;padding:7px 6px 6px;font-size:10px;gap:2px;white-space:nowrap}
  nav.tabs button svg{width:20px;height:20px}
  #v-orbita .hud{display:none}
  #v-orbita .orb-busca{top:8px;left:10px;right:54px;width:auto;min-width:0;transform:none}
  #v-orbita .orb-tit{display:none}
  #v-orbita .orb-busca input{height:36px;font-size:14px}
  #v-orbita .ctrls{top:8px;right:8px;gap:5px}
  #v-orbita .ctrls button{width:36px;height:36px}
  #v-orbita .lvl{top:52px;left:10px;right:54px;flex-direction:row;overflow-x:auto;scrollbar-width:none;gap:5px}
  #v-orbita .lvl::-webkit-scrollbar{display:none}
  #v-orbita .lvl button{flex:0 0 auto;height:26px;font-size:10px;padding:0 8px;white-space:nowrap}
  #v-orbita .dock{gap:6px;padding-bottom:8px}
  #v-orbita .target{max-height:34vh;overflow-y:auto;padding:8px 10px;font-size:12px;gap:4px 8px}
  #v-orbita .target h3{font-size:14px}
  #v-orbita .target .coords,#v-orbita .target .photos,#v-orbita .target a.btn{display:none}
  #v-orbita .target .why{display:none}
  #v-orbita .target .acts{margin-top:2px;gap:6px;position:sticky;bottom:-8px;z-index:1;background:rgba(1,20,48,.97);padding:6px 0 4px}
  #v-orbita .strip .chip{font-size:12px;padding:6px 10px}
  .sheet{max-height:calc(100% - 8px)!important}
  .sheet-h{padding:10px 14px 8px!important}
  .sheet-h h2{font-size:17px!important;line-height:1.2}
  .sheet-h .eyebrow{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:10px}
  .sheet .stabs{display:flex!important;overflow-x:auto!important;gap:4px!important;padding:6px 10px!important;scrollbar-width:none}
  .sheet .stabs::-webkit-scrollbar{display:none}
  .sheet .stabs button{flex:0 0 auto!important;flex-direction:row!important;white-space:nowrap!important;padding:6px 10px!important;font-size:12px!important;border-radius:999px}
  .sheet .stabs .sn{display:none}
  .dos-res{padding:6px 14px}
  .sheet-b{padding:12px 14px!important}
  .sheet-b .why li:nth-child(n+3){display:none}
}`;
  document.head.appendChild(css);

  /* resumo do target logo abaixo do título do dossiê */
  const etapa = k => (MA_FUNIL.find(f => f[0] === k) || [k, ""])[1];
  const _open = openSupplier; openSupplier = function(id){ _open.apply(this, arguments); const s = supById(id), h = document.querySelector(".sheet .sheet-h"); if (!s || !h) return;
    const r = riskOf(s), it = Object.values(s.interacoes || {}).filter(Boolean).sort((a, b) => String(b.data || b.em || "").localeCompare(String(a.data || a.em || "")))[0];
    const L = [s.nivel === "N3" && r.level !== "na" ? ["Risco", RISK_LABEL[r.level] || r.level] : null, ["Segmento", s.perfil?.segmento || s.segmento || s.mapa?.segmentoTxt], s.mapa?.temperatura ? ["Temperatura", s.mapa.temperatura] : null,
      s.etapa ? ["Etapa", etapa(s.etapa)] : null, s.mandato?.status ? ["Mandato", ({assinado:"assinado", negociacao:"em negociação", enviado:"enviado ao target", minuta:"minuta em preparação", encerrado:"encerrado"})[s.mandato.status] || s.mandato.status] : null, it?.proximo ? ["Próximo passo", it.proximo] : null].filter(x => x && x[1]);
    if (!L.length) return; const el = document.createElement("div"); el.className = "dos-res";
    el.innerHTML = L.map(([k, v]) => `<span><b>${esc(k)}</b>${esc(String(v))}</span>`).join(""); h.after(el); };
})();
