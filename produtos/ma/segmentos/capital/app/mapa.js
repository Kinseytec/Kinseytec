/* ================= KINSEY CAPITAL · IMPORTAÇÃO DO MAPA DE M&A =================
   Planilha da Kinsey (Excel, LibreOffice, CSV ou colada) com investidores, intermediadores e parceiros e targets
   (vendedores), linhas de negócio, intermediador e possíveis compradores. O sistema reconhece as colunas pelo
   cabeçalho, mostra a prévia, cadastra ou atualiza as empresas, liga target → intermediador e target → investidores,
   posiciona cada uma no globo e consulta os CNPJs na Receita Federal (razão social, CNAE, endereço, sócios, situação). */
if (window.KT_DD) (() => {
  const D = KT_DD;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const dig = t => String(t || "").replace(/\D/g, "");
  const PAISES = {"estados unidos":[39.8,-98.6],"eua":[39.8,-98.6],"usa":[39.8,-98.6],"reino unido":[52.5,-1.5],"inglaterra":[52.5,-1.5],"espanha":[40.4,-3.7],"portugal":[39.4,-8.2],"franca":[46.6,2.4],"alemanha":[51.2,10.4],"italia":[42.8,12.5],"holanda":[52.1,5.3],"paises baixos":[52.1,5.3],"suica":[46.8,8.2],"canada":[56.1,-106.3],"mexico":[23.6,-102.6],"argentina":[-34.6,-58.4],"chile":[-33.4,-70.6],"colombia":[4.6,-74.1],"peru":[-12.0,-77.0],"uruguai":[-34.9,-56.2],"paraguai":[-25.3,-57.6],"china":[35.9,104.2],"japao":[36.2,138.3],"emirados arabes":[24.5,54.4],"arabia saudita":[24.7,46.7],"catar":[25.3,51.5],"singapura":[1.35,103.8],"israel":[31.0,34.9],"luxemburgo":[49.8,6.1],"belgica":[50.5,4.5],"suecia":[59.3,18.1],"noruega":[59.9,10.8],"dinamarca":[55.7,12.6],"irlanda":[53.3,-6.3],"australia":[-25.3,133.8],"india":[20.6,79.0],"coreia do sul":[37.6,127.0],"hong kong":[22.3,114.2]};
  const COLS = [["nivel",/^(nivel|categoria|papel|perfil|tipo de participante|classificacao)$/],["nome",/^(nome|razao social|empresa|companhia|nome da empresa|investidor|target)$/],["cnpj",/cnpj|^documento$|registro/],
    ["tipo",/^(tipo|tipo de investidor|subtipo|perfil do investidor)$/],["segmento",/segmento|setor/],["linhas",/linhas? de negocio|linha|produtos|atividade/],["municipio",/cidade|municipio/],["uf",/^(uf|estado)$/],["pais",/^pais/],
    ["contato",/contato|e-?mail|telefone|responsavel/],["fat",/fatur|receita/],["ebitda",/ebitda/],["tmin",/ticket.*min|ticket minimo/],["tmax",/ticket.*max|ticket maximo/],["interm",/intermediador|originad|trazid|parceiro respons|assessor/],
    ["interesse",/interess|possiveis compradores|compradores|investidores (possiveis|potenciais|indicados)/],["obs",/^obs|observ|comentario/]];
  const nivelDe = (v, tipo) => { const t = nrm(v + " " + (tipo || "")); return /\bn1\b|invest|comprador|fundo|private|family|estrateg|venture|\bpe\b/.test(t) ? "N1" : /\bn2\b|intermed|parceir|assessor|originador|escritorio|consultoria/.test(t) ? "N2" : /\bn3\b|target|vendedor|alvo|empresa.?alvo|mandato/.test(t) ? "N3" : ""; };
  const numMi = v => { const s = String(v || "").trim(); if (!s) return null; let n = num(s.replace(/[^\d,.-]/g, "")); if (n == null) return null; if (/bi/i.test(s)) n *= 1000; else if (/mil\b|k\b/i.test(s) && !/mi/i.test(s)) n /= 1000; else if (n > 1e5) n /= 1e6; return n; };
  function ler(rows){
    rows = rows.map(r => (r || []).map(c => String(c ?? "").trim())).filter(r => r.some(Boolean)); if (!rows.length) return {L:[], cols:{}};
    const hi = rows.slice(0, 10).findIndex(r => r.filter(c => COLS.some(([, re]) => re.test(nrm(c)))).length >= 2); if (hi < 0) throw new Error("Não reconheci o cabeçalho. Use o modelo da planilha (Nome, CNPJ, Nível, Segmento…).");
    const H = rows[hi].map(nrm), cols = {}; COLS.forEach(([k, re]) => { const i = H.findIndex((h, j) => re.test(h) && !Object.values(cols).includes(j)); if (i > -1) cols[k] = i; });
    if (cols.nome == null) throw new Error("Falta a coluna com o nome da empresa.");
    const L = rows.slice(hi + 1).map(r => { const g = k => cols[k] != null ? r[cols[k]] || "" : ""; const nome = g("nome"); if (!nome) return null;
      const doc = dig(g("cnpj")), cnpj = doc.length === 14 ? doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : g("cnpj");
      return {nivel:nivelDe(g("nivel"), g("tipo")), nome, doc:cnpj, docOk:doc.length === 14 && IMP.docValido(doc), tipo:g("tipo"), segmento:g("segmento"), linhas:g("linhas"), municipio:g("municipio"), uf:g("uf").toUpperCase().slice(0, 2), pais:g("pais"), contato:g("contato"),
        fat:numMi(g("fat")), ebitda:numMi(g("ebitda")), tmin:numMi(g("tmin")), tmax:numMi(g("tmax")), interm:g("interm"), interesse:g("interesse"), obs:g("obs")}; }).filter(Boolean);
    return {L, cols};
  }
  function coords(o){
    const pais = nrm(o.pais); if (pais && !/^brasil|^brazil/.test(pais)){ const c = PAISES[pais] || Object.entries(PAISES).find(([k]) => pais.includes(k))?.[1]; if (c) return [c[0] + (Math.random() - .5) * 2, c[1] + (Math.random() - .5) * 2]; }
    const m = (typeof MUNI !== "undefined" ? MUNI : []).find(([n, uf]) => nrm(n) === nrm(o.municipio) && (!o.uf || uf === o.uf)); if (m) return [m[2] + (Math.random() - .5) * .08, m[3] + (Math.random() - .5) * .08];
    const u = UF_CENTER[o.uf]; if (u) return [u[0] + (Math.random() - .5) * .8, u[1] + (Math.random() - .5) * .8]; return [-15.8 + (Math.random() - .5), -47.9 + (Math.random() - .5)];
  }
  const existente = o => S.suppliers.find(s => (o.docOk && dig(s.doc) === dig(o.doc)) || nrm(s.nome) === nrm(o.nome));
  const TIPO = {N1:t => (SUP_TYPES.N1.find(x => nrm(x).includes(nrm(t).split(" ")[0])) || (t || "Investidor estratégico")), N2:t => (SUP_TYPES.N2.find(x => nrm(x).includes(nrm(t).split(" ")[0])) || (t || "Parceiro originador")), N3:t => t || "Target · prospecção"};

  function importar(){
    let lido = null;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Kinsey Capital · Base inicial</div><h2>Importar mapa de M&A</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fmp" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <p class="sub" style="margin:0">Planilha com investidores (N1), intermediadores e parceiros (N2) e targets vendedores (N3). Colunas reconhecidas pelo nome: Nível, Nome, CNPJ, Tipo, Segmento, Linhas de negócio, Cidade, UF, País, Contato, Faturamento, EBITDA, Ticket mínimo e máximo, Intermediador, Investidores de interesse, Observações.</p>
        <div class="form"><div class="fld full"><label for="mp-f">Arquivo (Excel, LibreOffice ou CSV)</label><input id="mp-f" type="file" accept=".xlsx,.xlsm,.ods,.csv,.txt"></div><div class="fld full"><label for="mp-p">Ou cole as linhas da planilha (com o cabeçalho)</label><textarea id="mp-p" rows="4"></textarea></div>
        <div class="fld"><label for="mp-nv">Nível para linhas sem nível</label><select id="mp-nv"><option value="N3">N3 · Target (vendedor)</option><option value="N1">N1 · Investidor</option><option value="N2">N2 · Intermediador ou parceiro</option></select></div>
        <label class="check"><input type="checkbox" id="mp-rf" checked> Consultar os CNPJs na Receita Federal depois de importar</label></div>
        <div id="mp-prev"></div><p class="err" id="mp-err" hidden></p>
        <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" class="btn" id="mp-ler">Ler planilha</button><button type="submit" class="btn primary" id="mp-ok" disabled>Importar</button></div></form>`);
    const err = m => { $("#mp-err").textContent = m; $("#mp-err").hidden = !m; };
    const prev = () => { const nv = $("#mp-nv").value, L = lido.L.map(o => ({...o, nivel:o.nivel || nv})), c = l => L.filter(o => o.nivel === l).length;
      $("#mp-prev").innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:8px"><b>${L.length} empresas · ${c("N1")} investidores · ${c("N2")} intermediadores e parceiros · ${c("N3")} targets · ${L.filter(o => o.docOk).length} CNPJs válidos · ${L.filter(existente).length} já na base (serão atualizadas)</b>
        <div class="tbl" style="max-height:320px;overflow:auto"><table><thead><tr><th>Nível</th><th>Empresa</th><th>CNPJ</th><th>Segmento · local</th><th>Ligações</th></tr></thead><tbody>${L.map((o, i) => `<tr><td><select data-mpn="${i}" aria-label="Nível de ${esc(o.nome)}">${["N1","N2","N3"].map(l => `<option ${l === o.nivel ? "selected" : ""}>${l}</option>`).join("")}</select></td>
          <td><b>${esc(o.nome)}</b>${existente(o) ? ` <span class="pill r-pend" style="font-size:10px">na base</span>` : ""}<div class="sub" style="margin:0;font-size:11.5px">${esc(o.tipo || "")}${o.linhas ? " · " + esc(o.linhas) : ""}</div></td>
          <td class="mono" style="font-size:11.5px">${esc(o.doc || "—")} ${o.doc ? (o.docOk ? `<span style="color:var(--ok)">✓</span>` : `<span style="color:var(--bad)" title="CNPJ inválido">✗</span>`) : ""}</td><td style="font-size:12px">${esc([o.segmento, [o.municipio, o.uf].filter(Boolean).join("/"), o.pais].filter(Boolean).join(" · "))}</td>
          <td style="font-size:12px">${esc([o.interm && "via " + o.interm, o.interesse && "interesse: " + o.interesse].filter(Boolean).join(" · "))}</td></tr>`).join("")}</tbody></table></div></div>`;
      $$("[data-mpn]").forEach(x => x.onchange = () => { lido.L[+x.dataset.mpn].nivel = x.value; prev(); }); $("#mp-ok").disabled = false; $("#mp-ok").textContent = `Importar ${L.length} empresas`; };
    $("#mp-nv").onchange = () => lido && prev();
    $("#mp-ler").onclick = async () => { err(""); try{ const f = $("#mp-f").files[0], t = $("#mp-p").value.trim(); let rows;
        if (f){ const n = f.name.toLowerCase(), buf = await f.arrayBuffer(); rows = /\.xlsx$|\.xlsm$/.test(n) ? await IMP.lerXLSX(buf) : /\.ods$/.test(n) ? await IMP.lerODS(buf) : D.csv((() => { let x = new TextDecoder("utf-8").decode(buf); if (x.includes("\uFFFD")) x = new TextDecoder("latin1").decode(buf); return x; })()); }
        else if (t) rows = D.csv(t); else { err("Escolha um arquivo ou cole as linhas."); return; }
        lido = ler(rows); if (!lido.L.length){ err("Nenhuma empresa encontrada."); return; } prev(); }catch(e){ err(e.message || "Não foi possível ler a planilha."); } };
    $("#fmp").onsubmit = async e => { e.preventDefault(); if (!lido) return; const nv = $("#mp-nv").value, L = lido.L.map(o => ({...o, nivel:o.nivel || nv})), rf = $("#mp-rf").checked;
      $("#mp-ok").disabled = true; $("#mp-ok").textContent = "Importando…"; const ids = {}, novos = [];
      for (const o of L){ const ja = existente(o), id = ja?.id || "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), [lat, lng] = ja?.lat != null ? [ja.lat, ja.lng] : coords(o);
        const base = {nivel:o.nivel, nome:o.nome, doc:o.doc || ja?.doc || "", tipo:TIPO[o.nivel](o.tipo), uf:o.uf || ja?.uf || "", municipio:o.municipio || ja?.municipio || "", pais:o.pais || ja?.pais || (o.uf ? "Brasil" : ""), lat, lng, contato:o.contato || ja?.contato || "", origem:"Mapa M&A Kinsey", importadoEm:nowISO()};
        if (o.segmento) base.segmento = o.segmento; if (o.obs) base.obsMapa = o.obs;
        if (o.nivel === "N1") base.tese = {...(ja?.tese || {}), ...(o.segmento ? {segmentos:o.segmento.split(/[,;/]/).map(x => x.trim()).filter(Boolean)} : {}), ...(o.tmin != null ? {ticketMin:o.tmin} : {}), ...(o.tmax != null ? {ticketMax:o.tmax} : {})};
        if (o.nivel === "N3"){ if (o.fat != null || o.ebitda != null) base.fin = {...(ja?.fin || {}), ...(o.fat != null ? {receita:o.fat} : {}), ...(o.ebitda != null ? {ebitda:o.ebitda} : {})};
          if (o.linhas) base.perfil = {...(ja?.perfil || {}), ...(o.segmento ? {segmento:o.segmento} : {}), linhas:o.linhas.split(/[,;/]/).map(x => x.trim()).filter(Boolean).map(nome => ({nome}))}; if (!ja) base.etapa = "mapeada"; }
        if (ja) await Store.update("suppliers", id, base); else await Store.set("suppliers", id, {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), ...base});
        ids[nrm(o.nome)] = id; novos.push({o, id}); }
      const acha = n => ids[nrm(n)] || S.suppliers.find(s => nrm(s.nome) === nrm(n) || nrm(s.nome).includes(nrm(n)))?.id;
      for (const {o, id} of novos){ const p = {};
        if (o.interm){ const pid = acha(o.interm); if (pid && pid !== id) p.parentId = pid; } else if (o.nivel === "N3"){ const kc = S.suppliers.find(s => s.nivel === "N2" && s.tipo === "Kinsey Capital"); if (kc && !supById(id)?.parentId) p.parentId = kc.id; }
        if (o.interesse && o.nivel === "N3"){ const inv = o.interesse.split(/[,;/]/).map(x => acha(x.trim())).filter(Boolean); if (inv.length) p.investidores = [...new Set([...(supById(id)?.investidores || []), ...inv])]; }
        if (Object.keys(p).length) await Store.update("suppliers", id, p); }
      close(); toast(`${novos.length} empresas importadas do mapa de M&A`);
      if (rf) consultar(novos.map(n => n.id)); };
  }
  /* consulta dos CNPJs na Receita, um por vez */
  let rodando = false;
  async function consultar(ids){
    if (rodando || typeof ORG === "undefined") return; const L = (ids || S.suppliers.map(s => s.id)).map(supById).filter(s => s && dig(s.doc).length === 14 && IMP.docValido(s.doc) && !(s.receita && !s.receita.erro)); if (!L.length) return;
    rodando = true; let n = 0, ok = 0; const pill = document.createElement("div"); pill.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:40;background:#0a2b5e;color:#fff;border:1px solid #7fb8e6;border-radius:20px;padding:6px 14px;font-size:12.5px"; document.body.appendChild(pill);
    for (const s of L){ n++; pill.textContent = `Receita Federal: consultando CNPJ ${n} de ${L.length}…`;
      try{ const r = await ORG.receita(s.doc), p = {receita:{...r, cnaesSec:(r.cnaesSec || []).slice(0, 10), em:nowISO()}};
        if (!s.uf && r.uf) p.uf = r.uf; if (!s.pais && r.uf) p.pais = "Brasil"; if (!s.municipio && r.municipio) p.municipio = r.municipio[0] + r.municipio.slice(1).toLowerCase();
        if (r.abertura && !s.abertura) p.abertura = r.abertura; if (r.cnae && !s.cnae) p.cnae = `${r.cnae} · ${r.cnaeDesc || ""}`; if (r.endereco) p.endereco = r.endereco;
        if ((p.uf || p.municipio) && s.origem === "Mapa M&A Kinsey" && (!s.pais || /^bra/i.test(s.pais))){ const [lat, lng] = coords({municipio:p.municipio || s.municipio, uf:p.uf || s.uf}); p.lat = lat; p.lng = lng; }
        await Store.update("suppliers", s.id, p); ok++; }
      catch(e){ await Store.update("suppliers", s.id, {receita:{erro:"Consulta indisponível (" + (e.message || "rede") + ")", tentativa:nowISO()}}); }
      await new Promise(r => setTimeout(r, 1300)); }
    pill.remove(); rodando = false; toast(`Receita Federal: ${ok} de ${L.length} CNPJs consultados`);
  }
  function modelo(){
    const H = ["Nível","Nome","CNPJ","Tipo","Segmento","Linhas de negócio","Cidade","UF","País","Contato","Faturamento (R$ mi)","EBITDA (R$ mi)","Ticket mínimo (R$ mi)","Ticket máximo (R$ mi)","Intermediador","Investidores de interesse","Observações"];
    const R = [["Investidor","Fundo Exemplo Participações","","Private equity","Alimentos; Saúde","","São Paulo","SP","Brasil","nome@exemplo.com","","","40","250","","","Controle ou 100%"],
      ["Intermediador","Assessoria Exemplo","","Parceiro originador","","","Recife","PE","Brasil","","","","","","","","Acordo de originação 20%"],
      ["Target","Indústria Exemplo Ltda.","","Target · mandato de venda","Alimentos","Queijos; Iogurtes","Juiz de Fora","MG","Brasil","","180","22","","","Assessoria Exemplo","Fundo Exemplo Participações","Sócios querem vender 100%"],
      ["Investidor","Exemplo Global Fund LP","","Fundo de investimento","Tecnologia","","Nova York","","Estados Unidos","","","","60","400","","",""]];
    const csv = "﻿" + [H, ...R].map(r => r.map(c => /[;"\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(";")).join("\r\n");
    rptSave(new TextEncoder().encode(csv), "Kinsey_modelo_mapa_MA.csv", "text/csv");
  }
  window.KT_MAPA = {importar, consultar, modelo, ler, coords};
})();
