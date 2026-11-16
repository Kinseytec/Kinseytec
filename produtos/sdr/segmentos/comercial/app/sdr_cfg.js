/* ================= KinseyTec – SDR =================
   Sistema de prospecção comercial das SDRs (auditoria e contabilidade, consultoria e BPO, Due Diligence e Valuation).
   Usa o motor de prospecção do KinseyTec M&A (mesmo arquivo-fonte, em modo "sdr"): listas de qualquer origem, contatos
   sem duplicar, consulta geral e rápida, ligações, reuniões para sócios e comercial, propostas, serviços fechados,
   comissão de SDR e frequência no sistema. Leads com interesse em vender a empresa seguem para o KinseyTec M&A. */
window.KT_PROS_CFG = {modo:"sdr"};
/* utilitários que o motor espera (no M&A vêm da Due Diligence) */
if (!window.KT_DD) window.KT_DD = (() => {
  const fx = (v, d) => (+v).toLocaleString("pt-BR", {minimumFractionDigits:d, maximumFractionDigits:d});
  const mi = (v, d = 1) => v == null || !isFinite(v) ? "—" : `R$ ${fx(v / 1e6, d)} mi`;
  const pc = (v, d = 1) => v == null || !isFinite(v) ? "—" : `${fx(v * 100, d)}%`;
  function csv(t){
    t = String(t || "").replace(/^\uFEFF/, ""); const l1 = t.split(/\r?\n/)[0] || "", sep = (l1.match(/;/g) || []).length >= (l1.match(/,/g) || []).length ? ";" : (l1.includes("\t") ? "\t" : ",");
    const rows = []; let row = [], cel = "", q = false;
    for (let i = 0; i < t.length; i++){ const c = t[i];
      if (q){ if (c === '"'){ if (t[i + 1] === '"'){ cel += '"'; i++; } else q = false; } else cel += c; continue; }
      if (c === '"') q = true; else if (c === sep){ row.push(cel); cel = ""; } else if (c === "\n" || c === "\r"){ if (c === "\r" && t[i + 1] === "\n") i++; row.push(cel); rows.push(row); row = []; cel = ""; } else cel += c; }
    if (cel || row.length){ row.push(cel); rows.push(row); }
    return rows.filter(r => r.some(x => String(x).trim()));
  }
  return {mi, pc, csv};
})();
/* menu: só a Prospecção comercial; abre direto nela */
(() => { const st = document.createElement("style"); st.textContent = `nav.tabs button:not([data-go=prospeccao]){display:none!important}#kim-tour,#rpt-top{display:none!important}`; document.head.appendChild(st);
  const ir = () => { try{ if (typeof go === "function" && S.view !== "prospeccao" && document.querySelector("#v-prospeccao")) go("prospeccao"); }catch(e){} };
  [150, 600, 1500, 3000].forEach(t => setTimeout(ir, t)); })();
