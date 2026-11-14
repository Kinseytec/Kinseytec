/* ================= ÓRGÃOS PÚBLICOS E LISTAS RESTRITIVAS =================
   1) Receita Federal: consulta automática do CNPJ (dados públicos do cadastro: situação, abertura, CNAE, capital,
      natureza, porte, endereço e quadro de sócios) por serviço público de consulta, ao abrir o dossiê ou em lote.
   2) Listas oficiais importadas pelo administrador (Cadastro de Empregadores do MTE, CEIS, CNEP, áreas embargadas
      do IBAMA e lista própria): o sistema cruza fornecedor, sócios (dos contratos sociais e da Receita) e favorecidos
      de pagamentos. CPFs nunca saem do sistema: a comparação é feita com as listas guardadas na própria base.
   Ocorrências entram na matriz de risco, na aba Investigação e no relatório. */
const ORG = (() => {
  const DIA = 864e5, dl = v => String(v || "").toUpperCase().replace(/[^0-9A-Z]/g, "");
  const semAc = t => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const fmtDoc = d => d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d.length === 11 ? d.replace(/^(\d{3})\d{6}(\d{2})$/, "$1.***.***-$2") : d;
  const dBR = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("pt-BR") : "—";
  const prod = () => typeof OPS_PROD !== "undefined" ? OPS_PROD : null;
  const BASES = [
    ["lista_suja", "Cadastro de Empregadores – trabalho análogo ao de escravo (MTE)", "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/cadastro_de_empregadores.pdf"],
    ["ceis", "CEIS – Empresas Inidôneas e Suspensas (CGU)", "https://portaldatransparencia.gov.br/download-de-dados/ceis"],
    ["cnep", "CNEP – Empresas Punidas pela Lei Anticorrupção (CGU)", "https://portaldatransparencia.gov.br/download-de-dados/cnep"],
    ["ibama", "Áreas embargadas – IBAMA", "https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php"],
    ["propria", "Lista restritiva própria (cliente ou Kinsey BR)", ""]];
  const rot = b => (BASES.find(x => x[0] === b) || [, b])[1];

  /* =========================================================== RECEITA FEDERAL */
  async function receita(doc){
    const d = dl(doc); if (d.length !== 14) throw new Error("cpf");
    const pega = async (url, map) => { const r = await fetch(url, {headers: {Accept: "application/json"}}); if (!r.ok) throw new Error("http " + r.status); return map(await r.json()); };
    try{
      return await pega(`https://brasilapi.com.br/api/cnpj/v1/${d}`, j => ({fonte: "Receita Federal (BrasilAPI)", razao: j.razao_social || "", fantasia: j.nome_fantasia || "", situacao: String(j.descricao_situacao_cadastral || "").toUpperCase(), dataSituacao: j.data_situacao_cadastral || "",
        motivo: j.descricao_motivo_situacao_cadastral || "", especial: j.situacao_especial || "", abertura: j.data_inicio_atividade || "", cnae: String(j.cnae_fiscal || ""), cnaeDesc: j.cnae_fiscal_descricao || "",
        cnaesSec: (j.cnaes_secundarios || []).filter(c => c && c.codigo).map(c => c.codigo + " " + c.descricao).slice(0, 40), capital: +j.capital_social || 0, natureza: j.natureza_juridica || "", porte: j.porte || j.descricao_porte || "",
        mei: !!j.opcao_pelo_mei, simples: !!j.opcao_pelo_simples, uf: j.uf || "", municipio: j.municipio || "", endereco: [j.descricao_tipo_de_logradouro, j.logradouro, j.numero, j.bairro].filter(Boolean).join(" "), cep: j.cep || "",
        socios: (j.qsa || []).map(q => ({nome: q.nome_socio || "", doc: String(q.cnpj_cpf_do_socio || ""), qual: q.qualificacao_socio || "", desde: q.data_entrada_sociedade || ""}))}));
    }catch(e){
      return await pega(`https://publica.cnpj.ws/cnpj/${d}`, j => { const e2 = j.estabelecimento || {}; return {fonte: "Receita Federal (CNPJ.ws)", razao: j.razao_social || "", fantasia: e2.nome_fantasia || "", situacao: String(e2.situacao_cadastral || "").toUpperCase(),
        dataSituacao: e2.data_situacao_cadastral || "", motivo: e2.motivo_situacao_cadastral?.descricao || "", especial: e2.situacao_especial || "", abertura: e2.data_inicio_atividade || "", cnae: String(e2.atividade_principal?.id || ""), cnaeDesc: e2.atividade_principal?.descricao || "",
        cnaesSec: (e2.atividades_secundarias || []).map(a => a.id + " " + a.descricao).slice(0, 40), capital: parseFloat(String(j.capital_social || "0").replace(",", ".")) || 0, natureza: j.natureza_juridica?.descricao || "", porte: j.porte?.descricao || "",
        mei: j.simples?.mei === "Sim", simples: j.simples?.simples === "Sim", uf: e2.estado?.sigla || "", municipio: e2.cidade?.nome || "", endereco: [e2.tipo_logradouro, e2.logradouro, e2.numero, e2.bairro].filter(Boolean).join(" "), cep: e2.cep || "",
        socios: (j.socios || []).map(q => ({nome: q.nome || "", doc: String(q.cpf_cnpj_socio || ""), qual: q.qualificacao_socio?.descricao || "", desde: q.data_entrada || ""}))}; });
    }
  }
  const SIT = {ATIVA: "Ativa", INAPTA: "Inapta", SUSPENSA: "Suspensa", BAIXADA: "Baixada", NULA: "Nula"};
  function achadosReceita(s){
    const r = s.receita, A = []; if (!r || r.erro) return A; const add = (cod, sev, txt) => A.push({cod, sev, txt}), p = prod();
    if (r.especial) add("especial", "medio", `Situação especial na Receita: ${r.especial}`);
    const ativ = [r.cnaeDesc, ...(r.cnaesSec || [])].join(" | ");
    if (p?.kw && ativ.trim() && !p.kw.test(ativ)) add("cnae", "medio", `Atividades na Receita (CNAE ${r.cnae} ${r.cnaeDesc}) não incluem ${p.prod}`);
    const v = parseFloat(String(s.volume || "").replace(",", ".")), un = p?.demo?.[2], pr = p?.demo?.[3], kgp = un === "KG" ? pr : un === "SC" ? pr / 60 : un === "@" ? pr / 15 : null, fat = v && kgp ? v * 1000 * kgp : null;
    if (r.mei && fat && fat > 81000) add("mei", "medio", `Optante pelo MEI (limite de R$ 81 mil/ano) com volume declarado de ${fmt(v, 1)} t (cerca de R$ ${fmt(fat)} por ano)`);
    else if (fat && r.capital && r.capital < fat * .01) add("capital", "medio", `Capital social de R$ ${fmt(r.capital, 2)} inferior a 1% do faturamento estimado (R$ ${fmt(fat)} por ano)`);
    if (r.uf && s.uf && r.uf !== s.uf) add("uf", "baixo", `UF na Receita (${r.uf}) diferente da cadastrada (${s.uf})`);
    else if (r.municipio && s.municipio && semAc(r.municipio) !== semAc(s.municipio)) add("municipio", "baixo", `Município na Receita (${r.municipio}) diferente do cadastrado (${s.municipio})`);
    if (r.razao && s.nome){ const tok = semAc(s.nome).replace(/exemplo|ltda|s\/?a\b|eireli|\bme\b|epp/g, " ").split(/\W+/).filter(w => w.length >= 4), rz = semAc(r.razao); if (tok.length && tok.filter(w => rz.includes(w)).length / tok.length < .4) add("razao", "baixo", `Razão social na Receita (${r.razao}) diferente do cadastro`); }
    return A;
  }
  const PESO = {alto: 6, medio: 3, baixo: 1};

  /* =========================================================== LISTAS RESTRITIVAS */
  const LS = "kinseytec-listas";
  const loc = () => { try{ return JSON.parse(localStorage.getItem(LS)) || {meta: {}, rows: {}}; }catch(e){ return {meta: {}, rows: {}}; } };
  let META = null; const BLK = new Map();
  async function metas(){
    if (META && Date.now() - (metas.t || 0) < 30 * 60e3) return META;   /* relê a cada 30 min: as listas são atualizadas sozinhas */
    metas.t = Date.now(); BLK.clear();
    if (Store.db){ try{ const q = await Store.db.collection("listas").where("meta", "==", true).get(); META = Object.fromEntries(q.docs.map(d => [d.data().base, d.data()])); }catch(e){ META = {}; } }
    else META = loc().meta || {};
    return META;
  }
  const chaves = d => { d = dl(d); const out = []; if (/^\d{14}$/.test(d) || /^\d{11}$/.test(d)) out.push(d); if (/^\d{11}$/.test(d)) out.push("m" + d.slice(3, 9)); const m = String(d).match(/^\D*(\d{6})\D*$/); if (m && d.length <= 11) out.push("m" + m[1]); return out; };
  async function buscar(keys){
    const M = await metas(), out = []; if (!Object.keys(M).length || !keys.length) return out;
    if (Store.db){
      /* formato em blocos (prefixo de 3 caracteres): um documento por bloco, com cache na sessão */
      const blocos = Object.entries(M).filter(([, m]) => m.formato === "blocos"), pedir = new Set();
      blocos.forEach(([b]) => keys.forEach(k => pedir.add(b + "__" + k.slice(0, 3))));
      await Promise.all([...pedir].map(async id => { if (BLK.has(id)) return; try{ const d = await Store.db.collection("listas").doc(id).get(); BLK.set(id, d.exists ? d.data() : null); }catch(e){} }));
      blocos.forEach(([b, m]) => keys.forEach(k => { const x = BLK.get(b + "__" + k.slice(0, 3)); if (x && x.v === m.versao && x.r && x.r[k]) out.push({base: b, k, n: x.r[k][0], i: x.r[k][1]}); }));
      /* formato antigo (um documento por registro), para listas carregadas antes */
      const antigas = Object.entries(M).filter(([, m]) => m.formato !== "blocos");
      if (antigas.length) for (let i = 0; i < keys.length; i += 30){ try{ const q = await Store.db.collection("listas").where("k", "in", keys.slice(i, i + 30)).get();
        q.docs.forEach(d => { const x = d.data(); if (M[x.base] && M[x.base].formato !== "blocos" && x.v === M[x.base].versao) out.push(x); }); }catch(e){} } }
    else { const L = loc(); keys.forEach(k => Object.entries(L.rows || {}).forEach(([b, rows]) => { if (rows[k]) out.push({base: b, k, n: rows[k][0], i: rows[k][1]}); })); }
    return out;
  }
  const mesmoNome = (a, b) => { const x = semAc(a).split(/\s+/).filter(w => w.length > 2), y = semAc(b); return x.length >= 2 && y.includes(x[0]) && y.includes(x[x.length - 1]); };
  function alvosDe(s){
    const alvos = [];
    const put = (doc, quem, nome) => chaves(doc).forEach(k => alvos.push({k, quem, nome, mask: k[0] === "m"}));
    put(s.doc, s.nivel === "N3" && dl(s.doc).length === 11 ? "Produtor" : "Fornecedor", s.nome);
    S.evidences.filter(e => e.supplierId === s.id).forEach(e => (e.analise?.extraido?.socios || []).filter(q => q.valido).forEach(q => put(q.cpf, "Sócio", q.nome)));
    (s.receita?.socios || []).forEach(q => put(q.doc, "Sócio (Receita)", q.nome));
    if (typeof OPS !== "undefined") OPS.analise().R.filter(x => x.sup?.id === s.id).forEach(x => x.pags.forEach(g => { if (dl(g.pag.favDoc) && dl(g.pag.favDoc) !== dl(s.doc)) put(g.pag.favDoc, "Favorecido de pagamento", g.pag.favNome); }));
    return [...new Map(alvos.map(a => [a.k + "|" + a.quem, a])).values()];
  }
  const assinatura = (uniq, M) => [...new Set(uniq.map(a => a.k))].sort().join(",") + "|" + Object.values(M).map(m => m.versao).sort().join(",");
  async function verificar(s){
    const uniq = alvosDe(s);
    const rows = await buscar([...new Set(uniq.map(a => a.k))]), M = await metas(), ach = [];
    rows.forEach(r => uniq.filter(a => a.k === r.k).forEach(a => { if (a.mask && !mesmoNome(a.nome, r.n || "")) return; ach.push({base: r.base, rotulo: rot(r.base), k: r.k, quem: a.quem, nome: a.nome || r.n || "", nomeLista: r.n || "", info: r.i || ""}); }));
    const res = {em: nowISO(), achados: [...new Map(ach.map(a => [a.base + "|" + semAc(a.nome || a.k), a])).values()], bases: Object.fromEntries(Object.entries(M).map(([b, m]) => [b, m.em])), verificados: uniq.length, sig: assinatura(uniq, M)};
    if (supById(s.id)) await Store.update("suppliers", s.id, {listas: res}).catch(() => {}); return res;   /* consulta avulsa de CNPJ não grava */
  }
  /* importação de uma lista (administrador) */
  function csvRows(t){ const ls = t.split(/\r?\n/).filter(l => l.trim()); if (!ls.length) return []; const sep = ["\t", ";", "|", ","].map(c => [c, ls[0].split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    return ls.map(l => { const out = []; let cur = "", q = false; for (const ch of l){ if (ch === '"') q = !q; else if (ch === sep && !q){ out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map(x => x.trim()); }); }
  async function lerLista(f){
    const n = f.name.toLowerCase(), buf = await f.arrayBuffer(); let rows;
    if (/\.zip$/.test(n)){ const z = await IMP.unzip(buf), k = Object.keys(z).find(k => /\.(csv|txt)$/i.test(k)); if (!k) throw new Error("zip"); rows = csvRows(await z[k].get()); }
    else if (/\.xlsx$|\.xlsm$/.test(n)) rows = await IMP.lerXLSX(buf); else if (/\.ods$/.test(n)) rows = await IMP.lerODS(buf); else if (/\.pdf$/.test(n)) rows = await IMP.lerPDF(buf);
    else { let t = new TextDecoder("utf-8").decode(buf); if (t.includes("�")) t = new TextDecoder("latin1").decode(buf); rows = csvRows(t); }
    const reDoc = /(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|[\d*Xx]{3}\.?\d{3}\.?\d{3}-?[\d*Xx]{2})/;
    let hi = -1, cd = -1, cn = -1, ci = [];
    for (let r = 0; r < Math.min(rows.length, 15); r++){ const h = rows[r].map(c => semAc(c)); const d = h.findIndex(c => /cpf|cnpj/.test(c) && c.length < 60);
      if (d >= 0){ hi = r; cd = d; cn = h.findIndex((c, j) => j !== d && /nome|razao|empregador|sancionad|infrator|autuad|pessoa/.test(c)); ci = h.map((c, j) => /sancao|tipo|categ|orgao|^uf|munic|data|inicio|fim|motivo|infra|estabelecimento|trabalhador|processo|termo|area/.test(c) && j !== d && j !== cn ? j : -1).filter(j => j >= 0).slice(0, 4); break; } }
    const out = new Map();
    rows.slice(hi + 1).forEach(r => { let doc = "", nome = "", info = "";
      if (hi >= 0){ doc = String(r[cd] || ""); nome = cn >= 0 ? String(r[cn] || "") : ""; info = ci.map(j => r[j]).filter(Boolean).join(" · "); }
      else { const t = r.join(" "), m = t.match(reDoc); if (!m) return; doc = m[1]; nome = t.replace(m[1], " ").replace(/\s+/g, " ").trim().slice(0, 90); }
      const d = dl(doc).replace(/X/g, ""); let k = "";
      if (/^\d{14}$/.test(d) || /^\d{11}$/.test(d)) k = d; else { const m6 = String(doc).match(/^[\s*Xx.]*?(\d{3})\.?(\d{3})[^\d]*$/) || String(doc).replace(/[^\d*]/g, "").match(/^\*{3}(\d{6})\*{2}$/); if (m6) k = "m" + (m6[2] ? m6[1] + m6[2] : m6[1]); }
      if (k){ out.set(k, [nome.slice(0, 90), info.slice(0, 160)]); if (/^\d{11}$/.test(k)) out.set("m" + k.slice(3, 9), [nome.slice(0, 90), info.slice(0, 160)]); } });
    return out;
  }
  async function gravarLista(base, mapa, arquivo, prog){
    const versao = Date.now().toString(36), meta = {meta: true, base, linhas: mapa.size, arquivo, em: nowISO(), por: Store.me.id || "", versao};
    if (Store.db){ const B = {}; for (const [k, v] of mapa){ const p = k.slice(0, 3); (B[p] = B[p] || {})[k] = v; } const ent = Object.entries(B); meta.formato = "blocos";
      for (let i = 0; i < ent.length; i += 400){ const b = Store.db.batch(); ent.slice(i, i + 400).forEach(([p, r]) => b.set(Store.db.collection("listas").doc(base + "__" + p), {base, p, v: versao, r})); await b.commit(); if (prog) prog(Math.min(i + 400, ent.length), ent.length); }
      await Store.db.collection("listas").doc("_meta_" + base).set(meta); }
    else { const L = loc(); L.rows = L.rows || {}; L.meta = L.meta || {}; L.rows[base] = Object.fromEntries(mapa); L.meta[base] = meta;
      try{ localStorage.setItem(LS, JSON.stringify(L)); }catch(e){ throw new Error("espaco"); } }
    META = null; BLK.clear(); return meta;
  }

  /* =========================================================== ATUALIZAÇÃO */
  const ocup = new Set();
  async function atualizar(s, avisar, opc = {}){
    if (!s || ocup.has(s.id)) return; ocup.add(s.id); let msg = "";
    try{
      if (dl(s.doc).length === 14 && opc.receita !== false){
        try{ const r = await receita(s.doc), patch = {receita: {...r, em: nowISO()}, invest: {dataConsulta: new Date().toISOString().slice(0, 10)}};
          if (SIT[r.situacao]) patch.invest.situacao = SIT[r.situacao]; if (!s.abertura && r.abertura) patch.abertura = r.abertura;
          await Store.update("suppliers", s.id, patch); msg = "Receita consultada"; }
        catch(e){ await Store.update("suppliers", s.id, {receita: {...(s.receita || {}), erro: "Consulta indisponível no momento (" + (e.message || "rede") + ")", tentativa: nowISO()}}).catch(() => {}); msg = "Receita indisponível agora"; } }
      const v = await verificar(supById(s.id) || s); msg += (msg ? " · " : "") + (v.achados.length ? `${v.achados.length} ocorrência(s) em listas` : "listas sem ocorrências");
    }finally{ ocup.delete(s.id); }
    if (avisar) toast(msg);
  }
  /* consulta automática ao abrir o dossiê (no máximo a cada 30 dias para a Receita e 7 dias para as listas) */
  const _abre = openSupplier;
  openSupplier = function(id, tab){ const r = _abre.apply(this, arguments); setTimeout(() => { const s = supById(id); if (!s || !Store.me.canWrite) return;
    const velho = (d, n) => !d || Date.now() - new Date(d).getTime() > n * DIA;
    if ((dl(s.doc).length === 14 && velho(s.receita?.em || s.receita?.tentativa, s.receita?.erro ? 1 : 30)) || velho(s.listas?.em, 7)) atualizar(s, false); }, 80); return r; };
  async function todos(btn){
    const L = S.suppliers.slice(); let n = 0;
    for (const s of L){ n++; if (btn) btn.textContent = `Consultando ${n} de ${L.length}…`; await atualizar(s, false); await new Promise(r => setTimeout(r, 350)); }
    if (btn){ btn.disabled = false; btn.textContent = "Reconsultar todos agora"; } toast(`${L.length} fornecedor(es) consultado(s)`);
  }

  /* =========================================================== DILIGÊNCIA AUTOMÁTICA
     Sem clique: a cada mudança nos dados (fornecedor cadastrado, importado, vindo do Portal ou do mapeamento; nota, pagamento
     ou pedido importado; documento anexado; lista oficial atualizada) o sistema verifica quem precisa de consulta e consulta
     em segundo plano, um por vez. Receita: renovada a cada 30 dias (nova tentativa em 6 h se o serviço falhar). Listas: sempre
     que mudar o que deve ser verificado (sócios, favorecidos) ou a versão das listas. */
  const H = 3600e3, velho = (iso, h) => !iso || Date.now() - new Date(iso).getTime() > h * H;
  const precisaReceita = r => r ? (r.erro ? velho(r.tentativa, 6) : velho(r.em, 24 * 30)) : true;
  let fila = [], rodando = false, totalFila = 0, feitos = 0, tAg = null, ultima = null;
  const pillAuto = () => { let el = document.getElementById("kt-auto"); if (!el){ el = document.createElement("div"); el.id = "kt-auto";
      el.style.cssText = "position:fixed;right:12px;bottom:calc(74px + env(safe-area-inset-bottom,0px));z-index:30;background:var(--navy,#0a2b5e);border:1px solid var(--glow,#7fb8e6);color:var(--fog,#fff);border-radius:20px;padding:6px 12px;font-size:12px;box-shadow:0 4px 14px rgba(0,0,0,.35);pointer-events:none";
      document.body.appendChild(el); } return el; };
  const mostra = () => { const el = pillAuto(); if (!fila.length && !rodando){ el.hidden = true; return; } el.hidden = false; el.textContent = `Diligência automática: consultando ${Math.min(feitos + 1, totalFila)} de ${totalFila} (Receita e listas)…`; };
  function externos(){
    if (typeof OPS === "undefined") return []; const A = OPS.analise(), C = S.config.consultas || {}, out = new Set();
    A.R.forEach(x => { if (!x.sup && /^\d{14}$/.test(x.forn.doc) && IMP.docValido(x.forn.doc)) out.add(x.forn.doc); });
    A.G.forEach(g => { const d = dl(g.pag.favDoc); if (!g.sup && /^\d{14}$/.test(d) && IMP.docValido(d)) out.add(d); });
    return [...out].filter(d => !supPorDocO(d) && precisaReceita(C[d]));
  }
  const supPorDocO = d => S.suppliers.find(s => dl(s.doc) === d);
  async function agendar(){
    if (!Store.me?.canWrite || document.hidden) return; const M = await metas(), temListas = Object.keys(M).length > 0;
    const novos = [];
    S.suppliers.forEach(s => { const cnpj = dl(s.doc).length === 14 && IMP.docValido(s.doc);
      const rec = cnpj && precisaReceita(s.receita), lis = temListas && (s.listas?.sig !== assinatura(alvosDe(s), M));
      if ((rec || lis) && !fila.some(f => f.id === s.id) && !ocup.has(s.id)) novos.push({tipo: "sup", id: s.id, novo: !s.receita && !s.listas, rec}); });
    externos().forEach(d => { if (!fila.some(f => f.doc === d)) novos.push({tipo: "ext", doc: d}); });
    if (!novos.length) return;
    /* quem acabou de entrar na cadeia vai para a frente da fila */
    fila = [...novos.filter(n => n.novo), ...fila, ...novos.filter(n => !n.novo)]; totalFila = feitos + fila.length; mostra(); processar();
  }
  async function processar(){
    if (rodando) return; rodando = true;
    try{ while (fila.length){ const f = fila.shift(); mostra();
        let rede = f.tipo === "ext";
        try{ if (f.tipo === "sup"){ const s = supById(f.id); if (s){ rede = !!f.rec; await atualizar(s, false, {receita: !!f.rec}); } } else await consultarExterno(f.doc); }catch(e){}
        feitos++; if (rede) await new Promise(r => setTimeout(r, 1200)); } }
    finally{ rodando = false; feitos = 0; totalFila = 0; ultima = nowISO(); mostra(); }
  }
  /* CNPJ ainda fora da cadeia (emitente de nota ou favorecido de pagamento): resultado guardado na configuração do cliente */
  async function consultarExterno(doc){
    let reg = {em: nowISO()};
    try{ const r = await receita(doc); reg = {...reg, situacao: r.situacao, abertura: r.abertura, razao: r.razao, uf: r.uf, municipio: r.municipio, cnae: r.cnae, cnaeDesc: r.cnaeDesc, mei: r.mei, capital: r.capital,
        receita: {...r, cnaesSec: (r.cnaesSec || []).slice(0, 10), em: nowISO()}}; }
    catch(e){ reg = {...reg, erro: "Consulta indisponível (" + (e.message || "rede") + ")", tentativa: nowISO()}; }
    const keys = [...chaves(doc), ...((reg.receita?.socios) || []).flatMap(q => chaves(q.doc))], rows = await buscar([...new Set(keys)]);
    reg.listas = [...new Map(rows.map(r => [r.base, {base: r.base, rotulo: rot(r.base), nome: r.n || "", info: r.i || ""}])).values()];
    await Store.update("config", "consultas", {[doc]: reg}).catch(() => {});
  }
  /* qualquer mudança nos dados agenda a verificação (com pequena espera para juntar várias mudanças) */
  const _render = renderAll;
  renderAll = function(){ const r = _render.apply(this, arguments); clearTimeout(tAg); tAg = setTimeout(() => agendar().catch(() => {}), 1500); return r; };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) agendar().catch(() => {}); });

  /* =========================================================== MATRIZ DE RISCO */
  EXT_RISKS.push((s, add) => {
    achadosReceita(s).forEach(a => add("Receita Federal", a.txt, PESO[a.sev]));
    (s.listas?.achados || []).forEach(a => add("Listas restritivas", `${a.rotulo}: ${a.quem.toLowerCase()} ${a.nome}${a.info ? " (" + a.info + ")" : ""}`, 6));
  });
  EXT_TOUCH.push(s => !!(s.receita && !s.receita.erro) || !!(s.listas?.achados || []).length);

  /* =========================================================== TELAS */
  const pill = sev => `<span class="pill ${sev === "alto" ? "r-alto" : sev === "medio" ? "r-medio" : "r-baixo"}" style="font-size:10.5px;padding:1px 8px">${sev === "alto" ? "Alto" : sev === "medio" ? "Médio" : "Baixo"}</span>`;
  EXT_INV.push((s, b) => {
    const r = s.receita, A = achadosReceita(s), la = s.listas;
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head"><div><h3>Consulta automática a órgãos públicos</h3><p class="sub" style="margin:4px 0 0">Receita Federal ${dl(s.doc).length === 14 ? (r?.em ? "consultada em " + dt(r.em) : r?.erro ? "· " + esc(r.erro) : "· ainda não consultada") : "· CPF não tem consulta pública automática"} · listas restritivas ${la?.em ? "verificadas em " + dt(la.em) : "ainda não verificadas"}.</p></div>${Store.me.canWrite ? `<button type="button" class="btn sm primary" id="org-go">Consultar agora</button>` : ""}</div>
      ${r && !r.erro ? `<dl class="kv"><dt>Situação</dt><dd><b style="color:${r.situacao === "ATIVA" ? "var(--ok)" : "var(--bad)"}">${esc(r.situacao || "—")}</b>${r.dataSituacao ? " desde " + dBR(r.dataSituacao) : ""}${r.motivo && r.situacao !== "ATIVA" ? " · " + esc(r.motivo) : ""}</dd>
        <dt>Razão social</dt><dd>${esc(r.razao)}${r.fantasia ? " · " + esc(r.fantasia) : ""}</dd><dt>Abertura</dt><dd>${dBR(r.abertura)}</dd><dt>Atividade principal</dt><dd>${esc(r.cnae)} ${esc(r.cnaeDesc)}</dd>
        <dt>Natureza · porte</dt><dd>${esc(r.natureza || "—")} · ${esc(r.porte || "—")}${r.mei ? " · MEI" : r.simples ? " · Simples" : ""}</dd><dt>Capital social</dt><dd>R$ ${fmt(r.capital, 2)}</dd><dt>Endereço</dt><dd>${esc(r.endereco)} · ${esc(r.municipio)}/${esc(r.uf)}</dd>
        <dt>Sócios e administradores</dt><dd>${(r.socios || []).length ? r.socios.slice(0, 10).map(q => `${esc(q.nome)} <span class="sub" style="font-size:11.5px">${esc(q.qual)}</span>`).join("<br>") : "—"}</dd><dt>Fonte</dt><dd>${esc(r.fonte)}</dd></dl>` : ""}
      ${A.length ? `<div style="display:flex;flex-direction:column;gap:6px">${A.map(a => `<div style="display:flex;gap:8px;font-size:13px">${pill(a.sev)}<span>${esc(a.txt)}</span></div>`).join("")}</div>` : ""}
      ${la ? (la.achados.length ? `<div style="display:flex;flex-direction:column;gap:6px">${la.achados.map(a => `<div style="display:flex;gap:8px;font-size:13px">${pill("alto")}<span><b>${esc(a.rotulo)}</b>: ${esc(a.quem)} ${esc(a.nome)} <span class="mono">${esc(a.k[0] === "m" ? "CPF parcial ***" + a.k.slice(1) + "**" : fmtDoc(a.k))}</span>${a.info ? " · " + esc(a.info) : ""}</span></div>`).join("")}</div>`
        : `<p class="sub" style="margin:0">Nenhuma ocorrência nas listas carregadas (${Object.keys(la.bases || {}).map(rot).join("; ") || "nenhuma lista carregada pelo administrador"}). Itens verificados: fornecedor${la.verificados > 1 ? ", sócios e favorecidos" : ""} (${la.verificados}).</p>`) : ""}`;
    const ref = b.querySelector(".form"); if (ref) ref.after(el); else b.prepend(el);
    const g = $("#org-go", el); if (g) g.onclick = async () => { g.disabled = true; g.textContent = "Consultando…"; await atualizar(s, true); };
  });
  let audTok = 0;
  EXT_AUD.push(async () => {
    const my = ++audTok; if (!$("#auditoria")) return; const M = await metas(); const host = $("#aud-tecb") || $("#auditoria"); if (my !== audTok || !host || !host.isConnected) return; const adm = Store.me.role === "admin" || Store.mode === "local";
    const comLista = S.suppliers.filter(s => (s.listas?.achados || []).length), irreg = S.suppliers.filter(s => s.receita?.situacao && s.receita.situacao !== "ATIVA"), semC = S.suppliers.filter(s => dl(s.doc).length === 14 && !s.receita?.em);
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head"><div><div class="eyebrow">N1, N2 e N3 · fornecedores, sócios e favorecidos</div><h3>Órgãos públicos e listas restritivas</h3><p class="sub" style="margin:4px 0 0">${comLista.length} fornecedor(es) com ocorrência em listas · ${irreg.length} com CNPJ irregular na Receita · ${semC.length} CNPJ(s) ainda não consultado(s).</p></div>
        ${Store.me.canWrite ? `<button type="button" class="btn sm" id="org-all">Reconsultar todos agora</button>` : ""}</div>
      ${comLista.length ? `<div style="display:flex;flex-direction:column;gap:4px">${comLista.slice(0, 12).map(s => `<button type="button" class="btn ghost sm" style="justify-content:flex-start;text-align:left" data-oo="${s.id}">${pill("alto")} <span class="lvtag">${s.nivel}</span> ${esc(s.nome)} · ${esc(s.listas.achados.map(a => a.rotulo.split(" –")[0]).join(", "))}</button>`).join("")}</div>` : ""}
      <div class="tbl"><table><thead><tr><th>Lista oficial</th><th>Registros</th><th>Atualizada</th><th></th></tr></thead><tbody>${BASES.map(([k, l, u]) => `<tr><td style="min-width:200px">${esc(l)}${u ? ` · <a href="${u}" target="_blank" rel="noopener" style="color:var(--glow)">baixar no site oficial ↗</a>` : ""}</td><td class="mono">${M[k] ? fmt(M[k].linhas) : "—"}</td><td>${M[k] ? dt(M[k].em) + `<div class="sub" style="margin:0;font-size:11px">${M[k].por === "automático" ? "automática · " + esc(M[k].fonte || "") + (M[k].verificadoEm ? " · conferida " + dt(M[k].verificadoEm) : "") : "carregada manualmente · " + esc(M[k].arquivo || "")}</div>` : k === "propria" ? "opcional" : Store.db ? "aguardando a primeira carga automática" : "automática na versão publicada"}</td>
        <td>${adm ? `<label class="btn sm" style="cursor:pointer">${M[k] ? "Atualizar" : "Carregar"}<input type="file" data-lb="${k}" accept=".csv,.txt,.zip,.xlsx,.xlsm,.ods,.pdf" hidden></label>` : ""}</td></tr>`).join("")}</tbody></table></div>
      <p class="sub" style="margin:0;font-size:12px">A diligência é automática: ao cadastrar ou importar fornecedores, notas fiscais, pagamentos e documentos, o sistema consulta a Receita Federal (dados públicos do CNPJ), cruza fornecedores, sócios e favorecidos com as listas e atualiza os riscos no globo, na cadeia, na auditoria e no relatório. Ficam manuais apenas as consultas que exigem certificado digital ou autorização do cliente (situação da nota na SEFAZ, e-CAC). As listas oficiais (MTE, CEIS, CNEP e IBAMA) são baixadas automaticamente dos sites dos órgãos todos os dias às 6h30; a comparação com fornecedores, sócios e favorecidos é feita dentro do sistema, sem enviar CPFs a terceiros. A lista própria (do cliente ou da Kinsey BR) pode ser carregada pelo administrador.</p>
      ${adm && window.firebase?.functions ? `<button type="button" class="btn sm" id="org-ag" style="align-self:flex-start">Atualizar listas oficiais agora</button>` : ""}
      <p class="sub" id="org-st" style="margin:0"></p>`;
    host.appendChild(el);
    $$("[data-oo]", el).forEach(x => x.onclick = () => openSupplier(x.dataset.oo, "invest"));
    const al = $("#org-all", el); if (al) al.onclick = () => { al.disabled = true; todos(al); };
    const ag = $("#org-ag", el); if (ag) ag.onclick = async () => { if (typeof COTA === "undefined") return; ag.textContent = "Baixando as listas (até 2 minutos)…"; ag.disabled = true; await COTA.atualizar("listas"); META = null; BLK.clear(); renderAll(); };
    $$("[data-lb]", el).forEach(inp => inp.onchange = async () => { const f = inp.files[0], base = inp.dataset.lb; if (!f) return; const st = $("#org-st"); st.textContent = "Lendo " + f.name + "…";
      try{ const m = await lerLista(f); if (!m.size){ st.textContent = "Nenhum CPF/CNPJ reconhecido no arquivo. Confira se é a lista correta."; return; }
        IMP.confirma(`<b>Carregar ${fmt(m.size)} registro(s) em “${esc(rot(base))}”?</b><p class="sub" style="margin:6px 0 0">A versão anterior desta lista deixa de valer. Depois, use “Consultar todos os fornecedores”.</p>`, "Carregar", "", async () => {
          st.textContent = "Gravando…"; try{ await gravarLista(base, m, f.name, (a, t) => st.textContent = `Gravando ${fmt(a)} de ${fmt(t)}…`); st.textContent = `${fmt(m.size)} registro(s) carregado(s).`; toast("Lista carregada"); renderAll(); }
          catch(e){ st.textContent = e.message === "espaco" ? "Lista grande demais para o modo local; carregue na versão publicada." : "Não foi possível gravar a lista (só o administrador pode carregar)."; } }); }
      catch(e){ st.textContent = "Não foi possível ler o arquivo (" + (e.message === "zip" ? "ZIP sem CSV" : "formato") + ")."; } });
  });
  RPT_REC.unshift([/Cadastro de Empregadores|trabalho análogo/i, "Suspender as compras e a relação comercial enquanto constar no Cadastro de Empregadores; registrar a decisão e acompanhar a saída da lista.", "CP art. 149; Portaria Interministerial MTE/MDHC/MIR nº 18/2024; Lei 12.846/2013"],
    [/CEIS|CNEP|Inidôneas|Lei Anticorrupção/i, "Avaliar a sanção (alcance, prazo e órgão); empresas impedidas não devem ser contratadas no período da sanção.", "Lei 12.846/2013; Lei 14.133/2021, art. 156; Decreto 11.129/2022"],
    [/embargad|IBAMA/i, "Bloquear produtos de áreas embargadas e exigir comprovação de origem fora do polígono embargado.", "Decreto 6.514/2008, art. 54; Lei 9.605/1998"],
    [/Receita|CNAE|MEI|Capital social|Situação especial/i, "Confirmar a regularidade cadastral e a compatibilidade da atividade e do porte com o volume negociado.", "IN RFB 2.119/2022 (CNPJ); LC 123/2006 (MEI e Simples); Lei 9.613/1998"]);
  return {receita, verificar, atualizar, todos, lerLista, gravarLista, achadosReceita, BASES, agendar, consultarExterno, fila: () => fila.length};
})();
