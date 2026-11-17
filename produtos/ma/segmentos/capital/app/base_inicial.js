/* ================= BASE INICIAL · KinseyTec – M&A =================
   Ponto de partida do sistema: cadastro geral dos investidores e compradores (N1), intermediadores e parceiros (N2)
   e targets vendedores (N3). Não há análise prévia solta: toda empresa entra pelo cadastro.
   Ao informar o CNPJ, as consultas são automáticas:
     - Receita Federal (cadastro, atividade, capital, endereço e sócios) e listas oficiais (CEIS e CNEP da CGU,
       Cadastro de Empregadores do MTE, áreas embargadas do IBAMA) pelo núcleo;
     - CVM (companhia aberta), B3 (código de negociação, cotação e valor de mercado), demonstrações da CVM (DFP)
       e notícias, pela função consultarEmpresa da versão publicada;
     - mercado (Ibovespa, Selic, IPCA e dólar) pela função mercado.
   Depois do cadastro o sistema monta o dossiê: do N1 (consultas, tese, condições de compra e últimas aquisições)
   e do N3, mais completo por ser a empresa-alvo (consultas e certidões, números e valor estimado, risco, diligência,
   compradores ligados com as condições de compra de cada um e notícias). Dossiês também em PDF. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const dig = v => String(v || "").replace(/\D/g, "");
  const fmtCnpj = d => d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const nn = v => { const x = num(v); return x == null || !isFinite(x) ? null : x; };
  const NIV = {N1:"Investidor / comprador", N2:"Intermediador / parceiro", N3:"Target vendedor"};
  const gnews = q => "https://news.google.com/search?hl=pt-BR&gl=BR&ceid=BR:pt-419&q=" + encodeURIComponent(q);
  const nomeBusca = s => String(s.nome || "").replace(/^EXEMPLO\s+/i, "").replace(/["]/g, "").replace(/\b(ltda|s\.?\s?a\.?|eireli|epp)\b\.?/gi, "").replace(/\s+/g, " ").trim();
  const publicado = () => !!(window.firebase?.functions && Store.db);
  const fn = nome => firebase.app().functions("southamerica-east1").httpsCallable(nome, {timeout:120000});

  /* mercado e comparáveis também fora do Valuation (dossiês e condições de compra) */
  let ouvindo = false;
  const ouvir = () => { if (ouvindo || !Store.db) return; ouvindo = true;
    Store.db.collection("cotacoes").doc("mercado").onSnapshot(d => { S.mercado = d.exists ? d.data() : null; }, () => {});
    Store.db.collection("cotacoes").doc("comparaveis").onSnapshot(d => { S.mercadoComp = d.exists ? d.data() : null; }, () => {}); };

  /* ---------------- atividade → segmento ---------------- */
  const CNAE_SEG = [[/^0[1-3]/, "Agro"], [/^1[01]/, "Alimentos"], [/^(58|6[1-3])/, "Tecnologia"], [/^(21|8[6-8])/, "Saúde"], [/^85/, "Educação"], [/^(0[5-9]|19|3[5-7])/, "Energia"],
    [/^(49|5[0-3])/, "Logística"], [/^4[5-7]/, "Varejo"], [/^(4[1-3]|68)/, "Construção"], [/^(1[2-9]|2\d|3[0-3])/, "Industrial"]];
  const segCnae = c => (CNAE_SEG.find(([re]) => re.test(dig(c).padStart(7, "0"))) || [, "Serviços"])[1];

  /* ================= CADASTRO ================= */
  function cadastro(nivel, id){
    ouvir();
    const s = id ? supById(id) : {nivel}; nivel = s.nivel || nivel;
    const T = s.tese || {}, F = s.fin || {}, C = s.capac || {}, M = s.mapa || {};
    const N1 = S.suppliers.filter(x => x.nivel === "N1").sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), N2 = S.suppliers.filter(x => x.nivel === "N2");
    const f = (k, lab, val, o = {}) => `<div class="fld ${o.full ? "full" : ""}"><label for="${k}">${lab}</label><input id="${k}" value="${esc(val ?? "")}" ${o.num ? 'inputmode="decimal"' : ""} ${o.ph ? `placeholder="${esc(o.ph)}"` : ""} autocomplete="off">${o.hint ? `<span class="hint">${o.hint}</span>` : ""}</div>`;
    const sel = (k, lab, opts, val) => `<div class="fld"><label for="${k}">${lab}</label><select id="${k}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>`;
    const tit = t => `<div class="fld full"><div class="eyebrow" style="margin-top:6px">${t}</div></div>`;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial · ${nivel} · ${NIV[nivel]}</div><h2>${id ? esc(s.nome) : "Novo cadastro"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="bi-f" novalidate><div class="form">
        <div class="fld full"><label for="bi-doc">CNPJ</label><div style="display:flex;gap:8px"><input id="bi-doc" inputmode="numeric" value="${esc(s.doc || "")}" placeholder="00.000.000/0000-00" style="flex:1" autocomplete="off"><button type="button" class="btn sm" id="bi-rf">Consultar</button></div>
          <span class="hint" id="bi-rfst">Com o CNPJ, o sistema preenche razão social, endereço e atividade pela Receita Federal e inicia as consultas automáticas.</span></div>
        ${f("bi-nome", "Razão social ou nome *", s.nome, {full:1})}
        ${nivel === "N3" ? f("bi-cod", "Nome-código (usado antes do NDA)", s.mandato?.codinome, {ph:"Projeto …"}) : ""}
        ${sel("bi-tipo", "Tipo", SUP_TYPES[nivel].map(t => [t, t]), s.tipo || SUP_TYPES[nivel][0])}
        ${sel("bi-seg", "Segmento", [["", "—"], ...SEGMENTOS.map(x => [x, x])], s.perfil?.segmento || s.segmento)}
        ${f("bi-mun", "Cidade", s.municipio)}${f("bi-uf", "UF", s.uf, {ph:"SP"})}${f("bi-pais", "País", s.pais || "Brasil")}
        ${f("bi-site", "Site", M.site)}${f("bi-cont", "Contato", M.contato)}${f("bi-tel", "Telefone", M.telefone)}
        ${nivel !== "N2" ? sel("bi-par", "Intermediador ou parceiro (N2)", [["", "—"], ...N2.map(x => [x.id, x.nome])], s.parentId) : ""}
        ${nivel === "N3" ? `${tit("Números do target · último exercício (R$ milhões)")}${f("bi-rec", "Faturamento", F.receita, {num:1})}${f("bi-eb", "EBITDA", F.ebitda, {num:1})}${f("bi-dl", "Dívida líquida", F.divLiq, {num:1})}
          <div class="fld full"><label for="bi-inv">Investidores de interesse (N1)</label><select id="bi-inv" multiple size="${Math.min(6, Math.max(3, N1.length))}">${N1.map(x => `<option value="${x.id}" ${(s.investidores || []).includes(x.id) ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select><span class="hint">Marque um ou mais compradores.</span></div>` : ""}
        ${nivel === "N1" ? `${tit("O que o investidor compra · define os targets que aparecem no mapa para ele")}${f("bi-tatv", "Atividades que compra", (T.atividades || []).join(", ") || T.texto || "", {full:1, ph:"lavanderia industrial; soja, milho, fertilizantes", hint:"separe por vírgula; o mapa mostra os targets dessas atividades"})}${f("bi-tcn", "CNAEs de interesse", (T.cnaes || []).join(", "), {ph:"9601-7, 0115-6"})}${f("bi-tseg", "Segmentos amplos", (T.segmentos || []).join(", "), {ph:"Serviços, Agro"})}${f("bi-tuf", "Estados (UF)", (T.ufs || []).join(", "), {ph:"SP, RJ, MG"})}${f("bi-tcid", "Cidades", (T.cidades || []).join(", "), {ph:"Campinas, Santos"})}${f("bi-treg", "Regiões", (T.regioes || []).join(", "), {ph:"Sudeste, Sul"})}${f("bi-tcnpj", "CNPJs de targets específicos", (T.cnpjs || []).join(", "), {full:1, ph:"opcional"})}${tit("Tamanho do negócio (R$ milhões)")}
          ${f("bi-tmin", "Ticket mínimo", T.ticketMin, {num:1})}${f("bi-tmax", "Ticket máximo", T.ticketMax, {num:1})}${f("bi-fmin", "Faturamento mínimo do target", T.fatMin, {num:1})}${f("bi-fmax", "Faturamento máximo do target", T.fatMax, {num:1})}
          ${tit("Condições para comprar (R$ milhões) · companhias abertas são preenchidas pela CVM e B3")}
          ${f("bi-aum", "Capital disponível para investir", C.aum, {num:1, hint:"fundos e family offices: recursos ainda não investidos"})}${f("bi-cx", "Caixa e aplicações", C.caixa, {num:1})}${f("bi-ceb", "EBITDA do comprador", C.ebitda, {num:1})}${f("bi-cdl", "Dívida líquida do comprador", C.divLiq, {num:1})}
          ${f("bi-tk", "Código na B3 (se for companhia aberta)", C.ticker, {ph:"ABCD3"})}` : ""}
        ${nivel === "N2" ? f("bi-fee", "Acordo de remuneração", s.acordo?.fee, {full:1, ph:"ex.: 20% do success fee"}) : ""}
        ${f("bi-obs", "Observações", M.obs, {full:1})}
      </div><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button type="button" class="btn" data-x>Cancelar</button><button type="submit" class="btn primary">${id ? "Salvar" : "Cadastrar e gerar dossiê"}</button></div></form>`);
    const $f = k => document.getElementById(k), v = k => ($f(k)?.value || "").trim(), nv = k => nn(v(k));
    let rf = null;
    const consulta = async () => { const d = dig(v("bi-doc")), st = $f("bi-rfst"); if (d.length !== 14){ st.textContent = "Informe os 14 dígitos do CNPJ."; return; }
      if (!IMP.docValido(d)){ st.textContent = "CNPJ inválido (dígito verificador)."; return; }
      const ja = S.suppliers.find(x => x.id !== id && dig(x.doc) === d); if (ja){ st.innerHTML = `Este CNPJ já está cadastrado: <b>${esc(ja.nome)}</b> (${ja.nivel}).`; return; }
      st.textContent = "Consultando a Receita Federal…";
      try{ rf = await ORG.receita(d); $f("bi-doc").value = fmtCnpj(d);
        if (!v("bi-nome")) $f("bi-nome").value = rf.razao || ""; if (!v("bi-mun")) $f("bi-mun").value = rf.municipio || ""; if (!v("bi-uf")) $f("bi-uf").value = rf.uf || "";
        if (!v("bi-seg") && rf.cnae) $f("bi-seg").value = segCnae(rf.cnae);
        st.innerHTML = `<b style="color:${rf.situacao === "ATIVA" ? "var(--ok)" : "var(--bad)"}">${esc(rf.situacao || "—")}</b> · ${esc(rf.razao)} · ${esc(rf.cnae)} ${esc(rf.cnaeDesc || "")} · ${esc(rf.municipio || "")}/${esc(rf.uf || "")}`; }
      catch(e){ st.textContent = "Receita indisponível agora. O cadastro pode seguir; a consulta é refeita automaticamente."; } };
    $f("bi-rf").onclick = consulta; $f("bi-doc").onchange = () => { if (dig(v("bi-doc")).length === 14) consulta(); };
    $f("bi-f").onsubmit = async e => { e.preventDefault(); const nome = v("bi-nome"); if (!nome){ toast("Informe a razão social ou o nome"); $f("bi-nome").focus(); return; }
      const d = dig(v("bi-doc")), seg = v("bi-seg"), nid = id || "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const o = {nivel, nome, doc:d.length === 14 ? fmtCnpj(d) : v("bi-doc"), tipo:v("bi-tipo"), segmento:seg, perfil:{segmento:seg}, municipio:v("bi-mun"), uf:v("bi-uf").toUpperCase().slice(0, 2), pais:v("bi-pais") || "Brasil",
        mapa:{site:v("bi-site"), contato:v("bi-cont"), telefone:v("bi-tel"), obs:v("bi-obs")}};
      if (nivel !== "N2") o.parentId = v("bi-par");
      if (nivel === "N3"){ o.mandato = {codinome:v("bi-cod")}; o.fin = {receita:nv("bi-rec"), ebitda:nv("bi-eb"), divLiq:nv("bi-dl")}; o.investidores = [...$f("bi-inv").selectedOptions].map(x => x.value); if (!s.lado) o.lado = "venda"; if (!s.etapa) o.etapa = "mapeada"; }
      if (nivel === "N1"){ const lst = k => v(k).split(/[,;]/).map(x => x.trim()).filter(Boolean);
        o.tese = {atividades:lst("bi-tatv"), cnaes:lst("bi-tcn"), segmentos:lst("bi-tseg"), ufs:lst("bi-tuf").map(x => x.toUpperCase()), cidades:lst("bi-tcid"), regioes:lst("bi-treg"), cnpjs:lst("bi-tcnpj"), ticketMin:nv("bi-tmin"), ticketMax:nv("bi-tmax"), fatMin:nv("bi-fmin"), fatMax:nv("bi-fmax")};
        o.capac = {aum:nv("bi-aum"), caixa:nv("bi-cx"), ebitda:nv("bi-ceb"), divLiq:nv("bi-cdl"), ticker:v("bi-tk").toUpperCase()}; }
      if (nivel === "N2") o.acordo = {fee:v("bi-fee")};
      if (rf) o.receita = {...rf, em:nowISO()};
      const mudouLocal = !id || s.uf !== o.uf || s.municipio !== o.municipio || s.pais !== o.pais;
      if (mudouLocal && window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(o); o.lat = lat; o.lng = lng; }
      try{ if (id) await Store.update("suppliers", id, o); else await Store.set("suppliers", nid, {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), origem:"Base inicial", ...o}); }
      catch(err){ toast("Não foi possível salvar: " + (err.message || "erro")); return; }
      close(); toast(id ? "Cadastro atualizado" : "Cadastro feito: consultas automáticas iniciadas"); renderAll();
      if (publicado() && d.length === 14) fn("consultarEmpresa")({id:nid}).catch(() => {});
      setTimeout(() => openSupplier(nid, "dados"), 60); };
  }

  /* ================= VALOR DO TARGET E CONDIÇÕES DE COMPRA ================= */
  function valorAlvo(t){
    let N; try{ N = KT_MATCH.numeros(t); }catch(e){ return null; }
    let ev = N.ev, fonte = N.fonte === "Due Diligence e valuation" ? "faixa moderada do valuation" : "";
    if (!fonte && N.eb && window.KT_VAL){ try{ const C = KT_VAL.comparaveis(t), d = 1 - KT_VAL.base().P.desc.v / 100; if (C.eb){ ev = N.eb * C.eb.med * d; fonte = `EBITDA × mediana EV/EBITDA do segmento (${fmt(C.eb.med * d, 1)}x com desconto de liquidez)`; } }catch(e){} }
    if (!fonte && N.eb) fonte = "EBITDA × 6 (referência, sem comparáveis do segmento)";
    if (!ev && N.rec && window.KT_VAL){ try{ const C = KT_VAL.comparaveis(t), d = 1 - KT_VAL.base().P.desc.v / 100; if (C.rec){ ev = N.rec * C.rec.med * d; fonte = `faturamento × mediana EV/Receita do segmento (${fmt(C.rec.med * d, 2)}x)`; } }catch(e){} }
    if (!(ev > 0)) return null;
    return {ev, eq:(ev - (N.dl || 0)) * N.pct, dl:N.dl || 0, pct:N.pct, fonte};
  }
  function capacidade(inv){
    const T = inv.tese || {}, C = inv.capac || {}, x = inv.ext?.fin, m = v => v != null ? v * 1e6 : null;
    const caixa = m(C.caixa) ?? x?.caixa ?? null, eb = m(C.ebitda) ?? x?.ebitda ?? null, dl = m(C.divLiq) ?? (x && x.div != null ? (x.div || 0) - (x.caixa || 0) : null), aum = m(C.aum);
    let cap = null, base = "";
    if (aum != null){ cap = aum; base = "capital disponível para investir"; }
    else if (eb != null){ cap = Math.max(0, 3 * eb - (dl ?? 0)) + (dl == null ? (caixa || 0) : 0); base = `até 3,0x o EBITDA de ${mi(eb)} menos a dívida líquida${dl != null ? ` de ${mi(dl)}` : ""}${x && C.ebitda == null ? " (CVM)" : ""}`; }
    else if (caixa != null){ cap = caixa; base = "caixa e aplicações"; }
    return {tmin:m(T.ticketMin), tmax:m(T.ticketMax), cap, base, mcap:inv.ext?.b3?.mcap || null};
  }
  function condicao(inv, t){
    const V = valorAlvo(t), K = capacidade(inv), lim = [K.tmax, K.cap].filter(v => v != null);
    if (!V) return {cls:"r-pend", txt:"Sem valor do target", V, K};
    if (!lim.length) return {cls:"r-pend", txt:"Sem dados do comprador", V, K};
    const L = Math.min(...lim), v = V.eq;
    if (K.tmin != null && v < K.tmin * .8) return {cls:"r-medio", txt:"Abaixo do ticket mínimo", V, K, L};
    return v <= L ? {cls:"r-baixo", txt:"Tem condições", V, K, L} : v <= L * 1.25 ? {cls:"r-medio", txt:"No limite", V, K, L} : {cls:"r-alto", txt:"Acima da capacidade", V, K, L};
  }
  const pillC = c => `<span class="pill ${c.cls}" style="font-size:11px;padding:2px 9px;white-space:nowrap">${esc(c.txt)}</span>`;
  /* targets que o investidor compra (atividades, CNAEs, CNPJs e região do cadastro), além dos ligados no mapa */
  const sugeridos = (inv, n = 12) => { try{ return S.suppliers.filter(t => t.nivel === "N3" && t.etapa !== "descartada" && !(t.investidores || []).includes(inv.id)).map(t => ({t, mot:window.KT_ORBINV ? KT_ORBINV.aderente(inv, t) : null, sc:KT_MATCH.score(inv, t)})).filter(x => x.mot || (!window.KT_ORBINV && !x.sc.elim && x.sc.score >= 60)).sort((a, b) => b.sc.score - a.sc.score).slice(0, n); }catch(e){ return []; } };

  /* ================= CONSULTAS AUTOMÁTICAS ================= */
  function consultas(s){
    const d = dig(s.doc), rf = s.receita, la = s.listas, x = s.ext || {}, pub = publicado(), M = {...(typeof VAL_BASE !== "undefined" ? VAL_BASE.mercado : {}), ...(S.mercado?.atual || {})};
    const pend = pub ? "em andamento (automática)" : "automática na versão publicada";
    const L = [];
    L.push(["Receita Federal · cadastro do CNPJ", d.length !== 14 ? ["pend", "informe o CNPJ no cadastro"] : rf?.em && !rf.erro ? [rf.situacao === "ATIVA" ? "ok" : "alerta", `${rf.situacao || "—"} · ${rf.cnae || ""} ${rf.cnaeDesc || ""} · capital R$ ${fmt(rf.capital || 0, 0)} · aberta em ${rf.abertura ? new Date(rf.abertura + "T12:00").toLocaleDateString("pt-BR") : "—"}`] : rf?.erro ? ["pend", rf.erro] : ["pend", "consultando…"], "https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp"]);
    L.push(["Quadro de sócios e administradores", rf?.socios?.length ? ["ok", rf.socios.slice(0, 4).map(q => q.nome).join(", ") + (rf.socios.length > 4 ? ` e mais ${rf.socios.length - 4}` : "")] : ["pend", "vem com a consulta da Receita"], null]);
    L.push(["Listas oficiais · CEIS e CNEP (CGU), Cadastro de Empregadores (MTE), embargos (IBAMA)", la ? ((la.achados || []).length ? ["alerta", la.achados.map(a => `${a.rotulo}: ${a.nome}`).join("; ")] : ["ok", `sem ocorrências${Object.keys(la.bases || {}).length ? "" : " (listas ainda não carregadas pelo administrador)"}`]) : ["pend", "verificação automática"], "https://portaldatransparencia.gov.br/sancoes/consulta"]);
    L.push(["CVM · companhia aberta", x.cvm ? (x.cvm.aberta ? ["ok", `${x.cvm.nome} · ${x.cvm.setor || ""} · registro ${x.cvm.situacao}`] : ["ok", "não é companhia aberta registrada na CVM"]) : ["pend", pend], "https://sistemas.cvm.gov.br/?CiaDoc"]);
    L.push(["B3 · código, cotação e valor de mercado", x.b3?.ticker ? ["ok", `${x.b3.ticker}${x.b3.preco ? ` · R$ ${fmt(x.b3.preco, 2)}` : ""}${x.b3.mcap ? ` · valor de mercado ${mi(x.b3.mcap)}` : ""}`] : x.cvm && !x.cvm.aberta ? ["ok", "sem ações negociadas na B3"] : ["pend", pend], "https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm"]);
    if (x.fin || x.cvm?.aberta) L.push(["Demonstrações financeiras · CVM (DFP)", x.fin ? ["ok", `${x.fin.ano || ""} · receita ${mi(x.fin.rec)} · EBITDA ${mi(x.fin.ebitda)} · caixa ${mi(x.fin.caixa)} · dívida ${mi(x.fin.div)}`] : ["pend", pend], "https://dados.cvm.gov.br/"]);
    L.push(["Mercado · Ibovespa, Selic, IPCA e dólar", ["ok", `${M.ibov ? `Ibovespa ${fmt(M.ibov, 0)} pts · ` : ""}Selic ${fmt(M.selic, 2)}% · IPCA 12 meses ${fmt(M.ipca12, 2)}% · dólar R$ ${fmt(M.ptax, 2)}`], "https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-amplos/ibovespa.htm"]);
    L.push([s.nivel === "N1" ? "Notícias e últimas aquisições" : "Notícias da empresa", x.noticias || x.aquisicoes ? ["ok", `${(x.aquisicoes || []).length + (x.noticias || []).length} notícia(s) encontradas em ${x.em ? dt(x.em) : "—"}`] : ["pend", pend], gnews(`"${nomeBusca(s)}"`)]);
    const cert = s.nivel === "N3" ? [["Certidão de débitos federais (Receita e PGFN)", "https://solucoes.receita.fazenda.gov.br/Servicos/certidaointernet/PJ/Emitir"], ["Regularidade do FGTS · CRF (Caixa)", "https://consulta-crf.caixa.gov.br/consultacrf/pages/consultaEmpregador.jsf"],
      ["Débitos trabalhistas · CNDT (TST)", "https://cndt-certidao.tst.jus.br/inicio.faces"], ["Protestos (CENPROT)", "https://www.pesquisaprotesto.com.br/"], ["Processos judiciais (CNJ · Jusbrasil)", "https://www.jusbrasil.com.br/consulta-processual/"], ["Atos na Junta Comercial (REDESIM)", "https://www.gov.br/empresas-e-negocios/pt-br/redesim"]] : [];
    return {L, cert};
  }
  const ICO = {ok:["var(--ok)", "✓"], alerta:["var(--bad)", "!"], pend:["var(--warn)", "…"]};
  function consultasCard(s){
    const {L, cert} = consultas(s);
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><h3>Consultas automáticas</h3><p class="sub" style="margin:2px 0 0">Feitas a partir do CNPJ, sem clique. ${s.ext?.em ? `CVM, B3 e notícias atualizadas em ${dt(s.ext.em)}.` : ""}</p></div>${publicado() ? `<button type="button" class="btn sm" id="bi-rec">Atualizar agora</button>` : ""}</div>
      <div style="display:flex;flex-direction:column;gap:6px">${L.map(([nome, [st, txt], url]) => `<div style="display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start;font-size:13px"><b style="color:${ICO[st][0]};text-align:center">${ICO[st][1]}</b><div><b>${esc(nome)}</b>${url ? ` <a href="${url}" target="_blank" rel="noopener" style="font-size:11.5px;color:var(--glow)">fonte ↗</a>` : ""}<div class="sub" style="margin:0;font-size:12px">${esc(txt)}</div></div></div>`).join("")}</div>
      ${cert.length ? `<details><summary class="sub" style="cursor:pointer">Certidões com emissão no site do órgão (exigem verificação de segurança): ${cert.length}</summary><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${cert.map(([l, u]) => `<a class="btn sm ghost" href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div></details>` : ""}</div>`;
  }

  /* ================= CARTÕES DO DOSSIÊ ================= */
  function condCard(inv){
    const K = capacidade(inv), lig = S.suppliers.filter(t => t.nivel === "N3" && (t.investidores || []).includes(inv.id)), sug = sugeridos(inv);
    const linha = (t, origem) => { const c = condicao(inv, t); return `<tr><td><a href="#" data-goto="${t.id}" style="color:var(--glow)">${esc(t.mandato?.codinome || t.nome)}</a><div class="sub" style="margin:0;font-size:11px">${esc(origem)}</div></td><td class="dd-num">${c.V ? mi(c.V.eq) : "—"}</td><td>${pillC(c)}</td></tr>`; };
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Condições de compra</h3>
      <div class="dd-kpis"><div class="dd-k"><span>Ticket</span><b>${K.tmin != null || K.tmax != null ? `${mi(K.tmin)} a ${mi(K.tmax)}` : "—"}</b><small>tese informada</small></div><div class="dd-k"><span>Capacidade financeira</span><b>${K.cap != null ? mi(K.cap) : "—"}</b><small>${esc(K.base || "informe no cadastro ou pela CVM")}</small></div>${K.mcap ? `<div class="dd-k"><span>Valor de mercado</span><b>${mi(K.mcap)}</b><small>B3</small></div>` : ""}</div>
      ${lig.length || sug.length ? `<div class="tbl"><table><thead><tr><th>Target</th><th class="dd-num">Valor estimado (equity)</th><th>Condição</th></tr></thead><tbody>${lig.map(t => linha(t, "ligado no mapa")).join("")}${sug.map(x => linha(x.t, x.mot || `aderente à tese · ${x.sc.score} pts`)).join("")}</tbody></table></div>` : `<div class="empty">Nenhum target ligado ou aderente à tese ainda.</div>`}
      <p class="sub" style="margin:0;font-size:12px">Compara o valor estimado do target (valuation, ou EBITDA × múltiplo do segmento) com o menor entre o ticket máximo e a capacidade financeira. "No limite": até 25% acima.</p></div>`;
  }
  function compradoresCard(t){
    const V = valorAlvo(t), ids = t.investidores || [], inv = ids.map(supById).filter(Boolean);
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Compradores ligados · condições de compra</h3>
      <div class="dd-kpis"><div class="dd-k"><span>Valor estimado · equity</span><b>${V ? mi(V.eq) : "—"}</b><small>${esc(V ? V.fonte : "informe faturamento e EBITDA no cadastro")}</small></div>${V ? `<div class="dd-k"><span>Enterprise value</span><b>${mi(V.ev)}</b><small>dívida líquida ${mi(V.dl)}</small></div>` : ""}</div>
      ${inv.length ? `<div class="tbl"><table><thead><tr><th>Investidor (N1)</th><th class="dd-num">Ticket máx.</th><th class="dd-num">Capacidade</th><th>Condição</th></tr></thead><tbody>${inv.map(i => { const c = condicao(i, t); return `<tr><td><a href="#" data-goto="${i.id}" style="color:var(--glow)">${esc(i.nome)}</a></td><td class="dd-num">${c.K.tmax != null ? mi(c.K.tmax) : "—"}</td><td class="dd-num">${c.K.cap != null ? mi(c.K.cap) : "—"}</td><td>${pillC(c)}</td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty">Nenhum investidor ligado. Marque os investidores de interesse no cadastro.</div>`}</div>`;
  }
  function noticiasCard(s){
    const x = s.ext || {}, nb = nomeBusca(s), aq = s.nivel === "N1";
    const lista = (L, t) => L?.length ? `<div class="eyebrow" style="margin-top:4px">${t}</div><div style="display:flex;flex-direction:column;gap:5px">${L.slice(0, 6).map(n => `<a href="${esc(n.url)}" target="_blank" rel="noopener" style="font-size:13px;color:var(--fog);text-decoration:none"><span class="mono" style="font-size:11px;color:var(--muted)">${esc(n.data || "")}</span> ${esc(n.titulo)} <span class="sub" style="font-size:11px">· ${esc(n.fonte || "")}</span></a>`).join("")}</div>` : "";
    const links = [aq ? [`Aquisições de ${nb}`, gnews(`"${nb}" aquisição OR adquire OR adquiriu OR compra`)] : null, [`Notícias de ${nb}`, gnews(`"${nb}"`)], x.cvm?.aberta ? ["Fatos relevantes (CVM)", "https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx"] : null].filter(Boolean);
    return `<div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>${aq ? "Últimas aquisições e notícias" : "Notícias"}</h3>
      ${aq ? lista(x.aquisicoes, "Aquisições e compras") : ""}${lista(x.noticias, "Notícias recentes")}
      ${!x.aquisicoes?.length && !x.noticias?.length ? `<p class="sub" style="margin:0">${publicado() ? "A busca automática roda ao cadastrar o CNPJ." : "Na versão publicada a busca é automática; aqui, use as pesquisas abaixo."}</p>` : ""}
      <div style="display:flex;flex-wrap:wrap;gap:6px">${links.map(([l, u]) => `<a class="btn sm ghost" href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div></div>`;
  }
  function cadastroCard(s){
    const par = s.parentId && supById(s.parentId), M = s.mapa || {}, F = s.fin || {}, T = s.tese || {}, rf = s.receita && !s.receita.erro ? s.receita : null;
    const kv = [["CNPJ", s.doc || "—"], ["Razão social (Receita)", rf?.razao], ["Tipo", s.tipo], ["Segmento", s.perfil?.segmento || s.segmento || M.segmentoTxt], ["Local", [s.municipio, s.uf, s.pais && !/^bra/i.test(s.pais) ? s.pais : ""].filter(Boolean).join(" · ")],
      s.nivel === "N3" ? ["Nome-código", s.mandato?.codinome] : null, par ? ["Intermediador ou parceiro", `<a href="#" data-goto="${par.id}" style="color:var(--glow)">${esc(par.nome)}</a>`, 1] : null,
      s.nivel === "N3" && (F.receita || F.ebitda) ? ["Faturamento · EBITDA", `${mi((F.receita || 0) * 1e6)} · ${mi((F.ebitda || 0) * 1e6)}`] : null, s.nivel === "N3" && M.fat ? ["Faturamento (mapa)", M.fat] : null,
      s.nivel === "N1" && ((T.atividades || []).length || T.texto) ? ["O que compra", (T.atividades || []).join(", ") || T.texto] : null, s.nivel === "N1" && ((T.ufs || []).length || (T.cidades || []).length || (T.regioes || []).length) ? ["Onde", [...(T.ufs || []), ...(T.cidades || []), ...(T.regioes || [])].join(", ")] : null,
      s.nivel === "N1" && (T.segmentos || []).length ? ["Segmentos", T.segmentos.join(", ")] : null, ["Site", M.site ? `<a href="${esc(/^https?:/.test(M.site) ? M.site : "https://" + M.site)}" target="_blank" rel="noopener" style="color:var(--glow)">${esc(M.site)}</a>` : "", 1],
      ["Contato", [M.contato, M.telefone].filter(Boolean).join(" · ")], ["Observações", M.obs]].filter(x => x && x[1]);
    return `<div class="card"><h3>Cadastro</h3><dl class="kv" style="margin-top:8px">${kv.map(([k, v, raw]) => `<dt>${esc(k)}</dt><dd>${raw ? v : esc(String(v))}</dd>`).join("")}</dl></div>`;
  }

  /* ---------------- aba Dados do dossiê ---------------- */
  function dados(s, b){
    ouvir(); const r = riskOf(s);
    b.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">${s.nivel === "N3" ? riskPill(r) : `<span class="lvtag">${s.nivel}</span> <span class="sub" style="margin:0">${NIV[s.nivel]}</span>`}
        <div style="display:flex;gap:8px;flex-wrap:wrap">${s.nivel !== "N2" ? `<button type="button" class="btn sm primary" id="bi-pdf">Dossiê em PDF</button>` : ""}<button type="button" class="btn sm" id="bi-ed">Editar cadastro</button><button type="button" class="btn sm" id="bi-orb">Ver na órbita</button>${s.nivel === "N3" ? `<button type="button" class="btn sm" id="bi-env">Enviar questionário</button>` : ""}</div></div>
      ${s.nivel === "N3" ? whyBox(s) : ""}
      ${cadastroCard(s)}${s.nivel !== "N2" ? consultasCard(s) : ""}
      ${s.nivel === "N1" ? condCard(s) + noticiasCard(s) : ""}${s.nivel === "N3" ? compradoresCard(s) + noticiasCard(s) : ""}
      ${s.nivel === "N2" ? `<div class="card"><h3>Empresas ligadas</h3><p class="sub" style="margin:4px 0 0">${S.suppliers.filter(k => k.parentId === s.id).map(k => esc(k.nome)).join(" · ") || "Nenhuma empresa ligada ainda."}</p></div>` : ""}
      <div class="banner">Cadastrado em ${dt(s.criadoEm)}${s.origem ? ` · origem: ${esc(s.origem)}` : ""}${/EXEMPLO/.test(s.nome || "") ? " · <b>registro de demonstração</b>" : ""}</div>`;
    $("#bi-ed", b).onclick = () => cadastro(s.nivel, s.id);
    $("#bi-orb", b).onclick = () => { $("#layer").innerHTML = ""; S.openSup = null; go("orbita"); selectSup(s.id, true); };
    const en = $("#bi-env", b); if (en) en.onclick = () => { if (typeof PAINEL !== "undefined") PAINEL.envio([s.id]); };
    const pd = $("#bi-pdf", b); if (pd) pd.onclick = async () => { pd.disabled = true; pd.textContent = "Gerando…"; try{ await dossiePdf(s); }catch(e){ console.error(e); toast("Não foi possível gerar o PDF"); } pd.disabled = false; pd.textContent = "Dossiê em PDF"; };
    const rc = $("#bi-rec", b); if (rc) rc.onclick = async () => { rc.disabled = true; rc.textContent = "Consultando…"; try{ await ORG.atualizar(s, false); await fn("consultarEmpresa")({id:s.id}); toast("Consultas atualizadas"); }catch(e){ toast("Consulta indisponível: " + (e.message || "erro")); } rc.disabled = false; rc.textContent = "Atualizar agora"; };
    $$("[data-goto]", b).forEach(a => a.onclick = e => { e.preventDefault(); openSupplier(a.dataset.goto, "dados"); });
  }
  const _body = renderSupBody;
  renderSupBody = function(){ if (S.supTab !== "dados") return _body.apply(this, arguments); const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b) return; dados(s, b); };

  /* ================= DOSSIÊ EM PDF ================= */
  async function dossiePdf(s){
    const R = KT_REL, P = KTPdf(), n3 = s.nivel === "N3", rf = s.receita && !s.receita.erro ? s.receita : null, {L, cert} = consultas(s), x = s.ext || {}, nome = n3 ? (s.mandato?.codinome || s.nome) : s.nome;
    R.capa(P, n3 ? "Dossiê do target · uso interno" : "Dossiê do investidor · uso interno", s.nome, [["Nível", `${s.nivel} · ${NIV[s.nivel]}`], ["CNPJ", s.doc || "—"], ["Segmento", s.perfil?.segmento || s.segmento || "—"], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    let k = 1; R.sec(P, k++, "Cadastro");
    const M = s.mapa || {}; R.tab(P, ["Campo", "Informação"], [["Razão social", rf?.razao || s.nome], ["Tipo", s.tipo || "—"], ["Local", [s.municipio, s.uf, s.pais].filter(Boolean).join(" · ") || "—"], ["Atividade", rf ? `${rf.cnae} ${rf.cnaeDesc}` : "—"], ["Abertura", rf?.abertura || "—"], ["Capital social", rf ? "R$ " + fmt(rf.capital || 0, 0) : "—"], ["Sócios e administradores", (rf?.socios || []).slice(0, 8).map(q => q.nome).join(", ") || "—"], ["Site", M.site || "—"]], [.3, .7]);
    R.sec(P, k++, "Consultas automáticas"); R.tab(P, ["Fonte", "Situação", "Resultado"], L.map(([f, [st, t]]) => [f, st === "ok" ? "OK" : st === "alerta" ? "ATENÇÃO" : "pendente", t]), [.34, .12, .54]);
    if (cert.length) R.par(P, "Certidões a emitir no site de cada órgão: " + cert.map(c => c[0]).join("; ") + ".", {size:8.5});
    if (n3){
      const V = valorAlvo(s), F = s.fin || {}; R.sec(P, k++, "Números e valor estimado");
      R.kpisPdf(P, [["Faturamento", F.receita ? mi(F.receita * 1e6) : (M.fat || "—"), "último exercício"], ["EBITDA", F.ebitda ? mi(F.ebitda * 1e6) : "—", ""], ["Equity estimado", V ? mi(V.eq) : "—", V ? V.fonte.slice(0, 40) : ""], ["Enterprise value", V ? mi(V.ev) : "—", V ? "dívida " + mi(V.dl) : ""]]);
      try{ if (D.temBal(s)){ const Rv = KT_VAL.resumo(s); if (Rv.rec) R.par(P, `Valuation (faixa moderada): enterprise value de ${mi(Rv.rec[0])} a ${mi(Rv.rec[1])}; equity de ${mi(Rv.rec[0] - Rv.X.dl)} a ${mi(Rv.rec[1] - Rv.X.dl)}.`); } }catch(e){}
      const r = riskOf(s); R.sec(P, k++, "Risco do target"); R.par(P, `Classificação: ${RISK_LABEL[r.level] || r.level}${r.score ? ` (pontuação ${r.score})` : ""}.`);
      (r.reasons || []).slice().sort((a, b) => b.pts - a.pts).slice(0, 12).forEach(m => R.par(P, `• ${m.crit}: ${m.txt}`, {size:9}));
      R.sec(P, k++, "Diligência"); let aj = [], jq = 0; try{ aj = D.temBal(s) ? D.ajustes(s, D.periodos(s).slice(-1)[0]) : []; }catch(e){} jq = Object.keys(s.jdd?.q || {}).length;
      R.tab(P, ["Frente", "Situação"], [["Due Diligence (contábil, financeira, trabalhista e tributária)", D.temBal(s) ? `${D.periodos(s).length} balancete(s) · ${aj.length} ajuste(s) proposto(s), ${aj.filter(D.okVal).length} com OK no valuation` : "balancetes ainda não importados"],
        ["Diligência jurídica", jq ? `${jq} resposta(s) no questionário jurídico · ${Object.keys(s.jdd?.ct || {}).length} contrato(s) · ${Object.keys(s.jdd?.pr || {}).length} processo(s)` : "não iniciada"], ["Questionário do target", `${answersCount(s).done} de ${answersCount(s).total} respondidas`], ["NDA", s.nda?.aceito ? "assinado" : "pendente"]], [.45, .55]);
      R.sec(P, k++, "Compradores ligados e condições de compra"); const inv = (s.investidores || []).map(supById).filter(Boolean);
      inv.length ? R.tab(P, ["Investidor", "Ticket máx.", "Capacidade", "Condição"], inv.map(i => { const c = condicao(i, s); return [i.nome, c.K.tmax != null ? mi(c.K.tmax) : "—", c.K.cap != null ? mi(c.K.cap) : "—", c.txt]; }), [.4, .18, .18, .24]) : R.par(P, "Nenhum investidor ligado.");
    } else {
      const K = capacidade(s), T = s.tese || {}; R.sec(P, k++, "Tese e condições de compra");
      R.kpisPdf(P, [["Ticket", K.tmin != null || K.tmax != null ? `${mi(K.tmin)} a ${mi(K.tmax)}` : "—", "tese"], ["Capacidade financeira", K.cap != null ? mi(K.cap) : "—", K.base.slice(0, 40)], ["Valor de mercado", K.mcap ? mi(K.mcap) : "—", K.mcap ? "B3" : ""]]);
      if ((T.segmentos || []).length) R.par(P, "Segmentos de interesse: " + T.segmentos.join(", ") + ".");
      const lig = S.suppliers.filter(t => t.nivel === "N3" && (t.investidores || []).includes(s.id)).map(t => [t, "ligado"]), sug = sugeridos(s).map(z => [z.t, z.mot || `aderente · ${z.sc.score} pts`]);
      [...lig, ...sug].length ? R.tab(P, ["Target (nome-código)", "Origem", "Equity estimado", "Condição"], [...lig, ...sug].map(([t, o]) => { const c = condicao(s, t); return [t.mandato?.codinome || t.nome, o, c.V ? mi(c.V.eq) : "—", c.txt]; }), [.36, .2, .2, .24]) : R.par(P, "Nenhum target ligado ou aderente.");
    }
    R.sec(P, k++, s.nivel === "N1" ? "Últimas aquisições e notícias" : "Notícias");
    const nt = [...(x.aquisicoes || []), ...(x.noticias || [])].slice(0, 12); nt.length ? R.tab(P, ["Data", "Notícia", "Fonte"], nt.map(z => [z.data || "", z.titulo, z.fonte || ""]), [.14, .66, .2]) : R.par(P, "Sem notícias coletadas (a busca automática roda na versão publicada).");
    await rptSave(P.out(`Dossiê · ${nome}`, R.T(`KinseyTec – M&A · Dossiê ${s.nivel} · ${nome} · confidencial`)), R.arq(s, "dossie", "pdf"), "application/pdf");
  }

  /* ================= BASE INICIAL (tela e menu) ================= */
  const _cad = renderCadeia;
  renderCadeia = function(){ const r = _cad.apply(this, arguments); const host = $("#cadeia"); if (!host) return r;
    const N = l => S.suppliers.filter(s => s.nivel === l), n3 = N("N3"), cons = n3.filter(s => s.receita?.em && !s.receita.erro).length, semDoc = S.suppliers.filter(s => s.nivel !== "N2" && dig(s.doc).length !== 14).length;
    const el = document.createElement("div"); el.className = "card"; el.id = "bi-top"; el.dataset.v2 = "1"; el.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-bottom:14px";
    const ed = Store.me?.canWrite !== false;
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">KinseyTec – M&A · ponto de partida</div><h2 style="margin:0">Base inicial</h2>
        <p class="sub" style="margin:4px 0 0">Consulte clientes, investidores, targets, consultores e parceiros; cadastre empresas pelo CNPJ ou importe dados.</p></div></div>
      <div id="bi-cons" style="display:flex;flex-direction:column;gap:8px"><div class="eyebrow">Consulta</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${CATS.map(([k, l]) => `<button type="button" class="fbtn" data-bic="${k}" aria-pressed="${(S.biCat || "todos") === k}">${l} <b>${conta(k)}</b></button>`).join("")}</div>
        <input type="search" id="bi-q" placeholder="Nome, CNPJ, cidade ou segmento" autocomplete="off" value="${esc(S.biQ || "")}" style="height:46px;border-radius:12px;border:1px solid var(--line-2);background:rgba(1,31,75,.6);color:var(--fog);padding:0 14px;font:inherit;font-size:15px">
        <div id="bi-res"></div></div>
      ${ed ? `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
        <button type="button" class="btn primary" id="bi-cad" style="min-height:64px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;white-space:normal"><b style="font-size:15px">+ Cadastro da empresa</b><span style="font-size:12px;opacity:.85;font-weight:500">CNPJ e cadastro inicial · target com o investidor indicado</span></button>
        <button type="button" class="btn" id="bi-imp" style="min-height:64px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;white-space:normal"><b style="font-size:15px">Importação de dados</b><span style="font-size:12px;opacity:.85;font-weight:500">mapa M&A, listas e planilhas</span></button></div>` : ""}
      <div class="dd-kpis"><div class="dd-k"><span>Targets (N3)</span><b>${n3.length}</b><small>${cons} com Receita consultada</small></div><div class="dd-k"><span>Investidores (N1)</span><b>${N("N1").length}</b><small>${N("N1").filter(s => s.ext?.em).length} com CVM, B3 e notícias</small></div><div class="dd-k"><span>Intermediadores (N2)</span><b>${N("N2").length}</b><small>inclui a Kinsey Capital</small></div><div class="dd-k"><span>Sem CNPJ</span><b>${semDoc}</b><small>sem consultas automáticas</small></div></div>`;
    const old = host.querySelector("#bi-top"); if (old) old.remove(); host.prepend(el);
    $$("button", host).filter(x => /^Nova empresa$/.test(x.textContent.trim())).forEach(x => { x.hidden = true; x.style.display = "none"; });
    const res = () => { const q = norm2(S.biQ || ""), cat = S.biCat || "todos", L = S.suppliers.filter(s => cat === "todos" || catDe(s).includes(cat)).filter(s => !q || norm2([s.nome, s.razao, s.doc, dig(s.doc), s.municipio, s.uf, s.segmento, s.perfil?.segmento, s.tipo, s.mandato?.codinome].join(" ")).includes(q));
      const box = $("#bi-res", el); if (!q && cat === "todos"){ box.innerHTML = ""; return; }
      box.innerHTML = L.length ? `<div class="tbl" style="max-height:420px;overflow:auto"><table><tbody>${L.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt")).slice(0, 60).map(s => `<tr data-bio="${s.id}" style="cursor:pointer"><td style="min-width:200px"><b>${esc(s.mandato?.codinome ? s.mandato.codinome + " · " : "")}${esc(s.nome || "")}</b><div class="sub" style="margin:2px 0 0;font-size:12px"><span class="pill r-pend" style="font-size:10px;padding:1px 7px">${esc((CATS.find(x => x[0] === catDe(s).slice(-1)[0]) || ["", ""])[1])}</span> ${esc([[s.municipio, s.uf].filter(Boolean).join("/"), s.doc, s.perfil?.segmento || s.segmento || s.tipo, s.mandato?.status ? "mandato " + ({assinado:"assinado", negociacao:"em negociação", enviado:"enviado ao target", minuta:"em minuta", encerrado:"encerrado"}[s.mandato.status] || s.mandato.status) : ""].filter(Boolean).join(" · "))}</div></td></tr>`).join("")}</tbody></table></div>${L.length > 60 ? `<p class="sub" style="margin:4px 0 0;font-size:12px">${L.length} encontrados; mostrando 60. Refine a busca.</p>` : ""}` : `<p class="sub" style="margin:0">Nada encontrado${q ? ` para "${esc(S.biQ)}"` : ""}.</p>`;
      $$("[data-bio]", box).forEach(t => t.onclick = () => openSupplier(t.dataset.bio)); };
    $$("[data-bic]", el).forEach(x => x.onclick = () => { S.biCat = x.dataset.bic; $$("[data-bic]", el).forEach(y => y.setAttribute("aria-pressed", String(y === x))); res(); });
    const qi = $("#bi-q", el); qi.oninput = () => { S.biQ = qi.value; res(); }; res();
    const cd = $("#bi-cad", el); if (cd) cd.onclick = () => { const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Cadastro da empresa</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><p class="sub" style="margin:0">Comece pelo CNPJ: o sistema consulta a Receita Federal e completa o cadastro. No cadastro do target você já indica o investidor; as indicações de outros investidores ficam na Prospecção.</p>
        ${[["proj", "Novo projeto · target com mandato", "Cadastro principal: empresa que contratou a Kinsey para vender, com mandato, investidores e due diligence"], ["N3", "Target (empresa vendedora)", "Empresa a vender, com o investidor indicado"], ["N1", "Investidor ou comprador", "Fundo, grupo estratégico ou comprador, com a tese de investimento"], ["N2", "Parceiro ou consultor", "Intermediador, consultor, assessor ou parceiro que indica negócios"]].map(([k, t, d]) => `<button type="button" class="btn" data-bcad="${k}" style="min-height:58px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;white-space:normal"><b>${t}</b><span class="sub" style="margin:0;font-size:12px">${d}</span></button>`).join("")}</div>`);
      $$("[data-bcad]").forEach(b => b.onclick = () => { close(); const k = b.dataset.bcad; if (k === "proj" && window.KT_PROJ) KT_PROJ.novoProjeto(); else cadastro(k === "proj" ? "N3" : k); }); };
    const im = $("#bi-imp", el); if (im) im.onclick = () => { const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Importação de dados</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px">
        ${[["mapa", "Mapa M&A (Excel)", "Planilha de trabalho com investidores, targets, parceiros e ligações entre eles"], ["modelo", "Modelo da planilha do mapa", "Baixe o modelo para preencher"], ["lista", "Lista de targets (Ramper, Econodata ou planilha)", "CNPJ, razão social, atividade, faturamento, cidade e contato; o sistema consulta cada CNPJ"], ["exp", "Exportar a base para cadências (Ramper)", "Planilha com as empresas e os contatos"]].map(([k, t, d]) => `<button type="button" class="btn" data-bimp="${k}" style="min-height:58px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;white-space:normal"><b>${t}</b><span class="sub" style="margin:0;font-size:12px">${d}</span></button>`).join("")}</div>`);
      $$("[data-bimp]").forEach(b => b.onclick = () => { close(); const k = b.dataset.bimp; if (k === "mapa") window.KT_MAPA?.importar(); else if (k === "modelo") window.KT_MAPA?.modelo(); else if (k === "lista") window.KT_PROJ?.importarRamper(); else if (k === "exp") window.KT_PROJ?.exportarBase(); }); };
    return r; };
  /* consulta: categorias */
  const norm2 = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const CATS = [["todos", "Todos"], ["cliente", "Cliente"], ["investidor", "Investidor"], ["target", "Target"], ["consultor", "Consultor"], ["parceiro", "Parceiro"]];
  const catDe = s => { const c = ["todos"];
    if (s.nivel === "N1") c.push("investidor");
    if (s.nivel === "N3"){ c.push("target"); if (s.mandato?.status || s.projeto || s.pos?.avulso || s.imoveis?.length || s.ativos) c.push("cliente"); }
    if (s.nivel === "N2"){ c.push(/consult|assessor|advog|auditor|contad|escrit/i.test([s.tipo, s.nome, s.acordo?.tipo].join(" ")) ? "consultor" : "parceiro"); }
    return c; };
  const conta = k => S.suppliers.filter(s => k === "todos" || catDe(s).includes(k)).length;

  /* menu: Base inicial primeiro; sem Evidências; Órbita sem a análise prévia solta */
  const menu = () => { const nav = $("nav.tabs"); if (!nav) return; const b = $('[data-go="cadeia"]', nav); if (b && nav.firstElementChild !== b) nav.prepend(b);
    const ev = $('[data-go="evidencias"]', nav); if (ev){ ev.hidden = true; ev.style.display = "none"; } };
  menu(); setTimeout(menu, 0); setTimeout(menu, 600);
  const css = document.createElement("style");
  css.textContent = `#orb-busca,.orb-busca{display:none!important}#v-orbita .target .photos{display:none!important}#d-ev{display:none!important}
@media (max-width:760px){#v-orbita .lvl{top:8px!important}#bi-top .dd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}#bi-top h2{font-size:20px}}
@media (max-width:440px){.brand b .sys{display:inline!important;font-size:.85em}.brand b{font-size:15px}}
@media (max-width:760px){#auditoria .head > div > p.sub,#financas .head > div > p.sub,#valuation .head > div > p.sub,#apresentacao .head > div > p.sub,#pos .head > div > p.sub,#juridico .head > div > p.sub{display:none}#auditoria .dd-tabs,#financas .dd-tabs,#valuation .dd-tabs,#apresentacao .dd-tabs,#pos .dd-tabs,#juridico .dd-tabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;gap:6px}#auditoria .dd-tabs .fbtn,#financas .dd-tabs .fbtn,#valuation .dd-tabs .fbtn,#apresentacao .dd-tabs .fbtn,#pos .dd-tabs .fbtn,#juridico .dd-tabs .fbtn{flex:0 0 auto;white-space:nowrap}}`;
  document.head.appendChild(css);

  /* cartão do target na Órbita: mais compacto e com o valuation moderado (FCD) e por múltiplos */
  const faixaTxt = (a, b) => a == null ? "—" : Math.abs(b - a) < 5e4 ? mi(a) : `R$ ${fmt(a / 1e6, 1)}–${fmt(b / 1e6, 1)} mi`;
  function valCartao(s){
    let fcd = null, mult = null, dl = 0, prelim = false, fonte = "";
    try{ if (D.temBal(s) && window.KT_VAL){ const R = KT_VAL.resumo(s); if (R.X && !R.X.vazio){ dl = R.X.dl;
        fcd = R.mod ? [R.mod.min, R.mod.max] : null; const m = R.met.find(x => /EV\/EBITDA/.test(x[0]) && !/Transa/.test(x[0])); if (m) mult = [m[1], m[2]];
        prelim = (R.A || []).some(a => a.nivel === "bloqueio"); fonte = "balancete " + R.X.perBase; } } }catch(e){}
    if (!mult){ const V = valorAlvo(s); if (V && /EBITDA ×|faturamento ×/.test(V.fonte)){ mult = [V.ev, V.ev]; dl = V.dl; fonte = fonte || "cadastro"; } }
    return {fcd, mult, dl, prelim, fonte};
  }
  EXT_TARGET.push((s, el) => { if (s.nivel !== "N3") return; const v = valCartao(s); if (!v.fcd && !v.mult) return;
    const box = document.createElement("div"); box.className = "tg-val";
    const t = (rot, f) => `<div><span>${rot}</span><b>${f ? faixaTxt(f[0], f[1]) : "—"}</b>${f ? `<small>equity ${faixaTxt(f[0] - v.dl, f[1] - v.dl)}</small>` : `<small>${rot.startsWith("Múlt") ? "sem comparáveis do segmento" : "sem balancete"}</small>`}</div>`;
    box.innerHTML = t("Valuation moderado · FCD", v.fcd) + t("Múltiplos · EV/EBITDA", v.mult) + (v.prelim ? `<em>preliminar: histórico incompleto</em>` : "");
    const acts = el.querySelector(".acts"); el.insertBefore(box, acts || null); });
  const cssT = document.createElement("style");
  cssT.textContent = `#v-orbita .target{padding:8px 11px!important;gap:3px 8px!important;font-size:12px}
#v-orbita .target h3{font-size:14px!important}#v-orbita .target .loc{font-size:10px}
#v-orbita .target .acts .btn{padding:5px 10px;font-size:12px}
.tg-val{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px}
.tg-val>div{border:1px solid var(--line-2);border-radius:9px;padding:5px 8px;display:flex;flex-direction:column;min-width:0}
.tg-val span{font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.tg-val b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tg-val small{font-size:10.5px;color:var(--muted)}
.tg-val em{grid-column:1/-1;font-size:10.5px;color:#F2C14E;font-style:normal}
@media (max-width:760px){#v-orbita .target{max-height:38vh!important}#v-orbita .target > div[style*="flex-wrap"] > span:nth-child(n+5){display:none}}`;
  document.head.appendChild(cssT);
  window.KT_BASE = {cadastro, valorAlvo, capacidade, condicao, consultas, dossiePdf};
})();
