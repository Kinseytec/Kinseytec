/* ================= IMPORTAÇÃO DE FORNECEDORES (N1, N2, N3) =================
   Formatos: Excel (.xlsx), LibreOffice (.ods), CSV/TXT, Word (.docx), PDF com texto e colar da planilha.
   Tudo é lido no próprio navegador; nada é enviado a serviços externos. */
const IMP = (() => {
  /* ---------- zip (xlsx, docx, ods) ---------- */
  const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
  /* descompressão tolerante: aproveita o que foi lido mesmo com bytes sobrando no fim (comum em PDF) */
  async function inflate(data, fmt){
    /* zlib ("deflate"): lê o conteúdo sem o cabeçalho de 2 bytes, com janela completa. Alguns geradores de PDF declaram
       janela menor do que a usada, e o leitor estrito cortava o texto da página */
    if (fmt === "deflate" && data.length > 2){ fmt = "deflate-raw"; data = data.subarray(2); }
    if (typeof __ktInflate === "function") return __ktInflate(data, fmt);   /* no servidor (função agendada) usa o zlib do Node */
    /* escrita e leitura em paralelo até o fim; se houver bytes sobrando no fim (comum em PDF), aproveita o que já foi lido */
    const ds = new DecompressionStream(fmt), w = ds.writable.getWriter(), r = ds.readable.getReader(), out = []; let len = 0;
    const esc = (async () => { try{ await w.write(data); await w.close(); }catch(e){} })();
    try{ for (;;){ const {value, done} = await r.read(); if (done) break; out.push(value); len += value.length; } }catch(e){ if (!len) throw e; }
    await esc.catch(() => {});
    const u = new Uint8Array(len); let o = 0; out.forEach(c => { u.set(c, o); o += c.length; }); return u; }
  async function unzip(buf){
    const b = new Uint8Array(buf); let e = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 66000); i--) if (u32(b, i) === 0x06054b50){ e = i; break; }
    if (e < 0) throw new Error("zip");
    const n = u16(b, e + 10); let p = u32(b, e + 16); const out = {};
    for (let k = 0; k < n; k++){
      const met = u16(b, p + 10), cs = u32(b, p + 20), nl = u16(b, p + 28), xl = u16(b, p + 30), cl = u16(b, p + 32), lo = u32(b, p + 42);
      const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nl));
      const ds = lo + 30 + u16(b, lo + 26) + u16(b, lo + 28), raw = b.subarray(ds, ds + cs);
      out[name] = {get: async () => new TextDecoder().decode(met === 0 ? raw : await inflate(raw, "deflate-raw")), bytes: async () => met === 0 ? raw.slice() : await inflate(raw, "deflate-raw")};
      p += 46 + nl + xl + cl;
    }
    return out;
  }
  const xml = t => new DOMParser().parseFromString(t, "application/xml");
  const byTag = (n, tag) => [...n.getElementsByTagName(tag)];
  const txt = n => byTag(n, "*").length ? [...n.childNodes].map(c => c.nodeType === 3 ? c.nodeValue : txt(c)).join("") : n.textContent;

  async function lerXLSX(buf){
    const z = await unzip(buf), ss = [];
    if (z["xl/sharedStrings.xml"]) byTag(xml(await z["xl/sharedStrings.xml"].get()), "si").forEach(si => ss.push(byTag(si, "t").map(t => t.textContent).join("")));
    const nome = Object.keys(z).filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))[0];
    if (!nome) return [];
    const col = r => { const m = r.match(/^[A-Z]+/)[0]; let c = 0; for (const ch of m) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
    return byTag(xml(await z[nome].get()), "row").map(row => { const a = [];
      byTag(row, "c").forEach(c => { const t = c.getAttribute("t"), v = byTag(c, "v")[0]?.textContent ?? "";
        a[col(c.getAttribute("r"))] = t === "s" ? ss[+v] ?? "" : t === "inlineStr" ? byTag(c, "t").map(x => x.textContent).join("") : v; });
      return [...a].map(x => (x ?? "").toString().trim()); });
  }
  async function lerODS(buf){
    const z = await unzip(buf); if (!z["content.xml"]) return [];
    const d = xml(await z["content.xml"].get()), t = byTag(d, "table:table")[0]; if (!t) return [];
    return byTag(t, "table:table-row").map(r => { const a = [];
      byTag(r, "table:table-cell").forEach(c => { const rep = Math.min(50, +(c.getAttribute("table:number-columns-repeated") || 1)), v = byTag(c, "text:p").map(p => p.textContent).join(" ").trim(); for (let i = 0; i < rep; i++) a.push(v); });
      while (a.length && !a[a.length - 1]) a.pop(); return a; }).filter(r => r.length);
  }
  async function lerDOCX(buf){
    const z = await unzip(buf); if (!z["word/document.xml"]) return {linhas: []};
    const d = xml(await z["word/document.xml"].get());
    const tab = byTag(d, "w:tbl").map(t => byTag(t, "w:tr").map(tr => byTag(tr, "w:tc").map(tc => byTag(tc, "w:t").map(x => x.textContent).join("").trim()))).sort((a, b) => b.length - a.length)[0];
    if (tab && tab.length >= 2) return {tabela: tab};
    return {linhas: byTag(d, "w:p").map(p => byTag(p, "w:t").map(x => x.textContent).join("")).filter(Boolean)};
  }
  /* PDF: texto de PDFs gerados por sistemas, Word ou ERP (não lê PDF digitalizado/imagem).
     Devolve as linhas da página, cada uma com seus pedaços de texto ordenados pela posição. */
  function a85(t){ t = t.replace(/\s/g, "").replace(/^<~/, "").replace(/~>.*$/, ""); const out = []; let g = [];
    for (const ch of t){ if (ch === "z" && !g.length){ out.push(0, 0, 0, 0); continue; } g.push(ch.charCodeAt(0) - 33);
      if (g.length === 5){ let v = 0; for (const x of g) v = v * 85 + x; out.push(v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255); g = []; } }
    if (g.length){ const n = g.length; while (g.length < 5) g.push(84); let v = 0; for (const x of g) v = v * 85 + x; [v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255].slice(0, n - 1).forEach(x => out.push(x)); }
    return new Uint8Array(out); }
  async function lerPDF(buf, bruto){
    const b = new Uint8Array(buf), L1 = x => new TextDecoder("latin1").decode(x), s = L1(b), streams = [];
    const re = /stream\r?\n/g; let m;
    while ((m = re.exec(s))){
      const ini = m.index + m[0].length, fim = s.indexOf("endstream", ini); if (fim < 0) break;
      const dic = s.slice(Math.max(0, s.lastIndexOf("<<", m.index)), m.index), lm = dic.match(/\/Length\s+(\d+)(?!\s+\d+\s+R)/), n = lm ? +lm[1] : 0;
      let d = b.subarray(ini, n > 0 && ini + n <= fim ? ini + n : fim);   /* usa o tamanho declarado: bytes extras no fim cortavam parte do texto */
      try{ if (/ASCII85Decode|\/A85/.test(dic)) d = a85(L1(d)); if (/FlateDecode|\/Fl\b/.test(dic)) d = await inflate(d, "deflate"); }catch(e){ re.lastIndex = fim + 9; continue; }
      streams.push(L1(d)); re.lastIndex = fim + 9;
    }
    /* mapas ToUnicode (fontes de Word, LibreOffice e ERPs) */
    const cmap = {1: {}, 2: {}}, hx = h => h.replace(/[^0-9a-f]/gi, "");
    const uni = h => { h = hx(h); let r = ""; for (let k = 0; k + 4 <= h.length; k += 4) r += String.fromCharCode(parseInt(h.slice(k, k + 4), 16)); return r || String.fromCharCode(parseInt(h || "0", 16)); };
    streams.filter(t => /begincmap/.test(t)).forEach(t => {
      (t.match(/beginbfchar([\s\S]*?)endbfchar/g) || []).forEach(bl => (bl.match(/<[0-9a-fA-F]+>\s*<[0-9a-fA-F]+>/g) || []).forEach(pr => { const [a, c] = pr.match(/<([0-9a-fA-F]+)>/g).map(x => x.slice(1, -1)); const n = a.length / 2; (cmap[n] ||= {})[parseInt(a, 16)] = uni(c); }));
      (t.match(/beginbfrange([\s\S]*?)endbfrange/g) || []).forEach(bl => bl.split(/\n/).forEach(l => { const h = l.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]+)>|\[([^\]]*)\])/); if (!h) return;
        const a = parseInt(h[1], 16), z = parseInt(h[2], 16), n = h[1].length / 2; (cmap[n] ||= {});
        if (h[4]){ const base = parseInt(h[4], 16); for (let c = a; c <= z && c - a < 5000; c++) cmap[n][c] = String.fromCharCode(base + c - a); }
        else (h[5].match(/<([0-9a-fA-F]+)>/g) || []).forEach((x, k) => cmap[n][a + k] = uni(x.slice(1, -1))); })); });
    const tem2 = Object.keys(cmap[2]).length > 0, tem1 = Object.keys(cmap[1]).length > 0;
    const dec = (bytes, hex) => { if (hex && tem2 && bytes.length % 2 === 0){ let r = ""; for (let k = 0; k < bytes.length; k += 2){ const c = bytes[k] << 8 | bytes[k + 1]; r += cmap[2][c] ?? ""; } return r; }
      if (tem1 && bytes.some(c => cmap[1][c] != null)) return bytes.map(c => cmap[1][c] ?? String.fromCharCode(c)).join(""); return bytes.map(c => String.fromCharCode(c)).join(""); };
    const lit = x => { const out = []; for (let k = 0; k < x.length; k++){ let c = x[k]; if (c === "\\"){ const n = x[++k]; if (/[0-7]/.test(n)){ let o = n; while (o.length < 3 && /[0-7]/.test(x[k + 1])) o += x[++k]; out.push(parseInt(o, 8)); } else out.push({n: 10, r: 13, t: 9, b: 8, f: 12}[n] ?? n.charCodeAt(0)); } else out.push(c.charCodeAt(0)); } return out; };
    const hexb = x => { x = hx(x); if (x.length % 2) x += "0"; const o = []; for (let k = 0; k < x.length; k += 2) o.push(parseInt(x.slice(k, k + 2), 16)); return o; };
    /* conteúdo das páginas: posição de cada texto */
    const itens = [];
    streams.forEach((c, pg) => { if (!/\b(Tj|TJ)\b/.test(c)) return;
      const tok = /\((?:\\.|[^\\()]|\((?:\\.|[^\\)])*\))*\)|<[0-9a-fA-F\s]*>|\[|\]|\/[^\s\/\[\]()<>]+|-?\d*\.?\d+|[A-Za-z'"*]+/g;
      let st = [], arr = null, lm = [0, 0], TL = 0, t;
      const emit = txt => { if (txt.trim()) itens.push({pg, x: lm[0], y: Math.round(lm[1]), t: txt}); };
      while ((t = tok.exec(c))){ const v = t[0];
        if (v === "["){ arr = []; continue; } if (v === "]"){ st.push(arr); arr = null; continue; }
        const val = v[0] === "(" ? {s: dec(lit(v.slice(1, -1)), false)} : v[0] === "<" ? {s: dec(hexb(v.slice(1, -1)), true)} : /^-?\d*\.?\d+$/.test(v) ? +v : v[0] === "/" ? v : null;
        if (val !== null){ (arr || st).push(val); continue; }
        if (arr) continue;
        if (v === "BT") lm = [0, 0];
        else if (v === "Tm" && st.length >= 6) lm = [st[st.length - 2], st[st.length - 1]];
        else if ((v === "Td" || v === "TD") && st.length >= 2){ lm = [lm[0] + st[st.length - 2], lm[1] + st[st.length - 1]]; if (v === "TD") TL = -st[st.length - 1]; }
        else if (v === "TL" && st.length) TL = st[st.length - 1];
        else if (v === "T*") lm = [lm[0], lm[1] - TL];
        else if (v === "Tj" || v === "'" || v === '"'){ if (v !== "Tj") lm = [lm[0], lm[1] - TL]; const x = st[st.length - 1]; if (x && x.s != null) emit(x.s); }
        else if (v === "TJ"){ const a = st[st.length - 1]; if (Array.isArray(a)) emit(a.map(x => x && x.s != null ? x.s : (typeof x === "number" && x < -200 ? " " : "")).join("")); }
        st = []; } });
    /* agrupa por linha (mesma página e mesma altura), da esquerda para a direita */
    const grupos = new Map(); itens.forEach(it => { const k = it.pg + ":" + Math.round(it.y / 2); (grupos.get(k) || grupos.set(k, []).get(k)).push(it); });
    const linhas = [...grupos.entries()].sort((a, b) => { const [pa, ya] = a[0].split(":").map(Number), [pb, yb] = b[0].split(":").map(Number); return pa - pb || yb - ya; })
      .map(([, g]) => g.sort((a, b) => a.x - b.x));
    if (bruto) return linhas.map(l => [l.map(it => it.t).join(" ").replace(/\s+/g, " ").trim()]).filter(r => r[0]);   /* texto corrido por linha, sem montar colunas */
    const junta = (a, b) => !a ? b : (/\s$/.test(a) || /^\s/.test(b)) ? a + b : a + b;
    const ehDoc = t => /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/.test(t);
    const cab = linhas.findIndex(l => !l.some(it => ehDoc(it.t)) && l.filter(it => Object.values(SIN).some(re => re.test(it.t.toLowerCase().trim()))).length >= 2);
    if (cab < 0) return linhas.map(l => l.map(it => it.t.trim()).filter(Boolean)).filter(r => r.length);
    /* tabela: colunas pela posição do cabeçalho; linhas quebradas dentro da célula são juntadas */
    const xs = linhas[cab].map(it => it.x), col = x => { let k = 0; xs.forEach((v, i) => { if (x >= v - 3) k = i; }); return k; };
    const cabTxt = linhas[cab].map(it => it.t.trim().toLowerCase()), reg = [], head = linhas[cab].map(it => it.t);
    let alvo = head;
    linhas.slice(cab + 1).forEach(l => {
      const cel = []; l.forEach(it => { const c = col(it.x); cel[c] = junta(cel[c] || "", it.t); });
      if (cel.map(x => (x || "").trim().toLowerCase()).filter(Boolean).every((x, k) => cabTxt.includes(x))) { alvo = null; return; }   /* cabeçalho repetido em outra página */
      if ((cel[0] || "").trim() || (alvo === head && cel.some(ehDoc))){ alvo = [...cel]; reg.push(alvo); }
      else if (alvo){ cel.forEach((v, c) => { if (v) alvo[c] = junta(alvo[c] || "", v); }); }
    });
    return [head, ...reg].map(r => Array.from({length: xs.length}, (_, k) => (r[k] || "").replace(/\s+/g, " ").trim()));
  }
  /* ---------- interpretação ---------- */
  const SIN = {nivel: /^n[ií]vel|^level|^n1\/n2/, doc: /cnpj|cpf|documento|^doc/, nome: /raz[aã]o|^nome|fornecedor|empresa|produtor|^trader/, municipio: /munic|cidade/, uf: /^uf$|estado/,
    volume: /volume|^vol|tonelad|t\/ano|quantidade|qtd/, comprador: /comprador|vende para|cliente|vinculad|pai|^n1 /, tipo: /^tipo/, email: /e-?mail/, tel: /telefone|fone|celular|whats/};
  const docLimpo = v => String(v || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  function docValido(v){ const d = docLimpo(v);
    if (/^\d{11}$/.test(d)){ if (/^(\d)\1+$/.test(d)) return false; const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i); const r = s * 10 % 11; return r === 10 ? 0 : r; }; return dv(9) === +d[9] && dv(10) === +d[10]; }
    if (!/^[0-9A-Z]{12}\d{2}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
    const dv = n => { let s = 0, p = n - 7; for (let i = 0; i < n; i++){ s += (d.charCodeAt(i) - 48) * p--; if (p < 2) p = 9; } const r = s % 11; return r < 2 ? 0 : 11 - r; };
    return dv(12) === +d[12] && dv(13) === +d[13]; }
  const nivelDe = v => { const m = String(v || "").toUpperCase().match(/N?\s*([123])/); return m ? "N" + m[1] : ""; };
  /* tabela com cabeçalho */
  function deTabela(t){
    t = t.filter(r => r.some(c => String(c).trim()));
    if (!t.length) return [];
    const ehDoc = c => /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{3}\.\d{3}\.\d{3}-\d{2}/.test(String(c));
    const hi = t.slice(0, 8).findIndex(r => !r.some(ehDoc) && r.filter(c => String(c).length < 45 && Object.values(SIN).some(re => re.test(String(c).toLowerCase().trim()))).length >= 2);
    if (hi < 0) return deTexto(t.map(r => r.join(" ; ")));
    const head = t[hi].map(c => String(c).toLowerCase().trim()), idx = {};
    Object.entries(SIN).forEach(([k, re]) => { const i = head.findIndex((h, j) => re.test(h) && !Object.values(idx).includes(j)); if (i >= 0) idx[k] = i; });
    const r = t.slice(hi + 1).map(r => { const o = {}; Object.entries(idx).forEach(([k, i]) => o[k] = String(r[i] ?? "").trim()); return o; }).filter(o => o.nome || o.doc);
    return r.length ? r : deTexto(t.map(x => x.join(" ; ")));
  }
  /* texto livre (PDF, Word, TXT sem cabeçalho): procura CNPJ/CPF, UF, município e volume em cada linha */
  function deTexto(linhas){
    const reDoc = /\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/[0-9A-Z]{4}-\d{2}|\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/;
    return linhas.map(l => String(l).replace(/\s+/g, " ").trim()).filter(Boolean).map(l => {
      const o = {}, dm = l.match(reDoc); let resto = l;
      if (dm){ o.doc = dm[1]; resto = resto.replace(new RegExp("(CNPJ|CPF)?\\s*(n[ºo°.]*)?\\s*:?\\s*" + dm[0].replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"), "i"), " | "); }
      const nv = resto.match(/\bN\s?([123])\b/); if (nv){ o.nivel = "N" + nv[1]; resto = resto.replace(nv[0], " "); }
      const vm = resto.match(/(\d[\d.,]*)\s*(t|ton|toneladas|t\/ano)\b/i); if (vm){ o.volume = vm[1]; resto = resto.replace(vm[0], " "); }
      const um = resto.match(/([A-Za-zÀ-ú' .]{2,40}?)\s*[\/-]\s*([A-Z]{2})\b/);
      if (um && UFS.includes(um[2])){ o.municipio = um[1].trim(); o.uf = um[2]; resto = resto.replace(um[0], " "); }
      else { const u = resto.match(/\b([A-Z]{2})\b/g)?.find(x => UFS.includes(x)); if (u){ o.uf = u; resto = resto.replace(new RegExp("\\b" + u + "\\b"), " "); } }
      o.nome = resto.split(/[|;\t]/).map(x => x.replace(/^[\s,.\-–:]+|[\s,.\-–:]+$/g, "")).filter(x => x.length > 2 && !/^\d[\d.,\s]*$/.test(x))[0] || "";
      return o; }).filter(o => o.doc && o.nome);
  }
  function deCSV(t){
    const ls = t.split(/\r?\n/).filter(l => l.trim()); if (!ls.length) return [];
    const sep = ["\t", ";", "|", ","].map(c => [c, (ls[0].split(c).length - 1)]).sort((a, b) => b[1] - a[1])[0];
    if (!sep[1]) return deTexto(ls);
    const split = l => { const out = []; let cur = "", q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === sep[0] && !q){ out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(x => x.trim()); };
    return deTabela(ls.map(split));
  }
  async function lerArquivo(f){
    const n = f.name.toLowerCase(), buf = await f.arrayBuffer();
    if (/\.xlsx$|\.xlsm$/.test(n)) return deTabela(await lerXLSX(buf));
    if (/\.ods$/.test(n)) return deTabela(await lerODS(buf));
    if (/\.docx$/.test(n)){ const d = await lerDOCX(buf); return d.tabela ? deTabela(d.tabela) : deTexto(d.linhas); }
    if (/\.pdf$/.test(n)){ const L = await lerPDF(buf), t = deTabela(L); return t.length ? t : deTexto(L.map(r => r.join(" ; "))); }
    if (/\.xls$|\.doc$/.test(n)) throw new Error("antigo");
    let t = new TextDecoder("utf-8").decode(buf); if (t.includes("\uFFFD")) t = new TextDecoder("latin1").decode(buf);
    return deCSV(t);
  }

  /* ---------- confirmação (pede para digitar uma palavra quando há exclusões) ---------- */
  function confirma(html, rotulo, palavra, fn, perigo){
    const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 40; d.style.alignItems = "center";
    d.innerHTML = `<div class="card" style="max-width:460px;margin:16px;display:flex;flex-direction:column;gap:12px;background:var(--navy)"><div>${html}</div>${palavra ? `<div class="fld"><label for="cf-pal">Para confirmar, digite <b>${palavra}</b></label><input id="cf-pal" autocomplete="off"></div>` : ""}<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-c>Cancelar</button><button type="button" class="btn ${perigo ? "bad" : "primary"}" data-ok ${palavra ? "disabled" : ""}>${rotulo}</button></div></div>`;
    document.body.appendChild(d); const ok = d.querySelector("[data-ok]"), pal = d.querySelector("#cf-pal");
    if (pal){ pal.oninput = () => ok.disabled = pal.value.trim().toUpperCase() !== palavra; pal.focus(); }
    d.querySelector("[data-c]").onclick = () => d.remove(); ok.onclick = () => { d.remove(); fn(); };
  }
  /* desvincula os filhos de fornecedores excluídos (ficam para conferir) */
  async function desvincular(ids){ const set = new Set(ids); for (const k of S.suppliers.filter(x => set.has(x.parentId) && !set.has(x.id))) await Store.update("suppliers", k.id, {parentId: "", conferir: true}); }

  /* ---------- tela ---------- */
  function abrir(){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base de fornecedores</div><h2>Importar fornecedores (N1, N2, N3)</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <p class="sub" style="margin:0">Aceita <b>Excel (.xlsx)</b>, <b>CSV/TXT</b>, <b>Word (.docx)</b>, <b>PDF com texto</b>, <b>LibreOffice (.ods)</b> ou colar direto da planilha. O sistema reconhece as colunas pelo nome: Nível, CNPJ/CPF, Razão social, Município, UF, Volume, Comprador (para quem vende), Tipo, E-mail e Telefone. Sem cabeçalho, procura o CNPJ e o nome em cada linha.</p>
        <div class="form"><div class="fld"><label for="im-niv">Nível padrão (quando o arquivo não informa)</label><select id="im-niv"><option value="N1">N1 · ${esc(LV_NOME.N1)}</option><option value="N2">N2 · ${esc(LV_NOME.N2)}</option><option value="N3">N3 · ${esc(LV_NOME.N3)}</option></select></div>
          <div class="fld"><label for="im-pai">Vende para (comprador padrão, para N2 e N3)</label><select id="im-pai"><option value="">— identificar pela coluna Comprador —</option>${S.suppliers.filter(s => s.nivel !== "N3").sort((a, b) => a.nivel.localeCompare(b.nivel) || (a.nome || "").localeCompare(b.nome || "")).map(s => `<option value="${s.id}">${s.nivel} · ${esc(s.nome)}</option>`).join("")}</select></div></div>
        <div class="form"><div class="fld"><label for="im-modo">Fornecedores já cadastrados (mesmo CNPJ/CPF)</label><select id="im-modo"><option value="ignorar">Ignorar (manter os dados atuais)</option><option value="substituir">Substituir os dados pelos da nova lista</option></select><span class="hint">Substituir atualiza nome, cidade, volume, comprador e contatos; questionário, documentos e fotos são mantidos.</span></div>
          <div class="fld"><label class="check" style="margin-top:22px"><input type="checkbox" id="im-del"> Excluir os fornecedores do mesmo nível que não estão na nova lista</label></div></div>
        <div class="fld"><label for="im-file">Arquivo</label><input id="im-file" type="file" accept=".xlsx,.xlsm,.ods,.csv,.txt,.tsv,.docx,.pdf,text/csv,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.spreadsheet"></div>
        <div class="fld"><label for="im-txt">Ou cole aqui (copie as linhas do Excel, do Word ou de um e-mail)</label><textarea id="im-txt" style="min-height:110px;font-family:var(--f-mono);font-size:12.5px" placeholder="Nível;CNPJ;Razão social;Município;UF;Volume;Comprador&#10;N1;00.000.000/0001-00;Fornecedor Exemplo Ltda;Guarulhos;SP;1200;"></textarea></div>
        <button type="button" class="btn sm ghost" id="im-modelo" style="align-self:flex-start">Baixar planilha modelo (.csv)</button>
        <div id="im-prev"></div>
        <p class="err" id="im-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn primary" id="im-go" disabled>Importar</button></div>
      </div>`);
    let lidas = [];
    const conhecidos = () => new Map(S.suppliers.filter(x => x.doc).map(x => [docLimpo(x.doc), x]));
    const acharPai = (r, nivel) => {
      const padrao = $("#im-pai").value; if (nivel === "N1") return "";
      const c = String(r.comprador || "").trim();
      if (c){ const d = docLimpo(c), alvo = nivel === "N2" ? "N1" : "N2";
        const x = S.suppliers.find(s => (d.length >= 11 && docLimpo(s.doc) === d) || (s.nome || "").toLowerCase() === c.toLowerCase()) ||
                  lidas.find(s => s._ok && ((d.length >= 11 && docLimpo(s.doc) === d) || (s.nome || "").toLowerCase() === c.toLowerCase()));
        if (x) return x.id || ("@" + x._i); if (alvo) return ""; }
      return padrao; };
    let ausentes = [];
    const mostrar = () => {
      const k = conhecidos(), niv = $("#im-niv").value, subst = $("#im-modo").value === "substituir";
      lidas = lidas.map((r, i) => { const nivel = nivelDe(r.nivel) || niv, d = docLimpo(r.doc), dup = d && k.get(d);
        return {...r, _i: i, _nivel: nivel, _dup: !!dup, _exist: dup ? dup.id : "", _inval: !!r.doc && !docValido(r.doc), _ok: dup && !subst ? false : (r._ok ?? !!(r.nome || r.doc))}; });
      lidas.forEach(r => r._pai = acharPai(r, r._nivel));
      const niveis = new Set(lidas.map(r => r._nivel)), docs = new Set(lidas.map(r => docLimpo(r.doc)).filter(Boolean));
      ausentes = $("#im-del").checked && lidas.length ? S.suppliers.filter(x => niveis.has(x.nivel) && docLimpo(x.doc) && !docs.has(docLimpo(x.doc))) : [];
      const novos = lidas.filter(r => r._ok && !r._dup).length, troca = lidas.filter(r => r._ok && r._dup).length;
      $("#im-prev").innerHTML = lidas.length ? `<div class="result">${lidas.length} linha(s) lida(s) · <b>${novos} novo(s)</b> · <b>${troca} para substituir</b> · ${lidas.filter(r => r._dup).length} já cadastrada(s)${ausentes.length ? ` · <b style="color:var(--bad)">${ausentes.length} para excluir (fora da nova lista)</b>` : ""} · ${lidas.filter(r => r._inval).length} com CNPJ/CPF inválido · ${lidas.filter(r => r._nivel !== "N1" && !r._pai).length} N2/N3 sem comprador identificado</div>
        <div class="tbl" style="max-height:300px;overflow:auto;margin-top:8px"><table><thead><tr><th></th><th>Nível</th><th>Razão social</th><th>CNPJ/CPF</th><th>Município/UF</th><th>Volume</th><th>Vende para</th><th>Situação</th></tr></thead><tbody>${lidas.map(r => { const pai = r._pai ? (r._pai[0] === "@" ? lidas[+r._pai.slice(1)] : supById(r._pai)) : null;
          return `<tr><td><input type="checkbox" data-im="${r._i}" ${r._ok ? "checked" : ""} ${r._dup && !subst ? "disabled" : ""} aria-label="Importar linha"></td><td>${r._nivel}</td><td style="min-width:160px">${esc(r.nome || "—")}</td><td class="mono" style="color:${r._inval ? "var(--bad)" : "inherit"}">${esc(r.doc || "—")}</td><td>${esc([r.municipio, r.uf].filter(Boolean).join("/") || "—")}</td><td class="mono">${esc(r.volume || "—")}</td><td style="font-size:12px">${pai ? esc(pai.nome) : r._nivel === "N1" ? esc(CLI().nome) : '<span style="color:var(--warn)">não identificado</span>'}</td><td style="font-size:12px">${r._dup ? (subst ? '<span style="color:var(--warn)">Substituir dados</span>' : "Já cadastrado · ignorado") : r._inval ? '<span style="color:var(--bad)">CNPJ/CPF inválido</span>' : "Novo"}</td></tr>`; }).join("")}</tbody></table></div>${ausentes.length ? `<div class="banner" style="margin-top:8px;border-color:var(--bad)"><b>Serão excluídos ${ausentes.length} fornecedor(es) que não estão na nova lista:</b> ${ausentes.slice(0, 12).map(x => esc(x.nome)).join("; ")}${ausentes.length > 12 ? `; e mais ${ausentes.length - 12}` : ""}</div>` : ""}` : "";
      $$("[data-im]").forEach(c => c.onchange = () => { lidas[+c.dataset.im]._ok = c.checked; mostrar(); });
      const tot = novos + troca + ausentes.length; $("#im-go").disabled = !tot; $("#im-go").textContent = tot ? `Importar · ${novos} novo(s) · ${troca} substituído(s)${ausentes.length ? ` · ${ausentes.length} excluído(s)` : ""}` : "Importar";
    };
    const carregar = rows => { lidas = rows.map(r => ({...r})); $("#im-err").hidden = true; mostrar();
      if (!lidas.length){ $("#im-err").textContent = "Nenhum fornecedor encontrado. Confira se o arquivo tem razão social e CNPJ (ou use a planilha modelo)."; $("#im-err").hidden = false; } };
    $("#im-txt").oninput = () => { clearTimeout($("#im-txt")._t); $("#im-txt")._t = setTimeout(() => carregar(deCSV($("#im-txt").value)), 250); };
    $("#im-niv").onchange = mostrar; $("#im-pai").onchange = mostrar;
    $("#im-modo").onchange = () => { lidas.forEach(r => { if (r._dup) delete r._ok; }); mostrar(); }; $("#im-del").onchange = mostrar;
    $("#im-file").onchange = async e => { const f = e.target.files[0]; if (!f) return; $("#im-prev").innerHTML = `<div class="result">Lendo ${esc(f.name)}…</div>`;
      try{ carregar(await lerArquivo(f)); }
      catch(x){ $("#im-prev").innerHTML = ""; $("#im-err").textContent = x.message === "antigo" ? "Formato antigo (.xls ou .doc). Salve como .xlsx ou .docx (Arquivo → Salvar como) e tente de novo." : "Não foi possível ler o arquivo. Se for PDF digitalizado (imagem), use o Excel ou cole o texto."; $("#im-err").hidden = false; } };
    $("#im-modelo").onclick = () => { const csv = "﻿Nível;CNPJ/CPF;Razão social;Município;UF;Volume (t/ano);Comprador (CNPJ ou nome);Tipo;E-mail;Telefone\r\nN1;00.000.000/0001-00;Fornecedor N1 Exemplo Ltda;Guarulhos;SP;1200;;;compras@exemplo.com.br;(11) 0000-0000\r\nN2;11.111.111/0001-11;Fornecedor N2 Exemplo Ltda;Osasco;SP;300;00.000.000/0001-00;;;\r\nN3;222.222.222-22;Produtor N3 Exemplo;Sorocaba;SP;40;11.111.111/0001-11;;;\r\n";
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"})); a.download = "KinseyTec_modelo_importacao_fornecedores.csv"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); };
    $("#im-go").onclick = () => {
      const sel = lidas.filter(r => r._ok), nn = sel.filter(r => !r._dup).length, nt = sel.filter(r => r._dup).length, nd = ausentes.length;
      confirma(`<h3 style="margin:0 0 6px">Confirmar importação</h3><ul style="margin:0;padding-left:18px"><li><b>${nn}</b> fornecedor(es) novo(s)</li><li><b>${nt}</b> fornecedor(es) com dados substituídos pelo CNPJ</li>${nd ? `<li style="color:var(--bad)"><b>${nd}</b> fornecedor(es) excluído(s) por não estarem na nova lista</li>` : ""}</ul>${nd ? '<p class="sub" style="margin:8px 0 0">A exclusão não pode ser desfeita. As evidências e contratos desses fornecedores continuam guardados.</p>' : ""}`,
        nd ? "Importar e excluir" : "Importar", nd ? "EXCLUIR" : "", gravar, !!nd);
    };
    const gravar = async () => {
      const go = $("#im-go"), sel = lidas.filter(r => r._ok); go.disabled = true; let n = 0; const ids = {};
      const lote = "imp-" + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "") + "-" + Math.random().toString(36).slice(2, 6), arq = $("#im-file").files[0]?.name || "colado";
      sel.forEach(r => ids[r._i] = r._exist || uid());
      try{
        for (const nivel of ["N1", "N2", "N3"]) for (const r of sel.filter(x => x._nivel === nivel)){
          const m = muniOf(r.municipio, r.uf), uf = (r.uf || (m ? m[1] : "")).toUpperCase().slice(0, 2), c = m ? [m[2], m[3]] : UF_CENTER[uf] || null;
          const pai = r._pai ? (r._pai[0] === "@" ? ids[+r._pai.slice(1)] || "" : r._pai) : "";
          const tipos = SUP_TYPES[nivel] || [], tipo = tipos.find(t => t.toLowerCase() === String(r.tipo || "").toLowerCase()) || tipos[0] || "";
          if (r._exist){ const pt = {nivel, atualizadoEm: nowISO(), atualizadoPor: Store.me.id || "", ultimaImportacao: lote};
            if (r.nome) pt.nome = r.nome; if (pai) pt.parentId = pai; if (r.municipio || r.uf){ pt.municipio = r.municipio || ""; pt.uf = uf; pt.lat = c ? c[0] : null; pt.lng = c ? c[1] : null; pt.geoAprox = !m; }
            if (r.volume) pt.volume = r.volume; if (r.email) pt.email = r.email; if (r.tel) pt.telefone = r.tel; if (r.tipo && tipos.includes(tipo)) pt.tipo = tipo;
            await Store.update("suppliers", r._exist, pt); n++; go.textContent = `Gravando ${n}/${sel.length}…`; continue; }
          await Store.set("suppliers", ids[r._i], {nivel, tipo, parentId: pai, nome: r.nome || r.doc, doc: r.doc || "", uf, municipio: r.municipio || "", volume: r.volume || "",
            email: r.email || "", telefone: r.tel || "", lat: c ? c[0] : null, lng: c ? c[1] : null, geoAprox: !m, answers: {}, docs: {}, insp: {}, balanco: {}, invest: {},
            criadoEm: nowISO(), criadoPor: Store.me.id || "", origem: "importação", lote, arquivo: arq, conferir: !pai && nivel !== "N1"});
          n++; go.textContent = `Importando ${n}/${sel.length}…`;
        }
        let nd = 0; if (ausentes.length){ for (const x of ausentes){ await Store.del("suppliers", x.id); nd++; go.textContent = `Excluindo ${nd}/${ausentes.length}…`; } await desvincular(ausentes.map(x => x.id)); }
        close(); toast(`${n} fornecedor(es) gravado(s)${nd ? ` · ${nd} excluído(s)` : ""}`);
      }catch(x){ $("#im-err").textContent = `Importação parou em ${n} de ${sel.length}. ${x?.code === "quota_exceeded" ? "Limite do banco atingido." : "Verifique a conexão e o seu acesso (perfil Administrador, Editor ou Colaborador)."}`; $("#im-err").hidden = false; go.disabled = false; go.textContent = "Importar o restante"; }
    };
  }
  function excluir(){
    const lotes = [...new Set(S.suppliers.filter(x => x.lote).map(x => x.lote))].map(l => { const a = S.suppliers.filter(x => x.lote === l); return [l, `${a[0].arquivo || "importação"} · ${a.length} fornecedor(es)`]; });
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base de fornecedores</div><h2>Excluir fornecedores</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <p class="sub" style="margin:0">Escolha um ou vários fornecedores. Antes de excluir, o sistema pede confirmação. Fornecedores vinculados aos excluídos ficam sem comprador, para conferir.</p>
        <div class="form"><div class="fld"><label for="ex-q">Buscar</label><input id="ex-q" type="search" placeholder="Nome, CNPJ ou município"></div>
          <div class="fld"><label for="ex-n">Nível</label><select id="ex-n"><option value="">Todos</option><option>N1</option><option>N2</option><option>N3</option></select></div>
          <div class="fld"><label for="ex-o">Origem</label><select id="ex-o"><option value="">Todas</option><option value="imp">Importados</option>${lotes.map(([l, t]) => `<option value="${l}">${esc(t)}</option>`).join("")}</select></div></div>
        <label class="check"><input type="checkbox" id="ex-all"> Selecionar todos os da lista abaixo</label>
        <div class="tbl" style="max-height:340px;overflow:auto"><table><thead><tr><th></th><th>Nível</th><th>Fornecedor</th><th>CNPJ/CPF</th><th>Município/UF</th></tr></thead><tbody id="ex-l"></tbody></table></div>
        <label class="check"><input type="checkbox" id="ex-ev"> Excluir também as evidências e os contratos desses fornecedores</label>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn bad" id="ex-go" disabled>Excluir</button></div>
      </div>`);
    const sel = new Set(); let vis = [];
    const lista = () => { const q = $("#ex-q").value.trim().toLowerCase(), n = $("#ex-n").value, o = $("#ex-o").value;
      vis = S.suppliers.filter(x => (!n || x.nivel === n) && (!o || (o === "imp" ? x.origem === "importação" : x.lote === o)) && (!q || [x.nome, x.doc, x.municipio].some(v => String(v || "").toLowerCase().includes(q))))
        .sort((a, b) => a.nivel.localeCompare(b.nivel) || (a.nome || "").localeCompare(b.nome || ""));
      $("#ex-l").innerHTML = vis.map(x => `<tr><td><input type="checkbox" data-ex="${x.id}" ${sel.has(x.id) ? "checked" : ""} aria-label="Selecionar ${esc(x.nome)}"></td><td>${x.nivel}</td><td style="min-width:180px">${esc(x.nome || "—")}</td><td class="mono">${esc(x.doc || "—")}</td><td>${esc([x.municipio, x.uf].filter(Boolean).join("/") || "—")}</td></tr>`).join("") || `<tr><td colspan="5" style="color:var(--muted)">Nenhum fornecedor com esses filtros.</td></tr>`;
      $("#ex-all").checked = vis.length > 0 && vis.every(x => sel.has(x.id));
      $$("[data-ex]").forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.ex) : sel.delete(c.dataset.ex); conta(); });
      conta(); };
    const conta = () => { $("#ex-go").disabled = !sel.size; $("#ex-go").textContent = sel.size ? `Excluir ${sel.size} fornecedor(es)` : "Excluir"; };
    ["#ex-q", "#ex-n", "#ex-o"].forEach(k => $(k).oninput = lista); $("#ex-n").onchange = lista; $("#ex-o").onchange = lista;
    $("#ex-all").onchange = e => { vis.forEach(x => e.target.checked ? sel.add(x.id) : sel.delete(x.id)); lista(); };
    $("#ex-go").onclick = () => {
      const ids = [...sel], nomes = ids.map(i => supById(i)?.nome || i), comEv = $("#ex-ev").checked;
      confirma(`<h3 style="margin:0 0 6px">Excluir ${ids.length} fornecedor(es)?</h3><p class="sub" style="margin:0 0 6px">${nomes.slice(0, 10).map(esc).join("; ")}${nomes.length > 10 ? `; e mais ${nomes.length - 10}` : ""}</p><p class="sub" style="margin:0">${comEv ? "As evidências e os contratos deles também serão excluídos." : "As evidências e os contratos deles continuam guardados."} A exclusão não pode ser desfeita.</p>`,
        `Excluir ${ids.length}`, ids.length > 10 ? "EXCLUIR" : "", async () => {
          const go = $("#ex-go"); go.disabled = true; let n = 0;
          try{
            if (comEv){ const set = new Set(ids);
              for (const e of S.evidences.filter(e => set.has(e.supplierId))) await Store.del("evidences", e.id);
              for (const k of S.contracts.filter(k => set.has(k.supplierId))){ await Store.del("contracts", k.id); await Store.del("pareceres", k.id).catch(() => {}); } }
            for (const id of ids){ await Store.del("suppliers", id); n++; go.textContent = `Excluindo ${n}/${ids.length}…`; }
            await desvincular(ids); close(); toast(`${n} fornecedor(es) excluído(s)`);
          }catch(x){ go.disabled = false; go.textContent = "Excluir o restante"; toast(`Exclusão parou em ${n} de ${ids.length}. Verifique a conexão e o seu acesso.`); }
        }, true);
    };
    lista();
  }
  return {abrir, excluir, confirma, unzip, deCSV, deTexto, deTabela, lerXLSX, lerDOCX, lerPDF, lerODS, docValido};
})();
