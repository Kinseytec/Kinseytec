/* ================= KINSEY CAPITAL · GRÁFICOS DOS RELATÓRIOS E MODO DE EMISSÃO =================
   Gráficos vetoriais para os PDFs (sem bibliotecas): rosca com legenda, cascata (ponte de EBITDA, de EV a equity),
   barras horizontais com marcador, colunas com linha de margem e mapa de calor para sensibilidade. Todos os valores
   ficam escritos no gráfico. Modo de emissão: "Resumo para apresentação" (poucas páginas, gráficos e conclusões) ou
   "Relatório completo" (todas as seções, tabelas e anexos), escolhido ao emitir em qualquer área. */
(() => {
  const NAVY = [1,31,75], ACC = [4,115,195], GOLD = [178,121,26], VERDE = [46,150,105], VERM = [198,40,40], CINZA = [120,131,148], CLARO = [238,245,252], LINHA = [213,220,230];
  const PAL = [ACC, GOLD, VERDE, [127,184,230], [110,84,170], [230,140,60], CINZA, VERM, [60,170,190]];
  const T = s => window.KT_REL ? KT_REL.T(String(s ?? "")) : String(s ?? "");
  const larg = (s, sz) => String(s).length * sz * .5;
  const titulo = (P, t, h) => { P.ensure(h + 24); P.text(P.M, P.y + 11, T(t), 10.5, true, NAVY); P.y += 18; };
  const curto = (s, n) => { s = T(s); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

  /* rosca com legenda: itens [{l, v, c?}] */
  function rosca(P, tit, itens, fmtv, centro){
    const I = itens.filter(i => i.v > 0), tot = I.reduce((a, i) => a + i.v, 0); if (!tot) return; const h = Math.max(150, I.length * 18 + 20);
    titulo(P, tit, h); const cx = P.M + 75, cy = P.y + 72, r = 64; let a = 0;
    I.forEach((it, k) => { const a1 = a + it.v / tot * Math.PI * 2; P.pie(cx, cy, r, a, a1, it.c || PAL[k % PAL.length], 38); a = a1; });
    if (centro){ P.text(cx - larg(T(centro[0]), 11) / 2, cy + 2, T(centro[0]), 11, true, NAVY); P.text(cx - larg(T(centro[1]), 7.5) / 2, cy + 13, T(centro[1]), 7.5, false, CINZA); }
    let y = P.y + 6; I.forEach((it, k) => { const x = P.M + 170; P.rect(x, y + 2, 9, 9, it.c || PAL[k % PAL.length]); P.text(x + 15, y + 10, curto(it.l, 52), 8.5, false, [27,36,51]);
      const vv = `${fmtv(it.v)} · ${Math.round(it.v / tot * 100)}%`; P.text(P.M + P.CW - larg(vv, 8.5), y + 10, vv, 8.5, true, NAVY); y += 18; });
    P.y += h + 6;
  }
  /* cascata: passos [{l, v, tipo:"base"|"delta"|"total"}] */
  function cascata(P, tit, passos, fmtv){
    const h = 190; titulo(P, tit, h); const x0 = P.M + 10, w = P.CW - 20, n = passos.length, gw = w / n, bw = Math.min(56, gw * .62), top = P.y + 16, base = top + 130;
    let acc = 0; const pts = passos.map(p => { if (p.tipo === "delta"){ const a = acc; acc += p.v; return {p, a, b:acc}; } acc = p.v; return {p, a:0, b:p.v}; });
    const vals = pts.flatMap(q => [q.a, q.b, 0]), mx = Math.max(...vals), mn = Math.min(...vals), esc = v => base - (v - mn) / ((mx - mn) || 1) * 120;
    P.line(x0, esc(0), x0 + w, esc(0), LINHA, .8);
    pts.forEach((q, k) => { const x = x0 + k * gw + (gw - bw) / 2, y1 = esc(Math.max(q.a, q.b)), y2 = esc(Math.min(q.a, q.b)), c = q.p.tipo === "delta" ? (q.p.v >= 0 ? VERDE : VERM) : q.p.tipo === "total" ? NAVY : ACC;
      P.rect(x, y1, bw, Math.max(1.5, y2 - y1), c); const vt = (q.p.tipo === "delta" && q.p.v > 0 ? "+" : "") + fmtv(q.p.v); P.text(x + bw / 2 - larg(vt, 7.5) / 2, y1 - 4, vt, 7.5, true, c);
      if (k < n - 1){ const nx = x0 + (k + 1) * gw + (gw - bw) / 2; P.line(x + bw, esc(q.b), nx, esc(q.b), CINZA, .4); }
      const L = P.wrap(T(q.p.l), 7, false, gw - 4).slice(0, 3); L.forEach((l, i) => P.text(x0 + k * gw + gw / 2 - larg(l, 7) / 2, base + 14 + i * 8.5, l, 7, false, [27,36,51])); });
    P.y += h + 8;
  }
  /* barras horizontais: itens [{l, v, c?, txt?}], marca {v, l} opcional */
  function barrasH(P, tit, itens, fmtv, marca){
    const I = itens.filter(i => i.v != null && isFinite(i.v)); if (!I.length) return; const h = I.length * 17 + 18; titulo(P, tit, h);
    const lx = P.M + 150, w = P.CW - 150 - 80, mx = Math.max(...I.map(i => Math.abs(i.v)), marca?.v || 0) || 1;
    I.forEach((it, k) => { const y = P.y + k * 17; P.text(P.M, y + 10, curto(it.l, 34), 8, false, [27,36,51]); P.rect(lx, y + 2, w, 11, CLARO); P.rect(lx, y + 2, Math.max(1.5, Math.abs(it.v) / mx * w), 11, it.c || ACC);
      P.text(lx + w + 6, y + 11, T(it.txt || fmtv(it.v)), 8, true, NAVY); });
    if (marca){ const x = lx + marca.v / mx * w; P.line(x, P.y - 2, x, P.y + I.length * 17, VERM, 1.2); P.text(Math.min(x + 3, lx + w - 60), P.y + I.length * 17 + 9, T(marca.l), 7.5, true, VERM); }
    P.y += h + (marca ? 10 : 4);
  }
  /* colunas agrupadas com linha percentual opcional */
  function colunas(P, tit, cats, series, fmtv, linha){
    const h = 200; titulo(P, tit, h); const x0 = P.M + 8, w = P.CW - 16, top = P.y + 14, base = top + 135, n = cats.length, gw = w / n, sw = Math.min(30, gw * .7 / series.length);
    const mx = Math.max(...series.flatMap(s => s.v.map(v => Math.abs(v || 0))), 1); P.line(x0, base, x0 + w, base, LINHA, .8);
    cats.forEach((c, k) => { const gx = x0 + k * gw + (gw - sw * series.length) / 2;
      series.forEach((s, j) => { const v = s.v[k] || 0, hh = Math.abs(v) / mx * (linha ? 82 : 120), x = gx + j * sw; P.rect(x + 1, base - hh, sw - 2, hh, s.c); const t = fmtv(v); P.text(x + sw / 2 - larg(t, 6.8) / 2, base - hh - 3, t, 6.8, true, s.c); });
      P.text(x0 + k * gw + gw / 2 - larg(c, 8) / 2, base + 11, T(c), 8, true, [27,36,51]); });
    if (linha){ const m2 = Math.max(...linha.v.map(v => v || 0), .01), py = v => top + 4 + (1 - (v || 0) / m2) * 28; let prev = null;
      linha.v.forEach((v, k) => { const x = x0 + k * gw + gw / 2, y = py(v); if (prev) P.line(prev[0], prev[1], x, y, GOLD, 1.4); P.rect(x - 2.5, y - 2.5, 5, 5, GOLD); const t = (v * 100).toFixed(1).replace(".", ",") + "%"; P.text(x + 5, y - 3, t, 7, true, GOLD); prev = [x, y]; }); }
    let lx = x0; [...series, ...(linha ? [{n:linha.n, c:GOLD}] : [])].forEach(s => { P.rect(lx, base + 20, 8, 8, s.c); P.text(lx + 12, base + 27, T(s.n), 7.5, false, CINZA); lx += larg(T(s.n), 7.5) + 30; });
    P.y += h + 6;
  }
  /* mapa de calor: linhas [rot, ...valores], cores do menor (vermelho claro) ao maior (verde claro) */
  function calor(P, tit, cols, linhas, fmtv){
    const vals = linhas.flatMap(l => l.slice(1)).filter(v => isFinite(v)), mn = Math.min(...vals), mx = Math.max(...vals), cor = v => { const t = (v - mn) / ((mx - mn) || 1); return [Math.round(250 - t * 60), Math.round(215 + t * 25), Math.round(210 - t * 10)]; };
    titulo(P, tit, linhas.length * 20 + 30); KT_REL.tab(P, cols, linhas.map(l => [l[0], ...l.slice(1).map(v => ({t:fmtv(v), bg:cor(v), b:true}))]), [.28, ...cols.slice(1).map(() => .72 / (cols.length - 1))]);
  }
  /* escolha do modo de emissão */
  function modo(tituloRel, gerar, extra){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Emitir relatório</div><h2>${esc(tituloRel)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><button type="button" class="btn primary" data-md="resumo" style="text-align:left;padding:12px 14px"><b>Resumo para apresentação</b><br><span style="font-weight:400;font-size:12px">poucas páginas, gráficos, números principais e conclusões</span></button>
      <button type="button" class="btn" data-md="completo" style="text-align:left;padding:12px 14px"><b>Relatório completo</b><br><span style="font-weight:400;font-size:12px">todas as seções, tabelas, metodologia, anexos e gráficos</span></button>${extra || ""}</div>`);
    $$("[data-md]").forEach(b => b.onclick = () => { close(); toast("Gerando o relatório…"); Promise.resolve(gerar(b.dataset.md)).catch(e => { console.error(e); toast("Não foi possível gerar o relatório."); }); });
  }
  window.KT_GRAF = {rosca, cascata, barrasH, colunas, calor, modo, PAL, NAVY, ACC, GOLD, VERDE, VERM, CINZA};
})();
