/* ================= KINSEY CAPITAL · TRABALHO: CLIENTE DA ÓRBITA OU TRABALHO NOVO =================
   No topo de Avaliação de ativos, Valuation, Due Diligence e PPA (Pós-aquisição): "Cliente da Órbita?".
   - Sim (marcado por padrão): usa a empresa em consulta; cadastro, Receita Federal, balancetes e análises vêm sozinhos
     desde o cadastro inicial.
   - Não, trabalho novo: só então aparece o cadastro do cliente novo: CNPJ (com consulta à Receita ou leitura do cartão
     CNPJ), razão social, data-base, finalidade, contratante e local, e a importação do balanço do ano (e demais
     documentos) ou dos balancetes mensais do ano. O trabalho fica marcado como avulso e não entra no globo da Órbita. */
if (window.KT_DD) (() => {
  const D = KT_DD, dig = v => String(v || "").replace(/\D/g, "");
  const fmtCnpj = d => { d = dig(d); return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d; };
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
  const AREAS = {
    ativos:{nome:"Avaliação de ativos", tag:"avaliacao", fin:["Combinação de negócios · PPA (CPC 15)", "Revisão de vida útil e valor residual (CPC 27)", "Valor justo para fins contábeis (CPC 46)", "Teste de recuperabilidade (CPC 01)", "Seguro", "Garantia ou financiamento", "Fins fiscais ou societários", "Outra"]},
    valuation:{nome:"Valuation", tag:"valuation", fin:["Venda da empresa ou de participação (M&A)", "Compra de empresa (investidor)", "Entrada ou saída de sócio", "Laudo para fins contábeis ou fiscais", "Planejamento e gestão", "Outra"]},
    dd:{nome:"Due Diligence", tag:"dd", fin:["Due diligence para investidor (compra)", "Due diligence do vendedor (vendor DD)", "Due diligence para financiamento", "Outra"]},
    ppa:{nome:"PPA", tag:"ppa", fin:["Combinação de negócios · PPA (CPC 15)", "Ágio para fins fiscais (Lei 12.973)", "PPA avulso (só a alocação do preço)", "Teste de recuperabilidade do ágio (CPC 01)", "Outra"]},
    impairment:{nome:"Impairment", tag:"impairment", fin:["Teste anual do ágio (CPC 01)", "Teste por indício de desvalorização", "Impairment de marca ou intangível", "Impairment de unidade de negócio", "Outra"]}};
  const info = (s, a) => a === "ativos" ? (s?.ativos || {}) : (s?.trabalhos?.[a] || {});
  const dataBaseAuto = (s, a) => info(s, a).dataBase || s.perfil?.dataBase || s.ativos?.dataBase || (D.periodos(s) || []).map(p => s.dd.bal[p].dataBase).filter(Boolean)[0] || "";
  const avulso = s => !!s?.trabalho;
  function card(s, a){
    const rf = s?.receita && !s.receita.erro ? s.receita : {}, I = info(s, a), db = s ? dataBaseAuto(s, a) : "", end = [rf.logradouro, rf.numero, rf.bairro, [rf.municipio || s?.municipio, rf.uf || s?.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
    const sim = !s || !avulso(s);
    return `<div class="card" id="avt-trab" style="display:flex;flex-direction:column;gap:10px"><div class="eyebrow">Trabalho · ${esc(AREAS[a].nome)}</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:14px">Cliente da Órbita?</b><div class="seg"><button type="button" class="v-sim" data-atc="sim" aria-pressed="${sim}">Sim</button><button type="button" class="v-nao" data-atc="nao" aria-pressed="${!sim}">Não, trabalho novo</button></div></div>
      ${s ? `<div class="tbl"><table><tbody>
        <tr><td style="white-space:nowrap">Empresa</td><td><b>${esc(rf.razao || s.nome)}</b>${avulso(s) ? ` <span class="pill r-pend" style="font-size:10.5px">trabalho avulso</span>` : ` <span class="sub" style="font-size:11.5px">dados do cadastro inicial</span>`}</td></tr>
        <tr><td>CNPJ</td><td>${esc(s.doc || "—")}</td></tr>${end ? `<tr><td>Endereço</td><td>${esc(end)}</td></tr>` : ""}
        <tr><td>Data-base</td><td>${db ? esc(dBR(db)) : `<span class="pill r-alto" style="font-size:10.5px">a definir</span>`}</td></tr>
        ${I.finalidade ? `<tr><td>Finalidade</td><td>${esc(I.finalidade)}</td></tr>` : ""}${I.local ? `<tr><td>Local</td><td>${esc(I.local)}</td></tr>` : ""}${I.contratante ? `<tr><td>Contratante</td><td>${esc(I.contratante)}</td></tr>` : ""}</tbody></table></div>
        ${Store.me?.canWrite !== false ? `<div><button type="button" class="btn sm" data-atc="edit">Dados do trabalho</button></div>` : ""}` : `<p class="sub" style="margin:0">Escolha a empresa em "Trocar".</p>`}</div>`;
  }
  /* cadastro do trabalho: s nulo = cliente novo */
  function form(s, a){
    const A = AREAS[a], I = info(s, a), rf = s?.receita && !s.receita.erro ? s.receita : {}, ano0 = String(new Date().getFullYear() - 1);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(A.nome)}</div><h2>${s ? "Dados do trabalho" : "Trabalho novo · cliente fora da Órbita"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="avt-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
        ${s ? "" : `<p class="sub" style="margin:0">Informe o essencial. Com o CNPJ (digitado ou lido do cartão CNPJ), a Receita Federal completa razão social e endereço.</p>`}
        <div class="form">
          <div class="fld full"><label for="avt-doc">CNPJ${s ? "" : " *"}</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input id="avt-doc" inputmode="numeric" value="${esc(s?.doc || "")}" placeholder="só números ou 00.000.000/0000-00" style="flex:1;min-width:180px" ${s && dig(s.doc).length === 14 ? "disabled" : ""}>${s ? "" : `<label class="btn sm ghost">Cartão CNPJ<input type="file" id="avt-cart" accept=".pdf,.txt,image/*" hidden></label>`}</div><span class="hint" id="avt-rf"></span></div>
          <div class="fld full"><label for="avt-nome">Razão social *</label><input id="avt-nome" value="${esc(rf.razao || s?.nome || "")}"></div>
          <div class="fld"><label for="avt-db">Data-base *</label><input id="avt-db" type="date" value="${esc(I.dataBase || (s ? dataBaseAuto(s, a) : ""))}"></div>
          <div class="fld"><label for="avt-fin">Finalidade</label><select id="avt-fin">${A.fin.map(f => `<option ${f === (I.finalidade || A.fin[0]) ? "selected" : ""}>${f}</option>`).join("")}</select></div>
          <div class="fld full"><label for="avt-loc">${a === "ativos" ? "Local dos bens (inspeção)" : "Local ou unidades"}</label><input id="avt-loc" value="${esc(I.local || "")}"></div>
          <div class="fld full"><label for="avt-ctr">Contratante e responsável</label><input id="avt-ctr" value="${esc(I.contratante || "")}" placeholder="quem contratou e o contato na empresa"></div></div>
        ${s ? "" : `<div class="card" style="display:flex;flex-direction:column;gap:8px;padding:12px"><b style="font-size:14px">Balanços e balancetes do cliente</b>
          <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="fbtn" data-avb="ano" aria-pressed="true">Balanço do ano e outros documentos</button><button type="button" class="fbtn" data-avb="mes" aria-pressed="false">Balancetes mensais do ano</button><button type="button" class="fbtn" data-avb="nao" aria-pressed="false">Depois</button></div>
          <div id="avt-bano"><label class="btn sm">Escolher balanços, DRE e documentos<input type="file" id="avt-bf" multiple accept=".pdf,.xlsx,.xlsm,.csv,.ods,.txt,.zip" hidden></label><span class="hint" id="avt-bst" style="display:block;margin-top:4px">Balanço patrimonial, DRE, balancete anual, contrato social, certidões: o sistema reconhece cada um.</span></div>
          <div id="avt-bmes" hidden><span class="hint">Ao cadastrar, abre a importação dos balancetes do ano (informe o ano e selecione todos de uma vez).</span></div></div>`}
        <div class="err" id="avt-err" hidden></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-x>Cancelar</button><button type="submit" class="btn primary">${s ? "Salvar" : "Cadastrar trabalho"}</button></div></form>`);
    let rf2 = null, ult = "", cart = null, modoB = "ano", arqs = [];
    const consulta = async () => { const d = dig($("#avt-doc").value), st = $("#avt-rf"); if (d.length !== 14 || d === ult) return; ult = d;
      if (!IMP.docValido(d)){ st.textContent = "CNPJ inválido."; return; }
      const ja = S.suppliers.find(x => dig(x.doc) === d && x.id !== s?.id); if (ja){ st.innerHTML = `Já cadastrado: <b>${esc(ja.nome)}</b>. <a href="#" id="avt-usa" style="color:var(--glow)">usar este cadastro</a>`; $("#avt-usa").onclick = e => { e.preventDefault(); close(); S.ddSel = ja.id; renderView(); }; return; }
      st.textContent = "Consultando a Receita Federal…";
      try{ rf2 = await ORG.receita(d); $("#avt-doc").value = fmtCnpj(d); if (rf2.razao) $("#avt-nome").value = rf2.razao; if (!$("#avt-loc").value) $("#avt-loc").value = [rf2.logradouro, rf2.numero, rf2.bairro, [rf2.municipio, rf2.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
        st.textContent = `${rf2.situacao || ""} · ${rf2.cnae || ""} ${rf2.cnaeDesc || ""}`; }catch(e){ st.textContent = cart ? "Dados do cartão CNPJ aplicados; a Receita é consultada depois." : "Receita indisponível agora: siga com os dados; a consulta é refeita depois."; } };
    $("#avt-doc").oninput = consulta; $("#avt-doc").onchange = consulta;
    const ca = $("#avt-cart"); if (ca) ca.onchange = async () => { const fl = ca.files[0]; if (!fl || !window.KT_CNPJ) return; $("#avt-rf").textContent = "Lendo o cartão CNPJ…";
      try{ cart = await KT_CNPJ.lerCartao(fl); if (!dig(cart.cnpj)){ $("#avt-rf").textContent = "Não achei o CNPJ no cartão: digite o número."; return; }
        $("#avt-doc").value = fmtCnpj(cart.cnpj); if (cart.razao) $("#avt-nome").value = cart.razao; if (!$("#avt-loc").value && cart.municipio) $("#avt-loc").value = [cart.municipio, cart.uf].filter(Boolean).join("/"); ult = ""; await consulta(); }catch(e){ $("#avt-rf").textContent = "Não consegui ler o cartão: digite o CNPJ."; } };
    $$("[data-avb]").forEach(b => b.onclick = () => { modoB = b.dataset.avb; $$("[data-avb]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); $("#avt-bano").hidden = modoB !== "ano"; $("#avt-bmes").hidden = modoB !== "mes"; });
    const bf = $("#avt-bf"); if (bf) bf.onchange = () => { arqs = [...bf.files]; $("#avt-bst").textContent = arqs.length ? `${arqs.length} arquivo(s): ${arqs.map(f => f.name).slice(0, 4).join(", ")}${arqs.length > 4 ? "…" : ""}` : ""; };
    $("#avt-f").onsubmit = async e => { e.preventDefault(); const er = $("#avt-err"), nome = $("#avt-nome").value.trim(), db = $("#avt-db").value, d = dig($("#avt-doc").value);
      if (!s && (d.length !== 14 || !IMP.docValido(d))){ er.textContent = "Informe o CNPJ da empresa (14 números) ou leia o cartão CNPJ."; er.hidden = false; return; }
      if (!nome || !db){ er.textContent = "Informe a razão social e a data-base."; er.hidden = false; return; }
      const it = {dataBase:db, finalidade:$("#avt-fin").value, local:$("#avt-loc").value.trim(), contratante:$("#avt-ctr").value.trim()}, patch = a === "ativos" ? {ativos:it} : {trabalhos:{[a]:it}};
      if (s){ await D.up(s, {...patch, ...(rf2 ? {receita:{...rf2, em:nowISO()}} : {})}); close(); toast("Dados do trabalho salvos"); renderView(); return; }
      const id = "tb" + Date.now().toString(36), receita = rf2 ? {...rf2, em:nowISO()} : cart && window.KT_CNPJ ? KT_CNPJ.doCartao(cart) : null;
      await Store.set("suppliers", id, {nivel:"N3", nome, doc:fmtCnpj(d), tipo:`Cliente de ${A.nome.toLowerCase()}`, trabalho:A.tag, origem:`${A.nome} (trabalho avulso)`, pais:"Brasil", municipio:receita?.municipio || "", uf:receita?.uf || "", segmento:receita?.cnae && window.KT_CNPJ ? KT_CNPJ.segCnae(receita.cnae) : "", perfil:{dataBase:db, segmento:receita?.cnae && window.KT_CNPJ ? KT_CNPJ.segCnae(receita.cnae) : ""}, etapa:"servico",
        ...(receita ? {receita} : {}), ...patch, answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), criadoPor:Store.me?.id || ""});
      if (window.KT_MAPA?.coords){ try{ const s2 = supById(id); if (s2){ const [lat, lng] = KT_MAPA.coords(s2); await Store.update("suppliers", id, {lat, lng}); } }catch(err){} }
      if (window.KT_CNPJ) KT_CNPJ.consultarTudo(id);
      close(); S.ddSel = id;
      if (modoB === "ano" && arqs.length && window.KT_DOCS){ let n = 0; toast(`Trabalho cadastrado: lendo ${arqs.length} documento(s)…`);
        for (const f of arqs){ try{ const r = await KT_DOCS.ler(f); if (r.tipo){ await KT_DOCS.aplicar(supById(id), r); n++; } }catch(err){ console.warn(err); } }
        toast(`${n} de ${arqs.length} documento(s) reconhecido(s) e importado(s)`); }
      else toast("Trabalho novo cadastrado");
      renderView();
      if (modoB === "mes" && window.KT_PREDD) setTimeout(() => KT_PREDD.importarAno(supById(id)), 300); };
  }
  function montar(host, col, a, s, antes){
    if (!col || $("#avt-trab", host)) return; const w = document.createElement("div"); w.innerHTML = card(s, a); const el = w.firstElementChild;
    if (antes) antes.before(el); else col.prepend(el);
    $$("[data-atc]", el).forEach(b => b.onclick = () => { const k = b.dataset.atc; if (k === "nao") return form(null, a); if (k === "edit") return form(s, a);
      if (k === "sim"){ if (s && !avulso(s)){ toast("Cliente da Órbita: os dados vêm do cadastro inicial"); return; } S.pastaAberta = true; renderView(); toast("Escolha a empresa da Órbita em Trocar"); } });
    if (a === "ativos" && s && !s.ativos?.dataBase && dataBaseAuto(s, a) && Store.me?.canWrite !== false) D.up(s, {ativos:{dataBase:dataBaseAuto(s, a)}}).catch(() => {});
  }
  if (EXT_VIEWS.ativos){ const _v = EXT_VIEWS.ativos; EXT_VIEWS.ativos = function(){ const r = _v.apply(this, arguments); const host = $("#ativos"); if (host) montar(host, host.querySelector(".dd-split > div:last-child"), "ativos", D.alvoSel()); return r; }; }
  if (EXT_VIEWS.valuation){ const _v = EXT_VIEWS.valuation; EXT_VIEWS.valuation = function(){ const r = _v.apply(this, arguments); const host = $("#valuation"); if (host && S.valTab !== "base" && S.valTab !== "divida") montar(host, host.querySelector(".dd-split > div:last-child"), "valuation", D.alvoSel()); return r; }; }
  if (typeof renderAuditoria === "function"){ const _r = renderAuditoria; renderAuditoria = function(){ const r = _r.apply(this, arguments); const host = $("#auditoria"); if (!host || !["geral", "ra"].includes(S.ddTab)) return r;
      const tabs = host.querySelector(".dd-tabs"); if (tabs) montar(host, tabs.parentElement, "dd", D.alvoSel(), tabs.nextElementSibling); return r; }; }
  if (EXT_VIEWS.pos){ const _v = EXT_VIEWS.pos; EXT_VIEWS.pos = function(){ const r = _v.apply(this, arguments); const host = $("#pos"); if (host && S.posTab !== "mod") montar(host, host.querySelector(".dd-split > div:last-child"), S.posTab === "imp" ? "impairment" : "ppa", D.alvoSel()); return r; }; }
  /* trabalhos avulsos não aparecem no globo da Órbita (não são empresas do M&A) */
  { const _f = window.ORB_FILTRO; window.ORB_FILTRO = s => !s?.trabalho && (!_f || _f(s)); }
  window.KT_ATVT = {form, card, AREAS};
})();
