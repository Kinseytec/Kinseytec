/* ================= POLÍTICA DE ABORDAGEM E FONTES DE PROSPECÇÃO · KinseyTec – M&A =================
   Política Kinsey: não abordar empresas com faturamento anual abaixo de R$ 15 milhões ou valuation abaixo de
   R$ 15 milhões. O sistema marca cada target (dentro, abaixo ou sem dado), filtra na Órbita e nas importações.
   Fontes de prospecção por arquivo exportado (sem senha no sistema):
     - Econodata: empresas, CNAE, faturamento, funcionários, sócios, decisores e e-mails;
     - Lemitti: celulares dos sócios e dados das empresas;
     - Ramper: listas de prospecção.
   A importação enriquece quem já está na base (pelo CNPJ) e inclui os novos como prospecção, opcionalmente
   ligados a um investidor (N1), para o time de novos negócios. Contatos pessoais: uso restrito ao M&A (LGPD,
   legítimo interesse); não aparecem em materiais antes do NDA. */
if (window.KT_DD) (() => {
  const MIN = 15;   /* R$ milhões */
  const dig = v => String(v || "").replace(/\D/g, "");
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const fmtCnpj = d => d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : d;
  /* "R$ 50 mi", "50MM", "R$ 1,2 bi", "50.000.000,00", "De 30 a 90 milhões" → R$ milhões (faixa: média) */
  function emMi(t){
    if (t == null || t === "") return null; if (typeof t === "number") return t > 1e5 ? t / 1e6 : t;
    const s = nrm(t).replace(/r\$\s*/g, ""), mult = /\bbi(lh|l)?|bilh/.test(s) ? 1e3 : /\bmil\b(?!h)|\bk\b/.test(s) && !/milh|mm|\bmi\b/.test(s) ? 1e-3 : 1;
    const ns = [...s.matchAll(/(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?)/g)].map(m => { let x = m[1]; x = /\.\d{3}(\.|,|$)/.test(x) ? x.replace(/\./g, "").replace(",", ".") : x.replace(",", "."); return parseFloat(x); }).filter(isFinite);
    if (!ns.length) return null; let v = ns.length > 1 && /\ba\b|ate|-/.test(s) ? (ns[0] + ns[1]) / 2 : ns[0];
    if (v > 1e5) return v / 1e6; return v * mult;
  }
  const fatMi = s => s.fin?.receita ?? emMi(s.enriq?.fat) ?? emMi(s.mapa?.fat);
  function politica(s){
    if (!s || s.nivel !== "N3") return {st:"na"};
    const f = fatMi(s); let v = null; try{ const V = window.KT_BASE && KT_BASE.valorAlvo(s); if (V) v = V.eq / 1e6; }catch(e){}
    const abaixo = (f != null && f < MIN) || (v != null && v > 0 && v < MIN);
    if (abaixo) return {st:"abaixo", txt:`Fora da política Kinsey: ${f != null && f < MIN ? `faturamento de R$ ${fmt(f, 1)} mi` : `valuation de R$ ${fmt(v, 1)} mi`} (mínimo de R$ ${MIN} mi)`, f, v};
    if (f == null && v == null) return {st:"sem", txt:"Sem faturamento ou valuation para conferir a política (mínimo de R$ 15 mi)"};
    return {st:"ok", txt:`Dentro da política Kinsey (faturamento ${f != null ? "R$ " + fmt(f, 1) + " mi" : "—"}${v != null ? `, valuation R$ ${fmt(v, 1)} mi` : ""})`, f, v};
  }
  const pill = p => p.st === "abaixo" ? `<span class="pill r-alto" style="font-size:10.5px;padding:1px 8px">Fora da política</span>` : p.st === "sem" ? `<span class="pill r-pend" style="font-size:10.5px;padding:1px 8px">Política: sem dado</span>` : "";
  EXT_TARGET.push((s, el) => { const p = politica(s); if (p.st !== "abaixo" && p.st !== "sem") return; const d = document.createElement("div"); d.style.cssText = "grid-column:1/-1;font-size:11.5px;color:" + (p.st === "abaixo" ? "var(--bad)" : "var(--muted)"); d.textContent = p.txt; const a = el.querySelector(".tg-val") || el.querySelector(".acts"); el.insertBefore(d, a || null); });
  const _body = renderSupBody;
  renderSupBody = function(){ const r = _body.apply(this, arguments); if (S.supTab !== "dados") return r; const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || s.nivel !== "N3" || b.querySelector("[data-pol]")) return r;
    const p = politica(s); if (p.st === "ok") return r; const el = document.createElement("div"); el.className = "banner"; el.setAttribute("data-pol", "1"); if (p.st === "abaixo") el.style.borderColor = "var(--bad)";
    el.innerHTML = `<b>${p.st === "abaixo" ? "Fora da política de abordagem." : "Política de abordagem."}</b> ${esc(p.txt)}.`; b.prepend(el); return r; };

  /* ---------------- importação de listas (Econodata, Lemitti, Ramper) ---------------- */
  const FONTES = {
    Econodata:"empresas, CNAE, faturamento, funcionários, sócios, decisores, cargos e e-mails",
    Lemitti:"celulares dos sócios e dados das empresas",
    Ramper:"listas de prospecção e contatos das cadências"};
  async function ler(f){ const buf = await f.arrayBuffer(); if (/\.xlsx$|\.xlsm$/i.test(f.name)) return IMP.lerXLSX(buf); let x = new TextDecoder("utf-8").decode(buf); if (x.includes("\uFFFD")) x = new TextDecoder("latin1").decode(buf); return KT_DD.csv(x); }
  function importarLista(fonte, invId){
    const i = document.createElement("input"); i.type = "file"; i.accept = ".csv,.xlsx,.txt"; i.onchange = async () => { const f = i.files[0]; if (!f) return;
      let rows = []; try{ rows = await ler(f); }catch(e){ toast("Não consegui ler o arquivo"); return; }
      const hi = rows.slice(0, 30).findIndex(r => r.some(c => /cnpj/i.test(c))); if (hi < 0){ toast("O arquivo precisa ter a coluna CNPJ."); return; }
      const H = rows[hi].map(c => nrm(c)), ix = re => H.findIndex(h => re.test(h)), ixs = re => H.map((h, k) => re.test(h) ? k : -1).filter(k => k >= 0);
      const c = {nome:ix(/raz[aã]o|^empresa|nome fantasia|^nome da empresa|^nome$/), doc:ix(/cnpj/), cnae:ix(/cnae|atividade|segmento|setor/), fat:ix(/fatur|receita/), func:ix(/funcion|colaborad|empregad/), uf:ix(/^uf$|estado/), cid:ix(/cidade|municip/),
        site:ix(/site|dominio|url/), socio:ix(/socio|decisor|contato|responsavel|nome do (socio|contato)/), cargo:ix(/cargo|qualifica|funcao/), mail:ixs(/e-?mail/), cel:ixs(/celular|telefone|fone|whats/)};
      const reg = {}; rows.slice(hi + 1).forEach(r => { const d = dig(r[c.doc]); if (d.length !== 14) return; const o = reg[d] ||= {d, nome:"", cnae:"", fat:"", func:"", uf:"", cid:"", site:"", pessoas:[]};
        ["nome","cnae","fat","func","uf","cid","site"].forEach(k => { if (!o[k] && c[k] >= 0 && r[c[k]]) o[k] = String(r[c[k]]).trim(); });
        const p = {nome:c.socio >= 0 ? String(r[c.socio] || "").trim() : "", cargo:c.cargo >= 0 ? String(r[c.cargo] || "").trim() : "", email:c.mail.map(k => r[k]).filter(Boolean).join(", "), cel:c.cel.map(k => r[k]).filter(Boolean).join(", ")};
        if (p.nome || p.email || p.cel) o.pessoas.push(p); });
      const L = Object.values(reg), exist = L.filter(o => S.suppliers.some(s => dig(s.doc) === o.d)), novos = L.filter(o => !S.suppliers.some(s => dig(s.doc) === o.d));
      const fora = novos.filter(o => { const v = emMi(o.fat); return v != null && v < MIN; }), dentro = novos.filter(o => !fora.includes(o));
      const inv = invId && supById(invId), N1 = S.suppliers.filter(x => x.nivel === "N1").sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      const close = sheet(`<div class="sheet-h"><div><div class="eyebrow">Fonte de prospecção · ${esc(fonte)}</div><h2>Importar lista</h2></div><button type="button" class="x" data-x aria-label="Fechar">×</button></div>
        <form class="sheet-b" id="fli" style="display:flex;flex-direction:column;gap:10px" novalidate>
          <div class="dd-kpis"><div class="dd-k"><span>Empresas no arquivo</span><b>${L.length}</b><small>${esc(f.name)}</small></div><div class="dd-k"><span>Já na base</span><b>${exist.length}</b><small>serão enriquecidas</small></div><div class="dd-k"><span>Novas na política</span><b>${dentro.length}</b><small>faturamento ≥ R$ ${MIN} mi ou sem dado</small></div><div class="dd-k"><span>Novas fora da política</span><b>${fora.length}</b><small>faturamento &lt; R$ ${MIN} mi</small></div></div>
          <div class="form"><div class="fld"><label for="li-inv">Ligar os novos targets ao investidor</label><select id="li-inv"><option value="">—</option>${N1.map(x => `<option value="${x.id}" ${x.id === invId ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></div>
            <div class="fld"><label><input type="checkbox" id="li-fora"> Incluir também os fora da política</label><span class="hint">entram marcados como "fora da política"</span></div></div>
          <p class="sub" style="margin:0;font-size:12px">Contatos de sócios e decisores (e-mails e celulares) ficam no cadastro de cada empresa para uso do time de M&A; não aparecem em teaser nem em materiais antes do NDA.</p>
          <div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn ghost" data-x>Cancelar</button><button type="submit" class="btn primary">Importar</button></div></form>`);
      $("#fli").onsubmit = async e => { e.preventDefault(); const iv = $("#li-inv").value, incF = $("#li-fora").checked, agora = nowISO();
        const enr = o => ({[fonte]:{em:agora, arquivo:f.name, fat:o.fat, funcionarios:o.func, cnae:o.cnae, site:o.site, pessoas:o.pessoas.slice(0, 20)}});
        for (const o of exist){ const s = S.suppliers.find(x => dig(x.doc) === o.d), p = {enriq:{fat:o.fat || s.enriq?.fat || "", funcionarios:o.func || s.enriq?.funcionarios || "", fontes:enr(o)}};
          if (!s.mapa?.fat && o.fat) p.mapa = {fat:o.fat}; if (!s.mapa?.site && o.site) (p.mapa ||= {}).site = o.site;
          if (!s.mapa?.contato && o.pessoas[0]) (p.mapa ||= {}).contato = [o.pessoas[0].nome, o.pessoas[0].cargo, o.pessoas[0].email].filter(Boolean).join(" · ");
          if (!s.mapa?.telefone && o.pessoas.find(x => x.cel)) (p.mapa ||= {}).telefone = o.pessoas.find(x => x.cel).cel;
          if (iv && s.nivel === "N3" && !(s.investidores || []).includes(iv)) p.investidores = [...(s.investidores || []), iv];
          await Store.update("suppliers", s.id, p); }
        let n = 0; for (const o of [...dentro, ...(incF ? fora : [])]){ const v = emMi(o.fat), base = {nivel:"N3", nome:o.nome || fmtCnpj(o.d), doc:fmtCnpj(o.d), uf:(o.uf || "").toUpperCase().slice(0, 2), municipio:o.cid, pais:"Brasil", tipo:"Target · prospecção", etapa:"mapeada", origem:fonte,
            mapa:{temperatura:"Frio", fat:o.fat, segmentoTxt:o.cnae, site:o.site, contato:o.pessoas[0] ? [o.pessoas[0].nome, o.pessoas[0].cargo, o.pessoas[0].email].filter(Boolean).join(" · ") : "", telefone:(o.pessoas.find(x => x.cel) || {}).cel || "", aba:fonte},
            enriq:{fat:o.fat, funcionarios:o.func, fontes:enr(o)}, ...(v != null ? {fin:{receita:Math.round(v * 100) / 100, ano:new Date().getFullYear() - 1, fonte:fonte + " (estimado)"}} : {}), ...(iv ? {investidores:[iv]} : {})};
          if (window.KT_MAPA?.coords){ const [lat, lng] = KT_MAPA.coords(base); base.lat = lat; base.lng = lng; }
          await Store.set("suppliers", "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), {parentId:"", answers:{}, docs:{}, insp:{}, balanco:{}, invest:{}, criadoEm:agora, ...base}); n++; }
        close(); toast(`${fonte}: ${exist.length} enriquecida(s), ${n} nova(s)${iv ? " ligada(s) ao investidor" : ""}; consultas dos CNPJs em andamento`); renderAll(); }; };
    i.click(); }

  /* contatos enriquecidos no dossiê (aba Dados) */
  const _b2 = renderSupBody;
  renderSupBody = function(){ const r = _b2.apply(this, arguments); if (S.supTab !== "dados") return r; const s = supById(S.openSup), b = $("#sup-body"); if (!s || !b || !s.enriq?.fontes || b.querySelector("[data-enr]")) return r;
    const F = Object.entries(s.enriq.fontes), el = document.createElement("div"); el.className = "card"; el.setAttribute("data-enr", "1"); el.style.cssText = "display:flex;flex-direction:column;gap:8px";
    el.innerHTML = `<h3>Sócios, decisores e porte (fontes de prospecção)</h3><p class="sub" style="margin:0">${F.map(([k, v]) => `${esc(k)} em ${dt(v.em)}`).join(" · ")}${s.enriq.funcionarios ? ` · ${esc(s.enriq.funcionarios)} funcionários` : ""}${s.enriq.fat ? ` · faturamento ${esc(s.enriq.fat)}` : ""}</p>
      <div class="tbl"><table><thead><tr><th>Pessoa</th><th>Cargo</th><th>E-mail</th><th>Celular</th><th>Fonte</th></tr></thead><tbody>${F.flatMap(([k, v]) => (v.pessoas || []).map(p => `<tr><td>${esc(p.nome || "—")}</td><td>${esc(p.cargo || "")}</td><td>${esc(p.email || "")}</td><td class="mono">${esc(p.cel || "")}</td><td>${esc(k)}</td></tr>`)).join("") || `<tr><td colspan="5" class="sub">Sem pessoas no arquivo.</td></tr>`}</tbody></table></div>`;
    const ref = b.querySelector("[data-painel]"); if (ref) ref.after(el); else b.prepend(el); return r; };

  /* Base inicial: botões das fontes no cartão de integrações */
  const _cad = renderCadeia;
  renderCadeia = function(){ const r = _cad.apply(this, arguments); const it = $("#bi-int"); if (!it || it.querySelector("[data-fonte]")) return r;
    const bar = it.querySelector("#rp-imp")?.parentElement; if (bar){ bar.querySelector("#rp-imp").remove(); bar.insertAdjacentHTML("afterbegin", Object.keys(FONTES).map(k => `<button type="button" class="btn sm ${k === "Econodata" ? "primary" : ""}" data-fonte="${k}" title="${esc(FONTES[k])}">Importar lista ${k}</button>`).join(""));
      $$("[data-fonte]", it).forEach(x => x.onclick = () => importarLista(x.dataset.fonte)); }
    const h = it.querySelector("h3"); if (h) h.textContent = "Econodata, Lemitti e Ramper · prospecção e cadências";
    const p = it.querySelector("p.sub"); if (p) p.innerHTML = `Importe as listas exportadas do <b>Econodata</b> (empresas, CNAE, faturamento, funcionários, sócios, decisores e e-mails), do <b>Lemitti</b> (celulares dos sócios) ou do <b>Ramper</b>. Quem já está na base é enriquecido pelo CNPJ; os novos entram como prospecção (podendo ser ligados a um investidor) e o sistema consulta cada CNPJ. Política Kinsey: empresas com faturamento ou valuation abaixo de R$ ${MIN} mi ficam fora, salvo escolha.`;
    return r; };

  window.KT_POL = {MIN, politica, emMi, fatMi, importarLista};
})();
