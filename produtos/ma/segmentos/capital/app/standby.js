/* ================= KINSEY CAPITAL · VIGÊNCIA DO MANDATO E STANDBY =================
   Vigência: o prazo final do mandato (assinatura + prazo, ou data informada) aparece no dossiê, no cartão do target e na
   Base inicial; a 60 dias do fim entra a bandeira vermelha "Mandato prestes a vencer · necessidade de renovação"; vencido,
   o sistema pede a renovação.
   Standby (o target sai do globo, da faixa, das listas e das indicações; a base fica limpa, nada é apagado):
   - mandato assinado e vigente: não vai para standby; só com a rescisão registrada (data, motivo, documento) ou
     com o mandato vencido (o sistema confere o prazo);
   - frio: o consultor coloca em standby direto, com o motivo;
   - morno: só depois do questionário (contato recente, NDA, interesse em vender, investidor em conversa, política);
   - quente: só quando o prazo do mandato foi perdido, e o sistema pede a renovação ao colocar.
   Sugestões automáticas: frios sem mandato, sem NDA e com menor faturamento (fora da política ou sem dado). */
if (window.KT_DD) (() => {
  const D = KT_DD, DIA = 864e5, AVISO = 60, nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const dBR = d => d ? new Date(String(d).slice(0, 10) + "T12:00").toLocaleDateString("pt-BR") : "—";
  const hoje = () => new Date().toISOString().slice(0, 10);
  const temp = s => { const t = nrm(s.mapa?.temperatura || s.temperatura); return /quent/.test(t) ? "quente" : /morn/.test(t) ? "morno" : /fri/.test(t) ? "frio" : (s.mandato?.status === "assinado" ? "quente" : "frio"); };
  const TEMP = {frio:"Frio", morno:"Morno", quente:"Quente"};
  /* ---------------- vigência ---------------- */
  function vigencia(s){
    const m = s.mandato || {}; if (m.status !== "assinado") return {st:"sem"};
    if (m.rescisao?.data) return {st:"rescindido", fim:m.rescisao.data, dias:Math.round((new Date(m.rescisao.data) - new Date(hoje())) / DIA)};
    let fim = m.fim || ""; const ini = m.assinadoEm || m.inicio || "", pr = parseInt(String(m.prazo || "").replace(/\D/g, "")) || 0, anos = /ano/i.test(String(m.prazo || ""));
    if (!fim && ini && pr){ const d = new Date(ini + "T12:00"); d.setMonth(d.getMonth() + (anos ? pr * 12 : pr)); fim = d.toISOString().slice(0, 10); }
    if (!fim) return {st:"semPrazo", ini};
    const dias = Math.round((new Date(fim + "T12:00") - new Date(hoje() + "T12:00")) / DIA);
    return {st:dias < 0 ? "vencido" : dias <= AVISO ? "vencendo" : "vigente", fim, ini, dias, renov:m.renovacao};
  }
  const flag = v => v.st === "vencendo" ? `Mandato prestes a vencer (${v.dias} dia(s), em ${dBR(v.fim)}) · necessidade de renovação` : v.st === "vencido" ? `Mandato vencido em ${dBR(v.fim)} · solicitar a renovação` : v.st === "semPrazo" ? "Mandato assinado sem prazo final: informe a data de assinatura e o prazo" : "";
  /* ---------------- regras do standby ---------------- */
  const NDA = s => !!(s.nda?.aceito || Object.values(s.mandato?.acessos || {}).some(a => /nda|dataroom|ioi|loi/.test(a?.status || "")));
  function regra(s){
    const v = vigencia(s), t = temp(s);
    if (v.st === "vigente" || v.st === "vencendo") return {ok:false, exige:"rescisao", t, v, msg:`Mandato assinado e vigente até ${dBR(v.fim)}: há compromisso com o cliente. Para o standby, registre a rescisão do mandato.`};
    if (v.st === "semPrazo") return {ok:false, exige:"rescisao", t, v, msg:"Mandato assinado sem prazo final conhecido: informe a vigência (assinatura e prazo) ou registre a rescisão."};
    if (v.st === "vencido" || v.st === "rescindido") return {ok:true, exige:v.st, t, v, msg:v.st === "vencido" ? `Mandato vencido em ${dBR(v.fim)}: pode ir para standby; o sistema registra o pedido de renovação.` : `Mandato rescindido em ${dBR(v.fim)}: pode ir para standby.`};
    if (t === "quente") return {ok:false, exige:"mandato", t, v, msg:"Contato quente só vai para standby quando o prazo do mandato foi perdido. Inclua o mandato e a vigência, ou registre que venceu."};
    if (t === "morno") return {ok:true, exige:"questionario", t, v, msg:"Contato morno: responda o questionário para o sistema avaliar."};
    return {ok:true, exige:"motivo", t, v, msg:"Contato frio: informe o motivo."};
  }
  const QUEST = [["contato", "Houve contato com o target nos últimos 90 dias?", "sim"], ["nda", "Há NDA assinado ou em negociação?", "sim"], ["interesse", "O target manifestou interesse em vender nos próximos 12 meses?", "sim"], ["investidor", "Há investidor interessado ou em conversa sobre este target?", "sim"], ["politica", "O target está dentro da política (faturamento de R$ 15 mi a R$ 10 bi)?", "sim"]];
  const sugeridos = () => S.suppliers.filter(s => s.nivel === "N3" && !s.standby?.ativo && s.etapa !== "descartada" && temp(s) === "frio" && s.mandato?.status !== "assinado" && !NDA(s) && (!window.KT_POL || KT_POL.politica(s).st !== "ok")).sort((a, b) => (KT_POL?.fatMi(a) ?? -1) - (KT_POL?.fatMi(b) ?? -1));
  /* ---------------- telas ---------------- */
  function colocar(s){
    const R = regra(s), ed = D.ed(); if (!ed) return;
    const corpo = R.exige === "rescisao" ? `<div class="banner" style="border-color:var(--bad)">${esc(R.msg)}</div><div class="form"><div class="fld"><label for="sb-rd">Data da rescisão</label><input id="sb-rd" type="date"></div><div class="fld"><label for="sb-rf">Documento (distrato ou notificação)</label><input id="sb-rf" type="file" accept=".pdf,.docx,.txt"></div><div class="fld full"><label for="sb-rm">Motivo da rescisão</label><input id="sb-rm" placeholder="ex.: distrato assinado pelas partes em comum acordo"></div></div>`
      : R.exige === "mandato" ? `<div class="banner" style="border-color:var(--bad)">${esc(R.msg)}</div><div class="form"><div class="fld"><label for="sb-ma">Mandato assinado em</label><input id="sb-ma" type="date" value="${esc(s.mandato?.assinadoEm || "")}"></div><div class="fld"><label for="sb-mp">Prazo (meses)</label><input id="sb-mp" inputmode="numeric" value="${esc(String(s.mandato?.prazo || "").replace(/\D/g, ""))}"></div><div class="fld"><label for="sb-mf">ou prazo final</label><input id="sb-mf" type="date" value="${esc(s.mandato?.fim || "")}"></div></div><p class="sub" style="margin:0">O sistema confere: se o prazo já venceu, o target vai para standby e a renovação é solicitada.</p>`
      : R.exige === "questionario" ? `<p class="sub" style="margin:0">${esc(R.msg)}</p>${QUEST.map(([k, q]) => `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;border-top:1px solid var(--line);padding-top:8px"><span style="font-size:13.5px">${esc(q)}</span><select data-sq="${k}" style="max-width:110px"><option value="">—</option><option value="sim">Sim</option><option value="nao">Não</option></select></div>`).join("")}<div class="fld"><label for="sb-m">Motivo</label><input id="sb-m" placeholder="ex.: sócios sem interesse no momento"></div>`
      : `<p class="sub" style="margin:0">${esc(R.msg)}</p><div class="fld"><label for="sb-m">Motivo</label><input id="sb-m" placeholder="ex.: sem retorno, faturamento abaixo da política"></div>`;
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(s.nome)} · ${TEMP[R.t]}</div><h2>Colocar em standby</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="fsb" style="display:flex;flex-direction:column;gap:10px" novalidate>${corpo}<p class="err" id="sb-err" hidden></p>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">${R.exige === "rescisao" ? "Registrar rescisão e colocar em standby" : R.exige === "mandato" ? "Conferir o mandato" : "Colocar em standby"}</button></div></form>`);
    const err = t => { $("#sb-err").textContent = t; $("#sb-err").hidden = false; }, v = id => ($("#" + id)?.value || "").trim();
    $("#fsb").onsubmit = async e => { e.preventDefault(); const base = {ativo:true, em:nowISO(), por:Store.me?.email || "", temperatura:R.t};
      if (R.exige === "rescisao"){ if (!v("sb-rd") || !v("sb-rm")){ err("Informe a data e o motivo da rescisão."); return; } const f = $("#sb-rf").files[0];
        await D.up(s, {mandato:{rescisao:{data:v("sb-rd"), motivo:v("sb-rm"), arquivo:f?.name || "", em:nowISO(), por:Store.me?.email || ""}}, standby:{...base, regra:"mandato rescindido", motivo:v("sb-rm")}}); }
      else if (R.exige === "mandato"){ const pa = {assinadoEm:v("sb-ma"), prazo:v("sb-mp"), fim:v("sb-mf"), status:"assinado"}; const vv = vigencia({...s, mandato:{...(s.mandato || {}), ...pa}});
        if (vv.st !== "vencido"){ await D.up(s, {mandato:pa}); close(); toast(vv.st === "semPrazo" ? "Informe a data de assinatura e o prazo." : `Mandato vigente até ${dBR(vv.fim)}: o target não pode ir para standby.`); return; }
        await D.up(s, {mandato:{...pa, renovacao:{solicitadaEm:nowISO(), por:Store.me?.email || ""}}, standby:{...base, regra:"mandato vencido", motivo:`Mandato vencido em ${dBR(vv.fim)}; renovação solicitada`}}); }
      else if (R.exige === "questionario"){ const Q = {}; for (const [k] of QUEST){ const x = $(`[data-sq="${k}"]`).value; if (!x){ err("Responda todas as perguntas."); return; } Q[k] = x; }
        const imp = QUEST.filter(([k, , r]) => Q[k] === r && k !== "politica").map(([, q]) => q.replace(/\?$/, ""));
        if (imp.length){ err(`Não pode ir para standby: ${imp.join("; ")}. Mantenha o acompanhamento.`); await D.up(s, {standbyQuest:{em:nowISO(), resp:Q, resultado:"negado"}}); return; }
        if (!v("sb-m")){ err("Informe o motivo."); return; } await D.up(s, {standby:{...base, regra:"questionário morno", motivo:v("sb-m"), questionario:Q}}); }
      else if (R.exige === "vencido"){ await D.up(s, {mandato:{renovacao:{solicitadaEm:nowISO(), por:Store.me?.email || ""}}, standby:{...base, regra:"mandato vencido", motivo:v("sb-m") || "mandato vencido"}}); }
      else { if (!v("sb-m")){ err("Informe o motivo."); return; } await D.up(s, {standby:{...base, regra:R.exige === "rescindido" ? "mandato rescindido" : "contato frio", motivo:v("sb-m")}}); }
      close(); toast(R.exige === "vencido" || R.exige === "mandato" ? "Target em standby · renovação do mandato solicitada" : "Target em standby"); renderAll(); };
  }
  const reativar = s => D.up(s, {standby:{ativo:false, reativadoEm:nowISO(), por:Store.me?.email || ""}}).then(() => { toast("Target reativado"); renderAll(); });
  function painel(){
    const L = S.suppliers.filter(s => s.nivel === "N3" && s.standby?.ativo), Sg = sugeridos(), ed = D.ed();
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Base inicial</div><h2>Standby</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px"><p class="sub" style="margin:0">Targets em standby saem do globo, da faixa, das listas e das indicações. Nada é apagado: reative quando quiser. Mandato assinado e vigente não vai para standby.</p>
      <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3 style="margin:0">Sugeridos pelo sistema (${Sg.length})</h3><p class="sub" style="margin:0">Frios, sem mandato, sem NDA e com menor faturamento.</p>
        ${Sg.slice(0, 40).map(s => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;border-top:1px solid var(--line);padding-top:6px"><span style="min-width:0"><b>${esc(s.nome)}</b> <span class="sub" style="font-size:12px">${esc([s.uf, KT_POL?.fatMi(s) != null ? `fat. R$ ${fmt(KT_POL.fatMi(s), 1)} mi` : "sem faturamento"].filter(Boolean).join(" · "))}</span></span>${ed ? `<button type="button" class="btn sm" data-sbc="${s.id}">Standby</button>` : ""}</div>`).join("") || `<p class="sub" style="margin:0">Nenhum.</p>`}
        ${ed && Sg.length > 1 ? `<button type="button" class="btn sm primary" id="sb-todos" style="align-self:flex-start">Colocar os ${Math.min(Sg.length, 40)} sugeridos em standby</button>` : ""}</div>
      <div class="card" style="display:flex;flex-direction:column;gap:6px"><h3 style="margin:0">Em standby (${L.length})</h3>${L.map(s => `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;border-top:1px solid var(--line);padding-top:6px"><span style="min-width:0"><b>${esc(s.nome)}</b> <span class="sub" style="font-size:12px">${esc(s.standby.regra || "")} · ${esc(s.standby.motivo || "")} · ${dt(s.standby.em)}</span></span>${ed ? `<button type="button" class="btn sm" data-sbr="${s.id}">Reativar</button>` : ""}</div>`).join("") || `<p class="sub" style="margin:0">Nenhum target em standby.</p>`}</div></div>`);
    $$("[data-sbc]").forEach(b => b.onclick = () => { close(); colocar(supById(b.dataset.sbc)); });
    $$("[data-sbr]").forEach(b => b.onclick = () => { reativar(supById(b.dataset.sbr)); close(); });
    const t = $("#sb-todos"); if (t) t.onclick = async () => { t.disabled = true; for (const s of Sg.slice(0, 40)) await D.up(s, {standby:{ativo:true, em:nowISO(), por:Store.me?.email || "", temperatura:"frio", regra:"sugestão do sistema (frio)", motivo:"frio, sem mandato, sem NDA e menor faturamento"}}); close(); toast(`${Math.min(Sg.length, 40)} target(s) em standby`); renderAll(); };
  }
  /* ---------------- esconder os em standby ---------------- */
  const _f = window.ORB_FILTRO; if (_f) window.ORB_FILTRO = s => (!s.standby?.ativo || S.sel === s.id || S.orb?.standby) && _f(s);
  /* ---------------- dossiê: vigência, bandeira e botão ---------------- */
  const _b = renderSupBody;
  renderSupBody = function(){ const r = _b.apply(this, arguments), s = supById(S.openSup), b = $("#sup-body"); if (!s || s.nivel !== "N3" || !b || b.querySelector("[data-vig]")) return r;
    const v = vigencia(s), R = regra(s), f = flag(v), el = document.createElement("div"); el.setAttribute("data-vig", "1"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:6px" + (f ? ";border-color:var(--bad)" : "");
    el.innerHTML = `${f ? `<div style="color:var(--bad);font-weight:700;font-size:13.5px">● ${esc(f)}</div>` : ""}${s.standby?.ativo ? `<div class="banner">Em standby desde ${dt(s.standby.em)} · ${esc(s.standby.regra || "")} · ${esc(s.standby.motivo || "")}</div>` : ""}
      <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><div style="font-size:13px">${v.st === "sem" ? "Sem mandato assinado" : v.st === "semPrazo" ? "Mandato assinado · prazo final não informado" : `Mandato ${v.st === "rescindido" ? "rescindido em" : "· prazo final"} <b>${dBR(v.fim)}</b>${v.st === "vigente" || v.st === "vencendo" ? ` (faltam ${v.dias} dias)` : ""}`} · contato ${TEMP[R.t].toLowerCase()}${v.renov ? ` · renovação solicitada em ${dt(v.renov.solicitadaEm)}` : ""}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${(v.st === "vencendo" || v.st === "vencido") && D.ed() && !v.renov ? `<button type="button" class="btn sm primary" data-vren>Solicitar renovação</button>` : ""}${D.ed() ? (s.standby?.ativo ? `<button type="button" class="btn sm" data-vsr>Reativar</button>` : `<button type="button" class="btn sm" data-vsb>Standby</button>`) : ""}</div></div>`;
    b.prepend(el);
    const sb = $("[data-vsb]", el); if (sb) sb.onclick = () => colocar(s);
    const sr = $("[data-vsr]", el); if (sr) sr.onclick = () => reativar(s);
    const rn = $("[data-vren]", el); if (rn) rn.onclick = () => D.up(s, {mandato:{renovacao:{solicitadaEm:nowISO(), por:Store.me?.email || ""}}, interacoes:{["i" + Date.now().toString(36)]:{data:hoje(), tipo:"Renovação de mandato", resumo:`Renovação do mandato solicitada (prazo final ${dBR(v.fim)})`, proximo:"Enviar minuta de renovação ao cliente", prazo:v.fim, por:Store.me?.email || ""}}}).then(() => toast("Renovação solicitada e registrada em Interações"));
    return r; };
  /* cartão do target no globo */
  if (window.EXT_TARGET) EXT_TARGET.push((s, el) => { if (s.nivel !== "N3") return; const f = flag(vigencia(s)); if (!f && !s.standby?.ativo) return; const d = document.createElement("div"); d.style.cssText = "grid-column:1/-1;font-size:11.5px;font-weight:700;color:" + (f ? "var(--bad)" : "var(--muted)"); d.textContent = f ? "● " + f : "Em standby"; el.appendChild(d); });
  /* Base inicial: alertas de mandato e acesso ao standby */
  const _cad = renderCadeia;
  renderCadeia = function(){ const r = _cad.apply(this, arguments), top = $("#bi-top"); if (!top || $("#bi-sb")) return r;
    const V = S.suppliers.filter(s => s.nivel === "N3").map(s => ({s, v:vigencia(s)})).filter(x => x.v.st === "vencendo" || x.v.st === "vencido" || x.v.st === "semPrazo"), nSb = S.suppliers.filter(s => s.nivel === "N3" && s.standby?.ativo).length, nSg = sugeridos().length;
    const el = document.createElement("div"); el.className = "card"; el.id = "bi-sb"; el.style.cssText = "display:flex;flex-direction:column;gap:6px;margin-top:10px" + (V.some(x => x.v.st !== "semPrazo") ? ";border-color:var(--bad)" : "");
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Mandatos e standby</div><h3 style="margin:0">${V.length ? `${V.length} mandato(s) exigem atenção` : "Mandatos em dia"}</h3></div><button type="button" class="btn sm" id="bi-sbv">Standby (${nSb}) · sugeridos ${nSg}</button></div>
      ${V.slice(0, 6).map(x => `<div style="font-size:13px;${x.v.st !== "semPrazo" ? "color:var(--bad)" : ""}">● <b>${esc(x.s.nome)}</b>: ${esc(flag(x.v))}</div>`).join("")}`;
    const ref = $("#bi-ind"); if (ref) ref.before(el); else top.appendChild(el);
    $("#bi-sbv", el).onclick = painel; return r; };
  window.KT_SB = {vigencia, regra, colocar, reativar, painel, sugeridos, flag, temp};
})();
