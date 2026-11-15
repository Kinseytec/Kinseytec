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
  const VIEWS = {auditoria:"#auditoria", financas:"#financas", valuation:"#valuation", apresentacao:"#apresentacao", juridico:"#juridico", pos:"#pos"};
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
  window.KT_ALVO = {usar, trocar, get atual(){ return alvo; }};
})();
