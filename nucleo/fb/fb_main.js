/* ================= KinseyTec · sistema no Firebase ================= */
const KT_FB = !KT_AUTH ? null : {
  me: null,
  async start(){
    const r = await KT_AUTH.gate(["admin","editor","colaborador"]);
    KT_FB.me = r;
    const db = KT_AUTH.db, st = window.KT_USE_STORAGE ? firebase.storage() : null;
    Store.db = db; Store.mode = "live"; Store.sample = null;
    Store.me = {id: r.email, email: r.email, role: r.role, canEdit: r.role === "admin" || r.role === "editor", canWrite: true};
    Store.user = {profiles: async ids => Object.fromEntries(ids.map(i => [i, {name: i}]))};
    /* ---------- vários clientes: cada um com sua base; o administrador escolhe o cliente atual ---------- */
    const SCOPED = ["suppliers", "evidences", "contracts", "pareceres", "operacoes", "prospects", "presenca", "ativos"], CFGS = ["geral", "precos", "relatorio", "relatorio_log", "personalizado", "portal", "consultas"];
    let clientes = [];
    if (r.role === "admin"){ try{ const q = await db.collection("clientes").get(); clientes = q.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")); }catch(e){} }
    /* produto com espaço padrão (ex.: KinseyTec M&A, base única da Kinsey): criado no primeiro acesso do administrador */
    const CP = window.KT_CLIENTE_PADRAO;
    if (r.role === "admin" && CP && !clientes.length){ try{ await db.collection("clientes").doc(CP.id).set({nome:CP.nome, doc:CP.doc || "", local:CP.local || "", padrao:true, criadoEm:new Date().toISOString(), criadoPor:r.email}, {merge:true}); clientes = [{id:CP.id, nome:CP.nome, padrao:true}]; }catch(e){ console.warn("espaço padrão", e); } }
    let cid = "";
    if (r.role === "admin"){ let k = "", nm = ""; try{ k = localStorage.getItem("kt-cli") || ""; nm = localStorage.getItem("kt-cli-nome") || ""; }catch(e){} const nC = x => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); const pn = nm ? clientes.find(c => nC(c.nome).includes(nC(nm)) || nC(nm).includes(nC(c.nome))) : null; cid = pn ? pn.id : clientes.some(c => c.id === k) ? k : (clientes[0]?.id || ""); }
    else cid = r.clienteId || "";
    KT_FB.clientes = clientes; KT_FB.cid = cid; KT_FB.SCOPED = SCOPED; KT_FB.CFGS = CFGS;
    /* registros gravados com cliente vazio (antes do espaço padrão existir) passam para o espaço padrão */
    if (r.role === "admin" && CP && cid === CP.id) (async () => { try{ let n = 0;
      for (const col of SCOPED){ const q = await db.collection(col).where("clienteId", "==", "").get();
        for (let i = 0; i < q.docs.length; i += 400){ const b = db.batch(); q.docs.slice(i, i + 400).forEach(d => b.set(d.ref, {clienteId:cid}, {merge:true})); await b.commit(); } n += q.docs.length; }
      if (n){ toast(`${n} registro(s) gravado(s) antes da configuração foram recuperados`); setTimeout(() => location.reload(), 1500); } }catch(e){ console.warn("recuperação", e); } })();
    if (r.role !== "admin" && !cid){
      const o = document.createElement("div"); o.className = "ktl"; o.style.cssText = "position:fixed;inset:0;z-index:90;background:var(--bg,#011F4B);display:grid;place-items:center;padding:16px";
      o.innerHTML = `<div class="card" style="max-width:440px;display:flex;flex-direction:column;gap:12px"><h2>Acesso sem cliente vinculado</h2><p class="sub" style="margin:0">Seu e-mail (${esc(r.email)}) ainda não está ligado a um cliente. Peça ao administrador da Kinsey BR para vincular o seu convite ao cliente correto.</p><button type="button" class="btn" id="kt-out3">Sair</button></div>`;
      document.body.appendChild(o); o.querySelector("#kt-out3").onclick = () => KT_AUTH.signOut().then(() => location.reload());
    }
    const mapCfg = id => CFGS.includes(id) ? id + "__" + cid : id;
    Store.set = (col, id, obj) => {
      if (col === "config" && id === "cliente") return KT_FB.salvarCliente(obj);
      if (SCOPED.includes(col)) obj = {...obj, clienteId: cid};
      return db.collection(col).doc(col === "config" ? mapCfg(id) : id).set(obj);
    };
    Store.update = (col, id, patch) => {
      if (col === "config" && id === "cliente") return KT_FB.salvarCliente(patch);
      if (SCOPED.includes(col)) patch = {...patch, clienteId: cid};
      if (col === "suppliers" && patch?.dd?.bal && typeof patch.dd.bal === "object") return balUpdate(id, patch);
      return db.collection(col).doc(col === "config" ? mapCfg(id) : id).set(patch, {merge: true});
    };
    /* ---------- balancetes da Due Diligence em registros próprios: ddbal/{empresa}__{período} ----------
       O Firestore aceita no máximo 1 MiB por registro. Um ECD mês a mês (12 balancetes com centenas de contas) estoura esse
       limite no registro da empresa e, a partir daí, nenhuma gravação da empresa passa. Cada período fica no seu registro;
       o sistema continua vendo s.dd.bal como antes. Os períodos antigos, gravados dentro da empresa, são migrados na abertura. */
    const FV = firebase.firestore.FieldValue, BAL = {}, LEG = {}; let balPronto = false; const migrados = new Set();
    const balRef = (id, per) => db.collection("ddbal").doc(id + "__" + String(per).replace(/[\/]/g, "-"));
    async function balUpdate(id, patch){
      const bal = patch.dd.bal, dd = {...patch.dd}, del = {}; delete dd.bal;
      const ops = Object.entries(bal).map(async ([per, v]) => { del[per] = FV.delete(); const ref = balRef(id, per);
        if (v == null) return ref.delete();
        const leg = LEG[id]?.[per]; if (leg && !BAL[id]?.[per]) await ref.set({clienteId: cid, sup: id, per, b: leg});
        return ref.set({clienteId: cid, sup: id, per, b: v}, {merge: true}); });
      await Promise.all(ops);
      return db.collection("suppliers").doc(id).set({...patch, dd: {...dd, bal: del}}, {merge: true});
    }
    async function migraBal(sup){
      if (!balPronto || Store.me?.canWrite === false) return;
      for (const s of sup){ const L = LEG[s.id]; if (!L || migrados.has(s.id) || !Object.keys(L).length) continue; migrados.add(s.id);
        try{ for (const [per, b] of Object.entries(L)) if (b && !BAL[s.id]?.[per]) await balRef(s.id, per).set({clienteId: cid, sup: s.id, per, b});
          await db.collection("suppliers").doc(s.id).set({dd: {bal: Object.fromEntries(Object.keys(L).map(p => [p, FV.delete()]))}}, {merge: true}); }
        catch(e){ console.warn("migração dos balancetes", s.id, e); } } }
    { const baseSet = Store.set, baseDel = Store.del.bind(Store);
      Store.set = (col, id, obj) => { if (col === "suppliers" && obj?.dd?.bal && typeof obj.dd.bal === "object"){ const bal = obj.dd.bal, dd = {...obj.dd}; delete dd.bal;
          return Promise.all(Object.entries(bal).filter(([, v]) => v).map(([per, v]) => balRef(id, per).set({clienteId: cid, sup: id, per, b: v}))).then(() => baseSet(col, id, {...obj, dd})); }
        return baseSet(col, id, obj); };
      Store.del = async (col, id) => { if (col === "suppliers" && cid){ try{ const q = await db.collection("ddbal").where("clienteId", "==", cid).where("sup", "==", id).get(); await Promise.all(q.docs.map(d => d.ref.delete())); }catch(e){} } return baseDel(col, id); }; }
    { const baseListen = Store.listen.bind(Store);
      Store.listen = (col, cb) => {
        const err = e => console.warn(col, e);
        if (col === "suppliers" && cid){ let sup = [];
          const emit = () => cb(sup.map(s => { const B = BAL[s.id], L = LEG[s.id]; if (!B && !L) return s; return {...s, dd: {...(s.dd || {}), bal: {...(L || {}), ...(B || {})}}}; }));
          db.collection("suppliers").where("clienteId", "==", cid).onSnapshot(q => { sup = q.docs.map(d => ({id: d.id, ...d.data()}));
            sup.forEach(s => { const L = s.dd?.bal; if (L && typeof L === "object" && Object.keys(L).length) LEG[s.id] = L; else delete LEG[s.id]; }); emit(); migraBal(sup); }, err);
          db.collection("ddbal").where("clienteId", "==", cid).onSnapshot(q => { Object.keys(BAL).forEach(k => delete BAL[k]);
            q.docs.forEach(d => { const x = d.data(); if (x.sup && x.per && x.b) (BAL[x.sup] = BAL[x.sup] || {})[x.per] = x.b; }); balPronto = true; emit(); migraBal(sup); }, e => { balPronto = false; err(e); });
          return; }
        if (SCOPED.includes(col)){ if (!cid){ cb([]); return; } db.collection(col).where("clienteId", "==", cid).onSnapshot(q => cb(q.docs.map(d => ({id: d.id, ...d.data()}))), err); return; }
        if (col === "config"){ if (!cid){ cb([]); return; } const st = {}, emit = () => cb(Object.values(st));
          CFGS.forEach(id => db.collection("config").doc(id + "__" + cid).onSnapshot(d => { if (d.exists) st[id] = {...d.data(), id}; else delete st[id]; emit(); }, err));
          db.collection("clientes").doc(cid).onSnapshot(d => { if (d.exists) st.cliente = {...d.data(), id: "cliente"}; else delete st.cliente; emit(); }, err);
          return; }
        baseListen(col, cb);
      }; }
    Store.upload = async blob => {
      if (!st) return {assetId: null, url: await ktInline(blob)};
      const ext = (blob.type.split("/")[1] || "bin").replace("jpeg", "jpg").replace(/[^a-z0-9]/g, "");
      const path = `evidences/${KT_FB.cid || "sem-cliente"}/${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}.${ext}`;
      const ref = st.ref(path); await ref.put(blob, {contentType: blob.type || "application/octet-stream"});
      return {assetId: path, url: await ref.getDownloadURL()};
    };
    setMode("live");
    /* se os dados não chegarem (rede bloqueando o canal padrão), tenta o modo alternativo de conexão uma vez e avisa */
    { const origListen = Store.listen.bind(Store); let got = false;
      Store.listen = (col, cb) => origListen(col, a => { got = true; cb(a); });
      setTimeout(() => { if (got) return; let lp = false; try{ lp = localStorage.getItem("kt-lp") === "1"; }catch(e){}
        if (!lp){ try{ localStorage.setItem("kt-lp", "1"); }catch(e){} location.reload(); return; }
        const m = document.createElement("div"); m.className = "banner"; m.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:90px;z-index:60;max-width:560px";
        m.innerHTML = "Os dados ainda não carregaram. Verifique a internet ou peça à equipe de TI para liberar <b>firestore.googleapis.com</b> na rede. <button type='button' class='btn sm' onclick='location.reload()'>Tentar de novo</button>";
        document.body.appendChild(m); }, 12000); }
    const chip = $("#modechip"); if (chip){ chip.textContent = r.email; chip.title = KT_ROLES[r.role] || r.role; }
    const bar = document.querySelector(".topbar .sp");
    if (bar){
      const b = document.createElement("button"); b.type = "button"; b.className = "kimbtn"; b.id = "kt-acc";
      b.textContent = r.role === "admin" ? "Usuários" : "Conta"; b.onclick = () => KT_FB.openUsers(); bar.after(b);
    }
    KT_FB.cliChip();
    const orig = window.openFicha; window.openFicha = function(){ orig(); KT_FB.fichasList(); };
    return true;
  },
  async salvarCliente(obj){
    const db = KT_AUTH.db; let id = KT_FB.cid, novo = false;
    if (!id){ id = uid(); novo = true; }
    await db.collection("clientes").doc(id).set({...obj, atualizadoEm: new Date().toISOString(), ...(novo ? {criadoEm: new Date().toISOString(), criadoPor: KT_FB.me.email} : {})}, {merge: true});
    if (novo){ try{ localStorage.setItem("kt-cli", id); }catch(e){} location.reload(); }
  },
  trocarCliente(id){ try{ localStorage.setItem("kt-cli", id); }catch(e){} location.reload(); },
  async openClientes(){
    const db = KT_AUTH.db; let L = [];
    try{ L = (await db.collection("clientes").get()).docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")); }catch(e){}
    let us = []; try{ us = (await db.collection("invites").get()).docs.map(d => d.data()); }catch(e){}
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Administração</div><h2>Clientes</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b">
        <p class="sub" style="margin:0">Cada cliente contratante tem sua própria base de fornecedores, contratos, evidências e relatórios, e seus próprios usuários. O cliente só vê os próprios dados.</p>
        <div style="display:flex;flex-direction:column;gap:8px">${L.length ? L.map(c => `<div class="ct" style="display:flex;justify-content:space-between;align-items:center;gap:10px;${c.id === KT_FB.cid ? "border-color:var(--glow)" : ""}"><div style="min-width:0"><b>Cliente – ${esc(c.nome || "sem nome")}</b><div class="meta"><span class="mono">${esc(c.doc || "CNPJ não informado")}</span><span>${esc(c.local || "—")}</span><span>${us.filter(u => u.clienteId === c.id).length} usuário(s)</span></div></div>${c.id === KT_FB.cid ? '<span class="pill r-baixo">Cliente atual</span>' : `<button type="button" class="btn sm primary" data-cli="${c.id}">Entrar</button>`}</div>`).join("") : '<div class="banner">Nenhum cliente cadastrado ainda. Cadastre o primeiro abaixo.</div>'}</div>
        <form id="kt-nc" class="card" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Novo cliente</h3>
          <div class="form"><div class="fld"><label for="kt-ncn">Nome da empresa contratante</label><input id="kt-ncn" placeholder="Ex.: Empresa Contratante S.A."></div>
          <div class="fld"><label for="kt-ncd">CNPJ</label><input id="kt-ncd" inputmode="numeric" placeholder="00.000.000/0000-00"></div>
          <div class="fld"><label for="kt-ncl">Cidade da unidade</label><input id="kt-ncl" list="kt-dl-cid2" placeholder="Ex.: Guarulhos/SP" autocomplete="off"><datalist id="kt-dl-cid2">${(typeof MUNI !== "undefined" ? MUNI : []).map(m => `<option value="${m[0]}/${m[1]}">`).join("")}</datalist></div></div>
          <p class="err" id="kt-ncerr" hidden></p><button type="submit" class="btn primary" style="align-self:flex-start">Cadastrar e entrar no cliente</button></form>
      </div>`);
    $$("[data-cli]").forEach(b => b.onclick = () => KT_FB.trocarCliente(b.dataset.cli));
    $("#kt-nc").onsubmit = async e => { e.preventDefault();
      const nome = $("#kt-ncn").value.trim(), doc = $("#kt-ncd").value.trim(), local = $("#kt-ncl").value.trim(), er = $("#kt-ncerr");
      if (!nome){ er.textContent = "Informe o nome da empresa contratante."; er.hidden = false; return; }
      const m = local.match(/^(.+?)\s*[\/-]\s*([A-Za-z]{2})$/), mu = m && typeof muniOf === "function" ? muniOf(m[1], m[2].toUpperCase()) : null, uc = m && typeof UF_CENTER !== "undefined" ? UF_CENTER[m[2].toUpperCase()] : null;
      const c = mu ? [mu[2], mu[3]] : uc || [CLIENTE_PADRAO.lat, CLIENTE_PADRAO.lng], id = uid();
      try{ await db.collection("clientes").doc(id).set({nome, doc, local, lat: c[0], lng: c[1], criadoEm: new Date().toISOString(), criadoPor: KT_FB.me.email}); toast("Cliente cadastrado"); KT_FB.trocarCliente(id); }
      catch(x){ er.textContent = "Não foi possível cadastrar o cliente."; er.hidden = false; } };
  },
  cliChip(){
    const bar = document.querySelector("#kt-acc"); if (!bar || !KT_FB.me) return;
    const nome = ((S.config && S.config.cliente) || {}).nome, admin = KT_FB.me.role === "admin";
    let b = document.querySelector("#kt-cliente");
    if (!b){ b = document.createElement("button"); b.type = "button"; b.className = "kimbtn"; b.id = "kt-cliente"; b.style.maxWidth = "260px"; b.style.overflow = "hidden"; b.style.textOverflow = "ellipsis"; b.style.whiteSpace = "nowrap"; bar.before(b); }
    b.textContent = nome ? "Cliente: " + nome + (admin ? " ▾" : "") : (admin ? (KT_FB.cid ? "Definir empresa contratante" : "Cadastrar primeiro cliente") : "Cliente não definido");
    b.title = nome ? "Empresa contratante" + (admin ? " · toque para alterar" : "") : "A empresa que contratou o sistema";
    b.style.borderColor = nome ? "" : "var(--warn)"; b.style.color = nome ? "" : "var(--warn)";
    b.disabled = !admin; b.style.cursor = admin ? "pointer" : "default";
    b.onclick = admin ? () => KT_FB.openClientes() : null;
  },
  /* ---------- Diagnóstico do Firebase: mostra o que falta para a leitura dos documentos ---------- */
  async diagnostico(){
    const db = KT_AUTH.db, L = [], add = (ok, t, d) => L.push({ok, t, d});
    const box = sheet(`<div class="sheet-h"><div><div class="eyebrow">Firebase</div><h2>Diagnóstico da leitura de documentos</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div><div class="sheet-b" id="dg-b"><div class="banner">Testando…</div></div>`);
    const fn = (n, data) => firebase.app().functions("southamerica-east1").httpsCallable(n, {timeout: 60000})(data);
    add(true, "Versão do sistema", (document.title || "") + " · " + location.host);
    try{ await db.collection("suppliers").where("clienteId", "==", KT_FB.cid || "").limit(1).get(); add(true, "Banco de dados (Firestore)", "leitura ok"); }catch(e){ add(false, "Banco de dados (Firestore)", (e.code || "") + " " + (e.message || "")); }
    try{ const r = await fn("lerArquivo", {ping: true}); add(true, "Função lerArquivo publicada", "respondeu · bucket " + (r.data?.bucket || "")); }
    catch(e){ const c = String(e.code || ""); add(false, "Função lerArquivo", c + " · " + (e.message || "") + (/internal/.test(c) ? " → a função não existe ou o Google Cloud bloqueia o acesso público (veja o passo 4 do tutorial)" : /not-found/.test(c) ? " → publique as funções (passo 3)" : "")); }
    const ev = (S.evidences || []).find(e => e.url && /firebasestorage|storage\.googleapis/.test(e.url));
    if (ev){
      try{ const r = await fetch(ev.url); add(r.ok, "Download direto do Storage (CORS)", r.ok ? "liberado: o sistema lê os arquivos sem precisar da função" : "HTTP " + r.status); }
      catch(e){ add(false, "Download direto do Storage (CORS)", "bloqueado pelo navegador → rode o passo 5 do tutorial (liberar o Storage para " + location.host + ")"); }
      try{ const p = ktCaminhoArq(ev), r = await fn("lerArquivo", {path: p}); add(true, "Leitura de um documento pelo servidor", `${ev.nome || p} · ${Math.round((r.data?.size || 0) / 1024)} KB`); }
      catch(e){ add(false, "Leitura de um documento pelo servidor", String(e.code || "") + " · " + (e.message || "")); }
    } else add(null, "Documentos no Storage", "nenhum documento guardado para testar");
    try{ await fn("convidar", {}); add(true, "Função convidar", "respondeu"); }catch(e){ const c = String(e.code || ""); add(/invalid-argument|failed-precondition|permission/.test(c), "Função convidar (convites)", /invalid-argument|failed-precondition|permission/.test(c) ? "publicada" : c + " · " + (e.message || "")); }
    if (KT_ARQ?.ultimoErro) add(null, "Último erro de leitura", `${KT_ARQ.ultimoErro.code} · ${KT_ARQ.ultimoErro.msg} (${new Date(KT_ARQ.ultimoErro.em).toLocaleString("pt-BR")})`);
    const txt = L.map(x => `${x.ok === true ? "OK" : x.ok === false ? "FALHA" : "INFO"} · ${x.t}: ${x.d}`).join("\n");
    $("#dg-b").innerHTML = `<div style="display:flex;flex-direction:column;gap:6px;font-size:13.5px">${L.map(x => `<div><b style="color:${x.ok === true ? "var(--ok)" : x.ok === false ? "var(--bad)" : "var(--muted)"}">${x.ok === true ? "✓" : x.ok === false ? "✗" : "•"} ${esc(x.t)}</b><div class="sub" style="margin:0;font-size:12.5px">${esc(x.d)}</div></div>`).join("")}</div>
      <p class="sub" style="margin:0;font-size:12.5px">Envie este diagnóstico ao suporte. Se a função falhar e o download direto estiver bloqueado, siga o tutorial de resolução (passos 3 a 5).</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="dg-cp">Copiar diagnóstico</button><button type="button" class="btn sm" id="dg-re">Testar de novo</button></div>`;
    $("#dg-cp").onclick = () => navigator.clipboard?.writeText(txt).then(() => toast("Diagnóstico copiado"));
    $("#dg-re").onclick = () => { box(); KT_FB.diagnostico(); };
  },
  /* backup do cliente atual em JSON: todas as coleções do cliente, os balancetes, as configurações e os convites */
  async backup(bt){
    const db = KT_AUTH.db, cid = KT_FB.cid; if (!cid){ toast("Escolha o cliente antes"); return; }
    if (bt){ bt.disabled = true; bt.textContent = "Gerando backup…"; }
    const out = {sistema: document.title || "KinseyTec", cliente: (KT_FB.clientes || []).find(c => c.id === cid) || {id: cid}, em: new Date().toISOString(), por: KT_FB.me?.email || "", colecoes: {}}, cont = {};
    const pega = async (col, q) => { try{ const r = await q.get(); out.colecoes[col] = r.docs.map(d => ({id: d.id, ...d.data()})); cont[col] = r.size; }catch(e){ out.colecoes[col] = {erro: e.code || e.message}; cont[col] = "erro"; } };
    for (const col of [...(KT_FB.SCOPED || []), "ddbal"]) await pega(col, db.collection(col).where("clienteId", "==", cid));
    await pega("config", db.collection("config").where(firebase.firestore.FieldPath.documentId(), "in", (KT_FB.CFGS || []).map(id => id + "__" + cid).slice(0, 10)));
    await pega("invites", db.collection("invites").where("clienteId", "==", cid));
    const txt = JSON.stringify(out), nome = `KinseyTec_backup_${String(out.cliente.nome || cid).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_").slice(0, 30)}_${out.em.slice(0, 10)}.json`;
    try{ await rptSave(new TextEncoder().encode(txt), nome, "application/json"); }catch(e){ const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], {type: "application/json"})); a.download = nome; a.click(); }
    const r = $("#kt-bkp-r"); if (r) r.textContent = "Backup gerado: " + Object.entries(cont).map(([k, v]) => `${k} ${v}`).join(" · ");
    if (bt){ bt.disabled = false; bt.textContent = "Baixar backup do cliente (JSON)"; } toast("Backup baixado");
  },
  async openUsers(foco){
    const isAdmin = KT_FB.me.role === "admin", db = KT_AUTH.db;
    const origin = location.origin;
    sheet(`<div class="sheet-h"><div><div class="eyebrow">${isAdmin ? "Administração" : "Minha conta"}</div><h2>${isAdmin ? "Usuários e convites" : "Conta"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" id="kt-ub">
        <div class="banner">Conectado como <b>${esc(KT_FB.me.email)}</b> · ${esc(KT_ROLES[KT_FB.me.role] || KT_FB.me.role)} <button type="button" class="btn sm ghost" id="kt-out" style="margin-left:8px">Sair</button></div>
        ${isAdmin ? `
        <form id="kt-cli" class="card" style="display:flex;flex-direction:column;gap:10px;border:1.5px solid var(--glow)" novalidate><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3>Cliente atual</h3><button type="button" class="btn sm" id="kt-clis">Trocar ou cadastrar clientes</button></div>
          <p class="sub" style="margin:0">A empresa que contratou o sistema. O nome aparece no topo do sistema, na lista do cliente e nos relatórios; a cidade é o ponto de partida do mapa.</p>
          <div class="form"><div class="fld"><label for="kt-cn">Nome da empresa contratante</label><input id="kt-cn" placeholder="Ex.: Empresa Contratante S.A."></div>
          <div class="fld"><label for="kt-cdoc">CNPJ</label><input id="kt-cdoc" inputmode="numeric" placeholder="00.000.000/0000-00"></div>
          <div class="fld"><label for="kt-cl">Cidade da unidade (fábrica, sede ou porto)</label><input id="kt-cl" list="kt-dl-cid" placeholder="Ex.: Guarulhos/SP" autocomplete="off"><datalist id="kt-dl-cid">${(typeof MUNI !== "undefined" ? MUNI : []).map(m => `<option value="${m[0]}/${m[1]}">`).join("")}</datalist></div></div>
          <p class="sub" id="kt-cgeo" style="margin:0"></p>
          <details><summary class="sub" style="cursor:pointer">Ajustar coordenadas do mapa (opcional)</summary><div class="form" style="margin-top:8px"><div class="fld"><label for="kt-clat">Latitude</label><input id="kt-clat" inputmode="decimal" placeholder="-14.80"></div>
          <div class="fld"><label for="kt-clng">Longitude</label><input id="kt-clng" inputmode="decimal" placeholder="-39.06"></div></div><p class="sub" style="margin:4px 0 0">No Google Maps, clique com o botão direito no local e copie os dois números.</p></details>
          <p class="err" id="kt-cerr" hidden></p>
          <button type="submit" class="btn primary" style="align-self:flex-start">Salvar empresa contratante</button></form>
        <form id="kt-inv" class="card" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Convidar usuário</h3>
          <div class="form"><div class="fld"><label for="kt-ie">E-mail</label><input id="kt-ie" type="email" placeholder="nome@empresa.com"></div>
          <div class="fld"><label for="kt-in">Nome</label><input id="kt-in"></div>
          <div class="fld"><label for="kt-ic">Empresa</label><input id="kt-ic" placeholder="Cliente, Kinsey BR, fornecedor…"></div>
          <div class="fld"><label for="kt-itel">WhatsApp (DDD + número)</label><input id="kt-itel" inputmode="tel" placeholder="(11) 98765-4321"></div>
          <div class="fld"><label for="kt-icli">Cliente</label><select id="kt-icli">${(KT_FB.clientes || []).map(c => `<option value="${c.id}" ${c.id === KT_FB.cid ? "selected" : ""}>${esc(c.nome || c.id)}</option>`).join("")}<option value="">— Kinsey BR (administrador de todos os clientes) —</option></select></div>
          <div class="fld"><label for="kt-ir">Perfil</label><select id="kt-ir">${Object.entries(KT_ROLES).map(([k,l]) => `<option value="${k}" ${k==="editor"?"selected":""}>${l}</option>`).join("")}</select></div></div>
          <p class="err" id="kt-ierr" hidden></p>
          <button type="submit" class="btn primary" style="align-self:flex-start">Salvar e enviar convite</button><div id="kt-envio"></div></form>
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Links para enviar</h3>
          <p style="font-size:13.5px;margin:0">Cliente e equipe Kinsey: <b class="mono" style="user-select:all">${origin}</b></p>
          <p style="font-size:13.5px;margin:0">Fornecedores (Portal do Fornecedor): <b class="mono" style="user-select:all">${origin}/portal.html</b></p>
          <p class="sub" style="margin:0">Ao salvar, o sistema cria o acesso e envia o e-mail para a pessoa criar a senha. Também dá para mandar o mesmo link por WhatsApp (válido por 1 hora; depois, a pessoa usa "Esqueci a senha" na tela de entrada) ou reenviar pela lista abaixo.</p></div>
        <div><div class="eyebrow" style="margin-bottom:8px">Convites e usuários</div><div class="tbl"><table class="ptable" id="kt-ul"><tr><td style="color:var(--muted)">Carregando…</td></tr></table></div></div>
        ${isAdmin ? `<div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Backup e segurança dos dados</h3>
          <p class="sub" style="margin:0">Cadastros, listas, análises e documentos ficam no banco e no Storage do Firebase: publicar uma nova versão troca só o sistema, nunca apaga os dados. Para uma cópia extra, baixe aqui o backup do cliente atual (cadastros, prospecção, balancetes, contratos, pareceres, documentos e os links dos arquivos).</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="kt-bkp">Baixar backup do cliente (JSON)</button></div><div id="kt-bkp-r" class="sub" style="margin:0;font-size:12.5px"></div></div>` : ""}
        <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Dados de demonstração</h3><p class="sub" style="margin:0">Carrega os fornecedores e contratos marcados EXEMPLO para o teste. Podem ser excluídos depois.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="kt-seed">Carregar dados de exemplo</button><button type="button" class="btn sm ghost" id="kt-unseed">Apagar dados de exemplo</button></div></div>
        <div class="card" id="kt-mig" style="display:flex;flex-direction:column;gap:8px" hidden><h3>Registros sem cliente</h3><div id="kt-mig-b" class="sub" style="margin:0"></div></div>
        <div class="card" id="kt-lotes" style="display:flex;flex-direction:column;gap:8px"><h3>Importações de fornecedores</h3><p class="sub" style="margin:0">Desfaça uma importação inteira ou apague os registros importados com texto ilegível (arquivo lido no formato errado).</p><div id="kt-lotes-b"></div><p class="sub" style="margin:0">Antes de usar com o cliente, apague os exemplos: somem os fornecedores, contratos, pareceres e evidências marcados EXEMPLO.</p></div>` : ""}
      </div>`);
    $("#kt-out").onclick = () => KT_AUTH.signOut().then(() => location.reload());
    const bk = $("#kt-bkp"); if (bk) bk.onclick = () => KT_FB.backup(bk);
    if ($("#kt-clis")) $("#kt-clis").onclick = () => KT_FB.openClientes();
    if (foco === "cliente") setTimeout(() => { const f = $("#kt-cli"); if (f){ f.scrollIntoView({block: "start"}); $("#kt-cn").focus(); } }, 50);
    if (!isAdmin) return;
    { const c = CLI(), cf = S.config.cliente || {}; $("#kt-cn").value = cf.nome || ""; $("#kt-cdoc").value = cf.doc || ""; $("#kt-cl").value = cf.local || ""; $("#kt-clat").value = c.lat; $("#kt-clng").value = c.lng; }
    const geo = () => { const v = $("#kt-cl").value.trim(), m = v.match(/^(.+?)\s*[\/-]\s*([A-Za-z]{2})$/), nome = m ? m[1] : v, uf = m ? m[2].toUpperCase() : "";
      const mu = typeof muniOf === "function" ? muniOf(nome, uf || undefined) : null, uc = uf && typeof UF_CENTER !== "undefined" ? UF_CENTER[uf] : null, info = $("#kt-cgeo");
      if (mu){ $("#kt-clat").value = mu[2]; $("#kt-clng").value = mu[3]; info.textContent = `Local encontrado: ${mu[0]}/${mu[1]} (coordenadas preenchidas).`; }
      else if (uc){ $("#kt-clat").value = uc[0]; $("#kt-clng").value = uc[1]; info.textContent = `Cidade fora da lista: o mapa usa o centro de ${uf}. Ajuste as coordenadas se quiser precisão.`; }
      else info.textContent = v ? "Informe a cidade no formato Cidade/UF (ex.: Guarulhos/SP)." : ""; };
    $("#kt-cl").onchange = geo; $("#kt-cl").oninput = () => { if (/\/[A-Za-z]{2}$/.test($("#kt-cl").value.trim())) geo(); };
    $("#kt-cli").onsubmit = async e => { e.preventDefault();
      const nome = $("#kt-cn").value.trim(), doc = $("#kt-cdoc").value.trim(), local = $("#kt-cl").value.trim(), lat = parseFloat($("#kt-clat").value.replace(",", ".")), lng = parseFloat($("#kt-clng").value.replace(",", "."));
      const er = $("#kt-cerr");
      if (!nome){ er.textContent = "Informe o nome da empresa contratante."; er.hidden = false; return; }
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180){ er.textContent = "Informe a cidade no formato Cidade/UF ou ajuste as coordenadas."; er.hidden = false; return; }
      er.hidden = true;
      try{ await Store.set("config", "cliente", {nome, doc, local, lat, lng, em:new Date().toISOString()}); toast("Empresa contratante salva para toda a equipe"); KT_FB.cliChip(); }catch(x){ er.textContent = "Não foi possível salvar."; er.hidden = false; } };
    const listU = async () => {
      const [inv, us] = await Promise.all([db.collection("invites").get(), db.collection("users").get()]);
      const active = new Set(us.docs.map(d => (d.data().email || "").toLowerCase()));
      const rows = inv.docs.map(d => ({email:d.id, ...d.data()}));
      us.docs.forEach(d => { const u = d.data(); if (!rows.some(r => r.email === u.email)) rows.push({...u, _uid:d.id}); });
      $("#kt-ul").innerHTML = `<thead><tr><th>E-mail</th><th>Cliente</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.nome || "")}</b><div class="mono" style="font-size:12px">${esc(r.email)}</div><div style="font-size:11.5px;color:var(--muted)">${esc(r.empresa || "")}</div></td><td style="font-size:12.5px">${r.role === "admin" ? "Kinsey BR (todos)" : r.clienteId ? esc(((KT_FB.clientes || []).find(c => c.id === r.clienteId) || {}).nome || r.clienteNome || "—") : '<span style="color:var(--warn)">sem cliente: salve o convite de novo escolhendo o cliente</span>'}</td><td>${esc(KT_ROLES[r.role] || r.role || "—")}</td><td>${active.has(r.email) ? '<span class="pill r-baixo">Ativo</span>' : '<span class="pill r-pend">Convidado</span>'}</td><td>${KT_ADMINS.includes(r.email) ? "" : `${active.has(r.email) ? "" : `<button type="button" class="btn sm" data-reinv="${esc(r.email)}" data-nome="${esc(r.nome || "")}" data-tel="${esc(r.tel || "")}" style="margin-right:6px">Reenviar</button>`}<button type="button" class="btn sm bad" data-rm="${esc(r.email)}">Remover</button>`}${r.enviadoEm ? `<div class="sub" style="font-size:11px;margin:4px 0 0">enviado ${new Date(r.enviadoEm).toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"})}</div>` : ""}</td></tr>`).join("") || `<tr><td colspan="5" style="color:var(--muted)">Nenhum convite ainda.</td></tr>`}</tbody>`;
      $$("[data-rm]", $("#kt-ul")).forEach(b => b.onclick = () => confirmBox(`Remover o acesso de ${b.dataset.rm}?`, "Remover", async () => {
        await db.collection("invites").doc(b.dataset.rm).delete().catch(() => {});
        const q = await db.collection("users").where("email", "==", b.dataset.rm).get(); await Promise.all(q.docs.map(d => d.ref.delete()));
        toast("Acesso removido"); listU(); }));
      $$("[data-reinv]", $("#kt-ul")).forEach(b => b.onclick = () => enviarConvite(b.dataset.reinv, b.dataset.nome, b.dataset.tel));
    };
    /* envio do convite: cria a conta no servidor, dispara o e-mail do Firebase e oferece WhatsApp e cópia do link */
    const telFmt = t => { const d = String(t || "").replace(/\D/g, ""); return d.length >= 10 && d.length <= 11 ? "55" + d : d.length >= 12 ? d : ""; };
    async function enviarConvite(email, nome, tel){
      const box = $("#kt-envio") || document.body; box.innerHTML = `<div class="banner" style="font-size:13px">Enviando o convite para <b>${esc(email)}</b>…</div>`; box.scrollIntoView?.({block:"nearest"});
      const app = location.origin + "/", nm = (nome || "").split(" ")[0];
      let link = "", erroFn = "", emailOk = false, erroMail = "";
      try{ const r = await firebase.app().functions("southamerica-east1").httpsCallable("convidar", {timeout:60000})({email, nome, url:app}); link = r.data?.link || ""; }
      catch(e){ const c = String(e?.code || ""); erroFn = /not-found/.test(c) ? "a função convidar ainda não foi publicada (republique o sistema com as funções)" : /permission/.test(c) ? "só o administrador envia convites" : (e?.message || "falha no servidor"); }
      try{ await KT_AUTH.auth.sendPasswordResetEmail(email, {url:app}).catch(e => { if (/continue-uri|unauthorized|invalid-continue/i.test(String(e?.code || ""))) return KT_AUTH.auth.sendPasswordResetEmail(email); throw e; }); emailOk = true; }
      catch(e){ const c = String(e?.code || ""); erroMail = /user-not-found/.test(c) ? "a conta ainda não existe (o servidor não criou o acesso)" : /too-many|quota/.test(c) ? "limite de e-mails do Firebase atingido; tente mais tarde ou use o WhatsApp" : (e?.message || "falha no envio"); }
      const msg = `Olá${nm ? ", " + nm : ""}! Você foi convidado(a) para acessar o KinseyTec – M&A.\n\n` + (link ? `1) Crie sua senha neste link (válido por 1 hora):\n${link}\n\n2) Depois entre em ${app} com o e-mail ${email} e a senha criada.` : `Entre em ${app} com o e-mail ${email}: toque em "Primeiro acesso" para criar a senha (ou "Esqueci a senha", se já tiver conta).`) + `\n\nSe o link expirar, use "Esqueci a senha" na tela de entrada.`;
      const t = telFmt(tel);
      box.innerHTML = `<div class="card" style="display:flex;flex-direction:column;gap:8px;padding:12px;border-color:${emailOk ? "var(--ok)" : "var(--warn)"}">
        <div style="font-size:13.5px">${emailOk ? `<b style="color:var(--ok)">✓ E-mail enviado</b> para ${esc(email)}: a pessoa recebe "Redefina sua senha" e cria a senha de acesso. Peça para olhar também o spam e a aba Promoções.` : `<b style="color:var(--warn)">E-mail não enviado:</b> ${esc(erroMail)}.`}</div>
        ${erroFn ? `<div class="sub" style="margin:0;font-size:12.5px">Link de senha indisponível: ${esc(erroFn)}. A mensagem de WhatsApp leva o endereço do sistema e o passo a passo.</div>` : ""}
        <div class="fld" style="margin:0"><label for="kt-wtel">WhatsApp (DDD + número)</label><input id="kt-wtel" inputmode="tel" value="${esc(tel || "")}" placeholder="(11) 98765-4321"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" id="kt-wa">Enviar por WhatsApp</button><button type="button" class="btn sm" id="kt-cp">Copiar mensagem</button>${emailOk ? "" : `<button type="button" class="btn sm" id="kt-re">Tentar o e-mail de novo</button>`}</div></div>`;
      $("#kt-wa").onclick = () => { const n = telFmt($("#kt-wtel").value); if (!n){ toast("Informe o WhatsApp com DDD"); return; } if (n !== t) db.collection("invites").doc(email).set({tel:$("#kt-wtel").value.trim()}, {merge:true}).catch(() => {}); window.open(`https://wa.me/${n}?text=${encodeURIComponent(msg)}`, "_blank", "noopener"); };
      $("#kt-cp").onclick = () => { navigator.clipboard?.writeText(msg).then(() => toast("Mensagem copiada"), () => toast("Não foi possível copiar")); };
      const re = $("#kt-re"); if (re) re.onclick = () => enviarConvite(email, nome, $("#kt-wtel").value);
      listU();
    }
    listU();
    $("#kt-inv").onsubmit = async e => { e.preventDefault();
      const email = $("#kt-ie").value.trim().toLowerCase(), role = $("#kt-ir").value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ $("#kt-ierr").textContent = "Informe um e-mail válido."; $("#kt-ierr").hidden = false; return; }
      const clienteId = role === "admin" ? "" : $("#kt-icli").value, cli = (KT_FB.clientes || []).find(c => c.id === clienteId);
      if (role !== "admin" && !clienteId){ $("#kt-ierr").textContent = "Escolha o cliente deste usuário (só administradores ficam sem cliente)."; $("#kt-ierr").hidden = false; return; }
      $("#kt-ierr").hidden = true;
      const tel = ($("#kt-itel")?.value || "").trim(), nomeI = $("#kt-in").value.trim();
      await db.collection("invites").doc(email).set({role, nome:nomeI, empresa:$("#kt-ic").value.trim() || (cli ? cli.nome : ""), clienteId, clienteNome: cli ? cli.nome : "", ...(tel ? {tel} : {}), em:new Date().toISOString(), por:KT_FB.me.email}, {merge:true});
      const q = await db.collection("users").where("email", "==", email).get(); await Promise.all(q.docs.map(d => d.ref.set({role, clienteId, clienteNome: cli ? cli.nome : ""}, {merge:true})));
      $("#kt-ie").value = ""; $("#kt-in").value = ""; $("#kt-ic").value = ""; if ($("#kt-itel")) $("#kt-itel").value = ""; listU(); enviarConvite(email, nomeI, tel); };
    $("#kt-seed").onclick = async () => { const b = $("#kt-seed"); b.disabled = true; b.textContent = "Carregando…";
      if (!KT_FB.cid){ toast("Cadastre ou escolha um cliente antes."); b.disabled = false; b.textContent = "Carregar dados de exemplo"; return; }
      const pre = KT_FB.cid + "_", SEEDS = (window.SEED || []).map(([c, id, body]) => { const x = JSON.parse(JSON.stringify(body).replace(/"(ex-[^"]*)"/g, (m, v) => '"' + pre + v + '"')); if (KT_FB.SCOPED.includes(c)) x.clienteId = KT_FB.cid; return [c, c === "config" ? id + "__" + KT_FB.cid : (String(id).startsWith("ex-") ? pre + id : id), x]; });
      for (let i = 0; i < SEEDS.length; i += 400){ const batch = db.batch(); SEEDS.slice(i, i+400).forEach(([c, id, body]) => batch.set(db.collection(c).doc(id), body)); await batch.commit(); }
      b.textContent = "Dados de exemplo carregados"; toast("Exemplos carregados"); };
    const lixo = x => { const n = String(x.nome || ""), l = (n.match(/[A-Za-zÀ-ÿ]/g) || []).length;
      return x.origem === "importação" && (/[�\u0000-\u0008\u000E-\u001F]/.test(n + (x.doc || "")) || /^PK/.test(n) || /\.xml/.test(n) || !n.trim() || l / Math.max(1, n.length) < .5); };
    const lotes = () => { const box = $("#kt-lotes-b"); if (!box) return;
      const ruins = S.suppliers.filter(lixo), g = {};
      S.suppliers.filter(x => x.lote).forEach(x => { (g[x.lote] ||= {n: 0, em: x.criadoEm, arq: x.arquivo || "", ids: []}); g[x.lote].n++; g[x.lote].ids.push(x.id); });
      const L = Object.entries(g).sort((a, b) => (b[1].em || "").localeCompare(a[1].em || "")).slice(0, 8);
      box.innerHTML = `${ruins.length ? `<div class="banner" style="border-color:var(--bad)"><b>${ruins.length} fornecedor(es) importado(s) com texto ilegível.</b> <button type="button" class="btn sm bad" id="kt-lixo" style="margin-left:8px">Apagar ${ruins.length} registro(s) com erro</button></div>` : `<p class="sub" style="margin:0">Nenhum registro importado com texto ilegível.</p>`}
        ${L.length ? `<div class="tbl"><table><thead><tr><th>Data</th><th>Arquivo</th><th>Fornecedores</th><th></th></tr></thead><tbody>${L.map(([k, v]) => `<tr><td class="mono">${v.em ? new Date(v.em).toLocaleString("pt-BR") : "—"}</td><td>${esc(v.arq)}</td><td class="mono">${v.n}</td><td><button type="button" class="btn sm ghost" data-lote="${k}">Desfazer</button></td></tr>`).join("")}</tbody></table></div>` : ""}`;
      const apagar = async (ids, msg) => { let n = 0; for (let i = 0; i < ids.length; i += 400){ const batch = db.batch(); ids.slice(i, i + 400).forEach(id => batch.delete(db.collection("suppliers").doc(id))); await batch.commit(); n += Math.min(400, ids.length - i); } toast(`${n} ${msg}`); setTimeout(lotes, 800); };
      const bl = $("#kt-lixo"); if (bl) bl.onclick = () => confirmBox(`Apagar ${ruins.length} fornecedor(es) importado(s) com texto ilegível? Os demais fornecedores não são afetados.`, "Apagar registros com erro", () => apagar(ruins.map(x => x.id), "registro(s) com erro apagado(s)"));
      $$("[data-lote]", box).forEach(x => x.onclick = () => { const v = g[x.dataset.lote]; confirmBox(`Desfazer a importação de ${v.n} fornecedor(es) (${v.arq})?`, "Desfazer importação", () => apagar(v.ids, "fornecedor(es) removido(s)")); });
    };
    lotes();
    (async () => { if (!KT_FB.cid) return; const box = $("#kt-mig-b"); if (!box) return; const sem = {};
      try{ for (const col of KT_FB.SCOPED){ const q = await db.collection(col).get(); sem[col] = q.docs.filter(d => !d.data().clienteId).map(d => d.id); } }catch(e){ return; }
      const n = Object.values(sem).reduce((t, a) => t + a.length, 0); if (!n) return;
      const atual = (KT_FB.clientes.find(c => c.id === KT_FB.cid) || {}).nome || "cliente atual"; $("#kt-mig").hidden = false;
      box.innerHTML = `Há <b>${n} registro(s)</b> de antes da separação por cliente (${sem.suppliers.length} fornecedor(es), ${sem.contracts.length} contrato(s), ${sem.evidences.length} evidência(s)). Eles não aparecem para ninguém até serem vinculados a um cliente.<div style="margin-top:8px"><button type="button" class="btn sm primary" id="kt-mig-go">Vincular ao cliente ${esc(atual)}</button></div>`;
      $("#kt-mig-go").onclick = () => confirmBox(`Vincular ${n} registro(s) sem cliente a ${atual}? Eles passam a aparecer só para este cliente.`, "Vincular", async () => {
        for (const col of KT_FB.SCOPED) for (let i = 0; i < sem[col].length; i += 400){ const batch = db.batch(); sem[col].slice(i, i + 400).forEach(id => batch.set(db.collection(col).doc(id), {clienteId: KT_FB.cid}, {merge: true})); await batch.commit(); }
        for (const id of KT_FB.CFGS){ const d = await db.collection("config").doc(id).get().catch(() => null); if (d && d.exists){ const alvo = db.collection("config").doc(id + "__" + KT_FB.cid); const a = await alvo.get(); if (!a.exists) await alvo.set(d.data()); } }
        const vel = await db.collection("config").doc("cliente").get().catch(() => null); if (vel && vel.exists){ const c = (await db.collection("clientes").doc(KT_FB.cid).get()).data() || {}; if (!c.doc && !c.local) await db.collection("clientes").doc(KT_FB.cid).set(vel.data(), {merge: true}); }
        toast(`${n} registro(s) vinculado(s) a ${atual}`); setTimeout(() => location.reload(), 900); });
    })();
    $("#kt-unseed").onclick = () => confirmBox("Apagar todos os fornecedores, contratos, pareceres, operações e evidências marcados EXEMPLO? Os dados reais não são afetados.", "Apagar exemplos", async () => {
      const b = $("#kt-unseed"); b.disabled = true; b.textContent = "Apagando…"; let n = 0;
      const apagar = async (col, ids) => { for (let i = 0; i < ids.length; i += 400){ const batch = db.batch(); ids.slice(i, i+400).forEach(id => batch.delete(db.collection(col).doc(id))); await batch.commit(); } n += ids.length; };
      try{
        const ev = await db.collection("evidences").where("clienteId", "==", KT_FB.cid).get();
        const ex = v => { v = String(v || ""); return v.startsWith(KT_FB.cid + "_ex-") || v.startsWith("ex-"); }, meu = d => (d.data().clienteId || "") === KT_FB.cid;
        await apagar("evidences", ev.docs.filter(d => meu(d) && ex(d.data().supplierId)).map(d => d.id));
        for (const col of ["pareceres", "contracts", "operacoes", "suppliers"]){ const snap = await db.collection(col).where("clienteId", "==", KT_FB.cid).get(); await apagar(col, snap.docs.map(d => d.id).filter(ex)); }
        b.textContent = "Exemplos apagados"; toast(`${n} registro(s) de exemplo apagado(s)`);
      }catch(e){ b.disabled = false; b.textContent = "Apagar dados de exemplo"; toast("Não foi possível apagar todos os exemplos. Tente de novo."); }
    });
  },
  async fichasList(){
    const box = document.querySelector("#fi-prev"); if (!box) return;
    const wrap = document.createElement("div"); wrap.className = "card"; wrap.style.cssText = "display:flex;flex-direction:column;gap:8px";
    wrap.innerHTML = `<h3>Fichas recebidas pelo Portal</h3><div id="kt-fl" class="sub" style="margin:0">Carregando…</div>`;
    box.parentNode.insertBefore(wrap, box.parentNode.firstChild.nextSibling);
    const q = await KT_AUTH.db.collection("fichas").where("clienteId", "==", KT_FB.cid || "-").get().catch(() => null);
    const list = (q ? q.docs : []).map(d => ({id:d.id, ...d.data()})).filter(f => f.status === "enviada" || f.status === "importada").sort((a,b) => (b.enviadoEm||"").localeCompare(a.enviadoEm||""));
    const fl = document.querySelector("#kt-fl"); if (!fl) return;
    fl.innerHTML = list.length ? list.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid var(--line);padding:8px 0"><div><b style="color:var(--fog)">${esc(f.fornecedor?.nome || f.email)}</b><div style="font-size:12px">${esc(f.fornecedor?.nivel || "")} · ${esc(f.email || "")} · ${f.enviadoEm ? dt(f.enviadoEm) : ""} ${f.status === "importada" ? "· importada" : ""}</div></div><button type="button" class="btn sm ${f.status === "importada" ? "" : "primary"}" data-fi="${f.id}">${f.status === "importada" ? "Importar de novo" : "Carregar"}</button></div>`).join("") : "Nenhuma ficha enviada ainda.";
    fl.querySelectorAll("[data-fi]").forEach(b => b.onclick = () => {
      const f = list.find(x => x.id === b.dataset.fi); const {id, status, enviadoEm, email, ...ficha} = f;
      const file = new File([JSON.stringify({...ficha, formato:"kinseytec-cacau-ficha"})], "ficha.kinseytec", {type:"application/json"});
      const dt2 = new DataTransfer(); dt2.items.add(file); const inp = document.querySelector("#fi-file"); inp.files = dt2.files; inp.dispatchEvent(new Event("change"));
      KT_FB._fichaId = f.id;
    });
  }
};
window.KT_FB = KT_FB;
