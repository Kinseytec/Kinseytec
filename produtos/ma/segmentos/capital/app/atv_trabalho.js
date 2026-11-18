/* ================= KINSEY CAPITAL · AVALIAÇÃO DE ATIVOS · TRABALHO =================
   No topo da Avaliação de ativos: "Cliente da Órbita?".
   - Sim: usa a empresa em consulta; razão social, CNPJ, endereço e data-base vêm sozinhos do cadastro, da Receita
     Federal e do valuation.
   - Não: trabalho novo. Cadastro básico do laudo (CNPJ com consulta à Receita, razão social, data-base, finalidade,
     local dos bens e contratante); o resto do trabalho segue igual. */
if (window.KT_DD) (() => {
  const D = KT_DD, dig = v => String(v || "").replace(/\D/g, "");
  const fmtCnpj = d => { d = dig(d); return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d; };
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
  const FIN = ["Combinação de negócios · PPA (CPC 15)", "Revisão de vida útil e valor residual (CPC 27)", "Valor justo para fins contábeis (CPC 46)", "Teste de recuperabilidade (CPC 01)", "Seguro", "Garantia ou financiamento", "Fins fiscais ou societários", "Outra"];
  const dataBaseAuto = s => s.ativos?.dataBase || s.perfil?.dataBase || (D.periodos(s) || []).map(p => s.dd.bal[p].dataBase).filter(Boolean)[0] || "";
  const novo = s => s?.trabalho === "avaliacao";
  function card(s){
    const rf = s?.receita && !s.receita.erro ? s.receita : {}, A = s?.ativos || {}, db = dataBaseAuto(s || {}), end = [rf.logradouro, rf.numero, rf.bairro, [rf.municipio || s?.municipio, rf.uf || s?.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
    const sim = s && !novo(s);
    return `<div class="card" id="avt-trab" style="display:flex;flex-direction:column;gap:10px"><div class="eyebrow">Trabalho</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:14px">Cliente da Órbita?</b><div class="seg"><button type="button" data-atc="sim" aria-pressed="${!!sim}">Sim</button><button type="button" data-atc="nao" aria-pressed="${!!(s && novo(s))}">Não, trabalho novo</button></div></div>
      ${s ? `<div class="tbl"><table><tbody>
        <tr><td style="white-space:nowrap">Empresa</td><td><b>${esc(rf.razao || s.nome)}</b>${novo(s) ? ` <span class="pill r-pend" style="font-size:10.5px">trabalho avulso</span>` : ""}</td></tr>
        <tr><td>CNPJ</td><td>${esc(s.doc || "—")}</td></tr>${end ? `<tr><td>Endereço</td><td>${esc(end)}</td></tr>` : ""}
        <tr><td>Data-base</td><td>${db ? esc(dBR(db)) + (A.dataBase ? "" : ` <span class="sub" style="font-size:11.5px">(do ${s.perfil?.dataBase ? "valuation" : "último balancete"})</span>`) : `<span class="pill r-alto" style="font-size:10.5px">a definir</span>`}</td></tr>
        ${A.finalidade ? `<tr><td>Finalidade</td><td>${esc(A.finalidade)}</td></tr>` : ""}${A.local ? `<tr><td>Local dos bens</td><td>${esc(A.local)}</td></tr>` : ""}${A.contratante ? `<tr><td>Contratante</td><td>${esc(A.contratante)}</td></tr>` : ""}</tbody></table></div>
        ${Store.me?.canWrite !== false ? `<div><button type="button" class="btn sm" data-atc="edit">Dados do laudo</button></div>` : ""}` : `<p class="sub" style="margin:0">Escolha a empresa em "Trocar" ou cadastre um trabalho novo.</p>`}</div>`;
  }
  function form(s){ /* s nulo = trabalho novo */
    const A = s?.ativos || {}, rf = s?.receita && !s.receita.erro ? s.receita : {};
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Avaliação de ativos</div><h2>${s ? "Dados do laudo" : "Trabalho novo"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="avt-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
        ${s ? "" : `<p class="sub" style="margin:0">Empresa fora da Órbita: informe o essencial para o laudo. Com o CNPJ, a Receita Federal completa razão social e endereço.</p>`}
        <div class="form">
          <div class="fld full"><label for="avt-doc">CNPJ${s ? "" : " *"}</label><input id="avt-doc" inputmode="numeric" value="${esc(s?.doc || "")}" placeholder="só números ou 00.000.000/0000-00" ${s && dig(s.doc).length === 14 ? "disabled" : ""}><span class="hint" id="avt-rf"></span></div>
          <div class="fld full"><label for="avt-nome">Razão social *</label><input id="avt-nome" value="${esc(rf.razao || s?.nome || "")}"></div>
          <div class="fld"><label for="avt-db">Data-base *</label><input id="avt-db" type="date" value="${esc(A.dataBase || dataBaseAuto(s || {}))}"></div>
          <div class="fld"><label for="avt-fin">Finalidade</label><select id="avt-fin">${FIN.map(f => `<option ${f === (A.finalidade || FIN[0]) ? "selected" : ""}>${f}</option>`).join("")}</select></div>
          <div class="fld full"><label for="avt-loc">Local dos bens (inspeção)</label><input id="avt-loc" value="${esc(A.local || "")}" placeholder="endereço da fábrica ou das unidades"></div>
          <div class="fld full"><label for="avt-ctr">Contratante e responsável</label><input id="avt-ctr" value="${esc(A.contratante || "")}" placeholder="quem contratou o laudo e o contato na empresa"></div></div>
        <div class="err" id="avt-err" hidden></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-x>Cancelar</button><button type="submit" class="btn primary">${s ? "Salvar" : "Cadastrar trabalho"}</button></div></form>`);
    let rf2 = null, ult = "";
    const consulta = async () => { const d = dig($("#avt-doc").value), st = $("#avt-rf"); if (d.length !== 14 || d === ult) return; ult = d;
      if (!IMP.docValido(d)){ st.textContent = "CNPJ inválido."; return; }
      const ja = S.suppliers.find(x => dig(x.doc) === d && x.id !== s?.id); if (ja){ st.innerHTML = `Já cadastrado: <b>${esc(ja.nome)}</b>. <a href="#" id="avt-usa" style="color:var(--glow)">usar este cadastro</a>`; $("#avt-usa").onclick = e => { e.preventDefault(); close(); S.ddSel = ja.id; renderView(); }; return; }
      st.textContent = "Consultando a Receita Federal…";
      try{ rf2 = await ORG.receita(d); $("#avt-doc").value = fmtCnpj(d); if (rf2.razao) $("#avt-nome").value = rf2.razao; if (!$("#avt-loc").value) $("#avt-loc").value = [rf2.logradouro, rf2.numero, rf2.bairro, [rf2.municipio, rf2.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
        st.textContent = `${rf2.situacao || ""} · ${rf2.cnae || ""} ${rf2.cnaeDesc || ""}`; }catch(e){ st.textContent = "Receita indisponível agora: siga com os dados; a consulta é refeita depois."; } };
    $("#avt-doc").oninput = consulta; $("#avt-doc").onchange = consulta;
    $("#avt-f").onsubmit = async e => { e.preventDefault(); const er = $("#avt-err"), nome = $("#avt-nome").value.trim(), db = $("#avt-db").value, d = dig($("#avt-doc").value);
      if (!s && (d.length !== 14 || !IMP.docValido(d))){ er.textContent = "Informe o CNPJ da empresa (14 números)."; er.hidden = false; return; }
      if (!nome || !db){ er.textContent = "Informe a razão social e a data-base."; er.hidden = false; return; }
      const at = {dataBase:db, finalidade:$("#avt-fin").value, local:$("#avt-loc").value.trim(), contratante:$("#avt-ctr").value.trim()};
      if (s){ await D.up(s, {ativos:at, ...(rf2 ? {receita:{...rf2, em:nowISO()}} : {})}); close(); toast("Dados do laudo salvos"); renderView(); return; }
      const id = "av" + Date.now().toString(36);
      await Store.set("suppliers", id, {nivel:"N3", nome, doc:fmtCnpj(d), tipo:"Cliente de avaliação de ativos", trabalho:"avaliacao", origem:"Avaliação de ativos (trabalho avulso)", pais:"Brasil", municipio:rf2?.municipio || "", uf:rf2?.uf || "", segmento:"", perfil:{}, etapa:"servico",
        ...(rf2 ? {receita:{...rf2, em:nowISO()}} : {}), ativos:at, answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), criadoPor:Store.me?.id || ""});
      if (window.KT_MAPA?.coords){ try{ const s2 = supById(id); if (s2){ const [lat, lng] = KT_MAPA.coords(s2); await Store.update("suppliers", id, {lat, lng}); } }catch(err){} }
      if (window.KT_CNPJ) KT_CNPJ.consultarTudo(id);
      close(); S.ddSel = id; toast("Trabalho novo cadastrado: importe a base de bens (CIB)"); renderView(); };
  }
  if (EXT_VIEWS.ativos){ const _v = EXT_VIEWS.ativos; EXT_VIEWS.ativos = function(){ const r = _v.apply(this, arguments); const host = $("#ativos"), s = D.alvoSel(); if (!host || $("#avt-trab", host)) return r;
      const col = host.querySelector(".dd-split > div:last-child"); if (!col) return r; const w = document.createElement("div"); w.innerHTML = card(s); const el = w.firstElementChild; col.prepend(el);
      $$("[data-atc]", el).forEach(b => b.onclick = () => { const k = b.dataset.atc; if (k === "nao") return form(null); if (k === "edit") return form(s);
        if (k === "sim"){ if (s && !novo(s)){ toast("Empresa da Órbita: os dados vêm do cadastro e do valuation"); return; } S.pastaAberta = true; renderView(); toast("Escolha a empresa da Órbita em Trocar"); } });
      if (s && !s.ativos?.dataBase && dataBaseAuto(s) && Store.me?.canWrite !== false) D.up(s, {ativos:{dataBase:dataBaseAuto(s)}}).catch(() => {});
      return r; }; }
  window.KT_ATVT = {form, card};
})();
/* trabalhos avulsos de avaliação de ativos não aparecem no globo da Órbita (não são empresas do M&A) */
(() => { const _f = window.ORB_FILTRO; window.ORB_FILTRO = s => s?.trabalho !== "avaliacao" && (!_f || _f(s)); })();
