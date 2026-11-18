/* ================= KINSEY CAPITAL · LEITURA DO SPED (ECD E ECF) =================
   ECD (SPED Contábil, arquivo .txt "|0000|LECD|"): plano de contas (I050), saldos mensais (I150/I155) e saldos antes do
   encerramento (I350/I355). Cada mês vira um balancete na Due Diligence (acumulado do ano), o que alimenta a revisão
   analítica mês a mês; o mês do encerramento usa os saldos de resultado antes do encerramento.
   ECF (SPED ECF, "|0000|LECF|"): balanço (L100) e DRE (L300) no plano referencial da Receita, do último período (L030).
   A posição circulante × não circulante vem da hierarquia do plano. Sinal: devedor positivo, credor negativo. */
(() => {
  const n = v => { const x = parseFloat(String(v || "").replace(/\./g, "").replace(",", ".")); return isFinite(x) ? x : 0; };
  const dt = v => { const m = String(v || "").match(/^(\d{2})(\d{2})(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
  const sg = (v, dc) => (String(dc).toUpperCase() === "C" ? -1 : 1) * Math.abs(n(v));
  const nrm = t => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const r2 = v => Math.round(v * 100) / 100;
  async function texto(f){ const buf = await f.arrayBuffer(); try{ return new TextDecoder("utf-8", {fatal:true}).decode(buf); }catch(e){ return new TextDecoder("windows-1252").decode(buf); } }
  const tipo = t => { const m = String(t || "").slice(0, 400).match(/^﻿?\|0000\|(LECD|LECF)\|/m); return m ? (m[1] === "LECD" ? "ecd" : "ecf") : null; };
  const reg = linha => linha.split("|").slice(1, -1);
  const cnpjDe = t => { const L = String(t).split(/\r?\n/, 3)[0] || ""; const m = L.match(/\|(\d{14})\|/); return m ? m[1] : ""; };
  /* posição no balanço pela hierarquia (descrição dos níveis acima) */
  function posicao(nat, anc){ const t = nrm(anc.join(" | "));
    if (nat === "04") return "3"; if (nat === "03") return "2.3";
    const nc = /nao circulante|longo prazo|realizavel a longo|permanente|imobilizado|investimentos?\b|intangivel|exigivel a longo/.test(t), c = /circulante/.test(t);
    if (nat === "01") return nc ? "1.2" : "1.1"; if (nat === "02") return /patrimonio liquido/.test(t) ? "2.3" : nc ? "2.2" : c ? "2.1" : "2.1"; return ""; }
  function linhaConta(D, cod, cta, anc, nat, v){
    const p = posicao(nat, anc); if (!p) return null; const codS = String(cod).startsWith(p + ".") ? String(cod) : `${p}.${cod}`, desc = cta + (anc[0] && anc[0] !== cta ? " · " + anc[0] : "");
    let g = D.classifica(codS, desc); if (nat === "03") g = "pl"; return [codS, cta, r2(v), g]; }
  /* ---------- ECD ---------- */
  function ecd(t){
    const D = window.KT_DD, P = {}, per = [], res = {}; let cur = null, curRes = null, ini = "", fim = "";
    for (const ln of String(t).split(/\r?\n/)){ if (ln.length < 6 || ln[0] !== "|") continue; const r = reg(ln), k = r[0];
      if (k === "0000"){ ini = dt(r[2]); fim = dt(r[3]); }
      else if (k === "I050"){ P[r[5]] = {nat:r[2], ind:r[3], niv:+r[4], sup:r[6], cta:(r[7] || "").trim()}; }
      else if (k === "I150"){ cur = {ini:dt(r[1]), fim:dt(r[2]), s:{}}; per.push(cur); curRes = null; }
      else if (k === "I155" && cur){ cur.s[r[1]] = (cur.s[r[1]] || 0) + sg(r[7], r[8]); }
      else if (k === "I350"){ curRes = res[dt(r[1])] = {}; cur = null; }
      else if (k === "I355" && curRes){ curRes[r[1]] = (curRes[r[1]] || 0) + sg(r[3], r[4]); } }
    if (!per.length || !Object.keys(P).length) return null;
    const anc = cod => { const L = []; let c = P[cod]?.sup, i = 0; while (c && P[c] && i++ < 12){ L.push(P[c].cta); c = P[c].sup; } return L; };
    const fechamentos = Object.keys(res).sort(); const multi = [];
    per.sort((a, b) => a.fim.localeCompare(b.fim)).forEach(p => {
      const fecha = !!res[p.fim], ult = fechamentos.filter(d => d < p.fim).pop(); const iniAcum = ult ? new Date(new Date(ult + "T12:00").getTime() + 864e5).toISOString().slice(0, 10) : (ini && ini.slice(0, 4) === p.fim.slice(0, 4) ? ini : `${p.fim.slice(0, 4)}-01-01`);
      const contas = [];
      Object.entries(P).forEach(([cod, a]) => { if (a.ind !== "A" || !["01", "02", "03", "04"].includes(a.nat)) return;
        const v = a.nat === "04" ? (fecha ? (res[p.fim][cod] ?? p.s[cod] ?? 0) : (p.s[cod] ?? 0)) : (p.s[cod] ?? 0); if (!v) return;
        const L = linhaConta(D, cod, a.cta, anc(cod), a.nat, v); if (L) contas.push(L); });
      if (fecha){ const dre = contas.filter(c => /^3/.test(c[0])); const r0 = -dre.reduce((x, c) => x + c[2], 0); if (dre.length && Math.abs(r0) > .01) contas.push(["2.98", "(−) Resultado do período já incluído no patrimônio líquido (encerramento)", r2(r0), "pl"]); }
      if (contas.length) multi.push({periodo:{ini:iniAcum, fim:p.fim}, contas, fecha}); });
    return multi.length ? {tipo:"balancete", formato:"ECD", ini, fim, multi} : null;
  }
  /* ---------- ECF ---------- */
  function ecf(t){
    const D = window.KT_DD; let blocos = [], cur = null, ini = "", fim = "";
    for (const ln of String(t).split(/\r?\n/)){ if (ln.length < 6 || ln[0] !== "|") continue; const r = reg(ln), k = r[0];
      if (k === "0000"){ const ds = r.map(dt).filter(Boolean); ini = ds[0] || ""; fim = ds[1] || ""; }
      else if (k === "L030"){ cur = {ini:dt(r[1]), fim:dt(r[2]), bal:[], dre:[]}; blocos.push(cur); }
      else if (k === "L100" && cur && r[3] === "A"){ cur.bal.push({cod:r[1], cta:r[2], sup:r[6], nat:r[5], v:sg(r[11], r[12])}); }
      else if (k === "L300" && cur && r[3] === "A"){ cur.dre.push({cod:r[1], cta:r[2], v:sg(r[7], r[8])}); } }
    const b = blocos.filter(x => x.bal.length || x.dre.length).pop(); if (!b) return null;
    const contas = [];
    b.bal.forEach(a => { if (!a.v) return; const p = String(a.cod).split("."), top = p[0], g2 = +p[1] || 1;
      const pre = top === "1" ? `1.${g2 === 1 ? 1 : 2}` : top === "2" ? (g2 === 3 ? "2.3" : `2.${g2 === 1 ? 1 : 2}`) : null; if (!pre) return;
      const codS = `${pre}.${p.slice(2).join(".")}`; contas.push([codS, a.cta, r2(a.v), pre === "2.3" ? "pl" : D.classifica(codS, a.cta)]); });
    b.dre.forEach(a => { if (!a.v) return; const codS = `3.${String(a.cod).split(".").slice(1).join(".")}`; contas.push([codS, a.cta, r2(a.v), D.classifica(codS, a.cta)]); });
    const dre = contas.filter(c => /^3/.test(c[0])); if (dre.length && contas.some(c => /^[12]/.test(c[0]))){ const r0 = -dre.reduce((x, c) => x + c[2], 0); if (Math.abs(r0) > .01) contas.push(["2.99", "(−) Resultado do período já incluído no patrimônio líquido do balanço encerrado", r2(r0), "pl"]); }
    return contas.length ? {tipo:"balanco", formato:"ECF", ini:b.ini || ini, fim:b.fim || fim, multi:[{periodo:{ini:b.ini || ini, fim:b.fim || fim}, contas, fecha:true}]} : null;
  }
  async function ler(f){ const t = await texto(f), tp = tipo(t); if (!tp) return null; const o = tp === "ecd" ? ecd(t) : ecf(t); if (o) o.cnpj = cnpjDe(t); return o; }
  window.KT_SPED = {ler, tipo, ecd, ecf};
})();
