/* ================= KINSEY CAPITAL · WORKBOOKS DE DILIGÊNCIA =================
   1) Workbook de Due Diligence (Excel do auditor ou consultor): o sistema lê todas as abas e reconhece pelos cabeçalhos
      ajustes (EBITDA, dívida, capital de giro, PL, lucro), exposições (principal, mínimo, máximo, avaliação),
      conferências (procedimento, situação, conclusão) e pontos e recomendações. Os ajustes vão para as Análises
      financeiras, as exposições para a aba Exposições e o relatório passa de "prévio" (balancetes e informações do
      sistema) para "completo" (workbook do auditor). Reimportar substitui a versão anterior do workbook.
   2) Workbook de diligência jurídica: gerado pelo sistema conforme o segmento e os riscos do setor (questionário,
      documentos, contratos, processos e matriz de riscos setoriais); o jurídico preenche e importa de volta.
   3) Relatório completo de DD: painel executivo, red flags por gravidade, impacto na negociação (preço, retenção,
      mecanismo de capital de giro e proteções do SPA) e anexos do workbook. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  /* ---------------- Excel: todas as abas ---------------- */
  async function planilhas(buf){
    const z = await IMP.unzip(buf), X = async n => z[n] ? new DOMParser().parseFromString(await z[n].get(), "application/xml") : null, by = (d, t) => [...d.getElementsByTagName(t)];
    const ss = [], sx = await X("xl/sharedStrings.xml"); if (sx) by(sx, "si").forEach(si => ss.push(by(si, "t").map(t => t.textContent).join("")));
    const wb = await X("xl/workbook.xml"), rel = await X("xl/_rels/workbook.xml.rels"), R = {}, out = {}; if (!wb || !rel) throw new Error("Arquivo Excel inválido.");
    by(rel, "Relationship").forEach(r => R[r.getAttribute("Id")] = r.getAttribute("Target"));
    const col = r => { let c = 0; for (const ch of r.match(/^[A-Z]+/)[0]) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
    for (const sh of by(wb, "sheet")){ const t = R[sh.getAttribute("r:id")]; if (!t) continue; const d = await X("xl/" + t.replace(/^\/?xl\//, "")); if (!d) continue; const rows = [];
      by(d, "row").forEach(row => { const a = []; by(row, "c").forEach(c => { const ty = c.getAttribute("t"), v = by(c, "v")[0]?.textContent ?? ""; a[col(c.getAttribute("r"))] = ty === "s" ? ss[+v] ?? "" : ty === "inlineStr" ? by(c, "t").map(x => x.textContent).join("") : v; });
        rows[+row.getAttribute("r") - 1] = Array.from(a, x => (x ?? "").toString().trim()); });
      out[sh.getAttribute("name")] = Array.from(rows, r => r || []); }
    return out;
  }
  const numBR = v => { let t = String(v ?? "").trim(); if (!t || t === "-" || /^n\/?[aqc]/i.test(t)) return null; const neg = /^\(.*\)$/.test(t) || /^-/.test(t); t = t.replace(/[R$\s()%-]/g, "");
    if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); else t = t.replace(/,/g, ""); const n = parseFloat(t); return isFinite(n) ? (neg ? -n : n) : null; };
  /* cabeçalho: primeira linha (até a 15ª) com 3+ células de texto */
  const cab = rows => { for (let i = 0; i < Math.min(15, rows.length); i++){ const r = rows[i] || []; if (r.filter(c => c && isNaN(numBR(c) ?? NaN)).length >= 3) return i; } return -1; };
  const ix = (H, re) => H.findIndex(h => re.test(h));
  const AREA = t => { const x = nrm(t); return /trab/.test(x) ? "trabalhista" : /previd|inss|fgts/.test(x) ? "previdenciaria" : /trib|fisc|imposto/.test(x) ? "tributaria" : /jur|legal|civ/.test(x) ? "legal" : /cont[aá]b|contab/.test(x) ? "contabil" : /financ/.test(x) ? "financeira" : ""; };
  const AVAL = t => { const x = nrm(t); return /prov/.test(x) ? "provavel" : /poss/.test(x) ? "possivel" : /remot/.test(x) ? "remota" : "nq"; };
  const MESES = {jan:"01", fev:"02", mar:"03", abr:"04", mai:"05", jun:"06", jul:"07", ago:"08", set:"09", out:"10", nov:"11", dez:"12"};
  function perDe(t){ const x = nrm(t); let m = x.match(/(19|20)\d\d[-_/.](0[1-9]|1[0-2])/); if (m) return `${m[0].slice(0, 4)}-${m[2]}`;
    m = x.match(/(0?[1-9]|1[0-2])[-_/.]((19|20)\d\d)/); if (m) return `${m[2]}-${String(m[1]).padStart(2, "0")}`;
    m = x.match(/(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*[-_/. ]*((19|20)?\d\d)\b/); if (m){ const y = m[2].length === 2 ? "20" + m[2] : m[2]; return `${y}-${MESES[m[1]]}`; }
    m = x.match(/\b((19|20)\d\d)\b/); return m ? `${m[1]}-12` : ""; }
  function lerWorkbookDD(P, perPadrao){
    const out = {ajustes:[], expo:[], conf:[], pontos:[], bal:{}, abas:{}};
    for (const [nome, rows] of Object.entries(P)){
      if (/balancete|balan[cç]o|trial|razao/i.test(nome)){ const per = perDe(nome) || perDe((rows[0] || []).join(" ")) || perDe((rows[1] || []).join(" "));
        try{ const contas = D.lerTabela(rows), hi = rows.findIndex(r => (r || []).some(c => /^grupo/i.test(String(c ?? "").trim())));
          if (hi >= 0){ const h = rows[hi].map(c => nrm(c)), ig = h.findIndex(c => /^grupo/.test(c)), ic = h.findIndex(c => /^conta|^codigo/.test(c)), G = {};
            rows.slice(hi + 1).forEach(r => { const g = String(r?.[ig] ?? "").trim(); if (g && r?.[ic] != null) G[String(r[ic]).trim()] = g; });
            contas.forEach(c => { const g = G[String(c[0]).trim()]; if (g) c[3] = g; }); }
          if (per && contas.length){ out.bal[per] = contas; out.abas[nome] = `balancete ${per} (${contas.length} contas)`; continue; } }catch(e){} }
      const h = cab(rows); if (h < 0){ out.abas[nome] = "sem tabela"; continue; } const H = rows[h].map(c => nrm(c)), L = rows.slice(h + 1).filter(r => r && r.some(c => c));
      const cDesc = ix(H, /descri|ajuste|item|ponto|achado|risco|conting|exposi|procedimento|teste|assunto|t[ií]tulo/), cArea = ix(H, /^[aá]rea|area|disciplina|natureza/);
      const tem = re => ix(H, re) >= 0, mil = H.some(h => /mr\$|mil|000/.test(h)) ? 1 : 1e-3; /* exposições em MR$ */
      if ((tem(/m[ií]n/) && tem(/m[aá]x/)) || (tem(/principal/) && tem(/avalia|progn|probab|classif/))){
        const c = {mn:ix(H, /m[ií]n/), mx:ix(H, /m[aá]x/), q:ix(H, /qualif/), p:ix(H, /principal|valor original|base/), a:ix(H, /avalia|progn|probab|classif/), i:ix(H, /de$|in[ií]cio|ano ini|per[ií]odo/), f:ix(H, /at[eé]$|fim|ano fim/), sit:ix(H, /situa|status/), ref:ix(H, /^ref/)};
        L.forEach(r => { const t = r[cDesc] || r[0]; if (!t || /^total/i.test(t)) return; const v = k => c[k] >= 0 ? numBR(r[c[k]]) : null;
          out.expo.push({ref:c.ref >= 0 ? String(r[c.ref] || "").trim() : "", excl:c.sit >= 0 && SIT_EXCL.test(r[c.sit] || ""), titulo:t, area:AREA(r[cArea]) || AREA(nome) || "tributaria", aval:c.a >= 0 ? AVAL(r[c.a]) : "nq", principal:v("p") != null ? v("p") * (mil === 1 ? 1000 : 1) : null, min:v("mn") != null ? v("mn") * mil : null, max:v("mx") != null ? v("mx") * mil : null, qual:v("q") != null ? v("q") * mil : null, anoIni:+(String(r[c.i] || "").match(/(19|20)\d\d/) || [])[0] || null, anoFim:+(String(r[c.f] || "").match(/(19|20)\d\d/) || [])[0] || null}); });
        out.abas[nome] = `exposições (${out.expo.length})`; continue; }
      if (tem(/ebitda|d[ií]vida|capital de giro|ncg|patrim|lucro/) || (tem(/ajuste/) && tem(/valor|impacto|efeito/))){
        const c = {eb:ix(H, /ebitda/), dv:ix(H, /d[ií]vida|debt/), ncg:ix(H, /capital de giro|ncg|working/), pl:ix(H, /patrim|^pl$/), ll:ix(H, /lucro/), val:ix(H, /valor|impacto|efeito/), tipo:ix(H, /tipo|natureza|classif/), per:ix(H, /per[ií]odo|data|exerc|ano/), sit:ix(H, /situa|status/), ref:ix(H, /^ref/)};
        L.forEach(r => { const t = r[cDesc] || r[0]; if (!t || /^total/i.test(t)) return; const g = k => c[k] >= 0 ? numBR(r[c[k]]) : null, v = {};
          if (g("eb") != null) v.ebitda = g("eb"); if (g("dv") != null) v.divida = g("dv"); if (g("ncg") != null) v.ncg = g("ncg"); if (g("pl") != null) v.pl = g("pl"); if (g("ll") != null) v.lucro = g("ll");
          if (!Object.keys(v).length && g("val") != null){ const tp = nrm(r[c.tipo] || t); v[/d[ií]vida|debt|parcel|passivo/.test(tp) ? "divida" : /giro|ncg|estoque|receb/.test(tp) ? "ncg" : /patrim|^pl|contab/.test(tp) ? "pl" : "ebitda"] = g("val"); }
          const ref = c.ref >= 0 ? String(r[c.ref] || "").trim() : "", excl = c.sit >= 0 && SIT_EXCL.test(r[c.sit] || "");
          if (!Object.keys(v).length && !(ref && excl)) return; const pr = String(r[c.per] || ""), y = (pr.match(/(19|20)\d\d/) || [])[0], m = (pr.match(/(?:^|\D)(0[1-9]|1[0-2])(?:\D|$)/) || [])[1];
          out.ajustes.push({titulo:t, area:AREA(r[cArea]) || AREA(nome) || "financeira", v, per:y ? `${y}-${m || "12"}` : perPadrao, tipo:r[c.tipo] || "Workbook do auditor", ref, excl}); });
        out.abas[nome] = `ajustes (${out.ajustes.length})`; continue; }
      if (tem(/recomenda/)){ const cr = ix(H, /recomenda/), cg = ix(H, /risco|gravid|criticid|prioridade|impacto/), cs = ix(H, /situa|status/);
        L.forEach(r => { const t = r[cDesc] || r[0]; if (!t || (cs >= 0 && SIT_EXCL.test(r[cs] || ""))) return; out.pontos.push({area:AREA(r[cArea]) || AREA(nome), ponto:t, recomendacao:r[cr] || "", gravidade:nrm(r[cg] || "")}); }); out.abas[nome] = `pontos e recomendações (${out.pontos.length})`; continue; }
      if (tem(/procedimento|teste|confer|check/) && tem(/status|situa|conclus|resultado|ok/)){ const cs = ix(H, /status|situa|ok/), cc = ix(H, /conclus|resultado|coment|observa/), cref = ix(H, /ref|pt|papel/);
        L.forEach(r => { const t = r[ix(H, /procedimento|teste|confer|check/)]; if (!t) return; out.conf.push({area:AREA(r[cArea]) || AREA(nome), proc:t, status:r[cs] || "", conclusao:cc >= 0 ? r[cc] || "" : "", ref:cref >= 0 ? r[cref] || "" : ""}); }); out.abas[nome] = `conferências (${out.conf.length})`; continue; }
      out.abas[nome] = "não reconhecida";
    }
    return out;
  }
  async function importarDD(s, f){
    const P = await planilhas(await f.arrayBuffer()), per0 = [...D.periodos(s)].sort().pop() || "", W0 = lerWorkbookDD(P, per0), per = Object.keys(W0.bal).sort().pop() || per0, W = per === per0 ? W0 : lerWorkbookDD(P, per), nb = Object.keys(W.bal).length, n = W.ajustes.length + W.expo.length + W.conf.length + W.pontos.length + nb;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Workbook de Due Diligence · ${esc(s.nome)}</div><h2>${esc(f.name)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><div class="dd-kpis"><div class="dd-k"><span>Balancetes</span><b>${nb}</b><small>${nb ? "substituem os do cadastro" : "mantidos os do cadastro"}</small></div><div class="dd-k"><span>Ajustes</span><b>${W.ajustes.length}</b><small>vão para as Análises</small></div><div class="dd-k"><span>Exposições</span><b>${W.expo.length}</b><small>mín., máx., avaliação</small></div><div class="dd-k"><span>Conferências</span><b>${W.conf.length}</b><small>procedimentos</small></div><div class="dd-k"><span>Pontos</span><b>${W.pontos.length}</b><small>e recomendações</small></div></div>
      <div class="tbl"><table><thead><tr><th>Aba</th><th>Leitura</th></tr></thead><tbody>${Object.entries(W.abas).map(([a, t]) => `<tr><td>${esc(a)}</td><td class="${/não|sem/.test(t) ? "sub" : ""}">${esc(t)}</td></tr>`).join("")}</tbody></table></div>
      <p class="sub" style="margin:0">${n ? "Ao confirmar, o workbook substitui a importação anterior e o relatório de due diligence passa a ser emitido como completo." : "Nenhuma aba reconhecida: confira se as tabelas têm cabeçalho (descrição, valor, mínimo, máximo, status…)."}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button>${n ? `<button type="button" class="btn primary" id="wb-ok">Importar</button>` : ""}</div></div>`);
    const ok = $("#wb-ok"); if (ok) ok.onclick = async () => { ok.disabled = true; const ant = s.dd?.wb || {}, aj = {}, ex = {}, agora = nowISO(), por = Store.me?.email || "";
      (ant.ajIds || []).forEach(id => aj[id] = null); (ant.exIds || []).forEach(id => ex[id] = {excluido:true});
      const EFK = ["ebitda", "divida", "ncg", "pl", "lucro"], cheio = v => Object.fromEntries(EFK.map(k => [k, +v?.[k] || 0])), antAj = new Set(ant.ajIds || []), antEx = new Set(ant.exIds || []);
      const ehSis = ref => /@\d{4}-\d{2}$/.test(ref), ehMan = ref => ref && s.dd?.aj?.[ref] && !antAj.has(ref);
      W.ajustes = W.ajustes.filter(a => { /* linhas do sistema: confirmam, alteram ou excluem o ajuste de origem */
        if (a.ref && ehSis(a.ref)){ aj[a.ref] = {v:a.excl ? cheio({}) : cheio(a.v), wb:{arquivo:f.name, em:agora, excl:!!a.excl}}; return false; }
        if (a.ref && ehMan(a.ref)){ aj[a.ref] = a.excl ? null : {...s.dd.aj[a.ref], v:cheio(a.v), titulo:a.titulo}; return false; }
        return !a.excl; });
      W.expo = W.expo.filter(e => { if (e.ref && s.dd?.expo?.[e.ref] && !antEx.has(e.ref)){ const {ref, excl, ...rest} = e; ex[e.ref] = excl ? {excluido:true} : {...s.dd.expo[e.ref], ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v != null && v !== ""))}; return false; } return !e.excl; });
      W.expo.forEach(e => { delete e.ref; delete e.excl; }); W.ajustes.forEach(a => { delete a.ref; delete a.excl; });
      const ajIds = W.ajustes.map((a, i) => { const id = "wb" + Date.now().toString(36) + i; aj[id] = {manual:true, per:a.per || per, area:a.area, titulo:a.titulo, norma:"Workbook do auditor", tipo:a.tipo, v:a.v, desc:`Importado de ${f.name}`, criadoEm:agora, por, fonte:"workbook"}; return id; });
      const exIds = W.expo.map((e, i) => { const id = "wbx" + Date.now().toString(36) + i; ex[id] = {...e, obs:`Workbook ${f.name}`, em:agora, por, fonte:"workbook"}; return id; });
      const bal = {}, balOrig = {}; Object.entries(W.bal).forEach(([p, contas]) => { const atual = s.dd?.bal?.[p], m = +p.slice(5, 7), y = +p.slice(0, 4);
        if (atual && atual.origem !== "workbook" && !s.dd?.balOrig?.[p]) balOrig[p] = atual;
        bal[p] = {dataBase:`${p}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`, meses:atual?.meses || m, contas, importadoEm:agora, por, arquivo:f.name, origem:"workbook"}; });
      await D.up(s, {dd:{aj, expo:ex, ...(Object.keys(bal).length ? {bal, balOrig} : {}), wb:{arquivo:f.name, em:agora, por, abas:W.abas, conf:W.conf, pontos:W.pontos, ajIds, exIds, balancetes:Object.keys(bal)}}}); close(); toast(`Workbook importado: ${W.ajustes.length} ajuste(s), ${W.expo.length} exposição(ões)`); renderView(); };
  }
  /* ---------------- riscos setoriais (diligência jurídica) ---------------- */
  const SETORES = [
    [/sa[uú]de|hospital|cl[ií]nic|medicament|farm|86|21|4644|4771/, "Saúde e medicamentos", {riscos:[["Licença sanitária, AFE/AE da ANVISA e responsável técnico", "Lei 6.360/76; RDC ANVISA 16/2014", "Autuação, interdição e perda de contratos"], ["Rastreabilidade e guarda de medicamentos controlados", "Portaria SVS/MS 344/98", "Infração sanitária e criminal"], ["Responsabilidade civil por erro ou produto", "CDC arts. 12 e 14", "Indenizações"], ["Contratos com o SUS, planos de saúde e licitações", "Lei 14.133/21; ANS", "Glosas e rescisão"], ["Proteção de dados de saúde (dado sensível)", "LGPD art. 11", "Sanções da ANPD"]], docs:["AFE/AE da ANVISA", "Licença sanitária de cada unidade", "Certificado de responsabilidade técnica (CRF/CRM)", "Relação de contratos com operadoras e órgãos públicos"]}],
    [/terceiriz|m[aã]o de obra|tempor[aá]ri|facilities|limpeza|vigil|seguran[cç]a privada|78|80|81/, "Serviços e terceirização de mão de obra", {riscos:[["Responsabilidade subsidiária e solidária perante os tomadores", "Lei 6.019/74; Súmula 331 do TST", "Condenações trabalhistas e retenções de pagamentos"], ["Reconhecimento de vínculo e pejotização", "CLT arts. 2º, 3º e 9º", "Passivo trabalhista e previdenciário"], ["Registro de empresa de trabalho temporário e autorização da PF (vigilância)", "Lei 6.019/74; Lei 7.102/83", "Impedimento de operar"], ["Repactuação e reajuste de contratos públicos", "Lei 14.133/21", "Desequilíbrio econômico-financeiro"], ["Acidentes de trabalho, NR e insalubridade", "CLT; NRs do MTE", "Indenizações e FAP"]], docs:["Registro no Ministério do Trabalho", "Contratos com tomadores (cláusulas de retenção e responsabilidade)", "Convenções coletivas aplicáveis", "CNDT e certidões do FGTS"]}],
    [/ind[uú]stri|fabric|qu[ií]mic|metal|pl[aá]stic|t[eê]xtil|1[0-9]|2[0-9]|3[0-3]/, "Indústria", {riscos:[["Licença ambiental de operação e outorgas", "Lei 6.938/81; CONAMA 237/97", "Embargo e multas"], ["Passivo ambiental e áreas contaminadas", "Lei 9.605/98; CONAMA 420/09", "Remediação e responsabilidade solidária"], ["Segurança do trabalho (NR-12, insalubridade)", "NRs do MTE", "Interdição de máquinas e indenizações"], ["Benefícios fiscais estaduais condicionados", "LC 160/17", "Cobrança retroativa de ICMS"], ["Propriedade industrial (patentes, processos)", "Lei 9.279/96", "Perda de exclusividade"]], docs:["LO e outorgas vigentes", "Laudos ambientais e de áreas contaminadas", "Laudos de NR-12 e PPRA/PGR", "Termos de acordo de benefícios fiscais"]}],
    [/aliment|bebida|latic|frigor|10|11/, "Alimentos e bebidas", {riscos:[["Registro no MAPA (SIF/SIE) ou ANVISA e rotulagem", "Lei 1.283/50; RDC 429/20", "Recolhimento de produtos"], ["Recall e responsabilidade pelo produto", "CDC art. 12", "Indenizações e dano de imagem"], ["Licença ambiental (efluentes)", "Lei 6.938/81", "Multas e embargos"], ["Contratos com grandes redes (rebaixas, verbas)", "Código Civil", "Glosas e perda de margem"]], docs:["Registros de produtos e estabelecimentos", "Laudos de rotulagem", "Contratos com redes de varejo", "Licença ambiental"]}],
    [/varej|com[eé]rcio|loja|atacad|4[5-7]/, "Comércio e varejo", {riscos:[["Relação de consumo (Procon, recall, garantia)", "CDC", "Multas e indenizações"], ["Locações das lojas (renovatória, luvas, CTO)", "Lei 8.245/91", "Perda de pontos comerciais"], ["Substituição tributária e créditos de ICMS", "LC 87/96", "Autuações"], ["Franquias e distribuição", "Lei 13.966/19", "Rescisões e disputas"]], docs:["Contratos de locação das lojas", "Relatórios do Procon e consumidor.gov", "Contratos de franquia/distribuição"]}],
    [/tecnolog|software|saas|internet|dados|62|63/, "Tecnologia e software", {riscos:[["Titularidade do código e cessão de direitos dos desenvolvedores", "Lei 9.609/98", "Disputa de propriedade do produto"], ["Licenças de terceiros e open source", "Lei 9.610/98", "Violação de licença"], ["Proteção de dados e incidentes", "LGPD", "Sanções e indenizações"], ["Contratos SaaS (SLA, limitação de responsabilidade)", "Código Civil", "Multas contratuais"], ["Contratação de desenvolvedores PJ", "CLT", "Passivo trabalhista"]], docs:["Contratos de cessão de direitos dos desenvolvedores", "Inventário de licenças de software", "Política de privacidade e registro de operações (LGPD)", "Contratos-padrão com clientes"]}],
    [/log[ií]stic|transport|armaz|49|52/, "Logística e transporte", {riscos:[["RNTRC/ANTT e licenças", "Lei 11.442/07", "Impedimento de operar"], ["Agregados e motoristas autônomos (vínculo)", "Lei 11.442/07; CLT", "Passivo trabalhista"], ["Responsabilidade por carga e acidentes", "Código Civil", "Indenizações"], ["Frota com alienação fiduciária", "Lei 9.514/97", "Restrição de ativos"]], docs:["RNTRC e apólices de seguro de carga", "Contratos com agregados", "Relação da frota e gravames"]}],
    [/constru|imobili|incorpor|engenharia|41|42|43|68/, "Construção e imobiliário", {riscos:[["Regularidade dos imóveis (matrícula, ônus, habite-se)", "Lei 6.015/73", "Inviabilidade de venda"], ["Patrimônio de afetação e distratos", "Lei 10.931/04; Lei 13.786/18", "Devoluções a compradores"], ["Responsabilidade técnica e vícios construtivos", "CC art. 618", "Indenizações por 5 anos"], ["Licenças ambientais e urbanísticas", "Estatuto da Cidade", "Embargos de obras"]], docs:["Matrículas atualizadas", "Alvarás, habite-se e licenças", "Contratos com adquirentes", "Laudos técnicos"]}],
    [/agro|rural|fazend|gr[aã]o|01|02|03/, "Agronegócio", {riscos:[["Regularidade fundiária e CAR", "Lei 12.651/12", "Restrições de crédito e embargo"], ["Áreas embargadas e desmatamento", "Lei 9.605/98", "Bloqueio comercial"], ["Trabalho rural e lista suja", "Lei 5.889/73", "Restrições comerciais"], ["CPR e garantias sobre a safra", "Lei 8.929/94", "Execução de garantias"]], docs:["CAR e georreferenciamento", "Matrículas e contratos de arrendamento", "Certidões do IBAMA", "CPRs emitidas"]}],
    [/educa|escola|ensino|85/, "Educação", {riscos:[["Credenciamento no MEC e notas de avaliação", "Lei 9.394/96", "Descredenciamento"], ["FIES e programas públicos", "Lei 10.260/01", "Bloqueio de repasses"], ["Relação de consumo com alunos", "CDC", "Ações coletivas"]], docs:["Atos de credenciamento", "Contratos com alunos", "Termos do FIES/PROUNI"]}],
    [/energ|el[eé]tric|solar|35/, "Energia", {riscos:[["Outorgas e autorizações da ANEEL", "Lei 9.427/96", "Perda de autorização"], ["Contratos de compra e venda de energia", "CCEE", "Penalidades de lastro"], ["Licença ambiental", "Lei 6.938/81", "Embargos"]], docs:["Outorgas ANEEL", "Contratos de energia", "Licenças ambientais"]}],
    [/financ|cr[eé]dito|seguro|banc|64|65|66/, "Serviços financeiros", {riscos:[["Autorização do Banco Central, SUSEP ou CVM", "Lei 4.595/64", "Impedimento de operar"], ["Prevenção à lavagem de dinheiro", "Lei 9.613/98", "Sanções do COAF/BACEN"], ["Relação de consumo e superendividamento", "CDC; Lei 14.181/21", "Ações coletivas"]], docs:["Autorizações regulatórias", "Política de PLD/FT", "Relatórios do regulador"]}]];
  const GERAL = {riscos:[["Passivo trabalhista e terceirização", "CLT; Súmula 331 do TST", "Condenações"], ["Contingências tributárias e sucessão", "CTN arts. 132 e 133", "Autuações herdadas pelo comprador"], ["Proteção de dados (LGPD)", "Lei 13.709/18", "Sanções da ANPD"], ["Contratos relevantes com mudança de controle", "Código Civil", "Perda de clientes ou vencimento antecipado"]], docs:["Contrato social e alterações", "Certidões negativas", "Relação de contratos e processos"]};
  function setor(s){ const t = nrm([s.perfil?.segmento, s.segmento, s.receita?.cnaeDesc].join(" ")) + " " + String(s.receita?.cnae || "").replace(/\D/g, "").slice(0, 4);
    const x = SETORES.find(([re]) => re.test(t)); return x ? {nome:x[1], ...x[2]} : {nome:"Geral", ...GERAL}; }
  /* workbook jurídico gerado pelo sistema */
  async function workbookJur(s){
    const J = KT_JDD, St = setor(s), q = s.jdd?.q || {}, H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), nome = s.mandato?.codinome || s.nome;
    const abas = [
      {nome:"Instruções", larguras:[110], linhas:[[T(`Workbook de diligência jurídica · ${nome}`)], [`Setor: ${St.nome}. Preencha as abas e importe o arquivo de volta no Jurídico do KinseyTec (Diligência jurídica · Importar workbook).`], ["Respostas: Sim, Não ou N/A. Prognóstico: Provável, Possível ou Remota. Valores em R$."], ["As respostas preenchidas pelo sistema podem ser revistas; o que o advogado preencher prevalece."]]},
      {nome:"Questionário", larguras:[8, 22, 70, 12, 50, 30], linhas:[[H("ID"), H("Grupo"), H("Pergunta"), H("Resposta"), H("Observação"), H("Documento esperado")], ...J.QS.map(x => [x.id, x.g, x.t, {sim:"Sim", nao:"Não", na:"N/A"}[q[x.id]?.v] || "", q[x.id]?.n || "", x.doc || ""]), ...St.riscos.map(([r], i) => [`set${i + 1}`, `Setor · ${St.nome}`, `${r}: há pendência ou risco identificado?`, {sim:"Sim", nao:"Não", na:"N/A"}[q["set" + (i + 1)]?.v] || "", q["set" + (i + 1)]?.n || "", ""])]},
      {nome:"Documentos", larguras:[50, 14, 40], linhas:[[H("Documento"), H("Recebido"), H("Observação")], ...[...St.docs, ...GERAL.docs].filter((x, i, a) => a.indexOf(x) === i).map(d => [d, "", ""])]},
      {nome:"Contratos", larguras:[30, 22, 12, 12, 14, 12, 12, 12, 12, 12, 40], linhas:[[H("Contraparte"), H("Tipo"), H("Início"), H("Fim"), H("Valor (R$)"), H("Mudança de controle"), H("Exclusividade"), H("Não concorrência"), H("Multa rescisória"), H("Garantias"), H("Observação")], ...J.contratos(s).map(c => [c.contraparte || "", c.tipo || "", c.assinatura || "", c.fim || "", c.valor || "", c.flags.coc ? "Sim" : "", c.flags.excl ? "Sim" : "", c.flags.nc ? "Sim" : "", c.flags.multa ? "Sim" : "", c.flags.gar ? "Sim" : "", c.obs || ""])]},
      {nome:"Processos", larguras:[24, 14, 44, 14, 14, 14, 40], linhas:[[H("Número"), H("Área"), H("Objeto"), H("Valor (R$)"), H("Prognóstico"), H("Provisão (R$)"), H("Observação")], ...Object.values(s.jdd?.pr || {}).filter(Boolean).map(p => [p.numero || "", p.area || "", p.objeto || "", +p.valor || "", {provavel:"Provável", possivel:"Possível", remota:"Remota"}[p.prog] || "", +p.provisao || "", p.obs || ""])]},
      {nome:"Riscos do setor", larguras:[50, 34, 34, 14, 14, 44], linhas:[[H("Risco"), H("Base legal"), H("Consequência"), H("Probabilidade"), H("Impacto"), H("Conclusão e recomendação")], ...St.riscos.map(([r, b, c]) => [r, b, c, "", "", ""])]}];
    await rptSave(KT_XLSX.gerar(abas), KT_REL.arq(s, "workbook_diligencia_juridica", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  async function importarJur(s, f){
    const P = await planilhas(await f.arrayBuffer()), aba = re => P[Object.keys(P).find(n => re.test(nrm(n)))] || [], up = {jdd:{q:{}, ct:{}, pr:{}}}, agora = nowISO(), por = Store.me?.email || ""; let nq = 0, nc = 0, np = 0;
    const tab = rows => { const h = cab(rows); return h < 0 ? {H:[], L:[]} : {H:rows[h].map(nrm), L:rows.slice(h + 1).filter(r => r && r.some(c => c))}; };
    { const {H, L} = tab(aba(/question/)), ci = ix(H, /^id$/), cr = ix(H, /resposta/), co = ix(H, /observa/);
      L.forEach(r => { const id = r[ci], v = nrm(r[cr]); if (!id || !v) return; up.jdd.q[id] = {v:/^s/.test(v) ? "sim" : /^n[aã]o/.test(v) ? "nao" : /n\/?a/.test(v) ? "na" : "", n:r[co] || "", manual:true, auto:false, fonte:"workbook jurídico", em:agora, por}; nq++; }); }
    { const {H, L} = tab(aba(/contrato/)), g = re => ix(H, re), S_ = (r, re) => /^s/i.test(r[g(re)] || "");
      L.forEach((r, i) => { if (!r[g(/contraparte/)]) return; up.jdd.ct["wbj" + Date.now().toString(36) + i] = {contraparte:r[g(/contraparte/)], tipo:r[g(/tipo/)] || "", assinatura:r[g(/in[ií]cio/)] || "", fim:r[g(/^fim/)] || "", valor:r[g(/valor/)] || "", obs:r[g(/observa/)] || "", flags:{coc:S_(r, /mudan/), excl:S_(r, /exclusiv/), nc:S_(r, /concorr/), multa:S_(r, /multa/), gar:S_(r, /garant/)}, fonte:"workbook jurídico", em:agora}; nc++; }); }
    { const {H, L} = tab(aba(/process/)), g = re => ix(H, re);
      L.forEach((r, i) => { if (!r[g(/n[uú]mero|objeto/)]) return; up.jdd.pr["wbp" + Date.now().toString(36) + i] = {numero:r[g(/n[uú]mero/)] || "", area:r[g(/[aá]rea/)] || "", objeto:r[g(/objeto/)] || "", valor:numBR(r[g(/^valor/)]) || 0, prog:AVAL(r[g(/progn/)]).replace("nq", "possivel"), provisao:numBR(r[g(/provis/)]) || 0, obs:r[g(/observa/)] || "", fonte:"workbook jurídico"}; np++; }); }
    { const {H, L} = tab(aba(/riscos/)); up.jdd.setor = {em:agora, riscos:L.map(r => ({risco:r[0], base:r[1], consequencia:r[2], prob:r[ix(H, /probab/)] || "", impacto:r[ix(H, /impacto/)] || "", conclusao:r[ix(H, /conclus/)] || ""}))}; }
    await D.up(s, up); toast(`Workbook jurídico importado: ${nq} resposta(s), ${nc} contrato(s), ${np} processo(s)`); renderView(); if (typeof renderJuridico === "function") renderJuridico();
  }
  /* ---------------- relatório completo de DD: seções adicionais ---------------- */
  function contexto(s, per){
    const b = s.dd.bal[per], K = D.calc(b), AJ = D.ajustes(s, per).filter(D.okFin), A = D.soma(AJ), ate = +(String(b.dataBase).slice(0, 4));
    const EX = (window.KT_EXP ? KT_EXP.lista(s) : []).map(e => ({e, c:KT_EXP.calc(e, ate)}));
    let mult = null, ev = null; try{ const R = KT_VAL.resumo(s); if (R.rec && R.X?.bp?.eb){ ev = (R.rec[0] + R.rec[1]) / 2; mult = ev / R.X.bp.eb; } }catch(e){} if (!mult || !isFinite(mult) || mult <= 0) mult = 6;
    return {b, K, AJ, A, EX, mult, ev:ev || (K.ebitda + A.ebitda) * mult, wb:s.dd?.wb};
  }
  function flags(s, per, C){
    const L = [], ebR = C.K.ebitda || 1;
    if (Math.abs(C.A.ebitda) > Math.abs(ebR) * .1) L.push(["alta", "Financeira", `EBITDA ajustado difere ${fmt(C.A.ebitda / ebR * 100, 0)}% do reportado (${mi(C.A.ebitda)})`]);
    if (C.A.divida > 0) L.push([C.A.divida > C.ev * .05 ? "alta" : "media", "Financeira", `Itens equivalentes a dívida de ${mi(C.A.divida)} reduzem o equity`]);
    C.EX.forEach(({e, c}) => L.push([e.aval === "provavel" ? "alta" : e.aval === "possivel" ? "media" : "baixa", {tributaria:"Tributária", trabalhista:"Trabalhista", previdenciaria:"Previdenciária", legal:"Legal"}[e.area] || e.area, `${e.titulo}${c.max ? ` (até MR$ ${fmt(c.max / 1e3, 0)})` : ""}`]));
    (C.wb?.pontos || []).forEach(p => L.push([/alt|crit|grav|elev/.test(p.gravidade) ? "alta" : /m[eé]d|moder/.test(p.gravidade) ? "media" : "baixa", D.areaNome?.(p.area) || p.area || "Workbook", p.ponto]));
    if (window.KT_REL){ KT_REL.papeis(s, per).filter(p => p.st === "achado").forEach(p => { if (!L.some(x => x[2].includes(p.titulo))) L.push(["media", D.areaNome(p.area), `${p.titulo}: ${String(p.resultado).slice(0, 140)}`]); }); }
    const ord = {alta:0, media:1, baixa:2}; return L.sort((a, b) => ord[a[0]] - ord[b[0]]);
  }
  function painel(P, s, per, ctx){
    const R = KT_REL, C = contexto(s, per), F = flags(s, per, C), G = window.KT_GRAF, n = k => F.filter(f => f[0] === k).length;
    ctx.sec("Painel executivo");
    R.kpisPdf(P, [["Red flags de alta gravidade", String(n("alta")), `${n("media")} média · ${n("baixa")} baixa`], ["EBITDA ajustado", mi(C.K.ebitda + C.A.ebitda), `reportado ${mi(C.K.ebitda)}`], ["Dívida líquida ajustada", mi(C.K.dl + C.A.divida), `reportada ${mi(C.K.dl)}`], ["Base", C.wb ? "Workbook" : "Prévia", C.wb ? C.wb.arquivo : "balancetes e sistema"]]);
    if (G){ const ar = {}; F.forEach(f => { const k = f[1] || "Outros"; ar[k] = ar[k] || {alta:0, media:0, baixa:0}; ar[k][f[0]]++; });
      const cols = ["Área", "Alta", "Média", "Baixa"], cor = (v, k) => v ? {t:String(v), b:true, bg:k === "alta" ? [250, 205, 205] : k === "media" ? [252, 233, 196] : [214, 238, 222]} : "—";
      P.ensure(60 + Object.keys(ar).length * 20); P.h2(R.T("Mapa de risco por área")); R.tab(P, cols, Object.entries(ar).map(([a, v]) => [a, cor(v.alta, "alta"), cor(v.media, "media"), cor(v.baixa, "baixa")]), [.4, .2, .2, .2]); }
    P.h2(R.T("Red flags")); R.tab(P, ["Gravidade", "Área", "Ponto"], F.slice(0, 18).map(f => [{t:f[0] === "alta" ? "ALTA" : f[0] === "media" ? "Média" : "Baixa", b:true, c:f[0] === "alta" ? [198, 40, 40] : f[0] === "media" ? [178, 121, 26] : [46, 150, 105]}, f[1], f[2]]), [.13, .17, .7]);
    return {C, F};
  }
  function impacto(P, s, per, ctx){
    const R = KT_REL, C = contexto(s, per), G = window.KT_GRAF, prov = C.EX.filter(x => x.e.aval === "provavel").reduce((a, x) => a + (x.c.max || 0), 0), poss = C.EX.filter(x => x.e.aval === "possivel").reduce((a, x) => a + (x.c.min || 0), 0);
    const efEb = C.A.ebitda * C.mult, eqBase = C.K.ebitda * C.mult - C.K.dl, eqFinal = eqBase + efEb - C.A.divida - prov;
    ctx.sec("Impacto na negociação");
    R.par(P, `Partindo do valor que o vendedor obteria com o EBITDA reportado (${mi(C.K.ebitda)} × ${fmt(C.mult, 1)}x, menos a dívida líquida reportada), os efeitos dos achados no preço, considerando o múltiplo implícito de ${fmt(C.mult, 1)}x o EBITDA${C.ev ? " (faixa moderada do valuation)" : " (referência de mercado)"}. Valores indicativos para a negociação; dependem da validação dos consultores e do jurídico.`, {size:9.5});
    if (G) G.cascata(P, "Do equity pelo EBITDA reportado ao equity após a due diligence", [{l:"Equity pelo EBITDA reportado", v:eqBase, tipo:"base"}, {l:`Ajuste de EBITDA × ${fmt(C.mult, 1)}`, v:efEb, tipo:"delta"}, {l:"Itens de dívida", v:-C.A.divida, tipo:"delta"}, {l:"Retenção (exposições prováveis)", v:-prov, tipo:"delta"}, {l:"Equity após a DD", v:eqFinal, tipo:"total"}].filter(p => p.tipo !== "delta" || Math.abs(p.v) > 1), v => mi(v, 1));
    R.tab(P, ["Mecanismo", "Valor", "Fundamento"], [["Ajuste de preço pelo EBITDA normalizado", mi(efEb), `${mi(C.A.ebitda)} × ${fmt(C.mult, 1)}x`], ["Dedução de itens equivalentes a dívida", mi(-C.A.divida), "parcelamentos, encargos e tributos em atraso, provisões"], ["Retenção (escrow) para exposições prováveis", mi(prov), "máximo das exposições prováveis"], ["Indenização específica no SPA", mi(poss), "mínimo das exposições possíveis"], ["Capital de giro de referência (peg)", mi(C.K.ncg + C.A.ncg), "NCG normalizada na data-base; ajuste de preço no fechamento"]], [.38, .17, .45]);
    const prot = ["Declarações e garantias do vendedor sobre tributos, trabalho, contratos e litígios", prov ? `Retenção de ${mi(prov)} por prazo compatível com a decadência (5 anos)` : "", poss ? "Indenização específica para as exposições possíveis listadas" : "", C.A.divida ? "Definição de dívida líquida no SPA incluindo os itens equivalentes apurados" : "", "Mecanismo de ajuste de capital de giro no fechamento (locked box ou completion accounts)", ...(KT_JDD ? KT_JDD.recomendacoes(s).slice(0, 4) : [])].filter(Boolean);
    P.h2(R.T("Proteções recomendadas para o SPA")); prot.forEach(t => R.par(P, "• " + t, {size:9.5, gap:2}));
  }
  function anexos(P, s, ctx){
    const W = s.dd?.wb; if (!W) return; const R = KT_REL;
    if (W.conf?.length){ ctx.sec("Anexo · conferências do workbook"); R.par(P, `Workbook ${W.arquivo}, importado em ${dt(W.em)}.`, {size:9}); R.tab(P, ["Área", "Procedimento", "Situação", "Conclusão", "Ref."], W.conf.map(c => [D.areaNome?.(c.area) || c.area || "", c.proc, c.status, c.conclusao, c.ref]), [.13, .37, .12, .3, .08]); }
    if (W.pontos?.length){ ctx.sec("Anexo · pontos e recomendações do workbook"); R.tab(P, ["Área", "Ponto", "Recomendação", "Gravidade"], W.pontos.map(p => [D.areaNome?.(p.area) || p.area || "", p.ponto, p.recomendacao, p.gravidade]), [.13, .37, .37, .13]); }
  }
  /* planilha modelo do workbook de DD, já com o cadastro do cliente (provisória até o modelo Kinsey) */
  /* ---------------- workbook: análises prontas a partir do que já está no sistema ----------------
     Estrutura dos relatórios de diligência Kinsey: sumário (reportado × ajustado), posição patrimonial, DRE, análise do
     EBITDA (do reportado ao ajustado), capital de giro (NCG, prazos e média mensal para o mecanismo de preço),
     endividamento (dívida bancária e itens equivalentes a dívida) e pró-forma. O consultor revisa em vez de remontar. */
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const rotPer = (s, p) => { const b = s.dd.bal[p], m = +b.meses || 12; return `${MES[+p.slice(5, 7) - 1]}/${p.slice(0, 4)}${m < 12 ? ` (${m}m)` : ""}`; };
  const R0 = v => v == null || !isFinite(v) ? "" : Math.round(v);
  const Pc = v => v == null || !isFinite(v) ? "" : {v:Math.round(v * 1000) / 1000, s:"p"};
  function colunas(s){ /* exercícios fechados + o período mais recente (LTM/parcial) */
    const P = [...D.periodos(s)].sort(), anuais = P.filter(p => /-12$/.test(p) || +s.dd.bal[p].meses === 12), ult = P[P.length - 1];
    const C = [...new Set([...anuais.slice(-5), ult].filter(Boolean))].sort(); return C; }
  const efTot = (s, p, k) => D.ajustes(s, p).reduce((t, a) => t + (+a.v?.[k] || 0), 0);
  function abasAnaliticas(s, nome){
    const C = colunas(s); if (!C.length) return [];
    const K = Object.fromEntries(C.map(p => [p, D.calc(s.dd.bal[p])])), H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), B = v => ({v, s:"b"});
    const head = (t, sub) => [[T(`${t} · ${nome}`)], [sub], []], cab = l => [H(l), ...C.map(p => H(rotPer(s, p)))];
    /* período só com balanço (sem DRE): linhas de resultado ficam em branco, não zeradas */
    const semDRE = p => !K[p].recLiq && !K[p].ebitda && !K[p].cpv && !K[p].despOp, RES = /receita|ebitda|lucro|margem|custo|dedu|despesa|administr|pessoal|pr[oó]-labore|alugu|comerciais|operacionais|recorrentes|deprecia|^ebit|resultado|ir e cs|prazo|ciclo|cobertura/i;
    const vazio = (l, p) => semDRE(p) && RES.test(l) && !/^patrim|^total|confer|capital de giro \(ncg\)|^ncg reportada|^\(±\) ajustes de (capital|pl|d[ií]vida)/i.test(l);
    const lin = (l, f, neg) => [l, ...C.map(p => { if (vazio(l, p)) return ""; const v = f(K[p], p); return v == null ? "" : R0(neg ? -v : v); })], tot = (l, f) => [B(l), ...C.map(p => vazio(l, p) ? "" : ({v:R0(f(K[p], p)), s:"b"}))];
    const pct = (l, f) => [l, ...C.map(p => vazio(l, p) ? "" : Pc(f(K[p], p)))], dv = (a, b) => b ? a / b : null, nota = "Valores em R$. Períodos com menos de 12 meses aparecem anualizados na DRE (estimativa LTM). Fonte: balancetes e demonstrações do sistema" + (s.dd?.wb ? " e workbook importado." : ".");
    const G = (k, l) => lin(l || D.GRUPOS[k][0], x => x.G[k]);
    const AJ = {}; C.forEach(p => AJ[p] = {eb:efTot(s, p, "ebitda"), dv:efTot(s, p, "divida"), ncg:efTot(s, p, "ncg"), pl:efTot(s, p, "pl"), ll:efTot(s, p, "lucro")});
    const sumario = {nome:"Sumário", larguras:[44, ...C.map(() => 17)], linhas:[...head("Sumário da diligência · reportado × ajustado", nota), cab("R$"),
      lin("Receita líquida", x => x.recLiq), lin("EBITDA reportado", x => x.ebitda), lin("(±) Ajustes de EBITDA", (x, p) => AJ[p].eb), tot("EBITDA ajustado", (x, p) => x.ebitda + AJ[p].eb),
      pct("Margem EBITDA ajustada", (x, p) => dv(x.ebitda + AJ[p].eb, x.recLiq)), [],
      lin("Dívida líquida reportada", x => x.dl), lin("(±) Itens equivalentes a dívida e ajustes", (x, p) => AJ[p].dv), tot("Dívida líquida ajustada", (x, p) => x.dl + AJ[p].dv),
      [B("Dívida líquida ajustada / EBITDA ajustado (x)"), ...C.map(p => { const v = semDRE(p) ? null : dv(K[p].dl + AJ[p].dv, K[p].ebitda + AJ[p].eb); return v == null ? "" : Math.round(v * 100) / 100; })], [],
      lin("Capital de giro (NCG) reportado", x => x.ncg), lin("(±) Ajustes de capital de giro", (x, p) => AJ[p].ncg), tot("Capital de giro ajustado", (x, p) => x.ncg + AJ[p].ncg), [],
      lin("Patrimônio líquido reportado", x => x.PL), lin("(±) Ajustes de PL", (x, p) => AJ[p].pl), tot("Patrimônio líquido ajustado", (x, p) => x.PL + AJ[p].pl), [],
      lin("Lucro líquido reportado", x => x.ll), lin("(±) Ajustes de lucro", (x, p) => AJ[p].ll), tot("Lucro líquido ajustado", (x, p) => x.ll + AJ[p].ll), [],
      ["Contingências (exposições) ficam à parte, na aba Contingências: não entram no EBITDA nem na dívida, salvo se o consultor as tratar como ajuste."]]};
    const grp = lado => Object.keys(D.GRUPOS).filter(k => D.GRUPOS[k][2] === lado && C.some(p => Math.abs(K[p].G[k]) > .5));
    const patr = {nome:"Posição patrimonial", larguras:[48, ...C.map(() => 17)], linhas:[...head("Posição patrimonial comparativa", "Valores em R$, saldos na data-base de cada período, pelos grupos de análise do sistema."), cab("R$"),
      [B("ATIVO CIRCULANTE")], ...grp("AC").map(k => G(k)), tot("Total do ativo circulante", x => x.AC), [B("ATIVO NÃO CIRCULANTE")], ...grp("ANC").map(k => G(k)), tot("Total do ativo não circulante", x => x.ANC), tot("TOTAL DO ATIVO", x => x.AT), [],
      [B("PASSIVO CIRCULANTE")], ...grp("PC").map(k => G(k)), tot("Total do passivo circulante", x => x.PC), [B("PASSIVO NÃO CIRCULANTE")], ...grp("PNC").map(k => G(k)), tot("Total do passivo não circulante", x => x.PNC),
      tot("Patrimônio líquido (com o resultado do período)", x => x.PL), tot("TOTAL DO PASSIVO E PL", x => x.PC + x.PNC + x.PL), [],
      ["Conferência: ativo − passivo − PL", ...C.map(p => R0(K[p].AT - K[p].PC - K[p].PNC - K[p].PL))], pct("Liquidez corrente (x)", x => dv(x.AC, x.PC))]};
    const dre = {nome:"DRE comparativa", larguras:[48, ...C.map(() => 17)], linhas:[...head("Demonstração do resultado comparativa", nota), cab("R$"),
      lin("Receita bruta", x => x.recBruta), lin("(−) Deduções da receita", x => x.deducoes, true), tot("Receita líquida", x => x.recLiq), lin("(−) Custo dos produtos e serviços", x => x.cpv, true), tot("Lucro bruto", x => x.lucroBruto), pct("Margem bruta", x => dv(x.lucroBruto, x.recLiq)),
      ...[["pessoal", "(−) Pessoal e encargos"], ["prolabore", "(−) Pró-labore"], ["adm", "(−) Despesas administrativas"], ["aluguel", "(−) Aluguéis"], ["vendas", "(−) Despesas comerciais"], ["outrasOp", "(−) Outras despesas operacionais"], ["naoRec", "(−) Itens não recorrentes"]].map(([k, l]) => lin(l, x => x.G[k] * x.f, true)),
      tot("EBITDA reportado", x => x.ebitda), pct("Margem EBITDA", x => dv(x.ebitda, x.recLiq)), lin("(−) Depreciação e amortização", x => x.da, true), tot("EBIT", x => x.ebit), lin("Resultado financeiro", x => x.resFin), lin("Resultado não operacional", x => x.naoOp),
      tot("Lucro antes do IR e CS", x => x.lair), lin("(−) IR e CS", x => x.ir, true), tot("Lucro líquido", x => x.ll), pct("Margem líquida", x => dv(x.ll, x.recLiq))]};
    /* ponte do EBITDA: cada ajuste numa linha, por período */
    const tits = []; C.forEach(p => D.ajustes(s, p).forEach(a => { if (+a.v?.ebitda && !tits.includes(a.titulo)) tits.push(a.titulo); }));
    const ajP = (p, t) => D.ajustes(s, p).filter(a => a.titulo === t).reduce((x, a) => x + (+a.v?.ebitda || 0), 0);
    const ebitda = {nome:"Análise do EBITDA", larguras:[56, ...C.map(() => 17), 22], linhas:[...head("Análise do EBITDA · do reportado ao ajustado", "Ajustes de normalização: itens não recorrentes, fora do período, despesas pessoais dos sócios, pró-labore a mercado, partes relacionadas. Positivo aumenta o EBITDA."), [...cab("R$"), H("Situação")],
      tot("EBITDA reportado", x => x.ebitda), ...tits.map(t => { const a0 = C.map(p => D.ajustes(s, p).find(a => a.titulo === t)).find(Boolean); return [`(±) ${t}`, ...C.map(p => R0(ajP(p, t)) || ""), a0 ? (D.okFin(a0) ? "aprovado pelo consultor" : a0.manual ? "ajuste do consultor" : "sugerido pelo sistema") : ""]; }),
      tot("EBITDA ajustado", (x, p) => x.ebitda + AJ[p].eb), pct("Margem EBITDA ajustada", (x, p) => dv(x.ebitda + AJ[p].eb, x.recLiq)), [],
      ...(tits.length ? [] : [["Nenhum ajuste de EBITDA identificado ainda: inclua na aba Ajustes os que o consultor confirmar."]])]};
    /* capital de giro */
    const P = [...D.periodos(s)].sort(), ultAno = (C[C.length - 1] || "").slice(0, 4), mens = P.filter(p => p.slice(0, 4) === ultAno && +s.dd.bal[p].meses !== 12 || p.slice(0, 4) === ultAno && !/-12$/.test(p));
    const giro = {nome:"Capital de giro", larguras:[48, ...C.map(() => 17)], linhas:[...head("Capital de giro operacional (NCG)", "Valores em R$. Ativos operacionais menos passivos operacionais; caixa e dívida ficam no endividamento."), cab("R$"),
      ...["clientes", "pdd", "estoques", "impRec", "outrosAC"].map(k => G(k)), tot("Ativos operacionais", x => x.G.clientes + x.G.pdd + x.G.estoques + x.G.impRec + x.G.outrosAC),
      ...["fornecedores", "trab", "tribCP", "adiantCli", "outrosPC"].map(k => lin(`(−) ${D.GRUPOS[k][0]}`, x => x.G[k], true)), tot("Passivos operacionais", x => -(x.G.fornecedores + x.G.trab + x.G.tribCP + x.G.adiantCli + x.G.outrosPC)),
      tot("NCG reportada", x => x.ncg), lin("(±) Ajustes de capital de giro", (x, p) => AJ[p].ncg), tot("NCG ajustada", (x, p) => x.ncg + AJ[p].ncg), pct("NCG / receita líquida", (x, p) => dv(x.ncg + AJ[p].ncg, x.recLiq)), [],
      lin("Prazo médio de recebimento (dias)", x => x.pmr), lin("Prazo médio de estocagem (dias)", x => x.pme), lin("Prazo médio de pagamento (dias)", x => x.pmp), tot("Ciclo financeiro (dias)", x => x.ciclo),
      ...(mens.length > 1 ? [[], [B(`NCG mês a mês · ${ultAno} (base para o capital de giro de referência / peg)`)], [H("Mês"), H("NCG (R$)")], ...mens.map(p => [rotPer(s, p), R0(D.calc(s.dd.bal[p]).ncg)]),
        [B("Média do período"), {v:R0(mens.reduce((a, p) => a + D.calc(s.dd.bal[p]).ncg, 0) / mens.length), s:"b"}]] : [[], ["Importe os balancetes mensais do ano para a média mensal de capital de giro (peg)."]])]};
    const endiv = {nome:"Endividamento", larguras:[52, ...C.map(() => 17)], linhas:[...head("Endividamento e dívida líquida", "Valores em R$. Dívida bancária, itens equivalentes a dívida (debt-like) e caixa."), cab("R$"),
      G("empCP"), G("empLP"), tot("Dívida bancária bruta", x => x.divBruta), lin("(−) Caixa e aplicações", x => x.caixa, true), tot("Dívida líquida reportada", x => x.dl), [],
      [B("Itens equivalentes a dívida a avaliar (debt-like)")], G("parcTrib", "Parcelamentos tributários"), G("mutuoPassivo", "Mútuos e partes relacionadas (passivo)"), G("provisoes", "Provisões (contingências, férias, 13º)"), G("adiantCli", "Adiantamentos de clientes"),
      lin("(±) Ajustes de dívida considerados", (x, p) => AJ[p].dv), tot("Dívida líquida ajustada", (x, p) => x.dl + AJ[p].dv), [],
      [B("Dívida líquida ajustada / EBITDA ajustado (x)"), ...C.map(p => { const v = semDRE(p) ? null : dv(K[p].dl + AJ[p].dv, K[p].ebitda + AJ[p].eb); return v == null ? "" : Math.round(v * 100) / 100; })],
      ["Cobertura de juros (EBITDA / despesas financeiras)", ...C.map(p => { const v = semDRE(p) ? null : dv(K[p].ebitda + AJ[p].eb, K[p].despFin); return v == null ? "" : Math.round(v * 100) / 100; })],
      pct("Endividamento geral (passivo / ativo)", x => dv(x.PC + x.PNC, x.AT))]};
    return [sumario, patr, dre, ebitda, giro, endiv];
  }
  const SIT_EXCL = /exclu|descart|recus|n[aã]o (se )?aplica|n[aã]o confirm/i;
  async function modeloDD(s){
    const H = v => ({v, s:"h"}), T = v => ({v, s:"t"}), P = v => ({v, s:"p"}), rf = s.receita || {}, pj = s.projeto || {}, pd = pj.periodo || {}, nome = s.mandato?.codinome || s.nome;
    const pers = [...D.periodos(s)].sort(), ult = pers[pers.length - 1], br = d => d ? String(d).slice(0, 10).split("-").reverse().join("/") : "";
    const RT = window.KT_REL ? KT_REL.papeis(s, ult) : [], EX = window.KT_EXP ? KT_EXP.lista(s) : [];
    const cab0 = (t, sub) => [[T(`${t} · ${nome}`)], [sub || "Workbook de Due Diligence · modelo provisório KinseyTec"], []];
    const abas = [
      {nome:"Instruções", larguras:[120], linhas:[...cab0("Instruções"), ["O workbook já vem montado com o que está no sistema: cadastro, sumário reportado × ajustado, posição patrimonial, DRE, análise do EBITDA, capital de giro (com a média mensal), endividamento, revisão analítica, balancetes, ajustes, contingências, conferências e pontos."],
        ["O consultor revisa em vez de remontar: nas abas Ajustes, Contingências e Pontos, cada linha do sistema tem a coluna Situação. Mantenha, altere os valores ou escreva Excluir. Linhas novas entram como ajustes do workbook."],
        ["As abas de análise (Sumário, Posição patrimonial, DRE, EBITDA, Capital de giro, Endividamento) são recalculadas pelo sistema na importação a partir dos balancetes e dos ajustes; não precisam ser editadas."],
        ["Mantenha os cabeçalhos e a coluna Ref. sistema: o KinseyTec reconhece as colunas pelo nome e atualiza o registro de origem, sem duplicar."], ["Valores em R$ (ajustes) e em milhares de reais, MR$ (contingências). Datas no formato dd/mm/aaaa. Área: Contábil, Financeira, Trabalhista, Previdenciária, Tributária ou Legal."], ["Importe em Due Diligence > Visão geral > Importar workbook. Reimportar substitui a versão anterior."], ["Abas Balancete AAAA-MM: o auditor revisa os saldos; ao importar, o balancete do workbook passa a ser a base da due diligence (o do cadastro fica guardado)."], ["As abas Cadastro, Resumo financeiro, Sugestões do sistema e Exposições registradas são informativas e não são importadas."]]},
      {nome:"Cadastro", larguras:[36, 70], linhas:[...cab0("Cadastro do cliente"), [H("Campo"), H("Informação")],
        ["Nome-código", s.mandato?.codinome || ""], ...(window.KT_CNPJ?.ficha ? KT_CNPJ.ficha(s) : [["Razão social", rf.razao || s.nome], ["CNPJ", s.doc || ""], ["Atividade principal (CNAE)", `${rf.cnae || ""} ${rf.cnaeDesc || ""}`.trim()]]), ["Segmento", s.perfil?.segmento || s.segmento || ""],
        ["Regime tributário", s.perfil?.regime || ""], ["Data-base", br(s.perfil?.dataBase || (ult && s.dd.bal[ult]?.dataBase))], ["Período contábil e financeiro", pd.contabil ? `${pd.contabil} exercícios + LTM` : ""], ["Período fiscal, trabalhista e previdenciário", pd.fiscalDe ? `${br(pd.fiscalDe)} a ${br(pd.fiscalAte)}` : ""],
        ["Diligência jurídica", {kinsey:"Kinsey", cliente:"Assessores do cliente", nao:"Não contratada"}[pj.ddJur] || ""], ["Sócio do projeto", pj.socio || ""], ...Object.entries(s.dd?.cons || {}).filter(([, v]) => v).map(([a, v]) => [`Consultor · ${D.areaNome(a)}`, v]),
        ["Balancetes no sistema", pers.join(", ")]]},
      ...abasAnaliticas(s, nome),
      {nome:"Resumo financeiro", oculta:!!pers.length, larguras:[34, ...pers.map(() => 16)], linhas:[...cab0("Resumo dos balancetes importados", "Valores em R$ · base do sistema"), [H("R$"), ...pers.map(p => H(p))],
        ...[["Receita líquida", K => K.recLiq], ["EBITDA reportado", K => K.ebitda], ["Lucro líquido", K => K.ll], ["Capital de giro (NCG)", K => K.ncg], ["Dívida líquida", K => K.dl], ["Patrimônio líquido", K => K.PL]].map(([r, f]) => [r, ...pers.map(p => Math.round(f(D.calc(s.dd.bal[p]))))])]},
      ...pers.map(p => ({nome:`Balancete ${p}`, larguras:[18, 60, 18, 16], linhas:[[T(`Balancete ${p} · ${nome}`)], ["Saldo final com sinal: devedor positivo, credor negativo. Revise e devolva no workbook: o balancete do workbook substitui o do cadastro."], [], [H("Conta"), H("Descrição"), H("Saldo final"), H("Grupo (sistema)")], ...(s.dd.bal[p].contas || []).map(c => [String(c[0]), c[1], c[2], c[3] || ""])]})),
      {nome:"Ajustes", larguras:[50, 16, 12, 16, 16, 16, 16, 16, 40], linhas:[...cab0("Ajustes de due diligence", "Um ajuste por linha. Valores positivos aumentam o item; negativos reduzem."), [H("Descrição"), H("Área"), H("Período"), H("EBITDA"), H("Dívida"), H("Capital de giro"), H("PL"), H("Lucro"), H("Fundamento"), H("Situação"), H("Ref. sistema")],
        ...pers.flatMap(p => D.ajustes(s, p).map(a => [a.titulo, D.areaNome(a.area), p, ...["ebitda", "divida", "ncg", "pl", "lucro"].map(k => +a.v?.[k] ? Math.round(a.v[k]) : ""), String(a.desc || a.norma || "").slice(0, 300),
          D.okFin(a) ? "Aprovado pelo consultor" : a.fonte === "workbook" ? "Workbook anterior" : a.manual ? "Ajuste do consultor" : "Sugerido pelo sistema", a.id]))]},
      {nome:"Contingências", larguras:[50, 16, 16, 16, 16, 16, 14, 10, 10, 40], linhas:[...cab0("Contingências e exposições", "Valores em MR$ (milhares de reais), exceto o principal em R$."), [H("Item"), H("Área"), H("Principal (MR$)"), H("Mínimo (MR$)"), H("Máximo (MR$)"), H("Qualificado (MR$)"), H("Avaliação"), H("De"), H("Até"), H("Fundamento"), H("Situação"), H("Ref. sistema"), H("Calculado mín. (MR$)"), H("Calculado máx. (MR$)")],
        ...EX.map(e => { const c = window.KT_EXP ? KT_EXP.calc(e, +(String(ult || "").slice(0, 4)) || new Date().getFullYear()) : {}; const m = v => v == null || v === "" ? "" : +v;
          return [e.titulo, e.area, e.principal ? Math.round(e.principal / 1e3) : "", m(e.min), m(e.max), m(e.qual), {provavel:"Provável", possivel:"Possível", remota:"Remota"}[e.aval] || "NQ", e.anoIni || "", e.anoFim || "", String(e.base || e.obs || "").slice(0, 200), e.fonte === "workbook" ? "Workbook anterior" : "Registrada no sistema", e.id,
            c.min != null ? Math.round(c.min / 1e3) : "", c.max != null ? Math.round(c.max / 1e3) : ""]; })]},
      {nome:"Conferências", larguras:[56, 16, 14, 50, 12], linhas:[...cab0("Conferências e procedimentos", "Status: OK, Achado, Pendente ou N/A. Os procedimentos do sistema vêm listados com o resultado automático."), [H("Procedimento"), H("Área"), H("Status"), H("Conclusão"), H("Ref.")],
        ...RT.filter(p => p.tipo !== "Ajuste").map(p => [p.titulo, D.areaNome(p.area), p.st === "ok" ? "OK" : p.st === "achado" ? "Achado" : p.st === "na" ? "N/A" : "Pendente", String(p.resultado || "").slice(0, 300), p.cod])]},
      {nome:"Pontos", larguras:[56, 16, 56, 12, 22], linhas:[...cab0("Pontos e recomendações", "Achados do sistema já listados: confirme, ajuste a recomendação ou marque Excluir na Situação."), [H("Ponto"), H("Área"), H("Recomendação"), H("Gravidade"), H("Situação")],
        ...((s.dd?.wb?.pontos || []).map(p => [p.ponto, D.areaNome(p.area) || p.area || "", p.recomendacao || "", p.gravidade || "", "Workbook anterior"])),
        ...RT.filter(p => p.st === "achado" && !(s.dd?.wb?.pontos || []).some(x => x.ponto === p.titulo)).map(p => [p.titulo, D.areaNome(p.area), String(p.resultado || "").slice(0, 300), "médio", "Sugerido pelo sistema"])]},
      {nome:"Sugestões do sistema", oculta:true, larguras:[50, 16, 12, 50], linhas:[...cab0("Sugestões do sistema (informativo)", "Achados automáticos sobre os balancetes. Copie para Ajustes ou Pontos o que o auditor confirmar."), [H("Sugestão"), H("Área"), H("Período"), H("Descrição do efeito")],
        ...D.ajustes(s, ult || "").filter(a => !a.manual).map(a => [a.titulo, D.areaNome(a.area), ult, D.efeitoTxt(a)]), ...RT.filter(p => p.st === "achado").map(p => [p.titulo, D.areaNome(p.area), ult, String(p.resultado || "").slice(0, 300)])]},
      {nome:"Exposições registradas", oculta:true, larguras:[50, 16, 20, 14], linhas:[...cab0("Exposições já registradas no sistema (informativo)"), [H("Exposição registrada"), H("Área"), H("Faixa (MR$)"), H("Avaliação")],
        ...EX.map(e => { const c = KT_EXP.calc(e, +(String(ult || "").slice(0, 4)) || new Date().getFullYear()); return [e.titulo, e.area, `${c.min != null ? Math.round(c.min / 1e3) : "NQ"} a ${c.max != null ? Math.round(c.max / 1e3) : "NQ"}`, e.aval || ""]; })]}];
    if (window.KT_RA){ try{ abas.splice(3, 0, ...KT_RA.abas(s)); }catch(e){ console.error(e); } } /* revisão analítica: anual, por período e alertas para o consultor */
    await rptSave(KT_XLSX.gerar(abas), KT_REL.arq(s, "workbook_due_diligence_modelo", "xlsx"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }
  /* ---------------- telas ---------------- */
  const _ra = renderAuditoria;
  renderAuditoria = function(){ const r = _ra.apply(this, arguments); if (S.ddTab !== "geral" && S.ddTab !== "rel") return r; const host = $("#auditoria"), s = D.alvoSel(); if (!host || !s || host.querySelector("[data-wbdd]")) return r;
    const W = s.dd?.wb, el = document.createElement("div"); el.className = "card"; el.setAttribute("data-wbdd", "1"); el.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-bottom:14px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">${W ? "Due diligence completa" : "Due diligence prévia"}</div><h3 style="margin:0">Workbook de Due Diligence</h3><p class="sub" style="margin:2px 0 0">${W ? `<b>Base da due diligence: workbook ${esc(W.arquivo)}</b> · importado em ${dt(W.em)} · ${Object.values(W.abas).filter(t => !/não|sem/.test(t)).join(" · ")}` : `<b>Base: balancetes do cadastro (${esc(D.periodos(s).join(", ") || "nenhum ainda")})</b> · due diligence prévia automática. Quando o workbook do auditor for importado, ele passa a ser a base: balancetes, análises, papéis de trabalho e relatório.`}</p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" id="wb-mod">Exportar planilha modelo</button>${D.ed() ? `<label class="btn sm primary">${W ? "Reimportar workbook" : "Importar workbook (Excel)"}<input type="file" id="wb-f" accept=".xlsx,.xlsm" hidden></label>` : ""}</div></div>
      <p class="sub" style="margin:0;font-size:12px">A planilha modelo já vem com o cadastro do cliente, o resumo dos balancetes, os procedimentos e as sugestões do sistema. Modelo provisório: será substituído pelo modelo de workbook da Kinsey.</p>`;
    const ref = host.querySelector(".dd-tabs"); if (ref) ref.after(el); else host.prepend(el);
    if (S.ddTab === "geral"){ const rf = s.receita || {}, pj = s.projeto || {}, pd = pj.periodo || {}, br = d => d ? String(d).slice(0, 10).split("-").reverse().join("/") : "—", v = window.KT_SB ? KT_SB.vigencia(s) : {};
      const B = D.periodos(s).sort().map(p => `${p}${s.dd.bal[p]?.origem === "workbook" ? " (workbook)" : ""}`);
      const L = [["CNPJ", s.doc || "—"], ["Razão social", rf.razao || s.nome], ["Atividade (CNAE)", `${rf.cnae || ""} ${rf.cnaeDesc || ""}`.trim() || "—"], ["Cidade / UF", [s.municipio, s.uf].filter(Boolean).join(" / ") || "—"], ["Segmento", s.perfil?.segmento || s.segmento || "—"], ["Regime tributário", s.perfil?.regime || "—"],
        ["Due diligence", {kinsey:"pela Kinsey", self:"self due (target responde, Kinsey revisa)", nao:"não contratada"}[pj.dd] || "—"], ["Diligência jurídica", {kinsey:"pela Kinsey", cliente:"assessores do cliente", nao:"não contratada"}[pj.ddJur] || "—"],
        ["Período contábil e financeiro", pd.contabil ? `${pd.contabil} exercícios + LTM` : "—"], ["Período fiscal e trabalhista", pd.fiscalDe ? `${br(pd.fiscalDe)} a ${br(pd.fiscalAte)}` : "—"], ["Data-base", br(s.perfil?.dataBase)], ["Sócio do projeto", pj.socio || "—"],
        ["Mandato", s.mandato?.status === "assinado" ? `assinado${v.fim ? ` · prazo final ${br(v.fim)}` : ""}` : s.mandato?.status || "—"], ["Balancetes", B.join(", ") || "aguardando"]];
      const c = document.createElement("div"); c.className = "card"; c.setAttribute("data-ddcadc", "1"); c.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-bottom:14px";
      c.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Vem do cadastro inicial</div><h3 style="margin:0">Cadastro do projeto</h3></div>${window.KT_PROJ ? `<button type="button" class="btn sm" data-ddcad2>Abrir o cadastro do projeto</button>` : ""}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:4px 16px;font-size:13px">${L.map(([k, x]) => `<div><span class="sub" style="font-size:11.5px">${esc(k)}</span><div>${esc(x)}</div></div>`).join("")}</div>`;
      el.before(c); const b2 = $("[data-ddcad2]", c); if (b2) b2.onclick = () => KT_PROJ.novoProjeto(s.id); }
    const md = $("#wb-mod", el); if (md) md.onclick = () => modeloDD(s).catch(e => { console.error(e); toast("Não foi possível gerar a planilha."); });
    const f = $("#wb-f", el); if (f) f.onchange = () => f.files[0] && importarDD(s, f.files[0]).catch(e => { console.error(e); toast("Não foi possível ler o workbook."); }); return r; };
  if (window.KT_JDD){ const J = KT_JDD, _h = J.html, _bd = J.bind;
    J.html = function(s){ const St = setor(s), q = s.jdd?.q || {}, ed = D.ed() ? "" : "disabled", h = _h.apply(this, arguments);
      const card = `<div class="card" data-jwb style="display:flex;flex-direction:column;gap:8px"><div class="head" style="margin:0"><div><h3 style="margin:0">Workbook de diligência jurídica · ${esc(St.nome)}</h3><p class="sub" style="margin:2px 0 0">Montado pelo sistema conforme o setor: questionário (com riscos setoriais), documentos, contratos, processos e matriz de riscos. Preencha e importe de volta.${s.jdd?.setor?.em ? ` Última importação: ${dt(s.jdd.setor.em)}.` : ""}</p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-jwbg>Gerar workbook</button>${D.ed() ? `<label class="btn sm primary">Importar workbook<input type="file" data-jwbi accept=".xlsx" hidden></label>` : ""}</div></div>
        ${S.jddTab === "quest" ? `<div class="qgroup"><div class="eyebrow">Riscos do setor · ${esc(St.nome)}</div>${St.riscos.map(([r, b], i) => { const id = "set" + (i + 1), c = q[id] || {}; return `<div class="q"><span class="qn">S${i + 1}</span><div class="qt">${esc(r)}: há pendência ou risco identificado? ${c.v === "sim" ? `<span class="flag">● RISCO</span>` : ""}<div class="sub" style="margin:2px 0 0;font-size:11.5px">Base: ${esc(b)}</div></div><div class="qa"><div class="seg">${[["sim", "Sim"], ["nao", "Não"], ["na", "N/A"]].map(([v, l]) => `<button type="button" data-jsq="${id}" data-v="${v}" class="v-${v} ${v === "sim" ? "risk" : ""}" aria-pressed="${c.v === v}" ${ed}>${l}</button>`).join("")}</div></div></div>`; }).join("")}</div>` : ""}</div>`;
      return card + h; };
    J.bind = function(host, s){ const r = _bd.apply(this, arguments); const g = host.querySelector("[data-jwbg]"); if (g) g.onclick = () => workbookJur(supById(s.id) || s).catch(e => { console.error(e); toast("Não foi possível gerar o workbook."); });
      const i = host.querySelector("[data-jwbi]"); if (i) i.onchange = () => i.files[0] && importarJur(supById(s.id) || s, i.files[0]).catch(e => { console.error(e); toast("Não foi possível ler o workbook."); });
      $$("[data-jsq]", host).forEach(b => b.onclick = () => { const cur = s.jdd?.q?.[b.dataset.jsq]?.v; D.up(supById(s.id) || s, {jdd:{q:{[b.dataset.jsq]:{v:cur === b.dataset.v ? "" : b.dataset.v, manual:true, em:nowISO(), por:Store.me?.email || ""}}}}); });
      return r; }; }
  window.KT_DDWB = {modeloDD, planilhas, lerWorkbookDD, importarDD, setor, SETORES, workbookJur, importarJur, painel, impacto, anexos, flags, contexto};
})();
