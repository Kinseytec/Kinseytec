/* ================= KINSEY CAPITAL · INVESTIDORES PROVÁVEIS DO TARGET =================
   No target (N3), o consultor mantém a lista de investidores prováveis (N1 já cadastrados e contactados) com a situação
   da conversa: a contatar, contatado, interessado, NDA enviado, NDA assinado, sem interesse.
   "Você quer consultar prováveis investidores para este target?": o sistema consulta
   1) a base Kinsey (tese, o que compra, capacidade e aquisições recentes de cada N1);
   2) o mercado: notícias de aquisições no segmento (private equity, fundos e estratégicos) com o comprador extraído;
   3) as bases de prospecção (Econodata, Ramper, Lemitti): empresas maiores do mesmo CNAE, consolidadoras naturais,
      com sócios, decisores e contatos (versão publicada, API oficial; local, listas importadas).
   Traz o resumo com a orientação de contato (gestor, sócio, decisor ou time de M&A, para o consultor ou o SDR), permite
   incluir cada um como N1 provável e gera o PDF com as informações e os contatos (uso interno). */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const ST = [["", "Sugerido"], ["contatar", "A contatar"], ["contatado", "Contatado"], ["interessado", "Interessado"], ["nda_env", "NDA enviado"], ["nda", "NDA assinado"], ["sem", "Sem interesse"]];
  const stNome = k => (ST.find(x => x[0] === (k || "")) || ST[0])[1], stCls = k => ({interessado:"r-baixo", nda:"r-baixo", nda_env:"r-medio", contatado:"r-medio", sem:"r-alto"})[k] || "r-pend";
  const segDe = t => t.perfil?.segmento || t.segmento || "", fatMi = t => window.KT_POL ? KT_POL.fatMi(t) : null;
  const pessoas = s => Object.values(s.enriq?.fontes || {}).flatMap(f => (f.pessoas || []).map(p => ({...p, fonte:f.fonte || ""}))).filter(p => p.nome || p.email || p.cel).slice(0, 6);
  const publicado = () => !!(window.firebase?.functions && Store.db);
  /* comprador a partir do título da notícia: "X compra Y", "X adquire Y", "X anuncia aquisição de Y" */
  const COMPRA = /^(.{3,70}?)\s+(compra|adquire|adquiriu|comprou|anuncia (a )?(compra|aquisi[cç][aã]o)|fecha (a )?(compra|aquisi[cç][aã]o)|conclui (a )?(compra|aquisi[cç][aã]o)|acquires|to acquire|buys)\b/i;
  const comprador = titulo => { const m = String(titulo || "").replace(/^["“]/, "").match(COMPRA); if (!m) return ""; const n = m[1].replace(/^(a|o|grupo|fundo)\s+/i, (x) => x).replace(/[,:;].*$/, "").trim(); return n.split(" ").length <= 7 ? n : ""; };
  const tipoDe = n => /capital|partners|investimentos|gest[aã]o|equity|fund|fundo|ventures|asset|holding|participa[cç][oõ]es/i.test(n) ? "Private equity / fundo" : "Estratégico";

  /* ---------------- consulta ---------------- */
  async function consultar(t){
    const seg = segDe(t), cn = String(t.receita?.cnae || t.cnae || "").replace(/\D/g, ""), fat = fatMi(t), out = {em:nowISO(), seg, base:[], mercado:[], bases:[], avisos:[]};
    /* 1) base Kinsey */
    if (window.KT_IND) out.base = KT_IND.investidoresPara(t).slice(0, 12).map(x => ({id:x.inv.id, nome:x.inv.nome, tipo:x.inv.tipo || "", pais:x.inv.pais || "Brasil", sc:x.sc, motivos:[...new Set(x.motivos)].slice(0, 3), aq:(x.inv.ext?.aquisicoes || []).slice(0, 2).map(n => n.titulo), pessoas:pessoas(x.inv), ja:(t.investidores || []).includes(x.inv.id)}));
    /* 2) mercado: notícias de aquisições */
    let nots = [];
    if (publicado()){ try{ const r = (await firebase.app().functions("southamerica-east1").httpsCallable("investidoresProvaveis", {timeout:120000})({id:t.id})).data || {}; nots = r.noticias || []; out.bases = r.bases || []; (r.avisos || []).forEach(a => out.avisos.push(a)); }
      catch(e){ out.avisos.push("Consulta de mercado indisponível agora: " + (e.message || "erro")); } }
    else out.avisos.push("Nesta versão local a busca de notícias e das APIs não roda: o resultado usa a base, as notícias já guardadas e as listas importadas. Na versão publicada a consulta é completa.");
    nots = [...nots, ...((S.mercado?.noticias_seg || {})[seg] || []), ...S.suppliers.filter(x => x.nivel === "N1").flatMap(x => (x.ext?.aquisicoes || []).map(n => ({...n, inv:x.nome})))];
    const vistos = new Set(out.base.map(b => nrm(b.nome)));
    nots.forEach(n => { const c = n.inv || comprador(n.titulo); if (!c) return; const k = nrm(c); if (vistos.has(k)) return; if (!/aquisi|adquir|compra|acqui|buy/i.test(n.titulo || "")) return; vistos.add(k);
      const naBase = S.suppliers.find(x => x.nivel === "N1" && nrm(x.nome).includes(k.slice(0, 12)));
      out.mercado.push({nome:c, tipo:tipoDe(c), titulo:n.titulo, url:n.url || "", data:n.data || "", fonte:n.fonte || "", id:naBase?.id || "", ja:naBase ? (t.investidores || []).includes(naBase.id) : false}); });
    out.mercado = out.mercado.slice(0, 15);
    /* 3) bases de prospecção: empresas maiores do mesmo CNAE (consolidadoras), já importadas ou vindas da API */
    const loc = S.suppliers.filter(x => x.id !== t.id && x.enriq?.fontes && (cn && String(x.receita?.cnae || x.enriq?.fontes && Object.values(x.enriq.fontes)[0]?.cnae || "").replace(/\D/g, "").slice(0, 4) === cn.slice(0, 4) || nrm(segDe(x)) === nrm(seg)))
      .filter(x => { const f = fatMi(x); return f != null && (fat == null || f >= fat * 2); }).map(x => ({nome:x.nome, doc:x.doc, fat:fatMi(x), uf:x.uf, pessoas:pessoas(x), fonte:Object.keys(x.enriq.fontes).join(", "), id:x.nivel === "N1" ? x.id : ""}));
    out.bases = [...out.bases.map(o => ({nome:o.nome, doc:o.d ? fmtCnpj(o.d) : "", fat:window.KT_POL ? KT_POL.emMi(o.fat) : null, uf:o.uf, pessoas:o.pessoas || [], fonte:o.fonte || "API"})), ...loc].filter((x, i, a) => a.findIndex(y => nrm(y.nome) === nrm(x.nome)) === i).sort((a, b) => (b.fat || 0) - (a.fat || 0)).slice(0, 15);
    if (!out.bases.length) out.avisos.push(`Sem empresas maiores do mesmo setor nas bases importadas. Importe do Econodata a lista do CNAE ${cn ? cn.slice(0, 4) : seg} com faturamento acima de ${fat ? "R$ " + fmt(fat * 2, 0) + " mi" : "o do target"} (consolidadoras).`);
    await D.up(t, {prospInv:out}); return out;
  }
  const fmtCnpj = d => String(d).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  const ORIENTA = "Abordagem: o consultor ou o SDR contata o sócio-gestor do setor, o diretor de M&A ou desenvolvimento corporativo (estratégicos) ou o sócio responsável pelo setor (fundos). Apresente a oportunidade só pelo nome-código e pelo one-pager; dados que identificam o target apenas após o NDA. Registre cada contato em Interações e atualize a situação do investidor.";

  /* inclui como N1 provável (cria o investidor se não existir) */
  async function incluir(t, c, origem){
    let id = c.id; if (!id){ id = "pi" + Date.now().toString(36) + Math.random().toString(36).slice(2, 4); const base = {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), origem:`Prospecção para ${t.mandato?.codinome || t.nome} · ${origem}`, nivel:"N1", nome:c.nome, tipo:c.tipo || "Investidor estratégico", pais:"Brasil", uf:c.uf || "", doc:c.doc || "", lat:-23.55, lng:-46.63, tese:{segmentos:[segDe(t)].filter(Boolean)}};
      if (c.pessoas?.length) base.enriq = {fontes:{[origem]:{em:nowISO(), pessoas:c.pessoas}}}; await Store.set("suppliers", id, base); }
    await D.up(supById(t.id) || t, {investidores:[...new Set([...(t.investidores || []), id])], invProv:{[id]:{st:"contatar", em:nowISO(), por:Store.me?.email || "", origem}}}); return id; }

  /* ---------------- tela de resultado ---------------- */
  function resultado(t, R){
    const ed = D.ed(), pp = L => L.length ? L.map(p => `<div style="font-size:12px">${esc([p.nome, p.cargo].filter(Boolean).join(" · "))}${p.email ? ` · <span class="mono">${esc(p.email)}</span>` : ""}${p.cel ? ` · <span class="mono">${esc(p.cel)}</span>` : ""}</div>`).join("") : `<div class="sub" style="font-size:12px;margin:0">sem contato nas bases: buscar o decisor no Econodata, Lemitti ou LinkedIn</div>`;
    const bloco = (tit, sub, L, f) => `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div><h3 style="margin:0">${tit} <span class="sub">(${L.length})</span></h3><p class="sub" style="margin:2px 0 0">${sub}</p></div>${L.length ? L.map(f).join("") : `<p class="sub" style="margin:0">Nada encontrado.</p>`}</div>`;
    const item = (k, i, c, corpo) => `<div style="border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:flex-start"><div style="min-width:0"><b>${esc(c.nome)}</b> <span class="sub" style="font-size:12px">${esc([c.tipo, c.pais, c.uf, c.fat ? `fat. R$ ${fmt(c.fat, 0)} mi` : ""].filter(Boolean).join(" · "))}</span></div>${c.ja ? `<span class="pill r-baixo">Já é provável</span>` : ed ? `<button type="button" class="btn sm" data-pi="${k}|${i}">Incluir como provável</button>` : ""}</div>${corpo}</div>`;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Investidores prováveis · ${esc(t.mandato?.codinome || t.nome)}</div><h2>Resultado da consulta</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        ${R.avisos.map(a => `<div class="banner" style="font-size:12.5px">${esc(a)}</div>`).join("")}
        <div class="banner" style="font-size:12.5px"><b>Orientação de contato.</b> ${esc(ORIENTA)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="pi-pdf">Gerar PDF com informações e contatos</button></div>
        ${bloco("Na base Kinsey", "Investidores cadastrados aderentes à tese, com aquisições recentes.", R.base, (c, i) => item("base", i, c, `<div class="sub" style="font-size:12px;margin:0">${esc(c.motivos.join("; "))} · aderência ${c.sc}</div>${c.aq.length ? `<div style="font-size:12px">Aquisições: ${esc(c.aq.join(" · "))}</div>` : ""}${pp(c.pessoas)}`))}
        ${bloco("No mercado (notícias de aquisições)", `Private equity, fundos e estratégicos que compraram empresas de ${esc(R.seg || "o setor")}.`, R.mercado, (c, i) => item("mercado", i, c, `<div style="font-size:12px"><a href="${esc(c.url || "#")}" target="_blank" rel="noopener" style="color:inherit">${esc(c.titulo)}</a> <span class="sub">${esc(c.fonte)} ${esc(c.data)}</span></div>`))}
        ${bloco("Nas bases de prospecção (Econodata, Ramper, Lemitti)", "Empresas maiores do mesmo setor: consolidadoras naturais, com sócios e decisores.", R.bases, (c, i) => item("bases", i, {...c, tipo:"Estratégico (consolidador)"}, `${c.doc ? `<div class="sub mono" style="font-size:12px;margin:0">${esc(c.doc)} · ${esc(c.fonte)}</div>` : ""}${pp(c.pessoas)}`))}</div>`);
    $$("[data-pi]").forEach(b => b.onclick = async () => { const [k, i] = b.dataset.pi.split("|"), c = R[k][+i]; b.disabled = true; await incluir(supById(t.id), c, {base:"base Kinsey", mercado:"notícias de aquisições", bases:c.fonte || "bases de prospecção"}[k]); c.ja = true; b.outerHTML = `<span class="pill r-baixo">Incluído</span>`; toast(`${c.nome} incluído como investidor provável`); });
    $("#pi-pdf").onclick = () => pdf(supById(t.id), R).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
  }
  function perguntar(t){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(t.mandato?.codinome || t.nome)}</div><h2>Consultar prováveis investidores?</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><p style="margin:0">Você quer consultar prováveis investidores para este target? O sistema procura:</p>
      <ul style="margin:0;padding-left:18px;font-size:13.5px;display:flex;flex-direction:column;gap:4px"><li>na <b>base Kinsey</b>: investidores aderentes à tese, com aquisições recentes;</li><li>no <b>mercado</b>: notícias de aquisições em ${esc(segDe(t) || "o setor")} por private equities, fundos e grandes empresas;</li><li>no <b>Econodata, Ramper e Lemitti</b>: empresas maiores do mesmo setor, com sócios e decisores.</li></ul>
      <p class="sub" style="margin:0">O resultado traz o resumo, a orientação de contato para o consultor ou o SDR e o PDF com os contatos.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Agora não</button><button type="button" class="btn primary" id="pi-go">Sim, consultar</button></div></div>`);
    $("#pi-go").onclick = async () => { const b = $("#pi-go"); b.disabled = true; b.textContent = "Consultando…"; try{ const R = await consultar(t); close(); resultado(supById(t.id) || t, R); }catch(e){ console.error(e); b.disabled = false; b.textContent = "Sim, consultar"; toast("Não foi possível consultar agora."); } };
  }
  /* ---------------- PDF ---------------- */
  async function pdf(t, R){
    const Rl = KT_REL, P = KTPdf(), nome = t.mandato?.codinome || t.nome, prov = (t.investidores || []).map(id => supById(id)).filter(Boolean);
    Rl.capa(P, "Investidores prováveis · uso interno", nome, [["Target", t.nome], ["Segmento", R.seg || "—"], ["Consulta", new Date(R.em).toLocaleDateString("pt-BR")], ["Responsável", Store.me?.email || "equipe Kinsey"]]);
    Rl.sec(P, 1, "Orientação e situação"); Rl.par(P, ORIENTA, {size:9.5});
    if (prov.length) Rl.tab(P, ["Investidor provável", "Tipo", "Situação", "Contato"], prov.map(v => { const x = t.invProv?.[v.id] || {}, p = pessoas(v)[0]; return [v.nome, v.tipo || "", stNome(x.st), x.contato || (p ? [p.nome, p.cargo, p.email, p.cel].filter(Boolean).join(" · ") : "—")]; }), [.28, .17, .15, .4]);
    const ctt = L => L.map(p => [p.nome, p.cargo, p.email, p.cel].filter(Boolean).join(" · ")).join("\n") || "buscar decisor";
    Rl.sec(P, 2, "Base Kinsey"); R.base.length ? Rl.tab(P, ["Investidor", "Aderência", "Por que", "Contatos"], R.base.map(c => [`${c.nome}\n${[c.tipo, c.pais].filter(Boolean).join(" · ")}`, String(c.sc), c.motivos.join("; ") + (c.aq.length ? "\nAquisições: " + c.aq.join(" · ") : ""), ctt(c.pessoas)]), [.24, .1, .36, .3]) : Rl.par(P, "Nenhum investidor aderente na base.");
    Rl.sec(P, 3, "Mercado · notícias de aquisições"); R.mercado.length ? Rl.tab(P, ["Comprador", "Tipo", "Notícia", "Data"], R.mercado.map(c => [c.nome, c.tipo, `${c.titulo} (${c.fonte || ""})`, c.data || ""]), [.22, .15, .5, .13]) : Rl.par(P, "Nenhuma aquisição recente encontrada no segmento.");
    Rl.sec(P, 4, "Bases de prospecção · consolidadoras do setor"); R.bases.length ? Rl.tab(P, ["Empresa", "Faturamento", "Fonte", "Sócios e decisores"], R.bases.map(c => [`${c.nome}\n${c.doc || ""}`, c.fat ? `R$ ${fmt(c.fat, 0)} mi` : "—", c.fonte || "", ctt(c.pessoas)]), [.28, .13, .14, .45]) : Rl.par(P, "Sem empresas maiores do mesmo setor nas bases importadas.");
    Rl.par(P, "Documento interno da Kinsey. Contatos de sócios e decisores vindos das bases de prospecção: uso restrito à abordagem desta oportunidade (LGPD, legítimo interesse); não enviar a terceiros.", {size:8, color:[90,101,120]});
    await rptSave(P.out(`Investidores prováveis · ${nome}`, Rl.T(`Kinsey · Investidores prováveis · ${nome} · uso interno`)), Rl.arq(t, "investidores_provaveis", "pdf"), "application/pdf");
  }

  /* ---------------- dossiê do target · aba M&A ---------------- */
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); if (s.nivel !== "N3") return; const host = b.firstElementChild || b, ed = D.ed();
    const L = (s.investidores || []).map(id => supById(id)).filter(Boolean), el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<div class="head" style="margin:0"><div><h3 style="margin:0">Investidores prováveis</h3><p class="sub" style="margin:2px 0 0">Investidores (N1) já contactados ou a contatar para esta oportunidade, com a situação da conversa.</p></div>${ed ? `<button type="button" class="btn sm primary" id="pi-q">Consultar prováveis investidores</button>` : ""}</div>
      ${L.length ? L.map(v => { const x = s.invProv?.[v.id] || {}, p = pessoas(v)[0]; return `<div style="border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${esc(v.nome)}</b><span class="pill ${stCls(x.st)}">${stNome(x.st)}</span></div>
        <div class="sub" style="font-size:12px;margin:0">${esc([v.tipo, v.pais].filter(Boolean).join(" · "))}${p ? ` · ${esc([p.nome, p.cargo].filter(Boolean).join(", "))}` : ""}${x.em ? ` · atualizado ${dt(x.em)}` : ""}</div>
        ${ed ? `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:6px"><select data-pst="${v.id}" aria-label="Situação">${ST.map(([k, l]) => `<option value="${k}" ${k === (x.st || "") ? "selected" : ""}>${l}</option>`).join("")}</select><input data-pct="${v.id}" value="${esc(x.contato || "")}" placeholder="Com quem falou (nome, cargo)"></div>` : ""}</div>`; }).join("")
        : `<p class="sub" style="margin:0">Nenhum investidor provável ainda. Indique pelos "Investidores sugeridos" abaixo ou consulte o mercado.</p>`}
      ${s.prospInv ? `<button type="button" class="btn sm" id="pi-ult" style="align-self:flex-start">Ver a última consulta (${dt(s.prospInv.em)})</button>` : ""}`;
    host.insertBefore(el, host.children[1] || null);
    const q = $("#pi-q", el); if (q) q.onclick = () => perguntar(s);
    const u = $("#pi-ult", el); if (u) u.onclick = () => resultado(s, s.prospInv);
    $$("[data-pst]", el).forEach(x => x.onchange = () => D.up(s, {invProv:{[x.dataset.pst]:{st:x.value, em:nowISO(), por:Store.me?.email || ""}}}));
    $$("[data-pct]", el).forEach(x => x.onchange = () => D.up(s, {invProv:{[x.dataset.pct]:{contato:x.value.trim(), em:nowISO()}}}));
  };
  window.KT_PINV = {consultar, perguntar, resultado, pdf, incluir, comprador, ST};
})();
