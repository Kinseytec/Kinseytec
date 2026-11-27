/* ================= VISÃO DO CLIENTE: ALERTAS, CADEIA N1 → N2 → N3, JURÍDICO E RELATÓRIO =================
   - Relatório de pontos sempre no canto superior direito.
   - Auditoria abre com os alertas prioritários (ênfase no risco alto) e com a cadeia N1 → N2 → N3: o risco de cada elo,
     a exposição herdada de quem está abaixo e as notícias públicas dos locais onde operam.
   - Jurídico: modo síntese ou expandido; importação de contrato social, cartão CNPJ e outros documentos importantes
     (pré-análise automática que alimenta as demais bases); considerações e ressalvas do advogado vão para o relatório. */
const VISAO = (() => {
  const RO = {alto: 0, medio: 1, baixo: 2, pend: 3}, NV = {N1: "◆", N2: "■", N3: "●"};
  const sem = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const RK = new Map(), rk = s => { let r = RK.get(s); if (!r){ r = riskOf(s); RK.set(s, r); } return r; };
  const pior = (a, b) => RO[a] <= RO[b] ? a : b;
  if (!document.getElementById("kt-visao-css")){ const st = document.createElement("style"); st.id = "kt-visao-css";
    st.textContent = `@media (min-width:561px){.topbar{z-index:21!important}.scrim .sheet{margin-top:64px}}.rptbtn{border-color:#7FB8E6;background:rgba(127,184,230,.16)}.rptbtn svg{flex-shrink:0}@media (max-width:560px){.rptbtn{display:none!important}}
.va-card{border:1px solid var(--line);border-left:4px solid var(--bad);display:flex;flex-direction:column;gap:10px}.va-ok{border-left-color:var(--ok)}
.va-row{display:flex;gap:10px;align-items:flex-start;border-top:1px solid var(--line);padding-top:9px;cursor:pointer;background:none;color:inherit;font:inherit;text-align:left;width:100%;border-left:0;border-right:0;border-bottom:0}
.va-row:hover b{color:var(--glow)}.va-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:4px}
.va-num{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px;padding:8px 12px;min-width:120px}.va-num b{font-size:22px;line-height:1.1}.va-num span{font-size:11.5px;color:var(--muted)}
.cad-n1{border:1px solid var(--line);border-radius:12px;padding:8px 10px}.cad-n1>summary{list-style:none;cursor:pointer;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cad-n1>summary::-webkit-details-marker{display:none}
.cad-kids{margin:8px 0 2px 14px;padding-left:12px;border-left:2px solid var(--line);display:flex;flex-direction:column;gap:6px}
.cad-node{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px}.cad-node button.lk{background:none;border:0;color:var(--fog);font:inherit;font-weight:600;cursor:pointer;padding:0;text-align:left}.cad-node button.lk:hover{color:var(--glow)}
.cad-tag{font-size:11px;border-radius:99px;padding:2px 8px;border:1px solid currentColor;white-space:nowrap}.cad-news{font-size:12px;margin:4px 0 0 20px;display:flex;flex-direction:column;gap:4px}
.cad-news a{color:var(--glow)}`;
    document.head.appendChild(st); }
  const tag = (lv, txt) => `<span class="cad-tag" style="color:${RCOL[lv] || RCOL.pend}">${esc(txt || RISK_LABEL[lv])}</span>`;
  const mot = (r, n = 2) => r.reasons.slice().sort((a, b) => b.pts - a.pts).slice(0, n).map(x => x.txt);

  /* ---------- cadeia: filhos, exposição herdada e notícias por local ---------- */
  const filhos = s => S.suppliers.filter(k => k.parentId === s.id).sort((a, b) => RO[rk(a).level] - RO[rk(b).level] || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt"));
  function exposicao(s, vis = new Set()){
    if (vis.has(s.id)) return {lv: "pend", via: []}; vis.add(s.id);
    let lv = rk(s).level === "pend" ? "baixo" : rk(s).level, via = [];
    filhos(s).forEach(k => { const kl = rk(k).level, e = exposicao(k, vis);
      if (kl === "alto") via.push(k); via.push(...e.via.filter(x => !via.includes(x)));
      lv = pior(lv, kl === "pend" ? lv : kl); lv = pior(lv, e.lv); });
    return {lv, via};
  }
  const UFN = {AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"};
  const palavra = (w, flags) => new RegExp("(^|[^\\p{L}])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^\\p{L}]|$)", flags);
  const cacheN = new Map();
  function noticias(s){
    const k = (s.municipio || "") + "|" + (s.uf || ""); if (cacheN.has(k)) return cacheN.get(k);
    const mun = sem(s.municipio), uf = (s.uf || "").toUpperCase(), out = [];
    setorNews().forEach(n => { const raw = n[1] + " " + n[2], tx = sem(raw);
      if (mun.length > 3 && palavra(mun, "iu").test(tx)) out.push({n, onde: "município"});
      else if (uf && (palavra(uf, "u").test(raw) || (UFN[uf] && palavra(UFN[uf], "u").test(raw)))) out.push({n, onde: "estado"}); });
    cacheN.set(k, out); return out;
  }
  const KW = '(operação OR fiscalização OR "trabalho escravo" OR embargo OR desmatamento OR furto OR receptação OR autuação)';
  const gnews = q => "https://news.google.com/search?hl=pt-BR&gl=BR&ceid=BR:pt-419&q=" + encodeURIComponent(q);
  function linksNoticias(s){
    const L = [];
    if (s.municipio || s.uf) L.push(`<a href="${gnews(`"${s.municipio || UFN[s.uf] || s.uf}" ${s.municipio && s.uf ? s.uf : ""} ${KW}`)}" target="_blank" rel="noopener">Pesquisar notícias do local ↗</a>`);
    if (String(s.doc || "").replace(/\D/g, "").length === 14 && s.nome) L.push(`<a href="${gnews(`"${fixMoji(s.nome)}"`)}" target="_blank" rel="noopener">Notícias sobre a empresa ↗</a>`);
    return L.join(" · ");
  }

  /* ---------- relatório de pontos sempre à mão (canto superior direito) ---------- */
  function abrirRelatorio(){
    const d = rptData(), card = rptCard().replace(/id="rpt/g, 'id="rpts').replace(/for="rpt-/g, 'for="rpts-').replace("margin-bottom:18px", "margin:0");
    sheet(`<div class="sheet-h"><div><div class="eyebrow">Para o cliente contratante · acesso rápido</div><h2>Relatório de pontos</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap">${[["alto", "Alto risco"], ["medio", "Médio risco"], ["baixo", "Baixo risco"], ["pend", "Em avaliação"]].map(([k, l]) => `<div class="va-num"><b style="color:${RCOL[k]}">${d.dist[k]}</b><span>${l}</span></div>`).join("")}</div>
        ${d.pontos.length ? `<div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Principais pontos</h3>${d.pontos.slice(0, 6).map(p => `<div style="display:flex;gap:8px;align-items:baseline;border-top:1px solid var(--line);padding-top:6px"><b style="color:${p.sev === "Alta" ? RCOL.alto : p.sev === "Média" ? RCOL.medio : RCOL.baixo};min-width:44px;font-size:12px">${p.sev}</b><span style="font-size:13px">${esc(p.txt)} <span class="sub" style="margin:0">· ${p.sups.length} fornecedor(es)</span></span></div>`).join("")}</div>` : ""}
        ${card}</div>`);
    $$("#layer [data-rpt]").forEach(b => b.onclick = async () => { b.disabled = true; const t = b.textContent; b.textContent = "Gerando…"; await rptGen(b.dataset.rpt); b.disabled = false; b.textContent = t; });
    const f = $("#rpts-f"); if (f) f.onsubmit = e => { e.preventDefault(); save(Store.set("config", "relatorio", {clientePdf: $("#rpts-cli").checked, responsavel: $("#rpts-resp").value.trim(), escopo: $("#rpts-esc").value.trim(), em: nowISO()})).then(() => toast("Controle do relatório salvo")); };
  }
  function irRelatorio(){ $("#layer").innerHTML = ""; S.openSup = null; go("relatorio"); try{ $("#v-relatorio").scrollTop = 0; }catch(e){} }
  function menuRelatorio(btn){
    const old = $("#rpt-menu"); if (old){ old.remove(); return; }
    const sid = S.openSup || S.sel, sp = sid ? supById(sid) : null, r = btn.getBoundingClientRect();
    const m = document.createElement("div"); m.id = "rpt-menu"; m.setAttribute("role", "menu");
    m.style.cssText = `position:fixed;top:${Math.round(r.bottom + 6)}px;right:${Math.max(8, Math.round(innerWidth - r.right))}px;z-index:40;background:var(--navy);border:1px solid var(--line-2);border-radius:12px;box-shadow:0 14px 40px rgba(0,0,0,.5);padding:6px;display:flex;flex-direction:column;min-width:250px`;
    const it = (id, t, sub) => `<button type="button" data-rm="${id}" style="text-align:left;background:none;border:0;color:var(--fog);font:inherit;padding:9px 10px;border-radius:8px;cursor:pointer"><b style="font-size:13px">${t}</b>${sub ? `<div style="font-size:11.5px;color:var(--muted)">${sub}</div>` : ""}</button>`;
    m.innerHTML = it("geral", "Relatório geral (PDF)", "todos os fornecedores, com gráficos") + (sp ? it("fres", "Resumido deste fornecedor (PDF)", esc(sp.nivel + " · " + sp.nome)) + it("forn", "Completo deste fornecedor (PDF)", esc(sp.nivel + " · " + sp.nome)) + it("res", "Análise prévia / WhatsApp", esc(sp.nome)) : "") + it("tela", "Abrir tela Relatório", "consulta por fornecedor ou CNPJ, andamento e pontos");
    document.body.appendChild(m);
    $$("[data-rm]", m).forEach(x => { x.onmouseenter = () => { x.style.background = "rgba(127,184,230,.12)"; }; x.onmouseleave = () => { x.style.background = "none"; };
      x.onclick = async () => { m.remove(); const k = x.dataset.rm;
        if (k === "geral"){ btn.disabled = true; await rptGen("pdf"); btn.disabled = false; }
        else if (k === "forn") rptFornecedor(sp.id); else if (k === "fres") rptResumo(sp.id); else if (k === "res"){ $("#layer").innerHTML = ""; consultaRapida(sp.id); } else irRelatorio(); }; });
    setTimeout(() => { const fora = e => { if (!m.contains(e.target) && e.target !== btn && !btn.contains(e.target)){ m.remove(); document.removeEventListener("click", fora, true); } }; document.addEventListener("click", fora, true); }, 0);
  }
  function botaoTopo(){ const b = $("#rpt-top"); if (!b) return; const ok = !!Store.me && Store.me.role !== "fornecedor"; b.hidden = !ok; if (!b._ok){ b._ok = 1; b.style.position = "relative"; b.style.zIndex = "30"; b.onclick = e => { e.stopPropagation(); menuRelatorio(b); }; } }

  /* ---------- tela "Relatório" (primeiro item do menu) ---------- */
  EXT_VIEWS.relatorio = function(){
    const host = $("#relatorio"); if (!host) return; RK.clear(); botaoTopo();
    const d = rptData(), L = S.suppliers.map(s => ({s, r: rk(s)})), N1 = S.suppliers.filter(s => s.nivel === "N1" || !s.parentId || !supById(s.parentId)), expo = N1.filter(s => exposicao(s).lv === "alto").length, J = itensJuridicos();
    const SEVC = {Alta: RCOL.alto, "Média": RCOL.medio, Baixa: RCOL.baixo};
    host.innerHTML = `<div class="head"><div><div class="eyebrow">Relatório para o cliente contratante</div><h2>Relatório de pontos</h2><p class="sub">Principais riscos, fornecedores envolvidos, recomendações, normas e legislação, com a matriz de risco, a cadeia N1 → N2 → N3, os contratos, as ressalvas do Jurídico e os testes de asseguração.</p></div></div>
      ${rptCard().replace("margin-bottom:18px", "margin:0")}
      <div style="display:flex;gap:8px;flex-wrap:wrap">${[["alto", "Alto risco"], ["medio", "Médio risco"], ["baixo", "Baixo risco"], ["pend", "Em avaliação"]].map(([k, l]) => `<div class="va-num"><b style="color:${RCOL[k]}">${d.dist[k]}</b><span>${l}</span></div>`).join("")}
        <div class="va-num"><b style="color:${expo ? RCOL.alto : "inherit"}">${expo}</b><span>cadeia(s) com risco alto em algum elo</span></div><div class="va-num"><b>${J.length}</b><span>ressalva(s) e consideração(ões) do Jurídico</span></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Principais pontos (${d.pontos.length})</h3>${d.pontos.length ? `<div class="tbl"><table><thead><tr><th>Severidade</th><th>Ponto</th><th>Fornecedores</th><th>Recomendação</th></tr></thead><tbody>${d.pontos.slice(0, S.rptMais ? 200 : 10).map(p => `<tr><td><b style="color:${SEVC[p.sev]}">${p.sev}</b></td><td style="min-width:200px">${esc(p.txt)}<div class="sub" style="margin:0;font-size:11px">${esc(p.crit)}</div></td><td style="font-size:12.5px;min-width:180px">${p.sups.slice(0, 4).map(s => `${s.nivel} · ${esc(s.nome)}`).join("<br>")}${p.sups.length > 4 ? `<br><span class="sub" style="margin:0">e mais ${p.sups.length - 4}</span>` : ""}</td><td style="font-size:12.5px;min-width:220px">${esc(p.rec)}</td></tr>`).join("")}</tbody></table></div>${d.pontos.length > 10 ? `<button type="button" class="btn sm ghost" id="rp-mais" style="align-self:flex-start">${S.rptMais ? "Mostrar só os 10 principais" : `Ver todos (${d.pontos.length})`}</button>` : ""}` : `<p class="sub" style="margin:0">Nenhum ponto de risco registrado até agora.</p>`}</div>
      ${L.filter(x => x.r.level === "alto").length ? `<div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Fornecedores em risco alto</h3>${L.filter(x => x.r.level === "alto").sort((a, b) => b.r.score - a.r.score).slice(0, 12).map(({s, r}) => `<button type="button" class="va-row" data-rpo="${s.id}"><span class="va-dot" style="background:${RCOL.alto}"></span><div style="min-width:0;flex:1"><b>${s.nivel} · ${esc(s.nome)}</b> <span class="sub" style="margin:0">${esc([s.municipio, s.uf].filter(Boolean).join("/") || "—")} · ${r.score} pontos</span><div class="sub" style="margin:2px 0 0;font-size:12.5px">${mot(r).map(esc).join(" · ")}</div></div><span class="sub" style="margin:0">Abrir ›</span></button>`).join("")}</div>` : ""}`;
    bindRpt();
    { const c0 = host.querySelector("#rpt"); if (c0){ const h = c0.querySelector("h2"), eb = c0.querySelector(".eyebrow"); if (h) h.textContent = "Relatório geral · todos os fornecedores"; if (eb) eb.textContent = "Posição geral para o cliente contratante"; } }
    { const pg = painelGeral(), c = host.querySelector("#rpt"); if (pg && c) c.after(pg);
      const rf = document.createElement("div"); rf.className = "card"; rf.id = "rpt-forn"; rf.style.cssText = "display:flex;flex-direction:column;gap:8px";
      rf.innerHTML = `<div><div class="eyebrow">Por fornecedor · N1, N2 ou N3</div><h3>Relatório de pontos por fornecedor · resumido ou completo</h3><p class="sub" style="margin:4px 0 0">Escolha o fornecedor e gere o PDF com risco e pontuação, gráficos, todos os pontos identificados com recomendação e norma, andamento, documentos, investigação, Jurídico e a cadeia abaixo dele. O relatório geral (botão acima) traz a posição de todos os fornecedores, com os gráficos.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input class="search" type="search" id="rf-q" style="flex:1 1 200px" placeholder="Buscar fornecedor por nome ou CNPJ/CPF"><select class="search" id="rf-s" style="flex:2 1 280px"></select><button type="button" class="btn primary" id="rf-res">Resumido (PDF)</button><button type="button" class="btn primary" id="rf-go">Completo (PDF)</button><button type="button" class="btn" id="rf-cr">Resumo rápido / WhatsApp</button><button type="button" class="btn ghost" id="rf-cnpj">Consultar CNPJ fora do sistema</button></div>`;
      (pg || c)?.after(rf);
      const sel = $("#rf-s", rf), q = $("#rf-q", rf), op = () => { const L = S.suppliers.filter(x => buscaCasa(x, q.value)).sort((a, b) => RO[rk(a).level] - RO[rk(b).level] || a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt"));
        sel.innerHTML = L.length ? L.map(x => `<option value="${x.id}">${x.nivel} · ${esc(x.nome)} · ${RISK_LABEL[rk(x).level]}</option>`).join("") : `<option value="">Nenhum fornecedor encontrado</option>`; };
      q.oninput = op; op(); $("#rf-go", rf).onclick = () => { if (sel.value) rptFornecedor(sel.value); }; $("#rf-res", rf).onclick = () => { if (sel.value) rptResumo(sel.value); }; $("#rf-cr", rf).onclick = () => { if (sel.value) consultaRapida(sel.value); }; $("#rf-cnpj", rf).onclick = () => { const d = dd(q.value); if (d.length === 14 && IMP.docValido(d)) consultaCnpj(d); else toast("Digite o CNPJ completo na busca ao lado"); }; }
    $$("[data-rpo]", host).forEach(b => b.onclick = () => openSupplier(b.dataset.rpo, "risco"));
    const m = $("#rp-mais", host); if (m) m.onclick = () => { S.rptMais = !S.rptMais; EXT_VIEWS.relatorio(); };
  };

  /* ---------- Auditoria: alertas prioritários (risco alto primeiro) ---------- */
  S.vaMais = S.vaMais || false;
  function alertas(){
    const L = S.suppliers.map(s => ({s, r: rk(s)})), altos = L.filter(x => x.r.level === "alto").sort((a, b) => b.r.score - a.r.score);
    const expostos = L.filter(x => x.r.level !== "alto" && x.s.nivel !== "N3" && exposicao(x.s).lv === "alto");
    const listas = L.filter(x => x.r.reasons.some(y => /lista|Cadastro de Empregadores|CEIS|CNEP|IBAMA|embargad/i.test(y.crit + " " + y.txt)));
    let nfAlto = 0; try{ if (typeof OPS !== "undefined") nfAlto = OPS.analise().R.filter(x => x.alertas.some(a => a.sev === "alto")).length; }catch(e){}
    const comNews = altos.filter(x => noticias(x.s).length);
    const el = document.createElement("div"); el.className = "card va-card" + (altos.length || expostos.length ? "" : " va-ok"); el.id = "va-alertas";
    if (!altos.length && !expostos.length && !nfAlto){ el.innerHTML = `<div><div class="eyebrow">Alertas prioritários</div><h3>Nenhum fornecedor em risco alto no momento</h3><p class="sub" style="margin:4px 0 0">A diligência automática continua consultando Receita, listas oficiais e notas fiscais a cada novo cadastro ou documento.</p></div>`; return el; }
    const vis = S.vaMais ? altos : altos.slice(0, 6);
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow" style="color:var(--bad)">Alertas prioritários · comece por aqui</div><h2 style="margin:2px 0 0">${altos.length} fornecedor(es) em risco alto</h2></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div class="va-num"><b style="color:var(--bad)">${altos.length}</b><span>em risco alto (${["N1", "N2", "N3"].map(n => n + " " + altos.filter(x => x.s.nivel === n).length).join(" · ")})</span></div>
        <div class="va-num"><b style="color:var(--warn)">${expostos.length}</b><span>com risco alto abaixo na cadeia</span></div>
        <div class="va-num"><b style="color:${listas.length ? "var(--bad)" : "inherit"}">${listas.length}</b><span>em listas restritivas</span></div>
        <div class="va-num"><b style="color:${nfAlto ? "var(--bad)" : "inherit"}">${nfAlto}</b><span>nota(s) fiscal(is) com alerta alto</span></div>
        <div class="va-num"><b>${comNews.length}</b><span>com notícias no local</span></div></div>
      <div>${vis.map(({s, r}) => { const par = s.parentId ? supById(s.parentId) : null, nn = noticias(s).length;
        return `<button type="button" class="va-row" data-va="${s.id}"><span class="va-dot" style="background:${RCOL.alto}"></span><div style="min-width:0;flex:1"><b>${NV[s.nivel] || ""} ${s.nivel} · ${esc(s.nome)}</b> <span class="sub" style="margin:0">${esc([s.municipio, s.uf].filter(Boolean).join("/") || "—")} · ${r.score} pontos${par ? " · vende para " + esc(par.nome) : ""}${nn ? ` · <b style="color:var(--warn)">${nn} notícia(s) no local</b>` : ""}</span>
          <div class="sub" style="margin:2px 0 0;font-size:12.5px">${mot(r).map(esc).join(" · ")}</div></div><span class="sub" style="margin:0;white-space:nowrap">Abrir ›</span></button>`; }).join("")}
        ${expostos.slice(0, S.vaMais ? 50 : 3).map(({s, r}) => { const e = exposicao(s);
          return `<button type="button" class="va-row" data-va="${s.id}"><span class="va-dot" style="background:${RCOL.medio}"></span><div style="min-width:0;flex:1"><b>${NV[s.nivel] || ""} ${s.nivel} · ${esc(s.nome)}</b> <span class="sub" style="margin:0">${RISK_LABEL[r.level]} · exposição alta pela cadeia</span>
            <div class="sub" style="margin:2px 0 0;font-size:12.5px">Compra de: ${e.via.slice(0, 3).map(k => `${k.nivel} ${esc(k.nome)}`).join(" · ")}${e.via.length > 3 ? ` e mais ${e.via.length - 3}` : ""}</div></div><span class="sub" style="margin:0;white-space:nowrap">Abrir ›</span></button>`; }).join("")}</div>
      ${altos.length > 6 || expostos.length > 3 ? `<button type="button" class="btn sm ghost" id="va-mais" style="align-self:flex-start">${S.vaMais ? "Mostrar só os principais" : `Ver todos (${altos.length + expostos.length})`}</button>` : ""}`;
    $$("[data-va]", el).forEach(b => b.onclick = () => openSupplier(b.dataset.va, "risco"));
    const m = $("#va-mais", el); if (m) m.onclick = () => { S.vaMais = !S.vaMais; renderAuditoria(); };
    return el;
  }

  /* ---------- cadeia N1 → N2 → N3 (o que o cliente contratante precisa ver) ---------- */
  S.cadF = S.cadF || "risco"; S.cadAb = S.cadAb || {};
  function no(s, prof){
    const r = rk(s), e = exposicao(s), nn = noticias(s), ks = filhos(s), id = "cn-" + s.id;
    const head = `<div class="cad-node"><span class="va-dot" style="background:${RCOL[r.level]};margin:0"></span><span class="mono" style="font-size:11px;color:var(--muted)">${s.nivel}</span>
      <button type="button" class="lk" data-cad="${s.id}">${esc(s.nome)}</button>${tag(r.level)}<span class="sub" style="margin:0;font-size:12px">${r.score} pt · ${esc([s.municipio, s.uf].filter(Boolean).join("/") || "—")}</span>
      ${ks.length && e.lv === "alto" && r.level !== "alto" ? tag("alto", "risco alto abaixo na cadeia") : ""}${nn.length ? `<button type="button" class="cad-tag" style="color:var(--warn);background:none;cursor:pointer" data-cnw="${s.id}">notícias no local: ${nn.length}</button>` : ""}</div>
      ${r.reasons.length && r.level !== "baixo" ? `<div class="sub" style="margin:2px 0 0 20px;font-size:12px">${mot(r).map(esc).join(" · ")}</div>` : ""}
      <div class="cad-news" id="cnw-${s.id}" ${S.cadAb["nw" + s.id] ? "" : "hidden"}>${nn.map(({n, onde}) => `<div><span class="mono" style="color:var(--muted)">${esc(n[0])}</span> · <b>${esc(n[1])}</b> <span class="sub" style="margin:0">(cita o ${onde})</span>${n[3] ? ` <a href="${n[3]}" target="_blank" rel="noopener">Fonte ↗</a>` : ""}</div>`).join("")}<div>${linksNoticias(s)}</div></div>`;
    if (!ks.length) return `<div>${head}</div>`;
    return `<div>${head}<div class="cad-kids">${ks.map(k => no(k, prof + 1)).join("")}</div></div>`;
  }
  function cadeia(){
    const N1 = S.suppliers.filter(s => s.nivel === "N1" || !s.parentId || !supById(s.parentId)).map(s => ({s, r: rk(s), e: exposicao(s)}))
      .sort((a, b) => RO[a.e.lv] - RO[b.e.lv] || RO[a.r.level] - RO[b.r.level] || b.r.score - a.r.score || fixMoji(a.s.nome || "").localeCompare(fixMoji(b.s.nome || ""), "pt"));
    const vis = S.cadF === "risco" ? N1.filter(x => x.e.lv === "alto" || x.r.level === "alto") : N1, nAlt = N1.filter(x => x.e.lv === "alto").length;
    const el = document.createElement("details"); el.className = "card"; el.id = "va-cadeia"; el.open = S.cadOpen !== false;
    el.addEventListener("toggle", () => { S.cadOpen = el.open; });
    el.innerHTML = `<summary><h3>Cadeia N1 → N2 → N3: risco de cada elo</h3><span class="sub" style="margin:0 0 0 8px">${N1.length} cadeia(s) · ${nAlt} com risco alto em algum elo</span></summary>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
        <p class="sub" style="margin:0">Cada N1 (${esc(LV_NOME.N1.toLowerCase())}) mostra o próprio risco e a <b>exposição</b> herdada dos N2 e N3 de quem compra: um N1 de risco médio que compra de um N3 de risco alto fica exposto ao risco alto. Notícias públicas que citam o município ou o estado de operação aparecem para investigação do auditor e do advogado.</p>
        <div class="mg-chips"><button type="button" class="mg-chip" data-cadf="risco" aria-pressed="${S.cadF === "risco"}">Só cadeias com risco alto <b>${nAlt}</b></button><button type="button" class="mg-chip" data-cadf="todas" aria-pressed="${S.cadF === "todas"}">Todas <b>${N1.length}</b></button>
          <button type="button" class="btn sm ghost" id="cad-csv">Exportar para Excel</button></div>
        ${vis.length ? vis.slice(0, S.cadMais ? 500 : 30).map(({s, r, e}) => { const ks = filhos(s), n2 = ks.length, n3 = ks.reduce((t, k) => t + filhos(k).length, 0);
          return `<details class="cad-n1" data-cadn="${s.id}" ${S.cadAb[s.id] ?? (e.lv === "alto") ? "open" : ""}><summary><span class="va-dot" style="background:${RCOL[r.level]};margin:0"></span><b>${esc(s.nome)}</b>${tag(r.level, "N1 · " + RISK_LABEL[r.level])}${tag(e.lv, "exposição da cadeia: " + RISK_LABEL[e.lv])}<span class="sub" style="margin:0;font-size:12px">${n2} N2 · ${n3} N3${e.via.length ? ` · ${e.via.length} elo(s) de risco alto abaixo` : ""}</span></summary>
            <div style="margin-top:8px">${no(s, 0)}</div></details>`; }).join("") + (vis.length > 30 && !S.cadMais ? `<button type="button" class="btn sm ghost" id="cad-mais">Ver todas (${vis.length})</button>` : "")
          : `<p class="sub" style="margin:0">Nenhuma cadeia com risco alto. Use “Todas” para ver a cadeia completa.</p>`}</div>`;
    $$("[data-cadf]", el).forEach(b => b.onclick = () => { S.cadF = b.dataset.cadf; renderAuditoria(); });
    $$("[data-cadn]", el).forEach(d => d.addEventListener("toggle", () => { S.cadAb[d.dataset.cadn] = d.open; }));
    $$("[data-cad]", el).forEach(b => b.onclick = () => openSupplier(b.dataset.cad, "risco"));
    $$("[data-cnw]", el).forEach(b => b.onclick = () => { const x = $("#cnw-" + b.dataset.cnw, el); x.hidden = !x.hidden; S.cadAb["nw" + b.dataset.cnw] = !x.hidden; });
    const mm = $("#cad-mais", el); if (mm) mm.onclick = () => { S.cadMais = true; renderAuditoria(); };
    $("#cad-csv", el).onclick = () => exportCadeia();
    return el;
  }
  function linhasCadeia(){
    const out = [], walk = (s, n1) => { const r = rk(s), par = s.parentId ? supById(s.parentId) : null;
      out.push([n1.nome, s.nivel, s.nome, s.doc, [s.municipio, s.uf].filter(Boolean).join("/"), par ? par.nome : CLI().nome, RISK_LABEL[r.level], r.score, RISK_LABEL[exposicao(s).lv], mot(r, 3).join(" | "), noticias(s).map(x => x.n[0] + " " + x.n[1]).join(" | ")]);
      filhos(s).forEach(k => walk(k, n1)); };
    S.suppliers.filter(s => s.nivel === "N1" || !s.parentId || !supById(s.parentId)).forEach(s => walk(s, s)); return out;
  }
  const exportCadeia = () => baixarCSV("cadeia_N1_N2_N3", ["Cadeia (N1)", "Nível", "Fornecedor", "CNPJ/CPF", "Local", "Vende para", "Risco", "Pontuação", "Exposição da cadeia", "Principais motivos", "Notícias no local"], linhasCadeia());

  const _aud = renderAuditoria;
  renderAuditoria = function(){
    _aud.apply(this, arguments); botaoTopo(); if (S.audSub === "ops") return;
    const host = $("#auditoria"); if (!host) return; cacheN.clear(); RK.clear();
    const tabs = host.firstElementChild, a = alertas();
    if (tabs) tabs.after(a); else host.prepend(a);
    const mg = $("#mg-aud", host); (mg || a).after(cadeia());
  };

  /* ---------- Jurídico: síntese / expandido, importação societária, considerações ---------- */
  S.jurModo = S.jurModo || "sintese";
  const TIPOS_JUR = ["Contrato social / alteração", "Cartão CNPJ", "Estatuto / ata", "Procuração", "Certidão", "Licença ambiental", "Contrato de fornecimento", "Contrato de parceria / arrendamento", "Outro contrato importante"];
  const CL = {consideracao: ["Consideração (informativa)", "pend"], ressalva: ["Ressalva", "medio"], aprovado_ressalvas: ["Aprovação com ressalvas", "medio"], reprovado: ["Reprovação (não recomendado)", "alto"]};
  const supOpts = (sel) => S.suppliers.slice().sort((a, b) => a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")).map(s => `<option value="${s.id}" ${s.id === sel ? "selected" : ""}>${s.nivel} · ${esc(s.nome)}</option>`).join("");
  function importarSocietario(pre){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Jurídico · documentos societários e contratos</div><h2>Importar documentos</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b"><form id="fjs" class="form" novalidate>
        <p class="sub full" style="margin:0">Contrato social, cartão CNPJ, estatuto, procurações, certidões, licenças e contratos importantes. O sistema lê o documento (PDF, Word ou texto), confere CNPJ, sócios, capital, objeto e datas com o cadastro, compara os sócios com as listas oficiais e envia a pré-análise para o parecer do advogado.</p>
        <div class="fld full"><label for="js-sup">Fornecedor</label><select id="js-sup">${supOpts(pre)}</select></div>
        <div class="fld"><label for="js-tipo">Tipo de documento</label><select id="js-tipo">${TIPOS_JUR.map(t => `<option>${t}</option>`).join("")}</select></div>
        <div class="fld"><label for="js-file">Arquivo(s)</label><input id="js-file" type="file" multiple accept=".pdf,.doc,.docx,.txt,.xml,image/*"></div>
        <div class="fld full"><label for="js-obs">Observação (opcional)</label><input id="js-obs" placeholder="ex.: 3ª alteração contratual, registrada na Junta em 2025"></div>
        <p class="err full" id="js-err" hidden></p>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary" id="js-go">Importar e analisar</button></div></form></div>`);
    $$("#layer [data-x]").forEach(b => b.onclick = close);
    $("#fjs").onsubmit = async e => { e.preventDefault(); const fs = [...$("#js-file").files], err = $("#js-err"), go = $("#js-go");
      if (!fs.length){ err.textContent = "Escolha pelo menos um arquivo."; err.hidden = false; return; }
      go.disabled = true; let n = 0;
      try{ for (const f of fs){ go.textContent = `Enviando ${++n}/${fs.length}…`; const up = await Store.upload(f, {sup: $("#js-sup").value, tipo: $("#js-tipo").value, nome: f.name});
          await salvarEvid(uid(), {supplierId: $("#js-sup").value, tipo: $("#js-tipo").value, obs: [$("#js-obs").value.trim(), "Importado pelo Jurídico"].filter(Boolean).join(" · "), ...up, mime: f.type, nome: f.name, gps: null, distKm: null, takenAt: null, criadoEm: nowISO(), criadoPor: Store.me.id || "", origem: "Jurídico"}, f); }
        close(); toast(`${fs.length} documento(s) importado(s): pré-análise em andamento`); }
      catch(x){ err.textContent = "Não foi possível importar. Verifique a conexão e o seu acesso."; err.hidden = false; go.disabled = false; go.textContent = "Importar e analisar"; } };
  }
  function consideracao(pre){
    const ed = Store.me.canEdit;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Jurídico · vai para o relatório de pontos</div><h2>Considerações e ressalvas</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b"><form id="fjc" class="form" novalidate>
        <div class="fld full"><label for="jc-sup">Fornecedor</label><select id="jc-sup">${supOpts(pre)}</select></div>
        <div class="fld full"><label for="jc-cl">Classificação</label><select id="jc-cl">${Object.entries(CL).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("")}</select><span class="hint">Ressalva e aprovação com ressalvas somam pontos na matriz de risco e entram no relatório com o nome do advogado; reprovação eleva o fornecedor a risco alto.</span></div>
        <div class="fld full"><label for="jc-txt">Análise do advogado</label><textarea id="jc-txt" placeholder="Pontos analisados, ressalvas, condições para aprovação e providências"></textarea></div>
        <div class="full">${advCampos("jc", advPadrao(), false)}</div>
        <p class="err full" id="jc-err" hidden></p>
        <div class="full" style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary" ${ed ? "" : "disabled"}>Registrar</button></div></form></div>`);
    $$("#layer [data-x]").forEach(b => b.onclick = close);
    $("#fjc").onsubmit = async e => { e.preventDefault(); const err = $("#jc-err"), txt = $("#jc-txt").value.trim(), adv = advLer("jc"), s = supById($("#jc-sup").value);
      if (!txt){ err.textContent = "Escreva a análise."; err.hidden = false; return; } if (!adv){ err.textContent = ADV_ERR; err.hidden = false; return; }
      const item = {id: uid(), tipo: $("#jc-cl").value, texto: txt, advogado: adv, em: nowISO(), por: Store.me.id || ""};
      try{ await Store.update("suppliers", s.id, {jurConsid: [...(s.jurConsid || []), item]}); close(); toast("Registrado: entra no relatório de pontos"); }
      catch(x){ err.textContent = "Não foi possível registrar."; err.hidden = false; } };
  }
  function itensJuridicos(){
    const out = [], PS = {ressalvas: "Aprovação com ressalvas", reprovado: "Reprovado"};
    S.contracts.forEach(k => { const p = S.pareceres[k.id], s = supById(k.supplierId); if (p && PS[p.status]) out.push({s, item: `${k.tipo || "Contrato"}${k.numero ? " nº " + k.numero : ""}`, cl: PS[p.status], lv: p.status === "reprovado" ? "alto" : "medio", texto: p.parecer || "", adv: p.advogado, em: p.em}); });
    S.evidences.forEach(e => { const p = e.parecerDoc, s = supById(e.supplierId); if (p && PS[p.status] && s) out.push({s, item: e.analise?.extraido?.rotulo || e.tipo, cl: PS[p.status], lv: p.status === "reprovado" ? "alto" : "medio", texto: p.texto || "", adv: p.advogado, em: p.em}); });
    S.suppliers.forEach(s => (s.jurConsid || []).forEach(c => out.push({s, c, item: "Consideração do Jurídico", cl: CL[c.tipo]?.[0] || c.tipo, lv: CL[c.tipo]?.[1] || "pend", texto: c.texto, adv: c.advogado, em: c.em})));
    return out.sort((a, b) => RO[a.lv] - RO[b.lv] || String(b.em || "").localeCompare(String(a.em || "")));
  }
  function cardConsid(){
    const L = itensJuridicos(), el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px"; el.id = "jur-consid";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Vão para o relatório de pontos</div><h3>Ressalvas e considerações do Jurídico (${L.length})</h3></div></div>
      ${L.length ? `<div class="tbl"><table><thead><tr><th>Fornecedor</th><th>Item</th><th>Classificação</th><th>Análise</th><th>Advogado</th></tr></thead><tbody>${L.slice(0, S.jurModo === "expandido" ? 200 : 6).map(x => `<tr data-jco="${x.s.id}" style="cursor:pointer"><td style="min-width:150px"><span class="lvtag">${x.s.nivel}</span> ${esc(x.s.nome)}</td><td style="font-size:12.5px">${esc(x.item)}</td><td>${tag(x.lv, x.cl)}</td><td style="font-size:12.5px;min-width:220px">${esc(String(x.texto).slice(0, S.jurModo === "expandido" ? 600 : 140))}</td><td style="font-size:12px">${x.adv ? esc(x.adv.nome + " · " + (x.adv.oab || "")) : "—"}<div class="sub" style="margin:0;font-size:11px">${x.em ? dt(x.em) : ""}</div></td></tr>`).join("")}</tbody></table></div>${L.length > 6 && S.jurModo !== "expandido" ? `<p class="sub" style="margin:0">Mais ${L.length - 6} no modo expandido.</p>` : ""}`
        : `<p class="sub" style="margin:0">Nenhuma ressalva registrada. Use “Registrar consideração / ressalva” ou emita o parecer nos contratos e documentos.</p>`}`;
    $$("[data-jco]", el).forEach(r => r.onclick = () => openSupplier(r.dataset.jco, "risco"));
    return el;
  }
  const _jur = renderJuridico;
  renderJuridico = function(){
    _jur.apply(this, arguments); botaoTopo(); RK.clear(); const host = $("#juridico"); if (!host) return;
    const head = host.querySelector(".head"), ed = Store.me.canWrite !== false;
    const bar = document.createElement("div"); bar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;align-items:center"; bar.id = "jur-bar";
    bar.innerHTML = `<div class="mg-chips" role="group" aria-label="Modo de visualização"><button type="button" class="mg-chip" data-jm="sintese" aria-pressed="${S.jurModo === "sintese"}">Síntese</button><button type="button" class="mg-chip" data-jm="expandido" aria-pressed="${S.jurModo === "expandido"}">Expandido</button></div>
      <span style="flex:1"></span>${ed ? `<button type="button" class="btn sm" id="jur-imp">Importar contrato social, cartão CNPJ e outros</button>` : ""}${Store.me.canEdit ? `<button type="button" class="btn sm" id="jur-cons">Registrar consideração / ressalva</button>` : ""}`;
    if (head) head.after(bar); else host.prepend(bar);
    const mg = $("#mg-jur", host);
    if (mg && S.jurModo === "sintese") $$(".mg-row", mg).forEach(row => { const t = $$(".mg-tile", row); if (t.length > 8){ t.slice(8).forEach(x => x.hidden = true); const b = document.createElement("button"); b.type = "button"; b.className = "btn sm ghost"; b.style.alignSelf = "flex-start"; b.textContent = `+ ${t.length - 8} fornecedor(es) · expandir`; b.onclick = () => { S.jurModo = "expandido"; renderJuridico(); }; row.appendChild(b); } });
    const det = [...host.children].find(x => x.tagName === "DETAILS"); if (det && S.jurModo === "expandido") det.open = true;
    (mg || bar).after(cardConsid());
    $$("[data-jm]", bar).forEach(b => b.onclick = () => { S.jurModo = b.dataset.jm; if (S.jurModo === "sintese") S.jurDet = false; renderJuridico(); });
    const im = $("#jur-imp", bar); if (im) im.onclick = () => importarSocietario();
    const co = $("#jur-cons", bar); if (co) co.onclick = () => consideracao();
  };

  /* ---------- matriz de risco e relatório ---------- */
  EXT_RISKS.push((s, add) => (s.jurConsid || []).forEach(c => { const t = String(c.texto || "").replace(/\s+/g, " ").slice(0, 80);
    if (c.tipo === "reprovado") add("Jurídico", "Reprovação do Jurídico: " + t, 6);
    else if (c.tipo === "ressalva") add("Jurídico", "Ressalva do Jurídico: " + t, 1);
    else if (c.tipo === "aprovado_ressalvas") add("Jurídico", "Aprovado com ressalvas pelo Jurídico: " + t, 1); }));
  RPT_REC.unshift([/Ressalva do Jurídico|Reprovação do Jurídico/i, "Cumprir as condições apontadas pelo advogado responsável antes de novas compras; em caso de reprovação, suspender a relação comercial e registrar a decisão.", "Lei 12.846/2013; Decreto 11.129/2022 (programa de integridade); CC arts. 421 e 422"]);
  RPT_EXT.push(P => { RK.clear();
    const N1 = S.suppliers.filter(s => s.nivel === "N1" || !s.parentId || !supById(s.parentId));
    if (N1.length){
      P.h2("Cadeia N1 → N2 → N3 e exposição ao risco");
      P.para("Exposição: maior risco encontrado no N1 e nos N2 e N3 de quem ele compra. Um N1 de risco baixo ou médio que compra de um elo de risco alto fica exposto ao risco alto.", {size: 8.8});
      const C = lv => ({alto: [198, 40, 40], medio: [178, 106, 0], baixo: [46, 125, 50]}[lv] || [110, 120, 135]);
      P.table([{t: `N1 (${LV_NOME.N1.toLowerCase()})`, w: .24}, {t: "Risco N1", w: .1}, {t: "N2 (alto/total)", w: .11}, {t: "N3 (alto/total)", w: .11}, {t: "Exposição", w: .1}, {t: "Elos de risco alto abaixo", w: .34}],
        N1.map(s => ({s, r: rk(s), e: exposicao(s)})).sort((a, b) => RO[a.e.lv] - RO[b.e.lv] || b.r.score - a.r.score).slice(0, 60).map(({s, r, e}) => { const k2 = filhos(s), k3 = k2.flatMap(filhos);
          return [fixMoji(s.nome), {t: RPT_LV[r.level], b: true, c: C(r.level)}, `${k2.filter(k => rk(k).level === "alto").length}/${k2.length}`, `${k3.filter(k => rk(k).level === "alto").length}/${k3.length}`, {t: RPT_LV[e.lv], b: true, c: C(e.lv)},
            e.via.slice(0, 4).map(k => `${fixMoji(k.nome)} (${k.nivel})`).join("; ") + (e.via.length > 4 ? `; e mais ${e.via.length - 4}` : "") || "—"]; }), {size: 7.6});
    }
    const NW = S.suppliers.filter(s => rk(s).level !== "baixo").map(s => ({s, n: noticias(s)})).filter(x => x.n.length);
    if (NW.length){ P.h2("Notícias públicas nos locais de operação (para investigação)");
      P.table([{t: "Fornecedor", w: .26}, {t: "Local", w: .14}, {t: "Notícia", w: .6}], NW.slice(0, 40).map(({s, n}) => [`${fixMoji(s.nome)} (${s.nivel})`, [s.municipio, s.uf].filter(Boolean).join("/"), n.slice(0, 2).map(x => `${x.n[0]} · ${x.n[1]}`).join(" | ")]), {size: 7.6}); }
    const J = itensJuridicos();
    if (J.length){ P.h2("Ressalvas e considerações do Jurídico");
      P.table([{t: "Fornecedor", w: .2}, {t: "Item", w: .15}, {t: "Classificação", w: .13}, {t: "Análise do advogado", w: .34}, {t: "Advogado (OAB)", w: .18}],
        J.slice(0, 60).map(x => [`${fixMoji(x.s.nome)} (${x.s.nivel})`, x.item, {t: x.cl, b: true}, String(x.texto || "—").replace(/\s+/g, " ").slice(0, 420), x.adv ? `${x.adv.nome} · ${x.adv.oab || ""}` : "—"]), {size: 7.6}); }
  });

  /* ---------- nomes com acentos corrompidos (importações antigas): correção definitiva por quem edita ---------- */
  let corrigiu = false;
  function corrigirAcentos(){
    if (corrigiu || !Store.me?.canWrite || !S.suppliers.length) return; corrigiu = true;
    const F = ["nome", "municipio", "tipo"], L = S.suppliers.map(s => [s, Object.fromEntries(F.filter(f => s[f] && fixMoji(s[f]) !== s[f]).map(f => [f, fixMoji(s[f])]))]).filter(([, u]) => Object.keys(u).length);
    if (L.length) Promise.all(L.map(([s, u]) => Store.update("suppliers", s.id, u).catch(() => {}))).then(() => toast(`Acentos corrigidos em ${L.length} cadastro(s)`));
  }
  /* ---------- Órbita: busca por nome ou CNPJ/CPF ---------- */
  const docFmtV = d => { const x = String(d || "").replace(/\D/g, ""); return x.length === 14 ? x.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : x.length === 11 ? x.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : String(d || ""); };
  function buscaOrbita(){
    const v = $("#v-orbita"); if (!v || $("#orb-busca")) return;
    if (!document.getElementById("kt-orbusca-css")){ const st = document.createElement("style"); st.id = "kt-orbusca-css";
      st.textContent = `.orb-busca{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:min(380px,calc(100% - 420px));min-width:220px;z-index:4;pointer-events:auto}
.orb-busca input{width:100%;height:38px;border-radius:12px;border:1px solid var(--line-2);background:rgba(1,31,75,.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--fog);padding:0 12px 0 34px;font:inherit;font-size:13.5px}
.orb-busca input:focus{outline:none;border-color:var(--glow)}.orb-tit{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7FB8E6;margin:0 0 4px 4px;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.orb-ap{position:absolute;right:6px;top:5px;height:28px;border-radius:9px;border:1px solid var(--glow);background:rgba(127,184,230,.16);color:var(--fog);font:inherit;font-size:12px;font-weight:700;padding:0 10px;cursor:pointer}.orb-busca input.com-ap{padding-right:118px}.orb-busca svg.lupa{position:absolute;left:11px;top:11px;width:16px;height:16px;stroke:var(--muted);fill:none;stroke-width:2;z-index:1;pointer-events:none}
.orb-res{margin-top:6px;background:rgba(1,31,75,.97);border:1px solid var(--line-2);border-radius:12px;max-height:330px;overflow-y:auto;box-shadow:0 12px 30px rgba(0,0,0,.45)}
.orb-res button{display:flex;gap:9px;align-items:center;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:9px 12px;color:var(--fog);font:inherit;font-size:13px;cursor:pointer}
.orb-res button:last-child{border-bottom:0}.orb-res button:hover,.orb-res button.on{background:rgba(127,184,230,.12)}.orb-res small{display:block;color:var(--muted);font-size:11.5px}
@media (max-width:760px){.orb-busca{left:96px;right:60px;transform:none;width:auto;min-width:0;top:66px}.orb-tit{font-size:9.5px}}`;
      document.head.appendChild(st); }
    const el = document.createElement("div"); el.className = "orb-busca"; el.id = "orb-busca";
    el.innerHTML = `<div class="orb-tit">Análise prévia do fornecedor</div><div style="position:relative"><svg class="lupa" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input type="search" id="orb-q" placeholder="Digite o nome ou o CNPJ do fornecedor" aria-label="Análise prévia do fornecedor: digite o nome ou o CNPJ" autocomplete="off"><button type="button" class="orb-ap" id="orb-ap" hidden>Análise prévia</button></div><div class="orb-res" id="orb-res" hidden></div>`;
    v.appendChild(el);
    const q = $("#orb-q", el), res = $("#orb-res", el); let L = [], cur = 0;
    const achar = t => { const tx = sem(t).trim(), dg = t.replace(/\D/g, ""); if (tx.length < 2 && dg.length < 3) return [];
      return S.suppliers.filter(s => (tx.length >= 2 && sem(fixMoji(s.nome || "")).includes(tx)) || (dg.length >= 3 && String(s.doc || "").replace(/\D/g, "").includes(dg)) || (tx.length >= 3 && sem(s.municipio).includes(tx)))
        .sort((a, b) => RO[rk(a).level] - RO[rk(b).level] || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")).slice(0, 12); };
    const ap = $("#orb-ap", el); let escolhido = null;
    const mostraAp = sp => { escolhido = sp; ap.hidden = !sp; q.classList.toggle("com-ap", !!sp); };
    ap.onclick = () => { if (escolhido) consultaRapida(escolhido.id); };
    const ir = s => { if (!s) return; mostraAp(s); const lb = $(`.lvl [data-lv="${s.nivel}"]`); if (lb && lb.getAttribute("aria-pressed") === "false") lb.click(); res.hidden = true; q.value = fixMoji(s.nome || ""); q.blur(); selectSup(s.id, true); setTimeout(() => consultaRapida(s.id), innerWidth < 760 ? 350 : 1300); };
    const desenha = () => { RK.clear(); L = achar(q.value); cur = 0;
      if (!q.value.trim()){ res.hidden = true; return; }
      res.hidden = false; res.innerHTML = L.length ? L.map((s, i) => `<button type="button" data-ob="${s.id}" class="${i === cur ? "on" : ""}"><span class="va-dot" style="background:${RCOL[rk(s).level] || RCOL.pend};margin:0"></span><span style="min-width:0;flex:1"><b>${s.nivel} · ${esc(s.nome)}</b><small>${esc(s.doc ? docFmtV(s.doc) : "sem CNPJ/CPF")} · ${esc([s.municipio, s.uf].filter(Boolean).join("/") || "—")} · ${RISK_LABEL[rk(s).level]}</small></span></button>`).join("")
        : dd(q.value).length === 14 && IMP.docValido(dd(q.value)) ? `<button type="button" data-occ="${dd(q.value)}"><span class="va-dot" style="background:var(--glow);margin:0"></span><span style="min-width:0;flex:1"><b>Consultar CNPJ ${esc(q.value.trim())}</b><small>Fora do sistema · análise prévia automática (Receita, listas oficiais, atividade)</small></span></button>`
        : `<div class="sub" style="margin:0;padding:10px 12px">Nenhum fornecedor encontrado. Digite o CNPJ completo para a análise prévia automática, ou cadastre na aba Cadeia.</div>`;
      $$("[data-occ]", res).forEach(b => b.onmousedown = e => { e.preventDefault(); res.hidden = true; q.blur(); consultaCnpj(b.dataset.occ); });
      $$("[data-ob]", res).forEach(b => b.onmousedown = e => { e.preventDefault(); ir(supById(b.dataset.ob)); }); };
    q.oninput = () => { mostraAp(null); desenha(); }; q.onfocus = () => { if (q.value.trim()) desenha(); };
    q.onblur = () => setTimeout(() => { res.hidden = true; }, 150);
    q.onkeydown = e => { if (e.key === "ArrowDown" || e.key === "ArrowUp"){ e.preventDefault(); if (!L.length) return; cur = (cur + (e.key === "ArrowDown" ? 1 : -1) + L.length) % L.length; $$("[data-ob]", res).forEach((b, i) => b.classList.toggle("on", i === cur)); }
      else if (e.key === "Enter"){ e.preventDefault(); if (L[cur]) ir(L[cur]); else { const d = dd(q.value); if (d.length === 14 && IMP.docValido(d)){ res.hidden = true; q.blur(); consultaCnpj(d); } } } else if (e.key === "Escape"){ q.value = ""; res.hidden = true; } };
  }
  setTimeout(buscaOrbita, 0);
  const _rt = renderTarget;
  renderTarget = function(){ _rt.apply(this, arguments); const t = $("#target"); if (!t || t.hidden || !S.sel || $("#tg-cr", t)) return; const acts = [...t.querySelectorAll("a.btn, button.btn")].pop(); if (!acts) return;
    const b = document.createElement("button"); b.type = "button"; b.className = "btn sm"; b.id = "tg-cr"; b.textContent = "Resumo rápido"; b.onclick = () => consultaRapida(S.sel); acts.after(b); };

  /* ---------- busca de fornecedor na Auditoria e no Jurídico: lista de resultados e filtro da tela ---------- */
  function caixaBusca(host, chave, alvos, abrir){
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px;padding:12px;position:relative"; el.id = "busca-" + chave;
    el.innerHTML = `<div style="position:relative"><svg viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;left:11px;top:11px;width:16px;height:16px;stroke:var(--muted);fill:none;stroke-width:2;pointer-events:none"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
      <input class="search" type="search" id="bq-${chave}" style="width:100%;padding-left:34px;max-width:none" placeholder="Buscar fornecedor N1, N2 ou N3 por nome, CNPJ/CPF ou município" value="${esc(S[chave] || "")}" autocomplete="off" aria-label="Buscar fornecedor"></div>
      <div class="sub" id="bq-${chave}-st" style="margin:0"></div><div class="orb-res" id="bq-${chave}-res" hidden style="margin:0"></div>`;
    const q = $("input", el), st = $("#bq-" + chave + "-st", el), res = $("#bq-" + chave + "-res", el);
    const aplica = () => { const t = q.value, antes = S[chave]; S[chave] = t; RK.clear();
      if (!t.trim()){ st.textContent = ""; res.hidden = true; if (antes && antes.trim()){ (chave === "audQ" ? renderAuditoria : renderJuridico)(); setTimeout(() => { const n = $("#bq-" + chave); if (n) n.focus(); }, 0); } return; }
      const L = t.trim() ? S.suppliers.filter(s => buscaCasa(s, t)).sort((a, b) => RO[rk(a).level] - RO[rk(b).level] || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")) : [], ids = new Set(L.map(s => s.id));
      alvos(host).forEach(([node, sid]) => { node.hidden = !(Array.isArray(sid) ? sid.some(x => ids.has(x)) : ids.has(sid)); });
      $$(".mg-row, .mg-col", host).forEach(r => { const tl = $$(".mg-tile", r); if (tl.length) r.hidden = tl.every(x => x.hidden); });
      $$(".mg-row > .btn.ghost", host).forEach(b => b.hidden = true);
      st.textContent = t.trim() ? (L.length ? `${L.length} fornecedor(es) encontrado(s) · a tela abaixo mostra só eles · toque num resultado para abrir` : "Nenhum fornecedor encontrado.") : "";
      res.hidden = !L.length; res.innerHTML = L.slice(0, 8).map(s => `<button type="button" data-bq="${s.id}"><span class="va-dot" style="background:${RCOL[rk(s).level] || RCOL.pend};margin:0"></span><span style="min-width:0;flex:1"><b>${s.nivel} · ${esc(s.nome)}</b><small>${esc(s.doc ? docFmtV(s.doc) : "sem CNPJ/CPF")} · ${esc([s.municipio, s.uf].filter(Boolean).join("/") || "—")} · ${RISK_LABEL[rk(s).level]}</small></span><span class="sub" style="margin:0">Abrir ›</span></button>`).join("") + (L.length > 8 ? `<div class="sub" style="padding:8px 12px;margin:0">e mais ${L.length - 8}</div>` : "");
      $$("[data-bq]", res).forEach(b => b.onclick = () => abrir(b.dataset.bq)); };
    q.oninput = aplica; q.onkeydown = e => { if (e.key === "Escape"){ q.value = ""; aplica(); } else if (e.key === "Enter"){ const b = $("[data-bq]", res); if (b) b.click(); } };
    setTimeout(() => { if (q.value) aplica(); }, 0);
    return el;
  }
  const idsCt = id => S.contracts.find(k => k.id === id)?.supplierId;
  const alvosAud = host => [...$$("#mg-aud [data-mg]", host).map(n => [n, n.dataset.mg]), ...$$("#va-alertas [data-va]", host).map(n => [n, n.dataset.va]),
    ...$$("#ai-tbl tr[data-open]", host).map(n => [n, n.dataset.open]), ...$$("#va-cadeia .cad-n1", host).map(n => [n, $$("[data-cad]", n).map(b => b.dataset.cad)])];
  const alvosJur = host => [...$$("#mg-jur [data-jt]", host).map(n => [n, n.dataset.jt]), ...$$("#jur-consid tr[data-jco]", host).map(n => [n, n.dataset.jco]),
    ...$$("[data-ct]", host).map(n => [n, idsCt(n.dataset.ct)]), ...$$("[data-nda]", host).map(n => [n, n.dataset.nda]), ...$$("[data-valnda]", host).map(n => [n.closest("div[style*='border-top']") || n, n.dataset.valnda])];
  const _aud2 = renderAuditoria;
  renderAuditoria = function(){
    _aud2.apply(this, arguments); const host = $("#auditoria"); if (!host) return;
    if (S.audSub === "ops") return;
    const a = $("#va-alertas", host); const cx = caixaBusca(host, "audQ", alvosAud, id => openSupplier(id, "risco"));
    if (a) a.before(cx); else host.prepend(cx);
  };
  const _jur2 = renderJuridico;
  renderJuridico = function(){
    _jur2.apply(this, arguments); const host = $("#juridico"); if (!host) return;
    const cx = caixaBusca(host, "jurQ", alvosJur, id => PAINEL.juridicoFornecedor ? PAINEL.juridicoFornecedor(id) : openSupplier(id, "lgpd"));
    const bar = $("#jur-bar", host); if (bar) bar.after(cx); else host.prepend(cx);
  };

  /* ---------- Evidências: importar vários documentos ---------- */
  const A_CLASS = "A classificar";
  if (typeof EV_TYPES !== "undefined" && !EV_TYPES.includes(A_CLASS)) EV_TYPES.push(A_CLASS);
  const dg = v => String(v || "").replace(/\D/g, "");
  const evTipo = re => (EV_TYPES.find(t => re.test(t)) || null);
  const MAPA_TIPO = {contrato_social: () => evTipo(/contrato social/i) || "Contrato social / alteração", cartao_cnpj: () => evTipo(/cart[aã]o cnpj/i) || "Cartão CNPJ",
    cnd_federal: () => evTipo(/^certid/i) || "Certidão", cndt: () => evTipo(/^certid/i) || "Certidão", crf: () => evTipo(/^certid/i) || "Certidão", certidao: () => evTipo(/^certid/i) || "Certidão",
    licenca: () => evTipo(/licen/i) || "Licença ambiental", car: () => evTipo(/\bCAR\b/) || "Recibo do CAR", procuracao: () => evTipo(/procura/i) || "Procuração",
    nota: () => evTipo(/nota fiscal/i) || "Nota fiscal", contrato: () => evTipo(/^contrato$/i) || evTipo(/contrato/i) || "Contrato",
    alvara: () => evTipo(/alvar/i) || "Alvará de funcionamento", avcb: () => evTipo(/avcb/i) || evTipo(/alvar/i), mtr_inea: () => evTipo(/MTR INEA/i) || evTipo(/\bMTR\b/), mtr: () => evTipo(/\bMTR\b/), cdf: () => evTipo(/\bCDF\b/) || evTipo(/\bMTR\b/),
    ctf_ibama: () => evTipo(/CTF/i) || evTipo(/licen/i), cnd_ibama: () => evTipo(/CND IBAMA/i) || evTipo(/^certid/i), cnd_estadual: () => evTipo(/CND estadual/i) || evTipo(/^certid/i), cnd_municipal: () => evTipo(/CND municipal/i) || evTipo(/^certid/i)};
  const NOME_ARQ = [[/contrato[ _-]?social|altera[cç][aã]o[ _-]?contratual|estatuto/i, "contrato_social"], [/cart[aã]o[ _-]?cnpj|comprovante[ _-]?(de[ _-]?)?inscri/i, "cartao_cnpj"], [/ctf/i, "ctf_ibama"], [/avcb|clcb|bombeiro/i, "avcb"], [/mtr|manifesto/i, "mtr"], [/\bcdf\b/i, "cdf"], [/alvar/i, "alvara"], [/certid|cnd|cndt|crf|fgts/i, "certidao"],
    [/licen[cç]a|alvar/i, "licenca"], [/\bcar\b|recibo[ _-]?car|sicar/i, "car"], [/procura/i, "procuracao"], [/danfe|nfe|nota[ _-]?fiscal|\bnf\b/i, "nota"], [/contrato/i, "contrato"]];
  async function lerDoc(f){
    let t = null, x = null; try{ t = await DOCAN.texto(f, f.name); }catch(e){}
    if (t && t.trim().length > 20){ try{ x = DOCAN.extrair(t); }catch(e){} }
    let tipo = x?.tipo || null, como = tipo ? "conteúdo" : "";
    if (!tipo){ const m = NOME_ARQ.find(([re]) => re.test(f.name)); if (m){ tipo = m[1]; como = "nome do arquivo"; } }
    const docs = [...new Set([...(x?.cnpjs || []), ...((t || "").match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g) || []).map(dg)])];
    const achado = S.suppliers.find(s => s.doc && docs.includes(dg(s.doc)));
    const rot = x?.rotulo, alvo = {cnd_federal: "CND federal", cnd_estadual: "CND estadual", cnd_municipal: "CND municipal", cnd_ibama: "CND IBAMA", ctf_ibama: "CTF IBAMA"}[tipo] || rot;
    const direto = alvo && EV_TYPES.includes(alvo) ? alvo : null;
    const docNovo = !achado ? (docs.find(d => d.length === 14 && IMP.docValido(d)) || docs.find(d => d.length === 11 && IMP.docValido(d)) || "") : "";
    return {cad: x?.cad || null, docNovo, sit: x?.situacao || "", f, tipoEv: direto || (tipo && MAPA_TIPO[tipo] ? MAPA_TIPO[tipo]() : null) || (tipo && rot) || A_CLASS, rotulo: x?.rotulo || "", como, docs, achado, leu: !!t};
  }
  function importarLote(pre){
    const supOpt = sel => `<option value="">${sel === "" ? "— escolher —" : "— escolher —"}</option>` + S.suppliers.slice().sort((a, b) => a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")).map(x => `<option value="${x.id}" ${x.id === sel ? "selected" : ""}>${x.nivel} · ${esc(x.nome)}</option>`).join("");
    const tipoOpt = sel => EV_TYPES.filter(t => !/^Foto/i.test(t)).map(t => `<option ${t === sel ? "selected" : ""}>${esc(t)}</option>`).join("");
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Evidências · documentos dos fornecedores N1, N2 e N3</div><h2>Importar vários documentos</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <p class="sub" style="margin:0">Selecione de uma vez os documentos recebidos (PDF, Word, texto, XML ou fotos). O sistema lê cada um, identifica o tipo (contrato social, cartão CNPJ, certidões, licenças, CAR, procuração, nota fiscal, contrato comercial) e o fornecedor pelo CNPJ/CPF do documento. O que não for identificado fica em <b>A classificar</b>, para o revisor. A pré-análise roda assim que o documento é anexado.</p>
        <div class="fld"><label for="lt-sup">Fornecedor</label><select id="lt-sup"><option value="">Identificar pelo CNPJ/CPF de cada documento</option>${supOpt(pre || "").replace('<option value="">— escolher —</option>', "")}</select><span class="hint">Escolhendo um fornecedor, todos os documentos ficam com ele (o sistema avisa se o CNPJ do documento for de outro fornecedor).</span></div>
        <label class="btn primary" style="cursor:pointer;align-self:flex-start">Escolher documentos<input type="file" id="lt-f" multiple accept=".pdf,.doc,.docx,.txt,.xml,.csv,.zip,image/*" hidden></label><span class="hint">Aceita também arquivos .zip com vários documentos dentro.</span>
        <div id="lt-prev"></div><p class="err" id="lt-err" hidden></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn primary" id="lt-go" disabled>Importar</button></div>
      </div>`);
    $$("#layer [data-x]").forEach(x => x.onclick = close);
    let L = [], NOVOS = [];
    const supDe = r => $("#lt-sup").value || r.sup || r.achado?.id || (r.docNovo && NOVOS.find(n => n.doc === r.docNovo) ? "novo:" + r.docNovo : "");
    const novoDe = (doc, r) => { if (!doc || NOVOS.some(n => n.doc === doc)) return; const c = r?.cad || {};
      NOVOS.push({doc, nome: fixMoji(c.nome || ""), municipio: c.municipio ? c.municipio.replace(/\b\w/g, l => l).trim() : "", uf: c.uf || "", abertura: c.abertura || "", cnae: c.cnae || "", nivel: "N1", par: "", sit: r?.sit || ""}); };
    const parOpt = (nv, sel) => nv === "N1" ? `<option value="">${esc(CLI().nome)} (cliente contratante)</option>` : S.suppliers.filter(x => x.nivel === (nv === "N2" ? "N1" : "N2")).sort((a, b) => fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")).map(x => `<option value="${x.id}" ${x.id === sel ? "selected" : ""}>${x.nivel} · ${esc(x.nome)}</option>`).join("") || `<option value="">Cadastre antes um ${nv === "N2" ? "N1" : "N2"}</option>`;
    const desenha = () => {
      L.forEach(r => { if (!r.achado && r.docNovo && !$("#lt-sup").value && !r.sup) novoDe(r.docNovo, r); });
      const p = $("#lt-prev"), aC = L.filter(r => r.tipo === A_CLASS).length, semF = L.filter(r => !supDe(r)).length;
      $("#lt-go").disabled = !L.length; $("#lt-go").textContent = L.length ? `Importar ${L.length} documento(s)` : "Importar";
      p.innerHTML = !L.length ? "" : `<div class="result" style="font-size:13px;margin-bottom:8px"><b>${L.length - aC}</b> identificado(s)${aC ? ` · <b style="color:var(--warn)">${aC} a classificar</b> pelo revisor` : ""}${semF ? ` · <b style="color:var(--bad)">${semF} sem fornecedor</b> (escolha na linha)` : ""}</div>
        <div class="tbl" style="max-height:380px;overflow:auto"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Fornecedor</th><th>Observação</th><th></th></tr></thead><tbody>${L.map((r, i) => { const fs = supDe(r), outro = fs && r.achado && r.achado.id !== fs;
          return `<tr><td style="font-size:12.5px;min-width:150px;word-break:break-all">${esc(r.f.name)}</td><td><select data-lt="${i}" data-k="tipo" style="max-width:190px">${tipoOpt(r.tipo)}</select></td>
            <td><select data-lt="${i}" data-k="sup" style="max-width:220px" ${$("#lt-sup").value ? "disabled" : ""}>${supOpt(fs).replace('<option value="">— escolher —</option>', '<option value="">— escolher —</option>' + NOVOS.map(n => `<option value="novo:${n.doc}" ${fs === "novo:" + n.doc ? "selected" : ""}>NOVO · ${esc(n.nome || n.doc)}</option>`).join(""))}</select></td>
            <td style="font-size:12px;min-width:160px">${r.tipo === A_CLASS ? `<span style="color:var(--warn)">${r.leu ? "tipo não identificado no texto" : "sem texto legível (foto ou digitalização)"}</span>` : `identificado pelo ${r.como}${r.rotulo && r.rotulo !== r.tipo ? ": " + esc(r.rotulo) : ""}`}${r.achado ? `<div>CNPJ/CPF do documento: <b>${esc(r.achado.nivel + " · " + r.achado.nome)}</b></div>` : r.docs.length ? `<div class="sub" style="margin:0">CNPJ/CPF fora da cadeia: ${r.docs.slice(0, 2).map(esc).join(", ")}</div>` : ""}${outro ? `<div style="color:var(--bad)">Atenção: o CNPJ do documento é de outro fornecedor</div>` : ""}</td>
            <td><button type="button" class="btn sm ghost" data-ltx="${i}" aria-label="Remover">×</button></td></tr>`; }).join("")}</tbody></table></div>`;
      $$("[data-lt]", p).forEach(e => e.onchange = () => { const r = L[+e.dataset.lt]; if (e.dataset.k === "tipo") r.tipo = e.value; else r.sup = e.value; desenha(); });
      $$("[data-ltx]", p).forEach(e => e.onclick = () => { L.splice(+e.dataset.ltx, 1); desenha(); });
      /* novos fornecedores: conferir nome, nível e para quem vende antes de importar */
      const nb = document.createElement("div"); nb.className = "card"; nb.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:10px;border-color:var(--glow)";
      nb.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><div class="eyebrow">Fornecedores novos (fora da cadeia)</div><h3 style="margin:2px 0 0">${NOVOS.length ? NOVOS.length + " serão cadastrados automaticamente" : "Nenhum fornecedor novo identificado"}</h3>
          <p class="sub" style="margin:4px 0 0">Dados lidos do cartão CNPJ e dos documentos. Ao importar, o sistema cadastra, consulta Receita e listas oficiais, responde a investigação e o questionário no que for possível, organiza os documentos no checklist e classifica o risco.</p></div><button type="button" class="btn sm" id="lt-novo">+ Novo fornecedor</button></div>
        ${NOVOS.map((n, k) => `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;border-top:1px solid var(--line);padding-top:8px" data-nv="${k}">
          <div class="fld"><label>Razão social / nome</label><input data-nk="nome" value="${esc(n.nome)}" placeholder="${/^m/.test(n.doc) ? "Nome do fornecedor" : "Em branco: vem da Receita Federal"}"></div>
          <div class="fld"><label>CNPJ/CPF</label><input data-nk="doc" value="${esc(n.doc)}" ${n.auto === false ? "" : "readonly"}></div>
          <div class="fld"><label>Município / UF</label><input data-nk="municipio" value="${esc([n.municipio, n.uf].filter(Boolean).join("/"))}" placeholder="Cidade/UF"></div>
          <div class="fld"><label>Nível</label><select data-nk="nivel">${["N1", "N2", "N3"].map(v => `<option ${v === n.nivel ? "selected" : ""}>${v}</option>`).join("")}</select></div>
          <div class="fld"><label>Vende para</label><select data-nk="par">${parOpt(n.nivel, n.par)}</select></div>
          ${n.sit && n.sit !== "ATIVA" ? `<div style="grid-column:1/-1;color:var(--bad);font-size:12.5px">Cartão CNPJ indica situação ${esc(n.sit)}.</div>` : ""}</div>`).join("")}`;
      p.appendChild(nb);
      $$("[data-nv]", nb).forEach(row => { const n = NOVOS[+row.dataset.nv]; $$("[data-nk]", row).forEach(inp => inp.onchange = () => { const k = inp.dataset.nk;
        if (k === "municipio"){ const [m, u] = inp.value.split("/"); n.municipio = (m || "").trim(); n.uf = (u || "").trim().toUpperCase().slice(0, 2); }
        else if (k === "doc"){ const old = n.doc; n.doc = inp.value.replace(/\D/g, ""); L.forEach(r => { if (r.sup === "novo:" + old) r.sup = "novo:" + n.doc; }); }
        else { n[k] = inp.value; if (k === "nivel") n.par = ""; } desenha(); }); });
      $("#lt-novo", nb).onclick = () => { const d = "m" + Date.now().toString(36); NOVOS.push({doc: d, nome: "", municipio: "", uf: "", nivel: "N1", par: "", auto: false}); L.forEach(r => { if (!supDe(r)) r.sup = "novo:" + d; }); desenha(); };
    };
    $("#lt-sup").onchange = desenha;
    $("#lt-f").onchange = async ev => { const fs = [...ev.target.files]; ev.target.value = ""; if (!fs.length) return; const p = $("#lt-prev"); p.innerHTML = `<div class="result">Lendo ${fs.length} documento(s)…</div>`;
      const MIME = {pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain", xml: "text/xml", csv: "text/csv", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", heic: "image/heic"};
      const todos = [];
      const nao = fs.filter(f => /\.(rar|7z|tar|gz)$/i.test(f.name)); if (nao.length){ toast(`${nao.map(f => f.name).join(", ")}: formato não aceito. Compacte em .zip ou envie os arquivos soltos.`, 6000); }
      for (const f of fs.filter(f => !/\.(rar|7z|tar|gz)$/i.test(f.name))){ if (/\.zip$/i.test(f.name)){ try{ const z = await IMP.unzip(await f.arrayBuffer());
            for (const [nome, ent] of Object.entries(z)){ if (/\/$|__MACOSX|(^|\/)\./.test(nome)) continue; const ext = (nome.split(".").pop() || "").toLowerCase(); if (!MIME[ext] && ext !== "doc") continue;
              todos.push(new File([await ent.bytes()], nome.split("/").pop(), {type: MIME[ext] || "application/octet-stream"})); } }
          catch(e){ toast(`Não foi possível abrir ${f.name}`); } }
        else todos.push(f); }
      p.innerHTML = `<div class="result">Lendo ${todos.length} documento(s)…</div>`;
      for (const f of todos){ const r = await lerDoc(f); r.tipo = r.tipoEv; L.push(r); } desenha(); };
    $("#lt-go").onclick = async () => {
      const err = $("#lt-err"), semF = L.filter(r => !supDe(r)); if (semF.length){ err.textContent = `Escolha o fornecedor de ${semF.length} documento(s) (o CNPJ/CPF não foi encontrado na cadeia).`; err.hidden = false; return; }
      const usados = new Set(L.map(r => supDe(r)).filter(x => x.startsWith("novo:")).map(x => x.slice(5)));
      const faltaNome = NOVOS.filter(n => usados.has(n.doc) && !n.nome.trim() && /^m/.test(n.doc));
      if (faltaNome.length){ err.textContent = "Informe o nome (ou o CNPJ/CPF) dos fornecedores novos cadastrados à mão."; err.hidden = false; return; }
      NOVOS.filter(n => usados.has(n.doc) && !n.nome.trim()).forEach(n => { n.nome = "CNPJ/CPF " + (n.doc.length === 14 ? n.doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : n.doc); n.provisorio = true; });
      err.hidden = true; const go = $("#lt-go"); go.disabled = true; let n = 0, repet = 0; const ids = {};
      try{ for (const nv of NOVOS.filter(n => usados.has(n.doc))){ go.textContent = "Cadastrando fornecedor novo…"; const id = uid(), c = UF_CENTER[nv.uf] || [-15.8, -47.9], j = () => (Math.random() - .5) * .3, doc = /^m/.test(nv.doc) ? "" : nv.doc;
          await Store.set("suppliers", id, {nivel: nv.nivel, tipo: (SUP_TYPES[nv.nivel] || [""])[0], parentId: nv.nivel === "N1" ? "" : nv.par, nome: nv.nome.trim(), doc: doc.length === 14 ? doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : doc.length === 11 ? doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : doc,
            ie: "", abertura: nv.abertura || "", volume: "", uf: nv.uf || "", municipio: nv.municipio || "", lat: c[0] + j(), lng: c[1] + j(), coordAprox: true, answers: {}, docs: {}, insp: {}, balanco: {}, invest: {},
            origem: "Importação de documentos", nomeProvisorio: !!nv.provisorio, criadoEm: nowISO(), criadoPor: Store.me.id || ""}); ids["novo:" + nv.doc] = id; }
        for (const r of L){ const sd = supDe(r); if (ids[sd]){ r.sup = ids[sd]; r.achado = null; r.docNovo = ""; } go.textContent = `Enviando ${++n}/${L.length}…`; const rp = window.ktDocDuplicado ? await ktDocDuplicado(supDe(r), r.f) : null; if (rp?.dup){ repet++; continue; } const up = await Store.upload(r.f, {sup: supDe(r), tipo: r.tipo, tipoDoc: r.rotulo || "", nome: r.f.name});
          await salvarEvid(uid(), {...(rp?.hash ? {hash: rp.hash} : {}), tam: r.f.size, supplierId: supDe(r), tipo: r.tipo, obs: ["Importação de documentos", r.tipo === A_CLASS ? "aguardando classificação do revisor" : "tipo identificado pelo " + r.como + (r.rotulo && r.rotulo !== r.tipo ? " (" + r.rotulo + ")" : "")].join(" · "), ...up, mime: r.f.type, nome: r.f.name, gps: null, distKm: null, takenAt: null,
            criadoEm: nowISO(), criadoPor: Store.me.id || "", origem: "Importação de documentos", aClassificar: r.tipo === A_CLASS}, r.f); }
        close(); const aC = L.filter(r => r.tipo === A_CLASS).length, nN = Object.keys(ids).length; toast(`${L.length - repet} documento(s) importado(s)${repet ? ` · ${repet} já estava(m) no dossiê (não duplicado)` : ""}${nN ? ` · ${nN} fornecedor(es) novo(s) cadastrado(s)` : ""}${aC ? ` · ${aC} a classificar` : ""} · análise automática em andamento`); }
      catch(x){ err.textContent = "Não foi possível importar. Verifique a conexão e o seu acesso."; err.hidden = false; go.disabled = false; go.textContent = `Importar ${L.length} documento(s)`; }
    };
  }
  /* botão na Nova evidência e fila "A classificar" em Evidências */
  const _oef = openEvidenceForm;
  openEvidenceForm = function(preSup){
    _oef.apply(this, arguments); const b = $("#layer .sheet-b"); if (!b || $("#ev-lote")) return;
    const d = document.createElement("div"); d.className = "banner"; d.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap";
    d.innerHTML = `<span><b>Vários documentos?</b> Importe de uma vez: o sistema separa por tipo e por fornecedor.</span><button type="button" class="btn sm" id="ev-lote">Importar vários documentos</button>`;
    b.prepend(d); $("#ev-lote").onclick = () => { const s = $("#e-sup")?.value || preSup || ""; importarLote(s); };
  };
  const _rev = renderEvidencias;
  renderEvidencias = function(){
    _rev.apply(this, arguments); const host = $("#evidencias"); if (!host) return; const ed = Store.me.canWrite !== false;
    const head = host.querySelector(".head");
    if (head && ed && !$("#ev-lote2", host)){ const bt = document.createElement("button"); bt.type = "button"; bt.className = "btn"; bt.id = "ev-lote2"; bt.textContent = "Importar vários documentos"; bt.onclick = () => importarLote("");
      const add = $("#ev-add", host); if (add){ const w = document.createElement("div"); w.style.cssText = "display:flex;gap:8px;flex-wrap:wrap"; add.before(w); w.append(bt, add); } else head.appendChild(bt); }
    const P = S.evidences.filter(e => e.tipo === A_CLASS && supById(e.supplierId)); if (!P.length) return;
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px;border-color:var(--warn)"; el.id = "ev-aclass";
    const tipoOpt = EV_TYPES.filter(t => t !== A_CLASS && !/^Foto/i.test(t)).map(t => `<option>${esc(t)}</option>`).join("");
    el.innerHTML = `<div><div class="eyebrow" style="color:var(--warn)">Para o revisor</div><h3>${P.length} documento(s) a classificar</h3><p class="sub" style="margin:4px 0 0">O sistema não identificou o tipo destes documentos. Abra, confira e escolha o tipo; a pré-análise já foi feita com o texto disponível.</p></div>
      <div class="tbl"><table><thead><tr><th>Documento</th><th>Fornecedor</th><th>Enviado</th><th>Tipo</th><th></th></tr></thead><tbody>${P.map(e => { const s = supById(e.supplierId);
        return `<tr><td style="font-size:12.5px;word-break:break-all">${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener" style="color:var(--glow)">${esc(e.nome || "documento")}</a>` : esc(e.nome || "documento")}</td><td style="font-size:12.5px"><span class="lvtag">${s.nivel}</span> ${esc(s.nome)}</td><td style="font-size:12px">${e.criadoEm ? dt(e.criadoEm) : ""}</td>
          <td><select data-acs="${e.id}" ${Store.me.canEdit ? "" : "disabled"}><option value="">Escolher o tipo…</option>${tipoOpt}</select></td><td><button type="button" class="btn sm" data-acb="${e.id}" ${Store.me.canEdit ? "" : "disabled"}>Classificar</button></td></tr>`; }).join("")}</tbody></table></div>`;
    (head || host.firstElementChild)?.after(el);
    $$("[data-acb]", el).forEach(bt => bt.onclick = async () => { const id = bt.dataset.acb, v = $(`[data-acs="${id}"]`, el).value; if (!v){ toast("Escolha o tipo do documento"); return; }
      const e = S.evidences.find(x => x.id === id); bt.disabled = true;
      try{ await Store.update("evidences", id, {tipo: v, aClassificar: false, classificadoPor: Store.me.id || "", classificadoEm: nowISO(), obs: String(e?.obs || "").replace("aguardando classificação do revisor", "classificado pelo revisor")}); toast("Documento classificado");
        if (/nota fiscal|contrat|social|cnpj|certid|licen|procura|CAR/i.test(v) && e?.url){ try{ const blob = await ktBaixar(e); EXT_EVID.forEach(f => { try{ f(id, blob, {...e, tipo: v}); }catch(x){} }); }catch(x){ toast(String(x.message || x)); } } }
      catch(x){ toast("Não foi possível classificar"); bt.disabled = false; } });
  };

  /* ---------- checklist documental preenchido pelos documentos anexados ---------- */
  const ITEM = [[/contrato_social/, /contrato social|estatuto|ato constitutivo/i], [/cartao_cnpj/, /cart[aã]o cnpj|cnpj e inscri|documento do vendedor|documento do produtor/i],
    [/cnd_|cndt|crf|certidao/, /certid/i], [/ctf_ibama|licenca|alvara|avcb/, /licen[çc]|alvar/i], [/mtr|cdf/, /\bMTR\b|manifesto/i], [/^car$/, /\bCAR\b/], [/nota/, /notas? fiscal|nota fiscal de produtor/i], [/^contrato$/, /^contratos? |contrato de fornecimento|contratos com/i]];
  const ITEM_TIPO = [[/ticket|pesagem/i, /ticket|pesagem/i], [/pagamento/i, /pagamento/i], [/empregad|esocial/i, /empregad|esocial/i], [/licen|alvar/i, /licen[çc]|alvar/i], [/\bMTR\b|manifesto/i, /\bMTR\b|manifesto/i],
    [/contrato social/i, /contrato social/i], [/cart[aã]o cnpj/i, /cart[aã]o cnpj|cnpj e inscri/i], [/certid|\bCND\b|\bCTF\b/i, /certid/i], [/nota fiscal/i, /notas? fiscal/i], [/recibo do car|\bCAR\b/i, /\bCAR\b/], [/^contrato$/i, /^contratos? /i], [/cadastro do vendedor/i, /documento do vendedor|cadastro/i]];
  function itemDe(e, list){
    const t = e.analise?.extraido?.tipo; let re = null;
    if (t){ const m = ITEM.find(([k]) => k.test(t)); if (m) re = m[1]; }
    if (!re){ const m = ITEM_TIPO.find(([k]) => k.test(e.tipo || "")); if (m) re = m[1]; }
    if (!re) return -1; return list.findIndex(x => re.test(x));
  }
  let chkT = 0;
  function autoChecklist(){
    if (!Store.me?.canWrite || !S.suppliers.length) return;
    S.suppliers.forEach(s => {
      const list = DOCS[s.nivel] || [], d = s.docs || {}, obs = s.docsObs || {}, alvo = {};
      S.evidences.filter(e => e.supplierId === s.id && !PHOTO_TYPES.includes(e.tipo) && e.tipo !== A_CLASS).forEach(e => {
        const i = itemDe(e, list); if (i < 0) return;
        const legivel = /pdf|word|text|xml/.test(e.mime || "") || /\.(pdf|docx|txt|xml)$/i.test(e.nome || "");
        if (!e.analise && legivel) return;   /* espera a pré-análise */
        const rot = e.analise?.extraido?.rotulo || e.tipo, p = e.parecerDoc; let st, txt;
        if (p?.status === "aprovado"){ st = "ok"; txt = `${rot}: aprovado pelo Jurídico${p.advogado?.nome ? " (" + p.advogado.nome + ")" : ""}.`; }
        else if (p?.status === "ressalvas" || p?.status === "reprovado"){ st = "ress"; txt = `${rot}: ${p.status === "reprovado" ? "reprovado" : "aprovado com ressalvas"} pelo Jurídico — ${String(p.texto || "").replace(/\s+/g, " ").slice(0, 160)}`; }
        else if (!e.analise?.extraido){ st = "ress"; txt = `${rot} apresentado, mas sem leitura automática (foto ou digitalização): conferir manualmente.`; }
        else { const A = DOCAN.achados(e, s).filter(a => a.sev !== "info");
          if (A.length){ st = "ress"; txt = `${rot} apresentado com ressalva: ` + A.sort((a, b) => ({alto: 0, medio: 1, baixo: 2}[a.sev] - {alto: 0, medio: 1, baixo: 2}[b.sev])).slice(0, 3).map(a => a.txt.replace(/\.$/, "")).join("; ") + "."; }
          else { st = "ok"; txt = `${rot} conferido automaticamente: sem inconsistências na pré-análise.`; } }
        const k = "d" + i, cur = alvo[k];
        if (!cur || (cur.st === "ok" && st === "ress")) alvo[k] = {st, txt, doc: e.nome || rot};
        else if (cur.st === st && st === "ress" && !cur.txt.includes(txt.slice(0, 40))) cur.txt += " " + txt;
      });
      const docsEv = S.evidences.filter(e => e.supplierId === s.id && !PHOTO_TYPES.includes(e.tipo) && e.origem === "Importação de documentos");
      if (docsEv.length) list.forEach((t, i) => { const k = "d" + i; if (!alvo[k] && !d[k] && !obs[k]?.manual) alvo[k] = {st: "pend", txt: "Documento não apresentado na importação: solicitar ao fornecedor (Portal do Fornecedor ou e-mail).", doc: ""}; });
      const up = {docs: {}, docsObs: {}}; let mud = 0;
      Object.entries(alvo).forEach(([k, v]) => { if (obs[k]?.manual) return; if (d[k] === "na") return;
        if (d[k] !== v.st || obs[k]?.txt !== v.txt){ up.docs[k] = v.st; up.docsObs[k] = {txt: v.txt, auto: true, doc: v.doc, em: nowISO()}; mud++; } });
      if (mud) Store.update("suppliers", s.id, up).catch(() => {});
    });
  }
  /* ---------- dossiê · aba Documentos: título fixo, anexar por item, lote/.zip, arquivos de cada item ---------- */
  const TIPO_ITEM = [[/contrato social|estatuto/i, () => evTipo(/contrato social/i)], [/cart[aã]o cnpj|cnpj e inscri/i, () => evTipo(/cart[aã]o cnpj/i)], [/certid/i, () => evTipo(/^certid/i)],
    [/licen[çc]|alvar/i, () => evTipo(/licen/i) || evTipo(/alvar/i)], [/\bMTR\b|manifesto/i, () => evTipo(/\bMTR\b/)], [/\bCAR\b/, () => evTipo(/\bCAR\b/)], [/notas? fiscal/i, () => evTipo(/nota fiscal/i)],
    [/ticket|pesagem/i, () => evTipo(/ticket|pesagem/i)], [/pagamento/i, () => evTipo(/pagamento/i)], [/empregad|esocial/i, () => evTipo(/empregad/i)], [/documento do (vendedor|produtor)/i, () => evTipo(/cadastro do vendedor|documento/i)],
    [/contrat/i, () => evTipo(/^contrato$/i) || evTipo(/contrato/i)], [/LGPD|NDA/i, () => evTipo(/outro/i)]];
  const tipoDoItem = t => { const m = TIPO_ITEM.find(([re]) => re.test(t)); return (m && m[1]()) || evTipo(/^outro$/i) || "Outro"; };
  EXT_DOCS.push((s, b) => {
    const head = b.querySelector(".head"), list = DOCS[s.nivel] || [], ed = Store.me.canWrite !== false;
    if (head){ head.style.cssText += ";position:sticky;top:-16px;z-index:5;background:var(--navy);margin:-16px -2px 0;padding:14px 2px 10px;border-bottom:1px solid var(--line)";
      const add = $("#doc-add", head); if (add && ed){ const w = document.createElement("div"); w.style.cssText = "display:flex;gap:8px;flex-wrap:wrap"; add.before(w);
        const lt = document.createElement("button"); lt.type = "button"; lt.className = "btn sm"; lt.textContent = "Importar vários documentos ou .zip"; lt.onclick = () => importarLote(s.id); w.append(lt, add); } }
    const evs = S.evidences.filter(e => e.supplierId === s.id && !PHOTO_TYPES.includes(e.tipo));
    $$(".q", b).forEach(q => { const seg = $("[data-d]", q); if (!seg) return; const i = +seg.dataset.d.slice(1), item = list[i] || "";
      const meus = evs.filter(e => itemDe(e, list) === i), qa = $(".qa", q);
      const box = document.createElement("div"); box.style.cssText = "display:flex;gap:6px;flex-wrap:wrap;align-items:center;flex:0 1 auto";
      box.innerHTML = meus.map(e => `<a ${e.url ? `href="${esc(e.url)}" target="_blank" rel="noopener"` : ""} class="fbtn" style="text-decoration:none;font-size:11.5px" title="${esc(e.tipo)}">📄 ${esc((e.nome || e.tipo).slice(0, 38))}</a>`).join("")
        + (ed ? `<button type="button" class="btn sm ghost" data-anx="${i}" style="padding:4px 10px">+ Anexar</button>` : "");
      if (qa) seg.after(box);
      const bt = $("[data-anx]", box); if (bt) bt.onclick = () => openEvidenceForm(s.id, tipoDoItem(item)); });
  });

  /* ---------- Investigação respondida automaticamente ---------- */
  const dBRv = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("pt-BR") : "";
  const MANUAL = "Sem base pública unificada para consulta automática: confirmar em tribunais (TJ/TRF), diários oficiais e notícias.";
  const SEM_FONTE = "Sem consulta pública automática para este item: confirmar com documento ou fonte oficial.";
  function respInvest(s){
    const R = {}, docs = S.evidences.filter(e => e.supplierId === s.id && e.analise?.extraido).map(e => ({e, x: e.analise.extraido})).sort((a, b) => String(b.e.criadoEm || "").localeCompare(String(a.e.criadoEm || "")));
    const ult = t => docs.find(d => d.x.tipo === t), hojeI = new Date().toISOString().slice(0, 10), valida = x => !x.validade || x.validade >= hojeI;
    const L = s.listas, bases = L?.bases || {}, ach = L?.achados || [];
    const lista = (base, nome) => { if (!bases[base]) return {v: "nc", n: `${nome}: lista ainda não carregada no sistema (carga automática diária na versão publicada).`};
      const a = ach.filter(x => x.base === base); return a.length ? {v: "sim", n: `Consta em ${nome}: ${a.map(x => `${x.quem} ${x.nome || ""}`.trim()).slice(0, 3).join("; ")}. Confirmar no site do órgão.`}
        : {v: "nao", n: `Não consta em ${nome} (lista de ${dBRv(bases[base])}; ${L.verificados || 0} CNPJ/CPF verificados: empresa, sócios e favorecidos).`}; };
    R.mte = lista("lista_suja", "Cadastro de Empregadores do MTE");
    R.ibama = lista("ibama", "embargos do IBAMA");
    /* dívida ativa: CND federal, estadual e municipal */
    const cnds = [["cnd_federal", "federal"], ["cnd_estadual", "estadual"], ["cnd_municipal", "municipal"]].map(([t, n]) => ({n, d: ult(t)}));
    const pos = cnds.filter(c => c.d && c.d.x.positiva), ok = cnds.filter(c => c.d && !c.d.x.positiva && valida(c.d.x)), venc = cnds.filter(c => c.d && !c.d.x.positiva && !valida(c.d.x)), falta = cnds.filter(c => !c.d);
    R.divida = pos.length ? {v: "sim", n: `CND ${pos.map(c => c.n).join(", ")} POSITIVA (${pos.map(c => c.d.e.nome || "").join(", ")}). Levantar os débitos.`}
      : !falta.length && !venc.length ? {v: "nao", n: `CND federal, estadual e municipal negativas e válidas (${ok.map(c => c.n + (c.d.x.validade ? " até " + dBRv(c.d.x.validade) : "")).join("; ")}).`}
      : {v: "nc", n: `Resposta automática depende das certidões: ${[ok.length ? "negativa(s): " + ok.map(c => c.n).join(", ") : "", venc.length ? "vencida(s): " + venc.map(c => c.n).join(", ") : "", falta.length ? "falta(m): CND " + falta.map(c => c.n).join(", ") : ""].filter(Boolean).join(" · ")}. Anexe em Documentos.`};
    const cndt = ult("cndt");
    R.proc_trab = cndt ? (cndt.x.positiva ? {v: "sim", n: `CNDT POSITIVA (${cndt.e.nome || ""}): há débitos trabalhistas; levantar os processos.`} : valida(cndt.x) ? {v: "nao", n: `CNDT negativa${cndt.x.validade ? " válida até " + dBRv(cndt.x.validade) : ""} (${cndt.e.nome || ""}).`} : {v: "nc", n: `CNDT vencida em ${dBRv(cndt.x.validade)}: anexe a certidão atualizada (site do TST).`})
      : {v: "nc", n: "Anexe a CNDT (emitida gratuitamente no site do TST) para a resposta automática."};
    const prot = docs.find(d => /protesto/.test(d.x.nomesTexto || ""));
    R.protestos = prot ? (prot.x.positiva || /consta(m)? protesto|existe(m)? protesto/.test(prot.x.nomesTexto) && !/n[aã]o consta/.test(prot.x.nomesTexto) ? {v: "sim", n: `Certidão de protestos com apontamentos (${prot.e.nome || ""}).`} : {v: "nao", n: `Certidão de protestos negativa (${prot.e.nome || ""}).`})
      : {v: "nc", n: "Sem consulta pública automática: emitir a certidão de protestos (CENPROT / IEPTB) com o CNPJ e anexar em Documentos."};
    /* licenças e alvarás */
    const lic = docs.filter(d => ["licenca", "alvara", "ctf_ibama", "avcb"].includes(d.x.tipo));
    const licV = lic.filter(d => d.x.validade && d.x.validade < hojeI);
    R.lic = !lic.length ? {v: "nc", n: "Nenhuma licença, alvará ou cadastro anexado: anexe em Documentos para a resposta automática."}
      : licV.length ? {v: "sim", n: `Documento vencido: ${licV.map(d => `${d.x.rotulo} (${dBRv(d.x.validade)})`).join("; ")}.`}
      : {v: "nao", n: `Apresentado(s): ${lic.map(d => d.x.rotulo + (d.x.validade ? " até " + dBRv(d.x.validade) : "")).join("; ")}. Confirmar o cadastro estadual/municipal de compra de sucata.`};
    /* notas e pagamentos importados */
    let A = null; try{ if (typeof OPS !== "undefined") A = OPS.analise(); }catch(e){}
    const nfs = A ? A.R.filter(x => x.sup?.id === s.id) : [], FRIA = /chave_inv|seq|dup|cnpj_inapto|abertura|doc_inv|futura|soma/;
    const frias = nfs.filter(x => x.alertas.some(a => FRIA.test(a.cod) && a.sev !== "info"));
    R.nfria = !nfs.length ? {v: "nc", n: "Nenhuma nota fiscal importada deste fornecedor (Auditoria · Operações comerciais)."}
      : frias.length ? {v: "sim", n: `${frias.length} de ${nfs.length} nota(s) com indício: ${[...new Set(frias.flatMap(x => x.alertas.filter(a => FRIA.test(a.cod)).map(a => a.txt || a.cod)))].slice(0, 3).join("; ")}.`}
      : {v: "nao", n: `${nfs.length} nota(s) conferida(s) (chave, sequência, datas e emitente) sem indício de nota fria.`};
    const pags = nfs.flatMap(x => x.pags || []), esp = nfs.filter(x => x.alertas.some(a => a.cod === "pag_esp"));
    R.especie = !pags.length ? {v: "nc", n: "Nenhum pagamento importado deste fornecedor (Auditoria · Operações comerciais)."}
      : esp.length ? {v: "sim", n: `${esp.length} nota(s) paga(s) em espécie.`} : {v: "nao", n: `${pags.length} pagamento(s) importado(s), sem pagamento em espécie.`};
    /* itens que dependem de consulta manual */
    R.pep = {v: "nc", n: "A lista de PEP (CGU) exige o CPF completo dos sócios e a Receita informa o CPF parcial: confirmar no Portal da Transparência."};
    R.rotat = {v: "", n: "A Receita não informa outras empresas dos sócios: consultar na Junta Comercial / Redesim e informar o número."};
    R.midia = {v: "nc", n: "Pesquisa de notícias não é automática: use \"Notícias sobre a empresa\" na cadeia (Auditoria) e registre o resultado."};
    ["proc_crim", "prisao", "crimeorg", "fachada", "recep", "rcarga"].forEach(k => R[k] = {v: "nc", n: MANUAL});
    INV.forEach(([id]) => { if (!R[id]) R[id] = {v: "nc", n: SEM_FONTE}; });
    /* extensões do produto (ex.: M&A): respostas de outras fontes do sistema; só substituem o que ficou inconclusivo ("nc") ou apontam risco */
    (window.EXT_RESPINV || []).forEach(f => { try{ Object.entries(f(s, R) || {}).forEach(([id, r]) => { if (r && (!R[id] || R[id].v === "nc" || !R[id].v || r.v === "sim")) R[id] = r; }); }catch(e){} });
    return R;
  }
  /* ---------- questionário: respostas automáticas (documentos, Receita, listas, pagamentos, NDA) ---------- */
  function respQuest(s){
    const out = {}, hojeI = new Date().toISOString().slice(0, 10), docs = S.evidences.filter(e => e.supplierId === s.id && e.analise?.extraido).map(e => e.analise.extraido);
    const ult = t => docs.filter(x => x.tipo === t).pop(), valida = x => !x.validade || x.validade >= hojeI, L = s.listas, bases = L?.bases || {}, ach = L?.achados || [];
    const sit = (s.receita?.situacao || ult("cartao_cnpj")?.situacao || "").toUpperCase();
    const cnds = ["cnd_federal", "cnd_estadual", "cnd_municipal", "crf", "cndt"].map(t => [t, ult(t)]), pos = cnds.filter(([, x]) => x && x.positiva), okc = cnds.filter(([, x]) => x && !x.positiva && valida(x));
    const lic = docs.filter(x => ["licenca", "alvara"].includes(x.tipo)), licOk = lic.filter(valida), mtr = docs.filter(x => ["mtr", "mtr_inea"].includes(x.tipo)), car = ult("car");
    let A = null; try{ if (typeof OPS !== "undefined") A = OPS.analise(); }catch(e){}
    const nfs = A ? A.R.filter(x => x.sup?.id === s.id) : [], pags = nfs.flatMap(x => x.pags || []), esp = nfs.some(x => x.alertas.some(a => a.cod === "pag_esp")), terc = nfs.some(x => x.alertas.some(a => a.cod === "pag_terc"));
    const regras = [
      [/ativa na Receita/i, t => sit ? [sit === "ATIVA", `Receita/cartão CNPJ: ${sit}${/inscri[çc][aã]o estadual/i.test(t) ? "; confirmar a inscrição estadual" : ""}`] : null],
      [/certid[õo]es negativas v[áa]lidas/i, () => pos.length ? [false, `Certidão positiva: ${pos.map(([t]) => t.replace("cnd_", "CND ").replace("crf", "CRF FGTS").replace("cndt", "CNDT")).join(", ")}`] : okc.length >= 5 ? [true, "CND federal, estadual, municipal, CRF FGTS e CNDT negativas e válidas"] : null],
      [/licen[çc]a ambiental, alvar[áa] e (MTR|o cadastro)|possui licen[çc]a ambiental/i, t => { if (!lic.length) return null; const venc = lic.filter(x => !valida(x)); if (venc.length) return [false, "Vencido: " + venc.map(x => x.rotulo).join(", ")];
        if (/MTR/.test(t) && !mtr.length) return null; return [true, lic.map(x => x.rotulo + (x.validade ? " até " + x.validade.split("-").reverse().join("/") : "")).join("; ") + (mtr.length ? "; MTR apresentado" : "")]; }],
      [/Cadastro de Empregadores do MTE/i, () => bases.lista_suja ? [ach.some(x => x.base === "lista_suja"), ach.some(x => x.base === "lista_suja") ? "Consta na lista oficial do MTE" : "Não consta na lista oficial do MTE (empresa e sócios)"] : null],
      [/embargo ambiental/i, () => bases.ibama ? [ach.some(x => x.base === "ibama"), ach.some(x => x.base === "ibama") ? "Consta nos embargos do IBAMA" : "Não consta nos embargos do IBAMA"] : null],
      [/CAR ativo/i, () => car && car.carSit ? [car.carSit === "ATIVO", "Recibo do CAR: " + car.carSit] : null],
      [/somente por meio banc[áa]rio|pagamento em seu nome, por transfer/i, () => pags.length ? [!esp && !terc, esp ? "Há pagamento em espécie nas notas importadas" : terc ? "Há pagamento a terceiros" : `${pags.length} pagamento(s) bancário(s) em nome do emitente`] : null],
      [/dinheiro vivo|em esp[ée]cie/i, () => pags.length ? [esp, esp ? "Pagamento em espécie nas notas importadas" : "Nenhum pagamento em espécie nos pagamentos importados"] : null],
      [/NDA e o termo LGPD|termo de consentimento LGPD/i, () => s.nda?.aceito ? [true, `Aceito por ${s.nda.nome || "—"} em ${String(s.nda.em || "").slice(0, 10).split("-").reverse().join("/")}`] : null]];
    (Q[s.nivel] || []).flatMap(g => g.items).forEach(([id, t]) => { const rg = regras.find(([re]) => re.test(t)); if (!rg) return; const r = rg[1](t); if (r) out[id] = {v: r[0] ? "sim" : "nao", n: "Automático: " + r[1]}; });
    return out;
  }
  function autoQuest(){
    if (!Store.me?.canWrite) return;
    /* nome provisório (CNPJ) substituído pela razão social da Receita Federal assim que a consulta responde */
    S.suppliers.filter(s => s.nomeProvisorio && s.receita?.razao).forEach(s => Store.update("suppliers", s.id, {nome: s.receita.razao, nomeProvisorio: false, ...(!s.municipio && s.receita.municipio ? {municipio: s.receita.municipio, uf: s.receita.uf || s.uf} : {})}).catch(() => {}));
    S.suppliers.forEach(s => { const R = respQuest(s), cur = s.answers || {}, up = {}; let mud = 0;
      Object.entries(R).forEach(([id, r]) => { const x = cur[id] || {}; if (x.v && !x.auto) return; if (x.v === r.v && x.n === r.n) return; up[id] = {v: r.v, n: r.n, auto: true, origem: "Automático", em: nowISO()}; mud++; });
      if (mud) Store.update("suppliers", s.id, {answers: up}).catch(() => {}); });
  }
  function autoInvest(){
    if (!Store.me?.canWrite) return;
    S.suppliers.forEach(s => { const R = respInvest(s), cur = s.invest || {}, up = {}; let mud = 0;
      INV.forEach(([id, , tipo]) => { const r = R[id], x = cur[id] || {}; if (!r) return;
        if (x.manual) return;
        if (!x.auto && ((x.v && x.v !== "nc") || (x.n && String(x.n).trim()))) return;   /* resposta registrada antes pela equipe */
        const v = tipo === "num" ? (x.v || "") : r.v;
        if (x.v !== v || x.n !== r.n){ up[id] = {v, n: r.n, auto: true, em: nowISO()}; mud++; } });
      if (mud) Store.update("suppliers", s.id, {invest: up}).catch(() => {}); });
  }

  /* ---------- andamento (percentual de conclusão) por fornecedor e geral ---------- */
  function progresso(s){
    const P = [], add = (k, l, feito, tot, falta) => P.push({k, l, feito, tot, pct: tot ? Math.round(feito / tot * 100) : null, falta});
    const ac = answersCount(s); add("quest", "Questionário", ac.done, ac.total, ac.total - ac.done ? `${ac.total - ac.done} pergunta(s) sem resposta` : "");
    const dl = DOCS[s.nivel] || [], d = s.docs || {}, dOk = dl.filter((_, i) => ["ok", "ress", "na"].includes(d["d" + i])).length;
    add("docs", "Documentos", dOk, dl.length, dl.length - dOk ? `${dl.length - dOk} documento(s) pendente(s)` : "");
    const v = s.invest || {}, iv = INV.filter(([id, , tipo]) => tipo === "sn" ? ["sim", "nao"].includes(v[id]?.v) : v[id]?.v !== undefined && v[id]?.v !== ""), ivTot = INV.length + 1, ivOk = iv.length + (v.situacao ? 1 : 0);
    add("invest", "Investigação", ivOk, ivTot, ivTot - ivOk ? `${ivTot - ivOk} consulta(s) a confirmar` : "");
    const il = INSP[s.nivel] || [], ins = s.insp || {}, inOk = il.filter(([id]) => ins[id]?.v).length; add("insp", "Inspeção física", inOk, il.length, il.length - inOk ? `${il.length - inOk} item(ns) de inspeção` : "");
    const evs = S.evidences.filter(e => e.supplierId === s.id), docsJ = evs.filter(e => e.analise?.extraido && e.analise.extraido.tipo !== "nota" && !/nota fiscal/i.test(e.tipo || "")), cts = S.contracts.filter(k => k.supplierId === s.id);
    const jTot = docsJ.length + cts.length + 1, jOk = docsJ.filter(e => e.parecerDoc).length + cts.filter(k => S.pareceres[k.id]).length + (s.nda?.validado ? 1 : 0);
    add("jur", "Jurídico (pareceres e NDA)", jOk, jTot, [docsJ.length - docsJ.filter(e => e.parecerDoc).length ? `${docsJ.length - docsJ.filter(e => e.parecerDoc).length} documento(s) sem parecer` : "", cts.length - cts.filter(k => S.pareceres[k.id]).length ? `${cts.length - cts.filter(k => S.pareceres[k.id]).length} contrato(s) sem parecer` : "", s.nda?.validado ? "" : s.nda?.aceito ? "NDA a validar" : "NDA sem aceite"].filter(Boolean).join(" · "));
    const fotos = evs.filter(e => PHOTO_TYPES.includes(e.tipo)).length; add("fotos", "Fotos de campo", Math.min(fotos, 3), 3, fotos < 3 ? `${3 - fotos} foto(s) mínima(s)` : "");
    const val = P.filter(x => x.pct != null), total = val.length ? Math.round(val.reduce((t, x) => t + x.pct, 0) / val.length) : 0;
    return {total, P};
  }
  const corP = p => p >= 80 ? "var(--ok)" : p >= 40 ? "var(--warn)" : "var(--bad)";
  const barra = (p, w = 90) => `<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><span style="display:inline-block;width:${w}px;height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden"><i style="display:block;height:100%;width:${p}%;background:${corP(p)}"></i></span><b class="mono" style="font-size:12px;color:${corP(p)}">${p}%</b></span>`;
  function painelGeral(){
    const L = S.suppliers.map(s => ({s, g: progresso(s)})); if (!L.length) return null;
    const media = arr => arr.length ? Math.round(arr.reduce((t, x) => t + x, 0) / arr.length) : 0, geral = media(L.map(x => x.g.total));
    const ETAPAS = ["quest", "docs", "invest", "insp", "jur", "fotos"], nome = {quest: "Questionário", docs: "Documentos", invest: "Investigação", insp: "Inspeção", jur: "Jurídico", fotos: "Fotos"};
    const porEt = ETAPAS.map(k => [k, media(L.map(x => x.g.P.find(p => p.k === k)?.pct).filter(v => v != null))]);
    const porNv = ["N1", "N2", "N3"].map(n => [n, L.filter(x => x.s.nivel === n)]).filter(([, l]) => l.length).map(([n, l]) => [n, media(l.map(x => x.g.total)), l.length]);
    const pend = {docs: L.reduce((t, x) => t + ((x.g.P.find(p => p.k === "docs") || {}).tot - (x.g.P.find(p => p.k === "docs") || {}).feito || 0), 0), par: L.reduce((t, x) => { const j = x.g.P.find(p => p.k === "jur"); return t + (j ? j.tot - j.feito : 0); }, 0)};
    const concl = L.filter(x => x.g.total >= 100).length;
    const el = document.createElement("div"); el.className = "card"; el.id = "prog-geral"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Andamento do projeto · todos os fornecedores</div><h3 style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">Concluído ${barra(geral, 180)}</h3>
        <p class="sub" style="margin:4px 0 0">${L.length} fornecedor(es) · ${concl} com análise concluída · ${pend.docs} documento(s) pendente(s) · ${pend.par} parecer(es) jurídico(s) e NDA a concluir</p></div></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">${porEt.map(([k, p]) => `<div class="va-num" style="min-width:0"><span>${nome[k]}</span>${barra(p, 80)}</div>`).join("")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${porNv.map(([n, p, c]) => `<span class="fbtn" style="cursor:default">${n} · ${esc(LV_NOME[n])} (${c}) ${barra(p, 60)}</span>`).join("")}</div>`;
    return el;
  }
  /* Cadeia: painel geral e coluna Andamento */
  const _rc = renderCadeia;
  renderCadeia = function(){
    _rc.apply(this, arguments); const host = $("#cadeia"); if (!host) return; RK.clear();
    const pg = painelGeral(), st = host.querySelector(".stats"); if (pg){ if (st) st.after(pg); else host.prepend(pg); }
    const tb = host.querySelector("table.blist"); if (!tb) return;
    const ths = [...tb.querySelectorAll("thead th")], iR = ths.findIndex(t => /Pontos/i.test(t.textContent)); if (iR < 0) return;
    const th = document.createElement("th"); th.textContent = "Andamento"; ths[iR].after(th);
    tb.querySelectorAll("tbody tr").forEach(tr => { if (tr.dataset.open){ const sp = supById(tr.dataset.open), td = document.createElement("td"); if (sp){ const g = progresso(sp); td.innerHTML = barra(g.total, 44); td.style.whiteSpace = "nowrap"; td.title = g.P.map(p => `${p.l}: ${p.pct ?? "—"}%`).join(" · "); } tr.children[iR]?.after(td); }
      else { const c = tr.querySelector("td[colspan]"); if (c) c.colSpan = +c.colSpan + 1; } });
  };
  /* dossiê · Dados: andamento do fornecedor por etapa */
  const _rsb = renderSupBody;
  renderSupBody = function(){
    _rsb.apply(this, arguments); if (S.supTab !== "dados") return; const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || $("#prog-forn", b)) return;
    const g = progresso(s), el = document.createElement("div"); el.className = "card"; el.id = "prog-forn"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">Andamento da análise ${barra(g.total, 140)}</h3><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" id="pf-res">Relatório resumido (PDF)</button><button type="button" class="btn sm" id="pf-rpt">Relatório completo (PDF)</button></div></div>
      <div class="tbl"><table><tbody>${g.P.map(p => `<tr><td style="min-width:150px">${esc(p.l)}</td><td>${p.pct == null ? "—" : barra(p.pct, 90)}</td><td class="mono" style="font-size:12px">${p.feito}/${p.tot}</td><td style="font-size:12px;color:var(--muted)">${esc(p.falta || "concluído")}</td></tr>`).join("")}</tbody></table></div>`;
    const why = b.querySelector(".why"); (why || b.firstElementChild)?.after(el); $("#pf-rpt", el).onclick = () => rptFornecedor(s.id); $("#pf-res", el).onclick = () => rptResumo(s.id);
  };

  /* ---------- Evidências: busca por fornecedor e download em .zip ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zipar(arqs){   /* arquivos sem compressão (formato ZIP padrão), nomes em UTF-8 */
    const enc = new TextEncoder(), partes = [], central = []; let off = 0;
    const d = new Date(), dt = ((d.getFullYear() - 1980) << 9 | (d.getMonth() + 1) << 5 | d.getDate()) & 0xFFFF, tm = (d.getHours() << 11 | d.getMinutes() << 5 | (d.getSeconds() >> 1)) & 0xFFFF;
    arqs.forEach(({nome, dados}) => { const n = enc.encode(nome), c = crc32(dados), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true); h.setUint32(14, c, true); h.setUint32(18, dados.length, true); h.setUint32(22, dados.length, true); h.setUint16(26, n.length, true); h.setUint16(28, 0, true);
      partes.push(new Uint8Array(h.buffer), n, dados);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, c, true); ch.setUint32(20, dados.length, true); ch.setUint32(24, dados.length, true); ch.setUint16(28, n.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), n); off += 30 + n.length + dados.length; });
    const tam = central.reduce((t, x) => t + x.length, 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, arqs.length, true); e.setUint16(10, arqs.length, true); e.setUint32(12, tam, true); e.setUint32(16, off, true);
    return new Blob([...partes, ...central, new Uint8Array(e.buffer)], {type: "application/zip"});
  }
  const limpaNome = t => fixMoji(String(t || "")).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 70) || "sem nome";
  async function baixarZip(L, rotulo, btn){
    if (!L.length){ toast("Nenhum documento para baixar."); return; }
    const t0 = btn?.textContent; const arqs = [], falhas = [], usados = new Set(), enc = new TextEncoder();
    for (let i = 0; i < L.length; i++){ const e = L[i], s = supById(e.supplierId); if (btn) btn.textContent = `Baixando ${i + 1}/${L.length}…`;
      let nome = e.nome || (e.tipo + (/pdf/.test(e.mime || "") ? ".pdf" : /image/.test(e.mime || "") ? ".jpg" : "")); const pasta = `${s ? s.nivel + " - " + limpaNome(s.nome) : "Sem fornecedor"}/${limpaNome(e.tipo)}`;
      let cam = `${pasta}/${limpaNome(nome)}`, k = 2; while (usados.has(cam)) cam = `${pasta}/${k++}_${limpaNome(nome)}`; usados.add(cam);
      try{ if (!e.url && !e.assetId) throw 0; const bl = await ktBaixar(e); arqs.push({nome: cam, dados: new Uint8Array(await bl.arrayBuffer())}); e._cam = cam; }
      catch(x){ falhas.push(`${cam}\t${e.url || "(sem arquivo)"}`); e._cam = "não baixado (ver arquivos_nao_baixados.txt)"; } }
    const q = v => `"${fixMoji(v).replace(/"/g, '""')}"`, ST = {aprovado: "Aprovado", ressalvas: "Aprovado com ressalvas", reprovado: "Reprovado"};
    const linhas = [["Nível", "Fornecedor", "CNPJ/CPF", "Tipo", "Arquivo no zip", "Enviado em", "Origem", "Pré-análise (pontos)", "Parecer do Jurídico", "Advogado (OAB)"].map(q).join(";"),
      ...L.map(e => { const s = supById(e.supplierId), A = e.analise && typeof DOCAN !== "undefined" ? DOCAN.achados(e, s).filter(a => a.sev !== "info") : [];
        return [s?.nivel || "", s?.nome || "", s?.doc || "", e.tipo, e._cam, e.criadoEm ? new Date(e.criadoEm).toLocaleString("pt-BR") : "", e.origem || "", A.map(a => a.sev + ": " + a.txt).join(" | "), e.parecerDoc ? ST[e.parecerDoc.status] + (e.parecerDoc.texto ? " — " + e.parecerDoc.texto : "") : "", e.parecerDoc?.advogado ? e.parecerDoc.advogado.nome + " · " + (e.parecerDoc.advogado.oab || "") : ""].map(q).join(";"); })];
    arqs.push({nome: "indice_documentos.csv", dados: enc.encode("﻿" + linhas.join("\r\n"))});
    if (falhas.length) arqs.push({nome: "arquivos_nao_baixados.txt", dados: enc.encode("Arquivos que não puderam ser baixados (abra os links com o acesso ao sistema):\r\n\r\n" + falhas.join("\r\n"))});
    const blob = zipar(arqs), fn = `KinseyTec_${limpaNome(SEG_NOME).replace(/\s+/g, "_")}_documentos_${limpaNome(rotulo).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.zip`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 8000);
    if (btn){ btn.textContent = t0; btn.disabled = false; }
    toast(`${arqs.length - 1 - (falhas.length ? 1 : 0)} documento(s) no zip${falhas.length ? ` · ${falhas.length} não baixado(s), ver lista no zip` : ""}`);
  }
  S.evSup = S.evSup || "";
  const _rev2 = renderEvidencias;
  renderEvidencias = function(){
    _rev2.apply(this, arguments); const host = $("#evidencias"); if (!host) return;
    const comEv = new Map(); S.evidences.forEach(e => { if (supById(e.supplierId)) comEv.set(e.supplierId, (comEv.get(e.supplierId) || 0) + 1); });
    const sups = [...comEv.keys()].map(supById).sort((a, b) => a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt"));
    if (S.evSup && !comEv.has(S.evSup)) S.evSup = "";
    const el = document.createElement("div"); el.className = "card"; el.id = "ev-forn"; el.style.cssText = "display:flex;flex-direction:column;gap:10px;padding:12px";
    el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <select class="search" id="ev-sup" style="flex:1 1 260px" aria-label="Fornecedor"><option value="">Todos os fornecedores (${S.evidences.length} evidências)</option>${sups.map(x => `<option value="${x.id}" ${x.id === S.evSup ? "selected" : ""}>${x.nivel} · ${esc(x.nome)} (${comEv.get(x.id)})</option>`).join("")}</select>
        <input class="search" type="search" id="ev-q" style="flex:1 1 220px" placeholder="Buscar fornecedor, CNPJ ou documento" value="${esc(S.evQ || "")}">
        <button type="button" class="btn sm primary" id="ev-zip">Baixar documentos (.zip)</button></div>
      <div class="sub" id="ev-forn-st" style="margin:0;font-size:12.5px"></div>`;
    const fl = host.querySelector(".filters"); if (fl) fl.before(el); else host.appendChild(el);
    const visiveis = () => { const q = (S.evQ || "").trim(); return S.evidences.filter(e => (!S.evSup || e.supplierId === S.evSup) && (S.evFilter === "todos" || !S.evFilter || e.tipo === S.evFilter)
      && (!q || (supById(e.supplierId) && buscaCasa(supById(e.supplierId), q)) || semAcento((e.nome || "") + " " + (e.tipo || "")).includes(semAcento(q)))); };
    const aplica = () => { const L = visiveis(), ids = new Set(L.map(e => e.id));
      $$(".ev[data-ev]", host).forEach(c => { c.hidden = !ids.has(c.dataset.ev); });
      const sp = S.evSup ? supById(S.evSup) : null;
      $("#ev-forn-st", el).innerHTML = sp ? `<b>${sp.nivel} · ${esc(sp.nome)}</b> · ${L.length} evidência(s) · <a href="#" id="ev-dos" style="color:var(--glow)">abrir dossiê</a> · o zip traz só os documentos deste fornecedor` : (S.evQ || "").trim() ? `${L.length} evidência(s) encontrada(s)` : `O zip traz todos os documentos em pastas por nível, fornecedor e tipo, com um índice em planilha (pré-análise e pareceres) para advogados e para o cliente contratante.`;
      const dz = $("#ev-dos", el); if (dz) dz.onclick = ev => { ev.preventDefault(); openSupplier(sp.id, "docs"); }; };
    $("#ev-sup", el).onchange = e => { S.evSup = e.target.value; aplica(); };
    $("#ev-q", el).oninput = e => { S.evQ = e.target.value; aplica(); };
    $("#ev-zip", el).onclick = ev => { const b = ev.currentTarget; b.disabled = true; const sp = S.evSup ? supById(S.evSup) : null; baixarZip(visiveis(), sp ? sp.nivel + " " + sp.nome : "todos", b); };
    aplica();
  };

  /* ---------- gráficos e relatório por fornecedor ---------- */
  const COR = {alto: [198, 40, 40], medio: [178, 106, 0], baixo: [46, 125, 50], pend: [110, 120, 135]}, AZUL = [4, 115, 195];
  function grafBarras(P, titulo, itens, o = {}){
    const max = o.max || Math.max(1, ...itens.map(i => i[1])), lw = o.lw || 170, bw = P.CW - lw - 70;
    P.h2(titulo); if (o.sub) P.para(o.sub, {size: 8.3, color: [90, 101, 120], gap: 2});
    itens.forEach(([l, v, c, txt]) => { P.ensure(18); P.text(P.M, P.y + 10, String(l).slice(0, 42), 8.5); P.rect(P.M + lw, P.y + 2, bw, 10, [235, 240, 246]);
      if (v > 0) P.rect(P.M + lw, P.y + 2, Math.max(1.5, bw * Math.min(v, max) / max), 10, c || AZUL); P.text(P.M + lw + bw + 6, P.y + 10, txt ?? String(v), 8.5, true); P.y += 16; });
    P.y += 6;
  }
  const corPct = p => p >= 80 ? COR.baixo : p >= 40 ? COR.medio : COR.alto;
  RPT_EXT.unshift(P => { RK.clear();
    const L = S.suppliers.map(s => ({s, r: rk(s), g: progresso(s)})); if (!L.length) return;
    P.h2("Painel gráfico");
    const dist = ["alto", "medio", "baixo", "pend"].map(k => [RISK_LABEL[k], L.filter(x => x.r.level === k).length, COR[k]]);
    grafBarras(P, "Fornecedores por nível de risco", dist.map(([l, n, c]) => [l, n, c, `${n} (${Math.round(n / L.length * 100)}%)`]));
    grafBarras(P, "Risco alto por nível da cadeia", ["N1", "N2", "N3"].map(n => { const t = L.filter(x => x.s.nivel === n), a = t.filter(x => x.r.level === "alto").length; return [`${n} · ${LV_NOME[n]}`, a, COR.alto, `${a} de ${t.length}`]; }));
    grafBarras(P, "Documentos pendentes por nível", ["N1", "N2", "N3"].map(n => { const t = L.filter(x => x.s.nivel === n); const pend = t.reduce((a, x) => { const d = x.g.P.find(p => p.k === "docs"); return a + (d ? d.tot - d.feito : 0); }, 0), tot = t.reduce((a, x) => a + ((x.g.P.find(p => p.k === "docs") || {}).tot || 0), 0); return [`${n} · ${LV_NOME[n]}`, pend, COR.medio, `${pend} de ${tot}`]; }));
    const media = k => { const v = L.map(x => x.g.P.find(p => p.k === k)?.pct).filter(v => v != null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0; };
    grafBarras(P, "Andamento da análise por etapa (média dos fornecedores)", [["questionário", "quest"], ["Documentos", "docs"], ["Investigação", "invest"], ["Inspeção física", "insp"], ["Jurídico (pareceres e NDA)", "jur"], ["Fotos de campo", "fotos"]].map(([l, k]) => { const p = media(k); return [l[0].toUpperCase() + l.slice(1), p, corPct(p), p + "%"]; }), {max: 100});
  });
  /* relatório resumido do fornecedor: uma página, com os mesmos pontos da base */
  function rptResumo(id){
    const s = supById(id); if (!s) return; if (!rptAllowed()){ toast("Relatório não liberado pelo administrador."); return; }
    const R = resumoForn(s), {r, g, rev} = R, st = situacaoAnalise(s), P = KTPdf(), NAVY = [1, 31, 75], MUT = [90, 101, 120], N = `KinseyTec – ${SEG_NOME}`, par = R.par;
    P.page(); P.rect(0, 0, P.W, 86, NAVY); P.text(P.M, 30, N + " · Relatório resumido de pontos do fornecedor", 10, true, [127, 184, 230]);
    P.wrap(fixMoji(s.nome), 16, true, P.CW).slice(0, 2).forEach((l, i) => P.text(P.M, 54 + i * 19, l, 16, true, [255, 255, 255])); P.y = 100;
    P.table([{t: "Nível", w: .14}, {t: "CNPJ/CPF", w: .22}, {t: "Local", w: .22}, {t: "Vende para", w: .22}, {t: "Risco", w: .2}], [[`${s.nivel} · ${LV_NOME[s.nivel]}`, s.doc || "—", [s.municipio, s.uf].filter(Boolean).join("/") || "—", par ? fixMoji(par.nome) : (s.nivel === "N1" ? CLI().nome : "—"), {t: `${RPT_LV[r.level]} · ${r.score} pt`, b: true, c: COR[r.level]}]], {size: 8.3});
    P.ensure(30); P.rect(P.M, P.y, P.CW, 24, st.cod === "concluida" ? [230, 245, 234] : [255, 244, 222]); P.text(P.M + 8, P.y + 15.5, st.txt.slice(0, 120), 8.8, true, st.cod === "concluida" ? [30, 100, 50] : [140, 84, 0]); P.y += 32;
    grafBarras(P, "Andamento da análise", g.P.map(p => [p.l, p.pct ?? 0, corPct(p.pct ?? 0), p.pct == null ? "—" : `${p.pct}%`]), {max: 100});
    const pts = r.reasons.slice().sort((a, b) => b.pts - a.pts).slice(0, 6);
    P.h2(`Principais pontos (${pts.length} de ${r.reasons.length})`);
    if (pts.length) P.table([{t: "Ponto", w: .52}, {t: "Pt", w: .06}, {t: "Recomendação", w: .42}], pts.map(x => { const ru = RPT_REC.find(([re]) => re.test(x.crit + " " + x.txt)) || RPT_DEF; return [rptLabel(x.crit, x.txt), {t: String(x.pts), b: true, c: x.pts >= 4 ? COR.alto : x.pts >= 2 ? COR.medio : COR.baixo}, ru[1]]; }), {size: 7.8});
    else P.para("Nenhum ponto de risco identificado até a data-base.", {size: 9});
    P.h2("Revisões"); rev.forEach(t => P.para("• " + t, {size: 8.8, gap: 1})); P.y += 4;
    P.para(`Data-base ${new Date().toLocaleDateString("pt-BR")}. Resumo gerado automaticamente com as mesmas informações do relatório completo do fornecedor e do relatório geral. Referências normativas não substituem o parecer do advogado responsável.`, {size: 7.8, color: MUT});
    const bytes = P.out(`${N} · Relatório resumido · ${fixMoji(s.nome)}`, `${N} · Relatório resumido · ${fixMoji(s.nome)} · Confidencial`, false);
    rptSave(bytes, `KinseyTec_${limpaNome(SEG_NOME).replace(/\s+/g, "_")}_resumo_${s.nivel}_${limpaNome(s.nome).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`, "application/pdf").then(() => toast("Relatório resumido gerado"));
  }
  function rptFornecedor(id){
    const s = supById(id); if (!s) return; RK.clear();
    if (!rptAllowed()){ toast("Relatório não liberado pelo administrador."); return; }
    const P = KTPdf(), r = rk(s), g = progresso(s), NAVY = [1, 31, 75], MUT = [90, 101, 120], par = s.parentId ? supById(s.parentId) : null, N = `KinseyTec – ${SEG_NOME}`;
    P.page(); P.rect(0, 0, P.W, 96, NAVY); P.text(P.M, 34, N + (g.total < 100 ? " · Relatório prévio de pontos por fornecedor (análise " + g.total + "% concluída)" : " · Relatório de pontos por fornecedor"), 10, true, [127, 184, 230]);
    P.wrap(fixMoji(s.nome), 17, true, P.CW).slice(0, 2).forEach((l, i) => P.text(P.M, 58 + i * 20, l, 17, true, [255, 255, 255]));
    P.y = 112;
    P.table([{t: "Nível", w: .12}, {t: "CNPJ/CPF", w: .2}, {t: "Local", w: .2}, {t: "Vende para", w: .28}, {t: "Risco", w: .2}],
      [[`${s.nivel} · ${LV_NOME[s.nivel]}`, s.doc || "—", [s.municipio, s.uf].filter(Boolean).join("/") || "—", par ? fixMoji(par.nome) : (s.nivel === "N1" ? CLI().nome : "—"), {t: `${RPT_LV[r.level]} · ${r.score} pt`, b: true, c: COR[r.level]}]], {size: 8.3});
    P.para(`Data-base: ${new Date().toLocaleDateString("pt-BR")}. Classificação ${r.manual ? "do analista" : "automática pela matriz de risco"}: alto a partir de 6 pontos, médio de 3 a 5, baixo abaixo de 3. Andamento da análise: ${g.total}%.`, {size: 8.8, color: MUT});
    { const st = situacaoAnalise(s); if (st.cod !== "concluida"){ P.ensure(30); P.rect(P.M, P.y, P.CW, 24, [255, 244, 222]); P.text(P.M + 8, P.y + 15.5, st.txt.slice(0, 120), 8.8, true, [140, 84, 0]); P.y += 32; } }
    const crit = new Map(); r.reasons.forEach(x => crit.set(x.crit, (crit.get(x.crit) || 0) + x.pts));
    if (crit.size) grafBarras(P, "Pontos de risco por critério", [...crit.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => [c, v, v >= 4 ? COR.alto : v >= 2 ? COR.medio : COR.baixo, v + " pt"]));
    grafBarras(P, "Andamento da análise", g.P.map(p => [p.l, p.pct ?? 0, corPct(p.pct ?? 0), p.pct == null ? "—" : `${p.pct}% (${p.feito}/${p.tot})`]), {max: 100});
    P.h2(`Pontos identificados (${r.reasons.length})`);
    if (r.reasons.length) P.table([{t: "Critério", w: .17}, {t: "Ponto", w: .33}, {t: "Pt", w: .06}, {t: "Recomendação", w: .28}, {t: "Norma", w: .16}],
      r.reasons.slice().sort((a, b) => b.pts - a.pts).map(x => { const ru = RPT_REC.find(([re]) => re.test(x.crit + " " + x.txt)) || RPT_DEF; return [x.crit, rptLabel(x.crit, x.txt), {t: String(x.pts), b: true, c: x.pts >= 4 ? COR.alto : x.pts >= 2 ? COR.medio : COR.baixo}, ru[1], ru[2]]; }), {size: 7.6});
    else P.para("Nenhum ponto de risco identificado até a data-base.", {size: 9});
    const dl = DOCS[s.nivel] || [], d = s.docs || {}, ob = s.docsObs || {}, SIT = {ok: "Conferido", ress: "Com ressalva", pend: "Pendente", na: "N/A", "": "Não avaliado"};
    const cont = ["ok", "ress", "pend", "na", ""].map(k => [SIT[k], dl.filter((_, i) => (d["d" + i] || "") === k).length, {ok: COR.baixo, ress: COR.medio, pend: COR.alto, na: COR.pend, "": [180, 188, 200]}[k]]).filter(x => x[1]);
    grafBarras(P, "Documentos do checklist", cont.map(([l, n, c]) => [l, n, c, `${n} de ${dl.length}`]), {max: dl.length || 1});
    P.table([{t: "Documento", w: .36}, {t: "Situação", w: .14}, {t: "Comentário", w: .5}], dl.map((t, i) => [t, {t: SIT[d["d" + i] || ""], b: true, c: d["d" + i] === "ress" ? COR.medio : d["d" + i] === "pend" || !d["d" + i] ? COR.alto : COR.baixo}, ob["d" + i]?.txt || ""]), {size: 7.6});
    const v = s.invest || {}; P.h2("Investigação");
    P.table([{t: "Consulta", w: .4}, {t: "Resposta", w: .13}, {t: "Observação / fonte", w: .47}], [["Situação cadastral do CNPJ", v.situacao || "Não consultado", s.receita?.fonte || ""], ...INV.map(([id, l, tipo]) => { const x = v[id] || {}; return [l, {t: tipo === "num" ? (x.v || "—") : x.v === "sim" ? "Sim" : x.v === "nao" ? "Não" : "Não consultado", b: x.v === "sim", c: x.v === "sim" ? COR.alto : undefined}, x.n || ""]; })], {size: 7.4});
    const J = itensJuridicos().filter(x => x.s.id === s.id), cts = S.contracts.filter(k => k.supplierId === s.id);
    P.h2("Jurídico");
    P.para(`NDA e termo LGPD: ${s.nda?.validado ? "aceito e validado" : s.nda?.aceito ? "aceito, aguardando validação" : "sem aceite"}. Contratos: ${cts.length} (${cts.filter(k => S.pareceres[k.id]).length} com parecer).`, {size: 8.8});
    if (J.length) P.table([{t: "Item", w: .2}, {t: "Classificação", w: .16}, {t: "Análise", w: .44}, {t: "Advogado (OAB)", w: .2}], J.map(x => [x.item, {t: x.cl, b: true}, String(x.texto || "").replace(/\s+/g, " ").slice(0, 400), x.adv ? `${x.adv.nome} · ${x.adv.oab || ""}` : "—"]), {size: 7.6});
    const ks = filhos(s); if (ks.length){ P.h2("Cadeia abaixo deste fornecedor");
      const linhas = []; const walk = (k, nv) => { const rr = rk(k); linhas.push([`${"  ".repeat(nv)}${k.nivel} · ${fixMoji(k.nome)}`, [k.municipio, k.uf].filter(Boolean).join("/"), {t: RPT_LV[rr.level], b: true, c: COR[rr.level]}, mot(rr, 1)[0] || ""]); filhos(k).forEach(x => walk(x, nv + 1)); }; ks.forEach(k => walk(k, 0));
      P.table([{t: "Fornecedor", w: .34}, {t: "Local", w: .16}, {t: "Risco", w: .12}, {t: "Principal motivo", w: .38}], linhas, {size: 7.6}); P.para(`Exposição da cadeia: ${RPT_LV[exposicao(s).lv]}.`, {size: 8.8, bold: true}); }
    const nn = noticias(s); if (nn.length){ P.h2("Notícias públicas no local de operação"); nn.slice(0, 5).forEach(({n}) => P.para(`${n[0]} · ${n[1]}. ${n[2]}${n[3] ? " Fonte: " + n[3] : ""}`, {size: 8.2, gap: 3})); }
    P.para("Referências normativas apoiam a análise e não substituem o parecer do advogado responsável. O relatório reflete as informações disponíveis na data-base.", {size: 8, color: MUT});
    const bytes = P.out(`${N} · Relatório de pontos · ${fixMoji(s.nome)}`, `${N} · Relatório de pontos · ${fixMoji(s.nome)} · Confidencial`, false);
    rptSave(bytes, `KinseyTec_${limpaNome(SEG_NOME).replace(/\s+/g, "_")}_relatorio_${s.nivel}_${limpaNome(s.nome).replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`, "application/pdf").then(() => toast("Relatório do fornecedor gerado"));
  }

  /* ---------- rastreio da origem pelas notas fiscais ---------- */
  const dd = v => String(v || "").replace(/\D/g, "");
  /* período: 1º de janeiro do ano em análise até o fim do último mês com nota emitida */
  function periodoAno(){
    let A = null; try{ A = OPS.analise(); }catch(e){}
    const em = (A ? A.R : []).filter(x => x.nf.situacao !== "cancelada").map(x => String(x.nf.emissao || "").slice(0, 10)).filter(Boolean).sort();
    const hoje = new Date(), anoAtual = hoje.getFullYear(), doAno = em.filter(d => +d.slice(0, 4) === anoAtual), ult = doAno.length ? doAno[doAno.length - 1] : em.length ? em[em.length - 1] : "";
    const ano = ult ? +ult.slice(0, 4) : anoAtual;
    let ate; if (ult){ const y = +ult.slice(0, 4), m = +ult.slice(5, 7); ate = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); }
    else ate = new Date(Date.UTC(anoAtual, hoje.getMonth(), 0)).toISOString().slice(0, 10);
    return {de: `${ano}-01-01`, ate};
  }
  function movimento(de, ate){
    let A = null; try{ A = OPS.analise(); }catch(e){ return []; }
    return A.R.filter(x => x.nf.situacao !== "cancelada" && (!de || String(x.nf.emissao || "") >= de) && (!ate || String(x.nf.emissao || "").slice(0, 10) <= ate)).map(x => ({x, vend: dd(x.forn.doc), comp: dd(x.nf.tp === "0" ? x.nf.emitDoc : x.nf.destDoc), sup: x.sup, kg: x.kg || 0, v: x.nf.vNF || 0, nome: x.forn.nome || x.nf.emitNome || ""}));
  }
  function rastreio(id, de, ate){
    const M = movimento(de, ate), raiz = supById(id); if (!raiz) return null;
    const no = (s, prof, vistos) => {
      const doc = dd(s.doc), vend = M.filter(m => (m.sup && m.sup.id === s.id) || (doc && m.vend === doc)), comp = M.filter(m => doc && m.comp === doc && !(m.sup && m.sup.id === s.id));
      const g = new Map(); comp.forEach(m => { const k = m.sup ? "s:" + m.sup.id : "d:" + m.vend; const o = g.get(k) || {sup: m.sup, doc: m.vend, nome: m.sup ? m.sup.nome : m.nome, kg: 0, v: 0, n: 0}; o.kg += m.kg; o.v += m.v; o.n++; g.set(k, o); });
      const kgV = vend.reduce((t, m) => t + m.kg, 0), kgC = comp.reduce((t, m) => t + m.kg, 0), al = [];
      if (s.nivel === "N3"){ if (vend.length) al.push({sev: "info", t: "Origem do material: conferir o documento de origem (nota de sucata industrial, contrato de demolição, arremate de leilão) e a inspeção no local"}); }
      else if (vend.length && kgV > kgC * 1.05 && kgV - kgC > 1) al.push({sev: "alto", t: `Vendeu ${fmt(kgV / 1000, 1)} t e comprou ${fmt(kgC / 1000, 1)} t com nota: ${fmt((kgV - kgC) / 1000, 1)} t sem origem comprovada por nota no período`});
      if (!vend.length && comp.length) al.push({sev: "info", t: "Comprou no período, sem venda registrada nas notas importadas"});
      const filhos = [...g.values()].sort((a, b) => b.kg - a.kg).map(o => {
        const f = {sup: o.sup, doc: o.doc, nome: o.sup ? o.sup.nome : (o.nome || "Fornecedor fora da cadeia"), kg: o.kg, v: o.v, n: o.n, alertas: [], filhos: []};
        if (!o.sup) f.alertas.push({sev: "medio", t: "Vende a este fornecedor e não está cadastrado na cadeia: incluir pelo mapeamento automático"});
        else { if (o.sup.parentId && o.sup.parentId !== s.id) f.alertas.push({sev: "baixo", t: `Cadastrado vendendo para ${supById(o.sup.parentId)?.nome || "outro fornecedor"}`});
          const r = rk(o.sup); if (r.level === "alto") f.alertas.push({sev: "alto", t: "Fornecedor em risco alto"});
          if (prof < 3 && !vistos.has(o.sup.id)){ const sub = no(o.sup, prof + 1, new Set([...vistos, o.sup.id])); f.filhos = sub.filhos; f.alertas.push(...sub.alertas); f.kgC = sub.kgC; f.kgV = sub.kgV; } }
        return f; });
      return {kgV, vV: vend.reduce((t, m) => t + m.v, 0), nV: vend.length, kgC, filhos, alertas: al};
    };
    return {raiz, de, ate, ...no(raiz, 1, new Set([raiz.id]))};
  }
  const COR_SEV = {alto: "var(--bad)", medio: "var(--warn)", baixo: "var(--muted)", info: "var(--muted)"};
  function rastreioHtml(R){
    if (!R) return "";
    const al = L => L.map(a => `<div style="font-size:12px;color:${COR_SEV[a.sev]}">• ${esc(a.t)}</div>`).join("");
    const linha = (f, nv) => `<div style="margin-left:${nv * 18}px;border-left:2px solid var(--line);padding:4px 0 4px 10px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:baseline">${f.sup ? `<span class="lvtag">${f.sup.nivel}</span><button type="button" class="lk" data-rso="${f.sup.id}" style="background:none;border:0;color:var(--fog);font:inherit;font-weight:600;cursor:pointer;padding:0">${esc(f.sup.nome)}</button>${tag(rk(f.sup).level)}` : `<span class="lvtag" style="color:var(--warn)">?</span><b>${esc(f.nome)}</b> <span class="mono" style="font-size:11px">${esc(f.doc)}</span>`}
          <span class="sub" style="margin:0;font-size:12px">vendeu ${fmt(f.kg / 1000, 2)} t · ${brlV(f.v)} · ${f.n} nota(s)</span></div>${al(f.alertas)}</div>${f.filhos.map(c => linha(c, nv + 1)).join("")}`;
    return `<div style="display:flex;flex-direction:column;gap:4px">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:baseline"><span class="lvtag">${R.raiz.nivel}</span><b>${esc(R.raiz.nome)}</b>${tag(rk(R.raiz).level)}<span class="sub" style="margin:0;font-size:12px">vendeu ${fmt(R.kgV / 1000, 2)} t · ${brlV(R.vV)} · ${R.nV} nota(s) · comprou ${fmt(R.kgC / 1000, 2)} t com nota</span></div>${al(R.alertas)}
      ${R.filhos.length ? R.filhos.map(f => linha(f, 1)).join("") : `<p class="sub" style="margin:4px 0 0">Nenhuma nota de compra deste fornecedor no período (importe as notas de entrada dele, ou as notas emitidas pelos seus fornecedores).</p>`}</div>`;
  }
  const brlV = v => "R$ " + fmt(v || 0, 2);
  function linhasRastreio(R){ const out = []; const walk = (f, nv, pai) => { out.push([R.raiz.nome, nv, f.sup ? f.sup.nivel : "?", f.sup ? f.sup.nome : f.nome, f.sup ? f.sup.doc : f.doc, pai, (f.kg / 1000).toFixed(3).replace(".", ","), String(f.v.toFixed(2)).replace(".", ","), f.n, f.sup ? RISK_LABEL[rk(f.sup).level] : "fora da cadeia", f.alertas.map(a => a.t).join(" | ")]); f.filhos.forEach(c => walk(c, nv + 1, f.sup ? f.sup.nome : f.nome)); };
    out.push([R.raiz.nome, 0, R.raiz.nivel, R.raiz.nome, R.raiz.doc, "(vendas no período)", (R.kgV / 1000).toFixed(3).replace(".", ","), String(R.vV.toFixed(2)).replace(".", ","), R.nV, RISK_LABEL[rk(R.raiz).level], R.alertas.map(a => a.t).join(" | ")]);
    R.filhos.forEach(f => walk(f, 1, R.raiz.nome)); return out; }
  S.rsF = S.rsF || {};
  function cardRastreio(fixo){
    const el = document.createElement("div"); el.className = "card"; el.id = "rastreio"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    const per = periodoAno(), de = S.rsF.de || per.de, ate = S.rsF.ate || per.ate;
    const cand = S.suppliers.slice().sort((a, b) => a.nivel.localeCompare(b.nivel) || fixMoji(a.nome || "").localeCompare(fixMoji(b.nome || ""), "pt")), sel = fixo || S.rsF.id || (cand.find(x => x.nivel === "N1") || cand[0])?.id;
    const R = sel ? rastreio(sel, de, ate) : null;
    el.innerHTML = `<div><div class="eyebrow">Notas fiscais de compra e venda · N1 ← N2 ← N3</div><h3>Rastreio da origem pelas notas</h3>
        <p class="sub" style="margin:4px 0 0">Liga as notas de venda e de compra de cada elo pelo CNPJ/CPF: de quem o fornecedor comprou, quanto (t e R$) e de quem esses compraram. Período do ano em análise: de 1º de janeiro até o fim do último mês com nota emitida. Aponta venda maior que compra (origem sem nota), quem vende sem estar na cadeia e elos de risco alto, para conferir com documentos e inspeção no local.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end">${fixo ? "" : `<div class="fld" style="flex:2 1 240px"><label for="rs-s">Fornecedor</label><select id="rs-s">${cand.map(x => `<option value="${x.id}" ${x.id === sel ? "selected" : ""}>${x.nivel} · ${esc(x.nome)}</option>`).join("")}</select></div>`}
        <div class="fld" style="flex:1 1 140px"><label for="rs-de">De</label><input type="date" id="rs-de" value="${esc(de)}"></div><div class="fld" style="flex:1 1 140px"><label for="rs-ate">Até</label><input type="date" id="rs-ate" value="${esc(ate)}"></div>
        <button type="button" class="btn sm ghost" id="rs-ano">Ano em análise</button><button type="button" class="btn sm" id="rs-csv">Exportar para Excel</button></div>
      <div id="rs-out">${rastreioHtml(R)}</div>`;
    const re = () => { S.rsF.de = $("#rs-de", el).value; S.rsF.ate = $("#rs-ate", el).value; if (!fixo) S.rsF.id = $("#rs-s", el).value; const n = cardRastreio(fixo); el.replaceWith(n); };
    ["#rs-s", "#rs-de", "#rs-ate"].forEach(i => { const e = $(i, el); if (e) e.onchange = re; });
    $("#rs-ano", el).onclick = () => { S.rsF.de = ""; S.rsF.ate = ""; const n = cardRastreio(fixo); el.replaceWith(n); };
    $("#rs-csv", el).onclick = () => { if (R) baixarCSV("rastreio_notas_" + limpaNome(R.raiz.nome).replace(/\s+/g, "_"), ["Cadeia de", "Profundidade", "Nível", "Fornecedor", "CNPJ/CPF", "Vende para", "Toneladas", "Valor (R$)", "Notas", "Risco", "Apontamentos"], linhasRastreio(R)); };
    $$("[data-rso]", el).forEach(b => b.onclick = () => openSupplier(b.dataset.rso, "risco"));
    return el;
  }
  /* Auditoria · Operações comerciais */
  const _opsV = EXT_VIEWS.operacoes;
  if (_opsV) EXT_VIEWS.operacoes = function(){ _opsV.apply(this, arguments); const host = $("#operacoes"); if (!host || typeof OPS === "undefined") return; RK.clear();
    const c = host.querySelector("#fcot2")?.closest(".card") || host.querySelector(".stats"); const el = cardRastreio(); if (c) c.after(el); else host.appendChild(el); };
  /* dossiê · Testes: rastreio do próprio fornecedor */
  const _rsb2 = renderSupBody;
  renderSupBody = function(){ _rsb2.apply(this, arguments); if (S.supTab !== "testes" || typeof OPS === "undefined") return; const b = $("#sup-body"); if (!b || $("#rastreio", b)) return; RK.clear(); b.appendChild(cardRastreio(S.openSup)); };

  /* ---------- consulta rápida: resumo do fornecedor, relatório prévio e WhatsApp ---------- */
  function resumoForn(s){
    RK.clear(); const r = rk(s), g = progresso(s), par = s.parentId ? supById(s.parentId) : null, J = itensJuridicos().filter(x => x.s.id === s.id);
    const top = r.reasons.slice().sort((a, b) => b.pts - a.pts).slice(0, 5).map(x => rptLabel(x.crit, x.txt));
    const docs = g.P.find(p => p.k === "docs"), jur = g.P.find(p => p.k === "jur"), e = exposicao(s);
    const rev = [jur && jur.feito ? `Jurídico: ${jur.feito} de ${jur.tot} parecer(es)/NDA concluído(s)` : "Jurídico: sem parecer ainda", docs ? `Documentos: ${docs.feito} de ${docs.tot} conferidos` : "", J.length ? `${J.length} ressalva(s)/consideração(ões) do Jurídico` : "", s.classificacao?.nivel ? "Risco revisado pelo analista" : "Risco calculado automaticamente"].filter(Boolean);
    return {s, r, g, par, top, rev, e, J};
  }
  function situacaoAnalise(s){
    const g = progresso(s), insp = Object.values(s.insp || {}).some(v => v && v.v), par = S.contracts.some(k => k.supplierId === s.id && S.pareceres[k.id]) || S.evidences.some(e => e.supplierId === s.id && e.parecerDoc),
      man = Object.values(s.docsObs || {}).some(o => o && o.manual) || Object.values(s.invest || {}).some(v => v && v.manual) || !!s.classificacao?.nivel || (s.juridico || s.jurConsid || []).length;
    if (g.total >= 100) return {cod: "concluida", txt: "Análise concluída: auditoria, documentos e Jurídico revisados."};
    if (insp || par || man) return {cod: "andamento", txt: `Fornecedor em inspeção de auditoria e investigação jurídica (análise ${g.total}% concluída). Os pontos podem mudar até a conclusão.`};
    return {cod: "previa", txt: "Análise prévia, sujeita a auditoria, monitoramento e compliance jurídica."};
  }
  function textoResumo(R){
    const {s, r, g, par, top, rev, e} = R, st = situacaoAnalise(s);
    const L = [`*KinseyTec – ${SEG_NOME} · consulta do fornecedor*`, `${fixMoji(s.nome)} (${s.nivel} · ${LV_NOME[s.nivel]})`, [s.doc ? "CNPJ/CPF " + s.doc : "", [s.municipio, s.uf].filter(Boolean).join("/")].filter(Boolean).join(" · "),
      `*${RISK_LABEL[r.level].toUpperCase()}* (${r.score} pontos)${e.lv === "alto" && r.level !== "alto" ? " · risco alto abaixo na cadeia" : ""}`, st.txt,
      top.length ? "*Principais riscos para a compra:*" : "Sem pontos de risco identificados até agora.", ...top.slice(0, 5).map(t => "• " + t.slice(0, 140)),
      "*Revisões:*", ...rev.slice(0, 3).map(t => "• " + t), par ? `Vende para: ${fixMoji(par.nome)}` : "", `${new Date().toLocaleDateString("pt-BR")} · Confidencial · resumo automático do sistema`].filter(x => x !== "");
    return L.slice(0, 20).join("\n");
  }
  async function analiseCnpj(doc){
    const d = dd(doc), tmp = {id: "consulta-" + d, nivel: "N1", nome: "", doc, municipio: "", uf: "", volume: ""}, A = [], add = (sev, crit, t, pts) => A.push({sev, crit, txt: t, pts});
    let rc = null; try{ rc = await ORG.receita(d); }catch(e){ rc = {erro: e.message || "indisponível"}; }
    if (rc && !rc.erro){ tmp.receita = rc; tmp.nome = rc.razao || ""; tmp.municipio = rc.municipio || ""; tmp.uf = rc.uf || "";
      if (rc.situacao && rc.situacao !== "ATIVA") add("alto", "Receita Federal", `CNPJ com situação ${rc.situacao}`, 6);
      if (rc.abertura){ const anos = (Date.now() - new Date(rc.abertura + "T12:00").getTime()) / (365.25 * 864e5); if (anos < 2) add("medio", "Perfil societário", `Empresa aberta há ${anos < 1 ? "menos de 1 ano" : fmt(anos, 1) + " anos"} (${rc.abertura.split("-").reverse().join("/")})`, 2); }
      ORG.achadosReceita({...tmp, nome: rc.razao}).forEach(a => add(a.sev, "Receita Federal", a.txt, a.sev === "alto" ? 6 : a.sev === "medio" ? 3 : 1));
      if (!(rc.socios || []).length) add("baixo", "Perfil societário", "Quadro societário não informado pela Receita", 1); }
    else add("info", "Receita Federal", `Consulta indisponível no momento (${rc?.erro || "sem resposta"}): confirmar com o cartão CNPJ`, 0);
    let L = null; try{ L = await ORG.verificar(tmp); }catch(e){}
    if (L) (L.achados || []).forEach(a => add("alto", "Listas oficiais", `${a.quem} ${a.nome || ""} consta em ${a.rotulo}`, a.base === "lista_suja" ? 6 : 4));
    const score = A.reduce((t, a) => t + a.pts, 0), level = score >= 6 ? "alto" : score >= 3 ? "medio" : "baixo";
    return {doc: d, rc, listas: L, A, score, level};
  }
  function textoCnpj(X){
    const rc = X.rc && !X.rc.erro ? X.rc : null, docF = X.doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    return [`*KinseyTec – ${SEG_NOME} · consulta de CNPJ*`, rc ? fixMoji(rc.razao) : "CNPJ " + docF, `CNPJ ${docF}${rc ? " · " + [rc.municipio, rc.uf].filter(Boolean).join("/") : ""}`, rc ? `Situação: ${rc.situacao || "—"} · aberta em ${(rc.abertura || "").split("-").reverse().join("/") || "—"}` : "",
      rc ? `Atividade: ${(rc.cnae || "") + " " + (rc.cnaeDesc || "")}`.slice(0, 140) : "", `*RISCO PRÉVIO: ${RISK_LABEL[X.level].toUpperCase()}* (${X.score} pontos)`, "Análise prévia, sujeita a auditoria, monitoramento e compliance jurídica.",
      X.A.filter(a => a.sev !== "info").length ? "*Pontos encontrados:*" : "Nenhum ponto de risco nas consultas automáticas.", ...X.A.filter(a => a.sev !== "info").slice(0, 6).map(a => "• " + a.txt.slice(0, 140)),
      X.listas ? "Listas oficiais verificadas (empresa e sócios)." : "Listas oficiais: verificação indisponível.", `${new Date().toLocaleDateString("pt-BR")} · Confidencial · consulta automática`].filter(Boolean).slice(0, 20).join("\n");
  }
  function pdfCnpj(X){
    if (!rptAllowed()){ toast("Relatório não liberado pelo administrador."); return; }
    const P = KTPdf(), NAVY = [1, 31, 75], MUT = [90, 101, 120], rc = X.rc && !X.rc.erro ? X.rc : null, N = `KinseyTec – ${SEG_NOME}`, docF = X.doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    P.page(); P.rect(0, 0, P.W, 96, NAVY); P.text(P.M, 34, N + " · Relatório prévio · consulta de CNPJ", 10, true, [127, 184, 230]);
    P.wrap(rc ? fixMoji(rc.razao) : "CNPJ " + docF, 17, true, P.CW).slice(0, 2).forEach((l, i) => P.text(P.M, 58 + i * 20, l, 17, true, [255, 255, 255])); P.y = 112;
    P.ensure(30); P.rect(P.M, P.y, P.CW, 24, [255, 244, 222]); P.text(P.M + 8, P.y + 15.5, "Análise prévia, sujeita a auditoria, monitoramento e compliance jurídica.", 8.8, true, [140, 84, 0]); P.y += 32;
    P.table([{t: "CNPJ", w: .22}, {t: "Situação", w: .14}, {t: "Abertura", w: .14}, {t: "Local", w: .25}, {t: "Risco prévio", w: .25}], [[docF, rc?.situacao || "—", (rc?.abertura || "").split("-").reverse().join("/") || "—", rc ? [rc.municipio, rc.uf].filter(Boolean).join("/") : "—", {t: `${RPT_LV[X.level]} · ${X.score} pt`, b: true, c: COR[X.level]}]], {size: 8.3});
    if (rc){ P.h2("Receita Federal"); P.table([{t: "Campo", w: .25}, {t: "Informação", w: .75}], [["Razão social", rc.razao || "—"], ["Nome fantasia", rc.fantasia || "—"], ["Atividade principal", `${rc.cnae || ""} ${rc.cnaeDesc || ""}`], ["Atividades secundárias", (rc.cnaesSec || []).slice(0, 8).join("; ") || "—"], ["Natureza · porte", `${rc.natureza || "—"} · ${rc.porte || "—"}`], ["Capital social", "R$ " + fmt(rc.capital || 0, 2)], ["Endereço", rc.endereco || "—"], ["Sócios", (rc.socios || []).map(q => `${q.nome} (${q.qual || ""})`).join("; ") || "—"]], {size: 8}); }
    P.h2("Pontos encontrados nas consultas automáticas");
    if (X.A.length) P.table([{t: "Origem", w: .2}, {t: "Ponto", w: .62}, {t: "Pt", w: .08}, {t: "Nível", w: .1}], X.A.map(a => [a.crit, a.txt, String(a.pts), {t: a.sev === "info" ? "Info" : RPT_LV[a.sev] || a.sev, b: true, c: COR[a.sev] || MUT}]), {size: 8});
    else P.para("Nenhum ponto de risco nas consultas automáticas.", {size: 9});
    P.para(`Listas oficiais (Cadastro de Empregadores do MTE, CEIS, CNEP e embargos do IBAMA): ${X.listas ? "verificadas para a empresa e os sócios" : "verificação indisponível no momento"}.`, {size: 8.8});
    P.para("Próximos passos: cadastrar o fornecedor na cadeia, enviar o questionário pelo Portal do Fornecedor, solicitar os documentos (contrato social, certidões, licenças), inspeção no local e parecer do Jurídico.", {size: 8.8, color: MUT});
    const bytes = P.out(`${N} · Relatório prévio · CNPJ ${docF}`, `${N} · Relatório prévio · CNPJ ${docF} · Confidencial`, false);
    rptSave(bytes, `KinseyTec_${limpaNome(SEG_NOME).replace(/\s+/g, "_")}_consulta_CNPJ_${X.doc}_${new Date().toISOString().slice(0, 10)}.pdf`, "application/pdf").then(() => toast("Relatório prévio gerado"));
  }
  async function consultaCnpj(doc){
    const d = dd(doc), ja = S.suppliers.find(x => dd(x.doc) === d); if (ja) return consultaRapida(ja.id);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Consulta de CNPJ · fornecedor fora do sistema</div><h2>Consultando…</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="sheet-b"><p class="sub">Receita Federal, listas oficiais e atividade da empresa.</p></div>`);
    const X = await analiseCnpj(d), rc = X.rc && !X.rc.erro ? X.rc : null, txt = textoCnpj(X), docF = d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
    if (!$("#layer .sheet")) return;
    /* pré-cadastro automático: o fornecedor entra na base e passa por todas as análises automáticas */
    if (Store.me.canWrite !== false){ const id = uid(), c = UF_CENTER[rc?.uf] || [-15.8, -47.9];
      await Store.set("suppliers", id, {nivel: "N1", tipo: (SUP_TYPES.N1 || [""])[0], parentId: "", nome: rc?.razao || "CNPJ " + docF, doc: docF, ie: "", abertura: rc?.abertura || "", volume: "", uf: rc?.uf || "", municipio: rc?.municipio || "", lat: c[0] + (Math.random() - .5) * .3, lng: c[1] + (Math.random() - .5) * .3, coordAprox: true,
        receita: rc ? {...rc, em: nowISO()} : null, ...(X.listas ? {listas: X.listas} : {}), answers: {}, docs: {}, insp: {}, balanco: {}, invest: {}, origem: "Consulta de CNPJ (pré-cadastro)", preCadastro: true, nomeProvisorio: !rc, criadoEm: nowISO(), criadoPor: Store.me.id || ""});
      close(); toast("Fornecedor pré-cadastrado como N1 e analisado automaticamente: ajuste o nível e o comprador em Editar", 6000);
      setTimeout(() => { renderAll(); setTimeout(() => consultaRapida(id), 600); }, 400); return; }
    $("#layer .sheet").innerHTML = `<div class="sheet-h"><div><div class="eyebrow">Consulta de CNPJ · fornecedor fora do sistema</div><h2>${esc(rc ? rc.razao : "CNPJ " + docF)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${tag(X.level, "Risco prévio: " + RISK_LABEL[X.level])}<span class="mono" style="font-size:12px">${X.score} pontos</span><span class="sub" style="margin:0">${docF}${rc ? " · " + esc([rc.municipio, rc.uf].filter(Boolean).join("/")) + " · " + esc(rc.situacao || "") : ""}</span></div>
        <div class="card" style="border-color:var(--warn)"><p style="margin:0;color:var(--warn);font-size:13px">Análise prévia, sujeita a auditoria, monitoramento e compliance jurídica. O fornecedor ainda não está cadastrado na cadeia.</p></div>
        ${rc ? `<div class="card" style="display:flex;flex-direction:column;gap:4px;font-size:13px"><div><b>Atividade:</b> ${esc((rc.cnae || "") + " " + (rc.cnaeDesc || ""))}</div><div><b>Abertura:</b> ${esc((rc.abertura || "").split("-").reverse().join("/") || "—")} · <b>Sócios:</b> ${(rc.socios || []).length}</div></div>` : ""}
        <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Pontos encontrados</h3>${X.A.length ? `<ul style="margin:0;padding-left:18px;font-size:13px;display:flex;flex-direction:column;gap:3px">${X.A.map(a => `<li style="color:${COR_SEV[a.sev] || "inherit"}">${esc(a.txt)}</li>`).join("")}</ul>` : `<p class="sub" style="margin:0">Nenhum ponto de risco nas consultas automáticas.</p>`}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
          <button type="button" class="btn primary" id="cc-pdf">Relatório prévio (PDF)</button>
          <a class="btn" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener" style="justify-content:center">Resumo (até 20 linhas) por WhatsApp</a>
          ${navigator.share ? `<button type="button" class="btn" id="cc-sh">Compartilhar</button>` : ""}<button type="button" class="btn ghost" id="cc-cp">Copiar resumo</button>
          ${Store.me.canWrite !== false ? `<button type="button" class="btn ghost" id="cc-cad">Cadastrar na cadeia</button>` : ""}</div></div>`;
    $$("#layer [data-x]").forEach(b => b.onclick = close);
    $("#cc-pdf").onclick = () => pdfCnpj(X);
    const sh = $("#cc-sh"); if (sh) sh.onclick = () => navigator.share({title: "CNPJ " + docF, text: txt.replace(/\*/g, "")}).catch(() => {});
    $("#cc-cp").onclick = () => { try{ navigator.clipboard.writeText(txt.replace(/\*/g, "")).then(() => toast("Resumo copiado")); }catch(e){} };
    const cad = $("#cc-cad"); if (cad) cad.onclick = async () => { const id = uid(), c = UF_CENTER[rc?.uf] || [-15.8, -47.9];
      await Store.set("suppliers", id, {nivel: "N1", tipo: (SUP_TYPES.N1 || [""])[0], parentId: "", nome: rc?.razao || "CNPJ " + docF, doc: docF, ie: "", abertura: rc?.abertura || "", volume: "", uf: rc?.uf || "", municipio: rc?.municipio || "", lat: c[0] + (Math.random() - .5) * .3, lng: c[1] + (Math.random() - .5) * .3, coordAprox: true,
        receita: rc ? {...rc, em: nowISO()} : null, answers: {}, docs: {}, insp: {}, balanco: {}, invest: {}, origem: "Consulta de CNPJ", nomeProvisorio: !rc, criadoEm: nowISO(), criadoPor: Store.me.id || ""});
      close(); toast("Fornecedor cadastrado como N1: ajuste o nível em Editar"); setTimeout(() => openSupplier(id, "dados"), 400); };
  }
  function consultaRapida(id){
    const s = supById(id); if (!s) return; const R = resumoForn(s), {r, g, top, rev} = R, txtSeg = typeof window.KT_RESUMO_WA === "function" ? window.KT_RESUMO_WA(s) : null, txt = txtSeg || textoResumo(R);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Consulta rápida · ${s.nivel} · ${esc(LV_NOME[s.nivel])}</div><h2>${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${riskPill(r)}<span class="mono" style="font-size:12px">${r.score} pontos</span><span class="sub" style="margin:0">${esc(s.doc || "sem CNPJ/CPF")} · ${esc([s.municipio, s.uf].filter(Boolean).join("/") || "—")}</span></div>
        <div class="card" style="display:flex;flex-direction:column;gap:6px;${situacaoAnalise(s).cod === "concluida" ? "" : "border-color:var(--warn)"}"><h3 style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">Análise ${barra(g.total, 120)}</h3><p style="margin:0;font-size:13px;${situacaoAnalise(s).cod === "concluida" ? "" : "color:var(--warn)"}">${esc(situacaoAnalise(s).txt)}</p></div>
        <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Principais riscos para a compra</h3>${top.length ? `<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;font-size:13px">${top.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p class="sub" style="margin:0">Nenhum ponto de risco identificado até agora.</p>`}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Revisões</h3><ul style="margin:0;padding-left:18px;font-size:13px">${rev.map(t => `<li>${esc(t)}</li>`).join("")}</ul></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
          <button type="button" class="btn primary" id="cr-res">Relatório resumido (PDF)</button><button type="button" class="btn primary" id="cr-pdf">Relatório completo ${g.total < 100 ? "prévio " : ""}(PDF)</button>
          <a class="btn" id="cr-wa" href="https://wa.me/?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener" style="justify-content:center">${txtSeg ? "Resumo para investidores (WhatsApp)" : "Resumo (até 20 linhas) por WhatsApp"}</a>
          ${navigator.share ? `<button type="button" class="btn" id="cr-sh">Compartilhar</button>` : ""}<button type="button" class="btn ghost" id="cr-cp">Copiar resumo</button>
          <button type="button" class="btn ghost" id="cr-dos">Abrir dossiê completo</button></div>
        ${txtSeg ? `<details><summary class="sub" style="cursor:pointer">Ver o resumo (${txt.split("\n").length} linhas)</summary><pre style="white-space:pre-wrap;font-size:12.5px;margin:8px 0 0">${esc(txt)}</pre></details>` : ""}
        <p class="sub" style="margin:0;font-size:11.5px">${txtSeg ? "Resumo sem identificação da empresa (nome-código), pronto para enviar a investidores antes do NDA." : "O resumo é confidencial: envie apenas a quem participa da decisão de compra."}</p></div>`);
    $("#cr-pdf").onclick = () => rptFornecedor(s.id); $("#cr-res").onclick = () => rptResumo(s.id);
    const sh = $("#cr-sh"); if (sh) sh.onclick = () => navigator.share({title: s.nome, text: txt.replace(/\*/g, "")}).catch(() => {});
    $("#cr-cp").onclick = () => { try{ navigator.clipboard.writeText(txt.replace(/\*/g, "")).then(() => toast("Resumo copiado")); }catch(e){ toast("Não foi possível copiar"); } };
    $("#cr-dos").onclick = () => { close(); openSupplier(s.id, "risco"); };
  }

  const _ra = renderAll;
  renderAll = function(){ _ra.apply(this, arguments); botaoTopo(); setTimeout(corrigirAcentos, 1500); clearTimeout(chkT); chkT = setTimeout(() => { autoChecklist(); autoInvest(); autoQuest(); }, 1200); };
  setTimeout(botaoTopo, 0);
  async function anexar(supId, files, extra){
    let n = 0; for (const f of files){ const r = await lerDoc(f), up = await Store.upload(f, {sup: supId, tipo: r.tipoEv, tipoDoc: r.rotulo || "", nome: f.name});
      await salvarEvid(uid(), {supplierId: supId, tipo: r.tipoEv === A_CLASS ? (evTipo(/^outro$/i) || "Outro") : r.tipoEv, ...up, mime: f.type, nome: f.name, gps: null, distKm: null, takenAt: null, criadoEm: nowISO(), criadoPor: Store.me.id || "", origem: "Importação de documentos", ...(extra || {}), obs: [extra?.obs, r.rotulo ? "identificado: " + r.rotulo : ""].filter(Boolean).join(" · ")}, f); n++; }
    return n;
  }
  return {rptResumo, consultaCnpj, consultaRapida, periodoAno, rastreio, rptFornecedor, progresso, exposicao, noticias, abrirRelatorio, importarSocietario, consideracao, itensJuridicos, anexar, importarLote};
})();
