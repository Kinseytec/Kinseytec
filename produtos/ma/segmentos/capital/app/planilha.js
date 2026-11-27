/* ================= KINSEY CAPITAL · PLANILHAS (XLSX) =================
   Gera arquivos .xlsx sem bibliotecas externas: zip sem compressão, textos embutidos nas células e quatro estilos
   (título, cabeçalho, número com milhar e percentual). Usado para emitir a base dos cálculos (PPA, DD e valuation).
   Uso: KT_XLSX.gerar([{nome:"Aba", larguras:[30,14], linhas:[["Título"], ["Item", "Valor"], ["Receita", 1000]]}])
   Célula: texto, número ou {v, s:"t"|"h"|"n"|"p"|"b"}. */
(() => {
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files){ /* files: [[nome, Uint8Array]] → Uint8Array (store) */
    const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
    const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
    files.forEach(([n, d]) => { const nb = enc.encode(n), c = crc32(d);
      const lh = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0)]);
      parts.push(lh, nb, d);
      cen.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(nb.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), nb);
      off += lh.length + nb.length + d.length; });
    const cs = cen.reduce((a, x) => a + x.length, 0), end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cs), ...u32(off), ...u16(0)]);
    const all = [...parts, ...cen, end], out = new Uint8Array(all.reduce((a, x) => a + x.length, 0)); let p = 0; all.forEach(x => { out.set(x, p); p += x.length; }); return out;
  }
  const X = v => String(v).replace(/[<>&"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", '"':"&quot;"})[c]).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const colL = i => { let s = ""; i++; while (i){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const ST = {t:1, h:2, n:3, p:4, b:5, i:6, ip:7, fp:8, x:9, d:10, g:11, hh:12, hp:13, id:14, it:15, dt:16, gp:17, y:18, r:19, yt:20, rt:21, yp:22, rp:23, m:24, mg:25, im:26}; /* m, mg, im: R$ mi com 2 casas (fórmula, total, entrada) */ /* y = amarelo (revisar), r = vermelho (alto risco) */
  function aba(a){
    const rows = (a.linhas || []).map((r, ri) => `<row r="${ri + 1}">${(r || []).map((c, ci) => { if (c == null || c === "") return "";
        const o = typeof c === "object" ? c : {v:c}, ref = colL(ci) + (ri + 1);
        if (o.f != null){ const st = o.s ? ST[o.s] : 3; return `<c r="${ref}" s="${st}"><f>${X(String(o.f).replace(/^=/, ""))}</f>${typeof o.v === "number" && isFinite(o.v) ? `<v>${o.v}</v>` : ""}</c>`; }
        let s = o.s ? ST[o.s] : 0; if (typeof o.v === "number" && isFinite(o.v)){ if (!o.s) s = Math.abs(o.v) < 1 && o.v !== 0 && a.pct?.includes(ci) ? 4 : 3; return `<c r="${ref}" s="${s}"><v>${o.v}</v></c>`; }
        return `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${X(o.v)}</t></is></c>`; }).join("")}</row>`).join("");
    const cols = (a.larguras || []).length ? `<cols>${a.larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>` : "";
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"${a.zoom ? ` zoomScale="${a.zoom}"` : ""}>${a.congela ? `<pane xSplit="${a.congela[1] || 0}" ySplit="${a.congela[0] || 0}" topLeftCell="${colL(a.congela[1] || 0)}${(a.congela[0] || 0) + 1}" activePane="bottomRight" state="frozen"/>` : ""}</sheetView></sheetViews>${cols}<sheetData>${rows}</sheetData></worksheet>`;
  }
  function gerar(abas){
    const enc = new TextEncoder(), nomes = []; const nm = n => { let b = String(n).replace(/[\\\/\?\*\[\]:]/g, " ").slice(0, 31) || "Aba", k = b, i = 2; while (nomes.includes(k)) k = b.slice(0, 28) + " " + i++; nomes.push(k); return k; };
    abas.forEach(a => a._n = nm(a.nome));
    const F = [["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${abas.map((a, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${abas.map((a, i) => `<sheet name="${X(a._n)}" sheetId="${i + 1}"${a.oculta ? ' state="hidden"' : ""} r:id="rId${i + 1}"/>`).join("")}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],
      ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas.map((a, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
      ["xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="7"><numFmt numFmtId="164" formatCode="#,##0;[Red]-#,##0"/><numFmt numFmtId="165" formatCode="0.00&quot;x&quot;"/><numFmt numFmtId="166" formatCode="0.0000"/><numFmt numFmtId="167" formatCode="0.0%"/><numFmt numFmtId="168" formatCode="dd/mm/yyyy"/><numFmt numFmtId="169" formatCode="0.00%"/><numFmt numFmtId="170" formatCode="#,##0.00;[Red]-#,##0.00"/></numFmts>`
        + `<fonts count="5"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="13"/><color rgb="FF011F4B"/><name val="Arial"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><b/><sz val="10"/><name val="Arial"/></font><font><sz val="10"/><color rgb="FF0473C3"/><name val="Arial"/></font></fonts>`
        + `<fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF011F4B"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE6E8EC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF7F7F7F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0473C3"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF8CBAD"/><bgColor indexed="64"/></patternFill></fill></fills>`
        + `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="27">`
        + [[0,0,0],[0,1,0],[0,2,2],[164,0,0],[10,0,0],[164,3,0],[164,4,3],[169,4,3],[167,0,0],[165,0,0],[166,0,0],[164,3,3],[0,2,4],[0,2,5],[166,4,3],[0,4,3],[168,0,0],[167,3,3],[164,0,6],[164,0,7],[0,0,6],[0,0,7],[167,0,6],[167,0,7],[170,0,0],[170,3,3],[170,4,3]].map(([n, f, l]) => `<xf numFmtId="${n}" fontId="${f}" fillId="${l}" borderId="0" xfId="0"${n ? ' applyNumberFormat="1"' : ""}${f ? ' applyFont="1"' : ""}${l ? ' applyFill="1"' : ""}/>`).join("")
        + `</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],

      ...abas.map((a, i) => [`xl/worksheets/sheet${i + 1}.xml`, aba(a)])];
    return zip(F.map(([n, t]) => [n, enc.encode(t)]));
  }
  window.KT_XLSX = {gerar, zip, crc32};
})();
