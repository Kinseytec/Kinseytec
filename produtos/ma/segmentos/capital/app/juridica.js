/* ================= KINSEY CAPITAL · DILIGÊNCIA JURÍDICA =================
   Área "Jurídica" da Due Diligence: questionário inicial (pedido de informações), inventário dos contratos dos
   últimos 3 ou 5 anos com leitura automática das cláusulas críticas, processos e matriz de contingências
   (provável, possível, remota), evidências jurídicas e relatório com recomendações para o contrato.
   Processos prováveis sem provisão viram ajuste na Due Diligence (procedimento J-01), sujeito ao OK do consultor.
   Dados no target: s.jdd = {periodo, q, ct, pr, adv}. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  const uidj = () => "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------------- QUESTIONÁRIO INICIAL ---------------- */
  /* [id, pergunta, resposta que indica risco, pontos, documento esperado] */
  const JQ = [
    {g:"Societário", items:[
      ["js1","Os atos societários (contrato social ou estatuto e alterações) estão registrados e atualizados na Junta Comercial?","nao",3,"Contrato social e atos societários"],
      ["js2","Há acordo de sócios com direito de preferência, tag along, drag along ou lock-up que afete a venda?","sim",1,"Acordo de sócios"],
      ["js3","Existe ônus sobre as quotas ou ações (penhor, alienação fiduciária, usufruto, penhora judicial)?","sim",4,"Certidão da Junta e livros societários"],
      ["js4","Há procurações amplas vigentes ou administradores sem poderes formalizados?","sim",1,"Procurações vigentes"],
      ["js5","A empresa tem participações em outras sociedades, filiais ou estrutura de grupo?","",0,"Organograma societário"],
      ["js6","Há litígio, divergência ou inventário envolvendo sócios ou herdeiros?","sim",4,"Relação de processos societários"]]},
    {g:"Contratos (últimos 3 a 5 anos)", items:[
      ["jc1","A empresa entregou a relação dos contratos relevantes (clientes, fornecedores, financiamento, locação, parcerias) do período?","nao",2,"Relação de contratos relevantes"],
      ["jc2","Algum contrato relevante pode ser rescindido ou exige anuência em caso de mudança de controle?","sim",3,"Contratos com cláusula de mudança de controle"],
      ["jc3","Há exclusividade, não concorrência ou restrição territorial que limite o negócio?","sim",2,"Contratos com exclusividade"],
      ["jc4","Existem multas rescisórias relevantes ou contratos de longo prazo com preço fixo desfavorável?","sim",2,"Contratos com multa rescisória"],
      ["jc5","Há contratos com partes relacionadas (sócios, parentes, empresas do grupo) fora das condições de mercado?","sim",3,"Contratos com partes relacionadas"],
      ["jc6","A empresa prestou garantias (fiança, aval, garantia real) a terceiros ou a empresas dos sócios?","sim",3,"Relação de garantias prestadas"],
      ["jc7","Existem contratos relevantes verbais, vencidos em execução ou sem assinatura?","sim",2,"Declaração da administração"]]},
    {g:"Endividamento e garantias", items:[
      ["jd1","Os contratos de dívida têm covenants ou vencimento antecipado por mudança de controle?","sim",3,"Contratos de financiamento"],
      ["jd2","Há garantias reais (hipoteca, alienação fiduciária) sobre ativos relevantes?","sim",2,"Matrículas e contratos de garantia"]]},
    {g:"Trabalhista e previdenciário", items:[
      ["jt1","Há processos trabalhistas relevantes ou ações coletivas (sindicato, Ministério Público do Trabalho)?","sim",3,"Relação de processos trabalhistas"],
      ["jt2","A empresa cumpre convenções e acordos coletivos (pisos, horas extras, adicionais)?","nao",2,"Convenções coletivas"],
      ["jt3","Há autos de infração do Ministério do Trabalho nos últimos 5 anos?","sim",2,"Autos de infração MTE"],
      ["jt4","Usa prestadores PJ ou terceirização na atividade-fim?","sim",2,"Contratos de prestadores"],
      ["jt5","Há afastamentos, acidentes de trabalho graves ou doenças ocupacionais recorrentes?","sim",2,"CATs e relatório de SST"]]},
    {g:"Tributário", items:[
      ["jx1","Há execuções fiscais, autos de infração ou processos administrativos tributários?","sim",3,"Relação de processos tributários"],
      ["jx2","A empresa usa benefícios fiscais condicionados (incentivos estaduais, regimes especiais)?","sim",1,"Termos de acordo e concessões"],
      ["jx3","As certidões negativas (federal, estadual, municipal, FGTS e trabalhista) estão válidas?","nao",3,"Certidões negativas"]]},
    {g:"Contencioso cível e consumidor", items:[
      ["jv1","Há processos cíveis relevantes (contratos, indenizações, recuperação de crédito) como ré?","sim",2,"Relação de processos cíveis"],
      ["jv2","Há reclamações relevantes em Procon, consumidor.gov ou recall de produto?","sim",2,"Relatório de reclamações"]]},
    {g:"Imobiliário", items:[
      ["ji1","Os imóveis próprios têm matrícula regular em nome da empresa e sem ônus?","nao",2,"Matrículas atualizadas"],
      ["ji2","Os imóveis locados têm contrato escrito, garantia e direito de renovação?","nao",1,"Contratos de locação"],
      ["ji3","As unidades têm Habite-se e AVCB (bombeiros) válidos?","nao",2,"Habite-se e AVCB"]]},
    {g:"Ambiental e regulatório", items:[
      ["ja1","As licenças ambientais e setoriais (ANVISA, MAPA, ANATEL, ANP, etc.) estão válidas?","nao",3,"Licenças e alvarás"],
      ["ja2","Há autos de infração, embargos ou termos de ajustamento de conduta (TAC) ambientais?","sim",3,"Autos e TACs ambientais"],
      ["ja3","Há área contaminada, passivo ambiental ou resíduos sem destinação comprovada?","sim",3,"Laudos ambientais"]]},
    {g:"Propriedade intelectual e tecnologia", items:[
      ["jp1","As marcas principais estão registradas no INPI em nome da empresa?","nao",2,"Registros de marca (INPI)"],
      ["jp2","Os softwares usados estão licenciados e o código próprio pertence à empresa (cessão dos desenvolvedores)?","nao",2,"Licenças e termos de cessão"],
      ["jp3","Os domínios de internet e perfis em redes sociais estão em nome da empresa?","nao",1,"Registro de domínios"]]},
    {g:"Compliance e anticorrupção", items:[
      ["jo1","A empresa tem programa de integridade (código de conduta, canal de denúncias, due diligence de terceiros)?","nao",2,"Programa de integridade"],
      ["jo2","Há contratos com governo, licitações ou concessões relevantes?","sim",1,"Contratos públicos"],
      ["jo3","Há investigação, acordo de leniência, doação política ou relação com pessoa politicamente exposta?","sim",4,"Declaração de compliance"]]},
    {g:"Proteção de dados (LGPD)", items:[
      ["jl1","A empresa nomeou encarregado (DPO), tem política de privacidade e registro das operações de tratamento?","nao",2,"Política e inventário de dados"],
      ["jl2","Houve incidente de segurança ou vazamento de dados pessoais?","sim",3,"Relatório de incidentes"]]},
    {g:"Seguros", items:[
      ["jg1","Há seguros vigentes compatíveis (patrimonial, responsabilidade civil, D&O, transporte)?","nao",1,"Apólices vigentes"]]}
  ];
  const QS = JQ.flatMap(g => g.items.map(i => ({g:g.g, id:i[0], t:i[1], risco:i[2], pts:i[3], doc:i[4]})));

  /* ---------------- CONTRATOS ---------------- */
  const CT_TIPOS = ["Cliente","Fornecedor","Financiamento / dívida","Locação","Parceria / joint venture","Licença / propriedade intelectual","Prestação de serviços","Distribuição / representação","Governo / licitação","Partes relacionadas","Outro"];
  const FLAGS = [["coc","Mudança de controle",/mudanca (de|do) controle|alteracao (do|de) controle|cessao (de|do) controle|transferencia (de|do) controle|change of control|alteracao (na|da) composicao societaria/],
    ["excl","Exclusividade",/exclusividade|com exclusividade|exclusivamente/], ["nc","Não concorrência",/nao concorr|nao competi|non.?compet/],
    ["multa","Multa rescisória",/multa (rescisoria|compensatoria|por rescisao|equivalente)|multa de \d|clausula penal/], ["gar","Garantias",/fianca|fiador|\baval\b|garantia real|alienacao fiduciaria|penhor|hipoteca|carta de fianca|seguro garantia/],
    ["cessao","Cessão vedada",/(vedad[ao]|proibid[ao]) a cessao|nao (podera|pode) ceder|cessao[^.;]{0,60}(previa|expressa) (anuencia|autorizacao|consentimento)/], ["renov","Renovação automática",/renovacao automatica|renovad[oa] automaticamente|prorrogad[oa] automaticamente/]];
  function lerContrato(texto){
    const t = nrm(texto), f = {}, tr = {};
    FLAGS.forEach(([k, , re]) => { const m = re.exec(t); if (m){ f[k] = true; tr[k] = "…" + t.slice(Math.max(0, m.index - 60), m.index + 160) + "…"; } });
    const pz = /prazo (de|determinado de) (\d{1,3}) \(?[a-z ]*\)? ?(meses|anos)/.exec(t), vl = /r\$ ?([\d.]+,\d{2})/.exec(t);
    return {flags:f, trechos:tr, prazo:pz ? pz[2] + " " + pz[3] : "", valor:vl ? vl[1] : "", em:nowISO()};
  }
  async function textoEvid(e){
    if (!e?.url && !e?.assetId) return ""; const buf = await (await ktBaixar(e)).arrayBuffer(), nome = (e.nome || "").toLowerCase(), mime = e.mime || "";
    if (/pdf/.test(mime) || /\.pdf$/.test(nome)) return (await IMP.lerPDF(buf)).map(r => r.join(" ")).join("\n");
    if (/word|officedocument/.test(mime) || /\.docx$/.test(nome)){ const d = await IMP.lerDOCX(buf); return [...(d.linhas || []), ...(d.tabela || []).map(r => r.join(" "))].join("\n"); }
    return "";
  }
  const anos = s => +(s.jdd?.periodo || 5);
  const noPeriodo = (s, c) => { const lim = new Date(); lim.setFullYear(lim.getFullYear() - anos(s)); const ini = c.assinatura ? new Date(c.assinatura) : null, fim = c.fim ? new Date(c.fim) : null; return !ini || ini >= lim || !fim || fim >= new Date(); };
  const contratos = s => Object.entries(s.jdd?.ct || {}).filter(([, c]) => c).map(([id, c]) => ({id, ...c, flags:{...(c.auto?.flags || {}), ...(c.flags || {})}}));

  /* ---------------- PROCESSOS ---------------- */
  const PR_AREAS = ["Trabalhista","Cível","Tributário","Ambiental","Administrativo","Consumidor","Societário"];
  const PROG = [["provavel","Provável"],["possivel","Possível"],["remota","Remota"]];
  const processos = s => Object.entries(s.jdd?.pr || {}).filter(([, p]) => p).map(([id, p]) => ({id, ...p}));
  function contingencias(s){ const L = processos(s), o = {n:L.length, provavel:0, possivel:0, remota:0, provisao:0, area:{}};
    L.forEach(p => { const v = +p.valor || 0; o[p.prog || "possivel"] += v; o.provisao += +p.provisao || 0; const a = o.area[p.area] ||= {provavel:0, possivel:0, remota:0, n:0}; a[p.prog || "possivel"] += v; a.n++; }); return o; }

  /* ---------------- RISCO E RECOMENDAÇÕES ---------------- */
  EXT_RISKS.push((s, add) => { if (s.nivel !== "N3" || !s.jdd) return; const q = s.jdd.q || {};
    QS.forEach(x => { if (x.risco && q[x.id]?.v === x.risco) add("Diligência jurídica", x.t.replace(/\?$/, "") + (x.risco === "sim" ? " — SIM" : " — NÃO"), x.pts); });
    const c = contingencias(s); if (c.provavel > 0) add("Diligência jurídica", `Contingências prováveis de ${mi(c.provavel)}`, c.provavel > 5e6 ? 4 : 2); });
  EXT_TOUCH.push(s => !!s.jdd && Object.keys(s.jdd.q || {}).length > 0);
  function recomendacoes(s){
    const lado = s.lado === "compra" ? 1 : 0, q = s.jdd?.q || {}, C = contratos(s).filter(c => noPeriodo(s, c)), cg = contingencias(s), R = [];
    const r = (venda, compra) => R.push(lado ? compra : venda);
    const coc = C.filter(c => c.flags.coc); if (coc.length) r(`Mapear e pedir antecipadamente a anuência das contrapartes de ${coc.length} contrato(s) com mudança de controle (${coc.map(c => c.contraparte).join(", ")}); prever no SPA como providência conjunta, não como condição a critério do comprador.`, `Exigir anuência (waiver) das contrapartes de ${coc.length} contrato(s) com mudança de controle como condição precedente: ${coc.map(c => c.contraparte).join(", ")}.`);
    const ex = C.filter(c => c.flags.excl || c.flags.nc); if (ex.length) r(`Divulgar no data room as ${ex.length} exclusividade(s)/não concorrência e incluí-las no anexo de exceções às declarações.`, `Avaliar o impacto de ${ex.length} exclusividade(s)/não concorrência na tese e negociar liberação ou ajuste de preço.`);
    const gar = C.filter(c => c.flags.gar); if (gar.length || q.jc6?.v === "sim") r("Liberar ou substituir as garantias prestadas pela empresa e pelos sócios antes do fechamento.", "Exigir liberação das garantias prestadas pela empresa a terceiros e partes relacionadas no fechamento.");
    if (cg.provavel > 0) r(`Contingências prováveis de ${mi(cg.provavel)}: provisionar ou abater do preço de forma transparente, evitando indenização sem teto.`, `Contingências prováveis de ${mi(cg.provavel)}: indenização específica sem franquia e retenção (escrow) equivalente.`);
    if (cg.possivel > 0) r(`Contingências possíveis de ${mi(cg.possivel)}: listar no anexo de exceções; limitar indenização específica ao valor dos processos listados.`, `Contingências possíveis de ${mi(cg.possivel)}: declaração específica e indenização pelos processos listados.`);
    if (q.js3?.v === "sim") r("Liberar os ônus sobre as quotas antes de abrir o processo de venda.", "Liberação dos ônus sobre as quotas/ações como condição precedente.");
    if (q.jp1?.v === "nao") r("Registrar as marcas no INPI em nome da empresa (protege o valor da marca no valuation).", "Exigir registro ou cessão das marcas para a empresa antes do fechamento.");
    if (q.ja1?.v === "nao" || q.ji3?.v === "nao") r("Regularizar licenças, alvarás e AVCB antes do data room.", "Regularização de licenças, alvarás e AVCB como condição precedente ou obrigação pós-fechamento com retenção.");
    if (q.jl1?.v === "nao" || q.jl2?.v === "sim") r("Implantar o básico da LGPD (encarregado, política, inventário) e divulgar incidentes.", "Declaração específica de LGPD e plano de adequação com prazo.");
    if (q.jc5?.v === "sim") r("Ajustar ou encerrar contratos com partes relacionadas fora de mercado antes da venda.", "Normalizar contratos com partes relacionadas (ajuste de EBITDA) e encerrá-los no fechamento.");
    if (q.jt4?.v === "sim") r("Quantificar o risco de vínculo dos prestadores PJ e avaliar regularização gradual.", "Indenização específica para reclamações de vínculo de prestadores PJ.");
    return R;
  }

  /* ---------------- VIEW (dentro da DD · área Jurídica) ---------------- */
  S.jddTab = S.jddTab || "quest";
  const TABS_J = [["quest","Questionário inicial"],["contratos","Contratos"],["processos","Processos e contingências"],["evid","Evidências jurídicas"],["rel","Relatório jurídico"]];
  function html(s){
    const j = s.jdd || {}, ed = D.ed() ? "" : "disabled", q = j.q || {}, resp = QS.filter(x => q[x.id]?.v).length, risco = QS.filter(x => x.risco && q[x.id]?.v === x.risco).length;
    const C = contratos(s), Cp = C.filter(c => noPeriodo(s, c)), cg = contingencias(s), evs = S.evidences.filter(e => e.supplierId === s.id), evOpt = sel => `<option value="">—</option>${evs.map(e => `<option value="${e.id}" ${e.id === sel ? "selected" : ""}>${esc(e.tipo)} · ${esc((fixMoji(e.nome || "") || dt(e.criadoEm)).slice(0, 30))}</option>`).join("")}`;
    let corpo = "";
    if (S.jddTab === "quest") corpo = `<p class="sub" style="margin:0">Pedido de informações e questionamentos iniciais. Cada resposta pode ter a evidência que a comprova; respostas de risco entram na matriz de risco do target.</p>
      ${JQ.map(g => `<div class="qgroup"><div class="eyebrow">${esc(g.g)}</div>${g.items.map(([id, t, rk, , doc]) => { const c = q[id] || {}; return `<div class="q"><span class="qn">${String(QS.findIndex(x => x.id === id) + 1).padStart(2, "0")}</span><div class="qt">${esc(t)} ${rk && c.v === rk ? `<span class="flag">● RISCO</span>` : ""}<div class="sub" style="margin:2px 0 0;font-size:11.5px">Documento esperado: ${esc(doc)}</div></div>
        <div class="qa"><div class="seg">${[["sim","Sim"],["nao","Não"],["na","N/A"]].map(([v, l]) => `<button type="button" data-jq="${id}" data-v="${v}" class="v-${v} ${rk === v ? "risk" : ""}" aria-pressed="${c.v === v}" ${ed}>${l}</button>`).join("")}</div>
        <input type="text" data-jqn="${id}" value="${esc(c.n || "")}" placeholder="Observação" aria-label="Observação" ${ed}><select data-jqe="${id}" aria-label="Evidência" style="max-width:180px" ${ed}>${evOpt(c.evid)}</select></div></div>`; }).join("")}</div>`).join("")}`;
    else if (S.jddTab === "contratos") corpo = `<div class="head" style="margin:0"><div><p class="sub" style="margin:0">Contratos assinados nos últimos <select id="j-per" aria-label="Período" ${ed}>${[3, 5].map(a => `<option ${a === anos(s) ? "selected" : ""}>${a}</option>`).join("")}</select> anos e os ainda vigentes: ${Cp.length} de ${C.length} no período. Cláusulas críticas lidas automaticamente do arquivo; o advogado confirma.</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${D.ed() ? `<button type="button" class="btn sm primary" id="j-ctadd">+ Contrato</button><button type="button" class="btn sm" id="j-ctimp">Importar das evidências</button>` : ""}</div></div>
      ${Cp.length ? `<div class="tbl"><table><thead><tr><th>Contrato</th><th>Vigência</th><th>Valor anual</th>${FLAGS.map(f => `<th title="${f[1]}" style="font-size:10px">${f[1]}</th>`).join("")}<th></th></tr></thead><tbody>${Cp.sort((a, b) => String(b.assinatura).localeCompare(a.assinatura)).map(c => `<tr>
        <td style="min-width:180px"><b>${esc(c.contraparte)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(c.tipo)}${c.relev ? " · relevância " + esc(c.relev) : ""}${c.auto ? " · lido automaticamente" : ""}</div></td><td style="font-size:12px;white-space:nowrap">${esc(c.assinatura || "—")} a ${esc(c.fim || "indeterminado")}</td><td class="dd-num">${c.valor ? mi(+c.valor) : "—"}</td>
        ${FLAGS.map(([k]) => `<td style="text-align:center">${c.flags[k] ? `<span title="${esc(c.auto?.trechos?.[k] || "")}" style="color:var(--bad);font-weight:700">●</span>` : `<span class="sub">–</span>`}</td>`).join("")}
        <td style="white-space:nowrap"><button type="button" class="btn sm" data-ctv="${c.id}">Abrir</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nenhum contrato no período. Cadastre ou importe dos arquivos anexados em Evidências.</div>`}`;
    else if (S.jddTab === "processos") corpo = `<div class="head" style="margin:0"><div><p class="sub" style="margin:0">Relação de processos com prognóstico do advogado da empresa e certidões dos distribuidores. Prováveis sem provisão contábil viram ajuste na Due Diligence (J-01).</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${D.ed() ? `<button type="button" class="btn sm primary" id="j-pradd">+ Processo</button><button type="button" class="btn sm" id="j-primp">Colar relação</button>` : ""}</div></div>
      <div class="dd-kpis"><div class="dd-k"><span>Provável</span><b style="color:var(--bad)">${mi(cg.provavel)}</b><small>provisão ${mi(cg.provisao)}</small></div><div class="dd-k"><span>Possível</span><b>${mi(cg.possivel)}</b></div><div class="dd-k"><span>Remota</span><b>${mi(cg.remota)}</b></div><div class="dd-k"><span>Processos</span><b>${cg.n}</b></div></div>
      ${Object.keys(cg.area).length ? `<div class="tbl"><table><thead><tr><th>Matriz de contingências</th><th class="dd-num">Provável</th><th class="dd-num">Possível</th><th class="dd-num">Remota</th><th class="dd-num">Processos</th></tr></thead><tbody>${Object.entries(cg.area).map(([a, v]) => `<tr><td>${esc(a)}</td><td class="dd-num">${mi(v.provavel)}</td><td class="dd-num">${mi(v.possivel)}</td><td class="dd-num">${mi(v.remota)}</td><td class="dd-num">${v.n}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${processos(s).length ? `<div class="tbl"><table><thead><tr><th>Processo</th><th>Área</th><th>Objeto</th><th class="dd-num">Valor</th><th>Prognóstico</th><th></th></tr></thead><tbody>${processos(s).map(p => `<tr><td class="mono" style="font-size:11.5px">${esc(p.numero || "—")}</td><td>${esc(p.area)}</td><td style="font-size:12.5px">${esc(p.objeto || "")}</td><td class="dd-num">${mi(+p.valor || 0)}</td>
        <td><select data-prg="${p.id}" aria-label="Prognóstico" ${ed}>${PROG.map(([k, l]) => `<option value="${k}" ${k === p.prog ? "selected" : ""}>${l}</option>`).join("")}</select></td><td>${D.ed() ? `<button type="button" class="btn sm ghost" data-prx="${p.id}">Remover</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
    else if (S.jddTab === "evid"){ const tipos = [...new Set(QS.map(x => x.doc))], tem = d => evs.some(e => nrm(e.tipo + " " + (e.nome || "")).includes(nrm(d).split(" ")[0])) || QS.some(x => x.doc === d && q[x.id]?.evid);
      corpo = `<p class="sub" style="margin:0">Documentos que comprovam cada ponto da diligência jurídica. Anexe aqui ou ligue a evidência à pergunta no questionário.</p>
      <div class="tbl"><table><thead><tr><th>Documento</th><th>Situação</th><th></th></tr></thead><tbody>${tipos.map(d => `<tr><td>${esc(d)}</td><td>${tem(d) ? `<span class="pill r-baixo">Recebido</span>` : `<span class="pill r-pend">Pendente</span>`}</td><td style="text-align:right">${D.ed() ? `<button type="button" class="btn sm" data-jev="${esc(d)}">Anexar</button>` : ""}</td></tr>`).join("")}</tbody></table></div>
      ${evs.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Arquivos do target (${evs.length})</div><div class="grid-ev">${evs.map(evCard).join("")}</div></div>` : ""}`; }
    else { const R = recomendacoes(s);
      corpo = `<p class="sub" style="margin:0">Visão da Kinsey como <b>${s.lado === "compra" ? "assessora do comprador (buy-side)" : "assessora do vendedor (sell-side)"}</b>. Altere o lado na aba M&A do dossiê do target.</p>
      <div class="form"><div class="fld"><label for="j-adv">Advogado responsável (nome e OAB)</label><input id="j-adv" value="${esc(j.adv || "")}" ${ed} list="j-eq"><datalist id="j-eq">${(typeof EQUIPE_KINSEY !== "undefined" ? EQUIPE_KINSEY : []).map(([n, c]) => `<option value="${esc(n)}">${esc(c)}</option>`).join("")}</datalist></div></div>
      <h3 style="font-size:14px">Recomendações para o contrato</h3>${R.length ? `<ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px">${R.map(x => `<li style="font-size:13.5px">${esc(x)}</li>`).join("")}</ol>` : `<p class="sub" style="margin:0">Sem recomendações ainda: responda o questionário e registre contratos e processos.</p>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="j-pdf">Relatório de diligência jurídica (PDF)</button></div>`; }
    return `<div class="card" id="jdd" style="display:flex;flex-direction:column;gap:12px;border-color:rgba(195,155,255,.45)"><div class="head" style="margin:0"><div><div class="eyebrow">Diligência jurídica</div><h3>${esc(s.nome)}</h3>
        <p class="sub" style="margin:2px 0 0">${resp} de ${QS.length} respostas · ${risco} ponto(s) de risco · ${Cp.length} contrato(s) no período · ${cg.n} processo(s)</p></div></div>
      <div class="dd-tabs">${TABS_J.map(([k, l]) => `<button type="button" class="fbtn" data-jtab="${k}" aria-pressed="${S.jddTab === k}">${l}</button>`).join("")}</div>${corpo}</div>`;
  }
  function bind(host, s){
    const up = p => D.up(s, {jdd:p});
    $$("[data-jtab]", host).forEach(b => b.onclick = () => { S.jddTab = b.dataset.jtab; renderView(); });
    $$("[data-jq]", host).forEach(b => b.onclick = () => { const cur = s.jdd?.q?.[b.dataset.jq]?.v; up({q:{[b.dataset.jq]:{v:cur === b.dataset.v ? "" : b.dataset.v, em:nowISO(), por:Store.me?.email || ""}}}); });
    $$("[data-jqn]", host).forEach(i => i.onchange = () => up({q:{[i.dataset.jqn]:{n:i.value.trim()}}}));
    $$("[data-jqe]", host).forEach(i => i.onchange = () => up({q:{[i.dataset.jqe]:{evid:i.value}}}));
    const per = $("#j-per", host); if (per) per.onchange = () => up({periodo:+per.value});
    const ad = $("#j-ctadd", host); if (ad) ad.onclick = () => formContrato(s);
    $$("[data-ctv]", host).forEach(b => b.onclick = () => formContrato(s, b.dataset.ctv));
    const im = $("#j-ctimp", host); if (im) im.onclick = async () => { const ja = new Set(contratos(s).map(c => c.evid)), evs = S.evidences.filter(e => e.supplierId === s.id && /contrato|acordo|locac/i.test(e.tipo + " " + (e.nome || "")) && !ja.has(e.id));
      if (!evs.length){ toast("Nenhum contrato novo nas evidências do target."); return; } im.disabled = true; let n = 0;
      for (const e of evs){ let auto = null; try{ const t = await textoEvid(e); if (t.length > 100) auto = lerContrato(t); }catch(x){}
        await D.up(s, {jdd:{ct:{[uidj()]:{tipo:"Outro", contraparte:e.nome || e.tipo, evid:e.id, auto, criadoEm:nowISO()}}}}); n++; }
      im.disabled = false; toast(`${n} contrato(s) importado(s) das evidências`); };
    const pa = $("#j-pradd", host); if (pa) pa.onclick = () => formProcesso(s);
    const pi = $("#j-primp", host); if (pi) pi.onclick = () => colarProcessos(s);
    $$("[data-prg]", host).forEach(x => x.onchange = () => up({pr:{[x.dataset.prg]:{prog:x.value}}}));
    $$("[data-prx]", host).forEach(b => b.onclick = () => up({pr:{[b.dataset.prx]:null}}));
    $$("[data-jev]", host).forEach(b => b.onclick = () => openEvidenceForm(s.id, /contrat/i.test(b.dataset.jev) ? "Contrato" : "Outro"));
    if (typeof bindEvCards === "function" && S.jddTab === "evid") bindEvCards(host);
    const adv = $("#j-adv", host); if (adv) adv.onchange = () => up({adv:adv.value.trim()});
    const pdf = $("#j-pdf", host); if (pdf) pdf.onclick = () => window.KT_GRAF ? KT_GRAF.modo("Diligência jurídica · " + s.nome, md => relatorio(s, md)) : relatorio(s).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
  }
  function formContrato(s, id){
    const c = id ? contratos(s).find(x => x.id === id) : {}, evs = S.evidences.filter(e => e.supplierId === s.id);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Diligência jurídica · contratos</div><h2>${id ? esc(c.contraparte) : "Novo contrato"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fjc" novalidate><div class="form">
        <div class="fld"><label for="jc-t">Tipo</label><select id="jc-t">${CT_TIPOS.map(t => `<option ${t === c.tipo ? "selected" : ""}>${t}</option>`).join("")}</select></div><div class="fld"><label for="jc-c">Contraparte</label><input id="jc-c" value="${esc(c.contraparte || "")}"></div>
        <div class="fld"><label for="jc-a">Assinatura</label><input id="jc-a" type="date" value="${esc(c.assinatura || "")}"></div><div class="fld"><label for="jc-f">Fim da vigência</label><input id="jc-f" type="date" value="${esc(c.fim || "")}"></div>
        <div class="fld"><label for="jc-v">Valor anual (R$ mil)</label><input id="jc-v" inputmode="decimal" value="${c.valor ? fmt(c.valor / 1e3, 0) : ""}"></div><div class="fld"><label for="jc-r">Relevância</label><select id="jc-r">${["alta","média","baixa"].map(r => `<option ${r === c.relev ? "selected" : ""}>${r}</option>`).join("")}</select></div>
        <div class="fld full"><label for="jc-e">Arquivo do contrato (evidência)</label><select id="jc-e"><option value="">—</option>${evs.map(e => `<option value="${e.id}" ${e.id === c.evid ? "selected" : ""}>${esc(e.tipo)} · ${esc(e.nome || "")}</option>`).join("")}</select></div>
        <div class="fld full"><span class="sub">Cláusulas críticas</span><div style="display:flex;gap:12px;flex-wrap:wrap">${FLAGS.map(([k, l]) => `<label class="check"><input type="checkbox" id="jf-${k}" ${c.flags?.[k] ? "checked" : ""}> ${l}</label>`).join("")}</div>
          ${c.auto ? `<p class="sub" style="margin:4px 0 0;font-size:12px">Leitura automática em ${dt(c.auto.em)}${c.auto.prazo ? " · prazo " + esc(c.auto.prazo) : ""}${c.auto.valor ? " · R$ " + esc(c.auto.valor) : ""}</p>${Object.entries(c.auto.trechos || {}).map(([k, t]) => `<p class="sub" style="margin:2px 0 0;font-size:11.5px;font-style:italic"><b>${esc(FLAGS.find(f => f[0] === k)?.[1] || k)}:</b> ${esc(t)}</p>`).join("")}` : ""}</div>
        <div class="fld full"><label for="jc-o">Análise do advogado</label><textarea id="jc-o">${esc(c.obs || "")}</textarea></div></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;flex-wrap:wrap">${id ? `<button type="button" class="btn ghost" id="jc-x">Remover</button>` : ""}<button type="button" class="btn" id="jc-ler">Ler arquivo</button><button type="submit" class="btn primary">Salvar</button></div></form>`);
    const cid = id || uidj(), lerAuto = async () => { const e = S.evidences.find(x => x.id === $("#jc-e").value); if (!e){ toast("Escolha o arquivo do contrato."); return null; } const t = await textoEvid(e); if (t.length < 100){ toast("Não consegui ler o texto do arquivo (PDF de imagem?)."); return null; } return lerContrato(t); };
    $("#jc-ler").onclick = async () => { const a = await lerAuto().catch(() => null); if (!a) return; FLAGS.forEach(([k]) => { if (a.flags[k]) $("#jf-" + k).checked = true; }); await D.up(s, {jdd:{ct:{[cid]:{auto:a}}}}); toast("Cláusulas lidas do arquivo"); };
    const x = $("#jc-x"); if (x) x.onclick = () => D.up(s, {jdd:{ct:{[id]:null}}}).then(close);
    $("#fjc").onsubmit = e => { e.preventDefault(); const cp = $("#jc-c").value.trim(); if (!cp){ toast("Informe a contraparte."); return; }
      D.up(s, {jdd:{ct:{[cid]:{tipo:$("#jc-t").value, contraparte:cp, assinatura:$("#jc-a").value, fim:$("#jc-f").value, valor:(num($("#jc-v").value) || 0) * 1e3, relev:$("#jc-r").value, evid:$("#jc-e").value, obs:$("#jc-o").value.trim(), flags:Object.fromEntries(FLAGS.map(([k]) => [k, $("#jf-" + k).checked])), em:nowISO()}}}}).then(() => { close(); toast("Contrato salvo"); }); };
  }
  function formProcesso(s){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Diligência jurídica · processos</div><h2>Novo processo</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fjp" novalidate><div class="form"><div class="fld"><label for="jp-n">Número</label><input id="jp-n"></div><div class="fld"><label for="jp-a">Área</label><select id="jp-a">${PR_AREAS.map(a => `<option>${a}</option>`).join("")}</select></div>
        <div class="fld full"><label for="jp-o">Objeto e parte contrária</label><input id="jp-o"></div><div class="fld"><label for="jp-v">Valor em risco (R$ mil)</label><input id="jp-v" inputmode="decimal"></div>
        <div class="fld"><label for="jp-p">Prognóstico</label><select id="jp-p">${PROG.map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div><div class="fld"><label for="jp-pv">Provisão contábil (R$ mil)</label><input id="jp-pv" inputmode="decimal"></div>
        <div class="fld"><label for="jp-f">Fonte</label><select id="jp-f">${["Relação do advogado da empresa","Certidão de distribuidor","Pesquisa em tribunal","Informado pela administração"].map(x => `<option>${x}</option>`).join("")}</select></div></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar</button></div></form>`);
    $("#fjp").onsubmit = e => { e.preventDefault(); D.up(s, {jdd:{pr:{[uidj()]:{numero:$("#jp-n").value.trim(), area:$("#jp-a").value, objeto:$("#jp-o").value.trim(), valor:(num($("#jp-v").value) || 0) * 1e3, prog:$("#jp-p").value, provisao:(num($("#jp-pv").value) || 0) * 1e3, fonte:$("#jp-f").value, em:nowISO()}}}}).then(() => { close(); toast("Processo registrado"); }); };
  }
  function colarProcessos(s){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Diligência jurídica · processos</div><h2>Colar relação de processos</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fjl" style="display:flex;flex-direction:column;gap:10px" novalidate><p class="sub" style="margin:0">Uma linha por processo: <span class="mono">número ; área ; objeto ; valor (R$) ; prognóstico (provável, possível ou remota)</span></p><textarea id="jl-t" rows="10" aria-label="Relação de processos"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Importar</button></div></form>`);
    $("#fjl").onsubmit = e => { e.preventDefault(); const pr = {}; D.csv($("#jl-t").value).filter(r => r.length >= 4).forEach((r, i) => { const pg = nrm(r[4] || ""), area = PR_AREAS.find(a => nrm(a).slice(0, 5) === nrm(r[1]).slice(0, 5)) || "Cível";
        pr[uidj() + i] = {numero:(r[0] || "").trim(), area, objeto:(r[2] || "").trim(), valor:num(r[3]) || 0, prog:/prov/.test(pg) ? "provavel" : /remot/.test(pg) ? "remota" : "possivel", fonte:"Relação do advogado da empresa", em:nowISO()}; });
      if (!Object.keys(pr).length){ toast("Nenhuma linha válida."); return; } D.up(s, {jdd:{pr}}).then(() => { close(); toast(`${Object.keys(pr).length} processo(s) importado(s)`); }); };
  }

  /* ---------------- RELATÓRIO ---------------- */
  async function relatorio(s, modo = "completo"){
    const Rl = KT_REL, P = KTPdf(), j = s.jdd || {}, q = j.q || {}, C = contratos(s).filter(c => noPeriodo(s, c)), cg = contingencias(s), R = recomendacoes(s), pend = QS.filter(x => !q[x.id]?.v).length;
    const setorTab = () => { if (!window.KT_DDWB) return; const St = KT_DDWB.setor(s), imp = s.jdd?.setor?.riscos || []; P.h2(Rl.T(`Riscos do setor · ${St.nome}`));
      Rl.tab(P, ["Risco", "Base legal", "Situação", "Conclusão"], St.riscos.map(([r, b], i) => { const c = q["set" + (i + 1)] || {}, x = imp.find(z => z.risco === r) || {}; return [r, b, {t:c.v === "sim" ? "Risco identificado" : c.v === "nao" ? "Sem pendência" : c.v === "na" ? "N/A" : "A verificar", b:c.v === "sim", c:c.v === "sim" ? [198, 40, 40] : undefined}, x.conclusao || c.n || ""]; }), [.34, .22, .16, .28]); };
    Rl.capa(P, "Relatório de diligência jurídica" + (pend ? " · versão preliminar" : ""), s.nome, [["Período analisado", `contratos dos últimos ${anos(s)} anos e vigentes`], ["Visão", s.lado === "compra" ? "Kinsey assessora do comprador" : "Kinsey assessora do vendedor"], ["Advogado responsável", j.adv || "a definir"], ["Emitido em", new Date().toLocaleDateString("pt-BR")]]);
    Rl.sec(P, 1, "Sumário e recomendações"); Rl.kpisPdf(P, [["Pontos de risco", String(QS.filter(x => x.risco && q[x.id]?.v === x.risco).length), `${QS.length - pend} de ${QS.length} respostas`], ["Contratos analisados", String(C.length), `${C.filter(c => c.flags.coc).length} com mudança de controle`], ["Contingência provável", mi(cg.provavel), `possível ${mi(cg.possivel)}`]]);
    const G = window.KT_GRAF; if (G && cg.n){ G.rosca(P, "Processos por prognóstico (valor em discussão)", [{l:"Provável", v:cg.provavel, c:G.VERM}, {l:"Possível", v:cg.possivel, c:G.GOLD}, {l:"Remota", v:cg.remota, c:G.VERDE}], v => mi(v, 1), [String(cg.n), "processos"]);
      G.barrasH(P, "Valor em discussão por área", Object.entries(cg.area).map(([a, v]) => ({l:a, v:v.provavel + v.possivel + v.remota, txt:`${mi(v.provavel + v.possivel + v.remota, 1)} · ${v.n} proc.`})), v => mi(v, 1)); }
    if (G){ const resp = QS.filter(x => q[x.id]?.v), risco = QS.filter(x => x.risco && q[x.id]?.v === x.risco).length; G.barrasH(P, "Questionário jurídico", [{l:"Respondidas", v:resp.length, txt:`${resp.length} de ${QS.length}`, c:G.ACC}, {l:"Com ponto de risco", v:risco, txt:String(risco), c:G.VERM}, {l:"Pendentes", v:pend, txt:String(pend), c:G.CINZA}], v => String(v)); }
    P.h2("Recomendações para o contrato"); R.length ? R.forEach((x, i) => Rl.par(P, `${i + 1}. ${x}`, {size:9.5})) : Rl.par(P, "Sem recomendações registradas.");
    if (modo === "resumo") setorTab();
    if (modo === "resumo"){ P.y += 20; P.ensure(50); P.line(P.M, P.y + 20, P.M + 240, P.y + 20, [1,31,75], .6); P.text(P.M, P.y + 32, Rl.T(j.adv || "Advogado responsável (OAB)"), 9, false, [90,101,120]);
      await rptSave(P.out(`Diligência jurídica (resumo) · ${s.nome}`, Rl.T(`Kinsey Capital · Diligência jurídica (resumo) · ${s.nome} · confidencial`)), Rl.arq(s, "diligencia_juridica_resumo", "pdf"), "application/pdf"); return; }
    Rl.sec(P, 2, "Questionário de diligência jurídica"); JQ.forEach(g => { P.h2(Rl.T(g.g)); Rl.tab(P, ["Pergunta", "Resposta", "Observação"], g.items.map(([id, t, rk]) => { const c = q[id] || {}; return [t, {t:{sim:"Sim", nao:"Não", na:"N/A"}[c.v] || "Pendente", b:rk && c.v === rk, c:rk && c.v === rk ? [198,40,40] : undefined}, c.n || ""]; }), [.58, .12, .3]); });
    setorTab();
    Rl.sec(P, 3, `Contratos (últimos ${anos(s)} anos)`); C.length ? Rl.tab(P, ["Contraparte", "Tipo", "Vigência", "Cláusulas críticas"], C.map(c => [c.contraparte, c.tipo, `${c.assinatura || "-"} a ${c.fim || "indet."}`, FLAGS.filter(([k]) => c.flags[k]).map(f => f[1]).join(", ") || "-"]), [.3, .18, .2, .32]) : Rl.par(P, "Nenhum contrato registrado.");
    Rl.sec(P, 4, "Processos e contingências"); Rl.tab(P, ["Área", "Provável", "Possível", "Remota", "Processos"], Object.entries(cg.area).map(([a, v]) => [a, mi(v.provavel), mi(v.possivel), mi(v.remota), String(v.n)]), [.28, .18, .18, .18, .18]);
    processos(s).length && Rl.tab(P, ["Número", "Área", "Objeto", "Valor", "Prognóstico"], processos(s).map(p => [p.numero || "-", p.area, p.objeto || "", mi(+p.valor || 0), (PROG.find(x => x[0] === p.prog) || ["", "-"])[1]]), [.22, .13, .35, .15, .15]);
    P.y += 30; P.ensure(50); P.line(P.M, P.y + 20, P.M + 240, P.y + 20, [1,31,75], .6); P.text(P.M, P.y + 32, Rl.T(j.adv || "Advogado responsável (OAB)"), 9, false, [90,101,120]);
    await rptSave(P.out(`Diligência jurídica · ${s.nome}`, Rl.T(`Kinsey Capital · Diligência jurídica · ${s.nome} · confidencial`)), Rl.arq(s, "diligencia_juridica", "pdf"), "application/pdf");
  }

  /* ---------------- JURÍDICO: painel dos targets ---------------- */
  const _jr = renderJuridico;
  renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return;
    const L = S.suppliers.filter(s => s.nivel === "N3"), el = document.createElement("div"); el.className = "card"; el.id = "jdd-painel"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Jurídico · Kinsey Capital</div><h3>Diligência jurídica dos targets</h3><p class="sub" style="margin:2px 0 0">Questionário inicial, contratos dos últimos 3 a 5 anos, processos e contingências, evidências e relatório.</p></div></div>
      <div class="tbl"><table><thead><tr><th>Target</th><th>Lado</th><th>Respostas</th><th>Contratos</th><th class="dd-num">Provável</th><th></th></tr></thead><tbody>${L.map(s => { const q = s.jdd?.q || {}, cg = contingencias(s);
        return `<tr><td><b>${esc(s.nome)}</b></td><td>${s.lado === "compra" ? "Comprador" : "Vendedor"}</td><td>${QS.filter(x => q[x.id]?.v).length} / ${QS.length}</td><td>${contratos(s).length}</td><td class="dd-num">${mi(cg.provavel)}</td><td style="text-align:right"><button type="button" class="btn sm" data-jab="${s.id}">Abrir</button></td></tr>`; }).join("")}</tbody></table></div>`;
    const ref = $("#ma-jur", host); if (ref) ref.after(el); else host.prepend(el);
    $$("[data-jab]", el).forEach(b => b.onclick = () => { S.jurAlvo = b.dataset.jab; S.jurTab = "dd"; S.jddTab = "quest"; renderJuridico(); }); };

  window.KT_JDD = {html, bind, contingencias, contratos, QS, JQ, lerContrato, recomendacoes, relatorio, noPeriodo};
})();
