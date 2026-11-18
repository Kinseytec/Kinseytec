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
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-dv="pre">Teaser antes do NDA (sem nome)</button><button type="button" class="btn" data-dv="pos">Apresentação depois do NDA</button><button type="button" class="btn" data-dv="rel">Relatórios</button><button type="button" class="btn ghost" data-dv="val">Valuation</button></div></div>`;
  }
  function bind(s, el){
    $$("[data-dv]", el).forEach(b => b.onclick = async () => { const k = b.dataset.dv;
      if (k === "val"){ S.ddSel = s.id; $("#layer").innerHTML = ""; S.openSup = null; go("valuation"); return; }
      if (k === "rel"){ relatorios(s); return; }
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
  /* ---------------- resumo para investidores por WhatsApp (até 30 linhas, sem identificar a empresa) ---------------- */
  const REG = {Norte:"AC AM AP PA RO RR TO", Nordeste:"AL BA CE MA PB PE PI RN SE", "Centro-Oeste":"DF GO MS MT", Sudeste:"ES MG RJ SP", Sul:"PR RS SC"};
  const regiao = uf => (Object.entries(REG).find(([, l]) => l.split(" ").includes(String(uf || "").toUpperCase())) || [""])[0];
  const INTERNO = /coopera|lgpd|nda|question|document|portal|cadastro|consulta|pend|inspe/i;
  function resumoWa(s){
    const cod = codinome(s), Z = window.KT_TEASER ? KT_TEASER.conteudo(s, "pre") : {destaques:[], tese:[]}, an = anonimizador(s, cod), N = numeros(s), W = N.W, M = N.M, r = riskOf(s);
    const rf = s.receita && !s.receita.erro ? s.receita : {}, ano = +(String(rf.abertura || "").match(/(19|20)\d\d/) || [])[0] || 0, idade = ano ? new Date().getFullYear() - ano : 0;
    const seg = s.perfil?.segmento || s.segmento || W?.seg || "", atv = rf.cnaeDesc ? an(rf.cnaeDesc) : "", rg = regiao(s.uf), m1 = v => mi(v).replace(",0 mi", " mi");
    const L = [`*Oportunidade de investimento · ${cod}*`, `_Kinsey Capital · confidencial · empresa não identificada_`, ""];
    L.push("*A empresa*");
    L.push(`• ${[seg && "Segmento " + seg, rg && "região " + rg, idade >= 5 ? `mais de ${Math.floor(idade / 5) * 5} anos de operação` : ""].filter(Boolean).join(" · ") || "Empresa de capital fechado"}`);
    if (atv) L.push(`• Atividade: ${atv.charAt(0).toUpperCase() + atv.slice(1).toLowerCase()}`);
    if (N.rl) L.push(`• Faturamento ${m1(N.rl)}${N.eb ? ` · EBITDA ${m1(N.eb)} (margem ${pc(N.eb / N.rl)})` : ""}`);
    const cres = (Z.destaques || []).find(d => /cresc/i.test(d)); if (cres) L.push(`• ${an(cres).replace(/\.$/, "")}`);
    L.push("", "*Valor esperado*");
    if (N.faixa) L.push(`• Faixa de valuation: ${m1(N.faixa[0])} a ${m1(N.faixa[1])} (enterprise value)`);
    if (N.fcd) L.push(`• Fluxo de caixa descontado: ${m1(N.fcd[0])} a ${m1(N.fcd[1])}${W ? ` · WACC ${pc(W.wacc)}` : ""}`);
    if (N.mer) L.push(`• Múltiplos de mercado: ${m1(N.mer[0])} a ${m1(N.mer[1])}${N.merTxt ? ` (${N.merTxt.replace(/ \(\d+ cias\.\)/, "").replace(/, −.*$/, "")})` : ""}`);
    if (N.dif != null) L.push(`• Fluxo de caixa ${Math.abs(N.dif) < .1 ? "alinhado aos múltiplos de mercado" : `${pc(Math.abs(N.dif), 0)} ${N.dif > 0 ? "acima" : "abaixo"} dos múltiplos de mercado`}`);
    if (N.eb > 0 && N.faixa) L.push(`• Múltiplo implícito: ${fmt((N.faixa[0] + N.faixa[1]) / 2 / N.eb, 1)}x o EBITDA`);
    if (M?.B) L.push(`• Operação mínima: ${m1(M.vmin)}`);
    if (Z.transacao) L.push(`• ${an(Z.transacao).replace(/^Transação: /, "Transação: ")}`);
    L.push("", "*Riscos*");
    const rk = {alto:"alto", medio:"médio", baixo:"baixo"}[r.level];
    const motivos = (r.reasons || []).filter(x => !INTERNO.test((x.crit || "") + " " + (x.txt || ""))).slice(0, 2).map(x => an(String(x.txt || "").replace(/ — .*$/, "")));
    L.push(`• Empresa: risco ${rk || "em avaliação"}${motivos.length ? "" : rk === "baixo" ? " nas consultas públicas e na due diligence" : ""}`); motivos.forEach(t => L.push(`  – ${t.length > 110 ? t.slice(0, 107) + "…" : t}`));
    if (W) L.push(`• Setor: beta ${fmt(W.bu, 2)} (${W.bu < .9 ? "menos volátil que a média do mercado" : W.bu > 1.1 ? "mais volátil que a média do mercado" : "próximo da média do mercado"})${N.eb && N.rl ? "" : ""}`);
    const dl = (Z.destaques || []).find(d => /endividamento|dívida|caixa líquido/i.test(d)); if (dl) L.push(`• ${an(dl).replace(/\.$/, "")}`);
    const dest = [...(Z.destaques || []).filter(d => d !== cres && d !== dl), ...(Z.tese || []).filter(d => !/balanço (leve|sem dívida)/i.test(d) || !dl)].map(an).filter(Boolean);
    const vagas = 30 - L.length - 4; if (vagas > 0 && dest.length){ L.push("", "*Destaques*"); dest.slice(0, Math.min(3, vagas - 1)).forEach(d => L.push(`• ${d.length > 120 ? d.slice(0, 117) + "…" : d.replace(/\.$/, "")}`)); }
    L.push("", "Próximo passo: assinatura do NDA para receber a apresentação completa e o acesso ao data room. Contato pela Kinsey Capital.");
    return L.slice(0, 30).join("\n");
  }
  /* ---------------- central de relatórios do target ---------------- */
  function relatorios(s, host){
    s = supById(s.id) || s; const R = window.KT_REL, D2 = D, per = (D2.periodos ? D2.periodos(s) : Object.keys(s.dd?.bal || {}).sort().reverse())[0] || "", bal = !!per;
    const atv = window.KT_ATV ? KT_ATV.bens(s).length : 0, imv = s.imoveis || [], jdd = !!window.KT_JDD, cod = codinome(s);
    const G = [
      ["Prospecção · antes do NDA (sem o nome da empresa)", [["pre-pdf", "Teaser (PDF)", true], ["pre-one", "One-pager (PDF)", true], ["pre-ppt", "Teaser (PowerPoint)", true]], `sai como ${cod}`],
      ["Prospecção · depois do NDA", [["pos-pdf", "Apresentação (PDF)", true], ["pos-one", "Resumo (PDF)", true], ["pos-ppt", "Apresentação (PowerPoint)", true]], "com o nome da empresa"],
      ["Valuation", [["val-pdf", "Relatório (PDF)", bal], ["val-ppt", "Apresentação (PowerPoint)", bal]], bal ? "" : "importe os balancetes na Due Diligence"],
      ["Due diligence", [["dd-pdf", "Relatório (PDF)", bal], ["dd-pt", "Papéis de trabalho (PDF)", bal], ["an-pdf", "Análises financeiras (PDF)", bal]], bal ? `data-base ${per.split("-").reverse().join("/")}` : "importe os balancetes"],
      ["Avaliação de ativos", [["atv-doc", "Laudo (Word)", atv > 0], ["atv-xls", "Planilha (Excel)", atv > 0], ...imv.map((m, i) => [`imv-${i}`, `Laudo do imóvel ${i + 1}${m.matricula ? " · matrícula " + m.matricula : ""} (Word)`, true])], atv ? `${atv} bem(ns)` : "importe o cadastro de bens em Avaliação de ativos"],
      ["Diligência jurídica", [["jur-pdf", "Relatório jurídico (PDF)", jdd]], ""],
      ["Pós-aquisição", [["ppa-pdf", "PPA (PDF)", bal && !!window.KT_POS], ["imp-pdf", "Laudo de impairment (PDF)", bal && !!window.KT_IMP], ["imp-ppt", "Impairment (PowerPoint)", bal && !!window.KT_IMP]], bal ? "PPA e teste de impairment (CPC 01)" : "importe os balancetes"]];
    const cards = `${G.map(([t, L, nota]) => `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div><h3 style="margin:0;font-size:15px">${esc(t)}</h3>${nota ? `<p class="sub" style="margin:2px 0 0;font-size:12px">${esc(nota)}</p>` : ""}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${L.map(([k, l, ok]) => `<button type="button" class="btn sm ${/pre-pdf|pos-pdf|val-pdf|dd-pdf|atv-doc|jur-pdf|imp-pdf/.test(k) ? "primary" : ""}" data-rl="${k}" ${ok ? "" : "disabled"}>${esc(l)}</button>`).join("")}</div></div>`).join("")}
        <p class="sub" style="margin:0;font-size:12px">Antes do NDA nenhum relatório traz nome, CNPJ, site ou sócios da empresa, nem no nome do arquivo.</p>`;
    let root = host;
    if (host) host.innerHTML = cards;
    else { sheet(`<div class="sheet-h"><div><div class="eyebrow">Relatórios · ${esc(s.nivel)}</div><h2>${esc(s.mandato?.codinome ? s.mandato.codinome + " · " : "")}${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" id="rl-sheet" style="display:flex;flex-direction:column;gap:12px">${cards}</div>`); root = $("#rl-sheet"); }
    const run = {
      "pre-pdf": () => R.teaser(s, "pre", "pdf", "completo"), "pre-one": () => R.teaser(s, "pre", "pdf", "resumo"), "pre-ppt": () => R.teaser(s, "pre", "pptx"),
      "pos-pdf": () => R.teaser(s, "pos", "pdf", "completo"), "pos-one": () => R.teaser(s, "pos", "pdf", "resumo"), "pos-ppt": () => R.teaser(s, "pos", "pptx"),
      "val-pdf": () => R.valuation(s, "pdf"), "val-ppt": () => R.valuation(s, "pptx"),
      "dd-pdf": () => R.ddPdf(s, per), "dd-pt": () => R.papeisPdf(s, per), "an-pdf": () => R.analises(s, "completo"),
      "atv-doc": () => KT_ATV.laudo(s), "atv-xls": () => KT_ATV.excel(s), "jur-pdf": () => KT_JDD.relatorio(s, "completo"), "ppa-pdf": () => KT_POS.ppaPdf(s), "imp-pdf": () => KT_IMP.pdf(s), "imp-ppt": () => KT_IMP.ppt(s)};
    $$("[data-rl]", root).forEach(b => b.onclick = async () => { const k = b.dataset.rl, f = run[k] || (/^imv-/.test(k) && window.KT_IMOV ? () => KT_IMOV.laudo(s, imv[+k.slice(4)]) : null); if (!f) return;
      const t0 = b.textContent; b.disabled = true; b.textContent = "Gerando…"; try{ await f(); }catch(e){ console.error(e); toast("Não foi possível gerar: " + (e.message || "erro")); } b.disabled = false; b.textContent = t0; });
  }
  /* botão Relatórios no quadro da Órbita, ao lado de Abrir dossiê e Resumo rápido */
  if (typeof renderTarget === "function"){ const _rt = renderTarget;
    renderTarget = function(){ const r = _rt.apply(this, arguments); const t = $("#target"); if (!t || t.hidden || !S.sel || $("#tg-rel", t)) return r; const s = supById(S.sel); if (!s || s.nivel !== "N3") return r;
      const ref = $("#tg-cr", t) || [...t.querySelectorAll("a.btn, button.btn")].pop(); if (!ref) return r;
      const b = document.createElement("button"); b.type = "button"; b.className = "btn sm"; b.id = "tg-rel"; b.textContent = "Relatórios"; b.onclick = () => relatorios(supById(S.sel)); ref.after(b); return r; }; }

  /* risco: falta de NDA e questionário em aberto são pendências de documento (Jurídico), não risco do investimento */
  { const _ro = riskOf; riskOf = function(s){ const r = _ro.apply(this, arguments); if (!r || !Array.isArray(r.reasons)) return r;
      const fora = x => /^coopera/i.test(nrm(x.crit)) && /nda|lgpd|question/i.test(nrm(x.txt)), R = r.reasons.filter(x => !fora(x)); if (R.length === r.reasons.length) return r;
      const score = R.reduce((t, x) => t + (x.pts || 0), 0), auto = r.auto === "pend" || r.auto === "na" ? r.auto : score >= 6 ? "alto" : score >= 3 ? "medio" : "baixo";
      return {...r, reasons:R, score, auto, level:r.manual ? r.level : auto}; }; }
  /* ---------- Apresentação: consolidação de todos os relatórios e o mercado da empresa ---------- */
  function mercadoHtml(s){
    const M = {...(typeof VAL_BASE !== "undefined" ? VAL_BASE.mercado : {}), ...(S.mercado?.atual || {})}, seg = s.perfil?.segmento || s.segmento || "", rf = s.receita && !s.receita.erro ? s.receita : {};
    let C = null, W = null, T = null; try{ C = KT_VAL.comparaveis(s); }catch(e){} try{ W = KT_VAL.wacc(s, KT_VAL.base(), s.dd?.vl || {}); }catch(e){} try{ T = KT_VAL.transacoes(s); }catch(e){}
    const Z = window.KT_TEASER ? KT_TEASER.conteudo(s, "pos") : {mercado:[], noticias:[]}, N = numeros(s);
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`, x2 = v => v == null ? "—" : `${fmt(v, 1)}×`;
    const neg = [...(s.ext?.noticias || [])].slice(0, 5), not = [...(Z.noticias || [])].slice(0, 5);
    return `<div class="card" id="ap-merc" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">Mercado e setor</div><h3 style="margin:0">${esc(seg || "Segmento")}${rf.cnaeDesc ? ` · ${esc(rf.cnaeDesc)}` : ""}</h3></div>
      <div class="dd-kpis">${k("EV/EBITDA do setor", C?.eb ? `${x2(C.eb.p25)} a ${x2(C.eb.p75)}` : "—", C?.eb ? `mediana ${x2(C.eb.med)} · ${C.eb.n} companhias abertas` : "comparáveis na versão publicada")}${k("Margem EBITDA do setor", C?.mg ? `${fmt(C.mg.med * 100, 1)}%` : "—", N.rl && N.eb ? `empresa: ${fmt(N.eb / N.rl * 100, 1)}%` : "")}${k("Transações no setor", T?.eb ? x2(T.eb.med) : "—", T?.eb ? `${T.eb.n} aquisições (EV/EBITDA)` : "")}${k("Beta do setor", W ? fmt(W.bu, 2) : "—", W ? `WACC ${fmt(W.wacc * 100, 2)}%` : "")}</div>
      <div class="dd-kpis">${k("Selic", M.selic != null ? `${fmt(M.selic, 2)}%` : "—", "Banco Central")}${k("IPCA 12 meses", M.ipca12 != null ? `${fmt(M.ipca12, 2)}%` : "—", "")}${k("Dólar", M.ptax != null ? `R$ ${fmt(M.ptax, 2)}` : "—", "PTAX")}${M.ibov ? k("Ibovespa", fmt(M.ibov, 0), "pontos") : ""}</div>
      ${(Z.mercado || []).length ? `<ul style="margin:0;padding-left:18px;font-size:13px;display:flex;flex-direction:column;gap:3px">${Z.mercado.slice(0, 6).map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${not.length ? `<div class="eyebrow">Notícias do segmento</div><div style="display:flex;flex-direction:column;gap:4px">${not.map(n => `<a href="${esc(n.url || "#")}" target="_blank" rel="noopener" style="font-size:13px;color:var(--fog);text-decoration:none">${esc(n.titulo)} <span class="sub" style="font-size:11px">· ${esc(n.fonte || "")} ${esc(n.data || "")}</span></a>`).join("")}</div>` : ""}
      ${neg.length ? `<div class="eyebrow">Notícias da empresa</div><div style="display:flex;flex-direction:column;gap:4px">${neg.map(n => `<a href="${esc(n.url || "#")}" target="_blank" rel="noopener" style="font-size:13px;color:var(--fog);text-decoration:none">${esc(n.titulo)} <span class="sub" style="font-size:11px">· ${esc(n.fonte || "")} ${esc(n.data || "")}</span></a>`).join("")}</div>` : ""}
      <p class="sub" style="margin:0;font-size:12px">A pesquisa de mercado e setor que a equipe escreve em "Conteúdo e pesquisa" entra no teaser e na apresentação depois do NDA.</p></div>`;
  }
  if (EXT_VIEWS.apresentacao){ const _ap = EXT_VIEWS.apresentacao; EXT_VIEWS.apresentacao = function(){ const r = _ap.apply(this, arguments); const host = $("#apresentacao"), s = D.alvoSel(); if (!host || !s || $("#ap-rel", host)) return r;
      try{ const ref = host.querySelector(".dd-split > div:last-child") || host; const box = document.createElement("div"); box.style.cssText = "display:flex;flex-direction:column;gap:14px";
        box.innerHTML = `<div class="card" id="ap-rel" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">Consolidação</div><h3 style="margin:0">Todos os relatórios de ${esc(s.mandato?.codinome || s.nome)}</h3><p class="sub" style="margin:2px 0 0;font-size:12.5px">Prospecção antes e depois do NDA, valuation, due diligence, análises financeiras, avaliação de ativos e jurídico, num só lugar.</p></div><div id="ap-rel-b" style="display:flex;flex-direction:column;gap:10px"></div></div>${mercadoHtml(s)}`;
        ref.prepend(box); relatorios(s, $("#ap-rel-b", box)); }catch(e){ console.error(e); }
      return r; }; }
  /* Apresentação fica por último no menu: consolida o trabalho das outras áreas */
  const ultimo = () => { const b = document.querySelector('nav.tabs [data-go="apresentacao"]'); if (b && b.parentElement.lastElementChild !== b) b.parentElement.appendChild(b); };
  setTimeout(ultimo, 0); setTimeout(ultimo, 1500);
  { const _ra = renderAll; renderAll = function(){ const r = _ra.apply(this, arguments); ultimo(); return r; }; }
  window.KT_RESUMO_WA = s => s && s.nivel === "N3" ? resumoWa(s) : null;
  window.KT_DOSSIE = {identificadores, anonimizador, numeros, card, resumoWa, relatorios};
})();
