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

  /* ---------------- filtro do globo e da faixa de empresas ---------------- */
  S.orbInv = S.orbInv || ""; S.orbSeg = ""; S.orbUf = "";
  Object.assign(S.lv, {N1:true, N2:true, N3:true, rotas:false});
  const segDe = t => t.perfil?.segmento || t.segmento || "";
  const fora = id => { const s = supById(id); if (!s) return true; const k = S.sel; S.sel = null; const ok = window.ORB_FILTRO(s); S.sel = k; return !ok; };
  window.ORB_FILTRO = s => {
    if (S.sel === s.id) return true;
    const inv = S.orbInv && supById(S.orbInv);
    if (inv) return s.id === inv.id || !!aderente(inv, s);
    return s.nivel === "N3" && (!S.orbSeg || segDe(s) === S.orbSeg) && (!S.orbUf || s.uf === S.orbUf);
  };
  /* linhas do investidor escolhido até cada target que ele compra */
  EXT_ORB.push((ctx, now, list) => { const inv = S.orbInv && supById(S.orbInv); if (!inv || inv.lat == null) return;
    ctx.setLineDash([3, 5]); ctx.lineDashOffset = G.reduce ? 0 : now / 80;
    list.filter(t => t.nivel === "N3" && t.lat != null).forEach(t => { const on = S.sel === t.id; ctx.beginPath(); G.path({type:"LineString", coordinates:[[inv.lng, inv.lat], [t.lng, t.lat]]});
      ctx.strokeStyle = on ? "rgba(242,193,78,.95)" : "rgba(242,193,78,.45)"; ctx.lineWidth = on ? 2 : 1.1; ctx.stroke(); });
    ctx.setLineDash([]); });

  /* ---------------- painel de escolha na Órbita ---------------- */
  const css = document.createElement("style");
  css.textContent = `#v-orbita .lvl{display:none!important}
.orb-inv{position:absolute;top:10px;left:max(12px,env(safe-area-inset-left,0px));z-index:4;display:flex;flex-direction:column;gap:6px;max-width:min(430px,calc(100% - 70px));pointer-events:auto}
.orb-inv .row{display:flex;gap:6px;flex-wrap:wrap}
.orb-inv select{height:36px;border-radius:10px;border:1px solid var(--line-2);background:rgba(1,31,75,.88);color:var(--fog);font:inherit;font-size:13px;padding:0 8px;max-width:100%}
.orb-inv #oi-inv{min-width:240px;flex:1}
.orb-inv .info{font-size:12px;color:var(--fog);background:rgba(1,31,75,.78);border:1px solid var(--line);border-radius:10px;padding:5px 9px;line-height:1.35}
.orb-inv .info b{color:#F2C14E}
@media (max-width:760px){.orb-inv{top:8px;left:10px;right:54px;max-width:none}.orb-inv #oi-inv{min-width:0;width:100%}.orb-inv select{height:34px;font-size:12.5px}.orb-inv .info{font-size:11.5px}}`;
  document.head.appendChild(css);
  function painel(){
    const v = $("#v-orbita"); if (!v) return; let el = $("#orb-inv");
    if (!el){ el = document.createElement("div"); el.className = "orb-inv"; el.id = "orb-inv"; v.appendChild(el); }
    const N1 = S.suppliers.filter(s => s.nivel === "N1").sort((a, b) => (a.nome || "").localeCompare(b.nome || "")), N3 = S.suppliers.filter(s => s.nivel === "N3");
    if (S.orbInv && !supById(S.orbInv)) S.orbInv = "";
    const inv = S.orbInv && supById(S.orbInv), alvos = inv ? alvosDe(inv) : [], C = inv ? criterios(inv) : null;
    const segs = [...new Set(N3.map(segDe).filter(Boolean))].sort(), ufs = [...new Set(N3.map(s => s.uf).filter(Boolean))].sort();
    const oq = C ? [C.atv.map(l => l.join(" ")).join(", "), C.cnaes.length ? "CNAE " + C.cnaes.join(", ") : "", !C.atv.length && !C.cnaes.length ? C.amplos.join(", ") : ""].filter(Boolean).join(" · ") : "";
    const onde = C ? [...C.ufs, ...C.cidades, ...C.regioes].join(", ") : "";
    el.innerHTML = `<div class="row"><select id="oi-inv" aria-label="Investidor"><option value="">Consulta · todos os targets (N3)</option><optgroup label="Investidores (N1): ver o que cada um compra">${N1.map(s => `<option value="${s.id}" ${s.id === S.orbInv ? "selected" : ""}>${esc(s.nome)}</option>`).join("")}</optgroup></select></div>
      ${inv ? `<div class="info"><b>${alvos.length}</b> target(s) que ${esc(inv.nome)} compra${oq ? ` · ${esc(oq)}` : ""}${onde ? ` · ${esc(onde)}` : ""}${!oq && !alvos.length ? ". Informe no cadastro do investidor o que ele compra (atividades, CNAEs) e onde." : ""}</div>`
        : `<div class="row"><select id="oi-seg" aria-label="Segmento"><option value="">Todos os segmentos</option>${segs.map(x => `<option ${x === S.orbSeg ? "selected" : ""}>${esc(x)}</option>`).join("")}</select><select id="oi-uf" aria-label="Estado"><option value="">Todos os estados</option>${ufs.map(x => `<option ${x === S.orbUf ? "selected" : ""}>${x}</option>`).join("")}</select></div>
          <div class="info"><b>${N3.filter(window.ORB_FILTRO).length}</b> target(s) no mapa · escolha um investidor para ver só o que ele compra</div>`}`;
    const atualiza = () => { G.dirty = true; renderStrip(); painel(); };
    $("#oi-inv", el).onchange = e => { S.orbInv = e.target.value; const i = S.orbInv && supById(S.orbInv);
      if (i){ selectSup(i.id, false); enquadra(i); } else if (S.sel && fora(S.sel)) selectSup(null); atualiza(); };
    const sg = $("#oi-seg", el); if (sg) sg.onchange = e => { S.orbSeg = e.target.value; atualiza(); };
    const uf = $("#oi-uf", el); if (uf) uf.onchange = e => { S.orbUf = e.target.value; atualiza(); };
  }
  /* mostra o investidor e todos os targets dele na tela */
  function enquadra(inv){ const P = [inv, ...alvosDe(inv)].filter(x => x.lat != null); if (!P.length) return;
    const la = P.map(x => x.lat), lo = P.map(x => x.lng), span = Math.max(Math.max(...la) - Math.min(...la), (Math.max(...lo) - Math.min(...lo)) * .8, 2);
    flyTo((Math.max(...lo) + Math.min(...lo)) / 2, (Math.max(...la) + Math.min(...la)) / 2, Math.max(1.2, Math.min(8, 22 / span))); }
  /* "Ver na órbita" de um investidor abre o mapa no modo desse investidor */
  const _sel = selectSup; selectSup = function(id){ const s = id && supById(id); if (s && s.nivel === "N1" && S.orbInv !== id){ S.orbInv = id; } return _sel.apply(this, arguments); };
  const _strip = renderStrip; renderStrip = function(){ const r = _strip.apply(this, arguments); try{ painel(); }catch(e){} return r; };

  window.KT_ORBINV = {aderente, criterios, alvosDe};
})();
