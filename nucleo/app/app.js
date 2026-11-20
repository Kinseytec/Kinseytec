const KIM_VIDEO = "/_blob/ace63d1ec6f5e5aa3fea1a7ba2f75e66";
const KIM_INSTALL = "/_blob/a0037f74ca13e1168ec8f3ba1ad8036b";
const KIM_EN = "/_blob/5abd5110e61fc0fe09a05e7635c97b86";
/* ================= UTIL ================= */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
/* links de mapa: o "@" fica fora do texto para não ser trocado pela unidade de preço do segmento */
const AT = String.fromCharCode(64);
/* mapas: marcador no endereço do fornecedor (quando houver) ou na coordenada exata, já em satélite / 3D */
function mapaSat(lat, lng, m, end){ const alvo = end ? encodeURIComponent(end) : `${lat},${lng}`; return `https://www.google.com/maps/place/${alvo}/${lat != null ? AT + lat + "," + lng + "," + (m || 600) + "m/" : ""}data=!3m1!1e3`; }
function mapa3D(lat, lng, end){ const alvo = end ? encodeURIComponent(end) : `${lat},${lng}`; return `https://earth.google.com/web/search/${alvo}/${lat != null ? AT + lat + "," + lng + ",300a,1200d,35y,0h,45t,0r" : ""}`; }
function enderecoForn(s){ const r = s.mapa?.end || s.receita?.endereco || (S.evidences || []).filter(e => e.supplierId === s.id && e.analise?.extraido?.endereco).map(e => e.analise.extraido.endereco)[0] || "";
  return r ? [r, s.municipio, s.uf, "Brasil"].filter(Boolean).join(", ") : ""; }
const CP1252 = {"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
function fixMoji(t){
  t = String(t ?? ""); if (!/[ÃÂ][\u0080-\u00BF\u0152-\u0178\u0192\u02C6\u02DC\u2013-\u2122]/.test(t)) return t;
  try{ const b = Uint8Array.from([...t].map(c => { const n = CP1252[c] ?? c.charCodeAt(0); if (n > 255) throw 0; return n; })); return new TextDecoder("utf-8", {fatal: true}).decode(b); }catch(e){ return t; }
}
/* busca de fornecedor: sem acento, CNPJ/CPF com ou sem pontuação, todas as palavras */
const semAcento = t => fixMoji(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function buscaCasa(s, q){
  q = String(q || "").trim(); if (!q) return true; const d = q.replace(/\D/g, ""), doc = String(s.doc || "").replace(/\D/g, "");
  if (d.length >= 3 && d.length >= q.replace(/[\s.\/-]/g, "").length - 1) return doc.includes(d);
  const hay = [s.nome, s.municipio, s.uf, s.tipo, s.nivel, s.doc].map(semAcento).join(" ");
  return semAcento(q).split(/\s+/).filter(Boolean).every(w => hay.includes(w)) || (d.length >= 3 && doc.includes(d));
}
const esc = v => fixMoji(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num = v => { const n = parseFloat(String(v ?? "").replace(/\./g,"").replace(",", ".")); return isFinite(n) ? n : null; };
const fmt = (n, d=0) => n == null || !isFinite(n) ? "—" : n.toLocaleString("pt-BR",{maximumFractionDigits:d,minimumFractionDigits:d});
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const nowISO = () => new Date().toISOString();
const dt = iso => iso ? new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
function dms(v, pos, neg){ const a=Math.abs(v), d=Math.floor(a), m=Math.floor((a-d)*60), s=((a-d)*60-m)*60; return `${d}°${String(m).padStart(2,"0")}'${s.toFixed(1).padStart(4,"0")}"${v<0?neg:pos}`; }
function haversine(a,b,c,d){ const R=6371, r=Math.PI/180, x=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2; return 2*R*Math.asin(Math.sqrt(x)); }
function toast(msg){ const t=document.createElement("div"); t.className="toast"; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 2600); }
const muniOf = (name, uf) => MUNI.find(m => m[0].toLowerCase()===String(name||"").trim().toLowerCase() && (!uf || m[1]===uf));

/* ================= STORE (db compartilhado ou modo local) ================= */
const ADMINS = ["ia@kinsey.com.br", "newton.kao@kinsey.com.br"];
const PORTAL_URL = location.origin + "/portal.html";
const APP_URL = location.origin;
const COLS = ["suppliers","evidences","contracts","pareceres","config","operacoes","prospects","presenca","ativos"];
/* Extensões por segmento (ex.: cadeia do cobre): abas extras no dossiê, riscos extras e quadros na Auditoria */
const EXT_TABS = {}, EXT_RISKS = [], EXT_AUD = [], EXT_QUEST = [], EXT_DOCS = [], EXT_TOUCH = [], EXT_VIEWS = {}, EXT_EVID = [], EXT_JUR = [], EXT_INV = [], EXT_EVVIEW = [], EXT_CAD = [], EXT_ORB = [], EXT_TARGET = [];
const LV_NOME = Object.fromEntries(["N1","N2","N3"].map(l => [l, l==="N1"?"Traders":l==="N2"?"Fornecedores":"Produtores"]));
const Store = {
  mode:"local", db:null, assets:null, user:null, sample:null, me:{id:null, canEdit:true, canWrite:true},
  local:{}, listeners:{},
  loadLocal(){ try{ this.local = JSON.parse(localStorage.getItem("kinseytec-v1")) || {}; }catch(e){ this.local = {}; } COLS.forEach(c => this.local[c] ||= {}); },
  saveLocal(){ try{ localStorage.setItem("kinseytec-v1", JSON.stringify(this.local)); }catch(e){ toast("Armazenamento local cheio: remova evidências antigas."); } },
  emit(col){ const arr = Object.entries(this.local[col]).map(([id,v]) => ({id, ...v})); (this.listeners[col]||[]).forEach(f => f(arr)); },
  listen(col, cb){
    if (this.db){
      this.db.collection(col).onSnapshot(s => cb(s.docs.map(d => ({id:d.id, ...d.data()}))), e => { console.warn(col, e); if (e.code==="revoked") setMode("off"); });
    } else { (this.listeners[col] ||= []).push(cb); this.emit(col); }
  },
  async set(col, id, obj){
    if (this.db) return this.db.collection(col).doc(id).set(obj);
    this.local[col][id] = JSON.parse(JSON.stringify(obj)); this.saveLocal(); this.emit(col);
  },
  async update(col, id, patch){
    if (this.db) return this.db.collection(col).doc(id).update(patch);
    const merge = (a,b) => { for (const k in b){ if (b[k] && typeof b[k]==="object" && !Array.isArray(b[k])) { a[k] = (a[k] && typeof a[k]==="object") ? a[k] : {}; merge(a[k], b[k]); } else a[k] = b[k]; } return a; };
    this.local[col][id] = merge(this.local[col][id] || {}, JSON.parse(JSON.stringify(patch))); this.saveLocal(); this.emit(col);
  },
  async del(col, id){
    if (this.db) return this.db.collection(col).doc(id).delete();
    delete this.local[col][id]; this.saveLocal(); this.emit(col);
  },
  async upload(blob){
    if (this.assets){ const r = await this.assets.upload(blob); return {assetId:r.id, url:r.url}; }
    const url = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    return {assetId:null, url};
  }
};

const S = { suppliers:[], evidences:[], contracts:[], pareceres:{}, config:{}, operacoes:[], prospects:[], view:"orbita", sel:null, lv:{N1:true,N2:true,N3:true,rotas:true}, fLevel:"todos", fRisk:"todos", q:"", ctFilter:"pendente", evFilter:"todos", audSup:null, profiles:{} };
const supById = id => S.suppliers.find(s => s.id===id);

/* ================= INVESTIGAÇÃO DA TRADER (bases públicas e privadas) ================= */
const SIT_CNPJ = ["Ativa","Inapta","Suspensa","Baixada","Nula"];
function invRisks(s, add){
  const v = s.invest || {};
  if (v.situacao && v.situacao !== "Ativa") add("Perfil societário", `CNPJ com situação ${v.situacao} na Receita Federal`, 6);
  INV.forEach(([id, label, tipo, pts, crit]) => {
    const x = v[id]; if (!x) return;
    if (tipo === "sn" && x.v === "sim") add(crit, label + (x.n ? ` — ${x.n}` : ""), pts);
    if (tipo === "num" && num(x.v) >= 2) add(crit, `${label}: ${num(x.v)} empresa(s)` + (x.n ? ` — ${x.n}` : ""), pts);
  });
}
function invCount(s){ const v = s.invest || {}; let n = (v.situacao && v.situacao !== "Ativa") ? 1 : 0; INV.forEach(([id,,tipo]) => { const x = v[id]; if (x && ((tipo==="sn" && x.v==="sim") || (tipo==="num" && num(x.v) >= 2))) n++; }); return n; }

/* ================= RISCO (matriz slide 8) ================= */
function answersCount(s){
  const qs = (Q[s.nivel]||[]).flatMap(g => g.items); const a = s.answers || {};
  return {done: qs.filter(q => a[q[0]]?.v).length, total: qs.length};
}
function riskOf(s){
  const R = []; const add = (crit, txt, pts) => R.push({crit, txt, pts});
  const a = s.answers || {};
  (Q[s.nivel]||[]).flatMap(g => g.items).forEach(([id, t, risk, w]) => { if (risk && a[id]?.v === risk) add("Questionário", t.replace(/\?$/,"") + (risk==="sim" ? " — SIM" : " — NÃO"), w || (/MTE|menores|retenção|escravo/i.test(t) ? 5 : 2)); });
  if (s.abertura){ const yrs = (Date.now() - new Date(s.abertura)) / 3.15e10; if (yrs < 2) add("Perfil societário", `CNPJ aberto há ${fmt(yrs,1)} ano(s)`, 2); }
  if (!s.nda?.aceito) add("Cooperação / LGPD", "NDA e termo LGPD ainda não assinados", 1);
  const ac = answersCount(s); if (ac.total && ac.done/ac.total < .5) add("Cooperação", `Questionário com ${ac.done}/${ac.total} respostas`, 1);
  if (s.nivel==="N3" && !s.car) add("Origem e território", "Propriedade sem número do CAR informado", 3);
  const evs = S.evidences.filter(e => e.supplierId===s.id);
  const fotos = evs.filter(e => PHOTO_TYPES.includes(e.tipo)).length;
  if (fotos < 3) add("Existência", `Apenas ${fotos} de 3 fotos mínimas de mercadoria/galpão`, 1);
  const far = evs.filter(e => e.gps && e.distKm != null && e.distKm > 5);
  if (far.length) add("Geolocalização", `${far.length} foto(s) tiradas a mais de 5 km do local declarado (máx. ${fmt(Math.max(...far.map(e=>e.distKm)))} km)`, 2);
  const b = s.balanco || {}; const ei=num(b.ei), c=num(b.compras), v=num(b.vendas), ef=num(b.ef);
  if ([ei,c,v,ef].every(x => x!=null)){ const calc = ei + c - v, dif = ef - calc, base = Math.max(c, 1); if (Math.abs(dif)/base > .05) add("Coerência operacional", `Balanço de massa não fecha: diferença de ${fmt(dif,1)} t (${fmt(dif/base*100,1)}% das compras)`, 3); }
  if (s.nivel==="N3"){ const area=num(s.areaHa), vol=num(s.volume), ref=PROD_REF[s.uf]||500; if (area && vol){ const kg = vol*1000, max = area*ref; if (kg > max*1.5) add("Origem e território", `Volume vendido (${fmt(kg)} kg) acima de 1,5× a capacidade da área (${fmt(max)} kg a ${ref} kg/ha)`, 3); } }
  const cot = cotRef(s.uf);
  if (cot) S.contracts.filter(k => k.supplierId===s.id && num(k.preco)).forEach(k => { const d = (num(k.preco)-cot)/cot; if (d < -.2) add("Preços e pagamentos", `Contrato ${k.numero||""} com preço ${fmt(d*100)}% abaixo da cotação de referência`, 2); });
  S.contracts.filter(k => k.supplierId===s.id && S.pareceres[k.id]?.status==="reprovado").forEach(k => add("Contratual", `Contrato ${k.numero||""} reprovado pelo Jurídico`, 3));
  invRisks(s, add);
  EXT_RISKS.forEach(f => f(s, add));
  const score = R.reduce((t,r) => t + r.pts, 0);
  const touched = ac.done > 0 || evs.length > 0 || s.nda?.aceito || (s.invest && Object.keys(s.invest).length > 0) || EXT_TOUCH.some(f => f(s));
  const auto = !touched ? "pend" : score >= 6 ? "alto" : score >= 3 ? "medio" : "baixo";
  const man = s.classificacao?.nivel;
  return {score, level: man || auto, auto, manual: man ? s.classificacao : null, reasons:R};
}
function cotRef(uf){ const p = S.config.precos?.br || {}; const v = num(p[uf]?.valor); return v || num(S.config.geral?.cotacao) || null; }
const RISK_LABEL = {alto:"Alto risco", medio:"Médio risco", baixo:"Baixo risco", pend:"Em avaliação"};
const riskPill = r => `<span class="pill r-${r.level}">${RISK_LABEL[r.level]}</span>`;
/* Motivo resumido da classificação */
function riskWhy(s){
  const r = riskOf(s), top = r.reasons.slice().sort((a,b) => b.pts - a.pts);
  if (r.manual){
    const t = {alto:"ALTO",medio:"MÉDIO",baixo:"BAIXO"}[r.level];
    return {level:r.level, title:`Por que ${t} risco · classificação do analista`, items:[`Justificativa: ${r.manual.motivo}`, ...top.slice(0,2).map(x => `${x.crit}: ${x.txt.replace(/ — .*$/,"").slice(0,90)}`)], more:Math.max(0, top.length-2), score:r.score};
  }
  const short = t => t.replace(/ — .*$/,"").replace(/\s*\(.*?\)/g,"").slice(0,90);
  if (r.level === "alto" || r.level === "medio"){
    return {level:r.level, title:`Por que ${r.level==="alto" ? "ALTO" : "MÉDIO"} risco`, items: top.slice(0,3).map(x => `${x.crit}: ${short(x.txt)}`), more: Math.max(0, top.length-3), score:r.score};
  }
  if (r.level === "baixo"){
    const ac = answersCount(s), fotos = S.evidences.filter(e => e.supplierId===s.id && PHOTO_TYPES.includes(e.tipo)).length, pos = [];
    if (s.invest?.situacao === "Ativa") pos.push("CNPJ ativo na Receita Federal");
    if (s.invest && Object.keys(s.invest).length && invCount(s) === 0) pos.push("Sem alertas na investigação (dívidas, processos, sócios)");
    if (s.nda?.aceito) pos.push("NDA e termo LGPD assinados");
    if (ac.total && ac.done/ac.total >= .8) pos.push(`Questionário ${ac.done}/${ac.total} sem respostas de risco relevantes`);
    if (fotos >= 3) pos.push(`${fotos} fotos de evidência no local`);
    const b = s.balanco || {}; if (["ei","compras","vendas","ef"].every(k => num(b[k]) != null)) pos.push("Balanço de massa conferido");
    if (!pos.length) pos.push("Nenhum indicador de risco relevante até agora");
    return {level:"baixo", title:"Por que BAIXO risco", items: pos.slice(0,4), more:0, score:r.score, minor: top.slice(0,2).map(x => short(x.txt))};
  }
  return {level:"pend", title:"Em avaliação", items:["Ainda faltam respostas, investigação ou evidências para classificar"], more:0, score:r.score};
}
function whyBox(s, compact){
  const w = riskWhy(s);
  return `<div class="why why-${w.level}"><b>${w.title}</b>${compact ? "" : ` <span class="mono" style="color:var(--muted);font-size:11px">pontuação ${w.score}</span>`}<ul>${w.items.map(i => `<li>${esc(i)}</li>`).join("")}${w.more ? `<li style="color:var(--muted)">+ ${w.more} outro(s) fator(es) na aba Risco</li>` : ""}</ul>${w.minor && w.minor.length && !compact ? `<div style="font-size:11.5px;color:var(--muted)">Pontos de atenção menores: ${esc(w.minor.join("; "))}</div>` : ""}</div>`;
}
const RCOL = {alto:"#FF6B6B", medio:"#F2B33D", baixo:"#36D399", pend:"#93A3BC"};

/* ================= GLOBO ================= */
const G = {};
function initGlobe(){
  const world = JSON.parse($("#geo-world").textContent), bra = JSON.parse($("#geo-bra").textContent);
  G.countries = topojson.feature(world, world.objects.countries).features;
  G.brazil = G.countries.find(f => f.id === "076");
  G.states = topojson.feature(bra, bra.objects.bra).features;
  G.stateMesh = topojson.mesh(bra, bra.objects.bra, (a,b) => a !== b);
  G.grat = d3.geoGraticule10();
  G.canvas = $("#globe"); G.ctx = G.canvas.getContext("2d");
  G.proj = d3.geoOrthographic().clipAngle(90).precision(.4);
  G.path = d3.geoPath(G.proj, G.ctx);
  const H0 = window.ORB_HOME || [-52, -12, 1]; G.rot = [-H0[0], -H0[1], 0]; G.k = H0[2]; G.t0 = performance.now();
  G.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seed = 7; const rnd = () => (seed = (seed*16807) % 2147483647) / 2147483647;
  G.stars = Array.from({length:240}, () => ({x:rnd(), y:rnd(), r:rnd()*1.2+.2, a:rnd()*.6+.2, p:rnd()*6}));
  resizeGlobe(); new ResizeObserver(resizeGlobe).observe(G.canvas);
  bindGlobe(); requestAnimationFrame(loop);
}
function resizeGlobe(){
  const r = G.canvas.getBoundingClientRect(); if (!r.width) return;
  G.dpr = Math.min(devicePixelRatio || 1, 2); G.w = r.width; G.h = r.height;
  G.canvas.width = r.width*G.dpr; G.canvas.height = r.height*G.dpr;
  G.base = Math.min(G.w, G.h) * .40; G.dirty = true;
}
const cy = () => G.h * (G.w < 700 ? .40 : .46);
function bindGlobe(){
  const pts = new Map(); let moved = 0, pinch0 = null;
  G.canvas.addEventListener("pointerdown", e => { G.canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); moved = 0; G.anim = null; G.idle = false; if (pts.size===2){ const [a,b] = [...pts.values()]; pinch0 = {d:Math.hypot(a.x-b.x,a.y-b.y), k:G.k}; } });
  G.canvas.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return; const p = pts.get(e.pointerId), dx = e.clientX-p.x, dy = e.clientY-p.y; p.x = e.clientX; p.y = e.clientY; moved += Math.abs(dx)+Math.abs(dy);
    if (pts.size===1){ const f = .28 / G.k; G.rot[0] += dx*f; G.rot[1] = Math.max(-85, Math.min(85, G.rot[1] - dy*f)); }
    else if (pts.size===2 && pinch0){ const [a,b] = [...pts.values()]; G.k = clampK(pinch0.k * Math.hypot(a.x-b.x,a.y-b.y) / pinch0.d); }
    G.dirty = true;
  });
  const up = e => { const was = pts.size; pts.delete(e.pointerId); if (pts.size < 2) pinch0 = null; if (was===1 && moved < 8 && e.type==="pointerup") tapAt(e); };
  G.canvas.addEventListener("pointerup", up); G.canvas.addEventListener("pointercancel", up);
  G.canvas.addEventListener("wheel", e => { e.preventDefault(); G.anim = null; G.k = clampK(G.k * Math.exp(-e.deltaY*.0016)); G.dirty = true; }, {passive:false});
  $("#z-in").onclick = () => flyTo(null, null, G.k*2);
  $("#z-out").onclick = () => flyTo(null, null, G.k/2);
  $("#z-home").onclick = () => { selectSup(null); flyTo(...(window.ORB_HOME || [-50, -12, 1])); };
  $$(".lvl button").forEach(b => b.onclick = () => { S.lv[b.dataset.lv] = !S.lv[b.dataset.lv]; b.setAttribute("aria-pressed", S.lv[b.dataset.lv]); G.dirty = true; renderStrip(); });
}
const clampK = k => Math.max(.7, Math.min(70, k));
function tapAt(e){
  const r = G.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  let best = null, bd = 22;
  (G.hits||[]).forEach(h => { const d = Math.hypot(h.x-x, h.y-y); if (d < bd){ bd = d; best = h; } });
  if (best) selectSup(best.id, true);
}
function flyTo(lng, lat, k, dur=1500){
  if (!G.proj || !G.rot) return;
  const r0 = G.rot.slice(), k0 = G.k;
  const r1 = lng == null ? r0 : [-lng, -lat, 0];
  while (r1[0] - r0[0] > 180) r1[0] -= 360; while (r1[0] - r0[0] < -180) r1[0] += 360;
  const k1 = clampK(k), dist = Math.hypot(r1[0]-r0[0], r1[1]-r0[1]);
  const dip = lng != null && dist > 8 ? Math.min(k0, k1, 1.2) : null;
  if (G.reduce) dur = 1;
  G.anim = {t0:performance.now(), dur, f:t => {
    const e = d3.easeCubicInOut(t);
    G.rot = [r0[0]+(r1[0]-r0[0])*e, r0[1]+(r1[1]-r0[1])*e, 0];
    if (dip){ const m = t < .5 ? Math.exp(Math.log(k0)+(Math.log(dip)-Math.log(k0))*d3.easeCubicOut(t*2)) : Math.exp(Math.log(dip)+(Math.log(k1)-Math.log(dip))*d3.easeCubicIn((t-.5)*2)); G.k = m; }
    else G.k = Math.exp(Math.log(k0)+(Math.log(k1)-Math.log(k0))*e);
  }, done:() => { if (lng != null && S.sel) { G.ping = performance.now(); $("#h-lock").innerHTML = "<b style='color:var(--glow)'>ALVO TRAVADO</b>"; } }};
  G.idle = false;
}
function visible(lng, lat){ const c = G.proj.invert([G.w/2, cy()]); return c && d3.geoDistance([lng,lat], c) < Math.PI/2 - .02; }
function loop(now){
  if (G.anim){ const t = Math.min(1, (now - G.anim.t0)/G.anim.dur); G.anim.f(t); G.dirty = true; if (t >= 1){ const d = G.anim.done; G.anim = null; d && d(); } }
  else if (G.idle && !G.reduce && S.view==="orbita"){ G.rot[0] += .03; G.dirty = true; }
  if (S.view==="orbita" && (G.dirty || !G.reduce)) draw(now);
  requestAnimationFrame(loop);
}
function draw(now){
  const {ctx, w, h, dpr} = G; if (!w) return; G.dirty = false;
  const R = G.base * G.k, cx = w/2, cyy = cy();
  G.proj.scale(R).translate([cx, cyy]).rotate(G.rot);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  // espaço
  const bg = ctx.createRadialGradient(cx, cyy, 0, cx, cyy, Math.max(w,h));
  bg.addColorStop(0, "#03163a"); bg.addColorStop(1, "#000814"); ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);
  const tw = now/1000;
  G.stars.forEach(s => { const x = ((s.x*w + G.rot[0]*0.4) % w + w) % w, y = ((s.y*h - G.rot[1]*0.4) % h + h) % h; ctx.globalAlpha = s.a * (G.reduce ? 1 : .75 + .25*Math.sin(tw*1.3 + s.p)); ctx.fillStyle = "#cfe3ff"; ctx.fillRect(x, y, s.r, s.r); });
  ctx.globalAlpha = 1;
  // atmosfera
  if (R < Math.max(w,h)*1.4){ const at = ctx.createRadialGradient(cx, cyy, R*.92, cx, cyy, R*1.22); at.addColorStop(0, "rgba(79,176,245,.55)"); at.addColorStop(.25, "rgba(4,115,195,.22)"); at.addColorStop(1, "rgba(4,115,195,0)"); ctx.fillStyle = at; ctx.beginPath(); ctx.arc(cx, cyy, R*1.22, 0, 7); ctx.fill(); }
  // oceano
  const oc = ctx.createRadialGradient(cx - R*.35, cyy - R*.4, R*.1, cx, cyy, R);
  oc.addColorStop(0, "#0b3d7e"); oc.addColorStop(.7, "#05224f"); oc.addColorStop(1, "#021433");
  ctx.beginPath(); G.path({type:"Sphere"}); ctx.fillStyle = oc; ctx.fill();
  ctx.beginPath(); G.path(G.grat); ctx.strokeStyle = "rgba(120,180,255,.10)"; ctx.lineWidth = .7; ctx.stroke();
  // terra
  ctx.beginPath(); G.countries.forEach(f => { if (f !== G.brazil) G.path(f); }); ctx.fillStyle = "#123f73"; ctx.fill(); ctx.strokeStyle = "rgba(160,200,255,.22)"; ctx.lineWidth = .6; ctx.stroke();
  ctx.save(); ctx.shadowColor = "rgba(79,176,245,.8)"; ctx.shadowBlur = 14; ctx.beginPath(); G.path(G.brazil); ctx.fillStyle = "#16589c"; ctx.fill(); ctx.restore();
  ctx.beginPath(); G.path(G.brazil); ctx.strokeStyle = "rgba(170,215,255,.85)"; ctx.lineWidth = 1.1; ctx.stroke();
  if (G.k > 1.8){
    ctx.beginPath(); G.path(G.stateMesh); ctx.strokeStyle = `rgba(170,215,255,${Math.min(.55,(G.k-1.8)*.3)})`; ctx.lineWidth = .8; ctx.stroke();
    ctx.font = `600 ${G.k > 6 ? 12 : 10}px Montserrat, Arial, sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,225,255,.55)";
    G.states.forEach(f => { const c = d3.geoCentroid(f); if (!visible(c[0], c[1])) return; const p = G.proj(c); const uf = (f.id||"").split(".")[1] || ""; ctx.fillText(G.k > 6 ? f.properties.name.toUpperCase() : uf, p[0], p[1]); });
  }
  // grade de escala ao aproximar (efeito "satélite")
  if (G.k > 8){ ctx.strokeStyle = "rgba(79,176,245,.07)"; ctx.lineWidth = 1; const step = 48; ctx.beginPath(); for (let x = (cx % step); x < w; x += step){ ctx.moveTo(x,0); ctx.lineTo(x,h); } for (let y = (cyy % step); y < h; y += step){ ctx.moveTo(0,y); ctx.lineTo(w,y); } ctx.stroke(); }
  // rotas N3 → N2 → N1 → cliente
  const list = S.suppliers.filter(s => s.lat != null && S.lv[s.nivel] && (!window.ORB_FILTRO || window.ORB_FILTRO(s)));
  if (S.lv.rotas){
    ctx.lineWidth = 1.4; ctx.setLineDash([5, 6]); ctx.lineDashOffset = G.reduce ? 0 : -now/60;
    list.forEach(s => {
      const par = s.parentId ? supById(s.parentId) : null;
      const to = par && par.lat != null ? [par.lng, par.lat] : (s.nivel==="N1" && !window.ORB_SEM_CLIENTE ? [CLI().lng, CLI().lat] : null);
      if (!to) return;
      ctx.beginPath(); G.path({type:"LineString", coordinates:[[s.lng, s.lat], to]});
      ctx.strokeStyle = S.sel && (S.sel===s.id || S.sel===s.parentId) ? "rgba(140,210,255,.95)" : "rgba(79,176,245,.45)"; ctx.stroke();
    });
    ctx.setLineDash([]);
  }
  EXT_ORB.forEach(f => { try{ f(ctx, now, list); }catch(e){} });
  // cliente contratante
  G.hits = [];
  const CL = CLI(); if (!window.ORB_SEM_CLIENTE && visible(CL.lng, CL.lat)){ const p = G.proj([CL.lng, CL.lat]); ctx.strokeStyle = "#E6E8EC"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7); ctx.stroke(); ctx.fillStyle = "#E6E8EC"; ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 7); ctx.fill(); if (G.k > 2.5){ ctx.font = "500 10px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.fillText(`${CL.nome} · ${CL.local}`.toUpperCase().slice(0,40), p[0]+11, p[1]+3); } }
  // pinos
  const rotulos = [];
  list.forEach(s => {
    if (!visible(s.lng, s.lat)) return; const [x, y] = G.proj([s.lng, s.lat]); const r = riskOf(s), col = (window.ORB_COR && window.ORB_COR(s)) || RCOL[r.level], sz = s.nivel==="N1" ? 7 : s.nivel==="N2" ? 5.5 : 4.5;
    ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 12; ctx.fillStyle = col; ctx.strokeStyle = "#000a1c"; ctx.lineWidth = 1.2; ctx.beginPath();
    if (s.nivel==="N1"){ ctx.moveTo(x, y-sz); ctx.lineTo(x+sz, y); ctx.lineTo(x, y+sz); ctx.lineTo(x-sz, y); ctx.closePath(); }
    else if (s.nivel==="N2") ctx.rect(x-sz, y-sz, sz*2, sz*2); else ctx.arc(x, y, sz, 0, 7);
    ctx.fill(); ctx.restore(); ctx.stroke();
    G.hits.push({id:s.id, x, y});
    if (G.k > 7 && S.sel !== s.id){ const txt = window.ORB_ROTULO ? window.ORB_ROTULO(s) : `${s.nivel} ${(s.nome||"").slice(0,22)}`, bw = txt.length * 6.2;
      if (!rotulos.some(b => x + 10 < b[0] + b[2] && b[0] < x + 10 + bw && Math.abs(b[1] - y) < 13)){ rotulos.push([x + 10, y, bw]); ctx.font = "500 10px 'IBM Plex Mono', monospace"; ctx.textAlign = "left"; ctx.fillStyle = "rgba(230,232,236,.8)"; ctx.fillText(txt, x+10, y+3); } }
  });
  // fotos geolocalizadas do alvo
  if (S.sel){
    S.evidences.filter(e => e.supplierId===S.sel && e.gps).forEach(e => { if (!visible(e.gps.lng, e.gps.lat)) return; const [x,y] = G.proj([e.gps.lng, e.gps.lat]); ctx.strokeStyle = e.distKm > 5 ? "#FF6B6B" : "#E6E8EC"; ctx.lineWidth = 1.2; ctx.strokeRect(x-4, y-3, 8, 6); });
  }
  // retícula do alvo
  const sel = S.sel && supById(S.sel);
  if (sel && sel.lat != null && visible(sel.lng, sel.lat)){
    const [x, y] = G.proj([sel.lng, sel.lat]); const s = 22, g = 7, rot = G.reduce ? 0 : now/1400;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = "#8fd0ff"; ctx.lineWidth = 1.6;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([a,b]) => { ctx.beginPath(); ctx.moveTo(a*s, b*(s-g)); ctx.lineTo(a*s, b*s); ctx.lineTo(a*(s-g), b*s); ctx.stroke(); });
    ctx.restore();
    ctx.strokeStyle = "rgba(143,208,255,.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x - s - 4, y); ctx.moveTo(x + s + 4, y); ctx.lineTo(x + 40, y); ctx.stroke();
    if (G.ping){ const t = (now - G.ping)/1400; if (t < 1){ ctx.strokeStyle = `rgba(143,208,255,${1-t})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10 + t*70, 0, 7); ctx.stroke(); } }
    ctx.font = "600 11px 'IBM Plex Mono', monospace"; ctx.fillStyle = "#E6E8EC"; ctx.textAlign = "left";
    ctx.fillText(`${(sel.municipio||"").toUpperCase()} · ${sel.uf||""}`, x + s + 8, y - s + 4);
  }
  // HUD
  $("#h-alt").textContent = `${fmt(12000 / G.k)} km`;
  const c = G.proj.invert([cx, cyy]); if (c) $("#h-ctr").textContent = `${c[1].toFixed(2)}°, ${c[0].toFixed(2)}°`;
}

/* ================= ÓRBITA: UI ================= */
function selectSup(id, fly){
  S.sel = id; G.dirty = true; renderTarget(); renderStrip();
  if (!id){ $("#h-lock").textContent = "VARREDURA"; return; }
  $("#h-lock").textContent = "APROXIMANDO…";
  const s = supById(id); if (fly && s?.lat != null) flyTo(s.lng, s.lat, s.nivel==="N3" ? 9 : 5.5);
}
function renderStrip(){
  const list = S.suppliers.filter(s => S.lv[s.nivel] && (!window.ORB_FILTRO || window.ORB_FILTRO(s))).sort((a,b) => a.nivel.localeCompare(b.nivel) || (a.nome||"").localeCompare(b.nome||""));
  $("#h-n").textContent = S.suppliers.length;
  $("#h-hi").textContent = S.suppliers.filter(s => riskOf(s).level==="alto").length;
  $("#strip").innerHTML = list.length ? list.map(s => { const r = riskOf(s); return `<button type="button" class="chip" data-sel="${s.id}" aria-pressed="${S.sel===s.id}"><span style="color:${(window.ORB_COR && window.ORB_COR(s)) || RCOL[r.level]}">${s.nivel==="N1"?"◆":s.nivel==="N2"?"■":"●"}</span>${esc(window.ORB_ROTULO ? window.ORB_ROTULO(s) : (s.nome||"").slice(0,30))}<span class="lv">${esc(s.uf||s.pais||"")}</span></button>`; }).join("")
    : `<button type="button" class="chip" data-go-to="cadeia">+ Cadastrar o primeiro fornecedor</button>`;
  $$("#strip [data-sel]").forEach(b => b.onclick = () => selectSup(b.dataset.sel, true));
  $$("#strip [data-go-to]").forEach(b => b.onclick = () => { go("cadeia"); openSupplierForm(); });
}
function renderTarget(){
  const el = $("#target"), s = S.sel && supById(S.sel);
  if (!s){ el.hidden = true; return; }
  const r = riskOf(s), fotos = S.evidences.filter(e => e.supplierId===s.id && e.url && /^image\//.test(e.mime||"image/"));
  const par = s.parentId && supById(s.parentId);
  el.hidden = false;
  el.innerHTML = `
    <div style="min-width:0">
      <div class="loc">${esc(s.pais||"Brasil")} · ${esc(s.uf||"—")} · ${esc(s.municipio||"—")}</div>
      <h3>${esc(s.nome)}</h3>
      <div class="coords">${s.lat!=null ? `${dms(s.lat,"N","S")} ${dms(s.lng,"L","O")}` : "sem coordenadas"} · ${esc(s.tipo||s.nivel)}${par ? ` · fornece a ${esc(par.nome)}` : s.nivel==="N1" ? " · fornece ao cliente" : ""}</div>
    </div>
    <div class="side" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px"><span class="lvtag">${s.nivel}</span>${riskPill(r)}</div>
    <div style="grid-column:1/-1">${whyBox(s, true)}</div>
    <div class="photos">${fotos.length ? fotos.slice(0,8).map(e => `<img src="${esc(e.url)}" alt="${esc(e.tipo)}" data-lb="${esc(e.url)}">`).join("") : `<span class="nophoto">Nenhuma foto no local ainda. Capture em Evidências.</span>`}</div>
    <div class="acts">
      <button type="button" class="btn sm primary" data-open="${s.id}">Abrir dossiê</button>
      ${s.lat!=null || enderecoForn(s) ? `<a class="btn sm" href="${mapaSat(s.lat, s.lng, 600, enderecoForn(s))}" target="_blank" rel="noopener" title="${esc(enderecoForn(s) || "coordenadas " + s.lat + ", " + s.lng)}">Satélite ↗</a><a class="btn sm" href="${mapa3D(s.lat, s.lng, enderecoForn(s))}" target="_blank" rel="noopener">Google Earth 3D ↗</a>` : ""}
    </div><button type="button" class="xs" data-close-target aria-label="Fechar alvo">×</button>`;
  el.querySelector("[data-open]").onclick = () => openSupplier(s.id);
  el.querySelector("[data-close-target]").onclick = () => selectSup(null);
  $$("[data-lb]", el).forEach(i => i.onclick = () => lightbox(i.dataset.lb));
  EXT_TARGET.forEach(f => f(s, el));
}
function lightbox(url){ const d = document.createElement("div"); d.className = "lightbox"; d.innerHTML = `<img src="${esc(url)}" alt="Evidência">`; d.onclick = () => d.remove(); document.body.appendChild(d); }

/* ================= COTAÇÕES DO CACAU ================= */
const ageH = iso => iso ? (Date.now() - new Date(iso)) / 36e5 : Infinity;
const fmtBR = v => num(v) != null ? "R$ " + fmt(num(v), 2) : "—";
function renderPriceBar(){
  const p = S.config.precos || {}, br = p.br || {};
  const shown = PRECO.bar.filter(k => br[k]?.valor);
  const el = $("#pricebar"); if (!el) return;
  const last = p.atualizadoEm; const old = ageH(last) > 24;
  el.innerHTML = shown.length ? `<span class="lab"><i class="${old ? "old" : ""}"></i>Cacau<span class="hide-sm">&nbsp;Brasil</span></span>${shown.map((k,i) => `<span class="px ${i>1?"hide-sm":""}"><span>${PRECO.barLabel[k]||k}</span><b>${fmtBR(br[k].valor)}</b>/@</span>`).join("")}<span class="px hide-sm" style="color:var(--muted)">${last ? "atualizado " + dt(last) : ""}</span><span class="more">Cotações ›</span>`
    : `<span class="lab"><i class="old"></i>Cacau Brasil</span><span class="px" style="color:var(--muted)">Cotação ainda não registrada</span><span class="more">Registrar ›</span>`;
}
function openPrices(){
  const p = S.config.precos || {}, br = p.br || {}, it = p.intl || {}, hist = (p.hist || []).slice(-30).reverse();
  const canEdit = Store.me.canWrite !== false;
  sheet(`<div class="sheet-h"><div><div class="eyebrow">Anexo · consulta de preços</div><h2>Cotações do cacau</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="sheet-b">
      <div class="banner">Preços do mercado físico em <b>R$ por arroba (15 kg)</b>. Todos que usam o app veem cada atualização na hora. ${p.atualizadoEm ? `Última atualização: <b>${dt(p.atualizadoEm)}</b>.` : ""} ${ageH(p.atualizadoEm) > 24 ? `<b style="color:var(--warn)">Cotação com mais de 24 h: confirme na fonte antes de comparar contratos.</b>` : ""}</div>
      <div><div class="eyebrow" style="margin-bottom:8px">Brasil · em evidência</div><div class="bigprice">${PRACAS_BR.filter(([k]) => br[k]?.valor).map(([k,l]) => `<div class="stat"><div class="n">${fmtBR(br[k].valor)}</div><div class="l">${l} · /@</div><div style="font-size:11px;color:var(--muted);margin-top:4px">${esc(br[k].data||"")} ${br[k].fonte ? "· "+esc(br[k].fonte) : ""}</div></div>`).join("") || `<div class="empty">Nenhuma cotação registrada.</div>`}</div></div>
      <div><div class="eyebrow" style="margin-bottom:8px">Bolsas internacionais</div>
        <table class="ptable"><thead><tr><th>Mercado</th><th>Preço</th><th>Data / fonte</th></tr></thead><tbody>${INTL.map(([k,l,u]) => `<tr><td>${l}</td><td class="v">${it[k]?.valor ? esc(it[k].valor)+" "+u : "—"}</td><td style="color:var(--muted);font-size:12px">${esc(it[k]?.data||"")} ${esc(it[k]?.fonte||"")}</td></tr>`).join("")}</tbody></table></div>
      ${canEdit ? `<form id="fpx" class="card" style="display:flex;flex-direction:column;gap:12px" novalidate><h3>Atualizar cotação</h3>
        <div class="form">${PRACAS_BR.map(([k,l]) => `<div class="fld"><label for="px-${k}">${l} (R$/@)</label><input id="px-${k}" inputmode="decimal" value="${esc(br[k]?.valor||"")}"></div>`).join("")}
        ${INTL.map(([k,l,u]) => `<div class="fld"><label for="pi-${k}">${l} (${u})</label><input id="pi-${k}" inputmode="decimal" value="${esc(it[k]?.valor||"")}"></div>`).join("")}
        <div class="fld"><label for="px-data">Data da cotação</label><input id="px-data" value="${esc(new Date().toLocaleDateString("pt-BR"))}"></div><div class="fld"><label for="px-fonte">Fonte</label><input id="px-fonte" placeholder="ex.: ${PRECO.fonteEx}" value="${esc(p.fonte||"")}"></div></div>
        <button type="submit" class="btn primary" style="align-self:flex-start">Salvar cotação</button></form>` : ""}
      <div><div class="eyebrow" style="margin-bottom:8px">Histórico (últimas 30 atualizações)</div><div class="tbl"><table class="ptable"><thead><tr><th>Quando</th>${PRECO.hist.map(([k,l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${hist.map(h => `<tr><td style="font-size:12px">${dt(h.em)}</td>${PRECO.hist.map(([k]) => `<td class="v">${h[k]||"—"}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="6" style="color:var(--muted)">Sem histórico.</td></tr>`}</tbody></table></div></div>
      <div><div class="eyebrow" style="margin-bottom:8px">Fontes para consulta</div><div style="display:flex;gap:8px;flex-wrap:wrap">
        ${PRECO.links.map(([l,u]) => `<a class="btn sm" href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join("")}</div></div>
    </div>`);
  const f = $("#fpx"); if (!f) return;
  f.onsubmit = async e => { e.preventDefault();
    const nb = {}, ni = {}, h = {em:nowISO()}; const data = $("#px-data").value.trim(), fonte = $("#px-fonte").value.trim();
    PRACAS_BR.forEach(([k]) => { const v = $("#px-"+k).value.trim(); if (v){ nb[k] = {valor:v, data, fonte}; h[k] = v; } });
    INTL.forEach(([k]) => { const v = $("#pi-"+k).value.trim(); if (v){ ni[k] = {valor:v, data, fonte}; h[k] = v; } });
    const body = {br:{...(S.config.precos?.br||{}), ...nb}, intl:{...(S.config.precos?.intl||{}), ...ni}, hist:[...((S.config.precos?.hist)||[]), h].slice(-200), fonte, atualizadoEm:nowISO()};
    save(Store.set("config","precos", body)).then(() => { toast("Cotação atualizada para toda a equipe"); openPrices(); });
  };
}

/* ================= NAV ================= */
function go(v){
  S.view = v; $$("main .view").forEach(s => s.hidden = s.dataset.view !== v);
  $$("nav.tabs button").forEach(b => b.dataset.go===v ? b.setAttribute("aria-current","page") : b.removeAttribute("aria-current"));
  if (v==="orbita"){ G.dirty = true; resizeGlobe(); }
  renderView();
  try{ history.replaceState(null, "", v==="orbita" ? location.pathname : "#"+v); }catch(e){}
}
function renderView(){ ({cadeia:renderCadeia, auditoria:renderAuditoria, juridico:renderJuridico, evidencias:renderEvidencias}[S.view] || EXT_VIEWS[S.view] || (()=>{}))(); }
function renderAll(){ renderStrip(); renderTarget(); renderView(); renderPriceBar(); G.dirty = true; if (window.KT_FB && KT_FB.cliChip) KT_FB.cliChip();
  const pend = S.contracts.filter(k => !S.pareceres[k.id]).length + S.suppliers.filter(s => s.nda?.aceito && !s.nda?.validado).length + (typeof DOCAN !== "undefined" ? DOCAN.pendentes() : 0);
  const b = $("#b-jur"); b.hidden = !pend; b.textContent = pend;
  if (S.openSup && $("#layer").innerHTML) refreshSupplierSheet();
}

/* ================= CADEIA ================= */
function renderCadeia(){
  const all = S.suppliers, cnt = l => all.filter(s => s.nivel===l).length, hi = all.filter(s => riskOf(s).level==="alto").length;
  const match = s => (S.fLevel==="todos" || s.nivel===S.fLevel) && (S.fRisk==="todos" || riskOf(s).level===S.fRisk) && buscaCasa(s, S.q);
  const filtering = S.fLevel!=="todos" || S.fRisk!=="todos" || S.q;
  const node = s => {
    const r = riskOf(s), ac = answersCount(s), kids = all.filter(k => k.parentId===s.id).sort((a,b)=>(a.nome||"").localeCompare(b.nome||""));
    return `<div class="node"><div class="row" data-open="${s.id}"><span class="lvtag">${s.nivel}</span><div style="min-width:0"><div class="nm">${esc(s.nome)}</div><div class="meta"><span class="mono">${esc(s.doc||"sem CNPJ/CPF")}</span><span>${esc(s.municipio||"—")}/${esc(s.uf||"—")}</span>${s.nda?.aceito ? "<span>NDA ✓</span>" : "<span style='color:var(--warn)'>NDA pendente</span>"}</div></div>
      <div class="right"><div class="prog" title="Questionário ${ac.done}/${ac.total}"><i style="width:${ac.total?ac.done/ac.total*100:0}%"></i></div>${riskPill(r)}</div></div>
      ${!filtering && kids.length ? `<div class="kids">${kids.map(node).join("")}</div>` : ""}</div>`;
  };
  const roots = filtering ? all.filter(match) : all.filter(s => s.nivel==="N1" || !supById(s.parentId));
  const RORD = {alto:0, medio:1, baixo:2, pend:3};
  const key = {nivel:s => s.nivel, nome:s => (s.nome||"").toLowerCase(), uf:s => (s.uf||"")+(s.municipio||""), risco:s => RORD[riskOf(s).level]*1000 - riskOf(s).score, score:s => -riskOf(s).score, par:s => (s.parentId ? supById(s.parentId)?.nome||"" : CLI().nome)};
  const so = S.sort || {k:"risco", d:1};
  const listRows = all.filter(match).sort((a,b) => { const x = key[so.k](a), y = key[so.k](b); return (x < y ? -1 : x > y ? 1 : 0) * so.d; });
  const th = (k, l) => `<th><button type="button" class="sortb" data-sort="${k}">${l}${so.k===k ? (so.d>0 ? " ▲" : " ▼") : ""}</button></th>`;
  const listHtml = `<div class="card tbl" style="padding:6px 8px"><table class="blist"><thead><tr>${th("nivel","Nível")}${th("nome","Fornecedor")}${th("uf","Local")}${th("par","Vende para")}${th("risco","Risco")}${th("score","Pontos")}<th>Principal motivo</th><th>Classificar</th></tr></thead><tbody>
    ${filtering ? "" : `<tr class="root"><td><span class="lvtag" style="color:var(--fog)">N0</span></td><td colspan="7"><b>${esc(CLI().nome)}</b> · contratante · ${esc(CLI().local)} <span style="color:var(--muted)">— ponto de referência da cadeia</span></td></tr>`}
    ${listRows.map(s => { const r = riskOf(s), par = s.parentId ? supById(s.parentId) : null;
      return `<tr data-open="${s.id}"><td><span class="lvtag">${s.nivel}</span></td><td style="min-width:150px"><b style="font-weight:600">${esc(s.nome)}</b><div class="mono" style="font-size:11px;color:var(--muted)">${esc(s.doc||"")}</div></td><td>${esc(s.municipio||"—")}/${esc(s.uf||"—")}</td><td style="font-size:12px">${par ? esc(par.nome) : s.nivel==="N1" ? esc(CLI().nome) : "—"}</td><td>${riskPill(r)}${r.manual ? `<div style="font-size:10.5px;color:var(--muted);margin-top:3px">analista</div>` : ""}</td><td class="mono">${r.score}</td><td style="min-width:170px;font-size:12px"><span title="${esc(riskWhy(s).items[0]||"")}" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(riskWhy(s).items[0]||"")}</span></td>
        <td style="width:1%"><select class="qcls" style="max-width:118px" data-qc="${s.id}" aria-label="Classificar ${esc(s.nome)}"><option value="">Automático</option>${["alto","medio","baixo"].map(l => `<option value="${l}" ${r.manual?.nivel===l?"selected":""}>${RISK_LABEL[l]}</option>`).join("")}</select></td></tr>`; }).join("") || `<tr><td colspan="8" style="color:var(--muted);padding:16px 8px">Nenhum fornecedor com esses filtros.</td></tr>`}</tbody></table></div>`;
  $("#cadeia").innerHTML = `
    <div class="head"><div><div class="eyebrow">Mapeamento da cadeia</div><h2>Fornecedores N1 → N2 → N3</h2><p class="sub">Traders que vendem ao cliente contratante (N1), seus fornecedores (N2) e os produtores na origem (N3).</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="imp-ficha"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6"/></svg>Importar ficha do fornecedor</button><button type="button" class="btn" id="imp-sup"><svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>Importar fornecedores</button><button type="button" class="btn primary" id="add-sup"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Cadastrar fornecedor</button></div></div>
    <div class="stats"><div class="stat"><div class="n">${cnt("N1")}</div><div class="l">N1 · Traders</div></div><div class="stat"><div class="n">${cnt("N2")}</div><div class="l">N2 · Fornecedores</div></div><div class="stat"><div class="n">${cnt("N3")}</div><div class="l">N3 · Produtores</div></div><div class="stat"><div class="n" style="color:var(--bad)">${hi}</div><div class="l">Alto risco</div></div></div>
    <div class="filters">
      ${["todos","N1","N2","N3"].map(l => `<button type="button" class="fbtn" data-fl="${l}" aria-pressed="${S.fLevel===l}">${l==="todos"?"Todos":l}</button>`).join("")}
      <span style="width:8px"></span>
      ${["alto","medio","baixo","pend"].map(l => `<button type="button" class="fbtn" data-fr="${l}" aria-pressed="${S.fRisk===l}">${RISK_LABEL[l]}</button>`).join("")}
      <input class="search" id="sq" type="search" placeholder="Buscar fornecedor N1, N2 ou N3 por nome, CNPJ/CPF ou município" value="${esc(S.q)}">
    </div>
    <div class="filters"><button type="button" class="fbtn" data-cv="lista" aria-pressed="${S.cadView!=="arvore"}">Lista do cliente</button><button type="button" class="fbtn" data-cv="arvore" aria-pressed="${S.cadView==="arvore"}">Árvore da cadeia</button><span style="flex:1"></span>${Store.me.canEdit ? `<button type="button" class="btn sm ghost" id="del-sup">Excluir fornecedores</button>` : ""}<button type="button" class="btn sm" id="exp-csv">Exportar Excel (.csv)</button></div>
    ${S.cadView==="arvore" ? "" : listHtml}
    <div class="tree" ${S.cadView==="arvore" ? "" : "hidden"}>${roots.length ? roots.map(node).join("") : `<div class="empty"><b>Nenhum fornecedor ${filtering ? "encontrado com esses filtros" : "cadastrado"}.</b>${filtering ? "" : "Comece pelas traders N1 da base do cliente e depois vincule os N2 e N3."}</div>`}</div>`;
  $("#add-sup").onclick = () => openSupplierForm();
  $("#imp-sup").onclick = () => IMP.abrir();
  $("#imp-ficha").onclick = () => openFicha();
  $$("#cadeia [data-open]").forEach(r => r.onclick = e => { if (e.target.closest("select")) return; openSupplier(r.dataset.open); });
  $$("#cadeia [data-cv]").forEach(b => b.onclick = () => { S.cadView = b.dataset.cv; renderCadeia(); });
  $$("#cadeia [data-sort]").forEach(b => b.onclick = () => { const k = b.dataset.sort; S.sort = (S.sort?.k===k) ? {k, d:-(S.sort.d)} : {k, d:1}; renderCadeia(); });
  $$("#cadeia [data-qc]").forEach(sel => { sel.onclick = e => e.stopPropagation(); sel.onchange = () => quickClassify(sel.dataset.qc, sel.value); });
  $("#exp-csv").onclick = () => exportListCSV(listRows);
  if ($("#del-sup")) $("#del-sup").onclick = () => IMP.excluir();
  $$("#cadeia [data-fl]").forEach(b => b.onclick = () => { S.fLevel = b.dataset.fl; renderCadeia(); });
  $$("#cadeia [data-fr]").forEach(b => b.onclick = () => { S.fRisk = S.fRisk===b.dataset.fr ? "todos" : b.dataset.fr; renderCadeia(); });
  EXT_CAD.forEach(f => f());
  const sq = $("#sq"); sq.oninput = () => { S.q = sq.value; clearTimeout(sq._t); sq._t = setTimeout(() => { renderCadeia(); const n = $("#sq"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
}

/* ---------- sheet helpers ---------- */
function sheet(html, onClose){
  $("#layer").innerHTML = `<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const close = () => { $("#layer").innerHTML = ""; S.openSup = null; onClose && onClose(); };
  $("#scrim").addEventListener("click", e => { if (e.target.id==="scrim") close(); });
  { const sh = $("#layer .sheet"), hd = sh && sh.querySelector(".sheet-h"), bd = sh && sh.querySelector(".sheet-b");
    if (hd && !hd.querySelector("[data-x]")) hd.insertAdjacentHTML("beforeend", `<button type="button" class="x" data-x aria-label="Fechar">×</button>`);
    if (bd && ![...sh.querySelectorAll("[data-x]")].some(b => !hd || !hd.contains(b))) bd.insertAdjacentHTML("beforeend", `<div class="sheet-fim"><button type="button" class="btn ghost" data-x>Fechar</button></div>`); }
  $$("#layer [data-x]").forEach(b => b.onclick = close);
  document.onkeydown = e => { if (e.key==="Escape" && $("#layer").innerHTML) close(); };
  return close;
}

/* ---------- importação da base de traders ---------- */
function parseTraders(txt){
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean); if (!lines.length) return [];
  const sep = (lines[0].match(/;/g)||[]).length >= (lines[0].match(/,/g)||[]).length ? ";" : ",";
  const head = lines[0].toLowerCase(); const hasHead = /cnpj|raz|nome/.test(head);
  const cols = hasHead ? lines[0].split(sep).map(c => c.trim().toLowerCase()) : ["cnpj","razao","municipio","uf","volume"];
  const idx = k => cols.findIndex(c => c.includes(k));
  const ic = idx("cnpj"), ir = Math.max(idx("raz"), idx("nome")), im = idx("munic"), iu = cols.findIndex(c => c==="uf" || c.includes("estado")), iv = idx("vol");
  return (hasHead ? lines.slice(1) : lines).map(l => { const c = l.split(sep).map(x => x.trim().replace(/^"|"$/g,""));
    return {doc:c[ic]||"", nome:c[ir]||"", municipio:im>=0?c[im]||"":"", uf:(iu>=0?c[iu]||"":"").toUpperCase().slice(0,2), volume:iv>=0?c[iv]||"":""}; }).filter(r => r.doc || r.nome);
}
function openImport(){
  const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base de traders do cliente</div><h2>Importar traders (N1)</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="sheet-b">
      <p class="sub" style="margin:0">Cole as linhas da planilha ou escolha um arquivo CSV. Colunas: <b>CNPJ; Razão social; Município; UF; Volume (t)</b>. CNPJs já cadastrados são ignorados.</p>
      <div class="fld"><label for="imp-file">Arquivo CSV</label><input id="imp-file" type="file" accept=".csv,text/csv,text/plain"></div>
      <div class="fld"><label for="imp-txt">Ou cole aqui</label><textarea id="imp-txt" style="min-height:150px;font-family:var(--f-mono);font-size:12.5px" placeholder="CNPJ;Razão social;Município;UF;Volume\n00.000.000/0001-00;Trader Exemplo Ltda;Medicilândia;PA;1200"></textarea></div>
      <div id="imp-prev" class="result">Nenhuma linha lida ainda.</div>
      <p class="err" id="imp-err" hidden></p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn primary" id="imp-go" disabled>Importar</button></div>
    </div>`);
  let rows = [];
  const prev = () => { rows = parseTraders($("#imp-txt").value); const known = new Set(S.suppliers.map(x => (x.doc||"").replace(/\D/g,"")));
    const novos = rows.filter(r => !known.has(r.doc.replace(/\D/g,""))); const pa = novos.filter(r => r.uf==="PA").length;
    $("#imp-prev").innerHTML = rows.length ? `${rows.length} linha(s) lida(s) · <b>${novos.length} nova(s)</b> · ${pa} no Pará · ${rows.length-novos.length} já cadastrada(s)` : "Nenhuma linha lida ainda.";
    $("#imp-go").disabled = !novos.length; rows = novos; };
  $("#imp-txt").oninput = prev;
  $("#imp-file").onchange = async e => { const f = e.target.files[0]; if (!f) return; $("#imp-txt").value = await f.text(); prev(); };
  $("#imp-go").onclick = async () => {
    const go = $("#imp-go"); go.disabled = true; let n = 0;
    try{
      for (const r of rows){
        const m = muniOf(r.municipio, r.uf); const c = m ? [m[2], m[3]] : UF_CENTER[r.uf] || null;
        await Store.set("suppliers", uid(), {nivel:"N1", tipo:"Trader", parentId:"", nome:r.nome || r.doc, doc:r.doc, uf:r.uf || (m?m[1]:""), municipio:r.municipio, volume:r.volume,
          lat: c ? c[0] : null, lng: c ? c[1] : null, geoAprox: !m, answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), criadoPor:Store.me.id||"", origem:"importação"});
        n++; go.textContent = `Importando ${n}/${rows.length}…`;
      }
      close(); toast(`${n} trader(s) importada(s)`);
    }catch(x){ $("#imp-err").textContent = `Importação parou em ${n} de ${rows.length}. ${x?.code==="quota_exceeded" ? "Limite do banco atingido." : "Verifique a conexão e o seu acesso."}`; $("#imp-err").hidden = false; go.disabled = false; go.textContent = "Importar o restante"; }
  };
}

/* ---------- ficha vinda do Portal do Fornecedor ---------- */
function dataURLtoBlob(u){ const [h, b] = u.split(","); const mime = h.slice(5, h.indexOf(";")); const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], {type:mime}); }
/* grava a evidência e avisa os módulos (pré-análise do documento, nota fiscal → operações) */
async function salvarEvid(id, body, blob){ await Store.set("evidences", id, body); EXT_EVID.forEach(f => { try{ f(id, blob || null, body); }catch(e){} }); }
/* ---------- leitura dos arquivos guardados ----------
   No Firebase os arquivos ficam no Storage; o navegador só consegue baixá-los direto se o bucket tiver CORS liberado
   para o domínio do sistema (não vem liberado). Por isso a leitura segue, nesta ordem: arquivo ainda na memória (acabou
   de ser importado) → download direto → função lerArquivo no servidor (sem CORS, com as mesmas regras de acesso). */
const KT_ARQ = {cache: new Map(), tam: 0, diretoBloq: false, falhas: {}, via: {memoria: 0, direto: 0, servidor: 0}};
function ktGuardaArq(k, blob){ if (!k || !blob || !blob.size || blob.size > 40e6) return; if (KT_ARQ.cache.has(k)) return;
  KT_ARQ.cache.set(k, blob); KT_ARQ.tam += blob.size;
  while (KT_ARQ.tam > 200e6 && KT_ARQ.cache.size > 1){ const [k0, b0] = KT_ARQ.cache.entries().next().value; KT_ARQ.cache.delete(k0); KT_ARQ.tam -= b0.size; } }
function ktCaminhoArq(e){ if (e?.assetId) return String(e.assetId); const m = String(e?.url || "").match(/\/o\/([^?#]+)/); return m ? decodeURIComponent(m[1]) : ""; }
async function ktBaixar(e){
  if (!e) throw new Error("documento não encontrado");
  const k = e.id || e.url, u = String(e.url || "");
  if (k && KT_ARQ.cache.has(k)){ KT_ARQ.via.memoria++; return KT_ARQ.cache.get(k); }
  if (u && KT_ARQ.cache.has(u)){ KT_ARQ.via.memoria++; return KT_ARQ.cache.get(u); }
  let blob = null, motivo = "";
  const nuvem = /^https?:\/\/(firebasestorage\.googleapis\.com|[^/]*\.firebasestorage\.app|storage\.googleapis\.com)\//.test(u);
  if (u && !(nuvem && KT_ARQ.diretoBloq)){
    try{ const r = await fetch(u); if (r.ok){ blob = await r.blob(); KT_ARQ.via.direto++; } else motivo = "o arquivo respondeu " + r.status + (r.status === 403 ? " (sem permissão)" : r.status === 404 ? " (arquivo não está mais no Storage)" : ""); }
    catch(x){ motivo = "download direto bloqueado pelo navegador (CORS do Storage)"; if (nuvem) KT_ARQ.diretoBloq = true; } }
  if (!blob){ const p = ktCaminhoArq(e);
    if (p && window.firebase?.app && firebase.app().functions){
      try{ const chama = () => firebase.app().functions("southamerica-east1").httpsCallable("lerArquivo", {timeout: 120000})({path: p});
        const r = await chama().catch(async x => { if (/internal|unavailable|deadline|resource/.test(String(x?.code || ""))){ await new Promise(z => setTimeout(z, 1500)); return chama(); } throw x; }), d = r.data || {};
        const bin = atob(d.b64 || ""), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
        blob = new Blob([a], {type: d.mime || e.mime || "application/octet-stream"}); KT_ARQ.via.servidor++; }
      catch(x){ const c = String(x?.code || ""); motivo = (motivo ? motivo + "; " : "") + (/not-found/.test(c) && /lerArquivo|function/i.test(String(x?.message || "")) ? "função lerArquivo não publicada (republique as funções)" : /not-found/.test(c) ? "arquivo não encontrado no Storage" : /permission/.test(c) ? "sem permissão para este arquivo" : /unauthenticated/.test(c) ? "entre no sistema de novo" : /internal/.test(c) ? "a função lerArquivo não respondeu (não publicada ou bloqueada no Google Cloud; veja o Diagnóstico do Firebase)" : /unavailable|deadline|resource/.test(c) ? "servidor indisponível: " + String(x?.message || c).slice(0, 140) : (x?.message || "falha no servidor")); KT_ARQ.ultimoErro = {code: c, msg: String(x?.message || ""), em: new Date().toISOString()}; } } }
  if (!blob){ if (k) KT_ARQ.falhas[k] = motivo || "arquivo sem endereço"; throw new Error("não foi possível abrir o arquivo: " + (motivo || "arquivo sem endereço")); }
  if (k) delete KT_ARQ.falhas[k]; ktGuardaArq(k, blob); return blob;
}
window.ktBaixar = ktBaixar; window.KT_ARQ = KT_ARQ;
EXT_EVID.push((id, blob, body) => { if (blob) ktGuardaArq(id, blob); });
function openFicha(){
  const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Portal do Fornecedor</div><h2>Importar ficha do fornecedor</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="sheet-b">
      <p class="sub" style="margin:0">Escolha o arquivo <b>.kinseytec</b> que o fornecedor gerou no portal e enviou por e-mail ou WhatsApp. Os dados entram marcados como <b>"enviado pelo fornecedor — conferir"</b>.</p>
      <div class="fld"><label for="fi-file">Arquivo da ficha</label><input id="fi-file" type="file" accept=".kinseytec,application/json,.json"></div>
      <div id="fi-prev" class="result">Nenhuma ficha lida.</div>
      <p class="err" id="fi-err" hidden></p>
      <div class="banner">Link do Portal do Fornecedor para enviar aos fornecedores: <b style="user-select:all">${PORTAL_URL}</b></div>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="button" class="btn primary" id="fi-go" disabled>Importar</button></div>
    </div>`);
  let fx = null;
  $("#fi-file").onchange = async e => { const f = e.target.files[0]; if (!f) return; $("#fi-err").hidden = true;
    try{ fx = JSON.parse(await f.text()); if (fx.formato !== "kinseytec-cacau-ficha") throw 0; }catch(x){ fx = null; $("#fi-err").textContent = "Este arquivo não é uma ficha do Portal do Fornecedor KinseyTec."; $("#fi-err").hidden = false; $("#fi-go").disabled = true; return; }
    const sp = fx.fornecedor || {}, dig = d => String(d||"").replace(/\D/g,""); const dup = S.suppliers.find(x => dig(x.doc) && dig(x.doc) === dig(sp.doc));
    const comp = dig((sp.comprador||"").match(/[\d./-]{11,}/)?.[0]); const par = comp ? S.suppliers.find(x => dig(x.doc) === comp) : null;
    $("#fi-prev").innerHTML = `<b>${esc(sp.nome||"—")}</b> · ${esc(sp.nivel)} · ${esc(sp.doc||"")}<br>${esc(sp.municipio||"—")}/${esc(sp.uf||"—")} · NDA ${fx.nda?.aceito ? "aceito" : "não aceito"} · ${Object.values(fx.answers||{}).filter(a=>a.v).length} respostas · ${(fx.fotos||[]).length} foto(s) · ${(fx.anexos||[]).length} anexo(s)<br>${sp.nivel!=="N1" ? (par ? `Vende para: <b>${esc(par.nome)}</b>` : `<span style="color:var(--warn)">Comprador não encontrado na base: vincular depois (${esc(sp.comprador||"não informado")})</span>`) : "Vende para: Cliente contratante"}${dup ? `<br><span style="color:var(--warn)">Já existe um fornecedor com este CNPJ/CPF: os dados serão atualizados.</span>` : ""}`;
    fx._par = par?.id || ""; fx._dup = dup?.id || ""; $("#fi-go").disabled = false; };
  $("#fi-go").onclick = async () => { if (!fx) return; const go = $("#fi-go"); go.disabled = true; go.textContent = "Importando…";
    try{
      const sp = fx.fornecedor, m = muniOf(sp.municipio, sp.uf) || muniOf(sp.municipio);
      const docs = {}; Object.entries(fx.docs||{}).forEach(([k,v]) => { docs[k] = v.v === "na" ? "na" : "pend"; });
      const body = {nivel:sp.nivel, tipo:sp.tipo, parentId: sp.nivel==="N1" ? "" : fx._par, nome:sp.nome, doc:sp.doc, ie:sp.ie||"", abertura:sp.abertura||"", volume:sp.volume||"", uf:sp.uf||"", municipio:sp.municipio||"",
        lat: m ? m[2] : null, lng: m ? m[3] : null, endEstoque:sp.endEstoque||"", endExtracao:sp.endExtracao||"", car:sp.car||"", areaHa:sp.areaHa||"", responsavel:sp.responsavel||"", contato:sp.contato||"", contratacao:sp.contratacao||"",
        answers: Object.fromEntries(Object.entries(fx.answers||{}).map(([k, v]) => [k, {...v, origem:"Portal", em: v.em || fx.geradoEm || ""}])), docs, docsFornecedor: fx.docs||{}, nda: fx.nda||{}, origem:"Portal do Fornecedor", conferir:true, compradorInformado: sp.comprador||"", fichaGeradaEm: fx.geradoEm||"", importadoEm: nowISO(), importadoPor: Store.me.id||""};
      const id = fx._dup || uid();
      if (fx._dup) await Store.update("suppliers", id, body); else await Store.set("suppliers", id, {...body, insp:{}, balanco:{}, invest:{}, criadoEm:nowISO(), criadoPor:Store.me.id||""});
      let n = 0;
      for (const ph of (fx.fotos||[])){ const blob = ph.data ? dataURLtoBlob(ph.data) : {type: ph.mime || "image/jpeg"}, up = ph.data ? await Store.upload(blob) : (ph.fileId && window.KT_GET_FILE) ? {assetId: null, url: await KT_GET_FILE(ph.fileId)} : {assetId: ph.path || null, url: ph.url}; const distKm = ph.gps && m ? Math.round(haversine(ph.gps.lat, ph.gps.lng, m[2], m[3])*10)/10 : null;
        await salvarEvid(uid(), {supplierId:id, tipo:ph.tipo, obs:ph.obs||"", ...up, mime:blob.type, nome:ph.nome||"foto.jpg", gps:ph.gps||null, distKm, takenAt:ph.takenAt||null, criadoEm:nowISO(), criadoPor:Store.me.id||"", origem:"Portal do Fornecedor"}, ph.data ? blob : null); n++; go.textContent = `Enviando arquivos ${n}…`; }
      for (const ax of (fx.anexos||[])){ const blob = ax.data ? dataURLtoBlob(ax.data) : {type: ax.mime || "application/octet-stream"}, up = ax.data ? await Store.upload(blob) : (ax.fileId && window.KT_GET_FILE) ? {assetId: null, url: await KT_GET_FILE(ax.fileId)} : {assetId: ax.path || null, url: ax.url};
        await salvarEvid(uid(), {supplierId:id, tipo: /nota/i.test(ax.tipo) ? "Nota fiscal" : /contrat/i.test(ax.tipo) ? "Contrato" : /CAR/.test(ax.tipo) ? "Recibo do CAR" : /certid/i.test(ax.tipo) ? "Certidão" : "Outro", obs: ax.tipo + (ax.just ? " · Justificativa do fornecedor: " + ax.just : ""), ...up, mime:blob.type, nome:ax.nome, gps:null, distKm:null, takenAt:null, criadoEm:nowISO(), criadoPor:Store.me.id||"", origem:"Portal do Fornecedor", justificativa: ax.just || ""}, ax.data ? blob : (String(up.url || "").startsWith("data:") ? dataURLtoBlob(up.url) : null)); n++; go.textContent = `Enviando arquivos ${n}…`; }
      if (window.KT_FB && KT_FB._fichaId){ KT_AUTH.db.collection("fichas").doc(KT_FB._fichaId).set({status:"importada", importadoEm:nowISO()}, {merge:true}).catch(() => {}); KT_FB._fichaId = null; }
      close(); toast("Ficha importada. Confira os dados no dossiê."); openSupplier(id, "dados");
    }catch(x){ $("#fi-err").textContent = x?.code==="quota_exceeded" ? "Espaço de arquivos cheio." : "Não foi possível importar. Verifique a conexão e o seu acesso."; $("#fi-err").hidden = false; go.disabled = false; go.textContent = "Importar"; }
  };
}

/* ---------- cadastro ---------- */
function openSupplierForm(id, presetParent){
  const s = id ? supById(id) : {nivel: presetParent ? (supById(presetParent)?.nivel==="N1" ? "N2" : "N3") : "N1", parentId: presetParent || ""};
  const parents = lv => S.suppliers.filter(p => lv==="N2" ? p.nivel==="N1" : lv==="N3" ? (p.nivel==="N2" || p.nivel==="N1") : false);
  const close = sheet(`
    <div class="sheet-h"><div><div class="eyebrow">${id ? "Editar cadastro" : "Novo fornecedor"}</div><h2>${id ? esc(s.nome) : "Cadastro de fornecedor"}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <form class="sheet-b" id="fsup" novalidate>
      <div class="form">
        <div class="fld"><label for="f-nivel">Nível na cadeia</label><select id="f-nivel">${["N1","N2","N3"].map(l => `<option ${s.nivel===l?"selected":""}>${l}</option>`).join("")}</select><span class="hint">N1 trader · N2 fornecedor da trader · N3 produtor</span></div>
        <div class="fld"><label for="f-tipo">Tipo</label><select id="f-tipo"></select></div>
        <div class="fld full" id="w-parent"><label for="f-parent">Vende para (elo acima na cadeia)</label><select id="f-parent"></select></div>
        <div class="fld full"><label for="f-nome">Razão social ou nome do produtor *</label><input id="f-nome" required value="${esc(s.nome)}" autocomplete="off"></div>
        <div class="fld"><label for="f-doc">CNPJ ou CPF *</label><input id="f-doc" inputmode="numeric" value="${esc(s.doc)}" placeholder="00.000.000/0000-00"></div>
        <div class="fld"><label for="f-ie">Inscrição estadual</label><input id="f-ie" value="${esc(s.ie)}"></div>
        <div class="fld"><label for="f-ab">Data de abertura do CNPJ</label><input id="f-ab" type="date" value="${esc(s.abertura)}"></div>
        <div class="fld"><label for="f-vol">Volume anual (t de cacau)</label><input id="f-vol" inputmode="decimal" value="${esc(s.volume)}"></div>
        <div class="fld"><label for="f-uf">UF</label><select id="f-uf"><option value="">—</option>${UFS.map(u => `<option ${s.uf===u?"selected":""}>${u}</option>`).join("")}</select></div>
        <div class="fld"><label for="f-mun">Município</label><input id="f-mun" list="dl-mun" value="${esc(s.municipio)}" autocomplete="off"><datalist id="dl-mun">${MUNI.map(m => `<option value="${m[0]}">${m[1]}</option>`).join("")}</datalist><span class="hint">Municípios produtores preenchem as coordenadas</span></div>
        <div class="fld"><label for="f-lat">Latitude</label><input id="f-lat" inputmode="decimal" value="${s.lat ?? ""}"></div>
        <div class="fld"><label for="f-lng">Longitude</label><input id="f-lng" inputmode="decimal" value="${s.lng ?? ""}"></div>
        <div class="fld full"><label for="f-est">Endereço do local de estocagem</label><input id="f-est" value="${esc(s.endEstoque)}"></div>
        <div class="fld full"><label for="f-ext">Endereço do local de extração (propriedade de origem)</label><input id="f-ext" value="${esc(s.endExtracao)}"></div>
        <div class="fld n3only"><label for="f-car">Nº do CAR</label><input id="f-car" value="${esc(s.car)}" placeholder="UF-0000000-XXXX…"></div>
        <div class="fld n3only"><label for="f-area">Área plantada com cacau (ha)</label><input id="f-area" inputmode="decimal" value="${esc(s.areaHa)}"></div>
        <div class="fld"><label for="f-resp">Responsável</label><input id="f-resp" value="${esc(s.responsavel)}"></div>
        <div class="fld"><label for="f-cont">Contato (telefone ou e-mail)</label><input id="f-cont" value="${esc(s.contato)}"></div>
        <div class="fld full"><label for="f-emp">Forma de contratação dos empregados</label><select id="f-emp"><option value="">—</option>${["CLT","Safra","Parceria / meação","Diaristas","Terceirizados","Mão de obra familiar","Misto"].map(o => `<option ${s.contratacao===o?"selected":""}>${o}</option>`).join("")}</select></div>
      </div>
      <p class="hint" style="font-size:12px;color:var(--muted)">LGPD: cadastre só os dados necessários à diligência. CPF e contato de produtores pessoa física são dados pessoais e ficam visíveis apenas para a equipe com acesso ao app.</p>
      <p class="err" id="ferr" hidden></p>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">${id ? `<button type="button" class="btn bad" id="f-del">Excluir</button><span style="flex:1"></span>` : ""}<button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">${id ? "Salvar alterações" : "Cadastrar"}</button></div>
    </form>`);
  const syncLv = () => {
    const lv = $("#f-nivel").value;
    $("#f-tipo").innerHTML = SUP_TYPES[lv].map(t => `<option ${s.tipo===t?"selected":""}>${t}</option>`).join("");
    const ps = parents(lv); $("#w-parent").hidden = lv==="N1";
    $("#f-parent").innerHTML = `<option value="">Selecione…</option>` + ps.map(p => `<option value="${p.id}" ${s.parentId===p.id?"selected":""}>${p.nivel} · ${esc(p.nome)}</option>`).join("");
    $$(".n3only").forEach(e => e.hidden = lv!=="N3");
  };
  $("#f-nivel").onchange = syncLv; syncLv();
  const fillCoords = () => { const m = muniOf($("#f-mun").value, $("#f-uf").value) || muniOf($("#f-mun").value); if (m){ $("#f-uf").value = m[1]; $("#f-lat").value = m[2]; $("#f-lng").value = m[3]; } };
  $("#f-mun").addEventListener("change", fillCoords);
  if ($("#f-del")) $("#f-del").onclick = () => confirmBox(`Excluir ${s.nome}? As evidências e contratos vinculados continuam guardados.`, "Excluir", async () => { await Store.del("suppliers", id); close(); toast("Fornecedor excluído"); if (S.sel===id) selectSup(null); });
  $("#fsup").onsubmit = async e => {
    e.preventDefault(); const v = id => $(id).value.trim(); const lv = v("#f-nivel");
    const err = !v("#f-nome") ? "Informe a razão social ou o nome." : !v("#f-doc") ? "Informe o CNPJ ou CPF." : lv!=="N1" && !v("#f-parent") ? "Escolha para quem este fornecedor vende." : null;
    if (err){ const f = $("#ferr"); f.textContent = err; f.hidden = false; return; }
    if (!v("#f-lat")) fillCoords();
    const body = {nivel:lv, tipo:v("#f-tipo"), parentId: lv==="N1" ? "" : v("#f-parent"), nome:v("#f-nome"), doc:v("#f-doc"), ie:v("#f-ie"), abertura:v("#f-ab"), volume:v("#f-vol"), uf:v("#f-uf"), municipio:v("#f-mun"),
      lat: num($("#f-lat").value.replace(".",",")), lng: num($("#f-lng").value.replace(".",",")), endEstoque:v("#f-est"), endExtracao:v("#f-ext"), car: lv==="N3" ? v("#f-car") : "", areaHa: lv==="N3" ? v("#f-area") : "", responsavel:v("#f-resp"), contato:v("#f-cont"), contratacao:v("#f-emp")};
    try{
      if (id) await Store.update("suppliers", id, body);
      else { const nid = uid(); await Store.set("suppliers", nid, {...body, answers:{}, docs:{}, insp:{}, balanco:{}, criadoEm:nowISO(), criadoPor:Store.me.id}); close(); toast("Fornecedor cadastrado"); openSupplier(nid); return; }
      close(); toast("Cadastro atualizado"); if (S.openSup===id) openSupplier(id);
    }catch(x){ const f = $("#ferr"); f.textContent = "Não foi possível salvar. Seu acesso pode ser apenas de leitura."; f.hidden = false; }
  };
}
function confirmBox(msg, label, fn){
  const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 35; d.style.alignItems = "center";
  d.innerHTML = `<div class="card" style="max-width:380px;margin:16px;display:flex;flex-direction:column;gap:14px;background:var(--navy)"><p>${esc(msg)}</p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-c>Cancelar</button><button type="button" class="btn bad" data-ok>${esc(label)}</button></div></div>`;
  document.body.appendChild(d); d.querySelector("[data-c]").onclick = () => d.remove(); d.querySelector("[data-ok]").onclick = () => { d.remove(); fn(); };
}

/* ---------- dossiê do fornecedor ---------- */
function openSupplier(id, tab){
  S.openSup = id; S.supTab = tab || S.supTab || "dados";
  const s = supById(id); if (!s) return;
  sheet(`<div class="sheet-h"><div><div class="eyebrow"><span class="lvtag">${s.nivel}</span> ${esc(s.tipo||"")} · ${esc(s.municipio||"—")}/${esc(s.uf||"—")}</div><h2 id="sh-title">${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="stabs" role="tablist">${TABS.map(([k,l],i) => `<button type="button" role="tab" data-st="${k}" aria-selected="${S.supTab===k}"><span class="sn">${i+1}</span>${l}</button>`).join("")}</div>
    <div class="sheet-b" id="sup-body"></div>`);
  $$("[data-st]").forEach(b => b.onclick = () => setTab(b.dataset.st));
  renderSupBody();
}
/* Fontes públicas para consulta (links oficiais). Cada segmento pode acrescentar FONTES_EXTRA e SETOR_NEWS em data.js */
const FONTES_PADRAO = [
 ["Receita Federal · CNPJ","https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp"],
 ["Sintegra · inscrição estadual","http://www.sintegra.gov.br"],
 ["PGFN · lista de devedores","https://www.listadevedores.pgfn.gov.br"],
 ["Portal da Transparência · CEIS/CNEP (empresas punidas)","https://portaldatransparencia.gov.br/sancoes/consulta"],
 ["MTE · Cadastro de Empregadores (lista suja)","https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/areas-de-atuacao/cadastro_de_empregadores.pdf"],
 ["IBAMA · áreas embargadas","https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaPublicaAreasEmbargadas.php"],
 ["SICAR · consulta pública do CAR","https://consultapublica.car.gov.br/publico/imoveis/index"],
 ["MapBiomas Alerta · desmatamento","https://plataforma.alerta.mapbiomas.org"]
];
const fontesLista = () => [...(typeof FONTES_EXTRA !== "undefined" ? FONTES_EXTRA : []), ...FONTES_PADRAO];
const setorNews = () => (typeof SETOR_NEWS !== "undefined" ? SETOR_NEWS : []);
const auditTests = () => (typeof AUDIT_TESTS !== "undefined" ? AUDIT_TESTS : []);
const clauseInfo = cid => (typeof CLAUSE_INFO !== "undefined" ? CLAUSE_INFO[cid] : null);
/* Requisitos mínimos por tipo de evidência (EV_GUIDE_EXTRA no data.js complementa) */
const EV_GUIDE = [
 [/^Foto/, "Foto original da câmera, com data e GPS ativos; uma visão geral e uma de detalhe; evite rostos de trabalhadores."],
 [/Nota fiscal/, "Conferir a chave de 44 dígitos no portal da NF-e; emitente, produto, quantidade, data e valor compatíveis com o contrato e o estoque."],
 [/^Contrato/, "Versão assinada por todas as partes, com cláusulas de origem, trabalho, auditoria e rescisão; conferir os poderes de quem assina."],
 [/Ticket de pesagem/, "Número sequencial, placa, peso bruto, tara e líquido; conferir com a nota fiscal e o romaneio."],
 [/Romaneio|CT-e/, "Placa, motorista, origem e destino; conferir a chave do CT-e e o trajeto com o local declarado."],
 [/GTA/, "Conferir número, origem, destino, quantidade e finalidade na defesa agropecuária; cruzar com o CAR da fazenda de origem."],
 [/\bCAR\b|polígono/, "Recibo do CAR ativo e polígono (KML ou shapefile) comparado com PRODES/DETER, embargos e áreas protegidas."],
 [/satélite/, "Relatório com data, fonte das imagens e sobreposição do polígono com alertas de desmatamento; arquivar o PDF."],
 [/lista suja/, "Print do Cadastro de Empregadores do MTE com data da consulta, para o CNPJ e os CPFs dos sócios."],
 [/embargos/, "Consulta com data aos embargos do IBAMA e do órgão estadual, por CPF/CNPJ e por polígono."],
 [/vacina/, "Comprovante emitido pela defesa agropecuária, compatível com o rebanho declarado e as GTAs."],
 [/Laudo|Certificado|Certidão/, "Documento válido, emitido por laboratório ou entidade identificada; conferir a autenticidade no site do emissor."],
 [/Comprovante de pagamento|Recibo de compra/, "Transferência bancária identificada (pagador, recebedor e valor); pagamento em espécie é ponto de atenção."],
 [/Registro de empregados/, "eSocial ou ficha de registro com admissão anterior ao início do trabalho; conferir com quem estava no local na inspeção."],
 [/Entrevista/, "Registro da entrevista (data, local, função, forma de contratação, jornada, descontos), sem identificar o trabalhador sem consentimento."],
 [/Licença|alvará/, "Licença ambiental e alvará vigentes, no nome e endereço do fornecedor e compatíveis com a atividade; conferir no órgão emissor."],
 [/Cadastro do vendedor|Ficha de origem/, "Documento com foto, CPF/CNPJ, endereço e origem declarada do material; conferir na Receita Federal."],
 [/MTR/, "Manifesto emitido no SINIR, com gerador, transportador e destinador identificados."],
 [/Arremate|leilão/, "Edital e termo de arremate em nome do fornecedor, com descrição e quantidade do material."],
 [/Pedido/, "Pedido numerado, com data, quantidade e preço, conciliado com a nota fiscal."],
 [/NDA|LGPD/, "Aceite com nome, cargo, documento, data e versão do termo."]
];
const evGuide = t => (typeof EV_GUIDE_EXTRA !== "undefined" && EV_GUIDE_EXTRA[t]) || (EV_GUIDE.find(([re]) => re.test(t)) || [])[1] || "Descreva o que o documento comprova e onde foi conferido.";
const TABS = [["dados","Dados"],["invest","Investigação"],["lgpd","NDA / LGPD"],["quest","Questionário"],["docs","Documentos"],["insp","Inspeção"],["testes","Testes"],["risco","Risco"]];
function setTab(k){
  S.supTab = k; $$("[data-st]").forEach(x => x.setAttribute("aria-selected", x.dataset.st===k));
  renderSupBody(); const b = $("#sup-body"); if (b) b.scrollTop = 0;
  const btn = $(`[data-st="${k}"]`); if (btn) btn.scrollIntoView({block:"nearest", inline:"nearest"});
}
function stepNav(b){
  const i = TABS.findIndex(t => t[0]===S.supTab); if (i < 0) return;
  const prev = TABS[i-1], next = TABS[i+1];
  b.insertAdjacentHTML("beforeend", `<div class="stepnav">${prev ? `<button type="button" class="btn ghost" data-step="${prev[0]}">← ${prev[1]}</button>` : "<span></span>"}${next ? `<button type="button" class="btn primary" data-step="${next[0]}">Próximo: ${next[1]} →</button>` : `<button type="button" class="btn" data-x-step>Concluir dossiê</button>`}</div>`);
  $$("[data-step]", b).forEach(x => x.onclick = () => setTab(x.dataset.step));
  const fin = $("[data-x-step]", b); if (fin) fin.onclick = () => { $("#layer").innerHTML = ""; S.openSup = null; toast("Dossiê salvo"); };
}
function refreshSupplierSheet(){ const s = supById(S.openSup); if (!s) return; const a = document.activeElement; if (a && a.closest("#sup-body") && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) return;
  const f = $("#fnda"); if (f && $$("input", f).some(i => i.type==="checkbox" ? i.checked : i.value && i.value !== i.defaultValue)) return;
  const y = $("#sup-body")?.scrollTop || 0; renderSupBody(); const b = $("#sup-body"); if (b) b.scrollTop = y; }
function renderSupBody(){
  const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b) return;
  const r = riskOf(s), par = s.parentId && supById(s.parentId), kids = S.suppliers.filter(k => k.parentId===s.id);
  const T = S.supTab;
  if (T==="dados"){
    b.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">${riskPill(r)}<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="d-orb">Ver em órbita</button><button type="button" class="btn sm" id="d-ev">+ Evidência</button>${s.nivel!=="N3" ? `<button type="button" class="btn sm" id="d-kid">+ Vincular ${s.nivel==="N1"?"N2":"N3"}</button>` : ""}<button type="button" class="btn sm" id="d-env">Enviar questionário</button><button type="button" class="btn sm" id="d-edit">Editar</button></div></div>
      ${whyBox(s)}
      ${s.origem==="Portal do Fornecedor" ? `<div class="banner"><b>Enviado pelo fornecedor pelo portal${s.fichaGeradaEm ? " em " + dt(s.fichaGeradaEm) : ""}.</b> Conferir CNPJ, endereços, vínculo e documentos antes de usar como evidência.${!s.parentId && s.nivel!=="N1" ? ` Comprador informado: ${esc(s.compradorInformado||"—")} (vincular em Editar).` : ""}</div>` : ""}
      <dl class="kv">
        <dt>CNPJ / CPF</dt><dd class="mono">${esc(s.doc||"—")}</dd><dt>Inscrição estadual</dt><dd class="mono">${esc(s.ie||"—")}</dd>
        <dt>Abertura</dt><dd>${s.abertura ? new Date(s.abertura+"T12:00").toLocaleDateString("pt-BR") : "—"}</dd><dt>Volume anual</dt><dd>${s.volume ? fmt(num(s.volume),1)+" t" : "—"}</dd>
        <dt>Vende para</dt><dd>${par ? `<a href="#" data-goto="${par.id}" style="color:var(--glow)">${esc(par.nome)}</a>` : s.nivel==="N1" ? esc(CLI().nome) : "—"}</dd>
        <dt>Localização</dt><dd>Brasil · ${esc(s.municipio||"—")}/${esc(s.uf||"—")}${s.lat!=null ? `<br><span class="mono" style="font-size:12px;color:var(--muted)">${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</span>` : ""}</dd>
        <dt>Estocagem</dt><dd>${esc(s.endEstoque||"—")}</dd><dt>Extração</dt><dd>${esc(s.endExtracao||"—")}</dd>
        ${s.nivel==="N3" ? `<dt>CAR</dt><dd class="mono">${esc(s.car||"—")}</dd><dt>Área de cacau</dt><dd>${s.areaHa ? fmt(num(s.areaHa),1)+" ha" : "—"}</dd>` : ""}
        <dt>Contratação</dt><dd>${esc(s.contratacao||"—")}</dd><dt>Responsável</dt><dd>${esc(s.responsavel||"—")} ${s.contato ? `· <span class="mono">${esc(s.contato)}</span>` : ""}</dd>
      </dl>
      ${kids.length ? `<div><div class="eyebrow" style="margin-bottom:8px">Fornecedores vinculados (${kids.length})</div><div style="display:flex;flex-direction:column;gap:6px">${kids.map(k => `<button type="button" class="btn ghost" style="justify-content:space-between" data-goto="${k.id}"><span><span class="lvtag">${k.nivel}</span> ${esc(k.nome)}</span>${riskPill(riskOf(k))}</button>`).join("")}</div></div>` : ""}
      <div class="banner">Cadastrado em ${dt(s.criadoEm)}${s.nome?.includes("EXEMPLO") ? " · <b>registro de demonstração</b>, pode ser excluído em Editar." : ""}</div>`;
    $("#d-edit").onclick = () => openSupplierForm(s.id);
    const de = $("#d-env"); if (de) de.onclick = () => { if (typeof PAINEL !== "undefined") PAINEL.envio([s.id]); };
    $("#d-orb").onclick = () => { $("#layer").innerHTML = ""; S.openSup = null; go("orbita"); selectSup(s.id, true); };
    $("#d-ev").onclick = () => openEvidenceForm(s.id);
    if ($("#d-kid")) $("#d-kid").onclick = () => openSupplierForm(null, s.id);
    $$("[data-goto]", b).forEach(a => a.onclick = e => { e.preventDefault(); openSupplier(a.dataset.goto); });
  }
  else if (T==="lgpd") renderLgpd(s, b);
  else if (T==="quest"){
    const a = s.answers || {}, ac = answersCount(s); let n = 0;
    b.innerHTML = `<div class="head"><div><h3>Questionamentos iniciais · ${s.nivel}</h3><p class="sub">${ac.done} de ${ac.total} respondidas. Respostas em vermelho viram indicador de risco.</p></div><div class="prog" style="width:120px"><i style="width:${ac.total?ac.done/ac.total*100:0}%"></i></div></div>
      ${Q[s.nivel].map(g => `<div class="qgroup"><div class="eyebrow">${g.g}</div>${g.items.map(([id, t, risk]) => { n++; const cur = a[id] || {}; const flagged = risk && cur.v===risk;
        return `<div class="q" data-q="${id}"><span class="qn">${String(n).padStart(2,"0")}</span><div class="qt">${esc(t)} ${flagged ? `<span class="flag">● RISCO</span>` : ""}${cur.v ? ` <span class="sub" style="font-size:11px">· ${cur.origem === "Portal" ? "respondido pelo fornecedor" : cur.auto ? "respondido automaticamente" + (cur.n ? " · " + cur.n.replace(/^Automático: /, "") : "") : "respondido pela equipe"}</span>` : ""}</div>
          <div class="qa"><div class="seg">${[["sim","Sim"],["nao","Não"],["na","N/A"]].map(([v,l]) => `<button type="button" data-v="${v}" class="v-${v} ${risk===v?"risk":""}" aria-pressed="${cur.v===v}">${l}</button>`).join("")}</div><input type="text" id="qn-${id}" placeholder="Observação ou evidência" value="${esc(cur.n)}"></div></div>`; }).join("")}</div>`).join("")}`;
    $$(".q", b).forEach(q => {
      const id = q.dataset.q;
      $$("[data-v]", q).forEach(btn => btn.onclick = () => { const v = (s.answers?.[id]?.v === btn.dataset.v) ? "" : btn.dataset.v; save(Store.update("suppliers", s.id, {answers:{[id]:{v, por:Store.me.id||"", em:nowISO(), auto:false}}})); });
      $("input", q).onchange = e => save(Store.update("suppliers", s.id, {answers:{[id]:{n:e.target.value, auto:false}}}));
    });
    EXT_QUEST.forEach(f => f(s, b));
  }
  else if (T==="docs"){
    const d = s.docs || {}, list = DOCS[s.nivel], evs = S.evidences.filter(e => e.supplierId===s.id);
    const ok = list.filter((_,i) => ["ok","ress"].includes(d["d"+i])).length, ress = list.filter((_,i) => d["d"+i]==="ress").length, obs = s.docsObs || {};
    b.innerHTML = `<div class="head"><div><h3>Checklist documental</h3><p class="sub">${ok} de ${list.length} documentos conferidos${ress ? ` (${ress} com ressalva)` : ""}. Ao anexar um documento, o sistema marca o item sozinho: conferido, ou com ressalva e o comentário do que não fecha.</p></div><button type="button" class="btn sm primary" id="doc-add">+ Anexar documento</button></div>
      <div class="qgroup">${list.map((t,i) => `<div class="q"><span class="qn">${String(i+1).padStart(2,"0")}</span><div class="qt">${esc(t)}</div><div class="qa"><div class="seg" data-d="d${i}">${[["ok","Conferido"],["ress","Com ressalva"],["pend","Pendente"],["na","N/A"]].map(([v,l]) => `<button type="button" data-v="${v}" class="${v==="ok"?"v-sim":v==="pend"?"risk":"v-na"}" aria-pressed="${d["d"+i]===v}" ${v==="ress" && d["d"+i]==="ress" ? 'style="background:rgba(242,179,61,.18);color:var(--warn);border-color:var(--warn)"' : ""}>${l}</button>`).join("")}</div>
        ${obs["d"+i]?.txt || d["d"+i]==="ress" ? `<div class="dobs" style="flex:1 1 100%;width:100%;margin-top:6px;font-size:12.5px;${d["d"+i]==="ress" ? "color:var(--warn)" : "color:var(--muted)"}">${obs["d"+i]?.auto ? `<span class="mono" style="font-size:10.5px;color:var(--muted)">AUTOMÁTICO · ${esc(obs["d"+i].doc || "")}</span><br>` : ""}<textarea data-dobs="d${i}" rows="2" placeholder="${d["d"+i]==="ress" ? "Comentário da ressalva (ex.: contrato social não assinado)" : "Comentário (opcional)"}" style="width:100%;margin-top:4px;min-height:44px;font:inherit;font-size:12.5px;color:inherit;background:var(--space);border:1px solid var(--line-2);border-radius:8px;padding:6px 8px;resize:vertical">${esc(obs["d"+i]?.txt || "")}</textarea></div>` : ""}</div></div>`).join("")}</div>
      ${evs.length ? `<div><div class="eyebrow" style="margin-bottom:8px">Arquivos deste fornecedor (${evs.length})</div><div class="grid-ev">${evs.map(evCard).join("")}</div></div>` : ""}`;
    $$("[data-d]", b).forEach(seg => $$("[data-v]", seg).forEach(btn => btn.onclick = () => save(Store.update("suppliers", s.id, {docs:{[seg.dataset.d]: d[seg.dataset.d]===btn.dataset.v ? "" : btn.dataset.v}, docsObs:{[seg.dataset.d]: {...(obs[seg.dataset.d] || {}), auto:false, manual:true, em:nowISO()}}}))));
    $$("[data-dobs]", b).forEach(inp => inp.onchange = () => save(Store.update("suppliers", s.id, {docsObs:{[inp.dataset.dobs]: {...(obs[inp.dataset.dobs] || {}), txt:inp.value.trim(), auto:false, manual:true, em:nowISO()}}})));
    $("#doc-add").onclick = () => openEvidenceForm(s.id, "Nota fiscal");
    EXT_DOCS.forEach(f => f(s, b));
    bindEvCards(b);
  }
  else if (T==="insp"){
    const ins = s.insp || {}, list = INSP[s.nivel];
    b.innerHTML = `<div class="head"><div><h3>Inspeção física in loco</h3><p class="sub">Procedimentos de campo (NBC TO 3000). Cada item pede foto com data e geolocalização.</p></div><button type="button" class="btn sm primary" id="in-ph">+ Foto de campo</button></div>
      <div class="qgroup">${list.map(([id,t],i) => { const c = ins[id] || {}; return `<div class="q" data-i="${id}"><span class="qn">${String(i+1).padStart(2,"0")}</span><div class="qt">${esc(t)}</div><div class="qa"><div class="seg">${[["ok","Conforme"],["ress","Com ressalva"],["nc","Não conforme"]].map(([v,l]) => `<button type="button" data-v="${v}" class="${v==="ok"?"v-sim":v==="nc"?"risk":"v-na"}" aria-pressed="${c.v===v}">${l}</button>`).join("")}</div><input type="text" id="in-${id}" placeholder="Constatação" value="${esc(c.n)}"></div></div>`; }).join("")}</div>
      <div class="fld"><label for="in-resp">Responsável da empresa que acompanhou a inspeção</label><input id="in-resp" value="${esc(ins.responsavel)}" placeholder="Nome e cargo"></div>`;
    $$("[data-i]", b).forEach(q => { const id = q.dataset.i; $$("[data-v]", q).forEach(btn => btn.onclick = () => save(Store.update("suppliers", s.id, {insp:{[id]:{v: ins[id]?.v===btn.dataset.v ? "" : btn.dataset.v, em:nowISO()}}}))); $("input", q).onchange = e => save(Store.update("suppliers", s.id, {insp:{[id]:{n:e.target.value}}})); });
    $("#in-resp").onchange = e => save(Store.update("suppliers", s.id, {insp:{responsavel:e.target.value}}));
    $("#in-ph").onclick = () => openEvidenceForm(s.id, s.nivel==="N3" ? "Foto da propriedade" : "Foto da mercadoria");
  }
  else if (T==="testes"){
    const bl = s.balanco || {}; const ei=num(bl.ei), c=num(bl.compras), v=num(bl.vendas), ef=num(bl.ef);
    const ready = [ei,c,v,ef].every(x => x!=null), calc = ready ? ei+c-v : null, dif = ready ? ef-calc : null;
    const area = num(s.areaHa), vol = num(s.volume), ref = PROD_REF[s.uf] || 500;
    const hj = new Date(), pa = typeof VISAO !== "undefined" && VISAO.periodoAno ? VISAO.periodoAno() : null, de0 = pa ? pa.de : hj.getFullYear() + "-01-01", ate0 = pa ? pa.ate : hj.toISOString().slice(0,10), bde = bl.de || de0, bate = bl.ate || ate0;
    b.innerHTML = `<div><h3>Balanço de massa (t)</h3><p class="sub">Estoque inicial + compras − vendas = estoque final. Diferença acima de 5% das compras gera risco.</p></div>
      <div class="banner" style="font-size:12.5px"><b>Período:</b> o ano em análise, de 1º de janeiro até o fim do último mês com nota emitida (o mesmo do rastreio das notas). <b>Estoque inicial</b> = estoque no primeiro dia do período (inventário, balanço contábil ou declaração do fornecedor). <b>Compras</b> e <b>vendas</b> = total do período, pelas notas fiscais. <b>Estoque final</b> = o contado na inspeção física, no fim do período.</div>
      <div class="calc"><div class="fld"><label for="bl-de">Período: de</label><input id="bl-de" type="date" value="${esc(bde)}"></div><div class="fld"><label for="bl-ate">até (data da contagem)</label><input id="bl-ate" type="date" value="${esc(bate)}"></div></div>
      <div class="calc">${[["ei","Estoque inicial (t)"],["compras","Compras no período (t)"],["vendas","Vendas no período (t)"],["ef","Estoque final contado (t)"]].map(([k,l]) => `<div class="fld"><label for="bl-${k}">${l}</label><input id="bl-${k}" inputmode="decimal" value="${esc(bl[k])}"></div>`).join("")}</div>
      ${typeof OPS !== "undefined" ? `<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn sm" id="bl-nf">Calcular compras e vendas pelas notas importadas</button><span class="sub" id="bl-nf-st" style="margin:0">${bl.fonteNF ? esc(bl.fonteNF) : ""}</span></div>` : ""}
      <div class="result">${ready ? `Estoque esperado ${fmt(calc,1)} t · contado ${fmt(ef,1)} t · diferença <b style="color:${Math.abs(dif)/Math.max(c,1)>.05?"var(--bad)":"var(--ok)"}">${fmt(dif,1)} t (${fmt(dif/Math.max(c,1)*100,1)}%)</b>` : "Preencha os quatro campos para calcular."}</div>
      ${s.nivel==="N3" ? `<div><h3>Produtividade da área</h3><p class="sub">Volume vendido comparado com área de cacau (CAR) × produtividade de referência em ${esc(s.uf||"—")}: ${ref} kg/ha (valor inicial, a calibrar com o cliente).</p></div>
      <div class="result">${area && vol ? `Capacidade estimada ${fmt(area*ref)} kg · vendido ${fmt(vol*1000)} kg · <b style="color:${vol*1000>area*ref*1.5?"var(--bad)":"var(--ok)"}">${fmt(vol*1000/(area*ref)*100)}% da capacidade</b>` : "Informe área (ha) e volume anual (t) no cadastro."}</div>` : ""}
      <div><h3>Preço frente à cotação</h3><p class="sub">${cotRef(s.uf) ? `Cotação de referência: R$ ${fmt(cotRef(s.uf),2)}/@${S.config.geral?.cotacao ? " (manual, " + esc(S.config.geral.data||"—") + ")" : " (automática)"} · ajuste em Auditoria · Operações comerciais.` : "Sem cotação de referência: aguarde a cotação automática ou registre em Auditoria · Operações comerciais."}</p></div>
      <div class="tbl"><table><thead><tr><th>Contrato</th><th>Preço R$/@</th><th>Desvio</th></tr></thead><tbody>${S.contracts.filter(k=>k.supplierId===s.id).map(k => { const cot = cotRef(s.uf), p = num(k.preco), d = cot && p ? (p-cot)/cot : null; return `<tr><td>${esc(k.numero||"—")}</td><td class="mono">${fmt(p,2)}</td><td class="mono" style="color:${d!=null && d<-.2?"var(--bad)":"inherit"}">${d==null?"—":fmt(d*100,1)+"%"}</td></tr>`; }).join("") || `<tr><td colspan="3" style="color:var(--muted)">Nenhum contrato enviado.</td></tr>`}</tbody></table></div>`;
    $$("input[id^=bl-]", b).forEach(i => i.onchange = () => save(Store.update("suppliers", s.id, {balanco:{[i.id.slice(3)]: i.value}})));
    const bnf = $("#bl-nf", b); if (bnf) bnf.onclick = () => {
      const de = $("#bl-de").value, ate = $("#bl-ate").value, A = OPS.analise(), dd = v => String(v || "").replace(/\D/g, ""), meu = dd(s.doc);
      const noPer = x => { const d = String(x.nf.emissao || "").slice(0,10); return x.nf.situacao !== "cancelada" && (!de || d >= de) && (!ate || d <= ate); };
      const vendas = A.R.filter(x => x.sup?.id === s.id && noPer(x)), compras = A.R.filter(x => x.sup?.id !== s.id && noPer(x) && ((meu && dd(x.nf.tp === "0" ? x.nf.emitDoc : x.nf.destDoc) === meu) || (x.sup && x.sup.parentId === s.id)));
      const t = L => L.reduce((a, x) => a + (x.kg || 0), 0) / 1000;
      if (!vendas.length && !compras.length){ $("#bl-nf-st").textContent = "Nenhuma nota deste fornecedor no período (importe em Auditoria · Operações comerciais)."; return; }
      const fonte = `Pelas notas de ${new Date(de+"T12:00").toLocaleDateString("pt-BR")} a ${new Date(ate+"T12:00").toLocaleDateString("pt-BR")}: ${compras.length} de compra (${fmt(t(compras),1)} t) e ${vendas.length} de venda (${fmt(t(vendas),1)} t).`;
      save(Store.update("suppliers", s.id, {balanco:{de, ate, compras: String(Math.round(t(compras)*10)/10), vendas: String(Math.round(t(vendas)*10)/10), fonteNF: fonte}})).then(() => toast("Compras e vendas calculadas pelas notas")); };
  }
  else if (T==="invest"){
    const v = s.invest || {}; const nflag = invCount(s);
    b.innerHTML = `<div class="head"><div><h3>Investigação ${s.nivel==="N1" ? "da trader" : "do fornecedor"}</h3><p class="sub">Consultas em Receita Federal, PGFN, tribunais, Juntas Comerciais, Cadastro de Empregadores do MTE, IBAMA e mídia. Registre o resultado e a fonte de cada consulta.</p></div>${nflag ? `<span class="pill r-alto">${nflag} alerta(s)</span>` : `<span class="pill r-pend">Sem alertas</span>`}</div>
      <div class="form"><div class="fld"><label for="iv-sit">Situação cadastral do CNPJ</label><select id="iv-sit"><option value="">Não consultado</option>${SIT_CNPJ.map(o => `<option ${v.situacao===o?"selected":""}>${o}</option>`).join("")}</select></div>
      <div class="fld"><label for="iv-dt">Data da consulta</label><input id="iv-dt" type="date" value="${esc(v.dataConsulta)}"></div></div>
      <div class="qgroup">${INV.map(([id,label,tipo,pts],i) => { const x = v[id] || {}; const flagged = (tipo==="sn" && x.v==="sim") || (tipo==="num" && num(x.v) >= 2);
        return `<div class="q" data-iv="${id}"><span class="qn">${String(i+1).padStart(2,"0")}</span><div class="qt">${esc(label)} ${flagged ? `<span class="flag">● RISCO +${pts}</span>` : ""}</div><div class="qa">${tipo==="sn" ? `<div class="seg">${[["sim","Sim"],["nao","Não"],["nc","Não consultado"]].map(([k,l]) => `<button type="button" data-v="${k}" class="${k==="sim"?"risk":k==="nao"?"v-sim":"v-na"}" aria-pressed="${x.v===k}">${l}</button>`).join("")}</div>` : `<input type="text" inputmode="numeric" id="iv-${id}-v" placeholder="Nº de empresas" value="${esc(x.v)}" style="max-width:150px;flex:none">`}<input type="text" id="iv-${id}-n" placeholder="Fonte, processo ou observação" value="${esc(x.n)}" title="${esc(x.n)}" style="flex:1 1 100%;min-width:0;${x.auto ? "border-color:rgba(127,184,230,.45)" : ""}"></div>${x.auto ? `<div class="mono" style="grid-column:2;font-size:10.5px;color:var(--muted);margin-top:2px">AUTOMÁTICO${x.em ? " · " + new Date(x.em).toLocaleDateString("pt-BR") : ""}${x.v === "nc" || !x.v ? " · confirmar manualmente" : ""}</div>` : ""}</div>`; }).join("")}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Fontes públicas para consulta</h3><p class="sub" style="margin:0">Abra a fonte, consulte ${s.doc ? `o documento <b class="mono" style="user-select:all">${esc(s.doc)}</b>` : "o CNPJ/CPF"} e registre acima o resultado e a fonte.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${fontesLista().map(([l,u]) => `<a class="btn sm" href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join("")}</div></div>
      <div class="banner">Dados de sócios são pessoais (LGPD): registre só o necessário à diligência e sempre com a fonte pública consultada.</div>`;
    $("#iv-sit").onchange = e => save(Store.update("suppliers", s.id, {invest:{situacao:e.target.value}}));
    $("#iv-dt").onchange = e => save(Store.update("suppliers", s.id, {invest:{dataConsulta:e.target.value}}));
    EXT_INV.forEach(f => f(s, b));
    $$("[data-iv]", b).forEach(q => { const id = q.dataset.iv;
      $$("[data-v]", q).forEach(btn => btn.onclick = () => save(Store.update("suppliers", s.id, {invest:{[id]:{v: (s.invest?.[id]?.v===btn.dataset.v) ? "" : btn.dataset.v, auto:false, manual:true}}})));
      const nv = $(`#iv-${id}-v`, q); if (nv) nv.onchange = e => save(Store.update("suppliers", s.id, {invest:{[id]:{v:e.target.value, auto:false, manual:true}}}));
      $(`#iv-${id}-n`, q).onchange = e => save(Store.update("suppliers", s.id, {invest:{[id]:{n:e.target.value, auto:false, manual:true}}}));
    });
  }
  else if (EXT_TABS[T]) EXT_TABS[T](s, b, r);
  else if (T==="risco"){
    b.innerHTML = whyBox(s) + `<div class="head"><div><h3>Matriz de risco</h3><p class="sub">Pontuação ${r.score} · alto a partir de 6, médio de 3 a 5. Revisada a cada resposta, foto ou parecer.</p></div>${riskPill(r)}</div>
      ${r.reasons.length ? `<ul class="reasons">${r.reasons.sort((a,b)=>b.pts-a.pts).map(x => `<li><span class="crit">${esc(x.crit)}</span><span>${esc(x.txt)}</span><span class="pts">+${x.pts}</span></li>`).join("")}</ul>` : `<div class="empty">Nenhum indicador de risco até agora.</div>`}
      ${classifyForm(s, r)}`;
    bindClassify(s);
  }
  stepNav(b);
}
const save = p => p.catch(e => { const m = String(e?.message || e || ""), c = String(e?.code || "");
  console.warn("salvar", e); window.KT_ULT_ERRO = {em: new Date().toISOString(), code: c, msg: m};
  toast(/exceeds the maximum|maximum allowed size|too large|1048576/i.test(m) ? "Não foi possível salvar: o registro passou do limite de 1 MB do Firebase" : /permission/i.test(c + m) ? "Não foi possível salvar: sem permissão (regras do Firebase ou acesso apenas de leitura)" : /quota|resource-exhausted/i.test(c + m) ? "Não foi possível salvar: cota do Firebase esgotada (confira o plano)" : /unavailable|network|offline/i.test(c + m) ? "Não foi possível salvar: sem conexão com o Firebase" : "Não foi possível salvar. Seu acesso pode ser apenas de leitura."); });

/* ---------- classificação do analista ---------- */
function classifyForm(s, r){
  const m = s.classificacao || {};
  return `<form id="fcls" class="card" style="display:flex;flex-direction:column;gap:10px" novalidate>
    <h3>Classificação do analista</h3>
    <p class="sub" style="margin:0">Cálculo automático: <b>${RISK_LABEL[r.auto]}</b> (pontuação ${r.score}). O analista Kinsey BR pode confirmar ou reclassificar, com justificativa.${m.nivel ? ` Última classificação: <b>${RISK_LABEL[m.nivel]}</b> em ${dt(m.em)}.` : ""}</p>
    <div class="form"><div class="fld"><label for="cl-nivel">Classificação final</label><select id="cl-nivel"><option value="">Automática (${RISK_LABEL[r.auto]})</option>${["alto","medio","baixo"].map(l => `<option value="${l}" ${m.nivel===l?"selected":""}>${RISK_LABEL[l]}</option>`).join("")}</select></div>
    <div class="fld full"><label for="cl-mot">Justificativa</label><textarea id="cl-mot" placeholder="Ex.: inspeção confirmou estoque e contratos; dívida parcelada e regular">${esc(m.motivo)}</textarea></div></div>
    <p class="err" id="cl-err" hidden></p>
    <button type="submit" class="btn primary" style="align-self:flex-start">Salvar classificação</button></form>`;
}
function bindClassify(s){
  const f = $("#fcls"); if (!f) return;
  f.onsubmit = e => { e.preventDefault(); const nivel = $("#cl-nivel").value, motivo = $("#cl-mot").value.trim();
    if (nivel && !motivo){ $("#cl-err").textContent = "Escreva a justificativa da classificação."; $("#cl-err").hidden = false; return; }
    const body = nivel ? {classificacao:{nivel, motivo, em:nowISO(), por:Store.me.id||""}} : {classificacao:{nivel:"", motivo:"", em:nowISO(), por:Store.me.id||""}};
    save(Store.update("suppliers", s.id, body)).then(() => toast(nivel ? `Classificado como ${RISK_LABEL[nivel]}` : "Voltou para a classificação automática"));
  };
}
function quickClassify(id, nivel){
  const sp = supById(id); if (!sp) return;
  const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 35; d.style.alignItems = "center";
  d.innerHTML = `<form class="card" style="max-width:420px;margin:16px;display:flex;flex-direction:column;gap:12px;background:var(--navy)" novalidate><h3>${nivel ? "Classificar como " + RISK_LABEL[nivel] : "Voltar ao automático"}</h3><p class="sub" style="margin:0">${esc(sp.nome)}</p>${nivel ? `<div class="fld"><label for="qc-mot">Justificativa</label><textarea id="qc-mot" required></textarea></div>` : ""}<p class="err" id="qc-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-c>Cancelar</button><button type="submit" class="btn primary">Confirmar</button></div></form>`;
  document.body.appendChild(d); const close = () => { d.remove(); renderCadeia(); };
  d.querySelector("[data-c]").onclick = close;
  d.querySelector("form").onsubmit = e => { e.preventDefault(); const mot = nivel ? d.querySelector("#qc-mot").value.trim() : "";
    if (nivel && !mot){ const er = d.querySelector("#qc-err"); er.textContent = "A justificativa é obrigatória."; er.hidden = false; return; }
    save(Store.update("suppliers", id, {classificacao:{nivel, motivo:mot, em:nowISO(), por:Store.me.id||""}})).then(() => toast(nivel ? `Classificado como ${RISK_LABEL[nivel]}` : "Classificação automática"));
    d.remove(); };
}
async function baixarCSV(nome, head, linhas){
  const q = v => `"${fixMoji(v).replace(/"/g,'""')}"`, data = "\ufeff" + [head.map(q).join(";"), ...linhas.map(l => l.map(q).join(";"))].join("\r\n");
  const fn = `KinseyTec_${String(typeof SEG_NOME !== "undefined" ? SEG_NOME : "").normalize("NFD").replace(/[^\w]+/g, "_").replace(/^_|_$/g, "")}_${nome}_${new Date().toISOString().slice(0,10)}.csv`;
  const dl = window.__ktHost?.use ? await __ktHost.use("downloads").catch(() => null) : null;
  if (!dl){ try{ const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], {type:"text/csv;charset=utf-8"})); a.download = fn; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); toast("Planilha exportada"); }catch(e){ toast("Exportação não concluída."); } return; }
  try{ await dl.save({filename:fn, data}); }catch(e){ if (e?.code !== "cancelled") toast("Exportação não concluída."); }
}
function exportInspCSV(L){
  baixarCSV("auditoria_inspecoes", ["Nível","Fornecedor","CNPJ/CPF","Município","UF","Vende para","Questionário","Documentos","Inspeção","Fotos","NDA","Risco","Pontuação","Motivos"],
    L.map(s => { const r = riskOf(s), ac = answersCount(s), d = s.docs||{}, dl = DOCS[s.nivel], il = INSP[s.nivel], ins = s.insp||{}, par = s.parentId ? supById(s.parentId) : null;
      return [s.nivel, s.nome, s.doc, s.municipio, s.uf, par ? par.nome : (s.nivel==="N1" ? CLI().nome : ""), `${ac.done}/${ac.total}`, `${dl.filter((_,i)=>["ok","ress"].includes(d["d"+i])).length}/${dl.length}${dl.some((_,i)=>d["d"+i]==="ress") ? " (" + dl.filter((_,i)=>d["d"+i]==="ress").length + " com ressalva)" : ""}`, `${il.filter(([id])=>ins[id]?.v).length}/${il.length}`,
        S.evidences.filter(e=>e.supplierId===s.id && PHOTO_TYPES.includes(e.tipo)).length, s.nda?.aceito ? "Sim" : "Não", RISK_LABEL[r.level], r.score, riskWhy(s).items.join(" | ")]; }));
}
async function exportListCSV(rows){
  const head = ["Nível","Fornecedor","CNPJ/CPF","Município","UF","Vende para","Risco","Origem da classificação","Pontuação","Principal motivo","NDA"];
  const q = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const lines = [head.map(q).join(";"), ...rows.map(s => { const r = riskOf(s), par = s.parentId ? supById(s.parentId) : null;
    return [s.nivel, s.nome, s.doc, s.municipio, s.uf, par ? par.nome : (s.nivel==="N1" ? CLI().nome : ""), RISK_LABEL[r.level], r.manual ? "Analista" : "Automática", r.score, riskWhy(s).items[0]||"", s.nda?.aceito ? "Sim" : "Não"].map(q).join(";"); })];
  const data = "\ufeff" + lines.join("\r\n");
  const dl = window.__ktHost?.use ? await __ktHost.use("downloads").catch(() => null) : null;
  if (!dl){ try{ const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], {type:"text/csv;charset=utf-8"})); a.download = `KinseyTec_Cacau_lista_cliente_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }catch(e){ toast("Exportação não concluída."); } return; }
  try{ await dl.save({filename:`KinseyTec_Cacau_lista_cliente_${new Date().toISOString().slice(0,10)}.csv`, data}); }catch(e){ if (e?.code !== "cancelled") toast("Exportação não concluída."); }
}

/* ---------- NDA / LGPD ---------- */
function renderLgpd(s, b){
  const n = s.nda || {};
  b.innerHTML = `
    <div class="banner"><b>Texto em avaliação.</b> Minuta-base de NDA e termo LGPD (${NDA_VERSION}). O Jurídico da Kinsey BR revisa e aprova a versão final antes de enviá-la às traders.</div>
    ${n.aceito ? `<div class="card" style="display:flex;flex-direction:column;gap:8px;border-color:rgba(54,211,153,.45)"><span class="pill r-baixo" style="align-self:flex-start">Termo aceito</span>
      <dl class="kv"><dt>Signatário</dt><dd>${esc(n.nome)} · ${esc(n.cargo)}</dd><dt>Documento</dt><dd class="mono">${esc(n.doc)}</dd><dt>Data e hora</dt><dd>${dt(n.em)}</dd><dt>Versão</dt><dd>${esc(n.versao)}</dd><dt>Validação jurídica</dt><dd>${n.validado ? `Validado em ${dt(n.validadoEm)}${n.validadoAdv?.nome ? " por " + esc(advTxt(n.validadoAdv)) : ""}` : "Aguardando o Jurídico"}</dd></dl></div>` : ""}
    <p class="sub" style="margin:0">Resumo: a Kinsey BR mantém sigilo, usa os dados só na diligência e repassa os resultados ao cliente contratante. Dados pessoais tratados conforme a LGPD, com direitos do titular garantidos.</p>
    <details class="card nda-full"><summary><h3 style="font-size:14px">Ler o termo completo (${NDA_TEXT.length} cláusulas)</h3></summary><div style="display:flex;flex-direction:column;gap:12px;margin-top:12px">${NDA_TEXT.map(([h,t]) => `<div><h3 style="font-size:14px">${esc(h)}</h3><p style="font-size:13.5px;color:#c9d2e0;margin-top:4px;max-width:70ch">${esc(t)}</p></div>`).join("")}</div></details>
    ${n.aceito ? "" : `<form id="fnda" class="card" style="display:flex;flex-direction:column;gap:12px" novalidate>
      <h3>Aceite eletrônico</h3>
      <div class="form"><div class="fld"><label for="nd-nome">Nome do representante</label><input id="nd-nome" value="${esc(s.responsavel)}"></div><div class="fld"><label for="nd-cargo">Cargo</label><input id="nd-cargo"></div><div class="fld full"><label for="nd-doc">CPF do representante</label><input id="nd-doc" inputmode="numeric"></div></div>
      <label class="check"><input type="checkbox" id="nd-c1"> Li e concordo com a confidencialidade e o repasse das informações ao cliente contratante.</label>
      <label class="check"><input type="checkbox" id="nd-c2"> Estou ciente do tratamento dos dados pessoais descrito acima (LGPD) e dos direitos do titular.</label>
      <label class="check"><input type="checkbox" id="nd-c3"> Declaro que as informações e documentos enviados são verdadeiros.</label>
      <p class="err" id="nd-err" hidden></p>
      <button type="submit" class="btn primary" style="align-self:flex-start">Registrar aceite</button></form>`}`;
  const f = $("#fnda"); if (!f) return;
  f.onsubmit = e => { e.preventDefault(); const v = id => $(id).value.trim();
    const err = !v("#nd-nome") || !v("#nd-cargo") || !v("#nd-doc") ? "Preencha nome, cargo e CPF do representante." : !($("#nd-c1").checked && $("#nd-c2").checked && $("#nd-c3").checked) ? "Marque as três declarações para registrar o aceite." : null;
    if (err){ $("#nd-err").textContent = err; $("#nd-err").hidden = false; return; }
    save(Store.update("suppliers", s.id, {nda:{aceito:true, nome:v("#nd-nome"), cargo:v("#nd-cargo"), doc:v("#nd-doc"), em:nowISO(), versao:NDA_VERSION, registradoPor:Store.me.id||""}})).then(() => { toast("Aceite registrado. Próximo passo: questionário"); setTab("quest"); });
  };
}

/* ================= AUDITORIA ================= */
/* Auditoria: matriz e testes | operações comerciais (notas, pedidos e pagamentos conferidos pelos auditores do cliente) */
function audTabs(){ return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${[["risco","Matriz de risco, testes e órgãos públicos"],["ops","Operações comerciais · notas, pedidos e pagamentos"]].map(([k,l]) => `<button type="button" class="btn sm ${(S.audSub||"risco")===k ? "primary" : ""}" data-aud="${k}">${l}</button>`).join("")}</div>`; }
function renderAuditoria(){
  if (S.audSub === "ops" && EXT_VIEWS.operacoes){ $("#auditoria").innerHTML = audTabs() + `<div id="operacoes" style="display:flex;flex-direction:column;gap:16px"></div>`; EXT_VIEWS.operacoes(); }
  else { renderAuditoriaBase(); $("#auditoria").insertAdjacentHTML("afterbegin", audTabs()); }
  $$("#auditoria [data-aud]").forEach(b => b.onclick = () => { S.audSub = b.dataset.aud; renderAuditoria(); try{ $("#v-auditoria").scrollTop = 0; }catch(e){} });
}
function renderAuditoriaBase(){
  const AI = S.ai = S.ai || {lv:"todos", rk:"todos", ord:"risco", mais:false}, RO = {alto:0, medio:1, baixo:2, pend:3};
  const nomeCmp = (a,b) => fixMoji(a.nome||"").localeCompare(fixMoji(b.nome||""), "pt", {sensitivity:"base"});
  const ORDS = {risco:(a,b) => RO[riskOf(a).level] - RO[riskOf(b).level] || riskOf(b).score - riskOf(a).score || nomeCmp(a,b), nivel:(a,b) => a.nivel.localeCompare(b.nivel) || nomeCmp(a,b), nome:nomeCmp, uf:(a,b) => (a.uf||"").localeCompare(b.uf||"") || nomeCmp(a,b)};
  const supsAll = S.suppliers.filter(s => (AI.lv==="todos" || s.nivel===AI.lv) && (AI.rk==="todos" || riskOf(s).level===AI.rk)).sort(ORDS[AI.ord] || ORDS.risco);
  const sups = AI.mais ? supsAll : supsAll.slice(0, 15);
  const rows = sups.map(s => { const r = riskOf(s), ac = answersCount(s), d = s.docs||{}, dl = DOCS[s.nivel], dok = dl.filter((_,i)=>["ok","ress"].includes(d["d"+i])).length, il = INSP[s.nivel], ins = s.insp||{}, iok = il.filter(([id])=>ins[id]?.v).length, fotos = S.evidences.filter(e=>e.supplierId===s.id && PHOTO_TYPES.includes(e.tipo)).length;
    return `<tr data-open="${s.id}" style="cursor:pointer"><td><span class="lvtag">${s.nivel}</span></td><td style="min-width:160px">${esc(s.nome)}</td><td class="mono">${ac.done}/${ac.total}</td><td class="mono">${dok}/${dl.length}</td><td class="mono">${iok}/${il.length}</td><td class="mono" style="color:${fotos<3?"var(--warn)":"inherit"}">${fotos}/3</td><td>${s.nda?.aceito?"✓":"—"}</td><td>${riskPill(r)}</td><td style="min-width:220px;font-size:12px">${esc(riskWhy(s).items[0]||"")}${AI.mais ? riskWhy(s).items.slice(1, 4).map(t => `<div style="color:var(--muted);margin-top:2px">${esc(t)}</div>`).join("") : ""}</td></tr>`; }).join("");
  const aiChip = (k, v, l, n) => `<button type="button" class="fbtn ${AI[k]===v ? "on" : ""}" aria-pressed="${AI[k]===v}" data-ai="${k}:${v}">${l}${n != null ? ` <b>${n}</b>` : ""}</button>`;
  const cntLv = l => S.suppliers.filter(s => l==="todos" || s.nivel===l).length, cntRk = k => S.suppliers.filter(s => (AI.lv==="todos" || s.nivel===AI.lv) && riskOf(s).level===k).length;
  const aiBar = `<div class="card" style="display:flex;flex-direction:column;gap:8px;padding:10px 12px" id="ai-bar">
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="eyebrow" style="margin:0 4px 0 0">Nível</span>${["todos","N1","N2","N3"].map(l => aiChip("lv", l, l==="todos" ? "Todos" : l, cntLv(l))).join("")}
        <span class="eyebrow" style="margin:0 4px 0 10px">Risco</span>${aiChip("rk","todos","Todos")}${[["alto","Alto"],["medio","Médio"],["baixo","Baixo"],["pend","Em avaliação"]].map(([k,l]) => aiChip("rk", k, l, cntRk(k))).join("")}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="eyebrow" style="margin:0 4px 0 0">Ordenar</span>${[["risco","Maior risco"],["nivel","Nível"],["nome","A–Z"],["uf","UF"]].map(([k,l]) => aiChip("ord", k, l)).join("")}
        <span style="flex:1"></span><button type="button" class="btn sm ghost" id="ai-mais">${AI.mais ? "Recolher" : `Expandir (${supsAll.length})`}</button><button type="button" class="btn sm" id="ai-csv">Exportar para Excel</button></div></div>`;
  $("#auditoria").innerHTML = `
    ${(() => { const L = S.suppliers; const c = f => L.filter(f).length;
      const items = [["CNPJ não ativo", c(s => s.invest?.situacao && s.invest.situacao!=="Ativa")], ["Dívida ativa", c(s => s.invest?.divida?.v==="sim")], ["Sócio PEP / político", c(s => s.invest?.pep?.v==="sim")], ["Sócio preso ou investigado", c(s => s.invest?.prisao?.v==="sim")], ["Abre e fecha CNPJs", c(s => num(s.invest?.rotat?.v) >= 2)], ["Lista suja MTE", c(s => s.invest?.mte?.v==="sim")]]; const fixed = ["divida","pep","prisao","rotat","mte","protestos","proc_trab","proc_crim","midia"]; INV.filter(([id,,tipo,pts]) => tipo==="sn" && pts >= 4 && !fixed.includes(id)).forEach(([id,label]) => items.push([label.replace(/\s*\(.*?\)/g,"").replace(/ — .*$/,"").slice(0,48), c(s => s.invest?.[id]?.v==="sim")]));
      return `<div class="head"><div><div class="eyebrow">Investigação das traders</div><h2>Alertas de integridade</h2><p class="sub">${c(s => s.nivel==="N1")} traders na base · ${c(s => s.nivel==="N1" && s.uf==="PA")} no Pará · ${c(s => invCount(s) > 0)} fornecedor(es) com alerta.</p></div></div>
      <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${items.map(([l,n]) => `<div class="stat"><div class="n" style="color:${n?"var(--bad)":"inherit"}">${n}</div><div class="l">${l}</div></div>`).join("")}</div>`; })()}
    ${setorNews().length ? `<div class="head"><div><div class="eyebrow">Inteligência do setor · fontes públicas</div><h2>Alertas e operações recentes</h2><p class="sub">Notícias públicas que ajudam a identificar padrões de risco na cadeia. Use para orientar a investigação e a inspeção.</p></div></div>
    <div class="card" style="display:flex;flex-direction:column;gap:10px">${setorNews().map(([d,t,r,u]) => `<div style="border-left:3px solid var(--bad);padding-left:10px"><div class="mono" style="font-size:11px;color:var(--muted)">${esc(d)}</div><b>${esc(t)}</b><div class="sub" style="margin:2px 0 0">${esc(r)}</div>${u ? `<a href="${u}" target="_blank" rel="noopener" style="font-size:12px;color:var(--glow)">Fonte ↗</a>` : ""}</div>`).join("")}</div>` : ""}
    ${auditTests().length ? `<div class="head"><div><div class="eyebrow">Asseguração · testes baseados em alertas do setor</div><h2>Programa de testes substantivos</h2><p class="sub">Cada alerta público vira um procedimento de auditoria com evidência exigida. A cobertura mostra quantos fornecedores do nível já têm todas as evidências no repositório.</p></div></div>
    <div class="card tbl" style="padding:6px 8px"><table><thead><tr><th>Padrão de risco</th><th>Níveis</th><th>Procedimento de auditoria</th><th>Evidência exigida</th><th>Cobertura</th></tr></thead><tbody>${auditTests().map(([id,niv,pad,proc,evs,ni]) => { const L = S.suppliers.filter(s => niv.includes(s.nivel)), ok = L.filter(s => evs.every(t => S.evidences.some(e => e.supplierId===s.id && e.tipo===t))).length, n = setorNews()[ni];
      return `<tr><td style="min-width:170px"><b>${esc(pad)}</b>${n && n[3] ? `<div><a href="${n[3]}" target="_blank" rel="noopener" style="font-size:11.5px;color:var(--glow)">Fonte ↗</a></div>` : ""}</td><td class="mono">${niv.join(" ")}</td><td style="min-width:240px;font-size:12.5px">${esc(proc)}</td><td style="min-width:160px;font-size:12.5px">${evs.map(esc).join(" · ")}</td><td class="mono" style="color:${L.length && ok<L.length ? "var(--warn)" : "inherit"}">${ok}/${L.length}</td></tr>`; }).join("")}</tbody></table></div>` : ""}
    <div class="head"><div><div class="eyebrow">Programa de trabalho</div><h2>Auditoria e inspeções</h2><p class="sub">Andamento por fornecedor: questionário, documentos, inspeção física, fotos mínimas e NDA. Toque numa linha para abrir o dossiê. ${supsAll.length > sups.length ? `Mostrando ${sups.length} de ${supsAll.length}.` : `${supsAll.length} fornecedor(es).`}</p></div></div>
    ${aiBar}
    <div class="card tbl" style="padding:6px 8px" id="ai-tbl"><table><thead><tr><th>Nível</th><th>Fornecedor</th><th>Quest.</th><th>Docs</th><th>Inspeção</th><th>Fotos</th><th>NDA</th><th>Risco</th><th>Principal motivo</th></tr></thead><tbody>${rows || `<tr><td colspan="9" style="color:var(--muted);padding:18px 8px">Cadastre fornecedores na aba Cadeia para iniciar o programa.</td></tr>`}</tbody></table></div>
    <div class="head"><div><div class="eyebrow">Kit de diligência</div><h2>Lista de questionamentos iniciais</h2><p class="sub">Perguntas enviadas a cada nível pelo aplicativo. As marcadas com ● geram indicador de risco conforme a resposta.</p></div></div>
    <div class="lib">${["N1","N2","N3"].map(l => `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${l} · ${l==="N1"?"Traders":l==="N2"?"Fornecedores":"Produtores"}</h3><span class="mono" style="color:var(--muted);font-size:12px">${Q[l].flatMap(g=>g.items).length} perguntas</span></div>${Q[l].map(g => `<div class="eyebrow" style="margin-top:14px">${g.g}</div><ol start="${Q[l].slice(0, Q[l].indexOf(g)).reduce((t,x)=>t+x.items.length,0)+1}">${g.items.map(([,t,r]) => `<li>${esc(t)}${r?` <span style="color:var(--bad)">●</span>`:""}</li>`).join("")}</ol>`).join("")}</div>`).join("")}</div>
    <details class="card"><summary><h3>Checklist documental por nível</h3></summary><div class="lib" style="margin-top:12px">${["N1","N2","N3"].map(l => `<div><div class="eyebrow">${l}</div><ol>${DOCS[l].map(t=>`<li>${esc(t)}</li>`).join("")}</ol></div>`).join("")}</div></details>
    <details class="card"><summary><h3>Procedimentos de inspeção física</h3></summary><div class="lib" style="margin-top:12px">${["N1","N2","N3"].map(l => `<div><div class="eyebrow">${l}</div><ol>${INSP[l].map(([,t])=>`<li>${esc(t)}</li>`).join("")}</ol></div>`).join("")}</div></details>
    <details class="card"><summary><h3>Critérios da matriz de risco</h3></summary><div class="tbl" style="margin-top:10px"><table><thead><tr><th>Critério</th><th>Indicador no app</th><th>Pontos</th></tr></thead><tbody>
      <tr><td>Condições de trabalho</td><td>MTE, menores, retenção de documentos (resposta de risco)</td><td class="mono">+5</td></tr>
      <tr><td>Coerência operacional</td><td>Balanço de massa com diferença acima de 5%</td><td class="mono">+3</td></tr>
      <tr><td>Origem e território</td><td>N3 sem CAR; volume acima de 1,5× a capacidade da área</td><td class="mono">+3</td></tr>
      <tr><td>Contratual</td><td>Contrato reprovado pelo Jurídico</td><td class="mono">+3</td></tr>
      <tr><td>Perfil societário</td><td>CNPJ com menos de 2 anos</td><td class="mono">+2</td></tr>
      <tr><td>Preços e pagamentos</td><td>Preço mais de 20% abaixo da cotação; pagamento em espécie</td><td class="mono">+2</td></tr>
      <tr><td>Geolocalização</td><td>Foto tirada a mais de 5 km do local declarado</td><td class="mono">+2</td></tr>
      <tr><td>Demais respostas de risco</td><td>Cada resposta marcada ● no questionário</td><td class="mono">+2</td></tr>
      <tr><td>Cooperação / LGPD</td><td>NDA não assinado; questionário abaixo de 50%; menos de 3 fotos</td><td class="mono">+1</td></tr>
    </tbody></table></div><p class="sub" style="margin-top:10px">Alto risco a partir de 6 pontos, médio de 3 a 5, baixo abaixo de 3. Pesos iniciais a validar com o cliente na etapa preparatória.</p></details>`;
  $$("#auditoria [data-open]").forEach(r => r.onclick = () => openSupplier(r.dataset.open));
  $$("#auditoria [data-ai]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.ai.split(":"); AI[k] = v; renderAuditoria(); setTimeout(() => $("#ai-bar")?.scrollIntoView({block:"nearest"}), 50); });
  const aim = $("#ai-mais"); if (aim) aim.onclick = () => { AI.mais = !AI.mais; renderAuditoria(); setTimeout(() => $("#ai-bar")?.scrollIntoView({block:"nearest"}), 50); };
  const aic = $("#ai-csv"); if (aic) aic.onclick = () => exportInspCSV(supsAll);
  bindRpt();
  EXT_AUD.forEach(f => f());
}

/* ================= JURÍDICO ================= */
function renderJuridico(){
  const st = k => S.pareceres[k.id]?.status || "pendente";
  const list = S.contracts.filter(k => S.ctFilter==="todos" || st(k)===S.ctFilter).sort((a,b) => (b.criadoEm||"").localeCompare(a.criadoEm||""));
  const cnt = s => S.contracts.filter(k => st(k)===s).length;
  const ndaPend = S.suppliers.filter(s => s.nda?.aceito && !s.nda?.validado), ndaSemAll = S.suppliers.filter(s => !s.nda?.aceito);
  const NF = S.ndaF = S.ndaF || {lv:"todos", rk:"todos"}, ndaCmp = (a,b) => fixMoji(a.nome||"").localeCompare(fixMoji(b.nome||""), "pt", {sensitivity:"base"});
  const ndaSem = ndaSemAll.filter(s => (NF.lv==="todos" || s.nivel===NF.lv) && (NF.rk==="todos" || riskOf(s).level===NF.rk)).sort(ndaCmp);
  const ndaChip = (k, v, l) => `<button type="button" class="fbtn ${NF[k]===v ? "on" : ""}" aria-pressed="${NF[k]===v}" data-ndaf="${k}:${v}">${l} <b>${ndaSemAll.filter(s => (k==="lv" ? (v==="todos" || s.nivel===v) && (NF.rk==="todos" || riskOf(s).level===NF.rk) : (NF.lv==="todos" || s.nivel===NF.lv) && (v==="todos" || riskOf(s).level===v))).length}</b></button>`;
  const cot = S.config.geral || {};
  const canDecide = Store.me.canEdit;
  $("#juridico").innerHTML = `
    <div class="head"><div><div class="eyebrow">Advogados de diligência</div><h2>Aprovação remota de contratos</h2><p class="sub">Contratos entre traders e fornecedores enviados pelo campo. O Jurídico revisa as cláusulas e emite o parecer daqui mesmo.</p></div><button type="button" class="btn primary" id="ct-add"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Enviar contrato</button></div>
    ${canDecide ? "" : `<div class="banner">Você pode enviar contratos. <b>Pareceres</b> são emitidos por quem tem acesso de Editor (equipe jurídica).</div>`}
    <div class="filters">${[["pendente","Pendentes"],["ressalvas","Com ressalvas"],["aprovado","Aprovados"],["reprovado","Reprovados"],["todos","Todos"]].map(([k,l]) => `<button type="button" class="fbtn" data-cf="${k}" aria-pressed="${S.ctFilter===k}">${l}${k!=="todos" ? ` · ${cnt(k)}` : ""}</button>`).join("")}</div>
    <div style="display:flex;flex-direction:column;gap:8px">${list.length ? list.map(k => { const s = supById(k.supplierId), p = S.pareceres[k.id];
      return `<div class="ct" data-ct="${k.id}" role="button" tabindex="0"><div style="min-width:0"><b>${esc(k.tipo||"Contrato")} ${k.numero ? "nº "+esc(k.numero) : ""}</b><div class="meta"><span>${esc(s?.nome||"Fornecedor removido")} → ${esc(k.contraparte||"—")}</span><span class="mono">${k.volume ? fmt(num(k.volume),1)+" t" : ""} ${k.preco ? "· R$ "+fmt(num(k.preco),2)+"/@" : ""}</span><span>enviado ${dt(k.criadoEm)}</span>${p?.advogado?.nome ? `<span>parecer: ${esc(advTxt(p.advogado))}</span>` : ""}</div></div><span class="pill st-${st(k)}">${st(k)==="ressalvas"?"Com ressalvas":st(k)[0].toUpperCase()+st(k).slice(1)}</span></div>`; }).join("")
      : `<div class="empty">Nenhum contrato ${S.ctFilter==="todos" ? "enviado ainda" : "nesta situação"}.</div>`}</div>
    ${typeof CLAUSE_INFO !== "undefined" ? `<details class="card"><summary><h3>Matriz jurídica das cláusulas</h3></summary><p class="sub">Base legal de referência e o que verificar em cada cláusula. Cláusula essencial ausente leva à recomendação de reprovação ou de plano de ação. Referências para apoio; a conclusão é do advogado responsável.</p>
      <div class="tbl"><table><thead><tr><th>Cláusula</th><th>Base legal</th><th>O que verificar</th></tr></thead><tbody>${CLAUSES.map(([cid,t]) => { const ci = clauseInfo(cid); return ci ? `<tr><td style="min-width:200px">${esc(t)}${ci[2] ? ` <span class="pill r-alto" style="font-size:10px;padding:1px 7px">Essencial</span>` : ""}</td><td style="min-width:180px;font-size:12.5px">${esc(ci[0])}</td><td style="min-width:200px;font-size:12.5px">${esc(ci[1])}</td></tr>` : ""; }).join("")}</tbody></table></div></details>` : ""}
    <div class="card" style="display:flex;flex-direction:column;gap:12px">
      <div class="head"><div><h3>NDA e termos LGPD</h3><p class="sub">${S.suppliers.length - ndaSem.length} de ${S.suppliers.length} fornecedores com aceite registrado. ${ndaPend.length} aguardando validação jurídica.</p></div></div>
      ${ndaPend.map(s => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:10px"><div style="min-width:0"><b style="font-size:13.5px">${esc(s.nome)}</b><div class="sub" style="margin:0">${esc(s.nda.nome)} · ${esc(s.nda.cargo)} · ${dt(s.nda.em)}</div></div><button type="button" class="btn sm ok" data-valnda="${s.id}" ${canDecide?"":"disabled"}>Validar termo</button></div>`).join("")}
      ${ndaSemAll.length ? `<div style="border-top:1px solid var(--line);padding-top:10px" id="nda-sem"><div class="eyebrow" style="margin-bottom:6px">Sem aceite (${ndaSemAll.length}) · ordem alfabética</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${["todos","N1","N2","N3"].map(l => ndaChip("lv", l, l==="todos" ? "Todos os níveis" : l)).join("")}<span style="width:8px"></span>${[["todos","Todos os riscos"],["alto","Alto"],["medio","Médio"],["baixo","Baixo"],["pend","Em avaliação"]].map(([k,l]) => ndaChip("rk", k, l)).join("")}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${ndaSem.length ? ndaSem.map(s => { const lv = riskOf(s).level; return `<button type="button" class="fbtn" data-nda="${s.id}" title="${RISK_LABEL[lv]}"><svg width="10" height="10" aria-hidden="true" style="margin-right:5px"><circle cx="5" cy="5" r="4.5" fill="${RCOL[lv] || RCOL.pend}"/></svg>${s.nivel} · ${esc(s.nome)}</button>`; }).join("") : `<span class="sub" style="margin:0">Nenhum fornecedor sem aceite neste filtro.</span>`}</div></div>` : ""}
    </div>
    <form class="card" id="fcot" style="display:flex;flex-direction:column;gap:10px" novalidate><h3>Cotação de referência do cacau</h3><p class="sub" style="margin:0">Usada para comparar o preço dos contratos e apontar preços impraticáveis (mais de 20% abaixo).</p>
      <div class="form"><div class="fld"><label for="cot-v">R$ por arroba (15 kg)</label><input id="cot-v" inputmode="decimal" value="${esc(cot.cotacao)}"></div><div class="fld"><label for="cot-d">Data / fonte</label><input id="cot-d" value="${esc(cot.data)}" placeholder="ex.: 03/11/2026 · fonte"></div></div>
      <button type="submit" class="btn sm" style="align-self:flex-start">Salvar cotação</button></form>`;
  $("#ct-add").onclick = () => openContractForm();
  $$("[data-cf]").forEach(b => b.onclick = () => { S.ctFilter = b.dataset.cf; renderJuridico(); });
  $$("[data-ct]").forEach(c => { c.onclick = () => openContract(c.dataset.ct); c.onkeydown = e => { if (e.key==="Enter") openContract(c.dataset.ct); }; });
  $$("[data-nda]").forEach(b => b.onclick = () => openSupplier(b.dataset.nda, "lgpd"));
  $$("[data-ndaf]").forEach(b => b.onclick = () => { const [k, v] = b.dataset.ndaf.split(":"); NF[k] = v; renderJuridico(); setTimeout(() => $("#nda-sem")?.scrollIntoView({block:"nearest"}), 50); });
  $$("[data-valnda]").forEach(b => b.onclick = () => { const s = supById(b.dataset.valnda); if (!s) return;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Validação jurídica</div><h2>${esc(s.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b"><form id="fvnda" class="card" style="display:flex;flex-direction:column;gap:12px" novalidate><p class="sub" style="margin:0">Termo aceito por ${esc(s.nda.nome || "—")} em ${dt(s.nda.em)}. Registre o advogado que validou.</p>
      ${advCampos("vn", advPadrao(), false)}<p class="err" id="vnerr" hidden></p><button type="submit" class="btn ok" style="align-self:flex-start">Validar termo</button></form></div>`);
    $("#fvnda").onsubmit = e => { e.preventDefault(); const adv = advLer("vn"); if (!adv){ $("#vnerr").textContent = ADV_ERR; $("#vnerr").hidden = false; return; }
      save(Store.update("suppliers", s.id, {nda:{validado:true, validadoEm:nowISO(), validadoPor:Store.me.id||"", validadoAdv:adv}})).then(() => { close(); toast("Termo validado"); }); }; });
  EXT_JUR.forEach(f => f());
  $("#fcot").onsubmit = e => { e.preventDefault(); const body = {cotacao:$("#cot-v").value.trim(), data:$("#cot-d").value.trim(), em:nowISO()}; save(Store.set("config", "geral", body)).then(() => toast("Cotação salva")); };
}
function supOptions(sel){ return S.suppliers.slice().sort((a,b)=>a.nivel.localeCompare(b.nivel)||(a.nome||"").localeCompare(b.nome||"")).map(s => `<option value="${s.id}" ${sel===s.id?"selected":""}>${s.nivel} · ${esc(s.nome)}</option>`).join(""); }
function openContractForm(preSup){
  if (!S.suppliers.length){ toast("Cadastre um fornecedor antes de enviar contratos."); return; }
  const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Para o Jurídico</div><h2>Enviar contrato comercial</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <form class="sheet-b" id="fct" novalidate><div class="form">
      <div class="fld full"><label for="c-sup">Fornecedor que apresenta o contrato</label><select id="c-sup">${supOptions(preSup)}</select></div>
      <div class="fld"><label for="c-tipo">Tipo</label><select id="c-tipo">${["Compra e venda de cacau","Fornecimento contínuo","Armazenagem","Parceria / meação","Prestação de serviço","Outro"].map(t=>`<option>${t}</option>`).join("")}</select></div>
      <div class="fld"><label for="c-num">Número / referência</label><input id="c-num"></div>
      <div class="fld full"><label for="c-cp">Contraparte</label><input id="c-cp" placeholder="Quem compra ou vende do outro lado"></div>
      <div class="fld"><label for="c-ini">Início da vigência</label><input id="c-ini" type="date"></div><div class="fld"><label for="c-fim">Fim da vigência</label><input id="c-fim" type="date"></div>
      <div class="fld"><label for="c-vol">Volume (t)</label><input id="c-vol" inputmode="decimal"></div><div class="fld"><label for="c-pr">Preço (R$ por arroba)</label><input id="c-pr" inputmode="decimal"></div>
      <div class="fld full"><label for="c-file">Arquivo do contrato (PDF ou foto)</label><input id="c-file" type="file" accept="application/pdf,image/*"></div>
      <div class="fld full"><label for="c-obs">Observações para o Jurídico</label><textarea id="c-obs"></textarea></div>
    </div><p class="err" id="cerr" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary" id="c-go">Enviar para aprovação</button></div></form>`);
  $("#fct").onsubmit = async e => {
    e.preventDefault(); const v = id => $(id).value.trim(); const f = $("#c-file").files[0];
    if (!v("#c-cp")){ $("#cerr").textContent = "Informe a contraparte do contrato."; $("#cerr").hidden = false; return; }
    $("#c-go").disabled = true; $("#c-go").textContent = "Enviando…";
    try{
      let file = null; if (f){ const blob = /^image\//.test(f.type) ? await shrink(f) : f; const up = await Store.upload(blob); file = {...up, nome:f.name, mime:blob.type||f.type}; }
      await Store.set("contracts", uid(), {supplierId:v("#c-sup"), tipo:v("#c-tipo"), numero:v("#c-num"), contraparte:v("#c-cp"), inicio:v("#c-ini"), fim:v("#c-fim"), volume:v("#c-vol"), preco:v("#c-pr"), obs:v("#c-obs"), file, criadoEm:nowISO(), criadoPor:Store.me.id||""});
      close(); toast("Contrato enviado ao Jurídico");
    }catch(x){ $("#cerr").textContent = x?.code==="quota_exceeded" ? "Espaço de arquivos cheio. Remova anexos antigos." : "Não foi possível enviar. Verifique a conexão e o seu nível de acesso."; $("#cerr").hidden = false; $("#c-go").disabled = false; $("#c-go").textContent = "Enviar para aprovação"; }
  };
}

/* ===== advogado responsável pelo parecer (nome + OAB) ===== */
const UFS_OAB = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
function oabFmt(v){
  const t = String(v || "").toUpperCase().replace(/OAB/g, " ");
  const uf = (t.match(/\b[A-Z]{2}\b/g) || []).find(u => UFS_OAB.includes(u)), m = t.match(/\d[\d.\s]*/);
  const n = m ? m[0].replace(/\D/g, "") : "", suf = (t.match(/\d\s*-?\s*([AB])\b/) || [])[1] || "";
  if (!uf || !n || n.length > 7 || !+n) return "";
  return `OAB/${uf} ${(+n).toLocaleString("pt-BR")}${suf ? "-" + suf : ""}`;
}
function advPadrao(){
  try{ const j = JSON.parse(localStorage.getItem("kt-adv") || "null"); if (j && j.nome) return j; }catch(e){}
  const meus = Object.values(S.pareceres).filter(p => p.por && p.por === Store.me.id && p.advogado?.nome).sort((a, b) => String(b.em).localeCompare(String(a.em)));
  return meus[0]?.advogado || {nome:"", oab:""};
}
/* produtos em que o advogado só assina o parecer final (ex.: M&A): os pareceres por documento não pedem nome nem OAB */
const advSoFinal = () => window.KT_ADV_POR_DOC === false;
function advLer(pre){
  if (advSoFinal() && !$("#" + pre + "-adv")) return {nome: "", oab: "", por: Store.me?.email || "", porDoc: true};
  const nome = $("#" + pre + "-adv").value.trim().replace(/\s+/g, " "), oab = oabFmt($("#" + pre + "-oab").value);
  if (nome.split(" ").length < 2 || nome.length < 5 || !oab) return null;
  const a = {nome, oab}; try{ localStorage.setItem("kt-adv", JSON.stringify(a)); }catch(e){} return a;
}
const advTxt = a => a && a.nome ? a.nome + (a.oab ? " · " + a.oab : "") : "";
const advCampos = (pre, a, dis) => advSoFinal() ? `<p class="sub" style="margin:0;font-size:12px">O nome e a OAB do advogado entram só no parecer jurídico final.</p>` : `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
  <div class="fld"><label for="${pre}-adv">Advogado responsável</label><input id="${pre}-adv" autocomplete="name" placeholder="Nome completo" value="${esc(a.nome || "")}" ${dis ? "disabled" : ""}></div>
  <div class="fld"><label for="${pre}-oab">OAB (UF e número)</label><input id="${pre}-oab" placeholder="OAB/SP 123.456" value="${esc(a.oab || "")}" ${dis ? "disabled" : ""}></div></div>`;
const ADV_ERR = "Informe o nome completo e a OAB do advogado responsável (ex.: OAB/SP 123.456).";
async function openContract(id){
  const k = S.contracts.find(x => x.id===id); if (!k) return; const s = supById(k.supplierId), p = S.pareceres[id] || {};
  const cot = cotRef(s?.uf), pr = num(k.preco), dv = cot && pr ? (pr-cot)/cot : null;
  let who = ""; if (p.por && Store.user){ try{ const ps = await Store.user.profiles([p.por]); who = ps[p.por]?.name || ""; }catch(e){} }
  const canDecide = Store.me.canEdit;
  const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(k.tipo)} ${k.numero ? "· nº "+esc(k.numero) : ""}</div><h2>${esc(s?.nome||"—")} → ${esc(k.contraparte)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="sheet-b">
      <dl class="kv"><dt>Vigência</dt><dd>${k.inicio ? new Date(k.inicio+"T12:00").toLocaleDateString("pt-BR") : "—"} a ${k.fim ? new Date(k.fim+"T12:00").toLocaleDateString("pt-BR") : "—"}</dd><dt>Volume</dt><dd>${k.volume ? fmt(num(k.volume),1)+" t" : "—"}</dd>
        <dt>Preço</dt><dd>${pr ? "R$ "+fmt(pr,2)+"/@" : "—"} ${dv!=null ? `<span class="mono" style="color:${dv<-.2?"var(--bad)":"var(--muted)"}">(${dv>0?"+":""}${fmt(dv*100,1)}% vs. cotação)</span>` : ""}</dd><dt>Enviado</dt><dd>${dt(k.criadoEm)}</dd><dt>Observações</dt><dd>${esc(k.obs||"—")}</dd></dl>
      ${k.file ? (/^image\//.test(k.file.mime) ? `<img class="preview" src="${esc(k.file.url)}" alt="Contrato">` : `<a class="btn" href="${esc(k.file.url)}" target="_blank" rel="noopener">Abrir arquivo · ${esc(k.file.nome||"contrato")} ↗</a>`) : `<div class="banner">Nenhum arquivo anexado.</div>`}
      <form id="fpar" class="card" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <h3>Revisão de cláusulas</h3>
        <div class="clauses">${CLAUSES.map(([cid,t]) => { const ci = clauseInfo(cid); return `<label class="check" style="align-items:flex-start"><input type="checkbox" id="cl-${cid}" ${p.clausulas?.[cid]?"checked":""} ${canDecide?"":"disabled"}> <span>${esc(t)}${ci && ci[2] ? ` <span class="pill r-alto" style="font-size:10px;padding:1px 7px">Essencial</span>` : ""}${ci ? `<span style="display:block;font-size:11.5px;color:var(--muted);margin-top:3px">Base legal: ${esc(ci[0])}</span><span style="display:block;font-size:11.5px;color:var(--muted)">Verificar: ${esc(ci[1])}</span>` : ""}</span></label>`; }).join("")}</div>
        ${canDecide ? `<button type="button" class="btn sm" id="par-gen" style="align-self:flex-start">Gerar minuta do parecer</button>` : ""}
        <div class="fld"><label for="par-txt">Parecer jurídico</label><textarea id="par-txt" ${canDecide?"":"disabled"} placeholder="Fundamentação, ressalvas e plano de ação">${esc(p.parecer)}</textarea></div>
        ${canDecide ? advCampos("par", p.advogado || advPadrao(), false) : ""}
        ${p.status ? `<div class="banner">Último parecer: <b>${esc(p.status)}</b> em ${dt(p.em)}${who ? " por "+esc(who) : ""}.${p.advogado?.nome ? `<br>Advogado responsável: <b>${esc(p.advogado.nome)}</b> · ${esc(p.advogado.oab || "")}` : ""}</div>` : ""}
        <p class="err" id="perr" hidden></p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${canDecide ? `<button type="button" class="btn ok" data-dec="aprovado">Aprovar</button><button type="button" class="btn warn" data-dec="ressalvas">Aprovar com ressalvas</button><button type="button" class="btn bad" data-dec="reprovado">Reprovar</button>` : `<span class="sub">Aguardando parecer da equipe jurídica.</span>`}<span style="flex:1"></span><button type="button" class="btn sm ghost" id="ct-del">Excluir envio</button></div>
      </form></div>`);
  const pg = $("#par-gen"); if (pg) pg.onclick = () => {
    const cl = CLAUSES.map(([cid,t]) => ({t, ok:$("#cl-"+cid).checked, ci:clauseInfo(cid)})), falta = cl.filter(c => !c.ok), crit = falta.filter(c => c.ci && c.ci[2]);
    const r = s ? riskOf(s) : null, top = r ? r.reasons.slice().sort((x,y) => y.pts - x.pts).slice(0,6) : [];
    const sug = crit.length || r?.level==="alto" ? "REPROVAR, ou condicionar a aprovação a plano de ação com prazo e nova verificação" : falta.length || r?.level==="medio" || (dv!=null && dv < -.2) ? "APROVAR COM RESSALVAS, com plano de ação" : "APROVAR";
    const L = [`MINUTA DE PARECER JURÍDICO · ${k.tipo||"Contrato"}${k.numero ? " nº "+k.numero : ""}`, `Partes: ${s?.nome||"—"}${s?.doc ? " (CNPJ/CPF "+s.doc+")" : ""} → ${k.contraparte||"—"} · Data: ${new Date().toLocaleDateString("pt-BR")}`, "",
      "1. Objeto", "Análise das cláusulas de origem, socioambientais, trabalhistas e de integridade do contrato, com base na diligência registrada no sistema.", "",
      "2. Diligência do fornecedor", r ? `Classificação: ${RISK_LABEL[r.level]} (pontuação ${r.score}).` : "Fornecedor não localizado na base."];
    top.forEach(x => L.push(`- ${x.crit}: ${x.txt}`));
    if (dv!=null) L.push(`- Preço ${dv>0?"+":""}${fmt(dv*100,1)}% em relação à cotação de referência${dv < -.2 ? " (mais de 20% abaixo: indício de origem irregular ou subfaturamento)" : ""}.`);
    L.push("", "3. Cláusulas contratuais"); cl.forEach(c => L.push(`${c.ok ? "[x]" : "[ ]"} ${c.t}${c.ci ? " · base: "+c.ci[0] : ""}`));
    if (falta.length){ L.push("", "4. Ressalvas e plano de ação"); falta.forEach(c => L.push(`- Incluir ou reforçar: ${c.t}${c.ci ? ". Verificar: "+c.ci[1] : ""}${c.ci && c.ci[2] ? " (cláusula essencial)" : ""}.`)); }
    L.push("", `${falta.length ? 5 : 4}. Conclusão`, `Recomendação: ${sug}.`, "Minuta gerada a partir dos dados do sistema. Deve ser revisada, completada e assinada pelo advogado responsável.");
    const an = $("#par-adv").value.trim(), ao = oabFmt($("#par-oab").value) || $("#par-oab").value.trim();
    L.push("", "Local e data: ____________________, " + new Date().toLocaleDateString("pt-BR"), "", "", "______________________________________", an || "[Nome do advogado responsável]", ao || "OAB/UF nº [número]", "Advogado responsável");
    const ta = $("#par-txt"); ta.value = (ta.value.trim() ? ta.value.trim() + "\n\n" : "") + L.join("\n"); ta.style.minHeight = "320px"; ta.focus();
  };
  $$("[data-dec]").forEach(b => b.onclick = async () => {
    const dec = b.dataset.dec, cl = Object.fromEntries(CLAUSES.map(([cid]) => [cid, $("#cl-"+cid).checked])), txt = $("#par-txt").value.trim();
    if (dec!=="aprovado" && !txt){ $("#perr").textContent = "Escreva o parecer explicando as ressalvas ou a reprovação."; $("#perr").hidden = false; return; }
    const adv = advLer("par"); if (!adv){ $("#perr").textContent = ADV_ERR; $("#perr").hidden = false; $("#par-adv").focus(); return; }
    try{ await Store.set("pareceres", id, {status:dec, clausulas:cl, parecer:txt, advogado:adv, em:nowISO(), por:Store.me.id||""}); close(); toast(dec==="aprovado" ? "Contrato aprovado" : dec==="ressalvas" ? "Aprovado com ressalvas" : "Contrato reprovado"); }
    catch(x){ $("#perr").textContent = "Parecer não registrado: só a equipe com acesso de Editor emite pareceres."; $("#perr").hidden = false; }
  });
  $("#ct-del").onclick = () => confirmBox("Excluir este envio de contrato?", "Excluir", async () => { await Store.del("contracts", id).catch(()=>{}); await Store.del("pareceres", id).catch(()=>{}); close(); toast("Envio excluído"); });
}

/* ================= EVIDÊNCIAS ================= */
function evCard(e){
  const s = supById(e.supplierId), img = e.url && /^image\//.test(e.mime||"");
  return `<button type="button" class="ev" data-ev="${e.id}"><div class="th">${img ? `<img src="${esc(e.url)}" alt="${esc(e.tipo)}" loading="lazy">` : `<span class="doc">${esc((e.mime||"").includes("pdf") ? "PDF" : "DOC")}</span>`}${e.gps ? `<span class="gps" style="color:${e.distKm>5?"var(--bad)":"var(--ok)"}">GPS ${e.distKm!=null ? fmt(e.distKm,1)+" km" : "✓"}</span>` : img ? `<span class="gps" style="color:var(--warn)">sem GPS</span>` : ""}</div><div class="bd"><b>${esc(e.tipo)}</b><span>${esc(s?.nome||"—")}</span><span>${dt(e.takenAt||e.criadoEm)}</span></div></button>`;
}
function bindEvCards(root){ $$("[data-ev]", root).forEach(c => c.onclick = () => openEvidence(c.dataset.ev)); }
function renderEvidencias(){
  const types = ["todos", ...EV_TYPES.filter(t => S.evidences.some(e => e.tipo===t))];
  const list = S.evidences.filter(e => S.evFilter==="todos" || e.tipo===S.evFilter).sort((a,b) => (b.criadoEm||"").localeCompare(a.criadoEm||""));
  const geo = S.evidences.filter(e => e.gps).length, far = S.evidences.filter(e => e.distKm > 5).length;
  $("#evidencias").innerHTML = `
    <div class="head"><div><div class="eyebrow">Repositório de evidências</div><h2>Fotos, notas e documentos</h2><p class="sub">No celular, a câmera abre direto. O app lê a data e o GPS da foto e compara com o local declarado do fornecedor.</p></div><button type="button" class="btn primary" id="ev-add"><svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.8"/></svg>Nova evidência</button></div>
    <div class="stats"><div class="stat"><div class="n">${S.evidences.length}</div><div class="l">Evidências</div></div><div class="stat"><div class="n">${geo}</div><div class="l">Com GPS</div></div><div class="stat"><div class="n" style="color:${far?"var(--bad)":"inherit"}">${far}</div><div class="l">Fora do local (&gt;5 km)</div></div><div class="stat"><div class="n">${S.suppliers.filter(s => S.evidences.filter(e=>e.supplierId===s.id && PHOTO_TYPES.includes(e.tipo)).length >= 3).length}/${S.suppliers.length}</div><div class="l">Com 3 fotos mínimas</div></div></div>
    <div class="filters">${types.map(t => `<button type="button" class="fbtn" data-ef="${esc(t)}" aria-pressed="${S.evFilter===t}">${t==="todos"?"Todas":esc(t)}</button>`).join("")}</div>
    ${list.length ? `<div class="grid-ev">${list.map(evCard).join("")}</div>` : `<div class="empty"><b>Nenhuma evidência ainda.</b>Fotografe mercadorias, galpões e balanças, ou anexe notas fiscais, pedidos e contratos.</div>`}`;
  $("#ev-add").onclick = () => openEvidenceForm();
  $$("[data-ef]").forEach(b => b.onclick = () => { S.evFilter = b.dataset.ef; renderEvidencias(); });
  bindEvCards($("#evidencias"));
}
async function shrink(file, max=1600){
  try{
    const bmp = await createImageBitmap(file); const k = Math.min(1, max/Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width*k); c.height = Math.round(bmp.height*k); c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), "image/jpeg", .82));
  }catch(e){ return file; }
}
function openEvidenceForm(preSup, preTipo){
  if (!S.suppliers.length){ toast("Cadastre um fornecedor antes de anexar evidências."); return; }
  const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Captura de campo</div><h2>Nova evidência</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <form class="sheet-b" id="fev" novalidate><div class="form">
      <div class="fld full"><label for="e-sup">Fornecedor</label><select id="e-sup">${supOptions(preSup)}</select></div>
      <div class="fld full"><label for="e-tipo">Tipo de evidência</label><select id="e-tipo">${EV_TYPES.map(t => `<option ${t===preTipo?"selected":""}>${t}</option>`).join("")}</select><span class="hint" id="e-guide"></span></div>
      <div class="fld full"><label for="e-file">Foto ou arquivo</label><input id="e-file" type="file" accept="image/*,application/pdf"><span class="hint">No celular, escolha "Câmera" ou "Tirar foto" para manter data e GPS originais.</span></div>
      <div class="fld full" id="e-meta" hidden></div>
      <div class="fld full"><label for="e-obs">Descrição</label><textarea id="e-obs" placeholder="O que a foto ou o documento comprova"></textarea></div>
      <label class="check full" id="e-ia-w" hidden><input type="checkbox" id="e-ia" checked> Ler o documento com IA (extrai número, data, CNPJ, produto, quantidade e valor)</label>
    </div><p class="hint" style="font-size:12px;color:var(--muted)">LGPD: evite rostos e documentos pessoais de trabalhadores, a menos que sejam necessários à verificação.</p>
    <p class="err" id="eerr" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary" id="e-go">Salvar evidência</button></div></form>`);
  let meta = null;
  const isDoc = () => !PHOTO_TYPES.includes($("#e-tipo").value);
  const sync = () => { $("#e-ia-w").hidden = !(Store.sample && isDoc() && $("#e-file").files[0]?.type.startsWith("image/")); $("#e-guide").textContent = "Requisito mínimo: " + evGuide($("#e-tipo").value); };
  sync();
  $("#e-tipo").onchange = sync;
  $("#e-file").onchange = async () => {
    const f = $("#e-file").files[0]; meta = null; const m = $("#e-meta"); m.hidden = true; sync(); if (!f || !f.type.startsWith("image/")) return;
    try{ const g = window.exifr ? await exifr.parse(f, {gps:true, pick:["DateTimeOriginal","CreateDate","latitude","longitude","GPSLatitude","GPSLongitude"]}) : null;
      meta = {takenAt: g?.DateTimeOriginal ? new Date(g.DateTimeOriginal).toISOString() : g?.CreateDate ? new Date(g.CreateDate).toISOString() : null, gps: g?.latitude!=null ? {lat:g.latitude, lng:g.longitude} : null};
    }catch(e){ meta = {takenAt:null, gps:null}; }
    const s = supById($("#e-sup").value), d = meta.gps && s?.lat!=null ? haversine(meta.gps.lat, meta.gps.lng, s.lat, s.lng) : null;
    m.hidden = false; m.innerHTML = `<div class="result">${meta.gps ? `GPS da foto ${meta.gps.lat.toFixed(5)}, ${meta.gps.lng.toFixed(5)}${d!=null ? ` · <b style="color:${d>5?"var(--bad)":"var(--ok)"}">${fmt(d,1)} km do local declarado</b>` : ""}` : `<span style="color:var(--warn)">Foto sem GPS.</span> Ative a localização da câmera ou registre a posição na descrição.`}<br>${meta.takenAt ? "Tirada em "+dt(meta.takenAt) : "Sem data original na foto"}</div>`;
  };
  $("#fev").onsubmit = async e => {
    e.preventDefault(); const f = $("#e-file").files[0]; if (!f){ $("#eerr").textContent = "Escolha uma foto ou arquivo."; $("#eerr").hidden = false; return; }
    const go = $("#e-go"); go.disabled = true; go.textContent = "Enviando…";
    try{
      const blob = f.type.startsWith("image/") ? await shrink(f) : f, up = await Store.upload(blob);
      const s = supById($("#e-sup").value), gps = meta?.gps || null, distKm = gps && s?.lat!=null ? Math.round(haversine(gps.lat, gps.lng, s.lat, s.lng)*10)/10 : null;
      const id = uid(), body = {supplierId:s.id, tipo:$("#e-tipo").value, obs:$("#e-obs").value.trim(), ...up, mime:blob.type||f.type, nome:f.name, gps, distKm, takenAt:meta?.takenAt||null, criadoEm:nowISO(), criadoPor:Store.me.id||""};
      await salvarEvid(id, body, blob);
      if (!$("#e-ia-w").hidden && $("#e-ia").checked){ go.textContent = "Lendo com IA…"; await readWithAI(id, blob, s); }
      close(); toast("Evidência salva");
    }catch(x){ $("#eerr").textContent = x?.code==="quota_exceeded" ? "Espaço de arquivos cheio. Remova evidências antigas." : "Não foi possível salvar a evidência. Verifique a conexão e o seu acesso."; $("#eerr").hidden = false; go.disabled = false; go.textContent = "Salvar evidência"; }
  };
}
async function readWithAI(evId, blob, s){
  if (!Store.sample) return;
  try{
    const prompt = `Você é auditor da Kinsey BR em uma due diligence da cadeia de cacau. Leia a imagem do documento (nota fiscal, pedido, contrato, ticket de pesagem ou similar) e responda SOMENTE um JSON com as chaves: tipo_documento, numero, data_emissao (DD/MM/AAAA), emitente_nome, emitente_cnpj_cpf, destinatario_nome, destinatario_cnpj_cpf, produto, quantidade_kg (número), valor_total_rs (número), observacoes (lista curta de pontos de atenção para auditoria, ex.: rasuras, dados ilegíveis, produto diferente de cacau). Use null quando não encontrar. Fornecedor esperado: ${s.nome}, documento ${s.doc||"não informado"}.`;
    const r = await Store.sample.json(prompt, {images:[blob], modelTier:"default"});
    const clean = d => String(d||"").replace(/\D/g,""); const match = r && s.doc ? (clean(r.emitente_cnpj_cpf)===clean(s.doc) || clean(r.destinatario_cnpj_cpf)===clean(s.doc)) : null;
    await Store.update("evidences", evId, {ia:{...r, confereFornecedor:match, em:nowISO()}});
  }catch(e){ toast(e?.code==="not_granted" ? "Leitura por IA não autorizada neste acesso." : "A leitura por IA não respondeu. A evidência foi salva."); }
}
function openEvidence(id){
  const e = S.evidences.find(x => x.id===id); if (!e) return; const s = supById(e.supplierId), img = /^image\//.test(e.mime||"");
  const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(e.tipo)}</div><h2>${esc(s?.nome||"—")}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="sheet-b">
      ${img ? `<img class="preview" src="${esc(e.url)}" alt="${esc(e.tipo)}">` : `<a class="btn" href="${esc(e.url)}" target="_blank" rel="noopener">Abrir ${esc(e.nome||"arquivo")} ↗</a>`}
      <dl class="kv"><dt>Descrição</dt><dd>${esc(e.obs||"—")}</dd><dt>Data da foto</dt><dd>${dt(e.takenAt)}</dd><dt>Enviada</dt><dd>${dt(e.criadoEm)}</dd>
        <dt>GPS</dt><dd>${e.gps ? `<span class="mono">${e.gps.lat.toFixed(5)}, ${e.gps.lng.toFixed(5)}</span> · <a href="${mapaSat(e.gps.lat, e.gps.lng, 300)}" target="_blank" rel="noopener" style="color:var(--glow)">satélite ↗</a>` : "não registrado"}</dd>
        <dt>Distância do local declarado</dt><dd>${e.distKm!=null ? `<b style="color:${e.distKm>5?"var(--bad)":"var(--ok)"}">${fmt(e.distKm,1)} km</b>${e.distKm>5?" · divergência de geolocalização":""}` : "—"}</dd></dl>
      ${e.ia ? `<div class="card"><h3>Leitura por IA</h3><dl class="kv" style="margin-top:10px">${[["Documento","tipo_documento"],["Número","numero"],["Emissão","data_emissao"],["Emitente","emitente_nome"],["CNPJ/CPF emitente","emitente_cnpj_cpf"],["Destinatário","destinatario_nome"],["CNPJ/CPF destinatário","destinatario_cnpj_cpf"],["Produto","produto"],["Quantidade (kg)","quantidade_kg"],["Valor (R$)","valor_total_rs"]].map(([l,k]) => `<dt>${l}</dt><dd>${esc(e.ia[k] ?? "—")}</dd>`).join("")}
        <dt>Confere com o fornecedor</dt><dd>${e.ia.confereFornecedor==null ? "—" : e.ia.confereFornecedor ? `<span style="color:var(--ok)">Sim</span>` : `<span style="color:var(--bad)">Não, CNPJ/CPF diferente</span>`}</dd></dl>
        ${(e.ia.observacoes||[]).length ? `<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:var(--warn)">${e.ia.observacoes.map(o=>`<li>${esc(o)}</li>`).join("")}</ul>` : ""}<p class="sub">Leitura automática: o auditor confere com o documento antes de usar como evidência.</p></div>`
        : (Store.sample && img ? `<button type="button" class="btn" id="ev-ia">Ler documento com IA</button>` : "")}
      <div style="display:flex;justify-content:space-between;gap:8px"><button type="button" class="btn sm ghost" id="ev-sup">Abrir dossiê do fornecedor</button><button type="button" class="btn sm bad" id="ev-del">Excluir</button></div>
    </div>`);
  EXT_EVVIEW.forEach(f => f(e, close));
  if ($("#ev-ia")) $("#ev-ia").onclick = async () => { const b = $("#ev-ia"); b.disabled = true; b.textContent = "Lendo…"; try{ const blob = await ktBaixar(e); await readWithAI(e.id, blob, s); close(); openEvidence(e.id); }catch(x){ b.textContent = "Não foi possível ler a imagem"; } };
  $("#ev-sup").onclick = () => openSupplier(e.supplierId, "docs");
  $("#ev-del").onclick = () => confirmBox("Excluir esta evidência?", "Excluir", async () => { await Store.del("evidences", id).catch(()=>{}); if (e.assetId && Store.assets) Store.assets.delete(e.assetId).catch(()=>{}); close(); toast("Evidência excluída"); });
}

/* ================= BOOT ================= */
function setMode(m){
  const c = $("#modechip");
  if (m==="live"){ c.className = "modechip live"; c.textContent = "Equipe conectada"; c.title = "Dados compartilhados entre todos com acesso ao app"; }
  else { c.className = "modechip"; c.textContent = "Modo local"; c.title = "Dados salvos só neste aparelho"; }
}
function subscribe(){
  Store.listen("suppliers", a => { S.suppliers = a; renderAll(); });
  Store.listen("evidences", a => { S.evidences = a; renderAll(); });
  Store.listen("contracts", a => { S.contracts = a; renderAll(); });
  Store.listen("pareceres", a => { S.pareceres = Object.fromEntries(a.map(p => [p.id, p])); renderAll(); });
  Store.listen("config", a => { S.config = Object.fromEntries(a.map(p => [p.id, p])); renderAll(); });
  Store.listen("operacoes", a => { S.operacoes = a; renderAll(); });
  if (EXT_VIEWS.prospeccao) Store.listen("prospects", a => { S.prospects = a; if (S.view === "prospeccao") renderView(); });
  if (EXT_VIEWS.ativos) Store.listen("ativos", a => { S.ativos = a; if (S.view === "ativos") renderView(); });
}
function openKim(){
  sheet(`<div class="sheet-h"><div><div class="eyebrow">KinseyTec – Cacau</div><h2>Tour com a Kim</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
    <div class="sheet-b">${KIM_VIDEO ? `<video class="kimvid" src="${KIM_VIDEO}" controls playsinline preload="metadata"></video>` : `<div class="banner">Os vídeos da Kim estão sendo atualizados. Enquanto isso, veja abaixo o resumo de cada área.</div>`}
    ${KIM_EN ? `<h3 style="margin-top:4px">English version · KinseyTec – Cacau (4 min)</h3><video class="kimvid" src="${KIM_EN}" controls playsinline preload="metadata"></video>` : ""}
    ${KIM_INSTALL ? `<h3 style="margin-top:4px">Como acessar e instalar (48 s)</h3><video class="kimvid" src="${KIM_INSTALL}" controls playsinline preload="metadata"></video>` : ""}
    <p class="sub">${KIM_VIDEO ? "Em 4 minutos, a Kim explica como usar o KinseyTec – Cacau," : "O KinseyTec – Cacau é o"} sistema de matriz de risco de fornecedores de cacau: órbita, cadeia N1/N2/N3, auditoria e risco, evidências com GPS e aprovação jurídica com NDA e LGPD.</p>
    <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:13.5px"><li><b>Órbita</b>: toque num fornecedor para aproximar até o local.</li><li><b>Cadeia</b>: cadastre traders (N1), fornecedores (N2) e produtores (N3).</li><li><b>Auditoria</b>: questionário, documentos, inspeção e testes atualizam o risco.</li><li><b>Evidências</b>: fotos com data e GPS e alerta quando a foto está longe do local declarado.</li><li><b>Jurídico</b>: revisão de cláusulas, parecer remoto, NDA e LGPD.</li></ol>
    <div class="card" style="display:flex;flex-direction:column;gap:8px"><h3>Acesso e administração</h3>
      <p style="font-size:13.5px;margin:0">Administradores gerais (liberam o acesso da equipe): ${ADMINS.map(a => `<b style="user-select:all">${a}</b>`).join(" · ")}</p>
      <p style="font-size:12.5px;margin:0;color:var(--mut,#8aa0bf)">© ${new Date().getFullYear()} KinseyTec Inovação Tecnológica · empresa do grupo Kinsey BR · direito de uso reservado.</p>
      <p style="font-size:13.5px;margin:0">Link do <b>Cliente</b> (cliente e Kinsey BR): <span class="mono" style="user-select:all;font-size:12px">${APP_URL}</span></p>
      <p style="font-size:13.5px;margin:0">Link do <b>Fornecedor</b> (Portal do Fornecedor): <span class="mono" style="user-select:all;font-size:12px">${PORTAL_URL}</span></p></div></div>`);
}
async function boot(){
  $$("nav.tabs button").forEach(b => b.onclick = () => go(b.dataset.go));
  $("#kim-tour").onclick = openKim;
  $$(".langbtn button").forEach(b => b.onclick = () => setLang(b.dataset.lang));
  applyLang();
  $("#pricebar").onclick = openPrices;
  try{ initGlobe(); }catch(e){ console.error(e); }
  G.idle = true;
  const h = location.hash.slice(1); if (h === "operacoes"){ S.audSub = "ops"; go("auditoria"); } else if (["relatorio","cadeia","auditoria","juridico","evidencias"].includes(h)) go(h); else renderAll();
  if (window.KT_FB){
    await KT_FB.start(); subscribe();
    setTimeout(() => { if (window.ORB_AUTOSEL !== false && !S.sel && S.view==="orbita"){ const t = S.suppliers.find(s => s.nivel==="N1" && riskOf(s).level==="alto") || S.suppliers.find(s => s.nivel==="N1"); if (t) selectSup(t.id, true); } }, 2500);
    return;
  }
  let db = null;
  if (window.__ktHost?.use){
    try{ [db, Store.user, Store.assets] = await Promise.all([__ktHost.use("db"), __ktHost.use("user"), __ktHost.use("assets")]); }catch(e){}
    try{ Store.sample = await __ktHost.use("sample"); if (Store.sample){ const lim = await Store.sample.limits().catch(()=>null); if (!lim?.images) Store.sample = null; } }catch(e){ Store.sample = null; }
  }
  if (db){
    Store.db = db; Store.mode = "live"; setMode("live");
    if (Store.user){ try{ Store.me.id = await Store.user.id(); Store.me.canEdit = await Store.user.canEdit(); const w = await Store.user.can("data.write"); Store.me.canWrite = w !== false; }catch(e){} }
    const slow = setTimeout(() => { if (!S.suppliers.length) toast("Os dados da equipe ainda não chegaram. Verifique a conexão."); }, 10000);
    Store.listen("suppliers", () => clearTimeout(slow));
  } else { Store.loadLocal(); setMode("local"); if (!Object.keys(Store.local.suppliers).length) seedLocal(); }
  subscribe();
  // abre já mirando a primeira trader de alto risco para a demonstração
  setTimeout(() => { if (window.ORB_AUTOSEL !== false && !S.sel && S.view==="orbita"){ const t = S.suppliers.find(s => s.nivel==="N1" && riskOf(s).level==="alto") || S.suppliers.find(s => s.nivel==="N1"); if (t) selectSup(t.id, true); } }, 1400);
}
/* Dados de demonstração para o modo local (fora do app publicado com equipe, os exemplos vêm do banco compartilhado) */
function seedLocal(){ (window.SEED || []).forEach(([col, id, body]) => Store.local[col][id] = body); Store.saveLocal(); }
setTimeout(boot, 0);  /* depois de carregar os módulos (relatório, cobre, importação, operações) */
