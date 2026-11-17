/* ================= KINSEY CAPITAL · WORD (.DOCX) =================
   Gera documentos Word editáveis: texto corrido, títulos, campos a completar em amarelo, controle de alterações
   (inclusões e exclusões marcadas, que o advogado aceita ou rejeita no Word) e comentários nas margens.
   Também compara duas versões (parágrafos e palavras) para montar a versão com controle de alterações. */
(() => {
  const xe = t => String(window.KT_MARCA ? KT_MARCA.txt(String(t)) : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const AUT = "KinseyTec · análise pró-vendedor", agora = () => new Date().toISOString().slice(0, 19) + "Z";
  let RID = 1;
  /* um trecho de texto: k = keep | ins | del; campos [entre colchetes] saem em amarelo */
  function runs(seg, o = {}){
    const rpr = x => `<w:rPr>${x.b || o.b ? "<w:b/>" : ""}${x.i || o.i ? "<w:i/>" : ""}${x.hl ? `<w:highlight w:val="${x.hl}"/>` : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ""}</w:rPr>`;
    return String(seg.t).split(/(\[[^\]]+\])/).filter(Boolean).map(p => { const x = {...seg, hl:seg.hl || (/^\[.*\]$/.test(p) ? "yellow" : "")};
      if (seg.k === "del") return `<w:del w:id="${RID++}" w:author="${xe(o.autor || AUT)}" w:date="${o.data || agora()}"><w:r>${rpr(x)}<w:delText xml:space="preserve">${xe(p)}</w:delText></w:r></w:del>`;
      const r = `<w:r>${rpr(x)}<w:t xml:space="preserve">${xe(p)}</w:t></w:r>`;
      return seg.k === "ins" ? `<w:ins w:id="${RID++}" w:author="${xe(o.autor || AUT)}" w:date="${o.data || agora()}">${r}</w:ins>` : r; }).join("");
  }
  /* parágrafo: {runs:[{t,k,b,hl}] | t, jc, b, i, ind, brk, keep, before, after, sz, color, comment, insPara, delPara} */
  function par(p, ctx){
    const segs = p.runs || [{t:p.t ?? "", k:"keep"}], o = {...p};
    const mark = p.insPara ? `<w:rPr><w:ins w:id="${RID++}" w:author="${xe(ctx.autor || AUT)}" w:date="${ctx.data}"/></w:rPr>` : p.delPara ? `<w:rPr><w:del w:id="${RID++}" w:author="${xe(ctx.autor || AUT)}" w:date="${ctx.data}"/></w:rPr>` : "";
    const ppr = `<w:pPr>${p.brk ? "<w:pageBreakBefore/>" : ""}${p.keep ? "<w:keepNext/>" : ""}<w:spacing w:before="${p.before || 0}" w:after="${p.after ?? 120}" w:line="276" w:lineRule="auto"/>${p.ind ? `<w:ind w:left="${p.ind}"/>` : ""}<w:jc w:val="${p.jc || "both"}"/>${mark}</w:pPr>`;
    let body = segs.map(s => runs(s, {...o, autor:ctx.autor, data:ctx.data})).join("");
    if (p.comment){ const id = ctx.com.length; ctx.com.push({id, t:p.comment, autor:p.comAutor || ctx.autor || AUT});
      body = `<w:commentRangeStart w:id="${id}"/>${body}<w:commentRangeEnd w:id="${id}"/><w:r><w:commentReference w:id="${id}"/></w:r>`; }
    return `<w:p>${ppr}${body}</w:p>`;
  }
  function build(paras, opt = {}){
    const ctx = {com:[], autor:opt.autor || AUT, data:agora()}; RID = 1;
    const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
    const body = paras.map(p => par(p, ctx)).join("");
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body}<w:sectPr>${opt.header ? '<w:headerReference w:type="default" r:id="rId1"/>' : ""}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const hdr = opt.header ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${par({t:opt.header, jc:"right", sz:16, color:opt.headerColor || "B0302B", after:0}, ctx)}</w:hdr>` : "";
    const com = ctx.com.length ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments ${NS}>${ctx.com.map(c => `<w:comment w:id="${c.id}" w:author="${xe(c.autor)}" w:date="${ctx.data}" w:initials="KT">${String(c.t).split("\n").map(l => `<w:p><w:r><w:t xml:space="preserve">${xe(l)}</w:t></w:r></w:p>`).join("")}</w:comment>`).join("")}</w:comments>` : "";
    const sty = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
    const set = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${opt.track ? "<w:trackRevisions/>" : ""}<w:defaultTabStop w:val="708"/></w:settings>`;
    const T = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";
    const rels = [opt.header ? `<Relationship Id="rId1" Type="${T}header" Target="header1.xml"/>` : "", `<Relationship Id="rId2" Type="${T}styles" Target="styles.xml"/>`, `<Relationship Id="rId3" Type="${T}settings" Target="settings.xml"/>`, com ? `<Relationship Id="rId4" Type="${T}comments" Target="comments.xml"/>` : ""].join("");
    const ov = (p, t) => `<Override PartName="${p}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${t}+xml"/>`;
    const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${ov("/word/document.xml", "document.main")}${ov("/word/styles.xml", "styles")}${ov("/word/settings.xml", "settings")}${opt.header ? ov("/word/header1.xml", "header") : ""}${com ? ov("/word/comments.xml", "comments") : ""}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(opt.titulo || "Documento")}</dc:title><dc:creator>Kinsey BR</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${ctx.data}</dcterms:created></cp:coreProperties>`;
    const en = new TextEncoder(), F = [["[Content_Types].xml", ct], ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${T}officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`],
      ["word/document.xml", doc], ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`], ["word/styles.xml", sty], ["word/settings.xml", set], ["docProps/core.xml", core]];
    if (hdr) F.push(["word/header1.xml", hdr]); if (com) F.push(["word/comments.xml", com]);
    return KT_XLSX.zip(F.map(([n, t]) => [n, en.encode(t)]));
  }
  /* título de cláusula: "CLÁUSULA 3", "3. Preço", "ANEXO I", linhas curtas em maiúsculas */
  const ehTitulo = t => { t = String(t).trim(); return t.length < 110 && (/^(cl[aá]usula|cap[ií]tulo|anexo|se[cç][aã]o)\b/i.test(t) || /^\d{1,2}(\.\d{1,2})?\.?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.;]{2,80}$/.test(t) || (t.length > 3 && t === t.toUpperCase() && /[A-Z]/.test(t))); };
  const deTexto = (L, o = {}) => L.map((t, i) => ({t, b:ehTitulo(t), keep:ehTitulo(t), jc:i === 0 && o.titulo ? "center" : "both", before:ehTitulo(t) && i ? 160 : 0}));
  /* ---------- comparação de versões ---------- */
  function lcs(A, B, eq = (a, b) => a === b){
    const n = A.length, m = B.length, D = Array.from({length:n + 1}, () => new Uint32Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) D[i][j] = eq(A[i], B[j]) ? D[i + 1][j + 1] + 1 : Math.max(D[i + 1][j], D[i][j + 1]);
    const ops = []; let i = 0, j = 0;
    while (i < n && j < m){ if (eq(A[i], B[j])){ ops.push(["=", A[i], B[j]]); i++; j++; } else if (D[i + 1][j] >= D[i][j + 1]) ops.push(["-", A[i++]]); else ops.push(["+", null, B[j++]]); }
    while (i < n) ops.push(["-", A[i++]]); while (j < m) ops.push(["+", null, B[j++]]); return ops;
  }
  const norm = t => String(t).replace(/\s+/g, " ").trim();
  function difPalavras(a, b){
    const A = norm(a).split(/(\s+)/), B = norm(b).split(/(\s+)/);
    if (A.length * B.length > 4e6) return [{t:a, k:"del"}, {t:b, k:"ins"}];
    const R = []; lcs(A, B).forEach(([op, x, y]) => { const k = op === "=" ? "keep" : op === "-" ? "del" : "ins", t = op === "+" ? y : x, u = R[R.length - 1]; if (u && u.k === k) u.t += t; else R.push({t, k}); });
    return R;
  }
  /* frase a frase: frases iguais ficam, frases trocadas saem inteiras (excluída + incluída), frases parecidas por palavra */
  const FR = t => norm(t).split(/(?<=[.;:])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ(“"0-9])/);
  function difFrases(a, b){
    const R = [], push = (t, k) => { const u = R[R.length - 1]; if (u && u.k === k) u.t += t; else R.push({t, k}); };
    const ops = lcs(FR(a), FR(b)); let buf = [];
    const flush = () => { const d = buf.filter(o => o[0] === "-"), s = buf.filter(o => o[0] === "+");
      for (let k = 0; k < Math.max(d.length, s.length); k++){ const x = d[k]?.[1], y = s[k]?.[2];
        if (x && y){ const w = difPalavras(x, y), keep = w.filter(z => z.k === "keep").reduce((q, z) => q + z.t.length, 0);
          if (keep > Math.max(x.length, y.length) * .6) w.forEach(z => push(z.t + "", z.k)); else { push(x, "del"); push(" ", "keep"); push(y, "ins"); } }
        else if (x) push(x, "del"); else push(y, "ins");
        push(" ", "keep"); }
      buf = []; };
    for (const o of ops){ if (o[0] === "="){ flush(); push(o[1] + " ", "keep"); } else buf.push(o); }
    flush(); const u = R[R.length - 1]; if (u && u.k === "keep") u.t = u.t.replace(/\s+$/, ""); return R.filter(z => z.t);
  }
  /* A e B: listas de parágrafos (texto). notas: Map(índice em B → comentário). Devolve parágrafos com controle de alterações. */
  function comparar(A, B, notas = new Map()){
    const ops = lcs(A.map(norm), B.map(norm)), out = []; let jb = 0, buf = [];
    const flush = () => { const del = buf.filter(o => o[0] === "-"), ins = buf.filter(o => o[0] === "+"), n = Math.max(del.length, ins.length);
      for (let k = 0; k < n; k++){ const d = del[k], s = ins[k];
        if (d && s){ const sim = difFrases(d[1], s[2]), keep = sim.filter(x => x.k === "keep").reduce((a, x) => a + x.t.length, 0);
          out.push(keep > Math.min(d[1].length, s[2].length) * .2 ? {runs:sim, comment:notas.get(s.jb), b:ehTitulo(s[2])} : null);
          if (!out[out.length - 1]){ out.pop(); out.push({runs:[{t:d[1], k:"del"}], delPara:true}); out.push({runs:[{t:s[2], k:"ins"}], insPara:true, comment:notas.get(s.jb)}); } }
        else if (d) out.push({runs:[{t:d[1], k:"del"}], delPara:true});
        else out.push({runs:[{t:s[2], k:"ins"}], insPara:true, comment:notas.get(s.jb), b:ehTitulo(s[2])}); }
      buf = []; };
    for (const o of ops){ if (o[0] === "="){ flush(); out.push({t:o[2], b:ehTitulo(o[2]), comment:notas.get(jb)}); jb++; } else { if (o[0] === "+"){ o.jb = jb++; } buf.push(o); } }
    flush(); return out;
  }
  /* PDF: junta as linhas quebradas em parágrafos */
  function paragrafosPDF(linhas){
    const P = []; let cur = "";
    for (const l0 of linhas){ const l = String(l0).trim(); if (!l){ if (cur) P.push(cur); cur = ""; continue; }
      if (/^\d+\s*$/.test(l) || /^p[aá]gina \d+/i.test(l)) continue;
      const novo = ehTitulo(l) || /^(\d{1,2}(\.\d{1,2})*\.?|\([a-z]\)|[a-z]\)|[ivx]+\))\s/i.test(l);
      if (cur && (novo || /[.;:]$/.test(cur))){ P.push(cur); cur = l; } else cur = cur ? cur + " " + l : l; }
    if (cur) P.push(cur); return P;
  }
  window.KT_DOCX = {build, par, deTexto, comparar, difPalavras, difFrases, paragrafosPDF, ehTitulo};
})();
