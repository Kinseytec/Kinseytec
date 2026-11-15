/* ================= CADASTRO PRINCIPAL DO PROJETO · KinseyTec – M&A =================
   Um só cadastro abre o projeto: target (CNPJ com consultas automáticas), equipe Kinsey (sócio do projeto, sócio
   que trouxe o mandato, sócio que trouxe o investidor), mandato (anexo vai direto ao Jurídico; política Kinsey de
   6% de success fee e retainer negociável, usualmente devido após a apresentação do NDA com investidor), due
   diligence (Kinsey ou self due, exercícios pedidos, balanços ou balancetes anexados já importados na DD) e
   valuation (data-base que já preenche o Valuation).
   Painel do projeto no dossiê do target (N3) e painel de novos negócios no investidor (N1).
   Integração com o Ramper: importar listas exportadas (prospecção) e exportar listas para cadências; ligação direta
   pela API do Ramper quando houver token (guardado como segredo na versão publicada, nunca senha no sistema). */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi} = D;
  const dig = v => String(v || "").replace(/\D/g, "");
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const fmtCnpj = d => d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d;
  const EQ = () => (typeof EQUIPE_KINSEY !== "undefined" ? EQUIPE_KINSEY : []).map(x => x[0]);
  const ano = new Date().getFullYear();
  const POLITICA = {success:"6% do valor total da transação", retainer:"Negociável · devido após a apresentação do NDA com investidor"};

  /* ---------------- cadastro principal ---------------- */
  function novoProjeto(id){
    const s = id ? supById(id) : {nivel:"N3"}, P = s.projeto || {}, m = s.mandato || {};
    const N1 = S.suppliers.filter(x => x.nivel === "N1").sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), N2 = S.suppliers.filter(x => x.nivel === "N2");
    const opt = (L, v) => L.map(([k, l]) => `<option value="${esc(k)}" ${String(k) === String(v ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("");
    const eq = v => `<option value="">—</option>${opt(EQ().map(n => [n, n]), v)}`;
    const f = (k, l, v, o = {}) => `<div class="fld ${o.full ? "full" : ""}"><label for="${k}">${l}</label><input id="${k}" value="${esc(v ?? "")}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ""} ${o.type ? `type="${o.type}"` : ""} autocomplete="off">${o.hint ? `<span class="hint">${o.hint}</span>` : ""}</div>`;
    const sel = (k, l, h, o = {}) => `<div class="fld ${o.full ? "full" : ""}"><label for="${k}">${l}</label><select id="${k}" ${o.multi ? `multiple size="${o.multi}"` : ""}>${h}</select>${o.hint ? `<span class="hint">${o.hint}</span>` : ""}</div>`;
    const sec = t => `<div class="fld full"><div class="eyebrow" style="margin-top:8px">${t}</div></div>`;
    const dbPadrao = s.perfil?.dataBase || `${ano - 1}-12-31`;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial · cadastro principal</div><h2>${id ? "Projeto · " + esc(s.nome) : "Novo projeto"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fpj" novalidate><div class="form">
        ${sec("1 · Target (empresa vendedora)")}
        <div class="fld full"><label for="pj-doc">CNPJ</label><div style="display:flex;gap:8px"><input id="pj-doc" inputmode="numeric" value="${esc(s.doc || "")}" placeholder="00.000.000/0000-00" style="flex:1" autocomplete="off"><button type="button" class="btn sm" id="pj-rf">Consultar</button></div><span class="hint" id="pj-rfst">Com o CNPJ o sistema consulta Receita, listas oficiais, CVM, B3 e notícias e preenche o cadastro.</span></div>
        <div class="fld full"><label for="pj-soc">Ou anexe o cartão CNPJ, o contrato social ou a ficha da Junta</label><input id="pj-soc" type="file" multiple accept=".pdf,.docx,.txt"><span class="hint" id="pj-socst">o sistema lê e preenche CNPJ, razão social, cidade, UF e segmento (pelo CNAE); sócios, quotas e cláusulas vão para a diligência jurídica</span></div>
        ${f("pj-nome", "Razão social ou nome *", s.nome, {full:1})}${f("pj-cod", "Nome-código", m.codinome, {ph:"Projeto …"})}
        ${sel("pj-seg", "Segmento", `<option value="">—</option>${opt(SEGMENTOS.map(x => [x, x]), s.perfil?.segmento || s.segmento)}`)}
        ${f("pj-mun", "Cidade", s.municipio)}${f("pj-uf", "UF", s.uf, {ph:"SP"})}
        ${sel("pj-lado", "Lado da Kinsey", opt([["venda", "Venda (sell-side)"], ["compra", "Compra (buy-side)"]], s.lado || "venda"))}
        ${sec("2 · Equipe Kinsey e origem")}
        ${sel("pj-socio", "Sócio do projeto", eq(P.socio))}${sel("pj-smand", "Sócio que trouxe o mandato", eq(P.socioMandato))}
        ${sel("pj-sinv", "Sócio que trouxe o investidor", eq(P.socioInvestidor))}${sel("pj-par", "Parceiro ou intermediador (N2)", `<option value="">—</option>${opt(N2.map(x => [x.id, x.nome]), s.parentId)}`)}
        ${sel("pj-inv", "Investidores (N1)", opt(N1.map(x => [x.id, x.nome]), "").replace(/<option value="([^"]+)"/g, (a, v) => (s.investidores || []).includes(v) ? `<option selected value="${v}"` : a), {full:1, multi:Math.min(6, Math.max(3, N1.length)), hint:"marque um ou mais; investidor novo pelo campo abaixo"})}
        ${f("pj-ninv", "Investidor novo (nome)", "", {full:1, ph:"cadastra como N1 ligado ao projeto"})}
        ${sec("3 · Mandato")}
        ${sel("pj-mst", "A Kinsey tem mandato?", opt([["", "Ainda não"], ["negociacao", "Em negociação"], ["enviado", "Enviado ao target"], ["assinado", "Sim, assinado"]], m.status))}
        <div class="fld"><label for="pj-mf">Anexar mandato (PDF ou Word)</label><input id="pj-mf" type="file" accept=".pdf,.docx,.txt"><span class="hint">vai direto ao Jurídico e preenche o mandato; se já houver um, só substitui (não assinado → assinado) ou entra como aditivo</span></div>
        ${f("pj-suc", "Success fee", m.success || POLITICA.success, {hint:"política Kinsey: 6%"})}${f("pj-ret", "Retainer", m.retainer || POLITICA.retainer, {hint:"negociável; usualmente após o NDA com investidor"})}
        ${sec("4 · Balanços e due diligence")}
        ${sel("pj-dd", "A Kinsey fará a due diligence?", opt([["kinsey", "Sim · due diligence pela Kinsey"], ["self", "Sim · self due (o target responde e a Kinsey revisa)"], ["nao", "Não"]], P.dd || "kinsey"))}
        ${sel("pj-ddj", "Haverá diligência jurídica?", opt([["kinsey", "Sim · pela Kinsey (jurídico)"], ["cliente", "Sim · assessores jurídicos do cliente"], ["nao", "Não"]], P.ddJur || "kinsey"))}
        ${sel("pj-ex", "Balanços pedidos (exercícios)", opt([["5", `5 exercícios (${ano - 5} a ${ano - 1})`], ["3", `3 exercícios (${ano - 3} a ${ano - 1})`], ["2", `2 exercícios (${ano - 2} e ${ano - 1})`]], P.exercicios || "5"))}
        ${sel("pj-pc", "Período contratado · contábil e financeiro", opt([["3", `3 exercícios + LTM (FY${String(ano - 3).slice(2)} a LTM)`], ["2", `2 exercícios + LTM (FY${String(ano - 2).slice(2)} a LTM)`], ["5", `5 exercícios + LTM (FY${String(ano - 5).slice(2)} a LTM)`]], String(P.periodo?.contabil || 3)))}
        ${f("pj-pfi", "Período contratado · fiscal, trabalhista e previdenciário (de)", P.periodo?.fiscalDe || `${ano - 5}-01-01`, {type:"date", hint:"padrão 5 anos (prazo decadencial)"})}${f("pj-pff", "até", P.periodo?.fiscalAte || `${ano - 1}-12-31`, {type:"date"})}
        <div class="fld full"><label for="pj-bal">Balanços ou balancetes dos últimos exercícios (Excel, CSV ou PDF)</label><input id="pj-bal" type="file" multiple accept=".xlsx,.xlsm,.ods,.csv,.txt,.pdf"><span class="hint">importados uma vez aqui e usados em todas as áreas (análises, valuation, apresentação, PPA). O ano vem do nome do arquivo (ex.: balancete_2024.xlsx = 31/12/2024). Na due diligence dá para trocar pela versão revisada.</span></div>
        ${sec("5 · Valuation")}
        ${sel("pj-val", "A Kinsey fará o valuation?", opt([["sim", "Sim"], ["nao", "Não"]], P.valuation === false ? "nao" : "sim"))}${f("pj-db", "Data-base do valuation", dbPadrao, {type:"date"})}
        ${f("pj-obs", "Informações iniciais importantes", P.obs, {full:1, ph:"motivo da venda, participação à venda, prazo esperado, pontos sensíveis"})}
      </div><p class="err" id="pj-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px"><button type="button" class="btn" data-x>Cancelar</button><button type="submit" class="btn primary">${id ? "Salvar projeto" : "Abrir projeto"}</button></div></form>`);
    const $f = k => document.getElementById(k), v = k => ($f(k)?.value || "").trim();
    let rf = null;
    const consulta = async () => { const d = dig(v("pj-doc")), st = $f("pj-rfst"); if (d.length !== 14 || !IMP.docValido(d)){ st.textContent = "CNPJ inválido."; return; }
      const ja = S.suppliers.find(x => x.id !== id && dig(x.doc) === d); if (ja){ st.innerHTML = `Já cadastrado: <b>${esc(ja.nome)}</b> (${ja.nivel}). <a href="#" id="pj-abre" style="color:var(--glow)">abrir este projeto</a>`; $f("pj-abre").onclick = e => { e.preventDefault(); close(); novoProjeto(ja.id); }; return; }
      st.textContent = "Consultando a Receita Federal…";
      try{ rf = await ORG.receita(d); $f("pj-doc").value = fmtCnpj(d); if (!v("pj-nome")) $f("pj-nome").value = rf.razao || ""; if (!v("pj-mun")) $f("pj-mun").value = rf.municipio || ""; if (!v("pj-uf")) $f("pj-uf").value = rf.uf || "";
        const sg = segCnae(rf.cnae, rf.cnaeDesc); if (sg && SEGMENTOS.includes(sg)) $f("pj-seg").value = sg; if (rf.municipio) $f("pj-mun").value = rf.municipio; if (rf.uf) $f("pj-uf").value = rf.uf;
        st.innerHTML = `<b style="color:${rf.situacao === "ATIVA" ? "var(--ok)" : "var(--bad)"}">${esc(rf.situacao)}</b> · ${esc(rf.razao)} · ${esc(rf.cnae)} ${esc(rf.cnaeDesc || "")} · preenchidos: razão social, cidade, UF${sg ? ", segmento " + esc(sg) : ""}`; }
      catch(e){ st.textContent = cartao ? "Dados do cartão CNPJ aplicados; a consulta à Receita é refeita automaticamente." : "Receita indisponível agora; a consulta é refeita automaticamente ao salvar. Você pode anexar o cartão CNPJ abaixo para preencher já."; } };
    /* ao abrir: com CNPJ e sem consulta, consulta sozinho; sem CNPJ, sugere o segmento pelo nome */
    setTimeout(() => { if (dig(v("pj-doc")).length === 14 && !s.receita?.razao) consulta(); else if (!v("pj-doc") && window.KT_SEGDE){ const sg = KT_SEGDE(v("pj-nome") + " " + (s.mapa?.segmentoTxt || "")); if (sg && sg !== "Outros" && SEGMENTOS.includes(sg) && /industria|automac|fabric|metal|plast/i.test(v("pj-nome"))) $f("pj-seg").value = sg; $f("pj-rfst").innerHTML = "<b>Sem CNPJ.</b> Informe o CNPJ ou anexe o cartão CNPJ: o cadastro se preenche sozinho."; } }, 80);
    const segCnae = (cnae, txt) => { const c = String(cnae || "").replace(/\D/g, "").padStart(7, "0"), d = +c.slice(0, 2);
        if (+c){ if (/^(2121|2123|4644|4771|6550)/.test(c)) return "Saúde"; if (d >= 1 && d <= 3) return "Agro"; if (d === 10 || d === 11) return "Alimentos"; if (d >= 5 && d <= 33) return "Industrial"; if (d === 35) return "Energia"; if (d >= 41 && d <= 43) return "Construção"; if (d >= 45 && d <= 47) return "Varejo";
          if (d >= 49 && d <= 53) return "Logística"; if (d >= 58 && d <= 63) return "Tecnologia"; if (d === 85) return "Educação"; if (d >= 86 && d <= 88) return /^(4644|4771)/.test(c) ? "Saúde" : "Saúde"; if (/^(2121|2123)/.test(c)) return "Saúde"; return "Serviços"; }
        return window.KT_SEGDE && txt ? KT_SEGDE(txt) : ""; };
    const preenche = (o, fonte) => { const put = (k, v, sobre) => { const el = $f(k); if (el && v && (sobre || !el.value.trim())) el.value = v; };
      put("pj-doc", o.cnpj ? fmtCnpj(dig(o.cnpj)) : "", false); put("pj-nome", o.razao, false); put("pj-mun", o.municipio, true); put("pj-uf", o.uf, true);
      const sg = segCnae(o.cnae, o.cnaeDesc || o.objeto); if (sg && SEGMENTOS.includes(sg)) $f("pj-seg").value = sg;
      return [o.razao && "razão social", o.municipio && "cidade", o.uf && "UF", sg && `segmento ${sg} (CNAE ${o.cnae || "do documento"})`].filter(Boolean); };
    let cartao = null;
    const lerCartao = t => { const T = String(t || ""), L = T.split(/\n/).map(x => x.trim()).filter(Boolean), at = re => { const i = L.findIndex(x => re.test(x)); return i >= 0 ? (L[i].replace(re, "").trim() || L[i + 1] || "") : ""; };
      const o = {cnpj:(T.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/) || [])[0] || ""};
      o.razao = at(/^NOME EMPRESARIAL:?/i).replace(/^T[IÍ]TULO.*$/i, ""); const ca = T.match(/ATIVIDADE ECON[OÔ]MICA PRINCIPAL[\s:]*([\d.\-/]{9,12})\s*-\s*([^\n]+)/i); if (ca){ o.cnae = dig(ca[1]); o.cnaeDesc = ca[2].trim(); }
      const mu = T.match(/MUNIC[IÍ]PIO\s+UF\s*\n\s*([^\n]+?)\s+([A-Z]{2})\s*(\n|$)/i); if (mu){ o.municipio = mu[1].trim(); o.uf = mu[2]; } else { o.municipio = at(/^MUNIC[IÍ]PIO:?/i); o.uf = (at(/^UF:?$/i).match(/^[A-Z]{2}/) || [])[0] || ""; }
      o.situacao = (T.match(/SITUA[CÇ][AÃ]O CADASTRAL\s*\n?\s*(ATIVA|INAPTA|SUSPENSA|BAIXADA|NULA)/i) || [])[1] || ""; o.abertura = (T.match(/DATA DE ABERTURA\s*\n?\s*(\d{2}\/\d{2}\/\d{4})/i) || [])[1] || ""; return o; };
    $f("pj-soc").onchange = async () => { const fl = $f("pj-soc").files[0], st = $f("pj-socst"); if (!fl || !window.KT_AUTO) return; st.textContent = "Lendo o documento…";
      try{ const tx = await KT_AUTO.texto(fl), soc = window.KT_JAUTO ? KT_JAUTO.lerSocietario(tx) : {}, ca = lerCartao(tx), o = {...ca, cnpj:ca.cnpj || soc.cnpj, cnae:ca.cnae || (soc.cnaes || [])[0], objeto:soc.objeto};
        if (!o.razao){ const r0 = (String(tx).split(/\n/).map(x => x.trim()).find(x => /\b(LTDA|S\.?\/?A\.?|EIRELI|ME|EPP)\b/i.test(x) && x.length < 120)) || ""; o.razao = r0.replace(/^(nome empresarial|raz[aã]o social)[:\s]*/i, ""); }
        cartao = {...o, fonte:`${soc.tipo || "Documento"} (${fl.name})`}; const ok = preenche(o, fl.name); st.textContent = `${soc.tipo || "Documento"} lido: ${ok.join(", ") || "sem campos reconhecidos"}${soc.socios?.length ? ` · ${soc.socios.length} sócio(s) para a diligência jurídica` : ""}.`;
        if (dig(v("pj-doc")).length === 14) consulta(); }
      catch(e){ st.textContent = "Não consegui ler o documento: preencha o CNPJ."; } };
    $f("pj-rf").onclick = consulta; $f("pj-doc").onchange = () => { if (dig(v("pj-doc")).length === 14) consulta(); };
    $f("fpj").onsubmit = async e => { e.preventDefault(); const nome = v("pj-nome"); if (!nome){ $f("pj-err").textContent = "Informe a razão social ou o nome."; $f("pj-err").hidden = false; return; }
      const nid = id || "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), d = dig(v("pj-doc")), seg = v("pj-seg");
      let invs = [...$f("pj-inv").selectedOptions].map(o => o.value);
      if (v("pj-ninv")){ const iid = "pi" + Date.now().toString(36); await Store.set("suppliers", iid, {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), origem:"Cadastro do projeto " + (v("pj-cod") || nome), nivel:"N1", nome:v("pj-ninv"), tipo:"Investidor estratégico", uf:"", pais:"Brasil", lat:-23.55, lng:-46.63, projeto:{socioOrigem:v("pj-sinv")}}); invs.push(iid); }
      const proj = {socio:v("pj-socio"), socioMandato:v("pj-smand"), socioInvestidor:v("pj-sinv"), dd:v("pj-dd"), ddJur:v("pj-ddj"), exercicios:v("pj-ex"), periodo:{contabil:+v("pj-pc"), fiscalDe:v("pj-pfi"), fiscalAte:v("pj-pff")}, valuation:v("pj-val") === "sim", obs:v("pj-obs"), em:P.em || nowISO()};
      const o = {nivel:"N3", nome, doc:d.length === 14 ? fmtCnpj(d) : v("pj-doc"), segmento:seg || s.segmento || "", municipio:v("pj-mun"), uf:v("pj-uf").toUpperCase().slice(0, 2), pais:"Brasil", lado:v("pj-lado"),
        parentId:v("pj-par"), investidores:invs, projeto:proj, perfil:{segmento:seg || s.perfil?.segmento || "", ...(proj.valuation ? {dataBase:v("pj-db")} : {})},
        mandato:{codinome:v("pj-cod") || m.codinome || "", success:v("pj-suc"), retainer:v("pj-ret"), ...(v("pj-mst") ? {status:v("pj-mst")} : {})}};
      if (!id){ o.etapa = v("pj-mst") === "assinado" ? "mandato" : "abordada"; if (window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(o); o.lat = lat; o.lng = lng; } }
      if (rf) o.receita = {...rf, em:nowISO()}; else if (cartao && !s.receita?.razao) o.receita = {razao:cartao.razao || "", cnae:cartao.cnae || "", cnaeDesc:cartao.cnaeDesc || "", municipio:cartao.municipio || "", uf:cartao.uf || "", situacao:(cartao.situacao || "").toUpperCase(), abertura:cartao.abertura || "", fonte:cartao.fonte, em:nowISO()};
      try{ if (id) await Store.update("suppliers", id, o); else await Store.set("suppliers", nid, {answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), origem:"Cadastro principal", ...o}); }
      catch(err){ $f("pj-err").textContent = "Não foi possível salvar: " + (err.message || "erro"); $f("pj-err").hidden = false; return; }
      const avisos = [], ss = () => supById(nid) || {...o, id:nid};
      /* mandato anexado: lê, preenche e registra no Jurídico */
      const mf = $f("pj-mf").files[0];
      if (mf && window.KT_AUTO){ try{ const r = await KT_AUTO.registrarMandato(ss(), mf, false); avisos.push(r.ok ? r.msg.toLowerCase() : "mandato não registrado: " + r.msg); }
        catch(e){ avisos.push("mandato anexado sem leitura do texto"); } }
      /* documentos societários: leitura e diligência jurídica automática */
      for (const fs of [...($f("pj-soc")?.files || [])]){ if (!window.KT_JAUTO) break; try{ const x = await KT_JAUTO.importar(ss(), fs); avisos.push(`${x.tipo} lido`); }catch(e){ avisos.push(`${fs.name}: não lido`); } }
      /* balanços ou balancetes: importa cada arquivo na Due Diligence */
      const bals = [...$f("pj-bal").files], bal = {}, falhas = [];
      for (const fb of bals){ try{ const contas = await D.lerArquivo(fb); const y = (fb.name.match(/(20\d\d)/) || [])[1] || String(ano - 1), mesN = (fb.name.match(/(?:^|[^\d])(0[1-9]|1[0-2])[-_. ]?(20\d\d)/) || [])[1];
          const mes = mesN || "12", ult = new Date(+y, +mes, 0).getDate(); bal[`${y}-${mes}`] = {dataBase:`${y}-${mes}-${String(ult).padStart(2, "0")}`, meses:+mes, contas, importadoEm:nowISO(), por:Store.me?.email || "", arquivo:fb.name, origem:"cadastro"}; }
        catch(e){ falhas.push(`${fb.name}: ${e.message || "não lido"}`); } }
      if (Object.keys(bal).length){ await Store.update("suppliers", nid, {dd:{bal}}); avisos.push(`${Object.keys(bal).length} balancete(s) importado(s): análise prévia feita`); }
      if (falhas.length) avisos.push("não lidos: " + falhas.join("; "));
      if (proj.dd !== "nao") await Store.update("suppliers", nid, {dd:{pedido:{modo:proj.dd, exercicios:+proj.exercicios, anos:Array.from({length:+proj.exercicios}, (_, i) => ano - +proj.exercicios + i), em:nowISO()}}});
      close(); toast(id ? "Projeto atualizado" : "Projeto aberto" + (avisos.length ? ": " + avisos.join(" · ") : "")); renderAll();
      if (!id && proj.dd !== "nao") setTimeout(() => pedidoDD(supById(nid)), 300); else setTimeout(() => openSupplier(nid, "dados"), 120); };
  }

  /* ---------------- base de due diligence (pedido de documentos) ---------------- */
  function pedidoTxt(s){ const p = s.dd?.pedido || {}, anos = p.anos || [ano - 3, ano - 2, ano - 1];
    return [`${s.mandato?.codinome || s.nome} · pedido de documentos para ${p.modo === "self" ? "self due diligence" : "due diligence"} (Kinsey Capital)`, "",
      `1. Balanço patrimonial e DRE de ${anos.join(", ")} e balancetes de verificação de dezembro de cada ano (Excel ou CSV, com código da conta, descrição e saldo)`,
      `2. Balancete do ano corrente até o último mês fechado e o do mesmo mês do ano anterior`,
      ...(typeof DOCS !== "undefined" ? DOCS.N3 : []).map((d, i) => `${i + 3}. ${d}`), "",
      "Questionário inicial: respondido pelo link enviado pela Kinsey.", "Dúvidas: equipe de M&A da Kinsey."].join("\n"); }
  function pedidoDD(s){ if (!s) return; const t = pedidoTxt(s);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Due diligence · ${esc(s.nome)}</div><h2>Base de due diligence para envio</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:10px"><p class="sub" style="margin:0">Pedido de documentos dos exercícios definidos no projeto e questionário inicial. Copie e envie ao target, ou envie o link do questionário (portal).</p>
        <textarea id="pd-t" rows="14" style="width:100%;font-size:13px;line-height:1.5;background:transparent;color:inherit;border:1px solid var(--line);border-radius:8px;padding:10px">${esc(t)}</textarea>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button type="button" class="btn" id="pd-cp">Copiar pedido</button><button type="button" class="btn" id="pd-q">Enviar questionário (portal)</button><button type="button" class="btn primary" id="pd-ok">Marcar como enviado e abrir o projeto</button></div></div>`);
    $("#pd-cp").onclick = async () => { try{ await navigator.clipboard.writeText($("#pd-t").value); toast("Pedido copiado"); }catch(e){ $("#pd-t").select(); toast("Selecione e copie o texto"); } };
    $("#pd-q").onclick = () => { if (typeof PAINEL !== "undefined") PAINEL.envio([s.id]); };
    $("#pd-ok").onclick = async () => { await Store.update("suppliers", s.id, {dd:{pedido:{enviadoEm:nowISO()}}}); close(); openSupplier(s.id, "dados"); }; }

  /* ---------------- painel do projeto (N3) e de novos negócios (N1) ---------------- */
  const vai = (view, s) => { $("#layer").innerHTML = ""; S.openSup = null; S.ddSel = s.id; S.jurAlvo = s.id; S.pastaAberta = false; go(view); };
  function painelN3(s){
    const P = s.projeto || {}, m = s.mandato || {}, per = D.temBal(s) ? D.periodos(s) : [], anuais = per.filter(p => +(s.dd.bal[p].meses || 12) === 12).map(p => +p.slice(0, 4));
    const pedidos = s.dd?.pedido?.anos || [], faltam = pedidos.filter(a => !anuais.includes(a));
    let val = null, ach = 0, pend = 0; try{ if (per.length){ const pb = per.slice().sort().pop(), b = s.dd.bal[pb], K = D.calc(b); ach = D.PROCS.filter(p => p.f(K, b, s).st === "achado").length; pend = D.ajustes(s, pb).filter(a => !D.okVal(a)).length; const R = KT_VAL.resumo(s); if (R.X && !R.X.vazio) val = R; } }catch(e){}
    const mult = val?.met.find(x => /EV\/EBITDA/.test(x[0]) && !/Transa/.test(x[0])), fx = (a, b) => `R$ ${fmt(a / 1e6, 1)}–${fmt(b / 1e6, 1)} mi`;
    const ct = S.contracts.filter(k => k.supplierId === s.id), par = ct.filter(k => S.pareceres[k.id]).length, inv = (s.investidores || []).map(supById).filter(Boolean);
    const passos = [];
    if (!dig(s.doc)) passos.push(["Informar o CNPJ", "proj"]);
    if (!m.status || m.status !== "assinado") passos.push([m.doc ? "Acompanhar a assinatura do mandato" : "Anexar o mandato", m.doc ? "jur" : "proj"]);
    if (P.dd !== "nao" && !s.dd?.pedido?.enviadoEm) passos.push(["Enviar a base de due diligence", "pedido"]);
    if (faltam.length || !anuais.length) passos.push([`Importar balancetes${faltam.length ? " de " + faltam.join(", ") : ""}`, "dd"]);
    if (pend) passos.push([`${pend} ajuste(s) de DD aguardando OK`, "dd"]);
    if (P.valuation !== false && !s.perfil?.dataBase) passos.push(["Definir a data-base do valuation", "proj"]);
    if (!s.nda?.aceito) passos.push(["NDA do target", "nda"]);
    if (!inv.length) passos.push(["Indicar investidores", "proj"]);
    const k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b style="font-size:14px">${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    return `<div class="card" style="display:flex;flex-direction:column;gap:10px;border-color:rgba(79,176,245,.45)"><div class="head" style="margin:0"><div><div class="eyebrow">Painel do projeto${m.codinome ? " · " + esc(m.codinome) : ""}</div><h3 style="margin:0">Tudo do target em um lugar</h3></div><button type="button" class="btn sm" data-pj="proj">Cadastro principal</button></div>
      <div class="sub" style="margin:0;font-size:12.5px">Sócio do projeto: <b>${esc(P.socio || "—")}</b> · mandato trazido por <b>${esc(P.socioMandato || "—")}</b> · investidor trazido por <b>${esc(P.socioInvestidor || "—")}</b></div>
      <div class="dd-kpis">${k("Mandato", esc(({assinado:"Assinado", negociacao:"Em negociação", enviado:"Enviado"})[m.status] || "Sem mandato"), esc([m.success, m.retainer].filter(Boolean).join(" · ").slice(0, 90)))}
        ${k("Due diligence", P.dd === "nao" ? "Não contratada" : `${anuais.length} de ${pedidos.length || 3} exercícios`, `${ach} achado(s) · ${pend} ajuste(s) sem OK${P.dd === "self" ? " · self due" : ""}`)}
        ${k("Valuation prévio", val?.mod ? fx(val.mod.min, val.mod.max) : "—", mult ? "múltiplos " + fx(mult[1], mult[2]) : `data-base ${esc(s.perfil?.dataBase || "—")}`)}
        ${k("Jurídico", `${ct.length} documento(s)`, `${par} com parecer · NDA ${s.nda?.aceito ? "assinado" : "pendente"}`)}
        ${k("Investidores", String(inv.length), esc(inv.slice(0, 2).map(i => i.nome).join(", ")))}</div>
      ${passos.length ? `<div><div class="eyebrow" style="margin-bottom:6px">Próximos passos</div><div style="display:flex;flex-wrap:wrap;gap:6px">${passos.map(([t, a]) => `<button type="button" class="btn sm ghost" data-pj="${a}">${esc(t)} ›</button>`).join("")}</div></div>` : `<div class="sub" style="margin:0">Sem pendências no cadastro.</div>`}
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-pj="dd">Due Diligence</button><button type="button" class="btn sm" data-pj="fin">Análises financeiras</button><button type="button" class="btn sm" data-pj="val">Valuation</button><button type="button" class="btn sm" data-pj="jur">Jurídico</button></div></div>`;
  }
  function painelN1(s){
    const T = s.tese || {}, P = s.projeto || {}, C = window.KT_ORBINV ? KT_ORBINV.criterios(s) : null, alvos = window.KT_ORBINV ? KT_ORBINV.alvosDe(s) : [];
    const oq = C ? [C.atv.map(l => l.join(" ")).join(", "), C.cnaes.length ? "CNAE " + C.cnaes.join(", ") : ""].filter(Boolean).join(" · ") || (T.segmentos || []).join(", ") : "";
    const onde = [...(T.ufs || []), ...(T.cidades || []), ...(T.regioes || [])].join(", ");
    return `<div class="card" style="display:flex;flex-direction:column;gap:8px;border-color:rgba(242,193,78,.45)"><div class="head" style="margin:0"><div><div class="eyebrow">Novos negócios · investidor</div><h3 style="margin:0">${esc(s.tipo || "Investidor")}</h3></div><button type="button" class="btn sm" data-n1="orb">Ver no mapa o que compra</button></div>
      <div class="dd-kpis"><div class="dd-k"><span>O que compra</span><b style="font-size:13.5px">${esc(oq || "a definir no cadastro")}</b><small>${esc(onde || "região não definida")}</small></div>
        <div class="dd-k"><span>Ticket</span><b style="font-size:14px">${T.ticketMin != null || T.ticketMax != null ? `${mi((T.ticketMin || 0) * 1e6)} a ${mi((T.ticketMax || 0) * 1e6)}` : "—"}</b><small>${esc(P.socioOrigem ? "trazido por " + P.socioOrigem : "")}</small></div>
        <div class="dd-k"><span>Targets na base</span><b style="font-size:14px">${alvos.length}</b><small>${esc(alvos.slice(0, 3).map(t => t.mandato?.codinome || t.nome).join(", "))}</small></div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm ghost" data-n1="ramper">Lista de critérios para prospecção (CSV)</button><button type="button" class="btn sm" data-n1="econo">Importar targets do Econodata para este investidor</button></div>
      <p class="sub" style="margin:0;font-size:12px">A lista leva os critérios do investidor (atividades, CNAEs e região) e os targets já mapeados, para a equipe de novos negócios prospectar no Econodata, no Lemitti ou no Ramper e trazer a lista de volta já ligada ao investidor (política Kinsey: faturamento ou valuation a partir de R$ 15 mi).</p></div>`;
  }
  const _body = renderSupBody;
  renderSupBody = function(){ const r = _body.apply(this, arguments); if (S.supTab !== "dados") return r; const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || b.querySelector("[data-painel]")) return r;
    const el = document.createElement("div"); el.setAttribute("data-painel", "1");
    if (s.nivel === "N3") el.innerHTML = painelN3(s); else if (s.nivel === "N1") el.innerHTML = painelN1(s); else return r;
    b.prepend(el);
    $$("[data-pj]", el).forEach(x => x.onclick = () => { const a = x.dataset.pj; if (a === "proj") novoProjeto(s.id); else if (a === "pedido") pedidoDD(s); else if (a === "dd") vai("auditoria", s); else if (a === "fin") vai("financas", s); else if (a === "val"){ S.valTab = "sintese"; vai("valuation", s); } else if (a === "jur") vai("juridico", s); else if (a === "nda") setTab("lgpd"); });
    $$("[data-n1]", el).forEach(x => x.onclick = () => { if (x.dataset.n1 === "orb"){ $("#layer").innerHTML = ""; S.openSup = null; go("orbita"); selectSup(s.id, true); } else if (x.dataset.n1 === "econo" && window.KT_POL) KT_POL.importarLista("Econodata", s.id); else exportarRamper(s); });
    return r; };

  /* ---------------- Ramper: exportar lista e importar prospecção ---------------- */
  const csvCel = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  function baixar(nome, txt){ const blob = new Blob(["﻿" + txt], {type:"text/csv;charset=utf-8"}); if (typeof rptSave === "function") return rptSave(blob, nome, "text/csv");
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nome; a.click(); }
  function exportarRamper(inv){
    const C = window.KT_ORBINV ? KT_ORBINV.criterios(inv) : {atv:[], cnaes:[], ufs:[], cidades:[], regioes:[]}, alvos = window.KT_ORBINV ? KT_ORBINV.alvosDe(inv) : [];
    const L = [["Tipo","Empresa","CNPJ","Segmento","CNAE","Cidade","UF","Faturamento","Contato","Telefone","Site","Investidor de interesse","Critério"].map(csvCel).join(";")];
    alvos.forEach(t => L.push(["Target mapeado", t.nome, t.doc, t.perfil?.segmento || t.segmento, t.receita?.cnae || t.cnae, t.municipio, t.uf, t.mapa?.fat || (t.fin?.receita ? t.fin.receita + " mi" : ""), t.mapa?.contato, t.mapa?.telefone, t.mapa?.site, inv.nome, KT_ORBINV.aderente(inv, t)].map(csvCel).join(";")));
    L.push(["Critério de busca", "", "", (inv.tese?.segmentos || []).join(", "), C.cnaes.join(", "), C.cidades.join(", "), C.ufs.join(", "), inv.tese?.fatMin != null ? `${inv.tese.fatMin} a ${inv.tese.fatMax ?? ""} mi` : "", "", "", "", inv.nome, C.atv.map(l => l.join(" ")).join(", ") + (C.regioes.length ? " · " + C.regioes.join(", ") : "")].map(csvCel).join(";"));
    baixar(`Ramper_prospeccao_${(inv.nome || "investidor").replace(/[^\w]+/g, "_").slice(0, 40)}.csv`, L.join("\n")); toast("Lista gerada para o Ramper"); }
  function exportarBase(){ const L = [["Nível","Empresa","CNPJ","Segmento","Cidade","UF","Temperatura","Etapa","Contato","Telefone","Site"].map(csvCel).join(";")];
    S.suppliers.filter(s => s.nivel === "N3" || s.nivel === "N1").forEach(s => L.push([s.nivel, s.nome, s.doc, s.perfil?.segmento || s.segmento, s.municipio, s.uf, s.mapa?.temperatura, s.etapa, s.mapa?.contato, s.mapa?.telefone, s.mapa?.site].map(csvCel).join(";")));
    baixar("KinseyTec_base_para_cadencias.csv", L.join("\n")); toast("Base exportada para cadências"); }
  async function importarRamper(){
    const i = document.createElement("input"); i.type = "file"; i.accept = ".csv,.xlsx,.txt"; i.onchange = async () => { const f = i.files[0]; if (!f) return;
      let rows = []; try{ const buf = await f.arrayBuffer(); rows = /\.xlsx$/i.test(f.name) ? await IMP.lerXLSX(buf) : D.csv((() => { let x = new TextDecoder("utf-8").decode(buf); if (x.includes("\uFFFD")) x = new TextDecoder("latin1").decode(buf); return x; })()); }catch(e){ toast("Não consegui ler o arquivo"); return; }
      const hi = rows.findIndex(r => r.some(c => /cnpj/i.test(c)) && r.some(c => /raz|empresa|nome/i.test(c))); if (hi < 0){ toast("O arquivo precisa ter as colunas CNPJ e Empresa (ou Razão social)."); return; }
      const H = rows[hi].map(c => nrm(c)), ix = re => H.findIndex(h => re.test(h));
      const cN = ix(/raz|empresa|nome fantasia|^nome/), cD = ix(/cnpj/), cC = ix(/cnae|atividade/), cF = ix(/fatur|receita/), cU = ix(/^uf$|estado/), cM = ix(/cidade|municip/), cE = ix(/e-?mail/), cT = ix(/telefone|celular|fone/), cS = ix(/site|dominio|url/), cCt = ix(/contato|decisor|responsavel/);
      const L = rows.slice(hi + 1).filter(r => r[cN] || r[cD]), novos = [], ja = [];
      for (const r of L){ const d = dig(r[cD]); if (d && S.suppliers.some(s => dig(s.doc) === d)){ ja.push(r[cN]); continue; }
        const o = {nivel:"N3", nome:String(r[cN] || "").trim() || fmtCnpj(d), doc:d.length === 14 ? fmtCnpj(d) : "", uf:String(r[cU] || "").toUpperCase().slice(0, 2), municipio:String(r[cM] || "").trim(), pais:"Brasil", tipo:"Target · prospecção", etapa:"mapeada", origem:"Ramper",
          mapa:{temperatura:"Frio", fat:String(r[cF] || ""), segmentoTxt:String(r[cC] || ""), contato:[r[cCt], r[cE]].filter(Boolean).join(" · "), telefone:String(r[cT] || ""), site:String(r[cS] || ""), aba:"Ramper"}};
        if (window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(o); o.lat = lat; o.lng = lng; } novos.push(o); }
      IMP.confirma(`<b>${novos.length} target(s) novo(s) da lista do Ramper</b><p class="sub" style="margin:6px 0 0">${ja.length} já estavam na base. Os novos entram como N3 "Frio" (prospecção) e o sistema consulta os CNPJs sozinho (Receita, listas oficiais, CVM e notícias).</p>`, "Incluir na base", "", async () => {
        for (const o of novos) await Store.set("suppliers", "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), ...o});
        toast(`${novos.length} target(s) incluído(s): consultas automáticas em andamento`); renderAll(); }); };
    i.click(); }

  /* ---------------- Base inicial: botão do cadastro principal e integrações ---------------- */
  const _cad = renderCadeia;
  renderCadeia = function(){ const r = _cad.apply(this, arguments); const top = $("#bi-top"); if (!top || top.querySelector("[data-np]")) return r;
    const bar = top.querySelector("[data-bi]")?.parentElement; if (bar){ const b = document.createElement("button"); b.type = "button"; b.className = "btn primary"; b.setAttribute("data-np", "1"); b.textContent = "+ Novo projeto (cadastro principal)"; bar.prepend(b); b.onclick = () => novoProjeto();
      const t3 = bar.querySelector('[data-bi="N3"]'); if (t3){ t3.classList.remove("primary"); t3.textContent = "+ Target avulso (N3)"; } }
    const it = document.createElement("div"); it.className = "card"; it.id = "bi-int"; it.style.cssText = "display:flex;flex-direction:column;gap:8px;margin-top:10px";
    it.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Integrações e base de consultas</div><h3 style="margin:0">Ramper · prospecção e cadências</h3></div></div>
      <p class="sub" style="margin:0">Importe a lista de empresas exportada do Ramper (CNPJ, razão social, CNAE, faturamento, cidade, UF e contato): os novos targets entram como prospecção e o sistema consulta cada CNPJ sozinho. Exporte a base para montar as cadências de e-mail no Ramper.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="rp-imp">Importar lista do Ramper</button><button type="button" class="btn sm" id="rp-exp">Exportar base para cadências</button></div>
      <p class="sub" style="margin:0;font-size:12px">Ligação direta (consulta e cadência sem arquivo): na versão publicada, com o token de API do Ramper guardado como segredo do Firebase. O sistema não guarda senha de acesso ao Ramper.</p>
      <p class="sub" style="margin:0;font-size:12px">Consultas automáticas por CNPJ: Receita Federal, listas oficiais (CGU, MTE, IBAMA), CVM, B3, notícias e mercado.</p>`;
    top.after(it); $("#rp-imp", it).onclick = importarRamper; $("#rp-exp", it).onclick = exportarBase;
    return r; };

  window.KT_PROJ = {novoProjeto, pedidoDD, pedidoTxt, painelN3, painelN1, exportarRamper, importarRamper, exportarBase};
})();
