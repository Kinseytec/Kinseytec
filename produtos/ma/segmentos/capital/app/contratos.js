/* ================= KINSEY CAPITAL · JURÍDICO · ANÁLISE INICIAL PRÓ-VENDEDOR =================
   A Kinsey Capital negocia pelo vendedor. Ao incluir um MOU, LOI, term sheet ou SPA, o sistema lê o texto
   (PDF ou Word anexado, ou texto colado) e aponta, do ponto de vista do vendedor, as cláusulas desfavoráveis,
   as ausentes e a redação sugerida. É uma análise inicial: a validação é sempre do advogado (OAB). */
if (typeof MA_MODELOS !== "undefined") (() => {
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
  const trecho = (t, i, n = 220) => i < 0 ? "" : "…" + t.slice(Math.max(0, i - 40), i + n).trim() + "…";
  const achaNum = (t, re) => { const m = re.exec(t); return m ? {v:parseFloat(String(m[m.length - 2] || m[1]).replace(",", ".")), i:m.index, u:m[m.length - 1]} : null; };
  /* cada regra: id, título, gravidade se desfavorável, teste(texto normalizado) → {st:"ok"|"atencao"|"ausente", txt, i}, redação sugerida */
  const REGRAS = [
    {id:"cap", t:"Limite de indenização (teto)", sev:"Alta", f:t => { const m = achaNum(t, /(limit\w*|teto|\bcap\b)[^.;]{0,140}?(\d{1,3}(?:[.,]\d+)?)\s*(%|por cento)/);
      if (!/indeniz/.test(t)) return {st:"na"}; if (!m && !/(limit\w*|teto|\bcap\b)[^.;]{0,80}indeniz|indeniz[^.;]{0,120}(limit\w*|teto|\bcap\b)/.test(t)) return {st:"ausente", txt:"Indenização sem teto: o vendedor responde sem limite."};
      return m && m.v > 30 ? {st:"atencao", txt:`Teto de ${m.v}% do preço, alto para o vendedor.`, i:m.i} : {st:"ok", txt:m ? `Teto de ${m.v}% do preço.` : "Há limitação de indenização.", i:m?.i ?? -1}; },
      sug:"A responsabilidade total dos Vendedores por indenização fica limitada a 10% (dez por cento) do Preço, exceto em caso de dolo ou fraude comprovados."},
    {id:"franquia", t:"Franquia e valor mínimo por reclamação", sev:"Média", f:t => !/indeniz/.test(t) ? {st:"na"} : /(franquia|de minimis|basket|valor minimo|cesta)/.test(t) ? {st:"ok", txt:"Há franquia ou valor mínimo."} : {st:"ausente", txt:"Sem franquia: qualquer valor gera reclamação de indenização."},
      sug:"Não serão indenizáveis Perdas individuais inferiores a R$ 50.000,00 (de minimis), e a indenização só será devida quando as Perdas acumuladas excederem 1% (um por cento) do Preço (franquia dedutível)."},
    {id:"prazo", t:"Prazo de sobrevivência das declarações", sev:"Média", f:t => { const m = achaNum(t, /(sobreviv|prazo de|vigorar[aã]o por|pelo prazo de)[^.;]{0,100}?(\d{1,3})\s*(meses|anos)/);
      if (!/declarac/.test(t)) return {st:"na"}; if (!m) return {st:"ausente", txt:"Prazo das declarações não definido: pode valer até a prescrição legal."};
      const meses = m.u === "anos" ? m.v * 12 : m.v; return meses > 24 ? {st:"atencao", txt:`Declarações gerais por ${m.v} ${m.u}, acima de 24 meses.`, i:m.i} : {st:"ok", txt:`Declarações gerais por ${m.v} ${m.u}.`, i:m.i}; },
      sug:"As declarações e garantias gerais sobrevivem por 18 (dezoito) meses após o Fechamento; as fiscais, trabalhistas e previdenciárias, até o prazo prescricional aplicável."},
    {id:"escrow", t:"Retenção de preço ou conta garantia (escrow)", sev:"Média", f:t => { const m = achaNum(t, /(escrow|conta vinculada|conta garantia|retenc[aã]o|retido)[^.;]{0,160}?(\d{1,3}(?:[.,]\d+)?)\s*(%|por cento)/);
      if (!m) return /(escrow|conta vinculada|conta garantia|retenc)/.test(t) ? {st:"atencao", txt:"Há retenção, mas sem percentual identificado."} : {st:"ok", txt:"Sem retenção de preço."};
      return m.v > 15 ? {st:"atencao", txt:`Retenção de ${m.v}% do preço, acima de 10–15%.`, i:m.i} : {st:"ok", txt:`Retenção de ${m.v}% do preço.`, i:m.i}; },
      sug:"Será retido em conta vinculada 10% (dez por cento) do Preço, liberado em duas parcelas iguais aos 12 e aos 18 meses após o Fechamento, descontadas apenas as Perdas reconhecidas por decisão final ou acordo."},
    {id:"earnout", t:"Earn-out (parcela variável)", sev:"Alta", f:t => !/(earn.?out|parcela variavel|preco contingente|pagamento adicional condicionado)/.test(t) ? {st:"na"} : /(ebitda|receita|meta)[^.;]{0,200}(criterio|politica)s? contab/.test(t) && /(aceler|vencimento antecipado|mudanca de controle)/.test(t) ? {st:"ok", txt:"Earn-out com métrica e proteção de aceleração."} : {st:"atencao", txt:"Earn-out sem critérios contábeis fixos ou sem aceleração se o comprador mudar a gestão ou vender a empresa."},
      sug:"O Earn-out será apurado pelo EBITDA calculado com as mesmas políticas contábeis das Demonstrações Financeiras de Referência; o pagamento integral será antecipado em caso de venda, reorganização ou alteração relevante da gestão pelo Comprador."},
    {id:"ajuste", t:"Mecanismo de ajuste de preço", sev:"Média", f:t => /locked.?box|caixa travad/.test(t) ? {st:"ok", txt:"Locked box: preço fixo na data-base, favorável ao vendedor."} : /(ajuste de preco|capital de giro|divida liquida de fechamento|completion accounts)/.test(t) ? (/(meta|peg|referencia|normalizad)/.test(t) && /(perito|auditor independente|especialista)/.test(t) ? {st:"ok", txt:"Ajuste com referência e perito independente."} : {st:"atencao", txt:"Ajuste de preço sem capital de giro de referência ou sem perito para divergências."}) : {st:"na"},
      sug:"O Preço será ajustado, para mais ou para menos, pela diferença entre o capital de giro na Data de Fechamento e o Capital de Giro de Referência de R$ [●]; divergências serão decididas por auditor independente escolhido de comum acordo."},
    {id:"mac", t:"Efeito adverso relevante (MAC)", sev:"Alta", f:t => !/(efeito adverso relevante|mudanca adversa relevante|material adverse|\bmac\b|\bmae\b)/.test(t) ? {st:"na"} : /(exceto|excluid|nao serao considerad)[^.;]{0,200}(mercado|setor|economi|pandemi|legisla)/.test(t) ? {st:"ok", txt:"MAC com exclusões de mercado e setor."} : {st:"atencao", txt:"MAC amplo, sem excluir efeitos de mercado, setor, economia ou mudança de lei."},
      sug:"Não constituirão Efeito Adverso Relevante os efeitos decorrentes de condições gerais da economia, do mercado financeiro, do setor de atuação da Companhia, de mudança de legislação ou de eventos de força maior que não afetem a Companhia de forma desproporcional."},
    {id:"sandbag", t:"Conhecimento do comprador (sandbagging)", sev:"Alta", f:t => /(independentemente|nao obstante|ainda que)[^.;]{0,120}(conhecimento|diligencia|due diligence|investigac)/.test(t) ? {st:"atencao", txt:"Comprador pode reclamar de fato que conhecia na due diligence (sandbagging pró-comprador)."} : /(informac|fato)[^.;]{0,120}(divulgad|revelad|disponibilizad)[^.;]{0,120}(data room|sala de dados|due diligence)/.test(t) ? {st:"ok", txt:"Fatos revelados no data room afastam a indenização."} : {st:"ausente", txt:"Contrato não diz que o que foi revelado no data room não gera indenização."},
      sug:"Não serão indenizáveis Perdas decorrentes de fatos, atos ou documentos divulgados no Data Room, nos Anexos de Exceção ou de outra forma conhecidos pelo Comprador antes da assinatura."},
    {id:"solid", t:"Responsabilidade solidária dos vendedores", sev:"Média", f:t => /solidari/.test(t) && /vendedor/.test(t) ? {st:"atencao", txt:"Vendedores respondem solidariamente: um sócio pode pagar pelo outro."} : {st:"ok", txt:"Sem solidariedade expressa entre vendedores."},
      sug:"A responsabilidade dos Vendedores é individual e proporcional às respectivas participações na Companhia, sem solidariedade."},
    {id:"garantia", t:"Garantias pessoais dos sócios", sev:"Alta", f:t => /(fianca|aval|fiador|garantia pessoal|devedor solidario)/.test(t) ? {st:"atencao", txt:"Exige fiança, aval ou garantia pessoal dos sócios vendedores."} : {st:"ok", txt:"Sem garantias pessoais dos sócios."},
      sug:"Excluir fiança e aval dos sócios; a única garantia de indenização é a conta vinculada."},
    {id:"diferido", t:"Pagamento a prazo garantido", sev:"Alta", f:t => /(parcela|prestac|pagamento diferido|preco diferido|segunda parcela)/.test(t) ? (/(alienacao fiduciaria|penhor|garantia real|fianca bancaria|seguro garantia|carta de credito)/.test(t) ? {st:"ok", txt:"Parcelas futuras com garantia."} : {st:"atencao", txt:"Parte do preço a prazo sem garantia ao vendedor."}) : {st:"na"},
      sug:"As parcelas a prazo serão garantidas por alienação fiduciária das ações adquiridas ou por fiança bancária de primeira linha, com vencimento antecipado em caso de inadimplemento."},
    {id:"nc", t:"Não concorrência dos vendedores", sev:"Média", f:t => { if (!/(nao concorr|nao competi|non.?compet)/.test(t)) return {st:"na"}; const m = achaNum(t, /(nao concorr|nao competi|non.?compet)[^.;]{0,200}?(\d{1,2})\s*(anos|meses)/);
      const anos = m ? (m.u === "meses" ? m.v / 12 : m.v) : null; return anos > 5 ? {st:"atencao", txt:`Não concorrência por ${m.v} ${m.u}, acima de 5 anos.`, i:m.i} : {st:"ok", txt:m ? `Não concorrência por ${m.v} ${m.u}.` : "Há não concorrência."}; },
      sug:"Os Vendedores não concorrerão com a Companhia, no território em que ela atua na data de assinatura, por 3 (três) anos após o Fechamento."},
    {id:"exclus", t:"Exclusividade de negociação (MOU/LOI)", sev:"Média", f:t => { if (!/exclusividade/.test(t)) return {st:"na"}; const m = achaNum(t, /exclusividade[^.;]{0,140}?(\d{1,3})\s*(dias)/);
      return m && m.v > 90 ? {st:"atencao", txt:`Exclusividade de ${m.v} dias, acima de 60–90 dias.`, i:m.i} : /(multa|break.?fee|reembolso de despesas)/.test(t) ? {st:"ok", txt:m ? `Exclusividade de ${m.v} dias, com compensação.` : "Exclusividade com compensação."} : {st:"atencao", txt:`Exclusividade${m ? ` de ${m.v} dias` : ""} sem compensação se o comprador desistir.`}; },
      sug:"Exclusividade de 60 (sessenta) dias, encerrada automaticamente se o Comprador não apresentar proposta vinculante no prazo; em caso de desistência sem justa causa, o Comprador reembolsa as despesas do Vendedor até R$ [●]."},
    {id:"cp", t:"Condições precedentes objetivas", sev:"Alta", f:t => /(satisfat[oó]ri|a criterio (exclusivo )?do comprador|a seu exclusivo criterio|discricionari)/.test(t) ? {st:"atencao", txt:"Condições a critério exclusivo do comprador: permite desistir sem motivo objetivo."} : {st:"ok", txt:"Sem condições discricionárias do comprador."},
      sug:"As condições precedentes são exclusivamente as listadas no Anexo [●], objetivas e verificáveis; nenhuma dependerá de juízo discricionário do Comprador."},
    {id:"rescisao", t:"Rescisão pelo comprador", sev:"Alta", f:t => /(rescindir|resilir|denunciar)[^.;]{0,120}(comprador|adquirente)[^.;]{0,120}(qualquer momento|sem justa causa|imotivad)/.test(t) || /(comprador|adquirente)[^.;]{0,80}(podera|pode)[^.;]{0,40}(rescindir|resilir|desistir)[^.;]{0,80}(qualquer momento|sem justa causa|imotivad)/.test(t) ? {st:"atencao", txt:"Comprador pode desistir a qualquer tempo sem multa."} : {st:"ok", txt:"Sem rescisão imotivada pelo comprador."},
      sug:"A desistência imotivada pelo Comprador após a assinatura sujeita-o ao pagamento de multa equivalente a [●]% do Preço ao Vendedor."},
    {id:"juros", t:"Encargos sobre indenizações", sev:"Baixa", f:t => /indeniz/.test(t) && /(juros|multa|honorario)[^.;]{0,120}indeniz|indeniz[^.;]{0,160}(juros|multa|honorario)/.test(t) ? {st:"atencao", txt:"Indenizações com juros, multa ou honorários adicionais."} : {st:"na"},
      sug:"As Perdas indenizáveis serão corrigidas apenas pelo IPCA, sem multa e sem honorários contratuais."},
    {id:"foro", t:"Lei aplicável e solução de conflitos", sev:"Baixa", f:t => /(leis? d[oa]s? (estados unidos|inglaterra|nova york|delaware)|london|new york|icc|cci)/.test(t) ? {st:"atencao", txt:"Lei ou arbitragem estrangeira: custo alto para o vendedor."} : /(arbitragem|camara|foro)/.test(t) ? {st:"ok", txt:"Foro ou arbitragem no Brasil."} : {st:"ausente", txt:"Sem cláusula de solução de conflitos."},
      sug:"Lei brasileira; arbitragem na Câmara de Comércio Brasil-Canadá (CAM-CCBC), em São Paulo, em português, com árbitro único para disputas até R$ [●]."}
  ];
  /* visão do comprador (buy-side): o que favorece o vendedor passa a ser ponto de atenção e vice-versa */
  const COMP = {cap:"Teto de indenização de 20% a 30% do preço, sem teto para fraude, tributos e passivos trabalhistas.", franquia:"Franquia baixa (até 0,5% do preço) e sem valor mínimo para as contingências específicas.",
    prazo:"Declarações gerais por 24 meses; fiscais, trabalhistas, previdenciárias e ambientais até a prescrição.", escrow:"Retenção de 10% a 20% do preço por 24 a 36 meses.", earnout:"Earn-out sobre EBITDA auditado, com liberdade de gestão do comprador e sem aceleração automática.",
    ajuste:"Ajuste de preço por capital de giro e dívida líquida apurados na data de fechamento (completion accounts).", mac:"Efeito adverso relevante amplo, permitindo desistir antes do fechamento.", sandbag:"Indenização devida independentemente do conhecimento obtido na due diligence.",
    solid:"Responsabilidade solidária dos vendedores pela indenização.", garantia:"Fiança ou aval dos sócios vendedores garantindo a indenização.", diferido:"Parcelas a prazo condicionadas ao cumprimento de metas e compensáveis com indenizações.",
    nc:"Não concorrência dos vendedores por 5 anos no território de atuação.", exclus:"Exclusividade de 90 dias, prorrogável enquanto durar a diligência.", cp:"Condições precedentes incluindo resultado satisfatório da due diligence e anuências de terceiros.",
    rescisao:"Direito de rescindir em caso de efeito adverso relevante ou de declarações falsas.", juros:"Indenizações corrigidas pelo IPCA e com juros desde a data da perda.", foro:"Lei brasileira e arbitragem em câmara reconhecida em São Paulo."};
  function analisar(texto, lado = "venda"){
    const t = nrm(texto), tipo = /share purchase|compra e venda de (acoes|quotas|participac)|\bspa\b/.test(t) ? "SPA" : /memorando de entendimento|\bmou\b|carta de intenc|\bloi\b|term sheet/.test(t) ? "MOU / LOI" : "Contrato";
    let itens = REGRAS.map(r => ({id:r.id, t:r.t, sev:r.sev, sug:r.sug, ...r.f(t)})).filter(x => x.st !== "na").map(x => ({...x, trecho:x.i >= 0 ? trecho(t, x.i) : ""}));
    if (lado === "compra") itens = itens.map(x => x.id === "foro" ? {...x, sug:COMP.foro} : {...x, st:x.st === "ok" ? "atencao" : "ok", txt:(x.st === "ok" ? "Favorece o vendedor: " : "Favorece o comprador: ") + x.txt, sug:COMP[x.id] || x.sug});
    return {tipo, lado, itens, em:nowISO(), chars:t.length};
  }
  async function textoDoArquivo(k){
    if (!k.file?.url) return ""; const buf = await (await fetch(k.file.url)).arrayBuffer(), nome = (k.file.nome || "").toLowerCase(), mime = k.file.mime || "";
    if (/pdf/.test(mime) || /\.pdf$/.test(nome)) return (await IMP.lerPDF(buf)).map(r => r.join(" ")).join("\n");
    if (/word|officedocument/.test(mime) || /\.docx$/.test(nome)){ const d = await IMP.lerDOCX(buf); return [...(d.linhas || []), ...(d.tabela || []).map(r => r.join(" "))].join("\n"); }
    return "";
  }
  const corSev = {Alta:"r-alto", "Média":"r-medio", Baixa:"r-pend"};
  const ladoK = k => supById(k.supplierId)?.lado === "compra" ? "compra" : "venda";
  function card(k){
    const a = k.analiseVend, ruins = a ? a.itens.filter(x => x.st !== "ok") : [];
    return `<div class="card" id="av-card" style="display:flex;flex-direction:column;gap:10px;border-color:rgba(242,193,78,.45)"><div class="head" style="margin:0"><div><div class="eyebrow">Análise inicial automática · pró-${(a?.lado || ladoK(k)) === "compra" ? "comprador" : "vendedor"}</div><h3>Pontos para a negociação pela Kinsey</h3>
        <p class="sub" style="margin:2px 0 0">${a ? `${esc(a.tipo)} · ${ruins.length} ponto(s) desfavorável(is) ou ausente(s) de ${a.itens.length} verificado(s) · ${dt(a.em)}` : "Lê o MOU, a LOI ou o SPA e aponta o que é desfavorável ao vendedor, com redação sugerida."}</p></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${k.file?.url ? `<button type="button" class="btn sm primary" id="av-file">Analisar arquivo</button>` : ""}<button type="button" class="btn sm" id="av-paste">Colar texto</button></div></div>
      ${a ? `<div style="display:flex;flex-direction:column;gap:8px">${a.itens.sort((x, y) => (x.st === "ok") - (y.st === "ok") || ["Alta","Média","Baixa"].indexOf(x.sev) - ["Alta","Média","Baixa"].indexOf(y.sev)).map(x => `<details ${x.st !== "ok" && x.sev === "Alta" ? "open" : ""} style="border-top:1px solid var(--line);padding-top:8px">
        <summary style="cursor:pointer"><span class="pill ${x.st === "ok" ? "r-baixo" : corSev[x.sev]}" style="font-size:10.5px">${x.st === "ok" ? "Favorável" : x.st === "ausente" ? "Ausente · " + x.sev : "Desfavorável · " + x.sev}</span> <b style="font-size:13.5px">${esc(x.t)}</b> <span class="sub" style="font-size:12.5px">· ${esc(x.txt)}</span></summary>
        ${x.trecho ? `<p class="sub" style="margin:6px 0 0;font-size:12px;font-style:italic">${esc(x.trecho)}</p>` : ""}${x.st !== "ok" ? `<p style="margin:6px 0 0;font-size:13px"><b>Redação sugerida (${a.lado === "compra" ? "comprador" : "vendedor"}):</b> ${esc(x.sug)}</p>` : ""}</details>`).join("")}</div>
      <p class="sub" style="margin:0">Análise inicial por leitura automática do texto. A validação e o parecer são do advogado responsável (OAB), abaixo.</p>` : ""}</div>`;
  }
  const _oc = openContract;
  openContract = async function(id){
    await _oc.apply(this, arguments);
    const k = S.contracts.find(x => x.id === id), body = [...document.querySelectorAll(".sheet-b")].pop(); if (!k || !body) return;
    const pinta = () => { const old = $("#av-card", body); const html = card(S.contracts.find(x => x.id === id) || k); if (old) old.outerHTML = html; else body.insertAdjacentHTML("afterbegin", html); bind(); };
    const grava = async texto => { if (!texto || texto.length < 200){ toast("Texto do contrato não encontrado ou curto demais. Cole o texto."); return; }
      const r = analisar(texto, ladoK(k)); await save(Store.update("contracts", id, {analiseVend:r})); k.analiseVend = r; pinta(); toast("Análise pró-vendedor concluída"); };
    const bind = () => {
      const f = $("#av-file", body); if (f) f.onclick = async () => { f.disabled = true; f.textContent = "Lendo…"; try{ await grava(await textoDoArquivo(k)); }catch(e){ toast("Não foi possível ler o arquivo. Cole o texto."); } f.disabled = false; f.textContent = "Analisar arquivo"; };
      const p = $("#av-paste", body); if (p) p.onclick = () => { const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Análise pró-vendedor</div><h2>Colar o texto do contrato</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
        <form class="sheet-b" id="fav" style="display:flex;flex-direction:column;gap:10px" novalidate><textarea id="av-t" rows="16" aria-label="Texto do contrato" placeholder="Cole aqui o MOU, a LOI ou o SPA"></textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Analisar</button></div></form>`);
        $("#fav").onsubmit = e => { e.preventDefault(); const t = $("#av-t").value; close(); grava(t); }; };
    };
    pinta();
  };
  window.KT_CONTRATO = {analisar, REGRAS};
})();
