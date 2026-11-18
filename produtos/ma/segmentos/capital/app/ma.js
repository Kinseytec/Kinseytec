/* ================= KINSEY CAPITAL · M&A =================
   Só entra na construção do segmento M&A (produtos/ma/segmentos/capital/app/ma.js).
   - Órbita mundial: investidores (N1), intermediadores e parceiros (N2) e targets (N3), com cores por nível
     e ligações target → intermediador → Kinsey e target → investidores indicados.
   - Dossiê: aba M&A (tese do investidor, acordo do parceiro, financeiros, funil, mandato e acessos por investidor).
   - Jurídico: modelos padronizados Kinsey (NDA e mandatos), provisórios até o Jurídico incluir o texto oficial,
     controle de NDAs e mandatos por empresa e geração do documento preenchido (texto e PDF). */
if (typeof MA_MODELOS !== "undefined") (() => {
  const LVC = {N1:"#5AB0FF", N2:"#C39BFF", N3:"#3DDC97"}, CINZA = "#7A8699";
  const LVN = {N1:"Investidores", N2:"Intermediadores e parceiros", N3:"Targets (vendedores)"};
  const FUNIL = MA_FUNIL, etapaNome = k => (FUNIL.find(f => f[0] === k) || [k, k || "—"])[1];
  const ACESSO = [["convidado","Convidado"],["teaser","Teaser enviado"],["nda","NDA do mandato assinado"],["dataroom","Data room liberado"],["ioi","IOI enviada"],["loi","LOI"],["declinou","Declinou"]];
  const MAND_ST = [["minuta","Minuta em preparação"],["enviado","Enviado ao target"],["negociacao","Em negociação"],["assinado","Assinado"],["encerrado","Encerrado"]];
  const CODINOMES = ["Ipê","Aroeira","Jacarandá","Jatobá","Peroba","Cedro","Angico","Buriti","Carnaúba","Pau-brasil","Jequitibá","Sucupira","Imbuia","Copaíba","Andiroba"];
  const mi = v => v == null || v === "" ? "—" : "R$ " + fmt(+v, Math.abs(+v) < 10 ? 1 : 0) + " mi";
  const hoje = () => new Date().toLocaleDateString("pt-BR");
  const opt = (arr, cur) => arr.map(([k, l]) => `<option value="${esc(k)}" ${cur === k ? "selected" : ""}>${esc(l)}</option>`).join("");

  /* ---------------- ÓRBITA ---------------- */
  S.orbCor = "nivel";
  window.ORB_COR = s => S.orbCor === "risco" && s.nivel === "N3" ? null : (s.etapa === "descartada" ? CINZA : LVC[s.nivel]);
  /* rótulo curto na Órbita e na faixa: nome fantasia ou primeiro nome (o dossiê mostra o nome completo) */
  const GENERICO = /^(grupo|rede|cia|companhia|industria|indústria|comercio|comércio|laboratorio|laboratório|hospital|clinica|clínica|distribuidora|fazenda|fazendas|banco|fundo|instituto|associacao|associação|cooperativa|exemplo|the|de|do|da|e)$/i;
  const SUFIXO = /\b(ltda|s\.?\/?a\.?|sa|eireli|me|epp|s\/s|ltd|inc|llc|holding|participacoes|participações|administradora|servicos|serviços|empresariais|comercial|industrial)\b\.?/gi;
  const titulo = t => t.length <= 4 && t === t.toUpperCase() ? t : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  window.ORB_ROTULO = s => { const nome = String(s.nome || ""), fan = String(s.receita?.fantasia || "").trim(), linha = nome.includes(" · ") ? nome.split(" · ")[1].split(" ")[0] : "";
    const base = (fan && !/^[\W\d]*$/.test(fan) ? fan : nome.split(" · ")[0]).replace(/\(.*?\)/g, " ").replace(/\s[-–,].*$/, " ").replace(SUFIXO, " ").replace(/\s+/g, " ").trim();
    const W = base.split(" ").filter(Boolean).map(w => /^([A-Za-z]\.){2,}$/.test(w) ? w.replace(/\./g, "") : w); if (!W.length) return nome.slice(0, 14);
    let out = W[0]; const curto = W[0].replace(/\W/g, "").length <= 4;
    if (W.length === 2 && base.length <= 16) out = W.join(" "); else if ((GENERICO.test(W[0]) || curto) && W[1]) out = /^(de|do|da)$/i.test(W[1]) && W[2] ? W[0] + " " + W[2] : W[0] + " " + W[1];
    if (linha) out += " " + linha;
    return out.split(" ").map(titulo).join(" ").slice(0, 20); };
  /* cores Kinsey: fundo navy nas telas de trabalho (o preto do espaço fica só na Órbita) */
  { const st = document.createElement("style"); st.textContent = `.view:not(#v-orbita){background:linear-gradient(180deg,#022B63 0%,var(--navy) 38%,#011A40 100%)}
.view:not(#v-orbita) .card{background:#0A2D60;border-color:rgba(150,190,240,.22)}
.view:not(#v-orbita) .card .card{background:#0D3570}
.view:not(#v-orbita) .tbl tbody tr:hover,.view:not(#v-orbita) .mb-row:hover{background:rgba(79,176,245,.08)}
.view:not(#v-orbita) input,.view:not(#v-orbita) select,.view:not(#v-orbita) textarea{background:#01183D}
.view:not(#v-orbita) .dd-k{background:rgba(1,24,61,.55)}`; document.head.appendChild(st); }
  /* legenda compacta (também no celular) */
  setTimeout(() => { const v = $("#v-orbita"); if (!v || $("#orb-leg")) return; const el = document.createElement("div"); el.id = "orb-leg";
    el.innerHTML = `<span><i style="background:${LVC.N3};border-radius:50%"></i>Target</span><span><i style="background:${LVC.N1};transform:rotate(45deg)"></i>Investidor</span><span><i style="background:${LVC.N2}"></i>Intermediador</span>`;
    v.appendChild(el); const st = document.createElement("style"); st.textContent = `#orb-leg{position:absolute;left:12px;top:64px;z-index:6;display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--fog);background:rgba(1,20,48,.72);border:1px solid var(--line-2);border-radius:10px;padding:5px 9px;pointer-events:none}
#orb-leg span{display:inline-flex;align-items:center;gap:5px}#orb-leg i{display:inline-block;width:8px;height:8px}
@media (min-width:761px){#orb-leg{top:auto;left:auto;right:16px;bottom:118px;z-index:2}} /* no computador fica à direita, longe do quadro do dossiê */`; document.head.appendChild(st); }, 300);
  const lvlUi = () => {
    const g = $(".lvl"); if (!g || g.dataset.ma) return; g.dataset.ma = "1";
    const st = document.createElement("style"); st.textContent = ".lvl button{width:auto;white-space:nowrap;display:flex;flex-direction:row;align-items:center;gap:6px;justify-content:flex-start}#ma-cor{opacity:1}"; document.head.appendChild(st);
    /* busca da órbita: textos do M&A */
    $$("#v-orbita *").forEach(e => { if (e.children.length === 0 && /Análise prévia do fornecedor/.test(e.textContent)) e.textContent = e.textContent.replace("Análise prévia do fornecedor", "Análise prévia da empresa"); });
    $$("#v-orbita input[placeholder]").forEach(i => i.placeholder = i.placeholder.replace(/do fornecedor/g, "da empresa (investidor, parceiro ou target)"));
    const nomes = {N1:"Investidores", N2:"Intermediadores e parceiros", N3:"Targets (vendedores)"};
    $$("[data-lv]", g).forEach(b => { const l = b.dataset.lv; if (nomes[l]) b.innerHTML = `<span class="ma-gl" data-gl="${l}">${l === "N1" ? "◆" : l === "N2" ? "■" : "●"}</span> ${nomes[l]}`; });
    const c = document.createElement("button"); c.type = "button"; c.id = "ma-cor"; c.setAttribute("aria-pressed", "false");
    const pinta = () => { c.textContent = S.orbCor === "risco" ? "COR: RISCO" : "COR: NÍVEL"; c.setAttribute("aria-pressed", String(S.orbCor === "risco"));
      $$("[data-gl]", g).forEach(x => x.style.color = S.orbCor === "risco" ? "" : LVC[x.dataset.gl]); };
    c.onclick = () => { S.orbCor = S.orbCor === "risco" ? "nivel" : "risco"; pinta(); G.dirty = true; }; g.appendChild(c); pinta();
  };
  setTimeout(lvlUi, 0);
  /* ligações próprias do M&A, desenhadas por cima das rotas do núcleo */
  /* ligações da rede: N1 investidor → N2 intermediador (ou a própria Kinsey Capital) → N3 target.
     O núcleo desenha N3 → N2 (quem trouxe o target); aqui o M&A desenha N1 → N2 para cada investidor indicado ao target
     (ou N1 → N3 quando o target não tem intermediador). Ao selecionar um ponto, a cadeia inteira dele fica em destaque. */
  EXT_ORB.push((ctx, now, list) => {
    if (!S.lv.rotas || !S.lv.N1) return; const vis = new Set(list.map(s => s.id)), feitos = new Set();
    ctx.setLineDash([3, 5]); ctx.lineDashOffset = G.reduce ? 0 : now / 80;
    list.filter(t => t.nivel === "N3" && t.etapa !== "descartada" && (t.investidores || []).length).forEach(t => {
      const n2 = t.parentId && vis.has(t.parentId) ? supById(t.parentId) : null;
      t.investidores.forEach(id => { const v = supById(id); if (!v || v.lat == null || !vis.has(id)) return; const alvo = n2 || t, k = id + "|" + alvo.id, on = !!S.sel && [id, t.id, alvo.id].includes(S.sel);
        if (feitos.has(k) && !on) return; feitos.add(k);
        ctx.beginPath(); G.path({type:"LineString", coordinates:[[v.lng, v.lat], [alvo.lng, alvo.lat]]});
        ctx.strokeStyle = on ? "rgba(242,193,78,.95)" : S.sel ? "rgba(242,193,78,.12)" : "rgba(242,193,78,.42)"; ctx.lineWidth = on ? 2 : 1.1; ctx.stroke();
        if (on && n2){ ctx.beginPath(); G.path({type:"LineString", coordinates:[[n2.lng, n2.lat], [t.lng, t.lat]]}); ctx.stroke(); } }); });
    ctx.setLineDash([]);
  });
  /* cartão da órbita: resumo M&A da empresa */
  EXT_TARGET.push((s, el) => {
    const box = document.createElement("div"); box.style.cssText = "grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--muted)";
    const it = (k, v) => `<span><b style="color:var(--ink,inherit);font-weight:600">${esc(k)}</b> ${v}</span>`;
    const h = [];
    if (s.nivel === "N3"){
      h.push(it("Etapa", `<span class="pill ${s.etapa === "descartada" ? "r-alto" : "r-pend"}" style="font-size:10.5px;padding:1px 8px">${esc(etapaNome(s.etapa))}</span>`));
      if (s.segmento) h.push(it("Segmento", esc(s.segmento)));
      if (s.fin) h.push(it("Receita", mi(s.fin.receita)), it("EBITDA", mi(s.fin.ebitda)));
      if (s.mandato?.codinome) h.push(it("Mandato", `${esc(s.mandato.codinome)} · ${esc((MAND_ST.find(m => m[0] === s.mandato.status) || ["", "—"])[1])}`));
      const inv = (s.investidores || []).map(supById).filter(Boolean); if (inv.length) h.push(it("Investidores indicados", esc(inv.map(v => v.nome.replace(/^EXEMPLO /, "")).join(", "))));
    } else if (s.nivel === "N1"){
      const t = s.tese || {}; if (t.segmentos?.length) h.push(it("Tese", esc(t.segmentos.join(", "))));
      if (t.ticketMin || t.ticketMax) h.push(it("Ticket", `${mi(t.ticketMin)} a ${mi(t.ticketMax)}`));
      if (t.participacao?.length) h.push(it("Participação", esc(t.participacao.join(", "))));
      const ops = S.suppliers.filter(x => (x.investidores || []).includes(s.id)); if (ops.length) h.push(it("Oportunidades", String(ops.length)));
    } else {
      if (s.acordo?.status) h.push(it("Acordo", esc(s.acordo.status) + (s.acordo.fee ? ` · ${esc(s.acordo.fee)}` : "")));
      const tg = S.suppliers.filter(x => x.parentId === s.id); h.push(it("Targets originados", String(tg.length)));
    }
    h.push(it("NDA", s.nda?.aceito ? "assinado" : "pendente"));
    box.innerHTML = h.join(""); const ph = el.querySelector(".photos"); if (ph) ph.replaceWith(box); else el.appendChild(box);
  });

  /* ---------------- INDICADORES DE MERCADO (barra do topo) ---------------- */
  renderPriceBar = function(){
    const p = S.config.precos || {}, br = {...(p.br || {})}, el = $("#pricebar"); if (!el) return;
    const M = S.mercado?.atual, auto = M ? {SELIC:M.selic, IPCA:M.ipca12, DOLAR:M.ptax, IBOV:M.ibov} : {}; Object.entries(auto).forEach(([k, v]) => { if (v != null) br[k] = {valor:fmt(v, k === "IBOV" ? 0 : 2), data:M.em}; });
    const shown = PRECO.bar.filter(k => br[k]?.valor), fm = (k, v) => k === "DOLAR" || k === "EURO" ? "R$ " + v : k === "IBOV" ? v : v + "%";
    el.innerHTML = shown.length ? `<span class="lab"><i></i>Mercado</span>${shown.map((k, i) => `<span class="px ${i > 1 ? "hide-sm" : ""}"><span>${esc(PRECO.barLabel[k] || k)}</span><b>${esc(fm(k, br[k].valor))}</b></span>`).join("")}<span class="px hide-sm" style="color:var(--muted)">${br[shown[0]]?.data ? "em " + esc(br[shown[0]].data) : ""}</span><span class="more">Indicadores ›</span>`
      : `<span class="lab"><i class="old"></i>Mercado</span><span class="px" style="color:var(--muted)">Indicadores ainda não registrados</span><span class="more">Registrar ›</span>`;
  };

  /* ---------------- MODELOS (NDA e mandatos) ---------------- */
  const NDA_PROV = NDA_TEXT.slice(), NDA_VPROV = NDA_VERSION;
  const ov = () => S.config.modelos_ma || {};
  const modelo = id => { const m = MA_MODELOS.find(x => x.id === id); if (!m) return null; const o = ov()[id];
    return o?.texto?.length ? {...m, texto:o.texto, versao:o.versao || "oficial", oficial:true, em:o.em} : {...m, texto: id === "nda_geral" ? NDA_PROV : m.texto, oficial:!!m.base}; };
  const syncNda = () => { const m = modelo("nda_geral"); NDA_TEXT.splice(0, NDA_TEXT.length, ...m.texto); NDA_VERSION = m.oficial ? "NDA Kinsey Capital · " + m.versao : NDA_VPROV; };
  const _rl = renderLgpd; renderLgpd = function(s, b){ syncNda(); return _rl(s, b); };
  const campos = (s, extra = {}) => { const md = extra.mand || s.mandato || {}, H = window.KT_HON ? KT_HON.campos(s, s.lado === "compra" || s.nivel === "N1" ? "compra" : "venda") : {};
    return {EMPRESA:s.nome || "[empresa]", DOC:s.doc || "[CNPJ / registro]", REPRESENTANTE:s.nda?.nome || s.responsavel || "[representante]", CODINOME:md.codinome || "[nome-código]",
      PARTICIPACAO:md.participacao || "[participação]", EXCLUSIVIDADE:md.exclusividade || "[exclusividade]", PRAZO:md.prazo || "[prazo]", RETAINER:md.retainer || H.RETAINER || "[retainer]",
      SUCCESS:md.success || s.acordo?.fee || H.SUCCESS || "[success fee]", TAIL:H.TAIL || "12", DATA:hoje(), ...(window.KT_MAND && s.nivel === "N3" ? KT_MAND.campos(s) : {}), ...(window.KT_OPDOC && s.nivel === "N3" ? KT_OPDOC.campos(s) : {})}; };
  const preenche = (txt, c) => String(txt).replace(/\{([A-Z]+)\}/g, (m, k) => c[k] != null ? c[k] : m);
  const textoPlano = (m, c) => `${m.titulo.toUpperCase()}\n${m.oficial ? "Versão oficial " + m.versao : "MODELO PROVISÓRIO — substituir pelo modelo oficial Kinsey"}\n\n` + m.texto.map(([h, t]) => `${preenche(h, c)}\n${preenche(t, c)}`).join("\n\n") + `\n\n\n______________________________          ______________________________\n${c.EMPRESA}          Kinsey Capital`;
  const mandatos = () => S.suppliers.filter(x => x.nivel === "N3" && x.mandato?.codinome);
  function copiar(txt, btn){
    const ok = () => { const t0 = btn.textContent; btn.textContent = "Copiado"; setTimeout(() => btn.textContent = t0, 1500); };
    try{ navigator.clipboard.writeText(txt).then(ok, () => { const ta = btn.closest(".sheet-b")?.querySelector("textarea"); if (ta){ ta.focus(); ta.select(); } toast("Selecione e copie o texto"); }); }catch(e){ toast("Selecione e copie o texto"); }
  }
  async function pdf(m, c){
    const P = KTPdf(); P.page();
    P.para("Kinsey Capital", {size:9, bold:true, color:[4,115,195], gap:2});
    P.para(m.titulo, {size:15, bold:true, color:[1,31,75], gap:2});
    P.para(m.oficial && m.versao ? `Modelo Kinsey · ${m.versao}` : "Modelo Kinsey", {size:8.5, color:[90,101,120], gap:12});
    m.texto.forEach(([h, t]) => { P.para(preenche(h, c), {size:10.5, bold:true, gap:2}); preenche(t, c).split("\n").forEach((x, i, a) => P.para(x, {size:9.5, gap:i === a.length - 1 ? 9 : 4})); });
    P.y += 30; P.ensure(60); const y = P.y + 30, W2 = (P.CW - 30) / 2;
    P.line(P.M, y, P.M + W2, y, [27,36,51], .6); P.line(P.M + W2 + 30, y, P.M + P.CW, y, [27,36,51], .6);
    P.text(P.M, y + 12, c.EMPRESA.slice(0, 48), 8.5); P.text(P.M + W2 + 30, y + 12, "Kinsey Capital", 8.5);
    const bytes = P.out(m.titulo, `Kinsey Capital · ${m.titulo} · ${m.oficial ? m.versao : "modelo provisório"} · confidencial`);
    await rptSave(bytes, `Kinsey_${m.id}_${(c.EMPRESA || "").replace(/[^\w]+/g, "_").slice(0, 40)}.pdf`, "application/pdf");
  }
  /* Word preenchido: NDA (Jurídico · NDA), mandato e MOU/SPA usam o emissor próprio; os demais saem do texto do modelo */
  async function word(s, id, man){
    if (/^nda_/.test(id) && window.KT_NDA){ if (id === "nda_mandato") S.ndaMand = man?.id || ""; return KT_NDA.emitir(s, id === "nda_mandato" ? "mandato" : "geral"); }
    if (id === "mandato_venda" && window.KT_MAND?.emitirModelo && s.nivel === "N3") return KT_MAND.emitirModelo(s);
    if ((id === "mou_venda" || id === "spa_venda") && window.KT_OPDOC?.emitir && s.nivel === "N3") return KT_OPDOC.emitir(s, id === "mou_venda" ? "MOU" : "SPA");
    const m = modelo(id), c = campos(s, {mand:man?.mandato}), P = [];
    P.push({t:m.titulo.toUpperCase(), b:true, jc:"center", sz:26, after:240});
    m.texto.forEach(([h, t]) => { if (h) P.push({t:preenche(h, c), b:true, keep:true, before:160}); preenche(t, c).split("\n").forEach(l => l.trim() && P.push({t:l})); });
    const ass = n => { P.push({t:"______________________________________________", jc:"left", before:420, after:0}); P.push({t:n, b:true, jc:"left"}); };
    ass(c.EMPRESA); ass(window.KT_MARCA && !KT_MARCA.kinsey() ? "[ASSESSORIA]" : "KINSEY BR");
    const bytes = KT_DOCX.build(P, {header:`${m.titulo} · ${c.EMPRESA} · confidencial`, headerColor:"5A6578", titulo:`${m.titulo} · ${c.EMPRESA}`});
    await rptSave(bytes, `${m.id}_${String(c.EMPRESA || "").replace(/[^\wÀ-ú]+/g, "_").slice(0, 40)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }
  function gerar(s, id){
    const ms = MA_MODELOS.filter(x => x.para.includes(s.nivel)); id = id || ms[0]?.id; if (!id){ toast("Nenhum modelo para este nível."); return; }
    const precisaMand = s.nivel !== "N3" && /\{CODINOME\}/.test(JSON.stringify(modelo(id).texto));
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Jurídico · modelos Kinsey</div><h2>${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        <div class="form"><div class="fld"><label for="g-mod">Modelo</label><select id="g-mod">${opt(ms.map(x => [x.id, x.titulo]), id)}</select></div>
        ${precisaMand ? `<div class="fld"><label for="g-man">Mandato</label><select id="g-man">${opt(mandatos().map(x => [x.id, x.mandato.codinome]), "")}</select></div>` : ""}</div>
        <div id="g-dados"></div><div id="g-aviso"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="g-word">Emitir em Word</button><button type="button" class="btn" id="g-pdf">Baixar PDF</button><button type="button" class="btn ghost" id="g-cp">Copiar texto</button></div>
        <details><summary class="sub" style="cursor:pointer">Ver o texto</summary><textarea id="g-txt" rows="16" style="width:100%;margin-top:8px;font-family:var(--mono,monospace);font-size:12.5px;line-height:1.5;background:transparent;color:inherit;border:1px solid var(--line);border-radius:8px;padding:10px" aria-label="Texto do documento"></textarea></details>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${s.nivel === "N3" && /^mandato/.test(id) ? `<button type="button" class="btn ghost" id="g-reg">Registrar mandato</button>` : ""}</div></div>`);
    const atual = () => { const m = modelo($("#g-mod").value), man = $("#g-man") ? supById($("#g-man").value) : null; return {m, c: campos(s, {mand: man?.mandato})}; };
    const pinta = () => { const {m, c} = atual(); $("#g-txt").value = textoPlano(m, c).replace(/^MODELO PROVISÓRIO[^\n]*\n/m, "");
      const P0 = window.KT_MAND && s.nivel === "N3" ? KT_MAND.partes(s) : null, rf = s.receita && !s.receita.erro ? s.receita : {};
      const lin = (k, v) => v ? `<tr><td style="white-space:nowrap">${k}</td><td>${/^\[/.test(String(v)) ? `<span class="pill r-alto">a completar</span> <span class="sub" style="font-size:12px">${esc(v)}</span>` : esc(v)}</td></tr>` : "";
      let rows = lin("Razão social", P0?.EMPRESA || rf.razao || s.nome) + lin("CNPJ", P0?.DOC || s.doc || "[CNPJ]") + lin("Endereço", P0?.ENDERECO) + lin("Representante", P0?.REPRESENTANTE || c.REPRESENTANTE) + (P0?._socios?.length ? lin("Sócios", P0._socios.map(p => p.nome).join("; ")) : "");
      if (/^mandato/.test(m.id) && window.KT_MAND && s.nivel === "N3"){ const R = KT_MAND.calc(s), P = R.B ? KT_MAND.parcelas(s, R) : [];
        rows += lin("Success fee", `${R.c.pct}% do valor da transação`) + lin("Operação mínima", R.B ? `${KT_MAND.brl(R.vmin)} (${R.B.fonte})` : "[valuation ou faturamento do target]") + lin("Sucesso mínimo", R.B ? KT_MAND.brl(R.sucMin) : "") + lin("Retainer sugerido", R.B ? `${KT_MAND.brl(R.ret)} em ${R.c.parcelas} parcelas de ${KT_MAND.brl(R.parc)}, a 1ª ${R.c.dias} dias após o primeiro NDA com investidor` : "");
        const so = s.projeto?.socio || s.projeto?.socioMandato || ""; if (so) rows += lin("Sócio responsável (Kinsey)", so); }
      $("#g-dados").innerHTML = `<div class="tbl"><table><tbody>${rows}</tbody></table></div><p class="sub" style="margin:4px 0 0;font-size:12px">Dados da Receita Federal e do cadastro; o que faltar sai marcado no Word.</p>`;
      $("#g-aviso").innerHTML = `<p class="sub" style="margin:0;font-size:12.5px">Modelo Kinsey validado pelo Jurídico${m.oficial && m.versao ? ` · ${esc(m.versao)}` : ""}: o consultor pode emitir e enviar.</p>`;
      const faltam = [...new Set((JSON.stringify(m.texto).match(/\{[A-Z]+\}/g) || []).filter(k => /^\[/.test(c[k.slice(1, -1)] || "")))];
      if (faltam.length) $("#g-aviso").insertAdjacentHTML("beforeend", `<p class="sub" style="margin:6px 0 0">Campos a completar: ${faltam.map(esc).join(", ")}${s.nivel === "N3" ? " (preencha na aba M&A do dossiê)" : ""}.</p>`); };
    $("#g-mod").onchange = pinta; if ($("#g-man")) $("#g-man").onchange = pinta; pinta();
    $("#g-cp").onclick = e => copiar($("#g-txt").value, e.currentTarget);
    $("#g-pdf").onclick = () => { const {m, c} = atual(); pdf(m, c).catch(() => toast("Não foi possível gerar o PDF.")); };
    $("#g-word").onclick = async e => { const bt = e.currentTarget, man = $("#g-man") ? supById($("#g-man").value) : null; bt.disabled = true; bt.textContent = "Gerando…";
      try{ await word(supById(s.id) || s, $("#g-mod").value, man); toast("Documento emitido em Word"); }catch(x){ console.error(x); toast("Não foi possível emitir o Word."); } bt.disabled = false; bt.textContent = "Emitir em Word"; };
    const r = $("#g-reg"); if (r) r.onclick = () => { close(); openSupplier(s.id, "ma"); };
  }
  function editarModelo(id){
    const m = modelo(id), txt = m.texto.map(([h, t]) => `${h}\n${t}`).join("\n\n");
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Modelo oficial Kinsey</div><h2>${esc(m.titulo)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fmod" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <p class="sub" style="margin:0">Cole o texto oficial. Cada cláusula é um bloco: título na primeira linha e o texto nas linhas seguintes, com uma linha em branco entre as cláusulas. Campos que o sistema preenche: {EMPRESA}, {DOC}, {ENDERECO}, {ATIVIDADE}, {SOCIOS}, {KINSEY}, {REPRESENTANTE}, {CODINOME}, {PARTICIPACAO}, {EXCLUSIVIDADE}, {PRAZO}, {RESILICAO}, {TAIL}, {RETAINER}, {SUCCESS}, {SUCPCT}, {VALORMIN}, {BASEMIN}, {SUCMIN}, {RETPCT}, {RETTOTAL}, {PARCELAS}, {PARCELA}, {RETDIAS}, {TRIBUTOS}, {DATABASE}, {DATA}.</p>
        <div class="form"><div class="fld"><label for="m-ver">Versão</label><input id="m-ver" value="${esc(m.oficial ? m.versao : "")}" placeholder="ex.: v1.0 · aprovada em ${hoje()}"></div></div>
        <textarea id="m-txt" rows="20" style="width:100%;font-size:13px;line-height:1.5;background:transparent;color:inherit;border:1px solid var(--line);border-radius:8px;padding:10px" aria-label="Texto do modelo">${esc(m.oficial ? txt : "")}</textarea>
        <details><summary class="sub">Ver o texto provisório atual</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(MA_MODELOS.find(x => x.id === id).texto === NDA_TEXT ? NDA_PROV.map(([h, t]) => h + "\n" + t).join("\n\n") : MA_MODELOS.find(x => x.id === id).texto.map(([h, t]) => h + "\n" + t).join("\n\n"))}</pre></details>
        <p class="err" id="m-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar como modelo oficial</button></div></form>`);
    $("#fmod").onsubmit = e => { e.preventDefault();
      const blocos = $("#m-txt").value.replace(/\r/g, "").split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => { const [h, ...r] = b.split("\n"); return [h.trim(), r.map(x => x.trim()).filter(Boolean).join("\n")]; });
      const ver = $("#m-ver").value.trim();
      if (!blocos.length || !ver){ $("#m-err").textContent = !ver ? "Informe a versão do modelo oficial." : "Cole o texto do modelo."; $("#m-err").hidden = false; return; }
      save(Store.set("config", "modelos_ma", {...ov(), [id]: {versao:ver, texto:blocos, em:nowISO(), por:Store.me?.email || Store.me?.id || ""}})).then(() => { close(); toast("Modelo oficial salvo"); }); };
  }
  function restaurar(id){ const o = {...ov()}; delete o[id]; save(Store.set("config", "modelos_ma", o)).then(() => toast("Voltou ao modelo provisório")); }

  /* ---------------- JURÍDICO ---------------- */
  S.maJur = S.maJur || "N3";
  /* entra no topo do Jurídico, depois da reorganização feita pelos outros módulos */
  const _jurMA = renderJuridico;
  renderJuridico = function(){ _jurMA.apply(this, arguments); try{ jurMA(); }catch(e){ console.error(e); } };
  function jurMA(){
    const host = $("#juridico"); if (!host) return; syncNda();
    const ed = Store.me.canEdit;
    const statusDoc = s => {
      if (s.nivel === "N3"){ const m = s.mandato; return m?.status ? `<span class="pill ${m.status === "assinado" ? "r-baixo" : "r-medio"}">${esc((MAND_ST.find(x => x[0] === m.status) || ["", m.status])[1])}</span>${m.codinome ? ` <span class="mono" style="font-size:12px">${esc(m.codinome)}</span>` : ""}` : `<span class="pill r-pend">Sem mandato</span>`; }
      if (s.nivel === "N1"){ const n = S.suppliers.filter(x => ["nda","dataroom","ioi","loi"].includes(x.mandato?.acessos?.[s.id]?.status)).map(x => x.mandato.codinome); return n.length ? `<span class="pill r-baixo">NDA de mandato: ${n.length}</span> <span class="sub" style="font-size:12px">${esc(n.join(", "))}</span>` : `<span class="pill r-pend">Nenhum NDA de mandato</span>`; }
      const a = s.acordo?.status; return a ? `<span class="pill ${/assinado|interno/.test(a) ? "r-baixo" : "r-medio"}">Acordo ${esc(a)}</span>` : `<span class="pill r-pend">Sem acordo</span>`; };
    const lista = S.suppliers.filter(s => s.nivel === S.maJur).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt"));
    const card = document.createElement("div"); card.style.cssText = "display:flex;flex-direction:column;gap:16px"; card.id = "ma-jur";
    card.innerHTML = `
      <div class="card" style="display:flex;flex-direction:column;gap:12px">
        <div class="head"><div><div class="eyebrow">Jurídico · Kinsey Capital</div><h3>Modelos padronizados Kinsey</h3>
          <p class="sub">NDA e mandatos usados em todas as operações. Enquanto o Jurídico não incluir o texto oficial, o sistema usa o modelo provisório e marca os documentos gerados como provisórios.</p></div></div>
        <div class="tbl"><table><thead><tr><th>Modelo</th><th>Para</th><th>Versão</th><th></th></tr></thead><tbody>${MA_MODELOS.map(x => { const m = modelo(x.id);
          return `<tr><td style="min-width:220px"><b>${esc(m.titulo)}</b><div class="sub" style="margin:2px 0 0;font-size:12px">${esc(m.uso)}</div></td><td style="white-space:nowrap">${m.para.map(l => `<span class="mono" style="color:${LVC[l]}">${l}</span>`).join(" ")}</td>
            <td style="white-space:nowrap">${m.oficial ? `<span class="pill r-baixo">Oficial</span> <span class="sub" style="font-size:12px">${esc(m.versao)}</span>` : `<span class="pill r-medio">Provisório</span>`}</td>
            <td style="white-space:nowrap;text-align:right"><button type="button" class="btn sm" data-mver="${x.id}">Ver</button>${ed ? ` <button type="button" class="btn sm ${m.oficial ? "" : "primary"}" data-medit="${x.id}">${m.oficial ? "Atualizar" : "Incluir oficial"}</button>${m.oficial ? ` <button type="button" class="btn sm ghost" data-mrest="${x.id}">Provisório</button>` : ""}` : ""}</td></tr>`; }).join("")}</tbody></table></div>
      </div>
      <div class="card" style="display:flex;flex-direction:column;gap:12px">
        <div class="head"><div><h3>NDAs, mandatos e acordos por empresa</h3><p class="sub">NDA geral de cada empresa, mandato de cada target, NDAs de mandato de cada investidor e acordo de cada parceiro. "Gerar" preenche o modelo com os dados do cadastro.</p></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${["N3","N1","N2"].map(l => `<button type="button" class="fbtn" data-majur="${l}" aria-pressed="${S.maJur === l}"><span style="color:${LVC[l]}">${l === "N1" ? "◆" : l === "N2" ? "■" : "●"}</span> ${LVN[l]} <b>${S.suppliers.filter(s => s.nivel === l).length}</b></button>`).join("")}</div>
        <div class="tbl"><table><thead><tr><th>Empresa</th><th>NDA geral</th><th>${S.maJur === "N3" ? "Mandato" : S.maJur === "N1" ? "NDAs de mandato" : "Acordo de originação"}</th><th></th></tr></thead><tbody>${lista.length ? lista.map(s => `<tr>
          <td style="min-width:200px"><b>${esc(s.nome)}</b><div class="sub" style="margin:2px 0 0;font-size:12px">${esc(s.tipo || "")}${s.nivel === "N3" ? " · " + esc(etapaNome(s.etapa)) : ""}${s.pais && s.pais !== "Brasil" ? " · " + esc(s.pais) : ""}</div></td>
          <td style="white-space:nowrap">${s.nda?.aceito ? `<span class="pill r-baixo">Assinado</span>${s.nda.validado ? "" : ` <span class="sub" style="font-size:11.5px">a validar</span>`}` : `<span class="pill r-alto">Pendente</span>`}</td>
          <td>${statusDoc(s)}</td>
          <td style="white-space:nowrap;text-align:right"><button type="button" class="btn sm primary" data-mger="${s.id}">Gerar</button> <button type="button" class="btn sm" data-mdos="${s.id}">Dossiê</button></td></tr>`).join("") : `<tr><td colspan="4" class="sub">Nenhuma empresa neste nível.</td></tr>`}</tbody></table></div>
      </div>`;
    const anchor = $("#jur-bar", host) || host.querySelector(".head"); if (anchor) anchor.after(card); else host.prepend(card);
    $$("[data-majur]", card).forEach(b => b.onclick = () => { S.maJur = b.dataset.majur; renderJuridico(); });
    $$("[data-mger]", card).forEach(b => b.onclick = () => gerar(supById(b.dataset.mger)));
    $$("[data-mdos]", card).forEach(b => b.onclick = () => openSupplier(b.dataset.mdos, "ma"));
    $$("[data-medit]", card).forEach(b => b.onclick = () => editarModelo(b.dataset.medit));
    $$("[data-mrest]", card).forEach(b => b.onclick = () => restaurar(b.dataset.mrest));
    $$("[data-mver]", card).forEach(b => b.onclick = () => { const m = modelo(b.dataset.mver);
      sheet(`<div class="sheet-h"><div><div class="eyebrow">${m.oficial ? "Modelo oficial · " + esc(m.versao) : "Modelo provisório"}</div><h2>${esc(m.titulo)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
        <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">${m.oficial ? "" : `<div class="banner"><b>Provisório.</b> Texto de partida até o Jurídico incluir o modelo oficial Kinsey.</div>`}${m.texto.map(([h, t]) => `<div><h3 style="font-size:14px">${esc(h)}</h3><p style="margin:4px 0 0;font-size:13.5px;line-height:1.55">${esc(t)}</p></div>`).join("")}</div>`); });
  }

  /* ---------------- DOSSIÊ · aba M&A ---------------- */
  TABS.splice(1, 0, ["ma", "M&A"]);
  EXT_TABS.ma = (s, b) => {
    syncNda(); const ed = Store.me.canWrite !== false, up = patch => save(Store.update("suppliers", s.id, patch));
    const N1s = S.suppliers.filter(x => x.nivel === "N1"), N2s = S.suppliers.filter(x => x.nivel === "N2");
    const fld = (id, l, v, o = {}) => `<div class="fld ${o.full ? "full" : ""}"><label for="${id}">${l}</label><input id="${id}" value="${esc(v ?? "")}" ${o.num ? 'inputmode="decimal"' : ""} ${ed ? "" : "disabled"} placeholder="${esc(o.ph || "")}"></div>`;
    const n = v => { const x = parseFloat(String(v).replace(/\./g, "").replace(",", ".")); return isFinite(x) ? x : ""; };
    let h = `<div class="head"><div><h3>${s.nivel === "N1" ? "Tese de investimento" : s.nivel === "N2" ? "Acordo de originação e parceria" : "Target · funil, financeiros e mandato"}</h3>
      <p class="sub">${s.nivel === "N3" ? "Etapa do funil, números principais, intermediador, mandato e investidores indicados." : s.nivel === "N1" ? "Usada para indicar oportunidades (matching) e para o mandato de compra." : "Remuneração e situação do acordo com a Kinsey."}</p></div>
      <button type="button" class="btn sm primary" id="ma-ger">Documentos no Jurídico</button></div>`;
    if (s.nivel === "N1"){ const t = s.tese || {};
      h += `<form id="ma-f" class="form" novalidate>${fld("t-seg", "Segmentos de interesse", (t.segmentos || []).join(", "), {full:1, ph:"ex.: Saúde, Tecnologia"})}${fld("t-cnae", "CNAEs (divisões)", (t.cnaes || []).join(", "), {ph:"ex.: 62, 86"})}
        ${fld("t-reg", "Regiões", (t.regioes || []).join(", "), {ph:"ex.: Brasil, Sudeste"})}${fld("t-fmin", "Faturamento mín. (R$ mi)", t.fatMin, {num:1})}${fld("t-fmax", "Faturamento máx. (R$ mi)", t.fatMax, {num:1})}
        ${fld("t-emin", "EBITDA mín. (R$ mi)", t.ebitdaMin, {num:1})}${fld("t-part", "Participação buscada", (t.participacao || []).join(", "), {ph:"Minoritária, Controle, 100%"})}
        ${fld("t-tmin", "Ticket mín. (R$ mi)", t.ticketMin, {num:1})}${fld("t-tmax", "Ticket máx. (R$ mi)", t.ticketMax, {num:1})}
        ${fld("t-res", "Restrições", t.restricoes, {full:1, ph:"ex.: não investe em agro"})}${fld("t-ct", "Contato", s.contato, {full:1})}
        ${ed ? `<div class="fld full"><button type="submit" class="btn sm" style="align-self:flex-start">Salvar tese</button></div>` : ""}</form>`;
      const ops = S.suppliers.filter(x => (x.investidores || []).includes(s.id));
      h += `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Oportunidades indicadas (${ops.length})</h3>${ops.length ? `<div class="tbl"><table><thead><tr><th>Target</th><th>Etapa</th><th>Acesso</th></tr></thead><tbody>${ops.map(x => { const ac = x.mandato?.acessos?.[s.id], semNda = !["nda","dataroom","ioi","loi"].includes(ac?.status);
          return `<tr><td>${x.mandato?.codinome && semNda ? `<b>${esc(x.mandato.codinome)}</b> <span class="sub" style="font-size:12px">· nome protegido até o NDA do mandato</span>` : esc(x.nome)}</td><td>${esc(etapaNome(x.etapa))}</td><td>${esc((ACESSO.find(a => a[0] === ac?.status) || ["", "—"])[1])}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0">Nenhum target ligado a este investidor ainda.</p>`}</div>`;
    }
    if (s.nivel === "N2"){ const a = s.acordo || {};
      h += `<form id="ma-f" class="form" novalidate><div class="fld"><label for="a-st">Situação do acordo</label><select id="a-st" ${ed ? "" : "disabled"}>${opt([["","—"],["em negociação","Em negociação"],["assinado","Assinado"],["encerrado","Encerrado"],["interno","Interno (Kinsey)"]], a.status || "")}</select></div>
        ${fld("a-fee", "Remuneração do parceiro", a.fee, {ph:"ex.: 20% do success fee"})}${fld("a-em", "Assinado em", a.em, {ph:"aaaa-mm-dd"})}
        ${ed ? `<div class="fld full"><button type="submit" class="btn sm" style="align-self:flex-start">Salvar acordo</button></div>` : ""}</form>`;
      const tg = S.suppliers.filter(x => x.parentId === s.id);
      h += `<div class="card"><h3>Targets originados (${tg.length})</h3><p class="sub" style="margin:4px 0 0">${tg.map(x => esc(x.nome) + " · " + esc(etapaNome(x.etapa))).join("<br>") || "Nenhum ainda."}</p></div>`;
    }
    if (s.nivel === "N3"){ const f = s.fin || {}, m = s.mandato || {};
      h += `<div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Funil</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${FUNIL.map(([k, l]) => `<button type="button" class="fbtn" data-etapa="${k}" aria-pressed="${s.etapa === k}" ${ed ? "" : "disabled"}>${esc(l)}</button>`).join("")}</div>
        ${s.etapa === "descartada" ? fld("e-mot", "Motivo do descarte", s.motivoDescarte, {full:1}) : ""}</div>
      <form id="ma-f" class="form" novalidate>${fld("f-seg", "Segmento", s.segmento)}${fld("f-cnae", "CNAE principal", s.cnae || s.receita?.cnae)}${fld("f-ano", "Ano-base", f.ano, {num:1})}
        ${fld("f-rec", "Receita (R$ mi)", f.receita, {num:1})}${fld("f-eb", "EBITDA (R$ mi)", f.ebitda, {num:1})}${fld("f-dl", "Dívida líquida (R$ mi)", f.divLiq, {num:1})}${fld("f-cr", "Crescimento (% a.a.)", f.cresc, {num:1})}
        <div class="fld"><label for="f-par">Intermediador</label><select id="f-par" ${ed ? "" : "disabled"}><option value="">—</option>${opt(N2s.map(x => [x.id, x.nome]), s.parentId)}</select></div>
        <div class="sub" style="grid-column:1/-1;margin:0">Margem EBITDA: <b>${f.receita && f.ebitda ? fmt(f.ebitda / f.receita * 100, 1) + "%" : "—"}</b> · Dívida líquida / EBITDA: <b>${f.ebitda && f.divLiq != null && f.divLiq !== "" ? fmt(f.divLiq / f.ebitda, 1) + "×" : "—"}</b></div>
        ${ed ? `<div class="fld full"><button type="submit" class="btn sm" style="align-self:flex-start">Salvar dados</button></div>` : ""}</form>
      <form id="ma-m" class="card" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Mandato</h3>
        <div class="form"><div class="fld"><label for="m-st">Situação</label><select id="m-st" ${ed ? "" : "disabled"}><option value="">Sem mandato</option>${opt(MAND_ST, m.status)}</select></div>
        <div class="fld"><label for="m-mod">Modelo</label><select id="m-mod" ${ed ? "" : "disabled"}>${opt(MA_MODELOS.filter(x => x.para.includes("N3") && /^mandato/.test(x.id)).map(x => [x.id, x.titulo]), m.modelo)}</select></div>
        ${fld("m-cod", "Nome-código", m.codinome, {ph:"Projeto " + CODINOMES.find(c => !S.suppliers.some(x => x.mandato?.codinome === "Projeto " + c))})}${fld("m-em", "Assinado em", m.assinadoEm, {ph:"aaaa-mm-dd"})}
        ${fld("m-part", "Participação à venda", m.participacao, {ph:"ex.: 100% das quotas"})}${fld("m-exc", "Exclusividade", m.exclusividade, {ph:"Exclusivo ou não exclusivo"})}
        ${fld("m-pr", "Prazo (meses)", m.prazo, {num:1})}${fld("m-ret", "Retainer mensal", m.retainer, {ph:"R$ 0"})}${fld("m-suc", "Success fee", m.success, {ph:"% do valor da operação"})}</div>
        ${ed ? `<button type="submit" class="btn sm" style="align-self:flex-start">Salvar mandato</button>` : ""}</form>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Investidores indicados</h3>
        <p class="sub" style="margin:0">Antes do NDA do mandato o investidor vê só o teaser anônimo${m.codinome ? ` (${esc(m.codinome)})` : ""}.</p>
        ${(s.investidores || []).length ? `<div class="tbl"><table><thead><tr><th>Investidor</th><th>Acesso ao mandato</th><th></th></tr></thead><tbody>${s.investidores.map(id => { const v = supById(id); if (!v) return ""; const ac = m.acessos?.[id] || {};
          return `<tr><td><span style="color:${LVC.N1}">◆</span> ${esc(v.nome)}<div class="sub" style="margin:0;font-size:12px">${esc(v.tipo || "")}${v.pais ? " · " + esc(v.pais) : ""}</div></td><td><select data-acesso="${id}" aria-label="Acesso de ${esc(v.nome)}" ${ed ? "" : "disabled"}><option value="">—</option>${opt(ACESSO, ac.status)}</select>${ac.em ? ` <span class="sub" style="font-size:11.5px">${esc(ac.em)}</span>` : ""}</td>
            <td style="text-align:right">${ed ? `<button type="button" class="btn sm ghost" data-rminv="${id}">Remover</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>` : ""}
        ${ed ? `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end"><div class="fld" style="min-width:220px"><label for="m-addinv">Indicar investidor</label><select id="m-addinv"><option value="">Escolha…</option>${opt(N1s.filter(x => !(s.investidores || []).includes(x.id)).map(x => [x.id, x.nome]), "")}</select></div><button type="button" class="btn sm" id="m-addgo">Indicar</button></div>` : ""}</div>`;
    }
    b.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px">${h}</div>`;
    $("#ma-ger").onclick = () => { S.jurTab = "docs"; S.maJur = s.nivel; S.jurAlvo = s.nivel === "N3" ? s.id : S.jurAlvo; $("#layer").innerHTML = ""; S.openSup = null; go("juridico"); setTimeout(() => gerar(supById(s.id) || s), 120); };
    const v = id => { const e = $("#" + id); return e ? e.value.trim() : ""; }, lista = id => v(id).split(",").map(x => x.trim()).filter(Boolean);
    const f = $("#ma-f"); if (f) f.onsubmit = e => { e.preventDefault();
      if (s.nivel === "N1") up({tese:{segmentos:lista("t-seg"), cnaes:lista("t-cnae"), regioes:lista("t-reg"), fatMin:n(v("t-fmin")), fatMax:n(v("t-fmax")), ebitdaMin:n(v("t-emin")), participacao:lista("t-part"), ticketMin:n(v("t-tmin")), ticketMax:n(v("t-tmax")), restricoes:v("t-res")}, contato:v("t-ct")}).then(() => toast("Tese salva"));
      if (s.nivel === "N2") up({acordo:{status:v("a-st"), fee:v("a-fee"), em:v("a-em")}}).then(() => toast("Acordo salvo"));
      if (s.nivel === "N3") up({segmento:v("f-seg"), cnae:v("f-cnae"), parentId:v("f-par"), fin:{ano:n(v("f-ano")), receita:n(v("f-rec")), ebitda:n(v("f-eb")), divLiq:n(v("f-dl")), cresc:n(v("f-cr"))}}).then(() => toast("Dados salvos")); };
    $$("[data-etapa]", b).forEach(x => x.onclick = () => up({etapa:x.dataset.etapa, etapaHist:{[x.dataset.etapa]:nowISO()}}));
    const mot = $("#e-mot"); if (mot) mot.onchange = () => up({motivoDescarte:mot.value.trim()});
    const fm = $("#ma-m"); if (fm) fm.onsubmit = e => { e.preventDefault();
      const st = v("m-st"), cod = v("m-cod") || (st ? $("#m-cod").placeholder : ""), ix = FUNIL.findIndex(x => x[0] === s.etapa), im = FUNIL.findIndex(x => x[0] === "mandato");
      const patch = {mandato:{status:st, modelo:v("m-mod"), codinome:cod, assinadoEm:v("m-em"), participacao:v("m-part"), exclusividade:v("m-exc"), prazo:v("m-pr"), retainer:v("m-ret"), success:v("m-suc")}};
      if (st === "assinado" && ix < im) patch.etapa = "mandato";
      up(patch).then(() => toast(st === "assinado" ? `Mandato ${cod} registrado` : "Mandato salvo")); };
    $$("[data-acesso]", b).forEach(x => x.onchange = () => up({mandato:{acessos:{[x.dataset.acesso]:{status:x.value, em:new Date().toISOString().slice(0, 10)}}}}));
    $$("[data-rminv]", b).forEach(x => x.onclick = () => up({investidores:(s.investidores || []).filter(i => i !== x.dataset.rminv)}));
    const ad = $("#m-addgo"); if (ad) ad.onclick = () => { const id = v("m-addinv"); if (!id) return; up({investidores:[...(s.investidores || []), id]}).then(() => toast("Investidor indicado")); };
  };
})();
