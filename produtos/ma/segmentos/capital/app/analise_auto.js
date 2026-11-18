/* ================= KINSEY CAPITAL · ANÁLISE AUTOMÁTICA DOS DOCUMENTOS IMPORTADOS =================
   Depois de cada importação (e no botão "Analisar documentos importados" da Base inicial), o sistema:
   1. relê os documentos do dossiê que ainda não viraram números (balanço, DRE, balancete, ECD, ECF);
   2. aplica o contrato social na diligência jurídica (sócios, administração, capital, cláusulas, respostas automáticas);
   3. calcula e mostra, num só quadro, o que cada área recebeu: demonstrações, análises financeiras, Due Diligence
      (pré-diligência, procedimentos e revisão analítica), valuation, PPA, impairment e jurídico.
   O mesmo quadro aparece no dossiê da empresa. Na tela de documentos dá para ler de novo, excluir ou importar outro. */
if (window.KT_DD && window.KT_DOCS) (() => {
  const D = KT_DD, mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e6, Math.abs(v) >= 1e8 ? 0 : 1)} mi`, pc = v => v == null || !isFinite(v) ? "—" : `${fmt(v * 100, 1)}%`;
  const xx = v => v == null || !isFinite(v) ? "—" : `${fmt(v, 1)}×`, dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const tenta = f => { try{ return f(); }catch(e){ console.warn("análise automática", e); return null; } };
  const docs = s => S.evidences.filter(e => e.supplierId === s.id && (e.url || e.nome)).sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")));
  /* ---------- análise ---------- */
  function resumo(s){
    s = supById(s.id) || s; const P = D.periodos(s) || [], bal = s.dd?.bal || {}, temDRE = p => D.C(bal[p]).some(c => /^3/.test(String(c[0])) || ["recBruta", "cpv", "deducoes"].includes(c[3]));
    const anuais = P.filter(p => +bal[p].meses === 12), mensais = P.filter(p => +bal[p].meses !== 12), per = P.find(temDRE) || P[0], o = {em:nowISO(), docs:docs(s).length, periodos:P.length, anuais, mensais, per};
    if (per){ const b = bal[per], K = D.calc(b), AJ = tenta(() => D.ajustes(s, per)) || [], A = D.soma(AJ.filter(D.okFin)), I = D.indic(K, A);
      o.demo = {per, dataBase:b.dataBase, fecha:K.fecha, temDRE:temDRE(per), origem:b.origem, naoOp:K.naoOp};
      const dre = temDRE(per); o.fin = {rl:dre ? K.recLiq : null, ebitda:dre ? I.ebitda : null, ebRep:K.ebitda, mg:dre ? I.mEbitda : null, dl:I.dl, dlE:dre ? I.dlEbitda : null, ncg:I.ncg, lc:tenta(() => K.AC / K.PC), ll:dre ? I.ll : null, pend:AJ.filter(a => !D.okFin(a)).length, ajustes:AJ.length};
      const PR = (D.PROCS || []).map(pr => tenta(() => pr.f(K, b, s, per))).filter(Boolean); o.dd = {achados:PR.filter(r => r.st === "achado").length, semDados:PR.filter(r => r.st === "sd").length, total:PR.length};
      const PT = tenta(() => KT_PREDD.pontos(s)) || []; o.dd.alto = PT.filter(p => p.sev === "alto").length; o.dd.medio = PT.filter(p => p.sev === "medio").length; o.dd.pontos = PT.length; o.dd.top = PT.filter(p => ["alto", "medio"].includes(p.sev)).slice(0, 4).map(p => `${p.area}: ${p.t}`);
      const RA = tenta(() => KT_RA.alertas(s)); if (RA) o.dd.ra = (RA.A || []).length;
      const R = dre ? tenta(() => KT_VAL.resumo(s)) : null; if (R && !R.X?.vazio) o.val = {rec:R.rec, ev:R.mod.c.ev, eq:R.mod.c.ev - R.X.dl, mult:R.mod.c.mult, wacc:R.X.W.wacc, dl:R.X.dl};
      const Z = dre ? tenta(() => KT_POS.ppa(s)) : null; if (Z) o.ppa = {preco:Z.preco, intang:Z.intang, gw:Z.goodwill, fonte:Z.fonte};
      const IM = (s.pos?.ppa?.data || s.pos?.imp || s.trabalhos?.impairment) ? tenta(() => window.KT_IMP?.calc(s)) : null; if (IM) o.imp = {perda:IM.T.perda, folga:IM.T.folga, ind:IM.indEmp, ugcs:IM.U.length}; }
    const X = s.jdd?.soc?.ext; o.jur = X ? {tipo:X.tipo, socios:(X.socios || []).map(p => p.nome + (p.pct ? ` (${fmt(p.pct * 100, 0)}%)` : "")), capital:X.capital, adm:X.administracao, onus:(X.clausulas || []).includes("onus"), respostas:Object.keys(tenta(() => KT_JAUTO.respostas(s)) || {}).length} : null;
    return o;
  }
  async function rodar(s, op = {}){
    s = supById(s.id) || s; let rep = null;
    if (op.reler !== false && window.KT_FINX?.reprocessar) rep = await KT_FINX.reprocessar(s).catch(() => null);
    if (s.jdd?.soc && window.KT_JAUTO?.aplicar) await Promise.resolve(KT_JAUTO.aplicar(supById(s.id) || s)).catch(() => {});
    if (window.KT_JDOCS) await KT_JDOCS.autoVincula(supById(s.id) || s).catch(() => {}); /* documentos do questionário jurídico */
    const res = resumo(supById(s.id) || s); res.reproc = rep;
    await Store.update("suppliers", s.id, {anaAuto:{em:res.em, por:Store.me?.email || "", periodos:res.periodos, per:res.per || null}}).catch(() => {});
    return res;
  }
  /* ---------- quadro ---------- */
  function html(s, o, op = {}){
    const k = (l, v, sub, cor) => `<div class="dd-k"><span>${l}</span><b${cor ? ` style="color:${cor}"` : ""}>${v}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
    const area = (t, ok, corpo, go) => `<div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--line-2);padding-top:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:13px">${ok ? "✓" : "…"} ${t}</b>${go ? `<button type="button" class="btn sm ghost" data-aago="${go}">Abrir</button>` : ""}</div><div class="sub" style="margin:0;font-size:12.5px">${corpo}</div></div>`;
    if (!o.per) return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">Análise automática · ${esc(s.nome)}</div><p class="sub" style="margin:0;font-size:13px">${o.docs} documento(s) no dossiê e nenhum balanço, DRE, balancete, ECD ou ECF legível. Importe as demonstrações para liberar as análises.</p>
      ${o.jur ? area("Jurídico", true, `${esc(o.jur.tipo || "Contrato social")}: ${o.jur.socios.map(esc).join("; ") || "sócios não identificados"}${o.jur.capital ? ` · capital R$ ${esc(o.jur.capital)}` : ""}${o.jur.onus ? ` · <b style="color:var(--warn)">ônus sobre quotas</b>` : ""} · ${o.jur.respostas} resposta(s) automática(s)`, "juridico") : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-aaimp>Importar documentos</button></div></div>`;
    const f = o.fin || {}, d = o.dd || {}, v = o.val, z = o.ppa, im = o.imp, j = o.jur;
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">Análise automática dos documentos</div><h3 style="margin:0;font-size:16px">${esc(s.nome)}</h3>
        <p class="sub" style="margin:2px 0 0;font-size:12px">${o.docs} documento(s) · ${o.anuais.length} exercício(s)${o.mensais.length ? ` e ${o.mensais.length} balancete(s) mensal(is)` : ""} · base ${esc(o.per)}${o.demo.fecha ? " · balanço fecha" : ` · <b style="color:var(--warn)">balanço não fecha</b>`}${o.demo.temDRE ? "" : ` · <b style="color:var(--warn)">sem DRE no período</b>`}${o.reproc?.aplicados ? ` · ${o.reproc.aplicados} documento(s) relido(s) agora` : ""}</p></div>
      <div class="dd-kpis">${k("Receita líquida", mi(f.rl))}${k("EBITDA", mi(f.ebitda), f.ebitda != null && f.ebitda !== f.ebRep ? `reportado ${mi(f.ebRep)}` : `margem ${pc(f.mg)}`, "var(--ouro,#F4C440)")}${k("Dívida líquida", mi(f.dl), `${xx(f.dlE)} o EBITDA`)}${v ? k("Valuation (faixa)", `${mi(v.rec[0])} a ${mi(v.rec[1])}`, `FCD ${mi(v.ev)} · ${xx(v.mult)}`) : ""}</div>
      ${!o.demo.temDRE ? area("Análises financeiras", false, `Só balanço patrimonial no período: dívida líquida ${mi(f.dl)}, capital de giro ${mi(f.ncg)}, liquidez corrente ${xx(f.lc)}. <b>Importe a DRE (ou o balancete, ECD ou ECF) para liberar EBITDA, valuation e PPA.</b>`, "financas") : ""}
      ${!o.demo.temDRE ? "" : area("Análises financeiras", true, `EBITDA ${mi(f.ebitda)} (margem ${pc(f.mg)}), lucro líquido ${mi(f.ll)}, capital de giro ${mi(f.ncg)}, liquidez corrente ${xx(f.lc)}${o.demo.naoOp ? `; resultado não operacional de ${mi(o.demo.naoOp)} fora do EBITDA` : ""}${f.pend ? `; <b>${f.pend} ajuste(s) aguardando o OK do consultor</b>` : ""}.`, "financas")}
      ${area("Due Diligence", true, `Pré-diligência com ${d.pontos || 0} ponto(s): <b style="color:${d.alto ? "var(--bad)" : "inherit"}">${d.alto || 0} alto(s)</b>, ${d.medio || 0} médio(s); ${d.achados || 0} achado(s) nos procedimentos automáticos${d.ra != null ? `; ${d.ra} alerta(s) na revisão analítica` : ""}.${(d.top || []).length ? `<br>${d.top.map(esc).join(" · ")}` : ""}`, "auditoria")}
      ${v ? area("Valuation", true, `Faixa de ${mi(v.rec[0])} a ${mi(v.rec[1])}; FCD moderado ${mi(v.ev)} (EV/EBITDA ${xx(v.mult)}, WACC ${pc(v.wacc)}); equity ${mi(v.eq)} depois da dívida líquida de ${mi(v.dl)}.`, "valuation") : ""}
      ${z ? area("PPA (estimativa)", true, `Preço de referência ${mi(z.preco)} (${esc(z.fonte || "")}); intangíveis identificados ${mi(z.intang)}; goodwill ${mi(z.gw)}.`, "pos") : ""}
      ${im ? area("Impairment (CPC 01)", true, im.perda > 0 ? `<b style="color:var(--bad)">Perda estimada de ${mi(im.perda)}</b> em ${im.ugcs} UGC(s).` : `Sem perda: valor excedente de ${mi(im.folga)} em ${im.ugcs} UGC(s)${im.ind ? "; há indício marcado" : ""}.`, "pos") : ""}
      ${area("Jurídico", !!j, j ? `${esc(j.tipo || "Contrato social")}: ${j.socios.map(esc).join("; ") || "sócios não identificados"}${j.adm ? ` · administração ${esc(String(j.adm).slice(0, 80))}` : ""}${j.capital ? ` · capital R$ ${esc(j.capital)}` : ""}${j.onus ? ` · <b style="color:var(--warn)">ônus sobre quotas</b>` : ""} · ${j.respostas} resposta(s) automática(s) no questionário.` : "Importe o contrato social para preencher sócios, administração e capital no mandato, NDA, MOU e SPA.", "juridico")}
      ${op.compacto ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-aarun>Analisar de novo</button><button type="button" class="btn sm" data-aaimp>Importar novo documento</button><button type="button" class="btn sm ghost" data-aadocs>Documentos importados</button></div>`}</div>`;
  }
  function bind(host, s, fechar){
    const ir = v => { if (fechar) fechar(); S.ddSel = s.id; S.sel = s.id; if (v === "pos") S.posTab = "ppa"; go(v); };
    $$("[data-aago]", host).forEach(b => b.onclick = () => ir(b.dataset.aago));
    $$("[data-aaimp]", host).forEach(b => b.onclick = () => { if (fechar) fechar(); KT_DOCS.importar(s.id); });
    $$("[data-aadocs]", host).forEach(b => b.onclick = () => { if (fechar) fechar(); abrir(s.id); });
    $$("[data-aarun]", host).forEach(b => b.onclick = async () => { b.disabled = true; b.textContent = "Analisando…"; try{ const o = await rodar(s); host.innerHTML = html(supById(s.id) || s, o); bind(host, supById(s.id) || s, fechar); toast("Análise automática atualizada"); }catch(e){ console.error(e); b.disabled = false; b.textContent = "Analisar de novo"; } });
  }
  /* ---------- tela: escolher a empresa, documentos (ler / excluir / importar) e análise ---------- */
  function abrir(pre){
    const L0 = S.suppliers.filter(x => x.nivel === "N3"), nq = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Analisar documentos importados</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        <div class="fld"><label for="aa-q">Empresa</label><input type="search" id="aa-q" autocomplete="off" placeholder="Digite o nome ou o CNPJ"><div id="aa-res" style="display:flex;flex-direction:column;gap:4px;margin-top:4px"></div></div>
        <div id="aa-docs"></div><div id="aa-out"></div></div>`);
    const docsHtml = s => { const L = docs(s); return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:14px">Documentos de ${esc(s.nome)} (${L.length})</b><button type="button" class="btn sm primary" data-aaimp>Importar novo documento</button></div>
      ${L.length ? `<div class="tbl" style="max-height:300px;overflow:auto"><table><tbody>${L.map(e => `<tr><td style="font-size:12.5px;word-break:break-all">${esc(fixMoji(e.nome || "documento"))}<div class="sub" style="margin:0;font-size:11px">${esc(e.tipo || "")} · ${dBR(e.criadoEm)}</div><div class="sub" style="margin:0;font-size:11px" data-aamsg="${e.id}"></div></td>
        <td style="text-align:right;white-space:nowrap">${e.url ? `<a class="btn sm ghost" href="${esc(e.url)}" target="_blank" rel="noopener">Ver</a> ` : ""}${Store.me?.canWrite === false ? "" : `<button type="button" class="btn sm ghost" data-aaler="${e.id}">Ler documento</button> <button type="button" class="btn sm ghost" data-aadel="${e.id}" style="color:var(--bad)">Excluir</button>`}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0;font-size:12.5px">Nenhum documento no dossiê.</p>`}</div>`; };
    const mostra = async s => { $("#aa-res").innerHTML = ""; $("#aa-q").value = s.nome; const D0 = $("#aa-docs"), O = $("#aa-out");
      const ligaDocs = () => { D0.innerHTML = docsHtml(supById(s.id) || s); bind(D0, s, close);
        $$("[data-aaler]", D0).forEach(b => b.onclick = async () => { const e = S.evidences.find(x => x.id === b.dataset.aaler), m = D0.querySelector(`[data-aamsg="${e.id}"]`); b.disabled = true; b.textContent = "Lendo…";
          try{ const bl = await (await fetch(e.url)).blob(), r = await KT_DOCS.ler(new File([bl], e.nome || "documento", {type:e.mime || bl.type}));
            if (!r.tipo){ m.innerHTML = `<b style="color:var(--warn)">Não identificado.</b> Use Importar novo documento e escolha o tipo.`; }
            else { const feito = await KT_DOCS.aplicar(supById(s.id) || s, r, {semArquivo:true}); m.textContent = feito.join(" · "); await analisa(); } }catch(err){ console.error(err); m.textContent = "Não foi possível ler: " + (err.message || "erro"); }
          b.disabled = false; b.textContent = "Ler documento"; });
        $$("[data-aadel]", D0).forEach(b => b.onclick = () => confirmBox("Excluir este documento do dossiê? Se ele foi a única fonte de um balanço ou balancete, esse período também sai da Due Diligence.", "Excluir", async () => {
          const e = S.evidences.find(x => x.id === b.dataset.aadel); if (!e) return; const ss = supById(s.id) || s, up = {};
          /* o período que veio deste documento sai da Due Diligence e é refeito com os demais documentos do mesmo período */
          const refazer = new Set(); Object.entries(ss.dd?.bal || {}).forEach(([p, v]) => { const arq = v?.arquivos || (v?.arquivo ? [v.arquivo] : []); if (arq.includes(e.nome)){ up[p] = null; arq.filter(a => a !== e.nome).forEach(a => refazer.add(a)); } });
          await Store.del("evidences", e.id).catch(() => {}); if (Object.keys(up).length) await Store.update("suppliers", s.id, {dd:{bal:up}}).catch(() => {});
          let n = 0; for (const nome of refazer){ const ev = S.evidences.find(x => x.supplierId === s.id && x.nome === nome && x.url); if (!ev) continue;
            try{ const bl = await (await fetch(ev.url)).blob(), r = await KT_DOCS.ler(new File([bl], nome, {type:ev.mime || bl.type})); if (r.tipo){ await KT_DOCS.aplicar(supById(s.id) || s, r, {semArquivo:true}); n++; } }catch(err){ console.warn(err); } }
          toast(`Documento excluído${Object.keys(up).length ? ` · ${Object.keys(up).length} período(s) refeito(s) com ${n} documento(s) restante(s)` : ""}`); setTimeout(() => { ligaDocs(); analisa(); }, 300); })); };
      const analisa = async () => { O.innerHTML = `<div class="result">Analisando ${esc(s.nome)}…</div>`; try{ const o = await rodar(s); O.innerHTML = html(supById(s.id) || s, o); bind(O, supById(s.id) || s, close); }catch(e){ console.error(e); O.innerHTML = `<div class="result">Análise não concluída: ${esc(e.message || "erro")}</div>`; } };
      ligaDocs(); await analisa(); };
    $("#aa-q").oninput = () => { const q = nq($("#aa-q").value.trim()), d = String($("#aa-q").value).replace(/\D/g, ""); if (q.length < 2 && d.length < 3){ $("#aa-res").innerHTML = ""; return; }
      const L = L0.filter(x => nq([x.nome, x.receita?.razao, x.receita?.fantasia, x.mandato?.codinome].join(" ")).includes(q) || (d.length >= 3 && String(x.doc || "").replace(/\D/g, "").includes(d))).slice(0, 8);
      $("#aa-res").innerHTML = L.length ? L.map(x => `<button type="button" class="btn sm ghost" data-aas="${x.id}" style="justify-content:flex-start;text-align:left">${esc(x.nome)}<span class="sub" style="margin-left:6px;font-size:11.5px">${esc(x.doc || "")}</span></button>`).join("") : `<span class="sub" style="font-size:12.5px">Nenhuma empresa encontrada.</span>`;
      $$("[data-aas]", $("#aa-res")).forEach(b => b.onclick = () => mostra(supById(b.dataset.aas))); };
    const s0 = pre && supById(pre); if (s0) mostra(s0);
  }
  /* ---------- dossiê: quadro da análise automática ---------- */
  if (typeof renderSupBody === "function"){ const _r = renderSupBody;
    renderSupBody = function(){ const r = _r.apply(this, arguments); if (!["dados", "ma"].includes(S.supTab)) return r; const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || s.nivel !== "N3" || b.querySelector("#aa-dos")) return r;
      try{ if (!(D.periodos(s) || []).length && !s.jdd?.soc) return r; const w = document.createElement("div"); w.id = "aa-dos"; w.innerHTML = html(s, resumo(s)); b.prepend(w); bind(w, s, () => { const x = document.querySelector("[data-x]"); if (x) x.click(); }); }catch(e){ console.warn(e); } return r; }; }
  window.KT_ANAUTO = {resumo, rodar, html, bind, abrir};
})();
