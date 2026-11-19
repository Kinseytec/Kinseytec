/* ================= KINSEY CAPITAL · IMPORTAÇÃO DE DOCUMENTOS (BASE INICIAL) =================
   Vários documentos de uma vez (PDF, Word, Excel, CSV, texto, XML, fotos ou .zip). Para cada arquivo o sistema:
   1) reconhece o tipo pelo conteúdo (e pelo nome do arquivo): balanço patrimonial, DRE, balancete, demonstrações
      financeiras, relatório de auditoria, cartão CNPJ, contrato social, certidões (federal, estadual, municipal, FGTS,
      trabalhista), licenças e alvarás, procuração, mandato, NDA, MOU/LOI, SPA, laudo, matrícula e IPTU, contratos;
   2) acha a empresa pelo CNPJ do documento (ou usa a escolhida) e cadastra o target quando o CNPJ é novo;
   3) leva cada documento ao lugar certo: balanço e DRE (inclusive os relatórios sintéticos do sistema contábil, sem
      código de conta) e balancetes para a Due Diligence; contrato social para a diligência jurídica; mandato, MOU e SPA
      para o Jurídico; e guarda o arquivo no dossiê, marcando o checklist documental.
   O cartão CNPJ não precisa ser enviado: a consulta à Receita Federal pelo CNPJ marca o item sozinha. */
if (window.KT_DD) (() => {
  const D = KT_DD, dig = v => String(v || "").replace(/\D/g, ""), nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const fmtC = d => d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const iso = (d, m, a) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  /* ---------------- tipos ---------------- */
  const TIPOS = [
    ["balanco", "Balanço patrimonial", t => /balan[cç]o patrimonial/i.test(t.slice(0, 3000)) && !/balancete/i.test(t.slice(0, 600)), "Demonstração financeira"],
    ["dre", "DRE (demonstração do resultado)", t => /demonstra[cç][aã]o d[oe]s? resultados?|\bD\.\s?R\.\s?E\.?\b/i.test(t.slice(0, 3000)), "Demonstração financeira"],
    ["balancete", "Balancete", t => /balancete/i.test(t.slice(0, 2000)), "Demonstração financeira"],
    ["auditoria", "Relatório de auditoria", t => /relat[oó]rio do auditor independente|opini[aã]o do auditor|auditores independentes/i.test(t), "Relatório de auditoria"],
    ["mandato", "Mandato (contrato de assessoria)", t => /presta[cç][aã]o de servi[cç]os de assessoria|mandato de (venda|assessoria)|remunera[cç][aã]o de sucesso|success fee/i.test(t), "Mandato assinado"],
    ["spa", "SPA (compra e venda de quotas ou ações)", t => /compra e venda de (quotas|a[cç][oõ]es|participa)|share purchase agreement/i.test(t.slice(0, 4000)), "Contrato"],
    ["mou", "MOU, LOI ou term sheet", t => /memorando de entendimentos|carta de inten[cç][oõ]es|term sheet|letter of intent/i.test(t.slice(0, 4000)), "Proposta (IOI / LOI)"],
    ["nda", "NDA (confidencialidade)", t => /acordo de confidencialidade|termo de confidencialidade|non.?disclosure|\bNDA\b/i.test(t.slice(0, 3000)), "NDA assinado"],
    ["laudo", "Laudo de avaliação", t => /laudo de avalia[cç][aã]o/i.test(t.slice(0, 3000)), "Laudo / valuation"],
    ["imovel", "Matrícula, escritura ou IPTU", t => /registro de im[oó]veis|escritura p[uú]blica|valor venal|imposto predial/i.test(t.slice(0, 4000)), "Outro"]];
  const LEG = {contrato_social:["Contrato social / alteração", "Contrato social"], cartao_cnpj:["Cartão CNPJ", "Outro"], cnd_federal:["Certidão federal (RFB/PGFN)", "Certidão"], cndt:["CNDT (trabalhista)", "Certidão"], crf:["CRF do FGTS", "Certidão"],
    cnd_estadual:["Certidão estadual", "Certidão"], cnd_municipal:["Certidão municipal", "Certidão"], certidao:["Certidão", "Certidão"], licenca:["Licença ambiental", "Certidão"], alvara:["Alvará", "Certidão"], avcb:["AVCB", "Certidão"],
    procuracao:["Procuração", "Outro"], contrato:["Contrato", "Contrato"], nota:["Nota fiscal", "Outro"], ctf_ibama:["CTF IBAMA", "Certidão"], cnd_ibama:["CND IBAMA", "Certidão"]};
  const NOME_ARQ = [[/balan[cç]o|bp[ _-]/i, "balanco"], [/\bd\.?r\.?e\b|resultado/i, "dre"], [/balancete/i, "balancete"], [/auditoria|parecer/i, "auditoria"], [/mandato/i, "mandato"], [/\bnda\b|confidencial/i, "nda"], [/\bspa\b/i, "spa"], [/\bmou\b|\bloi\b/i, "mou"],
    [/cnd|certid/i, "certidao"], [/contrato[ _-]?social|altera[cç][aã]o/i, "contrato_social"], [/cart[aã]o[ _-]?cnpj/i, "cartao_cnpj"], [/laudo/i, "laudo"], [/iptu|matr[ií]cula|escritura/i, "imovel"]];
  const rotulo = k => (TIPOS.find(x => x[0] === k) || [])[1] || LEG[k]?.[0] || "Documento";
  const evTipo = k => (TIPOS.find(x => x[0] === k) || [])[3] || LEG[k]?.[1] || "Outro";
  const OPCOES = [...TIPOS.map(x => [x[0], x[1]]), ...Object.entries(LEG).map(([k, v]) => [k, v[0]]), ["outro", "Outro documento"]];
  /* item do checklist documental (N3) de cada tipo */
  const ITEM = {balanco:/demonstra/i, dre:/demonstra/i, balancete:/demonstra/i, auditoria:/auditoria/i, contrato_social:/contrato social/i, cartao_cnpj:/cart[aã]o cnpj/i, cnd_federal:/certid/i, cndt:/certid/i, crf:/certid/i, cnd_estadual:/certid/i, cnd_municipal:/certid/i, certidao:/certid/i,
    licenca:/licen/i, alvara:/licen|alvar/i, avcb:/licen|avcb/i, mandato:/mandato/i, nda:/\bNDA\b/, contrato:/contratos relevantes/i};

  /* ---------------- leitura ---------------- */
  async function texto(f){ try{ if ((typeof DOCAN !== "undefined" && DOCAN.texto)){ const t = await DOCAN.texto(f, f.name); if (t != null) return t; } }catch(e){} try{ return window.KT_AUTO ? await KT_AUTO.texto(f) : ""; }catch(e){ return ""; } }
  const NUM = /^\(?-?\s*[\d.]+,\d{2}\)?\s*[DC]?$/i;
  const valor = s => { const t = String(s).trim(), neg = /^\(.*\)$/.test(t) || /^-/.test(t), dc = (t.match(/([DC])\s*$/i) || [])[1] || ""; const v = parseFloat(t.replace(/[()\sDC-]/gi, "").replace(/\./g, "").replace(",", ".")); return isFinite(v) ? {v:neg ? -v : v, dc:dc.toUpperCase()} : null; };
  function periodo(t){
    const p = t.match(/per[ií]odo\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})\s*(?:a|-|até)\s*(\d{2})\/(\d{2})\/(\d{4})/i);
    if (p) return {ini:iso(p[1], p[2], p[3]), fim:iso(p[4], p[5], p[6])};
    const e = t.match(/(?:encerrad[oa] em|levantad[oa] em|exerc[ií]cio (?:findo|encerrado) em|em)\s*:?\s*(\d{2})\/(\d{2})\/(\d{4})/i);
    if (e) return {ini:`${e[3]}-01-01`, fim:iso(e[1], e[2], e[3])};
    const m = [...t.matchAll(/(?<![\d.\/])(\d{2})\/(20\d{2}|19\d{2})(?![\d\/-])/g)].find(x => +x[1] >= 1 && +x[1] <= 12); return m ? {ini:`${m[2]}-01-01`, fim:new Date(+m[2], +m[1], 0, 12).toISOString().slice(0, 10)} : null;
  }
  const meses = P => P ? Math.max(1, Math.round((new Date(P.fim) - new Date(P.ini)) / 2.6298e9)) : 12;
  /* balanço patrimonial sintético (duas colunas, hierarquia pelo recuo, saldo com D/C) */
  function lerBalanco(linhas){
    const itens = [], hdr = linhas.findIndex(l => l.filter(i => /descri/i.test(i.t)).length >= 1 && l.some(i => /saldo/i.test(i.t)));
    const descX = hdr >= 0 ? linhas[hdr].filter(i => /descri/i.test(i.t)).map(i => i.x) : [], split = descX.length > 1 ? (descX[0] + descX[1]) / 2 - 5 : null;
    linhas.slice(hdr + 1).forEach((l, li) => { let txt = null;
      l.forEach(it => { const t = it.t.trim(); if (!t) return; if (NUM.test(t) && txt){ const v = valor(t); itens.push({li, x:txt.x, desc:txt.t.replace(/\s+/g, " ").trim(), v:v.v, dc:v.dc}); txt = null; }
        else if (!NUM.test(t)){ txt = txt && it.x - txt.x < 260 && !(split && txt.x < split && it.x >= split) ? {x:txt.x, t:txt.t + " " + t} : {x:it.x, t}; } }); });
    if (!itens.length) return null;
    const sp = split || (() => { const xs = itens.map(i => i.x).sort((a, b) => a - b); let best = 0, at = xs[0]; for (let k = 1; k < xs.length; k++) if (xs[k] - xs[k - 1] > best){ best = xs[k] - xs[k - 1]; at = (xs[k] + xs[k - 1]) / 2; } return at; })();
    const cols = [itens.filter(i => i.x < sp), itens.filter(i => i.x >= sp)], contas = [];
    cols.forEach(C => { const st = [], filhos = {};
      C.forEach((it, k) => { while (st.length && st[st.length - 1].x >= it.x - 1) st.pop();
        let cod; if (!st.length){ cod = /^passivo|patrim/i.test(it.desc) ? "2" : /^ativo/i.test(it.desc) ? "1" : String(contas.length + 1); }
        else { const pai = st[st.length - 1]; filhos[pai.cod] = (filhos[pai.cod] || 0) + 1; cod = pai.cod + "." + filhos[pai.cod]; }
        it.cod = cod; st.push(it);
        const prox = C[k + 1], folha = !prox || prox.x <= it.x + 1;
        if (folha && cod.includes(".")){ const v = it.dc === "C" ? -Math.abs(it.v) : it.dc === "D" ? Math.abs(it.v) : (cod[0] === "2" ? -Math.abs(it.v) : Math.abs(it.v)); contas.push([cod, it.desc, Math.round(v * 100) / 100, D.classifica(cod, it.desc)]); } }); });
    return contas.length ? contas : null;
  }
  /* DRE: linha com Saldo e Total é conta analítica; linha só com Total é subtotal */
  function lerDRE(linhas){
    const contas = []; let k = 0;
    linhas.forEach(l => { const nums = l.filter(i => NUM.test(i.t.trim())), txt = l.filter(i => !NUM.test(i.t.trim())).map(i => i.t).join(" ").replace(/\s+/g, " ").trim();
      if (!txt || !nums.length || /^(descri|empresa|c\.?n\.?p\.?j|per[ií]odo|folha)/i.test(txt)) return;
      const subtotal = nums.length === 1 && /^(receita l[ií]quida|lucro|preju[ií]zo|resultado|total|despesas operacionais$)/i.test(nrm(txt)) || (nums.length === 1 && /^(lucro|resultado|receita liquida)/.test(nrm(txt)));
      if (subtotal) return; const v = valor(nums[0].t).v, n = nrm(txt);
      const g = /nao operaciona/.test(n) ? "naoOp" : /dedu/.test(n) ? "deducoes" : /^custos?\b|custo dos/.test(n) ? "cpv" : /imposto de renda|contribuic\w* social|\bir\b.*cs/.test(n) ? "ir" : /receitas? financeir/.test(n) ? "recFin" : /despesas? financeir/.test(n) ? "despFin" : D.classifica("3", txt);
      contas.push(["3." + (++k), txt, Math.round(-v * 100) / 100, g]); });
    return contas.length ? contas : null;
  }
  async function linhasPDF(f){ return IMP.lerPDF(await f.arrayBuffer(), "itens"); }
  /* reconhecimento */
  async function ler(f){
    const n = f.name.toLowerCase(), r = {f, tipo:null, como:"", cnpjs:[], periodo:null, contas:null, texto:""};
    if (/\.(xlsx|xlsm|csv|ods)$/.test(n)){ try{ r.contas = await D.lerArquivo(f); r.tipo = "balancete"; r.como = "planilha de contas"; }catch(e){ r.erro = e.message; }
      const m = n.match(/(\d{2})[._-](\d{4})|(\d{4})[._-](\d{2})/); if (m){ const a = m[2] || m[3], me = m[1] || m[4]; r.periodo = {ini:`${a}-01-01`, fim:new Date(+a, +me, 0, 12).toISOString().slice(0, 10)}; } return r; }
    const t = await texto(f) || ""; r.texto = t; r.leu = t.trim().length > 40;
    r.cnpjs = [...new Set((t.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g) || []).map(dig).filter(d => d.length === 14 && IMP.docValido(d)))];
    if (window.KT_SPED && KT_SPED.tipo(t)){ try{ const o = await KT_SPED.ler(f); if (o){ r.tipo = o.tipo; r.formato = o.formato; r.como = `conteúdo (${o.formato})`; r.multi = o.multi; r.texto = t.slice(0, 1500);
        r.periodo = {ini:o.ini || o.multi[0].periodo.ini, fim:o.fim || o.multi[o.multi.length - 1].periodo.fim}; if (o.cnpj && IMP.docValido(o.cnpj)) r.cnpjs = [o.cnpj]; r.contas = o.multi[o.multi.length - 1].contas; return r; } }catch(e){ console.warn("SPED", e); } }
    const T = TIPOS.find(x => x[2](t)); if (T){ r.tipo = T[0]; r.como = "conteúdo"; }
    if (!r.tipo && typeof DOCAN !== "undefined" && r.leu){ try{ let x = DOCAN.extrair(t); if (!x.tipo) x = DOCAN.extrair(t.replace(/\s*\n\s*/g, " ")); if (x.tipo){ r.tipo = x.tipo; r.como = "conteúdo"; r.cad = x.cad; } }catch(e){} }
    if (!r.tipo){ const m = NOME_ARQ.find(([re]) => re.test(f.name)); if (m){ r.tipo = m[1]; r.como = "nome do arquivo"; } }
    r.periodo = ["balanco", "dre", "balancete", "auditoria"].includes(r.tipo) || !r.tipo ? periodo(t) : null;
    if (/\.pdf$/.test(n) && ["balanco", "dre", "balancete"].includes(r.tipo)){ try{ const L = await linhasPDF(f);
        r.contas = r.tipo === "dre" ? lerDRE(L) : r.tipo === "balanco" ? lerBalanco(L) : null;
        if (r.tipo === "balancete" && !r.contas){ try{ r.contas = await D.lerArquivo(f); }catch(e){ r.erro = e.message; } }
        if (r.tipo === "balanco" && /demonstra[cç][aã]o d[oe] resultado/i.test(t)){ const dre = lerDRE(L.slice(L.findIndex(l => /demonstra/i.test(l.map(i => i.t).join(" "))))); if (dre) r.contasDRE = dre; }
      }catch(e){ r.erro = "não consegui ler as contas do PDF"; } }
    return r;
  }

  /* ---------------- destino ---------------- */
  const alvoDe = (r, fixo) => fixo ? supById(fixo) : S.suppliers.find(s => r.cnpjs.includes(dig(s.doc)) || (dig(s.doc).length === 14 && r.cnpjs.some(c => c.slice(0, 8) === dig(s.doc).slice(0, 8))));
  async function novoTarget(r){
    const d = r.cnpjs[0]; if (!d) return null; const id = "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const nome = r.cad?.nome || ((r.texto.match(/(?:empresa|nome|raz[aã]o social)\s*:\s*([^\n]{4,120})/i) || [])[1] || "").split(/\s{2,}|\s(?:folha|c\.?n\.?p\.?j|cnpj|p[aá]gina)\b/i)[0].trim() || "CNPJ " + fmtC(d);
    await Store.set("suppliers", id, {nivel:"N3", nome, doc:fmtC(d), tipo:"Target", origem:"Importação de documentos", parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), criadoPor:Store.me?.id || ""});
    try{ if (window.ORG?.atualizar) setTimeout(() => ORG.atualizar(supById(id), false), 500); }catch(e){}
    return supById(id) || {id, nome, doc:fmtC(d), nivel:"N3"};
  }
  async function aplicar(s, r, o = {}){
    /* SPED: cada período do ECD (mês a mês) ou do ECF vira um balancete; o arquivo fica uma vez no dossiê */
    if (r.multi?.length){ let n = 0; for (const m of r.multi){ await aplicar(s, {...r, multi:null, periodo:m.periodo, contas:m.contas, contasDRE:null, tipo:r.formato === "ECF" ? "balanco" : "balancete"}, {semArquivo:true}); n++; }
      const resto = await aplicar(s, {...r, multi:null, contas:null, contasDRE:null, tipo:"sped"}, o);
      return [`Due Diligence: ${n} ${r.formato === "ECD" ? "balancete(s) mensal(is) do ECD" : "balanço e DRE do ECF"} (${dBR(r.multi[0].periodo.fim)} a ${dBR(r.multi[n - 1].periodo.fim)})`, ...resto]; }
    const feito = [];
    if (["balanco", "dre", "balancete"].includes(r.tipo) && (r.contas || r.contasDRE)){
      const P = r.periodo || {ini:`${new Date().getFullYear() - 1}-01-01`, fim:`${new Date().getFullYear() - 1}-12-31`}, per = P.fim.slice(0, 7), cur = (supById(s.id) || s).dd?.bal?.[per];
      let contas = r.contas || [];
      if (r.contasDRE) contas = [...contas, ...r.contasDRE];
      if (cur?.contas?.length && (cur.origem === "workbook" || (cur.origem !== "demonstracoes" && r.tipo !== "balancete"))){ /* período revisado no workbook ou balancete detalhado: o documento fica só para conferência */ /* já há balancete detalhado: o balanço/DRE fica como conferência */
        await save(Store.update("suppliers", s.id, {dd:{demos:{[per]:{[r.tipo]:{contas:r.contas || r.contasDRE, arquivo:r.f.name, em:nowISO()}}}}}));
        feito.push(`Due Diligence: ${rotulo(r.tipo)} de ${dBR(P.fim)} guardado para conferência (o período já tem balancete detalhado)`); }
      else {
      if (cur?.contas?.length && cur.origem === "demonstracoes" && r.tipo !== "balancete"){ const secoes = new Set(contas.map(c => String(c[0])[0])); contas = [...cur.contas.filter(c => !secoes.has(String(c[0])[0])), ...contas]; }
      contas = contas.filter(c => c[0] !== "2.99");
      const temBal = contas.some(c => /^[12]/.test(String(c[0]))), dre = contas.filter(c => /^3/.test(String(c[0])));
      if (temBal && dre.length && r.tipo !== "balancete"){ const res = -dre.reduce((t, c) => t + c[2], 0); contas.push(["2.99", "(−) Resultado do período já incluído no patrimônio líquido do balanço encerrado", Math.round(res * 100) / 100, "pl"]); }
      await save(Store.update("suppliers", s.id, {dd:{bal:{[per]:{dataBase:P.fim, meses:meses(P), contas, importadoEm:nowISO(), por:Store.me?.email || "", origem:r.tipo === "balancete" ? "dd" : "demonstracoes", arquivos:[...new Set([...(cur?.arquivos || []), r.f.name])]}}}}));
      feito.push(`Due Diligence: ${r.tipo === "balancete" ? "balancete" : "balanço e DRE"} de ${dBR(P.fim)} (${contas.length} contas${r.periodo ? "" : ", data-base a conferir"})`);  } }
    /* cartão CNPJ: completa o cadastro com o que a consulta à Receita não trouxe (endereço, natureza, porte, atividades) */
    if (r.tipo === "cartao_cnpj" && window.KT_CNPJ?.lerCartao){ try{ const c = KT_CNPJ.doCartao(await KT_CNPJ.lerCartao(r.f)), at = (supById(s.id) || s).receita || {}, rc = at.erro ? {} : at, novo = {};
        Object.entries(c).forEach(([k, v]) => { if (k === "fonte" || k === "em") return; if ((Array.isArray(v) ? v.length : v) && !(Array.isArray(rc[k]) ? rc[k].length : rc[k])) novo[k] = v; });
        if (Object.keys(novo).length){ await save(Store.update("suppliers", s.id, {receita:{...(at.erro ? {erro:null} : {}), ...(rc.em ? {} : {fonte:c.fonte, em:c.em}), ...novo}, ...(!s.doc && r.cnpjs[0] ? {doc:r.cnpjs[0].replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")} : {})})); feito.push(`Cadastro: ${Object.keys(novo).length} dado(s) do cartão CNPJ (${Object.keys(novo).slice(0, 4).join(", ")}${Object.keys(novo).length > 4 ? "…" : ""})`); } }catch(e){ console.warn(e); } }
    if (r.tipo === "contrato_social" && window.KT_JAUTO?.importar){ try{ await KT_JAUTO.importar(supById(s.id) || s, r.f); feito.push("Diligência jurídica: societário lido"); }catch(e){} }
    if (r.tipo === "nda" && window.KT_NDA?.registrar){ try{ const C = await KT_NDA.registrar(supById(s.id) || s, r.f, r.texto ? r.texto.split(/\n+/).map(x => x.trim()).filter(Boolean) : null, {semEvid:true}); feito.push("Jurídico: NDA registrado" + (C ? (C.conforme ? " (conforme o padrão)" : ` (${C.dif.length} cláusula(s) diferente(s) do padrão)`) : "")); }catch(e){} }
    if (r.tipo === "mandato" && window.KT_AUTO?.registrarMandato){ try{ await KT_AUTO.registrarMandato(supById(s.id) || s, r.f, false); feito.push("Jurídico: mandato registrado"); }catch(e){} }
    if ((r.tipo === "spa" || r.tipo === "mou") && window.KT_OPDOC && r.texto){ try{ await KT_OPDOC.registrar(supById(s.id) || s, r.tipo.toUpperCase(), "investidor", r.texto.split(/\n+/).map(x => x.trim()).filter(Boolean), r.f.name); feito.push("Jurídico: análise pró-vendedor (SPA e MOU)"); }catch(e){} }
    /* arquivo no dossiê (na releitura de um documento que já está lá, não duplica) */
    if (!o.semArquivo) try{ const blob = r.f.type?.startsWith("image/") && typeof shrink === "function" ? await shrink(r.f) : r.f, up = await Store.upload(blob);
      const eid = uid(); await salvarEvid(eid, {supplierId:s.id, tipo:evTipo(r.tipo), obs:`Importação de documentos · ${rotulo(r.tipo)}${r.como ? " (identificado pelo " + r.como + ")" : ""}`, ...up, mime:blob.type || r.f.type, nome:fixMoji(r.f.name), criadoEm:nowISO(), criadoPor:Store.me?.id || "", origem:"Importação de documentos", tipoDoc:r.tipo || ""}, blob);
      feito.push("arquivo guardado no dossiê"); Store.update("suppliers", s.id, {dd:{lidosV2:{[eid]:nowISO()}, lerFalha:{[eid]:null}}}).catch(() => {}); }catch(e){ feito.push("arquivo não guardado: " + (e.message || "erro")); }
    /* checklist documental */
    const L = DOCS[s.nivel] || [], re = ITEM[r.tipo], i = re ? L.findIndex(x => re.test(x)) : -1, ss = supById(s.id) || s;
    if (i >= 0 && !ss.docsObs?.["d" + i]?.manual && ss.docs?.["d" + i] !== "ok"){ await save(Store.update("suppliers", s.id, {docs:{["d" + i]:"ok"}, docsObs:{["d" + i]:{txt:`${rotulo(r.tipo)} apresentado (${r.f.name}).`, auto:true, doc:r.f.name, em:nowISO()}}})); feito.push(`checklist: "${L[i]}"`); }
    return feito;
  }
  /* cartão CNPJ: a consulta à Receita Federal supre o documento */
  function cartaoPelaReceita(){ if (Store.me?.canWrite === false) return;
    S.suppliers.filter(s => s.nivel === "N3" && s.receita?.em && !s.receita.erro).forEach(s => { const L = DOCS.N3, i = L.findIndex(x => /cart[aã]o cnpj/i.test(x)); if (i < 0) return;
      if (s.docs?.["d" + i] || s.docsObs?.["d" + i]?.manual) return;
      Store.update("suppliers", s.id, {docs:{["d" + i]:"ok"}, docsObs:{["d" + i]:{txt:`Cartão CNPJ dispensado: dados conferidos na Receita Federal em ${dBR(s.receita.em)} (situação ${s.receita.situacao || "consultada"}).`, auto:true, doc:"Receita Federal", em:nowISO()}}}).catch(() => {}); }); }

  /* ---------------- tela ---------------- */
  /* documento em dúvida: sem tipo, com erro de leitura, tipo genérico ou demonstração sem contas lidas */
  /* planilha que não parece balancete: poucas linhas ou códigos que não são de conta contábil (ex.: CNPJ, telefone) */
  const planilhaEstranha = r => { if (!/planilha/.test(r.como || "") || r.multi) return false; const C = r.contas || []; if (C.length < 5) return true;
    const ok = C.filter(c => /^\d{1,2}([.\-]\d{1,6}){0,7}$/.test(String(c[0]).trim()) || /^\d{1,8}$/.test(String(c[0]).trim())).length; return ok / C.length < .6; };
  const duvida = r => !r.tipo || !!r.erro || r.tipo === "outro" || (["balanco", "dre", "balancete"].includes(r.tipo) && (!((r.contas || []).length || (r.contasDRE || []).length || (r.multi || []).length) || planilhaEstranha(r)));
  /* ---------- sininho: situação dos documentos da empresa ----------
     amarelo: nenhum documento importado · vermelho: documento com problema ou documento essencial faltando · verde: tudo certo */
  function statusDocs(s){
    if (!s) return null; s = supById(s.id) || s;
    const E = S.evidences.filter(e => e.supplierId === s.id), bal = Object.keys(s.dd?.bal || {}), itens = [], ok = [];
    if (!E.length && !bal.length) return {cor:"amarelo", tit:"Nenhum documento importado", itens:["Importe balanço e DRE (ou balancete / ECD), ECF e contrato social: as análises automáticas começam sozinhas."], ok};
    const fal = {}; Object.entries(s.dd?.lerFalha || {}).forEach(([id, v]) => { if (v && E.some(e => e.id === id)) fal[id] = v; });
    E.forEach(e => { const m = window.KT_ARQ?.falhas?.[e.id]; if (m && !fal[e.id]) fal[e.id] = {nome:e.nome, motivo:m}; });
    Object.values(fal).forEach(v => itens.push(`${fixMoji(v.nome || "documento")} não abriu: ${v.motivo}`));
    const acl = E.filter(e => e.aClassificar || /a classificar/i.test(e.tipo || "")); if (acl.length) itens.push(`${acl.length} documento(s) sem tipo reconhecido, aguardando classificação (Evidências)`);
    const finEnv = E.filter(e => /demonstra|balan|dre|balancete|sped|ecd|ecf/i.test(`${e.tipo} ${e.nome}`));
    const lid = s.dd?.lidosV2 || {}, naoLidos = finEnv.filter(e => !lid[e.id] && !fal[e.id]);
    if (!bal.length) itens.push(finEnv.length ? `Os ${finEnv.length} documento(s) financeiro(s) enviados ainda não chegaram à Due Diligence${naoLidos.length ? ": toque em Analisar documentos" : ""}` : "Falta balanço, DRE, balancete ou ECD: sem eles não há Due Diligence, valuation, PPA nem impairment");
    else { const comDRE = bal.filter(p => { try{ const K = KT_DD.calc(s.dd.bal[p]); return Math.abs(K.recLiq || K.rec || 0) > 0; }catch(e){ return (s.dd.bal[p].contas || []).some(c => /^3/.test(String(c[0]))); } });
      ok.push(`${bal.length} período(s) na Due Diligence (${bal.sort().slice(-1)[0].split("-").reverse().join("/")} o mais recente)`);
      if (!comDRE.length) itens.push("Falta a DRE: os períodos importados só têm balanço patrimonial"); else ok.push(`DRE em ${comDRE.length} período(s)`);
      if (naoLidos.length) itens.push(`${naoLidos.length} documento(s) financeiro(s) ainda não lido(s) pelas análises`); }
    if (s.nivel === "N3"){ const cs = E.some(e => /contrato social|estatuto|altera[cç][aã]o contratual/i.test(`${e.tipo} ${e.nome}`)) || s.jdd?.societario || s.docs && Object.entries(s.docsObs || {}).some(([k, v]) => /contrato social/i.test(v?.txt || ""));
      if (!cs) itens.push("Falta o contrato social (diligência jurídica e partes dos contratos)"); else ok.push("Contrato social recebido"); }
    if (s.anaAuto?.em) ok.push(`Análise automática feita em ${dBR(String(s.anaAuto.em).slice(0, 10))}`); else if (bal.length) itens.push("A análise automática ainda não rodou nesta empresa");
    const ue = window.KT_ULT_ERRO; if (ue && Date.now() - new Date(ue.em).getTime() < 30 * 60e3) itens.push("Última gravação no Firebase falhou: " + (ue.msg || ue.code).slice(0, 160));
    const A = window.KT_ARQ; if (A && A.via.servidor) ok.push("Arquivos lidos pelo servidor (o Storage não libera download direto ao navegador)");
    return {cor:itens.length ? "vermelho" : "verde", tit:itens.length ? `${itens.length} ponto(s) a resolver` : "Documentos em ordem", itens, ok};
  }
  const COR_SINO = {amarelo:"#F2C14E", vermelho:"var(--bad,#E5484D)", verde:"var(--ok,#2FB574)"};
  function sinoHTML(s, aberto){ const st = statusDocs(s); if (!st) return "";
    const c = COR_SINO[st.cor];
    return `<div class="card" id="dc-sino" style="padding:10px 12px;display:flex;flex-direction:column;gap:8px;border-color:${c}">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><button type="button" id="dc-sino-b" aria-expanded="${aberto ? "true" : "false"}" aria-label="Situação dos documentos: ${esc(st.tit)}" style="background:none;border:0;padding:0;display:flex;align-items:center;gap:8px;cursor:pointer;color:inherit;font:inherit;text-align:left;flex:1;min-width:180px">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="${c}" stroke="${c}" stroke-width="1.5" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0" fill="none"/></svg>
        <span><b style="font-size:14px">${esc(st.tit)}</b><span class="sub" style="display:block;font-size:11.5px">${st.cor === "amarelo" ? "nenhum documento" : st.cor === "vermelho" ? "documento com problema ou faltando" : "tudo certo"} · toque para ver</span></span></button>
        ${window.KT_ANAUTO ? `<button type="button" class="btn sm" id="dc-sino-a">Analisar documentos</button>` : ""}</div>
      <div id="dc-sino-d" ${aberto ? "" : "hidden"} style="font-size:12.5px;display:flex;flex-direction:column;gap:4px">${st.itens.map(t => `<div style="color:${st.cor === "amarelo" ? "inherit" : COR_SINO.vermelho}">• ${esc(t)}</div>`).join("")}${st.ok.map(t => `<div style="color:${COR_SINO.verde}">✓ ${esc(t)}</div>`).join("")}</div></div>`; }
  function bindSino(host, s, close){ const b = $("#dc-sino-b", host); if (b) b.onclick = () => { const d = $("#dc-sino-d", host), ab = d.hidden; d.hidden = !ab; b.setAttribute("aria-expanded", String(ab)); };
    const a = $("#dc-sino-a", host); if (a) a.onclick = () => { if (close) close(); KT_ANAUTO.abrir(s.id); }; }
  function importar(pre){
    const L0 = S.suppliers.slice().sort((a, b) => a.nivel.localeCompare(b.nivel) || (a.nome || "").localeCompare(b.nome || "", "pt"));
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Importação de documentos</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        <p class="sub" style="margin:0">Selecione vários documentos de uma vez (ou um .zip). O sistema reconhece cada um, acha a empresa pelo CNPJ e leva ao lugar certo: balanço, DRE e balancete para a Due Diligence; contrato social para a diligência jurídica; mandato, MOU e SPA para o Jurídico; certidões e demais para o checklist do dossiê. O cartão CNPJ não precisa ser enviado: o sistema consulta a Receita.</p>
        <div class="fld"><label for="dc-q">Empresa</label><input type="search" id="dc-q" autocomplete="off" placeholder="Digite o nome ou o CNPJ" value="${esc(supById(pre)?.nome || "")}"><input type="hidden" id="dc-sup" value="${esc(pre || "")}">
          <div id="dc-qres" style="display:flex;flex-direction:column;gap:4px;margin-top:4px"></div><span class="hint" id="dc-qsel">${pre && supById(pre) ? `✓ ${esc(supById(pre).nome)}` : "Em branco: o sistema acha a empresa pelo CNPJ de cada documento."}</span></div>
        <div id="dc-sinow"></div>
        <div class="fld"><label>Como importar</label><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="fbtn" data-dcm="varios" aria-pressed="true">Vários documentos (o sistema identifica)</button><button type="button" class="fbtn" data-dcm="tipo" aria-pressed="false">Um tipo de documento</button></div></div>
        <div class="fld" id="dc-tw" hidden><label for="dc-tipo">Tipo de documento</label><select id="dc-tipo">${OPCOES.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select><span class="hint">Todos os arquivos escolhidos entram com este tipo.</span></div>
        <label class="btn primary" style="align-self:flex-start;min-height:46px;display:flex;align-items:center">Escolher documentos<input type="file" id="dc-f" multiple accept=".pdf,.docx,.xlsx,.xlsm,.csv,.ods,.txt,.xml,.zip,image/*" hidden></label>
        <div id="dc-prev"></div><p class="err" id="dc-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Fechar</button><button type="button" class="btn primary" id="dc-go" disabled>Importar</button></div></div>`);
    let R = [], modo = "varios"; const abertos = new Set(), urls = new Map();
    const sino = (aberto) => { const w = $("#dc-sinow"); if (!w) return; const s = supById($("#dc-sup").value); w.innerHTML = s ? sinoHTML(s, aberto) : ""; if (s) bindSino(w, s, close); };
    const nq = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const escolhe = x => { $("#dc-sup").value = x ? x.id : ""; $("#dc-q").value = x ? x.nome : ""; $("#dc-qres").innerHTML = ""; $("#dc-qsel").innerHTML = x ? `✓ ${esc(x.nome)} <span class="sub">(${x.nivel}${x.doc ? " · " + esc(x.doc) : ""})</span>` : "Em branco: o sistema acha a empresa pelo CNPJ de cada documento."; sino(false); desenha(); };
    $("#dc-q").oninput = () => { const q = nq($("#dc-q").value.trim()), d = dig($("#dc-q").value); if ($("#dc-sup").value){ $("#dc-sup").value = ""; sino(false); }
      if (q.length < 2 && d.length < 3){ $("#dc-qres").innerHTML = ""; $("#dc-qsel").textContent = "Em branco: o sistema acha a empresa pelo CNPJ de cada documento."; desenha(); return; }
      const L = L0.filter(x => nq([x.nome, x.razao, x.receita?.razao, x.receita?.fantasia, x.mandato?.codinome].join(" ")).includes(q) || (d.length >= 3 && dig(x.doc).includes(d))).slice(0, 8);
      $("#dc-qres").innerHTML = L.length ? L.map(x => `<button type="button" class="btn sm ghost" data-dcq="${x.id}" style="justify-content:flex-start;text-align:left">${esc(x.nome)} <span class="sub" style="margin-left:6px;font-size:11.5px">${x.nivel}${x.doc ? " · " + esc(x.doc) : ""}</span></button>`).join("") : `<span class="sub" style="font-size:12.5px">${d.length === 14 ? "CNPJ não cadastrado: deixe em branco e o sistema cadastra a empresa pelo CNPJ dos documentos, ou cadastre antes em Cadastro da empresa." : "Nenhuma empresa encontrada."}</span>`;
      $$("[data-dcq]", $("#dc-qres")).forEach(b => b.onclick = () => escolhe(supById(b.dataset.dcq))); desenha(); };
    $$("[data-dcm]").forEach(b => b.onclick = () => { modo = b.dataset.dcm; $$("[data-dcm]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); $("#dc-tw").hidden = modo !== "tipo"; });
    const urlDe = r => { if (!urls.has(r)) urls.set(r, URL.createObjectURL(r.f)); return urls.get(r); };
    const previa = r => { const u = urlDe(r), img = /^image\//.test(r.f.type || "") || /\.(jpe?g|png|heic|webp)$/i.test(r.f.name), pdf = /pdf/.test(r.f.type || "") || /\.pdf$/i.test(r.f.name);
      return `<div style="display:flex;flex-direction:column;gap:6px">${img ? `<img src="${u}" alt="${esc(r.f.name)}" style="max-width:100%;max-height:420px;object-fit:contain;border-radius:8px">` : pdf ? `<iframe src="${u}" title="${esc(r.f.name)}" style="width:100%;height:420px;border:1px solid var(--line-2);border-radius:8px;background:#fff"></iframe>` : ""}
        ${r.texto ? `<div class="sub" style="margin:0;font-size:11.5px">Texto lido do documento:</div><pre style="white-space:pre-wrap;font-size:11.5px;max-height:220px;overflow:auto;margin:0;padding:8px;border:1px solid var(--line-2);border-radius:8px">${esc(String(r.texto).slice(0, 2500))}</pre>` : img ? "" : `<span class="sub" style="font-size:12px">Sem texto legível.</span>`}
        <a href="${u}" target="_blank" rel="noopener" style="font-size:12.5px;color:var(--glow)">Abrir o arquivo</a></div>`; };
    const desenha = () => { const p = $("#dc-prev"), fixo = $("#dc-sup").value, pend = R.filter(r => !r.feito && duvida(r) && !r.aprovado).length, ok = R.length - R.filter(r => duvida(r) && !r.aprovado).length, vai = R.filter(r => !r.feito && (!duvida(r) || r.aprovado)).length;
      $("#dc-go").disabled = !vai; $("#dc-go").textContent = vai ? `Importar ${vai} documento(s)` : R.length ? "Aprove ou exclua os documentos a confirmar" : "Importar";
      p.innerHTML = !R.length ? "" : `<div class="result" style="font-size:13px;margin-bottom:6px"><b>${ok}</b> de ${R.length} reconhecido(s)${pend ? ` · <b style="color:var(--warn)">${pend} a confirmar</b>: veja o documento, escolha o tipo e aprove, ou exclua` : ""}</div>
        <div class="tbl" style="max-height:420px;overflow:auto"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Empresa</th><th>Resultado</th></tr></thead><tbody>${R.map((r, i) => { const s = alvoDe(r, fixo);
          const dv = !r.feito && duvida(r) && !r.aprovado;
          return `<tr${dv ? ` style="background:rgba(242,193,78,.08)"` : ""}><td style="font-size:12.5px;min-width:140px;word-break:break-all">${esc(fixMoji(r.f.name))}${r.periodo ? `<div class="sub" style="margin:0;font-size:11px">${dBR(r.periodo.ini)} a ${dBR(r.periodo.fim)}</div>` : ""}<div><button type="button" class="btn sm ghost" data-dcv="${i}" style="margin-top:4px">${abertos.has(i) ? "Fechar" : "Ver"}</button>${r.feito ? "" : dv ? ` <button type="button" class="btn sm ok" data-dca="${i}" style="margin-top:4px">Aprovar</button> <button type="button" class="btn sm ghost" data-dcx="${i}" style="margin-top:4px;color:var(--bad)">Excluir</button>` : ` <button type="button" class="btn sm ghost" data-dcr="${i}" style="margin-top:4px">Ler de novo</button> <button type="button" class="btn sm ghost" data-dcx="${i}" style="margin-top:4px;color:var(--bad)">Excluir</button>`}</div></td>
            <td><select data-dct="${i}" style="max-width:200px" ${r.feito ? "disabled" : ""}><option value="">— identificar documento —</option>${OPCOES.map(([k, l]) => `<option value="${k}" ${k === r.tipo ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>${r.contas || r.contasDRE ? `<div class="sub" style="margin:2px 0 0;font-size:11px">${(r.contas || []).length + (r.contasDRE || []).length} contas lidas</div>` : r.erro ? `<div class="sub" style="margin:2px 0 0;font-size:11px;color:var(--warn)">${esc(r.erro)}</div>` : ""}</td>
            <td style="font-size:12.5px">${s ? esc(s.nome) : r.cnpjs[0] ? `<span style="color:var(--warn)">CNPJ ${fmtC(r.cnpjs[0])} novo: será cadastrado como target</span>` : `<span style="color:var(--bad)">escolha a empresa acima</span>`}</td>
            <td style="font-size:12px;min-width:160px">${r.feito ? r.feito.map(esc).join("<br>") : dv ? `<b style="color:var(--warn)">A confirmar:</b> ${!r.tipo ? "o sistema não identificou o tipo" : r.erro ? esc(r.erro) : ["balanco", "dre", "balancete"].includes(r.tipo) ? (planilhaEstranha(r) ? "a planilha não parece um balancete (poucas linhas ou códigos que não são de conta)" : "nenhuma conta com saldo foi lida") : "tipo genérico"}${r.leu === false ? " (sem texto legível: foto ou digitalização)" : ""}. Toque em Ver, escolha o tipo e Aprovar, ou Excluir.` : r.aprovado ? `aprovado por você${r.tipo ? "" : " (vai como documento do dossiê)"}` : r.tipo ? `identificado pelo ${esc(r.como || "usuário")}` : ""}</td></tr>${abertos.has(i) ? `<tr><td colspan="4">${previa(r)}</td></tr>` : ""}`; }).join("")}</tbody></table></div>`;
      $$("[data-dcv]", p).forEach(x => x.onclick = () => { const i = +x.dataset.dcv; abertos.has(i) ? abertos.delete(i) : abertos.add(i); desenha(); });
      $$("[data-dct]", p).forEach(x => x.onchange = () => { R[+x.dataset.dct].tipo = x.value || null; R[+x.dataset.dct].como = "usuário"; desenha(); });
      $$("[data-dcx]", p).forEach(x => x.onclick = () => { R.splice(+x.dataset.dcx, 1); abertos.clear(); desenha(); });
      $$("[data-dca]", p).forEach(x => x.onclick = () => { const r = R[+x.dataset.dca]; if (!r.tipo){ toast("Escolha o tipo do documento ao lado e toque em Aprovar"); return; } r.aprovado = true; r.como = r.como || "usuário"; desenha(); });
      $$("[data-dcr]", p).forEach(x => x.onclick = async () => { const i = +x.dataset.dcr, f = R[i].f; x.disabled = true; x.textContent = "Lendo…"; try{ R[i] = await ler(f); }catch(e){ R[i] = {f, tipo:null, cnpjs:[], erro:"não foi possível ler"}; } desenha(); }); };
    $("#dc-f").onchange = async ev => { const fs = [...ev.target.files]; ev.target.value = ""; if (!fs.length) return; const p = $("#dc-prev"); p.innerHTML = `<div class="result">Lendo ${fs.length} arquivo(s)…</div>`;
      const MIME = {pdf:"application/pdf", docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv:"text/csv", txt:"text/plain", xml:"text/xml", jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png"};
      const todos = []; for (const f of fs){ if (/\.zip$/i.test(f.name)){ try{ const z = await IMP.unzip(await f.arrayBuffer()); for (const [nome, ent] of Object.entries(z)){ if (/\/$|__MACOSX|(^|\/)\./.test(nome)) continue; const ext = (nome.split(".").pop() || "").toLowerCase(); if (!MIME[ext]) continue; todos.push(new File([await ent.bytes()], nome.split("/").pop(), {type:MIME[ext]})); } }catch(e){ toast("Não foi possível abrir " + f.name); } } else todos.push(f); }
      const forca = modo === "tipo" ? $("#dc-tipo").value : "";
      for (const f of todos){ p.innerHTML = `<div class="result">Lendo ${esc(f.name)}…</div>`; let r; try{ r = await ler(f); }catch(e){ r = {f, tipo:null, cnpjs:[], erro:"não foi possível ler"}; } if (forca){ r.tipo = forca; r.como = "usuário"; } R.push(r); }
      /* balanço e DRE do mesmo período viram um só balancete na Due Diligence */
      desenha(); };
    $("#dc-go").onclick = async () => { const err = $("#dc-err"), fixo = $("#dc-sup").value, go = $("#dc-go"); err.hidden = true;
      const sem = R.filter(r => !r.feito && (!duvida(r) || r.aprovado) && !alvoDe(r, fixo) && !r.cnpjs[0]); if (sem.length){ err.textContent = `Escolha a empresa de ${sem.length} documento(s) sem CNPJ reconhecido.`; err.hidden = false; return; }
      go.disabled = true; let n = 0; const tocados = new Set();
      const fila = R.filter(x => !x.feito && (!duvida(x) || x.aprovado));
      for (const r of fila){ go.textContent = `Importando ${++n}/${fila.length}…`;
        try{ let s = alvoDe(r, fixo); if (!s) s = await novoTarget(r); if (!s){ r.feito = ["sem empresa"]; continue; } tocados.add(s.id); r.feito = await aplicar(s, r); }catch(e){ console.error(e); r.feito = ["erro: " + (e.message || "não importado")]; } }
      cartaoPelaReceita(); desenha(); toast(`${n} documento(s) importado(s)`); renderAll();
      if (window.KT_ANAUTO){ go.textContent = "Analisando…"; const box = document.createElement("div"); box.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-top:10px"; $("#dc-prev").appendChild(box);
        for (const id of tocados){ const s = supById(id); if (!s) continue; if (s.anaAutoOn === false){ const el0 = document.createElement("div"); el0.innerHTML = `<div class="result">${esc(s.nome)}: análise automática desligada. Analise um documento por vez no dossiê (aba Documentos).</div>`; box.appendChild(el0); continue; } const el = document.createElement("div"); el.innerHTML = `<div class="result">Análise automática de ${esc(s.nome)}…</div>`; box.appendChild(el);
          try{ const res = await KT_ANAUTO.rodar(s, {reler:false}); el.innerHTML = KT_ANAUTO.html(supById(id) || s, res, {compacto:true}); KT_ANAUTO.bind(el, supById(id) || s, close); }catch(e){ console.error(e); el.innerHTML = `<div class="result">Análise de ${esc(s.nome)} não concluída: ${esc(e.message || "erro")}</div>`; } }
        go.textContent = "Importado"; renderAll(); }
      sino(true); };
    sino(false);
  }

  /* Base inicial: botão "Importação de documentos" */
  const _cad = renderCadeia;
  renderCadeia = function(){ const r = _cad.apply(this, arguments); const top = $("#bi-top"); if (!top || top.querySelector("#bi-docs") || Store.me?.canWrite === false) return r;
    const g = top.querySelector("#bi-imp")?.parentElement; if (g){ const b = document.createElement("button"); b.type = "button"; b.className = "btn"; b.id = "bi-docs"; b.style.cssText = "min-height:64px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;white-space:normal;grid-column:1/-1";
      b.innerHTML = `<b style="font-size:15px">Importação de documentos</b><span style="font-size:12px;opacity:.85;font-weight:500">balanços, DRE, balancetes, contrato social, certidões, mandato, NDA, SPA: o sistema reconhece e organiza</span>`; g.appendChild(b); b.onclick = () => importar();
      if (window.KT_ANAUTO){ const a = document.createElement("button"); a.type = "button"; a.className = "btn"; a.id = "bi-ana"; a.style.cssText = b.style.cssText;
        a.innerHTML = `<b style="font-size:15px">Analisar documentos importados</b><span style="font-size:12px;opacity:.85;font-weight:500">roda as análises automáticas da empresa: demonstrações, Due Diligence, valuation, PPA, impairment e jurídico; ler, excluir ou trocar documentos</span>`;
        g.appendChild(a); a.onclick = () => KT_ANAUTO.abrir(); } }
    return r; };
  /* dossiê: a importação sai daqui e fica na Base inicial (atalho para a mesma tela, com a empresa escolhida) */
  EXT_DOCS.push((s, b) => { setTimeout(() => { const head = b.querySelector(".head"); if (!head) return;
      $$("#doc-add", b).forEach(x => x.remove()); $$("button", head).filter(x => /importar vários documentos/i.test(x.textContent)).forEach(x => x.remove()); $$("[data-anx]", b).forEach(x => x.remove());
      if (Store.me?.canWrite !== false && !head.querySelector("[data-dcb]")){ const bt = document.createElement("button"); bt.type = "button"; bt.className = "btn sm"; bt.dataset.dcb = "1"; bt.textContent = "Importar documentos"; bt.title = "A importação de documentos fica na Base inicial"; head.appendChild(bt); bt.onclick = () => importar(s.id); } }, 0); });
  setTimeout(cartaoPelaReceita, 4000);
  window.KT_DOCS = {importar, ler, lerBalanco, lerDRE, periodo, aplicar, cartaoPelaReceita, statusDocs, sinoHTML, bindSino};
})();
