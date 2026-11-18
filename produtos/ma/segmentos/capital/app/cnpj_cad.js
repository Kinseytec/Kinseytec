/* ================= KINSEY CAPITAL · CNPJ NO CADASTRO =================
   O CNPJ é obrigatório no cadastro de empresas brasileiras (aceito com ou sem pontos):
   - digitou os 14 números, o sistema consulta a Receita e preenche razão social, cidade, UF, segmento e o tipo de negócio
     pelo CNAE; o cartão CNPJ (PDF) também pode ser importado direto no cadastro;
   - não deixa duplicar: o mesmo CNPJ abre o cadastro existente; uma empresa já importada só com o nome (sem CNPJ) é
     completada, em vez de virar um segundo registro;
   - "Unificar duplicados": junta os registros da mesma empresa (um com CNPJ e outro só com o nome), levando dados,
     investidores, documentos e ligações para o registro com CNPJ;
   - ao salvar, as consultas automáticas (Receita, listas oficiais, CVM, B3, notícias da empresa e dos sócios) começam
     sozinhas e alimentam a investigação, o risco e as demais áreas. */
if (window.KT_DD) (() => {
  const dg = v => String(v || "").replace(/\D/g, "");
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const SUF = new Set(["ltda", "sa", "s", "a", "me", "epp", "eireli", "cia", "companhia", "limitada", "the", "de", "da", "do", "das", "dos", "e", "em", "grupo", "holding", "brasil", "brazil", "participacoes", "empreendimentos"]);
  const toks = t => nrm(t).replace(/s\/a|s\.a\./g, " sa ").split(/[^a-z0-9]+/).filter(w => w.length > 1 && !SUF.has(w));
  const nomesDe = s => [s.nome, s.razao, s.receita?.razao, s.receita?.fantasia, s.fantasia].filter(Boolean);
  const semCnpj = s => dg(s.doc).length !== 14;
  const brasileira = s => !s.pais || /^bra/i.test(s.pais);
  /* mesmo nome: iguais sem os sufixos, ou todas as palavras do mais curto no mais longo começando pela mesma palavra */
  function mesmoNome(a, b){
    const A = toks(a), B = toks(b); if (!A.length || !B.length) return false;
    if (A.join(" ") === B.join(" ")) return true;
    const [c, l] = A.length <= B.length ? [A, B] : [B, A];
    return c[0] === l[0] && c[0].length >= 4 && c.every(w => l.includes(w));
  }
  const parecidos = (s, t) => nomesDe(s).some(a => nomesDe(t).some(b => mesmoNome(a, b)));
  /* registro já existente: pelo CNPJ ou, sem CNPJ, pelo nome */
  function existente(doc, nomes, exceto, nivel){
    const d = dg(doc);
    const porDoc = d.length === 14 ? S.suppliers.find(x => x.id !== exceto && dg(x.doc) === d) : null; if (porDoc) return {s:porDoc, por:"cnpj"};
    const alvo = {nome:nomes[0], receita:{razao:nomes[1], fantasia:nomes[2]}};
    const porNome = S.suppliers.filter(x => x.id !== exceto && semCnpj(x) && (!nivel || x.nivel === nivel) && parecidos(x, alvo));
    return porNome.length ? {s:porNome[0], por:"nome", todos:porNome} : null;
  }
  /* segmento e tipo de negócio pelo CNAE */
  const SEG = [[/^0[1-3]/, "Agro"], [/^1[01]/, "Alimentos"], [/^(58|6[1-3])/, "Tecnologia"], [/^(21|8[6-8]|4644|4771)/, "Saúde"], [/^85/, "Educação"], [/^(0[5-9]|19|3[5-7])/, "Energia"],
    [/^(49|5[0-3])/, "Logística"], [/^4[5-7]/, "Varejo"], [/^(4[1-3]|68)/, "Construção"], [/^(1[2-9]|2\d|3[0-3])/, "Industrial"]];
  const segCnae = c => { c = dg(c).padStart(7, "0"); if (!+c) return ""; return (SEG.find(([re]) => re.test(c)) || [, "Serviços"])[1]; };
  const SETOR = c => { const d = +dg(c).padStart(7, "0").slice(0, 2); return d <= 3 ? "agropecuária" : d <= 9 ? "indústria extrativa" : d <= 33 ? "indústria" : d <= 39 ? "energia, água e saneamento" : d <= 43 ? "construção" : d <= 47 ? "comércio" : d <= 53 ? "transporte e logística" : d <= 56 ? "alojamento e alimentação" : d <= 63 ? "tecnologia e comunicação" : d <= 66 ? "serviços financeiros" : d === 68 ? "atividades imobiliárias" : d <= 75 ? "serviços profissionais e técnicos" : d <= 82 ? "serviços administrativos" : d === 85 ? "educação" : d <= 88 ? "saúde" : "outros serviços"; };
  const fmtCnae = c => { c = dg(c).padStart(7, "0"); return `${c.slice(0, 4)}-${c.slice(4, 5)}/${c.slice(5)}`; };
  function tipoNegocio(r){ if (!r || !dg(r.cnae)) return ""; const sg = segCnae(r.cnae);
    return `${SETOR(r.cnae)} · CNAE ${fmtCnae(r.cnae)} ${r.cnaeDesc || ""}`.trim() + (sg ? ` · segmento ${sg}` : "") + (r.cnaesSec?.length ? ` · ${r.cnaesSec.length} atividade(s) secundária(s)` : ""); }

  /* cartão CNPJ (PDF, foto com texto, TXT) */
  async function lerCartao(f){
    const T = String(window.KT_AUTO?.texto ? await KT_AUTO.texto(f) : await f.text()), L = T.split(/\n/).map(x => x.trim()).filter(Boolean);
    const at = re => { const i = L.findIndex(x => re.test(x)); return i >= 0 ? (L[i].replace(re, "").trim() || L[i + 1] || "") : ""; };
    const o = {cnpj:(T.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/) || [])[0] || "", cartao:/comprovante de inscri/i.test(T)};
    o.razao = at(/^NOME EMPRESARIAL:?/i).replace(/^T[IÍ]TULO.*$/i, ""); o.fantasia = at(/^T[IÍ]TULO DO ESTABELECIMENTO.*?:?$/i).replace(/^\*+$/, "");
    const ca = T.match(/ATIVIDADE ECON[OÔ]MICA PRINCIPAL[\s:]*([\d.\-/]{9,12})\s*-\s*([^\n]+)/i); if (ca){ o.cnae = dg(ca[1]); o.cnaeDesc = ca[2].trim(); }
    const mu = T.match(/MUNIC[IÍ]PIO\s+UF\s*\n\s*([^\n]+?)\s+([A-Z]{2})\s*(\n|$)/i); if (mu){ o.municipio = mu[1].trim(); o.uf = mu[2]; } else { o.municipio = at(/^MUNIC[IÍ]PIO:?/i); o.uf = (at(/^UF:?$/i).match(/^[A-Z]{2}/) || [])[0] || ""; }
    o.situacao = ((T.match(/SITUA[CÇ][AÃ]O CADASTRAL\s*\n?\s*(ATIVA|INAPTA|SUSPENSA|BAIXADA|NULA)/i) || [])[1] || "").toUpperCase();
    const ab = (T.match(/DATA DE ABERTURA\s*\n?\s*(\d{2})\/(\d{2})\/(\d{4})/i) || []); o.abertura = ab[3] ? `${ab[3]}-${ab[2]}-${ab[1]}` : "";
    /* endereço, natureza jurídica, porte e atividades secundárias (rótulo numa linha e valor na seguinte, como no cartão da Receita) */
    const rot = /^(N[ÚU]MERO|COMPLEMENTO|CEP|BAIRRO|MUNIC[IÍ]PIO|UF|ENDERE[CÇ]O ELETR|TELEFONE|ENTE FEDERATIVO|SITUA[CÇ][AÃ]O|DATA DA SITUA|MOTIVO|PORTE|C[ÓO]DIGO E DESCRI)/i;
    const val = re => { const i = L.findIndex(x => re.test(x)); if (i < 0) return ""; const mesma = L[i].replace(re, "").replace(/^[:\s]+/, "").trim(); if (mesma) return mesma; const v = L[i + 1] || ""; return rot.test(v) || /^\*+$/.test(v) ? "" : v; };
    o.logradouro = val(/^LOGRADOURO:?/i); o.numero = val(/^N[ÚU]MERO:?$/i); o.complemento = val(/^COMPLEMENTO:?/i).replace(/^\*+$/, ""); o.bairro = val(/^BAIRRO\/?DISTRITO:?|^BAIRRO:?/i);
    o.cep = (T.match(/CEP[\s:]*\n?\s*(\d{2}\.?\d{3}-?\d{3})/i) || [])[1]?.replace(/\D/g, "") || "";
    const nj = T.match(/NATUREZA JUR[IÍ]DICA[\s:]*\n?\s*(\d{3}-\d)\s*-\s*([^\n]+)/i); if (nj) o.natureza = `${nj[1]} - ${nj[2].trim()}`;
    o.porte = val(/^PORTE:?/i); o.email = val(/^ENDERE[CÇ]O ELETR[OÔ]NICO:?/i).toLowerCase(); o.telefone = val(/^TELEFONE:?/i);
    const sec = T.match(/ATIVIDADES ECON[OÔ]MICAS SECUND[AÁ]RIAS[\s:]*\n([\s\S]*?)\n\s*C[ÓO]DIGO E DESCRI/i); if (sec) o.cnaesSec = [...sec[1].matchAll(/(\d{2}\.\d{2}-\d-\d{2})/g)].map(m => dg(m[1]));
    if (!o.razao){ const r0 = L.find(x => /\b(LTDA|S\.?\/?A\.?|EIRELI|ME|EPP)\b/i.test(x) && x.length < 120) || ""; o.razao = r0.replace(/^(nome empresarial|raz[aã]o social)[:\s]*/i, ""); }
    return o;
  }
  const doCartao = c => ({razao:c.razao || "", fantasia:c.fantasia || "", cnae:c.cnae || "", cnaeDesc:c.cnaeDesc || "", municipio:c.municipio || "", uf:c.uf || "", situacao:c.situacao || "", abertura:c.abertura || "",
    endereco:[c.logradouro, c.numero, c.complemento, c.bairro].filter(Boolean).join(", "), cep:c.cep || "", natureza:c.natureza || "", porte:c.porte || "", email:c.email || "", telefone:c.telefone || "", cnaesSec:c.cnaesSec || [], fonte:"cartão CNPJ importado", em:nowISO()});

  /* todas as consultas, sem clique */
  async function consultarTudo(id){
    const s = supById(id); if (!s || semCnpj(s)) return;
    try{ if (window.ORG?.atualizar) await ORG.atualizar(s, false); }catch(e){}
    try{ if (window.firebase?.functions && Store.db) await firebase.app().functions("southamerica-east1").httpsCallable("consultarEmpresa", {timeout:120000})({id}); }catch(e){}
  }

  /* ---------------- unificar duplicados ---------------- */
  const vazio = v => v == null || v === "" || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);
  function completa(a, b){ /* a recebe de b o que a não tem */
    const o = Array.isArray(a) ? [...a] : {...a};
    for (const k of Object.keys(b || {})){ if (k === "id") continue; const x = o[k], y = b[k];
      if (vazio(x)) o[k] = y; else if (Array.isArray(x) && Array.isArray(y)) o[k] = [...new Set([...x, ...y])];
      else if (x && y && typeof x === "object" && typeof y === "object" && !Array.isArray(x)) o[k] = completa(x, y); }
    return o;
  }
  function grupos(){
    const L = S.suppliers.filter(s => s.nome), G = [], usado = new Set();
    for (const s of L){ if (usado.has(s.id)) continue;
      const g = [s, ...L.filter(t => t.id !== s.id && !usado.has(t.id) && t.nivel === s.nivel && (semCnpj(s) || semCnpj(t)) && parecidos(s, t))];
      if (g.length < 2) continue; const docs = new Set(g.map(x => dg(x.doc)).filter(d => d.length === 14)); if (docs.size > 1) continue;
      g.forEach(x => usado.add(x.id)); const peso = x => (semCnpj(x) ? 0 : 1e6) + JSON.stringify(x).length;
      g.sort((a, b) => peso(b) - peso(a)); G.push(g); }
    return G;
  }
  async function unir(keep, drops){
    const k = supById(keep); if (!k) return; let o = {...k}; delete o.id;
    for (const d of drops){ const x = supById(d); if (!x) continue; const y = {...x}; delete y.id; o = completa(o, y);
      o.mapa = {...(o.mapa || {}), aliases:[...new Set([...(o.mapa?.aliases || []), x.nome].filter(n => n && n !== o.nome))]}; }
    o.unificadoEm = nowISO(); await Store.set("suppliers", keep, o);
    for (const d of drops){
      for (const t of S.suppliers){ if (t.id === keep || drops.includes(t.id)) continue; const p = {};
        if ((t.investidores || []).includes(d)) p.investidores = [...new Set(t.investidores.map(z => z === d ? keep : z))];
        if (t.parentId === d) p.parentId = keep;
        if (Object.keys(p).length) await Store.update("suppliers", t.id, p); }
      for (const c of ["evidences", "contracts", "pareceres", "operacoes", "ativos", "prospects"]) for (const e of (Array.isArray(S[c]) ? S[c] : Object.values(S[c] || {}))) if (e && e.id && e.supplierId === d) await Store.update(c, e.id, {supplierId:keep});
      if (S.ddSel === d) S.ddSel = keep; await Store.del("suppliers", d); }
  }
  function telaDuplicados(){
    const G = grupos();
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Unificar duplicados</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px">${G.length ? `<p class="sub" style="margin:0">Mesma empresa cadastrada mais de uma vez (normalmente um registro com CNPJ e outro importado só com o nome). Ao unificar, fica o primeiro (com CNPJ); dados, investidores, documentos e ligações dos outros passam para ele.</p>
        ${G.map((g, i) => `<label class="card" style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" data-dup="${i}" checked style="margin-top:4px"><div style="font-size:13px">${g.map((x, j) => `<div>${j ? "↳ " : "<b>Fica:</b> "}${esc(x.nome)} <span class="sub" style="font-size:11.5px">${x.nivel} · ${semCnpj(x) ? "sem CNPJ" : esc(x.doc)}</span></div>`).join("")}</div></label>`).join("")}
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-x>Cancelar</button><button type="button" class="btn primary" id="dup-ok">Unificar selecionados</button></div>` : `<div class="empty">Nenhum duplicado encontrado.</div>`}</div>`);
    const ok = $("#dup-ok"); if (ok) ok.onclick = async () => { ok.disabled = true; ok.textContent = "Unificando…"; let n = 0;
      for (const c of $$("[data-dup]")) if (c.checked){ const g = G[+c.dataset.dup]; await unir(g[0].id, g.slice(1).map(x => x.id)); n++; }
      close(); toast(`${n} empresa(s) unificada(s)`); renderAll(); };
  }
  /* ficha cadastral: cartão CNPJ ou Receita + contrato social (sócios, administração, capital, registro) */
  function ficha(s){
    const r = s.receita && !s.receita.erro ? s.receita : {}, X = s.jdd?.soc?.ext || {}, P = window.KT_MAND ? KT_MAND.partes(s) : {};
    const soc = X.socios?.length ? X.socios.map(p => `${p.nome}${p.pct ? ` (${(p.pct * 100).toLocaleString("pt-BR", {maximumFractionDigits:1})}%)` : ""}${p.adm ? " · administrador" : ""}`).join("; ") : (r.socios || []).map(q => q.nome + (q.qual ? ` (${q.qual})` : "")).join("; ");
    return [["Razão social", r.razao || s.nome], ["Nome fantasia", r.fantasia || ""], ["CNPJ", s.doc || r.cnpj || ""], ["Natureza jurídica", r.natureza || ""], ["Endereço", P.ENDERECO && !/^\[/.test(P.ENDERECO) ? P.ENDERECO : [r.municipio || s.municipio, r.uf || s.uf].filter(Boolean).join("/")],
      ["Atividade principal (CNAE)", `${r.cnae || ""} ${r.cnaeDesc || ""}`.trim()], ["Atividades secundárias", (r.cnaesSec || []).join(", ")], ["Situação cadastral", r.situacao || ""], ["Data de abertura", r.abertura ? r.abertura.split("-").reverse().join("/") : ""], ["Porte", r.porte || ""],
      ["Sócios", soc], ["Administração", X.administracao || (P.REPRESENTANTE && !/^\[/.test(P.REPRESENTANTE) ? P.REPRESENTANTE : "")], ["Capital social", X.capital ? `R$ ${X.capital}` : ""], ["Registro na Junta", X.registro?.numero ? `${X.registro.orgao || ""} ${X.registro.numero}`.trim() : ""],
      ["Fonte do cadastro", [r.fonte || (r.em ? "Receita Federal" : ""), s.jdd?.soc?.arquivo ? `contrato social (${s.jdd.soc.arquivo})` : ""].filter(Boolean).join(" + ")]].filter(([, v]) => v); }
  window.KT_CNPJ = {ficha, mesmoNome, parecidos, existente, segCnae, tipoNegocio, lerCartao, doCartao, consultarTudo, grupos, unir, telaDuplicados, semCnpj, brasileira, completa};
})();
