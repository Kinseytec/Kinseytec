/* ================= DEMONSTRAÇÕES FINANCEIRAS NOS RELATÓRIOS =================
   Seções comuns aos relatórios de Due Diligence, Análises financeiras e Valuation, apresentadas depois dos sumários e
   gráficos (modelos Kinsey: relatório de due diligence Mão Colorida e laudo de avaliação CPL Medicals):
   1. Demonstrações históricas: DRE por período (com margens), balanço patrimonial classificado por capital de giro,
      endividamento líquido, capex e outros ativos e passivos, e indicadores econômico-financeiros.
   2. Análises: EBITDA (reportado → ajustes → ajustado), capital de giro líquido (reportado → ajustes → normalizado, com
      prazos médios) e endividamento líquido (reportado → itens equivalentes → ajustes → normalizado).
   3. Ajustes da diligência e demonstrações pro forma (resultado e balanço pela visão do capital investido). As
      contingências ficam à parte: não entram no pro forma e são tratadas na negociação (preço, retenção, indenização).
   4. Valuation: demonstrações projetadas (DRE, balanço e fluxo de caixa livre) dos cenários moderado e otimista. */
if (window.KT_DD) (() => {
  const D = KT_DD, {div} = D;
  const R = () => window.KT_REL, T = t => R().T(t);
  const MUT = [90,101,120];
  /* R$ mil, negativos entre parênteses (padrão dos relatórios Kinsey) */
  const m = v => v == null || !isFinite(v) ? "-" : Math.abs(v) < 500 ? "-" : (v < 0 ? `(${fmt(-v / 1e3, 0)})` : fmt(v / 1e3, 0));
  const p1 = v => v == null || !isFinite(v) ? "-" : (v * 100).toFixed(1).replace(".", ",") + "%";
  const x2 = (v, d = 1) => v == null || !isFinite(v) ? "-" : v.toFixed(d).replace(".", ",") + "x";
  const dd = v => v == null || !isFinite(v) ? "-" : Math.round(v) + " dias";
  const B = t => ({t, b:true}), Bv = t => ({t, b:true, bg:[234,241,250]});
  /* histórico/realizado em cinza; projetado em azul Kinsey (padrão do laudo de avaliação Kinsey) */
  const CINZA = [89,89,89], AZUL = [0,112,192], TIT_H = [64,64,64], TIT_P = [0,112,192];
  let MODO = "h";
  const tab = (P, cols, rows, ws) => { if (rows.length <= 22) P.ensure(rows.length * 19 + 34); const w = ws || cols.map(() => 1 / cols.length);
    return P.table(cols.map((c, i) => ({t:T(c), w:w[i], hb:MODO === "p" ? (/^\d{4}H$|^Base /.test(String(c)) ? CINZA : AZUL) : null})), rows.map(r => r.map(c => c && typeof c === "object" ? {...c, t:T(c.t)} : T(c))), {head:MODO === "p" ? AZUL : CINZA}); };
  const titulo = (P, t, cor) => { P.ensure(380); P.y += 4; P.text(P.M, P.y + 11, T(t), 11, true, cor); P.y += 18; };
  const ws = n => [.34, ...Array(n).fill(.66 / n)];
  const rotP = (s, p) => { const b = s.dd.bal[p]; return b.meses != 12 ? `${p.slice(5, 7)}/${p.slice(0, 4)} (${b.meses}m)` : p.slice(0, 4); };

  function base(s, o = {}){
    const pers = D.periodos(s).slice().sort().slice(-(o.max || 5)), H = pers.map(p => { const b = s.dd.bal[p], K = D.calc(b), AJ = D.ajustes(s, p), L = o.aprovados ? AJ.filter(D.okFin) : AJ, A = D.soma(L);
      return {p, b, K, AJ, L, A, f:K.f, rot:rotP(s, p), I0:D.indic(K), I:D.indic(K, A)}; });
    return {pers, H, ult:H[H.length - 1]};
  }
  /* classificação do balanço (modelo Mão Colorida) */
  const CLS = {caixa:"Endividamento líquido", clientes:"Capital de giro", pdd:"Capital de giro", estoques:"Capital de giro", impRec:"Capital de giro", outrosAC:"Capital de giro", rlp:"Outros ativos e passivos", deposJud:"Outros ativos e passivos", mutuoAtivo:"Outros ativos e passivos",
    investimentos:"Outros ativos e passivos", imobilizado:"Capex", deprec:"Capex", intangivel:"Capex", fornecedores:"Capital de giro", empCP:"Endividamento líquido", trab:"Capital de giro", tribCP:"Capital de giro", adiantCli:"Capital de giro", outrosPC:"Capital de giro",
    empLP:"Endividamento líquido", parcTrib:"Endividamento líquido", provisoes:"Endividamento líquido", mutuoPassivo:"Endividamento líquido", outrosPNC:"Outros ativos e passivos", pl:"Patrimônio líquido"};
  const NOME = {caixa:"Caixa e equivalentes de caixa", clientes:"Contas a receber", pdd:"(-) Perdas esperadas com clientes", estoques:"Estoques", impRec:"Impostos a recuperar", outrosAC:"Outros ativos circulantes", rlp:"Realizável a longo prazo", deposJud:"Depósitos judiciais", mutuoAtivo:"Partes relacionadas (ativo)",
    investimentos:"Investimentos", imobilizado:"Imobilizado", deprec:"(-) Depreciação e amortização acumuladas", intangivel:"Intangível", fornecedores:"Fornecedores", empCP:"Empréstimos e financiamentos CP", trab:"Obrigações sociais e trabalhistas", tribCP:"Obrigações tributárias", adiantCli:"Adiantamento de clientes",
    outrosPC:"Outras contas a pagar", empLP:"Empréstimos e financiamentos LP", parcTrib:"Parcelamentos tributários", provisoes:"Provisões para contingências", mutuoPassivo:"Partes relacionadas (passivo)", outrosPNC:"Outros passivos não circulantes", pl:"Capital e reservas"};

  /* ---------------- 1. demonstrações históricas ---------------- */
  function dre(P, s, X){
    const H = X.H, v = (h, k) => h.K[k] / h.f, pc = (h, k) => p1(div(h.K[k], h.K.recLiq));
    tab(P, ["R$ mil", ...H.map(h => h.rot)], [["Meses", ...H.map(h => String(h.b.meses || 12))], ["Receita bruta", ...H.map(h => m(v(h, "recBruta")))], ["(-) Deduções da receita", ...H.map(h => m(-v(h, "deducoes")))], [B("Receita líquida"), ...H.map(h => B(m(v(h, "recLiq"))))],
      ["(-) Custos", ...H.map(h => m(-v(h, "cpv")))], [B("Lucro bruto"), ...H.map(h => B(m(v(h, "lucroBruto"))))], ["  % margem bruta", ...H.map(h => pc(h, "lucroBruto"))], ["(-) Despesas operacionais", ...H.map(h => m(-v(h, "despOp")))],
      [Bv("EBITDA reportado"), ...H.map(h => Bv(m(v(h, "ebitda"))))], ["  % margem EBITDA", ...H.map(h => pc(h, "ebitda"))], ["(-) Depreciação e amortização", ...H.map(h => m(-v(h, "da")))], ["EBIT", ...H.map(h => m(v(h, "ebit")))],
      ["(+/-) Resultado financeiro", ...H.map(h => m(v(h, "resFin")))], ["(-) IRPJ e CSLL", ...H.map(h => m(-v(h, "ir")))], [B("Lucro líquido"), ...H.map(h => B(m(v(h, "ll"))))], ["  % margem líquida", ...H.map(h => pc(h, "ll"))]], ws(H.length));
    R().par(P, "Valores do período (não anualizados). Fonte: balancetes do cadastro do projeto ou do workbook do auditor, não auditados.", {size:8, color:MUT});
  }
  function balanco(P, s, X){
    const H = X.H.slice(-3), G = (h, k) => h.K.G[k] || 0, linha = k => [NOME[k], CLS[k], ...H.map(h => m(G(h, k)))];
    const A1 = ["caixa", "clientes", "pdd", "estoques", "impRec", "outrosAC"], A2 = ["rlp", "deposJud", "mutuoAtivo", "investimentos", "imobilizado", "deprec", "intangivel"];
    const P1 = ["fornecedores", "empCP", "trab", "tribCP", "adiantCli", "outrosPC"], P2 = ["empLP", "parcTrib", "provisoes", "mutuoPassivo", "outrosPNC"];
    const tem = k => H.some(h => Math.abs(G(h, k)) >= 500), w = [.36, .2, ...Array(H.length).fill(.44 / H.length)];
    P.ensure(260); R().par(P, "Balanço patrimonial · Ativo", {size:10, bold:true});
    tab(P, ["R$ mil", "Classificação", ...H.map(h => h.rot)], [[B("Circulante"), "", ...H.map(() => "")], ...A1.filter(tem).map(linha), [B("Total do ativo circulante"), "", ...H.map(h => B(m(h.K.AC)))],
      [B("Não circulante"), "", ...H.map(() => "")], ...A2.filter(tem).map(linha), [B("Total do ativo não circulante"), "", ...H.map(h => B(m(h.K.ANC)))], [Bv("Total do ativo"), "", ...H.map(h => Bv(m(h.K.AT)))]], w);
    P.ensure(320); R().par(P, "Balanço patrimonial · Passivo e patrimônio líquido", {size:10, bold:true});
    tab(P, ["R$ mil", "Classificação", ...H.map(h => h.rot)], [[B("Circulante"), "", ...H.map(() => "")], ...P1.filter(tem).map(linha), [B("Total do passivo circulante"), "", ...H.map(h => B(m(h.K.PC)))],
      [B("Não circulante"), "", ...H.map(() => "")], ...P2.filter(tem).map(linha), [B("Total do passivo não circulante"), "", ...H.map(h => B(m(h.K.PNC)))],
      [B("Patrimônio líquido"), "", ...H.map(() => "")], ["Capital, reservas e lucros acumulados", "Patrimônio líquido", ...H.map(h => m(G(h, "pl")))], ["Resultado do período", "Patrimônio líquido", ...H.map(h => m(h.K.llPeriodo))], [B("Total do patrimônio líquido"), "", ...H.map(h => B(m(h.K.PL)))],
      [Bv("Total do passivo e patrimônio líquido"), "", ...H.map(h => Bv(m(h.K.PC + h.K.PNC + h.K.PL)))]], w);
    const dif = H.filter(h => Math.abs(h.K.AT - (h.K.PC + h.K.PNC + h.K.PL)) > Math.max(1000, Math.abs(h.K.AT) * .005));
    R().par(P, `Classificação para fins de transação: capital de giro (operacional), endividamento líquido, capex (ativo fixo) e outros ativos e passivos.${dif.length ? ` Diferença de fechamento em ${dif.map(h => h.rot).join(", ")}: conferir o balancete.` : ""}`, {size:8, color:MUT});
  }
  function indicadores(P, s, X){
    const H = X.H;
    tab(P, ["Indicador", ...H.map(h => h.rot)], [["Margem bruta", ...H.map(h => p1(h.I.mBruta))], ["Margem EBITDA ajustada", ...H.map(h => p1(h.I.mEbitda))], ["Margem líquida ajustada", ...H.map(h => p1(h.I.mLiq))],
      ["Liquidez corrente", ...H.map(h => x2(h.I.lc, 2))], ["Liquidez seca", ...H.map(h => x2(h.I.ls, 2))], ["Liquidez imediata", ...H.map(h => x2(h.I.li, 2))], ["Liquidez geral", ...H.map(h => x2(h.I.lg, 2))],
      ["Endividamento geral (passivo / ativo)", ...H.map(h => p1(h.I.endiv))], ["Dívida líquida / EBITDA ajustado", ...H.map(h => x2(h.I.dlEbitda))], ["Cobertura de juros (EBITDA / despesa financeira)", ...H.map(h => x2(h.I.cobJuros))],
      ["Retorno sobre o PL (ROE)", ...H.map(h => p1(h.I.roe))], ["Retorno sobre o ativo (ROA)", ...H.map(h => p1(h.I.roa))], ["Prazo médio de recebimento", ...H.map(h => dd(h.K.pmr))], ["Prazo médio de estocagem", ...H.map(h => dd(h.K.pme))],
      ["Prazo médio de pagamento", ...H.map(h => dd(h.K.pmp))], ["Ciclo de caixa", ...H.map(h => dd(h.K.ciclo))]], ws(H.length));
    R().par(P, "Indicadores de resultado anualizados e ajustados pelos ajustes considerados; liquidez e prazos pelos saldos de cada data.", {size:8, color:MUT});
  }

  /* ---------------- 2. análises: EBITDA, capital de giro, endividamento líquido ---------------- */
  function ebitda(P, s, X, o){
    const H = X.H, nomes = [...new Map(H.flatMap(h => h.L.filter(a => a.v.ebitda)).map(a => [a.titulo, a])).values()];
    const val = (h, t) => { const a = h.L.find(x => x.titulo === t && x.v.ebitda); return a ? a.v.ebitda / h.f : 0; };
    tab(P, ["R$ mil", ...H.map(h => h.rot)], [[B("EBITDA reportado"), ...H.map(h => B(m(h.K.ebitda / h.f)))], ...nomes.map(a => [`${a.titulo}${o.aprovados || D.okFin(a) ? "" : " *"}`, ...H.map(h => m(val(h, a.titulo)))]),
      [Bv("EBITDA ajustado"), ...H.map(h => Bv(m((h.K.ebitda + h.A.ebitda) / h.f)))], ["  % margem EBITDA ajustada", ...H.map(h => p1(div(h.K.ebitda + h.A.ebitda, h.K.recLiq)))], ["Diferença ajustado × reportado", ...H.map(h => p1(div(h.A.ebitda, Math.abs(h.K.ebitda))))]], ws(H.length));
    R().par(P, `Valores do período. ${o.aprovados ? "Ajustes com OK do consultor." : "Potenciais ajustes de due diligence; * aguardando o OK do consultor."}`, {size:8, color:MUT});
  }
  function capitalGiro(P, s, X, o){
    const h = X.ult, G = h.K.G, ap = ["clientes", "pdd", "estoques", "impRec", "outrosAC"], fo = ["fornecedores", "trab", "tribCP", "adiantCli", "outrosPC"], L = h.L.filter(a => a.v.ncg);
    const rows = [...ap.filter(k => Math.abs(G[k]) >= 500).map(k => [NOME[k], m(G[k])]), ...fo.filter(k => Math.abs(G[k]) >= 500).map(k => [NOME[k], m(-G[k])]), [B("Capital de giro reportado"), B(m(h.K.ncg))]];
    if (L.length){ rows.push([B("Potenciais ajustes de due diligence"), ""]); L.forEach(a => rows.push([`${a.titulo}${o.aprovados || D.okFin(a) ? "" : " *"}`, m(a.v.ncg)])); }
    rows.push([Bv("Capital de giro normalizado"), Bv(m(h.K.ncg + h.A.ncg))], ["  % da receita líquida anualizada", p1(div(h.K.ncg + h.A.ncg, h.K.recLiq))]);
    tab(P, [`R$ mil · ${h.rot}`, "Valor"], rows, [.7, .3]);
    const Hs = X.H; if (Hs.length > 1) tab(P, ["Capital de giro (R$ mil e dias)", ...Hs.map(x => x.rot)], [["Capital de giro reportado", ...Hs.map(x => m(x.K.ncg))], ["Capital de giro normalizado", ...Hs.map(x => m(x.K.ncg + x.A.ncg))], ["Prazo médio de recebimento", ...Hs.map(x => dd(x.K.pmr))], ["Prazo médio de estocagem", ...Hs.map(x => dd(x.K.pme))], ["Prazo médio de pagamento", ...Hs.map(x => dd(x.K.pmp))], ["Ciclo de caixa", ...Hs.map(x => dd(x.K.ciclo))]], ws(Hs.length));
  }
  function endividamento(P, s, X, o){
    const h = X.ult, G = h.K.G, L = h.L.filter(a => a.v.divida);
    const rows = [["Caixa e equivalentes de caixa", m(G.caixa)], ["(-) Empréstimos e financiamentos CP", m(-G.empCP)], ["(-) Empréstimos e financiamentos LP", m(-G.empLP)], [B("Caixa (dívida) líquida reportada"), B(m(-h.K.dl))], [B("Itens equivalentes a dívida"), ""]];
    [["parcTrib", "(-) Parcelamentos tributários"], ["mutuoPassivo", "(-) Partes relacionadas (passivo)"], ["provisoes", "(-) Provisões para contingências registradas"]].forEach(([k, r]) => { if (Math.abs(G[k]) >= 500) rows.push([r, m(-G[k])]); });
    if (L.length){ rows.push([B("Potenciais ajustes de due diligence"), ""]); L.forEach(a => rows.push([`${a.titulo}${o.aprovados || D.okFin(a) ? "" : " *"}`, m(-a.v.divida)])); }
    const eq = (G.parcTrib || 0) + (G.mutuoPassivo || 0) + (G.provisoes || 0), norm = h.K.dl + eq + h.A.divida;
    rows.push([Bv("Caixa (dívida) líquida normalizada"), Bv(m(-norm))], ["Dívida líquida normalizada / EBITDA ajustado anualizado", x2(div(norm, h.K.ebitda + h.A.ebitda))]);
    tab(P, [`R$ mil · ${h.rot}`, "Valor"], rows, [.7, .3]);
    R().par(P, "Valores positivos indicam caixa líquido; entre parênteses, dívida líquida. Contingências não registradas ficam fora desta conta e aparecem à parte.", {size:8, color:MUT});
    return norm;
  }

  /* ---------------- 3. ajustes e pro forma; contingências à parte ---------------- */
  function proForma(P, s, X, o){
    const h = X.ult, K = h.K, A = h.A, f = h.f, Lt = h.AJ;
    if (Lt.length) tab(P, ["Ajuste da diligência", "Área", "EBITDA", "Capital de giro", "Dívida", "PL", "Situação"], Lt.map(a => [a.titulo, D.areaNome(a.area), m(a.v.ebitda / f), m(a.v.ncg), m(a.v.divida), m(a.v.pl), D.okFin(a) ? (D.okVal(a) ? "OK análises e valuation" : "OK nas análises") : "proposto"]), [.3, .12, .1, .11, .1, .1, .17]);
    else R().par(P, "Nenhum ajuste de diligência apurado até a emissão.", {size:9});
    P.ensure(170); R().par(P, `Demonstração do resultado pro forma · ${h.rot}`, {size:10, bold:true});
    const ll = v => v / f;
    tab(P, ["R$ mil", "Reportado", "Ajustes", "Pro forma"], [["Receita líquida", m(ll(K.recLiq)), "-", m(ll(K.recLiq))], ["EBITDA", m(ll(K.ebitda)), m(ll(A.ebitda)), B(m(ll(K.ebitda + A.ebitda)))], ["  % margem EBITDA", p1(div(K.ebitda, K.recLiq)), "", p1(div(K.ebitda + A.ebitda, K.recLiq))],
      ["(-) Depreciação e amortização", m(-ll(K.da)), "-", m(-ll(K.da))], ["(+/-) Resultado financeiro e IR", m(ll(K.resFin - K.ir)), "-", m(ll(K.resFin - K.ir))], [Bv("Lucro líquido"), Bv(m(ll(K.ll))), Bv(m(ll(A.lucro))), Bv(m(ll(K.ll + A.lucro)))]], [.4, .2, .2, .2]);
    P.ensure(190); R().par(P, `Balanço patrimonial pro forma · ${h.rot} (visão do capital investido)`, {size:10, bold:true});
    const G = K.G, fixo = (G.imobilizado || 0) + (G.deprec || 0) + (G.intangivel || 0), eqv = (G.parcTrib || 0) + (G.mutuoPassivo || 0) + (G.provisoes || 0), dl = K.dl + eqv, ci = dl + K.PL, outros = ci - K.ncg - fixo;
    const dNcg = A.ncg, dDiv = A.divida, dPl = A.pl, dOut = dDiv + dPl - dNcg;
    tab(P, ["R$ mil", "Reportado", "Ajustes", "Pro forma"], [["Capital de giro líquido", m(K.ncg), m(dNcg), m(K.ncg + dNcg)], ["Ativo fixo (imobilizado e intangível líquidos)", m(fixo), "-", m(fixo)], ["Outros ativos e passivos líquidos", m(outros), m(dOut), m(outros + dOut)],
      [Bv("Capital investido"), Bv(m(ci)), Bv(m(dNcg + dOut)), Bv(m(ci + dNcg + dOut))], ["Dívida líquida (com itens equivalentes)", m(dl), m(dDiv), m(dl + dDiv)], ["Patrimônio líquido", m(K.PL), m(dPl), m(K.PL + dPl)], [Bv("Financiamento do capital investido"), Bv(m(dl + K.PL)), Bv(m(dDiv + dPl)), Bv(m(dl + K.PL + dDiv + dPl))]], [.4, .2, .2, .2]);
    R().par(P, `${o.aprovados ? "Pro forma com os ajustes que receberam o OK do consultor." : "Pro forma com os potenciais ajustes de due diligence (propostos e aprovados)."} Ajustes contábeis apenas; contingências não entram no pro forma.`, {size:8, color:MUT});
    /* contingências à parte */
    const EX = window.KT_EXP ? KT_EXP.lista(s) : [], ano = +String(h.p).slice(0, 4) || new Date().getFullYear();
    P.ensure(Math.min(500, (window.KT_EXP ? KT_EXP.lista(s).length : 0) * 26 + 90)); R().par(P, "Contingências e exposições (tratadas à parte, fora do pro forma)", {size:10, bold:true});
    if (EX.length){ const C = EX.map(e => ({e, c:KT_EXP.calc(e, ano)})), sm = k => C.reduce((a, x) => a + (x.c[k] || 0), 0), q = v => v == null ? "NQ" : fmt(v / 1e3, 0);
      tab(P, ["Contingência", "Área", "Avaliação", "Mínimo", "Máximo", "Qualificado"], [...C.map(({e, c}) => [e.titulo, e.area || "", e.aval || "", q(c.min), q(c.max), q(c.qual)]), [B("Total"), "", "", B(q(sm("min"))), B(q(sm("max"))), B(q(sm("qual")))]], [.38, .12, .12, .12, .13, .13]);
      R().par(P, "R$ mil. NQ = não quantificado. As contingências não alteram o resultado nem o balanço pro forma: são tratadas na negociação (ajuste de preço, retenção, conta garantia ou cláusula de indenização no SPA).", {size:8, color:MUT}); }
    else R().par(P, "Nenhuma contingência registrada até a emissão.", {size:9});
  }

  /* bloco completo (depois dos sumários e gráficos) */
  function historico(P, s, o = {}){
    const X = base(s, o); if (!X.H.length) return false; const sec = o.sec || (t => { P.page(); P.h2(T(t)); }), sub = t => titulo(P, t, TIT_H); MODO = "h";
    sec(o.t1 || "Demonstrações financeiras históricas");
    sub("Demonstração do resultado"); dre(P, s, X);
    sub("Balanço patrimonial"); balanco(P, s, X);
    sub("Indicadores econômico-financeiros"); indicadores(P, s, X);
    sec(o.t2 || "Análise do EBITDA, do capital de giro e do endividamento líquido");
    sub("EBITDA reportado e ajustado"); ebitda(P, s, X, o);
    sub("Capital de giro líquido"); capitalGiro(P, s, X, o);
    sub("Endividamento líquido"); endividamento(P, s, X, o);
    sec(o.t3 || "Ajustes da diligência e demonstrações pro forma");
    proForma(P, s, X, o);
    return true;
  }
  /* versão curta para os resumos */
  function resumo(P, s, o = {}){
    const X = base(s, o); if (!X.H.length) return; const h = X.ult, K = h.K, A = h.A, f = h.f;
    P.ensure(140); P.h2(T("Demonstração pro forma (resumo)"));
    tab(P, ["R$ mil · " + h.rot, "Reportado", "Ajustes", "Pro forma"], [["Receita líquida", m(K.recLiq / f), "-", m(K.recLiq / f)], ["EBITDA", m(K.ebitda / f), m(A.ebitda / f), B(m((K.ebitda + A.ebitda) / f))], ["Lucro líquido", m(K.ll / f), m(A.lucro / f), m((K.ll + A.lucro) / f)],
      ["Capital de giro", m(K.ncg), m(A.ncg), m(K.ncg + A.ncg)], ["Dívida líquida", m(K.dl), m(A.divida), m(K.dl + A.divida)], ["Patrimônio líquido", m(K.PL), m(A.pl), m(K.PL + A.pl)]], [.4, .2, .2, .2]);
    R().par(P, "Contingências tratadas à parte, fora do pro forma.", {size:8, color:MUT});
  }

  /* ---------------- 4. valuation: demonstrações projetadas ---------------- */
  function projetadas(P, s, Rz, o = {}){
    const X = Rz.X, W = X.W, sub = t => { titulo(P, t, TIT_P); }; MODO = "p";
    const det = c => { let rlAnt = X.bp.rl, ncg = X.bp.K.ncg, fixo = (X.bp.K.G.imobilizado || 0) + (X.bp.K.G.deprec || 0) + (X.bp.K.G.intangivel || 0), dl = X.dl, pl = X.bp.K.PL;
      return c.anos.map(a => { const da = a.rl * X.capex, ebit = a.eb - da, ir = Math.max(0, ebit) * W.t, capex = a.rl * X.capex, dncg = (a.rl - rlAnt) * X.ncgp, fcl = a.eb - ir - capex - dncg, ll = ebit - ir;
        ncg += dncg; dl -= fcl; pl += ll; rlAnt = a.rl; const fd = 1 / Math.pow(1 + c.w, a.t); return {...a, da, ebit, ir, capex, dncg, fcl, ll, ncg, fixo, dl, pl, fd, vp:fcl * fd}; }); };
    const hist = X.H.anuais.slice(-2);
    [["mod", "moderado (crescimento histórico)", Rz.mod.c], ["ot", "otimista (premissas justificadas)", Rz.ot.c]].forEach(([k, rot, c], i) => { if (i === 1 && o.soModerado) return; const A = det(c);
      sub(`Demonstração do resultado projetada · cenário ${rot}`);
      tab(P, ["R$ mil", ...hist.map(h => h.ano + "H"), ...A.map(a => a.y + "E")], [["Receita líquida", ...hist.map(h => m(h.rl)), ...A.map(a => m(a.rl))], ["  % crescimento", ...hist.map(() => ""), ...A.map(a => p1(a.cres))],
        [B("EBITDA"), ...hist.map(h => B(m(h.eb))), ...A.map(a => B(m(a.eb)))], ["  % margem EBITDA", ...hist.map(h => p1(h.mg)), ...A.map(a => p1(a.mg))], ["(-) Depreciação e amortização", ...hist.map(h => m(-h.K.da)), ...A.map(a => m(-a.da))],
        ["EBIT", ...hist.map(h => m(h.K.ebit + (h.eb - h.ebRep))), ...A.map(a => m(a.ebit))], ["(-) IRPJ e CSLL", ...hist.map(h => m(-h.K.ir)), ...A.map(a => m(-a.ir))], [B("Lucro líquido operacional"), ...hist.map(h => B(m(h.K.ll))), ...A.map(a => B(m(a.ll)))]], ws(hist.length + A.length));
      sub(`Balanço patrimonial projetado · cenário ${rot} (capital investido)`);
      tab(P, ["R$ mil", "Base " + X.perBase, ...A.map(a => a.y + "E")], [["Capital de giro líquido", m(X.bp.K.ncg), ...A.map(a => m(a.ncg))], ["Ativo fixo líquido", m(A[0]?.fixo), ...A.map(a => m(a.fixo))], [Bv("Capital investido operacional"), Bv(m(X.bp.K.ncg + (A[0]?.fixo || 0))), ...A.map(a => Bv(m(a.ncg + a.fixo)))],
        ["Dívida líquida (caixa líquido entre parênteses)", m(X.dl), ...A.map(a => m(a.dl))], ["Patrimônio líquido", m(X.bp.K.PL), ...A.map(a => m(a.pl))]], ws(1 + A.length));
      sub(`Fluxo de caixa livre projetado · cenário ${rot}`);
      tab(P, ["R$ mil", ...A.map(a => a.y + "E"), "Perpetuidade"], [[B("EBITDA"), ...A.map(a => B(m(a.eb))), ""], ["(-) IRPJ e CSLL sobre o EBIT", ...A.map(a => m(-a.ir)), ""], ["(-) Investimentos (capex)", ...A.map(a => m(-a.capex)), ""], ["(-) Variação do capital de giro", ...A.map(a => m(-a.dncg)), ""],
        [Bv("Fluxo de caixa livre"), ...A.map(a => Bv(m(a.fcl))), Bv(m(A[4] ? A[4].fcl * (1 + c.g) : 0))], ["Fator de desconto", ...A.map(a => a.fd.toFixed(3).replace(".", ",")), ""], ["Valor presente", ...A.map(a => m(a.vp)), m(c.vtv)]], ws(A.length + 1));
      tab(P, ["Valor", "R$ mil"], [["Soma do valor presente dos fluxos", m(c.ev - c.vtv)], ["Valor presente da perpetuidade", m(c.vtv)], [Bv("Enterprise value"), Bv(m(c.ev))], ["(-) Dívida líquida ajustada", m(-X.dl)], [Bv("Equity value"), Bv(m(c.eq))],
        ["WACC · crescimento na perpetuidade", `${p1(c.w)} · ${p1(c.g)}`], ["EV / EBITDA implícito", x2(c.mult)]], [.6, .4]); });
    MODO = "h";
    R().par(P, "Período histórico/realizado com cabeçalho em cinza; projetado em azul.", {size:8, color:MUT});
    R().par(P, "Projeção sem financiamento (fluxo de caixa livre para a firma): o caixa gerado reduz a dívida líquida e o lucro operacional líquido aumenta o patrimônio líquido. Capex igual à depreciação; capital de giro pela relação histórica com a receita.", {size:8, color:MUT});
  }

  window.KT_DEM = {historico, resumo, projetadas, base};
})();
