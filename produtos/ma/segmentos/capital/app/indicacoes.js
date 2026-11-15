/* ================= KINSEY CAPITAL · INDICAÇÕES (INVESTIDORES × TARGETS) =================
   O sistema indica os principais targets para cada investidor (N1) e os principais investidores para cada target (N3):
   - aderência à tese (matching: segmento, faturamento, EBITDA, ticket, região, participação e restrições);
   - o que o investidor compra (atividades, CNAEs e CNPJs da tese) e ligações já feitas no mapa;
   - política Kinsey (faturamento de R$ 15 mi a R$ 10 bi), temperatura e capacidade de compra;
   - informações de mercado do investidor: aquisições recentes (notícias), capital disponível, companhia aberta (CVM/B3)
     e, para investidores internacionais, notícias em inglês e movimentos no Brasil.
   Prospecção: busca nas bases contratadas (Econodata, Ramper, Lemitti) pela API oficial com os critérios da tese do
   investidor (versão publicada, token no Secret Manager); sem API configurada, pelo arquivo exportado da fonte. */
if (window.KT_DD && window.KT_MATCH) (() => {
  const D = KT_DD, {mi} = D, MAX = 5;
  const pol = t => { try{ return window.KT_POL ? KT_POL.politica(t).st : "sem"; }catch(e){ return "sem"; } };
  const ader = (inv, t) => { try{ return window.KT_ORBINV ? KT_ORBINV.aderente(inv, t) : null; }catch(e){ return null; } };
  const cond = (inv, t) => { try{ return window.KT_BASE ? KT_BASE.condicao(inv, t) : null; }catch(e){ return null; } };
  const TEMP = {quente:8, morno:4, frio:0};
  const PAR = new WeakMap(); function par(inv, t){ let m = PAR.get(inv); if (!m){ m = new WeakMap(); PAR.set(inv, m); } if (!m.has(t)) m.set(t, par0(inv, t)); return m.get(t); }
  function par0(inv, t){
    const m = KT_MATCH.score(inv, t), a = ader(inv, t), p = pol(t), c = cond(inv, t), ligado = (t.investidores || []).includes(inv.id);
    if (m.elim) return {inv, t, sc:0, elim:true, motivos:[m.motivo], m, a, p, c, ligado};
    let sc = m.score * .6 + (a ? 35 : 0) + (p === "ok" ? 5 : 0) + (TEMP[String(t.mapa?.temperatura || "").toLowerCase()] || 0);
    if (c && /Acima/i.test(c.txt || "")) sc -= 15; sc = Math.max(0, Math.min(100, Math.round(sc)));
    const segPts = m.M.find(x => x.crit === "Segmento")?.pts || 0, Q = window.KT_QUAL ? KT_QUAL.avaliar(inv, t) : null; let tese = !!a || segPts >= 15; if (Q && !Q.ativ.ok && !ligado) tese = false;
    const motivos = [a && (a === "ligado no mapa" ? "já ligado no mapa M&A" : a), ...m.M.filter(x => x.pts === x.max && x.max >= 10 && !/n[aã]o (informad|definid)|sem dado/.test(x.txt)).map(x => `${x.crit.toLowerCase()}: ${x.txt}`), Q ? Q.ativ.txt : "", Q && Q.porte.st !== "sem" ? Q.porte.txt : "", c?.txt && !/Sem valor|sem dados/i.test(c.txt) ? c.txt.toLowerCase() : ""].filter(Boolean).filter(x => !/^segmento[ :]/.test(x) || !Q?.ativ.ok).filter((x, i, L) => !(/^segmento /.test(x) && L.some(y => /^segmento: /.test(y))));
    if (!tese) sc = Math.min(sc, 30);
    if (Q && !Q.ok && !ligado) sc = Math.min(sc, 45);
    return {inv, t, sc, elim:false, motivos, m, a, p, c, ligado, tese, Q, qualificar:!!(Q && Q.ativ.ok && Q.porte.st === "sem"), pequeno:Q?.porte.st === "pequeno", fora:p === "abaixo"};
  }
  const N1 = () => S.suppliers.filter(x => x.nivel === "N1"), N3 = () => S.suppliers.filter(x => x.nivel === "N3" && x.etapa !== "descartada" && !x.standby?.ativo);
  const valido = x => !x.elim && x.tese && (x.ligado || (!x.qualificar && !x.pequeno && x.sc >= 50));
  const aQualificar = t => N1().map(inv => par(inv, t)).filter(x => !x.elim && x.qualificar && !x.ligado);
  const targetsPara = inv => N3().map(t => par(inv, t)).filter(valido).sort((a, b) => b.sc - a.sc);
  const investidoresPara = t => N1().map(inv => par(inv, t)).filter(valido).sort((a, b) => b.sc - a.sc);
  /* mercado do investidor */
  function mercado(inv){
    const x = inv.ext || {}, K = window.KT_BASE ? (() => { try{ return KT_BASE.capacidade(inv); }catch(e){ return {}; } })() : {}, intl = inv.pais && !/brasil|brazil/i.test(inv.pais);
    const aq = [...(x.aquisicoes || []), ...(x.internacional?.aquisicoes || [])].sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
    return {intl, pais:inv.pais || "Brasil", tipo:inv.tipo || "", aq, ultima:aq[0], brasil:x.internacional?.brasil || [], b3:x.b3?.ticker || "", cap:K.cap ?? K.tmax ?? null, fonteCap:K.fonte || ""};
  }
  const nomeT = (t, inv) => t.mandato?.codinome && !["nda", "dataroom", "ioi", "loi"].includes(t.mandato?.acessos?.[inv?.id]?.status) ? `${t.nome} · ${t.mandato.codinome}` : t.nome;
  const barra = sc => `<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:60px;height:6px;border-radius:3px;background:var(--line);overflow:hidden;display:inline-block"><i style="display:block;height:100%;width:${sc}%;background:${sc >= 70 ? "#3DDC97" : sc >= 50 ? "#F2C14E" : "#FF8A5B"}"></i></span><b>${sc}</b></span>`;
  const infoInv = inv => { const M = mercado(inv); return [M.intl ? `🌐 ${esc(M.pais)}` : "Brasil", M.tipo && esc(M.tipo), M.b3 && `B3 ${esc(M.b3)}`, M.cap ? `capacidade ${mi(M.cap)}` : "", M.aq.length ? `${M.aq.length} notícia(s) de aquisição${M.ultima ? `: “${esc(String(M.ultima.titulo).slice(0, 80))}”` : ""}` : ""].filter(Boolean).join(" · "); };

  /* ---------------- painel ---------------- */
  S.indTab = S.indTab || "inv";
  function painel(){
    const ed = D.ed(), close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Indicações do sistema</div><h2>Investidores × targets</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="sheet-b" id="ind-b" style="display:flex;flex-direction:column;gap:12px"></div>`);
    const host = $("#ind-b");
    const desenha = () => {
      const tabs = `<div class="dd-tabs">${[["inv", "Targets para cada investidor"], ["tgt", "Investidores para cada target"]].map(([k, l]) => `<button type="button" class="fbtn" data-it="${k}" aria-pressed="${S.indTab === k}">${l}</button>`).join("")}</div>`;
      const q = `<input id="ind-q" placeholder="Filtrar por nome, segmento ou UF" value="${esc(S.indQ || "")}" style="max-width:340px">`, f = String(S.indQ || "").toLowerCase();
      let corpo = "";
      if (S.indTab === "inv") corpo = N1().filter(inv => !f || (inv.nome + " " + (inv.tipo || "") + " " + (inv.pais || "")).toLowerCase().includes(f)).map(inv => { const L = targetsPara(inv), M = mercado(inv);
        return `<div class="card" style="display:flex;flex-direction:column;gap:6px"><div class="head" style="margin:0"><div><h3 style="margin:0">${esc(inv.nome)}</h3><p class="sub" style="margin:2px 0 0">${infoInv(inv)}</p></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${ed ? `<button type="button" class="btn sm" data-pros="${inv.id}">Prospectar mais (Econodata)</button>` : ""}<button type="button" class="btn sm" data-rexp="${inv.id}">Lista para cadência (Ramper)</button></div></div>
          ${M.intl && M.brasil.length ? `<p class="sub" style="margin:0;font-size:12px">Movimentos no Brasil: ${M.brasil.slice(0, 2).map(n => esc(n.titulo)).join(" · ")}</p>` : ""}
          ${L.length ? `<div class="tbl"><table><tbody>${L.slice(0, MAX).map(x => linha(x, "inv")).join("")}</tbody></table></div>${L.length > MAX ? `<p class="sub" style="margin:0">+${L.length - MAX} target(s) aderente(s)</p>` : ""}` : `<p class="sub" style="margin:0">Nenhum target aderente na base. Use “Prospectar mais” para buscar empresas com os critérios da tese.</p>`}</div>`; }).join("");
      else corpo = N3().filter(t => !f || (t.nome + " " + (t.segmento || "") + " " + (t.uf || "")).toLowerCase().includes(f)).sort((a, b) => (b.mandato?.status === "assinado") - (a.mandato?.status === "assinado")).map(t => { const L = investidoresPara(t);
        return `<div class="card" style="display:flex;flex-direction:column;gap:6px"><div><h3 style="margin:0">${esc(t.nome)}</h3><p class="sub" style="margin:2px 0 0">${esc([t.perfil?.segmento || t.segmento, [t.municipio, t.uf].filter(Boolean).join("/"), t.mandato?.status === "assinado" ? "mandato assinado" : "", pol(t) === "abaixo" ? "fora da política" : ""].filter(Boolean).join(" · "))}</p></div>
          ${L.length ? `<div class="tbl"><table><tbody>${L.slice(0, MAX).map(x => linha(x, "tgt")).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0">Nenhum investidor aderente na base.</p>`}
          ${(() => { const Lq = aQualificar(t); return Lq.length ? `<div class="sub" style="margin:0;font-size:12px">A qualificar (mesma atividade, porte não informado): ${Lq.slice(0, 8).map(x => `<a href="#" data-abre="${x.inv.id}" onclick="return false" style="color:var(--glow)">${esc(x.inv.nome)}</a>`).join(", ")}</div>` : ""; })()}
          ${window.KT_PINV && D.ed() ? `<button type="button" class="btn sm" data-pq="${t.id}" style="align-self:flex-start">Consultar prováveis investidores no mercado</button>` : ""}</div>`; }).join("");
      host.innerHTML = tabs + `<p class="sub" style="margin:0">Só entram ligações com a mesma atividade (subsetor ou CNAE; fundo com o setor na tese) e investidor com porte muito maior que o target (estratégico: faturamento ≥ 3× ou capacidade ≥ 1,5× o valuation; fundo: ticket ou capacidade ≥ valuation). Investidor sem porte informado fica em "a qualificar". Investidores internacionais trazem notícias em inglês e movimentos no Brasil (versão publicada).</p>` + q + corpo;
      $$("[data-it]", host).forEach(b => b.onclick = () => { S.indTab = b.dataset.it; desenha(); });
      $("#ind-q").oninput = e => { S.indQ = e.target.value; clearTimeout(desenha._t); desenha._t = setTimeout(() => { desenha(); const i = $("#ind-q"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250); };
      $$("[data-ind]", host).forEach(b => b.onclick = () => { const [iid, tid] = b.dataset.ind.split("|"), t = supById(tid); D.up(t, {investidores:[...new Set([...(t.investidores || []), iid])]}).then(() => { toast("Indicação registrada no mapa"); desenha(); }); });
      $$("[data-abre]", host).forEach(b => b.onclick = () => { close(); openSupplier(b.dataset.abre, "dados"); });
      $$("[data-pros]", host).forEach(b => b.onclick = () => prospectar(supById(b.dataset.pros)));
      $$("[data-rexp]", host).forEach(b => b.onclick = () => cadencia(supById(b.dataset.rexp)));
      $$("[data-pq]", host).forEach(b => b.onclick = () => { close(); KT_PINV.perguntar(supById(b.dataset.pq)); });
    };
    const linha = (x, modo) => { const o = modo === "inv" ? x.t : x.inv;
      return `<tr class="ind-l"><td style="min-width:150px"><a href="#" data-abre="${o.id}" onclick="return false" style="color:inherit"><b>${esc(modo === "inv" ? nomeT(o, x.inv) : o.nome)}</b></a><div class="sub" style="margin:0;font-size:11.5px">${modo === "inv" ? esc([o.perfil?.segmento || o.segmento, o.uf, o.mapa?.temperatura].filter(Boolean).join(" · ")) : infoInv(o)}</div></td>
        <td>${barra(x.sc)}</td><td style="font-size:12px;max-width:360px">${esc(x.motivos.slice(0, 3).join("; ") || "aderente pela tese")}${x.fora ? ` <span class="pill r-medio">fora da política</span>` : ""}</td>
        <td style="text-align:right;white-space:nowrap">${x.ligado ? `<span class="pill r-baixo">Indicado</span>` : D.ed() ? `<button type="button" class="btn sm" data-ind="${x.inv.id}|${x.t.id}">Indicar</button>` : ""}</td></tr>`; };
    desenha();
  }
  /* ---------------- prospecção nas bases contratadas ---------------- */
  const publicado = () => !!(window.firebase?.functions && Store.db);
  function filtrosDe(inv){ const T = inv.tese || {}, C = window.KT_ORBINV ? KT_ORBINV.criterios(inv) : {};
    return {cnaes:C.cnaes || [], ufs:C.ufs || [], regioes:C.regioes || [], atividades:(C.atv || []).map(a => a.join(" ")), fatMin:Math.max(T.fatMin ?? 0, window.KT_POL?.MIN || 15), fatMax:Math.min(T.fatMax ?? Infinity, window.KT_POL?.MAX || 10000), segmentos:T.segmentos || []}; }
  async function prospectar(inv){
    const F = filtrosDe(inv);
    if (!publicado()){ sheet(`<div class="sheet-h"><div><div class="eyebrow">Prospecção · ${esc(inv.nome)}</div><h2>Critérios para o Econodata</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><p class="sub" style="margin:0">Nesta versão local a busca é pelo arquivo: filtre no Econodata com os critérios abaixo, exporte a lista e importe aqui (os novos targets já entram ligados a ${esc(inv.nome)}). Na versão publicada, com a API configurada, a busca é direta.</p>
      <div class="tbl"><table><tbody>${[["CNAEs", F.cnaes.join(", ") || "—"], ["Atividades", F.atividades.join(" · ") || "—"], ["Segmentos", F.segmentos.join(", ") || "—"], ["UFs", F.ufs.join(", ") || "Brasil"], ["Regiões", F.regioes.join(", ") || "—"], ["Faturamento", `de R$ ${F.fatMin} mi até ${F.fatMax >= 1000 ? `R$ ${fmt(F.fatMax / 1000, 1)} bi` : `R$ ${F.fatMax} mi`} (política Kinsey: R$ 15 mi a R$ 10 bi)`]].map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="pr-imp">Importar lista do Econodata</button></div></div>`);
      $("#pr-imp").onclick = () => KT_POL.importarLista("Econodata", inv.id); return; }
    toast("Buscando no Econodata…");
    try{ const fn = firebase.app().functions("southamerica-east1").httpsCallable("prospeccao", {timeout:300000}), r = (await fn({fonte:"econodata", modo:"buscar", filtros:F})).data;
      if (!r?.lista?.length){ toast("Nenhuma empresa nova com esses critérios."); return; }
      KT_POL.revisarLista("Econodata", r.lista, inv.id, `API Econodata · ${new Date().toLocaleDateString("pt-BR")}`); }
    catch(e){ toast(/configurad/.test(e.message || "") ? "API do Econodata ainda não configurada: use o arquivo exportado." : "Busca indisponível: " + (e.message || "erro")); if (/configurad/.test(e.message || "")) KT_POL.importarLista("Econodata", inv.id); }
  }
  /* lista para cadência no Ramper: targets indicados ao investidor, com contatos do enriquecimento */
  function cadencia(inv){
    const L = targetsPara(inv).filter(x => !x.fora), q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas = [["CNPJ", "Empresa", "Segmento", "Cidade", "UF", "Contato", "Cargo", "E-mail", "Telefone", "Aderência", "Investidor"].join(";"), ...L.map(({t, sc}) => { const p = Object.values(t.enriq?.fontes || {}).flatMap(f => f.pessoas || [])[0] || {};
      return [t.doc, t.nome, t.perfil?.segmento || t.segmento, t.municipio, t.uf, p.nome || "", p.cargo || "", p.email || "", p.cel || t.mapa?.telefone || "", sc, inv.nome].map(q).join(";"); })];
    rptSave(new TextEncoder().encode("﻿" + linhas.join("\n")), `KinseyTec_MA_cadencia_${(inv.nome || "").replace(/[^\w]+/g, "_").slice(0, 30)}.csv`, "text/csv"); toast(`${L.length} target(s) na lista para o Ramper`); }

  /* ---------------- Base inicial: cartão-resumo ---------------- */
  const _cad = renderCadeia;
  renderCadeia = function(){ const r = _cad.apply(this, arguments); const top = $("#bi-top"); if (!top || $("#bi-ind")) return r;
    const pares = N1().flatMap(inv => targetsPara(inv).filter(x => !x.ligado && !x.fora).slice(0, 2)).sort((a, b) => b.sc - a.sc).slice(0, 4);
    const el = document.createElement("div"); el.className = "card"; el.id = "bi-ind"; el.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:10px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Indicações do sistema</div><h3 style="margin:0">Principais targets para os investidores e vice-versa</h3></div><button type="button" class="btn sm primary" id="bi-indv">Ver indicações</button></div>
      ${pares.length ? `<div style="display:flex;flex-direction:column">${pares.map(x => `<div style="border-top:1px solid var(--line);padding:8px 0;display:flex;flex-direction:column;gap:3px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span style="min-width:0"><b>${esc(x.inv.nome)}</b> → ${esc(nomeT(x.t, x.inv))}</span>${barra(x.sc)}</div><div class="sub" style="font-size:12px;margin:0">${esc(x.motivos.slice(0, 2).join(" · "))}</div></div>`).join("")}</div>` : `<p class="sub" style="margin:0">Cadastre a tese dos investidores (o que compram) para o sistema indicar os targets.</p>`}`;
    const ref = $("#bi-int"); if (ref) ref.before(el); else top.appendChild(el);
    $("#bi-indv", el).onclick = painel; return r; };
  /* dossiê do investidor internacional: notícias em inglês */
  const _b = renderSupBody;
  renderSupBody = function(){ const r = _b.apply(this, arguments); const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || s.nivel !== "N1" || S.supTab !== "dados" || b.querySelector("[data-intl]")) return r;
    const M = mercado(s); if (!M.intl) return r;
    const el = document.createElement("div"); el.className = "card"; el.setAttribute("data-intl", "1"); el.style.cssText = "display:flex;flex-direction:column;gap:6px";
    el.innerHTML = `<h3>Investidor internacional · ${esc(M.pais)}</h3>${[...(s.ext?.internacional?.aquisicoes || []).slice(0, 5), ...M.brasil.slice(0, 3)].map(n => `<div style="font-size:13px">• <a href="${esc(n.url || "#")}" target="_blank" rel="noopener" style="color:inherit">${esc(n.titulo)}</a> <span class="sub">${esc(n.fonte || "")} ${esc(n.data || "")}</span></div>`).join("") || `<p class="sub" style="margin:0">As notícias internacionais (aquisições e movimentos no Brasil) são buscadas na versão publicada ao cadastrar o investidor.</p>`}
      <div><b>Targets indicados:</b> ${targetsPara(s).slice(0, 5).map(x => esc(nomeT(x.t, s)) + ` (${x.sc})`).join(", ") || "nenhum aderente"}</div>`;
    b.appendChild(el); return r; };
  const css = document.createElement("style"); css.textContent = `@media (max-width:760px){ tr.ind-l{display:flex;flex-wrap:wrap;gap:4px 10px;padding:8px 0;border-bottom:1px solid var(--line)} tr.ind-l td{display:block;padding:0!important;border:0!important;max-width:none!important;min-width:0!important} tr.ind-l td:first-child{flex:1 1 60%} tr.ind-l td:nth-child(3){flex:1 1 100%;order:3} tr.ind-l td:last-child{order:2} }`; document.head.appendChild(css);
  window.KT_IND = {par, aQualificar, targetsPara, investidoresPara, mercado, painel, prospectar, cadencia, filtrosDe};
})();
