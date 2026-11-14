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
  function ppa(s){
    const R = V.resumo(s), X = R.X; if (!X || X.vazio) return null; const q = s.pos?.ppa || {}, W = X.W, t = W.t;
    const spa = precoSPA(s), pct = (q.pct ?? (parseFloat(String(s.mandato?.participacao || "").replace(",", ".")) || 100)) / 100;
    const preco = q.preco != null ? q.preco * 1e6 : spa ? spa.v : ((R.rec[0] + R.rec[1]) / 2 - X.dl) * pct, fonte = q.preco != null ? "informado" : spa ? spa.ref : "faixa moderada do valuation";
    const plContabil = X.bp.K.PL, ajDD = X.bp.A.pl, mod = R.mod.c, rl0 = X.bp.rl, m = mod.mg;
    const k = (q.taxaAdic ?? 2) / 100 + W.wacc;
    /* carteira de clientes (MPEEM simplificado) */
    const churn = (q.churn ?? 15) / 100, vidaC = q.vidaC ?? 6, cac = (q.cac ?? 3) / 100; let vC = 0;
    for (let y = 1; y <= vidaC; y++){ const r = (mod.anos[Math.min(y, 5) - 1]?.rl || rl0) * Math.pow(1 - churn, y); vC += r * (m - cac) * (1 - t) / Math.pow(1 + k, y); }
    /* marca (relief-from-royalty) */
    const roy = (q.royalty ?? 1.5) / 100, vidaM = q.vidaM ?? 10; let vM = 0;
    for (let y = 1; y <= vidaM; y++){ const r = mod.anos[Math.min(y, 5) - 1]?.rl * (y > 5 ? Math.pow(1 + mod.g, y - 5) : 1) || rl0; vM += r * roy * (1 - t) / Math.pow(1 + k, y); }
    const vT = (q.tecnologia ?? 0) * 1e6, imob = (q.imob ?? 0) * 1e6, est = (q.estoques ?? 0) * 1e6, cont = (q.contingencias ?? 0) * 1e6;
    const maisValias = imob + est + vC + vM + vT, irDif = (maisValias - cont) * t * (q.irDif === false ? 0 : 1);
    const liqVJ = plContabil + ajDD + maisValias - cont - irDif, nci = liqVJ * (1 - pct), goodwill = preco + nci - liqVJ;
    return {R, X, q, spa, pct, preco, fonte, plContabil, ajDD, vC, vM, vT, imob, est, cont, irDif, liqVJ, nci, goodwill, k, churn, vidaC, cac, roy, vidaM};
  }
  async function ppaPdf(s){
    const Z = ppa(s), Rl = KT_REL, P = KTPdf();
    Rl.capa(P, "Pós-aquisição · PPA (CPC 15 / IFRS 3)", s.nome, [["Data de aquisição", Z.q.data || "a definir"], ["Participação adquirida", pc(Z.pct, 0)], ["Preço (consideração)", mi(Z.preco)], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    Rl.sec(P, 1, "Alocação do preço de compra");
    Rl.tab(P, ["Componente", "Valor"], linhasPpa(Z).map(([a, b]) => [a, b]), [.7, .3]);
    Rl.sec(P, 2, "Intangíveis identificados e premissas");
    Rl.tab(P, ["Intangível", "Método", "Premissas", "Valor justo"], [["Carteira de clientes", "MPEEM (lucro excedente)", `perda de clientes ${pc(Z.churn, 0)} a.a., ${Z.vidaC} anos, encargo de ativos ${pc(Z.cac, 0)}, taxa ${pc(Z.k)}`, mi(Z.vC)], ["Marca", "Relief-from-royalty", `royalty ${pc(Z.roy, 1)}, ${Z.vidaM} anos, taxa ${pc(Z.k)}`, mi(Z.vM)], ["Tecnologia", "Informado (laudo)", "", mi(Z.vT)]], [.2, .22, .4, .18]);
    Rl.par(P, "Projeções de receita e margem do cenário moderado do valuation. Taxa de desconto: WACC + prêmio pelo risco do intangível. Valores sujeitos a laudo de avaliação independente.", {size:9, color:[90,101,120]});
    await rptSave(P.out(`PPA · ${s.nome}`, Rl.T(`Kinsey Capital · PPA · ${s.nome} · confidencial`)), Rl.arq(s, "PPA", "pdf"), "application/pdf");
  }
  const linhasPpa = Z => [["Preço pago (consideração) · " + Z.fonte, mi(Z.preco)], ["(+) Participação de não controladores (proporcional)", mi(Z.nci)], ["Patrimônio líquido contábil", mi(Z.plContabil)], ["(+) Ajustes de Due Diligence com OK no valuation", mi(Z.ajDD)],
    ["(+) Mais-valia do imobilizado (laudo)", mi(Z.imob)], ["(+) Mais-valia dos estoques", mi(Z.est)], ["(+) Carteira de clientes", mi(Z.vC)], ["(+) Marca", mi(Z.vM)], ["(+) Tecnologia", mi(Z.vT)], ["(−) Passivos contingentes reconhecidos", mi(-Z.cont)], ["(−) IR e CS diferidos sobre as mais-valias", mi(-Z.irDif)],
    ["Ativos líquidos a valor justo", mi(Z.liqVJ)], ["Ágio (goodwill)", mi(Z.goodwill)]];

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
        <div class="dd-kpis"><div class="dd-k"><span>Preço pago</span><b>${mi(Z.preco)}</b></div><div class="dd-k"><span>Ativos líquidos a valor justo</span><b>${mi(Z.liqVJ)}</b></div><div class="dd-k"><span>Intangíveis identificados</span><b>${mi(Z.vC + Z.vM + Z.vT)}</b><small>clientes ${mi(Z.vC)} · marca ${mi(Z.vM)}</small></div><div class="dd-k"><span>Ágio (goodwill)</span><b>${mi(Z.goodwill)}</b><small>${pc(div(Z.goodwill, Z.preco), 0)} do preço</small></div></div>
        <div class="tbl"><table><tbody>${linhasPpa(Z).map(([a, b], i, L) => `<tr><td>${i >= L.length - 2 ? `<b>${esc(a)}</b>` : esc(a)}</td><td class="dd-num">${i >= L.length - 2 ? `<b>${b}</b>` : b}</td></tr>`).join("")}</tbody></table></div></div>
        <form class="card" id="fppa" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Premissas do PPA</h3><div class="form">
          ${[["pp-pr","Preço pago (R$ mi; vazio = SPA ou valuation)","preco"],["pp-pc","Participação adquirida (%)","pct"],["pp-dt","Data de aquisição","data"],["pp-im","Mais-valia do imobilizado (R$ mi, laudo)","imob"],["pp-es","Mais-valia dos estoques (R$ mi)","estoques"],["pp-ct","Passivos contingentes reconhecidos (R$ mi)","contingencias"],["pp-te","Tecnologia (R$ mi, laudo)","tecnologia"],["pp-ch","Perda anual de clientes (%)","churn"],["pp-vc","Vida da carteira (anos)","vidaC"],["pp-ca","Encargo de ativos contributivos (% da receita)","cac"],["pp-ro","Royalty da marca (% da receita)","royalty"],["pp-vm","Vida da marca (anos)","vidaM"],["pp-tx","Prêmio sobre o WACC para intangíveis (p.p.)","taxaAdic"]].map(([id, l, k]) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" ${k === "data" ? 'type="date"' : 'inputmode="decimal"'} value="${q[k] != null ? esc(k === "data" ? q[k] : fmt(q[k], 2)) : ""}" placeholder="${k === "data" ? "" : esc(fmt({preco:Z.preco / 1e6, pct:Z.pct * 100, churn:Z.churn * 100, vidaC:Z.vidaC, cac:Z.cac * 100, royalty:Z.roy * 100, vidaM:Z.vidaM, taxaAdic:(Z.k - Z.X.W.wacc) * 100}[k] ?? 0, 1))}" ${ed}></div>`).join("")}</div>
          ${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar premissas</button>` : ""}<p class="sub" style="margin:0">Valores de referência para o PPA contábil; a versão final depende de laudo de avaliação independente. Preço do SPA: contrato do tipo "Compra e venda de participação (SPA)" no Jurídico, com o valor da operação.</p></form>`; }
    host.innerHTML = h + tabs + `<div class="dd-split" style="margin-top:14px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">${corpo}</div></div>`;
    sd.bind(host); D.bindComum(host, s);
    $$("[data-pt]", host).forEach(b => b.onclick = () => { S.posTab = b.dataset.pt; renderView(); });
    $$("[data-mm]", host).forEach(b => b.onclick = () => montar(s, b.dataset.mm));
    const a = $("#pm-add", host); if (a) a.onclick = novoModelo;
    const pp = $("#ppa-pdf", host); if (pp) pp.onclick = () => ppaPdf(s).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
    const f = $("#fppa", host); if (f) f.onsubmit = e => { e.preventDefault(); const o = {}; [["pp-pr","preco"],["pp-pc","pct"],["pp-im","imob"],["pp-es","estoques"],["pp-ct","contingencias"],["pp-te","tecnologia"],["pp-ch","churn"],["pp-vc","vidaC"],["pp-ca","cac"],["pp-ro","royalty"],["pp-vm","vidaM"],["pp-tx","taxaAdic"]].forEach(([id, k]) => { o[k] = n($("#" + id).value); });
      o.data = $("#pp-dt").value; D.up(s, {pos:{ppa:o}}).then(() => toast("Premissas do PPA salvas")); };
  };
  window.KT_POS = {ppa, modelos};
})();
