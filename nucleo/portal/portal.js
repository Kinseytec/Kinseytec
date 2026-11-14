/* ================= PORTAL DO FORNECEDOR ================= */
const ADMINS = ["ia@kinsey.com.br"];
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nowISO = () => new Date().toISOString();
const dt = iso => iso ? new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 2800); }
function haversine(a,b,c,d){ const R=6371, r=Math.PI/180, x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
const muniOf = (name, uf) => MUNI.find(m => m[0].toLowerCase()===String(name||"").trim().toLowerCase() && (!uf || m[1]===uf));

const KEY = "kinseytec-portal-v1";
let F; try{ F = JSON.parse(localStorage.getItem(KEY)) || null; }catch(e){ F = null; }
F = F || {step:0, sup:{nivel:"N1"}, nda:{}, answers:{}, docs:{}, anexos:[], fotos:[]};
/* itens adicionais do cliente (cópia sem pesos nem critérios) e NDA vigente */
const PCFG = () => window.KT_PCFG || (() => { try{ return JSON.parse(localStorage.getItem("kinseytec-v1"))?.config?.portal || {}; }catch(e){ return {}; } })();
const qExtra = lv => (PCFG().perguntas || []).filter(p => (p.niveis || []).includes(lv)), dExtra = lv => (PCFG().documentos || []).filter(p => (p.niveis || []).includes(lv));
const QL = lv => [...Q[lv], ...(qExtra(lv).length ? [{g: "Questionamentos adicionais do cliente", items: qExtra(lv).map(p => [p.id, p.texto])}] : [])];
const ndaOk = () => !!(F.nda && F.nda.aceito && F.nda.versao === NDA_VERSION);
function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(F)); $("#saved").textContent = "Rascunho salvo neste aparelho"; }catch(e){ $("#saved").textContent = "Rascunho grande demais para salvar: envie a ficha ao terminar"; } }

const STEPS = [["Início","Início"],["Cadastro","Cadastro"],["NDA / LGPD","NDA"],["Questionário","Perguntas"],["Documentos","Docs"],["Fotos","Fotos"],["Enviar","Enviar"]];
function done(i){
  if (i===1) return !!(F.sup.nome && F.sup.doc && F.sup.uf);
  if (i===2) return ndaOk();
  if (i===3){ const qs = QL(F.sup.nivel).flatMap(g => g.items); return qs.every(q => F.answers[q[0]]?.v); }
  if (i===4) return docList().every(docOk);
  if (i===5) return F.fotos.length >= 3;
  return false;
}
function renderSteps(){
  $("#wsteps").style.gridTemplateColumns = `repeat(${STEPS.length},minmax(0,1fr))`;
  $("#wsteps").innerHTML = STEPS.map(([l],i) => `<button type="button" data-go="${i}" class="${done(i)?"done":""}" ${F.step===i?'aria-current="step"':""}><span class="sn">${done(i)?"✓":i===0?"⌂":i}</span>${STEPS[i][1]}</button>`).join("");
  $$("#wsteps [data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
}
function go(i){ if (i >= 3 && !ndaOk()){ toast("Para continuar, leia e aceite o NDA e o termo LGPD."); i = 2; } F.step = Math.max(0, Math.min(STEPS.length-1, i)); persist(); render(); $("#pscroll").scrollTop = 0; }
function nav(){ const i = F.step; return `<div class="navrow">${i>0 ? `<button type="button" class="btn ghost" data-nav="${i-1}">← ${STEPS[i-1][0]}</button>` : "<span></span>"}${i<STEPS.length-1 ? `<button type="button" class="btn primary" data-nav="${i+1}">Próximo: ${STEPS[i+1][0]} →</button>` : ""}</div>`; }
function bindNav(){ $$("[data-nav]").forEach(b => b.onclick = () => go(+b.dataset.nav)); }
function render(){ if (F.step >= 3 && !ndaOk()) F.step = 2; renderSteps(); [stIntro, stCad, stNda, stQuest, stDocs, stFotos, stEnviar][F.step](); bindNav(); }
const B = () => $("#pbody");

/* ---------- 0 Início ---------- */
function stIntro(){
  B().innerHTML = `
    <div><div class="eyebrow">Due diligence da cadeia do cacau</div><h2 style="font-size:26px;margin-top:6px">Bem-vindo ao Portal do Fornecedor</h2>
    <p class="sub">A Kinsey BR conduz a verificação da origem do cacau comprado pelo cliente contratante. Preencha as etapas abaixo. Ninguém além da Kinsey BR e do cliente contratante recebe suas informações, e você não vê dados de outros fornecedores.</p></div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">
      <h3>Como funciona</h3>
      <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px">
        <li><b>Cadastro</b> da empresa ou do produtor.</li><li><b>NDA e termo LGPD</b> com aceite eletrônico.</li><li><b>Questionário</b> do seu nível (trader, fornecedor ou produtor).</li><li><b>Documentos</b> do checklist.</li><li><b>Fotos</b> com data e GPS (mínimo 3).</li><li><b>Enviar</b>: o portal gera a sua ficha para enviar à Kinsey BR.</li></ol>
      <p class="sub" style="margin:0">Seu rascunho fica salvo neste aparelho. Você pode parar e continuar depois.</p>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:8px">
      <h3>Seus dados e a LGPD</h3>
      <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:13.5px">
        <li><b>Finalidade:</b> verificação da origem e da regularidade da cadeia de fornecimento do cliente contratante (due diligence).</li>
        <li><b>Quem acessa:</b> somente a Kinsey BR e o cliente contratante, sob confidencialidade (NDA). Você não vê dados de outros fornecedores, e eles não veem os seus.</li>
        <li><b>O que você vê:</b> apenas o que você mesmo envia. Avaliações e conclusões da auditoria são internas e não aparecem neste portal.</li>
        <li><b>Seus direitos:</b> acesso, correção e informação sobre o uso dos seus dados pessoais (Lei 13.709/2018), solicitados à Kinsey BR.</li>
        <li><b>Antes de responder:</b> é obrigatório ler e aceitar o NDA e o termo LGPD (etapa 2).</li></ul>
    </div>
    <div class="card" style="display:flex;flex-direction:column;gap:8px">
      <h3>Instale no celular</h3>
      <p style="font-size:14px;margin:0"><b>iPhone (Safari):</b> Compartilhar → "Adicionar à Tela de Início".<br><b>Android (Chrome):</b> menu ⋮ → "Adicionar à tela inicial".</p>
    </div>
    <div class="admins">Administração KinseyTec: <b>${ADMINS[0]}</b></div>
    ${nav()}`;
}

/* ---------- 1 Cadastro ---------- */
function stCad(){
  const s = F.sup;
  B().innerHTML = `
    <div><div class="eyebrow">Etapa 1</div><h2>Cadastro</h2><p class="sub">Campos com * são obrigatórios.</p></div>
    <form class="form" id="fcad" novalidate>
      <div class="fld"><label for="c-nivel">Você é</label><select id="c-nivel">${[["N1","Trader (vende ao cliente contratante)"],["N2","Fornecedor de trader"],["N3","Produtor rural"]].map(([v,l]) => `<option value="${v}" ${s.nivel===v?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="fld"><label for="c-tipo">Tipo</label><select id="c-tipo">${SUP_TYPES[s.nivel].map(t => `<option ${s.tipo===t?"selected":""}>${t}</option>`).join("")}</select></div>
      <div class="fld full"><label for="c-nome">Razão social ou nome *</label><input id="c-nome" value="${esc(s.nome)}"></div>
      <div class="fld"><label for="c-doc">CNPJ ou CPF *</label><input id="c-doc" inputmode="numeric" value="${esc(s.doc)}"></div>
      <div class="fld"><label for="c-ie">Inscrição estadual</label><input id="c-ie" value="${esc(s.ie)}"></div>
      <div class="fld full" ${s.nivel==="N1"?"hidden":""}><label for="c-comp">Para quem você vende (nome e CNPJ do comprador)</label><input id="c-comp" value="${esc(s.comprador)}" placeholder="Ex.: Trader Xingu Ltda · 00.000.000/0001-00"></div>
      <div class="fld"><label for="c-uf">UF *</label><select id="c-uf"><option value="">—</option>${UFS.map(u => `<option ${s.uf===u?"selected":""}>${u}</option>`).join("")}</select></div>
      <div class="fld"><label for="c-mun">Município</label><input id="c-mun" list="dl-m" value="${esc(s.municipio)}"><datalist id="dl-m">${MUNI.map(m => `<option value="${m[0]}">${m[1]}</option>`).join("")}</datalist></div>
      <div class="fld full"><label for="c-est">Endereço do local de estocagem</label><input id="c-est" value="${esc(s.endEstoque)}"></div>
      <div class="fld full"><label for="c-ext">Endereço do local de extração (propriedade de origem)</label><input id="c-ext" value="${esc(s.endExtracao)}"></div>
      <div class="fld" ${s.nivel!=="N3"?"hidden":""}><label for="c-car">Nº do CAR</label><input id="c-car" value="${esc(s.car)}"></div>
      <div class="fld" ${s.nivel!=="N3"?"hidden":""}><label for="c-area">Área plantada com cacau (ha)</label><input id="c-area" inputmode="decimal" value="${esc(s.areaHa)}"></div>
      <div class="fld"><label for="c-vol">Volume anual de cacau (t)</label><input id="c-vol" inputmode="decimal" value="${esc(s.volume)}"></div>
      <div class="fld"><label for="c-ab">Data de abertura do CNPJ</label><input id="c-ab" type="date" value="${esc(s.abertura)}"></div>
      <div class="fld"><label for="c-resp">Responsável</label><input id="c-resp" value="${esc(s.responsavel)}"></div>
      <div class="fld"><label for="c-cont">Telefone ou e-mail</label><input id="c-cont" value="${esc(s.contato)}"></div>
      <div class="fld full"><label for="c-emp">Forma de contratação dos empregados</label><select id="c-emp"><option value="">—</option>${["CLT","Safra","Parceria / meação","Diaristas","Terceirizados","Mão de obra familiar","Misto"].map(o => `<option ${s.contratacao===o?"selected":""}>${o}</option>`).join("")}</select></div>
    </form>
    <p class="err" id="cerr" hidden></p>
    ${nav()}`;
  const map = {nivel:"#c-nivel",tipo:"#c-tipo",nome:"#c-nome",doc:"#c-doc",ie:"#c-ie",comprador:"#c-comp",uf:"#c-uf",municipio:"#c-mun",endEstoque:"#c-est",endExtracao:"#c-ext",car:"#c-car",areaHa:"#c-area",volume:"#c-vol",abertura:"#c-ab",responsavel:"#c-resp",contato:"#c-cont",contratacao:"#c-emp"};
  Object.entries(map).forEach(([k,sel]) => { const el = $(sel); el.onchange = () => { F.sup[k] = el.value.trim(); if (k==="municipio"){ const m = muniOf(el.value, F.sup.uf) || muniOf(el.value); if (m){ F.sup.uf = m[1]; $("#c-uf").value = m[1]; } } if (k==="nivel"){ F.answers = {}; F.docs = {}; F.sup.tipo = SUP_TYPES[el.value][0]; persist(); stCad(); bindNav(); renderSteps(); return; } persist(); renderSteps(); }; });
}

/* ---------- 2 NDA ---------- */
function stNda(){
  const n = F.nda;
  B().innerHTML = `
    <div><div class="eyebrow">Etapa 2</div><h2>NDA e termo LGPD</h2><p class="sub">Confidencialidade, tratamento de dados pessoais e declaração de veracidade.</p></div>
    <details class="card" id="nd-termo"><summary><h3 style="font-size:14px;margin:0">Ler o termo completo (${NDA_TEXT.length} cláusulas)</h3></summary><div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">${NDA_TEXT.map(([h,t]) => `<div><h3 style="font-size:14px">${esc(h)}</h3><p style="font-size:13.5px;color:#c9d2e0;margin-top:4px">${esc(t)}</p></div>`).join("")}</div></details>
    ${n.aceito && n.versao !== NDA_VERSION ? `<div class="banner"><b>O termo foi atualizado.</b> Leia a nova versão e registre o aceite novamente.</div>` : ""}
    ${ndaOk() ? `<div class="card" style="border-color:rgba(54,211,153,.45)"><span class="pill r-baixo">Termo aceito</span><p style="margin-top:8px;font-size:14px">${esc(n.nome)} · ${esc(n.cargo)} · ${dt(n.em)}</p><button type="button" class="btn sm ghost" id="nd-redo" style="margin-top:8px">Refazer aceite</button></div>` :
    `<form id="fnda" class="card" style="display:flex;flex-direction:column;gap:12px" novalidate>
      <div class="form"><div class="fld"><label for="nd-nome">Nome do representante</label><input id="nd-nome" value="${esc(F.sup.responsavel)}"></div><div class="fld"><label for="nd-cargo">Cargo</label><input id="nd-cargo"></div><div class="fld full"><label for="nd-doc">CPF do representante</label><input id="nd-doc" inputmode="numeric"></div></div>
      <label class="check"><input type="checkbox" id="nd-c0" disabled> Li o termo completo acima (abra “Ler o termo completo” para habilitar).</label>
      <label class="check"><input type="checkbox" id="nd-c1"> Li e concordo com a confidencialidade e o repasse das informações ao cliente contratante.</label>
      <label class="check"><input type="checkbox" id="nd-c2"> Estou ciente do tratamento dos dados pessoais (LGPD) e dos direitos do titular.</label>
      <label class="check"><input type="checkbox" id="nd-c3"> Declaro que as informações e documentos enviados são verdadeiros.</label>
      <p class="err" id="nd-err" hidden></p>
      <button type="submit" class="btn primary" style="align-self:flex-start">Registrar aceite</button></form>`}
    <p class="sub" style="font-size:12px">Minuta em avaliação pelo Jurídico da Kinsey BR (${esc(NDA_VERSION)}).</p>
    ${nav()}`;
  const f = $("#fnda");
  if (f) f.onsubmit = e => { e.preventDefault(); const v = id => $(id).value.trim();
    const err = !v("#nd-nome") || !v("#nd-cargo") || !v("#nd-doc") ? "Preencha nome, cargo e CPF do representante." : !($("#nd-c0").checked && $("#nd-c1").checked && $("#nd-c2").checked && $("#nd-c3").checked) ? "Leia o termo completo e marque as quatro declarações." : null;
    if (err){ $("#nd-err").textContent = err; $("#nd-err").hidden = false; return; }
    F.nda = {aceito:true, nome:v("#nd-nome"), cargo:v("#nd-cargo"), doc:v("#nd-doc"), em:nowISO(), versao:NDA_VERSION, canal:"Portal do Fornecedor", leuTermo:true, email: window.KT_ME_EMAIL || "", navegador: navigator.userAgent.slice(0, 160)}; persist(); toast("Aceite registrado"); go(3); };
  const tm = $("#nd-termo"), c0 = $("#nd-c0"); if (tm && c0) tm.addEventListener("toggle", () => { if (tm.open) c0.disabled = false; });
  const r = $("#nd-redo"); if (r) r.onclick = () => { F.nda = {}; persist(); stNda(); bindNav(); renderSteps(); };
}

/* ---------- 3 Questionário ---------- */
function stQuest(){
  const lv = F.sup.nivel; let n = 0; const qs = QL(lv).flatMap(g => g.items); const ok = qs.filter(q => F.answers[q[0]]?.v).length;
  B().innerHTML = `<div><div class="eyebrow">Etapa 3</div><h2>Questionário</h2><p class="sub">${ok} de ${qs.length} respondidas. Responda com transparência; use a observação para explicar.</p></div>
    ${QL(lv).map(g => `<div class="qgroup"><div class="eyebrow">${g.g}</div>${g.items.map(([id,t]) => { n++; const c = F.answers[id] || {};
      return `<div class="q" data-q="${id}"><span class="qn">${String(n).padStart(2,"0")}</span><div class="qt">${esc(t)}</div><div class="qa"><div class="seg">${[["sim","Sim"],["nao","Não"],["na","N/A"]].map(([v,l]) => `<button type="button" data-v="${v}" class="v-na" aria-pressed="${c.v===v}">${l}</button>`).join("")}</div><input type="text" placeholder="Observação" value="${esc(c.n)}"></div></div>`; }).join("")}</div>`).join("")}
    ${nav()}`;
  $$(".q").forEach(q => { const id = q.dataset.q;
    $$("[data-v]", q).forEach(b => b.onclick = () => { F.answers[id] = {...(F.answers[id]||{}), v: F.answers[id]?.v===b.dataset.v ? "" : b.dataset.v}; persist(); $$("[data-v]", q).forEach(x => x.setAttribute("aria-pressed", x.dataset.v===F.answers[id].v)); renderSteps(); });
    $("input", q).onchange = e => { F.answers[id] = {...(F.answers[id]||{}), n:e.target.value}; persist(); };
  });
}

/* ---------- 4 Documentos ---------- */
async function readSmall(file){
  if (file.type.startsWith("image/")) return shrink(file, 1400, .78);
  if (file.size > 2.5e6) throw new Error("grande");
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
}
async function shrink(file, max, q){
  const bmp = await createImageBitmap(file); const k = Math.min(1, max/Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width*k); c.height = Math.round(bmp.height*k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", q);
}
function docList(){ const lv = F.sup.nivel; return [...DOCS[lv].map((t, i) => ({id: "d" + i, t})), ...dExtra(lv).map(p => ({id: p.id, t: p.texto, extra: true}))]; }
const docOk = d => { const x = F.docs[d.id]; return !!(x && x.v && (x.v === "tem" || String(x.j || "").trim().length >= 5)); };
function stDocs(){
  const L = docList(), outros = F.anexos.map((a, i) => ({...a, i})).filter(a => a.doc === "outro");
  B().innerHTML = `<div><div class="eyebrow">Etapa 4</div><h2>Documentos</h2><p class="sub">Para cada documento solicitado, informe se tem e anexe a foto ou o PDF (até 2,5 MB). Se não tiver ou não se aplicar, explique o motivo. O auditor Kinsey BR confere depois.</p></div>
    <div class="qgroup">${L.map((d, i) => { const x = F.docs[d.id] || {}, anx = F.anexos.filter(a => a.doc === d.id);
      return `<div class="q" data-d="${d.id}"><span class="qn">${String(i + 1).padStart(2, "0")}</span><div class="qt">${esc(d.t)}${d.extra ? ` <span class="sub" style="font-size:11.5px">· solicitado pelo cliente</span>` : ""}</div>
        <div class="qa"><div class="seg">${[["tem", "Tenho"], ["nao", "Não tenho"], ["na", "Não se aplica"]].map(([v, l]) => `<button type="button" data-v="${v}" class="v-na" aria-pressed="${x.v === v}">${l}</button>`).join("")}</div>
        <label class="btn sm" style="cursor:pointer">Anexar<input type="file" accept="image/*,application/pdf" hidden></label>${anx.length ? `<span style="font-size:12px;color:var(--ok)">${anx.length} anexo(s)</span>` : ""}</div>
        ${x.v === "nao" || x.v === "na" ? `<div class="fld" style="margin-top:8px"><label>Justificativa (obrigatória)</label><input data-j value="${esc(x.j)}" placeholder="Explique por que não tem ou não se aplica"></div>` : ""}</div>`; }).join("")}</div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px"><h3>Outros documentos</h3>
      <p class="sub" style="margin:0">Documentos fora da lista que ajudam a comprovar a regularidade (licenças, contratos, laudos, declarações). Informe o que é e por que está enviando.</p>
      <div class="form"><div class="fld"><label for="o-desc">Documento</label><input id="o-desc" placeholder="Ex.: Laudo de análise do produto"></div><div class="fld"><label for="o-just">Justificativa</label><input id="o-just" placeholder="Ex.: comprova a origem do lote de outubro"></div>
        <div class="fld full"><label for="o-file">Arquivo (foto ou PDF até 2,5 MB)</label><input id="o-file" type="file" accept="image/*,application/pdf"></div></div>
      <p class="err" id="o-err" hidden></p><button type="button" class="btn sm primary" id="o-add" style="align-self:flex-start">Adicionar documento</button>
      ${outros.length ? `<div style="display:flex;flex-direction:column;gap:6px">${outros.map(o => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:6px;font-size:13.5px"><span><b>${esc(o.tipo)}</b> · ${esc(o.nome)}<br><span class="sub" style="font-size:12px">${esc(o.just)}</span></span><button type="button" class="btn sm ghost" data-orm="${o.i}">Remover</button></div>`).join("")}</div>` : ""}</div>
    ${nav()}`;
  const again = () => { stDocs(); bindNav(); renderSteps(); };
  $$("[data-d]").forEach(q => { const id = q.dataset.d, d = L.find(x => x.id === id);
    $$("[data-v]", q).forEach(b => b.onclick = () => { F.docs[id] = {...(F.docs[id] || {}), v: F.docs[id]?.v === b.dataset.v ? "" : b.dataset.v}; persist(); again(); });
    const j = $("[data-j]", q); if (j) j.oninput = () => { F.docs[id] = {...(F.docs[id] || {}), j: j.value}; persist(); renderSteps(); };
    $("input[type=file]", q).onchange = async e => { const f = e.target.files[0]; if (!f) return;
      try{ const data = await readSmall(f); const media = window.KT_SAVE_MEDIA ? await KT_SAVE_MEDIA(data, f.name) : {data}; F.anexos.push({doc: id, tipo: d.t, nome: f.name, mime: data.slice(5, data.indexOf(";")), ...media}); F.docs[id] = {...(F.docs[id] || {}), v: "tem"}; persist(); toast("Documento anexado"); again(); }
      catch(x){ toast(x.message === "grande" ? "Arquivo acima de 2,5 MB: envie direto ao auditor." : "Não foi possível ler o arquivo."); } };
  });
  $("#o-add").onclick = async () => { const desc = $("#o-desc").value.trim(), just = $("#o-just").value.trim(), f = $("#o-file").files[0], er = $("#o-err");
    if (desc.length < 3 || just.length < 10 || !f){ er.textContent = "Informe o documento, a justificativa (pelo menos uma frase) e o arquivo."; er.hidden = false; return; }
    try{ const data = await readSmall(f); const media = window.KT_SAVE_MEDIA ? await KT_SAVE_MEDIA(data, f.name) : {data}; F.anexos.push({doc: "outro", tipo: desc, just, nome: f.name, mime: data.slice(5, data.indexOf(";")), ...media}); persist(); toast("Documento adicionado"); again(); }
    catch(x){ er.textContent = x.message === "grande" ? "Arquivo acima de 2,5 MB: envie direto ao auditor." : "Não foi possível ler o arquivo."; er.hidden = false; } };
  $$("[data-orm]").forEach(b => b.onclick = () => { F.anexos.splice(+b.dataset.orm, 1); persist(); again(); });
}

/* ---------- 5 Fotos ---------- */
function stFotos(){
  const tipos = F.sup.nivel==="N3" ? ["Foto da propriedade","Foto da mercadoria","Foto do galpão / armazém"] : ["Foto da mercadoria","Foto do galpão / armazém","Foto da balança","Foto da propriedade"];
  B().innerHTML = `<div><div class="eyebrow">Etapa 5</div><h2>Fotos com data e GPS</h2><p class="sub">Mínimo de 3 fotos: ${F.sup.nivel==="N3" ? "propriedade, cacau e secagem" : "mercadoria, galpão/armazém e balança"}. Use a câmera com a localização ativada.</p></div>
    <form class="card form" id="ffoto" novalidate>
      <div class="fld"><label for="f-tipo">Tipo de foto</label><select id="f-tipo">${tipos.map(t => `<option>${t}</option>`).join("")}</select></div>
      <div class="fld"><label for="f-file">Foto</label><input id="f-file" type="file" accept="image/*" capture="environment"></div>
      <div class="fld full"><label for="f-obs">Descrição</label><input id="f-obs" placeholder="O que a foto mostra"></div>
      <div class="fld full" id="f-meta" hidden></div>
      <button type="submit" class="btn primary full" id="f-go">Adicionar foto</button>
    </form>
    <p class="sub" style="font-size:12px">LGPD: evite rostos e documentos pessoais de trabalhadores.</p>
    <div class="ph-grid">${F.fotos.map((p,i) => `<div class="ph"><img src="${p.url || p.data}" alt="${esc(p.tipo)}"><div><b style="color:var(--fog)">${esc(p.tipo)}</b><br>${p.gps ? `GPS ${p.gps.lat.toFixed(4)}, ${p.gps.lng.toFixed(4)}` : `<span style="color:var(--warn)">sem GPS</span>`}<br>${dt(p.takenAt)}<br><button type="button" class="btn sm ghost" data-rm="${i}" style="margin-top:6px">Remover</button></div></div>`).join("") || `<div class="empty">Nenhuma foto ainda.</div>`}</div>
    ${nav()}`;
  let meta = null;
  $("#f-file").onchange = async () => { const f = $("#f-file").files[0]; meta = null; if (!f) return;
    try{ const g = window.exifr ? await exifr.parse(f, {gps:true, pick:["DateTimeOriginal","CreateDate","latitude","longitude"]}) : null;
      meta = {takenAt: g?.DateTimeOriginal ? new Date(g.DateTimeOriginal).toISOString() : g?.CreateDate ? new Date(g.CreateDate).toISOString() : null, gps: g?.latitude!=null ? {lat:g.latitude, lng:g.longitude} : null}; }catch(e){ meta = {takenAt:null, gps:null}; }
    const m = $("#f-meta"); m.hidden = false; m.innerHTML = `<div class="result">${meta.gps ? `GPS ${meta.gps.lat.toFixed(5)}, ${meta.gps.lng.toFixed(5)}` : `<span style="color:var(--warn)">Foto sem GPS.</span> Ative a localização da câmera.`} · ${meta.takenAt ? dt(meta.takenAt) : "sem data original"}</div>`; };
  $("#ffoto").onsubmit = async e => { e.preventDefault(); const f = $("#f-file").files[0]; if (!f){ toast("Escolha uma foto."); return; }
    $("#f-go").disabled = true; try{ const data = await shrink(f, 1280, .76); const media = window.KT_SAVE_MEDIA ? await KT_SAVE_MEDIA(data, f.name) : {data}; F.fotos.push({tipo:$("#f-tipo").value, obs:$("#f-obs").value.trim(), gps:meta?.gps||null, takenAt:meta?.takenAt||null, nome:f.name, mime:"image/jpeg", ...media}); persist(); toast("Foto adicionada"); stFotos(); bindNav(); renderSteps(); }catch(x){ toast("Não foi possível ler a foto."); $("#f-go").disabled = false; } };
  $$("[data-rm]").forEach(b => b.onclick = () => { F.fotos.splice(+b.dataset.rm, 1); persist(); stFotos(); bindNav(); renderSteps(); });
}

/* ---------- 6 Enviar ---------- */
function stEnviar(){
  const chk = [1,2,3,4,5].map(i => [STEPS[i][0], done(i)]);
  const ready = chk[0][1] && chk[1][1];
  B().innerHTML = `<div><div class="eyebrow">Etapa 6</div><h2>Enviar à Kinsey BR</h2><p class="sub">${window.KT_SEND_FICHA ? "Ao enviar, seu cadastro, respostas, documentos e fotos vão direto para a Kinsey BR, com segurança." : "O portal gera a sua <b>ficha do fornecedor</b> (um arquivo .kinseytec). Envie esse arquivo ao auditor Kinsey BR por e-mail ou WhatsApp."}</p></div>
    <div class="card"><ul class="reasons">${chk.map(([l,ok]) => `<li><span class="crit">${ok ? "Completo" : "Pendente"}</span><span>${l}</span><span class="pts" style="color:${ok?"var(--ok)":"var(--warn)"}">${ok?"✓":"…"}</span></li>`).join("")}</ul></div>
    ${window.KT_STATUS && window.KT_STATUS.enviadoEm ? `<div class="card" style="display:flex;flex-direction:column;gap:4px"><h3>Situação do seu envio</h3><p style="margin:0;font-size:14px">Enviado em ${dt(KT_STATUS.enviadoEm)}${KT_STATUS.importadoEm ? ` · <b style="color:var(--ok)">recebido pela Kinsey BR em ${dt(KT_STATUS.importadoEm)}</b>` : " · aguardando recebimento pela Kinsey BR"}.</p><p class="sub" style="margin:0">Você pode completar documentos e enviar novamente; o envio mais recente substitui o anterior.</p></div>` : ""}
    ${ready ? "" : `<div class="banner"><b>Cadastro e NDA são obrigatórios</b> para gerar a ficha. As demais etapas podem ser completadas depois com o auditor.</div>`}
    <button type="button" class="btn primary" id="gen" ${ready?"":"disabled"}>${window.KT_SEND_FICHA ? "Enviar à Kinsey BR" : "Gerar ficha do fornecedor"}</button>
    ${window.KT_SEND_FICHA ? "" : `<div class="card" style="display:flex;flex-direction:column;gap:6px"><h3>Para onde enviar</h3><p style="font-size:14px;margin:0">E-mail: <b style="user-select:all">${ADMINS[0]}</b>, ou pelo WhatsApp do auditor Kinsey BR que acompanha o seu cadastro.</p><button type="button" class="btn sm" id="cp" style="align-self:flex-start">Copiar e-mail</button></div>`}
    <button type="button" class="btn sm ghost" id="clr" style="align-self:flex-start">Apagar rascunho deste aparelho</button>
    ${nav()}`;
  if ($("#cp")) $("#cp").onclick = async () => { try{ await navigator.clipboard.writeText(ADMINS.join("; ")); toast("E-mail copiado"); }catch(e){ toast(ADMINS.join("; ")); } };
  $("#clr").onclick = () => confirmBox("Apagar o rascunho deste aparelho? Gere a ficha antes, se ainda não enviou.", () => { try{ localStorage.removeItem(KEY); }catch(e){} F = {step:0, sup:{nivel:"N1"}, nda:{}, answers:{}, docs:{}, anexos:[], fotos:[]}; render(); });
  const g = $("#gen"); if (g) g.onclick = async () => {
    const ficha = {formato:"kinseytec-cacau-ficha", versao:1, geradoEm:nowISO(), fornecedor:F.sup, nda:F.nda, answers:F.answers, docs:F.docs, anexos:F.anexos, fotos:F.fotos};
    const data = JSON.stringify(ficha); const nome = `ficha_${(F.sup.doc||"fornecedor").replace(/\D/g,"") || "fornecedor"}_${new Date().toISOString().slice(0,10)}.kinseytec`;
    if (window.KT_SEND_FICHA){ try{ g.disabled = true; await KT_SEND_FICHA(ficha); toast("Ficha enviada à Kinsey BR. Obrigado!"); g.textContent = "Ficha enviada ✓"; }catch(e){ g.disabled = false; toast("Não foi possível enviar. Verifique a conexão."); } return; }
    const dl = window.__ktHost?.use ? await __ktHost.use("downloads").catch(() => null) : null;
    if (!dl){ toast("Abra o portal pelo link da Kinsey BR para gerar a ficha."); return; }
    try{ await dl.save({filename:nome, data:new Blob([data], {type:"application/json"})}); toast("Ficha gerada. Envie o arquivo à Kinsey BR."); }catch(e){ if (e?.code !== "cancelled") toast("A ficha não foi salva. Tente de novo."); }
  };
}
function confirmBox(msg, fn){
  const d = document.createElement("div"); d.className = "scrim"; d.style.alignItems = "center";
  d.innerHTML = `<div class="card" style="max-width:380px;margin:16px;display:flex;flex-direction:column;gap:14px;background:var(--navy)"><p>${esc(msg)}</p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-c>Cancelar</button><button type="button" class="btn bad" data-ok>Apagar</button></div></div>`;
  document.body.appendChild(d); d.querySelector("[data-c]").onclick = () => d.remove(); d.querySelector("[data-ok]").onclick = () => { d.remove(); fn(); };
}
(window.KT_PORTAL_START ? KT_PORTAL_START() : Promise.resolve()).then(render);
