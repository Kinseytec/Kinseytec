/* ================= KINSEY CAPITAL · INVESTIGAÇÃO AUTOMÁTICA DO TARGET =================
   A aba Investigação já abre preenchida, sem clique, com o que o sistema consulta e apura sozinho:
   - Receita Federal: situação cadastral, data e situação especial (recuperação judicial);
   - listas oficiais: CEIS e CNEP (CGU), Cadastro de Empregadores do MTE, áreas embargadas do IBAMA;
   - notícias da empresa: mídia negativa (fraude, corrupção, investigação, falência, desastre);
   - due diligence: CND com dívida ativa, tributos e encargos em atraso, exposições tributárias, trabalhistas e previdenciárias;
   - diligência jurídica: processos por área (trabalhista, cível, tributário, criminal).
   Cada resposta automática traz a fonte e a data; o que o analista marcar à mão prevalece. Itens sem fonte automática
   (protestos, PEP, sanções internacionais) ficam como "consulta manual" com o link da fonte. Target sem CNPJ: campo
   para informar e consultar na hora. */
if (window.KT_DD) (() => {
  const D = KT_DD, dig = v => String(v || "").replace(/\D/g, ""), hoje = () => new Date().toISOString().slice(0, 10);
  const SIT = {ATIVA:"Ativa", INAPTA:"Inapta", SUSPENSA:"Suspensa", BAIXADA:"Baixada", NULA:"Nula"};
  const NEG = /(fraude|corrup|propina|lavagem|investiga[cç][aã]o|opera[cç][aã]o da (pf|pol[ií]cia)|den[uú]ncia|pris[aã]o|preso|fal[eê]ncia|recupera[cç][aã]o judicial|calote|golpe|desastre|trabalho escravo|an[aá]logo [aà] escravid|multa milion|condena)/i;
  const dBR = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("pt-BR") : "";
  /* respostas automáticas: {id: {v, n}} */
  function apurar(s){
    const o = {}, r = s.receita && !s.receita.erro ? s.receita : null, la = s.listas || {}, ach = la.achados || [], set = (id, v, n) => { o[id] = {v, n}; };
    if (r){ if (/recupera[cç][aã]o judicial|fal[eê]ncia/i.test(r.especial || "")) set("rj", "sim", `Receita Federal: situação especial "${r.especial}" (${dBR(r.em)})`); }
    if (la.em){ const tem = b => ach.filter(a => a.base === b || a.lista === b), fonte = `listas oficiais verificadas em ${dBR(la.em)}`;
      const carregada = b => !!(la.bases || {})[b];
      const cg = [...tem("ceis"), ...tem("cnep")]; if (cg.length || carregada("ceis") || carregada("cnep")) set("anticorr", cg.length ? "sim" : "nao", cg.length ? `CEIS/CNEP (CGU): ${cg.length} ocorrência(s) · ${fonte}` : `CEIS e CNEP (CGU) sem ocorrência · ${fonte}`);
      const mt = tem("lista_suja"); if (mt.length || carregada("lista_suja")) set("mte", mt.length ? "sim" : "nao", mt.length ? `Cadastro de Empregadores do MTE: ${mt.length} ocorrência(s) · ${fonte}` : `Cadastro de Empregadores do MTE sem ocorrência · ${fonte}`);
      const ib = tem("ibama"); if (ib.length || carregada("ibama")) set("ibama", ib.length ? "sim" : "nao", ib.length ? `IBAMA: ${ib.length} área(s) embargada(s) · ${fonte}` : `IBAMA sem área embargada · ${fonte}`); }
    const nt = [...(s.ext?.noticias || []), ...(s.ext?.aquisicoes || [])];
    if (s.ext?.noticias){ const neg = nt.filter(n => NEG.test(n.titulo || "")); set("midia", neg.length ? "sim" : "nao", neg.length ? `Notícias: ${neg.slice(0, 2).map(n => `"${n.titulo}"`).join("; ")}` : `${nt.length} notícia(s) verificadas, sem termos negativos (${dBR(s.ext.em)})`);
      if (!o.rj && nt.some(n => /recupera[cç][aã]o judicial|fal[eê]ncia/i.test(n.titulo || ""))) set("rj", "sim", "Notícias mencionam recuperação judicial ou falência: confirmar"); }
    /* due diligence: procedimentos do último balancete */
    try{ const per = D.periodos(s).slice(-1)[0], b = per && s.dd?.bal?.[per];
      if (b){ const K = D.calc(b), R = Object.fromEntries(D.PROCS.map(p => [p.id, p.f(K, b, s)]));
        const cnd = R.x_cont?.txt || "", semDiv = /sem (execu[cç][oõ]es ou )?d[ií]vida ativa|nada consta|certid[aã]o negativa(?! com efeitos)/i.test(cnd);
        if (!semDiv && /inscri[cç][oõ]es em d[ií]vida ativa|d[ií]vida ativa da uni|em d[ií]vida ativa/i.test(cnd)) set("divida", "sim", `Due diligence (${per}): ${cnd.slice(0, 160)}`); else if (semDiv) set("divida", "nao", `Due diligence (${per}): ${cnd.slice(0, 120)}`);
        if (R.x_atraso?.st === "achado" || R.x_parc?.st === "achado") set("proc_trib", "sim", `Due diligence (${per}): ${(R.x_atraso?.st === "achado" ? R.x_atraso.txt : R.x_parc.txt).slice(0, 160)}`);
        if (R.t_enc?.st === "achado") set("proc_trab", "sim", `Due diligence (${per}): ${R.t_enc.txt.slice(0, 160)}`); } }catch(e){}
    /* exposições registradas */
    (window.KT_EXP ? KT_EXP.lista(s) : []).forEach(e => { const id = e.area === "tributaria" ? "proc_trib" : e.area === "trabalhista" || e.area === "previdenciaria" ? "proc_trab" : e.area === "legal" ? "proc_civ" : null;
      if (id && e.aval !== "remota" && !(o[id]?.v === "sim")) set(id, "sim", `Exposição registrada na due diligence: ${e.titulo}`); });
    /* diligência jurídica: processos */
    const PR = Object.values(s.jdd?.processos || {}).filter(p => p && !p.excluido), area = re => PR.filter(p => re.test(p.area || ""));
    if (PR.length){ [["proc_trab", /trabalh/i], ["proc_civ", /c[ií]vel|consumid/i], ["proc_trib", /tribut|fiscal/i], ["proc_crim", /crim|penal/i]].forEach(([id, re]) => { const L = area(re); if (L.length) set(id, "sim", `Diligência jurídica: ${L.length} processo(s), R$ ${fmt(L.reduce((a, p) => a + (+p.valor || 0), 0) / 1e6, 1)} mi em discussão`); }); }
    return o;
  }
  const INVX = id => typeof INV !== "undefined" && INV.some(x => x[0] === id);
  const FONTE_MANUAL = {protestos:["Protestos (CENPROT)", "https://www.pesquisaprotesto.com.br/"], pep:["PEP (Portal da Transparência)", "https://portaldatransparencia.gov.br/download-de-dados/pep"], sancoes:["Sanções (ONU / OFAC)", "https://sanctionssearch.ofac.treas.gov/"], prisao:["Tribunais (JusBrasil)", "https://www.jusbrasil.com.br/"], proc_crim:["Tribunais (JusBrasil)", "https://www.jusbrasil.com.br/"]};
  /* grava o que mudou, sem sobrepor o que o analista marcou */
  const emCurso = new Set();
  async function aplicar(s){
    if (!s || s.nivel !== "N3" || !Store.me?.canWrite || emCurso.has(s.id)) return; const v = s.invest || {}, patch = {};
    const r = s.receita && !s.receita.erro ? s.receita : null;
    if (r && SIT[r.situacao] && v.situacao !== SIT[r.situacao] && !v.situacaoManual){ patch.situacao = SIT[r.situacao]; patch.dataConsulta = String(r.em || hoje()).slice(0, 10); }
    if (!Object.keys(patch).length) return; emCurso.add(s.id);
    try{ await Store.update("suppliers", s.id, {invest:patch}); }catch(e){} finally{ setTimeout(() => emCurso.delete(s.id), 1500); }
  }
  /* aba Investigação: aviso de origem, CNPJ ausente e fontes manuais */
  const _b = renderSupBody;
  renderSupBody = function(){ const r = _b.apply(this, arguments), s = supById(S.openSup); if (!s || s.nivel !== "N3") return r; setTimeout(() => aplicar(supById(s.id)), 60);
    if (S.supTab !== "invest") return r; const b = $("#sup-body"); if (!b || b.querySelector("[data-inva]")) return r;
    const el = document.createElement("div"); el.className = "banner"; el.setAttribute("data-inva", "1"); el.style.cssText = "display:flex;flex-direction:column;gap:6px";
    const d = dig(s.doc), A = apurar(s), n = Object.keys(A).length, rec = s.receita && !s.receita.erro ? s.receita : null, pub = !!(window.firebase?.functions && Store.db);
    el.innerHTML = d.length !== 14 ? `<b>Sem CNPJ cadastrado.</b><span style="font-size:13px">Informe o CNPJ para o sistema consultar sozinho a Receita, as listas oficiais (CGU, MTE, IBAMA), a CVM e as notícias.</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="inva-doc" inputmode="numeric" placeholder="00.000.000/0000-00" style="flex:1;min-width:180px"><button type="button" class="btn sm primary" id="inva-ok">Salvar e consultar</button></div>`
      : `<b>Preenchido automaticamente</b><span style="font-size:13px">${rec ? `Receita Federal em ${dBR(rec.em)} (${esc(rec.situacao || "")})` : s.receita?.erro ? `Receita indisponível agora (${esc(s.receita.erro)}); nova tentativa automática` : "Receita: consulta em andamento"} · ${s.listas?.em ? `listas oficiais em ${dBR(s.listas.em)}` : "listas oficiais: em andamento"} · ${s.ext?.em ? `notícias em ${dBR(s.ext.em)}` : pub ? "notícias: em andamento" : "notícias na versão publicada"} · ${n} item(ns) respondido(s) pelo sistema. O que for marcado à mão prevalece.</span>
        <span style="font-size:12px">Consulta manual: ${Object.entries(FONTE_MANUAL).filter(([id]) => INVX(id) && !A[id]).map(([, [l, u]]) => `<a href="${u}" target="_blank" rel="noopener" style="color:var(--glow)">${l}</a>`).filter((x, i, a) => a.indexOf(x) === i).join(" · ")}</span>`;
    b.prepend(el);
    const ok = $("#inva-ok", el); if (ok) ok.onclick = async () => { const v = dig($("#inva-doc", el).value); if (v.length !== 14 || (window.IMP && !IMP.docValido(v))){ toast("CNPJ inválido."); return; }
      const f = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"); await Store.update("suppliers", s.id, {doc:f}); toast("CNPJ salvo: consultando…"); if (window.ORG?.atualizar) ORG.atualizar(supById(s.id), true); };
    const sel = $("#iv-sit", b); if (sel) sel.addEventListener("change", () => Store.update("suppliers", s.id, {invest:{situacaoManual:true}}).catch(() => {}));
    return r; };
  /* depois de cada consulta, cadastro ou importação: aplica em segundo plano nos targets que mudaram */
  let tm = null; const _all = renderAll;
  renderAll = function(){ const r = _all.apply(this, arguments); clearTimeout(tm); tm = setTimeout(() => S.suppliers.filter(s => s.nivel === "N3" && (s.receita?.em || s.listas?.em || s.ext?.em || s.dd?.bal)).slice(0, 80).forEach(s => aplicar(s)), 1500); return r; };
  /* as respostas entram pelo motor automático do núcleo (mesma regra: o manual prevalece) */
  (window.EXT_RESPINV = window.EXT_RESPINV || []).push(s => s.nivel === "N3" ? Object.fromEntries(Object.entries(apurar(s)).map(([id, a]) => [id, {v:a.v, n:a.n}])) : {});
  window.KT_INVA = {apurar, aplicar};
})();
