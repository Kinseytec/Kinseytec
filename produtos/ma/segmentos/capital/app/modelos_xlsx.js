/* ================= PLANILHAS PADRONIZADAS KINSEY BR (VALUATION E PPA) =================
   Base limpa, com fórmulas vivas, montada a partir dos modelos de trabalho da Kinsey (PPA e avaliação Sulfibra;
   avaliação do earn-out com Monte Carlo): premissas, WACC (CAPM), DRE projetada, capital de giro em dias, FCD com
   IR (lucro real ou presumido), meio-período e perpetuidade de Gordon, sensibilidade WACC × g, múltiplos e conferências.
   PPA (CPC 15 / IFRS 3): CAC (encargos dos ativos contributivos), carteira de clientes (MPEEM com churn), marca e
   tecnologia (relief-from-royalty), força de trabalho (custo de reposição), não concorrência (com e sem), contingências,
   earn-out (cenários ponderados e Monte Carlo), WARA e alocação do preço com goodwill.
   Já sai preenchida com o cadastro e os números do sistema; as células em azul são entradas, as demais são fórmulas.
   A planilha revisada pelo consultor pode ser importada de volta: o sistema lê os resultados e mostra a conferência
   sistema × consultor. */
if (window.KT_DD && window.KT_XLSX) (() => {
  const D = KT_DD, {mi, pc, div} = D;
  const colL = i => { let s = ""; i++; while (i){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const Q = n => `'${n}'`;
  /* folha com linhas nomeadas */
  function Folha(nome, larguras){ const f = {nome, linhas:[], idx:{}, larguras:larguras || [46, 16, 15, 15, 15, 15, 15, 15, 15], congela:[3, 1]};
    f.add = (cells, key) => { f.linhas.push(cells); const r = f.linhas.length; if (key) f.idx[key] = r; return r; };
    f.r = k => { if (!f.idx[k]) throw new Error(`linha ${k} inexistente em ${nome}`); return f.idx[k]; };
    f.ref = (k, c, abs) => `${abs ? "$" : ""}${typeof c === "number" ? colL(c) : c}${abs ? "$" : ""}${f.r(k)}`;
    f.x = (k, c, abs) => `${Q(nome)}!${f.ref(k, c, abs)}`;
    return f; }
  const T = v => ({v, s:"t"}), H = v => ({v, s:"h"}), HH = v => ({v, s:"hh"}), HP = v => ({v, s:"hp"});
  const I = v => ({v:v == null || !isFinite(v) ? 0 : Math.round(v * 100) / 100, s:"i"}), IP = v => ({v:v == null || !isFinite(v) ? 0 : +(+v).toFixed(6), s:"ip"}), ID = v => ({v:+(+v || 0).toFixed(6), s:"id"}), IT = v => ({v:String(v ?? ""), s:"it"});
  /* unidade: a modelagem do valuation sai em R$ milhões (padrão do sistema); o PPA continua em R$ */
  let MI = false; const U = v => MI ? v / 1e6 : v, UN = () => MI ? "R$ mi" : "R$";
  const M = v => ({v:v == null || !isFinite(v) ? 0 : MI ? Math.round(v / 100) / 1e4 : Math.round(v * 100) / 100, s:MI ? "im" : "i"}); /* entrada monetária */
  const F = (f, s) => ({f, s:s || (MI ? "m" : "n")}), FP = f => ({f, s:"fp"}), FX = f => ({f, s:"x"}), FD = f => ({f, s:"d"}), G = f => ({f, s:MI ? "mg" : "g"}), GP = f => ({f, s:"gp"});
  const N = 5, YC = i => colL(2 + i); /* anos projetados nas colunas C..G; perpetuidade em H */
  const cab = (f, titulo, s) => { f.add([T(`${titulo} · ${s.mandato?.codinome || s.nome}`)]); f.add([`Planilha padronizada Kinsey BR · células em azul são entradas; as demais são fórmulas · valores em ${MI ? "R$ milhões (R$ mi), exceto percentuais, múltiplos e dias" : "R$"}`]); };

  /* ---------------- dados do sistema ---------------- */
  function dados(s){
    const R = KT_VAL.resumo(s), X = R.X; if (!X || X.vazio) throw new Error("Sem balancetes para montar a planilha.");
    const Bs = X.Bs, P = Bs.P, W = X.W, K = X.bp.K, G0 = K.G || {}, f = K.f || 1, vl = X.vl || {}, y0 = X.y0 || new Date().getFullYear() - 1;
    const anos = Array.from({length:N}, (_, i) => y0 + i + 1), ipca = anos.map(y => (Bs.focus.ipca?.[y] ?? Bs.ipca[y] ?? P.infBR.v) / 100);
    const sel = Object.values(Bs.focus.selic || {}), selic = sel.length ? sel.reduce((a, b) => a + b, 0) / sel.length : P.selic.v;
    const linhas = Object.keys(X.bp.lin || {}), cresc = X.nomes ? X.nomes.map(l => X.histL[l]?.real).filter(x => x != null) : [], gMod = cresc.length ? Math.max(-.1, Math.min(.15, cresc.reduce((a, b) => a + b, 0) / cresc.length)) : 0;
    const prem = vl.prem || {}, ot = Object.values(prem).map(p => p?.real).filter(x => x != null), gOt = ot.length ? ot.reduce((a, b) => a + b, 0) / ot.length / 100 : gMod + .015;
    const rb = K.recBruta || 0, rl = K.recLiq || 0, cpv = K.cpv || 0, desp = K.despOp || 0;
    const C = KT_VAL.refC ? KT_VAL.refC(R.C) : R.C;
    const ncgAj = (X.ncgp ?? div(K.ncg, rl) ?? 0) - (div(K.ncg, rl) || 0), mgN = R.mod?.c?.mg ?? div(X.bp.eb, rl) ?? 0, ebAj = (X.bp.eb || 0) - (X.bp.ebRep || 0);
    return {ncgAj, mgN, ebAj, R, X, Bs, P, W, K, G:G0, f, vl, y0, anos, ipca, selic, gMod, gOt, rb, rl, cpv, desp, C, regime:/presumido/i.test(s.perfil?.regime || "") ? "Lucro presumido" : "Lucro real",
      ded:div(K.deducoes, rb) || 0, custo:div(cpv, rl) || 0, despP:Math.max(0, 1 - (div(cpv, rl) || 0) - mgN), da:div(K.da, rl) || X.capex || .02, capex:X.capex || .02,
      dias:{cli:div(G0.clientes, rl) * 360 || 0, est:div(G0.estoques, cpv) * 360 || 0, imp:div(G0.impRec, rl) * 360 || 0, forn:div(G0.fornecedores, cpv) * 360 || 0, trab:div(G0.trab, cpv + desp) * 360 || 0, trib:div(G0.tribCP, rl) * 360 || 0, outA:div((G0.outrosAC || 0) + (G0.pdd || 0), rl) * 360 || 0, outP:div((G0.adiantCli || 0) + (G0.outrosPC || 0), cpv + desp) * 360 || 0}};
  }

  /* ---------------- folhas comuns ---------------- */
  function fPremissas(s, d){
    const f = Folha("Premissas"); cab(f, "Premissas", s); f.add([]);
    const rf = s.receita || {}, pj = s.projeto || {};
    f.add([H("Cadastro"), H("")]);
    [["Cliente (contratante)", pj.cliente || s.mandato?.cliente || ""], ["Empresa avaliada", rf.razao || s.nome], ["Nome-código", s.mandato?.codinome || ""], ["CNPJ", s.doc || ""], ["Atividade (CNAE)", `${rf.cnae || ""} ${rf.cnaeDesc || ""}`.trim()],
      ...(window.KT_CNPJ?.ficha ? KT_CNPJ.ficha(s).filter(([k]) => ["Endereço", "Natureza jurídica", "Sócios", "Administração", "Capital social", "Fonte do cadastro"].includes(k)) : []),
      ["Segmento", s.perfil?.segmento || s.segmento || ""], ["Data-base", s.perfil?.dataBase || d.X.bp.b?.dataBase || ""], ["Moeda", "Reais correntes"], ["Sócio responsável", pj.socio || ""], ["Emitido pelo sistema em", new Date().toLocaleDateString("pt-BR")]].forEach(([k, v]) => f.add([k, IT(v)]));
    f.add(["Regime tributário", IT(d.regime)], "regime"); f.add(["Cenário de crescimento usado", IT("Moderado")], "cen");
    f.add([]); f.add([H("Premissas macroeconômicas"), H("Base"), ...d.anos.map(y => HP(`${y}E`))], "hmac");
    f.add(["Inflação (IPCA)", "", ...d.ipca.map(IP)], "ipca");
    f.add(["Selic média de longo prazo", "", ...d.anos.map(() => IP(d.selic / 100))], "selic");
    f.add(["CDI (correção de parcelas)", "", ...d.anos.map(() => IP(d.selic / 100 - .001))], "cdi");
    f.add([]); f.add([H("Crescimento real da receita"), H(""), ...d.anos.map(y => HP(`${y}E`))]);
    f.add(["Moderado (histórico)", "", ...d.anos.map(() => IP(d.gMod))], "gmod");
    f.add(["Otimista (premissas justificadas)", "", ...d.anos.map(() => IP(d.gOt))], "got");
    f.add(["Crescimento real usado", "", ...d.anos.map((_, i) => FP(`IF(${f.ref("cen", "B", 1)}="Otimista",${YC(i)}${f.r("got")},${YC(i)}${f.r("gmod")})`))], "g");
    f.add(["Crescimento real na perpetuidade", IP((window.KT_VAL?.gPerp ? KT_VAL.gPerp(s.perfil?.segmento || s.segmento, KT_VAL.base(), s.dd?.vl || {}).v : d.P.gReal.v) / 100)], "greal");
    f.add(["Crescimento nominal na perpetuidade", FP(`(1+B${f.r("greal")})*(1+${YC(N - 1)}${f.r("ipca")})-1`)], "gnom");
    f.add([]); f.add([H("Premissas operacionais (% e dias)"), H("Valor")]);
    f.add(["Deduções (% da receita bruta)", IP(d.ded)], "ded"); f.add(["Custos (% da receita líquida)", IP(d.custo)], "custo"); f.add(["Despesas operacionais normalizadas (% da receita líquida, com os ajustes de DD)", IP(d.despP)], "desp");
    f.add(["Margem EBITDA normalizada (fórmula)", FP(`1-B${f.r("custo")}-B${f.r("desp")}`)], "mgN");
    f.add(["Depreciação e amortização (% da receita líquida)", IP(d.da)], "da"); f.add(["Investimentos / capex (% da receita líquida)", IP(d.capex)], "capex");
    [["cli", "Prazo de recebimento (dias da receita líquida)"], ["est", "Estoques (dias de custos)"], ["imp", "Impostos a recuperar (dias da receita líquida)"], ["outA", "Outros ativos operacionais (dias da receita líquida)"],
      ["forn", "Fornecedores (dias de custos)"], ["trab", "Obrigações trabalhistas (dias de custos e despesas)"], ["trib", "Obrigações tributárias (dias da receita líquida)"], ["outP", "Outros passivos operacionais (dias de custos e despesas)"]].forEach(([k, l]) => f.add([l, I(d.dias[k])], "d_" + k));
    f.add(["Normalização do capital de giro (% da receita líquida; ajustes de DD e premissa do consultor)", IP(d.ncgAj)], "ncgAj");
    f.add([]); f.add([H("Tributação"), H("Valor")]);
    f.add(["Alíquota IRPJ + CSLL (lucro real)", IP(.34)], "aliq"); f.add(["Presunção IRPJ (lucro presumido)", IP(.32)], "presIR"); f.add(["Presunção CSLL (lucro presumido)", IP(.32)], "presCS");
    f.add([]); f.add([H("Ponte para o equity"), H(UN())]);
    f.add(["Dívida líquida ajustada (positivo = dívida)", M(d.X.dl)], "dl"); f.add(["Caixa excedente e outros ativos não operacionais", M(0)], "outros");
    f.add(["Desconto de liquidez nos múltiplos (empresa fechada)", IP(d.P.desc.v / 100)], "descL");
    f.add([]); f.add([H("Ajuste do consultor no WACC"), H("p.p.")]);
    f.add(["Ajuste (limite de 3 p.p. para cima ou para baixo)", IP(d.W.ajustado ? d.W.wacc - d.W.waccAuto : 0)], "ajw"); f.add(["Justificativa do ajuste", IT(d.W.just?.texto || "")], "ajwj");
    f.congela = [3, 1]; return f;
  }
  function fWacc(s, d, Pm){
    const f = Folha("WACC", [52, 16, 60]), P = d.P, W = d.W; cab(f, "Taxa de desconto (WACC pelo CAPM)", s); f.add([]);
    f.add([H("Custo do capital próprio (Ke)"), H("Valor"), H("Fonte e cálculo")]);
    f.add(["(+) Taxa livre de risco (USD)", IP(P.rf.v / 100), P.rf.fonte || ""], "rf"); f.add(["(+) Prêmio de mercado (ERP)", IP(P.erp.v / 100), P.erp.fonte || ""], "erp");
    f.add(["Beta desalavancado do setor", ID(W.bu), "base setorial Kinsey"], "bu"); f.add(["Dívida / patrimônio (D/E)", ID(W.de), "estrutura-alvo do setor"], "de");
    f.add(["Alíquota de IR para realavancagem", F(`${Pm.x("aliq", "B", 1)}`, "fp"), "Premissas"], "t");
    f.add(["Beta realavancado", FD(`B${f.r("bu")}*(1+(1-B${f.r("t")})*B${f.r("de")})`), "βu × (1 + (1 − t) × D/E)"], "bl");
    f.add(["(+) Risco-país", IP(P.crp.v / 100), P.crp.fonte || ""], "crp"); f.add(["(+) Prêmio de tamanho", IP(W.size / 100), P.size.fonte || ""], "size");
    f.add(["Ke em dólar", FP(`B${f.r("rf")}+B${f.r("bl")}*B${f.r("erp")}+B${f.r("crp")}+B${f.r("size")}`), "CAPM"], "keusd");
    f.add(["Inflação Brasil (longo prazo)", IP(P.infBR.v / 100), "Focus"], "ibr"); f.add(["Inflação EUA (longo prazo)", IP(P.infUS.v / 100), "FMI / CBO"], "ius");
    f.add(["(=) Ke em reais nominais", FP(`(1+B${f.r("keusd")})*(1+B${f.r("ibr")})/(1+B${f.r("ius")})-1`), "diferencial de inflação"], "ke");
    f.add([]); f.add([H("Custo da dívida (Kd)"), H("Valor"), H("")]);
    f.add(["Selic média de longo prazo", F(`${Pm.x("selic", YC(N - 1), 1)}`, "fp"), "Premissas"], "sel"); f.add(["Spread de crédito", IP(P.spread.v / 100), "BCB · taxa média PJ"], "spr");
    f.add(["Kd antes do IR", FP(`B${f.r("sel")}+B${f.r("spr")}`)], "kd"); f.add(["Kd após o IR", FP(`B${f.r("kd")}*(1-B${f.r("t")})`)], "kdl");
    f.add([]); f.add([H("Estrutura de capital e WACC"), H("Valor"), H("")]);
    f.add(["% capital próprio", FP(`1/(1+B${f.r("de")})`)], "we"); f.add(["% capital de terceiros", FP(`1-B${f.r("we")}`)], "wd");
    f.add(["WACC calculado (automático)", GP(`B${f.r("we")}*B${f.r("ke")}+B${f.r("wd")}*B${f.r("kdl")}`)], "wacc0");
    f.add(["Ajuste do consultor (p.p.)", F(`${Pm.x("ajw", "B", 1)}`, "fp"), "limite ±3 p.p., com justificativa"], "aj");
    f.add(["WACC usado", GP(`B${f.r("wacc0")}+MAX(-0.03,MIN(0.03,B${f.r("aj")}))`)], "wacc");
    f.add(["WACC real", FP(`(1+B${f.r("wacc")})/(1+B${f.r("ibr")})-1`)], "wreal");
    f.congela = [3, 0]; return f;
  }
  function fHistorico(s, d){
    const pers = D.periodos(s).slice().sort().slice(-5), Hs = pers.map(p => { const b = s.dd.bal[p], K = D.calc(b); return {p, b, K, f:K.f, rot:b.meses != 12 ? `${p.slice(5, 7)}/${p.slice(0, 4)} (${b.meses}m)` : p.slice(0, 4)}; });
    const f = Folha("Histórico", [44, ...Hs.map(() => 16)]); cab(f, "Demonstrações históricas (balancetes do sistema)", s); f.add([]);
    f.add([HH(`DRE do período (${UN()})`), ...Hs.map(h => HH(h.rot))], "hd"); const c = i => colL(1 + i);
    f.add(["Meses", ...Hs.map(h => I(+h.b.meses || 12))], "m");
    const v = (k, sg = 1) => Hs.map(h => M(sg * (h.K[k] || 0) / h.f));
    f.add(["Receita bruta", ...v("recBruta")], "rb"); f.add(["(-) Deduções", ...v("deducoes", -1)], "ded");
    f.add(["Receita líquida", ...Hs.map((_, i) => G(`${c(i)}${f.r("rb")}+${c(i)}${f.r("ded")}`))], "rl");
    f.add(["(-) Custos", ...v("cpv", -1)], "cpv"); f.add(["Lucro bruto", ...Hs.map((_, i) => G(`${c(i)}${f.r("rl")}+${c(i)}${f.r("cpv")}`))], "lb");
    f.add(["(-) Despesas operacionais", ...v("despOp", -1)], "dop"); f.add(["EBITDA", ...Hs.map((_, i) => G(`${c(i)}${f.r("lb")}+${c(i)}${f.r("dop")}`))], "eb");
    f.add(["% margem EBITDA", ...Hs.map((_, i) => FP(`IFERROR(${c(i)}${f.r("eb")}/${c(i)}${f.r("rl")},0)`))]);
    f.add(["(-) Depreciação e amortização", ...v("da", -1)], "da"); f.add(["EBIT", ...Hs.map((_, i) => F(`${c(i)}${f.r("eb")}+${c(i)}${f.r("da")}`))], "ebit");
    f.add(["(+/-) Resultado financeiro", ...v("resFin")], "rf"); f.add(["(+/-) Resultado não operacional (fora do EBITDA)", ...v("naoOp")], "nop"); f.add(["(-) IRPJ e CSLL", ...v("ir", -1)], "ir");
    f.add(["Lucro líquido", ...Hs.map((_, i) => G(`${c(i)}${f.r("ebit")}+${c(i)}${f.r("rf")}+${c(i)}${f.r("nop")}+${c(i)}${f.r("ir")}`))], "ll");
    f.add([]); f.add([HH(`Balanço patrimonial (${UN()})`), ...Hs.map(h => HH(h.rot))]);
    const g = k => Hs.map(h => M(h.K.G[k] || 0));
    const AC = [["caixa", "Caixa e equivalentes"], ["clientes", "Contas a receber"], ["pdd", "(-) Perdas esperadas"], ["estoques", "Estoques"], ["impRec", "Impostos a recuperar"], ["outrosAC", "Outros ativos circulantes"]];
    const ANC = [["rlp", "Realizável a longo prazo"], ["deposJud", "Depósitos judiciais"], ["mutuoAtivo", "Partes relacionadas (ativo)"], ["investimentos", "Investimentos"], ["imobilizado", "Imobilizado"], ["deprec", "(-) Depreciação acumulada"], ["intangivel", "Intangível"]];
    const PC = [["fornecedores", "Fornecedores"], ["empCP", "Empréstimos e financiamentos CP"], ["trab", "Obrigações trabalhistas"], ["tribCP", "Obrigações tributárias"], ["adiantCli", "Adiantamento de clientes"], ["outrosPC", "Outros passivos circulantes"]];
    const PNC = [["empLP", "Empréstimos e financiamentos LP"], ["parcTrib", "Parcelamentos tributários"], ["provisoes", "Provisões para contingências"], ["mutuoPassivo", "Partes relacionadas (passivo)"], ["outrosPNC", "Outros passivos não circulantes"]];
    const bloco = (L, tot, key) => { const ini = f.linhas.length + 1; L.forEach(([k, l]) => f.add([l, ...g(k)], "b_" + k)); const fim = f.linhas.length; f.add([tot, ...Hs.map((_, i) => G(`SUM(${c(i)}${ini}:${c(i)}${fim})`))], key); };
    bloco(AC, "Ativo circulante", "ac"); bloco(ANC, "Ativo não circulante", "anc"); f.add(["Ativo total", ...Hs.map((_, i) => G(`${c(i)}${f.r("ac")}+${c(i)}${f.r("anc")}`))], "at");
    bloco(PC, "Passivo circulante", "pc"); bloco(PNC, "Passivo não circulante", "pnc");
    f.add(["Patrimônio líquido (com resultado do período)", ...Hs.map(h => M(h.K.PL))], "pl");
    f.add(["Passivo + patrimônio líquido", ...Hs.map((_, i) => G(`${c(i)}${f.r("pc")}+${c(i)}${f.r("pnc")}+${c(i)}${f.r("pl")}`))], "ppl");
    f.add(["Diferença (deve ser zero)", ...Hs.map((_, i) => F(`${c(i)}${f.r("at")}-${c(i)}${f.r("ppl")}`))], "dif");
    f.congela = [3, 1]; f.Hs = Hs; return f;
  }
  function fDre(s, d, Pm){
    const f = Folha("DRE projetada"); cab(f, "DRE projetada", s); f.add([]);
    f.add([HP(UN()), HH("Base (anualizada)"), ...d.anos.map(y => HP(`${y}E`))], "h");
    const pr = (k, c = "B") => Pm.x(k, c, 1), prev = i => i ? YC(i - 1) : "B";
    f.add(["Receita bruta", M(d.rb), ...d.anos.map((_, i) => F(`${prev(i)}${f.idx.rb || 5}*(1+${Pm.x("g", YC(i))})*(1+${Pm.x("ipca", YC(i))})`))], "rb");
    f.linhas[f.r("rb") - 1] = ["Receita bruta", M(d.rb), ...d.anos.map((_, i) => F(`${prev(i)}${f.r("rb")}*(1+${Pm.x("g", YC(i))})*(1+${Pm.x("ipca", YC(i))})`))];
    f.add(["% crescimento nominal", "", ...d.anos.map((_, i) => FP(`IFERROR(${YC(i)}${f.r("rb")}/${prev(i)}${f.r("rb")}-1,0)`))]);
    f.add(["(-) Deduções", M(-d.K.deducoes), ...d.anos.map((_, i) => F(`-${YC(i)}${f.r("rb")}*${pr("ded")}`))], "ded");
    f.add(["Receita líquida", G(`B${f.r("rb")}+B${f.r("ded")}`), ...d.anos.map((_, i) => G(`${YC(i)}${f.r("rb")}+${YC(i)}${f.r("ded")}`))], "rl");
    f.add(["(-) Custos", M(-d.cpv), ...d.anos.map((_, i) => F(`-${YC(i)}${f.r("rl")}*${pr("custo")}`))], "cpv");
    f.add(["Lucro bruto", G(`B${f.r("rl")}+B${f.r("cpv")}`), ...d.anos.map((_, i) => G(`${YC(i)}${f.r("rl")}+${YC(i)}${f.r("cpv")}`))], "lb");
    f.add(["(-) Despesas operacionais", M(-d.desp), ...d.anos.map((_, i) => F(`-${YC(i)}${f.r("rl")}*${pr("desp")}`))], "dop");
    f.add(["EBITDA", G(`B${f.r("lb")}+B${f.r("dop")}`), ...d.anos.map((_, i) => G(`${YC(i)}${f.r("lb")}+${YC(i)}${f.r("dop")}`))], "eb");
    f.add(["(+/-) Ajustes de due diligence (não recorrentes)", M(d.ebAj), ...d.anos.map(() => M(0))], "ajdd");
    f.add(["EBITDA ajustado", G(`B${f.r("eb")}+B${f.r("ajdd")}`), ...d.anos.map((_, i) => G(`${YC(i)}${f.r("eb")}+${YC(i)}${f.r("ajdd")}`))], "ebaj");
    f.add(["% margem EBITDA ajustada", FP(`IFERROR(B${f.r("ebaj")}/B${f.r("rl")},0)`), ...d.anos.map((_, i) => FP(`IFERROR(${YC(i)}${f.r("ebaj")}/${YC(i)}${f.r("rl")},0)`))], "mg");
    f.add(["(-) Depreciação e amortização", M(-d.K.da), ...d.anos.map((_, i) => F(`-${YC(i)}${f.r("rl")}*${pr("da")}`))], "da");
    f.add(["EBIT", F(`B${f.r("ebaj")}+B${f.r("da")}`), ...d.anos.map((_, i) => F(`${YC(i)}${f.r("ebaj")}+${YC(i)}${f.r("da")}`))], "ebit");
    const ir = c => `IF(${pr("regime")}="Lucro presumido",-(${c}${f.r("rb")}*${pr("presIR")}*0.15+MAX(0,${c}${f.r("rb")}*${pr("presIR")}-${MI ? 0.24 : 240000})*0.1+${c}${f.r("rb")}*${pr("presCS")}*0.09),-MAX(0,${c}${f.r("ebit")})*${pr("aliq")})`;
    f.add(["(-) IRPJ e CSLL sobre o resultado operacional", F(ir("B")), ...d.anos.map((_, i) => F(ir(YC(i))))], "ir");
    f.add(["Lucro operacional líquido (NOPLAT)", G(`B${f.r("ebit")}+B${f.r("ir")}`), ...d.anos.map((_, i) => G(`${YC(i)}${f.r("ebit")}+${YC(i)}${f.r("ir")}`))], "nop");
    f.congela = [4, 1]; return f;
  }
  function fGiro(s, d, Pm, Dr){
    const f = Folha("Capital de giro"); cab(f, "Capital de giro em dias", s); f.add([]); const G0 = d.G;
    f.add([HP(UN()), HH("Base"), ...d.anos.map(y => HP(`${y}E`))], "h");
    const dias = k => Pm.x("d_" + k, "B", 1), rl = c => `${Q(Dr.nome)}!${c}${Dr.r("rl")}`, cp = c => `-${Q(Dr.nome)}!${c}${Dr.r("cpv")}`, cd = c => `(-${Q(Dr.nome)}!${c}${Dr.r("cpv")}-${Q(Dr.nome)}!${c}${Dr.r("dop")})`;
    const L = [["cli", "Contas a receber", (G0.clientes || 0), rl], ["est", "Estoques", (G0.estoques || 0), cp], ["imp", "Impostos a recuperar", (G0.impRec || 0), rl], ["outA", "Outros ativos operacionais", (G0.outrosAC || 0) + (G0.pdd || 0), rl]];
    const Pp = [["forn", "Fornecedores", (G0.fornecedores || 0), cp], ["trab", "Obrigações trabalhistas", (G0.trab || 0), cd], ["trib", "Obrigações tributárias", (G0.tribCP || 0), rl], ["outP", "Outros passivos operacionais", (G0.adiantCli || 0) + (G0.outrosPC || 0), cd]];
    f.add([T("Aplicações")]); const a0 = f.linhas.length + 1;
    L.forEach(([k, l, v, base]) => f.add([l, M(v), ...d.anos.map((_, i) => F(`${base(YC(i))}*${dias(k)}/360`))], "a_" + k)); const a1 = f.linhas.length;
    f.add(["Normalização (ajustes de DD e premissa do consultor)", F(`${rl("B")}*${Pm.x("ncgAj", "B", 1)}`), ...d.anos.map((_, i) => F(`${rl(YC(i))}*${Pm.x("ncgAj", "B", 1)}`))], "a_aj");
    f.linhas[f.linhas.length - 1] = f.linhas[f.linhas.length - 1]; const a1b = f.linhas.length;
    f.add([T("Fontes")]); const p0 = f.linhas.length + 1;
    Pp.forEach(([k, l, v, base]) => f.add([l, M(v), ...d.anos.map((_, i) => F(`${base(YC(i))}*${dias(k)}/360`))], "p_" + k)); const p1 = f.linhas.length;
    const cols = ["B", ...d.anos.map((_, i) => YC(i))];
    f.add(["Capital de giro líquido (NCG)", ...cols.map(c => G(`SUM(${c}${a0}:${c}${a1b})-SUM(${c}${p0}:${c}${p1})`))], "ncg");
    f.add(["Variação do capital de giro (investimento)", "", ...d.anos.map((_, i) => F(`${YC(i)}${f.r("ncg")}-${i ? YC(i - 1) : "B"}${f.r("ncg")}`))], "dncg");
    f.add(["% do capital de giro sobre a receita líquida", ...cols.map(c => FP(`IFERROR(${c}${f.r("ncg")}/${Q(Dr.nome)}!${c}${Dr.r("rl")},0)`))]);
    f.congela = [4, 1]; return f;
  }
  function fFcd(s, d, Pm, Wc, Dr, Gi){
    const f = Folha("FCD", [46, 16, 15, 15, 15, 15, 15, 15, 15]); cab(f, "Fluxo de caixa descontado (FCFF)", s); f.add([]);
    f.add([HP(UN()), H(""), ...d.anos.map(y => HP(`${y}E`)), HP("Perpetuidade")], "h");
    const dr = (k, c) => `${Q(Dr.nome)}!${c}${Dr.r(k)}`, w = Wc.x("wacc", "B", 1), g = Pm.x("gnom", "B", 1), cols = [...d.anos.map((_, i) => YC(i)), "H"];
    f.add(["EBITDA ajustado", "", ...d.anos.map((_, i) => F(dr("ebaj", YC(i)))), F(`${YC(N - 1)}{EB}*(1+${g})`)], "eb");
    f.linhas[f.r("eb") - 1][N + 2] = F(`${YC(N - 1)}${f.r("eb")}*(1+${g})`);
    f.add(["(-) IRPJ e CSLL sobre o EBIT", "", ...d.anos.map((_, i) => F(dr("ir", YC(i)))), F(`${YC(N - 1)}0`)], "ir");
    f.linhas[f.r("ir") - 1][N + 2] = F(`${YC(N - 1)}${f.r("ir")}*(1+${g})`);
    f.add(["(-) Investimentos (capex)", "", ...d.anos.map((_, i) => F(`-${dr("rl", YC(i))}*${Pm.x("capex", "B", 1)}`)), F("0")], "cx");
    f.linhas[f.r("cx") - 1][N + 2] = F(`${YC(N - 1)}${f.r("cx")}*(1+${g})`);
    f.add(["(-) Variação do capital de giro", "", ...d.anos.map((_, i) => F(`-${Q(Gi.nome)}!${YC(i)}${Gi.r("dncg")}`)), F("0")], "dg");
    f.linhas[f.r("dg") - 1][N + 2] = F(`-${Q(Gi.nome)}!${YC(N - 1)}${Gi.r("ncg")}*${g}`);
    f.add(["Fluxo de caixa livre da empresa (FCFF)", "", ...cols.map(c => G(`SUM(${c}${f.r("eb")}:${c}${f.r("dg")})`))], "fcff");
    f.add(["Período (meio do ano)", "", ...d.anos.map((_, i) => FD(`${i}+0.5`)), FD(`${YC(N - 1)}0`)], "per");
    f.linhas[f.r("per") - 1][N + 2] = FD(`${YC(N - 1)}${f.r("per")}`);
    f.add(["Fator de desconto", "", ...cols.map(c => FD(`1/(1+${w})^${c}${f.r("per")}`))], "fd");
    f.add(["Valor presente", "", ...d.anos.map((_, i) => F(`${YC(i)}${f.r("fcff")}*${YC(i)}${f.r("fd")}`)), F(`H${0}`)], "vp");
    f.linhas[f.r("vp") - 1][N + 2] = F(`H${f.r("fcff")}/(${w}-${g})*H${f.r("fd")}`);
    f.add([]); f.add([H("Valor"), H(UN())]);
    f.add(["Soma do valor presente dos fluxos", G(`SUM(C${f.r("vp")}:${YC(N - 1)}${f.r("vp")})`)], "svp");
    f.add(["Valor presente da perpetuidade", G(`H${f.r("vp")}`)], "vpp");
    f.add(["Enterprise value", G(`B${f.r("svp")}+B${f.r("vpp")}`)], "ev");
    f.add(["(-) Dívida líquida ajustada", F(`-${Pm.x("dl", "B", 1)}`)], "dl"); f.add(["(+) Caixa excedente e outros ativos", F(`${Pm.x("outros", "B", 1)}`)], "ou");
    f.add(["Equity value", G(`B${f.r("ev")}+B${f.r("dl")}+B${f.r("ou")}`)], "eq");
    f.add(["EV / EBITDA ajustado da base", FX(`IFERROR(B${f.r("ev")}/${dr("ebaj", "B")},0)`)], "mult");
    f.add(["Perpetuidade / enterprise value", FP(`IFERROR(B${f.r("vpp")}/B${f.r("ev")},0)`)], "pp");
    f.add(["WACC · crescimento na perpetuidade", FP(w), FP(g)]);
    f.add([]); f.add([H("Sensibilidade do EV: WACC × g"), ...[-0.01, -0.005, 0, 0.005, 0.01].map(x => H(`g ${x >= 0 ? "+" : ""}${(x * 100).toFixed(1).replace(".", ",")} p.p.`))], "sh");
    f.add(["g usado", ...[-0.01, -0.005, 0, 0.005, 0.01].map(x => FP(`${g}+(${x})`))], "sg");
    [-0.02, -0.01, 0, 0.01, 0.02].forEach((dw, k) => { const rr = f.linhas.length + 1;
      f.add([FP(`${w}+(${dw})`), ...[0, 1, 2, 3, 4].map(j => { const gc = `${colL(1 + j)}$${f.r("sg")}`;
        return F(`SUMPRODUCT($C$${f.r("fcff")}:$${YC(N - 1)}$${f.r("fcff")}/(1+$A${rr})^$C$${f.r("per")}:$${YC(N - 1)}$${f.r("per")})+$H$${f.r("fcff")}/(1+${g})*(1+${gc})/($A${rr}-${gc})/(1+$A${rr})^$H$${f.r("per")}`); })], "s" + k); });
    f.congela = [4, 1]; return f;
  }
  function fMult(s, d, Pm, Dr){
    const f = Folha("Múltiplos", [40, 22, 14, 14, 14, 18]); cab(f, "Múltiplos de mercado", s); f.add([]);
    f.add([H("Companhia"), H("Segmento"), H("EV/EBITDA"), H("EV/Receita"), H("Margem EBITDA"), H("Fonte")], "h");
    const L = (d.R.C?.ok || []).filter(c => c.evEb > 0 && c.evEb < 40); const ini = f.linhas.length + 1;
    if (L.length) L.forEach(c => f.add([IT(c.nome), IT(c.seg), ID(c.evEb), ID(c.evRec || 0), IP(c.mg || 0), IT(`${c.fonte || c.origem || ""} ${c.data || ""}`.trim())]));
    else { const r = d.C; f.add([IT(`Referência Kinsey · ${r.seg || "setor"} (p25)`), IT(r.seg || ""), ID(r.eb.p25), ID(r.rec?.p25 || 0), IP(r.mg?.med || 0), IT("referência Kinsey provisória")]); f.add([IT(`Referência Kinsey · ${r.seg || "setor"} (mediana)`), IT(r.seg || ""), ID(r.eb.med), ID(r.rec?.med || 0), IP(r.mg?.med || 0), IT("referência Kinsey provisória")]); f.add([IT(`Referência Kinsey · ${r.seg || "setor"} (p75)`), IT(r.seg || ""), ID(r.eb.p75), ID(r.rec?.p75 || 0), IP(r.mg?.med || 0), IT("referência Kinsey provisória")]); }
    for (let i = 0; i < 3; i++) f.add([IT("(incluir comparável)")]); /* linhas livres para o consultor */
    const fim = f.linhas.length, rg = c => `${c}${ini}:${c}${fim}`;
    f.add([]); f.add([H("Estatística"), H(""), H("EV/EBITDA"), H("EV/Receita")]);
    [["p25", 1], ["mediana", 2], ["p75", 3]].forEach(([n, q]) => f.add([n, "", FX(`IFERROR(QUARTILE(${rg("C")},${q}),0)`), FX(`IFERROR(QUARTILE(${rg("D")},${q}),0)`)], "q" + n));
    f.add([]); f.add([H("Aplicação ao target"), H(UN())]);
    f.add(["EBITDA ajustado da base", F(`${Q(Dr.nome)}!B${Dr.r("ebaj")}`)], "eb"); f.add(["Desconto de liquidez", F(Pm.x("descL", "B", 1), "fp")], "dl");
    ["p25", "mediana", "p75"].forEach(n => f.add([`EV pelo EV/EBITDA ${n}`, G(`B${f.r("eb")}*C${f.r("q" + n)}*(1-B${f.r("dl")})`)], "ev" + n));
    f.congela = [4, 0]; return f;
  }
  function fResumoVal(s, d, Pm, Fc, Mu){
    const f = Folha("Resumo", [52, 18, 18]); cab(f, "Resumo do valuation", s); f.add([]);
    f.add([H("Resultado"), H(UN()), H("")]);
    f.add(["Enterprise value (FCD)", G(`${Fc.x("ev", "B", 1)}`)], "ev"); f.add(["Equity value (FCD)", G(`${Fc.x("eq", "B", 1)}`)], "eq");
    f.add(["EV · WACC +1 p.p.", F(`${Q(Fc.nome)}!D${Fc.r("s3")}`)], "evmin"); f.add(["EV · WACC −1 p.p.", F(`${Q(Fc.nome)}!D${Fc.r("s1")}`)], "evmax");
    f.add(["EV pelos múltiplos · p25", F(Mu.x("evp25", "B", 1))], "m25"); f.add(["EV pelos múltiplos · mediana", F(Mu.x("evmediana", "B", 1))], "m50"); f.add(["EV pelos múltiplos · p75", F(Mu.x("evp75", "B", 1))], "m75");
    f.add(["Faixa recomendada · mínimo", G(`AVERAGE(B${f.r("evmin")},B${f.r("m25")})`)], "fmin"); f.add(["Faixa recomendada · máximo", G(`AVERAGE(B${f.r("evmax")},B${f.r("m75")})`)], "fmax");
    f.add(["Equity · faixa recomendada · mínimo", G(`B${f.r("fmin")}-${Pm.x("dl", "B", 1)}+${Pm.x("outros", "B", 1)}`)], "emin"); f.add(["Equity · faixa recomendada · máximo", G(`B${f.r("fmax")}-${Pm.x("dl", "B", 1)}+${Pm.x("outros", "B", 1)}`)], "emax");
    f.add(["WACC usado", F(`WACC!B${0}`, "fp")], "wacc");
    f.add(["EV / EBITDA implícito (FCD)", FX(Fc.x("mult", "B", 1))], "mult");
    f.add([]); f.add([H("Valores calculados pelo sistema (para conferência)"), H(UN()), H("Diferença")]);
    f.add(["Enterprise value · FCD moderado (sistema)", M(d.R.mod.c.ev), F(`B${f.r("ev")}-B${f.linhas.length + 1}`)], "sev");
    f.add(["Faixa recomendada do sistema · mínimo", M(d.R.rec[0])]); f.add(["Faixa recomendada do sistema · máximo", M(d.R.rec[1])]); f.add(["WACC do sistema", IP(d.W.wacc)]);
    f.congela = [3, 0]; return f;
  }
  function fCheck(nome, s, itens){
    const f = Folha(nome, [64, 18, 16]); cab(f, "Conferências", s); f.add([]); f.add([H("Conferência"), H("Resultado"), H("Valor")]);
    itens.forEach(([t, cond, val, fmt]) => f.add([t, F(`IF(${cond},"OK","Verificar")`, "t"), val ? (fmt === "p" ? FP(val) : fmt === "x" ? FX(val) : F(val)) : ""])); f.congela = [3, 0]; return f;
  }
  const PLANO = () => { const f = Folha("Plano de contas", [36, 50, 20]); f.add([T("Plano de contas padronizado Kinsey (classificação do sistema)")]); f.add(["Grupos usados pelo sistema para ler os balancetes e montar as demonstrações"]); f.add([]); f.add([H("Grupo"), H("Descrição"), H("Natureza")]);
    Object.entries(D.GRUPOS || {}).forEach(([k, g]) => f.add([k, g[0], {A:"Ativo", P:"Passivo", R:"Receita", D:"Despesa"}[g[1]] || g[1]])); f.congela = [4, 0]; return f; };

  /* ---------------- planilha de valuation ---------------- */
  async function valuationXlsx(s){ MI = true; try{ return await valuationXlsx0(s); } finally { MI = false; } }
  async function valuationXlsx0(s){
    const d = dados(s), Pm = fPremissas(s, d), Wc = fWacc(s, d, Pm), Hi = fHistorico(s, d), Dr = fDre(s, d, Pm), Gi = fGiro(s, d, Pm, Dr), Fc = fFcd(s, d, Pm, Wc, Dr, Gi), Mu = fMult(s, d, Pm, Dr), Rs = fResumoVal(s, d, Pm, Fc, Mu);
    Rs.linhas[Rs.r("wacc") - 1][1] = F(Wc.x("wacc", "B", 1), "fp");
    Rs.linhas[Rs.r("sev") - 1][2] = F(`B${Rs.r("ev")}-B${Rs.r("sev")}`);
    const hc = Hi.Hs.map((_, i) => colL(1 + i));
    const Ck = fCheck("Conferências", s, [
      ...hc.map((c, i) => [`Balanço fecha · ${Hi.Hs[i].rot}`, `ABS(${Hi.x("dif", c)})<${MI ? 0.001 : 1}`, Hi.x("dif", c)]),
      ["WACC dentro do limite de ajuste (±3 p.p. do automático)", `ABS(${Wc.x("wacc", "B")}-${Wc.x("wacc0", "B")})<=0.03`, `${Wc.x("wacc", "B")}-${Wc.x("wacc0", "B")}`, "p"],
      ["Crescimento na perpetuidade menor que o WACC", `${Pm.x("gnom", "B")}<${Wc.x("wacc", "B")}`, Pm.x("gnom", "B"), "p"],
      ["Perpetuidade até 85% do enterprise value", `${Fc.x("pp", "B")}<=0.85`, Fc.x("pp", "B"), "p"],
      ["EV/EBITDA implícito dentro da faixa de mercado (p25 com desconto a p75 × 1,25)", `AND(${Fc.x("mult", "B")}>=${Mu.x("qp25", "C")}*(1-${Pm.x("descL", "B")})*0.75,${Fc.x("mult", "B")}<=${Mu.x("qp75", "C")}*1.25)`, Fc.x("mult", "B"), "x"],
      ["Diferença do EV para o sistema até 10% (a planilha desconta no meio do período, padrão Kinsey)", `ABS(${Rs.x("sev", "C")})<=ABS(${Rs.x("sev", "B")})*0.1`, Rs.x("sev", "C")]]);
    const abas = [Rs, Pm, Wc, Hi, Dr, Gi, Fc, Mu, Ck, PLANO()];
    await rptSave(KT_XLSX.gerar(abas), KT_REL.arq(s, "valuation_modelagem_RS_mi", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  /* ---------------- planilha de PPA ---------------- */
  function fPpaPrem(s, d, z, q){
    const f = Folha("Premissas PPA", [58, 18, 50]); cab(f, "Premissas do PPA (CPC 15 / IFRS 3)", s); f.add([]); const v = (k, def) => q[k] != null && q[k] !== "" && !isNaN(q[k]) ? +q[k] : def;
    f.add([H("Consideração transferida"), H("Valor"), H("Observação")]);
    f.add(["Data de aquisição", IT(q.data || s.perfil?.dataBase || "")]);
    f.add(["Pagamento à vista (R$)", I(z.avista), z.fonte], "avista"); f.add(["Parcelas diferidas (R$)", I(v("diferido", 0) * 1e6)], "dif"); f.add(["Prazo das parcelas diferidas (anos)", I(v("prazoDif", 0))], "ndif");
    f.add(["Participação adquirida", IP(z.pct)], "pct"); f.add(["Método do valor justo do earn-out (Cenários ou Monte Carlo)", IT("Cenários")], "metEo");
    f.add([]); f.add([H("Taxas e tributos"), H("Valor"), H("")]);
    f.add(["Alíquota IRPJ + CSLL", IP(v("ir", 34) / 100)], "t"); f.add(["Prêmio de risco dos intangíveis sobre o WACC", IP(v("taxaAdic", 1) / 100)], "prem");
    f.add(["Aplicar benefício fiscal da amortização (TAB): 1 = sim, 0 = não", I(q.tab === false ? 0 : 1)], "tab");
    f.add([]); f.add([H("Ativos identificáveis"), H("Valor"), H("")]);
    f.add(["Mais-valia do imobilizado (laudo de ativos fixos)", I(v("imob", 0) * 1e6)], "imob"); f.add(["Mais-valia dos estoques", I(v("estoques", 0) * 1e6)], "est");
    f.add(["Folha anual de pessoal (força de trabalho)", I(z.wf ? (q.folha != null ? q.folha * 1e6 : Math.max(0, ((d.G.pessoal || 0) + (d.G.prolabore || 0)) * d.f)) : 0)], "folha");
    f.add(["Custo de recrutamento (% da folha)", IP(v("recrut", 3) / 100)], "rec"); f.add(["Custo de treinamento (% da folha)", IP(v("trein", 1.5) / 100)], "trein");
    f.add(["Produtividade média na contratação", IP(v("prod", 80) / 100)], "prod"); f.add(["Meses até a produtividade total", I(v("mesesProd", 5))], "mprod");
    f.add(["Royalty da marca (% da receita líquida)", IP(v("royalty", .5) / 100)], "roy"); f.add(["Vida útil da marca (anos; 0 = indefinida)", I(v("vidaM", 0))], "vidaM");
    f.add(["Royalty da tecnologia (% da receita líquida)", IP(v("royaltyT", 0) / 100)], "royT"); f.add(["Vida útil da tecnologia (anos)", I(v("vidaT", 5))], "vidaT");
    f.add(["Perda anual de clientes (churn)", IP(v("churn", 10) / 100), q.churnCalc ? `base de clientes ${q.churnCalc.anos || ""}` : "estimativa"], "churn"); f.add(["Vida útil da carteira para o TAB (anos)", I(z.vidaC || 10)], "vidaC");
    f.add(["Não concorrência · probabilidade de competição", IP(v("probNc", 10) / 100)], "pnc"); f.add(["Não concorrência · receita exposta", IP(v("expNc", 30) / 100)], "enc"); f.add(["Não concorrência · prazo (anos)", I(v("prazoNc", 5))], "nnc");
    f.add([]); f.add([H("Patrimônio líquido da adquirida"), H("Valor"), H("")]);
    f.add(["Patrimônio líquido contábil na data-base", I(z.plContabil)], "pl"); f.add(["Ajustes de due diligence no PL", I(z.ajDD)], "ajdd");
    f.congela = [3, 0]; return f;
  }
  async function ppaXlsx(s){
    const z = KT_POS.ppa(s); if (!z) throw new Error("PPA sem valuation.");
    const d = dados(s), q = s.pos?.ppa || {}, Pm = fPremissas(s, d), Wc = fWacc(s, d, Pm), Dr = fDre(s, d, Pm), Gi = fGiro(s, d, Pm, Dr), Pp = fPpaPrem(s, d, z, q);
    const p = k => Pp.x(k, "B", 1), w = Wc.x("wacc", "B", 1), rI = `(${w}+${p("prem")})`, t = p("t"), rl0 = `${Q(Dr.nome)}!$B$${Dr.r("rl")}`, mg = Pm.x("mgN", "B", 1), inf = Pm.x("ipca", YC(N - 1), 1), g = Pm.x("gnom", "B", 1);
    const tabF = (n, r) => `IF(${p("tab")}=1,${n}/(${n}-${t}*(1-(1+${r})^-${n})/${r}*(1+${r})^0.5),1)`;
    const NY = 15, YY = i => colL(2 + i), anosH = Array.from({length:NY}, (_, i) => HP(`Ano ${i + 1}`));
    /* CAC */
    const Ca = Folha("CAC", [54, 16, 50]); cab(Ca, "Encargos dos ativos contributivos (CAC)", s); Ca.add([]); Ca.add([H("Ativo contributivo"), H("Valor"), H("Base")]);
    Ca.add(["Capital de giro líquido (valor justo)", F(`${Q(Gi.nome)}!B${Gi.r("ncg")}`)], "ncg"); Ca.add(["Taxa de retorno do capital de giro (Kd após IR)", F(Wc.x("kdl", "B", 1), "fp")], "rncg");
    Ca.add(["Encargo do capital de giro (% da receita líquida)", FP(`IFERROR(B${Ca.r("ncg")}/${rl0}*B${Ca.r("rncg")},0)`)], "cncg");
    Ca.add(["Imobilizado a valor justo", F(`${Math.max(0, (d.G.imobilizado || 0) + (d.G.deprec || 0))}+${p("imob")}`)], "imob"); Ca.add(["Taxa de retorno do imobilizado (Kd)", F(Wc.x("kd", "B", 1), "fp")], "rimob");
    Ca.add(["Encargo do imobilizado após IR (% da receita líquida)", FP(`IFERROR(B${Ca.r("imob")}/${rl0}*B${Ca.r("rimob")}*(1-${t}),0)`)], "cimob");
    Ca.add(["Força de trabalho (valor justo)", F(`'Força de trabalho'!B0`)], "wf"); Ca.add(["Taxa de retorno da força de trabalho (WACC)", F(w, "fp")], "rwf");
    Ca.add(["Encargo da força de trabalho (% da receita líquida)", FP(`IFERROR(B${Ca.r("wf")}/${rl0}*B${Ca.r("rwf")},0)`)], "cwf");
    Ca.add(["Encargo da marca após IR (% da receita líquida)", FP(`${p("roy")}*(1-${t})`)], "cm"); Ca.add(["Encargo da tecnologia após IR (% da receita líquida)", FP(`${p("royT")}*(1-${t})`)], "ct");
    Ca.add(["Encargo da não concorrência (% da receita líquida)", FP("0")], "cnc");
    Ca.add(["Encargo total (% da receita líquida)", GP(`B${Ca.r("cncg")}+B${Ca.r("cimob")}+B${Ca.r("cwf")}+B${Ca.r("cm")}+B${Ca.r("ct")}+B${Ca.r("cnc")}`)], "tot");
    /* força de trabalho */
    const Wf = Folha("Força de trabalho", [58, 18]); cab(Wf, "Força de trabalho · custo de reposição", s); Wf.add([]); Wf.add([H("Cálculo"), H("Valor")]);
    Wf.add(["Folha anual de pessoal", F(p("folha"))], "folha"); Wf.add(["Custo de recrutamento", F(`B${Wf.r("folha")}*${p("rec")}`)], "rc"); Wf.add(["Custo de treinamento", F(`B${Wf.r("folha")}*${p("trein")}`)], "tr");
    Wf.add(["Perda de produtividade", F(`B${Wf.r("folha")}*(1-${p("prod")})*${p("mprod")}/12`)], "pp"); Wf.add(["Custo de reposição antes do IR", G(`SUM(B${Wf.r("rc")}:B${Wf.r("pp")})`)], "bruto");
    Wf.add(["Valor justo da força de trabalho (líquido do IR, padrão do sistema)", G(`B${Wf.r("bruto")}/(1-${t})`)], "vj");
    Wf.add(["Valor com TAB em 5 anos (padrão dos laudos Kinsey, para comparação)", F(`B${Wf.r("bruto")}*${tabF(5, w)}`)], "vjtab");
    Wf.add(["Observação", IT("A força de trabalho não é reconhecida separadamente: integra o goodwill, mas entra como ativo contributivo no CAC e na WARA.")]);
    Ca.linhas[Ca.r("wf") - 1][1] = F(Wf.x("vj", "B", 1));
    /* carteira de clientes (MPEEM) */
    const Cc = Folha("Carteira de clientes", [52, 14, ...Array(NY).fill(13)]); cab(Cc, "Carteira de clientes · MPEEM (lucros excedentes)", s); Cc.add([]);
    Cc.add([HP("R$"), H(""), ...anosH], "h"); const yc = i => YY(i);
    Cc.add(["Ano", "", ...Array.from({length:NY}, (_, i) => I(i + 1))], "ano");
    Cc.add(["Sobrevivência da carteira (meio do ano)", "", ...Array.from({length:NY}, (_, i) => FP(`(1-${p("churn")})^(${yc(i)}${Cc.r("ano")}-0.5)`))], "sv");
    Cc.add(["Receita líquida da carteira atual", "", ...Array.from({length:NY}, (_, i) => F(`${rl0}*(1+${inf})^${yc(i)}${Cc.r("ano")}*${yc(i)}${Cc.r("sv")}`))], "rec");
    Cc.add(["EBITDA (margem da base)", "", ...Array.from({length:NY}, (_, i) => F(`${yc(i)}${Cc.r("rec")}*${mg}`))], "eb");
    Cc.add(["(-) Depreciação", "", ...Array.from({length:NY}, (_, i) => F(`-${yc(i)}${Cc.r("rec")}*${Pm.x("da", "B", 1)}`))], "da");
    Cc.add(["(-) IRPJ e CSLL", "", ...Array.from({length:NY}, (_, i) => F(`-MAX(0,${yc(i)}${Cc.r("eb")}+${yc(i)}${Cc.r("da")})*${t}`))], "ir");
    Cc.add(["(-) Encargos dos ativos contributivos (CAC)", "", ...Array.from({length:NY}, (_, i) => F(`-${yc(i)}${Cc.r("rec")}*${Ca.x("tot", "B", 1)}`))], "cac");
    Cc.add(["Lucro excedente", "", ...Array.from({length:NY}, (_, i) => G(`SUM(${yc(i)}${Cc.r("eb")}:${yc(i)}${Cc.r("cac")})`))], "exc");
    Cc.add(["Fator de desconto (WACC + prêmio)", "", ...Array.from({length:NY}, (_, i) => FD(`1/(1+${rI})^(${yc(i)}${Cc.r("ano")}-0.5)`))], "fd");
    Cc.add(["Valor presente", "", ...Array.from({length:NY}, (_, i) => F(`MAX(0,${yc(i)}${Cc.r("exc")})*${yc(i)}${Cc.r("fd")}`))], "vp");
    Cc.add([]); Cc.add(["Soma do valor presente", G(`SUM(C${Cc.r("vp")}:${YY(NY - 1)}${Cc.r("vp")})`)], "svp");
    Cc.add(["Fator do benefício fiscal (TAB)", FD(tabF(p("vidaC"), rI))], "tab"); Cc.add(["Valor justo da carteira de clientes", G(`B${Cc.r("svp")}*B${Cc.r("tab")}`)], "vj");
    Cc.congela = [4, 2];
    /* marca e tecnologia (relief-from-royalty) */
    const rfr = (nome, roy, vida, decai) => { const f = Folha(nome, [52, 14, ...Array(10).fill(13)]); cab(f, `${nome} · relief-from-royalty`, s); f.add([]);
      f.add([HP("R$"), H(""), ...Array.from({length:10}, (_, i) => HP(`Ano ${i + 1}`))], "h"); const c = i => colL(2 + i);
      f.add(["Ano", "", ...Array.from({length:10}, (_, i) => I(i + 1))], "ano");
      f.add(["Receita líquida", "", ...Array.from({length:10}, (_, i) => F(decai ? `IF(${c(i)}${f.r("ano")}<=${vida},${rl0}*(1+${g})^${c(i)}${f.r("ano")}*(1-(${c(i)}${f.r("ano")}-1)/MAX(1,${vida})),0)` : `${rl0}*(1+${g})^${c(i)}${f.r("ano")}`))], "rec");
      f.add(["Royalty evitado após o IR", "", ...Array.from({length:10}, (_, i) => F(`${c(i)}${f.r("rec")}*${roy}*(1-${t})`))], "fl");
      f.add(["Fator de desconto", "", ...Array.from({length:10}, (_, i) => FD(`1/(1+${rI})^(${c(i)}${f.r("ano")}-0.5)`))], "fd");
      f.add(["Valor presente", "", ...Array.from({length:10}, (_, i) => F(`${c(i)}${f.r("fl")}*${c(i)}${f.r("fd")}`))], "vp");
      f.add([]); f.add(["Soma do valor presente", G(`SUM(C${f.r("vp")}:L${f.r("vp")})`)], "svp");
      f.add(["Perpetuidade (vida indefinida)", F(decai ? "0" : `IF(${vida}=0,L${f.r("fl")}*(1+${g})/(${rI}-${g})*L${f.r("fd")},0)`)], "perp");
      f.add(["Fator do benefício fiscal (TAB)", FD(decai ? tabF(vida, rI) : `IF(${vida}>0,${tabF(vida, rI)},1)`)], "tab");
      f.add(["Valor justo", G(`(B${f.r("svp")}+B${f.r("perp")})*B${f.r("tab")}`)], "vj"); f.congela = [4, 2]; return f; };
    const Ma = rfr("Marca", p("roy"), p("vidaM"), false), Te = rfr("Tecnologia", p("royT"), p("vidaT"), true);
    /* não concorrência (com e sem) */
    const Nc = Folha("Não concorrência", [52, 14, ...Array(10).fill(13)]); cab(Nc, "Cláusula de não concorrência · com e sem", s); Nc.add([]);
    Nc.add([HP("R$"), H(""), ...Array.from({length:10}, (_, i) => HP(`Ano ${i + 1}`))], "h"); const nc = i => colL(2 + i);
    Nc.add(["Ano", "", ...Array.from({length:10}, (_, i) => I(i + 1))], "ano");
    Nc.add(["Perda de lucro evitada após IR", "", ...Array.from({length:10}, (_, i) => F(`IF(${nc(i)}${Nc.r("ano")}<=${p("nnc")},${rl0}*(1+${g})^${nc(i)}${Nc.r("ano")}*${p("enc")}*${mg}*(1-${t})*${p("pnc")},0)`))], "pd");
    Nc.add(["Fator de desconto", "", ...Array.from({length:10}, (_, i) => FD(`1/(1+${rI})^(${nc(i)}${Nc.r("ano")}-0.5)`))], "fd");
    Nc.add(["Valor presente", "", ...Array.from({length:10}, (_, i) => F(`${nc(i)}${Nc.r("pd")}*${nc(i)}${Nc.r("fd")}`))], "vp");
    Nc.add([]); Nc.add(["Valor justo da não concorrência", G(`SUM(C${Nc.r("vp")}:L${Nc.r("vp")})*${tabF(p("nnc"), rI)}`)], "vj"); Nc.congela = [4, 2];
    Ca.linhas[Ca.r("cnc") - 1][1] = FP(`IFERROR(${Nc.x("vj", "B", 1)}/${rl0}*${rI},0)`);
    /* contingências */
    const Co = Folha("Contingências", [56, 16, 14, 14, 14, 14, 16]); cab(Co, "Contingências (passivos contingentes a valor justo)", s); Co.add([]);
    Co.add([H("Contingência"), H("Avaliação"), H("Mínimo"), H("Máximo"), H("Qualificado"), H("Probabilidade"), H("Valor justo")], "h");
    const EX = window.KT_EXP ? KT_EXP.lista(s) : [], ano = +String(d.X.perBase || "").slice(0, 4) || new Date().getFullYear(); const c0 = Co.linhas.length + 1;
    EX.forEach(e => { const c = KT_EXP.calc(e, ano), r = Co.linhas.length + 1, pr = e.aval === "provavel" ? 1 : e.aval === "possivel" ? .3 : .05;
      Co.add([IT(e.titulo), IT(e.aval || ""), I(c.min || 0), I(c.max || 0), I(c.qual || 0), IP(pr), F(`IF(E${r}>0,E${r},(C${r}+D${r})/2*F${r})`)]); });
    for (let i = 0; i < 3; i++){ const r = Co.linhas.length + 1; Co.add([IT(""), IT(""), I(0), I(0), I(0), IP(0), F(`IF(E${r}>0,E${r},(C${r}+D${r})/2*F${r})`)]); }
    const c1 = Co.linhas.length; Co.add(["Total das contingências a valor justo", "", "", "", "", "", G(`SUM(G${c0}:G${c1})`)], "tot");
    Co.add(["Observação", IT("Valores em R$. Provável: 100%; possível: 30%; remota: 5% (ajuste conforme o parecer jurídico). Quando houver valor qualificado, ele prevalece.")]);
    /* earn-out por cenários */
    const Eo = Folha("Earn-out", [44, 18, 14, 14, 14, 14, 16]); cab(Eo, "Earn-out · cenários ponderados (padrão Kinsey)", s); Eo.add([]);
    const eoMax = (+q.earnout || 0) * 1e6, nEo = Math.max(1, Math.min(5, +q.prazoEo || 3));
    Eo.add([H("Parâmetros"), H("Valor")]);
    Eo.add(["Parcela anual máxima do earn-out", I(eoMax / nEo)], "pay"); Eo.add(["Gatilho mínimo (% da meta)", IP(.5)], "min"); Eo.add(["Meta (% da meta)", IP(1)], "meta"); Eo.add(["Teto (% da meta)", IP(1.3)], "max");
    Eo.add(["Taxa de desconto (WACC)", F(w, "fp")], "r");
    Eo.add([]); Eo.add([HP("Meta de receita líquida"), H(""), ...Array.from({length:nEo}, (_, i) => HP(`${d.anos[i]}`))], "hm");
    Eo.add(["Meta contratual", "", ...Array.from({length:nEo}, (_, i) => F(`${Q(Dr.nome)}!${YC(i)}${Dr.r("rl")}`))], "mt");
    Eo.add(["CDI acumulado (correção)", "", ...Array.from({length:nEo}, (_, i) => FP(`PRODUCT(1+${Pm.x("cdi", YC(0))}:${YC(i)}$${Pm.r("cdi")})-1`))], "cdi");
    Eo.linhas[Eo.r("cdi") - 1] = ["CDI acumulado (correção)", "", ...Array.from({length:nEo}, (_, i) => FP(i ? `(1+${colL(1 + i)}${Eo.r("cdi")})*(1+${Pm.x("cdi", YC(i))})-1` : `${Pm.x("cdi", YC(0))}`))];
    Eo.add(["Fator de desconto (fim do período)", "", ...Array.from({length:nEo}, (_, i) => FD(`1/(1+$B$${Eo.r("r")})^${i + 1}`))], "fd");
    Eo.add([]); Eo.add([H("Cenário (receita como % da meta)"), H("Probabilidade"), ...Array.from({length:nEo}, (_, i) => H(`${d.anos[i]}`)), H("Valor presente")], "hc");
    const cen = [["Pessimista", .1, .8], ["Conservador", .2, .9], ["Base (meta)", .4, 1], ["Moderado", .2, 1.05], ["Otimista", .1, 1.15]];
    cen.forEach(([n, pr, k]) => { const r = Eo.linhas.length + 1, cols = Array.from({length:nEo}, (_, i) => colL(2 + i));
      Eo.add([n, IP(pr), ...cols.map(() => IP(k)), F("0")], "c_" + n);
      const pagto = c => `$B$${Eo.r("pay")}*IF(${c}${r}<$B$${Eo.r("min")},0,IF(${c}${r}<=$B$${Eo.r("meta")},(${c}${r}-$B$${Eo.r("min")})/($B$${Eo.r("meta")}-$B$${Eo.r("min")}),MIN(${c}${r},$B$${Eo.r("max")})))*(1+${c}$${Eo.r("cdi")})*${c}$${Eo.r("fd")}`;
      Eo.linhas[r - 1][2 + nEo] = F(cols.map(pagto).join("+")); });
    const rc0 = Eo.r("c_Pessimista"), rc1 = Eo.r("c_Otimista"), vpc = colL(2 + nEo);
    Eo.add(["Soma das probabilidades (deve ser 100%)", GP(`SUM(B${rc0}:B${rc1})`)], "sp");
    Eo.add(["Valor justo do earn-out · cenários", G(`SUMPRODUCT(B${rc0}:B${rc1},${vpc}${rc0}:${vpc}${rc1})`)], "vj");
    Eo.congela = [3, 1];
    /* earn-out por Monte Carlo */
    const Mc = Folha("Monte Carlo", [12, ...Array(nEo * 3 + 1).fill(13)]); cab(Mc, "Earn-out · simulação de Monte Carlo (1.000 cenários; recalcula a cada F9)", s); Mc.add([]);
    Mc.add([H("Parâmetros"), H("Valor")]); Mc.add(["Receita média (% da meta)", IP(1)], "mu"); Mc.add(["Desvio-padrão anual", IP(.1)], "sd");
    Mc.add(["Valor justo · média", G("0")], "vj"); Mc.add(["Percentil 5%", F("0")], "p5"); Mc.add(["Mediana", F("0")], "p50"); Mc.add(["Percentil 95%", F("0")], "p95"); Mc.add(["Probabilidade de não pagar", F("0", "fp")], "p0");
    Mc.add([]); Mc.add([H("Simulação"), ...Array.from({length:nEo}, (_, i) => HP(`% meta ${d.anos[i]}`)), ...Array.from({length:nEo}, (_, i) => HP(`VP ${d.anos[i]}`)), HP("VP total")], "hs");
    const m0 = Mc.linhas.length + 1, EP = k => Eo.x(k, "B", 1);
    for (let n = 0; n < 1000; n++){ const r = m0 + n, rr = Array.from({length:nEo}, (_, i) => colL(1 + i));
      Mc.add([I(n + 1), ...rr.map(() => FP(`MAX(0,NORMINV(RAND(),$B$${Mc.r("mu")},$B$${Mc.r("sd")}))`)),
        ...rr.map((c, i) => F(`${EP("pay")}*IF(${c}${r}<${EP("min")},0,IF(${c}${r}<=${EP("meta")},(${c}${r}-${EP("min")})/(${EP("meta")}-${EP("min")}),MIN(${c}${r},${EP("max")})))*(1+${Eo.x("cdi", colL(2 + i), 1)})*${Eo.x("fd", colL(2 + i), 1)}`)),
        F(`SUM(${colL(1 + nEo)}${r}:${colL(nEo * 2)}${r})`)]); }
    const m1 = m0 + 999, vt = colL(nEo * 2 + 1), rgv = `${vt}${m0}:${vt}${m1}`;
    Mc.linhas[Mc.r("vj") - 1][1] = G(`AVERAGE(${rgv})`); Mc.linhas[Mc.r("p5") - 1][1] = F(`PERCENTILE(${rgv},0.05)`); Mc.linhas[Mc.r("p50") - 1][1] = F(`MEDIAN(${rgv})`); Mc.linhas[Mc.r("p95") - 1][1] = F(`PERCENTILE(${rgv},0.95)`); Mc.linhas[Mc.r("p0") - 1][1] = FP(`COUNTIF(${rgv},0)/1000`);
    Mc.congela = [Mc.r("hs"), 1];
    /* alocação do preço e goodwill */
    const Pg = Folha("PPA Goodwill", [64, 20, 14, 36]); cab(Pg, "Alocação do preço de compra (PPA) e goodwill", s); Pg.add([]); Pg.add([H("Item"), H("R$"), H("Vida útil"), H("Método")]);
    Pg.add(["Patrimônio líquido contábil", F(p("pl"))], "pl"); Pg.add(["(+/-) Ajustes de due diligence", F(p("ajdd"))], "aj");
    Pg.add(["(+) Mais-valia do imobilizado", F(p("imob")), "", "laudo de ativos fixos"], "imob"); Pg.add(["(+) Mais-valia dos estoques", F(p("est"))], "est");
    Pg.add(["(+) Carteira de clientes", F(Cc.x("vj", "B", 1)), F(p("vidaC")), "MPEEM"], "cc"); Pg.add(["(+) Marca", F(Ma.x("vj", "B", 1)), F(p("vidaM")), "relief-from-royalty"], "ma");
    Pg.add(["(+) Tecnologia", F(Te.x("vj", "B", 1)), F(p("vidaT")), "relief-from-royalty"], "te"); Pg.add(["(+) Não concorrência", F(Nc.x("vj", "B", 1)), F(p("nnc")), "com e sem"], "nc");
    Pg.add(["(-) Contingências a valor justo", F(`-${Co.x("tot", "G", 1)}`)], "co");
    Pg.add(["(-) IR diferido sobre as mais-valias", F(`-(SUM(B${Pg.r("imob")}:B${Pg.r("nc")})+B${Pg.r("co")})*${t}`)], "ird");
    Pg.add(["Valor justo dos ativos líquidos identificáveis", G(`SUM(B${Pg.r("pl")}:B${Pg.r("ird")})`)], "vjal");
    Pg.add(["Participação de não controladores", F(`B${Pg.r("vjal")}*(1-${p("pct")})`)], "nci");
    Pg.add([]); Pg.add([H("Consideração transferida"), H("R$")]);
    Pg.add(["Pagamento à vista", F(p("avista"))], "av"); Pg.add(["Parcelas diferidas a valor presente (Kd)", F(`IF(${p("ndif")}>0,${p("dif")}/(1+${Wc.x("kd", "B", 1)})^${p("ndif")},${p("dif")})`)], "vpd");
    Pg.add(["Earn-out a valor justo", F(`IF(${p("metEo")}="Monte Carlo",${Mc.x("vj", "B", 1)},${Eo.x("vj", "B", 1)})`)], "eo");
    Pg.add(["Consideração total", G(`SUM(B${Pg.r("av")}:B${Pg.r("eo")})`)], "cons");
    Pg.add([]); Pg.add(["Goodwill (ágio por expectativa de rentabilidade futura)", G(`MAX(0,B${Pg.r("cons")}+B${Pg.r("nci")}-B${Pg.r("vjal")})`)], "gw");
    Pg.add(["Ganho por compra vantajosa (se negativo)", F(`MIN(0,B${Pg.r("cons")}+B${Pg.r("nci")}-B${Pg.r("vjal")})`)], "cv");
    Pg.add(["Goodwill / consideração", FP(`IFERROR(B${Pg.r("gw")}/B${Pg.r("cons")},0)`)], "gwp");
    Pg.add([]); Pg.add([H("Valores calculados pelo sistema (para conferência)"), H("R$"), H("Diferença")]);
    [["Carteira de clientes", z.vC, "cc"], ["Marca", z.vM, "ma"], ["Tecnologia", z.vT, "te"], ["Não concorrência", z.vNc, "nc"], ["Consideração total", z.preco, "cons"], ["Goodwill", z.goodwill, "gw"]].forEach(([n, v, k]) => { const r = Pg.linhas.length + 1; Pg.add([`${n} (sistema)`, I(v), F(`B${Pg.r(k)}-B${r}`)], "s_" + k); });
    Pg.congela = [3, 0];
    /* WARA */
    const Wa = Folha("WARA", [48, 18, 14, 16, 16]); cab(Wa, "WARA · retorno ponderado dos ativos", s); Wa.add([]); Wa.add([H("Ativo"), H("Valor justo"), H("Taxa"), H("% da consideração"), H("Contribuição")], "h");
    const at = [["Capital de giro líquido", Ca.x("ncg", "B", 1), Ca.x("rncg", "B", 1)], ["Imobilizado", Ca.x("imob", "B", 1), Ca.x("rimob", "B", 1)], ["Força de trabalho", Wf.x("vj", "B", 1), w],
      ["Carteira de clientes", Cc.x("vj", "B", 1), rI], ["Marca", Ma.x("vj", "B", 1), rI], ["Tecnologia", Te.x("vj", "B", 1), rI], ["Não concorrência", Nc.x("vj", "B", 1), rI]];
    const w0 = Wa.linhas.length + 1; at.forEach(([n, v, r]) => { const rr = Wa.linhas.length + 1; Wa.add([n, F(v), FP(r), FP(`IFERROR(B${rr}/$B$${0},0)`), FP(`D${rr}*C${rr}`)]); }); const w1 = Wa.linhas.length;
    Wa.add(["Goodwill residual (exceto força de trabalho)", F(`MAX(0,${Pg.x("cons", "B", 1)}-SUM(B${w0}:B${w1}))`), FP(`IFERROR((${w}-SUMPRODUCT(B${w0}:B${w1},C${w0}:C${w1})/${Pg.x("cons", "B", 1)})*${Pg.x("cons", "B", 1)}/B${w1 + 1},0)`), FP("0"), FP("0")], "gw");
    Wa.add(["Consideração total", G(Pg.x("cons", "B", 1))], "tot");
    for (let r = w0; r <= w1 + 1; r++){ Wa.linhas[r - 1][3] = FP(`IFERROR(B${r}/$B$${Wa.r("tot")},0)`); Wa.linhas[r - 1][4] = FP(`D${r}*C${r}`); }
    Wa.add(["WARA (retorno ponderado)", GP(`SUM(E${w0}:E${w1 + 1})`)], "wara"); Wa.add(["WACC", F(w, "fp")], "wacc"); Wa.add(["Diferença WARA − WACC", FP(`B${Wa.r("wara")}-B${Wa.r("wacc")}`)], "dif");
    Wa.add(["Taxa implícita do goodwill acima da dos intangíveis", F(`IF(C${w1 + 1}>=${rI},"OK","Verificar: goodwill com retorno menor que os intangíveis")`, "t")]);
    Wa.congela = [4, 0];
    const Ck = fCheck("Conferências PPA", s, [
      ["Goodwill não negativo (sem compra vantajosa)", `${Pg.x("cv", "B")}=0`, Pg.x("gw", "B")],
      ["WARA próxima do WACC (até 2 p.p.)", `ABS(${Wa.x("dif", "B")})<=0.02`, Wa.x("dif", "B"), "p"],
      ["Soma das probabilidades do earn-out = 100%", `ABS(${Eo.x("sp", "B")}-1)<0.0001`, Eo.x("sp", "B"), "p"],
      ["Goodwill até 60% da consideração", `${Pg.x("gwp", "B")}<=0.6`, Pg.x("gwp", "B"), "p"],
      ["Carteira de clientes próxima do sistema (até 10%)", `ABS(${Pg.x("s_cc", "C")})<=MAX(1,ABS(${Pg.x("s_cc", "B")})*0.1)`, Pg.x("s_cc", "C")],
      ["Goodwill próximo do sistema (até 10%)", `ABS(${Pg.x("s_gw", "C")})<=MAX(1,ABS(${Pg.x("s_gw", "B")})*0.1)`, Pg.x("s_gw", "C")],
      ["WACC dentro do limite de ajuste (±3 p.p.)", `ABS(${Wc.x("wacc", "B")}-${Wc.x("wacc0", "B")})<=0.03`, Wc.x("wacc", "B"), "p"]]);
    const IT_ = Folha("Intangíveis CPC 15", [60, 18, 40]); cab(IT_, "Intangíveis identificáveis (CPC 15 / IFRS 3)", s); IT_.add([]); IT_.add([H("Classe"), H("Base"), H("Tratamento neste PPA")]);
    [["Relacionamento com clientes e carteira", "Contratual ou não", "MPEEM (lucros excedentes)"], ["Marcas e nomes comerciais", "Contratual", "Relief-from-royalty"], ["Software e tecnologia", "Contratual ou não", "Relief-from-royalty com decaimento"],
      ["Acordos de não concorrência", "Contratual", "Com e sem (perda evitada)"], ["Contratos com clientes e backlog", "Contratual", "Incluir na carteira ou avaliar à parte"], ["Força de trabalho", "Não separável", "Custo de reposição · integra o goodwill"],
      ["Licenças, permissões e direitos", "Contratual", "Avaliar quando relevantes"], ["Contratos de arrendamento favoráveis", "Contratual", "Avaliar quando relevantes"]].forEach(r => IT_.add(r));
    const abas = [Pg, Pp, Pm, Wc, Dr, Gi, Ca, Cc, Ma, Te, Nc, Wf, Co, Eo, Mc, Wa, Ck, IT_];
    await rptSave(KT_XLSX.gerar(abas), KT_REL.arq(s, "PPA_planilha_padronizada", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  /* ---------------- importação da planilha do consultor ---------------- */
  const num = v => { if (v == null || v === "") return null; const x = +String(v).replace(/\s/g, ""); return isFinite(x) ? x : null; };
  async function importar(s, tipo, file){
    const P = await KT_DDWB.planilhas(await file.arrayBuffer()), achar = (aba, rot) => { const L = P[aba] || []; const r = L.find(x => String(x?.[0] || "").trim().toLowerCase() === rot.toLowerCase()); return r ? num(r[1]) : null; };
    const R = tipo === "ppa" ? {consideracao:achar("PPA Goodwill", "Consideração total"), goodwill:achar("PPA Goodwill", "Goodwill (ágio por expectativa de rentabilidade futura)"), carteira:achar("PPA Goodwill", "(+) Carteira de clientes"),
        marca:achar("PPA Goodwill", "(+) Marca"), tecnologia:achar("PPA Goodwill", "(+) Tecnologia"), naoConc:achar("PPA Goodwill", "(+) Não concorrência"), earnout:achar("PPA Goodwill", "Earn-out a valor justo"), wara:achar("WARA", "WARA (retorno ponderado)"), wacc:achar("WACC", "WACC usado")}
      : {ev:achar("Resumo", "Enterprise value (FCD)"), equity:achar("Resumo", "Equity value (FCD)"), fmin:achar("Resumo", "Faixa recomendada · mínimo"), fmax:achar("Resumo", "Faixa recomendada · máximo"), wacc:achar("WACC", "WACC usado"), mult:achar("Resumo", "EV / EBITDA implícito (FCD)")};
    if (tipo !== "ppa" && /R\$ mi|milh/i.test((P.Resumo || []).slice(0, 4).map(x => (x || []).join(" ")).join(" "))) ["ev", "equity", "fmin", "fmax"].forEach(k => { if (R[k] != null) R[k] *= 1e6; }); /* modelagem em R$ mi */
    const lidos = Object.values(R).filter(v => v != null).length;
    if (!lidos) throw new Error("Não encontrei os resultados. Abra a planilha no Excel, salve (para gravar os valores das fórmulas) e importe de novo.");
    const reg = {arquivo:file.name, em:nowISO(), por:Store.me?.email || "", resultados:R};
    await D.up(s, tipo === "ppa" ? {pos:{ppaConsultor:reg}} : {dd:{vlConsultor:reg}}); return reg;
  }
  function conferencia(s, tipo){
    const reg = tipo === "ppa" ? s.pos?.ppaConsultor : s.dd?.vlConsultor; if (!reg) return "";
    let L = [];
    if (tipo === "ppa"){ const z = KT_POS.ppa(s); if (!z) return ""; L = [["Consideração total", z.preco, reg.resultados.consideracao], ["Carteira de clientes", z.vC, reg.resultados.carteira], ["Marca", z.vM, reg.resultados.marca], ["Tecnologia", z.vT, reg.resultados.tecnologia], ["Não concorrência", z.vNc, reg.resultados.naoConc], ["Goodwill", z.goodwill, reg.resultados.goodwill]]; }
    else { const R = KT_VAL.resumo(s); if (!R.X || R.X.vazio) return ""; L = [["Enterprise value (FCD moderado)", R.mod.c.ev, reg.resultados.ev], ["Equity value", R.mod.c.eq, reg.resultados.equity], ["Faixa · mínimo", R.rec[0], reg.resultados.fmin], ["Faixa · máximo", R.rec[1], reg.resultados.fmax]]; }
    const row = ([n, a, b]) => { const df = b != null && a ? (b - a) / Math.abs(a) : null; return `<tr><td>${esc(n)}</td><td class="dd-num">${mi(a)}</td><td class="dd-num">${b != null ? mi(b) : "—"}</td><td class="dd-num" style="color:${df != null && Math.abs(df) > .1 ? "var(--bad)" : "inherit"}">${df != null ? pc(df) : "—"}</td></tr>`; };
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:0">Conferência sistema × planilha do consultor</h3><p class="sub" style="margin:0;font-size:12.5px">${esc(reg.arquivo)} · importada em ${new Date(reg.em).toLocaleDateString("pt-BR")}${reg.por ? " · " + esc(reg.por) : ""}. Diferenças acima de 10% em vermelho.</p>
      <div class="tbl"><table><thead><tr><th>Item</th><th class="dd-num">Sistema</th><th class="dd-num">Consultor</th><th class="dd-num">Diferença</th></tr></thead><tbody>${L.map(row).join("")}${tipo !== "ppa" && reg.resultados.wacc != null ? `<tr><td>WACC</td><td class="dd-num">${pc(KT_VAL.resumo(s).X.W.wacc)}</td><td class="dd-num">${pc(reg.resultados.wacc)}</td><td></td></tr>` : ""}${tipo === "ppa" && reg.resultados.wara != null ? `<tr><td>WARA</td><td></td><td class="dd-num">${pc(reg.resultados.wara)}</td><td></td></tr>` : ""}</tbody></table></div></div>`;
  }
  const bloco = (tipo) => `<div class="card" style="display:flex;flex-direction:column;gap:8px"><div><div class="eyebrow">Padrão Kinsey BR</div><h3 style="margin:2px 0 0">Planilha padronizada ${tipo === "ppa" ? "do PPA" : "do valuation"} (Excel com fórmulas)</h3></div>
    <p class="sub" style="margin:0;font-size:12.5px">${tipo === "ppa" ? "" : "Modelagem completa em R$ milhões (R$ mi), com fórmulas vivas para a análise dos especialistas de Finanças. "}${tipo === "ppa" ? "Premissas, WACC, DRE projetada, capital de giro, CAC, carteira de clientes (MPEEM), marca e tecnologia (relief-from-royalty), não concorrência, força de trabalho, contingências, earn-out por cenários e Monte Carlo, WARA, alocação do preço e conferências." : "Premissas, WACC (CAPM), demonstrações históricas, DRE projetada, capital de giro em dias, FCD com sensibilidade WACC × g, múltiplos, resumo e conferências."} Já sai com o cadastro e os números do sistema; o consultor revisa no Excel e importa de volta para a conferência.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-mx="${tipo}">${tipo === "ppa" ? "Exportar planilha padronizada" : "Exportar modelagem em Excel (com fórmulas)"}</button>${D.ed() ? `<label class="btn sm">Importar planilha do consultor<input type="file" data-mi="${tipo}" accept=".xlsx,.xlsm" hidden></label>` : ""}</div></div>`;
  function bind(host, s){
    $$("[data-mx]", host).forEach(b => b.onclick = () => { toast("Gerando a planilha…"); (b.dataset.mx === "ppa" ? ppaXlsx(s) : valuationXlsx(s)).catch(e => { console.error(e); toast("Não foi possível gerar: " + (e.message || "erro")); }); });
    $$("[data-mi]", host).forEach(i => i.onchange = async () => { const fl = i.files[0]; if (!fl) return; try{ const r = await importar(s, i.dataset.mi, fl); toast(`Planilha do consultor importada: ${Object.values(r.resultados).filter(v => v != null).length} resultado(s) lidos`); renderView(); }catch(e){ console.error(e); toast(e.message || "Não foi possível ler a planilha."); } });
  }
  /* telas: aba Relatório do valuation e PPA */
  if (EXT_VIEWS.valuation){ const _v = EXT_VIEWS.valuation; EXT_VIEWS.valuation = function(){ _v.apply(this, arguments); const host = $("#valuation"), s = D.alvoSel(); if (!host || !s || !["rel", "sintese", "fcd"].includes(S.valTab) || !D.temBal(s) || host.querySelector("[data-mx]")) return;
    const card = S.valTab === "rel" ? [...host.querySelectorAll(".card")].find(c => /Relatório de valuation/.test(c.querySelector("h3")?.textContent || "")) : [...host.querySelectorAll(".card")].pop(); if (!card) return; card.insertAdjacentHTML("afterend", bloco("val") + conferencia(s, "val")); bind(host, s); }; }
  if (EXT_VIEWS.pos){ const _p = EXT_VIEWS.pos; EXT_VIEWS.pos = function(){ _p.apply(this, arguments); const host = $("#pos"), s = D.alvoSel(); if (!host || !s || host.querySelector("[data-mx]")) return; const xl = $("#ppa-xl", host); if (!xl) return;
    const card = xl.closest(".card"); if (!card) return; card.insertAdjacentHTML("afterend", bloco("ppa") + conferencia(s, "ppa")); bind(host, s); }; }
  window.KT_MODX = {valuationXlsx, ppaXlsx, importar, conferencia};
})();
