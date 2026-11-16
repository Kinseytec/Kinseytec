/* ================= PROSPECÇÃO E MÉRITO =================
   Prospecção: antessala do cadastro inicial, só para contato frio (SDR, novos negócios, listas do Econodata e do
   Lemitti, campanhas do Ramper). Fica numa coleção própria ("prospects"): não entra na Base inicial, na Órbita, nas
   indicações nem nas análises. A única saída para a base é "Promover a target", depois da reunião realizada com a
   empresa e da possibilidade de venda; a origem e o histórico de abordagem vão junto.
   Controle de quem abordou: um responsável por empresa, com exclusividade por prazo sem contato (configurável);
   duplicidade conferida por CNPJ e nome contra a prospecção e a base.
   Mérito (regras provisórias até a política de M&A da Kinsey): originação do mandato 10% do success fee e do
   investidor 5%, só para o time de M&A, divididos entre quem participou diretamente; SDR 5% em serviços separados
   (due diligence, auditoria, valuation…) quando participa ativamente; sócios e novos negócios 15% em serviços separados
   ou retainers, divididos entre os participantes. */
if (window.KT_DD) (() => {
  const D = KT_DD, {mi, pc} = D;
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\b(ltda|s\.?a\.?|eireli|me|epp)\b\.?/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const dig = v => String(v ?? "").replace(/\D/g, "");
  const fmtCnpj = d => d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : d;
  const dt = d => d ? new Date(d).toLocaleDateString("pt-BR") : "";
  const novoId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  S.prospects = S.prospects || [];
  const PAPEL = {socio:"Sócio", mna:"Time de M&A", novos:"Novos negócios", sdr:"SDR"};
  const ORIGENS = ["Econodata", "Lemitti", "Ramper", "SDR", "Novos negócios", "Indicação", "Manual"];
  const CANAIS = ["Ligação", "E-mail", "WhatsApp", "LinkedIn", "Reunião", "Outro"];
  const RESULT = ["Sem resposta", "Respondeu", "Pediu retorno", "Sem interesse", "Reunião marcada", "Reunião realizada", "Proposta de serviços enviada", "Mandato em negociação"];
  const QUENTE = ["Reunião realizada", "Proposta de serviços enviada", "Mandato em negociação"];
  const ST = {novo:"Novo", abordagem:"Em abordagem", marcada:"Reunião marcada", realizada:"Aguardando aprovação M&A", promovido:"Aprovado · no cadastro M&A", arquivado:"Arquivado"};
  const REGRAS0 = {mandato:10, investidor:5, sdrServicos:5, socioServicos:15, exclusivDias:90, elegiveis:["socio", "mna", "novos"], metaAbordagens:15, metaReunioes:1};
  const regras = () => ({...REGRAS0, ...(S.config.merito?.regras || {})});
  const papelCargo = c => /novos neg/i.test(c) ? "novos" : /\bsdr\b/i.test(c) ? "sdr" : /s[oó]ci/i.test(c) ? "socio" : "mna";
  const equipe = () => { const cfg = S.config.merito?.equipe || [], base = (typeof EQUIPE_KINSEY !== "undefined" ? EQUIPE_KINSEY : []).map(([nome, cargo]) => ({nome, cargo, papel:papelCargo(cargo)}));
    const out = [...cfg]; base.forEach(b => { if (!out.some(x => x.nome === b.nome)) out.push(b); }); return out.filter(x => !x.inativo); };
  /* membros cadastrados aparecem também nos consultores da Due Diligence, no sócio do projeto e nos relatórios */
  const sincroniza = () => { if (typeof EQUIPE_KINSEY === "undefined") return; equipe().forEach(e => { if (!EQUIPE_KINSEY.some(x => x[0] === e.nome)) EQUIPE_KINSEY.push([e.nome, e.cargo || PAPEL[e.papel] || ""]); }); };
  { const _ra = window.renderAll; if (typeof _ra === "function") window.renderAll = renderAll = function(){ sincroniza(); return _ra.apply(this, arguments); }; }
  const papelDe = nome => equipe().find(e => e.nome === nome)?.papel || "";
  const eu = () => S.prosEu || equipe()[0]?.nome || "";
  const ed = () => Store.me?.canWrite !== false;

  /* ---------------- dados ---------------- */
  const ultimo = p => (p.toques || []).slice().sort((a, b) => String(b.em).localeCompare(a.em))[0];
  const exclusivoAte = p => { if (!p.responsavel || ["promovido", "arquivado"].includes(p.status)) return null; const base = ultimo(p)?.em || p.desde || p.criadoEm; const d = new Date(base); d.setDate(d.getDate() + regras().exclusivDias); return d; };
  const livre = p => !p.responsavel || (exclusivoAte(p) && exclusivoAte(p) < new Date());
  function duplicado(o){ const d = dig(o.doc || o.cnpj || ""), n = nrm(o.nome);
    const naBase = S.suppliers.find(s => s.id !== o.orbitaId && s.id !== o.promovido?.supId && ((d.length === 14 && dig(s.doc) === d) || (n && nrm(s.nome) === n)));
    const naPros = S.prospects.find(p => p.id !== o.id && ((d.length === 14 && dig(p.doc) === d) || (n && nrm(p.nome) === n)));
    return {naBase, naPros}; }
  const N1s = () => S.suppliers.filter(x => x.nivel === "N1" && !(window.KT_DECL && KT_DECL.dec(x)));
  /* prospect de investidor (N1): comprador estratégico ou financeiro abordado para conhecer os targets da base */
  const ehInv = p => p?.alvo === "investidor";
  const TIPOS_INV = ["Investidor estratégico", "Investidor estratégico (multinacional)", "Private equity", "Family office", "Fundo de investimento", "Outro investidor"];
  const comoInv = p => ({nivel:"N1", id:"pros:" + p.id, nome:p.nome, tese:{texto:p.tese || "", atividades:p.tese || p.segmento || "", cnaes:p.cnaesTese || "", segmentos:p.segmentos || []}});
  const APR = new WeakMap();
  function paraApresentar(p){ if (!ehInv(p) || !window.KT_ORBINV?.aderente) return []; if (APR.has(p)) return APR.get(p); const inv = comoInv(p), L = [];
    S.suppliers.filter(t => t.nivel === "N3" && !(window.KT_DECL && KT_DECL.dec(t))).forEach(t => { let m = null; try{ m = KT_ORBINV.aderente(inv, t); }catch(e){} if (m) L.push({t, m}); }); APR.set(p, L); return L; }
  const alvo = p => ({nivel:"N3", id:"pros:" + p.id, nome:p.nome, doc:p.doc || "", uf:p.uf || "", municipio:p.municipio || "", segmento:p.segmento || "", cnae:dig(p.cnae).slice(0, 7), mapa:{segmentoTxt:[p.segmento, p.cnae].filter(Boolean).join(" "), fat:p.fat || ""}, investidores:p.investidores || []});
  const ADER = new WeakMap();
  function aderentes(p){ if (ehInv(p)) return []; if (ADER.has(p)) return ADER.get(p); const t = alvo(p), L = [];
    N1s().forEach(inv => { let m = null; if ((p.investidores || []).includes(inv.id)) m = "prospectado para o investidor"; else { try{ m = window.KT_ORBINV ? KT_ORBINV.aderente(inv, t) : null; }catch(e){} } if (m) L.push({inv, m}); });
    ADER.set(p, L); return L; }
  const publicado = () => !!(window.firebase?.functions && Store.db);
  const FONTES = {Econodata:"econodata", Lemitti:"lemitti", Ramper:"ramper"};
  const salvar = (id, o) => save(Store.set("prospects", id, o));
  const atualizar = (p, patch) => save(Store.update("prospects", p.id, patch));


  /* ---------------- painel de novos negócios: evolução semanal, reuniões e alerta de prospecção ----------------
     Mede o trabalho de quem prospecta para M&A (em especial a área de novos negócios): abordagens registradas,
     reuniões marcadas e realizadas, empresas que entraram na Órbita, NDAs e mandatos. Semana fechada sem
     abordagem ou sem reunião aparece com zero em vermelho; 7 dias sem atividade acende "Necessidade de prospecção". */
  const POSSIB = ["Alta", "Média", "Baixa", "Sem possibilidade"];
  const semana = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const diasDesde = d => d ? Math.floor((Date.now() - new Date(d).getTime()) / 864e5) : null;
  function atividade(pes){
    const T = [], R = [];
    S.prospects.forEach(p => (p.toques || []).forEach(t => { if (t.por !== pes) return; T.push({p, t});
      if (t.resultado === "Reunião marcada") R.push({p, t, quando:t.reuniaoEm || t.em, tipo:"marcada"});
      if (QUENTE.includes(t.resultado)) R.push({p, t, quando:t.em, tipo:"realizada"}); }));
    const orb = S.suppliers.filter(s => s.prospeccao?.responsavel === pes || s.prospeccao?.por === pes && s.prospeccao?.preCadastro);
    return {T, R, orb};
  }
  function situacaoReuniao(r){
    if (r.tipo === "realizada") return ["Realizada", "r-baixo"];
    const feita = (r.p.toques || []).some(t => QUENTE.includes(t.resultado) && t.em >= r.t.em);
    if (feita) return ["Realizada", "r-baixo"];
    if (r.p.status === "arquivado") return ["Cancelada", "r-pend"];
    return new Date(r.quando) < semana(new Date()) || diasDesde(r.quando) > 1 ? ["Sem registro do resultado", "r-alto"] : ["Agendada", "r-medio"];
  }
  function grafico(T, R, mT, mR){
    const N = 12, hoje = semana(new Date()), W = [];
    for (let i = N - 1; i >= 0; i--){ const a = new Date(hoje); a.setDate(a.getDate() - 7 * i); const b = new Date(a); b.setDate(b.getDate() + 7);
      const em = x => { const d = new Date(x); return d >= a && d < b; };
      W.push({a, atual:i === 0, t:T.filter(x => em(x.t.em)).length, r:R.filter(x => x.tipo === "marcada" && em(x.t.em)).length + R.filter(x => x.tipo === "realizada" && em(x.t.em)).length}); }
    const VW = 720, VH = 230, x0 = 34, y0 = 26, ch = 150, cw = (VW - x0 - 10) / N, mx = Math.max(mT, ...W.map(w => w.t), 4), my = Math.max(mR * 2, ...W.map(w => w.r), 2);
    const yT = v => y0 + ch - v / mx * ch, yR = v => y0 + ch - v / my * ch;
    let g = `<svg viewBox="0 0 ${VW} ${VH}" style="width:100%;height:auto;display:block" role="img" aria-label="Evolução semanal de abordagens e reuniões">`;
    g += `<line x1="${x0}" x2="${VW - 10}" y1="${y0 + ch}" y2="${y0 + ch}" stroke="rgba(150,190,240,.35)"/>`;
    g += `<line x1="${x0}" x2="${VW - 10}" y1="${yT(mT)}" y2="${yT(mT)}" stroke="#4FB0F5" stroke-dasharray="4 4" opacity=".7"/>`;
    W.forEach((w, i) => { const cx = x0 + i * cw, bw = cw * .32, fech = !w.atual, zero = fech && (w.t === 0 || w.r === 0);
      if (fech && w.t === 0 && w.r === 0) g += `<rect x="${cx + 2}" y="${y0 - 6}" width="${cw - 4}" height="${ch + 6}" rx="6" fill="rgba(229,72,77,.16)"/>`;
      g += `<rect x="${cx + cw * .14}" y="${yT(w.t)}" width="${bw}" height="${y0 + ch - yT(w.t)}" rx="3" fill="${w.t >= mT ? "#36D399" : w.t ? "#0473C3" : "#E5484D"}"/>`;
      g += `<rect x="${cx + cw * .52}" y="${yR(w.r)}" width="${bw}" height="${y0 + ch - yR(w.r)}" rx="3" fill="${w.r >= mR ? "#F4C440" : w.r ? "#C9A227" : "#E5484D"}"/>`;
      g += `<text x="${cx + cw * .14 + bw / 2}" y="${(w.t ? yT(w.t) : y0 + ch) - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${fech && !w.t ? "#FF6B6B" : "#E6E8EC"}">${w.t}</text>`;
      g += `<text x="${cx + cw * .52 + bw / 2}" y="${(w.r ? yR(w.r) : y0 + ch) - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${fech && !w.r ? "#FF6B6B" : "#F4C440"}">${w.r}</text>`;
      g += `<text x="${cx + cw / 2}" y="${y0 + ch + 16}" text-anchor="middle" font-size="10" fill="${zero ? "#FF8A8A" : "#9fb3cf"}">${w.a.toLocaleDateString("pt-BR", {day:"2-digit", month:"2-digit"})}</text>`;
      if (w.atual) g += `<text x="${cx + cw / 2}" y="${y0 + ch + 29}" text-anchor="middle" font-size="9" fill="#9fb3cf">em curso</text>`; });
    g += `<g font-size="11" fill="#cfd8e6"><rect x="${x0}" y="4" width="10" height="10" rx="2" fill="#0473C3"/><text x="${x0 + 14}" y="13">Abordagens (prospecções)</text><rect x="${x0 + 190}" y="4" width="10" height="10" rx="2" fill="#F4C440"/><text x="${x0 + 204}" y="13">Reuniões (marcadas e realizadas)</text><rect x="${x0 + 420}" y="4" width="10" height="10" rx="2" fill="#E5484D"/><text x="${x0 + 434}" y="13">Zero na semana</text><line x1="${x0 + 545}" x2="${x0 + 565}" y1="9" y2="9" stroke="#4FB0F5" stroke-dasharray="4 3"/><text x="${x0 + 570}" y="13">Meta (${mT})</text></g></svg>`;
    return {svg:g, W};
  }
  function painel(){
    const E = equipe(), padrao = E.find(e => e.papel === "novos")?.nome || eu(), pes = S.prosPainel && E.some(e => e.nome === S.prosPainel) ? S.prosPainel : padrao, R0 = regras();
    const {T, R, orb} = atividade(pes), G = grafico(T, R, R0.metaAbordagens, R0.metaReunioes);
    const ultT = T.map(x => x.t.em).sort().pop(), ultR = R.map(x => x.t.em).sort().pop(), dT = diasDesde(ultT), dR = diasDesde(ultR);
    const ini = new Date(); ini.setDate(1); ini.setHours(0, 0, 0, 0); const mes = x => new Date(x) >= ini;
    const nda = orb.filter(s => s.nda?.aceito).length, mand = orb.filter(s => s.mandato?.status === "assinado").length;
    const zeradas = G.W.filter(w => !w.atual && (w.t === 0 || w.r === 0)).length;
    const alerta = dT == null || dT >= 7 || dR == null || dR >= 7;
    const RR = R.slice().sort((a, b) => String(b.quando).localeCompare(a.quando)), prox = RR.filter(r => situacaoReuniao(r)[0] === "Agendada");
    const k = (l, v, sm, cor) => `<div class="dd-k"${cor ? ` style="border-color:${cor}"` : ""}><span>${l}</span><b${cor ? ` style="color:${cor}"` : ""}>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    return `<div class="card pr-painel" style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px">
      <div class="head" style="margin:0;flex-wrap:wrap;gap:8px"><div><div class="eyebrow">Controle de novos negócios · M&A</div><h3 style="margin:0">Evolução de ${esc(pes)}</h3><p class="sub" style="margin:2px 0 0;font-size:12.5px">${esc(PAPEL[papelDe(pes)] || "")} · metas por semana: ${R0.metaAbordagens} abordagens e ${R0.metaReunioes} reunião(ões). Semana fechada com zero fica em vermelho.</p></div>
        <select id="pr-pp" aria-label="Pessoa">${E.map(e => `<option ${e.nome === pes ? "selected" : ""}>${esc(e.nome)}</option>`).join("")}</select></div>
      ${alerta ? `<div class="banner pr-alerta"><b>Necessidade de prospecção.</b> ${dT == null ? "Nenhuma abordagem registrada" : dT >= 7 ? `${dT} dias sem abordagem` : `última abordagem há ${dT} dia(s)`} · ${dR == null ? "nenhuma reunião registrada" : dR >= 7 ? `${dR} dias sem reunião` : `última reunião há ${dR} dia(s)`}.</div>` : ""}
      <div class="dd-kpis">${k("Abordagens no mês", T.filter(x => mes(x.t.em)).length, `última: ${ultT ? dt(ultT) : "—"}`, dT == null || dT >= 7 ? "#FF6B6B" : "")}${k("Reuniões marcadas no mês", R.filter(x => x.tipo === "marcada" && mes(x.t.em)).length, `${prox.length} agendada(s) à frente`, dR == null || dR >= 7 ? "#FF6B6B" : "")}${k("Reuniões realizadas no mês", R.filter(x => x.tipo === "realizada" && mes(x.t.em)).length)}${k("Empresas na Órbita", orb.length, "originadas por ela(e)")}${k("NDAs assinados", nda, `${mand} mandato(s)`)}${k("Semanas zeradas", zeradas, "últimas 12 semanas", zeradas ? "#FF6B6B" : "")}</div>
      <div class="pr-graf">${G.svg}</div>
      <div><b style="font-size:13px">Controle de reuniões (${RR.length})</b>${RR.length ? `<div class="tbl"><table class="pr-t pr-reu"><thead><tr><th>Data</th><th>Empresa</th><th>Situação</th><th>Possibilidade de negociação</th><th>Órbita · NDA</th></tr></thead><tbody>${RR.slice(0, 15).map(r => { const [st, cl] = situacaoReuniao(r), sup = r.p.orbitaId ? supById(r.p.orbitaId) : r.p.promovido?.supId ? supById(r.p.promovido.supId) : null;
        return `<tr data-pr="${r.p.id}" class="mb-row"><td style="white-space:nowrap">${dt(r.quando)}<div class="sub" style="margin:0;font-size:11px">${r.tipo === "marcada" ? `marcada em ${dt(r.t.em)}` : "registrada"}</div></td><td><b>${esc(r.p.nome)}</b><div class="sub" style="margin:0;font-size:11px">${esc(r.t.nota || r.t.canal || "")}</div></td><td><span class="pill ${cl}" style="font-size:10.5px">${st}</span></td><td style="font-size:12.5px">${esc(r.t.possib || "—")}</td><td style="font-size:12px">${sup ? `na Órbita · ${sup.nda?.aceito ? "NDA assinado" : "NDA pendente"}` : `<span class="sub">ainda não</span>`}</td></tr>`; }).join("")}</tbody></table></div>` : `<p class="sub" style="margin:4px 0 0">Nenhuma reunião registrada por ${esc(pes)}. Registre o toque "Reunião marcada" com a data da reunião.</p>`}</div></div>`;
  }
  /* reunião agendada: o target entra na Órbita de M&A (pré-cadastro), ligado aos investidores aderentes */
  async function naOrbita(pid, t){
    const p = S.prospects.find(x => x.id === pid); if (!p || ehInv(p)) return null;
    const pre = p.orbitaId && supById(p.orbitaId);
    if (pre){ await save(Store.update("suppliers", pre.id, {mapa:{temperatura:pre.mapa?.temperatura === "Quente" ? "Quente" : "Morno"}, prospeccao:{reuniaoAgendada:t.reuniaoEm || t.em}})); return pre; }
    const {naBase} = duplicado(p); if (naBase) return null;
    const id = novoId("t"), agora = nowISO(), invs = aderentes(p).map(x => x.inv.id);
    const o = {nivel:"N3", nome:p.nome, doc:p.doc || "", uf:p.uf || "", municipio:p.municipio || "", pais:"Brasil", tipo:"Target vendedor", etapa:"reuniao", origem:p.origem || "Prospecção", criadoEm:agora, parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, investidores:invs,
      mapa:{temperatura:"Morno", fat:p.fat || "", segmentoTxt:p.segmento || p.cnae || "", site:p.site || "", aba:"Prospecção · reunião agendada"},
      prospeccao:{id:p.id, origem:p.origem, lista:p.lista || "", responsavel:p.responsavel || t.por, por:t.por, toques:(p.toques || []).length, reuniaoAgendada:t.reuniaoEm || t.em, possib:t.possib || "", preCadastro:true, em:agora}};
    if (window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(o); o.lat = lat; o.lng = lng; }
    await save(Store.set("suppliers", id, o)); await atualizar(p, {orbitaId:id}); return {id, invs};
  }

  /* ---------------- menu e tela ---------------- */
  const ICO = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/></svg>`;
  (() => { const nav = $("nav.tabs"), cad = nav && $("[data-go=cadeia]", nav); if (!nav || $("[data-go=prospeccao]", nav)) return;
    const b = document.createElement("button"); b.type = "button"; b.dataset.go = "prospeccao"; b.innerHTML = `${ICO}Prospecção`; b.onclick = () => go("prospeccao");
    nav.prepend(b);
    const v = $("#v-cadeia"); if (v) v.insertAdjacentHTML("afterend", `<section class="view" id="v-prospeccao" data-view="prospeccao" hidden><div class="pad" id="prospeccao"></div></section>`);
    [0, 300, 700, 1500].forEach(t => setTimeout(() => { if (nav.firstElementChild !== b) nav.prepend(b); }, t)); })();
  S.prosF = S.prosF || {q:"", st:"ativos", or:"", resp:"", inv:"", tp:""};

  EXT_VIEWS.prospeccao = function(){
    const host = $("#prospeccao"); if (!host) return; const F = S.prosF, R = regras();
    const all = S.prospects.slice().sort((a, b) => String(ultimo(b)?.em || b.criadoEm).localeCompare(ultimo(a)?.em || a.criadoEm));
    const L = all.filter(p => (F.st === "ativos" ? !["promovido", "arquivado"].includes(p.status) : F.st === "livres" ? livre(p) && !["promovido", "arquivado"].includes(p.status) : !F.st || p.status === F.st)
      && (!F.tp || (F.tp === "investidor") === ehInv(p)) && (!F.or || p.origem === F.or) && (!F.resp || p.responsavel === F.resp) && (!F.inv || aderentes(p).some(x => x.inv.id === F.inv)) && (!F.q || nrm([p.nome, p.doc, p.segmento, p.cnae, p.municipio, p.uf, p.responsavel, p.tese, p.tipoInv].join(" ")).includes(nrm(F.q))));
    const c = st => all.filter(p => p.status === st).length, k = (l, v, sm) => `<div class="dd-k"><span>${l}</span><b>${v}</b>${sm ? `<small>${sm}</small>` : ""}</div>`;
    const resps = [...new Set(all.map(p => p.responsavel).filter(Boolean))].sort();
    host.innerHTML = `<div class="head"><div><div class="eyebrow">KinseyTec – M&A · primeiro passo</div><h2>Prospecção</h2><p class="sub">Leads do SDR, da área de novos negócios e das listas do Econodata, do Lemitti e do Ramper. Quando o lead fica quente (reunião concluída, proposta de serviços ou mandato em negociação), o consultor de M&A aprova e a empresa vai sozinha para o cadastro M&A: Base inicial, Órbita, cadastro inicial e demais áreas. Investidores (N1) também são prospectados aqui: compradores estratégicos e financeiros abordados para conhecer os nossos targets.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${ed() ? `<button type="button" class="btn primary" id="pr-novo">+ Cadastro de prospecção</button><button type="button" class="btn" id="pr-inv">Prospectar para investidor</button><button type="button" class="btn" id="pr-imp">Importar lista</button>` : ""}<button type="button" class="btn" id="pr-mem">Equipe M&A e SDR</button><button type="button" class="btn" id="pr-eq">Regras de mérito</button></div></div>
      <div class="dd-kpis" style="margin-bottom:12px">${k("Em prospecção", all.filter(p => !["promovido", "arquivado"].includes(p.status)).length, `${all.filter(p => livre(p) && !["promovido", "arquivado"].includes(p.status)).length} livres`)}${k("Em abordagem", c("abordagem"))}${k("Reuniões marcadas", c("marcada"))}${k("Aguardando aprovação M&A", c("realizada"), "leads quentes")}${k("Aprovados", c("promovido"), "no cadastro M&A")}</div>
      ${painel()}
      <div class="card" style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="pr-q" placeholder="Buscar por nome, CNPJ, segmento, cidade ou responsável" value="${esc(F.q)}" style="flex:1 1 220px;min-width:0" aria-label="Buscar">
          <select id="pr-tp" aria-label="Tipo"><option value="">Targets e investidores</option><option value="target" ${F.tp === "target" ? "selected" : ""}>Só targets (N3)</option><option value="investidor" ${F.tp === "investidor" ? "selected" : ""}>Só investidores (N1)</option></select>
          <select id="pr-or" aria-label="Origem"><option value="">Todas as origens</option>${ORIGENS.map(o => `<option ${o === F.or ? "selected" : ""}>${o}</option>`).join("")}</select>
          <select id="pr-iv" aria-label="Investidor"><option value="">Todos os investidores</option>${N1s().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt")).map(i => `<option value="${i.id}" ${i.id === F.inv ? "selected" : ""}>${esc(i.nome)}</option>`).join("")}</select>
          <select id="pr-rs" aria-label="Responsável"><option value="">Todos os responsáveis</option>${resps.map(o => `<option ${o === F.resp ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
          <label class="sub" style="display:flex;gap:6px;align-items:center;margin:0">Sou <select id="pr-eu" aria-label="Quem está usando">${equipe().map(e => `<option ${e.nome === eu() ? "selected" : ""}>${esc(e.nome)}</option>`).join("")}</select></label></div>
        <div class="dd-tabs">${[["ativos", "Ativos"], ["livres", "Livres"], ["novo", "Novos"], ["abordagem", "Em abordagem"], ["marcada", "Reunião marcada"], ["realizada", "Aguardando aprovação"], ["promovido", "Aprovados"], ["arquivado", "Arquivados"]].map(([v, l]) => `<button type="button" class="fbtn" data-prst="${v}" aria-pressed="${F.st === v}">${l}</button>`).join("")}</div>
        ${L.length ? `<div class="tbl"><table class="pr-t"><thead><tr><th>Empresa</th><th>Origem</th><th>Responsável</th><th>Último toque</th><th>Situação</th><th></th></tr></thead><tbody>${L.slice(0, 300).map(p => { const u = ultimo(p), ex = exclusivoAte(p), lv = livre(p);
          return `<tr class="mb-row" data-pr="${p.id}"><td style="min-width:200px"><b>${esc(p.nome)}</b>${ehInv(p) ? ` <span class="pill pr-n1" style="font-size:10px">Investidor N1</span>` : ""}${p.temperatura ? ` <span class="tp tp-${nrm(p.temperatura)}" style="font-size:10px">${esc(p.temperatura)}</span>` : ""}<div class="sub" style="margin:0;font-size:11.5px">${esc([ehInv(p) ? p.tipoInv : "", p.segmento || p.cnae, [p.municipio, p.uf].filter(Boolean).join("/"), p.fat ? (ehInv(p) ? "receita " : "fat. ") + p.fat : "", p.doc].filter(Boolean).join(" · "))}</div>${ehInv(p) ? (() => { const T = paraApresentar(p); return T.length ? `<div style="font-size:11.5px;margin-top:2px;color:var(--glow)">▸ ${T.length} target(s) para apresentar: ${esc(T.slice(0, 2).map(x => x.t.nome).join(", "))}${T.length > 2 ? ` +${T.length - 2}` : ""}</div>` : `<div class="sub" style="font-size:11.5px;margin:2px 0 0">Nenhum target da base com essa tese ainda</div>`; })() : ""}${(() => { const A = aderentes(p); return A.length ? `<div style="font-size:11.5px;margin-top:2px;color:var(--glow)">◆ ${esc(A.slice(0, 2).map(x => x.inv.nome).join(", "))}${A.length > 2 ? ` +${A.length - 2}` : ""}</div>` : ""; })()}</td>
            <td style="font-size:12px">${esc(p.origem || "")}${p.lista ? `<div class="sub" style="margin:0;font-size:11px">${esc(p.lista)}</div>` : ""}</td>
            <td style="font-size:12px">${p.responsavel ? `${esc(p.responsavel)}<div class="sub" style="margin:0;font-size:11px">${lv ? "<b style='color:var(--warn)'>exclusividade vencida</b>" : `exclusivo até ${ex ? ex.toLocaleDateString("pt-BR") : "—"}`}</div>` : `<span class="sub">livre</span>`}</td>
            <td style="font-size:12px">${u ? `${dt(u.em)} · ${esc(u.canal)}<div class="sub" style="margin:0;font-size:11px">${esc(u.resultado)}${u.por ? " · " + esc(u.por) : ""}</div>` : `<span class="sub">—</span>`}</td>
            <td><span class="pill ${p.status === "realizada" ? "r-baixo" : p.status === "arquivado" ? "r-pend" : p.status === "promovido" ? "r-baixo" : "r-medio"}" style="font-size:10.5px">${ST[p.status] || "Novo"}</span></td>
            <td style="text-align:right">${p.status === "realizada" && ed() ? `<button type="button" class="btn sm primary" data-prpro="${p.id}">Aprovar</button>` : ""}</td></tr>`; }).join("")}</tbody></table></div>${L.length > 300 ? `<p class="sub" style="margin:0">Mostrando 300 de ${L.length}. Use a busca e os filtros.</p>` : ""}` : `<div class="empty">Nenhum prospect${F.q || F.or || F.resp ? " com esses filtros" : ""}. Importe uma lista do Econodata, do Lemitti ou do Ramper, ou inclua um prospect.</div>`}
        <p class="sub" style="margin:0;font-size:12px">Exclusividade de ${R.exclusivDias} dias sem contato: depois disso a empresa fica livre para outra pessoa assumir. Contatos ficam só para uso interno.</p></div>`;
    const q = $("#pr-q", host); q.oninput = () => { F.q = q.value; clearTimeout(S.prT); S.prT = setTimeout(() => { renderView(); const n = $("#pr-q"); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 250); };
    $("#pr-or", host).onchange = e => { F.or = e.target.value; renderView(); }; $("#pr-tp", host).onchange = e => { F.tp = e.target.value; renderView(); }; $("#pr-rs", host).onchange = e => { F.resp = e.target.value; renderView(); }; $("#pr-iv", host).onchange = e => { F.inv = e.target.value; renderView(); };
    const pi = $("#pr-inv", host); if (pi) pi.onclick = () => paraInvestidor(F.inv);
    $("#pr-eu", host).onchange = e => { S.prosEu = e.target.value; try{ localStorage.setItem("kt-pros-eu", S.prosEu); }catch(x){} };
    $$("[data-prst]", host).forEach(b => b.onclick = () => { F.st = b.dataset.prst; renderView(); });
    $$("[data-pr]", host).forEach(r => r.onclick = () => ficha(S.prospects.find(p => p.id === r.dataset.pr)));
    $$("[data-prpro]", host).forEach(b => b.onclick = ev => { ev.stopPropagation(); promover(S.prospects.find(p => p.id === b.dataset.prpro)); });
    const nv = $("#pr-novo", host); if (nv) nv.onclick = () => novo(); const im = $("#pr-imp", host); if (im) im.onclick = () => importar();
    $("#pr-eq", host).onclick = equipeRegras; $("#pr-mem", host).onclick = membros;
    const pp = $("#pr-pp", host); if (pp) pp.onchange = () => { S.prosPainel = pp.value; renderView(); };
  };
  try{ S.prosEu = localStorage.getItem("kt-pros-eu") || ""; }catch(e){}

  /* ---------------- ficha do prospect ---------------- */
  function ficha(p){
    if (!p) return; const u = ultimo(p), ex = exclusivoAte(p), lv = livre(p), meu = p.responsavel === eu(), {naBase} = duplicado(p);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Prospecção · ${esc(p.origem || "")}${p.lista ? " · " + esc(p.lista) : ""}</div><h2>${esc(p.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px">
        ${naBase && p.status !== "promovido" ? `<div class="banner"><b>Já está na base como ${esc(naBase.nome)}.</b> Não promova de novo: registre a abordagem no dossiê do target.</div>` : ""}
        ${ehInv(p) ? `<div class="banner" style="font-size:13px"><b>Investidor (N1)</b> · ${esc(p.tipoInv || "Investidor estratégico")}: abordagem para apresentar os nossos targets. Na aprovação, entra na Órbita como investidor.</div>` : ""}
        <dl class="kv">${[["CNPJ", p.doc], ["Atividade", [p.cnae, p.segmento].filter(Boolean).join(" · ")], ["Tese (o que compra)", ehInv(p) ? p.tese : ""], ["Grupo / país de origem", p.grupo || (p.pais && p.pais !== "Brasil" ? p.pais : "")], ["Observações", p.obs], ["Local", [p.municipio, p.uf].filter(Boolean).join(" / ")], ["Faturamento", p.fat], ["Site", p.site], ["Situação", ST[p.status] || "Novo"],
          ["Responsável", p.responsavel ? `${p.responsavel} (${PAPEL[papelDe(p.responsavel)] || "—"}) · ${lv ? "exclusividade vencida" : "exclusivo até " + (ex ? ex.toLocaleDateString("pt-BR") : "—")}` : "livre"], ["Desde", dt(p.desde || p.criadoEm)]].filter(x => x[1]).map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
        ${ehInv(p) ? (() => { const T = paraApresentar(p); return T.length ? `<div><b style="font-size:13px">Targets da base para apresentar (${T.length})</b>${T.slice(0, 10).map(x => `<div style="font-size:12.5px">▸ ${esc(x.t.nome)} <span class="sub" style="font-size:11.5px">· ${esc(x.m)}</span></div>`).join("")}</div>` : `<div class="sub" style="margin:0;font-size:12.5px">Nenhum target da base aderente à tese deste investidor ainda. Ajuste a tese ou prospecte targets para ele.</div>`; })() : ""}
        ${ehInv(p) ? "" : (() => { const A = aderentes(p); return A.length ? `<div><b style="font-size:13px">Investidores da Órbita com essa intenção (${A.length})</b>${A.slice(0, 8).map(x => `<div style="font-size:12.5px">◆ ${esc(x.inv.nome)} <span class="sub" style="font-size:11.5px">· ${esc(x.m)}</span></div>`).join("")}</div>` : `<div class="sub" style="margin:0;font-size:12.5px">Nenhum investidor da Órbita com tese aderente a esta empresa.</div>`; })()}
        ${(p.contatos || []).length ? `<div><b style="font-size:13px">Contatos</b>${p.contatos.slice(0, 8).map(c => `<div style="font-size:13px">${esc([c.nome, c.cargo, c.email, c.cel].filter(Boolean).join(" · "))}</div>`).join("")}</div>` : ""}
        <div><b style="font-size:13px">Histórico de abordagem (${(p.toques || []).length})</b>${(p.toques || []).slice().sort((a, b) => String(b.em).localeCompare(a.em)).map(t => `<div style="font-size:12.5px;border-top:1px solid var(--line);padding:5px 0">${dt(t.em)} · <b>${esc(t.canal)}</b> · ${esc(t.resultado)}${t.reuniaoEm ? ` para ${dt(t.reuniaoEm)}` : ""}${t.possib ? ` · possibilidade ${esc(t.possib.toLowerCase())}` : ""} · ${esc(t.por || "")}${t.nota ? `<div class="sub" style="margin:0">${esc(t.nota)}</div>` : ""}</div>`).join("") || `<p class="sub" style="margin:0">Nenhum toque registrado.</p>`}</div>
        ${ed() && !["promovido", "arquivado"].includes(p.status) ? `<form class="card" id="pt-f" style="display:flex;flex-direction:column;gap:8px;padding:12px"><b style="font-size:13px">Registrar toque</b><div class="form">
          <div class="fld"><label for="pt-c">Canal</label><select id="pt-c">${CANAIS.map(x => `<option>${x}</option>`).join("")}</select></div><div class="fld"><label for="pt-r">Resultado</label><select id="pt-r">${RESULT.map(x => `<option>${x}</option>`).join("")}</select></div>
          <div class="fld"><label for="pt-p">Quem abordou</label><select id="pt-p">${equipe().map(e => `<option ${e.nome === eu() ? "selected" : ""}>${esc(e.nome)}</option>`).join("")}</select></div><div class="fld"><label for="pt-d">Data do contato</label><input id="pt-d" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
          <div class="fld"><label for="pt-pn">Possibilidade de negociação</label><select id="pt-pn"><option value="">—</option>${POSSIB.map(x => `<option>${x}</option>`).join("")}</select></div><div class="fld" id="pt-drw" hidden><label for="pt-dr">Data da reunião</label><input id="pt-dr" type="date"></div>
          <div class="fld full"><label for="pt-n">Anotação</label><input id="pt-n" placeholder="ex.: falou com o sócio, pediu material; retornar em 15 dias"></div></div>
          <p class="err" id="pt-err" hidden></p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button type="submit" class="btn sm primary">Registrar</button></div></form>` : ""}
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">${ed() && !["promovido", "arquivado"].includes(p.status) ? `${!meu && lv ? `<button type="button" class="btn sm" id="pf-ass">Assumir a abordagem</button>` : ""}<button type="button" class="btn sm ghost" id="pf-arq">Arquivar</button>${p.status === "realizada" ? `<button type="button" class="btn sm primary" id="pf-pro">${ehInv(p) ? "Aprovar e enviar à Órbita como investidor" : "Aprovar e enviar ao cadastro M&A"}</button>` : ""}` : ""}${p.status === "arquivado" && ed() ? `<button type="button" class="btn sm" id="pf-rea">Reabrir</button>` : ""}${p.orbitaId && p.status !== "promovido" && supById(p.orbitaId) ? `<button type="button" class="btn sm" id="pf-orb">Ver na Órbita</button>` : ""}${p.status === "promovido" && p.promovido?.supId ? `<button type="button" class="btn sm" id="pf-ver">${ehInv(p) ? "Abrir o investidor" : "Abrir o target"}</button>` : ""}</div></div>`);
    const ptr = $("#pt-r"); if (ptr) ptr.onchange = () => { $("#pt-drw").hidden = ptr.value !== "Reunião marcada"; };
    const f = $("#pt-f"); if (f) f.onsubmit = async e => { e.preventDefault(); const por = $("#pt-p").value, err = t => { $("#pt-err").textContent = t; $("#pt-err").hidden = false; };
      if (p.responsavel && p.responsavel !== por && !livre(p)) return err(`${p.responsavel} tem a exclusividade até ${exclusivoAte(p).toLocaleDateString("pt-BR")}. Combine com o responsável ou aguarde a liberação.`);
      const r = $("#pt-r").value, t = {em:new Date($("#pt-d").value + "T12:00:00").toISOString(), canal:$("#pt-c").value, resultado:r, por, papel:papelDe(por), nota:$("#pt-n").value.trim(), possib:$("#pt-pn").value};
      if (r === "Reunião marcada"){ if (!$("#pt-dr").value) return err("Informe a data da reunião."); t.reuniaoEm = new Date($("#pt-dr").value + "T12:00:00").toISOString(); }
      const status = QUENTE.includes(r) ? "realizada" : r === "Reunião marcada" ? "marcada" : r === "Sem interesse" ? "arquivado" : (p.status === "realizada" || p.status === "marcada") ? p.status : "abordagem";
      await atualizar(p, {toques:[...(p.toques || []), t], status, ...(QUENTE.includes(r) ? {temperatura:"Quente"} : r === "Reunião marcada" && p.temperatura !== "Quente" ? {temperatura:"Morno"} : {}), ...(!p.responsavel || livre(p) ? {responsavel:por, desde:t.em} : {}), ...(status === "arquivado" ? {arquivado:{em:nowISO(), motivo:"Sem interesse"}} : {})});
      let orb = null; if (r === "Reunião marcada" && !ehInv(p)) orb = await naOrbita(p.id, t);
      if (QUENTE.includes(r) && p.orbitaId && supById(p.orbitaId)) await save(Store.update("suppliers", p.orbitaId, {mapa:{temperatura:"Quente"}}));
      if (orb){ close(); toast(`Reunião agendada para ${dt(t.reuniaoEm)}: ${p.nome} entrou na Órbita de M&A${orb.invs?.length ? `, ligada a ${orb.invs.length} investidor(es)` : ""}`); renderAll(); return; }
      close(); toast(status === "realizada" ? (ehInv(p) ? "Investidor quente: aguardando a aprovação do consultor de M&A" : "Lead quente: aguardando a aprovação do consultor de M&A") : "Toque registrado"); renderView(); };
    const as = $("#pf-ass"); if (as) as.onclick = () => atualizar(p, {responsavel:eu(), desde:nowISO()}).then(() => { close(); toast("Abordagem assumida"); renderView(); });
    const aq = $("#pf-arq"); if (aq) aq.onclick = () => { const m = prompt("Motivo do arquivamento:", "Sem retorno"); if (m == null) return; (p.orbitaId && supById(p.orbitaId)?.prospeccao?.preCadastro ? save(Store.update("suppliers", p.orbitaId, {etapa:"descartada", mapa:{temperatura:"Declinado"}})) : Promise.resolve()).then(() => atualizar(p, {status:"arquivado", arquivado:{em:nowISO(), motivo:m, por:eu()}})).then(() => { close(); toast("Prospect arquivado"); renderView(); }); };
    const re = $("#pf-rea"); if (re) re.onclick = () => atualizar(p, {status:(p.toques || []).length ? "abordagem" : "novo"}).then(() => { close(); renderView(); });
    const pr = $("#pf-pro"); if (pr) pr.onclick = () => { close(); promover(p); };
    const vo = $("#pf-orb"); if (vo) vo.onclick = () => { close(); openSupplier(p.orbitaId, "ma"); };
    const vr = $("#pf-ver"); if (vr) vr.onclick = () => { close(); openSupplier(p.promovido.supId, "ma"); };
  }

  /* ---------------- promover a target ---------------- */
  function promover(p){
    if (!p) return; const {naBase} = duplicado(p), reun = (p.toques || []).filter(t => QUENTE.includes(t.resultado)).pop();
    if (naBase){ toast(`Já está na base como ${naBase.nome}.`); return; }
    if (!["socio", "mna"].includes(papelDe(eu()))){ toast(`A aprovação é do consultor de M&A ou de um sócio. Em "Sou", escolha quem está aprovando (hoje: ${eu() || "ninguém"}).`); return; }
    const parts = [...new Set((p.toques || []).map(t => t.por).filter(Boolean))];
    if (ehInv(p)) return promoverInv(p, reun, parts);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Aprovação do consultor de M&A · ${esc(eu())}</div><h2>Aprovar ${esc(p.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="pp-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="banner" style="font-size:13px">${esc(reun?.resultado || "Reunião realizada")} em <b>${reun ? dt(reun.em) : "—"}</b> por <b>${esc(reun?.por || "—")}</b>. Ao aprovar, a empresa vai sozinha para o cadastro M&A (Base inicial, Órbita e cadastro inicial), com a origem e o histórico da prospecção.</div>
        <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px"><input type="checkbox" id="pp-ok"> Aprovo: há possibilidade real de negócio (venda da empresa, mandato ou proposta de serviços).</label>
        <div class="form"><div class="fld"><label for="pp-t">Temperatura</label><select id="pp-t"><option>Quente</option><option>Morno</option></select></div>
          <div class="fld full"><label>Quem participou diretamente da abordagem (para o mérito do mandato)</label><div style="display:flex;flex-direction:column;gap:4px">${equipe().map(e => `<label class="pr-chk"><input type="checkbox" data-pp="${esc(e.nome)}" ${parts.includes(e.nome) ? "checked" : ""}> ${esc(e.nome)} <span class="sub" style="font-size:11.5px">· ${PAPEL[e.papel] || ""}${e.papel === "sdr" ? " (não entra no mérito do mandato)" : ""}</span></label>`).join("")}</div></div></div>
        <p class="err" id="pp-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Aprovar e enviar ao cadastro M&A</button></div></form>`);
    $("#pp-f").onsubmit = async e => { e.preventDefault(); if (!$("#pp-ok").checked){ $("#pp-err").textContent = "Marque a aprovação para enviar ao cadastro M&A."; $("#pp-err").hidden = false; return; }
      const pre = p.orbitaId && supById(p.orbitaId), sel = $$("[data-pp]").filter(x => x.checked).map(x => x.dataset.pp), id = pre ? pre.id : novoId("t"), agora = nowISO();
      const o = {nivel:"N3", nome:p.nome, doc:p.doc || "", uf:p.uf || "", municipio:p.municipio || "", pais:"Brasil", tipo:"Target vendedor", etapa:"reuniao", origem:p.origem || "Prospecção", criadoEm:agora, parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{},
        mapa:{temperatura:$("#pp-t").value, fat:p.fat || "", segmentoTxt:p.segmento || p.cnae || "", site:p.site || "", contato:p.contatos?.[0] ? [p.contatos[0].nome, p.contatos[0].cargo, p.contatos[0].email].filter(Boolean).join(" · ") : "", telefone:(p.contatos || []).find(c => c.cel)?.cel || "", aba:"Prospecção"},
        prospeccao:{id:p.id, origem:p.origem, lista:p.lista || "", responsavel:p.responsavel || "", toques:(p.toques || []).length, reuniao:reun?.em || "", sdr:[...new Set((p.toques || []).filter(t => papelDe(t.por) === "sdr").map(t => t.por))], promovidoEm:agora, por:eu(), aprovadoPor:eu(), interesse:p.interesse || ""},
        merito:{mandato:{participantes:sel.filter(n => regras().elegiveis.includes(papelDe(n)))}}};
      if (window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(o); o.lat = lat; o.lng = lng; }
      const obj = pre ? {...pre, ...o, id:undefined, criadoEm:pre.criadoEm, investidores:pre.investidores || [], prospeccao:{...(pre.prospeccao || {}), ...o.prospeccao, preCadastro:false}} : o; delete obj.id;
      await save(Store.set("suppliers", id, obj)); await atualizar(p, {status:"promovido", promovido:{em:agora, por:eu(), supId:id}});
      close(); toast(`${p.nome} aprovado: já está na Base inicial e na Órbita`); renderAll(); if (window.KT_PROJ?.novoProjeto) setTimeout(() => KT_PROJ.novoProjeto(id), 300); };
  }

  function promoverInv(p, reun, parts){
    const T = paraApresentar(p);
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Aprovação do consultor de M&A · ${esc(eu())}</div><h2>Aprovar o investidor ${esc(p.nome)}</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="pp-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="banner" style="font-size:13px">${esc(reun?.resultado || "Reunião realizada")} em <b>${reun ? dt(reun.em) : "—"}</b> por <b>${esc(reun?.por || "—")}</b>. Ao aprovar, o investidor entra na Órbita (N1) com a tese de compra, ligado aos targets aderentes, e a originação do investidor fica registrada para o mérito.</div>
        <label style="display:flex;gap:8px;align-items:flex-start;font-size:13px"><input type="checkbox" id="pp-ok"> Aprovo: o investidor quer conhecer targets (interesse real em aquisições).</label>
        <div class="form"><div class="fld"><label for="pp-ti">Tipo de investidor</label><select id="pp-ti">${TIPOS_INV.map(x => `<option ${x === (p.tipoInv || "Investidor estratégico") ? "selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="fld"><label for="pp-t">Temperatura</label><select id="pp-t"><option>Quente</option><option>Morno</option></select></div>
          <div class="fld full"><label for="pp-te">Tese (o que compra)</label><input id="pp-te" value="${esc(p.tese || p.segmento || "")}"></div>
          <div class="fld full"><label>Targets aderentes que serão ligados (${T.length})</label><div style="display:flex;flex-direction:column;gap:4px">${T.length ? T.slice(0, 30).map(x => `<label class="pr-chk"><input type="checkbox" data-ppt="${x.t.id}" checked> ${esc(x.t.nome)} <span class="sub" style="font-size:11.5px">· ${esc(x.m)}</span></label>`).join("") : `<span class="sub" style="font-size:12.5px">Nenhum target aderente na base ainda.</span>`}</div></div>
          <div class="fld full"><label>Quem participou diretamente da originação do investidor (mérito de ${fmt(regras().investidor, 0)}%)</label><div style="display:flex;flex-direction:column;gap:4px">${equipe().map(e => `<label class="pr-chk"><input type="checkbox" data-pp="${esc(e.nome)}" ${parts.includes(e.nome) ? "checked" : ""}> ${esc(e.nome)} <span class="sub" style="font-size:11.5px">· ${PAPEL[e.papel] || ""}${e.papel === "sdr" ? " (não entra no mérito do investidor)" : ""}</span></label>`).join("")}</div></div></div>
        <p class="err" id="pp-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Aprovar e enviar à Órbita</button></div></form>`);
    $("#pp-f").onsubmit = async e => { e.preventDefault(); if (!$("#pp-ok").checked){ $("#pp-err").textContent = "Marque a aprovação para enviar à Órbita."; $("#pp-err").hidden = false; return; }
      const sel = $$("[data-pp]").filter(x => x.checked).map(x => x.dataset.pp), alvos = $$("[data-ppt]").filter(x => x.checked).map(x => x.dataset.ppt), id = novoId("i"), agora = nowISO(), tese = $("#pp-te").value.trim();
      const o = {nivel:"N1", nome:p.nome, doc:p.doc || "", uf:p.uf || "", municipio:p.municipio || "", pais:p.pais || "Brasil", tipo:$("#pp-ti").value, segmento:p.segmento || "", origem:p.origem || "Prospecção", criadoEm:agora, parentId:"", answers:{}, docs:{}, invest:{},
        tese:{texto:tese, atividades:tese, cnaes:p.cnaesTese || "", segmentos:p.segmentos || []}, grupo:p.grupo || "",
        mapa:{temperatura:$("#pp-t").value, fat:p.fat || "", segmentoTxt:p.segmento || "", site:p.site || "", contato:p.contatos?.[0] ? [p.contatos[0].nome, p.contatos[0].cargo, p.contatos[0].email].filter(Boolean).join(" · ") : "", telefone:(p.contatos || []).find(c => c.cel)?.cel || "", aba:"Prospecção de investidores", obs:p.obs || ""},
        prospeccao:{id:p.id, origem:p.origem, lista:p.lista || "", responsavel:p.responsavel || "", toques:(p.toques || []).length, reuniao:reun?.em || "", promovidoEm:agora, por:eu(), aprovadoPor:eu(), tipo:"investidor"},
        merito:{originacao:{participantes:sel.filter(n => regras().elegiveis.includes(papelDe(n))), em:agora}}};
      if (window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(o); o.lat = lat; o.lng = lng; }
      await save(Store.set("suppliers", id, o));
      for (const tid of alvos){ const t = supById(tid); if (t && !(t.investidores || []).includes(id)) await save(Store.update("suppliers", tid, {investidores:[...(t.investidores || []), id]})); }
      await atualizar(p, {status:"promovido", promovido:{em:agora, por:eu(), supId:id}});
      close(); toast(`${p.nome} aprovado: investidor na Órbita${alvos.length ? `, ligado a ${alvos.length} target(s)` : ""}`); renderAll(); };
  }

  /* ---------------- novo prospect e importação de listas ---------------- */
  function novo(){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Prospecção</div><h2>Cadastro de prospecção</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="pn-f" novalidate><div class="form"><div class="fld full"><label for="pn-a">Tipo de prospecção</label><select id="pn-a"><option value="target">Target · empresa vendedora (N3)</option><option value="investidor">Investidor · comprador estratégico ou financeiro (N1)</option></select></div>
        <div class="fld" data-pninv hidden><label for="pn-ti">Tipo de investidor</label><select id="pn-ti">${TIPOS_INV.map(x => `<option>${x}</option>`).join("")}</select></div><div class="fld full" data-pninv hidden><label for="pn-te">Tese (o que compra)</label><input id="pn-te" placeholder="ex.: farmacêuticas, genéricos, OTC, dermocosméticos, distribuição de medicamentos"></div>${[["pn-n", "Empresa"], ["pn-d", "CNPJ"], ["pn-s", "Atividade ou segmento"], ["pn-m", "Cidade"], ["pn-u", "UF"], ["pn-fat", "Faturamento"], ["pn-ct", "Contato (nome · cargo · e-mail)"], ["pn-cel", "Telefone"]].map(([id, l]) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}"></div>`).join("")}
        <div class="fld"><label for="pn-i">Interesse</label><select id="pn-i">${["Venda da empresa (mandato)", "Serviços (due diligence, auditoria, valuation)", "Captação ou investidor", "Comprar empresas (investidor N1)", "A identificar"].map(o => `<option>${o}</option>`).join("")}</select></div>
        <div class="fld"><label for="pn-t">Temperatura</label><select id="pn-t">${["Frio", "Morno", "Quente"].map(o => `<option>${o}</option>`).join("")}</select></div>
        <div class="fld"><label for="pn-o">Origem</label><select id="pn-o">${ORIGENS.map(o => `<option>${o}</option>`).join("")}</select></div><div class="fld"><label for="pn-r">Responsável</label><select id="pn-r">${equipe().map(e => `<option ${e.nome === eu() ? "selected" : ""}>${esc(e.nome)}</option>`).join("")}</select></div>
        <div class="fld full"><label for="pn-ob">Observações</label><input id="pn-ob" placeholder="ex.: indicado pelo contador; sócio pensa em vender em 2027"></div></div>
      <p class="err" id="pn-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Cadastrar</button></div></form>`);
    $("#pn-a").onchange = () => { const inv = $("#pn-a").value === "investidor"; $$("[data-pninv]").forEach(x => x.hidden = !inv); if (inv) $("#pn-i").value = "Comprar empresas (investidor N1)"; };
    $("#pn-f").onsubmit = async e => { e.preventDefault(); const v = id => $("#" + id).value.trim(), d = dig(v("pn-d")), o = {nome:v("pn-n"), doc:d.length === 14 ? fmtCnpj(d) : ""};
      const inv = v("pn-a") === "investidor"; Object.assign(o, inv ? {alvo:"investidor", tipoInv:v("pn-ti"), tese:v("pn-te")} : {alvo:"target"});
      const err = t => { $("#pn-err").textContent = t; $("#pn-err").hidden = false; }; if (!o.nome) return err("Informe a empresa.");
      const {naBase, naPros} = duplicado(o); if (naBase) return err(`Já está no cadastro M&A como ${naBase.nome}.`); if (naPros) return err(`Já está na prospecção${naPros.responsavel ? ` com ${naPros.responsavel}` : ""}.`);
      const [cn, cc, ce] = v("pn-ct").split("·").map(x => x.trim());
      await salvar(novoId("p"), {...o, segmento:v("pn-s"), municipio:v("pn-m"), uf:v("pn-u").toUpperCase().slice(0, 2), fat:v("pn-fat"), contatos:cn || v("pn-cel") ? [{nome:cn || "", cargo:cc || "", email:ce || "", cel:v("pn-cel")}] : [], interesse:v("pn-i"), temperatura:v("pn-t"), obs:v("pn-ob"), origem:v("pn-o"), responsavel:v("pn-r"), desde:nowISO(), status:"novo", toques:[], criadoEm:nowISO()});
      close(); toast("Prospecção cadastrada"); renderView(); };
  }
  /* cadastro de membros: time de M&A, sócios, novos negócios e SDR */
  function membros(){
    const E = equipe(), adm = ed();
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Kinsey BR · M&A</div><h2>Equipe M&A e SDR</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px"><p class="sub" style="margin:0">Membros que abordam leads, conduzem mandatos e participam do mérito. O papel define as regras: sócios, time de M&A e novos negócios entram no mérito de mandato e investidor; o SDR entra só nos serviços separados.</p>
        <div class="tbl"><table><thead><tr><th>Nome</th><th>Cargo</th><th>Papel</th><th></th></tr></thead><tbody>${E.map((e, i) => `<tr><td><b>${esc(e.nome)}</b>${e.email ? `<div class="sub" style="margin:0;font-size:11px">${esc(e.email)}</div>` : ""}</td><td style="font-size:12.5px">${esc(e.cargo || "")}</td><td style="font-size:12.5px">${PAPEL[e.papel] || ""}</td><td style="text-align:right">${adm ? `<button type="button" class="btn sm ghost" data-mbr="${i}">Remover</button>` : ""}</td></tr>`).join("")}</tbody></table></div>
        ${adm ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm primary" data-mbn="mna">+ Membro do time de M&A</button><button type="button" class="btn sm" data-mbn="socio">+ Sócio</button><button type="button" class="btn sm" data-mbn="novos">+ Novos negócios</button><button type="button" class="btn sm" data-mbn="sdr">+ SDR</button></div>
        <form id="mb-f" class="card" style="display:none;flex-direction:column;gap:8px;padding:12px" novalidate><b style="font-size:13px" id="mb-tt">Novo membro</b><div class="form"><div class="fld"><label for="mb-n">Nome</label><input id="mb-n"></div><div class="fld"><label for="mb-c">Cargo</label><input id="mb-c"></div>
          <div class="fld"><label for="mb-p">Papel</label><select id="mb-p">${Object.entries(PAPEL).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select></div><div class="fld"><label for="mb-e">E-mail corporativo</label><input id="mb-e" type="email"></div></div>
          <p class="err" id="mb-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="submit" class="btn sm primary">Cadastrar membro</button></div></form>` : ""}</div>`);
    const grava = L => save(Store.set("config", "merito", {...(S.config.merito || {}), equipe:L, em:nowISO()}));
    const CARGO = {mna:"Consultor de M&A", socio:"Sócio de M&A", novos:"Novos negócios", sdr:"SDR"};
    $$("[data-mbn]").forEach(b => b.onclick = () => { const f = $("#mb-f"); f.style.display = "flex"; $("#mb-p").value = b.dataset.mbn; $("#mb-c").value = CARGO[b.dataset.mbn]; $("#mb-tt").textContent = b.textContent.replace("+ ", "Novo: "); $("#mb-n").focus(); });
    const f = $("#mb-f"); if (f) f.onsubmit = async e => { e.preventDefault(); const nome = $("#mb-n").value.trim(); if (!nome){ $("#mb-err").textContent = "Informe o nome."; $("#mb-err").hidden = false; return; }
      if (E.some(x => x.nome.toLowerCase() === nome.toLowerCase())){ $("#mb-err").textContent = "Já está na equipe."; $("#mb-err").hidden = false; return; }
      await grava([...E, {nome, cargo:$("#mb-c").value.trim(), papel:$("#mb-p").value, email:$("#mb-e").value.trim(), desde:nowISO()}]); close(); toast(`${nome} cadastrado na equipe`); renderAll(); };
    $$("[data-mbr]").forEach(b => b.onclick = async () => { const x = E[+b.dataset.mbr]; if (!confirm(`Remover ${x.nome} da equipe? O histórico de abordagens e de mérito é mantido.`)) return;
      await grava(E.map((y, i) => i === +b.dataset.mbr ? {...y, inativo:true} : y)); close(); toast(`${x.nome} removido da equipe`); renderAll(); });
  }
  function lerLinhas(rows){
    const hi = rows.findIndex(r => r.some(c => /cnpj/i.test(c)) || r.some(c => /raz[aã]o|empresa|nome fantasia/i.test(c))); if (hi < 0) return null;
    const H = rows[hi].map(c => nrm(c)), ix = re => H.findIndex(h => re.test(h));
    const cN = ix(/raz|empresa|fantasia|^nome$/), cD = ix(/cnpj/), cC = ix(/cnae|atividade|segmento|setor/), cF = ix(/fatur|receita/), cU = ix(/^uf$|estado/), cM = ix(/cidade|municip/), cE = ix(/e ?mail/), cT = ix(/telefone|celular|fone|whats/), cS = ix(/site|dominio|url/), cCt = ix(/contato|decisor|responsavel|^nome do/), cCg = ix(/cargo/), cTp = ix(/^tipo$|^nivel$|^tipo de prosp/), cTi = ix(/tipo de investidor/), cTe = ix(/^tese|o que compra/), cG = ix(/^grupo|controlador/), cP = ix(/^pais$/), cO = ix(/observ|^obs$|ranking/);
    return rows.slice(hi + 1).filter(r => r[cN] || r[cD]).map(r => { const d = dig(r[cD]); return {nome:String(r[cN] ?? "").trim() || fmtCnpj(d), doc:d.length === 14 ? fmtCnpj(d) : "", cnae:String(r[cC] ?? "").trim(), fat:String(r[cF] ?? "").trim(), uf:String(r[cU] ?? "").toUpperCase().slice(0, 2), municipio:String(r[cM] ?? "").trim(), site:String(r[cS] ?? "").trim(), ...(cTp >= 0 && /invest|n1|compr/i.test(r[cTp] || "") ? {alvo:"investidor"} : {}), ...(cTi >= 0 && r[cTi] ? {tipoInv:String(r[cTi]).trim()} : {}), ...(cTe >= 0 && r[cTe] ? {tese:String(r[cTe]).trim()} : {}), ...(cG >= 0 && r[cG] ? {grupo:String(r[cG]).trim()} : {}), ...(cP >= 0 && r[cP] ? {pais:String(r[cP]).trim()} : {}), ...(cO >= 0 && r[cO] ? {obs:String(r[cO]).trim()} : {}),
      contatos:(r[cCt] || r[cE] || r[cT]) ? [{nome:String(r[cCt] ?? "").trim(), cargo:String(r[cCg] ?? "").trim(), email:String(r[cE] ?? "").trim(), cel:String(r[cT] ?? "").trim()}] : []}; });
  }
  function importar(origem, invId){
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Prospecção</div><h2>Importar lista</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="pi-f" style="display:flex;flex-direction:column;gap:10px" novalidate><p class="sub" style="margin:0">Arquivo exportado do Econodata, do Lemitti ou do Ramper (CSV ou Excel) com as colunas CNPJ e Empresa (ou Razão social). Empresas que já estão na base ou na prospecção não entram de novo.</p>
        <div class="form"><div class="fld"><label for="pi-o">Origem</label><select id="pi-o">${["Econodata", "Lemitti", "Ramper", "SDR", "Novos negócios"].map(o => `<option ${o === origem ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <div class="fld"><label for="pi-tp">A lista é de</label><select id="pi-tp"><option value="">Detectar pela coluna "Tipo"</option><option value="target">Targets · empresas vendedoras (N3)</option><option value="investidor">Investidores · compradores (N1)</option></select></div>
          <div class="fld"><label for="pi-iv">Prospectado para o investidor</label><select id="pi-iv"><option value="">—</option>${N1s().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt")).map(i => `<option value="${i.id}" ${i.id === invId ? "selected" : ""}>${esc(i.nome)}</option>`).join("")}</select></div>
          <div class="fld"><label for="pi-r">Responsável pela abordagem</label><select id="pi-r"><option value="">Sem responsável (livres)</option>${equipe().map(e => `<option>${esc(e.nome)}</option>`).join("")}</select></div>
          <div class="fld full"><label for="pi-a">Arquivo</label><input id="pi-a" type="file" accept=".csv,.xlsx,.txt"></div></div>
        <p class="err" id="pi-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Importar</button></div></form>`);
    $("#pi-f").onsubmit = async e => { e.preventDefault(); const f = $("#pi-a").files[0], err = t => { $("#pi-err").textContent = t; $("#pi-err").hidden = false; }; if (!f) return err("Escolha o arquivo.");
      let rows; try{ const buf = await f.arrayBuffer(); rows = /\.xlsx$/i.test(f.name) ? await IMP.lerXLSX(buf) : D.csv((() => { let x = new TextDecoder("utf-8").decode(buf); if (x.includes("\uFFFD")) x = new TextDecoder("latin1").decode(buf); return x; })()); }catch(x){ return err("Não consegui ler o arquivo."); }
      const L = lerLinhas(rows); if (!L) return err("O arquivo precisa ter as colunas CNPJ e Empresa (ou Razão social).");
      const tp = $("#pi-tp").value; if (tp) L.forEach(o => { o.alvo = tp; });
      const r = await incluir(L, $("#pi-o").value, f.name, $("#pi-r").value, $("#pi-iv").value); close(); toast(`${r.novos} prospect(s) incluído(s) · ${r.base} já na base · ${r.pros} já na prospecção`); renderView(); };
  }
  async function incluir(L, origem, lista, resp, invId){
    let novos = 0, base = 0, pros = 0; const vistos = new Set();
    for (const o of L){ const k = dig(o.doc) || nrm(o.nome); if (vistos.has(k)) continue; vistos.add(k); const {naBase, naPros} = duplicado(o); if (naBase){ base++; continue; } if (naPros){ pros++; continue; }
      const iv = invId || o.invId || ""; delete o.invId; await salvar(novoId("p"), {alvo:"target", ...o, ...(iv && o.alvo !== "investidor" ? {investidores:[iv]} : {}), ...(o.alvo === "investidor" ? {interesse:"Comprar empresas (investidor N1)", tipoInv:o.tipoInv || "Investidor estratégico"} : {}), segmento:o.segmento || o.cnae || "", origem, lista:lista || "", responsavel:resp || "", desde:resp ? nowISO() : "", status:"novo", toques:[], criadoEm:nowISO()}); novos++; }
    return {novos, base, pros}; }
  /* empresas novas vindas das integrações (Econodata, Lemitti, Ramper) entram aqui, não na base */
  async function deBase(o, origem){ const r = await incluir([{nome:o.nome, doc:o.doc, cnae:o.mapa?.segmentoTxt || "", fat:o.mapa?.fat || "", uf:o.uf, municipio:o.municipio, site:o.mapa?.site || "", contatos:o.enriq?.fontes ? Object.values(o.enriq.fontes).flatMap(f => f.pessoas || []).slice(0, 5) : (o.mapa?.contato ? [{nome:o.mapa.contato, cel:o.mapa.telefone || ""}] : []), invId:(o.investidores || [])[0] || ""}], origem, o.mapa?.aba || "", "", (o.investidores || [])[0] || ""); return r; }


  /* ---------------- prospectar para um investidor da Órbita ----------------
     Os critérios vêm da tese do investidor (atividades, CNAEs, regiões e faixa de faturamento, dentro da política
     Kinsey). Na versão publicada a busca vai direto às APIs oficiais (função "prospeccao", token guardado como segredo);
     sem token ou na versão local, o sistema mostra os critérios para filtrar na plataforma e importar o arquivo. */
  function paraInvestidor(invId){
    const L = N1s().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt"));
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Prospecção pelas intenções dos investidores</div><h2>Prospectar para investidor</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <div class="sheet-b" style="display:flex;flex-direction:column;gap:12px"><div class="fld"><label for="pv-i">Investidor da Órbita</label><select id="pv-i"><option value="">Escolha…</option>${L.map(i => `<option value="${i.id}" ${i.id === invId ? "selected" : ""}>${esc(i.nome)}</option>`).join("")}</select></div><div id="pv-b"></div></div>`);
    const pinta = () => { const inv = supById($("#pv-i").value), b = $("#pv-b"); if (!inv){ b.innerHTML = `<p class="sub" style="margin:0">Escolha o investidor: os critérios da tese dele viram os filtros da busca.</p>`; return; }
      const F = window.KT_IND?.filtrosDe ? KT_IND.filtrosDe(inv) : {cnaes:[], atividades:[], segmentos:[], ufs:[], regioes:[], fatMin:15, fatMax:10000};
      const ja = S.prospects.filter(p => !["promovido", "arquivado"].includes(p.status) && aderentes(p).some(x => x.inv.id === inv.id)).length, sem = !F.cnaes.length && !F.atividades.length && !F.segmentos.length;
      b.innerHTML = `${sem ? `<div class="banner" style="font-size:13px"><b>Tese sem atividades, CNAEs ou segmentos.</b> Complete a tese de ${esc(inv.nome)} no dossiê para a busca ficar precisa.</div>` : ""}
        <div class="tbl"><table><tbody>${[["Atividades", F.atividades.join(" · ") || "—"], ["CNAEs", F.cnaes.join(", ") || "—"], ["Segmentos", F.segmentos.join(", ") || "—"], ["UFs e regiões", [...F.ufs, ...F.regioes].join(", ") || "Brasil"], ["Faturamento", `R$ ${fmt(F.fatMin, 0)} mi a R$ ${fmt(F.fatMax, 0)} mi (política Kinsey)`]].map(([k, v]) => `<tr><td style="width:34%"><b>${k}</b></td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>
        <p class="sub" style="margin:0;font-size:12.5px">${ja} prospect(s) ativo(s) já aderentes a ${esc(inv.nome)}.</p>
        <div style="display:flex;flex-direction:column;gap:8px">${Object.keys(FONTES).map(f => `<div class="card" style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 12px"><div><b>${f}</b><div class="sub" style="margin:0;font-size:12px">${publicado() ? "busca pela API oficial (token cadastrado como segredo)" : "versão local: filtre na plataforma com os critérios acima e importe o arquivo"}</div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${publicado() ? `<button type="button" class="btn sm primary" data-pvb="${f}">Buscar no ${f}</button>` : ""}<button type="button" class="btn sm" data-pvi="${f}">Importar arquivo</button></div></div>`).join("")}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="pv-cad">Exportar cadência para o Ramper (${ja})</button><button type="button" class="btn sm ghost" id="pv-crit">Copiar critérios</button></div>`;
      $$("[data-pvi]", b).forEach(x => x.onclick = () => { close(); importar(x.dataset.pvi, inv.id); });
      $$("[data-pvb]", b).forEach(x => x.onclick = () => buscar(x.dataset.pvb, inv, F, close));
      $("#pv-cad", b).onclick = () => cadencia(inv);
      $("#pv-crit", b).onclick = () => { const t = `Investidor: ${inv.nome}\nAtividades: ${F.atividades.join("; ")}\nCNAEs: ${F.cnaes.join(", ")}\nSegmentos: ${F.segmentos.join(", ")}\nUFs/regiões: ${[...F.ufs, ...F.regioes].join(", ") || "Brasil"}\nFaturamento: R$ ${F.fatMin} mi a R$ ${F.fatMax} mi`; try{ navigator.clipboard.writeText(t); toast("Critérios copiados"); }catch(e){ toast("Não foi possível copiar"); } }; };
    $("#pv-i").onchange = pinta; pinta();
  }
  async function buscar(fonte, inv, F, close){
    toast(`Buscando no ${fonte}…`);
    try{ const fn = firebase.app().functions("southamerica-east1").httpsCallable("prospeccao", {timeout:300000}), r = (await fn({fonte:FONTES[fonte], modo:"buscar", filtros:F})).data;
      if (!r?.lista?.length){ toast(`${fonte}: nenhuma empresa nova com esses critérios.`); return; }
      const L = r.lista.map(o => ({nome:o.nome || fmtCnpj(o.d || ""), doc:fmtCnpj(dig(o.d || o.cnpj || "")), cnae:o.cnae || "", fat:o.fat || "", uf:(o.uf || "").toUpperCase().slice(0, 2), municipio:o.cid || o.municipio || "", site:o.site || "", contatos:(o.pessoas || []).slice(0, 5)}));
      const x = await incluir(L, fonte, `API ${fonte} · ${inv.nome} · ${new Date().toLocaleDateString("pt-BR")}`, "", inv.id); close(); toast(`${fonte}: ${x.novos} novo(s) · ${x.base} já no cadastro M&A · ${x.pros} já na prospecção`); renderView(); }
    catch(e){ const nc = /configurad|precondition/i.test(e.message || ""); toast(nc ? `API do ${fonte} ainda não configurada: use o arquivo exportado.` : `Busca indisponível: ${e.message || "erro"}`); if (nc){ close(); importar(fonte, inv.id); } }
  }
  /* lista para cadência no Ramper: prospects aderentes ao investidor, com contatos */
  function cadencia(inv){
    const L = S.prospects.filter(p => !["promovido", "arquivado"].includes(p.status) && aderentes(p).some(x => x.inv.id === inv.id)), q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    if (!L.length){ toast("Nenhum prospect aderente a este investidor ainda."); return; }
    const linhas = [["CNPJ", "Empresa", "Atividade", "Cidade", "UF", "Contato", "Cargo", "E-mail", "Telefone", "Responsável", "Investidor"].join(";"), ...L.map(p => { const c = (p.contatos || [])[0] || {}; return [p.doc, p.nome, p.segmento || p.cnae, p.municipio, p.uf, c.nome, c.cargo, c.email, c.cel, p.responsavel, inv.nome].map(q).join(";"); })];
    rptSave(new TextEncoder().encode("﻿" + linhas.join("\n")), `Ramper_cadencia_${(inv.nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w]+/g, "_").slice(0, 30)}.csv`, "text/csv"); toast(`${L.length} prospect(s) na lista para o Ramper`);
  }
  /* ---------------- equipe e regras de mérito ---------------- */
  function equipeRegras(){
    const R = regras(), E = equipe(), adm = ed();
    const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Política de M&A · provisória</div><h2>Regras de mérito</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="er-f" style="display:flex;flex-direction:column;gap:12px" novalidate>
        <div class="banner" style="font-size:13px">Regras provisórias até a política de M&A da Kinsey BR. Os percentuais se dividem igualmente entre quem participou diretamente.</div>
        <div class="tbl"><table><thead><tr><th>Mérito</th><th>Quem tem direito</th><th class="dd-num">%</th><th>Base</th></tr></thead><tbody>
          <tr><td>Originação do mandato</td><td>Time de M&A, sócios e novos negócios (não o SDR)</td><td class="dd-num"><input id="er-m" inputmode="decimal" value="${R.mandato}" style="width:60px;text-align:right" ${adm ? "" : "disabled"}></td><td>success fee</td></tr>
          <tr><td>Originação do investidor</td><td>Time de M&A, sócios e novos negócios (não o SDR)</td><td class="dd-num"><input id="er-i" inputmode="decimal" value="${R.investidor}" style="width:60px;text-align:right" ${adm ? "" : "disabled"}></td><td>success fee</td></tr>
          <tr><td>Serviços separados (due diligence, auditoria, valuation, PPA…)</td><td>SDR, quando participa ativamente</td><td class="dd-num"><input id="er-s" inputmode="decimal" value="${R.sdrServicos}" style="width:60px;text-align:right" ${adm ? "" : "disabled"}></td><td>valor do serviço</td></tr>
          <tr><td>Serviços separados e retainers</td><td>Sócios e novos negócios</td><td class="dd-num"><input id="er-p" inputmode="decimal" value="${R.socioServicos}" style="width:60px;text-align:right" ${adm ? "" : "disabled"}></td><td>valor do serviço ou do retainer</td></tr></tbody></table></div>
        <div class="fld" style="max-width:280px"><label for="er-x">Exclusividade sem contato (dias)</label><input id="er-x" inputmode="numeric" value="${R.exclusivDias}" ${adm ? "" : "disabled"}></div>
        <p class="sub" style="margin:0;font-size:12px">Pessoas e papéis em "Equipe M&A e SDR".</p>
        ${adm ? `<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Salvar</button></div>` : ""}</form>`);
    $("#er-f").onsubmit = e => { e.preventDefault(); const nv = id => num($("#" + id).value);
      save(Store.set("config", "merito", {...(S.config.merito || {}), regras:{...R, mandato:nv("er-m") ?? R.mandato, investidor:nv("er-i") ?? R.investidor, sdrServicos:nv("er-s") ?? R.sdrServicos, socioServicos:nv("er-p") ?? R.socioServicos, exclusivDias:nv("er-x") ?? R.exclusivDias}, em:nowISO()})).then(() => { close(); toast("Regras salvas"); renderView(); }); };
  }

  /* ---------------- mérito no dossiê do target ---------------- */
  function feeEstimado(s){
    let ev = null; try{ const R = KT_VAL.resumo(s); if (R.rec) ev = (R.rec[0] + R.rec[1]) / 2; }catch(e){}
    if (ev == null){ try{ const P = KT_VAL.prev(s); if (!P.vazio) ev = P.ev; }catch(e){} }
    if (ev == null || !window.KT_HON) return null; const c = KT_HON.calcula(ev, "venda"); return {ev, success:c.success, ret:c.ret};
  }
  const divide = (pool, L) => L.length ? L.map(n => ({nome:n, papel:papelDe(n), v:pool / L.length, pc:null})) : [];
  function meritoDe(s){
    const R = regras(), M = s.merito || {}, fe = feeEstimado(s), succ = M.successFee ?? fe?.success ?? null;
    const mand = (M.mandato?.participantes || []).filter(n => R.elegiveis.includes(papelDe(n)));
    const ids = [...new Set([...Object.keys(M.investidor || {}), ...(s.investidores || [])])];
    const inv = ids.map(id => { const o = (M.investidor || {})[id], base = o?.participantes ?? supById(id)?.merito?.originacao?.participantes ?? []; return {id, nome:supById(id)?.nome || id, part:base.filter(n => R.elegiveis.includes(papelDe(n))), herdado:!o && base.length > 0}; });
    const serv = Object.entries(M.servicos || {}).filter(([, v]) => v).map(([id, sv]) => { const sdr = (sv.participantes || []).filter(n => papelDe(n) === "sdr"), soc = (sv.participantes || []).filter(n => ["socio", "novos"].includes(papelDe(n)));
      return {id, ...sv, sdr:divide(sv.valor * R.sdrServicos / 100, sdr), soc:divide(sv.valor * R.socioServicos / 100, soc)}; });
    return {R, fe, succ, mand, poolMand:succ != null ? succ * R.mandato / 100 : null, inv, poolInv:succ != null ? succ * R.investidor / 100 : null, serv};
  }
  const _tab = EXT_TABS.ma;
  if (_tab) EXT_TABS.ma = (s, b, r) => { _tab(s, b, r); if (s.nivel !== "N3") return; const X = meritoDe(s), pr = s.prospeccao, E = equipe(), eleg = E.filter(e => X.R.elegiveis.includes(e.papel)), adm = ed(), ap = s.merito?.aprovado;
    const chips = (L, attr, sel) => `<div style="display:flex;gap:6px;flex-wrap:wrap">${L.map(e => `<label style="display:flex;gap:4px;align-items:center;font-size:12.5px;border:1px solid var(--line-2);border-radius:999px;padding:3px 9px"><input type="checkbox" ${attr}="${esc(e.nome)}" ${sel.includes(e.nome) ? "checked" : ""} ${adm ? "" : "disabled"}>${esc(e.nome)}</label>`).join("")}</div>`;
    const quem = (L, pool) => L.length ? L.map(n => `${esc(n)}${pool != null ? ` · ${mi(pool / L.length)}` : ""}`).join(" · ") : `<span class="sub">ninguém marcado</span>`;
    const invs = (s.investidores || []).map(id => supById(id)).filter(Boolean);
    const el = document.createElement("div"); el.className = "card"; el.style.cssText = "display:flex;flex-direction:column;gap:10px";
    el.innerHTML = `<div class="head" style="margin:0"><div><div class="eyebrow">Política de M&A · provisória</div><h3 style="margin:0">Origem e mérito</h3></div>${ap ? `<span class="pill r-baixo" style="font-size:10.5px">aprovado · ${esc(ap.por || "")}</span>` : ""}</div>
      ${pr ? `<div style="font-size:13px">Veio da Prospecção: <b>${esc(pr.origem || "")}</b>${pr.lista ? ` · ${esc(pr.lista)}` : ""} · responsável <b>${esc(pr.responsavel || "—")}</b> · ${pr.toques} toque(s) · reunião em ${dt(pr.reuniao)}${pr.sdr?.length ? ` · SDR: ${esc(pr.sdr.join(", "))}` : ""}</div>` : `<div class="sub" style="margin:0;font-size:12.5px">Cadastrado direto na base (sem passagem pela Prospecção).</div>`}
      <div style="font-size:13px">Success fee ${X.succ != null ? `estimado de <b>${mi(X.succ)}</b>${X.fe ? ` (enterprise value ${mi(X.fe.ev)}, modelo de honorários)` : ""}` : "ainda sem estimativa"}${adm ? ` · <a href="#" id="mr-sf">informar o success fee real</a>` : ""}</div>
      <div><b style="font-size:13px">Originação do mandato · ${fmt(X.R.mandato, 0)}%${X.poolMand != null ? ` (${mi(X.poolMand)})` : ""}</b><div class="sub" style="margin:2px 0 4px;font-size:12px">Quem participou diretamente da conquista do mandato (time de M&A, sócios e novos negócios). O percentual se divide entre os marcados.</div>${chips(eleg, "data-mrm", X.mand)}<div style="font-size:12.5px;margin-top:4px">${quem(X.mand, X.poolMand)}</div></div>
      <div><b style="font-size:13px">Originação do investidor · ${fmt(X.R.investidor, 0)}%${X.poolInv != null ? ` (${mi(X.poolInv)})` : ""}</b><div class="sub" style="margin:2px 0 4px;font-size:12px">Por investidor ligado ao target; vale para o investidor que fechar a operação.</div>
        ${invs.length ? invs.map(iv => { const o = X.inv.find(x => x.id === iv.id); return `<div style="border-top:1px solid var(--line);padding:6px 0"><div style="font-size:12.5px;margin-bottom:4px"><b>${esc(iv.nome)}</b>${s.merito?.investidorFechou === iv.id ? ` <span class="pill r-baixo" style="font-size:10px">fechou</span>` : adm ? ` <a href="#" data-mrf="${iv.id}" style="font-size:12px">marcar como o que fechou</a>` : ""}</div>${chips(eleg, `data-mri="${iv.id}" data-n`, o?.part || [])}</div>`; }).join("") : `<p class="sub" style="margin:0;font-size:12.5px">Nenhum investidor ligado ainda.</p>`}</div>
      <div><b style="font-size:13px">Serviços separados e retainers</b><div class="sub" style="margin:2px 0 4px;font-size:12px">SDR ${fmt(X.R.sdrServicos, 0)}% quando participa ativamente; sócios e novos negócios ${fmt(X.R.socioServicos, 0)}%, divididos entre os participantes.</div>
        ${X.serv.length ? `<div class="tbl"><table><thead><tr><th>Serviço</th><th class="dd-num">Valor</th><th>SDR</th><th>Sócios e novos negócios</th><th></th></tr></thead><tbody>${X.serv.map(v => `<tr><td>${esc(v.tipo)}${v.desc ? `<div class="sub" style="margin:0;font-size:11px">${esc(v.desc)}</div>` : ""}</td><td class="dd-num">${mi(v.valor)}</td><td style="font-size:12px">${v.sdr.map(x => `${esc(x.nome)} ${mi(x.v)}`).join("<br>") || "—"}</td><td style="font-size:12px">${v.soc.map(x => `${esc(x.nome)} ${mi(x.v)}`).join("<br>") || "—"}</td><td>${adm ? `<button type="button" class="btn sm ghost" data-mrx="${v.id}">Remover</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<p class="sub" style="margin:0;font-size:12.5px">Nenhum serviço separado registrado.</p>`}
        ${adm ? `<button type="button" class="btn sm" id="mr-sv" style="margin-top:6px">+ Serviço ou retainer</button>` : ""}</div>
      ${adm ? `<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm ${ap ? "ghost" : "primary"}" id="mr-ap">${ap ? "Reabrir a divisão" : "Aprovar a divisão do mérito"}</button></div>` : ""}`;
    (b.firstElementChild || b).appendChild(el);
    const upd = patch => save(Store.update("suppliers", s.id, {merito:patch}));
    $$("[data-mrm]", el).forEach(x => x.onchange = () => upd({mandato:{participantes:$$("[data-mrm]", el).filter(y => y.checked).map(y => y.dataset.mrm)}}));
    $$("[data-mri]", el).forEach(x => x.onchange = () => { const id = x.dataset.mri; upd({investidor:{[id]:{participantes:$$(`[data-mri="${id}"]`, el).filter(y => y.checked).map(y => y.dataset.n)}}}); });
    $$("[data-mrf]", el).forEach(a => a.onclick = ev => { ev.preventDefault(); upd({investidorFechou:a.dataset.mrf}); });
    $$("[data-mrx]", el).forEach(x => x.onclick = () => upd({servicos:{[x.dataset.mrx]:null}}));
    const sf = $("#mr-sf", el); if (sf) sf.onclick = ev => { ev.preventDefault(); const v = prompt("Success fee real (R$ mil):", X.succ != null ? fmt(X.succ / 1e3, 0) : ""); if (v == null) return; const n = num(v); upd({successFee:n == null ? null : n * 1e3}); };
    const ap2 = $("#mr-ap", el); if (ap2) ap2.onclick = () => upd({aprovado:ap ? null : {por:Store.me?.email || eu(), em:nowISO()}});
    const sv = $("#mr-sv", el); if (sv) sv.onclick = () => { const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">${esc(s.nome)}</div><h2>Serviço separado ou retainer</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
      <form class="sheet-b" id="ms-f" novalidate><div class="form"><div class="fld"><label for="ms-t">Serviço</label><select id="ms-t">${["Due diligence", "Auditoria", "Valuation", "PPA", "Diligência jurídica", "Retainer do mandato", "Outro serviço"].map(x => `<option>${x}</option>`).join("")}</select></div>
        <div class="fld"><label for="ms-v">Valor (R$ mil)</label><input id="ms-v" inputmode="decimal"></div><div class="fld full"><label for="ms-d">Descrição</label><input id="ms-d"></div>
        <div class="fld full"><label>Quem participou ativamente</label><div style="display:flex;flex-direction:column;gap:4px">${E.map(e => `<label class="pr-chk"><input type="checkbox" data-ms="${esc(e.nome)}"> ${esc(e.nome)} <span class="sub" style="font-size:11.5px">· ${PAPEL[e.papel] || ""}</span></label>`).join("")}</div></div></div>
        <p class="err" id="ms-err" hidden></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Incluir</button></div></form>`);
      $("#ms-f").onsubmit = e => { e.preventDefault(); const v = num($("#ms-v").value), P = $$("[data-ms]").filter(x => x.checked).map(x => x.dataset.ms); if (!v){ $("#ms-err").textContent = "Informe o valor."; $("#ms-err").hidden = false; return; }
        upd({servicos:{[novoId("v")]:{tipo:$("#ms-t").value, valor:v * 1e3, desc:$("#ms-d").value.trim(), participantes:P, em:nowISO()}}}).then(() => { close(); toast("Serviço registrado"); }); }; };
  };

  const st = document.createElement("style"); st.textContent = `.pr-chk{display:flex!important;flex-direction:row!important;align-items:center;gap:8px;font-size:13px!important;text-transform:none!important;letter-spacing:0!important;font-weight:400!important;color:var(--fog)!important;margin:0!important}.pr-chk input{width:auto!important;flex:0 0 auto}.pr-alerta{border-color:#E5484D!important;background:rgba(229,72,77,.14)!important;color:#ffd6d6}.pr-graf{background:rgba(0,10,28,.35);border:1px solid var(--line);border-radius:12px;padding:8px}.pr-n1{background:rgba(4,115,195,.22);color:#9fd0ff;border:1px solid rgba(79,176,245,.45)}@media (max-width:760px){.pr-t thead{display:none}.pr-t tr{display:grid;grid-template-columns:1fr auto;gap:2px 8px;padding:8px 0;border-bottom:1px solid var(--line)}.pr-t td{border:0!important;padding:2px 4px!important}.pr-t td:nth-child(5){grid-column:2;grid-row:1}.pr-t td:nth-child(2),.pr-t td:nth-child(3),.pr-t td:nth-child(4),.pr-t td:nth-child(6){grid-column:1/-1}}`;
  document.head.appendChild(st);
  window.KT_PROS = {painel, atividade, naOrbita, paraApresentar, ehInv, aderentes, paraInvestidor, cadencia, membros, incluir, deBase, promover, ficha, regras, equipe, meritoDe, livre, duplicado};
})();
