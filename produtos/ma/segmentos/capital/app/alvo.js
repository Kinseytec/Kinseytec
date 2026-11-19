/* ================= KINSEY CAPITAL · TARGET EM CONSULTA (único em todas as áreas) =================
   A empresa escolhida na busca da Órbita, na faixa, no globo ou no dossiê passa a ser o target em consulta de todas as
   áreas: Due Diligence, Análises financeiras, Valuation, Apresentação, Jurídico e Pós-aquisição. Cada área mostra no
   topo "Em consulta: <empresa>" com o botão Trocar; trocar em qualquer área vale para as outras. */
if (window.KT_DD) (() => {
  const D = KT_DD;
  window.KT_ADV_POR_DOC = false; /* M&A: nome e OAB só no parecer jurídico final */
  /* uma só seleção: S.ddSel (áreas financeiras) e S.jurAlvo (jurídico) apontam para o mesmo target */
  let alvo = S.ddSel || S.jurAlvo || "";
  const define = k => { try{ delete S[k]; }catch(e){} Object.defineProperty(S, k, {get:() => alvo, set:v => { if (v && v !== alvo){ alvo = v; S.ddPer = ""; try{ localStorage.setItem("kt-alvo", v); }catch(e){} } }, configurable:true, enumerable:true}); };
  try{ alvo = alvo || localStorage.getItem("kt-alvo") || ""; }catch(e){}
  define("ddSel"); define("jurAlvo");
  const usar = (id, aviso) => { const s = supById(id); if (!s || s.nivel !== "N3" || alvo === id) return; S.ddSel = id; if (aviso) toast(`Em consulta em todas as áreas: ${s.nome}`); };
  const _sel = selectSup; selectSup = function(id){ const r = _sel.apply(this, arguments); usar(id, true); return r; };
  const _open = openSupplier; openSupplier = function(id){ usar(id, false); return _open.apply(this, arguments); };

  /* faixa "Em consulta" no topo das áreas */
  const VIEWS = {auditoria:"#auditoria", financas:"#financas", valuation:"#valuation", apresentacao:"#apresentacao", juridico:"#juridico", pos:"#pos", impairment:"#impairment", ativos:"#ativos"};
  function trocar(){
    const L = D.targets().slice().sort((a, b) => (D.temBal(b) - D.temBal(a)) || String(a.nome).localeCompare(b.nome));
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Target em consulta</div><h2>Trocar de empresa</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:8px"><input id="alv-q" placeholder="Nome, codinome ou CNPJ" autocomplete="off"><div id="alv-l" style="display:flex;flex-direction:column;gap:4px"></div></div>`);
    const lista = () => { const q = String($("#alv-q").value || "").toLowerCase(), d = q.replace(/\D/g, "");
      $("#alv-l").innerHTML = L.filter(s => !q || String(s.nome).toLowerCase().includes(q) || String(s.mandato?.codinome || "").toLowerCase().includes(q) || (d.length >= 4 && String(s.doc || "").replace(/\D/g, "").includes(d))).slice(0, 60)
        .map(s => `<button type="button" class="btn" data-alv="${s.id}" style="justify-content:space-between;text-align:left;${s.id === alvo ? "border-color:var(--glow)" : ""}"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis"><b>${esc(s.nome)}</b>${s.mandato?.codinome ? ` · ${esc(s.mandato.codinome)}` : ""}</span><span class="sub" style="font-size:11.5px;white-space:nowrap">${D.temBal(s) ? "com balancete" : "sem balancete"}</span></button>`).join("") || `<p class="sub">Nenhum target encontrado.</p>`;
      $$("[data-alv]").forEach(b => b.onclick = () => { usar(b.dataset.alv, false); close(); renderView(); }); };
    $("#alv-q").oninput = lista; lista(); setTimeout(() => $("#alv-q").focus(), 50);
  }
  function faixa(){
    const v = S.view, sel = VIEWS[v]; if (!sel) return; const host = $(sel); if (!host) return; const old = host.querySelector(":scope > .alv-bar"); if (old) old.remove(); if (host.querySelector(".dd-pasta")) return; /* a área já mostra o target (Pasta de análise · Trocar) */
    const s = supById(alvo) || (v === "juridico" ? null : D.alvoSel()); if (!s) return;
    const el = document.createElement("div"); el.className = "alv-bar";
    el.innerHTML = `<span class="sub" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase">Em consulta</span><b style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.nome)}${s.mandato?.codinome ? ` <span class="sub" style="font-weight:400">· ${esc(s.mandato.codinome)}</span>` : ""}</b><button type="button" class="btn sm">Trocar</button>`;
    host.prepend(el); el.querySelector("button").onclick = trocar;
  }
  const css = document.createElement("style");
  css.textContent = `.alv-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:12px;border:1px solid var(--line-2);border-radius:12px;background:rgba(79,176,245,.08);position:sticky;top:0;z-index:5;backdrop-filter:blur(6px)}
.alv-bar b{flex:1}`;
  document.head.appendChild(css);
  const _rv = renderView; renderView = function(){ const r = _rv.apply(this, arguments); try{ faixa(); }catch(e){} return r; };
  if (typeof renderAuditoria === "function"){ const _ra = renderAuditoria; renderAuditoria = function(){ const r = _ra.apply(this, arguments); try{ faixa(); }catch(e){} return r; }; }
  if (typeof renderJuridico === "function"){ const _rj = renderJuridico; renderJuridico = function(){ const r = _rj.apply(this, arguments); try{ faixa(); }catch(e){} return r; }; }
  /* ---------- fechar a tela: × no topo à direita (fica visível ao rolar) e "Fechar esta tela" no fim ----------
     Volta para a tela de onde veio; sem histórico, volta para a Órbita. */
  const pilha = []; { const _go = go; go = function(v){ if (S.view && S.view !== v){ const i = pilha.indexOf(v); if (i >= 0) pilha.splice(i); else pilha.push(S.view); } return _go.apply(this, arguments); }; }
  const NOMES = {cadeia:"Base inicial", prospeccao:"Prospecção", auditoria:"Due Diligence", financas:"Análises financeiras", valuation:"Valuation", ativos:"Avaliação de ativos", juridico:"Jurídico", pos:"Pós-aquisição", impairment:"Impairment", apresentacao:"Apresentação", evidencias:"Evidências", relatorio:"Relatórios"};
  function fecharTela(){ let v = pilha.pop(); while (v && (v === S.view || !$(`main .view[data-view="${v}"]`))) v = pilha.pop(); go(v || "orbita"); window.scrollTo?.(0, 0); }
  function botoesFechar(){
    const v = S.view; if (!v || v === "orbita") return; const sec = $(`main .view[data-view="${v}"]`); if (!sec || sec.hidden) return; const host = sec.querySelector(":scope > .pad, :scope > div") || sec;
    const bar = host.querySelector(".alv-bar");
    if (bar){ if (!bar.querySelector(".vw-x")) bar.insertAdjacentHTML("beforeend", `<button type="button" class="x vw-x" aria-label="Fechar esta tela" title="Fechar esta tela">×</button>`); host.querySelector(":scope > .vw-top")?.remove(); }
    else if (!host.querySelector(":scope > .vw-top")) host.insertAdjacentHTML("afterbegin", `<div class="vw-top"><span class="sub">${esc(NOMES[v] || "")}</span><button type="button" class="x vw-x" aria-label="Fechar esta tela" title="Fechar esta tela">×</button></div>`);
    if (!host.querySelector(":scope > .vw-fim")) host.insertAdjacentHTML("beforeend", `<div class="vw-fim"><button type="button" class="btn ghost vw-x">Fechar esta tela</button></div>`);
    else host.appendChild(host.querySelector(":scope > .vw-fim")); /* sempre por último */
    $$(".vw-x", host).forEach(b => b.onclick = fecharTela);
  }
  /* abas e flags (Síntese, Base, FCD, filtros…) com o amarelo da marca para destacar */
  css.textContent += `.fbtn,.stabs button,.dd-tabs button.fbtn{color:#F2C14E;border-color:rgba(242,193,78,.45)}
.fbtn:hover,.stabs button:hover{color:#FFD873;border-color:rgba(242,193,78,.8)}
.fbtn[aria-pressed="true"],.dd-tabs .fbtn[aria-pressed="true"]{color:#1b1300 !important;background:#F2C14E !important;border-color:#F2C14E !important;box-shadow:0 0 0 1px rgba(242,193,78,.35),0 0 14px rgba(242,193,78,.25)}
.stabs button{border-bottom-color:transparent}.stabs button[aria-selected="true"]{color:#F2C14E;border-bottom-color:#F2C14E}
.fbtn:disabled{opacity:.45}`;
  /* computador: o menu lateral rola com barra visível quando os itens não cabem na altura da janela */
  css.textContent += `@media (min-width:900px){nav.tabs{min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#F2C14E rgba(255,255,255,.06);padding-bottom:16px;scrollbar-gutter:stable}
nav.tabs::-webkit-scrollbar{width:8px}nav.tabs::-webkit-scrollbar-track{background:rgba(255,255,255,.05)}nav.tabs::-webkit-scrollbar-thumb{background:#F2C14E;border-radius:8px}
nav.tabs button{flex-shrink:0}}
@media (min-width:900px) and (max-height:820px){nav.tabs button{padding:8px 4px;gap:3px}}`;
  css.textContent += `nav.tabs [data-go="pos"] svg{stroke:#4FB0F5;color:#4FB0F5}nav.tabs [data-go="impairment"] svg{stroke:#FF8A65;color:#FF8A65}`;
  /* abas de uma mesma área: contorno amarelo, mas cada aba com a sua cor (PPA, Impairment, Base de modelos…) para identificar melhor */
  { const COR = ["#4FB0F5", "#36D399", "#C39BFF", "#FF8A65", "#2DD4BF", "#F472B6", "#F2C14E", "#93C5FD", "#A3E635", "#FDBA74"];
    css.textContent += COR.map((c, i) => `.dd-tabs > .fbtn:nth-child(${COR.length}n+${i + 1}){color:${c};background:${c}14;border-color:rgba(242,193,78,.55)}
.dd-tabs > .fbtn:nth-child(${COR.length}n+${i + 1})[aria-pressed="true"]{background:${c} !important;color:#0b1730 !important;border-color:#F2C14E !important;box-shadow:0 0 0 2px rgba(242,193,78,.55),0 0 14px ${c}55}`).join("\n"); }
  css.textContent += `.vw-top{display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:0;z-index:6;margin:-4px 0 8px;padding:6px 0;background:linear-gradient(var(--bg,#011F4B) 70%,transparent)}
.vw-top .sub{font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin:0}.alv-bar .vw-x{flex:none;margin-left:2px}
.vw-fim{display:flex;justify-content:center;padding:18px 0 calc(18px + env(safe-area-inset-bottom,0px))}.vw-fim .btn{min-width:200px}`;
  /* celular: nada fica "congelado" na tela. As faixas presas viram parte da página e o cabeçalho (marca, cliente e
     faixa do mercado) some ao rolar para baixo e volta ao rolar para cima. */
  css.textContent += `@media (max-width:900px){.alv-bar,.vw-top{position:static !important;backdrop-filter:none}.sheet-b .head[style*="sticky"]{position:static !important;margin-top:0 !important}
#v-orbita .target .acts{position:static !important}
body.kt-compacto .topbar,body.kt-compacto .pricebar{display:none !important}}`;
  { const mq = window.matchMedia ? matchMedia("(max-width:900px)") : {matches:false}, ult = new WeakMap();
    document.addEventListener("scroll", e => { const t = e.target; if (!mq.matches || !t || !t.classList || !t.classList.contains("view")) return;
      const st = t.scrollTop, a = ult.get(t) ?? 0; ult.set(t, st);
      if (st < 40 || st < a - 14) document.body.classList.remove("kt-compacto"); else if (st > 90 && st > a + 8) document.body.classList.add("kt-compacto"); }, true);
    const _go2 = go; go = function(){ document.body.classList.remove("kt-compacto"); return _go2.apply(this, arguments); }; }
  { const _rv2 = renderView; renderView = function(){ const r = _rv2.apply(this, arguments); try{ botoesFechar(); setTimeout(() => { try{ botoesFechar(); }catch(e){} }, 0); }catch(e){} return r; }; }
  if (typeof renderAuditoria === "function"){ const _ra2 = renderAuditoria; renderAuditoria = function(){ const r = _ra2.apply(this, arguments); try{ botoesFechar(); }catch(e){} return r; }; }
  if (typeof renderJuridico === "function"){ const _rj2 = renderJuridico; renderJuridico = function(){ const r = _rj2.apply(this, arguments); try{ botoesFechar(); }catch(e){} return r; }; }
  /* ordem do menu: Prospecção, Base inicial, Órbita, Análises financeiras, Valuation, Due Diligence, Jurídico, PPA
     (Pós-aquisição), Avaliação de ativos, Impairment e Relatórios (a Apresentação, que consolida todos os relatórios) */
  const ORDEM = ["prospeccao", "cadeia", "orbita", "financas", "valuation", "auditoria", "juridico", "pos", "ativos", "impairment", "apresentacao"];
  function ordenaMenu(){ const nav = $("nav.tabs"); if (!nav) return; let mudou = false;
    ORDEM.forEach(v => { const b = nav.querySelector(`[data-go="${v}"]`); if (b){ nav.appendChild(b); mudou = true; } });
    [...nav.children].forEach(b => { if (!ORDEM.includes(b.dataset?.go)) nav.appendChild(b); }); /* ocultos ficam no fim */
    const ap = nav.querySelector('[data-go="apresentacao"]'); if (ap && !ap.dataset.rot){ ap.dataset.rot = "1"; const t = [...ap.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (t) t.textContent = "Relatórios"; ap.title = "Relatórios e apresentação"; }
    const pos = nav.querySelector('[data-go="pos"]'); if (pos && !pos.dataset.rot){ pos.dataset.rot = "1"; const t = [...pos.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (t) t.textContent = "PPA"; pos.title = "Pós-aquisição · PPA"; }
    return mudou; }
  ordenaMenu(); setTimeout(ordenaMenu, 0); setTimeout(ordenaMenu, 1600);
  { const _ra3 = renderAll; renderAll = function(){ const r = _ra3.apply(this, arguments); try{ ordenaMenu(); }catch(e){} return r; }; }
  window.KT_ALVO = {usar, trocar, fecharTela, get atual(){ return alvo; }};
})();
