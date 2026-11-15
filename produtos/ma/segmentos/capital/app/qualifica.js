/* ================= KINSEY CAPITAL · QUALIFICAÇÃO DAS LIGAÇÕES INVESTIDOR × TARGET =================
   A ligação automática só acontece com:
   1) mesma atividade: subsetor (plásticos e embalagens, planos de saúde e benefícios, medicamentos, hospitais…) pelo texto
      do mapa, CNAE da Receita, descrição e linhas de negócio. Estratégico precisa atuar no mesmo subsetor (ou tê-lo
      na tese); fundo ou private equity precisa ter o subsetor, o CNAE ou o segmento do target na tese;
   2) porte: o investidor precisa ser muito maior que o target. Estratégico: faturamento ≥ 3× o do target ou
      capacidade ≥ 1,5× o valuation; fundo: ticket máximo ou capacidade ≥ valuation (ou patrimônio ≥ 5×).
      Valuation do target: faixa da administração, valuation do sistema ou estimativa pelo faturamento.
   Investidor sem porte informado não é ligado automaticamente: fica em "a qualificar" até o consultor informar
   faturamento, patrimônio ou ticket. A indicação manual continua livre. Corrige também segmentos importados errado. */
if (window.KT_DD) (() => {
  const D = KT_DD, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), mi = v => D.mi(v * 1e6);
  const SUB = [["Plásticos e embalagens", /plastic|embalag|laminad|polimer|polietil|filme|resina|222|2221|2222/], ["Planos de saúde e benefícios", /plano(s)? de saude|adm(inistradora)? de (planos|beneficio)|beneficio|saude sup|operadora|odonto|6550|6622/],
    ["Medicamentos e farmacêutica", /medicament|farmac|droga|2121|2123|4644|4771/], ["Hospitais, clínicas e diagnóstico", /hospital|clinic|diagnost|laborat|imagem|8610|8630|8640/], ["Alimentos e bebidas", /aliment|frigor|latic|bebida|cervej|vinic|^10|^11/],
    ["Lavanderia e facilities", /lavanderi|facilit|limpeza|8121|9601/], ["Terceirização e RH", /terceiriz|mao de obra|tempor|recrutamento|7810|7820|7830/], ["Química", /quimic|aditiv|tinta|2011|2029/], ["Metalurgia e mecânica", /metal|siderur|usinag|mecanic|24|25/],
    ["Papel, celulose e madeira", /papel|celulose|madeira|florest|pinus|osb|17|16/], ["Logística e transporte", /logist|transport|armazen|frete|49|52/], ["Tecnologia e software", /tecnolog|software|saas|sistema|6201|6202|6203|6204|6311/],
    ["Educação", /educa|escola|ensino|curso|85/], ["Agro", /agro|fazenda|grao|cana|01|02/], ["Construção e imobiliário", /constru|engenharia|imobili|41|42|43|68/], ["Varejo e distribuição", /varej|atacad|distribui|comercio|loja|46|47/],
    ["Serviços financeiros", /financeir|credito|seguro|fidc|banc|64|65|66/], ["Energia", /energia|eletric|solar|35/], ["Gráfica e rótulos", /grafic|rotulo|etiquet|impress|18/], ["Borracha e látex", /borracha|latex|2219/], ["Automação e eletrônicos", /automac|eletron|26|27/]];
  const cnaeDe = s => String(s.receita?.cnae || s.cnae || "").replace(/\D/g, "");
  const texto = s => nrm([s.mapa?.segmentoTxt, s.receita?.cnaeDesc, ...(s.receita?.cnaesSec || []), s.perfil?.descricao, ...((s.perfil?.linhas || []).map(l => l.nome + " " + (l.desc || ""))), s.tipo === "Investidor estratégico" ? s.nome : ""].filter(Boolean).join(" "));
  const memo = fn => { const W = new WeakMap(); return s => { if (!s || typeof s !== "object") return fn(s); if (!W.has(s)) W.set(s, fn(s)); return W.get(s); }; };
  const subsetores = memo(subsetores0);
  function subsetores0(s){ const t = texto(s), c = cnaeDe(s), out = new Set();
    SUB.forEach(([n, re]) => { const src = re.source.split("|"), txt = src.filter(x => !/^\^?\d+$/.test(x)), num = src.filter(x => /^\^?\d+$/.test(x)).map(x => x.replace("^", ""));
      if (txt.length && new RegExp(txt.join("|")).test(t)) out.add(n); if (c && num.some(d => c.startsWith(d))) out.add(n); }); return [...out]; }
  const tese = inv => { const T = inv.tese || {}; return nrm([...(T.segmentos || []), T.texto, T.atividades, T.cnaes].flat().filter(Boolean).join(". ")).split(/[.;\n]/).filter(f => !/n[aã]o (e |eh )?(o )?foco|n[aã]o (compra|investe|tem interesse)|exceto|sem interesse/.test(f)).join(". "); };
  const subTese = inv => { const t = tese(inv); return SUB.filter(([, re]) => { const txt = re.source.split("|").filter(x => !/^\^?\d+$/.test(x)); return txt.length && new RegExp(txt.join("|")).test(t); }).map(x => x[0]); };
  const fundo = inv => /private|equity|fundo|gestora|family office|capital|partners|investimento|holding|asset|venture|fip/i.test((inv.tipo || "") + " " + (inv.nome || ""));
  const emMi = v => { if (v == null || v === "") return null; if (typeof v === "number") return v; return window.KT_POL ? KT_POL.emMi(v) : parseFloat(v); };
  /* porte do target: faturamento e valuation (administração, sistema ou estimativa) */
  const porteT = memo(porteT0);
  function porteT0(t){
    const fat = emMi(t.fin?.receita) ?? emMi(t.mapa?.fat) ?? emMi(t.enriq?.fat) ?? null, adm = t.perfil?.valAdm || {};
    let vMin = emMi(adm.min), vMax = emMi(adm.max), fonte = vMin || vMax ? "expectativa da administração" : "";
    if (!vMin && !vMax){ try{ const R = KT_VAL.resumo(t); if (R.rec){ vMin = (R.rec[0] - R.X.dl) / 1e6; vMax = (R.rec[1] - R.X.dl) / 1e6; fonte = "valuation do sistema"; } }catch(e){} }
    if (!vMin && !vMax && fat){ vMin = fat * .6; vMax = fat * 1.2; fonte = "estimativa pelo faturamento (0,6× a 1,2×)"; }
    return {fat, vMin, vMax, v:vMax || vMin, fonte};
  }
  /* porte do investidor: faturamento, patrimônio/AUM, ticket e capacidade */
  const porteI = memo(porteI0);
  function porteI0(inv){
    const P = inv.porte || {}, T = inv.tese || {}; let cap = null; try{ const K = KT_BASE.capacidade(inv); cap = (K.cap ?? K.tmax) != null ? (K.cap ?? K.tmax) / 1e6 : null; }catch(e){}
    const fat = emMi(P.fat) ?? emMi(inv.fin?.receita) ?? emMi(inv.mapa?.fat) ?? emMi(inv.enriq?.fat) ?? (inv.ext?.fin?.rec ? inv.ext.fin.rec / 1e6 : null);
    return {fat, aum:emMi(P.aum) ?? emMi(inv.capac?.aum), ticket:emMi(P.ticketMax) ?? emMi(T.ticketMax), cap, conhecido:[fat, emMi(P.aum) ?? emMi(inv.capac?.aum), emMi(P.ticketMax) ?? emMi(T.ticketMax), cap].some(x => x != null && x > 0)};
  }
  function avaliar(inv, t){
    const st = subsetores(t), si = subsetores(inv), sti = subTese(inv), f = fundo(inv), segT = nrm(t.perfil?.segmento || t.segmento), teseTxt = tese(inv);
    const comum = st.filter(x => si.includes(x) || sti.includes(x)), cn = cnaeDe(t).slice(0, 4), cnTese = cn && (inv.tese?.cnaes || []).some(c => String(c).replace(/\D/g, "").startsWith(cn.slice(0, 2)));
    const generalista = f && /generalist|multissetor|diversos setores|todos os setores/.test(teseTxt);
    const ativ = comum.length ? {ok:true, txt:`mesma atividade: ${comum.join(", ")}`} : cnTese ? {ok:true, txt:`CNAE ${cn} na tese`} : generalista && segT && teseTxt.includes(segT.slice(0, 6)) ? {ok:true, txt:`fundo generalista com ${t.perfil?.segmento || t.segmento} na tese`}
      : {ok:false, txt:st.length ? `atividades diferentes (target: ${st.join(", ")}${si.length || sti.length ? `; investidor: ${[...new Set([...si, ...sti])].join(", ")}` : ""})` : "atividade do target não identificada"};
    const T = porteT(t), I = porteI(inv); let porte;
    if (!I.conhecido) porte = {st:"sem", txt:"porte do investidor não informado: qualificar (faturamento, patrimônio ou ticket)"};
    else if (!T.fat && !T.v) porte = {st:"ok", txt:"porte do target não informado"};
    else { const reqFat = T.fat ? T.fat * 3 : null, reqV = T.v ? T.v * (f ? 1 : 1.5) : null, okFat = I.fat != null && reqFat != null && I.fat >= reqFat, okCap = (I.cap ?? 0) >= (reqV ?? Infinity) || (I.ticket ?? 0) >= (T.v ?? Infinity) || (I.aum ?? 0) >= (T.v ? T.v * 5 : Infinity);
      porte = okFat || okCap ? {st:"ok", txt:`porte compatível (${[I.fat && `fat. ${mi(I.fat)}`, I.ticket && `ticket ${mi(I.ticket)}`, I.cap && `capacidade ${mi(I.cap)}`, I.aum && `patrimônio ${mi(I.aum)}`].filter(Boolean).join(", ")} × target ${T.v ? `valuation até ${mi(T.v)}` : `fat. ${mi(T.fat)}`})`}
        : {st:"pequeno", txt:`investidor menor que o necessário (${[I.fat && `fat. ${mi(I.fat)}`, I.ticket && `ticket ${mi(I.ticket)}`, I.cap && `capacidade ${mi(I.cap)}`].filter(Boolean).join(", ") || "porte informado"} × target ${T.fat ? `fat. ${mi(T.fat)}` : ""}${T.v ? `, valuation até ${mi(T.v)}` : ""})`}; }
    return {ok:ativ.ok && porte.st === "ok", ativ, porte, fundo:f, T, I};
  }
  /* corrige segmentos importados errado (ex.: "laminados planos" lido como planos de saúde) */
  let migrado = false;
  function migrar(){ if (migrado || !Store.me?.canWrite || !window.KT_SEGDE) return; migrado = true;
    const segCnae = c => { c = String(c || "").replace(/\D/g, "").padStart(7, "0"); const d = +c.slice(0, 2); if (!+c) return ""; if (/^(2121|2123|4644|4771|6550)/.test(c) || (d >= 86 && d <= 88)) return "Saúde"; if (d >= 1 && d <= 3) return "Agro"; if (d === 10 || d === 11) return "Alimentos"; if (d >= 5 && d <= 33) return "Industrial"; if (d === 35) return "Energia"; if (d >= 41 && d <= 43) return "Construção"; if (d >= 45 && d <= 47) return "Varejo"; if (d >= 49 && d <= 53) return "Logística"; if (d >= 58 && d <= 63) return "Tecnologia"; if (d === 85) return "Educação"; return "Serviços"; };
    S.suppliers.filter(s => (s.mapa?.segmentoTxt || s.receita?.cnae) && s.origem === "Mapa M&A Kinsey").forEach(s => { const novo = segCnae(s.receita?.cnae) || KT_SEGDE(s.mapa?.segmentoTxt || ""); if (novo && novo !== "Outros" && novo !== s.segmento) Store.update("suppliers", s.id, {segmento:novo, perfil:{...(s.perfil || {}), segmento:novo}}).catch(() => {}); }); }
  const _all = renderAll; renderAll = function(){ const r = _all.apply(this, arguments); setTimeout(migrar, 1200); return r; };
  /* dossiê: porte (target e investidor) */
  const _b = renderSupBody;
  renderSupBody = function(){ const r = _b.apply(this, arguments), s = supById(S.openSup), b = $("#sup-body"); if (!s || !["N1", "N3"].includes(s.nivel) || S.supTab !== "dados" || !b || b.querySelector("[data-porte]")) return r;
    const ed = D.ed() ? "" : "disabled", el = document.createElement("div"); el.className = "card"; el.setAttribute("data-porte", "1"); el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    if (s.nivel === "N3"){ const T = porteT(s), a = s.perfil?.valAdm || {};
      el.innerHTML = `<h3 style="margin:0">Porte e expectativa de valor</h3><p class="sub" style="margin:0">Usado para ligar só investidores com porte para comprar. Atividade: ${esc(subsetores(s).join(", ") || "não identificada")}.</p>
        <div class="form"><div class="fld"><label for="pt-f">Faturamento anual (R$ mi)</label><input id="pt-f" inputmode="decimal" value="${T.fat != null ? fmt(T.fat, 0) : ""}" ${ed}></div><div class="fld"><label for="pt-a">Valuation esperado pela administração · mín. (R$ mi)</label><input id="pt-a" inputmode="decimal" value="${a.min ?? ""}" ${ed}></div><div class="fld"><label for="pt-b">máx. (R$ mi)</label><input id="pt-b" inputmode="decimal" value="${a.max ?? ""}" ${ed}></div></div>
        <p class="sub" style="margin:0">Referência atual: ${T.v ? `valuation ${T.vMin ? mi(T.vMin) + " a " : ""}${mi(T.vMax || T.v)} (${esc(T.fonte)})` : "sem valuation"}.</p>`; }
    else { const I = porteI(s), P = s.porte || {};
      el.innerHTML = `<h3 style="margin:0">Porte do investidor</h3><p class="sub" style="margin:0">${fundo(s) ? "Fundo ou private equity" : "Investidor estratégico"} · atividade: ${esc([...new Set([...subsetores(s), ...subTese(s)])].join(", ") || "não identificada")}. Sem porte informado, o sistema não liga targets automaticamente.</p>
        <div class="form"><div class="fld"><label for="pt-f">Faturamento anual (R$ mi)</label><input id="pt-f" inputmode="decimal" value="${P.fat ?? (I.fat != null ? fmt(I.fat, 0) : "")}" ${ed}></div><div class="fld"><label for="pt-a">Patrimônio / AUM (R$ mi)</label><input id="pt-a" inputmode="decimal" value="${P.aum ?? ""}" ${ed}></div><div class="fld"><label for="pt-b">Ticket máximo por aquisição (R$ mi)</label><input id="pt-b" inputmode="decimal" value="${P.ticketMax ?? (I.ticket ?? "")}" ${ed}></div></div>`; }
    const ref = b.querySelector("[data-vig]") || b.querySelector("[data-painel]"); if (ref) ref.after(el); else b.prepend(el);
    const n = id => { const v = $("#" + id, el).value.trim(); return v === "" ? null : num(v); };
    $$("input", el).forEach(i => i.onchange = () => s.nivel === "N3" ? D.up(s, {fin:{receita:n("pt-f")}, perfil:{valAdm:{min:n("pt-a"), max:n("pt-b")}}}) : D.up(s, {porte:{fat:n("pt-f"), aum:n("pt-a"), ticketMax:n("pt-b")}}));
    return r; };
  window.KT_QUAL = {avaliar, subsetores, porteT, porteI, fundo, SUB};
})();
