/* ================= KINSEY CAPITAL · AVALIAÇÃO DE ATIVOS =================
   Pasta "Avaliação de ativos" (depois do Valuation), com três frentes sobre o controle individual de bens (CIB) do cliente:
   1) Valor justo para o PPA (CPC 15 / CPC 46): amostra que cobre 80% do valor (representatividade, não quantidade),
      inspeção com nota de 1 a 5 (ótimo, bom, regular, ruim, péssimo), vida útil remanescente, ao menos 3 cotações de
      mercado com a fonte (Brasil e exterior; moeda estrangeira convertida pela PTAX da data-base), custo de reposição
      depreciado (Ross-Heidecke, NBR 14653-5) ou fator Kinsey por estado, e a mais ou menos-valia de cada bem, levada ao PPA;
   2) Inventário físico: leitura do código de barras ou QR Code (ou digitação), foto do bem e da plaqueta, nota 1 a 5,
      vida remanescente e situação; conciliação com o CIB e com a contabilidade (localizados, não localizados, sobras);
   3) Nova vida útil e depreciação (CPC 27): valor depreciável = valor contábil − valor residual de venda líquido das
      despesas de venda, dividido pela vida remanescente.
   Saídas: planilha Excel (base do PPA e do laudo) e laudo em Word com os responsáveis técnicos. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi, pc} = D, n = v => typeof v === "number" ? (isFinite(v) ? v : null) : num(v);
  const NOTAS = [[1, "Ótimo"], [2, "Bom"], [3, "Regular"], [4, "Ruim"], [5, "Péssimo"]];
  /* Heidecke (estado de conservação) por nota e fator Kinsey simplificado (prática dos laudos anteriores) */
  const HEID = {1:.0032, 2:.0252, 3:.181, 4:.526, 5:.752}, FK = {1:.9, 2:.8, 3:.6, 4:.3, 5:.1};
  const SIT = ["Em uso", "Ocioso (sem uso)", "Danificado", "Não localizado", "Descartar"];
  /* referência por grupo: vida útil total (anos) e valor residual de venda (% do custo de reposição) */
  const GRUPOS = [[/ve[ií]cul|caminh|[oô]nibus|carro|moto|carreta|reboque/, "Veículos", 10, 30], [/inform[aá]t|computador|notebook|servidor|impressora|monitor/, "Equipamentos de informática", 5, 0],
    [/m[oó]ve(l|is)|utens/, "Móveis e utensílios", 10, 0], [/m[aá]quin|equipament|prensa|torno/, "Máquinas e equipamentos", 15, 10], [/ferrament/, "Ferramentas", 5, 0],
    [/instala/, "Instalações", 10, 0], [/edific|benfeit|pr[eé]dio|constru/, "Edificações e benfeitorias", 25, 5], [/terreno/, "Terrenos", 0, 100]];
  const grupoRef = g => { const t = String(g || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); const r = GRUPOS.find(([re]) => re.test(t)); return r ? {nome:r[1], vida:r[2], vr:r[3]} : {nome:g || "Outros", vida:10, vr:0}; };
  const dBR = iso => { const m = String(iso || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : "—"; };
  const brl = v => "R$ " + (+v || 0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2});
  const eu = () => Store.me?.email || Store.me?.nome || "";

  /* ---------------- dados ---------------- */
  const bens = s => (S.ativos || []).filter(a => a.alvoId === s.id);
  const cfg = s => ({dataBase:"", base:"liquido", cobertura:80, metodo:"ross", residual:10, obsoleto:30, intern:0, ptax:{}, vr:{}, ...(s.ativos || {})});
  async function gravarMuitos(L){
    if (Store.db){ const cid = window.KT_FB?.cid || ""; for (let i = 0; i < L.length; i += 400){ const b = Store.db.batch(); L.slice(i, i + 400).forEach(([id, o]) => b.set(Store.db.collection("ativos").doc(id), {...o, clienteId:cid})); await b.commit(); } return; }
    L.forEach(([id, o]) => { Store.local.ativos[id] = JSON.parse(JSON.stringify(o)); }); Store.saveLocal(); Store.emit("ativos");
  }
  const upd = (a, patch) => save(Store.update("ativos", a.id, patch));

  /* ---------------- importação do CIB ---------------- */
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const numBR = x => { if (x == null || x === "") return null; if (typeof x === "number") return x; const t = String(x).replace(/[R$\s]/g, ""); if (!t) return null;
    const y = /,\d{1,4}$/.test(t) ? parseFloat(t.replace(/\./g, "").replace(",", ".")) : parseFloat(t.replace(/,/g, "")); return isFinite(y) ? y : null; };
  const dataISO = x => { if (x == null || x === "") return ""; const v = +x; if (v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
    let m = String(x).match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return m[0]; m = String(x).match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; return ""; };
  function lerCIB(rows){
    rows = (rows || []).map(r => [...(r || [])].map(c => c == null ? "" : c)).filter(r => r.some(c => String(c).trim()));
    const COL = {cod:/^(c[oó]d(igo)?|plaqueta|patrim|n[ºo°]? ?(do )?(bem|patrim)|tag|chapa|id)\b|codigo patrimonial/, desc:/descri|^bem$|^item$|^ativo$|denomina/, grupo:/grupo|classe|categoria|conta|natureza|tipo/,
      local:/local|setor|centro de custo|depto|departamento|unidade/, marca:/marca|modelo|fabricante/, serie:/s[eé]rie|chassi|placa|renavam/, data:/aquisi|data|entrada|compra|incorpora/,
      custo:/custo|valor (de )?(aquisi|original|hist|bruto)|valor bruto|valor de compra|valor original/, depr:/deprec\w* acum|acumulad|deprecia[cç][aã]o$/, liq:/residual|l[ií]quido|cont[aá]bil|saldo|valor atual/,
      vida:/vida [uú]til|^vu\b|vida \(anos\)/, taxa:/taxa|% ?a\.?a|percentual/};
    const score = r => r.reduce((t, c) => t + (Object.values(COL).some(re => re.test(nrm(c))) ? 1 : 0), 0);
    let hi = 0, best = -1; rows.slice(0, 25).forEach((r, i) => { const p = score(r); if (p > best){ best = p; hi = i; } }); if (best < 2) throw new Error("não encontrei o cabeçalho (código, descrição, custo)");
    const H = rows[hi].map(nrm), ix = (re, ex = []) => H.findIndex((h, j) => re.test(h) && !ex.includes(j));
    const c = {}; c.depr = ix(COL.depr); c.liq = ix(COL.liq, [c.depr]); c.custo = ix(COL.custo, [c.depr, c.liq]); c.cod = ix(COL.cod); c.desc = ix(COL.desc, [c.cod]); c.grupo = ix(COL.grupo, [c.desc, c.cod]);
    c.local = ix(COL.local, [c.grupo]); c.marca = ix(COL.marca); c.serie = ix(COL.serie); c.data = ix(COL.data); c.vida = ix(COL.vida); c.taxa = ix(COL.taxa, [c.vida]);
    if (c.desc < 0 || (c.custo < 0 && c.liq < 0)) throw new Error("a planilha precisa ter a descrição e o custo ou o valor contábil");
    const v = (r, k) => c[k] >= 0 ? r[c[k]] : "", hoje = new Date();
    return rows.slice(hi + 1).filter(r => String(v(r, "desc")).trim()).map((r, i) => {
      const custo = numBR(v(r, "custo")), depr = numBR(v(r, "depr")), liq0 = numBR(v(r, "liq")), data = dataISO(v(r, "data"));
      const liq = liq0 != null ? liq0 : custo != null ? custo - Math.abs(depr || 0) : null, taxa = numBR(v(r, "taxa")), vida = numBR(v(r, "vida")) || (taxa > 0 ? 100 / (taxa > 1 ? taxa : taxa * 100) : null);
      const idade = data ? (hoje - new Date(data + "T12:00:00")) / 3.156e10 : null;
      return {codigo:String(v(r, "cod") || "").trim() || `L${i + 1}`, descricao:String(v(r, "desc")).trim(), grupo:String(v(r, "grupo") || "").trim(), local:String(v(r, "local") || "").trim(), marca:String(v(r, "marca") || "").trim(), serie:String(v(r, "serie") || "").trim(),
        aquisicao:data, custo:custo ?? liq ?? 0, deprAcum:depr != null ? Math.abs(depr) : (custo != null && liq != null ? custo - liq : 0), vlContabil:liq ?? 0, vidaUtil:vida || null, vidaRemCont:vida && idade != null ? Math.max(0, +(vida - idade).toFixed(1)) : null};
    });
  }

  /* ---------------- valor justo ---------------- */
  function ptaxDe(s, moeda){ const C = cfg(s); return moeda === "BRL" ? 1 : n(C.ptax?.[moeda]) || null; }
  function cotBRL(s, q){ const fx = ptaxDe(s, q.moeda || "BRL"); if (!fx) return null; const C = cfg(s); return n(q.valor) * fx * (q.pais === "Exterior" && q.tipo !== "usado" ? 1 + n(C.intern || 0) / 100 : 1); }
  function avaliar(s, a){
    const C = cfg(s), G = grupoRef(a.grupo), av = [], cot = (a.cot || []).map(q => ({...q, brl:cotBRL(s, q)}));
    const novos = cot.filter(q => q.brl > 0 && q.tipo !== "usado"), usados = cot.filter(q => q.brl > 0 && q.tipo === "usado");
    const vrn = n(a.vrnManual) > 0 ? n(a.vrnManual) : novos.length ? novos.reduce((t, q) => t + q.brl, 0) / novos.length : null;
    const vT = n(a.vidaTotal) || n(a.vidaUtil) || G.vida, vR = a.vidaRem != null && a.vidaRem !== "" ? n(a.vidaRem) : null, nota = +a.nota || null;
    if (a.amostra){ if (cot.length < 3) av.push(`${3 - cot.length} cotação(ões) a obter (mínimo 3)`); if (cot.some(q => q.moeda !== "BRL" && !ptaxDe(s, q.moeda))) av.push("informar a PTAX da moeda estrangeira");
      if (!nota) av.push("nota de 1 a 5 da inspeção"); if (vR == null) av.push("vida útil remanescente"); }
    if (a.situacao === "Não localizado" || a.situacao === "Descartar") return {vrn, vj:0, k:1, metodo:"baixa (não localizado ou descarte)", mv:-n(a.vlContabil), av, cot, vT, vR};
    if (!vrn && !usados.length) return {vrn:null, vj:null, mv:null, av, cot, vT, vR};
    let vj, k = null, metodo;
    if (usados.length && !vrn){ vj = usados.reduce((t, q) => t + q.brl, 0) / usados.length; metodo = "comparativo direto (bens usados semelhantes)"; }
    else if (C.metodo === "kinsey"){ const f = vR != null && vT && vT - vR < 1 ? 1 : FK[nota || 2]; vj = vrn * f; k = 1 - f; metodo = `fator Kinsey por estado (${Math.round(f * 100)}%)`; }
    else { const x = vT > 0 && vR != null ? Math.min(1, Math.max(0, (vT - vR) / vT)) : .5, ross = .5 * (x + x * x), c = HEID[nota || 2], R = (a.residualPct != null && a.residualPct !== "" ? n(a.residualPct) : C.residual) / 100;
      k = ross + (1 - ross) * c; vj = vrn * (R + (1 - R) * (1 - k)); metodo = `Ross-Heidecke (idade ${(x * 100).toFixed(0)}% da vida, estado ${NOTAS[(nota || 2) - 1][1].toLowerCase()})`; }
    if (a.situacao === "Ocioso (sem uso)") { vj *= 1 - C.obsoleto / 100; metodo += ` · obsolescência por ociosidade ${C.obsoleto}%`; }
    if (a.situacao === "Danificado" && nota !== 5) av.push("bem danificado: confirme a nota 5 (péssimo)");
    return {vrn, vj, k, metodo, mv:vj - n(a.vlContabil), av, cot, vT, vR, deprNova:vR > 0 ? vj / vR : null};
  }
  const baseValor = (s, a) => cfg(s).base === "custo" ? n(a.custo) : n(a.vlContabil);
  function cobertura(s){ const L = bens(s), tot = L.reduce((t, a) => t + Math.max(0, baseValor(s, a)), 0), am = L.filter(a => a.amostra).reduce((t, a) => t + Math.max(0, baseValor(s, a)), 0); return {tot, am, pct:tot ? am / tot : 0}; }
  async function selecionar80(s){
    const C = cfg(s), L = bens(s).slice().sort((a, b) => baseValor(s, b) - baseValor(s, a)), tot = L.reduce((t, a) => t + Math.max(0, baseValor(s, a)), 0); let acc = 0; const sel = new Set();
    for (const a of L){ if (acc >= tot * C.cobertura / 100) break; sel.add(a.id); acc += Math.max(0, baseValor(s, a)); }
    await gravarMuitos(bens(s).filter(a => !!a.amostra !== sel.has(a.id)).map(a => { const {id, ...o} = a; return [id, {...o, amostra:sel.has(id)}]; }));
    return sel.size;
  }
  function resumo(s){
    const L = bens(s), A = L.filter(a => a.amostra).map(a => ({a, r:avaliar(s, a)})), por = {};
    A.forEach(({a, r}) => { const g = grupoRef(a.grupo).nome, o = por[g] ||= {g, n:0, cont:0, vj:0, mais:0, menos:0, pend:0}; o.n++; o.cont += n(a.vlContabil);
      if (r.vj != null){ o.vj += r.vj; if (r.mv >= 0) o.mais += r.mv; else o.menos += r.mv; } else o.pend++; });
    const G = Object.values(por).sort((x, y) => y.cont - x.cont), T = G.reduce((t, o) => ({n:t.n + o.n, cont:t.cont + o.cont, vj:t.vj + o.vj, mais:t.mais + o.mais, menos:t.menos + o.menos, pend:t.pend + o.pend}), {n:0, cont:0, vj:0, mais:0, menos:0, pend:0});
    const vidaPond = (() => { const w = A.filter(x => x.r.mv && x.r.vR > 0); const sw = w.reduce((t, x) => t + Math.abs(x.r.mv), 0); return sw ? w.reduce((t, x) => t + Math.abs(x.r.mv) * x.r.vR, 0) / sw : null; })();
    return {A, G, T, mv:T.mais + T.menos, vidaPond, cob:cobertura(s), avisos:A.filter(x => x.r.av.length).length};
  }

  /* ---------------- inventário e nova depreciação ---------------- */
  function inventario(s){
    const L = bens(s), cib = L.filter(a => a.origem !== "sobra"), loc = cib.filter(a => a.inv?.em), sob = L.filter(a => a.origem === "sobra"), nl = cib.filter(a => !a.inv?.em);
    const v = x => x.reduce((t, a) => t + n(a.vlContabil), 0);
    return {cib, loc, sob, nl, pct:cib.length ? loc.length / cib.length : 0, pctV:v(cib) ? v(loc) / v(cib) : 0, vCib:v(cib), vLoc:v(loc), vNl:v(nl)};
  }
  function novaDepr(s, a){
    const C = cfg(s), G = grupoRef(a.grupo), vr0 = C.vr?.[G.nome] || {}, pct = a.vrPct != null && a.vrPct !== "" ? n(a.vrPct) : vr0.pct ?? G.vr, desp = vr0.desp ?? 5;
    const vR = n(a.inv?.vidaRem ?? a.vidaRem), vrLiq = n(a.custo) * pct / 100 * (1 - desp / 100), depreciavel = Math.max(0, n(a.vlContabil) - vrLiq);
    return {vR, vrLiq, depreciavel, anual:vR > 0 ? depreciavel / vR : null, taxa:vR > 0 && n(a.custo) ? depreciavel / vR / n(a.custo) : null, pct, desp};
  }

  /* ---------------- PTAX (Banco Central) ---------------- */
  async function buscarPtax(moeda, iso){
    const d = new Date(iso + "T12:00:00");
    for (let k = 0; k < 7; k++){ const x = new Date(d); x.setDate(d.getDate() - k); const f = `${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}-${x.getFullYear()}`;
      const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${moeda}'&@dataCotacao='${f}'&$format=json`;
      const j = await (await fetch(url)).json(), v = (j.value || []).filter(r => /fechamento/i.test(r.tipoBoletim || "")).pop() || (j.value || []).pop();
      if (v?.cotacaoVenda) return {valor:v.cotacaoVenda, data:x.toISOString().slice(0, 10)}; }
    throw new Error("sem cotação");
  }

  /* ---------------- Excel ---------------- */
  async function excel(s){
    const C = cfg(s), R = resumo(s), I = inventario(s), H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), P = v => ({v, s:"p"}), B = v => ({v, s:"b"}), nome = s.mandato?.codinome || s.nome;
    const cab = (t, sub) => [[T(`${t} · ${nome}`)], [sub || `Valores em R$ · data-base ${dBR(C.dataBase) || "a definir"} · emitido em ${new Date().toLocaleDateString("pt-BR")}`], []];
    const abas = [
      {nome:"Resumo", larguras:[34, 10, 18, 18, 18, 18, 18, 14], linhas:[...cab("Avaliação de ativos a valor justo · mais e menos-valia por grupo", `Cobertura da amostra: ${pc(R.cob.pct, 1)} do ${C.base === "custo" ? "custo" : "valor contábil"} · método ${C.metodo === "kinsey" ? "fator Kinsey por estado" : "Ross-Heidecke"} · data-base ${dBR(C.dataBase)}`),
        [H("Grupo"), H("Bens"), H("Contábil"), H("Valor justo"), H("Mais-valia"), H("Menos-valia"), H("Líquido"), H("Sem valor ainda")], ...R.G.map(o => [o.g, o.n, o.cont, o.vj, o.mais, o.menos, o.mais + o.menos, o.pend || ""]),
        [B("Total"), B(R.T.n), B(R.T.cont), B(R.T.vj), B(R.T.mais), B(R.T.menos), B(R.mv), B(R.T.pend || "")], [], ["Vida remanescente ponderada (para a realização fiscal)", R.vidaPond ? +R.vidaPond.toFixed(1) : "—"], ["Bens da amostra com pendências", R.avisos]]},
      {nome:"Amostra valor justo", larguras:[12, 40, 22, 14, 14, 10, 12, 10, 10, 16, 8, 16, 16, 42, 40], linhas:[...cab("Bens avaliados (amostra de " + pc(R.cob.pct, 0) + " do valor)"),
        [H("Código"), H("Descrição"), H("Grupo"), H("Custo"), H("Contábil"), H("Nota"), H("Situação"), H("Vida total"), H("Vida rem."), H("Reposição novo"), H("Cotações"), H("Valor justo"), H("Mais/menos-valia"), H("Método"), H("Pendências")],
        ...R.A.map(({a, r}) => [a.codigo, a.descricao, grupoRef(a.grupo).nome, n(a.custo), n(a.vlContabil), a.nota ? `${a.nota} · ${NOTAS[a.nota - 1][1]}` : "", a.situacao || "Em uso", r.vT || "", r.vR ?? "", r.vrn ?? "", (a.cot || []).length, r.vj ?? "", r.mv ?? "", r.metodo || "", r.av.join("; ")])]},
      {nome:"Cotações", larguras:[12, 34, 30, 40, 10, 8, 14, 14, 10, 12], linhas:[...cab("Cotações de mercado (fontes)", `PTAX na data-base: ${Object.entries(C.ptax || {}).filter(([k]) => /^[A-Z]{3}$/.test(k)).map(([k, v]) => `${k} ${String(v).replace(".", ",")}`).join(" · ") || "não informada"}${C.ptax?.fonte ? " · " + C.ptax.fonte : ""}`),
        [H("Código"), H("Bem"), H("Fonte"), H("Endereço (URL)"), H("País"), H("Moeda"), H("Valor"), H("Valor em R$"), H("Tipo"), H("Data")],
        ...R.A.flatMap(({a, r}) => r.cot.map(q => [a.codigo, a.descricao, q.fonte || "", q.url || "", q.pais || "Brasil", q.moeda || "BRL", n(q.valor), q.brl ?? "", q.tipo || "novo", dBR(q.data)]))]},
      {nome:"Inventário", larguras:[12, 40, 22, 20, 14, 10, 10, 12, 30, 22, 14], linhas:[...cab("Inventário físico e conciliação com o CIB", `Localizados ${I.loc.length} de ${I.cib.length} (${pc(I.pct, 0)} dos bens; ${pc(I.pctV, 0)} do valor) · não localizados ${I.nl.length} · sobras ${I.sob.length}`),
        [H("Código"), H("Descrição"), H("Grupo"), H("Local"), H("Contábil"), H("Situação inv."), H("Nota"), H("Vida rem."), H("Observação"), H("Inventariado por"), H("Data")],
        ...I.cib.map(a => [a.codigo, a.descricao, grupoRef(a.grupo).nome, a.inv?.local || a.local, n(a.vlContabil), a.inv?.em ? "Localizado" : "Não localizado", a.inv?.nota || "", a.inv?.vidaRem ?? "", a.inv?.obs || "", a.inv?.por || "", a.inv?.em ? dBR(a.inv.em) : ""]),
        ...I.sob.map(a => [a.codigo, a.descricao, grupoRef(a.grupo).nome, a.inv?.local || "", 0, "Sobra (fora do CIB)", a.inv?.nota || "", a.inv?.vidaRem ?? "", a.inv?.obs || "", a.inv?.por || "", a.inv?.em ? dBR(a.inv.em) : ""])]},
      {nome:"Nova depreciação", larguras:[12, 40, 22, 14, 14, 10, 10, 14, 14, 10, 14, 10], linhas:[...cab("Revisão da vida útil e do valor residual (CPC 27)", "Valor depreciável = valor contábil − valor residual de venda líquido das despesas de venda; depreciação anual = depreciável ÷ vida remanescente"),
        [H("Código"), H("Descrição"), H("Grupo"), H("Custo"), H("Contábil"), H("VR (% custo)"), H("Desp. venda"), H("VR líquido"), H("Depreciável"), H("Vida rem."), H("Depreciação anual"), H("Taxa a.a.")],
        ...bens(s).filter(a => a.origem !== "sobra" && n(a.inv?.vidaRem ?? a.vidaRem) > 0).map(a => { const d = novaDepr(s, a); return [a.codigo, a.descricao, grupoRef(a.grupo).nome, n(a.custo), n(a.vlContabil), P(d.pct / 100), P(d.desp / 100), d.vrLiq, d.depreciavel, d.vR, d.anual ?? "", d.taxa != null ? P(d.taxa) : ""]; })]},
      {nome:"Premissas", larguras:[48, 18, 60], linhas:[...cab("Premissas e métodos"), [H("Item"), H("Valor"), H("Observação")],
        ["Data-base", dBR(C.dataBase), "data de aquisição no PPA"], ["Base da representatividade", C.base === "custo" ? "custo de aquisição" : "valor contábil líquido", ""], ["Cobertura mínima da amostra", P(C.cobertura / 100), "exigência usual de revisão (Big Four): 80% do valor"],
        ["Método", C.metodo === "kinsey" ? "fator Kinsey por estado" : "custo de reposição depreciado · Ross-Heidecke", "NBR 14653-5 (máquinas, equipamentos, instalações e bens industriais)"], ["Valor residual (Ross-Heidecke)", P(C.residual / 100), "% do custo de reposição"],
        ["Obsolescência por ociosidade", P(C.obsoleto / 100), "bens sem uso não geram caixa"], ["Custo de internação de bens importados", P(n(C.intern) / 100), "frete, seguro e tributos sobre cotações do exterior"], [],
        [B("Estado (nota)"), B("Heidecke"), B("Fator Kinsey")], ...NOTAS.map(([k, l]) => [`${k} · ${l}`, P(HEID[k]), P(FK[k])]), [],
        [B("Grupo"), B("Vida útil de referência"), B("Valor residual de venda (% do custo)")], ...GRUPOS.map(g => [g[1], g[2], P(g[3] / 100)])]}];
    await rptSave(KT_XLSX.gerar(abas), `Avaliacao_ativos_${(nome || "").replace(/[^\wÀ-ú]+/g, "_").slice(0, 30)}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }

  /* ---------------- laudo (Word) ---------------- */
  const assinaturas = () => S.config.assinaturas_ativos?.lista?.length ? S.config.assinaturas_ativos.lista : (typeof MA_ASSINATURAS_ATIVOS !== "undefined" ? MA_ASSINATURAS_ATIVOS : []);
  async function laudo(s){
    const C = cfg(s), R = resumo(s), I = inventario(s), X = KT_DOCX, P = [], t = (x, o = {}) => P.push({t:x, ...o}), h = x => P.push({t:x, b:true, keep:true, before:200});
    const emp = s.receita?.razao || s.nome, mk = window.KT_MARCA ? KT_MARCA.kinsey() : true, marca = mk ? "Kinsey BR" : (window.KT_MARCA ? KT_MARCA.curto() : "Assessoria");
    t("LAUDO DE AVALIAÇÃO DE ATIVOS IMOBILIZADOS", {b:true, jc:"center", sz:26, after:120}); t(emp, {b:true, jc:"center"}); t(`Data-base: ${dBR(C.dataBase)} · Emitido em ${new Date().toLocaleDateString("pt-BR")}`, {jc:"center", after:300});
    h("1. Sumário executivo");
    t(`${marca} avaliou os bens do ativo imobilizado de ${emp} na data-base de ${dBR(C.dataBase)}, ${R.A.length ? `com amostra de ${R.A.length} bens que representam ${pc(R.cob.pct, 1)} do ${C.base === "custo" ? "custo de aquisição" : "valor contábil"}` : "conforme o escopo contratado"}${I.loc.length ? ` e inventário físico de ${I.loc.length} bens` : ""}.`);
    if (R.A.length) t(`Valor contábil dos bens avaliados: ${brl(R.T.cont)}. Valor justo apurado: ${brl(R.T.vj)}. Mais-valia: ${brl(R.T.mais)}. Menos-valia: ${brl(R.T.menos)}. Resultado líquido: ${brl(R.mv)}.`, {b:true});
    h("2. Finalidade e normas");
    t("Determinar o valor justo dos bens para a alocação do preço de compra em combinação de negócios (CPC 15 e CPC 46), apurar a mais ou menos-valia em relação ao valor contábil (CPC 27) e, quando contratado, conciliar o inventário físico com o controle individual de bens e revisar a vida útil e o valor residual. Normas de referência: ABNT NBR 14653-1 (procedimentos gerais) e NBR 14653-5 (máquinas, equipamentos, instalações e bens industriais).");
    h("3. Escopo e amostra");
    t(`Base: controle individual de bens fornecido pela empresa (${bens(s).filter(a => a.origem !== "sobra").length} itens). A amostra foi definida por representatividade de valor, cobrindo ${pc(R.cob.pct, 1)} do total (mínimo de ${C.cobertura}%), e não por quantidade de itens; os demais bens permanecem pelo valor contábil.`);
    h("4. Metodologia");
    t(`Custo de reposição: média de ao menos três cotações de mercado de bens novos equivalentes, com as fontes identificadas; bens relevantes incluem ao menos uma cotação do exterior, convertida pela PTAX de venda do Banco Central na data-base${Object.keys(C.ptax || {}).filter(k => /^[A-Z]{3}$/.test(k)).length ? ` (${Object.entries(C.ptax).filter(([k]) => /^[A-Z]{3}$/.test(k)).map(([k, v]) => `${k} ${String(v).replace(".", ",")}`).join("; ")})` : ""}${n(C.intern) ? `, acrescida de ${C.intern}% de custos de internação` : ""}.`);
    t(C.metodo === "kinsey" ? "Depreciação: fator por estado de conservação observado na inspeção (ótimo 90%, bom 80%, regular 60%, ruim 30%, péssimo 10%; bens com menos de um ano, 100%)." : `Depreciação: método de Ross-Heidecke, que combina a idade aparente (vida útil total menos a vida remanescente atribuída na inspeção) com o estado de conservação (nota de 1 a 5), preservando valor residual de ${C.residual}% do custo de reposição.`);
    t(`Bens ociosos recebem obsolescência adicional de ${C.obsoleto}% por não gerarem caixa; bens não localizados ou para descarte têm valor justo nulo (menos-valia igual ao valor contábil).`);
    if (R.G.length){ h("5. Resultado por grupo"); R.G.forEach(o => t(`${o.g}: ${o.n} bens · contábil ${brl(o.cont)} · valor justo ${brl(o.vj)} · mais-valia ${brl(o.mais)} · menos-valia ${brl(o.menos)}${o.pend ? ` · ${o.pend} pendente(s)` : ""}`, {ind:240})); }
    if (I.loc.length || I.sob.length){ h("6. Inventário físico e conciliação");
      t(`Localizados ${I.loc.length} de ${I.cib.length} bens do controle (${pc(I.pct, 1)}; ${pc(I.pctV, 1)} do valor contábil). Não localizados: ${I.nl.length} (${brl(I.vNl)}). Sobras físicas fora do controle: ${I.sob.length}. Cada bem inventariado tem foto do item e da plaqueta, nota de conservação e vida remanescente.`); }
    h(`${I.loc.length || I.sob.length ? 7 : 6}. Vida útil e valor residual (CPC 27)`);
    t("A depreciação revisada considera o valor residual de venda esperado ao fim do período de uso, líquido das despesas de venda: valor depreciável = valor contábil − valor residual líquido, dividido pela vida remanescente. Bens que a empresa pretende vender antes do fim da vida física (ex.: frota renovada por exigência regulatória) têm valor residual relevante, apurado por pesquisa de mercado.");
    h("Ressalvas"); t("As informações do controle individual de bens e da contabilidade foram fornecidas pela empresa e não foram auditadas. Não foram verificados ônus, gravames ou a regularidade documental dos bens. Os valores refletem as condições de mercado na data-base.");
    h("Responsáveis"); assinaturas().forEach(a => { P.push({t:"______________________________________________", jc:"left", before:360, after:0}); t(a.nome, {b:true, jc:"left", after:0}); t([a.papel, a.registro].filter(Boolean).join(" · "), {jc:"left"}); });
    if (!assinaturas().length) t("[Responsável técnico (engenheiro, CREA) e responsáveis pela empresa avaliadora]", {jc:"left"});
    const bytes = X.build(P, {header:`Laudo de avaliação de ativos · ${s.mandato?.codinome || emp} · data-base ${dBR(C.dataBase)}`, headerColor:"5A6578", titulo:"Laudo de avaliação de ativos"});
    await rptSave(bytes, `Laudo_avaliacao_ativos_${(s.mandato?.codinome || s.nome || "").replace(/[^\wÀ-ú]+/g, "_").slice(0, 30)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  }

  /* ---------------- telas ---------------- */
  const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
  const ABAS = [["base", "Base de bens (CIB)"], ["vj", "Valor justo · PPA"], ["inv", "Inventário físico"], ["depr", "Nova depreciação"]];
  window.KT_ATV_ABAS = window.KT_ATV_ABAS || [];
  function vBase(s){
    const L = bens(s), C = cfg(s), I = inventario(s), ed = D.ed() ? "" : "disabled";
    let bal = null; try{ if (D.temBal(s)){ const K = KT_VAL.resumo(s).X?.bp?.K; if (K?.G) bal = {imob:(K.G.imobilizado || 0), dep:(K.G.deprec || 0)}; } }catch(e){}
    const cont = L.filter(a => a.origem !== "sobra").reduce((t, a) => t + n(a.vlContabil), 0), custo = L.filter(a => a.origem !== "sobra").reduce((t, a) => t + n(a.custo), 0);
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3 style="margin:0">Controle individual de bens (CIB)</h3><p class="sub" style="margin:2px 0 0">Importe a planilha do cliente (código ou plaqueta, descrição, grupo, local, data de aquisição, custo, depreciação acumulada, valor contábil, vida útil). A vida útil e a remanescente contábeis ficam ao lado para o consultor comparar na inspeção.</p></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><label class="btn sm primary">Importar CIB (Excel ou CSV)<input type="file" id="at-cib" accept=".xlsx,.csv,.txt" hidden ${ed}></label>${L.length && D.ed() ? `<button type="button" class="btn sm ghost" id="at-limpa">Apagar a base deste target</button>` : ""}</div>
      <div class="form"><div class="fld"><label for="at-db">Data-base da avaliação</label><input id="at-db" type="date" value="${esc(C.dataBase || "")}" ${ed}></div></div>
      ${L.length ? `<div class="dd-kpis">${k("Bens no CIB", I.cib.length.toLocaleString("pt-BR"), I.sob.length ? `+ ${I.sob.length} sobra(s) do inventário` : "")}${k("Custo de aquisição", mi(custo))}${k("Valor contábil", mi(cont))}${bal ? k("Balancete (imobilizado líquido)", mi(bal.imob + bal.dep), `diferença ${mi(bal.imob + bal.dep - cont)}`) : k("Conciliação contábil", "—", "importe o balancete na Due Diligence")}</div>
        <div class="tbl" style="max-height:340px;overflow:auto"><table><thead><tr><th>Código</th><th>Descrição</th><th>Grupo</th><th class="dd-num">Custo</th><th class="dd-num">Contábil</th><th class="dd-num">Vida útil</th><th class="dd-num">Rem. contábil</th></tr></thead><tbody>${L.slice().sort((a, b) => n(b.vlContabil) - n(a.vlContabil)).slice(0, 300).map(a => `<tr><td class="mono">${esc(a.codigo)}</td><td>${esc(a.descricao)}</td><td>${esc(grupoRef(a.grupo).nome)}</td><td class="dd-num">${brl(a.custo)}</td><td class="dd-num">${brl(a.vlContabil)}</td><td class="dd-num">${a.vidaUtil ?? "—"}</td><td class="dd-num">${a.vidaRemCont ?? "—"}</td></tr>`).join("")}</tbody></table></div>
        ${L.length > 300 ? `<p class="sub" style="margin:0;font-size:12px">Mostrando os 300 maiores de ${L.length}; a planilha traz todos.</p>` : ""}` : `<p class="sub" style="margin:0">Nenhum bem importado para este target.</p>`}<p class="err" id="at-err" hidden></p></div>`;
  }
  function vVJ(s){
    const C = cfg(s), R = resumo(s), ed = D.ed() ? "" : "disabled", L = bens(s).filter(a => a.origem !== "sobra");
    if (!L.length) return `<div class="empty">Importe primeiro o controle individual de bens na aba "Base de bens".</div>`;
    const moedas = ["USD", "EUR"];
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">CPC 15 · CPC 46 · NBR 14653-5</div><h3 style="margin:0">Valor justo dos bens · mais e menos-valia para o PPA</h3>
        <p class="sub" style="margin:2px 0 0">Amostra por representatividade de valor (mínimo ${C.cobertura}%), inspeção com nota de 1 a 5, vida remanescente e ao menos 3 cotações por bem (uma do exterior nos bens relevantes, convertida pela PTAX da data-base).</p></div></div>
      <div class="dd-kpis">${k("Cobertura da amostra", pc(R.cob.pct, 1), `${R.A.length} bem(ns) · ${mi(R.cob.am)} de ${mi(R.cob.tot)}`)}${k("Valor contábil (amostra)", mi(R.T.cont))}${k("Valor justo", mi(R.T.vj), R.T.pend ? `${R.T.pend} sem valor ainda` : "")}${k("Mais ou menos-valia", mi(R.mv), `mais ${mi(R.T.mais)} · menos ${mi(R.T.menos)}`)}</div>
      ${R.cob.pct < C.cobertura / 100 ? `<div class="banner" style="font-size:13px">A amostra cobre ${pc(R.cob.pct, 1)}; o mínimo é ${C.cobertura}% do valor. Use "Selecionar ${C.cobertura}% do valor" ou marque mais bens.</div>` : ""}
      <form id="at-cf" class="form" novalidate><div class="fld"><label for="at-base">Representatividade sobre</label><select id="at-base" ${ed}><option value="liquido" ${C.base !== "custo" ? "selected" : ""}>Valor contábil líquido</option><option value="custo" ${C.base === "custo" ? "selected" : ""}>Custo de aquisição</option></select></div>
        <div class="fld"><label for="at-cob">Cobertura mínima (%)</label><input id="at-cob" inputmode="decimal" value="${C.cobertura}" ${ed}></div>
        <div class="fld"><label for="at-met">Método</label><select id="at-met" ${ed}><option value="ross" ${C.metodo !== "kinsey" ? "selected" : ""}>Ross-Heidecke (idade + estado)</option><option value="kinsey" ${C.metodo === "kinsey" ? "selected" : ""}>Fator Kinsey por estado</option></select></div>
        <div class="fld"><label for="at-res">Valor residual Ross-Heidecke (%)</label><input id="at-res" inputmode="decimal" value="${C.residual}" ${ed}></div><div class="fld"><label for="at-obs">Obsolescência de bem ocioso (%)</label><input id="at-obs" inputmode="decimal" value="${C.obsoleto}" ${ed}></div>
        <div class="fld"><label for="at-int">Internação de importados (%)</label><input id="at-int" inputmode="decimal" value="${C.intern || 0}" ${ed}></div>
        ${moedas.map(m => `<div class="fld"><label for="at-px-${m}">PTAX ${m} na data-base</label><input id="at-px-${m}" inputmode="decimal" value="${C.ptax?.[m] ? String(C.ptax[m]).replace(".", ",") : ""}" placeholder="R$ por ${m}" ${ed}></div>`).join("")}
        <div class="fld full" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">${D.ed() ? `<button type="submit" class="btn sm">Salvar premissas</button><button type="button" class="btn sm" id="at-ptax" ${C.dataBase ? "" : "disabled"}>Buscar PTAX no Banco Central</button><button type="button" class="btn sm primary" id="at-80">Selecionar ${C.cobertura}% do valor</button>` : ""}${C.ptax?.fonte ? `<span class="sub" style="font-size:12px">${esc(C.ptax.fonte)}</span>` : ""}</div></form>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="at-ppa" ${R.A.length && D.ed() ? "" : "disabled"}>Levar a mais ou menos-valia ao PPA</button><button type="button" class="btn sm" id="at-xl">Planilha (Excel)</button><button type="button" class="btn sm" id="at-ld">Laudo (Word)</button></div>
      ${s.pos?.ppa?.imobFonte ? `<p class="sub" style="margin:0;font-size:12.5px">No PPA: ${esc(s.pos.ppa.imobFonte)}.</p>` : ""}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:0">Bens · ${C.base === "custo" ? "custo" : "valor contábil"} em ordem decrescente</h3>
        <div class="tbl" style="max-height:520px;overflow:auto"><table><thead><tr><th></th><th>Bem</th><th class="dd-num">Contábil</th><th>Nota</th><th class="dd-num">Vida rem.</th><th class="dd-num">Cotações</th><th class="dd-num">Valor justo</th><th class="dd-num">Mais/menos</th><th></th></tr></thead><tbody>
        ${L.slice().sort((a, b) => baseValor(s, b) - baseValor(s, a)).slice(0, 400).map(a => { const r = avaliar(s, a); return `<tr ${a.amostra ? "" : 'style="opacity:.6"'}><td><input type="checkbox" data-am="${a.id}" ${a.amostra ? "checked" : ""} ${ed} aria-label="Na amostra"></td>
          <td style="min-width:220px"><b>${esc(a.descricao)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(a.codigo)} · ${esc(grupoRef(a.grupo).nome)}${a.vidaRemCont != null ? ` · rem. contábil ${a.vidaRemCont} anos` : ""}${r.av.length ? ` · <span style="color:var(--warn,#F2C14E)">${esc(r.av.join("; "))}</span>` : ""}</div></td>
          <td class="dd-num">${brl(a.vlContabil)}</td><td>${a.nota ? `${a.nota} · ${NOTAS[a.nota - 1][1]}` : "—"}${a.situacao && a.situacao !== "Em uso" ? `<div class="sub" style="margin:0;font-size:11px">${esc(a.situacao)}</div>` : ""}</td><td class="dd-num">${r.vR ?? "—"}</td><td class="dd-num">${(a.cot || []).length}</td>
          <td class="dd-num">${r.vj != null ? brl(r.vj) : "—"}</td><td class="dd-num" style="color:${r.mv > 0 ? "var(--ok)" : r.mv < 0 ? "var(--bad)" : "inherit"}">${r.mv != null ? brl(r.mv) : "—"}</td><td><button type="button" class="btn sm" data-av="${a.id}">Avaliar</button></td></tr>`; }).join("")}</tbody></table></div></div>`;
  }
  function vInv(s){
    const I = inventario(s), ed = D.ed() ? "" : "disabled", rec = bens(s).filter(a => a.inv?.em).sort((a, b) => String(b.inv.em).localeCompare(a.inv.em)).slice(0, 30);
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">Campo · celular ou tablet</div><h3 style="margin:0">Inventário físico</h3>
        <p class="sub" style="margin:2px 0 0">Leia o código de barras ou o QR Code da plaqueta (ou digite o código), fotografe o bem e a plaqueta, dê a nota de 1 a 5 e a vida remanescente. Cada registro sobe na hora e concilia com o CIB.</p></div></div>
      <div><button type="button" class="btn primary" id="iv-novo" ${ed} style="min-height:48px;font-size:15px">Registrar bem</button></div>
      <div class="dd-kpis">${k("Localizados", `${I.loc.length} de ${I.cib.length}`, `${pc(I.pct, 0)} dos bens · ${pc(I.pctV, 0)} do valor`)}${k("Não localizados", String(I.nl.length), mi(I.vNl))}${k("Sobras (fora do CIB)", String(I.sob.length))}</div>
      ${rec.length ? `<div class="tbl"><table><thead><tr><th>Registrado</th><th>Bem</th><th>Nota</th><th class="dd-num">Vida rem.</th><th>Fotos</th></tr></thead><tbody>${rec.map(a => `<tr><td>${dBR(a.inv.em)}<div class="sub" style="margin:0;font-size:11px">${esc(a.inv.por || "")}</div></td><td><b>${esc(a.descricao)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(a.codigo)}${a.origem === "sobra" ? " · sobra" : ""} · ${esc(a.inv.local || a.local || "")}</div></td><td>${a.inv.nota ? `${a.inv.nota} · ${NOTAS[a.inv.nota - 1][1]}` : "—"}</td><td class="dd-num">${a.inv.vidaRem ?? "—"}</td><td>${[a.inv.foto, a.inv.fotoPlaq].filter(Boolean).map(f => `<a href="${esc(f.url)}" target="_blank" rel="noopener"><img src="${esc(f.url)}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px;margin-right:4px"></a>`).join("")}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${I.nl.length && I.loc.length ? `<details><summary class="sub">Não localizados (maiores valores)</summary><div class="tbl"><table><tbody>${I.nl.sort((a, b) => n(b.vlContabil) - n(a.vlContabil)).slice(0, 50).map(a => `<tr><td class="mono">${esc(a.codigo)}</td><td>${esc(a.descricao)}</td><td>${esc(a.local || "")}</td><td class="dd-num">${brl(a.vlContabil)}</td></tr>`).join("")}</tbody></table></div></details>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="at-xl2">Planilha (Excel)</button><button type="button" class="btn sm" id="at-ld2">Laudo (Word)</button></div></div>`;
  }
  function vDepr(s){
    const C = cfg(s), L = bens(s).filter(a => a.origem !== "sobra"), ed = D.ed() ? "" : "disabled", gs = [...new Set(L.map(a => grupoRef(a.grupo).nome))];
    const com = L.filter(a => n(a.inv?.vidaRem ?? a.vidaRem) > 0), tot = com.reduce((t, a) => { const d = novaDepr(s, a); return {dep:t.dep + d.depreciavel, an:t.an + (d.anual || 0)}; }, {dep:0, an:0});
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><div class="eyebrow">CPC 27 · vida útil e valor residual</div><h3 style="margin:0">Nova depreciação</h3>
        <p class="sub" style="margin:2px 0 0">Valor depreciável = valor contábil − valor residual de venda (líquido das despesas de venda), dividido pela vida remanescente atribuída na inspeção. Ex.: ônibus de R$ 1 milhão vendido em 5 anos por R$ 400 mil deprecia R$ 600 mil em 5 anos (20% a.a.).</p></div></div>
      <form id="at-vr" style="display:flex;flex-direction:column;gap:8px" novalidate><div class="tbl"><table><thead><tr><th>Grupo</th><th>Valor residual de venda (% do custo)</th><th>Despesas de venda (%)</th></tr></thead><tbody>${gs.map(g => { const G = GRUPOS.find(x => x[1] === g), v = C.vr?.[g] || {};
        return `<tr><td>${esc(g)}</td><td><input data-vrp="${esc(g)}" inputmode="decimal" value="${v.pct ?? (G ? G[3] : 0)}" style="width:90px" ${ed}></td><td><input data-vrd="${esc(g)}" inputmode="decimal" value="${v.desp ?? 5}" style="width:90px" ${ed}></td></tr>`; }).join("")}</tbody></table></div>
        ${D.ed() ? `<button type="submit" class="btn sm" style="align-self:flex-start">Salvar valores residuais</button>` : ""}</form>
      <div class="dd-kpis">${k("Bens com vida remanescente", String(com.length), `de ${L.length}`)}${k("Valor depreciável", mi(tot.dep))}${k("Nova depreciação anual", mi(tot.an))}</div>
      <p class="sub" style="margin:0;font-size:12.5px">A vida remanescente vem do inventário ou da inspeção do valor justo. O detalhe por bem está na planilha (aba "Nova depreciação").</p><div><button type="button" class="btn sm" id="at-xl3">Planilha (Excel)</button></div></div>`;
  }

  /* avaliação de um bem: inspeção e cotações */
  function folha(s, a){
    const r = avaliar(s, a), ed = D.ed() ? "" : "disabled", G = grupoRef(a.grupo);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(a.codigo)} · ${esc(G.nome)}</div><h2>${esc(a.descricao)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="af" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="dd-kpis">${k("Contábil", brl(a.vlContabil), `custo ${brl(a.custo)}`)}${k("Vida contábil", a.vidaUtil ? `${a.vidaUtil} anos` : "—", a.vidaRemCont != null ? `remanescente ${a.vidaRemCont} anos` : "")}${k("Valor justo", r.vj != null ? brl(r.vj) : "—", r.metodo || "")}${k("Mais/menos-valia", r.mv != null ? brl(r.mv) : "—")}</div>
        <div><div class="sub" style="margin:0 0 6px">Estado de conservação (inspeção)</div><div style="display:flex;gap:6px;flex-wrap:wrap">${NOTAS.map(([v, l]) => `<button type="button" class="fbtn" data-nota="${v}" aria-pressed="${+a.nota === v}" ${ed}>${v} · ${l}</button>`).join("")}</div></div>
        <div class="form"><div class="fld"><label for="af-sit">Situação</label><select id="af-sit" ${ed}>${SIT.map(x => `<option ${x === (a.situacao || "Em uso") ? "selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="fld"><label for="af-vt">Vida útil total (anos)</label><input id="af-vt" inputmode="decimal" value="${a.vidaTotal ?? ""}" placeholder="${a.vidaUtil || G.vida}" ${ed}></div><div class="fld"><label for="af-vr">Vida remanescente (anos)</label><input id="af-vr" inputmode="decimal" value="${a.vidaRem ?? ""}" placeholder="${a.vidaRemCont ?? ""}" ${ed}></div>
          <div class="fld"><label for="af-vrn">Reposição novo (R$, opcional)</label><input id="af-vrn" inputmode="decimal" value="${a.vrnManual ?? ""}" placeholder="média das cotações" ${ed}></div><div class="fld full"><label for="af-ob">Observação da inspeção</label><input id="af-ob" value="${esc(a.obs || "")}" ${ed}></div></div>
        <div><b style="font-size:13.5px">Cotações de mercado</b> <span class="sub" style="font-size:12px">· mínimo 3, com a fonte; ao menos uma do exterior para bens relevantes</span>
          <div class="tbl" style="margin-top:6px"><table><thead><tr><th>Fonte</th><th>País</th><th class="dd-num">Valor</th><th class="dd-num">Em R$</th><th>Tipo</th><th></th></tr></thead><tbody>${r.cot.map((q, i) => `<tr><td>${q.url ? `<a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.fonte || q.url)}</a>` : esc(q.fonte || "")}<div class="sub" style="margin:0;font-size:11px">${dBR(q.data)}${q.obs ? " · " + esc(q.obs) : ""}</div></td><td>${esc(q.pais || "Brasil")}</td><td class="dd-num">${esc(q.moeda || "BRL")} ${(+q.valor || 0).toLocaleString("pt-BR", {minimumFractionDigits:2})}</td><td class="dd-num">${q.brl != null ? brl(q.brl) : "sem PTAX"}</td><td>${esc(q.tipo || "novo")}</td><td>${D.ed() ? `<button type="button" class="btn sm ghost" data-cdel="${i}">Excluir</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="6" class="sub">Nenhuma cotação.</td></tr>`}</tbody></table></div></div>
        ${D.ed() ? `<div class="form"><div class="fld"><label for="cq-f">Fonte (empresa ou site)</label><input id="cq-f" placeholder="ex.: fabricante, revenda, marketplace"></div><div class="fld"><label for="cq-u">Endereço (URL)</label><input id="cq-u" inputmode="url" placeholder="https://"></div>
          <div class="fld"><label for="cq-p">País</label><select id="cq-p"><option>Brasil</option><option>Exterior</option></select></div><div class="fld"><label for="cq-m">Moeda</label><select id="cq-m"><option>BRL</option><option>USD</option><option>EUR</option></select></div>
          <div class="fld"><label for="cq-v">Valor</label><input id="cq-v" inputmode="decimal"></div><div class="fld"><label for="cq-t">Tipo</label><select id="cq-t"><option value="novo">Bem novo equivalente</option><option value="usado">Bem usado semelhante</option></select></div>
          <div class="fld"><label for="cq-d">Data da cotação</label><input id="cq-d" type="date" value="${new Date().toISOString().slice(0, 10)}"></div><div class="fld full"><button type="button" class="btn sm" id="cq-add">Incluir cotação</button></div></div>` : ""}
        <p class="err" id="af-err" hidden></p>${D.ed() ? `<div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn ghost" data-x>Fechar</button><button type="submit" class="btn primary">Salvar inspeção</button></div>` : ""}</form>`);
    let nota = +a.nota || null; $$("[data-nota]").forEach(b => b.onclick = () => { nota = +b.dataset.nota; $$("[data-nota]").forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.nota === nota))); });
    const re = () => { close(); folha(s, (S.ativos || []).find(x => x.id === a.id) || a); };
    const add = $("#cq-add"); if (add) add.onclick = async () => { const v = n($("#cq-v").value); if (!(v > 0)){ const e = $("#af-err"); e.textContent = "Informe o valor da cotação."; e.hidden = false; return; }
      const q = {fonte:$("#cq-f").value.trim(), url:$("#cq-u").value.trim(), pais:$("#cq-p").value, moeda:$("#cq-m").value, valor:v, tipo:$("#cq-t").value, data:$("#cq-d").value, por:eu()};
      await upd(a, {cot:[...(a.cot || []), q], amostra:true}); a.cot = [...(a.cot || []), q]; re(); };
    $$("[data-cdel]").forEach(b => b.onclick = async () => { const L = (a.cot || []).filter((_, i) => i !== +b.dataset.cdel); await upd(a, {cot:L}); a.cot = L; re(); });
    $("#af").onsubmit = async e => { e.preventDefault(); if (!D.ed()) return; const v = id => $("#" + id).value.trim(), nn = id => v(id) === "" ? null : n(v(id));
      await upd(a, {nota, situacao:v("af-sit"), vidaTotal:nn("af-vt"), vidaRem:nn("af-vr"), vrnManual:nn("af-vrn"), obs:v("af-ob"), amostra:true, inspecao:{em:nowISO(), por:eu()}}); close(); toast("Inspeção salva"); };
  }

  /* registro no inventário (campo) */
  function leitor(onCode){
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia){ toast("Este aparelho não lê códigos pelo navegador: digite o código e fotografe a plaqueta."); return; }
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Câmera</div><h2>Aponte para o código</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="sheet-b"><video id="lv" playsinline muted style="width:100%;border-radius:10px;background:#000"></video><p class="sub">Código de barras ou QR Code da plaqueta.</p></div>`, () => { vivo = false; st?.getTracks().forEach(t => t.stop()); });
    let vivo = true, st = null; const det = new BarcodeDetector();
    navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(async m => { st = m; const v = $("#lv"); v.srcObject = m; await v.play();
      const loop = async () => { if (!vivo) return; try{ const c = await det.detect(v); if (c[0]?.rawValue){ vivo = false; close(); onCode(c[0].rawValue); return; } }catch(e){} requestAnimationFrame(loop); }; loop(); })
      .catch(() => { close(); toast("Câmera não autorizada: digite o código."); });
  }
  function registrar(s, cod0){
    const ed = D.ed(); if (!ed) return; let fotos = {};
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Inventário físico</div><h2>Registrar bem</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="iv" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="form"><div class="fld full"><label for="iv-c">Código da plaqueta (barras ou QR)</label><div style="display:flex;gap:8px"><input id="iv-c" value="${esc(cod0 || "")}" autocomplete="off" style="flex:1"><button type="button" class="btn" id="iv-ler">Ler código</button></div></div></div>
        <div id="iv-bem" class="sub" style="margin:0"></div>
        <div class="form"><div class="fld"><label>Foto do bem</label><label class="btn">Tirar foto do bem<input type="file" id="iv-f1" accept="image/*" capture="environment" hidden></label><span id="iv-f1s" class="sub" style="font-size:12px"></span></div>
          <div class="fld"><label>Foto da plaqueta</label><label class="btn">Tirar foto da plaqueta<input type="file" id="iv-f2" accept="image/*" capture="environment" hidden></label><span id="iv-f2s" class="sub" style="font-size:12px"></span></div></div>
        <div><div class="sub" style="margin:0 0 6px">Estado de conservação</div><div style="display:flex;gap:6px;flex-wrap:wrap">${NOTAS.map(([v, l]) => `<button type="button" class="fbtn" data-in="${v}" aria-pressed="false" style="min-height:44px">${v} · ${l}</button>`).join("")}</div></div>
        <div class="form"><div class="fld"><label for="iv-vr">Vida remanescente (anos)</label><input id="iv-vr" inputmode="decimal"></div><div class="fld"><label for="iv-s">Situação</label><select id="iv-s">${SIT.filter(x => x !== "Não localizado").map(x => `<option>${x}</option>`).join("")}</select></div>
          <div class="fld"><label for="iv-l">Local</label><input id="iv-l"></div><div class="fld"><label for="iv-d">Descrição (se não estiver no CIB)</label><input id="iv-d"></div><div class="fld full"><label for="iv-o">Observação</label><input id="iv-o"></div></div>
        <p class="err" id="iv-err" hidden></p><div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" class="btn ghost" data-x>Fechar</button><button type="submit" class="btn primary">Salvar e próximo</button></div></form>`);
    let nota = null; $$("[data-in]").forEach(b => b.onclick = () => { nota = +b.dataset.in; $$("[data-in]").forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.in === nota))); });
    const acha = () => { const c = $("#iv-c").value.trim().toLowerCase(), a = c ? bens(s).find(x => String(x.codigo).toLowerCase() === c) : null;
      $("#iv-bem").innerHTML = !c ? "" : a ? `<b>${esc(a.descricao)}</b> · ${esc(grupoRef(a.grupo).nome)} · contábil ${brl(a.vlContabil)}${a.vidaRemCont != null ? ` · vida remanescente contábil ${a.vidaRemCont} anos` : ""}${a.inv?.em ? ` · <b>já inventariado em ${dBR(a.inv.em)}</b>` : ""}` : `<span style="color:var(--warn,#F2C14E)">Código fora do CIB: será registrado como sobra.</span>`;
      if (a && !$("#iv-l").value) $("#iv-l").value = a.local || ""; return a; };
    $("#iv-c").oninput = acha; acha();
    $("#iv-ler").onclick = () => leitor(c => { close(); registrar(s, c); });
    const foto = (inp, k, lab) => { $(inp).onchange = async () => { const f = $(inp).files[0]; if (!f) return; $(lab).textContent = "Enviando…"; try{ const b = await shrink(f, Store.db ? 1600 : 800), up = await Store.upload(b); fotos[k] = {url:up.url, assetId:up.assetId || null}; $(lab).textContent = "Foto anexada"; }catch(e){ $(lab).textContent = "Falha no envio"; } }; };
    foto("#iv-f1", "foto", "#iv-f1s"); foto("#iv-f2", "fotoPlaq", "#iv-f2s");
    $("#iv").onsubmit = async e => { e.preventDefault(); const c = $("#iv-c").value.trim(), er = $("#iv-err"); if (!c){ er.textContent = "Informe ou leia o código."; er.hidden = false; return; }
      if (!nota){ er.textContent = "Dê a nota de 1 a 5."; er.hidden = false; return; }
      const a = acha(), inv = {em:nowISO(), por:eu(), nota, vidaRem:$("#iv-vr").value.trim() === "" ? null : n($("#iv-vr").value), situacao:$("#iv-s").value, local:$("#iv-l").value.trim(), obs:$("#iv-o").value.trim(), ...fotos};
      if (a) await upd(a, {inv, nota:a.nota || nota, situacao:a.situacao || inv.situacao, vidaRem:a.vidaRem ?? inv.vidaRem});
      else await save(Store.set("ativos", "at" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), {alvoId:s.id, origem:"sobra", codigo:c, descricao:$("#iv-d").value.trim() || "Bem sem cadastro no CIB", grupo:"", local:inv.local, custo:0, vlContabil:0, inv, criadoEm:nowISO()}));
      close(); toast(a ? "Bem inventariado" : "Sobra registrada"); registrar(s, ""); };
  }

  /* ---------------- pasta ---------------- */
  (() => { const nav = $("nav.tabs"), v = nav && $("[data-go=valuation]", nav); if (!v) return;
    v.insertAdjacentHTML("afterend", `<button type="button" data-go="ativos"><svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M8 7V4h8v3M7 12h4M7 16h7"/></svg>Avaliação de ativos</button>`);
    $("#v-valuation").insertAdjacentHTML("afterend", `<section class="view" id="v-ativos" data-view="ativos" hidden><div class="pad" id="ativos"></div></section>`); })();
  EXT_VIEWS.ativos = function(){
    const host = $("#ativos"); if (!host) return; S.atTab = S.atTab || "base";
    const s = D.alvoSel(), sd = D.lado(s, D.pick, ["com bens importados", "pendências"]), abas = [...ABAS, ...(window.KT_ATV_ABAS || [])];
    const h = D.cab("Avaliação de ativos", "Avaliação de ativos", "Valor justo dos bens para o PPA (mais e menos-valia), inventário físico com código de barras e fotos, revisão da vida útil e do valor residual, e imóveis.");
    const tabs = `<div class="dd-tabs">${abas.map(([k2, l]) => `<button type="button" class="fbtn" data-at="${k2}" aria-pressed="${S.atTab === k2}">${l}</button>`).join("")}</div>`;
    const ext = (window.KT_ATV_ABAS || []).find(x => x[0] === S.atTab);
    const corpo = !s ? `<div class="empty">Cadastre o target (ou o cliente do trabalho avulso) na Base inicial.</div>` : ext ? ext[2].html(s) : S.atTab === "vj" ? vVJ(s) : S.atTab === "inv" ? vInv(s) : S.atTab === "depr" ? vDepr(s) : vBase(s);
    host.innerHTML = h + tabs + `<div class="dd-split" style="margin-top:14px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">${corpo}</div></div>`;
    sd.bind(host); $$("[data-at]", host).forEach(b => b.onclick = () => { S.atTab = b.dataset.at; renderView(); }); if (!s) return;
    if (ext){ ext[2].bind?.(host, s); return; }
    const err = m => { const e = $("#at-err", host); if (e){ e.textContent = m; e.hidden = false; } else toast(m); };
    const cib = $("#at-cib", host); if (cib) cib.onchange = async () => { const fl = cib.files[0]; if (!fl) return; try{ const buf = await fl.arrayBuffer(), rows = /\.xlsx$/i.test(fl.name) ? await IMP.lerXLSX(buf) : D.csv ? D.csv(new TextDecoder().decode(buf)) : new TextDecoder().decode(buf).split(/\r?\n/).map(l => l.split(/[;\t]/));
        const L = lerCIB(rows), ja = new Map(bens(s).map(a => [String(a.codigo), a])), base = Date.now().toString(36);
        await gravarMuitos(L.map((o, i) => { const j = ja.get(String(o.codigo)); return [j ? j.id : `at${base}${i.toString(36)}`, {...(j || {}), ...o, alvoId:s.id, origem:"cib", arquivo:fl.name, importadoEm:nowISO(), ...(j ? {id:undefined} : {})}]; }).map(([id, o]) => { delete o.id; return [id, o]; }));
        toast(`${L.length} bens importados do CIB`); }catch(e){ console.error(e); err("CIB: " + (e.message || "não foi possível ler")); } };
    const lp = $("#at-limpa", host); if (lp) lp.onclick = async () => { if (!confirm(`Apagar os ${bens(s).length} bens deste target?`)) return; for (const a of bens(s)) await Store.del("ativos", a.id); toast("Base apagada"); };
    const db = $("#at-db", host); if (db) db.onchange = () => D.up(s, {ativos:{dataBase:db.value}});
    const cf = $("#at-cf", host); if (cf) cf.onsubmit = async e => { e.preventDefault(); const v = id => $("#" + id, host).value.trim();
      await D.up(s, {ativos:{base:v("at-base"), cobertura:n(v("at-cob")) || 80, metodo:v("at-met"), residual:n(v("at-res")) ?? 10, obsoleto:n(v("at-obs")) ?? 30, intern:n(v("at-int")) || 0, ptax:{...(cfg(s).ptax || {}), USD:n(v("at-px-USD")) || null, EUR:n(v("at-px-EUR")) || null}}}); toast("Premissas salvas"); };
    const px = $("#at-ptax", host); if (px) px.onclick = async () => { px.disabled = true; const C = cfg(s), o = {...(C.ptax || {})}, ok = [];
      for (const m of ["USD", "EUR"]){ try{ const r = await buscarPtax(m, C.dataBase); o[m] = r.valor; ok.push(`${m} ${String(r.valor).replace(".", ",")} (${dBR(r.data)})`); }catch(e){} }
      if (ok.length){ o.fonte = `PTAX venda Banco Central: ${ok.join(" · ")}`; await D.up(s, {ativos:{ptax:o}}); toast("PTAX atualizada"); } else { px.disabled = false; toast("Não consegui consultar o Banco Central: informe a PTAX à mão."); } };
    const s80 = $("#at-80", host); if (s80) s80.onclick = async () => { const nn = await selecionar80(s); toast(`${nn} bens selecionados (${pc(cobertura(s).pct, 1)} do valor)`); };
    $$("[data-am]", host).forEach(c => c.onchange = () => upd((S.ativos || []).find(a => a.id === c.dataset.am), {amostra:c.checked}));
    $$("[data-av]", host).forEach(b => b.onclick = () => folha(s, (S.ativos || []).find(a => a.id === b.dataset.av)));
    const pp = $("#at-ppa", host); if (pp) pp.onclick = async () => { const R = resumo(s); if (R.T.pend && !confirm(`${R.T.pend} bem(ns) da amostra ainda sem valor justo. Levar mesmo assim?`)) return;
      await D.up(s, {pos:{ppa:{imob:+(R.mv / 1e6).toFixed(4), vidaImob:R.vidaPond ? +R.vidaPond.toFixed(1) : null, imobFonte:`Avaliação de ativos: ${R.A.length} bens, ${pc(R.cob.pct, 0)} do valor, mais ou menos-valia de ${mi(R.mv)} em ${new Date().toLocaleDateString("pt-BR")}`}}});
      toast(`Mais ou menos-valia de ${mi(R.mv)} levada ao PPA`); };
    [["#at-xl", excel], ["#at-xl2", excel], ["#at-xl3", excel], ["#at-ld", laudo], ["#at-ld2", laudo]].forEach(([id, f]) => { const b = $(id, host); if (b) b.onclick = () => f(s).catch(e => { console.error(e); toast("Não foi possível gerar o arquivo."); }); });
    const iv = $("#iv-novo", host); if (iv) iv.onclick = () => registrar(s, "");
    const vr = $("#at-vr", host); if (vr) vr.onsubmit = async e => { e.preventDefault(); const o = {}; $$("[data-vrp]", host).forEach(i => { const g = i.dataset.vrp; o[g] = {pct:n(i.value) || 0, desp:n($(`[data-vrd="${CSS.escape(g)}"]`, host).value) || 0}; }); await D.up(s, {ativos:{vr:o}}); toast("Valores residuais salvos"); };
  };
  window.KT_ATV = {lerCIB, avaliar, resumo, inventario, novaDepr, selecionar80, cobertura, excel, laudo, gravarMuitos, bens, cfg, grupoRef, NOTAS};
})();
