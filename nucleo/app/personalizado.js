/* ================= QUESTIONAMENTOS E DOCUMENTOS ADICIONAIS =================
   Além dos itens obrigatórios do sistema, cada cliente pode incluir questionamentos de risco e
   compliance e documentos adicionais, por nível (N1/N2/N3), com o peso na matriz de risco
   (alto, médio ou baixo). Ficam na configuração do cliente ("personalizado"). */
const PERS = (() => {
  const PESO = {alto: 6, medio: 3, baixo: 1}, PESO_TX = {alto: "Alto", medio: "Médio", baixo: "Baixo"};
  const GRUPOS = ["Risco", "Compliance e integridade", "Trabalhista", "Socioambiental", "Fiscal e tributário", "Societário", "Operacional", "Outros"];
  const cfg = () => S.config.personalizado || {};
  const perguntas = nivel => (cfg().perguntas || []).filter(p => p.ativo !== false && (!nivel || (p.niveis || []).includes(nivel)));
  const documentos = nivel => (cfg().documentos || []).filter(p => p.ativo !== false && (!nivel || (p.niveis || []).includes(nivel)));
  const pill = p => `<span class="pill ${p === "alto" ? "r-alto" : p === "medio" ? "r-medio" : "r-baixo"}" style="font-size:10px;padding:1px 7px">${PESO_TX[p] || "Médio"}</span>`;
  const novoId = pre => pre + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ---------- matriz de risco ---------- */
  EXT_RISKS.push((s, add) => {
    const a = s.answers || {}, d = s.docs || {};
    perguntas(s.nivel).forEach(p => { if (a[p.id]?.v && a[p.id].v === p.risco) add(p.grupo || "Questionamento adicional", p.texto.replace(/\?$/, "") + (p.risco === "sim" ? " — SIM" : " — NÃO"), PESO[p.peso] || 3); });
    documentos(s.nivel).forEach(p => { if (d[p.id] === "pend") add("Documentos", `Documento pendente: ${p.texto}`, PESO[p.peso] || 3); });
  });
  EXT_TOUCH.push(s => { const a = s.answers || {}, d = s.docs || {}; return perguntas(s.nivel).some(p => a[p.id]?.v) || documentos(s.nivel).some(p => d[p.id]); });

  /* ---------- aba Questionário: bloco de questionamentos adicionais ---------- */
  EXT_QUEST.push((s, b) => {
    const L = perguntas(s.nivel), a = s.answers || {}, ed = Store.me.canEdit;
    const el = document.createElement("div"); el.className = "qgroup";
    el.innerHTML = `<div class="eyebrow" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><span>Questionamentos adicionais do cliente · ${s.nivel}</span>${ed ? `<button type="button" class="btn sm" data-pers="perguntas">Incluir ou editar questionamentos</button>` : ""}</div>
      ${L.length ? L.map((p, i) => { const cur = a[p.id] || {}, flagged = p.risco && cur.v === p.risco;
        return `<div class="q" data-qx="${p.id}"><span class="qn">A${String(i + 1).padStart(2, "0")}</span><div class="qt">${esc(p.texto)} ${pill(p.peso)} <span class="sub" style="font-size:11.5px">${esc(p.grupo || "")}</span> ${flagged ? `<span class="flag">● RISCO</span>` : ""}${cur.v ? ` <span class="sub" style="font-size:11px">· ${cur.origem === "Portal" ? "respondido pelo fornecedor" : "respondido pela equipe"}</span>` : ""}</div>
          <div class="qa"><div class="seg">${[["sim", "Sim"], ["nao", "Não"], ["na", "N/A"]].map(([v, l]) => `<button type="button" data-v="${v}" class="v-${v} ${p.risco === v ? "risk" : ""}" aria-pressed="${cur.v === v}">${l}</button>`).join("")}</div><input type="text" placeholder="Observação ou evidência" value="${esc(cur.n)}"></div></div>`; }).join("")
      : `<p class="sub" style="margin:4px 0 0">Nenhum questionamento adicional para ${s.nivel}.${ed ? " Use o botão acima para incluir perguntas de risco e compliance, com peso alto, médio ou baixo na matriz." : ""}</p>`}`;
    b.appendChild(el);
    $$("[data-qx]", el).forEach(q => { const id = q.dataset.qx;
      $$("[data-v]", q).forEach(btn => btn.onclick = () => { const v = (s.answers?.[id]?.v === btn.dataset.v) ? "" : btn.dataset.v; save(Store.update("suppliers", s.id, {answers: {[id]: {v, por: Store.me.id || "", em: nowISO()}}})); });
      $("input", q).onchange = e => save(Store.update("suppliers", s.id, {answers: {[id]: {n: e.target.value}}})); });
    $$("[data-pers]", el).forEach(x => x.onclick = () => editor(x.dataset.pers));
  });

  /* ---------- aba Documentos: documentos adicionais ---------- */
  EXT_DOCS.push((s, b) => {
    const L = documentos(s.nivel), d = s.docs || {}, ed = Store.me.canEdit;
    const el = document.createElement("div"); el.className = "qgroup";
    el.innerHTML = `<div class="eyebrow" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><span>Documentos adicionais do cliente · ${s.nivel}</span>${ed ? `<button type="button" class="btn sm" data-pers="documentos">Incluir ou editar documentos</button>` : ""}</div>
      ${L.length ? L.map((p, i) => `<div class="q"><span class="qn">A${String(i + 1).padStart(2, "0")}</span><div class="qt">${esc(p.texto)} ${pill(p.peso)}${d[p.id] === "pend" ? ` <span class="flag">● RISCO</span>` : ""}</div><div class="qa"><div class="seg" data-dx="${p.id}">${[["ok", "Conferido"], ["pend", "Pendente"], ["na", "N/A"]].map(([v, l]) => `<button type="button" data-v="${v}" class="${v === "ok" ? "v-sim" : v === "pend" ? "risk" : "v-na"}" aria-pressed="${d[p.id] === v}">${l}</button>`).join("")}</div></div></div>`).join("")
      : `<p class="sub" style="margin:4px 0 0">Nenhum documento adicional para ${s.nivel}.${ed ? " Use o botão acima para incluir documentos além dos obrigatórios." : ""}</p>`}`;
    const ref = b.querySelector(".qgroup"); if (ref) ref.after(el); else b.appendChild(el);
    $$("[data-dx]", el).forEach(seg => $$("[data-v]", seg).forEach(btn => btn.onclick = () => save(Store.update("suppliers", s.id, {docs: {[seg.dataset.dx]: d[seg.dataset.dx] === btn.dataset.v ? "" : btn.dataset.v}}))));
    $$("[data-pers]", el).forEach(x => x.onclick = () => editor(x.dataset.pers));
  });


  /* ---------- duplicados: texto normalizado e semelhança por palavras ---------- */
  const STOP = new Set("a o as os de da do das dos e em no na nos nas um uma uns umas para por com sem que se ao aos sua seu suas seus ou ja ha foi sao ser esta este essa esse isso pelo pela pelos pelas qual quais tem possui existe empresa fornecedor".split(" "));
  const norm = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  const toks = t => new Set(norm(t).split(" ").filter(w => w.length > 2 && !STOP.has(w)).map(w => w.replace(/(oes|aes|es|s)$/, "")));
  function parecido(a, b){ const na = norm(a), nb = norm(b); if (!na || !nb) return false; if (na === nb) return true;
    const A = toks(a), B = toks(b); if (A.size < 2 || B.size < 2) return false; let i = 0; A.forEach(w => { if (B.has(w)) i++; });
    return i / (A.size + B.size - i) >= .7 || i / Math.min(A.size, B.size) >= .9; }
  const obrigatorios = ehP => { const out = []; ["N1", "N2", "N3"].forEach(n => (ehP ? (Q[n] || []).flatMap(g => g.items.map(it => it[1])) : (DOCS[n] || [])).forEach(t => { if (!out.some(o => o.t === t)) out.push({t, n}); else out.find(o => o.t === t).n += ", " + n; })); return out; };
  /* procura duplicado de um texto entre os obrigatórios e os adicionais (ignorando o próprio índice) */
  function dupDe(texto, lista, ehP, ign){ const ob = obrigatorios(ehP).find(o => parecido(texto, o.t)); if (ob) return {onde: "obrigatório do sistema (" + ob.n + ")", t: ob.t};
    const i = lista.findIndex((x, j) => j !== ign && parecido(texto, x.texto)); return i >= 0 ? {onde: "adicional", t: lista[i].texto, i} : null; }

  /* ---------- importação de planilhas e documentos ---------- */
  async function lerItens(f, ehP, padrao){
    const n = f.name.toLowerCase(), buf = await f.arrayBuffer(); let rows = [];
    if (/\.xlsx$|\.xlsm$/.test(n)) rows = await IMP.lerXLSX(buf); else if (/\.ods$/.test(n)) rows = await IMP.lerODS(buf);
    else if (/\.docx$/.test(n)){ const d = await IMP.lerDOCX(buf); rows = d.tabela && d.tabela.length > 1 ? d.tabela : (d.linhas || []).map(l => [l]); }
    else if (/\.pdf$/.test(n)) rows = (await IMP.lerPDF(buf)).map(r => [r.join(" ")]);
    else if (/\.(xls|doc)$/.test(n)) throw new Error("antigo");
    else { let t = new TextDecoder("utf-8").decode(buf); if (t.includes("\uFFFD")) t = new TextDecoder("latin1").decode(buf);
      const ls = t.split(/\r?\n/).filter(l => l.trim()), sep = ["\t", ";", "|"].map(c => [c, (ls[0] || "").split(c).length]).sort((a, b) => b[1] - a[1])[0];
      rows = ls.map(l => sep[1] > 1 ? l.split(sep[0]).map(x => x.replace(/^"|"$/g, "").trim()) : [l.trim()]); }
    rows = rows.map(r => r.map(c => String(c ?? "").trim())).filter(r => r.some(Boolean));
    const h = (rows[0] || []).map(c => norm(c)), col = re => h.findIndex(c => re.test(c));
    const ci = col(ehP ? /pergunt|question|quest|item|texto|descri/ : /document|item|texto|descri|nome/), cn = col(/nive|level/), cg = col(/tema|grupo|categ|area/), cr = col(/risco quando|resposta|risco se|^risco$/), cp = col(/peso|grav|nivel de risco|criticidade/);
    const head = ci >= 0 && ((rows[0] || []).length > 1 ? (cn >= 0 || cg >= 0 || cr >= 0 || cp >= 0 || /pergunt|question|document/.test(h[ci])) : /^(perguntas?|questionamentos?|documentos?|itens?)$/.test(h[0]));
    const pPeso = v => /alt|high|6/.test(norm(v)) ? "alto" : /baix|low|1/.test(norm(v)) ? "baixo" : /med|3/.test(norm(v)) ? "medio" : "";
    const pNiv = v => { const m = String(v || "").toUpperCase().match(/N\s?[123]/g); return /todos|all|geral/i.test(v) ? ["N1", "N2", "N3"] : m ? [...new Set(m.map(x => x.replace(/\s/g, "")))] : null; };
    const out = [];
    (head ? rows.slice(1) : rows).forEach(r => {
      let t = (head ? r[ci] : r.find(c => c.length > 8) || r[0] || "").replace(/^\s*(\d+[.)\-]|[-•*–])\s*/, "").replace(/\s+/g, " ").trim();
      if (t.length < 8 || (ehP && !head && !/\?$/.test(t) && t.split(" ").length < 6)) return;
      const tag = t.match(/\[(alto|m[ée]dio|baixo)\]/i); if (tag) t = t.replace(tag[0], "").trim();
      const g = head && cg >= 0 ? r[cg] : "", gr = GRUPOS.find(x => norm(x).startsWith(norm(g).slice(0, 6))) || (g ? "Outros" : padrao.grupo);
      out.push({texto: t, niveis: (head && cn >= 0 && pNiv(r[cn])) || padrao.niveis, peso: (tag && pPeso(tag[1])) || (head && cp >= 0 && pPeso(r[cp])) || padrao.peso,
        ...(ehP ? {grupo: gr, risco: head && cr >= 0 ? (/sim|yes/i.test(r[cr]) ? "sim" : /n[aã]o|no/i.test(r[cr]) ? "nao" : padrao.risco) : padrao.risco} : {})}); });
    return out;
  }
  const MODELO = {perguntas: "Pergunta;Níveis;Tema;Risco quando;Peso\nA empresa possui canal de denúncias acessível a terceiros?;N1, N2;Compliance e integridade;Não;Alto\nHouve autuação ambiental nos últimos 5 anos?;Todos;Socioambiental;Sim;Médio\n",
    documentos: "Documento;Níveis;Peso\nCertidão negativa de débitos trabalhistas (CNDT);Todos;Médio\nCódigo de conduta e política anticorrupção;N1;Baixo\n"};

  /* ---------- sugestões automáticas: alertas da própria cadeia + banco de boas práticas ---------- */
  const BANCO = {perguntas: [
    ["Compliance e integridade", "A empresa possui programa de integridade (código de conduta, política anticorrupção e treinamento anual)?", "nao", "medio", ["N1", "N2"]],
    ["Compliance e integridade", "A empresa possui canal de denúncias acessível a empregados e terceiros?", "nao", "medio", ["N1", "N2"]],
    ["Compliance e integridade", "Algum sócio ou administrador é pessoa politicamente exposta (PEP) ou parente de agente público?", "sim", "alto", ["N1", "N2", "N3"]],
    ["Compliance e integridade", "A empresa avalia (due diligence) os próprios fornecedores antes de comprar?", "nao", "medio", ["N1", "N2"]],
    ["Societário", "Houve alteração de sócios ou administradores nos últimos 12 meses?", "sim", "baixo", ["N1", "N2"]],
    ["Societário", "Os sócios têm outras empresas no mesmo ramo que vendem para esta cadeia?", "sim", "medio", ["N1", "N2", "N3"]],
    ["Societário", "O beneficiário final (pessoa física que controla a empresa) está identificado?", "nao", "medio", ["N1", "N2"]],
    ["Trabalhista", "Todos os trabalhadores, inclusive temporários e terceirizados, têm registro formal?", "nao", "alto", ["N1", "N2", "N3"]],
    ["Trabalhista", "Há fornecimento de EPI e controle de jornada para os trabalhadores?", "nao", "medio", ["N2", "N3"]],
    ["Socioambiental", "A empresa monitora desmatamento, embargos e áreas protegidas nas origens do produto?", "nao", "medio", ["N1", "N2"]],
    ["Socioambiental", "Há destinação adequada e documentada de resíduos e efluentes?", "nao", "baixo", ["N1", "N2", "N3"]],
    ["Fiscal e tributário", "Todas as vendas são acompanhadas de nota fiscal?", "nao", "alto", ["N1", "N2", "N3"]],
    ["Fiscal e tributário", "A empresa possui débitos fiscais, trabalhistas ou previdenciários em aberto?", "sim", "medio", ["N1", "N2", "N3"]],
    ["Operacional", "A capacidade de produção ou de armazenagem é compatível com o volume vendido?", "nao", "alto", ["N1", "N2", "N3"]]],
    documentos: [["Certidão negativa federal (Receita e PGFN)", "medio", ["N1", "N2"]], ["Certidão negativa de débitos trabalhistas (CNDT)", "medio", ["N1", "N2", "N3"]], ["Certificado de regularidade do FGTS (CRF)", "medio", ["N1", "N2"]],
      ["Código de conduta e política anticorrupção", "baixo", ["N1", "N2"]], ["Comprovante de conta bancária em nome da empresa", "medio", ["N1", "N2", "N3"]], ["Balanço patrimonial e DRE do último exercício", "baixo", ["N1", "N2"]],
      ["Relação dos principais clientes (para checar dependência da cadeia)", "baixo", ["N1", "N2"]], ["Resumo do eSocial ou relação de empregados registrados", "medio", ["N1", "N2"]]]};
  const GATILHOS = [
    [s => /noteira|sequencial/i.test(s), "Operações comerciais: notas sequenciais", ["Fiscal e tributário", "O fornecedor possui outros clientes além desta cadeia (comprovar com notas de venda a terceiros)?", "nao", "alto", ["N1", "N2", "N3"]], ["Relação de notas fiscais emitidas a outros clientes nos últimos 12 meses", "alto", ["N1", "N2", "N3"]]],
    [s => /Pagamento a terceiro|pessoa física/i.test(s), "Operações comerciais: pagamentos a terceiros", ["Compliance e integridade", "Os pagamentos são feitos exclusivamente em conta bancária de titularidade do emitente da nota?", "nao", "alto", ["N1", "N2", "N3"]], ["Comprovante de conta bancária em nome da empresa", "alto", ["N1", "N2", "N3"]]],
    [s => /espécie/i.test(s), "Operações comerciais: pagamentos em espécie", ["Compliance e integridade", "A empresa realiza compras ou pagamentos em espécie?", "sim", "alto", ["N1", "N2", "N3"]], null],
    [s => /Objeto da nota|CFOP/i.test(s), "Operações comerciais: nota com objeto ou CFOP fora do produto", ["Fiscal e tributário", "Todas as notas emitidas correspondem ao produto efetivamente entregue?", "nao", "alto", ["N1", "N2", "N3"]], null],
    [s => /capacidade|Volume vendido|Volume faturado/i.test(s), "Volume acima da capacidade", ["Operacional", "A capacidade de produção ou de armazenagem é compatível com o volume vendido?", "nao", "alto", ["N1", "N2", "N3"]], ["Comprovação da capacidade produtiva (área, rebanho, estoque ou equipamentos)", "alto", ["N1", "N2", "N3"]]],
    [s => /CNAE|objeto social/i.test(s), "Atividade (CNAE / objeto social) sem o produto", ["Societário", "A atividade registrada (CNAE e objeto social) inclui o produto negociado?", "nao", "medio", ["N1", "N2"]], ["Contrato social consolidado e cartão CNPJ atualizados", "medio", ["N1", "N2"]]],
    [s => /Listas restritivas|Cadastro de Empregadores|CEIS|CNEP|embargad/i.test(s), "Ocorrência em listas restritivas", ["Compliance e integridade", "Algum sócio, administrador ou fornecedor já constou em listas restritivas (MTE, CEIS, CNEP, IBAMA)?", "sim", "alto", ["N1", "N2", "N3"]], null],
    [s => /Certidão POSITIVA|vencida/i.test(s), "Certidões positivas ou vencidas", ["Fiscal e tributário", "A empresa possui débitos fiscais, trabalhistas ou previdenciários em aberto?", "sim", "medio", ["N1", "N2", "N3"]], ["Certidões negativas atualizadas (federal, estadual, municipal, CNDT e FGTS)", "medio", ["N1", "N2", "N3"]]]];
  function sugestoes(ehP, lista){
    const txt = new Map(); S.suppliers.forEach(s => riskOf(s).reasons.forEach(r => { const k = r.crit + " " + r.txt; txt.set(k, (txt.get(k) || 0) + 1); }));
    const all = [...txt.keys()].join("\n"), out = [];
    GATILHOS.forEach(([f, motivo, q, d]) => { const it = ehP ? q : d; if (!it || !f(all)) return; const n = [...txt.keys()].filter(k => f(k)).length; out.push({motivo: `${motivo} (${n} ocorrência(s) na cadeia)`, it, auto: true}); });
    BANCO[ehP ? "perguntas" : "documentos"].forEach(it => out.push({motivo: "Banco de boas práticas", it, auto: false}));
    const vis = []; out.forEach(o => { const texto = ehP ? o.it[1] : o.it[0]; if (vis.some(v => parecido(v.texto, texto))) return;
      vis.push({...o, texto, dup: dupDe(texto, lista, ehP, -1), item: ehP ? {texto, grupo: o.it[0], risco: o.it[2], peso: o.it[3], niveis: o.it[4]} : {texto, peso: o.it[1], niveis: o.it[2]}}); });
    return vis;
  }

  /* ---------- editor (administrador e editores) ---------- */
  function editor(tipo){
    if (!Store.me.canEdit){ toast("Só administradores e editores incluem itens adicionais."); return; }
    tipo = tipo || "perguntas";
    const ehP = tipo === "perguntas", lista = JSON.parse(JSON.stringify(cfg()[tipo] || []));
    const base = ["N1", "N2", "N3"].map(n => `${n}: ${ehP ? (Q[n] || []).flatMap(g => g.items).length : (DOCS[n] || []).length}`).join(" · ");
    const linha = (p, i) => `<div class="card" data-li="${i}" style="display:flex;flex-direction:column;gap:8px;padding:12px;${p.ativo === false ? "opacity:.55" : ""}">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b style="font-size:13.5px">${esc(p.texto)}</b><span style="display:flex;gap:6px;flex-shrink:0">${pill(p.peso)}</span></div>
      <div class="sub" style="margin:0;font-size:12.5px">${(p.niveis || []).join(", ")}${ehP ? ` · ${esc(p.grupo || "")} · risco quando a resposta é <b>${p.risco === "sim" ? "SIM" : "NÃO"}</b>` : " · risco quando marcado como Pendente"}${p.ativo === false ? " · <b>desativado</b>" : ""}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-ed="${i}">Editar</button><button type="button" class="btn sm" data-at="${i}">${p.ativo === false ? "Reativar" : "Desativar"}</button><button type="button" class="btn sm bad" data-del="${i}">Excluir</button></div></div>`;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Personalização do cliente · ${esc(CLI().nome)}</div><h2>${ehP ? "Questionamentos adicionais" : "Documentos adicionais"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm ${ehP ? "primary" : ""}" data-tp="perguntas">Questionamentos</button><button type="button" class="btn sm ${ehP ? "" : "primary"}" data-tp="documentos">Documentos</button></div>
        <div class="banner">Itens obrigatórios do sistema (${base}) continuam valendo. Os adicionais entram no ${ehP ? "Questionário" : "checklist de Documentos"} do nível escolhido e somam na matriz: <b>Alto</b> = 6 pontos (leva o fornecedor a alto risco), <b>Médio</b> = 3, <b>Baixo</b> = 1.</div>
        <form id="pf" class="card" style="display:flex;flex-direction:column;gap:10px" novalidate>
          <h3 id="pf-t">${ehP ? "Novo questionamento" : "Novo documento"}</h3>
          <div class="fld"><label for="pf-tx">${ehP ? "Pergunta" : "Documento"}</label><textarea id="pf-tx" rows="2" placeholder="${ehP ? "Ex.: A empresa possui canal de denúncias acessível a terceiros?" : "Ex.: Certidão negativa de débitos trabalhistas (CNDT)"}"></textarea></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px">
            <div class="fld"><label>Níveis</label><div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:6px">${["N1", "N2", "N3"].map(n => `<label class="check"><input type="checkbox" data-nv="${n}" checked> ${n} · ${LV_NOME[n]}</label>`).join("")}</div></div>
            ${ehP ? `<div class="fld"><label for="pf-g">Tema</label><select id="pf-g">${GRUPOS.map(g => `<option>${g}</option>`).join("")}</select></div>
            <div class="fld"><label for="pf-r">É risco quando a resposta for</label><select id="pf-r"><option value="nao">Não</option><option value="sim">Sim</option></select></div>` : ""}
            <div class="fld"><label for="pf-p">Peso na matriz de risco</label><select id="pf-p"><option value="alto">Alto (6 pontos)</option><option value="medio" selected>Médio (3 pontos)</option><option value="baixo">Baixo (1 ponto)</option></select></div>
          </div>
          <p class="err" id="pf-e" hidden></p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" class="btn primary" id="pf-ok">Incluir</button><button type="button" class="btn ghost" id="pf-cn" hidden>Cancelar edição</button></div>
        </form>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Incluir vários de uma vez</h3>
          <p class="sub" style="margin:0">Importe de Excel, Word, CSV, TXT ou PDF (uma ${ehP ? "pergunta" : "linha"} por linha, ou planilha com as colunas ${ehP ? "Pergunta, Níveis, Tema, Risco quando e Peso" : "Documento, Níveis e Peso"}). O que faltar na planilha usa as escolhas do formulário acima. Ou veja as sugestões automáticas, feitas a partir dos alertas da cadeia e de boas práticas.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn sm primary" style="cursor:pointer">Importar Excel, Word ou texto<input type="file" id="pf-imp" accept=".xlsx,.xlsm,.ods,.docx,.csv,.txt,.pdf" hidden></label><button type="button" class="btn sm" id="pf-sug">Sugestões automáticas</button><button type="button" class="btn sm ghost" id="pf-mod">Baixar planilha modelo</button></div>
          <div id="pf-lote"></div></div>
        <div id="pf-l" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>`);
    let editIdx = -1;
    const grava = async msg => { const c = {...cfg()}; delete c.id; c[tipo] = lista; c.atualizadoEm = nowISO(); c.por = Store.me.id || "";
      try{ await Store.set("config", "personalizado", c);
        /* cópia para o Portal do Fornecedor: só texto, níveis e tema (sem peso e sem a resposta considerada risco) */
        await Store.set("config", "portal", {perguntas: (c.perguntas || []).filter(x => x.ativo !== false).map(x => ({id: x.id, texto: x.texto, niveis: x.niveis, grupo: x.grupo || ""})),
          documentos: (c.documentos || []).filter(x => x.ativo !== false).map(x => ({id: x.id, texto: x.texto, niveis: x.niveis})), atualizadoEm: nowISO()}).catch(() => {});
        toast(msg); }catch(e){ toast("Não foi possível salvar. Verifique seu nível de acesso."); } desenha(); };
    const limpa = () => { editIdx = -1; $("#pf-tx").value = ""; $$("[data-nv]").forEach(c => c.checked = true); $("#pf-p").value = "medio"; if (ehP){ $("#pf-g").value = GRUPOS[0]; $("#pf-r").value = "nao"; }
      $("#pf-t").textContent = ehP ? "Novo questionamento" : "Novo documento"; $("#pf-ok").textContent = "Incluir"; $("#pf-cn").hidden = true; };
    function desenha(){
      const l = $("#pf-l"); if (!l) return;
      const dups = []; lista.forEach((x, i) => { const ob = obrigatorios(ehP).find(o => parecido(x.texto, o.t)); if (ob) dups.push({i, com: "o obrigatório do sistema “" + ob.t + "” (" + ob.n + ")"});
        else { const j = lista.findIndex((y, k) => k < i && parecido(x.texto, y.texto)); if (j >= 0) dups.push({i, com: "o adicional “" + lista[j].texto + "”"}); } });
      l.innerHTML = (dups.length ? `<div class="card" style="display:flex;flex-direction:column;gap:8px;border-color:var(--warn)"><h3>Possíveis duplicados (${dups.length})</h3><p class="sub" style="margin:0">Itens iguais ou muito parecidos contam duas vezes na matriz de risco. Confira e exclua o repetido.</p>
          ${dups.map(d => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:8px"><div style="font-size:13px;min-width:0"><b>${esc(lista[d.i].texto)}</b><div class="sub" style="margin:2px 0 0;font-size:12px">parecido com ${esc(d.com)}</div></div><button type="button" class="btn sm bad" data-del="${d.i}">Excluir este</button></div>`).join("")}</div>` : "")
        + (lista.length ? `<div class="eyebrow">${lista.length} ${ehP ? "questionamento(s)" : "documento(s)"} adicional(is)</div>` + lista.map(linha).join("") : `<div class="empty">Nenhum item adicional ainda.</div>`);
      $$("[data-ed]", l).forEach(x => x.onclick = () => { const p = lista[+x.dataset.ed]; editIdx = +x.dataset.ed; $("#pf-tx").value = p.texto; $$("[data-nv]").forEach(c => c.checked = (p.niveis || []).includes(c.dataset.nv)); $("#pf-p").value = p.peso || "medio";
        if (ehP){ $("#pf-g").value = p.grupo || GRUPOS[0]; $("#pf-r").value = p.risco || "nao"; } $("#pf-t").textContent = "Editar item"; $("#pf-ok").textContent = "Salvar alteração"; $("#pf-cn").hidden = false; $("#pf-tx").focus(); });
      $$("[data-at]", l).forEach(x => x.onclick = () => { const p = lista[+x.dataset.at]; p.ativo = p.ativo === false; grava(p.ativo ? "Item reativado" : "Item desativado"); });
      $$("[data-del]", l).forEach(x => x.onclick = () => { const i = +x.dataset.del;
        IMP.confirma(`<b>Excluir “${esc(lista[i].texto)}”?</b><p class="sub" style="margin:6px 0 0">As respostas já dadas deixam de contar na matriz de risco. Se quiser apenas suspender, use Desativar.</p>`, "Excluir", "", () => { lista.splice(i, 1); grava("Item excluído"); }, true); });
    }
    $$("[data-tp]").forEach(x => x.onclick = () => { if (x.dataset.tp !== tipo){ close(); editor(x.dataset.tp); } });
    $("#pf-cn").onclick = limpa;
    $("#pf").onsubmit = e => { e.preventDefault();
      const texto = $("#pf-tx").value.trim().replace(/\s+/g, " "), niveis = $$("[data-nv]").filter(c => c.checked).map(c => c.dataset.nv);
      if (texto.length < 5 || !niveis.length){ $("#pf-e").textContent = "Escreva o item e escolha pelo menos um nível."; $("#pf-e").hidden = false; return; } $("#pf-e").hidden = true;
      const p = {texto, niveis, peso: $("#pf-p").value, ...(ehP ? {grupo: $("#pf-g").value, risco: $("#pf-r").value} : {})};
      if (editIdx >= 0){ lista[editIdx] = {...lista[editIdx], ...p, editadoEm: nowISO()}; grava("Item alterado"); }
      else { const d = dupDe(texto, lista, ehP, -1), inclui = () => { lista.push({id: novoId(ehP ? "cq_" : "cd_"), ...p, ativo: true, criadoEm: nowISO(), criadoPor: Store.me.id || ""}); grava("Item incluído"); limpa(); };
        if (d){ IMP.confirma(`<b>Já existe um item parecido</b><p class="sub" style="margin:6px 0 0">“${esc(d.t)}” · ${esc(d.onde)}.</p><p class="sub" style="margin:6px 0 0">Itens duplicados contam duas vezes na matriz de risco. Incluir mesmo assim?</p>`, "Incluir mesmo assim", "", inclui); return; }
        inclui(); return; }
      limpa(); };
    /* importação e sugestões: pré-visualização com aviso de duplicados */
    const padrao = () => ({niveis: $$("[data-nv]").filter(c => c.checked).map(c => c.dataset.nv), peso: $("#pf-p").value, ...(ehP ? {grupo: $("#pf-g").value, risco: $("#pf-r").value} : {})});
    function lote(itens, titulo){
      const box = $("#pf-lote"); const ja = [];
      const L = itens.map(it => { const d = dupDe(it.texto, lista, ehP, -1) || (ja.some(t => parecido(t, it.texto)) ? {onde: "repetido no próprio arquivo", t: ""} : null); ja.push(it.texto); return {...it, dup: d}; });
      box.innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;margin-top:6px"><div class="result" style="font-size:13px"><b>${titulo}</b>: ${L.length} item(ns) · ${L.filter(x => x.dup).length} duplicado(s) desmarcado(s)</div>
        <div class="tbl" style="max-height:320px;overflow:auto"><table><thead><tr><th></th><th>${ehP ? "Pergunta" : "Documento"}</th><th>Níveis</th>${ehP ? "<th>Risco se</th>" : ""}<th>Peso</th><th>Situação</th></tr></thead><tbody>
        ${L.map((x, i) => `<tr><td><input type="checkbox" data-li2="${i}" ${x.dup ? "" : "checked"}></td><td style="min-width:220px">${esc(x.texto)}${x.motivo ? `<div class="sub" style="margin:2px 0 0;font-size:11.5px">${esc(x.motivo)}</div>` : ""}</td><td>${(x.niveis || []).join(", ")}</td>${ehP ? `<td>${x.risco === "sim" ? "Sim" : "Não"}</td>` : ""}<td>${pill(x.peso)}</td>
          <td style="font-size:12px">${x.dup ? `<span style="color:var(--warn)">Duplicado</span>: ${esc(x.dup.t ? "parecido com “" + x.dup.t.slice(0, 70) + "” (" + x.dup.onde + ")" : x.dup.onde)}` : `<span style="color:var(--ok)">Novo</span>`}</td></tr>`).join("")}</tbody></table></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="pf-lote-ok">Incluir selecionados</button><button type="button" class="btn sm ghost" id="pf-lote-x">Cancelar</button></div></div>`;
      $("#pf-lote-x").onclick = () => box.innerHTML = "";
      $("#pf-lote-ok").onclick = () => { const sel = L.filter((x, i) => $(`[data-li2="${i}"]`).checked); if (!sel.length){ toast("Nenhum item selecionado"); return; }
        IMP.confirma(`<b>Incluir ${sel.length} item(ns)?</b>${sel.some(x => x.dup) ? `<p class="sub" style="margin:6px 0 0">${sel.filter(x => x.dup).length} marcado(s) como duplicado(s) serão incluídos mesmo assim.</p>` : ""}`, "Incluir", "", () => {
          sel.forEach(x => { const {dup, motivo, ...it} = x; lista.push({id: novoId(ehP ? "cq_" : "cd_"), ...it, ativo: true, origem: titulo, criadoEm: nowISO(), criadoPor: Store.me.id || ""}); }); box.innerHTML = ""; grava(`${sel.length} item(ns) incluído(s)`); }); };
    }
    $("#pf-imp").onchange = async ev => { const f = ev.target.files[0]; ev.target.value = ""; if (!f) return;
      try{ const its = await lerItens(f, ehP, padrao()); if (!its.length){ toast("Nenhum item reconhecido no arquivo"); return; } lote(its, "Importado de " + f.name); }
      catch(x){ toast(x?.message === "antigo" ? "Salve o arquivo como .xlsx ou .docx" : "Não foi possível ler o arquivo"); } };
    $("#pf-sug").onclick = () => { const L = sugestoes(ehP, lista); lote(L.map(x => ({...x.item, motivo: x.motivo})).sort((a, b) => (b.motivo.startsWith("Banco") ? 0 : 1) - (a.motivo.startsWith("Banco") ? 0 : 1)), "Sugestões automáticas"); };
    $("#pf-mod").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\uFEFF" + MODELO[tipo]], {type: "text/csv;charset=utf-8"})); a.download = ehP ? "modelo_questionamentos.csv" : "modelo_documentos.csv"; a.click(); };
    desenha();
  }

  /* ---------- Auditoria: atalho ---------- */
  EXT_AUD.push(() => {
    const host = $("#auditoria"); if (!host) return;
    const nP = (cfg().perguntas || []).filter(p => p.ativo !== false).length, nD = (cfg().documentos || []).filter(p => p.ativo !== false).length;
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap";
    el.innerHTML = `<div><h3>Questionamentos e documentos adicionais</h3><p class="sub" style="margin:4px 0 0">${nP} questionamento(s) e ${nD} documento(s) adicionais do cliente, além dos obrigatórios. Cada item tem peso alto, médio ou baixo na matriz de risco.</p></div>
      ${Store.me.canEdit ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-pers="perguntas">Questionamentos</button><button type="button" class="btn sm" data-pers="documentos">Documentos</button></div>` : ""}`;
    host.appendChild(el); $$("[data-pers]", el).forEach(x => x.onclick = () => editor(x.dataset.pers));
  });

  /* recomendações no relatório */
  RPT_REC.unshift([/Documento pendente/, "Obter o documento pendente em prazo definido; sem o documento, manter o fornecedor sob monitoramento reforçado.", "Política de due diligence do cliente; NBC TO 3000"]);
  return {editor, perguntas, documentos};
})();
