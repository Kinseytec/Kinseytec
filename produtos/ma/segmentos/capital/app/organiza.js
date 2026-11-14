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
