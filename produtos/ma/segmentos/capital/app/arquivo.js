/* ================= ARQUIVO DO DOSSIÊ: DOCUMENTOS GUARDADOS POR EMPRESA E POR NATUREZA =================
   Cada arquivo importado fica guardado no Storage do Firebase, separado por cliente, por empresa e pela natureza do
   documento, com a data e o nome original:
     evidences/<cliente>/<empresa>_<id>/<natureza>/<AAAA-MM-DD>_<nome original>_<código>.<ext>
   A natureza também fica gravada no registro do documento, e a tela "Arquivo do dossiê" mostra os documentos de cada
   empresa organizados por natureza, com download do dossiê inteiro em .zip, já nas pastas.
   Os arquivos enviados antes desta versão continuam no lugar em que estão (nada é movido nem apagado); na tela e no
   .zip eles aparecem organizados pela natureza do mesmo jeito. */
(() => {
  const NAT = [
    ["01_Financeiro_e_Contabil", "Financeiro e contábil", /relat[oó]rio de auditoria|balan[cç]|balancete|\bdre\b|demonstra[cç]|raz[aã]o|\becd\b|sped cont|fluxo de caixa|di[aá]rio|livro|financ|cont[aá]b/i],
    ["02_Fiscal_e_Tributario", "Fiscal e tributário", /\becf\b|\befd\b|fiscal|tribut|imposto|certid|\bcnd\b|darf|\bguia|icms|\bpis\b|cofins|parcelamento|nota fiscal|sped/i],
    ["03_Trabalhista_e_Previdenciario", "Trabalhista e previdenciário", /trabalh|folha|esocial|fgts|\binss\b|previd|\brais\b|caged|empregad|sindic/i],
    ["04_Societario", "Societário", /contrato social|estatuto|altera[cç][aã]o contratual|\bata\b|ata de|acordo de (s[oó]cios|acionistas|quotistas)|procura[cç]|cart[aã]o cnpj|societ|quadro societ/i],
    ["05_Juridico_e_Contratos", "Jurídico e contratos", /\bnda\b|confidencial|mandato|proposta|\bioi\b|\bloi\b|\bmou\b|\bspa\b|contrato|processo|jur[ií]d|parecer|notifica|a[cç][aã]o judicial/i],
    ["06_Valuation_e_Laudos", "Valuation e laudos", /laudo|valuation|avalia[cç]|viabilidade|plano de neg|proje[cç][aã]o|business plan|or[cç]amento/i],
    ["07_Comercial_e_Apresentacoes", "Comercial e apresentações", /apresenta|teaser|pre-release|comunicado|institucional|cat[aá]logo|comercial|clientes|vendas/i],
    ["08_Ativos_e_Imoveis", "Ativos e imóveis", /matr[ií]cula|escritura|\biptu\b|im[oó]ve|imobilizado|invent[aá]rio|ativo fixo|\bfoto|visita/i]];
  const OUTROS = ["99_Outros", "Outros documentos"];
  const natureza = (tipo, nome, tipoDoc) => { const t = `${tipoDoc || ""} ${tipo || ""}`.trim(), n = String(nome || "");
    return NAT.find(x => x[2].test(t)) || NAT.find(x => x[2].test(n)) || OUTROS; }; /* o tipo reconhecido manda; o nome do arquivo desempata */
  const slug = (t, max = 60) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, max) || "arquivo";
  const pastaEmpresa = sup => { const s = typeof supById === "function" ? supById(sup) : null; return s ? `${slug(s.mandato?.codinome || s.nome, 40)}_${s.id}` : (sup ? `empresa_${slug(sup, 30)}` : "sem_empresa"); };
  /* caminho do arquivo no Storage (usado por Store.upload na versão publicada) */
  window.ktPastaArq = (meta, blob, cid) => {
    const m = meta || {}, nomeOrig = m.nome || blob?.name || "", ext = ((nomeOrig.match(/\.([A-Za-z0-9]{1,6})$/) || [])[1] || (blob?.type || "").split("/")[1] || "bin").toLowerCase().replace("jpeg", "jpg").replace(/[^a-z0-9]/g, "");
    const base = slug(nomeOrig.replace(/\.[A-Za-z0-9]{1,6}$/, ""), 70), dia = new Date().toISOString().slice(0, 10), cod = Math.random().toString(36).slice(2, 7);
    return `evidences/${cid || "sem-cliente"}/${pastaEmpresa(m.sup)}/${natureza(m.tipo, nomeOrig, m.tipoDoc)[0]}/${dia}_${base}_${cod}.${ext}`;
  };
  window.ktNatureza = (tipo, nome, tipoDoc) => { const n = natureza(tipo, nome, tipoDoc); return {pasta:n[0], rot:n[1]}; };
  const natDe = e => e.natureza && [...NAT, OUTROS].find(x => x[0] === e.natureza) || natureza(e.tipo, e.nome, e.tipoDoc);

  /* ---------- tela: arquivo do dossiê, por natureza ---------- */
  function grupos(supId){ const E = S.evidences.filter(e => e.supplierId === supId), G = {};
    E.forEach(e => { const n = natDe(e); (G[n[0]] = G[n[0]] || {rot:n[1], L:[]}).L.push(e); });
    Object.values(G).forEach(g => g.L.sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || ""))));
    return Object.entries(G).sort((a, b) => a[0].localeCompare(b[0])); }
  function abrir(supId){
    const s = supById(supId); if (!s) return; const G = grupos(supId), tot = G.reduce((t, [, g]) => t + g.L.length, 0);
    const dt = v => v ? String(v).slice(0, 10).split("-").reverse().join("/") : "";
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Arquivo do dossiê</div><h2>${esc(s.mandato?.codinome || s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        <p class="sub" style="margin:0">${tot} documento(s) guardado(s), organizados por natureza. Os arquivos ficam no Storage do Firebase, separados por cliente e por empresa, com a data e o nome original; publicar uma nova versão do sistema não mexe neles.</p>
        ${tot ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="ar-zip">Baixar o dossiê organizado (.zip)</button></div><p class="sub" id="ar-st" style="margin:0;font-size:12px" hidden></p>` : `<div class="empty">Nenhum documento importado para esta empresa.</div>`}
        ${G.map(([k, g]) => `<details class="card" style="padding:10px 12px" ${G.length <= 3 ? "open" : ""}><summary style="cursor:pointer"><b>${esc(g.rot)}</b> <span class="sub" style="font-size:12px">· ${g.L.length} documento(s) · pasta ${esc(k)}</span></summary>
          <div class="tbl" style="margin-top:8px"><table><thead><tr><th>Documento</th><th>Tipo</th><th>Importado em</th><th></th></tr></thead><tbody>${g.L.map(e => `<tr><td>${esc(fixMoji(e.nome || "documento"))}</td><td style="font-size:12px">${esc(e.tipo || "")}</td><td style="font-size:12px;white-space:nowrap">${dt(e.criadoEm)}</td><td style="text-align:right"><button type="button" class="btn sm ghost" data-ar="${esc(e.id)}">Abrir</button></td></tr>`).join("")}</tbody></table></div></details>`).join("")}
      </div>`);
    $$("#layer [data-x]").forEach(b => b.onclick = close);
    $$("#layer [data-ar]").forEach(b => b.onclick = async () => { const e = S.evidences.find(x => x.id === b.dataset.ar); if (!e) return; b.disabled = true;
      try{ const bl = await ktBaixar(e), u = URL.createObjectURL(bl); window.open(u, "_blank", "noopener"); setTimeout(() => URL.revokeObjectURL(u), 60000); }catch(x){ toast("Não foi possível abrir: " + (x.message || "erro")); } b.disabled = false; });
    const z = $("#ar-zip"); if (z) z.onclick = async () => { z.disabled = true; const st = $("#ar-st"); st.hidden = false; const F = [], falhas = [], raiz = pastaEmpresa(supId), usados = new Set(); let n = 0;
      for (const [k, g] of G) for (const e of g.L){ st.textContent = `Preparando ${++n}/${tot}…`;
        try{ const bl = await ktBaixar(e); let nm = slug(fixMoji(e.nome || "documento"), 90); if (!/\.[a-z0-9]{1,6}$/i.test(nm)) nm += "." + ((e.mime || bl.type || "").split("/")[1] || "bin").replace("jpeg", "jpg");
          let p = `${raiz}/${k}/${(e.criadoEm || "").slice(0, 10)}_${nm}`; while (usados.has(p)) p = p.replace(/(\.[^.]+)$/, "_2$1"); usados.add(p);
          F.push([p, new Uint8Array(await bl.arrayBuffer())]); }catch(x){ falhas.push(`${e.nome || e.id}: ${x.message || "erro"}`); } }
      if (falhas.length) F.push([`${raiz}/LEIA-ME_arquivos_nao_baixados.txt`, new TextEncoder().encode("Arquivos que não puderam ser baixados agora (continuam guardados no sistema):\r\n" + falhas.join("\r\n"))]);
      const a = document.createElement("a"), u = URL.createObjectURL(new Blob([KT_XLSX.zip(F)], {type:"application/zip"})); a.href = u; a.download = `Dossie_${raiz}.zip`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 60000);
      st.textContent = `${F.length - (falhas.length ? 1 : 0)} documento(s) no .zip${falhas.length ? ` · ${falhas.length} não baixado(s) agora (listados no LEIA-ME)` : ""}.`; z.disabled = false; };
  }
  window.KT_ARQUIVO = {abrir, grupos, natureza:window.ktNatureza};
})();
