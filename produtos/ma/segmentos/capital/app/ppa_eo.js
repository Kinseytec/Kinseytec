/* ================= KINSEY CAPITAL · PPA · EARN-OUT, SPA, FLUXO DE CAIXA E FISCAL =================
   Complementa o PPA (pos.js):
   - earn-out a valor justo por simulação de Monte Carlo sobre o fluxo de caixa (métrica do contrato, metas por
     exercício, atingimento mínimo e teto, pagamento proporcional ou tudo-ou-nada, volatilidade da métrica, desconto);
   - importar o SPA para o PPA: lê preço, parcela à vista, parcelas a prazo, earn-out (valor, métrica, exercícios,
     mínimo e teto) e retenção; usa também os termos da operação do Jurídico;
   - fluxo de caixa: o do valuation (FCD moderado), um fluxo importado dos especialistas ou do cliente (Excel/CSV)
     e PPA avulso, sem due diligence, para clientes que contratam só a alocação do preço;
   - fiscal: desdobramento do custo de aquisição (Lei 12.973/2014, art. 20): valor patrimonial, mais ou menos-valia
     por ativo e ágio por rentabilidade futura; prazo do laudo (protocolo na Receita Federal ou registro do sumário em
     cartório até o último dia útil do 13º mês após a aquisição) e tratamento fiscal (IN RFB 1.700/2017), além do CPC 15. */
if (window.KT_DD && window.KT_VAL && window.KT_POS) (() => {
  const D = KT_DD, V = KT_VAL, {mi, pc} = D, n = v => typeof v === "number" ? (isFinite(v) ? v : null) : num(v);
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };

  /* ---------------- fluxo de caixa ---------------- */
  /* PPA avulso: sem balancetes, com o fluxo importado e os saldos informados */
  function ctx(s){
    if (D.temBal(s)) return null; const A = s.pos?.avulso; if (!A?.fc?.anos?.length) return null;
    const Bs = V.base(), P = Bs.P, an = A.fc.anos.filter(a => a.rl > 0), t = (A.ir ?? 34) / 100; if (!an.length) return null;
    const wacc = (A.wacc ?? 15) / 100, kd = (A.kd ?? 14) / 100, g = (A.g ?? P.infBR?.v ?? 4) / 100, inf = (P.infBR?.v ?? 4) / 100;
    const rl0 = A.rl0 > 0 ? A.rl0 * 1e6 : an[0].rl / (1 + inf), mg = an[0].eb != null ? an[0].eb / an[0].rl : .15;
    let ev = A.ev > 0 ? A.ev * 1e6 : null;
    if (!ev && an.every(a => a.fcl != null) && wacc > g){ ev = an.reduce((q, a, i) => q + a.fcl / Math.pow(1 + wacc, i + .5), 0) + an[an.length - 1].fcl * (1 + g) / (wacc - g) / Math.pow(1 + wacc, an.length - .5); }
    if (!ev && an[an.length - 1].eb != null) ev = an[0].eb * 6;
    const X = {vazio:false, avulso:true, W:{wacc, kd, kdLiq:kd * (1 - t), t}, Bs, dl:(A.dl || 0) * 1e6, capex:A.capex != null ? A.capex / 100 : .03, ncgp:A.ncg ? A.ncg * 1e6 / rl0 : .1,
      bp:{K:{G:{imobilizado:(A.imob || 0) * 1e6, deprec:0, pessoal:(A.folha || 0) * 1e6, prolabore:0}, f:1, PL:(A.pl || 0) * 1e6, ncg:(A.ncg || 0) * 1e6}, rl:rl0, eb:rl0 * mg, A:{pl:0, lucro:0}}, H:{anuais:A.fc.hist || []}};
    return {X, rec:[ev, ev], avulso:true, mod:{c:{mg, g, ev, anos:an.map((a, i) => ({t:i + 1, y:a.y, rl:a.rl, eb:a.eb ?? a.rl * mg, fcl:a.fcl}))}}};
  }
  /* projeções da métrica: fluxo importado > FCD moderado do valuation > FCD prévio pelo faturamento */
  function fluxo(s){
    const F = s.pos?.fc || s.pos?.avulso?.fc; if (F?.anos?.length) return {anos:F.anos, hist:F.hist || [], fonte:`fluxo importado (${F.arquivo || "planilha"})`};
    try{ if (D.temBal(s)){ const R = V.resumo(s); if (R.mod?.c?.anos?.length) return {anos:R.mod.c.anos.map(a => ({y:a.y, rl:a.rl, eb:a.eb, fcl:a.fcl})), hist:(R.X.H?.anuais || []).map(h => ({y:h.ano, rl:h.rl, eb:h.eb})), fonte:"valuation · FCD moderado"}; } }catch(e){}
    try{ const Pv = V.prev(s); if (!Pv.vazio) return {anos:Pv.anos.map(a => ({y:a.y, rl:a.rl, eb:a.eb, fcl:a.fcl})), hist:[], fonte:"FCD prévio pelo faturamento"}; }catch(e){}
    return null;
  }
  /* planilha do fluxo de caixa: uma linha por conta (Receita, EBITDA, Fluxo de caixa livre, Capex) e uma coluna por ano */
  function lerFluxo(rows, fator){
    rows = (rows || []).map(r => [...(r || [])].map(c => String(c ?? "").trim()));
    const anoDe = c => { const m = String(c).match(/^(?:FY)?\s*((?:19|20)\d{2})\s*([AERP]|real|proj\w*)?$/i) || String(c).match(/^((?:19|20)\d{2})-\d{2}-\d{2}/); return m ? {y:+m[1], tag:(m[2] || "").toUpperCase()} : null; };
    const hi = rows.findIndex(r => r.filter(anoDe).length >= 2); if (hi < 0) throw new Error("não encontrei a linha com os anos (ex.: 2026, 2027P)");
    const H = rows[hi], cols = H.map((c, j) => ({j, a:anoDe(c)})).filter(x => x.a), lab = r => r.slice(0, cols[0].j).join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const acha = re => rows.slice(hi + 1).find(r => re.test(lab(r)) && cols.some(c => r[c.j] !== ""));
    const L = {rl:acha(/receita (liquida|operacional liquida)|^receita liquida/) || acha(/receita|faturamento|vendas/), eb:acha(/ebitda/), fcl:acha(/fluxo de caixa livre|\bfcl\b|fcff|free cash|fluxo de caixa da firma/), capex:acha(/capex|investimento/)};
    if (!L.rl) throw new Error("não encontrei a linha de receita");
    const txt = rows.slice(0, hi + 1).flat().join(" ").toLowerCase(), v = x => { const t = String(x).replace(/\s/g, ""); const y = /,\d{1,2}$/.test(t) || /\.\d{3},/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : parseFloat(t.replace(/,/g, "")); return isFinite(y) ? y : null; };
    const mx = Math.max(...cols.map(c => Math.abs(v(L.rl[c.j]) || 0)));
    const f = fator || (/milh|r\$ ?mi\b|\(mi\)|mm\b/.test(txt) ? 1e6 : /r\$ ?mil|\(mil\)|000\)|em milhares/.test(txt) ? 1e3 : mx < 1e4 ? 1e6 : mx < 1e7 ? 1e3 : 1);
    const anoAtual = new Date().getFullYear(), todos = cols.map(c => ({y:c.a.y, tag:c.a.tag, rl:v(L.rl[c.j]) * f, eb:L.eb && v(L.eb[c.j]) != null ? v(L.eb[c.j]) * f : null, fcl:L.fcl && v(L.fcl[c.j]) != null ? v(L.fcl[c.j]) * f : null, capex:L.capex && v(L.capex[c.j]) != null ? Math.abs(v(L.capex[c.j]) * f) : null})).filter(a => a.rl);
    const proj = todos.filter(a => /^[EP]|PROJ/.test(a.tag) || (!a.tag && a.y >= anoAtual)), hist = todos.filter(a => !proj.includes(a));
    return {anos:proj.length ? proj : todos, hist, fator:f, unidade:f === 1e6 ? "R$ milhões" : f === 1e3 ? "R$ mil" : "R$"};
  }

  /* ---------------- earn-out por Monte Carlo ---------------- */
  const rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const gauss = r => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
  function volHist(F, met){ const h = (F?.hist || []).map(a => met === "receita" ? a.rl : a.eb).filter(x => x > 0); if (h.length < 3) return null;
    const g = h.slice(1).map((x, i) => Math.log(x / h[i])), m = g.reduce((a, x) => a + x, 0) / g.length; return Math.sqrt(g.reduce((a, x) => a + (x - m) ** 2, 0) / (g.length - 1)); }
  /* configuração: earn-out salvo no PPA > SPA importado > termos da operação do Jurídico */
  function cfg(s){
    const E = s.pos?.eo || {}, T = s.opdoc?.termos || {}, met = /receita|faturamento/i.test(E.metrica || T.eoMet || "") ? "receita" : "EBITDA";
    const tot = E.total ?? T.eo ?? 0, nA = E.anos ?? T.eoAnos ?? (tot ? 3 : 0);
    return {ativo:tot > 0 && nA > 0, metrica:met, total:tot, anos:nA, metas:E.metas || [], valores:E.valores || [], min:E.min ?? T.eoMin ?? 50, max:E.max ?? T.eoMax ?? 130, modo:E.modo || "proporcional",
      vol:E.vol ?? null, taxa:E.taxa ?? null, lag:E.lag ?? .25, N:E.N ?? 10000, inicio:E.inicio ?? 1, fonte:E.fonte || (T.eo ? "termos da operação (Jurídico)" : "")};
  }
  function simular(s, o = {}){
    const C = cfg(s), F = fluxo(s); if (!C.ativo || !F) return null;
    const key = C.metrica === "receita" ? "rl" : "eb", anos = F.anos.slice(C.inicio - 1, C.inicio - 1 + C.anos); if (!anos.length) return null;
    /* volatilidade: informada, ou a histórica da métrica com piso (receita 10%, EBITDA 15%), ou a referência Kinsey */
    const vol = C.vol != null ? C.vol / 100 : Math.max(volHist(F, C.metrica) ?? (key === "rl" ? .15 : .25), key === "rl" ? .10 : .15);
    const taxa = C.taxa != null ? C.taxa / 100 : (o.wacc ?? (() => { try{ return D.temBal(s) ? V.resumo(s).X.W.wacc : (ctx(s)?.X.W.wacc ?? V.prev(s).W.wacc); }catch(e){ return .15; } })());
    const L = anos.map((a, i) => ({y:a.y, t:C.inicio - 1 + i + 1, proj:a[key], meta:C.metas[i] > 0 ? C.metas[i] * 1e6 : a[key], valor:C.valores[i] > 0 ? C.valores[i] * 1e6 : C.total * 1e6 / anos.length}));
    const mn = C.min / 100, mx = C.max / 100, r = rng(20231), N = Math.max(500, Math.min(50000, C.N)), pvs = new Float64Array(N);
    const ac = L.map(() => ({pago:0, meta:0, esp:0, pct:0}));
    for (let k = 0; k < N; k++){ let ch = 0, pv = 0;
      L.forEach((a, i) => { ch += vol * gauss(r) - vol * vol / 2; const nivel = a.proj * Math.exp(ch), x = nivel / a.meta;
        const f = C.modo === "binario" ? (x >= 1 ? 1 : 0) : (x < mn ? 0 : Math.min(x, mx)), pago = a.valor * f;
        if (pago > 0) ac[i].pago++; if (x >= 1) ac[i].meta++; ac[i].esp += pago; ac[i].pct += f;
        pv += pago / Math.pow(1 + taxa, a.t + C.lag); });
      pvs[k] = pv; }
    const ord = Array.from(pvs).sort((a, b) => a - b), q = p => ord[Math.min(N - 1, Math.floor(p * N))], vj = ord.reduce((a, x) => a + x, 0) / N;
    const maxNom = L.reduce((a, x) => a + x.valor * (C.modo === "binario" ? 1 : mx), 0), base = L.reduce((a, x) => a + x.valor, 0);
    const bins = 20, hmax = ord[N - 1] || 1, hist = Array(bins).fill(0); ord.forEach(x => hist[Math.min(bins - 1, Math.floor(x / hmax * bins))]++);
    return {C, F, vol, taxa, N, L:L.map((a, i) => ({...a, pPaga:ac[i].pago / N, pMeta:ac[i].meta / N, esperado:ac[i].esp / N, pctMed:ac[i].pct / N})), vj, p5:q(.05), p50:q(.5), p95:q(.95), max:maxNom, base, hist, hmax};
  }
  /* usado pelo ppa(): valor justo do earn-out e o máximo nominal */
  function justo(s, o){ const M = simular(s, o); return M ? {vj:M.vj, max:M.max, base:M.base, n:M.L.length} : null; }

  /* ---------------- SPA para o PPA ---------------- */
  const val = t => { const x = String(t).replace(/[^\d.,]/g, ""); const y = /,\d{1,2}$/.test(x) ? parseFloat(x.replace(/\./g, "").replace(",", ".")) : parseFloat(x.replace(/\./g, "")); return isFinite(y) ? y : null; };
  const milh = (m, txt) => { let v = val(m); if (v == null) return null; if (/milh|mi\b|mm\b/i.test(txt)) v *= 1e6; else if (/\bmil\b/i.test(txt)) v *= 1e3; return v; };
  function lerSPA(texto){
    const t = String(texto).replace(/\s+/g, " "), o = {achou:[]};
    const R = (re, k) => { const m = t.match(re); if (m){ o.achou.push(k); } return m; };
    let m = R(/pre[cç]o (?:total|de aquisi[cç][aã]o|das (?:quotas|a[cç][oõ]es))?[^.;]{0,60}?R\$\s*([\d.,]+)\s*(milh\w*|mil\b|mi\b)?/i, "preço"); if (m) o.preco = milh(m[1], m[2] || "");
    m = R(/R\$\s*([\d.,]+)\s*(milh\w*|mil\b|mi\b)?[^.;]{0,80}?(?:no fechamento|na data de fechamento|[àa] vista|parcela [àa] vista)/i, "à vista") || R(/(?:parcela [àa] vista|[àa] vista)[^.;]{0,60}?R\$\s*([\d.,]+)\s*(milh\w*|mil\b|mi\b)?/i, "à vista"); if (m) o.avista = milh(m[1], m[2] || "");
    m = R(/(\d{1,2})\s*(?:\([^)]{0,20}\)\s*)?parcelas\s*(anuais|mensais|semestrais|trimestrais)?/i, "parcelas"); if (m){ o.nParc = +m[1]; o.periodo = (m[2] || "anuais").toLowerCase(); }
    const se = t.match(/[^.]*(?:earn.?out|parcela vari[aá]vel|pre[cç]o contingente)[^.]*\.(?:[^.]*\.){0,2}/i);
    if (se){ const z = se[0]; o.achou.push("earn-out"); const v = z.match(/R\$\s*([\d.,]+)\s*(milh\w*|mil\b|mi\b)?/i); if (v) o.eo = milh(v[1], v[2] || "");
      o.eoMet = /ebitda/i.test(z) ? "EBITDA" : /receita|faturamento/i.test(z) ? "receita" : "EBITDA";
      const y = z.match(/exerc[ií]cios? (?:sociais )?(?:de )?((?:19|20)\d{2})\s*(?:a|até|e)\s*((?:19|20)\d{2})/i); if (y){ o.eoAnos = +y[2] - +y[1] + 1; o.eoAno0 = +y[1]; }
      else { const k = z.match(/(\d{1,2})\s*(?:\([^)]{0,20}\)\s*)?(?:exerc[ií]cios|anos)/i); if (k) o.eoAnos = +k[1]; }
      const mi0 = z.match(/a partir de\s*(\d{1,3})\s*%|m[ií]nimo de\s*(\d{1,3})\s*%/i); if (mi0) o.eoMin = +(mi0[1] || mi0[2]);
      const mx0 = z.match(/limitad[oa] a\s*(\d{1,3})\s*%|teto de\s*(\d{1,3})\s*%|m[aá]ximo de\s*(\d{1,3})\s*%/i); if (mx0) o.eoMax = +(mx0[1] || mx0[2] || mx0[3]);
      o.eoModo = /integral(mente)? (se|caso)|tudo ou nada|somente se atingid/i.test(z) ? "binario" : "proporcional";
      const metas = [...z.matchAll(/meta[^.;]{0,40}?R\$\s*([\d.,]+)\s*(milh\w*|mil\b|mi\b)?/gi)].map(x => milh(x[1], x[2] || "")); if (metas.length) o.metas = metas; }
    m = R(/(\d{1,2}(?:,\d+)?)\s*%[^.;]{0,60}(?:conta vinculada|escrow|retid)|(?:conta vinculada|escrow|retid\w*)[^.;]{0,80}?(\d{1,2}(?:,\d+)?)\s*%/i, "retenção"); if (m) o.escrow = parseFloat(String(m[1] || m[2]).replace(",", "."));
    if (o.preco && o.avista == null && !o.eo && !o.nParc) o.avista = o.preco;
    return o;
  }
  async function aplicarSPA(s, o, origem){
    const eo = o.eo || 0, preco = o.preco || 0, av = o.avista ?? (preco ? preco - eo - (o.nParc ? 0 : 0) : null), dif = preco && av != null ? Math.max(0, preco - av - eo) : 0;
    const per = /mens/.test(o.periodo || "") ? 1 / 12 : /semes/.test(o.periodo || "") ? .5 : /trim/.test(o.periodo || "") ? .25 : 1;
    const ppa = {fontePreco:`SPA (${origem})`, ...(av != null ? {preco:+(av / 1e6).toFixed(4)} : {}), ...(dif > 0 ? {diferido:+(dif / 1e6).toFixed(4), prazoDif:+(per * ((o.nParc || 1) + 1) / 2).toFixed(2)} : {}), ...(eo ? {earnout:+(eo / 1e6).toFixed(4), prazoEo:o.eoAnos || 3} : {})};
    const eoC = eo ? {total:+(eo / 1e6).toFixed(4), anos:o.eoAnos || 3, metrica:o.eoMet, ...(o.eoMin ? {min:o.eoMin} : {}), ...(o.eoMax ? {max:o.eoMax} : {}), modo:o.eoModo, ...(o.metas?.length ? {metas:o.metas.map(x => +(x / 1e6).toFixed(4))} : {}), fonte:origem} : null;
    await D.up(s, {pos:{ppa, ...(eoC ? {eo:eoC} : {}), spa:{origem, em:nowISO(), lido:o}}});
    return {ppa, eoC};
  }

  /* ---------------- fiscal · Lei 12.973/2014 ---------------- */
  function ultimoUtil13(iso){ const m = String(iso || "").match(/(\d{4})-(\d{2})/); if (!m) return null; const d = new Date(+m[1], +m[2] - 1 + 14, 0, 12); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }
  function fiscal(s, Z){
    const q = Z.q, p = Z.pct, vp = Z.plContabil * p, vidaImob = q.vidaImob || 10;
    const A = [["Ajustes da due diligence (ativos e passivos a valor justo)", Z.ajDD, "conforme a natureza de cada ajuste", null], ["Imobilizado", Z.imob, "depreciação, alienação ou baixa", vidaImob], ["Imóveis (terrenos e edificações)", Z.imovMV || 0, "edificação: depreciação; terreno: só na alienação", q.vidaImov || null], ["Estoques", Z.est, "custo das vendas (baixa)", 1],
      ["Carteira de clientes", Z.vC, "amortização", Z.vidaC], ["Marca", Z.vM, Z.vidaM ? "amortização" : "vida indefinida: só na alienação ou baixa", Z.vidaM || null], ["Tecnologia", Z.vT, "amortização", Z.vidaT], ["Não concorrência", Z.vNc, "amortização", Z.nNc],
      ["Contratos e exclusividade", Z.vK || 0, "amortização pelo prazo dos contratos", Z.nK || null], ["Passivos contingentes (menos-valia)", -Z.cont, "na realização (pagamento ou reversão)", null]]
      .map(([a, v, r, vida]) => ({a, v:v * p, real:r, vida, anual:vida ? v * p / vida : 0})).filter(x => Math.abs(x.v) > 1);
    const mv = A.reduce((a, x) => a + x.v, 0), gw = Z.preco - vp - mv, prazo = ultimoUtil13(q.data);
    const t = Z.t, benef = Math.max(0, gw) * t, anual = A.reduce((a, x) => a + x.anual, 0);
    return {vp, A, mv, gw, prazo, benef, gwAno:Math.max(0, gw) / 5, mvAno:anual, t, compraVantajosa:gw < 0};
  }
  function checks(s, Z){
    const L = [], ok = (c, t, d) => L.push({c:c ? "ok" : "alerta", t, d}), Fz = fiscal(s, Z), M = simular(s, {wacc:Z.wacc}), q = Z.q;
    ok(!!Fz.prazo, "Prazo do laudo fiscal (Lei 12.973, art. 20, § 3º)", Fz.prazo ? `Laudo de perito independente protocolado na Receita Federal ou sumário registrado em Cartório de Títulos e Documentos até ${dBR(Fz.prazo)} (último dia útil do 13º mês após a aquisição; confira feriados).` : "Informe a data de aquisição para calcular o prazo do laudo.");
    ok(true, "Desdobramento do custo de aquisição", `Valor patrimonial ${mi(Fz.vp)} + mais ou menos-valia ${mi(Fz.mv)} + ágio por rentabilidade futura ${mi(Fz.gw)} = custo ${mi(Z.preco)} (Lei 12.973, art. 20).`);
    ok(q.partesDependentes !== true, "Ágio dedutível só entre partes independentes", "Lei 12.973, art. 25: o ágio não é excluído do lucro real se a aquisição for entre partes dependentes; a exclusão de 1/60 ao mês depende da incorporação, fusão ou cisão (art. 22).");
    if (Fz.compraVantajosa) ok(false, "Compra vantajosa", "Ganho por compra vantajosa: reconhecer só após revisar a identificação e a mensuração (CPC 15, § 36); fiscalmente, diferido e computado à razão mínima de 1/60 ao mês após a incorporação (Lei 12.973, art. 23).");
    const C = cfg(s); if (C.ativo) ok(!!M, "Earn-out a valor justo (CPC 15, § 39 e § 58)", M ? `Monte Carlo com ${M.N.toLocaleString("pt-BR")} cenários: ${mi(M.vj)} de até ${mi(M.max)} (P5 ${mi(M.p5)} · P95 ${mi(M.p95)}); volatilidade ${pc(M.vol, 0)} e desconto ${pc(M.taxa, 1)}. Variações posteriores vão para o resultado, sem alterar o ágio.` : "Earn-out configurado, mas sem fluxo de caixa para simular: importe o fluxo ou faça o valuation.");
    return L;
  }

  /* ---------------- planilha do PPA: abas adicionais ---------------- */
  function abas(s, Z){
    const H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), P = v => ({v, s:"p"}), B = v => ({v, s:"b"}), nome = s.mandato?.codinome || s.nome, Fz = fiscal(s, Z), M = simular(s, {wacc:Z.wacc}), F = fluxo(s);
    const cab = (t, sub) => [[T(`${t} · ${nome}`)], [sub || `Valores em R$ · data de aquisição ${Z.q.data || "a definir"}`], []];
    const out = [{nome:"Fiscal Lei 12.973", larguras:[52, 18, 40, 12, 18], linhas:[...cab("Desdobramento do custo de aquisição (Lei 12.973/2014, art. 20)", `Participação ${pc(Z.pct, 0)} · alíquota ${pc(Z.t, 0)} · laudo até ${Fz.prazo ? dBR(Fz.prazo) : "informar a data de aquisição"}`),
      [H("Componente"), H("R$"), H("Realização fiscal"), H("Vida (anos)"), H("Realização anual")], ["Custo de aquisição (consideração transferida)", Z.preco, "", "", ""], ["(−) Valor patrimonial (PL contábil × participação)", -Fz.vp, "", "", ""],
      ...Fz.A.map(x => [`(${x.v >= 0 ? "−" : "+"}) ${x.v >= 0 ? "Mais-valia" : "Menos-valia"} · ${x.a}`, -x.v, x.real, x.vida || "", x.anual || ""]), [B("Ágio por rentabilidade futura (goodwill fiscal)"), B(Fz.gw), "exclusão de até 1/60 ao mês após incorporação, fusão ou cisão (art. 22)", 5, Math.max(0, Fz.gwAno)], [],
      ["Benefício fiscal potencial do ágio (alíquota × ágio)", Fz.benef], ["Realização anual das mais-valias (média dos primeiros anos)", Fz.mvAno], [],
      [B("Requisitos")], ["Laudo elaborado por perito independente, com o valor justo dos ativos e passivos (art. 20, § 3º)"], ["Laudo protocolado na Receita Federal ou sumário registrado em Cartório de Registro de Títulos e Documentos até o último dia útil do 13º mês após a aquisição"],
      ["Mais ou menos-valia e ágio registrados em subcontas vinculadas à participação (IN RFB 1.700/2017)"], ["Aquisição entre partes não dependentes para excluir o ágio (art. 25); a exclusão ocorre após incorporação, fusão ou cisão (art. 22)"], ["Compra vantajosa: ganho diferido e computado à razão mínima de 1/60 ao mês após a incorporação (art. 23)"]]}];
    if (M) out.push({nome:"Earn-out Monte Carlo", larguras:[14, 18, 18, 18, 14, 14, 18], linhas:[...cab("Earn-out a valor justo · simulação de Monte Carlo", `${M.N.toLocaleString("pt-BR")} cenários · métrica ${M.C.metrica} · volatilidade ${pc(M.vol, 1)} · desconto ${pc(M.taxa, 1)} · mínimo ${M.C.min}% · teto ${M.C.max}% · ${M.C.modo === "binario" ? "tudo ou nada" : "proporcional ao atingimento"} · fluxo: ${M.F.fonte}`),
      [H("Exercício"), H("Projeção"), H("Meta"), H("Parcela máxima"), H("P(meta)"), H("P(pagar)"), H("Pagamento esperado")], ...M.L.map(a => [a.y, a.proj, a.meta, a.valor, P(a.pMeta), P(a.pPaga), a.esperado]), [],
      [B("Valor justo (média dos valores presentes)"), "", "", B(M.vj)], ["Percentil 5%", "", "", M.p5], ["Mediana", "", "", M.p50], ["Percentil 95%", "", "", M.p95], ["Máximo nominal", "", "", M.max], [],
      ["Método: a métrica de cada exercício segue a projeção do fluxo de caixa com choque lognormal acumulado (volatilidade anual); o pagamento é proporcional ao atingimento da meta a partir do mínimo e limitado ao teto, descontado à taxa indicada com defasagem de pagamento de " + String(M.C.lag).replace(".", ",") + " ano."]]});
    if (F) out.push({nome:"Fluxo de caixa", larguras:[12, 18, 18, 18], linhas:[...cab("Fluxo de caixa usado no PPA e no earn-out", F.fonte), [H("Ano"), H("Receita"), H("EBITDA"), H("Fluxo de caixa livre")], ...(F.hist || []).map(a => [`${a.y} (real)`, a.rl, a.eb ?? "", ""]), ...F.anos.map(a => [a.y, a.rl, a.eb ?? "", a.fcl ?? ""])]});
    if (Z.vK > 0) out.push({nome:"Contratos e exclusividade", larguras:[8, 18, 18, 18], linhas:[...cab("Contratos e exclusividade · excesso de resultado pelo prazo contratado", `Receita contratada ${mi(Z.recK)} ao ano · ${Z.nK} anos · margem ${pc(Z.mgK, 1)} · TAB ${fmt(Z.tabK, 3)}`), [H("Ano"), H("Receita"), H("Resultado após IR"), H("VP")], ...Z.anosK.map(a => [a.y, a.r, a.fl, a.pv]), [], ["", "", B("Valor justo"), B(Z.vK)]]});
    return out;
  }

  /* ---------------- tela ---------------- */
  const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
  function cardEO(s, Z){
    const C = cfg(s), M = simular(s, {wacc:Z?.wacc}), F = fluxo(s), ed = D.ed() ? "" : "disabled", E = s.pos?.eo || {}, spas = window.KT_OPDOC ? KT_OPDOC.docs(s).filter(x => x.tipo === "SPA") : [];
    const f = (id, l, v, ph) => `<div class="fld"><label for="eo-${id}">${l}</label><input id="eo-${id}" inputmode="decimal" value="${v != null && v !== "" ? esc(String(v).replace(".", ",")) : ""}" placeholder="${esc(ph ?? "")}" ${ed}></div>`;
    return `<div class="card" id="eo-card" style="display:flex;flex-direction:column;gap:10px;border-color:rgba(195,155,255,.45)"><div class="head" style="margin:0"><div><div class="eyebrow">CPC 15 · consideração contingente</div><h3 style="margin:0">Earn-out a valor justo · Monte Carlo</h3>
        <p class="sub" style="margin:2px 0 0">Fluxo de caixa: ${F ? esc(F.fonte) : "nenhum (importe o fluxo ou faça o valuation)"}${C.fonte ? ` · condições: ${esc(C.fonte)}` : ""}</p></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn sm primary">Importar SPA para o PPA<input type="file" id="eo-spa" accept=".docx,.pdf,.txt" hidden ${ed}></label>${spas.length ? `<select id="eo-spa-j" class="btn sm" ${ed}><option value="">Usar SPA do Jurídico…</option>${spas.map(x => `<option value="${x.id}">SPA v${x.versao} · ${esc(x.obs || "")}</option>`).join("")}</select>` : ""}
        <label class="btn sm">Importar fluxo de caixa (Excel ou CSV)<input type="file" id="eo-fc" accept=".xlsx,.csv,.txt" hidden ${ed}></label>${s.pos?.fc ? `<button type="button" class="btn sm ghost" id="eo-fc-x" ${ed}>Voltar ao fluxo do valuation</button>` : ""}</div>
      ${s.pos?.spa ? `<p class="sub" style="margin:0;font-size:12.5px">SPA lido (${esc(s.pos.spa.origem)}, ${dBR(s.pos.spa.em)}): ${esc((s.pos.spa.lido?.achou || []).join(", ") || "sem termos reconhecidos")}. Confira os campos abaixo e as premissas do PPA.</p>` : ""}
      ${M ? `<div class="dd-kpis">${k("Valor justo do earn-out", mi(M.vj), `${pc(M.vj / M.max, 0)} do máximo de ${mi(M.max)}`)}${k("Faixa (P5 a P95)", `${mi(M.p5)} a ${mi(M.p95)}`, `mediana ${mi(M.p50)}`)}${k("Volatilidade", pc(M.vol, 0), C.vol != null ? "informada" : volHist(F, C.metrica) != null && volHist(F, C.metrica) >= M.vol - 1e-9 ? "histórico da métrica" : volHist(F, C.metrica) != null ? "piso Kinsey (histórico menor)" : "referência Kinsey")}${k("Desconto", pc(M.taxa, 1), C.taxa != null ? "informado" : "WACC")}</div>
        <div class="tbl"><table><thead><tr><th>Exercício</th><th class="dd-num">Projeção</th><th class="dd-num">Meta</th><th class="dd-num">Parcela</th><th class="dd-num">P(meta)</th><th class="dd-num">P(pagar)</th><th class="dd-num">Esperado</th></tr></thead><tbody>${M.L.map(a => `<tr><td>${a.y}</td><td class="dd-num">${mi(a.proj)}</td><td class="dd-num">${mi(a.meta)}</td><td class="dd-num">${mi(a.valor)}</td><td class="dd-num">${pc(a.pMeta, 0)}</td><td class="dd-num">${pc(a.pPaga, 0)}</td><td class="dd-num">${mi(a.esperado)}</td></tr>`).join("")}</tbody></table></div>
        <div style="display:flex;align-items:flex-end;gap:2px;height:60px" aria-label="Distribuição do valor presente do earn-out">${M.hist.map(h => `<div style="flex:1;background:#C39BFF;opacity:.75;height:${Math.max(2, h / Math.max(...M.hist) * 60)}px"></div>`).join("")}</div>
        <p class="sub" style="margin:0;font-size:12px">Distribuição de ${M.N.toLocaleString("pt-BR")} cenários (0 a ${mi(M.hmax)}). O valor justo substitui "Probabilidade do earn-out" no PPA.</p>` : `<p class="sub" style="margin:0">${C.ativo ? "Sem fluxo de caixa para simular." : "Sem earn-out: importe o SPA ou informe abaixo."}</p>`}
      <form id="eo-f" style="display:flex;flex-direction:column;gap:8px" novalidate><div class="form">
        ${f("tot", "Earn-out máximo (R$ mi)", E.total ?? (C.total || ""))}${f("an", "Nº de exercícios", E.anos ?? (C.anos || ""))}<div class="fld"><label for="eo-met">Métrica</label><select id="eo-met" ${ed}><option value="EBITDA" ${C.metrica === "EBITDA" ? "selected" : ""}>EBITDA</option><option value="receita" ${C.metrica === "receita" ? "selected" : ""}>Receita</option></select></div>
        <div class="fld"><label for="eo-modo">Pagamento</label><select id="eo-modo" ${ed}><option value="proporcional" ${C.modo !== "binario" ? "selected" : ""}>Proporcional ao atingimento</option><option value="binario" ${C.modo === "binario" ? "selected" : ""}>Tudo ou nada (meta atingida)</option></select></div>
        ${f("min", "Atingimento mínimo (%)", E.min, C.min)}${f("max", "Teto (% da parcela)", E.max, C.max)}${f("ini", "1º exercício (1 = primeiro ano projetado)", E.inicio, 1)}
        <div class="fld full"><label for="eo-metas">Metas por exercício (R$ mi, separadas por ;) · vazio = projeção</label><input id="eo-metas" value="${esc((E.metas || []).join("; ").replace(/\./g, ","))}" ${ed}></div>
        <div class="fld full"><label for="eo-vals">Parcela máxima por exercício (R$ mi, separadas por ;) · vazio = igual</label><input id="eo-vals" value="${esc((E.valores || []).join("; ").replace(/\./g, ","))}" ${ed}></div>
        ${f("vol", "Volatilidade anual da métrica (%)", E.vol, M ? (M.vol * 100).toFixed(0) : "")}${f("tx", "Taxa de desconto (%)", E.taxa, M ? (M.taxa * 100).toFixed(1) : "WACC")}${f("lag", "Defasagem do pagamento (anos)", E.lag, .25)}${f("n", "Simulações", E.N, 10000)}</div>
        ${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar e simular</button>` : ""}<p class="err" id="eo-err" hidden></p></form></div>`;
  }
  function cardFiscal(s, Z){
    const Fz = fiscal(s, Z);
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><div class="eyebrow">Fiscal · Lei 12.973/2014 e IN RFB 1.700/2017</div><h3 style="margin:0">Desdobramento do custo de aquisição</h3></div></div>
      <div class="dd-kpis">${k("Valor patrimonial", mi(Fz.vp), "PL contábil × participação")}${k("Mais ou menos-valia", mi(Fz.mv), `${Fz.A.length} ativo(s) e passivo(s)`)}${k(Fz.compraVantajosa ? "Compra vantajosa" : "Ágio por rentabilidade futura", mi(Fz.gw), Fz.compraVantajosa ? "art. 23" : `benefício potencial ${mi(Fz.benef)}`)}${k("Prazo do laudo", Fz.prazo ? dBR(Fz.prazo) : "—", "protocolo RFB ou cartório (13º mês)")}</div>
      <div class="tbl"><table><thead><tr><th>Mais ou menos-valia</th><th class="dd-num">R$</th><th>Realização fiscal</th></tr></thead><tbody>${Fz.A.map(x => `<tr><td>${esc(x.a)}</td><td class="dd-num">${mi(x.v)}</td><td class="sub" style="font-size:12px">${esc(x.real)}${x.vida ? ` · ${x.vida} anos` : ""}</td></tr>`).join("")}</tbody></table></div>
      <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="fz-dep" ${Z.q.partesDependentes ? "checked" : ""} ${D.ed() ? "" : "disabled"}> Comprador e vendedores são partes dependentes (ágio não dedutível, art. 25)</label>
      <p class="sub" style="margin:0;font-size:12px">A contabilização segue o CPC 15 (valor justo, IR diferido sobre as mais-valias); o desdobramento fiscal usa o custo, o PL contábil e as mais ou menos-valias do laudo, sem o IR diferido.</p></div>`;
  }
  function cardAvulso(s){
    const A = s.pos?.avulso || {}, ed = D.ed() ? "" : "disabled", f = (id, l, v, ph) => `<div class="fld"><label for="av-${id}">${l}</label><input id="av-${id}" inputmode="decimal" value="${v != null ? esc(String(v).replace(".", ",")) : ""}" placeholder="${esc(ph ?? "")}" ${ed}></div>`;
    return `<div class="card" id="av-ppa" style="display:flex;flex-direction:column;gap:10px;border-color:rgba(56,182,255,.45)"><div class="head" style="margin:0"><div><div class="eyebrow">Trabalho avulso</div><h3 style="margin:0">PPA sem due diligence · pelo fluxo de caixa</h3>
        <p class="sub" style="margin:2px 0 0">Para clientes que contratam só o PPA: importe o fluxo de caixa (Excel ou CSV com uma linha por conta e uma coluna por ano: Receita, EBITDA, Fluxo de caixa livre) e informe os saldos da data de aquisição.</p></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn sm primary">Importar fluxo de caixa<input type="file" id="av-fc" accept=".xlsx,.csv,.txt" hidden ${ed}></label></div>
      ${A.fc ? `<p class="sub" style="margin:0;font-size:12.5px">Fluxo importado: ${esc(A.fc.arquivo || "")} · ${A.fc.anos.length} ano(s) projetados (${A.fc.anos.map(a => a.y).join(", ")}) · ${esc(A.fc.unidade || "")}</p>` : ""}
      <form id="av-f" style="display:flex;flex-direction:column;gap:8px" novalidate><div class="form">${f("pl", "PL contábil na aquisição (R$ mi)", A.pl)}${f("dl", "Dívida líquida (R$ mi)", A.dl)}${f("im", "Imobilizado contábil (R$ mi)", A.imob)}${f("ncg", "Capital de giro (R$ mi)", A.ncg)}${f("fo", "Folha anual (R$ mi)", A.folha)}
        ${f("w", "WACC (%)", A.wacc, 15)}${f("kd", "Custo da dívida Kd (%)", A.kd, 14)}${f("g", "Crescimento na perpetuidade (%)", A.g, 4)}${f("ev", "Valor da empresa (R$ mi, opcional)", A.ev, "pelo fluxo")}${f("ir", "Alíquota IR/CS (%)", A.ir, 34)}</div>
        ${D.ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar e calcular o PPA</button>` : ""}<p class="err" id="av-err" hidden></p></form></div>`;
  }
  async function lerPlanilha(fl){ const buf = await fl.arrayBuffer(); return /\.xlsx$/i.test(fl.name) ? await IMP.lerXLSX(buf) : new TextDecoder().decode(buf).split(/\r?\n/).map(l => l.split(/[;\t]/)); }
  function bind(host, s){
    const sp = $("#eo-spa", host); if (sp) sp.onchange = async () => { const fl = sp.files[0]; if (!fl) return; try{ if (!window.KT_OPDOC) throw new Error("leitor"); const P = await KT_OPDOC.lerArquivo(fl), o = lerSPA(P.join("\n")), r = await aplicarSPA(s, o, fl.name);
      toast(`SPA lido: ${o.achou.join(", ") || "nenhum termo reconhecido"}${r.eoC ? " · earn-out configurado" : ""}`); }catch(e){ console.error(e); toast("Não foi possível ler o SPA (use Word, PDF com texto ou TXT)."); } };
    const sj = $("#eo-spa-j", host); if (sj) sj.onchange = async () => { const c = S.contracts.find(x => x.id === sj.value); if (!c) return; const o = lerSPA((c.paragrafos || []).join("\n")); await aplicarSPA(s, o, `SPA v${c.versao} do Jurídico`); toast(`SPA v${c.versao} aplicado ao PPA: ${o.achou.join(", ")}`); };
    const fc = $("#eo-fc", host); if (fc) fc.onchange = async () => { const fl = fc.files[0]; if (!fl) return; try{ const F = lerFluxo(await lerPlanilha(fl)); await D.up(s, {pos:{fc:{...F, arquivo:fl.name, em:nowISO()}}}); toast(`Fluxo de caixa importado: ${F.anos.length} ano(s) · ${F.unidade}`); }catch(e){ toast("Fluxo de caixa: " + (e.message || "não foi possível ler")); } };
    const fx = $("#eo-fc-x", host); if (fx) fx.onclick = () => D.up(s, {pos:{fc:null}}).then(() => toast("Usando o fluxo do valuation"));
    const ef = $("#eo-f", host); if (ef) ef.onsubmit = async e => { e.preventDefault(); const v = id => $("#eo-" + id, host).value.trim(), nn = id => v(id) === "" ? null : n(v(id)), lista = id => v(id) ? v(id).split(/;/).map(x => n(x.trim())).filter(x => x > 0) : [];
      const tot = nn("tot"), an = nn("an"); if (tot > 0 && !(an > 0)){ const er = $("#eo-err", host); er.textContent = "Informe o número de exercícios do earn-out."; er.hidden = false; return; }
      await D.up(s, {pos:{eo:{total:tot ?? 0, anos:an ?? 0, metrica:v("met"), modo:v("modo"), min:nn("min"), max:nn("max"), inicio:nn("ini"), metas:lista("metas"), valores:lista("vals"), vol:nn("vol"), taxa:nn("tx"), lag:nn("lag"), N:nn("n"), fonte:s.pos?.eo?.fonte || "informado no PPA"}, ppa:{earnout:tot ?? 0, prazoEo:an ?? 0}}}); toast("Earn-out salvo e simulado"); };
    const dep = $("#fz-dep", host); if (dep) dep.onchange = () => D.up(s, {pos:{ppa:{partesDependentes:dep.checked}}});
    const af = $("#av-fc", host); if (af) af.onchange = async () => { const fl = af.files[0]; if (!fl) return; try{ const F = lerFluxo(await lerPlanilha(fl)); await D.up(s, {pos:{avulso:{fc:{...F, arquivo:fl.name, em:nowISO()}}}}); toast(`Fluxo de caixa importado: ${F.anos.length} ano(s) · ${F.unidade}`); }catch(e){ const er = $("#av-err", host); er.textContent = "Fluxo de caixa: " + (e.message || "não foi possível ler"); er.hidden = false; } };
    const avf = $("#av-f", host); if (avf) avf.onsubmit = async e => { e.preventDefault(); const v = id => $("#av-" + id, host).value.trim(), nn = id => v(id) === "" ? null : n(v(id));
      if (!s.pos?.avulso?.fc){ const er = $("#av-err", host); er.textContent = "Importe primeiro o fluxo de caixa."; er.hidden = false; return; }
      await D.up(s, {pos:{avulso:{pl:nn("pl"), dl:nn("dl"), imob:nn("im"), ncg:nn("ncg"), folha:nn("fo"), wacc:nn("w"), kd:nn("kd"), g:nn("g"), ev:nn("ev"), ir:nn("ir")}}}); toast("PPA avulso calculado"); };
  }
  /* premissas vindas dos termos da operação (Jurídico) quando o PPA ainda não tem as suas */
  function padroes(s){ const T = s.opdoc?.termos; if (!T || !(T.preco > 0)) return {};
    const av = Math.max(0, T.preco - (T.dif || 0) - (T.eo || 0)); return {preco:av, _fp:"termos da operação (Jurídico)", ...(T.dif > 0 ? {diferido:T.dif, prazoDif:(T.mDif || 12) / 12 + Math.max(0, (T.nDif || 1) - 1) / 2} : {}), ...(T.eo > 0 ? {earnout:T.eo, prazoEo:T.eoAnos || 3} : {}), ...(T.pct ? {pct:T.pct} : {})}; }

  window.KT_EO = {ctx, fluxo, lerFluxo, simular, justo, cfg, lerSPA, aplicarSPA, fiscal, checks, abas, cardEO, cardFiscal, cardAvulso, bind, padroes, ultimoUtil13};
})();
