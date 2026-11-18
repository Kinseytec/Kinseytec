/* ================= KINSEY CAPITAL · BUSCA DE EMPRESA POR NOME OU CNPJ =================
   Onde o sistema pedia para escolher a empresa numa lista longa (Due Diligence, Jurídico: questionário, NDA, mandatos,
   SPA e MOU, e Imóveis), aparece um campo de busca: digite parte do nome, do nome-código ou do CNPJ e toque na empresa.
   A lista original continua por trás (mesmo comportamento ao escolher). */
(() => {
  const IDS = ["dd-alvo", "jq-sel", "im-sel", "jm-alvo", "nd-sel", "op-alvo"];
  const nq = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""), dig = v => String(v || "").replace(/\D/g, "");
  function realca(sel){
    if (!sel || sel.dataset.busca) return; sel.dataset.busca = "1";
    const opts = [...sel.options].filter(o => o.value).map(o => { const s = typeof supById === "function" ? supById(o.value) : null;
      return {v:o.value, t:o.textContent.trim(), doc:s?.doc || "", chave:nq([o.textContent, s?.nome, s?.receita?.razao, s?.receita?.fantasia, s?.mandato?.codinome].join(" ")), d:dig(s?.doc)}; });
    if (opts.length < 6) return;
    const atual = () => opts.find(o => o.v === sel.value);
    const box = document.createElement("div"); box.className = "be-box"; box.style.cssText = "display:flex;flex-direction:column;gap:4px;min-width:0";
    box.innerHTML = `<input type="search" class="be-q" autocomplete="off" placeholder="Digite o nome ou o CNPJ" aria-label="Buscar empresa pelo nome ou CNPJ" style="height:44px;border-radius:10px;border:1px solid var(--line-2);background:rgba(1,31,75,.6);color:var(--fog);padding:0 12px;font:inherit;font-size:15px;width:100%;box-sizing:border-box">
      <div class="be-at sub" style="margin:0;font-size:12.5px"></div><div class="be-res" style="display:flex;flex-direction:column;gap:4px"></div>`;
    sel.style.display = "none"; sel.after(box);
    const q = box.querySelector(".be-q"), res = box.querySelector(".be-res"), at = box.querySelector(".be-at");
    const mostraAtual = () => { const a = atual(); at.innerHTML = a ? `Selecionada: <b style="color:var(--fog)">${esc(a.t)}</b>${a.doc ? ` · ${esc(a.doc)}` : ""}` : "Nenhuma empresa selecionada."; };
    const escolhe = o => { q.value = ""; res.innerHTML = ""; if (o.v !== sel.value){ sel.value = o.v; sel.dispatchEvent(new Event("change", {bubbles:true})); } mostraAtual(); };
    q.oninput = () => { const t = nq(q.value.trim()), d = dig(q.value); if (t.length < 2 && d.length < 3){ res.innerHTML = ""; return; }
      const L = opts.filter(o => o.chave.includes(t) || (d.length >= 3 && o.d.includes(d))).slice(0, 8);
      res.innerHTML = L.length ? L.map((o, i) => `<button type="button" class="btn sm ghost" data-be="${i}" style="justify-content:flex-start;text-align:left;white-space:normal">${esc(o.t)}${o.doc ? ` <span class="sub" style="margin-left:6px;font-size:11.5px">${esc(o.doc)}</span>` : ""}</button>`).join("") : `<span class="sub" style="font-size:12.5px">Nenhuma empresa encontrada.</span>`;
      res.querySelectorAll("[data-be]").forEach(b => b.onclick = () => escolhe(L[+b.dataset.be])); };
    q.onkeydown = e => { if (e.key === "Enter"){ e.preventDefault(); const b = res.querySelector("[data-be]"); if (b) b.click(); } };
    mostraAtual();
  }
  const varre = () => IDS.forEach(id => document.querySelectorAll(`select#${id}`).forEach(realca));
  const mo = new MutationObserver(() => { clearTimeout(mo._t); mo._t = setTimeout(varre, 30); });
  const liga = () => { mo.observe(document.body, {childList:true, subtree:true}); varre(); };
  if (document.body) liga(); else document.addEventListener("DOMContentLoaded", liga);
  window.KT_BUSCAEMP = {realca};
})();
