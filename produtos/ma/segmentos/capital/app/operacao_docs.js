/* ================= KINSEY CAPITAL · JURÍDICO · SPA E MOU =================
   Documentos da operação pelo lado vendedor (a empresa que a Kinsey assessora):
   - termos da operação (comprador, preço, à vista, parcelas, earn-out, retenção, exclusividade), usados também no PPA;
   - emissão do MOU (resumo não vinculante) e do SPA pelos modelos Kinsey pró-vendedor, sempre em Word editável;
   - importação do MOU ou SPA do advogado do investidor (Word ou PDF): análise pró-vendedor e duas versões em Word,
     uma corrigida pelo sistema (limpa) e outra com controle de alterações e observações nas margens;
   - importação da versão revisada pelo nosso advogado, nova análise e comparação com a versão anterior.
   A análise é inicial e automática: a validação é sempre do advogado responsável (OAB). */
if (window.KT_DD && window.KT_DOCX && window.KT_MAND && window.KT_CONTRATO) (() => {
  const D = KT_DD, X = KT_DOCX, M = KT_MAND;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  const eu = () => Store.me?.email || Store.me?.nome || "";
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const ORIG = {kinsey:"Emitido pela Kinsey", investidor:"Do advogado do investidor", revisada:"Revisado pelo nosso advogado"};

  /* ---------------- termos da operação ---------------- */
  const ORDEM = ["loi", "ioi", "dataroom", "nda"];
  function compradorPadrao(s){
    const A = Object.entries(s.mandato?.acessos || {}).filter(([id]) => supById(id)).sort((a, b) => ORDEM.indexOf(a[1]?.status) - ORDEM.indexOf(b[1]?.status)).filter(([, a]) => ORDEM.includes(a?.status));
    return A[0]?.[0] || (s.investidores || []).find(id => supById(id)) || "";
  }
  function termos(s){
    const T = s.opdoc?.termos || {}, R = M.calc(s), loi = S.contracts.filter(c => c.supplierId === s.id && /LOI|MOU|SPA/i.test(c.tipo || "") && num(c.volume)).sort((a, b) => String(b.criadoEm).localeCompare(a.criadoEm))[0];
    const pct = T.pct ?? (parseFloat(String(s.mandato?.participacao || "").replace(",", ".")) || 100);
    const preco = T.preco ?? (loi ? num(loi.volume) : R.B ? R.vmin / 1e6 * pct / 100 : 0);
    return {comprador:T.comprador ?? compradorPadrao(s), pct, preco, fontePreco:T.preco != null ? "informado" : loi ? `${loi.tipo} ${loi.numero || ""}`.trim() : R.B ? "valor mínimo da operação" : "—",
      dif:T.dif ?? 0, nDif:T.nDif ?? 0, mDif:T.mDif ?? 12, eo:T.eo ?? 0, eoMet:T.eoMet || "EBITDA", eoAnos:T.eoAnos ?? 3, eoMin:T.eoMin ?? 50, eoMax:T.eoMax ?? 130,
      escrow:T.escrow ?? 10, excl:T.excl ?? 60, dd:T.dd ?? 45, perm:T.perm ?? 0, database:T.database || ""};
  }
  function campos(s){
    const T = termos(s), P = M.partes(s), C = M.campos(s), inv = supById(T.comprador), ri = inv?.receita && !inv.receita.erro ? inv.receita : {};
    const preco = T.preco * 1e6, dif = T.dif * 1e6, eo = T.eo * 1e6, av = Math.max(0, preco - dif - eo), qtdF = (n) => `${n} (${M.extenso(n).replace(/\bum\b/g, "uma").replace(/\bdois\b/g, "duas")})`;
    const endInv = [ri.endereco || inv?.endereco || "", (ri.municipio || inv?.municipio) ? `${ri.municipio || inv.municipio}${(ri.uf || inv?.uf) ? "/" + (ri.uf || inv.uf) : ""}` : ""].filter(Boolean).join(", ");
    const pctT = p => `${String(p).replace(".", ",")}% (${M.extenso(Math.floor(p))}${p % 1 ? " vírgula " + M.extenso(Math.round(p % 1 * 10)) : ""} por cento)`;
    return {...P, DATA:C.DATA, DATABASE:T.database || C.DATABASE,
      COMPRADOR:inv ? (ri.razao || inv.nome).trim() : "[nome do investidor]", COMPRADORDOC:inv?.doc || ri.cnpj || "[CNPJ do investidor]", COMPRADOREND:endInv || "[endereço do investidor]",
      PARTICIPACAO:`${pctT(T.pct)} das quotas`, PRECO:preco ? M.reais(preco) : "[preço]",
      AVISTA:preco ? `${M.reais(av)} (“Parcela à Vista”) serão pagos na Data de Fechamento, em moeda corrente, por transferência para as contas indicadas pelos Vendedores.` : "[parcela à vista]",
      DIFERIDO:dif > 0 && T.nDif > 0 ? `${M.reais(dif)} serão pagos em ${qtdF(T.nDif)} parcelas de ${M.reais(dif / T.nDif)}, vencendo a primeira em ${T.mDif} meses após a Data de Fechamento e as demais a cada 12 (doze) meses (“Parcelas a Prazo”).` : "Não há parcelas a prazo.",
      EARNOUT:eo > 0 ? `Até ${M.reais(eo)} serão pagos a título de parcela variável (“Earn-out”), apurada sobre o ${T.eoMet} de ${qtdF(T.eoAnos)} exercícios após o fechamento, conforme as regras deste instrumento.` : "Não há parcela variável (earn-out).",
      ESCROW:T.escrow > 0 && preco ? `Do Preço, ${pctT(T.escrow)}, isto é, ${M.reais(preco * T.escrow / 100)}, ficarão depositados em conta vinculada (escrow), liberados aos Vendedores em duas parcelas iguais aos 12 (doze) e aos 18 (dezoito) meses após a Data de Fechamento, descontadas apenas as Perdas reconhecidas por decisão final ou acordo.` : "Não haverá retenção de parte do Preço.",
      EARNOUTREGRAS:eo > 0 ? `O Earn-out de até ${M.reais(eo)} será pago em ${qtdF(T.eoAnos)} parcelas anuais, apurado sobre o ${T.eoMet} de cada exercício com as mesmas políticas contábeis das demonstrações financeiras de referência, proporcional ao atingimento da meta anual do Anexo 6.1 a partir de ${T.eoMin}% de atingimento e limitado a ${T.eoMax}% da parcela anual. O pagamento integral será antecipado em caso de venda, reorganização societária, alteração relevante da gestão ou destituição sem justa causa dos Vendedores pelo Comprador. O Comprador fornecerá aos Vendedores demonstrações mensais e manterá a Sociedade operando de boa-fé, sem desviar receitas, clientes ou custos; divergências serão decididas por auditor independente escolhido em comum acordo, às expensas do Comprador.` : "Não há parcela variável (earn-out) nesta operação.",
      PERMANENCIA:T.perm > 0 || eo > 0 ? `Os Vendedores permanecerão na gestão por ${T.perm || 12} meses após o fechamento, com remuneração de mercado e autonomia para cumprir as metas do earn-out; a destituição sem justa causa acelera o pagamento integral do earn-out.` : "Os Vendedores colaborarão na transição por até 90 (noventa) dias após o fechamento, sem obrigação de permanência.",
      DDDIAS:`${T.dd} (${M.extenso(T.dd)})`, EXCLDIAS:`${T.excl} (${M.extenso(T.excl)})`};
  }
  const modelo = id => { const o = S.config.modelos_ma?.[id], m = MA_MODELOS.find(x => x.id === id); return o?.texto?.length ? {...m, texto:o.texto, versao:o.versao || "oficial"} : m; };
  const preenche = (txt, c) => String(txt).replace(/\{([A-Z]+)\}/g, (m, k) => c[k] != null ? c[k] : m);
  const paragrafosModelo = (id, c) => modelo(id).texto.flatMap(([h, t], i) => [preenche(h, c), ...preenche(t, c).split("\n")]);

  /* ---------------- correção pró-vendedor ---------------- */
  const KW = {cap:/indeniz[^.]*\b(limit|teto|cap)|\b(limit\w*|teto)[^.]*indeniz/, franquia:/franquia|de minimis|basket/, prazo:/sobreviv|declarac[^.]*(meses|anos)/, escrow:/escrow|conta (vinculada|garantia)|retenc|retid/,
    earnout:/earn.?out|parcela variavel|preco contingente/, ajuste:/ajuste de preco|capital de giro|completion|divida liquida de fechamento/, mac:/efeito adverso|mudanca adversa|material adverse/, sandbag:/conhecimento|due diligence|investigac/,
    solid:/solidari/, garantia:/fianca|aval\b|fiador|garantia pessoal|devedor solidario/, diferido:/parcela|prestac|diferido/, nc:/nao concorr|non.?compet|nao competi/, exclus:/exclusividade/,
    cp:/condic\w* precedente|criterio exclusivo|satisfator|discricionari/, rescisao:/rescindir|resilir|desistir|denunciar/, juros:/juros|multa|honorario/, foro:/arbitragem|foro|lei aplicavel|camara|leis? d/};
  const ANC = {cap:/indeniz/, franquia:/indeniz/, prazo:/declarac/, sandbag:/indeniz|declarac/, earnout:/earn.?out|preco/, ajuste:/preco/, diferido:/pagamento|parcela/, escrow:/pagamento|preco/,
    mac:/condic|adverso/, cp:/condic\w* precedente|condic/, rescisao:/rescis|resil|resolu/, juros:/indeniz/, foro:/foro|arbitragem|lei/, nc:/concorr/, exclus:/exclusiv/, solid:/indeniz|responsab/, garantia:/garanti|indeniz/};
  const frases = p => String(p).split(/(?<=[.;])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ(“"0-9])/);
  /* regras em que o problema é a falta de uma proteção: a frase original fica e a proteção é acrescentada */
  const ACRESCENTA = new Set(["diferido", "ajuste", "mac", "exclus", "earnout"]);
  function corrigir(P0, A){
    const F = P0.map(p => frases(p)), troca = P0.map(() => new Set()), notas = new Map(), add = [], REG = KT_CONTRATO.REGRAS;
    const nota = (k, t) => notas.set(k, (notas.get(k) ? notas.get(k) + "\n" : "") + t);
    const ruins = A.itens.filter(x => x.st !== "ok");
    for (const it of ruins){ const r = REG.find(x => x.id === it.id); if (!r) continue;
      const bate = t => { try{ return r.f(nrm(t)).st === "atencao"; }catch(e){ return false; } };
      if (it.st === "atencao"){
        /* procura primeiro dentro da seção cujo título trata do tema (ex.: condições precedentes, indenização) */
        const sec = ANC[it.id] ? (() => { const h = P0.findIndex(p => X.ehTitulo(p) && ANC[it.id].test(nrm(p))); if (h < 0) return null; let e = h + 1; while (e < P0.length && !X.ehTitulo(P0[e])) e++; return [h + 1, e]; })() : null;
        const acha = ok => { if (sec){ for (let i = sec[0]; i < sec[1]; i++) if (ok(P0[i])) return i; } return P0.findIndex(ok); };
        let k = acha(p => bate(p) && !X.ehTitulo(p)); if (k < 0 && KW[it.id]) k = acha(p => KW[it.id].test(nrm(p)) && p.length > 40 && !X.ehTitulo(p));
        if (k >= 0){ const O = frases(P0[k]); let j = O.findIndex(bate); if (j < 0 && KW[it.id]) j = O.findIndex(f => KW[it.id].test(nrm(f)));
          const alvo = j >= 0 ? F[k].indexOf(O[j]) : -1;
          if (alvo >= 0 && !ACRESCENTA.has(it.id)){ F[k][alvo] = it.sug; troca[k].add(it.sug); }
          else { const pos = alvo >= 0 ? alvo + 1 : F[k].length; F[k].splice(pos, 0, it.sug); }
          nota(k, `[${it.sev}] ${it.t}: ${it.txt} Proposta pró-vendedor: ${it.sug}`); continue; } }
      add.push(it); }
    const P = F.map(x => x.join(" "));
    /* cláusulas ausentes: ao fim da seção relacionada (título com o tema) ou, sem ela, antes das assinaturas */
    const fim = (() => { const i = P.findIndex(p => /^(e,? por estarem|local e data|testemunhas|s[aã]o paulo, \d)/i.test(p.trim())); return i >= 0 ? i : P.length; })();
    const fimSecao = h => { let i = h + 1; while (i < fim && !X.ehTitulo(P[i])) i++; return i; };
    const ancora = re => { const h = P.findIndex((p, i) => i < fim && X.ehTitulo(p) && re.test(nrm(p))); if (h >= 0) return fimSecao(h);
      const k = P.findIndex((p, i) => i < fim && !X.ehTitulo(p) && re.test(nrm(p)) && p.length > 40); return k >= 0 ? k + 1 : -1; };
    const ins = [];
    add.forEach(it => { const k = ANC[it.id] ? ancora(ANC[it.id]) : -1; ins.push({k:k >= 0 ? k : fim, it}); });
    ins.sort((a, b) => b.k - a.k).forEach(({k, it}) => { P.splice(k, 0, it.sug);
      const N = new Map(); notas.forEach((v, i) => N.set(i >= k ? i + 1 : i, v)); notas.clear(); N.forEach((v, i) => notas.set(i, v));
      nota(k, `[${it.sev}] ${it.t}: cláusula ausente no documento recebido (${it.txt}). Incluída a redação pró-vendedor.`); });
    return {P, notas, alterados:ruins.length};
  }
  const resumoAnalise = (A, o = {}) => { const r = A.itens.filter(x => x.st !== "ok"), sev = k => r.filter(x => x.sev === k).length;
    return `Análise pró-vendedor (KinseyTec) do ${A.tipo}${o.arquivo ? " " + o.arquivo : ""}: ${r.length} ponto(s) desfavorável(is) ou ausente(s) de ${A.itens.length} verificados (Alta ${sev("Alta")}, Média ${sev("Média")}, Baixa ${sev("Baixa")}). Pontos favoráveis mantidos: ${A.itens.filter(x => x.st === "ok").map(x => x.t).join("; ") || "nenhum"}. Análise inicial automática: a validação é do advogado responsável.`; };

  /* ---------------- Word ---------------- */
  const cab = (s, txt) => `${txt} · ${s.mandato?.codinome || s.nome} · ${dBR(nowISO())} · confidencial`;
  const nomeArq = (s, tipo, rot, v) => `${tipo}_${(s.mandato?.codinome || s.nome || "target").replace(/[^\wÀ-ú]+/g, "_").slice(0, 30)}_v${v}_${rot}.docx`;
  const baixa = (bytes, nome) => rptSave(bytes, nome, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  function wordLimpo(s, k, P, rot){ return baixa(X.build(X.deTexto(P, {titulo:true}), {header:cab(s, `${k.tipo} v${k.versao} · ${rot}`), headerColor:"5A6578", titulo:`${k.tipo} · ${s.nome}`}), nomeArq(s, k.tipo, rot.replace(/\s+/g, "_"), k.versao)); }
  async function wordCorrigido(s, k, controle){
    const A = k.analiseVend || KT_CONTRATO.analisar(k.paragrafos.join("\n"), "venda"), C = corrigir(k.paragrafos, A);
    if (!controle) return wordLimpo(s, k, C.P, "corrigida pelo sistema");
    const paras = X.comparar(k.paragrafos, C.P, C.notas); paras[0] = {...paras[0], comment:[resumoAnalise(A, {arquivo:k.arquivo}), paras[0].comment].filter(Boolean).join("\n")};
    return baixa(X.build(paras, {header:cab(s, `${k.tipo} v${k.versao} · controle de alterações pró-vendedor`), track:true, titulo:`${k.tipo} · ${s.nome} · revisão`}), nomeArq(s, k.tipo, "controle_de_alteracoes", k.versao));
  }
  async function wordComparado(s, k, ant){
    const A = k.analiseVend, paras = X.comparar(ant.paragrafos, k.paragrafos);
    paras[0] = {...paras[0], comment:`Comparação da versão ${k.versao} (${ORIG[k.origemDoc] || ""}) com a versão ${ant.versao} (${ORIG[ant.origemDoc] || ""}).${A ? "\n" + resumoAnalise(A) : ""}`};
    return baixa(X.build(paras, {header:cab(s, `${k.tipo} v${ant.versao} → v${k.versao} · alterações`), track:true, titulo:`${k.tipo} · ${s.nome} · comparação`}), nomeArq(s, k.tipo, `comparacao_v${ant.versao}`, k.versao));
  }

  /* ---------------- registros (contratos do Jurídico) ---------------- */
  const docs = s => S.contracts.filter(c => c.supplierId === s.id && c.opdoc).sort((a, b) => (a.versao || 0) - (b.versao || 0) || String(a.criadoEm).localeCompare(b.criadoEm));
  async function registrar(s, tipo, origem, P, arquivo){
    const L = docs(s).filter(x => x.tipo === tipo), v = (L[L.length - 1]?.versao || 0) + 1, id = "op" + Date.now().toString(36), T = termos(s);
    const A = origem === "kinsey" ? null : KT_CONTRATO.analisar(P.join("\n"), "venda");
    const k = {supplierId:s.id, tipo, numero:`${tipo} v${v}`, contraparte:supById(T.comprador)?.nome || "", inicio:"", fim:"", volume:T.preco ? String(T.preco) : "", preco:"", obs:ORIG[origem],
      opdoc:true, origemDoc:origem, versao:v, arquivo:arquivo || "", paragrafos:P.slice(0, 2500).map(p => String(p).slice(0, 6000)), criadoEm:nowISO(), por:eu(), ...(A ? {analiseVend:A} : {})};
    await save(Store.set("contracts", id, k)); return {...k, id};
  }
  async function lerArquivo(f){
    const buf = await f.arrayBuffer(), n = f.name.toLowerCase();
    if (/\.docx$/.test(n)){ const z = await IMP.unzip(buf), xml = await z["word/document.xml"]?.get(); if (!xml) return [];
      const doc = new DOMParser().parseFromString(xml, "application/xml"), W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
      /* texto aceito: ignora trechos excluídos com controle de alterações */
      return [...doc.getElementsByTagNameNS(W, "p")].map(p => [...p.getElementsByTagNameNS(W, "t")].filter(t => !t.closest || !t.closest("del")).map(t => t.textContent).join("").trim()).filter(Boolean); }
    if (/\.pdf$/.test(n)) return X.paragrafosPDF((await IMP.lerPDF(buf)).map(r => r.join(" ")));
    if (/\.(txt|md)$/.test(n)) return new TextDecoder().decode(buf).split(/\n\s*\n|\r?\n(?=\s*(?:\d{1,2}\.|cl[aá]usula|\([a-z]\)))/i).map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error("formato");
  }

  /* ---------------- tela: Jurídico · SPA e MOU ---------------- */
  const corSev = {Alta:"r-alto", "Média":"r-medio", Baixa:"r-pend"};
  function resultado(s, k){
    const A = k.analiseVend, r = A ? A.itens.filter(x => x.st !== "ok") : [], ant = docs(s).filter(x => x.tipo === k.tipo && x.versao < k.versao).pop();
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(k.tipo)} v${k.versao} · ${esc(ORIG[k.origemDoc] || "")}</div><h2>Análise pró-vendedor</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        <p class="sub" style="margin:0">${A ? esc(resumoAnalise(A, {arquivo:k.arquivo})) : ""}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-dw="limpa">Versão corrigida pelo sistema (Word)</button><button type="button" class="btn primary" data-dw="controle">Versão com controle de alterações e observações (Word)</button>
          ${ant ? `<button type="button" class="btn" data-dw="comp">Comparar com a v${ant.versao} (Word)</button>` : ""}</div>
        ${r.length ? `<div style="display:flex;flex-direction:column;gap:6px">${r.sort((a, b) => ["Alta", "Média", "Baixa"].indexOf(a.sev) - ["Alta", "Média", "Baixa"].indexOf(b.sev)).map(x => `<details><summary style="cursor:pointer"><span class="pill ${corSev[x.sev]}" style="font-size:10.5px">${x.st === "ausente" ? "Ausente" : "Desfavorável"} · ${x.sev}</span> <b style="font-size:13px">${esc(x.t)}</b> <span class="sub" style="font-size:12.5px">${esc(x.txt)}</span></summary>${x.trecho ? `<p class="sub" style="margin:6px 0 0;font-size:12px;font-style:italic">${esc(x.trecho)}</p>` : ""}<p style="margin:6px 0 0;font-size:13px"><b>Redação pró-vendedor:</b> ${esc(x.sug)}</p></details>`).join("")}</div>` : `<div class="banner" style="border-color:rgba(54,211,153,.45)">Nenhum ponto desfavorável encontrado nas cláusulas verificadas.</div>`}
        <p class="sub" style="margin:0;font-size:12px">Edite no Word (aceite ou rejeite as alterações) e importe de novo como "Revisado pelo nosso advogado" para registrar a versão revisada.</p></div>`);
    $$("[data-dw]").forEach(b => b.onclick = async () => { b.disabled = true; try{ if (b.dataset.dw === "comp") await wordComparado(s, k, ant); else await wordCorrigido(s, k, b.dataset.dw === "controle"); }catch(e){ console.error(e); toast("Não foi possível gerar o Word."); } b.disabled = false; });
    return close;
  }
  function painel(host){
    const T0 = S.suppliers.filter(x => x.nivel === "N3" && x.etapa !== "descartada").sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt"));
    let s = supById(S.mandAlvo); if (!s || s.nivel !== "N3") s = T0.find(x => x.mandato?.status === "assinado") || T0[0];
    const el = document.createElement("div"); el.style.cssText = "display:flex;flex-direction:column;gap:14px"; el.id = "jur-op";
    if (!s){ el.innerHTML = `<div class="empty">Nenhum target cadastrado.</div>`; host.appendChild(el); return; }
    S.mandAlvo = s.id; const ed = D.ed(), T = termos(s), L = docs(s), invs = [...new Set([...(s.investidores || []), ...Object.keys(s.mandato?.acessos || {})])].map(supById).filter(Boolean);
    const f = (id, l, v, o = {}) => `<div class="fld"><label for="op-${id}">${l}</label><input id="op-${id}" ${o.num !== false ? 'inputmode="decimal"' : ""} value="${esc(String(v ?? "").replace(/^(\d+)\.(\d+)$/, "$1,$2"))}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ""} ${ed ? "" : "disabled"}></div>`;
    el.innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:12px">
        <div class="head" style="margin:0"><div><div class="eyebrow">Jurídico · SPA e MOU</div><h3 style="margin:0">Documentos da operação · pró-vendedor</h3>
          <p class="sub" style="margin:2px 0 0">Emita o MOU (resumo da operação) e o SPA pelos modelos Kinsey, ou importe o documento do advogado do investidor para a análise pró-vendedor com as duas versões em Word.</p></div></div>
        <div class="form"><div class="fld full"><label for="op-alvo">Target</label><select id="op-alvo">${T0.map(x => `<option value="${x.id}" ${x.id === s.id ? "selected" : ""}>${esc(x.nome)}${x.mandato?.codinome ? " · " + esc(x.mandato.codinome) : ""}</option>`).join("")}</select></div></div></div>
      <form class="card" id="op-f" style="display:flex;flex-direction:column;gap:10px" novalidate><h3 style="margin:0">Termos da operação</h3>
        <p class="sub" style="margin:0;font-size:12.5px">Preço sugerido: ${esc(T.fontePreco)}. Preço = parcela à vista + parcelas a prazo + earn-out máximo. Estes termos alimentam o MOU, o SPA e o PPA.</p>
        <div class="form"><div class="fld full"><label for="op-cmp">Investidor (comprador)</label><select id="op-cmp" ${ed ? "" : "disabled"}><option value="">— a definir —</option>${invs.map(v => `<option value="${v.id}" ${v.id === T.comprador ? "selected" : ""}>${esc(v.nome)}${s.mandato?.acessos?.[v.id]?.status ? " · " + esc(s.mandato.acessos[v.id].status.toUpperCase()) : ""}</option>`).join("")}</select></div>
          ${f("pct", "Participação vendida (%)", T.pct)}${f("pr", "Preço total (R$ mi)", T.preco ? +T.preco.toFixed(3) : "")}${f("df", "Parcelas a prazo (R$ mi)", T.dif)}${f("nd", "Nº de parcelas a prazo", T.nDif)}${f("md", "1ª parcela (meses após o fechamento)", T.mDif)}
          ${f("eo", "Earn-out máximo (R$ mi)", T.eo)}<div class="fld"><label for="op-em">Métrica do earn-out</label><select id="op-em" ${ed ? "" : "disabled"}>${["EBITDA", "faturamento bruto", "receita líquida", "lucro líquido"].map(x => `<option ${x === T.eoMet ? "selected" : ""}>${x}</option>`).join("")}</select></div>
          ${f("ea", "Anos do earn-out", T.eoAnos)}${f("emi", "Earn-out: atingimento mínimo (%)", T.eoMin)}${f("ema", "Earn-out: teto (% da parcela)", T.eoMax)}${f("es", "Retenção / escrow (% do preço)", T.escrow)}${f("ex", "Exclusividade (dias)", T.excl)}${f("dd", "Prazo da auditoria (dias)", T.dd)}${f("pm", "Permanência dos sócios (meses)", T.perm)}
          ${f("db", "Data-base (locked box)", T.database, {num:false, ph:M.campos(s).DATABASE})}</div>
        ${ed ? `<div style="display:flex;justify-content:flex-end"><button type="submit" class="btn">Salvar termos</button></div>` : ""}</form>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Emitir pelos modelos Kinsey (Word)</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${ed ? `<button type="button" class="btn primary" data-em="MOU">Emitir MOU · resumo da operação</button><button type="button" class="btn primary" data-em="SPA">Emitir SPA · minuta pró-vendedor</button>` : ""}</div>
        <p class="sub" style="margin:0;font-size:12.5px">Campos a completar saem em amarelo. Para usar o SPA oficial da Kinsey, inclua o texto em "NDAs, mandatos e modelos" (modelo "SPA · contrato de compra e venda").</p></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Importar MOU ou SPA (Word ou PDF)</h3>
        <div class="form"><div class="fld"><label for="op-it">Documento</label><select id="op-it"><option>SPA</option><option>MOU</option></select></div><div class="fld"><label for="op-io">Origem</label><select id="op-io"><option value="investidor">Do advogado do investidor</option><option value="revisada">Revisado pelo nosso advogado</option></select></div>
          <div class="fld full"><label for="op-ia">Arquivo</label><input id="op-ia" type="file" accept=".docx,.pdf,.txt" ${ed ? "" : "disabled"}></div></div>
        <p class="sub" style="margin:0;font-size:12.5px">O sistema lê o documento, faz a análise pró-vendedor e entrega duas versões em Word: uma corrigida pelo sistema e outra com controle de alterações e as observações nas margens.</p><p class="err" id="op-err" hidden></p></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3 style="margin:0">Versões</h3>
        ${L.length ? `<div class="tbl"><table><thead><tr><th>Documento</th><th>Origem</th><th>Data</th><th>Pontos pró-vendedor</th><th></th></tr></thead><tbody>${L.slice().reverse().map(k => { const r = k.analiseVend ? k.analiseVend.itens.filter(x => x.st !== "ok") : null;
          return `<tr><td><b>${esc(k.tipo)} v${k.versao}</b>${k.arquivo ? `<div class="sub" style="font-size:11.5px;margin:0">${esc(k.arquivo)}</div>` : ""}</td><td>${esc(ORIG[k.origemDoc] || "")}</td><td>${dBR(k.criadoEm)}</td><td>${r ? (r.length ? `<span class="pill ${r.some(x => x.sev === "Alta") ? "r-alto" : "r-medio"}">${r.length} a ajustar</span>` : `<span class="pill r-baixo">OK</span>`) : "modelo Kinsey"}</td>
            <td style="white-space:nowrap;text-align:right">${k.origemDoc === "kinsey" ? `<button type="button" class="btn sm" data-wk="${k.id}">Word</button>` : `<button type="button" class="btn sm primary" data-an="${k.id}">Análise e Word</button>`}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0">Nenhum documento ainda.</p>`}</div>`;
    host.appendChild(el);
    $("#op-alvo", el).onchange = e => { S.mandAlvo = e.target.value; renderJuridico(); };
    $("#op-f", el).onsubmit = async e => { e.preventDefault(); if (!ed) return; const v = k => $("#op-" + k, el).value.trim(), n = (k, d) => { const x = num(v(k)); return x != null && !isNaN(x) && v(k) !== "" ? x : d; };
      await D.up(s, {opdoc:{termos:{comprador:$("#op-cmp", el).value, pct:n("pct", 100), preco:n("pr", null), dif:n("df", 0), nDif:Math.round(n("nd", 0)), mDif:Math.round(n("md", 12)), eo:n("eo", 0), eoMet:$("#op-em", el).value, eoAnos:Math.round(n("ea", 3)), eoMin:n("emi", 50), eoMax:n("ema", 130), escrow:n("es", 10), excl:Math.round(n("ex", 60)), dd:Math.round(n("dd", 45)), perm:Math.round(n("pm", 0)), database:v("db")}}});
      toast("Termos da operação salvos"); renderJuridico(); };
    $$("[data-em]", el).forEach(b => b.onclick = async () => { b.disabled = true; try{ const tipo = b.dataset.em, c = campos(supById(s.id) || s), P = paragrafosModelo(tipo === "MOU" ? "mou_venda" : "spa_venda", c);
      const k = await registrar(s, tipo, "kinsey", P, ""); await wordLimpo(s, k, P, "minuta Kinsey"); toast(`${tipo} v${k.versao} emitido`); }catch(x){ console.error(x); toast("Não foi possível emitir o documento."); } renderJuridico(); });
    const inp = $("#op-ia", el); if (inp) inp.onchange = async () => { const fl = inp.files[0]; if (!fl) return; const er = $("#op-err", el); er.hidden = true;
      let P = []; try{ P = await lerArquivo(fl); }catch(x){ er.textContent = /\.doc$/i.test(fl.name) ? "Arquivo .doc antigo: salve como .docx no Word e importe de novo." : "Não consegui ler o arquivo. Use Word (.docx), PDF com texto ou TXT."; er.hidden = false; return; }
      if (P.join(" ").length < 300){ er.textContent = "Texto não encontrado ou curto demais (PDF digitalizado não é lido). Envie o Word."; er.hidden = false; return; }
      const k = await registrar(s, $("#op-it", el).value, $("#op-io", el).value, P, fl.name); renderJuridico(); resultado(supById(s.id) || s, k); };
    $$("[data-an]", el).forEach(b => b.onclick = () => resultado(s, S.contracts.find(c => c.id === b.dataset.an)));
    $$("[data-wk]", el).forEach(b => b.onclick = () => { const k = S.contracts.find(c => c.id === b.dataset.wk); wordLimpo(s, k, k.paragrafos, "minuta Kinsey"); });
  }
  if (typeof renderJuridico === "function"){ const _jr = renderJuridico;
    renderJuridico = function(){ _jr.apply(this, arguments); const host = $("#juridico"); if (!host) return; const tabs = host.querySelector(".dd-tabs"); if (!tabs) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "fbtn"; b.dataset.jur = "op"; b.textContent = "SPA e MOU"; b.setAttribute("aria-pressed", String(S.jurTab === "op"));
      const ref = tabs.querySelector('[data-jur="docs"]'); if (ref) ref.before(b); else tabs.appendChild(b); b.onclick = () => { S.jurTab = "op"; renderJuridico(); };
      if (S.jurTab !== "op") return;
      tabs.querySelectorAll("[data-jur]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.jur === "op")));
      const top = tabs.closest("#juridico > *") || tabs.parentElement; while (top.nextSibling) top.nextSibling.remove();
      try{ painel(host); }catch(e){ console.error(e); host.insertAdjacentHTML("beforeend", `<div class="empty">Não foi possível montar os documentos da operação.</div>`); } };
  }
  window.KT_OPDOC = {termos, campos, corrigir, lerArquivo, docs, registrar, wordCorrigido, wordComparado, paragrafosModelo};
})();
