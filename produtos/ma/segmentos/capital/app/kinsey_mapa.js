/* ================= KINSEY CAPITAL · MAPA M&A DA KINSEY (EXCEL) =================
   Lê a planilha de trabalho da Kinsey com várias abas:
   - "Vendedoras" (sell side) → targets N3; linhas "Parceria X" viram targets trazidos pelo parceiro X (N2)
   - "Compradoras" ou "Investidores" (buy side) → investidores N1 (empresas e fundos); "Advisory" → parceiro N2
   - "M&A" e "Planilha4" → blocos comprador × vendedores (separados por linha em branco); "Planilha3" → teses
   - "Fazendas_Maranhão" → carteira de fazendas à venda (um target); "To Do" → próximos passos; "Fichas" → anotações
   - links da Econodata → CNPJ, conferido na Receita Federal antes de usar (link na linha errada é corrigido ou descartado)
   Temperatura (Quente, Morno, Frio, Declinada), mandato, faturamento, contatos e último contato vão para o cadastro. */
if (window.KT_DD) (() => {
  const D = KT_DD;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const nn = t => nrm(t).replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  const STOP = new Set("ltda sa s a eireli me epp de da do dos das e em industria industrial industriais comercio comercial administradora administracao adm beneficios brasil grupo cia companhia participacoes holding the lavanderia lavanderias toalheiro servicos solucoes gestao planos saude distribuidora distribuicao impressao embalagens materiais flexiveis".split(" "));
  const toks = t => nn(t).split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w));
  const lev = (a, b) => { const m = a.length, n = b.length, d = Array.from({length:m + 1}, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
  function sim(a, b){ const A = toks(a), B = toks(b); if (!A.length || !B.length) return 0; const ja = A.join(" "), jb = B.join(" "); if (ja === jb || ja.includes(jb) || jb.includes(ja)) return 1;
    const ca = A.join(""), cb = B.join(""), [cu, cl] = ca.length <= cb.length ? [ca, cb] : [cb, ca]; if (cu.length >= 6 && (cl.startsWith(cu) || lev(cu, cl.slice(0, cu.length)) <= 2)) return .9;
    const perto = (w, x) => x === w || (w.length > 4 && x.length > 4 && lev(w, x) <= (Math.min(w.length, x.length) >= 7 ? 2 : 1));
    return A.filter(w => B.some(x => perto(w, x))).length / Math.max(A.length, B.length); }
  const fat = t => { const s = nrm(t); if (!s || /^x+$|^\?|^\.\.\./.test(s)) return null; const m = s.match(/([\d.,]+)/); if (!m) return null; let v = parseFloat(m[1].replace(/\./g, "").replace(",", ".")); if (!isFinite(v)) return null;
    if (/^[\d.,]+\s*mil\b/.test(s.replace(/^r\$\s*/, ""))) v /= 1000; else if (/bi\b|bilh/.test(s.slice(0, s.indexOf(m[1]) + m[1].length + 4))) v *= 1000; return v; };
  const data = v => { const n = +v; if (n > 30000 && n < 80000) return new Date(Math.round((n - 25569) * 864e5)).toISOString().slice(0, 10); const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ""; };
  const UFS_ = new Set(typeof UFS !== "undefined" ? UFS : []);
  function local(t){ const s = String(t || "").trim(); if (!s || s === "?") return {}; const p = s.split("/").map(x => x.trim()); const uf = p.find(x => UFS_.has(x.toUpperCase()));
    if (uf) return {uf:uf.toUpperCase(), municipio:p.length > 1 && p[0].toUpperCase() !== uf.toUpperCase() ? p[0] : ""}; return {pais:p[0]}; }
  const SEGS = [["Industrial",/^\s*industria|fabricacao de (?!medicament)/],["Saúde",/saude|medicament|farmac|hospital|planos de saude|adm(inistradora)? de planos|odontolog|beneficio|biotec|laborat|clinic/],["Serviços",/lavanderi|facilit|terceiriz|seguro|corretor|financeir|fidc|advisory|servic/],["Alimentos",/aliment|frigor|cervej|vinic|latic|bebida/],["Agro",/fazenda|agro|cana|grao|ativo fixo/],
    ["Industrial",/industria|fabric|latex|plastic|metalur|aditiv|grafic|rotulo|piso|revestiment|aviament|embalag|celulose|papel|florest|pinus|madeira|osb|automac|borracha|quimic|reciclag/],["Tecnologia",/tecnolog|saas|software|pagament|fintech|marketing|startup/],["Logística",/logist|transport|locadora/],["Educação",/educa|curso/],["Construção",/engenharia|imobili|real estate/],["Varejo",/comercio|atacad|distribui|vestuar|loja/]];
  const segDe = t => (SEGS.find(([, re]) => re.test(nrm(t))) || ["Outros"])[0];
  window.KT_SEGDE = segDe;
  const econodata = t => { const m = String(t || "").match(/econodata[^\s]*?(?:detalhe-empresa\/|#\/s\/)([A-Za-z0-9=]+)/); if (!m) return ""; try{ let b = m[1]; b += "=".repeat((4 - b.length % 4) % 4); const d = atob(b).split("|")[0]; return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(d) ? d : ""; }catch(e){ return ""; } };

  /* ---------------- leitura do Excel (todas as abas) ---------------- */
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
  const ehKinsey = P => Object.keys(P).some(n => /^vendedor/i.test(n)) && Object.keys(P).some(n => /^comprador|^investidor/i.test(n));

  /* ---------------- montagem das empresas e ligações ---------------- */
  function montar(P){
    const E = [], av = [], aba = re => P[Object.keys(P).find(n => re.test(n))] || [];
    const acha = (nome, nivel) => { let best = null, bs = 0; E.filter(e => !nivel || e.nivel === nivel).forEach(e => { const v = sim(nome, e.nome); if (v > bs){ bs = v; best = e; } }); return bs >= .75 ? best : null; };
    const novo = o => { const e = {links:new Set(), inter:[], fichas:[], ...o}; E.push(e); return e; };
    /* parceiros (N2): a Kinsey Capital e quem trouxe targets */
    const kinsey = novo({nivel:"N2", nome:"Kinsey Capital", tipo:"Kinsey Capital", uf:"SP", municipio:"São Paulo", pais:"Brasil", fonte:"Kinsey"});
    const parceiro = nome => acha(nome, "N2") || novo({nivel:"N2", nome, tipo:"Parceiro originador", fonte:"Vendedoras"});
    /* Vendedoras → N3 */
    const V = aba(/^vendedor/i), hv = (V.find(r => r.some(c => /sell side/i.test(c))) || []), iv = k => hv.findIndex(c => k.test(nrm(c)));
    const cN = iv(/portfolio|sell side/), cS = iv(/^segmento/), cL = iv(/localiza/), cT = iv(/^nivel/), cF = iv(/^fat/), cM = iv(/^mandato/), cC = iv(/^contato/), cU = iv(/ultimo contato/), cFi = iv(/^fichas/), cO = iv(/observ/);
    V.slice(V.indexOf(hv) + 1).forEach(r => { const nome0 = r[cN]; if (!nome0) return;
      const parc = /^parce(ria|ito|iro)\s+/i.test(nome0) ? nome0.replace(/^parce(ria|ito|iro)\s+/i, "Parceiro ") : null, seg = r[cS] || "", mand = r[cM] || "", temp = r[cT] || "", obs = [r[cO], r[11] && !/econodata/i.test(r[11]) ? r[11] : ""].filter(Boolean).join(" · ");
      const nome = parc ? `${parc.replace(/^Parceiro /, "")} · ${seg}` : nome0;
      const mm = nrm(mand), desc = /declin/.test(nrm(temp)) || /declin|sem interesse/.test(mm), etapa = desc ? "descartada" : /^ok/.test(mm) ? "mandato" : /pendente/.test(mm) ? "abordada" : /vencido/.test(mm) ? "abordada" : "mapeada";
      const e = novo({nivel:"N3", nome, segmento:seg, ...local(r[cL]), temperatura:temp, fatTxt:r[cF], fat:fat(r[cF]), mandatoTxt:mand, etapa, motivo:desc ? [mand, obs].filter(Boolean).join(" · ") : "", contato:r[cC] || "", obs, razaoMapa:r[cFi] || "", docLink:econodata(r[11]), fonte:"Vendedoras",
        mandato:/^ok/.test(mm) ? "assinado" : /vencido/.test(mm) ? "encerrado" : /pendente/.test(mm) ? "negociacao" : "", parent:parc ? parceiro(parc) : kinsey});
      if (/elis/.test(mm)) e.querEl = "ELIS"; if (data(r[cU])) e.inter.push({data:data(r[cU]), tipo:"Contato", resumo:"Último contato registrado no mapa M&A"}); });
    /* Compradoras → N1 (Advisory → N2) */
    const C = aba(/^comprador|^investidor/i), hc = (C.find(r => r.some(c => /^empresa$/i.test(c))) || []), ic = k => hc.findIndex(c => k.test(nrm(c)));
    const dN = ic(/^empresa/), dT = ic(/^tipo/), dS = ic(/^segmento/), dTe = ic(/tese/), dTo = ic(/^to do/), dSt = ic(/^status/), dL = ic(/localiza/), dE = ic(/e-?mail/), dC = ic(/celular/), dF = ic(/^ficha/), dLk = ic(/^link|econodata/);
    C.slice(C.indexOf(hc) + 1).forEach(r => { const nome = r[dN]; if (!nome) return; const tipo0 = nrm(r[dT]), seg = r[dS] || "", tese = r[dTe] || "", doc = econodata(r[dLk]) || econodata(r[dF]);
      const ja = E.find(e => e.nivel !== "N3" && nn(e.nome) === nn(nome)); if (ja){ ja.obs = [ja.obs, tese].filter(Boolean).join(" · "); return; }
      if (/advisory/.test(tipo0)){ novo({nivel:"N2", nome, tipo:"Assessor financeiro", segmento:seg, obs:tese, ...local(r[dL]), temperatura:r[dSt], contato:[r[dE], r[dC]].filter(Boolean).join(" · "), docLink:doc, fonte:"Compradoras"}); return; }
      const tipo = /fundo/.test(tipo0) ? (/fip/.test(nrm(seg)) ? "Private equity" : "Fundo de investimento") : "Investidor estratégico";
      const e = novo({nivel:"N1", nome, tipo, segmento:seg, tese, ...local(r[dL]), temperatura:r[dSt] || "", contato:r[dE] || "", telefone:r[dC] || "", site:/^https?:/.test(r[dF] || "") ? r[dF] : "", fichaTxt:/^https?:/.test(r[dF] || "") ? "" : (r[dF] || ""), docLink:doc, fonte:"Compradoras"});
      if (r[dTo]) e.inter.push({data:"", tipo:"Tarefa", resumo:"Tarefa do mapa M&A", proximo:r[dTo]}); });
    /* comprador citado só nas abas de cruzamento */
    const comprador = (nome, origem) => { const limpo = nome.replace(/\(.*?\)/g, "").trim(), bc = /buscando contato/i.test(nome); let e = acha(limpo, "N1");
      if (!e){ e = novo({nivel:"N1", nome:limpo, tipo:"Pessoa física qualificada", fonte:origem, obs:`Comprador citado na aba ${origem} do mapa`}); av.push(`Comprador "${limpo}" está na aba ${origem}, mas não na aba Compradoras: cadastrado como investidor.`); }
      if (bc && !e.inter.some(i => /buscando contato/i.test(i.resumo))) e.inter.push({data:"", tipo:"Tarefa", resumo:"Buscando contato (mapa M&A)", proximo:"Conseguir o contato do decisor"}); return e; };
    const vendedor = (nome, uf, mand, fatTxt, origem) => { let e = acha(nome, "N3"); if (!e){ const a = /^a$/i.test(mand); e = novo({nivel:"N3", nome, segmento:"", ...(UFS_.has(uf) ? {uf} : {}), fatTxt, fat:fat(fatTxt), mandatoTxt:a ? "Mandato assinado (aba " + origem + ")" : "", etapa:a ? "mandato" : "mapeada", mandato:a ? "assinado" : "", fonte:origem, parent:kinsey}); }
      else if (/^a$/i.test(mand) && e.etapa !== "descartada"){ e.etapa = "mandato"; e.mandato = "assinado"; } if (uf && e.uf && UFS_.has(uf) && uf !== e.uf) av.push(`${e.nome}: UF ${e.uf} na aba Vendedoras e ${uf} na aba ${origem}; mantida ${e.uf}.`); return e; };
    /* blocos comprador × vendedores (abas M&A e Planilha4): blocos separados por linha em branco */
    Object.keys(P).filter(n => /^m&a$|^planilha\s*\d/i.test(n)).forEach(n => { const R = P[n], h = R.find(r => r.some(c => /buy side/i.test(c))); if (!h) return;
      const cb = h.findIndex(c => /buy side/i.test(c)), ct = h.findIndex(c => /teses/i.test(c)), cv = h.findIndex(c => /sell side/i.test(c)); let bloco = {b:[], v:[], teses:[]};
      const fecha = () => { bloco.b.forEach(b => { bloco.teses.forEach(t => { if (!nrm(b.tese).includes(nrm(t))) b.tese = [b.tese, t].filter(Boolean).join(" · "); }); bloco.v.forEach(v => v.links.add(b)); }); bloco = {b:[], v:[], teses:[]}; };
      R.slice(R.indexOf(h) + 1).forEach(r => { if (!r.some(Boolean)){ fecha(); return; }
        if (r[cb]){ const v = acha(r[cb].replace(/\(.*?\)/g, ""), "N3"); if (!v) bloco.b.push(comprador(r[cb], n)); }
        [r[ct], r[ct + 1]].filter(x => x && !/^\.\.\.$/.test(x)).forEach(t => bloco.teses.push(t));
        if (r[cv] && !/^\.\.\.$/.test(r[cv])) bloco.v.push(vendedor(r[cv], (r[cv + 1] || "").toUpperCase(), r[cv + 2] || "", r[cv + 3] || "", n)); }); fecha(); });
    E.filter(e => e.querEl).forEach(e => { const el = acha("ELIS", "N1"); if (el) e.links.add(el); });
    /* fazendas do Maranhão */
    const F = aba(/^fazendas/i); if (F.length){ const L = F.slice(1).filter(r => r[0] && !/total/i.test(r[0])), ha = L.reduce((t, r) => t + (parseFloat(r[4]) || 0), 0);
      const fz = novo({nivel:"N3", nome:`Fazendas Maranhão (${L.length} áreas)`, segmento:"Ativo fixo · fazendas", uf:"MA", municipio:"Feira Nova do Maranhão", temperatura:"Quente", etapa:"abordada", fonte:"Fazendas_Maranhão", parent:kinsey,
        obs:`${fmt(ha, 0)} hectares à venda: ${L.map(r => `${r[0] === "N/A" ? "área sem nome" : r[0]} (${r[1]}, ${fmt(parseFloat(r[4]) || 0, 0)} ha, ${r[3]})`).join("; ")}`});
      E.filter(e => e.nivel === "N1" && /fazend/.test(nrm(e.tese + " " + e.obs))).forEach(b => fz.links.add(b)); }
    /* To Do */
    const TD = aba(/^to ?do/i); TD.flat().filter(Boolean).forEach(t => { const alvo = E.filter(e => e.nivel === "N1").find(e => toks(e.nome).some(w => w.length > 3 && nrm(t).includes(w)));
      if (alvo){ alvo.inter.push({data:"", tipo:"Tarefa", resumo:"Tarefa da aba To Do", proximo:t}); if (/fazend/.test(nrm(t))){ const fz = E.find(e => /^Fazendas Maranh/.test(e.nome)); if (fz) fz.links.add(alvo); } } else av.push(`Tarefa sem empresa reconhecida: ${t}`); });
    /* Fichas: blocos por coluna, cabeçalho = nome de empresa do mapa */
    const FI = aba(/^fichas/i); for (let c = 0; c < 6; c++){ let atual = null; FI.forEach(r => { const t = r[c]; if (!t) return; const e = t.length <= 60 ? (acha(t) ) : null; if (e && sim(t, e.nome) >= .75){ atual = e; return; } if (atual) atual.fichas.push(t); }); }
    /* CNPJs repetidos em empresas diferentes */
    const docs = {}; E.filter(e => e.docLink).forEach(e => (docs[e.docLink] ||= []).push(e)); Object.values(docs).filter(l => l.length > 1).forEach(l => av.push(`O mesmo CNPJ (${l[0].docLink}) aparece nos links de ${l.map(e => e.nome).join(" e ")}: a Receita decide de quem é.`));
    return {E, av};
  }

  /* ---------------- gravação ---------------- */
  const REG = {Norte:["AC","AM","AP","PA","RO","RR","TO"]};
  const coords = e => { const m = (typeof MUNI !== "undefined" ? MUNI : []).find(([n, uf]) => nrm(n) === nrm(e.municipio) && uf === e.uf); if (m) return [m[2] + (Math.random() - .5) * .08, m[3] + (Math.random() - .5) * .08];
    const PA = {chile:[-33.4, -70.6], eua:[39.8, -98.6], "estados unidos":[39.8, -98.6]}, p = nrm(e.pais); if (p && PA[p]) return [PA[p][0] + Math.random() - .5, PA[p][1] + Math.random() - .5];
    const u = UF_CENTER[e.uf]; return u ? [u[0] + (Math.random() - .5) * .9, u[1] + (Math.random() - .5) * .9] : [-23.55 + (Math.random() - .5) * .6, -46.63 + (Math.random() - .5) * .6]; };
  async function gravar(M){
    const ids = new Map(), existe = e => S.suppliers.find(s => s.nivel === e.nivel && (nn(s.nome) === nn(e.nome) || (e.nivel === "N2" && e.tipo === "Kinsey Capital" && s.tipo === "Kinsey Capital")));
    for (const e of M.E){ const ja = existe(e), id = ja?.id || "km" + Math.random().toString(36).slice(2, 10), [lat, lng] = ja?.lat != null ? [ja.lat, ja.lng] : coords(e);
      const o = {nivel:e.nivel, nome:e.nome, tipo:e.tipo || (e.nivel === "N3" ? "Target · mandato de venda" : ""), segmento:e.segmento ? segDe(e.segmento + " " + (e.tese || "")) : (ja?.segmento || ""), uf:e.uf || ja?.uf || "", municipio:e.municipio || ja?.municipio || "", pais:e.pais || (e.uf ? "Brasil" : ja?.pais || ""), lat, lng, origem:"Mapa M&A Kinsey", importadoEm:nowISO(),
        mapa:{temperatura:e.temperatura || "", segmentoTxt:e.segmento || "", fat:e.fatTxt || "", mandato:e.mandatoTxt || "", contato:e.contato || "", telefone:e.telefone || "", site:e.site || "", obs:e.obs || "", ficha:[e.fichaTxt, ...e.fichas].filter(Boolean).join("\n"), razao:e.razaoMapa || "", aba:e.fonte || "", cnpjLink:e.docLink || ""}};
      if (e.nivel === "N1") o.tese = {...(ja?.tese || {}), segmentos:[...new Set([segDe(e.segmento + " " + e.tese), ...(e.tese || "").split(/[;,/]| - /).map(x => x.trim()).filter(x => x && x.length < 40)])], texto:e.tese || ""};
      if (e.nivel === "N3"){ o.etapa = ja?.etapa && ja.etapa !== "mapeada" && e.etapa === "mapeada" ? ja.etapa : e.etapa; if (e.motivo) o.motivoDescarte = e.motivo; if (e.fat != null) o.fin = {...(ja?.fin || {}), receita:e.fat};
        if (e.mandato) o.mandato = {...(ja?.mandato || {}), status:e.mandato}; o.perfil = {...(ja?.perfil || {}), segmento:segDe(e.segmento), ...(e.obs && /hectare/.test(e.obs) ? {descricao:e.obs} : {})}; o.lado = ja?.lado || "venda"; }
      if (ja) await Store.update("suppliers", id, o); else await Store.set("suppliers", id, {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), ...o});
      ids.set(e, id); }
    for (const e of M.E){ const id = ids.get(e), s = supById(id) || {}, p = {};
      if (e.parent && ids.get(e.parent) && ids.get(e.parent) !== id && !s.parentId) p.parentId = ids.get(e.parent);
      if (e.nivel === "N3" && e.links.size) p.investidores = [...new Set([...(s.investidores || []), ...[...e.links].map(b => ids.get(b)).filter(Boolean)])];
      e.inter.forEach((it, i) => { (p.interacoes ||= {})["mapa" + i] = {...it, por:"Mapa M&A Kinsey"}; });
      if (Object.keys(p).length) await Store.update("suppliers", id, p); }
    return ids;
  }
  /* CNPJs dos links: só usa se a Receita confirmar o nome; se o CNPJ for de outra empresa do mapa, vai para ela */
  async function receitaLinks(M, ids, onp){
    const L = M.E.filter(e => e.docLink), log = []; let n = 0;
    for (const e of L){ n++; onp && onp(n, L.length);
      try{ const r = await ORG.receita(e.docLink), nomes = [r.razao, r.fantasia].filter(Boolean), sc = x => Math.max(...nomes.map(nm => sim(x.nome, nm)), x.razaoMapa ? Math.max(...nomes.map(nm => sim(x.razaoMapa, nm))) : 0);
        let alvo = sc(e) >= .5 ? e : null; if (!alvo){ const outro = M.E.filter(x => x !== e && !x.cnpjOk).map(x => [x, sc(x)]).sort((a, b) => b[1] - a[1])[0]; if (outro && outro[1] >= .6){ alvo = outro[0]; log.push(`CNPJ ${e.docLink} do link de "${e.nome}" é de ${r.razao}: aplicado em "${alvo.nome}".`); } }
        if (!alvo){ log.push(`CNPJ ${e.docLink} do link de "${e.nome}" é de ${r.razao}: não confere, não aplicado.`); await Store.update("suppliers", ids.get(e), {mapa:{avisoCnpj:`Link aponta para ${r.razao} (${e.docLink}); não aplicado.`}}); continue; }
        if (alvo.cnpjOk) continue; alvo.cnpjOk = true; const id = ids.get(alvo), s = supById(id) || {}, p = {doc:e.docLink, receita:{...r, cnaesSec:(r.cnaesSec || []).slice(0, 10), em:nowISO()}, cnae:`${r.cnae} · ${r.cnaeDesc || ""}`, abertura:r.abertura || ""};
        if (r.uf){ p.uf = r.uf; p.pais = "Brasil"; } if (r.municipio){ p.municipio = r.municipio[0] + r.municipio.slice(1).toLowerCase(); const [lat, lng] = coords({uf:p.uf, municipio:p.municipio}); p.lat = lat; p.lng = lng; } if (r.endereco) p.endereco = r.endereco;
        await Store.update("suppliers", id, p); }
      catch(x){ log.push(`CNPJ ${e.docLink} (${e.nome}): Receita indisponível (${x.message || "rede"}).`); }
      await new Promise(r => setTimeout(r, 1200)); }
    return log;
  }

  /* ---------------- tela ---------------- */
  async function importar(file){
    const P = await planilhas(await file.arrayBuffer()); if (!ehKinsey(P)) return false;
    const M = montar(P), c = l => M.E.filter(e => e.nivel === l).length, lk = M.E.filter(e => e.nivel === "N3").reduce((t, e) => t + e.links.size, 0);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Mapa M&A Kinsey · ${esc(file.name)}</div><h2>Importar o mapa</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        <div class="dd-kpis"><div class="dd-k"><span>Targets vendedores (N3)</span><b>${c("N3")}</b><small>${M.E.filter(e => e.nivel === "N3" && e.etapa === "descartada").length} declinados</small></div><div class="dd-k"><span>Investidores e compradores (N1)</span><b>${c("N1")}</b></div><div class="dd-k"><span>Kinsey e parceiros (N2)</span><b>${c("N2")}</b></div><div class="dd-k"><span>Ligações comprador × target</span><b>${lk}</b><small>${M.E.filter(e => e.docLink).length} CNPJs nos links</small></div></div>
        ${M.av.length ? `<div class="banner"><b>Pontos de atenção do mapa</b><ul style="margin:6px 0 0;padding-left:18px">${M.av.map(a => `<li style="font-size:12.5px">${esc(a)}</li>`).join("")}</ul></div>` : ""}
        <div class="tbl" style="max-height:340px;overflow:auto"><table><thead><tr><th>Nível</th><th>Empresa</th><th>Segmento · local</th><th>Temperatura</th><th>Ligações</th></tr></thead><tbody>${M.E.map(e => `<tr><td>${e.nivel}</td><td><b>${esc(e.nome)}</b>${e.docLink ? ` <span class="mono" style="font-size:11px">${esc(e.docLink)}</span>` : ""}</td><td style="font-size:12px">${esc([e.segmento, [e.municipio, e.uf].filter(Boolean).join("/"), e.pais].filter(Boolean).join(" · "))}</td><td>${esc(e.temperatura || "")}</td><td style="font-size:12px">${e.nivel === "N3" ? esc([...e.links].map(b => b.nome).join(", ")) : ""}</td></tr>`).join("")}</tbody></table></div>
        <label class="check"><input type="checkbox" id="km-rf" checked> Conferir na Receita Federal os CNPJs dos links (cerca de ${Math.ceil(M.E.filter(e => e.docLink).length * 1.3 / 60) || 1} min)</label>
        <p class="err" id="km-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn primary" id="km-ok">Importar ${M.E.length} empresas</button></div></div>`);
    $("#km-ok").onclick = async () => { const b = $("#km-ok"), rf = $("#km-rf").checked; b.disabled = true; b.textContent = "Importando…"; const ids = await gravar(M); close(); toast(`Mapa M&A importado: ${M.E.length} empresas`);
      if (rf){ const pill = document.createElement("div"); pill.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:40;background:#0a2b5e;color:#fff;border:1px solid #7fb8e6;border-radius:20px;padding:6px 14px;font-size:12.5px"; document.body.appendChild(pill);
        const log = await receitaLinks(M, ids, (n, t) => pill.textContent = `Receita Federal: conferindo CNPJ ${n} de ${t}…`); pill.remove();
        if (log.length) sheet(`<div class="sheet-h"><div><div class="eyebrow">Mapa M&A · CNPJs</div><h2>Conferência na Receita</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="sheet-b"><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">${log.map(l => `<li style="font-size:13px">${esc(l)}</li>`).join("")}</ul></div>`); else toast("CNPJs conferidos na Receita"); } };
    return true;
  }
  /* o botão "Importar mapa M&A" reconhece a planilha da Kinsey; outras planilhas seguem o importador simples */
  if (window.KT_MAPA){ const _imp = KT_MAPA.importar; KT_MAPA.importar = () => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".xlsx,.xlsm,.ods,.csv,.txt";
    inp.onchange = async () => { const f = inp.files[0]; if (!f) return; if (/\.xlsx$|\.xlsm$/i.test(f.name)){ try{ if (await importar(f)) return; }catch(e){ console.error(e); toast("Não consegui ler o Excel: " + (e.message || "erro")); return; } } _imp(); toast("Planilha em outro formato: use o importador simples."); }; inp.click(); }; }
  window.KT_KMAPA = {planilhas, montar, gravar, receitaLinks, importar, sim};
})();
