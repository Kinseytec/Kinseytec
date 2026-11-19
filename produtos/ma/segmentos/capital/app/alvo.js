/* ================= KINSEY CAPITAL · TARGET EM CONSULTA (único em todas as áreas) =================
   A empresa escolhida na busca da Órbita, na faixa, no globo ou no dossiê passa a ser o target em consulta de todas as
   áreas: Due Diligence, Análises financeiras, Valuation, Apresentação, Jurídico e Pós-aquisição. Cada área mostra no
   topo "Em consulta: <empresa>" com o botão Trocar; trocar em qualquer área vale para as outras. */
if (window.KT_DD) (() => {
  const D = KT_DD;
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
  css.textContent += `.vw-top{display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:0;z-index:6;margin:-4px 0 8px;padding:6px 0;background:linear-gradient(var(--bg,#011F4B) 70%,transparent)}
.vw-top .sub{font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin:0}.alv-bar .vw-x{flex:none;margin-left:2px}
.vw-fim{display:flex;justify-content:center;padding:18px 0 calc(18px + env(safe-area-inset-bottom,0px))}.vw-fim .btn{min-width:200px}`;
  { const _rv2 = renderView; renderView = function(){ const r = _rv2.apply(this, arguments); try{ botoesFechar(); setTimeout(() => { try{ botoesFechar(); }catch(e){} }, 0); }catch(e){} return r; }; }
  if (typeof renderAuditoria === "function"){ const _ra2 = renderAuditoria; renderAuditoria = function(){ const r = _ra2.apply(this, arguments); try{ botoesFechar(); }catch(e){} return r; }; }
  if (typeof renderJuridico === "function"){ const _rj2 = renderJuridico; renderJuridico = function(){ const r = _rj2.apply(this, arguments); try{ botoesFechar(); }catch(e){} return r; }; }
  window.KT_ALVO = {usar, trocar, fecharTela, get atual(){ return alvo; }};
})();
