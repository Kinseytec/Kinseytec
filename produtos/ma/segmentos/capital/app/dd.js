/* ================= KINSEY CAPITAL · DUE DILIGENCE, ANÁLISES FINANCEIRAS E VALUATION =================
   Só entra na construção do segmento M&A (produtos/ma/segmentos/capital/app/dd.js).
   Fluxo: balancete importado na Due Diligence → procedimentos automáticos (contábil, financeira, trabalhista,
   tributária) e mínimos (consultores) → ajustes propostos → OK do consultor nas Análises financeiras (indicadores)
   → OK do consultor no Valuation. Nenhum ajuste muda indicador ou valuation sem o OK correspondente.
   Dados no próprio target: s.dd = {bal:{periodo:{...}}, aj:{id:{...}}, proc:{id:{...}}, cons:{area:nome}, val:{...}} */
if (typeof MA_MODELOS !== "undefined") (() => {
  const AREAS = [["contabil","Contábil"],["financeira","Financeira"],["trabalhista","Trabalhista"],["tributaria","Tributária"]];
  const areaNome = k => (AREAS.find(a => a[0] === k) || [k, k])[1];
  const EF = [["ebitda","EBITDA"],["divida","Dívida líquida"],["ncg","Capital de giro"],["pl","Patrimônio líquido"],["lucro","Lucro líquido"]];
  const mi = (v, d = 1) => v == null || !isFinite(v) ? "—" : (v < 0 ? "−" : "") + "R$ " + fmt(Math.abs(v) / 1e6, d) + " mi";
  const mil = v => v == null || !isFinite(v) ? "—" : (v < 0 ? "−" : "+") + "R$ " + fmt(Math.abs(v) / 1e3, 0) + " mil";
  const pc = (v, d = 1) => v == null || !isFinite(v) ? "—" : fmt(v * 100, d) + "%";
  const xx = (v, d = 1) => v == null || !isFinite(v) ? "—" : fmt(v, d) + "×";
  const dias = v => v == null || !isFinite(v) ? "—" : fmt(v, 0) + " dias";
  const div = (a, b) => b ? a / b : null;
  const norm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const ed = () => Store.me.canEdit !== false;
  const up = (s, patch) => save(Store.update("suppliers", s.id, patch));
  const targets = () => S.suppliers.filter(s => s.nivel === "N3").sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt"));
  const temBal = s => Object.values(s?.dd?.bal || {}).some(b => b && b.contas?.length);
  const periodos = s => Object.keys(s?.dd?.bal || {}).filter(k => s.dd.bal[k]?.contas?.length).sort().reverse();

  /* ---------------- CLASSIFICAÇÃO DO PLANO DE CONTAS ---------------- */
  const GRUPOS = {
    caixa:["Caixa e aplicações","A","AC"], clientes:["Clientes","A","AC"], pdd:["(−) Perdas esperadas com clientes","A","AC"], estoques:["Estoques","A","AC"], impRec:["Impostos a recuperar","A","AC"], outrosAC:["Outros ativos circulantes","A","AC"],
    rlp:["Realizável a longo prazo","A","ANC"], deposJud:["Depósitos judiciais","A","ANC"], mutuoAtivo:["Mútuos e partes relacionadas (ativo)","A","ANC"], investimentos:["Investimentos","A","ANC"], imobilizado:["Imobilizado","A","ANC"], deprec:["(−) Depreciação e amortização acumuladas","A","ANC"], intangivel:["Intangível","A","ANC"],
    fornecedores:["Fornecedores","P","PC"], empCP:["Empréstimos e financiamentos (CP)","P","PC"], trab:["Obrigações trabalhistas","P","PC"], tribCP:["Obrigações tributárias","P","PC"], adiantCli:["Adiantamentos de clientes","P","PC"], outrosPC:["Outros passivos circulantes","P","PC"],
    empLP:["Empréstimos e financiamentos (LP)","P","PNC"], parcTrib:["Parcelamentos tributários","P","PNC"], provisoes:["Provisões para contingências","P","PNC"], mutuoPassivo:["Mútuos e partes relacionadas (passivo)","P","PNC"], outrosPNC:["Outros passivos não circulantes","P","PNC"],
    pl:["Patrimônio líquido","P","PL"],
    recBruta:["Receita bruta","R","DRE"], deducoes:["(−) Deduções da receita","D","DRE"], cpv:["Custo dos produtos e serviços","D","DRE"], pessoal:["Despesas com pessoal","D","DRE"], prolabore:["Pró-labore","D","DRE"], adm:["Despesas administrativas e gerais","D","DRE"],
    aluguel:["Aluguéis e arrendamentos","D","DRE"], vendas:["Despesas comerciais","D","DRE"], outrasOp:["Outras receitas e despesas operacionais","D","DRE"], naoRec:["Itens não recorrentes","D","DRE"], da:["Depreciação e amortização","D","DRE"],
    recFin:["Receitas financeiras","R","DRE"], despFin:["Despesas financeiras","D","DRE"], ir:["IRPJ e CSLL","D","DRE"]
  };
  const sec = c => String(c || "").replace(/\D/g, "")[0] || "";
  const sub = c => { const p = String(c || "").split(/[.\-\s\/]/).filter(Boolean); if (p.length > 1) return p[0][0] + "." + p[1][0]; const d = String(c || "").replace(/\D/g, ""); return d.length > 1 ? d[0] + "." + d[1] : d; };
  function classifica(cod, desc){
    const t = norm(desc), s = sec(cod), sb = sub(cod), h = re => re.test(t);
    let S1 = s;
    if (!S1) S1 = h(/receita|custo|despesa|deducao|juros|irpj|csll|resultado/) ? "3" : h(/fornecedor|emprestim|a pagar|a recolher|capital social|reserva|lucros acum|parcelament|provis.*conting/) ? "2" : "1";
    if (S1 === "1"){
      if (h(/acumulad/) && h(/deprecia|amortiza|exaust/)) return "deprec";
      if (h(/(provis|perda|ajuste).*(devedor|duvidos|credit|liquidacao|esperad)|pcld|pecld|\bpdd\b/)) return "pdd";
      if (h(/caixa|banco|aplicac|equivalente|numerario|conta movimento/)) return "caixa";
      if (h(/client|duplicatas a receber|contas a receber|titulos a receber/)) return "clientes";
      if (h(/estoque|mercadoria|materia.prima|produtos? acabad|em elaboracao|embalage|almoxarifado/)) return "estoques";
      if (h(/a recuperar|a compensar|credito.*(icms|pis|cofins|ipi|irpj|csll)/)) return "impRec";
      if (h(/mutuo|socio|partes relacionadas|coligad|controlad/)) return "mutuoAtivo";
      if (h(/deposito.*judic|judicia/)) return "deposJud";
      if (h(/intangiv|software|marca|patente|agio|licenc|direito de uso/)) return "intangivel";
      if (h(/imobiliz|maquina|equipament|edifica|imove|veiculo|movei|terreno|instalac|benfeitor|computador|construc/)) return "imobilizado";
      if (h(/investiment|participac/) && sb !== "1.1") return "investimentos";
      return sb === "1.1" ? "outrosAC" : "rlp";
    }
    if (S1 === "2"){
      if (h(/capital social|capital subscrito|capital integraliz|reserva|lucros? acumulad|prejuizos? acumulad|patrimonio|ajuste de avaliacao|tesouraria|lucros a destinar|resultado do exercicio/)) return "pl";
      if (h(/parcelament|refis|\bpert\b|transacao tribut/)) return "parcTrib";
      if (h(/emprestim|financiament|debentur|capital de giro|leasing|cedula|\bccb\b|bndes|finame|nota promissoria/)) return sb === "2.2" || h(/longo prazo|\blp\b/) ? "empLP" : "empCP";
      if (h(/fornecedor/)) return "fornecedores";
      if (h(/conting|processo|provis.*(trabalh|civel|fiscal|tribut)/)) return "provisoes";
      if (h(/mutuo|socio|partes relacionadas/)) return sb === "2.1" ? "outrosPC" : "mutuoPassivo";
      if (h(/salari|ferias|13|decimo|inss|fgts|rescis|pro.labore|encargos sociais|folha|ordenado/)) return "trab";
      if (h(/icms|\bpis\b|cofins|\biss\b|\bipi\b|irpj|csll|imposto|tribut|simples nacional|irrf|\bdas\b/)) return "tribCP";
      if (h(/adiantamento.*client|client.*adiantament/)) return "adiantCli";
      return sb === "2.1" ? "outrosPC" : sb === "2.2" ? "outrosPNC" : "pl";
    }
    if (h(/deduc|devoluc|abatiment|cancelament|(impostos?|tributos?) (sobre|incidentes)|\b(icms|pis|cofins|iss|ipi|simples nacional)\b.*(venda|fatur|servic|receita)|^\(-\)\s*(icms|pis|cofins|iss|ipi|simples)\b/)) return "deducoes";
    if (h(/(receita|rendimento|ganho)s?.*(financeir|aplicac)|juros (ativos|recebidos)|variacao cambial ativa|descontos obtidos/)) return "recFin";
    if (h(/irpj|csll|imposto de renda|contribuicao social sobre o lucro/)) return "ir";
    if (h(/venda de (imobiliz|ativo)|alienacao|ganho de capital|indeniza|baixa de imobiliz|nao recorrent|eventua|extraordinar/)) return "naoRec";
    if (h(/outras (receitas|despesas)/)) return "outrasOp";
    if (h(/receita|faturamento|vendas? de (produto|mercador|servic)|prestacao de servic/) && !h(/despesa|custo/)) return "recBruta";
    if (h(/custo|\bcpv\b|\bcmv\b|\bcsp\b/)) return "cpv";
    if (h(/deprecia|amortiza|exaust/)) return "da";
    if (h(/financeir|juros|\biof\b|tarifa banc|variacao cambial passiva|descontos concedidos/)) return "despFin";
    if (h(/pro.labore|retirada.*socio|honorarios? da diretoria|remuneracao.*(socio|administrador)/)) return "prolabore";
    if (h(/aluguel|alugueis|locacao|arrendamento/)) return "aluguel";
    if (h(/salari|pessoal|encargo|ferias|13|inss|fgts|beneficio|vale.(transporte|refeicao|alimentacao)|\bplr\b|ordenado|folha/)) return "pessoal";
    if (h(/venda|comerci|frete|comiss|marketing|publicidade|propaganda/)) return "vendas";
    return "adm";
  }
  /* valor do grupo no sentido natural (ativo e despesa: devedor; passivo, PL e receita: credor) */
  const C = b => (b.contas || []).map(c => c[3] && GRUPOS[c[3]] ? c : [c[0], c[1], c[2], classifica(c[0], c[1])]);
  const natural = (g, saldo) => ["P","R"].includes(GRUPOS[g]?.[1]) ? -saldo : saldo;

  /* ---------------- LEITURA DO BALANCETE ---------------- */
  function numero(v){
    let s = String(v ?? "").trim(); if (!s) return null;
    let dc = ""; const m = s.match(/\s*([DC])\s*$/i); if (m){ dc = m[1].toUpperCase(); s = s.slice(0, m.index).trim(); }
    let neg = /^\(.*\)$/.test(s) || /^-/.test(s) || /-$/.test(s); s = s.replace(/[()R$\s-]/g, "");
    if (!s || !/\d/.test(s)) return null;
    const lc = s.lastIndexOf(","), ld = s.lastIndexOf(".");
    if (lc > -1 && ld > -1) s = lc > ld ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (lc > -1) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    const n = parseFloat(s); if (!isFinite(n)) return null;
    return {v: neg ? -n : n, dc};
  }
  function lerTabela(rows){
    rows = rows.map(r => (r || []).map(c => String(c ?? "").trim())).filter(r => r.some(Boolean));
    const isCod = c => /^\d[\d.\-\/]*$/.test(c) && c.replace(/\D/g, "").length >= 1;
    let hi = rows.slice(0, 20).findIndex(r => r.some(c => /^(conta|codigo|cod\.?|classifica|reduzid)/i.test(norm(c))) && r.some(c => /descri|nome|titulo|historico/i.test(norm(c))));
    let ci = {cod:-1, desc:-1, saldo:-1, dc:-1, deb:-1, cred:-1, ini:-1};
    if (hi > -1){
      const H = rows[hi].map(norm);
      H.forEach((h, i) => {
        if (ci.cod < 0 && /^(conta|codigo|cod\.?|classifica)/.test(h) && !/descri/.test(h)) ci.cod = i;
        if (ci.desc < 0 && /descri|nome|titulo|historico/.test(h)) ci.desc = i;
        if (/saldo (final|atual)/.test(h)) ci.saldo = i;
        if (/saldo (anterior|inicial)/.test(h)) ci.ini = i;
        if (/^debito|debitos/.test(h)) ci.deb = i;
        if (/^credito|creditos/.test(h)) ci.cred = i;
        if (/^d\/?c$|^natureza$|^dc$/.test(h)) ci.dc = i; });
      if (ci.saldo < 0){ const ss = H.map((h, i) => /saldo/.test(h) && i !== ci.ini ? i : -1).filter(i => i > -1); if (ss.length) ci.saldo = ss[ss.length - 1]; }
      if (ci.cod < 0) ci.cod = rows[hi + 1]?.findIndex(isCod) ?? 0;
    } else {
      const amostra = rows.slice(0, 30).filter(r => r.some(isCod));
      ci.cod = amostra.length ? amostra[0].findIndex(isCod) : 0; ci.desc = ci.cod + 1;
      const nums = amostra[0] ? amostra[0].map((c, i) => numero(c) && i > ci.desc ? i : -1).filter(i => i > -1) : []; ci.saldo = nums[nums.length - 1] ?? -1;
    }
    const corpo = rows.slice(hi + 1), out = [];
    corpo.forEach(r => {
      const cod = r[ci.cod] || "", desc = r[ci.desc] || ""; if (!desc && !cod) return; if (!isCod(cod)) return;
      let n = ci.saldo > -1 ? numero(r[ci.saldo]) : null;
      if (n && !n.dc && ci.dc > -1 && /^[DC]$/i.test(r[ci.dc] || "")) n.dc = r[ci.dc].toUpperCase();
      if (n && !n.dc && ci.saldo > -1 && /^[DC]$/i.test(r[ci.saldo + 1] || "")) n.dc = r[ci.saldo + 1].toUpperCase();
      if (!n && ci.deb > -1 && ci.cred > -1){ const a = numero(r[ci.ini])?.v || 0, d = numero(r[ci.deb])?.v || 0, c = numero(r[ci.cred])?.v || 0; n = {v: a + d - c, dc: "S"}; }
      if (!n) return; out.push({cod, desc, n});
    });
    if (!out.length) throw new Error("Não encontrei contas com código e saldo. Confira se a planilha tem as colunas conta, descrição e saldo final.");
    /* só contas analíticas (sem as sintéticas, que somam as de baixo) */
    const cods = out.map(o => o.cod);
    const folhas = out.filter(o => !cods.some(c => c !== o.cod && c.length > o.cod.length && c.startsWith(o.cod) && (/[.\-]/.test(o.cod) ? /[.\-]/.test(c[o.cod.length]) : true)));
    const temSinal = folhas.some(o => o.n.v < 0) || folhas.some(o => o.n.dc);
    return folhas.map(o => {
      const g = classifica(o.cod, o.desc); let v = o.n.v;
      if (o.n.dc === "C") v = -Math.abs(v); else if (o.n.dc === "D") v = Math.abs(v);
      else if (!temSinal){ const contra = ["deprec","pdd"].includes(g) || /^\(-\)/.test(o.desc); const credor = ["P","R"].includes(GRUPOS[g][1]);
        v = Math.abs(v) * ((credor ? -1 : 1) * (contra ? -1 : 1)); if (["naoRec","outrasOp"].includes(g) && /receita|ganho/.test(norm(o.desc))) v = -Math.abs(o.n.v); }
      return [o.cod, o.desc, Math.round(v * 100) / 100, g];
    });
  }
  async function lerArquivo(f){
    const n = f.name.toLowerCase(), buf = await f.arrayBuffer();
    if (/\.xlsx$|\.xlsm$/.test(n)) return lerTabela(await IMP.lerXLSX(buf));
    if (/\.ods$/.test(n)) return lerTabela(await IMP.lerODS(buf));
    if (/\.xls$/.test(n)) throw new Error("Arquivo .xls antigo: salve como .xlsx ou CSV e importe de novo.");
    let t = new TextDecoder("utf-8").decode(buf); if (t.includes("�")) t = new TextDecoder("latin1").decode(buf);
    return lerTabela(csv(t));
  }
  function csv(t){
    const ls = t.split(/\r?\n/).filter(l => l.trim()); if (!ls.length) return [];
    const sep = ["\t", ";", "|", ","].map(c => [c, ls.slice(0, 10).reduce((a, l) => a + l.split(c).length - 1, 0)]).sort((a, b) => b[1] - a[1])[0][0];
    return ls.map(l => { const out = []; let cur = "", q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === sep && !q){ out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; });
  }

  /* ---------------- CÁLCULOS ---------------- */
  function calc(b){
    const G = Object.fromEntries(Object.keys(GRUPOS).map(k => [k, 0])); let soma = 0;
    C(b).forEach(([, , v, g]) => { if (!GRUPOS[g]) return; G[g] += natural(g, v); soma += v; });
    const f = 12 / (+b.meses || 12), K = {G, f, soma};
    K.recBruta = G.recBruta * f; K.deducoes = G.deducoes * f; K.recLiq = K.recBruta - K.deducoes; K.cpv = G.cpv * f; K.lucroBruto = K.recLiq - K.cpv;
    K.despOp = (G.pessoal + G.prolabore + G.adm + G.aluguel + G.vendas + G.outrasOp + G.naoRec) * f;
    K.ebitda = K.lucroBruto - K.despOp; K.da = G.da * f; K.ebit = K.ebitda - K.da; K.resFin = (G.recFin - G.despFin) * f; K.despFin = G.despFin * f;
    K.lair = K.ebit + K.resFin; K.ir = G.ir * f; K.ll = K.lair - K.ir;
    const s = ks => ks.reduce((a, k) => a + G[k], 0);
    K.caixa = G.caixa; K.AC = s(["caixa","clientes","pdd","estoques","impRec","outrosAC"]); K.ANC = s(["rlp","deposJud","mutuoAtivo","investimentos","imobilizado","deprec","intangivel"]); K.AT = K.AC + K.ANC;
    K.PC = s(["fornecedores","empCP","trab","tribCP","adiantCli","outrosPC"]); K.PNC = s(["empLP","parcTrib","provisoes","mutuoPassivo","outrosPNC"]);
    K.llPeriodo = (G.recBruta - G.deducoes - G.cpv - G.pessoal - G.prolabore - G.adm - G.aluguel - G.vendas - G.outrasOp - G.naoRec - G.da + G.recFin - G.despFin - G.ir);
    K.PL = G.pl + K.llPeriodo;
    K.fecha = Math.abs(soma) <= Math.max(1, Math.abs(K.AT) * .001);
    K.divBruta = G.empCP + G.empLP; K.dl = K.divBruta - K.caixa;
    K.ncg = (G.clientes + G.pdd + G.estoques + G.impRec + G.outrosAC) - (G.fornecedores + G.trab + G.tribCP + G.adiantCli + G.outrosPC);
    K.pmr = div(G.clientes, K.recBruta) * 365; K.pme = div(G.estoques, K.cpv) * 365; K.pmp = div(G.fornecedores, K.cpv) * 365;
    K.ciclo = (K.pmr || 0) + (K.pme || 0) - (K.pmp || 0);
    return K;
  }
  function indic(K, A){ /* A = soma dos efeitos aprovados (anuais) */
    A = A || {ebitda:0, divida:0, ncg:0, pl:0, lucro:0};
    const e = K.ebitda + A.ebitda, dl = K.dl + A.divida, pl = K.PL + A.pl, ll = K.ll + A.lucro, ncg = K.ncg + A.ncg;
    return {ebitda:e, dl, pl, ll, ncg, mBruta:div(K.lucroBruto, K.recLiq), mEbitda:div(e, K.recLiq), mLiq:div(ll, K.recLiq), dlEbitda:div(dl, e), cobJuros:div(e, K.despFin),
      lc:div(K.AC, K.PC), ls:div(K.AC - K.G.estoques, K.PC), li:div(K.caixa, K.PC), lg:div(K.AC + K.G.rlp + K.G.deposJud + K.G.mutuoAtivo, K.PC + K.PNC),
      endiv:div(K.PC + K.PNC + A.divida, K.AT), compos:div(K.PC, K.PC + K.PNC), roe:div(ll, pl), roa:div(ll, K.AT), ncgRec:div(ncg, K.recLiq)};
  }

  /* ---------------- PROCEDIMENTOS AUTOMÁTICOS ---------------- */
  const contas = (b, re, gs) => C(b).filter(([c, d, v, g]) => (!gs || gs.includes(g)) && (!re || re.test(norm(d))));
  const PROCS = [
    {id:"c_fech", area:"contabil", t:"Balancete fecha (débitos = créditos)", n:"NBC TG Estrutura Conceitual", f:(K) => K.fecha ? {st:"ok", txt:"Débitos e créditos conferem."} : {st:"achado", txt:`Diferença de ${mi(K.soma, 2)} entre débitos e créditos. Peça o balancete fechado.`}},
    {id:"c_trans", area:"contabil", t:"Contas transitórias ou a classificar", n:"NBC TG 26 (CPC 26)", f:(K, b) => { const L = contas(b, /classificar|transit|diversos|pendente|a identificar/).filter(c => Math.abs(c[2]) > Math.abs(K.AT) * .005);
      return L.length ? {st:"achado", txt:`${L.length} conta(s) relevante(s): ${L.map(c => `${c[1]} (${mi(Math.abs(c[2]))})`).join("; ")}. Pedir a composição e reclassificar.`} : {st:"ok", txt:"Sem saldos relevantes em contas transitórias."}; }},
    {id:"c_inv", area:"contabil", t:"Saldos com natureza invertida", n:"NBC TG 26 (CPC 26)", f:(K, b) => { const L = C(b).filter(([c, d, v, g]) => !["deprec","pdd","deducoes","naoRec","outrasOp","pl"].includes(g) && !/^\(-\)/.test(d) && natural(g, v) < -Math.max(1000, Math.abs(K.AT) * .001));
      return L.length ? {st:"achado", txt:`${L.length} conta(s) com saldo contrário à natureza: ${L.slice(0, 4).map(c => c[1]).join("; ")}${L.length > 4 ? "…" : ""}.`} : {st:"ok", txt:"Nenhum saldo invertido relevante."}; }},
    {id:"c_dep", area:"contabil", t:"Depreciação do imobilizado", n:"CPC 27", f:(K) => { const im = K.G.imobilizado; if (!im) return {st:"na", txt:"Sem imobilizado."};
      if (K.G.da) return {st:"ok", txt:`Depreciação registrada: ${mi(K.da)} por ano (${pc(div(K.da, im))} do imobilizado bruto).`};
      const e = im * .10; return {st:"achado", txt:`Imobilizado de ${mi(im)} sem despesa de depreciação. Estimativa de 10% ao ano.`, aj:{titulo:"Depreciação não registrada", tipo:"Contábil (lucro e PL)", v:{lucro:-e, pl:-e}}}; }},
    {id:"c_pdd", area:"contabil", t:"Perdas esperadas com clientes", n:"CPC 48 (IFRS 9)", f:(K) => { const c = K.G.clientes; if (!c) return {st:"na", txt:"Sem saldo de clientes."};
      if (K.G.pdd) return {st:"ok", txt:`Provisão registrada: ${mi(-K.G.pdd)} (${pc(div(-K.G.pdd, c))} da carteira).`};
      const e = c * .02; return {st:"achado", txt:`Carteira de ${mi(c)} sem provisão para perdas. Estimativa inicial de 2%; o consultor ajusta pelo aging da carteira.`, aj:{titulo:"Provisão para perdas com clientes", tipo:"Capital de giro e PL", v:{ncg:-e, pl:-e, lucro:-e}}}; }},
    {id:"c_est", area:"contabil", t:"Estoques: giro e valor realizável", n:"CPC 16", f:(K) => { const e = K.G.estoques; if (!e) return {st:"na", txt:"Sem estoques."};
      if (K.pme > 120){ const a = e * .05; return {st:"achado", txt:`Estoques de ${dias(K.pme)} de custo. Avaliar obsolescência; estimativa de 5%.`, aj:{titulo:"Ajuste ao valor realizável dos estoques", tipo:"Capital de giro e PL", v:{ncg:-a, pl:-a, lucro:-a}}}; }
      return {st:"ok", txt:`Prazo médio de estocagem de ${dias(K.pme)}. Inventário físico na data-base é procedimento mínimo.`}; }},
    {id:"c_arr", area:"contabil", t:"Aluguéis e arrendamentos", n:"CPC 06 (IFRS 16)", f:(K) => { const a = K.G.aluguel * K.f; if (!a) return {st:"na", txt:"Sem despesas de aluguel."};
      return {st:"achado", txt:`Aluguéis de ${mi(a)} por ano tratados como despesa. Pelo CPC 06 saem do EBITDA e viram passivo de arrendamento (estimado em 3 anos de aluguel).`, aj:{titulo:"Arrendamentos pelo CPC 06", tipo:"Reclassificação (EBITDA e dívida)", v:{ebitda:a, divida:a * 3}}}; }},
    {id:"f_nrec", area:"financeira", t:"Itens não recorrentes (normalização do EBITDA)", n:"Normalização", f:(K, b) => { const v = K.G.naoRec * K.f; if (!v) return {st:"ok", txt:"Nenhum item não recorrente identificado nas contas."};
      return {st:"achado", txt:`${contas(b, null, ["naoRec"]).map(c => c[1]).join("; ")}: ${mi(-v)} no EBITDA. Retirar do EBITDA recorrente.`, aj:{titulo:"Normalização de itens não recorrentes", tipo:"Normalização do EBITDA", v:{ebitda:v}}}; }},
    {id:"f_prol", area:"financeira", t:"Remuneração dos sócios a valor de mercado", n:"Normalização", f:(K) => K.G.prolabore ? {st:"ok", txt:`Pró-labore de ${mi(K.G.prolabore * K.f)} por ano. Comparar com o custo de um executivo de mercado.`} : {st:"achado", txt:"Sem pró-labore registrado. Se os sócios trabalham na empresa, o EBITDA está superestimado: incluir ajuste manual com o custo de mercado."}},
    {id:"f_mut", area:"financeira", t:"Mútuos e partes relacionadas", n:"CPC 05", f:(K) => { const m = K.G.mutuoAtivo; if (!m) return {st:"ok", txt:"Sem mútuos com sócios ou partes relacionadas no ativo."};
      return {st:"achado", txt:`Mútuo a receber de sócios ou partes relacionadas: ${mi(m)}. Tratar como item não operacional, a liquidar antes do fechamento.`, aj:{titulo:"Mútuo com sócios fora do patrimônio ajustado", tipo:"Item não operacional", v:{pl:-m}}}; }},
    {id:"f_liq", area:"financeira", t:"Liquidez e caixa", n:"Análise financeira", f:(K) => { const lc = div(K.AC, K.PC); return lc != null && lc < 1 ? {st:"achado", txt:`Liquidez corrente de ${xx(lc, 2)}: o passivo de curto prazo supera o ativo circulante.`} : {st:"ok", txt:`Liquidez corrente de ${xx(lc, 2)}.`}; }},
    {id:"f_div", area:"financeira", t:"Endividamento", n:"Análise financeira", f:(K) => { const r = div(K.dl, K.ebitda); return r != null && r > 3 ? {st:"achado", txt:`Dívida líquida de ${xx(r)} o EBITDA. Conferir covenants, garantias e vencimento antecipado por mudança de controle.`} : {st:"ok", txt:`Dívida líquida de ${mi(K.dl)} (${xx(r)} o EBITDA).`}; }},
    {id:"f_ncg", area:"financeira", t:"Capital de giro", n:"Análise financeira", f:(K) => K.ciclo > 90 ? {st:"achado", txt:`Ciclo de caixa de ${dias(K.ciclo)} (recebimento ${dias(K.pmr)}, estoques ${dias(K.pme)}, pagamento ${dias(K.pmp)}). Definir o capital de giro normalizado para o ajuste de preço.`} : {st:"ok", txt:`Necessidade de capital de giro de ${mi(K.ncg)}, ciclo de caixa de ${dias(K.ciclo)}.`}},
    {id:"t_prov", area:"trabalhista", t:"Provisão de férias e 13º salário", n:"CPC 33", f:(K, b) => { const folha = (K.G.pessoal) * K.f; if (!folha) return {st:"na", txt:"Sem despesa de pessoal."};
      if (contas(b, /ferias|13|decimo/, ["trab"]).length) return {st:"ok", txt:"Provisões de férias e 13º registradas."};
      const e = folha * .10; return {st:"achado", txt:`Folha de ${mi(folha)} por ano sem provisão de férias e 13º. Estimativa de 10% da folha anual.`, aj:{titulo:"Férias e 13º não provisionados", tipo:"Dívida equivalente", v:{divida:e, pl:-e}}}; }},
    {id:"t_enc", area:"trabalhista", t:"INSS e FGTS em atraso", n:"Lei 8.212/1991; Lei 8.036/1990", f:(K, b) => { const enc = contas(b, /inss|fgts/, ["trab"]).reduce((a, c) => a - c[2], 0), mes = K.G.pessoal * K.f / 12 * .27;
      if (!enc) return {st:"ok", txt:"Sem saldo de encargos a recolher."};
      if (mes && enc > mes * 2){ const ex = enc - mes; return {st:"achado", txt:`Encargos a recolher de ${mi(enc)}, cerca de ${fmt(enc / mes, 1)} meses de encargos. O excedente indica atraso.`, aj:{titulo:"Encargos trabalhistas em atraso", tipo:"Dívida equivalente", v:{divida:ex}}}; }
      return {st:"ok", txt:`Encargos a recolher compatíveis com um mês de folha (${mi(enc)}).`}; }},
    {id:"t_proc", area:"trabalhista", t:"Processos trabalhistas", n:"CPC 25", f:(K, b, s) => s.invest?.proc_trab?.v === "sim" ? {st:"achado", txt:`${s.invest.proc_trab.n || "Processos trabalhistas relevantes na investigação."} Classificar provável, possível e remota; provável entra como ajuste manual de dívida.`} : {st:"ok", txt:"Sem apontamento de processos trabalhistas relevantes na investigação."}},
    {id:"t_pj", area:"trabalhista", t:"Terceirização e pejotização", n:"CLT, arts. 2º e 3º", f:(K, b, s) => s.answers?.n3_10?.v === "sim" ? {st:"achado", txt:`${s.answers.n3_10.n || "Uso relevante de PJ ou terceirização."} Estimar o risco de vínculo e incluir ajuste manual se provável.`} : {st:"ok", txt:"Sem indicação de pejotização relevante no questionário."}},
    {id:"x_parc", area:"tributaria", t:"Parcelamentos tributários", n:"Prática de mercado (dívida equivalente)", f:(K) => { const p = K.G.parcTrib; if (!p) return {st:"ok", txt:"Sem parcelamentos tributários."};
      return {st:"achado", txt:`Parcelamentos de ${mi(p)}. Entram na dívida líquida para o preço.`, aj:{titulo:"Parcelamentos tributários como dívida", tipo:"Dívida equivalente", v:{divida:p}}}; }},
    {id:"x_atraso", area:"tributaria", t:"Tributos a recolher em atraso", n:"CTN", f:(K) => { const t = K.G.tribCP, mes = K.deducoes / 12 + K.ir / 12; if (!t) return {st:"ok", txt:"Sem tributos a recolher."};
      if (mes && t > mes * 2){ const ex = t - mes; return {st:"achado", txt:`Tributos a recolher de ${mi(t)}, cerca de ${fmt(t / mes, 1)} meses de tributos. O excedente indica atraso.`, aj:{titulo:"Tributos em atraso", tipo:"Dívida equivalente", v:{divida:ex}}}; }
      return {st:"ok", txt:`Tributos a recolher compatíveis com o mês corrente (${mi(t)}).`}; }},
    {id:"x_cont", area:"tributaria", t:"Contingências fiscais", n:"CPC 25", f:(K, b, s) => (s.invest?.proc_trib?.v === "sim" || s.invest?.divida?.v === "sim") ? {st:"achado", txt:`${[s.invest?.proc_trib?.n, s.invest?.divida?.n].filter(Boolean).join(" ") || "Apontamentos fiscais na investigação."} Prognóstico provável entra como ajuste manual.`} : {st:"ok", txt:"Sem execuções ou dívida ativa na investigação."}},
    {id:"x_carga", area:"tributaria", t:"Carga tributária sobre a receita", n:"Análise tributária", f:(K) => { const c = div(K.deducoes, K.recBruta); if (c == null) return {st:"sd", txt:"Sem receita no balancete."};
      return c < .03 ? {st:"achado", txt:`Deduções de ${pc(c)} da receita bruta, baixo para o setor. Conferir regime, benefícios fiscais e receitas sem nota.`} : {st:"ok", txt:`Deduções de ${pc(c)} da receita bruta.`}; }},
    {id:"x_reg", area:"tributaria", t:"Regime tributário compatível com o faturamento", n:"LC 123/2006; Lei 9.718/1998", f:(K, b) => { const simples = contas(b, /simples nacional/).length;
      return simples && K.recBruta > 4.8e6 ? {st:"achado", txt:`Contas de Simples Nacional com receita anual de ${mi(K.recBruta)}, acima do limite de R$ 4,8 mi.`} : K.recBruta > 78e6 && contas(b, /presumid/).length ? {st:"achado", txt:"Lucro presumido com receita acima de R$ 78 mi."} : {st:"ok", txt:"Regime compatível com o faturamento informado."}; }}
  ];
  const MINIMOS = {
    contabil:["Conciliação bancária na data-base","Inventário físico dos estoques","Circularização de clientes e fornecedores","Teste de corte (cut-off) das receitas","Relatório do imobilizado e laudos"],
    financeira:["Receita por cliente (concentração)","Projeções e orçamento da gestão","Contratos de dívida: covenants, garantias e mudança de controle","Capital de giro médio de 12 meses (balancetes mensais)","Despesas pessoais dos sócios na empresa"],
    trabalhista:["Folha e eSocial (amostra)","Convenções e acordos coletivos","Relação de processos com prognóstico do advogado","Prestadores PJ e terceirizados","Bônus, PLR e benefícios a pagar"],
    tributaria:["Enquadramento e regime tributário","Obrigações acessórias (SPED, EFD, DCTFWeb)","Certidões negativas atualizadas","Autuações, execuções e parcelamentos","Créditos tributários: origem e realização"]
  };

  /* ---------------- AJUSTES ---------------- */
  function ajustes(s, per){
    const b = s.dd?.bal?.[per]; if (!b) return [];
    const K = calc(b), salvo = s.dd?.aj || {}, out = [];
    PROCS.forEach(p => { const r = p.f(K, b, s); if (!r.aj) return; const id = p.id + "@" + per, o = salvo[id] || {};
      out.push({id, per, area:p.area, norma:p.n, origem:"Procedimento automático", proc:p.id, titulo:r.aj.titulo, tipo:r.aj.tipo, desc:r.txt, v:{...r.aj.v, ...(o.v || {})}, editado:!!o.v, fin:o.fin || null, val:o.val || null}); });
    Object.entries(salvo).filter(([id, o]) => o && o.manual && o.per === per).forEach(([id, o]) => out.push({id, ...o, origem:"Ajuste do consultor"}));
    return out.map(a => ({...a, v:Object.fromEntries(EF.map(([k]) => [k, +a.v?.[k] || 0]))}));
  }
  const soma = (L) => EF.reduce((o, [k]) => (o[k] = L.reduce((t, a) => t + (a.v[k] || 0), 0), o), {});
  const okFin = a => a.fin?.st === "aprovado", okVal = a => okFin(a) && a.val?.st === "aprovado";
  const pendFin = a => !a.fin, pendVal = a => okFin(a) && !a.val;
  const efeitoTxt = a => EF.filter(([k]) => a.v[k]).map(([k, l]) => `${l} ${mil(a.v[k])}`).join(" · ") || "sem efeito em valores (definir)";
  const stPill = (o, ok) => !o ? `<span class="pill r-pend">Aguardando OK</span>` : o.st === "aprovado" ? `<span class="pill r-baixo">${ok}</span>` : `<span class="pill r-alto">Recusado</span>`;

  /* aprovação pelo consultor: nas Análises financeiras (fase "fin") ou no Valuation (fase "val") */
  function aprovar(s, a, fase, extra){
    if (!ed()){ toast("Só o consultor responsável (perfil Editor) aprova ajustes."); return; }
    const cons = s.dd?.cons?.[a.area] || "";
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${fase === "fin" ? "OK do consultor · Análises financeiras" : "OK do consultor · Valuation"}</div><h2>${esc(a.titulo)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fap" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <p class="sub" style="margin:0">${esc(areaNome(a.area))} · ${esc(a.norma || "")} · ${esc(a.origem)}${a.per ? " · balancete " + esc(a.per) : ""}</p>
        <p style="margin:0;font-size:13.5px;line-height:1.5">${esc(a.desc || "")}</p>
        ${extra || ""}
        ${fase === "fin" ? `<div class="eyebrow">Efeitos anuais (R$ mil) · ajuste se necessário</div><div class="form">${EF.map(([k, l]) => `<div class="fld"><label for="ap-${k}">${l}</label><input id="ap-${k}" inputmode="decimal" value="${a.v[k] ? fmt(a.v[k] / 1e3, 0) : ""}"></div>`).join("")}</div>`
          : `<div class="sub" style="margin:0">Efeitos aprovados nas Análises financeiras: ${esc(efeitoTxt(a))}</div>`}
        <div class="form"><div class="fld"><label for="ap-cons">Consultor responsável (${esc(areaNome(a.area))})</label><input id="ap-cons" value="${esc(cons)}" placeholder="Nome e registro (CRC, OAB…)"></div>
        <div class="fld full"><label for="ap-obs">Fundamento do OK ou da recusa</label><textarea id="ap-obs"></textarea></div></div>
        <p class="err" id="ap-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn ghost" id="ap-rec">Recusar ajuste</button><button type="submit" class="btn primary">${fase === "fin" ? "Aprovar para as análises financeiras" : "Aprovar no valuation"}</button></div></form>`);
    const grava = st => { const nome = $("#ap-cons").value.trim(), obs = $("#ap-obs").value.trim();
      if (!nome){ $("#ap-err").textContent = "Informe o consultor responsável."; $("#ap-err").hidden = false; return; }
      if (st === "recusado" && !obs){ $("#ap-err").textContent = "Escreva o motivo da recusa."; $("#ap-err").hidden = false; return; }
      const reg = {st, por:nome, user:Store.me?.email || Store.me?.id || "", em:nowISO(), obs}, patch = {dd:{cons:{[a.area]:nome}, aj:{[a.id]:{[fase]:reg}}}};
      if (fase === "fin"){ const v = {}; let mud = false; EF.forEach(([k]) => { const x = num($("#ap-" + k).value); v[k] = x == null ? 0 : x * 1e3; if (Math.abs(v[k] - a.v[k]) > 1) mud = true; }); patch.dd.aj[a.id].v = v; if (mud) patch.dd.aj[a.id].editado = true; }
      up(s, patch).then(() => { close(); toast(st === "aprovado" ? (fase === "fin" ? "Ajuste aprovado: indicadores atualizados" : "Ajuste aprovado: valuation atualizado") : "Ajuste recusado"); }); };
    $("#fap").onsubmit = e => { e.preventDefault(); grava("aprovado"); };
    $("#ap-rec").onclick = () => grava("recusado");
  }
  function reabrir(s, a){ up(s, {dd:{aj:{[a.id]:{fin:null, val:null}}}}).then(() => toast("Ajuste reaberto para nova análise")); }
  function ajusteManual(s, per, area){
    if (!per){ toast("Importe um balancete antes de lançar ajustes."); return; }
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Ajuste do consultor · balancete ${esc(per)}</div><h2>Novo ajuste de Due Diligence</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fam" novalidate><div class="form">
        <div class="fld full"><label for="am-t">Título</label><input id="am-t" placeholder="ex.: Contingência trabalhista provável"></div>
        <div class="fld"><label for="am-a">Área</label><select id="am-a">${AREAS.map(([k, l]) => `<option value="${k}" ${k === area ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        <div class="fld"><label for="am-n">Norma ou fundamento</label><input id="am-n" placeholder="ex.: CPC 25"></div>
        <div class="fld"><label for="am-tp">Tipo</label><select id="am-tp">${["Normalização do EBITDA","Dívida equivalente","Capital de giro e PL","Contábil (lucro e PL)","Reclassificação (EBITDA e dívida)","Item não operacional"].map(t => `<option>${t}</option>`).join("")}</select></div>
        <div class="fld full eyebrow" style="margin-top:6px">Efeitos anuais (R$ mil; negativo reduz)</div>
        ${EF.map(([k, l]) => `<div class="fld"><label for="am-${k}">${l}</label><input id="am-${k}" inputmode="decimal"></div>`).join("")}
        <div class="fld full"><label for="am-d">Descrição e base de cálculo</label><textarea id="am-d"></textarea></div>
      </div><p class="err" id="am-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Enviar para o OK do consultor</button></div></form>`);
    $("#fam").onsubmit = e => { e.preventDefault(); const t = $("#am-t").value.trim(), v = {};
      EF.forEach(([k]) => { const x = num($("#am-" + k).value); v[k] = x == null ? 0 : x * 1e3; });
      if (!t || !EF.some(([k]) => v[k])){ $("#am-err").textContent = !t ? "Dê um título ao ajuste." : "Informe pelo menos um efeito em valor."; $("#am-err").hidden = false; return; }
      const id = "m" + Date.now().toString(36);
      up(s, {dd:{aj:{[id]:{manual:true, per, area:$("#am-a").value, titulo:t, norma:$("#am-n").value.trim(), tipo:$("#am-tp").value, v, desc:$("#am-d").value.trim(), criadoEm:nowISO(), por:Store.me?.email || ""}}}}).then(() => { close(); toast("Ajuste enviado para as Análises financeiras"); }); };
  }

  /* ---------------- IMPORTAÇÃO ---------------- */
  function importar(s){
    if (!s){ toast("Escolha o target."); return; }
    let lidas = null;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Due Diligence · ${esc(s.nome)}</div><h2>Importar balancete</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fbal" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <p class="sub" style="margin:0">Excel (.xlsx), LibreOffice (.ods), CSV ou texto colado do sistema contábil. O sistema encontra as colunas de conta, descrição e saldo final (com D/C ou sinal), usa só as contas analíticas e classifica cada conta. Confira a classificação antes de salvar.</p>
        <div class="form"><div class="fld"><label for="bl-db">Data-base</label><input id="bl-db" type="date"></div><div class="fld"><label for="bl-m">Meses acumulados no resultado</label><input id="bl-m" inputmode="numeric" value="12"></div>
        <div class="fld full"><label for="bl-f">Arquivo</label><input id="bl-f" type="file" accept=".xlsx,.xlsm,.ods,.csv,.txt"></div>
        <div class="fld full"><label for="bl-p">Ou cole aqui as linhas do balancete</label><textarea id="bl-p" rows="4" placeholder="1.1.01.001;Caixa e bancos;4.200.000,00 D"></textarea></div></div>
        <div id="bl-prev"></div><p class="err" id="bl-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" id="bl-ler">Ler balancete</button><button type="submit" class="btn primary" id="bl-ok" disabled>Salvar e rodar os procedimentos</button></div></form>`);
    const err = m => { $("#bl-err").textContent = m; $("#bl-err").hidden = !m; };
    const prev = () => { const K = calc({contas:lidas, meses:+$("#bl-m").value || 12});
      $("#bl-prev").innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:8px"><b>${lidas.length} contas analíticas lidas</b>
        <div class="sub" style="margin:0">Ativo ${mi(K.AT)} · Passivo ${mi(K.PC + K.PNC)} · PL ${mi(K.PL)} · Receita líquida ${mi(K.recLiq)} · EBITDA ${mi(K.ebitda)} · ${K.fecha ? "débitos = créditos" : `<b style="color:var(--bad)">não fecha (${mi(K.soma, 2)})</b>`}</div>
        <div class="tbl" style="max-height:300px;overflow:auto"><table><thead><tr><th>Conta</th><th>Descrição</th><th>Saldo</th><th>Classificação</th></tr></thead><tbody>${lidas.map((c, i) => `<tr><td class="mono" style="white-space:nowrap">${esc(c[0])}</td><td>${esc(c[1])}</td><td class="mono" style="white-space:nowrap;text-align:right">${fmt(Math.abs(c[2]), 2)} ${c[2] < 0 ? "C" : "D"}</td>
          <td><select data-cl="${i}" aria-label="Classificação de ${esc(c[1])}">${Object.entries(GRUPOS).map(([k, g]) => `<option value="${k}" ${k === c[3] ? "selected" : ""}>${g[2]} · ${g[0]}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div></div>`;
      $$("[data-cl]").forEach(x => x.onchange = () => { lidas[+x.dataset.cl][3] = x.value; prev(); });
      $("#bl-ok").disabled = false; };
    $("#bl-ler").onclick = async () => { err(""); try{
        const f = $("#bl-f").files[0], t = $("#bl-p").value.trim();
        lidas = f ? await lerArquivo(f) : t ? lerTabela(csv(t)) : null;
        if (!lidas){ err("Escolha um arquivo ou cole as linhas."); return; } prev(); }catch(e){ err(e.message || "Não foi possível ler o arquivo."); } };
    $("#fbal").onsubmit = e => { e.preventDefault(); const db = $("#bl-db").value; if (!db){ err("Informe a data-base do balancete."); return; } if (!lidas) return;
      const per = db.slice(0, 7);
      up(s, {dd:{bal:{[per]:{dataBase:db, meses:+$("#bl-m").value || 12, contas:lidas, importadoEm:nowISO(), por:Store.me?.email || ""}}}}).then(() => { S.ddSel = s.id; S.ddPer = per; close(); toast("Balancete importado: procedimentos executados"); }); };
  }

  /* ---------------- MINI GLOBO ---------------- */
  const MG = {cv:null, rot:[50, 14], pins:[], sel:null, pick:null, raf:0, drag:null, alvo:null};
  function miniGlobo(host, pins, sel, pick){
    if (!window.d3 || !G.countries){ host.innerHTML = `<p class="sub">Globo indisponível neste acesso.</p>`; return; }
    host.innerHTML = `<canvas style="width:100%;aspect-ratio:1;display:block;touch-action:none;cursor:grab" aria-label="Mini globo das empresas analisadas"></canvas>`;
    const cv = host.firstElementChild; Object.assign(MG, {cv, pins, sel, pick});
    const p = pins.find(x => x.id === sel); if (p) MG.alvo = [-p.lng, -p.lat];
    cv.onpointerdown = e => { MG.drag = {x:e.clientX, y:e.clientY, r:MG.rot.slice(), m:0}; cv.setPointerCapture(e.pointerId); };
    cv.onpointermove = e => { if (!MG.drag) return; const dx = e.clientX - MG.drag.x, dy = e.clientY - MG.drag.y; MG.drag.m = Math.abs(dx) + Math.abs(dy); MG.alvo = null; MG.rot = [MG.drag.r[0] + dx * .5, Math.max(-80, Math.min(80, MG.drag.r[1] - dy * .5))]; };
    cv.onpointerup = e => { const m = MG.drag?.m || 0; MG.drag = null; if (m > 6) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = null, bd = 16; (MG.hits || []).forEach(h => { const d = Math.hypot(h.x - x, h.y - y); if (d < bd){ bd = d; best = h; } }); if (best) MG.pick(best.id); };
    if (!MG.raf) MG.raf = requestAnimationFrame(mgLoop);
  }
  function mgLoop(){
    const cv = MG.cv; if (!cv || !cv.isConnected){ MG.raf = 0; return; }
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); if (!r.width){ MG.raf = requestAnimationFrame(mgLoop); return; }
    if (cv.width !== Math.round(r.width * dpr)){ cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    const ctx = cv.getContext("2d"), w = r.width, h = r.height, R = Math.min(w, h) * .44;
    if (MG.alvo){ MG.rot[0] += (MG.alvo[0] - MG.rot[0]) * .08; MG.rot[1] += (MG.alvo[1] - MG.rot[1]) * .08; if (Math.abs(MG.alvo[0] - MG.rot[0]) < .1) MG.alvo = null; }
    else if (!MG.drag && !G.reduce) MG.rot[0] += .06;
    const proj = d3.geoOrthographic().scale(R).translate([w / 2, h / 2]).rotate([MG.rot[0], MG.rot[1], 0]).clipAngle(90), path = d3.geoPath(proj, ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const at = ctx.createRadialGradient(w / 2, h / 2, R * .9, w / 2, h / 2, R * 1.15); at.addColorStop(0, "rgba(79,176,245,.45)"); at.addColorStop(1, "rgba(4,115,195,0)"); ctx.fillStyle = at; ctx.beginPath(); ctx.arc(w / 2, h / 2, R * 1.15, 0, 7); ctx.fill();
    ctx.beginPath(); path({type:"Sphere"}); ctx.fillStyle = "#05224f"; ctx.fill();
    ctx.beginPath(); path(d3.geoGraticule10()); ctx.strokeStyle = "rgba(120,180,255,.10)"; ctx.lineWidth = .6; ctx.stroke();
    ctx.beginPath(); G.countries.forEach(f => { if (f !== G.brazil) path(f); }); ctx.fillStyle = "#123f73"; ctx.fill();
    ctx.beginPath(); path(G.brazil); ctx.fillStyle = "#16589c"; ctx.fill(); ctx.strokeStyle = "rgba(170,215,255,.8)"; ctx.lineWidth = .9; ctx.stroke();
    const c = proj.invert([w / 2, h / 2]); MG.hits = [];
    MG.pins.forEach(p => { if (p.lat == null || d3.geoDistance([p.lng, p.lat], c) > Math.PI / 2 - .02) return; const [x, y] = proj([p.lng, p.lat]), on = p.id === MG.sel;
      ctx.save(); ctx.shadowColor = p.cor; ctx.shadowBlur = on ? 14 : 8; ctx.fillStyle = p.cor; ctx.beginPath(); ctx.arc(x, y, on ? 6 : 4.2, 0, 7); ctx.fill(); ctx.restore();
      if (on){ ctx.strokeStyle = "#E6E8EC"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.stroke(); ctx.font = "600 10px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#E6E8EC"; ctx.textAlign = x > w * .6 ? "right" : "left"; ctx.fillText(p.rot, x + (x > w * .6 ? -15 : 15), y + 3); }
      MG.hits.push({id:p.id, x, y}); });
    MG.raf = requestAnimationFrame(mgLoop);
  }
  const COR = {ok:"#3DDC97", pend:"#F2C14E", sem:"#7A8699"};

  /* ---------------- ESTILO E NAVEGAÇÃO ---------------- */
  const st = document.createElement("style");
  st.textContent = `.dd-split{display:grid;grid-template-columns:290px minmax(0,1fr);gap:16px;align-items:start}@media (max-width:900px){.dd-split{grid-template-columns:minmax(0,1fr)}}
    .dd-side{display:flex;flex-direction:column;gap:10px;position:sticky;top:8px}.dd-list{display:flex;flex-direction:column;gap:4px;max-height:340px;overflow:auto}
    .dd-list button{display:flex;align-items:center;gap:8px;text-align:left;background:transparent;border:1px solid var(--line);border-radius:8px;padding:7px 10px;color:inherit;font:inherit;font-size:12.5px;cursor:pointer}
    .dd-list button[aria-pressed=true]{border-color:var(--acc,#4FB0F5);background:rgba(79,176,245,.12)}.dd-list i{width:9px;height:9px;border-radius:50%;flex:none}
    .dd-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}.dd-k{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;min-width:0}
    .dd-k span{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}.dd-k b{font-size:18px;font-variant-numeric:tabular-nums}.dd-k small{font-size:11.5px;color:var(--muted)}
    .dd-tabs{display:flex;gap:6px;flex-wrap:wrap}.dd-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.dd-proc{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;border-top:1px solid var(--line);padding:10px 0}
    .dd-proc:first-child{border-top:0}.dd-svg text{fill:var(--muted);font-size:10.5px}.dd-svg .lb{fill:var(--ink,#E6E8EC)}`;
  document.head.appendChild(st);
  const ICO = {fin:`<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`, val:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-1.8 2.5-1.8s2.5.7 2.5 1.8-1 1.6-2.5 1.9-2.5.9-2.5 2 1 1.9 2.5 1.9 2.5-.8 2.5-1.8"/></svg>`};
  (() => { const nav = $("nav.tabs"), au = nav && $("[data-go=auditoria]", nav); if (!au) return;
    au.lastChild.textContent = "Due Diligence";
    au.insertAdjacentHTML("afterend", `<button type="button" data-go="financas">${ICO.fin}Análises financeiras</button><button type="button" data-go="valuation">${ICO.val}Valuation</button>`);
    $("#v-auditoria").insertAdjacentHTML("afterend", `<section class="view" id="v-financas" data-view="financas" hidden><div class="pad" id="financas"></div></section><section class="view" id="v-valuation" data-view="valuation" hidden><div class="pad" id="valuation"></div></section>`); })();

  const alvoSel = () => { const L = targets(); let s = supById(S.ddSel); if (!s || s.nivel !== "N3") s = L.find(temBal) || L[0]; if (s) S.ddSel = s.id; return s; };
  const perSel = s => { const P = periodos(s); if (!P.includes(S.ddPer)) S.ddPer = P[0] || ""; return S.ddPer; };
  const statusAlvo = s => { if (!temBal(s)) return "sem"; const L = ajustes(s, periodos(s)[0]); return L.some(a => pendFin(a) || pendVal(a)) ? "pend" : "ok"; };
  function lado(s, onPick, legenda){
    const L = targets();
    return {html:`<div class="dd-side"><div class="card" style="display:flex;flex-direction:column;gap:8px;padding:12px"><div id="dd-globo"></div>
      <div class="sub" style="margin:0;font-size:11.5px;display:flex;gap:10px;flex-wrap:wrap"><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COR.ok}"></i> ${legenda[0]}</span><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COR.pend}"></i> ${legenda[1]}</span><span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${COR.sem}"></i> sem balancete</span></div>
      <div class="dd-list">${L.map(x => `<button type="button" data-ddsel="${x.id}" aria-pressed="${x.id === s?.id}"><i style="background:${COR[statusAlvo(x)]}"></i><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.mandato?.codinome ? x.mandato.codinome + " · " : "")}${esc((x.nome || "").replace(/^EXEMPLO /, ""))}</span></button>`).join("")}</div></div></div>`,
      bind:host => { $$("[data-ddsel]", host).forEach(b => b.onclick = () => onPick(b.dataset.ddsel));
        miniGlobo($("#dd-globo", host), L.map(x => ({id:x.id, lat:x.lat, lng:x.lng, cor:COR[statusAlvo(x)], rot:(x.mandato?.codinome || x.nome || "").replace(/^EXEMPLO /, "").slice(0, 24)})), s?.id, onPick); }};
  }
  const cab = (eb, tit, sub, acoes = "") => `<div class="head"><div><div class="eyebrow">${eb}</div><h2>${tit}</h2><p class="sub">${sub}</p></div>${acoes}</div>`;
  const semBal = s => `<div class="card" style="display:flex;flex-direction:column;gap:10px;align-items:flex-start"><h3>${esc(s?.nome || "Nenhum target")}</h3><p class="sub" style="margin:0">Ainda sem balancete. Importe na Due Diligence para calcular os indicadores, os procedimentos e o valuation.</p>${s ? `<button type="button" class="btn primary" data-ddimp>Importar balancete</button>` : ""}</div>`;
  const selPer = (s, per) => { const P = periodos(s); return P.length > 1 ? `<div class="fld" style="min-width:160px"><label for="dd-per">Balancete</label><select id="dd-per">${P.map(p => `<option ${p === per ? "selected" : ""}>${p}</option>`).join("")}</select></div>` : `<span class="sub" style="margin:0">Balancete ${esc(per)}${s.dd.bal[per].meses != 12 ? ` · ${s.dd.bal[per].meses} meses, anualizado` : ""}</span>`; };
  const bindComum = (host, s) => { const p = $("#dd-per", host); if (p) p.onchange = () => { S.ddPer = p.value; renderView(); }; $$("[data-ddimp]", host).forEach(b => b.onclick = () => importar(s)); };
  const pick = id => { S.ddSel = id; S.ddPer = ""; renderView(); };

  /* ---------------- VIEW · DUE DILIGENCE (no lugar de Auditoria) ---------------- */
  S.ddTab = S.ddTab || "geral";
  const _aud = renderAuditoria;
  renderAuditoria = function(){
    const host = $("#auditoria"); if (!host) return;
    const tabs = `<div class="dd-tabs" style="margin-bottom:14px">${[["geral","Visão geral"], ...AREAS, ["base","Base de auditoria"]].map(([k, l]) => `<button type="button" class="fbtn" data-ddtab="${k}" aria-pressed="${S.ddTab === k}">${l}</button>`).join("")}</div>`;
    const bindTabs = () => $$("[data-ddtab]", host).forEach(b => b.onclick = () => { S.ddTab = b.dataset.ddtab; renderAuditoria(); });
    if (S.ddTab === "base"){ _aud.apply(this, arguments); host.insertAdjacentHTML("afterbegin", cab("Due Diligence", "Base de auditoria", "Matriz de risco, testes, órgãos públicos e operações comerciais da plataforma.") + tabs); bindTabs(); return; }
    const s = alvoSel(), per = s ? perSel(s) : "", b = per ? s.dd.bal[per] : null, K = b ? calc(b) : null;
    const L = targets();
    let h = cab("Due Diligence", "Due Diligence", "Procedimentos automáticos sobre o balancete e procedimentos mínimos dos consultores especialistas. Todo ajuste apurado vai para as Análises financeiras e só muda indicadores e valuation com o OK do consultor.",
      `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end"><div class="fld" style="min-width:240px"><label for="dd-alvo">Target</label><select id="dd-alvo">${L.map(x => `<option value="${x.id}" ${x.id === s?.id ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></div><button type="button" class="btn primary" data-ddimp>Importar balancete</button></div>`) + tabs;
    if (!b){ host.innerHTML = h + semBal(s); bindTabs(); bindComum(host, s); $("#dd-alvo").onchange = e => pick(e.target.value); return; }
    const R = PROCS.map(p => ({p, r:p.f(K, b, s)})), AJ = ajustes(s, per), proc = s.dd.proc || {};
    const pill = st => ({ok:`<span class="pill r-baixo">Sem achado</span>`, achado:`<span class="pill r-alto">Achado</span>`, na:`<span class="pill r-pend">Não se aplica</span>`, sd:`<span class="pill r-pend">Sem dados</span>`})[st];
    if (S.ddTab === "geral"){
      h += `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>${esc(s.nome)}</h3><p class="sub" style="margin:2px 0 0">${s.mandato?.codinome ? esc(s.mandato.codinome) + " · " : ""}${esc(s.segmento || "")}</p></div>${selPer(s, per)}</div>
        <div class="dd-kpis"><div class="dd-k"><span>Contas analíticas</span><b>${b.contas.length}</b><small>importado em ${dt(b.importadoEm)}</small></div><div class="dd-k"><span>Fechamento</span><b style="color:${K.fecha ? "var(--ok)" : "var(--bad)"}">${K.fecha ? "Fecha" : "Não fecha"}</b><small>débitos − créditos ${mi(K.soma, 2)}</small></div>
        <div class="dd-k"><span>Achados automáticos</span><b>${R.filter(x => x.r.st === "achado").length}</b><small>de ${R.length} procedimentos</small></div><div class="dd-k"><span>Ajustes</span><b>${AJ.length}</b><small>${AJ.filter(okFin).length} com OK nas análises · ${AJ.filter(okVal).length} no valuation</small></div></div></div>
        <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Áreas e consultores responsáveis</h3>
        <div class="tbl"><table><thead><tr><th>Área</th><th>Consultor responsável</th><th>Automáticos</th><th>Mínimos</th><th>Ajustes</th><th></th></tr></thead><tbody>${AREAS.map(([k, l]) => { const ra = R.filter(x => x.p.area === k), mn = MINIMOS[k], feitos = mn.filter((m, i) => ["ok","achado","na"].includes(proc[k + i]?.st)).length, aa = AJ.filter(a => a.area === k);
          return `<tr><td><b>${l}</b></td><td><input data-cons="${k}" value="${esc(s.dd.cons?.[k] || "")}" placeholder="Nome e registro" aria-label="Consultor de ${l}" ${ed() ? "" : "disabled"} style="min-width:180px"></td><td>${ra.filter(x => x.r.st === "achado").length} achado(s) de ${ra.length}</td><td>${feitos} de ${mn.length}</td><td>${aa.length ? `${aa.filter(pendFin).length} aguardando OK` : "—"}</td><td><button type="button" class="btn sm" data-ddtab="${k}">Abrir</button></td></tr>`; }).join("")}</tbody></table></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-goview="financas">Ver Análises financeiras</button><button type="button" class="btn" data-goview="valuation">Ver Valuation</button></div></div>`;
    } else {
      const area = S.ddTab, ra = R.filter(x => x.p.area === area), mn = MINIMOS[area];
      h += `<div class="card" style="display:flex;flex-direction:column;gap:6px"><div class="head" style="margin:0"><div><div class="eyebrow">Due Diligence ${esc(areaNome(area))} · ${esc(s.nome)}</div><h3>Procedimentos automáticos</h3><p class="sub" style="margin:2px 0 0">Consultor responsável: <b>${esc(s.dd.cons?.[area] || "a definir")}</b></p></div>${selPer(s, per)}</div>
        <div>${ra.map(({p, r}) => { const a = AJ.find(x => x.proc === p.id);
          return `<div class="dd-proc"><div style="min-width:0"><b>${esc(p.t)}</b> <span class="sub" style="font-size:11.5px">· ${esc(p.n)}</span><div style="font-size:13px;margin-top:3px">${esc(r.txt)}</div>
            ${a ? `<div class="sub" style="margin:4px 0 0;font-size:12px">Ajuste proposto: <b>${esc(a.titulo)}</b> · ${esc(efeitoTxt(a))} · Análises ${stPill(a.fin, "OK")} · Valuation ${okFin(a) ? stPill(a.val, "OK") : `<span class="pill r-pend">Depois do OK</span>`}</div>` : ""}</div><div>${pill(r.st)}</div></div>`; }).join("")}</div></div>
        <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Procedimentos mínimos dos consultores</h3><p class="sub" style="margin:0">Feitos pelo especialista da área, com a conclusão registrada.</p>
        ${mn.map((m, i) => { const id = area + i, o = proc[id] || {}; return `<div class="dd-proc"><div style="min-width:0"><b>${esc(m)}</b><input data-pobs="${id}" value="${esc(o.obs || "")}" placeholder="Conclusão, documento analisado, responsável" aria-label="Conclusão: ${esc(m)}" style="width:100%;margin-top:4px" ${ed() ? "" : "disabled"}>${o.em ? `<div class="sub" style="margin:2px 0 0;font-size:11.5px">${esc(o.por || "")} · ${dt(o.em)}</div>` : ""}</div>
          <div><select data-pst="${id}" aria-label="Situação: ${esc(m)}" ${ed() ? "" : "disabled"}>${[["","Pendente"],["ok","Sem achado"],["achado","Achado"],["na","Não se aplica"]].map(([k, l]) => `<option value="${k}" ${(o.st || "") === k ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>`; }).join("")}</div>
        <div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Ajustes da área ${esc(areaNome(area))}</h3><p class="sub" style="margin:2px 0 0">Vão para as Análises financeiras aguardando o OK do consultor.</p></div>${ed() ? `<button type="button" class="btn sm primary" id="dd-man">+ Ajuste do consultor</button>` : ""}</div>
        ${tabAjustes(AJ.filter(a => a.area === area), "dd")}</div>`;
    }
    host.innerHTML = h; bindTabs(); bindComum(host, s);
    $("#dd-alvo").onchange = e => pick(e.target.value);
    $$("[data-goview]", host).forEach(x => x.onclick = () => go(x.dataset.goview));
    $$("[data-cons]", host).forEach(x => x.onchange = () => up(s, {dd:{cons:{[x.dataset.cons]:x.value.trim()}}}));
    $$("[data-pst]", host).forEach(x => x.onchange = () => up(s, {dd:{proc:{[x.dataset.pst]:{st:x.value, por:s.dd.cons?.[x.dataset.pst.replace(/\d+$/, "")] || Store.me?.email || "", em:nowISO()}}}}));
    $$("[data-pobs]", host).forEach(x => x.onchange = () => up(s, {dd:{proc:{[x.dataset.pobs]:{obs:x.value.trim(), em:nowISO()}}}}));
    const mb = $("#dd-man", host); if (mb) mb.onclick = () => ajusteManual(s, per, S.ddTab);
    bindAjustes(host, s, AJ);
  };
  function tabAjustes(L, ctx){
    if (!L.length) return `<p class="sub" style="margin:0">Nenhum ajuste.</p>`;
    const bt = (a, f) => ctx !== "dd" && ed() && ((f === "fin" && ctx === "fin" && pendFin(a)) || (f === "val" && ctx === "val" && pendVal(a))) ? `<div style="margin-top:6px"><button type="button" class="btn sm primary" data-ap${f}="${a.id}">Dar OK</button></div>` : "";
    return `<div class="tbl"><table><thead><tr><th>Ajuste</th><th>Efeitos (anuais)</th><th>Análises financeiras</th><th>Valuation</th></tr></thead><tbody>${L.map(a => `<tr>
      <td style="min-width:200px"><b>${esc(a.titulo)}</b><div class="sub" style="margin:2px 0 0;font-size:11.5px">${esc(areaNome(a.area))} · ${esc(a.norma || "")} · ${esc(a.origem)}${a.editado ? " · valor revisado" : ""}</div>${ed() && (a.fin || a.val) ? `<button type="button" class="btn sm ghost" style="margin-top:4px" data-reab="${a.id}">Reabrir</button>` : ""}</td>
      <td style="font-size:12.5px;min-width:150px">${esc(efeitoTxt(a))}</td>
      <td style="min-width:130px">${stPill(a.fin, "OK")}${a.fin ? `<div class="sub" style="margin:2px 0 0;font-size:11px">${esc(a.fin.por || "")}</div>` : ""}${bt(a, "fin")}</td>
      <td style="min-width:130px">${okFin(a) ? stPill(a.val, "OK") + (a.val ? `<div class="sub" style="margin:2px 0 0;font-size:11px">${esc(a.val.por || "")}</div>` : "") : `<span class="sub" style="font-size:12px">depois do OK nas análises</span>`}${bt(a, "val")}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function bindAjustes(host, s, L, extraVal){
    $$("[data-apfin]", host).forEach(b => b.onclick = () => aprovar(s, L.find(a => a.id === b.dataset.apfin), "fin"));
    $$("[data-apval]", host).forEach(b => b.onclick = () => { const a = L.find(x => x.id === b.dataset.apval); aprovar(s, a, "val", extraVal ? extraVal(a) : ""); });
    $$("[data-reab]", host).forEach(b => b.onclick = () => reabrir(s, L.find(a => a.id === b.dataset.reab)));
  }

  /* ---------------- VIEW · ANÁLISES FINANCEIRAS ---------------- */
  EXT_VIEWS.financas = function(){
    const host = $("#financas"); if (!host) return;
    const s = alvoSel(), per = s ? perSel(s) : "", b = per ? s.dd.bal[per] : null, sd = lado(s, pick, ["indicadores com todos os OKs", "ajustes aguardando OK"]);
    let h = cab("Análises financeiras", "Análises financeiras", "Estudos calculados a partir do balancete importado na Due Diligence: EBITDA, endividamento, indicadores, capital de giro e ajustes por normas contábeis. Os ajustes só entram nos números depois do OK do consultor responsável.");
    if (!b){ host.innerHTML = h + `<div class="dd-split">${sd.html}<div>${semBal(s)}</div></div>`; sd.bind(host); bindComum(host, s); return; }
    const K = calc(b), AJ = ajustes(s, per), ap = AJ.filter(okFin), A = soma(ap), I0 = indic(K), I = indic(K, A), pend = AJ.filter(pendFin);
    const lin = (l, r, a, f = mi) => `<tr><td>${l}</td><td class="dd-num">${f(r)}</td><td class="dd-num">${a == null || Math.abs((a ?? 0) - (r ?? 0)) < .5 ? "—" : f(a - r)}</td><td class="dd-num"><b>${f(a ?? r)}</b></td></tr>`;
    const lr = (l, r, a, f) => `<tr><td>${l}</td><td class="dd-num">${f(r)}</td><td class="dd-num"><b>${f(a)}</b></td></tr>`;
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const fin = s.fin || {};
    h += `<div class="dd-split">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="head" style="margin:0"><div><div class="eyebrow">${esc(s.mandato?.codinome || "Target")}</div><h3>${esc(s.nome)}</h3></div>${selPer(s, per)}</div>
      ${pend.length ? `<div class="banner"><b>${pend.length} ajuste(s) aguardando o OK do consultor.</b> Enquanto isso, os números abaixo não os consideram.</div>` : ""}
      <div class="dd-kpis">${k("Receita líquida", mi(K.recLiq), fin.receita ? `informada: R$ ${fmt(fin.receita, 0)} mi` : "")}${k("EBITDA ajustado", mi(I.ebitda), `reportado ${mi(K.ebitda)}${fin.ebitda ? ` · informado R$ ${fmt(fin.ebitda, 0)} mi` : ""}`)}
        ${k("Margem EBITDA", pc(I.mEbitda), `reportada ${pc(I0.mEbitda)}`)}${k("Dívida líquida ajustada", mi(I.dl), `reportada ${mi(K.dl)}`)}${k("Dívida líquida / EBITDA", xx(I.dlEbitda), `reportado ${xx(I0.dlEbitda)}`)}
        ${k("Capital de giro (NCG)", mi(I.ncg), `${pc(I.ncgRec)} da receita`)}${k("Liquidez corrente", xx(I.lc, 2), `seca ${xx(I.ls, 2)}`)}${k("Lucro líquido ajustado", mi(I.ll), `reportado ${mi(K.ll)}`)}</div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Ponte do EBITDA</h3><p class="sub" style="margin:0">Do EBITDA do balancete ao EBITDA ajustado, só com ajustes que receberam o OK.</p>${ponte(K.ebitda, ap.filter(a => a.v.ebitda), "ebitda", "EBITDA reportado", "EBITDA ajustado")}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Ajustes da Due Diligence</h3>${tabAjustes(AJ, "fin")}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Resultado (anualizado)</h3><div class="tbl"><table><thead><tr><th></th><th class="dd-num">Reportado</th><th class="dd-num">Ajustes</th><th class="dd-num">Ajustado</th></tr></thead><tbody>
        ${lin("Receita bruta", K.recBruta)}${lin("(−) Deduções", -K.deducoes)}${lin("Receita líquida", K.recLiq)}${lin("(−) Custos", -K.cpv)}${lin("Lucro bruto", K.lucroBruto)}${lin("(−) Despesas operacionais", -K.despOp)}
        ${lin("<b>EBITDA</b>", K.ebitda, I.ebitda)}${lin("(−) Depreciação e amortização", -K.da)}${lin("EBIT", K.ebit)}${lin("Resultado financeiro", K.resFin)}${lin("(−) IRPJ e CSLL", -K.ir)}${lin("<b>Lucro líquido</b>", K.ll, I.ll)}</tbody></table></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Balanço e endividamento</h3><div class="tbl"><table><thead><tr><th></th><th class="dd-num">Reportado</th><th class="dd-num">Ajustes</th><th class="dd-num">Ajustado</th></tr></thead><tbody>
        ${lin("Ativo circulante", K.AC)}${lin("Ativo não circulante", K.ANC)}${lin("Ativo total", K.AT)}${lin("Passivo circulante", K.PC)}${lin("Passivo não circulante", K.PNC)}${lin("Patrimônio líquido", K.PL, I.pl)}
        ${lin("Dívida bruta (empréstimos e financiamentos)", K.divBruta)}${lin("(−) Caixa e aplicações", -K.caixa)}${lin("<b>Dívida líquida</b>", K.dl, I.dl)}${lin("Necessidade de capital de giro", K.ncg, I.ncg)}</tbody></table></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Indicadores financeiros</h3><div class="tbl"><table><thead><tr><th></th><th class="dd-num">Reportado</th><th class="dd-num">Ajustado</th></tr></thead><tbody>
        ${lr("Margem bruta", I0.mBruta, I.mBruta, pc)}${lr("Margem EBITDA", I0.mEbitda, I.mEbitda, pc)}${lr("Margem líquida", I0.mLiq, I.mLiq, pc)}
        ${lr("Liquidez corrente", I0.lc, I.lc, v => xx(v, 2))}${lr("Liquidez seca", I0.ls, I.ls, v => xx(v, 2))}${lr("Liquidez imediata", I0.li, I.li, v => xx(v, 2))}${lr("Liquidez geral", I0.lg, I.lg, v => xx(v, 2))}
        ${lr("Endividamento geral (passivo / ativo)", I0.endiv, I.endiv, pc)}${lr("Composição (curto prazo / passivo)", I0.compos, I.compos, pc)}${lr("Dívida líquida / EBITDA", I0.dlEbitda, I.dlEbitda, xx)}${lr("Cobertura de juros (EBITDA / despesa financeira)", I0.cobJuros, I.cobJuros, xx)}
        ${lr("Retorno sobre o PL (ROE)", I0.roe, I.roe, pc)}${lr("Retorno sobre o ativo (ROA)", I0.roa, I.roa, pc)}
        ${lr("Prazo médio de recebimento", K.pmr, K.pmr, dias)}${lr("Prazo médio de estocagem", K.pme, K.pme, dias)}${lr("Prazo médio de pagamento", K.pmp, K.pmp, dias)}${lr("Ciclo de caixa", K.ciclo, K.ciclo, dias)}</tbody></table></div>
        ${b.meses != 12 ? `<p class="sub" style="margin:0">Resultado de ${b.meses} meses anualizado (×${fmt(K.f, 2)}).</p>` : ""}</div>
    </div></div>`;
    host.innerHTML = h; sd.bind(host); bindComum(host, s); bindAjustes(host, s, AJ);
  };
  /* gráfico de ponte (cascata) */
  function ponte(base, L, k, l0, l1){
    const passos = [{l:l0, v:base, t:"b"}, ...L.map(a => ({l:a.titulo, v:a.v[k], t:"d"})), {l:l1, v:base + L.reduce((t, a) => t + a.v[k], 0), t:"b"}];
    const W = 640, H = 46 + passos.length * 30, x0 = 210, w = W - x0 - 90; let acc = 0;
    const pts = passos.map(p => { let a, b; if (p.t === "b"){ a = 0; b = p.v; acc = p.v; } else { a = acc; b = acc + p.v; acc = b; } return {...p, a, b}; });
    const mx = Math.max(...pts.map(p => Math.max(p.a, p.b)), 1), mn = Math.min(0, ...pts.map(p => Math.min(p.a, p.b))), sx = v => x0 + (v - mn) / (mx - mn) * w;
    return `<div style="overflow-x:auto"><svg class="dd-svg" viewBox="0 0 ${W} ${H}" width="100%" style="min-width:520px" role="img" aria-label="${l0} até ${l1}">
      ${pts.map((p, i) => { const y = 14 + i * 30, xa = sx(Math.min(p.a, p.b)), xb = sx(Math.max(p.a, p.b)), cor = p.t === "b" ? "#4FB0F5" : p.v >= 0 ? "#3DDC97" : "#FF6B6B";
        return `<text x="${x0 - 8}" y="${y + 14}" text-anchor="end" class="lb">${esc(p.l.length > 34 ? p.l.slice(0, 33) + "…" : p.l)}</text><rect x="${xa}" y="${y + 3}" width="${Math.max(2, xb - xa)}" height="16" rx="3" fill="${cor}"/><text x="${xb + 6}" y="${y + 15}">${p.t === "b" ? mi(p.v) : mil(p.v)}</text>`; }).join("")}
      <line x1="${sx(0)}" x2="${sx(0)}" y1="8" y2="${H - 8}" stroke="currentColor" stroke-opacity=".25"/></svg></div>`;
  }

  /* ---------------- VIEW · VALUATION ---------------- */
  const MULT = {Alimentos:[6, 8, .5, .8], Tecnologia:[8, 12, 2, 3.5], Saúde:[8, 11, 1.2, 2], Industrial:[5, 7, .5, .8], Agro:[5, 7, .6, 1], Educação:[7, 10, 1.2, 2], Energia:[8, 11, 3, 5], Logística:[5, 6.5, .5, .9]};
  function parametros(s, K){ const m = MULT[s.segmento] || [5, 7, .7, 1.1], v = s.dd?.val || {};
    return {mMin:v.mMin ?? m[0], mMax:v.mMax ?? m[1], rMin:v.rMin ?? m[2], rMax:v.rMax ?? m[3], cresc:v.cresc ?? (s.fin?.cresc ?? 6), wacc:v.wacc ?? 15, g:v.g ?? 4, ir:v.ir ?? 34, capex:v.capex ?? +(fmt(div(K.da, K.recLiq) * 100 || 3, 1).replace(",", ".")), ncgp:v.ncgp ?? +(fmt(div(K.ncg, K.recLiq) * 100 || 10, 1).replace(",", "."))}; }
  function fcd(K, e, P, wacc, g){
    const m = div(e, K.recLiq) || 0; let rec = K.recLiq, ncg0 = rec * P.ncgp / 100, vp = 0; const anos = [];
    for (let t = 1; t <= 5; t++){ const r1 = rec * (1 + P.cresc / 100), eb = r1 * m, da = r1 * P.capex / 100, ebit = eb - da, nopat = ebit * (1 - P.ir / 100), dncg = r1 * P.ncgp / 100 - ncg0, fcl = nopat + da - r1 * P.capex / 100 - dncg;
      vp += fcl / Math.pow(1 + wacc / 100, t); anos.push({t, rec:r1, eb, fcl}); rec = r1; ncg0 = r1 * P.ncgp / 100; }
    const tv = wacc > g ? anos[4].fcl * (1 + g / 100) / ((wacc - g) / 100) / Math.pow(1 + wacc / 100, 5) : 0;
    return {ev:vp + tv, anos, tv};
  }
  EXT_VIEWS.valuation = function(){
    const host = $("#valuation"); if (!host) return;
    const s = alvoSel(), per = s ? perSel(s) : "", b = per ? s.dd.bal[per] : null, sd = lado(s, pick, ["valuation com todos os OKs", "ajustes aguardando OK"]);
    let h = cab("Valuation", "Valuation", "Valor da empresa a partir do balancete da Due Diligence e dos ajustes com OK do consultor no valuation: múltiplos de EBITDA e de receita e fluxo de caixa descontado.");
    if (!b){ host.innerHTML = h + `<div class="dd-split">${sd.html}<div>${semBal(s)}</div></div>`; sd.bind(host); bindComum(host, s); return; }
    const K = calc(b), AJ = ajustes(s, per), Av = soma(AJ.filter(okVal)), P = parametros(s, K);
    const e = K.ebitda + Av.ebitda, dl = K.dl + Av.divida, mid = (P.mMin + P.mMax) / 2;
    const F = fcd(K, e, P, P.wacc, P.g), Fa = fcd(K, e, P, P.wacc + 1, P.g - .5), Fb = fcd(K, e, P, Math.max(P.wacc - 1, P.g + 1), P.g + .5);
    const M = [["EV / EBITDA", e * P.mMin, e * P.mMax, `${xx(P.mMin)} a ${xx(P.mMax)} o EBITDA ajustado de ${mi(e)}`], ["EV / Receita", K.recLiq * P.rMin, K.recLiq * P.rMax, `${xx(P.rMin)} a ${xx(P.rMax)} a receita líquida de ${mi(K.recLiq)}`], ["Fluxo de caixa descontado", Math.min(Fa.ev, Fb.ev), Math.max(Fa.ev, Fb.ev), `WACC ${fmt(P.wacc, 1)}% ±1 p.p.; perpetuidade ${fmt(P.g, 1)}% ±0,5 p.p.`]];
    const evMin = (M[0][1] + M[2][1]) / 2, evMax = (M[0][2] + M[2][2]) / 2;
    const pv = AJ.filter(pendVal), ev0 = (K.ebitda) * mid;
    const impacto = a => `<div class="card" style="padding:10px 12px"><b>Impacto estimado no valuation</b><div class="sub" style="margin:4px 0 0">Enterprise value ${mil(a.v.ebitda * mid)} (EBITDA ${mil(a.v.ebitda)} × ${xx(mid)}) · equity ${mil(a.v.ebitda * mid - a.v.divida)}</div></div>`;
    const fld = (id, l, v) => `<div class="fld"><label for="vp-${id}">${l}</label><input id="vp-${id}" inputmode="decimal" value="${fmt(v, 1)}" ${ed() ? "" : "disabled"}></div>`;
    h += `<div class="dd-split">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="head" style="margin:0"><div><div class="eyebrow">${esc(s.mandato?.codinome || "Target")} · ${esc(s.segmento || "")}</div><h3>${esc(s.nome)}</h3></div>${selPer(s, per)}</div>
        ${pv.length ? `<div class="banner"><b>${pv.length} ajuste(s) com OK nas Análises financeiras aguardando o OK no valuation.</b> Ainda não entram no valor abaixo.</div>` : ""}
        <div class="dd-kpis"><div class="dd-k"><span>Enterprise value</span><b>${mi(evMin)} a ${mi(evMax)}</b><small>média dos múltiplos de EBITDA e do FCD</small></div>
        <div class="dd-k"><span>(−) Dívida líquida ajustada</span><b>${mi(dl)}</b><small>reportada ${mi(K.dl)}</small></div>
        <div class="dd-k"><span>Equity value</span><b>${mi(evMin - dl)} a ${mi(evMax - dl)}</b><small>valor das ações ou quotas (100%)</small></div>
        <div class="dd-k"><span>EBITDA no valuation</span><b>${mi(e)}</b><small>reportado ${mi(K.ebitda)} · ${AJ.filter(okVal).length} ajuste(s) com OK</small></div></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Faixas de valor por método</h3>${faixas(M, evMin, evMax)}
        <div class="tbl"><table><thead><tr><th>Método</th><th class="dd-num">EV mínimo</th><th class="dd-num">EV máximo</th><th class="dd-num">Equity (médio)</th><th>Base</th></tr></thead><tbody>${M.map(m => `<tr><td><b>${m[0]}</b></td><td class="dd-num">${mi(m[1])}</td><td class="dd-num">${mi(m[2])}</td><td class="dd-num">${mi((m[1] + m[2]) / 2 - dl)}</td><td style="font-size:12.5px">${esc(m[3])}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Ajustes de Due Diligence no valuation</h3><p class="sub" style="margin:0">O consultor dá o OK aqui depois do OK nas Análises financeiras. Cada ajuste mostra o impacto estimado antes da aprovação.</p>${tabAjustes(AJ, "val")}
        ${AJ.filter(okVal).length ? ponte(K.ebitda * mid - K.dl, AJ.filter(okVal).map(a => ({...a, v:{...a.v, eq:a.v.ebitda * mid - a.v.divida}})).filter(a => a.v.eq), "eq", "Equity sem ajustes (múltiplo médio)", "Equity com ajustes") : ""}</div>
      <form class="card" id="fvp" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Premissas</h3><div class="form">
        ${fld("mMin", "EV/EBITDA mínimo (×)", P.mMin)}${fld("mMax", "EV/EBITDA máximo (×)", P.mMax)}${fld("rMin", "EV/Receita mínimo (×)", P.rMin)}${fld("rMax", "EV/Receita máximo (×)", P.rMax)}
        ${fld("cresc", "Crescimento da receita (% a.a.)", P.cresc)}${fld("wacc", "WACC (% a.a.)", P.wacc)}${fld("g", "Crescimento na perpetuidade (%)", P.g)}${fld("ir", "IRPJ e CSLL (%)", P.ir)}${fld("capex", "Capex (% da receita)", P.capex)}${fld("ncgp", "Capital de giro (% da receita)", P.ncgp)}</div>
        ${ed() ? `<button type="submit" class="btn sm" style="align-self:flex-start">Salvar premissas</button>` : ""}
        <div class="tbl"><table><thead><tr><th>FCD</th>${F.anos.map(a => `<th class="dd-num">Ano ${a.t}</th>`).join("")}</tr></thead><tbody>
          <tr><td>Receita líquida</td>${F.anos.map(a => `<td class="dd-num">${mi(a.rec)}</td>`).join("")}</tr><tr><td>EBITDA</td>${F.anos.map(a => `<td class="dd-num">${mi(a.eb)}</td>`).join("")}</tr><tr><td>Fluxo de caixa livre</td>${F.anos.map(a => `<td class="dd-num">${mi(a.fcl)}</td>`).join("")}</tr></tbody></table></div>
        <p class="sub" style="margin:0">Valor presente da perpetuidade: ${mi(F.tv)} (${pc(div(F.tv, F.ev), 0)} do EV no cenário central de ${mi(F.ev)}). Múltiplos iniciais por segmento; o consultor ajusta com transações e empresas comparáveis.</p></form>
    </div></div>`;
    host.innerHTML = h; sd.bind(host); bindComum(host, s); bindAjustes(host, s, AJ, impacto);
    const f = $("#fvp", host); if (f) f.onsubmit = ev => { ev.preventDefault(); const v = {}; ["mMin","mMax","rMin","rMax","cresc","wacc","g","ir","capex","ncgp"].forEach(k => { const x = num($("#vp-" + k).value); if (x != null) v[k] = x; }); up(s, {dd:{val:v}}).then(() => toast("Premissas salvas")); };
  };
  function faixas(M, a, b){
    const W = 680, H = 16 + (M.length + 1) * 30, x0 = 170, w = W - x0 - 150, mx = Math.max(...M.map(m => m[2]), b), mn0 = Math.min(...M.map(m => m[1]), a), mn = Math.max(0, mn0 - (mx - mn0) * .25), sx = v => x0 + (v - mn) / (mx - mn) * w;
    const L = [...M.map(m => [m[0], m[1], m[2], "#4FB0F5"]), ["Faixa de referência", a, b, "#F2C14E"]];
    return `<div style="overflow-x:auto"><svg class="dd-svg" viewBox="0 0 ${W} ${H}" width="100%" style="min-width:520px" role="img" aria-label="Faixas de valor por método">
      ${L.map((l, i) => { const y = 6 + i * 30; return `<text x="${x0 - 8}" y="${y + 16}" text-anchor="end" class="lb">${esc(l[0])}</text><rect x="${sx(l[1])}" y="${y + 3}" width="${Math.max(3, sx(l[2]) - sx(l[1]))}" height="18" rx="4" fill="${l[3]}" fill-opacity="${i === L.length - 1 ? .9 : .75}"/><text x="${sx(l[2]) + 8}" y="${y + 16}">${mi(l[1], 0)} a ${mi(l[2], 0)}</text>`; }).join("")}
    </svg></div>`;
  }
  window.KT_DD = {calc, indic, ajustes, classifica, lerTabela, csv};
})();
