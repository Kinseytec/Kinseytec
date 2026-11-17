/* ================= MARCA KINSEY BR NOS RELATÓRIOS (branding book Kinsey BR) =================
   Cores oficiais: Navy #011F4B, Acent #0473C3, Fog #E6E8EC, White #FFFFFF e Gray #7F7F7F.
   Navy nas capas, títulos e cabeçalhos de tabela; Acent nos destaques, numeração de seções, filetes e demonstrações
   projetadas; Fog nos fundos claros (indicadores e linhas alternadas); Gray nas demonstrações históricas.
   Logotipo oficial: versão branca sobre o navy das capas e versão navy, pequena, no topo das páginas internas.
   Tipografia: o PDF usa Helvetica, equivalente métrica da Arial (fonte secundária da marca, para textos longos). Os
   gráficos mantêm as cores vivas da paleta. */
(() => {
  /* Marca por cliente: o logotipo e o nome Kinsey só saem quando a empresa contratante cadastrada é da Kinsey
     (Kinsey Capital, Kinsey Allen, Kinsey BR). Para outro cliente (sistema licenciado), os relatórios mantêm as cores
     e trazem o nome do cliente no lugar de "Kinsey", sem o logotipo e sem nomes de pessoas da Kinsey. */
  const cliente = () => { try{ return (S.config?.cliente?.nome || window.KT_CLIENTE_PADRAO?.nome || "").trim(); }catch(e){ return ""; } };
  const ehKinsey = () => { const c = cliente(); return !c || /kinsey/i.test(c); };
  const curto = () => cliente().replace(/\s*[·|-].*$/, "").replace(/\b(ltda|s\.?\/?a\.?|eireli|me|epp)\.?$/i, "").trim() || "Assessoria";
  const PESSOAS = /\b(Newton K\.? (dos )?A(njos)? ?\.? ?Oliveira|Newton|Samuel Lima|Samuel|Paulo Penha( Leite)?|M[oô]nica Flissak|M[oô]nica)\b/g;
  const txt = s => { if (typeof s !== "string" || ehKinsey()) return s;
    return s.replace(/KINSEY ALLEN BRASIL CONSULTORIA ESPECIALIZADA E M&A LTDA\.?|KINSEY CAPITAL BRASIL CONSULTORIA E M&A LTDA\.?/g, curto().toUpperCase())
      .replace(/Kinsey Capital|Kinsey BR|Kinsey Allen|KinseyTec/g, curto()).replace(/KINSEY BR|KINSEY CAPITAL|KINSEY/g, curto().toUpperCase()).replace(/Kinsey/g, curto()).replace(PESSOAS, "[responsável]"); };
  window.KT_MARCA = {cliente, kinsey:ehKinsey, txt, curto};
  const k = c => Array.isArray(c) ? c.join(",") : "";
  /* tons antigos do sistema → cores oficiais */
  const FILL = {"238,245,252":[230,232,236], "234,241,250":[230,232,236], "127,184,230":[4,115,195], "0,112,192":[4,115,195], "89,89,89":[127,127,127]};
  const TEXTO = {"127,184,230":[230,232,236], "0,112,192":[4,115,195]};
  const cache = {};
  window.KT_LOGOIMG = tipo => { if (!ehKinsey()) return null; if (cache[tipo]) return cache[tipo]; const L = window.KT_LOGO?.[tipo]; if (!L) return null; try{ cache[tipo] = {data:atob(L.b64), w:L.w, h:L.h}; }catch(e){ return null; } return cache[tipo]; };
  if (typeof KTPdf === "function"){ const _K = KTPdf; KTPdf = function(){ const P = _K.apply(this, arguments), r = P.rect, t = P.text, l = P.line, pg = P.page;
    P.rect = (x, y, w, h, c, ...a) => r(x, y, w, h, FILL[k(c)] || c, ...a);
    P.text = (x, y, s, sz, b, c, ...a) => t(x, y, txt(s), sz, b, c === undefined ? c : (TEXTO[k(c)] || c), ...a);
    P.line = (x1, y1, x2, y2, c, ...a) => l(x1, y1, x2, y2, c === undefined ? c : (FILL[k(c)] || c), ...a);
    /* logotipo navy no topo de cada página (as capas cobrem com o fundo navy e recebem o logotipo branco) */
    P.page = function(){ const o = pg.apply(this, arguments), im = KT_LOGOIMG("navy"); if (im && P.image){ const h = 15, w = h * im.w / im.h; P.image(P.W - P.M - w, 18, w, h, im); } return o; };
    P.logoCapa = (x, y, w) => { const im = KT_LOGOIMG("branco"); if (!im || !P.image) return false; P.image(x, y, w, w * im.h / im.w, im); return true; };
    return P; }; }
  const HEX = {"EEF5FC":"E6E8EC", "7FB8E6":"E6E8EC", "0070C0":"0473C3"};
  if (typeof ktPptx === "function"){ const _P = ktPptx; ktPptx = function(slides, title){
    (slides || []).forEach(sl => { (sl.sh || []).forEach(o => { if (o.f && HEX[String(o.f).toUpperCase()]) o.f = HEX[String(o.f).toUpperCase()];
        (o.p || []).forEach(q => { (Array.isArray(q.r) ? q.r : [q]).forEach(r => { if (r && r.c && HEX[String(r.c).toUpperCase()]) r.c = HEX[String(r.c).toUpperCase()]; }); }); }); });
    return _P.apply(this, arguments); }; }
  /* planilhas: o mesmo critério de marca nos textos */
  if (window.KT_XLSX?.gerar){ const _g = KT_XLSX.gerar; KT_XLSX.gerar = abas => ehKinsey() ? _g(abas) : _g(JSON.parse(JSON.stringify(abas), (key, v) => typeof v === "string" ? txt(v) : v)); }
})();
