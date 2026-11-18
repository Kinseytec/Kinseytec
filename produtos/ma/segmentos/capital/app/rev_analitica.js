/* ================= KINSEY CAPITAL · DUE DILIGENCE · REVISÃO ANALÍTICA DOS BALANCETES =================
   Sobre os balancetes importados (3 a 5 exercícios e os balancetes analíticos do ano), o sistema:
   - compara as contas de resultado ano a ano (variação e participação na receita);
   - abre o ano em meses (ou trimestres, conforme os balancetes) e acha picos e quedas fora do padrão nas contas que
     mexem no EBITDA: um aluguel de 200 mil que vira 500 mil num mês e volta para 200 é um provável ajuste de EBITDA;
   - marca contas cuja natureza pede revisão (gastos de sócios, pró-labore, despesas diversas, brindes, viagens,
     consultorias, multas, indenizações, itens não recorrentes);
   - leva tudo para o workbook da Due Diligence já preenchido, com amarelo (revisar) e vermelho (alto risco de ajuste),
     e uma aba de alertas com os documentos a pedir e a coluna da conclusão do consultor. */
if (window.KT_DD) (() => {
  const D = KT_DD, G = D.GRUPOS;
  const EBITDA = new Set(["recBruta", "deducoes", "cpv", "pessoal", "prolabore", "adm", "aluguel", "vendas", "outrasOp", "naoRec"]);
  const RESULT = new Set([...EBITDA, "naoOp", "da", "recFin", "despFin", "ir"]);
  const NAT = /s[oó]ci|pr[oó].?labore|retirad|diversa|outras despesas|brinde|doa[cç]|viage|hospedag|consultori|honor[aá]ri|assessori|multa|indeniza|acordo|n[aã]o recorrente|extraordin|partes relacionadas|ve[ií]culo|combust|celular|presente|festa|confraterniza|patroc[ií]nio/i;
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e3, 0)} mil`;
  const val = (g, v) => ["P", "R"].includes(G[g]?.[1]) ? -v : v;
  const med = a => { const b = a.filter(x => isFinite(x)).slice().sort((x, y) => x - y); if (!b.length) return 0; const m = Math.floor(b.length / 2); return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

  function dados(s){
    const P = (D.periodos(s) || []).slice().sort(), bal = s.dd?.bal || {}, contas = new Map();
    const conta = (c, g) => { const k = String(c[0] || "").trim() ? String(c[0]).trim() : nrm(c[1]); if (!contas.has(k)) contas.set(k, {k, cod:String(c[0] || ""), desc:String(c[1] || ""), g, ebitda:EBITDA.has(g), anual:{}, cum:{}}); return contas.get(k); };
    P.forEach(p => { const b = bal[p]; D.C(b).forEach(c => { const g = c[3]; if (!RESULT.has(g)) return; const x = conta(c, g); x.cum[p] = (x.cum[p] || 0) + val(g, +c[2] || 0); if (+b.meses === 12) x.anual[p.slice(0, 4)] = (x.anual[p.slice(0, 4)] || 0) + val(g, +c[2] || 0); }); });
    /* só entram no ano a ano os exercícios com DRE (um balanço sem DRE não pode gerar "conta nova") */
    const temDRE = p => D.C(bal[p]).some(c => RESULT.has(c[3]));
    const anos = [...new Set(P.filter(p => +bal[p].meses === 12 && temDRE(p)).map(p => p.slice(0, 4)))].sort().slice(-5);
    /* ano aberto: o mais recente com 2+ balancetes; acumulados (YTD) viram movimento do período */
    const porAno = {}; P.forEach(p => (porAno[p.slice(0, 4)] ||= []).push(p)); const anoM = Object.keys(porAno).sort().reverse().find(a => porAno[a].length >= 2) || "";
    let fat = []; if (anoM){ const L = porAno[anoM].map(p => ({p, m:+bal[p].meses || 12, fim:+p.slice(5, 7)})).sort((a, b) => a.fim - b.fim);
      const cumul = L.every(x => x.m === x.fim) && L.some(x => x.m > 1);
      let ant = null; fat = L.map(x => { const ini = cumul ? (ant ? ant.fim + 1 : 1) : x.fim - x.m + 1, len = x.fim - ini + 1, r = {p:x.p, ant:cumul ? ant?.p : null, len, rot:len === 1 ? `${MES[x.fim - 1]}/${anoM.slice(2)}` : `${MES[ini - 1]}–${MES[x.fim - 1]}/${anoM.slice(2)}`}; ant = x; return r; }); }
    contas.forEach(x => { x.mens = fat.map(f => { const v = x.cum[f.p]; if (v == null) return null; const a = f.ant ? (x.cum[f.ant] || 0) : 0; return v - a; }); x.porMes = x.mens.map((v, i) => v == null ? null : v / fat[i].len); });
    let rec = 0; try{ const ult = P.filter(p => +bal[p].meses === 12).pop() || P[P.length - 1]; rec = ult ? D.calc(bal[ult]).recLiq : 0; }catch(e){}
    return {P, anos, anoM, fat, contas:[...contas.values()], rec, M:Math.max(rec * .005, 20000)};
  }
  function alertas(s){
    const X = dados(s), A = [], M = X.M, add = (x, o) => A.push({conta:x.cod, desc:x.desc, grupo:G[x.g]?.[0] || x.g, ebitda:x.ebitda, ...o});
    X.contas.forEach(x => {
      /* ano a ano */
      for (let i = 1; i < X.anos.length; i++){ const a = x.anual[X.anos[i - 1]] ?? 0, b = x.anual[X.anos[i]] ?? 0, d = b - a, pc = Math.abs(a) > 1 ? d / Math.abs(a) : null;
        if (Math.abs(d) < M) continue;
        if (pc == null || Math.abs(pc) >= 1 || Math.sign(a) !== Math.sign(b) && a && b) add(x, {periodo:`${X.anos[i - 1]}→${X.anos[i]}`, valor:b, ref:a, var:pc, nivel:"alto", tipo:"anual", celula:X.anos[i], motivo:pc == null ? "conta nova no exercício" : `variação de ${fmt(pc * 100, 0)}% sobre o ano anterior`});
        else if (Math.abs(pc) >= .3) add(x, {periodo:`${X.anos[i - 1]}→${X.anos[i]}`, valor:b, ref:a, var:pc, nivel:"medio", tipo:"anual", celula:X.anos[i], motivo:`variação de ${fmt(pc * 100, 0)}% sobre o ano anterior`}); }
      /* dentro do ano: picos e quedas */
      const pm = x.porMes, base = med(pm.filter(v => v != null).map(Math.abs)), Mm = M / 12;
      pm.forEach((v, i) => { if (v == null || !x.ebitda) return; const tot = x.mens[i];
        if (base > 0 && Math.abs(v) > base * 1.8 && Math.abs(v) - base > Mm) add(x, {periodo:X.fat[i].rot, valor:tot, ref:base * X.fat[i].len, var:Math.abs(v) / base - 1, nivel:Math.abs(v) >= base * 2 ? "alto" : "medio", tipo:"mensal", celula:i, motivo:`pico: ${fmt(Math.abs(v) / base, 1)}× a média mensal da conta${x.ebitda ? "; provável ajuste de EBITDA (não recorrente ou fora do período)" : ""}`});
        else if (base > Mm && Math.abs(v) < base * .4) add(x, {periodo:X.fat[i].rot, valor:tot, ref:base * X.fat[i].len, var:Math.abs(v) / base - 1, nivel:"medio", tipo:"mensal", celula:i, motivo:"queda fora do padrão: despesa lançada em outro período, estorno ou provisão revertida"});
        else if (G[x.g]?.[1] === "D" && v < -Mm) add(x, {periodo:X.fat[i].rot, valor:tot, ref:base * X.fat[i].len, var:null, nivel:"medio", tipo:"mensal", celula:i, motivo:"saldo credor em conta de despesa (estorno ou reclassificação)"}); });
      /* natureza */
      const ult = X.anos.length ? x.anual[X.anos[X.anos.length - 1]] : x.mens.reduce((t, v) => t + (v || 0), 0);
      if (x.ebitda && NAT.test(x.desc) && Math.abs(ult || 0) >= M / 2) add(x, {periodo:X.anos[X.anos.length - 1] || X.anoM, valor:ult, ref:null, var:null, nivel:/s[oó]ci|retirad|partes relacionadas/i.test(x.desc) ? "alto" : "medio", tipo:"natureza", celula:null, motivo:/s[oó]ci|retirad|pr[oó].?labore|partes relacionadas/i.test(x.desc) ? "gastos ligados aos sócios: verificar se são despesas da empresa ou pessoais" : "natureza a revisar: possível item não recorrente ou sem relação com a operação"});
    });
    A.forEach(a => a.docs = a.tipo === "natureza" ? "Razão analítico da conta, notas fiscais e aprovações; separar o que é pessoal ou não recorrente" : "Razão analítico do período, notas fiscais, contratos e explicação da variação");
    const ord = {alto:0, medio:1}; A.sort((a, b) => ord[a.nivel] - ord[b.nivel] || Math.abs(b.valor - (b.ref || 0)) - Math.abs(a.valor - (a.ref || 0)));
    const potencial = A.filter(a => a.nivel === "alto" && a.ebitda && a.tipo === "mensal").reduce((t, a) => t + Math.max(0, Math.abs(a.valor) - Math.abs(a.ref || 0)), 0);
    return {X, A, potencial};
  }

  /* ---------- abas do workbook ---------- */
  function abas(s){
    const {X, A} = alertas(s); if (!X.contas.length) return [];
    const H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), nome = s.mandato?.codinome || s.nome;
    const marca = (x, tipo, cel) => { const L = A.filter(a => a.conta === x.cod && a.desc === x.desc && a.tipo === tipo && a.celula === cel); return L.some(a => a.nivel === "alto") ? "r" : L.length ? "y" : null; };
    const nat = x => A.some(a => a.conta === x.cod && a.desc === x.desc && a.tipo === "natureza");
    const legenda = ["Legenda: amarelo = revisar com documentos; vermelho = alto risco de ajuste de EBITDA. Valores em R$, contas de receita positivas e de despesa positivas (natureza)."];
    const out = [];
    const L = X.contas.slice().sort((a, b) => a.cod.localeCompare(b.cod, "pt", {numeric:true}) || a.desc.localeCompare(b.desc, "pt"));
    if (X.anos.length){
      out.push({nome:"Revisão analítica anual", larguras:[16, 50, 26, 9, ...X.anos.map(() => 15), 12, 44], congela:[4, 2], linhas:[[T(`Revisão analítica · exercícios · ${nome}`)], legenda, [`Exercícios: ${X.anos.join(", ")} (${X.anos.length < 3 ? "abaixo do mínimo de 3; peça os demais" : X.anos.length < 5 ? "mínimo atendido; o ideal são 5" : "5 exercícios"})`], [],
        [H("Conta"), H("Descrição"), H("Grupo"), H("EBITDA"), ...X.anos.map(a => H(a)), H("Var. último"), H("Alerta")],
        ...L.filter(x => X.anos.some(a => x.anual[a])).map(x => { const u = x.anual[X.anos[X.anos.length - 1]] ?? 0, p = x.anual[X.anos[X.anos.length - 2]], v = X.anos.length > 1 && Math.abs(p || 0) > 1 ? (u - p) / Math.abs(p) : null;
          const al = A.filter(a => a.conta === x.cod && a.desc === x.desc && a.tipo !== "mensal"), st = al.some(a => a.nivel === "alto") ? "r" : al.length ? "y" : null;
          return [x.cod, nat(x) ? {v:x.desc, s:st === "r" ? "rt" : "yt"} : x.desc, G[x.g]?.[0] || x.g, x.ebitda ? "sim" : "", ...X.anos.map(a => { const m = marca(x, "anual", a); const n = Math.round(x.anual[a] || 0); return m ? {v:n, s:m} : n; }), v == null ? "" : {v, s:st ? st + "p" : "p"}, al.length ? {v:al.map(a => a.motivo).join("; "), s:st + "t"} : ""]; })]});
    }
    if (X.fat.length){
      out.push({nome:"Revisão analítica mensal", larguras:[16, 50, 26, 9, ...X.fat.map(() => 13), 14, 44], congela:[4, 2], linhas:[[T(`Revisão analítica · ${X.anoM} por período · ${nome}`)], legenda, [`Movimento de cada período calculado pelos balancetes acumulados de ${X.anoM}. Média: média mensal da conta no ano.`], [],
        [H("Conta"), H("Descrição"), H("Grupo"), H("EBITDA"), ...X.fat.map(f => H(f.rot)), H("Média mensal"), H("Alerta")],
        ...L.filter(x => x.mens.some(v => v)).map(x => { const al = A.filter(a => a.conta === x.cod && a.desc === x.desc && a.tipo === "mensal"), st = al.some(a => a.nivel === "alto") ? "r" : al.length ? "y" : null;
          return [x.cod, x.desc, G[x.g]?.[0] || x.g, x.ebitda ? "sim" : "", ...x.mens.map((v, i) => { const m = marca(x, "mensal", i); const n = v == null ? "" : Math.round(v); return m && n !== "" ? {v:n, s:m} : n; }), Math.round(med(x.porMes.filter(v => v != null))), al.length ? {v:al.map(a => `${a.periodo}: ${a.motivo}`).join("; "), s:st + "t"} : ""]; })]});
    }
    out.push({nome:"Alertas para o consultor", larguras:[9, 16, 44, 14, 15, 15, 10, 54, 50, 40, 16], congela:[0, 4], linhas:[[T(`Alertas da revisão analítica · ${nome}`)], ["Cada linha pede a análise do consultor: confira os documentos, escreva a conclusão e, se for o caso, o ajuste de EBITDA proposto (leve para a aba Ajustes)."], [],
      [H("Nível"), H("Conta"), H("Descrição"), H("Período"), H("Valor"), H("Referência"), H("Variação"), H("Motivo"), H("Documentos a solicitar"), H("Conclusão do consultor"), H("Ajuste proposto (R$)")],
      ...A.map(a => { const st = a.nivel === "alto" ? "r" : "y"; return [{v:a.nivel === "alto" ? "Alto" : "Médio", s:st + "t"}, a.conta, a.desc, a.periodo, {v:Math.round(a.valor || 0), s:st}, a.ref == null ? "" : Math.round(a.ref), a.var == null ? "" : {v:a.var, s:"p"}, a.motivo, a.docs, "", ""]; })]});
    return out;
  }

  /* ---------- tela: Due Diligence · Revisão analítica ---------- */
  function painel(s){
    const {X, A, potencial} = alertas(s), alto = A.filter(a => a.nivel === "alto").length;
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const cob = X.anos.length < 3 ? `<div class="banner" style="font-size:13px"><b>${X.anos.length} exercício(s) completo(s) no sistema.</b> A diligência pede de 3 a 5 anos de balanços e os balancetes analíticos do ano: peça os que faltam ao target (Importação de documentos na Base inicial).</div>` : "";
    return `<div class="card" id="ra-pan" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3 style="margin:0">Revisão analítica dos balancetes</h3><p class="sub" style="margin:2px 0 0">Contas de resultado ano a ano e período a período; picos, quedas e contas de natureza sensível que podem pedir ajuste de EBITDA.</p></div><button type="button" class="btn sm primary" id="ra-xls">Workbook preenchido (Excel)</button></div>
      ${cob}<div class="dd-kpis">${k("Exercícios", X.anos.length ? X.anos.join(", ") : "—", "mínimo 3, ideal 5")}${k(`Períodos de ${X.anoM || "—"}`, X.fat.length || "—", X.fat.length ? X.fat.map(f => f.rot).join(" · ") : "importe os balancetes do ano")}${k("Alertas", `${A.length}`, `${alto} de alto risco`)}${k("Potencial de ajuste de EBITDA", potencial ? mi(potencial) : "—", "excesso dos picos sobre a média")}</div>
      ${A.length ? `<div class="tbl" style="max-height:460px;overflow:auto"><table><thead><tr><th>Conta</th><th>Período</th><th class="dd-num">Valor</th><th class="dd-num">Referência</th><th>Motivo</th></tr></thead><tbody>${A.slice(0, 60).map(a => `<tr style="background:${a.nivel === "alto" ? "rgba(255,107,107,.13)" : "rgba(242,193,78,.12)"}"><td style="min-width:180px"><b>${esc(a.desc)}</b><div class="sub" style="margin:0;font-size:11px">${esc(a.conta)} · ${esc(a.grupo)}${a.ebitda ? " · EBITDA" : ""}</div></td><td style="white-space:nowrap">${esc(a.periodo)}</td><td class="dd-num">${mi(a.valor)}</td><td class="dd-num">${a.ref == null ? "—" : mi(a.ref)}</td><td style="font-size:12.5px;min-width:200px"><span class="pill ${a.nivel === "alto" ? "r-alto" : "r-medio"}" style="font-size:10.5px">${a.nivel === "alto" ? "Alto" : "Revisar"}</span> ${esc(a.motivo)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0">${X.contas.length ? "Nenhuma variação fora do padrão nas contas de resultado." : "Importe os balancetes para a revisão analítica."}</p>`}
      <p class="sub" style="margin:0;font-size:12px">No workbook, as células em amarelo pedem revisão com documentos e as vermelhas são alto risco de ajuste de EBITDA; a aba "Alertas para o consultor" traz os documentos a pedir e o espaço para a conclusão.</p></div>`;
  }
  if (typeof renderAuditoria === "function"){ const _r = renderAuditoria;
    renderAuditoria = function(){
      const ra = S.ddTab === "ra"; if (ra) S.ddTab = "geral"; const r = _r.apply(this, arguments); if (ra) S.ddTab = "ra";
      const host = $("#auditoria"), s = D.alvoSel(); if (!host) return r; const tabs = host.querySelector(".dd-tabs"); if (!tabs || tabs.querySelector('[data-ddtab="ra"]')) return r;
      const bt = document.createElement("button"); bt.type = "button"; bt.className = "fbtn"; bt.dataset.ddtab = "ra"; bt.textContent = "Revisão analítica"; const g = tabs.querySelector('[data-ddtab="geral"]'); if (g) g.after(bt); else tabs.prepend(bt);
      bt.onclick = () => { S.ddTab = "ra"; renderAuditoria(); };
      if (!ra) return r; tabs.querySelectorAll("[data-ddtab]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.ddtab === "ra")));
      if (!s || !D.temBal(s)) return r;
      let n = tabs.nextSibling; while (n){ const nx = n.nextSibling; n.remove(); n = nx; }
      tabs.insertAdjacentHTML("afterend", painel(s));
      const x = $("#ra-xls", host); if (x) x.onclick = () => window.KT_DDWB ? KT_DDWB.modeloDD(s).catch(e => { console.error(e); toast("Não foi possível gerar o workbook."); }) : null;
      return r; };
  }
  window.KT_RA = {dados, alertas, abas, painel};
})();
