/* ================= COTAÇÕES AUTOMÁTICAS =================
   A função agendada do Firebase grava em cotacoes/atual os preços públicos do dia (dólar PTAX, CEPEA, LME, ICCO).
   Cada segmento escolhe o que mostrar (COT_AUTO, no data.js). Preço registrado manualmente pelo cliente tem prioridade.
   A cotação de referência (para comparar contratos e notas) fica na Auditoria · Operações comerciais. */
const COTA = (() => {
  const CA = typeof COT_AUTO !== "undefined" ? COT_AUTO : {un: "", kg: 1, bar: [["dolar", "Dólar", ""]], br: {}, intl: {}, ref: null};
  let ouvindo = false;
  /* histórico diário (gravado pela função agendada): cotação na data de cada nota */
  let histPedido = false;
  function carregaHist(){ if (histPedido || !Store.db) return; histPedido = true;
    Store.db.collection("cotacoes_hist").get().then(q => { const h = {}; q.docs.forEach(d => { h[d.id] = d.data().itens || {}; }); S.cotHist = h; renderAll(); }).catch(() => {}); }
  function ouvir(){
    carregaHist(); if (ouvindo || !Store.db) return; ouvindo = true;
    Store.db.collection("cotacoes").doc("atual").onSnapshot(d => { S.cotAuto = d.exists ? d.data() : null; renderAll(); }, () => {});
  }
  const it = id => S.cotAuto?.itens?.[id] || null;
  const fmtV = o => !o ? "—" : /^US\$|^£|^€/.test(o.unidade) ? `${o.unidade.split("/")[0]} ${fmt(o.valor, o.valor < 100 ? 2 : 0)}` : `R$ ${fmt(o.valor, 2)}`;
  const unTx = (o, u) => u !== undefined ? u : !o ? "" : o.unidade.replace(/^R\$|^US\$|^£|^€/, "") || "";
  const dBR = iso => iso ? new Date(String(iso).slice(0, 10) + "T12:00").toLocaleDateString("pt-BR") : "";

  /* referência em R$ na unidade do segmento: manual (praça ou geral) → automática (praça) → automática (padrão) */
  const _cotRef = cotRef;
  cotRef = function(uf){ const m = _cotRef(uf); if (m) return m; const id = (CA.br || {})[uf] || CA.ref, o = id && it(id); return o && /^R\$/.test(o.unidade) ? o.valor : null; };
  const refKg = () => { const r = cotRef(""); return r && CA.kg ? r / CA.kg : null; };
  /* cotação em R$/kg na data (até 10 dias antes, por causa de fins de semana e feriados): histórico automático → valor manual → cotação atual */
  function refKgEm(data, uf){
    const d = String(data || "").slice(0, 10), id = (CA.br || {})[uf] || CA.ref, H = S.cotHist || {};
    if (d && id){ const lim = new Date(new Date(d + "T12:00").getTime() - 10 * 864e5).toISOString().slice(0, 10), ds = Object.keys(H).filter(x => x <= d && x >= lim).sort();
      for (let i = ds.length - 1; i >= 0; i--){ const o = H[ds[i]][id]; if (o && /^R\$/.test(o.unidade) && CA.kg) return {kg: o.valor / CA.kg, data: o.data || ds[i], fonte: o.fonte || "cotação automática"}; } }
    const g = S.config.geral || {}; if (num(g.cotacao) && CA.kg) return {kg: num(g.cotacao) / CA.kg, data: "", fonte: "cotação de referência manual" + (g.data ? " (" + g.data + ")" : "")};
    const o = id && it(id); if (o && /^R\$/.test(o.unidade) && CA.kg) return {kg: o.valor / CA.kg, data: o.data || "", fonte: "cotação atual (sem histórico na data da nota)"};
    return null;
  }
  const refFonte = () => num(S.config.geral?.cotacao) ? `manual · ${S.config.geral?.data || ""}` : CA.ref && it(CA.ref) ? `${it(CA.ref).rotulo} · ${it(CA.ref).fonte} · ${dBR(it(CA.ref).data)}` : "";

  /* barra superior */
  const _bar = renderPriceBar;
  renderPriceBar = function(){
    ouvir(); _bar.apply(this, arguments);
    const el = $("#pricebar"); if (!el) return;
    const p = S.config.precos || {}, br = p.br || {}, manuais = PRECO.bar.filter(k => br[k]?.valor);
    const autos = (CA.bar || []).filter(([id]) => it(id)).slice(0, Math.max(0, 3 - manuais.length));
    if (!autos.length) return;
    const datas = autos.map(([id]) => it(id).data).filter(Boolean).sort();
    const html = autos.map(([id, rot, u], i) => `<span class="px ${i + manuais.length > 1 ? "hide-sm" : ""}" title="${esc(it(id).rotulo + " · " + it(id).fonte)}"><span>${esc(rot)}</span><b>${fmtV(it(id))}</b>${esc(unTx(it(id), u))}</span>`).join("");
    if (!manuais.length){
      el.innerHTML = `<span class="lab"><i class=""></i>${esc(SEG_NOME)}<span class="hide-sm">&nbsp;· automático</span></span>${html}<span class="px hide-sm" style="color:var(--muted)">${datas.length ? "cotação de " + dBR(datas[datas.length - 1]) : ""}${S.cotAuto?.em ? " · atualizado " + new Date(S.cotAuto.em).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"}) : ""}</span><span class="more">Cotações ›</span>`;
    } else { const more = el.querySelector(".more"); if (more) more.insertAdjacentHTML("beforebegin", html); }
  };

  /* janela de cotações: seção automática no topo */
  const _open = openPrices;
  openPrices = function(){
    _open.apply(this, arguments); const b = $(".sheet-b"); if (!b) return;
    const ids = [...new Set([...(CA.bar || []).map(x => x[0]), ...Object.values(CA.br || {}), ...Object.values(CA.intl || {}), CA.ref, "dolar"].filter(Boolean))];
    const L = ids.map(id => [id, it(id)]).filter(([, o]) => o), adm = Store.me?.role === "admin";
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Cotações automáticas · fontes públicas</div><h3>${L.length ? "Atualizadas " + dt(S.cotAuto.em) : "Aguardando a primeira atualização"}</h3></div>${adm && window.firebase?.functions ? `<button type="button" class="btn sm" id="cot-ag">Atualizar agora</button>` : ""}</div>
      ${L.length ? `<div class="tbl"><table class="ptable"><thead><tr><th>Cotação</th><th>Valor</th><th>Data</th><th>Fonte</th></tr></thead><tbody>${L.map(([id, o]) => `<tr><td>${esc(o.rotulo)}</td><td class="v">${fmtV(o)} ${esc(unTx(o))}</td><td style="font-size:12px">${dBR(o.data)}${o.anterior ? " · <span style=\"color:var(--warn)\">última disponível</span>" : ""}</td><td style="font-size:12px;color:var(--muted)">${esc(o.fonte)}</td></tr>`).join("")}</tbody></table></div>`
        : `<p class="sub" style="margin:0">${Store.db ? "A função agendada busca as cotações de hora em hora, das 8h15 às 19h15. Depois de publicar, o administrador pode usar “Atualizar agora”." : "No teste local não há busca automática (ela roda no Firebase publicado)."}</p>`}
      <p class="sub" style="margin:0;font-size:12px">Os valores registrados manualmente abaixo têm prioridade. ${CA.nota || ""}</p>`;
    b.prepend(el);
    const ag = $("#cot-ag"); if (ag) ag.onclick = () => atualizar("cotacoes", ag);
  };
  async function atualizar(tipo, btn){
    if (!window.firebase?.functions){ toast("Disponível na versão publicada."); return; }
    const t0 = btn ? btn.textContent : ""; if (btn){ btn.disabled = true; btn.textContent = "Atualizando…"; }
    try{ const r = await firebase.app().functions("southamerica-east1").httpsCallable("atualizarAgora", {timeout: 600000})({tipo}); toast(tipo === "listas" ? "Listas oficiais atualizadas" : "Cotações atualizadas"); return r.data; }
    catch(e){ toast("Não foi possível atualizar agora: " + (e.message || "erro")); }
    finally{ if (btn){ btn.disabled = false; btn.textContent = t0; } }
  }

  /* Auditoria · Operações comerciais: cotação de referência (pesos, valores e transações) */
  const _ops = EXT_VIEWS.operacoes;
  if (_ops) EXT_VIEWS.operacoes = function(){
    _ops.apply(this, arguments); const host = $("#operacoes"); if (!host) return;
    const g = S.config.geral || {}, r = cotRef(""), ed = Store.me.canWrite !== false;
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Pesos, valores e transações</div><h3>Cotação de referência${CA.un ? " (R$/" + esc(CA.un) + ")" : ""}</h3>
        <p class="sub" style="margin:4px 0 0">Usada para conferir o preço de notas, pedidos e contratos: alerta quando está mais de 20% abaixo. ${r ? `Em uso: <b>R$ ${fmt(r, 2)}</b>${CA.un ? "/" + esc(CA.un) : ""} · ${esc(refFonte())}` : "Sem cotação disponível."}</p></div></div>
      ${ed ? `<form id="fcot2" class="form" novalidate><div class="fld"><label for="cot2-v">Valor manual (opcional, substitui a automática)</label><input id="cot2-v" inputmode="decimal" value="${esc(g.cotacao || "")}" placeholder="${r ? fmt(r, 2) : ""}"></div>
        <div class="fld"><label for="cot2-d">Data / fonte</label><input id="cot2-d" value="${esc(g.data || "")}" placeholder="ex.: ${new Date().toLocaleDateString("pt-BR")} · comprador"></div>
        <div style="display:flex;gap:8px;align-items:flex-end"><button type="submit" class="btn sm">Salvar</button>${g.cotacao ? `<button type="button" class="btn sm ghost" id="cot2-x">Voltar para a automática</button>` : ""}</div></form>` : ""}`;
    const st = host.querySelector(".stats"); if (st) st.after(el); else host.prepend(el);
    const f = $("#fcot2", el); if (f) f.onsubmit = e => { e.preventDefault(); save(Store.set("config", "geral", {cotacao: $("#cot2-v").value.trim(), data: $("#cot2-d").value.trim(), em: nowISO()})).then(() => toast("Cotação de referência salva")); };
    const x = $("#cot2-x", el); if (x) x.onclick = () => save(Store.set("config", "geral", {cotacao: "", data: "", em: nowISO()})).then(() => toast("Usando a cotação automática"));
  };
  return {refKg, refKgEm, ouvir, atualizar, it, CA};
})();
