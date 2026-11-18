/* ================= KINSEY CAPITAL · DOSSIÊ DO TARGET PARA O INVESTIDOR =================
   O dossiê mostra o que importa para a decisão de investimento: risco, faturamento e EBITDA, valuation pelo fluxo de caixa
   descontado comparado com os múltiplos de mercado, WACC apurado com o beta do setor, success fee, operação mínima e
   retainer; e gera dali o teaser antes do NDA (anônimo) e a apresentação depois do NDA (com o nome).
   Antes do NDA nada identifica a empresa: nome, razão social, nome fantasia, CNPJ, site, sócios e o nome do arquivo saem
   trocados pelo nome-código do projeto. As perguntas jurídicas e documentais ficam no Jurídico (aba Questionário). */
if (window.KT_DD && window.KT_VAL) (() => {
  const D = KT_DD, V = KT_VAL;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const GEN = new Set(["ltda", "eireli", "epp", "cia", "companhia", "limitada", "grupo", "holding", "brasil", "brazil", "comercio", "comercial", "industria", "industrial", "servicos", "servico", "produtos", "medicos", "hospitalares", "empresariais", "empresarial", "alimentos", "distribuidora", "distribuicao", "transportes", "logistica", "engenharia", "tecnologia", "solucoes", "consultoria", "administradora", "administracao", "sistemas", "participacoes", "empreendimentos", "importacao", "exportacao", "agro", "agricola", "construtora", "construcoes", "nacional", "geral", "global", "nova", "novo", "santa", "santo", "sao", "rede", "casa", "clinica", "hospital", "laboratorio", "farma", "projeto", "exemplo"]);
  const esc2 = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  /* termos que identificam a empresa */
  function identificadores(s){
    const rf = s.receita && !s.receita.erro ? s.receita : {}, nomes = [s.nome, s.razao, rf.razao, rf.fantasia, s.fantasia, ...(s.mapa?.aliases || [])].map(x => String(x || "").replace(/^EXEMPLO\s+/i, "").trim()).filter(x => x.length >= 3);
    const L = new Set(nomes);
    nomes.forEach(n => { const w = n.split(/[^A-Za-zÀ-ÿ0-9]+/).filter(Boolean); const f = w.find(x => x.length >= 4 && !GEN.has(nrm(x))); if (f) L.add(f); if (w.length >= 2 && !GEN.has(nrm(w[0])) && !GEN.has(nrm(w[1]))) L.add(w[0] + " " + w[1]); });
    const d = String(s.doc || "").replace(/\D/g, ""); if (d.length === 14){ L.add(d); L.add(`${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`); }
    [s.mapa?.site, s.ext?.site?.url, s.teaser?.site?.url].filter(Boolean).forEach(u => { const h = String(u).replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0]; if (h.length >= 4){ L.add(h); L.add(h.split(".")[0]); } });
    (rf.socios || []).forEach(q => { const n = String(q.nome || "").trim(); if (n.split(" ").length >= 2) L.add(n); });
    return [...L].filter(x => x.length >= 3).sort((a, b) => b.length - a.length);
  }
  function anonimizador(s, codinome){
    const T = identificadores(s); if (!T.length) return x => x;
    const re = new RegExp(`(?<![\\wÀ-ÿ])(?:${T.map(esc2).join("|")})(?![\\wÀ-ÿ])`, "giu");
    return x => String(x).replace(re, codinome).replace(/\b(?:[\w.+-]+@[\w-]+\.[\w.]+)\b/g, "[contato pela Kinsey]");
  }
  const profundo = (o, f, k) => typeof o === "string" ? f(o) : Array.isArray(o) ? o.map(x => profundo(x, f)) : o && typeof o === "object" ? Object.fromEntries(Object.entries(o).map(([k2, v]) => [k2, k2 === "pares" ? v : profundo(v, f, k2)])) : o;
  if (window.KT_TEASER){ const _c = KT_TEASER.conteudo;
    KT_TEASER.conteudo = function(s, fase){ const Z = _c.apply(this, arguments); if (fase !== "pre") return Z; return profundo(Z, anonimizador(s, Z.codinome)); }; }
  const codinome = s => window.KT_TEASER ? KT_TEASER.conteudo(s, "pre").codinome : (s.mandato?.codinome || "Projeto");

  /* ---------------- números do dossiê ---------------- */
  function numeros(s){
    const o = {}; let R = null;
    try{ if (D.temBal(s)){ R = V.resumo(s); if (!R.X || R.X.vazio) R = null; } }catch(e){ R = null; }
    if (R){ const X = R.X, mer = R.met.find(m => /EV\/EBITDA/.test(m[0]) && !/Transa/.test(m[0]));
      Object.assign(o, {fonte:"balancetes e due diligence", rl:X.bp.rl, eb:X.bp.eb, W:X.W, fcd:[R.mod.min, R.mod.max], mer:mer ? [mer[1], mer[2]] : null, merTxt:mer ? mer[3] : "", faixa:R.rec}); }
    else { try{ const P = V.prev(s); if (!P.vazio){ const d = 1 - (P.Bs.P.desc?.v || 0) / 100, C = P.C || {};
        Object.assign(o, {fonte:"prévia pelo faturamento do cadastro", rl:P.rl, eb:P.eb, W:P.W, fcd:[P.ev * .9, P.ev * 1.1], mer:C.eb && P.eb > 0 ? [P.eb * C.eb.p25 * d, P.eb * C.eb.p75 * d] : null, merTxt:C.eb ? `${fmt(C.eb.p25, 1)}x a ${fmt(C.eb.p75, 1)}x EV/EBITDA (${C.eb.n} cias.), −${fmt(P.Bs.P.desc.v, 0)}% de liquidez` : ""}); }
        else o.W = P.W; }catch(e){} }
    if (o.fcd && o.mer){ const a = (o.fcd[0] + o.fcd[1]) / 2, b = (o.mer[0] + o.mer[1]) / 2; o.dif = b ? a / b - 1 : null; }
    if (!o.faixa && o.fcd) o.faixa = o.mer ? [(o.fcd[0] + o.mer[0]) / 2, (o.fcd[1] + o.mer[1]) / 2] : o.fcd;
    try{ if (window.KT_MAND){ const M = KT_MAND.calc(s); o.M = M; } }catch(e){}
    return o;
  }
  const mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e6, Math.abs(v) >= 1e8 ? 0 : 1)} mi`, pc = (v, d = 1) => v == null || !isFinite(v) ? "—" : `${fmt(v * 100, d)}%`;
  const RISCO = {alto:["Alto", "r-alto"], medio:["Médio", "r-medio"], baixo:["Baixo", "r-baixo"], pend:["Em avaliação", "r-pend"], na:["—", "r-pend"]};
  function card(s){
    const N = numeros(s), r = riskOf(s), W = N.W, M = N.M, rk = RISCO[r.level] || RISCO.pend;
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const top = (r.reasons || []).slice().sort((a, b) => (b.w || 0) - (a.w || 0)).slice(0, 3).map(x => `${x.crit}: ${String(x.txt || "").replace(/ — .*$/, "")}`);
    return `<div class="card" id="dv-inv" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Resumo para o investidor</div><h3 style="margin:0">${esc(s.mandato?.codinome || codinome(s))}</h3><p class="sub" style="margin:2px 0 0;font-size:12px">${esc(N.fonte ? "Números: " + N.fonte : "Importe balancetes ou informe o faturamento no cadastro para o valuation")}</p></div><span class="pill ${rk[1]}">Risco ${rk[0]}</span></div>
      <div class="dd-kpis">${k("Faturamento", mi(N.rl), "receita líquida")}${k("EBITDA", mi(N.eb), N.rl && N.eb ? "margem " + pc(N.eb / N.rl) : "")}${k("Valuation (faixa)", N.faixa ? `${mi(N.faixa[0])} a ${mi(N.faixa[1])}` : "—", "enterprise value")}</div>
      <div class="tbl"><table><thead><tr><th>Comparabilidade do valuation</th><th class="dd-num">Mínimo</th><th class="dd-num">Máximo</th></tr></thead><tbody>
        <tr><td>Fluxo de caixa descontado (FCD)${W ? `<div class="sub" style="margin:0;font-size:11.5px">WACC ${pc(W.wacc, 2)}</div>` : ""}</td><td class="dd-num">${N.fcd ? mi(N.fcd[0]) : "—"}</td><td class="dd-num">${N.fcd ? mi(N.fcd[1]) : "—"}</td></tr>
        <tr><td>Múltiplos de mercado${N.merTxt ? `<div class="sub" style="margin:0;font-size:11.5px">${esc(N.merTxt)}</div>` : ""}</td><td class="dd-num">${N.mer ? mi(N.mer[0]) : "—"}</td><td class="dd-num">${N.mer ? mi(N.mer[1]) : "—"}</td></tr>
        ${N.dif != null ? `<tr><td colspan="3" class="sub" style="font-size:12px">O FCD está ${Math.abs(N.dif) < .1 ? "alinhado ao mercado" : `${pc(Math.abs(N.dif), 0)} ${N.dif > 0 ? "acima" : "abaixo"} dos múltiplos de mercado`} (meio das faixas).</td></tr>` : ""}</tbody></table></div>
      ${W ? `<div class="tbl"><table><tbody><tr><td>WACC apurado</td><td class="dd-num"><b>${pc(W.wacc, 2)}</b></td></tr><tr><td>Beta do setor · ${esc(W.seg)} (desalavancado)</td><td class="dd-num">${fmt(W.bu, 2)}</td></tr><tr><td>Beta usado no custo do capital próprio (realavancado, D/E ${fmt(W.de, 2)})</td><td class="dd-num">${fmt(W.bl, 2)}</td></tr><tr><td>Custo do capital próprio</td><td class="dd-num">${pc(W.ke, 2)}</td></tr></tbody></table></div>` : ""}
      ${M ? `<div class="dd-kpis">${k("Success fee", `${M.c.pct}%`, "do valor da transação")}${k("Operação mínima", M.B ? mi(M.vmin) : "—", M.B ? `sucesso mínimo ${mi(M.sucMin)}` : "sem base de valor")}${k("Retainer sugerido", M.B ? KT_MAND.brl(M.ret) : "—", M.B ? `${M.c.parcelas} × ${KT_MAND.brl(M.parc)}` : "")}</div>` : ""}
      ${top.length ? `<div class="sub" style="margin:0;font-size:12.5px"><b>Principais preocupações:</b><ul style="margin:4px 0 0;padding-left:18px">${top.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-dv="pre">Teaser antes do NDA (sem nome)</button><button type="button" class="btn" data-dv="pos">Apresentação depois do NDA</button><button type="button" class="btn ghost" data-dv="val">Valuation</button></div></div>`;
  }
  function bind(s, el){
    $$("[data-dv]", el).forEach(b => b.onclick = async () => { const k = b.dataset.dv;
      if (k === "val"){ S.ddSel = s.id; $("#layer").innerHTML = ""; S.openSup = null; go("valuation"); return; }
      b.disabled = true; const t0 = b.textContent; b.textContent = "Gerando…";
      try{ await KT_REL.teaser(s, k, "pdf", "completo"); }catch(e){ console.error(e); toast("Não foi possível gerar o PDF."); } b.disabled = false; b.textContent = t0; });
  }
  const _rsb = renderSupBody;
  renderSupBody = function(){ const r = _rsb.apply(this, arguments); if (!["dados", "ma"].includes(S.supTab)) return r; const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || s.nivel !== "N3" || b.querySelector("#dv-inv")) return r;
    try{ const w = document.createElement("div"); w.innerHTML = card(s); const el = w.firstElementChild; if (S.supTab === "ma") (b.firstElementChild || b).prepend(el); else { const ref = b.querySelector(".card") || b.firstElementChild; if (ref) ref.before(el); else b.prepend(el); } bind(s, el); }catch(e){ console.error(e); } return r; };

  /* ---------------- questionário: sai do dossiê e vai para o Jurídico ---------------- */
  if (typeof TABS !== "undefined"){ const i = TABS.findIndex(t => t[0] === "quest"); if (i >= 0) TABS.splice(i, 1); }
  const irQuest = id => { S.jurTab = "quest"; if (id) S.jurQuest = id; $("#layer").innerHTML = ""; S.openSup = null; go("juridico"); };
  { const _os = openSupplier; openSupplier = function(id, tab){ if (tab === "quest") return irQuest(id); if (!tab && S.supTab === "quest") S.supTab = "dados"; return _os.apply(this, arguments); }; }
  { const _st = setTab; setTab = function(t){ if (t === "quest") return irQuest(S.openSup); return _st.apply(this, arguments); }; }
  function painelQuest(host){
    const L = S.suppliers.filter(x => x.nivel === "N3").sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt"));
    let s = supById(S.jurQuest) || supById(S.jurAlvo) || L[0]; if (!s){ host.insertAdjacentHTML("beforeend", `<div class="empty">Nenhum target cadastrado.</div>`); return; } S.jurQuest = s.id;
    const el = document.createElement("div"); el.className = "card"; el.id = "jur-quest"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="form"><div class="fld full"><label for="jq-sel">Empresa</label><select id="jq-sel">${L.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${esc(x.mandato?.codinome ? x.mandato.codinome + " · " : "")}${esc(x.nome)}</option>`).join("")}</select></div></div><div id="sup-body"></div>`;
    host.appendChild(el);
    const os = S.openSup, ot = S.supTab; S.openSup = s.id; S.supTab = "quest"; try{ _rsb(); }finally{ S.openSup = os; S.supTab = ot; }
    const sb = $("#sup-body", el); if (sb) sb.removeAttribute("id");
    $("#jq-sel", el).onchange = e => { S.jurQuest = e.target.value; renderJuridico(); };
  }
  if (typeof renderJuridico === "function"){ const _jr = renderJuridico;
    renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return; const tabs = host.querySelector(".dd-tabs"); if (!tabs || tabs.querySelector('[data-jur="quest"]')) return;
      const bt = document.createElement("button"); bt.type = "button"; bt.className = "fbtn"; bt.dataset.jur = "quest"; bt.textContent = "Questionário"; bt.setAttribute("aria-pressed", String(S.jurTab === "quest"));
      const ref = tabs.querySelector('[data-jur="nda"]') || tabs.querySelector('[data-jur="mand"]'); if (ref) ref.before(bt); else tabs.appendChild(bt); bt.onclick = () => { S.jurTab = "quest"; renderJuridico(); };
      if (S.jurTab !== "quest") return; tabs.querySelectorAll("[data-jur]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.jur === "quest")));
      const top = tabs.closest("#juridico > *") || tabs.parentElement; while (top.nextSibling) top.nextSibling.remove();
      try{ painelQuest(host); }catch(e){ console.error(e); host.insertAdjacentHTML("beforeend", `<div class="empty">Não foi possível montar o questionário.</div>`); } };
  }
  window.KT_DOSSIE = {identificadores, anonimizador, numeros, card};
})();
