/* ================= KINSEY CAPITAL · PRÉ-DILIGÊNCIA E DILIGÊNCIA COMPLETA =================
   Pré-diligência: tudo o que vem do cadastro inicial, sem esperar o auditor:
   - balanços e DRE importados no cadastro (com a opção de trocar), balancetes do ano importados de uma vez
     (o consultor informa o ano e seleciona todos os arquivos) e a revisão analítica;
   - consultas públicas (Receita Federal, listas oficiais, notícias da empresa e dos sócios);
   - certidões e documentos do cadastro: CND federal, CNDT, CRF do FGTS, certidões estaduais e municipais; o que vier
     positivo, vencido ou com ressalva vai para a diligência como ponto fiscal, tributário, trabalhista ou previdenciário;
   - procedimentos automáticos sobre os balancetes e diligência jurídica.
   Diligência completa: quando o auditor ou consultor importa o workbook analisado.
   Relatórios: pré-diligência e diligência completa, em PDF e em PowerPoint. */
if (window.KT_DD && window.KT_REL) (() => {
  const D = KT_DD, R = KT_REL;
  const mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e6, Math.abs(v) >= 1e8 ? 0 : 1)} mi`;
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const AREA_DOC = {cnd_federal:"Tributária", cnd_estadual:"Tributária", cnd_municipal:"Tributária", cndt:"Trabalhista", crf:"Previdenciária (FGTS)", certidao:"Tributária", cnd_ibama:"Ambiental", ctf_ibama:"Ambiental", contrato_social:"Societária", cartao_cnpj:"Cadastral", licenca:"Regulatória", alvara:"Regulatória", avcb:"Regulatória"};
  const ROT = {alto:"Alto", medio:"Médio", baixo:"Atenção"};

  /* ---------- pontos da pré-diligência ---------- */
  function pontos(s){
    const P = [], vistos = new Set(), add = (area, sev, t, txt, fonte) => { if (/^jur[ií]dic/i.test(area)) area = "Jurídico"; txt = String(txt || "").replace(/\s+/g, " "); const fr = [...new Set(txt.split(/(?<=\.)\s+/))].join(" "); txt = fr.length > 220 ? fr.slice(0, 217) + "…" : fr; const k = area + t + txt; if (vistos.has(k)) return; vistos.add(k); P.push({area, sev, t, txt, fonte}); };
    const rf = s.receita && !s.receita.erro ? s.receita : null;
    if (rf){ if (rf.situacao && rf.situacao !== "ATIVA") add("Cadastral", "alto", "Situação na Receita Federal", `${rf.situacao}${rf.motivo ? " · " + rf.motivo : ""}`, "Receita Federal");
      if (rf.especial) add("Cadastral", "alto", "Situação especial", rf.especial, "Receita Federal");
      const ano = +String(rf.abertura || "").slice(0, 4); if (ano && new Date().getFullYear() - ano < 3) add("Cadastral", "medio", "Empresa recente", `aberta em ${dBR(rf.abertura)}`, "Receita Federal"); }
    else add("Cadastral", "medio", "Consulta à Receita Federal pendente", "informe o CNPJ no cadastro", "Cadastro");
    (s.listas?.achados || []).forEach(a => add("Consultas públicas", "alto", a.rotulo, a.nome || "", "Listas oficiais (CGU, MTE, IBAMA)"));
    const NEG = /fraude|corrup|investiga|fal[eê]ncia|recupera[cç][aã]o judicial|lavagem|pris[aã]o|preso|condena|den[uú]ncia|opera[cç][aã]o|esc[aâ]ndalo|processo/i;
    (s.ext?.noticias || []).filter(n => NEG.test(n.titulo || "")).slice(0, 4).forEach(n => add("Consultas públicas", "medio", "Notícia sobre a empresa", `${n.titulo} (${n.fonte || ""} ${n.data || ""})`, "Notícias"));
    (s.ext?.socios || []).forEach(x => (x.noticias || []).filter(n => NEG.test(n.titulo || "")).slice(0, 2).forEach(n => add("Consultas públicas", "medio", `Notícia sobre o sócio ${x.nome}`, n.titulo, "Notícias")));
    /* certidões e documentos */
    const evs = S.evidences.filter(e => e.supplierId === s.id && e.analise?.extraido);
    const tiposVistos = new Set();
    evs.forEach(e => { const x = e.analise.extraido, area = AREA_DOC[x.tipo]; if (x.tipo) tiposVistos.add(x.tipo);
      if (x.tipo === "certidao"){ const tx = `${x.rotulo || ""} ${e.nome || ""} ${String(x.nomesTexto || "").slice(0, 3000)}`; if (/tributos federais|pgfn|receita federal|d[íi]vida ativa da uni/i.test(tx)) tiposVistos.add("cnd_federal"); if (/trabalhist/i.test(tx)) tiposVistos.add("cndt"); if (/fgts/i.test(tx)) tiposVistos.add("crf"); }
      if (!area) return;
      let A = []; try{ A = typeof DOCAN !== "undefined" ? DOCAN.achados(e, s) : []; }catch(err){}
      A.filter(a => ["alto", "medio"].includes(a.sev)).forEach(a => add(area, a.sev, x.rotulo || e.tipo || "Documento", a.txt, e.nome || "documento do cadastro"));
      if (/^cnd|cndt|crf|certidao/.test(x.tipo) && !A.length) add(area, "ok", x.rotulo || e.tipo, x.positiva ? (x.positivaEfNeg ? "positiva com efeitos de negativa" : "positiva") : `negativa${x.validade ? `, válida até ${dBR(x.validade)}` : ""}`, e.nome || "documento do cadastro"); });
    ["cnd_federal", "cndt", "crf"].filter(t => !tiposVistos.has(t)).forEach(t => add(AREA_DOC[t], "pend", {cnd_federal:"Certidão federal (Receita e PGFN)", cndt:"CNDT (débitos trabalhistas)", crf:"CRF do FGTS"}[t], "não apresentada no cadastro: pedir ao target ou emitir no site do órgão", "Checklist"));
    /* balancetes, revisão analítica e procedimentos */
    if (window.KT_FINX) KT_FINX.pontos(s).forEach(x => add(x.area === "Ajuste de EBITDA" ? "Financeira" : x.area, x.area === "Jurídico" ? "alto" : "medio", x.t, x.txt, "Balancetes"));
    if (window.KT_RA){ try{ KT_RA.alertas(s).A.slice(0, 12).forEach(a => add("Revisão analítica", a.nivel, `${a.desc} · ${a.periodo}`, a.motivo, "Balancetes")); }catch(e){} }
    /* mercado e concorrência: setores expostos a importados (principalmente da China), antidumping, câmbio e commodities */
    const cn = [rf?.cnae, ...((rf?.cnaesSec) || [])].map(c => String(c || "").replace(/\D/g, "").padStart(7, "0")).filter(c => +c), div2 = c => +c.slice(0, 2);
    const EXP = [[13, "têxteis"], [14, "vestuário e acessórios"], [15, "couro e calçados"], [20, "químicos"], [22, "borracha e plástico"], [23, "cerâmica, vidro e minerais não metálicos"], [24, "aço e metalurgia"], [25, "produtos de metal"], [26, "eletrônicos e informática"], [27, "máquinas e materiais elétricos"], [28, "máquinas e equipamentos"], [29, "autopeças e veículos"], [31, "móveis"], [32, "brinquedos e produtos diversos"]];
    const exp = EXP.filter(([d]) => cn.some(c => div2(c) === d)); const atac = cn.some(c => /^46/.test(c));
    if (exp.length) add("Mercado e concorrência", "medio", "Concorrência de importados (China e Ásia)", `A atividade (${exp.map(e => e[1]).join(", ")}) concorre com produtos importados, principalmente chineses: avaliar a participação de importados no mercado, as tarifas e medidas antidumping em vigor, a pressão sobre preço e margem e a dependência de poucos clientes.`, "CNAE da Receita");
    else if (atac) add("Mercado e concorrência", "baixo", "Comércio atacadista", "Atacadistas costumam depender de produtos importados ou de poucos fornecedores: avaliar câmbio, prazos de importação e concentração de fornecedores.", "CNAE da Receita");
    if (cn.some(c => [1, 2, 3, 10, 11].includes(div2(c)) || /^(19|24)/.test(c))) add("Mercado e concorrência", "baixo", "Preço de commodities", "Receita ou custo ligados a commodities (agro, alimentos, combustíveis ou metais): avaliar o histórico de preços e o efeito na margem do período usado no valuation.", "CNAE da Receita");
    const txtM = [s.teaser?.material?.texto, s.teaser?.setor, s.teaser?.pesquisa, ...(s.ext?.site?.resumo || []), ...((s.ext?.noticias || []).map(n => n.titulo)), ...(((S.mercado?.noticias_seg || {})[s.perfil?.segmento || s.segmento] || []).map(n => n.titulo))].join(" \n ");
    if (/antidumping|anti-dumping|direito compensat/i.test(txtM)) add("Mercado e concorrência", "medio", "Medida antidumping no setor", "Há notícia ou material citando antidumping: verificar se a medida protege ou prejudica a empresa (insumo importado ou produto concorrente) e o prazo de vigência.", "Notícias e materiais");
    else if (/(chin[eê]s|chinesa|china|asi[aá]tic)[^.\n]{0,80}(import|concorr|pre[cç]o|invas|dumping)|(import|concorr)[^.\n]{0,80}(chin[eê]s|chinesa|china)/i.test(txtM)) add("Mercado e concorrência", "medio", "Notícias de concorrência chinesa", "Notícias ou materiais do setor citam concorrência de produtos chineses: avaliar a exposição dos produtos da empresa.", "Notícias e materiais");
    if (/import(a|ad|ação|ados)|insumo importado|d[oó]lar/i.test(String(s.teaser?.material?.texto || "") + " " + String(rf?.cnaeDesc || ""))) add("Mercado e concorrência", "baixo", "Exposição ao câmbio", "Material ou atividade indicam compras ou vendas em moeda estrangeira: avaliar o efeito do dólar na margem e se há proteção (hedge).", "Materiais da empresa");
    const ord = {alto:0, medio:1, pend:2, baixo:3, ok:4}; P.sort((a, b) => (ord[a.sev] ?? 5) - (ord[b.sev] ?? 5));
    return P;
  }
  const completa = s => !!s.dd?.wb;
  const ultPer = s => (D.periodos(s) || [])[0] || "";
  const anuais = s => (D.periodos(s) || []).filter(p => +s.dd.bal[p].meses === 12).map(p => p.slice(0, 4)).sort();

  /* ---------- importação dos balancetes do ano ---------- */
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const mesDoNome = n => { n = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); const i = MESES.findIndex(m => new RegExp(`(^|[^a-z])${m}`).test(n)); if (i >= 0) return i + 1;
    const m = n.match(/(?:^|[^\d])(0?[1-9]|1[0-2])[._\-\s]?(?:20\d\d)|(?:20\d\d)[._\-\s]?(0?[1-9]|1[0-2])(?:[^\d]|$)/); return m ? +(m[1] || m[2]) : 0; };
  function importarAno(s){
    const ano0 = String(new Date().getFullYear() - 1);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Due Diligence · ${esc(s.nome)}</div><h2>Balancetes do ano</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px"><p class="sub" style="margin:0">Informe o ano e selecione todos os balancetes de uma vez (Excel, CSV ou PDF). O sistema identifica o mês de cada arquivo pelo conteúdo ou pelo nome, monta os períodos e faz a revisão analítica.</p>
        <div class="form"><div class="fld"><label for="ba-ano">Ano</label><input id="ba-ano" inputmode="numeric" value="${ano0}"></div><div class="fld full"><label for="ba-f">Balancetes</label><input id="ba-f" type="file" multiple accept=".xlsx,.xlsm,.csv,.pdf,.txt"></div></div>
        <div id="ba-prev"></div><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-x>Cancelar</button><button type="button" class="btn primary" id="ba-go" disabled>Importar</button></div></div>`);
    let L = [];
    $("#ba-f").onchange = async e => { const fs = [...e.target.files], ano = $("#ba-ano").value.trim(); L = []; $("#ba-prev").innerHTML = `<div class="result">Lendo ${fs.length} arquivo(s)…</div>`;
      for (const f of fs){ let contas = null, mes = 0;
        try{ if (/\.(xlsx|xlsm|csv|txt)$/i.test(f.name)) contas = await D.lerArquivo(f); else { const r = await KT_DOCS.ler(f); contas = r.contas || null; if (r.periodo?.fim?.startsWith(ano)) mes = +r.periodo.fim.slice(5, 7); } }catch(err){}
        L.push({f, contas, mes:mes || mesDoNome(f.name)}); }
      const sem = L.filter(x => !x.mes); if (sem.length){ const usados = new Set(L.map(x => x.mes).filter(Boolean)); let m = 1; sem.sort((a, b) => a.f.name.localeCompare(b.f.name, "pt", {numeric:true})).forEach(x => { while (usados.has(m)) m++; x.mes = m; x.ordem = true; usados.add(m); }); }
      L.sort((a, b) => a.mes - b.mes);
      /* acumulado ou só o mês: a receita cresce mês a mês no acumulado */
      const rec = L.filter(x => x.contas).map(x => { try{ return D.calc({contas:x.contas, meses:12}).recBruta / 12; }catch(err){ return 0; } });
      const cumul = rec.length > 2 ? rec.filter((v, i) => i && v > rec[i - 1] * 1.02).length >= (rec.length - 1) * .7 : true; L.cumul = cumul;
      $("#ba-prev").innerHTML = `<div class="tbl"><table><thead><tr><th>Arquivo</th><th>Mês</th><th>Contas</th></tr></thead><tbody>${L.map((x, i) => `<tr><td style="font-size:12.5px;word-break:break-all">${esc(x.f.name)}</td><td><select data-bam="${i}">${MESES.map((m, k) => `<option value="${k + 1}" ${k + 1 === x.mes ? "selected" : ""}>${m}</option>`).join("")}</select>${x.ordem ? `<div class="sub" style="margin:0;font-size:11px">pela ordem dos arquivos</div>` : ""}</td><td>${x.contas ? x.contas.length : `<span style="color:var(--bad)">não lido</span>`}</td></tr>`).join("")}</tbody></table></div>
        <label class="check" style="margin-top:6px"><input type="checkbox" id="ba-cum" ${cumul ? "checked" : ""}> Balancetes acumulados no ano (saldo de janeiro até o mês)</label>`;
      $$("[data-bam]").forEach(x => x.onchange = () => { L[+x.dataset.bam].mes = +x.value; }); $("#ba-go").disabled = !L.some(x => x.contas); };
    $("#ba-go").onclick = async () => { const ano = $("#ba-ano").value.trim(); if (!/^20\d\d$/.test(ano)){ toast("Informe o ano com 4 dígitos"); return; } const cum = $("#ba-cum")?.checked !== false, bal = {}, por = Store.me?.email || "";
      L.filter(x => x.contas).forEach(x => { const mm = String(x.mes).padStart(2, "0"), dia = new Date(+ano, x.mes, 0).getDate(); bal[`${ano}-${mm}`] = {dataBase:`${ano}-${mm}-${String(dia).padStart(2, "0")}`, meses:cum ? x.mes : 1, contas:x.contas, importadoEm:nowISO(), por, origem:"dd", arquivo:x.f.name}; });
      await D.up(s, {dd:{bal}}); close(); toast(`${Object.keys(bal).length} balancete(s) de ${ano} importado(s): revisão analítica pronta`); S.ddTab = "ra"; S.ddPer = ""; renderView(); };
  }

  /* ---------- quadro no topo da Due Diligence ---------- */
  function quadro(s){
    const an = anuais(s), per = D.periodos(s) || [], dem = per.filter(p => s.dd.bal[p].origem === "demonstracoes"), mens = per.filter(p => +s.dd.bal[p].meses !== 12 || s.dd.bal[p].origem === "dd" && !/-12$/.test(p));
    const doCad = per.filter(p => ["demonstracoes"].includes(s.dd.bal[p].origem) || s.dd.reproc), P = pontos(s), nA = P.filter(p => p.sev === "alto").length, nM = P.filter(p => p.sev === "medio").length, cp = completa(s);
    return `<div class="card" id="pdd-q" style="display:flex;flex-direction:column;gap:10px">
      <div class="head" style="margin:0"><div><div class="eyebrow">${cp ? "Diligência completa · workbook importado" : "Pré-diligência · dados do cadastro inicial"}</div><h3 style="margin:0">Balanços, balancetes e relatórios</h3></div></div>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
        <div>${per.length ? `<b style="color:var(--ok)">✓</b> Balanços já importados${doCad.length ? " no cadastro" : ""}: <b>${an.length ? an.join(", ") : per.slice(0, 3).join(", ")}</b>${dem.length ? ` <span class="sub">(balanço e DRE)</span>` : ""}` : `<b style="color:var(--warn)">…</b> Nenhum balanço importado ainda`}</div>
        <div>${mens.length ? `<b style="color:var(--ok)">✓</b> Balancetes do ano: ${mens.length} período(s)` : `<b style="color:var(--warn)">…</b> Balancetes mensais do ano: ainda não importados`}${an.length < 3 ? ` · <span style="color:var(--warn)">${an.length} exercício(s): o mínimo são 3 (ideal 5)</span>` : ""}</div>
        <div>${cp ? `<b style="color:var(--ok)">✓</b> Workbook do auditor importado (${esc(s.dd.wb.arquivo || "")}, ${dBR(s.dd.wb.em)})` : `<b style="color:var(--warn)">…</b> Diligência completa: aguardando o workbook analisado do auditor ou consultor`}</div></div>
      ${Store.me?.canWrite !== false ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-pdd="bal">${per.length ? "Alterar o balanço importado" : "Importar balanços"}</button><button type="button" class="btn sm" data-pdd="ano">Importar balancetes do ano</button><button type="button" class="btn sm" data-pdd="wb">Workbook preenchido (Excel)</button><button type="button" class="btn sm ghost" data-pdd="wbi">Importar workbook analisado</button></div>` : ""}
      <div class="eyebrow" style="margin-top:4px">Relatórios</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-pdd="pre-pdf">Relatório prévio · pré-diligência (PDF)</button><button type="button" class="btn sm" data-pdd="pre-ppt">Pré-diligência (PowerPoint)</button>
        <button type="button" class="btn sm ${cp ? "primary" : ""}" data-pdd="cp-pdf" ${cp ? "" : "disabled"}>Diligência completa (PDF)</button><button type="button" class="btn sm" data-pdd="cp-ppt" ${cp ? "" : "disabled"}>Diligência completa (PowerPoint)</button></div>
      ${cp ? "" : `<p class="sub" style="margin:0;font-size:12px">A diligência completa é emitida depois que o auditor ou consultor importa o workbook analisado.</p>`}
      <div class="eyebrow" style="margin-top:4px">Pré-diligência · ${P.length} ponto(s)</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${[["alto", nA, "r-alto", "alto(s)"], ["medio", nM, "r-medio", "médio(s)"], ["pend", P.filter(p => p.sev === "pend").length, "r-pend", "pendente(s)"], ["ok", P.filter(p => p.sev === "ok").length, "r-baixo", "OK"]].filter(x => x[1]).map(([, n, c, l]) => `<span class="pill ${c}" style="font-size:11px">${n} ${l}</span>`).join("")}</div>
      ${P.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px" class="sub">${[...new Set(P.map(p => p.area))].map(a => { const L = P.filter(p => p.area === a), al = L.filter(p => p.sev === "alto").length; return `<span>${esc(a)}: <b style="color:${al ? "var(--bad)" : "var(--fog)"}">${L.length}</b></span>`; }).join("")}</div>` : ""}
      ${P.length ? `<details id="pdd-det"><summary style="cursor:pointer;font-size:13.5px;font-weight:600">Ver pontos de diligência</summary><div class="tbl" style="max-height:420px;overflow:auto;margin-top:6px"><table><tbody>${P.slice(0, 60).map(p => `<tr style="background:${p.sev === "alto" ? "rgba(255,107,107,.12)" : p.sev === "medio" ? "rgba(242,193,78,.10)" : "transparent"}"><td style="white-space:nowrap;font-size:12px">${esc(p.area)}</td><td style="font-size:12.5px"><b>${esc(p.t)}</b> <span class="sub">${esc(p.txt)}</span></td><td style="white-space:nowrap"><span class="pill ${p.sev === "alto" ? "r-alto" : p.sev === "medio" ? "r-medio" : p.sev === "ok" ? "r-baixo" : "r-pend"}" style="font-size:10.5px">${p.sev === "ok" ? "OK" : p.sev === "pend" ? "Pendente" : ROT[p.sev]}</span></td></tr>`).join("")}</tbody></table></div></details>` : ""}</div>`;
  }
  function bind(s, el){
    $$("[data-pdd]", el).forEach(b => b.onclick = async () => { const k = b.dataset.pdd;
      if (k === "bal"){ if (window.KT_DOCS) KT_DOCS.importar(s.id); return; } if (k === "ano") return importarAno(s);
      if (k === "wb") return window.KT_DDWB?.modeloDD(s); if (k === "wbi"){ const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".xlsx,.xlsm"; inp.onchange = () => inp.files[0] && window.KT_DDWB?.importarDD(s, inp.files[0]); inp.click(); return; }
      const t0 = b.textContent; b.disabled = true; b.textContent = "Gerando…";
      try{ if (k === "pre-pdf") await prePdf(s); else if (k === "pre-ppt") await ppt(s, false); else if (k === "cp-pdf") await (window.KT_EXP ? KT_EXP.ddPdf(s, ultPer(s), "completo") : R.ddPdf(s, ultPer(s))); else if (k === "cp-ppt") await ppt(s, true); }
      catch(e){ console.error(e); toast("Não foi possível gerar: " + (e.message || "erro")); } b.disabled = false; b.textContent = t0; });
  }
  if (typeof renderAuditoria === "function"){ const _r = renderAuditoria;
    renderAuditoria = function(){ const r = _r.apply(this, arguments); const host = $("#auditoria"), s = D.alvoSel(); if (!host || !s || $("#pdd-q", host) || S.ddTab === "base") return r;
      if (!["geral", "ra"].includes(S.ddTab)) return r;
      const tabs = host.querySelector(".dd-tabs"); if (!tabs) return r; const w = document.createElement("div"); w.innerHTML = quadro(s); const el = w.firstElementChild; tabs.after(el); bind(s, el); return r; }; }

  /* ---------- PDF da pré-diligência ---------- */
  async function prePdf(s){
    const P = KTPdf(), per = ultPer(s), P0 = pontos(s), nome = s.nome, an = anuais(s);
    R.capa(P, "Relatório de pré-diligência", nome, [["CNPJ", s.doc || "—"], ["Segmento", s.perfil?.segmento || s.segmento || "—"], ["Balanços", an.join(", ") || (per || "—")], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    let n = 0; const sec = t => R.sec(P, ++n, t);
    sec("Sumário");
    if (per){ const K = D.calc(s.dd.bal[per]); R.kpisPdf(P, [["Receita líquida", mi(K.recLiq), per], ["EBITDA", mi(K.ebitda), K.recLiq ? `margem ${fmt(K.ebitda / K.recLiq * 100, 1)}%` : ""], ["Dívida líquida", mi(K.dl), ""], ["Pontos de atenção", String(P0.filter(p => p.sev === "alto").length), "de alto risco"]]); }
    R.par(P, `Pré-diligência montada pelo KinseyTec com as informações do cadastro inicial: consultas públicas, certidões e documentos apresentados, balanços e balancetes importados (${(D.periodos(s) || []).length} período(s)) e a revisão analítica das contas de resultado. Não substitui a diligência completa, que vem do workbook analisado pelo auditor ou consultor.`, {size:9.5});
    const grupo = (t, f) => { const L = P0.filter(f); if (!L.length) return; sec(t); R.tab(P, ["Área", "Ponto", "Detalhe", "Nível"], L.map(p => [p.area, p.t, p.txt, p.sev === "ok" ? "OK" : p.sev === "pend" ? "Pendente" : ROT[p.sev] || p.sev]), [.16, .3, .42, .12]); };
    grupo("Cadastro e consultas públicas", p => ["Cadastral", "Consultas públicas", "Societária"].includes(p.area));
    grupo("Situação fiscal, tributária, trabalhista e previdenciária", p => /Tribut|Trabalh|Previd|Ambiental|Regulat/.test(p.area));
    grupo("Contábil e financeira", p => /Cont|Financ|Revis|Exposi/.test(p.area));
    grupo("Jurídico", p => p.area === "Jurídico");
    grupo("Mercado e concorrência", p => p.area === "Mercado e concorrência");
    if (window.KT_RA && per){ const {X, potencial} = KT_RA.alertas(s); if (X.contas.length){ sec("Revisão analítica"); R.par(P, `Exercícios: ${X.anos.join(", ") || "—"}${X.anos.length < 3 ? " (abaixo do mínimo de 3)" : ""}. Períodos de ${X.anoM || "—"}: ${X.fat.map(f => f.rot).join(", ") || "—"}. Potencial de ajuste de EBITDA pelos picos: ${mi(potencial)}.`, {size:9.5}); } }
    sec("Próximos passos"); ["Enviar ao auditor ou consultor o workbook da Due Diligence já preenchido com os balancetes e a revisão analítica.", "Pedir os documentos dos alertas (razão analítico, notas fiscais, contratos) e as certidões pendentes.", "Importar o workbook analisado para emitir a diligência completa."].forEach(t => R.par(P, "• " + t, {size:9.5}));
    await rptSave(P.out(`Pré-diligência · ${nome}`, R.T(`Kinsey Capital · Pré-diligência · ${nome} · confidencial`)), R.arq(s, "pre_diligencia", "pdf"), "application/pdf");
  }
  /* ---------- PowerPoint (pré-diligência ou completa) ---------- */
  async function ppt(s, cp){
    const T = R.T, titulo = cp ? "Diligência completa" : "Pré-diligência", slides = [], nome = s.nome, per = ultPer(s);
    const frame = t => [{x:0, y:0, w:13.333, h:.12, f:"0473C3"}, {x:.6, y:.35, w:12, h:.7, p:[{t:T(t), s:26, b:true, c:"011F4B"}]}, {x:.6, y:7.0, w:10, h:.35, p:[{t:T(`Kinsey Capital · ${titulo} · ${nome} · Confidencial`), s:9, c:"5A6578"}]}];
    const lista = (sh, L, y = 1.4) => sh.push({x:.6, y, w:12.1, h:5.4, p:L.slice(0, 9).map(t => ({t:"• " + T(t), s:14, c:"1B2433", sb:300}))});
    slides.push({bg:"011F4B", sh:[{x:.8, y:1.2, w:11, h:.5, p:[{t:titulo.toUpperCase(), s:16, b:true, c:"7FB8E6"}]}, {x:.8, y:1.9, w:11.5, h:1.4, p:[{t:T(nome), s:40, b:true, c:"FFFFFF"}]}, {x:.8, y:3.6, w:11, h:.5, p:[{t:T(new Date().toLocaleDateString("pt-BR", {month:"long", year:"numeric"})), s:16, c:"C9D6EA"}]}]});
    if (per){ const K = D.calc(s.dd.bal[per]), AJ = D.ajustes(s, per), A = D.soma(AJ.filter(D.okFin)), I = D.indic(K, A); let sh = frame("Números principais");
      [["Receita líquida", mi(K.recLiq)], ["EBITDA ajustado", mi(I.ebitda)], ["Margem EBITDA", I.mEbitda != null ? fmt(I.mEbitda * 100, 1) + "%" : "—"], ["Dívida líquida", mi(I.dl)]].forEach(([l, v], i) => sh.push({x:.6 + i * 3.08, y:1.5, w:2.9, h:1.4, f:"EEF5FC", round:true, pad:.15, p:[{t:l.toUpperCase(), s:10, b:true, c:"5A6578"}, {t:v, s:22, b:true, c:"011F4B", sb:300}]}));
      lista(sh, AJ.slice(0, 6).map(a => `${a.titulo}: ${D.efeitoTxt(a)}${D.okFin(a) ? "" : " (aguardando OK)"}`), 3.2); slides.push({sh}); }
    const P0 = pontos(s), por = (t, f) => { const L = P0.filter(f).filter(p => p.sev !== "ok"); if (!L.length) return; const sh = frame(t); lista(sh, L.map(p => `[${p.sev === "pend" ? "Pendente" : ROT[p.sev] || ""}] ${p.t}: ${p.txt}`)); slides.push({sh}); };
    por("Cadastro e consultas públicas", p => ["Cadastral", "Consultas públicas", "Societária"].includes(p.area));
    por("Situação fiscal, tributária, trabalhista e previdenciária", p => /Tribut|Trabalh|Previd|Ambiental|Regulat/.test(p.area));
    por("Contábil, financeira e revisão analítica", p => /Cont|Financ|Revis|Exposi/.test(p.area));
    por("Jurídico", p => p.area === "Jurídico");
    por("Mercado e concorrência", p => p.area === "Mercado e concorrência");
    if (cp){ const W = s.dd.wb || {}; const pts = (W.pontos || []).map(p => `${p.ponto || p.titulo || p[0] || ""}${p.recomendacao ? " · " + p.recomendacao : ""}`).filter(Boolean); if (pts.length){ const sh = frame("Pontos e recomendações do auditor"); lista(sh, pts); slides.push({sh}); }
      if (window.KT_EXP){ const ex = KT_EXP.lista(s); if (ex.length){ const ate = +String(per || "").slice(0, 4) || new Date().getFullYear(), sh = frame("Exposições"); lista(sh, ex.map(e => { const c = KT_EXP.calc(e, ate); return `${e.titulo}: ${mi(c.min)} a ${mi(c.max)} (${e.aval || "a avaliar"})`; })); slides.push({sh}); } } }
    const sh = frame("Próximos passos"); lista(sh, cp ? ["Levar os ajustes validados ao valuation e à negociação (preço, retenção, capital de giro).", "Tratar as exposições no SPA (indenização, escrow ou retenção).", "Concluir a diligência jurídica e as certidões pendentes."] : ["Enviar o workbook preenchido ao auditor ou consultor.", "Pedir os documentos dos alertas e as certidões pendentes.", "Importar o workbook analisado para a diligência completa."]); slides.push({sh});
    await rptSave(ktPptx(slides, `${titulo} · ${nome}`), R.arq(s, cp ? "diligencia_completa" : "pre_diligencia", "pptx"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  }
  window.KT_PREDD = {pontos, prePdf, ppt, importarAno, quadro};
})();
