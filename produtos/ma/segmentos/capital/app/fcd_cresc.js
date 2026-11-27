/* ================= KINSEY CAPITAL · VALUATION · CRESCIMENTO NO FLUXO DE CAIXA =================
   - Quadro de crescimento no FCD: crescimento histórico (nominal e real, total e por linha), último ano, e o crescimento
     projetado nos cenários moderado e otimista, com a diferença sobre o histórico;
   - moderado: segue o histórico; o consultor pode informar outro crescimento por linha, mas acima do histórico (mais
     a tolerância da base de apuração) a emissão exige justificativa;
   - otimista: cada crescimento extra tem um motivo (novo negócio, nova unidade, nova fábrica, novo contrato, novo
     mercado, aquisição) e pode vir de um estudo de viabilidade importado (Excel ou PDF): o sistema lê receita, EBITDA e
     investimento por ano e inclui no otimista, só para comparação, com justificativa obrigatória. */
if (window.KT_DD && window.KT_VAL) (() => {
  const D = KT_DD, pc = v => v == null || !isFinite(v) ? "—" : `${fmt(v * 100, 1)}%`, mi = v => v == null || !isFinite(v) ? "—" : `R$ ${fmt(v / 1e6, 1)} mi`;
  const nn = v => typeof v === "number" ? v : num(v);
  const TIPOS = ["Novo negócio", "Nova unidade ou filial", "Nova fábrica ou ampliação", "Novo contrato", "Novo mercado ou exportação", "Aquisição", "Outro"];
  const media = a => { const b = a.filter(x => x != null && isFinite(x)); return b.length ? b.reduce((t, x) => t + x, 0) / b.length : null; };
  function card(s, R){
    const X = R.X, H = X.H.anuais, vl = X.vl, mod = R.mod.c, ot = R.ot.c, tot = (X.total || {}), ed = D.ed() ? "" : "disabled", tol = X.Bs.P.desvio?.v ?? 3;
    const ult = H.length > 1 ? H[H.length - 1].rl / H[H.length - 2].rl - 1 : null, gm = media(mod.anos.map(a => a.cres)), go = media(ot.anos.map(a => a.cres));
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const alerta = (h, e) => h != null && e != null && e > h + tol / 100;
    const linhas = X.nomes.map(l => { const h = X.histL[l], m = vl.premMod?.[l]?.real, o = vl.prem?.[l]?.real; return `<tr><td>${esc(l)}</td><td class="dd-num">${pc(h?.nom)}</td><td class="dd-num">${pc(h?.real)}</td>
      <td><input data-pmod="${esc(l)}" inputmode="decimal" value="${m != null ? fmt(m, 1) : ""}" placeholder="${h ? fmt(Math.max(-10, Math.min(15, h.real * 100)), 1) : "0"}" style="width:76px;text-align:right" aria-label="Crescimento real moderado de ${esc(l)} (%)" ${ed}>${alerta(h?.real, m != null ? m / 100 : null) ? ` <span class="pill r-medio" style="font-size:10px">justificar</span>` : ""}</td>
      <td class="dd-num">${o != null ? fmt(o, 1) + "%" : "—"}${alerta(h?.real, o != null ? o / 100 : null) ? ` <span class="pill r-medio" style="font-size:10px">justificar</span>` : ""}</td></tr>`; }).join("");
    return `<form class="card" id="fx-cresc" style="display:flex;flex-direction:column;gap:10px" novalidate><div><h3 style="margin:0">Crescimento</h3><p class="sub" style="margin:2px 0 0">O moderado segue o histórico dos balancetes. Crescimento acima do histórico em mais de ${fmt(tol, 0)} p.p. exige a explicação do consultor; no otimista, cada crescimento extra precisa de um motivo (novo negócio, unidade, fábrica, contrato, mercado) ou de um estudo de viabilidade.</p></div>
      <div class="dd-kpis">${k("Histórico (a.a.)", pc(tot.nom), `real ${pc(tot.real)}${tot.anos ? ` · ${tot.anos} ano(s)` : ""}`)}${k("Último ano", pc(ult), H.length > 1 ? `${H[H.length - 2].ano} → ${H[H.length - 1].ano}` : "")}${k("Moderado projetado", pc(gm), gm != null && tot.nom != null ? `${fmt((gm - tot.nom) * 100, 1)} p.p. sobre o histórico` : "média nominal dos 5 anos")}${k("Otimista projetado", pc(go), Object.values(vl.novos || {}).filter(Boolean).length ? `com ${Object.values(vl.novos).filter(Boolean).length} novo(s) negócio(s)` : "")}</div>
      <div class="tbl"><table><thead><tr><th>Linha</th><th class="dd-num">Histórico nominal</th><th class="dd-num">Histórico real</th><th>Moderado (real a.a., %)</th><th class="dd-num">Otimista (real)</th></tr></thead><tbody>${linhas}</tbody></table></div>
      ${ed ? "" : `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" class="btn sm primary">Salvar crescimento moderado</button><span class="sub" style="margin:0;font-size:12px">vazio = histórico da linha</span></div>`}</form>`;
  }
  /* investimentos: CAPEX e outros investimentos ano a ano; sem CAPEX informado, reinveste a depreciação (regra do valuation) */
  function capexCard(s, R){
    const X = R.X, vl = X.vl, A = R.mod.c.anos, ed = D.ed() ? "" : "disabled", inf = A.filter(a => a.cxInf).length;
    const v = x => x != null && x !== "" ? fmt(+x, 1) : "";
    return `<form class="card" id="fx-capex" style="display:flex;flex-direction:column;gap:10px;font-size:13px" novalidate><div><h3 style="margin:0">Investimentos · CAPEX</h3><p class="sub" style="margin:2px 0 0;font-size:12px">Informe o CAPEX previsto e outros investimentos de cada ano (R$ milhões). Ano sem CAPEX informado reinveste a própria depreciação (${pc(X.capex)} da receita). Vale para o moderado, o otimista, o PPA e o impairment.</p></div>
      <div class="tbl"><table style="font-size:12.5px"><thead><tr><th>Ano</th><th class="dd-num">Receita</th><th class="dd-num">Depreciação</th><th>CAPEX (R$ mi)</th><th>Outros investimentos (R$ mi)</th><th class="dd-num">Usado no FCD</th></tr></thead><tbody>
      ${A.map(a => `<tr><td>${a.y}</td><td class="dd-num">${mi(a.rl)}</td><td class="dd-num">${mi(a.rl * X.capex)}</td>
        <td><input data-cxa="${a.y}" inputmode="decimal" value="${v(vl.capexAno?.[a.y])}" placeholder="${fmt(a.rl * X.capex / 1e6, 1)} (depreciação)" style="width:120px;text-align:right;height:32px;font-size:12.5px" aria-label="CAPEX ${a.y}" ${ed}></td>
        <td><input data-ivA="${a.y}" inputmode="decimal" value="${v(vl.invAno?.[a.y])}" placeholder="0" style="width:100px;text-align:right;height:32px;font-size:12.5px" aria-label="Outros investimentos ${a.y}" ${ed}></td>
        <td class="dd-num">${mi(a.capex + a.oinv)}${a.cxInf ? "" : ` <span class="sub" style="font-size:10.5px">reinvestimento</span>`}</td></tr>`).join("")}</tbody></table></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${ed ? "" : `<button type="submit" class="btn sm primary">Salvar investimentos</button>`}<span class="sub" style="margin:0;font-size:12px">${inf ? `${inf} ano(s) com CAPEX informado` : "Nenhum CAPEX informado: o FCD reinveste a depreciação"}. Na perpetuidade o CAPEX é igual à depreciação.</span></div></form>`;
  }
  function bindCapex(host, s){ const f = $("#fx-capex", host); if (!f) return;
    f.onsubmit = e => { e.preventDefault(); const cx = {}, iv = {};
      $$("[data-cxa]", f).forEach(i => { cx[i.dataset.cxa] = i.value.trim() === "" ? null : nn(i.value); }); $$("[data-iva]", f).forEach(i => { iv[i.dataset.iva] = i.value.trim() === "" ? null : nn(i.value); });
      D.up(s, {dd:{vl:{capexAno:cx, invAno:iv}}}).then(() => toast("Investimentos salvos")); }; }
  function bind(host, s){ const f = $("#fx-cresc", host); if (!f) return;
    f.onsubmit = e => { e.preventDefault(); const pm = {}; $$("[data-pmod]", f).forEach(i => { const v = i.value.trim() === "" ? null : nn(i.value); pm[i.dataset.pmod] = {real:v}; });
      D.up(s, {dd:{vl:{premMod:pm}}}).then(() => toast("Crescimento moderado salvo")); }; }

  /* ---------- estudo de viabilidade ---------- */
  async function linhasDoArquivo(f){
    if (/\.(xlsx|xlsm)$/i.test(f.name)) return (await IMP.lerXLSX(await f.arrayBuffer())).map(r => (r || []).map(c => c == null ? "" : String(c)));
    if (/\.csv$/i.test(f.name)) return (await f.text()).split(/\r?\n/).map(l => l.split(/[;\t]/));
    const t = window.KT_AUTO ? await KT_AUTO.texto(f) : await f.text(); return String(t).split(/\n/).map(l => { const nums = l.match(/-?\(?[\d.]+,\d+\)?|-?\(?\d[\d.]{2,}\)?/g) || []; return [l.replace(/[-\d.,()]+/g, " ").trim(), ...nums]; });
  }
  const val = c => { let t = String(c || "").trim(); if (!t) return null; const neg = /^\(.*\)$/.test(t) || /^-/.test(t); t = t.replace(/[()\s-R$]/g, ""); if (/,\d+$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); const v = parseFloat(t); return isFinite(v) ? (neg ? -v : v) : null; };
  async function lerEstudo(f){
    const L = await linhasDoArquivo(f); let anos = null, hi = -1;
    L.forEach((r, i) => { if (anos) return; const ys = r.map(c => (String(c).match(/^\s*(?:ano\s*)?(20\d\d|[1-9]|1[0-5])\s*$/i) || [])[1]).filter(Boolean); if (ys.length >= 3 && r.some(c => /20\d\d|ano/i.test(String(c)))){ anos = r.map(c => (String(c).match(/^\s*(?:ano\s*)?(20\d\d|[1-9]|1[0-5])\s*$/i) || [])[1] || null); hi = i; } });
    const achar = re => { const r = L.find((x, i) => i !== hi && re.test(String(x[0] || "") + " " + String(x[1] || ""))); return r ? r.map(val) : null; };
    const rec = achar(/receita (l[íi]quida|bruta|operacional)?|faturamento|vendas/i), eb = achar(/ebitda|lajida|resultado operacional|lucro operacional/i), inv = achar(/investimento|capex|aporte/i);
    if (!rec) return null;
    const idx = rec.map((v, i) => v != null && i > 0 ? i : -1).filter(i => i >= 0), serie = idx.map(i => ({ano:anos?.[i] || null, rec:rec[i], eb:eb?.[i] ?? null, inv:inv?.[i] ?? null}));
    const mx = Math.max(...serie.map(x => Math.abs(x.rec))), esc2 = mx > 1e5 ? 1e6 : mx > 500 ? 1e3 : 1; /* R$, R$ mil ou R$ mi */
    serie.forEach(x => { x.rec /= esc2; if (x.eb != null) x.eb /= esc2; if (x.inv != null) x.inv /= esc2; });
    return {serie:serie.slice(0, 10), unidade:esc2 === 1e6 ? "R$" : esc2 === 1e3 ? "R$ mil" : "R$ mi"};
  }
  async function importarEstudo(s, f){
    let E = null; try{ E = await lerEstudo(f); }catch(e){ console.error(e); }
    if (!E || !E.serie.length){ toast("Não encontrei a linha de receita ou faturamento por ano no estudo. Inclua o novo negócio manualmente."); return; }
    const X = KT_VAL.resumo(s).X, y0 = X.y0, S2 = E.serie, ok = S2.filter(x => x.rec > 0), anoIni = +(S2[0].ano || 0);
    const inicio = anoIni > 2000 ? Math.max(1, Math.min(5, anoIni - y0)) : 1, n2 = ok.length, inf = (X.Bs.P.infBR?.v || 4) / 100;
    const cagr = n2 > 1 ? Math.pow(ok[n2 - 1].rec / ok[0].rec, 1 / (n2 - 1)) - 1 : 0, real = (1 + cagr) / (1 + inf) - 1, mg = S2.some(x => x.eb != null) ? S2.reduce((t, x) => t + (x.eb || 0), 0) / S2.reduce((t, x) => t + x.rec, 0) : null;
    const invT = S2.reduce((t, x) => t + Math.abs(x.inv || 0), 0);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Valuation otimista · estudo de viabilidade</div><h2>${esc(f.name)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fe-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="tbl"><table><thead><tr><th>Ano</th><th class="dd-num">Receita (R$ mi)</th><th class="dd-num">EBITDA (R$ mi)</th><th class="dd-num">Investimento (R$ mi)</th></tr></thead><tbody>${S2.map((x, i) => `<tr><td>${esc(x.ano || "ano " + (i + 1))}</td><td class="dd-num">${fmt(x.rec, 2)}</td><td class="dd-num">${x.eb == null ? "—" : fmt(x.eb, 2)}</td><td class="dd-num">${x.inv == null ? "—" : fmt(x.inv, 2)}</td></tr>`).join("")}</tbody></table></div>
        <p class="sub" style="margin:0;font-size:12px">Valores lidos em ${esc(E.unidade)} e convertidos para R$ milhões. Confira e ajuste antes de incluir.</p>
        <div class="form"><div class="fld"><label for="fe-t">Motivo</label><select id="fe-t">${TIPOS.map(t => `<option ${t === "Novo negócio" ? "selected" : ""}>${t}</option>`).join("")}</select></div>
          <div class="fld"><label for="fe-n">Nome</label><input id="fe-n" value="${esc(f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "))}"></div>
          <div class="fld"><label for="fe-i">Ano de início (1 a 5)</label><input id="fe-i" inputmode="numeric" value="${inicio}"></div>
          <div class="fld"><label for="fe-r">Receita no 1º ano (R$ mi)</label><input id="fe-r" inputmode="decimal" value="${fmt(ok[0]?.rec || 0, 2)}"></div>
          <div class="fld"><label for="fe-c">Crescimento real a.a. (%)</label><input id="fe-c" inputmode="decimal" value="${fmt(real * 100, 1)}"></div>
          <div class="fld"><label for="fe-m">Margem EBITDA (%)</label><input id="fe-m" inputmode="decimal" value="${mg != null ? fmt(mg * 100, 1) : ""}"></div>
          <div class="fld full"><label for="fe-p">Comprovação</label><input id="fe-p" value="Estudo de viabilidade ${esc(f.name)}${invT ? ` · investimento previsto R$ ${fmt(invT, 1)} mi` : ""}"></div></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn" data-x>Cancelar</button><button type="submit" class="btn primary">Incluir no otimista</button></div></form>`);
    $("#fe-f").onsubmit = async e => { e.preventDefault(); const g = id => nn($("#" + id).value);
      try{ const up = await Store.upload(f, {sup:s.id, tipo:"Estudo de viabilidade", nome:f.name}); await salvarEvid(uid(), {supplierId:s.id, tipo:"Estudo de viabilidade", obs:"Valuation otimista", ...up, mime:f.type, nome:f.name, criadoEm:nowISO(), criadoPor:Store.me?.id || "", origem:"Valuation"}, f); }catch(err){}
      await D.up(s, {dd:{vl:{novos:{["n" + Date.now().toString(36)]:{tipo:$("#fe-t").value, nome:$("#fe-n").value.trim() || f.name, inicio:Math.max(1, Math.min(5, Math.round(g("fe-i") || 1))), rec1:g("fe-r") || 0, cresc:g("fe-c") || 0, margem:g("fe-m") || 0, fonte:"Estudo de viabilidade", comprova:$("#fe-p").value.trim(), estudo:{arquivo:f.name, serie:S2, investimento:invT}}}}}});
      close(); toast("Estudo incluído no cenário otimista: justifique para emitir"); };
  }
  window.KT_CRESC = {capexCard, bindCapex, card, bind, lerEstudo, importarEstudo, TIPOS};
})();
