/* ================= KINSEY CAPITAL · JURÍDICO: DOCUMENTOS DO QUESTIONÁRIO =================
   Em cada pergunta do questionário de diligência jurídica, em vez de uma lista com todos os arquivos da empresa:
   - o sistema procura o documento esperado (contrato social, certidões, licenças, apólices…) entre os do dossiê e
     vincula sozinho quando encontra ("localizado pelo sistema"); o advogado só confirma em Validar;
   - quando não encontra ou não tem certeza, o botão Documentos abre a lista da empresa, com os mais prováveis
     primeiro: Ver, Vincular e validar, Classificar (trocar o tipo) e Excluir, além de Enviar documento.
   Os nomes dos arquivos aparecem sem acentos quebrados (ex.: "BalanÃ§o" vira "Balanço"). */
if (window.KT_JDD && window.KT_DD) (() => {
  const D = KT_DD, J = KT_JDD, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const limpa = t => (typeof fixMoji === "function" ? fixMoji(t) : String(t || "")).replace(/\.(pdf|docx?|xlsx?|txt|csv|jpe?g|png|zip)$/i, "").replace(/[_]+/g, " ").trim();
  const nomeEv = e => limpa(e.nome || e.tipo || "documento");
  const txtEv = e => nrm(`${e.tipo || ""} ${limpa(e.nome || "")} ${e.obs || ""}`);
  const FIN = /balan[cç]|\bdre\b|d\.\s?r\.\s?e|balancete|demonstra|\becd\b|\becf\b|sped|razao|livro diario|fluxo de caixa/;
  const PARE = ["contrato social", "certid", "cnd", "alvar", "licen", "avcb", "bombeir", "inpi", "marca", "apolice", "seguro", "procura", "acordo de socios", "acordo de quotistas", "lgpd", "privacidade", "processo", "judicia", "ambient", "ibama", "cetesb", "trabalh", "fgts", "crf", "cndt", "junta", "estatuto", "ata", "contrato", "organograma", "politica", "codigo de conduta", "compliance", "imovel", "matricula", "escritura", "iptu", "habite", "laudo"];
  const STOP = new Set(["documento", "documentos", "relacao", "copia", "copias", "vigentes", "vigente", "quando", "houver", "lista", "eventuais", "atualizada", "atualizado", "ultimos", "anos", "empresa", "sociedade"]);
  /* palavras-chave do documento esperado em cada pergunta */
  function chaves(doc, t){ const d = nrm(doc), L = PARE.filter(k => d.includes(k) || nrm(t).includes(k));
    d.split(/[^a-z0-9]+/).filter(w => w.length >= 5 && !STOP.has(w)).forEach(w => { if (!L.includes(w)) L.push(w); }); return L; }
  function pontua(e, K, doc){ const txt = txtEv(e); let p = 0;
    K.forEach(k => { if (txt.includes(k)) p += k.length >= 8 ? 3 : 2; });
    if (FIN.test(txt) && !/demonstra|balan/.test(nrm(doc))) p -= 6; if (/a classificar/.test(nrm(e.tipo))) p -= 1; return p; }
  const pergunta = id => J.QS.find(x => x.id === id);
  /* vínculo automático só com certeza: o documento traz todos os termos específicos do documento esperado */
  function certeza(e, doc){ const d = nrm(doc), txt = txtEv(e); let K = PARE.filter(k => d.includes(k)); K = K.filter(k => !K.some(o => o !== k && o.includes(k)));
    let Ke = PARE.filter(k => txt.includes(k)); Ke = Ke.filter(k => !Ke.some(o => o !== k && o.includes(k))); /* termo mais específico do documento (ex.: "contrato social" e não só "contrato") */
    return K.length > 0 && K.every(k => { const L = Ke.filter(ke => ke.includes(k)); return L.length && L.every(ke => d.includes(ke)); }) && !(FIN.test(txt) && !/demonstra|balan/.test(d)); }
  const evsDe = s => S.evidences.filter(e => e.supplierId === s.id);
  function ranking(s, id){ const x = pergunta(id) || {}, K = chaves(x.doc || "", x.t || ""); return evsDe(s).map(e => ({e, p:pontua(e, K, x.doc || "")})).sort((a, b) => b.p - a.p || String(b.e.criadoEm || "").localeCompare(String(a.e.criadoEm || ""))); }
  /* vínculo automático: o melhor documento com pontuação suficiente, só onde ainda não há documento */
  async function autoVincula(s){ if (Store.me?.canWrite === false) return 0; const q = s.jdd?.q || {}, up = {};
    J.QS.forEach(x => { const c = q[x.id] || {}; if (c.evid || c.evNao) return; const r = ranking(s, x.id).find(r => r.p > 0 && certeza(r.e, x.doc || "")); if (r) up[x.id] = {evid:r.e.id, evAuto:true}; });
    if (Object.keys(up).length) await D.up(s, {jdd:{q:up}}).catch(() => {}); return Object.keys(up).length; }
  function caixa(s, id){ const c = (s.jdd?.q || {})[id] || {}, e = c.evid && S.evidences.find(x => x.id === c.evid), ed = D.ed();
    const st = e ? (c.evOk ? ["Validado", "r-baixo"] : c.evAuto ? ["Localizado pelo sistema", "r-medio"] : ["Vinculado", "r-pend"]) : ["Sem documento", "r-pend"];
    return `<div class="jqd" data-jqd="${id}" style="display:flex;flex-direction:column;gap:4px;min-width:0;max-width:100%">
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="pill ${st[1]}" style="font-size:10.5px">${st[0]}</span>${e ? `<span style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px" title="${esc(nomeEv(e))}">${esc(nomeEv(e))}</span>` : ""}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${e?.url ? `<a class="btn sm ghost" href="${esc(e.url)}" target="_blank" rel="noopener">Ver</a>` : ""}${e && !c.evOk && ed ? `<button type="button" class="btn sm ok" data-jqok="${id}">Validar</button>` : ""}<button type="button" class="btn sm ghost" data-jqdocs="${id}">Documentos</button></div></div>`; }
  function folha(s, id){ const x = pergunta(id) || {}, R = ranking(s, id), ed = D.ed(), cur = (s.jdd?.q || {})[id]?.evid;
    const OPC = (typeof EV_TYPES !== "undefined" ? EV_TYPES : ["Contrato", "Certidão", "Outro"]);
    const linha = ({e, p}) => `<tr><td style="font-size:12.5px;word-break:break-word">${esc(nomeEv(e))}${e.id === cur ? ` <span class="pill r-baixo" style="font-size:10px">vinculado</span>` : ""}<div class="sub" style="margin:2px 0 0;font-size:11px">${esc(e.tipo || "")}${p >= 4 ? " · provável" : ""} · ${dt(e.criadoEm)}</div>
        ${ed ? `<select data-jdc="${e.id}" aria-label="Classificar ${esc(nomeEv(e))}" style="margin-top:4px;max-width:220px;font-size:12px">${OPC.map(t => `<option ${t === e.tipo ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>` : ""}</td>
      <td style="text-align:right;white-space:nowrap">${e.url ? `<a class="btn sm ghost" href="${esc(e.url)}" target="_blank" rel="noopener">Ver</a> ` : ""}${ed ? `<button type="button" class="btn sm ok" data-jdv="${e.id}">Vincular e validar</button> <button type="button" class="btn sm ghost" data-jdx="${e.id}" style="color:var(--bad)">Excluir</button>` : ""}</td></tr>`;
    const prov = R.filter(r => r.p > 0), outros = R.filter(r => r.p <= 0 && !FIN.test(txtEv(r.e))), fin = R.filter(r => r.p <= 0 && FIN.test(txtEv(r.e)));
    return `<div class="sheet-h"><div><div class="eyebrow">Documento esperado · ${esc(x.doc || "documento")}</div><h2 style="font-size:17px">${esc(x.t || "")}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px">
        <p class="sub" style="margin:0;font-size:12.5px">O sistema procura o documento entre os do dossiê. Confira em Ver, vincule e valide; se o tipo estiver errado, classifique; se não for da empresa ou estiver repetido, exclua.</p>
        ${prov.length ? `<b style="font-size:13px">Mais prováveis</b><div class="tbl"><table><tbody>${prov.map(linha).join("")}</tbody></table></div>` : `<div class="result">Nenhum documento do dossiê parece ser "${esc(x.doc || "o documento esperado")}".</div>`}
        ${outros.length ? `<details ${prov.length ? "" : "open"}><summary style="cursor:pointer;font-size:13px;font-weight:600">Outros documentos (${outros.length})</summary><div class="tbl" style="margin-top:6px"><table><tbody>${outros.map(linha).join("")}</tbody></table></div></details>` : ""}
        ${fin.length ? `<details><summary style="cursor:pointer;font-size:13px;font-weight:600">Demonstrações e balancetes (${fin.length})</summary><div class="tbl" style="margin-top:6px"><table><tbody>${fin.map(linha).join("")}</tbody></table></div></details>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap">${ed ? `<button type="button" class="btn sm primary" data-jdenv>Enviar documento</button>${cur ? `<button type="button" class="btn sm ghost" data-jdsem>Desvincular</button>` : ""}<button type="button" class="btn sm ghost" data-jdna>Documento não se aplica</button>` : ""}</div></div>`; }
  function abrir(s, id, refaz){ const close = sheet(folha(s, id)), up = p => D.up(supById(s.id) || s, {jdd:{q:{[id]:p}}});
    const fim = msg => { close(); toast(msg); refaz(); };
    $$("[data-jdv]").forEach(b => b.onclick = () => up({evid:b.dataset.jdv, evOk:true, evAuto:false, evNao:false}).then(() => fim("Documento vinculado e validado")));
    $$("[data-jdc]").forEach(i => i.onchange = () => Store.update("evidences", i.dataset.jdc, {tipo:i.value}).then(() => toast("Documento classificado como " + i.value)).catch(() => toast("Não foi possível classificar")));
    $$("[data-jdx]").forEach(b => b.onclick = () => confirmBox("Excluir este documento do dossiê da empresa?", "Excluir", async () => { const eid = b.dataset.jdx; await Store.del("evidences", eid).catch(() => {});
      const q = (supById(s.id) || s).jdd?.q || {}, lim = {}; Object.entries(q).forEach(([k, c]) => { if (c?.evid === eid) lim[k] = {evid:"", evOk:false, evAuto:false}; }); if (Object.keys(lim).length) await D.up(supById(s.id) || s, {jdd:{q:lim}}).catch(() => {}); fim("Documento excluído"); }));
    const env = $("[data-jdenv]"); if (env) env.onclick = () => { close(); openEvidenceForm(s.id, "Outro"); };
    const sem = $("[data-jdsem]"); if (sem) sem.onclick = () => up({evid:"", evOk:false, evAuto:false}).then(() => fim("Documento desvinculado"));
    const na = $("[data-jdna]"); if (na) na.onclick = () => up({evid:"", evOk:false, evAuto:false, evNao:true}).then(() => fim("Marcado: documento não se aplica")); }
  /* troca a lista pela caixa do documento em cada pergunta */
  const _bind = J.bind;
  J.bind = function(host, s){ const r = _bind.apply(this, arguments); if (S.jddTab !== "quest") return r;
    const refaz = () => { try{ renderView(); }catch(e){} };
    const pinta = () => { const ss = supById(s.id) || s; $$("select[data-jqe]", host).forEach(sel => { const id = sel.dataset.jqe, w = document.createElement("div"); w.innerHTML = caixa(ss, id); sel.replaceWith(w.firstElementChild); });
      $$("[data-jqok]", host).forEach(b => b.onclick = () => D.up(supById(s.id) || s, {jdd:{q:{[b.dataset.jqok]:{evOk:true, evAuto:false}}}}).then(() => { toast("Documento validado"); refaz(); }));
      $$("[data-jqdocs]", host).forEach(b => b.onclick = () => abrir(supById(s.id) || s, b.dataset.jqdocs, refaz)); };
    pinta();
    if (!s._jqAuto){ s._jqAuto = true; autoVincula(supById(s.id) || s).then(n => { if (n){ toast(`${n} documento(s) localizado(s) pelo sistema no questionário`); refaz(); } }); }
    return r; };
  /* nomes sem acentos quebrados nas demais listas de documentos */
  window.KT_JDOCS = {ranking, autoVincula, caixa, abrir, chaves, nomeEv};
})();
