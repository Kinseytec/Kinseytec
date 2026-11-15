/* ================= DECLINADOS =================
   Declinados saem da Órbita (globo e faixa) e das listas ativas da Base inicial.
   Ficam consultáveis em Base inicial > Declinados, com o motivo e o histórico, e podem ser retomados:
   ao retomar, voltam como empresa ativa (etapa e temperatura escolhidas) e o declínio anterior fica no histórico. */
(() => {
  const dec = s => s && (s.etapa === "descartada" || /declin/i.test(s.mapa?.temperatura || ""));
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const NIV = {N1:"Investidor", N2:"Intermediador", N3:"Target"};
  const dt = d => d ? new Date(d).toLocaleDateString("pt-BR") : "";
  const motivo = s => [s.motivoDescarte, s.mapa?.obs, s.mapa?.mandato].find(x => x && !/^\s*declinad[ao]s?\s*$/i.test(x)) || "";

  /* Órbita: só aparece se for a empresa selecionada (busca) */
  const _f = window.ORB_FILTRO; window.ORB_FILTRO = s => (!dec(s) || S.sel === s.id) && (!_f || _f(s));

  function lista(){ return S.suppliers.filter(dec).sort((a, b) => (a.nivel || "").localeCompare(b.nivel || "") || (a.nome || "").localeCompare(b.nome || "", "pt")); }

  function tabela(q){
    const L = lista().filter(s => !q || nrm([s.nome, s.doc, s.segmento, s.mapa?.segmentoTxt, motivo(s), s.uf].join(" ")).includes(nrm(q))), ed = window.KT_DD ? KT_DD.ed() : true;
    if (!L.length) return `<p class="sub">Nenhuma empresa declinada${q ? " para essa busca" : ""}.</p>`;
    return `<div class="tbl"><table class="dec-t"><thead><tr><th>Empresa</th><th>Tipo</th><th>Motivo do declínio</th><th>Histórico</th><th></th></tr></thead><tbody>${L.map(s => { const R = s.retomadas || [];
      return `<tr class="mb-row" data-mb="${s.id}"><td style="min-width:180px"><b>${esc(s.nome)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc([s.mapa?.segmentoTxt || s.segmento, [s.municipio, s.uf].filter(Boolean).join("/"), s.doc].filter(Boolean).join(" · "))}</div></td>
        <td style="font-size:12px">${NIV[s.nivel] || s.nivel}</td><td style="font-size:12px;max-width:300px">${esc(motivo(s).slice(0, 180)) || `<span class="sub">não informado</span>`}${s.declinadoEm ? `<div class="sub" style="margin:0;font-size:11px">em ${dt(s.declinadoEm)}</div>` : ""}</td>
        <td style="font-size:12px">${R.length ? `já retomado ${R.length}x · último em ${dt(R[R.length - 1].em)}` : ""}</td>
        <td>${ed ? `<button type="button" class="btn sm primary" data-decr="${s.id}">Retomar</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  function retomar(s){
    if (!s) return; const alvo = s.nivel === "N3";
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(s.nome)} · declinado</div><h2>Retomar ${alvo ? "como target" : "a empresa"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="dec-f" style="display:flex;flex-direction:column;gap:12px">
        ${motivo(s) ? `<div class="banner" style="font-size:13px"><b>Motivo do declínio:</b> ${esc(motivo(s))}</div>` : ""}
        <p class="sub" style="margin:0">A empresa volta para a Órbita e para as listas ativas${alvo ? ", indicações e consulta de investidores" : ""}. O declínio anterior fica guardado no histórico.</p>
        <div class="grid2" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">
          <div class="fld"><label for="dec-e">Etapa</label><select id="dec-e">${MA_FUNIL.filter(f => ["mapeada", "abordada", "reuniao", "nda"].includes(f[0])).map(([k, l]) => `<option value="${k}" ${k === "abordada" ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          <div class="fld"><label for="dec-t">Temperatura</label><select id="dec-t">${["Frio", "Morno", "Quente"].map(t => `<option ${t === "Morno" ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
        <div class="fld full"><label for="dec-m">Por que retomar</label><textarea id="dec-m" rows="3" required placeholder="Ex.: sócio voltou a ter interesse, nova rodada, mudança no faturamento, investidor interessado"></textarea></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Retomar ${alvo ? "como target" : ""}</button></div></form>`);
    $("#dec-f").onsubmit = async e => { e.preventDefault(); const m = $("#dec-m").value.trim(); if (!m) return;
      const reg = {em:nowISO(), por:Store.me?.email || "", motivo:m, motivoAnterior:motivo(s), etapa:$("#dec-e").value, temperatura:$("#dec-t").value};
      await save(Store.update("suppliers", s.id, {etapa:reg.etapa, motivoDescarte:"", mapa:{temperatura:reg.temperatura}, retomadas:[...(s.retomadas || []), reg], standby:{ativo:false}}));
      close(); toast(`${s.nome} retomado${alvo ? " como target" : ""}`); renderAll(); };
  }

  /* Base inicial: botão "Declinados" abre a consulta, com busca e Retomar */
  function painel(){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Declinados (${lista().length})</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><p class="sub" style="margin:0">Empresas declinadas não aparecem na Órbita nem nas indicações. Consulte o motivo e retome quando fizer sentido: a empresa volta como ativa e o declínio fica no histórico.</p>
        <input id="dec-q" placeholder="Buscar por nome, CNPJ, segmento ou motivo" aria-label="Buscar declinado"><div id="dec-box"></div></div>`);
    const pinta = () => { const box = $("#dec-box"); if (!box) return; box.innerHTML = tabela($("#dec-q").value);
      $$("[data-decr]", box).forEach(b => b.onclick = ev => { ev.stopPropagation(); close(); retomar(supById(b.dataset.decr)); });
      $$("[data-mb]", box).forEach(r => r.onclick = () => { close(); openSupplier(r.dataset.mb, "ma"); }); };
    $("#dec-q").oninput = pinta; pinta();
  }
  const _rc = renderCadeia; renderCadeia = function(){ const r = _rc.apply(this, arguments), sb = $("#bi-sb"); if (!sb || $("#bi-dec")) return r;
    const n = lista().length, b = document.createElement("button"); b.type = "button"; b.className = "btn sm"; b.id = "bi-dec"; b.textContent = `Declinados (${n})`; b.onclick = painel;
    const bv = $("#bi-sbv", sb); if (bv){ const w = document.createElement("div"); w.style.cssText = "display:flex;gap:6px;flex-wrap:wrap"; bv.replaceWith(w); w.append(bv, b); } else sb.appendChild(b);
    return r; };

  /* dossiê: aviso de declinado com o botão Retomar */
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); if (!dec(s)) return; const el = document.createElement("div"); el.className = "banner"; el.style.cssText = "display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap";
    el.innerHTML = `<span style="font-size:13px"><b>Declinado.</b> ${esc(motivo(s) || "Motivo não informado.")} Não aparece na Órbita nem nas listas ativas.</span>${(!window.KT_DD || KT_DD.ed()) ? `<button type="button" class="btn sm primary" data-decr2>Retomar</button>` : ""}`;
    const host = b.firstElementChild || b; host.insertBefore(el, host.firstChild); const bt = $("[data-decr2]", el); if (bt) bt.onclick = () => retomar(s); };

  const st = document.createElement("style"); st.textContent = `@media (max-width:760px){.dec-t thead{display:none}.dec-t tr{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:8px 0;border-bottom:1px solid var(--line)}.dec-t td{border:0!important;padding:2px 4px!important}.dec-t td:nth-child(1){grid-column:1}.dec-t td:nth-child(5){grid-column:2;grid-row:1}.dec-t td:nth-child(n+2):nth-child(-n+4){grid-column:1/-1}}`;
  document.head.appendChild(st);

  window.KT_DECL = {dec, lista, retomar, painel};
})();
