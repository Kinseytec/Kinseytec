/* ================= PREENCHIMENTO AUTOMÁTICO · KinseyTec – M&A =================
   O consultor não redigita o que já está nos documentos:
   - balancetes → receita, EBITDA normalizado (ajustes com OK), dívida líquida, ano, data-base e regime tributário;
   - consulta do CNPJ → local, segmento (pelo CNAE), CNAE e ano de fundação;
   - mandato importado (PDF ou Word) → situação, success fee, retainer, prazo, exclusividade, cauda, mínimo e
     co-contratados, e o registro do documento no Jurídico (Contratos e pareceres);
   - NDA importado → registro do NDA (assinado ou a validar).
   Só preenche campo vazio ou que veio de preenchimento automático; o que o consultor digitou prevalece. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const num2 = s => { const x = parseFloat(String(s).replace(/\./g, "").replace(",", ".")); return isFinite(x) ? x : null; };
  const dig = v => String(v || "").replace(/\D/g, "");
  const CNAE_SEG = [[/^0[1-3]/, "Agro"], [/^1[01]/, "Alimentos"], [/^(58|6[1-3])/, "Tecnologia"], [/^(21|8[6-8]|4644|4645|4771|4773)/, "Saúde"], [/^85/, "Educação"], [/^(0[5-9]|19|3[5-7])/, "Energia"],
    [/^(49|5[0-3])/, "Logística"], [/^4[5-7]/, "Varejo"], [/^(4[1-3]|68)/, "Construção"], [/^(1[2-9]|2\d|3[0-3])/, "Industrial"]];
  const segCnae = c => (CNAE_SEG.find(([re]) => re.test(dig(c).padStart(7, "0"))) || [, "Serviços"])[1];

  /* ---------------- leitura do mandato ---------------- */
  function lerMandato(texto, s){
    const t = String(texto || "").replace(/\s+/g, " "), n = nrm(t), m = {}, achou = [];
    const pct = t.match(/(\d{1,2}(?:[.,]\d{1,2})?)\s*%\s*(?:\([^)]{0,40}\))?\s*(?:d[oa]|sobre o)\s*(?:valor|pre[cç]o|enterprise|equity|montante)[^.;]{0,40}/i);
    if (pct){ const div = [...t.matchAll(/(\d{1,2}(?:[.,]\d{1,2})?)\s*%\s*(?:\([^)]{0,30}\))?[^.;]{0,60}?(?:devid[ao]s?|pag[oa]s?|caber[aá]|destinad[ao]s?)[^.;]{0,20}?(?:à|a|ao)\s+([A-ZÁ-Ú][A-ZÁ-Ú0-9 .&-]{3,60}?(?:LTDA|S\.?\/?A\.?|BR|ME)\b)/g)].map(x => `${x[1]}% ${x[2].trim()}`);
      m.success = `${pct[1].replace(".", ",")}% ${pct[0].replace(/^[^%]*%\s*(?:\([^)]*\)\s*)?/, "").split(/[,;]| exclusivamente| observad/)[0].trim()}`.slice(0, 90) + (div.length ? ` (${[...new Set(div)].slice(0, 3).join(" + ")})` : ""); achou.push("success fee"); }
    if (/n[aã]o sendo devida qualquer remunera[cç][aã]o fixa|sem (retainer|remunera[cç][aã]o fixa)|n[aã]o (ser[aá]|h[aá]) (devid[ao] )?(retainer|mensalidade)/i.test(t)){ m.retainer = "Sem retainer"; achou.push("retainer"); }
    else { const r = t.match(/(?:retainer|remunera[cç][aã]o (?:fixa|mensal)|mensalidade)[^.;]{0,120}?R\$\s*([\d.]+(?:,\d{2})?)/i); if (r){ m.retainer = "R$ " + r[1]; achou.push("retainer"); } }
    if (/n[aã]o[- ]exclusiv/i.test(t)){ m.exclusividade = "Não exclusivo"; achou.push("exclusividade"); } else if (/(car[aá]ter|regime|base) (de )?exclusiv|com exclusividade|exclusividade (pelo|durante|por)/i.test(t)){ m.exclusividade = "Exclusivo"; achou.push("exclusividade"); }
    const pr = t.match(/(?:prazo de (?:vig[eê]ncia|dura[cç][aã]o)|vig[eê]ncia (?:deste contrato |do contrato )?(?:ser[aá] )?de|vigorar[aá] (?:pelo prazo de|por))\s*(\d{1,3})\s*(?:\([^)]{0,25}\))?\s*meses/i); if (pr){ m.prazo = pr[1]; achou.push("prazo"); }
    const tl = t.match(/(?:ap[oó]s o (?:t[eé]rmino|encerramento|fim)|t[eé]rmino deste contrato)[^.]{0,160}?(\d{1,3})\s*(?:\([^)]{0,25}\))?\s*meses/i); if (tl){ m.tail = `${tl[1]} meses após o término`; achou.push("cauda"); }
    if (/(eliminar|excluir|sem|n[aã]o haver[aá]) (a )?remunera[cç][aã]o m[ií]nima/i.test(t)) { m.minimo = "Sem remuneração mínima"; achou.push("mínimo"); }
    else { const mn = t.match(/remunera[cç][aã]o (?:de sucesso )?m[ií]nima[^.;]{0,80}?R\$\s*([\d.,]+)\s*(milh[oõ]es|mil)?/i); if (mn){ m.minimo = `R$ ${mn[1]}${mn[2] ? " " + mn[2] : ""}`; achou.push("mínimo"); } }
    const part = t.match(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:\([^)]{0,30}\))?\s*(?:das|do) (quotas|a[cç][oõ]es|capital social|participa[cç][aã]o)/i); if (part){ m.participacao = `${part[1]}% ${part[2]}`; achou.push("participação"); }
    const ass = /assinad[oa] (eletronicamente|digitalmente)|docusign|clicksign|d4sign|certificado digital icp|assinatura digital/i.test(t) && !/minuta|ajustes|proposta de redac|em negocia/i.test(t);
    m.status = ass ? "assinado" : /ajuste|minuta|negocia|revis[aã]o|coment[aá]rio/i.test(n) ? "negociacao" : "enviado"; achou.push("situação");
    const dt = t.match(/(\d{1,2}) de (janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (20\d\d)/i);
    if (ass && dt){ const mes = ["janeiro","fevereiro","marco","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"].indexOf(nrm(dt[2])) + 1; m.assinadoEm = `${dt[3]}-${String(mes).padStart(2, "0")}-${dt[1].padStart(2, "0")}`; }
    const nomeAlvo = nrm(s?.nome || "").split(" ")[0];
    const co = [...new Set([...t.matchAll(/\b([A-ZÁ-Ú][A-ZÁ-Ú0-9.&-]+(?: [A-ZÁ-Ú0-9.&-]+){0,6} (?:LTDA|S\.?\/?A\.?))\b/g)].map(x => x[1].trim()))].filter(x => !/KINSEY/.test(x) && !(nomeAlvo && nrm(x).includes(nomeAlvo))).slice(0, 4);
    return {m, achou, co};
  }
  function lerNda(texto){
    const t = String(texto || "").replace(/\s+/g, " ");
    const ass = /assinad[oa] (eletronicamente|digitalmente)|docusign|clicksign|d4sign|certificado digital|assinatura digital/i.test(t);
    const prazo = t.match(/(?:prazo|vig[eê]ncia)[^.;]{0,60}?(\d{1,2})\s*(?:\([^)]{0,20}\))?\s*(anos|meses)/i);
    return {ass, prazo:prazo ? `${prazo[1]} ${prazo[2]}` : "", multa:/multa|penalidade/i.test(t), naoAbordagem:/n[aã]o (abordagem|aliciamento|solicita[cç][aã]o)/i.test(t)};
  }
  const texto = async f => { try{ if (typeof DOCAN !== "undefined" && DOCAN.texto){ const t = await DOCAN.texto(f, f.name); if (t) return t; } }catch(e){}
    const buf = await f.arrayBuffer(), lin = L => (L || []).map(l => Array.isArray(l) ? l.join(" ") : String(l)).join("\n");
    if (/\.docx$/i.test(f.name)){ const d = await IMP.lerDOCX(buf); return lin(d.linhas) + "\n" + lin(d.tabela); } if (/\.pdf$/i.test(f.name)) return lin(await IMP.lerPDF(buf)); return new TextDecoder().decode(buf); };
  const escolher = (accept, fn) => { const i = document.createElement("input"); i.type = "file"; i.accept = accept; i.onchange = () => i.files[0] && fn(i.files[0]); i.click(); };
  const ROT = {status:"Situação", success:"Success fee", retainer:"Retainer", exclusividade:"Exclusividade", prazo:"Prazo (meses)", tail:"Cauda", minimo:"Mínimo", participacao:"Participação", assinadoEm:"Assinado em"};
  const STN = {assinado:"Assinado", negociacao:"Em negociação", enviado:"Enviado ao target", minuta:"Minuta em preparação"};

  async function importarMandato(s){
    escolher(".pdf,.docx,.txt", async f => { let t = ""; try{ t = await texto(f); }catch(e){} if (!t || t.trim().length < 50){ toast("Não consegui ler o texto do documento."); return; }
      const {m, achou, co} = lerMandato(t, s);
      IMP.confirma(`<b>Mandato lido: ${esc(f.name)}</b><dl class="kv" style="margin-top:8px">${Object.entries(m).map(([k, v]) => `<dt>${ROT[k] || k}</dt><dd>${esc(k === "status" ? STN[v] || v : v)}</dd>`).join("")}${co.length ? `<dt>Partes citadas</dt><dd>${esc(co.join("; "))}</dd>` : ""}</dl><p class="sub" style="margin:8px 0 0">Os campos lidos preenchem o mandato e o documento entra no Jurídico (Contratos e pareceres) para o parecer. Confira antes de assinar.</p>`, "Preencher mandato", "", async () => {
        const id = "ct" + Date.now().toString(36);
        await Store.set("contracts", id, {supplierId:s.id, tipo:`Mandato de assessoria${m.status === "assinado" ? "" : " (não assinado)"}`, numero:"", contraparte:s.nome, inicio:m.assinadoEm || "", fim:"", volume:"", preco:"", obs:`Importado de ${f.name}. Campos lidos: ${achou.join(", ")}.${co.length ? " Partes citadas: " + co.join("; ") + "." : ""}`, texto:t.slice(0, 60000), arquivo:f.name, file:null, criadoEm:nowISO()});
        const patch = {mandato:{...m, fonte:"documento", doc:id, codinome:s.mandato?.codinome || "", ...(m.status !== "assinado" ? {assinadoEm:""} : {})}}; if (m.status === "assinado") patch.etapa = s.etapa && FUNIL_I(s.etapa) > FUNIL_I("mandato") ? s.etapa : "mandato";
        await Store.update("suppliers", s.id, patch); toast("Mandato preenchido e enviado ao Jurídico"); }); });
  }
  async function importarNda(s){
    escolher(".pdf,.docx,.txt", async f => { let t = ""; try{ t = await texto(f); }catch(e){} const r = lerNda(t);
      await Store.update("suppliers", s.id, {nda:{...(s.nda || {}), aceito:r.ass || !!s.nda?.aceito, doc:f.name, em:nowISO(), versao:"documento importado", validado:false, prazo:r.prazo, naoAbordagem:r.naoAbordagem, multa:r.multa}});
      toast(r.ass ? "NDA assinado registrado: aguarda validação do Jurídico" : "NDA registrado sem assinatura identificada: aguarda validação"); });
  }
  const FUNIL_I = k => (typeof MA_FUNIL !== "undefined" ? MA_FUNIL : []).findIndex(x => x[0] === k);

  /* botões no dossiê (aba M&A) */
  const _ma = EXT_TABS.ma;
  if (_ma) EXT_TABS.ma = (s, b, r) => { _ma(s, b, r); if (s.nivel !== "N3") return; const f = b.querySelector("#ma-m"); if (!f || f.querySelector("[data-imp-m]")) return;
    const bar = document.createElement("div"); bar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;align-items:center";
    const m = s.mandato || {};
    bar.innerHTML = `<button type="button" class="btn sm primary" data-imp-m>Importar mandato (PDF ou Word)</button><button type="button" class="btn sm" data-imp-n>Importar NDA</button><span class="sub" style="margin:0;font-size:12px">${m.fonte === "documento" ? "Preenchido pelo documento importado; edite se precisar." : "O sistema lê o documento e preenche os campos."}${m.tail ? " · Cauda: " + esc(m.tail) : ""}${m.minimo ? " · " + esc(m.minimo) : ""}</span>`;
    f.insertBefore(bar, f.children[1] || null);
    bar.querySelector("[data-imp-m]").onclick = () => importarMandato(s); bar.querySelector("[data-imp-n]").onclick = () => importarNda(s); };

  /* ---------------- sincronização automática (balancetes, CNPJ, documentos do Jurídico) ---------------- */
  const vazio = v => v == null || v === "" || (Array.isArray(v) && !v.length);
  function patchDe(s){
    const p = {}, pf = {}, fin = {}, man = {};
    /* balancetes: último exercício completo (ou o mais recente), EBITDA com os ajustes que já têm OK */
    try{ if (D.temBal(s)){ const P = D.periodos(s), anuais = P.filter(x => +(s.dd.bal[x].meses || 12) === 12), per = (anuais.length ? anuais : P).sort().pop(), b = s.dd.bal[per], K = D.calc(b), A = D.soma(D.ajustes(s, per).filter(D.okVal));
      const r = v => Math.round(v / 1e4) / 100, alvo = {ano:+String(b.dataBase || per).slice(0, 4), receita:r(K.recLiq), ebitda:r(K.ebitda + A.ebitda), divLiq:r(K.dl + A.divida), fonte:"balancete " + per};
      const f0 = s.fin || {}; if (f0.fonte !== alvo.fonte || ["receita","ebitda","divLiq","ano"].some(k => Math.abs((+f0[k] || 0) - alvo[k]) > .005)) if (!f0.manual) Object.assign(fin, alvo);
      const pfx = s.perfil || {};
      if (vazio(pfx.dataBase)) pf.dataBase = String(b.dataBase || per + "-28").slice(0, 10);
      if (vazio(pfx.regime)){ const lair = K.lair, ir = K.ir; if (s.receita?.simples) pf.regime = "Simples Nacional"; else if (lair > 0 && ir / lair > .2 && ir / lair < .45) pf.regime = "Lucro real"; } } }catch(e){}
    /* CNPJ consultado */
    const rf = s.receita && !s.receita.erro ? s.receita : null;
    if (rf){ if (vazio(s.municipio) && rf.municipio) p.municipio = rf.municipio.replace(/\b\w/g, c => c.toUpperCase()).replace(/\b(De|Da|Do|Dos|Das)\b/g, x => x.toLowerCase());
      if (vazio(s.uf) && rf.uf) p.uf = rf.uf; if (vazio(s.cnae) && rf.cnae) p.cnae = `${rf.cnae} · ${rf.cnaeDesc || ""}`.trim();
      const seg = segCnae(rf.cnae); if (vazio(s.segmento) && s.nivel === "N3") p.segmento = seg;
      if (s.nivel === "N3"){ if (vazio(s.perfil?.segmento)) pf.segmento = s.segmento || seg; if (vazio(s.perfil?.fundacao) && rf.abertura) pf.fundacao = String(rf.abertura).slice(0, 4); } }
    /* documentos do Jurídico: mandato com texto preenche o que estiver vazio */
    const ct = S.contracts.filter(k => k.supplierId === s.id && /mandato/i.test(k.tipo || "") && k.texto).sort((a, b) => String(b.criadoEm).localeCompare(a.criadoEm))[0];
    if (ct && s.nivel === "N3"){ const {m} = lerMandato(ct.texto, s), m0 = s.mandato || {};
      Object.entries(m).forEach(([k, v]) => { if (k === "status"){ if (vazio(m0.status) || (m0.fonte !== "manual" && m0.status === "assinado" && v !== "assinado" && !m0.assinadoEm)) man.status = v; } else if (vazio(m0[k])) man[k] = v; });
      if (Object.keys(man).length){ man.fonte = "documento"; man.doc = ct.id; } }
    if (Object.keys(fin).length) p.fin = fin; if (Object.keys(pf).length) p.perfil = pf; if (Object.keys(man).length) p.mandato = man;
    return p;
  }
  let tm = null, rodando = false;
  async function sincronizar(){
    if (rodando || !Store.me || Store.me.canWrite === false) return; rodando = true;
    try{ for (const s of S.suppliers.filter(x => x.nivel === "N3" || x.receita)){ const p = patchDe(s); if (Object.keys(p).length) await Store.update("suppliers", s.id, p).catch(() => {}); } }
    finally{ rodando = false; }
  }
  const _ra = renderAll; renderAll = function(){ const r = _ra.apply(this, arguments); clearTimeout(tm); tm = setTimeout(() => sincronizar(), 1200); return r; };
  /* o que o consultor salva à mão no mandato e nos dados deixa de ser sobrescrito */
  const _upd = Store.update.bind(Store);
  document.addEventListener("submit", e => { const id = e.target?.id; if (id === "ma-m" || id === "ma-f"){ const s = supById(S.openSup); if (!s) return; setTimeout(() => _upd("suppliers", s.id, id === "ma-m" ? {mandato:{fonte:"manual"}} : {fin:{manual:true}}).catch(() => {}), 300); } }, true);

  window.KT_AUTO = {lerMandato, lerNda, patchDe, sincronizar, texto};
})();
