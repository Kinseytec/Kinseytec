/* ================= PAINÉIS VISUAIS E ENVIO DE QUESTIONÁRIOS =================
   Auditoria: visão por mini globos (N1, N2, N3, cor do risco); a análise técnica completa fica recolhida e abre ao clicar.
   Jurídico: fornecedores por prioridade (alto, médio, baixo, em avaliação) e nível, com as pendências jurídicas de cada um.
   Questionários: convite ao Portal do Fornecedor (e-mail, WhatsApp, link), cadastro pré-preenchido e acompanhamento. */
const PAINEL = (() => {
  const ORD = {alto: 0, medio: 1, baixo: 2, pend: 3}, NV_ICO = {N1: "◆", N2: "■", N3: "●"};
  if (!document.getElementById("kt-painel-css")){ const st = document.createElement("style"); st.id = "kt-painel-css";
    st.textContent = `.mg-cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.mg-col{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:10px;min-width:0}
.mg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.mg-tile{display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.03);border:1px solid var(--line);border-radius:12px;padding:8px;cursor:pointer;text-align:left;color:inherit;font:inherit;min-width:0}
.mg-tile:hover,.mg-tile:focus-visible{border-color:var(--glow);background:rgba(127,184,230,.08)}.mg-tile svg{flex-shrink:0}.mg-name{font-size:12.5px;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--fog)}
.mg-meta{font-size:11px;color:var(--muted);margin-top:2px}.mg-chips{display:flex;gap:6px;flex-wrap:wrap}.mg-chip{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:20px;padding:5px 11px;font-size:12.5px;background:none;color:inherit;cursor:pointer;font:inherit}
.mg-chip[aria-pressed=true]{border-color:var(--glow);background:rgba(127,184,230,.12)}.mg-badge{min-width:18px;height:18px;border-radius:9px;background:var(--warn);color:#1b1300;font-size:10.5px;font-weight:700;display:inline-grid;place-items:center;padding:0 5px}
.mg-row{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--line);padding-top:10px}.mg-row h3{display:flex;align-items:center;gap:8px;font-size:15px}`;
    document.head.appendChild(st); }

  /* mini globo: esfera na cor do risco, com o ponto do fornecedor numa projeção ortográfica centrada no Brasil */
  let gid = 0;
  function miniGlobo(s, nivel, size = 44){
    const col = RCOL[nivel] || RCOL.pend, R = size / 2 - 3, c = size / 2, id = "mg" + (++gid);
    let dot = "";
    if (s.lat != null && s.lng != null){ const r = Math.PI / 180, l0 = -54 * r, p0 = -14 * r, la = s.lng * r, ph = s.lat * r;
      const x = R * Math.cos(ph) * Math.sin(la - l0), y = R * (Math.cos(p0) * Math.sin(ph) - Math.sin(p0) * Math.cos(ph) * Math.cos(la - l0));
      dot = `<circle cx="${(c + x).toFixed(1)}" cy="${(c - y).toFixed(1)}" r="3.2" fill="#fff" stroke="#011F4B" stroke-width="1.2"/>`; }
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset="1" stop-color="${col}" stop-opacity=".28"/></radialGradient></defs>
      <circle cx="${c}" cy="${c}" r="${R}" fill="url(#${id})" stroke="${col}" stroke-width="1.4"/><ellipse cx="${c}" cy="${c}" rx="${R * .42}" ry="${R}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".8"/>
      <ellipse cx="${c}" cy="${c}" rx="${R}" ry="${R * .36}" fill="none" stroke="rgba(255,255,255,.3)" stroke-width=".8"/><line x1="${c - R}" y1="${c}" x2="${c + R}" y2="${c}" stroke="rgba(255,255,255,.25)" stroke-width=".6"/>${dot}</svg>`;
  }
  const lista = () => S.suppliers.map(s => ({s, r: riskOf(s)})).sort((a, b) => ORD[a.r.level] - ORD[b.r.level] || b.r.score - a.r.score || (a.s.nome || "").localeCompare(b.s.nome || ""));

  /* =========================================================== AUDITORIA */
  S.mgRisk = S.mgRisk || "todos"; S.mgMais = S.mgMais || {};
  function painelAuditoria(host){
    const L = lista(), cont = {alto: 0, medio: 0, baixo: 0, pend: 0}; L.forEach(x => cont[x.r.level]++);
    const vis = L.filter(x => S.mgRisk === "todos" || x.r.level === S.mgRisk);
    const q = statusQuest();
    const el = document.createElement("div"); el.style.cssText = "display:flex;flex-direction:column;gap:14px"; el.id = "mg-aud";
    el.innerHTML = `<div class="head"><div><div class="eyebrow">Visão geral da cadeia · clique num fornecedor para a análise técnica</div><h2>${L.length} fornecedor(es) avaliado(s)</h2></div>
        ${Store.me.canWrite ? `<button type="button" class="btn sm primary" id="mg-env">Enviar questionários</button>` : ""}</div>
      <div class="mg-chips">${[["todos", "Todos", L.length, "#7FB8E6"], ["alto", "Alto risco", cont.alto, RCOL.alto], ["medio", "Médio risco", cont.medio, RCOL.medio], ["baixo", "Baixo risco", cont.baixo, RCOL.baixo], ["pend", "Em avaliação", cont.pend, RCOL.pend]].map(([k, l, n, c]) =>
        `<button type="button" class="mg-chip" data-mgr="${k}" aria-pressed="${S.mgRisk === k}"><svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="${c}"/></svg>${l} <b>${n}</b></button>`).join("")}</div>
      <div class="mg-cols">${["N1", "N2", "N3"].map(nv => { const C = vis.filter(x => x.s.nivel === nv), lim = S.mgMais[nv] ? 500 : 24;
        return `<div class="mg-col"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><h3>${NV_ICO[nv]} ${nv} · ${esc(LV_NOME[nv])}</h3><span class="sub" style="margin:0">${C.length} · <b style="color:${RCOL.alto}">${C.filter(x => x.r.level === "alto").length} alto</b></span></div>
          ${C.length ? `<div class="mg-grid">${C.slice(0, lim).map(({s, r}) => { const ac = answersCount(s);
            return `<button type="button" class="mg-tile" data-mg="${s.id}" title="${esc(s.nome)} · ${RISK_LABEL[r.level]} · pontuação ${r.score}">${miniGlobo(s, r.level)}<div style="min-width:0"><div class="mg-name">${esc(s.nome)}</div><div class="mg-meta">${esc(s.uf || "—")} · ${r.score} pts · quest. ${ac.done}/${ac.total}</div></div></button>`; }).join("")}</div>
            ${C.length > lim ? `<button type="button" class="btn sm ghost" data-mgm="${nv}">Ver todos (${C.length})</button>` : ""}` : `<p class="sub" style="margin:0">Nenhum fornecedor ${S.mgRisk === "todos" ? "neste nível" : "com este risco"}.</p>`}</div>`; }).join("")}</div>
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h3>Questionários aos fornecedores</h3><p class="sub" style="margin:4px 0 0">${q.respondidos} respondido(s) pelo Portal · ${q.convidados} convidado(s) aguardando · ${q.sem} sem convite. A equipe de auditoria e o jurídico também podem responder no dossiê, com base nos documentos recebidos.</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${Store.me.canEdit && typeof PERS !== "undefined" ? `<button type="button" class="btn sm" data-pers="perguntas">Questionamentos adicionais</button><button type="button" class="btn sm" data-pers="documentos">Documentos adicionais</button>` : ""}${Store.me.canWrite ? `<button type="button" class="btn sm" id="mg-env2">Enviar ou reenviar</button>` : ""}</div></div>`;
    host.prepend(el);
    $$("[data-mg]", el).forEach(b => b.onclick = () => openSupplier(b.dataset.mg, "risco"));
    $$("[data-mgr]", el).forEach(b => b.onclick = () => { S.mgRisk = b.dataset.mgr; renderAuditoria(); });
    $$("[data-mgm]", el).forEach(b => b.onclick = () => { S.mgMais[b.dataset.mgm] = true; renderAuditoria(); });
    $$("[data-pers]", el).forEach(b => b.onclick = () => PERS.editor(b.dataset.pers));
    ["#mg-env", "#mg-env2"].forEach(id => { const b = $(id, el); if (b) b.onclick = () => envio(); });
  }
  /* reorganiza a Auditoria: painel visual em cima; relatório; análise técnica completa recolhida */
  const _aud = renderAuditoria;
  renderAuditoria = function(){
    _aud.apply(this, arguments); if (S.audSub === "ops") return;
    const host = $("#auditoria"); if (!host) return; const tabs = host.firstElementChild;
    const det = document.createElement("details"); det.className = "card"; det.id = "aud-tec"; det.open = !!S.audTec;
    det.innerHTML = `<summary><h3>Análise técnica completa</h3><span class="sub" style="margin:0 0 0 8px">tabelas de risco, alertas, testes substantivos, inspeções, órgãos públicos, questionários e critérios</span></summary><div id="aud-tecb" style="display:flex;flex-direction:column;gap:16px;margin-top:14px"></div>`;
    det.addEventListener("toggle", () => { S.audTec = det.open; });
    const rpt = host.querySelector("#rpt"), rptCardEl = rpt ? (rpt.closest(".card") || rpt) : null;
    const corpo = det.querySelector("#aud-tecb");
    [...host.children].forEach(ch => { if (ch !== tabs && ch !== rptCardEl) corpo.appendChild(ch); });
    host.appendChild(det); if (rptCardEl) host.insertBefore(rptCardEl, det);
    painelAuditoria(host); if (tabs) host.prepend(tabs);
  };

  /* =========================================================== JURÍDICO */
  S.jurLv = S.jurLv || "todos";
  function pendJur(s){
    const ct = S.contracts.filter(k => k.supplierId === s.id), ctp = ct.filter(k => !S.pareceres[k.id]);
    const dc = S.evidences.filter(e => e.supplierId === s.id && e.analise?.extraido && e.analise.extraido.tipo !== "nota" && !/nota fiscal/i.test(e.tipo || "")), dcp = dc.filter(e => !e.parecerDoc);
    const nda = s.nda?.aceito ? (s.nda.validado ? "validado" : "validar") : "sem";
    return {ct, ctp, dc, dcp, nda, n: ctp.length + dcp.length + (nda === "validar" ? 1 : 0)};
  }
  function painelJuridico(host){
    const L = lista().filter(x => S.jurLv === "todos" || x.s.nivel === S.jurLv).map(x => ({...x, p: pendJur(x.s)}));
    const G = [["alto", "Prioridade 1 · Alto risco", "analisar primeiro"], ["medio", "Prioridade 2 · Médio risco", ""], ["baixo", "Prioridade 3 · Baixo risco", ""], ["pend", "Em avaliação", "ainda sem dados suficientes"]];
    const tot = L.reduce((t, x) => t + x.p.n, 0);
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:12px"; el.id = "mg-jur";
    el.innerHTML = `<div class="head"><div><div class="eyebrow">Fila do Jurídico por prioridade · clique no fornecedor</div><h3>${tot} pendência(s) jurídica(s): contratos, documentos e NDA</h3></div>
        <div class="mg-chips">${["todos", "N1", "N2", "N3"].map(k => `<button type="button" class="mg-chip" data-jlv="${k}" aria-pressed="${S.jurLv === k}">${k === "todos" ? "Todos os níveis" : NV_ICO[k] + " " + k + " · " + esc(LV_NOME[k])}</button>`).join("")}</div></div>
      ${G.map(([lv, tit, sub]) => { const C = L.filter(x => x.r.level === lv).sort((a, b) => b.p.n - a.p.n || b.r.score - a.r.score); if (!C.length) return "";
        return `<div class="mg-row"><h3><svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="${RCOL[lv]}"/></svg>${tit} <span class="sub" style="margin:0;font-weight:400">${C.length} fornecedor(es)${sub ? " · " + sub : ""} · ${C.reduce((t, x) => t + x.p.n, 0)} pendência(s)</span></h3>
          <div class="mg-grid">${C.slice(0, 60).map(({s, r, p}) => `<button type="button" class="mg-tile" data-jt="${s.id}" title="${esc(s.nome)}"><span style="font-size:20px;color:${RCOL[r.level]};width:26px;text-align:center">${NV_ICO[s.nivel]}</span>
            <div style="min-width:0;flex:1"><div class="mg-name">${esc(s.nome)}</div><div class="mg-meta">${s.nivel} · ${p.ct.length} contr. · ${p.dc.length} doc. · NDA ${p.nda === "validado" ? "ok" : p.nda === "validar" ? "a validar" : "pendente"}</div></div>${p.n ? `<span class="mg-badge" title="pendências">${p.n}</span>` : ""}</button>`).join("")}</div>${C.length > 60 ? `<p class="sub" style="margin:0">e mais ${C.length - 60}. Use o filtro de nível.</p>` : ""}</div>`; }).join("") || `<p class="sub" style="margin:0">Nenhum fornecedor neste nível.</p>`}`;
    const head = host.querySelector(".head"); if (head) head.after(el); else host.prepend(el);
    $$("[data-jlv]", el).forEach(b => b.onclick = () => { S.jurLv = b.dataset.jlv; renderJuridico(); });
    $$("[data-jt]", el).forEach(b => b.onclick = () => juridicoFornecedor(b.dataset.jt));
  }
  function juridicoFornecedor(id){
    const s = supById(id); if (!s) return; const r = riskOf(s), p = pendJur(s), ST = {aprovado: "Aprovado", ressalvas: "Com ressalvas", reprovado: "Reprovado"};
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${s.nivel} · ${esc(LV_NOME[s.nivel])} · Jurídico</div><h2>${esc(s.nome)} ${riskPill(r)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Contratos (${p.ct.length})</h3>${p.ct.length ? p.ct.map(k => `<button type="button" class="btn ghost" style="justify-content:space-between;text-align:left" data-jc="${k.id}"><span>${esc(k.tipo || "Contrato")} ${k.numero ? "nº " + esc(k.numero) : ""} → ${esc(k.contraparte || "—")}</span><b>${S.pareceres[k.id] ? ST[S.pareceres[k.id].status] : "Sem parecer"}</b></button>`).join("") : `<p class="sub" style="margin:0">Nenhum contrato enviado.</p>`}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Documentos societários e cadastrais (${p.dc.length})</h3>${p.dc.length ? p.dc.map(e => { const A = typeof DOCAN !== "undefined" ? DOCAN.achados(e, s) : [], alto = A.filter(a => a.sev === "alto").length;
          return `<button type="button" class="btn ghost" style="justify-content:space-between;text-align:left" data-jd="${e.id}"><span>${esc(e.analise.extraido.rotulo || e.tipo)}${alto ? ` · <b style="color:var(--bad)">${alto} ponto(s) alto(s)</b>` : ""}</span><b>${e.parecerDoc ? ST[e.parecerDoc.status] : "Aguardando parecer"}</b></button>`; }).join("") : `<p class="sub" style="margin:0">Nenhum documento lido ainda.</p>`}</div>
        <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><h3>NDA e termo LGPD</h3><p class="sub" style="margin:4px 0 0">${p.nda === "validado" ? "Aceito e validado pelo Jurídico." : p.nda === "validar" ? `Aceito por ${esc(s.nda.nome || "—")} em ${dt(s.nda.em)}: aguardando validação.` : "Sem aceite do fornecedor."}</p></div><button type="button" class="btn sm" id="jf-nda">Abrir NDA / LGPD</button></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="jf-ct">+ Enviar contrato</button><button type="button" class="btn sm" id="jf-dos">Abrir dossiê completo</button></div></div>`);
    $$("[data-jc]").forEach(b => b.onclick = () => { close(); openContract(b.dataset.jc); });
    $$("[data-jd]").forEach(b => b.onclick = () => { close(); DOCAN.parecer(b.dataset.jd); });
    $("#jf-nda").onclick = () => { close(); openSupplier(s.id, "lgpd"); };
    $("#jf-dos").onclick = () => { close(); openSupplier(s.id, "risco"); };
    $("#jf-ct").onclick = () => { close(); openContractForm(s.id); };
  }
  /* reorganiza o Jurídico: fila por prioridade em cima; listas completas recolhidas */
  const _jur = renderJuridico;
  renderJuridico = function(){
    _jur.apply(this, arguments); const host = $("#juridico"); if (!host) return;
    const head = host.querySelector(".head"), det = document.createElement("details"); det.className = "card"; det.open = !!S.jurDet;
    det.innerHTML = `<summary><h3>Listas completas</h3><span class="sub" style="margin:0 0 0 8px">pré-análise de documentos, contratos por situação, matriz das cláusulas, NDA e cotação</span></summary><div id="jur-listb" style="display:flex;flex-direction:column;gap:16px;margin-top:14px"></div>`;
    det.addEventListener("toggle", () => { S.jurDet = det.open; });
    const corpo = det.querySelector("#jur-listb"); [...host.children].forEach(ch => { if (ch !== head) corpo.appendChild(ch); });
    const fc = det.querySelector("#fcot"); if (fc) (fc.closest(".card") || fc).remove();   /* cotação de referência fica na Auditoria · Operações comerciais */
    host.appendChild(det); painelJuridico(host);
  };

  /* =========================================================== ENVIO DOS QUESTIONÁRIOS */
  let FICHAS = null, fichasEm = 0;
  async function carregaFichas(){
    if (!Store.db || !window.KT_FB || !KT_FB.cid || Date.now() - fichasEm < 60000) return FICHAS;
    try{ const q = await Store.db.collection("fichas").where("clienteId", "==", KT_FB.cid).get(); FICHAS = q.docs.map(d => d.data()); fichasEm = Date.now(); }catch(e){ FICHAS = FICHAS || []; }
    return FICHAS;
  }
  const dl = v => String(v || "").replace(/\D/g, "");
  const emailDe = s => s.email || (/@/.test(s.contato || "") ? String(s.contato).match(/[^\s;,]+@[^\s;,]+/)[0] : "");
  const foneDe = s => { const d = dl(s.telefone || (/@/.test(s.contato || "") ? "" : s.contato)); return d.length >= 10 ? d : ""; };
  function situacao(s){
    const f = (FICHAS || []).find(x => (x.email && x.email === (s.convite?.email || emailDe(s)).toLowerCase()) || (dl(x.fornecedor?.doc) && dl(x.fornecedor?.doc) === dl(s.doc)));
    if (s.origem === "Portal do Fornecedor" || f?.status === "importada") return ["respondido", "Respondido e importado"];
    if (f) return ["enviado", `Enviado pelo Portal em ${dt(f.enviadoEm)}: importar a ficha`];
    if (s.convite) return ["convidado", `Convidado em ${dt(s.convite.em)} (${s.convite.email})`];
    return ["sem", "Sem convite"];
  }
  function statusQuest(){ const c = {respondidos: 0, convidados: 0, sem: 0}; S.suppliers.forEach(s => { const [k] = situacao(s); if (k === "respondido" || k === "enviado") c.respondidos++; else if (k === "convidado") c.convidados++; else c.sem++; }); return c; }
  const MSG = "Olá, {nome}!\n\n{cliente} conduz, com a Kinsey BR, a verificação da sua cadeia de fornecimento. Pedimos que responda ao questionário e envie os documentos solicitados pelo Portal do Fornecedor:\n{link}\n\nEntre com o e-mail {email} (pelo Google ou em “Primeiro acesso”, criando uma senha). Antes de responder, você lerá e aceitará o termo de confidencialidade (NDA) e LGPD. Suas informações são vistas somente pela Kinsey BR e pelo cliente contratante.\n\nObrigado!";
  const preenche = (t, s, email) => t.replace(/\{nome\}/g, s.responsavel || s.nome).replace(/\{cliente\}/g, CLI().nome).replace(/\{link\}/g, PORTAL_URL).replace(/\{email\}/g, email || "informado no convite");
  async function envio(ids){
    await carregaFichas();
    const base = (ids ? ids.map(supById).filter(Boolean) : S.suppliers.slice()).sort((a, b) => a.nivel.localeCompare(b.nivel) || (a.nome || "").localeCompare(b.nome || ""));
    let filtro = ids ? "todos" : "pendentes";
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Portal do Fornecedor · ${esc(CLI().nome)}</div><h2>Enviar questionários</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Como funciona</h3>
          <ol style="margin:0;padding-left:20px;font-size:13.5px;display:flex;flex-direction:column;gap:4px"><li>Informe o e-mail (e o WhatsApp, se quiser) de cada fornecedor e clique em <b>Registrar convites</b>: só quem foi convidado entra no Portal, e o cadastro já chega pré-preenchido.</li>
            <li>Envie a mensagem com o link pelo <b>WhatsApp</b> ou <b>e-mail</b> (botões em cada linha) ou copie o texto.</li><li>O fornecedor aceita o NDA/LGPD, responde e envia; a ficha aparece aqui como <b>respondida</b> e é importada no dossiê.</li></ol>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="mono" style="font-size:12.5px;user-select:all">${esc(PORTAL_URL)}</span><button type="button" class="btn sm" id="en-cl">Copiar link do Portal</button></div>
          ${Store.db ? "" : `<div class="banner">Modo de teste local: os convites só valem na versão publicada (com login). Aqui é possível preparar contatos e mensagens.</div>`}</div>
        <details class="card"><summary><h3 style="font-size:14px">Mensagem (pode editar)</h3></summary><textarea id="en-msg" style="margin-top:10px;min-height:190px">${esc(MSG)}</textarea><p class="sub" style="margin:4px 0 0">{nome}, {cliente}, {link} e {email} são trocados automaticamente.</p></details>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${[["pendentes", "Sem resposta"], ["todos", "Todos"]].map(([k, l]) => `<button type="button" class="btn sm" data-enf="${k}">${l}</button>`).join("")}<span style="flex:1"></span><label class="check"><input type="checkbox" id="en-all" checked> Selecionar todos</label></div>
        <div id="en-tab"></div>
        <p class="err" id="en-err" hidden></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="en-go">Registrar convites dos selecionados</button></div></div>`);
    const msg = () => $("#en-msg").value;
    function desenha(){
      const L = base.filter(s => filtro === "todos" || !["respondido", "enviado"].includes(situacao(s)[0]));
      $$("[data-enf]").forEach(b => b.classList.toggle("primary", b.dataset.enf === filtro));
      $("#en-tab").innerHTML = L.length ? `<div class="tbl"><table><thead><tr><th></th><th>Fornecedor</th><th>E-mail</th><th>WhatsApp</th><th>Situação</th><th>Enviar</th></tr></thead><tbody>${L.map(s => { const [k, tx] = situacao(s), em = s.convite?.email || emailDe(s), fo = foneDe(s);
        return `<tr data-en="${s.id}"><td><input type="checkbox" data-ens ${k === "respondido" ? "" : "checked"}></td><td style="min-width:150px"><span class="lvtag">${s.nivel}</span> ${esc(s.nome)}</td>
          <td><input data-ene type="email" value="${esc(em)}" placeholder="email@fornecedor.com" style="min-width:170px"></td><td><input data-enw inputmode="tel" value="${esc(fo)}" placeholder="DDD + número" style="width:130px"></td>
          <td style="font-size:12px;min-width:130px;color:${k === "respondido" ? "var(--ok)" : k === "enviado" ? "var(--warn)" : "var(--muted)"}">${esc(tx)}</td>
          <td style="white-space:nowrap"><button type="button" class="btn sm" data-wa title="WhatsApp">WhatsApp</button> <button type="button" class="btn sm" data-ml title="E-mail">E-mail</button> <button type="button" class="btn sm ghost" data-cp title="Copiar mensagem">Copiar</button></td></tr>`; }).join("")}</tbody></table></div>`
        : `<div class="empty">Todos os fornecedores já responderam. Use “Todos” para reenviar.</div>`;
      $$("[data-en]").forEach(tr => { const s = supById(tr.dataset.en), em = () => $("[data-ene]", tr).value.trim(), fo = () => dl($("[data-enw]", tr).value);
        $("[data-wa]", tr).onclick = () => { const f = fo(); window.open(`https://wa.me/${f ? (f.length <= 11 ? "55" + f : f) : ""}?text=${encodeURIComponent(preenche(msg(), s, em()))}`, "_blank", "noopener"); };
        $("[data-ml]", tr).onclick = () => { location.href = `mailto:${encodeURIComponent(em())}?subject=${encodeURIComponent("Questionário de due diligence · " + CLI().nome)}&body=${encodeURIComponent(preenche(msg(), s, em()))}`; };
        $("[data-cp]", tr).onclick = () => { const t = preenche(msg(), s, em()); navigator.clipboard?.writeText(t).then(() => toast("Mensagem copiada"), () => toast("Não foi possível copiar")); }; });
    }
    $$("[data-enf]").forEach(b => b.onclick = () => { filtro = b.dataset.enf; desenha(); });
    $("#en-all").onchange = e => $$("[data-ens]").forEach(c => c.checked = e.target.checked);
    $("#en-cl").onclick = () => navigator.clipboard?.writeText(PORTAL_URL).then(() => toast("Link copiado"), () => toast(PORTAL_URL));
    $("#en-go").onclick = async () => {
      const sel = $$("[data-en]").filter(tr => $("[data-ens]", tr).checked).map(tr => ({s: supById(tr.dataset.en), email: $("[data-ene]", tr).value.trim().toLowerCase(), fone: dl($("[data-enw]", tr).value)}));
      const ruins = sel.filter(x => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email)); if (!sel.length){ toast("Nenhum fornecedor selecionado"); return; }
      if (ruins.length){ $("#en-err").textContent = `Informe um e-mail válido para: ${ruins.map(x => x.s.nome).slice(0, 4).join(", ")}${ruins.length > 4 ? "…" : ""}`; $("#en-err").hidden = false; return; } $("#en-err").hidden = true;
      const b = $("#en-go"); b.disabled = true; b.textContent = "Registrando…"; let n = 0;
      for (const {s, email, fone} of sel){
        try{
          if (Store.db && window.KT_FB){ const par = supById(s.parentId);
            await Store.db.collection("invites").doc(email).set({role: "fornecedor", nome: s.responsavel || s.nome, empresa: s.nome, clienteId: KT_FB.cid, clienteNome: CLI().nome, em: nowISO(), por: Store.me.id || "",
              fornecedor: {supplierId: s.id, nome: s.nome, doc: s.doc || "", nivel: s.nivel, uf: s.uf || "", municipio: s.municipio || "", comprador: s.nivel === "N1" ? "" : par ? `${par.nome}${par.doc ? " · " + par.doc : ""}` : ""}}); }
          await Store.update("suppliers", s.id, {email, ...(fone ? {telefone: fone} : {}), convite: {email, em: nowISO(), por: Store.me.id || ""}}); n++;
        }catch(e){}
      }
      b.disabled = false; b.textContent = "Registrar convites dos selecionados"; toast(`${n} convite(s) registrado(s). Agora envie a mensagem pelo WhatsApp ou e-mail.`);
      setTimeout(desenha, 400);
    };
    desenha();
  }
  return {miniGlobo, envio, painelAuditoria, painelJuridico, juridicoFornecedor, situacao};
})();
