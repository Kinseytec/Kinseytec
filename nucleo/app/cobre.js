/* ================= CADEIA DO COBRE · mapeamento e conformidade =================
   Ativado só quando o segmento define COBRE_CFG no data.js (KinseyTec – Cobre e Metal).
   Abas novas no dossiê: Mapeamento (questionário de mapeamento da cadeia) e Conformidade
   (requisitos de origem lícita e rastreabilidade), com regras automáticas que alimentam a
   matriz de risco, a aba Auditoria e o relatório de pontos. */
if (typeof COBRE_CFG !== "undefined") (() => {
  const C = COBRE_CFG, DIA = 864e5, hoje = () => Date.now(); let dentro = false;
  /* endereço automático: Receita Federal (consulta do CNPJ) ou cartão CNPJ anexado */
  const endAuto = s => { const r = s.receita?.endereco; if (r) return {v: r, f: "pela Receita Federal (cartão CNPJ)"};
    const e = S.evidences.filter(x => x.supplierId === s.id && x.analise?.extraido?.tipo === "cartao_cnpj" && x.analise.extraido.endereco).sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")))[0];
    return e ? {v: e.analise.extraido.endereco, f: "pelo cartão CNPJ anexado"} : {v: "", f: ""}; };
  /* atividade declarada: objeto social do contrato social anexado + CNAE da Receita / cartão CNPJ */
  const atividade = s => { const cs = S.evidences.filter(x => x.supplierId === s.id && x.analise?.extraido?.tipo === "contrato_social" && x.analise.extraido.objeto).sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")))[0];
    const r = s.receita || {}, cnae = [r.cnae && (r.cnae + " " + (r.cnaeDesc || "")), ...(r.cnaesSec || [])].filter(Boolean).join(" · ");
    return {objeto: cs ? cs.analise.extraido.objeto.slice(0, 600) : "", cnae, fonte: [cs ? "objeto social (" + (cs.nome || "contrato social") + ")" : "", cnae ? "CNAE da Receita Federal" : ""].filter(Boolean).join(" e ")}; };
  const SUG = {pos: [[/coleta|sucat|ferro.?velho|aparas|catad/i, "Coletor de sucata"], [/triag|separa[çc]|enfard|prensag|recupera[çc][aã]o de materiais|recicl/i, "Processador / triagem"], [/fundi[çc]/i, "Fundição"], [/refin/i, "Refino"],
      [/lamina|trefil|extrus|semiacabad|metalurgia d/i, "Fabricante de produtos semiacabados"], [/fabrica[çc][aã]o de (fios|cabos)|fios.{0,20}cabos|condutores el[ée]tricos/i, "Fabricante de fios e cabos"], [/distribui|atacadist/i, "Distribuidor"], [/com[ée]rcio|comercializa/i, "Comercializador"]],
    prod: [[/vergalh/i, "Vergalhões"], [/fios|cabos/i, "Fios e cabos"], [/barras?\b/i, "Barras"], [/tubos?\b/i, "Tubos"], [/lingot/i, "Lingotes"], [/granalh/i, "Granalha"]],
    merc: [[/constru[çc]/i, "Construção civil"], [/energia|el[ée]tric/i, "Energia"], [/telecom/i, "Telecomunicações"], [/autom[oó]|ve[íi]cul/i, "Automotivo"], [/ind[úu]stri/i, "Industrial"]]};
  const METAL = /sucat|metal|metais|cobre|alum[íi]nio|lat[aã]o|bronze|ferro|a[çc]o\b|recicl|res[íi]duo|aparas|fios|cabos|fundi|refin|trefil|lamina|ferro.?velho|desmonte|demoli/i;
  function sugestoes(s){ const a = atividade(s), t = a.objeto + " " + a.cnae; const out = {};
    Object.entries(SUG).forEach(([g, L]) => { out[g] = L.map(([re, v]) => re.test(t) && (C[{pos: "POSICOES", prod: "PRODUTOS", merc: "MERCADOS"}[g]] || []).includes(v) ? v : null).filter(Boolean); });
    if (out.prod.length && !METAL.test(t)) out.prod = [];
    return {a, out, compat: !(a.objeto || a.cnae) ? null : METAL.test(t)}; }
  const vendaCli = s => { try{ if (typeof OPS === "undefined") return 0; const de = new Date(Date.now() - 365 * DIA).toISOString().slice(0, 10);
      return OPS.analise().R.filter(x => x.sup?.id === s.id && x.nf.situacao !== "cancelada" && String(x.nf.emissao || "") >= de).reduce((t, x) => t + (x.kg || 0), 0) / 1000; }catch(e){ return 0; } };
  /* documento que comprova cada requisito */
  const DOC_REQ = {c4_1: "Portaria, organograma ou ata que designa os responsáveis (nome e cargo)", c4_2: "Registros de compra, estoque e venda (planilha ou relatório do sistema) e notas fiscais",
    c4_3: "Procedimento de comunicação ao avaliador e registros das comunicações feitas", c5_1: "Documento de escopo: posição na cadeia, produtos, matérias-primas, processos e terceirizações",
    c5_2: "Lista de locais, depósitos e unidades com endereço (alvarás ou contratos de locação)", c5_3: "Documento de limites e exclusões, com as justificativas", c5_4: "Tabela de grupos de produtos controlados",
    c6_1: "Contrato social registrado, cartão CNPJ (com CNAE) e inscrição estadual", c6_2: "Licença ambiental, alvará de funcionamento, CTF IBAMA, AVCB e certidões negativas",
    c6_3: "Declaração de importação, fatura comercial e conhecimento de transporte (BL/AWB)", c7_1: "Lista atualizada de fornecedores com CNPJ/CPF, materiais, classificação e situação",
    c7_2: "Declarações de conformidade dos fornecedores, com a data da verificação", c7_3: "Registros de avaliação e qualificação dos fornecedores, com a decisão e a justificativa",
    c7_4: "Certificados de treinamento ou currículo de quem avalia e decide", c7_5: "Registros da reavaliação anual dos fornecedores", c8_1: "Registros de recebimento: tickets de pesagem, notas fiscais e romaneios",
    c8_2: "Procedimento de conferência e registros de divergências, suspeitas e bloqueios", c8_3: "Registros que ligam o material aprovado à produção (ordens de produção)",
    c9_1: "Relatório do sistema de rastreabilidade (entradas, processamento, estoque e saídas)", c9_2: "Procedimento de mistura de materiais e reconciliação", c9_3: "Modelos das declarações enviadas ao cliente",
    c10_1: "Memória de cálculo do fator de conversão (perdas e refugos)", c10_2: "Registros de inventário e de tratamento de divergências", c10_3: "Relatório anual de volumes (balanço de massa)",
    c11_1: "Notas fiscais de venda com o número de registro de conformidade", c11_2: "Documento de venda com os itens dentro e fora do escopo identificados", c12_1: "Relatório da auditoria interna anual e ata de análise pela gestão",
    c12_2: "Registro do canal de denúncias e das tratativas", c13_1: "Registros de não conformidades e ações corretivas", c13_2: "Planos de ação com as datas de entrega e de implementação",
    c14_1: "Lista de presença e conteúdo do treinamento anual", c14_2: "Código de Ética e Conduta e política de brindes e conflitos de interesse", c14_3: "Comunicados, atas de reuniões ou workshops com fornecedores"};
  TABS.splice(TABS.findIndex(t => t[0] === "risco"), 0, ["mapa", "Mapeamento"], ["conf", "Conformidade"]);

  /* ---------- validação de CNPJ (numérico e alfanumérico) e CPF ---------- */
  const docLimpo = v => String(v || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  function cpfOk(d){ if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
    const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === +d[9] && dv(10) === +d[10]; }
  function cnpjOk(d){ if (!/^[0-9A-Z]{12}\d{2}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
    const val = c => c.charCodeAt(0) - 48;
    const dv = n => { let s = 0, p = n - 7; for (let i = 0; i < n; i++){ s += val(d[i]) * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return dv(12) === +d[12] && dv(13) === +d[13]; }
  const docOk = v => { const d = docLimpo(v); return d.length === 11 ? cpfOk(d) : d.length === 14 ? cnpjOk(d) : false; };

  const M = s => s.mapa || {}, CF = s => s.conf || {};
  const updM = (s, p) => save(Store.update("suppliers", s.id, {mapa: p}));
  const updC = (s, p) => save(Store.update("suppliers", s.id, {conf: p}));
  const dias = d => d ? (hoje() - new Date(d + "T12:00").getTime()) / DIA : null;
  const dPlus = (d, n) => d ? new Date(new Date(d + "T12:00").getTime() + n * DIA).toISOString().slice(0, 10) : "";
  const dBR = d => d ? new Date(d + "T12:00").toLocaleDateString("pt-BR") : "—";

  /* ---------- análise automática do mapeamento ---------- */
  function analisa(s){
    const m = M(s), vol = m.vol || {}, forn = m.forn || [], cli = m.cli || [];
    const total = C.ORIGENS.reduce((t, [k]) => t + (num(vol[k]) || 0), 0);
    const compras = C.ORIGENS.filter(o => o[2]).reduce((t, [k]) => t + (num(vol[k]) || 0), 0);
    const somaF = forn.reduce((t, r) => t + (num(r.vol) || 0), 0), somaC = cli.reduce((t, r) => t + (num(r.vol) || 0), 0);
    const difF = compras > 0 && somaF > 0 ? (somaF - compras) / compras : null;
    const base = forn.map(r => { const d = docLimpo(r.doc); return d ? S.suppliers.find(x => x.id !== s.id && docLimpo(x.doc) === d) : null; });
    const docRuim = forn.filter(r => !docOk(r.doc)).length;
    const semAval = forn.filter(r => r.cls !== "aprovado" && (dias(r.aval) == null || dias(r.aval) > 365)).length;
    const altos = dentro ? [] : (() => { dentro = true; try { return base.filter(x => x && riskOf(x).level === "alto"); } finally { dentro = false; } })();
    const iniciado = !!(forn.length || cli.length || total || (m.pos || []).length);
    const blocos = [(m.pos || []).length && (m.prod || []).length, (m.uni || []).length, total > 0, forn.length, m.decl?.aceite].filter(Boolean).length;   /* bloco 6 (clientes do fornecedor) é opcional */
    return {m, vol, forn, cli, total, compras, somaF, somaC, difF, base, docRuim, semAval, altos, iniciado, blocos, completo: blocos === 5};
  }
  /* ---------- análise automática da conformidade ---------- */
  function conformidade(s){
    const c = CF(s), st = c.st || {}, A = analisa(s), ncs = c.ncs || [];
    let ok = 0, pa = 0, resp = 0, obNc = 0, obNa = 0, pend = 0;
    C.REQ.forEach(([id, cap]) => { const v = st[id]?.v; const ob = cap <= 10;
      if (!v){ pend++; return; } if (v === "na"){ if (ob) obNa++; return; }
      resp++; if (v === "ok") ok++; else if (v === "parcial") pa++; else if (v === "nc" && ob) obNc++; });
    const ncAtraso = ncs.filter(n => n.notif && ((!n.plano && dias(n.notif) > 15) || (!n.impl && dias(n.notif) > 60))).length;
    const audVenc = c.audit && dias(c.audit) > 365, trVenc = c.trein && dias(c.trein) > 365;
    return {c, st, A, ncs, ok, pa, resp, obNc, obNa, pend, ncAtraso, audVenc, trVenc, pct: resp ? Math.round((ok + pa * .5) / resp * 100) : null};
  }
  /* sugestão automática por requisito: [status, motivo] ou null */
  function auto(id, s, K){
    const A = K.A, m = A.m, c = K.c;
    const r = {
      c5_1: () => A.iniciado ? ((m.pos || []).length && (m.prod || []).length ? ["ok", "posição na cadeia e produtos informados no mapeamento"] : ["parcial", "posição na cadeia ou produtos não informados"]) : null,
      c5_2: () => A.iniciado ? ((m.uni || []).length ? ["ok", `${m.uni.length} unidade(s) descrita(s) no mapeamento`] : ["nc", "nenhuma unidade descrita no mapeamento"]) : null,
      c6_1: () => s.invest?.situacao ? (s.invest.situacao === "Ativa" ? ["ok", "CNPJ ativo na Receita Federal (Investigação)"] : ["nc", `CNPJ ${s.invest.situacao.toLowerCase()} na Receita Federal`]) : null,
      c7_1: () => A.forn.length ? (A.docRuim || A.forn.some(x => !x.cls || !x.prodf) ? ["parcial", `${A.forn.length} fornecedor(es) listados; faltam CNPJ válido, material ou classificação em alguns`] : ["ok", `${A.forn.length} fornecedor(es) com identificação, material e classificação`]) : null,
      c7_5: () => A.forn.length ? (A.semAval ? ["nc", `${A.semAval} fornecedor(es) de material controlado sem avaliação nos últimos 12 meses`] : ["ok", "todos os fornecedores controlados avaliados nos últimos 12 meses"]) : null,
      c10_2: () => { const b = s.balanco || {}; return ["ei", "compras", "vendas", "ef"].every(k => num(b[k]) != null) ? ["ok", "balanço de massa registrado na aba Testes"] : null; },
      c10_3: () => A.difF != null ? (Math.abs(A.difF) <= .1 ? ["ok", `volumes dos fornecedores conferem com as compras declaradas (${fmt(A.difF * 100, 1)}%)`] : ["nc", `volumes dos fornecedores ${fmt(Math.abs(A.difF) * 100, 1)}% ${A.difF > 0 ? "acima" : "abaixo"} das compras declaradas`]) : null,
      c12_1: () => c.audit ? (dias(c.audit) <= 365 ? ["ok", `última auditoria interna em ${dBR(c.audit)}`] : ["nc", `última auditoria interna em ${dBR(c.audit)} (mais de 12 meses)`]) : null,
      c13_2: () => K.ncs.length ? (K.ncAtraso ? ["nc", `${K.ncAtraso} não conformidade(s) com prazo vencido`] : ["ok", "planos e implementações dentro dos prazos de 15 e 60 dias"]) : null,
      c14_1: () => c.trein ? (dias(c.trein) <= 365 ? ["ok", `último treinamento em ${dBR(c.trein)}`] : ["nc", `último treinamento em ${dBR(c.trein)} (mais de 12 meses)`]) : null
    }[id];
    return r ? r() : null;
  }

  /* ---------- riscos que entram na matriz ---------- */
  EXT_RISKS.push((s, add) => {
    { const sg = sugestoes(s); if (sg.compat === false) add("Cadeia do cobre", "Atividade da empresa (objeto social / CNAE) não confere com a operação de cobre e metais", 3); }
    const A = analisa(s);
    if (A.difF != null && Math.abs(A.difF) > .1) add("Cadeia do cobre", `Volume dos fornecedores mapeados (${fmt(A.somaF)} t) ${fmt(Math.abs(A.difF) * 100, 1)}% ${A.difF > 0 ? "acima" : "abaixo"} das compras declaradas (${fmt(A.compras)} t)`, 2);
    if (A.total > 0 && A.somaC > A.total * 1.05) add("Cadeia do cobre", `Vendas aos principais clientes (${fmt(A.somaC)} t) acima do volume total movimentado (${fmt(A.total)} t)`, 3);
    if (A.docRuim) add("Cadeia do cobre", `${A.docRuim} fornecedor(es) do mapeamento com CNPJ/CPF ausente ou inválido`, Math.min(3, A.docRuim));
    if (A.altos.length) add("Cadeia do cobre", `Fornecedor mapeado em alto risco na base: ${A.altos.map(x => x.nome).slice(0, 3).join("; ")}`, 2);
    if (A.semAval) add("Cadeia do cobre", `${A.semAval} fornecedor(es) de material controlado sem avaliação nos últimos 12 meses`, 1);
    if (A.iniciado && !A.m.decl?.aceite) add("Cadeia do cobre", "Declaração de veracidade do mapeamento não assinada", 1);
    const K = conformidade(s);
    if (K.obNc) add("Conformidade do cobre", `${K.obNc} requisito(s) obrigatório(s) não atendido(s) (governança, escopo, fornecedores, recebimento, rastreabilidade e inventário)`, Math.min(6, 2 * K.obNc));
    if (K.obNa) add("Conformidade do cobre", `${K.obNa} requisito(s) obrigatório(s) marcado(s) como não aplicável (não permitido)`, 1);
    if (K.ncAtraso) add("Conformidade do cobre", `${K.ncAtraso} não conformidade(s) com prazo vencido (plano em 15 dias, implementação em 60 dias)`, 2);
    if (K.audVenc) add("Conformidade do cobre", "Auditoria interna anual vencida", 1);
    if (K.trVenc) add("Conformidade do cobre", "Treinamento anual de integridade vencido", 1);
  });

  /* ---------- componentes ---------- */
  const chk = (grp, list, sel, outro) => `<div style="display:flex;flex-wrap:wrap;gap:6px 14px">${list.map(x => `<label class="check"><input type="checkbox" data-ck="${grp}" value="${esc(x)}" ${(sel || []).includes(x) ? "checked" : ""}> ${esc(x)}</label>`).join("")}</div><div class="fld" style="margin-top:6px"><input data-out="${grp}" placeholder="Outros (especificar)" value="${esc(outro || "")}"></div>`;
  const UFS_OPT = v => `<option value="">UF</option>` + UFS.map(u => `<option ${u === v ? "selected" : ""}>${u}</option>`).join("");
  function tabela(key, cols, rows, extra){
    const campo = (c, r) => c.k === "uf" ? `<select data-f="uf">${UFS_OPT(r.uf)}</select>` :
      c.opts ? `<select data-f="${c.k}"><option value="">—</option>${c.opts.map(([v, l]) => `<option value="${v}" ${r[c.k] === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>` :
      `<input data-f="${c.k}" ${c.type ? `type="${c.type}"` : ""} ${c.num ? 'inputmode="decimal"' : ""} value="${esc(r[c.k] || "")}">`;
    const ed = cols.filter(c => !c.calc), calc = cols.filter(c => c.calc);
    return `<div data-tb="${key}" style="display:flex;flex-direction:column;gap:8px">${rows.map((r, i) => `<div data-r="${i}" style="border:1px solid var(--line);border-radius:10px;padding:10px;position:relative">
      <button type="button" class="btn sm ghost" data-del="${key}" data-i="${i}" aria-label="Remover linha" style="position:absolute;top:6px;right:6px">×</button>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px 10px;padding-right:34px">${ed.map(c => `<div class="fld" style="${c.wide ? "grid-column:1/-1" : ""}"><label style="font-size:11px">${c.t}</label>${campo(c, r)}</div>`).join("")}</div>
      ${calc.map(c => `<div style="margin-top:6px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">${c.calc(r, i)}</div>`).join("")}</div>`).join("") ||
      `<p class="sub" style="margin:0">Nenhuma linha ainda.</p>`}</div>${extra || ""}<button type="button" class="btn sm" data-add="${key}" style="margin-top:6px">+ Linha</button>`;
  }
  const lerTabela = (b, key) => $$(`[data-tb="${key}"] [data-r]`, b).map(el => Object.fromEntries($$("[data-f]", el).map(x => [x.dataset.f, x.value.trim()])));

  /* ---------- aba Mapeamento ---------- */
  EXT_TABS.mapa = (s, b) => {
    const A = analisa(s), m = A.m, nivelFilho = {N1: "N2", N2: "N3"}[s.nivel];
    const fornCols = [
      {k: "tipo", t: "Tipo", w: 150, opts: C.TIPOS},
      {k: "nome", t: "Razão social", w: 170}, {k: "doc", t: "CNPJ / CPF", w: 140},
      {k: "cidade", t: "Cidade", w: 110}, {k: "uf", t: "UF", w: 70},
      {k: "prodf", t: "Produtos / serviços", w: 140}, {k: "vol", t: "t/ano", w: 80, num: true},
      {k: "cls", t: "Classificação", w: 120, opts: [["aprovado", "Material aprovado"], ["controlado", "Material controlado"]]},
      {k: "aval", t: "Última avaliação", w: 130, type: "date"},
      {k: "_st", t: "Situação", w: 170, calc: (r, i) => { const x = A.base[i], ok = docOk(r.doc), v = r.cls !== "aprovado" && (dias(r.aval) == null || dias(r.aval) > 365);
        return `${r.doc && !ok ? `<div style="color:var(--bad);font-size:12px">CNPJ/CPF inválido</div>` : ""}${v ? `<div style="color:var(--warn);font-size:12px">Reavaliar${r.aval ? " desde " + dBR(dPlus(r.aval, 365)) : " (sem avaliação)"}</div>` : r.aval ? `<div class="sub" style="margin:0;font-size:12px">Próxima: ${dBR(dPlus(r.aval, 365))}</div>` : ""}${x ? `<button type="button" class="btn sm ghost" data-open-sup="${x.id}">${riskPill(riskOf(x))}</button>` : nivelFilho && r.nome ? `<button type="button" class="btn sm" data-criar="${i}">Cadastrar na cadeia</button>` : ""}`; }}];
    const cliCols = [{k: "nome", t: "Cliente do fornecedor", w: 170}, {k: "doc", t: "CNPJ", w: 140}, {k: "cidade", t: "Cidade", w: 110}, {k: "uf", t: "UF", w: 70}, {k: "prodf", t: "Produtos / serviços", w: 150}, {k: "vol", t: "t/ano", w: 80, num: true}];
    const uniCols = [{k: "nome", t: "Unidade", w: 130}, {k: "cidade", t: "Cidade", w: 120}, {k: "uf", t: "UF", w: 70}, {k: "ativ", t: "Atividades (coleta, triagem, fundição, refino, fabricação, comercialização…)", w: 300, wide: true}];
    const alerta = [];
    if (A.difF != null) alerta.push(Math.abs(A.difF) > .1 ? `<div class="why why-alto"><b>Volumes não conferem</b><ul><li>Fornecedores mapeados: ${fmt(A.somaF)} t/ano · compras declaradas: ${fmt(A.compras)} t/ano (${A.difF > 0 ? "+" : ""}${fmt(A.difF * 100, 1)}%).</li></ul></div>` : `<div class="why why-baixo"><b>Volumes conferem</b><ul><li>Fornecedores mapeados: ${fmt(A.somaF)} t/ano · compras declaradas: ${fmt(A.compras)} t/ano.</li></ul></div>`);
    if (A.total > 0 && A.somaC > A.total * 1.05) alerta.push(`<div class="why why-alto"><b>Vendas acima do volume movimentado</b><ul><li>Principais clientes: ${fmt(A.somaC)} t/ano · volume total: ${fmt(A.total)} t/ano. Indica compra sem registro ou erro de preenchimento.</li></ul></div>`);
    b.innerHTML = `<div class="head"><div><h3>Mapeamento da cadeia de fornecimento de cobre</h3><p class="sub">${A.blocos} de 5 blocos obrigatórios preenchidos (o bloco 6 é opcional). O sistema confere volumes, valida CNPJ/CPF, cruza fornecedores com a base e calcula as datas de reavaliação.</p></div><button type="button" class="btn sm" id="mp-csv">Exportar mapeamento (CSV)</button></div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>1 · Dados da empresa</h3><dl class="kv"><dt>Razão social</dt><dd>${esc(s.nome)}</dd><dt>CNPJ</dt><dd class="mono">${esc(s.doc || "—")}</dd><dt>Cidade / UF</dt><dd>${esc(s.municipio || "—")}/${esc(s.uf || "—")}</dd></dl>
        <div class="form"><div class="fld"><label for="mp-end">Endereço</label><input id="mp-end" value="${esc(m.end || endAuto(s).v)}">${!m.end && endAuto(s).v ? `<span class="hint">Preenchido automaticamente ${esc(endAuto(s).f)}. Pode ser alterado se a empresa mudou de endereço.</span>` : m.end && endAuto(s).v && semAcento(m.end) !== semAcento(endAuto(s).v) ? `<span class="hint" style="color:var(--warn)">Diferente ${esc(endAuto(s).f)}: ${esc(endAuto(s).v)}. Confirmar a mudança de endereço.</span>` : ""}</div><div class="fld"><label for="mp-pais">País</label><input id="mp-pais" value="${esc(m.pais || "Brasil")}"></div></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>2 · Operações da empresa</h3>
        ${(() => { const sg = sugestoes(s); if (sg.compat === false) return `<div class="why why-alto"><b>Atividade da empresa não confere com a operação de cobre e metais</b><ul><li>${esc(sg.a.fonte)}: ${esc((sg.a.objeto || sg.a.cnae).replace(/\s+/g, " ").slice(0, 260))}${(sg.a.objeto || sg.a.cnae).length > 260 ? "…" : ""}</li><li>Verificar se a empresa pode comprar e vender sucata e metais (objeto social e CNAE); empresa de outro ramo operando com cobre é indício de fachada ou de nota fria.</li></ul></div>`;
          if (sg.compat === null) return `<p class="sub" style="margin:0;font-size:12.5px">Anexe o contrato social (ou consulte o CNPJ) para o sistema marcar sozinho a posição na cadeia, os produtos e os mercados pelo objeto social e pelo CNAE.</p>`;
          return m.auto ? `<p class="sub" style="margin:0;font-size:12.5px">Marcado automaticamente pelo ${esc(sg.a.fonte)}. Confira e ajuste se necessário.</p>` : ""; })()}
        <div class="eyebrow">Posição na cadeia do cobre</div>${chk("pos", C.POSICOES, m.pos, m.posOutro)}
        <div class="eyebrow">Produtos com cobre fornecidos</div>${chk("prod", C.PRODUTOS, m.prod, m.prodOutro)}
        <div class="eyebrow">Principais mercados atendidos</div>${chk("merc", C.MERCADOS, m.merc, m.mercOutro)}</div>
      <div class="card"><h3>3 · Atividades por unidade</h3>${tabela("uni", uniCols, m.uni || [])}</div>
      <div class="card"><h3>4 · Volume anual de cobre movimentado</h3><div class="tbl"><table><thead><tr><th>Origem do material</th><th>t/ano</th><th>% do total</th></tr></thead><tbody>${C.ORIGENS.map(([k, l]) => `<tr><td>${esc(l)}</td><td style="min-width:110px"><input data-vol="${k}" inputmode="decimal" value="${esc(A.vol[k] || "")}"></td><td class="mono">${A.total ? fmt((num(A.vol[k]) || 0) / A.total * 100, 1) + "%" : "—"}</td></tr>`).join("")}<tr><td><b>Total</b></td><td class="mono"><b>${fmt(A.total)}</b></td><td class="mono">${A.total ? "100%" : "—"}</td></tr></tbody></table></div>
        <div class="fld"><input id="mp-outdesc" placeholder="Outras fontes (descrever)" value="${esc(m.volOutro || "")}"></div></div>
      <div class="card"><h3>5 · Fornecedores da cadeia do cobre</h3><p class="sub">Tipos: ${C.TIPOS.map(([v, l]) => `<b>${v}</b> ${esc(l.replace(/^T\d · /, ""))}`).join(" · ")}.</p>
        ${tabela("forn", fornCols, A.forn, `<p class="sub" style="margin:6px 0 0">Total mapeado: <b>${fmt(A.somaF)} t/ano</b>${A.compras ? ` · compras declaradas no bloco 4: ${fmt(A.compras)} t/ano` : ""}.</p>`)}
        <button type="button" class="btn sm ghost" id="mp-base" style="margin-top:6px">Trazer fornecedores já vinculados na base</button></div>
      <div class="card"><h3>6 · Para quem o fornecedor vende (opcional · até 15)</h3><p class="sub" style="margin:4px 0 8px">Clientes <b>deste fornecedor</b>, inclusive o cliente contratante. Serve para conferir se o volume que ele vende fecha com o que ele compra: vender mais do que compra indica material sem origem ou compra sem nota. ${vendaCli(s) ? `Pelas notas importadas, ele vendeu <b>${fmt(vendaCli(s), 1)} t</b> ao cliente contratante nos últimos 12 meses.` : ""}</p>${tabela("cli", cliCols, A.cli, `<p class="sub" style="margin:6px 0 0">Total vendido aos clientes informados: <b>${fmt(A.somaC)} t/ano</b>.</p>`)}</div>
      ${alerta.join("")}
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>7 · Declaração</h3>
        <div class="form">${[["nome", "Nome"], ["cargo", "Cargo"], ["email", "E-mail"], ["tel", "Telefone"]].map(([k, l]) => `<div class="fld"><label for="mp-d-${k}">${l}</label><input id="mp-d-${k}" data-decl="${k}" value="${esc(m.decl?.[k] || "")}"></div>`).join("")}<div class="fld"><label for="mp-d-data">Data</label><input id="mp-d-data" type="date" data-decl="data" value="${esc(m.decl?.data || "")}"></div></div>
        <label class="check"><input type="checkbox" id="mp-aceite" ${m.decl?.aceite ? "checked" : ""}> Declaro que as informações fornecidas são verdadeiras e refletem o conhecimento atual da empresa sobre sua cadeia de fornecimento de cobre reciclado.</label></div>`;
    // salvar
    $$("[data-ck]", b).forEach(x => x.onchange = () => { const g = x.dataset.ck; updM(s, {[g]: $$(`[data-ck="${g}"]`, b).filter(y => y.checked).map(y => y.value), auto: false}); });
    /* clientes do fornecedor: o N1 vende ao cliente contratante; N2 e N3 vendem ao fornecedor acima na cadeia */
    if (!(m.cli || []).length && !m.cliAuto && Store.me.canWrite !== false){ const par = s.parentId ? supById(s.parentId) : null, cl = CLI(), v = s.nivel === "N1" ? vendaCli(s) : 0;
      const row = par ? {nome: par.nome, doc: par.doc || "", cidade: par.municipio || "", uf: par.uf || "", prodf: "", vol: ""} : {nome: cl.nome, doc: cl.doc || "", cidade: (cl.local || "").split(/[\/,-]/)[0].trim(), uf: "", prodf: "", vol: v ? String(Math.round(v * 10) / 10) : ""};
      updM(s, {cli: [row], cliAuto: true}); }
    /* primeira vez com objeto social ou CNAE: marca as opções correspondentes (só nos grupos ainda vazios) */
    { const sg = sugestoes(s), up = {}; if (sg.compat) ["pos", "prod", "merc"].forEach(g => { if (!(m[g] || []).length && sg.out[g].length && !(m.autoFeito || {})[g]) up[g] = sg.out[g]; });
      if (Object.keys(up).length && Store.me.canWrite !== false) updM(s, {...up, auto: true, autoFeito: {pos: true, prod: true, merc: true}}); }
    $$("[data-out]", b).forEach(x => x.onchange = () => updM(s, {[x.dataset.out + "Outro"]: x.value.trim()}));
    $("#mp-end").onchange = e => updM(s, {end: e.target.value.trim()}); $("#mp-pais").onchange = e => updM(s, {pais: e.target.value.trim()});
    $("#mp-outdesc").onchange = e => updM(s, {volOutro: e.target.value.trim()});
    $$("[data-vol]", b).forEach(x => x.onchange = () => updM(s, {vol: {[x.dataset.vol]: x.value.trim()}}));
    ["uni", "forn", "cli"].forEach(k => {
      $$(`[data-tb="${k}"] [data-f]`, b).forEach(x => x.onchange = () => updM(s, {[k]: lerTabela(b, k)}));
      const add = $(`[data-add="${k}"]`, b); if (add) add.onclick = () => { const rows = lerTabela(b, k); if (k === "cli" && rows.length >= 15){ toast("Informe até 15 clientes."); return; } rows.push({}); updM(s, {[k]: rows}); };
    });
    $$("[data-del]", b).forEach(x => x.onclick = () => { const k = x.dataset.del, rows = lerTabela(b, k); rows.splice(+x.dataset.i, 1); updM(s, {[k]: rows}); });
    $$("[data-decl]", b).forEach(x => x.onchange = () => updM(s, {decl: {[x.dataset.decl]: x.value.trim()}}));
    $("#mp-aceite").onchange = e => updM(s, {decl: {aceite: e.target.checked, aceiteEm: e.target.checked ? nowISO() : null, aceitePor: Store.me?.id || ""}});
    $$("[data-open-sup]", b).forEach(x => x.onclick = () => openSupplier(x.dataset.openSup, "dados"));
    // automação: trazer da base e cadastrar na cadeia
    $("#mp-base").onclick = () => { const rows = lerTabela(b, "forn"), tem = new Set(rows.map(r => docLimpo(r.doc)).filter(Boolean));
      const novos = S.suppliers.filter(k => k.parentId === s.id && !tem.has(docLimpo(k.doc))).map(k => ({tipo: C.TIPO_DE(k.tipo), nome: k.nome || "", doc: k.doc || "", cidade: k.municipio || "", uf: k.uf || "", prodf: "", vol: k.volume ? String(k.volume) : "", cls: "controlado", aval: ""}));
      if (!novos.length){ toast("Nenhum fornecedor vinculado novo para trazer."); return; }
      updM(s, {forn: rows.concat(novos)}); toast(`${novos.length} fornecedor(es) trazido(s) da base`); };
    $$("[data-criar]", b).forEach(x => x.onclick = async () => { const r = lerTabela(b, "forn")[+x.dataset.criar]; if (!r?.nome) return;
      const c = r.uf && UF_CENTER[r.uf], id = uid();
      await save(Store.set("suppliers", id, {nome: r.nome, doc: r.doc || "", nivel: nivelFilho, tipo: C.TIPO_PARA(r.tipo, nivelFilho), municipio: r.cidade || "", uf: r.uf || "", lat: c ? c[0] : null, lng: c ? c[1] : null, geoAprox: true, parentId: s.id, volume: r.vol || "",
        answers: {}, docs: {}, insp: {}, balanco: {}, invest: {}, criadoEm: nowISO(), criadoPor: Store.me?.id || "", origem: "Mapeamento da cadeia do cobre", conferir: true}));
      toast(`${r.nome} cadastrado como ${nivelFilho} na Cadeia`); });
    $("#mp-csv").onclick = () => exportarCSV([s]);
  };

  /* ---------- aba Conformidade ---------- */
  EXT_TABS.conf = (s, b) => {
    const K = conformidade(s), st = K.st, caps = [...new Set(C.REQ.map(r => r[1]))];
    const stat = (n, l, bad) => `<div class="stat"><div class="n" style="color:${bad ? "var(--bad)" : "inherit"}">${n}</div><div class="l">${l}</div></div>`;
    b.innerHTML = `<div class="head"><div><h3>Requisitos de origem lícita e rastreabilidade do cobre</h3><p class="sub">Avalie cada requisito com evidência objetiva. Os capítulos 4 a 10 são obrigatórios e não podem ser marcados como não aplicáveis.</p></div><button type="button" class="btn sm primary" id="cf-auto">Preencher automaticamente</button></div>
      <div class="stats">${stat(K.pct == null ? "—" : K.pct + "%", "Conformidade")}${stat(K.obNc, "Obrigatórios não atendidos", K.obNc)}${stat(K.pend, "Requisitos sem avaliação", false)}${stat(K.ncAtraso, "Não conformidades atrasadas", K.ncAtraso)}</div>
      <div class="form"><div class="fld"><label for="cf-aud">Data da última auditoria interna</label><input id="cf-aud" type="date" value="${esc(K.c.audit || "")}"><span class="hint">${K.c.audit ? "Próxima até " + dBR(dPlus(K.c.audit, 365)) : "Exigida pelo menos uma vez por ano, por equipe independente."}</span></div>
        <div class="fld"><label for="cf-tr">Data do último treinamento de integridade</label><input id="cf-tr" type="date" value="${esc(K.c.trein || "")}"><span class="hint">${K.c.trein ? "Próximo até " + dBR(dPlus(K.c.trein, 365)) : "Exigido pelo menos uma vez por ano, com registro de participantes."}</span></div></div>
      ${caps.map(cap => `<div class="eyebrow" style="margin-top:14px">${cap}. ${esc(C.CAPS[cap])}${cap <= 10 ? ` <span class="pill r-alto" style="font-size:10px;padding:1px 7px">Obrigatório</span>` : ""}</div>
        <div class="qgroup">${C.REQ.filter(r => r[1] === cap).map(([id, , t]) => { const v = st[id] || {}, sug = auto(id, s, K);
          const arqs = S.evidences.filter(e => e.supplierId === s.id && e.req === id);
          return `<div class="q" data-rq="${id}"><span class="qn">${id.replace(/^c/, "").replace("_", ".")}</span><div class="qt">${esc(t)}${DOC_REQ[id] ? `<div class="sub" style="margin:4px 0 0;font-size:12px"><b>Documento esperado:</b> ${esc(DOC_REQ[id])}</div>` : ""}${arqs.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${arqs.map(e => `<a ${e.url ? `href="${esc(e.url)}" target="_blank" rel="noopener"` : ""} class="fbtn" style="text-decoration:none;font-size:11.5px">📄 ${esc((e.nome || e.tipo).slice(0, 40))}</a>`).join("")}</div>` : ""}${sug ? `<div class="sub" style="margin:4px 0 0;font-size:12px">Automático: ${sug[0] === "ok" ? "atende" : sug[0] === "parcial" ? "parcial" : "não atende"} · ${esc(sug[1])}</div>` : ""}</div>
          <div class="qa"><div class="seg">${[["ok", "Atende", "v-sim"], ["parcial", "Parcial", "v-na"], ["nc", "Não atende", "risk"], ["na", "N/A", "v-nao"]].map(([k, l, cl]) => `<button type="button" data-v="${k}" class="${cl}" aria-pressed="${v.v === k}" ${k === "na" && cap <= 10 ? "disabled style=\"opacity:.35;cursor:not-allowed\" title=\"Obrigatório: não pode ser excluído\"" : ""}>${l}</button>`).join("")}</div><input type="text" placeholder="${esc(DOC_REQ[id] ? "Ex.: " + DOC_REQ[id].split(/[,(]/)[0].trim() + ", data" : "Evidência objetiva (documento, registro, data)")}" value="${esc(v.n || "")}"></div></div>`; }).join("")}</div>`).join("")}
      <div class="card" style="margin-top:14px"><h3>Não conformidades e ações corretivas</h3><p class="sub">Plano de ação em até 15 dias e implementação em até 60 dias após a notificação. O sistema calcula os prazos e aponta atrasos.</p>
        ${tabela("ncs", [{k: "req", t: "Requisito", w: 130, opts: C.REQ.map(([id, , t]) => [id, id.replace(/^c/, "").replace("_", ".") + " · " + t.slice(0, 40)])}, {k: "desc", t: "Descrição", w: 220, wide: true}, {k: "notif", t: "Notificação", w: 130, type: "date"}, {k: "plano", t: "Plano entregue", w: 130, type: "date"}, {k: "impl", t: "Implementada", w: 130, type: "date"},
          {k: "_p", t: "Prazos e situação", w: 190, calc: r => { if (!r.notif) return `<span class="sub" style="font-size:12px">Informe a data de notificação</span>`;
            const pP = dPlus(r.notif, 15), pI = dPlus(r.notif, 60), atP = !r.plano && dias(r.notif) > 15, atI = !r.impl && dias(r.notif) > 60;
            return `<div style="font-size:12px">Plano até ${dBR(pP)}${atP ? ' <b style="color:var(--bad)">atrasado</b>' : r.plano ? " ✓" : ""}<br>Implementação até ${dBR(pI)}${atI ? ' <b style="color:var(--bad)">atrasada</b>' : r.impl ? " ✓" : ""}</div>`; }}], K.ncs)}</div>`;
    $$("[data-rq]", b).forEach(q => { const id = q.dataset.rq;
      $$("[data-v]", q).forEach(btn => btn.onclick = () => updC(s, {st: {[id]: {v: st[id]?.v === btn.dataset.v ? "" : btn.dataset.v, em: nowISO(), por: Store.me?.id || ""}}}));
      $("input[type=text], input:not([type])", q).onchange = e => updC(s, {st: {[id]: {n: e.target.value.trim()}}});
      if (Store.me.canWrite !== false && typeof VISAO !== "undefined"){ const qa = $(".qa", q), lb = document.createElement("label"); lb.className = "btn sm ghost"; lb.style.cssText = "cursor:pointer;padding:4px 10px"; lb.innerHTML = `+ Anexar<input type="file" multiple hidden accept=".pdf,.doc,.docx,.txt,.xml,.csv,.xlsx,image/*">`;
        const seg = $(".seg", qa); (seg || qa.firstChild).after(lb);
        $("input[type=file]", lb).onchange = async ev => { const fs = [...ev.target.files]; if (!fs.length) return; lb.firstChild.textContent = "Enviando…";
          try{ const tt = C.REQ.find(r => r[0] === id)?.[2] || "", num = id.replace(/^c/, "").replace("_", ".");
            await VISAO.anexar(s.id, fs, {req: id, obs: `Conformidade ${num}: ${tt.slice(0, 80)}`});
            const atual = (st[id]?.n || "").trim(); updC(s, {st: {[id]: {n: (atual ? atual + "; " : "") + "Anexado: " + fs.map(f => f.name).join(", ") + " (" + new Date().toLocaleDateString("pt-BR") + ")"}}}); toast(`${fs.length} documento(s) anexado(s) ao requisito ${num}`); }
          catch(x){ toast("Não foi possível anexar"); lb.firstChild.textContent = "+ Anexar"; } }; } });
    $("#cf-aud").onchange = e => updC(s, {audit: e.target.value}); $("#cf-tr").onchange = e => updC(s, {trein: e.target.value});
    $$('[data-tb="ncs"] [data-f]', b).forEach(x => x.onchange = () => updC(s, {ncs: lerTabela(b, "ncs")}));
    $('[data-add="ncs"]', b).onclick = () => { const r = lerTabela(b, "ncs"); r.push({notif: new Date().toISOString().slice(0, 10)}); updC(s, {ncs: r}); };
    $$('[data-del="ncs"]', b).forEach(x => x.onclick = () => { const r = lerTabela(b, "ncs"); r.splice(+x.dataset.i, 1); updC(s, {ncs: r}); });
    $("#cf-auto").onclick = () => { const p = {}; let n = 0;
      C.REQ.forEach(([id]) => { const sug = auto(id, s, K); if (sug && !st[id]?.v){ p[id] = {v: sug[0], n: "Automático: " + sug[1], em: nowISO(), por: "sistema"}; n++; } });
      if (!n){ toast("Nada novo para preencher automaticamente."); return; } updC(s, {st: p}); toast(`${n} requisito(s) preenchido(s) automaticamente; confira as evidências`); };
  };

  /* ---------- exportação consolidada ---------- */
  function exportarCSV(lista){
    const L = [["Respondente", "CNPJ respondente", "Tipo", "Fornecedor", "CNPJ/CPF", "Documento válido", "Cidade", "UF", "Produtos/serviços", "t/ano", "Classificação", "Última avaliação", "Próxima avaliação", "Na base", "Risco na base"]];
    lista.forEach(s => { const A = analisa(s); A.forn.forEach((r, i) => { const x = A.base[i];
      L.push([s.nome, s.doc || "", r.tipo || "", r.nome || "", r.doc || "", docOk(r.doc) ? "sim" : "não", r.cidade || "", r.uf || "", r.prodf || "", r.vol || "", r.cls || "", r.aval || "", r.aval ? dPlus(r.aval, 365) : "", x ? "sim" : "não", x ? RISK_LABEL[riskOf(x).level] : ""]); }); });
    const csv = "﻿" + L.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"})); a.download = `KinseyTec_${SEG_NOME.replace(/[^A-Za-z0-9]+/g, "_")}_mapeamento_cadeia_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }

  /* ---------- quadro consolidado na aba Auditoria ---------- */
  const linhas = () => S.suppliers.filter(s => s.mapa || s.conf || s.nivel === "N1").map(s => ({s, A: analisa(s), K: conformidade(s)}));
  EXT_AUD.push(() => {
    const L = linhas(); if (!L.length) return;
    const el = document.createElement("div");
    el.innerHTML = `<div class="head"><div><div class="eyebrow">Cadeia do cobre · origem lícita e rastreabilidade</div><h2>Mapeamento e conformidade</h2><p class="sub">${L.filter(x => x.A.completo).length} de ${L.length} mapeamento(s) completo(s) · ${L.filter(x => x.K.obNc).length} com requisito obrigatório não atendido · ${L.filter(x => x.K.ncAtraso).length} com não conformidade atrasada.</p></div><button type="button" class="btn sm" id="cb-csv">Exportar mapeamentos (CSV)</button></div>
      <div class="card tbl" style="padding:6px 8px"><table><thead><tr><th>Fornecedor</th><th>Mapeamento</th><th>t/ano</th><th>Volumes</th><th>Conformidade</th><th>Obrig. não atendidos</th><th>NCs atrasadas</th></tr></thead><tbody>${L.map(({s, A, K}) => `<tr data-open="${s.id}" data-tab="mapa" style="cursor:pointer"><td style="min-width:170px"><span class="lvtag">${s.nivel}</span> ${esc(s.nome)}</td><td>${A.completo ? "Completo" : A.iniciado ? `${A.blocos}/5` : "Pendente"}</td><td class="mono">${A.total ? fmt(A.total) : "—"}</td><td style="color:${A.difF != null && Math.abs(A.difF) > .1 ? "var(--bad)" : "inherit"}">${A.difF == null ? "—" : Math.abs(A.difF) > .1 ? `Divergem ${fmt(A.difF * 100, 1)}%` : "Conferem"}</td><td class="mono">${K.pct == null ? "—" : K.pct + "%"}</td><td class="mono" style="color:${K.obNc ? "var(--bad)" : "inherit"}">${K.obNc}</td><td class="mono" style="color:${K.ncAtraso ? "var(--bad)" : "inherit"}">${K.ncAtraso}</td></tr>`).join("")}</tbody></table></div>`;
    const ref = $("#auditoria #rpt"); if (ref) ref.after(...el.childNodes); else $("#auditoria").prepend(...el.childNodes);
    $$('#auditoria [data-tab="mapa"]').forEach(r => r.onclick = () => openSupplier(r.dataset.open, "mapa"));
    const bt = $("#cb-csv"); if (bt) bt.onclick = () => exportarCSV(L.map(x => x.s));
  });

  /* recomendações e base normativa dos pontos da cadeia do cobre (entram no relatório) */
  RPT_REC.unshift(
    [/Volume dos fornecedores mapeados|Vendas aos principais clientes/, "Reconciliar entradas, inventário e saídas com o fator de conversão por grupo de produtos; investigar compras sem registro e corrigir o mapeamento.", "Lei 9.613/1998; CP art. 180; NBC TA 520 (procedimentos analíticos)"],
    [/requisito\(s\) obrigatório/, "Implementar, com evidências objetivas, os controles obrigatórios de governança, escopo, qualificação de fornecedores, recebimento, rastreabilidade e inventário antes de novas compras.", "ABNT NBR ISO/IEC 17065 e ABNT NBR ISO 19011 (referência); Lei 12.846/2013"],
    [/prazo vencido \(plano/, "Apresentar o plano de ação e concluir a implementação, registrando contenção, causa, correção e verificação de eficácia.", "ABNT NBR ISO 19011 (referência); NBC TO 3000"],
    [/Auditoria interna anual vencida|Treinamento anual de integridade vencido/, "Realizar a auditoria interna independente e o treinamento anual de integridade, com registro de conteúdo, data e participantes.", "Decreto 11.129/2022 (programa de integridade); ABNT NBR ISO 19011"],
    [/sem avaliação nos últimos 12 meses/, "Reavaliar os fornecedores de material controlado e registrar a decisão de qualificação e quem a tomou.", "CP art. 180, § 1º; Decreto 11.129/2022"],
    [/Declaração de veracidade do mapeamento/, "Obter a declaração de veracidade assinada pelo responsável pelo mapeamento.", "CC art. 422 (boa-fé objetiva)"],
    [/Fornecedor mapeado em alto risco/, "Suspender compras do fornecedor em alto risco até a conclusão da diligência e registrar a decisão.", "CP art. 180; Lei 12.846/2013"],
    [/marcado\(s\) como não aplicável/, "Avaliar os requisitos obrigatórios marcados como não aplicáveis; eles não podem ser excluídos.", "ABNT NBR ISO/IEC 17000 (referência)"]);
  /* ---------- relatório de pontos ---------- */
  RPT_EXT.push((P) => {
    const L = linhas().filter(x => x.A.iniciado || x.K.resp); if (!L.length) return;
    P.h2("Mapeamento e conformidade da cadeia do cobre");
    P.table([{t: "Fornecedor", w: .26}, {t: "Mapeamento", w: .12}, {t: "t/ano", w: .09}, {t: "Volumes", w: .15}, {t: "Conformidade", w: .12}, {t: "Obrig. pend.", w: .13}, {t: "NCs atrasadas", w: .13}],
      L.map(({s, A, K}) => [{t: `${s.nome} (${s.nivel})`, b: true}, A.completo ? "Completo" : `${A.blocos}/5`, A.total ? fmt(A.total) : "—", A.difF == null ? "—" : Math.abs(A.difF) > .1 ? `Divergem ${fmt(A.difF * 100, 1)}%` : "Conferem",
        K.pct == null ? "—" : K.pct + "%", {t: String(K.obNc), c: K.obNc ? [198, 40, 40] : [27, 36, 51], b: !!K.obNc}, {t: String(K.ncAtraso), c: K.ncAtraso ? [198, 40, 40] : [27, 36, 51], b: !!K.ncAtraso}]), {size: 7.8});
  });
})();
