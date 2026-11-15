/* ================= KINSEY CAPITAL · RELATÓRIOS =================
   Due Diligence (relatório de alto nível e papéis de trabalho, em PDF), Valuation (PDF e PowerPoint),
   Teaser pré e pós-NDA (PDF e PowerPoint) e PPA (PDF). Textos-padrão editáveis em "Textos-padrão dos relatórios"
   (modelos provisórios até a Kinsey incluir os seus). */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi, pc, xx, div} = D;
  const NAVY = [1,31,75], ACC = [4,115,195], MUT = [90,101,120], BAD = [198,40,40], OKC = [46,125,50], GOLD = [178,121,26], LILAS = [120,80,190];
  const T = s => String(s ?? "").replace(/−/g, "-").replace(/≈/g, "~").replace(/[“”]/g, '"');
  const CONTATO = "contato@kinsey.com.br · newton.kao@kinsey.com.br · (11) 96635-0424";
  const hojeBR = () => new Date().toLocaleDateString("pt-BR");
  const arq = (s, t, ext) => `Kinsey_${t}_${String(s.mandato?.codinome || s.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^EXEMPLO /, "").replace(/[^\w]+/g, "_").slice(0, 40)}.${ext}`;

  /* ---------------- TEXTOS-PADRÃO ---------------- */
  const TXT = {
    dd_escopo:["Escopo da Due Diligence","Análise contábil, financeira, trabalhista e tributária da {EMPRESA}, com base no balancete de {DATABASE} e nos documentos disponibilizados no data room. Procedimentos automáticos sobre os saldos contábeis e procedimentos mínimos executados pelos consultores especialistas de cada área."],
    dd_limites:["Limitações","Os trabalhos não constituem auditoria das demonstrações financeiras. Baseiam-se em informações fornecidas pela administração, não verificadas de forma independente, exceto quando indicado nos papéis de trabalho. Fatos posteriores à data-base não foram considerados."],
    dd_base:["Base normativa","Normas Brasileiras de Contabilidade (NBC TG / CPC), legislação tributária, trabalhista e previdenciária vigente e práticas de mercado em operações de fusão e aquisição."],
    val_escopo:["Objetivo","Estimar o intervalo de valor econômico da {EMPRESA} na data-base de {DATABASE}, para apoiar a negociação conduzida pela Kinsey Capital."],
    val_metodo:["Metodologia","Fluxo de caixa descontado em dois cenários (moderado, pelo crescimento histórico; otimista, por premissas justificadas do consultor), descontado pelo WACC apurado pelo CAPM, comparado com múltiplos de companhias abertas do segmento e com transações comparáveis. A faixa recomendada combina o FCD moderado e os múltiplos de mercado."],
    val_limites:["Limitações","As projeções dependem de premissas sobre eventos futuros e podem não se realizar. O valor final de uma transação resulta da negociação entre as partes. Este relatório é confidencial e destinado às partes autorizadas pela Kinsey Capital."]
  };
  const txt = (k, s, per) => { const o = S.config.modelos_rel?.[k] || TXT[k]; const [h, t] = Array.isArray(o) ? o : [o.h, o.t]; return [h, String(t).replace(/\{EMPRESA\}/g, s?.nome || "").replace(/\{DATABASE\}/g, per || "")]; };
  function editarTextos(){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Modelos básicos Kinsey</div><h2>Textos-padrão dos relatórios</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="ftx" style="display:flex;flex-direction:column;gap:12px" novalidate><p class="sub" style="margin:0">Textos provisórios até a Kinsey incluir os oficiais. Campos preenchidos pelo sistema: {EMPRESA}, {DATABASE}.</p>
      ${Object.keys(TXT).map(k => { const [h, t] = S.config.modelos_rel?.[k] ? [S.config.modelos_rel[k].h, S.config.modelos_rel[k].t] : TXT[k]; return `<div class="fld"><label for="tx-${k}">${k.startsWith("dd") ? "Due Diligence" : "Valuation"} · ${esc(h)}</label><textarea id="tx-${k}" rows="3">${esc(t)}</textarea></div>`; }).join("")}
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar textos</button></div></form>`);
    $("#ftx").onsubmit = e => { e.preventDefault(); const o = {}; Object.keys(TXT).forEach(k => o[k] = {h:TXT[k][0], t:$("#tx-" + k).value.trim()}); save(Store.set("config", "modelos_rel", o)).then(() => { close(); toast("Textos-padrão salvos"); }); };
  }

  /* ---------------- PDF: blocos ---------------- */
  function capa(P, eyebrow, titulo, linhas){
    P.page(); P.rect(0, 0, P.W, 300, NAVY); P.rect(0, 300, P.W, 4, ACC);
    P.text(P.M, 90, T(eyebrow), 11, true, [127,184,230]);
    P.wrap(T(titulo), 26, true, P.CW).forEach((l, i) => P.text(P.M, 130 + i * 32, l, 26, true, [255,255,255]));
    let y = 360; linhas.forEach(([k, v]) => { P.text(P.M, y, T(k).toUpperCase(), 8.5, true, MUT); P.text(P.M, y + 15, T(v), 12.5, true, NAVY); y += 40; });
    P.text(P.M, P.H - 80, "CONFIDENCIAL · Kinsey Capital", 9, true, ACC); P.text(P.M, P.H - 66, T(CONTATO), 8.5, false, MUT);
  }
  const sec = (P, n, t) => { P.page(); P.h1(n, T(t)); };
  const par = (P, t, o) => P.para(T(t), o);
  const tab = (P, cols, rows, ws) => P.table(cols.map((c, i) => ({t:T(c), w:ws ? ws[i] : 1 / cols.length})), rows.map(r => r.map(c => c && typeof c === "object" ? {...c, t:T(c.t)} : T(c))));
  function kpisPdf(P, items){ const w = (P.CW - (items.length - 1) * 8) / items.length; P.ensure(70); const y = P.y;
    items.forEach(([l, v, sub], i) => { const x = P.M + i * (w + 8); P.rect(x, y, w, 62, [238,245,252]); P.text(x + 8, y + 16, T(l).toUpperCase().slice(0, 34), 7, true, MUT); P.text(x + 8, y + 36, T(v).slice(0, 34), T(v).length > 16 ? 10 : 13, true, NAVY); if (sub) P.text(x + 8, y + 52, T(sub).slice(0, 44), 7.5, false, MUT); });
    P.y = y + 74; }
  function barrasPdf(P, titulo, cats, series, fmtv, h = 140){
    P.ensure(h + 60); P.h2(T(titulo)); const y0 = P.y + 6, x0 = P.M + 6, w = P.CW - 12, max = Math.max(1, ...series.flatMap(s => s.v.map(v => Math.abs(v || 0))));
    const gw = w / cats.length, bw = Math.min(34, (gw - 16) / series.length);
    P.line(x0, y0 + h, x0 + w, y0 + h, [200,208,220], .8);
    cats.forEach((c, i) => { const gx = x0 + i * gw + (gw - bw * series.length) / 2;
      series.forEach((s, j) => { const v = s.v[i] || 0, bh = Math.abs(v) / max * (h - 18), bx = gx + j * bw; P.rect(bx, y0 + h - bh, bw - 3, bh, s.c); P.text(bx, y0 + h - bh - 4, T(fmtv(v)).slice(0, 12), 6.8, false, MUT); });
      P.text(x0 + i * gw + gw / 2 - 12, y0 + h + 12, T(c), 8, true, NAVY); });
    let lx = x0; series.forEach(s => { P.rect(lx, y0 + h + 22, 8, 8, s.c); P.text(lx + 12, y0 + h + 29, T(s.n), 8, false, MUT); lx += 20 + s.n.length * 4.6; });
    P.y = y0 + h + 44; }
  function faixasPdf(P, met, rec){
    const rows = [...met, ["Faixa moderada recomendada", rec[0], rec[1]]], h = rows.length * 24 + 26; P.ensure(h + 20); P.h2("Faixas de valor por método (enterprise value)");
    const y0 = P.y, x0 = P.M + 190, w = P.CW - 190 - 90, mx = Math.max(...rows.map(r => r[2])), mn0 = Math.min(...rows.map(r => r[1])), mn = Math.max(0, mn0 - (mx - mn0) * .25), sx = v => x0 + (v - mn) / (mx - mn || 1) * w;
    rows.forEach((r, i) => { const y = y0 + i * 24, last = i === rows.length - 1, c = last ? GOLD : /otimista/i.test(r[0]) ? LILAS : /Patrim/.test(r[0]) ? [140,150,165] : ACC;
      P.text(P.M, y + 13, T(r[0]).slice(0, 40), 8, last, NAVY); P.rect(sx(r[1]), y + 3, Math.max(3, sx(r[2]) - sx(r[1])), 13, c); P.text(sx(r[2]) + 5, y + 13, T(`${mi(r[1], 0)} a ${mi(r[2], 0)}`), 7.5, false, MUT); });
    P.y = y0 + rows.length * 24 + 12; }

  /* ---------------- PPTX: blocos ---------------- */
  const hx = c => c.map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
  function pptBase(titulo){ const slides = []; const frame = (t, sub) => { const sh = [{x:0, y:0, w:13.333, h:.12, f:"0473C3"}, {x:.6, y:.35, w:12, h:.7, p:[{t:T(t), s:26, b:true, c:"011F4B"}]}];
      if (sub) sh.push({x:.6, y:1.0, w:12, h:.45, p:[{t:T(sub), s:13, c:"5A6578"}]}); sh.push({x:.6, y:7.0, w:10, h:.35, p:[{t:T(`Kinsey Capital · ${titulo} · Confidencial`), s:9, c:"5A6578"}]}, {x:11.7, y:7.0, w:1.05, h:.35, al:"r", p:[{t:String(slides.length + 1), s:9, c:"5A6578"}]}); return sh; };
    return {slides, frame}; }
  const kpisPpt = (sh, items, y = 1.6) => { const w = (12.1 - (items.length - 1) * .2) / items.length; items.forEach(([l, v, sub], i) => sh.push({x:.6 + i * (w + .2), y, w, h:1.35, f:"EEF5FC", round:true, pad:.15, p:[{t:T(l).toUpperCase(), s:10, b:true, c:"5A6578"}, {t:T(v), s:20, b:true, c:"011F4B", sb:300}, ...(sub ? [{t:T(sub), s:10, c:"5A6578", sb:200}] : [])]})); };
  function barrasPpt(sh, x, y, w, h, cats, series, fmtv){
    const max = Math.max(1, ...series.flatMap(s => s.v.map(v => Math.abs(v || 0)))), gw = w / cats.length, bw = Math.min(.7, (gw - .3) / series.length);
    sh.push({x, y:y + h, w, h:.02, f:"C8D0DC"});
    cats.forEach((c, i) => { const gx = x + i * gw + (gw - bw * series.length) / 2;
      series.forEach((s, j) => { const bh = Math.max(.02, Math.abs(s.v[i] || 0) / max * (h - .5)); sh.push({x:gx + j * bw, y:y + h - bh, w:bw - .06, h:bh, f:hx(s.c)}, {x:gx + j * bw - .2, y:y + h - bh - .32, w:bw + .4, h:.3, al:"ctr", p:[{t:T(fmtv(s.v[i] || 0)), s:9, c:"5A6578"}]}); });
      sh.push({x:x + i * gw, y:y + h + .05, w:gw, h:.3, al:"ctr", p:[{t:T(c), s:11, b:true, c:"011F4B"}]}); });
    series.forEach((s, j) => sh.push({x:x + j * 2.6, y:y + h + .4, w:.18, h:.18, f:hx(s.c)}, {x:x + j * 2.6 + .25, y:y + h + .32, w:2.3, h:.3, p:[{t:T(s.n), s:10, c:"5A6578"}]}));
  }
  function linhasPpt(sh, x, y, w, rows, cols){ const cw = w / cols; rows.slice(0, 14).forEach((r, i) => r.forEach((c, j) => sh.push({x:x + j * cw, y:y + i * .36, w:cw, h:.34, f:i === 0 ? "011F4B" : i % 2 ? "EEF5FC" : null, al:j ? "r" : "l", v:"ctr", p:[{t:T(c), s:i === 0 ? 10 : 10.5, b:i === 0, c:i === 0 ? "FFFFFF" : "1B2433"}]}))); }
  function faixasPpt(sh, met, rec, y0 = 1.7){
    const rows = [...met, ["Faixa moderada recomendada", rec[0], rec[1]]], x0 = 4.4, w = 6.4, mx = Math.max(...rows.map(r => r[2])), mn0 = Math.min(...rows.map(r => r[1])), mn = Math.max(0, mn0 - (mx - mn0) * .25), sx = v => x0 + (v - mn) / (mx - mn || 1) * w;
    const st = Math.min(.62, (6.75 - y0) / rows.length); rows.forEach((r, i) => { const y = y0 + i * st, last = i === rows.length - 1, c = last ? "B2791A" : /otimista/i.test(r[0]) ? "7850BE" : /Patrim/.test(r[0]) ? "8C96A5" : "0473C3";
      sh.push({x:.6, y, w:3.7, h:st, al:"r", v:"ctr", p:[{t:T(r[0]), s:11, b:last, c:"011F4B"}]}, {x:sx(r[1]), y:y + st * .2, w:Math.max(.05, sx(r[2]) - sx(r[1])), h:st * .6, f:c, round:true}, {x:sx(r[2]) + .1, y, w:2.4, h:st, v:"ctr", p:[{t:T(`${mi(r[1], 0)} a ${mi(r[2], 0)}`), s:10, c:"5A6578"}]}); }); }

  /* ---------------- DUE DILIGENCE · papéis de trabalho ---------------- */
  const LETRA = {contabil:"C", financeira:"F", trabalhista:"T", tributaria:"X", juridica:"J"};
  function papeis(s, per){
    const b = s.dd?.bal?.[per]; if (!b) return []; const K = D.calc(b), out = [], proc = s.dd.proc || {}, pt = s.dd.pt || {};
    D.AREAS.forEach(([a, nome]) => { let i = 0;
      D.PROCS.filter(p => p.area === a).forEach(p => { const r = p.f(K, b, s), cod = `PT-${LETRA[a]}-${String(++i).padStart(2, "0")}`;
        out.push({cod, area:a, tipo:"Automático", titulo:p.t, norma:p.n, objetivo:`Verificar: ${p.t.toLowerCase()}.`, proc:`Teste automático sobre o balancete de ${per} (${b.contas.length} contas analíticas, importado em ${dt(b.importadoEm)}).`, resultado:r.txt, st:r.st, ...(pt[cod] || {})}); });
      (D.MINIMOS[a] || []).forEach((m, j) => { const o = proc[a + j] || {}, cod = `PT-${LETRA[a]}-${String(++i).padStart(2, "0")}`;
        out.push({cod, area:a, tipo:"Mínimo do consultor", titulo:m, norma:"", objetivo:`${m}.`, proc:"Procedimento executado pelo consultor especialista da área.", resultado:o.obs || "Pendente.", st:o.st || "pendente", ...(pt[cod] || {})}); }); });
    D.ajustes(s, per).forEach((a, j) => { const cod = `PT-AJ-${String(j + 1).padStart(2, "0")}`; out.push({cod, area:a.area, tipo:"Ajuste", titulo:a.titulo, norma:a.norma || "", objetivo:"Apurar e documentar o ajuste proposto.", proc:a.desc || "", resultado:`${D.efeitoTxt(a)} · Análises: ${a.fin?.st || "aguardando OK"}${a.fin?.por ? " (" + a.fin.por + ")" : ""} · Valuation: ${a.val?.st || (D.okFin(a) ? "aguardando OK" : "—")}`, st:D.okVal(a) ? "ok" : D.okFin(a) ? "parcial" : "pendente", ...(pt[cod] || {})}); });
    return out;
  }
  const ST = {ok:["Sem achado","r-baixo"], achado:["Achado","r-alto"], na:["Não se aplica","r-pend"], sd:["Sem dados","r-pend"], pendente:["Pendente","r-pend"], parcial:["OK parcial","r-medio"]};
  function ddPapeisView(s, per){
    const L = papeis(s, per), ok = L.filter(p => p.prep?.por).length, rv = L.filter(p => p.rev?.por).length, evs = S.evidences.filter(e => e.supplierId === s.id);
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Papéis de trabalho · balancete ${esc(per)}</h3><p class="sub" style="margin:2px 0 0">${L.length} papéis · ${ok} preparados · ${rv} revisados. Suportam o relatório de Due Diligence e a self due diligence.</p></div><button type="button" class="btn sm primary" id="pt-pdf">Baixar papéis (PDF)</button></div>
      <div class="tbl"><table><thead><tr><th>Código</th><th>Procedimento</th><th>Resultado</th><th>Evidência</th><th>Preparado</th><th>Revisado</th></tr></thead><tbody>${L.map(p => `<tr>
        <td class="mono" style="white-space:nowrap">${p.cod}</td><td style="min-width:200px"><b>${esc(p.titulo)}</b><div class="sub" style="margin:2px 0 0;font-size:11.5px">${esc(D.areaNome(p.area))} · ${esc(p.tipo)}${p.norma ? " · " + esc(p.norma) : ""}</div></td>
        <td style="min-width:220px;font-size:12.5px"><span class="pill ${ST[p.st]?.[1] || "r-pend"}" style="font-size:10px">${ST[p.st]?.[0] || esc(p.st)}</span> ${esc(p.resultado)}</td>
        <td><select data-ptev="${p.cod}" aria-label="Evidência de ${p.cod}" ${D.ed() ? "" : "disabled"} style="max-width:160px"><option value="">—</option>${evs.map(e => `<option value="${e.id}" ${e.id === p.evid ? "selected" : ""}>${esc(e.tipo)} · ${esc((e.nome || "").slice(0, 24))}</option>`).join("")}</select></td>
        <td style="font-size:12px">${p.prep?.por ? `${esc(p.prep.por)}<div class="sub" style="margin:0;font-size:11px">${dt(p.prep.em)}</div>` : D.ed() ? `<button type="button" class="btn sm" data-ptsig="${p.cod}:prep">Assinar</button>` : "—"}</td>
        <td style="font-size:12px">${p.rev?.por ? `${esc(p.rev.por)}<div class="sub" style="margin:0;font-size:11px">${dt(p.rev.em)}</div>` : D.ed() && p.prep?.por ? `<button type="button" class="btn sm" data-ptsig="${p.cod}:rev">Revisar</button>` : "—"}</td></tr>`).join("")}</tbody></table></div></div>`;
  }
  function ddPapeisBind(host, s, per){
    $$("[data-ptev]", host).forEach(x => x.onchange = () => D.up(s, {dd:{pt:{[x.dataset.ptev]:{evid:x.value}}}}));
    $$("[data-ptsig]", host).forEach(b => b.onclick = () => { const [cod, k] = b.dataset.ptsig.split(":"), area = papeis(s, per).find(p => p.cod === cod)?.area;
      const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${k === "prep" ? "Preparação" : "Revisão"} do papel de trabalho</div><h2>${esc(cod)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
        <form class="sheet-b" id="fsig" novalidate><div class="form"><div class="fld full"><label for="sg-n">${k === "prep" ? "Preparado por" : "Revisado por"}</label><input id="sg-n" value="${esc(k === "prep" ? s.dd?.cons?.[area] || "" : "")}" placeholder="Nome e registro"></div><div class="fld full"><label for="sg-o">Observação</label><textarea id="sg-o"></textarea></div></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Assinar</button></div></form>`);
      $("#fsig").onsubmit = e => { e.preventDefault(); const nome = $("#sg-n").value.trim(); if (!nome){ toast("Informe o nome."); return; } D.up(s, {dd:{pt:{[cod]:{[k]:{por:nome, em:nowISO(), obs:$("#sg-o").value.trim()}}}}}).then(() => { close(); toast("Papel de trabalho assinado"); }); }; });
    const pdf = $("#pt-pdf", host); if (pdf) pdf.onclick = () => papeisPdf(s, per).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
  }
  async function papeisPdf(s, per){
    const P = KTPdf(), L = papeis(s, per), evs = Object.fromEntries(S.evidences.map(e => [e.id, e]));
    capa(P, "Due Diligence · papéis de trabalho", s.nome, [["Data-base", per], ["Papéis", String(L.length)], ["Emitido em", hojeBR()]]);
    sec(P, 1, "Índice dos papéis de trabalho"); tab(P, ["Código", "Procedimento", "Situação", "Preparado", "Revisado"], L.map(p => [p.cod, p.titulo, ST[p.st]?.[0] || p.st, p.prep?.por || "-", p.rev?.por || "-"]), [.12, .4, .14, .17, .17]);
    D.AREAS.forEach(([a, nome], i) => { sec(P, i + 2, "Papéis · " + nome); L.filter(p => p.area === a).forEach(p => { P.ensure(110); P.h2(T(`${p.cod} · ${p.titulo}`));
      tab(P, ["Campo", "Registro"], [["Tipo", p.tipo + (p.norma ? " · " + p.norma : "")], ["Objetivo", p.objetivo], ["Procedimento", p.proc], ["Resultado", p.resultado], ["Conclusão", ST[p.st]?.[0] || p.st], ["Evidência", p.evid && evs[p.evid] ? `${evs[p.evid].tipo} · ${evs[p.evid].nome || ""}` : "-"], ["Preparado", p.prep?.por ? `${p.prep.por} em ${dt(p.prep.em)}` : "-"], ["Revisado", p.rev?.por ? `${p.rev.por} em ${dt(p.rev.em)}` : "-"]], [.2, .8]); }); });
    await rptSave(P.out(`Papéis de trabalho · ${s.nome}`, T(`Kinsey Capital · Due Diligence · papéis de trabalho · ${s.nome} · ${per} · confidencial`)), arq(s, "papeis_trabalho", "pdf"), "application/pdf");
  }

  /* ---------------- DUE DILIGENCE · relatório ---------------- */
  function ddRelView(s, per){
    const L = papeis(s, per), ach = L.filter(p => p.st === "achado").length, pendMin = L.filter(p => p.tipo === "Mínimo do consultor" && p.st === "pendente").length, AJ = D.ajustes(s, per), pend = AJ.filter(D.pendFin).length;
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px"><div class="head" style="margin:0"><div><h3>Relatório de Due Diligence</h3><p class="sub" style="margin:2px 0 0">Estrutura Kinsey: carta e limitações, sumário das exposições (mínimo, máximo e qualificado), decadência, grupo econômico, balanço reclassificado, EBITDA ajustado, capital de giro, dívida líquida, aspectos tributários e trabalhistas, pontos e recomendações.</p></div><button type="button" class="btn sm" id="dd-tx">Textos-padrão</button></div>
      <div class="dd-kpis"><div class="dd-k"><span>Achados</span><b>${ach}</b><small>procedimentos com achado</small></div><div class="dd-k"><span>Mínimos pendentes</span><b>${pendMin}</b><small>dos consultores</small></div><div class="dd-k"><span>Ajustes sem OK</span><b>${pend}</b><small>nas Análises financeiras</small></div></div>
      ${pendMin || pend ? `<div class="banner">O relatório pode ser emitido como <b>versão preliminar</b>: há procedimentos mínimos pendentes ou ajustes sem OK.</div>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" id="dd-pdf">Emitir relatório (PDF)</button><button type="button" class="btn" id="dd-ptpdf">Papéis de trabalho (PDF)</button></div></div>`;
  }
  function ddRelBind(host, s, per){
    const t = $("#dd-tx", host); if (t) t.onclick = editarTextos;
    const p = $("#dd-pdf", host); if (p) p.onclick = () => window.KT_GRAF && window.KT_EXP ? KT_GRAF.modo("Due diligence · " + s.nome, md => KT_EXP.ddPdf(s, per, md)) : ddPdf(s, per).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
    const q = $("#dd-ptpdf", host); if (q) q.onclick = () => papeisPdf(s, per).catch(e => { console.error(e); toast("Não foi possível gerar o PDF."); });
  }
  async function ddPdf(s, per){
    if (window.KT_EXP) return KT_EXP.ddPdf(s, per);
    const b = s.dd.bal[per], K = D.calc(b), AJ = D.ajustes(s, per), A = D.soma(AJ.filter(D.okFin)), I0 = D.indic(K), I = D.indic(K, A), L = papeis(s, per), prelim = L.some(p => p.tipo === "Mínimo do consultor" && p.st === "pendente") || AJ.some(D.pendFin);
    const P = KTPdf(); capa(P, "Relatório de Due Diligence" + (prelim ? " · versão preliminar" : ""), s.nome, [["Data-base", b.dataBase], ["Mandato", s.mandato?.codinome || "-"], ["Consultores", Object.values(s.dd.cons || {}).filter(Boolean).join(" · ") || "-"], ["Emitido em", hojeBR()]]);
    sec(P, 1, "Escopo, base normativa e limitações"); ["dd_escopo","dd_base","dd_limites"].forEach(k => { const [h, t] = txt(k, s, b.dataBase); P.h2(T(h)); par(P, t); });
    sec(P, 2, "Sumário executivo");
    kpisPdf(P, [["EBITDA ajustado", mi(I.ebitda), `reportado ${mi(K.ebitda)}`], ["Dívida líquida ajustada", mi(I.dl), `reportada ${mi(K.dl)}`], ["DL / EBITDA", xx(I.dlEbitda), `reportado ${xx(I0.dlEbitda)}`], ["Achados", String(L.filter(p => p.st === "achado").length), `${AJ.filter(D.okFin).length} ajuste(s) com OK`]]);
    P.h2("Principais pontos (red flags)"); L.filter(p => p.st === "achado").forEach(p => par(P, `• ${D.areaNome(p.area)} · ${p.titulo}: ${p.resultado}`, {size:9}));
    P.h2("Ajustes da Due Diligence"); tab(P, ["Ajuste", "Área", "Efeitos (anuais)", "OK análises", "OK valuation"], AJ.map(a => [a.titulo, D.areaNome(a.area), D.efeitoTxt(a), a.fin ? `${a.fin.st} · ${a.fin.por || ""}` : "aguardando", a.val ? `${a.val.st} · ${a.val.por || ""}` : "-"]), [.24, .12, .3, .17, .17]);
    sec(P, 3, "Números e indicadores");
    tab(P, ["", "Reportado", "Ajustado"], [["Receita líquida", mi(K.recLiq), mi(K.recLiq)], ["EBITDA", mi(K.ebitda), mi(I.ebitda)], ["Margem EBITDA", pc(I0.mEbitda), pc(I.mEbitda)], ["Lucro líquido", mi(K.ll), mi(I.ll)], ["Patrimônio líquido", mi(K.PL), mi(I.pl)], ["Dívida líquida", mi(K.dl), mi(I.dl)], ["Capital de giro (NCG)", mi(K.ncg), mi(I.ncg)], ["Liquidez corrente", xx(I0.lc, 2), xx(I.lc, 2)], ["Endividamento geral", pc(I0.endiv), pc(I.endiv)], ["Ciclo de caixa", fmt(K.ciclo, 0) + " dias", fmt(K.ciclo, 0) + " dias"]], [.5, .25, .25]);
    D.AREAS.forEach(([a, nome], i) => { sec(P, 4 + i, "Due Diligence " + nome); P.para(T(`Consultor responsável: ${s.dd.cons?.[a] || "a definir"}`), {size:9, color:MUT});
      tab(P, ["Código", "Procedimento", "Resultado"], L.filter(p => p.area === a && p.tipo !== "Ajuste").map(p => [p.cod, p.titulo, `${ST[p.st]?.[0] || p.st}: ${p.resultado}`]), [.12, .33, .55]); });
    sec(P, 4 + D.AREAS.length, "Conclusão"); par(P, `A Due Diligence ${prelim ? "está em andamento: este relatório é preliminar" : "foi concluída nos procedimentos previstos"}. Os ajustes com OK do consultor foram incorporados às Análises financeiras${AJ.some(D.okVal) ? " e ao valuation" : ""}. Os papéis de trabalho que suportam cada ponto estão disponíveis em documento separado.`);
    P.y += 30; Object.entries(s.dd.cons || {}).filter(([, v]) => v).forEach(([a, v]) => { P.ensure(40); P.line(P.M, P.y + 20, P.M + 220, P.y + 20, NAVY, .6); P.text(P.M, P.y + 32, T(`${v} · ${D.areaNome(a)}`), 8.5, false, MUT); P.y += 46; });
    await rptSave(P.out(`Due Diligence · ${s.nome}`, T(`Kinsey Capital · Relatório de Due Diligence · ${s.nome} · ${b.dataBase} · confidencial`)), arq(s, "due_diligence", "pdf"), "application/pdf");
  }

  /* ---------------- VALUATION ---------------- */
  async function valuation(s, fmtx, modo = "completo"){
    const R = KT_VAL.resumo(s), X = R.X, mod = R.mod.c, ot = R.ot.c, C = R.C, W = X.W, db = s.perfil?.dataBase || X.perBase, anos = X.H.anuais, Tz = window.KT_TEASER ? KT_TEASER.conteudo(s, "pos") : null;
    const just = s.dd?.vl?.just || {}, A = R.A.filter(a => a.nivel !== "bloqueio");
    const projRows = c => [["", ...c.anos.map(a => String(a.y))], ["Receita líquida", ...c.anos.map(a => mi(a.rl))], ["EBITDA", ...c.anos.map(a => mi(a.eb))], ["Margem", ...c.anos.map(a => pc(a.mg))], ["Fluxo de caixa livre", ...c.anos.map(a => mi(a.fcl))]];
    const waccRows = [["Taxa livre de risco (USD)", pc(X.Bs.P.rf.v / 100)], ["Beta realavancado", fmt(W.bl, 2)], ["Prêmio de mercado", pc(X.Bs.P.erp.v / 100)], ["Risco-país", pc(X.Bs.P.crp.v / 100)], ["Prêmio de tamanho", pc(W.size / 100)], ["Custo do capital próprio (R$)", pc(W.ke)], ["Custo da dívida após IR", pc(W.kdLiq)], ["Estrutura (capital próprio/dívida)", `${pc(W.we, 0)} / ${pc(W.wd, 0)}`], ["WACC automático (CAPM)", pc(W.waccAuto ?? W.wacc)], ...(W.ajustado ? [["WACC ajustado pelo consultor", `${pc(W.wacc)} · ${W.just?.tipo || ""}: ${W.just?.texto || "sem justificativa"}`]] : [["WACC usado", pc(W.wacc)]])];
    if (fmtx === "pdf"){
      const P = KTPdf(); capa(P, "Relatório de valuation", s.nome, [["Data-base", db], ["Segmento", s.perfil?.segmento || ""], ["Faixa moderada (enterprise value)", `${mi(R.rec[0])} a ${mi(R.rec[1])}`], ["Emitido em", hojeBR()]]);
      sec(P, 1, "Sumário executivo");
      kpisPdf(P, [["Faixa moderada · EV", `${mi(R.rec[0], 0)} a ${mi(R.rec[1], 0)}`, "recomendada"], ["Equity moderado", `${mi(R.rec[0] - X.dl, 0)} a ${mi(R.rec[1] - X.dl, 0)}`, `DL ajustada ${mi(X.dl)}`], ["FCD otimista · EV", `${mi(R.ot.min, 0)} a ${mi(R.ot.max, 0)}`, "premissas justificadas"], ["WACC", pc(W.wacc), `EBITDA base ${mi(X.bp.eb)}`]]);
      faixasPdf(P, R.met.map(m => [m[0], m[1], m[2]]), R.rec);
      const G = window.KT_GRAF, evm = (R.rec[0] + R.rec[1]) / 2, grp = {}; X.pt.L.filter(x => x.inc).forEach(x => { grp[x.grupo] = (grp[x.grupo] || 0) + x.v; });
      if (G) G.cascata(P, "Do enterprise value ao equity value (ponto médio da faixa moderada)", [{l:"Enterprise value", v:evm, tipo:"base"}, ...Object.entries(grp).filter(([, v]) => Math.abs(v) > 1).map(([g, v]) => ({l:g, v:-v, tipo:"delta"})), {l:"Equity value", v:evm - X.dl, tipo:"total"}], v => mi(v, 1));
      const histG = () => G && anos.length && G.colunas(P, "Receita líquida, EBITDA ajustado e margem", anos.map(a => String(a.ano)), [{n:"Receita líquida", v:anos.map(a => a.rl), c:ACC}, {n:"EBITDA ajustado", v:anos.map(a => a.eb), c:G.VERDE}], v => mi(v, 1), {n:"Margem EBITDA", v:anos.map(a => a.eb / (a.rl || 1))});
      const evEbT = R.rec && X.bp.eb ? evm / X.bp.eb : null;
      const compG = () => G && C.ok.length && G.barrasH(P, "Comparáveis · EV/EBITDA (companhias abertas)", C.ok.filter(c => c.evEb > 0 && c.evEb < 60).sort((a, b) => b.evEb - a.evEb).slice(0, 14).map(c => ({l:c.nome, v:c.evEb, txt:xx(c.evEb)})), v => xx(v), evEbT ? {v:evEbT, l:`target ${xx(evEbT)} (faixa moderada)`} : null);
      if (modo === "resumo"){
        sec(P, 2, "Desempenho e mercado"); histG(); compG();
        if (Tz){ P.h2("Destaques"); Tz.destaques.slice(0, 5).forEach(d => par(P, "• " + d, {size:9.5})); }
        sec(P, 3, "Fluxo de caixa descontado e pontos de atenção");
        if (G) G.colunas(P, "EBITDA projetado · moderado × otimista", mod.anos.map(a => String(a.y)), [{n:"Moderado", v:mod.anos.map(a => a.eb), c:ACC}, {n:"Otimista", v:ot.anos.map(a => a.eb), c:G.GOLD}], v => mi(v, 1));
        tab(P, ["", "Moderado", "Otimista"], [["WACC", pc(W.wacc), pc(W.wacc)], ["Enterprise value", mi(mod.ev), mi(ot.ev)], ["Equity value", mi(mod.eq), mi(ot.eq)], ["EV/EBITDA implícito", xx(mod.mult), xx(ot.mult)]], [.5, .25, .25]);
        P.h2("Pontos de atenção"); A.slice(0, 6).forEach(a => par(P, `• ${a.txt}`, {size:9}));
        const [hl, tl] = txt("val_limites", s, db); P.h2(T(hl)); par(P, tl, {size:8.5});
        await rptSave(P.out(`Valuation · ${s.nome}`, T(`Kinsey Capital · Valuation (resumo) · ${s.nome} · ${db} · confidencial`)), arq(s, "valuation_resumo", "pdf"), "application/pdf"); return; }
      tab(P, ["Método", "EV mín.", "EV máx.", "Equity mín.", "Equity máx.", "Base"], R.met.map(m => [m[0], mi(m[1]), mi(m[2]), mi(m[1] - X.dl), mi(m[2] - X.dl), m[3]]), [.26, .11, .11, .11, .11, .3]);
      P.h2("Do enterprise value ao equity value (líquido de dívidas)");
      tab(P, ["Grupo", "Item", "Valor"], [...X.pt.L.filter(x => x.inc).map(x => [x.grupo, x.rot + (x.just ? " · " + x.just : ""), mi(x.v)]), [{t:"Dívida líquida ajustada", b:true}, "", {t:mi(X.dl), b:true}],
        ["Enterprise value · faixa moderada", "", `${mi(R.rec[0])} a ${mi(R.rec[1])}`], [{t:"Equity value · faixa moderada", b:true}, "", {t:`${mi(R.rec[0] - X.dl)} a ${mi(R.rec[1] - X.dl)}`, b:true}]], [.25, .5, .25]);
      par(P, `Dívida líquida reportada no balancete de ${X.perBase}: ${mi(X.pt.reportada)}. Itens equivalentes a dívida, ajustes da Due Diligence com OK no valuation e complementos do consultor conforme a tabela.`, {size:8.5, color:MUT});
      ["val_escopo","val_metodo"].forEach(k => { const [h, t] = txt(k, s, db); P.h2(T(h)); par(P, t); });
      if (Tz){ sec(P, 2, "A empresa e o mercado"); par(P, Tz.descricao || ""); P.h2("Destaques"); Tz.destaques.forEach(d => par(P, "• " + d, {size:9.5}));
        if (Tz.linhas.length) tab(P, ["Linha de negócio", "Participação", "Descrição"], Tz.linhas.map(l => [l.nome, l.pct || "-", l.desc || ""]), [.3, .15, .55]);
        P.h2("Mercado e setor"); Tz.mercado.forEach(m => par(P, "• " + m, {size:9.5})); }
      sec(P, 3, "Histórico");
      if (G) histG(); else barrasPdf(P, "Receita líquida e EBITDA ajustado", anos.map(a => String(a.ano)), [{n:"Receita líquida", v:anos.map(a => a.rl), c:ACC}, {n:"EBITDA ajustado", v:anos.map(a => a.eb), c:GOLD}], v => mi(v, 0));
      tab(P, ["Linha de negócio", ...anos.map(a => String(a.ano)), "CAGR real"], X.nomes.map(l => [l, ...anos.map(a => mi(a.lin[l] || 0)), pc(X.histL[l]?.real)]));
      X.H.comp.forEach(g => tab(P, [`${g[0].meses} meses até ${String(g[0].mes).padStart(2, "0")}`, ...g.map(p => String(p.ano))], [["Receita líquida", ...g.map(p => mi(p.rl / p.K.f))], ["EBITDA ajustado", ...g.map(p => mi(p.eb / p.K.f))]]));
      sec(P, 4, "Ajustes de Due Diligence considerados"); const aj = D.ajustes(s, X.perBase).filter(D.okVal);
      aj.length ? tab(P, ["Ajuste", "Efeitos", "OK no valuation"], aj.map(a => [a.titulo, D.efeitoTxt(a), `${a.val.por} · ${dt(a.val.em)}`]), [.35, .4, .25]) : par(P, "Nenhum ajuste com OK no valuation.");
      sec(P, 5, "Fluxo de caixa descontado"); tab(P, ["Componente do WACC", "Valor"], waccRows, [.7, .3]);
      if (G){ G.barrasH(P, "Composição do custo de capital", [{l:"Custo do capital próprio (Ke)", v:W.ke, txt:pc(W.ke)}, {l:"Custo da dívida após IR (Kd)", v:W.kdLiq, txt:pc(W.kdLiq), c:G.GOLD}, {l:"WACC", v:W.wacc, txt:pc(W.wacc), c:G.NAVY}], v => pc(v));
        G.colunas(P, "EBITDA projetado · moderado × otimista", mod.anos.map(a => String(a.y)), [{n:"Moderado", v:mod.anos.map(a => a.eb), c:ACC}, {n:"Otimista", v:ot.anos.map(a => a.eb), c:G.GOLD}], v => mi(v, 1));
        const dws = [-.02, -.01, 0, .01, .02]; G.calor(P, "Sensibilidade do enterprise value ao WACC", ["Cenário", ...dws.map(d => pc(W.wacc + d))], ["mod", "ot"].map(k => [k === "mod" ? "Moderado" : "Otimista", ...dws.map(d => KT_VAL.cenario(X, k, d).ev)]), v => mi(v, 1)); }
      P.h2("Cenário moderado (crescimento histórico)"); tab(P, projRows(mod)[0], projRows(mod).slice(1));
      P.h2("Cenário otimista (premissas justificadas)"); tab(P, projRows(ot)[0], projRows(ot).slice(1));
      tab(P, ["", "Moderado", "Otimista"], [["Enterprise value", mi(mod.ev), mi(ot.ev)], ["Equity value", mi(mod.eq), mi(ot.eq)], ["EV/EBITDA implícito", xx(mod.mult), xx(ot.mult)]], [.5, .25, .25]);
      P.h2("Justificativas do cenário otimista"); const js = Object.entries(just); js.length ? js.forEach(([k2, j]) => par(P, `• ${j.tipo}: ${j.texto} (${j.por || ""})`, {size:9})) : par(P, "Sem premissas acima do histórico.", {size:9});
      sec(P, 6, "Múltiplos de mercado e outras avaliações");
      if (G) compG();
      C.ok.length ? tab(P, ["Companhia", "Segmento", "EV/EBITDA", "EV/Receita", "Fonte"], C.ok.map(c => [c.nome, c.seg, xx(c.evEb), xx(c.evRec, 2), `${c.fonte || c.origem} ${c.data || ""}`]), [.3, .14, .13, .13, .3]) : par(P, "Sem comparáveis.");
      if (C.eb) par(P, `EV/EBITDA: p25 ${xx(C.eb.p25)} · mediana ${xx(C.eb.med)} · p75 ${xx(C.eb.p75)}, com desconto de liquidez de ${fmt(X.Bs.P.desc.v, 0)}%.`, {size:9});
      { const Q = KT_VAL.cmpEbitda(s, R); if (Q.ref){ const r = Q.ref.st, d = Q.d; P.h2("EBITDA apurado × múltiplos de mercado");
        par(P, `EBITDA do target pela base contábil e pela base financeira ajustada frente ao EV/EBITDA de companhias do ${Q.ref.nome}, com desconto de liquidez de ${fmt(X.Bs.P.desc.v, 0)}%.`, {size:9});
        tab(P, ["Comparáveis", "Cias.", "p25", "Mediana", "p75", "Margem mediana"], Q.grupos.map(g => [g[0], String(g[2].n), xx(g[2].p25), xx(g[2].med), xx(g[2].p75), g[3] ? pc(g[3].med) : "-"]), [.34, .08, .13, .13, .13, .19]);
        tab(P, ["EBITDA do target", "Valor", "Margem", "EV p25", "EV mediana", "EV p75"], Q.bases.map(b2 => [b2.rot, mi(b2.eb), pc(b2.mg), mi(b2.eb * r.p25 * d), mi(b2.eb * r.med * d), mi(b2.eb * r.p75 * d)]), [.32, .13, .1, .15, .15, .15]);
        tab(P, ["Referência", "EV", "× EBITDA contábil", "× EBITDA ajustado", "Posição"], Q.impl.map(i => [i.rot, mi(i.ev), xx(i.cont), xx(i.fin), Q.pos(i.fin)]), [.26, .15, .15, .15, .29]);
        par(P, `Diferença entre o EBITDA ajustado e o contábil: ${mi(Q.gap)} (${pc(Q.gapPc)}), efeito de ${mi(Q.efeitoEv)} no enterprise value pela mediana.`, {size:9}); } }
      if (R.T.L.length) tab(P, ["Transação", "Data", "EV/EBITDA", "EV/Receita"], R.T.L.map(t => [t.alvo + " · " + (t.comprador || ""), t.data || "", xx(t.evEb), xx(t.evRec, 2)]), [.5, .15, .175, .175]);
      sec(P, 7, "Pontos de atenção e limitações"); A.forEach(a => par(P, `• ${a.ok ? "Justificado: " : ""}${a.txt}`, {size:9})); const [hl, tl] = txt("val_limites", s, db); P.h2(T(hl)); par(P, tl);
      await rptSave(P.out(`Valuation · ${s.nome}`, T(`Kinsey Capital · Valuation · ${s.nome} · ${db} · confidencial`)), arq(s, "valuation", "pdf"), "application/pdf");
    } else {
      const {slides, frame} = pptBase("Valuation · " + s.nome);
      slides.push({bg:"011F4B", sh:[{x:.8, y:1.2, w:11, h:.5, p:[{t:"KINSEY CAPITAL", s:18, b:true, c:"7FB8E6"}]}, {x:.8, y:1.9, w:11.5, h:1.6, p:[{t:"Relatório de valuation", s:40, b:true, c:"FFFFFF"}]}, {x:.8, y:3.5, w:11.5, h:.6, p:[{t:T(s.nome), s:22, b:true, c:"FFFFFF"}]},
        {x:.8, y:4.4, w:11.5, h:1.2, p:[{t:T(`Data-base ${db} · ${s.perfil?.segmento || ""}`), s:14, c:"C9D6EA"}, {t:T(`Faixa moderada: ${mi(R.rec[0])} a ${mi(R.rec[1])} (enterprise value)`), s:16, b:true, c:"F2C14E", sb:600}]}, {x:.8, y:6.6, w:11.5, h:.4, p:[{t:T("CONFIDENCIAL · " + CONTATO), s:10, c:"7FB8E6"}]}]});
      let sh = frame("Sumário executivo", "Faixa moderada recomendada e cenário otimista separado"); kpisPpt(sh, [["Faixa moderada · EV", `${mi(R.rec[0], 0)} a ${mi(R.rec[1], 0)}`], ["Equity moderado", `${mi(R.rec[0] - X.dl, 0)} a ${mi(R.rec[1] - X.dl, 0)}`], ["FCD otimista · EV", `${mi(R.ot.min, 0)} a ${mi(R.ot.max, 0)}`], ["WACC", pc(W.wacc)]]); faixasPpt(sh, R.met.map(m => [m[0], m[1], m[2]]), R.rec, 3.2); slides.push({sh});
      if (Tz){ sh = frame("A empresa", Tz.descricao?.slice(0, 160)); sh.push({x:.6, y:1.7, w:6, h:4.8, p:Tz.destaques.slice(0, 7).map(d => ({t:"• " + T(d), s:14, c:"1B2433", sb:400}))}, {x:7, y:1.7, w:5.7, h:4.8, f:"EEF5FC", round:true, pad:.2, p:[{t:"Mercado e setor", s:14, b:true, c:"011F4B"}, ...Tz.mercado.slice(0, 6).map(m => ({t:"• " + T(m), s:12, c:"1B2433", sb:300}))]}); slides.push({sh}); }
      sh = frame("Histórico", `Crescimento real da receita: ${pc(X.total?.real)} ao ano`); barrasPpt(sh, .8, 1.7, 7, 4.2, anos.map(a => String(a.ano)), [{n:"Receita líquida", v:anos.map(a => a.rl), c:ACC}, {n:"EBITDA ajustado", v:anos.map(a => a.eb), c:GOLD}], v => mi(v, 0));
      linhasPpt(sh, 8.2, 1.7, 4.6, [["Linha", "CAGR real"], ...X.nomes.map(l => [l, pc(X.histL[l]?.real)])], 2); slides.push({sh});
      sh = frame("Do enterprise value ao equity value", `Dívida líquida ajustada ${mi(X.dl)} · equity ${mi(R.rec[0] - X.dl)} a ${mi(R.rec[1] - X.dl)}`);
      linhasPpt(sh, .6, 1.6, 12.1, [["Item", "Valor"], ...X.pt.L.filter(x => x.inc).map(x => [`${x.grupo} · ${x.rot}`, mi(x.v)]), ["Dívida líquida ajustada", mi(X.dl)], ["Enterprise value (faixa moderada)", `${mi(R.rec[0])} a ${mi(R.rec[1])}`], ["Equity value (faixa moderada)", `${mi(R.rec[0] - X.dl)} a ${mi(R.rec[1] - X.dl)}`]], 2); slides.push({sh});
      sh = frame("WACC pelo CAPM", `WACC ${pc(W.wacc)} · base de apuração Kinsey`); linhasPpt(sh, .6, 1.7, 7, [["Componente", "Valor"], ...waccRows], 2); slides.push({sh});
      [["Cenário moderado", mod, "crescimento histórico por linha e margem média"], ["Cenário otimista", ot, "premissas justificadas do consultor"]].forEach(([t2, c, sub]) => { sh = frame(t2, `${sub} · EV ${mi(c.ev)} · equity ${mi(c.eq)} · ${xx(c.mult)} o EBITDA`); linhasPpt(sh, .6, 1.7, 12.1, projRows(c), 6); slides.push({sh}); });
      sh = frame("Múltiplos de mercado", C.eb ? `EV/EBITDA p25 ${xx(C.eb.p25)} · mediana ${xx(C.eb.med)} · p75 ${xx(C.eb.p75)}` : "sem comparáveis"); linhasPpt(sh, .6, 1.7, 12.1, [["Companhia", "Segmento", "EV/EBITDA", "EV/Receita"], ...C.ok.slice(0, 10).map(c => [c.nome, c.seg, xx(c.evEb), xx(c.evRec, 2)])], 4); slides.push({sh});
      { const Q = KT_VAL.cmpEbitda(s, R); if (Q.ref){ const r = Q.ref.st, d = Q.d; sh = frame("EBITDA apurado × múltiplos de mercado", `Comparáveis do ${Q.ref.nome} · EV/EBITDA ${xx(r.p25)} · ${xx(r.med)} · ${xx(r.p75)} · desconto de liquidez ${fmt(X.Bs.P.desc.v, 0)}%`);
        linhasPpt(sh, .6, 1.6, 12.1, [["EBITDA do target", "Valor", "Margem", "EV p25", "EV mediana", "EV p75"], ...Q.bases.map(b2 => [b2.rot, mi(b2.eb), pc(b2.mg), mi(b2.eb * r.p25 * d, 0), mi(b2.eb * r.med * d, 0), mi(b2.eb * r.p75 * d, 0)])], 6);
        linhasPpt(sh, .6, 4.0, 12.1, [["Referência", "EV", "× contábil", "× ajustado", "Posição"], ...Q.impl.map(i => [i.rot, mi(i.ev, 0), xx(i.cont), xx(i.fin), Q.pos(i.fin)])], 5); slides.push({sh}); } }
      sh = frame("Enterprise value e equity value por método", `Equity = EV − dívida líquida ajustada de ${mi(X.dl)}`); linhasPpt(sh, .6, 1.6, 12.1, [["Método", "EV mín.", "EV máx.", "Equity mín.", "Equity máx."], ...R.met.map(m => [m[0], mi(m[1], 0), mi(m[2], 0), mi(m[1] - X.dl, 0), mi(m[2] - X.dl, 0)])], 5); slides.push({sh});
      sh = frame("Pontos de atenção e justificativas"); sh.push({x:.6, y:1.6, w:12.1, h:5.2, p:[...A.slice(0, 8).map(a => ({t:"• " + T((a.ok ? "Justificado: " : "") + a.txt), s:13, c:"1B2433", sb:300})), ...Object.values(just).slice(0, 4).map(j => ({t:"– " + T(`${j.tipo}: ${j.texto}`).slice(0, 220), s:11, c:"5A6578", sb:200}))]}); slides.push({sh});
      await rptSave(ktPptx(slides, `Valuation · ${s.nome}`), arq(s, "valuation", "pptx"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    }
  }

  /* ---------------- TEASER ---------------- */
  async function teaser(s, fase, fmtx, modo = "completo"){
    const Z = KT_TEASER.conteudo(s, fase), nome = fase === "pre" ? Z.codinome : s.nome;
    if (fmtx === "pdf"){
      const P = KTPdf(), pre = fase === "pre", bl = (t, o) => par(P, "• " + t, {size:9.5, gap:2, ...(o || {})});
      let nsec = 0; const secT = (t, h = 120) => { P.ensure(h); P.y += 6; nsec++; P.h1(nsec, T(t)); };
      const G = window.KT_GRAF, evol = () => Z.serie.length && (G ? G.colunas(P, "Evolução da empresa · receita líquida, EBITDA ajustado e margem", Z.serie.map(a => a.ano), [{n:"Receita líquida", v:Z.serie.map(a => a.rl), c:ACC}, {n:"EBITDA ajustado", v:Z.serie.map(a => a.eb), c:G.VERDE}], v => mi(v, pre ? 0 : 1), {n:"Margem EBITDA", v:Z.serie.map(a => a.mg ?? a.eb / (a.rl || 1))}) : barrasPdf(P, "Receita líquida e EBITDA ajustado", Z.serie.map(a => a.ano), [{n:"Receita líquida", v:Z.serie.map(a => a.rl), c:ACC}, {n:"EBITDA ajustado", v:Z.serie.map(a => a.eb), c:GOLD}], v => mi(v, 0), 120));
      const paresG = () => G && Z.pares.length && G.barrasH(P, "Setor · EV/EBITDA de companhias abertas comparáveis", Z.pares.map(c => ({l:c.nome, v:c.evEb, txt:xx(c.evEb)})), v => xx(v));
      if (modo === "resumo"){ /* one-pager */
        P.page(); P.rect(0, 0, P.W, 118, NAVY); P.rect(0, 118, P.W, 4, ACC);
        P.text(P.M, 34, T(pre ? "OPORTUNIDADE DE INVESTIMENTO · ONE-PAGER" : "APRESENTAÇÃO CONFIDENCIAL (NDA) · RESUMO"), 9, true, [127,184,230]);
        P.text(P.M, 66, T(nome), 24, true, [255,255,255]); P.text(P.M, 86, T(Z.subtitulo).slice(0, 100), 10, false, [201,214,234]); P.text(P.M, 104, T(Z.transacao).slice(0, 100), 9.5, true, [242,193,78]); P.y = 136;
        par(P, Z.sumario, {size:9.5}); kpisPdf(P, Z.kpis.slice(0, 4)); evol();
        P.h2("Destaques e tese de investimento"); [...Z.destaques.slice(0, 3), ...Z.tese.slice(0, 3)].filter((x, i, a) => a.indexOf(x) === i).forEach(t => bl(t));
        P.h2("Próximos passos"); par(P, Z.passos.map((t, k) => `${k + 1}. ${t}`).join("   "), {size:8.5});
        P.ensure(50); P.y += 6; P.rect(P.M, P.y, P.CW, 40, [238,245,252]); P.text(P.M + 10, P.y + 16, "Kinsey Capital · assessoria exclusiva", 10, true, NAVY); P.text(P.M + 10, P.y + 31, T(CONTATO), 8.5, false, MUT); P.y += 48;
        if (pre) par(P, "Documento sem identificação da empresa. Não constitui oferta. Todo contato é feito pela Kinsey Capital.", {size:7.5, color:MUT});
        await rptSave(P.out(`One-pager · ${nome}`, T(`Kinsey Capital · ${pre ? "One-pager" : "Resumo pós-NDA"} · ${nome} · confidencial`)), arq(s, pre ? "one_pager" : "resumo_NDA", "pdf"), "application/pdf"); return; }
      /* capa */
      P.page(); P.rect(0, 0, P.W, P.H, NAVY); P.rect(0, P.H * .62, P.W, 4, ACC);
      P.text(P.M, 120, T(pre ? "OPORTUNIDADE DE INVESTIMENTO · TEASER" : "APRESENTAÇÃO DA EMPRESA · CONFIDENCIAL (NDA)"), 11, true, [127,184,230]);
      P.wrap(T(nome), 34, true, P.CW).forEach((l, k) => P.text(P.M, 175 + k * 40, l, 34, true, [255,255,255]));
      P.text(P.M, 250, T(Z.subtitulo).slice(0, 95), 13, false, [201,214,234]); P.text(P.M, 275, T(Z.transacao).slice(0, 95), 12, true, [242,193,78]);
      P.text(P.M, P.H * .62 + 40, T(new Date().toLocaleDateString("pt-BR", {month:"long", year:"numeric"})), 11, false, [201,214,234]);
      P.text(P.M, P.H - 90, "Kinsey Capital · assessoria exclusiva", 11, true, [255,255,255]); P.text(P.M, P.H - 72, T(CONTATO), 9, false, [127,184,230]);
      P.text(P.M, P.H - 50, T(pre ? "Documento sem identificação da empresa. Informações adicionais mediante NDA." : "Informações confidenciais, protegidas pelo NDA."), 8.5, false, [127,184,230]);
      /* conteúdo */
      P.page(); secT("Sumário executivo"); par(P, Z.sumario, {size:10.5}); P.y += 4; kpisPdf(P, Z.kpis.slice(0, 4));
      if (Z.destaques.length){ P.h2("Destaques"); Z.destaques.slice(0, 3).forEach(t => bl(t)); }
      secT("A companhia"); tab(P, ["Item", "Informação"], Z.companhia.map(([k, v]) => [k, v]), [.3, .7]); if (!pre && Z.descricao && Z.descricao !== Z.sumario.slice(0, Z.descricao.length)) par(P, Z.descricao, {size:9.5});
      if (Z.operacoes.length){ P.h2("Operações"); Z.operacoes.forEach(o => bl(o)); }
      if (Z.instit.length){ P.h2("Sobre a companhia (material institucional e site)"); Z.instit.forEach(o => bl(o)); }
      if (!pre && Z.site?.url) par(P, `Site: ${Z.site.url}${Z.site.descricao ? " · " + Z.site.descricao : ""}`, {size:9});
      if (!pre && Z.produtos.length){ P.h2("Produtos e serviços"); Z.produtos.forEach(o => bl(o)); }
      if (Z.linhas.length){ secT("Portfólio e linhas de negócio"); tab(P, pre ? ["Linha", "Participação"] : ["Linha", "Participação", "Descrição"], Z.linhas.map(l => pre ? [l.nome, l.pct || "-"] : [l.nome, l.pct || "-", l.desc || ""]), pre ? [.7, .3] : [.3, .15, .55]); }
      secT("Destaques financeiros", 330);
      evol();
      if (Z.serie.length) tab(P, ["", ...Z.serie.map(a => a.ano)], [["Receita líquida", ...Z.serie.map(a => mi(a.rl, pre ? 0 : 1))], ["EBITDA ajustado", ...Z.serie.map(a => mi(a.eb, pre ? 0 : 1))], ["Margem EBITDA", ...Z.serie.map(a => pc(a.mg ?? a.eb / (a.rl || 1), pre ? 0 : 1))]], [.4, ...Z.serie.map(() => .6 / Z.serie.length)]);
      Z.destaques.slice(3).forEach(d => bl(d));
      if (!pre){ /* pós-NDA: diligências, ajustes e jurídico */
        secT("Due diligence e ajustes", 220); Z.dd.forEach(d => bl(d));
        try{ const Rv = KT_VAL.resumo(s), Xv = Rv.X, AJ = Xv && !Xv.vazio ? D.ajustes(s, Xv.perBase).filter(D.okFin) : [];
          if (AJ.length){ P.h2("Ajustes da due diligence (validados pelos consultores)"); tab(P, ["Ajuste", "Área", "Efeito"], AJ.map(a => [a.titulo, D.areaNome(a.area), D.efeitoTxt(a)]), [.42, .16, .42]);
            const G = window.KT_GRAF; if (G){ const K = Xv.bp.K, A = D.soma(AJ); G.cascata(P, "Ponte do EBITDA", [{l:"EBITDA reportado", v:K.ebitda, tipo:"base"}, ...AJ.filter(a => Math.abs(D.soma([a]).ebitda) > 1).map(a => ({l:a.titulo, v:D.soma([a]).ebitda, tipo:"delta"})), {l:"EBITDA ajustado", v:K.ebitda + A.ebitda, tipo:"total"}], v => mi(v, 1)); } } }catch(e){}
        const EX = window.KT_EXP ? KT_EXP.lista(s) : []; if (EX.length){ const ate = +(String(s.perfil?.dataBase || new Date().toISOString()).slice(0, 4)), C = EX.map(e => ({e, c:KT_EXP.calc(e, ate)})), mil = v => v == null ? "NQ" : fmt(v / 1e3, 0);
          P.h2("Exposições fiscais, trabalhistas e previdenciárias (MR$)"); tab(P, ["Item", "Mínimo", "Máximo", "Avaliação"], C.map(({e, c}) => [e.titulo, mil(c.min), mil(c.max), {provavel:"Provável", possivel:"Possível", remota:"Remota"}[e.aval] || "NQ"]), [.58, .14, .14, .14]); }
        if (window.KT_JDD){ const cg = KT_JDD.contingencias(s), q = s.jdd?.q || {}, risco = KT_JDD.QS.filter(x => x.risco && q[x.id]?.v === x.risco), rec = KT_JDD.recomendacoes(s);
          if (cg.n || risco.length || rec.length){ secT("Diligência jurídica", 160);
            if (cg.n) par(P, `${cg.n} processo(s): provável ${mi(cg.provavel)}, possível ${mi(cg.possivel)}, remota ${mi(cg.remota)}.`, {size:9.5});
            if (risco.length){ P.h2("Pontos de atenção"); risco.slice(0, 8).forEach(x => bl(`${x.t}${q[x.id]?.n ? " · " + q[x.id].n : ""}`, {size:9})); }
            if (rec.length){ P.h2("Encaminhamento no contrato"); rec.slice(0, 6).forEach(x => bl(x, {size:9})); } } } }
      secT("Tese de investimento", 160); Z.tese.forEach(t => bl(t));
      secT("Setor e mercado", 200); Z.mercado.forEach(m => bl(m)); paresG();
      if (!pre && Z.noticias.length){ P.h2("Notícias do segmento"); Z.noticias.forEach(n2 => bl(`${n2.titulo} (${n2.fonte || ""} ${n2.data || ""})`, {size:9})); }
      if (!pre && Z.pesquisa){ P.h2("Pesquisa sobre a empresa, o setor e a região"); par(P, Z.pesquisa); }
      if (!pre && Z.materiais.length){ P.h2("Materiais do vendedor no data room"); Z.materiais.forEach(m => bl(m)); }
      secT("A transação e próximos passos", 300); par(P, Z.transacao.replace(/^Transação: /, "Transação proposta: ") + ".", {size:10});
      if (Z.valor) par(P, Z.valor, {size:10});
      Z.passos.forEach((t, k) => par(P, `${k + 1}. ${t}`, {size:9.5, gap:2}));
      P.ensure(60); P.y += 10; P.rect(P.M, P.y, P.CW, 42, [238,245,252]); P.text(P.M + 10, P.y + 17, "Kinsey Capital · assessoria exclusiva", 10, true, NAVY); P.text(P.M + 10, P.y + 32, T(CONTATO), 8.5, false, MUT); P.y += 52;
      par(P, pre ? "Este documento não constitui oferta. Não contate a empresa, seus sócios, funcionários, clientes ou fornecedores: todo contato é feito pela Kinsey Capital." : "Informações sujeitas ao acordo de confidencialidade. Projeções e estimativas não constituem garantia de resultados.", {size:8, color:MUT});
      await rptSave(P.out(`Teaser · ${nome}`, T(`Kinsey Capital · ${pre ? "Teaser" : "Apresentação pós-NDA"} · ${nome} · confidencial`)), arq(s, pre ? "teaser" : "apresentacao_NDA", "pdf"), "application/pdf");
    } else {
      const {slides, frame} = pptBase((fase === "pre" ? "Teaser · " : "Apresentação · ") + nome);
      slides.push({bg:"011F4B", sh:[{x:.8, y:1.0, w:11, h:.5, p:[{t:fase === "pre" ? "OPORTUNIDADE DE INVESTIMENTO" : "APRESENTAÇÃO CONFIDENCIAL · NDA", s:16, b:true, c:"7FB8E6"}]}, {x:.8, y:1.7, w:11.5, h:1.4, p:[{t:T(nome), s:44, b:true, c:"FFFFFF"}]}, {x:.8, y:3.2, w:11.5, h:.8, p:[{t:T(Z.subtitulo), s:18, c:"C9D6EA"}]}, {x:.8, y:4.1, w:11.5, h:.6, p:[{t:T(Z.transacao), s:16, b:true, c:"F2C14E"}]}, {x:.8, y:6.6, w:11.5, h:.4, p:[{t:T("Kinsey Capital · " + CONTATO), s:10, c:"7FB8E6"}]}]});
      let sh = frame("Números principais", Z.subtitulo); kpisPpt(sh, Z.kpis.slice(0, 4)); if (Z.serie.length) barrasPpt(sh, .8, 3.3, 7.5, 2.9, Z.serie.map(a => a.ano), [{n:"Receita líquida", v:Z.serie.map(a => a.rl), c:ACC}, {n:"EBITDA ajustado", v:Z.serie.map(a => a.eb), c:GOLD}], v => mi(v, 0));
      sh.push({x:8.8, y:3.2, w:4, h:3.4, f:"EEF5FC", round:true, pad:.2, p:[{t:"Linhas de negócio", s:13, b:true, c:"011F4B"}, ...Z.linhas.slice(0, 5).map(l => ({t:`• ${T(l.nome)}${l.pct ? " · " + l.pct : ""}`, s:12, c:"1B2433", sb:300}))]}); slides.push({sh});
      sh = frame("Sumário executivo"); sh.push({x:.6, y:1.5, w:7.4, h:5.3, p:[{t:T(Z.sumario), s:16, c:"1B2433", sb:600}]}, {x:8.4, y:1.5, w:4.3, h:5.3, f:"EEF5FC", round:true, pad:.2, p:[{t:"A companhia", s:14, b:true, c:"011F4B"}, ...Z.companhia.map(([k, v]) => ({t:`${T(k)}: ${T(v)}`, s:12, c:"1B2433", sb:300}))]}); slides.splice(1, 0, {sh});
      sh = frame("Destaques do negócio"); sh.push({x:.6, y:1.5, w:12.1, h:5.3, p:Z.destaques.slice(0, 8).map(d => ({t:"• " + T(d), s:16, c:"1B2433", sb:500}))}); slides.push({sh});
      sh = frame("Tese de investimento"); sh.push({x:.6, y:1.5, w:12.1, h:5.3, p:Z.tese.slice(0, 6).map(d => ({t:"• " + T(d), s:16, c:"1B2433", sb:500}))}); slides.push({sh});
      sh = frame("Mercado e setor"); sh.push({x:.6, y:1.5, w:12.1, h:5.3, p:[...Z.mercado.slice(0, 6).map(m => ({t:"• " + T(m), s:15, c:"1B2433", sb:400})), ...Z.noticias.slice(0, 4).map(n2 => ({t:"– " + T(n2.titulo), s:12, c:"5A6578", sb:300}))]}); slides.push({sh});
      if (fase === "pos"){ sh = frame("Due Diligence e materiais"); sh.push({x:.6, y:1.5, w:6, h:5.3, p:[{t:"Pontos principais", s:14, b:true, c:"011F4B"}, ...Z.dd.slice(0, 7).map(d => ({t:"• " + T(d), s:12, c:"1B2433", sb:300}))]}, {x:7, y:1.5, w:5.7, h:5.3, f:"EEF5FC", round:true, pad:.2, p:[{t:"Materiais do vendedor", s:14, b:true, c:"011F4B"}, ...Z.materiais.slice(0, 8).map(m => ({t:"• " + T(m), s:12, c:"1B2433", sb:300})), ...(Z.valor ? [{t:T(Z.valor), s:13, b:true, c:"B2791A", sb:600}] : [])]}); slides.push({sh}); }
      sh = frame("A transação e próximos passos"); sh.push({x:.6, y:1.5, w:12.1, h:5.3, p:[{t:T(Z.transacao), s:17, b:true, c:"011F4B", sb:500}, ...(Z.valor ? [{t:T(Z.valor), s:14, c:"B2791A", sb:500}] : []), ...Z.passos.map((t, k) => ({t:`${k + 1}. ${T(t)}`, s:15, c:"1B2433", sb:350}))]}); slides.push({sh});
      await rptSave(ktPptx(slides, `Teaser · ${nome}`), arq(s, fase === "pre" ? "teaser" : "apresentacao_NDA", "pptx"), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    }
  }

  window.KT_REL = {valuation, teaser, ddPdf, papeisPdf, papeis, ddPapeisView, ddPapeisBind, ddRelView, ddRelBind, editarTextos, capa, sec, par, tab, kpisPdf, barrasPdf, T, CONTATO, arq};
})();
