/* ================= CORES DA MARCA KINSEY BR NOS RELATÓRIOS =================
   Os relatórios em PDF e PowerPoint usam o azul Kinsey BR dos modelos oficiais (relatório de due diligence e laudo de
   avaliação): azul #0070C0 nas capas, faixas, títulos de seção e cabeçalhos de tabela; azul escuro #085090 nos títulos
   e valores; azul claro #DDEBF7 nos destaques e linhas alternadas; ciano #00B0F0 nos filetes. Os gráficos mantêm as
   cores vivas da paleta. */
(() => {
  const k = c => Array.isArray(c) ? c.join(",") : "";
  const FILL = {"1,31,75":[0,112,192], "4,115,195":[0,112,192], "238,245,252":[221,235,247], "127,184,230":[0,176,240]};
  const TEXTO = {"1,31,75":[8,80,144], "4,115,195":[0,112,192], "127,184,230":[192,224,248]};
  if (typeof KTPdf === "function"){ const _K = KTPdf; KTPdf = function(){ const P = _K.apply(this, arguments), r = P.rect, t = P.text, l = P.line;
    P.rect = (x, y, w, h, c, ...a) => r(x, y, w, h, FILL[k(c)] || c, ...a);
    P.text = (x, y, s, sz, b, c, ...a) => t(x, y, s, sz, b, c === undefined ? c : (TEXTO[k(c)] || c), ...a);
    P.line = (x1, y1, x2, y2, c, ...a) => l(x1, y1, x2, y2, c === undefined ? c : (FILL[k(c)] || c), ...a);
    return P; }; }
  const HEX = {"011F4B":"0070C0", "0473C3":"0070C0", "7FB8E6":"C0E0F8", "EEF5FC":"DDEBF7"}, HEXT = {"011F4B":"085090", "0473C3":"0070C0", "7FB8E6":"C0E0F8"};
  if (typeof ktPptx === "function"){ const _P = ktPptx; ktPptx = function(slides, title){
    (slides || []).forEach(sl => { if (HEX[String(sl.bg || "").toUpperCase()]) sl.bg = HEX[sl.bg.toUpperCase()];
      (sl.sh || []).forEach(o => { if (o.f && HEX[String(o.f).toUpperCase()]) o.f = HEX[String(o.f).toUpperCase()];
        (o.p || []).forEach(q => { (Array.isArray(q.r) ? q.r : [q]).forEach(r => { if (r && r.c && HEXT[String(r.c).toUpperCase()]) r.c = HEXT[String(r.c).toUpperCase()]; }); }); }); });
    return _P.apply(this, arguments); }; }
})();
