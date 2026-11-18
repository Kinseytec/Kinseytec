/* ================= KINSEY CAPITAL · DILIGÊNCIA JURÍDICA AUTOMÁTICA =================
   O questionário jurídico abre respondido pelo sistema, com fonte, a partir de:
   - contrato social, alterações, ficha da Junta ou cartão CNPJ anexados (no cadastro do projeto ou no Jurídico): sócios
     e quotas, capital, administração, registro na Junta, cláusulas de preferência, tag/drag along, lock-up, ônus sobre
     quotas, procurações, filiais e participações, espólio ou inventário;
   - Receita Federal: quadro de sócios (QSA) comparado ao contrato social, situação, CNAEs;
   - contratos analisados no Jurídico (mudança de controle, exclusividade, não concorrência, multas, garantias);
   - processos cadastrados, procedimentos da due diligence (CND, execuções, PJ) e investigação (listas, PEP, IBAMA);
   - CNAE do target: licenças e registros setoriais exigidos (ANVISA, MAPA, ANTT, PF, MTE, ambiental etc.).
   O que o advogado marca à mão prevalece; o sistema só preenche o que está vazio ou foi preenchido por ele. */
if (window.KT_DD && window.KT_JDD) (() => {
  const D = KT_DD, J = KT_JDD, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), dig = v => String(v || "").replace(/\D/g, "");
  const dBR = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("pt-BR") : "";
  /* ---------------- leitura do contrato social / ficha / cartão CNPJ ---------------- */
  function lerSocietario(txt){
    const T = String(txt || "").replace(/\r/g, ""), t1 = T.replace(/\s+/g, " "), n = nrm(t1), o = {socios:[], clausulas:[], achou:[]};
    const tipo = /comprovante de inscri[cç][aã]o e de situa[cç][aã]o cadastral/i.test(t1) ? "Cartão CNPJ" : /ficha cadastral|breve relato|certid[aã]o simplificada/i.test(t1) ? "Ficha da Junta Comercial" : /estatuto social/i.test(t1) ? "Estatuto social" : /altera[cç][aã]o (do )?contrato social|consolida[cç][aã]o/i.test(t1) ? "Alteração contratual" : /contrato social/i.test(t1) ? "Contrato social" : "Documento societário"; o.tipo = tipo;
    const cnpj = (t1.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/) || [])[0]; if (cnpj) o.cnpj = dig(cnpj);
    const cap = t1.match(/capital social[^.]{0,80}?R\$\s*([\d.]+(?:,\d{2})?)/i); if (cap){ o.capital = cap[1]; o.achou.push("capital social"); }
    const nire = t1.match(/NIRE[^\d]{0,12}(\d[\d.\-\s]{8,14}\d)/i); if (nire) o.nire = dig(nire[1]);
    const reg = t1.match(/(certifico o registro|registrad[oa]|arquivad[oa])[^.]{0,80}?(JUC[A-Z]{1,4}|junta comercial)[^.]{0,80}?(sob o )?n[ºo°.]*\s*([\d./-]{4,})?[^.]{0,60}?(\d{2}\/\d{2}\/\d{4})?/i);
    if (reg){ o.registro = {orgao:reg[2].toUpperCase(), numero:reg[4] || "", data:reg[5] || ""}; o.achou.push("registro na Junta"); }
    const alt = t1.match(/(\d{1,3})[ªaº]?\s*(?:\(\w+\)\s*)?altera[cç][aã]o (?:e consolida[cç][aã]o )?(?:do )?contrato social/i); if (alt) o.alteracao = +alt[1];
    const datas = [...t1.matchAll(/(\d{1,2}) de (janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (20\d\d|19\d\d)/gi)]; if (datas.length) o.data = datas[datas.length - 1][0];
    /* sócios: "NOME, brasileiro, ... detentor de X quotas" / "NOME ... X% (por cento)" / QSA do cartão */
    const re1 = /([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ' ]{6,70}?),[ \t]*((?:brasileir|portugu|estrangeir|naturalizad|pessoa jur[ií]dica|sociedade)[^;]{0,400}?)(?:,\s*)?(?:titular de|detentor[a]? de|subscreve|possui|com)\s*([\d.]+)\s*(?:\([^)]{0,60}\)\s*)?quotas/g;
    for (const m of T.replace(/[ \t]+/g, " ").matchAll(re1)) o.socios.push({nome:m[1].trim().replace(/\s+/g, " "), qualif:m[2].trim().replace(/[\s,]+$/, ""), quotas:+m[3].replace(/\./g, "")});
    if (!o.socios.length) for (const m of T.matchAll(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ' ]{6,70}?)\s*[-–:]\s*(?:s[oó]cio|administrador)[^\n]{0,40}/g)) o.socios.push({nome:m[1].trim().replace(/\s+/g, " ")});
    const totQ = o.socios.reduce((a, s) => a + (s.quotas || 0), 0); if (totQ) o.socios.forEach(s => s.pct = s.quotas / totQ);
    if (o.socios.length) o.achou.push(`${o.socios.length} sócio(s)`);
    const adm = t1.match(/administra[cç][aã]o da sociedade[^.]{0,30}(caber[aá]|ser[aá] exercida|compete)[^.]{0,20}?(a[o]?s?|ao s[oó]cio|aos s[oó]cios|[aà] s[oó]cia)?\s*([^.;]{4,160})/i); if (adm){ o.administracao = adm[3].trim(); o.achou.push("administração"); o.socios.forEach(p => { if (nrm(o.administracao).includes(nrm(p.nome))) p.adm = true; }); }
    const C = (k, re, rot) => { if (re.test(n)){ o.clausulas.push(k); o.achou.push(rot); } };
    C("preferencia", /direito de prefer[eê]ncia|prefer[eê]ncia (na|para a) aquisi/, "direito de preferência");
    C("tag", /tag[\s-]?along|direito de venda conjunta|acompanhar a venda/, "tag along");
    C("drag", /drag[\s-]?along|obriga[cç][aã]o de venda conjunta|arrastar/, "drag along");
    C("lock", /lock[\s-]?up|vedada a (cess[aã]o|transfer[eê]ncia)[^.]{0,40}prazo/, "lock-up");
    C("acordo", /acordo de (s[oó]cios|quotistas|acionistas)/, "acordo de sócios");
    C("onus", /penhor (das|de) quotas|alien[aç][aã]o fiduci[aá]ria (das|de) quotas|usufruto|cau[cç][aã]o (das|de) quotas|penhora (das|de) quotas/, "ônus sobre quotas");
    C("procuracao", /procura[cç][aã]o|procuradores?/, "procurações");
    C("filial", /filia(l|is)\b|estabelecimento filial/, "filiais");
    C("participacao", /participar (de|como s[oó]cia de) outras sociedades|participa[cç][aã]o (em|no capital de) outras (sociedades|empresas)/, "participações em outras sociedades");
    C("espolio", /esp[oó]lio|invent[aá]rio|herdeir/, "espólio/herdeiros");
    C("exclusao", /exclus[aã]o (de|do) s[oó]cio|justa causa/, "exclusão de sócio");
    const obj = t1.match(/objeto social[^:]{0,20}:?\s*([^.]{20,400})/i); if (obj) o.objeto = obj[1].trim();
    const cn = [...t1.matchAll(/\b(\d{2}\.\d{2}-\d-\d{2})\b/g)].map(m => dig(m[1])); if (cn.length) o.cnaes = [...new Set(cn)];
    return o;
  }
  /* ---------------- licenças e registros esperados pelo CNAE ---------------- */
  const LIC = [[/^(21|4644|4771)/, "AFE da ANVISA e licença da vigilância sanitária (medicamentos)"], [/^86/, "CNES, licença da vigilância sanitária e registro no conselho profissional (saúde)"], [/^(10|11)/, "registro no MAPA (SIF/SIE) ou na ANVISA e licença sanitária (alimentos e bebidas)"],
    [/^(35)/, "autorização da ANEEL (energia)"], [/^(61)/, "outorga da ANATEL (telecomunicações)"], [/^(1921|4731|4681)/, "autorização da ANP (combustíveis)"], [/^(49|52)/, "RNTRC na ANTT e licenças de transporte"], [/^782/, "registro de empresa de trabalho temporário no Ministério do Trabalho (Lei 6.019/74)"],
    [/^801/, "autorização da Polícia Federal (vigilância privada, Lei 7.102/83)"], [/^(64|65|66)/, "autorização do Banco Central, SUSEP ou CVM"], [/^85/, "credenciamento no MEC ou na secretaria de educação"], [/^(0[5-9]|1[2-9]|2[0-9]|3[0-3]|38|39)/, "licença ambiental de operação (órgão estadual) e outorga de uso de água, quando houver"],
    [/^(41|42|43)/, "registro no CREA/CAU e alvarás de obra"], [/^(55|56)/, "alvará sanitário e do corpo de bombeiros (hospedagem e alimentação)"], [/^(8121|8122|8129)/, "licença sanitária para limpeza e controle de pragas, quando aplicável"]];
  const licencas = s => { const L = [s.receita?.cnae, ...(s.receita?.cnaesSec || []).map(c => String(c).split(" ")[0]), ...(s.jdd?.soc?.ext?.cnaes || [])].map(dig).filter(Boolean); return [...new Set(LIC.filter(([re]) => L.some(c => re.test(c.padStart(7, "0")))).map(x => x[1]))]; };

  /* ---------------- respostas automáticas ---------------- */
  function respostas(s){
    const R = {}, set = (id, v, n) => { R[id] = {v, n}; }, soc = s.jdd?.soc, X = soc?.ext, rf = s.receita && !s.receita.erro ? s.receita : null;
    if (X){ const f = `${X.tipo} (${soc.arquivo}${X.data ? ", " + X.data : ""})`;
      if (X.registro) set("js1", "sim", `${f}: registro na ${X.registro.orgao}${X.registro.numero ? " nº " + X.registro.numero : ""}${X.registro.data ? " em " + X.registro.data : ""}${X.alteracao ? `; ${X.alteracao}ª alteração` : ""}`);
      const cl = X.clausulas || [], rot = {preferencia:"direito de preferência", tag:"tag along", drag:"drag along", lock:"lock-up", acordo:"acordo de sócios"}, k2 = cl.filter(c => rot[c]);
      set("js2", k2.length ? "sim" : "nao", k2.length ? `${f}: ${k2.map(c => rot[c]).join(", ")}` : `${f}: sem cláusulas de preferência, tag/drag along ou lock-up; confirmar se há acordo de sócios em separado`);
      if (cl.includes("onus")) set("js3", "sim", `${f}: menção a ônus sobre quotas (penhor, alienação fiduciária ou usufruto)`);
      if (cl.includes("procuracao")) set("js4", "sim", `${f}: prevê procuradores; levantar as procurações vigentes`);
      if (cl.includes("filial") || cl.includes("participacao")) set("js5", "sim", `${f}: ${[cl.includes("filial") && "filiais", cl.includes("participacao") && "participação em outras sociedades"].filter(Boolean).join(" e ")}`);
      if (cl.includes("espolio")) set("js6", "sim", `${f}: menção a espólio, inventário ou herdeiros`); }
    /* Receita x contrato social */
    if (rf?.socios?.length){ const qsa = rf.socios.map(q => nrm(q.nome)), cs = (X?.socios || []).map(q => nrm(q.nome));
      const fora = cs.length ? rf.socios.filter(q => !cs.some(c => c.includes(nrm(q.nome).slice(0, 14)) || nrm(q.nome).includes(c.slice(0, 14)))) : [];
      if (fora.length){ const r0 = R.js1; set("js1", "nao", `QSA da Receita diverge do contrato social anexado (${fora.map(q => q.nome).join(", ")}): a última alteração pode não estar registrada`); if (r0) R.js1.n += " · " + r0.n; }
      else if (!R.js1) set("js1", "nc", `Receita: ${rf.socios.length} sócio(s) no QSA (${rf.socios.slice(0, 3).map(q => q.nome + (q.qual ? " · " + q.qual : "")).join("; ")}). Anexe o contrato social e a ficha da Junta para confirmar o registro.`); }
    if (rf?.situacao && rf.situacao !== "ATIVA") set("js1", "nao", `Receita: situação ${rf.situacao}${rf.motivo ? " (" + rf.motivo + ")" : ""}`);
    /* contratos analisados */
    const C = J.contratos(s), com = k => C.filter(c => c.flags[k]);
    if (C.length){ set("jc1", C.length >= 3 ? "sim" : "nc", `${C.length} contrato(s) cadastrados no Jurídico`);
      const coc = com("coc"); set("jc2", coc.length ? "sim" : "nao", coc.length ? `Mudança de controle: ${coc.map(c => c.contraparte).join(", ")}` : `Nenhum dos ${C.length} contratos analisados exige anuência por mudança de controle`);
      const ex = [...com("excl"), ...com("nc")]; set("jc3", ex.length ? "sim" : "nao", ex.length ? `Exclusividade ou não concorrência: ${[...new Set(ex.map(c => c.contraparte))].join(", ")}` : "Sem exclusividade ou não concorrência nos contratos analisados");
      const mu = com("multa"); if (mu.length) set("jc4", "sim", `Multa rescisória: ${mu.map(c => c.contraparte).join(", ")}`);
      const ga = com("gar"); if (ga.length){ set("jc6", "sim", `Garantias: ${ga.map(c => c.contraparte).join(", ")}`); if (ga.some(c => /financ|empr[eé]st|banc|deb[eê]nt/i.test(c.tipo + " " + c.contraparte))) set("jd2", "sim", "Garantias em contratos de financiamento"); }
      const fin = C.filter(c => /financ|empr[eé]st|banc|c[eé]dula|deb[eê]nt/i.test(c.tipo || "")); if (fin.length) set("jd1", fin.some(c => c.flags.coc) ? "sim" : "nc", `${fin.length} contrato(s) de dívida analisado(s)${fin.some(c => c.flags.coc) ? ": vencimento antecipado por mudança de controle" : "; conferir covenants"}`); }
    /* processos cadastrados */
    const P = J.contingencias(s).area || {}, pa = re => Object.entries(P).filter(([a]) => re.test(a)).reduce((o, [, v]) => ({n:o.n + v.n, v:o.v + v.provavel + v.possivel}), {n:0, v:0});
    const pt = pa(/trabalh/i), pc = pa(/c[ií]vel|consum/i), px = pa(/tribut|fiscal/i);
    if (pt.n) set("jt1", "sim", `${pt.n} processo(s) trabalhista(s), ${D.mi(pt.v)} provável + possível`);
    if (pc.n) set("jv1", "sim", `${pc.n} processo(s) cível(is), ${D.mi(pc.v)} provável + possível`);
    if (px.n) set("jx1", "sim", `${px.n} processo(s) tributário(s), ${D.mi(px.v)} provável + possível`);
    /* due diligence */
    try{ const per = [...D.periodos(s)].sort().pop(), b = per && s.dd?.bal?.[per];
      if (b){ const K = D.calc(b), Rp = Object.fromEntries(D.PROCS.map(p => [p.id, p.f(K, b, s)])), cnd = String(Rp.x_cont?.txt || "").replace(/^(Autom[aá]tico: )?(Due diligence \([^)]*\): )+/i, "").replace(/^[\s\S]*?(?=CND|Certid[aã]o|Sem execu)/i, "");
        if (!R.jx1 && /execu|d[ií]vida ativa|auto de infra/i.test(cnd) && !/sem (execu[cç][oõ]es ou )?d[ií]vida ativa/i.test(cnd)) set("jx1", "sim", `Due diligence (${per}): ${cnd.slice(0, 150)}`);
        if (/positiva|vencid|n[aã]o emitid|sem certid/i.test(cnd)) set("jx3", "nao", `Due diligence (${per}): ${cnd.slice(0, 150)}`); else if (Rp.x_cont?.st === "ok") set("jx3", "sim", `Due diligence (${per}): certidões sem pendência`);
        if (Rp.t_pj?.st === "achado") set("jt4", "sim", `Due diligence (${per}): ${Rp.t_pj.txt.slice(0, 150)}`); } }catch(e){}
    /* investigação */
    const iv = s.invest || {};
    if (iv.anticorr?.v === "sim" || iv.pep?.v === "sim") set("jo3", "sim", `Investigação: ${[iv.anticorr?.v === "sim" && "CEIS/CNEP", iv.pep?.v === "sim" && "pessoa politicamente exposta"].filter(Boolean).join(" e ")}`);
    else if (iv.anticorr?.v === "nao") set("jo3", "nao", "Investigação: sem ocorrência no CEIS/CNEP" + (iv.pep?.v === "nao" ? " nem PEP" : "; PEP a confirmar"));
    if (iv.ibama?.v === "sim") set("ja2", "sim", "Investigação: área embargada no IBAMA");
    /* CNAE: licenças esperadas */
    const L = licencas(s); if (L.length) set("ja1", "nc", `Licenças exigidas pelo CNAE: ${L.join("; ")}. Pedir as vigentes e conferir validade.`);
    return R;
  }
  /* grava sem sobrepor o manual */
  const emCurso = new Set();
  async function aplicar(s){
    if (!s || s.nivel !== "N3" || !Store.me?.canWrite || emCurso.has(s.id)) return 0; const R = respostas(s), q = s.jdd?.q || {}, up = {};
    Object.entries(R).forEach(([id, r]) => { const c = q[id] || {}; if (c.manual || (c.v && !c.auto)) return; if (c.v !== r.v || c.n !== r.n) up[id] = {v:r.v, n:r.n, auto:true, em:nowISO()}; });
    if (!Object.keys(up).length) return 0; emCurso.add(s.id);
    try{ await D.up(s, {jdd:{q:up}}); }catch(e){} finally{ setTimeout(() => emCurso.delete(s.id), 1200); } return Object.keys(up).length;
  }
  /* importa o documento societário */
  async function importar(s, f){
    const tx = await KT_AUTO.texto(f), ext = lerSocietario(tx);
    await D.up(s, {jdd:{soc:{arquivo:f.name, em:nowISO(), por:Store.me?.email || "", ext, texto:String(tx).slice(0, 40000)}}});
    if (ext.cnpj && dig(s.doc).length !== 14){ await Store.update("suppliers", s.id, {doc:ext.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}); if (window.ORG?.atualizar) ORG.atualizar(supById(s.id), false); }
    const n = await aplicar(supById(s.id) || s); toast(`${ext.tipo} lido: ${ext.achou.join(", ") || "sem campos reconhecidos"}${n ? ` · ${n} resposta(s) automática(s)` : ""}`); return ext;
  }
  /* ---------------- tela: quadro no questionário ---------------- */
  const quadro = s => { const X = s.jdd?.soc?.ext, rf = s.receita && !s.receita.erro ? s.receita : null, L = licencas(s), R = respostas(s), q = s.jdd?.q || {};
    const auto = Object.keys(R).length, man = Object.values(q).filter(c => c?.manual || (c?.v && !c?.auto)).length;
    return `<div class="card" data-jauto style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><h3 style="margin:0">Análise automática</h3><p class="sub" style="margin:2px 0 0">${auto} resposta(s) pelo sistema · ${man} pelo jurídico. Anexe o contrato social, a última alteração, a ficha da Junta ou o cartão CNPJ: o sistema lê e responde.</p></div>${D.ed() ? `<label class="btn sm primary">Anexar documento societário<input type="file" id="ja-f" accept=".pdf,.docx,.txt" hidden></label>` : ""}</div>
      ${X ? `<div style="font-size:13px;display:flex;flex-direction:column;gap:3px"><div><b>${esc(X.tipo)}</b> · ${esc(s.jdd.soc.arquivo)} · lido em ${dt(s.jdd.soc.em)}</div>
        ${X.socios.length ? `<div>Sócios: ${X.socios.map(p => `${esc(p.nome)}${p.pct ? ` (${fmt(p.pct * 100, 1)}%)` : ""}`).join("; ")}</div>` : ""}${X.capital ? `<div>Capital social: R$ ${esc(X.capital)}</div>` : ""}${X.administracao ? `<div>Administração: ${esc(X.administracao.slice(0, 160))}</div>` : ""}
        ${X.registro ? `<div>Registro: ${esc(X.registro.orgao)} ${esc(X.registro.numero || "")} ${esc(X.registro.data || "")}</div>` : ""}${X.clausulas.length ? `<div>Cláusulas relevantes: ${esc(X.clausulas.map(c => ({preferencia:"direito de preferência", tag:"tag along", drag:"drag along", lock:"lock-up", acordo:"acordo de sócios", onus:"ônus sobre quotas", procuracao:"procuradores", filial:"filiais", participacao:"participações", espolio:"espólio/herdeiros", exclusao:"exclusão de sócio"})[c] || c).join(", "))}</div>` : ""}</div>` : ""}
      ${rf?.socios?.length ? `<div style="font-size:13px">Quadro societário na Receita (${dBR(rf.em)}): ${rf.socios.map(p => `${esc(p.nome)}${p.qual ? ` · ${esc(p.qual)}` : ""}`).join("; ")}</div>` : `<div class="sub" style="font-size:12px;margin:0">Quadro societário da Receita: ${dig(s.doc).length === 14 ? "consulta automática em andamento ou indisponível" : "informe o CNPJ para consultar"}.</div>`}
      ${L.length ? `<div style="font-size:13px">Licenças esperadas pelo CNAE: ${esc(L.join("; "))}</div>` : ""}</div>`; };
  const _html = J.html;
  J.html = function(s){ const h = _html.apply(this, arguments); return S.jddTab === "quest" ? quadro(s) + h : h; };
  const _bind = J.bind;
  J.bind = function(host, s){ const r = _bind.apply(this, arguments); setTimeout(() => aplicar(supById(s.id) || s), 60);
    const f = $("#ja-f", host); if (f) f.onchange = () => f.files[0] && importar(s, f.files[0]).catch(e => { console.error(e); toast("Não foi possível ler o documento."); });
    /* resposta à mão vira manual */
    $$("[data-jq]", host).forEach(b => b.addEventListener("click", () => D.up(supById(s.id) || s, {jdd:{q:{[b.dataset.jq]:{manual:true, auto:false}}}}).catch(() => {})));
    $$("[data-jqn]", host).forEach(i => i.addEventListener("change", () => D.up(supById(s.id) || s, {jdd:{q:{[i.dataset.jqn]:{manual:true, auto:false}}}}).catch(() => {})));
    $$("[data-jq]", host).forEach(b => { const c = s.jdd?.q?.[b.dataset.jq]; if (c?.auto && b.getAttribute("aria-pressed") === "true"){ const qt = b.closest(".q")?.querySelector(".qt"); if (qt && !qt.querySelector(".jauto")) qt.insertAdjacentHTML("beforeend", `<div class="sub jauto" style="margin:3px 0 0;font-size:11.5px;color:var(--glow)">Automático: ${esc(c.n || "")}</div>`); } });
    $$("[data-jq]", host).forEach(b => { const id = b.dataset.jq, c = s.jdd?.q?.[id]; if (c?.auto && c.v === "nc"){ const qt = b.closest(".q")?.querySelector(".qt"); if (qt && !qt.querySelector(".jauto")) qt.insertAdjacentHTML("beforeend", `<div class="sub jauto" style="margin:3px 0 0;font-size:11.5px;color:var(--glow)">Sistema: ${esc(c.n || "")}</div>`); } });
    return r; };
  /* depois de consultas e importações, aplica em segundo plano */
  let tm = null; const _all = renderAll;
  renderAll = function(){ const r = _all.apply(this, arguments); clearTimeout(tm); tm = setTimeout(() => S.suppliers.filter(s => s.nivel === "N3" && (s.jdd?.soc || s.receita?.socios || s.jdd?.ct || s.dd?.bal)).slice(0, 80).forEach(s => aplicar(s)), 1800); return r; };
  window.KT_JAUTO = {lerSocietario, respostas, aplicar, importar, licencas};
})();
