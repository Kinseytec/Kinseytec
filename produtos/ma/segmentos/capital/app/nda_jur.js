/* ================= KINSEY CAPITAL · JURÍDICO · NDA =================
   O NDA sai do dossiê e fica no Jurídico, com o advogado:
   - NDA padrão: importar o modelo da Kinsey (Word, PDF ou texto); o sistema troca os dados da outra parte (razão social,
     CNPJ, endereço, representante e data) por campos automáticos e guarda como modelo oficial;
   - emitir o NDA em Word já preenchido com os dados da empresa (Receita Federal e cadastro): NDA geral ou NDA do
     mandato (investidor), com assinaturas e testemunhas;
   - registrar o NDA assinado (importado aqui ou na Base inicial): o sistema compara com o padrão e diz se está conforme
     ou quais cláusulas foram alteradas, e marca o NDA da empresa como assinado (validação jurídica pendente). */
if (window.KT_DD && window.KT_DOCX && window.KT_MAND) (() => {
  const D = KT_DD, X = KT_DOCX, M = KT_MAND, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const eu = () => Store.me?.email || Store.me?.nome || "";
  const KINSEY_DOCS = typeof MA_KINSEY !== "undefined" ? [...MA_KINSEY.matchAll(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g)].map(m => m[0].replace(/\D/g, "")) : [];

  /* ---------------- modelo ---------------- */
  const oficial = () => S.config.modelos_ma?.nda_geral?.texto?.length ? S.config.modelos_ma.nda_geral : null;
  const modelo = () => { const o = oficial(); return o ? {texto:o.texto, versao:o.versao || "oficial", oficial:true, arquivo:o.arquivo} : {texto:(typeof NDA_TEXT !== "undefined" ? NDA_TEXT : []), versao:"provisório", oficial:false}; };
  const temCampos = T => /\{(EMPRESA|DOC)\}/.test(JSON.stringify(T));
  function dados(s){
    const P = M.partes(s), r = s.receita && !s.receita.erro ? s.receita : {};
    return {EMPRESA:P.EMPRESA, DOC:P.DOC, ENDERECO:P.ENDERECO, REPRESENTANTE:s.nda?.nome || P.REPRESENTANTE, ATIVIDADE:P.ATIVIDADE, CODINOME:s.mandato?.codinome || "[nome-código]",
      KINSEY:window.KT_MARCA && !KT_MARCA.kinsey() ? "[razão social, CNPJ, endereço e representante legal da assessoria]" : (typeof MA_KINSEY !== "undefined" ? MA_KINSEY : "KINSEY BR"),
      DATA:`São Paulo, ${new Date().toLocaleDateString("pt-BR", {day:"numeric", month:"long", year:"numeric"})}`, socios:P._socios || [], situacao:r.situacao || "", fonte:r.em ? `Receita Federal em ${dBR(r.em)}` : "cadastro"};
  }
  const preenche = (t, c) => String(t).replace(/\{([A-Z]+)\}/g, (m, k) => c[k] != null ? c[k] : m);

  /* ---------------- importar o NDA padrão ---------------- */
  async function paragrafos(f){ if (window.KT_OPDOC?.lerArquivo) return KT_OPDOC.lerArquivo(f); const t = await KT_AUTO.texto(f); return String(t).split(/\n+/).map(x => x.trim()).filter(Boolean); }
  function generalizar(P){
    const trocas = []; let feitaParte = false;
    /* títulos colados ao texto ("1. OBJETO As partes...") viram parágrafos próprios */
    P = P.flatMap(p => String(p).split(/\n+/)).flatMap(p => { const m = p.match(/^\s*((?:\d{1,2}(?:\.\d{1,2})*\.?|CL[AÁ]USULA\s+\S+)\s*[-–:.]?\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ ,/&-]{2,70}?)\s+([A-ZÁÉÍÓÚ](?:[a-záéíóúâêôãõç]|\s).*)$/); return m ? [m[1].trim(), m[2]] : [p]; }).map(p => p.trim()).filter(Boolean);
    const out = P.map(p => { let q = p;
      const cnpjs = [...q.matchAll(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g)].map(m => m[0]).filter(c => !KINSEY_DOCS.includes(c.replace(/\D/g, "")));
      if (cnpjs.length && !feitaParte){ feitaParte = true;
        cnpjs.forEach(c => { q = q.replace(c, "{DOC}"); trocas.push(`CNPJ ${c} → CNPJ da empresa`); });
        const i = q.indexOf("{DOC}"), antes = q.slice(0, i), nm = [...antes.matchAll(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 .,&\-]{3,90}?\s(?:LTDA\.?|S\.?\/?A\.?|EIRELI|ME|EPP))/g)].filter(m => !/KINSEY/i.test(m[1])).pop();
        if (nm){ q = q.replace(nm[1], "{EMPRESA}"); trocas.push(`${nm[1]} → razão social da empresa`); }
        const sd = q.match(/com sede (?:em|na|no|à)\s+([^;]{8,160}?)(?=,\s*(?:inscrit|CNPJ|neste|doravante|representad))/i); if (sd && !/kinsey/i.test(sd[1])){ q = q.replace(sd[1], "{ENDERECO}"); trocas.push("endereço → endereço da empresa"); }
        const rp = q.match(/representad[ao]\s+(?:na forma (?:de seu|do) contrato social\s+)?(?:por|pel[oa])\s+(?:(?:seu|sua|s[eu]us?)\s+)?(?:(?:s[oó]ci[oa]s?|diretor(?:a|es)?|administrador(?:a|es)?|procurador(?:a)?)(?:\s+administrador(?:a)?)?\s*,?\s*)?((?:Sr\.?|Sra\.?)?\s*[A-ZÁÉÍÓÚ][a-záéíóúãõçA-ZÁÉÍÓÚ]+(?:\s+(?:de|da|do|dos|das|e|[A-ZÁÉÍÓÚ][a-záéíóúãõçA-ZÁÉÍÓÚ.]+))*)/); if (rp && q.indexOf(rp[1]) > q.indexOf("{DOC}") - 400){ q = q.replace(rp[1], "{REPRESENTANTE}"); trocas.push(`${rp[1].trim()} → representante da empresa`); } }
      const dt = q.match(/(S[ãa]o Paulo|[A-ZÁÉÍÓÚ][a-záéíóúãõç]+(?: [A-ZÁÉÍÓÚ][a-záéíóúãõç]+)*),\s*\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4}/); if (dt){ q = q.replace(dt[0], "{DATA}"); trocas.push("data → data de emissão"); }
      return q; });
    /* blocos: título + texto */
    const tit = p => X.ehTitulo(p) || /^\s*(\d{1,2}(\.\d{1,2})*\.?|cl[aá]usula\s+\S+)\s*[-–:.]?\s*[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ ,/&-]{2,70}$/.test(p);
    const blocos = []; out.forEach(p => { if (tit(p) || !blocos.length) blocos.push([p, ""]); else blocos[blocos.length - 1][1] = (blocos[blocos.length - 1][1] ? blocos[blocos.length - 1][1] + "\n" : "") + p; });
    return {blocos:blocos.filter(b => b[0] || b[1]), trocas};
  }
  function importarPadrao(){
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".docx,.pdf,.txt";
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; let P = []; try{ P = await paragrafos(f); }catch(e){ toast("Não consegui ler o arquivo: use Word, PDF com texto ou TXT."); return; }
      if (P.join(" ").length < 300){ toast("Texto curto demais ou PDF digitalizado: envie o Word do NDA."); return; }
      const G = generalizar(P);
      const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Jurídico · NDA</div><h2>NDA padrão da Kinsey</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
        <form class="sheet-b" id="np-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
          <p class="sub" style="margin:0">${esc(f.name)} · ${G.blocos.length} cláusula(s). ${G.trocas.length ? "Dados da outra parte trocados por campos automáticos:" : "Nenhum dado de empresa encontrado: os dados da empresa entram no preâmbulo ao emitir."}</p>
          ${G.trocas.length ? `<ul style="margin:0;padding-left:18px">${G.trocas.map(x => `<li style="font-size:12.5px">${esc(x)}</li>`).join("")}</ul>` : ""}
          <div class="fld"><label for="np-v">Versão</label><input id="np-v" value="v1.0 · ${new Date().toLocaleDateString("pt-BR")}"></div>
          <details><summary class="sub">Ver o texto do modelo</summary><pre style="white-space:pre-wrap;font-size:12px">${esc(G.blocos.map(([h, t]) => h + "\n" + t).join("\n\n"))}</pre></details>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar como NDA padrão</button></div></form>`);
      $("#np-f").onsubmit = async e => { e.preventDefault(); await save(Store.set("config", "modelos_ma", {...(S.config.modelos_ma || {}), nda_geral:{versao:$("#np-v").value.trim() || "oficial", texto:G.blocos, arquivo:f.name, em:nowISO(), por:eu()}})); close(); toast("NDA padrão salvo"); renderJuridico(); }; };
    inp.click();
  }

  /* ---------------- emitir (Word) ---------------- */
  function word(s, tipo){
    const c = dados(s), m = modelo(), P = [], t = (x, o = {}) => P.push({t:x, ...o});
    const inv = tipo === "mandato", mand = inv ? supById(S.ndaMand) : null; if (inv) c.CODINOME = mand?.mandato?.codinome || "[nome-código do mandato]";
    t(inv ? "ACORDO DE CONFIDENCIALIDADE · MANDATO " + c.CODINOME.toUpperCase() : "ACORDO DE CONFIDENCIALIDADE E NÃO DIVULGAÇÃO (NDA)", {b:true, jc:"center", sz:26, after:240});
    const texto = inv ? (MA_MODELOS.find(x => x.id === "nda_mandato")?.texto || []) : m.texto;
    if (!temCampos(texto)) t(`Pelo presente instrumento, de um lado ${c.KINSEY} ("Kinsey BR"), e de outro lado ${c.EMPRESA}, inscrita no CNPJ sob o nº ${c.DOC}, com sede em ${c.ENDERECO}, neste ato representada por ${c.REPRESENTANTE} ("Parte Receptora"), têm entre si justo e acordado o presente Acordo de Confidencialidade${inv ? ` referente ao mandato ${c.CODINOME}` : ""}, que se regerá pelas cláusulas a seguir.`);
    texto.forEach(([h, x]) => { if (h) t(preenche(h, c), {b:true, keep:true, before:160}); String(preenche(x, c)).split("\n").forEach(l => l.trim() && t(l)); });
    if (!JSON.stringify(texto).includes("{DATA}")) t(c.DATA + ".", {before:240});
    const ass = (n, p) => { P.push({t:"______________________________________________", jc:"left", before:420, after:0}); t(n, {b:true, jc:"left", after:0}); t(p, {jc:"left"}); };
    ass(window.KT_MARCA && !KT_MARCA.kinsey() ? "[ASSESSORIA]" : "KINSEY BR", "Kinsey BR"); ass(c.EMPRESA, `${c.REPRESENTANTE} · representante legal`);
    t("Testemunhas:", {b:true, before:300}); ass("Nome: [testemunha 1]", "CPF: [CPF]"); ass("Nome: [testemunha 2]", "CPF: [CPF]");
    const bytes = X.build(P, {header:`NDA · ${c.EMPRESA} · ${m.oficial && !inv ? "modelo " + m.versao : inv ? "NDA do mandato" : "modelo provisório"} · confidencial`, headerColor:"5A6578", titulo:`NDA · ${c.EMPRESA}`});
    return {bytes, nome:`NDA_${String(s.mandato?.codinome || s.nome || "empresa").replace(/[^\wÀ-ú]+/g, "_").slice(0, 40)}.docx`};
  }
  async function emitir(s, tipo){ const w = word(s, tipo); await rptSave(w.bytes, w.nome, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    await D.up(s, {nda:{...(s.nda?.aceito ? {} : {status:"enviado"}), emitido:{em:nowISO(), por:eu(), versao:modelo().versao, tipo}}}); toast("NDA emitido em Word"); }

  /* ---------------- NDA assinado: conformidade com o padrão ---------------- */
  const tokens = t => new Set(nrm(t).replace(/\{[a-z]+\}|\[[^\]]*\]|\d+/g, " ").split(/[^a-z]+/).filter(w => w.length > 3));
  function comparar(paras){
    const m = modelo(); if (!m.texto.length) return null; const doc = tokens(paras.join(" ")), dif = [];
    m.texto.forEach(([h, x]) => { const T = tokens(h + " " + x); if (T.size < 6) return; let c = 0; T.forEach(w => { if (doc.has(w)) c++; }); const r = c / T.size; if (r < .8) dif.push({clausula:h || String(x).slice(0, 60), pct:Math.round(r * 100)}); });
    const tot = m.texto.filter(([h, x]) => tokens(h + " " + x).size >= 6).length;
    return {versao:m.versao, oficial:m.oficial, conforme:dif.length === 0, pct:tot ? Math.round((tot - dif.length) / tot * 100) : 0, dif};
  }
  async function registrar(s, f, paras, o = {}){
    paras = paras || await paragrafos(f); const t = paras.join(" "), C = comparar(paras), L = KT_AUTO?.lerNda ? KT_AUTO.lerNda(t) : {};
    let arq = null; if (!o.semEvid) try{ const up = await Store.upload(f); arq = {...up, nome:f.name}; await salvarEvid(uid(), {supplierId:s.id, tipo:"NDA assinado", obs:"NDA assinado registrado no Jurídico", ...up, mime:f.type, nome:f.name, criadoEm:nowISO(), criadoPor:Store.me?.id || "", origem:"Jurídico · NDA"}, f); }catch(e){}
    await D.up(s, {nda:{aceito:true, status:"assinado", doc:f.name, em:nowISO(), versao:C ? (C.conforme ? `padrão Kinsey (${C.versao})` : `com alterações em relação ao padrão (${C.versao})`) : "documento importado", validado:false,
      conformidade:C, assinaturaEletronica:!!L.ass, prazo:L.prazo || "", naoAbordagem:!!L.naoAbordagem, multa:!!L.multa, registradoPor:eu()}});
    return C;
  }
  function registrarArquivo(s){ const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".docx,.pdf,.txt";
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; try{ const C = await registrar(s, f); toast(C ? (C.conforme ? "NDA assinado conforme o padrão" : `NDA assinado com ${C.dif.length} cláusula(s) diferente(s) do padrão`) : "NDA registrado"); renderJuridico(); }catch(e){ console.error(e); toast("Não foi possível ler o NDA."); } };
    inp.click(); }

  /* ---------------- tela: Jurídico · NDA ---------------- */
  const ST = s => s.nda?.aceito ? (s.nda.validado ? ["Assinado e validado", "r-baixo"] : ["Assinado · validar", "r-medio"]) : s.nda?.status === "enviado" || s.nda?.emitido ? ["Enviado", "r-medio"] : ["Pendente", "r-pend"];
  function painel(host){
    const m = modelo(), ed = D.ed(), L = S.suppliers.slice().sort((a, b) => a.nivel.localeCompare(b.nivel) || (a.nome || "").localeCompare(b.nome || "", "pt"));
    if (S._ndaRef !== S.jurAlvo){ S._ndaRef = S.jurAlvo; if (S.jurAlvo) S.ndaSel = S.jurAlvo; } /* segue a empresa em consulta */
    let s = supById(S.ndaSel) || supById(S.jurAlvo) || supById(S.mandAlvo) || L.find(x => x.nivel === "N3"); if (s) S.ndaSel = s.id;
    const c = s ? dados(s) : null, N = s?.nda || {}, mands = S.suppliers.filter(x => x.nivel === "N3" && x.mandato?.codinome);
    const el = document.createElement("div"); el.id = "jur-nda"; el.style.cssText = "display:flex;flex-direction:column;gap:14px";
    const linha = (k, v) => `<tr><td style="white-space:nowrap">${k}</td><td>${/^\[/.test(String(v)) ? `<span class="pill r-alto">a completar</span> <span class="sub" style="font-size:12px">${esc(v)}</span>` : esc(v)}</td></tr>`;
    el.innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Jurídico · NDA</div><h3 style="margin:0">NDA padrão</h3>
          <p class="sub" style="margin:2px 0 0">${m.oficial ? `Modelo oficial ${esc(m.versao)}${oficial().arquivo ? ` · ${esc(oficial().arquivo)}` : ""} · ${m.texto.length} cláusula(s)` : "Modelo provisório do sistema: importe o NDA padrão da Kinsey para usar o texto oficial."}</p></div></div>
        ${ed ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="nd-imp">Importar NDA padrão (Word ou PDF)</button>${m.oficial ? `<button type="button" class="btn sm ghost" id="nd-prov">Voltar ao provisório</button>` : ""}</div>` : ""}</div>
      ${s ? `<div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Emitir NDA</h3>
        <div class="form"><div class="fld full"><label for="nd-sel">Empresa</label><select id="nd-sel">${L.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${x.nivel} · ${esc(x.mandato?.codinome ? x.mandato.codinome + " · " : "")}${esc(x.nome)}</option>`).join("")}</select></div>
          ${s.nivel === "N1" ? `<div class="fld full"><label for="nd-man">NDA do mandato (opcional)</label><select id="nd-man"><option value="">NDA geral</option>${mands.map(x => `<option value="${x.id}" ${x.id === S.ndaMand ? "selected" : ""}>${esc(x.mandato.codinome)}</option>`).join("")}</select></div>` : ""}</div>
        <div class="tbl"><table><tbody>${linha("Razão social", c.EMPRESA)}${linha("CNPJ", c.DOC)}${linha("Endereço", c.ENDERECO)}${linha("Representante", c.REPRESENTANTE)}${c.socios.length ? linha("Sócios", c.socios.map(p => p.nome).join("; ")) : ""}${linha("Fonte", c.fonte + (c.situacao ? ` · situação ${c.situacao}` : ""))}</tbody></table></div>
        <p class="sub" style="margin:0;font-size:12.5px">Os dados vêm da consulta à Receita Federal e do cadastro; o que faltar sai em amarelo no Word.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="nd-emit">Emitir NDA (Word)</button>${ed ? `<button type="button" class="btn" id="nd-ass">Registrar NDA assinado</button>` : ""}<button type="button" class="btn ghost" id="nd-dos">Abrir dossiê</button></div>
        <div style="font-size:13px">Situação: <span class="pill ${ST(s)[1]}">${ST(s)[0]}</span>${N.emitido ? ` · emitido em ${dBR(N.emitido.em)}` : ""}${N.aceito ? ` · ${esc(N.versao || "")}${N.doc ? ` · ${esc(N.doc)}` : ""}` : ""}</div>
        ${N.conformidade && !N.conformidade.conforme ? `<div class="banner" style="font-size:13px"><b>Diferenças em relação ao NDA padrão (${N.conformidade.pct}% conforme):</b><ul style="margin:6px 0 0;padding-left:18px">${N.conformidade.dif.map(d => `<li>${esc(d.clausula)} · ${d.pct}% do texto do padrão</li>`).join("")}</ul></div>` : N.conformidade?.conforme ? `<div class="banner" style="font-size:13px;border-color:rgba(54,211,153,.45)">NDA assinado conforme o padrão (${esc(N.conformidade.versao)}).</div>` : ""}
        ${N.aceito && !N.validado && ed ? `<div><button type="button" class="btn sm" id="nd-val">Validar (advogado)</button></div>` : ""}</div>` : `<div class="empty">Nenhuma empresa cadastrada.</div>`}
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:0">NDAs por empresa</h3>
        <div class="tbl" style="max-height:360px;overflow:auto"><table><thead><tr><th>Empresa</th><th>NDA</th><th>Data</th></tr></thead><tbody>${L.map(x => `<tr data-nds="${x.id}" style="cursor:pointer"><td><b>${esc(x.nome)}</b> <span class="sub" style="font-size:11.5px">${x.nivel}</span></td><td><span class="pill ${ST(x)[1]}">${ST(x)[0]}</span></td><td>${x.nda?.em ? dBR(x.nda.em) : x.nda?.emitido ? dBR(x.nda.emitido.em) : "—"}</td></tr>`).join("")}</tbody></table></div></div>`;
    host.appendChild(el);
    const b = id => $(id, el);
    if (b("#nd-imp")) b("#nd-imp").onclick = importarPadrao;
    if (b("#nd-prov")) b("#nd-prov").onclick = async () => { if (!confirm("Voltar ao modelo provisório do sistema?")) return; const o = {...(S.config.modelos_ma || {})}; delete o.nda_geral; await save(Store.set("config", "modelos_ma", o)); renderJuridico(); };
    if (b("#nd-sel")) b("#nd-sel").onchange = e => { const v = e.target.value; S.ndaSel = v; if (supById(v)?.nivel === "N3"){ S.jurAlvo = v; S._ndaRef = S.jurAlvo; } renderJuridico(); };
    if (b("#nd-man")) b("#nd-man").onchange = e => { S.ndaMand = e.target.value; };
    if (b("#nd-emit")) b("#nd-emit").onclick = () => emitir(s, s.nivel === "N1" && S.ndaMand ? "mandato" : "geral").catch(e => { console.error(e); toast("Não foi possível emitir o NDA."); });
    if (b("#nd-ass")) b("#nd-ass").onclick = () => registrarArquivo(s);
    if (b("#nd-dos")) b("#nd-dos").onclick = () => openSupplier(s.id);
    if (b("#nd-val")) b("#nd-val").onclick = async () => { await D.up(s, {nda:{validado:true, validadoPor:eu(), validadoEm:nowISO()}}); toast("NDA validado"); renderJuridico(); };
    $$("[data-nds]", el).forEach(tr => tr.onclick = () => { S.ndaSel = tr.dataset.nds; renderJuridico(); });
  }
  if (typeof renderJuridico === "function"){ const _jr = renderJuridico;
    renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return; const tabs = host.querySelector(".dd-tabs"); if (!tabs) return;
      const bt = document.createElement("button"); bt.type = "button"; bt.className = "fbtn"; bt.dataset.jur = "nda"; bt.textContent = "NDA"; bt.setAttribute("aria-pressed", String(S.jurTab === "nda"));
      const ref = tabs.querySelector('[data-jur="mand"]') || tabs.querySelector('[data-jur="docs"]'); if (ref) ref.before(bt); else tabs.appendChild(bt); bt.onclick = () => { S.jurTab = "nda"; renderJuridico(); };
      if (S.jurTab !== "nda") return; tabs.querySelectorAll("[data-jur]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.jur === "nda")));
      const top = tabs.closest("#juridico > *") || tabs.parentElement; while (top.nextSibling) top.nextSibling.remove();
      try{ painel(host); }catch(e){ console.error(e); host.insertAdjacentHTML("beforeend", `<div class="empty">Não foi possível montar o NDA.</div>`); } };
  }
  /* dossiê: sem a aba NDA / LGPD; a situação do NDA aparece na aba M&A com atalho para o Jurídico */
  if (typeof TABS !== "undefined"){ const i = TABS.findIndex(t => t[0] === "lgpd"); if (i >= 0) TABS.splice(i, 1); }
  const irNda = id => { S.jurTab = "nda"; S.ndaSel = id; $("#layer").innerHTML = ""; S.openSup = null; go("juridico"); };
  if (typeof openSupplier === "function"){ const _os = openSupplier; openSupplier = function(id, tab){ if (tab === "lgpd") return irNda(id); if (!tab && S.supTab === "lgpd") S.supTab = "dados"; return _os.apply(this, arguments); }; }
  if (typeof setTab === "function"){ const _st = setTab; setTab = function(t){ if (t === "lgpd") return irNda(S.openSup); if (!TABS.some(x => x[0] === t)) t = "dados"; return _st.call(this, t); }; }
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap";
    el.innerHTML = `<div><b>NDA</b> <span class="pill ${ST(s)[1]}">${ST(s)[0]}</span>${s.nda?.conformidade && !s.nda.conformidade.conforme ? ` <span class="sub" style="font-size:12px">com alterações em relação ao padrão</span>` : ""}</div><button type="button" class="btn sm" data-nd-ir>NDA no Jurídico</button>`;
    (b.firstElementChild || b).prepend(el); el.querySelector("[data-nd-ir]").onclick = () => irNda(s.id); };
  window.KT_NDA = {modelo, dados, word, emitir, comparar, registrar, generalizar, importarPadrao};
})();
