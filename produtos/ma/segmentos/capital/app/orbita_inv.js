/* ================= ÓRBITA POR INVESTIDOR · KinseyTec – M&A =================
   O mapa mostra só os targets (N3). Cada investidor (N1) define o que compra no cadastro: atividades (ex.: lavanderia
   industrial; soja, milho, fertilizantes), CNAEs, CNPJs de targets específicos e onde (estados, cidades e regiões).
   Ao escolher o investidor, o mapa mostra apenas os N3 que ele compra, ligados a ele. Sem investidor escolhido, o mapa
   fica em modo consulta: todos os targets, com filtro por segmento e estado (para o N2 ou um investidor consultar N3). */
if (window.KT_DD) (() => {
  const dig = v => String(v || "").replace(/\D/g, "");
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const REG = {norte:["AC","AM","AP","PA","RO","RR","TO"], nordeste:["AL","BA","CE","MA","PB","PE","PI","RN","SE"], "centro-oeste":["DF","GO","MT","MS"], "centro oeste":["DF","GO","MT","MS"], sudeste:["ES","MG","RJ","SP"], sul:["PR","RS","SC"]};
  const AMPLOS = new Set(["brasil", "america latina", "todo o brasil", "nacional", ""]);
  /* palavras que não distinguem o negócio (segmentos amplos e termos genéricos) */
  const GEN = new Set([...(typeof SEGMENTOS !== "undefined" ? SEGMENTOS : []).map(nrm), "industrial", "industria", "industrias", "servico", "servicos", "comercio", "gestao", "empresa", "empresas", "setor",
    "geral", "variado", "variados", "outros", "brasil", "grupo", "negocio", "negocios", "atividade", "atividades", "mercado", "solucoes", "produtos", "fabricacao", "distribuicao", "suplementar",
    "busca", "buscam", "interesse", "interessa", "oportunidade", "oportunidades", "oportuidades", "enviada", "envaida", "enviado", "enviar", "enviando", "resposta", "negativa", "positivo", "positiva", "retorno",
    "gostaria", "possivel", "para", "como", "mais", "menos", "setores", "segmento", "segmentos", "momento", "foco", "focado", "atual", "apresentada", "declinada", "especialmente", "relacionado", "relacionadas",
    "alguma", "algum", "area", "fique", "vontade", "continuar", "tivemos", "porem", "pequeno", "pequena", "pequenas", "porte", "base", "voltadas", "teses", "ligadas", "fundo", "esta", "early", "stage",
    "novas", "novos", "nosso", "nossa", "sobre", "pelo", "pela", "entre", "outras", "qualquer", "investimento", "investimentos", "aquisicao", "adquirir", "compra", "comprar", "possamos", "especificado"]);
  const palavras = frase => nrm(frase).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !GEN.has(w));
  const lista = v => Array.isArray(v) ? v : String(v || "").split(/[;,/·]| - | e /).map(x => x.trim()).filter(Boolean);

  /* o que o investidor compra */
  function criterios(inv){
    const T = inv.tese || {};
    const unico = L => [...new Map(L.filter(l => l.length).map(l => [l.join(" "), l])).values()];
    let atv = unico(lista(T.atividades).map(palavras));
    if (!atv.length) atv = unico([...lista(T.texto), ...(T.segmentos || []).filter(x => !GEN.has(nrm(x)))].map(palavras));
    const cnaes = lista(T.cnaes).map(dig).filter(c => c.length >= 2), amplos = (T.segmentos || []).filter(x => GEN.has(nrm(x)) && !/^outros$/i.test(x));
    const ufs = lista(T.ufs).map(x => x.toUpperCase()).filter(x => /^[A-Z]{2}$/.test(x)), cidades = lista(T.cidades).map(nrm), regioes = lista(T.regioes).map(nrm).filter(r => !AMPLOS.has(r));
    const cnpjs = lista(T.cnpjs).map(dig).filter(c => c.length === 14);
    return {atv, cnaes, amplos, ufs, cidades, regioes, cnpjs};
  }
  const textoAlvo = t => { const r = t.receita || {}; return nrm([t.nome, t.segmento, t.perfil?.segmento, t.mapa?.segmentoTxt, t.perfil?.descricao, r.cnaeDesc, ...(r.cnaesSec || []), ...((t.perfil?.linhas || []).map(l => l.nome))].filter(Boolean).join(" ")); };
  const cnaeAlvo = t => [t.receita?.cnae, t.cnae, ...((t.receita?.cnaesSec || []).map(c => String(c).split(" ")[0]))].map(c => dig(c).padStart(7, "0")).filter(c => c !== "0000000");
  const temPalavra = (tx, w) => { const st = w.slice(0, Math.max(5, w.length - 3)); return tx.split(" ").some(x => x.startsWith(st)) || tx.includes(" " + w); };

  /* o target t é comprado pelo investidor inv? devolve o motivo ou null */
  function aderente(inv, t){
    if (!inv || !t || t.nivel !== "N3") return null;
    if ((t.investidores || []).includes(inv.id)) return "ligado no mapa";
    const C = criterios(inv); if (C.cnpjs.includes(dig(t.doc))) return "CNPJ indicado pelo investidor";
    if (t.etapa === "descartada") return null;
    const tx = " " + textoAlvo(t) + " ", cn = cnaeAlvo(t);
    let neg = null;
    const a = C.atv.find(l => l.every(w => temPalavra(tx, w))); if (a) neg = "compra " + a.join(" ");
    if (!neg){ const c = C.cnaes.find(c => cn.some(x => x.startsWith(c.padStart(c.length > 2 ? 7 : 2, "0").slice(0, c.length)))); if (c) neg = "CNAE " + c; }
    if (!neg && !C.atv.length && !C.cnaes.length){ const seg = t.perfil?.segmento || t.segmento; if (seg && C.amplos.includes(seg)) neg = "segmento " + seg; }
    if (!neg) return null;
    const geo = C.ufs.length || C.cidades.length || C.regioes.length;
    if (geo){ const ok = C.ufs.includes(t.uf) || C.cidades.includes(nrm(t.municipio)) || C.regioes.some(r => (REG[r] || []).includes(t.uf)); if (!ok) return null; }
    return neg;
  }
  const alvosDe = inv => S.suppliers.filter(t => aderente(inv, t));

  /* ---------------- filtro do globo e da faixa de empresas ----------------
     Padrão: só os targets (N3). A consulta (botão no canto, painel lateral) filtra por tipo (N1, N2, N3 ou todos),
     investidor (o que ele compra), segmento, CNAE cadastrado, estado, região, cidade e temperatura do mapa. */
  const VAZIO = {tipo:"todos", inv:"", seg:"", cnae:"", uf:"", reg:"", cid:"", temp:"", pol:""};
  S.orb = {...VAZIO, ...(S.orb || {})};
  Object.defineProperty(S, "orbInv", {get:() => S.orb.inv, set:v => { S.orb.inv = v || ""; if (v) S.orb.tipo = "N3"; }, configurable:true});
  Object.assign(S.lv, {N1:true, N2:true, N3:true, rotas:false});
  const segDe = t => t.perfil?.segmento || t.segmento || "";
  const REGN = {Norte:REG.norte, Nordeste:REG.nordeste, "Centro-Oeste":REG["centro-oeste"], Sudeste:REG.sudeste, Sul:REG.sul};
  const regDe = uf => Object.keys(REGN).find(r => REGN[r].includes(uf)) || "";
  const cnaeDe = s => { const c = dig(s.receita?.cnae || s.cnae); return c ? c.padStart(7, "0") : ""; };
  const fmtCnae = c => c.length === 7 ? `${c.slice(0, 4)}-${c.slice(4, 5)}/${c.slice(5)}` : c;
  const tempDe = s => s.mapa?.temperatura || "";
  function passa(s, F = S.orb){
    const inv = F.inv && supById(F.inv);
    if (inv && F.tipo === "N3"){ if (s.id === inv.id) return true; if (!aderente(inv, s)) return false; }
    else if (F.tipo !== "todos" && s.nivel !== F.tipo) return false;
    if (F.seg && segDe(s) !== F.seg) return false;
    if (F.cnae && !cnaeDe(s).startsWith(F.cnae)) return false;
    if (F.uf && s.uf !== F.uf) return false;
    if (F.reg && regDe(s.uf) !== F.reg) return false;
    if (F.cid && nrm(s.municipio) !== F.cid) return false;
    if (F.temp && tempDe(s) !== F.temp) return false;
    if (F.pol && s.nivel === "N3" && window.KT_POL){ const p = KT_POL.politica(s).st; if (F.pol === "ok" ? p === "abaixo" : p !== "abaixo") return false; }
    return true;
  }
  const fora = id => { const s = supById(id); return !s || !passa(s); };
  window.ORB_FILTRO = s => S.sel === s.id || passa(s);
  const ativos = () => Object.keys(VAZIO).filter(k => S.orb[k] !== VAZIO[k]).length;
  /* linhas do investidor escolhido até cada target que ele compra */
  EXT_ORB.push((ctx, now, list) => { const inv = S.orb.inv && S.orb.tipo === "N3" && supById(S.orb.inv); if (!inv || inv.lat == null) return;
    ctx.setLineDash([3, 5]); ctx.lineDashOffset = G.reduce ? 0 : now / 80;
    list.filter(t => t.nivel === "N3" && t.lat != null).forEach(t => { const on = S.sel === t.id; ctx.beginPath(); G.path({type:"LineString", coordinates:[[inv.lng, inv.lat], [t.lng, t.lat]]});
      ctx.strokeStyle = on ? "rgba(242,193,78,.95)" : "rgba(242,193,78,.45)"; ctx.lineWidth = on ? 2 : 1.1; ctx.stroke(); });
    ctx.setLineDash([]); });

  /* ---------------- botão e painel lateral de consulta ---------------- */
  const css = document.createElement("style");
  css.textContent = `#v-orbita .lvl{display:none!important}
.orb-cbtn{position:absolute;top:10px;left:max(12px,env(safe-area-inset-left,0px));z-index:4;display:flex;align-items:center;gap:8px;height:38px;max-width:calc(100% - 80px);border-radius:12px;border:1px solid var(--line-2);background:rgba(1,31,75,.88);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--fog);font:inherit;font-size:13px;padding:0 12px;cursor:pointer}
.orb-cbtn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8;flex:none}
.orb-cbtn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.orb-cbtn b{color:#F2C14E}
.orb-cbtn .n{background:var(--glow);color:#00122e;border-radius:9px;font-size:11px;font-weight:700;padding:1px 7px}
.orb-cons{position:absolute;top:0;left:0;bottom:0;z-index:7;width:min(340px,88%);background:linear-gradient(180deg,rgba(6,35,79,.97),rgba(1,20,48,.98));border-right:1px solid var(--line-2);box-shadow:12px 0 40px rgba(0,0,0,.45);display:flex;flex-direction:column;pointer-events:auto}
.orb-cons[hidden]{display:none}
.orb-cons .ch{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--line)}
.orb-cons .ch h3{font-size:15px;margin:0}
.orb-cons .cb{flex:1;overflow:auto;padding:10px 14px;display:flex;flex-direction:column;gap:9px}
.orb-cons label{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:3px}
.orb-cons select{width:100%;height:36px;border-radius:10px;border:1px solid var(--line-2);background:rgba(1,31,75,.9);color:var(--fog);font:inherit;font-size:13px;padding:0 8px}
.orb-cons .tipos{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.orb-cons .tipos button{height:34px;border-radius:9px;border:1px solid var(--line-2);background:transparent;color:var(--fog);font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.orb-cons .tipos button[aria-pressed="true"]{background:var(--glow);color:#00122e;border-color:var(--glow)}
.orb-cons .res{font-size:12.5px;color:var(--fog);border:1px solid var(--line);border-radius:10px;padding:7px 9px;line-height:1.4}.orb-cons .res b{color:#F2C14E}
.orb-cons .lst{display:flex;flex-direction:column;gap:3px}
.orb-cons .lst button{display:flex;gap:7px;align-items:center;text-align:left;background:transparent;border:1px solid var(--line);border-radius:8px;padding:6px 9px;color:inherit;font:inherit;font-size:12.5px;cursor:pointer}
.orb-cons .lst button span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.orb-cons .lst small{color:var(--muted)}
.orb-cons .cf{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--line)}.orb-cons .cf .btn{flex:1}
@media (max-width:760px){.orb-cbtn{top:8px;left:10px;height:36px;font-size:12.5px}.orb-cons{width:88%}}`;
  document.head.appendChild(css);
  const ICON = `<svg viewBox="0 0 24 24"><path d="M4 5h16M7 12h10M10 19h4"/></svg>`;
  const TIPOS = [["N3", "Targets"], ["N1", "Investidores"], ["N2", "Parceiros"], ["todos", "Todos"]];
  const rotTipo = {N3:"target(s)", N1:"investidor(es)", N2:"intermediador(es)", todos:"empresa(s)"};
  function resumo(){
    const F = S.orb, inv = F.inv && supById(F.inv), n = S.suppliers.filter(s => passa(s) && (!inv || s.id !== inv.id) && !(window.KT_DECL && KT_DECL.dec(s)) && (!s.standby?.ativo || S.orb?.standby)).length;
    const partes = [inv && F.tipo === "N3" ? `que ${inv.nome} compra` : "", F.seg, F.cnae ? "CNAE " + F.cnae : "", F.cid ? S.suppliers.find(s => nrm(s.municipio) === F.cid)?.municipio : "", F.uf, F.reg, F.temp].filter(Boolean);
    if (F.tipo === "todos" && !inv){ const c = l => S.suppliers.filter(s => s.nivel === l && passa(s) && !(window.KT_DECL && KT_DECL.dec(s)) && (!s.standby?.ativo || S.orb?.standby)).length;
      return {n, txt:`${n} ${c("N3")} targets · ${c("N1")} investidores · ${c("N2")} parceiros${partes.length ? " · " + partes.join(" · ") : ""}`}; }
    return {n, txt:`${n} ${rotTipo[F.tipo]}${partes.length ? " · " + partes.join(" · ") : ""}`};
  }
  function botao(){
    const v = $("#v-orbita"); if (!v) return; let b = $("#orb-cbtn");
    if (!b){ b = document.createElement("button"); b.type = "button"; b.className = "orb-cbtn"; b.id = "orb-cbtn"; v.appendChild(b); b.onclick = () => { S.orbCons = !S.orbCons; painel(); }; }
    const R = resumo(), k = ativos();
    b.innerHTML = `${ICON}<span>${S.orb.tipo === "todos" && !S.orb.inv ? esc(R.txt.replace(/^\d+ /, "")).replace(/(\d+) /g, "<b>$1</b> ") : `Consulta · <b>${R.n}</b> ${esc(R.txt.replace(/^\d+ /, ""))}`}</span>${k ? `<i class="n">${k}</i>` : ""}`;
    b.setAttribute("aria-expanded", !!S.orbCons);
    const old = $("#orb-inv"); if (old) old.remove();
  }
  function painel(){
    botao(); const v = $("#v-orbita"); if (!v) return; let el = $("#orb-cons");
    if (!el){ el = document.createElement("div"); el.className = "orb-cons"; el.id = "orb-cons"; v.appendChild(el); }
    el.hidden = !S.orbCons; if (!S.orbCons) return;
    const F = S.orb, base = S.suppliers.filter(s => F.tipo === "todos" || s.nivel === F.tipo || (F.inv && F.tipo === "N3"));
    if (F.inv && !supById(F.inv)) F.inv = "";
    const conta = (arr, fn) => { const m = new Map(); arr.forEach(s => { const k = fn(s); if (k) m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]))); };
    const pool = S.suppliers.filter(s => F.tipo === "todos" || s.nivel === F.tipo);
    const segs = conta(pool, segDe), ufs = conta(pool, s => s.uf), regs = conta(pool, s => regDe(s.uf)), temps = conta(pool, tempDe);
    const cid = conta(pool.filter(s => !F.uf || s.uf === F.uf), s => s.municipio ? nrm(s.municipio) : ""), nomeCid = k => (pool.find(s => nrm(s.municipio) === k) || {}).municipio || k;
    const cn = conta(pool, cnaeDe), descCnae = c => (pool.find(s => cnaeDe(s) === c)?.receita?.cnaeDesc || "");
    const div2 = conta(pool, s => cnaeDe(s).slice(0, 2));
    const opt = (L, val, rot = x => x, todos = "Todos") => `<option value="">${todos}</option>${L.map(([k, n]) => `<option value="${esc(k)}" ${k === val ? "selected" : ""}>${esc(rot(k))} (${n})</option>`).join("")}`;
    const N1 = S.suppliers.filter(s => s.nivel === "N1").sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    const R = resumo(), lista = S.suppliers.filter(s => passa(s) && !(F.inv && s.id === F.inv)).sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    el.innerHTML = `<div class="ch"><h3>Consulta</h3><button type="button" class="btn sm ghost" data-cx aria-label="Fechar">×</button></div>
      <div class="cb">
        <div><label>Tipo</label><div class="tipos">${TIPOS.map(([k, l]) => `<button type="button" data-tp="${k}" aria-pressed="${F.tipo === k}">${l}</button>`).join("")}</div></div>
        ${F.tipo === "N3" ? `<div><label for="oc-inv">O que o investidor compra</label><select id="oc-inv"><option value="">Todos os targets</option>${N1.map(s => `<option value="${s.id}" ${s.id === F.inv ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}</select></div>` : ""}
        <div><label for="oc-seg">Segmento</label><select id="oc-seg">${opt(segs, F.seg)}</select></div>
        <div><label for="oc-cnae">CNAE cadastrado</label><select id="oc-cnae"><option value="">Todos</option>${div2.length ? `<optgroup label="Divisão (2 dígitos)">${div2.map(([k, n]) => `<option value="${k}" ${k === F.cnae ? "selected" : ""}>${k} · divisão (${n})</option>`).join("")}</optgroup>` : ""}<optgroup label="Atividade">${cn.map(([k, n]) => `<option value="${k}" ${k === F.cnae ? "selected" : ""}>${fmtCnae(k)} ${esc(descCnae(k).slice(0, 40))} (${n})</option>`).join("")}</optgroup></select></div>
        <div><label for="oc-reg">Região</label><select id="oc-reg">${opt(regs, F.reg, x => x, "Todas")}</select></div>
        <div><label for="oc-uf">Estado</label><select id="oc-uf">${opt(ufs, F.uf)}</select></div>
        <div><label for="oc-cid">Cidade</label><select id="oc-cid">${opt(cid, F.cid, nomeCid, "Todas")}</select></div>
        <div><label for="oc-pol">Política Kinsey (R$ 15 mi a R$ 10 bi)</label><select id="oc-pol">${[["", "Todos"], ["ok", "Só dentro da política"], ["abaixo", "Só fora da política"]].map(([k, l]) => `<option value="${k}" ${k === F.pol ? "selected" : ""}>${l}</option>`).join("")}</select></div>
        ${temps.length ? `<div><label for="oc-temp">Temperatura no mapa</label><select id="oc-temp">${opt(temps, F.temp, x => x, "Todas")}</select></div>` : ""}
        <div class="res"><b>${R.n}</b> ${esc(R.txt.replace(/^\d+ /, ""))}</div>
        <div class="lst">${lista.slice(0, 60).map(s => `<button type="button" data-ocs="${s.id}"><i style="color:${RCOL[riskOf(s).level] || "#9fb"}">${s.nivel === "N1" ? "◆" : s.nivel === "N2" ? "■" : "●"}</i><span>${esc(s.nome)}</span><small>${esc(s.uf || s.pais || "")}</small></button>`).join("")}${lista.length > 60 ? `<p class="sub" style="margin:4px 0 0;font-size:11.5px">e mais ${lista.length - 60}</p>` : ""}</div>
      </div>
      <div class="cf"><button type="button" class="btn sm" id="oc-limpa">Limpar</button><button type="button" class="btn sm primary" data-cx>Ver no mapa</button></div>`;
    const atualiza = () => { G.dirty = true; if (S.sel && fora(S.sel)) selectSup(null); renderStrip(); };
    $$("[data-cx]", el).forEach(b => b.onclick = () => { S.orbCons = false; painel(); });
    $$("[data-tp]", el).forEach(b => b.onclick = () => { S.orb = {...VAZIO, tipo:b.dataset.tp}; atualiza(); });
    const set = (id, k, extra) => { const x = $(id, el); if (x) x.onchange = () => { S.orb[k] = x.value; if (extra) extra(x.value); atualiza(); }; };
    set("#oc-inv", "inv", v => { const i = v && supById(v); if (i){ selectSup(i.id, false); enquadra(i); } });
    set("#oc-seg", "seg"); set("#oc-cnae", "cnae"); set("#oc-reg", "reg", () => { S.orb.uf = ""; S.orb.cid = ""; }); set("#oc-uf", "uf", () => { S.orb.cid = ""; }); set("#oc-cid", "cid"); set("#oc-temp", "temp"); set("#oc-pol", "pol");
    $("#oc-limpa", el).onclick = () => { S.orb = {...VAZIO}; atualiza(); };
    $$("[data-ocs]", el).forEach(b => b.onclick = () => { if (window.matchMedia("(max-width:760px)").matches) S.orbCons = false; selectSup(b.dataset.ocs, true); painel(); });
  }
  /* mostra o investidor e todos os targets dele na tela */
  function enquadra(inv){ const P = [inv, ...alvosDe(inv)].filter(x => x.lat != null); if (!P.length) return;
    const la = P.map(x => x.lat), lo = P.map(x => x.lng), span = Math.max(Math.max(...la) - Math.min(...la), (Math.max(...lo) - Math.min(...lo)) * .8, 2);
    flyTo((Math.max(...lo) + Math.min(...lo)) / 2, (Math.max(...la) + Math.min(...la)) / 2, Math.max(1.2, Math.min(8, 22 / span))); }
  /* "Ver na órbita" de um investidor abre o mapa no modo desse investidor; de um N2, mostra os parceiros */
  const _sel = selectSup; selectSup = function(id){ const s = id && supById(id);
    if (s && s.nivel === "N1" && S.orb.inv !== id && ["N3", "todos"].includes(S.orb.tipo)){ S.orb = {...VAZIO, tipo:"N3", inv:id}; }
    return _sel.apply(this, arguments); };
  const _strip = renderStrip; renderStrip = function(){ const r = _strip.apply(this, arguments); try{ painel(); }catch(e){ console.error(e); } return r; };

  /* ---------------- busca por empresa ou CNPJ, logo abaixo do cartão ---------------- */
  const cssQ = document.createElement("style");
  cssQ.textContent = `.orb-q{pointer-events:auto;position:relative;margin:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px))}
.orb-q input{width:100%;height:36px;border-radius:11px;border:1px solid var(--line-2);background:rgba(1,31,75,.9);color:var(--fog);font:inherit;font-size:13.5px;padding:0 12px 0 34px}
.orb-q input:focus{outline:none;border-color:var(--glow)}
.orb-q svg{position:absolute;left:11px;top:10px;width:16px;height:16px;stroke:var(--muted);fill:none;stroke-width:1.8}
.orb-q .res{position:absolute;left:0;right:0;bottom:42px;background:rgba(1,20,48,.98);border:1px solid var(--line-2);border-radius:12px;padding:4px;display:flex;flex-direction:column;gap:2px;max-height:46vh;overflow:auto;z-index:8;box-shadow:0 -10px 30px rgba(0,0,0,.4)}
.orb-q .res[hidden]{display:none}
.orb-q .res button{display:flex;gap:8px;align-items:center;text-align:left;background:transparent;border:0;border-radius:8px;padding:8px 9px;color:inherit;font:inherit;font-size:13px;cursor:pointer}
.orb-q .res button:hover,.orb-q .res button:focus{background:rgba(79,176,245,.12)}
.orb-q .res span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.orb-q .res small{color:var(--muted);font-size:11.5px;white-space:nowrap}`;
  document.head.appendChild(cssQ);
  function buscaEmpresa(){
    const v = $("#v-orbita"), dock = v && v.querySelector(".dock"), strip = $("#strip"); if (!dock || !strip || $("#orb-q")) return;
    const el = document.createElement("div"); el.className = "orb-q"; el.id = "orb-q";
    el.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="orb-qi" type="search" placeholder="Buscar empresa ou CNPJ na base" autocomplete="off" aria-label="Buscar empresa ou CNPJ"><div class="res" hidden></div>`;
    dock.insertBefore(el, strip);
    const inp = el.querySelector("input"), res = el.querySelector(".res");
    const fecha = () => { res.hidden = true; res.innerHTML = ""; };
    inp.oninput = () => { const q = nrm(inp.value.trim()), d = dig(inp.value); if (q.length < 2 && d.length < 3){ fecha(); return; }
      const L = S.suppliers.filter(s => (d.length >= 3 && dig(s.doc).includes(d)) || (q.length >= 2 && [s.nome, s.mandato?.codinome, s.receita?.razao, s.receita?.fantasia].some(x => nrm(x).includes(q))))
        .sort((a, b) => (a.nivel === "N3" ? 0 : 1) - (b.nivel === "N3" ? 0 : 1) || (a.nome || "").localeCompare(b.nome || "")).slice(0, 8);
      const novo = d.length === 14 && !S.suppliers.some(s => dig(s.doc) === d);
      res.innerHTML = L.map(s => `<button type="button" data-q="${s.id}"><i style="color:${RCOL[riskOf(s).level] || "#9fb"}">${s.nivel === "N1" ? "◆" : s.nivel === "N2" ? "■" : "●"}</i><span>${esc(s.nome)}</span><small>${s.nivel} · ${esc(s.doc || s.uf || "")}</small></button>`).join("")
        + (novo ? `<button type="button" data-qn="${d}"><i>+</i><span>CNPJ fora da base: cadastrar na Base inicial</span><small>${esc(inp.value.trim())}</small></button>` : "")
        + (!L.length && !novo ? `<div class="sub" style="margin:0;padding:8px 9px;font-size:12.5px">Nenhuma empresa da base encontrada.</div>` : "");
      res.hidden = false;
      $$("[data-q]", res).forEach(b => b.onclick = () => { const s = supById(b.dataset.q); inp.value = ""; fecha(); inp.blur(); if (s.nivel === "N1") S.orb = {...VAZIO, tipo:"N3", inv:s.id}; selectSup(s.id, true); G.dirty = true; renderStrip(); });
      $$("[data-qn]", res).forEach(b => b.onclick = () => { const doc = b.dataset.qn; inp.value = ""; fecha(); if (window.KT_BASE){ KT_BASE.cadastro("N3"); setTimeout(() => { const x = document.getElementById("bi-doc"); if (x){ x.value = doc; const c = document.getElementById("bi-rf"); if (c) c.click(); } }, 120); } }); };
    inp.onkeydown = e => { if (e.key === "Escape"){ inp.value = ""; fecha(); inp.blur(); } if (e.key === "Enter"){ const b = res.querySelector("button"); if (b) b.click(); } };
    document.addEventListener("click", e => { if (!el.contains(e.target)) fecha(); });
  }
  buscaEmpresa(); setTimeout(buscaEmpresa, 0); setTimeout(buscaEmpresa, 800);

  window.KT_ORBINV = {aderente, criterios, alvosDe, passa};
})();
