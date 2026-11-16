/* ================= KINSEY CAPITAL · VALUATION =================
   Só entra na construção do segmento M&A. Usa a Due Diligence (balancetes e ajustes com OK no valuation).
   Formas de avaliação comparativas:
   1. Fluxo de caixa descontado — histórico de 2 a 3 exercícios e períodos comparativos (ex.: set × set), crescimento
      por linha de negócio, WACC/CAPM pela base de apuração Kinsey (metodologia e fontes) e indicadores de mercado;
      cenário moderado (histórico) e otimista (premissas do consultor), com alerta e justificativa obrigatória
      quando o crescimento ou a margem fogem do histórico ou do mercado.
   2. Múltiplos de mercado — companhias abertas do mesmo segmento ou semelhantes (CVM/B3 e base Kinsey).
   3. Outras avaliações — transações comparáveis e patrimônio líquido ajustado.
   Dados do target: s.perfil (cadastro para valuation) e s.dd.vl (premissas, justificativas e emissões). */
if (typeof VAL_BASE !== "undefined" && window.KT_DD) (() => {
  const D = KT_DD, {mi, pc, xx, div, norm, ed, up} = D;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const n = v => { const x = num(v); return x == null ? null : x; };
  const hoje = () => new Date().toISOString().slice(0, 10);

  /* ---------------- BASE DE APURAÇÃO E MERCADO ---------------- */
  let ouvindo = false;
  function ouvir(){ if (ouvindo || !Store.db) return; ouvindo = true;
    Store.db.collection("cotacoes").doc("mercado").onSnapshot(d => { S.mercado = d.exists ? d.data() : null; if (["valuation","apresentacao"].includes(S.view)) renderView(); }, () => {});
    Store.db.collection("cotacoes").doc("comparaveis").onSnapshot(d => { S.mercadoComp = d.exists ? d.data() : null; if (S.view === "valuation") renderView(); }, () => {}); }
  function base(){
    const ov = S.config.val_base || {}, P = {};
    VAL_BASE.params.forEach(([id, rot, v, u, fonte, data, met]) => { const o = ov.params?.[id] || {}; P[id] = {id, rot, v:o.v ?? v, u, fonte:o.fonte ?? fonte, data:o.data ?? data, met:o.met ?? met, editado:!!ov.params?.[id]}; });
    const M = S.mercado || {}, mercado = {...VAL_BASE.mercado, ...(M.atual || {})};
    return {P, betas:{...VAL_BASE.betas, ...(ov.betas || {})}, ipca:{...VAL_BASE.ipca, ...(M.ipca || {})}, focus:M.focus || VAL_BASE.focus, mercado, noticias:M.noticias || [], auto:!!S.mercado};
  }
  const ipcaAno = (Bs, y) => (Bs.focus.ipca?.[y] ?? Bs.ipca[y] ?? Bs.P.infBR.v) / 100;

  /* ---------------- PERFIL DO CADASTRO ---------------- */
  const PERFIL_OBR = [["segmento","Segmento"],["linhas","Linhas de negócio"],["dataBase","Data-base do valuation"],["regime","Regime tributário"],["local","Local da empresa"]];
  const perfilFalta = s => { const p = s.perfil || {}; return PERFIL_OBR.filter(([k]) => k === "linhas" ? !(p.linhas || []).length : k === "local" ? !(s.municipio && (s.uf || s.pais)) : !p[k]).map(x => x[1]); };
  function editarPerfil(s){
    const p = s.perfil || {}, L = (p.linhas || []).map(l => `${l.nome}${l.pct ? " | " + l.pct : ""}${l.desc ? " | " + l.desc : ""}`).join("\n");
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Cadastro para valuation</div><h2>${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fpf" novalidate><p class="sub" style="margin:0 0 10px">Informações exigidas para um valuation seguro: o segmento escolhe os múltiplos e o beta; as linhas de negócio organizam o histórico e a projeção.</p><div class="form">
        <div class="fld"><label for="pf-seg">Segmento</label><select id="pf-seg"><option value="">Escolha…</option>${SEGMENTOS.map(x => `<option ${x === (p.segmento || s.segmento) ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="fld"><label for="pf-sim">Segmentos semelhantes (para múltiplos)</label><input id="pf-sim" value="${esc((p.segSim || SEG_SIM[p.segmento || s.segmento] || []).join(", "))}"></div>
        <div class="fld"><label for="pf-db">Data-base do valuation</label><input id="pf-db" type="date" value="${esc(p.dataBase || "")}"></div>
        <div class="fld"><label for="pf-reg">Regime tributário</label><select id="pf-reg">${["","Lucro real","Lucro presumido","Simples Nacional"].map(x => `<option ${x === (p.regime || "") ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="fld"><label for="pf-mun">Município da sede</label><input id="pf-mun" value="${esc(s.municipio || "")}"></div><div class="fld"><label for="pf-uf">UF</label><input id="pf-uf" value="${esc(s.uf || "")}"></div>
        <div class="fld full"><label for="pf-at">Regiões e países de atuação</label><input id="pf-at" value="${esc(p.atuacao || "")}" placeholder="ex.: Sudeste e Centro-Oeste; exporta para o Mercosul"></div>
        <div class="fld full"><label for="pf-lin">Linhas de negócio (uma por linha: nome | % da receita | descrição)</label><textarea id="pf-lin" rows="4" placeholder="Queijos | 35% | linha premium para varejo">${esc(L)}</textarea></div>
        <div class="fld"><label for="pf-fun">Funcionários</label><input id="pf-fun" inputmode="numeric" value="${esc(p.funcionarios || "")}"></div><div class="fld"><label for="pf-fd">Ano de fundação</label><input id="pf-fd" inputmode="numeric" value="${esc(p.fundacao || (s.abertura || "").slice(0, 4))}"></div>
        <div class="fld full"><label for="pf-cli">Principais clientes e concentração</label><input id="pf-cli" value="${esc(p.clientes || "")}"></div>
        <div class="fld full"><label for="pf-saz">Sazonalidade e ciclo do negócio</label><input id="pf-saz" value="${esc(p.sazonalidade || "")}"></div>
        <div class="fld full"><label for="pf-desc">Descrição do negócio (base do teaser)</label><textarea id="pf-desc" rows="3">${esc(p.descricao || "")}</textarea></div>
      </div><p class="err" id="pf-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar cadastro</button></div></form>`);
    $("#fpf").onsubmit = e => { e.preventDefault(); const v = id => $("#" + id).value.trim();
      const linhas = v("pf-lin").split("\n").map(l => l.split("|").map(x => x.trim())).filter(l => l[0]).map(([nome, pct, desc]) => ({nome, pct:pct || "", desc:desc || ""}));
      if (!v("pf-seg") || !linhas.length){ $("#pf-err").textContent = "Informe o segmento e pelo menos uma linha de negócio."; $("#pf-err").hidden = false; return; }
      up(s, {segmento:v("pf-seg"), municipio:v("pf-mun"), uf:v("pf-uf"), perfil:{segmento:v("pf-seg"), segSim:v("pf-sim").split(",").map(x => x.trim()).filter(Boolean), dataBase:v("pf-db"), regime:v("pf-reg"), atuacao:v("pf-at"), linhas, funcionarios:v("pf-fun"), fundacao:v("pf-fd"), clientes:v("pf-cli"), sazonalidade:v("pf-saz"), descricao:v("pf-desc")}}).then(() => { close(); toast("Cadastro para valuation salvo"); }); };
  }
  /* aba M&A do dossiê: cartão do cadastro para valuation */
  const _tabMa = EXT_TABS.ma;
  if (_tabMa) EXT_TABS.ma = (s, b, r) => { _tabMa(s, b, r); if (s.nivel !== "N3") return; const p = s.perfil || {}, f = perfilFalta(s);
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<div class="head" style="margin:0"><div><h3>Cadastro para valuation</h3><p class="sub" style="margin:2px 0 0">${f.length ? `Falta: ${esc(f.join(", "))}` : "Completo"}</p></div><button type="button" class="btn sm ${f.length ? "primary" : ""}" id="pf-ed">${f.length ? "Completar" : "Editar"}</button></div>
      ${p.segmento ? `<div class="sub" style="margin:0">${esc(p.segmento)} · data-base ${esc(p.dataBase || "—")} · ${esc(p.regime || "—")} · ${(p.linhas || []).map(l => esc(l.nome)).join(", ")}</div>` : ""}`;
    b.firstElementChild.appendChild(el); $("#pf-ed", el).onclick = () => editarPerfil(s); };

  /* ---------------- HISTÓRICO ---------------- */
  const linhasDe = s => (s.perfil?.linhas || []).map(l => l.nome);
  function linhaConta(s, desc){
    const L = linhasDe(s), m = s.dd?.vl?.map?.[desc]; if (m) return m; if (!L.length) return "Receita";
    const t = norm(desc), hit = L.find(l => norm(l).split(/\W+/).filter(w => w.length >= 4).some(w => t.includes(w.replace(/s$/, ""))));
    return hit || (L.length === 1 ? L[0] : "Outras receitas");
  }
  function historico(s){
    const P = D.periodos(s).map(per => { const b = s.dd.bal[per], K = D.calc(b), A = D.soma(D.ajustes(s, per).filter(D.okVal)), lin = {};
      D.C(b).filter(c => c[3] === "recBruta").forEach(c => { const l = linhaConta(s, c[1]); lin[l] = (lin[l] || 0) - c[2] * K.f; });
      return {per, b, K, A, ano:+String(b.dataBase).slice(0, 4), mes:+String(b.dataBase).slice(5, 7), meses:+b.meses || 12, rl:K.recLiq, rb:K.recBruta, eb:K.ebitda + A.ebitda, ebRep:K.ebitda, lin}; });
    const anuais = Object.values(P.filter(p => p.meses === 12).reduce((o, p) => (o[p.ano] = !o[p.ano] || p.per > o[p.ano].per ? p : o[p.ano], o), {})).sort((a, b) => a.ano - b.ano);
    anuais.forEach(p => p.mg = div(p.eb, p.rl));
    const grupos = {}; P.filter(p => p.meses < 12).forEach(p => (grupos[p.mes + "-" + p.meses] ||= []).push(p));
    const comp = Object.values(grupos).filter(g => g.length > 1).map(g => g.sort((a, b) => a.ano - b.ano));
    return {P, anuais, comp};
  }
  function cagrReal(Bs, serie){ /* serie [{ano, v}] em ordem */
    if (serie.length < 2 || !(serie[0].v > 0)) return null; const a = serie[0], z = serie[serie.length - 1], anos = z.ano - a.ano; if (anos < 1) return null;
    let inf = 1; for (let y = a.ano + 1; y <= z.ano; y++) inf *= 1 + (Bs.ipca[y] ?? Bs.P.infBR.v) / 100;
    return {nom:Math.pow(z.v / a.v, 1 / anos) - 1, real:Math.pow(z.v / a.v / inf, 1 / anos) - 1, anos};
  }

  /* ---------------- WACC / CAPM ---------------- */
  const LIM_WACC = .03; /* ajuste máximo do consultor: 3 p.p. para cima ou para baixo do WACC automático */
  function wacc(s, Bs, vl){
    const P = Bs.P, seg = s.perfil?.segmento || s.segmento || "Outros", [bu, deSet] = Bs.betas[seg] || Bs.betas.Outros, t = P.ir.v / 100;
    const sel = Object.values(Bs.focus.selic || {}), selicLP = sel.length ? sel.reduce((a, b) => a + b, 0) / sel.length : P.selic.v, kd = (selicLP + P.spread.v) / 100;
    const calc = (de, size) => { const bl = bu * (1 + (1 - t) * de), keUSD = (P.rf.v + bl * P.erp.v + P.crp.v + size) / 100, ke = (1 + keUSD) * (1 + P.infBR.v / 100) / (1 + P.infUS.v / 100) - 1, wd = de / (1 + de), we = 1 - wd;
      return {de, size, bl, keUSD, ke, wd, we, w:we * ke + wd * kd * (1 - t)}; };
    const A = calc(deSet, P.size.v), C = calc(vl.de ?? deSet, vl.size ?? P.size.v), alvo = vl.waccManual != null ? vl.waccManual / 100 : C.w;
    const w = Math.min(A.w + LIM_WACC, Math.max(A.w - LIM_WACC, alvo)), ajustado = vl.waccManual != null || vl.de != null || vl.size != null;
    return {seg, bu, de:C.de, bl:C.bl, size:C.size, keUSD:C.keUSD, ke:C.ke, kd, kdLiq:kd * (1 - t), wd:C.wd, we:C.we, wacc:w, waccCalc:A.w, waccAuto:A.w, waccComp:C.w, ajustado, limitado:Math.abs(w - alvo) > 1e-9, lim:[A.w - LIM_WACC, A.w + LIM_WACC], just:vl.waccJust, selicLP, t};
  }

  /* ---------------- DÍVIDA LÍQUIDA: DO ENTERPRISE VALUE AO EQUITY VALUE ----------------
     Automática do balancete da data-base (dívida financeira, caixa e itens equivalentes a dívida), editável pelo
     consultor; ajustes de dívida da Due Diligence entram com o OK no valuation; complementos do consultor
     (contingências, earn-out, dividendos, arrendamentos e outras dívidas) com justificativa. */
  const ITENS_DIV = [["empCP","Empréstimos e financiamentos · curto prazo","Dívida financeira"],["empLP","Empréstimos e financiamentos · longo prazo","Dívida financeira"],["caixa","(−) Caixa e aplicações financeiras","Caixa"],
    ["parcTrib","Parcelamentos tributários","Equivalente a dívida"],["mutuoPassivo","Mútuos com sócios e partes relacionadas","Equivalente a dívida"],["provisoes","Provisões para contingências registradas","Equivalente a dívida"]];
  const TIPOS_COMP = ["Contingência provável não provisionada","Contingência possível (ponderada)","Passivo trabalhista","Passivo tributário","Earn-out ou parcela de aquisição a pagar","Dividendos e JCP declarados","Passivo de arrendamento (CPC 06)","Mútuo ou dívida com sócios","Fornecedores ou tributos vencidos","Outra dívida ou item equivalente"];
  function ponte(s, bp){
    const G = bp.K.G, cfg = s.dd?.vl?.divida || {}, ov = cfg.ov || {}, AJ = D.ajustes(s, bp.per), procs = new Set(AJ.map(a => a.proc).filter(Boolean)), L = [];
    ITENS_DIV.forEach(([g, rot, grupo]) => { const auto = g === "caixa" ? -G.caixa : G[g]; if (!auto) return; if (g === "parcTrib" && procs.has("x_parc")) return;
      const o = ov[g] || {}; L.push({id:"b:" + g, chave:g, rot, grupo, origem:`Balancete ${bp.per}`, auto, v:o.v ?? auto, inc:o.inc ?? true, editado:o.v != null, edit:true}); });
    if (cfg.caixaMin){ const v = Math.min(G.caixa, bp.rl * cfg.caixaMin / 100); L.push({id:"cxmin", rot:`Caixa mínimo operacional não deduzido (${fmt(cfg.caixaMin, 1)}% da receita)`, grupo:"Caixa", origem:"Consultor", v, inc:true}); }
    AJ.filter(a => a.v.divida).forEach(a => L.push({id:"dd:" + a.id, rot:a.titulo, grupo:"Ajuste de Due Diligence", origem:D.okVal(a) ? `OK no valuation · ${a.val.por || ""}` : D.okFin(a) ? "aguardando OK no valuation" : "aguardando OK nas Análises financeiras", v:a.v.divida, inc:D.okVal(a), fixo:true}));
    Object.entries(cfg.comp || {}).filter(([, c]) => c).forEach(([id, c]) => L.push({id:"c:" + id, cid:id, rot:c.titulo, grupo:"Complemento do consultor", origem:`${c.tipo}${c.pond != null && +c.pond !== 100 ? ` · ${fmt(+c.pond, 0)}% de ${mi(c.base)}` : ""}`, v:c.valor, inc:c.inc !== false, just:c.just, comp:true}));
    const soma = f => L.filter(x => x.inc && f(x)).reduce((t, x) => t + x.v, 0);
    return {L, total:soma(() => true), financ:soma(x => x.grupo === "Dívida financeira"), caixa:soma(x => x.grupo === "Caixa"), equiv:soma(x => x.grupo === "Equivalente a dívida"), dd:soma(x => x.grupo === "Ajuste de Due Diligence"), comp:soma(x => x.grupo === "Complemento do consultor"), reportada:bp.K.dl};
  }
  function vDivida(s, R){
    const X = R.X, pt = X.pt, ed = D.ed() ? "" : "disabled", cfg = s.dd?.vl?.divida || {}, mid = (R.rec[0] + R.rec[1]) / 2, jdd = window.KT_JDD ? KT_JDD.contingencias(s) : null;
    const grupos = ["Dívida financeira","Caixa","Equivalente a dívida","Ajuste de Due Diligence","Complemento do consultor"];
    return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><div class="head" style="margin:0"><div><h3>Dívida líquida · do enterprise value ao equity value</h3><p class="sub" style="margin:2px 0 0">Calculada automaticamente pelo balancete de ${esc(X.perBase)}. Ajuste valores, exclua itens ou acrescente complementos; vale para o FCD, os múltiplos e as outras avaliações.</p></div></div>
      <div class="dd-kpis">${k("Dívida líquida reportada", mi(pt.reportada), "empréstimos − caixa do balancete")}${k("Dívida líquida ajustada", mi(pt.total), `equivalentes ${mi(pt.equiv)} · DD ${mi(pt.dd)} · complementos ${mi(pt.comp)}`)}${k("Enterprise value (faixa moderada)", `${mi(R.rec[0])} a ${mi(R.rec[1])}`)}${k("Equity value (líquido de dívidas)", `${mi(R.rec[0] - pt.total)} a ${mi(R.rec[1] - pt.total)}`)}</div>
      <div class="tbl"><table><thead><tr><th>Item</th><th>Origem</th><th class="dd-num">Valor</th><th>Considerar</th><th></th></tr></thead><tbody>${grupos.map(g => { const L = pt.L.filter(x => x.grupo === g); return L.length ? `<tr><td colspan="5" class="eyebrow" style="padding-top:12px">${esc(g)}</td></tr>` + L.map(x => `<tr style="${x.inc ? "" : "opacity:.55"}">
        <td style="min-width:200px">${esc(x.rot)}${x.just ? `<div class="sub" style="margin:2px 0 0;font-size:11.5px">${esc(x.just)}</div>` : ""}</td><td style="font-size:12px">${esc(x.origem)}${x.editado ? ` · valor do balancete ${mi(x.auto)}` : ""}</td>
        <td class="dd-num">${x.edit || x.comp ? `<input data-dv="${x.id}" inputmode="decimal" value="${fmt(x.v / 1e3, 0)}" aria-label="Valor de ${esc(x.rot)} em R$ mil" style="width:110px;text-align:right" ${ed}> <span class="sub" style="font-size:11px">mil</span>` : mi(x.v)}</td>
        <td>${x.fixo ? `<span class="sub" style="font-size:12px">${x.inc ? "sim (OK)" : "depende do OK"}</span>` : `<input type="checkbox" data-dinc="${x.id}" ${x.inc ? "checked" : ""} aria-label="Considerar ${esc(x.rot)}" ${ed}>`}</td>
        <td style="text-align:right">${x.editado && D.ed() ? `<button type="button" class="btn sm ghost" data-drest="${x.chave}">Voltar ao balancete</button>` : x.comp && D.ed() ? `<button type="button" class="btn sm ghost" data-drm="${x.cid}">Remover</button>` : ""}</td></tr>`).join("") : ""; }).join("")}
        <tr><td colspan="2"><b>Dívida líquida ajustada</b></td><td class="dd-num"><b>${mi(pt.total)}</b></td><td colspan="2"></td></tr></tbody></table></div>
      <div class="form"><div class="fld"><label for="dv-cx">Caixa mínimo operacional (% da receita, não deduzido)</label><input id="dv-cx" inputmode="decimal" value="${cfg.caixaMin ? fmt(cfg.caixaMin, 1) : ""}" placeholder="0" ${ed}></div></div>
      ${D.ponte(mid, pt.L.filter(x => x.inc).map(x => ({titulo:x.rot, v:{eq:-x.v}})), "eq", "Enterprise value (meio da faixa moderada)", "Equity value")}</div>
      ${D.ed() ? `<form class="card" id="fdv" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Complemento de dívida</h3><p class="sub" style="margin:0">Contingências e outras dívidas que não estão no balancete nem nos ajustes da Due Diligence. Contingência possível pode ser ponderada pela probabilidade.</p><div class="form">
        <div class="fld"><label for="dv-t">Tipo</label><select id="dv-t">${TIPOS_COMP.map(t => `<option>${t}</option>`).join("")}</select></div><div class="fld"><label for="dv-n">Descrição</label><input id="dv-n" placeholder="ex.: Processos tributários de ICMS"></div>
        <div class="fld"><label for="dv-b">Valor base (R$ mil)</label><input id="dv-b" inputmode="decimal"></div><div class="fld"><label for="dv-p">Ponderação (%)</label><input id="dv-p" inputmode="decimal" value="100"></div>
        <div class="fld full"><label for="dv-j">Justificativa e fonte</label><input id="dv-j" placeholder="ex.: relação de processos do advogado da empresa, prognóstico possível"></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" class="btn sm primary">Incluir complemento</button>${jdd && jdd.possivel ? `<button type="button" class="btn sm" id="dv-jdd">Trazer contingências possíveis da diligência jurídica (${mi(jdd.possivel)})</button>` : ""}</div></form>` : ""}`;
  }
  function bindDivida(host, s){
    const up = p => D.up(s, {dd:{vl:{divida:p}}});
    $$("[data-dv]", host).forEach(i => i.onchange = () => { const id = i.dataset.dv, v = (num(i.value) || 0) * 1e3; if (id.startsWith("b:")) up({ov:{[id.slice(2)]:{v:id === "b:caixa" ? -Math.abs(v) : v}}}); else if (id.startsWith("c:")) up({comp:{[id.slice(2)]:{valor:v}}}); });
    $$("[data-dinc]", host).forEach(c => c.onchange = () => { const id = c.dataset.dinc; if (id.startsWith("b:")) up({ov:{[id.slice(2)]:{inc:c.checked}}}); else if (id.startsWith("c:")) up({comp:{[id.slice(2)]:{inc:c.checked}}}); });
    $$("[data-drest]", host).forEach(b => b.onclick = () => up({ov:{[b.dataset.drest]:{v:null}}}));
    $$("[data-drm]", host).forEach(b => b.onclick = () => up({comp:{[b.dataset.drm]:null}}));
    const cx = $("#dv-cx", host); if (cx) cx.onchange = () => up({caixaMin:num(cx.value) || 0});
    const f = $("#fdv", host); if (f) f.onsubmit = e => { e.preventDefault(); const b = (num($("#dv-b").value) || 0) * 1e3, p = num($("#dv-p").value) ?? 100, n = $("#dv-n").value.trim() || $("#dv-t").value, j = $("#dv-j").value.trim();
      if (!b || !j){ toast(!b ? "Informe o valor base." : "Escreva a justificativa e a fonte."); return; }
      up({comp:{["k" + Date.now().toString(36)]:{tipo:$("#dv-t").value, titulo:n, base:b, pond:p, valor:b * p / 100, just:j, inc:true, por:Store.me?.email || "", em:nowISO()}}}).then(() => toast("Complemento incluído na dívida líquida")); };
    const jd = $("#dv-jdd", host); if (jd) jd.onclick = () => { const c = KT_JDD.contingencias(s); up({comp:{["kj" + Date.now().toString(36)]:{tipo:"Contingência possível (ponderada)", titulo:"Contingências possíveis da diligência jurídica", base:c.possivel, pond:30, valor:c.possivel * .3, just:"Processos com prognóstico possível na diligência jurídica, ponderados em 30% (ajuste a ponderação).", inc:true, por:Store.me?.email || "", em:nowISO()}}}).then(() => toast("Contingências possíveis incluídas (30%)")); };
  }

  /* ---------------- CENÁRIOS (FCD) ---------------- */
  function contexto(s){
    const Bs = base(), H = historico(s), vl = s.dd?.vl || {}, L = linhasDe(s);
    const perBase = (s.perfil?.dataBase && s.dd?.bal?.[s.perfil.dataBase.slice(0, 7)]) ? s.perfil.dataBase.slice(0, 7) : (H.anuais[H.anuais.length - 1]?.per || H.P[0]?.per);
    const bp = H.P.find(p => p.per === perBase); if (!bp) return {Bs, H, vl, vazio:true};
    const histL = {}; const nomes = [...new Set([...L, ...Object.keys(bp.lin)])];
    nomes.forEach(l => { const ser = H.anuais.filter(p => p.lin[l] > 0).map(p => ({ano:p.ano, v:p.lin[l]})); histL[l] = cagrReal(Bs, ser); });
    const total = cagrReal(Bs, H.anuais.map(p => ({ano:p.ano, v:p.rl})));
    const mgs = H.anuais.map(p => p.mg).filter(x => x != null), mgHist = mgs.length ? mgs.reduce((a, b) => a + b, 0) / mgs.length : div(bp.eb, bp.rl), mgMax = mgs.length ? Math.max(...mgs) : div(bp.eb, bp.rl);
    const W = wacc(s, Bs, vl), K = bp.K;
    const capex = (vl.capex ?? (div(K.da, K.recLiq) * 100 || 3)) / 100, ncgp = (vl.ncgp ?? (div(K.ncg, K.recLiq) * 100 || 10)) / 100;
    const pt = ponte(s, bp), dl = pt.total;
    return {Bs, H, vl, bp, perBase, histL, total, mgHist, mgMax, W, capex, ncgp, dl, pt, nomes, y0:bp.ano};
  }
  function cenario(X, tipo, dw = 0){
    const {Bs, bp, vl, histL, W} = X, fRL = div(bp.rl, bp.rb) || 1, g = (1 + Bs.P.gReal.v / 100) * (1 + Bs.P.infBR.v / 100) - 1, w = W.wacc + dw;
    let rec = {...bp.lin}; if (!Object.keys(rec).length) rec = {Receita:bp.rb};
    const mg = tipo === "mod" ? X.mgHist : (vl.margemOt != null ? vl.margemOt / 100 : div(bp.eb, bp.rl));
    const anos = []; let rlAnt = bp.rl, vp = 0;
    for (let t = 1; t <= 5; t++){ const y = X.y0 + t, inf = ipcaAno(Bs, y); let rb = 0;
      Object.keys(rec).forEach(l => { const gr = tipo === "mod" ? cl(histL[l]?.real ?? 0, -.1, .15) : (vl.prem?.[l]?.real != null ? vl.prem[l].real / 100 : cl(histL[l]?.real ?? 0, -.1, .15)); rec[l] = rec[l] * (1 + gr) * (1 + inf); rb += rec[l]; });
      let rl = rb * fRL, eb = rl * mg, novos = 0;
      if (tipo === "ot") Object.values(vl.novos || {}).filter(Boolean).forEach(nv => { const ini = +nv.inicio || 1; if (t < ini) return; let r = (+nv.rec1 || 0) * 1e6; for (let k = ini; k < t; k++) r *= (1 + (+nv.cresc || 0) / 100); let idx = 1; for (let k = 1; k <= t; k++) idx *= 1 + ipcaAno(Bs, X.y0 + k); r *= idx; novos += r; eb += r * (+nv.margem || 0) / 100; });
      rl += novos; const da = rl * X.capex, ebit = eb - da, ir = Math.max(0, ebit) * W.t, dncg = (rl - rlAnt) * X.ncgp, fcl = eb - ir - rl * X.capex - dncg;
      vp += fcl / Math.pow(1 + w, t - .5); anos.push({t, y, rl, eb, mg:div(eb, rl), fcl, novos, cres:div(rl, rlAnt) - 1}); rlAnt = rl; }
    /* perpetuidade (Gordon) com o capital de giro crescendo à taxa g e desconto no meio do período, como nos modelos Kinsey */
    const u = anos[4], fclP = u.eb * (1 + g) - Math.max(0, u.eb - u.rl * X.capex) * (1 + g) * W.t - u.rl * X.capex * (1 + g) - u.rl * X.ncgp * g;
    const tv = w > g ? fclP / (w - g) : 0, vtv = tv / Math.pow(1 + w, 4.5), ev = vp + vtv;
    return {anos, ev, vtv, g, w, mg, fclP, eq:ev - X.dl, mult:div(ev, bp.eb)};
  }
  const faixa = (X, tipo) => { const c = cenario(X, tipo), a = cenario(X, tipo, .01), b = cenario(X, tipo, -.01); return {c, min:Math.min(a.ev, b.ev), max:Math.max(a.ev, b.ev)}; };

  /* ---------------- MÚLTIPLOS ---------------- */
  const stats = arr => { const v = arr.filter(x => x != null && isFinite(x)).sort((a, b) => a - b); if (!v.length) return null; const q = p => { const i = (v.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return v[lo] + (v[hi] - v[lo]) * (i - lo); }; return {n:v.length, p25:q(.25), med:q(.5), p75:q(.75), min:v[0], max:v[v.length - 1]}; };
  function comparaveis(s){
    const seg = s.perfil?.segmento || s.segmento, sim = s.perfil?.segSim || SEG_SIM[seg] || [], ex = s.dd?.vl?.exComp || {};
    const todos = [...(S.mercadoComp?.lista || []).map(c => ({...c, origem:"CVM/B3 (automático)"})), ...(S.config.comparaveis?.lista || []).map(c => ({...c, origem:c.origem || "Base Kinsey"}))]
      .map(c => ({...c, id:c.id || (c.ticker || c.nome), evEb:div(c.ev, c.ebitda), evRec:div(c.ev, c.rec), pl:div(c.mcap, c.ll), mg:div(c.ebitda, c.rec)}));
    const L = todos.filter(c => c.seg === seg || sim.includes(c.seg)).map(c => ({...c, mesmo:c.seg === seg, fora:!(c.evEb > 0 && c.evEb < 40), excl:!!ex[c.id]}));
    const ok = L.filter(c => !c.fora && !c.excl);
    return {L, ok, seg, sim, eb:stats(ok.map(c => c.evEb)), rec:stats(ok.map(c => c.evRec)), pl:stats(ok.filter(c => c.pl > 0 && c.pl < 60).map(c => c.pl)), mg:stats(ok.map(c => c.mg))};
  }
  function transacoes(s){
    const seg = s.perfil?.segmento || s.segmento, sim = s.perfil?.segSim || SEG_SIM[seg] || [];
    const L = (S.config.transacoes?.lista || []).filter(t => t.seg === seg || sim.includes(t.seg)).map(t => ({...t, evEb:div(t.ev, t.ebitda), evRec:div(t.ev, t.rec)}));
    return {L, eb:stats(L.map(t => t.evEb).filter(x => x > 0 && x < 40)), rec:stats(L.map(t => t.evRec).filter(x => x > 0))};
  }

  /* ---------------- COMPARATIVO · EBITDA APURADO × MÚLTIPLOS DE MERCADO ----------------
     Sempre: o EBITDA do target pela base contábil (balancete) e pela base financeira (ajustes da Due Diligence)
     frente aos múltiplos EV/EBITDA de companhias do mesmo segmento e de segmentos semelhantes. */
  function proposta(s){ const c = S.contracts.filter(c => c.supplierId === s.id && /LOI|SPA|MOU|proposta/i.test(c.tipo || "") && num(c.volume)).sort((a, b) => String(b.criadoEm).localeCompare(a.criadoEm))[0];
    return c ? {ev:num(c.volume) * 1e6, rot:`${c.tipo} ${c.numero || ""}`.trim()} : null; }
  function cmpEbitda(s, R){
    const X = R.X, C = R.C, T = R.T, d = 1 - X.Bs.P.desc.v / 100, per = X.perBase, AJ = D.ajustes(s, per);
    const ebFin = X.bp.ebRep + D.soma(AJ.filter(D.okFin)).ebitda, anu = X.H.anuais;
    const bases = [
      {k:"cont", rot:"EBITDA contábil", sub:`balancete ${per}${X.bp.meses < 12 ? `, ${X.bp.meses} meses anualizado` : ""}, sem ajustes`, eb:X.bp.ebRep},
      {k:"fin", rot:"EBITDA financeiro ajustado", sub:`ajustes da Due Diligence com OK no valuation (${AJ.filter(D.okVal).length})`, eb:X.bp.eb}];
    if (Math.abs(ebFin - X.bp.eb) > 1) bases.push({k:"finP", rot:"EBITDA ajustado · OK só nas análises", sub:"inclui ajustes ainda sem OK no valuation", eb:ebFin});
    if (anu.length >= 2) bases.push({k:"med", rot:"EBITDA ajustado médio dos exercícios", sub:anu.map(a => a.ano).join(", "), eb:anu.reduce((t, a) => t + a.eb, 0) / anu.length});
    bases.forEach(b => b.mg = div(b.eb, X.bp.rl));
    const mesmo = stats(C.ok.filter(c => c.mesmo).map(c => c.evEb)), semel = stats(C.ok.filter(c => !c.mesmo).map(c => c.evEb));
    const grupos = [["Mesmo segmento", C.seg || "—", mesmo, stats(C.ok.filter(c => c.mesmo).map(c => c.mg))], ["Segmentos semelhantes", C.sim.join(", ") || "—", semel, stats(C.ok.filter(c => !c.mesmo).map(c => c.mg))], ["Todas as comparáveis (usadas no valuation)", "", C.eb, C.mg], ["Transações comparáveis", "", T.eb, null]].filter(g => g[2]);
    const ref = mesmo && mesmo.n >= 3 ? {nome:"mesmo segmento", st:mesmo} : C.eb ? {nome:mesmo ? "mesmo segmento e semelhantes (menos de 3 do mesmo segmento)" : "segmentos semelhantes (sem comparável do mesmo segmento)", st:C.eb} : null;
    const pos = m => !ref || m == null || !isFinite(m) ? "—" : m < ref.st.p25 * d ? "abaixo do mercado" : m > ref.st.p75 ? "acima do mercado" : "dentro da faixa";
    const fcd = R.mod.c.ev, ot = R.ot.c.ev, meio = R.rec ? (R.rec[0] + R.rec[1]) / 2 : null, pr = proposta(s);
    const evs = [["FCD moderado", fcd], ["FCD otimista", ot], ["Meio da faixa moderada", meio], ...(pr ? [[`Proposta (${pr.rot})`, pr.ev]] : [])].filter(e => e[1]);
    const impl = evs.map(([rot, ev]) => ({rot, ev, cont:div(ev, X.bp.ebRep), fin:div(ev, X.bp.eb)}));
    const gap = X.bp.eb - X.bp.ebRep, gapPc = div(gap, Math.abs(X.bp.ebRep));
    return {d, bases, grupos, ref, pos, impl, gap, gapPc, efeitoEv:ref ? gap * ref.st.med * d : null, mesmo, semel, pr};
  }
  function vCmpEbitda(s, R, compacto){
    const Q = cmpEbitda(s, R), X = R.X, st = o => o ? `${xx(o.p25)} · ${xx(o.med)} · ${xx(o.p75)}` : "—";
    if (!Q.ref) return `<div class="card"><h3>EBITDA apurado × múltiplos de mercado</h3><div class="empty">Sem comparáveis do mesmo segmento ou semelhantes. Inclua companhias na base Kinsey ou atualize pela CVM/B3 na aba Múltiplos de mercado.</div></div>`;
    const r = Q.ref.st, d = Q.d;
    const L1 = (t, sub) => `<div style="min-width:170px"><b>${esc(t)}</b>${sub ? `<div class="sub" style="margin:0;font-size:11.5px">${esc(sub)}</div>` : ""}</div>`;
    const tMerc = tbl(["Comparáveis (EV/EBITDA)", "Cias.", "p25", "Mediana", "p75", "Mediana com desconto", "Margem EBITDA"], Q.grupos.map(g => tr([L1(g[0], g[1]), String(g[2].n), xx(g[2].p25), `<b>${xx(g[2].med)}</b>`, xx(g[2].p75), xx(g[2].med * d), g[3] ? pc(g[3].med) : "—"])));
    const ms = Q.mesmo, sm = Q.semel;
    const tBase = tbl(["EBITDA do target", "Valor", "Margem", ms ? `EV · mediana mesmo segmento (${xx(ms.med * d)})` : null, sm ? `EV · mediana semelhantes (${xx(sm.med * d)})` : null, `EV · faixa p25 a p75 (${Q.ref.nome.split(" (")[0]})`, "Equity · mediana"].filter(Boolean),
      Q.bases.map(b => tr([L1(b.rot, b.sub), mi(b.eb), pc(b.mg), ms ? `<b>${mi(b.eb * ms.med * d)}</b>` : null, sm ? mi(b.eb * sm.med * d) : null, `${mi(b.eb * r.p25 * d)} a ${mi(b.eb * r.p75 * d)}`, mi(b.eb * r.med * d - X.dl)].filter(x => x != null))));
    const tImp = tbl(["Valor de referência", "Enterprise value", "× EBITDA contábil", "× EBITDA ajustado", "Posição frente ao mercado (ajustado)"], Q.impl.map(i => tr([L1(i.rot), mi(i.ev), xx(i.cont), `<b>${xx(i.fin)}</b>`, esc(Q.pos(i.fin))])));
    const resumoTxt = `Diferença entre o EBITDA ajustado e o contábil: ${mi(Q.gap)} (${pc(Q.gapPc)}), efeito de ${mi(Q.efeitoEv)} no enterprise value pela mediana de ${xx(r.med * d)}.`;
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div><h3>EBITDA apurado × múltiplos de mercado</h3>
      <p class="sub" style="margin:2px 0 0">EBITDA do target pela base contábil (balancete) e pela base financeira (ajustes da Due Diligence) frente ao EV/EBITDA de companhias do ${esc(Q.ref.nome)}. Desconto de liquidez de ${fmt(X.Bs.P.desc.v, 0)}% por ser empresa fechada.</p></div>
      ${compacto ? "" : tMerc}${tBase}${tImp}<p class="sub" style="margin:0">${esc(resumoTxt)}</p></div>`;
  }

  /* ---------------- ALERTAS ---------------- */
  function alertas(s, X){
    const out = [], vl = X.vl, P = X.Bs.P, just = vl.just || {}, add = (nivel, txt, key) => out.push({nivel, txt, key, ok:key ? !!just[key]?.texto : false});
    if (X.W.ajustado && !vl.waccJust?.texto) add("bloqueio", `WACC ajustado pelo consultor (${pc(X.W.wacc)} contra ${pc(X.W.waccAuto)} automático) sem justificativa.`);
    const f = perfilFalta(s); if (f.length) add("bloqueio", `Cadastro para valuation incompleto: ${f.join(", ")}.`);
    if (X.H.anuais.length < 2) add("bloqueio", `Histórico com ${X.H.anuais.length} exercício(s) completo(s). O mínimo é 2 (ideal 3): importe os balancetes de dezembro na Due Diligence.`);
    else if (X.H.anuais.length < 3) add("aviso", "Histórico com 2 exercícios. O ideal são 3 para medir o crescimento.");
    X.nomes.forEach(l => { const h = X.histL[l]?.real, e = vl.prem?.[l]?.real; if (e == null) return;
      if (h == null) add("justificar", `${l}: crescimento real de ${pc(e / 100)} sem histórico de comparação. Justifique com orçamento, estudo técnico ou contrato.`, "g:" + l);
      else if (e / 100 > h + P.desvio.v / 100) add("justificar", `${l}: crescimento real esperado de ${pc(e / 100)} contra ${pc(h)} no histórico (${fmt((e / 100 - h) * 100, 1)} p.p. acima). Justifique o crescimento.`, "g:" + l); });
    if (vl.margemOt != null && vl.margemOt / 100 > X.mgMax + .03) add("justificar", `Margem EBITDA otimista de ${pc(vl.margemOt / 100)} acima da maior margem histórica (${pc(X.mgMax)}).`, "m");
    Object.entries(vl.novos || {}).filter(([, v]) => v).forEach(([id, nv]) => add("justificar", `Novo negócio no cenário otimista: ${nv.nome}${nv.fonte ? ` (informado por ${nv.fonte.toLowerCase()})` : ""}${+nv.margem / 100 > X.mgMax + .03 ? `, margem de ${pc(+nv.margem / 100)} acima da maior histórica (${pc(X.mgMax)})` : ""}.`, "nb:" + id));
    const C = comparaveis(s), mod = cenario(X, "mod"), ot = cenario(X, "ot");
    if (C.eb){ [["mod", "moderado", mod], ["ot", "otimista", ot]].forEach(([k, l, c]) => { if (c.mult > C.eb.p75 * 1.25 || c.mult < C.eb.p25 * .75) add(k === "ot" ? "justificar" : "aviso", `FCD ${l}: EV/EBITDA implícito de ${xx(c.mult)}, fora da faixa dos comparáveis (${xx(C.eb.p25)} a ${xx(C.eb.p75)}).`, k === "ot" ? "x:ot" : null); }); }
    else add("aviso", "Sem comparáveis de mercado para o segmento: o FCD não pode ser conferido com múltiplos.");
    if (C.eb && !C.ok.some(c => c.mesmo)) add("aviso", `Sem companhia comparável do mesmo segmento (${C.seg || "—"}): os múltiplos vêm de segmentos semelhantes.`);
    { const g = div(X.bp.eb - X.bp.ebRep, Math.abs(X.bp.ebRep)); if (g != null && Math.abs(g) > .2) add("aviso", `EBITDA financeiro ajustado ${pc(g)} diferente do contábil (${mi(X.bp.ebRep)} → ${mi(X.bp.eb)}). Confira os ajustes antes de aplicar os múltiplos.`); }
    { const pr = proposta(s), m = pr && div(pr.ev, X.bp.eb); if (m && C.eb && (m < C.eb.p25 * (1 - P.desc.v / 100) || m > C.eb.p75)) add("aviso", `Proposta ${pr.rot}: ${xx(m)} o EBITDA ajustado, fora da faixa de mercado (${xx(C.eb.p25 * (1 - P.desc.v / 100))} a ${xx(C.eb.p75)}).`); }
    if (C.mg && X.mgHist > C.mg.med * 1.6) add("aviso", `Margem EBITDA histórica de ${pc(X.mgHist)} bem acima da mediana do setor (${pc(C.mg.med)}). Conferir normalização na Due Diligence.`);
    const pend = D.ajustes(s, X.perBase).filter(D.pendVal); if (pend.length) add("aviso", `${pend.length} ajuste(s) de Due Diligence com OK nas análises aguardando OK no valuation.`);
    const dSel = X.Bs.mercado.selic - P.selic.v; if (Math.abs(dSel) >= .5) add("aviso", `Selic de mercado (${fmt(X.Bs.mercado.selic, 2)}%) diferente da base de apuração (${fmt(P.selic.v, 2)}%). Revise o custo da dívida e o WACC.`);
    return out;
  }
  const podeEmitir = A => !A.some(a => a.nivel === "bloqueio" || (a.nivel === "justificar" && !a.ok));
  function justificar(s, key, txt){
    const j = s.dd?.vl?.just?.[key] || {}, evs = S.evidences.filter(e => e.supplierId === s.id);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Justificativa do consultor</div><h2>${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fju" style="display:flex;flex-direction:column;gap:12px" novalidate><div class="banner">${esc(txt)}</div><div class="form">
        <div class="fld"><label for="ju-t">Fundamento</label><select id="ju-t">${["Orçamento aprovado pela gestão","Estudo técnico ou de mercado","Novo contrato ou cliente","Nova capacidade ou investimento","Novo mercado ou negócio","Outro"].map(x => `<option ${x === j.tipo ? "selected" : ""}>${x}</option>`).join("")}</select></div>
        <div class="fld"><label for="ju-e">Documento de suporte</label><select id="ju-e"><option value="">Nenhum anexado</option>${evs.map(e => `<option value="${e.id}" ${e.id === j.evid ? "selected" : ""}>${esc(e.tipo)} · ${esc(e.nome || dt(e.criadoEm))}</option>`).join("")}</select></div>
        <div class="fld full"><label for="ju-x">Motivos reais do crescimento ou da margem</label><textarea id="ju-x" rows="5" placeholder="ex.: contrato de fornecimento assinado com a rede X a partir de março, 18% de aumento de volume (orçamento 2027 aprovado em ata)">${esc(j.texto || "")}</textarea></div></div>
        <p class="sub" style="margin:0">Mesmo justificado, este ponto entra só no cenário otimista; o cenário moderado segue o histórico.</p><p class="err" id="ju-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button>${S.evidences ? `<button type="button" class="btn" id="ju-anx">Anexar documento</button>` : ""}<button type="submit" class="btn primary">Registrar justificativa</button></div></form>`);
    const ax = $("#ju-anx"); if (ax) ax.onclick = () => { close(); openEvidenceForm(s.id, "Laudo / valuation"); };
    $("#fju").onsubmit = e => { e.preventDefault(); const t = $("#ju-x").value.trim(); if (t.length < 30){ $("#ju-err").textContent = "Descreva os motivos com pelo menos 30 caracteres."; $("#ju-err").hidden = false; return; }
      up(s, {dd:{vl:{just:{[key]:{tipo:$("#ju-t").value, evid:$("#ju-e").value, texto:t, por:Store.me?.email || "", em:nowISO()}}}}}).then(() => { close(); toast("Justificativa registrada"); }); };
  }

  /* ---------------- PAINÉIS RÁPIDOS · FCD E MÚLTIPLOS ----------------
     Resumo prático para consulta (sem fontes na tela: as fontes saem nos relatórios). Funcionam também sem balanços,
     com o faturamento do cadastro e a margem de referência do setor (FCD prévio). */
  const REF_MG = {Serviços:.12, Industrial:.13, Saúde:.12, Alimentos:.10, Varejo:.07, Logística:.11, Tecnologia:.18, Agro:.15, Construção:.10, Educação:.20, Energia:.30, Outros:.12};
  /* referência Kinsey de múltiplos por setor (EV/EBITDA p25 · mediana · p75; EV/Receita mediana), usada só enquanto não há comparáveis carregados */
  const REF_M = {Serviços:[5.5, 7, 9, .8], Industrial:[5, 6.5, 8.5, .9], Saúde:[7, 9, 12, 1.2], Alimentos:[5.5, 7, 9, .7], Varejo:[4.5, 6, 8, .4], Logística:[5, 6.5, 8, .7], Tecnologia:[7, 10, 14, 2], Agro:[4.5, 6, 8, .8], Construção:[4, 5.5, 7, .6], Educação:[6, 8, 10, 1.6], Energia:[6, 7.5, 9, 2.5], Outros:[5, 6.5, 8, .8]};
  function refC(C){ if (C.eb) return C; const r = REF_M[C.seg] || REF_M.Outros; return {...C, ref:true, eb:{n:0, p25:r[0], med:r[1], p75:r[2]}, rec:{n:0, p25:r[3] * .7, med:r[3], p75:r[3] * 1.3}, mg:{med:REF_MG[C.seg] || .12}}; }
  function prev(s){
    const Bs = base(), vl = s.dd?.vl || {}, W = wacc(s, Bs, vl), C = comparaveis(s), seg = s.perfil?.segmento || s.segmento || "Outros";
    const fat = window.KT_POL ? KT_POL.fatMi(s) : (s.fin?.receita ?? null); if (fat == null) return {Bs, W, C, vl, seg, vazio:true};
    const mg = vl.mgPrev != null ? vl.mgPrev / 100 : (C.mg?.med || REF_MG[seg] || .12), fonteMg = vl.mgPrev != null ? "informada pelo consultor" : C.mg ? `mediana de ${C.mg.n} comparáveis` : `referência Kinsey para ${seg}`;
    const capex = .03, ncgp = .10, g = (1 + Bs.P.gReal.v / 100) * (1 + Bs.P.infBR.v / 100) - 1, w = W.wacc, y0 = new Date().getFullYear() - 1;
    let rl = fat * 1e6, rlAnt = rl, vp = 0; const anos = [];
    for (let t = 1; t <= 5; t++){ rl *= 1 + ipcaAno(Bs, y0 + t); const eb = rl * mg, ir = Math.max(0, eb - rl * capex) * W.t, fcl = eb - ir - rl * capex - (rl - rlAnt) * ncgp; vp += fcl / Math.pow(1 + w, t - .5); anos.push({y:y0 + t, rl, eb, fcl}); rlAnt = rl; }
    const u = anos[4], fclP = u.eb * (1 + g) - Math.max(0, u.eb - u.rl * capex) * (1 + g) * W.t - u.rl * capex * (1 + g) - u.rl * ncgp * g;
    const tv = w > g ? fclP / (w - g) : 0, vtv = tv / Math.pow(1 + w, 4.5), ev = vp + vtv, eb0 = fat * 1e6 * mg;
    return {Bs, W, C, vl, seg, rl:fat * 1e6, mg, fonteMg, eb:eb0, ev, vtv, mult:div(ev, eb0), g, anos, fonteF:s.fin?.fonte || (s.mapa?.fat ? "mapa M&A" : "cadastro")};
  }
  function waccRows(W, Bs, vl){ const P = Bs.P;
    return [["Taxa livre de risco (USD)", pc(P.rf.v / 100)], ["Beta desalavancado · " + W.seg, fmt(W.bu, 2)], ["Dívida / patrimônio", fmt(W.de, 2) + (vl.de != null ? " (consultor)" : " (setorial)")], ["Beta realavancado", fmt(W.bl, 2)],
      ["Prêmio de mercado (ERP)", pc(P.erp.v / 100)], ["Risco-país", pc(P.crp.v / 100)], ["Prêmio de tamanho", pc(W.size / 100)], ["Custo do capital próprio (R$)", pc(W.ke)], ["Custo da dívida após IR", pc(W.kdLiq)],
      ["Estrutura de capital (próprio / dívida)", `${pc(W.we, 0)} / ${pc(W.wd, 0)}`], ["WACC calculado", pc(W.waccCalc)], ["<b>WACC usado</b>", `<b>${pc(W.wacc)}</b>${vl.waccManual != null ? " (consultor)" : ""}`]]; }
  function revisarWacc(s){
    const Bs = base(), vl = s.dd?.vl || {}, W = wacc(s, Bs, vl), e2 = ed() ? "" : "disabled", J = vl.waccJust || {};
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(s.nome)} · ${esc(W.seg)}</div><h2>WACC pelo CAPM</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="frw" style="display:flex;flex-direction:column;gap:12px" novalidate>${tbl(["Componente", "Valor"], waccRows(W, Bs, vl).map(r => tr(r)))}
        <div class="banner" style="font-size:13px"><b>WACC automático ${pc(W.waccAuto)}.</b> O consultor pode ajustar os componentes ou a taxa, com justificativa, até 3 p.p. para cima ou para baixo: de ${pc(W.lim[0])} a ${pc(W.lim[1])}.</div>
        ${ed() ? `<div class="form"><div class="fld"><label for="rw-de">Dívida / patrimônio</label><input id="rw-de" inputmode="decimal" value="${vl.de != null ? fmt(vl.de, 2) : ""}" placeholder="${fmt(Bs.betas[W.seg]?.[1] ?? W.de, 2)} (setorial)"></div><div class="fld"><label for="rw-sz">Prêmio de tamanho (%)</label><input id="rw-sz" inputmode="decimal" value="${vl.size != null ? fmt(vl.size, 1) : ""}" placeholder="${fmt(Bs.P.size.v, 1)} (base)"></div>
          <div class="fld"><label for="rw-wm">WACC definido pelo consultor (%)</label><input id="rw-wm" inputmode="decimal" value="${vl.waccManual != null ? fmt(vl.waccManual, 2) : ""}" placeholder="vazio = pelos componentes"></div>
          <div class="fld"><label for="rw-t">Fundamento</label><select id="rw-t">${["Risco específico da empresa", "Estrutura de capital-alvo", "Porte e liquidez", "Concentração de clientes ou fornecedores", "Governança e dependência dos sócios", "Condições de mercado do setor", "Outro"].map(x => `<option ${x === J.tipo ? "selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="fld full"><label for="rw-j">Justificativa do ajuste (obrigatória)</label><textarea id="rw-j" rows="4" placeholder="ex.: 60% da receita em dois clientes; acrescentado 1,5 p.p. de risco específico">${esc(J.texto || "")}</textarea></div></div>
        <div id="rw-prev" class="sub" style="margin:0"></div><p class="err" id="rw-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn ghost" data-x>Cancelar</button>${W.ajustado ? `<button type="button" class="btn" id="rw-auto">Voltar ao automático</button>` : ""}<button type="submit" class="btn primary">Salvar ajuste</button></div>` : ""}</form>`);
    if (!ed()) return;
    const novo = () => ({de:n($("#rw-de").value), size:n($("#rw-sz").value), waccManual:n($("#rw-wm").value)});
    const calcula = () => { const v = novo(), W2 = wacc(s, Bs, v), alvo = v.waccManual != null ? v.waccManual / 100 : W2.waccComp, fora = alvo < W2.lim[0] - 1e-9 || alvo > W2.lim[1] + 1e-9;
      $("#rw-prev").innerHTML = `WACC resultante: <b>${pc(alvo)}</b> (automático ${pc(W2.waccAuto)}, diferença ${fmt((alvo - W2.waccAuto) * 100, 2)} p.p.)${fora ? ` · <b style="color:var(--bad)">fora do limite de ±3 p.p.</b>` : ""}`; return {v, fora, alvo}; };
    ["rw-de", "rw-sz", "rw-wm"].forEach(id => $("#" + id).oninput = calcula); calcula();
    const a = $("#rw-auto"); if (a) a.onclick = () => up(s, {dd:{vl:{de:null, size:null, waccManual:null, waccJust:null}}}).then(() => { close(); toast("WACC automático restabelecido"); });
    $("#frw").onsubmit = e => { e.preventDefault(); const {v, fora} = calcula(), j = $("#rw-j").value.trim(), err = t => { $("#rw-err").textContent = t; $("#rw-err").hidden = false; };
      const mudou = v.de != null || v.size != null || v.waccManual != null;
      if (!mudou){ up(s, {dd:{vl:{de:null, size:null, waccManual:null, waccJust:null}}}).then(() => { close(); toast("WACC automático"); }); return; }
      if (fora) return err(`O ajuste passa do limite: o WACC deve ficar entre ${pc(W.lim[0])} e ${pc(W.lim[1])} (automático ±3 p.p.).`);
      if (j.length < 30) return err("Escreva a justificativa do ajuste (mínimo de 30 caracteres).");
      up(s, {dd:{vl:{...v, waccJust:{tipo:$("#rw-t").value, texto:j, por:Store.me?.email || "", em:nowISO(), auto:W.waccAuto}}}}).then(() => { close(); toast("Ajuste do WACC registrado com justificativa"); }); };
  }
  function bindTopo(host, s){
    const ok = $("#vw-ok", host), c = $("#vw-calc", host), r = $("#vw-rev", host), m = $("#vw-mg", host);
    if (ok) ok.onclick = () => revisarWacc(s);
    if (c) c.onclick = () => up(s, {dd:{vl:{de:null, size:null, waccManual:null, waccJust:null}}}).then(() => toast("WACC automático restabelecido"));
    if (r) r.onclick = () => revisarWacc(s);
    if (m) m.onchange = () => up(s, {dd:{vl:{mgPrev:n(m.value)}}});
  }
  const waccBox = (W, vl) => `<div class="card" style="display:flex;flex-direction:column;gap:8px;padding:12px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
      <div><b>WACC ${pc(W.wacc)}</b> <span class="sub" style="font-size:12px">${W.ajustado ? `ajustado pelo consultor · automático ${pc(W.waccAuto)} (${(W.wacc - W.waccAuto) >= 0 ? "+" : ""}${fmt((W.wacc - W.waccAuto) * 100, 2)} p.p.)` : "automático pelo CAPM"} · ajuste permitido de ${pc(W.lim[0])} a ${pc(W.lim[1])}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" id="vw-rev">Revisar cálculo</button>${ed() ? `<button type="button" class="btn sm primary" id="vw-ok">Ajustar com justificativa</button>${W.ajustado ? `<button type="button" class="btn sm ghost" id="vw-calc">Voltar ao automático</button>` : ""}` : ""}</div></div>
    ${W.ajustado ? (W.just?.texto ? `<div class="sub" style="margin:0;font-size:12px"><b>Justificativa (${esc(W.just.tipo || "")}):</b> ${esc(W.just.texto)}</div>` : `<div class="banner" style="border-color:var(--bad);font-size:13px"><b>WACC ajustado sem justificativa.</b> Justifique para emitir o valuation.</div>`) : ""}${W.limitado ? `<div class="sub" style="margin:0;font-size:12px;color:var(--bad)">Ajuste limitado a ±3 p.p. do automático.</div>` : ""}</div>`;
  /* múltiplos apurados por grupo: mesmo segmento, semelhantes e todos */
  function grupos(C){ const G = (rot, sub, L) => L.length ? {rot, sub, n:L.length, eb:stats(L.map(c => c.evEb)), rec:stats(L.map(c => c.evRec)), pl:stats(L.filter(c => c.pl > 0 && c.pl < 60).map(c => c.pl)), mg:stats(L.map(c => c.mg))} : null;
    return [G("Mesmo segmento", C.seg || "—", C.ok.filter(c => c.mesmo)), G("Segmentos semelhantes", C.sim.join(", ") || "—", C.ok.filter(c => !c.mesmo)), G("Todos (usados no valuation)", "", C.ok)].filter(Boolean); }
  function confronto(C0, d, itens){
    const C = refC(C0);
    if (!C.eb) return `<div class="banner" style="border-color:var(--warn,#F5B94F)"><b>Sem múltiplos de mercado para ${esc(C.seg || "o segmento")}.</b> O FCD não pode ser conferido com o mercado: inclua comparáveis ou atualize pela CVM/B3 na aba Múltiplos.</div>`;
    const lo = C.eb.p25 * d, hi = C.eb.p75, pos = m => m == null || !isFinite(m) ? "—" : m < C.eb.p25 * .75 ? "muito abaixo" : m < lo ? "abaixo" : m > hi * 1.25 ? "muito acima" : m > hi ? "acima" : "dentro";
    const cor = p => /muito/.test(p) ? "var(--bad)" : p === "dentro" ? "var(--ok)" : "var(--warn,#F5B94F)";
    const L = itens.filter(i => i.mult != null && isFinite(i.mult));
    const tab = tbl(["Múltiplo EV/EBITDA", "Valor", "Frente ao mercado"], [tr([C.ref ? `Referência Kinsey · ${esc(C.seg || "")}` : `Mercado · p25 com desconto a p75`, `${xx(lo)} a ${xx(hi)}`, C.ref ? `mediana ${xx(C.eb.med)} · sem comparáveis carregados` : `mediana ${xx(C.eb.med)} · ${C.eb.n} cias.`]), ...L.map(i => { const p = pos(i.mult); return tr([esc(i.rot), `<b>${xx(i.mult)}</b>`, `<b style="color:${cor(p)}">${p === "dentro" ? "dentro da faixa" : p + " do mercado"}</b>`]); })]);
    const al = L.map(i => ({i, p:pos(i.mult)})).filter(x => /muito/.test(x.p) || (x.i.tipo === "ot" && x.p !== "dentro" && x.p !== "—")).map(({i, p}) => i.tipo === "ot"
      ? `<div class="banner" style="border-color:var(--warn,#F5B94F)"><b>Otimista ${p} do mercado (${xx(i.mult)}).</b> Aceito somente com informações dos sócios ou da administração sobre novos negócios já em funcionamento ou com estudos que comprovem, registradas nas premissas do otimista, com justificativa. Margens acima do histórico exigem justificativa.</div>`
      : `<div class="banner" style="border-color:var(--bad)"><b>Atenção, consultor: ${esc(i.rot)} ${p} do mercado (${xx(i.mult)} contra ${xx(lo)} a ${xx(hi)}).</b> Revise as práticas do FCD: WACC, margem, crescimento, capex, capital de giro e perpetuidade. O cenário moderado deve seguir o histórico; o que for novo vai para o otimista.</div>`).join("");
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3 style="margin:0">Confronto com o mercado</h3>${tab}</div>${al}`;
  }
  function multCard(C0, d, eb, rl, rotBase){
    const C = refC(C0), st = (o, f = xx) => o ? `${f(o.p25)} · <b>${f(o.med)}</b> · ${f(o.p75)}` : "—";
    const G = C.ref ? [{rot:`Referência Kinsey · ${C.seg || "Outros"}`, sub:"múltiplos de referência do setor até carregar as companhias comparáveis (CVM/B3 ou base Kinsey)", n:"—", eb:C.eb, rec:C.rec, pl:null, mg:C.mg}] : grupos(C);
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">Múltiplos de mercado apurados</div><h3 style="margin:2px 0 0">${esc(C.seg || "—")}${C.sim.length ? ` · semelhantes: ${esc(C.sim.join(", "))}` : ""}</h3></div>
      ${tbl(["Grupo", "Cias.", "EV/EBITDA (p25 · med · p75)", "EV/Receita (med)", "P/L (med)", "Margem EBITDA (med)"], G.map(g => tr([`<b>${esc(g.rot)}</b>${g.sub ? `<div class="sub" style="margin:0;font-size:11.5px">${esc(g.sub)}</div>` : ""}`, String(g.n), st(g.eb), g.rec ? xx(g.rec.med, 2) : "—", g.pl ? xx(g.pl.med) : "—", g.mg ? pc(g.mg.med) : "—"])))}
      ${eb != null && C.eb ? `<div class="dd-kpis">${k("EV pela mediana", mi(eb * C.eb.med * d), `${esc(rotBase)} ${mi(eb)} × ${xx(C.eb.med * d)}`)}${k("EV pela faixa", `${mi(eb * C.eb.p25 * d)} a ${mi(eb * C.eb.p75 * d)}`, "p25 a p75, com desconto de liquidez")}${C.rec && rl ? k("EV/Receita (mediana)", mi(rl * C.rec.med * d), `receita ${mi(rl)}`) : ""}</div>` : ""}
      ${C.ref ? `<div class="banner" style="font-size:13px"><b>Sem companhias comparáveis carregadas para ${esc(C.seg || "o segmento")}${C.sim.length ? ` e semelhantes (${esc(C.sim.join(", "))})` : ""}.</b> Usando a referência Kinsey do setor. Atualize pela CVM/B3 ou inclua comparáveis abaixo.</div>` : ""}
      <p class="sub" style="margin:0;font-size:12px">Desconto de liquidez de ${fmt((1 - d) * 100, 0)}% por ser empresa fechada. As fontes de cada companhia saem nos relatórios.</p></div>`;
  }
  function fcdTopo(s, R){
    const {X} = R, K = X.bp.K, mod = R.mod.c, ot = R.ot.c, rl = X.bp.rl, ll = K.ll + X.bp.A.lucro, d = 1 - X.Bs.P.desc.v / 100;
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">FCD · resumo da apuração</div><h3 style="margin:2px 0 0">Data-base ${esc(X.perBase)} · ${X.H.anuais.length} exercício(s) · moderado (histórico) e otimista (premissas)</h3></div>
      <div class="dd-kpis">${k("Receita líquida", mi(rl), X.bp.meses < 12 ? `${X.bp.meses} meses anualizado` : "exercício")}${k("EBITDA ajustado", mi(X.bp.eb), `contábil ${mi(X.bp.ebRep)}`)}${k("Margem bruta", pc(div(K.lucroBruto, rl)))}${k("Margem EBITDA", pc(div(X.bp.eb, rl)), `média histórica ${pc(X.mgHist)}`)}${k("Margem líquida", pc(div(ll, rl)))}
        ${k("EV moderado", mi(mod.ev), `${xx(mod.mult)} o EBITDA · equity ${mi(mod.eq)}`)}${k("EV otimista", mi(ot.ev), `${xx(ot.mult)} o EBITDA`)}${k("Perpetuidade / EV", pc(div(mod.vtv, mod.ev), 0), `g nominal ${pc(mod.g)}`)}</div>
      ${waccBox(X.W, X.vl)}</div>${confronto(R.C, d, [{rot:"FCD moderado", mult:mod.mult, tipo:"mod"}, {rot:"FCD otimista", mult:ot.mult, tipo:"ot"}])}`;
  }
  function vPrev(s, tab){
    const Pv = prev(s), d = 1 - Pv.Bs.P.desc.v / 100;
    if (Pv.vazio) return `<div class="card"><h3>${esc(s.nome)}</h3><p class="sub">Sem faturamento no cadastro: informe o faturamento ou importe os balanços no cadastro do projeto.</p></div>${tab === "mult" ? multCard(Pv.C, d, null, null, "") : ""}`;
    const head = `<div class="banner" style="font-size:13px"><b>Prévia sem balanços.</b> Receita do ${esc(Pv.fonteF)} e margem EBITDA de ${esc(Pv.fonteMg)}. Quando os balanços chegarem pelo cadastro do projeto, o FCD passa a usar o histórico.</div>`;
    if (tab === "mult") return head + multCard(Pv.C, d, Pv.eb, Pv.rl, "EBITDA estimado") + confronto(Pv.C, d, [{rot:"FCD prévio (moderado)", mult:Pv.mult, tipo:"mod"}]);
    return head + `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div><div class="eyebrow">FCD prévio · moderado</div><h3 style="margin:2px 0 0">${esc(Pv.seg)} · projeção de 5 anos com crescimento pela inflação</h3></div>
      <div class="dd-kpis">${k("Receita anual", mi(Pv.rl), Pv.fonteF)}${k("Margem EBITDA", pc(Pv.mg), Pv.fonteMg)}${k("EBITDA estimado", mi(Pv.eb))}${k("Enterprise value prévio", mi(Pv.ev), `${xx(Pv.mult)} o EBITDA`)}${k("Perpetuidade / EV", pc(div(Pv.vtv, Pv.ev), 0), `g nominal ${pc(Pv.g)}`)}</div>
      ${ed() ? `<div class="fld" style="max-width:260px"><label for="vw-mg">Margem EBITDA da prévia (%)</label><input id="vw-mg" inputmode="decimal" value="${Pv.vl.mgPrev != null ? fmt(Pv.vl.mgPrev, 1) : ""}" placeholder="${fmt(Pv.mg * 100, 1)}"></div>` : ""}
      ${waccBox(Pv.W, Pv.vl)}
      ${tbl(["Projeção", ...Pv.anos.map(a => String(a.y))], [tr(["Receita", ...Pv.anos.map(a => mi(a.rl))]), tr(["EBITDA", ...Pv.anos.map(a => mi(a.eb))]), tr(["Fluxo de caixa livre", ...Pv.anos.map(a => mi(a.fcl))])])}
      <p class="sub" style="margin:0;font-size:12px">Capex 3% e capital de giro 10% da receita (referência). Indicativo para triagem; não substitui o valuation com balanços.</p></div>` + confronto(Pv.C, d, [{rot:"FCD prévio (moderado)", mult:Pv.mult, tipo:"mod"}]);
  }

  /* ---------------- VIEW ---------------- */
  S.valTab = S.valTab || "sintese";
  const TABS_V = [["sintese","Síntese"],["fcd","FCD"],["mult","Múltiplos"],["outras","Outras"],["divida","Dívida líquida"],["base","Base"],["rel","Relatório"]];
  const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><thead><tr>${head.map((h, i) => `<th${i ? ' class="dd-num"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  const tr = cells => `<tr>${cells.map((c, i) => `<td${i ? ' class="dd-num"' : ""}>${c}</td>`).join("")}</tr>`;
  function resumo(s){ /* usado pela síntese e pelos relatórios */
    const X = contexto(s); if (X.vazio) return {X};
    const mod = faixa(X, "mod"), ot = faixa(X, "ot"), C = comparaveis(s), T = transacoes(s), P = X.Bs.P, d = 1 - P.desc.v / 100, e = X.bp.eb;
    const met = [["FCD · moderado (histórico)", mod.min, mod.max, `WACC ${pc(X.W.wacc)} ±1 p.p.`, "#4FB0F5"]];
    if (C.eb) met.push(["Múltiplos de mercado · EV/EBITDA", e * C.eb.p25 * d, e * C.eb.p75 * d, `${xx(C.eb.p25)} a ${xx(C.eb.p75)} (${C.eb.n} cias.), −${fmt(P.desc.v, 0)}% de liquidez`, "#4FB0F5"]);
    if (C.rec) met.push(["Múltiplos de mercado · EV/Receita", X.bp.rl * C.rec.p25 * d, X.bp.rl * C.rec.p75 * d, `${xx(C.rec.p25, 2)} a ${xx(C.rec.p75, 2)}`, "#4FB0F5"]);
    const ll = X.bp.K.ll + X.bp.A.lucro; if (C.pl && ll > 0) met.push(["Múltiplos de mercado · P/L (equity)", ll * C.pl.p25 * d + X.dl, ll * C.pl.p75 * d + X.dl, `${xx(C.pl.p25)} a ${xx(C.pl.p75)} o lucro líquido ajustado de ${mi(ll)}`, "#4FB0F5"]);
    if (T.eb) met.push(["Transações comparáveis · EV/EBITDA", e * T.eb.p25, e * T.eb.p75, `${xx(T.eb.p25)} a ${xx(T.eb.p75)} (${T.eb.n} transações)`, "#4FB0F5"]);
    const pl = X.bp.K.PL + X.bp.A.pl; met.push(["Patrimônio líquido ajustado", pl + X.dl, pl + X.dl, "PL ajustado + dívida líquida (piso de referência)", "#7A8699"]);
    met.push(["FCD · otimista (justificado)", ot.min, ot.max, "premissas do consultor e novos negócios", "#C39BFF"]);
    const base2 = met.filter(m => /moderado|EV\/EBITDA/.test(m[0]) && !/Transações/.test(m[0]));
    const rec = [base2.reduce((a, m) => a + m[1], 0) / base2.length, base2.reduce((a, m) => a + m[2], 0) / base2.length];
    return {X, mod, ot, C, T, met, rec, A:alertas(s, X)};
  }
  EXT_VIEWS.valuation = function(){
    const host = $("#valuation"); if (!host) return; ouvir();
    const s = D.alvoSel(), sd = D.lado(s, D.pick, ["valuation com todos os OKs", "ajustes aguardando OK"]);
    let h = D.cab("Valuation", "Valuation", "Formas de avaliação comparativas: fluxo de caixa descontado, múltiplos de mercado e outras avaliações. Base: balancetes e ajustes com OK da Due Diligence, cadastro do target e base de apuração Kinsey.");
    const tabs = `<div class="dd-tabs">${TABS_V.map(([k2, l]) => `<button type="button" class="fbtn" data-vtab="${k2}" aria-pressed="${S.valTab === k2}">${l}</button>`).join("")}</div>`;
    if (S.valTab === "base"){ host.innerHTML = h + tabs + `<div style="margin-top:14px">${vBase()}</div>`; bindBase(host); $$("[data-vtab]", host).forEach(b => b.onclick = () => { S.valTab = b.dataset.vtab; renderView(); }); return; }
    if (!s || !D.temBal(s)){ host.innerHTML = h + tabs + `<div class="dd-split" style="margin-top:14px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">${s && ["fcd", "mult"].includes(S.valTab) ? vPrev(s, S.valTab) : D.semBal(s)}</div></div>`; sd.bind(host); D.bindComum(host, s); if (s) bindTopo(host, s); $$("[data-vtab]", host).forEach(b => b.onclick = () => { S.valTab = b.dataset.vtab; renderView(); }); return; }
    const R = resumo(s), X = R.X; let corpo = "";
    if (X.vazio) corpo = D.semBal(s);
    else if (S.valTab === "sintese") corpo = vSintese(s, R);
    else if (S.valTab === "fcd") corpo = vFcd(s, R);
    else if (S.valTab === "mult") corpo = vMult(s, R);
    else if (S.valTab === "outras") corpo = vOutras(s, R);
    else if (S.valTab === "rel") corpo = vRel(s, R);
    else if (S.valTab === "divida") corpo = vDivida(s, R);
    host.innerHTML = h + tabs + `<div class="dd-split" style="margin-top:14px">${sd.html}<div style="display:flex;flex-direction:column;gap:14px;min-width:0">
      <div class="card" style="display:flex;flex-direction:column;gap:6px"><div class="head" style="margin:0"><div><div class="eyebrow">${esc(s.mandato?.codinome || "Target")} · ${esc(s.perfil?.segmento || s.segmento || "")}</div><h3>${esc(s.nome)}</h3></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="sub" style="margin:0">Base ${esc(X.perBase || "—")}${X.H ? ` · ${X.H.anuais.length} exercício(s)` : ""}</span><button type="button" class="btn sm" id="v-pf">Cadastro</button></div></div>
        ${R.A ? R.A.filter(a => a.nivel !== "aviso" || S.valTab === "sintese").map(a => `<div class="banner" style="${a.nivel === "bloqueio" ? "border-color:var(--bad)" : a.ok ? "border-color:rgba(54,211,153,.45)" : ""}"><b>${a.nivel === "bloqueio" ? "Bloqueia a emissão" : a.nivel === "justificar" ? (a.ok ? "Justificado" : "Exige justificativa") : "Atenção"}.</b> ${esc(a.txt)}${a.key ? ` <button type="button" class="btn sm ${a.ok ? "ghost" : "primary"}" data-just="${esc(a.key)}" data-jtxt="${esc(a.txt)}" style="margin-left:6px">${a.ok ? "Ver justificativa" : "Justificar"}</button>` : ""}</div>`).join("") : ""}</div>
      ${corpo}</div></div>`;
    sd.bind(host); D.bindComum(host, s);
    $$("[data-vtab]", host).forEach(b => b.onclick = () => { S.valTab = b.dataset.vtab; renderView(); });
    $("#v-pf", host).onclick = () => editarPerfil(s);
    $$("[data-just]", host).forEach(b => b.onclick = () => justificar(s, b.dataset.just, b.dataset.jtxt));
    if (!X.vazio){ const AJ = D.ajustes(s, X.perBase), mid = R.C.eb ? R.C.eb.med * (1 - X.Bs.P.desc.v / 100) : 6;
      D.bindAjustes(host, s, AJ, a => `<div class="card" style="padding:10px 12px"><b>Impacto estimado no valuation</b><div class="sub" style="margin:4px 0 0">Enterprise value ${D.mil(a.v.ebitda * mid)} (EBITDA ${D.mil(a.v.ebitda)} × ${xx(mid)}) · equity ${D.mil(a.v.ebitda * mid - a.v.divida)}</div></div>`);
      bindFcd(host, s, R); bindMult(host, s, R); bindTopo(host, s); bindOutras(host, s); bindRel(host, s, R); bindDivida(host, s); }
  };

  function vSintese(s, R){
    const {X, mod, ot, met, rec} = R, AJ = D.ajustes(s, X.perBase);
    return `<div class="card" style="display:flex;flex-direction:column;gap:12px"><h3>Avaliação comparativa</h3>
      <div class="dd-kpis">${k("Enterprise value · faixa moderada", `${mi(rec[0])} a ${mi(rec[1])}`, "FCD histórico e múltiplos de mercado")}${k("(−) Dívida líquida ajustada", mi(X.dl), `balancete ${mi(X.pt.reportada)} + ajustes e complementos`)}${k("Equity value · faixa moderada", `${mi(rec[0] - X.dl)} a ${mi(rec[1] - X.dl)}`, "líquido de dívidas · 100% do capital")}
        ${k("FCD otimista (justificado)", `${mi(ot.min)} a ${mi(ot.max)}`, "não usar como referência principal")}${k("EBITDA na base", mi(X.bp.eb), `margem ${pc(div(X.bp.eb, X.bp.rl))} · WACC ${pc(X.W.wacc)}`)}</div>
      </div>${vCmpEbitda(s, R, true)}<div class="card" style="display:flex;flex-direction:column;gap:12px">
      <h3 style="font-size:14px">Enterprise value por método</h3>${D.faixas(met.map(m => [m[0], m[1], m[2]]), rec[0], rec[1])}
      <h3 style="font-size:14px">Equity value por método (líquido da dívida de ${mi(X.dl)})</h3>${D.faixas(met.map(m => [m[0], m[1] - X.dl, m[2] - X.dl]), rec[0] - X.dl, rec[1] - X.dl)}
      ${tbl(["Método", "EV mínimo", "EV máximo", "Equity mínimo", "Equity máximo", "Base"], met.map(m => tr([`<b>${esc(m[0])}</b>`, mi(m[1]), mi(m[2]), mi(m[1] - X.dl), mi(m[2] - X.dl), `<span style="font-size:12px">${esc(m[3])}</span>`])))}
      <p class="sub" style="margin:0">Dívida líquida detalhada na aba "Dívida líquida · EV → Equity": automática do balancete, com ajustes da Due Diligence e complementos do consultor.</p>
      <p class="sub" style="margin:0">A Kinsey apresenta a investidores a faixa moderada. O cenário otimista aparece separado, com as justificativas do consultor.</p></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Ajustes de Due Diligence no valuation</h3><p class="sub" style="margin:0">OK do consultor no valuation, depois do OK nas Análises financeiras.</p>${D.tabAjustes(AJ, "val")}</div>`;
  }
  function vFcd(s, R){
    const {X} = R, {H, Bs, W, vl} = X, mod = R.mod.c, ot = R.ot.c, ed2 = ed() ? "" : "disabled";
    const anos = H.anuais;
    const histT = tbl(["Exercício", "Receita líquida", "Cresc. nominal", "Cresc. real", "EBITDA ajustado", "Margem"], anos.map((p, i) => { const a = anos[i - 1], gn = a ? p.rl / a.rl - 1 : null, gr = a ? (1 + gn) / (1 + (Bs.ipca[p.ano] ?? Bs.P.infBR.v) / 100) - 1 : null; return tr([String(p.ano), mi(p.rl), pc(gn), pc(gr), mi(p.eb), pc(p.mg)]); }));
    const linT = tbl(["Linha de negócio", ...anos.map(p => String(p.ano)), "CAGR real", "Otimista (real a.a.)"], X.nomes.map(l => { const hl = X.histL[l]; return tr([esc(l), ...anos.map(p => mi(p.lin[l] || 0)), pc(hl?.real), `<input data-prem="${esc(l)}" inputmode="decimal" value="${vl.prem?.[l]?.real != null ? fmt(vl.prem[l].real, 1) : ""}" placeholder="${hl ? fmt(cl(hl.real, -.1, .15) * 100, 1) : "0"}" aria-label="Crescimento real otimista de ${esc(l)} (%)" style="width:80px;text-align:right" ${ed2}>`]); }));
    const comp = H.comp.length ? H.comp.map(g => tbl([`Comparativo ${g[0].meses} meses até ${String(g[0].mes).padStart(2, "0")}`, ...g.map(p => String(p.ano)), "Variação"], [
      tr(["Receita líquida", ...g.map(p => mi(p.rl / p.K.f)), pc(g[g.length - 1].rl / g[g.length - 2].rl - 1)]), tr(["EBITDA ajustado", ...g.map(p => mi(p.eb / p.K.f)), pc(g[g.length - 1].eb / g[g.length - 2].eb - 1)]),
      ...X.nomes.map(l => tr([esc(l), ...g.map(p => mi((p.lin[l] || 0) / p.K.f)), pc((g[g.length - 1].lin[l] || 0) / (g[g.length - 2].lin[l] || NaN) - 1)]))])).join("") : `<p class="sub" style="margin:0">Importe balancetes de períodos iguais em anos diferentes (ex.: set/2025 e set/2026, 9 meses) para o comparativo.</p>`;
    const proj = (c, l) => tbl([l, ...c.anos.map(a => String(a.y))], [tr(["Receita líquida", ...c.anos.map(a => mi(a.rl))]), tr(["Crescimento nominal", ...c.anos.map(a => pc(a.cres))]), ...(c.anos.some(a => a.novos) ? [tr(["dos quais novos negócios", ...c.anos.map(a => mi(a.novos))])] : []), tr(["EBITDA", ...c.anos.map(a => mi(a.eb))]), tr(["Margem EBITDA", ...c.anos.map(a => pc(a.mg))]), tr(["Fluxo de caixa livre", ...c.anos.map(a => mi(a.fcl))])]);
    const P = Bs.P, wr = [["Taxa livre de risco (USD)", pc(P.rf.v / 100), P.rf.fonte], ["Beta desalavancado · " + W.seg, fmt(W.bu, 2), "base setorial"], ["Dívida / patrimônio", fmt(W.de, 2), vl.de != null ? "informado pelo consultor" : "setorial"], ["Beta realavancado", fmt(W.bl, 2), "βu × (1 + (1 − t) × D/E)"],
      ["Prêmio de mercado (ERP)", pc(P.erp.v / 100), P.erp.fonte], ["Risco-país", pc(P.crp.v / 100), P.crp.fonte], ["Prêmio de tamanho", pc(W.size / 100), P.size.fonte], ["Custo do capital próprio (USD)", pc(W.keUSD), "CAPM"],
      ["Custo do capital próprio (R$)", pc(W.ke), `inflação ${fmt(P.infBR.v, 1)}% Brasil / ${fmt(P.infUS.v, 1)}% EUA`], ["Custo da dívida (antes do IR)", pc(W.kd), `Selic média Focus ${fmt(W.selicLP, 2)}% + spread ${fmt(P.spread.v, 1)} p.p.`], ["Custo da dívida (após IR)", pc(W.kdLiq), `IR/CS ${fmt(P.ir.v, 0)}%`],
      ["Estrutura de capital", `${pc(W.we, 0)} / ${pc(W.wd, 0)}`, "capital próprio / dívida"], ["<b>WACC</b>", `<b>${pc(W.wacc)}</b>`, W.ajustado ? `ajustado pelo consultor (automático ${pc(W.waccAuto)})` : "automático"]];
    return fcdTopo(s, R) + `<div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Histórico</h3>${histT}<h3 style="margin-top:6px">Por linha de negócio (receita bruta)</h3>${linT}
        <p class="sub" style="margin:0">Crescimento real descontado o IPCA de cada ano (Banco Central). Contas de receita ligadas às linhas pelo nome; ajuste em "Contas de receita" abaixo.</p>
        <details><summary class="sub">Contas de receita por linha de negócio</summary>${tbl(["Conta", "Linha"], [...new Set(H.P.flatMap(p => D.C(p.b).filter(c => c[3] === "recBruta").map(c => c[1])))].map(d => `<tr><td>${esc(d)}</td><td><select data-map="${esc(d)}" aria-label="Linha de ${esc(d)}" ${ed2}>${[...new Set([...linhasDe(s), "Outras receitas"])].map(l => `<option ${l === linhaConta(s, d) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></td></tr>`))}</details></div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Períodos comparativos</h3>${comp}</div>
      <form class="card" id="fprem" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Premissas do consultor (cenário otimista)</h3>
        <p class="sub" style="margin:0">Crescimento real por linha na tabela acima. Cenário moderado: crescimento real histórico de cada linha e margem média histórica.</p><div class="form">
        <div class="fld"><label for="pr-mg">Margem EBITDA otimista (%)</label><input id="pr-mg" inputmode="decimal" value="${vl.margemOt != null ? fmt(vl.margemOt, 1) : ""}" placeholder="${fmt(div(X.bp.eb, X.bp.rl) * 100, 1)}" ${ed2}></div>
        <div class="fld"><label for="pr-cx">Capex (% da receita)</label><input id="pr-cx" inputmode="decimal" value="${fmt(X.capex * 100, 1)}" ${ed2}></div><div class="fld"><label for="pr-nc">Capital de giro (% da receita)</label><input id="pr-nc" inputmode="decimal" value="${fmt(X.ncgp * 100, 1)}" ${ed2}></div>
</div><p class="sub" style="margin:0;font-size:12px">WACC: automático pelo CAPM; ajustes só em "Ajustar com justificativa" (limite de ±3 p.p.).</p>
        <h3 style="font-size:14px">Novos negócios e mercados (só no otimista, com justificativa)</h3><p class="sub" style="margin:0">Informações dos sócios ou da administração sobre novos negócios já em funcionamento ou com estudos que comprovem. Margem acima do histórico (${pc(X.mgMax)}) exige justificativa.</p>
        ${Object.entries(vl.novos || {}).filter(([, v]) => v).map(([id, v]) => `<div class="sub" style="margin:0">${esc(v.nome)}${v.fonte ? ` · fonte: ${esc(v.fonte)}` : ""}${v.comprova ? ` · ${esc(v.comprova)}` : ""} · receita no ano ${esc(v.inicio)}: R$ ${fmt(+v.rec1, 1)} mi · crescimento real ${fmt(+v.cresc, 1)}% · margem ${fmt(+v.margem, 1)}% ${ed() ? `<button type="button" class="btn sm ghost" data-rmnb="${id}">Remover</button>` : ""}</div>`).join("") || `<p class="sub" style="margin:0">Nenhum.</p>`}
        ${ed() ? `<div class="form"><div class="fld"><label for="nb-n">Novo negócio</label><input id="nb-n" placeholder="ex.: exportação para o Chile"></div><div class="fld"><label for="nb-i">Ano de início (1 a 5)</label><input id="nb-i" inputmode="numeric" value="1"></div><div class="fld"><label for="nb-r">Receita no 1º ano (R$ mi)</label><input id="nb-r" inputmode="decimal"></div><div class="fld"><label for="nb-c">Crescimento real a.a. (%)</label><input id="nb-c" inputmode="decimal" value="0"></div><div class="fld"><label for="nb-m">Margem EBITDA (%)</label><input id="nb-m" inputmode="decimal"></div><div class="fld"><label for="nb-f">Informação vinda de</label><select id="nb-f">${["Sócios", "Administração", "Estudo de viabilidade", "Contrato assinado", "Operação já em funcionamento"].map(x => `<option>${x}</option>`).join("")}</select></div><div class="fld full"><label for="nb-p">Comprovação (estudo, contrato, resultados já obtidos)</label><input id="nb-p" placeholder="ex.: estudo de mercado da consultoria X; operação piloto faturou R$ 1,2 mi em 2026"></div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" class="btn sm primary">Salvar premissas</button><button type="button" class="btn sm" id="nb-add">Incluir novo negócio</button></div>` : ""}</form>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>WACC pelo CAPM</h3>${tbl(["Componente", "Valor", "Fonte / cálculo"], wr.map(r => `<tr><td>${r[0]}</td><td class="dd-num">${r[1]}</td><td style="font-size:12px">${esc(r[2] || "")}</td></tr>`))}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Projeções</h3>${proj(mod, "Moderado")}${proj(ot, "Otimista")}
        ${tbl(["Resultado", "Moderado", "Otimista"], [tr(["Valor presente dos fluxos", mi(mod.ev - mod.vtv), mi(ot.ev - ot.vtv)]), tr(["Valor presente da perpetuidade", mi(mod.vtv), mi(ot.vtv)]), tr(["<b>Enterprise value</b>", `<b>${mi(mod.ev)}</b>`, `<b>${mi(ot.ev)}</b>`]), tr(["(−) Dívida líquida ajustada", mi(X.dl), mi(X.dl)]), tr(["<b>Equity value</b>", `<b>${mi(mod.eq)}</b>`, `<b>${mi(ot.eq)}</b>`]), tr(["EV / EBITDA implícito", xx(mod.mult), xx(ot.mult)]), tr(["Perpetuidade / EV", pc(div(mod.vtv, mod.ev), 0), pc(div(ot.vtv, ot.ev), 0)])])}
        <p class="sub" style="margin:0">Perpetuidade com crescimento nominal de ${pc(mod.g)} (real ${fmt(Bs.P.gReal.v, 1)}% + IPCA de longo prazo). IPCA de cada ano pelo Focus de ${esc(Bs.focus.data || "")}.</p></div>`;
  }
  function bindFcd(host, s, R){
    const f = $("#fprem", host); if (!f) return; const vlp = s.dd?.vl || {};
    f.onsubmit = e => { e.preventDefault(); const prem = {}; $$("[data-prem]", host).forEach(i => { const x = n(i.value); prem[i.dataset.prem] = {real:x}; });
      const g = id => n($("#" + id).value); up(s, {dd:{vl:{prem, margemOt:g("pr-mg"), capex:g("pr-cx"), ncgp:g("pr-nc")}}}).then(() => toast("Premissas salvas")); };
    const a = $("#nb-add", host); if (a) a.onclick = () => { const nome = $("#nb-n").value.trim(), r1 = n($("#nb-r").value); if (!nome || !r1){ toast("Informe o nome e a receita do novo negócio."); return; }
      up(s, {dd:{vl:{novos:{["n" + Date.now().toString(36)]:{nome, inicio:cl(n($("#nb-i").value) || 1, 1, 5), rec1:r1, cresc:n($("#nb-c").value) || 0, margem:n($("#nb-m").value) || 0, fonte:$("#nb-f").value, comprova:$("#nb-p").value.trim()}}}}}).then(() => toast("Novo negócio incluído: justifique para emitir")); };
    $$("[data-rmnb]", host).forEach(b => b.onclick = () => up(s, {dd:{vl:{novos:{[b.dataset.rmnb]:null}}}}));
    $$("[data-map]", host).forEach(x => x.onchange = () => up(s, {dd:{vl:{map:{[x.dataset.map]:x.value}}}}));
  }
  function vMult(s, R){
    const C = R.C, X = R.X, d = 1 - X.Bs.P.desc.v / 100, st = (o, f = xx) => o ? `${f(o.p25)} · ${f(o.med)} · ${f(o.p75)}` : "—";
    return multCard(C, d, X.bp.eb, X.bp.rl, "EBITDA ajustado") + confronto(C, d, [{rot:"FCD moderado", mult:R.mod.c.mult, tipo:"mod"}, {rot:"FCD otimista", mult:R.ot.c.mult, tipo:"ot"}, ...(proposta(s) ? [{rot:`Proposta (${proposta(s).rot})`, mult:div(proposta(s).ev, X.bp.eb), tipo:"pr"}] : [])])
      + `<details class="card"><summary><b>EBITDA contábil × ajustado frente aos múltiplos</b></summary><div style="margin-top:10px">${vCmpEbitda(s, R)}</div></details>` + `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Companhias comparáveis · ${esc(C.seg || "—")}${C.sim.length ? ` e semelhantes (${esc(C.sim.join(", "))})` : ""}</h3>
      <p class="sub" style="margin:2px 0 0">Desmarque para excluir do cálculo. As fontes saem nos relatórios.</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${ed() ? `<button type="button" class="btn sm" id="cp-add">+ Comparável</button><button type="button" class="btn sm" id="cp-imp">Importar planilha</button>` : ""}<button type="button" class="btn sm primary" id="cp-atu">Atualizar CVM/B3</button></div></div>
      ${C.L.length ? `<div class="tbl"><table><thead><tr><th></th><th>Companhia</th><th>Segmento</th><th class="dd-num">EV/EBITDA</th><th class="dd-num">EV/Receita</th><th class="dd-num">P/L</th><th class="dd-num">Margem EBITDA</th></tr></thead><tbody>${C.L.map(c => `<tr style="${c.excl || c.fora ? "opacity:.5" : ""}">
        <td><input type="checkbox" data-comp="${esc(c.id)}" ${c.excl ? "" : "checked"} ${c.fora || !ed() ? "disabled" : ""} aria-label="Usar ${esc(c.nome)}"></td><td><b>${esc(c.nome)}</b>${c.ticker ? ` <span class="mono" style="font-size:11.5px">${esc(c.ticker)}</span>` : ""}${c.fora ? `<div class="sub" style="margin:0;font-size:11px">fora da faixa válida</div>` : ""}</td><td>${esc(c.seg)}${c.mesmo ? "" : " (semelhante)"}</td>
        <td class="dd-num">${xx(c.evEb)}</td><td class="dd-num">${xx(c.evRec, 2)}</td><td class="dd-num">${xx(c.pl)}</td><td class="dd-num">${pc(c.mg)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nenhum comparável do segmento. Inclua pela base Kinsey ou atualize pela CVM/B3.</div>`}
      ${tbl(["Múltiplo (p25 · mediana · p75)", "Mercado", "Aplicado ao target", "EV resultante", "Equity (líquido de dívidas)"], [
        tr(["EV/EBITDA", st(C.eb), C.eb ? `EBITDA ${mi(X.bp.eb)} × (1 − ${fmt(X.Bs.P.desc.v, 0)}%)` : "—", C.eb ? `${mi(X.bp.eb * C.eb.p25 * d)} a ${mi(X.bp.eb * C.eb.p75 * d)}` : "—", C.eb ? `${mi(X.bp.eb * C.eb.p25 * d - X.dl)} a ${mi(X.bp.eb * C.eb.p75 * d - X.dl)}` : "—"]),
        tr(["EV/Receita", st(C.rec, v => xx(v, 2)), C.rec ? `receita líquida ${mi(X.bp.rl)}` : "—", C.rec ? `${mi(X.bp.rl * C.rec.p25 * d)} a ${mi(X.bp.rl * C.rec.p75 * d)}` : "—", C.rec ? `${mi(X.bp.rl * C.rec.p25 * d - X.dl)} a ${mi(X.bp.rl * C.rec.p75 * d - X.dl)}` : "—"]),
        tr(["P/L (equity)", st(C.pl), C.pl ? `lucro líquido ${mi(X.bp.K.ll + X.bp.A.lucro)}` : "—", C.pl ? `${mi((X.bp.K.ll + X.bp.A.lucro) * C.pl.p25 * d + X.dl)} a ${mi((X.bp.K.ll + X.bp.A.lucro) * C.pl.p75 * d + X.dl)}` : "—", C.pl ? `${mi((X.bp.K.ll + X.bp.A.lucro) * C.pl.p25 * d)} a ${mi((X.bp.K.ll + X.bp.A.lucro) * C.pl.p75 * d)}` : "—"]),
        tr(["Margem EBITDA do setor", st(C.mg, pc), `target ${pc(div(X.bp.eb, X.bp.rl))}`, "", ""])])}
      <p class="sub" style="margin:0">Equity = enterprise value − dívida líquida ajustada de ${mi(X.dl)}.</p>
      <p class="sub" style="margin:0">Desconto de liquidez de ${fmt(X.Bs.P.desc.v, 0)}% (base de apuração) por se tratar de empresa fechada.</p></div>`;
  }
  function bindMult(host, s){
    $$("[data-comp]", host).forEach(c => c.onchange = () => up(s, {dd:{vl:{exComp:{[c.dataset.comp]:!c.checked}}}}));
    const at = $("#cp-atu", host); if (at) at.onclick = async () => { if (!window.firebase?.functions){ toast("A atualização pela CVM/B3 roda na versão publicada (função comparáveis)."); return; }
      at.disabled = true; at.textContent = "Atualizando…"; try{ await firebase.app().functions("southamerica-east1").httpsCallable("atualizarAgora", {timeout:540000})({tipo:"comparaveis"}); toast("Comparáveis atualizados"); }catch(e){ toast("Não foi possível atualizar: " + (e.message || "erro")); } at.disabled = false; at.textContent = "Atualizar CVM/B3"; };
    const ad = $("#cp-add", host); if (ad) ad.onclick = () => baseForm("comparaveis", s);
    const im = $("#cp-imp", host); if (im) im.onclick = () => baseImport("comparaveis");
  }
  const CAMPOS = {comparaveis:[["nome","Companhia"],["ticker","Código de negociação"],["seg","Segmento"],["ev","Enterprise value (R$ mi)"],["mcap","Valor de mercado (R$ mi)"],["rec","Receita líquida (R$ mi)"],["ebitda","EBITDA (R$ mi)"],["ll","Lucro líquido (R$ mi)"],["data","Data"],["fonte","Fonte"]],
    transacoes:[["alvo","Empresa adquirida"],["comprador","Comprador"],["seg","Segmento"],["data","Data"],["ev","Enterprise value (R$ mi)"],["rec","Receita (R$ mi)"],["ebitda","EBITDA (R$ mi)"],["fonte","Fonte"]]};
  const NUMS = ["ev","mcap","rec","ebitda","ll"];
  function baseForm(tipo, s){
    const F = CAMPOS[tipo], close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base Kinsey</div><h2>${tipo === "comparaveis" ? "Novo comparável" : "Nova transação"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fbf" novalidate><div class="form">${F.map(([id, l]) => id === "seg" ? `<div class="fld"><label for="bf-seg">${l}</label><select id="bf-seg">${SEGMENTOS.map(x => `<option ${x === (s?.perfil?.segmento || s?.segmento) ? "selected" : ""}>${x}</option>`).join("")}</select></div>` : `<div class="fld"><label for="bf-${id}">${l}</label><input id="bf-${id}" ${NUMS.includes(id) ? 'inputmode="decimal"' : ""}></div>`).join("")}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Incluir na base</button></div></form>`);
    $("#fbf").onsubmit = e => { e.preventDefault(); const o = {id:"k" + Date.now().toString(36)}; F.forEach(([id]) => { const v = $("#bf-" + id).value.trim(); o[id] = NUMS.includes(id) ? (n(v) ?? 0) * 1e6 : v; });
      save(Store.set("config", tipo, {lista:[...(S.config[tipo]?.lista || []), o]})).then(() => { close(); toast("Incluído na base"); }); };
  }
  function baseImport(tipo){
    const F = CAMPOS[tipo], close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base Kinsey</div><h2>Importar ${tipo === "comparaveis" ? "comparáveis" : "transações"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fbi" style="display:flex;flex-direction:column;gap:10px" novalidate><p class="sub" style="margin:0">Cole linhas de planilha nesta ordem de colunas (valores em R$ milhões):<br><span class="mono" style="font-size:12px">${F.map(f => f[1]).join(" ; ")}</span></p>
      <textarea id="bi-t" rows="8" aria-label="Linhas da planilha"></textarea><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Importar</button></div></form>`);
    $("#fbi").onsubmit = e => { e.preventDefault(); const rows = D.csv($("#bi-t").value).filter(r => r.length >= 4 && !/compan|empresa/i.test(r[0]));
      const novos = rows.map((r, i) => { const o = {id:"k" + Date.now().toString(36) + i}; F.forEach(([id], j) => { const v = (r[j] || "").trim(); o[id] = NUMS.includes(id) ? (n(v) ?? 0) * 1e6 : v; }); return o; });
      if (!novos.length){ toast("Nenhuma linha válida."); return; } save(Store.set("config", tipo, {lista:[...(S.config[tipo]?.lista || []), ...novos]})).then(() => { close(); toast(`${novos.length} registro(s) importado(s)`); }); };
  }
  function vOutras(s, R){
    const {X, T} = R, pl = X.bp.K.PL + X.bp.A.pl;
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Transações comparáveis (fusões e aquisições)</h3><p class="sub" style="margin:2px 0 0">Múltiplos pagos em aquisições de controle no segmento e em semelhantes. Já incluem prêmio de controle: sem desconto de liquidez.</p></div>
      ${ed() ? `<div style="display:flex;gap:6px"><button type="button" class="btn sm" id="tr-add">+ Transação</button><button type="button" class="btn sm" id="tr-imp">Importar planilha</button></div>` : ""}</div>
      ${T.L.length ? tbl(["Alvo · comprador", "Data", "EV", "EV/EBITDA", "EV/Receita"], T.L.map(t => `<tr><td><b>${esc(t.alvo)}</b><div class="sub" style="margin:0;font-size:11.5px">${esc(t.comprador || "")} · ${esc(t.seg)} · ${esc(t.fonte || "")}</div></td><td class="dd-num">${esc(t.data || "")}</td><td class="dd-num">${mi(t.ev)}</td><td class="dd-num">${xx(t.evEb)}</td><td class="dd-num">${xx(t.evRec, 2)}</td></tr>`)) : `<div class="empty">Nenhuma transação registrada para o segmento.</div>`}
      ${T.eb ? `<p class="sub" style="margin:0">Mediana EV/EBITDA ${xx(T.eb.med)} (p25 ${xx(T.eb.p25)}, p75 ${xx(T.eb.p75)}): EV de ${mi(X.bp.eb * T.eb.p25)} a ${mi(X.bp.eb * T.eb.p75)}; equity de ${mi(X.bp.eb * T.eb.p25 - X.dl)} a ${mi(X.bp.eb * T.eb.p75 - X.dl)}.</p>` : ""}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Patrimônio líquido ajustado</h3>
      ${tbl(["", "Valor"], [tr(["Patrimônio líquido do balancete", mi(X.bp.K.PL)]), tr(["Ajustes de Due Diligence com OK no valuation", mi(X.bp.A.pl)]), tr(["<b>PL ajustado (equity)</b>", `<b>${mi(pl)}</b>`]), tr(["Enterprise value equivalente", mi(pl + X.dl)])])}
      <p class="sub" style="margin:0">Referência de piso: o valor contábil ajustado dos ativos líquidos.</p></div>`;
  }
  function bindOutras(host, s){ const a = $("#tr-add", host); if (a) a.onclick = () => baseForm("transacoes", s); const b = $("#tr-imp", host); if (b) b.onclick = () => baseImport("transacoes"); }

  function vBase(){
    const Bs = base(), M = Bs.mercado, P = Bs.P, alert = [];
    if (Math.abs(M.selic - P.selic.v) >= .25) alert.push(`Selic de mercado ${fmt(M.selic, 2)}% × base ${fmt(P.selic.v, 2)}%: atualize o parâmetro e revise o WACC.`);
    const fi = Bs.focus.ipca || {}, lp = Object.keys(fi).sort().slice(-2).map(y => fi[y]); if (lp.length && Math.abs(lp[0] - P.infBR.v) >= .25) alert.push(`IPCA de longo prazo no Focus (${fmt(lp[0], 2)}%) diferente da base (${fmt(P.infBR.v, 2)}%).`);
    return `<div style="display:flex;flex-direction:column;gap:14px">
      <div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Indicadores de mercado</h3><p class="sub" style="margin:2px 0 0">${esc(M.fonte || "")} · ${Bs.auto ? "atualização automática diária" : "valores consultados em " + esc(M.em)}</p></div>${ed() ? `<button type="button" class="btn sm" id="mk-atu">Atualizar agora</button>` : ""}</div>
        <div class="dd-kpis">${k("Selic meta", fmt(M.selic, 2) + "%")}${k("CDI", fmt(M.cdi, 2) + "%")}${k("IPCA 12 meses", fmt(M.ipca12, 2) + "%", esc(M.ipca12ref || ""))}${k("Dólar PTAX", "R$ " + fmt(M.ptax, 4))}${M.ust10 ? k("US Treasury 10 anos", fmt(M.ust10, 2) + "%") : ""}</div>
        ${alert.map(a => `<div class="banner"><b>Mudança de mercado.</b> ${esc(a)}</div>`).join("")}
        ${tbl(["Focus · " + esc(Bs.focus.data || ""), ...Object.keys(Bs.focus.selic || {})], [tr(["Selic (fim de ano)", ...Object.values(Bs.focus.selic || {}).map(v => fmt(v, 2) + "%")]), tr(["IPCA", ...Object.values(Bs.focus.ipca || {}).map(v => fmt(v, 2) + "%")])])}
        ${tbl(["IPCA anual (BCB)", ...Object.keys(Bs.ipca)], [tr(["Variação", ...Object.values(Bs.ipca).map(v => fmt(v, 2) + "%")])])}
        <h3 style="font-size:14px">Notícias que podem afetar as taxas</h3>${Bs.noticias.length ? `<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${Bs.noticias.slice(0, 8).map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.titulo)}</a> <span class="sub" style="font-size:11.5px">· ${esc(x.fonte || "")} ${esc(x.data || "")}</span></li>`).join("")}</ul>` : `<p class="sub" style="margin:0">As notícias de juros, inflação e câmbio chegam pela função "mercado" do Firebase publicado.</p>`}</div>
      <form class="card" id="fbase" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Base de apuração Kinsey · metodologia e fontes</h3><p class="sub" style="margin:0">Parâmetros usados no WACC e no FCD de todos os valuations. Registre a fonte e a data de cada atualização.</p>
        <div class="tbl"><table><thead><tr><th>Parâmetro</th><th class="dd-num">Valor</th><th>Fonte</th><th>Data</th><th>Metodologia</th></tr></thead><tbody>${Object.values(P).map(p => `<tr><td style="min-width:180px">${esc(p.rot)}${p.editado ? ` <span class="pill r-baixo" style="font-size:10px;padding:1px 6px">Kinsey</span>` : ""}</td>
          <td><input data-bp="${p.id}" data-k="v" inputmode="decimal" value="${fmt(p.v, 2)}" style="width:80px;text-align:right" aria-label="${esc(p.rot)}" ${ed() ? "" : "disabled"}> <span class="sub" style="font-size:11px">${esc(p.u)}</span></td>
          <td><input data-bp="${p.id}" data-k="fonte" value="${esc(p.fonte)}" style="min-width:200px" aria-label="Fonte de ${esc(p.rot)}" ${ed() ? "" : "disabled"}></td><td><input data-bp="${p.id}" data-k="data" value="${esc(p.data)}" style="width:96px" aria-label="Data de ${esc(p.rot)}" ${ed() ? "" : "disabled"}></td>
          <td><input data-bp="${p.id}" data-k="met" value="${esc(p.met)}" style="min-width:200px" aria-label="Metodologia de ${esc(p.rot)}" ${ed() ? "" : "disabled"}></td></tr>`).join("")}</tbody></table></div>
        <h3 style="font-size:14px">Betas desalavancados e estrutura de capital por segmento</h3>
        <div class="tbl"><table><thead><tr><th>Segmento</th><th class="dd-num">Beta desalavancado</th><th class="dd-num">Dívida / patrimônio</th></tr></thead><tbody>${Object.entries(Bs.betas).map(([sg, [b, de]]) => `<tr><td>${esc(sg)}</td><td><input data-bt="${esc(sg)}" data-i="0" value="${fmt(b, 2)}" inputmode="decimal" style="width:80px;text-align:right" ${ed() ? "" : "disabled"} aria-label="Beta de ${esc(sg)}"></td><td><input data-bt="${esc(sg)}" data-i="1" value="${fmt(de, 2)}" inputmode="decimal" style="width:80px;text-align:right" ${ed() ? "" : "disabled"} aria-label="D/E de ${esc(sg)}"></td></tr>`).join("")}</tbody></table></div>
        ${ed() ? `<button type="submit" class="btn sm primary" style="align-self:flex-start">Salvar base de apuração</button>` : ""}</form></div>`;
  }
  function bindBase(host){
    const a = $("#mk-atu", host); if (a) a.onclick = async () => { if (!window.firebase?.functions){ toast("Atualização automática disponível na versão publicada (função mercado)."); return; }
      a.disabled = true; try{ await firebase.app().functions("southamerica-east1").httpsCallable("atualizarAgora", {timeout:300000})({tipo:"mercado"}); toast("Indicadores atualizados"); }catch(e){ toast("Não foi possível atualizar: " + (e.message || "erro")); } a.disabled = false; };
    const f = $("#fbase", host); if (f) f.onsubmit = e => { e.preventDefault(); const params = {}, betas = {};
      $$("[data-bp]", host).forEach(i => { const o = params[i.dataset.bp] ||= {}; o[i.dataset.k] = i.dataset.k === "v" ? n(i.value) : i.value.trim(); });
      $$("[data-bt]", host).forEach(i => { const o = betas[i.dataset.bt] ||= [0, 0]; o[+i.dataset.i] = n(i.value) ?? 0; });
      save(Store.set("config", "val_base", {params, betas, em:nowISO(), por:Store.me?.email || ""})).then(() => toast("Base de apuração salva")); };
  }
  function vRel(s, R){
    const A = R.A, ok = podeEmitir(A), em = s.dd?.vl?.emissoes || {};
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Relatório de valuation</h3>
      <p class="sub" style="margin:0">Sempre com os dois cenários: moderado (histórico, faixa recomendada) e otimista (premissas justificadas). Inclui a apresentação da empresa e do mercado do teaser pós-NDA, histórico, WACC, projeções, múltiplos, outras avaliações, ajustes de Due Diligence, alertas e justificativas.</p>
      ${ok ? `<div class="banner" style="border-color:rgba(54,211,153,.45)"><b>Pronto para emitir.</b> Todos os pontos de atenção estão justificados.</div>` : `<div class="banner" style="border-color:var(--bad)"><b>Emissão bloqueada.</b> Resolva os pontos marcados "Bloqueia a emissão" ou "Exige justificativa" acima.</div>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-vrel="pdf" ${ok ? "" : "disabled"}>Emitir PDF</button><button type="button" class="btn" data-vrel="pptx" ${ok ? "" : "disabled"}>Emitir PowerPoint</button></div>
      ${Object.values(em).length ? tbl(["Emissões", "Faixa moderada", "Por"], Object.values(em).sort((a, b) => String(b.em).localeCompare(a.em)).map(x => `<tr><td>${dt(x.em)} · ${esc(x.fmt.toUpperCase())}</td><td class="dd-num">${esc(x.faixa)}</td><td>${esc(x.por || "")}</td></tr>`)) : ""}</div>`;
  }
  function bindRel(host, s, R){
    $$("[data-vrel]", host).forEach(b => b.onclick = async () => { if (!window.KT_REL){ toast("Módulo de relatórios indisponível."); return; }
      const emite = async md => { await KT_REL.valuation(s, b.dataset.vrel, md); up(s, {dd:{vl:{emissoes:{["e" + Date.now().toString(36)]:{em:nowISO(), fmt:b.dataset.vrel, por:Store.me?.email || "", faixa:`${mi(R.rec[0])} a ${mi(R.rec[1])}`}}}}}); };
      try{ if (b.dataset.vrel === "pdf" && window.KT_GRAF) KT_GRAF.modo("Valuation · " + s.nome, emite); else await emite("completo"); }catch(e){ console.error(e); toast("Não foi possível gerar o relatório."); } });
  }
  window.KT_VAL = {refC, prev, grupos, revisarWacc, cmpEbitda, resumo, contexto, historico, cenario, wacc, comparaveis, transacoes, alertas, podeEmitir, base, perfilFalta, editarPerfil, linhasDe};
})();
