/* ================= KINSEY CAPITAL · MATCHING, LADO DA OPERAÇÃO, INTERAÇÕES E PIPELINE =================
   - Matching investidor (N1) × target (N3) com pontuação explicada pela tese: segmento, faturamento, EBITDA, ticket
     frente ao valor, região, participação e restrições (eliminatórias).
   - Lado da Kinsey em cada target: vendedor (sell-side) ou comprador (buy-side, com o investidor cliente).
   - Registro de interações (reuniões, ligações, e-mails) com próximo passo e prazo.
   - Pipeline do funil na Base inicial, com próximos passos e importação do mapa. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const REG = {Norte:["AC","AM","AP","PA","RO","RR","TO"], Nordeste:["AL","BA","CE","MA","PB","PE","PI","RN","SE"], "Centro-Oeste":["DF","GO","MT","MS"], Sudeste:["ES","MG","RJ","SP"], Sul:["PR","RS","SC"]};
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const FUNIL = typeof MA_FUNIL !== "undefined" ? MA_FUNIL : [];
  const etapaNome = k => (FUNIL.find(f => f[0] === k) || [k, k || "—"])[1];

  /* ---------------- valores do target ---------------- */
  function numeros(t){
    let rec = t.fin?.receita ? t.fin.receita * 1e6 : null, eb = t.fin?.ebitda ? t.fin.ebitda * 1e6 : null, dl = t.fin?.divLiq != null ? t.fin.divLiq * 1e6 : 0, ev = null, fonte = "informados no cadastro";
    try{ if (D.temBal(t) && window.KT_VAL){ const R = KT_VAL.resumo(t); if (R.X && !R.X.vazio){ rec = R.X.bp.rl; eb = R.X.bp.eb; dl = R.X.dl; ev = R.rec ? (R.rec[0] + R.rec[1]) / 2 : null; fonte = "Due Diligence e valuation"; } } }catch(e){}
    if (!ev && eb) ev = eb * 6; const pct = (parseFloat(String(t.mandato?.participacao || "").replace(",", ".")) || 100) / 100;
    return {rec, eb, dl, ev, eq:ev != null ? (ev - dl) * pct : null, pct, fonte};
  }
  /* ---------------- pontuação ---------------- */
  function score(inv, t){
    const T = inv.tese || {}, N = numeros(t), seg = t.perfil?.segmento || t.segmento || "", sim = (typeof SEG_SIM !== "undefined" && SEG_SIM[seg]) || [], M = [];
    const add = (crit, pts, max, txt) => M.push({crit, pts, max, txt});
    const segs = (T.segmentos || []).map(nrm), cn = String(t.cnae || t.receita?.cnae || "").replace(/\D/g, "").slice(0, 2);
    if (segs.includes(nrm(seg))) add("Segmento", 30, 30, `${seg} está na tese`); else if ((T.cnaes || []).includes(cn)) add("Segmento", 25, 30, `CNAE ${cn} está na tese`); else if (sim.some(x => segs.includes(nrm(x)))) add("Segmento", 15, 30, `${seg} é semelhante a segmentos da tese`); else add("Segmento", 0, 30, `${seg || "segmento"} fora da tese`);
    const faixa = (v, a, b, pts, nome) => { if (v == null || (a == null && b == null)){ add(nome, Math.round(pts / 2), pts, "sem dado para comparar"); return; } const lo = (a ?? 0) * 1e6, hi = b != null ? b * 1e6 : Infinity;
      if (v >= lo && v <= hi) add(nome, pts, pts, `${mi(v)} na faixa`); else if (v >= lo * .8 && v <= hi * 1.2) add(nome, Math.round(pts / 2), pts, `${mi(v)} perto da faixa`); else add(nome, 0, pts, `${mi(v)} fora da faixa`); };
    faixa(N.rec, T.fatMin, T.fatMax, 20, "Faturamento");
    if (T.ebitdaMin != null && N.eb != null) add("EBITDA", N.eb >= T.ebitdaMin * 1e6 ? 10 : N.eb >= T.ebitdaMin * 8e5 ? 5 : 0, 10, `${mi(N.eb)} × mínimo de ${mi(T.ebitdaMin * 1e6)}`); else add("EBITDA", 5, 10, "sem dado para comparar");
    faixa(N.eq, T.ticketMin, T.ticketMax, 20, "Ticket");
    const reg = (T.regioes || []).map(nrm), rt = Object.entries(REG).find(([, l]) => l.includes(t.uf))?.[0];
    add("Região", !reg.length || reg.some(r => ["brasil","america latina"].includes(r)) || reg.includes(nrm(rt)) || reg.includes(nrm(t.uf)) ? 10 : 0, 10, rt ? `${t.uf} · ${rt}` : "região não informada");
    const part = (T.participacao || []).map(nrm), p = N.pct >= .99 ? ["100%", "controle"] : N.pct > .5 ? ["controle"] : ["minoritaria"];
    add("Participação", !part.length || p.some(x => part.includes(nrm(x))) ? 10 : 0, 10, `à venda: ${t.mandato?.participacao || "não definida"}`);
    const rs = nrm(T.restricoes), elim = rs && ((seg && rs.includes(nrm(seg)) && /nao|exceto|sem/.test(rs)) || (/recuperacao judicial/.test(rs) && t.invest?.rj?.v === "sim") || (/minoritaria/.test(rs) && N.pct >= .99 && !part.includes("100%")) || (/auditad/.test(rs) && t.answers?.n3_05?.v !== "sim"));
    const total = elim ? 0 : M.reduce((a, m) => a + m.pts, 0);
    return {score:total, M, elim, motivo:elim ? `Restrição da tese: ${T.restricoes}` : "", N};
  }
  const barra = sc => `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:70px;height:6px;border-radius:3px;background:var(--line);overflow:hidden;display:inline-block"><i style="display:block;height:100%;width:${sc}%;background:${sc >= 70 ? "#3DDC97" : sc >= 45 ? "#F2C14E" : "#FF6B6B"}"></i></span><b class="mono">${sc}</b></span>`;
  const detalhe = r => r.elim ? r.motivo : r.M.map(m => `${m.crit} ${m.pts}/${m.max}: ${m.txt}`).join(" · ");

  /* ---------------- DOSSIÊ · aba M&A ---------------- */
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r0) => { _tab(s, b, r0); const host = b.firstElementChild, ed = D.ed() ? "" : "disabled", up = p => D.up(s, p);
    const N1 = S.suppliers.filter(x => x.nivel === "N1"), N3 = S.suppliers.filter(x => x.nivel === "N3");
    if (s.nivel === "N3"){
      const lado = document.createElement("div"); lado.className = "card"; lado.style.cssText = "display:flex;flex-direction:column;gap:8px";
      lado.innerHTML = `<h3>Lado da Kinsey nesta operação</h3><div class="form"><div class="fld"><label for="m-lado">A Kinsey assessora</label><select id="m-lado" ${ed}><option value="venda" ${s.lado !== "compra" ? "selected" : ""}>O vendedor (sell-side): mandato de venda do target</option><option value="compra" ${s.lado === "compra" ? "selected" : ""}>O comprador (buy-side): target procurado para um investidor</option></select></div>
        ${s.lado === "compra" ? `<div class="fld"><label for="m-cli">Investidor cliente</label><select id="m-cli" ${ed}><option value="">Escolha…</option>${N1.map(v => `<option value="${v.id}" ${v.id === s.compradorId ? "selected" : ""}>${esc(v.nome)}</option>`).join("")}</select></div>` : ""}</div>
        <p class="sub" style="margin:0">Define a visão das análises de contrato (pró-${s.lado === "compra" ? "comprador" : "vendedor"}), das recomendações jurídicas e o modelo de honorários.</p>`;
      host.insertBefore(lado, host.children[1] || null);
      $("#m-lado", lado).onchange = e => up({lado:e.target.value}); const mc = $("#m-cli", lado); if (mc) mc.onchange = e => up({compradorId:e.target.value, investidores:[...new Set([...(s.investidores || []), e.target.value].filter(Boolean))]});
      const L = N1.map(v => ({v, r:score(v, s)})).sort((a, b) => b.r.score - a.r.score), el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
      el.innerHTML = `<h3>Investidores sugeridos pelo matching</h3><p class="sub" style="margin:0">Pontuação de 0 a 100 pela tese de cada investidor (valores ${esc(L[0]?.r.N.fonte || "")}). Passe o mouse para ver o motivo de cada ponto.</p>
        <div class="tbl"><table><thead><tr><th>Investidor</th><th>Aderência</th><th>Motivos</th><th></th></tr></thead><tbody>${L.map(({v, r}) => `<tr><td><b>${esc(v.nome)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(v.tipo || "")}${v.pais ? " · " + esc(v.pais) : ""}</div></td><td title="${esc(detalhe(r))}">${barra(r.score)}</td>
          <td style="font-size:12px;max-width:340px">${esc(r.elim ? r.motivo : r.M.filter(m => m.pts < m.max).map(m => `${m.crit}: ${m.txt}`).join("; ") || "aderente em todos os critérios")}</td>
          <td style="text-align:right">${(s.investidores || []).includes(v.id) ? `<span class="pill r-baixo">Indicado</span>` : D.ed() && !r.elim ? `<button type="button" class="btn sm" data-mind="${v.id}">Indicar</button>` : ""}</td></tr>`).join("")}</tbody></table></div>`;
      host.appendChild(el); $$("[data-mind]", el).forEach(x => x.onclick = () => up({investidores:[...(s.investidores || []), x.dataset.mind]}).then(() => toast("Investidor indicado ao target")));
    }
    if (s.nivel === "N1"){
      const L = N3.filter(t => t.etapa !== "descartada").map(t => ({t, r:score(s, t)})).sort((a, b) => b.r.score - a.r.score), el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
      const buy = N3.filter(t => t.lado === "compra" && t.compradorId === s.id);
      el.innerHTML = `<h3>${buy.length || s.mandato?.status ? "Busca de targets (buy-side)" : "Targets aderentes à tese"}</h3><p class="sub" style="margin:0">Matching pela tese do investidor. Antes do NDA do mandato, o investidor conhece o target só pelo nome-código.</p>
        <div class="tbl"><table><thead><tr><th>Target</th><th>Aderência</th><th>Etapa</th><th>Motivos</th></tr></thead><tbody>${L.map(({t, r}) => `<tr><td><b>${esc(t.mandato?.codinome && !["nda","dataroom","ioi","loi"].includes(t.mandato?.acessos?.[s.id]?.status) ? t.mandato.codinome : t.nome)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(t.perfil?.segmento || t.segmento || "")} · ${esc(t.uf || "")}${t.lado === "compra" ? " · buy-side" : ""}</div></td>
          <td title="${esc(detalhe(r))}">${barra(r.score)}</td><td>${esc(etapaNome(t.etapa))}</td><td style="font-size:12px;max-width:320px">${esc(r.elim ? r.motivo : r.M.filter(m => m.pts < m.max).map(m => `${m.crit}: ${m.txt}`).join("; ") || "aderente")}</td></tr>`).join("")}</tbody></table></div>`;
      host.appendChild(el);
    }
    /* interações */
    const I = Object.entries(s.interacoes || {}).filter(([, v]) => v).sort((a, b) => String(b[1].data).localeCompare(a[1].data)), el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<h3>Interações e próximos passos</h3>${I.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Interação</th><th>Próximo passo</th><th></th></tr></thead><tbody>${I.map(([id, v]) => `<tr><td class="mono" style="white-space:nowrap">${esc(v.data)}</td><td><b>${esc(v.tipo)}</b>${v.com ? " · " + esc(v.com) : ""}<div style="font-size:12.5px">${esc(v.resumo || "")}</div></td><td style="font-size:12.5px">${esc(v.proximo || "—")}${v.prazo ? `<div class="sub" style="margin:0;font-size:11.5px;${v.prazo < new Date().toISOString().slice(0, 10) && !v.feito ? "color:var(--bad)" : ""}">até ${esc(v.prazo)}${v.feito ? " · feito" : ""}</div>` : ""}</td><td>${D.ed() && v.proximo && !v.feito ? `<button type="button" class="btn sm ghost" data-ifeito="${id}">Feito</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0">Nenhuma interação registrada.</p>`}
      ${D.ed() ? `<div class="form"><div class="fld"><label for="i-d">Data</label><input id="i-d" type="date" value="${new Date().toISOString().slice(0, 10)}"></div><div class="fld"><label for="i-t">Tipo</label><select id="i-t">${["Reunião","Ligação","E-mail","Visita","Apresentação","Envio de documentos"].map(x => `<option>${x}</option>`).join("")}</select></div>
        <div class="fld"><label for="i-c">Com quem</label><input id="i-c"></div><div class="fld full"><label for="i-r">Resumo</label><input id="i-r"></div><div class="fld"><label for="i-p">Próximo passo</label><input id="i-p"></div><div class="fld"><label for="i-z">Prazo</label><input id="i-z" type="date"></div></div><button type="button" class="btn sm" id="i-add" style="align-self:flex-start">Registrar interação</button>` : ""}`;
    host.appendChild(el);
    const ia = $("#i-add", el); if (ia) ia.onclick = () => { const r = $("#i-r", el).value.trim(); if (!r){ toast("Escreva o resumo da interação."); return; }
      up({interacoes:{["i" + Date.now().toString(36)]:{data:$("#i-d", el).value, tipo:$("#i-t", el).value, com:$("#i-c", el).value.trim(), resumo:r, proximo:$("#i-p", el).value.trim(), prazo:$("#i-z", el).value, por:Store.me?.email || ""}}}).then(() => toast("Interação registrada")); };
    $$("[data-ifeito]", el).forEach(x => x.onclick = () => up({interacoes:{[x.dataset.ifeito]:{feito:true}}}));
  };

  /* ---------------- BASE M&A · pipeline ---------------- */
  function pipeline(host){ if (!host || $("#ma-pipe", host)) return;
    const T = S.suppliers.filter(s => s.nivel === "N3"), hoje = new Date().toISOString().slice(0, 10);
    const passos = S.suppliers.flatMap(s => Object.values(s.interacoes || {}).filter(v => v && v.proximo && !v.feito).map(v => ({s, v}))).sort((a, b) => String(a.v.prazo || "9").localeCompare(b.v.prazo || "9")).slice(0, 8);
    const el = document.createElement("div"); el.id = "ma-pipe"; el.style.cssText = "display:flex;flex-direction:column;gap:14px;margin-bottom:16px";
    el.innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Kinsey Capital · M&A</div><h3>Pipeline dos targets</h3><p class="sub" style="margin:2px 0 0">${T.length} targets · ${T.filter(t => t.lado === "compra").length} buy-side · ${S.suppliers.filter(s => s.nivel === "N1").length} investidores · ${S.suppliers.filter(s => s.nivel === "N2").length} intermediadores e parceiros</p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" id="ma-pipe-acts"></div></div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px">${FUNIL.filter(f => f[0] !== "descartada").map(([k, l]) => { const L = T.filter(t => (t.etapa || "mapeada") === k);
        return `<div style="min-width:170px;flex:1 0 170px;display:flex;flex-direction:column;gap:6px"><div class="eyebrow" style="display:flex;justify-content:space-between"><span>${esc(l)}</span><b>${L.length}</b></div>
          ${L.map(t => { const N = numeros(t); return `<button type="button" data-open="${t.id}" style="text-align:left;background:rgba(79,176,245,.08);border:1px solid var(--line);border-radius:8px;padding:8px;color:inherit;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:2px">
            <b style="font-size:12.5px">${esc(t.mandato?.codinome || t.nome.replace(/^EXEMPLO /, "")).slice(0, 34)}</b><span class="sub" style="margin:0;font-size:11px">${esc(t.perfil?.segmento || t.segmento || "")}${N.rec ? " · " + mi(N.rec, 0) : ""}${t.lado === "compra" ? " · buy-side" : ""}</span><span class="sub" style="margin:0;font-size:11px">${(t.investidores || []).length} investidor(es)</span></button>`; }).join("")}</div>`; }).join("")}</div>
      ${T.some(t => t.etapa === "descartada") ? `<p class="sub" style="margin:0">Descartados: ${T.filter(t => t.etapa === "descartada").map(t => `${esc(t.nome.replace(/^EXEMPLO /, ""))} (${esc(t.motivoDescarte || "sem motivo")})`).join("; ")}</p>` : ""}</div>
      ${passos.length ? `<div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Próximos passos</h3>${passos.map(({s, v}) => `<div style="display:flex;gap:10px;font-size:13px;border-top:1px solid var(--line);padding-top:6px"><span class="mono" style="min-width:86px;${v.prazo && v.prazo < hoje ? "color:var(--bad)" : ""}">${esc(v.prazo || "sem prazo")}</span><span><b>${esc(s.nome.replace(/^EXEMPLO /, ""))}</b> · ${esc(v.proximo)}</span></div>`).join("")}</div>` : ""}`;
    host.prepend(el); $$("[data-open]", el).forEach(b => b.onclick = () => openSupplier(b.dataset.open, "ma"));
    if (window.KT_MAPA){ const a = $("#ma-pipe-acts", el); a.innerHTML = `<button type="button" class="btn sm primary" id="mp-imp">Importar mapa M&A</button><button type="button" class="btn sm" id="mp-mod">Modelo da planilha</button>`; $("#mp-imp", a).onclick = KT_MAPA.importar; $("#mp-mod", a).onclick = KT_MAPA.modelo; }
  }
  EXT_CAD.push(() => pipeline($("#cadeia")));
  window.KT_MATCH = {score, numeros, pipeline};
})();
