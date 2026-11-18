/* ================= KINSEY CAPITAL · JURÍDICO: VALIDAÇÃO DOS DOCUMENTOS E PARECER DO ADVOGADO =================
   No M&A o advogado não emite um parecer por documento:
   - cada documento é lido pelo sistema, que aponta fragilidades e cláusulas desfavoráveis ou ausentes; o advogado só
     escolhe Validar, Validar com ressalva ou Não validar (observação opcional, sem OAB);
   - a aba "Parecer do advogado" reúne todos os pontos da diligência (questionário, processos e contingências, contratos,
     documentos validados, contrato social, pré-diligência, procedimentos e workbook) e o advogado emite o parecer final:
     minuta sem credenciais ou parecer com nome e OAB. */
if (window.KT_DD && window.KT_JDD) (() => {
  const D = KT_DD, J = KT_JDD, mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e6, Math.abs(v) >= 1e8 ? 0 : 1)} mi`;
  const ST = {aprovado:["Validado", "r-baixo"], ressalvas:["Validado com ressalva", "r-medio"], reprovado:["Não validado", "r-alto"], pendente:["Aguardando validação", "r-pend"]};
  const SEV = {alto:["Alto", "r-alto", 0], medio:["Médio", "r-medio", 1], baixo:["Atenção", "r-pend", 2]};
  const FL = {coc:"mudança de controle", excl:"exclusividade", nc:"não concorrência", multa:"multa relevante", garantia:"garantias", rescisao:"rescisão imotivada", reaj:"reajuste"};
  const tenta = f => { try{ return f(); }catch(e){ console.warn("parecer", e); return null; } };
  /* ---------- 1. validação dos documentos (sem parecer por documento) ---------- */
  const _oc = openContract;
  openContract = async function(id){
    await _oc.apply(this, arguments);
    const k = S.contracts.find(x => x.id === id), body = [...document.querySelectorAll(".sheet-b")].pop(); if (!k || !body) return;
    const f = $("#fpar", body); if (f) f.remove();
    if (!k.analiseVend && k.file?.url){ const b = $("#av-file", body); if (b) setTimeout(() => b.click(), 50); } /* a leitura é automática */
    const p = S.pareceres[id] || {}, pode = Store.me?.canEdit !== false, a = k.analiseVend, ruins = a ? a.itens.filter(x => x.st !== "ok") : [];
    body.insertAdjacentHTML("beforeend", `<div class="card" id="jv-card" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">Validação do advogado</div><h3 style="margin:0">Validar o documento</h3>
      <p class="sub" style="margin:2px 0 0;font-size:12.5px">O sistema já leu o documento${a ? ` e apontou ${ruins.length} ponto(s) desfavorável(is) ou ausente(s)` : ""}; os pontos seguem para a diligência jurídica e para o parecer final. Basta validar: não é preciso parecer nem OAB por documento.</p></div>
      ${p.status ? `<div><span class="pill ${(ST[p.status] || ST.pendente)[1]}">${(ST[p.status] || ST.pendente)[0]}</span> <span class="sub" style="font-size:12px">em ${dt(p.em)}${p.obs ? ` · ${esc(p.obs)}` : ""}</span></div>` : ""}
      ${pode ? `<div class="fld"><label for="jv-obs">Observação (opcional)</label><input id="jv-obs" value="${esc(p.obs || "")}" placeholder="ex.: pedir a anuência do banco credor antes do fechamento"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn ok" data-jv="aprovado">Validar</button><button type="button" class="btn warn" data-jv="ressalvas">Validar com ressalva</button><button type="button" class="btn bad" data-jv="reprovado">Não validar</button></div>` : ""}</div>`);
    $$("[data-jv]", body).forEach(b => b.onclick = async () => { const st = b.dataset.jv;
      try{ await Store.set("pareceres", id, {...(S.pareceres[id] || {}), status:st, obs:$("#jv-obs").value.trim(), em:nowISO(), por:Store.me?.id || "", validacao:true}); toast((ST[st] || [st])[0]); const x = $("[data-x]"); if (x) x.click(); }
      catch(e){ toast("Validação não registrada: só a equipe com acesso de Editor valida documentos."); } });
  };
  /* lista do Jurídico: textos de validação e sem os quadros que não são do M&A */
  EXT_JUR.push(() => { const host = $("#juridico"); if (!host) return;
    const fc = $("#fcot", host); if (fc) fc.style.display = "none"; [...host.querySelectorAll("details.card")].filter(d => /Matriz jurídica das cláusulas/.test(d.textContent)).forEach(d => { d.style.display = "none"; });
    const h = host.querySelector(".head h2"); if (h && /Aprovação remota/.test(h.textContent)){ h.textContent = "Validação dos documentos"; const sb = h.parentElement.querySelector(".sub"); if (sb) sb.textContent = "O sistema lê cada documento e aponta fragilidades e cláusulas desfavoráveis. O advogado só valida, valida com ressalva ou não valida; o parecer final fica na aba Parecer do advogado."; }
    const R = {Pendentes:"Aguardando validação", "Com ressalvas":"Com ressalva", Aprovados:"Validados", Reprovados:"Não validados"};
    $$("[data-cf]", host).forEach(b => { const t = b.childNodes[0]; if (t && t.nodeType === 3){ const k0 = t.nodeValue.trim(); if (R[k0]) t.nodeValue = R[k0]; } });
    $$(".ct .pill, .ct [class*=r-]", host).forEach(x => { const m = {aprovado:"Validado", ressalvas:"Validado com ressalva", reprovado:"Não validado", pendente:"Aguardando validação"}; const k0 = x.textContent.trim().toLowerCase(); if (m[k0]) x.textContent = m[k0]; }); });

  /* ---------- 2. pontos consolidados para o parecer ---------- */
  function pontos(s){
    s = supById(s.id) || s; const P = [], add = (origem, sev, t, txt, ref) => P.push({origem, sev, t, txt:String(txt || ""), ref:ref || ""});
    const q = s.jdd?.q || {};
    J.QS.filter(x => x.risco && q[x.id]?.v === x.risco).forEach(x => add("Questionário jurídico", (x.pts || 0) >= 3 ? "alto" : "medio", x.t, q[x.id]?.obs || q[x.id]?.txt || "Resposta indica risco.", x.g));
    J.QS.filter(x => !q[x.id]?.v).length && add("Questionário jurídico", "baixo", "Perguntas sem resposta", `${J.QS.filter(x => !q[x.id]?.v).length} de ${J.QS.length} pergunta(s) ainda sem resposta.`);
    const cg = tenta(() => J.contingencias(s)) || {n:0};
    if (cg.provavel) add("Processos e contingências", "alto", "Contingências prováveis", `${mi(cg.provavel)} em processos com prognóstico provável (provisionado ${mi(cg.provisao || 0)}): entram na dívida líquida e pedem indenização ou retenção no SPA.`);
    if (cg.possivel) add("Processos e contingências", "medio", "Contingências possíveis", `${mi(cg.possivel)} em processos com prognóstico possível: tratar no SPA (indenização específica, escrow ou retenção).`);
    Object.values(s.jdd?.pr || {}).filter(Boolean).filter(p => p.prog === "provavel" || (+p.valor || 0) >= 1e6).slice(0, 8).forEach(p => add("Processos e contingências", p.prog === "provavel" ? "alto" : "medio", `${p.area || "Processo"} ${p.numero || ""}`.trim(), `${p.objeto || "sem descrição"} · ${mi(+p.valor || 0)} · prognóstico ${p.prog || "possível"}`));
    (tenta(() => J.contratos(s)) || []).forEach(c => { const fl = Object.keys(c.flags || {}).filter(k => c.flags[k]); if (fl.length) add("Contratos da empresa", fl.includes("coc") ? "alto" : "medio", `${c.tipo || "Contrato"} · ${c.contraparte || ""}`, `Cláusulas críticas: ${fl.map(k => FL[k] || k).join(", ")}.`); });
    S.contracts.filter(k => k.supplierId === s.id).forEach(k => { const p = S.pareceres[k.id] || {}, a = k.analiseVend, ruins = a ? a.itens.filter(x => x.st !== "ok") : [], st = p.status || "pendente";
      const nome = `${k.tipo || "Documento"}${k.numero ? " nº " + k.numero : ""}${k.contraparte ? " · " + k.contraparte : ""}`;
      if (st === "reprovado") add("Documentos validados", "alto", nome, `Não validado pelo advogado${p.obs ? ": " + p.obs : ""}.`);
      else if (st === "ressalvas") add("Documentos validados", "medio", nome, `Validado com ressalva${p.obs ? ": " + p.obs : ""}.`);
      else if (st === "pendente") add("Documentos validados", "baixo", nome, "Aguardando validação do advogado.");
      ruins.filter(x => x.sev === "Alta").slice(0, 4).forEach(x => add("Documentos validados", "medio", `${nome} · ${x.t}`, `${x.st === "ausente" ? "Cláusula ausente" : "Desfavorável"}: ${x.txt || ""}${x.sug ? ` Sugestão: ${x.sug}` : ""}`)); });
    const X = s.jdd?.soc?.ext; if (X){ const cl = X.clausulas || [];
      if (cl.includes("onus")) add("Societário", "alto", "Ônus sobre quotas", "O contrato social menciona penhor, alienação fiduciária ou usufruto das quotas: liberar até o fechamento (condição precedente).");
      if (cl.includes("preferencia")) add("Societário", "medio", "Direito de preferência", "Obter a renúncia dos demais sócios ao direito de preferência antes da assinatura.");
      if (!(X.socios || []).length) add("Societário", "medio", "Quadro societário", "Sócios não identificados no contrato social: conferir a última alteração consolidada e a Junta Comercial.");
      if (!X.registro?.numero) add("Societário", "baixo", "Registro na Junta", "Número de registro na Junta Comercial não localizado no documento."); }
    else add("Societário", "medio", "Contrato social", "Contrato social não importado: importar a última alteração consolidada.");
    (tenta(() => KT_PREDD.pontos(s)) || []).filter(p => /Jur|Trabalh|Tribut|Previd|Ambient|Societ|Regulat|Cadastral|Consultas/.test(p.area) && ["alto", "medio", "pend"].includes(p.sev))
      .forEach(p => add(`Pré-diligência · ${p.area}`, p.sev === "pend" ? "baixo" : p.sev, p.t, p.txt));
    const per = (D.periodos(s) || [])[0]; if (per){ const b = s.dd.bal[per], K = D.calc(b); (D.PROCS || []).filter(pr => pr.area === "juridica").forEach(pr => { const r = tenta(() => pr.f(K, b, s, per)); if (r?.st === "achado") add("Procedimentos automáticos", "medio", pr.t, r.txt); }); }
    ((s.dd?.wb?.pontos) || []).forEach(p => add("Workbook da diligência", "medio", p.ponto || p.titulo || (Array.isArray(p) ? p[0] : "Ponto do workbook"), p.recomendacao || p.detalhe || (Array.isArray(p) ? p.slice(1).join(" · ") : "")));
    Object.values(s.jdd?.wbj?.pontos || {}).filter(Boolean).forEach(p => add("Workbook jurídico", p.sev || "medio", p.t || p.ponto || "Ponto", p.txt || p.recomendacao || ""));
    (tenta(() => J.recomendacoes(s)) || []).forEach(r => add("Recomendações para o contrato", "baixo", "Recomendação", r));
    return P.sort((a, b) => SEV[a.sev][2] - SEV[b.sev][2]);
  }
  const conclusaoSug = L => L.some(p => p.sev === "alto") ? "favoravel_ressalvas" : "favoravel";
  const CONC = {favoravel:"Favorável à operação", favoravel_ressalvas:"Favorável à operação, com ressalvas", desfavoravel:"Desfavorável à operação"};
  function textoSug(s, L){
    const al = L.filter(p => p.sev === "alto"), me = L.filter(p => p.sev === "medio");
    return [`A diligência jurídica de ${s.nome} reuniu ${L.length} ponto(s): ${al.length} de risco alto e ${me.length} de risco médio, apurados no questionário, nos processos e contingências, nos contratos, no contrato social, nos documentos validados, na pré-diligência e no workbook.`,
      al.length ? `Pontos que exigem tratamento antes do fechamento: ${al.slice(0, 6).map(p => p.t).join("; ")}.` : "Não foram identificados pontos de risco alto.",
      "Recomenda-se refletir os pontos no SPA por meio de declarações e garantias, indenizações específicas, condições precedentes e, quando cabível, retenção ou conta garantia (escrow)."].join("\n\n");
  }
  /* ---------- 3. aba "Parecer do advogado" ---------- */
  function html(s){
    const L = pontos(s), pr = s.jdd?.parecer || {}, pode = Store.me?.canEdit !== false, cont = c => L.filter(p => p.sev === c).length;
    const grupos = [...new Set(L.map(p => p.origem))];
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Parecer do advogado · base consolidada</div><h3 style="margin:0">${esc(s.nome)}</h3>
        <p class="sub" style="margin:2px 0 0;font-size:12.5px">Todos os pontos da diligência chegam aqui automaticamente. O advogado revisa, escreve a conclusão e emite o parecer final: minuta sem credenciais ou com nome e OAB.</p></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="pill r-alto" style="font-size:11px">${cont("alto")} alto(s)</span><span class="pill r-medio" style="font-size:11px">${cont("medio")} médio(s)</span><span class="pill r-pend" style="font-size:11px">${cont("baixo")} de atenção</span>${pr.em ? `<span class="sub" style="font-size:12px;align-self:center">Último parecer: ${esc(CONC[pr.conclusao] || "")} · ${dt(pr.em)}${pr.adv?.nome ? ` · ${esc(pr.adv.nome)} ${esc(pr.adv.oab || "")}` : " · minuta"}</span>` : ""}</div>
      ${grupos.map(g => `<details ${L.some(p => p.origem === g && p.sev === "alto") ? "open" : ""}><summary style="cursor:pointer;font-size:13.5px;font-weight:600">${esc(g)} · ${L.filter(p => p.origem === g).length}</summary><div class="tbl" style="margin-top:6px"><table><tbody>${L.filter(p => p.origem === g).map(p => `<tr><td style="width:84px"><span class="pill ${SEV[p.sev][1]}" style="font-size:10.5px">${SEV[p.sev][0]}</span></td><td><b style="font-size:13px">${esc(p.t)}</b><div class="sub" style="margin:2px 0 0;font-size:12px">${esc(p.txt)}</div></td></tr>`).join("")}</tbody></table></div></details>`).join("") || `<p class="sub" style="margin:0">Nenhum ponto levantado ainda.</p>`}
      <form id="jp-f" style="display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line-2);padding-top:10px" novalidate><b style="font-size:14px">Conclusão do advogado</b>
        <div class="fld"><label for="jp-c">Conclusão</label><select id="jp-c" ${pode ? "" : "disabled"}>${Object.entries(CONC).map(([k, l]) => `<option value="${k}" ${(pr.conclusao || conclusaoSug(L)) === k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="fld"><label for="jp-t">Considerações finais</label><textarea id="jp-t" rows="8" ${pode ? "" : "disabled"}>${esc(pr.texto || textoSug(s, L))}</textarea></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"><div class="fld"><label for="jp-a">Advogado (para o parecer assinado)</label><input id="jp-a" value="${esc(pr.adv?.nome || (typeof advPadrao === "function" ? advPadrao().nome : "") || "")}" placeholder="Nome completo" ${pode ? "" : "disabled"}></div>
          <div class="fld"><label for="jp-o">OAB (UF e número)</label><input id="jp-o" value="${esc(pr.adv?.oab || (typeof advPadrao === "function" ? advPadrao().oab : "") || "")}" placeholder="OAB/SP 123.456" ${pode ? "" : "disabled"}></div></div>
        <p class="err" id="jp-err" hidden></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-jp="minuta">Emitir minuta (PDF, sem credenciais)</button><button type="button" class="btn sm primary" data-jp="oab">Emitir parecer com OAB (PDF)</button></div>
        <p class="sub" style="margin:0;font-size:11.5px">A minuta sai sem nome e sem OAB, para revisão. O parecer com OAB exige o nome completo e o número da OAB.</p></form></div>`;
  }
  function bind(host, s){
    $$("[data-jp]", host).forEach(b => b.onclick = async () => { const err = $("#jp-err", host); err.hidden = true; const modo = b.dataset.jp;
      const nome = $("#jp-a", host).value.trim().replace(/\s+/g, " "), oab = typeof oabFmt === "function" ? oabFmt($("#jp-o", host).value) : $("#jp-o", host).value.trim();
      if (modo === "oab" && (nome.split(" ").length < 2 || !oab)){ err.textContent = "Para o parecer assinado, informe o nome completo e a OAB (ex.: OAB/SP 123.456). Sem isso, emita a minuta."; err.hidden = false; return; }
      const pr = {conclusao:$("#jp-c", host).value, texto:$("#jp-t", host).value.trim(), adv:modo === "oab" ? {nome, oab} : null, modo, em:nowISO(), por:Store.me?.email || ""};
      await D.up(s, {jdd:{parecer:pr}}).catch(() => {}); if (modo === "oab"){ try{ localStorage.setItem("kt-adv", JSON.stringify({nome, oab})); }catch(e){} }
      b.disabled = true; const t0 = b.textContent; b.textContent = "Gerando…"; try{ await pdf(supById(s.id) || s, pr); }catch(e){ console.error(e); toast("Não foi possível gerar o PDF."); } b.disabled = false; b.textContent = t0; });
  }
  async function pdf(s, pr){
    pr = pr || s.jdd?.parecer || {conclusao:conclusaoSug(pontos(s)), texto:textoSug(s, pontos(s)), modo:"minuta"}; const R = KT_REL, P = KTPdf(), L = pontos(s), minuta = !pr.adv?.nome; let n = 0; const sec = t => R.sec(P, ++n, t);
    R.capa(P, minuta ? "Parecer jurídico · diligência · MINUTA" : "Parecer jurídico · diligência", s.nome, [["Conclusão", CONC[pr.conclusao] || "—"], ["Pontos levantados", `${L.length} (${L.filter(p => p.sev === "alto").length} de risco alto)`], ["Emitido em", new Date().toLocaleDateString("pt-BR")], ["Responsável", minuta ? "minuta sem assinatura" : `${pr.adv.nome} · ${pr.adv.oab}`]]);
    if (window.KT_CNPJ?.ficha){ sec("Identificação da empresa"); R.tab(P, ["Campo", "Informação"], KT_CNPJ.ficha(s).filter(([k]) => k !== "Fonte do cadastro"), [.3, .7]); }
    sec("Escopo"); R.par(P, "Parecer elaborado com base na diligência jurídica registrada no KinseyTec: questionário de diligência, processos e contingências, contratos da empresa, documentos lidos e validados (NDA, mandato, MOU, SPA e outros), contrato social, pré-diligência (certidões e consultas públicas), procedimentos automáticos e pontos do workbook da diligência. Os documentos foram lidos automaticamente e validados pelo advogado.");
    sec("Conclusão"); R.par(P, CONC[pr.conclusao] || "—", {bold:true}); String(pr.texto || "").split(/\n{2,}/).forEach(t => t.trim() && R.par(P, t.trim()));
    sec("Pontos de risco"); R.tab(P, ["Nível", "Origem", "Ponto", "Detalhe"], L.filter(p => p.sev !== "baixo").map(p => [SEV[p.sev][0], p.origem, p.t, p.txt]), [.09, .2, .25, .46]);
    const at = L.filter(p => p.sev === "baixo"); if (at.length){ sec("Pontos de atenção e recomendações"); R.tab(P, ["Origem", "Ponto", "Detalhe"], at.map(p => [p.origem, p.t, p.txt]), [.22, .25, .53]); }
    const docs = S.contracts.filter(k => k.supplierId === s.id); if (docs.length){ sec("Documentos lidos e validados"); R.tab(P, ["Documento", "Validação", "Pontos apontados pelo sistema", "Observação"], docs.map(k => { const p = S.pareceres[k.id] || {}, a = k.analiseVend; return [`${k.tipo || "Documento"}${k.contraparte ? " · " + k.contraparte : ""}`, (ST[p.status || "pendente"] || ST.pendente)[0], a ? `${a.itens.filter(x => x.st !== "ok").length} de ${a.itens.length}` : "não lido", p.obs || ""]; }), [.32, .2, .2, .28]); }
    const cg = J.contingencias(s); if (cg.n){ sec("Contingências"); R.tab(P, ["Prognóstico", "Valor em discussão"], [["Provável", mi(cg.provavel)], ["Possível", mi(cg.possivel)], ["Remota", mi(cg.remota)], ["Provisionado", mi(cg.provisao || 0)]], [.5, .5]); }
    P.y += 24; P.ensure(70);
    if (minuta){ R.par(P, "MINUTA para revisão do advogado responsável · sem assinatura e sem efeito de parecer até ser emitida com nome e OAB.", {size:9, color:[178,40,40]}); }
    else { R.par(P, `${new Date().toLocaleDateString("pt-BR", {day:"numeric", month:"long", year:"numeric"})}.`, {size:9.5}); P.y += 26; P.line(P.M, P.y, P.M + 240, P.y, [1,31,75], .6); P.text(P.M, P.y + 12, R.T(pr.adv.nome), 9.5, true, [1,31,75]); P.text(P.M, P.y + 25, R.T(`${pr.adv.oab} · advogado responsável`), 9, false, [90,101,120]); P.y += 34; }
    await rptSave(P.out(`Parecer jurídico · ${s.nome}`, R.T(`Kinsey Capital · Parecer jurídico${minuta ? " (minuta)" : ""} · ${s.nome} · confidencial`)), R.arq(s, minuta ? "parecer_juridico_minuta" : "parecer_juridico", "pdf"), "application/pdf");
  }
  /* aba no Jurídico */
  const _jr = renderJuridico;
  renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return;
    const tabs = host.querySelector(".dd-tabs"); if (tabs && !tabs.querySelector('[data-jur="parecer"]')){ const b = document.createElement("button"); b.type = "button"; b.className = "fbtn"; b.dataset.jur = "parecer"; b.setAttribute("aria-pressed", String(S.jurTab === "parecer")); b.textContent = "Parecer do advogado"; tabs.appendChild(b); b.onclick = () => { S.jurTab = "parecer"; renderJuridico(); }; }
    $$('.dd-tabs [data-jur="contratos"]', host).forEach(b => { b.textContent = "Validação dos documentos"; });
    if (S.jurTab !== "parecer") return;
    [...host.children].forEach(c => { if (!c.contains(tabs)) c.remove(); });
    const T = D.targets(); let s = supById(S.jurAlvo); if (!s || s.nivel !== "N3") s = T[0]; if (s) S.jurAlvo = s.id;
    const sd = D.lado(s, id => { S.jurAlvo = id; renderJuridico(); }, ["sem pontos de risco", "com pontos de risco", "não iniciada"]);
    const box = document.createElement("div"); box.className = "dd-split"; box.innerHTML = `${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0" id="jp-host">${s ? html(s) : `<div class="empty">Nenhum target cadastrado.</div>`}</div>`;
    host.appendChild(box); sd.bind(box); if (s) bind(box, s); };
  window.KT_JPAR = {pontos, html, bind, pdf};
})();
