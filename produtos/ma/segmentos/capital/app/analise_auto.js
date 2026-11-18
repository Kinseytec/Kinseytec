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
    if (op.consultar !== false && window.KT_CNPJ?.consultarTudo && s.doc) await Promise.race([KT_CNPJ.consultarTudo(s.id).catch(() => {}), new Promise(r => setTimeout(r, 8000))]); /* Receita, listas oficiais, notícias */
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
  /* ---------- análise individual de um documento ---------- */
  const cnpjF = c => String(c).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  async function individual(s, e){
    const bl = await (await fetch(e.url)).blob(), r = await KT_DOCS.ler(new File([bl], e.nome || "documento", {type:e.mime || bl.type})), t = String(r.texto || ""), L = [];
    const nomeT = {balanco:"Balanço patrimonial", dre:"DRE", balancete:"Balancete", contrato_social:"Contrato social", cartao_cnpj:"Cartão CNPJ", nda:"NDA", mandato:"Mandato", spa:"SPA", mou:"MOU / LOI"}[r.tipo] || (r.tipo ? String(r.tipo).replace(/_/g, " ") : "");
    L.push(["Tipo identificado", r.tipo ? `${nomeT}${r.formato ? ` (${r.formato})` : ""} · pelo ${r.como || "sistema"}` : "não identificado: classifique o documento"]);
    if (r.cnpjs?.length){ const dg = String(s.doc || "").replace(/\D/g, ""); L.push(["CNPJ no documento", r.cnpjs.map(cnpjF).join(", ") + (dg && !r.cnpjs.includes(dg) ? " · difere do cadastro" : "")]); }
    if (r.periodo) L.push(["Período", `${dBR(r.periodo.ini)} a ${dBR(r.periodo.fim)}${r.multi ? ` · ${r.multi.length} período(s)` : ""}`]);
    const contas = r.contas || [], cDRE = r.contasDRE || [];
    if (contas.length || cDRE.length){ const K = D.calc({contas:[...contas, ...cDRE], meses:12}); L.push(["Contas lidas", String(contas.length + cDRE.length)]);
      if (K.AT) L.push(["Ativo total / patrimônio líquido", `${mi(K.AT)} / ${mi(K.PL)}${K.fecha ? " · balanço fecha" : " · confira: ativo e passivo não fecham"}`]);
      if (K.recLiq) L.push(["Receita líquida / EBITDA / lucro", `${mi(K.recLiq)} / ${mi(K.ebitda)} / ${mi(K.ll)}${K.naoOp ? ` · resultado não operacional ${mi(K.naoOp)} fora do EBITDA` : ""}`]);
      if (K.dl || K.caixa) L.push(["Dívida líquida", mi(K.dl)]); }
    if (r.tipo === "contrato_social" && window.KT_JAUTO){ const X = KT_JAUTO.lerSocietario(t); L.push(["Sócios", (X.socios || []).map(p => p.nome + (p.pct ? ` (${fmt(p.pct * 100, 0)}%)` : "")).join("; ") || "não identificados"]);
      if (X.capital) L.push(["Capital social", "R$ " + X.capital]); if (X.administracao) L.push(["Administração", X.administracao]); if ((X.clausulas || []).length) L.push(["Cláusulas relevantes", X.clausulas.join(", ")]); }
    if (/certid|cnd/i.test(`${r.tipo} ${e.tipo} ${e.nome}`) || /certid[aã]o/i.test(t.slice(0, 600))){ const n = t.replace(/\s+/g, " ");
      const sit = /positiva com efeitos? de negativa/i.test(n) ? "Positiva com efeitos de negativa" : /certid[aã]o negativa|nada consta|n[aã]o constam/i.test(n) ? "Negativa (sem débitos)" : /positiva/i.test(n) ? "Positiva (há débitos)" : "não identificada";
      const val = (n.match(/v[aá]lid[ao][^0-9]{0,40}(\d{2}\/\d{2}\/\d{4})/i) || [])[1]; const venc = val && new Date(val.split("/").reverse().join("-") + "T23:59") < new Date(); L.push(["Situação da certidão", sit + (val ? ` · válida até ${val}${venc ? " · VENCIDA: pedir certidão atualizada" : ""}` : "")]); }
    if (["spa", "mou", "nda", "mandato"].includes(r.tipo) && window.KT_CONTRATO && t.length > 200){ const a = KT_CONTRATO.analisar(t, s.lado === "compra" ? "compra" : "venda"), ruins = a.itens.filter(x => x.st !== "ok");
      L.push(["Cláusulas", `${ruins.length} desfavorável(is) ou ausente(s) de ${a.itens.length}${ruins.length ? ": " + ruins.slice(0, 4).map(x => x.t).join("; ") : ""}`]); }
    return {r, L};
  }
  /* ---------- dossiê, aba Documentos (depois do checklist): automático sim/não e análise de um documento por vez ---------- */
  function quadroDossie(s){ const on = s.anaAutoOn !== false, L = docs(s).filter(e => e.url), ed = Store.me?.canWrite !== false;
    return `<div class="card" id="aa-doc" style="display:flex;flex-direction:column;gap:10px;margin-top:12px"><div><div class="eyebrow">Análise dos documentos importados</div><h3 style="margin:0;font-size:16px">Analisar automaticamente</h3>
        <p class="sub" style="margin:2px 0 0;font-size:12.5px">Com "Sim", cada importação já faz as consultas públicas, as análises financeiras e leva os números e documentos ao valuation, à Due Diligence, ao PPA e ao jurídico. Também dá para analisar um documento por vez.</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="sub" style="margin:0;font-size:12.5px">Analisar documentos importados de forma automática:</span><button type="button" class="fbtn" data-aaon="1" aria-pressed="${on}" ${ed ? "" : "disabled"}>Sim</button><button type="button" class="fbtn" data-aaon="0" aria-pressed="${!on}" ${ed ? "" : "disabled"}>Não, analisar um por vez</button></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-aatodos>Analisar todos agora</button>${s.anaAuto?.em ? `<span class="sub" style="font-size:12px;align-self:center">última análise em ${dBR(s.anaAuto.em)}</span>` : ""}</div>
      <div id="aa-todos"></div>
      ${L.length ? `<details ${on ? "" : "open"}><summary style="cursor:pointer;font-size:13.5px;font-weight:600">Analisar um documento (${L.length})</summary><div class="tbl" style="margin-top:6px"><table><tbody>${L.map(e => `<tr><td style="font-size:12.5px;word-break:break-word">${esc(fixMoji(e.nome || "documento"))}<div class="sub" style="margin:0;font-size:11px">${esc(e.tipo || "")}</div><div data-aaind="${e.id}"></div></td><td style="text-align:right;white-space:nowrap"><button type="button" class="btn sm ghost" data-aaone="${e.id}">Analisar</button></td></tr>`).join("")}</tbody></table></div></details>` : `<p class="sub" style="margin:0;font-size:12.5px">Nenhum documento no dossiê ainda.</p>`}</div>`; }
  function bindDossie(b, s){
    $$("[data-aaon]", b).forEach(x => x.onclick = () => Store.update("suppliers", s.id, {anaAutoOn:x.dataset.aaon === "1"}).then(() => toast(x.dataset.aaon === "1" ? "Análise automática ligada" : "Análise automática desligada: analise um documento por vez")).catch(() => {}));
    const t = $("[data-aatodos]", b); if (t) t.onclick = async () => { const box = $("#aa-todos", b); t.disabled = true; t.textContent = "Analisando…"; box.innerHTML = `<div class="result">Consultas públicas, análises financeiras, Due Diligence, valuation, PPA e jurídico…</div>`;
      try{ const o = await rodar(s); (S._aaRes ||= {})[s.id] = o; mostraRes(); }catch(e){ console.error(e); const bx = document.querySelector("#aa-todos") || box; bx.innerHTML = `<div class="result">Análise não concluída: ${esc(e.message || "erro")}</div>`; }
      const t2 = document.querySelector("[data-aatodos]") || t; t2.disabled = false; t2.textContent = "Analisar todos agora"; };
    /* o dossiê é redesenhado quando a análise é gravada: o resultado fica guardado e volta a aparecer */
    function mostraRes(){ const o = S._aaRes?.[s.id], bx = document.querySelector("#aa-todos"); if (!o || !bx) return; bx.innerHTML = html(supById(s.id) || s, o); bind(bx, supById(s.id) || s, () => { const x = document.querySelector("[data-x]"); if (x) x.click(); }); }
    mostraRes();
    $$("[data-aaone]", b).forEach(x => x.onclick = async () => { const e = S.evidences.find(v => v.id === x.dataset.aaone), out = b.querySelector(`[data-aaind="${e.id}"]`); x.disabled = true; x.textContent = "Lendo…";
      try{ const {r, L} = await individual(supById(s.id) || s, e);
        out.innerHTML = `<div style="margin-top:6px;display:flex;flex-direction:column;gap:3px">${L.map(([k, v]) => `<div style="font-size:12px"><span class="sub" style="margin:0">${esc(k)}:</span> ${esc(v)}</div>`).join("")}${r.tipo && Store.me?.canWrite !== false ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px"><button type="button" class="btn sm" data-aaapl="${e.id}">Levar às análises</button></div>` : ""}</div>`;
        const ap = out.querySelector("[data-aaapl]"); if (ap) ap.onclick = async () => { ap.disabled = true; ap.textContent = "Aplicando…"; try{ const f = await KT_DOCS.aplicar(supById(s.id) || s, r, {semArquivo:true}); ap.textContent = "Aplicado"; toast(f.join(" · ").slice(0, 160)); }catch(err){ ap.disabled = false; ap.textContent = "Levar às análises"; toast("Não foi possível aplicar"); } };
      }catch(err){ console.error(err); out.innerHTML = `<div class="sub" style="font-size:12px">Não foi possível ler: ${esc(err.message || "erro")}</div>`; }
      x.disabled = false; x.textContent = "Analisar"; }); }
  if (typeof EXT_DOCS !== "undefined") EXT_DOCS.push((s, b) => { if (s.nivel !== "N3" || b.querySelector("#aa-doc")) return; const w = document.createElement("div"); w.innerHTML = quadroDossie(s); b.appendChild(w.firstElementChild); bindDossie(b, s); });
  window.KT_ANAUTO = {resumo, rodar, html, bind, abrir, individual, quadroDossie};
})();
