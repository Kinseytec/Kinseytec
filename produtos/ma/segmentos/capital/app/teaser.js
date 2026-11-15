/* ================= KINSEY CAPITAL · APRESENTAÇÃO (TEASER) =================
   Dois momentos: antes do NDA (anônimo: nome-código, região, números arredondados, gráficos e mercado) e depois do
   NDA com o investidor (empresa identificada, histórico completo, Due Diligence, materiais do vendedor, pesquisa da
   empresa, do setor e da região, notícias do segmento). O conteúdo pós-NDA também entra no relatório de valuation. */
if (window.KT_DD && window.KT_VAL) (() => {
  const D = KT_DD, V = KT_VAL, {mi, pc, xx, div} = D;
  const REG = {N:["AC","AM","AP","PA","RO","RR","TO"], Nordeste:["AL","BA","CE","MA","PB","PE","PI","RN","SE"], "Centro-Oeste":["DF","GO","MT","MS"], Sudeste:["ES","MG","RJ","SP"], Sul:["PR","RS","SC"]};
  const regiao = uf => uf ? (Object.entries(REG).find(([, l]) => l.includes(uf))?.[0] || "").replace(/^N$/, "Norte") : "";
  const arred = v => { const m = v / 1e6, p = m >= 100 ? 10 : m >= 20 ? 5 : 1; return Math.round(m / p) * p * 1e6; };
  const POS = /(cresc|recorde|alta|expans|investiment|amplia|aquisi|export|demanda|lucro|avan|retomad)/i;
  function conteudo(s, fase){
    const pre = fase === "pre", p = s.perfil || {}, t = s.teaser || {}, seg = p.segmento || s.segmento || "", tem = D.temBal(s);
    const R = tem ? V.resumo(s) : null, X = R?.X, C = R?.C, Bs = V.base();
    const NOMES = ["Ipê", "Jatobá", "Aroeira", "Cedro", "Jacarandá", "Peroba", "Angico", "Sucupira", "Cumaru", "Imbuia", "Guarantã", "Pequi"], hs = [...String(s.id || s.nome)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const codinome = s.mandato?.codinome || `Projeto ${NOMES[hs % NOMES.length]}`, dc = pre ? 0 : 1;
    const dec = p.fundacao ? `fundada nos anos ${String(p.fundacao).slice(0, 3)}0` : "";
    const subtitulo = pre ? [seg, regiao(s.uf) ? "região " + regiao(s.uf) : "", dec].filter(Boolean).join(" · ") : [seg, s.municipio && `${s.municipio}/${s.uf}`, p.fundacao && `desde ${p.fundacao}`, p.funcionarios && `${p.funcionarios} funcionários`].filter(Boolean).join(" · ");
    const transacao = s.mandato?.participacao ? `Transação: venda de ${s.mandato.participacao}` : "Transação: busca de investidor estratégico ou financeiro";
    const kpis = [], serie = [], destaques = [], mercado = [], dd = [];
    if (X && !X.vazio){
      const an = X.H.anuais, rl = X.bp.rl, eb = X.bp.eb, cg = X.total;
      kpis.push([pre ? "Receita líquida (aprox.)" : "Receita líquida", pre ? "~" + mi(arred(rl), 0) : mi(rl), String(X.y0)], ["Margem EBITDA", pc(div(eb, rl), pre ? 0 : 1), pre ? "ajustada" : `EBITDA ajustado ${mi(eb)}`],
        ["Crescimento da receita", cg ? pc(cg.nom, pre ? 0 : 1) + " a.a." : "—", cg ? `${pc(cg.real, pre ? 0 : 1)} acima da inflação` : ""], ["Dívida líquida / EBITDA", xx(div(X.dl, eb)), pre ? "" : `dívida líquida ${mi(X.dl)}`]);
      an.forEach(a => serie.push({ano:String(a.ano), rl:pre ? Math.round(a.rl / 1e6) * 1e6 : a.rl, eb:pre ? Math.round(a.eb / 1e6) * 1e6 : a.eb, mg:div(a.eb, a.rl)}));
      if (cg && an.length > 1) destaques.push(`Receita cresceu ${pc(cg.nom, dc)} ao ano entre ${an[0].ano} e ${an[an.length - 1].ano}, ${pc(cg.real, dc)} acima da inflação.`);
      const best = Object.entries(X.histL).filter(([, h]) => h).sort((a, b) => b[1].real - a[1].real)[0]; if (best && best[1].real > 0 && Object.keys(X.histL).length > 1) destaques.push(`${best[0]}: crescimento real de ${pc(best[1].real, dc)} ao ano.`);
      if (C?.mg) destaques.push(`Margem EBITDA de ${pc(div(eb, rl), dc)}${X.mgHist > C.mg.med ? `, acima da mediana das companhias abertas do setor (${pc(C.mg.med)})` : ""}.`);
      const r = div(X.dl, eb); if (r != null && r < 2) destaques.push(`Endividamento moderado: dívida líquida de ${xx(r)} o EBITDA.`);
      X.H.comp.forEach(g => { const a = g[g.length - 2], b = g[g.length - 1], v = b.rl / a.rl - 1; if (v > 0) destaques.push(`Receita dos ${b.meses} meses até ${String(b.mes).padStart(2, "0")}/${b.ano} ${pc(v)} acima do mesmo período de ${a.ano}.`); });
      if (C?.eb) mercado.push(`Companhias abertas de ${seg.toLowerCase()} e setores semelhantes negociam a ${xx(C.eb.med)} o EBITDA (mediana de ${C.eb.n} companhias).`);
      if (R.T?.eb) mercado.push(`Transações recentes no setor: mediana de ${xx(R.T.eb.med)} o EBITDA em ${R.T.eb.n} aquisições.`);
      if (!pre){ const AJ = D.ajustes(s, X.perBase); dd.push(`Due Diligence contábil, financeira, trabalhista e tributária conduzida pela Kinsey Capital (balancete de ${X.perBase}).`, `EBITDA ajustado de ${mi(eb)} (reportado ${mi(X.bp.K.ebitda)}), com ${AJ.filter(D.okVal).length} ajuste(s) validados pelos consultores.`, `Dívida líquida ajustada de ${mi(X.dl)}, incluindo parcelamentos e itens equivalentes a dívida.`); }
    }
    const fo = Bs.focus, yL = Object.keys(fo.selic || {}).sort(); if (yL.length) mercado.push(`Selic em ${fmt(Bs.mercado.selic, 2)}%, com expectativa de ${fmt(fo.selic[yL[Math.min(2, yL.length - 1)]], 2)}% em ${yL[Math.min(2, yL.length - 1)]} (Focus de ${new Date(fo.data + "T12:00").toLocaleDateString("pt-BR")}): queda de juros favorece fusões e aquisições.`);
    (t.setor || "").split("\n").map(x => x.trim()).filter(Boolean).forEach(x => mercado.push(x));
    (t.destaques || "").split("\n").map(x => x.trim()).filter(Boolean).forEach(x => destaques.unshift(x));
    const linhas = (p.linhas || []).map(l => ({nome:l.nome, pct:l.pct, desc:pre ? "" : l.desc}));
    const noticias = ((S.mercado?.noticias_seg || {})[seg] || []).filter(n => POS.test(n.titulo)).slice(0, pre ? 3 : 6);
    const materiais = pre ? [] : S.evidences.filter(e => e.supplierId === s.id && /apresenta|release|institucional|teaser|comunicado/i.test(e.tipo + " " + (e.nome || ""))).map(e => `${e.tipo}${e.nome ? ": " + e.nome : ""}`);
    const valor = !pre && t.mostrarValor && R ? `Faixa indicativa (cenário moderado): enterprise value de ${mi(R.rec[0])} a ${mi(R.rec[1])}; equity value de ${mi(R.rec[0] - X.dl)} a ${mi(R.rec[1] - X.dl)}, líquido da dívida de ${mi(X.dl)}.` : "";
    /* estrutura do teaser Kinsey: sumário, companhia, operações, portfólio, destaques financeiros, tese, transação e próximos passos */
    const rg = regiao(s.uf), fat = X && !X.vazio ? (pre ? "~" + mi(arred(X.bp.rl), 0) : mi(X.bp.rl)) : "";
    const sumario = [pre ? `Empresa de ${seg.toLowerCase() || "serviços"}${rg ? " com sede na região " + rg : ""}${dec ? ", " + dec : ""}${fat ? `, com receita líquida de ${fat} em ${X.y0}` : ""}${X && !X.vazio ? ` e margem EBITDA ajustada de ${pc(div(X.bp.eb, X.bp.rl), dc)}` : ""}.` : (p.descricao || `${s.nome}: ${seg}.`),
      s.mandato?.participacao ? `Os acionistas avaliam a venda de ${s.mandato.participacao} do capital.` : "Os acionistas avaliam a entrada de um investidor estratégico ou financeiro.", "A Kinsey Capital é a assessora exclusiva da transação."].join(" ");
    const companhia = [["Fundação", p.fundacao ? (pre ? dec.replace("fundada nos ", "") : String(p.fundacao)) : "—"], ["Sede", pre ? (rg ? "Região " + rg : "—") : [s.municipio, s.uf].filter(Boolean).join("/") || "—"], ["Setor", seg || "—"], ...(pre ? [] : [["Atuação", p.atuacao || "—"]]), ["Colaboradores", p.funcionarios ? (pre ? "~" + (Math.round(+p.funcionarios / 50) * 50 || p.funcionarios) : p.funcionarios) : "—"]];
    const operacoes = [p.atuacao && !pre ? `Atuação: ${p.atuacao}.` : "", p.clientes && !/a levantar/i.test(p.clientes) ? `Clientes: ${p.clientes}.` : "", p.sazonalidade && !/a levantar/i.test(p.sazonalidade) ? `Sazonalidade: ${p.sazonalidade}.` : "", ...(t.operacoes || "").split("\n").map(x => x.trim())].filter(Boolean);
    const tese = []; if (X && !X.vazio){ const cg = X.total, r = div(X.dl, X.bp.eb);
      if (cg?.real > .05) tese.push(`Crescimento acima do mercado: ${pc(cg.real, dc)} ao ano acima da inflação no período analisado.`);
      if (C?.mg && X.mgHist > C.mg.med) tese.push(`Rentabilidade superior aos pares: margem EBITDA de ${pc(div(X.bp.eb, X.bp.rl), dc)} contra ${pc(C.mg.med, dc)} das companhias abertas do setor.`);
      if (r != null && r < 1.5) tese.push(`Balanço leve: dívida líquida de ${xx(r)} o EBITDA, com capacidade para alavancar a expansão.`);
      tese.push(`Plataforma para consolidação em ${seg.toLowerCase() || "seu setor"}: base de clientes, operação e equipe prontas para receber aquisições complementares.`);
      if (C?.eb) tese.push(`Referência de mercado: companhias comparáveis negociam a ${xx(C.eb.med)} o EBITDA.`); }
    (t.tese || "").split("\n").map(x => x.trim()).filter(Boolean).forEach(x => tese.unshift(x));
    const passos = pre ? ["Assinatura do acordo de confidencialidade (NDA)", "Envio da apresentação completa e do information memorandum", "Reunião com os acionistas e a administração", "Proposta não vinculante (NBO)", "Due diligence e proposta vinculante", "Negociação dos documentos definitivos (SPA) e fechamento"] : ["Reunião com os acionistas e a administração", "Acesso ao data room", "Proposta não vinculante (NBO) com faixa de valor e estrutura", "Due diligence confirmatória", "Proposta vinculante, SPA e fechamento"];
    const mat = t.material || null, site = s.ext?.site || t.site || null;
    const pares = (C?.ok || []).filter(c => c.evEb > 0 && c.evEb < 60).sort((a, b) => b.evEb - a.evEb).slice(0, 10).map(c => ({nome:c.nome, evEb:c.evEb, mg:c.mg}));
    const instit = pre ? [] : [...(mat?.resumo || []), ...(site?.resumo || [])].filter(Boolean).slice(0, 8);
    const prodRe = /produt|servi[cç]o|solu[cç][aã]o|portf[oó]lio|linha de|marca|atende|clientes/i;
    const produtos = pre ? [] : [...(p.linhas || []).filter(l => l.desc).map(l => `${l.nome}: ${l.desc}`), ...[...String(mat?.texto || "").split(/\n+/), ...(site?.resumo || [])].map(x => String(x).replace(/\s+/g, " ").trim()).filter(x => x.length >= 30 && x.length <= 220 && prodRe.test(x))].filter((x, i, a) => a.indexOf(x) === i).slice(0, 10);
    return {sumario, companhia, operacoes, tese, passos, pares, instit, produtos, mat, site, codinome, subtitulo, transacao, kpis, serie, destaques:[...new Set(destaques)].slice(0, 8), mercado, linhas, noticias, materiais, dd, valor, descricao:pre ? (t.descricaoPre || "") : (p.descricao || ""), pesquisa:pre ? "" : [t.pesquisa, t.regiao].filter(Boolean).join("\n\n")};
  }

  /* ---------------- gráficos em SVG (tela) ---------------- */
  function barras(serie){
    if (!serie.length) return ""; const W = 520, H = 210, x0 = 20, w = W - 40, max = Math.max(...serie.map(a => a.rl), 1), gw = w / serie.length, bw = Math.min(46, gw / 2.6);
    return `<svg class="dd-svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Receita líquida e EBITDA por ano">${serie.map((a, i) => { const x = x0 + i * gw + gw / 2 - bw - 2, hr = a.rl / max * 150, he = a.eb / max * 150;
      return `<rect x="${x}" y="${170 - hr}" width="${bw}" height="${hr}" rx="3" fill="#4FB0F5"/><rect x="${x + bw + 4}" y="${170 - he}" width="${bw}" height="${he}" rx="3" fill="#F2C14E"/><text x="${x + bw / 2}" y="${164 - hr}" text-anchor="middle">${fmt(a.rl / 1e6, 0)}</text><text x="${x + bw * 1.5 + 4}" y="${164 - he}" text-anchor="middle">${fmt(a.eb / 1e6, 0)}</text><text x="${x + bw + 2}" y="188" text-anchor="middle" class="lb">${a.ano}</text>`; }).join("")}
      <line x1="${x0}" x2="${W - 20}" y1="170" y2="170" stroke="currentColor" stroke-opacity=".25"/><rect x="${x0}" y="198" width="9" height="9" fill="#4FB0F5"/><text x="${x0 + 13}" y="206">Receita líquida (R$ mi)</text><rect x="${x0 + 170}" y="198" width="9" height="9" fill="#F2C14E"/><text x="${x0 + 183}" y="206">EBITDA ajustado (R$ mi)</text></svg>`;
  }
  function rosca(linhas){
    const L = linhas.map(l => ({n:l.nome, v:parseFloat(String(l.pct || "").replace(",", ".")) || 0})).filter(l => l.v > 0); if (!L.length) return "";
    const tot = L.reduce((a, b) => a + b.v, 0), cores = ["#4FB0F5","#F2C14E","#3DDC97","#C39BFF","#FF8A65"]; let a0 = -Math.PI / 2;
    const arcs = L.map((l, i) => { const a1 = a0 + l.v / tot * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, p = (r, a) => [90 + r * Math.cos(a), 90 + r * Math.sin(a)];
      const [x1, y1] = p(80, a0), [x2, y2] = p(80, a1), [x3, y3] = p(48, a1), [x4, y4] = p(48, a0), d = `M${x1},${y1} A80,80 0 ${big} 1 ${x2},${y2} L${x3},${y3} A48,48 0 ${big} 0 ${x4},${y4} Z`; a0 = a1; return `<path d="${d}" fill="${cores[i % 5]}"/>`; });
    return `<svg class="dd-svg" viewBox="0 0 420 180" width="100%" role="img" aria-label="Receita por linha de negócio">${arcs.join("")}${L.map((l, i) => `<rect x="200" y="${30 + i * 26}" width="11" height="11" rx="2" fill="${cores[i % 5]}"/><text x="218" y="${40 + i * 26}" class="lb">${esc(l.n)} · ${fmt(l.v / tot * 100, 0)}%</text>`).join("")}</svg>`;
  }

  /* ---------------- VIEW ---------------- */
  (() => { const nav = $("nav.tabs"), v = nav && $("[data-go=valuation]", nav); if (!v) return;
    v.insertAdjacentHTML("afterend", `<button type="button" data-go="apresentacao"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 12l3-3 2 2 4-4"/></svg>Apresentação</button>`);
    $("#v-valuation").insertAdjacentHTML("afterend", `<section class="view" id="v-apresentacao" data-view="apresentacao" hidden><div class="pad" id="apresentacao"></div></section>`); })();
  S.tzFase = S.tzFase || "pre";
  EXT_VIEWS.apresentacao = function(){
    const host = $("#apresentacao"); if (!host) return;
    const s = D.alvoSel(), sd = D.lado(s, D.pick, ["teaser com dados", "ajustes aguardando OK"]);
    const h = D.cab("Apresentação", "Teaser e apresentação ao investidor", "Antes do NDA: teaser anônimo com nome-código, números arredondados, gráficos e mercado. Depois do NDA: apresentação completa com a empresa identificada, Due Diligence, materiais do vendedor e pesquisa de mercado.");
    if (!s){ host.innerHTML = h; return; }
    const Z = conteudo(s, S.tzFase), t = s.teaser || {}, acs = Object.entries(s.mandato?.acessos || {}).map(([id, a]) => ({v:supById(id), a})).filter(x => x.v);
    const pre = S.tzFase === "pre";
    host.innerHTML = h + `<div class="dd-split" style="margin-top:4px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="dd-tabs">${[["pre","Antes do NDA (teaser)"],["pos","Depois do NDA"],["edit","Conteúdo e pesquisa"]].map(([k, l]) => `<button type="button" class="fbtn" data-tz="${k}" aria-pressed="${S.tzFase === k}">${l}</button>`).join("")}</div>
      ${S.tzFase === "edit" ? editar(s, t) : `
      <div class="card" style="display:flex;flex-direction:column;gap:14px;border-color:${pre ? "rgba(79,176,245,.5)" : "rgba(242,193,78,.5)"}">
        <div style="background:linear-gradient(120deg,#011F4B,#0b3d7e);border-radius:10px;padding:18px 20px;display:flex;flex-direction:column;gap:4px">
          <span style="font-size:11px;letter-spacing:.12em;color:#7FB8E6;font-weight:700">${pre ? "OPORTUNIDADE DE INVESTIMENTO · TEASER" : "APRESENTAÇÃO CONFIDENCIAL · NDA"}</span>
          <span style="font-size:26px;font-weight:800;color:#fff">${esc(pre ? Z.codinome : s.nome)}</span><span style="color:#C9D6EA">${esc(Z.subtitulo)}</span><span style="color:#F2C14E;font-weight:700">${esc(Z.transacao)}</span></div>
        ${Z.kpis.length ? `<div class="dd-kpis">${Z.kpis.map(([l, v, sm]) => `<div class="dd-k"><span>${esc(l)}</span><b>${esc(v)}</b>${sm ? `<small>${esc(sm)}</small>` : ""}</div>`).join("")}</div>` : `<div class="banner">Importe os balancetes na Due Diligence para os números e gráficos.</div>`}
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px"><div>${barras(Z.serie)}</div><div>${rosca(s.perfil?.linhas || [])}</div></div>
        ${Z.descricao ? `<p style="margin:0">${esc(Z.descricao)}</p>` : ""}
        <div><h3>Destaques do negócio</h3><ul style="margin:6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${Z.destaques.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>
        ${Z.linhas.length ? `<div><h3>Linhas de negócio</h3><ul style="margin:6px 0 0;padding-left:18px">${Z.linhas.map(l => `<li><b>${esc(l.nome)}</b>${l.pct ? " · " + esc(l.pct) : ""}${l.desc ? " · " + esc(l.desc) : ""}</li>`).join("")}</ul></div>` : ""}
        <div><h3>Mercado e setor</h3><ul style="margin:6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${Z.mercado.map(m => `<li>${esc(m)}</li>`).join("")}</ul></div>
        ${Z.noticias.length ? `<div><h3>Notícias do segmento</h3><ul style="margin:6px 0 0;padding-left:18px">${Z.noticias.map(n => `<li><a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.titulo)}</a> <span class="sub" style="font-size:11.5px">${esc(n.fonte || "")} ${esc(n.data || "")}</span></li>`).join("")}</ul></div>` : `<p class="sub" style="margin:0">Notícias positivas do segmento chegam pela função de mercado do Firebase publicado.</p>`}
        ${!pre && Z.dd.length ? `<div><h3>Due Diligence</h3><ul style="margin:6px 0 0;padding-left:18px">${Z.dd.map(d => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}
        ${!pre ? `<div><h3>Materiais do vendedor</h3>${Z.materiais.length ? `<ul style="margin:6px 0 0;padding-left:18px">${Z.materiais.map(m => `<li>${esc(m)}</li>`).join("")}</ul>` : `<p class="sub" style="margin:4px 0 0">Nenhum ainda. O sócio vendedor envia apresentação institucional, pre-release e outros pelo Portal, ou a equipe anexa em Evidências.</p>`}</div>` : ""}
        ${!pre && Z.pesquisa ? `<div><h3>Pesquisa da empresa, do setor e da região</h3><p style="margin:6px 0 0;white-space:pre-wrap">${esc(Z.pesquisa)}</p></div>` : ""}
        ${Z.valor ? `<div class="banner"><b>${esc(Z.valor)}</b></div>` : ""}
        <div class="sub" style="margin:0">Kinsey Capital · ${esc(KT_REL?.CONTATO || "")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-tzr="pdf">Baixar PDF</button><button type="button" class="btn" data-tzr="pptx">Baixar PowerPoint</button></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Investidores deste mandato</h3>${acs.length ? `<div class="tbl"><table><thead><tr><th>Investidor</th><th>Acesso</th><th>Recebe</th></tr></thead><tbody>${acs.map(({v, a}) => `<tr><td>${esc(v.nome)}</td><td>${esc(a.status)}</td><td>${["nda","dataroom","ioi","loi"].includes(a.status) ? "apresentação pós-NDA" : a.status === "declinou" ? "—" : "teaser anônimo"}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0">Indique investidores na aba M&A do dossiê do target.</p>`}</div>`}
    </div></div>`;
    sd.bind(host);
    $$("[data-tz]", host).forEach(b => b.onclick = () => { S.tzFase = b.dataset.tz; renderView(); });
    $$("[data-tzr]", host).forEach(b => b.onclick = () => KT_REL.teaser(s, S.tzFase, b.dataset.tzr, "completo").catch(e => { console.error(e); toast("Não foi possível gerar o arquivo."); }));
    const mt = $("#tz-mat", host); if (mt) mt.onchange = () => mt.files[0] && importarMaterial(s, mt.files[0]);
    const st = $("#tz-site", host); if (st) st.onclick = () => lerSite(s, $("#tz-url", host).value);
    const f = $("#ftz", host); if (f) f.onsubmit = e => { e.preventDefault(); const v = id => $("#" + id).value.trim();
      D.up(s, {teaser:{destaques:v("tz-d"), setor:v("tz-s"), pesquisa:v("tz-p"), regiao:v("tz-r"), descricaoPre:v("tz-dp"), mostrarValor:$("#tz-v").checked, em:nowISO(), por:Store.me?.email || ""}}).then(() => toast("Conteúdo da apresentação salvo")); };
  };
  function editar(s, t){
    const ed = D.ed() ? "" : "disabled";
    return `<form class="card" id="ftz" style="display:flex;flex-direction:column;gap:12px" novalidate><h3>Conteúdo e pesquisa</h3><p class="sub" style="margin:0">O sistema monta o teaser com os números da Due Diligence e do valuation; aqui a equipe acrescenta o que só ela sabe. Uma ideia por linha.</p><div class="form">
      <div class="fld full"><label for="tz-dp">Descrição anônima do negócio (antes do NDA)</label><textarea id="tz-dp" rows="2" ${ed} placeholder="ex.: Laticínio regional com marca própria forte em queijos premium">${esc(t.descricaoPre || "")}</textarea></div>
      <div class="fld full"><label for="tz-d">Destaques adicionais</label><textarea id="tz-d" rows="4" ${ed}>${esc(t.destaques || "")}</textarea></div>
      <div class="fld full"><label for="tz-s">Mercado e setor (pesquisa)</label><textarea id="tz-s" rows="4" ${ed} placeholder="ex.: Consumo de queijos cresce 5% ao ano no Brasil (Abiq)">${esc(t.setor || "")}</textarea></div>
      <div class="fld full"><label for="tz-p">Pesquisa sobre a empresa (depois do NDA): site, imprensa, prêmios, clientes</label><textarea id="tz-p" rows="4" ${ed}>${esc(t.pesquisa || "")}</textarea></div>
      <div class="fld full"><label for="tz-r">Região onde a empresa opera (depois do NDA)</label><textarea id="tz-r" rows="3" ${ed}>${esc(t.regiao || "")}</textarea></div>
      <label class="check"><input type="checkbox" id="tz-v" ${t.mostrarValor ? "checked" : ""} ${ed}> Mostrar a faixa indicativa de valor (moderada) na apresentação pós-NDA</label></div>
      ${D.ed() ? `<button type="submit" class="btn primary" style="align-self:flex-start">Salvar conteúdo</button>` : ""}</form>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Material institucional e site da empresa</h3><p class="sub" style="margin:0">Importe o release, a apresentação institucional ou o folder (PDF, PPTX ou DOCX): o sistema extrai a descrição, os números e os destaques para a apresentação pós-NDA. O site da empresa é lido na versão publicada (título, descrição, quem somos, produtos e clientes).</p>
        ${t.material ? `<div class="banner" style="display:flex;flex-direction:column;gap:4px"><b>${esc(t.material.arquivo)}</b> · importado em ${dt(t.material.em)}${(t.material.resumo || []).slice(0, 4).map(x => `<span style="font-size:13px">• ${esc(x)}</span>`).join("")}</div>` : ""}
        ${s.ext?.site || t.site ? `<div class="banner" style="display:flex;flex-direction:column;gap:4px"><b>Site: ${esc((s.ext?.site || t.site).url || "")}</b>${((s.ext?.site || t.site).resumo || []).slice(0, 4).map(x => `<span style="font-size:13px">• ${esc(x)}</span>`).join("")}</div>` : ""}
        ${D.ed() ? `<div class="form"><div class="fld full"><label for="tz-url">Site da empresa</label><input id="tz-url" placeholder="https://www.empresa.com.br" value="${esc((s.ext?.site || t.site)?.url || s.mapa?.site || "")}"></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn sm primary">Importar release ou apresentação<input type="file" id="tz-mat" accept=".pdf,.pptx,.docx,.txt" hidden></label><button type="button" class="btn sm" id="tz-site">Ler o site</button></div>` : ""}</div>`;
  }
  /* extrai do material institucional: descrição, números e destaques */
  function resumir(txt){ const L = String(txt || "").replace(/\r/g, "").split(/\n+|(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚ])/).map(x => x.replace(/\s+/g, " ").trim()).filter(x => x.length >= 40 && x.length <= 260 && !/https?:|@|cnpj|telefone|whatsapp|copyright|todos os direitos/i.test(x));
    const num = L.filter(x => /\d/.test(x) && /(clientes?|unidades|lojas|colaboradores|funcion|anos|estados|cidades|toneladas|m²|milh|bilh|%|faturamento|receita|crescimento|frota|filiais|pa[ií]ses)/i.test(x));
    return [...new Set([...L.slice(0, 2), ...num])].slice(0, 10); }
  async function importarMaterial(s, f){ try{ const tx = await KT_AUTO.texto(f), r = resumir(tx); if (!r.length){ toast("Não encontrei texto aproveitável no arquivo."); return; }
      await D.up(s, {teaser:{material:{arquivo:f.name, em:nowISO(), resumo:r, texto:String(tx).slice(0, 30000)}}}); toast(`Material importado: ${r.length} trecho(s) para a apresentação`); }
    catch(e){ console.error(e); toast("Não foi possível ler o arquivo."); } }
  async function lerSite(s, url){ url = String(url || "").trim(); if (!url){ toast("Informe o endereço do site."); return; } if (!/^https?:\/\//.test(url)) url = "https://" + url;
    if (!(window.firebase?.functions && Store.db)){ await D.up(s, {teaser:{site:{url, em:nowISO(), resumo:[]}}}); toast("Site guardado. A leitura automática roda na versão publicada; aqui, cole os trechos em “Pesquisa sobre a empresa”."); return; }
    try{ toast("Lendo o site…"); await firebase.app().functions("southamerica-east1").httpsCallable("lerSite", {timeout:60000})({id:s.id, url}); toast("Site lido: veja o resumo abaixo"); }catch(e){ toast("Não consegui ler o site: " + (e.message || "erro")); } }
  window.KT_TEASER = {conteudo, resumir, importarMaterial, lerSite};
})();
